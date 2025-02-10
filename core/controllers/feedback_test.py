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

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Callable, Dict, Final, List, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])


EXPECTED_THREAD_KEYS: Final = [
    'status', 'original_author_username', 'state_name', 'summary',
    'thread_id', 'subject', 'last_updated_msecs', 'message_count',
    'last_nonempty_message_text', 'last_nonempty_message_author']
EXPECTED_MESSAGE_KEYS: Final = [
    'author_username', 'created_on_msecs', 'entity_type', 'message_id',
    'entity_id', 'text', 'updated_status', 'updated_subject']


class FeedbackThreadPermissionsTests(test_utils.GenericTestBase):

    EXP_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        # Load exploration 0.
        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

        # Get the CSRF token and create a single thread with a single message.
        # The corresponding user has already registered as an editor, and has a
        # username.
        self.login(self.EDITOR_EMAIL)
        self.csrf_token = self.get_new_csrf_token()
        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID
        ), {
            'subject': self._get_unicode_test_string('subject'),
            'text': self._get_unicode_test_string('text'),
        }, csrf_token=self.csrf_token)
        self.logout()

    def test_invalid_exploration_ids_return_page_not_found(self) -> None:
        self.get_json(
            '%s/bad_exp_id' % feconf.FEEDBACK_THREADLIST_URL_PREFIX,
            expected_status_int=404)

    def test_invalid_thread_ids_return_400_response(self) -> None:
        self.get_json(
            '%s/invalid_thread_id' % feconf.FEEDBACK_THREAD_URL_PREFIX,
            expected_status_int=400)

    def test_non_logged_in_users_can_view_threads_and_messages(self) -> None:
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

    def test_non_logged_in_users_cannot_create_threads_and_messages(
        self
    ) -> None:
        self.post_json(
            '%s/%s' % (
                feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'subject': self.UNICODE_TEST_STRING,
                'text': self.UNICODE_TEST_STRING,
            }, csrf_token=self.csrf_token, expected_status_int=401)

        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, 'exploration.0.dummy_thread_id')

        self.post_json(
            thread_url, {
                'exploration_id': '0',
                'text': self.UNICODE_TEST_STRING,
            }, csrf_token=self.csrf_token, expected_status_int=401)


