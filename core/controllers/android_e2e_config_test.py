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

"""Tests for the android_e2e_config."""

from __future__ import annotations

import os

from core import feconf
from core.constants import constants
from core.domain import exp_fetchers
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.domain import topic_services
from core.tests import test_utils


class AndroidConfigTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def test_initialize_in_production_raises_exception(self) -> None:
        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/initialize_android_test_data', {}, use_payload=False,
                csrf_token=None)

    def test_initialize_topic_is_published(self) -> None:
        self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None)
        self.assertTrue(topic_services.does_topic_with_name_exist(
            'Android test'))
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        topic_rights = topic_fetchers.get_topic_rights(
            topic.id, strict=True)

        self.assertTrue(topic_rights.topic_is_published)

    def test_initialize_structures_are_valid(self) -> None:
        self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None)
        exp_id = '26'
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        story = story_fetchers.get_story_by_url_fragment(
            'android-end-to-end-testing')
        assert story is not None
        skill = skill_fetchers.get_skill_by_description(
            'Dummy Skill for Android')
        assert skill is not None
        skill.validate()
        story.validate()
        topic.validate(strict=True)
        exploration.validate(strict=True)
        for node in story.story_contents.nodes:
            self.assertEqual(node.exploration_id, exp_id)

    def test_initialize_structure_thumbnails_exist(self) -> None:
        # To validate the thumbnails for topics ans stories can be fetched
        # using AssetsDevHandler.
        self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None)
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        story = story_fetchers.get_story_by_url_fragment(
            'android-end-to-end-testing')
        assert story is not None
        self.get_custom_response(
            '/assetsdevhandler/topic/%s/assets/thumbnail/test_svg.svg' %
            topic.id, 'image/svg+xml')
        self.get_custom_response(
            '/assetsdevhandler/story/%s/assets/thumbnail/test_svg.svg' %
            story.id, 'image/svg+xml')

    def test_exploration_assets_are_loaded(self) -> None:
        self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None)
        filelist = os.listdir(
            os.path.join(
                'data', 'explorations', 'android_interactions', 'assets',
                'image'))
        for filename in filelist:
            self.get_custom_response(
                '/assetsdevhandler/exploration/26/assets/image/%s' %
                filename, 'image/png')

    def test_initialize_twice_raises_already_published_exception(self) -> None:
        self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None)
        response = self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None, expected_status_int=400)
        self.assertEqual(
            response['error'], 'The topic is already published.')

    def test_initialize_twice_raises_unpublished_topic_exception(self) -> None:
        self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None)
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        topic_services.unpublish_topic(
            topic.id, feconf.SYSTEM_COMMITTER_ID)
        response = self.post_json(
            '/initialize_android_test_data', {}, use_payload=False,
            csrf_token=None, expected_status_int=400)
        self.assertEqual(
            response['error'], 'The topic exists but is not published.')
