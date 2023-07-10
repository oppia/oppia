# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Lint checks for Python files."""

from __future__ import annotations

import ast
import io
import os
import re

import isort.api
import pycodestyle
from pylint import lint
from pylint.reporters import text
from typing import List, Tuple

from . import linter_utils
from .. import concurrent_task_utils


class ThirdPartyPythonLintChecksManager(linter_utils.BaseLinter):
    """Manages all the third party Python linting functions."""

    def __init__(self, files_to_lint: List[str]) -> None:
        """Constructs a ThirdPartyPythonLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
        """
        self.files_to_lint = files_to_lint

    @property
    def all_filepaths(self) -> List[str]:
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def get_trimmed_error_output(lint_message: str) -> str:
        """Remove extra bits from pylint error messages.

        Args:
            lint_message: str. Message returned by the python linter.

        Returns:
            str. A string with the trimmed error messages.
        """
        # Remove newlines and coverage report from the end of message.
        # we need to remove last five items from the list because starting from
        # end we have three lines with empty string(''), fourth line
        # contains the coverage report i.e.
        # Your code has been rated at 9.98/10 (previous run: 10.00/10, -0.02)
        # and one line with dashes(---).
        trimmed_lint_message = re.sub(
            r'\n*-*\n*Your code has been rated.*\n*', '\n', lint_message)

        # Every pylint message has a message id inside the brackets
        # we are removing them here.
        trimmed_lint_message = re.sub(r'\(\S*\)\n', '\n', trimmed_lint_message)

        return trimmed_lint_message

    def lint_py_files(self) -> concurrent_task_utils.TaskResult:
        """Prints a list of lint errors in the given list of Python files.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')
        config_pylint = '--rcfile=%s' % pylintrc_path
        config_pycodestyle = os.path.join(os.getcwd(), 'tox.ini')

        files_to_lint = self.all_filepaths
        errors_found = False
        error_messages = []
        full_error_messages = []
        name = 'Pylint'

        _batch_size = 50
        current_batch_start_index = 0
        stdout = io.StringIO()

        while current_batch_start_index < len(files_to_lint):
            # Note that this index is an exclusive upper bound -- i.e.,
            # the current batch of files ranges from 'start_index' to
            # 'end_index - 1'.
            current_batch_end_index = min(
                current_batch_start_index + _batch_size, len(files_to_lint))
            current_files_to_lint = files_to_lint[
                current_batch_start_index: current_batch_end_index]

            pylint_report = io.StringIO()
            pylinter = lint.Run(
                current_files_to_lint + [config_pylint],
                reporter=text.TextReporter(pylint_report),
                exit=False
            ).linter

            if pylinter.msg_status != 0:
                lint_message = pylint_report.getvalue()
                full_error_messages.append(lint_message)

                pylint_error_messages = (
                    self.get_trimmed_error_output(lint_message))
                error_messages.append(pylint_error_messages)
                errors_found = True

            with linter_utils.redirect_stdout(stdout):
                # These lines invoke Pycodestyle and print its output
                # to the target stdout.
                style_guide = pycodestyle.StyleGuide(
                    config_file=config_pycodestyle)
                pycodestyle_report = style_guide.check_files(
                    paths=current_files_to_lint)

            if pycodestyle_report.get_count() != 0:
                error_message = stdout.getvalue()
                full_error_messages.append(error_message)
                error_messages.append(error_message)
                errors_found = True

            current_batch_start_index = current_batch_end_index

        return concurrent_task_utils.TaskResult(
            name, errors_found, error_messages, full_error_messages)

    def check_import_order(self) -> concurrent_task_utils.TaskResult:
        """This function is used to check that each file
        has imports placed in alphabetical order.

        Returns:
            TaskResult. A TaskResult object representing the result of the lint
            check.
        """
        name = 'Import order'
        error_messages = []
        files_to_check = self.all_filepaths
        failed = False
        stdout = io.StringIO()
        with linter_utils.redirect_stdout(stdout):
            for filepath in files_to_check:
                # This line prints the error message along with file path
                # and returns True if it finds an error else returns False.
                if not isort.api.check_file(filepath, show_diff=True):
                    failed = True

            if failed:
                error_message = stdout.getvalue()
                error_messages.append(error_message)

        return concurrent_task_utils.TaskResult(
            name, failed, error_messages, error_messages)

    def perform_all_lint_checks(
        self
    ) -> List[concurrent_task_utils.TaskResult]:
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(TaskResult). A list of TaskResult objects representing the
            results of the lint checks.
        """
        linter_stdout = []
        if not self.all_filepaths:
            return [
                concurrent_task_utils.TaskResult(
                    'Python lint', False, [],
                    ['There are no Python files to lint.'])]

        batch_jobs_dir: str = (
            os.path.join(os.getcwd(), 'core', 'jobs', 'batch_jobs')
        )
        jobs_registry: str = (
            os.path.join(os.getcwd(), 'core', 'jobs', 'registry.py')
        )

        linter_stdout.append(self.lint_py_files())
        linter_stdout.append(self.check_import_order())
        linter_stdout.append(check_jobs_imports(
            batch_jobs_dir, jobs_registry)
        )

        return linter_stdout


def check_jobs_imports(
    batch_jobs_dir: str, jobs_registry: str
) -> concurrent_task_utils.TaskResult:
    """This function is used to check that all `jobs.batch_jobs.*_jobs` are
    imported in `jobs.registry`.

    Args:
        batch_jobs_dir: str. The path to the batch_jobs directory.
        jobs_registry: str. The path to the jobs registry file.

    Returns:
        TaskResult. A TaskResult object representing the result of the lint
        check.
    """
    jobs_files: List[str] = [
        filename.split('.')[0] for filename in os.listdir(batch_jobs_dir)
        if filename.endswith('_jobs.py')
    ]

    with open(jobs_registry, 'r', encoding='utf-8') as file:
        contents = file.read()
    tree = ast.parse(contents)

    imports: List[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for n in node.names:
                imports.append(n.name.split('.')[-1])
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                imports.append(alias.name)

    missing_imports: List[str] = []
    for job_file in jobs_files:
        if job_file not in imports:
            missing_imports.append(job_file)

    error_messages: List[str] = []
    if missing_imports:
        error_message = 'Following jobs should be imported in %s:\n%s' % (
            os.path.relpath(jobs_registry), (', '.join(missing_imports))
        )
        error_messages.append(error_message)
    return concurrent_task_utils.TaskResult(
        'Check jobs imports in jobs registry',
        bool(missing_imports),
        error_messages,
        error_messages
    )


def get_linters(
    files_to_lint: List[str]
) -> Tuple[None, ThirdPartyPythonLintChecksManager]:
    """Creates ThirdPartyPythonLintChecksManager and returns it.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.

    Returns:
        tuple(None, ThirdPartyPythonLintChecksManager). A 2-tuple of None and
        third_party linter objects.
    """
    return None, ThirdPartyPythonLintChecksManager(files_to_lint)
