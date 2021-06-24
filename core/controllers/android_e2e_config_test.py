# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the admin page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import platform_parameter_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(
    audit_models, exp_models, opportunity_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.audit, models.NAMES.exploration, models.NAMES.opportunity,
    models.NAMES.user
])

BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'
BOTH_MODERATOR_AND_ADMIN_USERNAME = 'moderatorandadm1n'


PARAM_NAMES = python_utils.create_enum('test_feature_1')  # pylint: disable=invalid-name
FEATURE_STAGES = platform_parameter_domain.FEATURE_STAGES


class AndroidConfigTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def test_cannot_load_structures_in_production_mode(self):
        csrf_token = self.get_new_csrf_token()
        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/initialize_android_test_data', {}, csrf_token=csrf_token)

    def test_check_if_topic_is_published(self):
        self.post_req(
            '/initialize_android_test_data')
        topic = topic_fetchers.get_topic_by_name('Android test')
        topic_rights = topic_fetchers.get_topic_rights(
            topic.id, strict=False)
        self.assertTrue(topic_rights.topic_is_published)

    def test_check_if_topic_is_already_published(self):
        csrf_token = self.get_new_csrf_token()
        self.post_req(
            '/initialize_android_test_data')
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'The topic is already published.')
        with assert_raises_regexp_context_manager:
            self.post_json(
                '/initialize_android_test_data', {}, csrf_token=csrf_token)

    def test_check_if_topic_exists_and_not_published(self):
        csrf_token = self.get_new_csrf_token()
        self.post_req(
            '/initialize_android_test_data')
        topic = topic_fetchers.get_topic_by_name('Android test')
        topic_services.unpublish_topic(
            topic.id, feconf.SYSTEM_COMMITTER_ID)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'The topic exists but not published.')
        with assert_raises_regexp_context_manager:
            self.post_json(
                '/initialize_android_test_data', {}, csrf_token=csrf_token)
