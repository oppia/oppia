# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides functionality for Taskqueue-related operations in dev mode."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import requests
from core.controllers import tasks
from core.platform.taskqueue import cloud_tasks_emulator


def _dev_server_task_handler(url, payload):
    import logging
    logging.info(payload)
    #tasks.DeferredTasksHandler.post()
    requests.post(
        'http://localhost:8181/task/deferredtaskshandler', data=payload)

client = cloud_tasks_emulator.Emulator(
    task_handler=_dev_server_task_handler, hibernation=False)


def create_http_task(
    queue_name, url, payload=None, scheduled_for=None, task_name=None):
    client.create_task(
        queue_name, url, payload, scheduled_for=scheduled_for,
        task_name=task_name)

