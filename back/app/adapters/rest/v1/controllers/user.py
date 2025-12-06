from app.service.user_service import UserService
from app.domains.user import UserProfile, UpdateUser


class UserController:
    def __init__(self, service: UserService):
        self.service = service

    async def get_self(self, access_token: str) -> UserProfile:
        return await self.service.get_self(access_token)

    async def update_self(self, access_token: str, update_user: UpdateUser) -> UserProfile:
        return await self.service.update_self(access_token, update_user)

