"""
Repository Cloner Service
Clones GitHub repositories for analysis
"""

import os
import re
import shutil
from typing import Optional
from urllib.parse import urlparse

import git

from app.config import settings


class RepoCloner:
    """Service for cloning GitHub repositories"""

    def __init__(self, repos_dir: Optional[str] = None):
        """
        Initialize RepoCloner.

        Args:
            repos_dir: Directory to clone repos into. Defaults to settings.REPOS_DIR
        """
        self.repos_dir = repos_dir or getattr(settings, "REPOS_DIR", "./repos")
        os.makedirs(self.repos_dir, exist_ok=True)

    def parse_github_url(self, github_url: str) -> dict:
        """
        Parse GitHub URL to extract owner and repo name.

        Args:
            github_url: GitHub repository URL

        Returns:
            dict with owner, repo, and full_url
        """
        # Handle different GitHub URL formats
        patterns = [
            # https://github.com/owner/repo
            r"github\.com/([^/]+)/([^/]+)/?$",
            # https://github.com/owner/repo.git
            r"github\.com/([^/]+)/([^/]+)\.git$",
            # git@github.com:owner/repo.git
            r"github\.com:([^/]+)/([^/]+)\.git$",
        ]

        for pattern in patterns:
            match = re.search(pattern, github_url)
            if match:
                return {
                    "owner": match.group(1),
                    "repo": match.group(2).replace(".git", ""),
                    "full_url": github_url,
                }

        raise ValueError(f"Invalid GitHub URL: {github_url}")

    def clone(self, github_url: str, submission_id: str) -> str:
        """
        Clone a GitHub repository.

        Args:
            github_url: GitHub repository URL
            submission_id: Unique ID for the submission (used as folder name)

        Returns:
            Local path to cloned repository
        """
        # Parse URL to get repo info
        repo_info = self.parse_github_url(github_url)

        # Create target directory
        target_dir = os.path.join(self.repos_dir, submission_id)

        # Remove existing directory if it exists
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

        # Clone the repository
        try:
            print(f"Cloning {github_url} to {target_dir}...")
            git.Repo.clone_from(github_url, target_dir)
            print(f"Successfully cloned to {target_dir}")
            return target_dir
        except git.GitCommandError as e:
            raise Exception(f"Failed to clone repository: {str(e)}")

    def get_repo_info(self, repo_path: str) -> dict:
        """
        Get information about a cloned repository.

        Args:
            repo_path: Local path to cloned repository

        Returns:
            dict with repo information
        """
        repo = git.Repo(repo_path)

        # Get commit history
        commits = list(repo.iter_commits(max_count=10))

        # Check for single commit (AI generation indicator)
        total_commits = sum(1 for _ in repo.iter_commits())

        # Get contributors
        contributors = set()
        for commit in commits:
            if commit.author:
                contributors.add(commit.author.name)

        return {
            "total_commits": total_commits,
            "contributors": list(contributors),
            "last_commit_date": commits[0].committed_datetime.isoformat() if commits else None,
            "first_commit_date": commits[-1].committed_datetime.isoformat() if commits else None,
            "is_single_commit": total_commits == 1,
        }

    def cleanup(self, submission_id: str) -> bool:
        """
        Remove a cloned repository.

        Args:
            submission_id: ID of the submission to clean up

        Returns:
            True if cleanup successful, False otherwise
        """
        target_dir = os.path.join(self.repos_dir, submission_id)
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
            return True
        return False

    def get_directory_structure(self, repo_path: str) -> dict:
        """
        Get the directory structure of a repository.

        Args:
            repo_path: Local path to cloned repository

        Returns:
            dict with folders and files
        """
        structure = {"folders": [], "files": []}

        for root, dirs, files in os.walk(repo_path):
            # Skip .git directory
            if ".git" in dirs:
                dirs.remove(".git")

            rel_path = os.path.relpath(root, repo_path)
            if rel_path == ".":
                rel_path = ""

            # Add folders
            for d in dirs:
                folder_path = os.path.join(rel_path, d) if rel_path else d
                structure["folders"].append(folder_path)

            # Add files
            for f in files:
                file_path = os.path.join(rel_path, f) if rel_path else f
                structure["files"].append(file_path)

        return structure
