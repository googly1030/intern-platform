#!/usr/bin/env python3
"""
Test script for the scoring system
Run this to verify the scoring works with a sample GitHub repo
"""

import asyncio
import json
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.scorer import Scorer


async def test_scoring(github_url: str, hosted_url: str = None):
    """Test the scoring system with a GitHub URL"""

    print("=" * 60)
    print("InternAudit AI - Scoring Test")
    print("=" * 60)
    print(f"\nGitHub URL: {github_url}")
    if hosted_url:
        print(f"Hosted URL: {hosted_url}")
    print()

    # Initialize scorer
    scorer = Scorer(
        repos_dir="./repos",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )

    # Generate a test submission ID
    import uuid
    submission_id = f"test_{str(uuid.uuid4())[:8]}"

    print(f"Submission ID: {submission_id}")
    print("\nStarting scoring process...")
    print("-" * 60)

    # Run scoring
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: scorer.score_submission(github_url, submission_id, hosted_url)
    )

    # Print results
    print("\n" + "=" * 60)
    print("SCORING RESULTS")
    print("=" * 60)

    print(f"\nStatus: {result['status']}")
    print(f"Overall Score: {result['overall_score']}/100")
    print(f"Grade: {result['grade']}")
    print(f"Recommendation: {result['recommendation']}")

    if result.get('error'):
        print(f"\nError: {result['error']}")

    print("\n" + "-" * 60)
    print("DETAILED SCORES")
    print("-" * 60)

    scores = result.get('scores', {})
    print(f"\nCritical Requirements (40 pts max):")
    print(f"  - File Separation: {scores.get('fileSeparation', 0)}/10")
    print(f"  - jQuery AJAX: {scores.get('jqueryAjax', 0)}/10")
    print(f"  - Bootstrap: {scores.get('bootstrap', 0)}/10")
    print(f"  - Prepared Statements: {scores.get('preparedStatements', 0)}/10")

    print(f"\nDatabase Implementation (25 pts max):")
    print(f"  - MySQL: {scores.get('mysql', 0)}/8")
    print(f"  - MongoDB: {scores.get('mongodb', 0)}/8")
    print(f"  - Redis: {scores.get('redis', 0)}/5")
    print(f"  - localStorage: {scores.get('localStorage', 0)}/4")

    print(f"\nCode Quality (20 pts max):")
    print(f"  - Naming Conventions: {scores.get('namingConventions', 0)}/5")
    print(f"  - Modularity: {scores.get('modularity', 0)}/5")
    print(f"  - Error Handling: {scores.get('errorHandling', 0)}/5")
    print(f"  - Security: {scores.get('security', 0)}/5")

    print(f"\nFolder Structure: {scores.get('folderStructure', 0)}/10")
    print(f"Deployment & Extras: {scores.get('deployment', 0) + scores.get('bonusFeatures', 0)}/5")

    print("\n" + "-" * 60)
    print("FLAGS")
    print("-" * 60)
    flags = result.get('flags', [])
    if flags:
        for flag in flags:
            if flag in ['NO_BOOTSTRAP', 'FORM_SUBMISSION_USED', 'SQL_INJECTION_RISK',
                       'NO_MYSQL', 'NO_MONGODB', 'NO_REDIS']:
                print(f"  🚫 {flag}")
            elif flag in ['CODE_MIXING', 'POOR_FOLDER_STRUCTURE', 'NO_ERROR_HANDLING',
                         'AI_GENERATED_HIGH', 'NO_DEPLOYMENT']:
                print(f"  ⚠️ {flag}")
            else:
                print(f"  ℹ️ {flag}")
    else:
        print("  No flags")

    print("\n" + "-" * 60)
    print("AI GENERATION RISK")
    print("-" * 60)
    risk = result.get('ai_generation_risk', 0)
    if risk <= 0.3:
        print(f"  Low Risk ({risk:.2f}) - Likely human-written")
    elif risk <= 0.6:
        print(f"  Medium Risk ({risk:.2f}) - Possible AI assistance")
    else:
        print(f"  High Risk ({risk:.2f}) - Likely AI-generated")

    print("\n" + "-" * 60)
    print("STRENGTHS")
    print("-" * 60)
    for strength in result.get('strengths', []):
        print(f"  ✅ {strength}")

    print("\n" + "-" * 60)
    print("WEAKNESSES")
    print("-" * 60)
    for weakness in result.get('weaknesses', []):
        print(f"  ❌ {weakness}")

    # Save full report to JSON
    report_path = f"./{submission_id}_report.json"
    with open(report_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    print(f"\n\nFull report saved to: {report_path}")

    # Cleanup
    scorer.cleanup(submission_id)
    print(f"Cleaned up repository: {submission_id}")

    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_scoring.py <github_url> [hosted_url]")
        print("\nExample:")
        print("  python test_scoring.py https://github.com/user/repo")
        sys.exit(1)

    github_url = sys.argv[1]
    hosted_url = sys.argv[2] if len(sys.argv) > 2 else None

    asyncio.run(test_scoring(github_url, hosted_url))
