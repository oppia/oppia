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

"""Tests for methods in the cloud_taskqueue_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from core.tests import test_utils
from core.domain import taskqueue_services
from core.platform.taskqueue import cloud_tasks_emulator
from google.cloud import tasks_v2
from google.protobuf import timestamp_pb2

class CloudTaskqueueServicesUnitTests(test_utils.TestBase):
    """Tests for cloud_taskqueue_services."""

    def setUp(self):
        super(CloudTaskqueueServicesUnitTests, self).setUp()
        self.client = tasks_v2.CloudTasksClient()

    def test_http_task_scheduled_immediately_sends_correct_request(self):
        queue_name = 'queue'
        dummy_url = 'localhost:8181/handler'
        payload = {
            'fn_identifier': taskqueue_services.FUNCTION_ID_DELETE_EXPLORATIONS,
            'args': [['1', '2', '3']],
            'kwargs': {}
        }
        d = datetime.datetime.utcnow() + datetime.timedelta(
            seconds=scheduled_for)

        # Create Timestamp protobuf.
        d = datetime.datetime.utcnow()
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromDatetime(d)
        task_name = 'task1'
        def mock_create_http_task(self, request):
            self.assertEqual(request['parent'], 1)
            self.assertEqual(
                request['task'],
                {
                    'http_request': {
                        'http_method': tasks_v2.HttpMethod.POST,
                        'url': dummy_url,
                        'headers': {
                            'Content-type': 'application/json'
                        },
                        'body': json.dumps(payload).encode()
                    },
                    'schedule_time': timestamp,
                    'name': task_name
                }
            )
        with self.swap(self.client, 'create_http_task', mock_create_http_task):
            taskqueue_services.create_http_task(
                queue_name, dummy_url, payload=payload, task_name=task_name)
