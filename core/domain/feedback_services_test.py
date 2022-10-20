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

"""Tests for feedback-related services."""

from __future__ import annotations

from core import feconf
from core.domain import event_services
from core.domain import exp_domain
from core.domain import feedback_domain
from core.domain import feedback_services
from core.domain import subscription_services
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final, List, Optional, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models
    from mypy_imports import suggestion_models

(feedback_models, suggestion_models) = models.Registry.import_models([
    models.Names.FEEDBACK,
    models.Names.SUGGESTION
])


class FeedbackServicesUnitTests(test_utils.EmailTestBase):
    """Test functions in feedback_services."""

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'
    EXP_1_ID: Final = 'exp_1_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

    def test_feedback_ids(self) -> None:
        """Test various conventions for thread and message ids."""
        exp_id = '0'
        feedback_services.create_thread(
            'exploration', exp_id, 'test_user', 'a subject', 'some text')
        threadlist = feedback_services.get_all_threads(
            'exploration', exp_id, False)
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0].id

        messages = feedback_services.get_messages(thread_id)
        self.assertEqual(len(messages), 1)
        message_id = messages[0].message_id
        self.assertTrue(isinstance(message_id, int))
        threadlist = feedback_services.get_all_threads(
            'exploration', exp_id, False)
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0].id

        messages = feedback_services.get_messages(thread_id)
        self.assertEqual(len(messages), 1)
        message_id = messages[0].message_id
        self.assertTrue(isinstance(message_id, int))

        # Retrieve the message instance from the storage layer.
        datastore_id = feedback_models.GeneralFeedbackMessageModel.get_messages(
            thread_id)[0].id

        # The message id should be prefixed with the thread id and a full
        # stop, followed by the message id.
        self.assertEqual(datastore_id, '%s.%s' % (thread_id, message_id))

    def test_create_message_raises_exception_for_invalid_thread_id(
        self
    ) -> None:
        thread_id = 'invalid_thread_id'

        expected_exception_regexp = (
            r'Thread belonging to the GeneralFeedbackThreadModel class '
            r'with id:\[%s\] was not found.' % (thread_id)
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            feedback_services.create_message(
                thread_id, self.user_id, None, None, 'Hello')

    def test_create_messages_raises_pluralized_exception_for_bad_thread_ids(
        self
    ) -> None:
        thread_ids = ['invalid_thread_id_1', 'invalid_thread_id_2']

        expected_exception_regexp = (
            r'Threads belonging to the GeneralFeedbackThreadModel class '
            r'with ids:\[%s\] were not found.' % (' '.join(thread_ids))
        )
        with self.assertRaisesRegex(Exception, expected_exception_regexp):
            feedback_services.create_messages(
                thread_ids, self.user_id, None, None, 'Hello')

    def test_create_messages_raises_an_exception_if_thread_ids_are_not_unique(
        self
    ) -> None:
        repeated_thread_ids = ['thread_id', 'thread_id']

        with self.assertRaisesRegex(
            Exception,
            'Thread ids must be distinct when calling create_messsages.'):
            feedback_services.create_messages(
                repeated_thread_ids, self.user_id, None, None, 'Hello')

    def test_delete_threads_for_multiple_entities(self) -> None:
        self.save_new_default_exploration(self.EXP_1_ID, self.EXP_1_ID)
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_1_ID,
            1,
            self.user_id,
            {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state',
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'new_value': 'new content'
            },
            'some text')
        thread_id = feedback_services.get_threads(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_1_ID
        )[0].id
        feedback_services.create_message(
            thread_id, self.user_id, None, None, 'some text')
        feedback_models.FeedbackAnalyticsModel(id=self.EXP_1_ID).put()

        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [self.EXP_1_ID])

        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [])

        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id))
        self.assertIsNone(
            feedback_models.FeedbackAnalyticsModel.get_by_id(self.EXP_1_ID))

    def test_status_of_newly_created_thread_is_open(self) -> None:
        exp_id = '0'
        feedback_services.create_thread(
            'exploration', exp_id, 'test_user', 'a subject', 'some text')
        threadlist = feedback_services.get_all_threads(
            'exploration', exp_id, False)
        thread_status = threadlist[0].status
        self.assertEqual(thread_status, feedback_models.STATUS_CHOICES_OPEN)

    def test_get_exp_id_from_thread_id(self) -> None:
        thread_id = 'exploration.exp1.1234'
        self.assertEqual(
            feedback_services.get_exp_id_from_thread_id(thread_id), 'exp1')


