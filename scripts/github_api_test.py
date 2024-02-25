# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/github_api.py."""

from __future__ import annotations

import subprocess

from core.tests import test_utils

from typing import List

from . import github_api


class MockProcessOutput:
    returncode = 0
    stdout = ''


class GithubApiTests(test_utils.GenericTestBase):
    """Unit tests for testing the github_api script."""

    def setUp(self) -> None:
        super().setUp()
        self.gh_help_cmd = ['gh', 'help']
        self.gh_auth_cmd = ['gh', 'auth', 'token']

    def test_deep_get(self) -> None:
        self.assertEqual(
            github_api.deep_get(
                {'a': {'b': {'c': 1}}}, ['a', 'b', 'c']
            ), 1)
        self.assertEqual(
            github_api.deep_get(
                {'a': {'b': {'c': 'string'}}}, ['a', 'b', 'c']
            ), 'string')
        self.assertEqual(
            github_api.deep_get(
                {'a': {'b': {'c': 1}}}, ['a', 'b']
            ), {'c': 1})
        self.assertEqual(
            github_api.deep_get(
                {'a': {'b': {'c': 1}}}, ['a', 'd']
            ), None)

    def mock_successful_gh_subprocess_run(
        self, cmd: List[str]
    ) -> MockProcessOutput:
        if cmd == self.gh_help_cmd:
            return MockProcessOutput()
        elif cmd == self.gh_auth_cmd:
            gh_auth_process_output = MockProcessOutput()
            gh_auth_process_output.stdout = 'github_pat_11A'
            return gh_auth_process_output
        else:
            raise Exception(
                'Invalid command passed to subprocess.run method')

    def test_no_github_cli_throws_error(self) -> None:
        failed_process_output = MockProcessOutput()
        failed_process_output.returncode = 1

        def mock_subprocess_run(cmd: List[str]) -> MockProcessOutput:
            if cmd == self.gh_help_cmd:
                return failed_process_output
            elif cmd == self.gh_auth_cmd:
                return MockProcessOutput()
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run method')
        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        error_message = (
            'Github CLI is not installed. Please install the Github CLI ' +
            'before running Github API functions.')
        with swap_subprocess_run, self.assertRaisesRegex(
            RuntimeError, error_message):
            github_api.get_github_auth_token()

    def test_bad_github_auth_token_throws_error(self) -> None:
        failed_process_output = MockProcessOutput()
        failed_process_output.returncode = 1

        def mock_subprocess_run(cmd: List[str]) -> MockProcessOutput:
            if cmd == self.gh_help_cmd:
                return MockProcessOutput()
            elif cmd == self.gh_auth_cmd:
                return failed_process_output
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run method')
        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        error_message = (
            'Failed to get Github auth token from the Github cli.')
        with swap_subprocess_run, self.assertRaisesRegex(
            RuntimeError, error_message):
            github_api.get_github_auth_token()

    def test_get_authorization_bearer(self) -> None:
        swap_subprocess_run = self.swap(
            subprocess, 'run', self.mock_successful_gh_subprocess_run)
        with swap_subprocess_run:
            self.assertEqual(
                github_api.get_authorization_bearer(),
                'Bearer github_pat_11A')
