# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for learner goals services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import learner_goals_services
from core.domain import learner_progress_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])

MAX_CURRENT_GOALS_COUNT = (
    feconf.MAX_CURRENT_GOALS_COUNT)


class LearnerGoalsTests(test_utils.GenericTestBase):
    """Test the services related to learner goals services."""

    OWNER_EMAIL = 'owner@example.com'
    OWNER_USERNAME = 'owner'

    TOPIC_ID_1 = 'Topic_id_1'
    TOPIC_NAME_1 = 'Topic name 1'
    TOPIC_ID_2 = 'Topic_id_2'
    TOPIC_NAME_2 = 'Topic name 2'
    TOPIC_ID_3 = 'Topic_id_3'
    TOPIC_NAME_3 = 'Topic name 3'
    TOPIC_ID_4 = 'Topic_id_4'
    TOPIC_NAME_4 = 'Topic name 4'

    subtopic_1 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_2 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_3 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_4 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero'
    )

    def setUp(self):
        super(LearnerGoalsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Save the topics.
        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_topic(
            self.TOPIC_ID_2, self.owner_id, name=self.TOPIC_NAME_2,
            url_fragment='topic-two',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_2], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_2, self.admin_id)
        self.save_new_topic(
            self.TOPIC_ID_3, self.owner_id, name=self.TOPIC_NAME_3,
            url_fragment='topic-three',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_3], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_3, self.admin_id)
        self.save_new_topic(
            self.TOPIC_ID_4, self.owner_id, name=self.TOPIC_NAME_4,
            url_fragment='topic-four',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_4], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_4, self.admin_id)

    def _get_all_topic_ids_to_learn(self, user_id):
        """Returns the list of all the topic ids to learn
        corresponding to the given user id.
        """
        learner_goals_model = user_models.LearnerGoalsModel.get(
            user_id, strict=False)

        return (
            learner_goals_model.topic_ids_to_learn if
            learner_goals_model else [])

    def test_single_topic_is_added_correctly_to_learn(self):
        # Test adding a single topic_id to learn.
        self.assertEqual(
            self._get_all_topic_ids_to_learn(self.viewer_id), [])
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_1)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1])

    def test_multiple_topics_are_added_correctly_to_learn(self):
        # Test adding two topics to the learn.
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [])

        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_1)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1])

        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_2)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1, self.TOPIC_ID_2])

    def test_adding_exisiting_topic_is_not_added_again(self):
        # Test adding the topic_id if it is already in
        # learner_goals.topic_id.
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_1)
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_2)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1, self.TOPIC_ID_2])

        with self.assertRaisesRegexp(
            Exception,
            'The topic id Topic_id_1 is already present in the learner goals'):
            learner_progress_services.validate_and_add_topic_to_learn_goal(
                self.viewer_id, self.TOPIC_ID_1)

    def test_completed_topic_is_not_added_to_learner_goals(self):
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_1)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1])

        learner_progress_services.mark_topic_as_learnt(
            self.viewer_id, self.TOPIC_ID_2)

        # Test that the topic added to the in the learnt list doesn't get
        # added to the learner goals.
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1])

    def test_number_of_topics_cannot_exceed_max(self):
        # Add MAX_CURRENT_GOALS_COUNT topics.
        topic_ids = ['SAMPLE_TOPIC_ID_%s' % index for index in (
            python_utils.RANGE(0, MAX_CURRENT_GOALS_COUNT))]
        for topic_id in topic_ids:
            learner_progress_services.validate_and_add_topic_to_learn_goal(
                self.viewer_id, topic_id)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(self.viewer_id), topic_ids)

        # Now if we try to add another topic at the end of the list,
        # it shouldn't be added as the list length would exceed
        # MAX_CURRENT_GOALS_COUNT.
        learner_goals_services.mark_topic_to_learn(
            self.viewer_id, 'SAMPLE_TOPIC_ID_MAX')
        self.assertEqual(
            self._get_all_topic_ids_to_learn(self.viewer_id), topic_ids)

    def test_remove_topic_from_learner_goals(self):
        self.assertEqual(self._get_all_topic_ids_to_learn(
            self.viewer_id), [])

        # Add topic to learner goals.
        learner_goals_services.mark_topic_to_learn(
            self.viewer_id, self.TOPIC_ID_1)
        learner_goals_services.mark_topic_to_learn(
            self.viewer_id, self.TOPIC_ID_2)
        self.assertEqual(self._get_all_topic_ids_to_learn(
            self.viewer_id), [self.TOPIC_ID_1, self.TOPIC_ID_2])

        # Removing a topic.
        learner_goals_services.remove_topics_from_learn_goal(
            self.viewer_id, [self.TOPIC_ID_1])
        self.assertEqual(self._get_all_topic_ids_to_learn(
            self.viewer_id), [self.TOPIC_ID_2])

        # Removing the same topic raises error.
        with self.assertRaisesRegexp(
            Exception,
            'The topic id Topic_id_1 is not present in LearnerGoalsModel'):
            learner_goals_services.remove_topics_from_learn_goal(
                self.viewer_id, [self.TOPIC_ID_1])

        # Removing the second topic.
        learner_goals_services.remove_topics_from_learn_goal(
            self.viewer_id, [self.TOPIC_ID_2])
        self.assertEqual(self._get_all_topic_ids_to_learn(
            self.viewer_id), [])

    def test_get_all_topic_ids_in_learn(self):
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [])

        # Add an topic to the learner goals.
        learner_goals_services.mark_topic_to_learn(
            self.viewer_id, self.TOPIC_ID_1)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1])

        # Add another topic.
        learner_goals_services.mark_topic_to_learn(
            self.viewer_id, self.TOPIC_ID_2)
        self.assertEqual(
            self._get_all_topic_ids_to_learn(
                self.viewer_id), [self.TOPIC_ID_1, self.TOPIC_ID_2])
