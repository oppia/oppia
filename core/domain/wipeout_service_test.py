# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for wipeout service."""

from __future__ import annotations

import datetime
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.domain import auth_services
from core.domain import collection_services
from core.domain import email_manager
from core.domain import exp_services
from core.domain import fs_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_domain
from core.domain import user_services
from core.domain import wipeout_domain
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils

from typing import Final, List, Sequence

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_feedback_report_models
    from mypy_imports import auth_models
    from mypy_imports import blog_models
    from mypy_imports import collection_models
    from mypy_imports import config_models
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import feedback_models
    from mypy_imports import improvements_models
    from mypy_imports import learner_group_models
    from mypy_imports import question_models
    from mypy_imports import skill_models
    from mypy_imports import story_models
    from mypy_imports import subtopic_models
    from mypy_imports import suggestion_models
    from mypy_imports import topic_models
    from mypy_imports import user_models

(
    app_feedback_report_models, auth_models, blog_models,
    collection_models, config_models, email_models, exp_models,
    feedback_models, improvements_models, learner_group_models,
    question_models, skill_models, story_models, subtopic_models,
    suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.Names.APP_FEEDBACK_REPORT, models.Names.AUTH, models.Names.BLOG,
    models.Names.COLLECTION, models.Names.CONFIG, models.Names.EMAIL,
    models.Names.EXPLORATION, models.Names.FEEDBACK, models.Names.IMPROVEMENTS,
    models.Names.LEARNER_GROUP, models.Names.QUESTION, models.Names.SKILL,
    models.Names.STORY, models.Names.SUBTOPIC, models.Names.SUGGESTION,
    models.Names.TOPIC, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()


class WipeoutServiceHelpersTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)

    def test_gets_pending_deletion_request(self) -> None:
        wipeout_service.save_pending_deletion_requests(
            [
                wipeout_domain.PendingDeletionRequest.create_default(
                    self.user_1_id, self.USER_1_USERNAME, self.USER_1_EMAIL)
            ]
        )

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertEqual(pending_deletion_request.user_id, self.user_1_id)
        self.assertEqual(pending_deletion_request.email, self.USER_1_EMAIL)
        self.assertEqual(pending_deletion_request.deletion_complete, False)
        self.assertEqual(
            pending_deletion_request.pseudonymizable_entity_mappings, {})

    def test_get_number_of_pending_deletion_requests_returns_correct_number(
        self
    ) -> None:
        number_of_pending_deletion_requests = (
            wipeout_service.get_number_of_pending_deletion_requests())
        self.assertEqual(number_of_pending_deletion_requests, 0)

        wipeout_service.save_pending_deletion_requests(
            [
                wipeout_domain.PendingDeletionRequest.create_default(
                    self.user_1_id, self.USER_1_USERNAME, self.USER_1_EMAIL),
                wipeout_domain.PendingDeletionRequest.create_default(
                    self.user_2_id, self.USER_2_USERNAME, self.USER_2_EMAIL)
            ]
        )
        number_of_pending_deletion_requests = (
            wipeout_service.get_number_of_pending_deletion_requests())
        self.assertEqual(number_of_pending_deletion_requests, 2)

    def test_saves_pending_deletion_request_when_new(self) -> None:
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_USERNAME, self.USER_1_EMAIL))
        wipeout_service.save_pending_deletion_requests(
            [pending_deletion_request])

        pending_deletion_request_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model.deletion_complete, False)
        self.assertEqual(
            pending_deletion_request_model.pseudonymizable_entity_mappings, {})

    def test_saves_pending_deletion_request_when_already_existing(self) -> None:
        pending_deletion_request_model_old = (
            user_models.PendingDeletionRequestModel(
                id=self.user_1_id,
                email=self.USER_1_EMAIL,
                deletion_complete=False,
                pseudonymizable_entity_mappings={}
            )
        )
        pending_deletion_request_model_old.put()

        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_USERNAME, self.USER_1_EMAIL)
        )
        pending_deletion_request.deletion_complete = True
        pending_deletion_request.pseudonymizable_entity_mappings = {
            'story': {'story_id': 'user_id'}
        }
        wipeout_service.save_pending_deletion_requests(
            [pending_deletion_request])

        pending_deletion_request_model_new = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model_new.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model_new.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model_new.deletion_complete, True)
        self.assertEqual(
            pending_deletion_request_model_new.pseudonymizable_entity_mappings,
            {'story': {'story_id': 'user_id'}})
        self.assertEqual(
            pending_deletion_request_model_old.created_on,
            pending_deletion_request_model_new.created_on)


class WipeoutServicePreDeleteTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    USER_3_EMAIL: Final = 'other@email.com'
    USER_3_USERNAME: Final = 'username3'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.add_user_role(
            self.USER_1_USERNAME, feconf.ROLE_ID_CURRICULUM_ADMIN)
        self.add_user_role(
            self.USER_1_USERNAME, feconf.ROLE_ID_VOICEOVER_ADMIN)
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        self.user_1_actions = user_services.get_user_actions_info(
            self.user_1_id)

        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': self.user_1_id,
        }
        new_user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': None,
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

        user_services.update_multiple_users_data(
            [self.modifiable_user_data])
        self.modifiable_user_data.display_alias = 'name'
        self.modifiable_user_data.pin = '123'
        self.profile_user_id = user_services.create_new_profiles(
            self.user_1_auth_id, self.USER_1_EMAIL,
            [self.modifiable_new_user_data]
        )[0].user_id

    def tearDown(self) -> None:
        pending_deletion_request_models = (
            user_models.PendingDeletionRequestModel.get_all())
        for pending_deletion_request_model in pending_deletion_request_models:
            pending_deletion_request = (
                wipeout_service.get_pending_deletion_request(
                    pending_deletion_request_model.id))
            self.assertEqual(
                wipeout_service.run_user_deletion(pending_deletion_request),
                wipeout_domain.USER_DELETION_SUCCESS)
            self.assertEqual(
                wipeout_service.run_user_deletion_completion(
                    pending_deletion_request),
                wipeout_domain.USER_VERIFICATION_SUCCESS)

    def test_pre_delete_user_email_subscriptions(self) -> None:
        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertEqual(
            email_preferences.can_receive_email_updates,
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_subscription_email,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        observed_log_messages: List[str] = []
        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        with self.swap(logging, 'info', _mock_logging_function):
            wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertItemsEqual(
            observed_log_messages,
            ['Email ID %s permanently deleted from bulk email provider\'s db. '
             'Cannot access API, since this is a dev environment'
             % self.USER_1_EMAIL])
        self.assertFalse(email_preferences.can_receive_email_updates)
        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

    def test_pre_delete_profile_users_works_correctly(self) -> None:
        user_settings = user_services.get_user_settings(self.profile_user_id)
        self.assertFalse(user_settings.deleted)
        self.assertFalse(user_settings.deleted)

        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()
        user_settings_model = user_models.UserSettingsModel.get_by_id(
            self.profile_user_id)
        self.assertTrue(user_settings_model.deleted)

        user_auth_details = (
            auth_models.UserAuthDetailsModel.get_by_id(self.profile_user_id))
        self.assertTrue(user_auth_details.deleted)

    def test_pre_delete_user_for_full_user_also_deletes_all_profiles(
        self
    ) -> None:
        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertFalse(user_settings.deleted)
        profile_user_settings = user_services.get_user_settings(
            self.profile_user_id)
        self.assertFalse(profile_user_settings.deleted)
        profile_auth_details = user_services.get_user_settings(
            self.profile_user_id)
        self.assertFalse(profile_auth_details.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        user_settings_model = user_models.UserSettingsModel.get_by_id(
            self.user_1_id
        )
        self.assertTrue(user_settings_model.deleted)
        user_auth_details = (
            auth_models.UserAuthDetailsModel.get_by_id(self.profile_user_id))
        self.assertTrue(user_auth_details.deleted)
        profile_user_settings_model = user_models.UserSettingsModel.get_by_id(
            self.profile_user_id)
        self.assertTrue(profile_user_settings_model.deleted)
        profile_auth_details_model = (
            auth_models.UserAuthDetailsModel.get_by_id(self.profile_user_id))
        self.assertTrue(profile_auth_details_model.deleted)

    def test_pre_delete_user_without_activities_works_correctly(self) -> None:
        user_models.UserSubscriptionsModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()

        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertFalse(user_settings.deleted)
        user_auth_details = auth_models.UserAuthDetailsModel.get(self.user_1_id)
        self.assertFalse(user_auth_details.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        user_settings_model = user_models.UserSettingsModel.get_by_id(
            self.user_1_id
        )
        self.assertTrue(user_settings_model.deleted)
        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.user_1_id))
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(pending_deletion_model)

    def test_pre_delete_username_is_not_saved_for_user_younger_than_week(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertIsNone(
            pending_deletion_request.normalized_long_term_username)

    def test_pre_delete_username_is_saved_for_user_older_than_week(
        self
    ) -> None:
        date_10_days_ago = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        with self.mock_datetime_utcnow(date_10_days_ago):
            self.signup(self.USER_3_EMAIL, self.USER_3_USERNAME)
        user_3_id = self.get_user_id_from_email(self.USER_3_EMAIL)

        wipeout_service.pre_delete_user(user_3_id)
        self.process_and_flush_pending_tasks()

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(user_3_id))
        self.assertEqual(
            pending_deletion_request.normalized_long_term_username,
            self.USER_3_USERNAME)

    def test_pre_delete_user_with_activities_multiple_owners(self) -> None:
        user_services.add_user_role(
            self.user_1_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        rights_manager.assign_role_for_exploration(
            self.user_1_actions,
            'exp_id',
            self.user_2_id,
            rights_domain.ROLE_OWNER)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')
        rights_manager.assign_role_for_collection(
            self.user_1_actions,
            'col_id',
            self.user_2_id,
            rights_domain.ROLE_OWNER)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(pending_deletion_model)

    def test_pre_delete_user_collection_is_marked_deleted(self) -> None:
        self.save_new_valid_collection('col_id', self.user_1_id)

        collection_model = collection_models.CollectionModel.get_by_id('col_id')
        self.assertFalse(collection_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(collection_models.CollectionModel.get_by_id('col_id'))

    def test_pre_delete_user_exploration_is_marked_deleted(self) -> None:
        self.save_new_valid_exploration('exp_id', self.user_1_id)

        exp_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertFalse(exp_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(exp_models.ExplorationModel.get_by_id('exp_id'))

    def test_pre_delete_user_collection_ownership_is_released(self) -> None:
        self.save_new_valid_collection('col_id', self.user_1_id)
        self.publish_collection(self.user_1_id, 'col_id')
        rights_manager.assign_role_for_collection(
            user_services.get_system_user(),
            'col_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertFalse(collection_summary_model.community_owned)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertTrue(collection_summary_model.community_owned)

    def test_pre_delete_user_exploration_ownership_is_released(self) -> None:
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.publish_exploration(self.user_1_id, 'exp_id')
        rights_manager.assign_role_for_exploration(
            user_services.get_system_user(),
            'exp_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertFalse(exp_summary_model.community_owned)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertTrue(exp_summary_model.community_owned)

    def test_pre_delete_user_exploration_ownership_is_released_with_voice_art(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.publish_exploration(self.user_1_id, 'exp_id')
        rights_manager.assign_role_for_exploration(
            self.user_1_actions,
            'exp_id',
            self.user_2_id,
            feconf.ROLE_VOICE_ARTIST)

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertFalse(exp_summary_model.community_owned)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertTrue(exp_summary_model.community_owned)

    def test_pre_delete_user_collection_user_is_deassigned(self) -> None:
        self.save_new_valid_collection('col_id', self.user_1_id)
        rights_manager.assign_role_for_collection(
            user_services.get_system_user(),
            'col_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertEqual(collection_summary_model.editor_ids, [self.user_2_id])

        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertEqual(collection_summary_model.editor_ids, [])

    def test_pre_delete_user_exploration_user_is_deassigned(self) -> None:
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        rights_manager.assign_role_for_exploration(
            user_services.get_system_user(),
            'exp_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.editor_ids, [self.user_2_id])

        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.editor_ids, [])

    def test_exp_user_with_voice_artist_role_is_deassigned_from_public_exp(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.publish_exploration(self.user_1_id, 'exp_id')
        rights_manager.assign_role_for_exploration(
            user_services.get_system_user(),
            'exp_id',
            self.user_2_id,
            feconf.ROLE_VOICE_ARTIST
        )

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.voice_artist_ids, [self.user_2_id])

        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.voice_artist_ids, [])

    def test_exp_user_with_voice_artist_role_is_deassigned_from_private_exp(
        self
    ) -> None:
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.publish_exploration(self.user_1_id, 'exp_id')
        rights_manager.assign_role_for_exploration(
            user_services.get_system_user(),
            'exp_id',
            self.user_2_id,
            feconf.ROLE_VOICE_ARTIST
        )
        rights_manager.unpublish_exploration(
            user_services.get_system_user(), 'exp_id')

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.voice_artist_ids, [self.user_2_id])

        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.voice_artist_ids, [])

    def test_pre_delete_user_user_is_deassigned_from_topics(self) -> None:
        self.save_new_topic('top_id', self.user_1_id)
        topic_services.assign_role(
            user_services.get_system_user(),
            self.user_1_actions,
            feconf.ROLE_MANAGER,
            'top_id')

        top_rights_model = topic_models.TopicRightsModel.get_by_id('top_id')
        self.assertEqual(top_rights_model.manager_ids, [self.user_1_id])

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        top_rights_model = topic_models.TopicRightsModel.get_by_id('top_id')
        self.assertEqual(top_rights_model.manager_ids, [])

    def test_raises_error_if_created_on_is_unavailable(self) -> None:
        user_settings = user_services.get_user_settings(self.user_1_id)
        user_settings.created_on = None

        with self.swap_to_always_return(
            user_services,
            'get_user_settings',
            user_settings
        ):
            with self.assertRaisesRegex(
                Exception,
                'No data available for when the user was created on.'
            ):
                wipeout_service.pre_delete_user(self.user_1_id)


class WipeoutServiceRunFunctionsTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        date_10_days_ago = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        with self.mock_datetime_utcnow(date_10_days_ago):
            self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)

        self.topic_id = topic_fetchers.get_new_topic_id()
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'

        self.save_new_topic(
            self.topic_id, self.owner_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)

        self.set_topic_managers([self.USER_1_USERNAME], self.topic_id)
        self.user_1_actions = user_services.get_user_actions_info(
            self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        self.pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))

    def test_run_user_deletion_with_user_not_deleted(self) -> None:
        self.assertEqual(
            wipeout_service.run_user_deletion(self.pending_deletion_request),
            wipeout_domain.USER_DELETION_SUCCESS
        )

    def test_run_user_deletion_with_user_already_deleted(self) -> None:
        wipeout_service.run_user_deletion(self.pending_deletion_request)
        self.assertEqual(
            wipeout_service.run_user_deletion(self.pending_deletion_request),
            wipeout_domain.USER_DELETION_ALREADY_DONE
        )

    def test_run_user_deletion_completion_with_user_not_yet_deleted(
        self
    ) -> None:
        self.assertEqual(
            wipeout_service.run_user_deletion_completion(
                self.pending_deletion_request),
            wipeout_domain.USER_VERIFICATION_NOT_DELETED)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

    def test_run_user_deletion_completion_with_user_properly_deleted(
        self
    ) -> None:
        wipeout_service.run_user_deletion(self.pending_deletion_request)

        send_email_swap = self.swap_with_checks(
            email_manager,
            'send_account_deleted_email',
            lambda x, y: None,
            expected_args=[(
                self.pending_deletion_request.user_id,
                self.pending_deletion_request.email
            )]
        )

        with send_email_swap, self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.assertEqual(
                wipeout_service.run_user_deletion_completion(
                    self.pending_deletion_request),
                wipeout_domain.USER_VERIFICATION_SUCCESS
            )

        self.assertIsNotNone(
            user_models.DeletedUserModel.get_by_id(self.user_1_id))
        self.assertTrue(user_services.is_username_taken(self.USER_1_USERNAME))
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        # Pre-deleted auth associations will return None.
        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.user_1_id))
        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                self.user_1_id))

    def test_run_user_deletion_completion_user_wrongly_deleted_emails_enabled(
        self
    ) -> None:
        wipeout_service.run_user_deletion(self.pending_deletion_request)

        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()

        email_content = (
            'The Wipeout process failed for the user with ID \'%s\' '
            'and email \'%s\'.' % (self.user_1_id, self.USER_1_EMAIL)
        )
        send_email_swap = self.swap_with_checks(
            email_manager,
            'send_mail_to_admin',
            lambda x, y: None,
            expected_args=[('WIPEOUT: Account deletion failed', email_content)]
        )

        with send_email_swap, self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.assertEqual(
                wipeout_service.run_user_deletion_completion(
                    self.pending_deletion_request),
                wipeout_domain.USER_VERIFICATION_FAILURE)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            auth_models.UserAuthDetailsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

    def test_run_user_deletion_completion_user_wrongly_deleted_emails_disabled(
        self
    ) -> None:
        wipeout_service.run_user_deletion(self.pending_deletion_request)

        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()

        send_email_swap = self.swap_with_checks(
            email_manager,
            'send_mail_to_admin',
            lambda x, y: None,
            # Func shouldn't be called when emails are disabled.
            called=False
        )

        with self.swap(feconf, 'CAN_SEND_EMAILS', False), send_email_swap:
            self.assertEqual(
                wipeout_service.run_user_deletion_completion(
                    self.pending_deletion_request),
                wipeout_domain.USER_VERIFICATION_FAILURE)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            auth_models.UserAuthDetailsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))


