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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import time

from core.platform.taskqueue import cloud_tasks_emulator
from core.tests import test_utils
import python_utils


class CloudTasksEmulatorUnitTests(test_utils.TestBase):
    """Tests for cloud tasks emulator."""

    def mock_task_handler(self, url, payload, queue_name, task_name=None):
        self.output.append(
            'Task %s in queue %s with payload %s is sent to %s.' % (
                task_name if task_name else 'Default',
                queue_name,
                python_utils.convert_to_bytes(payload),
                url)
        )

    def setUp(self):
        super(CloudTasksEmulatorUnitTests, self).setUp()
        self.url = 'dummy_url'
        self.queue_name1 = 'queue_name1'
        self.queue_name2 = 'queue_name2'
        self.payload1 = {
            'param1': 'param1',
            'param2': 2,
            'param3': None
        }

        self.payload2 = {
            'param1': 'param2',
            'param2': {
                'arg': 'arg1'
            },
            'param3': [1, 2, 3]
        }
        self.output = []
        self.unit_test_emulator = cloud_tasks_emulator.Emulator(
            task_handler=self.mock_task_handler, automatic_task_handling=False)
        self.dev_mode_emulator = cloud_tasks_emulator.Emulator(
            task_handler=self.mock_task_handler)

    def test_task_creation_is_handled_correctly(self):
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 0)

        self.unit_test_emulator.create_task(
            self.queue_name1, self.url, self.payload1)
        self.unit_test_emulator.create_task(
            self.queue_name2, self.url, self.payload2)
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 2)
        task_list = self.unit_test_emulator.get_tasks(
            queue_name=self.queue_name1)
        self.assertEqual(
            self.unit_test_emulator.get_number_of_tasks(
                queue_name=self.queue_name1), 1)
        self.assertEqual(len(task_list), 1)

        self.assertEqual(task_list[0].queue_name, self.queue_name1)
        self.assertEqual(task_list[0].payload, self.payload1)
        task_list = self.unit_test_emulator.get_tasks()
        self.assertEqual(len(task_list), 2)

    def test_flushing_and_executing_tasks_produces_correct_behavior(self):
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 0)

        self.unit_test_emulator.create_task(
            self.queue_name1, self.url, self.payload1)
        self.unit_test_emulator.create_task(
            self.queue_name2, self.url, self.payload2)
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 2)

        self.unit_test_emulator.process_and_flush_tasks(
            queue_name=self.queue_name1)

        self.assertEqual(
            self.output,
            [
                'Task Default in queue %s with payload %s is sent to %s.' % (
                    self.queue_name1,
                    python_utils.convert_to_bytes(self.payload1),
                    self.url)
            ]
        )

        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 1)
        self.unit_test_emulator.process_and_flush_tasks()
        self.assertEqual(
            self.output,
            [
                'Task Default in queue %s with payload %s is sent to %s.' % (
                    self.queue_name1,
                    python_utils.convert_to_bytes(self.payload1),
                    self.url),
                'Task Default in queue %s with payload %s is sent to %s.' % (
                    self.queue_name2,
                    python_utils.convert_to_bytes(self.payload2),
                    self.url),
            ]
        )
        self.assertEqual(self.unit_test_emulator.get_number_of_tasks(), 0)

    def test_tasks_scheduled_for_immediate_execution_are_handled_correctly(
            self):
        self.dev_mode_emulator.create_task(
            self.queue_name1, self.url, self.payload1)
        self.dev_mode_emulator.create_task(
            self.queue_name2, self.url, self.payload2)
        # Allow the threads to execute the tasks scheduled immediately.
        time.sleep(1)

        self.assertEqual(
            self.output,
            [
                'Task Default in queue %s with payload %s is sent to %s.' % (
                    self.queue_name1,
                    python_utils.convert_to_bytes(self.payload1),
                    self.url),
                'Task Default in queue %s with payload %s is sent to %s.' % (
                    self.queue_name2,
                    python_utils.convert_to_bytes(self.payload2),
                    self.url),
            ]
        )
