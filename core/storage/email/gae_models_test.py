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

(base_models, email_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.email, models.NAMES.user])


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

            time_before = (
                datetime.datetime.utcnow() - datetime.timedelta(minutes=10))

            results = email_models.SentEmailModel.get_by_hash(
                'Email Hash', sent_datetime_lower_bound=time_before)
            self.assertEqual(len(results), 1)

            # Check that it accepts only DateTime objects.
            with self.assertRaisesRegexp(
                Exception,
                'Expected datetime, received Not a datetime object of type '
                '<type \'unicode\'>'):
                email_models.SentEmailModel.get_by_hash(
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
        email_model_instance.update_timestamps()
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
        email_model_instance.update_timestamps()
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
        email_model_instance2.update_timestamps()
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
        email_model_instance2.update_timestamps()
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
        email_model_instance2.update_timestamps()
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
        email_model_instance2.update_timestamps()
        email_model_instance2.put()

        email_hash2 = email_model_instance2.email_hash
        self.assertNotEqual(email_hash1, email_hash2)
