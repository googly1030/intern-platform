"""
Background Worker Entry Point
Run with: python -m app.workers.worker
"""

import asyncio
import logging

from app.config import settings

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)


async def main():
    """Main worker loop"""
    logger.info(f"Starting {settings.APP_NAME} worker...")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Redis URL: {settings.REDIS_URL}")

    # TODO: Initialize RQ worker or async task processor
    # from rq import Worker, Queue, Connection
    # import redis

    # redis_conn = redis.from_url(settings.REDIS_URL)
    # with Connection(redis_conn):
    #     worker = Worker(["default"])
    #     worker.work()

    logger.info("Worker initialized. Waiting for jobs...")

    # Keep the worker running
    while True:
        await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
