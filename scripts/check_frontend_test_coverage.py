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

"""Check for decrease in coverage from 100% of frontend files."""

from __future__ import annotations

import argparse
import fnmatch
import logging
import os
import re
import sys

from core import utils

from typing import List, Optional

_PARSER = argparse.ArgumentParser(
    description="""
Checks the frontend test coverage.
""")

_PARSER.add_argument(
    '--files_to_check',
    help='optional; if specified, only the files in this list will be checked '
    'for coverage.',
    type=str
)

LCOV_FILE_PATH = os.path.join(os.pardir, 'karma_coverage_reports', 'lcov.info')
RELEVANT_LCOV_LINE_PREFIXES = ['SF', 'LH', 'LF']
EXCLUDED_DIRECTORIES = [
    'node_modules/*',
]

# Contains the name of all files that is not 100% coverage.
# This list must be kept up-to-date; the changes (only remove) should be done
# manually.
# Please keep the list in alphabetical order.
# NOTE TO DEVELOPERS: do not add any new files to this list without asking
# @nithusha21 first.
NOT_FULLY_COVERED_FILENAMES = [
    'core/templates/components/ck-editor-helpers/ck-editor-4-rte.component.ts',
    'core/templates/components/ck-editor-helpers/'
        'ck-editor-4-widgets.initializer.ts',
    'core/templates/components/forms/custom-forms-directives/'
        'object-editor.directive.ts',
    'core/templates/components/state-directives/rule-editor/'
        'rule-type-selector.directive.ts',
    'core/templates/domain/question/question-update.service.ts',
    'core/templates/domain/question/QuestionObjectFactory.ts',
    'core/templates/expressions/expression-interpolation.service.ts',
    'core/templates/google-analytics.initializer.ts',
    'core/templates/pages/exploration-editor-page/services/'
        'exploration-states.service.ts',
    'core/templates/pages/exploration-editor-page/translation-tab/'
        'services/voiceover-recording.service.ts',
    'core/templates/pages/exploration-player-page/services/'
        'learner-answer-info.service.ts',
    'core/templates/services/rte-helper-modal.component.ts',
    # TODO(#18390): Completely cover "rte-helper-modal.component.ts".
    'core/templates/tests/unit-test-utils.ajs.ts',
    # Please don't try to cover unit-test-utils.ajs.ts file.
    'extensions/interactions/MusicNotesInput/directives/'
        'oppia-interactive-music-notes-input.component.ts',
    'extensions/interactions/PencilCodeEditor/directives/'
        'oppia-interactive-pencil-code-editor.component.ts'
]


class LcovStanzaRelevantLines:
    """Gets the relevant lines from a lcov stanza."""

    def __init__(self, stanza: str) -> None:
        """Initialize the object which provides relevant data of a lcov
        stanza in order to calculate any decrease in frontend test coverage.

        Args:
            stanza: list(str). Contains all the lines from a lcov stanza.

        Raises:
            Exception. The file_path is empty.
            Exception. Total lines number is not found.
            Exception. Covered lines number is not found.
        """

        match = re.search('SF:(.+)\n', stanza)
        if match is None:
            raise Exception(
                'The test path is empty or null. '
                'It\'s not possible to diff the test coverage correctly.')
        _, file_name = os.path.split(match.group(1))
        self.file_name = file_name
        self.file_path = match.group(1)

        match = re.search(r'LF:(\d+)\n', stanza)
        if match is None:
            raise Exception(
                'It wasn\'t possible to get the total lines of {} file.'
                'It\'s not possible to diff the test coverage correctly.'
                .format(file_name))
        self.total_lines = int(match.group(1))

        match = re.search(r'LH:(\d+)\n', stanza)
        if match is None:
            raise Exception(
                'It wasn\'t possible to get the covered lines of {} file.'
                'It\'s not possible to diff the test coverage correctly.'
                .format(file_name))
        self.covered_lines = int(match.group(1))


def get_stanzas_from_lcov_file() -> List[LcovStanzaRelevantLines]:
    """Get all stanzas from a lcov file. The lcov file gather all the frontend
    files that has tests and each one has the following structure:
    TN: test name
    SF: file path
    FNF: total functions
    FNH: functions covered
    LF: total lines
    LH: lines covered
    BRF: total branches
    BRH: branches covered
    end_of_record

    Returns:
        list(LcovStanzaRelevantLines). A list with all stanzas.
    """
    f = utils.open_file(LCOV_FILE_PATH, 'r')
    lcov_items_list = f.read().split('end_of_record')
    stanzas_list = []

    for item in lcov_items_list:
        if item.strip('\n'):
            stanza = LcovStanzaRelevantLines(item)
            stanzas_list.append(stanza)

    return stanzas_list