class FeedbackDeletionUnitTests(test_utils.GenericTestBase):
    """Test functions in feedback_services."""

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        self.save_new_default_exploration(self.EXP_1_ID, self.user_id)
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_1_ID,
            1,
            self.user_id,
            {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state',
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'new_value': 'new content'
            },
            'some text')
        self.thread_1_id = feedback_services.get_threads(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_1_ID
        )[0].id
        feedback_services.create_message(
            self.thread_1_id, self.user_id, None, None, 'some text')

        self.save_new_default_exploration(self.EXP_2_ID, self.user_id)
        self.thread_2_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_2_ID,
            self.user_id,
            'subject',
            'text'
        )

        feedback_models.FeedbackAnalyticsModel(id=self.EXP_1_ID).put()

    def test_delete_feedback_threads_deletes_thread(self) -> None:
        self.assertIsNotNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_1_id))
        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [self.EXP_1_ID])
        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_1_id))

    def test_delete_feedback_threads_deletes_suggestion(self) -> None:
        self.assertIsNotNone(
            suggestion_models.GeneralSuggestionModel.get_by_id(self.thread_1_id)
        )
        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [self.EXP_1_ID])
        self.assertIsNone(
            suggestion_models.GeneralSuggestionModel.get_by_id(self.thread_1_id)
        )

    def test_delete_feedback_threads_deletes_message(self) -> None:
        self.assertIsNotNone(
            feedback_models.GeneralFeedbackMessageModel.get_by_id(
                '%s.%s' % (self.thread_1_id, 0)))
        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [self.EXP_1_ID])
        self.assertIsNone(
            feedback_models.GeneralFeedbackMessageModel.get_by_id(
                '%s.%s' % (self.thread_1_id, 0)))

    def test_delete_feedback_threads_deletes_feedback_analytics(self) -> None:
        self.assertIsNotNone(
            feedback_models.FeedbackAnalyticsModel.get_by_id(self.EXP_1_ID))
        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [self.EXP_1_ID])
        self.assertIsNone(
            feedback_models.FeedbackAnalyticsModel.get_by_id(self.EXP_1_ID))

    def test_delete_exploration_feedback_analytics(self) -> None:
        self.assertIsNotNone(
            feedback_models.FeedbackAnalyticsModel.get_by_id(self.EXP_1_ID))
        feedback_services.delete_exploration_feedback_analytics([self.EXP_1_ID])
        self.assertIsNone(
            feedback_models.FeedbackAnalyticsModel.get_by_id(self.EXP_1_ID))

    def test_delete_feedback_threads_deletes_multiple_feedbacks(self) -> None:
        self.assertIsNotNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_1_id))
        self.assertIsNotNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_2_id))
        feedback_services.delete_threads_for_multiple_entities(
            feconf.ENTITY_TYPE_EXPLORATION, [self.EXP_1_ID, self.EXP_2_ID])
        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_1_id))
        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_2_id))


class ExpectedThreadDict(TypedDict):
    """Dict representing the EXPECTED_THREAD_DICT dictionary."""

    status: str
    summary: Optional[str]
    original_author_id: Optional[str]
    subject: str


class ExpectedThreadViewerDict(TypedDict):
    """Dict representing the EXPECTED_THREAD_DICT_VIEWER dictionary."""

    status: str
    summary: Optional[str]
    original_author_id: Optional[str]
    subject: str


class ReferenceDict(TypedDict):
    """Dictionary representing the FeedbackMessageReference dictionary."""

    entity_type: str
    entity_id: str
    thread_id: str
    message_id: int


