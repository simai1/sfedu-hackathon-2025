from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.sqlalchemy.engagement_repo import EngagementRepo
from app.core.db import get_session
from app.service.engagement_service import EngagementService
from app.service.engagement_tracker import EngagementTracker

engagement_tracker = EngagementTracker()


async def get_tracker():
    return engagement_tracker


async def get_repo(session: AsyncSession = Depends(get_session)):
    return EngagementRepo(session)


async def get_service(repo: EngagementRepo = Depends(get_repo)):
    return EngagementService(repo)
