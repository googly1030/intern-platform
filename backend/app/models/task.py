"""
Task Model
Stores internship task definitions and scoring criteria
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Task(Base):
    """Model for storing internship tasks"""

    __tablename__ = "tasks"

    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Task details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Expected folder structure (JSON)
    expected_structure: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Example: {"folders": ["assets", "css", "js", "php"], "files": ["index.html", "login.html"]}

    # Tech stack requirements (JSON)
    tech_requirements: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Example: {"frontend": ["HTML", "CSS", "JS"], "backend": "PHP", "databases": ["MySQL", "MongoDB", "Redis"]}

    # Scoring criteria (JSON) - from SCORING_CRITERIA.md
    scoring_criteria: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Example: {"criticalRequirements": 40, "databaseImplementation": 25, ...}

    # Task status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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

    def __repr__(self) -> str:
        return f"<Task {self.id} - {self.title}>"

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "expected_structure": self.expected_structure,
            "tech_requirements": self.tech_requirements,
            "scoring_criteria": self.scoring_criteria,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
