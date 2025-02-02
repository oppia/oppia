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

"""Inactive issue checker script for Oppia."""

from __future__ import annotations

import datetime
import logging
import os
from typing import List, Dict, Any
import requests

INACTIVE_DAYS = 7
REPO_OWNER = 'oppia'
REPO_NAME = 'oppia'

def identify_inactive_issues(
    github_token: str, repo_owner: str, repo_name: str
) -> List[Dict[str, Any]]:
    """Identifies inactive issues in the given repository.

    Args:
        github_token: str. The GitHub token for authentication.
        repo_owner: str. The owner of the repository.
        repo_name: str. The name of the repository.

    Returns:
        List of dictionaries containing information about inactive issues.
        Each dictionary contains 'issue_number' and 'assignee_login'.
    """
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json',
    }
    repo_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}'
    inactive_issues = []

    issues_url = f'{repo_url}/issues?state=open'
    response = requests.get(issues_url, headers=headers, timeout=10)
    issues = response.json()

    for issue in issues:
        if not issue or not isinstance(
            issue, dict) or not issue.get('assignee'):
            continue

        issue_number = issue['number']
        assignee_login = issue['assignee']['login']
        logging.info('Checking issue #%s', issue_number)

        # Check events for last activity
        events_url = issue['events_url']
        events_response = requests.get(events_url, headers=headers, timeout=10)
        events = events_response.json()

        if not events:
            continue

        last_activity_date = max(
            datetime.datetime.strptime(
                event['created_at'], '%Y-%m-%dT%H:%M:%SZ')
                .replace(tzinfo=datetime.timezone.utc)
            for event in events
        )

        now = datetime.datetime.now(datetime.timezone.utc)
        days_since_activity = (
            (now - last_activity_date).total_seconds() / 86400
        )

        # Skip if assignee is a collaborator
        collaborators_url = f'{repo_url}/collaborators'
        collaborators_response = requests.get(
            collaborators_url, headers=headers, timeout=10
        )
        collaborators = collaborators_response.json()

        if any(
            collaborator['login'] == assignee_login for collaborator
            in collaborators
        ):
            logging.info(
                'Skipping issue #%s as %s is a collaborator.',
                issue_number, assignee_login
            )
            continue

        # Check for related pull requests
        pulls_url = f'{repo_url}/pulls?state=open'
        pulls_response = requests.get(pulls_url, headers=headers, timeout=10)
        pull_requests = pulls_response.json()
        related_pull_requests = [
            pull_request for pull_request in pull_requests
            if pull_request.get('body') and issue_number in {
                int(word.strip('#'))
                for word in pull_request.get('body', '').split()
                if word.strip('#').isdigit()
            }
        ]

        if related_pull_requests:
            logging.info(
                'Skipping issue #%s as there are related open pull requests.',
                issue_number
            )
            continue

        if days_since_activity > INACTIVE_DAYS:
            inactive_issues.append({
                'issue_number': issue_number,
                'assignee_login': assignee_login
            })

    return inactive_issues

def unassign_inactive_issues(
    github_token: str,
    repo_owner: str,
    repo_name: str,
    inactive_issues: List[Dict[str, Any]]
) -> None:
    """Unassigns inactive issues and posts comments.

    Args:
        github_token: str. The GitHub token for authentication.
        repo_owner: str. The owner of the repository.
        repo_name: str. The name of the repository.
        inactive_issues: List[Dict[str, Any]]. List of inactive issues to unassign.
    """
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json',
    }
    repo_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}'

    for issue in inactive_issues:
        issue_number = issue['issue_number']
        assignee_login = issue['assignee_login']

        try:
            assignees_url = f'{repo_url}/issues/{issue_number}/assignees'
            unassign_response = requests.delete(
                assignees_url,
                headers=headers,
                json={'assignees': [assignee_login]},
                timeout=10
            )

            if unassign_response.status_code == 200:
                comments_url = f'{repo_url}/issues/{issue_number}/comments'
                comment_body = (
                    f'@{assignee_login} has been unassigned '
                    f'from this issue due to inactivity for '
                    f'more than {INACTIVE_DAYS} days. If '
                    f'you would like to continue working on '
                    f'this issue, please request to be reassigned.'
                )
                requests.post(
                    comments_url,
                    headers=headers,
                    json={'body': comment_body},
                    timeout=10
                )

                logging.info(
                    'Unassigned issue #%s from %s due to inactivity.',
                    issue_number, assignee_login
                )
            else:
                logging.error(
                    'Failed to unassign issue #%s',
                    issue_number
                )

        except Exception as error:
            logging.error(
                'Error processing issue #%s: %s',
                issue_number, error
            )

if __name__ == '__main__': # pragma: no cover
    GITHUB_TOKEN = os.environ['GITHUB_TOKEN']
    inactive_issues = identify_inactive_issues(GITHUB_TOKEN, REPO_OWNER, REPO_NAME)
    unassign_inactive_issues(GITHUB_TOKEN, REPO_OWNER, REPO_NAME, inactive_issues)