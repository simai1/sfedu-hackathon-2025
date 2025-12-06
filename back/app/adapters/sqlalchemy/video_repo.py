import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.video import CreateVideo, Video
from app.models.video import VideoModel


class VideoRepo():
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, create_video: CreateVideo) -> Video:
        video_model = VideoModel(**create_video.model_dump())

        self.session.add(video_model)
        await self.session.commit()
        await self.session.refresh(video_model)

        return Video(**video_model.as_dict())

    async def get_one_by_id(self, id: uuid.UUID) -> Video | None:
        video_model = await self.session.get(VideoModel, id)
        if not video_model:
            return None
        return Video(**video_model.as_dict())

    async def get_all(self) -> list[Video]:
        stmt = select(VideoModel)
        result = await self.session.execute(stmt)
        video_models = result.scalars().all()
        return [Video(**video.as_dict()) for video in video_models]
