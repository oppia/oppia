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

import datetime
import os
import sys

from core.tests import test_utils

import python_utils

from . import common
from . import initial_release_prep

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYGSHEETS_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pygsheets-2.0.2')
sys.path.insert(0, _PYGSHEETS_PATH)

# pylint: disable=wrong-import-position
import pygsheets # isort:skip
# pylint: enable=wrong-import-position


class InitialReleasePrepTests(test_utils.GenericTestBase):
    """Test the methods for intial release preparation."""

    def test_get_job_details_for_current_release(self):
        short_current_month_name = datetime.datetime.utcnow().strftime('%h')
        full_current_month_name = datetime.datetime.utcnow().strftime('%B')
        job_details = [{
            'Timestamp': '11/7/2019 12:31:32',
            'Email Address': 'bob@email.com',
            'What is your name?': 'Bob',
            'Select the job you want to test': 'Job1',
            (
                'Which upcoming release are you '
                'targeting this job for?'): short_current_month_name,
            'Instructions': 'Instructions for job 1',
            '(Optional) Anything else you\'d like to tell us?': 'No'
        }, {
            'Timestamp': '11/8/2019 12:31:32',
            'Email Address': 'alice@email.com',
            'What is your name?': 'Alice',
            'Select the job you want to test': 'Job2',
            (
                'Which upcoming release are you '
                'targeting this job for?'): full_current_month_name,
            'Instructions': 'Instructions for job 2',
            '(Optional) Anything else you\'d like to tell us?': 'Test-job'
        }, {
            'Timestamp': '11/9/2019 12:31:32',
            'Email Address': 'paul@email.com',
            'What is your name?': 'Paul',
            'Select the job you want to test': 'Job3',
            (
                'Which upcoming release are you '
                'targeting this job for?'): 'Random month',
            'Instructions': 'Instructions for job 3',
            '(Optional) Anything else you\'d like to tell us?': 'No'
        }]
        expected_job_details = [{
            'job_name': 'Job1',
            'author_email': 'bob@email.com',
            'author_name': 'Bob',
            'instruction_doc': 'Instructions for job 1'
        }, {
            'job_name': 'Job2',
            'author_email': 'alice@email.com',
            'author_name': 'Alice',
            'instruction_doc': 'Instructions for job 2'
        }]
        self.assertEqual(
            initial_release_prep.get_job_details_for_current_release(
                job_details, 'Select the job you want to test',
                'Which upcoming release are you targeting this job for?',
                'Email Address', 'What is your name?', 'Instructions'),
            expected_job_details)

    def test_get_mail_message_template(self):
        job_details = [{
            'job_name': 'Job1',
            'author_email': 'bob@email.com',
            'author_name': 'Bob',
            'instruction_doc': 'Instructions for job 1'
        }, {
            'job_name': 'Job2',
            'author_email': 'alice@email.com',
            'author_name': 'Alice',
            'instruction_doc': 'Instructions for job 2'
        }]
        expected_mail_message_template = (
            'Hi Sean,\n\n'
            'You will need to run these jobs on the backup server:\n\n'
            'Job1 (Instructions: Instructions for job 1) (Author: Bob)\n'
            'Job2 (Instructions: Instructions for job 2) (Author: Alice)\n\n'
            'The specific instructions for jobs are linked with them. '
            'The general instructions are as follows:\n\n'
            '1. Login as admin\n'
            '2. Navigate to the admin panel and then the jobs tab\n'
            '3. Run the above jobs\n'
            '4. In case of failure/success, please send the output logs for '
            'the job to me and the job author:\n\n'
            'Thanks!\n')
        self.assertEqual(
            initial_release_prep.get_mail_message_template(job_details),
            expected_mail_message_template)

    def test_exception_is_raised_if_release_journal_is_not_created(self):
        def mock_open_tab(unused_url):
            pass
        def mock_ask_user_to_confirm(unused_msg):
            pass
        def mock_input():
            return 'n'

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)

        with open_tab_swap, ask_user_swap, input_swap:
            with self.assertRaisesRegexp(
                Exception,
                'Please ensure a new doc is created for the '
                'release before starting with the release process.'):
                initial_release_prep.main()

    def test_function_calls(self):
        check_function_calls = {
            'get_all_records_is_called': False,
            'open_is_called': False,
            'close_is_called': False,
            'open_new_tab_in_browser_if_possible_is_called': False,
            'ask_user_to_confirm_is_called': False,
            'get_job_details_for_current_release_is_called': False,
            'get_mail_message_template_is_called': False,
            'open_file_is_called': False,
            'authorize_is_called': False,
            'isfile_is_called': False,
            'remove_is_called': False
        }
        expected_check_function_calls = {
            'get_all_records_is_called': True,
            'open_is_called': True,
            'close_is_called': True,
            'open_new_tab_in_browser_if_possible_is_called': True,
            'ask_user_to_confirm_is_called': True,
            'get_job_details_for_current_release_is_called': True,
            'get_mail_message_template_is_called': True,
            'open_file_is_called': True,
            'authorize_is_called': True,
            'isfile_is_called': True,
            'remove_is_called': True
        }
        class MockWorksheet(python_utils.OBJECT):
            def get_all_records(self):
                """Mock function for obtaining all records in a sheet."""
                check_function_calls['get_all_records_is_called'] = True
                return ['Record1', 'Record2']
        class MockClient(python_utils.OBJECT):
            def __init__(self):
                self.sheet1 = MockWorksheet()
            def open(self, unused_sheet_name):
                """Mock function for opening a worksheet."""
                check_function_calls['open_is_called'] = True
                return self
        class MockFile(python_utils.OBJECT):
            def close(self):
                """Mock function to close a file."""
                check_function_calls['close_is_called'] = True

        def mock_open_tab(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_is_called'] = True
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_is_called'] = True
        def mock_input():
            return 'y'
        def mock_get_job_details_for_current_release(
                unused_job_details, unused_job_name_header,
                unused_month_header, unused_author_email_header,
                unused_author_name_header, unused_instruction_doc_header):
            check_function_calls[
                'get_job_details_for_current_release_is_called'] = True
            return [{
                'job_name': 'Job1',
                'author_email': 'bob@email.com',
                'author_name': 'Bob',
                'instruction_doc': 'Instructions for job 1'
            }]
        def mock_get_mail_message_template(unused_job_details):
            check_function_calls['get_mail_message_template_is_called'] = True
            return 'Mail message for testing.'
        def mock_open_file(unused_file_path, unused_mode):
            check_function_calls['open_file_is_called'] = True
            return MockFile()
        # pylint: disable=unused-argument
        def mock_authorize(client_secret):
            check_function_calls['authorize_is_called'] = True
            return MockClient()
        # pylint: enable=unused-argument
        def mock_isfile(unused_filepath):
            check_function_calls['isfile_is_called'] = True
            return True
        def mock_remove(unused_filepath):
            check_function_calls['remove_is_called'] = True

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        job_details_swap = self.swap(
            initial_release_prep, 'get_job_details_for_current_release',
            mock_get_job_details_for_current_release)
        mail_msg_swap = self.swap(
            initial_release_prep, 'get_mail_message_template',
            mock_get_mail_message_template)
        open_file_swap = self.swap(python_utils, 'open_file', mock_open_file)
        authorize_swap = self.swap(pygsheets, 'authorize', mock_authorize)
        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        remove_swap = self.swap(os, 'remove', mock_remove)

        with open_tab_swap, ask_user_swap, input_swap, job_details_swap:
            with mail_msg_swap, open_file_swap, authorize_swap, isfile_swap:
                with remove_swap:
                    initial_release_prep.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)
