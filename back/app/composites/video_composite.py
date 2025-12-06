from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.rest.v1.controllers.video import VideoController
from app.adapters.sqlalchemy.video_repo import VideoRepo
from app.core.db import get_session
from app.service.video_service import VideoService


async def get_repo(session: AsyncSession = Depends(get_session)):
    return VideoRepo(session)


async def get_service(repo: VideoRepo = Depends(get_repo)):
    return VideoService(repo)


async def get_controller(service: VideoService = Depends(get_service)):
    return VideoController(service)
