"""
Scoring Worker
Background job for processing submissions
"""

import asyncio
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.submission import Submission
from app.services.scorer import Scorer


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
    async with async_session() as db:
        try:
            # Update status to processing
            await update_submission_status(db, submission_id, "processing")

            # Initialize scorer
            scorer = Scorer(
                repos_dir=getattr(settings, "REPOS_DIR", "./repos"),
                api_key=getattr(settings, "ANTHROPIC_API_KEY", None),
            )

            # Run scoring (synchronous, so we run in executor)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: scorer.score_submission(github_url, submission_id, hosted_url)
            )

            # Update submission with results
            await update_submission_results(db, submission_id, result)

            print(f"Submission {submission_id} scoring completed: {result['status']}")

        except Exception as e:
            print(f"Error processing submission {submission_id}: {e}")
            await update_submission_status(
                db,
                submission_id,
                "failed",
                error_message=str(e),
            )


async def update_submission_status(
    db: AsyncSession,
    submission_id: str,
    status: str,
    error_message: Optional[str] = None,
):
    """Update submission status in database"""
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if submission:
        submission.status = status
        if error_message:
            submission.error_message = error_message
        await db.commit()


async def update_submission_results(
    db: AsyncSession,
    submission_id: str,
    result: dict,
):
    """Update submission with scoring results"""
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
        submission.processed_at = datetime.utcnow()
        await db.commit()


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
