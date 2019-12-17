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

"""Unit tests for scripts/cut_release_or_hotfix_branch.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import json
import subprocess
import sys

from core.tests import test_utils
import python_utils
from scripts import common
from scripts.release_scripts import cut_release_or_hotfix_branch


class CutReleaseOrHotfixBranchTests(test_utils.GenericTestBase):
    """Test the methods for cutting the release or hotfix branch."""

    def setUp(self):
        super(CutReleaseOrHotfixBranchTests, self).setUp()

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

        class MockResponse(python_utils.OBJECT):
            def getcode(self):
                """Mock getcode function for mock response object."""
                return 200
        self.mock_response = MockResponse()
        def mock_url_open(unused_url):
            return self.mock_response
        def mock_verify_local_repo_is_clean():
            self.check_function_calls[
                'verify_local_repo_is_clean_is_called'] = True
        def mock_verify_current_branch_name(unused_branch_name):
            self.check_function_calls[
                'verify_current_branch_name_is_called'] = True
        def mock_get_remote_alias(unused_remote_url):
            self.check_function_calls['get_remote_alias_is_called'] = True
            return 'upstream'
        def mock_check_call(unused_cmd_tokens):
            self.check_function_calls['check_call_is_called'] = True
        def mock_verify_target_branch(
                unused_remote_alias, unused_new_branch_name):
            self.check_function_calls[
                'verify_target_branch_does_not_already_exist_is_called'] = True
        def mock_verify_target_version(unused_target_version):
            self.check_function_calls[
                'verify_target_version_compatible_with_'
                'latest_released_version_is_called'] = True
        def mock_verify_hotfix_number(
                unused_remote_alias, unused_target_version,
                unused_hotfix_number):
            self.check_function_calls[
                'verify_hotfix_number_is_one_ahead_of_'
                'previous_hotfix_number_is_called'] = True
        def mock_open_tab(unused_url):
            self.check_function_calls[
                'open_new_tab_in_browser_if_possible_is_called'] = True
        def mock_input():
            return 'y'

        self.url_open_swap = self.swap(python_utils, 'url_open', mock_url_open)
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
        self.input_swap = self.swap(python_utils, 'INPUT', mock_input)

    def test_exception_is_raised_if_target_branch_exists(self):
        def mock_check_output(unused_cmd_tokens):
            return 'new-branch\nbranch-1\nbranch-2'

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR: The target branch name already exists locally. '
            'Run "git branch -D new-branch" to delete it.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_branch_does_not_already_exist(
                    'upstream', 'new-branch'))

    def test_exception_is_raised_if_target_branch_exists_on_remote_repo(self):
        def mock_check_output(cmd_tokens):
            if 'ls-remote' in cmd_tokens:
                return 'refs/heads/new-branch\nrefs/heads/branch-1'
            return 'branch-1\nbranch-2'

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR: The target branch name already exists on the remote repo.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_branch_does_not_already_exist(
                    'upstream', 'new-branch'))

    def test_no_exception_is_raised_if_target_branch_does_not_exist(self):
        def mock_check_output(unused_cmd_tokens):
            return 'branch-1\nbranch-2'

        with self.swap(subprocess, 'check_output', mock_check_output):
            (
                cut_release_or_hotfix_branch
                .verify_target_branch_does_not_already_exist(
                    'upstream', 'new-branch'))

    def test_failure_to_fetch_release_info(self):
        def mock_getcode():
            return '404'
        self.mock_response.getcode = mock_getcode
        with self.url_open_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR: Failed to fetch latest release info from GitHub.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_invalid_last_version_tag(self):
        def mock_load(unused_response):
            return {'tag_name': 'invalid-tag', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR: Could not parse version number of latest GitHub release.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_unexpected_major_version_change(self):
        def mock_load(unused_response):
            return {'tag_name': 'v2.1.1', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaisesRegexp(
            AssertionError, 'Unexpected major version change.'):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_invalid_difference_between_patch_versions(self):
        def mock_load(unused_response):
            return {'tag_name': 'v1.2.1', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaises(AssertionError):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.3'))

    def test_invalid_difference_between_minor_versions(self):
        def mock_load(unused_response):
            return {'tag_name': 'v1.0.9', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaises(AssertionError):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.0'))

    def test_invalid_patch_version_with_valid_difference_between_minor_versions(
            self):
        def mock_load(unused_response):
            return {'tag_name': 'v1.1.9', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap, self.assertRaises(AssertionError):
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.1'))

    def test_no_exception_is_raised_for_valid_target_version(self):
        def mock_load(unused_response):
            return {'tag_name': 'v1.1.9', 'test': 'release-test'}

        load_swap = self.swap(json, 'load', mock_load)
        with self.url_open_swap, load_swap:
            (
                cut_release_or_hotfix_branch
                .verify_target_version_compatible_with_latest_release(
                    '1.2.0'))

    def test_exception_is_raised_for_invalid_new_hotfix_number(self):
        def mock_check_output(unused_cmd_tokens):
            return (
                'branch1\nupstream/branch2\nupstream/release-1.2.3-hotfix-2\n'
                'upstream/release-1.2.3-hotfix-1\n'
                'upstream/release-1.2.2-hotfix-3\n'
                'upstream/release-1.2.3\n')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaises(AssertionError):
            (
                cut_release_or_hotfix_branch
                .verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
                    'upstream', '1.2.3', 4))

    def test_exception_is_raised_for_missing_release_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return (
                'branch1\nupstream/branch2\nupstream/release-1.2.3-hotfix-2\n'
                'upstream/release-1.2.3-hotfix-1\n'
                'upstream/release-1.2.3-hotfix-3\n')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaises(AssertionError):
            (
                cut_release_or_hotfix_branch
                .verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
                    'upstream', '1.2.3', 4))

    def test_no_exception_is_raised_for_valid_new_hotfix_number(self):
        def mock_check_output(unused_cmd_tokens):
            return (
                'branch1\nupstream/branch2\nupstream/release-1.2.3-hotfix-2\n'
                'upstream/release-1.2.3-hotfix-1\n'
                'upstream/release-1.2.2-hotfix-3\n'
                'upstream/release-1.2.3\n')

        with self.swap(subprocess, 'check_output', mock_check_output):
            (
                cut_release_or_hotfix_branch
                .verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
                    'upstream', '1.2.3', 3))

    def test_exception_is_raised_for_invalid_new_version(self):
        with self.assertRaisesRegexp(
            argparse.ArgumentTypeError,
            'The format of "new_version" should be: x.x.x'):
            cut_release_or_hotfix_branch.new_version_type('invalid')

    def test_no_exception_is_raised_for_valid_new_version(self):
        cut_release_or_hotfix_branch.new_version_type('1.2.3')

    def test_missing_new_version(self):
        args_swap = self.swap(
            sys, 'argv', ['cut_release_or_hotfix_branch.py'])
        with args_swap, self.assertRaisesRegexp(
            Exception, 'ERROR: A "new_version" arg must be specified.'):
            cut_release_or_hotfix_branch.execute_branch_cut()

    def test_exception_is_raised_if_travis_is_failing(self):
        def mock_input():
            return 'n'

        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        args_swap = self.swap(
            sys, 'argv',
            ['cut_release_or_hotfix_branch.py', '--new_version=1.2.3'])
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.verify_target_branch_swap:
                with self.verify_target_version_swap, self.open_tab_swap:
                    with self.get_remote_alias_swap, self.check_call_swap:
                        with input_swap, args_swap, self.assertRaises(
                            SystemExit):
                            cut_release_or_hotfix_branch.execute_branch_cut()

        self.expected_check_function_calls[
            'verify_hotfix_number_is_one_ahead_of_previous_'
            'hotfix_number_is_called'] = False
        self.expected_check_function_calls[
            'verify_target_version_compatible_with_'
            'latest_released_version_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_function_calls_for_release_branch(self):
        args_swap = self.swap(
            sys, 'argv',
            ['cut_release_or_hotfix_branch.py', '--new_version=1.2.3'])
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.get_remote_alias_swap, self.check_call_swap:
                with self.verify_target_branch_swap:
                    with self.verify_target_version_swap, self.open_tab_swap:
                        with self.input_swap, args_swap:
                            cut_release_or_hotfix_branch.execute_branch_cut()
        self.expected_check_function_calls[
            'verify_hotfix_number_is_one_ahead_of_previous_'
            'hotfix_number_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_function_calls_for_hotfix_branch_with_hotfix_number_more_than_one(
            self):
        args_swap = self.swap(
            sys, 'argv',
            [
                'cut_release_or_hotfix_branch.py', '--new_version=1.2.3',
                '--hotfix_number=3'])
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.get_remote_alias_swap, self.check_call_swap:
                with self.verify_target_branch_swap, args_swap:
                    with self.verify_target_version_swap, self.open_tab_swap:
                        with self.verify_hotfix_number_swap, self.input_swap:
                            cut_release_or_hotfix_branch.execute_branch_cut()
        self.expected_check_function_calls[
            'verify_target_version_compatible_with_'
            'latest_released_version_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_function_calls_for_hotfix_branch_with_hotfix_number_equal_to_one(
            self):
        args_swap = self.swap(
            sys, 'argv',
            [
                'cut_release_or_hotfix_branch.py', '--new_version=1.2.3',
                '--hotfix_number=1'])
        with self.verify_local_repo_swap, self.verify_branch_name_swap:
            with self.get_remote_alias_swap, self.check_call_swap:
                with self.verify_target_branch_swap, args_swap:
                    with self.verify_target_version_swap, self.open_tab_swap:
                        with self.verify_hotfix_number_swap, self.input_swap:
                            cut_release_or_hotfix_branch.execute_branch_cut()
        self.expected_check_function_calls[
            'verify_target_version_compatible_with_'
            'latest_released_version_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
