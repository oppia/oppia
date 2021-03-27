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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import taskqueue_services
from core.platform.taskqueue import dev_mode_taskqueue_services
from core.tests import test_utils
import feconf

import requests


class DevModeTaskqueueServicesUnitTests(test_utils.TestBase):
    """Tests for dev_mode_taskqueue_services."""

    def test_creating_dev_mode_task_will_create_the_correct_post_request(self):
        correct_queue_name = 'dummy_queue'
        dummy_url = '/dummy_handler'
        correct_payload = {
            'fn_identifier': (
                taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS),
            'args': [['1', '2', '3']],
            'kwargs': {}
        }

        correct_task_name = 'task1'

        def mock_create_task(
                queue_name, url, payload, scheduled_for=None, task_name=None): # pylint: disable=unused-argument
            self.assertEqual(queue_name, correct_queue_name)
            self.assertEqual(url, dummy_url)
            self.assertEqual(payload, correct_payload)
            self.assertEqual(task_name, correct_task_name)

        swap_create_task = self.swap(
            dev_mode_taskqueue_services.CLIENT, 'create_task', mock_create_task)
        with swap_create_task:
            dev_mode_taskqueue_services.create_http_task(
                correct_queue_name, dummy_url, payload=correct_payload,
                task_name=correct_task_name)

    def test_task_handler_will_create_the_correct_post_request(self):
        queue_name = 'dummy_queue'
        dummy_url = '/dummy_handler'
        correct_port = dev_mode_taskqueue_services.GOOGLE_APP_ENGINE_PORT
        correct_payload = {
            'fn_identifier': (
                taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS),
            'args': [['1', '2', '3']],
            'kwargs': {}
        }

        task_name = 'task1'
        correct_headers = {
            'X-Appengine-QueueName': queue_name,
            'X-Appengine-TaskName': task_name,
            'X-Appengine-TaskRetryCount': '0',
            'X-Appengine-TaskExecutionCount': '0',
            'X-Appengine-TaskETA': '0',
            'X-AppEngine-Fake-Is-Admin': '1',
            'method': 'POST'
        }
        def mock_post(url, json, headers, timeout):
            self.assertEqual(
                url, 'http://localhost:%s%s' % (
                    correct_port, dummy_url))
            self.assertEqual(json, correct_payload)
            self.assertEqual(headers, correct_headers)
            self.assertEqual(timeout, feconf.DEFAULT_TASKQUEUE_TIMEOUT_SECONDS)

        swap_post = self.swap(requests, 'post', mock_post)
        with swap_post:
            # I have to test _task_handler by calling it because I cannot
            # surround this task handler in a context manager reliably. The
            # task_handler is called by a queue thread that is instantiated by
            # the Cloud Tasks Emulator which has a non-determistic execution
            # time. Creating a task will execute correctly but the program will
            # exit the context before actually calling _task_handler().
            dev_mode_taskqueue_services._task_handler( # pylint: disable=protected-access
                dummy_url, correct_payload, queue_name, task_name=task_name)
