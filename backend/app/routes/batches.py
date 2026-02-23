"""
Batch API Routes
Handles creating and managing submission batches
"""

import csv
import io
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.batch import SubmissionBatch
from app.models.submission import Submission
from app.workers.scoring_worker import process_submission

logger = logging.getLogger(__name__)

router = APIRouter()


# ===========================================
# Pydantic Schemas
# ===========================================


class BatchCreate(BaseModel):
    """Schema for creating a new batch"""

    name: str = Field(..., min_length=1, max_length=255, description="Batch name")
    description: Optional[str] = Field(None, description="Optional batch description")
    rules_text: Optional[str] = Field(None, description="Custom rules (text or extracted from PDF)")
    project_structure_text: Optional[str] = Field(None, description="Project structure (text or extracted from PDF)")
    scoring_weights: Optional[dict] = Field(
        None,
        description="Scoring weights configuration (e.g., {codeQuality: 40, performance: 35, uiux: 25})",
    )


class BatchUpdate(BaseModel):
    """Schema for updating a batch"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    rules_text: Optional[str] = None
    project_structure_text: Optional[str] = None
    scoring_weights: Optional[dict] = None


class BatchSubmissionCreate(BaseModel):
    """Schema for adding a single submission to a batch"""

    candidate_name: str
    candidate_email: EmailStr
    github_url: str
    hosted_url: Optional[str] = None
    video_url: Optional[str] = None


class BatchResponse(BaseModel):
    """Schema for batch response"""

    id: str
    name: str
    description: Optional[str] = None
    rules_text: Optional[str] = None
    project_structure_text: Optional[str] = None
    scoring_weights: Optional[dict] = None
    status: str
    total_submissions: int
    completed_submissions: int
    failed_submissions: int
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    progress_percentage: int = 0

    class Config:
        from_attributes = True


class BatchSubmissionResponse(BaseModel):
    """Schema for batch submission response"""

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

    class Config:
        from_attributes = True


class BatchResultsResponse(BaseModel):
    """Schema for batch results with all submissions"""

    batch: BatchResponse
    submissions: list[BatchSubmissionResponse]
    stats: dict


# ===========================================
# Helper Functions
# ===========================================


async def get_batch_or_404(batch_id: str, db: AsyncSession) -> SubmissionBatch:
    """Get batch by ID or raise 404"""
    result = await db.execute(select(SubmissionBatch).where(SubmissionBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch {batch_id} not found",
        )
    return batch


async def update_batch_progress(batch_id: str, db: AsyncSession) -> None:
    """Update batch progress based on submission statuses"""
    batch = await get_batch_or_404(batch_id, db)

    # Count submissions by status
    total_result = await db.execute(
        select(func.count(Submission.id)).where(Submission.batch_id == batch_id)
    )
    batch.total_submissions = total_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(Submission.id)).where(
            Submission.batch_id == batch_id,
            Submission.status == "completed",
        )
    )
    batch.completed_submissions = completed_result.scalar() or 0

    failed_result = await db.execute(
        select(func.count(Submission.id)).where(
            Submission.batch_id == batch_id,
            Submission.status == "failed",
        )
    )
    batch.failed_submissions = failed_result.scalar() or 0

    # Update batch status based on progress
    if batch.status == "processing":
        if batch.completed_submissions + batch.failed_submissions >= batch.total_submissions:
            batch.status = "completed"
            batch.completed_at = func.now()
            logger.info(f"[{batch_id}] Batch processing completed")

    await db.flush()


# ===========================================
# API Endpoints
# ===========================================


@router.post("/", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    batch_data: BatchCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new submission batch.

    Creates a batch with optional rules, project structure, and scoring weights.
    Submissions can be added later and will use this configuration.
    """
    batch = SubmissionBatch(
        name=batch_data.name,
        description=batch_data.description,
        rules_text=batch_data.rules_text,
        project_structure_text=batch_data.project_structure_text,
        scoring_weights=batch_data.scoring_weights,
        status="pending",
    )

    db.add(batch)
    await db.flush()
    await db.commit()
    await db.refresh(batch)

    response_data = BatchResponse(**batch.to_dict())
    response_data.progress_percentage = batch.get_progress_percentage()
    return response_data


