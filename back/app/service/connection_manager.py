from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.device_sockets: dict[str, WebSocket] = {}        # user_id -> device ws
        self.client_sockets: dict[str, set[WebSocket]] = {}   # user_id -> set of client ws

    async def connect_device(self, user_id: str, websocket: WebSocket):
        self.device_sockets[user_id] = websocket

    async def connect_client(self, user_id: str, websocket: WebSocket):
        self.client_sockets.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, websocket: WebSocket):
        for uid, ws in list(self.device_sockets.items()):
            if ws is websocket:
                del self.device_sockets[uid]
        for uid, ws_set in list(self.client_sockets.items()):
            if websocket in ws_set:
                ws_set.remove(websocket)
                if not ws_set:
                    del self.client_sockets[uid]

    async def send_to_clients(self, user_id: str, message: dict):
        for ws in self.client_sockets.get(user_id, set()):
            await ws.send_json(message)
