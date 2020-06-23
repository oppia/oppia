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
        self.linter_stdout = []

        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args(str): Variable length argument list of values to print in
                the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_create_task(self):
        task = concurrent_task_utils.create_task(
            test_function, True, self.semaphore)
        self.assertTrue(isinstance(task, concurrent_task_utils.TaskThread))

    def test_execute_task(self):
        task = concurrent_task_utils.create_task(
            test_function('unused_arg'), True, self.semaphore, name='test')
        with self.print_swap:
            concurrent_task_utils.execute_tasks([task], self.semaphore)
        expected_output = [s for s in self.linter_stdout if 'FINISHED' in s]
        self.assertTrue(len(expected_output) == 1)

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
            '(0 given)' in self.linter_stdout)
