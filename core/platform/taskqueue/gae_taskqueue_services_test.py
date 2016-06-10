# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for taskqueue services."""

from core.platform.taskqueue import gae_taskqueue_services
from core.tests import test_utils
import feconf

class EmailsTaskqueueTests(test_utils.GenericTestBase):
    """Tests for tasks in emails taskqueue."""

    def test_create_new_task(self):
        user_id = 'user'
        taskqueue_name = (
            gae_taskqueue_services.QUEUE_NAME_FEEDBACK_MESSAGE_EMAIL)

        gae_taskqueue_services.add_feedback_message_email_task(user_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(queue_name=taskqueue_name), 1)

        tasks = self.get_pending_tasks(queue_name=taskqueue_name)
        self.assertEqual(
            tasks[0].url, feconf.FEEDBACK_MESSAGE_EMAIL_HANDLER_URL)
        self.process_and_flush_pending_tasks()
