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

from core.tests import test_utils

from . import rtl_css

class RtlCSSTests(test_utils.GenericTestBase):
    """Test the methods for the rtl css validation script."""

    def setUp(self):
        super(RtlCSSTests, self).setUp()
        self.observed_rtl_file_count = 0
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen(  # pylint: disable=unused-argument
                unused_cmd_tokens, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE):
            self.observed_rtl_file_count += 1
            return process
        self.popen_swap = self.swap(subprocess, 'Popen', mock_popen)

    def test_main(self):
        """Tests that all the .rtl.css files in the codebase are regenerated
        with the '--generate' command.
        """
        expected_rtl_file_count = 0
        pages_base_dir = os.path.join(os.getcwd(), 'core', 'templates')
        for _, _, files in os.walk(pages_base_dir):
            for file in files:
                if file.endswith('.rtl.css'):
                    expected_rtl_file_count += 1
        with self.popen_swap:
            rtl_css.main(args=['--mode', 'generate'])
            self.assertEqual(
                self.observed_rtl_file_count, expected_rtl_file_count)
