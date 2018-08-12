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

"""Tests for the old feedback controllers."""

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(feedback_models, suggestion_models) = models.Registry.import_models(
    [models.NAMES.feedback, models.NAMES.suggestion])


EXPECTED_THREAD_KEYS = [
    'status', 'original_author_username', 'state_name', 'summary',
    'thread_id', 'subject', 'last_updated', 'message_count']
EXPECTED_MESSAGE_KEYS = [
    'author_username', 'created_on', 'entity_type', 'message_id', 'entity_id',
    'text', 'updated_status', 'updated_subject', 'received_via_email']


class FeedbackThreadPermissionsTests(test_utils.GenericTestBase):

    EXP_ID = '0'

    def setUp(self):
        super(FeedbackThreadPermissionsTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        # Load exploration 0.
        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

        # Get the CSRF token and create a single thread with a single message.
        # The corresponding user has already registered as an editor, and has a
        # username.
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        self.csrf_token = self.get_csrf_token_from_response(response)
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID
        ), {
            'state_name': self._get_unicode_test_string('statename'),
            'subject': self._get_unicode_test_string('subject'),
            'text': self._get_unicode_test_string('text'),
        }, csrf_token=self.csrf_token)
        self.logout()

    def test_invalid_exploration_ids_return_page_not_found(self):
        self.get_json(
            '%s/bad_exp_id' % feconf.FEEDBACK_THREADLIST_URL_PREFIX,
            expect_errors=True, expected_status_int=404)

    def test_invalid_thread_ids_return_400_response(self):
        self.get_json(
            '%s/invalid_thread_id' % feconf.FEEDBACK_THREAD_URL_PREFIX,
            expect_errors=True, expected_status_int=400)

    def test_non_logged_in_users_can_view_threads_and_messages(self):
        # Non-logged-in users can see the thread list.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        self.assertEqual(len(response_dict['feedback_thread_dicts']), 1)
        self.assertDictContainsSubset({
            'status': 'open',
        }, response_dict['feedback_thread_dicts'][0])

        # Non-logged-in users can see individual messages.
        first_thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, first_thread_id)
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), 1)
        self.assertDictContainsSubset({
            'updated_status': 'open',
            'updated_subject': self._get_unicode_test_string('subject'),
            'text': self._get_unicode_test_string('text'),
        }, response_dict['messages'][0])

    def test_non_logged_in_users_cannot_create_threads_and_messages(self):
        self.post_json(
            '%s/%s' % (
                feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'subject': self.UNICODE_TEST_STRING,
                'text': self.UNICODE_TEST_STRING,
            }, csrf_token=self.csrf_token,
            expect_errors=True, expected_status_int=401)

        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            thread_url = '%s/%s' % (
                feconf.FEEDBACK_THREAD_URL_PREFIX, '0.dummy_thread_id')

        self.post_json(
            thread_url, {
                'exploration_id': '0',
                'text': self.UNICODE_TEST_STRING,
            }, csrf_token=self.csrf_token,
            expect_errors=True, expected_status_int=401)


