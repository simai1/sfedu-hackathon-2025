import uuid

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from . import Base


class AudioModel(Base):
    __tablename__ = "audios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )

    url: Mapped[str] = mapped_column(String(255), nullable=False)

    def as_dict(self):
        return {
            "id": str(self.id),
            "url": self.url,
        }

