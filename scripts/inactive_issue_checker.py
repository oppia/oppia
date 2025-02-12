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

import requests
from typing import Dict, List, Set

INACTIVE_DAYS_THRESHOLD = 7
REPO_OWNER = 'Ashu463'
REPO_NAME = 'grid6.0'


class InactiveIssue:
    """Represents an inactive issue with its number and assignee."""

    def __init__(self, number: int, assignee: str):
        self.number = number
        self.assignee = assignee


def build_issue_pr_mapping(
    github_token: str,
    repo_owner: str,
    repo_name: str
) -> Dict[int, int]:
    """Builds a mapping of issue numbers to their linked pull request number.
    
    Args:
        github_token: str. The GitHub token for authentication.
        repo_owner: str. The owner of the repository.
        repo_name: str. The name of the repository.
        
    Returns:
        Dict[int, int]. A mapping where key is issue number and value is the linked PR number.
    """
    issue_to_pr: Dict[int, int] = {}
    
    url = 'https://api.github.com/graphql'
    headers = {
        'Authorization': f'Bearer {github_token}',
        'Content-Type': 'application/json',
    }
    
    query = """
    query($owner: String!, $name: String!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        pullRequests(first: 100, states: [OPEN], after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            closingIssuesReferences(first: 1) {  # Changed to first: 1
              nodes {
                number
              }
            }
          }
        }
      }
    }
    """
    
    variables = {
        "owner": repo_owner,
        "name": repo_name,
        "cursor": None
    }
    
    has_next_page = True
    
    while has_next_page:
        response = requests.post(
            url,
            headers=headers,
            json={"query": query, "variables": variables},
            timeout=10
        )
        
        if response.status_code != 200:
            logging.error(
                "GraphQL request failed: %s", 
                response.json().get('errors', ['Unknown error'])
            )
            break
            
        data = response.json()
        pull_requests = data['data']['repository']['pullRequests']
        
        for pr in pull_requests['nodes']:
            pr_number = pr['number']
            linked_issues = pr['closingIssuesReferences']['nodes']
            
            if linked_issues:
                issue_number = linked_issues[0]['number']
                issue_to_pr[issue_number] = pr_number
        
        # Check if there are more pages
        page_info = pull_requests['pageInfo']
        has_next_page = page_info['hasNextPage']
        variables['cursor'] = page_info['endCursor']
    
    return issue_to_pr


def get_inactive_issues(
    github_token: str,
    repo_owner: str,
    repo_name: str
) -> List[InactiveIssue]:
    """Identifies inactive issues that need unassignment.

    Args:
        github_token: str. The GitHub token for authentication.
        repo_owner: str. The owner of the repository.
        repo_name: str. The name of the repository.

    Returns:
        List[InactiveIssue]. A list of issues that need unassignment.
    """
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json',
    }
    repo_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}'
    inactive_issues: List[InactiveIssue] = []

    issues_url = f'{repo_url}/issues?state=open'
    response = requests.get(issues_url, headers=headers, timeout=10)
    issues = response.json()

    collaborators_url = f'{repo_url}/collaborators'
    collaborators_response = requests.get(
        collaborators_url, headers=headers, timeout=10
    )
    collaborators = collaborators_response.json()
    collaborator_usernames = set()
    for c in collaborators:
        collaborator_usernames.add(c['login'])

    for issue in issues:
        if not issue or not isinstance(
            issue, dict) or not issue.get('assignee'):
            continue

        issue_number = issue['number']
        assignee_login = issue['assignee']['login']
        logging.info('Checking issue #%s', issue_number)

        # Skip issues assigned to collaborators.
        if assignee_login in collaborator_usernames:
            logging.info(
                'Skipping issue #%s as %s is a collaborator.',
                issue_number, assignee_login
            )
            continue
        
        # Check if there are any open pull requests related to the issue.
        related_pull_requests = build_issue_pr_mapping(
            github_token, repo_owner,repo_name
        )
        logging.info(
            'related_pull_requests:', related_pull_requests
        )
        if issue_number in related_pull_requests:
            logging.info(
                'Skipping issue #%s as there are related open pull requests.',
                issue_number
            )
            continue

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
        days_since_last_activity = (
            (now - last_activity_date).total_seconds() / 86400
        )

        if days_since_last_activity > INACTIVE_DAYS_THRESHOLD:
            inactive_issues.append(InactiveIssue(
                number=issue_number,
                assignee=assignee_login
            ))
            logging.info(
                'Issue #%s has been inactive for %d days',
                issue_number, days_since_last_activity
            )

    return inactive_issues


def unassign_inactive_issues(
    github_token: str,
    repo_owner: str,
    repo_name: str,
    inactive_issues: List[InactiveIssue]
) -> None:
    """Unassigns the specified inactive issues and posts comments.

    Args:
        github_token: str. The GitHub token for authentication.
        repo_owner: str. The owner of the repository.
        repo_name: str. The name of the repository.
        inactive_issues: List[InactiveIssue]. List of issues to unassign.
    """
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json',
    }
    repo_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}'

    for issue in inactive_issues:
        issue_number = issue.number
        assignee_username = issue.assignee

        try:
            assignees_url = f'{repo_url}/issues/{issue_number}/assignees'
            unassign_response = requests.delete(
                assignees_url,
                headers=headers,
                json={'assignees': [assignee_username]},
                timeout=10,
            )

            if unassign_response.status_code == 200:
                comments_url = f'{repo_url}/issues/{issue_number}/comments'
                comment_body = (
                    f'@{assignee_username} has been unassigned '
                    f'from this issue due to inactivity for '
                    f'more than {INACTIVE_DAYS_THRESHOLD} days. If '
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
                    issue_number, assignee_username
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

    all_inactive_issues = get_inactive_issues(
        GITHUB_TOKEN, REPO_OWNER, REPO_NAME
    )
    if all_inactive_issues:
        logging.info('The following issues will be unassigned:')
        for inactive_issue in all_inactive_issues:
            logging.info(
                'Issue #%s (assignee: %s)',
                inactive_issue.number, inactive_issue.assignee
            )
    else:
        logging.info('No inactive issues found that need unassignment.')

    if os.environ['DEASSIGN_INACTIVE_CONTRIBUTORS']:
        unassign_inactive_issues(
            GITHUB_TOKEN, REPO_OWNER, REPO_NAME, all_inactive_issues
        )
    else:
        logging.info('Unassignment is currently disabled.')
