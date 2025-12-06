import uuid

from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.user import User, CreateUser
from app.models.user import UserModel
from app.utils.hash import hash


class UserRepo():
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, create_user: CreateUser) -> User:
        user_model = UserModel(
            password_hash=hash(create_user.password),
            **create_user.model_dump(exclude={"password"}),
        )

        self.session.add(user_model)
        await self.session.commit()
        await self.session.refresh(user_model)

        return User(**user_model.as_dict())

    async def get_one_by_id(self, id: uuid.UUID) -> User | None:
        user_model = await self.session.get(UserModel, id)
        if not user_model:
            return None
        else:
            return User(**user_model.as_dict())

    async def get_one_by_email(self, email: EmailStr) -> User | None:
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self.session.execute(stmt)

        user_model = result.scalar_one_or_none()

        if user_model is not None:
            return User(**user_model.as_dict())
        else:
            return None

    async def set_organization(self, user_id: uuid.UUID, organization_id: uuid.UUID) -> User | None:
        user_model = await self.session.get(UserModel, user_id)
        if not user_model:
            return None
        user_model.organization_id = organization_id
        await self.session.commit()
        await self.session.refresh(user_model)
        return User(**user_model.as_dict())

    async def list_by_organization(self, organization_id: uuid.UUID, *, include_owner: bool = False) -> list[User]:
        stmt = select(UserModel).where(UserModel.organization_id == organization_id)
        if not include_owner:
            stmt = stmt.where(UserModel.role != "organization")
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [User(**m.as_dict()) for m in models]

    async def update_fields(self, user_id: uuid.UUID, *, name: str | None = None, email: str | None = None) -> User | None:
        user_model = await self.session.get(UserModel, user_id)
        if not user_model:
            return None
        if name is not None:
            user_model.name = name
        if email is not None:
            user_model.email = email
        await self.session.commit()
        await self.session.refresh(user_model)
        return User(**user_model.as_dict())
