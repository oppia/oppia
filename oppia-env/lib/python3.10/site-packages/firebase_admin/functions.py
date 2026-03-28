# Copyright 2024 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Firebase Functions module."""

from __future__ import annotations
from datetime import datetime, timedelta
from urllib import parse
import re
import json
from base64 import b64encode
from typing import Any, Optional, Dict
from dataclasses import dataclass
from google.auth.compute_engine import Credentials as ComputeEngineCredentials

import requests
import firebase_admin
from firebase_admin import App
from firebase_admin import _http_client
from firebase_admin import _utils

_FUNCTIONS_ATTRIBUTE = '_functions'

__all__ = [
    'TaskOptions',

    'task_queue',
]


_CLOUD_TASKS_API_RESOURCE_PATH = \
    'projects/{project_id}/locations/{location_id}/queues/{resource_id}/tasks'
_CLOUD_TASKS_API_URL_FORMAT = \
    'https://cloudtasks.googleapis.com/v2/' + _CLOUD_TASKS_API_RESOURCE_PATH
_FIREBASE_FUNCTION_URL_FORMAT = \
    'https://{location_id}-{project_id}.cloudfunctions.net/{resource_id}'

_FUNCTIONS_HEADERS = {
    'X-GOOG-API-FORMAT-VERSION': '2',
    'X-FIREBASE-CLIENT': 'fire-admin-python/{0}'.format(firebase_admin.__version__),
}

# Default canonical location ID of the task queue.
_DEFAULT_LOCATION = 'us-central1'

def _get_functions_service(app) -> _FunctionsService:
    return _utils.get_app_service(app, _FUNCTIONS_ATTRIBUTE, _FunctionsService)

def task_queue(
        function_name: str,
        extension_id: Optional[str] = None,
        app: Optional[App] = None
    ) -> TaskQueue:
    """Creates a reference to a TaskQueue for a given function name.

    The function name can be either:
        1. A fully qualified function resource name:
            `projects/{project-id}/locations/{location-id}/functions/{function-name}`

        2. A partial resource name with location and function name, in which case
            the runtime project ID is used:
            `locations/{location-id}/functions/{function-name}`

        3. A partial function name, in which case the runtime project ID and the
            default location, `us-central1`, is used:
            `{function-name}`

    Args:
        function_name: Name of the function.
        extension_id: Firebase extension ID (optional).
        app: An App instance (optional).

    Returns:
        TaskQueue: A TaskQueue instance.

    Raises:
        ValueError: If the input arguments are invalid.
    """
    return _get_functions_service(app).task_queue(function_name, extension_id)

class _FunctionsService:
    """Service class that implements Firebase Functions functionality."""
    def __init__(self, app: App):
        self._project_id = app.project_id
        if not self._project_id:
            raise ValueError(
                'Project ID is required to access the Cloud Functions service. Either set the '
                'projectId option, or use service account credentials. Alternatively, set the '
                'GOOGLE_CLOUD_PROJECT environment variable.')

        self._credential = app.credential.get_credential()
        self._http_client = _http_client.JsonHttpClient(credential=self._credential)

    def task_queue(self, function_name: str, extension_id: Optional[str] = None) -> TaskQueue:
        """Creates a TaskQueue instance."""
        return TaskQueue(
            function_name, extension_id, self._project_id, self._credential, self._http_client)

    @classmethod
    def handle_functions_error(cls, error: Any):
        """Handles errors received from the Cloud Functions API."""

        return _utils.handle_platform_error_from_requests(error)

