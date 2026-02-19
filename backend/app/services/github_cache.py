"""
GitHub Data Cache Service
Caches GitHub commit analysis in Redis to avoid API rate limits
"""

import json
import logging
from typing import Optional, Dict, Any
from datetime import timedelta

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

# Cache TTL: 24 hours
CACHE_TTL = timedelta(hours=24)


class GitHubCache:
    """Redis-based cache for GitHub commit analysis"""

    def __init__(self):
        self._client: Optional[redis.Redis] = None

    async def _get_client(self) -> redis.Redis:
        """Get or create Redis client"""
        if self._client is None:
            self._client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
        return self._client

    def _get_cache_key(self, owner: str, repo: str) -> str:
        """Generate cache key for a repository"""
        return f"github:commits:{owner}:{repo}"

    async def get_commit_analysis(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """
        Get cached commit analysis if available.

        Args:
            owner: Repository owner
            repo: Repository name

        Returns:
            Cached analysis dict or None if not cached
        """
        try:
            client = await self._get_client()
            key = self._get_cache_key(owner, repo)
            cached = await client.get(key)

            if cached:
                logger.info(f"Cache hit for {owner}/{repo}")
                return json.loads(cached)

            logger.info(f"Cache miss for {owner}/{repo}")
            return None
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
            return None

    async def set_commit_analysis(
        self,
        owner: str,
        repo: str,
        analysis: Dict[str, Any]
    ) -> bool:
        """
        Cache commit analysis for 24 hours.

        Args:
            owner: Repository owner
            repo: Repository name
            analysis: Analysis result to cache

        Returns:
            True if cached successfully
        """
        try:
            client = await self._get_client()
            key = self._get_cache_key(owner, repo)

            await client.setex(
                key,
                int(CACHE_TTL.total_seconds()),
                json.dumps(analysis, default=str)
            )
            logger.info(f"Cached analysis for {owner}/{repo} (TTL: 24h)")
            return True
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
            return False

    async def invalidate(self, owner: str, repo: str) -> bool:
        """
        Invalidate cache for a specific repository.

        Args:
            owner: Repository owner
            repo: Repository name

        Returns:
            True if invalidated successfully
        """
        try:
            client = await self._get_client()
            key = self._get_cache_key(owner, repo)
            await client.delete(key)
            logger.info(f"Invalidated cache for {owner}/{repo}")
            return True
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
            return False

    async def get_cached_repos(self) -> list:
        """
        Get list of all cached repositories.

        Returns:
            List of cached repository keys
        """
        try:
            client = await self._get_client()
            keys = await client.keys("github:commits:*")
            return [k.replace("github:commits:", "") for k in keys]
        except Exception as e:
            logger.warning(f"Failed to get cached repos: {e}")
            return []

    async def close(self):
        """Close Redis connection"""
        if self._client:
            await self._client.close()
            self._client = None


# Singleton instance
github_cache = GitHubCache()
