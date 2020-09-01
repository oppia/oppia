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

"""Utility methods for managing concurrent tasks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import threading
import time
import traceback
import python_utils

LOG_LOCK = threading.Lock()
ALL_ERRORS = []
SUCCESS_MESSAGE_PREFIX = 'SUCCESS '
FAILED_MESSAGE_PREFIX = 'FAILED '


def log(message, show_time=False):
    """Logs a message to the terminal.

    If show_time is True, prefixes the message with the current time.
    """
    with LOG_LOCK:
        if show_time:
            python_utils.PRINT(
                datetime.datetime.utcnow().strftime('%H:%M:%S'), message)
        else:
            python_utils.PRINT(message)


class TaskResult(python_utils.OBJECT):
    """Task result for concurrent_task_utils."""

    def __init__(self, name, failed, trimmed_messages, messages):
        """Constructs a TaskResult object.

        Args:
            name: str. The name of the task.
            failed: bool. The boolean value representing whether the task
                failed.
            trimmed_messages: list(str). List of error messages that are
                trimmed to keep main part of messages.
            messages: list(str). List of full messages returned by the objects.
        """
        self.name = name
        self.failed = failed
        self.trimmed_messages = trimmed_messages
        self.messages = messages

    def get_report(self):
        """Returns a list of message with pass or fail status for the current
        check.

        Returns:
            list(str). List of full messages corresponding to the given
            task.
        """
        all_messages = self.messages[:]
        status_message = (
            '%s %s check %s' % (
                (FAILED_MESSAGE_PREFIX, self.name, 'failed')
                if self.failed else (
                    SUCCESS_MESSAGE_PREFIX, self.name, 'passed')))
        all_messages.append(status_message)
        return all_messages


class TaskThread(threading.Thread):
    """Runs a task in its own thread."""

    def __init__(self, func, verbose, semaphore, name, report_enabled):
        super(TaskThread, self).__init__()
        self.func = func
        self.task_results = []
        self.exception = None
        self.stacktrace = None
        self.verbose = verbose
        self.name = name
        self.semaphore = semaphore
        self.finished = False
        self.report_enabled = report_enabled

    def run(self):
        try:
            self.task_results = self.func()
            if self.verbose:
                for task_result in self.task_results:
                    # The following section will print the output of the lint
                    # checks.
                    if self.report_enabled:
                        log(
                            'Report from %s check\n'
                            '----------------------------------------\n'
                            '%s' % (task_result.name, '\n'.join(
                                task_result.get_report())), show_time=True)
                    # The following section will print the output of backend
                    # tests.
                    else:
                        log(
                            'LOG %s:\n%s'
                            '----------------------------------------' %
                            (self.name, task_result.messages[0]),
                            show_time=True)
            log(
                'FINISHED %s: %.1f secs' % (
                    self.name, time.time() - self.start_time), show_time=True)
        except Exception as e:
            self.exception = e
            self.stacktrace = traceback.format_exc()
            if 'KeyboardInterrupt' not in python_utils.convert_to_bytes(
                    self.exception.args[0]):
                log(e)
                log(
                    'ERROR %s: %.1f secs' %
                    (self.name, time.time() - self.start_time), show_time=True)
        finally:
            self.semaphore.release()
            self.finished = True


def _check_all_tasks(tasks):
    """Checks the results of all tasks."""
    running_tasks_data = []

    for task in tasks:
        if task.isAlive():
            running_tasks_data.append('  %s (started %s)' % (
                task.name,
                time.strftime('%H:%M:%S', time.localtime(task.start_time))
            ))

        if task.exception:
            ALL_ERRORS.append(task.stacktrace)

    if running_tasks_data:
        log('----------------------------------------')
        log('Tasks still running:')
        for task_details in running_tasks_data:
            log(task_details)


def execute_tasks(tasks, semaphore):
    """Starts all tasks and checks the results.
    Runs no more than the allowable limit defined in the semaphore.

    Args:
        tasks: list(TestingTaskSpec). The tasks to run.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
    """
    remaining_tasks = [] + tasks
    currently_running_tasks = []

    while remaining_tasks:
        task = remaining_tasks.pop()
        semaphore.acquire()
        task.start_time = time.time()
        task.start()
        currently_running_tasks.append(task)

        if len(remaining_tasks) % 5 == 0:
            if remaining_tasks:
                log('----------------------------------------')
                log('Number of unstarted tasks: %s' % len(remaining_tasks))
            _check_all_tasks(currently_running_tasks)
        log('----------------------------------------')

    for task in currently_running_tasks:
        task.join()

    _check_all_tasks(currently_running_tasks)


def create_task(func, verbose, semaphore, name=None, report_enabled=True):
    """Create a Task in its Thread.

    Args:
        func: Function. The function that is going to run.
        verbose: bool. True if verbose mode is enabled.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
        name: str. Name of the task that is going to be created.
        report_enabled: bool. Decide whether task result will print or not.

    Returns:
        task: TaskThread object. Created task.
    """
    task = TaskThread(func, verbose, semaphore, name, report_enabled)
    return task
