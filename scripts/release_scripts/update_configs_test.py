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

"""Unit tests for scripts/update_configs.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import getpass
import os
import sys
import tempfile

from core.tests import test_utils
import python_utils
from scripts import common
from scripts.release_scripts import update_configs

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

INVALID_FECONF_CONFIG_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'invalid_feconf_updates.config')
VALID_FECONF_CONFIG_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'valid_feconf_updates.config')
FECONF_CONFIG_PATH_WITH_EXTRA_LINE = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'feconf_updates_with_extra_line.config')
MOCK_LOCAL_FECONF_PATH = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'feconf.txt')


class UpdateConfigsTests(test_utils.GenericTestBase):
    """Test the methods for updating configs."""

    def setUp(self):
        super(UpdateConfigsTests, self).setUp()
        self.mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_get_current_branch_name():
            return 'release-1.2.3'
        def mock_release_scripts_exist():
            pass
        def mock_get_organization(unused_self, unused_name):
            return github.Organization.Organization(
                requester='', headers='', attributes={}, completed='')
        def mock_get_repo(unused_self, unused_org):
            return self.mock_repo
        def mock_open_tab(unused_url):
            pass
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return 'test-token'
        # pylint: enable=unused-argument
        def mock_url_open(unused_url):
            pass

        self.release_scripts_exist_swap = self.swap(
            common, 'ensure_release_scripts_folder_exists_and_is_up_to_date',
            mock_release_scripts_exist)
        self.branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        self.get_org_swap = self.swap(
            github.Github, 'get_organization', mock_get_organization)
        self.get_repo_swap = self.swap(
            github.Organization.Organization, 'get_repo', mock_get_repo)
        self.open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        self.getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        self.feconf_swap = self.swap(
            update_configs, 'LOCAL_FECONF_PATH',
            MOCK_LOCAL_FECONF_PATH)
        self.url_open_swap = self.swap(python_utils, 'url_open', mock_url_open)

    def test_invalid_branch_name(self):
        def mock_get_current_branch_name():
            return 'invalid'
        branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with branch_name_swap, self.assertRaises(AssertionError):
            update_configs.main('test-token')

    def test_missing_terms_page(self):
        def mock_url_open(unused_url):
            raise Exception('Not found.')
        url_open_swap = self.swap(python_utils, 'url_open', mock_url_open)
        with self.branch_name_swap, self.release_scripts_exist_swap:
            with url_open_swap, self.assertRaisesRegexp(
                Exception, 'Terms mainpage does not exist on Github.'):
                update_configs.main('test-token')

    def test_invalid_user_input(self):
        print_msgs = []
        def mock_input():
            if print_msgs:
                return 'n'
            else:
                return 'invalid'
        def mock_print(msg):
            if 'Invalid Input' in msg:
                print_msgs.append(msg)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        print_swap = self.swap(python_utils, 'PRINT', mock_print)
        with self.getpass_swap, self.get_org_swap, self.get_repo_swap:
            with self.open_tab_swap, input_swap, print_swap:
                update_configs.check_updates_to_terms_of_service('test-token')
        self.assertEqual(
            print_msgs, ['Invalid Input: invalid. Please enter yes or no.'])

    def test_update_to_registration_updated_date(self):
        def mock_input():
            return 'y'
        def mock_get_commit(unused_self, unused_sha):
            return github.Commit.Commit(
                requester='', headers='',
                attributes={
                    'commit': {'committer': {'date': '2016-11-15T3:41:01Z'}}},
                completed='')
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        get_commit_swap = self.swap(
            github.Repository.Repository, 'get_commit', mock_get_commit)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'%Y-%m-%d\'\n')
        expected_feconf_text = feconf_text.replace(
            'datetime.datetime(2015, 10, 14, 2, 40, 0)',
            'datetime.datetime(2016, 11, 15, 3, 41, 1)')
        with python_utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        feconf_swap = self.swap(
            update_configs, 'LOCAL_FECONF_PATH', temp_feconf_path)
        with self.getpass_swap, self.get_org_swap, self.get_repo_swap:
            with self.open_tab_swap, input_swap, feconf_swap, get_commit_swap:
                update_configs.check_updates_to_terms_of_service('test-token')
        with python_utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_invalid_mailgun_api_key(self):
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return 'invalid'
        # pylint: enable=unused-argument
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with getpass_swap, self.assertRaisesRegexp(
            Exception, 'Invalid mailgun api key.'):
            update_configs.add_mailgun_api_key()

    def test_missing_mailgun_api_key_line(self):
        # pylint: disable=unused-argument
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        def mock_getpass(prompt):
            return mailgun_api_key
        # pylint: enable=unused-argument
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'%Y-%m-%d\'\n')
        with python_utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        feconf_swap = self.swap(
            update_configs, 'LOCAL_FECONF_PATH', temp_feconf_path)
        with getpass_swap, feconf_swap, self.assertRaises(AssertionError):
            update_configs.add_mailgun_api_key()

    def test_addition_of_mailgun_api_key(self):
        # pylint: disable=unused-argument
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        def mock_getpass(prompt):
            return mailgun_api_key
        # pylint: enable=unused-argument
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'MAILGUN_API_KEY = None\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n')
        expected_feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailgun_api_key))
        with python_utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        feconf_swap = self.swap(
            update_configs, 'LOCAL_FECONF_PATH', temp_feconf_path)
        with getpass_swap, feconf_swap:
            update_configs.add_mailgun_api_key()
        with python_utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_invalid_config(self):
        config_swap = self.swap(
            update_configs, 'FECONF_CONFIG_PATH', INVALID_FECONF_CONFIG_PATH)
        with self.feconf_swap, config_swap, self.assertRaisesRegexp(
            Exception,
            'Invalid line in invalid_feconf_updates.config '
            'config file: INVALID_KEY: \'invalid\''):
            update_configs.apply_changes_based_on_config(
                update_configs.LOCAL_FECONF_PATH,
                update_configs.FECONF_CONFIG_PATH, update_configs.FECONF_REGEX)

    def test_missing_line_in_local_config(self):
        config_swap = self.swap(
            update_configs, 'FECONF_CONFIG_PATH',
            FECONF_CONFIG_PATH_WITH_EXTRA_LINE)
        with self.feconf_swap, config_swap, self.assertRaisesRegexp(
            Exception,
            'Could not find correct number of lines in '
            'feconf.txt matching: EXTRA_KEY = \'extra\''):
            update_configs.apply_changes_based_on_config(
                update_configs.LOCAL_FECONF_PATH,
                update_configs.FECONF_CONFIG_PATH, update_configs.FECONF_REGEX)

    def test_changes_are_applied_to_config(self):
        config_swap = self.swap(
            update_configs, 'FECONF_CONFIG_PATH', VALID_FECONF_CONFIG_PATH)
        with python_utils.open_file(MOCK_LOCAL_FECONF_PATH, 'r') as f:
            original_text = f.read()
        expected_text = original_text.replace(
            'INCOMING_EMAILS_DOMAIN_NAME = \'\'',
            'INCOMING_EMAILS_DOMAIN_NAME = \'oppia.org\'')
        try:
            with self.feconf_swap, config_swap:
                update_configs.apply_changes_based_on_config(
                    update_configs.LOCAL_FECONF_PATH,
                    update_configs.FECONF_CONFIG_PATH,
                    update_configs.FECONF_REGEX)
            with python_utils.open_file(MOCK_LOCAL_FECONF_PATH, 'r') as f:
                self.assertEqual(f.read(), expected_text)
        finally:
            with python_utils.open_file(MOCK_LOCAL_FECONF_PATH, 'w') as f:
                f.write(original_text)

    def test_checkout_is_run_in_case_of_exception(self):
        check_function_calls = {
            'check_updates_to_terms_of_service_gets_called': False,
            'run_cmd_gets_called': False
        }
        expected_check_function_calls = {
            'check_updates_to_terms_of_service_gets_called': True,
            'run_cmd_gets_called': True
        }
        def mock_check_updates(unused_personal_access_token):
            check_function_calls[
                'check_updates_to_terms_of_service_gets_called'] = True
            raise Exception('Testing')
        def mock_run_cmd(unused_cmd_tokens):
            check_function_calls['run_cmd_gets_called'] = True
        check_updates_swap = self.swap(
            update_configs, 'check_updates_to_terms_of_service',
            mock_check_updates)
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        with self.branch_name_swap, self.release_scripts_exist_swap:
            with self.url_open_swap, check_updates_swap, run_cmd_swap:
                with self.assertRaisesRegexp(Exception, 'Testing'):
                    update_configs.main('test-token')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls(self):
        check_function_calls = {
            'check_updates_to_terms_of_service_gets_called': False,
            'add_mailgun_api_key_gets_called': False,
            'apply_changes_based_on_config_gets_called': False,
            'ask_user_to_confirm_gets_called': False
        }
        expected_check_function_calls = {
            'check_updates_to_terms_of_service_gets_called': True,
            'add_mailgun_api_key_gets_called': True,
            'apply_changes_based_on_config_gets_called': True,
            'ask_user_to_confirm_gets_called': True
        }
        def mock_check_updates(unused_personal_access_token):
            check_function_calls[
                'check_updates_to_terms_of_service_gets_called'] = True
        def mock_add_mailgun_api_key():
            check_function_calls['add_mailgun_api_key_gets_called'] = True
        def mock_apply_changes(
                unused_local_filepath, unused_config_filepath,
                unused_expected_config_line_regex):
            check_function_calls[
                'apply_changes_based_on_config_gets_called'] = True
        def mock_ask_user_to_confirm(unused_msg):
            check_function_calls['ask_user_to_confirm_gets_called'] = True

        check_updates_swap = self.swap(
            update_configs, 'check_updates_to_terms_of_service',
            mock_check_updates)
        add_mailgun_api_key_swap = self.swap(
            update_configs, 'add_mailgun_api_key', mock_add_mailgun_api_key)
        apply_changes_swap = self.swap(
            update_configs, 'apply_changes_based_on_config', mock_apply_changes)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        with self.branch_name_swap, self.release_scripts_exist_swap:
            with self.url_open_swap, check_updates_swap, ask_user_swap:
                with add_mailgun_api_key_swap, apply_changes_swap:
                    update_configs.main('test-token')
        self.assertEqual(check_function_calls, expected_check_function_calls)
