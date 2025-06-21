import os
import redis


def get_redis_client():
    """Create a Redis Client"""
    # Check if full Redis URL is provided first
    redis_url = os.getenv("REDIS_URL")
    
    if redis_url:
        return redis.from_url(redis_url, decode_responses=True)
    
    # Fallback to individual connection parameters
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=int(os.getenv("REDIS_DB", 0)),
        password=os.getenv("REDIS_PASSWORD"),
        decode_responses=True
    )
    
    return redis_client
