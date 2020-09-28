# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the domain taskqueue services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import taskqueue_services
from core.tests import test_utils
import feconf
import python_utils


class TaskqueueDomainServicesUnitTests(test_utils.TestBase):
    """Tests for domain taskqueue services."""

    def test_exception_raised_when_deferred_payload_is_not_serializable(self):
        class NonSerializableArgs(python_utils.OBJECT):
            """Object that is not JSON serializable."""

            def __init__(self):
                self.x = 1
                self.y = 2

        arg1 = NonSerializableArgs()
        serialization_exception = self.assertRaisesRegexp(
            ValueError,
            'The args or kwargs passed to the deferred call with '
            'function_identifier, %s, are not json serializable.' %
            taskqueue_services.FUNCTION_ID_DISPATCH_EVENT)
        with serialization_exception:
            taskqueue_services.defer(
                taskqueue_services.FUNCTION_ID_DISPATCH_EVENT,
                taskqueue_services.QUEUE_NAME_EVENTS, arg1)

    def test_exception_raised_when_email_task_params_is_not_serializable(self):
        params = {
            'param1': set()
        }
        serialization_exception = self.assertRaisesRegexp(
            ValueError,
            'The params added to the email task call cannot be json serialized')
        with serialization_exception:
            taskqueue_services.enqueue_task(
                feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS,
                params,
                0)

    def test_defer_makes_the_correct_request(self):
        correct_queue_name = taskqueue_services.QUEUE_NAME_DEFAULT
        args = (1, 2, 3, 4)
        kwargs = {
            'kwarg1': 'arg1',
            'kwarg2': 'arg2'
        }
        correct_payload = {
            'fn_identifier': taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS,
            'args': args,
            'kwargs': kwargs
        }
        def mock_create_http_task(
                queue_name, url, payload=None, scheduled_for=None,
                task_name=None):
            self.assertEqual(queue_name, correct_queue_name)
            self.assertEqual(url, feconf.TASK_URL_DEFERRED)
            self.assertEqual(payload, correct_payload)
            self.assertIsNone(task_name)
            self.assertIsNone(scheduled_for)

        swap_create_http_task = self.swap(
            taskqueue_services.platform_taskqueue_services, 'create_http_task',
            mock_create_http_task)

        with swap_create_http_task:
            taskqueue_services.defer(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS,
                correct_queue_name,
                *args,
                **kwargs)

    def test_enqueue_task_makes_the_correct_request(self):
        correct_payload = {
            'user_id': '1'
        }
        correct_url = feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS,
        correct_queue_name = taskqueue_services.QUEUE_NAME_EMAILS
        def mock_create_http_task(
                queue_name, url, payload=None, scheduled_for=None,
                task_name=None):
            self.assertEqual(queue_name, correct_queue_name)
            self.assertEqual(url, correct_url)
            self.assertEqual(payload, correct_payload)
            self.assertIsNotNone(scheduled_for)
            self.assertIsNone(task_name)

        swap_create_http_task = self.swap(
            taskqueue_services.platform_taskqueue_services, 'create_http_task',
            mock_create_http_task)

        with swap_create_http_task:
            taskqueue_services.enqueue_task(
                correct_url, correct_payload, 0)

    def test_that_queue_names_are_in_sync_with_queue_yaml_file(self):
        """Checks that all of the queues that are instantiated in the queue.yaml
        file has a corresponding QUEUE_NAME_* constant instantiated in
        taskqueue_services.
        """
        queue_name_dict = {}
        # Parse the queue.yaml file for the correct queue names.
        with python_utils.open_file('queue.yaml', 'r') as f:
            lines = f.readlines()
            for line in lines:
                if 'name' in line:
                    queue_name = line.split(':')[1]
                    queue_name_dict[queue_name.encode('utf-8').strip()] = False

        # Get all attributes of taskqueue_services using the dir function.
        attributes = dir(taskqueue_services)
        # Check if the queue names in the queue.yaml file exist in as a queue
        # name in taskqueue_services.
        for attribute in attributes:
            value = getattr(taskqueue_services, attribute)
            if python_utils.convert_to_bytes(value) in queue_name_dict:
                queue_name_dict[value] = True

        for queue_name, in_taskqueue_services in queue_name_dict.items():
            self.assertTrue(in_taskqueue_services)
