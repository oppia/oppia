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

'''Provides functionality for Google Cloud Tasks-related operations.'''

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json
from google.cloud import tasks_v2
from google.protobuf import timestamp_pb2

import feconf

client = tasks_v2.CloudTasksClient()
def create_http_task(
    queue_name, url, payload=None, scheduled_for=None, task_name=None
):
    parent = client.queue_path(
        feconf.OPPIA_PROJECT_ID, feconf.GOOGLE_APP_ENGINE_REGION, queue_name)

    # Construct the request body.
    task = {
        'http_request': {  # Specify the type of request.
            'http_method': tasks_v2.HttpMethod.POST,
            'url': url,  # The full url path that the task will be sent to.
        }
    }

    if payload is not None:
        if isinstance(payload, dict):
            # Convert dict to JSON string
            payload = json.dumps(payload)
            # specify http content-type to application/json
            task['http_request']['headers'] = {
                'Content-type': 'application/json'
            }

        # The API expects a payload of type bytes.
        converted_payload = payload.encode()

        # Add the payload to the request.
        task['http_request']['body'] = converted_payload

    if scheduled_for is not None:
        # Convert 'seconds from now' into an rfc3339 datetime string.
        d = datetime.datetime.utcnow() + datetime.timedelta(seconds=scheduled_for)

        # Create Timestamp protobuf.
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromDatetime(d)

        # Add the timestamp to the tasks.
        task['schedule_time'] = timestamp

    if task_name is not None:
        # Add the name to tasks.
        task['name'] = task_name

    # Use the client to build and send the task.
    response = client.create_task(request={'parent': parent, 'task': task})

    print('Created task {}'.format(response.name))
    # [END cloud_tasks_create_http_task]
    return response
