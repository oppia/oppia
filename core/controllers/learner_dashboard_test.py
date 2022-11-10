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

"""Tests for the learner dashboard and the notifications dashboard."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import learner_progress_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class OldLearnerDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old learner dashboard page URL
    to the new one.
    """

    def test_old_learner_dashboard_page_url(self) -> None:
        """Test to validate that the old learner dashboard page url redirects
        to the new one.
        """
        response = self.get_html_response(
            '/learner_dashboard', expected_status_int=301)
        self.assertEqual(
            'http://localhost/learner-dashboard', response.headers['location'])


class LearnerDashboardTopicsAndStoriesProgressHandlerTests(
    test_utils.GenericTestBase):

    EXP_ID_1: Final = 'EXP_ID_1'
    EXP_TITLE_1: Final = 'Exploration title 1'
    EXP_ID_2: Final = 'EXP_ID_2'
    EXP_TITLE_2: Final = 'Exploration title 2'
    EXP_ID_3: Final = 'EXP_ID_3'
    EXP_TITLE_3: Final = 'Exploration title 3'

    COL_ID_1: Final = 'COL_ID_1'
    COL_TITLE_1: Final = 'Collection title 1'
    COL_ID_2: Final = 'COL_ID_2'
    COL_TITLE_2: Final = 'Collection title 2'
    COL_ID_3: Final = 'COL_ID_3'
    COL_TITLE_3: Final = 'Collection title 3'

    STORY_ID_1: Final = 'STORY_1'
    STORY_TITLE_1: Final = 'Story title 1'
    STORY_ID_2: Final = 'STORY_2'
    STORY_TITLE_2: Final = 'Story title 2'
    STORY_ID_3: Final = 'STORY_3'
    STORY_TITLE_3: Final = 'Story title 3'

    TOPIC_ID_1: Final = 'TOPIC_1'
    TOPIC_NAME_1: Final = 'Topic title 1'
    TOPIC_ID_2: Final = 'TOPIC_2'
    TOPIC_NAME_2: Final = 'Topic title 2'
    TOPIC_ID_3: Final = 'TOPIC_3'
    TOPIC_NAME_3: Final = 'Topic title 3'

    subtopic_0 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_1 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

    def test_can_see_completed_stories(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['completed_stories_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        learner_progress_services.mark_story_as_completed(
            self.viewer_id, self.STORY_ID_1)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['completed_stories_list']), 1)
        self.assertEqual(
            response['completed_stories_list'][0]['id'], self.STORY_ID_1)
        self.logout()

    def test_can_see_learnt_topics(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['learnt_topics_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        learner_progress_services.mark_story_as_completed(
            self.viewer_id, self.STORY_ID_1)
        learner_progress_services.mark_topic_as_learnt(
            self.viewer_id, self.TOPIC_ID_1)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['learnt_topics_list']), 1)
        self.assertEqual(
            response['learnt_topics_list'][0]['id'], self.TOPIC_ID_1)
        self.logout()

    def test_can_see_partially_learnt_topics(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['partially_learnt_topics_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        learner_progress_services.record_topic_started(
            self.viewer_id, self.TOPIC_ID_1)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['partially_learnt_topics_list']), 1)
        self.assertEqual(
            response['partially_learnt_topics_list'][0]['id'], self.TOPIC_ID_1)
        self.logout()

    def test_can_see_topics_to_learn(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['topics_to_learn_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_2)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_2, self.admin_id)

        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_1)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['topics_to_learn_list']), 1)
        self.assertEqual(
            response['topics_to_learn_list'][0]['id'], self.TOPIC_ID_1)
        self.logout()

    def test_can_see_all_topics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['all_topics_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_2)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_2, self.admin_id)
        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'url_fragment': 'math',
            'topic_ids': [self.TOPIC_ID_1],
            'course_details': '',
            'topic_list_intro': ''
        }]

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.CLASSROOM_PAGES_DATA.name: (
                    new_config_value),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token=csrf_token)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['all_topics_list']), 1)
        self.assertEqual(
            response['all_topics_list'][0]['id'], self.TOPIC_ID_1)
        self.logout()

    def test_can_see_untracked_topics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['untracked_topics']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_2)
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_2, self.admin_id)
        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'url_fragment': 'math',
            'topic_ids': [self.TOPIC_ID_1],
            'course_details': '',
            'topic_list_intro': ''
        }]

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.CLASSROOM_PAGES_DATA.name: (
                    new_config_value),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token=csrf_token)
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL)
        self.assertEqual(len(response['untracked_topics']), 1)
        self.logout()

    def test_get_learner_dashboard_ids(self) -> None:
        self.login(self.VIEWER_EMAIL)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id, title=self.EXP_TITLE_2)
        self.publish_exploration(self.owner_id, self.EXP_ID_2)
        self.save_new_default_exploration(
            self.EXP_ID_3, self.owner_id, title=self.EXP_TITLE_3)
        self.publish_exploration(self.owner_id, self.EXP_ID_3)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)
        self.save_new_default_collection(
            self.COL_ID_2, self.owner_id, title=self.COL_TITLE_2)
        self.publish_collection(self.owner_id, self.COL_ID_2)
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title=self.COL_TITLE_3)
        self.publish_collection(self.owner_id, self.COL_ID_3)

        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        self.save_new_topic(
            self.TOPIC_ID_2, self.owner_id, name=self.TOPIC_NAME_2,
            url_fragment='topic-two',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_2)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_2, self.STORY_ID_2)

        topic_services.publish_story(
            self.TOPIC_ID_2, self.STORY_ID_2, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_2, self.admin_id)

        self.save_new_topic(
            self.TOPIC_ID_3, self.owner_id, name=self.TOPIC_NAME_3,
            url_fragment='topic-three',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID_3, self.owner_id, self.TOPIC_ID_3)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_3, self.STORY_ID_3)

        topic_services.publish_story(
            self.TOPIC_ID_3, self.STORY_ID_3, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_3, self.admin_id)

        state_name = 'state_name'
        version = 1

        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_2, state_name, version)
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_3)

        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_1)
        learner_progress_services.mark_collection_as_incomplete(
            self.viewer_id, self.COL_ID_2)
        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_3)

        learner_progress_services.mark_story_as_completed(
            self.viewer_id, self.STORY_ID_1)

        learner_progress_services.mark_topic_as_learnt(
            self.viewer_id, self.TOPIC_ID_1)
        learner_progress_services.record_topic_started(
            self.viewer_id, self.TOPIC_ID_2)
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_3)

        response = self.get_json(feconf.LEARNER_DASHBOARD_IDS_DATA_URL)
        learner_dashboard_activity_ids = (
            response['learner_dashboard_activity_ids'])

        self.assertEqual(
            learner_dashboard_activity_ids['completed_exploration_ids'],
            [self.EXP_ID_1])
        self.assertEqual(
            learner_dashboard_activity_ids['incomplete_exploration_ids'],
            [self.EXP_ID_2])
        self.assertEqual(
            learner_dashboard_activity_ids['exploration_playlist_ids'],
            [self.EXP_ID_3])

        self.assertEqual(
            learner_dashboard_activity_ids['completed_collection_ids'],
            [self.COL_ID_1])
        self.assertEqual(
            learner_dashboard_activity_ids['incomplete_collection_ids'],
            [self.COL_ID_2])
        self.assertEqual(
            learner_dashboard_activity_ids['collection_playlist_ids'],
            [self.COL_ID_3])

        self.assertEqual(
            learner_dashboard_activity_ids['completed_story_ids'],
            [self.STORY_ID_1])

        self.assertEqual(
            learner_dashboard_activity_ids['learnt_topic_ids'],
            [self.TOPIC_ID_1])
        self.assertEqual(
            learner_dashboard_activity_ids['partially_learnt_topic_ids'],
            [self.TOPIC_ID_2])
        self.assertEqual(
            learner_dashboard_activity_ids['topic_ids_to_learn'],
            [self.TOPIC_ID_3])

    def test_learner_dashboard_page(self) -> None:
        self.login(self.OWNER_EMAIL)

        response = self.get_html_response(feconf.LEARNER_DASHBOARD_URL)
        self.assertIn(b'{"title": "Learner Dashboard | Oppia"})', response.body)

        self.logout()


class LearnerCompletedChaptersCountHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1: Final = 'EXP_ID_1'
    EXP_TITLE_1: Final = 'Exploration title 1'
    EXP_ID_2: Final = 'EXP_ID_2'
    EXP_TITLE_2: Final = 'Exploration title 2'
    EXP_ID_3: Final = 'EXP_ID_3'
    EXP_TITLE_3: Final = 'Exploration title 3'

    COL_ID_1: Final = 'COL_ID_1'
    COL_TITLE_1: Final = 'Collection title 1'
    COL_ID_2: Final = 'COL_ID_2'
    COL_TITLE_2: Final = 'Collection title 2'
    COL_ID_3: Final = 'COL_ID_3'
    COL_TITLE_3: Final = 'Collection title 3'

    STORY_ID_1: Final = 'STORY_1'
    STORY_TITLE_1: Final = 'Story title 1'
    STORY_ID_2: Final = 'STORY_2'
    STORY_TITLE_2: Final = 'Story title 2'
    STORY_ID_3: Final = 'STORY_3'
    STORY_TITLE_3: Final = 'Story title 3'

    TOPIC_ID_1: Final = 'TOPIC_1'
    TOPIC_NAME_1: Final = 'Topic title 1'
    TOPIC_ID_2: Final = 'TOPIC_2'
    TOPIC_NAME_2: Final = 'Topic title 2'
    TOPIC_ID_3: Final = 'TOPIC_3'
    TOPIC_NAME_3: Final = 'Topic title 3'

    subtopic_0 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_1 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

    def test_can_get_completed_chapters_count(self) -> None:
        self.save_new_topic(
            self.TOPIC_ID_1, self.owner_id, name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0], next_subtopic_id=1)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, 'Title 1')
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        changelist = [story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_1',
            'title': 'Title 1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_1',
            'old_value': None,
            'new_value': self.EXP_ID_1
        })]
        story_services.update_story(
            self.owner_id, self.STORY_ID_1, changelist,
            'Added first node.')
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'url_fragment': 'math',
            'topic_ids': [self.TOPIC_ID_1],
            'course_details': '',
            'topic_list_intro': ''
        }]
        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.CLASSROOM_PAGES_DATA.name: (
                    new_config_value),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token=csrf_token)
        self.logout()

        self.login(self.VIEWER_EMAIL)

        self.assertEqual(
            self.get_json(feconf.LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL)
                ['completed_chapters_count'], 0)

        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.STORY_ID_1, 'node_1')

        self.assertEqual(
            self.get_json(feconf.LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL)
                ['completed_chapters_count'], 1)
        self.logout()


