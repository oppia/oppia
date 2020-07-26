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


class TaskThread(threading.Thread):
    """Runs a task in its own thread."""

    def __init__(self, func, verbose, semaphore, name):
        super(TaskThread, self).__init__()
        self.func = func
        self.output = None
        self.exception = None
        self.stacktrace = None
        self.verbose = verbose
        self.name = name
        self.semaphore = semaphore
        self.finished = False

    def run(self):
        try:
            self.output = self.func()
            if self.verbose:
                log('LOG %s:' % self.name, show_time=True)
                log(self.output)
                log('----------------------------------------')
            log('FINISHED %s: %.1f secs' %
                (self.name, time.time() - self.start_time), show_time=True)
        except Exception as e:
            self.exception = e
            self.stacktrace = traceback.format_exc()
            if 'KeyboardInterrupt' not in python_utils.convert_to_bytes(
                    self.exception.args[0]):
                log(e)
                log('ERROR %s: %.1f secs' %
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


def create_task(func, verbose, semaphore, name=None):
    """Create a Task in its Thread.

    Args:
        func: Function. The function that is going to run.
        verbose: bool. True if verbose mode is enabled.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
        name: str. Name of the task that is going to be created.

    Returns:
        task: TaskThread object. Created task.
    """
    task = TaskThread(func, verbose, semaphore, name)
    return task
