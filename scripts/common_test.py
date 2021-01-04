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

"""Unit tests for scripts/common.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import contextlib
import getpass
import http.server
import os
import re
import shutil
import signal
import socketserver
import stat
import subprocess
import sys
import tempfile
import time

import constants
from core.tests import test_utils
import feconf
import python_utils

import contextlib2
import psutil

from . import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(
    _PARENT_DIR, 'oppia_tools', 'PyGithub-%s' % common.PYGITHUB_VERSION)
sys.path.insert(0, _PY_GITHUB_PATH)

import github # isort:skip  pylint: disable=wrong-import-position


class MockPsutilProcess(python_utils.OBJECT):
    """A mock class for Process class in Psutil."""

    cmdlines = [
        ['dev_appserver.py', '--host', '0.0.0.0', '--port', '9001'],
        ['downloads']
    ]

    def __init__(self, index):
        """Constructor for this mock object.

        Args:
            index: int. The index of process to be checked.
        """
        self.index = index

    def cmdline(self):
        """Return the command line of this process."""
        pass

    def kill(self):
        """Kill the process."""
        pass

    def is_running(self):
        """Check whether the function is running."""
        return True


class CommonTests(test_utils.GenericTestBase):
    """Test the methods which handle common functionalities."""

    def test_is_x64_architecture_in_x86(self):
        maxsize_swap = self.swap(sys, 'maxsize', 1)
        with maxsize_swap:
            self.assertFalse(common.is_x64_architecture())

    def test_is_x64_architecture_in_x64(self):
        maxsize_swap = self.swap(sys, 'maxsize', 2**32 + 1)
        with maxsize_swap:
            self.assertTrue(common.is_x64_architecture())

    def test_run_cmd(self):
        self.assertEqual(
            common.run_cmd(('echo Test for common.py ').split(' ')),
            'Test for common.py')

    def test_ensure_directory_exists_with_existing_dir(self):
        check_function_calls = {
            'makedirs_gets_called': False
        }
        def mock_makedirs(unused_dirpath):
            check_function_calls['makedirs_gets_called'] = True
        with self.swap(os, 'makedirs', mock_makedirs):
            common.ensure_directory_exists('assets')
        self.assertEqual(check_function_calls, {'makedirs_gets_called': False})

    def test_ensure_directory_exists_with_non_existing_dir(self):
        check_function_calls = {
            'makedirs_gets_called': False
        }
        def mock_makedirs(unused_dirpath):
            check_function_calls['makedirs_gets_called'] = True
        with self.swap(os, 'makedirs', mock_makedirs):
            common.ensure_directory_exists('test-dir')
        self.assertEqual(check_function_calls, {'makedirs_gets_called': True})

    def test_require_cwd_to_be_oppia_with_correct_cwd_and_unallowed_deploy_dir(
            self):
        common.require_cwd_to_be_oppia()

    def test_require_cwd_to_be_oppia_with_correct_cwd_and_allowed_deploy_dir(
            self):
        common.require_cwd_to_be_oppia(allow_deploy_dir=True)

    def test_require_cwd_to_be_oppia_with_wrong_cwd_and_unallowed_deploy_dir(
            self):
        def mock_getcwd():
            return 'invalid'
        getcwd_swap = self.swap(os, 'getcwd', mock_getcwd)
        with getcwd_swap, self.assertRaisesRegexp(
            Exception, 'Please run this script from the oppia/ directory.'):
            common.require_cwd_to_be_oppia()

    def test_require_cwd_to_be_oppia_with_wrong_cwd_and_allowed_deploy_dir(
            self):
        def mock_getcwd():
            return 'invalid'
        def mock_basename(unused_dirpath):
            return 'deploy-dir'
        def mock_isdir(unused_dirpath):
            return True
        getcwd_swap = self.swap(os, 'getcwd', mock_getcwd)
        basename_swap = self.swap(os.path, 'basename', mock_basename)
        isdir_swap = self.swap(os.path, 'isdir', mock_isdir)
        with getcwd_swap, basename_swap, isdir_swap:
            common.require_cwd_to_be_oppia(allow_deploy_dir=True)

    def test_open_new_tab_in_browser_if_possible_with_user_manually_opening_url(
            self):
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 1,
                'check_call_gets_called': False
            }
            def mock_call(unused_cmd_tokens):
                return 0
            def mock_check_call(unused_cmd_tokens):
                check_function_calls['check_call_gets_called'] = True
            def mock_input():
                check_function_calls['input_gets_called'] += 1
                return 'n'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(python_utils, 'INPUT', mock_input)
            with call_swap, check_call_swap, input_swap:
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_open_new_tab_in_browser_if_possible_with_url_opening_correctly(
            self):
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 1,
                'check_call_gets_called': True
            }
            def mock_call(unused_cmd_tokens):
                return 0
            def mock_check_call(unused_cmd_tokens):
                check_function_calls['check_call_gets_called'] = True
            def mock_input():
                check_function_calls['input_gets_called'] += 1
                return 'y'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(python_utils, 'INPUT', mock_input)
            with call_swap, check_call_swap, input_swap:
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_open_new_tab_in_browser_if_possible_with_url_not_opening_correctly(
            self):
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 2,
                'check_call_gets_called': False
            }
            def mock_call(unused_cmd_tokens):
                return 1
            def mock_check_call(unused_cmd_tokens):
                check_function_calls['check_call_gets_called'] = True
            def mock_input():
                check_function_calls['input_gets_called'] += 1
                return 'y'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(python_utils, 'INPUT', mock_input)
            with call_swap, check_call_swap, input_swap:
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_get_remote_alias_with_correct_alias(self):
        def mock_check_output(unused_cmd_tokens):
            return 'remote1 url1\nremote2 url2'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.get_remote_alias('url1'), 'remote1')

    def test_get_remote_alias_with_incorrect_alias(self):
        def mock_check_output(unused_cmd_tokens):
            return 'remote1 url1\nremote2 url2'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR: There is no existing remote alias for the url3 repo.'):
            common.get_remote_alias('url3')

    def test_verify_local_repo_is_clean_with_clean_repo(self):
        def mock_check_output(unused_cmd_tokens):
            return 'nothing to commit, working directory clean'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            common.verify_local_repo_is_clean()

    def test_verify_local_repo_is_clean_with_unclean_repo(self):
        def mock_check_output(unused_cmd_tokens):
            return 'invalid'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception, 'ERROR: This script should be run from a clean branch.'):
            common.verify_local_repo_is_clean()

    def test_get_current_branch_name(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.get_current_branch_name(), 'test')

    def test_get_current_release_version_number_with_non_hotfix_branch(self):
        self.assertEqual(
            common.get_current_release_version_number('release-1.2.3'), '1.2.3')

    def test_get_current_release_version_number_with_hotfix_branch(self):
        self.assertEqual(
            common.get_current_release_version_number('release-1.2.3-hotfix-1'),
            '1.2.3')

    def test_get_current_release_version_number_with_maintenance_branch(self):
        self.assertEqual(
            common.get_current_release_version_number(
                'release-maintenance-1.2.3'), '1.2.3')

    def test_get_current_release_version_number_with_invalid_branch(self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid branch name: invalid-branch.'):
            common.get_current_release_version_number('invalid-branch')

    def test_is_current_branch_a_hotfix_branch_with_non_hotfix_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch release-1.2.3'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_hotfix_branch(), False)

    def test_is_current_branch_a_hotfix_branch_with_hotfix_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch release-1.2.3-hotfix-1'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_hotfix_branch(), True)

    def test_is_current_branch_a_release_branch_with_release_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch release-1.2.3'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), True)

    def test_is_current_branch_a_release_branch_with_hotfix_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch release-1.2.3-hotfix-1'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), True)

    def test_is_current_branch_a_release_branch_with_maintenance_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch release-maintenance-1.2.3'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), True)

    def test_is_current_branch_a_release_branch_with_non_release_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), False)

    def test_is_current_branch_a_test_branch_with_test_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch test-common'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_test_branch(), True)

    def test_is_current_branch_a_test_branch_with_non_test_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch invalid-test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_test_branch(), False)

    def test_verify_current_branch_name_with_correct_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            common.verify_current_branch_name('test')

    def test_verify_current_branch_name_with_incorrect_branch(self):
        def mock_check_output(unused_cmd_tokens):
            return 'On branch invalid'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR: This script can only be run from the "test" branch.'):
            common.verify_current_branch_name('test')

    def test_is_port_open(self):
        self.assertFalse(common.is_port_open(4444))

        handler = http.server.SimpleHTTPRequestHandler
        httpd = socketserver.TCPServer(('', 4444), handler)

        self.assertTrue(common.is_port_open(4444))
        httpd.server_close()

    def test_wait_for_port_to_be_closed_port_never_closes(self):
        def mock_sleep(unused_seconds):
            return
        def mock_is_port_open(unused_port_number):
            return True

        sleep_swap = self.swap_with_checks(
            time, 'sleep', mock_sleep, expected_args=[(1,)] * 60)
        is_port_open_swap = self.swap(
            common, 'is_port_open', mock_is_port_open)

        with sleep_swap, is_port_open_swap:
            success = common.wait_for_port_to_be_closed(9999)
        self.assertFalse(success)

    def test_wait_for_port_to_be_closed_port_closes(self):
        def mock_sleep(unused_seconds):
            raise AssertionError('mock_sleep should not be called.')
        def mock_is_port_open(unused_port_number):
            return False

        sleep_swap = self.swap(
            time, 'sleep', mock_sleep)
        is_port_open_swap = self.swap(
            common, 'is_port_open', mock_is_port_open)

        with sleep_swap, is_port_open_swap:
            success = common.wait_for_port_to_be_closed(9999)
        self.assertTrue(success)

    def test_permissions_of_file(self):
        root_temp_dir = tempfile.mkdtemp()
        temp_dirpath = tempfile.mkdtemp(dir=root_temp_dir)
        temp_file = tempfile.NamedTemporaryFile(dir=temp_dirpath)
        temp_file.name = 'temp_file'
        temp_file_path = os.path.join(temp_dirpath, 'temp_file')
        with python_utils.open_file(temp_file_path, 'w') as f:
            f.write('content')

        common.recursive_chown(root_temp_dir, os.getuid(), -1)
        common.recursive_chmod(root_temp_dir, 0o744)

        for root, directories, filenames in os.walk(root_temp_dir):
            for directory in directories:
                self.assertEqual(
                    oct(stat.S_IMODE(
                        os.stat(os.path.join(root, directory)).st_mode)),
                    '0744')
                self.assertEqual(
                    os.stat(os.path.join(root, directory)).st_uid, os.getuid())

            for filename in filenames:
                self.assertEqual(
                    oct(stat.S_IMODE(
                        os.stat(os.path.join(root, filename)).st_mode)), '0744')
                self.assertEqual(
                    os.stat(os.path.join(root, filename)).st_uid, os.getuid())

        shutil.rmtree(root_temp_dir)

    def test_print_each_string_after_two_new_lines(self):
        @contextlib.contextmanager
        def _redirect_stdout(new_target):
            """Redirect stdout to the new target.

            Args:
                new_target: TextIOWrapper. The new target to which stdout is
                    redirected.

            Yields:
                TextIOWrapper. The new target.
            """
            old_target = sys.stdout
            sys.stdout = new_target
            try:
                yield new_target
            finally:
                sys.stdout = old_target

        target_stdout = python_utils.string_io()
        with _redirect_stdout(target_stdout):
            common.print_each_string_after_two_new_lines([
                'These', 'are', 'sample', 'strings.'])

        self.assertEqual(
            target_stdout.getvalue(), 'These\n\nare\n\nsample\n\nstrings.\n\n')

    def test_install_npm_library(self):

        def _mock_subprocess_check_call(unused_command):
            """Mocks subprocess.check_call() to create a temporary file instead
            of the actual npm library.
            """
            temp_file = tempfile.NamedTemporaryFile()
            temp_file.name = 'temp_file'
            with python_utils.open_file('temp_file', 'w') as f:
                f.write('content')

            self.assertTrue(os.path.exists('temp_file'))
            temp_file.close()

        self.assertFalse(os.path.exists('temp_file'))

        with self.swap(subprocess, 'check_call', _mock_subprocess_check_call):
            common.install_npm_library('library_name', 'version', 'path')

    def test_ask_user_to_confirm(self):
        def mock_input():
            return 'Y'
        with self.swap(python_utils, 'INPUT', mock_input):
            common.ask_user_to_confirm('Testing')

    def test_get_personal_access_token_with_valid_token(self):
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return 'token'
        with self.swap(getpass, 'getpass', mock_getpass):
            self.assertEqual(common.get_personal_access_token(), 'token')

    def test_get_personal_access_token_with_token_as_none(self):
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return None
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with getpass_swap, self.assertRaisesRegexp(
            Exception,
            'No personal access token provided, please set up a personal '
            'access token at https://github.com/settings/tokens and re-run '
            'the script'):
            common.get_personal_access_token()

    def test_closed_blocking_bugs_milestone_results_in_exception(self):
        mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_get_milestone(unused_self, number):  # pylint: disable=unused-argument
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'state': 'closed'}, completed='')
        get_milestone_swap = self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone)
        with get_milestone_swap, self.assertRaisesRegexp(
            Exception, 'The blocking bug milestone is closed.'):
            common.check_blocking_bug_issue_count(mock_repo)

    def test_non_zero_blocking_bug_issue_count_results_in_exception(self):
        mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_open_tab(unused_url):
            pass
        def mock_get_milestone(unused_self, number):  # pylint: disable=unused-argument
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'open_issues': 10, 'state': 'open'}, completed='')
        get_milestone_swap = self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone)
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        with get_milestone_swap, open_tab_swap, self.assertRaisesRegexp(
            Exception, (
                'There are 10 unresolved blocking bugs. Please '
                'ensure that they are resolved before release '
                'summary generation.')):
            common.check_blocking_bug_issue_count(mock_repo)

    def test_zero_blocking_bug_issue_count_results_in_no_exception(self):
        mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_get_milestone(unused_self, number):  # pylint: disable=unused-argument
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'open_issues': 0, 'state': 'open'}, completed='')
        with self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone):
            common.check_blocking_bug_issue_count(mock_repo)

    def test_check_prs_for_current_release_are_released_with_no_unreleased_prs(
            self):
        mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        label_for_released_prs = (
            constants.release_constants.LABEL_FOR_RELEASED_PRS)
        label_for_current_release_prs = (
            constants.release_constants.LABEL_FOR_CURRENT_RELEASE_PRS)
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': label_for_released_prs},
                    {'name': label_for_current_release_prs}]},
            completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': label_for_released_prs},
                    {'name': label_for_current_release_prs}]},
            completed='')
        label = github.Label.Label(
            requester='', headers='',
            attributes={
                'name': label_for_current_release_prs},
            completed='')
        def mock_get_issues(unused_self, state, labels):  # pylint: disable=unused-argument
            return [pull1, pull2]
        def mock_get_label(unused_self, unused_name):
            return [label]

        get_issues_swap = self.swap(
            github.Repository.Repository, 'get_issues', mock_get_issues)
        get_label_swap = self.swap(
            github.Repository.Repository, 'get_label', mock_get_label)
        with get_issues_swap, get_label_swap:
            common.check_prs_for_current_release_are_released(mock_repo)

    def test_check_prs_for_current_release_are_released_with_unreleased_prs(
            self):
        mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_open_tab(unused_url):
            pass
        label_for_released_prs = (
            constants.release_constants.LABEL_FOR_RELEASED_PRS)
        label_for_current_release_prs = (
            constants.release_constants.LABEL_FOR_CURRENT_RELEASE_PRS)
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': label_for_current_release_prs}]},
            completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': label_for_released_prs},
                    {'name': label_for_current_release_prs}]},
            completed='')
        label = github.Label.Label(
            requester='', headers='',
            attributes={
                'name': label_for_current_release_prs},
            completed='')
        def mock_get_issues(unused_self, state, labels):  # pylint: disable=unused-argument
            return [pull1, pull2]
        def mock_get_label(unused_self, unused_name):
            return [label]

        get_issues_swap = self.swap(
            github.Repository.Repository, 'get_issues', mock_get_issues)
        get_label_swap = self.swap(
            github.Repository.Repository, 'get_label', mock_get_label)
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        with get_issues_swap, get_label_swap, open_tab_swap:
            with self.assertRaisesRegexp(
                Exception, (
                    'There are PRs for current release which do not '
                    'have a \'%s\' label. Please ensure that '
                    'they are released before release summary '
                    'generation.') % (
                        constants.release_constants.LABEL_FOR_RELEASED_PRS)):
                common.check_prs_for_current_release_are_released(mock_repo)

    def test_kill_processes_based_on_regex(self):
        killed = []

        def mock_kill(p):
            killed.append(MockPsutilProcess.cmdlines[p.index])

        def mock_cmdlines(p):
            return MockPsutilProcess.cmdlines[p.index]

        def mock_process_iter():
            return [MockPsutilProcess(0), MockPsutilProcess(1)]

        process_iter_swap = self.swap_with_checks(
            psutil, 'process_iter', mock_process_iter)
        kill_swap = self.swap(MockPsutilProcess, 'kill', mock_kill)
        cmdlines_swap = self.swap(MockPsutilProcess, 'cmdline', mock_cmdlines)
        with process_iter_swap, kill_swap, cmdlines_swap:
            common.kill_processes_based_on_regex(r'.*dev_appserver\.py')
        self.assertEqual(killed, [MockPsutilProcess.cmdlines[0]])

    def test_kill_processes_based_on_regex_when_access_denied(self):
        killed = []

        def mock_kill(p):
            killed.append(MockPsutilProcess.cmdlines[p.index])

        def mock_cmdlines(p):
            if p.index == 0:
                raise psutil.AccessDenied()
            return MockPsutilProcess.cmdlines[p.index]

        def mock_process_iter():
            return [MockPsutilProcess(0), MockPsutilProcess(1)]

        process_iter_swap = self.swap_with_checks(
            psutil, 'process_iter', mock_process_iter)
        kill_swap = self.swap(MockPsutilProcess, 'kill', mock_kill)
        cmdlines_swap = self.swap(MockPsutilProcess, 'cmdline', mock_cmdlines)
        with process_iter_swap, kill_swap, cmdlines_swap:
            common.kill_processes_based_on_regex(r'.*dev_appserver\.py')
        self.assertEqual(killed, [])

    def test_kill_process_when_psutil_not_in_path(self):
        path_swap = self.swap(sys, 'path', [])
        def mock_process_iter():
            return []
        process_iter_swap = self.swap(psutil, 'process_iter', mock_process_iter)
        with path_swap, process_iter_swap:
            common.kill_processes_based_on_regex('')

    def test_inplace_replace_file(self):
        origin_file = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json')
        backup_file = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.bak')
        expected_lines = [
            '{\n',
            '    "RANDMON1" : "randomValue1",\n',
            '    "312RANDOM" : "ValueRanDom2",\n',
            '    "DEV_MODE": true,\n',
            '    "RAN213DOM" : "raNdoVaLue3"\n',
            '}\n'
        ]

        def mock_remove(unused_file):
            return

        remove_swap = self.swap_with_checks(
            os, 'remove', mock_remove, expected_args=[(backup_file,)]
        )
        with remove_swap:
            common.inplace_replace_file(
                origin_file, '"DEV_MODE": .*', '"DEV_MODE": true,')
        with python_utils.open_file(origin_file, 'r') as f:
            self.assertEqual(expected_lines, f.readlines())
        # Revert the file.
        os.remove(origin_file)
        shutil.move(backup_file, origin_file)

    def test_inplace_replace_file_with_exception_raised(self):
        origin_file = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json')
        backup_file = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.bak')
        with python_utils.open_file(origin_file, 'r') as f:
            origin_content = f.readlines()

        def mock_compile(unused_arg):
            raise ValueError('Exception raised from compile()')

        compile_swap = self.swap_with_checks(re, 'compile', mock_compile)
        with self.assertRaisesRegexp(
            ValueError, r'Exception raised from compile\(\)'), compile_swap:
            common.inplace_replace_file(
                origin_file, '"DEV_MODE": .*', '"DEV_MODE": true,')
        self.assertFalse(os.path.isfile(backup_file))
        with python_utils.open_file(origin_file, 'r') as f:
            new_content = f.readlines()
        self.assertEqual(origin_content, new_content)

    def test_convert_to_posixpath_on_windows(self):
        def mock_is_windows():
            return True

        is_windows_swap = self.swap(common, 'is_windows_os', mock_is_windows)
        original_filepath = 'c:\\path\\to\\a\\file.js'
        with is_windows_swap:
            actual_file_path = common.convert_to_posixpath(original_filepath)
        self.assertEqual(actual_file_path, 'c:/path/to/a/file.js')

    def test_convert_to_posixpath_on_platform_other_than_windows(self):
        def mock_is_windows():
            return False

        is_windows_swap = self.swap(common, 'is_windows_os', mock_is_windows)
        original_filepath = 'c:\\path\\to\\a\\file.js'
        with is_windows_swap:
            actual_file_path = common.convert_to_posixpath(original_filepath)
        self.assertEqual(actual_file_path, original_filepath)

    def test_create_readme(self):
        try:
            os.makedirs('readme_test_dir')
            common.create_readme('readme_test_dir', 'Testing readme.')
            with python_utils.open_file('readme_test_dir/README.md', 'r') as f:
                self.assertEqual(f.read(), 'Testing readme.')
        finally:
            if os.path.exists('readme_test_dir'):
                shutil.rmtree('readme_test_dir')

    def test_windows_os_throws_exception_when_starting_redis_server(self):
        def mock_is_windows_os():
            return True
        windows_not_supported_exception = self.assertRaisesRegexp(
            Exception,
            'The redis command line interface is not installed because your '
            'machine is on the Windows operating system. The redis server '
            'cannot start.')
        swap_os_check = self.swap(common, 'is_windows_os', mock_is_windows_os)
        with swap_os_check, windows_not_supported_exception:
            common.start_redis_server()

    def test_windows_os_throws_exception_when_stopping_redis_server(self):
        def mock_is_windows_os():
            return True
        windows_not_supported_exception = self.assertRaisesRegexp(
            Exception,
            'The redis command line interface is not installed because your '
            'machine is on the Windows operating system. There is no redis '
            'server to shutdown.')
        swap_os_check = self.swap(common, 'is_windows_os', mock_is_windows_os)

        with swap_os_check, windows_not_supported_exception:
            common.stop_redis_server()

    def test_start_and_stop_server_calls_are_called(self):
        # Test that starting the server calls subprocess.call().
        check_function_calls = {
            'subprocess_call_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True
        }

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''
            return Ret()

        def mock_wait_for_port_to_be_open(port): # pylint: disable=unused-argument
            return

        swap_call = self.swap(subprocess, 'call', mock_call)
        swap_wait_for_port_to_be_open = self.swap(
            common, 'wait_for_port_to_be_open',
            mock_wait_for_port_to_be_open)
        with swap_call, swap_wait_for_port_to_be_open:
            common.start_redis_server()

        self.assertEqual(check_function_calls, expected_check_function_calls)

        # Test that stopping the server calls subprocess.call().
        check_function_calls = {
            'subprocess_call_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True
        }

        swap_call = self.swap(subprocess, 'call', mock_call)
        with swap_call:
            common.stop_redis_server()

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_start_server_removes_redis_dump(self):
        check_function_calls = {
            'os_remove_is_called': False
        }

        def mock_os_remove_file(file_path): # pylint: disable=unused-argument
            check_function_calls['os_remove_is_called'] = True

        def mock_os_path_exists(file_path): # pylint: disable=unused-argument
            return True

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''
            return Ret()

        def mock_wait_for_port_to_be_open(port): # pylint: disable=unused-argument
            return

        swap_call = self.swap(subprocess, 'call', mock_call)
        swap_wait_for_port_to_be_open = self.swap(
            common, 'wait_for_port_to_be_open',
            mock_wait_for_port_to_be_open)
        swap_os_remove = self.swap(os, 'remove', mock_os_remove_file)
        swap_os_path_exists = self.swap(os.path, 'exists', mock_os_path_exists)
        with swap_call, swap_wait_for_port_to_be_open, swap_os_remove, (
            swap_os_path_exists):
            common.start_redis_server()

        self.assertTrue(check_function_calls['os_remove_is_called'])

    def test_fix_third_party_imports_correctly_sets_up_imports(self):
        common.fix_third_party_imports()
        # Asserts that imports from problematic modules do not error.
        from google.cloud import tasks_v2 # pylint: disable=unused-variable
        from google.appengine.api import app_identity # pylint: disable=unused-variable

    def test_swap_env_when_var_had_a_value(self):
        os.environ['ABC'] = 'Hard as Rocket Science'
        with common.swap_env('ABC', 'Easy as 123') as old_value:
            self.assertEqual(old_value, 'Hard as Rocket Science')
            self.assertEqual(os.environ['ABC'], 'Easy as 123')
        self.assertEqual(os.environ['ABC'], 'Hard as Rocket Science')

    def test_swap_env_when_var_did_not_exist(self):
        self.assertNotIn('DEF', os.environ)
        with common.swap_env('DEF', 'Easy as 123') as old_value:
            self.assertIsNone(old_value)
            self.assertEqual(os.environ['DEF'], 'Easy as 123')
        self.assertNotIn('DEF', os.environ)


class ManagedProcessTests(test_utils.TestBase):

    # Helper class for improving the readability of tests.
    POPEN_CALL = (
        collections.namedtuple('POPEN_CALL', ['program_args', 'kwargs']))

    @contextlib.contextmanager
    def _swap_popen(
            self, make_processes_unresponsive=False, num_children=0):
        """Returns values for inspecting and mocking calls to psutil.Popen.

        Args:
            make_processes_unresponsive: bool. Whether the processes created by
                the mock will stall when asked to terminate. Processes will
                always terminate within ~1 minute regardless of this choice.
            num_children: int. The number of child processes the process created
                by the mock should create. Children inherit the same termination
                behavior.

        Returns:
            Context manager. A context manager in which calls to psutil.Popen
            create a simple program that simply waits and then exits.

        Yields:
            list(POPEN_CALL). A list with the most up-to-date arguments passed
            to psutil.Popen from within the context manager returned.
        """
        popen_calls = []

        def popen_mock(program_args, **kwargs):
            """Mock of psutil.Popen that creates processes using os.fork().

            The processes created will always terminate within ~1 minute.

            Args:
                program_args: list(*). Unused program arguments that would
                    otherwise be used by psutil.Popen.
                **kwargs: dict(str: *). Unused keyword arguments that would
                    otherwise be used by psutil.Popen.

            Returns:
                psutil.Process. Handle for the parent of the new process tree.
            """
            child_pid = os.fork()
            if child_pid != 0:
                popen_calls.append(self.POPEN_CALL(program_args, kwargs))
                time.sleep(1) # Give child a chance to start running.
                return psutil.Process(pid=child_pid)

            for _ in python_utils.RANGE(num_children):
                if os.fork() == 0:
                    break

            if make_processes_unresponsive:
                # Register an unresponsive function as the SIGTERM handler.
                signal.signal(signal.SIGTERM, lambda *_: time.sleep(30))

            time.sleep(30)
            sys.exit()

        with self.swap(psutil, 'Popen', popen_mock):
            yield popen_calls

    def test_does_not_raise_when_psutil_not_in_path(self):
        with contextlib2.ExitStack() as stack:
            stack.enter_context(self.swap(sys, 'path', []))
            stack.enter_context(self._swap_popen())

            # Entering the context should not raise.
            stack.enter_context(common.managed_process(['a'], timeout_secs=10))

    def test_concats_command_args_when_shell_is_true(self):
        with contextlib2.ExitStack() as stack:
            logs = stack.enter_context(self.capture_logging())
            popen_calls = stack.enter_context(self._swap_popen())

            stack.enter_context(
                common.managed_process(['a', 1], shell=True, timeout_secs=10))

        self.assertEqual(logs, [])
        self.assertEqual(popen_calls, [self.POPEN_CALL('a 1', {'shell': True})])

    def test_passes_command_args_as_list_of_strings_when_shell_is_false(self):
        with contextlib2.ExitStack() as stack:
            logs = stack.enter_context(self.capture_logging())
            popen_calls = stack.enter_context(self._swap_popen())

            stack.enter_context(
                common.managed_process(['a', 1], shell=False, timeout_secs=10))

        self.assertEqual(logs, [])
        self.assertEqual(
            popen_calls, [self.POPEN_CALL(['a', '1'], {'shell': False})])

    def test_filters_empty_strings_from_command_args_when_shell_is_true(self):
        with contextlib2.ExitStack() as stack:
            logs = stack.enter_context(self.capture_logging())
            popen_calls = stack.enter_context(self._swap_popen())

            stack.enter_context(common.managed_process(
                ['', 'a', '', 1], shell=True, timeout_secs=10))

        self.assertEqual(logs, [])
        self.assertEqual(popen_calls, [self.POPEN_CALL('a 1', {'shell': True})])

    def test_filters_empty_strings_from_command_args_when_shell_is_false(self):
        with contextlib2.ExitStack() as stack:
            logs = stack.enter_context(self.capture_logging())
            popen_calls = stack.enter_context(self._swap_popen())

            stack.enter_context(common.managed_process(
                ['', 'a', '', 1], shell=False, timeout_secs=10))

        self.assertEqual(logs, [])
        self.assertEqual(
            popen_calls, [self.POPEN_CALL(['a', '1'], {'shell': False})])

    def test_reports_killed_processes_as_warnings(self):
        with contextlib2.ExitStack() as stack:
            logs = stack.enter_context(self.capture_logging())
            stack.enter_context(self._swap_popen(
                make_processes_unresponsive=True))

            proc = stack.enter_context(
                common.managed_process(['a'], timeout_secs=10))
            pid = proc.pid

        self.assertEqual(logs, ['Process killed (pid=%d)' % pid])

    def test_kills_child_processes(self):
        with contextlib2.ExitStack() as stack:
            logs = stack.enter_context(self.capture_logging())
            stack.enter_context(self._swap_popen(
                make_processes_unresponsive=True, num_children=3))

            proc = stack.enter_context(
                common.managed_process(['a'], timeout_secs=10))
            pids = [c.pid for c in proc.children()] + [proc.pid]

        self.assertEqual(len(pids), 4)
        self.assertItemsEqual(
            logs, ['Process killed (pid=%d)' % p for p in pids])

    def test_managed_firebase_emulator(self):
        os.environ['GCLOUD_PROJECT'] = 'foo'
        os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = ''
        with contextlib2.ExitStack() as stack:
            popen_calls = stack.enter_context(self._swap_popen())

            stack.enter_context(common.managed_firebase_auth_emulator())
            self.assertEqual(
                os.environ['GCLOUD_PROJECT'], feconf.OPPIA_PROJECT_ID)
            self.assertEqual(
                os.environ['FIREBASE_AUTH_EMULATOR_HOST'],
                feconf.FIREBASE_AUTH_EMULATOR_HOST)

        self.assertEqual(os.environ['GCLOUD_PROJECT'], 'foo')
        self.assertEqual(os.environ['FIREBASE_AUTH_EMULATOR_HOST'], '')
        self.assertEqual(len(popen_calls), 1)
        self.assertIn('firebase', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True})

    def test_managed_dev_appserver(self):
        with contextlib2.ExitStack() as stack:
            popen_calls = stack.enter_context(self._swap_popen())

            stack.enter_context(
                common.managed_dev_appserver('app.yaml', env=None))

        self.assertEqual(len(popen_calls), 1)
        self.assertIn('dev_appserver.py', popen_calls[0].program_args)
        self.assertEqual(popen_calls[0].kwargs, {'shell': True, 'env': None})
