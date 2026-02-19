"""
Logging Configuration
Centralized logging setup with structured output
"""

import logging
import sys
from datetime import datetime
from typing import Optional
from pathlib import Path
import json


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs structured log messages
    with consistent format and optional JSON output.
    """

    def __init__(self, json_format: bool = False):
        super().__init__()
        self.json_format = json_format

    def format(self, record: logging.LogRecord) -> str:
        # Create base log data
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add location info
        log_data["location"] = {
            "file": record.filename,
            "line": record.lineno,
            "function": record.funcName,
        }

        # Add extra fields if present
        if hasattr(record, "submission_id"):
            log_data["submission_id"] = record.submission_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "error_code"):
            log_data["error_code"] = record.error_code

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info),
            }

        if self.json_format:
            return json.dumps(log_data)

        # Human-readable format
        timestamp = log_data["timestamp"]
        level = log_data["level"]
        logger_name = log_data["logger"]
        message = log_data["message"]

        base = f"[{timestamp}] {level:8} | {logger_name:20} | {message}"

        if "exception" in log_data:
            base += f"\n{log_data['exception']['traceback']}"

        return base


class ContextFilter(logging.Filter):
    """
    Filter that adds context information to log records.
    """

    def __init__(self, context: Optional[dict] = None):
        super().__init__()
        self.context = context or {}

    def filter(self, record: logging.LogRecord) -> bool:
        for key, value in self.context.items():
            setattr(record, key, value)
        return True


def setup_logging(
    level: str = "INFO",
    json_format: bool = False,
    log_file: Optional[str] = None,
) -> logging.Logger:
    """
    Setup centralized logging configuration.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Whether to use JSON format for logs
        log_file: Optional file path for log output

    Returns:
        Root logger with configured handlers
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers
    root_logger.handlers = []

    # Create formatter
    formatter = StructuredFormatter(json_format=json_format)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    return root_logger


def get_logger(name: str, context: Optional[dict] = None) -> logging.Logger:
    """
    Get a logger with optional context.

    Args:
        name: Logger name (usually __name__)
        context: Optional context dictionary to add to all logs

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    if context:
        context_filter = ContextFilter(context)
        logger.addFilter(context_filter)

    return logger


class LogContext:
    """
    Context manager for adding temporary context to logs.
    """

    def __init__(self, logger: logging.Logger, **kwargs):
        self.logger = logger
        self.context = kwargs
        self.filter = None

    def __enter__(self):
        self.filter = ContextFilter(self.context)
        self.logger.addFilter(self.filter)
        return self.logger

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.filter:
            self.logger.removeFilter(self.filter)


# Convenience function for timing operations
class LogTimer:
    """
    Context manager for timing operations and logging duration.
    """

    def __init__(
        self,
        logger: logging.Logger,
        operation: str,
        level: int = logging.INFO,
        **extra_context
    ):
        self.logger = logger
        self.operation = operation
        self.level = level
        self.extra_context = extra_context
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.utcnow()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration_ms = (datetime.utcnow() - self.start_time).total_seconds() * 1000

            record = self.logger.makeRecord(
                self.logger.name,
                self.level,
                "",
                0,
                f"{self.operation} completed",
                (),
                None,
            )
            record.duration_ms = round(duration_ms, 2)
            for key, value in self.extra_context.items():
                setattr(record, key, value)

            self.logger.handle(record)
