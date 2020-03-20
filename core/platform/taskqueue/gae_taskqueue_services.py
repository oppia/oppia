# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Provides a seam for taskqueue-related operations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json

from google.appengine.api import taskqueue
from google.appengine.ext import deferred

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


def defer(fn, queue_name, *args, **kwargs):
    """Adds a new task to a specified deferred queue.

    Args:
        fn: *. The task being deferred. Will be called as: fn(*args, **kwargs).
        queue_name: str. The name of the queue to place the task into. Should be
            one of the QUEUE_NAME_* constants listed above.
        *args: list(*). Positional arguments for fn.
        **kwargs: dict(str : *). Keyword arguments for fn.
    """
    # See https://developers.google.com/appengine/articles/deferred for details
    # on the _queue kwarg.
    deferred.defer(fn, *args, _queue=queue_name, **kwargs)


def enqueue_email_task(url, params, countdown):
    """Adds a new task for sending email.

    Args:
        url: str. url of the handler function.
        params: dict(str : *). parameters that will be passed as payload to
            handler function.
        countdown: int. amount of time, in seconds, to wait before executing
            task.
    """
    # See https://cloud.google.com/appengine/docs/python/taskqueue for
    # details of various parameters set when adding a new task.
    taskqueue.add(
        queue_name=QUEUE_NAME_EMAILS, url=url, payload=json.dumps(params),
        countdown=countdown, target=taskqueue.DEFAULT_APP_VERSION)


# A special exception that ensures that the task is not tried again, if it
# fails.
PermanentTaskFailure = deferred.PermanentTaskFailure
