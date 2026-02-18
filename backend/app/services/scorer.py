"""
Scorer Service
Orchestrates all analysis services and calculates final score
"""

import os
from typing import Optional

from app.services.repo_cloner import RepoCloner
from app.services.code_analyzer import CodeAnalyzer
from app.services.ai_reviewer import AIReviewer
from app.services.deployment_checker import DeploymentChecker


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
    ):
        """
        Initialize Scorer.

        Args:
            repos_dir: Directory to clone repos into
            api_key: Anthropic API key for AI review
        """
        self.repo_cloner = RepoCloner(repos_dir)
        self.ai_reviewer = AIReviewer(api_key)
        self.deployment_checker = DeploymentChecker()

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
        }

        try:
            # Step 1: Clone repository
            repo_path = self.repo_cloner.clone(github_url, submission_id)
            result["repo_path"] = repo_path

            # Step 2: Get repo info
            repo_info = self.repo_cloner.get_repo_info(repo_path)

            # Step 3: Analyze code
            analyzer = CodeAnalyzer(repo_path)
            analysis = analyzer.analyze_all()
            result["analysis_details"] = analysis

            # Step 4: Get code files for AI review
            code_files = self._get_code_files(repo_path)

            # Step 5: AI review
            ai_quality = self.ai_reviewer.review_code_quality(code_files, analysis)

            # Step 6: AI generation detection
            ai_detection = self.ai_reviewer.detect_ai_generation(
                repo_info, code_files, analysis
            )
            result["ai_generation_risk"] = ai_detection["risk_score"]

            # Step 7: Check deployment (hosted URL and video URL)
            deployment_result = self.deployment_checker.check_deployment(hosted_url, None)
            result["deployment_check"] = deployment_result

            # Step 8: Calculate scores
            scores = self._calculate_scores(analysis, ai_quality)
            # Add deployment score
            scores["deployment"] = deployment_result["deployment_score"]
            result["scores"] = scores

            # Step 9: Generate flags
            flags = self._generate_flags(analysis, ai_detection)
            # Add deployment flags
            flags.extend(deployment_result["flags"])
            result["flags"] = flags

            # Step 10: Calculate overall score
            overall_score = self._calculate_overall_score(scores)
            result["overall_score"] = overall_score

            # Step 11: Determine grade
            for threshold, grade, recommendation in self.GRADE_THRESHOLDS:
                if overall_score >= threshold:
                    result["grade"] = grade
                    result["recommendation"] = recommendation
                    break

            # Step 12: Get strengths and weaknesses
            result["strengths"] = self._get_strengths(analysis, ai_quality, deployment_result)
            result["weaknesses"] = self._get_weaknesses(analysis, ai_quality, deployment_result)

            result["status"] = "completed"

        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)

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
                            return code_files
                    except Exception:
                        pass

        return code_files

    def cleanup(self, submission_id: str) -> bool:
        """Clean up cloned repository"""
        return self.repo_cloner.cleanup(submission_id)
