import uuid

from app.domains.user import CreateUser, User, ValidateUser
from app.utils.hash import verify
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.service.token_service import TokenService
from app.core.errors import NotFoundError
from app.domains.auth import AuthUser
from app.core.errors import InvalidDataError

class UserService():
    def __init__(self, repo: UserRepo, token_service: TokenService):
        self.repo = repo
        self.token_service = token_service

    async def register(self, create_user: CreateUser) -> AuthUser:
        user = await self.repo.create(create_user)
        token = self.token_service.generate_access_token(user)
        return AuthUser(
            id=user.id,
            name=user.name,
            email=user.email,
            token=token,
            )

    async def validate(self, validate_user: ValidateUser) -> AuthUser:
        user = await self.repo.get_one_by_email(validate_user.email)
        if user is None:
            raise NotFoundError("user", "email", validate_user.email)
        if not verify(validate_user.password, user.password_hash):
            raise InvalidDataError("user", "email or password", (validate_user.email, validate_user.password))
        token = self.token_service.generate_access_token(user)
        return AuthUser(
            id=user.id,
            name=user.name,
            email=user.email,
            token=token,
            )

    async def get_one_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.repo.get_one_by_id(user_id)
