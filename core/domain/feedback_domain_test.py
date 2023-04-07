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


class TestFullyQualifiedMessageIdentifier(test_utils.GenericTestBase):

    """Unit tests for the FullyQualifiedMessageIdentifier class."""

    def test_initialization(self) -> None:
        qualified_message = feedback_domain.FullyQualifiedMessageIdentifier(
            'thread_id',
            123
        )
        self.assertEqual(qualified_message.thread_id, 'thread_id')
        self.assertEqual(qualified_message.message_id, 123)


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
        self.exp_id = 'exp'
        self.message_id = 10
        self.thread_id = 'exp.thread'

    def test_to_dict(self) -> None:
        expected_feedback_message_reference: (
            feedback_domain.FeedbackMessageReferenceDict
        ) = {
            'entity_type': feconf.ENTITY_TYPE_EXPLORATION,
            'entity_id': self.exp_id,
            'thread_id': self.thread_id,
            'message_id': self.message_id
        }

        observed_feedback_message_reference = (
            feedback_domain.FeedbackMessageReference(
                feconf.ENTITY_TYPE_EXPLORATION, self.exp_id, self.thread_id,
                self.message_id))

        self.assertDictEqual(
            observed_feedback_message_reference.to_dict(),
            expected_feedback_message_reference)


class FeedbackThreadSummaryDomainTests(test_utils.GenericTestBase):
    STATUS = 'open'
    LAST_MESSAGE = 'last message'
    AUTHOR_LAST_MESSAGE = 'author last message'
    AUTHOR_SECOND_LAST_MESSAGE = ''
    EXPLORATION_TITLE = 'title'
    EXPLORATION_ID = 'id'
    THREAD_ID = 'ok'

    def setUp(self) -> None:
        super().setUp()
        self.thread_id = 'exp.thread'
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_to_dict(self) -> None:
        fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        expected_feedback_thread_summary = {
            'status': self.STATUS,
            'original_author_id': self.viewer_id,
            'last_updated_msecs': utils.get_time_in_millisecs(fake_date),
            'last_message_text': self.LAST_MESSAGE,
            'total_message_count': 1,
            'last_message_is_read': True,
            'second_last_message_is_read': True,
            'author_last_message': self.AUTHOR_LAST_MESSAGE,
            'author_second_last_message': self.AUTHOR_SECOND_LAST_MESSAGE,
            'exploration_title': self.EXPLORATION_TITLE,
            'exploration_id': self.EXPLORATION_ID,
            'thread_id': self.THREAD_ID,
        }

        observed_thread = feedback_domain.FeedbackThreadSummary(
            str(expected_feedback_thread_summary['status']),
            str(self.viewer_id),
            fake_date,
            str(expected_feedback_thread_summary['last_message_text']),
            1,
            True,
            True,
            str(expected_feedback_thread_summary['author_last_message']),
            str(expected_feedback_thread_summary['author_second_last_message']),
            str(expected_feedback_thread_summary['exploration_title']),
            str(expected_feedback_thread_summary['exploration_id']),
            str(expected_feedback_thread_summary['thread_id'])
        )

        self.assertDictEqual(
            expected_feedback_thread_summary,
            observed_thread.to_dict()
        )
