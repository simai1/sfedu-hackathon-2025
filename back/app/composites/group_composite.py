from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.sqlalchemy.group_repo import GroupRepo
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.core.db import get_session
from app.service.group_service import GroupService
from app.adapters.rest.v1.controllers.group import GroupController
from app.composites.token_composite import get_service as get_token_service


async def get_group_repo(session: AsyncSession = Depends(get_session)):
    return GroupRepo(session)


async def get_user_repo(session: AsyncSession = Depends(get_session)):
    return UserRepo(session)


async def get_service(
    group_repo: GroupRepo = Depends(get_group_repo),
    user_repo: UserRepo = Depends(get_user_repo),
    token_service = Depends(get_token_service),
):
    return GroupService(group_repo, user_repo, token_service)


async def get_controller(
    service: GroupService = Depends(get_service),
):
    return GroupController(service)

