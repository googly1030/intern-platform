"""
Scoring Worker
Background job for processing submissions
With WebSocket progress updates
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.submission import Submission
from app.services.scorer import Scorer
from app.services.websocket_manager import get_websocket_manager

logger = logging.getLogger(__name__)


async def process_submission(
    submission_id: str,
    github_url: str,
    hosted_url: Optional[str] = None,
):
    """
    Process a submission for scoring.

    This function is designed to run as a background task.

    Args:
        submission_id: Unique ID of the submission
        github_url: GitHub repository URL
        hosted_url: Optional hosted deployment URL
    """
    ws_manager = get_websocket_manager()
    logger.info(f"[{submission_id}] Starting submission processing")

    async with async_session() as db:
        try:
            # Update status to processing
            await update_submission_status(db, submission_id, "processing")

            # Broadcast initial status via WebSocket
            await ws_manager.broadcast_progress(
                submission_id=submission_id,
                stage="initializing",
                progress=5,
                message="Starting analysis..."
            )

            # Get the current event loop to pass to the callback
            main_loop = asyncio.get_event_loop()

            # Create progress callback for WebSocket updates
            def progress_callback(sub_id: str, stage: str, progress: int, message: str = ""):
                """Sync callback that schedules async WebSocket broadcast from executor thread"""
                try:
                    # Use run_coroutine_threadsafe to schedule from another thread
                    future = asyncio.run_coroutine_threadsafe(
                        ws_manager.broadcast_progress(sub_id, stage, progress, message),
                        main_loop
                    )
                    # Don't wait for result, just fire and forget
                except Exception as e:
                    logger.warning(f"Failed to broadcast progress: {e}")

            # Initialize scorer with progress callback
            scorer = Scorer(
                repos_dir=getattr(settings, "REPOS_DIR", "./repos"),
                api_key=getattr(settings, "ANTHROPIC_API_KEY", None),
                progress_callback=progress_callback,
            )

            # Run scoring (synchronous, so we run in executor)
            result = await main_loop.run_in_executor(
                None,
                lambda: scorer.score_submission(github_url, submission_id, hosted_url)
            )

            # Update submission with results
            await update_submission_results(db, submission_id, result)

            # Broadcast completion via WebSocket
            await ws_manager.broadcast_progress(
                submission_id=submission_id,
                stage="completed",
                progress=100,
                message="Analysis complete!",
                data={
                    "overall_score": result.get("overall_score"),
                    "grade": result.get("grade"),
                    "recommendation": result.get("recommendation"),
                }
            )

            logger.info(f"[{submission_id}] Scoring completed: {result['status']}")

        except Exception as e:
            logger.error(f"[{submission_id}] Error processing submission: {e}", exc_info=True)
            await update_submission_status(
                db,
                submission_id,
                "failed",
                error_message=str(e),
            )

            # Broadcast error via WebSocket
            await ws_manager.broadcast_progress(
                submission_id=submission_id,
                stage="failed",
                progress=0,
                message=f"Analysis failed: {str(e)}",
                data={"error": str(e)}
            )


async def update_submission_status(
    db: AsyncSession,
    submission_id: str,
    status: str,
    error_message: Optional[str] = None,
):
    """Update submission status in database"""
    logger.info(f"[{submission_id}] Updating status to: {status}")
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if submission:
        submission.status = status
        if error_message:
            submission.error_message = error_message
            logger.error(f"[{submission_id}] Error message: {error_message}")
        await db.commit()
    else:
        logger.warning(f"[{submission_id}] Submission not found in database")


async def update_submission_results(
    db: AsyncSession,
    submission_id: str,
    result: dict,
):
    """Update submission with scoring results"""
    logger.info(f"[{submission_id}] Updating with results: score={result.get('overall_score')}, grade={result.get('grade')}")
    result_db = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result_db.scalar_one_or_none()

    if submission:
        submission.status = result.get("status", "completed")
        submission.error_message = result.get("error")
        submission.repo_path = result.get("repo_path")
        submission.overall_score = result.get("overall_score", 0)
        submission.grade = result.get("grade", "F")
        submission.recommendation = result.get("recommendation", "Auto-reject")
        submission.scores = result.get("scores", {})
        submission.flags = result.get("flags", [])
        submission.ai_generation_risk = result.get("ai_generation_risk", 0.0)
        submission.strengths = result.get("strengths", [])
        submission.weaknesses = result.get("weaknesses", [])
        submission.screenshots = result.get("screenshots", {})
        submission.analysis_details = result.get("analysis_details", {})
        submission.processing_time_ms = result.get("processing_time_ms")
        submission.processed_at = datetime.utcnow()
        await db.commit()
        logger.info(f"[{submission_id}] Results saved to database")
    else:
        logger.warning(f"[{submission_id}] Submission not found when saving results")


def queue_submission(submission_id: str, github_url: str, hosted_url: Optional[str] = None):
    """
    Queue a submission for background processing.

    For now, this runs synchronously. In production, this would
    add the job to a Redis Queue.

    Args:
        submission_id: Unique ID of the submission
        github_url: GitHub repository URL
        hosted_url: Optional hosted deployment URL
    """
    # For synchronous processing (development)
    asyncio.create_task(process_submission(submission_id, github_url, hosted_url))

    # TODO: For production with Redis Queue
    # from redis import Redis
    # from rq import Queue
    # redis_conn = Redis(host='localhost', port=6379)
    # q = Queue('scoring', connection=redis_conn)
    # q.enqueue(process_submission, submission_id, github_url, hosted_url)


# For running worker standalone
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python -m app.workers.scoring_worker <submission_id> <github_url> [hosted_url]")
        sys.exit(1)

    submission_id = sys.argv[1]
    github_url = sys.argv[2]
    hosted_url = sys.argv[3] if len(sys.argv) > 3 else None

    asyncio.run(process_submission(submission_id, github_url, hosted_url))
