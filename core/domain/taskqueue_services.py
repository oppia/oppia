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

from __future__ import annotations

import datetime
import json

from core import feconf
from core.domain import cloud_task_domain
from core.platform import models

from typing import Any, Dict, Final, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import cloud_task_models
    from mypy_imports import platform_taskqueue_services

platform_taskqueue_services = models.Registry.import_taskqueue_services()

(cloud_task_models,) = models.Registry.import_models([
    models.Names.CLOUD_TASK])

# NOTE: The following constants should match the queue names on the
# Cloud Tasks UI.
# Taskqueue for backing up state.
QUEUE_NAME_BACKUPS: Final = 'backups'
# Default queue for processing tasks (including MapReduce ones).
QUEUE_NAME_DEFAULT: Final = 'default'
# Taskqueue for sending email.
QUEUE_NAME_EMAILS: Final = 'emails'
# Taskqueue for running one-off jobs.
QUEUE_NAME_ONE_OFF_JOBS: Final = 'one-off-jobs'
# Taskqueue for updating stats models.
QUEUE_NAME_STATS: Final = 'stats'
# Taskqueue for regenerating automatic voiceovers using cloud services.
QUEUE_NAME_VOICEOVER_REGENERATION: Final = 'voiceover-regeneration'

# The maximum number of retries allowed for a cloud task. This results in a
# total of 3 attempts to execute the task, including the first attempt.
CLOUD_TASK_MAX_RETRIES = 2


