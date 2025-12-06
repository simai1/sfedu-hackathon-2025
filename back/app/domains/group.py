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


class GroupWithMembers(Group):
    members: list[GroupMember]

