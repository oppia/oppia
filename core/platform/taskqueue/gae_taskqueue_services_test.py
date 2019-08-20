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

"""Tests for the GAE taskqueue API wrapper."""

import json
import operator

from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

from google.appengine.ext import deferred


class TaskQueueTests(test_utils.GenericTestBase):
    """Tests for taskqueue-related operations."""

    def test_defer(self):
        taskqueue_services.defer(
            operator.add, taskqueue_services.QUEUE_NAME_DEFAULT, 1, 2)

        tasks = self.taskqueue_stub.get_filtered_tasks()
        self.assertEqual(len(tasks), 1)

        result = deferred.run(tasks[0].payload)
        self.assertEqual(result, 3)

    def test_enqueue_email_task(self):
        payload = {
            'param1': 1,
            'param2': 2,
        }

        taskqueue_services.enqueue_email_task(
            feconf.TASK_URL_FLAG_EXPLORATION_EMAILS, payload, 0)
        tasks = self.taskqueue_stub.get_filtered_tasks(
            queue_names=taskqueue_services.QUEUE_NAME_EMAILS)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].payload, json.dumps(payload))
