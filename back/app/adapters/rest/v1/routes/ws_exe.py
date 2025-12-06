from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.composites.pair_token_composite import get_controller as get_token_controller
from app.adapters.rest.v1.controllers.pair_token import PairTokenController
from app.composites.connection_manager_composite import get_service as get_cm_service
from app.service.connection_manager import ConnectionManager
from app.composites.token_composite import get_service as get_token_service
from app.service.token_service import TokenService

router = APIRouter()

@router.websocket("/ws/device")
async def device_ws(
    websocket: WebSocket,
    controller: PairTokenController = Depends(get_token_controller),
    manager: ConnectionManager = Depends(get_cm_service)
):
    await websocket.accept()

    try:
        first = await websocket.receive_json()
        if first.get("type") != "pair":
            await websocket.close(code=4000)
            return
        # {
        #   "type": "paired",
        #   "pair_token": "553f6cef-cf9e-4ad6-90ba-f75aaccf4b57"
        # }
        pair_token = first.get("pair_token")
        pair_token_data = await controller.validate(pair_token)

        if pair_token_data is None:
            raise Exception("Invalid pair")

        user_id = str(pair_token_data.user_id)

        await manager.connect_device(user_id, websocket)
        await websocket.send_json({"type": "paired", "user_id": user_id})

        while True:
            data = await websocket.receive_json()

            if data.get("type") == "eeg_sample":
                await manager.send_to_clients(user_id, {
                    "data": data.get("data")
                })
                print(data.get("data"))

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
        await websocket.close(code=1011)


@router.websocket("/ws/client")
async def client_ws(
    websocket: WebSocket,
    token_service: TokenService = Depends(get_token_service),
    manager: ConnectionManager = Depends(get_cm_service),
):
    await websocket.accept()

    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4401)
            return

        payload = token_service.validate_access_token(token)
        user_id = payload.sub

        await manager.connect_client(user_id, websocket)
        await websocket.send_json({"type": "connected", "user_id": user_id})

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except ValueError:
        await manager.disconnect(websocket)
        await websocket.close(code=4401)
    except Exception:
        await manager.disconnect(websocket)
        await websocket.close(code=1011)
