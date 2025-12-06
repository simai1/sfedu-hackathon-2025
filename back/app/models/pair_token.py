import datetime
import uuid

from typing import TYPE_CHECKING

from sqlalchemy import text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base

if TYPE_CHECKING:
    from app.models.user import UserModel



class PairTokenModel(Base):
    __tablename__ = "pair_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    user: Mapped["UserModel"] = relationship(back_populates="users_pair_tokens")

    expires_at: Mapped[datetime.datetime] = mapped_column(
        server_default=text("TIMEZONE('utc', now()) + INTERVAL '60 minutes'"),
        nullable=False,
    )
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=text("TIMEZONE('utc', now())"), nullable=False
    )
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "expires_at": self.expires_at,
            "created_at": self.created_at,
        }
