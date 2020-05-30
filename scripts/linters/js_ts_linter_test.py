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

"""Unit tests for scripts/linters/js_ts_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing
import os
import sys

from core.tests import test_utils
import python_utils

from . import js_ts_linter
from . import pre_commit_linter
from .. import common

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, os.pardir, 'oppia_tools')

ESPRIMA_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'esprima-%s' % common.ESPRIMA_VERSION)

sys.path.insert(1, ESPRIMA_PATH)

# pylint: disable=wrong-import-order
# pylint: disable=wrong-import-position
import esprima  # isort:skip
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'linter_tests')
VALID_JS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')
INVALID_ANY_TYPE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_any_type.ts')
EXTRA_JS_FILEPATH = os.path.join('core', 'templates', 'demo.js')
INVALID_COMPONENT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_component.ts')
INVALID_SCOPE_TRUE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_scope_true.ts')
INVALID_SCOPE_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_scope.ts')
INVALID_SORTED_DEPENDENCIES_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_sorted_dependencies.ts')
INVALID_LINE_BREAK_IN_CONTROLLER_DEPENDENCIES_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_line_breaks_in_controller_dependencies.ts')
INVALID_CONSTANT_IN_TS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_constant_in_ts_file.ts')
INVALID_CONSTANT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid.constants.ts')
INVALID_CONSTANT_2_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_constant.constants.ts')


def appears_in_linter_stdout(phrases, linter_stdout):
    """Checks to see if all of the phrases appear in at least one of the
    linter_stdout outputs.

    Args:
        phrases: list(str). A list of phrases we are trying to find in
        one of the linter_stdout outputs. For example, python linting
        outputs a success string that includes data we don't have easy
        access to, like how long the test took, so we may want to search
        for a substring of that success string in linter_stdout.

        linter_stdout: list(str). A list of the output results from the
        linter's execution. Note that anything placed into the "result"
        queue in pre_commit_linter will be in the same index.

    Returns:
        bool. True if and only if all of the phrases appear in at least
        one of the results stored in linter_stdout.
    """
    for output in linter_stdout:
        if all(phrase in output for phrase in phrases):
            return True
    return False


class JsTsLintTests(test_utils.GenericTestBase):
    """Tests for js_ts_linter file."""

    def setUp(self):
        super(JsTsLintTests, self).setUp()
        self.linter_stdout = []
        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: Variable length argument list of values to print in
                the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_validate_and_parse_js_and_ts_files_with_exception(self):
        def mock_parse_script(unused_file_content):
            raise Exception()
        esprima_swap = self.swap(esprima, 'parseScript', mock_parse_script)
        with self.print_swap, esprima_swap, self.assertRaises(Exception):
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_ANY_TYPE_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()

    def test_check_any_type(self):
        excluded_files_swap = self.swap(
            js_ts_linter, 'FILES_EXCLUDED_FROM_ANY_TYPE_CHECK',
            [VALID_TS_FILEPATH])
        with self.print_swap, excluded_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_ANY_TYPE_FILEPATH, VALID_TS_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['\'any\' type found at line 20. Please do not declare variable'
                 ' as \'any\' type'],
                self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['\'any\' type found at line 22. Please do not declare variable'
                 ' as \'any\' type'],
                self.linter_stdout))

    def test_check_extra_js_files(self):
        def mock_get_data(unused_self, unused_filepath, unused_mode):
            return 'Hello World'
        get_data_swap = self.swap(
            pre_commit_linter.FileCache, '_get_data', mock_get_data)
        with self.print_swap, get_data_swap:
            js_ts_linter.JsTsLintChecksManager(
                [EXTRA_JS_FILEPATH], [], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Found extra .js file'],
                self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['If you want the above files to be present as js files, add '
                 'them to the list JS_FILEPATHS_NOT_TO_BUILD in build.py. '
                 'Otherwise, rename them to .ts'],
                self.linter_stdout))

    def test_check_js_and_ts_component_name_and_count(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_COMPONENT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that there is exactly one component '
                 'in the file.'],
                self.linter_stdout))

    def test_check_directive_scope(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SCOPE_TRUE_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that baseContent directive in ',
                 ' file does not have scope set to true.'],
                self.linter_stdout))

    def test_check_directive_scope_with_no_scope(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SCOPE_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that baseContent directive in ',
                 ' file has a scope: {}.'],
                self.linter_stdout))

    def test_check_sorted_dependencies(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SORTED_DEPENDENCIES_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that in SuggestionModalForCreatorViewController'
                 ' in file', 'the injected dependencies should be in the '
                 'following manner: dollar imports, regular imports and '
                 'constant imports, all in sorted order.'],
                self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that in SuggestionModalForCreatorViewController'
                 ' in file ', 'the stringfied dependencies should be in the '
                 'following manner: dollar imports, regular imports and '
                 'constant imports, all in sorted order.'],
                self.linter_stdout))

    def test_match_line_breaks_in_controller_dependencies(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_LINE_BREAK_IN_CONTROLLER_DEPENDENCIES_FILEPATH],
                FILE_CACHE, True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that in file',
                 'the line breaks pattern between the dependencies mentioned as'
                 ' strings:\n[$rootScope,$window,BackgroundMaskService,\n'
                 'SidebarStatusService,UrlService]\nand the dependencies '
                 'mentioned as function parameters: \n($rootScope,$window,\n'
                 'BackgroundMaskService,\nSidebarStatusService,UrlService)\n'
                 'for the corresponding controller should exactly match.'],
                self.linter_stdout))

    def test_check_constants_declaration(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Duplicate constant declaration found.'],
                self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['Please ensure that the constant ADMIN_TABS is initialized '
                 'from the value from the corresponding Angular constants file '
                 '(the *.constants.ts file). Please create one in the Angular '
                 'constants file if it does not exist there.'],
                self.linter_stdout))

    def test_check_constants_declaration_in_non_constant_file(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_IN_TS_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['Constant declaration found at line 19. Please declare the '
                 'constants in a separate constants file.'],
                self.linter_stdout))

    def test_third_party_linter(self):
        with self.print_swap:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_SORTED_DEPENDENCIES_FILEPATH],
                True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['You have an error in your DI configuration. Each items of '
                 'the array should match exactly one function parameter'],
                self.linter_stdout))

    def test_third_party_linter_with_stderr(self):
        with self.print_swap, self.assertRaises(SystemExit) as e:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                INVALID_SORTED_DEPENDENCIES_FILEPATH,
                True).perform_all_lint_checks()
        self.assertEqual(e.exception.code, 1)

    def test_third_party_linter_with_invalid_eslint_path(self):
        def mock_exists(unused_path):
            return False
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with self.print_swap, exists_swap, self.assertRaises(SystemExit) as e:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_SORTED_DEPENDENCIES_FILEPATH],
                True).perform_all_lint_checks()
        self.assertEqual(e.exception.code, 1)

    def test_third_party_linter_with_success_message(self):
        with self.print_swap:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [VALID_TS_FILEPATH], True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['SUCCESS   1 JavaScript and Typescript files linted'],
                self.linter_stdout))

    def test_perform_all_lint_checks_with_no_files(self):
        with self.print_swap:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [], True).perform_all_lint_checks()
        self.assertTrue(
            appears_in_linter_stdout(
                ['There are no JavaScript or Typescript files to lint.'],
                self.linter_stdout))

    def test_get_linters(self):
        custom_linter, third_party = js_ts_linter.get_linters(
            [VALID_JS_FILEPATH], [VALID_TS_FILEPATH], FILE_CACHE,
            verbose_mode_enabled=True)
        self.assertTrue(
            isinstance(custom_linter, js_ts_linter.JsTsLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party,
                js_ts_linter.ThirdPartyJsTsLintChecksManager))
