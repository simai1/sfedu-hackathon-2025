import uuid

from app.adapters.sqlalchemy.history_repo import HistoryRepo
from app.domains.history import HistoryRecord


class HistoryService:
    def __init__(self, repo: HistoryRepo):
        self.repo = repo

    async def save_entry(self, user_id: uuid.UUID, video_id: uuid.UUID, analysis: str) -> HistoryRecord:
        return await self.repo.create(user_id=user_id, video_id=video_id, analysis=analysis)

    async def get_all_by_user_id(self, user_id: uuid.UUID) -> list[HistoryRecord]:
        return await self.repo.get_all_by_user_id(user_id)
