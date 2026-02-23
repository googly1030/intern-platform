"""
Submission Batch Model
Stores batch configurations for scoring multiple submissions with the same criteria
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SubmissionBatch(Base):
    """Model for storing submission batches"""

    __tablename__ = "submission_batches"

    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Batch details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Configuration (optional)
    rules_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    project_structure_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scoring_weights: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Status tracking
    # Status: pending, processing, completed, failed, cancelled
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", index=True
    )

    # Progress counters
    total_submissions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_submissions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_submissions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Error message for batch-level failures
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<SubmissionBatch {self.id} - {self.name}>"

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "rules_text": self.rules_text,
            "project_structure_text": self.project_structure_text,
            "scoring_weights": self.scoring_weights,
            "status": self.status,
            "total_submissions": self.total_submissions,
            "completed_submissions": self.completed_submissions,
            "failed_submissions": self.failed_submissions,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

    def get_progress_percentage(self) -> int:
        """Calculate progress percentage"""
        if self.total_submissions == 0:
            return 0
        return int((self.completed_submissions / self.total_submissions) * 100)

    def is_processing(self) -> bool:
        """Check if batch is currently processing"""
        return self.status == "processing"

    def can_start(self) -> bool:
        """Check if batch can be started"""
        return self.status == "pending" and self.total_submissions > 0