class WipeoutServiceDeleteAppFeedbackReportModelsTests(
        test_utils.GenericTestBase):
    """Tests that the wipeout services properly deletes references in any
    AppFeedbackReportModels with the deleted user.
    """

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    # The timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP_1: Final = datetime.datetime.fromtimestamp(
        1615151836
    )
    # The timestamp in sec since epoch for Mar 8 2021 10:7:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP_2: Final = datetime.datetime.fromtimestamp(
        1615199836
    )
    # The timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP: Final = datetime.datetime.fromtimestamp(
        1616173836
    )

    PLATFORM_ANDROID: Final = 'android'
    REPORT_ID_1: Final = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP_1.second,
        'randomInteger123')
    REPORT_ID_2: Final = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP_2.second,
        'randomInteger321')
    REPORT_ID_3: Final = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP_2.second,
        'differentInt')
    TICKET_ID: Final = '%s.%s.%s' % (
        'random_hash', TICKET_CREATION_TIMESTAMP.second, '16CharString1234')
    REPORT_TYPE_SUGGESTION: Final = 'suggestion'
    CATEGORY_OTHER: Final = 'other'
    PLATFORM_VERSION: Final = '0.1-alpha-abcdef1234'
    COUNTRY_LOCALE_CODE_INDIA: Final = 'in'
    ANDROID_DEVICE_MODEL: Final = 'Pixel 4a'
    ANDROID_SDK_VERSION: Final = 28
    ENTRY_POINT_NAVIGATION_DRAWER: Final = 'navigation_drawer'
    TEXT_LANGUAGE_CODE_ENGLISH: Final = 'en'
    AUDIO_LANGUAGE_CODE_ENGLISH: Final = 'en'
    ANDROID_REPORT_INFO: Final = {
        'user_feedback_other_text_input': 'add an admin',
        'event_logs': ['event1', 'event2'],
        'logcat_logs': ['logcat1', 'logcat2'],
        'package_version_code': 1,
        'language_locale_code': 'en',
        'entry_point_info': {
            'entry_point_name': 'crash',
        },
        'text_size': 'MEDIUM_TEXT_SIZE',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'is_curriculum_admin': False
    }
    ANDROID_REPORT_INFO_SCHEMA_VERSION: Final = 1

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)

        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID_1,
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=self.user_1_id,
            ticket_id='%s.%s.%s' % (
                'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                '16CharString1234'),
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_1,
            local_timezone_offset_hrs=0,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()
        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID_2,
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=self.user_2_id,
            ticket_id='%s.%s.%s' % (
                'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                '16CharString1234'),
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_2,
            local_timezone_offset_hrs=0,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()
        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID_3,
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=self.user_2_id,
            ticket_id='%s.%s.%s' % (
                'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                '16CharString1234'),
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_2,
            local_timezone_offset_hrs=0,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_user_is_pseudonymized_from_report(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        report_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id).pseudonymizable_entity_mappings[
                    models.Names.APP_FEEDBACK_REPORT.value])

        # Verify the user is pseudonymized.
        report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_1))
        self.assertEqual(
            report_model.scrubbed_by, report_mappings[self.REPORT_ID_1])
        self.assertNotEqual(report_model.scrubbed_by, self.user_1_id)

    def test_raises_error_when_field_name_is_not_provided_with_commit_model(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Field name can only be None when commit log model class'
        ):
            wipeout_service._collect_and_save_entity_ids_from_snapshots_and_commits(   # pylint: disable=line-too-long, protected-access
                wipeout_service.get_pending_deletion_request(self.user_1_id),
                models.Names.QUESTION,
                [question_models.QuestionSnapshotMetadataModel],
                question_models.QuestionCommitLogEntryModel,
                None
            )

    def test_same_pseudonym_used_for_same_user(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        report_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id).pseudonymizable_entity_mappings[
                    models.Names.APP_FEEDBACK_REPORT.value])

        # Verify the pseudonym is the same for all report instances.
        report_model_2 = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_2))
        report_model_3 = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_3))
        self.assertEqual(
            report_model_2.scrubbed_by, report_mappings[self.REPORT_ID_2])
        self.assertEqual(
            report_model_3.scrubbed_by, report_mappings[self.REPORT_ID_3])
        self.assertNotEqual(report_model_2.scrubbed_by, self.user_2_id)
        self.assertNotEqual(report_model_3.scrubbed_by, self.user_2_id)

        self.assertEqual(
            report_model_2.scrubbed_by, report_model_3.scrubbed_by)

    def test_different_users_have_different_pseudonyms(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        user_1_report_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id).pseudonymizable_entity_mappings[
                    models.Names.APP_FEEDBACK_REPORT.value])
        user_2_report_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id).pseudonymizable_entity_mappings[
                    models.Names.APP_FEEDBACK_REPORT.value])

        # Verify pseudonyms are different for different users.
        report_model_1 = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_1))
        report_model_2 = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_2))
        self.assertEqual(
            report_model_1.scrubbed_by,
            user_1_report_mappings[self.REPORT_ID_1])
        self.assertEqual(
            report_model_2.scrubbed_by,
            user_2_report_mappings[self.REPORT_ID_2])

        self.assertNotEqual(
            report_model_1.scrubbed_by, report_model_2.scrubbed_by)


