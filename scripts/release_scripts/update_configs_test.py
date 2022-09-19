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

"""Unit tests for scripts/release_scripts/update_configs.py."""

from __future__ import annotations

import builtins
import getpass
import os
import tempfile

from core import utils
from core.tests import test_utils
from scripts import common
from scripts.release_scripts import update_configs

import github  # isort:skip pylint: disable=wrong-import-position

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
        super().setUp()
        self.mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_get_organization(unused_self, unused_name):
            return github.Organization.Organization(
                requester='', headers='', attributes={}, completed='')
        def mock_get_repo(unused_self, unused_org):
            return self.mock_repo
        def mock_open_tab(unused_url):
            pass
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return 'test-token'
        def mock_url_open(unused_url):
            pass

        self.get_org_swap = self.swap(
            github.Github, 'get_organization', mock_get_organization)
        self.get_repo_swap = self.swap(
            github.Organization.Organization, 'get_repo', mock_get_repo)
        self.open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        self.getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        self.url_open_swap = self.swap(utils, 'url_open', mock_url_open)

    def test_missing_terms_page(self):
        def mock_url_open(unused_url):
            raise Exception('Not found.')
        url_open_swap = self.swap(utils, 'url_open', mock_url_open)
        with url_open_swap, self.assertRaisesRegex(
            Exception, 'Terms mainpage does not exist on Github.'
        ):
            update_configs.main(
                args=[
                    '--release_dir_path', 'test-release-dir',
                    '--deploy_data_path', 'test-deploy-dir',
                    '--personal_access_token', 'test-token',
                    '--prompt_for_mailgun_and_terms_update'
                ]
            )

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
        input_swap = self.swap(builtins, 'input', mock_input)
        print_swap = self.swap(builtins, 'print', mock_print)
        with self.getpass_swap, self.get_org_swap, self.get_repo_swap:
            with self.open_tab_swap, input_swap, print_swap:
                update_configs.check_updates_to_terms_of_service(
                    MOCK_LOCAL_FECONF_PATH, 'test-token')
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
        input_swap = self.swap(builtins, 'input', mock_input)
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
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with self.getpass_swap, self.get_org_swap, self.get_repo_swap:
            with self.open_tab_swap, input_swap, get_commit_swap:
                update_configs.check_updates_to_terms_of_service(
                    temp_feconf_path, 'test-token')
        with utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_missing_mailgun_api_key_line(self):
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return mailgun_api_key
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'%Y-%m-%d\'\n')
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with getpass_swap, self.assertRaisesRegex(
            AssertionError, 'Missing mailgun API key'):
            update_configs.add_mailgun_api_key(temp_feconf_path)

    def test_missing_mailchimp_api_key_line(self):
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return mailchimp_api_key
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'%Y-%m-%d\'\n')
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with getpass_swap, self.assertRaisesRegex(
            AssertionError, 'Missing mailchimp API key'):
            update_configs.add_mailchimp_api_key(temp_feconf_path)

    def test_invalid_mailgun_api_key(self):
        check_prompts = {
            'Enter mailgun api key from the release process doc.': False,
            'You have entered an invalid mailgun api key: invalid, '
            'please retry.': False
        }
        expected_check_prompts = {
            'Enter mailgun api key from the release process doc.': True,
            'You have entered an invalid mailgun api key: invalid, '
            'please retry.': True
        }
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        def mock_getpass(prompt):
            check_prompts[prompt] = True
            if 'invalid' in prompt:
                return mailgun_api_key
            return 'invalid'
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
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
            'REDISHOST = \'192.13.2.1\'\n'
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
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with getpass_swap:
            update_configs.add_mailgun_api_key(temp_feconf_path)
        self.assertEqual(check_prompts, expected_check_prompts)
        with utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_invalid_mailchimp_api_key(self):
        check_prompts = {
            'Enter mailchimp api key from the release process doc.': False,
            'You have entered an invalid mailchimp api key: invalid, '
            'please retry.': False
        }
        expected_check_prompts = {
            'Enter mailchimp api key from the release process doc.': True,
            'You have entered an invalid mailchimp api key: invalid, '
            'please retry.': True
        }
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        def mock_getpass(prompt):
            check_prompts[prompt] = True
            if 'invalid' in prompt:
                return mailchimp_api_key
            return 'invalid'
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            'MAILGUN_API_KEY = None\n'
            'MAILCHIMP_API_KEY = None\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n')
        expected_feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            'MAILGUN_API_KEY = None\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailchimp_api_key))
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with getpass_swap:
            update_configs.add_mailchimp_api_key(temp_feconf_path)
        self.assertEqual(check_prompts, expected_check_prompts)
        with utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_addition_of_mailgun_api_key(self):
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return mailgun_api_key
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
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
            'REDISHOST = \'192.13.2.1\'\n'
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
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with getpass_swap:
            update_configs.add_mailgun_api_key(temp_feconf_path)
        with utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_addition_of_mailchimp_api_key(self):
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        def mock_getpass(prompt):  # pylint: disable=unused-argument
            return mailchimp_api_key
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        temp_feconf_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            'MAILGUN_API_KEY = None\n'
            'MAILCHIMP_API_KEY = None\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n')
        expected_feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            'MAILGUN_API_KEY = None\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailchimp_api_key))
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)

        with getpass_swap:
            update_configs.add_mailchimp_api_key(temp_feconf_path)
        with utils.open_file(temp_feconf_path, 'r') as f:
            self.assertEqual(f.read(), expected_feconf_text)

    def test_feconf_verification_with_correct_config(self):
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailgun_api_key, mailchimp_api_key))
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        update_configs.verify_config_files(
            temp_feconf_path, temp_app_yaml.name, True)

    def test_feconf_verification_with_mailgun_key_absent(self):
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n')
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        with self.assertRaisesRegex(
            Exception, 'The mailgun API key must be added before deployment.'
        ):
            update_configs.verify_config_files(
                temp_feconf_path, temp_app_yaml.name, True)

    def test_feconf_verification_with_mailchimp_key_absent(self):
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailgun_api_key))
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        with self.assertRaisesRegex(
            Exception, 'The mailchimp API key must be added before deployment'
        ):
            update_configs.verify_config_files(
                temp_feconf_path, temp_app_yaml.name, True)

    def test_feconf_verification_with_key_absent_and_verification_disabled(
        self
    ):
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n')
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        update_configs.verify_config_files(
            temp_feconf_path, temp_app_yaml.name, False)

    def test_feconf_verification_with_redishost_absent(self):
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailgun_api_key, mailchimp_api_key))
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        with self.assertRaisesRegex(
            Exception, 'REDISHOST must be updated before deployment.'
        ):
            update_configs.verify_config_files(
                temp_feconf_path, temp_app_yaml.name, True)

    def test_app_yaml_verification_with_wildcard_header_present(self):
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'REGISTRATION_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n' % (
                mailgun_api_key, mailchimp_api_key))
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        app_yaml_text = (
            '- url: /assets\n'
            '  static_dir: assets\n'
            '  secure: always\n'
            '  http_headers:\n'
            '    Access-Control-Allow-Origin: "*"\n'
            '  expiration: "0"'
        )
        with utils.open_file(temp_app_yaml_path, 'w') as f:
            f.write(app_yaml_text)
        with self.assertRaisesRegex(
            Exception,
            r'\'Access-Control-Allow-Origin: "\*"\' must be updated to '
            r'a specific origin before deployment.'
        ):
            update_configs.verify_config_files(
                temp_feconf_path, temp_app_yaml_path, True)

    def test_update_app_yaml_correctly_updates(self):
        temp_feconf_config_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml_path = tempfile.NamedTemporaryFile().name
        feconf_config_text = 'OPPIA_SITE_URL = \'https://oppia.org\'\n'
        with utils.open_file(temp_feconf_config_path, 'w') as f:
            f.write(feconf_config_text)

        app_yaml_text = (
            '- url: /assets\n'
            '  static_dir: assets\n'
            '  secure: always\n'
            '  http_headers:\n'
            '    Access-Control-Allow-Origin: "*"\n'
            '  expiration: "0"'
        )
        with utils.open_file(temp_app_yaml_path, 'w') as f:
            f.write(app_yaml_text)

        update_configs.update_app_yaml(
            temp_app_yaml_path, temp_feconf_config_path)

        with utils.open_file(temp_app_yaml_path, 'r') as f:
            app_yaml_text = f.read()
            self.assertIn(
                'Access-Control-Allow-Origin: https://oppia.org', app_yaml_text)

    def test_invalid_config(self):
        with self.assertRaisesRegex(
            Exception,
            'Invalid line in invalid_feconf_updates.config '
            'config file: INVALID_KEY: \'invalid\''
        ):
            update_configs.apply_changes_based_on_config(
                MOCK_LOCAL_FECONF_PATH,
                INVALID_FECONF_CONFIG_PATH, update_configs.FECONF_REGEX)

    def test_missing_line_in_local_config(self):
        with self.assertRaisesRegex(
            Exception,
            'Could not find correct number of lines in '
            'feconf.txt matching: EXTRA_KEY = \'extra\''
        ):
            update_configs.apply_changes_based_on_config(
                MOCK_LOCAL_FECONF_PATH,
                FECONF_CONFIG_PATH_WITH_EXTRA_LINE, update_configs.FECONF_REGEX)

    def test_changes_are_applied_to_config(self):
        with utils.open_file(MOCK_LOCAL_FECONF_PATH, 'r') as f:
            original_text = f.read()
        expected_text = original_text.replace(
            'INCOMING_EMAILS_DOMAIN_NAME = \'\'',
            'INCOMING_EMAILS_DOMAIN_NAME = \'oppia.org\'')
        try:
            update_configs.apply_changes_based_on_config(
                MOCK_LOCAL_FECONF_PATH,
                VALID_FECONF_CONFIG_PATH,
                update_configs.FECONF_REGEX)
            with utils.open_file(MOCK_LOCAL_FECONF_PATH, 'r') as f:
                self.assertEqual(f.read(), expected_text)
        finally:
            with utils.open_file(MOCK_LOCAL_FECONF_PATH, 'w') as f:
                f.write(original_text)

    def test_function_calls_with_prompt_for_feconf_and_terms_update(self):
        check_function_calls = {
            'check_updates_to_terms_of_service_gets_called': False,
            'add_mailgun_api_key_gets_called': False,
            'add_mailchimp_api_key_gets_called': False,
            'apply_changes_based_on_config_gets_called': False,
            'verify_config_files_gets_called': False,
            'update_app_yaml_gets_called': False,
            'mailgun_api_key_is_to_be_verified': False,
            'mailchimp_api_key_is_to_be_verified': False,
            'update_analytics_constants_based_on_config': False
        }
        expected_check_function_calls = {
            'check_updates_to_terms_of_service_gets_called': True,
            'add_mailgun_api_key_gets_called': True,
            'add_mailchimp_api_key_gets_called': True,
            'apply_changes_based_on_config_gets_called': True,
            'verify_config_files_gets_called': True,
            'update_app_yaml_gets_called': True,
            'mailgun_api_key_is_to_be_verified': True,
            'mailchimp_api_key_is_to_be_verified': True,
            'update_analytics_constants_based_on_config': True
        }
        def mock_check_updates(
                unused_release_feconf_path, unused_personal_access_token):
            check_function_calls[
                'check_updates_to_terms_of_service_gets_called'] = True
        def mock_add_mailgun_api_key(unused_release_feconf_path):
            check_function_calls['add_mailgun_api_key_gets_called'] = True
        def mock_add_mailchimp_api_key(unused_release_feconf_path):
            check_function_calls['add_mailchimp_api_key_gets_called'] = True
        def mock_apply_changes(
                unused_local_filepath, unused_config_filepath,
                unused_expected_config_line_regex):
            check_function_calls[
                'apply_changes_based_on_config_gets_called'] = True
        def mock_verify_config_files(
            unused_release_feconf_path,
            unused_release_app_dev_yaml_path,
            verify_email_api_keys
        ):
            check_function_calls['verify_config_files_gets_called'] = True
            check_function_calls['mailgun_api_key_is_to_be_verified'] = (
                verify_email_api_keys)
            check_function_calls['mailchimp_api_key_is_to_be_verified'] = (
                verify_email_api_keys)

        def mock_update_app_yaml(
            unused_release_app_dev_yaml_path,
            unused_feconf_config_path
        ):
            check_function_calls['update_app_yaml_gets_called'] = True

        def mock_update_analytics_constants_based_on_config(
            unused_webpack_config_path,
            unused_release_constants_path
        ):
            check_function_calls[
                'update_analytics_constants_based_on_config'
            ] = True

        check_updates_swap = self.swap(
            update_configs, 'check_updates_to_terms_of_service',
            mock_check_updates)
        add_mailgun_api_key_swap = self.swap(
            update_configs, 'add_mailgun_api_key', mock_add_mailgun_api_key)
        add_mailchimp_api_key_swap = self.swap(
            update_configs, 'add_mailchimp_api_key', mock_add_mailchimp_api_key)
        apply_changes_swap = self.swap(
            update_configs, 'apply_changes_based_on_config', mock_apply_changes)
        verify_config_files_swap = self.swap(
            update_configs, 'verify_config_files', mock_verify_config_files)
        update_app_yaml_swap = self.swap(
            update_configs, 'update_app_yaml', mock_update_app_yaml)
        update_analytics_constants_based_on_config_swap = self.swap(
            update_configs,
            'update_analytics_constants_based_on_config',
            mock_update_analytics_constants_based_on_config)

        with self.url_open_swap, check_updates_swap, add_mailgun_api_key_swap:
            with apply_changes_swap, verify_config_files_swap:
                with add_mailchimp_api_key_swap, update_app_yaml_swap:
                    with update_analytics_constants_based_on_config_swap:
                        update_configs.main(
                            args=[
                                '--release_dir_path', 'test-release-dir',
                                '--deploy_data_path', 'test-deploy-dir',
                                '--personal_access_token', 'test-token',
                                '--prompt_for_mailgun_and_terms_update',
                            ])
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls_without_prompt_for_feconf_and_terms_update(self):
        check_function_calls = {
            'apply_changes_based_on_config_gets_called': False,
            'verify_config_files_gets_called': False,
            'update_app_yaml_gets_called': False,
            'mailgun_api_key_is_to_be_verified': False,
            'mailchimp_api_key_is_to_be_verified': False,
            'update_analytics_constants_based_on_config': False
        }
        expected_check_function_calls = {
            'apply_changes_based_on_config_gets_called': True,
            'verify_config_files_gets_called': True,
            'update_app_yaml_gets_called': True,
            'mailgun_api_key_is_to_be_verified': False,
            'mailchimp_api_key_is_to_be_verified': False,
            'update_analytics_constants_based_on_config': True
        }
        def mock_apply_changes(
            unused_local_filepath,
            unused_config_filepath,
            unused_expected_config_line_regex
        ):
            check_function_calls[
                'apply_changes_based_on_config_gets_called'] = True

        def mock_verify_config_files(
            unused_release_feconf_path,
            unused_release_app_dev_yaml_path,
            verify_email_api_keys
        ):
            check_function_calls['verify_config_files_gets_called'] = True
            check_function_calls['mailgun_api_key_is_to_be_verified'] = (
                verify_email_api_keys)
            check_function_calls['mailchimp_api_key_is_to_be_verified'] = (
                verify_email_api_keys)

        def mock_update_app_yaml(
            unused_release_app_dev_yaml_path,
            unused_feconf_config_path
        ):
            check_function_calls['update_app_yaml_gets_called'] = True

        def mock_update_analytics_constants_based_on_config(
            unused_webpack_config_path,
            unused_release_constants_path
        ):
            check_function_calls[
                'update_analytics_constants_based_on_config'
            ] = True

        apply_changes_swap = self.swap(
            update_configs, 'apply_changes_based_on_config', mock_apply_changes)
        verify_config_files_swap = self.swap(
            update_configs, 'verify_config_files', mock_verify_config_files)
        update_app_yaml_swap = self.swap(
            update_configs, 'update_app_yaml', mock_update_app_yaml)
        update_analytics_constants_based_on_config_swap = self.swap(
            update_configs,
            'update_analytics_constants_based_on_config',
            mock_update_analytics_constants_based_on_config)

        with apply_changes_swap, verify_config_files_swap, update_app_yaml_swap:
            with update_analytics_constants_based_on_config_swap:
                update_configs.main(
                    args=[
                        '--release_dir_path', 'test-release-dir',
                        '--deploy_data_path', 'test-deploy-dir',
                        '--personal_access_token', 'test-token'
                    ]
                )
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_update_analytics_ids(self):
        temp_constants_path = tempfile.NamedTemporaryFile().name
        temp_analytics_constants_config_path = (
            tempfile.NamedTemporaryFile().name
        )
        constants_text = (
            '  "UA_ANALYTICS_ID": "456"\n'
            '  "GA_ANALYTICS_ID": "123"\n'
            '  "SITE_NAME_FOR_ANALYTICS": "site-name"\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": true\n'
        )
        analytics_constants_config_text = (
            '  "GA_ANALYTICS_ID": ""\n'
            '  "UA_ANALYTICS_ID": ""\n'
            '  "SITE_NAME_FOR_ANALYTICS": ""\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": false\n'
        )
        expected_analytics_constants_config_text = (
            '  "GA_ANALYTICS_ID": "123"\n'
            '  "UA_ANALYTICS_ID": "456"\n'
            '  "SITE_NAME_FOR_ANALYTICS": "site-name"\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": true\n'
        )
        with utils.open_file(temp_constants_path, 'w') as f:
            f.write(constants_text)
        with utils.open_file(temp_analytics_constants_config_path, 'w') as f:
            f.write(analytics_constants_config_text)

        update_configs.update_analytics_constants_based_on_config(
            temp_analytics_constants_config_path,
            temp_constants_path
        )
        with utils.open_file(temp_analytics_constants_config_path, 'r') as f:
            self.assertEqual(f.read(), expected_analytics_constants_config_text)
