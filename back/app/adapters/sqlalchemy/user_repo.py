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
