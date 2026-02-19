"""
Bulk Upload API Routes
Handles template download and bulk submission upload
"""

import io
import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.submission import Submission
from app.services.bulk_upload import bulk_upload_service
from app.services.queue_service import queue_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ===========================================
# Pydantic Schemas
# ===========================================

class BulkUploadResponse(BaseModel):
    """Response for bulk upload"""
    batch_id: str
    total_submissions: int
    queued_count: int
    errors: list
    message: str


class SubmissionStatus(BaseModel):
    """Individual submission status"""
    id: str
    name: str
    status: str
    score: int | None = None


class BulkStatusResponse(BaseModel):
    """Response for bulk upload status"""
    batch_id: str
    status: str
    total: int
    completed: int
    failed: int
    pending: int
    submissions: list[SubmissionStatus]


# ===========================================
# API Endpoints
# ===========================================

@router.get("/template")
async def download_template():
    """
    Download Excel template for bulk submission upload.

    Returns an Excel file with columns:
    - Candidate Name (required)
    - Email (required)
    - GitHub URL (required)
    - Hosted URL (optional)
    - Video URL (optional)
    """
    excel_content = bulk_upload_service.generate_template()

    return StreamingResponse(
        io.BytesIO(excel_content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=bulk_submission_template_{datetime.now().strftime('%Y%m%d')}.xlsx"
        }
    )


@router.post("/upload", response_model=BulkUploadResponse)
async def upload_bulk_submissions(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload Excel file with multiple candidates for bulk submission.

    Accepts .xlsx files with the following columns:
    - Candidate Name (required)
    - Email (required)
    - GitHub URL (required)
    - Hosted URL (optional)
    - Video URL (optional)

    Returns batch_id for tracking progress.
    """
    # Validate file type
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)"
        )

    # Read and parse file
    content = await file.read()

    try:
        submissions, parse_errors = bulk_upload_service.parse_excel(content)
    except Exception as e:
        logger.error(f"Failed to parse Excel file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Excel file: {str(e)}"
        )

    if not submissions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid submissions found in file",
        )

    # Generate batch ID
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"

    # Create submission records and queue them
    queued_count = 0
    db_errors = []

    for idx, sub_data in enumerate(submissions):
        try:
            # Create submission record
            submission = Submission(
                candidate_name=sub_data["candidate_name"],
                candidate_email=sub_data["candidate_email"],
                github_url=sub_data["github_url"],
                hosted_url=sub_data.get("hosted_url"),
                video_url=sub_data.get("video_url"),
                status="pending",
            )

            db.add(submission)
            await db.flush()  # Get the ID without committing

            # Queue for processing using Redis Queue
            queue_service.enqueue_submission(
                str(submission.id),
                submission.github_url,
                submission.hosted_url
            )
            queued_count += 1
            logger.info(f"Queued submission {submission.id} from row {idx + 2}")

        except Exception as e:
            logger.error(f"Failed to create submission {idx + 1}: {e}")
            db_errors.append({
                "row": idx + 2,  # +2 because row 1 is header
                "error": str(e),
                "data": sub_data
            })

    await db.commit()

    logger.info(f"Bulk upload complete: batch={batch_id}, queued={queued_count}, errors={len(parse_errors) + len(db_errors)}")

    return BulkUploadResponse(
        batch_id=batch_id,
        total_submissions=len(submissions),
        queued_count=queued_count,
        errors=parse_errors + db_errors,
        message=f"Successfully queued {queued_count} of {len(submissions)} submissions"
    )


@router.get("/status/{batch_id}", response_model=BulkStatusResponse)
async def get_bulk_status(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get status of a bulk upload batch.

    Returns counts of completed, failed, and pending submissions.
    Note: This is a simplified version. For full tracking,
    add a batch_id column to the submissions table.
    """
    # Get recent submissions (simplified - in production, filter by batch_id)
    result = await db.execute(
        select(Submission)
        .order_by(Submission.created_at.desc())
        .limit(100)
    )
    submissions = result.scalars().all()

    # Calculate stats
    total = len(submissions)
    completed = sum(1 for s in submissions if s.status == "completed")
    failed = sum(1 for s in submissions if s.status == "failed")
    pending = sum(1 for s in submissions if s.status in ["pending", "processing"])

    return BulkStatusResponse(
        batch_id=batch_id,
        status="processing" if pending > 0 else "completed",
        total=total,
        completed=completed,
        failed=failed,
        pending=pending,
        submissions=[
            SubmissionStatus(
                id=str(s.id),
                name=s.candidate_name,
                status=s.status,
                score=s.overall_score
            )
            for s in submissions[:20]  # Return first 20
        ]
    )


@router.get("/queue/stats")
async def get_queue_stats():
    """Get Redis Queue statistics"""
    return queue_service.get_queue_stats()
