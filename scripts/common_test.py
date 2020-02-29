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

import contextlib
import getpass
import http.server
import os
import re
import shutil
import socketserver
import stat
import subprocess
import sys
import tempfile

from core.tests import test_utils

import psutil
import python_utils
import release_constants


from . import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position


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

    def test_open_new_tab_in_browser_if_possible_with_url_opening_correctly(
            self):
        check_function_calls = {
            'input_gets_called': False,
            'check_call_gets_called': False
        }
        expected_check_function_calls = {
            'input_gets_called': False,
            'check_call_gets_called': True
        }
        def mock_call(unused_cmd_tokens):
            return 0
        def mock_check_call(unused_cmd_tokens):
            check_function_calls['check_call_gets_called'] = True
        def mock_input():
            check_function_calls['input_gets_called'] = True
        call_swap = self.swap(subprocess, 'call', mock_call)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        with call_swap, check_call_swap, input_swap:
            common.open_new_tab_in_browser_if_possible('test-url')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_open_new_tab_in_browser_if_possible_with_url_not_opening_correctly(
            self):
        check_function_calls = {
            'input_gets_called': False,
            'check_call_gets_called': False
        }
        expected_check_function_calls = {
            'input_gets_called': True,
            'check_call_gets_called': False
        }
        def mock_call(unused_cmd_tokens):
            return 1
        def mock_check_call(unused_cmd_tokens):
            check_function_calls['check_call_gets_called'] = True
        def mock_input():
            check_function_calls['input_gets_called'] = True
        call_swap = self.swap(subprocess, 'call', mock_call)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        with call_swap, check_call_swap, input_swap:
            common.open_new_tab_in_browser_if_possible('test-url')
        self.assertEqual(check_function_calls, expected_check_function_calls)

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

    def test_ensure_release_scripts_folder_exists_with_invalid_access(self):
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        def mock_isdir(unused_dirpath):
            return False
        def mock_chdir(unused_dirpath):
            pass
        # pylint: disable=unused-argument
        def mock_popen(unused_cmd, stdin, stdout, stderr):
            return process
        # pylint: enable=unused-argument
        def mock_communicate(unused_self):
            return ('Output', 'Invalid')
        isdir_swap = self.swap(os.path, 'isdir', mock_isdir)
        chdir_swap = self.swap(os, 'chdir', mock_chdir)
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate)
        with isdir_swap, chdir_swap, popen_swap, communicate_swap:
            with self.assertRaisesRegexp(
                Exception, (
                    'You need SSH access to GitHub. See the '
                    '"Check your SSH access" section here and follow the '
                    'instructions: '
                    'https://help.github.com/articles/'
                    'error-repository-not-found/#check-your-ssh-access')):
                common.ensure_release_scripts_folder_exists_and_is_up_to_date()

    def test_ensure_release_scripts_folder_exists_with_valid_access(self):
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        def mock_isdir(unused_dirpath):
            return False
        def mock_chdir(unused_dirpath):
            pass
        # pylint: disable=unused-argument
        def mock_popen(unused_cmd, stdin, stdout, stderr):
            return process
        # pylint: enable=unused-argument
        def mock_communicate(unused_self):
            return ('Output', 'You\'ve successfully authenticated!')
        def mock_check_call(unused_cmd_tokens):
            pass
        def mock_verify_local_repo_is_clean():
            pass
        def mock_verify_current_branch_name(unused_branch_name):
            pass
        def mock_get_remote_alias(unused_url):
            return 'remote'
        isdir_swap = self.swap(os.path, 'isdir', mock_isdir)
        chdir_swap = self.swap(os, 'chdir', mock_chdir)
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate)
        check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)
        verify_local_repo_swap = self.swap(
            common, 'verify_local_repo_is_clean',
            mock_verify_local_repo_is_clean)
        verify_current_branch_name_swap = self.swap(
            common, 'verify_current_branch_name',
            mock_verify_current_branch_name)
        get_remote_alias_swap = self.swap(
            common, 'get_remote_alias', mock_get_remote_alias)
        with isdir_swap, chdir_swap, popen_swap, communicate_swap:
            with check_call_swap, verify_local_repo_swap:
                with verify_current_branch_name_swap, get_remote_alias_swap:
                    (
                        common
                        .ensure_release_scripts_folder_exists_and_is_up_to_date(
                            ))

    def test_is_port_open(self):
        self.assertFalse(common.is_port_open(4444))

        handler = http.server.SimpleHTTPRequestHandler
        httpd = socketserver.TCPServer(('', 4444), handler)

        self.assertTrue(common.is_port_open(4444))
        httpd.server_close()

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
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return 'token'
        # pylint: enable=unused-argument
        with self.swap(getpass, 'getpass', mock_getpass):
            self.assertEqual(common.get_personal_access_token(), 'token')

    def test_get_personal_access_token_with_token_as_none(self):
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return None
        # pylint: enable=unused-argument
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
        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'state': 'closed'}, completed='')
        # pylint: enable=unused-argument
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
        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'open_issues': 10, 'state': 'open'}, completed='')
        # pylint: enable=unused-argument
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
        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'open_issues': 0, 'state': 'open'}, completed='')
        # pylint: enable=unused-argument
        with self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone):
            common.check_blocking_bug_issue_count(mock_repo)

    def test_check_prs_for_current_release_are_released_with_no_unreleased_prs(
            self):
        mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': release_constants.LABEL_FOR_RELEASED_PRS},
                    {'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS}]},
            completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': release_constants.LABEL_FOR_RELEASED_PRS},
                    {'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS}]},
            completed='')
        label = github.Label.Label(
            requester='', headers='',
            attributes={
                'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS},
            completed='')
        # pylint: disable=unused-argument
        def mock_get_issues(unused_self, state, labels):
            return [pull1, pull2]
        # pylint: enable=unused-argument
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
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS}]},
            completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': release_constants.LABEL_FOR_RELEASED_PRS},
                    {'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS}]},
            completed='')
        label = github.Label.Label(
            requester='', headers='',
            attributes={
                'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS},
            completed='')
        # pylint: disable=unused-argument
        def mock_get_issues(unused_self, state, labels):
            return [pull1, pull2]
        # pylint: enable=unused-argument
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
                        release_constants.LABEL_FOR_RELEASED_PRS)):
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
            raise ValueError

        compile_swap = self.swap_with_checks(re, 'compile', mock_compile)
        with self.assertRaises(ValueError), compile_swap:
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