class WipeoutServiceVerifyDeleteAppFeedbackReportModelsTests(
        test_utils.GenericTestBase):
    """Tests that the wipeout services properly verifies the deleted status of
    AppFeedbackReportModels with previous references to a deleted user.
    """

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    # The timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP_1: Final = datetime.datetime.fromtimestamp(
        1615151836
    )
    # The timestamp in sec since epoch for Mar 8 2021 10:7:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP_2: Final = datetime.datetime.fromtimestamp(
        1615199836
    )
    # The timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP: Final = datetime.datetime.fromtimestamp(
        1616173836
    )

    PLATFORM_ANDROID: Final = 'android'
    REPORT_ID_1: Final = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP_1.second,
        'randomInteger123')
    REPORT_ID_2: Final = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP_2.second,
        'randomInteger321')
    TICKET_ID: Final = '%s.%s.%s' % (
        'random_hash', TICKET_CREATION_TIMESTAMP.second, '16CharString1234')
    REPORT_TYPE_SUGGESTION: Final = 'suggestion'
    CATEGORY_OTHER: Final = 'other'
    PLATFORM_VERSION: Final = '0.1-alpha-abcdef1234'
    COUNTRY_LOCALE_CODE_INDIA: Final = 'in'
    ANDROID_DEVICE_MODEL: Final = 'Pixel 4a'
    ANDROID_SDK_VERSION: Final = 28
    ENTRY_POINT_NAVIGATION_DRAWER: Final = 'navigation_drawer'
    TEXT_LANGUAGE_CODE_ENGLISH: Final = 'en'
    AUDIO_LANGUAGE_CODE_ENGLISH: Final = 'en'
    ANDROID_REPORT_INFO: Final = {
        'user_feedback_other_text_input': 'add an admin',
        'event_logs': ['event1', 'event2'],
        'logcat_logs': ['logcat1', 'logcat2'],
        'package_version_code': 1,
        'language_locale_code': 'en',
        'entry_point_info': {
            'entry_point_name': 'crash',
        },
        'text_size': 'MEDIUM_TEXT_SIZE',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'is_curriculum_admin': False
    }
    ANDROID_REPORT_INFO_SCHEMA_VERSION: Final = 1

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID_1,
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=self.user_1_id,
            ticket_id='%s.%s.%s' % (
                'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                '16CharString1234'),
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_1,
            local_timezone_offset_hrs=0,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()
        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID_2,
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=self.user_2_id,
            ticket_id='%s.%s.%s' % (
                'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                '16CharString1234'),
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_2,
            local_timezone_offset_hrs=0,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID_1,
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=self.user_1_id,
            ticket_id='%s.%s.%s' % (
                'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                '16CharString1234'),
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_1,
            local_timezone_offset_hrs=0,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteConfigModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    CONFIG_1_ID: Final = 'config_1_id'
    CONFIG_2_ID: Final = 'config_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        config_models.ConfigPropertyModel(
            id=self.CONFIG_1_ID, value='a'
        ).commit(self.user_1_id, [{'cmd': 'command'}])
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_config_property_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        config_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        metadata_model = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id, config_mappings[self.CONFIG_1_ID])

    def test_one_config_property_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        config_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        self.assertEqual(
            metadata_model.committer_id, config_mappings[self.CONFIG_1_ID])

    def test_multiple_config_properties_are_pseudonymized(self) -> None:
        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='b'
        ).commit(self.user_1_id, [{'cmd': 'command'}])

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        config_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        metadata_model_1 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_1.committer_id, config_mappings[self.CONFIG_1_ID])

        metadata_model_2 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_2_ID)
        )
        self.assertEqual(
            metadata_model_2.committer_id, config_mappings[self.CONFIG_2_ID])

    def test_multiple_config_properties_with_multiple_users_are_pseudonymized(
        self
    ) -> None:
        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='b'
        ).commit(self.user_2_id, [{'cmd': 'command'}])

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        config_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        metadata_model_1 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_1.committer_id, config_mappings_1[self.CONFIG_1_ID])

        # Verify second user is not yet deleted.
        metadata_model_2 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_2_ID)
        )
        self.assertEqual(
            metadata_model_2.committer_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        config_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        metadata_model_3 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_2_ID)
        )
        self.assertEqual(
            metadata_model_3.committer_id, config_mappings_2[self.CONFIG_2_ID])

    def test_one_config_property_with_multiple_users_is_pseudonymized(
        self
    ) -> None:
        config_models.ConfigPropertyModel.get_by_id(
            self.CONFIG_1_ID
        ).commit(self.user_2_id, [{'cmd': 'command'}])

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        config_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        metadata_model_1 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_1.committer_id, config_mappings_1[self.CONFIG_1_ID])

        # Verify second user is not yet deleted.
        metadata_model_2 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-2' % self.CONFIG_1_ID)
        )
        self.assertEqual(metadata_model_2.committer_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        config_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.CONFIG.value]
        )
        metadata_model_3 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-2' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_3.committer_id, config_mappings_2[self.CONFIG_1_ID])


class WipeoutServiceVerifyDeleteConfigModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    CONFIG_1_ID: Final = 'config_1_id'
    CONFIG_2_ID: Final = 'config_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        config_model = config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='a'
        )
        config_model.commit(self.user_1_id, [{'cmd': 'command'}])
        config_model.commit(self.user_1_id, [{'cmd': 'command_2'}])
        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='a'
        ).commit(self.user_1_id, [{'cmd': 'command'}])
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='a'
        ).commit(self.user_1_id, [{'cmd': 'command'}])

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteCollectionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    COL_1_ID: Final = 'col_1_id'
    COL_2_ID: Final = 'col_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_valid_collection(self.COL_1_ID, self.user_1_id)
        self.publish_collection(self.user_1_id, self.COL_1_ID)
        rights_manager.assign_role_for_collection(
            user_services.get_user_actions_info(self.user_1_id),
            self.COL_1_ID,
            self.user_2_id,
            feconf.ROLE_OWNER)

    def test_one_collection_snapshot_metadata_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.COLLECTION.value]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        rights_metadata_model_1 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_1.committer_id,
            collection_mappings[self.COL_1_ID])
        self.assertEqual(
            rights_metadata_model_1.content_user_ids,
            [collection_mappings[self.COL_1_ID]])
        self.assertEqual(rights_metadata_model_1.commit_cmds_user_ids, [])
        rights_metadata_model_2 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '%s-2' % self.COL_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_2.committer_id,
            collection_mappings[self.COL_1_ID])
        self.assertEqual(
            rights_metadata_model_2.content_user_ids,
            [collection_mappings[self.COL_1_ID]])
        self.assertEqual(rights_metadata_model_2.commit_cmds_user_ids, [])

    def test_one_collection_snapshot_content_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.COLLECTION.value]
        )
        rights_content_model_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            rights_content_model_1.content['owner_ids'],
            [collection_mappings[self.COL_1_ID]])
        rights_content_model_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '%s-3' % self.COL_1_ID)
        )
        self.assertItemsEqual(
            rights_content_model_2.content['owner_ids'],
            [
                collection_mappings[self.COL_1_ID],
                self.user_2_id
            ])

    def test_one_collection_commit_log_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.COLLECTION.value]
        )
        commit_log_model_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.COL_1_ID)
        )
        self.assertEqual(
            commit_log_model_1.user_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-%s-3' % self.COL_1_ID)
        )
        self.assertEqual(
            commit_log_model_2.user_id,
            collection_mappings[self.COL_1_ID])

    def test_one_collection_with_missing_snapshot_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        collection_models.CollectionCommitLogEntryModel(
            id='collection-%s-1' % self.COL_2_ID,
            collection_id=self.COL_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertItemsEqual(
            log_messages,
            [
                '[WIPEOUT] The commit log model '
                '\'CollectionCommitLogEntryModel\' and '
                'snapshot models [\'CollectionSnapshotMetadataModel\', '
                '\'CollectionRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [\'%s\'].' % self.COL_2_ID,
            ]
        )

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.COLLECTION.value]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id,
            collection_mappings[self.COL_2_ID])

    def test_one_collection_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.COLLECTION.value]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id,
            collection_mappings[self.COL_1_ID])

    def test_collection_user_is_removed_from_contributors(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {self.user_1_id: 2}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_col_user_is_removed_from_contributor_ids_when_missing_from_summary(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_delete_exp_where_user_has_role_when_rights_model_marked_as_deleted(
        self
    ) -> None:
        self.save_new_valid_collection(self.COL_2_ID, self.user_1_id)
        collection_services.delete_collection(self.user_1_id, self.COL_2_ID)

        collection_rights_model = (
            collection_models.CollectionRightsModel.get_by_id(self.COL_2_ID))
        self.assertTrue(collection_rights_model.deleted)
        collection_model = (
            collection_models.CollectionModel.get_by_id(self.COL_2_ID))
        self.assertTrue(collection_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            collection_models.CollectionRightsModel.get_by_id(self.COL_2_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COL_2_ID))

    def test_multiple_collections_are_pseudonymized(self) -> None:
        self.save_new_valid_collection(self.COL_2_ID, self.user_1_id)
        self.publish_collection(self.user_1_id, self.COL_2_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.COLLECTION.value]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            collection_mappings[self.COL_1_ID])
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_2_ID])
        commit_log_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            collection_mappings[self.COL_2_ID])


class WipeoutServiceVerifyDeleteCollectionModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    COL_1_ID: Final = 'col_1_id'
    COL_2_ID: Final = 'col_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_valid_collection(self.COL_1_ID, self.user_1_id)
        self.publish_collection(self.user_1_id, self.COL_1_ID)
        self.save_new_valid_collection(self.COL_2_ID, self.user_1_id)
        self.publish_collection(self.user_1_id, self.COL_2_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        collection_models.CollectionSnapshotMetadataModel(
            id='%s-1' % self.COL_1_ID,
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteExplorationModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_valid_exploration(self.EXP_1_ID, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXP_1_ID)
        rights_manager.assign_role_for_exploration(
            user_services.get_user_actions_info(self.user_1_id),
            self.EXP_1_ID,
            self.user_2_id,
            feconf.ROLE_OWNER)

    def test_one_exploration_snapshot_metadata_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.EXPLORATION.value]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id,
            exploration_mappings[self.EXP_1_ID])
        rights_metadata_model_1 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_1.committer_id,
            exploration_mappings[self.EXP_1_ID])
        self.assertEqual(
            rights_metadata_model_1.content_user_ids,
            [exploration_mappings[self.EXP_1_ID]])
        self.assertEqual(rights_metadata_model_1.commit_cmds_user_ids, [])
        rights_metadata_model_2 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '%s-2' % self.EXP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_2.committer_id,
            exploration_mappings[self.EXP_1_ID])
        self.assertEqual(
            rights_metadata_model_2.content_user_ids,
            [exploration_mappings[self.EXP_1_ID]])
        self.assertEqual(rights_metadata_model_2.commit_cmds_user_ids, [])

    def test_one_exploration_snapshot_content_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.EXPLORATION.value]
        )
        rights_content_model_1 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            rights_content_model_1.content['owner_ids'],
            [exploration_mappings[self.EXP_1_ID]])
        rights_content_model_2 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '%s-3' % self.EXP_1_ID)
        )
        self.assertItemsEqual(
            rights_content_model_2.content['owner_ids'],
            [
                exploration_mappings[self.EXP_1_ID],
                self.user_2_id
            ])

    def test_one_exploration_commit_log_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.EXPLORATION.value]
        )
        commit_log_model_1 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.EXP_1_ID)
        )
        self.assertEqual(
            commit_log_model_1.user_id, exploration_mappings[self.EXP_1_ID])

        commit_log_model_2 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-%s-3' % self.EXP_1_ID)
        )
        self.assertEqual(
            commit_log_model_2.user_id, exploration_mappings[self.EXP_1_ID])

    def test_one_exploration_with_missing_snapshot_is_pseudonymized(
        self
    ) -> None:
        exp_models.ExplorationCommitLogEntryModel(
            id='exploration-%s-1' % self.EXP_2_ID,
            exploration_id=self.EXP_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.pre_delete_user(self.user_1_id)
            self.process_and_flush_pending_tasks()
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertItemsEqual(
            log_messages,
            [
                '[WIPEOUT] The commit log model '
                '\'ExplorationCommitLogEntryModel\' and '
                'snapshot models [\'ExplorationSnapshotMetadataModel\', '
                '\'ExplorationRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [\'%s\'].' % self.EXP_2_ID
            ]
        )

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.EXPLORATION.value]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model_1 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model_2 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id, exploration_mappings[self.EXP_2_ID])

    def test_one_exploration_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.EXPLORATION.value]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id, exploration_mappings[self.EXP_1_ID])

    def test_exploration_user_is_removed_from_contributors(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {self.user_1_id: 2}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_exp_user_is_removed_from_contributor_ids_when_missing_from_summary(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_delete_exp_where_user_has_role_when_rights_model_marked_as_deleted(
        self
    ) -> None:
        self.save_new_valid_exploration(self.EXP_2_ID, self.user_1_id)
        exp_services.delete_exploration(self.user_1_id, self.EXP_2_ID)

        exp_rights_model = (
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_2_ID))
        self.assertTrue(exp_rights_model.deleted)
        exp_model = (
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_2_ID))
        self.assertTrue(exp_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_2_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_2_ID))

    def test_multiple_explorations_are_pseudonymized(self) -> None:
        self.save_new_valid_exploration(self.EXP_2_ID, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXP_2_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.EXPLORATION.value]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, exploration_mappings[self.EXP_1_ID])
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_2_ID])
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, exploration_mappings[self.EXP_2_ID])


