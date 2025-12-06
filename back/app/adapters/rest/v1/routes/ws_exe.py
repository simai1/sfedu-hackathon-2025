import uuid
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.composites.pair_token_composite import get_controller as get_token_controller
from app.adapters.rest.v1.controllers.pair_token import PairTokenController
from app.composites.connection_manager_composite import get_service as get_cm_service
from app.service.connection_manager import ConnectionManager
from app.composites.token_composite import get_service as get_token_service
from app.service.token_service import TokenService
from app.composites.engagement_composite import (
    get_service as get_engagement_service,
    get_tracker as get_engagement_tracker,
)
from app.service.engagement_service import EngagementService
from app.service.engagement_tracker import EngagementTracker
from app.core.logger import logger

router = APIRouter()

@router.websocket("/ws/device")
async def device_ws(
    websocket: WebSocket,
    controller: PairTokenController = Depends(get_token_controller),
    manager: ConnectionManager = Depends(get_cm_service),
    engagement_tracker: EngagementTracker = Depends(get_engagement_tracker),
):
    logger.debug("Device WS: connection opened from %s", websocket.client)
    await websocket.accept()

    try:
        first = await websocket.receive_json()
        if first.get("type") != "pair":
            logger.debug("Device WS: first message not pair -> closing, payload=%s", first)
            await websocket.close(code=4000)
            return
        # {
        #   "type": "paired",
        #   "pair_token": "553f6cef-cf9e-4ad6-90ba-f75aaccf4b57"
        # }
        pair_token = first.get("pair_token")
        pair_token_data = await controller.validate(pair_token)

        if pair_token_data is None:
            logger.debug("Device WS: invalid pair token received")
            raise Exception("Invalid pair")

        user_id = str(pair_token_data.user_id)

        await manager.connect_device(user_id, websocket)
        logger.debug("Device WS: paired user_id=%s", user_id)
        await websocket.send_json({"type": "paired", "user_id": user_id})

        while True:
            data = await websocket.receive_json()
            logger.debug("Device WS: received raw data for user_id=%s payload=%s", user_id, data)
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    logger.debug("Device WS: invalid json payload from user_id=%s", user_id)
                    await websocket.send_json({"type": "error", "message": "invalid json payload"})
                    continue
            if not isinstance(data, dict):
                logger.debug("Device WS: non-dict payload from user_id=%s", user_id)
                await websocket.send_json({"type": "error", "message": "invalid payload"})
                continue

            msg_type = data.get("type")
            logger.debug("Device WS: message type=%s user_id=%s", msg_type, user_id)

            if msg_type == "eeg_sample":
                eeg_data = data.get("data")
                if not isinstance(eeg_data, dict):
                    logger.debug("Device WS: missing eeg data user_id=%s payload=%s", user_id, data)
                    await websocket.send_json({"type": "error", "message": "missing eeg data"})
                    continue

                await manager.send_to_clients(user_id, {
                    "type": "eeg_sample",
                    "data": eeg_data
                })
                logger.debug("Device WS: forwarded eeg_sample to clients user_id=%s", user_id)

                frame = engagement_tracker.handle_sample(user_id, eeg_data)
                if frame:
                    logger.debug(
                        "Device WS: engagement frame detected user_id=%s timecode=%s",
                        user_id, frame.timecode
                    )
                    await manager.send_to_clients(user_id, {
                        "type": "request_screenshot",
                        "timecode": frame.timecode,
                    })

    except WebSocketDisconnect:
        logger.debug("Device WS: disconnect for user_id=%s", locals().get("user_id"))
        await manager.disconnect(websocket)
    except Exception:
        logger.exception("Device WS: unexpected error for user_id=%s", locals().get("user_id"))
        await manager.disconnect(websocket)
        await websocket.close(code=1011)


@router.websocket("/ws/client")
async def client_ws(
    websocket: WebSocket,
    token_service: TokenService = Depends(get_token_service),
    manager: ConnectionManager = Depends(get_cm_service),
    engagement_tracker: EngagementTracker = Depends(get_engagement_tracker),
    engagement_service: EngagementService = Depends(get_engagement_service),
):
    logger.debug("Client WS: connection opened from %s", websocket.client)
    await websocket.accept()

    try:
        token = websocket.query_params.get("token")
        if not token:
            logger.debug("Client WS: missing token, closing")
            await websocket.close(code=4401)
            return

        payload = token_service.validate_access_token(token)
        user_id = payload.sub

        await manager.connect_client(user_id, websocket)
        logger.debug("Client WS: connected user_id=%s", user_id)
        await websocket.send_json({"type": "connected", "user_id": user_id})

        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type")
            logger.debug("Client WS: received message type=%s user_id=%s payload=%s", msg_type, user_id, message)

            if msg_type == "video_start":
                engagement_tracker.start_video(user_id)
                logger.debug("Client WS: video tracking started user_id=%s", user_id)
                await websocket.send_json({"type": "video_tracking_started"})
            elif msg_type == "video_end":
                engagement_tracker.end_video(user_id)
                logger.debug("Client WS: video tracking ended user_id=%s", user_id)
                await websocket.send_json({"type": "video_tracking_ended"})
            elif msg_type == "video_frame":
                timecode_raw = message.get("timecode")
                video_id_raw = message.get("video_id")
                screenshot_url = message.get("screenshot_url")

                if timecode_raw is None or not video_id_raw or not screenshot_url:
                    logger.debug(
                        "Client WS: video_frame missing fields user_id=%s payload=%s",
                        user_id, message
                    )
                    await websocket.send_json({"type": "error", "message": "video_frame missing fields"})
                    continue

                timecode = str(timecode_raw)
                video_id = uuid.UUID(video_id_raw)
                stored = engagement_tracker.attach_video_frame(
                    user_id, timecode, video_id, screenshot_url
                )
                if stored:
                    relaxation, concentration, timecode, video_id, screenshot_url = stored
                    engagement = await engagement_service.create(
                        video_id=video_id,
                        relaxation=relaxation,
                        concentration=concentration,
                        screenshot_url=screenshot_url,
                        timecode=timecode,
                    )
                    logger.debug(
                        "Client WS: engagement saved user_id=%s video_id=%s timecode=%s",
                        user_id, video_id, timecode
                    )
                    await websocket.send_json({
                        "type": "engagement_saved",
                        "engagement": engagement.model_dump(),
                    })
                else:
                    logger.debug(
                        "Client WS: timecode not pending user_id=%s timecode=%s",
                        user_id, timecode
                    )
                    await websocket.send_json({"type": "error", "message": "timecode not pending"})
            else:
                logger.debug("Client WS: unknown message type user_id=%s payload=%s", user_id, message)
                await websocket.send_json({"type": "error", "message": "unknown message type"})

    except WebSocketDisconnect:
        logger.debug("Client WS: disconnect for user_id=%s", locals().get("user_id"))
        await manager.disconnect(websocket)
    except ValueError:
        logger.debug("Client WS: invalid token for user_id=%s", locals().get("user_id"))
        await manager.disconnect(websocket)
        await websocket.close(code=4401)
    except Exception:
        logger.exception("Client WS: unexpected error for user_id=%s", locals().get("user_id"))
        await manager.disconnect(websocket)
        await websocket.close(code=1011)
