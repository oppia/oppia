# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Helpers for the scripts.linters.run_lint_checks module.

Do not use this module anywhere else in the code base!
"""

from __future__ import annotations

import abc
import collections
import contextlib
import shutil
import sys
import tempfile

from typing import Dict, Iterator, List, Optional, TextIO

from .. import concurrent_task_utils


@contextlib.contextmanager
def redirect_stdout(new_target: TextIO) -> Iterator[TextIO]:
    """Redirect stdout to the new target.

    Args:
        new_target: TextIOWrapper. The new target to which stdout is redirected.

    Yields:
        TextIOWrapper. The new target.
    """
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def get_duplicates_from_list_of_strings(strings: List[str]) -> List[str]:
    """Returns a list of duplicate strings in the list of given strings.

    Args:
        strings: list(str). A list of strings.

    Returns:
        list(str). A list of duplicate string present in the given list of
        strings.
    """
    duplicates = []
    item_count_map: Dict[str, int] = collections.defaultdict(int)
    for string in strings:
        item_count_map[string] += 1
        # Counting as duplicate once it's appeared twice in the list.
        if item_count_map[string] == 2:
            duplicates.append(string)

    return duplicates


@contextlib.contextmanager
def temp_dir(
    suffix: str = '', prefix: str = '', parent: Optional[str] = None
) -> Iterator[str]:
    """Creates a temporary directory which is only usable in a `with` context.

    Args:
        suffix: str. Appended to the temporary directory.
        prefix: str. Prepended to the temporary directory.
        parent: str or None. The parent directory to place the temporary one. If
            None, a platform-specific directory is used instead.

    Yields:
        str. The full path to the temporary directory.
    """
    new_dir = tempfile.mkdtemp(suffix=suffix, prefix=prefix, dir=parent)
    try:
        yield new_dir
    finally:
        shutil.rmtree(new_dir)


def print_failure_message(failure_message: str) -> None:
    """Prints the given failure message in red color.

    Args:
        failure_message: str. The failure message to print.
    """
    # \033[91m is the ANSI escape sequences for red color.
    print('\033[91m' + failure_message + '\033[0m')


def print_success_message(success_message: str) -> None:
    """Prints the given success_message in red color.

    Args:
        success_message: str. The success message to print.
    """
    # \033[91m is the ANSI escape sequences for green color.
    print('\033[92m' + success_message + '\033[0m')


class BaseLinter(abc.ABC):
    """Base abstract linter manager for all linters."""

    @abc.abstractmethod
    def perform_all_lint_checks(self) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns a list of TaskResult objects
        representing the results of the lint checks.
        """