class LearnerDashboardCollectionsProgressHandlerTests(
    test_utils.GenericTestBase):

    EXP_ID_1: Final = 'EXP_ID_1'
    EXP_TITLE_1: Final = 'Exploration title 1'
    EXP_ID_2: Final = 'EXP_ID_2'
    EXP_TITLE_2: Final = 'Exploration title 2'
    EXP_ID_3: Final = 'EXP_ID_3'
    EXP_TITLE_3: Final = 'Exploration title 3'

    COL_ID_1: Final = 'COL_ID_1'
    COL_TITLE_1: Final = 'Collection title 1'
    COL_ID_2: Final = 'COL_ID_2'
    COL_TITLE_2: Final = 'Collection title 2'
    COL_ID_3: Final = 'COL_ID_3'
    COL_TITLE_3: Final = 'Collection title 3'

    STORY_ID_1: Final = 'STORY_1'
    STORY_TITLE_1: Final = 'Story title 1'
    STORY_ID_2: Final = 'STORY_2'
    STORY_TITLE_2: Final = 'Story title 2'
    STORY_ID_3: Final = 'STORY_3'
    STORY_TITLE_3: Final = 'Story title 3'

    TOPIC_ID_1: Final = 'TOPIC_1'
    TOPIC_NAME_1: Final = 'Topic title 1'
    TOPIC_ID_2: Final = 'TOPIC_2'
    TOPIC_NAME_2: Final = 'Topic title 2'
    TOPIC_ID_3: Final = 'TOPIC_3'
    TOPIC_NAME_3: Final = 'Topic title 3'

    subtopic_0 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_1 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

    def test_can_see_completed_collections(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['completed_collections_list']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_1)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['completed_collections_list']), 1)
        self.assertEqual(
            response['completed_collections_list'][0]['id'], self.COL_ID_1)
        self.logout()

    def test_can_see_incomplete_collections(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['incomplete_collections_list']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.mark_collection_as_incomplete(
            self.viewer_id, self.COL_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['incomplete_collections_list']), 1)
        self.assertEqual(
            response['incomplete_collections_list'][0]['id'], self.COL_ID_1)
        self.logout()

    def test_can_see_collection_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['collection_playlist']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1)
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['collection_playlist']), 1)
        self.assertEqual(
            response['collection_playlist'][0]['id'], self.COL_ID_1)
        self.logout()

    def test_learner_dashboard_page(self) -> None:
        self.login(self.OWNER_EMAIL)

        response = self.get_html_response(feconf.LEARNER_DASHBOARD_URL)
        self.assertIn(b'{"title": "Learner Dashboard | Oppia"})', response.body)

        self.logout()


