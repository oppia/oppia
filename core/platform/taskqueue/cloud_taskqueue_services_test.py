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

from __future__ import annotations

import datetime
import json

from core import feconf, utils
from core.platform.taskqueue import cloud_taskqueue_services
from core.tests import test_utils

from google.api_core import retry as retry_lib
from google.cloud import tasks_v2
from google.protobuf import timestamp_pb2
from typing import Any, Dict, Optional


class CloudTaskqueueServicesUnitTests(test_utils.TestBase):
    """Tests for cloud_taskqueue_services."""

    class Response:
        """Mock for the response object that is returned from a Cloud
        Tasks query.
        """

        def __init__(self, name: str) -> None:
            self.name = name

    def test_http_task_scheduled_immediately_sends_correct_request(
        self,
    ) -> None:
        queue_name = 'queue'
        dummy_url = '/task/dummy_handler'
        payload = {
            'fn_identifier': (
                feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                    'FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS'
                ]
            ),
            'args': [['1', '2', '3']],
            'kwargs': {},
        }
        task_name = 'task1'

        # Here we use type Any because this method mocks the behaviour of
        # cloud_taskqueue_services.CLIENT.create_task and in 'create_task'
        # task is defined as Dict[str, Any].
        def mock_create_task(
            parent: str,
            task: Dict[str, Any],
            retry: Optional[retry_lib.Retry] = None,
        ) -> CloudTaskqueueServicesUnitTests.Response:
            self.assertIsInstance(retry, retry_lib.Retry)
            self.assertEqual(
                parent,
                'projects/dev-project-id/locations/us-central1/queues/queue',
            )
            self.assertEqual(
                task,
                {
                    'app_engine_http_request': {
                        'http_method': tasks_v2.types.HttpMethod.POST,
                        'relative_uri': dummy_url,
                        'headers': {'Content-type': 'application/json'},
                        'body': json.dumps(payload).encode(),
                    },
                    'name': task_name,
                },
            )
            return self.Response(task_name)

        with self.swap(
            cloud_taskqueue_services.CLIENT, 'create_task', mock_create_task
        ):
            cloud_taskqueue_services.create_http_task(
                queue_name, dummy_url, payload=payload, task_name=task_name
            )

    def test_http_task_scheduled_for_later_sends_correct_request(self) -> None:
        queue_name = 'queue'
        dummy_url = '/task/dummy_handler'
        payload = {
            'fn_identifier': (
                feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                    'FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS'
                ]
            ),
            'args': [['1', '2', '3']],
            'kwargs': {},
        }
        # Create Timestamp protobuf.
        datetime_to_execute_task = (
            utils.get_current_utc_datetime() + datetime.timedelta(seconds=20)
        )
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromDatetime(datetime_to_execute_task)
        task_name = 'task1'

        # Here we use type Any because this method mocks the behaviour of
        # cloud_taskqueue_services.CLIENT.create_task and in 'create_task'
        # task is defined as Dict[str, Any].
        def mock_create_task(
            parent: str,
            task: Dict[str, Any],
            retry: Optional[retry_lib.Retry] = None,
        ) -> CloudTaskqueueServicesUnitTests.Response:
            self.assertIsInstance(retry, retry_lib.Retry)
            self.assertEqual(
                parent,
                'projects/dev-project-id/locations/us-central1/queues/queue',
            )
            self.assertEqual(
                task,
                {
                    'app_engine_http_request': {
                        'http_method': tasks_v2.types.HttpMethod.POST,
                        'relative_uri': dummy_url,
                        'headers': {'Content-type': 'application/json'},
                        'body': json.dumps(payload).encode(),
                    },
                    'schedule_time': timestamp,
                    'name': task_name,
                },
            )
            return self.Response(task_name)

        with self.swap(
            cloud_taskqueue_services.CLIENT, 'create_task', mock_create_task
        ):
            cloud_taskqueue_services.create_http_task(
                queue_name,
                dummy_url,
                payload=payload,
                scheduled_for=datetime_to_execute_task,
                task_name=task_name,
            )


class CloudTaskqueueGenericTestBaseTests(test_utils.TestBase):

    def test_http_task_without_payload_or_optional_fields(self) -> None:
        class Response:
            """Mock response class."""

            name = 'task_without_optional_fields'

        # Here we use type Any because CLIENT.create_task accepts a task
        # dictionary with values of any type.
        def mock_create_task(
            parent: str,
            task: Dict[str, Any],
            retry: Optional[retry_lib.Retry] = None,
        ) -> Response:
            self.assertEqual(
                parent,
                'projects/dev-project-id/locations/us-central1/queues/queue',
            )
            self.assertIsInstance(retry, retry_lib.Retry)
            self.assertEqual(
                task,
                {
                    'app_engine_http_request': {
                        'http_method': tasks_v2.types.HttpMethod.POST,
                        'relative_uri': '/task/dummy_handler',
                    }
                },
            )
            return Response()

        with self.swap(
            cloud_taskqueue_services.CLIENT, 'create_task', mock_create_task
        ):
            response = cloud_taskqueue_services.create_http_task(
                'queue', '/task/dummy_handler'
            )

        self.assertEqual(response.name, 'task_without_optional_fields')

    def test_http_task_with_non_dict_payload_omits_json_headers(self) -> None:
        class Response:
            """Mock response class."""

            name = 'task_with_non_dict_payload'

        # Here we use type Any because CLIENT.create_task accepts a task
        # dictionary with values of any type.
        def mock_create_task(
            parent: str,
            task: Dict[str, Any],
            retry: Optional[retry_lib.Retry] = None,
        ) -> Response:
            self.assertEqual(
                parent,
                'projects/dev-project-id/locations/us-central1/queues/queue',
            )
            self.assertIsInstance(retry, retry_lib.Retry)
            self.assertEqual(task['app_engine_http_request']['body'], b'')
            self.assertNotIn('headers', task['app_engine_http_request'])
            return Response()

        with self.swap(
            cloud_taskqueue_services.CLIENT, 'create_task', mock_create_task
        ):
            cloud_taskqueue_services.create_http_task(
                'queue',
                '/task/dummy_handler',
                # Here we use MyPy ignore because this test covers a
                # non-dictionary payload.
                payload='not a dictionary',  # type: ignore[arg-type]
            )

    def test_http_task_with_empty_dict_serializes_payload(self) -> None:
        class Response:
            """Mock response class."""

            name = 'task_with_empty_payload'

        # Here we use type Any because CLIENT.create_task accepts a task
        # dictionary with values of any type.
        def mock_create_task(
            parent: str,
            task: Dict[str, Any],
            retry: Optional[retry_lib.Retry] = None,
        ) -> Response:
            self.assertEqual(
                parent,
                'projects/dev-project-id/locations/us-central1/queues/queue',
            )
            self.assertIsInstance(retry, retry_lib.Retry)
            self.assertEqual(
                task['app_engine_http_request']['headers'],
                {'Content-type': 'application/json'},
            )
            self.assertEqual(task['app_engine_http_request']['body'], b'{}')
            return Response()

        with self.swap(
            cloud_taskqueue_services.CLIENT, 'create_task', mock_create_task
        ):
            cloud_taskqueue_services.create_http_task(
                'queue', '/task/dummy_handler', payload={}
            )