class FeedbackThreadUnitTests(test_utils.GenericTestBase):

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'
    EXP_ID_3: Final = 'eid3'
    THREAD_ID: Final = 'thread_id'

    EXPECTED_THREAD_DICT: ExpectedThreadDict = {
        'status': u'open',
        'summary': None,
        'original_author_id': None,
        'subject': u'a subject'
    }
    EXPECTED_THREAD_DICT_VIEWER: ExpectedThreadViewerDict = {
        'status': u'open',
        'summary': None,
        'original_author_id': None,
        'subject': u'a subject second'
    }

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id, title='Leaning tower of Pisa',
            category='Architecture', language_code='fi')

    def _get_all_messages_read(self, user_id: str, thread_id: str) -> List[int]:
        """Returns the list of the ids of all the messages corresponding to the
        given thread id read by the user.
        """
        feedback_thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get(
                user_id, thread_id))

        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        message_ids: List[int] = (
            feedback_thread_user_model.message_ids_read_by_user if
            feedback_thread_user_model else []
        )
        return message_ids

    def test_get_threads_single_exploration(self) -> None:
        threads = feedback_services.get_threads('exploration', self.EXP_ID_1)
        self.assertEqual(len(threads), 0)
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        threads = feedback_services.get_threads('exploration', self.EXP_ID_1)
        self.assertEqual(1, len(threads))
        self.assertDictContainsSubset(
            self.EXPECTED_THREAD_DICT, threads[0].to_dict())

    def test_get_all_threads(self) -> None:
        # Create an anonymous feedback thread.
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        threads = feedback_services.get_all_threads(
            'exploration', self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))
        self.assertDictContainsSubset(
            self.EXPECTED_THREAD_DICT, threads[0].to_dict())

        self.EXPECTED_THREAD_DICT_VIEWER['original_author_id'] = (
            self.viewer_id)

        # Viewer creates feedback thread.
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.viewer_id,
            self.EXPECTED_THREAD_DICT_VIEWER['subject'], 'not used here')

        threads = feedback_services.get_all_threads(
            'exploration', self.EXP_ID_1, False)
        self.assertEqual(2, len(threads))
        self.assertDictContainsSubset(
            self.EXPECTED_THREAD_DICT_VIEWER, threads[0].to_dict())

    def test_get_total_open_thread_for_single_exploration(self) -> None:
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, 'test_user',
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        thread = feedback_services.get_thread_analytics(self.EXP_ID_1)
        self.assertEqual(thread.id, self.EXP_ID_1)
        self.assertEqual(thread.num_open_threads, 1)
        self.assertEqual(thread.num_total_threads, 1)

    def test_get_next_page_of_all_feedback_messages(self) -> None:
        self.save_new_default_exploration(self.EXP_ID_1, self.EXP_ID_2)
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.EXP_ID_1,
            1,
            self.user_id,
            {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': 'state',
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'new_value': 'new content'
            },
            'some text')
        thread_id = feedback_services.get_threads(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID_1
        )[0].id
        feedback_services.create_message(
            thread_id, self.user_id, None, None, 'some text')
        feedback_services.create_message(
            thread_id, self.user_id, None, None, 'Another text')
        messages_on_page = feedback_services.get_messages(thread_id)
        dictionary_list_from_test_method = []
        dictionary_list_from_page_message = []
        method_result = (
            feedback_services.get_next_page_of_all_feedback_messages())
        for i in (method_result)[0]:
            dictionary_list_from_test_method.append(i.to_dict().items())
        for i in messages_on_page:
            dictionary_list_from_page_message.append(i.to_dict().items())
        dictionary_list_from_page_message.reverse()
        self.assertListEqual(
            dictionary_list_from_test_method,
            dictionary_list_from_page_message,
        )
        genral_feedback_result = (
        feedback_models.GeneralFeedbackMessageModel.get_all_messages(
            feconf.FEEDBACK_TAB_PAGE_SIZE, None))
        self.assertEqual(method_result[1], genral_feedback_result[1])
        self.assertEqual(method_result[2], genral_feedback_result[2])

    def test_get_multiple_threads(self) -> None:
        thread_1 = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, 'test_user',
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        thread_2 = feedback_services.create_thread(
            'exploration', self.EXP_ID_2, 'test_user',
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        thread_id_list = [thread_1, thread_2]
        thread_list = []
        thread_list_from_result = []
        for i in thread_id_list:
            thread_list.append(
                feedback_services.get_thread(i).to_dict().items())
        for feedback_thread in feedback_services.get_multiple_threads(
            thread_id_list):
            thread_list_from_result.append(feedback_thread.to_dict().items())
        self.assertListEqual(thread_list_from_result, thread_list)

    def test_handle_thread_status_changed(self) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, 'test_user',
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        feedback_services.create_message(
            thread_id, self.user_id,
            feedback_models.STATUS_CHOICES_FIXED, None,
            'feedback message not used here')
        self.assertEqual(feedback_services.get_total_open_threads(
            [feedback_services.get_thread_analytics(self.EXP_ID_1)]), 0)
        feedback_services.handle_thread_status_changed(
                self.EXP_ID_1,
                feedback_models.STATUS_CHOICES_FIXED,
                feedback_models.STATUS_CHOICES_OPEN)
        self.assertEqual(feedback_services.get_total_open_threads(
            [feedback_services.get_thread_analytics(self.EXP_ID_1)]
        ), 1)

    def test_get_total_open_threads_for_multiple_explorations(self) -> None:
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, 'test_user',
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        feedback_services.create_thread(
            'exploration', self.EXP_ID_2, 'test_user',
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        threads_exp_1 = feedback_services.get_all_threads(
            'exploration', self.EXP_ID_1, False)
        self.assertEqual(1, len(threads_exp_1))
        threads_exp_2 = feedback_services.get_all_threads(
            'exploration', self.EXP_ID_2, False)
        self.assertEqual(1, len(threads_exp_2))

        feedback_services.create_message(
            threads_exp_1[0].id, self.user_id,
            feedback_models.STATUS_CHOICES_FIXED, None,
            'feedback message not used here')

        self.assertEqual(len(feedback_services.get_closed_threads(
            'exploration', self.EXP_ID_1, False)), 1)

        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi(
                [self.EXP_ID_1, self.EXP_ID_2])), 1)

    def test_get_thread_summaries(self) -> None:
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        feedback_services.create_thread(
            'exploration', self.EXP_ID_2, self.user_id,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        # The message count parameter is missing for this thread. The thread
        # summaries function should account for this and function
        # flawlessly.
        thread_3 = feedback_models.GeneralFeedbackThreadModel(
            id='exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID,
            entity_type='exploration', entity_id=self.EXP_ID_3,
            original_author_id=self.user_id, subject='Feedback',
            status=feedback_models.STATUS_CHOICES_OPEN, message_count=0,
            has_suggestion=False)
        thread_3.update_timestamps()
        thread_3.put()
        feedback_services.create_message(
            'exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID,
            self.user_id, None, None, 'not used here')

        thread_ids = subscription_services.get_all_threads_subscribed_to(
            self.user_id)
        thread_ids.append('exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID)
        thread_summaries, number_of_unread_threads = (
            feedback_services.get_exp_thread_summaries(
                self.user_id, thread_ids))
        exploration_titles = (
            ['Bridges in England', 'Sillat Suomi', 'Leaning tower of Pisa'])

        # Fetch the threads.
        threads = []
        threads.append(feedback_services.get_thread(thread_ids[0]))
        threads.append(feedback_services.get_thread(thread_ids[1]))
        threads.append(feedback_services.get_thread(
            'exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID))
        # Check if the number of unread messages match.
        self.assertEqual(number_of_unread_threads, 0)
        for summary, thread, exploration_title in zip(
                thread_summaries, threads, exploration_titles):
            self.assertEqual(summary.status, thread.status)
            self.assertEqual(
                summary.original_author_id, thread.original_author_id)
            self.assertEqual(summary.last_updated, thread.last_updated)
            self.assertEqual(summary.last_message_text, 'not used here')
            self.assertEqual(summary.total_message_count, 1)
            self.assertTrue(summary.last_message_is_read)
            self.assertFalse(summary.second_last_message_is_read)
            self.assertEqual(
                summary.author_last_message,
                user_services.get_username(self.user_id))
            self.assertIsNone(summary.author_second_last_message)
            self.assertEqual(summary.exploration_title, exploration_title)

        feedback_services.create_message(
            threads[0].id, self.owner_id, None, None, 'editor message')
        _, number_of_unread_threads = (
            feedback_services.get_exp_thread_summaries(
                self.user_id, thread_ids))

        # Check if the number of unread messages is equal to 1.
        self.assertEqual(number_of_unread_threads, 1)

    def test_get_thread_summaries_returns_correct_message_count(self) -> None:
        thread_id_1 = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        thread_id_2 = feedback_services.create_thread(
            'exploration', self.EXP_ID_2, None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        thread_summaries, _ = feedback_services.get_exp_thread_summaries(
            self.owner_id, [thread_id_1, thread_id_2])

        self.assertEqual(len(thread_summaries), 2)
        self.assertEqual(thread_summaries[0].total_message_count, 1)
        self.assertEqual(thread_summaries[1].total_message_count, 1)

    def test_get_thread_summaries_only_returns_threads_for_explorations(
        self
    ) -> None:
        exp_thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id,
            'unused subject', 'unused text')
        skill_thread_id = feedback_services.create_thread(
            'skill', 'skillid1', self.user_id, 'unused subject', 'unused text')

        thread_summaries, _ = feedback_services.get_exp_thread_summaries(
            self.owner_id, [exp_thread_id, skill_thread_id])

        self.assertEqual(len(thread_summaries), 1)
        self.assertEqual(
            thread_summaries[0].exploration_title, 'Bridges in England')

    def test_update_messages_read_by_the_user(self) -> None:
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        threads = feedback_services.get_all_threads(
            'exploration', self.EXP_ID_1, False)
        thread_id = threads[0].id

        messages = feedback_services.get_messages(thread_id)
        message_ids = [message.message_id for message in messages]

        # The viewer has not read in messages yet.
        self.assertEqual(self._get_all_messages_read(
            self.viewer_id, thread_id), [])

        feedback_services.update_messages_read_by_the_user(
            self.viewer_id, thread_id, message_ids)

        # Check if the message is added to the read section of the viewer.
        self.assertEqual(self._get_all_messages_read(
            self.viewer_id, thread_id), message_ids)

    def test_add_message_ids_to_read_by_list_adds_msgs_to_threads_in_order(
        self
    ) -> None:
        """Tests that the message_ids are being added to the correct feedback
        thread user model instances when when some of these models exist before
        the method is called and some do not.
        """
        sample_message_ids = [1, 2, 3]
        sample_thread_ids = [
            'sample_thread_id_1', 'sample_thread_id_2',
            'sample_thread_id_3'
        ]
        # The GeneralFeedbackThreadUserModel is created for the
        # sample_thread_id_1 and sample_thread_id_3 thread ids.
        feedback_models.GeneralFeedbackThreadUserModel.create(
            self.user_id, sample_thread_ids[0])
        feedback_models.GeneralFeedbackThreadUserModel.create(
            self.user_id, sample_thread_ids[2])
        # Assert that no messages are read for any of the threads yet.
        for sample_thread_id in sample_thread_ids:
            self.assertEqual(
                self._get_all_messages_read(self.user_id, sample_thread_id),
                [])
        # Create a list of FullyQualifiedMessageIdentifier objects for the
        # sample_message_ids and sample_thread_ids.
        message_identifiers = []
        for sample_thread_id, sample_message_id in zip(
                sample_thread_ids, sample_message_ids):
            message_identifiers.append(
                feedback_domain.FullyQualifiedMessageIdentifier(
                    sample_thread_id, sample_message_id))

        # In the add_message_ids_to_read_by_list method, the
        # GeneralFeedbackUserModel is created for thread id
        # sample_thread_id_2.
        feedback_services.add_message_ids_to_read_by_list(
            self.user_id, message_identifiers)

        # Assert tht the message_ids were added to message_ids_read_by_user
        # property of the corresponding thread.
        for sample_thread_id, sample_message_id in zip(
                sample_thread_ids, sample_message_ids):
            self.assertEqual(
                self._get_all_messages_read(self.user_id, sample_thread_id),
                [sample_message_id])

    def test_only_exploration_threads_trigger_events(self) -> None:
        exp_id = 'eid'
        self.save_new_valid_exploration(exp_id, 'owner')

        event_handler_call_counter_exploration = test_utils.CallCounter(
            event_services.FeedbackThreadCreatedEventHandler.record)
        with self.swap(
            event_services.FeedbackThreadCreatedEventHandler, 'record',
            event_handler_call_counter_exploration):
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id,
                'test_user', 'a subject', 'some text')

            self.assertEqual(
                event_handler_call_counter_exploration.times_called, 1)

        event_handler_call_counter_non_exploration = (
            test_utils.CallCounter(
                event_services.FeedbackThreadCreatedEventHandler.record))
        with self.swap(
            event_services.FeedbackThreadCreatedEventHandler, 'record',
            event_handler_call_counter_non_exploration):
            feedback_services.create_thread(
                'topic', 'topic_id', 'test_user', 'a subject',
                'some text')
            self.assertEqual(
                event_handler_call_counter_non_exploration.times_called, 0)

    def test_create_message_increments_message_count(self) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.message_count, 1)
        feedback_services.create_message(
            thread_id, self.user_id,
            feedback_models.STATUS_CHOICES_FIXED, None, 'editor message')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.message_count, 2)

    def test_cache_update_after_create_thread_with_user_text(self) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id, 'subject',
            'initial text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertEqual(thread.last_nonempty_message_author_id, self.user_id)

    def test_cache_update_after_create_thread_with_anon_text(self) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None, 'subject', 'initial text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertIsNone(thread.last_nonempty_message_author_id)

    def test_cache_update_after_create_message_with_user_text(self) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None, 'subject', 'initial text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertIsNone(thread.last_nonempty_message_author_id)

        feedback_services.create_message(
            thread_id, self.user_id, feedback_models.STATUS_CHOICES_FIXED, None,
            'anonymous text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'anonymous text')
        self.assertEqual(thread.last_nonempty_message_author_id, self.user_id)

    def test_cache_update_after_create_message_with_anon_text(self) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id, 'subject',
            'initial text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertEqual(thread.last_nonempty_message_author_id, self.user_id)

        feedback_services.create_message(
            thread_id, None, feedback_models.STATUS_CHOICES_FIXED, None,
            'anonymous text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'anonymous text')
        self.assertIsNone(thread.last_nonempty_message_author_id)

    def test_no_cache_update_after_create_thread_with_empty_user_text(
        self
    ) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id, 'subject', '')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertIsNone(thread.last_nonempty_message_text)
        self.assertIsNone(thread.last_nonempty_message_author_id)

    def test_no_cache_update_after_create_thread_with_empty_anon_text(
        self
    ) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None, 'subject', '')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertIsNone(thread.last_nonempty_message_text)
        self.assertIsNone(thread.last_nonempty_message_author_id)

    def test_no_cache_update_after_create_message_with_empty_user_text(
        self
    ) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, None, 'subject', 'initial text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertIsNone(thread.last_nonempty_message_author_id)

        feedback_services.create_message(
            thread_id, self.user_id, feedback_models.STATUS_CHOICES_FIXED, None,
            '')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertIsNone(thread.last_nonempty_message_author_id)

    def test_no_cache_update_after_create_message_with_empty_anon_text(
        self
    ) -> None:
        thread_id = feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.user_id, 'subject',
            'initial text')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertEqual(thread.last_nonempty_message_author_id, self.user_id)

        feedback_services.create_message(
            thread_id, None, feedback_models.STATUS_CHOICES_FIXED,
            None, '')

        thread = feedback_models.GeneralFeedbackThreadModel.get(thread_id)
        self.assertEqual(thread.last_nonempty_message_text, 'initial text')
        self.assertEqual(thread.last_nonempty_message_author_id, self.user_id)


