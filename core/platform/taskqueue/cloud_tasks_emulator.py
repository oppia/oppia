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

"""An emulator that mocks the core.platform.taskqueue API. This emulator
models the third party library, Google Cloud Tasks.

This emulator is an extension of the emulator from this github page:
https://github.com/doitintl/Cloud-Tasks-In-Process-Emulator
"""

from __future__ import annotations

import threading
import time

from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional

if TYPE_CHECKING:  # pragma: no cover
    import datetime


class Task:
    """A mock for a Google Cloud Tasks task that is handled by execution using
    the cloud tasks emulator.
    """

    # Here we use type Any because the payload can accept Dict and
    # this Dict has no constraints on its values.
    def __init__(
            self,
            queue_name: str,
            url: str,
            payload: Optional[Dict[str, Any]] = None,
            scheduled_for: Optional[float] = None,
            task_name: Optional[str] = None
    ) -> None:
        """Initialize a Task that can be executed by making a post request to
        the given url with the correct data payload.

        Args:
            queue_name: str. The name of the queue to add the http task to.
            url: str. URL of the handler function.
            payload: dict(str : *). Payload to pass to the request. Defaults
                to None if no payload is required.
            scheduled_for: time|None. The time in which to execute the task,
                relative to time.time().
            task_name: str|None. Optional. The name of the task.
        """
        self.payload = payload
        self.url = url
        self.scheduled_for = scheduled_for
        self.queue_name = queue_name
        self.task_name = task_name


