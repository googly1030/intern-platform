"""
Submission API Routes
Handles creating submissions and retrieving score reports
"""

import os
import re
import logging
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.submission import Submission
from app.workers.scoring_worker import process_submission
from app.config import settings
from app.services.commit_analyzer import CommitAnalyzer
from app.services.github_cache import github_cache

logger = logging.getLogger(__name__)

router = APIRouter()

# Screenshots directory
SCREENSHOTS_DIR = getattr(settings, "SCREENSHOTS_DIR", "./screenshots")


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
    # Optional custom rules (text or base64 encoded PDF content)
    rules_text: Optional[str] = None
    # Optional project structure (text or base64 encoded PDF content)
    project_structure_text: Optional[str] = None


class SubmissionResponse(BaseModel):
    """Schema for submission response"""

    id: str
    candidate_name: str
    candidate_email: str
    github_url: str
    hosted_url: Optional[str] = None
    video_url: Optional[str] = None
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
        rules_text=submission_data.rules_text,
        project_structure_text=submission_data.project_structure_text,
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
        submission.rules_text,
        submission.project_structure_text,
    )

    return SubmissionResponse(
        id=submission.id,
        candidate_name=submission.candidate_name,
        candidate_email=submission.candidate_email,
        github_url=submission.github_url,
        hosted_url=submission.hosted_url,
        video_url=submission.video_url,
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
            video_url=s.video_url,
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
                video_url=s.video_url,
                status=s.status,
                overall_score=s.overall_score,
                grade=s.grade,
                created_at=s.created_at,
                processed_at=s.processed_at,
            )
            for s in recent_submissions
        ],
    )


# ===========================================
# Screenshot Serving (MUST be before /{submission_id} routes)
# ===========================================

@router.get("/screenshots/{filename}")
async def get_screenshot(filename: str):
    """
    Serve screenshot files.

    Args:
        filename: Screenshot filename (e.g., sub_123_index.png)

    Returns:
        Image file response
    """
    # Security: prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )

    # Only allow image files
    if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type"
        )

    screenshot_path = os.path.join(SCREENSHOTS_DIR, filename)

    if not os.path.exists(screenshot_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screenshot not found: {filename}"
        )

    return FileResponse(
        screenshot_path,
        media_type="image/png",
        filename=filename
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
        video_url=submission.video_url,
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
        submission.rules_text,
        submission.project_structure_text,
    )

    return SubmissionResponse(
        id=submission.id,
        candidate_name=submission.candidate_name,
        candidate_email=submission.candidate_email,
        github_url=submission.github_url,
        hosted_url=submission.hosted_url,
        video_url=submission.video_url,
        status=submission.status,
        overall_score=submission.overall_score,
        grade=submission.grade,
        created_at=submission.created_at,
        processed_at=submission.processed_at,
    )


class CommitItem(BaseModel):
    """Schema for a single commit"""
    sha: str
    message: str
    author: str
    date: str
    url: str


class CommitHistoryResponse(BaseModel):
    """Schema for commit history response"""
    repo_name: str
    total_commits: int
    commits: list[CommitItem]
    activity: dict


