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
        rules_text: Optional[str] = None,
        project_structure_text: Optional[str] = None,
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

        # Generate dynamic prompt based on provided rules and project structure
        prompt = self._generate_review_prompt(
            code_summary,
            analysis_result,
            rules_text,
            project_structure_text,
        )

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

    def _generate_review_prompt(
        self,
        code_summary: str,
        analysis_result: dict,
        rules_text: Optional[str] = None,
        project_structure_text: Optional[str] = None,
    ) -> str:
        """
        Generate dynamic review prompt based on provided rules and project structure.

        Args:
            code_summary: Summary of code files
            analysis_result: Results from CodeAnalyzer
            rules_text: Optional custom rules
            project_structure_text: Optional project structure

        Returns:
            Formatted prompt for AI review
        """
        # Determine project structure description
        if project_structure_text:
            project_structure_desc = f"""
**Project Structure (as specified):**
{project_structure_text}
"""
        else:
            project_structure_desc = """
**General Project Structure:**
An efficient, well-organized codebase should have:
- Frontend: HTML, CSS, JavaScript in separate files
- Backend: Appropriate server-side code
- Databases: Proper database integration
- Asset organization: CSS, JS, images in dedicated folders
- Clear separation of concerns between layers
"""

        # Determine evaluation criteria
        if rules_text:
            evaluation_criteria = f"""
**Custom Evaluation Rules:**
{rules_text}

Please evaluate the code based on these rules and provide:

1. **Overall Assessment Score** (0-100): How well does the code meet the specified requirements?

2. **Category Scores** (0-5 each with brief feedback):
   - namingConventions: Variable/function naming consistency
   - modularity: Code organization and separation of concerns
   - errorHandling: Error handling mechanisms
   - security: Security best practices

3. **Strengths**: List 3-5 things the code does well

4. **Weaknesses**: List 3-5 areas that need improvement

Respond in JSON format:
{{
    "overallScore": 0-100,
    "namingConventions": {{"score": 0-5, "feedback": "..."}},
    "modularity": {{"score": 0-5, "feedback": "..."}},
    "errorHandling": {{"score": 0-5, "feedback": "..."}},
    "security": {{"score": 0-5, "feedback": "..."}},
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."]
}}
"""
        else:
            # General coding standards
            evaluation_criteria = """
**General Coding Standards to Evaluate:**

Please evaluate the following on a scale of 0-5 and provide brief feedback:

1. **Variable Naming & Conventions** (0-5): Are variables consistently named following language conventions?
2. **Modularity & Organization** (0-5): Is the code well-organized and modular?
3. **Error Handling** (0-5): Are there proper error handling mechanisms?
4. **Security Best Practices** (0-5): Are security measures implemented? (password hashing, input sanitization, etc.)

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

        # Build analysis results summary - more dynamic based on what was actually found
        if rules_text:
            # Generic analysis for custom rules - show what was detected
            detected_dbs = []
            db = analysis_result.get("databases", {})
            for db_name in ["mysql", "mongodb", "redis", "postgresql", "sqlite", "mongodb"]:
                if db.get(db_name, {}).get("detected"):
                    detected_dbs.append(db_name.upper())

            detected_frameworks = []
            if analysis_result.get("bootstrap", {}).get("bootstrap_linked"):
                detected_frameworks.append("Bootstrap")
            if analysis_result.get("jqueryAjax", {}).get("ajax_calls", 0) > 0:
                detected_frameworks.append("jQuery AJAX")
            if analysis_result.get("localStorage", {}).get("detected"):
                detected_frameworks.append("localStorage")

            analysis_summary = f"""
**Initial Code Analysis:**
- Total files analyzed: {sum(1 for v in analysis_result.values() if isinstance(v, dict) and 'score' in v)}
- Detected databases: {', '.join(detected_dbs) if detected_dbs else 'None'}
- Detected frameworks: {', '.join(detected_frameworks) if detected_frameworks else 'None'}
- Code quality metrics: {analysis_result.get('codeComplexity', {}).get('avg_function_length', 0):.0f} avg function length
- Code organization score: {analysis_result.get('folderStructure', {}).get('score', 0)}/10
"""
        else:
            # Traditional analysis for general evaluation
            analysis_summary = f"""
**Initial Analysis Results:**
- File Separation Score: {analysis_result.get('fileSeparation', {}).get('score', 0)}/10
- jQuery AJAX Usage: {analysis_result.get('jqueryAjax', {}).get('ajax_calls', 0)} AJAX calls found
- Bootstrap Classes: {analysis_result.get('bootstrap', {}).get('bootstrap_classes_found', [])}
- Database Usage: MySQL={analysis_result.get('databases', {}).get('mysql', {}).get('detected', False)}, MongoDB={analysis_result.get('databases', {}).get('mongodb', {}).get('detected', False)}, Redis={analysis_result.get('databases', {}).get('redis', {}).get('detected', False)}
- Code Complexity: {analysis_result.get('codeComplexity', {}).get('avg_function_length', 0):.0f} avg function length, max nesting depth {analysis_result.get('codeComplexity', {}).get('max_nesting_depth', 0)}
- Code Duplication: {analysis_result.get('codeDuplication', {}).get('duplication_percentage', 0)}% duplication
"""

        # Combine all parts into final prompt
        prompt = f"""You are an expert code reviewer evaluating a candidate's project.

