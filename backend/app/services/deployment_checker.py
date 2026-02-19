"""
Deployment Checker Service
Validates hosted URLs and video URLs
Includes screenshot capture and multi-page validation
"""

import os
import re
import logging
import asyncio
from typing import Optional
from urllib.parse import urlparse, urljoin

import httpx

logger = logging.getLogger(__name__)


class DeploymentChecker:
    """Service for validating deployed URLs with screenshot capture"""

    def __init__(self, timeout: int = 10, screenshots_dir: str = "./screenshots"):
        """
        Initialize DeploymentChecker.

        Args:
            timeout: HTTP request timeout in seconds
            screenshots_dir: Directory to save screenshots
        """
        self.timeout = timeout
        self.screenshots_dir = screenshots_dir
        os.makedirs(screenshots_dir, exist_ok=True)

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
            "pages": [],
            "screenshots": {},
            "responsive_check": None,
            "flags": [],
        }

        # Calculate deployment score
        if result["hosted"]["valid"]:
            result["deployment_score"] = 3  # Full marks for working deployment

            # Validate multiple pages
            if hosted_url:
                page_results = self.validate_multiple_pages(hosted_url)
                result["pages"] = page_results

                # Check responsive design
                result["responsive_check"] = self.check_responsive_design(hosted_url)

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

    def validate_multiple_pages(self, base_url: str) -> list:
        """
        Validate that expected pages exist.

        Args:
            base_url: Base URL of the deployed application

        Returns:
            List of page validation results
        """
        # Simply use the discover_all_pages method
        return self._discover_all_pages(base_url)

    def _discover_all_pages(self, base_url: str) -> list:
        """
        Discover ALL pages on the website by scanning links.
        Simple approach - just find all .html/.php pages and validate them.

        Args:
            base_url: Base URL of the deployed application

        Returns:
            List of discovered pages with their URLs
        """
        discovered_pages = []
        seen_urls = set()

        try:
            parsed_base = urlparse(base_url)
            base_domain = parsed_base.netloc

            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                response = client.get(base_url)

                if response.status_code == 200:
                    content = response.text

                    # Find all links (href attributes)
                    all_links = re.findall(r'href=["\']([^"\']+)["\']', content, re.IGNORECASE)

                    for link in all_links:
                        # Skip anchors, javascript, mailto, tel
                        if link.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                            continue

                        # Skip external links
                        if link.startswith(('http://', 'https://')):
                            link_parsed = urlparse(link)
                            if link_parsed.netloc != base_domain:
                                continue

                        # Make absolute URL
                        absolute_url = urljoin(base_url, link)

                        # Skip if already seen
                        if absolute_url in seen_urls:
                            continue

                        # Only include HTML/PHP pages (skip CSS, JS, images, etc.)
                        link_lower = link.lower().split('?')[0].split('#')[0]
                        if not any(link_lower.endswith(ext) for ext in ['.html', '.htm', '.php', '/']):
                            # Also allow paths without extensions
                            if '.' in link_lower.split('/')[-1]:
                                continue

                        # Validate the page exists with a quick HEAD request
                        try:
                            head_response = client.head(absolute_url, follow_redirects=True, timeout=5)
                            if head_response.status_code < 400:
                                seen_urls.add(absolute_url)

                                # Extract page name from URL
                                page_name = self._extract_page_name(link)

                                discovered_pages.append({
                                    "name": page_name,
                                    "url": absolute_url,
                                    "path": link,
                                    "valid": True,
                                })
                        except Exception:
                            pass  # Skip invalid/unreachable pages

        except Exception as e:
            logger.warning(f"Failed to discover pages: {e}")

        # Always add the homepage first
        if base_url not in seen_urls:
            discovered_pages.insert(0, {
                "name": "index",
                "url": base_url,
                "path": "/",
                "valid": True,
            })

        return discovered_pages

    def _extract_page_name(self, path: str) -> str:
        """
        Extract a clean page name from the path.

        Args:
            path: URL path

        Returns:
            Clean page name
        """
        # Remove query string and fragment
        path = path.split('?')[0].split('#')[0]
        # Remove leading/trailing slashes
        path = path.strip('/')

        if not path:
            return "index"

        # Get filename without extension
        filename = path.split('/')[-1]
        name = filename.rsplit('.', 1)[0] if '.' in filename else filename

        return name or "page"

    def _discover_page_paths(self, base_url: str) -> dict:
        """
        Discover actual page paths by analyzing links on the index page.

        Args:
            base_url: Base URL of the deployed application

        Returns:
            dict mapping page names to their actual URLs
        """
        discovered = {}

        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                response = client.get(base_url)

                if response.status_code == 200:
                    content = response.text.lower()

                    # Look for common patterns in links
                    patterns = {
                        "login": [r'href=["\']([^"\']*login[^"\']*\.html)["\']',
                                  r'href=["\']([^"\']*signin[^"\']*\.html)["\']'],
                        "register": [r'href=["\']([^"\']*register[^"\']*\.html)["\']',
                                     r'href=["\']([^"\']*signup[^"\']*\.html)["\']'],
                        "profile": [r'href=["\']([^"\']*profile[^"\']*\.html)["\']',
                                    r'href=["\']([^"\']*dashboard[^"\']*\.html)["\']',
                                    r'href=["\']([^"\']*account[^"\']*\.html)["\']'],
                    }

                    for page_name, regex_list in patterns.items():
                        for pattern in regex_list:
                            matches = re.findall(pattern, content, re.IGNORECASE)
                            if matches:
                                # Get the first match and make it absolute
                                found_path = matches[0]
                                discovered[page_name] = urljoin(base_url, found_path)
                                break

        except Exception as e:
            logger.warning(f"Failed to discover page paths: {e}")

        return discovered

    def check_responsive_design(self, url: str) -> dict:
        """
        Check if the page is responsive by testing with different viewport sizes.
        This is a basic check - looks for viewport meta tag and Bootstrap usage.

        Args:
            url: URL to check

        Returns:
            dict with responsive design check results
        """
        result = {
            "has_viewport_meta": False,
            "has_responsive_framework": False,
            "score": 0,
        }

        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                response = client.get(url)

                if response.status_code == 200:
                    content = response.text.lower()

                    # Check for viewport meta tag
                    if 'viewport' in content and 'width=device-width' in content:
                        result["has_viewport_meta"] = True

                    # Check for responsive frameworks
                    responsive_indicators = [
                        'bootstrap',
                        'tailwind',
                        'foundation',
                        'bulma',
                        '@media',
                        'max-width',
                        'min-width',
                    ]
                    for indicator in responsive_indicators:
                        if indicator in content:
                            result["has_responsive_framework"] = True
                            break

                    # Calculate score
                    if result["has_viewport_meta"]:
                        result["score"] += 1
                    if result["has_responsive_framework"]:
                        result["score"] += 1

        except Exception as e:
            logger.warning(f"Responsive design check failed: {e}")

        return result

    async def capture_screenshots(self, url: str, submission_id: str) -> dict:
        """
        Capture screenshots of ALL pages on the deployed website.
        Uses Playwright for browser automation.

        Args:
            url: URL to capture
            submission_id: Submission ID for naming screenshots

        Returns:
            dict with screenshot paths
        """
        screenshots = {}

        try:
            from playwright.async_api import async_playwright

            # Discover ALL pages on the website
            logger.info(f"Scanning website for all pages: {url}")
            discovered_pages = self._discover_all_pages(url)
            logger.info(f"Found {len(discovered_pages)} pages: {[p['name'] for p in discovered_pages]}")

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={"width": 1280, "height": 720}
                )
                page = await context.new_page()

                # Capture screenshot of each discovered page
                for page_info in discovered_pages:
                    page_name = page_info["name"]
                    page_url = page_info["url"]

                    try:
                        await page.goto(page_url, timeout=15000, wait_until="networkidle")

                        # Wait for fonts to load
                        await page.wait_for_timeout(2000)

                        # Wait for document fonts to be ready
                        await page.evaluate_handle("document.fonts.ready")

                        # Create safe filename
                        safe_name = page_name.replace("/", "_").replace("\\", "_")
                        screenshot_name = f"{submission_id}_{safe_name}.png"
                        screenshot_path = os.path.join(self.screenshots_dir, screenshot_name)

                        await page.screenshot(path=screenshot_path, full_page=False)
                        screenshots[page_name] = screenshot_path
                        logger.info(f"Captured: {screenshot_name} <- {page_url}")

                    except Exception as e:
                        logger.warning(f"Failed to capture {page_name}: {e}")
                        screenshots[page_name] = None

                # Capture mobile view of homepage
                try:
                    mobile_context = await browser.new_context(
                        viewport={"width": 375, "height": 667},
                        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
                    )
                    mobile_page = await mobile_context.new_page()
                    await mobile_page.goto(url, timeout=15000, wait_until="networkidle")

                    # Wait for fonts to load
                    await mobile_page.wait_for_timeout(2000)
                    await mobile_page.evaluate_handle("document.fonts.ready")

                    mobile_screenshot = f"{submission_id}_mobile.png"
                    mobile_path = os.path.join(self.screenshots_dir, mobile_screenshot)
                    await mobile_page.screenshot(path=mobile_path)
                    screenshots["mobile"] = mobile_path
                    logger.info(f"Captured mobile screenshot: {mobile_screenshot}")

                except Exception as e:
                    logger.warning(f"Failed to capture mobile screenshot: {e}")

                await browser.close()

        except ImportError:
            logger.warning("Playwright not installed, skipping screenshots")
            screenshots["error"] = "Playwright not installed"

        except Exception as e:
            logger.error(f"Screenshot capture failed: {e}")
            screenshots["error"] = str(e)

        return screenshots

    def capture_screenshots_sync(self, url: str, submission_id: str) -> dict:
        """
        Synchronous wrapper for capture_screenshots.

        Args:
            url: URL to capture
            submission_id: Submission ID for naming screenshots

        Returns:
            dict with screenshot paths
        """
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            # If loop is already running, we can't use asyncio.run
            # Return empty result and log warning
            logger.warning("Cannot capture screenshots from async context")
            return {"error": "Cannot run from async context"}

        return loop.run_until_complete(self.capture_screenshots(url, submission_id))
