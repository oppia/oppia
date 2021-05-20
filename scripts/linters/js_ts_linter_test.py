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
import re
import shutil
import subprocess
import sys

from core.tests import test_utils

from . import js_ts_linter
from . import pre_commit_linter
from .. import common

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, os.pardir, 'oppia_tools')

ESPRIMA_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'esprima-%s' % common.ESPRIMA_VERSION)

sys.path.insert(1, ESPRIMA_PATH)

import esprima  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_JS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')
VALID_APP_CONSTANTS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_app.constants.ts')
VALID_APP_CONSTANTS_AJS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_app.constants.ajs.ts')
VALID_CONSTANT_OUTSIDE_CLASS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_constant_outside_class.constants.ts')
VALID_CONSTANT_OUTSIDE_CLASS_AJS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_constant_outside_class.constants.ajs.ts')
VALID_BACKEND_API_SERVICE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid-backend-api.service.ts')
INVALID_COMPONENT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_two_component.ts')
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
    LINTER_TESTS_DIR, 'invalid_duplicate.constants.ts')
INVALID_CONSTANT_AJS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_duplicate.constants.ajs.ts')
INVALID_AS_CONST_CONSTANTS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_as_const.constants.ts')
INVALID_FORMATTED_COMMENT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_comments.ts')
INVALID_DIRECTIVE_WITH_NO_RETURN_BLOCK = os.path.join(
    LINTER_TESTS_DIR, 'invalid_directive_without_return.ts')
INVALID_TS_IGNORE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_ts_ignore.ts')
VALID_TS_IGNORE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_ts_ignore.ts')
INVALID_TS_EXPECT_ERROR_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_ts_expect_error.ts')
VALID_TS_EXPECT_ERROR_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_ts_expect_error.spec.ts')
VALID_IGNORED_SERVICE_PATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_ignored.service.ts')
VALID_UNLISTED_SERVICE_PATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_unlisted.service.ts')

# Note: Almost all test functions have a subprocess call. This call is to mock
# the compile function used in js_ts_linter. The tests require fewer files to
# be compiled instead of all files as done in js_ts_linter. Mocking the
# compile method reduces the compile time as fewer files are compiled
# thereby making the tests run faster.


