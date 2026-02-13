import time
import logging
from enum import Enum
from typing import Callable, Any, Optional

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreaker:
    def __init__(
        self, 
        name: str, 
        failure_threshold: int = 5, 
        recovery_timeout: int = 60,
        time_window: int = 60
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.time_window = time_window
        
        self.state = CircuitState.CLOSED
        self.failures = []
        self.last_failure_time = 0
        self.opened_at = 0

    def _cleanup_old_failures(self):
        now = time.time()
        self.failures = [f for f in self.failures if now - f < self.time_window]

    def call(self, func: Callable, *args, **kwargs) -> Any:
        now = time.time()
        
        if self.state == CircuitState.OPEN:
            if now - self.opened_at > self.recovery_timeout:
                logger.info(f"Circuit Breaker [{self.name}] transitioning to HALF_OPEN")
                self.state = CircuitState.HALF_OPEN
            else:
                logger.warning(f"Circuit Breaker [{self.name}] is OPEN. Rejecting call.")
                raise Exception(f"Circuit Breaker [{self.name}] is OPEN")

        try:
            result = func(*args, **kwargs)
            
            if self.state == CircuitState.HALF_OPEN:
                logger.info(f"Circuit Breaker [{self.name}] SUCCESS. Transitioning to CLOSED")
                self.state = CircuitState.CLOSED
                self.failures = []
            
            return result
        except Exception as e:
            self.failures.append(now)
            self._cleanup_old_failures()
            
            if len(self.failures) >= self.failure_threshold:
                logger.error(f"Circuit Breaker [{self.name}] threshold reached. Opening circuit.")
                self.state = CircuitState.OPEN
                self.opened_at = now
            
            raise e

# Global instances for major external services
openai_breaker = CircuitBreaker("OpenAI", failure_threshold=5, recovery_timeout=120)
weather_breaker = CircuitBreaker("OpenWeather", failure_threshold=5, recovery_timeout=60)
