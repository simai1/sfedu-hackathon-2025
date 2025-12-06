import uuid

from app.adapters.sqlalchemy.group_repo import GroupRepo
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.domains.group import Group, GroupMember, GroupWithMembers, CreateGroup, GroupSession
from app.service.token_service import TokenService
from app.service.video_service import VideoService
from app.core.errors import NotFoundError, InvalidDataError


class GroupService:
    def __init__(self, group_repo: GroupRepo, user_repo: UserRepo, video_service: VideoService, token_service: TokenService):
        self.group_repo = group_repo
        self.user_repo = user_repo
        self.video_service = video_service
        self.token_service = token_service

    async def _get_org_user(self, access_token: str):
        payload = self.token_service.validate_access_token(access_token)
        user = await self.user_repo.get_one_by_id(uuid.UUID(payload.sub))
        if not user:
            raise NotFoundError("user", "id", payload.sub)
        if user.role != "organization":
            raise InvalidDataError("user", "role", user.role)
        if not user.organization_id:
            raise InvalidDataError("user", "organization_id", "None")
        return user

    async def create_group(self, access_token: str, data: CreateGroup) -> Group:
        org_user = await self._get_org_user(access_token)
        return await self.group_repo.create(org_user.organization_id, data)

    async def list_groups(self, access_token: str) -> list[GroupWithMembers]:
        org_user = await self._get_org_user(access_token)
        groups = await self.group_repo.list_by_organization(org_user.organization_id)
        result: list[GroupWithMembers] = []
        for g in groups:
            members = await self.group_repo.get_members(g.id)
            sessions = await self.group_repo.list_sessions(g.id)
            result.append(
                GroupWithMembers(
                    **g.model_dump(),
                    members=members,
                    sessions=sessions,
                )
            )
        return result

    async def add_member(self, access_token: str, group_id: uuid.UUID, member_user_id: uuid.UUID) -> GroupMember:
        org_user = await self._get_org_user(access_token)
        target_user = await self.user_repo.get_one_by_id(member_user_id)
        if not target_user:
            raise NotFoundError("user", "id", str(member_user_id))
        if target_user.organization_id != org_user.organization_id:
            raise InvalidDataError("user", "organization_id", str(target_user.organization_id))

        groups = await self.group_repo.list_by_organization(org_user.organization_id)
        if not any(g.id == group_id for g in groups):
            raise InvalidDataError("group", "organization_id", "mismatch")

        return await self.group_repo.add_member(group_id, member_user_id)

    async def add_session(self, access_token: str, group_id: uuid.UUID, filename: str | None, content: bytes) -> GroupSession:
        org_user = await self._get_org_user(access_token)
        groups = await self.group_repo.list_by_organization(org_user.organization_id)
        if not any(g.id == group_id for g in groups):
            raise InvalidDataError("group", "organization_id", "mismatch")
        video = await self.video_service.upload(filename, content)
        return await self.group_repo.add_session(group_id, video.id, filename)

