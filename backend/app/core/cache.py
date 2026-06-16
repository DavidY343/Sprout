import time
from typing import Dict, Any, Tuple

# Structure: { user_id: { cache_key: (value, expire_time_timestamp) } }
_cache: Dict[int, Dict[str, Tuple[Any, float]]] = {}

DEFAULT_TTL = 3600  # 1 hour by default

def get_cached_value(user_id: int, key: str) -> Any:
    user_data = _cache.get(user_id)
    if not user_data:
        return None
    entry = user_data.get(key)
    if not entry:
        return None
    value, expires_at = entry
    if time.time() > expires_at:
        # Expired, clean up
        del user_data[key]
        return None
    return value

def set_cached_value(user_id: int, key: str, value: Any, ttl: int = DEFAULT_TTL):
    if user_id not in _cache:
        _cache[user_id] = {}
    expires_at = time.time() + ttl
    _cache[user_id][key] = (value, expires_at)

def clear_user_cache(user_id: int):
    if user_id in _cache:
        _cache[user_id].clear()
        print(f"🧹 Caché del usuario {user_id} vaciada.")
