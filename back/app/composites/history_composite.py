from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.sqlalchemy.history_repo import HistoryRepo
from app.core.db import get_session
from app.service.history_service import HistoryService
from app.adapters.rest.v1.controllers.history import HistoryController
from app.service.token_service import TokenService
from app.composites.token_composite import get_service as get_token_service


async def get_repo(session: AsyncSession = Depends(get_session)):
    return HistoryRepo(session)


async def get_service(repo: HistoryRepo = Depends(get_repo)):
    return HistoryService(repo)

async def get_controller(
    history_service: HistoryService = Depends(get_service),
    token_service: TokenService = Depends(get_token_service),
    ):
    return HistoryController(history_service, token_service)