# Here we use type Any because in defer() function '*args' points to the
# positional arguments of any other function and those arguments can be of
# type str, list, int and other types too. Similarly, '**kwargs' points to
# the keyword arguments of any other function and those can also accept
# different types of values like '*args'.
def defer(
    fn_identifier: str,
    queue_name: str,
    *args: Any,
    **kwargs: Any
) -> None:
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
        ValueError. The arguments and keyword arguments that are passed in are
            not JSON serializable.
    """
    new_cloud_task_model_id = cloud_task_models.CloudTaskRunModel.get_new_id()

    payload = {
        'fn_identifier': fn_identifier,
        'cloud_task_model_id': new_cloud_task_model_id,
        'args': (args if args else []),
        'kwargs': (kwargs if kwargs else {})
    }
    try:
        json.dumps(payload)
    except TypeError as e:
        raise ValueError(
            'The args or kwargs passed to the deferred call with '
            'function_identifier, %s, are not json serializable.' %
            fn_identifier) from e
    # This is a workaround for a known python bug.
    # See https://bugs.python.org/issue7980
    datetime.datetime.strptime('', '')

    task = platform_taskqueue_services.create_http_task(
        queue_name=queue_name, url=feconf.TASK_URL_DEFERRED, payload=payload)
    assert task.name is not None
    cloud_task_model = create_new_cloud_task_model(
        new_cloud_task_model_id, task.name, fn_identifier)
    cloud_task_model.update_timestamps()
    cloud_task_model.put()


# Here we use type Any because the argument 'params' can accept payload
# dictionaries which can hold the values of type string, set, int and
# other types too.
def enqueue_task(url: str, params: Dict[str, Any], countdown: int) -> None:
    """Adds a new task for sending email.

    Args:
        url: str. Url of the handler function.
        params: dict(str : *). Payload to pass to the request. Defaults
            to None if no payload is required.
        countdown: int. Amount of time, in seconds, to wait before executing
            task.

    Raises:
        ValueError. The params that are passed in are not JSON serializable.
    """
    try:
        json.dumps(params)
    except TypeError as e:
        raise ValueError(
            'The params added to the email task call cannot be json serialized'
        ) from e
    scheduled_datetime = datetime.datetime.utcnow() + datetime.timedelta(
        seconds=countdown)
    platform_taskqueue_services.create_http_task(
        queue_name=QUEUE_NAME_EMAILS, url=url, payload=params,
        scheduled_for=scheduled_datetime)


def create_new_cloud_task_model(
    new_model_id: str,
    task_name: str,
    function_id: str
) -> cloud_task_models.CloudTaskRunModel:
    """The function creates a new CloudTaskRunModel with the provided model ID,
    task name, and function ID.

    Args:
        new_model_id: str. The ID for the new CloudTaskRunModel.
        task_name: str. The task name of the cloud task run.
        function_id: str. The ID for the function to be executed.

    Returns:
        CloudTaskRunModel. The newly created CloudTaskRunModel instance.
    """
    return cloud_task_models.CloudTaskRunModel.create_cloud_task_run_model(
        cloud_task_run_model_id=new_model_id,
        cloud_task_name=task_name,
        latest_job_state='PENDING',
        function_id=function_id,
    )


def update_cloud_task_run_model(
    cloud_task_run_domain_instance: cloud_task_domain.CloudTaskRun
) -> None:
    """Updates the CloudTaskRunModel with the latest job state and exception
    messages for failed runs.

    Args:
        cloud_task_run_domain_instance: CloudTaskRun. The updated CloudTaskRun.

    Raises:
        ValueError. If the CloudTaskRunModel with the given ID does not exist.
    """
    cloud_task_model = cloud_task_models.CloudTaskRunModel.get(
        cloud_task_run_domain_instance.task_run_id, strict=False)
    if cloud_task_model is None:
        raise ValueError(
            'CloudTaskRunModel with id %s does not exist.' %
            cloud_task_run_domain_instance.task_run_id)

    cloud_task_model.latest_job_state = (
        cloud_task_run_domain_instance.latest_job_state)
    cloud_task_model.exception_messages_for_failed_runs = (
        cloud_task_run_domain_instance.exception_messages_for_failed_runs)
    cloud_task_model.current_retry_attempt = (
        cloud_task_run_domain_instance.current_retry_attempt)
    cloud_task_model.update_timestamps()
    cloud_task_model.put()


def get_cloud_task_run_by_model_id(
    model_id: str
) -> Optional[cloud_task_domain.CloudTaskRun]:
    """Fetches the CloudTaskRunModel using the provided model_id.

    Args:
        model_id: str. The ID of the CloudTaskRunModel to retrieve.

    Returns:
        CloudTaskRun. The CloudTaskRun instance corresponding to the given
        model_id, or None if no such model exists.
    """
    cloud_task_model = cloud_task_models.CloudTaskRunModel.get(
        model_id, strict=False)

    if cloud_task_model is None:
        return None
    return convert_cloud_task_run_model_to_domain_object(cloud_task_model)


def convert_cloud_task_run_model_to_domain_object(
    cloud_task_model: cloud_task_models.CloudTaskRunModel
) -> cloud_task_domain.CloudTaskRun:
    """Converts a CloudTaskRunModel to a CloudTaskRun domain object.

    Args:
        cloud_task_model: CloudTaskRunModel. The CloudTaskRunModel to convert.

    Returns:
        CloudTaskRun. The CloudTaskRun domain object created from the given
        model.
    """
    model_dict: cloud_task_domain.CloudTaskRunDict = {
        'task_run_id': cloud_task_model.id,
        'cloud_task_name': cloud_task_model.cloud_task_name,
        'task_id': cloud_task_model.task_id,
        'queue_id': cloud_task_model.queue_id,
        'function_id': cloud_task_model.function_id,
        'latest_job_state': cloud_task_model.latest_job_state,
        'exception_messages_for_failed_runs': (
            cloud_task_model.exception_messages_for_failed_runs),
        'current_retry_attempt': cloud_task_model.current_retry_attempt,
        'last_updated': cloud_task_model.last_updated.isoformat(),
        'created_on': cloud_task_model.created_on.isoformat()
    }
    cloud_task_run = cloud_task_domain.CloudTaskRun.from_dict(model_dict)
    return cloud_task_run


def get_cloud_task_run_by_given_params(
    queue_id: str,
    start_datetime: datetime.datetime,
    end_datetime: datetime.datetime
) -> List[cloud_task_domain.CloudTaskRun]:
    """Fetches all CloudTaskRunModels with the given queue ID, start datetime,
    and end datetime.

    Args:
        queue_id: str. The ID of the queue to filter the CloudTaskRunModels.
        start_datetime: datetime.datetime. The start datetime to filter the
            CloudTaskRunModels.
        end_datetime: datetime.datetime. The end datetime to filter the
            CloudTaskRunModels.

    Returns:
        List[CloudTaskRun]. A list of CloudTaskRun domain objects with the
        specified queue ID.
    """
    cloud_task_run_models = cloud_task_models.CloudTaskRunModel.get_by_queue_id(
        queue_id)
    filtered_models = [
            model for model in cloud_task_run_models
            if (
                start_datetime <=
                model.last_updated.replace(tzinfo=datetime.timezone.utc) <=
                end_datetime
            )
        ]
    return [
        convert_cloud_task_run_model_to_domain_object(model)
        for model in filtered_models
    ]
