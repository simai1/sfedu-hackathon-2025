import uuid

from pydantic import BaseModel


class Engagement(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    relaxation: float
    concentration: float
    screenshot_url: str
    timecode: str | None = None


class CreateEngagement(BaseModel):
    video_id: uuid.UUID
    relaxation: float
    concentration: float
    screenshot_url: str
    timecode: str | None = None
