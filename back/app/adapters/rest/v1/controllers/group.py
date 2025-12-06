import uuid
from app.service.group_service import GroupService
from app.domains.group import Group, GroupWithMembers, CreateGroup, GroupMember


class GroupController:
    def __init__(self, service: GroupService):
        self.service = service

    async def create(self, access_token: str, data: CreateGroup) -> Group:
        return await self.service.create_group(access_token, data)

    async def list(self, access_token: str) -> list[GroupWithMembers]:
        return await self.service.list_groups(access_token)

    async def add_member(self, access_token: str, group_id: uuid.UUID, member_user_id: uuid.UUID) -> GroupMember:
        return await self.service.add_member(access_token, group_id, member_user_id)

