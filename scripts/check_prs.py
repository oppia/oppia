# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Script to monitor pull requests in a GitHub repository."""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import List

import requests  # pylint: disable=import-error

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("pr_monitor.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Constants
GITHUB_API_URL = "https://api.github.com"
REPO = os.getenv("GITHUB_REPOSITORY")
HEADERS = {
    "Authorization": f"Bearer {os.getenv('GITHUB_TOKEN')}",
    "Accept": "application/vnd.github.v3+json",
}


def get_prs() -> List[dict]:
    """Fetch all open pull requests."""
    logger.info("Fetching open pull requests...")
    response = requests.get(f"{GITHUB_API_URL}/repos/{REPO}/pulls", headers=HEADERS)
    response.raise_for_status()
    prs = response.json()
    logger.info(f"Found {len(prs)} open PRs")
    return prs


def get_pr_commits(pr_number: int) -> List[dict]:
    """Fetch commits for a specific pull request."""
    logger.info(f"Fetching commits for PR #{pr_number}...")
    url = f"{GITHUB_API_URL}/repos/{REPO}/pulls/{pr_number}/commits"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    commits = response.json()
    logger.info(f"Found {len(commits)} commits in PR #{pr_number}")
    return commits


def comment_on_pr(pr_number: int, message: str) -> None:
    """Post a comment on a pull request."""
    logger.info(f"Commenting on PR #{pr_number}: {message}")
    url = f"{GITHUB_API_URL}/repos/{REPO}/issues/{pr_number}/comments"
    response = requests.post(url, headers=HEADERS, json={"body": message})
    response.raise_for_status()


def close_pr(pr_number: int) -> None:
    """Close a pull request."""
    logger.info(f"Closing PR #{pr_number}")
    url = f"{GITHUB_API_URL}/repos/{REPO}/pulls/{pr_number}"
    response = requests.patch(url, headers=HEADERS, json={"state": "closed"})
    response.raise_for_status()


def get_issue(issue_number: int) -> dict:
    """Fetch details of an issue."""
    logger.info(f"Fetching issue #{issue_number}")
    url = f"{GITHUB_API_URL}/repos/{REPO}/issues/{issue_number}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()


def unassign_author(issue_number: int, author: str) -> None:
    """Unassign an author from an issue."""
    logger.info(f"Unassigning {author} from issue #{issue_number}")
    url = f"{GITHUB_API_URL}/repos/{REPO}/issues/{issue_number}/assignees"
    response = requests.delete(url, headers=HEADERS, json={"assignees": [author]})
    response.raise_for_status()


def extract_issue_numbers(pr_body: str) -> List[int]:
    """Extract linked issue numbers from a PR body."""
    logger.info(f"Parsing PR body: {pr_body}")
    pattern = r"(?i)(?:Fixes|Closes|Resolves)\b.*?#(\d+)"
    matches = [int(num) for num in re.findall(pattern, pr_body)]
    logger.info(f"Extracted issue numbers: {matches}")
    return matches


def main() -> None:  # pragma: no cover
    """Main function to monitor and manage pull requests."""
    logger.info("Starting pull request monitoring...")
    prs = get_prs()
    now = datetime.now(timezone.utc)

    for pr in prs:
        pr_number = pr["number"]
        author = pr["user"]["login"]
        pr_body = pr.get("body", "")

        # Parse timezone-aware datetime
        updated_at = datetime.strptime(
            pr["updated_at"], "%Y-%m-%dT%H:%M:%SZ"
        ).replace(tzinfo=timezone.utc)

        # Fetch last commit time
        commits = get_pr_commits(pr_number)
        last_commit_time = updated_at
        if commits:
            last_commit_time = datetime.strptime(
                commits[-1]["commit"]["committer"]["date"], "%Y-%m-%dT%H:%M:%SZ"
            ).replace(tzinfo=timezone.utc)

        logger.info(
            f"PR #{pr_number} last activity: {last_commit_time} "
            f"({now - last_commit_time} ago)"
        )

        # Check for assigned reviewers
        if not pr["assignees"]:
            comment_on_pr(
                pr_number,
                f"@{author} Please assign a reviewer to this pull request.",
            )

        # Check for inactivity

        if last_commit_time < now - timedelta(days=0):
            comment_on_pr(
                pr_number,
                "This pull request has been inactive for over 7 days. Please update.",
            )

        if last_commit_time < now - timedelta(days=10):
            comment_on_pr(
                pr_number,
                "This pull request has been inactive for over 10 days and will now be closed. "
                "Please reopen if you plan to continue working on it.",
             )
            logger.info(f"Closing stale pull request #{pr_number}")
            close_pr(pr_number)

            # Unassign author from linked issues
            for issue_number in extract_issue_numbers(pr_body):
                issue = get_issue(issue_number)
                if any(a["login"] == author for a in issue.get("assignees", [])):
                    unassign_author(issue_number, author)

    logger.info("Pull request monitoring complete.")


if __name__ == "__main__":
    main()