class WipeoutServiceVerifyDeleteExplorationModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_valid_exploration(self.EXP_1_ID, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXP_1_ID)
        self.save_new_valid_exploration(self.EXP_2_ID, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXP_2_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        exp_models.ExplorationSnapshotMetadataModel(
            id='%s-1' % self.EXP_1_ID,
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteFeedbackModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    FEEDBACK_1_ID: Final = 'feedback_1_id'
    FEEDBACK_2_ID: Final = 'feedback_2_id'
    MESSAGE_1_ID: Final = 'message_1_id'
    MESSAGE_2_ID: Final = 'message_2_id'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    NUMBER_OF_MODELS: Final = 150

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        feedback_models.GeneralFeedbackThreadModel(
            id=self.FEEDBACK_1_ID,
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            original_author_id=self.user_1_id,
            subject='Wrong state name',
            has_suggestion=True,
            last_nonempty_message_text='Some text',
            last_nonempty_message_author_id=self.user_2_id
        ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id=self.MESSAGE_1_ID,
            thread_id=self.FEEDBACK_1_ID,
            message_id=0,
            author_id=self.user_2_id,
            text='Some text'
        ).put()
        suggestion_models.GeneralSuggestionModel(
            id=self.FEEDBACK_1_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_feedback_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is pseudonymized.
        feedback_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.FEEDBACK.value]
        )
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            feedback_thread_model.original_author_id,
            feedback_mappings[self.FEEDBACK_1_ID]
        )
        suggestion_model_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            suggestion_model_model.author_id,
            feedback_mappings[self.FEEDBACK_1_ID]
        )

    def test_one_feedback_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return feedback thread model to the original user ID.
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        feedback_thread_model.original_author_id = self.user_1_id
        feedback_thread_model.update_timestamps()
        feedback_thread_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the feedback thread and the suggestion have the same
        # pseudonymous user ID.
        feedback_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.FEEDBACK.value]
        )
        new_feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            new_feedback_thread_model.original_author_id,
            feedback_mappings[self.FEEDBACK_1_ID]
        )

    def test_multiple_feedbacks_are_pseudonymized(self) -> None:
        feedback_thread_models = []
        for i in range(self.NUMBER_OF_MODELS):
            feedback_thread_models.append(
                feedback_models.GeneralFeedbackThreadModel(
                    id='feedback-%s' % i,
                    entity_type=feconf.ENTITY_TYPE_EXPLORATION,
                    entity_id=self.EXP_1_ID,
                    original_author_id=self.user_1_id,
                    subject='Too short exploration',
                    last_nonempty_message_text='Some text',
                    last_nonempty_message_author_id=self.user_2_id
                )
            )
            feedback_models.GeneralFeedbackThreadModel.update_timestamps_multi(
                feedback_thread_models)
        feedback_message_models = []
        for i in range(self.NUMBER_OF_MODELS):
            feedback_message_models.append(
                feedback_models.GeneralFeedbackMessageModel(
                    id='message-%s' % i,
                    thread_id='feedback-%s' % i,
                    message_id=i,
                    author_id=self.user_1_id,
                    text='Some text'
                )
            )
            feedback_models.GeneralFeedbackMessageModel.update_timestamps_multi(
                feedback_message_models)
        datastore_services.put_multi(feedback_message_models)
        datastore_services.put_multi(feedback_thread_models)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        feedback_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.FEEDBACK.value]
        )

        pseudonymized_feedback_thread_models = (
            feedback_models.GeneralFeedbackThreadModel.get_multi(
                [model.id for model in feedback_thread_models]
            )
        )
        for feedback_thread_model in pseudonymized_feedback_thread_models:
            # Ruling out the possibility of None for mypy type checking.
            assert feedback_thread_model is not None
            self.assertEqual(
                feedback_thread_model.original_author_id,
                feedback_mappings[feedback_thread_model.id]
            )

        pseudonymized_feedback_message_models = (
            feedback_models.GeneralFeedbackMessageModel.get_multi(
                [model.id for model in feedback_message_models]
            )
        )
        for feedback_message_model in pseudonymized_feedback_message_models:
            # Ruling out the possibility of None for mypy type checking.
            assert feedback_message_model is not None
            self.assertEqual(
                feedback_message_model.author_id,
                feedback_mappings[feedback_message_model.thread_id]
            )

    def test_one_feedback_with_multiple_users_is_pseudonymized(self) -> None:

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        feedback_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.FEEDBACK.value]
        )

        # Verify first user is pseudonymized.
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            feedback_thread_model.original_author_id,
            feedback_mappings_1[self.FEEDBACK_1_ID]
        )

        # Verify second user is not yet pseudonymized.
        self.assertEqual(
            feedback_thread_model.last_nonempty_message_author_id,
            self.user_2_id
        )

        # Delete second user.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        feedback_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.FEEDBACK.value]
        )

        # Verify second user is pseudonymized.
        self.assertEqual(
            feedback_thread_model.last_nonempty_message_author_id,
            feedback_mappings_2[self.FEEDBACK_1_ID]
        )


class WipeoutServiceVerifyDeleteFeedbackModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    FEEDBACK_1_ID: Final = 'feedback_1_id'
    MESSAGE_1_ID: Final = 'message_1_id'
    EXP_1_ID: Final = 'exp_1_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        feedback_models.GeneralFeedbackThreadModel(
            id=self.FEEDBACK_1_ID,
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            original_author_id=self.user_1_id,
            subject='Wrong state name',
            has_suggestion=True,
            last_nonempty_message_text='Some text',
            last_nonempty_message_author_id=self.user_1_id
        ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id=self.MESSAGE_1_ID,
            thread_id=self.FEEDBACK_1_ID,
            message_id=0,
            author_id=self.user_1_id,
            text='Some text'
        ).put()
        suggestion_models.GeneralSuggestionModel(
            id=self.FEEDBACK_1_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=self.user_1_id,
            final_reviewer_id=self.user_1_id,
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        feedback_models.GeneralFeedbackThreadModel(
            id=self.FEEDBACK_1_ID,
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            original_author_id=self.user_1_id,
            subject='Wrong state name',
            has_suggestion=True,
            last_nonempty_message_text='Some text',
            last_nonempty_message_author_id=self.user_1_id
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteImprovementsModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.improvements_model_1_id = (
            improvements_models.ExplorationStatsTaskEntryModel.create(
                entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
                entity_id=self.EXP_1_ID,
                entity_version=1,
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                target_type=constants.TASK_TARGET_TYPE_STATE,
                target_id='State',
                issue_description=None,
                status=constants.TASK_STATUS_RESOLVED,
                resolver_id=self.user_1_id
            )
        )
        self.improvements_model_2_id = (
            improvements_models.ExplorationStatsTaskEntryModel.create(
                entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
                entity_id=self.EXP_2_ID,
                entity_version=1,
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                target_type=constants.TASK_TARGET_TYPE_STATE,
                target_id='State',
                issue_description=None,
                status=constants.TASK_STATUS_RESOLVED,
                resolver_id=self.user_1_id
            )
        )

    def test_delete_user_is_successful(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            improvements_models.ExplorationStatsTaskEntryModel.get_by_id(
                self.improvements_model_1_id))
        self.assertIsNotNone(
            improvements_models.ExplorationStatsTaskEntryModel.get_by_id(
                self.improvements_model_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        task_entry_model1 = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                self.improvements_model_1_id))
        task_entry_model2 = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                self.improvements_model_2_id))
        self.assertNotEqual(task_entry_model1.resolver_id, self.user_1_id)
        self.assertEqual(task_entry_model1.resolver_id[:3], 'pid')
        self.assertEqual(
            task_entry_model1.resolver_id, task_entry_model2.resolver_id)