class FeedbackThreadIntegrationTests(test_utils.GenericTestBase):

    EXP_ID = '0'

    def setUp(self):
        super(FeedbackThreadIntegrationTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Load exploration 0.
        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

    def test_create_thread(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'subject': u'New Thread ¡unicode!',
                'text': u'Thread Text ¡unicode!',
            }, csrf_token=csrf_token)
        self.logout()

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        threadlist = response_dict['feedback_thread_dicts']
        self.assertEqual(len(threadlist), 1)
        self.assertEqual(
            set(threadlist[0].keys()), set(EXPECTED_THREAD_KEYS))
        self.assertDictContainsSubset({
            'status': 'open',
            'original_author_username': self.EDITOR_USERNAME,
            'subject': u'New Thread ¡unicode!',
        }, threadlist[0])

        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, threadlist[0]['thread_id'])
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
        csrf_token = self.get_csrf_token_from_response(response)
        response_dict = self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'text': u'Thread Text ¡unicode!',
            }, csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400)
        self.assertEqual(
            response_dict['error'], 'A thread subject must be specified.')
        self.logout()

    def test_missing_thread_text_raises_400_error(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)
        response_dict = self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
            }, csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'Text for the first message in the thread must be specified.')
        self.logout()

    def test_post_message_to_existing_thread(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)

        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            # First, create a thread.
            self.post_json(
                '%s/%s' % (
                    feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                        'state_name': None,
                        'subject': u'New Thread ¡unicode!',
                        'text': u'Message 0 ¡unicode!',
                    }, csrf_token=csrf_token)

            # Then, get the thread id.
            response_dict = self.get_json(
                '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
            threadlist = response_dict['feedback_thread_dicts']
            self.assertEqual(len(threadlist), 1)
            thread_id = threadlist[0]['thread_id']

            # Then, create a new message in that thread.
            thread_url = '%s/%s' % (
                feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
            self.post_json(
                thread_url, {
                    'updated_status': None,
                    'updated_subject': None,
                    'text': 'Message 1'
                }, csrf_token=csrf_token)

            # The resulting thread should contain two messages.
            response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), 2)
        self.assertEqual(
            set(response_dict['messages'][0].keys()),
            set(EXPECTED_MESSAGE_KEYS))
        self.assertDictContainsSubset({
            'author_username': self.EDITOR_USERNAME,
            'message_id': 0,
            'updated_status': 'open',
            'updated_subject': u'New Thread ¡unicode!',
            'text': u'Message 0 ¡unicode!',
        }, response_dict['messages'][0])
        self.assertDictContainsSubset({
            'author_username': self.EDITOR_USERNAME,
            'message_id': 1,
            'updated_status': None,
            'updated_subject': None,
            'text': u'Message 1',
        }, response_dict['messages'][1])

        self.logout()

    def test_no_username_shown_for_logged_out_learners(self):
        new_exp_id = 'new_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exp_id, title='A title', category='A category')
        exp_services.save_new_exploration(self.editor_id, exploration)
        rights_manager.publish_exploration(self.editor, new_exp_id)

        response = self.testapp.get('/create/%s' % new_exp_id)
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            '/explorehandler/give_feedback/%s' % new_exp_id,
            {
                'state_name': None,
                'subject': 'Test thread',
                'feedback': 'Test thread text',
                'include_author': False,
            }, csrf_token=csrf_token)

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, new_exp_id))
        threadlist = response_dict['feedback_thread_dicts']
        self.assertIsNone(threadlist[0]['original_author_username'])

        response_dict = self.get_json('%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, threadlist[0]['thread_id']))
        self.assertIsNone(response_dict['messages'][0]['author_username'])

    def test_message_id_assignment_for_multiple_posts_to_same_thread(self):
        # Create a thread for others to post to.
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': 'Message 0',
            }, csrf_token=csrf_token)
        self.logout()

        # Get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)

        def _get_username(index):
            return 'editor%s' % index

        def _get_email(index):
            return '%s@example.com' % index

        # Generate 10 users.
        num_users = 10
        for num in range(num_users):
            username = _get_username(num)
            email = _get_email(num)
            self.signup(email, username)

        # Each of these users posts a new message to the same thread.
        for num in range(num_users):
            self.login(_get_email(num))
            response = self.testapp.get('/create/%s' % self.EXP_ID)
            csrf_token = self.get_csrf_token_from_response(response)
            self.post_json(
                thread_url, {
                    'text': 'New Message %s' % num
                }, csrf_token=csrf_token)
            self.logout()

        # Get the message list.
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), num_users + 1)
        # The resulting message list is not sorted. It needs to be sorted
        # by message id.
        response_dict['messages'] = sorted(
            response_dict['messages'], key=lambda x: x['message_id'])

        self.assertEqual(
            response_dict['messages'][0]['author_username'],
            self.EDITOR_USERNAME)
        self.assertEqual(response_dict['messages'][0]['message_id'], 0)
        self.assertEqual(response_dict['messages'][0]['text'], 'Message 0')
        for num in range(num_users):
            self.assertEqual(
                response_dict['messages'][num + 1]['author_username'],
                _get_username(num))
            self.assertEqual(
                response_dict['messages'][num + 1]['message_id'], num + 1)
            self.assertEqual(
                response_dict['messages'][num + 1]['text'],
                'New Message %s' % num)


class FeedbackThreadTests(test_utils.GenericTestBase):

    OWNER_EMAIL_1 = 'owner1@example.com'
    OWNER_USERNAME_1 = 'owner1'

    OWNER_EMAIL_2 = 'owner2@example.com'
    OWNER_USERNAME_2 = 'owner2'

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    EXP_ID = 'exp_id'
    EXP_TITLE = 'Exploration title'

    def setUp(self):
        super(FeedbackThreadTests, self).setUp()

        self.signup(self.OWNER_EMAIL_1, self.OWNER_USERNAME_1)
        self.signup(self.OWNER_EMAIL_2, self.OWNER_USERNAME_2)
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.owner_id_1 = self.get_user_id_from_email(self.OWNER_EMAIL_1)
        self.owner_id_2 = self.get_user_id_from_email(self.OWNER_EMAIL_2)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.owner_2 = user_services.UserActionsInfo(self.owner_id_2)

        # Create an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id_1, title=self.EXP_TITLE,
            category='Architecture', language_code='en')

        rights_manager.create_new_exploration_rights(
            self.EXP_ID, self.owner_id_2)
        rights_manager.publish_exploration(self.owner_2, self.EXP_ID)

    def test_feedback_threads_with_suggestions(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
                new_content = exp_domain.SubtitledHtml(
                    'content', 'new content html').to_dict()
                change_cmd = {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'State 1',
                    'new_value': new_content
                }
                suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION, self.EXP_ID, 1,
                    self.user_id, change_cmd, 'sample description', None)
                with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', True):
                    response = self.get_json(
                        '%s/%s' % (
                            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
                    self.assertEquals(response['feedback_thread_dicts'], [])
                    expected_thread_dict = {
                        'original_author_username': self.USER_USERNAME,
                        'status': feedback_models.STATUS_CHOICES_OPEN,
                        'subject': 'sample description'
                    }
                    self.assertDictContainsSubset(
                        expected_thread_dict,
                        response['suggestion_thread_dicts'][0])

                    thread_id = (
                        response['suggestion_thread_dicts'][0]['thread_id'])

                    response = self.get_json(
                        '%s/%s' % (
                            feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id))
                    expected_suggestion_dict = {
                        'suggestion_type': (
                            suggestion_models
                            .SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                        'target_type': (
                            suggestion_models.TARGET_TYPE_EXPLORATION),
                        'target_id': self.EXP_ID,
                        'status': suggestion_models.STATUS_IN_REVIEW,
                        'author_name': self.USER_USERNAME
                    }
                    self.assertDictContainsSubset(
                        expected_suggestion_dict, response['suggestion'])
