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

"""Tests for core.storage.email.gae_models."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from core.platform import models
from core.tests import test_utils
import feconf
import utils

(base_models, email_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.email])


class SentEmailModelUnitTests(test_utils.GenericTestBase):
    """Test the SentEmailModel class."""

    def setUp(self):
        super(SentEmailModelUnitTests, self).setUp()

        def mock_generate_hash(
                unused_cls, unused_recipient_id, unused_email_subject,
                unused_email_body):
            return 'Email Hash'

        self.generate_constant_hash_ctx = self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(mock_generate_hash, email_models.SentEmailModel))

    def test_get_deletion_policy(self):
        self.assertEqual(
            email_models.SentEmailModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_has_reference_to_user_id(self):
        with self.generate_constant_hash_ctx:
            email_models.SentEmailModel.create(
                'recipient_id', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            self.assertTrue(
                email_models.SentEmailModel.has_reference_to_user_id(
                    'recipient_id'))
            self.assertTrue(
                email_models.SentEmailModel.has_reference_to_user_id(
                    'sender_id'))
            self.assertFalse(
                email_models.SentEmailModel.has_reference_to_user_id('id_x'))

    def test_saved_model_can_be_retrieved_with_same_hash(self):
        with self.generate_constant_hash_ctx:
            email_models.SentEmailModel.create(
                'recipient_id', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            query = email_models.SentEmailModel.query()
            query = query.filter(
                email_models.SentEmailModel.email_hash == 'Email Hash')

            results = query.fetch(2)

            self.assertEqual(len(results), 1)

            query = email_models.SentEmailModel.query()
            query = query.filter(
                email_models.SentEmailModel.email_hash == 'Bad Email Hash')

            results = query.fetch(2)

            self.assertEqual(len(results), 0)

    def test_get_by_hash_works_correctly(self):
        with self.generate_constant_hash_ctx:
            email_models.SentEmailModel.create(
                'recipient_id', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            results = email_models.SentEmailModel.get_by_hash('Email Hash')

            self.assertEqual(len(results), 1)

            results = email_models.SentEmailModel.get_by_hash('Bad Email Hash')

            self.assertEqual(len(results), 0)

    def test_get_by_hash_returns_multiple_models_with_same_hash(self):
        with self.generate_constant_hash_ctx:
            email_models.SentEmailModel.create(
                'recipient_id', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            email_models.SentEmailModel.create(
                'recipient_id', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            results = email_models.SentEmailModel.get_by_hash('Email Hash')

            self.assertEqual(len(results), 2)

    def test_get_by_hash_behavior_with_sent_datetime_lower_bound(self):
        with self.generate_constant_hash_ctx:
            time_now = datetime.datetime.utcnow()

            email_models.SentEmailModel.create(
                'recipient_id', 'recipient@email.com', 'sender_id',
                'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

            results = email_models.SentEmailModel.get_by_hash(
                'Email Hash', sent_datetime_lower_bound=time_now)
            self.assertEqual(len(results), 1)

            time_now1 = datetime.datetime.utcnow()

            results = email_models.SentEmailModel.get_by_hash(
                'Email Hash', sent_datetime_lower_bound=time_now1)
            self.assertEqual(len(results), 0)

            time_before = (datetime.datetime.utcnow() -
                           datetime.timedelta(minutes=10))

            results = email_models.SentEmailModel.get_by_hash(
                'Email Hash', sent_datetime_lower_bound=time_before)
            self.assertEqual(len(results), 1)

            # Check that it accepts only DateTime objects.
            with self.assertRaises(Exception):
                results = email_models.SentEmailModel.get_by_hash(
                    'Email Hash',
                    sent_datetime_lower_bound='Not a datetime object')

    def test_raise_exception_by_mocking_collision(self):
        # Test Exception for SentEmailModel.
        with self.assertRaisesRegexp(
            Exception, 'The id generator for SentEmailModel is '
            'producing too many collisions.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                email_models.SentEmailModel, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    email_models.SentEmailModel)):
                email_models.SentEmailModel.create(
                    'recipient_id', 'recipient@email.com', 'sender_id',
                    'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
                    'Email Subject', 'Email Body', datetime.datetime.utcnow())

        # Test Exception for GeneralFeedbackEmailReplyToIdModel.
        with self.assertRaisesRegexp(
            Exception, 'Unique id generator is producing too many collisions.'
            ):
            # Swap dependent method get_by_reply_to_id to simulate collision
            # every time.
            with self.swap(
                email_models.GeneralFeedbackEmailReplyToIdModel,
                'get_by_reply_to_id',
                types.MethodType(
                    lambda x, y: True,
                    email_models.GeneralFeedbackEmailReplyToIdModel)):
                email_models.GeneralFeedbackEmailReplyToIdModel.create(
                    'user', 'exploration.exp0.0')


class BulkEmailModelUnitTests(test_utils.GenericTestBase):
    """Test the BulkEmailModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            email_models.BulkEmailModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_has_reference_to_user_id(self):
        email_models.BulkEmailModel.create(
            'instance_id', ['recipient_1_id', 'recipient_2_id'], 'sender_id',
            'sender@email.com', feconf.BULK_EMAIL_INTENT_MARKETING,
            'Email Subject', 'Email Body', datetime.datetime.utcnow())

        self.assertTrue(
            email_models.BulkEmailModel.has_reference_to_user_id(
                'sender_id'))
        self.assertFalse(
            email_models.BulkEmailModel.has_reference_to_user_id('id_x'))


