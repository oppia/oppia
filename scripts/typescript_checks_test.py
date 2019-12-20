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

"""Unit tests for scripts/typescript_checks.py."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json
import os
import subprocess

from core.tests import test_utils
import python_utils
from . import typescript_checks

TEST_SOURCE_DIR = os.path.join('core', 'tests', 'build_sources')
MOCK_COMPILED_JS_DIR = os.path.join(TEST_SOURCE_DIR, 'compiled_js_dir', '')


class TypescriptChecksTests(test_utils.GenericTestBase):
    """Test the typescript checks."""

    def setUp(self):
        super(TypescriptChecksTests, self).setUp()
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen(unused_cmd, stdout):
            return process
        # pylint: enable=unused-argument

        self.popen_swap = self.swap(subprocess, 'Popen', mock_popen)

    def test_compiled_js_dir_validation(self):
        """Test that typescript_checks.COMPILED_JS_DIR is validated correctly
        with outDir in typescript_checks.TSCONFIG_FILEPATH.
        """
        with self.popen_swap:
            typescript_checks.compile_and_check_typescript()
            out_dir = ''
            with python_utils.open_file(
                typescript_checks.TSCONFIG_FILEPATH, 'r') as f:
                config_data = json.load(f)
                out_dir = os.path.join(
                    config_data['compilerOptions']['outDir'], '')
            compiled_js_dir_swap = self.swap(
                typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR)
            with compiled_js_dir_swap, self.assertRaisesRegexp(
                Exception,
                'COMPILED_JS_DIR: %s does not match the output directory '
                'in %s: %s' % (
                    MOCK_COMPILED_JS_DIR, typescript_checks.TSCONFIG_FILEPATH,
                    out_dir)):
                typescript_checks.compile_and_check_typescript()

    def test_compiled_js_dir_is_deleted_before_compilation(self):
        """Test that compiled_js_dir is deleted before a fresh compilation."""
        def mock_validate_compiled_js_dir():
            pass

        compiled_js_dir_swap = self.swap(
            typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR)
        validate_swap = self.swap(
            typescript_checks, 'validate_compiled_js_dir',
            mock_validate_compiled_js_dir)
        with self.popen_swap, compiled_js_dir_swap, validate_swap:
            if not os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)):
                os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))

            typescript_checks.compile_and_check_typescript()
            self.assertFalse(
                os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)))

    def test_compiled_js_dir_is_deleted_after_compilation(self):
        """Test that compiled_js_dir is deleted before a fresh compilation."""
        def mock_validate_compiled_js_dir():
            pass
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen_for_deletion(unused_cmd, stdout):
            os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))
            return process
        # pylint: enable=unused-argument

        compiled_js_dir_swap = self.swap(
            typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR)
        validate_swap = self.swap(
            typescript_checks, 'validate_compiled_js_dir',
            mock_validate_compiled_js_dir)
        popen_swap = self.swap(
            subprocess, 'Popen', mock_popen_for_deletion)
        with popen_swap, compiled_js_dir_swap, validate_swap:
            if not os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)):
                os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))
            typescript_checks.compile_and_check_typescript()
            self.assertFalse(
                os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)))

    def test_no_error_is_produced_for_valid_compilation(self):
        """Test that no error is produced if stdout is empty."""
        with self.popen_swap:
            typescript_checks.compile_and_check_typescript()

    def test_error_is_produced_for_invalid_compilation(self):
        """Test that error is produced if stdout is not empty."""
        process = subprocess.Popen(['echo', 'test'], stdout=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen_for_errors(unused_cmd, stdout):
            return process
        # pylint: enable=unused-argument

        with self.swap(
            subprocess, 'Popen', mock_popen_for_errors), self.assertRaises(
                SystemExit):
            typescript_checks.compile_and_check_typescript()
