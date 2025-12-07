import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.engagement import CreateEngagement, Engagement
from app.models.engagement import EngagementModel


class EngagementRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, create_engagement: CreateEngagement) -> Engagement:
        engagement_model = EngagementModel(**create_engagement.model_dump())

        self.session.add(engagement_model)
        await self.session.commit()
        await self.session.refresh(engagement_model)

        return Engagement(**engagement_model.as_dict())

    async def get_all_by_video_id(self, video_id: uuid.UUID) -> list[Engagement]:
        stmt = select(EngagementModel).where(EngagementModel.video_id == video_id)

        result = await self.session.execute(statement=stmt)
        engagement_models = result.scalars().all()

        return [Engagement(**eeg.as_dict()) for eeg in engagement_models]