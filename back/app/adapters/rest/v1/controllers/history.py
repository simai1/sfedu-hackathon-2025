import uuid
from app.service.history_service import HistoryService
from app.service.token_service import TokenService

class HistoryController:
    def __init__(self, history_service: HistoryService, token_service: TokenService):
        self.history_service = history_service
        self.token_service = token_service

    async def get_all_by_user_id(self, token: str):
        payload = self.token_service.validate_access_token(token)
        user_id = uuid.UUID(payload.sub)

        return await self.history_service.get_all_by_user_id(user_id)