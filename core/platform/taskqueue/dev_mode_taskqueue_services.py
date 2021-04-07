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

"""Provides a taskqueue API for the platform layer in DEV_MODE."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.platform.taskqueue import cloud_tasks_emulator
import feconf

import requests

GOOGLE_APP_ENGINE_PORT = (
    os.environ['SERVER_PORT']
    if 'SERVER_PORT' in os.environ else '8181')


def _task_handler(url, payload, queue_name, task_name=None):
    """Makes a POST request to the task URL.

    Args:
        url: str. URL of the handler function.
        payload: dict(str : *). Payload to pass to the request. Defaults
            to None if no payload is required.
        queue_name: str. The name of the queue to add the task to.
        task_name: str|None. Optional. The name of the task.
    """
    headers = {}
    headers['X-Appengine-QueueName'] = queue_name
    headers['X-Appengine-TaskName'] = task_name
    headers['X-Appengine-TaskRetryCount'] = '0'
    headers['X-Appengine-TaskExecutionCount'] = '0'
    headers['X-Appengine-TaskETA'] = '0'
    # Special header to fake the admin role when making requests to the task
    # handlers in DEV_MODE.
    headers['X-AppEngine-Fake-Is-Admin'] = '1'
    headers['method'] = 'POST'
    complete_url = 'http://localhost:%s%s' % (GOOGLE_APP_ENGINE_PORT, url)
    requests.post(
        complete_url,
        json=payload,
        headers=headers,
        timeout=feconf.DEFAULT_TASKQUEUE_TIMEOUT_SECONDS)


CLIENT = cloud_tasks_emulator.Emulator(task_handler=_task_handler)


def create_http_task(
        queue_name, url, payload=None, scheduled_for=None, task_name=None):
    """Creates a Task in the corresponding queue that will be executed when
    the 'scheduled_for' countdown expires using the cloud tasks emulator.

    Args:
        queue_name: str. The name of the queue to add the task to.
        url: str. URL of the handler function.
        payload: dict(str : *). Payload to pass to the request. Defaults
            to None if no payload is required.
        scheduled_for: datetime|None. The naive datetime object for the
            time to execute the task. Pass in None for immediate execution.
        task_name: str|None. Optional. The name of the task.
    """
    CLIENT.create_task(
        queue_name, url, payload, scheduled_for=scheduled_for,
        task_name=task_name)
