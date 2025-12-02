# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Tests for scripts/start_utils.py."""

from __future__ import annotations

import contextlib
import io
import socket
import unittest

from scripts import start_utils


class IsPortInUseTests(unittest.TestCase):
    """Tests for is_port_in_use function."""

    def test_returns_false_for_available_port(self) -> None:
        # Use an ephemeral port that we immediately close
        # to ensure it's available
        temp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            temp_socket.bind(('', 0))
            _, port = temp_socket.getsockname()
        finally:
            temp_socket.close()
        
        # Small delay to ensure socket is fully released
        import time
        time.sleep(0.01)
        
        # Port should now be available
        self.assertFalse(start_utils.is_port_in_use(port))

    def test_returns_true_for_port_in_use(self) -> None:
        # Create a server socket on an ephemeral port
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(('', 0))
        _, port = server.getsockname()
        server.listen(1)
        
        try:
            # Port should be in use
            self.assertTrue(start_utils.is_port_in_use(port))
        finally:
            server.close()


class PrintEachStringAfterTwoNewLinesTests(unittest.TestCase):
    """Tests for print_each_string_after_two_new_lines function."""

    def test_prints_strings_with_newlines(self) -> None:
        output = io.StringIO()
        strings = ['Hello', 'World', 'Test']
        
        with contextlib.redirect_stdout(output):
            start_utils.print_each_string_after_two_new_lines(strings)
        
        result = output.getvalue()
        self.assertEqual(result, 'Hello\\n\\nWorld\\n\\nTest\\n\\n')

    def test_works_with_empty_list(self) -> None:
        output = io.StringIO()
        
        with contextlib.redirect_stdout(output):
            start_utils.print_each_string_after_two_new_lines([])
        
        result = output.getvalue()
        self.assertEqual(result, '')

    def test_works_with_single_string(self) -> None:
        output = io.StringIO()
        
        with contextlib.redirect_stdout(output):
            start_utils.print_each_string_after_two_new_lines(['Single'])
        
        result = output.getvalue()
        self.assertEqual(result, 'Single\\n\\n')


class LazyImportTests(unittest.TestCase):
    """Tests for lazy_import function."""

    def test_successfully_imports_valid_module(self) -> None:
        # Test with a standard library module
        sys_module = start_utils.lazy_import('sys')
        self.assertIsNotNone(sys_module)
        self.assertTrue(hasattr(sys_module, 'version'))

    def test_raises_error_for_invalid_module(self) -> None:
        with self.assertRaises(ModuleNotFoundError) as context:
            start_utils.lazy_import('nonexistent_module_that_does_not_exist')
        
        # Verify the error message contains helpful instructions
        error_message = str(context.exception)
        self.assertIn('nonexistent_module_that_does_not_exist', error_message)
        self.assertIn('activate your dev venv', error_message)
        self.assertIn('pip install -r requirements.txt', error_message)

    def test_imports_submodule(self) -> None:
        # Test importing a submodule
        os_path = start_utils.lazy_import('os.path')
        self.assertIsNotNone(os_path)
        self.assertTrue(hasattr(os_path, 'join'))


if __name__ == '__main__':
    unittest.main()