class TaskQueue:
    """TaskQueue class that implements Firebase Cloud Tasks Queues functionality."""
    def __init__(
            self,
            function_name: str,
            extension_id: Optional[str],
            project_id,
            credential,
            http_client
        ) -> None:

        # Validate function_name
        _Validators.check_non_empty_string('function_name', function_name)

        self._project_id = project_id
        self._credential = credential
        self._http_client = http_client
        self._function_name = function_name
        self._extension_id = extension_id
        # Parse resources from function_name
        self._resource = self._parse_resource_name(self._function_name, 'functions')

        # Apply defaults and validate resource_id
        self._resource.project_id = self._resource.project_id or self._project_id
        self._resource.location_id = self._resource.location_id or _DEFAULT_LOCATION
        _Validators.check_non_empty_string('resource.resource_id', self._resource.resource_id)
        # Validate extension_id if provided and edit resources depending
        if self._extension_id is not None:
            _Validators.check_non_empty_string('extension_id', self._extension_id)
            self._resource.resource_id = f'ext-{self._extension_id}-{self._resource.resource_id}'


    def enqueue(self, task_data: Any, opts: Optional[TaskOptions] = None) -> str:
        """Creates a task and adds it to the queue. Tasks cannot be updated after creation.

        This action requires `cloudtasks.tasks.create` IAM permission on the service account.

        Args:
            task_data: The data payload of the task.
            opts: Options when enqueuing a new task (optional).

        Raises:
            FirebaseError: If an error occurs while requesting the task to be queued by
                the Cloud Functions service.
            ValueError: If the input arguments are invalid.

        Returns:
            str: The ID of the task relative to this queue.
        """
        task = self._validate_task_options(task_data, self._resource, opts)
        service_url = self._get_url(self._resource, _CLOUD_TASKS_API_URL_FORMAT)
        task_payload = self._update_task_payload(task, self._resource, self._extension_id)
        try:
            resp = self._http_client.body(
                'post',
                url=service_url,
                headers=_FUNCTIONS_HEADERS,
                json={'task': task_payload.__dict__}
            )
            task_name = resp.get('name', None)
            task_resource = \
                self._parse_resource_name(task_name, f'queues/{self._resource.resource_id}/tasks')
            return task_resource.resource_id
        except requests.exceptions.RequestException as error:
            raise _FunctionsService.handle_functions_error(error)

    def delete(self, task_id: str) -> None:
        """Deletes an enqueued task if it has not yet started.

        This action requires `cloudtasks.tasks.delete` IAM permission on the service account.

        Args:
            task_id: The ID of the task relative to this queue.

        Raises:
            FirebaseError: If an error occurs while requesting the task to be deleted by
                the Cloud Functions service.
            ValueError: If the input arguments are invalid.
        """
        _Validators.check_non_empty_string('task_id', task_id)
        service_url = self._get_url(self._resource, _CLOUD_TASKS_API_URL_FORMAT + f'/{task_id}')
        try:
            self._http_client.body(
                'delete',
                url=service_url,
                headers=_FUNCTIONS_HEADERS,
            )
        except requests.exceptions.RequestException as error:
            raise _FunctionsService.handle_functions_error(error)


    def _parse_resource_name(self, resource_name: str, resource_id_key: str) -> Resource:
        """Parses a full or partial resource path into a ``Resource``."""
        if '/' not in resource_name:
            return Resource(resource_id=resource_name)

        reg = f'^(projects/([^/]+)/)?locations/([^/]+)/{resource_id_key}/([^/]+)$'
        match = re.search(reg, resource_name)
        if match is None:
            raise ValueError('Invalid resource name format.')
        return Resource(project_id=match[2], location_id=match[3], resource_id=match[4])

    def _get_url(self, resource: Resource, url_format: str) -> str:
        """Generates url path from a ``Resource`` and url format string."""
        return url_format.format(
            project_id=resource.project_id,
            location_id=resource.location_id,
            resource_id=resource.resource_id)

    def _validate_task_options(
            self,
            data: Any,
            resource: Resource,
            opts: Optional[TaskOptions] = None
        ) -> Task:
        """Validate and create a Task from optional ``TaskOptions``."""
        task_http_request = {
            'url': '',
            'oidc_token': {
                'service_account_email': ''
            },
            'body': b64encode(json.dumps(data).encode()).decode(),
            'headers': {
                'Content-Type': 'application/json',
            }
        }
        task = Task(http_request=task_http_request)

        if opts is not None:
            if opts.headers is not None:
                task.http_request['headers'] = {**task.http_request['headers'], **opts.headers}
            if opts.schedule_time is not None and opts.schedule_delay_seconds is not None:
                raise ValueError(
                    'Both sechdule_delay_seconds and schedule_time cannot be set at the same time.')
            if opts.schedule_time is not None and opts.schedule_delay_seconds is None:
                if not isinstance(opts.schedule_time, datetime):
                    raise ValueError('schedule_time should be UTC datetime.')
                task.schedule_time = opts.schedule_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            if opts.schedule_delay_seconds is not None and opts.schedule_time is None:
                if not isinstance(opts.schedule_delay_seconds, int) \
                or opts.schedule_delay_seconds < 0:
                    raise ValueError('schedule_delay_seconds should be positive int.')
                schedule_time = datetime.utcnow() + timedelta(seconds=opts.schedule_delay_seconds)
                task.schedule_time = schedule_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            if opts.dispatch_deadline_seconds is not None:
                if not isinstance(opts.dispatch_deadline_seconds, int) \
                or opts.dispatch_deadline_seconds < 15 \
                or opts.dispatch_deadline_seconds > 1800:
                    raise ValueError(
                        'dispatch_deadline_seconds should be int in the range of 15s to '
                        '1800s (30 mins).')
                task.dispatch_deadline = f'{opts.dispatch_deadline_seconds}s'
            if opts.task_id is not None:
                if not _Validators.is_task_id(opts.task_id):
                    raise ValueError(
                        'task_id can contain only letters ([A-Za-z]), numbers ([0-9]), hyphens (-)'
                        ', or underscores (_). The maximum length is 500 characters.')
                task.name = self._get_url(
                    resource, _CLOUD_TASKS_API_RESOURCE_PATH + f'/{opts.task_id}')
            if opts.uri is not None:
                if not _Validators.is_url(opts.uri):
                    raise ValueError(
                        'uri must be a valid RFC3986 URI string using the https or http schema.')
                task.http_request['url'] = opts.uri
        return task

    def _update_task_payload(self, task: Task, resource: Resource, extension_id: str) -> Task:
        """Prepares task to be sent with credentials."""
        # Get function url from task or generate from resources
        if not _Validators.is_non_empty_string(task.http_request['url']):
            task.http_request['url'] = self._get_url(resource, _FIREBASE_FUNCTION_URL_FORMAT)
        # If extension id is provided, it emplies that it is being run from a deployed extension.
        # Meaning that it's credential should be a Compute Engine Credential.
        if _Validators.is_non_empty_string(extension_id) and \
            isinstance(self._credential, ComputeEngineCredentials):

            id_token = self._credential.token
            task.http_request['headers'] = \
                {**task.http_request['headers'], 'Authorization': f'Bearer ${id_token}'}
            # Delete oidc token
            del task.http_request['oidc_token']
        else:
            task.http_request['oidc_token'] = \
                {'service_account_email': self._credential.service_account_email}
        return task