class Emulator:
    """The emulator mocks the core.platform.taskqueue API. The queues in this
    emulator are priority queues: Elements are popped in the order of the time
    they are scheduled for and executed after the time for execution has
    been reached.

    This emulator exposes functionality that is used to provide a taskqueue API
    for both the App Engine development server and the backend unit tests.

    This emulator provides 2 types of functionality for task handling:
        1. The emulator will handle multiple priority queues containing tasks.
           One persistent thread is instantiated per priority queue and will
           constantly try to execute the next task prioritized by the
           'scheduled_for' attribute which determines when the task should be
           run.
        2. If automatic task handling is disabled, then the threads for each
           queue will not be created. Instead, the tasks will be added to the
           taskqueue by calling create_task() and tasks in an individual queue
           can be executed using process_and_flush_tasks().
    """

    # Here we use type Any because 'task_handler' can accept any kind of
    # function that will handle the task execution. So, to allow every
    # function we used Callable[..., Any] type here.
    def __init__(
            self,
            task_handler: Callable[..., Any],
            automatic_task_handling: bool = True
    ) -> None:
        """Initializes the emulator with an empty task queue and the correct
        task_handler callback.

        Args:
            task_handler: function. The function that will handle the task
                execution.
            automatic_task_handling: bool. Boolean value to determine whether
                the emulator will handle tasks automatically via threads or
                via user function calls as detailed in the docstring for this
                emulator.
        """
        self._lock = threading.Lock()
        self._task_handler = task_handler
        self._queues: Dict[str, List[Task]] = {}
        self.automatic_task_handling = automatic_task_handling

        self._queue_threads: Dict[str, threading.Thread] = {}

    def _process_queue(self, queue_name: str) -> None:
        """The callback function for each individual queue thread. Each queue
        thread repeatedly queries the queue, pops tasks, and executes the tasks
        that need to be executed.

        Args:
            queue_name: str. The name of the queue.
        """
        while True:
            task = None
            with self._lock:
                queue = self._queues[queue_name]
                if queue:
                    peek = queue[0]
                    now = time.time()
                    assert peek.scheduled_for is not None
                    if peek.scheduled_for <= now:
                        task = queue.pop(0)
            if task:
                self._task_handler(
                    url=task.url, payload=task.payload,
                    queue_name=task.queue_name,
                    task_name=task.task_name)

            time.sleep(0.01)

    def _launch_queue_thread(self, queue_name: str) -> None:
        """Launches a persistent thread for an individual queue in the
        taskqueue.

        Args:
            queue_name: str. The name of the queue.
        """
        new_thread = threading.Thread(
            target=self._process_queue,
            name=('Thread-%s' % queue_name), args=[queue_name])
        new_thread.daemon = True
        self._queue_threads[queue_name] = new_thread
        new_thread.start()

    def _execute_tasks(self, task_list: List[Task]) -> None:
        """Executes all of the tasks in the task list using the task handler
        callback.

        Args:
            task_list: list(Task). List of tasks to execute.
        """
        for task in task_list:
            self._task_handler(
                url=task.url, payload=task.payload,
                queue_name=task.queue_name,
                task_name=task.task_name)

    def _total_enqueued_tasks(self) -> int:
        """Returns the total number of tasks across all of the queues in the
        taskqueue.

        Returns:
            int. The total number of tasks in the taskqueue.
        """
        return sum(len(q) for q in self._queues.values())

    # Here we use type Any because the payload can accept Dict and
    # this Dict has no constraints on its values.
    def create_task(
            self,
            queue_name: str,
            url: str,
            payload: Optional[Dict[str, Any]] = None,
            scheduled_for: Optional[datetime.datetime] = None,
            task_name: Optional[str] = None,
            retry: None = None  # pylint: disable=unused-argument
    ) -> None:
        """Creates a Task in the corresponding queue that will be executed when
        the 'scheduled_for' time is reached. If the queue doesn't exist yet,
        it will be created.

        Args:
            queue_name: str. The name of the queue to add the task to.
            url: str. URL of the handler function.
            payload: dict(str : *). Payload to pass to the request. Defaults
                to None if no payload is required.
            scheduled_for: datetime|None. The naive datetime object for the
                time to execute the task. Pass in None for immediate execution.
            task_name: str|None. Optional. The name of the task.
            retry: None. The retry mechanism that should be used. Here we ignore
                the value and it is not used for anything.
        """
        scheduled_for_time = (
            time.mktime(scheduled_for.timetuple())
            if scheduled_for else time.time())
        with self._lock:
            if queue_name not in self._queues:
                self._queues[queue_name] = []
                if self.automatic_task_handling:
                    self._launch_queue_thread(queue_name)
            queue = self._queues[queue_name]
            task = Task(
                queue_name, url, payload, scheduled_for=scheduled_for_time,
                task_name=task_name)
            queue.append(task)
            # The key for sorting is defined separately because of a mypy bug.
            # A [no-any-return] is thrown if key is defined in the sort()
            # method instead.
            # https://github.com/python/mypy/issues/9590
            k = lambda t: t.scheduled_for
            queue.sort(key=k)

    def get_number_of_tasks(self, queue_name: Optional[str] = None) -> int:
        """Returns the total number of tasks in a single queue if a queue name
        is specified or the entire taskqueue if no queue name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            int. The total number of tasks in a single queue or in the entire
            taskqueue.
        """
        if queue_name and queue_name in self._queues:
            return len(self._queues[queue_name])
        else:
            return self._total_enqueued_tasks()

    def process_and_flush_tasks(
            self, queue_name: Optional[str] = None
    ) -> None:
        """Executes all of the tasks in a single queue if a queue name is
        specified or all of the tasks in the taskqueue if no queue name is
        specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.
        """
        if queue_name and queue_name in self._queues:
            self._execute_tasks(self._queues[queue_name])
            self._queues[queue_name] = []
        else:
            for queue, task_list in self._queues.items():
                self._execute_tasks(task_list)
                self._queues[queue] = []

    def get_tasks(self, queue_name: Optional[str] = None) -> List[Task]:
        """Returns a list of the tasks in a single queue if a queue name is
        specified or a list of all of the tasks in the taskqueue if no queue
        name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            list(Task). List of tasks in a single queue or in the entire
            taskqueue.
        """
        if queue_name:
            return self._queues[queue_name]
        else:
            tasks_list = []
            for items in self._queues.items():
                tasks_list.extend(items[1])
            return tasks_list
