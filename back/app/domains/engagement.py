import uuid

from pydantic import BaseModel


class Engagement(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    relaxation: float
    concentration: float
    screenshot_url: str


class CreateEngagement(BaseModel):
    video_id: uuid.UUID
    relaxation: float | None
    concentration: float
    screenshot_url: str
