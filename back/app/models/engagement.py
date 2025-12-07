import uuid

from sqlalchemy import Float, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from . import Base


class EngagementModel(Base):
    __tablename__ = "engagements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )

    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False
    )

    relaxation: Mapped[float] = mapped_column(Float, nullable=False)

    concentration: Mapped[float] = mapped_column(Float, nullable=False)

    screenshot_url: Mapped[str] = mapped_column(String(255), nullable=False)

    timecode: Mapped[str | None] = mapped_column(String(255), nullable=True)

    def as_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "video_id": str(self.video_id),
            "relaxation": self.relaxation,
            "concentration": self.concentration,
            "screenshot_url": self.screenshot_url,
            "timecode": self.timecode,
        }
