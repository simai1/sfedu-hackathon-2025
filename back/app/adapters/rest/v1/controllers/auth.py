from app.service.user_service import UserService
from app.domains.user import CreateUser, ValidateUser
from app.domains.auth import AuthUser

class AuthController:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def register(self, create_user: CreateUser) -> AuthUser:
        auth_user = await self.user_service.register(create_user)
        return auth_user

    async def login(self, validate_user: ValidateUser) -> AuthUser:
        auth_user = await self.user_service.validate(validate_user)
        return auth_user