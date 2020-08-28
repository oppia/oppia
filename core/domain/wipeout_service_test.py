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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from constants import constants
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import user_services
from core.domain import wipeout_domain
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

from google.appengine.ext import ndb

(
    base_models, collection_models, exp_models,
    feedback_models, improvements_models, question_models,
    skill_models, story_models, suggestion_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.exploration,
    models.NAMES.feedback, models.NAMES.improvements, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story, models.NAMES.suggestion,
    models.NAMES.user
])


class WipeoutServiceHelpersTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceHelpersTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)

    def test_gets_pending_deletion_request(self):
        wipeout_service.save_pending_deletion_request(
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, ['exp1', 'exp2'], ['col1']
            )
        )

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertEqual(pending_deletion_request.user_id, self.user_1_id)
        self.assertEqual(pending_deletion_request.email, self.USER_1_EMAIL)
        self.assertEqual(pending_deletion_request.deletion_complete, False)
        self.assertEqual(
            pending_deletion_request.exploration_ids, ['exp1', 'exp2'])
        self.assertEqual(pending_deletion_request.collection_ids, ['col1'])
        self.assertEqual(pending_deletion_request.activity_mappings, {})

    def test_saves_pending_deletion_request_when_new(self):
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, [], []))
        wipeout_service.save_pending_deletion_request(pending_deletion_request)

        pending_deletion_request_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model.deletion_complete, False)
        self.assertEqual(pending_deletion_request_model.exploration_ids, [])
        self.assertEqual(pending_deletion_request_model.collection_ids, [])
        self.assertEqual(pending_deletion_request_model.activity_mappings, {})

    def test_saves_pending_deletion_request_when_already_existing(self):
        pending_deletion_request_model_old = (
            user_models.PendingDeletionRequestModel(
                id=self.user_1_id,
                email=self.USER_1_EMAIL,
                deletion_complete=False,
                exploration_ids=['exp1', 'exp2'],
                collection_ids=['col1'],
                activity_mappings={}
            )
        )
        pending_deletion_request_model_old.put()

        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, ['exp1', 'exp2'], ['col1']))
        pending_deletion_request.deletion_complete = True
        pending_deletion_request.activity_mappings = {
            'story': {'story_id': 'user_id'}
        }
        wipeout_service.save_pending_deletion_request(pending_deletion_request)

        pending_deletion_request_model_new = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model_new.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model_new.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model_new.deletion_complete, True)
        self.assertEqual(
            pending_deletion_request_model_new.exploration_ids,
            ['exp1', 'exp2'])
        self.assertEqual(
            pending_deletion_request_model_new.collection_ids, ['col1'])
        self.assertEqual(
            pending_deletion_request_model_new.activity_mappings,
            {'story': {'story_id': 'user_id'}})
        self.assertEqual(
            pending_deletion_request_model_old.created_on,
            pending_deletion_request_model_new.created_on)

    def test_deletes_pending_deletion_request(self):
        wipeout_service.save_pending_deletion_request(
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, ['exp1', 'exp2'], ['col1']
            )
        )

        wipeout_service.delete_pending_deletion_request(self.user_1_id)

        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))


class WipeoutServicePreDeleteTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServicePreDeleteTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.user_1_gae_id = self.get_gae_id_from_email(self.USER_1_EMAIL)

    def test_pre_delete_user_email_subscriptions(self):
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

        wipeout_service.pre_delete_user(self.user_1_id)

        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertFalse(email_preferences.can_receive_email_updates)
        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

    def test_pre_delete_user_without_activities(self):
        user_models.UserSubscriptionsModel(
            id=self.user_1_id,
            activity_ids=[],
            collection_ids=[]
        ).put()

        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertFalse(user_settings.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)

        user_settings = user_services.get_user_settings_by_gae_id(
            self.user_1_gae_id)
        self.assertTrue(user_settings.deleted)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])

    def test_pre_delete_user_with_activities(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(
            pending_deletion_model.exploration_ids, ['exp_id'])
        self.assertEqual(pending_deletion_model.collection_ids, ['col_id'])

    def test_pre_delete_user_with_activities_multiple_owners(self):
        user_services.update_user_role(
            self.user_1_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        user_1_actions = user_services.UserActionsInfo(self.user_1_id)
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        rights_manager.assign_role_for_exploration(
            user_1_actions, 'exp_id', self.user_2_id, rights_manager.ROLE_OWNER)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')
        rights_manager.assign_role_for_collection(
            user_1_actions, 'col_id', self.user_2_id, rights_manager.ROLE_OWNER)

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(
            pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])

    def test_pre_delete_user_collection_is_marked_deleted(self):
        self.save_new_valid_collection(
            'col_id', self.user_1_id)

        collection_model = collection_models.CollectionModel.get_by_id('col_id')
        self.assertFalse(collection_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)

        collection_model = collection_models.CollectionModel.get_by_id('col_id')
        self.assertTrue(collection_model.deleted)

    def test_pre_delete_user_exploration_is_marked_deleted(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)

        exp_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertFalse(exp_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)

        exp_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertTrue(exp_model.deleted)


class WipeoutServiceDeleteFeedbackModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    FEEDBACK_1_ID = 'feedback_1_id'
    FEEDBACK_2_ID = 'feedback_2_id'
    MESSAGE_1_ID = 'message_1_id'
    MESSAGE_2_ID = 'message_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    NUMBER_OF_MODELS = 150

    def setUp(self):
        super(WipeoutServiceDeleteFeedbackModelsTests, self).setUp()
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
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
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

    def test_one_feedback_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is pseudonymized.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id)
        )
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            feedback_thread_model.original_author_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.feedback][self.FEEDBACK_1_ID]
        )
        suggestion_model_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            suggestion_model_model.author_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.feedback][self.FEEDBACK_1_ID]
        )

    def test_one_feedback_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return feedback thread model to the original user ID.
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        feedback_thread_model.original_author_id = self.user_1_id
        feedback_thread_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the feedback thread and the suggestion have the same
        # pseudonymous user ID.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        new_feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            new_feedback_thread_model.original_author_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.feedback][self.FEEDBACK_1_ID]
        )

    def test_multiple_feedbacks_are_pseudonymized(self):
        feedback_thread_models = []
        for i in python_utils.RANGE(self.NUMBER_OF_MODELS):
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
        feedback_message_models = []
        for i in python_utils.RANGE(self.NUMBER_OF_MODELS):
            feedback_message_models.append(
                feedback_models.GeneralFeedbackMessageModel(
                    id='message-%s' % i,
                    thread_id='feedback-%s' % i,
                    message_id=i,
                    author_id=self.user_1_id,
                    text='Some text'
                )
            )
        ndb.put_multi(feedback_thread_models + feedback_message_models)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        feedback_mappings = (
            pending_deletion_model.activity_mappings[models.NAMES.feedback])

        pseudonymized_feedback_thread_models = (
            feedback_models.GeneralFeedbackThreadModel.get_multi(
                [model.id for model in feedback_thread_models]
            )
        )
        for feedback_thread_model in pseudonymized_feedback_thread_models:
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
            self.assertEqual(
                feedback_message_model.author_id,
                feedback_mappings[feedback_message_model.thread_id]
            )

    def test_one_feedback_with_multiple_users_is_pseudonymized(self):

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        pending_deletion_model_user_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        # Verify first user is pseudonymized.
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            feedback_thread_model.original_author_id,
            pending_deletion_model_user_1
            .activity_mappings[models.NAMES.feedback][self.FEEDBACK_1_ID]
        )

        # Verify second user is not yet pseudonymized.
        self.assertEqual(
            feedback_thread_model.last_nonempty_message_author_id,
            self.user_2_id
        )

        # Delete second user.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        pending_deletion_model_user_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))

        # Verify second user is pseudonymized.
        self.assertEqual(
            feedback_thread_model.last_nonempty_message_author_id,
            pending_deletion_model_user_2
            .activity_mappings[models.NAMES.feedback][self.FEEDBACK_1_ID]
        )


