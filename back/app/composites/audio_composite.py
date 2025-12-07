from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.rest.v1.controllers.audio import AudioController
from app.adapters.sqlalchemy.audio_repo import AudioRepo
from app.core.db import get_session
from app.service.audio_service import AudioService


async def get_repo(session: AsyncSession = Depends(get_session)):
    return AudioRepo(session)


async def get_service(repo: AudioRepo = Depends(get_repo)):
    return AudioService(repo)


async def get_controller(service: AudioService = Depends(get_service)):
    return AudioController(service)

