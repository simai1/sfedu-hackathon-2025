import uuid
import datetime
from pydantic import BaseModel


class Organization(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    created_at: datetime.datetime


class CreateOrganization(BaseModel):
    name: str
    code: str | None = None


class JoinOrganizationResponse(BaseModel):
    organization_id: uuid.UUID
    organization_name: str
    code: str


class OrganizationMember(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    joined_at: datetime.datetime

