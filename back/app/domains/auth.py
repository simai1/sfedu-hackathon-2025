import uuid

from pydantic import BaseModel

class AuthUser(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    token: str