def check_not_fully_covered_filenames_list_is_sorted() -> None:
    """Check if NOT_FULLY_COVERED_FILENAMES list is in alphabetical order."""
    if NOT_FULLY_COVERED_FILENAMES != sorted(
            NOT_FULLY_COVERED_FILENAMES, key=lambda s: s.lower()):
        logging.error(
            'The \033[1mNOT_FULLY_COVERED_FILENAMES\033[0m list must be'
            ' kept in alphabetical order.')
        sys.exit(1)


def check_if_file_should_be_checked(
    file_path: str,
    files_to_check: Optional[List[str]] = None
) -> bool:
    """Checks if a specific file should be checked based on the list of files
    that should be checked for coverage changes.

    Args:
        file_path: str. The path of the file to check.
        files_to_check: list(str)|None. The list of files to check for
            coverage changes. If there is no files to check list provided,
            then this function will return True, forcing all files to be
            checked.

    Returns:
        bool. Whether the file should be checked for coverage changes.
    """
    if files_to_check is None:
        return True

    if file_path in files_to_check:
        return True

    return False


def check_coverage_changes(
    files_to_check: Optional[List[str]] = None
) -> None:
    """Checks if the denylist for not fully covered files needs to be changed
    by:
    - File renaming
    - File deletion

    Args:
        files_to_check: list(str)|None. The list of files to check for
            coverage changes. If there is no files to check list provided,
            then this function will check all files.

    Raises:
        Exception. LCOV_FILE_PATH doesn't exist.
    """
    if not os.path.exists(LCOV_FILE_PATH):
        raise Exception(
            'Expected lcov file to be available at {}, but the'
            ' file does not exist.'.format(LCOV_FILE_PATH))

    stanzas = get_stanzas_from_lcov_file()
    remaining_denylisted_files = list(NOT_FULLY_COVERED_FILENAMES)
    errors = ''

    for stanza in stanzas:
        file_path = stanza.file_path
        if not check_if_file_should_be_checked(file_path, files_to_check):
            continue
        total_lines = stanza.total_lines
        covered_lines = stanza.covered_lines
        if any(fnmatch.fnmatch(
                stanza.file_path, pattern) for pattern in EXCLUDED_DIRECTORIES):
            continue
        if file_path not in remaining_denylisted_files:
            if total_lines != covered_lines:
                errors += (
                    '\033[1m{}\033[0m seems to be not completely tested.'
                    ' Make sure it\'s fully covered.\n'.format(file_path))
        else:
            if total_lines == covered_lines:
                errors += (
                    '\033[1m{}\033[0m seems to be fully covered!'
                    ' Before removing it manually from the denylist'
                    ' in the file'
                    ' scripts/check_frontend_test_coverage.py, please'
                    ' make sure you\'ve followed the unit tests rules'
                    ' correctly on:'
                    ' https://github.com/oppia/oppia/wiki/Frontend'
                    '-unit-tests-guide#rules\n'.format(file_path))

            remaining_denylisted_files.remove(file_path)

    if remaining_denylisted_files:
        for test_path in remaining_denylisted_files:
            if not check_if_file_should_be_checked(test_path, files_to_check):
                continue
            errors += (
                '\033[1m{}\033[0m is in the frontend test coverage'
                ' denylist but it doesn\'t exist anymore. If you have'
                ' renamed it, please make sure to remove the old file'
                ' path and add the new file path in the denylist in'
                ' the file scripts/check_frontend_test_coverage.py.\n'
                .format(test_path))

    if errors:
        print('------------------------------------')
        print('Frontend Coverage Checks Not Passed.')
        print('------------------------------------')
        logging.error(errors)
        sys.exit(1)
    else:
        print('------------------------------------')
        print('All Frontend Coverage Checks Passed.')
        print('------------------------------------')

    check_not_fully_covered_filenames_list_is_sorted()


def main(args: Optional[List[str]] = None) -> None:
    """Runs all the steps for checking if there is any decrease of 100% covered
    files in the frontend.
    """
    parsed_args = _PARSER.parse_args(args=args)
    files_to_check = None
    if parsed_args.files_to_check:
        files_to_check = [
            file_path.strip() for file_path in
                parsed_args.files_to_check.split(',')
        ]
    check_coverage_changes(files_to_check)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_frontend_test_coverage.py
# is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
