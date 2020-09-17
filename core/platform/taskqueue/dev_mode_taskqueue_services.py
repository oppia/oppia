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

"""Provides cloud tasks api in DEV_MODE."""

import requests
import requests_toolbelt.adapters.appengine
import feconf
from core.platform.taskqueue import cloud_tasks_emulator

# Special app engine monkey patch. More details can be found here:
# https://cloud.google.com/appengine/docs/standard/python/issue-requests#issuing_an_http_request
requests_toolbelt.adapters.appengine.monkeypatch()


def _task_handler(url, payload, queue_name, task_name=None):
    """Makes a POST request to the task URL

    Args:
        url: str. URL of the handler function.
        payload: dict(str: *)|None. Payload to pass to the request. Defaults
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
    headers['method'] = 'POST'
    resp = requests.post(
        'http://localhost:8181%s' % feconf.TASK_URL_DEFERRED,
        json=payload,
        headers=headers)


client = cloud_tasks_emulator.Emulator(task_handler=_task_handler)


def create_http_task(
        queue_name, url, payload=None, scheduled_for=None, task_name=None):
    """Creates a Task in the corresponding queue that will be executed when
    the 'scheduled_for' countdown expires using the cloud tasks emulator.

    Args:
        queue_name: str. The name of the queue to add the task to.
        url: str. URL of the handler function.
        payload: dict(str: *)|None. Payload to pass to the request. Defaults
            to None if no payload is required.
        scheduled_for: datetime|None. The naive datetime object for the
            time to execute the task. Pass in None for immediate execution.
        task_name: str|None. Optional. The name of the task.
    """
    client.create_task(queue_name, url, payload, scheduled_for, task_name)
