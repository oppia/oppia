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
from typing import Any, Dict, List, cast

import requests

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pr_monitor.log'),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Constants
GITHUB_API_URL = 'https://api.github.com'
REPO = os.getenv('GITHUB_REPOSITORY')
HEADERS = {
    'Authorization': f'Bearer {os.getenv("GITHUB_TOKEN")}',
    'Accept': 'application/vnd.github.v3+json',
}


def get_prs() -> List[Dict[str, Any]]:
    """Fetch all open pull requests."""
    logger.info('Fetching open pull requests...')
    response = requests.get(
        f'{GITHUB_API_URL}/repos/{REPO}/pulls',
        headers=HEADERS,
        timeout=10
    )
    response.raise_for_status()
    prs = cast(List[Dict[str, Any]], response.json())
    logger.info('Found %d open PRs', len(prs))
    return prs


def get_pr_commits(pr_number: int) -> List[Dict[str, Any]]:
    """Fetch commits for a specific pull request."""
    logger.info('Fetching commits for PR #%d...', pr_number)
    url = f'{GITHUB_API_URL}/repos/{REPO}/pulls/{pr_number}/commits'
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    commits = cast(List[Dict[str, Any]], response.json())
    logger.info('Found %d commits in PR #%d', len(commits), pr_number)
    return commits


def comment_on_pr(pr_number: int, message: str) -> None:
    """Post a comment on a pull request."""
    logger.info('Commenting on PR #%d: %s', pr_number, message)
    url = f'{GITHUB_API_URL}/repos/{REPO}/issues/{pr_number}/comments'
    response = requests.post(
        url,
        headers=HEADERS,
        json={'body': message},
        timeout=10
    )
    response.raise_for_status()


def close_pr(pr_number: int) -> None:
    """Close a pull request."""
    logger.info('Closing PR #%d', pr_number)
    url = f'{GITHUB_API_URL}/repos/{REPO}/pulls/{pr_number}'
    response = requests.patch(
        url,
        headers=HEADERS,
        json={'state': 'closed'},
        timeout=10
    )
    response.raise_for_status()


def get_issue(issue_number: int) -> Dict[str, Any]:
    """Fetch details of an issue."""
    logger.info('Fetching issue #%d', issue_number)
    url = f'{GITHUB_API_URL}/repos/{REPO}/issues/{issue_number}'
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    return cast(Dict[str, Any], response.json())


def unassign_author(issue_number: int, author: str) -> None:
    """Unassign an author from an issue."""
    logger.info('Unassigning %s from issue #%d', author, issue_number)
    url = f'{GITHUB_API_URL}/repos/{REPO}/issues/{issue_number}/assignees'
    response = requests.delete(
        url,
        headers=HEADERS,
        json={'assignees': [author]},
        timeout=10
    )
    response.raise_for_status()


def extract_issue_numbers(pr_body: str) -> List[int]:
    """Extract linked issue numbers from a PR body."""
    logger.info('Parsing PR body: %s', pr_body)
    pattern = r'(?i)(?:Fixes|Closes|Resolves)\b.*?#(\d+)'
    matches = [int(num) for num in re.findall(pattern, pr_body)]
    logger.info('Extracted issue numbers: %s', matches)
    return matches


def main() -> None:  # pragma: no cover
    """Main function to monitor and manage pull requests."""
    logger.info('Starting pull request monitoring...')
    prs = get_prs()
    now = datetime.now(timezone.utc)

    for pr in prs:
        pr_number = pr['number']
        author = pr['user']['login']
        pr_body = pr.get('body', '')

        # Parse timezone-aware datetime
        updated_at = datetime.strptime(
            pr['updated_at'], '%Y-%m-%dT%H:%M:%SZ'
        ).replace(tzinfo=timezone.utc)

        # Fetch last commit time
        commits = get_pr_commits(pr_number)
        last_commit_time = updated_at
        if commits:
            last_commit_time = datetime.strptime(
                commits[-1]['commit']['committer']['date'], '%Y-%m-%dT%H:%M:%SZ'
            ).replace(tzinfo=timezone.utc)

        logger.info(
            'PR #%d last activity: %s (%s ago)',
            pr_number,
            last_commit_time,
            now - last_commit_time
        )

        # Check for assigned reviewers
        if not pr['assignees']:
            comment_on_pr(
                pr_number,
                f'@{author} Please assign a reviewer to this pull request.',
            )

        # Check for inactivity
        if last_commit_time < now - timedelta(days=7):
            comment_on_pr(
                pr_number,
                'This pull request has been inactive for over 7 days. Please update.',
            )

        if last_commit_time < now - timedelta(days=10):
            comment_on_pr(
                pr_number,
                'This pull request has been inactive for over 10 days and will now be closed. '
                'Please reopen if you plan to continue working on it.',
            )
            logger.info('Closing stale pull request #%d', pr_number)
            close_pr(pr_number)

            # Unassign author from linked issues
            for issue_number in extract_issue_numbers(pr_body):
                issue = get_issue(issue_number)
                if any(a['login'] == author for a in issue.get('assignees', [])):
                    unassign_author(issue_number, author)

    logger.info('Pull request monitoring complete.')


if __name__ == '__main__':
    main()
