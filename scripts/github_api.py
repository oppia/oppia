# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Github API functions to interact with the Oppia repository"""

from __future__ import annotations

import json
import os
import subprocess
import textwrap
import urllib.request

from core import utils

from typing import Any, Dict, List, Optional, TypedDict

REPOSITORY_OWNER = 'oppia'
REPOSITORY_NAME = 'oppia'

GITHUB_API_URL = 'https://api.github.com'


class GithubIssueDict(TypedDict):
    """Dict representation of a Github issue."""

    body: str
    number: int
    title: str


class GithubCommentDict(TypedDict):
    """Dict representation of a Github comment."""

    body: str


# Here we use type Any because the nested values in the dictionary can be
# of any type.
def deep_get(
    data: Optional[Dict[str, Any]],
    keys: List[str]
) -> Any:
    """Gets a value from a nested dictionary.

    Args:
        data: dict. The dictionary to get the value from.
        keys: List[str]. The keys to traverse the dictionary.

    Returns:
        Any. The value from the nested dictionary.
    """

    if not keys or data is None:
        return data
    return deep_get(data.get(keys[0]), keys[1:])


def get_github_auth_token() -> str:
    """Gets the Github auth token from the environment.

    Returns:
        str. The Github auth token.

    Raises:
        RuntimeError. Github CLI is not installed.
        RuntimeError. Failed to get Github auth token.
    """

    env = os.environ.copy()
    process = subprocess.run(
        ['gh', 'help'], env=env, check=False, encoding='utf-8',
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    if process.returncode:
        raise RuntimeError(
            'Github CLI is not installed. Please install the Github CLI ' +
            'before running Github API functions.')

    process = subprocess.run(
        ['gh', 'auth', 'token'], capture_output=True, encoding='utf-8',
        env=env, check=False)
    if process.returncode:
        raise RuntimeError(
            'Failed to get Github Auth Token from the Github CLI.')
    return process.stdout.strip()


def get_authorization_bearer() -> str:
    """Formats the Github auth token to be used as a bearer token."""
    return f'Bearer {get_github_auth_token()}'


# Here we use type Any because the API returns a generic JSON object and
# is in the form of Dict[str, Any]
def run_graphql_query(query: str) -> Dict[str, Any]:
    """Runs a GraphQL query on the Oppia repository.

    Args:
        query: str. The query to run.

    Returns:
        str. The response from the GraphQL query in JSON.

    Raises:
        RuntimeError. Failed to run GraphQL query due to a request error.
        RuntimeError. Failed to run GraphQL query due to an API error.
    """

    constructed_query = textwrap.dedent(
        """
        query {
            repository(owner: "%s", name: "%s") {
                %s
            }
        }
        """) % (REPOSITORY_OWNER, REPOSITORY_NAME, query)

    try:
        url = f'{GITHUB_API_URL}/graphql'
        headers = {
            'Authorization': get_authorization_bearer(),
            'Content-Type': 'application/json'
        }
        request_data = (
            json.dumps({'query': constructed_query}).encode('utf-8'))
        request = urllib.request.Request(url, request_data, headers)
        with utils.url_open(request) as response:
            if response.getcode() == 200:
                # Here we use type Any because the API returns a generic
                # JSON object and is in the form of Dict[str, Any]
                data: Dict[str, Any] = (
                    json.loads(response.read().decode('utf-8'))
                        .get('data'))
                return data
            else:
                raise RuntimeError(
                    'Failed to run the GraphQL query due to an ' +
                    'API error: %s' % response.read().decode('utf-8'))
    except Exception as e:
        raise RuntimeError(
            'Failed to run the GraphQL query due to a ' +
            'request error: %s' % e) from e


def fetch_linked_issues_for_pull_request(
    pull_request: int
) -> List[GithubIssueDict]:
    """Fetches the linked issues for a pull request.

    Args:
        pull_request: int. The pull request number.

    Returns:
        List[GithubIssueDict]. The linked issues for the pull request.
    """

    query = textwrap.dedent(
        """
        pullRequest(number: %s) {
            closingIssuesReferences(first: 50) {
                nodes {
                    body
                    number
                    title
                }
            }
        }
        """) % pull_request
    response = run_graphql_query(query)
    linked_issues: List[GithubIssueDict] = (
        deep_get(response, [
            'repository',
            'pullRequest',
            'closingIssuesReferences',
            'nodes']))
    return linked_issues


def fetch_latest_comment_from_issue(
    issue: int
) -> Optional[GithubCommentDict]:
    """Fetches the latest comment from an issue.

    Args:
        issue: int. The issue number.

    Returns:
        str. The latest comment from the issue.
    """

    query = textwrap.dedent(
        """
        issue(number: %s) {
            comments(last: 1) {
                nodes {
                    body
                }
            }
        }
        """) % issue
    response = run_graphql_query(query)
    latest_comment: GithubCommentDict = (
        deep_get(response, [
            'repository',
            'issue',
            'comments',
            'nodes'])[0])
    return latest_comment


def fetch_latest_comment_from_pull_request(
    pull_request: int
) -> Optional[GithubCommentDict]:
    """Fetches the latest comment from a pull request.

    Args:
        pull_request: int. The pull request number.

    Returns:
        str. The latest comment from the pull request.
    """

    query = textwrap.dedent(
        """
        pullRequest(number: %s) {
            comments(last: 1) {
                nodes {
                    body
                }
            }
        }
        """) % pull_request
    response = run_graphql_query(query)
    latest_comment: GithubCommentDict = (
        deep_get(response, [
            'repository',
            'pullRequest',
            'comments',
            'nodes'])[0])
    return latest_comment
