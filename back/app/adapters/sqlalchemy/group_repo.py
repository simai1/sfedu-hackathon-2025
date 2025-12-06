import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.group import Group, GroupMember, CreateGroup
from app.models.group import GroupModel, GroupMemberModel
from app.models.user import UserModel


class GroupRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, organization_id: uuid.UUID, data: CreateGroup) -> Group:
        model = GroupModel(
            organization_id=organization_id,
            name=data.name,
            description=data.description,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return Group(**model.as_dict())

    async def list_by_organization(self, organization_id: uuid.UUID) -> List[Group]:
        stmt = select(GroupModel).where(GroupModel.organization_id == organization_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [Group(**m.as_dict()) for m in models]

    async def add_member(self, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupMember:
        membership = GroupMemberModel(group_id=group_id, user_id=user_id)
        self.session.add(membership)
        await self.session.commit()
        await self.session.refresh(membership)
        # fetch user for name/email
        user = await self.session.get(UserModel, user_id)
        return GroupMember(
            id=user_id,
            name=user.name,
            email=user.email,
            joined_at=membership.joined_at,
        )

    async def get_members(self, group_id: uuid.UUID) -> List[GroupMember]:
        stmt = (
            select(UserModel, GroupMemberModel.joined_at)
            .join(GroupMemberModel, GroupMemberModel.user_id == UserModel.id)
            .where(GroupMemberModel.group_id == group_id)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        members: List[GroupMember] = []
        for user_model, joined_at in rows:
            members.append(
                GroupMember(
                    id=user_model.id,
                    name=user_model.name,
                    email=user_model.email,
                    joined_at=joined_at,
                )
            )
        return members

