# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for feedback domain objects."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.domain import feedback_domain
from core.tests import test_utils


class FeedbackThreadDomainUnitTests(test_utils.GenericTestBase):
    EXP_ID = 'exp0'
    THREAD_ID = 'exp0.thread0'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_to_dict(self) -> None:
        fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        expected_thread_dict: feedback_domain.FeedbackThreadDict = {
            'thread_id': self.THREAD_ID,
            'status': u'open',
            'state_name': u'a_state_name',
            'summary': 'test summary',
            'original_author_id': self.viewer_id,
            'message_count': 1,
            'subject': u'a subject',
            'last_updated_msecs': utils.get_time_in_millisecs(fake_date),
            'last_nonempty_message_text': 'last message',
            'last_nonempty_message_author_id': self.viewer_id,
        }
        observed_thread = feedback_domain.FeedbackThread(
            self.THREAD_ID, feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID,
            expected_thread_dict['state_name'], self.viewer_id,
            expected_thread_dict['status'], expected_thread_dict['subject'],
            expected_thread_dict['summary'], False, 1, fake_date, fake_date,
            'last message', self.viewer_id)
        self.assertDictEqual(
            expected_thread_dict, observed_thread.to_dict())

    def test_get_last_two_message_ids_from_thread_with_many_messages(
        self
    ) -> None:
        fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        thread = feedback_domain.FeedbackThread(
            self.THREAD_ID, feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID,
            u'a_state_name', self.viewer_id, u'open', u'a subject',
            # This value of "5" decides the number of messages.
            'test summary', False, 5, fake_date, fake_date, 'last message',
            self.VIEWER_USERNAME)

        self.assertEqual(
            thread.get_last_two_message_ids(),
            ['exp0.thread0.4', 'exp0.thread0.3'])

    def test_get_last_two_message_ids_from_thread_with_only_one_message(
        self
    ) -> None:
        fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        thread = feedback_domain.FeedbackThread(
            self.THREAD_ID, feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID,
            u'a_state_name', self.viewer_id, u'open', u'a subject',
            # This value of "1" decides the number of messages.
            'test summary', False, 1, fake_date, fake_date, 'last message',
            self.VIEWER_USERNAME)

        self.assertEqual(
            thread.get_last_two_message_ids(), ['exp0.thread0.0', None])


class FeedbackMessageDomainUnitTests(test_utils.GenericTestBase):
    EXP_ID = 'exp0'
    MESSAGE_ID = 0
    THREAD_ID = 'exploration.exp0.thread0'
    FULL_MESSAGE_ID = THREAD_ID + '.' + str(MESSAGE_ID)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_to_dict(self) -> None:
        fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        expected_message_dict: feedback_domain.FeedbackMessageDict = {
            'author_id': self.owner_id,
            'created_on_msecs': utils.get_time_in_millisecs(fake_date),
            'entity_type': feconf.ENTITY_TYPE_EXPLORATION,
            'entity_id': self.EXP_ID,
            'message_id': self.MESSAGE_ID,
            'text': 'a message text',
            'updated_status': 'open',
            'updated_subject': 'an updated subject'
        }
        observed_message = feedback_domain.FeedbackMessage(
            self.FULL_MESSAGE_ID, self.THREAD_ID, self.MESSAGE_ID,
            self.owner_id, expected_message_dict['updated_status'],
            expected_message_dict['updated_subject'],
            expected_message_dict['text'], fake_date, fake_date, False)
        self.assertDictEqual(
            expected_message_dict, observed_message.to_dict())


class FeedbackAnalyticsDomainUnitTests(test_utils.GenericTestBase):
    EXP_ID = 'exp0'

    def test_to_dict(self) -> None:
        expected_thread_analytics = feedback_domain.FeedbackAnalytics(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 1, 2)
        self.assertDictEqual(expected_thread_analytics.to_dict(), {
            'num_open_threads': 1,
            'num_total_threads': 2
        })


class FeedbackMessageReferenceDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.entity_type = feconf.ENTITY_TYPE_EXPLORATION
        self.exp_id = 'exp'
        self.message_id = 10
        self.thread_id = 'exploration.a.b'

        self.feedback_message_reference_dict: (
            feedback_domain.FeedbackMessageReferenceDict
        ) = {
            'entity_type': self.entity_type,
            'entity_id': self.exp_id,
            'thread_id': self.thread_id,
            'message_id': self.message_id
        }

        self.feedback_message_reference = (
            feedback_domain.FeedbackMessageReference(
                self.entity_type, self.exp_id, self.thread_id,
                self.message_id))

    def test_to_dict(self) -> None:
        self.assertDictEqual(
            self.feedback_message_reference.to_dict(),
            self.feedback_message_reference_dict)

    def test_from_dict(self) -> None:
        observed_reference = feedback_domain.FeedbackMessageReference.from_dict(
            self.feedback_message_reference_dict)

        self.assertEqual(observed_reference.entity_id, self.exp_id)
        self.assertEqual(
            observed_reference.entity_type, feconf.ENTITY_TYPE_EXPLORATION)
        self.assertEqual(observed_reference.message_id, self.message_id)
        self.assertEqual(observed_reference.thread_id, self.thread_id)

    def test_valid_feedback_message_reference(self) -> None:
        try:
            self.feedback_message_reference.validate()
        except utils.ValidationError:
            self.fail(
                'Failed to validate correct FeedbackMessageReference')

    def test_invalid_entity_type(self) -> None:
        reference_dict = self.feedback_message_reference

        reference_dict.entity_type = 10
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected entity type to be a string, received: %s.'
            % reference_dict.entity_type):
            reference_dict.validate()

        reference_dict.entity_type = 'invalid_entity_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Entity type is not in list of allowed types'
                ', received: \'%s\' and allowed types are: \'%s\''
                % (
                    reference_dict.entity_type,
                    ', '.join(map(str, feconf.ALLOWED_ENTITY_TYPES)))):
            reference_dict.validate()

    def test_invalid_entity_id(self) -> None:
        reference_dict = self.feedback_message_reference

        reference_dict.entity_id = 10
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected entity ID to be a string, received: %s.'
                % reference_dict.entity_id):
            reference_dict.validate()

        reference_dict.entity_id = 'invalid_entity_id'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Entity ID is not a valid id'
                ', received: \'%s\'' % reference_dict.entity_id):
            reference_dict.validate()

    def test_invalid_thread_id(self) -> None:
        reference_dict = self.feedback_message_reference

        reference_dict.thread_id = 10
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected thread ID to be a string, received: %s.'
                % reference_dict.thread_id):
            reference_dict.validate()

        reference_dict.thread_id = 'invalid_thread_id'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Thread ID did not match expected pattern'
                ', received: \'%s\'' % reference_dict.thread_id):
            reference_dict.validate()

    def test_invalid_message_id(self) -> None:
        reference_dict = self.feedback_message_reference

        reference_dict.message_id = 'id'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected message ID to be an integer, received: %s.'
                % reference_dict.message_id):
            reference_dict.validate()
