"""
Batch Processor Service
Handles batch-level operations and progress tracking
"""

import logging
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import SubmissionBatch
from app.models.submission import Submission

logger = logging.getLogger(__name__)


class BatchProcessor:
    """Service for handling batch operations"""

    @staticmethod
    async def get_batch_or_404(batch_id: str, db: AsyncSession) -> SubmissionBatch:
        """Get batch by ID or raise 404"""
        result = await db.execute(
            select(SubmissionBatch).where(SubmissionBatch.id == batch_id)
        )
        batch = result.scalar_one_or_none()
        if not batch:
            logger.error(f"[{batch_id}] Batch not found")
            return None
        return batch

    @staticmethod
    async def update_batch_progress(batch_id: str, db: AsyncSession) -> Optional[SubmissionBatch]:
        """
        Update batch progress based on submission statuses.

        Should be called after each submission completes.
        """
        result = await db.execute(
            select(SubmissionBatch).where(SubmissionBatch.id == batch_id)
        )
        batch = result.scalar_one_or_none()

        if not batch:
            logger.warning(f"[{batch_id}] Cannot update progress: batch not found")
            return None

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

        # Log progress
        progress = batch.get_progress_percentage()
        logger.info(
            f"[{batch_id}] Progress: {batch.completed_submissions}/{batch.total_submissions} "
            f"completed, {batch.failed_submissions} failed ({progress}%)"
        )

        # Update batch status based on progress
        if batch.status == "processing":
            finished_count = batch.completed_submissions + batch.failed_submissions
            if finished_count >= batch.total_submissions and batch.total_submissions > 0:
                batch.status = "completed"
                batch.completed_at = func.now()
                logger.info(f"[{batch_id}] Batch processing completed")

        await db.flush()
        await db.refresh(batch)
        return batch

    @staticmethod
    async def get_batch_summary(batch_id: str, db: AsyncSession) -> Optional[dict]:
        """
        Get batch summary with statistics.
        """
        batch = await BatchProcessor.get_batch_or_404(batch_id, db)
        if not batch:
            return None

        # Get all submissions
        result = await db.execute(
            select(Submission)
            .where(Submission.batch_id == batch_id)
            .order_by(Submission.created_at.desc())
        )
        submissions = result.scalars().all()

        # Calculate statistics
        completed_scores = [
            s.overall_score for s in submissions if s.overall_score is not None
        ]
        avg_score = (
            sum(completed_scores) / len(completed_scores) if completed_scores else None
        )

        # Count by grade
        grade_counts = {}
        for s in submissions:
            if s.grade:
                grade_counts[s.grade] = grade_counts.get(s.grade, 0) + 1

        # Count by status
        status_counts = {}
        for s in submissions:
            status_counts[s.status] = status_counts.get(s.status, 0) + 1

        return {
            "batch": batch.to_dict(),
            "stats": {
                "total": batch.total_submissions,
                "completed": batch.completed_submissions,
                "failed": batch.failed_submissions,
                "pending": batch.total_submissions
                - batch.completed_submissions
                - batch.failed_submissions,
                "progress_percentage": batch.get_progress_percentage(),
                "average_score": round(avg_score, 1) if avg_score else None,
                "grade_distribution": grade_counts,
                "status_distribution": status_counts,
            },
            "submissions": [s.to_dict() for s in submissions],
        }

    @staticmethod
    async def cancel_batch(batch_id: str, db: AsyncSession) -> Optional[SubmissionBatch]:
        """
        Cancel a batch that is pending or processing.
        """
        batch = await BatchProcessor.get_batch_or_404(batch_id, db)
        if not batch:
            return None

        if batch.status in ["pending", "processing"]:
            batch.status = "cancelled"
            await db.flush()
            await db.refresh(batch)
            logger.info(f"[{batch_id}] Batch cancelled")
            return batch

        logger.warning(f"[{batch_id}] Cannot cancel batch with status {batch.status}")
        return None

    @staticmethod
    async def delete_batch(batch_id: str, db: AsyncSession) -> bool:
        """
        Delete a batch and all its submissions.
        """
        batch = await BatchProcessor.get_batch_or_404(batch_id, db)
        if not batch:
            return False

        if batch.status == "processing":
            logger.warning(f"[{batch_id}] Cannot delete batch while processing")
            return False

        # Delete all submissions in the batch
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
        return True