class JsTsLintTests(test_utils.LinterTestBase):
    """Tests for js_ts_linter file."""

    def validate(self, lint_task_report, expected_messages, failed_count):
        """Assert linter output messages with expected messages."""
        for stdout in lint_task_report:
            if stdout.failed:
                for message in expected_messages:
                    self.assert_same_list_elements(
                        [message], stdout.trimmed_messages)
                self.assert_failed_messages_count(
                    stdout.get_report(), failed_count)
            else:
                continue

    def test_validate_and_parse_js_and_ts_files_with_exception(self):
        def mock_parse_script(unused_file_content, comment):  # pylint: disable=unused-argument
            raise Exception('Exception raised from parse_script()')

        esprima_swap = self.swap(esprima, 'parseScript', mock_parse_script)

        with esprima_swap, self.assertRaisesRegexp(
            Exception, re.escape('Exception raised from parse_script()')
        ):
            js_ts_linter.JsTsLintChecksManager(
                [], [VALID_JS_FILEPATH], FILE_CACHE).perform_all_lint_checks()

    def test_check_js_and_ts_component_name_and_count_with_two_component(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_COMPONENT_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_COMPONENT_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Please ensure that there is exactly one component '
            'in the file.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_directive_scope_with_true_value(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_SCOPE_TRUE_FILEPATH,
                    INVALID_DIRECTIVE_WITH_NO_RETURN_BLOCK)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [],
                [INVALID_SCOPE_TRUE_FILEPATH,
                 INVALID_DIRECTIVE_WITH_NO_RETURN_BLOCK], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Please ensure that baseContent directive in ',
            ' file does not have scope set to true.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_directive_scope_with_no_scope(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_SCOPE_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SCOPE_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Please ensure that baseContent directive in ',
            ' file has a scope: {}.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_sorted_dependencies_with_unsorted_dependencies(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_SORTED_DEPENDENCIES_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SORTED_DEPENDENCIES_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Please ensure that in SuggestionModalForCreatorViewController'
            ' in file', 'the injected dependencies should be in the '
            'following manner: dollar imports, regular imports and '
            'constant imports, all in sorted order.']
        expected_messages.extend([
            'Please ensure that in SuggestionModalForCreatorViewController'
            ' in file ', 'the stringfied dependencies should be in the '
            'following manner: dollar imports, regular imports and '
            'constant imports, all in sorted order.'])
        self.validate(lint_task_report, expected_messages, 1)

    def test_match_line_breaks_in_controller_dependencies(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_LINE_BREAK_IN_CONTROLLER_DEPENDENCIES_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_LINE_BREAK_IN_CONTROLLER_DEPENDENCIES_FILEPATH],
                FILE_CACHE).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Please ensure that in file',
            'the line breaks pattern between the dependencies mentioned as'
            ' strings:\n[$rootScope,$window,BackgroundMaskService,\n'
            'SidebarStatusService,UrlService]\nand the dependencies '
            'mentioned as function parameters: \n($rootScope,$window,\n'
            'BackgroundMaskService,\nSidebarStatusService,UrlService)\n'
            'for the corresponding controller should exactly match.'
            ]
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_constants_declaration(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_CONSTANT_AJS_FILEPATH,
                    INVALID_CONSTANT_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['Duplicate constant declaration found.']
        expected_messages.extend([
            'Please ensure that the constant ADMIN_TABS is initialized '
            'from the value from the corresponding Angular constants file '
            '(the *.constants.ts file). Please create one in the Angular '
            'constants file if it does not exist there.'
            ])
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_duplicate_constant_declaration_in_separate_files(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_CONSTANT_IN_TS_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_IN_TS_FILEPATH,
                     INVALID_CONSTANT_IN_TS_FILEPATH],
                FILE_CACHE).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'The constant \'ADMIN_ROLE_HANDLER_URL\' is already declared '
            'in', 'Please import the file where the constant is declared '
            'or rename the constant.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_duplicate_constants_in_ajs_file(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_CONSTANT_AJS_FILEPATH,
                    INVALID_CONSTANT_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['Duplicate constant declaration found.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_as_const_in_constant_files(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_AS_CONST_CONSTANTS_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_AS_CONST_CONSTANTS_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'This constants file doesn\'t have \'as const\' at the end.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_constants_declaration_outside_class(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_CONSTANT_OUTSIDE_CLASS_AJS_FILEPATH,
                    VALID_CONSTANT_OUTSIDE_CLASS_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_CONSTANT_OUTSIDE_CLASS_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['SUCCESS  Constants declaration check passed']
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_app_constants_declaration(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_APP_CONSTANTS_AJS_FILEPATH,
                    VALID_APP_CONSTANTS_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_APP_CONSTANTS_FILEPATH], FILE_CACHE,
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['SUCCESS  Constants declaration check passed']
        self.validate(lint_task_report, expected_messages, 1)

    def test_check_constants_declaration_in_non_constant_file(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_CONSTANT_IN_TS_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_IN_TS_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Constant declaration found at line 19. Please declare the '
            'constants in a separate constants file.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_third_party_linter(self):
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            [INVALID_SORTED_DEPENDENCIES_FILEPATH]
        ).perform_all_lint_checks()
        expected_messages = ['Unused injected value IMPORT_STATEMENT']
        self.validate(lint_task_report, expected_messages, 1)

    def test_third_party_linter_with_stderr(self):
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        def mock_popen(unused_cmd, stdout, stderr):  # pylint: disable=unused-argument
            return process
        def mock_communicate(unused_self):
            return ('Output', 'Invalid')
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate)
        with popen_swap, communicate_swap:
            with self.assertRaisesRegexp(Exception, 'Invalid'):
                js_ts_linter.ThirdPartyJsTsLintChecksManager(
                    [INVALID_SORTED_DEPENDENCIES_FILEPATH]
                ).perform_all_lint_checks()

    def test_third_party_linter_with_invalid_eslint_path(self):
        def mock_exists(unused_path):
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with exists_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR    Please run start.sh first to install node-eslint and '
            'its dependencies.'):
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_SORTED_DEPENDENCIES_FILEPATH]
            ).perform_all_lint_checks()

    def test_third_party_linter_with_success_message(self):
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            [VALID_TS_FILEPATH]).perform_all_lint_checks()
        expected_messages = (
            ['SUCCESS  ESLint check passed'])
        self.validate(lint_task_report, expected_messages, 0)

    def test_custom_linter_with_no_files(self):
        lint_task_report = js_ts_linter.JsTsLintChecksManager(
            [], [], FILE_CACHE).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_linter_with_no_files(self):
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            []).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_ts_ignore_found_error(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_TS_IGNORE_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        ts_ignore_exceptions_swap = self.swap(
            js_ts_linter, 'TS_IGNORE_EXCEPTIONS', {})
        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap, ts_ignore_exceptions_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_TS_IGNORE_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['@ts-ignore found at line 25.']
        expected_messages.extend(['@ts-ignore found at line 31.'])
        expected_messages.extend([
            'Please add a comment above the @ts-ignore '
            'explaining the @ts-ignore at line 25. The format '
            'of comment should be -> This throws "...". '
            'This needs to be suppressed because ...'])
        expected_messages.extend([
            'Please add a comment above the @ts-ignore '
            'explaining the @ts-ignore at line 31. The format '
            'of comment should be -> This throws "...". '
            'This needs to be suppressed because ...'])
        self.validate(lint_task_report, expected_messages, 1)

    def test_ts_ignore_found_success(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_TS_IGNORE_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        ts_ignore_exceptions_swap = self.swap(
            js_ts_linter, 'TS_IGNORE_EXCEPTIONS', {
                VALID_TS_IGNORE_FILEPATH: ['let b: number = c;']
            })
        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap, ts_ignore_exceptions_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_TS_IGNORE_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['SUCCESS  TS ignore check passed']
        self.validate(lint_task_report, expected_messages, 0)

    def test_ts_expect_error_error(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_TS_EXPECT_ERROR_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_TS_EXPECT_ERROR_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['@ts-expect-error found at line 24.']
        expected_messages.extend(['@ts-expect-error found at line 30.'])
        expected_messages.extend([
            'Please add a comment above the '
            '@ts-expect-error explaining the '
            '@ts-expect-error at line 24. The format '
            'of comment should be -> This throws "...". '
            'This needs to be suppressed because ...'])
        expected_messages.extend([
            'Please add a comment above the '
            '@ts-expect-error explaining the '
            '@ts-expect-error at line 30. The format '
            'of comment should be -> This throws "...". '
            'This needs to be suppressed because ...'])
        self.validate(lint_task_report, expected_messages, 1)

    def test_ts_expect_error_success(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_TS_EXPECT_ERROR_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_TS_EXPECT_ERROR_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = ['SUCCESS  TS expect error check passed']
        self.validate(lint_task_report, expected_messages, 0)

    def test_missing_punctuation_at_end_of_comment(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_FORMATTED_COMMENT_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_FORMATTED_COMMENT_FILEPATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        expected_messages = [
            'Line 39: Invalid punctuation used at '
            'the end of the comment.']
        self.validate(lint_task_report, expected_messages, 1)

    def test_angular_services_index_error(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_UNLISTED_SERVICE_PATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_UNLISTED_SERVICE_PATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        angular_services_index_path = (
            './core/templates/services/angular-services.index.ts')
        class_name = 'UnlistedService'
        service_name_type_pair = (
            '[\'%s\', %s]' % (class_name, class_name))
        expected_messages = [
            'Please import %s to Angular Services Index file in %s'
            'from %s'
            % (
                class_name,
                angular_services_index_path,
                VALID_UNLISTED_SERVICE_PATH),
            'Please add the pair %s to the angularServices in %s'
            % (service_name_type_pair, angular_services_index_path)
        ]
        self.validate(lint_task_report, expected_messages, 1)

    def test_angular_services_index_success(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_IGNORED_SERVICE_PATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)
        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_IGNORED_SERVICE_PATH], FILE_CACHE,
            ).perform_all_lint_checks()

        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        expected_messages = [
            'SUCCESS  Angular Services Index file check passed'
        ]
        self.validate(lint_task_report, expected_messages, 0)

    def test_get_linters_with_success(self):
        custom_linter, third_party = js_ts_linter.get_linters(
            [VALID_JS_FILEPATH], [VALID_TS_FILEPATH], FILE_CACHE)
        self.assertTrue(
            isinstance(custom_linter, js_ts_linter.JsTsLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party,
                js_ts_linter.ThirdPartyJsTsLintChecksManager))
