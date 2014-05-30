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

from core.domain import exp_services
import feconf
import test_utils


class FeedbackThreadPermissionsTests(test_utils.GenericTestBase):

    def setUp(self):
        # TODO(sll): Remove this.
        feconf.SHOW_FEEDBACK_TAB = True

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
        self.post_json('%s/%s' % (feconf.THREADLIST_URL_PREFIX, self.EXP_ID), {
           'state_name': 'Welcome!',
           'subject': 'New subject',
           'text': 'Some text'
        }, self.csrf_token)
        self.logout()

    def test_invalid_exploration_ids_return_empty_threadlist(self):
        response_dict = self.get_json(
            '%s/bad_exp_id' % feconf.THREADLIST_URL_PREFIX)
        self.assertEqual(response_dict['threads'], [])

    def test_invalid_thread_ids_return_empty_message_list(self):
        response_dict = self.get_json(
            '%s/bad_thread_id' % feconf.THREAD_URL_PREFIX)
        self.assertEqual(response_dict['messages'], [])

    def test_non_logged_in_users_can_view_threads_and_messages(self):
        # Non-logged-in users can see the thread list.
        response_dict = self.get_json(
            '%s/%s' % (feconf.THREADLIST_URL_PREFIX, self.EXP_ID))
        self.assertEqual(len(response_dict['threads']), 1)
        self.assertDictContainsSubset({
            'status': 'open',
            'state_name': 'Welcome!'
        }, response_dict['threads'][0])

        # Non-logged-in users can see individual messages.
        first_thread_id = response_dict['threads'][0]['thread_id']
        response_dict = self.get_json(
            '%s/%s' % (feconf.THREAD_URL_PREFIX, first_thread_id))
        self.assertEqual(len(response_dict['messages']), 1)
        self.assertDictContainsSubset({
            'updated_status': 'open',
            'updated_subject': 'New subject',
            'text': 'Some text'
        }, response_dict['messages'][0])

    def test_non_logged_in_users_cannot_create_threads_and_messages(self):
        self.post_json('%s/%s' % (feconf.THREADLIST_URL_PREFIX, self.EXP_ID), {
            'state_name': 'Welcome!',
            'subject': 'New subject',
            'text': 'Some text'
        }, self.csrf_token, expect_errors=True, expected_status_int=401)

        self.post_json(
            '%s/%s' % (feconf.THREAD_URL_PREFIX, 'dummy_thread_id'),
            {
                'exploration_id': '0',
                'text': 'New text'
            }, self.csrf_token, expect_errors=True, expected_status_int=401)

    def test_feedback_handlers_do_not_expose_user_ids(self):
        pass

    def test_anonymous_posting_leads_to_no_username_shown(self):
        pass

    def test_usernames_are_sent_in_response_dict(self):
        pass

    def test_missing_subject_raises_400_error(self):
        pass

    def test_missing_text_raises_400_error(self):
        pass
