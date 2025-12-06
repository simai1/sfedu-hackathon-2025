import uuid

from app.adapters.sqlalchemy.engagement_repo import EngagementRepo
from app.domains.engagement import CreateEngagement, Engagement


class EngagementService:
    def __init__(self, repo: EngagementRepo):
        self.repo = repo

    async def create(
        self,
        video_id: uuid.UUID,
        relaxation: float,
        concentration: float,
        screenshot_url: str,
        timecode: str | None = None,
    ) -> Engagement:
        create_engagement = CreateEngagement(
            video_id=video_id,
            relaxation=relaxation,
            concentration=concentration,
            screenshot_url=screenshot_url,
            timecode=timecode,
        )
        return await self.repo.create(create_engagement)
