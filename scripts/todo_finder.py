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

"""General functions to extract todos from a repository."""

from __future__ import annotations

import os
import re

from typing import List, Optional, TypedDict

EXCLUDED_DIRECTORIES = [
    # Directories that should be excluded from the search.
    'node_modules',
    'third_party',
    '.direnv',
    '.mypy_cache',
    'webpack_bundles',
    '.git',
    'dist'
]

# Regex to detect general todos, doesn't have to be correctly formatted.
TODO_REGEX = re.compile(r'\bTODO\b', re.IGNORECASE)
# Regex to detect correctly formatted todos, e.g. "TODO(#1234): Description".
CORRECT_TODO_REGEX = re.compile(r'TODO\(#(\d+)\): .+')


# TODO(#19755): Testing
class TodoDict(TypedDict):
    """Dict representation of a todo."""

    file_path: str
    line_content: str
    line_number: int


def is_file_excluded(file_path: str) -> bool:
    """Checks if the file should be excluded from the search.

    Args:
        file_path: str. The file path to check.

    Returns:
        bool. Whether the file should be excluded from the search.
    """
    exclude_criteria = (
        [file_path.startswith(exclude_directory) for
            exclude_directory in EXCLUDED_DIRECTORIES])
    return any(exclude_criteria)


def get_search_files(repository_path: str) -> List[str]:
    """Gets the files to search for todos.

    Args:
        repository_path: str. The path to the repository.

    Returns:
        List[str]. The files to search for todos.
    """
    search_files: List[str] = []
    for root, _, files in os.walk(repository_path):
        for file in files:
            file_path = os.path.join(root, file)
            relative_file_path = os.path.relpath(file_path, repository_path)
            if (
                not is_file_excluded(relative_file_path) and
                os.path.isfile(file_path)
            ):
                search_files.append(file_path)
    return search_files


def get_todo_in_line(
    file_path: str,
    line_content: str,
    line_number: int
) -> Optional[TodoDict]:
    """Gets the todo in the line if it exists.

    Args:
        file_path: str. The path to the file.
        line_content: str. The content of the line.
        line_number: int. The line number.

    Returns:
        Optional[TodoDict]. The todo if it exists.
    """
    if TODO_REGEX.search(line_content):
        return {
            'file_path': file_path,
            'line_content': line_content.strip(),
            'line_number': line_number
        }
    return None


def get_todos(repository_path: str) -> List[TodoDict]:
    """Gets the todos in the repository.

    Args:
        repository_path: str. The path to the repository.

    Returns:
        List[TodoDict]. The todos in the repository.
    """
    search_files = get_search_files(repository_path)
    todos: List[TodoDict] = []
    for file_path in search_files:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
            for line_index, line_content in enumerate(file, start=1):
                todo: Optional[TodoDict] = (
                    get_todo_in_line(file_path, line_content, line_index))
                if todo:
                    todos.append(todo)
    return todos


def get_issue_number_from_todo(line_content: str) -> Optional[int]:
    """Gets the issue number from the todo.

    Args:
        line_content: str. The content of the line.

    Returns:
        Optional[int]. The issue number if it exists.
    """
    issue_number = CORRECT_TODO_REGEX.search(line_content)
    if issue_number:
        return int(issue_number.group(1))
    return None


def get_correctly_formated_todos(todos: List[TodoDict]) -> List[TodoDict]:
    """Gets the correctly formated todos.

    Args:
        todos: List[TodoDict]. The todos to check.

    Returns:
        List[TodoDict]. The correctly formated todos.
    """
    return [todo for todo in todos if
                CORRECT_TODO_REGEX.search(todo['line_content'])]
