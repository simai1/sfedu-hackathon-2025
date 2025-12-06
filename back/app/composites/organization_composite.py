from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.sqlalchemy.organization_repo import OrganizationRepo
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.service.organization_service import OrganizationService
from app.service.token_service import TokenService
from app.adapters.rest.v1.controllers.organization import OrganizationController
from app.core.db import get_async_session


def get_controller(
    session: AsyncSession = get_async_session(),
):
    org_repo = OrganizationRepo(session)
    user_repo = UserRepo(session)
    token_service = TokenService()
    service = OrganizationService(org_repo, user_repo, token_service)
    return OrganizationController(service)

