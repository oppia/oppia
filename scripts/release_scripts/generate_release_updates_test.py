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

"""Unit tests for scripts/release_scripts/generate_release_updates.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess

from core.tests import test_utils
import python_utils
import release_constants
from scripts import common
from scripts.release_scripts import generate_release_updates

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')

MOCK_RELEASE_SUMMARY_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'release_summary.md')
MOCK_RELEASE_SUMMARY_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'release_summary.md')


class GenerateReleaseUpdatesTests(test_utils.GenericTestBase):
    """Test the methods for generating release updates."""

    def setUp(self):
        super(GenerateReleaseUpdatesTests, self).setUp()
        def mock_get_current_branch_name():
            return 'release-1.2.3'
        def mock_input():
            return 'y'
        self.branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        self.input_swap = self.swap(
            python_utils, 'INPUT', mock_input)

    def test_draft_new_release(self):
        check_function_calls = {
            'check_call_gets_called': False,
            'ask_user_to_confirm_gets_called': False,
            'open_new_tab_in_browser_if_possible_gets_called': False
        }
        expected_check_function_calls = {
            'check_call_gets_called': True,
            'ask_user_to_confirm_gets_called': True,
            'open_new_tab_in_browser_if_possible_gets_called': True
        }

        all_cmd_tokens = []
        def mock_check_call(cmd_tokens):
            all_cmd_tokens.extend(cmd_tokens)
            check_function_calls['check_call_gets_called'] = True
        def mock_open_new_tab_in_browser_if_possible(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_gets_called'] = True
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_gets_called'] = True
        def mock_get_remote_alias(unused_remote_url):
            return 'upstream'

        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_new_tab_in_browser_if_possible)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        get_remote_alias_swap = self.swap(
            common, 'get_remote_alias', mock_get_remote_alias)
        with self.branch_name_swap, check_call_swap, open_tab_swap:
            with ask_user_swap, get_remote_alias_swap:
                generate_release_updates.draft_new_release()
        self.assertEqual(check_function_calls, expected_check_function_calls)

        expected_cmd_tokens = [
            'git', 'tag', '-a', 'v1.2.3', '-m', 'Version 1.2.3',
            'git', 'push', 'upstream', 'v1.2.3']
        self.assertEqual(all_cmd_tokens, expected_cmd_tokens)

    def test_prompt_user_to_send_announcement_email(self):
        check_function_calls = {
            'open_new_tab_in_browser_if_possible_gets_called': False,
            'get_new_authors_and_contributors_mail_ids_gets_called': False
        }
        expected_check_function_calls = {
            'open_new_tab_in_browser_if_possible_gets_called': True,
            'get_new_authors_and_contributors_mail_ids_gets_called': True
        }
        def mock_open_new_tab_in_browser_if_possible(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_gets_called'] = True
        def mock_get_new_authors_and_contributors_mail_ids():
            check_function_calls[
                'get_new_authors_and_contributors_mail_ids_gets_called'] = True
            return ['id1@email.com', 'id2@email.com']
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_new_tab_in_browser_if_possible)
        get_new_authors_and_contributors_mail_ids_swap = self.swap(
            generate_release_updates,
            'get_new_authors_and_contributors_mail_ids',
            mock_get_new_authors_and_contributors_mail_ids)
        with self.branch_name_swap, self.input_swap, open_tab_swap:
            with get_new_authors_and_contributors_mail_ids_swap:
                (
                    generate_release_updates
                    .prompt_user_to_send_announcement_email())
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_get_new_authors_and_contributors_mail_ids(self):
        with self.swap(
            release_constants, 'RELEASE_SUMMARY_FILEPATH',
            MOCK_RELEASE_SUMMARY_FILEPATH):
            self.assertEqual(
                (
                    generate_release_updates
                    .get_new_authors_and_contributors_mail_ids()),
                [
                    'alice@gmail.com', 'bob@gmail.com', 'casie@gmail.com',
                    'qunet@outlook.com', 'zoe@gmail.com'])

    def test_invalid_branch_name(self):
        def mock_get_current_branch_name():
            return 'invalid'
        branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with branch_name_swap, self.assertRaisesRegexp(
            Exception, (
                'This script should only be run from the latest release '
                'branch.')):
            generate_release_updates.main()

    def test_missing_release_summary_file(self):
        release_summary_swap = self.swap(
            release_constants, 'RELEASE_SUMMARY_FILEPATH', 'invalid.md')
        with self.branch_name_swap, release_summary_swap:
            with self.assertRaisesRegexp(
                Exception, (
                    'Release summary file invalid.md is missing. Please run '
                    'the release_info.py script and re-run this script.')):
                generate_release_updates.main()

    def test_prepare_for_next_release(self):
        check_function_calls = {
            'open_new_tab_in_browser_if_possible_gets_called': False,
            'ask_user_to_confirm_gets_called': False
        }
        expected_check_function_calls = {
            'open_new_tab_in_browser_if_possible_gets_called': True,
            'ask_user_to_confirm_gets_called': True
        }
        def mock_open_new_tab_in_browser_if_possible(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_gets_called'] = True
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_gets_called'] = True

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_new_tab_in_browser_if_possible)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        with open_tab_swap, ask_user_swap:
            generate_release_updates.prepare_for_next_release()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls(self):
        check_function_calls = {
            'draft_new_release_gets_called': False,
            'prompt_user_to_send_announcement_email_gets_called': False,
            'prepare_for_next_release_gets_called': False,
        }
        expected_check_function_calls = {
            'draft_new_release_gets_called': True,
            'prompt_user_to_send_announcement_email_gets_called': True,
            'prepare_for_next_release_gets_called': True,
        }
        def mock_draft_new_release():
            check_function_calls['draft_new_release_gets_called'] = True
        def mock_prompt_user_to_send_announcement_email():
            check_function_calls[
                'prompt_user_to_send_announcement_email_gets_called'] = True
        def mock_prepare_for_next_release():
            check_function_calls['prepare_for_next_release_gets_called'] = True
        def mock_exists(unused_filepath):
            return True
        def mock_remove(unused_filepath):
            pass

        release_summary_swap = self.swap(
            release_constants, 'RELEASE_SUMMARY_FILEPATH',
            MOCK_RELEASE_SUMMARY_FILEPATH)
        draft_release_swap = self.swap(
            generate_release_updates, 'draft_new_release',
            mock_draft_new_release)
        send_swap = self.swap(
            generate_release_updates, 'prompt_user_to_send_announcement_email',
            mock_prompt_user_to_send_announcement_email)
        prepare_swap = self.swap(
            generate_release_updates, 'prepare_for_next_release',
            mock_prepare_for_next_release)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        remove_swap = self.swap(os, 'remove', mock_remove)

        with self.branch_name_swap, release_summary_swap, prepare_swap:
            with send_swap, exists_swap, remove_swap, draft_release_swap:
                generate_release_updates.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
