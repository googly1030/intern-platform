"""
Submission Model
Stores candidate submissions and their scores
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Submission(Base):
    """Model for storing candidate submissions"""

    __tablename__ = "submissions"

    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Candidate info
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    candidate_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Submission URLs
    github_url: Mapped[str] = mapped_column(String(500), nullable=False)
    hosted_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Task reference
    task_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), nullable=True, index=True
    )

    # Status: pending, processing, completed, failed
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", index=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Score results
    overall_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    grade: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Detailed scores (JSON)
    scores: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Example: {"fileSeparation": 10, "jqueryAjax": 8, "bootstrap": 10, ...}

    # Flags (JSON array)
    flags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    # Example: ["NO_BOOTSTRAP", "SQL_INJECTION_RISK"]

    # AI generation risk score (0.0 - 1.0)
    ai_generation_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Strengths and weaknesses (JSON arrays)
    strengths: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Screenshots (JSON)
    screenshots: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Example: {"login": "/screenshots/sub_123_login.png", "register": "...", "profile": "..."}

    # Analysis details (JSON)
    analysis_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Stores detailed analysis from code analyzer

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
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Local repo path
    repo_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<Submission {self.id} - {self.candidate_email} - {self.status}>"

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "github_url": self.github_url,
            "hosted_url": self.hosted_url,
            "video_url": self.video_url,
            "task_id": self.task_id,
            "status": self.status,
            "error_message": self.error_message,
            "overall_score": self.overall_score,
            "grade": self.grade,
            "recommendation": self.recommendation,
            "scores": self.scores,
            "flags": self.flags,
            "ai_generation_risk": self.ai_generation_risk,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "screenshots": self.screenshots,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }

    def get_score_report(self) -> dict:
        """Get full score report"""
        return {
            "submissionId": self.id,
            "candidateName": self.candidate_name,
            "candidateEmail": self.candidate_email,
            "githubUrl": self.github_url,
            "hostedUrl": self.hosted_url,
            "overallScore": self.overall_score,
            "grade": self.grade,
            "recommendation": self.recommendation,
            "scores": self.scores,
            "flags": self.flags,
            "aiGenerationRisk": self.ai_generation_risk,
            "strengths": self.strengths or [],
            "weaknesses": self.weaknesses or [],
            "screenshots": self.screenshots,
            "analyzedAt": self.processed_at.isoformat() if self.processed_at else None,
        }
