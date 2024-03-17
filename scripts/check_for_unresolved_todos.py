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

from scripts import github_api
from scripts import todo_finder

from typing import List, Optional

UNRESOLVED_TODOS_PRESENT_INDICATOR = (
    'THERE ARE TODOS ASSOCIATED WITH THE PROVIDED ISSUES.')
UNRESOLVED_TODOS_NOT_PRESENT_INDICATOR = (
    'THERE ARE NO TODOS ASSOCIATED WITH THE PROVIDED ISSUES.')

UNRESOLVED_TODO_LIST_FILE_PATH = 'unresolved_todo_list.txt'

_PARSER = argparse.ArgumentParser(
    description="""
Checks if there are any todos associated with the provided issues.
""")

# TODO(#19755): Testing.
_PARSER.add_argument(
    '--repository_path', type=str,
    required=True, help='The path to the repository to check for todos.')

_PARSER.add_argument(
    '--issue', type=int,
    help='The issue number to check for todos.')

_PARSER.add_argument(
    '--pull_request', type=int,
    help='The pull request to check for todos.')

_PARSER.add_argument(
    '--commit_sha', type=str,
    help='The commit SHA to which we will display the todo in.')

_PARSER.add_argument(
    '--generate_github_file',
    help='If true, generates a file with the todos and their github link. '
         'The default value is false.',
    action='store_true')


# TODO(#19755): Testing.
def check_if_todo_is_associated_with_issue(
    todo: todo_finder.TodoDict,
    issue_number: int
) -> bool:
    """Checks if the todo is associated with the issue.

    Args:
        todo: TodoDict. The todo to check.
        issue_number: int. The issue number to check for.

    Returns:
        bool. Whether the todo is associated with the issue.
    """
    parsed_todo_number = (
        todo_finder.get_issue_number_from_todo(todo['line_content']))
    return parsed_todo_number == issue_number


def append_todos_to_file(
    repository_path: str,
    todos: List[todo_finder.TodoDict],
    github_perma_link_url: str,
    issue_number: int
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
        repository_path + UNRESOLVED_TODO_LIST_FILE_PATH, 'a',
        encoding='utf-8'
    ) as file:
        file.write(
            f'The following TODOs are unresolved for '
            f'this issue #{str(issue_number)}:\n')
        for todo in sorted(
            todos,
            key=lambda todo: (todo['file_path'], todo['line_number'])
        ):
            file.write(
                f'{github_perma_link_url}/' +
                todo['file_path'].replace(repository_path, '', 1) +
                '#L' + str(todo['line_number']) + '\n')


def log_unresolved_todos_failure(
    repository_path: str,
    todos: List[todo_finder.TodoDict],
    issue_number: int
) -> None:
    """Logs the unresolved todos to the console.

    Args:
        repository_path: str. The path to the repository.
        todos: List[TodoDict]. The todos to log.
        issue_number: int. The issue number that the todos are associated with.
    """
    print(
        'The following TODOs are unresolved ' +
        'for this issue #' + str(issue_number) + ':')
    for todo in sorted(
        todos,
        key=lambda todo: (todo['file_path'], todo['line_number'])
    ):
        print(
            '- ' + todo['file_path'].replace(repository_path, '', 1) +
            ':L' + str(todo['line_number']))


def main(args: Optional[List[str]] = None) -> None:
    """Checks if there are any todos associated with issues provided."""

    parsed_args = _PARSER.parse_args(args)

    repository_path = f'{parsed_args.repository_path}/'
    github_perma_link_url = (
        f'https://github.com/oppia/oppia/blob/{parsed_args.commit_sha}')

    issues_to_check: List[int] = []
    if parsed_args.issue:
        issues_to_check.append(parsed_args.issue)
    if parsed_args.pull_request:
        linked_issues = (
            github_api.fetch_linked_issues_for_pull_request(
                parsed_args.pull_request))
        for linked_issue in linked_issues:
            issues_to_check.append(linked_issue['number'])

    todos: List[todo_finder.TodoDict] = (
        todo_finder.get_correctly_formated_todos(
            todo_finder.get_todos(repository_path)))

    todos_found = False
    for issue_number in issues_to_check:
        todos_associated_with_issue = (
            [todo for todo in todos if
                check_if_todo_is_associated_with_issue(todo, issue_number)])
        if todos_associated_with_issue:
            todos_found = True
            log_unresolved_todos_failure(
                repository_path,
                todos_associated_with_issue,
                issue_number)
            if parsed_args.generate_file:
                append_todos_to_file(
                    repository_path,
                    todos_associated_with_issue,
                    github_perma_link_url,
                    issue_number)
    if todos_found:
        raise Exception(UNRESOLVED_TODOS_PRESENT_INDICATOR)
    print(UNRESOLVED_TODOS_NOT_PRESENT_INDICATOR)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
