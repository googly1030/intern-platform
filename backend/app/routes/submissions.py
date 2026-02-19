"""
Submission API Routes
Handles creating submissions and retrieving score reports
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.submission import Submission
from app.workers.scoring_worker import process_submission

router = APIRouter()


# ===========================================
# Pydantic Schemas
# ===========================================


class SubmissionCreate(BaseModel):
    """Schema for creating a new submission"""

    candidate_name: str
    candidate_email: EmailStr
    github_url: str
    hosted_url: Optional[str] = None
    video_url: Optional[str] = None
    task_id: Optional[str] = None


class SubmissionResponse(BaseModel):
    """Schema for submission response"""

    id: str
    candidate_name: str
    candidate_email: str
    github_url: str
    hosted_url: Optional[str] = None
    status: str
    overall_score: Optional[int] = None
    grade: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScoreReportResponse(BaseModel):
    """Schema for full score report"""

    submissionId: str
    candidateName: str
    candidateEmail: str
    githubUrl: str
    hostedUrl: Optional[str] = None
    overallScore: Optional[int] = None
    grade: Optional[str] = None
    recommendation: Optional[str] = None
    scores: Optional[dict] = None
    flags: Optional[list] = None
    aiGenerationRisk: Optional[float] = None
    strengths: Optional[list] = None
    weaknesses: Optional[list] = None
    screenshots: Optional[dict] = None
    analyzedAt: Optional[str] = None


class DashboardStats(BaseModel):
    """Schema for dashboard statistics"""

    total_count: int
    avg_score: Optional[float] = None
    pending_count: int
    processing_count: int
    completed_count: int
    failed_count: int
    recent_submissions: list[SubmissionResponse]


# ===========================================
# API Endpoints
# ===========================================


@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission_data: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new submission for scoring.

    Accepts GitHub URL and optional hosted URL.
    Returns submission_id with status "pending".
    Triggers background scoring job.
    """
    # Create submission record
    submission = Submission(
        candidate_name=submission_data.candidate_name,
        candidate_email=submission_data.candidate_email,
        github_url=submission_data.github_url,
        hosted_url=submission_data.hosted_url,
        video_url=submission_data.video_url,
        task_id=submission_data.task_id,
        status="pending",
    )

    db.add(submission)
    await db.flush()
    await db.commit()  # Commit before background task starts
    await db.refresh(submission)

    # Trigger background scoring job
    background_tasks.add_task(
        process_submission,
        submission.id,
        submission.github_url,
        submission.hosted_url,
    )

    return SubmissionResponse(
        id=submission.id,
        candidate_name=submission.candidate_name,
        candidate_email=submission.candidate_email,
        github_url=submission.github_url,
        hosted_url=submission.hosted_url,
        status=submission.status,
        overall_score=submission.overall_score,
        grade=submission.grade,
        created_at=submission.created_at,
        processed_at=submission.processed_at,
    )


@router.get("/", response_model=list[SubmissionResponse])
async def list_submissions(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List all submissions with optional filtering.

    Query params:
    - skip: Number of records to skip (pagination)
    - limit: Maximum records to return
    - status: Filter by status (pending, processing, completed, failed)
    """
    query = select(Submission).order_by(Submission.created_at.desc())

    if status_filter:
        query = query.where(Submission.status == status_filter)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    submissions = result.scalars().all()

    return [
        SubmissionResponse(
            id=s.id,
            candidate_name=s.candidate_name,
            candidate_email=s.candidate_email,
            github_url=s.github_url,
            hosted_url=s.hosted_url,
            status=s.status,
            overall_score=s.overall_score,
            grade=s.grade,
            created_at=s.created_at,
            processed_at=s.processed_at,
        )
        for s in submissions
    ]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
):
    """
    Get dashboard statistics.

    Returns aggregated counts and recent submissions.
    """
    # Total count
    total_result = await db.execute(select(func.count(Submission.id)))
    total_count = total_result.scalar() or 0

    # Average score (only from completed submissions)
    avg_result = await db.execute(
        select(func.avg(Submission.overall_score)).where(
            Submission.status == "completed",
            Submission.overall_score.isnot(None),
        )
    )
    avg_score = avg_result.scalar()

    # Count by status
    async def get_status_count(status: str) -> int:
        result = await db.execute(
            select(func.count(Submission.id)).where(Submission.status == status)
        )
        return result.scalar() or 0

    pending_count = await get_status_count("pending")
    processing_count = await get_status_count("processing")
    completed_count = await get_status_count("completed")
    failed_count = await get_status_count("failed")

    # Recent submissions (last 10)
    recent_result = await db.execute(
        select(Submission).order_by(Submission.created_at.desc()).limit(10)
    )
    recent_submissions = recent_result.scalars().all()

    return DashboardStats(
        total_count=total_count,
        avg_score=round(avg_score, 1) if avg_score else None,
        pending_count=pending_count,
        processing_count=processing_count,
        completed_count=completed_count,
        failed_count=failed_count,
        recent_submissions=[
            SubmissionResponse(
                id=s.id,
                candidate_name=s.candidate_name,
                candidate_email=s.candidate_email,
                github_url=s.github_url,
                hosted_url=s.hosted_url,
                status=s.status,
                overall_score=s.overall_score,
                grade=s.grade,
                created_at=s.created_at,
                processed_at=s.processed_at,
            )
            for s in recent_submissions
        ],
    )


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get submission details and status.

    Returns submission details including status.
    If completed, includes score summary.
    """
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found",
        )

    return SubmissionResponse(
        id=submission.id,
        candidate_name=submission.candidate_name,
        candidate_email=submission.candidate_email,
        github_url=submission.github_url,
        hosted_url=submission.hosted_url,
        status=submission.status,
        overall_score=submission.overall_score,
        grade=submission.grade,
        created_at=submission.created_at,
        processed_at=submission.processed_at,
    )


@router.get("/{submission_id}/report", response_model=ScoreReportResponse)
async def get_score_report(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full score report for a submission.

    Returns detailed score report with all categories,
    flags, strengths, weaknesses, and screenshots.
    """
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found",
        )

    if submission.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Submission is not yet completed. Current status: {submission.status}",
        )

    report = submission.get_score_report()
    return ScoreReportResponse(**report)


@router.post("/{submission_id}/trigger", response_model=SubmissionResponse)
async def trigger_scoring(
    submission_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger scoring for a submission.

    Useful for retrying failed submissions or
    re-scoring with updated criteria.
    """
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found",
        )

    # Reset status to pending
    submission.status = "pending"
    submission.error_message = None
    await db.flush()
    await db.refresh(submission)

    # Trigger background scoring job
    background_tasks.add_task(
        process_submission,
        submission.id,
        submission.github_url,
        submission.hosted_url,
    )

    return SubmissionResponse(
        id=submission.id,
        candidate_name=submission.candidate_name,
        candidate_email=submission.candidate_email,
        github_url=submission.github_url,
        hosted_url=submission.hosted_url,
        status=submission.status,
        overall_score=submission.overall_score,
        grade=submission.grade,
        created_at=submission.created_at,
        processed_at=submission.processed_at,
    )
