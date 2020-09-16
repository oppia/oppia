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

'''Provides a seam for taskqueue-related operations.'''

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from google.appengine.api import taskqueue
from google.appengine.ext import deferred
import feconf
import datetime
import json
from core.platform import models

platform_taskqueue_services = models.Registry.import_taskqueue_services()

# Construct the fully qualified queue name.

# NOTE: The following constants should match the queue names in queue.yaml.
# Taskqueue for backing up state.
QUEUE_NAME_BACKUPS = 'backups'
# Taskqueue for running continuous computation jobs.
QUEUE_NAME_CONTINUOUS_JOBS = 'continuous-jobs'
# Default queue for processing tasks (including MapReduce ones).
QUEUE_NAME_DEFAULT = 'default'
# Taskqueue for sending email.
QUEUE_NAME_EMAILS = 'emails'
# Deferred queue for processing events outside the request/response cycle.
QUEUE_NAME_EVENTS = 'events'
# Taskqueue for running one-off jobs.
QUEUE_NAME_ONE_OFF_JOBS = 'one-off-jobs'
# Taskqueue for updating stats models.
QUEUE_NAME_STATS = 'stats'

# Function identifiers that informs the deferred task handler what task is being
# run.
FUNCTION_ID_DISPATCH_EVENT = 'dispatch_event'
FUNCTION_ID_UPDATE_STATS = 'update_stats'
FUNCTION_ID_DELETE_EXPLORATIONS = 'delete_explorations'
FUNCTION_ID_UNTAG_DELETED_MISCONCEPTIONS = 'untag_deleted_misconceptions'


def defer(fn_identifier, queue_name, *args, **kwargs):
    '''Adds a new task to a specified deferred queue.

    Args:
        fn_identifier: str. The string identifier of the function being deferred.
        queue_name: str. The name of the queue to place the task into. Should be
            one of the QUEUE_NAME_* constants listed above.
        *args: list(*). Positional arguments for fn. Positional arguments should
        be json serializable.
        **kwargs: dict(str : *). Keyword arguments for fn.
    '''
    # See https://developers.google.com/appengine/articles/deferred for details
    # on the _queue kwarg.
    print("INNN==========================================")
    payload = {
        'fn_identifier': fn_identifier,
        'args': (args if args else []),
        'kwargs': (kwargs if kwargs else {})
    }
    platform_taskqueue_services.create_http_task(
        queue_name=queue_name, url=feconf.TASK_URL_DEFERRED,
        payload=payload)
    #deferred.defer(fn, *args, _queue=queue_name, **kwargs)


def enqueue_task(url, params, countdown):
    '''Adds a new task for sending email.

    Args:
        url: str. Url of the handler function.
        params: dict(str : *). Parameters that will be passed as payload to
            handler function.
        countdown: int. Amount of time, in seconds, to wait before executing
            task.
    '''
    # See https://googleapis.dev/python/cloudtasks/latest/gapic/v2/api.html for
    # details of various parameters set when adding a new task.
    platform_taskqueue_services.create_http_task(
        queue_name=QUEUE_NAME_EMAILS, url=url, payload=params,
        scheduled_for=countdown)


# A special exception that ensures that the task is not tried again, if it
# fails.
#PermanentTaskFailure = deferred.PermanentTaskFailure
