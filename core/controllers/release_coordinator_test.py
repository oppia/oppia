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
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry
from core.domain import feature_flag_services
from core.domain import platform_parameter_list
from core.domain import user_services
from core.tests import test_utils


class FeatureNames(enum.Enum):
    """Enum for feature names."""

    TEST_FEATURE_1 = 'test_feature_1'
    TEST_FEATURE_2 = 'test_feature_2'


FeatureStages = feature_flag_domain.FeatureStages


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
        # Cache contains csrf secret and all platform parameters. Platform
        # parameters are accessed in user services to retrieve system email
        # address and hence cached.
        self.assertEqual(
            response['total_keys_stored'],
            len(platform_parameter_list.ALL_PLATFORM_PARAMS_LIST) + 1)

    def test_flush_memory_cache(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        # Cache contains csrf secret and all platform parameters. Platform
        # parameters are accessed in user services to retrieve system email
        # address and hence cached.
        self.assertEqual(
            response['total_keys_stored'],
            len(platform_parameter_list.ALL_PLATFORM_PARAMS_LIST) + 1)

        self.delete_json('/memorycachehandler')

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 0)


class UserGroupHandlerTest(test_utils.GenericTestBase):
    """Tests for UserGroupHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup('user1@email.com', 'user1')
        self.signup('user2@email.com', 'user2')
        self.signup('user3@email.com', 'user3')
        self.signup('user4@email.com', 'user4')
        self.signup('user5@email.com', 'user5')

        user_services.create_new_user_group(
            'USERGROUP1', ['user1', 'user2', 'user3'])
        user_services.create_new_user_group(
            'USERGROUP2', ['user1', 'user4'])

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_get_user_group_data(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 2)

    def test_deleting_user_group_successfully_updates_user_groups_data(
        self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 2)

        self.delete_json(
            feconf.USER_GROUPS_HANDLER_URL,
            {
                'user_group_id': response_dict_user_groups[0].get(
                    'user_group_id')
            }
        )
        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']
        self.assertEqual(len(response_dict_user_groups), 1)
        self.logout()

    def test_deleting_invalid_user_group_results_in_error(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        assert_raises_regex_error = self.assertRaisesRegex(
            Exception,
            'User group with id USER_GROUP_5_ID does not exist.'
        )
        with assert_raises_regex_error:
            self.delete_json(
                feconf.USER_GROUPS_HANDLER_URL, {
                    'user_group_id': 'USER_GROUP_5_ID'
                })
        self.logout()

    def test_updating_invalid_user_group_results_in_error(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 2)

        assert_raises_regex_error = self.assertRaisesRegex(
            Exception,
            'User group USERGROUP3 does not exist.'
        )

        with assert_raises_regex_error:
            self.put_json(
                feconf.USER_GROUPS_HANDLER_URL, {
                    'user_group_id': 'USER_GROUP_5_ID',
                    'name': 'USERGROUP3',
                    'member_usernames': ['user1id', 'user2id', 'user5id']
                }, csrf_token=csrf_token)
        self.logout()

    def test_user_group_changes_correctly_updates_returned_by_getter(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 2)

        self.put_json(
            feconf.USER_GROUPS_HANDLER_URL, {
                'user_group_id': response_dict_user_groups[0].get(
                    'user_group_id'),
                'name': 'USERGROUP3',
                'member_usernames': ['user1', 'user2', 'user5']
            }, csrf_token=csrf_token)

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 2)

        self.logout()

    def test_create_new_user_group(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 2)

        self.post_json(
            feconf.USER_GROUPS_HANDLER_URL, {
                'name': 'USERGROUP4',
                'member_usernames': ['user1', 'user2', 'user3']
            }, csrf_token=csrf_token)

        response_dict = self.get_json(feconf.USER_GROUPS_HANDLER_URL)
        response_dict_user_groups = response_dict['user_group_dicts']

        self.assertEqual(len(response_dict_user_groups), 3)

    def test_create_new_user_group_with_invalid_users_raises_error(
        self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with self.assertRaisesRegex(
            Exception,
            r'Following users of user-group USERGROUP4 does '
            r'not exist: \[\'user6\']\.'
        ):
            self.post_json(
                feconf.USER_GROUPS_HANDLER_URL, {
                    'name': 'USERGROUP4',
                    'member_usernames': ['user1', 'user2', 'user6']
                }, csrf_token=csrf_token)


class FeatureFlagsHandlerTest(test_utils.GenericTestBase):
    """Tests FeatureFlagsHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup('user1@email.com', 'user1')
        self.signup('user2@email.com', 'user2')
        self.signup('user3@email.com', 'user3')
        self.signup('user4@email.com', 'user4')

        user_services.create_new_user_group(
            'USERGROUP1', ['user1', 'user2', 'user3'])
        user_services.create_new_user_group(
            'USERGROUP2', ['user1', 'user4'])

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_without_feature_flag_name_update_feature_flag_is_not_performed(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'feature_flag_name\' must be provided when the action is '
            'update_feature_flag.'
        )
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.put_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_flag_name': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_get_handler_includes_all_feature_flags_and_user_groups(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_services,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_1.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )
        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS',
            [FeatureNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET',
            set([FeatureNames.TEST_FEATURE_1.value]))

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                response_dict = self.get_json(feconf.FEATURE_FLAGS_URL)
                self.assertEqual(
                    response_dict['feature_flags'],
                    [
                        {
                            'name': FeatureNames.TEST_FEATURE_1.value,
                            'description': 'a feature in dev stage',
                            'feature_stage': FeatureStages.DEV.value,
                            'force_enable_for_all_users': False,
                            'rollout_percentage': 0,
                            'user_group_ids': [],
                            'last_updated': None
                        }
                    ])
                self.assertEqual(
                    len(response_dict['user_group_dicts']), 2)
        self.logout()

    def test_post_with_flag_changes_updates_feature_flags(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_1.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )
        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS',
            [FeatureNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET',
            set([FeatureNames.TEST_FEATURE_1.value]))

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                self.put_json(
                    feconf.FEATURE_FLAGS_URL, {
                        'action': 'update_feature_flag',
                        'feature_flag_name': FeatureNames.TEST_FEATURE_1.value,
                        'force_enable_for_all_users': False,
                        'rollout_percentage': 50,
                        'user_group_ids': []
                    }, csrf_token=csrf_token)

                updated_feature_flag = (
                    feature_flag_registry.Registry.get_feature_flag(
                        FeatureNames.TEST_FEATURE_1.value))
                self.assertEqual(
                    updated_feature_flag.feature_flag_config.
                    force_enable_for_all_users,
                    False
                )
                self.assertEqual(
                    updated_feature_flag.feature_flag_config.rollout_percentage,
                    50
                )
                self.assertEqual(
                    updated_feature_flag.feature_flag_config.user_group_ids, [])

        self.logout()

    def test_update_flag_with_unknown_feature_flag_name_returns_400(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS', [])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET', set([]))
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_1.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                response = self.put_json(
                    feconf.FEATURE_FLAGS_URL, {
                        'action': 'update_feature_flag',
                        'feature_flag_name': 'test_feature_1',
                        'force_enable_for_all_users': False,
                        'rollout_percentage': 50,
                        'user_group_ids': []
                    },
                    csrf_token=csrf_token,
                    expected_status_int=400
                )
                self.assertEqual(
                    response['error'],
                    'Unknown feature flag: test_feature_1.')

        self.logout()

    def test_update_flag_with_invalid_values_returns_400(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_2.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )
        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS',
            [FeatureNames.TEST_FEATURE_2])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET',
            set([FeatureNames.TEST_FEATURE_2.value]))

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                response = self.put_json(
                    feconf.FEATURE_FLAGS_URL, {
                        'action': 'update_feature_flag',
                        'feature_flag_name': FeatureNames.TEST_FEATURE_2.value,
                        'force_enable_for_all_users': False,
                        'rollout_percentage': 200,
                        'user_group_ids': []
                    },
                    csrf_token=csrf_token,
                    expected_status_int=400
                )
        self.assertEqual(
            response['error'],
            'At \'http://localhost/feature_flags\' '
            'these errors are happening:\n'
            'Schema validation for \'rollout_percentage\' failed: '
            'Validation failed: is_at_most ({\'max_value\': 100}) '
            'for object 200')

        self.logout()
