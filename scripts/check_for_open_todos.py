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

from scripts import todo_finder

from typing import List, Optional

_PARSER = argparse.ArgumentParser(
    description="""
Checks if there are any todos associated with the provided issues.
""")

_PARSER.add_argument(
    '--repository_path', type=str,
    help='The path to the repository to check for todos.')

_PARSER.add_argument(
    '--issue_number', type=str,
    help='The issue number to check for todos.')

_PARSER.add_argument(
    '--issue_file', type=str,
    help='The issue file where the issues to check for todos are stored.')

_PARSER.add_argument(
    '--commit_sha', type=str,
    help='The commit SHA to which we will display the todo in.')


def remove_prefix(text: str, prefix: str) -> str:
    """Removes the prefix from the text if it is present."""
    if text.startswith(prefix):
        return text[len(prefix):]
    return text


def check_if_todo_is_associated_with_issue(
    todo: todo_finder.TodoDict,
    issue_number: str
) -> bool:
    """Checks if the todo is associated with the issue.

    Args:
        todo: TodoDict. The todo to check.
        issue_number: str. The issue number to check for.

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
    issue_number: str
) -> None:
    """Appends to the todo list file with the todos information and the github 
    perma link for the line.

    Args:
        repository_path: str. The path to the repository.
        todos: List[TodoDict]. The todos to generate the file with.
        github_perma_link_url: str. The github perma link url.
        issue_number: str. The issue number that the todos are associated with.
    """
    with open(repository_path + 'todo_list.txt', 'a', encoding='utf-8') as file:
        file.write(
            f'The following todos are associated '
            f'with this issue #{issue_number}:\n')
        for todo in todos:
            file.write(
                f'{github_perma_link_url}/' +
                remove_prefix(todo['file_path'], repository_path) +
                '#L' + str(todo['line_number']) + '\n')


def main(args: Optional[List[str]] = None) -> None:
    """Checks if there are any todos associated with issues in a file."""

    parsed_args = _PARSER.parse_args(args)

    repository_path = f'{parsed_args.repository_path}/'
    github_perma_link_url = (
        f'https://github.com/oppia/oppia/blob/{parsed_args.commit_sha}')

    issues_to_check: List[str] = []
    if parsed_args.issue_number:
        issues_to_check.append(parsed_args.issue_number)
    if parsed_args.issue_file:
        with open(
            repository_path + parsed_args.issue_file, 'r', encoding='utf-8'
        ) as file:
            for issue_number in file:
                issues_to_check.append(issue_number.strip())

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
            append_todos_to_file(
                repository_path,
                todos_associated_with_issue,
                github_perma_link_url,
                issue_number)
    if todos_found:
        raise Exception('There are todos associated with the provided issues.')
    print('There are no todos associated with the provided issues.', end='')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
