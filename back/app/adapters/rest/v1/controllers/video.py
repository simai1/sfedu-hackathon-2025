import uuid

from app.domains.video import Video
from app.service.video_service import VideoService


class VideoController:
    def __init__(self, video_service: VideoService):
        self.video_service = video_service

    async def upload(self, filename: str | None, content: bytes) -> Video:
        return await self.video_service.upload(filename, content)

    async def get_one(self, video_id: uuid.UUID) -> Video:
        return await self.video_service.get_one(video_id)

    async def get_all(self) -> list[Video]:
        return await self.video_service.get_all()
