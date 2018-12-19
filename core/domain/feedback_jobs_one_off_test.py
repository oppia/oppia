# coding: utf-8
#
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

"""Tests for feedback related jobs"""

from core.domain import feedback_jobs_one_off
from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
taskqueue_services = models.Registry.import_taskqueue_services()


class PopulateMessageCountOneOffJobTest(test_utils.GenericTestBase):
    """Tests for PopulateMessageCountOneOffJob."""

    def setUp(self):
        super(PopulateMessageCountOneOffJobTest, self).setUp()
        feedback_models.GeneralFeedbackThreadModel(
            id='exp1.thread1', entity_id='exp1', entity_type='state1',
            original_author_id='author', message_count=0,
            status=feedback_models.STATUS_CHOICES_OPEN,
            subject='subject', summary='summary', has_suggestion=False,
            ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id='exp1.thread1.1', thread_id='exp1.thread1', message_id=1,
            author_id='author', text='message text').put()
        feedback_models.GeneralFeedbackMessageModel(
            id='exp1.thread1.2', thread_id='exp1.thread1', message_id=2,
            author_id='author', text='message text').put()
        feedback_models.GeneralFeedbackThreadModel(
            id='exp2.thread2', entity_id='exp2', entity_type='state2',
            original_author_id='author', message_count=1,
            status=feedback_models.STATUS_CHOICES_OPEN,
            subject='subject', summary='summary', has_suggestion=False,
            ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id='exp2.thread2.1', thread_id='exp2.thread2', message_id=1,
            author_id='author', text='message text').put()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            feedback_jobs_one_off
            .PopulateMessageCountOneOffJob.create_new())
        feedback_jobs_one_off.PopulateMessageCountOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def test_message_count_job(self):
        self._run_one_off_job()
        self.assertEqual(feedback_services.get_message_count('exp1.thread1'), 2)
        self.assertEqual(feedback_services.get_message_count('exp2.thread2'), 1)
