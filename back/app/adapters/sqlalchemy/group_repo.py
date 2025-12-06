import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.group import Group, GroupMember, CreateGroup, GroupSession
from app.models.group import GroupModel, GroupMemberModel, GroupSessionModel
from app.models.user import UserModel
from app.models.video import VideoModel


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

    async def list_by_user(self, user_id: uuid.UUID) -> List[Group]:
        stmt = (
            select(GroupModel)
            .join(GroupMemberModel, GroupMemberModel.group_id == GroupModel.id)
            .where(GroupMemberModel.user_id == user_id)
        )
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

    async def add_session(self, group_id: uuid.UUID, video_id: uuid.UUID, video_name: str | None) -> GroupSession:
        # Ensure single session per group: delete previous sessions (and linked videos) first
        await self.delete_sessions(group_id)

        session_model = GroupSessionModel(
            group_id=group_id,
            video_id=video_id,
            video_name=video_name,
        )
        self.session.add(session_model)
        await self.session.commit()
        await self.session.refresh(session_model)
        video = await self.session.get(VideoModel, video_id)
        return GroupSession(
            id=session_model.id,
            group_id=group_id,
            video_id=video_id,
            video_name=video_name or (video.url if video else None),
            video_url=video.url if video else "",
            created_at=session_model.created_at,
        )

    async def list_sessions(self, group_id: uuid.UUID) -> list[GroupSession]:
        stmt = (
            select(GroupSessionModel, VideoModel)
            .join(VideoModel, VideoModel.id == GroupSessionModel.video_id)
            .where(GroupSessionModel.group_id == group_id)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        sessions: list[GroupSession] = []
        for session_model, video in rows:
            sessions.append(
                GroupSession(
                    id=session_model.id,
                    group_id=session_model.group_id,
                    video_id=session_model.video_id,
                    video_name=session_model.video_name or video.url,
                    video_url=video.url,
                    created_at=session_model.created_at,
                )
            )
        return sessions

    async def delete_sessions(self, group_id: uuid.UUID) -> None:
        # find existing sessions to remove videos as well
        stmt = select(GroupSessionModel).where(GroupSessionModel.group_id == group_id)
        result = await self.session.execute(stmt)
        existing = result.scalars().all()
        video_ids = [s.video_id for s in existing]

        # delete sessions
        await self.session.execute(
            GroupSessionModel.__table__.delete().where(GroupSessionModel.group_id == group_id)
        )

        # delete associated videos (files are not removed here)
        if video_ids:
            await self.session.execute(
                VideoModel.__table__.delete().where(VideoModel.id.in_(video_ids))
            )

        await self.session.commit()

