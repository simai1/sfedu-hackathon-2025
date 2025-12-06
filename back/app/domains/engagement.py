import uuid

from pydantic import BaseModel


class Engagement(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID | None = None
    audio_id: uuid.UUID | None = None
    relaxation: float
    concentration: float
    screenshot_url: str | None = None
    timecode: str | None = None


class CreateEngagement(BaseModel):
    video_id: uuid.UUID | None = None
    audio_id: uuid.UUID | None = None
    relaxation: float
    concentration: float
    screenshot_url: str | None = None
    timecode: str | None = None
