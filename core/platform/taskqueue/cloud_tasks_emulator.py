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

"""Emulator for Cloud Tasks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import atexit
import datetime
import json
import logging
import os
import threading
import time


log = logging.getLogger(__name__)
log.setLevel(logging.INFO)
log.addHandler(logging.StreamHandler())


class Task:
    def __init__(
        self, queue_name, url, payload=None, scheduled_for=None,
        task_name=None):
        self.payload = payload
        self.url = url
        self.scheduled_for = scheduled_for or time.time()
        self.queue_name = queue_name
        self.task_name = task_name


class Emulator:
    """The queues in the Emulator are not FIFO. Rather, they are priority queues: Elements are popped in the
    order of the time they are scheduled for, and only after the scheduled time.
    """

    def __init__(self, task_handler, automatic_queue_handling=True):
        """
        :param task_handler: A callback function: It will receive the tasks
        :param hibernation: If True, queue state will be persisted at shutdown and reloaded at startup.
        If False, neither will be done.
        """
        assert task_handler, 'Need a task handler function'
        self.__lock = threading.Lock()
        self.__task_handler = task_handler
        self.__queues = {}
        self.automatic_queue_handling = automatic_queue_handling

        tot = self.total_enqueued_tasks()
        if tot:
            log.info('Loaded %d tasks in %s queues', tot, len(self.__queues))

        self.__queue_threads = {}
        if self.automatic_queue_handling:
            for queue_name in self.__queues:  # Launch threads for loaded queues, if any.
                self.__launch_queue_thread(queue_name)

    def __process_queue(self, queue_path):
        while True:
            task = None
            with self.__lock:
                queue = self.__queues[queue_path]
                if queue:
                    peek = queue[0]
                    now = time.time()
                    if peek.scheduled_for <= now:
                        task = queue.pop(0)  # Pop from the beginning; push to the end
            if task:
                self.__task_handler(
                    url=task.url, payload=task.payload,
                    queue_name=task.queue_name,
                    task_name=task.task_name)

            time.sleep(0.01)

    def create_task(self, queue_name, url, payload,
        scheduled_for=None, task_name=None):
        """
        :param queue_name: If the queue does not yet exist in this emulator, it will be created.
        :param payload: A string that will be passed to the handler.
        :param scheduled_for: When this should be delivered. If None or 0, will schedule
        for immediate delivery.
        :param project: Not used in emulator, but used in the real implementation (See tasks_access.py.)
        :param location: Not used in emulator, but used in the real implementation (See tasks_access.py.)
        """
        scheduled_for = scheduled_for or time.time()
        with self.__lock:
            if queue_name not in self.__queues:
                self.__queues[queue_name] = []
                if self.automatic_queue_handling:
                    self.__launch_queue_thread(queue_name)
            queue = self.__queues[queue_name]
            task = Task(
                queue_name, url, payload, scheduled_for=scheduled_for,
                task_name=task_name)
            queue.append(task)
            queue.sort(key=lambda t: t.scheduled_for)

    def __launch_queue_thread(self, queue_name):
        new_thread = threading.Thread(
            target=self.__process_queue,
            name=('Thread-%s' % queue_name), args=[queue_name])
        new_thread.daemon = True
        self.__queue_threads[queue_name] = new_thread
        new_thread.start()

    def total_enqueued_tasks(self):
        return sum(len(q) for q in self.__queues.values())

    def get_number_of_tasks(self, queue_name=None):
        if queue_name and queue_name in self.__queues:
            return len(self.__queues[queue_name])
        else:
            return self.total_enqueued_tasks()

    def _execute_tasks(self, task_list=[]):
        for task in task_list:
            self.__task_handler(
                url=task.url, payload=task.payload,
                queue_name=task.queue_name,
                task_name=task.task_name)

    def process_and_flush_tasks(self, queue_name=None):
        if queue_name and queue_name in self.__queues:
            self._execute_tasks(self.__queues[queue_name])
            self.__queues[queue_name] = []
        else:
            for queue_name, task_list in self.__queues.items():
                self._execute_tasks(task_list)
                self.__queues[queue_name] = []

    def get_tasks(self, queue_name):
        if queue_name in self.__queues:
            return self.__queues[queue_name]
        else:
            tasks_list = []
            for queue_name, task_list in self.__queues.items():
                tasks_list.extend(task_list)
