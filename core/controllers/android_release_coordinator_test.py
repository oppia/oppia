# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for Android release coordinator handlers."""

from __future__ import annotations

from core import android_feature_flag_list, feconf
from core.domain import (
    android_feature_flag_registry,
    caching_services,
)
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FEATURE_FLAG_NAME = (
    android_feature_flag_list.AndroidFeatureFlagNames.FAST_LANGUAGE_SWITCHING_IN_LESSON.value
)


class AndroidFeatureFlagsAdminHandlerTest(test_utils.GenericTestBase):
    """Tests the Android feature-flag administration endpoints."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('android@example.com', 'androidcoordinator')
        self.signup('web@example.com', 'webcoordinator')
        self.signup('regular@example.com', 'regularuser')
        self.add_user_role(
            'androidcoordinator',
            feconf.ROLE_ID_ANDROID_RELEASE_COORDINATOR,
        )
        self.add_user_role(
            'webcoordinator', feconf.ROLE_ID_WEB_RELEASE_COORDINATOR
        )
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            [FEATURE_FLAG_NAME],
        )

    def test_unauthorized_users_cannot_access_endpoints(self) -> None:
        self.get_json(
            feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL,
            expected_status_int=401,
        )

        self.login('regular@example.com')
        self.get_json(
            feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL,
            expected_status_int=401,
        )
        self.put_json(
            '%s/%s'
            % (feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL, FEATURE_FLAG_NAME),
            {'rollout_percentage': 50},
            csrf_token=self.get_new_csrf_token(),
            expected_status_int=401,
        )

    def test_web_release_coordinator_can_read_but_cannot_update(self) -> None:
        self.login('web@example.com')

        response = self.get_json(feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL)
        self.assertTrue(response['feature_flags'])
        self.put_json(
            '%s/%s'
            % (feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL, FEATURE_FLAG_NAME),
            {'rollout_percentage': 50},
            csrf_token=self.get_new_csrf_token(),
            expected_status_int=401,
        )

    def test_get_returns_defaults_for_flags_not_in_storage(self) -> None:
        self.login('web@example.com')

        response = self.get_json(feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL)
        feature_flags_by_name = {
            feature_flag['name']: feature_flag
            for feature_flag in response['feature_flags']
        }

        self.assertEqual(
            feature_flags_by_name[FEATURE_FLAG_NAME],
            {
                'name': FEATURE_FLAG_NAME,
                'state': 'live',
                'min_app_version': '0.0',
                'max_app_version': None,
                'rollout_percentage': 0,
            },
        )

    def test_android_release_coordinator_updates_and_invalidates_cache(
        self,
    ) -> None:
        self.login('android@example.com')
        cached_flag = (
            android_feature_flag_registry.Registry.get_android_feature_flag(
                FEATURE_FLAG_NAME
            )
        )
        self.assertEqual(cached_flag.rollout_percentage, 0)

        self.put_json(
            '%s/%s'
            % (feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL, FEATURE_FLAG_NAME),
            {
                'min_app_version': '1.2',
                'max_app_version': '2.0',
                'rollout_percentage': 50,
            },
            csrf_token=self.get_new_csrf_token(),
        )

        stored_flag = android_feature_flag_registry.Registry.load_feature_flag_from_storage(
            FEATURE_FLAG_NAME
        )
        assert stored_flag is not None
        self.assertEqual(stored_flag.min_app_version, '1.2')
        self.assertEqual(stored_flag.max_app_version, '2.0')
        self.assertEqual(stored_flag.rollout_percentage, 50)
        self.assertEqual(
            android_feature_flag_registry.Registry.get_android_feature_flag(
                FEATURE_FLAG_NAME
            ).rollout_percentage,
            50,
        )

    def test_update_rejects_empty_payload_and_invalid_configuration(
        self,
    ) -> None:
        self.login('android@example.com')
        csrf_token = self.get_new_csrf_token()
        url = '%s/%s' % (
            feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL,
            FEATURE_FLAG_NAME,
        )

        self.put_json(url, {}, csrf_token=csrf_token, expected_status_int=400)
        self.put_json(
            url,
            {
                'min_app_version': '2.0.0',
                'max_app_version': '1.0.0',
            },
            csrf_token=csrf_token,
            expected_status_int=400,
        )
        self.put_json(
            url,
            {'min_app_version': '0.0.0-alpha'},
            csrf_token=csrf_token,
            expected_status_int=400,
        )
        for rollout_percentage in [-1, 101]:
            self.put_json(
                url,
                {'rollout_percentage': rollout_percentage},
                csrf_token=csrf_token,
                expected_status_int=400,
            )

    def test_final_feature_flag_cannot_be_updated(self) -> None:
        self.login('android@example.com')
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'final', '1.2', None, 100
        )
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            [FEATURE_FLAG_NAME],
        )

        response = self.put_json(
            '%s/%s'
            % (feconf.ANDROID_FEATURE_FLAGS_ADMIN_URL, FEATURE_FLAG_NAME),
            {'rollout_percentage': 50},
            csrf_token=self.get_new_csrf_token(),
            expected_status_int=400,
        )
        self.assertIn('FINAL', response['error'])