@router.get("/", response_model=list[BatchResponse])
async def list_batches(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List all batches with optional filtering.

    Query params:
    - skip: Number of records to skip (pagination)
    - limit: Maximum records to return
    - status: Filter by status (pending, processing, completed, failed)
    """
    query = select(SubmissionBatch).order_by(SubmissionBatch.created_at.desc())

    if status_filter:
        query = query.where(SubmissionBatch.status == status_filter)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    batches = result.scalars().all()

    responses = []
    for batch in batches:
        response_data = BatchResponse(**batch.to_dict())
        response_data.progress_percentage = batch.get_progress_percentage()
        responses.append(response_data)

    return responses


@router.get("/{batch_id}", response_model=BatchResponse)
async def get_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get batch details by ID."""
    batch = await get_batch_or_404(batch_id, db)

    response_data = BatchResponse(**batch.to_dict())
    response_data.progress_percentage = batch.get_progress_percentage()
    return response_data


@router.put("/{batch_id}", response_model=BatchResponse)
async def update_batch(
    batch_id: str,
    batch_data: BatchUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update batch details.

    Only allows updates if batch is in 'pending' status.
    """
    batch = await get_batch_or_404(batch_id, db)

    if batch.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update batch with status '{batch.status}'. Only pending batches can be updated.",
        )

    # Update fields
    if batch_data.name is not None:
        batch.name = batch_data.name
    if batch_data.description is not None:
        batch.description = batch_data.description
    if batch_data.rules_text is not None:
        batch.rules_text = batch_data.rules_text
    if batch_data.project_structure_text is not None:
        batch.project_structure_text = batch_data.project_structure_text
    if batch_data.scoring_weights is not None:
        batch.scoring_weights = batch_data.scoring_weights

    await db.flush()
    await db.commit()
    await db.refresh(batch)

    response_data = BatchResponse(**batch.to_dict())
    response_data.progress_percentage = batch.get_progress_percentage()
    return response_data


@router.post("/{batch_id}/submit", response_model=BatchSubmissionResponse)
async def add_submission_to_batch(
    batch_id: str,
    submission_data: BatchSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Add a single submission to a batch.

    Creates a new submission linked to the batch.
    Uses batch's rules and project structure if available.
    """
    batch = await get_batch_or_404(batch_id, db)

    submission = Submission(
        candidate_name=submission_data.candidate_name,
        candidate_email=submission_data.candidate_email,
        github_url=submission_data.github_url,
        hosted_url=submission_data.hosted_url,
        video_url=submission_data.video_url,
        batch_id=batch_id,
        rules_text=batch.rules_text,
        project_structure_text=batch.project_structure_text,
        status="pending",
    )

    db.add(submission)
    await db.flush()

    # Update batch total count
    batch.total_submissions += 1
    await db.flush()
    await db.commit()
    await db.refresh(submission)

    # Trigger background scoring if batch is processing
    if batch.status == "processing":
        background_tasks.add_task(
            process_submission,
            submission.id,
            submission.github_url,
            submission.hosted_url,
            submission.rules_text,
            submission.project_structure_text,
        )

    return BatchSubmissionResponse(
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
    )


@router.post("/{batch_id}/submit/multiple")
async def add_multiple_submissions_to_batch(
    batch_id: str,
    submissions_data: list[BatchSubmissionCreate],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Add multiple submissions to a batch.

    Creates multiple submissions linked to the batch.
    Returns list of created submission IDs.
    """
    batch = await get_batch_or_404(batch_id, db)

    created_submissions = []
    for submission_data in submissions_data:
        submission = Submission(
            candidate_name=submission_data.candidate_name,
            candidate_email=submission_data.candidate_email,
            github_url=submission_data.github_url,
            hosted_url=submission_data.hosted_url,
            video_url=submission_data.video_url,
            batch_id=batch_id,
            rules_text=batch.rules_text,
            project_structure_text=batch.project_structure_text,
            status="pending",
        )
        db.add(submission)
        created_submissions.append(submission)

    await db.flush()

    # Update batch total count
    batch.total_submissions += len(created_submissions)
    await db.flush()
    await db.commit()

    submission_ids = [s.id for s in created_submissions]

    # Trigger background scoring if batch is processing
    if batch.status == "processing":
        for submission in created_submissions:
            background_tasks.add_task(
                process_submission,
                submission.id,
                submission.github_url,
                submission.hosted_url,
                submission.rules_text,
                submission.project_structure_text,
            )

    return {
        "message": f"Added {len(created_submissions)} submissions to batch",
        "submission_ids": submission_ids,
    }


@router.post("/{batch_id}/csv")
async def import_submissions_from_csv(
    batch_id: str,
    file_content: bytes,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Import submissions from CSV file.

    Expected CSV columns (all required except hosted_url and video_url):
    - name
    - email
    - github_url
    - hosted_url (optional)
    - video_url (optional)

    Returns list of created submission IDs.
    """
    batch = await get_batch_or_404(batch_id, db)

    if batch.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot import to batch with status '{batch.status}'. Only pending batches accept new submissions.",
        )

    try:
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(file_content.decode("utf-8")))

        # Validate required columns
        required_columns = {"name", "email", "github_url"}
        if not required_columns.issubset(set(csv_reader.fieldnames or [])):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV must contain columns: {', '.join(required_columns)}",
            )

        created_submissions = []
        errors = []

        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (1 is header)
            try:
                submission = Submission(
                    candidate_name=row["name"].strip(),
                    candidate_email=row["email"].strip(),
                    github_url=row["github_url"].strip(),
                    hosted_url=row.get("hosted_url", "").strip() or None,
                    video_url=row.get("video_url", "").strip() or None,
                    batch_id=batch_id,
                    rules_text=batch.rules_text,
                    project_structure_text=batch.project_structure_text,
                    status="pending",
                )
                db.add(submission)
                created_submissions.append(submission)
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                logger.warning(f"[{batch_id}] CSV import error on row {row_num}: {e}")

        if created_submissions:
            await db.flush()
            batch.total_submissions += len(created_submissions)
            await db.flush()
            await db.commit()

            submission_ids = [s.id for s in created_submissions]

            return {
                "message": f"Imported {len(created_submissions)} submissions from CSV",
                "submission_ids": submission_ids,
                "errors": errors if errors else None,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid submissions found in CSV",
            )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must be UTF-8 encoded",
        )
    except Exception as e:
        logger.error(f"[{batch_id}] CSV import failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse CSV: {str(e)}",
        )


