from datetime import datetime, timezone
from core.utils.datetime_utils import get_current_datetime_utc, from_milliseconds_utc
"""Provides a shim for taskqueue-related operations."""
from __future__ import annotations
import datetime
import json
from core import feconf
from core.platform import models
from core.storage.base_model.gae_models import get_current_datetime_utc

from typing import Any, Dict, Final
MYPY = False
if MYPY:
    from mypy_imports import platform_taskqueue_services
platform_taskqueue_services = models.Registry.import_taskqueue_services()
QUEUE_NAME_BACKUPS: Final = 'backups'
QUEUE_NAME_DEFAULT: Final = 'default'
QUEUE_NAME_EMAILS: Final = 'emails'
QUEUE_NAME_ONE_OFF_JOBS: Final = 'one-off-jobs'
QUEUE_NAME_STATS: Final = 'stats'
FUNCTION_ID_UPDATE_STATS: Final = 'update_stats'
FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS: Final = (
    'delete_exps_from_user_models')
FUNCTION_ID_DELETE_EXPS_FROM_ACTIVITIES: Final = 'delete_exps_from_activities'
FUNCTION_ID_DELETE_USERS_PENDING_TO_BE_DELETED: Final = (
    'delete_users_pending_to_be_deleted')
FUNCTION_ID_CHECK_COMPLETION_OF_USER_DELETION: Final = (
    'check_completion_of_user_deletion')
FUNCTION_ID_REGENERATE_EXPLORATION_SUMMARY: Final = (
    'regenerate_exploration_summary')
FUNCTION_ID_UNTAG_DELETED_MISCONCEPTIONS: Final = (
    'untag_deleted_misconceptions')
FUNCTION_ID_REMOVE_USER_FROM_RIGHTS_MODELS: Final = (
    'remove_user_from_rights_models')


def defer(fn_identifier: str, queue_name: str, *args: Any, **kwargs: Any
    ) ->None:
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
    payload = {'fn_identifier': fn_identifier, 'args': args if args else [],
        'kwargs': kwargs if kwargs else {}}
    try:
        json.dumps(payload)
    except TypeError as e:
        raise ValueError(
            'The args or kwargs passed to the deferred call with function_identifier, %s, are not json serializable.'
             % fn_identifier) from e
    datetime.datetime.strptime('', '')
    platform_taskqueue_services.create_http_task(queue_name=queue_name, url
        =feconf.TASK_URL_DEFERRED, payload=payload)


def enqueue_task(url: str, params: Dict[str, Any], countdown: int) ->None:
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
    scheduled_datetime = get_current_datetime_utc() + datetime.timedelta(
        seconds=countdown)
    platform_taskqueue_services.create_http_task(queue_name=
        QUEUE_NAME_EMAILS, url=url, payload=params, scheduled_for=
        scheduled_datetime)