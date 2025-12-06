import uuid

from pydantic import BaseModel


class Video(BaseModel):
    id: uuid.UUID
    url: str


class CreateVideo(BaseModel):
    url: str
