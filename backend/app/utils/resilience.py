"""
Resilience Utilities
Provides retry logic, circuit breaker pattern, and graceful degradation
"""

import asyncio
import functools
import logging
import time
from typing import Callable, Optional, Any, TypeVar, ParamSpec
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)

P = ParamSpec('P')
T = TypeVar('T')


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Failing, reject all calls
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreaker:
    """
    Circuit Breaker Pattern Implementation

    Prevents cascading failures by stopping calls to a failing service.
    After a threshold of failures, the circuit opens and rejects calls.
    After a timeout, it enters half-open state to test recovery.
    """
    name: str
    failure_threshold: int = 3
    recovery_timeout: int = 30  # seconds
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)

    async def can_execute(self) -> bool:
        """Check if we can execute a call"""
        async with self._lock:
            if self.state == CircuitState.CLOSED:
                return True

            if self.state == CircuitState.OPEN:
                # Check if recovery timeout has passed
                if self.last_failure_time:
                    elapsed = (datetime.now() - self.last_failure_time).total_seconds()
                    if elapsed >= self.recovery_timeout:
                        self.state = CircuitState.HALF_OPEN
                        logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
                        return True
                return False

            # HALF_OPEN - allow one test call
            return True

    async def record_success(self):
        """Record a successful call"""
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                logger.info(f"Circuit breaker '{self.name}' recovered - back to CLOSED")
            self.failure_count = 0
            self.state = CircuitState.CLOSED

    async def record_failure(self):
        """Record a failed call"""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = datetime.now()

            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                logger.warning(f"Circuit breaker '{self.name}' test failed - back to OPEN")
            elif self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                logger.warning(
                    f"Circuit breaker '{self.name}' opened after {self.failure_count} failures"
                )

    def record_success_sync(self):
        """Synchronous version of record_success for use in sync code"""
        if self.state == CircuitState.HALF_OPEN:
            logger.info(f"Circuit breaker '{self.name}' recovered - back to CLOSED")
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure_sync(self):
        """Synchronous version of record_failure for use in sync code"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker '{self.name}' test failed - back to OPEN")
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(
                f"Circuit breaker '{self.name}' opened after {self.failure_count} failures"
            )

    @property
    def is_open(self) -> bool:
        return self.state == CircuitState.OPEN

    def reset(self):
        """Reset the circuit breaker"""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None


def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_backoff: bool = True,
    retryable_exceptions: tuple = (Exception,),
    on_retry: Optional[Callable] = None,
):
    """
    Decorator that adds retry logic with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay cap in seconds
        exponential_backoff: Whether to use exponential backoff
        retryable_exceptions: Tuple of exception types to retry on
        on_retry: Optional callback function called on each retry

    Returns:
        Decorated function with retry logic
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts: {e}"
                        )
                        raise

                    # Calculate delay
                    if exponential_backoff:
                        delay = min(base_delay * (2 ** attempt), max_delay)
                    else:
                        delay = base_delay

                    logger.warning(
                        f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}), "
                        f"retrying in {delay:.1f}s: {e}"
                    )

                    # Call retry callback if provided
                    if on_retry:
                        try:
                            on_retry(attempt, e, delay)
                        except Exception as callback_error:
                            logger.error(f"Retry callback error: {callback_error}")

                    await asyncio.sleep(delay)

            # Should never reach here, but just in case
            raise last_exception

        @functools.wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts: {e}"
                        )
                        raise

                    # Calculate delay
                    if exponential_backoff:
                        delay = min(base_delay * (2 ** attempt), max_delay)
                    else:
                        delay = base_delay

                    logger.warning(
                        f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}), "
                        f"retrying in {delay:.1f}s: {e}"
                    )

                    # Call retry callback if provided
                    if on_retry:
                        try:
                            on_retry(attempt, e, delay)
                        except Exception as callback_error:
                            logger.error(f"Retry callback error: {callback_error}")

                    time.sleep(delay)

            # Should never reach here, but just in case
            raise last_exception

        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def with_circuit_breaker(
    circuit: CircuitBreaker,
    fallback: Optional[Callable] = None,
):
    """
    Decorator that adds circuit breaker pattern.

    Args:
        circuit: CircuitBreaker instance
        fallback: Optional fallback function when circuit is open

    Returns:
        Decorated function with circuit breaker logic
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            if not await circuit.can_execute():
                if fallback:
                    logger.info(f"Circuit '{circuit.name}' is OPEN, using fallback")
                    return await fallback(*args, **kwargs)
                raise CircuitBreakerOpenError(
                    f"Circuit breaker '{circuit.name}' is open"
                )

            try:
                result = await func(*args, **kwargs)
                await circuit.record_success()
                return result
            except Exception as e:
                await circuit.record_failure()
                raise

        @functools.wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Synchronous version - need to handle async lock
            import threading

            with threading.Lock():
                can_execute = circuit.state != CircuitState.OPEN or (
                    circuit.last_failure_time and
                    (datetime.now() - circuit.last_failure_time).total_seconds() >= circuit.recovery_timeout
                )

            if not can_execute:
                if fallback:
                    logger.info(f"Circuit '{circuit.name}' is OPEN, using fallback")
                    return fallback(*args, **kwargs)
                raise CircuitBreakerOpenError(
                    f"Circuit breaker '{circuit.name}' is open"
                )

            try:
                result = func(*args, **kwargs)
                circuit.failure_count = 0
                circuit.state = CircuitState.CLOSED
                return result
            except Exception as e:
                circuit.failure_count += 1
                circuit.last_failure_time = datetime.now()
                if circuit.failure_count >= circuit.failure_threshold:
                    circuit.state = CircuitState.OPEN
                    logger.warning(f"Circuit breaker '{circuit.name}' opened")
                raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""
    pass


# Global circuit breaker registry
_circuit_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str,
    failure_threshold: int = 3,
    recovery_timeout: int = 30,
) -> CircuitBreaker:
    """
    Get or create a circuit breaker by name.

    Args:
        name: Unique name for the circuit breaker
        failure_threshold: Number of failures before opening
        recovery_timeout: Seconds to wait before trying again

    Returns:
        CircuitBreaker instance
    """
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
        )
    return _circuit_breakers[name]


def reset_all_circuits():
    """Reset all circuit breakers"""
    for circuit in _circuit_breakers.values():
        circuit.reset()


def get_circuit_status() -> dict[str, dict]:
    """Get status of all circuit breakers"""
    return {
        name: {
            "state": circuit.state.value,
            "failure_count": circuit.failure_count,
            "is_open": circuit.is_open,
        }
        for name, circuit in _circuit_breakers.items()
    }