class WipeoutServiceVerifyDeleteImprovementsModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'
    EXP_3_ID: Final = 'exp_3_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        improvements_models.ExplorationStatsTaskEntryModel.create(
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            entity_version=1,
            task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id='State',
            issue_description=None,
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.user_1_id
        )
        improvements_models.ExplorationStatsTaskEntryModel.create(
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_2_ID,
            entity_version=1,
            task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id='State',
            issue_description=None,
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.user_1_id
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        task_entry_id = (
            improvements_models.ExplorationStatsTaskEntryModel.generate_task_id(
                constants.TASK_ENTITY_TYPE_EXPLORATION,
                self.EXP_2_ID,
                1,
                constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                constants.TASK_TARGET_TYPE_STATE,
                'State'
            )
        )
        task_entry_model = (
            improvements_models.ExplorationStatsTaskEntryModel.get(
                task_entry_id))
        task_entry_model.resolver_id = self.user_1_id
        task_entry_model.update_timestamps()
        task_entry_model.put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteQuestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    SKILL_1_ID: Final = 'skill_1_id'
    QUESTION_1_ID: Final = 'question_1_id'
    QUESTION_2_ID: Final = 'question_2_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_curriculum_admins([self.USER_1_USERNAME, self.USER_2_USERNAME])
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_1_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_1_ID],
            content_id_generator.next_content_id_index
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_question_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_1_ID])

    def test_one_question_with_missing_snapshot_is_pseudonymized(self) -> None:
        question_models.QuestionCommitLogEntryModel(
            id='question-%s-1' % self.QUESTION_2_ID,
            question_id=self.QUESTION_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model \'QuestionCommitLogEntryModel\' '
             'and snapshot models [\'QuestionSnapshotMetadataModel\'] IDs '
             'differ. Snapshots without commit logs: [], '
             'commit logs without snapshots: [\'%s\'].' % self.QUESTION_2_ID])

        # Verify user is deleted.
        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model_1 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model_2 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id, question_mappings[self.QUESTION_2_ID])

    def test_one_question_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_1_ID])

    def test_multiple_questions_are_pseudonymized(self) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_1_ID],
            content_id_generator.next_content_id_index
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_1_ID])
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_2_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_2_ID])

    def test_multiple_questions_with_multiple_users_are_pseudonymized(
        self
    ) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_2_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_1_ID],
            content_id_generator.next_content_id_index
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        question_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_1[self.QUESTION_1_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_1[self.QUESTION_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        question_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_2[self.QUESTION_2_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_2[self.QUESTION_2_ID])

    def test_one_question_with_multiple_users_is_pseudonymized(self) -> None:
        question_services.update_question(
            self.user_2_id,
            self.QUESTION_1_ID,
            [question_domain.QuestionChange({
                'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
                'property_name': (
                    question_domain.QUESTION_PROPERTY_LANGUAGE_CODE),
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        question_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_1[self.QUESTION_1_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_1[self.QUESTION_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        question_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.QUESTION.value]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_2[self.QUESTION_1_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_2[self.QUESTION_1_ID])


class WipeoutServiceVerifyDeleteQuestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    SKILL_1_ID: Final = 'SKILL_1_ID'
    QUESTION_1_ID: Final = 'QUESTION_1_ID'
    QUESTION_2_ID: Final = 'QUESTION_2_ID'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_curriculum_admins([self.USER_1_USERNAME, self.USER_2_USERNAME])
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_1_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_1_ID],
            content_id_generator.next_content_id_index
        )
        content_id_generator = translation_domain.ContentIdGenerator()
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_2_id,
            self._create_valid_question_data('ABC', content_id_generator),
            [self.SKILL_1_ID],
            content_id_generator.next_content_id_index
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        question_services.update_question(
            self.user_2_id,
            self.QUESTION_2_ID,
            [question_domain.QuestionChange({
                'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
                'property_name': (
                    question_domain.QUESTION_PROPERTY_LANGUAGE_CODE),
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )


class WipeoutServiceDeleteSkillModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    SKILL_1_ID: Final = 'skill_1_id'
    SKILL_2_ID: Final = 'skill_2_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_curriculum_admins([self.USER_1_USERNAME, self.USER_2_USERNAME])
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_skill_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_1_ID])

    def test_one_skill_with_missing_snapshot_is_pseudonymized(self) -> None:
        skill_models.SkillCommitLogEntryModel(
            id='skill-%s-1' % self.SKILL_2_ID,
            skill_id=self.SKILL_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model \'SkillCommitLogEntryModel\' and '
             'snapshot models [\'SkillSnapshotMetadataModel\'] IDs differ. '
             'Snapshots without commit logs: [], '
             'commit logs without snapshots: [\'%s\'].' % self.SKILL_2_ID])

        # Verify user is deleted.
        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model_1 = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model_1.user_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model_2 = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model_2.user_id, skill_mappings[self.SKILL_2_ID])

    def test_one_skill_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_1_ID])

    def test_multiple_skills_are_pseudonymized(self) -> None:
        self.save_new_skill(self.SKILL_2_ID, self.user_1_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_1_ID])
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_2_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_2_ID])

    def test_multiple_skills_with_multiple_users_are_pseudonymized(
        self
    ) -> None:
        self.save_new_skill(self.SKILL_2_ID, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        skill_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_1[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_1[self.SKILL_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        skill_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_2[self.SKILL_2_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_2[self.SKILL_2_ID])

    def test_one_skill_with_multiple_users_is_pseudonymized(self) -> None:
        skill_services.update_skill(
            self.user_2_id,
            self.SKILL_1_ID,
            [skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        skill_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_1[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_1[self.SKILL_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-2' % self.SKILL_1_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-2' % self.SKILL_1_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        skill_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.SKILL.value]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-2' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_2[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-2' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_2[self.SKILL_1_ID])


class WipeoutServiceVerifyDeleteSkillModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    SKILL_1_ID: Final = 'skill_1_id'
    SKILL_2_ID: Final = 'skill_2_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_curriculum_admins([self.USER_1_USERNAME, self.USER_2_USERNAME])
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_skill(self.SKILL_2_ID, self.user_2_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        skill_services.update_skill(
            self.user_2_id,
            self.SKILL_2_ID,
            [skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))


class WipeoutServiceDeleteStoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    TOPIC_1_ID: Final = 'topic_1_id'
    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_topic(
            self.TOPIC_1_ID,
            self.user_1_id,
            abbreviated_name='abbrev-one',
            url_fragment='frag-one',
            canonical_story_ids=[self.STORY_1_ID])
        self.save_new_story(self.STORY_1_ID, self.user_1_id, self.TOPIC_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_story_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_1_ID])

    def test_one_story_with_missing_snapshot_is_pseudonymized(self) -> None:
        story_models.StoryCommitLogEntryModel(
            id='story-%s-1' % self.STORY_2_ID,
            story_id=self.STORY_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model \'StoryCommitLogEntryModel\' and '
             'snapshot models [\'StorySnapshotMetadataModel\'] IDs differ. '
             'Snapshots without commit logs: [], '
             'commit logs without snapshots: [\'%s\'].' % self.STORY_2_ID])

        # Verify user is deleted.
        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model_1 = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model_1.user_id, story_mappings[self.STORY_1_ID])
        commit_log_model_2 = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model_2.user_id, story_mappings[self.STORY_2_ID])

    def test_one_story_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_1_ID])

    def test_multiple_stories_are_pseudonymized(self) -> None:
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_1_id, name='Topic 2',
            abbreviated_name='abbrev-two', url_fragment='frag-two')
        self.save_new_story(self.STORY_2_ID, self.user_1_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_1_ID])
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_2_ID])

    def test_multiple_stories_with_multiple_users_are_pseudonymized(
        self
    ) -> None:
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_2_id, name='Topic 2',
            abbreviated_name='abbrev-three', url_fragment='frag-three')
        self.save_new_story(self.STORY_2_ID, self.user_2_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        story_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_1[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_1[self.STORY_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        story_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_2[self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_2[self.STORY_2_ID])

    def test_one_story_with_multiple_users_is_pseudonymized(self) -> None:
        story_services.update_story(
            self.user_2_id,
            self.STORY_1_ID,
            [story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 2'
            })],
            'Add node.'
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        story_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_1[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_1[self.STORY_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-2' % self.STORY_1_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-2' % self.STORY_1_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        story_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.STORY.value]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-2' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_2[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-2' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_2[self.STORY_1_ID])


class WipeoutServiceVerifyDeleteStoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    TOPIC_1_ID: Final = 'topic_1_id'
    TOPIC_2_ID: Final = 'topic_2_id'
    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_1_id, abbreviated_name='abbrev-four',
            url_fragment='frag-four')
        self.save_new_story(self.STORY_1_ID, self.user_1_id, self.TOPIC_1_ID)
        self.save_new_topic(
            self.TOPIC_2_ID,
            self.user_2_id,
            name='Topic 2',
            abbreviated_name='abbrev-five',
            url_fragment='frag-five',
            canonical_story_ids=[self.STORY_2_ID])
        self.save_new_story(self.STORY_2_ID, self.user_2_id, self.TOPIC_2_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        story_services.update_story(
            self.user_2_id,
            self.STORY_2_ID,
            [story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 2'
            })],
            'Add node.'
        )

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))


class WipeoutServiceDeleteSubtopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    TOP_1_ID: Final = 'top_1_id'
    SUBTOP_1_ID: Final = 1
    SUBTOP_2_ID: Final = 2

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        self.subtopic_page = self.save_new_subtopic(
            self.SUBTOP_1_ID, self.user_1_id, self.TOP_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_subtopic_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

    def test_one_subtopic_with_missing_snapshot_is_pseudonymized(self) -> None:
        subtopic_models.SubtopicPageCommitLogEntryModel(
            id='%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID),
            subtopic_page_id=str(self.SUBTOP_2_ID),
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model '
             '\'SubtopicPageCommitLogEntryModel\' and snapshot models '
             '[\'SubtopicPageSnapshotMetadataModel\'] IDs differ. '
             'Snapshots without commit logs: [], '
             'commit logs without snapshots: [\'%s\'].' % self.SUBTOP_2_ID])

        # Verify user is deleted.
        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

    def test_one_subtopic_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

    def test_multiple_subtopics_are_pseudonymized(self) -> None:
        self.save_new_subtopic(self.SUBTOP_2_ID, self.user_1_id, self.TOP_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])

    def test_multiple_subtopics_with_multiple_users_are_pseudonymized(
        self
    ) -> None:
        self.save_new_subtopic(self.SUBTOP_2_ID, self.user_2_id, self.TOP_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        subtopic_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

        # Verify second user is not yet deleted.
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        subtopic_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])

    def test_one_subtopic_with_multiple_users_is_pseudonymized(self) -> None:
        subtopic_page_services.save_subtopic_page(
            self.user_2_id,
            self.subtopic_page,
            'Change subtopic',
            [
                subtopic_page_domain.SubtopicPageChange({
                    'cmd': (
                        subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY),
                    'property_name': (
                        subtopic_page_domain
                        .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
                    'new_value': 'new value',
                    'old_value': 'old value',
                    'subtopic_id': self.SUBTOP_1_ID
                })
            ]
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        subtopic_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

        # Verify second user is not yet deleted.
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        subtopic_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.Names.SUBTOPIC.value]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])


class WipeoutServiceVerifyDeleteSubtopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    TOP_1_ID: Final = 'top_1_id'
    SUBTOP_1_ID: Final = 1

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        self.save_new_subtopic(self.SUBTOP_1_ID, self.user_1_id, self.TOP_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        subtopic_models.SubtopicPageSnapshotMetadataModel(
            id='%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID),
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteSuggestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    VOICEOVER_1_ID: Final = 'voiceover_1_id'
    VOICEOVER_2_ID: Final = 'voiceover_2_id'
    TRANSLATION_STATS_1_ID: Final = 'translation_1_id'
    QUESTION_STATS_1_ID = 'question_1_id'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        suggestion_models.TranslationContributionStatsModel(
            id=self.TRANSLATION_STATS_1_ID,
            language_code='cs',
            contributor_user_id=self.user_1_id,
            topic_id='topic',
            submitted_translations_count=1,
            submitted_translation_word_count=1,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=2,
            accepted_translation_word_count=3,
            rejected_translations_count=4,
            rejected_translation_word_count=6,
            contribution_dates=[]
        ).put()
        suggestion_models.TranslationReviewStatsModel(
            id=self.TRANSLATION_STATS_1_ID,
            language_code='cs',
            reviewer_user_id=self.user_1_id,
            topic_id='topic',
            reviewed_translations_count=1,
            reviewed_translation_word_count=1,
            accepted_translations_count=1,
            accepted_translations_with_reviewer_edits_count=2,
            accepted_translation_word_count=3,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        suggestion_models.QuestionContributionStatsModel(
            id=self.QUESTION_STATS_1_ID,
            contributor_user_id=self.user_1_id,
            topic_id='topic',
            submitted_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=2,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        suggestion_models.QuestionReviewStatsModel(
            id=self.QUESTION_STATS_1_ID,
            reviewer_user_id=self.user_1_id,
            topic_id='topic',
            reviewed_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_with_reviewer_edits_count=1,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id=self.TRANSLATION_STATS_1_ID,
            language_code='cs',
            contributor_id=self.user_1_id,
            topic_ids_with_translation_submissions=['topic1', 'topic2'],
            recent_review_outcomes=['accepted', 'rejected'],
            recent_performance=1,
            overall_accuracy=1.0,
            submitted_translations_count=1,
            submitted_translation_word_count=1,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=2,
            accepted_translation_word_count=3,
            rejected_translations_count=4,
            rejected_translation_word_count=6,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id=self.TRANSLATION_STATS_1_ID,
            language_code='cs',
            contributor_id=self.user_1_id,
            topic_ids_with_translation_reviews=['topic1', 'topic2'],
            reviewed_translations_count=1,
            accepted_translations_count=1,
            accepted_translations_with_reviewer_edits_count=2,
            accepted_translation_word_count=3,
            rejected_translations_count=2,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id=self.QUESTION_STATS_1_ID,
            contributor_id=self.user_1_id,
            topic_ids_with_question_submissions=['topic1', 'topic2'],
            recent_review_outcomes=['accepted', 'rejected'],
            recent_performance=1,
            overall_accuracy=1.0,
            submitted_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=2,
            rejected_questions_count=1,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id=self.QUESTION_STATS_1_ID,
            contributor_id=self.user_1_id,
            topic_ids_with_question_reviews=['topic1', 'topic2'],
            reviewed_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_with_reviewer_edits_count=1,
            rejected_questions_count=1,
            first_contribution_date=(
                datetime.date.fromtimestamp(1616173837)),
            last_contribution_date=(
                datetime.date.fromtimestamp(1616173837))
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_translation_contribution_stats_are_deleted(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.TranslationContributionStatsModel.get_by_id(
                self.TRANSLATION_STATS_1_ID))

    def test_translation_review_stats_are_deleted(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.TranslationReviewStatsModel.get_by_id(
                self.TRANSLATION_STATS_1_ID))

    def test_question_contribution_stats_are_deleted(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.QuestionContributionStatsModel.get_by_id(
                self.QUESTION_STATS_1_ID))

    def test_question_review_stats_are_deleted(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.QuestionReviewStatsModel.get_by_id(
                self.QUESTION_STATS_1_ID))

    def test_translation_submitter_total_contribution_stats_are_deleted(
            self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get_by_id(
                self.TRANSLATION_STATS_1_ID))

    def test_translation_reviewer_total_contribution_stats_are_deleted(
            self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get_by_id(
                self.TRANSLATION_STATS_1_ID))

    def test_question_submitter_total_contribution_stats_are_deleted(
            self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_by_id(
                self.QUESTION_STATS_1_ID))


class WipeoutServiceDeletePinnedOpportunitiesModelsTest(
    test_utils.GenericTestBase
):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@example.com'
    TOPIC_ID: Final = 'topic_1'
    OPPORTUNITY_ID: Final = 'opportunity_1'
    LANGUAGE_CODE: Final = 'en'
    USER_1_USERNAME: Final = 'user1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        user_models.PinnedOpportunityModel.create(
            user_id=self.user_1_id,
            topic_id=self.TOPIC_ID,
            opportunity_id=self.OPPORTUNITY_ID,
            language_code='en'
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_pinned_opportunities_are_deleted(self) -> None:
        self.assertIsNotNone(
            user_models.PinnedOpportunityModel.get_model(
                user_id=self.user_1_id,
                language_code=self.LANGUAGE_CODE,
                topic_id=self.TOPIC_ID
            ))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.PinnedOpportunityModel.get_model(
                user_id=self.user_1_id,
                language_code=self.LANGUAGE_CODE,
                topic_id=self.TOPIC_ID
            ))


class WipeoutServiceVerifyDeleteSuggestionModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    VOICEOVER_1_ID: Final = 'voiceover_1_id'
    VOICEOVER_2_ID: Final = 'voiceover_2_id'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteTopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    TOP_1_ID: Final = 'top_1_id'
    TOP_2_ID: Final = 'top_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        user_services.add_user_role(
            self.user_1_id, feconf.ROLE_ID_CURRICULUM_ADMIN)
        user_services.add_user_role(
            self.user_2_id, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_1_actions = user_services.get_user_actions_info(
            self.user_1_id)
        self.user_2_actions = user_services.get_user_actions_info(
            self.user_2_id)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        topic_services.assign_role(
            self.user_1_actions,
            self.user_1_actions,
            topic_domain.ROLE_MANAGER,
            self.TOP_1_ID)
        topic_services.assign_role(
            self.user_1_actions,
            self.user_2_actions,
            topic_domain.ROLE_MANAGER,
            self.TOP_1_ID)

    def test_one_topic_snapshot_metadata_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.TOPIC.value]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        rights_metadata_model_1 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_1.committer_id, topic_mappings[self.TOP_1_ID])
        self.assertEqual(
            rights_metadata_model_1.content_user_ids, [])
        self.assertEqual(rights_metadata_model_1.commit_cmds_user_ids, [])
        rights_metadata_model_2 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '%s-2' % self.TOP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_2.committer_id, topic_mappings[self.TOP_1_ID])
        self.assertEqual(
            rights_metadata_model_2.content_user_ids,
            [topic_mappings[self.TOP_1_ID]])
        self.assertEqual(
            rights_metadata_model_2.commit_cmds_user_ids,
            [topic_mappings[self.TOP_1_ID]])

    def test_one_topic_snapshot_content_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.TOPIC.value]
        )
        rights_content_model_1 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            rights_content_model_1.content['manager_ids'], [])
        rights_content_model_2 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '%s-3' % self.TOP_1_ID)
        )
        self.assertItemsEqual(
            rights_content_model_2.content['manager_ids'],
            [
                topic_mappings[self.TOP_1_ID],
                self.user_2_id
            ])

    def test_one_topic_commit_log_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.TOPIC.value]
        )
        commit_log_model_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.TOP_1_ID)
        )
        self.assertEqual(
            commit_log_model_1.user_id, topic_mappings[self.TOP_1_ID])

    def test_one_topic_with_missing_snapshot_is_pseudonymized(self) -> None:
        topic_models.TopicCommitLogEntryModel(
            id='topic-%s-1' % self.TOP_2_ID,
            topic_id=self.TOP_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.pre_delete_user(self.user_1_id)
            self.process_and_flush_pending_tasks()
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertItemsEqual(
            log_messages,
            [
                '[WIPEOUT] The commit log model \'TopicCommitLogEntryModel\' '
                'and snapshot models [\'TopicSnapshotMetadataModel\', '
                '\'TopicRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [\'%s\'].' % self.TOP_2_ID
            ]
        )

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.TOPIC.value]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        commit_log_model_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id, topic_mappings[self.TOP_1_ID])
        commit_log_model_2 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id, topic_mappings[self.TOP_2_ID])

    def test_one_topic_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.TOPIC.value]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        commit_log_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id, topic_mappings[self.TOP_1_ID])

    def test_multiple_topics_are_pseudonymized(self) -> None:
        self.save_new_topic(
            self.TOP_2_ID,
            self.user_1_id,
            name='topic2',
            url_fragment='topic-two')

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.TOPIC.value]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        commit_log_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, topic_mappings[self.TOP_1_ID])
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_2_ID])
        commit_log_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, topic_mappings[self.TOP_2_ID])


class WipeoutServiceVerifyDeleteTopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    TOP_1_ID: Final = 'top_1_id'
    TOP_2_ID: Final = 'top_2_id'
    SUBTOP_1_ID: Final = 'subtop_1_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        topic_models.TopicSnapshotMetadataModel(
            id='%s-1' % self.TOP_1_ID,
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteUserModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    COLLECTION_1_ID: Final = 'col_1_id'
    COLLECTION_2_ID: Final = 'col_2_id'
    EXPLORATION_1_ID: Final = 'exp_1_id'
    EXPLORATION_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[],
            story_ids=[], partially_learnt_topic_ids=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.user_2_id, topic_ids_to_learn=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': self.user_1_id,
        }
        new_user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': None,
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

        user_services.update_multiple_users_data(
            [self.modifiable_user_data])

        self.modifiable_new_user_data.display_alias = 'name'
        self.modifiable_new_user_data.pin = '123'
        self.profile_user_id = user_services.create_new_profiles(
            self.user_1_auth_id, self.USER_1_EMAIL,
            [self.modifiable_new_user_data]
        )[0].user_id

        user_models.CompletedActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[],
            story_ids=[], partially_learnt_topic_ids=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.profile_user_id, topic_ids_to_learn=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()

    def test_delete_user_for_profile_user_is_successful(self) -> None:
        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.profile_user_id))
        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                self.profile_user_id))

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))
        self.assertIsNotNone(
            user_models.LearnerGoalsModel.get_by_id(self.profile_user_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))
        self.assertIsNone(
            user_models.LearnerGoalsModel.get_by_id(self.profile_user_id))

    def test_delete_user_for_full_user_and_its_profiles_is_successful(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.user_1_id))
        # External auth associations should not have been deleted yet.
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted(
                self.user_1_id))

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNotNone(
            user_models.LearnerGoalsModel.get_by_id(self.profile_user_id))
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNone(
            user_models.LearnerGoalsModel.get_by_id(self.profile_user_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

    def test_delete_user_with_collection_and_exploration_is_successful(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

    def test_delete_user_with_collections_and_explorations_is_successful(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)
        self.save_new_valid_exploration(
            self.EXPLORATION_2_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_2_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_2_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_2_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_2_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_2_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_2_ID))

    def test_delete_user_with_collection_and_exploration_repeated_is_successful(
        self
    ) -> None:
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

    def test_delete_user_with_multiple_users_is_successful(self) -> None:
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.LearnerGoalsModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.LearnerGoalsModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

    def test_after_deletion_user_and_its_profiles_cannot_do_anything(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(user_services.get_user_settings(
            self.user_1_id, strict=False
        ))
        self.assertIsNone(user_services.get_user_settings(
            self.profile_user_id, strict=False
        ))
        with self.assertRaisesRegex(Exception, 'User not found.'):
            # Try to do some action with the deleted user.
            user_settings = user_services.get_user_settings(self.user_1_id)
            user_settings.preferred_language_codes = ['en']
            user_services.save_user_settings(user_settings)
        with self.assertRaisesRegex(Exception, 'User not found.'):
            # Try to do some action with the deleted user.
            user_settings = user_services.get_user_settings(
                self.profile_user_id)
            user_settings.preferred_language_codes = ['en']
            user_services.save_user_settings(user_settings)


class WipeoutServiceVerifyDeleteUserModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': self.user_1_id,
        }
        new_user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': None,
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

        user_services.update_multiple_users_data(
            [self.modifiable_user_data])

        self.modifiable_new_user_data.display_alias = 'name'
        self.modifiable_new_user_data.pin = '123'
        self.profile_user_id = user_services.create_new_profiles(
            self.user_1_auth_id, self.USER_1_EMAIL,
            [self.modifiable_new_user_data]
        )[0].user_id
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_profile_user_deleted_returns_true(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

    def test_verify_user_delete_when_user_is_deleted_returns_true(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id)
        )
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[],
            story_ids=[], partially_learnt_topic_ids=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.user_2_id, topic_ids_to_learn=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

    def test_verify_user_delete_when_profile_user_not_deleted_is_false(
        self
    ) -> None:
        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

        user_models.CompletedActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[],
            story_ids=[], partially_learnt_topic_ids=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.profile_user_id, topic_ids_to_learn=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertFalse(
            wipeout_service.verify_user_deleted(self.profile_user_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

    def test_verify_user_delete_when_external_auth_associations_are_not_deleted(
        self
    ) -> None:
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted(
                self.user_1_id))

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        delete_external_auth_associations_swap = self.swap_to_always_return(
            auth_services, 'delete_external_auth_associations')

        with delete_external_auth_associations_swap:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteBlogPostModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    BLOG_1_ID: Final = 'blog_1_id'
    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some-other@email.com'
    USER_2_USERNAME: Final = 'username2'
    NUMBER_OF_MODELS: Final = 150
    NONEXISTENT_USER_ID: Final = 'id_x'
    CONTENT: Final = 'Dummy Content'
    SUMMARY: Final = 'Dummy Content'
    TITLE: Final = 'Dummy Title'
    TAGS: Final = ['tag1', 'tag2', 'tag3']
    THUMBNAIL: Final = 'xyzabc'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.blog_post_model = blog_models.BlogPostModel(
            id=self.BLOG_1_ID,
            author_id=self.user_1_id,
            content=self.CONTENT,
            title=self.TITLE,
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url-fragment',
            tags=self.TAGS,
            thumbnail_filename=self.THUMBNAIL
        )
        self.blog_post_model.update_timestamps()
        self.blog_post_model.put()
        self.blog_post_summary_model = blog_models.BlogPostSummaryModel(
            id=self.BLOG_1_ID,
            author_id=self.user_1_id,
            summary=self.SUMMARY,
            title=self.TITLE,
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url-fragment',
            tags=self.TAGS,
            thumbnail_filename=self.THUMBNAIL
        )
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()

        self.blog_post_rights_model = blog_models.BlogPostRightsModel(
            id=self.BLOG_1_ID,
            editor_ids=[self.user_1_id],
            blog_post_is_published=True,
        )
        self.blog_post_rights_model.update_timestamps()
        self.blog_post_rights_model.put()

        blog_models.BlogAuthorDetailsModel.create(
            author_id=self.user_1_id,
            displayed_author_name='blog author',
            author_bio='general bio'
        )
        self.author_details_model = (
            blog_models.BlogAuthorDetailsModel.get_by_author(self.user_1_id))

        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_blog_post_model_is_pseudonymized(self) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is pseudonymized.
        pseudonymizable_user_id_mapping = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.BLOG.value]
        )
        blog_post_model = (
            blog_models.BlogPostModel.get_by_id(
                self.BLOG_1_ID)
        )
        self.assertEqual(
            blog_post_model.author_id,
            pseudonymizable_user_id_mapping[self.BLOG_1_ID]
        )
        blog_post_summary_model = (
            blog_models.BlogPostSummaryModel.get_by_id(
                self.BLOG_1_ID)
        )
        self.assertEqual(
            blog_post_summary_model.author_id,
            pseudonymizable_user_id_mapping[self.BLOG_1_ID]
        )

        # Ruling out the possibility of None for mypy type checking.
        assert self.author_details_model is not None
        blog_author_model = blog_models.BlogAuthorDetailsModel.get_by_id(
            self.author_details_model.id)
        # Ruling out the possibility of None for mypy type checking.
        assert blog_author_model is not None
        self.assertEqual(
            blog_author_model.author_id,
            pseudonymizable_user_id_mapping[blog_author_model.id]
        )

        # Verify that the user id is removed from the list of editor ids in
        # BlogPostRights model.
        blog_post_rights_model = (
            blog_models.BlogPostRightsModel.get_by_id(
                self.BLOG_1_ID))
        self.assertTrue(self.user_1_id not in blog_post_rights_model.editor_ids)

    def test_one_blog_when_the_deletion_is_repeated_is_pseudonymized(
        self
    ) -> None:
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return blog post model to the original user ID.
        blog_post_model = (
            blog_models.BlogPostModel.get_by_id(
                self.BLOG_1_ID)
        )
        blog_post_model.author_id = self.user_1_id
        blog_post_model.update_timestamps()
        blog_post_model.put()

        blog_post_rights_model = (
            blog_models.BlogPostRightsModel.get_by_id(
                self.BLOG_1_ID)
        )

        blog_post_rights_model.editor_ids.append(self.user_1_id)
        blog_post_rights_model.update_timestamps()
        blog_post_rights_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the blog post and the blog post summary have the same
        # pseudonymous user ID.
        pseudonymizable_user_id_mapping = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.BLOG.value]
        )
        new_blog_post_model = (
            blog_models.BlogPostModel.get_by_id(
                self.BLOG_1_ID)
        )
        self.assertEqual(
            new_blog_post_model.author_id,
            pseudonymizable_user_id_mapping[self.BLOG_1_ID]
        )

        # Ruling out the possibility of None for mypy type checking.
        assert self.author_details_model is not None
        blog_author_model = blog_models.BlogAuthorDetailsModel.get_by_id(
            self.author_details_model.id)

        # Ruling out the possibility of None for mypy type checking.
        assert blog_author_model is not None
        self.assertEqual(
            blog_author_model.author_id,
            pseudonymizable_user_id_mapping[blog_author_model.id]
        )

        # Verify that the user id is removed from the list of editor ids in
        # BlogPostRights model.
        blog_post_rights_model = (
            blog_models.BlogPostRightsModel.get_by_id(
                self.BLOG_1_ID))
        self.assertTrue(self.user_1_id not in blog_post_rights_model.editor_ids)

    def test_multiple_blog_post_models_are_pseudonymized(self) -> None:
        blog_post_models_list = []
        for i in range(self.NUMBER_OF_MODELS):
            blog_post_models_list.append(
                blog_models.BlogPostModel(
                    id='blogmodel-%s' % i,
                    author_id=self.user_1_id,
                    content=self.CONTENT,
                    title=self.TITLE,
                    published_on=datetime.datetime.utcnow(),
                    url_fragment='sample-url-fragment',
                    tags=self.TAGS,
                    thumbnail_filename=self.THUMBNAIL
                )
            )
            blog_models.BlogPostModel.update_timestamps_multi(
                blog_post_models_list)
        blog_post_summary_models_list = []
        for i in range(self.NUMBER_OF_MODELS):
            blog_post_summary_models_list.append(
                blog_models.BlogPostSummaryModel(
                    id='blogmodel-%s' % i,
                    author_id=self.user_1_id,
                    summary=self.SUMMARY,
                    title=self.TITLE,
                    published_on=datetime.datetime.utcnow(),
                    url_fragment='sample-url-fragment',
                    tags=self.TAGS,
                    thumbnail_filename=self.THUMBNAIL
                )
            )
            blog_models.BlogPostSummaryModel.update_timestamps_multi(
                blog_post_summary_models_list)

        blog_post_rights_models_list = []
        for i in range(self.NUMBER_OF_MODELS):
            blog_post_rights_models_list.append(
                blog_models.BlogPostRightsModel(
                    id='blogmodel-%s' % i,
                    editor_ids=[self.user_1_id],
                    blog_post_is_published=True,
                )
            )
            blog_models.BlogPostRightsModel.update_timestamps_multi(
                blog_post_rights_models_list)

        datastore_services.put_multi(blog_post_models_list)
        datastore_services.put_multi(blog_post_summary_models_list)
        datastore_services.put_multi(blog_post_rights_models_list)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pseudonymizable_user_id_mapping = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.Names.BLOG.value]
        )

        pseudonymized_blog_post_models = (
            blog_models.BlogPostModel.get_multi(
                [model.id for model in blog_post_models_list]
            )
        )
        for blog_post_model in pseudonymized_blog_post_models:
            # Ruling out the possibility of None for mypy type checking.
            assert blog_post_model is not None
            self.assertEqual(
                blog_post_model.author_id,
                pseudonymizable_user_id_mapping[blog_post_model.id]
            )

        pseudonymized_blog_post_summary_models = (
            blog_models.BlogPostSummaryModel.get_multi(
                [model.id for model in blog_post_summary_models_list]
            )
        )
        for blog_post_summary_model in pseudonymized_blog_post_summary_models:
            # Ruling out the possibility of None for mypy type checking.
            assert blog_post_summary_model is not None
            self.assertEqual(
                blog_post_summary_model.author_id,
                pseudonymizable_user_id_mapping[blog_post_summary_model.id]
            )
        # Ruling out the possibility of None for mypy type checking.
        assert self.author_details_model is not None
        blog_author_model = blog_models.BlogAuthorDetailsModel.get_by_id(
            self.author_details_model.id)
        # Ruling out the possibility of None for mypy type checking.
        assert blog_author_model is not None
        self.assertEqual(
            blog_author_model.author_id,
            pseudonymizable_user_id_mapping[blog_author_model.id]
        )

        # Verify that user id is removed from the list of editor ids in all
        # BlogPostRights models.
        blog_post_rights_models = (
            blog_models.BlogPostRightsModel.get_multi(
                [model.id for model in blog_post_rights_models_list]
            )
        )
        for blog_post_rights_model in blog_post_rights_models:
            # Ruling out the possibility of None for mypy type checking.
            assert blog_post_rights_model is not None
            self.assertTrue(
                self.user_1_id not in blog_post_rights_model.editor_ids)


class WipeoutServiceDeletelLearnerGroupModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'some1@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'some2@email.com'
    USER_2_USERNAME: Final = 'username2'
    USER_3_EMAIL: Final = 'some3@email.com'
    USER_3_USERNAME: Final = 'username3'
    USER_4_EMAIL: Final = 'some4@email.com'
    USER_4_USERNAME: Final = 'username4'
    LEARNER_GROUP_ID_1: Final = 'group_id_1'
    LEARNER_GROUP_ID_2: Final = 'group_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.signup(self.USER_3_EMAIL, self.USER_3_USERNAME)
        self.signup(self.USER_4_EMAIL, self.USER_4_USERNAME)

        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.user_3_id = self.get_user_id_from_email(self.USER_3_EMAIL)
        self.user_4_id = self.get_user_id_from_email(self.USER_4_EMAIL)

        learner_group_models.LearnerGroupModel(
            id=self.LEARNER_GROUP_ID_1,
            title='title_1',
            description='description_1',
            facilitator_user_ids=[self.user_1_id, self.user_4_id],
            learner_user_ids=[self.user_2_id],
            invited_learner_user_ids=[self.user_3_id],
            subtopic_page_ids=[],
            story_ids=[]
        ).put()

        learner_group_models.LearnerGroupModel(
            id=self.LEARNER_GROUP_ID_2,
            title='title_2',
            description='description_2',
            facilitator_user_ids=[self.user_1_id],
            learner_user_ids=[self.user_2_id],
            invited_learner_user_ids=[self.user_3_id],
            subtopic_page_ids=[],
            story_ids=[]
        ).put()

    def test_delete_learner_is_successful(self) -> None:
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        learner_group_model_1 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_1))
        learner_group_model_2 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_2))

        self.assertIsNotNone(learner_group_model_1)
        self.assertIsNotNone(learner_group_model_2)

        self.assertTrue(
            self.user_2_id in learner_group_model_1.learner_user_ids)
        self.assertTrue(
            self.user_2_id in learner_group_model_2.learner_user_ids)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Deleting a user should not delete the learner groups that the user
        # is a learner of but only remove their user id from learner_user_ids
        # field of the learner group models.
        learner_group_model_1 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_1))
        learner_group_model_2 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_2))

        self.assertIsNotNone(learner_group_model_1)
        self.assertIsNotNone(learner_group_model_2)

        self.assertTrue(
            self.user_2_id not in learner_group_model_1.learner_user_ids)
        self.assertTrue(
            self.user_2_id not in learner_group_model_2.learner_user_ids)

    def test_delete_invited_user_is_successful(self) -> None:
        wipeout_service.pre_delete_user(self.user_3_id)
        self.process_and_flush_pending_tasks()

        learner_group_model_1 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_1))
        learner_group_model_2 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_2))

        self.assertIsNotNone(learner_group_model_1)
        self.assertIsNotNone(learner_group_model_2)

        self.assertTrue(
            self.user_3_id in learner_group_model_1.invited_learner_user_ids)
        self.assertTrue(
            self.user_3_id in learner_group_model_2.invited_learner_user_ids)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_3_id))

        # Deleting a user should not delete the learner groups that the user
        # has been invited to join as learner but only remove their user id
        # from invited_learner_user_ids field of the learner group models.
        learner_group_model_1 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_1))
        learner_group_model_2 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_2))

        self.assertIsNotNone(learner_group_model_1)
        self.assertIsNotNone(learner_group_model_2)

        self.assertTrue(
            self.user_3_id not in (
                learner_group_model_1.invited_learner_user_ids))
        self.assertTrue(
            self.user_3_id not in (
                learner_group_model_2.invited_learner_user_ids))

    def test_delete_facilitator_is_successful(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        learner_group_model_1 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_1))
        learner_group_model_2 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_2))

        self.assertIsNotNone(learner_group_model_1)
        self.assertIsNotNone(learner_group_model_2)

        self.assertTrue(
            self.user_1_id in learner_group_model_1.facilitator_user_ids)
        self.assertTrue(
            self.user_1_id in learner_group_model_2.facilitator_user_ids)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        learner_group_model_1 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_1))
        learner_group_model_2 = (
            learner_group_models.LearnerGroupModel.get_by_id(
                self.LEARNER_GROUP_ID_2))

        # Deleting a user should not delete the learner groups with more
        # one facilitators including the current user but only remove their
        # user id from facilitator_user_ids field of the learner group models.
        self.assertIsNotNone(learner_group_model_1)
        self.assertTrue(
            self.user_1_id not in learner_group_model_1.facilitator_user_ids)

        # Deleting a user should delete the learner groups with only the
        # current user being facilitator.
        self.assertIsNone(learner_group_model_2)


