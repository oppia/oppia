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

# pylint: disable=relative-import
from core.tests import test_utils
import typescript_checks

# pylint: enable=relative-import


class TypescriptChecksTests(test_utils.GenericTestBase):
    """Test the typescript checks."""
    def test_compile_and_check_typescript(self):
        check_function_calls = {
            'compile_and_check_typescript_gets_called': False
        }
        expected_check_function_calls = {
            'compile_and_check_typescript_gets_called': True
        }

        def mock_compile_and_check_typescript():
            check_function_calls[
                'compile_and_check_typescript_gets_called'] = True

        compile_and_check_typescript_swap = self.swap(
            typescript_checks, 'compile_and_check_typescript',
            mock_compile_and_check_typescript)

        with compile_and_check_typescript_swap:
            typescript_checks.compile_and_check_typescript()

        self.assertEqual(check_function_calls, expected_check_function_calls)
