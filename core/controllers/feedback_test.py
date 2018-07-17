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

"""Tests for the feedback controllers."""

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
    'author_username', 'created_on', 'exploration_id', 'message_id',
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
        }, self.csrf_token)
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
        self.assertEqual(len(response_dict['threads']), 1)
        self.assertDictContainsSubset({
            'status': 'open',
            'state_name': self._get_unicode_test_string('statename'),
        }, response_dict['threads'][0])

        # Non-logged-in users can see individual messages.
        first_thread_id = response_dict['threads'][0]['thread_id']
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
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID
        ), {
            'state_name': 'Welcome!',
            'subject': self.UNICODE_TEST_STRING,
            'text': self.UNICODE_TEST_STRING,
        }, self.csrf_token, expect_errors=True, expected_status_int=401)

        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, '0.dummy_thread_id')

        self.post_json(
            thread_url, {
                'exploration_id': '0',
                'text': self.UNICODE_TEST_STRING,
            }, self.csrf_token, expect_errors=True, expected_status_int=401)


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
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': u'Thread Text ¡unicode!',
            }, csrf_token)
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
            }, csrf_token, expect_errors=True, expected_status_int=400)
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
            }, csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'Text for the first message in the thread must be specified.')
        self.logout()

    def test_post_message_to_existing_thread(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)

        # First, create a thread.
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': u'Message 0 ¡unicode!',
            }, csrf_token)

        # Then, get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        threadlist = response_dict['threads']
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0]['thread_id']

        # Then, create a new message in that thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 1'
            }, csrf_token)

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
            }, csrf_token)

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, new_exp_id))
        threadlist = response_dict['threads']
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
            }, csrf_token)
        self.logout()

        # Get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        thread_id = response_dict['threads'][0]['thread_id']
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
                }, csrf_token)
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

    def _get_messages_read_by_user(self, user_id, thread_id):
        feedback_thread_user_model = (
            feedback_models.FeedbackThreadUserModel.get(
                user_id, thread_id))

        return (
            feedback_thread_user_model.message_ids_read_by_user
            if feedback_thread_user_model else [])

    def _get_message_ids_in_a_thread(self, thread_id):
        messages = feedback_services.get_messages(thread_id)

        return [message.message_id for message in messages]

    def test_feedback_threads(self):
        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID
        ), {
            'state_name': 'statename',
            'subject': 'subject',
            'text': 'a sample message',
        }, csrf_token)

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))

        # Get the id of the thread.
        thread_id = response_dict['threads'][0]['thread_id']

        # This user created the thread. The message should be there in
        # his/her read list.
        self.assertEqual(
            self._get_messages_read_by_user(
                self.user_id, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

        self.login(self.OWNER_EMAIL_1)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        # The owner opens the feedback thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response_dict = self.get_json(thread_url)

        # The message should be added to the read list of the owner.
        self.assertEqual(
            self._get_messages_read_by_user(self.owner_id_1, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        # Now the owner adds a message to the feedback thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 1'
            }, csrf_token)

        # Both the messages in the thread should have been read by the user.
        self.assertEqual(
            self._get_messages_read_by_user(
                self.owner_id_1, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

        self.login(self.USER_EMAIL)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        # The user opens the feedback thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response_dict = self.get_json(thread_url)

        # All the messages should have been read by the user.
        self.assertEqual(
            self._get_messages_read_by_user(self.user_id, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        # User adds another message.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 2'
            }, csrf_token)

        # Check if the new message is also added to the read list.
        self.assertEqual(
            self._get_messages_read_by_user(self.user_id, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

        # Another owner logs in.
        self.login(self.OWNER_EMAIL_2)
        response = self.testapp.get(feconf.LIBRARY_INDEX_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        # The second owner opens the feedback thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response_dict = self.get_json(thread_url)

        # All the messages should be added to the read-by list.
        self.assertEqual(
            self._get_messages_read_by_user(self.owner_id_2, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

    def test_feedback_threads_with_suggestions(self):
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
                '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
            self.assertEquals(response['threads'], [])
            expected_thread_dict = {
                'original_author_username': self.USER_USERNAME,
                'status': feedback_models.STATUS_CHOICES_OPEN,
                'subject': 'sample description'
            }
            self.assertDictContainsSubset(
                expected_thread_dict,
                response['threads_with_suggestions'][0])

            thread_id = (
                response['threads_with_suggestions'][0]['thread_id'])

            response = self.get_json(
                '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id))
            expected_suggestion_dict = {
                'suggestion_type': (
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
                'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
                'target_id': self.EXP_ID,
                'status': suggestion_models.STATUS_IN_REVIEW,
                'author_name': self.USER_USERNAME
            }
            self.assertDictContainsSubset(
                expected_suggestion_dict, response['suggestion'])


class SuggestionsIntegrationTests(test_utils.GenericTestBase):

    EXP_ID = '0'
    TRANSLATION_LANGUAGE_CODE = 'en'

    def setUp(self):
        super(SuggestionsIntegrationTests, self).setUp()

        # Register users.
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id,
            title='Exploration for suggestions',
            category='This is just a test category',
            objective='Test a suggestion.')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['State A', 'State 2', 'State 3'])
        exploration.states['State A'].update_interaction_id('TextInput')
        # Create content in State A with a single audio subtitle.
        content_id = exploration.states['State A'].content.content_id
        exploration.states['State A'].update_content(
            exp_domain.SubtitledHtml(content_id, 'old content').to_dict())
        exploration.states['State A'].update_content_ids_to_audio_translations({
            content_id: {
                self.TRANSLATION_LANGUAGE_CODE: exp_domain.AudioTranslation(
                    'filename.mp3', 20, False).to_dict()
            },
            'default_outcome': {}
        })
        exploration.states['State 2'].update_interaction_id('TextInput')
        exploration.states['State 3'].update_interaction_id('TextInput')
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access
        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_manager.ROLE_EDITOR)

        response = self.testapp.get('/explore/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)

        # Create suggestions.
        self.post_json(
            '%s/%s' % (feconf.SUGGESTION_URL_PREFIX, self.EXP_ID), {
                'exploration_version': 3,
                'state_name': u'State A',
                'description': u'Suggestion for state A.',
                'suggestion_html': 'new accepted suggestion for state A',
            }, csrf_token)
        self.post_json(
            '%s/%s' % (feconf.SUGGESTION_URL_PREFIX, self.EXP_ID), {
                'exploration_version': 1,
                'state_name': u'State 2',
                'description': u'A new value.',
                'suggestion_html': 'some new value',
            }, csrf_token)
        self.post_json(
            '%s/%s' % (feconf.SUGGESTION_URL_PREFIX, self.EXP_ID), {
                'exploration_version': 2,
                'state_name': u'State 3',
                'description': u'Empty suggestion',
                'suggestion_html': '',
            }, csrf_token)
        self.post_json(
            '%s/%s' % (feconf.SUGGESTION_URL_PREFIX, self.EXP_ID), {
                'exploration_version': 2,
                'state_name': u'State A',
                'description': u'Just a space.',
                'suggestion_html': ' ',
            }, csrf_token)
        self.post_json(
            '%s/%s' % (feconf.SUGGESTION_URL_PREFIX, self.EXP_ID), {
                'exploration_version': 1,
                'state_name': u'State 2',
                'description': u'Random characters.',
                'suggestion_html': '#!$%',
            }, csrf_token)
        self.post_json(
            '%s/%s' % (feconf.SUGGESTION_URL_PREFIX, self.EXP_ID), {
                'exploration_version': 2,
                'state_name': u'State 3',
                'description': u'Very bizarre characters.',
                'suggestion_html': u'Ֆݓॵক',
            }, csrf_token)
        self.logout()

    def _return_true(self, unused_thread_id, unused_exploration_id):
        return True

    def _return_null(self, *unused_args):
        return None

    def test_create_and_fetch_suggestions(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/create/%s' % self.EXP_ID))

        # Create a thread without suggestions.
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'state_name': None,
                'subject': u'New Thread ¡unicode!',
                'text': 'Message 0'}, csrf_token)

        # Get a list of open threads without suggestions.
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID,
                'open', 'false'))
        self.assertEqual(len(response_dict['threads']), 1)

        # Get a list of all threads with suggestions.
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'all', 'true'))
        threads = response_dict['threads']
        self.assertEqual(len(threads), 6)

        # Get a suggestion.
        thread_id = threads[0]['thread_id']
        with self.swap(constants, 'USE_NEW_SUGGESTION_FRAMEWORK', False):
            response_dict = self.get_json(
                '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id))

        # Suggestion description should be the same as thread subject.
        self.assertEqual(
            response_dict['suggestion']['description'],
            threads[0]['subject'])

        # Get a list of all threads without suggestions.
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'all',
                'false'))
        threads = response_dict['threads']
        self.assertEqual(len(threads), 1)

        # Test invalid list type in GET request. We are using testapp.get()
        # here because get_json() with expect_errors=True does not work as
        # expected. Please look at the doc string for get_json() for details.
        response_dict = self.testapp.get(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'invalid',
                'true'),
            status=400, expect_errors=True)
        self.assertEqual(response_dict.status_int, 400)

        # Pass invalid value for has_suggestion.
        response_dict = self.testapp.get(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'closed',
                'invalid'),
            status=400, expect_errors=True)
        self.assertEqual(response_dict.status_int, 400)

    def _accept_suggestion(
            self, thread_id, audio_update_required, csrf_token,
            expect_errors=False, expected_status_int=200):
        with self.swap(
            exp_domain.Exploration, '_verify_all_states_reachable',
            self._return_null):
            with self.swap(
                exp_domain.Exploration, '_verify_no_dead_ends',
                self._return_null):
                url = '%s/%s/%s' % (
                    feconf.SUGGESTION_ACTION_URL_PREFIX, self.EXP_ID,
                    thread_id)
                return self.put_json(
                    url, {
                        'action': u'accept',
                        'commit_message': 'message',
                        'audio_update_required': audio_update_required,
                    }, csrf_token, expect_errors=expect_errors,
                    expected_status_int=expected_status_int)

    def _reject_suggestion(
            self, thread_id, csrf_token,
            expect_errors=False, expected_status_int=200):
        return self.put_json(
            '%s/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, self.EXP_ID, thread_id),
            {'action': u'reject'}, csrf_token, expect_errors=expect_errors,
            expected_status_int=expected_status_int)

    def test_actions_related_to_suggestions(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/create/%s' % self.EXP_ID))
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'all', 'true'))

        threads = response_dict['threads']
        accepted_suggestion_thread_id = threads[0]['thread_id']
        rejected_suggestion_thread_id = threads[1]['thread_id']
        unsuccessful_accept_thread_id = threads[2]['thread_id']

        self.assertEqual(threads[0]['subject'], 'Suggestion for state A.')
        self.assertEqual(threads[1]['subject'], 'A new value.')
        self.assertEqual(threads[2]['subject'], 'Empty suggestion')

        # Accept a suggestion.
        self._accept_suggestion(
            accepted_suggestion_thread_id, False, csrf_token)
        updated_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(
            updated_exploration.states['State A'].content.html,
            u'new accepted suggestion for state A')

        # Reject a suggestion.
        self._reject_suggestion(rejected_suggestion_thread_id, csrf_token)

        # Get a list of closed threads with suggestion.
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'closed',
                'true'))
        self.assertEqual(len(response_dict['threads']), 2)

        response_dict = self.put_json(
            '%s/%s/%s' % (
                feconf.SUGGESTION_ACTION_URL_PREFIX, self.EXP_ID,
                rejected_suggestion_thread_id),
            {'action': u'invalid'}, csrf_token, expect_errors=True,
            expected_status_int=400)
        self.assertIn('Invalid action.', response_dict['error'])

        # Editor tries to accept rejected suggestion.
        exception_msg = 'Suggestion has already been accepted/rejected.'
        response_dict = self._accept_suggestion(
            rejected_suggestion_thread_id, False, csrf_token,
            expect_errors=True, expected_status_int=500)
        self.assertIn(exception_msg, response_dict['error'])

        # Editor tries to reject accepted suggestion.
        response_dict = self._reject_suggestion(
            rejected_suggestion_thread_id, csrf_token,
            expect_errors=True, expected_status_int=500)
        self.assertIn(exception_msg, response_dict['error'])
        self.logout()

        # Different editor tries to accept rejected suggestion.
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/create/%s' % self.EXP_ID))
        response_dict = self._accept_suggestion(
            rejected_suggestion_thread_id, False, csrf_token,
            expect_errors=True, expected_status_int=500)
        self.assertIn(exception_msg, response_dict['error'])

        # Different editor tries to reject accepted suggestion.
        response_dict = self._reject_suggestion(
            rejected_suggestion_thread_id, csrf_token,
            expect_errors=True, expected_status_int=500)
        self.assertIn(exception_msg, response_dict['error'])
        self.logout()

        # User(non editor) tries to accept a suggestion.
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get('/create/%s' % self.EXP_ID)
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self._accept_suggestion(
            unsuccessful_accept_thread_id, False, csrf_token,
            expect_errors=True, expected_status_int=401)
        self.assertIn(
            'You do not have credentials',
            response_dict['error'])
        self.logout()

        # Get a list of all closed threads with suggestion.
        self.login(self.EDITOR_EMAIL)
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'closed',
                'true'))
        threads = response_dict['threads']
        self.assertEqual(len(threads), 2)

        # Get a list of all open threads with suggestion.
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'open',
                'true'))
        threads = response_dict['threads']
        self.assertEqual(len(threads), 4)

    def test_accept_suggestion_without_audio_update(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/create/%s' % self.EXP_ID))
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'all', 'true'))
        threads = response_dict['threads']
        accepted_suggestion_thread_id = threads[0]['thread_id']
        self.assertEqual(threads[0]['subject'], 'Suggestion for state A.')

        # Accept a suggestion.
        self._accept_suggestion(
            accepted_suggestion_thread_id, False, csrf_token)
        updated_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        content_id = updated_exploration.states['State A'].content.content_id
        audio_translations = (
            updated_exploration.states['State A']
            .content_ids_to_audio_translations[content_id])
        self.assertEqual(
            audio_translations.keys(), [self.TRANSLATION_LANGUAGE_CODE])
        self.assertFalse(
            audio_translations[self.TRANSLATION_LANGUAGE_CODE].needs_update)

    def test_accept_suggestion_requiring_audio_update(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/create/%s' % self.EXP_ID))
        response_dict = self.get_json(
            '%s/%s?list_type=%s&has_suggestion=%s' % (
                feconf.SUGGESTION_LIST_URL_PREFIX, self.EXP_ID, 'all', 'true'))
        threads = response_dict['threads']
        accepted_suggestion_thread_id = threads[0]['thread_id']
        self.assertEqual(threads[0]['subject'], 'Suggestion for state A.')

        # Accept a suggestion.
        self._accept_suggestion(
            accepted_suggestion_thread_id, True, csrf_token)
        updated_exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        content_id = updated_exploration.states['State A'].content.content_id
        audio_translations = (
            updated_exploration.states['State A']
            .content_ids_to_audio_translations[content_id])
        self.assertEqual(
            audio_translations.keys(), [self.TRANSLATION_LANGUAGE_CODE])
        self.assertTrue(
            audio_translations[self.TRANSLATION_LANGUAGE_CODE].needs_update)