class EmailsTaskqueueTests(test_utils.GenericTestBase):
    """Tests for tasks in emails taskqueue."""

    def test_create_new_batch_task(self) -> None:
        user_id = 'user'
        feedback_services.enqueue_feedback_message_batch_email_task(user_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_EMAILS),
            1)

        tasks = self.get_pending_tasks(
            queue_name=taskqueue_services.QUEUE_NAME_EMAILS)
        self.assertEqual(
            tasks[0].url, feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS)

    def test_create_new_instant_task(self) -> None:
        user_id = 'user'
        reference_dict: ReferenceDict = {
            'entity_type': 'exploration',
            'entity_id': 'eid',
            'thread_id': 'tid',
            'message_id': 5
        }
        reference = feedback_domain.FeedbackMessageReference(
            reference_dict['entity_type'], reference_dict['entity_id'],
            reference_dict['thread_id'], reference_dict['message_id'])

        (
            feedback_services
            .enqueue_feedback_message_instant_email_task_transactional(
                user_id, reference)
        )
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_EMAILS),
            1)

        tasks = self.get_pending_tasks(
            queue_name=taskqueue_services.QUEUE_NAME_EMAILS)
        self.assertEqual(
            tasks[0].url, feconf.TASK_URL_INSTANT_FEEDBACK_EMAILS)
        # Ruling out the possibility of None for mypy type checking.
        assert tasks[0].payload is not None
        self.assertDictEqual(tasks[0].payload['reference_dict'], reference_dict)


