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

"""Unit tests for 'scripts/regenerate_requirements.py'."""

from __future__ import annotations

import os
import sys

from piptools.scripts import compile

from core.tests import test_utils
from scripts import common
from scripts import regenerate_requirements


class RegenerateRequirementsTests(test_utils.GenericTestBase):
    """Test the functionality of regenerating requirements."""

    def test_main_calls_correct_commands(self) -> None:
        check_function_calls = {
            'cli_is_called': False
        }
        expected_check_function_calls = {
            'cli_is_called': True
        }
        system_args = [None]
        swap_system_args = self.swap(sys, 'argv', system_args)

        def mock_swap_cli() -> None:
            check_function_calls['cli_is_called'] = True

        swap_compile_cli = self.swap(compile, 'cli', mock_swap_cli)

        with swap_system_args, swap_compile_cli:
            regenerate_requirements.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