class WipeoutServiceVerifyDeleteFeedbackModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    FEEDBACK_1_ID = 'feedback_1_id'
    MESSAGE_1_ID = 'message_1_id'
    EXP_1_ID = 'exp_1_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteFeedbackModelsTests, self).setUp()
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
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=self.user_1_id,
            final_reviewer_id=self.user_1_id,
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

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

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))


class WipeoutServiceDeleteImprovementsModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteImprovementsModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.improvements_model_1_id = (
            improvements_models.TaskEntryModel.create(
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
            improvements_models.TaskEntryModel.create(
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

    def test_delete_user_is_successful(self):
        wipeout_service.pre_delete_user(self.user_1_id)

        self.assertIsNotNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_1_id))
        self.assertIsNotNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_1_id))
        self.assertIsNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_2_id))


class WipeoutServiceVerifyDeleteImprovementsModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    EXP_3_ID = 'exp_3_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteImprovementsModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        improvements_models.TaskEntryModel.create(
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
        improvements_models.TaskEntryModel.create(
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

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

        improvements_models.TaskEntryModel.create(
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_3_ID,
            entity_version=1,
            task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id='State',
            issue_description=None,
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.user_1_id
        )

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))


class WipeoutServiceDeleteQuestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    SKILL_1_ID = 'skill_1_id'
    QUESTION_1_ID = 'question_1_id'
    QUESTION_2_ID = 'question_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteQuestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_question(
            self.QUESTION_1_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_one_question_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])

    def test_one_question_with_missing_snapshot_is_pseudonymized(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.warning()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        question_models.QuestionCommitLogEntryModel(
            id='question-%s-1' % self.QUESTION_2_ID,
            question_id=self.QUESTION_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with logging_swap:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            observed_log_messages,
            ['The commit log and snapshot question IDs differ. '
             'Snapshots without commit logs: [], '
             'Commit logs without snapshots: [u\'%s\'].' % self.QUESTION_2_ID])

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model_1 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model_2 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_2_ID])

    def test_one_question_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])

    def test_multiple_questions_are_pseudonymized(self):
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_2_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_2_ID])

    def test_multiple_questions_with_multiple_users_are_pseudonymized(self):
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_2_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])

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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_2_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_2_ID])

    def test_one_question_with_multiple_users_is_pseudonymized(self):
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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])

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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.question][self.QUESTION_1_ID])


class WipeoutServiceVerifyDeleteQuestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    SKILL_1_ID = 'SKILL_1_ID'
    QUESTION_1_ID = 'QUESTION_1_ID'
    QUESTION_2_ID = 'QUESTION_2_ID'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteQuestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_question(
            self.QUESTION_1_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_2_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

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

    SKILL_1_ID = 'skill_1_id'
    SKILL_2_ID = 'skill_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteSkillModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_one_skill_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])

    def test_one_skill_with_missing_snapshot_is_pseudonymized(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.warning()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        skill_models.SkillCommitLogEntryModel(
            id='skill-%s-1' % self.SKILL_2_ID,
            skill_id=self.SKILL_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with logging_swap:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            observed_log_messages,
            ['The commit log and snapshot skill IDs differ. '
             'Snapshots without commit logs: [], '
             'Commit logs without snapshots: [u\'%s\'].' % self.SKILL_2_ID])

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model_1 = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model_1.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model_2 = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model_2.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_2_ID])

    def test_one_skill_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])

    def test_multiple_skills_are_pseudonymized(self):
        self.save_new_skill(self.SKILL_2_ID, self.user_1_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_2_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_2_ID])

    def test_multiple_skills_with_multiple_users_are_pseudonymized(self):
        self.save_new_skill(self.SKILL_2_ID, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])

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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_2_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_2_ID])

    def test_one_skill_with_multiple_users_is_pseudonymized(self):
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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])

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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-2' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-2' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.skill][self.SKILL_1_ID])


class WipeoutServiceVerifyDeleteSkillModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    SKILL_1_ID = 'skill_1_id'
    SKILL_2_ID = 'skill_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteSkillModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_skill(self.SKILL_2_ID, self.user_2_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

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

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))


class WipeoutServiceDeleteStoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    TOPIC_1_ID = 'topic_1_id'
    STORY_1_ID = 'story_1_id'
    STORY_2_ID = 'story_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteStoryModelsTests, self).setUp()
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

    def test_one_story_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])

    def test_one_story_with_missing_snapshot_is_pseudonymized(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.warning()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        story_models.StoryCommitLogEntryModel(
            id='story-%s-1' % self.STORY_2_ID,
            story_id=self.STORY_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with logging_swap:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            observed_log_messages,
            ['The commit log and snapshot story IDs differ. '
             'Snapshots without commit logs: [], '
             'Commit logs without snapshots: [u\'%s\'].' % self.STORY_2_ID])

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model_1 = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model_1.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model_2 = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model_2.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_2_ID])

    def test_one_story_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])

    def test_multiple_stories_are_pseudonymized(self):
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_1_id, name='Topic 2',
            abbreviated_name='abbrev-two', url_fragment='frag-two')
        self.save_new_story(self.STORY_2_ID, self.user_1_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_2_ID])

    def test_multiple_stories_with_multiple_users_are_pseudonymized(self):
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_2_id, name='Topic 2',
            abbreviated_name='abbrev-three', url_fragment='frag-three')
        self.save_new_story(self.STORY_2_ID, self.user_2_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])

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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_2_ID])

    def test_one_story_with_multiple_users_is_pseudonymized(self):
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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])

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
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-2' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-2' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model
            .activity_mappings[models.NAMES.story][self.STORY_1_ID])


class WipeoutServiceVerifyDeleteStoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    TOPIC_1_ID = 'topic_1_id'
    TOPIC_2_ID = 'topic_2_id'
    STORY_1_ID = 'story_1_id'
    STORY_2_ID = 'story_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteStoryModelsTests, self).setUp()
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

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

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

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))


class WipeoutServiceDeleteSuggestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    VOICEOVER_1_ID = 'voiceover_1_id'
    VOICEOVER_2_ID = 'voiceover_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteSuggestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_1_ID,
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
        ).put()
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_2_ID,
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=self.EXP_2_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_2_id,
            final_reviewer_id=self.user_1_id,
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)

    def test_voiceover_application_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id)
        )
        suggestion_mappings = (
            pending_deletion_model.activity_mappings[models.NAMES.suggestion])

        # Verify user is pseudonymized.
        voiceover_application_model_1 = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                self.VOICEOVER_1_ID)
        )
        self.assertEqual(
            voiceover_application_model_1.author_id,
            suggestion_mappings[self.VOICEOVER_1_ID]
        )
        voiceover_application_model_2 = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                self.VOICEOVER_2_ID)
        )
        self.assertEqual(
            voiceover_application_model_2.final_reviewer_id,
            suggestion_mappings[self.VOICEOVER_2_ID]
        )


class WipeoutServiceVerifyDeleteSuggestionModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    VOICEOVER_1_ID = 'voiceover_1_id'
    VOICEOVER_2_ID = 'voiceover_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteSuggestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_1_ID,
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
        ).put()
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_2_ID,
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=self.EXP_2_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_2_id,
            final_reviewer_id=self.user_1_id,
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_1_ID,
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))


class WipeoutServiceDeleteUserModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    COLLECTION_1_ID = 'col_1_id'
    COLLECTION_2_ID = 'col_2_id'
    EXPLORATION_1_ID = 'exp_1_id'
    EXPLORATION_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteUserModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()

    def test_delete_user_is_successful(self):
        wipeout_service.pre_delete_user(self.user_1_id)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

    def test_delete_user_with_collection_and_exploration_is_successful(self):
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        wipeout_service.pre_delete_user(self.user_1_id)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

    def test_delete_user_with_collections_and_explorations_is_successful(self):
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

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_2_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_2_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
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

    def test_delete_user_with_multiple_users_is_successful(self):
        wipeout_service.pre_delete_user(self.user_2_id)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

    def test_after_deletion_user_cannot_do_anything(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(user_services.get_user_settings(self.user_1_id))
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            # Try to do some action with the deleted user.
            user_services.update_preferred_language_codes(
                self.user_1_id, ['en'])


class WipeoutServiceVerifyDeleteUserModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteUserModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))
