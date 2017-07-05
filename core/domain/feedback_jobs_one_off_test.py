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

"""Tests for feedback-related jobs."""

from core.domain import feedback_jobs_one_off
from core.domain import feedback_services
from core.domain import subscription_services
from core.platform import models
from core.tests import test_utils

taskqueue_services = models.Registry.import_taskqueue_services()


class FeedbackThreadMessagesCountOneOffJobTest(test_utils.GenericTestBase):
    """Tests for the one-off feedback thread message counter job."""

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

    EXPECTED_THREAD_DICT = {
        'status': u'open',
        'state_name': u'a_state_name',
        'summary': None,
        'original_author_username': None,
        'subject': u'a subject'
    }

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def setUp(self):
        super(FeedbackThreadMessagesCountOneOffJobTest, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = feedback_jobs_one_off.FeedbackThreadMessagesCountOneOffJob.create_new() # pylint: disable=line-too-long
        feedback_jobs_one_off.FeedbackThreadMessagesCountOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()

    def test_message_count(self):
        """Test if the job returns the correct message count."""
        feedback_services.create_thread(
            self.EXP_ID_1, self.EXPECTED_THREAD_DICT['state_name'],
            self.user_id, self.EXPECTED_THREAD_DICT['subject'],
            'not used here')
        feedback_services.create_thread(
            self.EXP_ID_2, self.EXPECTED_THREAD_DICT['state_name'],
            self.user_id, self.EXPECTED_THREAD_DICT['subject'],
            'not used here')

        thread_ids = subscription_services.get_all_threads_subscribed_to(
            self.user_id)

        self._run_one_off_job()

        thread_summaries = feedback_services.get_thread_summaries(
            self.user_id, thread_ids)

        # Check that the first message has only one message.
        self.assertEqual(thread_summaries[0]['total_no_of_messages'], 1)
        # Check that the second message has only one message.
        self.assertEqual(thread_summaries[1]['total_no_of_messages'], 1)

        feedback_services.create_message(
            self.EXP_ID_1, thread_ids[0].split('.')[1], self.user_id, None,
            None, 'editor message')

        self._run_one_off_job()

        thread_summaries = feedback_services.get_thread_summaries(
            self.user_id, thread_ids)

        # Check that the first message has two messages.
        self.assertEqual(thread_summaries[0]['total_no_of_messages'], 2)
