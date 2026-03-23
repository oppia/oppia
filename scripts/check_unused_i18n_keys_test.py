# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/check_unused_i18n_keys.py."""

from __future__ import annotations

import builtins
import json
import logging
import os
import sys

from core.tests import test_utils
from scripts import check_unused_i18n_keys

from typing import Dict


class MockFile:
    """Mock file object for context managers."""

    def __init__(self, content: str) -> None:
        self.content = content

    def __enter__(self) -> MockFile:
        return self

    def __exit__(self, *unused_args: str) -> None:
        pass

    def read(self) -> str:
        """Returns the file content."""
        return self.content


class CheckUnusedI18nKeysTests(test_utils.GenericTestBase):
    """Test the check_unused_i18n_keys script."""

    def setUp(self) -> None:
        super().setUp()
        self.en_json_path = check_unused_i18n_keys.EN_JSON_PATH
        self.allowlist_path = check_unused_i18n_keys.ALLOWLIST_PATH

    def test_get_all_code_tokens_extracts_tokens_correctly(self) -> None:
        def mock_walk(
            unused_directory: str,
        ) -> list[tuple[str, list[str], list[str]]]:
            return [
                ('.', ['node_modules', 'valid_dir'], ['file1.ts']),
                ('./node_modules', [], ['file2.ts']),
                ('./valid_dir', [], ['file3.html', 'file4.txt']),
            ]

        def mock_open(
            path: str,
            unused_mode: str,
            encoding: str = 'utf-8',  # pylint: disable=unused-argument
        ) -> MockFile:
            if path == './file1.ts':
                return MockFile('This has I18N_KEY_1 and I18N_KEY_2')
            if path == './node_modules/file2.ts':
                return MockFile('This has I18N_NODE_KEY')
            if path == './valid_dir/file3.html':
                return MockFile(
                    'This has I18N_KEY_3 and I18N_KEY_4-with&symbol'
                )
            return MockFile('')

        walk_swap = self.swap(os, 'walk', mock_walk)
        open_swap = self.swap(builtins, 'open', mock_open)

        with walk_swap, open_swap:
            tokens = check_unused_i18n_keys.get_all_code_tokens()

        self.assertIn('I18N_KEY_1', tokens)
        self.assertIn('I18N_KEY_2', tokens)
        self.assertIn('I18N_KEY_3', tokens)
        self.assertIn('I18N_KEY_4-with&symbol', tokens)
        # Verify that tokens from node_modules files are excluded.
        self.assertNotIn('I18N_NODE_KEY', tokens)

    def test_get_all_code_tokens_logs_error_on_read_failure(self) -> None:
        def mock_walk(
            unused_directory: str,
        ) -> list[tuple[str, list[str], list[str]]]:
            return [
                ('.', [], ['file1.ts']),
            ]

        def mock_open(
            path: str,
            unused_mode: str,
            encoding: str = 'utf-8',  # pylint: disable=unused-argument
        ) -> MockFile:
            raise Exception('Mock read error.')

        walk_swap = self.swap(os, 'walk', mock_walk)
        open_swap = self.swap(builtins, 'open', mock_open)
        log_swap = self.swap_with_checks(
            logging,
            'error',
            lambda msg: None,
            expected_args=[('Error reading ./file1.ts: Mock read error.',)],
        )

        with walk_swap, open_swap, log_swap:
            tokens = check_unused_i18n_keys.get_all_code_tokens()

        self.assertEqual(len(tokens), 0)

    def test_check_unused_keys_raises_exception_if_en_json_missing(
        self,
    ) -> None:
        exists_swap = self.swap_with_checks(
            os.path,
            'exists',
            lambda _: False,
            expected_args=[(self.en_json_path,)],
        )

        with exists_swap, self.assertRaisesRegex(
            Exception,
            'File %s does not exist.' % self.en_json_path.replace('\\', '\\\\'),
        ):
            check_unused_i18n_keys.check_unused_keys()

    def test_check_unused_keys_returns_false_if_all_used(self) -> None:
        en_json_data = {'I18N_KEY_1': 'value1', 'I18N_KEY_2': 'value2'}
        allowlist_data: dict[str, list[Dict[str, str]]] = {
            'patterns': [{'pattern': 'I18N_KEY_2', 'reason': 'test'}]
        }

        def mock_exists(path: str) -> bool:
            return path == self.en_json_path

        def mock_open(
            path: str,
            unused_mode: str,
            encoding: str = 'utf-8',  # pylint: disable=unused-argument
        ) -> MockFile:
            if path == self.en_json_path:
                return MockFile(json.dumps(en_json_data))
            if path == self.allowlist_path:
                return MockFile(json.dumps(allowlist_data))
            raise Exception('Unexpected path: %s' % path)

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        open_swap = self.swap(builtins, 'open', mock_open)
        get_tokens_swap = self.swap(
            check_unused_i18n_keys,
            'get_all_code_tokens',
            lambda: {'I18N_KEY_1'},
        )
        print_swap = self.swap(builtins, 'print', lambda _: None)

        with exists_swap, open_swap, get_tokens_swap, print_swap:
            has_errors = check_unused_i18n_keys.check_unused_keys()

        self.assertFalse(has_errors)

    def test_check_unused_keys_returns_true_if_unused_keys_found(self) -> None:
        en_json_data = {'I18N_KEY_1': 'value1', 'I18N_KEY_2': 'value2'}
        allowlist_data: dict[str, list[Dict[str, str]]] = {'patterns': []}

        def mock_exists(path: str) -> bool:
            return path == self.en_json_path

        def mock_open(
            path: str,
            unused_mode: str,
            encoding: str = 'utf-8',  # pylint: disable=unused-argument
        ) -> MockFile:
            if path == self.en_json_path:
                return MockFile(json.dumps(en_json_data))
            if path == self.allowlist_path:
                return MockFile(json.dumps(allowlist_data))
            raise Exception('Unexpected path: %s' % path)

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        open_swap = self.swap(builtins, 'open', mock_open)
        get_tokens_swap = self.swap(
            check_unused_i18n_keys,
            'get_all_code_tokens',
            # KEY_2 is missing.
            lambda: {'I18N_KEY_1'},
        )
        print_swap = self.swap(builtins, 'print', lambda _: None)

        with exists_swap, open_swap, get_tokens_swap, print_swap:
            has_errors = check_unused_i18n_keys.check_unused_keys()

        self.assertTrue(has_errors)

    def test_main_exits_with_error_code_if_errors_found(self) -> None:
        check_swap = self.swap(
            check_unused_i18n_keys, 'check_unused_keys', lambda: True
        )
        exit_swap = self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(1,)]
        )

        with check_swap, exit_swap:
            check_unused_i18n_keys.main()

    def test_main_does_not_exit_if_no_errors_found(self) -> None:
        check_swap = self.swap(
            check_unused_i18n_keys, 'check_unused_keys', lambda: False
        )

        def mock_exit(val: int) -> None:
            raise Exception('sys.exit unexpectedly called')

        exit_swap = self.swap(sys, 'exit', mock_exit)

        with check_swap, exit_swap:
            check_unused_i18n_keys.main()
