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

"""Tests for the android."""

from __future__ import annotations

import os

from core import feconf
from core.constants import constants
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services

secrets_services = models.Registry.import_secrets_services()


class InitializeAndroidTestDataHandlerTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def test_initialize_in_production_raises_exception(self) -> None:
        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/initialize_android_test_data', {}, use_payload=False,
                csrf_token=None)

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


class AndroidActivityHandlerTests(test_utils.GenericTestBase):
    """Tests for the AndroidActivityHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.secrets_swap = self.swap_to_always_return(
            secrets_services, 'get_secret', 'secret')

    def test_get_with_wrong_api_key_returns_error(self) -> None:
        secrets_swap = self.swap_to_always_return(
            secrets_services, 'get_secret', 'not_key')
        with secrets_swap:
            self.get_json(
                '/android_data?activity_type=story&api_key=secret&'
                'activities_data=[{"id": "id", "version": 1}]',
                expected_status_int=401
            )

    def test_get_non_existent_activity_returns_error(self) -> None:
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=story&api_key=secret&'
                    'activities_data=[{"id": "story_id", "version": 1}]',
                    expected_status_int=200
                ),
                [None]
            )

    def test_get_exploration_returns_correct_json(self) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&api_key=secret&'
                    'activities_data=[{"id": "exp_id", "version": 1}]',
                    expected_status_int=200
                ),
                [exploration.to_dict()]
            )

    def test_get_different_versions_of_exploration_returns_correct_json(
        self
    ) -> None:
        exploration = self.save_new_default_exploration('exp_id', 'owner_id')
        exp_services.update_exploration(
            'owner_id',
            'exp_id',
            [
                exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'new objective'
                })
            ],
            'change objective'
        )
        new_exploration = exp_fetchers.get_exploration_by_id('exp_id')

        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&api_key=secret&'
                    'activities_data=[{"id": "exp_id", "version": 1}]',
                    expected_status_int=200
                ),
                [exploration.to_dict()]
            )
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=exploration&api_key=secret&'
                    'activities_data=[{"id": "exp_id", "version": 2}]',
                    expected_status_int=200
                ),
                [new_exploration.to_dict()]
            )

    def test_get_story_returns_correct_json(self) -> None:
        story = self.save_new_story('story_id', 'user_id', 'Title')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=story&api_key=secret&'
                    'activities_data=[{"id": "story_id", "version": 1}]',
                    expected_status_int=200
                ),
                [story.to_dict()]
            )

    def test_get_skill_returns_correct_json(self) -> None:
        skill = self.save_new_skill('skill_id', 'user_id', 'Description')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=skill&api_key=secret&'
                    'activities_data=[{"id": "skill_id", "version": 1}]',
                    expected_status_int=200
                ),
                [skill.to_dict()]
            )

    def test_get_subtopic_returns_correct_json(self) -> None:
        subtopic = self.save_new_subtopic(1, 'user_id', 'topic_id')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=subtopic&api_key=secret&'
                    'activities_data=[{"id": "topic_id-1", "version": 1}]',
                    expected_status_int=200
                ),
                [subtopic.to_dict()]
            )

    def test_get_classroom_returns_correct_json(self) -> None:
        classroom_id = classroom_config_services.get_new_classroom_id()

        classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': classroom_id,
            'name': 'Math',
            'url_fragment': 'math',
            'course_details': '',
            'topic_list_intro': '',
            'topic_id_to_prerequisite_topic_ids': {}
        }

        classroom = classroom_config_domain.Classroom.from_dict(
            classroom_dict)

        classroom_config_services.update_or_create_classroom_model(classroom)
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=classroom&api_key=secret&'
                    'activities_data=[{"id": "math"}]',
                    expected_status_int=200
                ),
                [classroom.to_dict()]
            )

    def test_get_classroom_with_version_returns_error(self) -> None:
        classroom_id = classroom_config_services.get_new_classroom_id()

        classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': classroom_id,
            'name': 'Math',
            'url_fragment': 'math',
            'course_details': '',
            'topic_list_intro': '',
            'topic_id_to_prerequisite_topic_ids': {}
        }

        classroom = classroom_config_domain.Classroom.from_dict(
            classroom_dict)

        classroom_config_services.update_or_create_classroom_model(classroom)
        with self.secrets_swap:
            self.get_json(
                '/android_data?activity_type=classroom&api_key=secret&'
                'activities_data=[{"id": "math", "version": 2}]',
                expected_status_int=400
            )

    def test_get_topic_returns_correct_json(self) -> None:
        topic = self.save_new_topic('topic_id', 'user_id')
        with self.secrets_swap:
            self.assertEqual(
                self.get_json(
                    '/android_data?activity_type=learntopic&api_key=secret&'
                    'activities_data=[{"id": "topic_id", "version": 1}]',
                    expected_status_int=200
                ),
                [topic.to_dict()]
            )
