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
from google.cloud.tasks_v2beta3 import gapic_version as package_version

__version__ = package_version.__version__


from .services.cloud_tasks import CloudTasksAsyncClient, CloudTasksClient
from .types.cloudtasks import (
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
from .types.queue import (
    Queue,
    QueueStats,
    RateLimits,
    RetryConfig,
    StackdriverLoggingConfig,
)
from .types.target import (
    AppEngineHttpQueue,
    AppEngineHttpRequest,
    AppEngineRouting,
    HttpMethod,
    HttpRequest,
    HttpTarget,
    OAuthToken,
    OidcToken,
    PathOverride,
    PullMessage,
    QueryOverride,
    UriOverride,
)
from .types.task import Attempt, Task

__all__ = (
    "CloudTasksAsyncClient",
    "AppEngineHttpQueue",
    "AppEngineHttpRequest",
    "AppEngineRouting",
    "Attempt",
    "CloudTasksClient",
    "CreateQueueRequest",
    "CreateTaskRequest",
    "DeleteQueueRequest",
    "DeleteTaskRequest",
    "GetQueueRequest",
    "GetTaskRequest",
    "HttpMethod",
    "HttpRequest",
    "HttpTarget",
    "ListQueuesRequest",
    "ListQueuesResponse",
    "ListTasksRequest",
    "ListTasksResponse",
    "OAuthToken",
    "OidcToken",
    "PathOverride",
    "PauseQueueRequest",
    "PullMessage",
    "PurgeQueueRequest",
    "QueryOverride",
    "Queue",
    "QueueStats",
    "RateLimits",
    "ResumeQueueRequest",
    "RetryConfig",
    "RunTaskRequest",
    "StackdriverLoggingConfig",
    "Task",
    "UpdateQueueRequest",
    "UriOverride",
)
