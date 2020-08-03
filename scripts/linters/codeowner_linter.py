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

"""Lint checks for codeowner file."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import glob
import os
import subprocess

import python_utils
from .. import concurrent_task_utils

CODEOWNER_FILEPATH = '.github/CODEOWNERS'

# This list needs to be in sync with the important patterns in the CODEOWNERS
# file.
CODEOWNER_IMPORTANT_PATHS = [
    '/core/controllers/acl_decorators*.py',
    '/core/controllers/base*.py',
    '/core/domain/html*.py',
    '/core/domain/rights_manager*.py',
    '/core/domain/role_services*.py',
    '/core/domain/user*.py',
    '/core/storage/',
    '/export/',
    '/manifest.json',
    '/package.json',
    '/yarn.lock',
    '/scripts/install_third_party_libs.py',
    '/.github/',
    '/.github/CODEOWNERS',
    '/.github/stale.yml',
    '/.github/workflows/']


class CodeOwnerLintChecksManager(python_utils.OBJECT):
    """Manages codeowner checks."""

    def __init__(self, file_cache):
        """Constructs a PythonLintChecksManager object.

        Args:
            file_cache: object(FileCache). Provides thread-safe access to cached
                file content.
        """
        self.file_cache = file_cache

    def _walk_with_gitignore(self, root, exclude_dirs):
        """A walk function similar to os.walk but this would ignore the files
        and directories which is not tracked by git. Also, this will ignore the
        directories mentioned in exclude_dirs.

        Args:
            root: str. The path from where the function should start walking.
            exclude_dirs: list(str). A list of dir path which should be ignored.

        Yields:
            list(str). A list of unignored files.
        """
        dirs, file_paths = [], []
        for name in os.listdir(root):
            if os.path.isdir(os.path.join(root, name)):
                dirs.append(os.path.join(root, name))
            else:
                file_paths.append(os.path.join(root, name))

        yield [
            file_path for file_path in file_paths if not self._is_path_ignored(
                file_path)]

        for dir_path in dirs:
            # Adding "/" in the end of the dir path according to the git dir
            # path structure.
            if (not self._is_path_ignored(dir_path + '/')) and (
                    dir_path not in exclude_dirs):
                for x in self._walk_with_gitignore(dir_path, exclude_dirs):
                    yield x


    def _is_path_ignored(self, path_to_check):
        """Checks whether the given path is ignored by git.

        Args:
            path_to_check: str. A path to a file or a dir.

        Returns:
            bool. Whether the given path is ignored by git.
        """
        command = ['git', 'check-ignore', '-q', path_to_check]

        # The "git check-ignore <path>" command returns 0 when the path is
        # ignored otherwise it returns 1. subprocess.call then returns this
        # returncode.

        return subprocess.call(command) == 0


    def _is_path_contains_frontend_specs(self, path_to_check):
        """Checks whether if a path contains all spec files.

        Args:
            path_to_check: str. A path to a file or a dir.

        Returns:
            bool. Whether the given path contains all spec files.
        """
        return '*.spec.ts' in path_to_check or '*Spec.ts' in path_to_check


    def _check_for_important_patterns_at_bottom_of_codeowners(
            self, important_patterns):
        """Checks that the most important patterns are at the bottom
        of the CODEOWNERS file.

        Arguments:
            important_patterns: list(str). List of the important
                patterns for CODEOWNERS file.

        Returns:
            tuple(bool, str). A 2-tuple of whether the CODEOWNERS "important
            pattern" check fails and failed messages list.
        """

        failed = False
        summary_messages = []

        # Check that there are no duplicate elements in the lists.
        important_patterns_set = set(important_patterns)
        codeowner_important_paths_set = set(CODEOWNER_IMPORTANT_PATHS)
        if len(important_patterns_set) != len(important_patterns):
            summary_message = (
                '%s --> Duplicate pattern(s) found in critical rules'
                ' section.' % CODEOWNER_FILEPATH)
            summary_messages.append(summary_message)
            failed = True
        if len(codeowner_important_paths_set) != len(CODEOWNER_IMPORTANT_PATHS):
            summary_message = (
                'scripts/linters/pre_commit_linter.py --> Duplicate pattern(s) '
                'found in CODEOWNER_IMPORTANT_PATHS list.')
            summary_messages.append(summary_message)
            failed = True

        # Check missing rules by set difference operation.
        critical_rule_section_minus_list_set = (
            important_patterns_set.difference(codeowner_important_paths_set))
        list_minus_critical_rule_section_set = (
            codeowner_important_paths_set.difference(important_patterns_set))
        for rule in critical_rule_section_minus_list_set:
            summary_message = (
                '%s --> Rule %s is not present in the '
                'CODEOWNER_IMPORTANT_PATHS list in '
                'scripts/linters/pre_commit_linter.py. Please add this rule in '
                'the mentioned list or remove this rule from the \'Critical '
                'files\' section.' % (CODEOWNER_FILEPATH, rule))
            summary_messages.append(summary_message)
            failed = True
        for rule in list_minus_critical_rule_section_set:
            summary_message = (
                '%s --> Rule \'%s\' is not present in the \'Critical files\' '
                'section. Please place it under the \'Critical files\' '
                'section since it is an important rule. Alternatively please '
                'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
                'scripts/linters/pre_commit_linter.py if it is no longer an '
                'important rule.' % (CODEOWNER_FILEPATH, rule))
            summary_messages.append(summary_message)
            failed = True

        return failed, summary_messages


    def check_codeowner_file(self):
        """Checks the CODEOWNERS file for any uncovered dirs/files and also
        checks that every pattern in the CODEOWNERS file matches at least one
        file/dir. Note that this checks the CODEOWNERS file according to the
        glob patterns supported by Python2.7 environment. For more information
        please refer https://docs.python.org/2/library/glob.html.
        This function also ensures that the most important rules are at the
        bottom of the CODEOWNERS file.

        Returns:
            OutputStream. An OutputStream object to retrieve the status of a
            lint check.
        """
        name = 'CODEOWNERS'
        failed = False
        summary_messages = []
        # Checks whether every pattern in the CODEOWNERS file matches at
        # least one dir/file.
        critical_file_section_found = False
        important_rules_in_critical_section = []
        file_patterns = []
        dir_patterns = []
        for line_num, line in enumerate(self.file_cache.readlines(
                CODEOWNER_FILEPATH)):
            stripped_line = line.strip()
            if '# Critical files' in line:
                critical_file_section_found = True
            if stripped_line and stripped_line[0] != '#':
                if '@' not in line:
                    summary_message = (
                        '%s --> Pattern on line %s doesn\'t have '
                        'codeowner' % (CODEOWNER_FILEPATH, line_num + 1))
                    summary_messages.append(summary_message)
                    failed = True
                else:
                    # Extract the file pattern from the line.
                    line_in_concern = line.split('@')[0].strip()
                    # This is being populated for the important rules
                    # check.
                    if critical_file_section_found:
                        important_rules_in_critical_section.append(
                            line_in_concern)
                    # Checks if the path is the full path relative to the
                    # root oppia directory.
                    if not line_in_concern.startswith('/'):
                        summary_message = (
                            '%s --> Pattern on line %s is invalid. Use '
                            'full path relative to the root directory'
                            % (CODEOWNER_FILEPATH, line_num + 1))
                        summary_messages.append(summary_message)
                        failed = True

                    # The double asterisks should be allowed only when path
                    # includes all the frontend spec files.
                    if not self._is_path_contains_frontend_specs(
                            line_in_concern):
                        # The double asterisks pattern is supported by the
                        # CODEOWNERS syntax but not the glob in Python 2.
                        # The following condition checks this.
                        if '**' in line_in_concern:
                            summary_message = (
                                '%s --> Pattern on line %s is invalid. '
                                '\'**\' wildcard not allowed' % (
                                    CODEOWNER_FILEPATH, line_num + 1))
                            summary_messages.append(summary_message)
                            failed = True
                    # Adjustments to the dir paths in CODEOWNERS syntax
                    # for glob-style patterns to match correctly.
                    if line_in_concern.endswith('/'):
                        line_in_concern = line_in_concern[:-1]
                    # The following condition checks whether the specified
                    # path exists in the codebase or not. The CODEOWNERS
                    # syntax has paths starting with '/' which refers to
                    # full path relative to root, but python glob module
                    # does not conform to this logic and literally matches
                    # the '/' character. Therefore the leading '/' has to
                    # be changed to './' for glob patterns to match
                    # correctly.
                    line_in_concern = line_in_concern.replace('/', './', 1)
                    # The checking for path existence won't happen if the path
                    # is getting all the frontend spec files.
                    if not self._is_path_contains_frontend_specs(
                            line_in_concern):
                        if not glob.glob(line_in_concern):
                            summary_message = (
                                '%s --> Pattern on line %s doesn\'t match '
                                'any file or directory' % (
                                    CODEOWNER_FILEPATH, line_num + 1))
                            summary_messages.append(summary_message)
                            failed = True
                    # The following list is being populated with the
                    # paths in the CODEOWNERS file with the removal of the
                    # leading '/' to aid in the glob pattern matching in
                    # the next part of the check wherein the valid patterns
                    # are used to check if they cover the entire codebase.
                    if os.path.isdir(line_in_concern):
                        dir_patterns.append(line_in_concern)
                    else:
                        file_patterns.append(line_in_concern)

        # Checks that every file (except those under the dir represented by
        # the dir_patterns) is covered under CODEOWNERS.
        for file_paths in self._walk_with_gitignore('.', dir_patterns):
            for file_path in file_paths:
                match = False
                for file_pattern in file_patterns:
                    if file_path in glob.glob(file_pattern):
                        match = True
                        break
                if not match:
                    summary_message = (
                        '%s is not listed in the .github/CODEOWNERS file.' % (
                            file_path))
                    summary_messages.append(summary_message)
                    failed = True

        codeowner_pattern_check_failed, summary_message = (
            self._check_for_important_patterns_at_bottom_of_codeowners(
                important_rules_in_critical_section))
        summary_messages.extend(summary_message)
        failed = failed or codeowner_pattern_check_failed

        return concurrent_task_utils.OutputStream(
            name, failed, summary_messages, summary_messages)


    def perform_all_lint_checks(self):
        """Perform all the lint checks and returns the messages returned by all
        the checks.

        Returns:
            list(OutputStream). A list of OutputStream objects to be used for
            linter status retrieval.
        """

        return [self.check_codeowner_file()]


def get_linters(file_cache):
    """Creates ThirdPartyCSSLintChecksManager and returns it.

    Args:
        file_cache: object(FileCache). Provides thread-safe access to cached
            file content.

    Returns:
        tuple(CodeOwnerLintChecksManager, None). A 2-tuple of custom and
        third_party linter objects.
    """
    custom_linter = CodeOwnerLintChecksManager(file_cache)

    return custom_linter, None
