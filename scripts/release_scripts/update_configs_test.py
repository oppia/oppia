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

import os
import tempfile

from core import utils
from core.tests import test_utils
from scripts.release_scripts import update_configs

from typing import Final

INVALID_FECONF_CONFIG_PATH: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'invalid_feconf_updates.config')
VALID_FECONF_CONFIG_PATH: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'valid_feconf_updates.config')
FECONF_CONFIG_PATH_WITH_EXTRA_LINE: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'feconf_updates_with_extra_line.config')
MOCK_LOCAL_FECONF_PATH: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'release_sources',
    'feconf.txt')


class UpdateConfigsTests(test_utils.GenericTestBase):
    """Test the methods for updating configs."""

    def test_feconf_verification_with_correct_config(self) -> None:
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
            'TERMS_PAGE_LAST_UPDATED_UTC = '
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
            temp_feconf_path, temp_app_yaml.name)

    def test_feconf_verification_with_key_absent_and_verification_disabled(
        self
    ) -> None:
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        feconf_text = (
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'TERMS_PAGE_LAST_UPDATED_UTC = '
            'datetime.datetime(2015, 10, 14, 2, 40, 0)\n'
            '# Format of string for dashboard statistics logs.\n'
            '# NOTE TO DEVELOPERS: This format should not be changed, '
            'since it is used in\n'
            '# the existing storage models for UserStatsModel.\n'
            'DASHBOARD_STATS_DATETIME_STRING_FORMAT = \'YY-mm-dd\'\n')
        with utils.open_file(temp_feconf_path, 'w') as f:
            f.write(feconf_text)
        update_configs.verify_config_files(
            temp_feconf_path, temp_app_yaml.name)

    def test_feconf_verification_with_redishost_absent(self) -> None:
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml = tempfile.NamedTemporaryFile()
        temp_app_yaml.write(b'')
        feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'TERMS_PAGE_LAST_UPDATED_UTC = '
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
                temp_feconf_path, temp_app_yaml.name)

    def test_app_yaml_verification_with_wildcard_header_present(self) -> None:
        mailgun_api_key = ('key-%s' % ('').join(['1'] * 32))
        mailchimp_api_key = ('%s-us18' % ('').join(['1'] * 32))
        temp_feconf_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml_path = tempfile.NamedTemporaryFile().name
        feconf_text = (
            'MAILGUN_API_KEY = \'%s\'\n'
            'MAILCHIMP_API_KEY = \'%s\'\n'
            'REDISHOST = \'192.13.2.1\'\n'
            '# When the site terms were last updated, in UTC.\n'
            'TERMS_PAGE_LAST_UPDATED_UTC = '
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
                temp_feconf_path, temp_app_yaml_path)

    def test_update_app_yaml_correctly_updates(self) -> None:
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

    def test_update_app_yaml_raises_error_for_invalid_oppia_site_url_key(
        self
    ) -> None:
        temp_feconf_config_path = tempfile.NamedTemporaryFile().name
        temp_app_yaml_path = tempfile.NamedTemporaryFile().name
        feconf_config_text = 'OPPIA_SiTe_URL = \'https://oppia.org\'\n'
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

        with self.assertRaisesRegex(
            Exception, 'Error: No OPPIA_SITE_URL key found.'
        ):
            update_configs.update_app_yaml(
                temp_app_yaml_path, temp_feconf_config_path)

    def test_invalid_config(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Invalid line in invalid_feconf_updates.config '
            'config file: INVALID_KEY: \'invalid\''
        ):
            update_configs.apply_changes_based_on_config(
                MOCK_LOCAL_FECONF_PATH,
                INVALID_FECONF_CONFIG_PATH, update_configs.FECONF_REGEX)

    def test_missing_line_in_local_config(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Could not find correct number of lines in '
            'feconf.txt matching: EXTRA_KEY = \'extra\''
        ):
            update_configs.apply_changes_based_on_config(
                MOCK_LOCAL_FECONF_PATH,
                FECONF_CONFIG_PATH_WITH_EXTRA_LINE, update_configs.FECONF_REGEX)

    def test_changes_are_applied_to_config(self) -> None:
        with utils.open_file(MOCK_LOCAL_FECONF_PATH, 'r') as f:
            original_text = f.read()
        expected_text = original_text.replace(
            'ADMIN_EMAIL_ADDRESS = \'\'',
            'ADMIN_EMAIL_ADDRESS = \'adm@example.com\'')
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

    def test_function_calls_without_prompt_for_feconf_and_terms_update(
        self
    ) -> None:
        check_function_calls = {
            'apply_changes_based_on_config_gets_called': False,
            'verify_config_files_gets_called': False,
            'update_app_yaml_gets_called': False,
            'update_analytics_constants_based_on_config': False
        }
        expected_check_function_calls = {
            'apply_changes_based_on_config_gets_called': True,
            'verify_config_files_gets_called': True,
            'update_app_yaml_gets_called': True,
            'update_analytics_constants_based_on_config': True
        }

        def mock_apply_changes(
            unused_local_filepath: str,
            unused_config_filepath: str,
            unused_expected_config_line_regex: str
        ) -> None:
            check_function_calls[
                'apply_changes_based_on_config_gets_called'] = True

        def mock_verify_config_files(
            unused_release_feconf_path: str,
            unused_release_app_dev_yaml_path: str,
        ) -> None:
            check_function_calls['verify_config_files_gets_called'] = True

        def mock_update_app_yaml(
            unused_release_app_dev_yaml_path: str,
            unused_feconf_config_path: str
        ) -> None:
            check_function_calls['update_app_yaml_gets_called'] = True

        def mock_update_analytics_constants_based_on_config(
            unused_webpack_config_path: str,
            unused_release_constants_path: str
        ) -> None:
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

    def test_update_analytics_ids(self) -> None:
        temp_constants_path = tempfile.NamedTemporaryFile().name
        temp_analytics_constants_config_path = (
            tempfile.NamedTemporaryFile().name
        )
        constants_text = (
            '  "GA_ANALYTICS_ID": "123"\n'
            '  "SITE_NAME_FOR_ANALYTICS": "site-name"\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": true\n'
        )
        analytics_constants_config_text = (
            '  "GA_ANALYTICS_ID": ""\n'
            '  "SITE_NAME_FOR_ANALYTICS": ""\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": false\n'
        )
        expected_analytics_constants_config_text = (
            '  "GA_ANALYTICS_ID": "123"\n'
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

    def test_raises_error_with_invalid_update_analytics_ids(self) -> None:
        temp_constants_path = tempfile.NamedTemporaryFile().name
        temp_analytics_constants_config_path = (
            tempfile.NamedTemporaryFile().name
        )
        analytics_constants_config_text = (
            '  "GA_ANALYTICS_ID": ""\n'
            '  "SITE_NAME_FOR_ANALYTICS": ""\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": false\n'
        )
        with utils.open_file(temp_analytics_constants_config_path, 'w') as f:
            f.write(analytics_constants_config_text)

        # Testing invalid GA_ANALYTICS_ID key.
        constants_text = (
            '  "GA_analytics_ID": "123"\n'
            '  "SITE_NAME_FOR_ANALYTICS": "site-name"\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": true\n'
        )
        with utils.open_file(temp_constants_path, 'w') as f:
            f.write(constants_text)
        with self.assertRaisesRegex(
            Exception, 'Error: No GA_ANALYTICS_ID key found.'
        ):
            update_configs.update_analytics_constants_based_on_config(
                temp_analytics_constants_config_path,
                temp_constants_path
            )

        # Testing invalid SITE_NAME_FOR_ANALYTICS key.
        constants_text = (
            '  "GA_ANALYTICS_ID": "123"\n'
            '  "SITE_name_for_ANALYTICS": "site-name"\n'
            '  "CAN_SEND_ANALYTICS_EVENTS": true\n'
        )
        with utils.open_file(temp_constants_path, 'w') as f:
            f.write(constants_text)
        with self.assertRaisesRegex(
            Exception, 'Error: No SITE_NAME_FOR_ANALYTICS key found.'
        ):
            update_configs.update_analytics_constants_based_on_config(
                temp_analytics_constants_config_path,
                temp_constants_path
            )

        # Testing invalid CAN_SEND_ANALYTICS_EVENTS key.
        constants_text = (
            '  "GA_ANALYTICS_ID": "123"\n'
            '  "SITE_NAME_FOR_ANALYTICS": "site-name"\n'
            '  "can_SEND_analytics_EVENTS": true\n'
        )
        with utils.open_file(temp_constants_path, 'w') as f:
            f.write(constants_text)
        with self.assertRaisesRegex(
            Exception, 'Error: No CAN_SEND_ANALYTICS_EVENTS key found.'
        ):
            update_configs.update_analytics_constants_based_on_config(
                temp_analytics_constants_config_path,
                temp_constants_path
            )
