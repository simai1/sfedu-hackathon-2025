import uuid
import datetime
from pydantic import BaseModel


class Group(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    organization_id: uuid.UUID
    created_at: datetime.datetime


class CreateGroup(BaseModel):
    name: str
    description: str | None = None


class GroupMember(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    joined_at: datetime.datetime


class GroupSession(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    video_id: uuid.UUID
    video_url: str
    video_name: str | None = None
    created_at: datetime.datetime


class GroupWithMembers(Group):
    members: list[GroupMember]
    sessions: list[GroupSession] = []

