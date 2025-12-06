import uuid

from pydantic import BaseModel


class Audio(BaseModel):
    id: uuid.UUID
    url: str


class CreateAudio(BaseModel):
    url: str

