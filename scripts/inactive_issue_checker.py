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

"""Script to check and unassign inactive issues in Oppia repository."""

from __future__ import annotations

import collections
import datetime
import logging
import os
from scripts import install_third_party_libs

import requests
from typing import Dict, List, Optional, Set, TypedDict

INACTIVE_DAYS_THRESHOLD = 7
UNASSIGN_DAYS_THRESHOLD = 10
REPO_OWNER = 'oppia'
REPO_NAME = 'oppia'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


class IssueDict(TypedDict, total=False):
    """Dict representation of a GitHub issue."""

    number: int
    assignee: Optional[Dict[str, str]]
    events_url: str


class Issue:
    """Domain object representing a GitHub issue."""

    def __init__(
        self,
        number: int,
        assignee_username: Optional[str],
        events_url: str,
        last_active_date: Optional[datetime.datetime] = None
    ):
        self.number = number
        self.assignee_username = assignee_username
        self.events_url = events_url
        self.last_active_date = last_active_date

    @classmethod
    def from_github_data(cls, data: IssueDict) -> Issue:
        """Creates an Issue instance from GitHub API response data.

        Args:
            data: IssueDict. The dictionary containing GitHub issue data.

        Returns:
            Issue. A new Issue instance.
        """
        assignee_data = data.get('assignee')
        assignee_username = assignee_data['login'] if assignee_data else None

        return cls(
            number=data['number'],
            assignee_username=assignee_username,
            events_url=data['events_url']
        )

    def is_inactive_for_seven_days(self) -> bool:
        """Checks if the issue is inactive based on threshold.

        Returns:
            bool. Whether the issue is inactive.
        """
        if not self.last_active_date:
            return False

        now = datetime.datetime.now(datetime.timezone.utc)
        days_inactive = (now - self.last_active_date).total_seconds() / 86400
        return days_inactive > INACTIVE_DAYS_THRESHOLD

    def is_inactive_for_ten_days(self) -> bool:
        """Checks if the issue is inactive based on threshold.

        Returns:
            bool. Whether the issue is inactive.
        """
        if not self.last_active_date:
            return False

        now = datetime.datetime.now(datetime.timezone.utc)
        days_inactive = (now - self.last_active_date).total_seconds() / 86400
        return days_inactive > UNASSIGN_DAYS_THRESHOLD


