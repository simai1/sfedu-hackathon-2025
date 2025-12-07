import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.history import HistoryRecord
from app.models.history import HistoryModel


class HistoryRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: uuid.UUID, video_id: uuid.UUID, analysis: str) -> HistoryRecord:
        history_model = HistoryModel(
            user_id=user_id,
            video_id=video_id,
            analysis=analysis,
        )
        self.session.add(history_model)
        await self.session.commit()
        await self.session.refresh(history_model)
        return HistoryRecord(**history_model.as_dict())

    async def get_all_by_user_id(self, user_id: uuid.UUID) -> list[HistoryRecord]:
        stmt = select(HistoryModel).where(HistoryModel.user_id == user_id).order_by(HistoryModel.created_at.desc())

        result = await self.session.execute(statement=stmt)
        history_models = result.scalars().all()
        
        return [HistoryModel(**h.as_dict()) for h in history_models]