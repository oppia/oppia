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
import shutil
import subprocess
import sys

import python_utils

LCOV_FILE_PATH = os.path.join(os.pardir, 'karma_coverage_reports', 'lcov.info')
PR_LCOV_FILE_PATH = os.path.join(os.curdir, 'tmp', 'pr-lcov.info')
fully_covered_tests = [
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

def run_frontend_tests_script():
    """Run the frontend tests script using subprocess. If any test fail then
    the coverage check won't happen.
    """

    try:
        subprocess.check_call([
            'python', '-m', 'scripts.run_frontend_tests'])
    except subprocess.CalledProcessError:
        sys.exit(1)


def create_tmp_folder():
    """Creates a temporary folder."""
    if not os.path.exists('./tmp'):
        os.mkdir('./tmp')


def delete_tmp_folder():
    """Delete the temporary folder."""
    if os.path.exists('./tmp'):
        shutil.rmtree('./tmp')


def filter_lines(line):
    """Check if the line has file path (SF) or total lines (LF) or covered
    lines (LH) of the test.

    Args:
        line: str. A line from lcov file.

    Returns:
        Boolean. If the line has the file path or total lines or covered lines
        of the test.
    """
    return (line.startswith('SF') or line.startswith('LH')
        or line.startswith('LF'))


def get_test_file_name(test_path):
    """Get the file name from the absolute path.

    Args:
        test_path: str. The file's absolute path.

    Returns:
        Str. It returns the file name of the test path.
    """
    if not test_path:
        sys.stderr.write(
            'The test path is empty or null.'
            'It\'s not possible to diff the test coverage correctly.')
        sys.exit(1)

    _, file_name = os.path.split(test_path)
    return file_name


def get_stanzas_from_lcov_file(file_path):
    """Get all stanzas from a lcov file. Each stanza has the following
    structure:
    TN: test name
    SF: file path
    FNF: total functions
    FNH: functions covered
    LF: total lines
    LH: lines covered
    BRF: total branches
    BRH: branches covered
    end_of_record

    This function filters each stanza to return only:
    - File path (SF)
    - File total lines (LF)
    - File covered lines (LH)

    Args:
        file_path: str. The path of lcov file.

    Returns:
        list(str). A list with all stanzas filtered.
    """
    f = python_utils.open_file(file_path, 'r')
    stanzas_array = f.read().split('end_of_record')
    stanzas_array_filtered = []

    for stanza in stanzas_array:
        lines = [line for line in stanza.splitlines() if filter_lines(line)]
        if len(lines) > 0:
            stanzas_array_filtered.append(lines)

    return stanzas_array_filtered


def get_coverage_dict():
    """Build a dict with all covered files from the current branch.

    Returns:
        Dictionary. A dict containing file path, total lines and covered lines
        of each tested file.

    Raises:
        Exception: If DEV_LCOV_FILE_PATH doesn't exist.
    """
    coverage_dict = {}

    if not os.path.exists(PR_LCOV_FILE_PATH):
        raise Exception(
            'File at path {} doesn\'t exist'.format(PR_LCOV_FILE_PATH))

    stanzas = get_stanzas_from_lcov_file(PR_LCOV_FILE_PATH)
    for stanza in stanzas:
        total_lines = re.match('(\d+)', stanza[1].split(':')[1]).group(1)
        covered_lines = re.match('(\d+)', stanza[2].split(':')[1]).group(1)

        test_name = get_test_file_name(stanza[0])
        coverage_dict[test_name] = [
            int(total_lines),
            int(covered_lines)
        ]

    return coverage_dict        


def remove_item_from_whitelist(test_name):
    """Remove an item from whitelist list.
    
    Args:
      test_name: str. The test to be removed from whitelist.
    """
    index = fully_covered_tests.index(test_name)
    fully_covered_tests.pop(index)


def check_coverage_changes():
    """Checks if the whitelist for fully covered files needs to be changed by:
    - New file insertion
    - File renaming
    - File deletion

    Raises:
        Exception: If PR_LCOV_FILE_PATH doesn't exist.
    """
    if not os.path.exists(PR_LCOV_FILE_PATH):
        raise Exception('File at path {} doesn\'t exist'.format(
            PR_LCOV_FILE_PATH))

    covered_tests = get_coverage_dict()
    errors = ''

    for test_name in covered_tests:
        total_lines = covered_tests[test_name][0]
        covered_lines = covered_tests[test_name][1]

        if test_name in fully_covered_tests:
            if total_lines != covered_lines:
                errors += ('\033[1m{}\033[0m file is in the whitelist but its'
                ' coverage decreased. Make sure it is fully covered'
                ' again.\n'.format(test_name))

            remove_item_from_whitelist(test_name)
        else:
            if total_lines == covered_lines:
                errors += ('\033[1m{}\033[0m file is fully covered and it\'s'
                ' not included in the whitelist. Please add the file name in'
                ' the whilelist in file scripts/check_frontend_test_coverage.py.\n'
                .format(test_name))

    if len(fully_covered_tests) > 0:
        for test_name in fully_covered_tests:
            errors += ('\033[1m{}\033[0m is in the whitelist but it doesn\'t'
            ' exist anymore. If you have renamed it, please make sure to'
            ' remove the old file name and add the new file name in the'
            ' whitelist in file scripts/check_frontend_test_coverage.py.\n'
            .format(test_name))

    delete_tmp_folder()

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


def main():
    """Runs all the steps for checking if there is any decrease of 100% covered
    files in the frontend.
    """

    run_frontend_tests_script()

    create_tmp_folder()

    shutil.copyfile(
        LCOV_FILE_PATH,
        PR_LCOV_FILE_PATH)

    check_coverage_changes()


if __name__ == '__main__':
    main()