@router.post("/{batch_id}/start", response_model=BatchResponse)
async def start_batch_processing(
    batch_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Start processing all pending submissions in the batch.

    Triggers background scoring jobs for all pending submissions.
    """
    batch = await get_batch_or_404(batch_id, db)

    if not batch.can_start():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start batch. Status: {batch.status}, Submissions: {batch.total_submissions}",
        )

    # Update batch status
    batch.status = "processing"
    await db.flush()
    await db.commit()
    await db.refresh(batch)

    # Get all pending submissions for this batch
    result = await db.execute(
        select(Submission).where(
            Submission.batch_id == batch_id,
            Submission.status == "pending",
        )
    )
    pending_submissions = result.scalars().all()

    # Trigger background scoring for each submission
    for submission in pending_submissions:
        background_tasks.add_task(
            process_submission,
            submission.id,
            submission.github_url,
            submission.hosted_url,
            submission.rules_text,
            submission.project_structure_text,
        )

    logger.info(f"[{batch_id}] Started processing {len(pending_submissions)} submissions")

    response_data = BatchResponse(**batch.to_dict())
    response_data.progress_percentage = batch.get_progress_percentage()
    return response_data


@router.get("/{batch_id}/results", response_model=BatchResultsResponse)
async def get_batch_results(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get batch results with all submissions.

    Returns batch details and list of all submissions with their scores.
    """
    batch = await get_batch_or_404(batch_id, db)

    # Get all submissions for this batch
    result = await db.execute(
        select(Submission)
        .where(Submission.batch_id == batch_id)
        .order_by(Submission.created_at.desc())
    )
    submissions = result.scalars().all()

    submission_responses = [
        BatchSubmissionResponse(
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
        )
        for s in submissions
    ]

    # Calculate statistics
    completed_scores = [s.overall_score for s in submissions if s.overall_score is not None]
    avg_score = sum(completed_scores) / len(completed_scores) if completed_scores else None

    batch_data = BatchResponse(**batch.to_dict())
    batch_data.progress_percentage = batch.get_progress_percentage()

    return BatchResultsResponse(
        batch=batch_data,
        submissions=submission_responses,
        stats={
            "total": batch.total_submissions,
            "completed": batch.completed_submissions,
            "failed": batch.failed_submissions,
            "pending": batch.total_submissions - batch.completed_submissions - batch.failed_submissions,
            "average_score": round(avg_score, 1) if avg_score else None,
        },
    )


@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a batch and all its submissions.

    WARNING: This will permanently delete all submissions in the batch.
    """
    batch = await get_batch_or_404(batch_id, db)

    if batch.status == "processing":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete batch while it is processing",
        )

    # Delete all submissions in the batch
    await db.execute(
        select(Submission).where(Submission.batch_id == batch_id)
    )
    # Actually delete them
    result = await db.execute(
        select(Submission).where(Submission.batch_id == batch_id)
    )
    submissions = result.scalars().all()
    for submission in submissions:
        await db.delete(submission)

    # Delete the batch
    await db.delete(batch)
    await db.commit()

    logger.info(f"[{batch_id}] Deleted batch and {len(submissions)} submissions")


@router.get("/{batch_id}/export")
async def export_batch_results(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Export batch results as CSV file.

    Returns a CSV file with all submission details and scores.
    """
    batch = await get_batch_or_404(batch_id, db)

    # Get all submissions
    result = await db.execute(
        select(Submission)
        .where(Submission.batch_id == batch_id)
        .order_by(Submission.overall_score.desc())
    )
    submissions = result.scalars().all()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Candidate Name",
        "Email",
        "GitHub URL",
        "Hosted URL",
        "Video URL",
        "Status",
        "Overall Score",
        "Grade",
        "Created At",
        "Processed At",
    ])

    # Rows
    for s in submissions:
        writer.writerow([
            s.candidate_name,
            s.candidate_email,
            s.github_url,
            s.hosted_url or "",
            s.video_url or "",
            s.status,
            s.overall_score or "",
            s.grade or "",
            s.created_at.isoformat() if s.created_at else "",
            s.processed_at.isoformat() if s.processed_at else "",
        ])

    # Create streaming response
    csv_content = output.getvalue()

    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=batch_{batch.name}_{batch_id}.csv"
        },
    )
