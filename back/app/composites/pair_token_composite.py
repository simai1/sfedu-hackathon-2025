from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_session
from app.adapters.sqlalchemy.pair_token_repo import PairTokenRepo
from app.adapters.rest.v1.controllers.pair_token import PairTokenController
from app.service.pair_token_service import PairTokenService
from app.composites.token_composite import get_service as get_token_service
from app.service.token_service import TokenService

async def get_repo(session: AsyncSession = Depends(get_session)):
    return PairTokenRepo(session)


async def get_service(repo: PairTokenRepo = Depends(get_repo), token_service: TokenService = Depends(get_token_service)):
    return PairTokenService(repo, token_service)

async def get_controller(service: PairTokenService = Depends(get_service)):
    return PairTokenController(service)