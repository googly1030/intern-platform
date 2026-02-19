"""
AI Reviewer Service
Uses Anthropic Claude API to review code quality
With retry logic and circuit breaker for reliability
"""

import os
import logging
from typing import Optional

import anthropic

from app.config import settings
from app.utils.resilience import (
    get_circuit_breaker,
    CircuitBreakerOpenError,
)

# Configure logger
logger = logging.getLogger(__name__)

# Circuit breaker for AI API calls
ai_circuit = get_circuit_breaker(
    name="anthropic_api",
    failure_threshold=3,
    recovery_timeout=60,  # Wait 60 seconds before retrying
)


class AIReviewer:
    """Service for AI-powered code review"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AIReviewer.

        Args:
            api_key: Anthropic API key. Defaults to settings.ANTHROPIC_API_KEY
        """
        self.api_key = api_key or getattr(settings, "ANTHROPIC_API_KEY", None)
        self.base_url = getattr(settings, "ANTHROPIC_BASE_URL", None)

        if self.api_key:
            self.client = anthropic.Anthropic(
                api_key=self.api_key,
                base_url=self.base_url
            )
        else:
            self.client = None

    def review_code_quality(
        self,
        code_files: dict,
        analysis_result: dict,
    ) -> dict:
        """
        Review code quality using AI.

        Args:
            code_files: dict mapping file paths to content
            analysis_result: Results from CodeAnalyzer

        Returns:
            dict with code quality scores and feedback
        """
        # Check if client is available
        if not self.client:
            logger.warning("AI client not configured, using default quality result")
            return self._default_quality_result("AI client not configured")

        # Check circuit breaker
        if ai_circuit.is_open:
            logger.warning("AI API circuit breaker is open, using fallback")
            return self._default_quality_result("AI service temporarily unavailable (circuit breaker open)")

        # Prepare code summary for AI
        code_summary = self._prepare_code_summary(code_files)

        prompt = f"""You are an expert code reviewer evaluating an internship candidate's PHP/JavaScript project.

The project is a signup/login/profile system with the following structure:
- Frontend: HTML, CSS, JavaScript
- Backend: PHP
- Databases: MySQL (profiles), MongoDB (registration), Redis (sessions)

Here is a summary of the code:

{code_summary}

Here are the initial analysis results:
- File Separation Score: {analysis_result.get('fileSeparation', {}).get('score', 0)}/10
- jQuery AJAX Usage: {analysis_result.get('jqueryAjax', {}).get('ajax_calls', 0)} AJAX calls found
- Bootstrap Classes: {analysis_result.get('bootstrap', {}).get('bootstrap_classes_found', [])}
- Database Usage: MySQL={analysis_result.get('databases', {}).get('mysql', {}).get('detected', False)}, MongoDB={analysis_result.get('databases', {}).get('mongodb', {}).get('detected', False)}, Redis={analysis_result.get('databases', {}).get('redis', {}).get('detected', False)}

Please evaluate the following on a scale of 0-5 and provide brief feedback:

1. **Variable Naming & Conventions** (0-5): Are variables consistently named? (camelCase for JS, snake_case for PHP)
2. **Modularity & Organization** (0-5): Is the code well-organized and modular?
3. **Error Handling** (0-5): Are there proper error handling mechanisms?
4. **Security Best Practices** (0-5): Are security measures implemented? (password hashing, input sanitization)

Also identify:
- 3-5 **Strengths** of the code
- 3-5 **Weaknesses** or areas for improvement

Respond in JSON format:
{{
    "namingConventions": {{"score": 0-5, "feedback": "..."}},
    "modularity": {{"score": 0-5, "feedback": "..."}},
    "errorHandling": {{"score": 0-5, "feedback": "..."}},
    "security": {{"score": 0-5, "feedback": "..."}},
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."]
}}
"""

        # Retry logic with exponential backoff
        max_retries = 3
        base_delay = 1.0
        import time
        import json

        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Calling AI API for code review (attempt {attempt + 1}/{max_retries + 1})")

                message = self.client.messages.create(
                    model="claude-sonnet-4-6-20250514",
                    max_tokens=1500,
                    messages=[{"role": "user", "content": prompt}],
                )

                response_text = message.content[0].text

                # Parse JSON response
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    result = json.loads(response_text[json_start:json_end])
                    # Record success for circuit breaker (sync version)
                    ai_circuit.record_success_sync()
                    logger.info("AI code review completed successfully")
                    return result

                logger.warning("Failed to parse AI response as JSON")
                return self._default_quality_result("Failed to parse AI response")

            except anthropic.RateLimitError as e:
                logger.warning(f"AI API rate limit hit (attempt {attempt + 1}): {e}")
                ai_circuit.record_failure_sync()
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt) * 2  # Extra backoff for rate limits
                    logger.info(f"Waiting {delay}s before retry due to rate limit")
                    time.sleep(delay)
                else:
                    return self._default_quality_result("AI service rate limited")

            except anthropic.APIConnectionError as e:
                logger.warning(f"AI API connection error (attempt {attempt + 1}): {e}")
                ai_circuit.record_failure_sync()
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.info(f"Waiting {delay}s before retry")
                    time.sleep(delay)
                else:
                    return self._default_quality_result("AI service unavailable (connection error)")

            except anthropic.APIStatusError as e:
                logger.error(f"AI API status error: {e}")
                ai_circuit.record_failure_sync()
                return self._default_quality_result(f"AI service error: {e.status_code}")

            except Exception as e:
                logger.error(f"Unexpected AI review error: {e}", exc_info=True)
                ai_circuit.record_failure_sync()
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                else:
                    return self._default_quality_result(f"AI review failed: {str(e)}")

        return self._default_quality_result("AI review failed after all retries")

    def detect_ai_generation(
        self,
        repo_info: dict,
        code_files: dict,
        analysis_result: dict,
    ) -> dict:
        """
        Detect if code is likely AI-generated.

        Args:
            repo_info: Repository information (commits, contributors)
            code_files: dict mapping file paths to content
            analysis_result: Results from CodeAnalyzer

        Returns:
            dict with risk_score (0.0-1.0) and indicators
        """
        logger.info("Starting AI generation detection")
        risk_score = 0.0
        indicators = []

        # Check commit history
        if repo_info.get("is_single_commit"):
            risk_score += 0.3
            indicators.append("single_commit")
            logger.debug("Single commit detected, risk +0.3")

        # Check for unusually clean code
        file_sep_score = analysis_result.get("fileSeparation", {}).get("score", 0)
        if file_sep_score == 10:
            risk_score += 0.1
            indicators.append("perfect_file_separation")
            logger.debug("Perfect file separation, risk +0.1")

        # Check for no iterations/debugging evidence
        total_commits = repo_info.get("total_commits", 0)
        if total_commits < 3:
            risk_score += 0.15
            indicators.append("few_commits")
            logger.debug(f"Few commits ({total_commits}), risk +0.15")

        # Check for generic comments (only if circuit breaker is closed)
        if self.client and not ai_circuit.is_open:
            ai_comment_risk = self._check_ai_style_comments(code_files)
            risk_score += ai_comment_risk * 0.2
            if ai_comment_risk > 0.5:
                indicators.append("ai_style_comments")
                logger.debug(f"AI-style comments detected, risk +{ai_comment_risk * 0.2:.2f}")

        # Cap at 1.0
        risk_score = min(risk_score, 1.0)

        logger.info(f"AI generation detection complete: risk={risk_score:.2f}, indicators={indicators}")

        return {
            "risk_score": round(risk_score, 2),
            "indicators": indicators,
        }

    def _check_ai_style_comments(self, code_files: dict) -> float:
        """Check for AI-style comments"""
        logger.debug("Checking for AI-style comments")
        ai_comment_patterns = [
            "this function",
            "this method",
            "handles the",
            "responsible for",
            "parameters:",
            "returns:",
            "example:",
        ]

        total_files = 0
        ai_style_files = 0

        for file_path, content in code_files.items():
            if not content:
                continue
            total_files += 1
            content_lower = content.lower()
            matches = sum(1 for p in ai_comment_patterns if p in content_lower)
            if matches >= 3:
                ai_style_files += 1
                logger.debug(f"AI-style comments detected in {file_path}")

        if total_files == 0:
            return 0.0

        ratio = ai_style_files / total_files
        logger.debug(f"AI-style comment ratio: {ratio:.2f} ({ai_style_files}/{total_files} files)")
        return ratio

    def _prepare_code_summary(self, code_files: dict) -> str:
        """Prepare a summary of code files for AI review"""
        summary_parts = []

        # Increased limits for better analysis
        max_content_length = 3000  # Increased from 500 to 3000 chars per file
        max_files = 25  # Increased from 10 to 25 files

        for file_path, content in list(code_files.items())[:max_files]:
            if not content:
                continue

            # Truncate only very long files
            if len(content) > max_content_length:
                content = content[:max_content_length] + "\n... (truncated)"

            summary_parts.append(f"### {file_path}\n```\n{content}\n```\n")

        return "\n".join(summary_parts)

    def _default_quality_result(self, reason: str = "Unable to analyze") -> dict:
        """
        Return default quality result when AI is unavailable.

        Args:
            reason: Explanation for why the default is being used

        Returns:
            Default quality result dict
        """
        logger.info(f"Using default quality result: {reason}")
        return {
            "namingConventions": {"score": 3, "feedback": f"Unable to analyze: {reason}"},
            "modularity": {"score": 3, "feedback": f"Unable to analyze: {reason}"},
            "errorHandling": {"score": 3, "feedback": f"Unable to analyze: {reason}"},
            "security": {"score": 3, "feedback": f"Unable to analyze: {reason}"},
            "strengths": ["Code submitted for review"],
            "weaknesses": [f"Automated analysis unavailable: {reason}"],
            "_fallback": True,
            "_fallback_reason": reason,
        }
