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
VALID_BACKEND_API_SERVICE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'valid-backend-api.service.ts')
INVALID_SORTED_DEPENDENCIES_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_sorted_dependencies.ts')
INVALID_CONSTANT_IN_TS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_constant_in_ts_file.ts')
INVALID_CONSTANT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid.constants.ts')
INVALID_CONSTANT_AJS_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid.constants.ajs.ts')
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
        expected_messages = [
            'Please ensure that the constant ADMIN_TABS is initialized '
            'from the value from the corresponding Angular constants file '
            '(the *.constants.ts file). Please create one in the Angular '
            'constants file if it does not exist there.'
            ]
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
