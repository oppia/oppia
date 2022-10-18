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

from __future__ import annotations

import datetime
import threading
import time
import traceback

from typing import Any, Callable, Final, List, Optional

LOG_LOCK: Final = threading.Lock()
ALL_ERRORS: Final = []
SUCCESS_MESSAGE_PREFIX: Final = 'SUCCESS '
FAILED_MESSAGE_PREFIX: Final = 'FAILED '


def log(message: str, show_time: bool = False) -> None:
    """Logs a message to the terminal.

    If show_time is True, prefixes the message with the current time.
    """
    with LOG_LOCK:
        if show_time:
            print(datetime.datetime.utcnow().strftime('%H:%M:%S'), message)
        else:
            print(message)


class TaskResult:
    """Task result for concurrent_task_utils."""

    def __init__(
        self,
        name: str,
        failed: bool,
        trimmed_messages: List[str],
        messages: List[str]
    ) -> None:
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

    def get_report(self) -> List[str]:
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

    # Here we use type Any because the argument 'func' can accept any
    # kind of function to create a task thread for it.
    def __init__(
        self,
        func: Callable[..., Any],
        verbose: bool,
        semaphore: threading.Semaphore,
        name: Optional[str],
        report_enabled: bool
    ) -> None:
        super().__init__()
        self.func = func
        self.task_results: List[TaskResult] = []
        self.exception: Optional[Exception] = None
        self.stacktrace: Optional[str] = None
        self.verbose = verbose
        self.name = name
        self.semaphore = semaphore
        self.finished = False
        self.report_enabled = report_enabled

    def run(self) -> None:
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
            if 'KeyboardInterrupt' not in self.exception.args[0]:
                log(str(e))
                log(
                    'ERROR %s: %.1f secs' %
                    (self.name, time.time() - self.start_time), show_time=True)
        finally:
            self.semaphore.release()
            self.finished = True


def _check_all_tasks(tasks: List[TaskThread]) -> None:
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


def execute_tasks(
    tasks: List[TaskThread], semaphore: threading.Semaphore
) -> None:
    """Starts all tasks and checks the results.
    Runs no more than the allowable limit defined in the semaphore.

    Args:
        tasks: list(TaskThread). The tasks to run.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
    """
    empty_tasks_list: List[TaskThread] = []
    remaining_tasks: List[TaskThread] = empty_tasks_list + tasks
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


# Here we use type Any because the argument 'func' can accept any kind of
# function to create a task thread for it.
def create_task(
    func: Callable[..., Any],
    verbose: bool,
    semaphore: threading.Semaphore,
    name: Optional[str] = None,
    report_enabled: bool = True
) -> TaskThread:
    """Create a Task in its Thread.

    Args:
        func: Function. The function that is going to run.
        verbose: bool. True if verbose mode is enabled.
        semaphore: threading.Semaphore. The object that controls how many tasks
            can run at any time.
        name: str|None. Name of the task that is going to be created.
        report_enabled: bool. Decide whether task result will print or not.

    Returns:
        task: TaskThread object. Created task.
    """
    task = TaskThread(func, verbose, semaphore, name, report_enabled)
    return task
