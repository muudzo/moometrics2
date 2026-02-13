"""
Weather service for fetching data from OpenWeatherMap API with Redis caching and Circuit Breaker protection.
"""

import httpx
import logging
import time
from app.core.config import get_settings
from app.models.schemas import WeatherResponse
from app.core.cache import get_cache, set_cache
from app.core.circuit_breaker import weather_breaker, CircuitState

settings = get_settings()
logger = logging.getLogger(__name__)


async def get_weather_by_coordinates(
    latitude: float, longitude: float
) -> WeatherResponse:
    """
    Fetch weather data for given coordinates from OpenWeatherMap API,
    with Redis caching and Circuit Breaker.
    """
    cache_key = f"weather:{latitude}:{longitude}"
    
    # 1. Check Redis Cache
    cached_data = get_cache(cache_key)
    if cached_data:
        logger.info(f"Cache HIT for weather at {latitude}, {longitude}")
        return WeatherResponse(**cached_data)

    logger.info(f"Cache MISS for weather at {latitude}, {longitude}")
    
    # 2. Check Circuit Breaker State
    now = time.time()
    if weather_breaker.state == CircuitState.OPEN:
        if now - weather_breaker.opened_at > weather_breaker.recovery_timeout:
            weather_breaker.state = CircuitState.HALF_OPEN
        else:
            logger.warning(f"Circuit Breaker [OpenWeather] is OPEN. Serving mock data.")
            return _get_mock_weather("Circuit Breaker OPEN")

    # 3. Handle Mock Data (No API Key)
    if (
        settings.openweather_api_key == "YOUR_API_KEY"
        or not settings.openweather_api_key
    ):
        logger.info("Using mock weather data (no API key configured)")
        mock_res = _get_mock_weather("No API Key")
        set_cache(cache_key, mock_res.model_dump(), ttl=settings.cache_ttl_seconds)
        return mock_res

    # 4. Fetch Real Data with Resilience
    url = f"{settings.openweather_base_url}/weather"
    params = {
        "lat": latitude,
        "lon": longitude,
        "units": "metric",
        "appid": settings.openweather_api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            logger.info(f"Fetching weather for: {latitude}, {longitude}")
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            res = WeatherResponse(
                temperature=round(data["main"]["temp"], 1),
                condition=data["weather"][0]["main"],
                location=data.get("name", "Unknown Location"),
                humidity=data["main"]["humidity"],
                wind_speed=round(data["wind"]["speed"], 1),
                icon=data["weather"][0]["icon"],
            )

            # Success: Reset breaker if in HALF_OPEN
            if weather_breaker.state == CircuitState.HALF_OPEN:
                logger.info(f"Circuit Breaker [OpenWeather] CLOSED")
                weather_breaker.state = CircuitState.CLOSED
                weather_breaker.failures = []

            # Cache successful response
            set_cache(cache_key, res.model_dump(), ttl=settings.cache_ttl_seconds)
            return res

    except Exception as e:
        # Failure: Record and potentially open breaker
        weather_breaker.failures.append(time.time())
        weather_breaker._cleanup_old_failures()
        if len(weather_breaker.failures) >= weather_breaker.failure_threshold:
            logger.error(f"Circuit Breaker [OpenWeather] OPENING")
            weather_breaker.state = CircuitState.OPEN
            weather_breaker.opened_at = time.time()
        
        logger.error(f"Error fetching real weather: {e}")
        return _get_mock_weather(f"API Error: {str(e)}")


def _get_mock_weather(reason: str) -> WeatherResponse:
    """Return mock weather data with reason in location."""
    return WeatherResponse(
        temperature=22.0,
        condition="Sunny",
        location=f"Mock Data ({reason})",
        humidity=45,
        wind_speed=12.0,
        icon="01d",
    )
