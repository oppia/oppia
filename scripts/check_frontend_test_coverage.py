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

from __future__ import absolute_import
from __future__ import unicode_literals

import fnmatch
import logging
import os
import re
import sys

import python_utils

LCOV_FILE_PATH = os.path.join(os.pardir, 'karma_coverage_reports', 'lcov.info')
RELEVANT_LCOV_LINE_PREFIXES = ['SF', 'LH', 'LF']
EXCLUDED_DIRECTORIES = [
    'node_modules/*',
    'extensions/classifiers/proto/*'
]

# Contains the name of all files that is not 100% coverage.
# This list must be kept up-to-date; the changes (only remove) should be done
# manually.
# Please keep the list in alphabetical order.
# NOTE TO DEVELOPERS: do not add any new files to this list without asking
# @nithusha21 first.
NOT_FULLY_COVERED_FILENAMES = [
    'angular-html-bind.directive.ts',
    'answer-classification.service.ts',
    'App.ts',
    'audio-preloader.service.ts',
    'Base.ts',
    'change-list.service.ts',
    'ck-editor-4-rte.component.ts',
    'ck-editor-4-widgets.initializer.ts',
    'collection-editor-navbar-breadcrumb.directive.ts',
    'collection-editor-page.directive.ts',
    'collection-editor-tab.directive.ts',
    'collection-footer.component.ts',
    'collection-navbar.component.ts',
    'collection-node-creator.directive.ts',
    'collection-node-editor.component.ts',
    'collection-player-page.directive.ts',
    'collection.model.ts',
    'concept-card.directive.ts',
    'contribution-and-review.service.ts',
    'contributions-and-review.component.ts',
    'contributor-dashboard-admin-page.component.ts',
    'conversation-skin.directive.ts',
    'convert-to-plain-text.pipe.ts',
    'current-interaction.service.ts',
    'exploration-footer.component.ts',
    'exploration-states.service.ts',
    'expression-evaluator.service.ts',
    'expression-interpolation.service.ts',
    'fatigue-detection.service.ts',
    'feedback-popup.component.ts',
    'feedback-popup.directive.ts',
    'focus-on.directive.ts',
    'format-timer.pipe.ts',
    'generatedParser.ts',
    'google-analytics.initializer.ts',
    'graph-input-validation.service.ts',
    'hint-editor.directive.ts',
    'html-select.directive.ts',
    'input-response-pair.component.ts',
    'language-util.service.ts',
    'learner-answer-info-card.component.ts',
    'learner-answer-info.service.ts',
    'learner-view-rating.service.ts',
    'mathjax-bind.directive.ts',
    'normalize-whitespace-punctuation-and-case.pipe.ts',
    'object-editor.directive.ts',
    'oppia-footer.component.ts',
    'oppia-interactive-music-notes-input.directive.ts',
    'oppia-interactive-pencil-code-editor.directive.ts',
    'oppia-root.directive.ts',
    'parameterize-rule-description.filter.ts',
    'player-correctness-feedback-enabled.service.ts',
    'player-transcript.service.ts',
    'python-program.tokenizer.ts',
    'question-update.service.ts',
    'refresher-exploration-confirmation-modal.service.ts',
    'release-coordinator-page.component.ts',
    'remove-duplicates-in-array.pipe.ts',
    'response-header.directive.ts',
    'review-material-editor.directive.ts',
    'rule-type-selector.directive.ts',
    'schema-based-choices-editor.directive.ts',
    'schema-based-custom-viewer.directive.ts',
    'schema-based-dict-editor.directive.ts',
    'schema-based-dict-viewer.directive.ts',
    'schema-based-editor.directive.ts',
    'schema-based-expression-editor.directive.ts',
    'schema-based-float-editor.directive.ts',
    'schema-based-html-editor.directive.ts',
    'schema-based-html-viewer.directive.ts',
    'schema-based-int-editor.directive.ts',
    'schema-based-list-editor.directive.ts',
    'schema-based-list-viewer.directive.ts',
    'schema-based-primitive-viewer.directive.ts',
    'schema-based-unicode-editor.directive.ts',
    'schema-based-unicode-viewer.directive.ts',
    'schema-based-viewer.directive.ts',
    'score-ring.directive.ts',
    'select2-dropdown.directive.ts',
    'shared.ts',
    'skill-editor-navbar-breadcrumb.component.ts',
    'skill-editor-state.service.ts',
    'skill-prerequisite-skills-editor.directive.ts',
    'skill-questions-tab.directive.ts',
    'skill-rubrics-editor.directive.ts',
    'skills-mastery-list.directive.ts',
    'solution-editor.directive.ts',
    'solution-explanation-editor.directive.ts',
    'state-card.model.ts',
    'state-content-editor.directive.ts',
    'state-interaction-editor.directive.ts',
    'state-solution-editor.directive.ts',
    'story-creation.service.ts',
    'story-editor-navbar-breadcrumb.component.ts',
    'story-editor.directive.ts',
    'story-node-editor.directive.ts',
    'story-node.model.ts',
    'story-update.service.ts',
    'student.ts',
    'subtopic-summary-tile.component.ts',
    'subtopic.model.ts',
    'suggestion-modal-for-exploration-editor.service.ts',
    'teacher.ts',
    'teacher2.ts',
    'top-navigation-bar.component.ts',
    'topic-creation.service.ts',
    'topic-summary-tile.component.ts',
    'translation-file-hash-loader-backend-api.service.ts',
    'truncate-and-capitalize.filter.ts',
    'truncate-and-capitalize.pipe.ts',
    'truncate-input-based-on-interaction-answer-type.filter.ts',
    'truncate.filter.ts',
    'truncate.pipe.ts',
    'tutor-card.directive.ts',
    'unit-test-utils.ajs.ts', # Please don't try to cover this file.
    'voiceover-recording.service.ts',
    'worked-example-editor.directive.ts',
]


