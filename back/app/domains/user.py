import datetime
import uuid

from pydantic import BaseModel


class User(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    password_hash: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    @classmethod
    def from_sql(cls, data):
        return cls(
            id=data["id"],
            name=data["name"],
            email=data["email"],
            password_hash=data["password_hash"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )


class CreateUser(BaseModel):
    name: str
    email: str
    password: str


class ValidateUser(BaseModel):
    email: str
    password: str
