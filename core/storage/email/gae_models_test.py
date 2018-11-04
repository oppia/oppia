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

import datetime
import types

from core.platform import models
from core.tests import test_utils
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])


class SentEmailModelUnitTests(test_utils.GenericTestBase):
    """Test the SentEmailModel class."""

    def setUp(self):
        super(SentEmailModelUnitTests, self).setUp()

        # pylint: disable=unused-argument
        def _generate_hash_for_tests(
                cls, recipient_id, email_subject, email_body):
            return 'Email Hash'

        self.generate_constant_hash_ctx = self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(
                _generate_hash_for_tests,
                email_models.SentEmailModel))

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


class GenerateHashTests(test_utils.GenericTestBase):
    """Test that generating hash functionality works as expected."""

    def test_same_inputs_always_gives_same_hashes(self):
        # pylint: disable=protected-access
        email_hash1 = email_models.SentEmailModel._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body')

        email_hash2 = email_models.SentEmailModel._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body')
        self.assertEqual(email_hash1, email_hash2)
        # pylint: enable=protected-access

    def test_different_inputs_give_different_hashes(self):
        # pylint: disable=protected-access
        email_hash1 = email_models.SentEmailModel._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body')

        email_hash2 = email_models.SentEmailModel._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body2')
        self.assertNotEqual(email_hash1, email_hash2)

        email_hash2 = email_models.SentEmailModel._generate_hash(
            'recipient_id2', 'email_subject', 'email_html_body')
        self.assertNotEqual(email_hash1, email_hash2)

        email_hash2 = email_models.SentEmailModel._generate_hash(
            'recipient_id', 'email_subject2', 'email_html_body')
        self.assertNotEqual(email_hash1, email_hash2)

        email_hash2 = email_models.SentEmailModel._generate_hash(
            'recipient_id2', 'email_subject2', 'email_html_body2')
        self.assertNotEqual(email_hash1, email_hash2)
        # pylint: enable=protected-access
