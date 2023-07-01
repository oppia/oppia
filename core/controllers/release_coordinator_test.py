# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the release coordinator page."""

from __future__ import annotations

import enum

from core import feconf
from core.constants import constants
from core.domain import platform_feature_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_registry
from core.tests import test_utils


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    TEST_FEATURE_1 = 'test_feature_1'
    TEST_FEATURE_2 = 'test_feature_2'


FeatureStages = platform_parameter_domain.FeatureStages


class ReleaseCoordinatorPageTest(test_utils.GenericTestBase):
    """Test for release coordinator pages."""

    def setUp(self) -> None:
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super().setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)


class MemoryCacheHandlerTest(test_utils.GenericTestBase):
    """Tests MemoryCacheHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_get_memory_cache_data(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(
            response['total_allocation'], 0)
        self.assertEqual(
            response['peak_allocation'], 0)
        self.assertEqual(response['total_keys_stored'], 1)

    def test_flush_memory_cache(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 1)

        self.delete_json('/memorycachehandler')

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 0)


class FeatureFlagsHandlerTest(test_utils.GenericTestBase):
    """Tests FeatureFlagsHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_without_feature_name_action_update_feature_flag_is_not_performed(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'feature_name\' must be provided when the action is '
            'update_feature_flag.'
        )
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_new_rules_action_update_feature_flag_is_not_performed(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'new_rules\' must be provided when the action is '
            'update_feature_flag.'
        )
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': 'new_feature',
                    'new_rules': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_commit_message_action_update_feature_flag_is_not_performed(
        self
    ) -> None:
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'commit_message\' must be provided when the action is '
            'update_feature_flag.'
        )
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': 'new_feature',
                    'new_rules': new_rule_dicts,
                    'commit_message': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_get_handler_includes_all_feature_flags(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURE_FLAGS',
            [ParamNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            response_dict = self.get_json(feconf.FEATURE_FLAGS_URL)
            self.assertEqual(
                response_dict['feature_flags'], [feature.to_dict()])

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_post_with_flag_changes_updates_feature_flags(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURE_FLAGS',
            [ParamNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                    'default_value': False
                }, csrf_token=csrf_token)

            rule_dicts = [
                rule.to_dict() for rule
                in platform_parameter_registry.Registry.get_platform_parameter(
                    feature.name).rules
            ]
            self.assertEqual(rule_dicts, new_rule_dicts)

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_update_flag_rules_with_unknown_feature_name_returns_400(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURE_FLAGS', [])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET', set([]))
        with feature_list_ctx, feature_set_ctx:
            response = self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': 'test_feature_1',
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                    'default_value': False
                },
                csrf_token=csrf_token,
                expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Unknown feature flag: test_feature_1.')

        self.logout()

    def test_update_flag_rules_with_invalid_rules_returns_400(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_2, 'feature for test.', FeatureStages.DEV)
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'prod']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURE_FLAGS',
            [ParamNames.TEST_FEATURE_2])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            response = self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                    'default_value': False
                },
                csrf_token=csrf_token,
                expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Feature in dev stage cannot be enabled in test or production '
                'environments.')

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_update_flag_rules_with_unexpected_exception_returns_500(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_2, 'feature for test.', FeatureStages.DEV)
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURE_FLAGS',
            [ParamNames.TEST_FEATURE_2])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        platform_parameter_registry.Registry.parameter_registry[
            feature.name] = None  # type: ignore[assignment]
        with feature_list_ctx, feature_set_ctx:
            response = self.post_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                    'default_value': False
                },
                csrf_token=csrf_token,
                expected_status_int=500
            )
            self.assertEqual(
                response['error'],
                '\'NoneType\' object has no attribute \'serialize\'')

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()
