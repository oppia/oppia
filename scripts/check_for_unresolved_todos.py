# Copyright 2024 The Oppia Authors. All Rights Reserved.
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
"""Checks if there are any todos associated with the provided issues."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import textwrap
import urllib.request

from scripts import todo_finder

from typing import Any, Dict, List, Optional, TypedDict

# GitHub repository information.
REPOSITORY_OWNER = os.environ.get('GITHUB_REPOSITORY', 'oppia/oppia').split(
    '/'
)[0]
REPOSITORY_NAME = os.environ.get('GITHUB_REPOSITORY', 'oppia/oppia').split('/')[
    1
]
GITHUB_API_URL = 'https://api.github.com'


class GitHubIssueDict(TypedDict):
    """Dict representation of a GitHub issue."""

    body: str
    number: int
    title: str


class GitHubCommentDict(TypedDict):
    """Dict representation of a GitHub comment."""

    body: str


# Here we use type Any because the nested dictionary from GraphQL response
# can contain values of various types (strings, ints, dicts, lists, etc.),
# and we cannot predict or specify the exact type of nested values.
def deep_get(data: Optional[Dict[str, Any]], keys: List[str]) -> Any:
    """Gets a value from a nested dictionary. If the key is not found, it
    returns None.

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
    """Gets the GitHub auth token.

    Returns:
        str. The GitHub auth token.

    Raises:
        RuntimeError. GitHub CLI is not installed.
        RuntimeError. Failed to get GitHub auth token.
    """
    env = os.environ.copy()
    # Prefer environment variables (used by GitHub Actions + can be set locally)
    # and fall back to GitHub CLI token resolution.
    github_token = env.get('GH_TOKEN') or env.get('GITHUB_TOKEN')
    if github_token:
        return github_token

    process = subprocess.run(
        ['gh', 'help'],
        env=env,
        check=False,
        encoding='utf-8',
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    if process.returncode:
        raise RuntimeError(
            'GitHub CLI is not installed. Please install the GitHub CLI '
            'before running GitHub API functions.'
        )
    process = subprocess.run(
        ['gh', 'auth', 'token'],
        capture_output=True,
        encoding='utf-8',
        env=env,
        check=False,
    )
    if process.returncode:
        raise RuntimeError(
            'Failed to get GitHub auth token from the GitHub CLI.'
        )
    return process.stdout.strip()


def get_github_api_authorization_header() -> str:
    """Formats the GitHub auth token to be used as an authorization header."""
    return f'Bearer {get_github_auth_token()}'


# Here we use type Any because the GraphQL API returns a generic JSON object
# with dynamic structure based on the query, so we cannot specify exact types
# for all nested values in the response dictionary.
def run_graphql_query(query: str) -> Dict[str, Any]:
    """Runs a GraphQL query on the Oppia repository.

    Args:
        query: str. The query to run.

    Returns:
        Dict[str, Any]. The response from the GraphQL query in JSON.

    Raises:
        RuntimeError. Failed to run GraphQL query due to a request error.
        RuntimeError. Failed to run GraphQL query due to an API error.
    """
    constructed_query = (
        textwrap.dedent(
            """
        query {
            repository(owner: "%s", name: "%s") {
                %s
            }
        }
        """
        )
        % (REPOSITORY_OWNER, REPOSITORY_NAME, query)
    )
    try:
        url = f'{GITHUB_API_URL}/graphql'
        headers = {
            'Authorization': get_github_api_authorization_header(),
            'Content-Type': 'application/json',
        }
        request_data = json.dumps({'query': constructed_query}).encode('utf-8')
        request = urllib.request.Request(url, request_data, headers)
        with urllib.request.urlopen(request) as response:
            if response.getcode() == 200:
                # Here we use type Any because the json.loads() result contains
                # a generic JSON object with dynamic keys and values that vary
                # based on the GraphQL query structure.
                data: Dict[str, Any] = json.loads(
                    response.read().decode('utf-8')
                ).get('data')
                return data
            else:
                raise RuntimeError(
                    'Failed to run the GraphQL query due to an '
                    + 'API error: %s' % response.read().decode('utf-8')
                )
    except Exception as e:
        raise RuntimeError(
            'Failed to run the GraphQL query due to a '
            + 'request error: %s' % e
        ) from e


def fetch_linked_issues_for_pull_request(
    pull_request: int,
) -> List[GitHubIssueDict]:
    """Fetches the linked issues for a pull request.

    Args:
        pull_request: int. The pull request number.

    Returns:
        List[GitHubIssueDict]. The linked issues for the pull request.

    Raises:
        Exception. The pull request does not exist.
    """
    query = (
        textwrap.dedent(
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
        """
        )
        % pull_request
    )
    response = run_graphql_query(query)
    linked_issues: List[GitHubIssueDict] = deep_get(
        response,
        ['repository', 'pullRequest', 'closingIssuesReferences', 'nodes'],
    )
    if linked_issues is None:
        raise Exception('The pull request (#%s) does not exist.' % pull_request)
    return linked_issues


def fetch_latest_comment_for_issue(
    issue_number: int,
) -> Optional[GitHubCommentDict]:
    """Fetches the latest comment from an issue.

    Args:
        issue_number: int. The issue number.

    Returns:
        Optional[GitHubCommentDict]. The latest comment from the issue.

    Raises:
        Exception. The issue does not exist.
    """
    query = (
        textwrap.dedent(
            """
        issue(number: %s) {
            comments(last: 1) {
                nodes {
                    body
                }
            }
        }
        """
        )
        % issue_number
    )
    response = run_graphql_query(query)
    latest_comment_nodes = deep_get(
        response, ['repository', 'issue', 'comments', 'nodes']
    )
    if latest_comment_nodes is None:
        raise Exception('The issue (#%s) does not exist.' % issue_number)
    return next(iter(latest_comment_nodes), None)


def fetch_latest_comment_from_pull_request(
    pull_request: int,
) -> Optional[GitHubCommentDict]:
    """Fetches the latest comment from a pull request.

    Args:
        pull_request: int. The pull request number.

    Returns:
        Optional[GitHubCommentDict]. The latest comment from the pull request.

    Raises:
        Exception. The pull request does not exist.
    """
    query = (
        textwrap.dedent(
            """
        pullRequest(number: %s) {
            comments(last: 1) {
                nodes {
                    body
                }
            }
        }
        """
        )
        % pull_request
    )
    response = run_graphql_query(query)
    latest_comment_nodes = deep_get(
        response, ['repository', 'pullRequest', 'comments', 'nodes']
    )
    if latest_comment_nodes is None:
        raise Exception('The pull request (#%s) does not exist.' % pull_request)
    return next(iter(latest_comment_nodes), None)


# TODO(#9): Temporary workflow test first.
# TODO(#9): Temporary workflow test SECOND.
# TODO(#9): Temporary workflow test third.
# TODO(#9): Temporary workflow test forth.
# TODO(#9): Temporary workflow test FIVE.
# TODO(#11): Temporary workflow test firsts.
# TODO(#11): Temporary workflow test seconds.
# TODO(#13): Temporary workflow test seconds for the second issue.
# TODO(#14): Temporary workflow test seconds for the third issue.
# TODO(#15): Temporary workflow test seconds for the forth issue.

UNRESOLVED_TODOS_PRESENT_INDICATOR = (
    'THERE ARE TODOS ASSOCIATED WITH THE PROVIDED ISSUES.'
)
UNRESOLVED_TODOS_NOT_PRESENT_INDICATOR = (
    'THERE ARE NO TODOS ASSOCIATED WITH THE PROVIDED ISSUES.'
)
UNRESOLVED_TODO_LIST_FILE_PATH = 'unresolved_todo_list.txt'

_PARSER = argparse.ArgumentParser(
    description="""
Checks if there are any todos associated with the provided issues.
"""
)

_PARSER.add_argument(
    '--repository_path',
    type=str,
    required=True,
    help='The path to the repository to check for todos.',
)
_PARSER.add_argument(
    '--issue', type=int, help='The issue number to check for todos.'
)
_PARSER.add_argument(
    '--pull_request', type=int, help='The pull request to check for todos.'
)
_PARSER.add_argument(
    '--commit_sha',
    type=str,
    help='The commit SHA to which we will display the todo in.',
)
_PARSER.add_argument(
    '--generate_github_file',
    help='If true, generates a file with the todos and their github link. '
    'The default value is false.',
    action='store_true',
)


def check_if_todo_is_associated_with_issue(
    todo: todo_finder.TodoDict, issue_number: int
) -> bool:
    """Checks if the todo is associated with the issue.

    Args:
        todo: TodoDict. The todo to check.
        issue_number: int. The issue number to check for.

    Returns:
        bool. Whether the todo is associated with the issue.
    """
    parsed_todo_number = todo_finder.get_issue_number_from_todo(
        todo['line_content']
    )
    return parsed_todo_number == issue_number


def append_todos_to_file(
    repository_path: str,
    todos: List[todo_finder.TodoDict],
    github_perma_link_url: str,
    issue_number: int,
) -> None:
    """Appends to the todo list file with the todos information and the github
    perma link for the line.

    Args:
        repository_path: str. The path to the repository.
        todos: List[TodoDict]. The todos to generate the file with.
        github_perma_link_url: str. The github perma link url.
        issue_number: int. The issue number that the todos are associated with.
    """
    with open(
        repository_path + UNRESOLVED_TODO_LIST_FILE_PATH, 'a', encoding='utf-8'
    ) as file:
        file.write(
            f'The following TODOs are unresolved for '
            f'this issue #{str(issue_number)}:\n'
        )
        for todo in sorted(
            todos, key=lambda todo: (todo['file_path'], todo['line_number'])
        ):
            relative_path = todo['file_path'].replace(repository_path, '', 1)
            full_url = (
                f'{github_perma_link_url}/'
                + relative_path
                + '#L'
                + str(todo['line_number'])
            )
            display_text = (
                'oppia/' + relative_path + '#L' + str(todo['line_number'])
            )
            file.write(f'[{display_text}]({full_url})\n')


def log_unresolved_todos_failure(
    repository_path: str, todos: List[todo_finder.TodoDict], issue_number: int
) -> None:
    """Logs the unresolved todos to the console.

    Args:
        repository_path: str. The path to the repository.
        todos: List[TodoDict]. The todos to log.
        issue_number: int. The issue number that the todos are associated with.
    """
    print(f'The following TODOs are unresolved for this issue #{issue_number}:')
    for todo in sorted(
        todos, key=lambda todo: (todo['file_path'], todo['line_number'])
    ):
        print(
            '- '
            + todo['file_path'].replace(repository_path, '', 1)
            + ':L'
            + str(todo['line_number'])
        )


def main(args: Optional[List[str]] = None) -> None:
    """Checks if there are any todos associated with issues provided."""
    parsed_args = _PARSER.parse_args(args)
    repository_path = f'{parsed_args.repository_path}/'
    github_perma_link_url = (
        f'https://github.com/oppia/oppia/blob/{parsed_args.commit_sha}'
    )

    issues_to_check: List[int] = []
    if parsed_args.issue:
        issues_to_check.append(parsed_args.issue)
    if parsed_args.pull_request:
        linked_issues = fetch_linked_issues_for_pull_request(
            parsed_args.pull_request
        )
        for linked_issue in linked_issues:
            issues_to_check.append(linked_issue['number'])

    todos: List[todo_finder.TodoDict] = (
        todo_finder.get_correctly_formated_todos(
            todo_finder.get_todos(repository_path)
        )
    )

    todos_found = False
    for issue_number in issues_to_check:
        todos_associated_with_issue = [
            todo
            for todo in todos
            if check_if_todo_is_associated_with_issue(todo, issue_number)
        ]
        if todos_associated_with_issue:
            todos_found = True
            log_unresolved_todos_failure(
                repository_path, todos_associated_with_issue, issue_number
            )
            if parsed_args.generate_github_file:
                append_todos_to_file(
                    repository_path,
                    todos_associated_with_issue,
                    github_perma_link_url,
                    issue_number,
                )

    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        with open(github_output, 'a', encoding='utf-8') as o:
            print(f'unresolved_todos_found={str(todos_found).lower()}', file=o)

    if todos_found:
        raise Exception(UNRESOLVED_TODOS_PRESENT_INDICATOR)

    print(UNRESOLVED_TODOS_NOT_PRESENT_INDICATOR)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
