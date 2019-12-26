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

"""Check for decrease in coverage from 100% of frontend files."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import subprocess
import sys

import python_utils

LCOV_FILE_PATH = os.path.join(os.pardir, 'karma_coverage_reports', 'lcov.info')
RELEVANT_LCOV_LINE_PREFIXES = ['SF', 'LH', 'LF']

# Contains the name of all files that reached up to 100% of coverage.
# This list must be kept up-to-date; the changes should be done manually.
# Please keep the list in alphabetical order.
# NOTE TO REVIEWERS: Please be circumspect about any PRs which delete elements
# from this list.
fully_covered_filenames = [
    'AnswerDetailsImprovementTaskObjectFactory.ts',
    'CodeRepl.ts',
    'Continue.ts',
    'DragAndDropSortInput.ts',
    'EndExploration.ts',
    'FractionInput.ts',
    'GraphInput.ts',
    'ImageClickInput.ts',
    'InteractiveMap.ts',
    'ItemSelectionInput.ts',
    'LogicProof.ts',
    'MathExpressionInput.ts',
    'MultipleChoiceInput.ts',
    'MusicNotesInput.ts',
    'NumberWithUnits.ts',
    'NumericInput.ts',
    'PencilCodeEditor.ts',
    'ReadOnlyStoryNodeObjectFactory.ts',
    'SetInput.ts',
    'StopwatchObjectFactory.ts',
    'StoryPlaythroughObjectFactory.ts',
    'StorySummaryObjectFactory.ts',
    'TextInput.ts',
    'TopicSummaryObjectFactory.ts',
    'admin-data.service.ts',
    'admin-page.constants.ajs.ts',
    'admin-page.constants.ts',
    'app.constants.ajs.ts',
    'app.constants.ts',
    'apply-validation.directive.ts',
    'base-undo-redo.service.ts',
    'camel-case-to-hyphens.filter.ts',
    'capitalize.filter.ts',
    'classifiers-extension.constants.ajs.ts',
    'classifiers-extension.constants.ts',
    'classroom-domain.constants.ajs.ts',
    'classroom-domain.constants.ts',
    'code-repl-rules.service.ts',
    'codemirrorRequires.ts',
    'collection-domain.constants.ajs.ts',
    'collection-domain.constants.ts',
    'collection-editor-page.constants.ajs.ts',
    'collection-editor-page.constants.ts',
    'collection-linearizer.service.ts',
    'collection-summary-tile.constants.ajs.ts',
    'collection-summary-tile.constants.ts',
    'community-dashboard-page.constants.ajs.ts',
    'community-dashboard-page.constants.ts',
    'constants.ts',
    'convert-html-to-unicode.filter.ts',
    'convert-unicode-to-html.filter.ts',
    'convert-unicode-with-params-to-html.filter.ts',
    'creator-dashboard-page.constants.ajs.ts',
    'creator-dashboard-page.constants.ts',
    'data.ts',
    'debug-info-tracker.service.ts',
    'editor-domain.constants.ajs.ts',
    'editor-domain.constants.ts',
    'exploration-editor-page.constants.ajs.ts',
    'exploration-editor-page.constants.ts',
    'exploration-init-state-name.service.ts',
    'exploration-param-changes.service.ts',
    'exploration-player-page.constants.ajs.ts',
    'exploration-player-page.constants.ts',
    'exploration-title.service.ts',
    'extract-image-filenames-from-state.service.ts',
    'focus-manager.service.ts',
    'format-rte-preview.filter.ts',
    'generatedDefaultData.ts',
    'get-abbreviated-text.filter.ts',
    'improvement-task.service.ts',
    'interaction-specs.constants.ajs.ts',
    'interaction-specs.constants.ts',
    'interactions-extension.constants.ajs.ts',
    'interactions-extension.constants.ts',
    'interactionsQuestionsRequires.ts',
    'interactionsRequires.ts',
    'is-at-least.filter.ts',
    'is-at-most.filter.ts',
    'is-float.filter.ts',
    'is-integer.filter.ts',
    'is-nonempty.filter.ts',
    'learner-dashboard-page.constants.ajs.ts',
    'learner-dashboard-page.constants.ts',
    'library-page.constants.ajs.ts',
    'library-page.constants.ts',
    'mathjaxConfig.ts',
    'normalize-whitespace.filter.ts',
    'objectComponentsRequires.ts',
    'objectComponentsRequiresForPlayers.ts',
    'objects-domain.constants.ajs.ts',
    'objects-domain.constants.ts',
    'practice-session-page.constants.ajs.ts',
    'practice-session-page.constants.ts',
    'question-domain.constants.ajs.ts',
    'question-domain.constants.ts',
    'question-player-state.service.ts',
    'question-player.constants.ajs.ts',
    'question-player.constants.ts',
    'question-undo-redo.service.ts',
    'questions-list.constants.ajs.ts',
    'questions-list.constants.ts',
    'read-only-exploration-backend-api.service.ts',
    'replace-inputs-with-ellipses.filter.ts',
    'require-is-float.directive.ts',
    'review-test-backend-api.service.ts',
    'review-test-domain.constants.ajs.ts',
    'review-test-domain.constants.ts',
    'review-test-page.constants.ajs.ts',
    'review-test-page.constants.ts',
    'richTextComponentsRequires.ts',
    'rich_text_components_definitions.ts',
    'search-explorations-backend-api.service.ts',
    'services.constants.ajs.ts',
    'services.constants.ts',
    'skill-domain.constants.ajs.ts',
    'skill-domain.constants.ts',
    'skill-editor-page.constants.ajs.ts',
    'skill-editor-page.constants.ts',
    'skill-mastery-backend-api.service.ts',
    'skills-mastery-list.constants.ajs.ts',
    'skills-mastery-list.constants.ts',
    'state-content.service.ts',
    'state-editor.constants.ajs.ts',
    'state-editor.constants.ts',
    'state-interaction-id.service.ts',
    'state-recorded-voiceovers.service.ts',
    'state-rules-stats.service.ts',
    'state-solicit-answer-details.service.ts',
    'state-solution.service.ts',
    'state-top-answers-stats-backend-api.service.ts',
    'state-written-translations.service.ts',
    'statistics-domain.constants.ajs.ts',
    'statistics-domain.constants.ts',
    'story-domain.constants.ajs.ts',
    'story-domain.constants.ts',
    'story-editor-page.constants.ajs.ts',
    'story-editor-page.constants.ts',
    'story-viewer-domain.constants.ajs.ts',
    'story-viewer-domain.constants.ts',
    'subtopic-viewer-backend-api.service.ts',
    'subtopic-viewer-domain.constants.ajs.ts',
    'subtopic-viewer-domain.constants.ts',
    'summarize-nonnegative-number.filter.ts',
    'topic-domain.constants.ajs.ts',
    'topic-domain.constants.ts',
    'topic-editor-page.constants.ajs.ts',
    'topic-editor-page.constants.ts',
    'topic-landing-page.constants.ajs.ts',
    'topic-landing-page.constants.ts',
    'topic-viewer-domain.constants.ajs.ts',
    'topic-viewer-domain.constants.ts',
    'topics-and-skills-dashboard-domain.constants.ajs.ts',
    'topics-and-skills-dashboard-domain.constants.ts',
    'topics-and-skills-dashboard-page.constants.ajs.ts',
    'topics-and-skills-dashboard-page.constants.ts',
    'translation-status.service.ts',
    'translation-tab-active-content-id.service.ts',
    'translation-tab-active-mode.service.ts',
    'truncate-at-first-ellipsis.filter.ts',
    'truncate-at-first-line.filter.ts',
    'uiLeafletRequires.ts',
    'underscores-to-camel-case.filter.ts',
    'undo-redo.service.ts',
    'user-exploration-permissions.service.ts',
    'valueGeneratorsRequires.ts',
    'wrap-text-with-ellipsis.filter.ts',
]

class LcovStanzaRelevantLines:

    def __init__(self, relevant_lines):
        """Inicializate the object which provides relevant data of a lcov
        stanza in order to calculate any decrease in frontend test coverage.

        Args:
            relevant_lines: list(str). Contains the relevant lines:
            - relevant_lines[0]: absolute path of the file.
            - relevant_lines[1]: total lines of the file.
            - relevant_lines[2]: covered lines of the file.

        Raises:
            Exception: relevant_lines[0] is empty.
            Exception: Total lines number is not found.
            Exception: Covered lines number is not found.
        """
        if not relevant_lines[0]:
            raise Exception(
                'The test path is empty or null. '
                'It\'s not possible to diff the test coverage correctly.')

        _, file_name = os.path.split(relevant_lines[0])
        self.file_name = file_name

        match = re.search('LF:(\d+)', relevant_lines[1])
        if match is None:
            raise Exception(
                'It wasn\'t possible to get the total lines of {} file.'
                'It\'s not possible to diff the test coverage correctly.'
                .format(file_name))
        self.total_lines = int(match.group(1))

        match = re.search('LH:(\d+)', relevant_lines[2])
        if match is None:
            raise Exception(
                'It wasn\'t possible to get the covered lines of {} file.'
                'It\'s not possible to diff the test coverage correctly.'
                .format(file_name))
        self.covered_lines = int(match.group(1))

    def get_file_name(self):
        return self.file_name

    def get_total_lines(self):
        return self.total_lines

    def get_covered_lines(self):
        return self.covered_lines


def run_frontend_tests_script():
    """Run the frontend tests script using subprocess. If any test fails then
    the coverage check won't happen.
    """
    try:
        subprocess.check_call([
            'python', '-m', 'scripts.run_frontend_tests'])
    except subprocess.CalledProcessError:
        sys.exit(1)


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
        relevant_lines = [line for line in item.splitlines() if
                          any(line.startswith(prefix) for prefix in
                          RELEVANT_LCOV_LINE_PREFIXES)]

        if len(relevant_lines) > 0:
            stanza = LcovStanzaRelevantLines(relevant_lines)
            stanzas_list.append(stanza)

    return stanzas_list


def check_fully_covered_filenames_list_is_sorted():
    """Check if fully_covered_filenames list is in alphabetic order."""
    if fully_covered_filenames != sorted(fully_covered_filenames):
        python_utils.PRINT(
            'The \033[1mfully_covered_filenames\033[0m list must be kept'
            ' in alphabetic order.')
        sys.exit(1)


def check_coverage_changes():
    """Checks if the whitelist for fully covered files needs to be changed by:
    - New file insertion
    - File renaming
    - File deletion

    Raises:
        Exception: LCOV_FILE_PATH doesn't exist.
    """
    if not os.path.exists(LCOV_FILE_PATH):
        raise Exception('File at path {} doesn\'t exist'.format(
            LCOV_FILE_PATH))

    stanzas = get_stanzas_from_lcov_file()
    whitelist = list(fully_covered_filenames)
    errors = ''

    for stanza in stanzas:
        file_name = stanza.get_file_name()
        total_lines = stanza.get_total_lines()
        covered_lines = stanza.get_covered_lines()

        if file_name in whitelist:
            if total_lines != covered_lines:
                errors += ('\033[1m{}\033[0m file is in the whitelist but its'
                ' coverage decreased. Make sure it is fully covered'
                ' by Karma unit tests.\n'.format(file_name))

            whitelist.remove(file_name)
        else:
            if total_lines == covered_lines:
                errors += ('\033[1m{}\033[0m file is fully covered but it\'s'
                ' supposed to have 100% coverage. Please add the file name in'
                ' the whitelist in the file'
                ' scripts/check_frontend_test_coverage.py.\n'
                .format(file_name))

    if len(whitelist) > 0:
        for test_name in whitelist:
            errors += ('\033[1m{}\033[0m is in the frontend test coverage'
            ' whitelist but it doesn\'t exist anymore. If you have renamed it,'
            ' please make sure to remove the old file name and add the new file' 
            ' name in the whitelist in the file'
            ' scripts/check_frontend_test_coverage.py.\n'
            .format(test_name))

    if errors:
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT('Frontend Coverage Checks Not Passed.')
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT(errors)
        sys.exit(1)
    else:
        python_utils.PRINT('------------------------------------')
        python_utils.PRINT('All Frontend Coverage Checks Passed.')
        python_utils.PRINT('------------------------------------')

    check_fully_covered_filenames_list_is_sorted()


def main():
    """Runs all the steps for checking if there is any decrease of 100% covered
    files in the frontend.
    """
    run_frontend_tests_script()

    check_coverage_changes()


if __name__ == '__main__':
    main()
