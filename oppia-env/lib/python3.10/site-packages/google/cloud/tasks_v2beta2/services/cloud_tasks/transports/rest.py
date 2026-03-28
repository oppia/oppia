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
import dataclasses
import json  # type: ignore
import logging
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union
import warnings

from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1, rest_helpers, rest_streaming
from google.api_core import retry as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.requests import AuthorizedSession  # type: ignore
from google.cloud.location import locations_pb2  # type: ignore
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
import google.protobuf
from google.protobuf import empty_pb2  # type: ignore
from google.protobuf import json_format
from requests import __version__ as requests_version

from google.cloud.tasks_v2beta2.types import cloudtasks
from google.cloud.tasks_v2beta2.types import queue
from google.cloud.tasks_v2beta2.types import queue as gct_queue
from google.cloud.tasks_v2beta2.types import task
from google.cloud.tasks_v2beta2.types import task as gct_task

from .base import DEFAULT_CLIENT_INFO as BASE_DEFAULT_CLIENT_INFO
from .rest_base import _BaseCloudTasksRestTransport

try:
    OptionalRetry = Union[retries.Retry, gapic_v1.method._MethodDefault, None]
except AttributeError:  # pragma: NO COVER
    OptionalRetry = Union[retries.Retry, object, None]  # type: ignore

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = logging.getLogger(__name__)

DEFAULT_CLIENT_INFO = gapic_v1.client_info.ClientInfo(
    gapic_version=BASE_DEFAULT_CLIENT_INFO.gapic_version,
    grpc_version=None,
    rest_version=f"requests@{requests_version}",
)

if hasattr(DEFAULT_CLIENT_INFO, "protobuf_runtime_version"):  # pragma: NO COVER
    DEFAULT_CLIENT_INFO.protobuf_runtime_version = google.protobuf.__version__


