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

from core.platform import models
from core.tests import test_utils
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])


class SentEmailModelUnitTests(test_utils.GenericTestBase):
    """Test the SentEmailModel class."""

    def test_sent_email_model_instances_are_read_only(self):
        email_models.SentEmailModel.create(
            'recipient_id', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Email Hash')

        model = email_models.SentEmailModel.get_all().fetch()[0]
        model.recipient_id = 'new_recipient_id'
        with self.assertRaises(Exception):
            model.put()

    def test_saved_model_can_be_retrieved_with_same_hash(self):
        email_models.SentEmailModel.create(
            'recipient_id', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Email Hash')

        query = email_models.SentEmailModel.query()
        query = query.filter(
            email_models.SentEmailModel.email_hash == 'Email Hash')

        results = query.fetch(2)

        self.assertEqual(len(results), 1)

        query = email_models.SentEmailModel.query()
        query = query.filter(
            email_models.SentEmailModel.email_hash == 'Wrong Email Hash')

        results = query.fetch(2)

        self.assertEqual(len(results), 0)

    def test_get_by_hash_works_correctly(self):
        email_models.SentEmailModel.create(
            'recipient_id', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Email Hash')

        results = email_models.SentEmailModel.get_by_hash('Email Hash')

        self.assertEqual(len(results), 1)

        results = email_models.SentEmailModel.get_by_hash('Wrong Email Hash')

        self.assertEqual(len(results), 0)

    def test_get_by_hash_returns_multiple_models_with_same_hash(self):
        email_models.SentEmailModel.create(
            'recipient_id', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Same Hash')

        email_models.SentEmailModel.create(
            'recipient_id', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Same Hash')

        results = email_models.SentEmailModel.get_by_hash('Same Hash')

        self.assertEqual(len(results), 2)

    def test_get_by_hash_behavior_with_sent_datetime_lower_bound(self):
        time_now = datetime.datetime.utcnow()

        email_models.SentEmailModel.create(
            'recipient_id', 'recipient@email.com', 'sender_id',
            'sender@email.com', feconf.EMAIL_INTENT_SIGNUP,
            'Email Subject', 'Email Body', datetime.datetime.utcnow(),
            'Email Hash')

        results = email_models.SentEmailModel.get_by_hash(
            'Email Hash', sent_datetime_lower_bound=time_now)
        self.assertEqual(len(results), 1)

        time_now1 = datetime.datetime.utcnow()

        results = email_models.SentEmailModel.get_by_hash(
            'Email Hash', sent_datetime_lower_bound=time_now1)
        self.assertEqual(len(results), 0)

        after = datetime.datetime.utcnow() - datetime.timedelta(minutes=2)

        results = email_models.SentEmailModel.get_by_hash(
            'Email Hash', sent_datetime_lower_bound=after)
        self.assertEqual(len(results), 1)

        # Check that it accepts only DateTime objects.
        with self.assertRaises(Exception):
            results = email_models.SentEmailModel.get_by_hash(
                'Email Hash', sent_datetime_lower_bound='Not a datetime object')