class _Validators:
    """A collection of data validation utilities."""
    @classmethod
    def check_non_empty_string(cls, label: str, value: Any):
        """Checks if given value is a non-empty string and throws error if not."""
        if not isinstance(value, str):
            raise ValueError('{0} "{1}" must be a string.'.format(label, value))
        if value == '':
            raise ValueError('{0} "{1}" must be a non-empty string.'.format(label, value))

    @classmethod
    def is_non_empty_string(cls, value: Any):
        """Checks if given value is a non-empty string and returns bool."""
        if not isinstance(value, str) or value == '':
            return False
        return True

    @classmethod
    def is_task_id(cls, task_id: Any):
        """Checks if given value is a valid task id."""
        reg = '^[A-Za-z0-9_-]+$'
        if re.match(reg, task_id) is not None and len(task_id) <= 500:
            return True
        return False

    @classmethod
    def is_url(cls, url: Any):
        """Checks if given value is a valid url."""
        if not isinstance(url, str):
            return False
        try:
            parsed = parse.urlparse(url)
            if not parsed.netloc or parsed.scheme not in ['http', 'https']:
                return False
            return True
        except Exception:   # pylint: disable=broad-except
            return False


@dataclass
class TaskOptions:
    """Task Options that can be applied to a Task.

    Args:
        schedule_delay_seconds: The number of seconds after the current time at which to attempt or
            retry the task. Should only be set if ``schedule_time`` is not set.

        schedule_time: The time when the task is scheduled to be attempted or retried. Should only
            be set if ``schedule_delay_seconds`` is not set.

        dispatch_deadline_seconds: The deadline for requests sent to the worker. If the worker does
            not respond by this deadline then the request is cancelled and the attempt is marked as
            a ``DEADLINE_EXCEEDED`` failure. Cloud Tasks will retry the task according to the
            ``RetryConfig``. The default is 10 minutes. The deadline must be in the range of 15
            seconds and 30 minutes (1800 seconds).

        task_id: The ID to use for the enqueued task. If not provided, one will be automatically
            generated.

            If provided, an explicitly specified task ID enables task de-duplication.
            Task IDs should be strings that contain only letters ([A-Za-z]), numbers ([0-9]),
            hyphens (-), and underscores (_) with a maximum length of 500 characters. If a task's
            ID is identical to that of an existing task or a task that was deleted or executed
            recently then the call will throw an error with code `functions/task-already-exists`.
            Another task with the same ID can't be created for ~1hour after the original task was
            deleted or executed.

            Because there is an extra lookup cost to identify duplicate task IDs, setting ID
            significantly increases latency.

            Also, note that the infrastructure relies on an approximately uniform distribution
            of task IDs to store and serve tasks efficiently. For this reason, using hashed strings
            for the task ID or for the prefix of the task ID is recommended. Choosing task IDs that
            are sequential or have sequential prefixes, for example using a timestamp, causes an
            increase in latency and error rates in all task commands.

            Push IDs from the Firebase Realtime Database make poor IDs because they are based on
            timestamps and will cause contention (slowdowns) in your task queue. Reversed push IDs
            however form a perfect distribution and are an ideal key. To reverse a string in Python
            use ``reversedString = someString[::-1]``

        headers: HTTP request headers to include in the request to the task queue function. These
            headers represent a subset of the headers that will accompany the task's HTTP request.
            Some HTTP request headers will be ignored or replaced: `Authorization`, `Host`,
            `Content-Length`, `User-Agent` and others cannot be overridden.

            A complete list of these ignored or replaced headers can be found in the following
            definition of the HttpRequest.headers property:
            https://cloud.google.com/tasks/docs/reference/rest/v2/projects.locations.queues.tasks#httprequest

            By default, Content-Type is set to 'application/json'.

            The size of the headers must be less than 80KB.

        uri: The full URL that the request will be sent to. Must be a valid RFC3986 https or
            http URL.
    """
    schedule_delay_seconds: Optional[int] = None
    schedule_time: Optional[datetime] = None
    dispatch_deadline_seconds: Optional[int] = None
    task_id: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    uri: Optional[str] = None

@dataclass
class Task:
    """Contains the relevant fields for enqueueing tasks that trigger Cloud Functions.

    This is a limited subset of the Cloud Functions `Task` resource. See the following
    page for definitions of this class's properties:
    https://cloud.google.com/tasks/docs/reference/rest/v2/projects.locations.queues.tasks#resource:-task

    Args:
        httpRequest: The request to be made by the task worker.
        name: The name of the function. See the Cloud docs for the format of this property.
        schedule_time: The time when the task is scheduled to be attempted or retried.
        dispatch_deadline: The deadline for requests sent to the worker.
    """
    http_request: Dict[str, Optional[str | dict]]
    name: Optional[str] = None
    schedule_time: Optional[str] = None
    dispatch_deadline: Optional[str] = None


@dataclass
class Resource:
    """Contains the parsed address of a resource.

    Args:
        resource_id: The ID of the resource.
        project_id: The project ID of the resource.
        location_id: The location ID of the resource.
    """
    resource_id: str
    project_id: Optional[str] = None
    location_id: Optional[str] = None
