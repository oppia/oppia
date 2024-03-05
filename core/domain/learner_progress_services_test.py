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

"""Tests for learner progress services."""

from __future__ import annotations

import datetime

from core.constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import learner_goals_services
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final, List, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class IncompleteExplorationDetailsDict(TypedDict):
    """Type for the incompletely played exploration's details dictionary."""

    timestamp: datetime.datetime
    state_name: str
    version: int


class LearnerProgressTests(test_utils.GenericTestBase):
    """Test the services related to tracking the progress of the learner."""

    EXP_ID_0: Final = '0_en_arch_bridges_in_england'
    EXP_ID_1: Final = '1_fi_arch_sillat_suomi'
    EXP_ID_2: Final = '2_en_welcome_introduce_oppia'
    EXP_ID_3: Final = '3_welcome_oppia'
    EXP_ID_4: Final = 'exp_4'
    EXP_ID_5: Final = 'exp_5'
    EXP_ID_6: Final = 'exp_6'
    EXP_ID_7: Final = 'exp_7'
    COL_ID_0: Final = '0_arch_bridges_in_england'
    COL_ID_1: Final = '1_welcome_introduce_oppia'
    COL_ID_2: Final = '2_welcome_introduce_oppia_interactions'
    COL_ID_3: Final = '3_welcome_oppia_collection'
    STORY_ID_0: Final = 'story_0'
    TOPIC_ID_0: Final = 'topic_0'
    STORY_ID_1: Final = 'story_1'
    STORY_ID_2: Final = 'story_2'
    STORY_ID_3: Final = 'story_3'
    TOPIC_ID_1: Final = 'topic_1'
    TOPIC_ID_2: Final = 'topic_2'
    TOPIC_ID_3: Final = 'topic_3'
    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        # Save a few explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_0)
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_id, title='Introduce Oppia',
            category='Welcome', language_code='en')
        self.publish_exploration(self.user_id, self.EXP_ID_2)
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id, title='Welcome Oppia',
            category='Welcome', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_3)
        self.save_new_valid_exploration(
            self.EXP_ID_4, self.owner_id, title='A title',
            category='Art', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_4)
        self.save_new_valid_exploration(
            self.EXP_ID_5, self.owner_id, title='Title',
            category='Art', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_5)
        self.save_new_valid_exploration(
            self.EXP_ID_6, self.owner_id, title='A title',
            category='Art', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_6)
        self.save_new_valid_exploration(
            self.EXP_ID_7, self.owner_id, title='A title',
            category='Art', language_code='en')
        self.publish_exploration(self.owner_id, self.EXP_ID_7)

        # Save a few collections.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Bridges',
            category='Architecture')
        self.publish_collection(self.owner_id, self.COL_ID_0)
        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Introduce Oppia',
            category='Welcome')
        self.publish_collection(self.owner_id, self.COL_ID_1)
        self.save_new_default_collection(
            self.COL_ID_2, self.user_id,
            title='Introduce Interactions in Oppia', category='Welcome')
        self.publish_collection(self.user_id, self.COL_ID_2)
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title='Welcome Oppia Collection',
            category='Welcome')
        self.publish_collection(self.owner_id, self.COL_ID_3)

        # Save new topics and stories.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_0, 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_0))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'dummy-fragment'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_0, self.owner_id, self.TOPIC_ID_0)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_0, self.STORY_ID_0)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_4,
                'node_id': 'node_1'
            })
        ]
        story_services.update_story(
            self.owner_id, self.STORY_ID_0, changelist, 'Added node.')

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic 1', 'abbrev-one', 'description 1', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title 1', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_1))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'fragment'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_5,
                'node_id': 'node_1'
            })
        ]

        story_services.update_story(
            self.owner_id, self.STORY_ID_1, changelist, 'Added Node 1.')

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_2, 'topic 2', 'abbrev-two', 'description 2', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title 1', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_2))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_2, self.owner_id, self.TOPIC_ID_2)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_2, self.STORY_ID_2)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_3, 'topic 3', 'abbrev-three', 'description 3',
            'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title 1', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_3))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_3, self.owner_id, self.TOPIC_ID_3)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_3, self.STORY_ID_3)

        # Publish topics and stories.
        topic_services.publish_story(
            self.TOPIC_ID_0, self.STORY_ID_0, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        topic_services.publish_story(
            self.TOPIC_ID_2, self.STORY_ID_2, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_2, self.admin_id)

        topic_services.publish_story(
            self.TOPIC_ID_3, self.STORY_ID_3, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_3, self.admin_id)

    def _get_all_completed_exp_ids(self, user_id: str) -> List[str]:
        """Gets the ids of all the explorations completed by the learner
        corresponding to the given user id.
        """
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get(
                user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if completed_activities_model:
            exploration_ids: List[str] = (
                completed_activities_model.exploration_ids
            )
            return exploration_ids
        else:
            return []

    def _get_all_completed_collection_ids(self, user_id: str) -> List[str]:
        """Gets the ids of all the collections completed by the learner
        corresponding to the given user id.
        """
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get(
                user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if completed_activities_model:
            collection_ids: List[str] = (
                completed_activities_model.collection_ids
            )
            return collection_ids
        else:
            return []

    def _get_all_completed_story_ids(self, user_id: str) -> List[str]:
        """Gets the ids of all the stories completed by the learner
        corresponding to the given user id.
        """
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get(
                user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if completed_activities_model:
            story_ids: List[str] = completed_activities_model.story_ids
            return story_ids
        else:
            return []

    def _get_all_learnt_topic_ids(self, user_id: str) -> List[str]:
        """Gets the ids of all the topics learnt by the learner
        corresponding to the given user id.
        """
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get(
                user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if completed_activities_model:
            learnt_topic_ids: List[str] = (
                completed_activities_model.learnt_topic_ids
            )
            return learnt_topic_ids
        else:
            return []

    def _get_all_incomplete_exp_ids(self, user_id: str) -> List[str]:
        """Gets the ids of all the explorations not fully completed by the
        learner corresponding to the given user id.
        """
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel.get(user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if incomplete_activities_model:
            exploration_ids: List[str] = (
                incomplete_activities_model.exploration_ids
            )
            return exploration_ids
        else:
            return []

    def _get_incomplete_exp_details(
        self, user_id: str, exploration_id: str
    ) -> IncompleteExplorationDetailsDict:
        """Returns the dict containing all the exploration details that are
        incompletely played by the learner corresponding to the given user id.
        """
        incomplete_exploration_user_model = (
            user_models.ExpUserLastPlaythroughModel.get(
                user_id, exploration_id))

        # Ruling out the possibility of None for mypy type checking.
        assert incomplete_exploration_user_model is not None
        return {
            'timestamp': (
                incomplete_exploration_user_model.last_updated),
            'state_name': (
                incomplete_exploration_user_model.last_played_state_name),
            'version': incomplete_exploration_user_model.last_played_exp_version
        }

    def _check_if_exp_details_match(
        self,
        actual_details: IncompleteExplorationDetailsDict,
        details_fetched_from_model: IncompleteExplorationDetailsDict
    ) -> None:
        """Verifies the exploration details fetched from the model matches the
        actual details.
        """
        self.assertEqual(
            actual_details['state_name'],
            details_fetched_from_model['state_name'])
        self.assertEqual(
            actual_details['version'],
            details_fetched_from_model['version'])
        # Due to the slight difference in the time in which we call the
        # get_current_time_in_millisecs function while testing, the times are
        # usually offset by  few seconds. Therefore we check if the difference
        # between the times is less than 10 seconds.
        self.assertLess((
            actual_details['timestamp'] -
            details_fetched_from_model['timestamp']).total_seconds(), 10)

    def _get_all_incomplete_collection_ids(self, user_id: str) -> List[str]:
        """Returns the list of all the collection ids that are incompletely
        played by the learner corresponding to the given user id.
        """
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel.get(user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if incomplete_activities_model:
            collection_ids: List[str] = (
                incomplete_activities_model.collection_ids
            )
            return collection_ids
        else:
            return []

    def _get_all_incomplete_story_ids(self, user_id: str) -> List[str]:
        """Returns the list of all the story ids that are incompletely
        played by the learner corresponding to the given user id.
        """
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel.get(user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if incomplete_activities_model:
            story_ids: List[str] = incomplete_activities_model.story_ids
            return story_ids
        else:
            return []

    def _get_all_partially_learnt_topic_ids(self, user_id: str) -> List[str]:
        """Returns the list of all the topics ids that are partially
        learnt by the learner corresponding to the given user id.
        """
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel.get(user_id, strict=False))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if incomplete_activities_model:
            learnt_topic_ids: List[str] = (
                incomplete_activities_model.partially_learnt_topic_ids
            )
            return learnt_topic_ids
        else:
            return []

    def test_mark_exploration_as_completed(self) -> None:
        self.assertEqual(self._get_all_completed_exp_ids(self.user_id), [])

        # Add an exploration to the completed list of a learner.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_completed_exp_ids(self.user_id), [self.EXP_ID_0])

        # Completing an exploration again has no effect.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            self._get_all_completed_exp_ids(self.user_id), [self.EXP_ID_0])

        state_name = 'state_name'
        version = 1

        # Add an exploration to the in progress list of the learner.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_1])
        # Add an exploration to the learner playlist of the learner.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_3])

        # Test that on adding an incomplete exploration to the completed list
        # it gets removed from the incomplete list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(self._get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

        # Test that on adding an exploration to the completed list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(self._get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [])

        # Test that an exploration created by the user is not added to the
        # completed list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_2)
        self.assertEqual(self._get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3])

    def test_mark_collection_as_completed(self) -> None:
        self.assertEqual(
            self._get_all_completed_collection_ids(self.user_id), [])

        # Add a collection to the completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Completing a collection again has no effect.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Add a collection to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_1])

        # If the collection is present in the incomplete list, on completion
        # it is removed from the incomplete list and added to the complete
        # list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Add a collection to the learner playlist of the learner.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_3])

        # Test that on adding a collection to the completed list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_3)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1, self.COL_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [])

        # Test that a collection created by the user is not added to the
        # completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_2)
        self.assertEqual(self._get_all_completed_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1, self.COL_ID_3])

    def test_mark_story_as_completed(self) -> None:
        self.assertEqual(
            self._get_all_completed_story_ids(self.user_id), [])

        # Add a story to the completed list.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [self.STORY_ID_0])

        # Completing a story again has no effect.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [self.STORY_ID_0])

        # Add a story to the incomplete list.
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_1])

        # If the story is present in the incomplete list, on completion
        # it is removed from the incomplete list and added to the complete
        # list.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [])
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

    def test_mark_topic_as_learnt(self) -> None:
        self.assertEqual(
            self._get_all_learnt_topic_ids(self.user_id), [])

        # Add a topic to the learnt list.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0])

        # Completing a topic again has no effect.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0])

        # Add a topic to the partially learnt list.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_1])

        # If the topic is present in the partially learnt list, on completion
        # it is removed from the partially learnt list and added to the learnt
        # list.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [])
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Marking a topic as learnt removes it from the topics to learn list.
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.user_id, self.TOPIC_ID_2)
        self.assertEqual(
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id), [self.TOPIC_ID_2])
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_2)
        self.assertEqual(
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id), [])

    def test_mark_exploration_as_incomplete(self) -> None:
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

        state_name = u'state name'
        version = 1

        exp_details: IncompleteExplorationDetailsDict = {
            'timestamp': datetime.datetime.utcnow(),
            'state_name': state_name,
            'version': version
        }

        # Add an exploration to the incomplete list of a learner.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0])
        self._check_if_exp_details_match(
            self._get_incomplete_exp_details(self.user_id, self.EXP_ID_0),
            exp_details)

        state_name = u'new_state_name'
        version = 2

        modified_exp_details: IncompleteExplorationDetailsDict = {
            'timestamp': datetime.datetime.utcnow(),
            'state_name': state_name,
            'version': version
        }

        # On adding an exploration again, its details are updated to the latest
        # version.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0])
        self._check_if_exp_details_match(
            self._get_incomplete_exp_details(self.user_id, self.EXP_ID_0),
            modified_exp_details)

        # If an exploration has already been completed, it is not added.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0])

        # Add an exploration to the learner playlist.
        learner_playlist_services.mark_exploration_to_be_played_later(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_3])

        # Test that on adding an exploration to the incomplete list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_3, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [])

        # Test that an exploration created by the user is not added to the
        # incomplete list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_2, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_3])

    def test_mark_collection_as_incomplete(self) -> None:
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])

        # Add a collection to the incomplete list of the learner.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Adding a collection again has no effect.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0])

        # If a collection has been completed, it is not added to the incomplete
        # list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0])

        # Add a collection to the learner playlist of the learner.
        learner_playlist_services.mark_collection_to_be_played_later(
            self.user_id, self.COL_ID_3)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_3])

        # Test that on adding a collection to the incomplete list, it gets
        # removed from the learner playlist.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_3)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_3])
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [])

        # Test that a collection created by the user is not added to the
        # incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_2)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_3])

    def test_record_story_started(self) -> None:
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [])

        # Add a story to the incomplete list of the learner.
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_0])

        # Adding a story again has no effect.
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_0])

        # If a story has been completed, it is not added to the incomplete
        # list.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_0])

    def test_record_topic_started(self) -> None:
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [])

        # Add a topic to the partially learnt list of the learner.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0])

        # Adding a topic again has no effect.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0])

        # If a topic has been learnt, it is not added to the partially learnt
        # list.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0])

    def test_remove_exp_from_incomplete_list(self) -> None:
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

        state_name: str = 'state name'
        version: int = 1

        # Add incomplete explorations.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        # Removing an exploration.
        learner_progress_services.remove_exp_from_incomplete_list(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_1])

        # Removing the same exploration again has no effect.
        learner_progress_services.remove_exp_from_incomplete_list(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [self.EXP_ID_1])

        # Removing the second exploration.
        learner_progress_services.remove_exp_from_incomplete_list(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(self._get_all_incomplete_exp_ids(
            self.user_id), [])

    def test_remove_collection_from_incomplete_list(self) -> None:
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])

        # Add two collections to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Remove one collection.
        learner_progress_services.remove_collection_from_incomplete_list(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_1])

        # Removing the same collection again has no effect.
        learner_progress_services.remove_collection_from_incomplete_list(
            self.user_id, self.COL_ID_0)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [self.COL_ID_1])

        # Removing another collection.
        learner_progress_services.remove_collection_from_incomplete_list(
            self.user_id, self.COL_ID_1)
        self.assertEqual(self._get_all_incomplete_collection_ids(
            self.user_id), [])

    def test_remove_story_from_incomplete_list(self) -> None:
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [])

        # Add two stories to the incomplete list.
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

        # Remove one story.
        learner_progress_services.remove_story_from_incomplete_list(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_1])

        # Removing the same story again has no effect.
        learner_progress_services.remove_story_from_incomplete_list(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [self.STORY_ID_1])

        # Removing another story.
        learner_progress_services.remove_story_from_incomplete_list(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_incomplete_story_ids(
            self.user_id), [])

    def test_remove_topic_from_partially_learnt_list(self) -> None:
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [])

        # Add two topics to the partially learnt list.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Remove one topic.
        learner_progress_services.remove_topic_from_partially_learnt_list(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_1])

        # Removing the same topic again has no effect.
        learner_progress_services.remove_topic_from_partially_learnt_list(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_1])

        # Removing another topic.
        learner_progress_services.remove_topic_from_partially_learnt_list(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_partially_learnt_topic_ids(
            self.user_id), [])

    def test_remove_story_from_completed_list(self) -> None:
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [])

        # Add two stories to the completed list.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

        # Remove one story.
        learner_progress_services.remove_story_from_completed_list(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [self.STORY_ID_1])

        # Removing the same story again has no effect.
        learner_progress_services.remove_story_from_completed_list(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [self.STORY_ID_1])

        # Removing another story.
        learner_progress_services.remove_story_from_completed_list(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(self._get_all_completed_story_ids(
            self.user_id), [])

    def test_remove_topic_from_learnt_list(self) -> None:
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [])

        # Add two topics to the learnt list.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Remove one topic.
        learner_progress_services.remove_topic_from_learnt_list(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_1])

        # Removing the same topic again has no effect.
        learner_progress_services.remove_topic_from_learnt_list(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [self.TOPIC_ID_1])

        # Removing another topic.
        learner_progress_services.remove_topic_from_learnt_list(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(self._get_all_learnt_topic_ids(
            self.user_id), [])

    def test_get_all_completed_exp_ids(self) -> None:
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [])

        # Add an exploration to the completed list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0])

        # Add another exploration.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(learner_progress_services.get_all_completed_exp_ids(
            self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

    def test_unpublishing_completed_exploration_filters_it_out(self) -> None:
        # Add explorations to the completed list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3])

        # Unpublish EXP_ID_3 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_exploration(system_user, self.EXP_ID_3)
        private_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_3)
        self.assertEqual(
            private_exploration.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        completed_exp_summaries = (
            all_filtered_summaries.completed_exp_summaries)

        # Test that completed exp summaries don't include private exploration.
        # Ensure that completed_exp_summaries[0] matches EXP_ID_0.
        self.assertEqual(
            completed_exp_summaries[0].id, '0_en_arch_bridges_in_england')
        # Ensure that completed_exp_summaries[1] matches EXP_ID_1.
        self.assertEqual(
            completed_exp_summaries[1].id, '1_fi_arch_sillat_suomi')
        self.assertEqual(len(completed_exp_summaries), 2)

    def test_republishing_completed_exploration_filters_as_complete(
        self
    ) -> None:
        # Add exploration to the completed list.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Unpublish EXP_ID_0 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_exploration(system_user, self.EXP_ID_0)
        private_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_0)
        self.assertEqual(
            private_exploration.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        completed_exp_summaries = (
            all_filtered_summaries.completed_exp_summaries)
        # Test that completed exp summaries don't include private exploration.
        self.assertEqual(len(completed_exp_summaries), 0)

        # Republish EXP_ID_0 to change status back to ACTIVITY_STATUS_PUBLIC.
        self.publish_exploration(self.owner_id, self.EXP_ID_0)
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        public_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_0)
        self.assertEqual(
            public_exploration.status, constants.ACTIVITY_STATUS_PUBLIC)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        completed_exp_summaries = (
            all_filtered_summaries.completed_exp_summaries)
        # Test that completed exp summaries includes original EXP_ID_0.
        self.assertEqual(
            completed_exp_summaries[0].id, '0_en_arch_bridges_in_england')
        self.assertEqual(len(completed_exp_summaries), 1)

    def test_get_all_completed_collection_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [])

        # Add a collection to the completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Add another collection.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

    def test_get_all_completed_story_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_completed_story_ids(
                self.user_id), [])

        # Add a story to the completed list.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_completed_story_ids(
                self.user_id), [self.STORY_ID_0])

        # Add another story.
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_completed_story_ids(
                self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

    def test_get_all_learnt_topic_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id), [])

        # Add a topic to the learnt list.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0])

        # Add another topic.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

    def test_unpublishing_completed_collection_filters_it_out(self) -> None:
        # Add collections to the completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_1)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_3)
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1, self.COL_ID_3])

        # Unpublish COL_ID_3 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_collection(system_user, self.COL_ID_3)
        private_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_3)
        # Ruling out the possibility of None for mypy type checking.
        assert private_collection is not None
        self.assertEqual(
            private_collection.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        completed_collection_summaries = (
            all_filtered_summaries.completed_collection_summaries)

        # Test that completed col summaries don't include private collection.
        # Ensure that completed_collection_summaries[0] matches COL_ID_0.
        self.assertEqual(
            completed_collection_summaries[0].id, '0_arch_bridges_in_england')
        # Ensure that completed_collection_summaries[1] matches COL_ID_1.
        self.assertEqual(
            completed_collection_summaries[1].id, '1_welcome_introduce_oppia')
        self.assertEqual(len(completed_collection_summaries), 2)

    def test_republishing_completed_collection_filters_as_complete(
        self
    ) -> None:
        # Add collection to the completed list.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_completed_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Unpublish COL_ID_0 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_collection(system_user, self.COL_ID_0)
        private_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert private_collection is not None
        self.assertEqual(
            private_collection.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        completed_collection_summaries = (
            all_filtered_summaries.completed_collection_summaries)
        # Test that completed col summaries don't include private collection.
        self.assertEqual(len(completed_collection_summaries), 0)

        # Republish COL_ID_0 to change status back to ACTIVITY_STATUS_PUBLIC.
        self.publish_collection(self.owner_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        public_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert public_collection is not None
        self.assertEqual(
            public_collection.status, constants.ACTIVITY_STATUS_PUBLIC)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        completed_collection_summaries = (
            all_filtered_summaries.completed_collection_summaries)
        # Test that completed col summaries includes original COL_ID_0.
        self.assertEqual(
            completed_collection_summaries[0].id, '0_arch_bridges_in_england')
        self.assertEqual(len(completed_collection_summaries), 1)

    def test_unpublishing_completed_story_filters_it_out(self) -> None:
        # Add stories to the completed list.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_1, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_completed_story_ids(
                self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

        # Unpublish STORY_ID_1.
        topic_services.unpublish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        completed_story_summaries = (
            all_filtered_summaries.completed_story_summaries)

        # Test that completed story summaries don't include unpublished
        # stories. Ensure that completed_story_summaries[0] matches
        # STORY_ID_0.
        self.assertEqual(
            completed_story_summaries[0].id, self.STORY_ID_0)
        self.assertEqual(len(completed_story_summaries), 1)

    def test_unpublishing_learnt_topic_filters_it_out(self) -> None:
        # Add topics to the learnt list.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_1, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Unpublish TOPIC_ID_1.
        topic_services.unpublish_topic(self.TOPIC_ID_1, self.admin_id)
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID_1)
        self.assertEqual(
            topic_rights.topic_is_published, False)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        learnt_topic_summaries = (
            all_filtered_summaries.learnt_topic_summaries)

        # Test that learnt topic summaries don't include unpublished
        # topics. Ensure that learnt_topic_summaries[0] matches
        # TOPIC_ID_0.
        self.assertEqual(
            learnt_topic_summaries[0].id, self.TOPIC_ID_0)
        self.assertEqual(len(learnt_topic_summaries), 1)

    def test_deleting_a_story_filters_it_out_from_completed_list(self) -> None:
        # Add stories to the completed list.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_1, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_completed_story_ids(
                self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

        # Delete STORY_ID_1.
        story_services.delete_story(self.admin_id, self.STORY_ID_1)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        completed_story_summaries = (
            all_filtered_summaries.completed_story_summaries)

        # Test that completed story summaries don't include deleted
        # stories. Ensure that completed_story_summaries[0] matches
        # STORY_ID_0.
        self.assertEqual(
            completed_story_summaries[0].id, self.STORY_ID_0)
        self.assertEqual(len(completed_story_summaries), 1)

    def test_deleting_a_topic_filters_it_out_from_learnt_list(self) -> None:
        # Add topics to the learnt list.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_1, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Delete TOPIC_ID_1.
        topic_services.delete_topic(self.admin_id, self.TOPIC_ID_1)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        learnt_topic_summaries = (
            all_filtered_summaries.learnt_topic_summaries)

        # Test that learnt topic summaries don't include deleted
        # topics. Ensure that learnt_topic_summaries[0] matches
        # TOPIC_ID_0.
        self.assertEqual(
            learnt_topic_summaries[0].id, self.TOPIC_ID_0)
        self.assertEqual(len(learnt_topic_summaries), 1)

    def test_get_all_incomplete_exp_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [])

        state_name = 'state name'
        version = 1

        # Add an exploration to the incomplete list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Add another exploration.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

    def test_unpublishing_incomplete_exploration_filters_it_out(self) -> None:
        state_name = 'state name'
        version = 1

        # Add explorations to the incomplete list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_3, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_3])

        # Unpublish EXP_ID_3 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_exploration(system_user, self.EXP_ID_3)
        private_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_3)
        self.assertEqual(
            private_exploration.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        incomplete_exp_summaries = (
            all_filtered_summaries.incomplete_exp_summaries)

        # Test that incomplete exp summaries don't include private exploration.
        # Ensure that incomplete_exp_summaries[0] matches EXP_ID_0.
        self.assertEqual(
            incomplete_exp_summaries[0].id, '0_en_arch_bridges_in_england')
        # Ensure that incomplete_exp_summaries[1] matches EXP_ID_1.
        self.assertEqual(
            incomplete_exp_summaries[1].id, '1_fi_arch_sillat_suomi')
        self.assertEqual(len(incomplete_exp_summaries), 2)

    def test_republishing_incomplete_exploration_filters_as_incomplete(
        self
    ) -> None:
        state_name = 'state name'
        version = 1

        # Add exploration to the incomplete list.
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id), [self.EXP_ID_0])

        # Unpublish EXP_ID_0 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_exploration(system_user, self.EXP_ID_0)
        private_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_0)
        self.assertEqual(
            private_exploration.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        incomplete_exp_summaries = (
            all_filtered_summaries.incomplete_exp_summaries)
        # Test that incomplete exp summaries don't include private exploration.
        self.assertEqual(len(incomplete_exp_summaries), 0)

        # Republish EXP_ID_0 to change status back to ACTIVITY_STATUS_PUBLIC.
        self.publish_exploration(self.owner_id, self.EXP_ID_0)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_0, state_name, version)
        public_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_0)
        self.assertEqual(
            public_exploration.status, constants.ACTIVITY_STATUS_PUBLIC)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        incomplete_exp_summaries = (
            all_filtered_summaries.incomplete_exp_summaries)
        # Test that incomplete exp summaries includes original EXP_ID_0.
        self.assertEqual(
            incomplete_exp_summaries[0].id, '0_en_arch_bridges_in_england')
        self.assertEqual(len(incomplete_exp_summaries), 1)

    def test_get_all_incomplete_collection_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [])

        # Add a collection to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Add another collection.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

    def test_get_all_incomplete_story_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id), [])

        # Add a story to the incomplete list.
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id), [self.STORY_ID_0])

        # Add another story.
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id), [self.STORY_ID_0, self.STORY_ID_1])

    def test_get_all_partially_learnt_topic_ids(self) -> None:
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [])

        # Add a topic to the partially learnt list.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0])

        # Add another topic.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

    def test_get_all_and_untracked_topic_ids(self) -> None:
        # Add topics to config_domain.
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'url_fragment': 'math',
            'topic_ids': [self.TOPIC_ID_0, self.TOPIC_ID_1],
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

        self.login(self.USER_EMAIL)
        partially_learnt_topic_ids = (
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id))
        learnt_topic_ids = (
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id))
        topic_ids_to_learn = (
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id))
        all_topics, untracked_topics = (
            learner_progress_services.get_all_and_untracked_topic_ids_for_user(
                partially_learnt_topic_ids, learnt_topic_ids,
                topic_ids_to_learn))
        self.assertEqual(len(all_topics), 2)
        self.assertEqual(len(untracked_topics), 2)

        # Mark one topic as partially learnt.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        partially_learnt_topic_ids = (
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id))
        learnt_topic_ids = (
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id))
        topic_ids_to_learn = (
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id))
        all_topics, untracked_topics = (
            learner_progress_services.get_all_and_untracked_topic_ids_for_user(
                partially_learnt_topic_ids, learnt_topic_ids,
                topic_ids_to_learn))
        self.assertEqual(len(all_topics), 2)
        self.assertEqual(len(untracked_topics), 1)

        # Mark one topic as learnt.
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)
        partially_learnt_topic_ids = (
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id))
        learnt_topic_ids = (
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id))
        topic_ids_to_learn = (
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id))
        all_topics, untracked_topics = (
            learner_progress_services.get_all_and_untracked_topic_ids_for_user(
                partially_learnt_topic_ids, learnt_topic_ids,
                topic_ids_to_learn))
        self.assertEqual(len(all_topics), 2)
        self.assertEqual(len(untracked_topics), 0)

    def test_unpublishing_incomplete_collection_filters_it_out(self) -> None:
        # Add collections to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_3)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0, self.COL_ID_1, self.COL_ID_3])

        # Unpublish COL_ID_3 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_collection(system_user, self.COL_ID_3)
        private_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_3)
        # Ruling out the possibility of None for mypy type checking.
        assert private_collection is not None
        self.assertEqual(
            private_collection.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        incomplete_collection_summaries = (
            all_filtered_summaries.incomplete_collection_summaries)

        # Test that incomplete col summaries don't include private collection.
        # Ensure that incomplete_collection_summaries[0] matches COL_ID_0.
        self.assertEqual(
            incomplete_collection_summaries[0].id, '0_arch_bridges_in_england')
        # Ensure that incomplete_collection_summaries[1] matches COL_ID_1.
        self.assertEqual(
            incomplete_collection_summaries[1].id, '1_welcome_introduce_oppia')
        self.assertEqual(len(incomplete_collection_summaries), 2)

    def test_republishing_incomplete_collection_filters_as_incomplete(
        self
    ) -> None:
        # Add collection to the incomplete list.
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_incomplete_collection_ids(
                self.user_id), [self.COL_ID_0])

        # Unpublish COL_ID_0 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_collection(system_user, self.COL_ID_0)
        private_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert private_collection is not None
        self.assertEqual(
            private_collection.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        incomplete_collection_summaries = (
            all_filtered_summaries.incomplete_collection_summaries)
        # Test that incomplete col summaries don't include private collection.
        self.assertEqual(len(incomplete_collection_summaries), 0)

        # Republish COL_ID_0 to change status back to ACTIVITY_STATUS_PUBLIC.
        self.publish_collection(self.owner_id, self.COL_ID_0)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_0)
        public_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert public_collection is not None
        self.assertEqual(
            public_collection.status, constants.ACTIVITY_STATUS_PUBLIC)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        incomplete_collection_summaries = (
            all_filtered_summaries.incomplete_collection_summaries)
        # Test that incomplete col summaries includes original COL_ID_0.
        self.assertEqual(
            incomplete_collection_summaries[0].id, '0_arch_bridges_in_england')
        self.assertEqual(len(incomplete_collection_summaries), 1)

    def test_unpublishing_partially_learnt_topic_filters_it_out(self) -> None:
        # Add topics to the partially learnt list.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Unpublish TOPIC_ID_1.
        topic_services.unpublish_topic(self.TOPIC_ID_1, self.admin_id)
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID_1)
        self.assertEqual(
            topic_rights.topic_is_published, False)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        partially_learnt_topic_summaries = (
            all_filtered_summaries.partially_learnt_topic_summaries)

        # Test that partially learnt topic summaries don't include private
        # topics. Ensure that partially_learnt_topic_summaries[0] matches
        # TOPIC_ID_0.
        self.assertEqual(
            partially_learnt_topic_summaries[0].id, self.TOPIC_ID_0)
        self.assertEqual(len(partially_learnt_topic_summaries), 1)

    def test_republishing_partially_learnt_topic_filters_as_incomplete(
        self
    ) -> None:
        # Add topic to the partially learnt list.
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id), [self.TOPIC_ID_0])

        # Unpublish TOPIC_ID_0.
        topic_services.unpublish_topic(self.TOPIC_ID_0, self.admin_id)
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID_0)
        self.assertEqual(
            topic_rights.topic_is_published, False)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        partially_learnt_topic_summaries = (
            all_filtered_summaries.partially_learnt_topic_summaries)
        # Test that partially learnt topic summaries don't include unpublished
        # topic.
        self.assertEqual(len(partially_learnt_topic_summaries), 0)

        # Republish TOPIC_ID_0.
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        topic_rights = topic_fetchers.get_topic_rights(self.TOPIC_ID_0)
        self.assertEqual(
            topic_rights.topic_is_published, True)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        partially_learnt_topic_summaries = (
            all_filtered_summaries.partially_learnt_topic_summaries)
        # Test that partially learnt topic summaries includes original
        # TOPIC_ID_0.
        self.assertEqual(
            partially_learnt_topic_summaries[0].id, self.TOPIC_ID_0)
        self.assertEqual(len(partially_learnt_topic_summaries), 1)

    def test_removes_a_topic_from_topics_to_learn_list_when_topic_is_learnt(
        self
    ) -> None:
        self.assertEqual(
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id), [])
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.user_id, self.TOPIC_ID_0)
        self.assertEqual(
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id), [self.TOPIC_ID_0])

        # Complete the story in TOPIC_ID_0.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        topics_to_learn = (
            all_filtered_summaries.topics_to_learn_summaries)

        # Test that topics to learn doesn't include completed topic.
        self.assertEqual(len(topics_to_learn), 0)

    def test_unpublishing_topic_filters_it_out_from_topics_to_learn(
        self
    ) -> None:
        # Add topics to learn section of the learner goals.
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.user_id, self.TOPIC_ID_0)
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.user_id, self.TOPIC_ID_1)
        self.assertEqual(
            learner_goals_services.get_all_topic_ids_to_learn(
                self.user_id), [self.TOPIC_ID_0, self.TOPIC_ID_1])

        # Unpublish TOPIC_ID_0.
        topic_services.unpublish_topic(self.TOPIC_ID_0, self.admin_id)

        # Call get_topics_and_stories_progress to get filtered progress.
        user_activity = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))
        all_filtered_summaries = user_activity[0]
        topics_to_learn = (
            all_filtered_summaries.topics_to_learn_summaries)

        # Test that topics to learn doesn't include unpublished topic.
        self.assertEqual(
            topics_to_learn[0].id, 'topic_1')
        self.assertEqual(len(topics_to_learn), 1)

    def test_unpublishing_exploration_filters_it_out_from_playlist(
        self
    ) -> None:
        # Add activities to the playlist section.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_0, self.EXP_ID_1])

        # Unpublish EXP_ID_1 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_exploration(system_user, self.EXP_ID_1)
        private_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_1)
        self.assertEqual(
            private_exploration.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        exploration_playlist = (
            all_filtered_summaries.exploration_playlist_summaries)

        # Test that exploration_playlist doesn't include private exploration.
        self.assertEqual(
            exploration_playlist[0].id, '0_en_arch_bridges_in_england')
        self.assertEqual(len(exploration_playlist), 1)

    def test_republishing_exploration_keeps_it_in_exploration_playlist(
        self
    ) -> None:
        # Add activity to the playlist section.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        self.assertEqual(
            learner_playlist_services.get_all_exp_ids_in_learner_playlist(
                self.user_id), [self.EXP_ID_0])

        # Unpublish EXP_ID_0 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_exploration(system_user, self.EXP_ID_0)
        private_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_0)
        self.assertEqual(
            private_exploration.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        exploration_playlist = (
            all_filtered_summaries.exploration_playlist_summaries)
        # Test that exploration_playlist doesn't include private exploration.
        self.assertEqual(len(exploration_playlist), 0)

        # Republish EXP_ID_0 to change status back to ACTIVITY_STATUS_PUBLIC.
        self.publish_exploration(self.owner_id, self.EXP_ID_0)
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_0)
        public_exploration = exp_fetchers.get_exploration_summary_by_id(
            self.EXP_ID_0)
        self.assertEqual(
            public_exploration.status, constants.ACTIVITY_STATUS_PUBLIC)

        # Call get_exploration_progress to get filtered progress.
        user_activity = learner_progress_services.get_exploration_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        exploration_playlist = (
            all_filtered_summaries.exploration_playlist_summaries)
        # Test that exploration_playlist includes original EXP_ID_0.
        self.assertEqual(
            exploration_playlist[0].id, '0_en_arch_bridges_in_england')
        self.assertEqual(len(exploration_playlist), 1)

    def test_unpublishing_collection_filters_it_out_from_playlist(self) -> None:
        # Add activities to the playlist section.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_1)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_0, self.COL_ID_1])

        # Unpublish COL_ID_1 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_collection(system_user, self.COL_ID_1)
        private_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_1)
        # Ruling out the possibility of None for mypy type checking.
        assert private_collection is not None
        self.assertEqual(
            private_collection.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        collection_playlist = (
            all_filtered_summaries.collection_playlist_summaries)

        # Test that collection_playlist doesn't include private collection.
        self.assertEqual(
            collection_playlist[0].id, '0_arch_bridges_in_england')
        self.assertEqual(len(collection_playlist), 1)

    def test_republishing_collection_keeps_it_in_collection_playlist(
        self
    ) -> None:
        # Add activity to the playlist section.
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        self.assertEqual(
            learner_playlist_services.get_all_collection_ids_in_learner_playlist( # pylint: disable=line-too-long
                self.user_id), [self.COL_ID_0])

        # Unpublish COL_ID_0 to change status to ACTIVITY_STATUS_PRIVATE.
        system_user = user_services.get_system_user()
        rights_manager.unpublish_collection(system_user, self.COL_ID_0)
        private_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert private_collection is not None
        self.assertEqual(
            private_collection.status, constants.ACTIVITY_STATUS_PRIVATE)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        collection_playlist = (
            all_filtered_summaries.collection_playlist_summaries)
        # Test that collection_playlist doesn't include private collection.
        self.assertEqual(len(collection_playlist), 0)

        # Republish COL_ID_0 to change status back to ACTIVITY_STATUS_PUBLIC.
        self.publish_collection(self.owner_id, self.COL_ID_0)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_0)
        public_collection = collection_services.get_collection_summary_by_id(
            self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert public_collection is not None
        self.assertEqual(
            public_collection.status, constants.ACTIVITY_STATUS_PUBLIC)

        # Call get_collection_progress to get filtered progress.
        user_activity = learner_progress_services.get_collection_progress(
            self.user_id)
        all_filtered_summaries = user_activity[0]
        collection_playlist = (
            all_filtered_summaries.collection_playlist_summaries)
        # Test that collection_playlist includes original COL_ID_0.
        self.assertEqual(
            collection_playlist[0].id, '0_arch_bridges_in_england')
        self.assertEqual(len(collection_playlist), 1)

    def test_get_ids_of_activities_in_learner_dashboard(self) -> None:
        # Add activities to the completed section.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)

        # Add activities to the incomplete section.
        state_name = 'state name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)

        # Add activities to the playlist section.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_3)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_3)

        # Add topics to the learn section of the learner goals.
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.user_id, self.TOPIC_ID_2)

        # Get the ids of all the activities.
        activity_ids = (
            learner_progress_services.get_learner_dashboard_activities(
                self.user_id))

        self.assertEqual(
            activity_ids.completed_exploration_ids, [self.EXP_ID_0])
        self.assertEqual(
            activity_ids.completed_collection_ids, [self.COL_ID_0])
        self.assertEqual(
            activity_ids.completed_story_ids, [self.STORY_ID_0])
        self.assertEqual(
            activity_ids.learnt_topic_ids, [self.TOPIC_ID_0])
        self.assertEqual(
            activity_ids.incomplete_exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            activity_ids.incomplete_collection_ids, [self.COL_ID_1])
        self.assertEqual(
            activity_ids.partially_learnt_topic_ids, [self.TOPIC_ID_1])
        self.assertEqual(
            activity_ids.topic_ids_to_learn, [self.TOPIC_ID_2])
        self.assertEqual(
            activity_ids.exploration_playlist_ids, [self.EXP_ID_3])
        self.assertEqual(
            activity_ids.collection_playlist_ids, [self.COL_ID_3])

    def test_get_all_activity_progress(self) -> None:
        # Add topics to config_domain.
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        new_config_value = [{
            'name': 'math',
            'url_fragment': 'math',
            'topic_ids': [self.TOPIC_ID_3],
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

        # Add activities to the completed section.
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_0)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)

        # Add activities to the incomplete section.
        state_name = 'state name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, self.COL_ID_1)
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)

        # Add activities to the playlist section.
        learner_progress_services.add_exp_to_learner_playlist(
            self.user_id, self.EXP_ID_3)
        learner_progress_services.add_collection_to_learner_playlist(
            self.user_id, self.COL_ID_3)

        # Add topics to the learn section of the learner goals.
        learner_progress_services.validate_and_add_topic_to_learn_goal(
            self.user_id, self.TOPIC_ID_2)

        # Get the progress of the user.
        exploration_progress = (
            learner_progress_services.get_exploration_progress(
                self.user_id))
        collection_progress = (
            learner_progress_services.get_collection_progress(
                self.user_id))
        topics_and_stories_progress = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))

        incomplete_exp_summaries = (
            exploration_progress[0].incomplete_exp_summaries)
        incomplete_collection_summaries = (
            collection_progress[0].incomplete_collection_summaries)
        partially_learnt_topic_summaries = (
            topics_and_stories_progress[0].partially_learnt_topic_summaries)
        completed_exp_summaries = (
            exploration_progress[0].completed_exp_summaries)
        completed_collection_summaries = (
            collection_progress[0].completed_collection_summaries)
        completed_story_summaries = (
            topics_and_stories_progress[0].completed_story_summaries)
        learnt_topic_summaries = (
            topics_and_stories_progress[0].learnt_topic_summaries)
        topics_to_learn_summaries = (
            topics_and_stories_progress[0].topics_to_learn_summaries)
        all_topic_summaries = (
            topics_and_stories_progress[0].all_topic_summaries)
        untracked_topic_summaries = (
            topics_and_stories_progress[0].untracked_topic_summaries)
        exploration_playlist_summaries = (
            exploration_progress[0].exploration_playlist_summaries)
        collection_playlist_summaries = (
            collection_progress[0].collection_playlist_summaries)

        self.assertEqual(len(incomplete_exp_summaries), 1)
        self.assertEqual(len(incomplete_collection_summaries), 1)
        self.assertEqual(len(partially_learnt_topic_summaries), 1)
        self.assertEqual(len(completed_exp_summaries), 1)
        self.assertEqual(len(completed_collection_summaries), 1)
        self.assertEqual(len(completed_story_summaries), 1)
        self.assertEqual(len(learnt_topic_summaries), 1)
        self.assertEqual(len(topics_to_learn_summaries), 1)
        self.assertEqual(len(all_topic_summaries), 1)
        self.assertEqual(len(untracked_topic_summaries), 1)
        self.assertEqual(len(exploration_playlist_summaries), 1)
        self.assertEqual(len(collection_playlist_summaries), 1)

        self.assertEqual(
            incomplete_exp_summaries[0].title, 'Sillat Suomi')
        self.assertEqual(
            incomplete_collection_summaries[0].title, 'Introduce Oppia')
        self.assertEqual(
            partially_learnt_topic_summaries[0].name, 'topic 1')
        self.assertEqual(
            completed_exp_summaries[0].title, 'Bridges in England')
        self.assertEqual(
            completed_collection_summaries[0].title, 'Bridges')
        self.assertEqual(
            completed_story_summaries[0].title, 'Title')
        self.assertEqual(
            learnt_topic_summaries[0].name, 'topic')
        self.assertEqual(
            topics_to_learn_summaries[0].name, 'topic 2')
        self.assertEqual(
            untracked_topic_summaries[0].name, 'topic 3')
        self.assertEqual(
            all_topic_summaries[0].name, 'topic 3')
        self.assertEqual(
            exploration_playlist_summaries[0].title, 'Welcome Oppia')
        self.assertEqual(
            collection_playlist_summaries[0].title, 'Welcome Oppia Collection')

        # Delete an exploration in the completed section.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_0)
        # Delete an exploration in the incomplete section.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_1)
        # Delete an exploration in the playlist section.
        exp_services.delete_exploration(self.owner_id, self.EXP_ID_3)
        # Add an exploration to a collection that has already been completed.
        collection_services.update_collection(
            self.owner_id, self.COL_ID_0, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': self.EXP_ID_2
            }], 'Add new exploration')

        # Delete a topic in the learn section of the learner goals.
        topic_services.delete_topic(self.owner_id, self.TOPIC_ID_2)

        # Add a node to a story that has already been completed.
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_2',
                'title': 'Title 2'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_6,
                'node_id': 'node_2'
            })
        ]

        # Update the story.
        story_services.update_story(
            self.owner_id, self.STORY_ID_0, changelist, 'Added node.')

        # Get the progress of the user.
        exploration_progress = (
            learner_progress_services.get_exploration_progress(
                self.user_id))
        collection_progress = (
            learner_progress_services.get_collection_progress(
                self.user_id))
        topics_and_stories_progress = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))

        # Check that the exploration is no longer present in the incomplete
        # section.
        self.assertEqual(
            len(exploration_progress[0].incomplete_exp_summaries), 0)
        # Check that the dashboard records the exploration deleted in the
        # completed section.
        self.assertEqual(exploration_progress[1]['completed_explorations'], 1)
        # Check that the dashboard records the exploration deleted in the
        # incomplete section.
        self.assertEqual(exploration_progress[1]['incomplete_explorations'], 1)
        # Check that the dashboard records the exploration deleted in the
        # playlist section.
        self.assertEqual(exploration_progress[1]['exploration_playlist'], 1)

        # Check that the dashboard records the topic deleted in the learn
        # section of the learner goals.
        self.assertEqual(topics_and_stories_progress[1]['topics_to_learn'], 1)

        incomplete_collection_summaries = (
            collection_progress[0].incomplete_collection_summaries)
        completed_story_summaries = (
            topics_and_stories_progress[0].completed_story_summaries)
        partially_learnt_topic_summaries = (
            topics_and_stories_progress[0].partially_learnt_topic_summaries)

        # Check that the collection to which a new exploration has been added
        # has been moved to the incomplete section.
        self.assertEqual(len(incomplete_collection_summaries), 2)
        self.assertEqual(incomplete_collection_summaries[1].title, 'Bridges')

        # Now suppose the user has completed the collection. It should be added
        # back to the completed section.
        learner_progress_services.mark_collection_as_completed(
            self.user_id, self.COL_ID_0)

        # Check that the story to which a new node has been added has been
        # removed from completed section.
        self.assertEqual(len(completed_story_summaries), 0)

        # Check that the topic in which a node has been added to one of
        # its stories has been moved to the incomplete section.
        self.assertEqual(len(partially_learnt_topic_summaries), 2)
        self.assertEqual(partially_learnt_topic_summaries[1].name, 'topic')

        # Delete a collection in the completed section.
        collection_services.delete_collection(self.owner_id, self.COL_ID_0)
        # Delete a collection in the incomplete section.
        collection_services.delete_collection(self.owner_id, self.COL_ID_1)
        # Delete a collection in the playlist section.
        collection_services.delete_collection(self.owner_id, self.COL_ID_3)

        # Delete a topic from incomplete section.
        topic_services.delete_topic(self.admin_id, self.TOPIC_ID_0)

        # Get the progress of the user.
        collection_progress = (
            learner_progress_services.get_collection_progress(
                self.user_id))
        topics_and_stories_progress = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id))

        # Check that the dashboard records the collection deleted in the
        # completed section.
        self.assertEqual(collection_progress[1]['completed_collections'], 1)
        # Check that the dashboard records the collection deleted in the
        # incomplete section.
        self.assertEqual(collection_progress[1]['incomplete_collections'], 1)
        # Check that the dashboard records the collection deleted in the
        # playlist section.
        self.assertEqual(collection_progress[1]['collection_playlist'], 1)

        # Check that the dashboard records the topic deleted in the incomplete
        # section.
        self.assertEqual(
            topics_and_stories_progress[1]['partially_learnt_topics'], 1)
