import uuid
from pathlib import Path

from app.adapters.sqlalchemy.audio_repo import AudioRepo
from app.core.config import settings
from app.core.errors import NotFoundError
from app.domains.audio import Audio, CreateAudio


class AudioService():
    def __init__(self, repo: AudioRepo):
        self.repo = repo

    async def upload(self, filename: str | None, content: bytes) -> Audio:
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        suffix = Path(filename).suffix if filename else ""
        stored_name = f"{uuid.uuid4()}{suffix}"
        file_path = upload_dir / stored_name
        file_path.write_bytes(content)

        url = f"/uploads/{stored_name}"
        return await self.repo.create(CreateAudio(url=url))

    async def get_one(self, audio_id: uuid.UUID) -> Audio:
        audio = await self.repo.get_one_by_id(audio_id)
        if audio is None:
            raise NotFoundError("audio", "id", audio_id)
        return audio

    async def get_all(self) -> list[Audio]:
        return await self.repo.get_all()