class LearnerDashboardExplorationsProgressHandlerTests(
    test_utils.GenericTestBase):

    EXP_ID_1: Final = 'EXP_ID_1'
    EXP_TITLE_1: Final = 'Exploration title 1'
    EXP_ID_2: Final = 'EXP_ID_2'
    EXP_TITLE_2: Final = 'Exploration title 2'
    EXP_ID_3: Final = 'EXP_ID_3'
    EXP_TITLE_3: Final = 'Exploration title 3'

    COL_ID_1: Final = 'COL_ID_1'
    COL_TITLE_1: Final = 'Collection title 1'
    COL_ID_2: Final = 'COL_ID_2'
    COL_TITLE_2: Final = 'Collection title 2'
    COL_ID_3: Final = 'COL_ID_3'
    COL_TITLE_3: Final = 'Collection title 3'

    STORY_ID_1: Final = 'STORY_1'
    STORY_TITLE_1: Final = 'Story title 1'
    STORY_ID_2: Final = 'STORY_2'
    STORY_TITLE_2: Final = 'Story title 2'
    STORY_ID_3: Final = 'STORY_3'
    STORY_TITLE_3: Final = 'Story title 3'

    TOPIC_ID_1: Final = 'TOPIC_1'
    TOPIC_NAME_1: Final = 'Topic title 1'
    TOPIC_ID_2: Final = 'TOPIC_2'
    TOPIC_NAME_2: Final = 'Topic title 2'
    TOPIC_ID_3: Final = 'TOPIC_3'
    TOPIC_NAME_3: Final = 'Topic title 3'

    subtopic_0 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    subtopic_1 = topic_domain.Subtopic(
        0, 'Title 1', ['skill_id_1'], 'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
        'dummy-subtopic-zero')

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

    def test_can_see_completed_explorations(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['completed_explorations_list']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['completed_explorations_list']), 1)
        self.assertEqual(
            response['completed_explorations_list'][0]['id'], self.EXP_ID_1)
        self.logout()

    def test_can_see_incomplete_explorations(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['incomplete_explorations_list']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        state_name = 'state_name'
        version = 1

        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_1, state_name, version)
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['incomplete_explorations_list']), 1)
        self.assertEqual(
            response['incomplete_explorations_list'][0]['id'], self.EXP_ID_1)
        self.logout()

    def test_can_see_exploration_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['exploration_playlist']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_1)
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['exploration_playlist']), 1)
        self.assertEqual(
            response['exploration_playlist'][0]['id'], self.EXP_ID_1)
        self.logout()

    def test_can_see_subscription(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 0)

        subscription_services.subscribe_to_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 1)
        self.assertEqual(
            response['subscription_list'][0]['creator_username'],
            self.OWNER_USERNAME)
        self.logout()


class LearnerDashboardFeedbackUpdatesHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = 'EXP_ID_1'
    EXP_TITLE_1 = 'Exploration title 1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_get_threads_after_updating_thread_summaries(self) -> None:
        self.login(self.OWNER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': []},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        self.assertEqual(thread_summaries, [])

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.owner_id, 'a subject',
            'some text')

        response = self.post_json(
            feconf.LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': []},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)

        self.assertEqual(len(response['paginated_threads_list']), 0)
        self.assertEqual(len(thread_summaries), 1)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(thread_summaries[0]['last_message_text'], 'some text')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject')
        self.assertEqual(thread.entity_type, 'exploration')
        self.logout()

    def test_get_more_threads_on_request(self) -> None:
        self.login(self.OWNER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        for i in range(190):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, self.owner_id, 'a subject %s' % i,
                'some text %s' % i)

        response = self.post_json(
            feconf.LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': []},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)
        paginated_threads_list = response['paginated_threads_list']

        self.assertEqual(len(paginated_threads_list), 1)
        self.assertEqual(len(paginated_threads_list[0]), 90)
        self.assertEqual(len(thread_summaries), 100)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(
            thread_summaries[0]['last_message_text'], 'some text 0')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject 0')
        self.assertEqual(thread.entity_type, 'exploration')

        response = self.post_json(
            feconf.LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': paginated_threads_list},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)
        paginated_threads_list = response['paginated_threads_list']

        self.assertEqual(len(response['paginated_threads_list']), 0)
        self.assertEqual(len(thread_summaries), 90)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(
            thread_summaries[0]['last_message_text'], 'some text 100')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject 100')
        self.assertEqual(thread.entity_type, 'exploration')
        self.logout()


class LearnerDashboardFeedbackThreadHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = '0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        # Load exploration 0.
        exp_services.load_demo(self.EXP_ID_1)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        # Get the CSRF token and create a single thread with a single message.
        self.login(self.EDITOR_EMAIL)
        self.csrf_token = self.get_new_csrf_token()
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1
        ), {
            'subject': self._get_unicode_test_string('subject'),
            'text': 'a sample message',
        }, csrf_token=self.csrf_token)
        self.logout()

    def test_get_message_summaries(self) -> None:
        self.login(self.EDITOR_EMAIL)
        # Fetch all the feedback threads of that exploration.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1))

        # Get the id of the thread.
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # Get the message summary of the thread.
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list']
        first_message = messages_summary[0]

        self.assertDictContainsSubset({
            'text': 'a sample message',
            'author_username': 'editor'
        }, first_message)

        # Add another message.
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 1'
            }, csrf_token=self.csrf_token)

        # Again fetch the thread message summary.
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list']

        # Check the summary of the second message.
        self.assertEqual(len(messages_summary), 2)
        second_message = messages_summary[1]
        self.assertDictContainsSubset({
            'text': 'Message 1',
            'author_username': 'editor'
        }, second_message)

        self.logout()

    def test_anonymous_feedback_is_recorded_correctly(self) -> None:
        self.post_json(
            '/explorehandler/give_feedback/%s' % self.EXP_ID_1,
            {
                'feedback': 'This is an anonymous feedback message.',
            }
        )

        self.login(self.EDITOR_EMAIL)
        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # Get the message summary of the thread.
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]

        self.assertEqual(messages_summary['author_username'], None)
        self.assertEqual(messages_summary['author_picture_data_url'], None)

    def test_raises_error_if_wrong_type_of_suggestion_provided(self) -> None:
        self.login(self.EDITOR_EMAIL)

        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p>This is a content.</p>',
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
        }
        translation_suggestion = suggestion_registry.SuggestionTranslateContent(
            'exploration.exp1.thread1', 'exp1',
            1, suggestion_models.STATUS_ACCEPTED, 'author',
            'review_id', change_dict, 'translation.Algebra',
            'en', False, datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        )

        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        with self.swap_to_always_return(
            suggestion_services, 'get_suggestion_by_id', translation_suggestion
        ):
            with self.assertRaisesRegex(
                Exception,
                'No edit state content suggestion found for the given '
                'thread_id: %s' % thread_id
            ):
                self.get_json(thread_url)

    def test_get_suggestions_after_updating_suggestion_summary(self) -> None:
        self.login(self.EDITOR_EMAIL)

        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (
            feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]

        self.assertEqual(
            messages_summary['author_username'], self.EDITOR_USERNAME)
        self.assertTrue(test_utils.check_image_png_or_webp(
            messages_summary['author_picture_data_url']))
        self.assertFalse(messages_summary.get('suggestion_html'))
        self.assertFalse(messages_summary.get('current_content_html'))
        self.assertFalse(messages_summary.get('description'))

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Welcome!',
            'new_value': new_content
        }

        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID_1, 1,
            suggestion_models.STATUS_IN_REVIEW, self.editor_id, None,
            change_cmd, 'score category', thread_id, None)

        suggestion_thread = feedback_services.get_thread(thread_id)
        suggestion = suggestion_services.get_suggestion_by_id(thread_id)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID_1)
        current_content_html = (
            exploration.states[
                suggestion.change.state_name].content.html)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]
        first_suggestion = feedback_services.get_messages(thread_id)[0]

        self.assertEqual(
            messages_summary['author_username'], self.EDITOR_USERNAME)
        self.assertTrue(test_utils.check_image_png_or_webp(
            messages_summary['author_picture_data_url']))
        self.assertEqual(
            utils.get_time_in_millisecs(first_suggestion.created_on),
            messages_summary['created_on_msecs'])
        self.assertEqual(
            messages_summary['suggestion_html'], '<p>new content html</p>')
        self.assertEqual(
            messages_summary['current_content_html'], current_content_html)
        self.assertEqual(
            messages_summary['description'], suggestion_thread.subject)
        self.logout()
