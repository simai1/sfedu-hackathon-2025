import uuid
from pathlib import Path

from app.adapters.sqlalchemy.video_repo import VideoRepo
from app.core.config import settings
from app.core.errors import NotFoundError
from app.domains.video import CreateVideo, Video


class VideoService():
    def __init__(self, repo: VideoRepo):
        self.repo = repo

    async def upload(self, filename: str | None, content: bytes) -> Video:
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        suffix = Path(filename).suffix if filename else ""
        stored_name = f"{uuid.uuid4()}{suffix}"
        file_path = upload_dir / stored_name
        file_path.write_bytes(content)

        url = f"/uploads/{stored_name}"
        return await self.repo.create(CreateVideo(url=url))

    async def get_one(self, video_id: uuid.UUID) -> Video:
        video = await self.repo.get_one_by_id(video_id)
        if video is None:
            raise NotFoundError("video", "id", video_id)
        return video

    async def get_all(self) -> list[Video]:
        return await self.repo.get_all()
