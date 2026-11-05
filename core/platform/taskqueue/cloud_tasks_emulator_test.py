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

"""Tests for methods in the Cloud Tasks Emulator."""

from __future__ import annotations

import re
import time

from core.platform.taskqueue import cloud_tasks_emulator
from core.tests import test_utils

from typing import Any, Dict, List, Optional


class CloudTasksEmulatorUnitTests(test_utils.TestBase):
    """Tests for cloud tasks emulator."""

    # Here we use type Any because it emulates the behaviour of
    # dev_mode_taskqueue_services._task_handler. So, to match the
    # type annotations with '_task_handler' we annotated the payload
    # as 'Dict[str, Any]'.
    def mock_task_handler(
        self,
        url: str,
        payload: Dict[str, Any],
        queue_name: str,
        task_name: Optional[str] = None,
    ) -> None:
        self.output.append(
            'Task %s in queue %s with payload %s is sent to %s.'
            % (
                task_name if task_name else 'Default',
                queue_name,
                str(payload),
                url,
            )
        )

    def setUp(self) -> None:
        super().setUp()
        self.url = 'dummy_url'
        self.queue_name1 = 'queue_name1'
        self.queue_name2 = 'queue_name2'
        self.payload1 = {'param1': 'param1', 'param2': 2, 'param3': None}

        self.payload2 = {
            'param1': 'param2',
            'param2': {'arg': 'arg1'},
            'param3': [1, 2, 3],
        }
        self.output: List[str] = []
        self.unit_test_emulator = cloud_tasks_emulator.Emulator(
            task_handler=self.mock_task_handler, automatic_task_handling=False
        )
        self.dev_mode_emulator = cloud_tasks_emulator.Emulator(
            task_handler=self.mock_task_handler
        )

    def test_task_creation_is_handled_correctly(self) -> None:
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 0)

        self.unit_test_emulator.create_task(
            self.queue_name1, self.url, payload=self.payload1
        )
        self.unit_test_emulator.create_task(
            self.queue_name2, self.url, payload=self.payload2
        )
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 2)
        task_list = self.unit_test_emulator.get_tasks(
            queue_name=self.queue_name1
        )
        self.assertEqual(
            self.unit_test_emulator.get_number_of_tasks(
                queue_name=self.queue_name1
            ),
            1,
        )
        self.assertEqual(len(task_list), 1)

        self.assertEqual(task_list[0].queue_name, self.queue_name1)
        self.assertEqual(task_list[0].payload, self.payload1)
        task_list = self.unit_test_emulator.get_tasks()
        self.assertEqual(len(task_list), 2)

    def test_flushing_and_executing_tasks_produces_correct_behavior(
        self,
    ) -> None:
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 0)

        self.unit_test_emulator.create_task(
            self.queue_name1, self.url, payload=self.payload1
        )
        self.unit_test_emulator.create_task(
            self.queue_name2, self.url, payload=self.payload2
        )
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 2)

        self.unit_test_emulator.process_and_flush_tasks(
            queue_name=self.queue_name1
        )

        patterns = {
            rf'^Task projects/dev-project-id/locations/us-central/queues/'
            rf'{re.escape(self.queue_name1)}/tasks/[a-f0-9]+ in queue '
            rf'{re.escape(self.queue_name1)} with payload '
            rf'{re.escape(str(self.payload1))} is sent to '
            rf'{re.escape(self.url)}\.$'
        }

        matched = set()
        for line in self.output:
            for pattern in patterns:
                if re.match(pattern, line):
                    matched.add(pattern)
                    break
            else:
                self.fail('No pattern matched for line: %s.' % line)

        self.assertEqual(matched, patterns)

        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 1)
        self.unit_test_emulator.process_and_flush_tasks()
        patterns = {
            (
                rf'^Task projects/dev-project-id/locations/us-central/queues/'
                rf'{re.escape(self.queue_name1)}/tasks/[a-f0-9]+ in queue '
                rf'{re.escape(self.queue_name1)} with payload '
                rf'{re.escape(str(self.payload1))} is sent to '
                rf'{re.escape(self.url)}\.$'
            ),
            (
                rf'^Task projects/dev-project-id/locations/us-central/queues/'
                rf'{re.escape(self.queue_name2)}/tasks/[a-f0-9]+ in queue '
                rf'{re.escape(self.queue_name2)} with payload '
                rf'{re.escape(str(self.payload2))} is sent to '
                rf'{re.escape(self.url)}\.$'
            ),
        }

        matched = set()
        for line in self.output:
            for pattern in patterns:
                if re.match(pattern, line):
                    matched.add(pattern)
                    break
            else:
                self.fail('No pattern matched for line: %s.' % line)

        self.assertEqual(matched, patterns)
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 0)

    def test_tasks_scheduled_for_immediate_execution_are_handled_correctly(
        self,
    ) -> None:
        self.dev_mode_emulator.create_task(
            self.queue_name1, self.url, payload=self.payload1
        )
        self.dev_mode_emulator.create_task(
            self.queue_name2, self.url, payload=self.payload2
        )
        # Allow the threads to execute the tasks scheduled immediately.
        time.sleep(1)

        patterns = {
            (
                rf'^Task projects/dev-project-id/locations/us-central/queues/'
                rf'{re.escape(self.queue_name1)}/tasks/[a-f0-9]+ in queue '
                rf'{re.escape(self.queue_name1)} with payload '
                rf'{re.escape(str(self.payload1))} is sent to '
                rf'{re.escape(self.url)}\.$'
            ),
            (
                rf'^Task projects/dev-project-id/locations/us-central/queues/'
                rf'{re.escape(self.queue_name2)}/tasks/[a-f0-9]+ in queue '
                rf'{re.escape(self.queue_name2)} with payload '
                rf'{re.escape(str(self.payload2))} is sent to '
                rf'{re.escape(self.url)}\.$'
            ),
        }

        matched = set()
        for line in self.output:
            for pattern in patterns:
                if re.match(pattern, line):
                    matched.add(pattern)
                    break
            else:
                self.fail('No pattern matched for line: %s.' % line)

        self.assertEqual(matched, patterns)