class CloudTasksRestInterceptor:
    """Interceptor for CloudTasks.

    Interceptors are used to manipulate requests, request metadata, and responses
    in arbitrary ways.
    Example use cases include:
    * Logging
    * Verifying requests according to service or custom semantics
    * Stripping extraneous information from responses

    These use cases and more can be enabled by injecting an
    instance of a custom subclass when constructing the CloudTasksRestTransport.

    .. code-block:: python
        class MyCustomCloudTasksInterceptor(CloudTasksRestInterceptor):
            def pre_acknowledge_task(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_cancel_lease(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_cancel_lease(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_queue(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_task(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_task(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_delete_task(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_get_iam_policy(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_iam_policy(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_queue(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_get_task(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_task(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_lease_tasks(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_lease_tasks(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_queues(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_queues(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_tasks(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_tasks(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_pause_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_pause_queue(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_purge_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_purge_queue(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_renew_lease(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_renew_lease(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_resume_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_resume_queue(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_run_task(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_run_task(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_set_iam_policy(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_set_iam_policy(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_test_iam_permissions(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_test_iam_permissions(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_queue(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_queue(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_upload_queue_yaml(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

        transport = CloudTasksRestTransport(interceptor=MyCustomCloudTasksInterceptor())
        client = CloudTasksClient(transport=transport)


    """

    def pre_acknowledge_task(
        self,
        request: cloudtasks.AcknowledgeTaskRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        cloudtasks.AcknowledgeTaskRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for acknowledge_task

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def pre_cancel_lease(
        self,
        request: cloudtasks.CancelLeaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.CancelLeaseRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for cancel_lease

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_cancel_lease(self, response: task.Task) -> task.Task:
        """Post-rpc interceptor for cancel_lease

        DEPRECATED. Please use the `post_cancel_lease_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_cancel_lease` interceptor runs
        before the `post_cancel_lease_with_metadata` interceptor.
        """
        return response

    def post_cancel_lease_with_metadata(
        self, response: task.Task, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[task.Task, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for cancel_lease

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_cancel_lease_with_metadata`
        interceptor in new development instead of the `post_cancel_lease` interceptor.
        When both interceptors are used, this `post_cancel_lease_with_metadata` interceptor runs after the
        `post_cancel_lease` interceptor. The (possibly modified) response returned by
        `post_cancel_lease` will be passed to
        `post_cancel_lease_with_metadata`.
        """
        return response, metadata

    def pre_create_queue(
        self,
        request: cloudtasks.CreateQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.CreateQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for create_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_create_queue(self, response: gct_queue.Queue) -> gct_queue.Queue:
        """Post-rpc interceptor for create_queue

        DEPRECATED. Please use the `post_create_queue_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_create_queue` interceptor runs
        before the `post_create_queue_with_metadata` interceptor.
        """
        return response

    def post_create_queue_with_metadata(
        self,
        response: gct_queue.Queue,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[gct_queue.Queue, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_queue

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_create_queue_with_metadata`
        interceptor in new development instead of the `post_create_queue` interceptor.
        When both interceptors are used, this `post_create_queue_with_metadata` interceptor runs after the
        `post_create_queue` interceptor. The (possibly modified) response returned by
        `post_create_queue` will be passed to
        `post_create_queue_with_metadata`.
        """
        return response, metadata

    def pre_create_task(
        self,
        request: cloudtasks.CreateTaskRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.CreateTaskRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for create_task

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_create_task(self, response: gct_task.Task) -> gct_task.Task:
        """Post-rpc interceptor for create_task

        DEPRECATED. Please use the `post_create_task_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_create_task` interceptor runs
        before the `post_create_task_with_metadata` interceptor.
        """
        return response

    def post_create_task_with_metadata(
        self, response: gct_task.Task, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[gct_task.Task, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_task

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_create_task_with_metadata`
        interceptor in new development instead of the `post_create_task` interceptor.
        When both interceptors are used, this `post_create_task_with_metadata` interceptor runs after the
        `post_create_task` interceptor. The (possibly modified) response returned by
        `post_create_task` will be passed to
        `post_create_task_with_metadata`.
        """
        return response, metadata

    def pre_delete_queue(
        self,
        request: cloudtasks.DeleteQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.DeleteQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for delete_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def pre_delete_task(
        self,
        request: cloudtasks.DeleteTaskRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.DeleteTaskRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for delete_task

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def pre_get_iam_policy(
        self,
        request: iam_policy_pb2.GetIamPolicyRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        iam_policy_pb2.GetIamPolicyRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_iam_policy

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_get_iam_policy(self, response: policy_pb2.Policy) -> policy_pb2.Policy:
        """Post-rpc interceptor for get_iam_policy

        DEPRECATED. Please use the `post_get_iam_policy_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_get_iam_policy` interceptor runs
        before the `post_get_iam_policy_with_metadata` interceptor.
        """
        return response

    def post_get_iam_policy_with_metadata(
        self,
        response: policy_pb2.Policy,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[policy_pb2.Policy, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_iam_policy

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_get_iam_policy_with_metadata`
        interceptor in new development instead of the `post_get_iam_policy` interceptor.
        When both interceptors are used, this `post_get_iam_policy_with_metadata` interceptor runs after the
        `post_get_iam_policy` interceptor. The (possibly modified) response returned by
        `post_get_iam_policy` will be passed to
        `post_get_iam_policy_with_metadata`.
        """
        return response, metadata

    def pre_get_queue(
        self,
        request: cloudtasks.GetQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.GetQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for get_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_get_queue(self, response: queue.Queue) -> queue.Queue:
        """Post-rpc interceptor for get_queue

        DEPRECATED. Please use the `post_get_queue_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_get_queue` interceptor runs
        before the `post_get_queue_with_metadata` interceptor.
        """
        return response

    def post_get_queue_with_metadata(
        self, response: queue.Queue, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[queue.Queue, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_queue

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_get_queue_with_metadata`
        interceptor in new development instead of the `post_get_queue` interceptor.
        When both interceptors are used, this `post_get_queue_with_metadata` interceptor runs after the
        `post_get_queue` interceptor. The (possibly modified) response returned by
        `post_get_queue` will be passed to
        `post_get_queue_with_metadata`.
        """
        return response, metadata

    def pre_get_task(
        self,
        request: cloudtasks.GetTaskRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.GetTaskRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for get_task

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_get_task(self, response: task.Task) -> task.Task:
        """Post-rpc interceptor for get_task

        DEPRECATED. Please use the `post_get_task_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_get_task` interceptor runs
        before the `post_get_task_with_metadata` interceptor.
        """
        return response

    def post_get_task_with_metadata(
        self, response: task.Task, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[task.Task, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_task

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_get_task_with_metadata`
        interceptor in new development instead of the `post_get_task` interceptor.
        When both interceptors are used, this `post_get_task_with_metadata` interceptor runs after the
        `post_get_task` interceptor. The (possibly modified) response returned by
        `post_get_task` will be passed to
        `post_get_task_with_metadata`.
        """
        return response, metadata

    def pre_lease_tasks(
        self,
        request: cloudtasks.LeaseTasksRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.LeaseTasksRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for lease_tasks

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_lease_tasks(
        self, response: cloudtasks.LeaseTasksResponse
    ) -> cloudtasks.LeaseTasksResponse:
        """Post-rpc interceptor for lease_tasks

        DEPRECATED. Please use the `post_lease_tasks_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_lease_tasks` interceptor runs
        before the `post_lease_tasks_with_metadata` interceptor.
        """
        return response

    def post_lease_tasks_with_metadata(
        self,
        response: cloudtasks.LeaseTasksResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.LeaseTasksResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for lease_tasks

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_lease_tasks_with_metadata`
        interceptor in new development instead of the `post_lease_tasks` interceptor.
        When both interceptors are used, this `post_lease_tasks_with_metadata` interceptor runs after the
        `post_lease_tasks` interceptor. The (possibly modified) response returned by
        `post_lease_tasks` will be passed to
        `post_lease_tasks_with_metadata`.
        """
        return response, metadata

    def pre_list_queues(
        self,
        request: cloudtasks.ListQueuesRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.ListQueuesRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for list_queues

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_list_queues(
        self, response: cloudtasks.ListQueuesResponse
    ) -> cloudtasks.ListQueuesResponse:
        """Post-rpc interceptor for list_queues

        DEPRECATED. Please use the `post_list_queues_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_list_queues` interceptor runs
        before the `post_list_queues_with_metadata` interceptor.
        """
        return response

    def post_list_queues_with_metadata(
        self,
        response: cloudtasks.ListQueuesResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.ListQueuesResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for list_queues

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_list_queues_with_metadata`
        interceptor in new development instead of the `post_list_queues` interceptor.
        When both interceptors are used, this `post_list_queues_with_metadata` interceptor runs after the
        `post_list_queues` interceptor. The (possibly modified) response returned by
        `post_list_queues` will be passed to
        `post_list_queues_with_metadata`.
        """
        return response, metadata

    def pre_list_tasks(
        self,
        request: cloudtasks.ListTasksRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.ListTasksRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for list_tasks

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_list_tasks(
        self, response: cloudtasks.ListTasksResponse
    ) -> cloudtasks.ListTasksResponse:
        """Post-rpc interceptor for list_tasks

        DEPRECATED. Please use the `post_list_tasks_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_list_tasks` interceptor runs
        before the `post_list_tasks_with_metadata` interceptor.
        """
        return response

    def post_list_tasks_with_metadata(
        self,
        response: cloudtasks.ListTasksResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.ListTasksResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for list_tasks

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_list_tasks_with_metadata`
        interceptor in new development instead of the `post_list_tasks` interceptor.
        When both interceptors are used, this `post_list_tasks_with_metadata` interceptor runs after the
        `post_list_tasks` interceptor. The (possibly modified) response returned by
        `post_list_tasks` will be passed to
        `post_list_tasks_with_metadata`.
        """
        return response, metadata

    def pre_pause_queue(
        self,
        request: cloudtasks.PauseQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.PauseQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for pause_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_pause_queue(self, response: queue.Queue) -> queue.Queue:
        """Post-rpc interceptor for pause_queue

        DEPRECATED. Please use the `post_pause_queue_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_pause_queue` interceptor runs
        before the `post_pause_queue_with_metadata` interceptor.
        """
        return response

    def post_pause_queue_with_metadata(
        self, response: queue.Queue, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[queue.Queue, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for pause_queue

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_pause_queue_with_metadata`
        interceptor in new development instead of the `post_pause_queue` interceptor.
        When both interceptors are used, this `post_pause_queue_with_metadata` interceptor runs after the
        `post_pause_queue` interceptor. The (possibly modified) response returned by
        `post_pause_queue` will be passed to
        `post_pause_queue_with_metadata`.
        """
        return response, metadata

    def pre_purge_queue(
        self,
        request: cloudtasks.PurgeQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.PurgeQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for purge_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_purge_queue(self, response: queue.Queue) -> queue.Queue:
        """Post-rpc interceptor for purge_queue

        DEPRECATED. Please use the `post_purge_queue_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_purge_queue` interceptor runs
        before the `post_purge_queue_with_metadata` interceptor.
        """
        return response

    def post_purge_queue_with_metadata(
        self, response: queue.Queue, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[queue.Queue, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for purge_queue

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_purge_queue_with_metadata`
        interceptor in new development instead of the `post_purge_queue` interceptor.
        When both interceptors are used, this `post_purge_queue_with_metadata` interceptor runs after the
        `post_purge_queue` interceptor. The (possibly modified) response returned by
        `post_purge_queue` will be passed to
        `post_purge_queue_with_metadata`.
        """
        return response, metadata

    def pre_renew_lease(
        self,
        request: cloudtasks.RenewLeaseRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.RenewLeaseRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for renew_lease

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_renew_lease(self, response: task.Task) -> task.Task:
        """Post-rpc interceptor for renew_lease

        DEPRECATED. Please use the `post_renew_lease_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_renew_lease` interceptor runs
        before the `post_renew_lease_with_metadata` interceptor.
        """
        return response

    def post_renew_lease_with_metadata(
        self, response: task.Task, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[task.Task, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for renew_lease

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_renew_lease_with_metadata`
        interceptor in new development instead of the `post_renew_lease` interceptor.
        When both interceptors are used, this `post_renew_lease_with_metadata` interceptor runs after the
        `post_renew_lease` interceptor. The (possibly modified) response returned by
        `post_renew_lease` will be passed to
        `post_renew_lease_with_metadata`.
        """
        return response, metadata

    def pre_resume_queue(
        self,
        request: cloudtasks.ResumeQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.ResumeQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for resume_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_resume_queue(self, response: queue.Queue) -> queue.Queue:
        """Post-rpc interceptor for resume_queue

        DEPRECATED. Please use the `post_resume_queue_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_resume_queue` interceptor runs
        before the `post_resume_queue_with_metadata` interceptor.
        """
        return response

    def post_resume_queue_with_metadata(
        self, response: queue.Queue, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[queue.Queue, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for resume_queue

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_resume_queue_with_metadata`
        interceptor in new development instead of the `post_resume_queue` interceptor.
        When both interceptors are used, this `post_resume_queue_with_metadata` interceptor runs after the
        `post_resume_queue` interceptor. The (possibly modified) response returned by
        `post_resume_queue` will be passed to
        `post_resume_queue_with_metadata`.
        """
        return response, metadata

    def pre_run_task(
        self,
        request: cloudtasks.RunTaskRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.RunTaskRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for run_task

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_run_task(self, response: task.Task) -> task.Task:
        """Post-rpc interceptor for run_task

        DEPRECATED. Please use the `post_run_task_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_run_task` interceptor runs
        before the `post_run_task_with_metadata` interceptor.
        """
        return response

    def post_run_task_with_metadata(
        self, response: task.Task, metadata: Sequence[Tuple[str, Union[str, bytes]]]
    ) -> Tuple[task.Task, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for run_task

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_run_task_with_metadata`
        interceptor in new development instead of the `post_run_task` interceptor.
        When both interceptors are used, this `post_run_task_with_metadata` interceptor runs after the
        `post_run_task` interceptor. The (possibly modified) response returned by
        `post_run_task` will be passed to
        `post_run_task_with_metadata`.
        """
        return response, metadata

    def pre_set_iam_policy(
        self,
        request: iam_policy_pb2.SetIamPolicyRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        iam_policy_pb2.SetIamPolicyRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for set_iam_policy

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_set_iam_policy(self, response: policy_pb2.Policy) -> policy_pb2.Policy:
        """Post-rpc interceptor for set_iam_policy

        DEPRECATED. Please use the `post_set_iam_policy_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_set_iam_policy` interceptor runs
        before the `post_set_iam_policy_with_metadata` interceptor.
        """
        return response

    def post_set_iam_policy_with_metadata(
        self,
        response: policy_pb2.Policy,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[policy_pb2.Policy, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for set_iam_policy

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_set_iam_policy_with_metadata`
        interceptor in new development instead of the `post_set_iam_policy` interceptor.
        When both interceptors are used, this `post_set_iam_policy_with_metadata` interceptor runs after the
        `post_set_iam_policy` interceptor. The (possibly modified) response returned by
        `post_set_iam_policy` will be passed to
        `post_set_iam_policy_with_metadata`.
        """
        return response, metadata

    def pre_test_iam_permissions(
        self,
        request: iam_policy_pb2.TestIamPermissionsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        iam_policy_pb2.TestIamPermissionsRequest,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Pre-rpc interceptor for test_iam_permissions

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_test_iam_permissions(
        self, response: iam_policy_pb2.TestIamPermissionsResponse
    ) -> iam_policy_pb2.TestIamPermissionsResponse:
        """Post-rpc interceptor for test_iam_permissions

        DEPRECATED. Please use the `post_test_iam_permissions_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_test_iam_permissions` interceptor runs
        before the `post_test_iam_permissions_with_metadata` interceptor.
        """
        return response

    def post_test_iam_permissions_with_metadata(
        self,
        response: iam_policy_pb2.TestIamPermissionsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        iam_policy_pb2.TestIamPermissionsResponse,
        Sequence[Tuple[str, Union[str, bytes]]],
    ]:
        """Post-rpc interceptor for test_iam_permissions

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_test_iam_permissions_with_metadata`
        interceptor in new development instead of the `post_test_iam_permissions` interceptor.
        When both interceptors are used, this `post_test_iam_permissions_with_metadata` interceptor runs after the
        `post_test_iam_permissions` interceptor. The (possibly modified) response returned by
        `post_test_iam_permissions` will be passed to
        `post_test_iam_permissions_with_metadata`.
        """
        return response, metadata

    def pre_update_queue(
        self,
        request: cloudtasks.UpdateQueueRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[cloudtasks.UpdateQueueRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for update_queue

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_update_queue(self, response: gct_queue.Queue) -> gct_queue.Queue:
        """Post-rpc interceptor for update_queue

        DEPRECATED. Please use the `post_update_queue_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code. This `post_update_queue` interceptor runs
        before the `post_update_queue_with_metadata` interceptor.
        """
        return response

    def post_update_queue_with_metadata(
        self,
        response: gct_queue.Queue,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[gct_queue.Queue, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_queue

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the CloudTasks server but before it is returned to user code.

        We recommend only using this `post_update_queue_with_metadata`
        interceptor in new development instead of the `post_update_queue` interceptor.
        When both interceptors are used, this `post_update_queue_with_metadata` interceptor runs after the
        `post_update_queue` interceptor. The (possibly modified) response returned by
        `post_update_queue` will be passed to
        `post_update_queue_with_metadata`.
        """
        return response, metadata

    def pre_get_location(
        self,
        request: locations_pb2.GetLocationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        locations_pb2.GetLocationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_location

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_get_location(
        self, response: locations_pb2.Location
    ) -> locations_pb2.Location:
        """Post-rpc interceptor for get_location

        Override in a subclass to manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code.
        """
        return response

    def pre_list_locations(
        self,
        request: locations_pb2.ListLocationsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        locations_pb2.ListLocationsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_locations

        Override in a subclass to manipulate the request or metadata
        before they are sent to the CloudTasks server.
        """
        return request, metadata

    def post_list_locations(
        self, response: locations_pb2.ListLocationsResponse
    ) -> locations_pb2.ListLocationsResponse:
        """Post-rpc interceptor for list_locations

        Override in a subclass to manipulate the response
        after it is returned by the CloudTasks server but before
        it is returned to user code.
        """
        return response


@dataclasses.dataclass
class CloudTasksRestStub:
    _session: AuthorizedSession
    _host: str
    _interceptor: CloudTasksRestInterceptor


class CloudTasksRestTransport(_BaseCloudTasksRestTransport):
    """REST backend synchronous transport for CloudTasks.

    Cloud Tasks allows developers to manage the execution of
    background work in their applications.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends JSON representations of protocol buffers over HTTP/1.1
    """

    def __init__(
        self,
        *,
        host: str = "cloudtasks.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        url_scheme: str = "https",
        interceptor: Optional[CloudTasksRestInterceptor] = None,
        api_audience: Optional[str] = None,
    ) -> None:
        """Instantiate the transport.

        Args:
            host (Optional[str]):
                 The hostname to connect to (default: 'cloudtasks.googleapis.com').
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.

            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if ``channel`` is provided.
            scopes (Optional(Sequence[str])): A list of scopes. This argument is
                ignored if ``channel`` is provided.
            client_cert_source_for_mtls (Callable[[], Tuple[bytes, bytes]]): Client
                certificate to configure mutual TLS HTTP channel. It is ignored
                if ``channel`` is provided.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you are developing
                your own client library.
            always_use_jwt_access (Optional[bool]): Whether self signed JWT should
                be used for service account credentials.
            url_scheme: the protocol scheme for the API endpoint.  Normally
                "https", but for testing or local servers,
                "http" can be specified.
        """
        # Run the base constructor
        # TODO(yon-mg): resolve other ctor params i.e. scopes, quota, etc.
        # TODO: When custom host (api_endpoint) is set, `scopes` must *also* be set on the
        # credentials object
        super().__init__(
            host=host,
            credentials=credentials,
            client_info=client_info,
            always_use_jwt_access=always_use_jwt_access,
            url_scheme=url_scheme,
            api_audience=api_audience,
        )
        self._session = AuthorizedSession(
            self._credentials, default_host=self.DEFAULT_HOST
        )
        if client_cert_source_for_mtls:
            self._session.configure_mtls_channel(client_cert_source_for_mtls)
        self._interceptor = interceptor or CloudTasksRestInterceptor()
        self._prep_wrapped_messages(client_info)

    class _AcknowledgeTask(
        _BaseCloudTasksRestTransport._BaseAcknowledgeTask, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.AcknowledgeTask")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.AcknowledgeTaskRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the acknowledge task method over HTTP.

            Args:
                request (~.cloudtasks.AcknowledgeTaskRequest):
                    The request object. Request message for acknowledging a task using
                [AcknowledgeTask][google.cloud.tasks.v2beta2.CloudTasks.AcknowledgeTask].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseAcknowledgeTask._get_http_options()
            )

            request, metadata = self._interceptor.pre_acknowledge_task(
                request, metadata
            )
            transcoded_request = _BaseCloudTasksRestTransport._BaseAcknowledgeTask._get_transcoded_request(
                http_options, request
            )

            body = _BaseCloudTasksRestTransport._BaseAcknowledgeTask._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseCloudTasksRestTransport._BaseAcknowledgeTask._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.AcknowledgeTask",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "AcknowledgeTask",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._AcknowledgeTask._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

    class _CancelLease(
        _BaseCloudTasksRestTransport._BaseCancelLease, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.CancelLease")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.CancelLeaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> task.Task:
            r"""Call the cancel lease method over HTTP.

            Args:
                request (~.cloudtasks.CancelLeaseRequest):
                    The request object. Request message for canceling a lease using
                [CancelLease][google.cloud.tasks.v2beta2.CloudTasks.CancelLease].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.task.Task:
                    A unit of scheduled work.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseCancelLease._get_http_options()
            )

            request, metadata = self._interceptor.pre_cancel_lease(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseCancelLease._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseCancelLease._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseCancelLease._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.CancelLease",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "CancelLease",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._CancelLease._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = task.Task()
            pb_resp = task.Task.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_cancel_lease(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_cancel_lease_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = task.Task.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.cancel_lease",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "CancelLease",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateQueue(
        _BaseCloudTasksRestTransport._BaseCreateQueue, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.CreateQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.CreateQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> gct_queue.Queue:
            r"""Call the create queue method over HTTP.

            Args:
                request (~.cloudtasks.CreateQueueRequest):
                    The request object. Request message for
                [CreateQueue][google.cloud.tasks.v2beta2.CloudTasks.CreateQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.gct_queue.Queue:
                    A queue is a container of related
                tasks. Queues are configured to manage
                how those tasks are dispatched.
                Configurable properties include rate
                limits, retry options, target types, and
                others.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseCreateQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseCreateQueue._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseCreateQueue._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseCreateQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.CreateQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "CreateQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._CreateQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = gct_queue.Queue()
            pb_resp = gct_queue.Queue.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_queue(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_queue_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = gct_queue.Queue.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.create_queue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "CreateQueue",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateTask(_BaseCloudTasksRestTransport._BaseCreateTask, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.CreateTask")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.CreateTaskRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> gct_task.Task:
            r"""Call the create task method over HTTP.

            Args:
                request (~.cloudtasks.CreateTaskRequest):
                    The request object. Request message for
                [CreateTask][google.cloud.tasks.v2beta2.CloudTasks.CreateTask].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.gct_task.Task:
                    A unit of scheduled work.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseCreateTask._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_task(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseCreateTask._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseCreateTask._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseCreateTask._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.CreateTask",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "CreateTask",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._CreateTask._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = gct_task.Task()
            pb_resp = gct_task.Task.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_task(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_task_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = gct_task.Task.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.create_task",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "CreateTask",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteQueue(
        _BaseCloudTasksRestTransport._BaseDeleteQueue, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.DeleteQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: cloudtasks.DeleteQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete queue method over HTTP.

            Args:
                request (~.cloudtasks.DeleteQueueRequest):
                    The request object. Request message for
                [DeleteQueue][google.cloud.tasks.v2beta2.CloudTasks.DeleteQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseDeleteQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseDeleteQueue._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseDeleteQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.DeleteQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "DeleteQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._DeleteQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

    class _DeleteTask(_BaseCloudTasksRestTransport._BaseDeleteTask, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.DeleteTask")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: cloudtasks.DeleteTaskRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete task method over HTTP.

            Args:
                request (~.cloudtasks.DeleteTaskRequest):
                    The request object. Request message for deleting a task using
                [DeleteTask][google.cloud.tasks.v2beta2.CloudTasks.DeleteTask].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseDeleteTask._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_task(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseDeleteTask._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseDeleteTask._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.DeleteTask",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "DeleteTask",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._DeleteTask._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

    class _GetIamPolicy(
        _BaseCloudTasksRestTransport._BaseGetIamPolicy, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.GetIamPolicy")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: iam_policy_pb2.GetIamPolicyRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> policy_pb2.Policy:
            r"""Call the get iam policy method over HTTP.

            Args:
                request (~.iam_policy_pb2.GetIamPolicyRequest):
                    The request object. Request message for ``GetIamPolicy`` method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.policy_pb2.Policy:
                    An Identity and Access Management (IAM) policy, which
                specifies access controls for Google Cloud resources.

                A ``Policy`` is a collection of ``bindings``. A
                ``binding`` binds one or more ``members``, or
                principals, to a single ``role``. Principals can be user
                accounts, service accounts, Google groups, and domains
                (such as G Suite). A ``role`` is a named list of
                permissions; each ``role`` can be an IAM predefined role
                or a user-created custom role.

                For some types of Google Cloud resources, a ``binding``
                can also specify a ``condition``, which is a logical
                expression that allows access to a resource only if the
                expression evaluates to ``true``. A condition can add
                constraints based on attributes of the request, the
                resource, or both. To learn which resources support
                conditions in their IAM policies, see the `IAM
                documentation <https://cloud.google.com/iam/help/conditions/resource-policies>`__.

                **JSON example:**

                ::

                       {
                         "bindings": [
                           {
                             "role": "roles/resourcemanager.organizationAdmin",
                             "members": [
                               "user:mike@example.com",
                               "group:admins@example.com",
                               "domain:google.com",
                               "serviceAccount:my-project-id@appspot.gserviceaccount.com"
                             ]
                           },
                           {
                             "role": "roles/resourcemanager.organizationViewer",
                             "members": [
                               "user:eve@example.com"
                             ],
                             "condition": {
                               "title": "expirable access",
                               "description": "Does not grant access after Sep 2020",
                               "expression": "request.time <
                               timestamp('2020-10-01T00:00:00.000Z')",
                             }
                           }
                         ],
                         "etag": "BwWWja0YfJA=",
                         "version": 3
                       }

                **YAML example:**

                ::

                       bindings:
                       - members:
                         - user:mike@example.com
                         - group:admins@example.com
                         - domain:google.com
                         - serviceAccount:my-project-id@appspot.gserviceaccount.com
                         role: roles/resourcemanager.organizationAdmin
                       - members:
                         - user:eve@example.com
                         role: roles/resourcemanager.organizationViewer
                         condition:
                           title: expirable access
                           description: Does not grant access after Sep 2020
                           expression: request.time < timestamp('2020-10-01T00:00:00.000Z')
                       etag: BwWWja0YfJA=
                       version: 3

                For a description of IAM and its features, see the `IAM
                documentation <https://cloud.google.com/iam/docs/>`__.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseGetIamPolicy._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_iam_policy(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseGetIamPolicy._get_transcoded_request(
                    http_options, request
                )
            )

            body = (
                _BaseCloudTasksRestTransport._BaseGetIamPolicy._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseGetIamPolicy._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.GetIamPolicy",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetIamPolicy",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._GetIamPolicy._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = policy_pb2.Policy()
            pb_resp = resp

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_iam_policy(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_iam_policy_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.get_iam_policy",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetIamPolicy",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetQueue(_BaseCloudTasksRestTransport._BaseGetQueue, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.GetQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: cloudtasks.GetQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> queue.Queue:
            r"""Call the get queue method over HTTP.

            Args:
                request (~.cloudtasks.GetQueueRequest):
                    The request object. Request message for
                [GetQueue][google.cloud.tasks.v2beta2.CloudTasks.GetQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.queue.Queue:
                    A queue is a container of related
                tasks. Queues are configured to manage
                how those tasks are dispatched.
                Configurable properties include rate
                limits, retry options, target types, and
                others.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseGetQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseGetQueue._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseGetQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.GetQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._GetQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = queue.Queue()
            pb_resp = queue.Queue.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_queue(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_queue_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = queue.Queue.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.get_queue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetQueue",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _GetTask(_BaseCloudTasksRestTransport._BaseGetTask, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.GetTask")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: cloudtasks.GetTaskRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> task.Task:
            r"""Call the get task method over HTTP.

            Args:
                request (~.cloudtasks.GetTaskRequest):
                    The request object. Request message for getting a task using
                [GetTask][google.cloud.tasks.v2beta2.CloudTasks.GetTask].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.task.Task:
                    A unit of scheduled work.
            """

            http_options = _BaseCloudTasksRestTransport._BaseGetTask._get_http_options()

            request, metadata = self._interceptor.pre_get_task(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseGetTask._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseGetTask._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.GetTask",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetTask",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._GetTask._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = task.Task()
            pb_resp = task.Task.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_task(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_task_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = task.Task.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.get_task",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetTask",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _LeaseTasks(_BaseCloudTasksRestTransport._BaseLeaseTasks, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.LeaseTasks")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.LeaseTasksRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> cloudtasks.LeaseTasksResponse:
            r"""Call the lease tasks method over HTTP.

            Args:
                request (~.cloudtasks.LeaseTasksRequest):
                    The request object. Request message for leasing tasks using
                [LeaseTasks][google.cloud.tasks.v2beta2.CloudTasks.LeaseTasks].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.cloudtasks.LeaseTasksResponse:
                    Response message for leasing tasks using
                [LeaseTasks][google.cloud.tasks.v2beta2.CloudTasks.LeaseTasks].

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseLeaseTasks._get_http_options()
            )

            request, metadata = self._interceptor.pre_lease_tasks(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseLeaseTasks._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseLeaseTasks._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseLeaseTasks._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.LeaseTasks",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "LeaseTasks",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._LeaseTasks._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = cloudtasks.LeaseTasksResponse()
            pb_resp = cloudtasks.LeaseTasksResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_lease_tasks(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_lease_tasks_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = cloudtasks.LeaseTasksResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.lease_tasks",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "LeaseTasks",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListQueues(_BaseCloudTasksRestTransport._BaseListQueues, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.ListQueues")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: cloudtasks.ListQueuesRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> cloudtasks.ListQueuesResponse:
            r"""Call the list queues method over HTTP.

            Args:
                request (~.cloudtasks.ListQueuesRequest):
                    The request object. Request message for
                [ListQueues][google.cloud.tasks.v2beta2.CloudTasks.ListQueues].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.cloudtasks.ListQueuesResponse:
                    Response message for
                [ListQueues][google.cloud.tasks.v2beta2.CloudTasks.ListQueues].

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseListQueues._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_queues(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseListQueues._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseListQueues._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.ListQueues",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ListQueues",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._ListQueues._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = cloudtasks.ListQueuesResponse()
            pb_resp = cloudtasks.ListQueuesResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_queues(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_queues_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = cloudtasks.ListQueuesResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.list_queues",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ListQueues",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListTasks(_BaseCloudTasksRestTransport._BaseListTasks, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.ListTasks")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: cloudtasks.ListTasksRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> cloudtasks.ListTasksResponse:
            r"""Call the list tasks method over HTTP.

            Args:
                request (~.cloudtasks.ListTasksRequest):
                    The request object. Request message for listing tasks using
                [ListTasks][google.cloud.tasks.v2beta2.CloudTasks.ListTasks].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.cloudtasks.ListTasksResponse:
                    Response message for listing tasks using
                [ListTasks][google.cloud.tasks.v2beta2.CloudTasks.ListTasks].

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseListTasks._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_tasks(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseListTasks._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseListTasks._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.ListTasks",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ListTasks",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._ListTasks._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = cloudtasks.ListTasksResponse()
            pb_resp = cloudtasks.ListTasksResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_tasks(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_tasks_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = cloudtasks.ListTasksResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.list_tasks",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ListTasks",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _PauseQueue(_BaseCloudTasksRestTransport._BasePauseQueue, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.PauseQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.PauseQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> queue.Queue:
            r"""Call the pause queue method over HTTP.

            Args:
                request (~.cloudtasks.PauseQueueRequest):
                    The request object. Request message for
                [PauseQueue][google.cloud.tasks.v2beta2.CloudTasks.PauseQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.queue.Queue:
                    A queue is a container of related
                tasks. Queues are configured to manage
                how those tasks are dispatched.
                Configurable properties include rate
                limits, retry options, target types, and
                others.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BasePauseQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_pause_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BasePauseQueue._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BasePauseQueue._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BasePauseQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.PauseQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "PauseQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._PauseQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = queue.Queue()
            pb_resp = queue.Queue.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_pause_queue(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_pause_queue_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = queue.Queue.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.pause_queue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "PauseQueue",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _PurgeQueue(_BaseCloudTasksRestTransport._BasePurgeQueue, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.PurgeQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.PurgeQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> queue.Queue:
            r"""Call the purge queue method over HTTP.

            Args:
                request (~.cloudtasks.PurgeQueueRequest):
                    The request object. Request message for
                [PurgeQueue][google.cloud.tasks.v2beta2.CloudTasks.PurgeQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.queue.Queue:
                    A queue is a container of related
                tasks. Queues are configured to manage
                how those tasks are dispatched.
                Configurable properties include rate
                limits, retry options, target types, and
                others.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BasePurgeQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_purge_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BasePurgeQueue._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BasePurgeQueue._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BasePurgeQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.PurgeQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "PurgeQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._PurgeQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = queue.Queue()
            pb_resp = queue.Queue.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_purge_queue(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_purge_queue_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = queue.Queue.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.purge_queue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "PurgeQueue",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _RenewLease(_BaseCloudTasksRestTransport._BaseRenewLease, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.RenewLease")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.RenewLeaseRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> task.Task:
            r"""Call the renew lease method over HTTP.

            Args:
                request (~.cloudtasks.RenewLeaseRequest):
                    The request object. Request message for renewing a lease using
                [RenewLease][google.cloud.tasks.v2beta2.CloudTasks.RenewLease].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.task.Task:
                    A unit of scheduled work.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseRenewLease._get_http_options()
            )

            request, metadata = self._interceptor.pre_renew_lease(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseRenewLease._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseRenewLease._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseRenewLease._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.RenewLease",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "RenewLease",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._RenewLease._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = task.Task()
            pb_resp = task.Task.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_renew_lease(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_renew_lease_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = task.Task.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.renew_lease",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "RenewLease",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ResumeQueue(
        _BaseCloudTasksRestTransport._BaseResumeQueue, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.ResumeQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.ResumeQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> queue.Queue:
            r"""Call the resume queue method over HTTP.

            Args:
                request (~.cloudtasks.ResumeQueueRequest):
                    The request object. Request message for
                [ResumeQueue][google.cloud.tasks.v2beta2.CloudTasks.ResumeQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.queue.Queue:
                    A queue is a container of related
                tasks. Queues are configured to manage
                how those tasks are dispatched.
                Configurable properties include rate
                limits, retry options, target types, and
                others.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseResumeQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_resume_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseResumeQueue._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseResumeQueue._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseResumeQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.ResumeQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ResumeQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._ResumeQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = queue.Queue()
            pb_resp = queue.Queue.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_resume_queue(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_resume_queue_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = queue.Queue.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.resume_queue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ResumeQueue",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _RunTask(_BaseCloudTasksRestTransport._BaseRunTask, CloudTasksRestStub):
        def __hash__(self):
            return hash("CloudTasksRestTransport.RunTask")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.RunTaskRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> task.Task:
            r"""Call the run task method over HTTP.

            Args:
                request (~.cloudtasks.RunTaskRequest):
                    The request object. Request message for forcing a task to run now using
                [RunTask][google.cloud.tasks.v2beta2.CloudTasks.RunTask].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.task.Task:
                    A unit of scheduled work.
            """

            http_options = _BaseCloudTasksRestTransport._BaseRunTask._get_http_options()

            request, metadata = self._interceptor.pre_run_task(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseRunTask._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseRunTask._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseRunTask._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.RunTask",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "RunTask",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._RunTask._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = task.Task()
            pb_resp = task.Task.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_run_task(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_run_task_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = task.Task.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.run_task",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "RunTask",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _SetIamPolicy(
        _BaseCloudTasksRestTransport._BaseSetIamPolicy, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.SetIamPolicy")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: iam_policy_pb2.SetIamPolicyRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> policy_pb2.Policy:
            r"""Call the set iam policy method over HTTP.

            Args:
                request (~.iam_policy_pb2.SetIamPolicyRequest):
                    The request object. Request message for ``SetIamPolicy`` method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.policy_pb2.Policy:
                    An Identity and Access Management (IAM) policy, which
                specifies access controls for Google Cloud resources.

                A ``Policy`` is a collection of ``bindings``. A
                ``binding`` binds one or more ``members``, or
                principals, to a single ``role``. Principals can be user
                accounts, service accounts, Google groups, and domains
                (such as G Suite). A ``role`` is a named list of
                permissions; each ``role`` can be an IAM predefined role
                or a user-created custom role.

                For some types of Google Cloud resources, a ``binding``
                can also specify a ``condition``, which is a logical
                expression that allows access to a resource only if the
                expression evaluates to ``true``. A condition can add
                constraints based on attributes of the request, the
                resource, or both. To learn which resources support
                conditions in their IAM policies, see the `IAM
                documentation <https://cloud.google.com/iam/help/conditions/resource-policies>`__.

                **JSON example:**

                ::

                       {
                         "bindings": [
                           {
                             "role": "roles/resourcemanager.organizationAdmin",
                             "members": [
                               "user:mike@example.com",
                               "group:admins@example.com",
                               "domain:google.com",
                               "serviceAccount:my-project-id@appspot.gserviceaccount.com"
                             ]
                           },
                           {
                             "role": "roles/resourcemanager.organizationViewer",
                             "members": [
                               "user:eve@example.com"
                             ],
                             "condition": {
                               "title": "expirable access",
                               "description": "Does not grant access after Sep 2020",
                               "expression": "request.time <
                               timestamp('2020-10-01T00:00:00.000Z')",
                             }
                           }
                         ],
                         "etag": "BwWWja0YfJA=",
                         "version": 3
                       }

                **YAML example:**

                ::

                       bindings:
                       - members:
                         - user:mike@example.com
                         - group:admins@example.com
                         - domain:google.com
                         - serviceAccount:my-project-id@appspot.gserviceaccount.com
                         role: roles/resourcemanager.organizationAdmin
                       - members:
                         - user:eve@example.com
                         role: roles/resourcemanager.organizationViewer
                         condition:
                           title: expirable access
                           description: Does not grant access after Sep 2020
                           expression: request.time < timestamp('2020-10-01T00:00:00.000Z')
                       etag: BwWWja0YfJA=
                       version: 3

                For a description of IAM and its features, see the `IAM
                documentation <https://cloud.google.com/iam/docs/>`__.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseSetIamPolicy._get_http_options()
            )

            request, metadata = self._interceptor.pre_set_iam_policy(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseSetIamPolicy._get_transcoded_request(
                    http_options, request
                )
            )

            body = (
                _BaseCloudTasksRestTransport._BaseSetIamPolicy._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseSetIamPolicy._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.SetIamPolicy",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "SetIamPolicy",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._SetIamPolicy._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = policy_pb2.Policy()
            pb_resp = resp

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_set_iam_policy(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_set_iam_policy_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.set_iam_policy",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "SetIamPolicy",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _TestIamPermissions(
        _BaseCloudTasksRestTransport._BaseTestIamPermissions, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.TestIamPermissions")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: iam_policy_pb2.TestIamPermissionsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> iam_policy_pb2.TestIamPermissionsResponse:
            r"""Call the test iam permissions method over HTTP.

            Args:
                request (~.iam_policy_pb2.TestIamPermissionsRequest):
                    The request object. Request message for ``TestIamPermissions`` method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.iam_policy_pb2.TestIamPermissionsResponse:
                    Response message for ``TestIamPermissions`` method.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseTestIamPermissions._get_http_options()
            )

            request, metadata = self._interceptor.pre_test_iam_permissions(
                request, metadata
            )
            transcoded_request = _BaseCloudTasksRestTransport._BaseTestIamPermissions._get_transcoded_request(
                http_options, request
            )

            body = _BaseCloudTasksRestTransport._BaseTestIamPermissions._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseCloudTasksRestTransport._BaseTestIamPermissions._get_query_params_json(
                transcoded_request
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.TestIamPermissions",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "TestIamPermissions",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._TestIamPermissions._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = iam_policy_pb2.TestIamPermissionsResponse()
            pb_resp = resp

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_test_iam_permissions(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_test_iam_permissions_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.test_iam_permissions",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "TestIamPermissions",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UpdateQueue(
        _BaseCloudTasksRestTransport._BaseUpdateQueue, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.UpdateQueue")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
                data=body,
            )
            return response

        def __call__(
            self,
            request: cloudtasks.UpdateQueueRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> gct_queue.Queue:
            r"""Call the update queue method over HTTP.

            Args:
                request (~.cloudtasks.UpdateQueueRequest):
                    The request object. Request message for
                [UpdateQueue][google.cloud.tasks.v2beta2.CloudTasks.UpdateQueue].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.gct_queue.Queue:
                    A queue is a container of related
                tasks. Queues are configured to manage
                how those tasks are dispatched.
                Configurable properties include rate
                limits, retry options, target types, and
                others.

            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseUpdateQueue._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_queue(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseUpdateQueue._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseCloudTasksRestTransport._BaseUpdateQueue._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseUpdateQueue._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = type(request).to_json(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.UpdateQueue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "UpdateQueue",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._UpdateQueue._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
                body,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            # Return the response
            resp = gct_queue.Queue()
            pb_resp = gct_queue.Queue.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_update_queue(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_queue_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = gct_queue.Queue.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksClient.update_queue",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "UpdateQueue",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _UploadQueueYaml(
        _BaseCloudTasksRestTransport._BaseUploadQueueYaml, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.UploadQueueYaml")

        def __call__(
            self,
            request: cloudtasks.UploadQueueYamlRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            raise NotImplementedError(
                "Method UploadQueueYaml is not available over REST transport"
            )

    @property
    def acknowledge_task(
        self,
    ) -> Callable[[cloudtasks.AcknowledgeTaskRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._AcknowledgeTask(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def cancel_lease(self) -> Callable[[cloudtasks.CancelLeaseRequest], task.Task]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CancelLease(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_queue(
        self,
    ) -> Callable[[cloudtasks.CreateQueueRequest], gct_queue.Queue]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_task(self) -> Callable[[cloudtasks.CreateTaskRequest], gct_task.Task]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateTask(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_queue(
        self,
    ) -> Callable[[cloudtasks.DeleteQueueRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_task(self) -> Callable[[cloudtasks.DeleteTaskRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteTask(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.GetIamPolicyRequest], policy_pb2.Policy]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetIamPolicy(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_queue(self) -> Callable[[cloudtasks.GetQueueRequest], queue.Queue]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_task(self) -> Callable[[cloudtasks.GetTaskRequest], task.Task]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetTask(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def lease_tasks(
        self,
    ) -> Callable[[cloudtasks.LeaseTasksRequest], cloudtasks.LeaseTasksResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._LeaseTasks(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_queues(
        self,
    ) -> Callable[[cloudtasks.ListQueuesRequest], cloudtasks.ListQueuesResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListQueues(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_tasks(
        self,
    ) -> Callable[[cloudtasks.ListTasksRequest], cloudtasks.ListTasksResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListTasks(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def pause_queue(self) -> Callable[[cloudtasks.PauseQueueRequest], queue.Queue]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._PauseQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def purge_queue(self) -> Callable[[cloudtasks.PurgeQueueRequest], queue.Queue]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._PurgeQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def renew_lease(self) -> Callable[[cloudtasks.RenewLeaseRequest], task.Task]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._RenewLease(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def resume_queue(self) -> Callable[[cloudtasks.ResumeQueueRequest], queue.Queue]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ResumeQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def run_task(self) -> Callable[[cloudtasks.RunTaskRequest], task.Task]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._RunTask(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def set_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.SetIamPolicyRequest], policy_pb2.Policy]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._SetIamPolicy(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def test_iam_permissions(
        self,
    ) -> Callable[
        [iam_policy_pb2.TestIamPermissionsRequest],
        iam_policy_pb2.TestIamPermissionsResponse,
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._TestIamPermissions(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_queue(
        self,
    ) -> Callable[[cloudtasks.UpdateQueueRequest], gct_queue.Queue]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateQueue(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def upload_queue_yaml(
        self,
    ) -> Callable[[cloudtasks.UploadQueueYamlRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UploadQueueYaml(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_location(self):
        return self._GetLocation(self._session, self._host, self._interceptor)  # type: ignore

    class _GetLocation(
        _BaseCloudTasksRestTransport._BaseGetLocation, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.GetLocation")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: locations_pb2.GetLocationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> locations_pb2.Location:
            r"""Call the get location method over HTTP.

            Args:
                request (locations_pb2.GetLocationRequest):
                    The request object for GetLocation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                locations_pb2.Location: Response from GetLocation method.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseGetLocation._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_location(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseGetLocation._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseGetLocation._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.GetLocation",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetLocation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._GetLocation._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = locations_pb2.Location()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_get_location(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksAsyncClient.GetLocation",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "GetLocation",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def list_locations(self):
        return self._ListLocations(self._session, self._host, self._interceptor)  # type: ignore

    class _ListLocations(
        _BaseCloudTasksRestTransport._BaseListLocations, CloudTasksRestStub
    ):
        def __hash__(self):
            return hash("CloudTasksRestTransport.ListLocations")

        @staticmethod
        def _get_response(
            host,
            metadata,
            query_params,
            session,
            timeout,
            transcoded_request,
            body=None,
        ):
            uri = transcoded_request["uri"]
            method = transcoded_request["method"]
            headers = dict(metadata)
            headers["Content-Type"] = "application/json"
            response = getattr(session, method)(
                "{host}{uri}".format(host=host, uri=uri),
                timeout=timeout,
                headers=headers,
                params=rest_helpers.flatten_query_params(query_params, strict=True),
            )
            return response

        def __call__(
            self,
            request: locations_pb2.ListLocationsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> locations_pb2.ListLocationsResponse:
            r"""Call the list locations method over HTTP.

            Args:
                request (locations_pb2.ListLocationsRequest):
                    The request object for ListLocations method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                locations_pb2.ListLocationsResponse: Response from ListLocations method.
            """

            http_options = (
                _BaseCloudTasksRestTransport._BaseListLocations._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_locations(request, metadata)
            transcoded_request = (
                _BaseCloudTasksRestTransport._BaseListLocations._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseCloudTasksRestTransport._BaseListLocations._get_query_params_json(
                    transcoded_request
                )
            )

            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                request_url = "{host}{uri}".format(
                    host=self._host, uri=transcoded_request["uri"]
                )
                method = transcoded_request["method"]
                try:
                    request_payload = json_format.MessageToJson(request)
                except:
                    request_payload = None
                http_request = {
                    "payload": request_payload,
                    "requestMethod": method,
                    "requestUrl": request_url,
                    "headers": dict(metadata),
                }
                _LOGGER.debug(
                    f"Sending request for google.cloud.tasks_v2beta2.CloudTasksClient.ListLocations",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ListLocations",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = CloudTasksRestTransport._ListLocations._get_response(
                self._host,
                metadata,
                query_params,
                self._session,
                timeout,
                transcoded_request,
            )

            # In case of error, raise the appropriate core_exceptions.GoogleAPICallError exception
            # subclass.
            if response.status_code >= 400:
                raise core_exceptions.from_http_response(response)

            content = response.content.decode("utf-8")
            resp = locations_pb2.ListLocationsResponse()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_list_locations(resp)
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = json_format.MessageToJson(resp)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.cloud.tasks_v2beta2.CloudTasksAsyncClient.ListLocations",
                    extra={
                        "serviceName": "google.cloud.tasks.v2beta2.CloudTasks",
                        "rpcName": "ListLocations",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def kind(self) -> str:
        return "rest"

    def close(self):
        self._session.close()


__all__ = ("CloudTasksRestTransport",)
