# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Script to check open GitHub PRs for merge conflicts and notify authors.

This script checks open pull requests in the repository for merge conflicts.
If a PR is found to have merge conflicts (indicated by a state of 'dirty'),
the script assigns the PR author to the PR and notifies via a GitHub comment.
"""

from __future__ import annotations

import logging
import os
import time

from scripts import install_third_party_libs

import requests
from typing import Dict, List, TypedDict


class PRData(TypedDict, total=False):
    """Dict representation of a GitHub PR Data."""

    number: int
    user: Dict[str, str]
    mergeable_state: str


GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
REPO = os.getenv('GITHUB_REPOSITORY')
RETRY_COUNT = 3
RETRY_DELAY = 5  # pragma: no cover
TIMEOUT = 10  # pragma: no cover

# Configure logging.
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')


class GitHubService:
    """Service class for GitHub API interactions related to pull requests.

    This class provides methods to list open PRs, fetch PR details with
    retry logic, assign PR authors, and post notification comments.
    """

    def __init__(self, token: str, repo: str) -> None:
        """Initialize GitHubService.

        Args:
            token: str. GitHub API token.
            repo: str. Repository owner.
        """
        self.token = token
        self.repo = repo
        self.base_url = f'https://api.github.com/repos/{repo}'
        self.rest_headers = {
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github.v3+json'
        }

    def list_open_prs(self) -> List[PRData]:
        """Fetches all open pull requests with pagination.

        Returns:
            List[PRData]. List of PRData representing open pull requests.
        """
        prs: List[PRData] = []
        page = 1
        while True:
            url = f'{self.base_url}/pulls?state=open&page={page}&per_page=100'
            response = requests.get(
                url,
                headers=self.rest_headers,
                timeout=TIMEOUT
            )
            response.raise_for_status()
            current_prs: List[PRData] = response.json()
            if not current_prs:
                break
            prs.extend(current_prs)
            page += 1
        return prs

    def fetch_pr_details(self, pr_number: int) -> PRData:
        """Fetches pull request details with retries.

        Args:
            pr_number: int. The number of the pull request.

        Returns:
            PRData. A PRData dictionary with PR details.

        Raises:
            ValueError. If the mergeable state is 'unknown' after retries.
        """
        pr_details_url = f'{self.base_url}/pulls/{pr_number}'
        for attempt in range(RETRY_COUNT):
            response = requests.get(
                pr_details_url,
                headers=self.rest_headers,
                timeout=TIMEOUT
            )
            response.raise_for_status()
            pr_details: PRData = response.json()
            mergeable_state = pr_details.get('mergeable_state')
            if mergeable_state and mergeable_state != 'unknown':
                return pr_details
            logging.info(
                'Retry %d/%d: Mergeable state is "unknown" for PR #%d.',
                attempt + 1,
                RETRY_COUNT,
                pr_number
            )
            time.sleep(RETRY_DELAY)
        logging.warning(
            'Mergeable state can not be determined for PR #%d',
            pr_number
        )
        raise ValueError(f'Mergeable state error for PR #{pr_number}')

    def assign_pr_author(self, pr_number: int, pr_author: str) -> bool:
        """Assigns the PR author as the sole assignee.

        Args:
            pr_number: int. The pull request number.
            pr_author: str. The GitHub username of the PR author.

        Returns:
            bool. True if the assignment was successful.
        """
        assign_url = f'{self.base_url}/issues/{pr_number}'
        assign_payload = {'assignees': [pr_author]}
        response = requests.patch(
            assign_url, json=assign_payload, headers=self.rest_headers,
            timeout=TIMEOUT
        )
        if response.ok:
            return True
        logging.error(
            'Failed to assign %s to PR #%d. Response: %s',
            pr_author, pr_number, response.text
        )
        return False

    def notify_pr_author(self, pr_number: int, pr_author: str) -> bool:
        """Notifies the PR author about merge conflicts by posting a comment.

        Args:
            pr_number: int. The pull request number.
            pr_author: str. The GitHub username of the PR author.

        Returns:
            bool. True if the notification was posted successfully.
        """
        comment_url = f'{self.base_url}/issues/{pr_number}/comments'
        message = (
            f'Hi @{pr_author}, due to recent changes in the develop branch, '
            'this PR now has a merge conflict. Please refer to '
            '[GitHub\'s guide on resolving merge conflicts]'
            '(https://docs.github.com/en/pull-requests/'
            'collaborating-with-pull-requests/addressing-merge-conflicts/'
            'resolving-a-merge-conflict-using-the-command-line) '
            'if you need help resolving the conflict '
            'so that the PR can be merged. '
            'Thanks!'
        )
        comment_payload = {'body': message}
        response = requests.post(
            comment_url,
            json=comment_payload,
            headers=self.rest_headers,
            timeout=TIMEOUT
        )
        if response.ok:
            return True
        logging.error(
            'Failed to notify %s in PR #%d. Response: %s',
            pr_author,
            pr_number,
            response.text
        )
        return False


class PRManager:
    """Manager class for handling pull request merge conflict notifications.

    This class utilizes GitHubService to check the state of open PRs
    and take action when merge conflicts are detected.
    """

    def __init__(self, github_service: GitHubService) -> None:
        """Initialize PRManager.

        Args:
            github_service: GitHubService. Instance of GitHubService.
        """
        self.github_service = github_service

    def check_and_notify(self) -> None:
        """Checks open pull requests for merge conflict and notifies authors.

        For each PR with a mergeable_state of 'dirty', the PR author is assigned
        to the PR and notified via a GitHub comment.
        """
        prs = self.github_service.list_open_prs()
        for pr in prs:
            pr_number = pr.get('number')
            pr_author = pr.get('user', {}).get('login')

            if pr_number is None or pr_author is None:
                logging.warning('Missing required PR data, skipping...')
                continue

            logging.info('Checking PR #%d by %s.', pr_number, pr_author)

            pr_details = self.github_service.fetch_pr_details(pr_number)
            if not pr_details:
                continue

            mergeable_state = pr_details.get('mergeable_state')
            if mergeable_state == 'dirty':
                logging.info('PR #%d has merge conflicts.', pr_number)
                if self.github_service.assign_pr_author(pr_number, pr_author):
                    logging.info(
                        'Assigned %s to PR #%d.',
                        pr_author,
                        pr_number
                    )
                else:
                    logging.error('Assignment failed for PR #%d.', pr_number)

                if self.github_service.notify_pr_author(pr_number, pr_author):
                    logging.info(
                        'Notified %s about conflicts in PR #%d.',
                        pr_author,
                        pr_number
                    )
                else:
                    logging.error('Notification failed for PR #%d.', pr_number)
            else:
                logging.info(
                    'PR #%d state: %s. No action needed.',
                    pr_number,
                    mergeable_state
                )


def main() -> None:
    """Checks open pull requests for merge conflicts and notify authors."""
    try:
        token = os.getenv('GITHUB_TOKEN')
        repo = os.getenv('GITHUB_REPOSITORY')

        if not token or not repo:
            raise ValueError('Missing required environment variables')

        github_service = GitHubService(token, repo)
        pr_manager = PRManager(github_service)
        pr_manager.check_and_notify()
    except Exception as e:
        logging.error('Error encountered: %s', e)


if __name__ == '__main__':  # pragma: no cover

    install_third_party_libs.main()
    main()
