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

from __future__ import annotations

import datetime

from core import feconf
from core.domain import taskqueue_services
from core.platform.taskqueue import dev_mode_taskqueue_services
from core.tests import test_utils

import requests
from typing import Any, Dict, Optional


class DevModeTaskqueueServicesUnitTests(test_utils.TestBase):
    """Tests for dev_mode_taskqueue_services."""

    def test_creating_dev_mode_task_will_create_the_correct_post_request(
            self
    ) -> None:
        correct_queue_name = 'dummy_queue'
        dummy_url = '/dummy_handler'
        correct_payload = {
            'fn_identifier': (
                taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS),
            'args': [['1', '2', '3']],
            'kwargs': {}
        }

        correct_task_name = 'task1'

        # Here we use type Any because this method mocks the behavior of
        # dev_mode_taskqueue_services.CLIENT.create_task. and in 'create_task'
        # payload is defined as Dict[str, Any].
        def mock_create_task(
                queue_name: str,
                url: str,
                payload: Dict[str, Any],
                scheduled_for: Optional[datetime.datetime] = None, # pylint: disable=unused-argument
                task_name: Optional[str] = None,
        ) -> None:
            self.assertEqual(queue_name, correct_queue_name)
            self.assertEqual(url, dummy_url)
            self.assertEqual(payload, correct_payload)
            self.assertEqual(task_name, correct_task_name)

        swap_create_task = self.swap(
            dev_mode_taskqueue_services.CLIENT, 'create_task', mock_create_task)
        with swap_create_task:
            dev_mode_taskqueue_services.create_http_task(
                correct_queue_name, dummy_url, correct_payload,
                task_name=correct_task_name)

    def test_task_handler_will_create_the_correct_post_request(self) -> None:
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
        # Here we use type Any because this function mocks requests.post
        # function where the type of JSON has been defined as Any, hence using
        # Dict[str, Any] here.
        # https://github.com/python/typeshed/blob/5e0fc4607323a4657b587bf70e3c26becf1c88d0/stubs/requests/requests/api.pyi#L78
        def mock_post(
                url: str,
                json: Dict[str, Any],
                headers: Dict[str, str],
                timeout: int
        ) -> None:
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
