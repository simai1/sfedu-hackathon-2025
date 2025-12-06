from app.service.organization_service import OrganizationService
from app.domains.organization import Organization, JoinOrganizationResponse
from app.domains.user import User


class OrganizationController:
    def __init__(self, service: OrganizationService):
        self.service = service

    async def create(self, access_token: str, name: str, code: str | None = None) -> Organization:
        return await self.service.create(access_token, name, code)

    async def join(self, access_token: str, code: str) -> JoinOrganizationResponse:
        return await self.service.join_by_code(access_token, code)

    async def members(self, access_token: str) -> list[User]:
        return await self.service.list_members(access_token)

