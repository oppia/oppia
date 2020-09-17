# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in the dev_mode_taskqueue_services."""

import requests
from core.domain import taskqueue_services
from core.platform.taskqueue import dev_mode_taskqueue_services
from core.tests import test_utils

class DevModeTaskqueueServicesUnitTests(test_utils.TestBase):
    """Tests for dev_mode_taskqueue_services."""

    def test_creating_dev_mode_task_will_create_the_correct_post_request(self):
        queue_name = 'dummy_queue'
        dummy_url = 'localhost:8181/dummy_handler'
        correct_payload = {
            'fn_identifier': taskqueue_services.FUNCTION_ID_DELETE_EXPLORATIONS,
            'args': [['1', '2', '3']],
            'kwargs': {}
        }

        task_name = 'task1'
        correct_headers = {
            'X-Appengine-QueueName': queue_name,
            'X-Appengine-TaskRetryCount': task_name,
            'X-Appengine-TaskExecutionCount': '0',
            'X-Appengine-TaskETA': '0',
            'method': 'POST'
        }
        def mock_post(self, url, json, headers):
            self.assertEqual(
                url, 'http://localhost:8181%s' % feconf.TASK_URL_DEFERRED)
            self.assertEqual(json, correct_payload)
            self.assertEqual(headers, correct_headers)

        swap_post = self.swap(requests, 'post', mock_post)
        with swap_post:
            dev_mode_taskqueue_services.create_http_task(
                queue_name, dummy_url, correct_payload)
