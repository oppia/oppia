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

_PATHS_TO_INSERT = [
    common.PYLINT_PATH,
    common.PYCODESTYLE_PATH,
    common.PYLINT_QUOTES_PATH
]
for path in _PATHS_TO_INSERT:
    sys.path.insert(1, path)

# pylint: disable=wrong-import-order
# pylint: disable=wrong-import-position
from pylint import lint  # isort:skip
import isort  # isort:skip
import pycodestyle # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class PythonLintChecksManager(python_utils.OBJECT):
    """Manages all the Python linting functions.

    Attributes:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.
    """
    def __init__(
            self, files_to_lint, verbose_mode_enabled):
        """Constructs a PythonLintChecksManager object.

        Args:
            files_to_lint: list(str). A list of filepaths to lint.
            verbose_mode_enabled: bool. True if mode is enabled.
        """
        self.files_to_lint = files_to_lint
        self.verbose_mode_enabled = verbose_mode_enabled

    @property
    def py_filepaths(self):
        """Return all Python file paths."""
        return self.files_to_lint

    @property
    def all_filepaths(self):
        """Return all filepaths."""
        return self.py_filepaths

    def _check_import_order(self):
        """This function is used to check that each file
        has imports placed in alphabetical order.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting import-order checks')
            python_utils.PRINT('----------------------------------------')
        summary_messages = []
        files_to_check = self.py_filepaths
        failed = False
        stdout = sys.stdout
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
                    python_utils.PRINT('')

            python_utils.PRINT('')
            if failed:
                summary_message = (
                    '%s Import order checks failed, file imports should be '
                    'alphabetized, see affect files above.' % (
                        linter_utils.FAILED_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
            else:
                summary_message = (
                    '%s Import order checks passed' % (
                        linter_utils.SUCCESS_MESSAGE_PREFIX))
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
        return summary_messages

    def _check_non_test_files(self):
        """This function is used to check that function
           with test_only in their names are in test files.
        """
        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting function defintion checks')
            python_utils.PRINT('----------------------------------------')
        summary_messages = []
        files_to_check = self.py_filepaths
        with linter_utils.redirect_stdout(sys.stdout):
            failed = False
            for filepath in files_to_check:
                if filepath.endswith('_test.py'):
                    continue
                for line_num, line in enumerate(FILE_CACHE.readlines(
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
                        python_utils.PRINT(summary_message)
                        summary_messages.append(summary_message)
                        failed = True

            if failed:
                summary_message = (
                    '%s Function defintion checks failed,'
                    'see affect files above.'
                    % (linter_utils.FAILED_MESSAGE_PREFIX))
            else:
                summary_message = (
                    '%s Function definition checks passed'
                    % (linter_utils.SUCCESS_MESSAGE_PREFIX))

            python_utils.PRINT(summary_message)
            summary_messages.append(summary_message)
        return summary_messages

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

        if self.verbose_mode_enabled:
            python_utils.PRINT('Starting job registry checks')
            python_utils.PRINT('----------------------------------------')
        summary_messages = []
        failed = False
        jobs_in_cron = [
            'DashboardStatsOneOffJob',
            'UserDeletionOneOffJob',
            'UserQueryOneOffJob',
            'VerifyUserDeletionOneOffJob'
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
            python_utils.PRINT(summary_message)
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
            python_utils.PRINT(summary_message)
            summary_messages.append(summary_message)

        non_registered_one_off_jobs = (
            one_off_jobs_set - expected_one_off_jobs_set)
        if non_registered_one_off_jobs:
            failed = True
            summary_message = (
                'Found one-off jobs not listed in jobs_registry file: %s' % (
                    ',\n'.join(sorted(non_registered_one_off_jobs))))
            python_utils.PRINT(summary_message)
            summary_messages.append(summary_message)

        non_registered_validation_jobs = (
            validation_jobs_set - expected_validation_jobs_set)
        if non_registered_validation_jobs:
            failed = True
            summary_message = (
                'Found validation jobs not listed in jobs_registry file: %s' % (
                    ',\n'.join(sorted(non_registered_validation_jobs))))
            python_utils.PRINT(summary_message)
            summary_messages.append(summary_message)

        summary_message = (
            '%s Job registry check %s' % (
                (linter_utils.FAILED_MESSAGE_PREFIX, 'failed') if failed else
                (linter_utils.SUCCESS_MESSAGE_PREFIX, 'passed')))
        python_utils.PRINT(summary_message)
        summary_messages.append(summary_message)
        return summary_messages

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

        import_order_check_message = self._check_import_order()
        job_registry_check_message = (
            self._check_that_all_jobs_are_listed_in_the_job_registry_file())
        test_function_check_message = self._check_non_test_files()
        all_messages = import_order_check_message + job_registry_check_message
        all_messages = all_messages + test_function_check_message
        return all_messages


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

    def _lint_py_files(self, config_pylint, config_pycodestyle):
        """Prints a list of lint errors in the given list of Python files.

        Args:
            config_pylint: str. Path to the .pylintrc file.
            config_pycodestyle: str. Path to the tox.ini file.

        Return:
            summary_messages: list(str). Summary messages of lint check.
        """
        files_to_lint = self.all_filepaths
        start_time = time.time()
        are_there_errors = False
        summary_messages = []

        num_py_files = len(files_to_lint)

        python_utils.PRINT('Linting %s Python files' % num_py_files)

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
            if self.verbose_mode_enabled:
                python_utils.PRINT('Linting Python files %s to %s...' % (
                    current_batch_start_index + 1, current_batch_end_index))

            with linter_utils.redirect_stdout(stdout):
                # This line invokes Pylint and prints its output
                # to the target stdout.
                pylinter = lint.Run(
                    current_files_to_lint + [config_pylint],
                    exit=False).linter
                # These lines invoke Pycodestyle and print its output
                # to the target stdout.
                style_guide = pycodestyle.StyleGuide(
                    config_file=config_pycodestyle)
                pycodestyle_report = style_guide.check_files(
                    paths=current_files_to_lint)

            if pylinter.msg_status != 0 or pycodestyle_report.get_count() != 0:
                summary_message = stdout.getvalue()
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
                are_there_errors = True

            current_batch_start_index = current_batch_end_index

        if are_there_errors:
            summary_message = (
                '%s Python linting failed' % (
                    linter_utils.FAILED_MESSAGE_PREFIX))
        else:
            summary_message = (
                '%s %s Python files linted (%.1f secs)' % (
                    linter_utils.SUCCESS_MESSAGE_PREFIX, num_py_files,
                    time.time() - start_time))

        python_utils.PRINT(summary_message)
        summary_messages.append(summary_message)

        python_utils.PRINT('Python linting finished.')
        return summary_messages

    def _lint_py_files_for_python3_compatibility(self):
        """Prints a list of Python 3 compatibility errors in the given list of
        Python files.

        Returns:
            summary_messages: list(str). Summary of lint check.
        """
        files_to_lint = self.all_filepaths
        start_time = time.time()
        any_errors = False
        stdout = python_utils.string_io()
        summary_messages = []

        files_to_lint_for_python3_compatibility = [
            file_name for file_name in files_to_lint if not re.match(
                r'^.*python_utils.*\.py$', file_name)]
        num_py_files = len(files_to_lint_for_python3_compatibility)
        if not files_to_lint_for_python3_compatibility:
            python_utils.PRINT('')
            python_utils.PRINT(
                'There are no Python files to lint for Python 3 compatibility.')
            return []

        python_utils.PRINT(
            'Linting %s Python files for Python 3 compatibility.' % (
                num_py_files))

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
            if self.verbose_mode_enabled:
                python_utils.PRINT(
                    'Linting Python files for Python 3 compatibility %s to %s..'
                    % (current_batch_start_index + 1, current_batch_end_index))

            with linter_utils.redirect_stdout(stdout):
                # This line invokes Pylint and prints its output
                # to the target stdout.
                python_utils.PRINT('Messages for Python 3 support:')
                pylinter_for_python3 = lint.Run(
                    current_files_to_lint + ['--py3k'], exit=False).linter

            if pylinter_for_python3.msg_status != 0:
                summary_message = stdout.getvalue()
                python_utils.PRINT(summary_message)
                summary_messages.append(summary_message)
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

        python_utils.PRINT(summary_message)
        summary_messages.append(summary_message)

        python_utils.PRINT(
            'Python linting for Python 3 compatibility finished.')
        return summary_messages

    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            all_messages: str. All the messages returned by the lint checks.
        """
        pylintrc_path = os.path.join(os.getcwd(), '.pylintrc')

        config_pylint = '--rcfile=%s' % pylintrc_path

        config_pycodestyle = os.path.join(os.getcwd(), 'tox.ini')

        all_messages = []
        if not self.all_filepaths:
            python_utils.PRINT('')
            python_utils.PRINT('There are no Python files to lint.')
            return []

        all_messages.extend(
            self._lint_py_files(config_pylint, config_pycodestyle))

        all_messages.extend(self._lint_py_files_for_python3_compatibility())

        return all_messages


def get_linters(files_to_lint, verbose_mode_enabled=False):
    """Creates PythonLintChecksManager and ThirdPartyPythonLintChecksManager
        objects and return them.

    Args:
        files_to_lint: list(str). A list of filepaths to lint.
        verbose_mode_enabled: bool. True if verbose mode is enabled.

    Returns:
        tuple(PythonLintChecksManager, ThirdPartyPythonLintChecksManager). A
        2-tuple of custom and third_party linter objects.
    """
    custom_linter = PythonLintChecksManager(
        files_to_lint, verbose_mode_enabled)

    third_party_linter = ThirdPartyPythonLintChecksManager(
        files_to_lint, verbose_mode_enabled)

    return custom_linter, third_party_linter
