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
import shutil
import subprocess
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

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_JS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')
VALID_CONSTANT_OUTSIDE_CLASS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_constant_outside_class.constants.ts')
VALID_CONSTANT_OUTSIDE_CLASS_AJS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid_constant_outside_class.constants.ajs.ts')
VALID_BACKEND_API_SERVICE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid-backend-api.service.ts')
EXTRA_JS_FILEPATH = os.path.join('core', 'templates', 'demo.js')
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
INVALID_HTTP_CLIENT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_http_client_used.ts')
INVALID_FORMATTED_COMMENT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_comments.ts')


class JsTsLintTests(test_utils.GenericTestBase):
    """Tests for js_ts_linter file."""

    def setUp(self):
        super(JsTsLintTests, self).setUp()
        self.linter_stdout = []

        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: str. Variable length argument list of values to print in
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
                [], [VALID_JS_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()

    def test_check_extra_js_file_found(self):
        def mock_readlines(unused_self, unused_filepath):
            return ('var a = 10;\n',)

        def mock_read(unused_self, unused_filepath):
            return 'var a = 10;\n'

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        read_swap = self.swap(
            pre_commit_linter.FileCache, 'read', mock_read)

        with self.print_swap, readlines_swap, read_swap:
            js_ts_linter.JsTsLintChecksManager(
                [EXTRA_JS_FILEPATH], [], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements(
            ['Found extra .js file'],
            self.linter_stdout)
        self.assert_same_list_elements([
            'If you want the above files to be present as js files, add '
            'them to the list JS_FILEPATHS_NOT_TO_BUILD in build.py. '
            'Otherwise, rename them to .ts'], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_COMPONENT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Please ensure that there is exactly one component '
            'in the file.'], self.linter_stdout)

    def test_check_directive_scope_with_true_value(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_SCOPE_TRUE_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SCOPE_TRUE_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Please ensure that baseContent directive in ',
            ' file does not have scope set to true.'], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SCOPE_FILEPATH], FILE_CACHE,
                False).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Please ensure that baseContent directive in ',
            ' file has a scope: {}.'], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_SORTED_DEPENDENCIES_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Please ensure that in SuggestionModalForCreatorViewController'
            ' in file', 'the injected dependencies should be in the '
            'following manner: dollar imports, regular imports and '
            'constant imports, all in sorted order.'], self.linter_stdout)
        self.assert_same_list_elements([
            'Please ensure that in SuggestionModalForCreatorViewController'
            ' in file ', 'the stringfied dependencies should be in the '
            'following manner: dollar imports, regular imports and '
            'constant imports, all in sorted order.'], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_LINE_BREAK_IN_CONTROLLER_DEPENDENCIES_FILEPATH],
                FILE_CACHE, True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Please ensure that in file',
            'the line breaks pattern between the dependencies mentioned as'
            ' strings:\n[$rootScope,$window,BackgroundMaskService,\n'
            'SidebarStatusService,UrlService]\nand the dependencies '
            'mentioned as function parameters: \n($rootScope,$window,\n'
            'BackgroundMaskService,\nSidebarStatusService,UrlService)\n'
            'for the corresponding controller should exactly match.'
            ], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements(
            ['Duplicate constant declaration found.'],
            self.linter_stdout)
        self.assert_same_list_elements([
            'Please ensure that the constant ADMIN_TABS is initialized '
            'from the value from the corresponding Angular constants file '
            '(the *.constants.ts file). Please create one in the Angular '
            'constants file if it does not exist there.'
            ], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_IN_TS_FILEPATH,
                     INVALID_CONSTANT_IN_TS_FILEPATH],
                FILE_CACHE, True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'The constant \'ADMIN_ROLE_HANDLER_URL\' is already declared '
            'in', 'Please import the file where the constant is declared '
            'or rename the constant.'], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements(
            ['Duplicate constant declaration found.'],
            self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [VALID_CONSTANT_OUTSIDE_CLASS_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements(
            ['SUCCESS  Constants declaration check passed'],
            self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_CONSTANT_IN_TS_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Constant declaration found at line 19. Please declare the '
            'constants in a separate constants file.'], self.linter_stdout)

    def test_third_party_linter(self):
        with self.print_swap:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_SORTED_DEPENDENCIES_FILEPATH],
                True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'You have an error in your DI configuration. Each items of '
            'the array should match exactly one function parameter'
            ], self.linter_stdout)

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
        self.assert_same_list_elements(
            ['SUCCESS  1 JavaScript and Typescript files linted'],
            self.linter_stdout)

    def test_custom_linter_with_no_files(self):
        with self.print_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [], FILE_CACHE, True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no JavaScript or Typescript files to lint.'],
            self.linter_stdout)

    def test_third_party_linter_with_no_files(self):
        with self.print_swap:
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no JavaScript or Typescript files to lint.'],
            self.linter_stdout)

    def test_http_client_used_with_excluded_file(self):
        excluded_file = (
            'core/templates/services/request-interceptor.service.spec.ts')

        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'core/templates/services/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    excluded_file)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [excluded_file], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements(
            ['SUCCESS  HTTP requests check passed'], self.linter_stdout)

    def test_http_client_used_in_backend_api_service_file(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_BACKEND_API_SERVICE_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [VALID_BACKEND_API_SERVICE_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements(
            ['SUCCESS  HTTP requests check passed'], self.linter_stdout)

    def test_http_client_used_with_error_message(self):
        def mock_compile_all_ts_files():
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH +
                    'scripts/linters/test_files/', 'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    INVALID_HTTP_CLIENT_FILEPATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_HTTP_CLIENT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'An instance of HttpClient is found in this file. You are not '
            'allowed to create http requests from files that are not '
            'backend api services.'], self.linter_stdout)

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

        with self.print_swap, compile_all_ts_files_swap:
            js_ts_linter.JsTsLintChecksManager(
                [], [INVALID_FORMATTED_COMMENT_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)
        self.assert_same_list_elements([
            'Line 39: Invalid punctuation used at '
            'the end of the comment.'], self.linter_stdout)

    def test_get_linters_with_success(self):
        custom_linter, third_party = js_ts_linter.get_linters(
            [VALID_JS_FILEPATH], [VALID_TS_FILEPATH], FILE_CACHE,
            verbose_mode_enabled=True)
        self.assertTrue(
            isinstance(custom_linter, js_ts_linter.JsTsLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party,
                js_ts_linter.ThirdPartyJsTsLintChecksManager))
