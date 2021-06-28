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

"""Tests for the admin page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from constants import constants
from core.domain import exp_fetchers
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(
    audit_models, exp_models, opportunity_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.audit, models.NAMES.exploration, models.NAMES.opportunity,
    models.NAMES.user
])

EXPLORATION_ID = '26'


class AndroidConfigTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def test_initialize_in_production_gives_an_exception(self):
        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_req('/initialize_android_test_data')

    def test_initialize_topic_is_published(self):
        self.post_req('/initialize_android_test_data')
        self.assertTrue(topic_services.does_topic_with_name_exist(
            'Android test'))
        topic = topic_fetchers.get_topic_by_name('Android test')
        topic_rights = topic_fetchers.get_topic_rights(
            topic.id, strict=False)

        self.assertTrue(topic_rights.topic_is_published)

    def test_initialize_structures_are_valid(self):
        self.post_req('/initialize_android_test_data')
        topic = topic_fetchers.get_topic_by_name('Android test')
        exploration = exp_fetchers.get_exploration_by_id(EXPLORATION_ID)
        story = story_fetchers.get_story_by_url_fragment(
            'android-end-to-end-testing')
        skill = skill_fetchers.get_skill_by_description(
            'Dummy Skill for android')
        skill.validate()
        story.validate()
        topic.validate(strict=True)
        exploration.validate(strict=True)

    def test_initialize_structure_thumbnails_exists(self):
        self.post_req('/initialize_android_test_data')
        topic = topic_fetchers.get_topic_by_name('Android test')
        story = story_fetchers.get_story_by_url_fragment(
            'android-end-to-end-testing')
        self.get_custom_response(
            '/assetsdevhandler/topic/%s/assets/thumbnail/test_svg.svg' %
            topic.id, 'image/svg+xml')
        self.get_custom_response(
            '/assetsdevhandler/story/%s/assets/thumbnail/test_svg.svg' %
            story.id, 'image/svg+xml')

    def test_exploration_assets_are_loaded(self):
        self.post_req('/initialize_android_test_data')
        filelist = os.listdir(
            os.path.join(
                'data', 'explorations', 'android_interactions', 'assets',
                'image'))
        for filename in filelist:
            self.get_custom_response(
                '/assetsdevhandler/exploration/26/assets/image/%s' %
                filename, 'image/png')

    def test_initialize_twice_raises_already_published_exception(self):
        self.post_req('/initialize_android_test_data')
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'The topic is already published.')
        with assert_raises_regexp_context_manager:
            self.post_req(
                '/initialize_android_test_data')

    def test_check_if_topic_exists_and_not_published(self):
        self.post_req('/initialize_android_test_data')
        topic = topic_fetchers.get_topic_by_name('Android test')
        topic_services.unpublish_topic(
            topic.id, feconf.SYSTEM_COMMITTER_ID)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'The topic exists but is not published.')
        with assert_raises_regexp_context_manager:
            self.post_req(
                '/initialize_android_test_data')
