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
import tempfile

from core.tests import test_utils
import python_utils
import release_constants
from scripts import common
from scripts.release_scripts import generate_release_updates

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')

MOCK_RELEASE_SUMMARY_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'release_summary.md')
INVALID_RELEASE_MAIL_MESSAGE_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'invalid_release_mail_message.txt')
VALID_RELEASE_MAIL_MESSAGE_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'valid_release_mail_message.txt')
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

    def test_create_new_file_with_release_message_template(self):
        temp_mail_file = tempfile.NamedTemporaryFile().name
        mail_file_swap = self.swap(
            generate_release_updates,
            'RELEASE_MAIL_MESSAGE_FILEPATH', temp_mail_file)
        with self.branch_name_swap, self.input_swap, mail_file_swap:
            (
                generate_release_updates
                .create_new_file_with_release_message_template())
            with python_utils.open_file(temp_mail_file, 'r') as f:
                self.assertEqual(
                    f.read(),
                    generate_release_updates.RELEASE_MAIL_MESSAGE_TEMPLATE % (
                        tuple(['1.2.3'] + (
                            generate_release_updates.SECTIONS_TO_ADD))))

    def test_validate_release_message_with_valid_message(self):
        check_function_calls = {
            'ask_user_to_confirm_gets_called': False
        }
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_gets_called'] = True

        mail_file_swap = self.swap(
            generate_release_updates, 'RELEASE_MAIL_MESSAGE_FILEPATH',
            VALID_RELEASE_MAIL_MESSAGE_FILEPATH)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        with mail_file_swap, ask_user_swap:
            generate_release_updates.validate_release_message()
        self.assertFalse(
            check_function_calls['ask_user_to_confirm_gets_called'])

    def test_validate_release_message_with_invalid_message(self):
        check_function_calls = {
            'ask_user_to_confirm_gets_called': 0,
            'read_gets_called': 0
        }
        expected_check_function_calls = {
            'ask_user_to_confirm_gets_called': 2,
            'read_gets_called': 2
        }

        def mock_open_file(unused_path, unused_mode):
            return MockFile()
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_gets_called'] += 1

        with python_utils.open_file(
            VALID_RELEASE_MAIL_MESSAGE_FILEPATH, 'r') as f:
            correct_content = f.read()
        with python_utils.open_file(
            INVALID_RELEASE_MAIL_MESSAGE_FILEPATH, 'r') as f:
            wrong_content = f.read()

        class MockFile(python_utils.OBJECT):
            def read(self):
                """Read content of the file object."""
                return mock_read()
        def mock_read():
            check_function_calls['read_gets_called'] += 1
            if check_function_calls['read_gets_called'] == 2:
                return correct_content
            return wrong_content

        open_file_swap = self.swap(python_utils, 'open_file', mock_open_file)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)

        with open_file_swap, ask_user_swap:
            generate_release_updates.validate_release_message()
        self.assertEqual(check_function_calls, expected_check_function_calls)

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
            'create_new_file_with_release_message_template_gets_called': False,
            'validate_release_message_gets_called': False,
            'prompt_user_to_send_announcement_email_gets_called': False,
            'prepare_for_next_release_gets_called': False,
        }
        expected_check_function_calls = {
            'create_new_file_with_release_message_template_gets_called': True,
            'validate_release_message_gets_called': True,
            'prompt_user_to_send_announcement_email_gets_called': True,
            'prepare_for_next_release_gets_called': True,
        }
        def mock_create_new_file_with_release_message_template():
            check_function_calls[
                'create_new_file_with_release_message_template_gets_called'
                ] = True
        def mock_validate_release_message():
            check_function_calls['validate_release_message_gets_called'] = True
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
        write_swap = self.swap(
            generate_release_updates,
            'create_new_file_with_release_message_template',
            mock_create_new_file_with_release_message_template)
        check_swap = self.swap(
            generate_release_updates, 'validate_release_message',
            mock_validate_release_message)
        send_swap = self.swap(
            generate_release_updates, 'prompt_user_to_send_announcement_email',
            mock_prompt_user_to_send_announcement_email)
        prepare_swap = self.swap(
            generate_release_updates, 'prepare_for_next_release',
            mock_prepare_for_next_release)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        remove_swap = self.swap(os, 'remove', mock_remove)

        with self.branch_name_swap, release_summary_swap, prepare_swap:
            with write_swap, check_swap, send_swap, exists_swap, remove_swap:
                generate_release_updates.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
