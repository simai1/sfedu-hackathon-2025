import uuid

from app.adapters.sqlalchemy.engagement_repo import EngagementRepo
from app.domains.engagement import CreateEngagement, Engagement


class EngagementService:
    def __init__(self, repo: EngagementRepo):
        self.repo = repo

    async def create(
        self,
        video_id: uuid.UUID | None = None,
        audio_id: uuid.UUID | None = None,
        relaxation: float = 0.0,
        concentration: float = 0.0,
        screenshot_url: str | None = None,
        timecode: str | None = None,
    ) -> Engagement:
        create_engagement = CreateEngagement(
            video_id=video_id,
            audio_id=audio_id,
            relaxation=relaxation,
            concentration=concentration,
            screenshot_url=screenshot_url,
            timecode=timecode,
        )
        return await self.repo.create(create_engagement)
