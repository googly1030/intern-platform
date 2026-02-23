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


class GitHubCache:
    """Redis-based cache for GitHub commit analysis"""

    # TTL durations
    ANALYSIS_TTL = timedelta(hours=24)
    RAW_COMMITS_TTL = timedelta(hours=6)

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

    def _get_cache_key(self, owner: str, repo: str, cache_type: str = "analysis") -> str:
        """
        Generate cache key for a repository.

        Args:
            owner: Repository owner
            repo: Repository name
            cache_type: Type of cache ('analysis' or 'raw_commits')
        """
        return f"github:{cache_type}:{owner}:{repo}"

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
            key = self._get_cache_key(owner, repo, "analysis")
            cached = await client.get(key)

            if cached:
                logger.info(f"Analysis cache hit for {owner}/{repo}")
                return json.loads(cached)

            logger.info(f"Analysis cache miss for {owner}/{repo}")
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
            key = self._get_cache_key(owner, repo, "analysis")

            await client.setex(
                key,
                int(self.ANALYSIS_TTL.total_seconds()),
                json.dumps(analysis, default=str)
            )
            logger.info(f"Cached analysis for {owner}/{repo} (TTL: 24h)")
            return True
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
            return False

    async def get_raw_commits(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """
        Get cached raw commit history if available.

        Args:
            owner: Repository owner
            repo: Repository name

        Returns:
            Cached commit data dict or None if not cached
        """
        try:
            client = await self._get_client()
            key = self._get_cache_key(owner, repo, "raw_commits")
            cached = await client.get(key)

            if cached:
                logger.info(f"Raw commits cache hit for {owner}/{repo}")
                return json.loads(cached)

            logger.info(f"Raw commits cache miss for {owner}/{repo}")
            return None
        except Exception as e:
            logger.warning(f"Raw commits cache read error: {e}")
            return None

    async def set_raw_commits(
        self,
        owner: str,
        repo: str,
        commits_data: Dict[str, Any],
        ttl: Optional[timedelta] = None
    ) -> bool:
        """
        Cache raw commit data.

        Args:
            owner: Repository owner
            repo: Repository name
            commits_data: Commit data to cache (should be serializable)
            ttl: Optional custom TTL (defaults to 6 hours)

        Returns:
            True if cached successfully
        """
        try:
            client = await self._get_client()
            key = self._get_cache_key(owner, repo, "raw_commits")
            cache_ttl = ttl or self.RAW_COMMITS_TTL

            await client.setex(
                key,
                int(cache_ttl.total_seconds()),
                json.dumps(commits_data, default=str)
            )
            logger.info(f"Cached raw commits for {owner}/{repo} (TTL: {cache_ttl})")
            return True
        except Exception as e:
            logger.warning(f"Raw commits cache write error: {e}")
            return False

    async def invalidate(self, owner: str, repo: str, cache_type: Optional[str] = None) -> bool:
        """
        Invalidate cache for a specific repository.

        Args:
            owner: Repository owner
            repo: Repository name
            cache_type: Type of cache to invalidate ('analysis', 'raw_commits', or None for all)

        Returns:
            True if invalidated successfully
        """
        try:
            client = await self._get_client()

            if cache_type:
                key = self._get_cache_key(owner, repo, cache_type)
                await client.delete(key)
                logger.info(f"Invalidated {cache_type} cache for {owner}/{repo}")
            else:
                # Invalidate both cache types
                await client.delete(self._get_cache_key(owner, repo, "analysis"))
                await client.delete(self._get_cache_key(owner, repo, "raw_commits"))
                logger.info(f"Invalidated all cache for {owner}/{repo}")
            return True
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
            return False

    async def get_cached_repos(self, cache_type: Optional[str] = None) -> list:
        """
        Get list of all cached repositories.

        Args:
            cache_type: Filter by cache type ('analysis', 'raw_commits', or None for all)

        Returns:
            List of cached repository identifiers
        """
        try:
            client = await self._get_client()
            pattern = f"github:{cache_type}:*" if cache_type else "github:*"
            keys = await client.keys(pattern)
            # Extract unique repo identifiers
            repos = set()
            for k in keys:
                parts = k.split(":")
                if len(parts) >= 4:
                    repos.add(f"{parts[2]}/{parts[3]}")
            return list(repos)
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
