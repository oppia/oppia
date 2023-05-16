# Copyright 2023 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Github related commands and functions."""

from __future__ import annotations

import collections
import datetime
import logging

from send_review_notification import github_domain

from dateutil import parser
import requests
from typing import Any, Callable, DefaultDict, Dict, List, Optional, Union

_TOKEN = None
GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
PULL_REQUESTS_URL_TEMPLATE = 'https://api.github.com/repos/{0}/{1}/pulls'
ISSUE_TIMELINE_URL_TEMPLATE = (
    'https://api.github.com/repos/{0}/{1}/issues/{2}/timeline')
CREATE_DISCUSSION_URL_TEMPLATE = (
    'https://api.github.com/orgs/{0}/teams/{1}/discussions')


def init_service(token: Optional[str]=None) -> None:
    """Initialize service with the given token."""
    if token is None:
        raise Exception('Must provide Github Personal Access Token.')

    global _TOKEN # pylint: disable=global-statement
    _TOKEN = token


# Here we use type Any because.
def check_token(func: Callable[..., Any]) -> Callable[..., Any]:
    """A decorator to check whether the service is initialized with
    the token.
    """

    # Here we use type Any because.
    def execute_if_token_initialized(*args: Any, **kwargs: Any) -> Any:
        """Executes the given function if the token is initialized."""
        if _TOKEN is None:
            raise Exception(
                'Initialize the service with '
                'github_services.init_service(TOKEN).')
        return func(*args, **kwargs)

    return execute_if_token_initialized


def _get_request_headers() -> Dict[str, str]:
    """Returns the request headers for github-request."""
    return {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': f'token {_TOKEN}'
    }


@check_token
def get_prs_assigned_to_reviewers(
    org_name: str,
    repository: str,
    wait_hours: int
) -> DefaultDict[str, List[github_domain.PullRequest]]:
    """Fetches all the PRs on the given repository and returns a list of PRs
    assigned to reviewers.
    """

    pr_url = PULL_REQUESTS_URL_TEMPLATE.format(org_name, repository)
    reviewer_to_assigned_prs: (
        DefaultDict[str, List[github_domain.PullRequest]]) = (
        collections.defaultdict(list))

    page_number = 1
    while True:
        logging.info('Fetching Pull requests')
        params: Dict[str, Union[str, int]] = {
            'page': page_number, 'per_page': 100, 'status': 'open'
        }
        response = requests.get(
            pr_url,
            params=params,
            headers=_get_request_headers()
        )
        response.raise_for_status()
        pr_subset = response.json()

        if len(pr_subset) == 0:
            break
        page_number += 1

        pull_requests = [
            github_domain.PullRequest.from_github_response(pull_request)
            for pull_request in pr_subset]
        update_assignee_timestamp(org_name, repository, pull_requests)
        for pull_request in pull_requests:
            if not pull_request.is_reviewer_assigned():
                continue
            for reviewer in pull_request.assignees:
                pending_review_time = (
                    datetime.datetime.now(datetime.timezone.utc) -
                    reviewer.timestamp)
                if (reviewer.name != pull_request.author) and (
                        pending_review_time >=
                        datetime.timedelta(hours=wait_hours)
                    ):
                    reviewer_to_assigned_prs[reviewer.name].append(pull_request)
    return reviewer_to_assigned_prs


# Here we use type Any because the response we get from the api call is hard
# to annotate in a typedDict, Hence used type Any.
def __process_activity(
    pull_request: github_domain.PullRequest,
    event: Dict[str, Any]
) -> None:
    """Process activity and updates assignee timestamps."""
    if event['event'] != 'assigned':
        return

    assignee = pull_request.get_assignee(event['assignee']['login'])
    event_timestamp = parser.parse(event['created_at'])
    if assignee:
        assignee.set_timestamp(max([assignee.timestamp, event_timestamp]))


def update_assignee_timestamp(
    org_name: str,
    repository: str,
    pr_list: List[github_domain.PullRequest]
) -> None:
    """Fetches PR timeline and updates assignment timestamp."""
    for pull_request in pr_list:
        pr_number = pull_request.number
        activity_url = ISSUE_TIMELINE_URL_TEMPLATE.format(
            org_name, repository, pr_number)

        page_number = 1
        while True:
            logging.info('Fetching PR #%s timeline', pr_number)
            response = requests.get(
                activity_url,
                params={'page': page_number, 'per_page': 100},
                headers={
                    'Accept': 'application/vnd.github.mockingbird-preview+json',
                    'Authorization': f'token {_TOKEN}'}
            )
            response.raise_for_status()
            timeline_subset = response.json()

            if len(timeline_subset) == 0:
                break

            for event in timeline_subset:
                __process_activity(pull_request, event)

            page_number += 1


@check_token
def create_discussion_comment(org_name: str, repo: str, body: str) -> None:
    """Creates github discussion on the team_slug with the given title and
    body.
    """

    query_category_id = """
        query($org_name: String!, $repository: String!) {
            repository(owner: $org_name, name: $repository) {
                discussionCategories(first: 10) {
                    nodes {
                        id
                        name
                    }
                }
            }
        }
    """

    variables = {
        'org_name': org_name,
        'repository': repo
    }

    response = requests.post(
        GITHUB_GRAPHQL_URL,
        json={'query': query_category_id, 'variables': variables},
        headers=_get_request_headers()
    )

    data = response.json()

    category_id = ''
    for category in data['data']['repository']['discussionCategories']['nodes']:
        if category['name'] == 'Reviewer notifications':
            category_id = category['id']
            break

    query_discussion_id = """
        query ($org_name: String!, $repository: String!, $category_id: ID!) {
            repository(owner: $org_name, name: $repository) {
                discussions(categoryId: $category_id, first: 10) {
                    edges{
                        node {
                            id
                            title
                        }
                    }
                }
            }
        }
    """

    variables = {
        'org_name': org_name,
        'repository': repo,
        'category_id': category_id
    }

    response = requests.post(
        GITHUB_GRAPHQL_URL,
        json={'query': query_discussion_id, 'variables': variables},
        headers=_get_request_headers()
    )

    data = response.json()

    # Assuming the particular category will have only one discussion.
    discussion_id = (
        data['data']['repository']['discussions']['edges'][0]['node']['id'])

    comment_in_discussion = """
        mutation comment($discussion_id: ID!, $comment: String!) {
            addDiscussionComment(input: {discussionId: $discussion_id, body: $comment}) {
                clientMutationId
                comment {
                    id
                }
            }
        }
    """

    variables = {
        'discussion_id': discussion_id,
        'comment': body
    }

    response = requests.post(
        GITHUB_GRAPHQL_URL,
        json={'query': comment_in_discussion, 'variables': variables},
        headers=_get_request_headers()
    )
    response.raise_for_status()