class FeedbackMessageEmailTests(test_utils.EmailTestBase):
    """Tests for feedback message emails."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.signup('b@example.com', 'B')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_pop_feedback_message_references(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            messagelist = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messagelist), 1)

            feedback_services.pop_feedback_message_references_transactional(
                self.editor_id, 0)
            model = feedback_models.UnsentFeedbackEmailModel.get(
                self.editor_id, strict=False)
            # Ruling out the possibility of None for mypy type checking.
            assert model is not None
            self.assertEqual(
                len(model.feedback_message_references), 1)
            self.assertEqual(
                model.feedback_message_references[0]['thread_id'], thread_id)

            feedback_services.pop_feedback_message_references_transactional(
                self.editor_id, 1)
            model = feedback_models.UnsentFeedbackEmailModel.get(
                self.editor_id, strict=False)
            self.assertIsNone(model)

    def test_update_feedback_message_references(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            # There are no feedback message references to remove.
            self.assertIsNone(
                feedback_services
                .clear_feedback_message_references_transactional(
                    self.editor_id, self.exploration.id, 'thread_id')
            )

            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            messagelist = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messagelist), 1)

            model = feedback_models.UnsentFeedbackEmailModel.get(
                self.editor_id)
            self.assertEqual(
                len(model.feedback_message_references), 1)
            self.assertEqual(
                model.feedback_message_references[0]['thread_id'], thread_id)

            feedback_services.clear_feedback_message_references_transactional(
                self.editor_id, self.exploration.id, 'new_thread_id')
            model = feedback_models.UnsentFeedbackEmailModel.get(
                self.editor_id)
            self.assertEqual(
                len(model.feedback_message_references), 1)
            self.assertEqual(
                model.feedback_message_references[0]['thread_id'],
                thread_id)

    def test_update_feedback_email_retries(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')

            model = feedback_models.UnsentFeedbackEmailModel.get(
                self.editor_id)
            self.assertEqual(model.retries, 0)

            with self.swap(
                feconf, 'DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS', -1
            ):
                feedback_services.update_feedback_email_retries_transactional(
                    self.editor_id)

            model = feedback_models.UnsentFeedbackEmailModel.get(
                self.editor_id)
            self.assertEqual(model.retries, 1)

    def test_send_feedback_message_email(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            messagelist = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messagelist), 1)

            expected_feedback_message_dict = {
                'entity_type': 'exploration',
                'entity_id': self.exploration.id,
                'thread_id': thread_id,
                'message_id': messagelist[0].message_id
            }
            # There are two jobs in the taskqueue: one for the realtime
            # event associated with creating a thread, and one for sending
            # the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            model = feedback_models.UnsentFeedbackEmailModel.get(self.editor_id)

            self.assertEqual(len(model.feedback_message_references), 1)
            self.assertDictEqual(
                model.feedback_message_references[0],
                expected_feedback_message_dict)
            self.assertEqual(model.retries, 0)

    def test_add_new_feedback_message(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.user_id_a, None, None, 'editor message')
            # There are two jobs in the taskqueue: one for the realtime
            # event associated with creating a thread, and one for sending
            # the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)

            messagelist = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messagelist), 2)

            expected_feedback_message_dict1 = {
                'entity_type': 'exploration',
                'entity_id': self.exploration.id,
                'thread_id': thread_id,
                'message_id': messagelist[0].message_id
            }
            expected_feedback_message_dict2 = {
                'entity_type': 'exploration',
                'entity_id': self.exploration.id,
                'thread_id': thread_id,
                'message_id': messagelist[1].message_id
            }

            model = feedback_models.UnsentFeedbackEmailModel.get(self.editor_id)

            self.assertEqual(len(model.feedback_message_references), 2)
            self.assertDictEqual(
                model.feedback_message_references[0],
                expected_feedback_message_dict1)
            self.assertDictEqual(
                model.feedback_message_references[1],
                expected_feedback_message_dict2)
            self.assertEqual(model.retries, 0)

    def test_email_is_not_sent_recipient_has_muted_emails_globally(
        self
    ) -> None:
        user_services.update_email_preferences(
            self.editor_id, True, False, False, False)

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_email_is_not_sent_recipient_has_muted_this_exploration(
        self
    ) -> None:
        user_services.set_email_preferences_for_exploration(
            self.editor_id, self.exploration.id,
            mute_feedback_notifications=True)

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_emails_are_not_sent_for_anonymous_user(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id, 'test_id',
                'a subject', 'some text')

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_emails_are_sent_for_registered_user(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')

            # There are two jobs in the taskqueue: one for the realtime
            # event associated with creating a thread, and one for sending
            # the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)

            tasks = self.get_pending_tasks(
                queue_name=taskqueue_services.QUEUE_NAME_EMAILS)
            self.assertEqual(
                tasks[0].url, feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS)
            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)

    def test_that_emails_are_not_sent_if_service_is_disabled(self) -> None:
        cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        cannot_send_feedback_message_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)
        with cannot_send_emails_ctx, cannot_send_feedback_message_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'some text')

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_emails_are_not_sent_for_thread_status_changes(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', '')

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_email_are_not_sent_to_author_himself(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.editor_id, 'a subject', 'A message')

            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_email_is_sent_for_reply_on_feedback(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'A message')
            # There are two jobs in the taskqueue: one for the realtime
            # event associated with creating a thread, and one for sending
            # the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.editor_id, None, None, 'editor message')
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()

    def test_that_email_is_sent_for_changing_status_of_thread(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'A message')
            # There are two jobs in the taskqueue: one for the realtime
            # event associated with creating a thread, and one for sending
            # the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.editor_id,
                feedback_models.STATUS_CHOICES_FIXED, None, '')
            # There are two jobs in the taskqueue: one for the realtime
            # event associated with changing subject of thread, and one for
            # sending the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()

    def test_that_email_is_sent_for_each_feedback_message(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.user_id_a, 'a subject', 'A message')
            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id
            # There are two jobs in the taskqueue: one for the realtime
            # event associated with creating a thread, and one for sending
            # the email.
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()

            feedback_services.create_message(
                thread_id, self.editor_id, None, None, 'editor message')
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()

            feedback_services.create_message(
                thread_id, self.editor_id, None, None, 'editor message2')
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EMAILS), 1)
            self.process_and_flush_pending_tasks()


class FeedbackMessageBatchEmailHandlerTests(test_utils.EmailTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_emails_are_sent(self) -> None:
        expected_email_html_body = (
            'Hi editor,<br>'
            '<br>'
            'You\'ve received a new message on your Oppia explorations:<br>'
            '<ul>'
            '<li><a href="https://www.oppia.org/create/A#/feedback">Title</a>:'
            '<br>'
            '<ul><li>some text<br></li>'
            '</ul></li></ul>'
            'You can view and reply to your messages from your '
            '<a href="https://www.oppia.org/creator-dashboard">dashboard</a>.'
            '<br>'
            '<br>Thanks, and happy teaching!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            '\n'
            'You\'ve received a new message on your Oppia explorations:\n'
            '- Title:\n'
            '- some text\n'
            'You can view and reply to your messages from your dashboard.\n'
            '\n'
            'Thanks, and happy teaching!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.new_user_id, 'a subject', 'some text')

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            messagelist = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messagelist), 1)

            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_that_correct_emails_are_sent_for_multiple_feedback(self) -> None:
        expected_email_html_body = (
            'Hi editor,<br>'
            '<br>'
            'You\'ve received 2 new messages on your Oppia explorations:<br>'
            '<ul>'
            '<li><a href="https://www.oppia.org/create/A#/feedback">Title</a>:'
            '<br>'
            '<ul><li>some text<br></li>'
            '<li>more text<br></li>'
            '</ul></li></ul>'
            'You can view and reply to your messages from your '
            '<a href="https://www.oppia.org/creator-dashboard">dashboard</a>.'
            '<br>'
            '<br>Thanks, and happy teaching!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            '\n'
            'You\'ve received 2 new messages on your Oppia explorations:\n'
            '- Title:\n'
            '- some text\n'
            '- more text\n'
            'You can view and reply to your messages from your dashboard.\n'
            '\n'
            'Thanks, and happy teaching!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.new_user_id, 'a subject', 'some text')

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.new_user_id,
                feedback_models.STATUS_CHOICES_OPEN, 'subject', 'more text')

            messagelist = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messagelist), 2)

            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_that_emails_are_not_sent_if_already_seen(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.new_user_id, 'a subject', 'some text')

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            self.login(self.EDITOR_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '%s/%s' % (
                    feconf.FEEDBACK_THREAD_VIEW_EVENT_URL, thread_id),
                {}, csrf_token=csrf_token)

            self.process_and_flush_pending_tasks()
            messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)


class FeedbackMessageInstantEmailHandlerTests(test_utils.EmailTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_emails_are_sent_for_feedback_message(self) -> None:
        expected_email_html_body = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: editor message<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: editor message\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.new_user_id, 'a subject', 'some text')
            self.process_and_flush_pending_tasks()

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.editor_id, None, None, 'editor message')
            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_that_emails_are_sent_for_status_change(self) -> None:
        expected_email_html_body = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: changed status from open to fixed<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: changed status from open to fixed\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.new_user_id, 'a subject', 'some text')
            self.process_and_flush_pending_tasks()

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.editor_id,
                feedback_models.STATUS_CHOICES_FIXED, None, '')
            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_that_emails_are_sent_for_both_status_change_and_message(
        self
    ) -> None:
        expected_email_html_body_message = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: editor message<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body_message = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: editor message\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        expected_email_html_body_status = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: changed status from open to fixed<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        expected_email_text_body_status = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: changed status from open to fixed\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                self.new_user_id, 'a subject', 'some text')
            self.process_and_flush_pending_tasks()

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.editor_id,
                feedback_models.STATUS_CHOICES_FIXED, None,
                'editor message')
            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 2)
            self.assertEqual(messages[0].html, expected_email_html_body_status)
            self.assertEqual(messages[0].body, expected_email_text_body_status)
            self.assertEqual(messages[1].html, expected_email_html_body_message)
            self.assertEqual(messages[1].body, expected_email_text_body_message)

    def test_that_emails_are_not_sent_to_anonymous_user(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            # Create thread as anonoymous user.
            feedback_services.create_thread(
                'exploration', self.exploration.id,
                'test_id', 'a subject', 'some text')
            self.process_and_flush_pending_tasks()

            threadlist = feedback_services.get_all_threads(
                'exploration', self.exploration.id, False)
            thread_id = threadlist[0].id

            feedback_services.create_message(
                thread_id, self.editor_id,
                feedback_models.STATUS_CHOICES_FIXED, None,
                'editor message')
            self.process_and_flush_pending_tasks()

            messages = self._get_sent_email_messages(
                self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 0)