class PendingUserDeletionTaskServiceTests(test_utils.GenericTestBase):
    """Provides testing for the delete users pending to be deleted taskqueue
    service methods of wipeout service."""

    USER_1_EMAIL: Final = 'a@example.com'
    USER_1_USERNAME: Final = 'a'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], partially_learnt_topic_ids=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.user_1_id, topic_ids_to_learn=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)

        self.email_subjects: List[str] = []
        self.email_bodies: List[str] = []
        def _mock_send_mail_to_admin(
            email_subject: str, email_body: str
        ) -> None:
            """Mocks email_manager.send_mail_to_admin() as it's not possible to
            send mail with self.testapp_swap, i.e with the URLs defined in
            main_cron.
            """
            self.email_subjects.append(email_subject)
            self.email_bodies.append(email_body)

        self.send_mail_to_admin_swap = self.swap(
            email_manager, 'send_mail_to_admin', _mock_send_mail_to_admin)
        self.can_send_email_swap = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_email_swap = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_repeated_deletion_is_successful_when_emails_enabled(
        self
    ) -> None:
        with self.send_mail_to_admin_swap, self.can_send_email_swap:
            wipeout_service.delete_users_pending_to_be_deleted()
            self.assertIn('SUCCESS', self.email_bodies[0])
            self.assertIn(self.user_1_id, self.email_bodies[0])
            wipeout_service.delete_users_pending_to_be_deleted()
            self.assertIn('ALREADY DONE', self.email_bodies[1])
            self.assertIn(self.user_1_id, self.email_bodies[1])

    def test_repeated_deletion_is_successful_when_emails_disabled(
        self
    ) -> None:
        send_mail_to_admin_swap = self.swap_with_checks(
            email_manager,
            'send_mail_to_admin',
            lambda x, y: None,
            # Func shouldn't be called when emails are disabled.
            called=False
        )
        with send_mail_to_admin_swap, self.cannot_send_email_swap:
            wipeout_service.delete_users_pending_to_be_deleted()
            self.assertEqual(len(self.email_bodies), 0)
            wipeout_service.delete_users_pending_to_be_deleted()
            self.assertEqual(len(self.email_bodies), 0)

    def test_no_email_is_sent_when_there_are_no_users_pending_deletion(
        self
    ) -> None:
        pending_deletion_request_models: Sequence[
            user_models.PendingDeletionRequestModel
        ] = (
            user_models.PendingDeletionRequestModel.query().fetch())
        for pending_deletion_request_model in pending_deletion_request_models:
            pending_deletion_request_model.delete()
        with self.send_mail_to_admin_swap, self.can_send_email_swap:
            # When there are no pending deletion models, expect no emails.
            wipeout_service.delete_users_pending_to_be_deleted()
            self.assertEqual(len(self.email_bodies), 0)

    def test_regular_deletion_is_successful(self) -> None:
        with self.send_mail_to_admin_swap, self.can_send_email_swap:
            wipeout_service.delete_users_pending_to_be_deleted()
        self.assertIn('SUCCESS', self.email_bodies[0])
        self.assertIn(self.user_1_id, self.email_bodies[0])

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.LearnerGoalsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertTrue(pending_deletion_model.deletion_complete)


class CheckCompletionOfUserDeletionTaskServiceTests(
        test_utils.GenericTestBase):
    """Provides testing for the check completion of user deletion taskqueue
    service methods of wipeout service.
    """

    USER_1_EMAIL: Final = 'a@example.com'
    USER_1_USERNAME: Final = 'a'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], partially_learnt_topic_ids=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.user_1_id, topic_ids_to_learn=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)

        self.email_subjects: List[str] = []
        self.email_bodies: List[str] = []
        def _mock_send_mail_to_admin(
            email_subject: str, email_body: str
        ) -> None:
            """Mocks email_manager.send_mail_to_admin() as it's not possible to
            send mail with self.testapp_swap, i.e with the URLs defined in
            main_cron.
            """
            self.email_subjects.append(email_subject)
            self.email_bodies.append(email_body)

        self.send_mail_to_admin_swap = self.swap(
            email_manager, 'send_mail_to_admin', _mock_send_mail_to_admin)
        self.can_send_email_swap = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_email_swap = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_verification_when_user_is_not_deleted_emails_enabled(
        self
    ) -> None:
        with self.send_mail_to_admin_swap, self.can_send_email_swap:
            wipeout_service.check_completion_of_user_deletion()
        self.assertIn('NOT DELETED', self.email_bodies[0])
        self.assertIn(self.user_1_id, self.email_bodies[0])

    def test_verification_when_user_is_not_deleted_emails_disabled(
        self
    ) -> None:
        send_mail_to_admin_swap = self.swap_with_checks(
            email_manager,
            'send_mail_to_admin',
            lambda x, y: None,
            # Func shouldn't be called when emails are disabled.
            called=False
        )
        with send_mail_to_admin_swap, self.cannot_send_email_swap:
            wipeout_service.check_completion_of_user_deletion()
        self.assertEqual(len(self.email_bodies), 0)

    def test_verification_when_user_is_deleted_is_successful(self) -> None:
        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(pending_deletion_request)
        pending_deletion_request.deletion_complete = True
        wipeout_service.save_pending_deletion_requests(
            [pending_deletion_request])

        with self.send_mail_to_admin_swap, self.can_send_email_swap:
            wipeout_service.check_completion_of_user_deletion()
        self.assertIn('SUCCESS', self.email_bodies[0])
        self.assertIn(self.user_1_id, self.email_bodies[0])

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))

    def test_verification_when_user_is_wrongly_deleted_fails(self) -> None:
        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(pending_deletion_request)
        pending_deletion_request.deletion_complete = True
        wipeout_service.save_pending_deletion_requests(
            [pending_deletion_request])

        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[],
            story_ids=[], learnt_topic_ids=[]
        ).put()

        with self.send_mail_to_admin_swap, self.can_send_email_swap:
            wipeout_service.check_completion_of_user_deletion()
        self.assertIn('FAILURE', self.email_bodies[-1])
        self.assertIn(self.user_1_id, self.email_bodies[-1])


class WipeoutServiceDeleteVersionHistoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL: Final = 'user1@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'user2@email.com'
    USER_2_USERNAME: Final = 'username2'
    EXPLORATION_ID_0: Final = 'An_exploration_0_id'
    EXPLORATION_ID_1: Final = 'An_exploration_1_id'
    EXPLORATION_ID_2: Final = 'An_exploration_2_id'
    VERSION_1: Final = 1
    VERSION_2: Final = 2
    VERSION_3: Final = 3

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.version_history_model_class = (
            exp_models.ExplorationVersionHistoryModel)
        self.save_new_valid_exploration(self.EXPLORATION_ID_0, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXPLORATION_ID_0)
        self.save_new_valid_exploration(self.EXPLORATION_ID_1, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXPLORATION_ID_1)
        self.save_new_valid_exploration(self.EXPLORATION_ID_2, self.user_2_id)
        self.publish_exploration(self.user_2_id, self.EXPLORATION_ID_2)

    def test_one_version_history_model_is_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        pseudonymizable_user_id_mapping = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id).pseudonymizable_entity_mappings[
                    models.Names.EXPLORATION.value])
        pseudonymized_id = pseudonymizable_user_id_mapping[
            self.EXPLORATION_ID_2]
        pseudonymized_model = exp_models.ExplorationVersionHistoryModel.get(
            self.version_history_model_class.get_instance_id(
                self.EXPLORATION_ID_2, self.VERSION_1))

        self.assertNotIn(
            self.user_2_id, pseudonymized_model.committer_ids)
        self.assertIn(
            pseudonymized_id, pseudonymized_model.committer_ids)

    def test_multiple_version_history_models_are_pseudonymized(self) -> None:
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pseudonymizable_user_id_mapping = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id).pseudonymizable_entity_mappings[
                  models.Names.EXPLORATION.value])
        version_history_ids = [
            self.version_history_model_class.get_instance_id(
                self.EXPLORATION_ID_0, self.VERSION_1),
            self.version_history_model_class.get_instance_id(
                self.EXPLORATION_ID_1, self.VERSION_1)
        ]
        pseudonymized_models = (
            exp_models.ExplorationVersionHistoryModel.get_multi(
                version_history_ids))

        for model in pseudonymized_models:
            # Ruling out the possibility of None for mypy type checking.
            assert model is not None
            pseudonymized_id = pseudonymizable_user_id_mapping[
                model.exploration_id]
            self.assertNotIn(
                self.user_1_id, model.committer_ids)
            self.assertIn(
                pseudonymized_id, model.committer_ids)


class WipeoutServiceVerifyProfilePictureIsDeletedTests(
    test_utils.GenericTestBase
):
    """Test that profile picture is removed when we delete the user."""

    USER_1_EMAIL: Final = 'some@email.com'
    USER_1_USERNAME: Final = 'username1'
    USER_2_EMAIL: Final = 'user2@email.com'
    USER_2_USERNAME: Final = 'username2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)

        self.filename_png = 'profile_picture.png'
        self.filename_webp = 'profile_picture.webp'
        self.png_binary = utils.convert_data_url_to_binary(
            user_services.DEFAULT_IDENTICON_DATA_URL, 'png')
        self.webp_binary = utils.convert_png_binary_to_webp_binary(
            self.png_binary)

        self.file_system_for_user_1 = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, self.USER_1_USERNAME)
        self.file_system_for_user_1.commit(self.filename_png, self.png_binary)
        self.file_system_for_user_1.commit(self.filename_webp, self.webp_binary)

        self.file_system_for_user_2 = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, self.USER_2_USERNAME)
        self.file_system_for_user_2.commit(self.filename_png, self.png_binary)
        self.file_system_for_user_2.commit(self.filename_webp, self.webp_binary)

    def test_profile_picture_is_removed(self) -> None:
        self.assertTrue(self.file_system_for_user_1.isfile(self.filename_png))
        self.assertTrue(self.file_system_for_user_1.isfile(self.filename_webp))
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))
        self.assertFalse(self.file_system_for_user_1.isfile(self.filename_png))
        self.assertFalse(self.file_system_for_user_1.isfile(self.filename_webp))

    def test_log_error_when_profile_pictures_are_missing_while_deletion(
        self
    ) -> None:
        with self.capture_logging(min_level=logging.ERROR) as logs:
            wipeout_service.pre_delete_user(self.user_2_id)
            self.process_and_flush_pending_tasks()
            self.file_system_for_user_2.delete(self.filename_png)
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_2_id))
            self.file_system_for_user_2.commit(
                self.filename_png, self.png_binary)
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_2_id))
            self.file_system_for_user_2.commit(
                self.filename_webp, self.webp_binary)

        self.assertEqual(
            logs,
            [
                '[WIPEOUT] Profile picture of username username2 in .png '
                'format does not exists.',
                '[WIPEOUT] Profile picture of username username2 in .webp '
                'format does not exists.'
            ]
        )

    def test_log_error_when_profile_pictures_are_missing_while_verification(
        self
    ) -> None:
        with self.capture_logging(min_level=logging.ERROR) as logs:
            wipeout_service.pre_delete_user(self.user_2_id)
            self.process_and_flush_pending_tasks()
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_2_id))
            self.file_system_for_user_2.commit(
                self.filename_png, self.png_binary)
            self.assertFalse(wipeout_service.verify_user_deleted(
                self.user_2_id))
            self.file_system_for_user_2.delete(self.filename_png)
            self.file_system_for_user_2.commit(
                self.filename_webp, self.webp_binary)
            self.assertFalse(wipeout_service.verify_user_deleted(
                self.user_2_id))

        self.assertEqual(
            logs,
            [
                '[WIPEOUT] Profile picture in .png format is not deleted '
                'for user having username username2.',
                '[WIPEOUT] Profile picture in .webp format is not deleted '
                'for user having username username2.'
            ]
        )
