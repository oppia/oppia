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

from core import feconf
from core.constants import constants
from core.domain import (
    exp_domain,
    exp_fetchers,
    exp_services,
    learner_progress_services,
    story_domain,
    story_services,
    subscription_services,
    topic_domain,
    topic_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Final

user_models = models.Registry.import_models([models.Names.USER])[0]


class OldLearnerDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old learner dashboard page URL
    to the new one.
    """

    def test_old_learner_dashboard_page_url(self) -> None:
        """Test to validate that the old learner dashboard page url redirects
        to the new one.
        """
        response = self.get_html_response(
            '/learner_dashboard', expected_status_int=301
        )
        self.assertEqual(
            'http://localhost/learner-dashboard', response.headers['location']
        )


class LearnerDashboardTopicsAndStoriesProgressHandlerTests(
    test_utils.GenericTestBase
):

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
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

    subtopic_1 = topic_domain.Subtopic(
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

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
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['completed_stories_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        learner_progress_services.mark_story_as_completed(
            self.viewer_id, self.STORY_ID_1
        )
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['completed_stories_list']), 1)
        self.assertEqual(
            response['completed_stories_list'][0]['id'], self.STORY_ID_1
        )
        self.logout()

    def test_can_see_learnt_topics(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['learnt_topics_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        learner_progress_services.mark_story_as_completed(
            self.viewer_id, self.STORY_ID_1
        )
        learner_progress_services.mark_topic_as_learnt(
            self.viewer_id, self.TOPIC_ID_1
        )
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['learnt_topics_list']), 1)
        self.assertEqual(
            response['learnt_topics_list'][0]['id'], self.TOPIC_ID_1
        )
        self.logout()

    def test_can_see_partially_learnt_topics(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['partially_learnt_topics_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        learner_progress_services.record_topic_started(
            self.viewer_id, self.TOPIC_ID_1
        )
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['partially_learnt_topics_list']), 1)
        self.assertEqual(
            response['partially_learnt_topics_list'][0]['id'], self.TOPIC_ID_1
        )
        self.logout()

    def test_can_see_topics_to_learn(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['topics_to_learn_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_2
        )
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_2, self.admin_id
        )

        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_1
        )
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['topics_to_learn_list']), 1)
        self.assertEqual(
            response['topics_to_learn_list'][0]['id'], self.TOPIC_ID_1
        )
        self.logout()

    def test_can_see_all_topics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['all_topics_list']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_2
        )
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_2, self.admin_id
        )
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={self.TOPIC_ID_1: []}
        )
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['all_topics_list']), 1)
        self.assertEqual(response['all_topics_list'][0]['id'], self.TOPIC_ID_1)
        self.logout()

    def test_can_see_untracked_topics(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['untracked_topics']), 0)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_2
        )
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_2, self.admin_id
        )
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={self.TOPIC_ID_1: []}
        )
        self.logout()

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL
        )
        self.assertEqual(len(response['untracked_topics']), 1)
        self.logout()

    def test_duplicate_exploration_ids_are_handled_correctly(self) -> None:
        """Test that duplicate exploration ids across categories are skipped
        to avoid redundant progress tracking.
        """
        self.login(self.VIEWER_EMAIL)
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1
        )

        playlist_model = user_models.LearnerPlaylistModel.get_by_id(
            self.viewer_id
        )
        if playlist_model is None:
            playlist_model = user_models.LearnerPlaylistModel(
                id=self.viewer_id, exploration_ids=[], collection_ids=[]
            )

        playlist_model.exploration_ids.append(self.EXP_ID_1)
        playlist_model.update_timestamps()
        playlist_model.put()

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)

        self.assertEqual(len(response['completed_explorations_list']), 1)
        self.assertEqual(len(response['exploration_playlist']), 1)

        self.assertEqual(
            response['completed_explorations_list'][0]['id'], self.EXP_ID_1
        )
        self.assertEqual(
            response['exploration_playlist'][0]['id'], self.EXP_ID_1
        )

        self.logout()

    def test_get_learner_dashboard_ids(self) -> None:
        self.login(self.VIEWER_EMAIL)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id, title=self.EXP_TITLE_2
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_2)
        self.save_new_default_exploration(
            self.EXP_ID_3, self.owner_id, title=self.EXP_TITLE_3
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_3)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1
        )
        self.publish_collection(self.owner_id, self.COL_ID_1)
        self.save_new_default_collection(
            self.COL_ID_2, self.owner_id, title=self.COL_TITLE_2
        )
        self.publish_collection(self.owner_id, self.COL_ID_2)
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title=self.COL_TITLE_3
        )
        self.publish_collection(self.owner_id, self.COL_ID_3)

        self.save_new_topic(
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        self.save_new_topic(
            self.TOPIC_ID_2,
            self.owner_id,
            name=self.TOPIC_NAME_2,
            url_fragment='topic-two',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1],
            next_subtopic_id=1,
        )
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_2)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_2, self.STORY_ID_2
        )

        topic_services.publish_story(
            self.TOPIC_ID_2, self.STORY_ID_2, self.admin_id
        )
        topic_services.publish_topic(self.TOPIC_ID_2, self.admin_id)

        self.save_new_topic(
            self.TOPIC_ID_3,
            self.owner_id,
            name=self.TOPIC_NAME_3,
            url_fragment='topic-three',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_1],
            next_subtopic_id=1,
        )
        self.save_new_story(self.STORY_ID_3, self.owner_id, self.TOPIC_ID_3)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_3, self.STORY_ID_3
        )

        topic_services.publish_story(
            self.TOPIC_ID_3, self.STORY_ID_3, self.admin_id
        )
        topic_services.publish_topic(self.TOPIC_ID_3, self.admin_id)

        state_name = 'state_name'
        version = 1

        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1
        )
        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_2, state_name, version
        )
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_3
        )

        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_1
        )
        learner_progress_services.mark_collection_as_incomplete(
            self.viewer_id, self.COL_ID_2
        )
        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_3
        )

        learner_progress_services.mark_story_as_completed(
            self.viewer_id, self.STORY_ID_1
        )

        learner_progress_services.mark_topic_as_learnt(
            self.viewer_id, self.TOPIC_ID_1
        )
        learner_progress_services.record_topic_started(
            self.viewer_id, self.TOPIC_ID_2
        )
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.viewer_id, self.TOPIC_ID_3
        )

        response = self.get_json(feconf.LEARNER_DASHBOARD_IDS_DATA_URL)
        learner_dashboard_activity_ids = response[
            'learner_dashboard_activity_ids'
        ]

        self.assertEqual(
            learner_dashboard_activity_ids['completed_exploration_ids'],
            [self.EXP_ID_1],
        )
        self.assertEqual(
            learner_dashboard_activity_ids['incomplete_exploration_ids'],
            [self.EXP_ID_2],
        )
        self.assertEqual(
            learner_dashboard_activity_ids['exploration_playlist_ids'],
            [self.EXP_ID_3],
        )

        self.assertEqual(
            learner_dashboard_activity_ids['completed_collection_ids'],
            [self.COL_ID_1],
        )
        self.assertEqual(
            learner_dashboard_activity_ids['incomplete_collection_ids'],
            [self.COL_ID_2],
        )
        self.assertEqual(
            learner_dashboard_activity_ids['collection_playlist_ids'],
            [self.COL_ID_3],
        )

        self.assertEqual(
            learner_dashboard_activity_ids['completed_story_ids'],
            [self.STORY_ID_1],
        )

        self.assertEqual(
            learner_dashboard_activity_ids['learnt_topic_ids'],
            [self.TOPIC_ID_1],
        )
        self.assertEqual(
            learner_dashboard_activity_ids['partially_learnt_topic_ids'],
            [self.TOPIC_ID_2],
        )
        self.assertEqual(
            learner_dashboard_activity_ids['topic_ids_to_learn'],
            [self.TOPIC_ID_3],
        )


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
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

    subtopic_1 = topic_domain.Subtopic(
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

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
            self.TOPIC_ID_1,
            self.owner_id,
            name=self.TOPIC_NAME_1,
            url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[self.subtopic_0],
            next_subtopic_id=1,
        )
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, 'Title 1'
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        changelist = [
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_ADD_STORY_NODE,
                    'node_id': 'node_1',
                    'title': 'Title 1',
                }
            ),
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                    'property_name': (
                        story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                    ),
                    'node_id': 'node_1',
                    'old_value': None,
                    'new_value': self.EXP_ID_1,
                }
            ),
        ]
        story_services.update_story(
            self.owner_id, self.STORY_ID_1, changelist, 'Added first node.'
        )
        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.save_new_valid_classroom(
            topic_id_to_prerequisite_topic_ids={self.TOPIC_ID_1: []}
        )
        self.logout()

        self.login(self.VIEWER_EMAIL)

        self.assertEqual(
            self.get_json(feconf.LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL)[
                'completed_chapters_count'
            ],
            0,
        )

        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.STORY_ID_1, 'node_1'
        )

        self.assertEqual(
            self.get_json(feconf.LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL)[
                'completed_chapters_count'
            ],
            1,
        )
        self.logout()


class LearnerDashboardCollectionsProgressHandlerTests(
    test_utils.GenericTestBase
):

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
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

    subtopic_1 = topic_domain.Subtopic(
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

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

        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['completed_collections_list']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1
        )
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.mark_collection_as_completed(
            self.viewer_id, self.COL_ID_1
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['completed_collections_list']), 1)
        self.assertEqual(
            response['completed_collections_list'][0]['id'], self.COL_ID_1
        )
        self.logout()

    def test_can_see_incomplete_collections(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['incomplete_collections_list']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1
        )
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.mark_collection_as_incomplete(
            self.viewer_id, self.COL_ID_1
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['incomplete_collections_list']), 1)
        self.assertEqual(
            response['incomplete_collections_list'][0]['id'], self.COL_ID_1
        )
        self.logout()

    def test_can_see_collection_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['collection_playlist']), 0)

        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title=self.COL_TITLE_1
        )
        self.publish_collection(self.owner_id, self.COL_ID_1)

        learner_progress_services.add_collection_to_learner_playlist(
            self.viewer_id, self.COL_ID_1
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL)
        self.assertEqual(len(response['collection_playlist']), 1)
        self.assertEqual(
            response['collection_playlist'][0]['id'], self.COL_ID_1
        )
        self.logout()


class LearnerDashboardExplorationsProgressHandlerTests(
    test_utils.GenericTestBase
):

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
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

    subtopic_1 = topic_domain.Subtopic(
        0,
        'Title 1',
        ['skill_id_1'],
        'image.svg',
        constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
        21131,
        'dummy-subtopic-zero',
    )

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
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['completed_explorations_list']), 1)
        self.assertEqual(
            response['completed_explorations_list'][0]['id'], self.EXP_ID_1
        )
        self.logout()

    def test_can_see_incomplete_explorations(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['incomplete_explorations_list']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        state_name = 'state_name'
        version = 1

        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_1, state_name, version
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['incomplete_explorations_list']), 1)
        self.assertEqual(
            response['incomplete_explorations_list'][0]['id'], self.EXP_ID_1
        )
        self.logout()

    def test_can_see_exploration_playlist(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['exploration_playlist']), 0)

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_1
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['exploration_playlist']), 1)
        self.assertEqual(
            response['exploration_playlist'][0]['id'], self.EXP_ID_1
        )
        self.logout()

    def test_can_see_subscription(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 0)

        subscription_services.subscribe_to_creator(
            self.viewer_id, self.owner_id
        )
        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 1)
        self.assertEqual(
            response['subscription_list'][0]['creator_username'],
            self.OWNER_USERNAME,
        )
        self.logout()

    def test_exploration_progress_is_zero_for_new_explorations(self) -> None:
        """Test that progress is 0 for explorations with no checkpoint data."""
        self.login(self.VIEWER_EMAIL)

        # Create and publish an exploration with checkpoint.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Mark as incomplete without visiting checkpoints.
        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_1, exploration.init_state_name, 1
        )

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        incomplete_exps = response['incomplete_explorations_list']
        self.assertEqual(len(incomplete_exps), 1)
        self.assertEqual(incomplete_exps[0]['id'], self.EXP_ID_1)
        self.assertEqual(incomplete_exps[0]['visited_checkpoints_count'], 0)
        self.assertEqual(incomplete_exps[0]['total_checkpoints_count'], 1)

        self.logout()

    def test_exploration_progress_calculation_with_checkpoints(self) -> None:
        """Test that progress is correctly calculated based on checkpoints."""
        self.login(self.VIEWER_EMAIL)

        # Create exploration with checkpoint.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Mark as incomplete and record checkpoint progress.
        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_1, exploration.init_state_name, 1
        )

        # Record checkpoint progress (visited the only checkpoint).
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.viewer_id, self.EXP_ID_1),
            user_id=self.viewer_id,
            exploration_id=self.EXP_ID_1,
            most_recently_reached_checkpoint_state_name=exploration.init_state_name,
        ).put()

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        incomplete_exps = response['incomplete_explorations_list']
        self.assertEqual(len(incomplete_exps), 1)
        self.assertEqual(incomplete_exps[0]['visited_checkpoints_count'], 1)
        self.assertEqual(incomplete_exps[0]['total_checkpoints_count'], 1)

        self.logout()

    def test_completed_exploration_progress_is_100(self) -> None:
        """Test that completed explorations always show 100% progress."""
        self.login(self.VIEWER_EMAIL)

        # Create and publish an exploration.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Mark as completed.
        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1
        )

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        completed_exps = response['completed_explorations_list']
        self.assertEqual(len(completed_exps), 1)
        self.assertEqual(completed_exps[0]['id'], self.EXP_ID_1)
        self.assertEqual(completed_exps[0]['visited_checkpoints_count'], 0)
        self.assertEqual(completed_exps[0]['total_checkpoints_count'], 1)

        self.logout()

    def test_exploration_playlist_has_progress_field(self) -> None:
        """Test that exploration playlist items include progress field."""
        self.login(self.VIEWER_EMAIL)

        # Create and publish an exploration.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Add to playlist.
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_1
        )

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        playlist = response['exploration_playlist']
        self.assertEqual(len(playlist), 1)
        self.assertEqual(playlist[0]['id'], self.EXP_ID_1)
        self.assertEqual(playlist[0]['visited_checkpoints_count'], 0)
        self.assertEqual(playlist[0]['total_checkpoints_count'], 1)

        self.logout()

    def test_multiple_explorations_have_individual_progress(self) -> None:
        """Test that multiple explorations each have their own progress."""
        self.login(self.VIEWER_EMAIL)

        # Create three explorations with checkpoints.
        for i, exp_id in enumerate(
            [self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3]
        ):
            exploration = self.save_new_valid_exploration(
                exp_id,
                self.owner_id,
                title=f'Test Exploration {i+1}',
                category='Test',
            )
            exp_services.update_exploration(
                self.owner_id,
                exp_id,
                [
                    exp_domain.ExplorationChange(
                        {
                            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                            'state_name': exploration.init_state_name,
                            'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                            'new_value': True,
                        }
                    ),
                ],
                'Mark initial state as checkpoint',
            )
            self.publish_exploration(self.owner_id, exp_id)
            learner_progress_services.mark_exploration_as_incomplete(
                self.viewer_id, exp_id, exploration.init_state_name, 1
            )

        # Set different checkpoint progress for each.
        # EXP_ID_1: No checkpoint visited (0%)
        # EXP_ID_2: No checkpoint visited (0%)
        # EXP_ID_3: Visited the checkpoint (0% = floor((1-1)/1*100) = 0%)
        exp_3 = exp_fetchers.get_exploration_by_id(self.EXP_ID_3)
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.viewer_id, self.EXP_ID_3),
            user_id=self.viewer_id,
            exploration_id=self.EXP_ID_3,
            most_recently_reached_checkpoint_state_name=exp_3.init_state_name,
        ).put()

        response = self.get_json(feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL)
        incomplete_exps = response['incomplete_explorations_list']
        self.assertEqual(len(incomplete_exps), 3)

        # Find each exploration and check its checkpoint counts.
        exp_counts_map = {
            exp['id']: (
                exp['visited_checkpoints_count'],
                exp['total_checkpoints_count'],
            )
            for exp in incomplete_exps
        }
        self.assertEqual(exp_counts_map[self.EXP_ID_1], (0, 1))
        self.assertEqual(exp_counts_map[self.EXP_ID_2], (0, 1))
        self.assertEqual(exp_counts_map[self.EXP_ID_3], (1, 1))

        self.logout()

    def test_exploration_progress_with_missing_progress_data(self) -> None:
        """Test that progress is 0 when progress data is missing."""
        self.login(self.VIEWER_EMAIL)

        # Create and publish an exploration with checkpoint.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Mark as incomplete without visiting checkpoints.
        learner_progress_services.mark_exploration_as_incomplete(
            self.viewer_id, self.EXP_ID_1, exploration.init_state_name, 1
        )

        with self.swap_to_always_return(
            learner_progress_services,
            'get_checkpoint_progress_for_explorations',
            {},
        ):
            response = self.get_json(
                feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL
            )

        incomplete_exps = response['incomplete_explorations_list']
        self.assertEqual(len(incomplete_exps), 1)
        self.assertEqual(incomplete_exps[0]['visited_checkpoints_count'], 0)
        self.assertEqual(incomplete_exps[0]['total_checkpoints_count'], 0)

        self.logout()

    def test_completed_exploration_without_progress_data(self) -> None:
        """Test completed explorations when no progress data is available."""
        self.login(self.VIEWER_EMAIL)

        # Create and publish an exploration.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Mark as completed.
        learner_progress_services.mark_exploration_as_completed(
            self.viewer_id, self.EXP_ID_1
        )

        with self.swap_to_always_return(
            learner_progress_services,
            'get_checkpoint_progress_for_explorations',
            {},
        ):
            response = self.get_json(
                feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL
            )

        completed_exps = response['completed_explorations_list']
        self.assertEqual(len(completed_exps), 1)
        self.assertEqual(completed_exps[0]['visited_checkpoints_count'], 0)
        self.assertEqual(completed_exps[0]['total_checkpoints_count'], 0)

        self.logout()

    def test_exploration_playlist_without_progress_data(self) -> None:
        """Test exploration playlist when no progress data is available."""
        self.login(self.VIEWER_EMAIL)

        # Create and publish an exploration.
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1,
            self.owner_id,
            title=self.EXP_TITLE_1,
            category='Test',
        )
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID_1,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'state_name': exploration.init_state_name,
                        'property_name': exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT,
                        'new_value': True,
                    }
                ),
            ],
            'Mark initial state as checkpoint',
        )
        self.publish_exploration(self.owner_id, self.EXP_ID_1)

        # Add to playlist.
        learner_progress_services.add_exp_to_learner_playlist(
            self.viewer_id, self.EXP_ID_1
        )

        with self.swap_to_always_return(
            learner_progress_services,
            'get_checkpoint_progress_for_explorations',
            {},
        ):
            response = self.get_json(
                feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL
            )

        playlist = response['exploration_playlist']
        self.assertEqual(len(playlist), 1)
        self.assertEqual(playlist[0]['visited_checkpoints_count'], 0)
        self.assertEqual(playlist[0]['total_checkpoints_count'], 0)

        self.logout()
