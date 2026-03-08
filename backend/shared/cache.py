"""
Cache abstraction: in-memory dict for dev, Redis for production.
Switch by setting CACHE_URL=redis://... in .env
"""

from __future__ import annotations

import time
from typing import Protocol


class CacheBackend(Protocol):
    async def get(self, key: str) -> str | None: ...
    async def set(self, key: str, value: str, ttl: int | None = None) -> None: ...
    async def delete(self, key: str) -> None: ...
    async def incr_sliding_window(self, key: str, window_seconds: int) -> int: ...


class MemoryCache:
    """In-memory cache with TTL support. Good enough for local dev."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float | None]] = {}  # key -> (value, expires_at)
        self._windows: dict[str, list[float]] = {}  # key -> list of timestamps

    def _evict(self, key: str) -> None:
        entry = self._store.get(key)
        if entry and entry[1] is not None and time.time() > entry[1]:
            del self._store[key]

    async def get(self, key: str) -> str | None:
        self._evict(key)
        entry = self._store.get(key)
        return entry[0] if entry else None

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        expires_at = (time.time() + ttl) if ttl else None
        self._store[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    async def incr_sliding_window(self, key: str, window_seconds: int) -> int:
        """Sliding window counter for rate limiting."""
        now = time.time()
        cutoff = now - window_seconds
        timestamps = self._windows.get(key, [])
        # Remove expired entries
        timestamps = [t for t in timestamps if t > cutoff]
        timestamps.append(now)
        self._windows[key] = timestamps
        return len(timestamps)


class RedisCache:
    """Redis-backed cache for production. Requires redis[hiredis] package."""

    def __init__(self, url: str) -> None:
        import redis.asyncio as redis
        self._redis = redis.from_url(url, decode_responses=True)

    async def get(self, key: str) -> str | None:
        return await self._redis.get(key)

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        if ttl:
            await self._redis.setex(key, ttl, value)
        else:
            await self._redis.set(key, value)

    async def delete(self, key: str) -> None:
        await self._redis.delete(key)

    async def incr_sliding_window(self, key: str, window_seconds: int) -> int:
        """Redis sorted-set sliding window for rate limiting."""
        import time as _time
        import uuid
        now = _time.time()
        pipe = self._redis.pipeline()
        pipe.zremrangebyscore(key, 0, now - window_seconds)
        pipe.zadd(key, {f"{now}:{uuid.uuid4().hex[:8]}": now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()
        return results[2]  # zcard result


def create_cache(url: str) -> CacheBackend:
    """Factory: returns MemoryCache or RedisCache based on URL."""
    if url == "memory":
        return MemoryCache()
    return RedisCache(url)
