"""
Scorer Service
Orchestrates all analysis services and calculates final score
With comprehensive logging and progress tracking
"""

import os
import logging
import time
from typing import Optional, Callable
from datetime import datetime

from app.services.repo_cloner import RepoCloner
from app.services.code_analyzer import CodeAnalyzer
from app.services.ai_reviewer import AIReviewer
from app.services.deployment_checker import DeploymentChecker

# Configure logger
logger = logging.getLogger(__name__)


class Scorer:
    """Main scoring orchestrator"""

    # Grade thresholds
    GRADE_THRESHOLDS = [
        (90, "A+", "Strong interview candidate"),
        (80, "A", "Interview recommended"),
        (70, "B", "Consider for interview"),
        (60, "C", "Request more information"),
        (50, "D", "Reject with feedback"),
        (0, "F", "Auto-reject"),
    ]

    # Critical flags that auto-reject
    CRITICAL_FLAGS = [
        "NO_BOOTSTRAP",
        "FORM_SUBMISSION_USED",
        "SQL_INJECTION_RISK",
        "PHP_SESSION_USED",
        "NO_MYSQL",
        "NO_MONGODB",
        "NO_REDIS",
    ]

    # Warning flags
    WARNING_FLAGS = [
        "CODE_MIXING",
        "POOR_FOLDER_STRUCTURE",
        "NO_ERROR_HANDLING",
        "AI_GENERATED_HIGH",
        "NO_DEPLOYMENT",
    ]

    def __init__(
        self,
        repos_dir: Optional[str] = None,
        api_key: Optional[str] = None,
        progress_callback: Optional[Callable[[str, str, int, str], None]] = None,
    ):
        """
        Initialize Scorer.

        Args:
            repos_dir: Directory to clone repos into
            api_key: Anthropic API key for AI review
            progress_callback: Optional callback for progress updates
                Callback signature: (submission_id, stage, progress_percent, message)
        """
        self.repo_cloner = RepoCloner(repos_dir)
        self.ai_reviewer = AIReviewer(api_key)
        self.deployment_checker = DeploymentChecker()
        self.progress_callback = progress_callback
        logger.info("Scorer initialized")

    def _report_progress(self, submission_id: str, stage: str, progress: int, message: str = ""):
        """
        Report progress to callback if available.

        Args:
            submission_id: Submission ID
            stage: Current processing stage
            progress: Progress percentage (0-100)
            message: Optional status message
        """
        logger.info(f"[{submission_id}] Progress: {progress}% - {stage} - {message}")
        if self.progress_callback:
            try:
                self.progress_callback(submission_id, stage, progress, message)
            except Exception as e:
                logger.error(f"Progress callback error: {e}")

    def score_submission(
        self,
        github_url: str,
        submission_id: str,
        hosted_url: Optional[str] = None,
    ) -> dict:
        """
        Score a submission from GitHub URL.

        Args:
            github_url: GitHub repository URL
            submission_id: Unique ID for the submission
            hosted_url: Optional hosted deployment URL

        Returns:
            dict with complete score report
        """
        start_time = time.time()
        logger.info(f"[{submission_id}] Starting scoring for {github_url}")

        result = {
            "status": "processing",
            "repo_path": None,
            "overall_score": 0,
            "grade": "F",
            "recommendation": "Auto-reject",
            "scores": {},
            "flags": [],
            "ai_generation_risk": 0.0,
            "strengths": [],
            "weaknesses": [],
            "screenshots": {},
            "analysis_details": {},
            "error": None,
            "processing_time_ms": 0,
        }

        try:
            # Step 1: Clone repository (10%)
            self._report_progress(submission_id, "cloning", 10, "Cloning repository...")
            logger.info(f"[{submission_id}] Cloning repository from {github_url}")
            clone_start = time.time()
            repo_path = self.repo_cloner.clone(github_url, submission_id)
            clone_time = (time.time() - clone_start) * 1000
            logger.info(f"[{submission_id}] Repository cloned to {repo_path} in {clone_time:.0f}ms")
            result["repo_path"] = repo_path

            # Step 2: Get repo info (20%)
            self._report_progress(submission_id, "analyzing", 20, "Getting repository info...")
            logger.info(f"[{submission_id}] Getting repository info")
            repo_info = self.repo_cloner.get_repo_info(repo_path)
            logger.debug(f"[{submission_id}] Repo info: {repo_info.get('total_commits', 0)} commits")

            # Step 3: Analyze code (40%)
            self._report_progress(submission_id, "analyzing", 40, "Analyzing code structure...")
            logger.info(f"[{submission_id}] Starting code analysis")
            analysis_start = time.time()
            analyzer = CodeAnalyzer(repo_path)
            analysis = analyzer.analyze_all()
            analysis_time = (time.time() - analysis_start) * 1000
            logger.info(f"[{submission_id}] Code analysis completed in {analysis_time:.0f}ms")
            result["analysis_details"] = analysis

            # Step 4: Get code files for AI review (50%)
            self._report_progress(submission_id, "ai_review", 50, "Preparing files for AI review...")
            logger.info(f"[{submission_id}] Getting code files for AI review")
            code_files = self._get_code_files(repo_path)
            logger.info(f"[{submission_id}] Found {len(code_files)} code files")

            # Step 5: AI review (70%)
            self._report_progress(submission_id, "ai_review", 70, "Running AI code review...")
            logger.info(f"[{submission_id}] Starting AI code quality review")
            ai_start = time.time()
            ai_quality = self.ai_reviewer.review_code_quality(code_files, analysis)
            ai_time = (time.time() - ai_start) * 1000
            logger.info(f"[{submission_id}] AI review completed in {ai_time:.0f}ms")

            # Check if AI review was a fallback
            if ai_quality.get("_fallback"):
                logger.warning(f"[{submission_id}] AI review used fallback: {ai_quality.get('_fallback_reason')}")

            # Step 6: AI generation detection (80%)
            self._report_progress(submission_id, "ai_detection", 80, "Detecting AI-generated code...")
            logger.info(f"[{submission_id}] Starting AI generation detection")
            ai_detection = self.ai_reviewer.detect_ai_generation(
                repo_info, code_files, analysis
            )
            result["ai_generation_risk"] = ai_detection["risk_score"]
            logger.info(f"[{submission_id}] AI generation risk: {ai_detection['risk_score']}")

            # Step 7: Check deployment (85%)
            self._report_progress(submission_id, "deployment", 85, "Checking deployment...")
            logger.info(f"[{submission_id}] Checking deployment for {hosted_url}")
            deployment_result = self.deployment_checker.check_deployment(hosted_url, None)
            result["deployment_check"] = deployment_result
            logger.info(f"[{submission_id}] Deployment check: {deployment_result.get('status', 'unknown')}")

            # Capture screenshots if deployment is valid
            if hosted_url and deployment_result.get("hosted", {}).get("valid"):
                logger.info(f"[{submission_id}] Capturing screenshots...")
                try:
                    screenshots = self.deployment_checker.capture_screenshots_sync(hosted_url, submission_id)
                    result["screenshots"] = screenshots
                    # Also store in deployment_result for reference
                    deployment_result["screenshots"] = screenshots
                    logger.info(f"[{submission_id}] Screenshots captured: {list(screenshots.keys())}")
                except Exception as e:
                    logger.warning(f"[{submission_id}] Screenshot capture failed: {e}")
                    result["screenshots"] = {"error": str(e)}

            # Step 8: Calculate scores (90%)
            self._report_progress(submission_id, "scoring", 90, "Calculating final scores...")
            logger.info(f"[{submission_id}] Calculating scores")
            scores = self._calculate_scores(analysis, ai_quality)
            scores["deployment"] = deployment_result["deployment_score"]
            result["scores"] = scores

            # Step 9: Generate flags
            logger.info(f"[{submission_id}] Generating flags")
            flags = self._generate_flags(analysis, ai_detection)
            flags.extend(deployment_result["flags"])
            result["flags"] = flags
            logger.info(f"[{submission_id}] Flags: {flags}")

            # Step 10: Calculate overall score
            overall_score = self._calculate_overall_score(scores)
            result["overall_score"] = overall_score
            logger.info(f"[{submission_id}] Overall score: {overall_score}")

            # Step 11: Determine grade
            for threshold, grade, recommendation in self.GRADE_THRESHOLDS:
                if overall_score >= threshold:
                    result["grade"] = grade
                    result["recommendation"] = recommendation
                    break
            logger.info(f"[{submission_id}] Grade: {result['grade']} - {result['recommendation']}")

            # Step 12: Get strengths and weaknesses
            result["strengths"] = self._get_strengths(analysis, ai_quality, deployment_result)
            result["weaknesses"] = self._get_weaknesses(analysis, ai_quality, deployment_result)

            result["status"] = "completed"
            result["processing_time_ms"] = int((time.time() - start_time) * 1000)

            self._report_progress(submission_id, "completed", 100, "Analysis complete!")
            logger.info(f"[{submission_id}] Scoring completed in {result['processing_time_ms']}ms")

        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)
            result["processing_time_ms"] = int((time.time() - start_time) * 1000)
            logger.error(f"[{submission_id}] Scoring failed: {e}", exc_info=True)
            self._report_progress(submission_id, "failed", 0, f"Error: {str(e)}")

        return result

    def _calculate_scores(self, analysis: dict, ai_quality: dict) -> dict:
        """Calculate individual category scores"""
        scores = {}

        # Critical Requirements (40 points total)
        scores["fileSeparation"] = analysis.get("fileSeparation", {}).get("score", 0)
        scores["jqueryAjax"] = analysis.get("jqueryAjax", {}).get("score", 0)
        scores["bootstrap"] = analysis.get("bootstrap", {}).get("score", 0)
        scores["preparedStatements"] = analysis.get("preparedStatements", {}).get("score", 0)

        # Database Implementation (25 points total)
        db = analysis.get("databases", {})
        scores["mysql"] = db.get("mysql", {}).get("score", 0)
        scores["mongodb"] = db.get("mongodb", {}).get("score", 0)
        scores["redis"] = db.get("redis", {}).get("score", 0)
        scores["localStorage"] = analysis.get("localStorage", {}).get("score", 0)

        # Code Quality (20 points total)
        quality = ai_quality if isinstance(ai_quality, dict) else {}
        scores["namingConventions"] = quality.get("namingConventions", {}).get("score", 3)
        scores["modularity"] = quality.get("modularity", {}).get("score", 3)
        scores["errorHandling"] = quality.get("errorHandling", {}).get("score", 3)
        scores["security"] = quality.get("security", {}).get("score", 3)

        # Folder Structure (10 points)
        scores["folderStructure"] = analysis.get("folderStructure", {}).get("score", 0)

        # Deployment & Extras (5 points)
        scores["deployment"] = 0  # Will be updated if hosted URL is valid
        scores["bonusFeatures"] = 0  # Will be updated based on extra features

        return scores

    def _calculate_overall_score(self, scores: dict) -> int:
        """Calculate overall score from category scores"""
        # Critical Requirements (40%)
        critical = (
            scores.get("fileSeparation", 0) +
            scores.get("jqueryAjax", 0) +
            scores.get("bootstrap", 0) +
            scores.get("preparedStatements", 0)
        )

        # Database Implementation (25%)
        database = (
            scores.get("mysql", 0) +
            scores.get("mongodb", 0) +
            scores.get("redis", 0) +
            scores.get("localStorage", 0)
        )

        # Code Quality (20%)
        quality = (
            scores.get("namingConventions", 0) +
            scores.get("modularity", 0) +
            scores.get("errorHandling", 0) +
            scores.get("security", 0)
        )

        # Folder Structure (10%)
        structure = scores.get("folderStructure", 0)

        # Deployment & Extras (5%)
        extras = scores.get("deployment", 0) + scores.get("bonusFeatures", 0)

        # Total (already weighted by point values)
        total = critical + database + quality + structure + extras

        return min(100, max(0, int(total)))

    def _generate_flags(self, analysis: dict, ai_detection: dict) -> list:
        """Generate flags based on analysis"""
        flags = []

        # Check critical flags
        if analysis.get("bootstrap", {}).get("score", 0) == 0:
            flags.append("NO_BOOTSTRAP")

        if "FORM_SUBMISSION_USED" in analysis.get("jqueryAjax", {}).get("issues", []):
            flags.append("FORM_SUBMISSION_USED")

        if "SQL_INJECTION_RISK" in analysis.get("preparedStatements", {}).get("issues", []):
            flags.append("SQL_INJECTION_RISK")

        if not analysis.get("databases", {}).get("mysql", {}).get("detected"):
            flags.append("NO_MYSQL")

        if not analysis.get("databases", {}).get("mongodb", {}).get("detected"):
            flags.append("NO_MONGODB")

        if not analysis.get("databases", {}).get("redis", {}).get("detected"):
            flags.append("NO_REDIS")

        # Check warning flags
        if analysis.get("fileSeparation", {}).get("score", 0) < 7:
            flags.append("CODE_MIXING")

        if analysis.get("folderStructure", {}).get("score", 0) < 7:
            flags.append("POOR_FOLDER_STRUCTURE")

        if ai_detection.get("risk_score", 0) > 0.6:
            flags.append("AI_GENERATED_HIGH")

        return flags

    def _get_strengths(self, analysis: dict, ai_quality: dict, deployment_result: dict = None) -> list:
        """Identify strengths from analysis"""
        strengths = []

        if ai_quality and isinstance(ai_quality, dict):
            strengths.extend(ai_quality.get("strengths", []))

        # Add technical strengths
        if analysis.get("fileSeparation", {}).get("score", 0) == 10:
            strengths.append("Perfect file separation (HTML/CSS/JS/PHP)")

        if analysis.get("preparedStatements", {}).get("prepared_statements", 0) > 0:
            strengths.append("Uses prepared statements for SQL")

        if analysis.get("jqueryAjax", {}).get("ajax_calls", 0) > 0:
            strengths.append("Implements jQuery AJAX for backend calls")

        if analysis.get("bootstrap", {}).get("bootstrap_linked"):
            strengths.append("Uses Bootstrap for responsive design")

        if analysis.get("databases", {}).get("mysql", {}).get("detected"):
            strengths.append("MySQL database implemented")

        if analysis.get("databases", {}).get("mongodb", {}).get("detected"):
            strengths.append("MongoDB database implemented")

        if analysis.get("databases", {}).get("redis", {}).get("detected"):
            strengths.append("Redis for session management")

        if analysis.get("localStorage", {}).get("detected"):
            strengths.append("localStorage for frontend sessions")

        # Add deployment strengths
        if deployment_result:
            if deployment_result.get("hosted", {}).get("valid"):
                strengths.append("Project successfully deployed and accessible online")
            if deployment_result.get("video", {}).get("valid"):
                strengths.append("Video demonstration provided")

        return strengths[:5]  # Limit to 5

    def _get_weaknesses(self, analysis: dict, ai_quality: dict, deployment_result: dict = None) -> list:
        """Identify weaknesses from analysis"""
        weaknesses = []

        if ai_quality and isinstance(ai_quality, dict):
            weaknesses.extend(ai_quality.get("weaknesses", []))

        # Add technical weaknesses
        if analysis.get("fileSeparation", {}).get("score", 0) < 7:
            weaknesses.append("Code mixing (HTML/CSS/JS/PHP in same files)")

        if analysis.get("jqueryAjax", {}).get("form_submissions", 0) > 0:
            weaknesses.append("Uses form submission instead of AJAX")

        if analysis.get("bootstrap", {}).get("score", 0) < 7:
            weaknesses.append("Bootstrap not properly implemented")

        if not analysis.get("databases", {}).get("mysql", {}).get("detected"):
            weaknesses.append("MySQL database not implemented")

        if not analysis.get("databases", {}).get("mongodb", {}).get("detected"):
            weaknesses.append("MongoDB database not implemented")

        if not analysis.get("databases", {}).get("redis", {}).get("detected"):
            weaknesses.append("Redis not implemented")

        if not analysis.get("localStorage", {}).get("detected"):
            weaknesses.append("localStorage not used for sessions")

        # Add deployment weaknesses
        if deployment_result:
            if not deployment_result.get("hosted", {}).get("valid"):
                weaknesses.append("No working deployment provided")
            if "DEPLOYMENT_NOT_ACCESSIBLE" in deployment_result.get("flags", []):
                weaknesses.append("Deployment URL is not accessible")

        return weaknesses[:5]  # Limit to 5

    def _get_code_files(self, repo_path: str, max_files: int = 20) -> dict:
        """Get code files content for AI review"""
        code_files = {}
        extensions = [".php", ".js", ".html", ".css"]

        count = 0
        for root, _, files in os.walk(repo_path):
            # Skip .git directory
            if ".git" in root:
                continue

            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            code_files[file_path] = f.read()
                        count += 1
                        if count >= max_files:
                            logger.debug(f"Reached max file limit ({max_files})")
                            return code_files
                    except Exception as e:
                        logger.warning(f"Could not read file {file_path}: {e}")

        logger.debug(f"Loaded {len(code_files)} code files for analysis")
        return code_files

    def cleanup(self, submission_id: str) -> bool:
        """Clean up cloned repository"""
        return self.repo_cloner.cleanup(submission_id)
