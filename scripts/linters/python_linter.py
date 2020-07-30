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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import importlib
import inspect
import os
import re
import sys
import time

import python_utils

from . import linter_utils
from .. import common
from .. import concurrent_task_utils

_PATHS_TO_INSERT = [
    common.PYLINT_PATH,
    common.PYCODESTYLE_PATH,
    common.PYLINT_QUOTES_PATH
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(1, path)

from pylint import lint  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
from pylint.reporters import text  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
import isort  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
import pycodestyle # isort:skip  pylint: disable=wrong-import-order, wrong-import-position


class StringMessageStream(python_utils.OBJECT):
    """Save and return output stream."""

    def __init__(self):
        """Constructs a StringMessageStream object."""
        self.messages = []

    def write(self, message):
        """Writes the given message to messages list.

        Args:
            message: str. The message to be written.
        """
        self.messages.append(message)

    def read(self):
        """Returns the output messages as a list.

        Returns:
            list(str). The list of output messages.
        """
        return self.messages


class PythonLintChecksManager(python_utils.OBJECT):
    """Manages all the Python linting functions.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(
            self, files_to_lint, file_cache, verbose_mode_enabled):
        """Constructs a PythonLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
            verbose_mode_enabled: bool. True if mode is enabled.
        """
        self.files_to_lint = files_to_lint
        self.file_cache = file_cache
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def py_filepaths(self):
        """Return all Python file paths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.py_filepaths

    def _check_non_test_files(self):
        """This function is used to check that function
           with test_only in their names are in test files.
        """
        summary_messages = []
        files_to_check = self.py_filepaths
        with linter_utils.redirect_stdout(sys.stdout):
            failed = False
            for filepath in files_to_check:
                if filepath.endswith('_test.py'):
                    continue
                for line_num, line in enumerate(self.file_cache.readlines(
                        filepath)):
                    line = line.strip()
                    words = line.split()
                    if len(words) < 2:
                        continue
                    ind1 = words[0].startswith('def')
                    ind2 = words[1].startswith('test_only')
                    if ind1 and ind2:
                        summary_message = (
                            '%s --> Line %s: Please do not use \'test_only\' '
                            'in the non-test file.' % (filepath, line_num + 1))
                        summary_messages.append(summary_message)
                        failed = True

            full_messages = summary_messages
            if failed:
                summary_message = (
                    '%s Function defintion checks failed,'
                    'see affect files above.'
                    % (linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Function definition checks passed'
                    % (linter_utils.SUCCESS_MESSAGE_PREFIX))

            full_messages.append(summary_message)
        status = {
            'name': 'Function definition',
            'failed': failed,
            'full_messages': full_messages,
            'summary_messages': summary_messages
        }
        return status

    def _check_that_all_jobs_are_listed_in_the_job_registry_file(self):
        """This function is used to check that all the one-off and audit jobs
        are registered in jobs_registry.py file.
        """
        def _get_jobs_class_names_in_filepath(filepath, base_class_name):
            """Returns a list of job class names in the given filepath which has
            the given base class.

            Args:
                filepath: str. The filepath of the jobs.
                base_class_name: str. The name of the base class.

            Returns:
                list(str). A list of subclasses of the given base class which
                exist in the given file.
            """
            class_names = []
            filepath_without_extension = filepath[:-len('.py')]
            module_path = filepath_without_extension.replace('/', '.')
            python_module = importlib.import_module(module_path)
            for name, clazz in inspect.getmembers(
                    python_module, predicate=inspect.isclass):
                all_base_classes = [base_class.__name__ for base_class in
                                    (inspect.getmro(clazz))]
                # Check that it's a subclass of 'BaseMapReduceOneOffJobManager'.
                if base_class_name in all_base_classes:
                    class_names.append(name)
            return class_names

        summary_messages = []
        failed = False
        jobs_in_cron = [
            'DashboardStatsOneOffJob',
            'UserDeletionOneOffJob',
            'UserQueryOneOffJob',
            'FullyCompleteUserDeletionOneOffJob'
        ]

        jobs_registry = importlib.import_module('core.jobs_registry')
        expected_one_off_jobs_set = set([
            jobs.__name__ for jobs in jobs_registry.ONE_OFF_JOB_MANAGERS])
        expected_validation_jobs_set = set([
            jobs.__name__ for jobs in jobs_registry.AUDIT_JOB_MANAGERS])

        one_off_jobs_list = []
        validation_jobs_list = []
        for filepath in self.all_filepaths:
            if filepath.endswith('prod_validation_jobs_one_off.py'):
                validation_jobs_list.extend(_get_jobs_class_names_in_filepath(
                    filepath, 'ProdValidationAuditOneOffJob'))
            elif filepath.endswith('_jobs_one_off.py'):
                one_off_jobs_list.extend(_get_jobs_class_names_in_filepath(
                    filepath, 'BaseMapReduceOneOffJobManager'))

        # Removing jobs which are used in cron.
        one_off_jobs_list = [
            job for job in one_off_jobs_list if job not in jobs_in_cron]
        one_off_jobs_set = set(one_off_jobs_list)
        if len(one_off_jobs_list) != len(one_off_jobs_set):
            failed = True
            duplicate_one_off_job_names = (
                linter_utils.get_duplicates_from_list_of_strings(
                    one_off_jobs_list))
            summary_message = 'Found one-off jobs with duplicate names: %s' % (
                ', '.join(duplicate_one_off_job_names))
            summary_messages.append(summary_message)

        if validation_jobs_list:
            # Removes the base validation job class the list.
            validation_jobs_list.remove('ProdValidationAuditOneOffJob')
        validation_jobs_set = set(validation_jobs_list)
        if len(validation_jobs_list) != len(validation_jobs_set):
            failed = True
            duplicate_validation_job_names = (
                linter_utils.get_duplicates_from_list_of_strings(
                    validation_jobs_list))
            summary_message = (
                'Found validation jobs with duplicate names: %s' % (
                    ', '.join(duplicate_validation_job_names)))
            summary_messages.append(summary_message)

        non_registered_one_off_jobs = (
            one_off_jobs_set - expected_one_off_jobs_set)
        if non_registered_one_off_jobs:
            failed = True
            summary_message = (
                'Found one-off jobs not listed in jobs_registry file: %s' % (
                    ',\n'.join(sorted(non_registered_one_off_jobs))))
            summary_messages.append(summary_message)

        non_registered_validation_jobs = (
            validation_jobs_set - expected_validation_jobs_set)
        if non_registered_validation_jobs:
            failed = True
            summary_message = (
                'Found validation jobs not listed in jobs_registry file: %s' % (
                    ',\n'.join(sorted(non_registered_validation_jobs))))
            summary_messages.append(summary_message)

        full_messages = summary_messages
        summary_message = (
            '%s Job registry check %s' % (
                (linter_utils.FAILED_MESSAGE_PREFIX, 'failed') if failed else
                (linter_utils.SUCCESS_MESSAGE_PREFIX, 'passed')))
        full_messages.append(summary_message)
        status = {
            'name': 'Job registry',
            'failed': failed,
            'full_messages': full_messages,
            'summary_messages': summary_messages
        }
        return status

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT('There are no Python files to lint.')
            return []

        linter_stdout = []

        linter_stdout.append(
            self._check_that_all_jobs_are_listed_in_the_job_registry_file())
        linter_stdout.append(self._check_non_test_files())
        return linter_stdout


class ThirdPartyPythonLintChecksManager(python_utils.OBJECT):
    """Manages all the third party Python linting functions.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """

    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a ThirdPartyPythonLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if verbose mode is enabled.
        """
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.files_to_lint

    @staticmethod
    def _get_trimmed_error_output(lint_messages):
        """Remove extra bits from pylint error messages.

        Args:
            lint_messages: list(str). Messages returned by the python linter.

        Returns:
            str. A string with the trimmed error messages.
        """
        trimmed_error_messages = []
        # Remove newlines and coverage report from the end of message.
        # we need to remove last five items from the list because starting from
        # end we have three lines with empty string(''), fourth line
        # contains the coverage report i.e.
        # Your code has been rated at 9.98/10 (previous run: 10.00/10, -0.02)
        # and one line with dashes(---).
        newlines_present = lint_messages[-1] == '\n' and (
            lint_messages[-2] == '\n' and lint_messages[-4] == '\n')
        coverage_present = re.search(
            r'previous run: \d+.\d+/\d+,', lint_messages[-3])
        dashes_present = re.search(r'-+', lint_messages[-5])
        if newlines_present and coverage_present and dashes_present:
            lint_messages = lint_messages[:-5]
        for message in lint_messages:
            # Every pylint message has a message id inside the brackets
            # we are removing them here.
            if message.endswith(')'):
                # Replace message-id with empty string('').
                trimmed_error_messages.append(
                    re.sub(r'\((\w+-*)+\)$', '', message))
            else:
                trimmed_error_messages.append(message)
        return '\n'.join(trimmed_error_messages) + '\n'

    def _lint_py_files(self):
        """Prints a list of lint errors in the given list of Python files.

        Args:
            config_pylint: str. Path to the .pylintrc file.
            config_pycodestyle: str. Path to the tox.ini file.

        Returns:
            summary_messages: list(str). Summary messages of lint check.
        """
        pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')
        config_pylint = '--rcfile=%s' % pylintrc_path
        config_pycodestyle = os.path.join(os.getcwd(), 'tox.ini')

        files_to_lint = self.all_filepaths
        start_time = time.time()
        errors_found = False
        summary_messages = []
        full_messages = []

        num_py_files = len(files_to_lint)

        _batch_size = 50
        current_batch_start_index = 0
        stdout = python_utils.string_io()

        while current_batch_start_index < len(files_to_lint):
            # Note that this index is an exclusive upper bound -- i.e.,
            # the current batch of files ranges from 'start_index' to
            # 'end_index - 1'.
            current_batch_end_index = min(
                current_batch_start_index + _batch_size, len(files_to_lint))
            current_files_to_lint = files_to_lint[
                current_batch_start_index: current_batch_end_index]

            # This line invokes Pylint and redirect its output
            # to the StringMessageStream.
            pylint_report = StringMessageStream()
            pylinter = lint.Run(
                current_files_to_lint + [config_pylint],
                reporter=text.TextReporter(pylint_report),
                exit=False).linter

            if pylinter.msg_status != 0:
                for message in pylint_report.read():
                    full_messages.append(message)
                pylint_error_messages = (
                    self._get_trimmed_error_output(pylint_report.read()))
                summary_messages.append(pylint_error_messages)
                errors_found = True

            with linter_utils.redirect_stdout(stdout):
                # These lines invoke Pycodestyle and print its output
                # to the target stdout.
                style_guide = pycodestyle.StyleGuide(
                    config_file=config_pycodestyle)
                pycodestyle_report = style_guide.check_files(
                    paths=current_files_to_lint)

            if pycodestyle_report.get_count() != 0:
                summary_message = stdout.getvalue()
                full_messages.append(summary_message)
                summary_messages.append(summary_message)
                errors_found = True

            current_batch_start_index = current_batch_end_index

        if errors_found:
            summary_message = (
                '%s Python linting failed' % (
                    linter_utils.FAILED_MESSAGE_PREFIX))
        else:
            summary_message = (
                '%s %s Python files linted (%.1f secs)' % (
                    linter_utils.SUCCESS_MESSAGE_PREFIX, num_py_files,
                    time.time() - start_time))

        full_messages.append(summary_message)

        status = {
            'name': 'Pylint',
            'failed': errors_found,
            'full_messages': full_messages,
            'summary_messages': summary_messages
        }
        return status

    def _lint_py_files_for_python3_compatibility(self):
        """Prints a list of Python 3 compatibility errors in the given list of
        Python files.

        Returns:
            summary_messages: list(str). Summary of lint check.
        """
        files_to_lint = self.all_filepaths
        start_time = time.time()
        any_errors = False
        summary_messages = []
        full_messages = []

        files_to_lint_for_python3_compatibility = [
            file_name for file_name in files_to_lint if not re.match(
                r'^.*python_utils.*\.py$', file_name)]
        num_py_files = len(files_to_lint_for_python3_compatibility)
        if not files_to_lint_for_python3_compatibility:
            full_messages.append(
                'There are no Python files to lint for Python 3 compatibility.')
            return []

        _batch_size = 50
        current_batch_start_index = 0

        while current_batch_start_index < len(
                files_to_lint_for_python3_compatibility):
            # Note that this index is an exclusive upper bound -- i.e.,
            # the current batch of files ranges from 'start_index' to
            # 'end_index - 1'.
            current_batch_end_index = min(
                current_batch_start_index + _batch_size, len(
                    files_to_lint_for_python3_compatibility))
            current_files_to_lint = files_to_lint_for_python3_compatibility[
                current_batch_start_index: current_batch_end_index]

            # This line invokes Pylint and redirect its output
            # to the StringMessageStream.
            pylint_report = StringMessageStream()
            pylinter_for_python3 = lint.Run(
                current_files_to_lint + ['--py3k'],
                reporter=text.TextReporter(pylint_report),
                exit=False).linter

            if pylinter_for_python3.msg_status != 0:
                pylint_error_messages = (
                    self._get_trimmed_error_output(pylint_report.read()))
                summary_messages.append(pylint_error_messages)
                full_messages.append('Messages for Python 3 support:')
                for message in pylint_report.read():
                    full_messages.append(message)
                any_errors = True

            current_batch_start_index = current_batch_end_index

        if any_errors:
            summary_message = (
                '%s Python linting for Python 3 compatibility failed'
                % linter_utils.FAILED_MESSAGE_PREFIX)
        else:
            summary_message = (
                '%s %s Python files linted for Python 3 compatibility '
                '(%.1f secs)'
                % (linter_utils.SUCCESS_MESSAGE_PREFIX, num_py_files, (
                    time.time() - start_time)))

        full_messages.append(summary_message)

        status = {
            'name': 'Pylint for Python 3 compatibility',
            'failed': any_errors,
            'full_messages': full_messages,
            'summary_messages': summary_messages
        }
        return status

    def _check_import_order(self):
        """This function is used to check that each file
        has imports placed in alphabetical order.
        """
        summary_messages = []
        files_to_check = self.all_filepaths
        failed = False
        stdout = python_utils.string_io()
        with linter_utils.redirect_stdout(stdout):
            for filepath in files_to_check:
                # This line prints the error message along with file path
                # and returns True if it finds an error else returns False
                # If check is set to True, isort simply checks the file and
                # if check is set to False, it autocorrects import-order errors.
                if (isort.SortImports(
                        filepath, check=True, show_diff=(
                            True)).incorrectly_sorted):
                    failed = True

            if failed:
                summary_message = stdout.getvalue()
                summary_messages.append(summary_message)
                summary_message = (
                    '%s Import order checks failed, file imports should be '
                    'alphabetized, see affect files above.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Import order checks passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
            full_messages.append(summary_message)
        status = {
            'name': 'Import order',
            'failed': failed,
            'full_messages': full_messages,
            'summary_messages': summary_messages
        }
        return status

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        linter_stdout = []
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT('There are no Python files to lint.')
            return []

        linter_stdout.append(self._lint_py_files())

        linter_stdout.append(self._lint_py_files_for_python3_compatibility())

        linter_stdout.append(self._check_import_order())

        return linter_stdout


def get_linters(files_to_lint, file_cache, verbose_mode_enabled=False):
    """Creates PythonLintChecksManager and ThirdPartyPythonLintChecksManager
        objects and return them.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(PythonLintChecksManager, ThirdPartyPythonLintChecksManager). A
        2-tuple of custom and third_party linter objects.
    """
    custom_linter = PythonLintChecksManager(
        files_to_lint, file_cache, verbose_mode_enabled)

    third_party_linter = ThirdPartyPythonLintChecksManager(
        files_to_lint, verbose_mode_enabled)

    return custom_linter, third_party_linter
