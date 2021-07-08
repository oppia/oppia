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

"""Provides a shim for taskqueue-related operations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json

from core.platform import models
import feconf

platform_taskqueue_services = models.Registry.import_taskqueue_services()


# NOTE: The following constants should match the queue names in queue.yaml.
# Taskqueue for backing up state.
QUEUE_NAME_BACKUPS = 'backups'
# Default queue for processing tasks (including MapReduce ones).
QUEUE_NAME_DEFAULT = 'default'
# Taskqueue for sending email.
QUEUE_NAME_EMAILS = 'emails'
# Taskqueue for running one-off jobs.
QUEUE_NAME_ONE_OFF_JOBS = 'one-off-jobs'
# Taskqueue for updating stats models.
QUEUE_NAME_STATS = 'stats'

# Function identifiers inform the deferred task handler of which deferred
# function should be run for the relevant task.
# NOTE for developers: If you want to defer a function (i.e. run it
# asynchronously), please visit the file core/controllers/tasks.py, and check
# the DeferredTasksHandler.
# 1. If the function you want to defer already exists in the handler, choose the
#    correct FUNCTION_ID and defer the function using that FUNCTION_ID.
# 2. If the function does not exist in the handler, add it to the handler and
#    add another FUNCTION_ID to this list.
FUNCTION_ID_UPDATE_STATS = 'update_stats'
FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS = 'delete_exps_from_user_models'
FUNCTION_ID_DELETE_EXPS_FROM_ACTIVITIES = 'delete_exps_from_activities'
FUNCTION_ID_DELETE_USERS_PENDING_TO_BE_DELETED = (
    'delete_users_pending_to_be_deleted')
FUNCTION_ID_CHECK_COMPLETION_OF_USER_DELETION = (
    'check_completion_of_user_deletion')
FUNCTION_ID_REGENERATE_EXPLORATION_SUMMARY = 'regenerate_exploration_summary'
FUNCTION_ID_UNTAG_DELETED_MISCONCEPTIONS = 'untag_deleted_misconceptions'
FUNCTION_ID_REMOVE_USER_FROM_RIGHTS_MODELS = 'remove_user_from_rights_models'


def defer(fn_identifier, queue_name, *args, **kwargs):
    """Adds a new task to a specified deferred queue scheduled for immediate
    execution.

    Args:
        fn_identifier: str. The string identifier of the function being
            deferred.
        queue_name: str. The name of the queue to place the task into. Should be
            one of the QUEUE_NAME_* constants listed above.
        *args: list(*). Positional arguments for fn. Positional arguments
            should be json serializable.
        **kwargs: dict(str : *). Keyword arguments for fn.

    Raises:
        Exception. The arguments and keyword arguments that are passed in are
            not JSON serializable.
    """
    payload = {
        'fn_identifier': fn_identifier,
        'args': (args if args else []),
        'kwargs': (kwargs if kwargs else {})
    }
    try:
        json.dumps(payload)
    except TypeError:
        raise ValueError(
            'The args or kwargs passed to the deferred call with '
            'function_identifier, %s, are not json serializable.' %
            fn_identifier)
    # This is a workaround for a known python bug.
    # See https://bugs.python.org/issue7980
    datetime.datetime.strptime('', '')
    platform_taskqueue_services.create_http_task(
        queue_name=queue_name, url=feconf.TASK_URL_DEFERRED, payload=payload)


def enqueue_task(url, params, countdown):
    """Adds a new task for sending email.

    Args:
        url: str. Url of the handler function.
        params: dict(str : *). Payload to pass to the request. Defaults
            to None if no payload is required.
        countdown: int. Amount of time, in seconds, to wait before executing
            task.

    Raises:
        Exception. The params that are passed in are not JSON serializable.
    """
    try:
        json.dumps(params)
    except TypeError:
        raise ValueError(
            'The params added to the email task call cannot be json serialized')
    scheduled_datetime = datetime.datetime.utcnow() + datetime.timedelta(
        seconds=countdown)
    platform_taskqueue_services.create_http_task(
        queue_name=QUEUE_NAME_EMAILS, url=url, payload=params,
        scheduled_for=scheduled_datetime)