{project_structure_desc}

Here is a summary of the code:

{code_summary}

{analysis_summary}

{evaluation_criteria}
"""

        return prompt

    def detect_databases(
        self,
        code_files: dict,
        file_list: list = None,
        config_files: dict = None,
    ) -> dict:
        """
        Detect which databases are used in the project using AI analysis.

        This is a fallback when regex-based detection fails. AI can detect:
        - Database dependencies in package.json, requirements.txt, composer.json
        - Database connection patterns in various languages
        - Database-specific query syntax
        - Configuration files with database settings

        Args:
            code_files: dict mapping file paths to content
            file_list: List of all files in the project (for context)
            config_files: dict mapping config file paths to content

        Returns:
            {
                "mysql": {"detected": bool, "score": int, "evidence": []},
                "mongodb": {"detected": bool, "score": int, "evidence": []},
                "redis": {"detected": bool, "score": int, "evidence": []},
            }
        """
        # Check if client is available
        if not self.client:
            logger.warning("AI client not configured for database detection, using empty result")
            return self._default_database_result("AI client not configured")

        # Check circuit breaker
        if ai_circuit.is_open:
            logger.warning("AI API circuit breaker is open, using empty database result")
            return self._default_database_result("AI service temporarily unavailable")

        # Prepare context for AI
        context = self._prepare_database_detection_context(code_files, file_list, config_files)

        # Generate prompt
        prompt = self._generate_database_detection_prompt(context)

        # Retry logic with exponential backoff
        max_retries = 3
        base_delay = 1.0
        import time
        import json

        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Calling AI API for database detection (attempt {attempt + 1}/{max_retries + 1})")

                message = self.client.messages.create(
                    model="claude-sonnet-4-6-20250514",
                    max_tokens=1000,
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
                    logger.info(f"AI database detection completed: mysql={result.get('mysql', {}).get('detected')}, "
                               f"mongodb={result.get('mongodb', {}).get('detected')}, "
                               f"redis={result.get('redis', {}).get('detected')}")
                    return result

                logger.warning("Failed to parse AI database detection response as JSON")
                return self._default_database_result("Failed to parse AI response")

            except anthropic.RateLimitError as e:
                logger.warning(f"AI API rate limit hit (attempt {attempt + 1}): {e}")
                ai_circuit.record_failure_sync()
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt) * 2  # Extra backoff for rate limits
                    logger.info(f"Waiting {delay}s before retry due to rate limit")
                    time.sleep(delay)
                else:
                    return self._default_database_result("AI service rate limited")

            except anthropic.APIConnectionError as e:
                logger.warning(f"AI API connection error (attempt {attempt + 1}): {e}")
                ai_circuit.record_failure_sync()
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.info(f"Waiting {delay}s before retry")
                    time.sleep(delay)
                else:
                    return self._default_database_result("AI service unavailable (connection error)")

            except anthropic.APIStatusError as e:
                logger.error(f"AI API status error: {e}")
                ai_circuit.record_failure_sync()
                return self._default_database_result(f"AI service error: {e.status_code}")

            except Exception as e:
                logger.error(f"Unexpected AI database detection error: {e}", exc_info=True)
                ai_circuit.record_failure_sync()
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                else:
                    return self._default_database_result(f"AI detection failed: {str(e)}")

        return self._default_database_result("AI database detection failed after all retries")

    def _prepare_database_detection_context(
        self,
        code_files: dict,
        file_list: list = None,
        config_files: dict = None,
    ) -> dict:
        """Prepare context for database detection analysis"""
        context = {
            "all_files": file_list or list(code_files.keys()),
            "code_summary": "",
            "config_summary": "",
            "dependency_indicators": {},
        }

        # Group files by type for better context
        file_groups = {
            "js": [],
            "ts": [],
            "py": [],
            "php": [],
            "go": [],
            "java": [],
            "config": [],
            "other": [],
        }

        for file_path in code_files.keys():
            ext = file_path.split(".")[-1].lower()
            if ext in file_groups:
                file_groups[ext].append(file_path)
            elif any(x in file_path.lower() for x in ["config", "env", ".env"]):
                file_groups["config"].append(file_path)
            else:
                file_groups["other"].append(file_path)

        # Add code summary (truncated for efficiency)
        max_files = 15
        max_content_length = 2000

        for file_path in list(code_files.keys())[:max_files]:
            content = code_files[file_path]
            if content and len(content) > max_content_length:
                content = content[:max_content_length] + "\n... (truncated)"
            if content:
                context["code_summary"] += f"\n### {file_path}\n```\n{content}\n```\n"

        # Add config files
        if config_files:
            for file_path, content in config_files.items():
                if content:
                    context["config_summary"] += f"\n### {file_path}\n```\n{content}\n```\n"

        # Check for dependency indicators
        for file_path in code_files.keys():
            content = code_files[file_path]
            if not content:
                continue

            # Check for MySQL indicators
            if any(x in content.lower() for x in ["mysql", "mysqli", "pdo mysql", "@mysql/client"]):
                if "mysql" not in context["dependency_indicators"]:
                    context["dependency_indicators"]["mysql"] = []
                context["dependency_indicators"]["mysql"].append(file_path)

            # Check for MongoDB indicators
            if any(x in content.lower() for x in ["mongodb", "mongo", "mongoose", "@mongodb/client"]):
                if "mongodb" not in context["dependency_indicators"]:
                    context["dependency_indicators"]["mongodb"] = []
                context["dependency_indicators"]["mongodb"].append(file_path)

            # Check for Redis indicators
            if any(x in content.lower() for x in ["redis", "ioredis", "@redis/client"]):
                if "redis" not in context["dependency_indicators"]:
                    context["dependency_indicators"]["redis"] = []
                context["dependency_indicators"]["redis"].append(file_path)

        context["file_groups"] = file_groups
        return context

    def _generate_database_detection_prompt(self, context: dict) -> str:
        """Generate prompt for database detection"""
        prompt = """You are an expert code analyzer. Your task is to detect which databases are used in a codebase.

