import uuid
import secrets

from app.adapters.sqlalchemy.organization_repo import OrganizationRepo
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.domains.organization import Organization, CreateOrganization, JoinOrganizationResponse, OrganizationMember
from app.domains.user import User
from app.service.token_service import TokenService


class OrganizationService:
    def __init__(self, org_repo: OrganizationRepo, user_repo: UserRepo, token_service: TokenService):
        self.org_repo = org_repo
        self.user_repo = user_repo
        self.token_service = token_service

    async def create(self, access_token: str, name: str, code: str | None = None) -> Organization:
        payload = self.token_service.validate_access_token(access_token)
        if payload.role != "ORGANIZATION":
            raise ValueError("Only organization role can create an organization")

        generated_code = code or secrets.token_hex(4).upper()
        return await self.org_repo.create(CreateOrganization(name=name, code=generated_code))

    async def join_by_code(self, access_token: str, code: str) -> JoinOrganizationResponse:
        payload = self.token_service.validate_access_token(access_token)
        user_id = uuid.UUID(payload.sub)

        organization = await self.org_repo.get_by_code(code)
        if not organization:
          raise ValueError("Organization code not found")

        user = await self.user_repo.set_organization(user_id, organization.id)
        if not user:
            raise ValueError("User not found")

        return JoinOrganizationResponse(
            organization_id=organization.id,
            organization_name=organization.name,
            code=organization.code,
        )

    async def list_members(self, access_token: str) -> list[OrganizationMember]:
        payload = self.token_service.validate_access_token(access_token)
        user = await self.user_repo.get_one_by_id(uuid.UUID(payload.sub))
        if not user:
            raise ValueError("User not found")
        if not user.organization_id:
            return []
        # exclude owner (role = organization) from member list
        members = await self.user_repo.list_by_organization(user.organization_id, include_owner=False)
        return [
            OrganizationMember(
                id=m.id,
                name=m.name,
                email=m.email,
                joined_at=m.updated_at,
            )
            for m in members
        ]

