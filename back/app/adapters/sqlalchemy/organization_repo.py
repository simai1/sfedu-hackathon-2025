import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.organization import Organization, CreateOrganization
from app.domains.user import User
from app.models.organization import OrganizationModel
from app.models.user import UserModel


class OrganizationRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: CreateOrganization) -> Organization:
        model = OrganizationModel(
            name=data.name,
            code=data.code,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return Organization(**model.as_dict())

    async def get_by_code(self, code: str) -> Organization | None:
        stmt = select(OrganizationModel).where(OrganizationModel.code == code)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return None
        return Organization(**model.as_dict())

    async def get_by_id(self, org_id: uuid.UUID) -> Organization | None:
        model = await self.session.get(OrganizationModel, org_id)
        if not model:
            return None
        return Organization(**model.as_dict())

    async def list_members(self, org_id: uuid.UUID) -> List[User]:
        stmt = select(UserModel).where(UserModel.organization_id == org_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [
            User.from_sql({
                **m.as_dict(),
            })
            for m in models
        ]

