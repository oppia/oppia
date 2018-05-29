# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for topic domain objects."""

from constants import constants
from core.domain import topic_domain
from core.domain import user_services
from core.tests import test_utils
import feconf
import utils


class TopicDomainUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""
    topic_id = 'topic_id'

    def setUp(self):
        super(TopicDomainUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.topic = topic_domain.Topic.create_default_topic(self.topic_id)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)

    def test_create_default_topic(self):
        """Tests the create_default_topic() function.
        """
        topic = topic_domain.Topic.create_default_topic(self.topic_id)
        expected_topic_dict = {
            'id': self.topic_id,
            'name': feconf.DEFAULT_TOPIC_NAME,
            'description': feconf.DEFAULT_TOPIC_DESCRIPTION,
            'canonical_story_ids': [],
            'additional_story_ids': [],
            'skill_ids': [],
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(topic.to_dict(), expected_topic_dict)

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.topic.validate()

    def test_name_validation(self):
        self.topic.name = 1
        self._assert_validation_error('Expected name to be a string')

    def test_description_validation(self):
        self.topic.description = 1
        self._assert_validation_error('Expected description to be a string')

    def test_language_code_validation(self):
        self.topic.language_code = 0
        self._assert_validation_error('Expected language code to be a string')

        self.topic.language_code = 'xz'
        self._assert_validation_error('Invalid language code')

    def test_canonical_story_ids_validation(self):
        self.topic.canonical_story_ids = 'story_id'
        self._assert_validation_error(
            'Expected canonical story ids to be a list')
        self.topic.canonical_story_ids = ['story_id']
        self._assert_validation_error(
            'The story with id story_id doesn\'t exist')

    def test_additional_story_ids_validation(self):
        self.topic.additional_story_ids = 'story_id'
        self._assert_validation_error(
            'Expected additional story ids to be a list')
        self.topic.additional_story_ids = ['story_id']
        self._assert_validation_error(
            'The story with id story_id doesn\'t exist')

    def test_skill_ids_validation(self):
        self.topic.skill_ids = 'skill_id'
        self._assert_validation_error('Expected skill ids to be a list')
        self.topic.skill_ids = ['skill_id']
        self._assert_validation_error(
            'The skill with id skill_id doesn\'t exist')

    def test_to_dict(self):
        user_ids = [self.user_id_a, self.user_id_b]
        topic_rights = topic_domain.TopicRights(
            self.topic_id, user_ids)
        expected_dict = {
            'topic_id': self.topic_id,
            'manager_names': ['A', 'B']
        }

        self.assertEqual(expected_dict, topic_rights.to_dict())

    def test_is_manager(self):
        user_ids = [self.user_id_a, self.user_id_b]
        topic_rights = topic_domain.TopicRights(
            self.topic_id, user_ids)
        self.assertTrue(topic_rights.is_manager(self.user_id_a))
        self.assertTrue(topic_rights.is_manager(self.user_id_b))
        self.assertFalse(topic_rights.is_manager('fakeuser'))
