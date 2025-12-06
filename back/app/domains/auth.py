import uuid

from pydantic import BaseModel

class AuthUser(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    token: str
    organization_code: str | None = None
    organization_name: str | None = None
