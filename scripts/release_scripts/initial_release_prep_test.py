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

"""Unit tests for scripts/initial_release_prep.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import subprocess

import constants
from core.tests import test_utils
import python_utils
from scripts import common
from scripts.release_scripts import initial_release_prep


class InitialReleasePrepTests(test_utils.GenericTestBase):
    """Test the methods for intial release preparation."""
    def test_get_mail_message_template(self):
        expected_mail_message_template = (
            'Hi Sean,\n\n'
            'You will need to run these jobs on the backup server:\n\n'
            '[List of jobs formatted as: {{Job Name}} (instructions: '
            '{{Instruction doc url}}) (Author: {{Author Name}})]\n'
            'The specific instructions for jobs are linked with them. '
            'The general instructions are as follows:\n\n'
            '1. Login as admin\n'
            '2. Navigate to the admin panel and then the jobs tab\n'
            '3. Run the above jobs\n'
            '4. In case of failure/success, please send the output logs for '
            'the job to me and the job authors: {{Author names}}\n\n'
            'Thanks!\n')
        self.assertEqual(
            initial_release_prep.get_mail_message_template(),
            expected_mail_message_template)

    def test_exception_is_raised_if_release_journal_is_not_created(self):
        def mock_open_tab(unused_url):
            pass
        def mock_ask_user_to_confirm(unused_msg):
            pass
        def mock_input():
            return 'n'
        def mock_verify_current_branch_name(unused_branch_name):
            pass

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        branch_check_swap = self.swap(
            common, 'verify_current_branch_name',
            mock_verify_current_branch_name)

        with open_tab_swap, ask_user_swap, input_swap, branch_check_swap:
            with self.assertRaisesRegexp(
                Exception,
                'Please ensure a new doc is created for the '
                'release before starting with the release process.'):
                initial_release_prep.main()

    def test_get_extra_jobs_due_to_schema_changes(self):
        def mock_run_cmd(unused_cmd_tokens):
            return (
                '"diff --git a/feconf.py b/feconf.py\n'
                '--- a/feconf.py\n+++ b/feconf.py\n'
                '@@ -36,6 +36,10 @@ POST_COMMIT_STATUS_PRIVATE = \'private\'\n'
                ' # Whether to unconditionally log info messages.\n'
                ' DEBUG = False\n \n'
                '+# The path for generating release_summary.md '
                'file for the current release.\n'
                '-CURRENT_MISCONCEPTIONS_SCHEMA_VERSION = 2\n'
                '+CURRENT_MISCONCEPTIONS_SCHEMA_VERSION = 1\n')
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)

        with run_cmd_swap:
            self.assertEqual(
                initial_release_prep.get_extra_jobs_due_to_schema_changes(
                    'upstream', '1.2.3'), ['SkillMigrationOneOffJob'])

    def test_did_supported_audio_languages_change_with_change_in_languages(
            self):
        all_cmd_tokens = []
        mock_constants = {
            'SUPPORTED_AUDIO_LANGUAGES': [{
                'id': 'en',
                'description': 'English',
                'relatedLanguages': ['en']}]}
        def mock_run_cmd(cmd_tokens):
            mock_constants['SUPPORTED_AUDIO_LANGUAGES'].append({
                'id': 'ak',
                'description': 'Akan',
                'relatedLanguages': ['ak']
            })
            all_cmd_tokens.append(cmd_tokens)

        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        constants_swap = self.swap(constants, 'constants', mock_constants)

        with run_cmd_swap, constants_swap:
            self.assertTrue(
                initial_release_prep.did_supported_audio_languages_change(
                    'upstream', '1.2.3'))
        self.assertEqual(
            all_cmd_tokens, [
                [
                    'git', 'checkout', 'upstream/release-1.2.3',
                    '--', 'assets/constants.ts'],
                ['git', 'reset', 'assets/constants.ts'],
                ['git', 'checkout', '--', 'assets/constants.ts']])

    def test_did_supported_audio_languages_change_without_change_in_languages(
            self):
        all_cmd_tokens = []
        mock_constants = {
            'SUPPORTED_AUDIO_LANGUAGES': [{
                'id': 'en',
                'description': 'English',
                'relatedLanguages': ['en']}]}
        def mock_run_cmd(cmd_tokens):
            all_cmd_tokens.append(cmd_tokens)

        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        constants_swap = self.swap(constants, 'constants', mock_constants)

        with run_cmd_swap, constants_swap:
            self.assertFalse(
                initial_release_prep.did_supported_audio_languages_change(
                    'upstream', '1.2.3'))
        self.assertEqual(
            all_cmd_tokens, [
                [
                    'git', 'checkout', 'upstream/release-1.2.3',
                    '--', 'assets/constants.ts'],
                ['git', 'reset', 'assets/constants.ts'],
                ['git', 'checkout', '--', 'assets/constants.ts']])

    def test_cut_release_branch_with_correct_version(self):
        check_function_calls = {
            'open_new_tab_in_browser_if_possible_is_called': False,
            'check_call_is_called': False
        }
        expected_check_function_calls = {
            'open_new_tab_in_browser_if_possible_is_called': True,
            'check_call_is_called': True
        }
        def mock_open_tab(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_is_called'] = True
        def mock_check_call(unused_cmd_tokens):
            check_function_calls['check_call_is_called'] = True
        def mock_input():
            return '1.2.3'

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_tab)
        check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)
        input_swap = self.swap(
            python_utils, 'INPUT', mock_input)
        with open_tab_swap, check_call_swap, input_swap:
            initial_release_prep.cut_release_branch()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_cut_release_branch_with_incorrect_version(self):
        check_function_calls = {
            'open_new_tab_in_browser_if_possible_is_called': False,
            'check_call_is_called': False
        }
        expected_check_function_calls = {
            'open_new_tab_in_browser_if_possible_is_called': True,
            'check_call_is_called': False
        }
        def mock_open_tab(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_is_called'] = True
        def mock_check_call(unused_cmd_tokens):
            check_function_calls['check_call_is_called'] = True
        def mock_input():
            return 'invalid'

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_tab)
        check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)
        input_swap = self.swap(
            python_utils, 'INPUT', mock_input)
        with open_tab_swap, check_call_swap, input_swap:
            with self.assertRaises(AssertionError):
                initial_release_prep.cut_release_branch()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls(self):
        check_function_calls = {
            'open_new_tab_in_browser_if_possible_is_called': False,
            'ask_user_to_confirm_is_called': False,
            'get_mail_message_template_is_called': False,
            'get_extra_jobs_due_to_schema_changes_is_called': False,
            'did_supported_audio_languages_change_is_called': False,
            'get_remote_alias_is_called': False,
            'verify_current_branch_name_is_called': False,
            'cut_release_branch_is_called': False
        }
        expected_check_function_calls = {
            'open_new_tab_in_browser_if_possible_is_called': True,
            'ask_user_to_confirm_is_called': True,
            'get_mail_message_template_is_called': True,
            'get_extra_jobs_due_to_schema_changes_is_called': True,
            'did_supported_audio_languages_change_is_called': True,
            'get_remote_alias_is_called': True,
            'verify_current_branch_name_is_called': True,
            'cut_release_branch_is_called': True
        }
        def mock_open_tab(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_is_called'] = True
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_is_called'] = True
        print_arr = []
        def mock_input():
            if print_arr[-1] == 'Enter version of previous release.':
                return '1.2.3'
            return 'y'
        def mock_print(msg):
            print_arr.append(msg)
        def mock_get_mail_message_template():
            check_function_calls['get_mail_message_template_is_called'] = True
            return 'Mail message for testing.'
        def mock_get_extra_jobs_due_to_schema_changes(
                unused_remote_alias, unused_previous_release_version):
            check_function_calls[
                'get_extra_jobs_due_to_schema_changes_is_called'] = True
            return []
        def mock_did_supported_audio_languages_change(
                unused_remote_alias, unused_previous_release_version):
            check_function_calls[
                'did_supported_audio_languages_change_is_called'] = True
            return True
        def mock_get_remote_alias(unused_remote_url):
            check_function_calls['get_remote_alias_is_called'] = True
        def mock_verify_current_branch_name(unused_branch_name):
            check_function_calls['verify_current_branch_name_is_called'] = True
        def mock_cut_release_branch():
            check_function_calls['cut_release_branch_is_called'] = True

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        print_swap = self.swap(python_utils, 'PRINT', mock_print)
        mail_msg_swap = self.swap(
            initial_release_prep, 'get_mail_message_template',
            mock_get_mail_message_template)
        get_extra_jobs_swap = self.swap(
            initial_release_prep, 'get_extra_jobs_due_to_schema_changes',
            mock_get_extra_jobs_due_to_schema_changes)
        check_changes_swap = self.swap(
            initial_release_prep, 'did_supported_audio_languages_change',
            mock_did_supported_audio_languages_change)
        get_alias_swap = self.swap(
            common, 'get_remote_alias', mock_get_remote_alias)
        branch_check_swap = self.swap(
            common, 'verify_current_branch_name',
            mock_verify_current_branch_name)
        cut_branch_swap = self.swap(
            initial_release_prep, 'cut_release_branch',
            mock_cut_release_branch)

        with open_tab_swap, ask_user_swap, input_swap, print_swap:
            with mail_msg_swap, get_alias_swap, check_changes_swap:
                with get_extra_jobs_swap, branch_check_swap, cut_branch_swap:
                    initial_release_prep.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)
