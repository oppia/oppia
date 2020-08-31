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

"""Unit tests for scripts/concurrent_task_utils.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import threading
import time

from core.tests import test_utils
import python_utils

from . import concurrent_task_utils


def test_function(unused_arg):
    return python_utils.OBJECT


class ConcurrentTaskUtilsTests(test_utils.GenericTestBase):
    """Test for concurrent_task_utils.py flie."""

    def setUp(self):
        super(ConcurrentTaskUtilsTests, self).setUp()
        self.semaphore = threading.Semaphore(1)
        self.task_stdout = []

        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            task_stdout list.

            Args:
                *args: list(*). Variable length argument list of values to print
                    in the same line of output.
            """
            self.task_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)


class TaskResultTests(ConcurrentTaskUtilsTests):
    """Tests for TaskResult class."""

    def test_all_messages_with_success_message(self):
        output_object = concurrent_task_utils.TaskResult(
            'Test', False, [], [])
        self.assertEqual(output_object.trimmed_messages, [])
        self.assertEqual(
            output_object.get_report(), ['SUCCESS  Test check passed'])
        self.assertFalse(output_object.failed)
        self.assertEqual(output_object.name, 'Test')

    def test_all_messages_with_failed_message(self):
        output_object = concurrent_task_utils.TaskResult(
            'Test', True, [], [])
        self.assertEqual(output_object.trimmed_messages, [])
        self.assertEqual(
            output_object.get_report(), ['FAILED  Test check failed'])
        self.assertTrue(output_object.failed)
        self.assertEqual(output_object.name, 'Test')


class CreateTaskTests(ConcurrentTaskUtilsTests):
    """Tests for create_task method."""

    def test_create_task_with_success(self):
        task = concurrent_task_utils.create_task(
            test_function, True, self.semaphore)
        self.assertTrue(isinstance(task, concurrent_task_utils.TaskThread))


class TaskThreadTests(ConcurrentTaskUtilsTests):
    """Tests for TaskThread class."""

    def test_task_thread_with_success(self):
        task = concurrent_task_utils.TaskThread(
            test_function('unused_arg'), False, self.semaphore, name='test',
            report_enabled=True)
        self.semaphore.acquire()
        task.start_time = time.time()
        with self.print_swap:
            task.start()
            task.join()
        expected_output = [s for s in self.task_stdout if 'FINISHED' in s]
        self.assertTrue(len(expected_output) == 1)

    def test_task_thread_with_exception(self):
        task = concurrent_task_utils.TaskThread(
            test_function, True, self.semaphore, name='test',
            report_enabled=True)
        self.semaphore.acquire()
        task.start_time = time.time()
        with self.print_swap:
            task.start()
            task.join()
        self.assertTrue(
            'test_function() takes exactly 1 argument '
            '(0 given)' in self.task_stdout)

    def test_task_thread_with_verbose_mode_enabled(self):
        class HelperTests(python_utils.OBJECT):
            def test_show(self):
                return concurrent_task_utils.TaskResult('name', True, [], [])
            def test_perform_all_check(self):
                return [self.test_show()]

        def test_func():
            return HelperTests()

        task = concurrent_task_utils.TaskThread(
            test_func().test_perform_all_check, True,
            self.semaphore, name='test', report_enabled=True)
        self.semaphore.acquire()
        task.start_time = time.time()
        with self.print_swap:
            task.start()
            task.join()
        self.assertRegexpMatches(
            self.task_stdout[0],
            r'\d+:\d+:\d+ Report from name check\n-+\nFAILED  '
            'name check failed')

    def test_task_thread_with_task_report_disabled(self):
        class HelperTests(python_utils.OBJECT):
            def test_show(self):
                return concurrent_task_utils.TaskResult(
                    None, None, None, ['msg'])
            def test_perform_all_check(self):
                return [self.test_show()]

        def test_func():
            return HelperTests()

        task = concurrent_task_utils.TaskThread(
            test_func().test_perform_all_check, True,
            self.semaphore, name='test', report_enabled=False)
        self.semaphore.acquire()
        task.start_time = time.time()
        with self.print_swap:
            task.start()
            task.join()
        expected_output = [s for s in self.task_stdout if 'FINISHED' in s]
        self.assertTrue(len(expected_output) == 1)


class ExecuteTasksTests(ConcurrentTaskUtilsTests):
    """Tests for execute_tasks method."""

    def test_execute_task_with_single_task(self):
        task = concurrent_task_utils.create_task(
            test_function('unused_arg'), False, self.semaphore, name='test')
        with self.print_swap:
            concurrent_task_utils.execute_tasks([task], self.semaphore)
        expected_output = [s for s in self.task_stdout if 'FINISHED' in s]
        self.assertTrue(len(expected_output) == 1)

    def test_execute_task_with_multiple_task(self):
        task_list = []
        for _ in python_utils.RANGE(6):
            task = concurrent_task_utils.create_task(
                test_function('unused_arg'), False, self.semaphore)
            task_list.append(task)
        with self.print_swap:
            concurrent_task_utils.execute_tasks(task_list, self.semaphore)
        expected_output = [s for s in self.task_stdout if 'FINISHED' in s]
        self.assertTrue(len(expected_output) == 6)

    def test_execute_task_with_exception(self):
        task_list = []
        for _ in python_utils.RANGE(6):
            task = concurrent_task_utils.create_task(
                test_function, True, self.semaphore)
            task_list.append(task)
        with self.print_swap:
            concurrent_task_utils.execute_tasks(task_list, self.semaphore)
        self.assertTrue(
            'test_function() takes exactly 1 argument '
            '(0 given)' in self.task_stdout)
