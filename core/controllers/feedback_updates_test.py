# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Tests for the feedback updates."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class FeedbackUpdatesHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = 'EXP_ID_1'
    EXP_TITLE_1 = 'Exploration title 1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_get_threads_after_updating_thread_summaries(self) -> None:
        self.login(self.OWNER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': []},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        self.assertEqual(thread_summaries, [])

        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        feedback_services.create_thread(
            'exploration', self.EXP_ID_1, self.owner_id, 'a subject',
            'some text')

        response = self.post_json(
            feconf.FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': []},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)

        self.assertEqual(len(response['paginated_threads_list']), 0)
        self.assertEqual(len(thread_summaries), 1)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(thread_summaries[0]['last_message_text'], 'some text')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject')
        self.assertEqual(thread.entity_type, 'exploration')
        self.logout()

    def test_get_more_threads_on_request(self) -> None:
        self.login(self.OWNER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id, title=self.EXP_TITLE_1)
        for i in range(190):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, self.owner_id, 'a subject %s' % i,
                'some text %s' % i)

        response = self.post_json(
            feconf.FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': []},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)
        paginated_threads_list = response['paginated_threads_list']

        self.assertEqual(len(paginated_threads_list), 1)
        self.assertEqual(len(paginated_threads_list[0]), 90)
        self.assertEqual(len(thread_summaries), 100)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(
            thread_summaries[0]['last_message_text'], 'some text 0')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject 0')
        self.assertEqual(thread.entity_type, 'exploration')

        response = self.post_json(
            feconf.FEEDBACK_UPDATES_DATA_URL,
            {'paginated_threads_list': paginated_threads_list},
            csrf_token=csrf_token,
            expected_status_int=200)
        thread_summaries = response['thread_summaries']
        thread_id = thread_summaries[0]['thread_id']
        thread = feedback_services.get_thread(thread_id)
        paginated_threads_list = response['paginated_threads_list']

        self.assertEqual(len(response['paginated_threads_list']), 0)
        self.assertEqual(len(thread_summaries), 90)
        self.assertEqual(thread_summaries[0]['total_message_count'], 1)
        self.assertEqual(
            thread_summaries[0]['exploration_title'], self.EXP_TITLE_1)
        self.assertEqual(thread_summaries[0]['exploration_id'], self.EXP_ID_1)
        self.assertEqual(
            thread_summaries[0]['last_message_text'], 'some text 100')
        self.assertEqual(
            thread_summaries[0]['original_author_id'], self.owner_id)
        self.assertEqual(thread.subject, 'a subject 100')
        self.assertEqual(thread.entity_type, 'exploration')
        self.logout()


class FeedbackThreadHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = '0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        # Load exploration 0.
        exp_services.load_demo(self.EXP_ID_1)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        # Get the CSRF token and create a single thread with a single message.
        self.login(self.EDITOR_EMAIL)
        self.csrf_token = self.get_new_csrf_token()
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1
        ), {
            'subject': self._get_unicode_test_string('subject'),
            'text': 'a sample message',
        }, csrf_token=self.csrf_token)
        self.logout()

    def test_get_message_summaries(self) -> None:
        self.login(self.EDITOR_EMAIL)
        # Fetch all the feedback threads of that exploration.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1))

        # Get the id of the thread.
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # Get the message summary of the thread.
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_UPDATES_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list']
        first_message = messages_summary[0]

        self.assertDictContainsSubset({
            'text': 'a sample message',
            'author_username': 'editor'
        }, first_message)

        # Add another message.
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 1'
            }, csrf_token=self.csrf_token)

        # Again fetch the thread message summary.
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_UPDATES_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list']

        # Check the summary of the second message.
        self.assertEqual(len(messages_summary), 2)
        second_message = messages_summary[1]
        self.assertDictContainsSubset({
            'text': 'Message 1',
            'author_username': 'editor'
        }, second_message)

        self.logout()

    def test_anonymous_feedback_is_recorded_correctly(self) -> None:
        self.post_json(
            '/explorehandler/give_feedback/%s' % self.EXP_ID_1,
            {
                'feedback': 'This is an anonymous feedback message.',
            }
        )

        self.login(self.EDITOR_EMAIL)
        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # Get the message summary of the thread.
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_UPDATES_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]

        self.assertEqual(messages_summary['author_username'], None)

    def test_raises_error_if_wrong_type_of_suggestion_provided(self) -> None:
        self.login(self.EDITOR_EMAIL)

        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p>This is a content.</p>',
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
        }
        translation_suggestion = suggestion_registry.SuggestionTranslateContent(
            'exploration.exp1.thread1', 'exp1',
            1, suggestion_models.STATUS_ACCEPTED, 'author',
            'review_id', change_dict, 'translation.Algebra',
            'en', False, datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        )

        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_UPDATES_THREAD_DATA_URL, thread_id)
        with self.swap_to_always_return(
            suggestion_services, 'get_suggestion_by_id', translation_suggestion
        ):
            with self.assertRaisesRegex(
                Exception,
                'No edit state content suggestion found for the given '
                'thread_id: %s' % thread_id
            ):
                self.get_json(thread_url)

    def test_get_suggestions_after_updating_suggestion_summary(self) -> None:
        self.login(self.EDITOR_EMAIL)

        response_dict = self.get_json(
            '%s/%s' %
            (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID_1)
        )
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_UPDATES_THREAD_DATA_URL, thread_id)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]

        self.assertEqual(
            messages_summary['author_username'], self.EDITOR_USERNAME)
        self.assertFalse(messages_summary.get('suggestion_html'))
        self.assertFalse(messages_summary.get('current_content_html'))
        self.assertFalse(messages_summary.get('description'))

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change_cmd: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Welcome!',
            'new_value': new_content
        }

        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID_1, 1,
            suggestion_models.STATUS_IN_REVIEW, self.editor_id, None,
            change_cmd, 'score category', thread_id, None)

        suggestion_thread = feedback_services.get_thread(thread_id)
        suggestion = suggestion_services.get_suggestion_by_id(thread_id)
        exploration = exp_fetchers.get_exploration_by_id(self.EXP_ID_1)
        current_content_html = (
            exploration.states[
                suggestion.change_cmd.state_name].content.html)
        response_dict = self.get_json(thread_url)
        messages_summary = response_dict['message_summary_list'][0]
        first_suggestion = feedback_services.get_messages(thread_id)[0]

        self.assertEqual(
            messages_summary['author_username'], self.EDITOR_USERNAME)
        self.assertEqual(
            utils.get_time_in_millisecs(first_suggestion.created_on),
            messages_summary['created_on_msecs'])
        self.assertEqual(
            messages_summary['suggestion_html'], '<p>new content html</p>')
        self.assertEqual(
            messages_summary['current_content_html'], current_content_html)
        self.assertEqual(
            messages_summary['description'], suggestion_thread.subject)
        self.logout()
