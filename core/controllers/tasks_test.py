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
transaction_services = models.Registry.import_transaction_services()
taskqueue_services = models.Registry.import_taskqueue_services()


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
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.THREAD_ID = 'exploration.exp1.thread_1'

    def test_UnsentFeedbackEmailHandler(self):
        #create feedback thread.
        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id


            #create another message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')

            #check that there are two messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 2)

            #telling tasks.py to send email to User 'A'.
            payload = {
                'user_id': self.user_id_a}
            taskqueue_services.enqueue_email_task(
                feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS, payload, 0)

            #check that there are no feedback emails sent to User 'A'.
            messages = self.mail_stub.get_sent_messages(to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 0)

            #send task and subsequent email to User 'A'.
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.USER_A_EMAIL)
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject"'
                ' on Title:\n- userB: user b message\n(You received'
                ' this message because you are a participant in this thread.)'
                '\n\nBest wishes,\nThe Oppia team\n\nYou can change your email'
                ' preferences via the Preferences page.')

            #assert that the message is correct.
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].body.decode(), expected_message)

            #create another message that is len = 201.
            user_b_message = 'B' * 201
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, user_b_message)

            #check that there are three messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 3)

            #telling tasks.py to send email to User 'A'.
            payload = {
                'user_id': self.user_id_a}
            taskqueue_services.enqueue_email_task(
                feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS, payload, 0)

            #check that there is one feedback email sent to User 'A'.
            messages = self.mail_stub.get_sent_messages(to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 1)

            #send task and subsequent email to User 'A'.
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.USER_A_EMAIL)
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject"'
                ' on Title:\n- userB:' + 'B'*200 + '...' + ' e\n(You received'
                ' this message because you are a participant in this thread.)'
                '\n\nBest wishes,\nThe Oppia team\n\nYou can change your email'
                ' preferences via the Preferences page.')

            #check that greater than 200 word message is correct.
            self.assertEqual(len(messages), 2)
            #self.assertEqual(messages[1].body.decode(), expected_message)






    def test_SuggestionEmailHandler(self):
        """Tests SuggestionEmailHandler functionality."""
        class FakeActivityRights(object):
            def __init__(
                    self, exploration_id, owner_ids, editor_ids, translator_ids,
                    viewer_ids, community_owned=False, cloned_from=None,
                    status=True, viewable_if_private=False,
                    first_published_msec=None):
                #user B ID hardcoded into owner_ids to get email_manager.
                #to send email to user B to test functionality.
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
            rights_manager, 'ActivityRights',
            FakeActivityRights)
        with email_user_b, self.can_send_feedback_email_ctx:
            with self.can_send_emails_ctx:
                change = {
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'state_name': 'state_1',
                    'new_value': 'new suggestion content'}

                #create suggestion from user A to user B.
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

                #enqueue and send suggestion email task.
                payload = {
                    'exploration_id': self.exploration.id,
                    'thread_id': thread_id}
                messages = self.mail_stub.get_sent_messages()
                self.assertEqual(len(messages), 0)
                taskqueue_services.enqueue_email_task(
                    feconf.TASK_URL_SUGGESTION_EMAILS, payload, 0)
                self.process_and_flush_pending_tasks()

                #check that user B recieved message.
                messages = self.mail_stub.get_sent_messages(
                    to=self.USER_B_EMAIL)
                self.assertEqual(len(messages), 1)

                #check that user B recieved correct message.
                expected_message = (
                    'Hi userB,\nuserA has submitted a new suggestion'
                    ' for your Oppia exploration, "Title".\nYou can'
                    ' accept or reject this suggestion by visiting'
                    ' the feedback page for your exploration.\n\nTha'
                    'nks!\n- The Oppia Team\n\nYou can change your'
                    ' email preferences via the Preferences page.')
                self.assertEqual(messages[0].body.decode(), expected_message)

    def test_InstantFeedbackMessageEmailHandler(self):
        """Tests Instant feedback message handler."""
        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id
            #create reply message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')
            #get all messages in the thread.
            messages = feedback_services.get_messages(thread_id)
            #make sure there are only 2 messages in thread.
            self.assertEqual(len(messages), 2)

            #ensure that user A has no emails sent yet.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 0)

            #invoke InstantFeedbackMessageEmail which sends.
            #InstantFeedbackMessage.
            self.process_and_flush_pending_tasks()

            #ensure that user A has an email sent now.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 1)

            #ensure that user A has right email sent to them.
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject" on'
                ' Title:\n- userB: user b message\n(You received'
                ' this message because you are a participant in'
                ' this thread.)\n\nBest wishes,\nThe Oppia'
                ' team\n\nYou can change your email preferences'
                ' via the Preferences page.')
            self.assertEqual(messages[0].body.decode(), expected_message)

    def test_FeedbackThreadStatusChangeEmailHandler(self):
        """Tests Feedback Thread Status Change Email Handler."""
        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:

            #create thread.
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

            #user B creates message with status change.
            feedback_services.create_message(
                thread_id, self.user_id_b,
                feedback_models.STATUS_CHOICES_FIXED,
                None, 'user b message')

            #ensure user A has no messages sent to him yet.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 0)

            #invoke feedback status change email handler.
            self.process_and_flush_pending_tasks()

            #check that user A has 2 emails sent to him.
            #1 instant feedback message email and 1 status change.
            messages = self.mail_stub.get_sent_messages(
                to=self.USER_A_EMAIL)
            self.assertEqual(len(messages), 2)

            #check that user A has right email sent to him.
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject" on Title:\n-'
                ' userB: changed status from open to fixed\n(You received'
                ' this message because you are a participant in this thread'
                '.)\n\nBest wishes,\nThe Oppia team\n\nYou can change your'
                ' email preferences via the Preferences page.')
            status_change_email = messages[0]
            self.assertEqual(
                status_change_email.body.decode(), expected_message)

    def test_FlagExplorationEmailHandler(self):
        """Tests Flagged Exploration Email Handler."""

        def fake_get_user_ids_by_role(_):
            """Replaces get_user_ids_by_role for testing purposes."""
            return [self.moderator_id]
        get_moderator_id_as_list = self.swap(
            user_services, 'get_user_ids_by_role',
            fake_get_user_ids_by_role)

        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:
            with get_moderator_id_as_list:

                #create thread.
                feedback_services.create_thread(
                    feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                    self.user_id_a, 'bad subject', 'bad text')

                #user B reports thread, sends email.
                payload = {
                    'exploration_id': self.exploration.id,
                    'report_text': 'He said a bad word :-( ',
                    'reporter_id': self.user_id_b}
                taskqueue_services.enqueue_email_task(
                    feconf.TASK_URL_FLAG_EXPLORATION_EMAILS,
                    payload, 0)
                #ensure moderator has no messages sent to him yet.
                messages = self.mail_stub.get_sent_messages(
                    to=self.MODERATOR_EMAIL)
                self.assertEqual(len(messages), 0)

                #Invoke Flag Exploration Email Handler.
                self.process_and_flush_pending_tasks()

                #ensure moderator has 1 email now.
                messages = self.mail_stub.get_sent_messages(
                    to=self.MODERATOR_EMAIL)
                self.assertEqual(len(messages), 1)

                #ensure moderator has recieved correct email.
                expected_message = (
                    'Hello Moderator,\nuserB has flagged exploration "Title"'
                    ' on the following grounds: \nHe said a bad word :-( '
                    ' .\nYou can modify the exploration by clicking here'
                    '.\n\nThanks!\n- The Oppia Team\n\nYou can change your'
                    ' email preferences via the Preferences page.')
                self.assertEqual(messages[0].body.decode(), expected_message)
