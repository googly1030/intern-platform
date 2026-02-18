"""
AI Reviewer Service
Uses Anthropic Claude API to review code quality
"""

import os
from typing import Optional

import anthropic

from app.config import settings


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
        if not self.client:
            return self._default_quality_result()

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

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-6-20250514",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text

            # Parse JSON response
            import json
            # Extract JSON from response
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(response_text[json_start:json_end])
            return self._default_quality_result()

        except Exception as e:
            print(f"AI review error: {e}")
            return self._default_quality_result()

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
        risk_score = 0.0
        indicators = []

        # Check commit history
        if repo_info.get("is_single_commit"):
            risk_score += 0.3
            indicators.append("single_commit")

        # Check for unusually clean code
        file_sep_score = analysis_result.get("fileSeparation", {}).get("score", 0)
        if file_sep_score == 10:
            risk_score += 0.1
            indicators.append("perfect_file_separation")

        # Check for no iterations/debugging evidence
        total_commits = repo_info.get("total_commits", 0)
        if total_commits < 3:
            risk_score += 0.15
            indicators.append("few_commits")

        # Check for generic comments
        if self.client:
            ai_comment_risk = self._check_ai_style_comments(code_files)
            risk_score += ai_comment_risk * 0.2
            if ai_comment_risk > 0.5:
                indicators.append("ai_style_comments")

        # Cap at 1.0
        risk_score = min(risk_score, 1.0)

        return {
            "risk_score": round(risk_score, 2),
            "indicators": indicators,
        }

    def _check_ai_style_comments(self, code_files: dict) -> float:
        """Check for AI-style comments"""
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

        if total_files == 0:
            return 0.0
        return ai_style_files / total_files

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

    def _default_quality_result(self) -> dict:
        """Return default quality result when AI is unavailable"""
        return {
            "namingConventions": {"score": 3, "feedback": "Unable to analyze"},
            "modularity": {"score": 3, "feedback": "Unable to analyze"},
            "errorHandling": {"score": 3, "feedback": "Unable to analyze"},
            "security": {"score": 3, "feedback": "Unable to analyze"},
            "strengths": ["Code submitted for review"],
            "weaknesses": ["Automated analysis unavailable"],
        }