class CloudTasksEmulatorGenericTestBaseTests(test_utils.GenericTestBase):

    def test_future_task_remains_queued(self) -> None:
        handled_tasks: List[str] = []

        def task_handler(
            url: str,
            unused_payload: Dict[str, Any],
            unused_queue_name: str,
            unused_task_name: Optional[str] = None,
        ) -> None:
            handled_tasks.append(url)

        emulator = cloud_tasks_emulator.Emulator(
            task_handler=task_handler,
            automatic_task_handling=False,
        )
        task = emulator.create_task('queue', 'dummy_url')
        task.scheduled_for = 100.0

        class StopQueueProcessing(Exception):
            pass

        def stop_sleep(unused_seconds: float) -> None:
            raise StopQueueProcessing('stop')

        with (
            self.swap(cloud_tasks_emulator.time, 'time', lambda: 0.0),
            self.swap(cloud_tasks_emulator.time, 'sleep', stop_sleep),
        ):
            with self.assertRaisesRegex(StopQueueProcessing, '^stop$'):
                emulator._process_queue(
                    'queue'
                )  # pylint: disable=protected-access

        self.assertEqual(emulator.get_number_of_tasks('queue'), 1)
        self.assertEqual(handled_tasks, [])

    def test_due_task_with_non_dict_payload_is_passed_to_handler(self) -> None:
        handled_payloads: List[object] = []

        def task_handler(
            url: str,
            payload: object,
            queue_name: str,
            task_name: Optional[str] = None,
        ) -> None:
            self.assertEqual(url, 'dummy_url')
            self.assertEqual(queue_name, 'queue')
            self.assertIsNotNone(task_name)
            handled_payloads.append(payload)

        emulator = cloud_tasks_emulator.Emulator(
            task_handler=task_handler,
            automatic_task_handling=False,
        )
        task = emulator.create_task(
            'queue',
            'dummy_url',
            payload=[1, 2, 3],  # type: ignore[arg-type]
        )
        task.scheduled_for = 0.0

        class StopQueueProcessing(Exception):
            pass

        def stop_sleep(unused_seconds: float) -> None:
            raise StopQueueProcessing('stop')

        with (
            self.swap(cloud_tasks_emulator.time, 'time', lambda: 1.0),
            self.swap(cloud_tasks_emulator.time, 'sleep', stop_sleep),
        ):
            with self.assertRaisesRegex(StopQueueProcessing, '^stop$'):
                emulator._process_queue(
                    'queue'
                )  # pylint: disable=protected-access

        self.assertEqual(handled_payloads, [[1, 2, 3]])
        self.assertEqual(emulator.get_number_of_tasks('queue'), 0)

    def test_empty_queue_name_selects_all_queues(self) -> None:
        handled_urls: List[str] = []

        def task_handler(
            url: str,
            payload: Optional[Dict[str, Any]],
            queue_name: str,
            task_name: Optional[str] = None,
        ) -> None:
            self.assertIsNone(payload)
            self.assertEqual(queue_name, '')
            self.assertIsNotNone(task_name)
            handled_urls.append(url)

        emulator = cloud_tasks_emulator.Emulator(
            task_handler=task_handler,
            automatic_task_handling=False,
        )
        emulator.create_task('', 'dummy_url')
        emulator.create_task('', 'another_url', task_name='explicit_task_name')

        self.assertEqual(emulator.get_number_of_tasks(''), 2)
        emulator.process_and_flush_tasks('')

        self.assertEqual(handled_urls, ['dummy_url', 'another_url'])
        self.assertEqual(emulator.get_number_of_tasks(''), 0)

    def test_invalid_task_without_schedule_time_asserts(self) -> None:
        def task_handler(
            unused_url: str,
            unused_payload: Optional[Dict[str, Any]],
            unused_queue_name: str,
            unused_task_name: Optional[str] = None,
        ) -> None:
            self.fail('The task handler should not run for an invalid task.')

        emulator = cloud_tasks_emulator.Emulator(
            task_handler=task_handler,
            automatic_task_handling=False,
        )
        task = emulator.create_task('queue', 'dummy_url')
        task.scheduled_for = None

        with self.assertRaisesRegex(AssertionError, '^$'):
            emulator._process_queue('queue')  # pylint: disable=protected-access
