from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.adapters.sqlalchemy.user_repo import UserRepo
from app.core.db import get_session
from app.service.user_service import UserService
from app.composites.token_composite import get_service as get_token_service

async def get_repo(session: AsyncSession = Depends(get_session)):
    return UserRepo(session)


async def get_service(repo: UserRepo = Depends(get_repo), token_service = Depends(get_token_service)):
    return UserService(repo, token_service)
