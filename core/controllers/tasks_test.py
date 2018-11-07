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
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils
from core.domain import rights_manager
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

    def setUp(self):
        super(TasksTests, self).setUp()
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
        self.email_user_b = self.swap(rights_manager, 'ActivityRights', 
                FakeActivityRights)

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

    def test_SuggestionEmailHandler(self):
        """Tests SuggestionEmailHandler functionality"""
        class FakeActivityRights:
            def __init__(
            self, exploration_id, owner_ids, editor_ids, translator_ids,
            viewer_ids, community_owned=False, cloned_from=None,
            status=True, viewable_if_private=False,
            first_published_msec=None):
                #user B ID hardcoded into owner_ids to get email_manager.
                #to send email to user B to test functionality.
                self.id = exploration_id
                self.editor_ids = editor_ids
                self.translator_ids = translator_ids
                self.viewer_ids = viewer_ids
                self.community_owned = community_owned
                self.cloned_from = cloned_from
                self.status = status
                self.viewable_if_private = viewable_if_private
                self.first_published_msec = first_published_msec
                self.owner_ids = ['121121523518511814218']


        with self.email_user_b, self.can_send_feedback_email_ctx, 
        self.can_send_emails_ctx:
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
                    suggestion_models.TARGET_TYPE_EXPLORATION, self.exploration.id, True)
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
            messages = self.mail_stub.get_sent_messages(to=self.USER_B_EMAIL)
            self.assertEqual(len(messages), 1)

    def test_InstantFeedbackMessageEmailHandler(self):
        """Tests Instant feedback message handler"""
        #WORK IN PROGRESS.
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
            #send instant feedback message email.
            reference_dict = {
                'entity_id': self.exploration.id,
                'thread_id': thread_id}