Analyze the following code and determine if MySQL, MongoDB, or Redis are used.

**Database Detection Criteria:**

MySQL is considered detected if you find:
- Connection code: mysqli, PDO with mysql, mysql2 (Node.js), @mysql/client, Sequelize MySQL, TypeORM MySQL
- SQL queries: SELECT, INSERT, UPDATE, DELETE with MySQL-specific syntax
- Configuration: DB_HOST, DB_DATABASE, mysql:// connection strings

MongoDB is considered detected if you find:
- Connection code: MongoClient, mongoose, mongodb driver, @mongodb/client
- MongoDB operations: db.collection(), find(), insertOne(), aggregate()
- Configuration: mongodb:// connection strings, MONGODB_URI

Redis is considered detected if you find:
- Connection code: Redis, ioredis, @redis/client, node-redis, predis
- Redis operations: set(), get(), hset(), incr(), expire()
- Configuration: REDIS_HOST, redis:// connection strings

**Important:**
- Look at imports/requires (import, require, use, include)
- Look at configuration files (package.json, requirements.txt, composer.json, .env files)
- Look at connection initialization code
- Look at actual database queries/operations

**Project Files:**
"""

        # Add file list
        if context.get("all_files"):
            prompt += f"\nTotal files: {len(context['all_files'])}\n"
            # Show interesting files
            interesting = [f for f in context['all_files'] if any(
                x in f.lower() for x in ['config', 'db', 'database', 'model', 'connection', 'package.json', 'requirements.txt']
            )]
            if interesting:
                prompt += f"Files of interest:\n{chr(10).join(interesting[:20])}\n"

        # Add dependency indicators
        if context.get("dependency_indicators"):
            prompt += "\n**Database Keywords Found In:**\n"
            for db, files in context["dependency_indicators"].items():
                prompt += f"- {db.upper()}: {', '.join(files[:5])}\n"

        # Add code summary
        if context.get("code_summary"):
            prompt += f"\n{context['code_summary']}\n"

        # Add config summary
        if context.get("config_summary"):
            prompt += f"\n**Configuration Files:**\n{context['config_summary']}\n"

        prompt += """
Respond in JSON format ONLY:
{
    "mysql": {
        "detected": true/false,
        "score": 0-8,
        "evidence": ["specific file/function/pattern that indicates MySQL usage"]
    },
    "mongodb": {
        "detected": true/false,
        "score": 0-8,
        "evidence": ["specific file/function/pattern that indicates MongoDB usage"]
    },
    "redis": {
        "detected": true/false,
        "score": 0-5,
        "evidence": ["specific file/function/pattern that indicates Redis usage"]
    }
}

Be thorough - if there's ANY evidence of database usage, set detected=true and provide the evidence.
"""
        return prompt

    def _default_database_result(self, reason: str = "Unable to detect") -> dict:
        """Return default empty database result when AI is unavailable"""
        logger.info(f"Using default database result: {reason}")
        return {
            "mysql": {"detected": False, "score": 0, "evidence": [f"AI unavailable: {reason}"]},
            "mongodb": {"detected": False, "score": 0, "evidence": [f"AI unavailable: {reason}"]},
            "redis": {"detected": False, "score": 0, "evidence": [f"AI unavailable: {reason}"]},
            "_fallback": True,
            "_fallback_reason": reason,
        }

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
