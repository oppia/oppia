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

"""Tests for Tasks Email Handler"""
import json

from core.controllers import base
from core.domain import email_manager
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils
from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils
import feconf

(job_models, email_models) = models.Registry.import_models(
    [models.NAMES.job, models.NAMES.email])
(feedback_models, email_models) = models.Registry.import_models(
        [models.NAMES.feedback, models.NAMES.email])
transaction_services = models.Registry.import_transaction_services()
taskqueue_services = models.Registry.import_taskqueue_services()

class UnsentFeedbackEmailHandlerTests(test_utils.GenericTestBase):

    USER_A_EMAIL = 'a@example.com'
    USER_B_EMAIL = 'b@example.com'

    def setUp(self):
        super(UnsentFeedbackEmailHandlerTests,self).setUp()
        self.signup(self.USER_A_EMAIL, 'A')
        self.user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, 'B')
        self.user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')



    def test_test(self):
        #create feedback thread
    
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

        with self.can_send_feedback_email_ctx, self.can_send_emails_ctx:

            feedback_services.create_thread(
                    feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                    self.user_id_a,'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                    feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

                     
            #create another message.
            feedback_services.create_message(
                    thread_id, self.user_id_b, None, None, 'user b message')

             #check that there are two messages in thread
            messages= feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages),2)
            
            #create feedback message 
            feedback_services.create_message(
                thread_id, self.user_id_a, None, None, 'testing feedback')

            #telling tasks.py to send email to User 'A'
            #Using UnsentFeedbackEmailHandler
            feedback_services.enqueue_feedback_message_batch_email_task(
                    'A')
            
