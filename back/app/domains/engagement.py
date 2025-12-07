import uuid

from pydantic import BaseModel


class Engagement(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    video_id: uuid.UUID
    relaxation: float
    concentration: float
    screenshot_url: str
    timecode: str | None = None


class CreateEngagement(BaseModel):
    user_id: uuid.UUID | None = None
    video_id: uuid.UUID
    relaxation: float | None
    concentration: float
    screenshot_url: str
    timecode: str | None = None
