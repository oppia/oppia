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

from __future__ import annotations

import os

from core import feconf
from core.platform.taskqueue import cloud_tasks_emulator

import requests
from typing import TYPE_CHECKING, Any, Dict, Optional

if TYPE_CHECKING:  # pragma: no cover
    import datetime

GOOGLE_APP_ENGINE_PORT = os.environ['PORT'] if 'PORT' in os.environ else '8181'


# Here we use type Any because the payload here has no constraints, so that's
# why payload is annotated with 'Dict[str, Any]' type.
def _task_handler(
        url: str,
        payload: Dict[str, Any],
        queue_name: str,
        task_name: Optional[str] = None
) -> None:
    """Makes a POST request to the task URL.

    Args:
        url: str. URL of the handler function.
        payload: dict(str : *). Payload to pass to the request. Defaults
            to None if no payload is required.
        queue_name: str. The name of the queue to add the task to.
        task_name: str|None. Optional. The name of the task.
    """
    headers: Dict[str, str] = {}
    headers['X-Appengine-QueueName'] = queue_name
    headers['X-Appengine-TaskName'] = task_name or 'task_without_name'
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


# Here we use type Any because the payload here has no constraints, so that's
# why payload is annotated with 'Dict[str, Any]' type.
def create_http_task(
        queue_name: str,
        url: str,
        payload: Optional[Dict[str, Any]] = None,
        scheduled_for: Optional[datetime.datetime] = None,
        task_name: Optional[str] = None
) -> None:
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
        queue_name, url, payload=payload, scheduled_for=scheduled_for,
        task_name=task_name)
