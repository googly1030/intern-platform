"""
Redis Queue Service
Manages background job processing with RQ
"""

import logging
from typing import Optional, Dict, Any

import redis
from rq import Queue
from rq.job import Job
from rq.exceptions import NoSuchJobError

from app.config import settings

logger = logging.getLogger(__name__)


class QueueService:
    """Service for managing Redis Queue jobs"""

    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._queue: Optional[Queue] = None

    @property
    def redis(self) -> redis.Redis:
        """Get or create Redis connection"""
        if self._redis is None:
            self._redis = redis.from_url(settings.REDIS_URL)
        return self._redis

    @property
    def queue(self) -> Queue:
        """Get or create the submissions queue"""
        if self._queue is None:
            self._queue = Queue("submissions", connection=self.redis)
        return self._queue

    def enqueue_submission(
        self,
        submission_id: str,
        github_url: str,
        hosted_url: Optional[str] = None
    ) -> str:
        """
        Queue a submission for processing.

        Args:
            submission_id: UUID of the submission
            github_url: GitHub repository URL
            hosted_url: Optional hosted/demo URL

        Returns:
            Job ID
        """
        from app.workers.scoring_worker import process_submission_sync

        job = self.queue.enqueue(
            process_submission_sync,
            submission_id,
            github_url,
            hosted_url,
            job_id=f"sub_{submission_id[:8]}",
            job_timeout="10m",  # 10 minute timeout
            result_ttl=3600,    # Keep results for 1 hour
            failure_ttl=86400,  # Keep failure info for 24 hours
        )
        logger.info(f"Queued submission {submission_id} as job {job.id}")
        return job.id

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a queued job.

        Args:
            job_id: The job identifier

        Returns:
            Job status dict or None if not found
        """
        try:
            job = Job.fetch(job_id, connection=self.redis)
            return {
                "id": job.id,
                "status": job.get_status(),
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "ended_at": job.ended_at.isoformat() if job.ended_at else None,
                "result": job.result,
                "exc_info": job.exc_info,
                "meta": job.meta,
            }
        except NoSuchJobError:
            return None
        except Exception as e:
            logger.error(f"Error fetching job {job_id}: {e}")
            return None

    def get_queue_stats(self) -> Dict[str, Any]:
        """
        Get queue statistics.

        Returns:
            Dict with queue counts
        """
        try:
            return {
                "queued": len(self.queue),
                "started_jobs": self.queue.started_job_registry.count,
                "finished_jobs": self.queue.finished_job_registry.count,
                "failed_jobs": self.queue.failed_job_registry.count,
            }
        except Exception as e:
            logger.error(f"Error getting queue stats: {e}")
            return {
                "queued": 0,
                "started_jobs": 0,
                "finished_jobs": 0,
                "failed_jobs": 0,
                "error": str(e)
            }

    def clear_failed_jobs(self) -> int:
        """
        Clear all failed jobs from the queue.

        Returns:
            Number of jobs cleared
        """
        try:
            count = self.queue.failed_job_registry.count
            self.queue.failed_job_registry.empty()
            logger.info(f"Cleared {count} failed jobs")
            return count
        except Exception as e:
            logger.error(f"Error clearing failed jobs: {e}")
            return 0


# Singleton instance
queue_service = QueueService()
