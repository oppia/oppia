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

__author__ = 'Sean Lip'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
import feconf
import test_utils


EXPECTED_THREAD_KEYS = [
    'status', 'original_author_username', 'state_name', 'summary',
    'thread_id', 'subject', 'last_updated']
EXPECTED_MESSAGE_KEYS = [
    'author_username', 'created_on', 'exploration_id', 'message_id',
    'text', 'updated_status', 'updated_subject']


class FeedbackThreadPermissionsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FeedbackThreadPermissionsTests, self).setUp()

        # Load exploration 0.
        self.EXP_ID = '0'
        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

        self.EDITOR_USERNAME = 'editor'
        self.EDITOR_EMAIL = 'editor@example.com'

        # Get the CSRF token and create a single thread with a single message.
        # The corresponding user has already registered as an editor, and has a
        # username.
        self.register_editor(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'state_name': 'Welcome!',
                'subject': 'New subject',
                'text': 'Some text'
            }, self.csrf_token)
        self.logout()

    def test_invalid_exploration_ids_return_empty_threadlist(self):
        response_dict = self.get_json(
            '%s/bad_exp_id' % feconf.FEEDBACK_THREADLIST_URL_PREFIX)
        self.assertEqual(response_dict['threads'], [])

    def test_invalid_thread_ids_return_empty_message_list(self):
        response_dict = self.get_json(
            '%s/%s/bad_thread_id' % (
                feconf.FEEDBACK_THREAD_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response_dict['messages'], [])

    def test_non_logged_in_users_can_view_threads_and_messages(self):
        # Non-logged-in users can see the thread list.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        self.assertEqual(len(response_dict['threads']), 1)
        self.assertDictContainsSubset({
            'status': 'open',
            'state_name': 'Welcome!'
        }, response_dict['threads'][0])

        # Non-logged-in users can see individual messages.
        first_thread_id = response_dict['threads'][0]['thread_id']
        thread_url = '%s/%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, self.EXP_ID, first_thread_id)
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), 1)
        self.assertDictContainsSubset({
            'updated_status': 'open',
            'updated_subject': 'New subject',
            'text': 'Some text'
        }, response_dict['messages'][0])

    def test_non_logged_in_users_cannot_create_threads_and_messages(self):
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'state_name': 'Welcome!',
                'subject': 'New subject',
                'text': 'Some text'
            }, self.csrf_token, expect_errors=True, expected_status_int=401)

        thread_url = '%s/%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, self.EXP_ID, 'dummy_thread_id')

        self.post_json(thread_url, {
            'exploration_id': '0',
            'text': 'New text'
        }, self.csrf_token, expect_errors=True, expected_status_int=401)


class FeedbackThreadIntegrationTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FeedbackThreadIntegrationTests, self).setUp()

        # Load exploration 0.
        self.EXP_ID = '0'
        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

        self.EDITOR_USERNAME = 'editor'
        self.EDITOR_EMAIL = 'editor@example.com'
        self.register_editor(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_create_thread(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': u'Thread Text ¡unicode!',
            }, self.csrf_token)
        self.logout()

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        threadlist = response_dict['threads']
        self.assertEqual(len(threadlist), 1)
        self.assertEqual(
            set(threadlist[0].keys()), set(EXPECTED_THREAD_KEYS))
        self.assertDictContainsSubset({
            'status': 'open',
            'original_author_username': self.EDITOR_USERNAME,
            'state_name': None,
            'subject': u'New Thread ¡unicode!',
        }, threadlist[0])

        thread_url = '%s/%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX,
            self.EXP_ID,
            threadlist[0]['thread_id'])
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), 1)
        self.assertDictContainsSubset({
            'updated_status': 'open',
            'updated_subject': u'New Thread ¡unicode!',
            'text': u'Thread Text ¡unicode!',
        }, response_dict['messages'][0])

    def test_missing_thread_subject_raises_400_error(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        response_dict = self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'text': u'Thread Text ¡unicode!',
            }, self.csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(
            response_dict['error'], 'A thread subject must be specified.')
        self.logout()

    def test_missing_thread_text_raises_400_error(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        response_dict = self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
            }, self.csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'Text for the first message in the thread must be specified.')
        self.logout()

    def test_post_message_to_existing_thread(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)

        # First, create a thread.
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': u'Message 0 ¡unicode!',
            }, self.csrf_token)

        # Then, get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        threadlist = response_dict['threads']
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0]['thread_id']

        # Then, create a new message in that thread.
        thread_url = '%s/%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, self.EXP_ID, thread_id)
        self.post_json(thread_url, {
            'updated_status': None,
            'updated_subject': None,
            'text': 'Message 1'
        }, self.csrf_token)

        # The resulting thread should contain two messages.
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), 2)
        self.assertEqual(
            set(response_dict['messages'][0].keys()),
            set(EXPECTED_MESSAGE_KEYS))
        self.assertDictContainsSubset({
            'author_username': self.EDITOR_USERNAME,
            'exploration_id': self.EXP_ID,
            'message_id': 0,
            'updated_status': 'open',
            'updated_subject': u'New Thread ¡unicode!',
            'text': u'Message 0 ¡unicode!',
        }, response_dict['messages'][0])
        self.assertDictContainsSubset({
            'author_username': self.EDITOR_USERNAME,
            'exploration_id': self.EXP_ID,
            'message_id': 1,
            'updated_status': None,
            'updated_subject': None,
            'text': u'Message 1',
        }, response_dict['messages'][1])

        self.logout()

    def test_no_username_shown_for_nonregistered_users(self):
        NEW_EXP_ID = 'new_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            NEW_EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.EDITOR_ID, exploration)
        rights_manager.publish_exploration(self.EDITOR_ID, NEW_EXP_ID)

        self.login('test@example.com')
        response = self.testapp.get('/create/%s' % NEW_EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, NEW_EXP_ID),
            {
                'state_name': None,
                'subject': 'Test thread',
                'text': 'Test thread text',
            }, self.csrf_token)

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, NEW_EXP_ID))
        threadlist = response_dict['threads']
        self.assertIsNone(threadlist[0]['original_author_username'])

        response_dict = self.get_json('%s/%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, NEW_EXP_ID,
            threadlist[0]['thread_id']))
        self.assertIsNone(response_dict['messages'][0]['author_username'])

        self.logout()

    def test_message_id_assignment_for_multiple_posts_to_same_thread(self):
        # Create a thread for others to post to.
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': 'Message 0',
            }, self.csrf_token)
        self.logout()

        # Get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        thread_id = response_dict['threads'][0]['thread_id']
        thread_url = '%s/%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, self.EXP_ID, thread_id)

        def _get_username(n):
            return 'editor%s' % n

        def _get_email(n):
            return '%s@example.com' % n

        # Generate 10 users.
        NUM_USERS = 10
        for num in range(NUM_USERS):
            username = _get_username(num)
            email = _get_email(num)
            self.register_editor(email, username)

        # Each of these users posts a new message to the same thread.
        for num in range(NUM_USERS):
            self.login(_get_email(num))
            response = self.testapp.get('/create/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)
            self.post_json(thread_url, {
                'text': 'New Message %s' % num
            }, csrf_token)
            self.logout()

        # Get the message list.
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), NUM_USERS + 1)
        # The resulting message list is not sorted. It needs to be sorted
        # by message id.
        response_dict['messages'] = sorted(
            response_dict['messages'], key=lambda x: x['message_id'])

        self.assertEqual(
            response_dict['messages'][0]['author_username'],
            self.EDITOR_USERNAME)
        self.assertEqual(response_dict['messages'][0]['message_id'], 0)
        self.assertEqual(response_dict['messages'][0]['text'], 'Message 0')
        for num in range(NUM_USERS):
            self.assertEqual(
                response_dict['messages'][num + 1]['author_username'],
                _get_username(num))
            self.assertEqual(
                response_dict['messages'][num + 1]['message_id'], num + 1)
            self.assertEqual(
                response_dict['messages'][num + 1]['text'],
                'New Message %s' % num)
