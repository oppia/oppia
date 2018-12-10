# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.feedback.gae_models."""

from core.platform import models
from core.tests import test_utils
import feconf

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])

CREATED_ON_FIELD = 'created_on'
LAST_UPDATED_FIELD = 'last_updated'
DELETED_FIELD = 'deleted'
FIELDS_NOT_REQUIRED = [CREATED_ON_FIELD, LAST_UPDATED_FIELD, DELETED_FIELD]


class FeedbackThreadModelTest(test_utils.GenericTestBase):
    """Tests for the GeneralFeedbackThreadModel class."""

    def test_put_function(self):
        feedback_thread_model = feedback_models.GeneralFeedbackThreadModel(
            entity_type=feconf.ENTITY_TYPE_EXPLORATION, entity_id='exp_id_1',
            subject='dummy subject')
        feedback_thread_model.put()

        last_updated = feedback_thread_model.last_updated

        # If we do not wish to update the last_updated time, we should set
        # the update_last_updated_time argument to False in the put function.
        feedback_thread_model.put(update_last_updated_time=False)
        self.assertEqual(feedback_thread_model.last_updated, last_updated)

        # If we do wish to change it however, we can simply use the put function
        # as the default value of update_last_updated_time is True.
        feedback_thread_model.put()
        self.assertNotEqual(feedback_thread_model.last_updated, last_updated)


class FeedbackThreadUserModelTest(test_utils.GenericTestBase):
    """Tests for the FeedbackThreadUserModel class."""

    def test_create_new_object(self):
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id')
        feedback_thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get(
                'user_id', 'exploration.exp_id.thread_id'))

        self.assertEqual(
            feedback_thread_user_model.id,
            'user_id.exploration.exp_id.thread_id')
        self.assertEqual(
            feedback_thread_user_model.message_ids_read_by_user, [])

    def test_get_object(self):
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id')
        expected_model = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id',
            message_ids_read_by_user=[])

        actual_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get(
                'user_id', 'exploration.exp_id.thread_id'))

        self.assertEqual(actual_model.id, expected_model.id)
        self.assertEqual(
            actual_model.message_ids_read_by_user,
            expected_model.message_ids_read_by_user)

    def test_get_multi(self):
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id_1')
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id_2')

        expected_model_1 = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id_1',
            message_ids_read_by_user=[])
        expected_model_2 = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id_2',
            message_ids_read_by_user=[])

        actual_models = (
            feedback_models.GeneralFeedbackThreadUserModel.get_multi(
                'user_id',
                ['exploration.exp_id.thread_id_1',
                 'exploration.exp_id.thread_id_2']))

        actual_model_1 = actual_models[0]
        actual_model_2 = actual_models[1]

        self.assertEqual(actual_model_1.id, expected_model_1.id)
        self.assertEqual(
            actual_model_1.message_ids_read_by_user,
            expected_model_1.message_ids_read_by_user)

        self.assertEqual(actual_model_2.id, expected_model_2.id)
        self.assertEqual(
            actual_model_2.message_ids_read_by_user,
            expected_model_2.message_ids_read_by_user)


class UnsentFeedbackEmailModelTest(test_utils.GenericTestBase):
    """Tests for FeedbackMessageEmailDataModel class."""

    def test_new_instances_stores_correct_data(self):
        user_id = 'A'
        message_reference_dict = {
            'exploration_id': 'ABC123',
            'thread_id': 'thread_id1',
            'message_id': 'message_id1'
        }
        email_instance = feedback_models.UnsentFeedbackEmailModel(
            id=user_id, feedback_message_references=[message_reference_dict])
        email_instance.put()

        retrieved_instance = (
            feedback_models.UnsentFeedbackEmailModel.get_by_id(id=user_id))

        self.assertEqual(
            retrieved_instance.feedback_message_references,
            [message_reference_dict])
        self.assertEqual(retrieved_instance.retries, 0)
