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

                # Получаем текущий таймкод аудио, если есть
                state = engagement_tracker.user_states.get(user_id)
                audio_timecode = state.current_audio_timecode if state else None

                frame = engagement_tracker.handle_sample(user_id, eeg_data, audio_timecode)
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
            elif msg_type == "audio_start":
                engagement_tracker.start_audio(user_id)
                logger.debug("Client WS: audio tracking started user_id=%s", user_id)
                await websocket.send_json({"type": "audio_tracking_started"})
            elif msg_type == "audio_end":
                engagement_tracker.end_audio(user_id)
                events = engagement_tracker.get_audio_events(user_id)
                logger.debug("Client WS: audio tracking ended user_id=%s events_count=%s", user_id, len(events))
                await websocket.send_json({"type": "audio_tracking_ended", "events": events})
            elif msg_type == "audio_timecode":
                timecode = message.get("timecode")
                audio_id_raw = message.get("audio_id")
                
                if timecode is not None:
                    # Сохраняем текущий таймкод для обработки в handle_sample
                    state = engagement_tracker.user_states.get(user_id)
                    if state and state.active_audio:
                        state.current_audio_timecode = float(timecode)
                        
                        # Сохраняем engagement для аудио
                        if audio_id_raw:
                            try:
                                audio_id = uuid.UUID(audio_id_raw)
                                # Получаем последние значения концентрации
                                if state.last_concentration is not None:
                                    # Получаем последние значения из последнего события или используем дефолтные
                                    last_event = state.concentration_events[-1] if state.concentration_events else None
                                    concentration = last_event["concentration"] if last_event else state.last_concentration
                                    relaxation = last_event["relaxation"] if last_event else 50.0
                                    
                                    engagement = await engagement_service.create(
                                        audio_id=audio_id,
                                        relaxation=relaxation,
                                        concentration=concentration,
                                        screenshot_url=None,
                                        timecode=str(timecode),
                                    )
                                    logger.debug(
                                        "Client WS: audio engagement saved user_id=%s audio_id=%s timecode=%s",
                                        user_id, audio_id, timecode
                                    )
                            except (ValueError, TypeError) as e:
                                logger.debug("Client WS: invalid audio_id user_id=%s error=%s", user_id, e)
                
                await websocket.send_json({"type": "audio_timecode_received"})
            elif msg_type == "video_frame":
                timecode_raw = message.get("timecode") or message.get("time_code")
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
                
                # Пытаемся найти pending_frame для получения точных значений EEG
                stored = engagement_tracker.attach_video_frame(
                    user_id, timecode, video_id, screenshot_url
                )
                
                if stored:
                    # Нашли pending_frame - используем точные значения из EEG
                    relaxation, concentration, timecode, video_id, screenshot_url = stored
                    logger.debug(
                        "Client WS: using EEG data from pending_frame user_id=%s timecode=%s relaxation=%s concentration=%s",
                        user_id, timecode, relaxation, concentration
                    )
                else:
                    # Нет pending_frame - используем последние известные значения или дефолтные
                    # Это нормально, если скриншот отправлен без запроса от бэка или timecode не совпадает
                    state = engagement_tracker.user_states.get(user_id)
                    if state and state.last_concentration is not None:
                        concentration = state.last_concentration
                        relaxation = 50.0  # Дефолтное значение релаксации
                        logger.debug(
                            "Client WS: using last known values user_id=%s timecode=%s concentration=%s",
                            user_id, timecode, concentration
                        )
                    else:
                        # Если нет состояния, используем дефолтные значения
                        concentration = 50.0
                        relaxation = 50.0
                        logger.debug(
                            "Client WS: using default values user_id=%s timecode=%s",
                            user_id, timecode
                        )
                
                # Всегда сохраняем engagement в БД
                engagement = await engagement_service.create(
                    video_id=video_id,
                    relaxation=relaxation,
                    concentration=concentration,
                    screenshot_url=screenshot_url,
                    timecode=timecode,
                )
                logger.debug(
                    "Client WS: engagement saved to DB user_id=%s video_id=%s timecode=%s screenshot_url=%s",
                    user_id, video_id, timecode, screenshot_url
                )
                await websocket.send_json({
                    "type": "engagement_saved",
                    "engagement": engagement.model_dump(),
                })
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
