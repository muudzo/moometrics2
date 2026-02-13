import json
import logging
from typing import Optional, Any
from redis import Redis
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client = Redis.from_url(settings.redis_url, decode_responses=True)

def set_cache(key: str, value: Any, ttl: int = 1800) -> bool:
    """
    Store a value in Redis with an optional TTL (default 30 mins).
    """
    try:
        serialized_value = json.dumps(value)
        return redis_client.setex(key, ttl, serialized_value)
    except Exception as e:
        logger.error(f"Error setting cache for key {key}: {e}")
        return False

def get_cache(key: str) -> Optional[Any]:
    """
    Retrieve a value from Redis.
    """
    try:
        cached_value = redis_client.get(key)
        if cached_value:
            return json.loads(cached_value)
        return None
    except Exception as e:
        logger.error(f"Error getting cache for key {key}: {e}")
        return None

def delete_cache(key: str) -> bool:
    """
    Delete a key from Redis.
    """
    try:
        return bool(redis_client.delete(key))
    except Exception as e:
        logger.error(f"Error deleting cache for key {key}: {e}")
        return False
