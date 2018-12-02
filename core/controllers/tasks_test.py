# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Tasks Email Handler."""

from core.domain import exp_domain
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(job_models, email_models) = models.Registry.import_models(
    [models.NAMES.job, models.NAMES.email])
(feedback_models, suggestion_models) = models.Registry.import_models(
    [models.NAMES.feedback, models.NAMES.suggestion])
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()


class TasksTests(test_utils.GenericTestBase):

    USER_A_EMAIL = 'a@example.com'
    USER_B_EMAIL = 'b@example.com'
    MODERATOR_EMAIL = 'm@example.com'

    def setUp(self):
        super(TasksTests, self).setUp()
        self.signup(self.MODERATOR_EMAIL, 'moderator')
        self.moderator_id = self.get_user_id_from_email(
            self.MODERATOR_EMAIL)
        self.signup(self.USER_A_EMAIL, 'userA')
        self.user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, 'userB')
        self.user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.set_user_role(
            self.EDITOR_USERNAME, feconf.ROLE_ID_EXPLORATION_EDITOR)
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.THREAD_ID = 'exploration.exp1.thread_1'

    def test_email_sent_when_feedback_in_thread(self):
        # Create feedback thread.
        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

            # Create another message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')

            # Check that there are two messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 2)

            # Check that there are no feedback emails sent to Editor.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

            # Send task and subsequent email to Editor.
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            expected_message = (
                'Hi editor,\n\nYou\'ve received 2 new messages on your'
                ' Oppia explorations:\n- Title:\n- some text\n- user b message'
                '\nYou can view and reply to your messages from your dashboard.'
                '\n\nThanks, and happy teaching!\n\nBest wishes,\nThe Oppia'
                ' Team\n\nYou can change your email preferences via the '
                'Preferences page.')

            # Assert that the message is correct.
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].body.decode(), expected_message)

            # Create another message that is len = 201.
            user_b_message = 'B' * 201
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, user_b_message)

            # Check that there are three messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 3)

            # Send task and subsequent email to Editor.
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)

            # What is expected in the email body.
            expected_message = (
                'Hi editor,\n\nYou\'ve received a new message on your Oppia'
                ' explorations:\n- Title:\n- ' + 'B' * 200 + '...' + '\nYou can'
                ' view and reply to your messages from your dashboard.\n\nThank'
                's, and happy teaching!\n\nBest wishes,\nThe Oppia Team\n\nYou'
                ' can change your email preferences via the Preferences page.')

            # Check that greater than 200 word message is sent
            # and has correct message.

            self.assertEqual(len(messages), 2)
            self.assertEqual(messages[1].body.decode(), expected_message)

    def test_email_is_sent_when_suggestion_created(self):
        """Tests SuggestionEmailHandler functionality."""

        class MockActivityRights(object):
            def __init__(
                    self, exploration_id, owner_ids, editor_ids, translator_ids,
                    viewer_ids, community_owned=False, cloned_from=None,
                    status=True, viewable_if_private=False,
                    first_published_msec=None):
                # User B ID hardcoded into owner_ids to get email_manager
                # to send email to user B to test functionality.
                self.id = exploration_id
                self.getLintToShutUp = owner_ids
                self.editor_ids = editor_ids
                self.translator_ids = translator_ids
                self.viewer_ids = viewer_ids
                self.community_owned = community_owned
                self.cloned_from = cloned_from
                self.status = status
                self.viewable_if_private = viewable_if_private
                self.first_published_msec = first_published_msec
                self.owner_ids = ['121121523518511814218']

        email_user_b = self.swap(
            rights_manager, 'ActivityRights', MockActivityRights)
        with email_user_b, self.can_send_feedback_email_ctx:
            with self.can_send_emails_ctx:
                change = {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'state_1',
                    'new_value': 'new suggestion content'}

                # Create suggestion from user A to user B.
                suggestion_services.create_suggestion(
                    suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.exploration.id, 1,
                    self.user_id_a, change, 'test description',
                    None)
                threadlist = feedback_services.get_all_threads(
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.exploration.id, True)
                thread_id = threadlist[0].id

                # Enqueue and send suggestion email task.
                payload = {
                    'exploration_id': self.exploration.id,
                    'thread_id': thread_id}
                messages = self.mail_stub.get_sent_messages()
                self.assertEqual(len(messages), 0)
                taskqueue_services.enqueue_email_task(
                    feconf.TASK_URL_SUGGESTION_EMAILS, payload, 0)
                self.process_and_flush_pending_tasks()

                # Check that user B received message.
                messages = self.mail_stub.get_sent_messages(
                    to=self.USER_B_EMAIL)
                self.assertEqual(len(messages), 1)

                # Check that user B received correct message.
                expected_message = (
                    'Hi userB,\nuserA has submitted a new suggestion'
                    ' for your Oppia exploration, "Title".\nYou can'
                    ' accept or reject this suggestion by visiting'
                    ' the feedback page for your exploration.\n\nTha'
                    'nks!\n- The Oppia Team\n\nYou can change your'
                    ' email preferences via the Preferences page.')
                self.assertEqual(messages[0].body.decode(), expected_message)

    def test_instant_feedback_reply_email(self):
        """Tests Instant feedback message handler."""
        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id
            # Create reply message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')
            # Get all messages in the thread.
            messages = feedback_services.get_messages(thread_id)
            # Make sure there are only 2 messages in thread.
            self.assertEqual(len(messages), 2)

            # Ensure that user A has no emails sent yet.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 0)

            # Invoke InstantFeedbackMessageEmail which sends
            # instantFeedbackMessage.
            self.process_and_flush_pending_tasks()

            # Ensure that user A has an email sent now.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 1)

            # Ensure that user A has right email sent to them.
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject" on'
                ' Title:\n- userB: user b message\n(You received'
                ' this message because you are a participant in'
                ' this thread.)\n\nBest wishes,\nThe Oppia'
                ' team\n\nYou can change your email preferences'
                ' via the Preferences page.')
            self.assertEqual(messages[0].body.decode(), expected_message)

    def test_email_sent_when_status_changed(self):
        """Tests Feedback Thread Status Change Email Handler."""
        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:

            # Create thread.
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

            # User B creates message with status change.
            feedback_services.create_message(
                thread_id, self.user_id_b,
                feedback_models.STATUS_CHOICES_FIXED,
                None, 'user b message')

            # Ensure user A has no messages sent to him yet.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 0)

            # Invoke feedback status change email handler.
            self.process_and_flush_pending_tasks()

            # Check that user A has 2 emails sent to him.
            # 1 instant feedback message email and 1 status change.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 2)

            # Check that user A has right email sent to him.
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject" on Title:\n-'
                ' userB: changed status from open to fixed\n(You received'
                ' this message because you are a participant in this thread'
                '.)\n\nBest wishes,\nThe Oppia team\n\nYou can change your'
                ' email preferences via the Preferences page.')
            status_change_email = messages[0]
            self.assertEqual(
                status_change_email.body.decode(), expected_message)

    def test_email_sent_to_moderator_after_flag(self):
        """Tests Flagged Exploration Email Handler."""

        def fake_get_user_ids_by_role(_):
            """Replaces get_user_ids_by_role for testing purposes."""
            return [self.moderator_id]
        get_moderator_id_as_list = self.swap(
            user_services, 'get_user_ids_by_role',
            fake_get_user_ids_by_role)

        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:
            with get_moderator_id_as_list:

                # Create thread.
                feedback_services.create_thread(
                    feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                    self.user_id_a, 'bad subject', 'bad text')

                # User B reports thread, sends email.
                payload = {
                    'exploration_id': self.exploration.id,
                    'report_text': 'He said a bad word :-( ',
                    'reporter_id': self.user_id_b}
                taskqueue_services.enqueue_email_task(
                    feconf.TASK_URL_FLAG_EXPLORATION_EMAILS,
                    payload, 0)
                # Ensure moderator has no messages sent to him yet.
                messages = self.mail_stub.get_sent_messages(
                    to=self.MODERATOR_EMAIL)
                self.assertEqual(len(messages), 0)

                # Invoke Flag Exploration Email Handler.
                self.process_and_flush_pending_tasks()

                # Ensure moderator has 1 email now.
                messages = self.mail_stub.get_sent_messages(
                    to=self.MODERATOR_EMAIL)
                self.assertEqual(len(messages), 1)

                # Ensure moderator has received correct email.
                expected_message = (
                    'Hello Moderator,\nuserB has flagged exploration "Title"'
                    ' on the following grounds: \nHe said a bad word :-( '
                    ' .\nYou can modify the exploration by clicking here'
                    '.\n\nThanks!\n- The Oppia Team\n\nYou can change your'
                    ' email preferences via the Preferences page.')
                self.assertEqual(messages[0].body.decode(), expected_message)
