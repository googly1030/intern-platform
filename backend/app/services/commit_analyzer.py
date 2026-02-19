"""
Commit Analyzer Service
Analyzes GitHub commit history for AI-generated content detection and patterns
"""

import re
import logging
from typing import Optional
from collections import defaultdict
from datetime import datetime

import httpx

from app.config import settings
from app.services.github_cache import github_cache

logger = logging.getLogger(__name__)


class CommitAnalyzer:
    """Service for analyzing commit history for suspicious patterns"""

    # AI-generated commit message patterns
    AI_COMMIT_PATTERNS = [
        r"^Update\s+\w+\.py$",  # Generic "Update file.py"
        r"^Add\s+\w+",  # Generic "Add feature"
        r"^Fix\s+\w+",  # Generic "Fix bug"
        r"^Implement\s+\w+",  # Generic "Implement feature"
        r"^Refactor\s+\w+",  # Generic "Refactor code"
        r"^Clean up",  # Generic cleanup
        r"^Initial commit$",  # Very common AI pattern
        r"^Update README\.md$",  # Generic README update
        r"^WIP",  # Work in progress (sometimes AI)
        r"^\w+: \w+",  # Type: description format (conventional commits, often AI)
    ]

    # Suspicious patterns
    SUSPICIOUS_PATTERNS = {
        "bulk_commits": "Multiple commits in very short time",
        "copy_paste": "Large additions without deletions",
        "perfect_messages": "All commit messages follow exact same pattern",
        "no_iterations": "No bug fixes or iterations after initial commits",
    }

    def __init__(self, timeout: int = 30, github_token: Optional[str] = None):
        self.timeout = timeout
        self.github_token = github_token or settings.GITHUB_TOKEN

    def _get_headers(self) -> dict:
        """Get headers for GitHub API requests"""
        headers = {"Accept": "application/vnd.github.v3+json"}
        if self.github_token:
            headers["Authorization"] = f"token {self.github_token}"
        return headers

    async def analyze_commits(
        self,
        owner: str,
        repo: str,
        max_commits: int = 100
    ) -> dict:
        """
        Analyze commit history for AI-generated content and patterns.

        Args:
            owner: GitHub repository owner
            repo: Repository name
            max_commits: Maximum commits to analyze

        Returns:
            dict with analysis results
        """
        # Check cache first
        cached = await github_cache.get_commit_analysis(owner, repo)
        if cached:
            logger.info(f"Using cached analysis for {owner}/{repo}")
            return cached

        result = {
            "total_commits": 0,
            "ai_risk_score": 0.0,
            "findings": [],
            "commit_patterns": {},
            "timeline_analysis": {},
            "author_analysis": {},
            "recommendations": [],
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Fetch commits with details
                commits_response = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/commits",
                    params={"per_page": max_commits},
                    headers=self._get_headers()
                )

                if commits_response.status_code != 200:
                    result["findings"].append({
                        "type": "error",
                        "message": f"Could not fetch commits: HTTP {commits_response.status_code}"
                    })
                    return result

                commits = commits_response.json()
                result["total_commits"] = len(commits)

                if not commits:
                    result["findings"].append({
                        "type": "info",
                        "message": "No commits found in repository"
                    })
                    return result

                # Analyze commit patterns
                result["commit_patterns"] = self._analyze_commit_patterns(commits)

                # Analyze timeline
                result["timeline_analysis"] = self._analyze_timeline(commits)

                # Analyze authors
                result["author_analysis"] = self._analyze_authors(commits)

                # Calculate AI risk score
                result["ai_risk_score"] = self._calculate_ai_risk(
                    commits,
                    result["commit_patterns"],
                    result["timeline_analysis"]
                )

                # Generate findings
                result["findings"] = self._generate_findings(
                    commits,
                    result["commit_patterns"],
                    result["timeline_analysis"],
                    result["ai_risk_score"]
                )

                # Generate recommendations
                result["recommendations"] = self._generate_recommendations(result)

        except httpx.TimeoutException:
            result["findings"].append({
                "type": "error",
                "message": "GitHub API timeout"
            })
        except Exception as e:
            logger.error(f"Commit analysis failed: {e}")
            result["findings"].append({
                "type": "error",
                "message": f"Analysis failed: {str(e)}"
            })

        # Cache the result for 24 hours (only if no errors)
        if not any(f.get("type") == "error" for f in result.get("findings", [])):
            await github_cache.set_commit_analysis(owner, repo, result)

        return result

    def _analyze_commit_patterns(self, commits: list) -> dict:
        """Analyze commit message patterns"""
        patterns = {
            "ai_pattern_matches": 0,
            "short_messages": 0,
            "generic_messages": 0,
            "conventional_commits": 0,
            "message_lengths": [],
            "common_patterns": defaultdict(int),
        }

        for commit in commits:
            message = commit.get("commit", {}).get("message", "")
            first_line = message.split("\n")[0]
            patterns["message_lengths"].append(len(first_line))

            # Check for AI patterns
            for pattern in self.AI_COMMIT_PATTERNS:
                if re.match(pattern, first_line, re.IGNORECASE):
                    patterns["ai_pattern_matches"] += 1
                    patterns["common_patterns"][pattern] += 1
                    break

            # Check message length
            if len(first_line) < 15:
                patterns["short_messages"] += 1

            # Check for generic messages
            generic_words = ["update", "fix", "add", "change", "modify", "clean"]
            if any(word in first_line.lower() for word in generic_words) and len(first_line) < 30:
                patterns["generic_messages"] += 1

            # Check conventional commits format
            if re.match(r"^(feat|fix|docs|style|refactor|test|chore):", first_line.lower()):
                patterns["conventional_commits"] += 1

        patterns["common_patterns"] = dict(patterns["common_patterns"])
        patterns["avg_message_length"] = (
            sum(patterns["message_lengths"]) / len(patterns["message_lengths"])
            if patterns["message_lengths"] else 0
        )

        return patterns

    def _analyze_timeline(self, commits: list) -> dict:
        """Analyze commit timeline for suspicious patterns"""
        timeline = {
            "total_days": 0,
            "commits_per_day": 0,
            "bulk_commit_sessions": 0,
            "first_commit": None,
            "last_commit": None,
            "commit_spikes": [],
            "working_hours": defaultdict(int),
        }

        if not commits:
            return timeline

        dates = []
        for commit in commits:
            commit_data = commit.get("commit", {})
            author = commit_data.get("author", {})
            date_str = author.get("date", "")

            if date_str:
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    dates.append(dt)
                    timeline["working_hours"][dt.hour] += 1
                except:
                    pass

        if not dates:
            return timeline

        dates.sort()  # Sort ascending: oldest first, newest last
        timeline["first_commit"] = dates[0].isoformat() if dates else None  # Oldest (first made)
        timeline["last_commit"] = dates[-1].isoformat() if dates else None  # Newest (most recent)

        # Calculate span
        if len(dates) >= 2:
            span = (dates[-1] - dates[0]).total_seconds() / 86400  # Days (newest - oldest)
            timeline["total_days"] = max(1, span)
            timeline["commits_per_day"] = len(commits) / timeline["total_days"]

        # Detect bulk commit sessions (3+ commits within 1 hour)
        for i in range(len(dates) - 2):
            if (dates[i + 2] - dates[i]).total_seconds() < 3600:
                timeline["bulk_commit_sessions"] += 1

        timeline["working_hours"] = dict(timeline["working_hours"])

        return timeline

    def _analyze_authors(self, commits: list) -> dict:
        """Analyze commit authors"""
        authors = {
            "total_authors": 0,
            "author_commits": defaultdict(int),
            "single_author": False,
        }

        for commit in commits:
            author = commit.get("commit", {}).get("author", {}).get("name", "Unknown")
            authors["author_commits"][author] += 1

        authors["total_authors"] = len(authors["author_commits"])
        authors["author_commits"] = dict(authors["author_commits"])
        authors["single_author"] = authors["total_authors"] == 1

        return authors

    def _calculate_ai_risk(
        self,
        commits: list,
        patterns: dict,
        timeline: dict
    ) -> float:
        """Calculate AI generation risk score (0-1)"""
        risk = 0.0
        total_commits = len(commits)

        if total_commits == 0:
            return 0.0

        # Factor 1: AI pattern matches in commit messages
        ai_match_ratio = patterns["ai_pattern_matches"] / total_commits
        risk += ai_match_ratio * 0.25

        # Factor 2: Short, generic messages
        short_ratio = patterns["short_messages"] / total_commits
        risk += short_ratio * 0.15

        # Factor 3: Bulk commits (many commits in short time)
        if timeline["commits_per_day"] > 5:
            risk += 0.20
        elif timeline["commits_per_day"] > 3:
            risk += 0.10

        # Factor 4: All commits from single author
        if timeline.get("bulk_commit_sessions", 0) > 2:
            risk += 0.15

        # Factor 5: Very short project duration with many commits
        if timeline["total_days"] < 1 and total_commits > 5:
            risk += 0.25
        elif timeline["total_days"] < 3 and total_commits > 10:
            risk += 0.15

        # Factor 6: All conventional commits (often AI-generated)
        if patterns["conventional_commits"] == total_commits and total_commits > 5:
            risk += 0.10

        return min(1.0, risk)

    def _generate_findings(
        self,
        commits: list,
        patterns: dict,
        timeline: dict,
        ai_risk: float
    ) -> list:
        """Generate human-readable findings"""
        findings = []
        total_commits = len(commits)

        # AI Risk assessment
        if ai_risk > 0.7:
            findings.append({
                "type": "warning",
                "icon": "psychology_alt",
                "title": "High AI Generation Risk",
                "message": f"Commit patterns suggest {int(ai_risk * 100)}% likelihood of AI-assisted code generation",
                "details": "Multiple indicators detected: generic commit messages, bulk commits, short project duration"
            })
        elif ai_risk > 0.4:
            findings.append({
                "type": "info",
                "icon": "info",
                "title": "Moderate AI Generation Risk",
                "message": f"Some patterns suggest possible AI assistance ({int(ai_risk * 100)}% risk)",
                "details": "Review commit messages and timeline for verification"
            })
        else:
            findings.append({
                "type": "success",
                "icon": "verified",
                "title": "Low AI Generation Risk",
                "message": "Commit patterns appear natural and authentic",
                "details": f"AI risk score: {int(ai_risk * 100)}%"
            })

        # Commit message analysis
        if patterns["ai_pattern_matches"] > total_commits * 0.5:
            findings.append({
                "type": "warning",
                "icon": "edit_note",
                "title": "Generic Commit Messages",
                "message": f"{patterns['ai_pattern_matches']} of {total_commits} commits have generic messages",
                "details": "Messages like 'Update file.py', 'Fix bug' are common in AI-generated commits"
            })

        # Timeline analysis
        if timeline["commits_per_day"] > 5:
            findings.append({
                "type": "warning",
                "icon": "schedule",
                "title": "Unusual Commit Frequency",
                "message": f"{timeline['commits_per_day']:.1f} commits per day average",
                "details": "High commit frequency may indicate bulk uploading or AI assistance"
            })

        if timeline["total_days"] < 1:
            findings.append({
                "type": "info",
                "icon": "timer",
                "title": "Single-Day Project",
                "message": "All commits made within 24 hours",
                "details": "Consider verifying the candidate's understanding of the code"
            })

        # Bulk commit sessions
        if timeline.get("bulk_commit_sessions", 0) > 2:
            findings.append({
                "type": "warning",
                "icon": "stack",
                "title": "Bulk Commit Sessions Detected",
                "message": f"{timeline['bulk_commit_sessions']} sessions with rapid commits",
                "details": "Multiple commits within 1 hour may indicate copy-paste or AI generation"
            })

        # Positive findings
        if patterns["avg_message_length"] > 40:
            findings.append({
                "type": "success",
                "icon": "thumb_up",
                "title": "Detailed Commit Messages",
                "message": f"Average message length: {patterns['avg_message_length']:.0f} characters",
                "details": "Good commit hygiene suggests authentic development work"
            })

        if timeline["total_days"] > 7:
            findings.append({
                "type": "success",
                "icon": "calendar_month",
                "title": "Extended Development Timeline",
                "message": f"Project developed over {timeline['total_days']:.0f} days",
                "details": "Longer timelines suggest iterative, authentic development"
            })

        return findings

    def _generate_recommendations(self, analysis: dict) -> list:
        """Generate interview recommendations based on analysis"""
        recommendations = []
        ai_risk = analysis["ai_risk_score"]

        if ai_risk > 0.5:
            recommendations.append({
                "question": "Can you walk me through your development process for this project?",
                "reason": "Verify authentic understanding of the codebase"
            })

        if analysis["commit_patterns"]["ai_pattern_matches"] > analysis["total_commits"] * 0.5:
            recommendations.append({
                "question": "Why did you choose this architecture? What alternatives did you consider?",
                "reason": "Generic commits suggest possible lack of decision-making documentation"
            })

        if analysis["timeline_analysis"]["total_days"] < 1:
            recommendations.append({
                "question": "How long did you actually spend on this project? Walk me through your process.",
                "reason": "Single-day timeline needs verification"
            })

        if analysis["timeline_analysis"]["commits_per_day"] > 5:
            recommendations.append({
                "question": "I notice many commits in a short time. Can you explain your workflow?",
                "reason": "High commit frequency pattern detected"
            })

        if ai_risk < 0.3:
            recommendations.append({
                "question": "Your commit history shows good practices. Tell me about the biggest challenge you faced.",
                "reason": "Authentic development pattern - dig deeper into technical skills"
            })

        return recommendations
