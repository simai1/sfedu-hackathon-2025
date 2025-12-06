import secrets
import uuid

from app.adapters.sqlalchemy.organization_repo import OrganizationRepo
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.core.errors import AlreadyUserError, InvalidDataError, NotFoundError
from app.domains.auth import AuthUser
from app.domains.organization import CreateOrganization
from app.domains.user import CreateUser, UpdateUser, User, UserProfile, ValidateUser
from app.service.token_service import TokenService
from app.utils.hash import verify

class UserService():
    def __init__(self, repo: UserRepo, org_repo: OrganizationRepo, token_service: TokenService):
        self.repo = repo
        self.org_repo = org_repo
        self.token_service = token_service

    async def _build_profile(self, user: User) -> UserProfile:
        organization = None
        if user.organization_id:
            organization = await self.org_repo.get_by_id(user.organization_id)
        return UserProfile(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            organization_code=organization.code if organization else None,
            organization_name=organization.name if organization else None,
        )

    async def register(self, create_user: CreateUser) -> AuthUser:
        existing_user = await self.repo.get_one_by_email(create_user.email)
        if existing_user:
            raise AlreadyUserError("email")

        user = await self.repo.create(create_user)
        role = (user.role or "user").lower()
        if role != user.role:
            user = User(
                id=user.id,
                name=user.name,
                email=user.email,
                role=role,
                password_hash=user.password_hash,
                organization_id=user.organization_id,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )

        organization = None
        # Для организаций создаем запись и код сразу при регистрации
        if role == "organization" and not user.organization_id:
            generated_code = secrets.token_hex(4).upper()
            organization = await self.org_repo.create(
                CreateOrganization(
                    name=user.name,
                    code=generated_code,
                )
            )
            # Привяжем пользователя к организации
            updated_user = await self.repo.set_organization(user.id, organization.id)
            if updated_user:
                user = updated_user
        elif user.organization_id:
            organization = await self.org_repo.get_by_id(user.organization_id)

        token = self.token_service.generate_access_token(user)
        profile = await self._build_profile(user)

        return AuthUser(
            id=profile.id,
            name=profile.name,
            email=profile.email,
            role=profile.role,
            token=token,
            organization_code=profile.organization_code,
            organization_name=profile.organization_name,
        )
        profile = await self._build_profile(user)

        return AuthUser(
            id=profile.id,
            name=profile.name,
            email=profile.email,
            role=profile.role,
            token=token,
            organization_code=profile.organization_code,
            organization_name=profile.organization_name,
        )

    async def get_self(self, access_token: str) -> UserProfile:
        payload = self.token_service.validate_access_token(access_token)
        user = await self.repo.get_one_by_id(uuid.UUID(payload.sub))
        if not user:
            raise NotFoundError("user", "id", payload.sub)
        return await self._build_profile(user)

    async def update_self(self, access_token: str, update_user: UpdateUser) -> UserProfile:
        payload = self.token_service.validate_access_token(access_token)
        user = await self.repo.update_fields(
            uuid.UUID(payload.sub),
            name=update_user.name,
            email=update_user.email,
        )
        if not user:
            raise NotFoundError("user", "id", payload.sub)
        return await self._build_profile(user)

    async def validate(self, validate_user: ValidateUser) -> AuthUser:
        user = await self.repo.get_one_by_email(validate_user.email)
        if user is None:
            raise NotFoundError("user", "email", validate_user.email)
        if not verify(validate_user.password, user.password_hash):
            raise InvalidDataError("user", "email or password", (validate_user.email, validate_user.password))
        role = user.role or "user"
        if role != user.role:
            user = User(
                id=user.id,
                name=user.name,
                email=user.email,
                role=role,
                password_hash=user.password_hash,
                organization_id=user.organization_id,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
        token = self.token_service.generate_access_token(user)

        organization = None
        if user.organization_id:
            organization = await self.org_repo.get_by_id(user.organization_id)

        return AuthUser(
            id=user.id,
            name=user.name,
            email=user.email,
            role=role,
            token=token,
            organization_code=organization.code if organization else None,
            organization_name=organization.name if organization else None,
        )

    async def get_one_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.repo.get_one_by_id(user_id)
