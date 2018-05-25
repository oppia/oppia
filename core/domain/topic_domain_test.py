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


class TopicDomainUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""
    topic_id = 'topic_1'

    def setUp(self):
        super(TopicDomainUnitTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')

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