class LcovStanzaRelevantLines(python_utils.OBJECT):
    """Gets the relevant lines from a lcov stanza."""

    def __init__(self, stanza):
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


def get_stanzas_from_lcov_file():
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
    f = python_utils.open_file(LCOV_FILE_PATH, 'r')
    lcov_items_list = f.read().split('end_of_record')
    stanzas_list = []

    for item in lcov_items_list:
        if item.strip('\n'):
            stanza = LcovStanzaRelevantLines(item)
            stanzas_list.append(stanza)

    return stanzas_list


def check_not_fully_covered_filenames_list_is_sorted():
    """Check if NOT_FULLY_COVERED_FILENAMES list is in alphabetical order."""
    if NOT_FULLY_COVERED_FILENAMES != sorted(
            NOT_FULLY_COVERED_FILENAMES, key=lambda s: s.lower()):
        logging.error(
            'The \033[1mNOT_FULLY_COVERED_FILENAMES\033[0m list must be'
            ' kept in alphabetical order.')
        sys.exit(1)


def check_coverage_changes():
    """Checks if the denylist for not fully covered files needs to be changed
    by:
    - File renaming
    - File deletion

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
        file_name = stanza.file_name
        total_lines = stanza.total_lines
        covered_lines = stanza.covered_lines
        if any(fnmatch.fnmatch(
                stanza.file_path, pattern) for pattern in EXCLUDED_DIRECTORIES):
            continue
        if file_name not in remaining_denylisted_files:
            if total_lines != covered_lines:
                errors += (
                    '\033[1m{}\033[0m seems to be not completely tested.'
                    ' Make sure it\'s fully covered.\n'.format(file_name))
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
                    '-unit-tests-guide#rules\n'.format(file_name))

            remaining_denylisted_files.remove(file_name)

    if remaining_denylisted_files:
        for test_name in remaining_denylisted_files:
            errors += (
                '\033[1m{}\033[0m is in the frontend test coverage'
                ' denylist but it doesn\'t exist anymore. If you have'
                ' renamed it, please make sure to remove the old file'
                ' name and add the new file name in the denylist in'
                ' the file scripts/check_frontend_test_coverage.py.\n'
                .format(test_name))

    if errors:
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT('Frontend Coverage Checks Not Passed.')
        python_utils.PRINT('------------------------------------')
        logging.error(errors)
        sys.exit(1)
    else:
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT('All Frontend Coverage Checks Passed.')
        python_utils.PRINT('------------------------------------')

    check_not_fully_covered_filenames_list_is_sorted()


def main():
    """Runs all the steps for checking if there is any decrease of 100% covered
    files in the frontend.
    """
    check_coverage_changes()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_frontend_test_coverage.py
# is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
