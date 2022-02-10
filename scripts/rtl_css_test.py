# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/rtl_css.py."""

from __future__ import annotations

import os
import subprocess

from core import utils
from core.tests import test_utils

from . import rtl_css


class RtlCSSTests(test_utils.GenericTestBase):
    """Test the methods for the rtl css validation script."""

    def setUp(self):
        super(RtlCSSTests, self).setUp()
        self.observed_rtl_file_count = 0
        self.validated_rtl_css_file_count = 0
        self.validated_css_file_count = 0

    def test_main_generate(self):
        """Tests that all the .rtl.css files in the codebase are regenerated
        with the '--generate' command.
        """
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        def mock_popen_without_std_in(  # pylint: disable=unused-argument
                unused_cmd_tokens, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE):
            self.observed_rtl_file_count += 1
            return process
        popen_swap_without_stdin = self.swap(
            subprocess, 'Popen', mock_popen_without_std_in)
        expected_rtl_file_count = 0
        pages_base_dir = os.path.join(os.getcwd(), 'core', 'templates')
        for _, _, files in os.walk(pages_base_dir):
            for file in files:
                if file.endswith('.rtl.css'):
                    expected_rtl_file_count += 1
        with popen_swap_without_stdin:
            rtl_css.main(args=['--mode', 'generate'])
            self.assertEqual(
                self.observed_rtl_file_count, expected_rtl_file_count)

    def test_main_validate(self):
        """Tests that the .rtl.css files are validated with the '--validate'
        command.
        """
        class MockFile:
            def __init__(self, filepath):
                self.filepath = filepath

            def read(self):  # pylint: disable=missing-docstring
                return self.filepath.encode()

        class StdinProcess: # pylint: disable=missing-docstring
            # The disable=W0622 is for the error - Redefining built-in 'input'
            # which is not applicable here as this class is only sued for
            # mocking.
            def communicate(self, input): # pylint: disable=missing-docstring disable=redefined-builtin
                return input, None

        def mock_popen_with_std_in(  # pylint: disable=unused-argument
                unused_cmd_tokens, stdin=subprocess.PIPE,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE):
            return StdinProcess()

        def mock_open(filepath, mode, encoding=None): # pylint: disable=unused-argument
            if filepath.endswith('.rtl.css'):
                self.validated_rtl_css_file_count += 1
                return MockFile(filepath[:-8])
            self.validated_css_file_count += 1
            return MockFile(filepath[:-4])

        def errorred_mock_open(filepath, mode, encoding=None): # pylint: disable=unused-argument
            if filepath.endswith('.rtl.css'):
                return MockFile(filepath[:-8])

            # Mocks an error in only one file.
            if filepath.endswith('splash-page.component.css'):
                return MockFile(filepath)
            return MockFile(filepath[:-4])

        popen_swap_with_stdin = self.swap(
            subprocess, 'Popen', mock_popen_with_std_in)
        open_swap = self.swap(utils, 'open_file', mock_open)
        errorred_open_swap = self.swap(
            utils, 'open_file', errorred_mock_open)

        raises_exception = self.assertRaisesRegex(
            Exception, 'Invalid RTL CSS for the following files')
        with popen_swap_with_stdin:
            with open_swap:
                rtl_css.main(args=['--mode', 'validate'])
                self.assertEqual(
                    self.validated_css_file_count,
                    self.validated_rtl_css_file_count)

            with errorred_open_swap, raises_exception:
                rtl_css.main(args=['--mode', 'validate'])

    def test_no_rtlcss_installed(self):
        """Tests that error is thrown if rtlcss is not installed."""
        class MockPath:
            def join(self, filename, *_): # pylint: disable=missing-docstring
                return filename

            def exists(self): # pylint: disable=missing-docstring
                return False

        os_swap = self.swap(os, 'path', MockPath)
        raises_exception = self.assertRaisesRegex(
            Exception, 'ERROR    Please run start.py first to install rtlcss '
            'and its dependencies.')
        with os_swap, raises_exception:
            rtl_css.main(args=['--mode', 'validate'])

    def test_error_caught_in_generate(self):
        """Tests that error is caught correctly in the generate script."""
        class MockErroredProcess:
            def communicate(self): # pylint: disable=missing-docstring
                return None, 'Error'

        def mock_popen(  # pylint: disable=unused-argument
                unused_cmd_tokens, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE):
            return MockErroredProcess()

        raises_exception = self.assertRaisesRegex(
            Exception, 'Error')
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, raises_exception:
            rtl_css.main(args=['--mode', 'generate'])
