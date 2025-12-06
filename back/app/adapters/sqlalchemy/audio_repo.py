import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.audio import Audio, CreateAudio
from app.models.audio import AudioModel


class AudioRepo():
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, create_audio: CreateAudio) -> Audio:
        audio_model = AudioModel(**create_audio.model_dump())

        self.session.add(audio_model)
        await self.session.commit()
        await self.session.refresh(audio_model)

        return Audio(**audio_model.as_dict())

    async def get_one_by_id(self, id: uuid.UUID) -> Audio | None:
        audio_model = await self.session.get(AudioModel, id)
        if not audio_model:
            return None
        return Audio(**audio_model.as_dict())

    async def get_all(self) -> list[Audio]:
        stmt = select(AudioModel)
        result = await self.session.execute(stmt)
        audio_models = result.scalars().all()
        return [Audio(**audio.as_dict()) for audio in audio_models]