@router.get("/{submission_id}/commits", response_model=CommitHistoryResponse)
async def get_commit_history(
    submission_id: str,
    refresh: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """
    Get GitHub commit history for a submission's repository.

    Returns commit details and activity data for visualization.

    Query Parameters:
        refresh: If true, bypasses cache and fetches fresh data from GitHub
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

    if not submission.github_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub URL associated with this submission",
        )

    # Parse GitHub URL to get owner and repo
    github_url = submission.github_url
    match = re.search(r'github\.com[/:]([^/]+)/([^/.]+)', github_url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub URL format",
        )

    owner = match.group(1)
    repo = match.group(2)

    # Check cache first (unless refresh=true)
    if not refresh:
        cached = await github_cache.get_raw_commits(owner, repo)
        if cached:
            logger.info(f"[{submission_id}] Using cached commits for {owner}/{repo}")
            return CommitHistoryResponse(**cached)

    # Prepare headers with optional GitHub token
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    try:
        # Fetch commits from GitHub API
        async with httpx.AsyncClient(timeout=15) as client:
            # Get actual commits (last 100)
            commits_response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100",
                headers=headers
            )

            commits = []
            activity_data = {"weeks": []}

            if commits_response.status_code == 200:
                commits_data = commits_response.json()

                for commit in commits_data:
                    commit_info = commit.get("commit", {})
                    author_info = commit_info.get("author", {}) or commit.get("author", {})

                    commits.append(CommitItem(
                        sha=commit.get("sha", "")[:7],
                        message=commit_info.get("message", "").split("\n")[0][:100],  # First line, max 100 chars
                        author=author_info.get("name", "Unknown") if isinstance(author_info, dict) else "Unknown",
                        date=author_info.get("date", "") if isinstance(author_info, dict) else "",
                        url=commit.get("html_url", f"https://github.com/{owner}/{repo}/commit/{commit.get('sha', '')}")
                    ))

                # Generate activity grid from commits
                from collections import defaultdict
                from datetime import datetime

                week_commits = defaultdict(int)
                for commit in commits_data:
                    commit_info = commit.get("commit", {})
                    author_info = commit_info.get("author", {})
                    date_str = author_info.get("date", "") if isinstance(author_info, dict) else ""
                    if date_str:
                        try:
                            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                            week_key = dt.strftime("%Y-%W")
                            week_commits[week_key] += 1
                        except:
                            pass

                activity_data = {
                    "weeks": [
                        {"week": week, "count": count}
                        for week, count in sorted(week_commits.items(), reverse=True)[:52]
                    ]
                }

                # Build response data (convert Pydantic models to dicts for caching)
                response_data = {
                    "repo_name": f"{owner}/{repo}",
                    "total_commits": len(commits),
                    "commits": [c.model_dump() for c in commits],
                    "activity": activity_data
                }

                # Cache the successful result
                await github_cache.set_raw_commits(owner, repo, response_data)
                logger.info(f"[{submission_id}] Cached commits for {owner}/{repo}")

                return CommitHistoryResponse(
                    repo_name=response_data["repo_name"],
                    total_commits=response_data["total_commits"],
                    commits=commits,
                    activity=response_data["activity"]
                )

            elif commits_response.status_code == 404:
                # Repo not found or private
                return CommitHistoryResponse(
                    repo_name=f"{owner}/{repo}",
                    total_commits=0,
                    commits=[],
                    activity={"weeks": []}
                )

            # Handle other non-success status codes (e.g., 403 rate limit, 500 server error)
            logger.warning(f"GitHub API returned status {commits_response.status_code} for {owner}/{repo}")
            return CommitHistoryResponse(
                repo_name=f"{owner}/{repo}",
                total_commits=0,
                commits=[],
                activity={"weeks": []}
            )

    except httpx.TimeoutException:
        logger.warning(f"GitHub API timeout for {owner}/{repo}")
        return CommitHistoryResponse(
            repo_name=f"{owner}/{repo}",
            total_commits=0,
            commits=[],
            activity={"weeks": []}
        )
    except Exception as e:
        logger.error(f"Failed to fetch commit history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch commit history: {str(e)}",
        )


@router.get("/{submission_id}/commit-analysis")
async def get_commit_analysis(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze commit history for AI-generated content and suspicious patterns.

    Returns detailed analysis including:
    - AI generation risk score
    - Commit pattern analysis
    - Timeline analysis
    - Recommendations for interview questions
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

    if not submission.github_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub URL associated with this submission",
        )

    # Parse GitHub URL
    github_url = submission.github_url
    match = re.search(r'github\.com[/:]([^/]+)/([^/.]+)', github_url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub URL format",
        )

    owner = match.group(1)
    repo = match.group(2)

    # Run analysis
    analyzer = CommitAnalyzer()
    analysis = await analyzer.analyze_commits(owner, repo)

    return analysis
