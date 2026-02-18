"""
Deployment Checker Service
Validates hosted URLs and video URLs
"""

import re
from typing import Optional
from urllib.parse import urlparse

import httpx


class DeploymentChecker:
    """Service for validating deployed URLs"""

    def __init__(self, timeout: int = 10):
        """
        Initialize DeploymentChecker.

        Args:
            timeout: HTTP request timeout in seconds
        """
        self.timeout = timeout

    def validate_hosted_url(self, url: Optional[str]) -> dict:
        """
        Validate a hosted/deployed URL.

        Args:
            url: The hosted URL to validate

        Returns:
            dict with validation results:
            - valid: bool - URL is accessible
            - status_code: int - HTTP status code
            - response_time: float - Response time in seconds
            - error: str - Error message if failed
            - is_https: bool - Uses HTTPS
            - domain: str - Domain name
        """
        result = {
            "valid": False,
            "status_code": None,
            "response_time": None,
            "error": None,
            "is_https": False,
            "domain": None,
        }

        if not url:
            result["error"] = "No URL provided"
            return result

        # Parse URL
        try:
            parsed = urlparse(url)
            result["domain"] = parsed.netloc
            result["is_https"] = parsed.scheme == "https"

            # Add scheme if missing
            if not parsed.scheme:
                url = "https://" + url
                parsed = urlparse(url)
                result["is_https"] = True
                result["domain"] = parsed.netloc

        except Exception as e:
            result["error"] = f"Invalid URL format: {str(e)}"
            return result

        # Make HTTP request
        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                response = client.get(url)
                result["status_code"] = response.status_code
                result["valid"] = 200 <= response.status_code < 400

        except httpx.TimeoutException:
            result["error"] = "Request timed out"
        except httpx.ConnectError:
            result["error"] = "Could not connect to server"
        except httpx.HTTPError as e:
            result["error"] = f"HTTP error: {str(e)}"
        except Exception as e:
            result["error"] = f"Error: {str(e)}"

        return result

    def validate_video_url(self, url: Optional[str]) -> dict:
        """
        Validate a video/demo URL.

        Args:
            url: The video URL to validate

        Returns:
            dict with validation results:
            - valid: bool - URL is accessible
            - platform: str - Video platform (YouTube, Drive, etc.)
            - error: str - Error message if failed
        """
        result = {
            "valid": False,
            "platform": None,
            "error": None,
        }

        if not url:
            result["error"] = "No URL provided"
            return result

        # Detect platform
        platform_patterns = {
            "YouTube": [r"youtube\.com", r"youtu\.be"],
            "Google Drive": [r"drive\.google\.com"],
            "Vimeo": [r"vimeo\.com"],
            "Loom": [r"loom\.com"],
            "Google Photos": [r"photos\.google\.com", r"photos\.app\.goo\.gl"],
        }

        for platform, patterns in platform_patterns.items():
            for pattern in patterns:
                if re.search(pattern, url, re.IGNORECASE):
                    result["platform"] = platform
                    break
            if result["platform"]:
                break

        if not result["platform"]:
            result["platform"] = "Unknown"

        # Validate URL is accessible
        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                response = client.head(url)  # HEAD request to check without downloading
                result["valid"] = 200 <= response.status_code < 400

        except Exception:
            # For video URLs, we'll be more lenient - just check URL format
            # since some platforms may block HEAD requests
            try:
                parsed = urlparse(url)
                result["valid"] = bool(parsed.scheme and parsed.netloc)
            except Exception:
                result["valid"] = False
                result["error"] = "Invalid URL format"

        return result

    def check_deployment(self, hosted_url: Optional[str], video_url: Optional[str]) -> dict:
        """
        Check both hosted and video URLs.

        Args:
            hosted_url: Deployed application URL
            video_url: Demo video URL

        Returns:
            dict with combined results
        """
        result = {
            "hosted": self.validate_hosted_url(hosted_url),
            "video": self.validate_video_url(video_url),
            "deployment_score": 0,
            "flags": [],
        }

        # Calculate deployment score
        if result["hosted"]["valid"]:
            result["deployment_score"] = 3  # Full marks for working deployment
        elif hosted_url:
            result["deployment_score"] = 0  # URL provided but not working
            result["flags"].append("DEPLOYMENT_NOT_ACCESSIBLE")
        else:
            result["deployment_score"] = 0  # No URL provided
            result["flags"].append("NO_DEPLOYMENT")

        # Add flag for video
        if video_url and not result["video"]["valid"]:
            result["flags"].append("VIDEO_URL_INVALID")
        elif video_url and result["video"]["valid"]:
            result["flags"].append("VIDEO_DEMO_PROVIDED")

        return result
