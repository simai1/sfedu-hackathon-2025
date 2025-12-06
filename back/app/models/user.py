import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base
if TYPE_CHECKING:
    from app.models.pair_token import PairTokenModel


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    role: Mapped[str] = mapped_column(String(255), nullable=True)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    users_pair_tokens: Mapped[list["PairTokenModel"]] = relationship(back_populates="user")

    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=text("TIMEZONE('utc', now())"), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        server_default=text("TIMEZONE('utc', now())"),
        server_onupdate=text("TIMEZONE('utc', now())"),
        nullable=False,
    )

    def as_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "password_hash": self.password_hash,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