class FeedbackThreadIntegrationTests(test_utils.GenericTestBase):

    EXP_ID: Final = '0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.get_user_actions_info(self.editor_id)

        # Load exploration 0.
        exp_services.delete_demo(self.EXP_ID)
        exp_services.load_demo(self.EXP_ID)

    def test_create_thread(self) -> None:
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'subject': 'New Thread ¡unicode!',
                'text': 'Thread Text ¡unicode!',
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
            'subject': 'New Thread ¡unicode!',
        }, threadlist[0])

        thread_url = '%s/%s' % (
            feconf.FEEDBACK_THREAD_URL_PREFIX, threadlist[0]['thread_id'])
        response_dict = self.get_json(thread_url)
        self.assertEqual(len(response_dict['messages']), 1)
        self.assertDictContainsSubset({
            'updated_status': 'open',
            'updated_subject': 'New Thread ¡unicode!',
            'text': 'Thread Text ¡unicode!',
        }, response_dict['messages'][0])

    def test_missing_thread_subject_raises_400_error(self) -> None:
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'text': 'Thread Text ¡unicode!',
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/threadlisthandler/0\' '
            'these errors are happening:\n'
            'Missing key in handler args: subject.'
        )
        self.logout()

    def test_missing_thread_text_raises_400_error(self) -> None:
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID),
            {
                'subject': 'New Thread ¡unicode!',
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/threadlisthandler/0\' '
            'these errors are happening:\n'
            'Missing key in handler args: text.'
        )
        self.logout()

    def test_post_message_to_existing_thread(self) -> None:
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # First, create a thread.
        self.post_json(
            '%s/%s' % (
                feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                    'subject': 'New Thread ¡unicode!',
                    'text': 'Message 0 ¡unicode!',
                }, csrf_token=csrf_token)

        # Then, get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        threadlist = response_dict['feedback_thread_dicts']
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0]['thread_id']

        # Then, create a new message in that thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response_dict = self.post_json(
            thread_url, {
                'updated_status': None,
                'updated_subject': None,
                'text': 'Message 1'
            }, csrf_token=csrf_token)

        self.assertEqual(len(response_dict['messages']), 2)
        self.assertEqual(
            set(response_dict['messages'][0].keys()),
            set(EXPECTED_MESSAGE_KEYS))
        self.assertDictContainsSubset({
            'author_username': self.EDITOR_USERNAME,
            'entity_id': self.EXP_ID,
            'message_id': 0,
            'updated_status': 'open',
            'updated_subject': 'New Thread ¡unicode!',
            'text': 'Message 0 ¡unicode!',
        }, response_dict['messages'][0])
        self.assertDictContainsSubset({
            'author_username': self.EDITOR_USERNAME,
            'entity_id': self.EXP_ID,
            'message_id': 1,
            'updated_status': None,
            'updated_subject': None,
            'text': 'Message 1',
        }, response_dict['messages'][1])

        self.logout()

    def test_no_username_shown_for_logged_out_learners(self) -> None:
        new_exp_id = 'new_eid'
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exp_id, title='A title', category='A category')
        exp_services.save_new_exploration(self.editor_id, exploration)
        rights_manager.publish_exploration(self.editor, new_exp_id)

        csrf_token = self.get_new_csrf_token()
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

    def test_message_id_assignment_for_multiple_posts_to_same_thread(
        self
    ) -> None:
        # Create a thread for others to post to.
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID), {
                'subject': 'New Thread ¡unicode!',
                'text': 'Message 0',
            }, csrf_token=csrf_token)
        self.logout()

        # Get the thread id.
        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)

        def _get_username(index: int) -> str:
            """Returns a dummy username, parameterized by the given index.

            Args:
                index: int. The index to append to the username.

            Returns:
                str. A dummy username corresponding to the given index.
            """
            return 'editor%s' % index

        def _get_email(index: int) -> str:
            """Returns a dummy email, parameterized by the given index.

            Args:
                index: int. The index to use in the email.

            Returns:
                str. A dummy email corresponding to the given index.
            """
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
            csrf_token = self.get_new_csrf_token()
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
        sort_func: Callable[[Dict[str, str]], str] = lambda x: x['message_id']
        response_dict['messages'] = sorted(
            response_dict['messages'], key=sort_func)

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

    OWNER_EMAIL_1: Final = 'owner1@example.com'
    OWNER_USERNAME_1: Final = 'owner1'

    OWNER_EMAIL_2: Final = 'owner2@example.com'
    OWNER_USERNAME_2: Final = 'owner2'

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    EXP_ID: Final = 'exp_id'
    EXP_TITLE: Final = 'Exploration title'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL_1, self.OWNER_USERNAME_1)
        self.signup(self.OWNER_EMAIL_2, self.OWNER_USERNAME_2)
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.owner_id_1 = self.get_user_id_from_email(self.OWNER_EMAIL_1)
        self.owner_id_2 = self.get_user_id_from_email(self.OWNER_EMAIL_2)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.owner_2 = user_services.get_user_actions_info(self.owner_id_2)

        # Create an exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id_1, title=self.EXP_TITLE,
            category='Architecture', language_code='en')

        rights_manager.create_new_exploration_rights(
            self.EXP_ID, self.owner_id_2)
        rights_manager.publish_exploration(self.owner_2, self.EXP_ID)

    def _get_messages_read_by_user(
        self, user_id: str, thread_id: str
    ) -> List[int]:
        """Gets the ids of messages in the thread read by the user corresponding
        to the given user id.
        """
        feedback_thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get(
                user_id, thread_id))

        if feedback_thread_user_model:
            user_ids: List[int] = (
                feedback_thread_user_model.message_ids_read_by_user
            )
            return user_ids
        else:
            return []

    def _get_message_ids_in_a_thread(self, thread_id: str) -> List[int]:
        """Gets the ids of messages in the thread corresponding to the given
        thread id.
        """
        messages = feedback_services.get_messages(thread_id)

        return [message.message_id for message in messages]

    def test_feedback_threads(self) -> None:
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json('%s/%s' % (
            feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID
        ), {
            'subject': 'subject',
            'text': 'a sample message',
        }, csrf_token=csrf_token)

        response_dict = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_THREADLIST_URL_PREFIX, self.EXP_ID))

        # Get the id of the thread.
        thread_id = response_dict['feedback_thread_dicts'][0]['thread_id']

        # This user created the thread. The message should be there in
        # his/her read list.
        self.assertEqual(
            self._get_messages_read_by_user(
                self.user_id, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

        self.login(self.OWNER_EMAIL_1)
        csrf_token = self.get_new_csrf_token()

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
            }, csrf_token=csrf_token)

        # Both the messages in the thread should have been read by the user.
        self.assertEqual(
            self._get_messages_read_by_user(
                self.owner_id_1, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

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
            }, csrf_token=csrf_token)

        # Check if the new message is also added to the read list.
        self.assertEqual(
            self._get_messages_read_by_user(self.user_id, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

        # Another owner logs in.
        self.login(self.OWNER_EMAIL_2)
        csrf_token = self.get_new_csrf_token()

        # The second owner opens the feedback thread.
        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response_dict = self.get_json(thread_url)

        # All the messages should be added to the read-by list.
        self.assertEqual(
            self._get_messages_read_by_user(self.owner_id_2, thread_id),
            self._get_message_ids_in_a_thread(thread_id))

        self.logout()

    def test_post_feedback_threads_with_no_text_and_no_updated_status_raise_400(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL_1)
        csrf_token = self.get_new_csrf_token()

        thread_id = feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, self.owner_id_1,
            'a subject', 'some text')

        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response = self.post_json(
            thread_url, {
                'text': None,
                'updated_subject': None,
                'updated_status': None
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertIn(
            'Missing key in handler args: text.',
            response['error'],
        )

        self.logout()

    def test_post_feedback_threads_with_updated_suggestion_status_raises_400(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL_1)
        csrf_token = self.get_new_csrf_token()

        new_content = state_domain.SubtitledHtml(
            'content', '<p>new content html</p>').to_dict()
        change: Dict[str, Union[str, state_domain.SubtitledHtmlDict]] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Welcome!',
            'new_value': new_content
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 1,
            self.owner_id_1, change, 'sample description')

        thread_id = suggestion_services.query_suggestions(
            [('author_id', self.owner_id_1),
             ('target_id', self.EXP_ID)])[0].suggestion_id

        thread_url = '%s/%s' % (feconf.FEEDBACK_THREAD_URL_PREFIX, thread_id)
        response = self.post_json(
            thread_url, {
                'text': 'Message 1',
                'updated_subject': None,
                'updated_status': 'open'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Suggestion thread status cannot be changed manually.')

        self.logout()


class ThreadListHandlerForTopicsHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.OWNER_USERNAME])

        self.topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.topic_id, self.owner_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

    def test_get_feedback_threads_linked_to_topics(self) -> None:
        self.login(self.OWNER_EMAIL)

        response_dict = self.get_json(
            '%s/%s' % (
                feconf.FEEDBACK_THREADLIST_URL_PREFIX_FOR_TOPICS,
                self.topic_id))
        suggestion_thread_dicts = response_dict[
            'suggestion_thread_dicts']

        self.assertEqual(suggestion_thread_dicts, [])

        feedback_services.create_thread(
            feconf.ENTITY_TYPE_TOPIC, self.topic_id, self.owner_id,
            'a subject', 'some text', has_suggestion=True)

        response_dict = self.get_json(
            '%s/%s' % (
                feconf.FEEDBACK_THREADLIST_URL_PREFIX_FOR_TOPICS,
                self.topic_id))
        suggestion_thread_dicts = response_dict[
            'suggestion_thread_dicts'][0]
        topic_thread = feedback_services.get_all_threads(
            feconf.ENTITY_TYPE_TOPIC, self.topic_id, True)[0]

        self.assertEqual(suggestion_thread_dicts['subject'], 'a subject')
        self.assertEqual(
            suggestion_thread_dicts['thread_id'], topic_thread.id)
        self.assertEqual(
            suggestion_thread_dicts['original_author_username'],
            self.OWNER_USERNAME)

        self.logout()


class FeedbackStatsHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp_id = 'exp_id'

    def test_get_num_threads_after_creating_feedback_analytics(self) -> None:
        self.login(self.OWNER_EMAIL, is_super_admin=True)

        self.get_json(
            '%s/%s' % (feconf.FEEDBACK_STATS_URL_PREFIX, self.exp_id),
            expected_status_int=404)

        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, title='Exploration title',
            category='Architecture', language_code='en')

        response = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_STATS_URL_PREFIX, self.exp_id))
        self.assertEqual(response['num_total_threads'], 0)
        self.assertEqual(response['num_open_threads'], 0)

        feedback_services.create_thread(
            'exploration', self.exp_id, self.owner_id, 'subject', 'text')

        response = self.get_json(
            '%s/%s' % (feconf.FEEDBACK_STATS_URL_PREFIX, self.exp_id))
        self.assertEqual(response['num_total_threads'], 1)
        self.assertEqual(response['num_open_threads'], 1)

        self.logout()


class RecentFeedbackMessagesHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.exp_id = 'exp_id'

    def test_get_recently_posted_feedback_messages(self) -> None:
        self.login(self.MODERATOR_EMAIL)

        response = self.get_json(
            feconf.RECENT_FEEDBACK_MESSAGES_DATA_URL)

        self.assertEqual(response['results'], [])

        self.save_new_valid_exploration(
            self.exp_id, self.moderator_id, title='Exploration title',
            category='Architecture', language_code='en')
        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, self.exp_id, self.moderator_id,
            'a subject', 'some text')

        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, self.exp_id, self.moderator_id,
            'new subject', 'new text')

        response = self.get_json(
            feconf.RECENT_FEEDBACK_MESSAGES_DATA_URL)
        results = response['results']

        self.assertEqual(len(results), 2)

        self.assertEqual(results[0]['author_username'], self.MODERATOR_USERNAME)
        self.assertEqual(results[0]['text'], 'new text')
        self.assertEqual(results[0]['updated_subject'], 'new subject')
        self.assertEqual(results[0]['entity_type'], 'exploration')
        self.assertEqual(results[0]['entity_id'], self.exp_id)

        self.assertEqual(results[1]['text'], 'some text')
        self.assertEqual(results[1]['updated_subject'], 'a subject')
        self.assertEqual(results[1]['entity_type'], 'exploration')
        self.assertEqual(results[1]['entity_id'], self.exp_id)

        self.logout()
