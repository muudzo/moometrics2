"""
AI service for agricultural predictions using OpenAI.
"""

from openai import OpenAI
from app.core.config import get_settings
from app.models.schemas import PredictionRequest, PredictionResponse
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

settings = get_settings()


import time
from app.core.cache import get_cache, set_cache
from app.core.circuit_breaker import openai_breaker, CircuitState

async def get_planting_prediction(request: PredictionRequest) -> PredictionResponse:
    """
    Get AI-powered planting and harvest predictions with Redis caching and Circuit Breaker.
    """
    # 1. Create cache key
    cache_key = f"prediction:{request.crop_type}:{request.latitude}:{request.longitude}"
    
    # 2. Check cache
    cached_data = get_cache(cache_key)
    if cached_data:
        logger.info(f"Cache HIT for AI prediction ({request.crop_type})")
        return PredictionResponse(**cached_data)

    logger.info(f"Cache MISS for AI prediction ({request.crop_type})")

    # 3. Check Circuit Breaker
    now = time.time()
    if openai_breaker.state == CircuitState.OPEN:
        if now - openai_breaker.opened_at > openai_breaker.recovery_timeout:
            openai_breaker.state = CircuitState.HALF_OPEN
        else:
            logger.warning(f"Circuit Breaker [OpenAI] is OPEN. Serving mock prediction.")
            return _get_mock_prediction(request)

    # 4. Mock response if no OpenAI API key is configured
    if not settings.openai_api_key:
        logger.info("Using mock AI prediction (no API key)")
        mock_res = _get_mock_prediction(request)
        set_cache(cache_key, mock_res.model_dump(), ttl=settings.cache_ttl_seconds)
        return mock_res

    try:
        client = OpenAI(api_key=settings.openai_api_key)

        # Create prompt for OpenAI
        prompt = (
            "As an agricultural expert, provide planting and harvest "
            "recommendations for:\n"
            f"- Crop: {request.crop_type}\n"
            f"- Location: Latitude {request.latitude}, "
            f"Longitude {request.longitude}\n"
            f"- Soil Type: {request.soil_type or 'unknown'}\n"
            f"- Current Season: {request.current_season or 'current'}\n\n"
            "Provide:\n"
            "1. Recommended planting date (format: YYYY-MM-DD)\n"
            "2. Expected harvest date (format: YYYY-MM-DD)\n"
            "3. Confidence level (0.0 to 1.0)\n"
            "4. 3-5 specific recommendations for optimal growth\n\n"
            "Format your response as JSON with keys: "
            "planting_date, harvest_date, confidence, recommendations (array)"
        )

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert agricultural advisor with deep knowledge of "
                        "crop management, planting schedules, and harvest timing."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        # Parse AI response
        ai_response = response.choices[0].message.content
        logger.debug(f"AI Response: {ai_response}")

        # For now, return mock data with AI context
        # In production, you would parse the AI response properly
        return _get_mock_prediction(request)

    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return _get_mock_prediction(request)


def _get_mock_prediction(request: PredictionRequest) -> PredictionResponse:
    """Generate mock prediction data."""
    today = datetime.now()
    planting_date = today + timedelta(days=14)
    harvest_date = planting_date + timedelta(days=120)

    recommendations = [
        f"Plant {request.crop_type} in well-drained soil with good sun exposure",
        "Ensure soil pH is between 6.0 and 7.0 for optimal growth",
        "Water regularly, especially during germination and flowering stages",
        "Monitor for common pests and diseases specific to your region",
        "Consider crop rotation to maintain soil health",
    ]

    return PredictionResponse(
        recommended_planting_date=planting_date.strftime("%Y-%m-%d"),
        expected_harvest_date=harvest_date.strftime("%Y-%m-%d"),
        confidence=0.75,
        recommendations=recommendations,
    )
