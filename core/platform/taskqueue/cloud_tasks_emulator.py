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

"""An emulator for that mocks the core.platform.taskqueue API."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import atexit
import threading
import time


class Task:
    def __init__(
        self, queue_name, url, payload=None, scheduled_for=None,
        task_name=None):
        """Initialize a Task that can be executed by making a post request to
        the given url with the correct data payload.

        Args:
            queue_name: str. The name of the queue to add the http task to.
            url: str. URL of the handler function.
            payload: dict(str: *)|None. Payload to pass to the request. Defaults
                to None if no payload is required.
            scheduled_for: int|None. Amount of time, in seconds, to wait before
                executing the task. Pass in 0 or None to schedule the task for
                immediate execution.
            task_name: str|None. Optional. The name of the task.
        """
        self.payload = payload
        self.url = url
        self.scheduled_for = scheduled_for or time.time()
        self.queue_name = queue_name
        self.task_name = task_name


class Emulator:
    """The emulator mocks the core.platform.taskqueue API. The queues in this
    emulator are priority queues: Elements are popped in the order of the time
    they are scheduled for and executed after the time for execution has
    been reached.

    This emulator exposes functionality that is used to provide a taskqueue API
    for both the App Engine development server and the backend unit tests.

    This emulator provides 2 types of functionality for automatic task handling:
        1. The emulator will handle multiple priority queues containg tasks.
           One persistent thread is instantiated per priority queue and will
           constantly try to execute the next task ordered by the
           'scheduled_for' attribute which determines when the task should be
           run.
        2. If automatic task handling is disabled, then the threads for each
           queue will not be created. Instead, the tasks will be added to the
           taskqueue by calling create_task() and tasks in an individual queue
           can be executed using process_and_flush_tasks().
    """
    def __init__(self, task_handler, automatic_task_handling=True):
        """Initializes the emulator with an empty task queue and the correct
        task_handler callback.

        Args:
            task_handler: function. The function that will handle the tasks.
            automatic_task_handling: bool. Boolean value to determine whether
                the emulator will handle tasks automatically via threads or
                via user function calls as detailed in the docstring for this
                emulator.
        """
        self.__lock = threading.Lock()
        self.__task_handler = task_handler
        self.__queues = {}
        self.automatic_task_handling = automatic_task_handling

        self.__queue_threads = {}
        if self.automatic_task_handling:
            # Launch threads for loaded queues, if any.
            for queue_name in self.__queues:
                self.__launch_queue_thread(queue_name)

    def __process_queue(self, queue_name):
        """Callback function for each individual queue thread. The queue thread
        repeatedly queries the queue, pops tasks, and executes the tasks that
        need to be executed.

        Args:
            queue_name: str. The name of the queue.
        """
        while True:
            task = None
            with self.__lock:
                queue = self.__queues[queue_name]
                if queue:
                    peek = queue[0]
                    now = time.time()
                    if peek.scheduled_for <= now:
                        task = queue.pop(0)
            if task:
                self.__task_handler(
                    url=task.url, payload=task.payload,
                    queue_name=task.queue_name,
                    task_name=task.task_name)

            time.sleep(0.01)

    def __launch_queue_thread(self, queue_name):
        """Launches a persistent thread for an individual queue in the
        taskqueue.

        Args:
            queue_name: str. The name of the queue.
        """
        new_thread = threading.Thread(
            target=self.__process_queue,
            name=('Thread-%s' % queue_name), args=[queue_name])
        new_thread.daemon = True
        self.__queue_threads[queue_name] = new_thread
        new_thread.start()

    def _execute_tasks(self, task_list=[]):
        """Executes all of the tasks in the task list using the task handler
        callback.

        Args:
            task_list: list(Task). List of tasks to execute.
        """
        for task in task_list:
            self.__task_handler(
                url=task.url, payload=task.payload,
                queue_name=task.queue_name,
                task_name=task.task_name)

    def _total_enqueued_tasks(self):
        """Returns the total number of tasks across all of the queues in the
        taskqueue.

        Returns:
            int. The total number of tasks in the taskqueue.
        """
        return sum(len(q) for q in self.__queues.values())

    def create_task(
            self, queue_name, url, payload, scheduled_for=None, task_name=None):
        """Creates a Task in the corresponding queue that will be executed when
        the 'scheduled_for' countdown expires. If the queue doesn't exist yet,
        it will be created.

        Args:
            queue_name: str. The name of the queue to add the task to.
            url: str. URL of the handler function.
            payload: dict(str: *)|None. Payload to pass to the request. Defaults
                to None if no payload is required.
            scheduled_for: int|None. Amount of time, in seconds, to wait before
                executing the task. Pass in 0 or None to schedule the task for
                immediate execution.
            task_name: str|None. Optional. The name of the task.
        """
        scheduled_for = scheduled_for or time.time()
        with self.__lock:
            if queue_name not in self.__queues:
                self.__queues[queue_name] = []
                if self.automatic_task_handling:
                    self.__launch_queue_thread(queue_name)
            queue = self.__queues[queue_name]
            task = Task(
                queue_name, url, payload, scheduled_for=scheduled_for,
                task_name=task_name)
            queue.append(task)
            queue.sort(key=lambda t: t.scheduled_for)

    def get_number_of_tasks(self, queue_name=None):
        """Returns the total number of tasks in a single queue if a queue name
        is specified or the entire taskqueue if no queue name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            int. The total number of tasks in a single queue or in the entire
            taskqueue.
        """
        if queue_name and queue_name in self.__queues:
            return len(self.__queues[queue_name])
        else:
            return self._total_enqueued_tasks()

    def process_and_flush_tasks(self, queue_name=None):
        """Executes all of the tasks in a single queue if a queue name is
        specified or all of the tasks in the taskqueue if no queue name is
        specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.
        """
        if queue_name and queue_name in self.__queues:
            self._execute_tasks(self.__queues[queue_name])
            self.__queues[queue_name] = []
        else:
            for queue_name, task_list in self.__queues.items():
                self._execute_tasks(task_list)
                self.__queues[queue_name] = []

    def get_tasks(self, queue_name):
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
        if queue_name in self.__queues:
            return self.__queues[queue_name]
        else:
            tasks_list = []
            for queue_name, task_list in self.__queues.items():
                tasks_list.extend(task_list)
