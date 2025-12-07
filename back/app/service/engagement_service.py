import uuid

from app.adapters.sqlalchemy.engagement_repo import EngagementRepo
from app.domains.engagement import CreateEngagement, Engagement


class EngagementService:
    def __init__(self, repo: EngagementRepo):
        self.repo = repo

    async def create(
        self,
        user_id: uuid.UUID | None,
        video_id: uuid.UUID,
        relaxation: float | None,
        concentration: float,
        screenshot_url: str,
        timecode: str | None = None,
    ) -> Engagement:
        create_engagement = CreateEngagement(
            user_id=user_id,
            video_id=video_id,
            relaxation=relaxation,
            concentration=concentration,
            screenshot_url=screenshot_url,
            timecode=timecode,
        )
        return await self.repo.create(create_engagement)

    async def list_by_video(self, video_id: uuid.UUID) -> list[Engagement]:
        return await self.repo.get_all_by_video_id(video_id)