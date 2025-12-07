import datetime
import uuid

from pydantic import BaseModel


class HistoryRecord(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    video_id: uuid.UUID
    analysis: str
    created_at: datetime.datetime

class CreateHistory(BaseModel):
    user_id: uuid.UUID
    video_id: uuid.UUID
    analysis: str