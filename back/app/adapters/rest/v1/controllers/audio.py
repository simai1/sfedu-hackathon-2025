import uuid

from app.domains.audio import Audio
from app.service.audio_service import AudioService


class AudioController:
    def __init__(self, audio_service: AudioService):
        self.audio_service = audio_service

    async def upload(self, filename: str | None, content: bytes) -> Audio:
        return await self.audio_service.upload(filename, content)

    async def get_one(self, audio_id: uuid.UUID) -> Audio:
        return await self.audio_service.get_one(audio_id)

    async def get_all(self) -> list[Audio]:
        return await self.audio_service.get_all()

