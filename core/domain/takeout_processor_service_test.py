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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json
from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import takeout_processor_service
from core.platform import models
from core.tests import test_utils
import feconf


(user_models, collection_models, exploration_models, story_models,
 feedback_models, suggestion_models,
 email_models) = models.Registry.import_models([
    models.NAMES.user, models.NAMES.collection, models.NAMES.exploration,
    models.NAMES.story, models.NAMES.feedback, models.NAMES.suggestion,
    models.NAMES.email])


class TakeoutProcessorServiceTests(test_utils.GenericTestBase):
    """Tests for the takeout processor service."""

    USER_ID_1 = 'user_1'
    USER_1_ROLE = feconf.ROLE_ID_ADMIN
    USER_1_EMAIL = 'user1@example.com'
    GENERIC_USERNAME = 'user'
    GENERIC_DATE = datetime.datetime(2019, 5, 20)
    GENERIC_IMAGE_URL = 'www.example.com/example.png'
    GENERIC_USER_BIO = 'I am a user of Oppia!'
    GENERIC_SUBJECT_INTERESTS = ['Math', 'Science']
    GENERIC_LANGUAGE_CODES = ['en', 'es']
    USER_1_IMPACT_SCORE = 0.87
    USER_1_TOTAL_PLAYS = 33
    USER_1_AVERAGE_RATINGS = 4.37
    USER_1_NUM_RATINGS = 22
    USER_1_WEEKLY_CREATOR_STATS_LIST = [
        {
            ('2019-05-21'): {
                'average_ratings': 4.00,
                'total_plays': 5
            }
        },
        {
            ('2019-05-28'): {
                'average_ratings': 4.95,
                'total_plays': 10
            }
        }
    ]
    EXPLORATION_IDS = ['exp_1']
    CREATOR_IDS = ['4', '8', '16']
    COLLECTION_IDS = ['23', '42', '4']
    ACTIVITY_IDS = ['8', '16', '23']
    GENERAL_FEEDBACK_THREAD_IDS = ['42', '4', '8']
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    DEGREE_OF_MASTERY = 0.5
    EXP_VERSION = 1
    STATE_NAME = 'state_name'
    STORY_ID_1 = 'story_id_1'
    COMPLETED_NODE_IDS_1 = ['node_id_1', 'node_id_2']
    THREAD_ENTITY_TYPE = feconf.ENTITY_TYPE_EXPLORATION
    THREAD_ENTITY_ID = 'exp_id_2'
    THREAD_STATUS = 'open'
    THREAD_SUBJECT = 'dummy subject'
    THREAD_HAS_SUGGESTION = True
    THREAD_SUMMARY = 'This is a great summary.'
    THREAD_MESSAGE_COUNT = 0
    MESSAGE_TEXT = 'Export test text.'
    MESSAGE_RECEIEVED_VIA_EMAIL = False
    CHANGE_CMD = {}
    SCORE_CATEGORY = (
        suggestion_models.SCORE_TYPE_TRANSLATION +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'English')

    def setUp(self):
        """Set up all models for use in testing."""
        super(TakeoutProcessorServiceTests, self).setUp()
        # Setup for UserStatsModel.
        user_models.UserStatsModel(
            id=self.USER_ID_1,
            impact_score=self.USER_1_IMPACT_SCORE,
            total_plays=self.USER_1_TOTAL_PLAYS,
            average_ratings=self.USER_1_AVERAGE_RATINGS,
            num_ratings=self.USER_1_NUM_RATINGS,
            weekly_creator_stats_list=self.USER_1_WEEKLY_CREATOR_STATS_LIST
        ).put()

        # Setup for UserSkillModel.
        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID_1, self.SKILL_ID_1),
            user_id=self.USER_ID_1,
            skill_id=self.SKILL_ID_1,
            degree_of_mastery=self.DEGREE_OF_MASTERY).put()

        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_ID_1, self.SKILL_ID_2),
            user_id=self.USER_ID_1,
            skill_id=self.SKILL_ID_2,
            degree_of_mastery=self.DEGREE_OF_MASTERY).put()

        # Setup for UserSettingsModel.
        user_models.UserSettingsModel(
            id=self.USER_ID_1,
            email=self.USER_1_EMAIL,
            role=self.USER_1_ROLE,
            username=self.GENERIC_USERNAME,
            normalized_username=self.GENERIC_USERNAME,
            last_agreed_to_terms=self.GENERIC_DATE,
            last_started_state_editor_tutorial=self.GENERIC_DATE,
            last_started_state_translation_tutorial=self.GENERIC_DATE,
            last_logged_in=self.GENERIC_DATE,
            last_created_an_exploration=self.GENERIC_DATE,
            last_edited_an_exploration=self.GENERIC_DATE,
            profile_picture_data_url=self.GENERIC_IMAGE_URL,
            default_dashboard='learner', creator_dashboard_display_pref='card',
            user_bio=self.GENERIC_USER_BIO,
            subject_interests=self.GENERIC_SUBJECT_INTERESTS,
            first_contribution_msec=1,
            preferred_language_codes=self.GENERIC_LANGUAGE_CODES,
            preferred_site_language_code=(self.GENERIC_LANGUAGE_CODES[0]),
            preferred_audio_language_code=(self.GENERIC_LANGUAGE_CODES[0])
        ).put()

        # Setup for UserSubscriptionsModel.
        user_models.UserSubscriptionsModel(
            id=self.USER_ID_1, creator_ids=self.CREATOR_IDS,
            collection_ids=self.COLLECTION_IDS,
            activity_ids=self.ACTIVITY_IDS,
            general_feedback_thread_ids=self.GENERAL_FEEDBACK_THREAD_IDS).put()

        # Setup for UserContributionsModel.
        self.save_new_valid_exploration(
            self.EXPLORATION_IDS[0], self.USER_ID_1, end_state_name='End')

        exp_services.update_exploration(
            self.USER_ID_1, self.EXPLORATION_IDS[0], [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        # Setup for ExplorationUserDataModel.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID_1, self.EXPLORATION_IDS[0]), user_id=self.USER_ID_1,
            exploration_id=self.EXPLORATION_IDS[0], rating=2,
            rated_on=self.GENERIC_DATE,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.GENERIC_DATE,
            draft_change_list_exp_version=3,
            draft_change_list_id=1).put()

        # Setup for CompletedActivitiesModel.
        user_models.CompletedActivitiesModel(
            id=self.USER_ID_1,
            exploration_ids=self.EXPLORATION_IDS,
            collection_ids=self.COLLECTION_IDS).put()

        # Setup for IncompleteACtivitiesModel.
        user_models.IncompleteActivitiesModel(
            id=self.USER_ID_1,
            exploration_ids=self.EXPLORATION_IDS,
            collection_ids=self.COLLECTION_IDS).put()

        # Setup for ExpUserLastPlaythroughModel.
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_ID_1, self.EXPLORATION_IDS[0]),
            user_id=self.USER_ID_1, exploration_id=self.EXPLORATION_IDS[0],
            last_played_exp_version=self.EXP_VERSION,
            last_played_state_name=self.STATE_NAME).put()

        # Setup for LearnerPlaylistModel.
        user_models.LearnerPlaylistModel(
            id=self.USER_ID_1,
            exploration_ids=self.EXPLORATION_IDS,
            collection_ids=self.COLLECTION_IDS).put()

        # Setup for CollectionProgressModel.
        user_models.CollectionProgressModel(
            id='%s.%s' % (self.USER_ID_1, self.COLLECTION_IDS[0]),
            user_id=self.USER_ID_1,
            collection_id=self.COLLECTION_IDS[0],
            completed_explorations=self.EXPLORATION_IDS).put()

        # Setup for StoryProgressModel.
        user_models.StoryProgressModel(
            id='%s.%s' % (self.USER_ID_1, self.STORY_ID_1),
            user_id=self.USER_ID_1,
            story_id=self.STORY_ID_1,
            completed_node_ids=self.COMPLETED_NODE_IDS_1).put()

        # Setup for CollectionRightsModel.
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_IDS[0],
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            'cid', 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

        # Setup for GeneralSuggestionModel.
        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.EXPLORATION_IDS[0], 1,
            suggestion_models.STATUS_IN_REVIEW, self.USER_ID_1,
            'reviewer_1', self.CHANGE_CMD, self.SCORE_CATEGORY,
            'exploration.exp1.thread_1')

        # Setup for ExplorationRightsModel.
        exploration_models.ExplorationRightsModel(
            id=self.EXPLORATION_IDS[0],
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            'cid', 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

    def test_export_data_nontrivial(self):
        takeout_processor_service.export_all_models(self.USER_ID_1)
        stats_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }
        user_settings_data = {
            'email': self.USER_1_EMAIL,
            'role': feconf.ROLE_ID_ADMIN,
            'username': self.GENERIC_USERNAME,
            'normalized_username': self.GENERIC_USERNAME,
            'last_agreed_to_terms': self.GENERIC_DATE,
            'last_started_state_editor_tutorial': self.GENERIC_DATE,
            'last_started_state_translation_tutorial': self.GENERIC_DATE,
            'last_logged_in': self.GENERIC_DATE,
            'last_edited_an_exploration': self.GENERIC_DATE,
            'profile_picture_data_url': self.GENERIC_IMAGE_URL,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': self.GENERIC_USER_BIO,
            'subject_interests': self.GENERIC_SUBJECT_INTERESTS,
            'first_contribution_msec': 1,
            'preferred_language_codes': self.GENERIC_LANGUAGE_CODES,
            'preferred_site_language_code': self.GENERIC_LANGUAGE_CODES[0],
            'preferred_audio_language_code': self.GENERIC_LANGUAGE_CODES[0]
        }
        user_subscriptions_data = {
            'creator_ids': self.CREATOR_IDS,
            'collection_ids': self.COLLECTION_IDS,
            'activity_ids': self.ACTIVITY_IDS,
            'general_feedback_thread_ids': self.GENERAL_FEEDBACK_THREAD_IDS,
            'last_checked': None
        }
        user_skill_data = {
            self.SKILL_ID_1: self.DEGREE_OF_MASTERY,
            self.SKILL_ID_2: self.DEGREE_OF_MASTERY
        }
        user_contribution_data = {
            'created_exploration_ids': [self.EXPLORATION_IDS[0]],
            'edited_exploration_ids': [self.EXPLORATION_IDS[0]]
        }
        user_exploration_data = {
            self.EXPLORATION_IDS[0]: {
                'rating': 2,
                'rated_on': self.GENERIC_DATE,
                'draft_change_list': {'new_content': {}},
                'draft_change_list_last_updated': self.GENERIC_DATE,
                'draft_change_list_exp_version': 3,
                'draft_change_list_id': 1,
                'mute_suggestion_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'mute_feedback_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
            }
        }
        completed_activities_data = {
            'completed_exploration_ids': self.EXPLORATION_IDS,
            'completed_collection_ids': self.COLLECTION_IDS
        }
        incomplete_activities_data = {
            'incomplete_exploration_ids': self.EXPLORATION_IDS,
            'incomplete_collection_ids': self.COLLECTION_IDS
        }
        last_playthrough_data = {
            self.EXPLORATION_IDS[0]: {
                'exp_version': self.EXP_VERSION,
                'state_name': self.STATE_NAME
            }
        }
        learner_playlist_data = {
            'playlist_exploration_ids': self.EXPLORATION_IDS,
            'playlist_collection_ids': self.COLLECTION_IDS
        }
        collection_progress_data = {
            self.COLLECTION_IDS[0]: self.EXPLORATION_IDS
        }
        story_progress_data = {
            self.STORY_ID_1: self.COMPLETED_NODE_IDS_1
        }

        feedback_thread_model = feedback_models.GeneralFeedbackThreadModel(
            entity_type=self.THREAD_ENTITY_TYPE,
            entity_id=self.THREAD_ENTITY_ID,
            original_author_id=self.USER_ID_1,
            status=self.THREAD_STATUS,
            subject=self.THREAD_SUBJECT,
            has_suggestion=self.THREAD_HAS_SUGGESTION,
            summary=self.THREAD_SUMMARY,
            message_count=self.THREAD_MESSAGE_COUNT
        )
        feedback_thread_model.put()

        general_feedback_thread_data = {
            feedback_thread_model.id: {
                'entity_type': self.THREAD_ENTITY_TYPE,
                'entity_id': self.THREAD_ENTITY_ID,
                'status': self.THREAD_STATUS,
                'subject': self.THREAD_SUBJECT,
                'has_suggestion': self.THREAD_HAS_SUGGESTION,
                'summary': self.THREAD_SUMMARY,
                'message_count': self.THREAD_MESSAGE_COUNT,
                'last_updated': feedback_thread_model.last_updated
            }
        }
        thread_id = feedback_services.create_thread(
            self.THREAD_ENTITY_TYPE,
            self.THREAD_ENTITY_ID,
            self.USER_ID_1,
            self.THREAD_SUBJECT,
            self.MESSAGE_TEXT
        )
        feedback_services.create_message(
            thread_id,
            self.USER_ID_1,
            self.THREAD_STATUS,
            self.THREAD_SUBJECT,
            self.MESSAGE_TEXT
        )
        general_feedback_message_data = {
            thread_id + '.0': {
                'thread_id': thread_id,
                'message_id': 0,
                'updated_status': self.THREAD_STATUS,
                'updated_subject': self.THREAD_SUBJECT,
                'text': self.MESSAGE_TEXT,
                'received_via_email': self.MESSAGE_RECEIEVED_VIA_EMAIL
            },
            thread_id + '.1': {
                'thread_id': thread_id,
                'message_id': 1,
                'updated_status': self.THREAD_STATUS,
                'updated_subject': self.THREAD_SUBJECT,
                'text': self.MESSAGE_TEXT,
                'received_via_email': self.MESSAGE_RECEIEVED_VIA_EMAIL
            }
        }
        collection_rights_data = {
            'owned_collection_ids': (
                [self.COLLECTION_IDS[0]]),
            'editable_collection_ids': (
                [self.COLLECTION_IDS[0]]),
            'voiced_collection_ids': (
                [self.COLLECTION_IDS[0]]),
            'viewable_collection_ids': [self.COLLECTION_IDS[0]]
        }
        general_suggestion_data = {
            'exploration.exp1.thread_1': {
                'suggestion_type': suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': self.EXPLORATION_IDS[0],
                'target_version_at_submission': 1,
                'status': suggestion_models.STATUS_IN_REVIEW,
                'change_cmd': self.CHANGE_CMD
            }
        }
        exploration_rights_data = {
            'owned_exploration_ids': (
                [self.EXPLORATION_IDS[0]]),
            'editable_exploration_ids': (
                [self.EXPLORATION_IDS[0]]),
            'voiced_exploration_ids': (
                [self.EXPLORATION_IDS[0]]),
            'viewable_exploration_ids': [self.EXPLORATION_IDS[0]]
        }
        expected_export = {
            'stats_data': stats_data,
            'user_settings_data': user_settings_data,
            'user_subscriptions_data': user_subscriptions_data,
            'user_skill_data': user_skill_data,
            'user_contribution_data': user_contribution_data,
            'user_exploration_data': user_exploration_data,
            'completed_activities_data': completed_activities_data,
            'incomplete_activities_data': incomplete_activities_data,
            'last_playthrough_data': last_playthrough_data,
            'learner_playlist_data': learner_playlist_data,
            'collection_progress_data': collection_progress_data,
            'story_progress_data': story_progress_data,
            'general_feedback_thread_data': general_feedback_thread_data,
            'general_feedback_message_data': general_feedback_message_data,
            'collection_rights_data': collection_rights_data,
            'general_suggestion_data': general_suggestion_data,
            'exploration_rights_data': exploration_rights_data,
        }
        exported_data = takeout_processor_service.export_all_models(self.USER_ID_1)
        exported_data_json = json.dumps(exported_data, default=str)
        expected_export_json = json.dumps(expected_export, default=str)
        self.assertEqual(expected_export_json, exported_data_json)