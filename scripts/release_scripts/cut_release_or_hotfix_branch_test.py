# coding: utf-8
#
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

"""Unit tests for scripts/release_scripts/cut_release_or_hotfix_branch.py."""

from __future__ import annotations

import argparse
import builtins
import json
import subprocess
import sys

from core import utils
from core.tests import test_utils
from scripts import common
from scripts.release_scripts import cut_release_or_hotfix_branch

from typing import Dict, List, Optional, Union


class CutReleaseOrHotfixBranchTests(test_utils.GenericTestBase):
    """Test the methods for cutting the release or hotfix branch."""

    def setUp(self) -> None:
        super().setUp()

        self.all_cmd_tokens: List[str] = []
        self.check_function_calls = {
            'verify_local_repo_is_clean_is_called': False,
            'verify_current_branch_name_is_called': False,
            'get_remote_alias_is_called': False,
            'check_call_is_called': False,
            'verify_target_branch_does_not_already_exist_is_called': False,
            (
                'verify_target_version_compatible_with_latest_'
                'released_version_is_called'): False,
            (
                'verify_hotfix_number_is_one_ahead_of_'
                'previous_hotfix_number_is_called'): False,
            'open_new_tab_in_browser_if_possible_is_called': False
        }
        self.expected_check_function_calls = {
            'verify_local_repo_is_clean_is_called': True,
            'verify_current_branch_name_is_called': True,
            'get_remote_alias_is_called': True,
            'check_call_is_called': True,
            'verify_target_branch_does_not_already_exist_is_called': True,
            (
                'verify_target_version_compatible_with_latest_'
                'released_version_is_called'): True,
            (
                'verify_hotfix_number_is_one_ahead_of_'
                'previous_hotfix_number_is_called'): True,
            'open_new_tab_in_browser_if_possible_is_called': True
        }

        class MockResponse:
            def getcode(self) -> int:
                """Mock getcode function for mock response object."""

                return 200
        self.mock_response = MockResponse()
        def mock_url_open(unused_url: str) -> MockResponse:
            return self.mock_response
        def mock_verify_local_repo_is_clean() -> None:
            self.check_function_calls[
                'verify_local_repo_is_clean_is_called'] = True
        def mock_verify_current_branch_name(unused_branch_name: str) -> None:
            self.check_function_calls[
                'verify_current_branch_name_is_called'] = True
        def mock_get_remote_alias(unused_remote_urls: List[str]) -> str:
            self.check_function_calls['get_remote_alias_is_called'] = True
            return 'upstream'
        def mock_check_call(cmd_tokens: List[str]) -> None:
            self.all_cmd_tokens.extend(cmd_tokens)
            self.check_function_calls['check_call_is_called'] = True
        def mock_run_cmd(cmd_tokens: List[str]) -> None:
            self.all_cmd_tokens.extend(cmd_tokens)
            self.check_function_calls['run_cmd_is_called'] = True
        def mock_verify_target_branch(
            unused_remote_alias: str, unused_new_branch_name: str
        ) -> None:
            self.check_function_calls[
                'verify_target_branch_does_not_already_exist_is_called'] = True
        def mock_verify_target_version(unused_target_version: str) -> None:
            self.check_function_calls[
                'verify_target_version_compatible_with_'
                'latest_released_version_is_called'] = True
        def mock_verify_hotfix_number(
            unused_remote_alias: str,
            unused_target_version: str,
            unused_hotfix_number: int
        ) -> None:
            self.check_function_calls[
                'verify_hotfix_number_is_one_ahead_of_'
                'previous_hotfix_number_is_called'] = True
        def mock_open_tab(unused_url: str) -> None:
            self.check_function_calls[
                'open_new_tab_in_browser_if_possible_is_called'] = True
        def mock_input() -> str:
            return 'y'

        self.url_open_swap = self.swap(utils, 'url_open', mock_url_open)
        self.verify_local_repo_swap = self.swap(
            common, 'verify_local_repo_is_clean',
            mock_verify_local_repo_is_clean)
        self.verify_branch_name_swap = self.swap(
            common, 'verify_current_branch_name',
            mock_verify_current_branch_name)
        self.get_remote_alias_swap = self.swap(
            common, 'get_remote_alias', mock_get_remote_alias)
        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)
        self.run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        self.verify_target_branch_swap = self.swap(
            cut_release_or_hotfix_branch,
            'verify_target_branch_does_not_already_exist',
            mock_verify_target_branch)
        self.verify_target_version_swap = self.swap(
            cut_release_or_hotfix_branch,
            'verify_target_version_compatible_with_latest_release',
            mock_verify_target_version)
        self.verify_hotfix_number_swap = self.swap(
            cut_release_or_hotfix_branch,
            'verify_hotfix_number_is_one_ahead_of_previous_hotfix_number',
            mock_verify_hotfix_number)
        self.open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        self.input_swap = self.swap(builtins, 'input', mock_input)

    def test_exception_is_raised_if_target_branch_exists(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'new-branch\nbranch-1\nbranch-2'

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: The target branch name already exists locally. '
            'Run "git branch -D new-branch" to delete it.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_branch_does_not_already_exist(
                    'upstream', 'new-branch'))

    def test_exception_is_raised_if_target_branch_exists_on_remote_repo(
        self
    ) -> None:
        def mock_check_output(
            cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            if 'ls-remote' in cmd_tokens:
                return 'refs/heads/new-branch\nrefs/heads/branch-1'
            return 'branch-1\nbranch-2'

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: The target branch name already exists on the remote repo.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_branch_does_not_already_exist(
                    'upstream', 'new-branch'))

    def test_no_exception_is_raised_if_target_branch_does_not_exist(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'branch-1\nbranch-2'

        with self.swap(subprocess, 'check_output', mock_check_output):
            (
                cut_release_or_hotfix_branch
                .verify_target_branch_does_not_already_exist(
                    'upstream', 'new-branch'))

    def test_failure_to_fetch_release_info(self) -> None:
        def mock_getcode() -> str:
            return '404'
        # Here we use MyPy ignore because here 'getcode' is a method and
        # assignment to a method is not allowed by MyPy.
        self.mock_response.getcode = mock_getcode  # type: ignore[assignment]
        with self.url_open_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: Failed to fetch latest release info from GitHub.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_invalid_last_version_tag(self) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'invalid-tag', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: Could not parse version number of latest GitHub release.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_unexpected_major_version_change(self) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'v2.1.1', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegex(
            AssertionError, 'Unexpected major version change.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_invalid_target_version_raises_error(self) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'v2.1.1', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: Could not parse target version.'
        ):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '123'
                )
            )

    def test_invalid_difference_between_patch_versions(self) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'v1.2.1', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegex(
            AssertionError,
            'The current patch version is not equal to previous '
            'patch version plus one.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_invalid_difference_between_minor_versions(self) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'v1.0.9', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegex(
            AssertionError,
            'The current minor version is not equal to previous minor '
            'version plus one.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.0'))

    def test_invalid_patch_version_with_valid_difference_between_minor_versions(
        self
    ) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'v1.1.9', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegex(
            AssertionError, 'The current patch version is different than 0.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.1'))

    def test_no_exception_is_raised_for_valid_target_version(self) -> None:
        def mock_load(unused_response: Dict[str, str]) -> Dict[str, str]:
            return {'tag_name': 'v1.1.9', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap:
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.0'))

    def test_exception_is_raised_for_invalid_new_hotfix_number(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return (
                'branch1\nremotes/upstream/branch2\n'
                'remotes/upstream/release-1.2.3-hotfix-2\n'
                'remotes/upstream/release-1.2.3-hotfix-1\n'
                'remotes/upstream/release-1.2.2-hotfix-3\n'
                'remotes/upstream/release-1.2.3\n')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            AssertionError,
            'The difference between two continuous hotfix numbers is not one.'):
            (
                cut_release_or_hotfix_branch
                .verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
                    'upstream', '1.2.3', 4))

    def test_exception_is_raised_for_missing_release_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return (
                'branch1\nremotes/upstream/branch2\n'
                'remotes/upstream/release-1.2.3-hotfix-2\n'
                'remotes/upstream/release-1.2.3-hotfix-1\n'
                'remotes/upstream/release-1.2.3-hotfix-3\n')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            AssertionError, 'Release branch is missing.'):
            (
                cut_release_or_hotfix_branch
                .verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
                    'upstream', '1.2.3', 4))

    def test_no_exception_is_raised_for_valid_new_hotfix_number(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return (
                'branch1\nremotes/upstream/branch2\n'
                'remotes/upstream/release-1.2.3-hotfix-2\n'
                'remotes/upstream/release-1.2.3-hotfix-1\n'
                'remotes/upstream/release-1.2.2-hotfix-3\n'
                'remotes/upstream/release-1.2.3\n')

        with self.swap(subprocess, 'check_output', mock_check_output):
            (
                cut_release_or_hotfix_branch
                .verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
                    'upstream', '1.2.3', 3))

    def test_exception_is_raised_for_invalid_release_version(self) -> None:
        with self.assertRaisesRegex(
            argparse.ArgumentTypeError,
            'The format of "release_version" should be: x.x.x'):
            (
                cut_release_or_hotfix_branch
                .require_release_version_to_have_correct_format('invalid'))

    def test_no_exception_is_raised_for_valid_release_version(self) -> None:
        (
            cut_release_or_hotfix_branch
            .require_release_version_to_have_correct_format('1.2.3'))

    def test_missing_release_version(self) -> None:
        args_swap = self.swap(
            sys, 'argv', ['cut_release_or_hotfix_branch.py'])
        with args_swap, self.assertRaisesRegex(
            Exception, 'ERROR: A "release_version" arg must be specified.'):
            cut_release_or_hotfix_branch.main()

    def test_main_with_valid_args(self) -> None:
        check_function_calls: Dict[str, Optional[Union[str, bool, int]]] = {
            'execute_branch_cut_gets_called': False,
            'release_version': None,
            'hotfix_number': None
        }
        expected_check_function_calls: Dict[
            str, Optional[Union[str, bool, int]]
        ] = {
            'execute_branch_cut_gets_called': True,
            'release_version': '1.2.3',
            'hotfix_number': 1
        }
        def mock_execute_branch_cut(
            release_version: str, hotfix_number: int
        ) -> None:
            check_function_calls['release_version'] = release_version
            check_function_calls['hotfix_number'] = hotfix_number
            check_function_calls['execute_branch_cut_gets_called'] = True
        args_swap = self.swap(
            sys, 'argv', [
                'cut_release_or_hotfix_branch.py',
                '--release_version=1.2.3', '--hotfix_number=1'])
        branch_cut_swap = self.swap(
            cut_release_or_hotfix_branch, 'execute_branch_cut',
            mock_execute_branch_cut)
        with args_swap, branch_cut_swap:
            cut_release_or_hotfix_branch.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_exception_is_raised_if_actions_ci_is_failing(self) -> None:
        def mock_input() -> str:
            return 'n'

        input_swap = self.swap(builtins, 'input', mock_input)
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.verify_target_branch_swap:
                with self.verify_target_version_swap, self.open_tab_swap:
                    with self.get_remote_alias_swap, self.check_call_swap:
                        with input_swap, self.assertRaisesRegex(
                            Exception,
                            'Tests should pass on develop before this '
                            'script is run.'):
                            cut_release_or_hotfix_branch.execute_branch_cut(
                                '1.2.3', 0)

        self.expected_check_function_calls[
            'verify_hotfix_number_is_one_ahead_of_previous_'
            'hotfix_number_is_called'] = False
        self.expected_check_function_calls[
            'verify_target_version_compatible_with_'
            'latest_released_version_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_function_calls_for_release_branch(self) -> None:
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.get_remote_alias_swap, self.check_call_swap:
                with self.verify_target_branch_swap:
                    with self.verify_target_version_swap, self.open_tab_swap:
                        with self.input_swap:
                            cut_release_or_hotfix_branch.execute_branch_cut(
                                '1.2.3', 0)
        self.expected_check_function_calls[
            'verify_hotfix_number_is_one_ahead_of_previous_'
            'hotfix_number_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        expected_cmd_tokens = [
            'git', 'pull', 'upstream', 'develop',
            'git', 'checkout', '-b', 'release-1.2.3',
            'git', 'push', 'upstream', 'release-1.2.3']
        self.assertEqual(self.all_cmd_tokens, expected_cmd_tokens)

    def test_function_calls_for_hotfix_branch_with_hotfix_number_more_than_one(
        self
    ) -> None:
        def mock_get_current_branch_name() -> str:
            return 'release-1.2.3-hotfix-2'
        get_branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.get_remote_alias_swap, self.check_call_swap:
                with self.verify_target_branch_swap, self.run_cmd_swap:
                    with self.verify_target_version_swap, self.open_tab_swap:
                        with self.verify_hotfix_number_swap, self.input_swap:
                            with get_branch_name_swap:
                                cut_release_or_hotfix_branch.execute_branch_cut(
                                    '1.2.3', 3)
        self.expected_check_function_calls[
            'verify_target_version_compatible_with_'
            'latest_released_version_is_called'] = False
        self.expected_check_function_calls['run_cmd_is_called'] = True
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        expected_cmd_tokens = [
            'git', 'pull', 'upstream', 'develop',
            'git', 'checkout', 'release-1.2.3-hotfix-2',
            'git', 'pull', 'upstream', 'release-1.2.3-hotfix-2',
            'git', 'checkout', '-b', 'release-1.2.3-hotfix-3',
            'release-1.2.3-hotfix-2']
        self.assertEqual(self.all_cmd_tokens, expected_cmd_tokens)

    def test_function_calls_for_hotfix_branch_with_hotfix_number_equal_to_one(
        self
    ) -> None:
        def mock_get_current_branch_name() -> str:
            return 'release-1.2.3'
        get_branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.get_remote_alias_swap, self.check_call_swap:
                with self.verify_target_branch_swap, self.run_cmd_swap:
                    with self.verify_target_version_swap, self.open_tab_swap:
                        with self.verify_hotfix_number_swap, self.input_swap:
                            with get_branch_name_swap:
                                cut_release_or_hotfix_branch.execute_branch_cut(
                                    '1.2.3', 1)
        self.expected_check_function_calls[
            'verify_target_version_compatible_with_'
            'latest_released_version_is_called'] = False
        self.expected_check_function_calls['run_cmd_is_called'] = True
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        expected_cmd_tokens = [
            'git', 'pull', 'upstream', 'develop',
            'git', 'checkout', 'release-1.2.3',
            'git', 'pull', 'upstream', 'release-1.2.3',
            'git', 'checkout', '-b', 'release-1.2.3-hotfix-1', 'release-1.2.3']
        self.assertEqual(self.all_cmd_tokens, expected_cmd_tokens)
