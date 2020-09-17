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

import datetime
import json

from core.tests import test_utils
from core.domain import taskqueue_services
from core.platform.taskqueue import cloud_taskqueue_services
from google.protobuf import timestamp_pb2
import python_utils

class CloudTaskqueueServicesUnitTests(test_utils.TestBase):
    """Tests for cloud_taskqueue_services."""

    def test_http_task_scheduled_immediately_sends_correct_request(self):
        queue_name = 'queue'
        dummy_url = 'localhost:8181/dummy_handler'
        payload = {
            'fn_identifier': taskqueue_services.FUNCTION_ID_DELETE_EXPLORATIONS,
            'args': [['1', '2', '3']],
            'kwargs': {}
        }

        task_name = 'task1'
        def mock_create_task(parent, task):
            class Response(python_utils.OBJECT):
                def __init__(self, name):
                    self.name = name

            self.assertEqual(
                parent,
                u'projects/my-project-id/locations/us-central1/queues/queue')
            self.assertEqual(
                task,
                {
                    'http_request': {
                        'http_method': 1,
                        'url': dummy_url,
                        'headers': {
                            'Content-type': 'application/json'
                        },
                        'body': json.dumps(payload).encode()
                    },
                    'name': task_name
                }
            )
            return Response(task_name)

        with self.swap(
            cloud_taskqueue_services.client, 'create_task', mock_create_task):
                cloud_taskqueue_services.create_http_task(
                    queue_name, dummy_url, payload=payload,
                    task_name=task_name)

    def test_http_task_scheduled_for_later_sends_correct_request(self):
        queue_name = 'queue'
        dummy_url = 'localhost:8181/dummy_handler'
        payload = {
            'fn_identifier': taskqueue_services.FUNCTION_ID_DELETE_EXPLORATIONS,
            'args': [['1', '2', '3']],
            'kwargs': {}
        }
        # Create Timestamp protobuf.
        d = datetime.datetime.utcnow() + datetime.timedelta(seconds=20)
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromDatetime(d)
        task_name = 'task1'
        def mock_create_task(parent, task):
            class Response(python_utils.OBJECT):
                def __init__(self, name):
                    self.name = name

            self.assertEqual(
                parent,
                u'projects/my-project-id/locations/us-central1/queues/queue')
            self.assertEqual(
                task,
                {
                    'http_request': {
                        'http_method': 1,
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
            return Response(task_name)

        with self.swap(
            cloud_taskqueue_services.client, 'create_task', mock_create_task):
                cloud_taskqueue_services.create_http_task(
                    queue_name, dummy_url, payload=payload, scheduled_for=d,
                    task_name=task_name)
