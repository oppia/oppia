# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
#
from google.cloud.tasks import gapic_version as package_version

__version__ = package_version.__version__


from google.cloud.tasks_v2.services.cloud_tasks.async_client import (
    CloudTasksAsyncClient,
)
from google.cloud.tasks_v2.services.cloud_tasks.client import CloudTasksClient
from google.cloud.tasks_v2.types.cloudtasks import (
    CreateQueueRequest,
    CreateTaskRequest,
    DeleteQueueRequest,
    DeleteTaskRequest,
    GetQueueRequest,
    GetTaskRequest,
    ListQueuesRequest,
    ListQueuesResponse,
    ListTasksRequest,
    ListTasksResponse,
    PauseQueueRequest,
    PurgeQueueRequest,
    ResumeQueueRequest,
    RunTaskRequest,
    UpdateQueueRequest,
)
from google.cloud.tasks_v2.types.queue import (
    Queue,
    RateLimits,
    RetryConfig,
    StackdriverLoggingConfig,
)
from google.cloud.tasks_v2.types.target import (
    AppEngineHttpRequest,
    AppEngineRouting,
    HttpMethod,
    HttpRequest,
    OAuthToken,
    OidcToken,
)
from google.cloud.tasks_v2.types.task import Attempt, Task

__all__ = (
    "CloudTasksClient",
    "CloudTasksAsyncClient",
    "CreateQueueRequest",
    "CreateTaskRequest",
    "DeleteQueueRequest",
    "DeleteTaskRequest",
    "GetQueueRequest",
    "GetTaskRequest",
    "ListQueuesRequest",
    "ListQueuesResponse",
    "ListTasksRequest",
    "ListTasksResponse",
    "PauseQueueRequest",
    "PurgeQueueRequest",
    "ResumeQueueRequest",
    "RunTaskRequest",
    "UpdateQueueRequest",
    "Queue",
    "RateLimits",
    "RetryConfig",
    "StackdriverLoggingConfig",
    "AppEngineHttpRequest",
    "AppEngineRouting",
    "HttpRequest",
    "OAuthToken",
    "OidcToken",
    "HttpMethod",
    "Attempt",
    "Task",
)