class GeneralFeedbackEmailReplyToIdModelTest(test_utils.GenericTestBase):
    """Tests for the GeneralFeedbackEmailReplyToIdModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            email_models.GeneralFeedbackEmailReplyToIdModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self):
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='user_id_1.exploration.exp_id.thread_id',
            user_id='user_id_1',
            thread_id='exploration.exp_id.thread_id',
            reply_to_id='reply_id'
        ).put()
        self.assertTrue(
            email_models.GeneralFeedbackEmailReplyToIdModel
            .has_reference_to_user_id('user_id_1'))
        self.assertFalse(
            email_models.GeneralFeedbackEmailReplyToIdModel
            .has_reference_to_user_id('id_x'))

    def test_put_function(self):
        email_reply_model = email_models.GeneralFeedbackEmailReplyToIdModel(
            id='user_id_1.exploration.exp_id.thread_id',
            user_id='user_id_1',
            thread_id='exploration.exp_id.thread_id',
            reply_to_id='reply_id'
        )

        email_reply_model.put()

        last_updated = email_reply_model.last_updated

        # If we do not wish to update the last_updated time, we should set
        # the update_last_updated_time argument to False in the put function.
        email_reply_model.put(update_last_updated_time=False)
        self.assertEqual(email_reply_model.last_updated, last_updated)

        # If we do wish to change it however, we can simply use the put function
        # as the default value of update_last_updated_time is True.
        email_reply_model.put()
        self.assertNotEqual(email_reply_model.last_updated, last_updated)

    def test_create_new_object(self):
        actual_model = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user_id', 'exploration.exp_id.thread_id')

        self.assertEqual(
            actual_model.id,
            'user_id.exploration.exp_id.thread_id')
        self.assertEqual(actual_model.user_id, 'user_id')
        self.assertEqual(
            actual_model.thread_id,
            'exploration.exp_id.thread_id')

    def test_get_object(self):
        actual_model = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user_id', 'exploration.exp_id.thread_id')
        actual_model.put()
        expected_model = email_models.GeneralFeedbackEmailReplyToIdModel(
            id='user_id.exploration.exp_id.thread_id',
            user_id='user_id',
            thread_id='exploration.exp_id.thread_id')

        actual_model = (
            email_models.GeneralFeedbackEmailReplyToIdModel.get(
                'user_id', 'exploration.exp_id.thread_id'))

        self.assertEqual(actual_model.id, expected_model.id)
        self.assertEqual(actual_model.user_id, expected_model.user_id)
        self.assertEqual(actual_model.thread_id, expected_model.thread_id)

    def test_get_multi_by_user_ids(self):
        actual_model1 = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user_id_1', 'exploration.exp_id.thread_id')
        actual_model1.put()
        actual_model2 = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user_id_2', 'exploration.exp_id.thread_id')
        actual_model2.put()

        expected_model_1 = email_models.GeneralFeedbackEmailReplyToIdModel(
            id='user_id_1.exploration.exp_id.thread_id',
            user_id='user_id_1',
            thread_id='exploration.exp_id.thread_id')
        expected_model_2 = email_models.GeneralFeedbackEmailReplyToIdModel(
            id='user_id_2.exploration.exp_id.thread_id',
            user_id='user_id_2',
            thread_id='exploration.exp_id.thread_id')

        actual_models = (
            email_models.GeneralFeedbackEmailReplyToIdModel
            .get_multi_by_user_ids(
                ['user_id_1', 'user_id_2'],
                'exploration.exp_id.thread_id'))

        actual_model_1 = actual_models['user_id_1']
        actual_model_2 = actual_models['user_id_2']

        self.assertEqual(actual_model_1.id, expected_model_1.id)
        self.assertEqual(actual_model_1.user_id, expected_model_1.user_id)
        self.assertEqual(actual_model_1.thread_id, expected_model_1.thread_id)

        self.assertEqual(actual_model_2.id, expected_model_2.id)
        self.assertEqual(actual_model_2.user_id, expected_model_2.user_id)
        self.assertEqual(actual_model_2.thread_id, expected_model_2.thread_id)

    def test_raise_exception_with_existing_reply_to_id(self):
        # Test Exception for GeneralFeedbackEmailReplyToIdModel.
        model = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user1', 'exploration.exp1.1')
        model.put()

        with self.assertRaisesRegexp(
            Exception, 'Unique reply-to ID for given user and thread '
            'already exists.'):
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                'user1', 'exploration.exp1.1')


class GenerateHashTests(test_utils.GenericTestBase):
    """Test that generating hash functionality works as expected."""

    def test_same_inputs_always_gives_same_hashes(self):
        email_model_instance = email_models.SentEmailModel(
            id='exp_id.new_id',
            recipient_id='recipient_id',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='email_subject',
            html_body='email_html_body',
            sent_datetime=datetime.datetime.utcnow())
        email_model_instance.put()

        email_hash1 = email_model_instance.email_hash
        email_hash2 = email_model_instance.email_hash
        self.assertEqual(email_hash1, email_hash2)

    def test_different_inputs_give_different_hashes(self):
        email_model_instance = email_models.SentEmailModel(
            id='exp_id.new_id',
            recipient_id='recipient_id',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='email_subject',
            html_body='email_html_body',
            sent_datetime=datetime.datetime.utcnow())
        email_model_instance.put()

        email_model_instance2 = email_models.SentEmailModel(
            id='exp_id.new_id2',
            recipient_id='recipient_id',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='email_subject',
            html_body='email_html_body2',
            sent_datetime=datetime.datetime.utcnow())
        email_model_instance2.put()

        email_hash1 = email_model_instance.email_hash
        email_hash2 = email_model_instance2.email_hash
        self.assertNotEqual(email_hash1, email_hash2)

        email_model_instance2 = email_models.SentEmailModel(
            id='exp_id.new_id2',
            recipient_id='recipient_id2',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='email_subject',
            html_body='email_html_body',
            sent_datetime=datetime.datetime.utcnow())
        email_model_instance2.put()

        email_hash2 = email_model_instance2.email_hash
        self.assertNotEqual(email_hash1, email_hash2)

        email_model_instance2 = email_models.SentEmailModel(
            id='exp_id.new_id2',
            recipient_id='recipient_id',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='email_subject2',
            html_body='email_html_body',
            sent_datetime=datetime.datetime.utcnow())
        email_model_instance2.put()

        email_hash2 = email_model_instance2.email_hash
        self.assertNotEqual(email_hash1, email_hash2)

        email_model_instance2 = email_models.SentEmailModel(
            id='exp_id.new_id2',
            recipient_id='recipient_id2',
            recipient_email='recipient@email.com',
            sender_id='sender_id',
            sender_email='sender@email.com',
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='email_subject2',
            html_body='email_html_body2',
            sent_datetime=datetime.datetime.utcnow())
        email_model_instance2.put()

        email_hash2 = email_model_instance2.email_hash
        self.assertNotEqual(email_hash1, email_hash2)


class GeneralFeedbackEmailReplyToIdTests(test_utils.GenericTestBase):
    """Tests for the GeneralFeedbackEmailReplyToId model."""
    USER_ID_1 = 'user_id_1'
    USER_ID_2 = 'user_id_2'
    THREAD_ID_1 = 'thread_id_1'
    THREAD_ID_2 = 'thread_id_2'
    USER_2_REPLY_TO_ID_1 = 'user_2_reply_to_id_thread_1'
    USER_2_REPLY_TO_ID_2 = 'user_2_reply_to_id_thread_2'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(GeneralFeedbackEmailReplyToIdTests, self).setUp()

        # Since reply-to-id is generated using a random generator
        # that does not support seeding (SystemRandom) and whose
        # output is hashed by utils.convert_to_hash, we will
        # (for testing purposes) instead replace convert_to_hash
        # with a lambda that returns a predetermined value.
        user_two_fake_hash_lambda_one = (
            lambda rand_int, reply_to_id_length: self.USER_2_REPLY_TO_ID_1)
        user_two_fake_hash_one = self.swap(
            utils, 'convert_to_hash', user_two_fake_hash_lambda_one)
        with user_two_fake_hash_one:
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.USER_ID_2, self.THREAD_ID_1).put()

        user_two_fake_hash_lambda_two = (
            lambda rand_int, reply_to_id_length: self.USER_2_REPLY_TO_ID_2)
        user_two_fake_hash_two = self.swap(
            utils, 'convert_to_hash', user_two_fake_hash_lambda_two)
        with user_two_fake_hash_two:
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.USER_ID_2, self.THREAD_ID_2).put()

    def test_export_data_on_user_with_data(self):
        """Verify proper export data output on a normal user case."""
        user_data = (
            email_models.GeneralFeedbackEmailReplyToIdModel.export_data(
                self.USER_ID_2))
        expected_data = {
            self.THREAD_ID_1: self.USER_2_REPLY_TO_ID_1,
            self.THREAD_ID_2: self.USER_2_REPLY_TO_ID_2
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_user_without_data(self):
        """Verify proper export data output on user with no models."""
        user_data = (
            email_models.GeneralFeedbackEmailReplyToIdModel.export_data(
                self.USER_ID_1))
        expected_data = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_nonexistent_user(self):
        """Verify proper export data output on nonexistent user."""
        user_data = (
            email_models.GeneralFeedbackEmailReplyToIdModel.export_data(
                'fake_user'))
        expected_data = {}
        self.assertEqual(expected_data, user_data)
