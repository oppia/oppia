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

"""Unit tests for core.domain.takeout_service."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import takeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(
    collection_models, email_models, exploration_models, feedback_models,
    suggestion_models, user_models) = models.Registry.import_models([
        models.NAMES.collection, models.NAMES.email, models.NAMES.exploration,
        models.NAMES.feedback, models.NAMES.suggestion, models.NAMES.user])


class TakeoutServiceUnitTests(test_utils.GenericTestBase):
    """Tests for the takeout service."""

    USER_ID_1 = 'user_1'
    THREAD_ID_1 = 'thread_id_1'
    THREAD_ID_2 = 'thread_id_2'
    USER_1_REPLY_TO_ID_1 = 'user_1_reply_to_id_thread_1'
    USER_1_REPLY_TO_ID_2 = 'user_1_reply_to_id_thread_2'
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

    def set_up_non_trivial(self):
        """Set up all models for use in testing.
        1) Simulates the creation of a user, user_1, and their stats model.
        2) Simulates skill mastery of user_1 with two skills.
        3) Simulates subscriptions to threads, activities, and collections.
        4) Simulates creation and edit of an exploration by user_1.
        5) Creates an ExplorationUserDataModel.
        6) Simulates completion of some activities.
        7) Simulates incomplete status of some activities.
        8) Populates ExpUserLastPlaythroughModel of user.
        9) Creates user LearnerPlaylsts.
        10) Simulates collection progress of user.
        11) Simulates story progress of user.
        12) Creates new collection rights.
        13) Simulates a general suggestion.
        14) Creates new exploration rights.
        15) Populates user settings.
        16) Creates two reply-to ids for feedback.
        """
        super(TakeoutServiceUnitTests, self).setUp()
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
            self.USER_ID_1, self.EXPLORATION_IDS[0],
            [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        # Setup for ExplorationUserDataModel.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID_1, self.EXPLORATION_IDS[0]),
            user_id=self.USER_ID_1,
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

        # Setup for GeneralFeedbackReplyToId.
        user_two_fake_hash_lambda_one = (
            lambda rand_int, reply_to_id_length: self.USER_1_REPLY_TO_ID_1)
        user_two_fake_hash_one = self.swap(
            utils, 'convert_to_hash', user_two_fake_hash_lambda_one)
        with user_two_fake_hash_one:
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.USER_ID_1, self.THREAD_ID_1).put()

        user_two_deterministic_hash_lambda_two = (
            lambda rand_int, reply_to_id_length: self.USER_1_REPLY_TO_ID_2)
        user_two_deterministic_hash_two = self.swap(
            utils, 'convert_to_hash', user_two_deterministic_hash_lambda_two)
        with user_two_deterministic_hash_two:
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.USER_ID_1, self.THREAD_ID_2).put()

    def set_up_trivial(self):
        """Setup for trivial test of export_data functionality."""
        super(TakeoutServiceUnitTests, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_ID_1, email=self.USER_1_EMAIL, role=self.USER_1_ROLE
        ).put()
        user_models.UserSubscriptionsModel(id=self.USER_ID_1).put()

    def test_export_nonexistent_user(self):
        """Setup for nonexistent user test of export_data functionality."""
        with self.assertRaises(
            user_models.UserSettingsModel.EntityNotFoundError):
            takeout_service.export_data_for_user('fake_user_id')

    def test_export_data_trivial(self):
        """Trivial test of export_data functionality."""
        self.set_up_trivial()

        # Generate expected output.
        collection_progress_data = {}
        collection_rights_data = {
            'editable_collection_ids': [],
            'owned_collection_ids': [],
            'viewable_collection_ids': [],
            'voiced_collection_ids': []
        }
        completed_activities_data = None
        contribution_data = None
        exploration_rights_data = {
            'editable_exploration_ids': [],
            'owned_exploration_ids': [],
            'viewable_exploration_ids': [],
            'voiced_exploration_ids': []
        }
        exploration_data = {}
        reply_to_data = {}
        general_feedback_message_data = {}
        general_feedback_thread_data = {}
        general_suggestion_data = {}
        last_playthrough_data = {}
        learner_playlist_data = None
        incomplete_activities_data = None
        settings_data = {
            'email': 'user1@example.com',
            'role': feconf.ROLE_ID_ADMIN,
            'username': None,
            'normalized_username': None,
            'last_agreed_to_terms': None,
            'last_started_state_editor_tutorial': None,
            'last_started_state_translation_tutorial': None,
            'last_logged_in': None,
            'last_edited_an_exploration': None,
            'profile_picture_data_url': None,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': None,
            'subject_interests': [],
            'first_contribution_msec': None,
            'preferred_language_codes': [],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None
        }
        skill_data = {}
        stats_data = None
        story_progress_data = {}
        subscriptions_data = {
            'activity_ids': [],
            'collection_ids': [],
            'creator_ids': [],
            'general_feedback_thread_ids': [],
            'last_checked': None
        }
        expected_export = {
            'user_stats_data': stats_data,
            'user_settings_data': settings_data,
            'user_subscriptions_data': subscriptions_data,
            'user_skill_mastery_data': skill_data,
            'user_contributions_data': contribution_data,
            'exploration_user_data_data': exploration_data,
            'completed_activities_data': completed_activities_data,
            'incomplete_activities_data': incomplete_activities_data,
            'exp_user_last_playthrough_data': last_playthrough_data,
            'learner_playlist_data': learner_playlist_data,
            'collection_progress_data': collection_progress_data,
            'story_progress_data': story_progress_data,
            'general_feedback_thread_data': general_feedback_thread_data,
            'general_feedback_message_data': general_feedback_message_data,
            'collection_rights_data': collection_rights_data,
            'general_suggestion_data': general_suggestion_data,
            'exploration_rights_data': exploration_rights_data,
            'general_feedback_email_reply_to_id_data': reply_to_data
        }

        # Perform export and compare.
        exported_data = takeout_service.export_data_for_user(self.USER_ID_1)
        self.assertEqual(expected_export, exported_data)

    def test_export_data_nontrivial(self):
        """Nontrivial test of export_data functionality."""
        self.set_up_non_trivial()

        # We set up the feedback_thread_model here so that we can easily
        # access it when computing the expected data later.
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

        expected_stats_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }
        expected_skill_data = {
            self.SKILL_ID_1: self.DEGREE_OF_MASTERY,
            self.SKILL_ID_2: self.DEGREE_OF_MASTERY
        }
        expected_contribution_data = {
            'created_exploration_ids': [self.EXPLORATION_IDS[0]],
            'edited_exploration_ids': [self.EXPLORATION_IDS[0]]
        }
        expected_exploration_data = {
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
        expected_completed_activities_data = {
            'completed_exploration_ids': self.EXPLORATION_IDS,
            'completed_collection_ids': self.COLLECTION_IDS
        }
        expected_incomplete_activities_data = {
            'incomplete_exploration_ids': self.EXPLORATION_IDS,
            'incomplete_collection_ids': self.COLLECTION_IDS
        }
        expected_last_playthrough_data = {
            self.EXPLORATION_IDS[0]: {
                'exp_version': self.EXP_VERSION,
                'state_name': self.STATE_NAME
            }
        }
        expected_learner_playlist_data = {
            'playlist_exploration_ids': self.EXPLORATION_IDS,
            'playlist_collection_ids': self.COLLECTION_IDS
        }
        expected_collection_progress_data = {
            self.COLLECTION_IDS[0]: self.EXPLORATION_IDS
        }
        expected_story_progress_data = {
            self.STORY_ID_1: self.COMPLETED_NODE_IDS_1
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
        expected_general_feedback_thread_data = {
            feedback_thread_model.id: {
                'entity_type': self.THREAD_ENTITY_TYPE,
                'entity_id': self.THREAD_ENTITY_ID,
                'status': self.THREAD_STATUS,
                'subject': self.THREAD_SUBJECT,
                'has_suggestion': self.THREAD_HAS_SUGGESTION,
                'summary': self.THREAD_SUMMARY,
                'message_count': self.THREAD_MESSAGE_COUNT,
                'last_updated': feedback_thread_model.last_updated
            },
            thread_id: {
                'entity_type': self.THREAD_ENTITY_TYPE,
                'entity_id': self.THREAD_ENTITY_ID,
                'status': self.THREAD_STATUS,
                'subject': self.THREAD_SUBJECT,
                'has_suggestion': False,
                'summary': None,
                'message_count': 2,
                'last_updated': (feedback_models.
                                 GeneralFeedbackThreadModel.
                                 get(thread_id).last_updated)
            }
        }
        expected_general_feedback_message_data = {
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
        expected_collection_rights_data = {
            'owned_collection_ids': (
                [self.COLLECTION_IDS[0]]),
            'editable_collection_ids': (
                [self.COLLECTION_IDS[0]]),
            'voiced_collection_ids': (
                [self.COLLECTION_IDS[0]]),
            'viewable_collection_ids': [self.COLLECTION_IDS[0]]
        }
        expected_general_suggestion_data = {
            'exploration.exp1.thread_1': {
                'suggestion_type': (suggestion_models.
                                    SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': self.EXPLORATION_IDS[0],
                'target_version_at_submission': 1,
                'status': suggestion_models.STATUS_IN_REVIEW,
                'change_cmd': self.CHANGE_CMD
            }
        }
        expected_exploration_rights_data = {
            'owned_exploration_ids': (
                [self.EXPLORATION_IDS[0]]),
            'editable_exploration_ids': (
                [self.EXPLORATION_IDS[0]]),
            'voiced_exploration_ids': (
                [self.EXPLORATION_IDS[0]]),
            'viewable_exploration_ids': [self.EXPLORATION_IDS[0]]
        }
        expected_settings_data = {
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

        expected_reply_to_data = {
            self.THREAD_ID_1: self.USER_1_REPLY_TO_ID_1,
            self.THREAD_ID_2: self.USER_1_REPLY_TO_ID_2
        }

        expected_subscriptions_data = {
            'creator_ids': self.CREATOR_IDS,
            'collection_ids': self.COLLECTION_IDS,
            'activity_ids': self.ACTIVITY_IDS + self.EXPLORATION_IDS,
            'general_feedback_thread_ids': self.GENERAL_FEEDBACK_THREAD_IDS +
                                           [thread_id],
            'last_checked': None
        }

        expected_export = {
            'user_stats_data': expected_stats_data,
            'user_settings_data': expected_settings_data,
            'user_subscriptions_data': expected_subscriptions_data,
            'user_skill_mastery_data': expected_skill_data,
            'user_contributions_data': expected_contribution_data,
            'exploration_user_data_data': expected_exploration_data,
            'completed_activities_data': expected_completed_activities_data,
            'incomplete_activities_data': expected_incomplete_activities_data,
            'exp_user_last_playthrough_data': expected_last_playthrough_data,
            'learner_playlist_data': expected_learner_playlist_data,
            'collection_progress_data': expected_collection_progress_data,
            'story_progress_data': expected_story_progress_data,
            'general_feedback_thread_data':
                expected_general_feedback_thread_data,
            'general_feedback_message_data':
                expected_general_feedback_message_data,
            'collection_rights_data':
                expected_collection_rights_data,
            'general_suggestion_data': expected_general_suggestion_data,
            'exploration_rights_data': expected_exploration_rights_data,
            'general_feedback_email_reply_to_id_data': expected_reply_to_data
        }

        exported_data = takeout_service.export_data_for_user(self.USER_ID_1)
        self.assertEqual(exported_data, expected_export)