class GitHubService:
    """Service class for GitHub API interactions."""

    def __init__(self, token: str, repo_owner: str, repo_name: str):
        """Initialize GitHubService.

        Args:
            token: str. GitHub API token.
            repo_owner: str. Repository owner.
            repo_name: str. Repository name.
        """
        self.token = token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.rest_headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.graphql_headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        self.base_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}'

    def get_open_issues(self) -> List[Issue]:
        """Fetches all open issues from GitHub.

        Returns:
            List[Issue]. List of open issues.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
        search_url = 'https://api.github.com/search/issues'

        url = (
            f'{search_url}?q=repo:{self.repo_owner}/'
            f'{self.repo_name}+is:issue+state:open'
        )
        response = requests.get(url, headers=self.rest_headers, timeout=10)
        if response is None:
            raise AssertionError('Received null res while fetching issues')
        response.raise_for_status()

        issues_list = []
        for issue_data in response.json().get('items', []):
            assert isinstance(issue_data, dict)
            typed_issue_data: IssueDict = {
                'number': issue_data['number'],
                'assignee': issue_data.get('assignee'),
                'events_url': issue_data['events_url']
            }
            issue = Issue.from_github_data(typed_issue_data)
            issues_list.append(issue)

        return issues_list

    def get_repo_collaborators(self) -> set[str]:
        """Fetches repository collaborators.

        Returns:
            set[str]. Set of collaborator usernames.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
        url = f'{self.base_url}/collaborators'
        response = requests.get(url, headers=self.rest_headers, timeout=10)

        if response is None:
            raise AssertionError(
                'Received null res while fetching collaborators'
            )
        response.raise_for_status()

        collaborators = set()
        for collaborator_dict in response.json():
            assert isinstance(collaborator_dict, dict)
            collaborators.add(collaborator_dict['login'])

        return collaborators

    def get_issue_events(self, issue: Issue) -> Optional[datetime.datetime]:
        """Fetches and processes events for an issue.

        Args:
            issue: Issue. The issue to fetch events for.

        Returns:
            Optional[datetime.datetime]. The date of the latest event, if any.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
        response = requests.get(
            issue.events_url,
            headers=self.rest_headers,
            timeout=10
        )
        if response is None:
            raise AssertionError('Received null res while fetching events')
        response.raise_for_status()

        events_dict = response.json()

        if not events_dict:
            return None

        assignee_events = []
        for event in events_dict:
            if event.get('actor', {}).get('login') == issue.assignee_username:
                assignee_events.append(event)

        if not assignee_events:
            return None

        latest_event_date = max(
            datetime.datetime.strptime(
                event['created_at'],
                '%Y-%m-%dT%H:%M:%SZ'
            ).replace(tzinfo=datetime.timezone.utc)
            for event in assignee_events
        )
        return latest_event_date

    def get_issues_with_prs(self) -> Dict[int, Set[int]]:
        """Fetches mapping of issues to their linked PRs using GraphQL.

        Returns:
            Dict[int, int]. Mapping of issue numbers to PR numbers.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
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
                closingIssuesReferences(first: 1) {
                  nodes {
                    number
                  }
                }
              }
            }
          }
        }
        """

        req_credentials = {
            'owner': self.repo_owner,
            'name': self.repo_name,
            'cursor': None
        }

        issue_to_prs = collections.defaultdict(set)
        has_next_page = True

        while has_next_page:
            response = requests.post(
                'https://api.github.com/graphql',
                headers=self.graphql_headers,
                json={'query': query, 'variables': req_credentials},
                timeout=10
            )
            if response is None:
                raise AssertionError('Received null res while fetching PRs')
            response.raise_for_status()

            data = response.json()
            pull_requests = data['data']['repository']['pullRequests']

            for pr in pull_requests['nodes']:
                pr_number = pr['number']
                linked_issues = pr['closingIssuesReferences']['nodes'] or []
                for issue in linked_issues:
                    issue_number = issue['number']
                    issue_to_prs[issue_number].add(pr_number)

            page_info = pull_requests['pageInfo']
            has_next_page = page_info['hasNextPage']
            req_credentials['cursor'] = page_info['endCursor']

        return issue_to_prs

    def unassign_issue(self, issue: Issue) -> bool:
        """Unassigns a user from an issue.

        Args:
            issue: Issue. The issue to unassign.

        Returns:
            bool. Whether the unassignment was successful.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
        if not issue.assignee_username:
            return False

        url = f'{self.base_url}/issues/{issue.number}/assignees'
        response = requests.delete(
            url,
            headers=self.rest_headers,
            json={'assignees': [issue.assignee_username]},
            timeout=10
        )
        if response is None:
            raise AssertionError('Received null res while unassigning issue')

        response.raise_for_status()

        return response.status_code == 200

    def add_alert_comment_on_issue(self, issue: Issue) -> None:
        """Posts unassignment comment on an issue.

        Args:
            issue: Issue. The issue to comment on.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
        url = f'{self.base_url}/issues/{issue.number}/comments'
        comment = (
            f'Hi @{issue.assignee_username}, it looks like you have been '
            f'assigned to this issue for {int(INACTIVE_DAYS_THRESHOLD)} days, '
            f'but have not created a PR yet.\n\n If you are still planning to '
            f'work on this issue, please open a PR within the next '
            f'{int(UNASSIGN_DAYS_THRESHOLD - INACTIVE_DAYS_THRESHOLD)} days '
            f'and submit it for review, making sure that it is linked to this '
            f'issue in the Development sidebar of the PR. Otherwise, '
            f'please unassign yourself from this issue so that someone '
            f'else can take it up.\n\n Also, if you are stuck, please let us '
            f'know, so that we can help you. Thanks!'
        )
        response = requests.post(
            url,
            headers=self.rest_headers,
            json={'body': comment},
            timeout=10
        )
        if response is None:
            raise AssertionError('Received null res while commenting on issue')
        response.raise_for_status()

    def post_unassignment_comment(self, issue: Issue) -> None:
        """Posts unassignment comment on an issue.

        Args:
            issue: Issue. The issue to comment on.

        Raises:
            AssertionError. Raised if the response from the request is None.
            requests.HTTPError. Raised if the request fails.
        """
        url = f'{self.base_url}/issues/{issue.number}/comments'
        comment = (
            f'Unassigning @{issue.assignee_username} from this issue, '
            f'due to their inactivity for more than 10 days. \n\n'
            f'This issue is now open for other contributors to take up.'
        )
        response = requests.post(
            url,
            headers=self.rest_headers,
            json={'body': comment},
            timeout=10
        )
        if response is None:
            raise AssertionError('Received null res while commenting on issue')
        response.raise_for_status()


class IssueManager:
    """Manages issue operations and business logic."""

    def __init__(self, github_service: GitHubService):
        """Initialize IssueManager.

        Args:
            github_service: GitHubService. The GitHub service instance.
        """
        self.github = github_service

    def get_inactive_issues(self) -> List[Issue]:
        """Identifies issues that need unassignment.

        Returns:
            List[Issue]. List of inactive issues.
        """
        issues = self.github.get_open_issues()
        collaborators = self.github.get_repo_collaborators()
        issues_with_prs = self.github.get_issues_with_prs()

        inactive_issues = []
        for issue in issues:
            if not issue.assignee_username:
                continue

            if issue.assignee_username in collaborators:
                logging.info(
                    'Skipping issue #%d: assignee %s is a collaborator',
                    issue.number, issue.assignee_username
                )
                continue

            if issue.number in issues_with_prs:
                logging.info(
                    'Skipping issue #%d: has open PR #%s',
                    issue.number, issues_with_prs[issue.number]
                )
                continue

            issue.last_active_date = self.github.get_issue_events(issue)

            if issue.is_inactive_for_seven_days():
                self.github.add_alert_comment_on_issue(issue)
                logging.info(
                    'Issue #%d has been inactive for >%d days',
                    issue.number, INACTIVE_DAYS_THRESHOLD
                )

            if issue.is_inactive_for_ten_days():
                inactive_issues.append(issue)
                logging.info(
                    'Issue #%d has been inactive for >%d days',
                    issue.number, UNASSIGN_DAYS_THRESHOLD
                )

        return inactive_issues

    def unassign_issues(self, issues: List[Issue]) -> None:
        """Unassigns users from inactive issues.

        Args:
            issues: List[Issue]. List of issues to unassign.
        """
        for issue in issues:
            try:
                if self.github.unassign_issue(issue):
                    self.github.post_unassignment_comment(issue)
                    logging.info(
                        'Unassigned issue #%d from %s',
                        issue.number, issue.assignee_username
                    )
                else:
                    logging.error(
                        'Failed to unassign issue #%d',
                        issue.number
                    )
            except Exception as e:
                logging.error(
                    'Error processing issue #%d: %s',
                    issue.number, str(e)
                )


def main() -> None:
    """Main function for collecting all inactive issues
    and deassigning them.
    """

    github_token = os.environ['GITHUB_TOKEN']

    gh_service = GitHubService(github_token, REPO_OWNER, REPO_NAME)
    issue_manager = IssueManager(gh_service)
    # all_inactive_issues means all those issues which are inactive from
    # more than UNASSIGN_DAYS_THRESHOLD days.
    all_inactive_issues = issue_manager.get_inactive_issues()

    if all_inactive_issues:
        logging.info('The following issues will be unassigned:')
        for inactive_issue in all_inactive_issues:
            logging.info(
                'Issue #%d (assignee: %s)',
                inactive_issue.number,
                inactive_issue.assignee_username
            )

        if os.environ['DEASSIGN_INACTIVE_CONTRIBUTORS'] == 'true':
            issue_manager.unassign_issues(all_inactive_issues)
            logging.info('Inactive issues are sent for deassigning.')
        else:
            logging.info('Unassignment is currently disabled.')
    else:
        logging.info('No inactive issues found that need unassignment.')


if __name__ == '__main__': # pragma: no cover
    # This installs third party libraries (requests) before
    # importing other files or importing libraries that use
    # the builtins python module (e.g. build, utils).
    install_third_party_libs.main()
    main()
