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
import inspect
import json
import logging as std_logging
import pickle
from typing import Awaitable, Callable, Dict, Optional, Sequence, Tuple, Union
import warnings

from google.api_core import exceptions as core_exceptions
from google.api_core import gapic_v1, grpc_helpers_async
from google.api_core import retry_async as retries
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.grpc import SslCredentials  # type: ignore
from google.cloud.location import locations_pb2  # type: ignore
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from google.protobuf.json_format import MessageToJson
import google.protobuf.message
import grpc  # type: ignore
from grpc.experimental import aio  # type: ignore
import proto  # type: ignore

from google.cloud.tasks_v2.types import cloudtasks
from google.cloud.tasks_v2.types import queue
from google.cloud.tasks_v2.types import queue as gct_queue
from google.cloud.tasks_v2.types import task
from google.cloud.tasks_v2.types import task as gct_task

from .base import DEFAULT_CLIENT_INFO, CloudTasksTransport
from .grpc import CloudTasksGrpcTransport

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = std_logging.getLogger(__name__)


class _LoggingClientAIOInterceptor(
    grpc.aio.UnaryUnaryClientInterceptor
):  # pragma: NO COVER
    async def intercept_unary_unary(self, continuation, client_call_details, request):
        logging_enabled = CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
            std_logging.DEBUG
        )
        if logging_enabled:  # pragma: NO COVER
            request_metadata = client_call_details.metadata
            if isinstance(request, proto.Message):
                request_payload = type(request).to_json(request)
            elif isinstance(request, google.protobuf.message.Message):
                request_payload = MessageToJson(request)
            else:
                request_payload = f"{type(request).__name__}: {pickle.dumps(request)}"

            request_metadata = {
                key: value.decode("utf-8") if isinstance(value, bytes) else value
                for key, value in request_metadata
            }
            grpc_request = {
                "payload": request_payload,
                "requestMethod": "grpc",
                "metadata": dict(request_metadata),
            }
            _LOGGER.debug(
                f"Sending request for {client_call_details.method}",
                extra={
                    "serviceName": "google.cloud.tasks.v2.CloudTasks",
                    "rpcName": str(client_call_details.method),
                    "request": grpc_request,
                    "metadata": grpc_request["metadata"],
                },
            )
        response = await continuation(client_call_details, request)
        if logging_enabled:  # pragma: NO COVER
            response_metadata = await response.trailing_metadata()
            # Convert gRPC metadata `<class 'grpc.aio._metadata.Metadata'>` to list of tuples
            metadata = (
                dict([(k, str(v)) for k, v in response_metadata])
                if response_metadata
                else None
            )
            result = await response
            if isinstance(result, proto.Message):
                response_payload = type(result).to_json(result)
            elif isinstance(result, google.protobuf.message.Message):
                response_payload = MessageToJson(result)
            else:
                response_payload = f"{type(result).__name__}: {pickle.dumps(result)}"
            grpc_response = {
                "payload": response_payload,
                "metadata": metadata,
                "status": "OK",
            }
            _LOGGER.debug(
                f"Received response to rpc {client_call_details.method}.",
                extra={
                    "serviceName": "google.cloud.tasks.v2.CloudTasks",
                    "rpcName": str(client_call_details.method),
                    "response": grpc_response,
                    "metadata": grpc_response["metadata"],
                },
            )
        return response


class CloudTasksGrpcAsyncIOTransport(CloudTasksTransport):
    """gRPC AsyncIO backend transport for CloudTasks.

    Cloud Tasks allows developers to manage the execution of
    background work in their applications.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends protocol buffers over the wire using gRPC (which is built on
    top of HTTP/2); the ``grpcio`` package must be installed.
    """

    _grpc_channel: aio.Channel
    _stubs: Dict[str, Callable] = {}

    @classmethod
    def create_channel(
        cls,
        host: str = "cloudtasks.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        quota_project_id: Optional[str] = None,
        **kwargs,
    ) -> aio.Channel:
        """Create and return a gRPC AsyncIO channel object.
        Args:
            host (Optional[str]): The host for the channel to use.
            credentials (Optional[~.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify this application to the service. If
                none are specified, the client will attempt to ascertain
                the credentials from the environment.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
            scopes (Optional[Sequence[str]]): A optional list of scopes needed for this
                service. These are only used when credentials are not specified and
                are passed to :func:`google.auth.default`.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            kwargs (Optional[dict]): Keyword arguments, which are passed to the
                channel creation.
        Returns:
            aio.Channel: A gRPC AsyncIO channel object.
        """

        return grpc_helpers_async.create_channel(
            host,
            credentials=credentials,
            credentials_file=credentials_file,
            quota_project_id=quota_project_id,
            default_scopes=cls.AUTH_SCOPES,
            scopes=scopes,
            default_host=cls.DEFAULT_HOST,
            **kwargs,
        )

    def __init__(
        self,
        *,
        host: str = "cloudtasks.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        channel: Optional[Union[aio.Channel, Callable[..., aio.Channel]]] = None,
        api_mtls_endpoint: Optional[str] = None,
        client_cert_source: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        ssl_channel_credentials: Optional[grpc.ChannelCredentials] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
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
                This argument is ignored if a ``channel`` instance is provided.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if a ``channel`` instance is provided.
            scopes (Optional[Sequence[str]]): A optional list of scopes needed for this
                service. These are only used when credentials are not specified and
                are passed to :func:`google.auth.default`.
            channel (Optional[Union[aio.Channel, Callable[..., aio.Channel]]]):
                A ``Channel`` instance through which to make calls, or a Callable
                that constructs and returns one. If set to None, ``self.create_channel``
                is used to create the channel. If a Callable is given, it will be called
                with the same arguments as used in ``self.create_channel``.
            api_mtls_endpoint (Optional[str]): Deprecated. The mutual TLS endpoint.
                If provided, it overrides the ``host`` argument and tries to create
                a mutual TLS channel with client SSL credentials from
                ``client_cert_source`` or application default SSL credentials.
            client_cert_source (Optional[Callable[[], Tuple[bytes, bytes]]]):
                Deprecated. A callback to provide client SSL certificate bytes and
                private key bytes, both in PEM format. It is ignored if
                ``api_mtls_endpoint`` is None.
            ssl_channel_credentials (grpc.ChannelCredentials): SSL credentials
                for the grpc channel. It is ignored if a ``channel`` instance is provided.
            client_cert_source_for_mtls (Optional[Callable[[], Tuple[bytes, bytes]]]):
                A callback to provide client certificate bytes and private key bytes,
                both in PEM format. It is used to configure a mutual TLS channel. It is
                ignored if a ``channel`` instance or ``ssl_channel_credentials`` is provided.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            client_info (google.api_core.gapic_v1.client_info.ClientInfo):
                The client info used to send a user-agent string along with
                API requests. If ``None``, then default info will be used.
                Generally, you only need to set this if you're developing
                your own client library.
            always_use_jwt_access (Optional[bool]): Whether self signed JWT should
                be used for service account credentials.

        Raises:
            google.auth.exceptions.MutualTlsChannelError: If mutual TLS transport
              creation failed for any reason.
          google.api_core.exceptions.DuplicateCredentialArgs: If both ``credentials``
              and ``credentials_file`` are passed.
        """
        self._grpc_channel = None
        self._ssl_channel_credentials = ssl_channel_credentials
        self._stubs: Dict[str, Callable] = {}

        if api_mtls_endpoint:
            warnings.warn("api_mtls_endpoint is deprecated", DeprecationWarning)
        if client_cert_source:
            warnings.warn("client_cert_source is deprecated", DeprecationWarning)

        if isinstance(channel, aio.Channel):
            # Ignore credentials if a channel was passed.
            credentials = None
            self._ignore_credentials = True
            # If a channel was explicitly provided, set it.
            self._grpc_channel = channel
            self._ssl_channel_credentials = None
        else:
            if api_mtls_endpoint:
                host = api_mtls_endpoint

                # Create SSL credentials with client_cert_source or application
                # default SSL credentials.
                if client_cert_source:
                    cert, key = client_cert_source()
                    self._ssl_channel_credentials = grpc.ssl_channel_credentials(
                        certificate_chain=cert, private_key=key
                    )
                else:
                    self._ssl_channel_credentials = SslCredentials().ssl_credentials

            else:
                if client_cert_source_for_mtls and not ssl_channel_credentials:
                    cert, key = client_cert_source_for_mtls()
                    self._ssl_channel_credentials = grpc.ssl_channel_credentials(
                        certificate_chain=cert, private_key=key
                    )

        # The base transport sets the host, credentials and scopes
        super().__init__(
            host=host,
            credentials=credentials,
            credentials_file=credentials_file,
            scopes=scopes,
            quota_project_id=quota_project_id,
            client_info=client_info,
            always_use_jwt_access=always_use_jwt_access,
            api_audience=api_audience,
        )

        if not self._grpc_channel:
            # initialize with the provided callable or the default channel
            channel_init = channel or type(self).create_channel
            self._grpc_channel = channel_init(
                self._host,
                # use the credentials which are saved
                credentials=self._credentials,
                # Set ``credentials_file`` to ``None`` here as
                # the credentials that we saved earlier should be used.
                credentials_file=None,
                scopes=self._scopes,
                ssl_credentials=self._ssl_channel_credentials,
                quota_project_id=quota_project_id,
                options=[
                    ("grpc.max_send_message_length", -1),
                    ("grpc.max_receive_message_length", -1),
                ],
            )

        self._interceptor = _LoggingClientAIOInterceptor()
        self._grpc_channel._unary_unary_interceptors.append(self._interceptor)
        self._logged_channel = self._grpc_channel
        self._wrap_with_kind = (
            "kind" in inspect.signature(gapic_v1.method_async.wrap_method).parameters
        )
        # Wrap messages. This must be done after self._logged_channel exists
        self._prep_wrapped_messages(client_info)

    @property
    def grpc_channel(self) -> aio.Channel:
        """Create the channel designed to connect to this service.

        This property caches on the instance; repeated calls return
        the same channel.
        """
        # Return the channel from cache.
        return self._grpc_channel

    @property
    def list_queues(
        self,
    ) -> Callable[
        [cloudtasks.ListQueuesRequest], Awaitable[cloudtasks.ListQueuesResponse]
    ]:
        r"""Return a callable for the list queues method over gRPC.

        Lists queues.

        Queues are returned in lexicographical order.

        Returns:
            Callable[[~.ListQueuesRequest],
                    Awaitable[~.ListQueuesResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_queues" not in self._stubs:
            self._stubs["list_queues"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/ListQueues",
                request_serializer=cloudtasks.ListQueuesRequest.serialize,
                response_deserializer=cloudtasks.ListQueuesResponse.deserialize,
            )
        return self._stubs["list_queues"]

    @property
    def get_queue(
        self,
    ) -> Callable[[cloudtasks.GetQueueRequest], Awaitable[queue.Queue]]:
        r"""Return a callable for the get queue method over gRPC.

        Gets a queue.

        Returns:
            Callable[[~.GetQueueRequest],
                    Awaitable[~.Queue]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_queue" not in self._stubs:
            self._stubs["get_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/GetQueue",
                request_serializer=cloudtasks.GetQueueRequest.serialize,
                response_deserializer=queue.Queue.deserialize,
            )
        return self._stubs["get_queue"]

    @property
    def create_queue(
        self,
    ) -> Callable[[cloudtasks.CreateQueueRequest], Awaitable[gct_queue.Queue]]:
        r"""Return a callable for the create queue method over gRPC.

        Creates a queue.

        Queues created with this method allow tasks to live for a
        maximum of 31 days. After a task is 31 days old, the task will
        be deleted regardless of whether it was dispatched or not.

        WARNING: Using this method may have unintended side effects if
        you are using an App Engine ``queue.yaml`` or ``queue.xml`` file
        to manage your queues. Read `Overview of Queue Management and
        queue.yaml <https://cloud.google.com/tasks/docs/queue-yaml>`__
        before using this method.

        Returns:
            Callable[[~.CreateQueueRequest],
                    Awaitable[~.Queue]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_queue" not in self._stubs:
            self._stubs["create_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/CreateQueue",
                request_serializer=cloudtasks.CreateQueueRequest.serialize,
                response_deserializer=gct_queue.Queue.deserialize,
            )
        return self._stubs["create_queue"]

    @property
    def update_queue(
        self,
    ) -> Callable[[cloudtasks.UpdateQueueRequest], Awaitable[gct_queue.Queue]]:
        r"""Return a callable for the update queue method over gRPC.

        Updates a queue.

        This method creates the queue if it does not exist and updates
        the queue if it does exist.

        Queues created with this method allow tasks to live for a
        maximum of 31 days. After a task is 31 days old, the task will
        be deleted regardless of whether it was dispatched or not.

        WARNING: Using this method may have unintended side effects if
        you are using an App Engine ``queue.yaml`` or ``queue.xml`` file
        to manage your queues. Read `Overview of Queue Management and
        queue.yaml <https://cloud.google.com/tasks/docs/queue-yaml>`__
        before using this method.

        Returns:
            Callable[[~.UpdateQueueRequest],
                    Awaitable[~.Queue]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_queue" not in self._stubs:
            self._stubs["update_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/UpdateQueue",
                request_serializer=cloudtasks.UpdateQueueRequest.serialize,
                response_deserializer=gct_queue.Queue.deserialize,
            )
        return self._stubs["update_queue"]

    @property
    def delete_queue(
        self,
    ) -> Callable[[cloudtasks.DeleteQueueRequest], Awaitable[empty_pb2.Empty]]:
        r"""Return a callable for the delete queue method over gRPC.

        Deletes a queue.

        This command will delete the queue even if it has tasks in it.

        Note: If you delete a queue, a queue with the same name can't be
        created for 7 days.

        WARNING: Using this method may have unintended side effects if
        you are using an App Engine ``queue.yaml`` or ``queue.xml`` file
        to manage your queues. Read `Overview of Queue Management and
        queue.yaml <https://cloud.google.com/tasks/docs/queue-yaml>`__
        before using this method.

        Returns:
            Callable[[~.DeleteQueueRequest],
                    Awaitable[~.Empty]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_queue" not in self._stubs:
            self._stubs["delete_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/DeleteQueue",
                request_serializer=cloudtasks.DeleteQueueRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_queue"]

    @property
    def purge_queue(
        self,
    ) -> Callable[[cloudtasks.PurgeQueueRequest], Awaitable[queue.Queue]]:
        r"""Return a callable for the purge queue method over gRPC.

        Purges a queue by deleting all of its tasks.

        All tasks created before this method is called are
        permanently deleted.

        Purge operations can take up to one minute to take
        effect. Tasks might be dispatched before the purge takes
        effect. A purge is irreversible.

        Returns:
            Callable[[~.PurgeQueueRequest],
                    Awaitable[~.Queue]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "purge_queue" not in self._stubs:
            self._stubs["purge_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/PurgeQueue",
                request_serializer=cloudtasks.PurgeQueueRequest.serialize,
                response_deserializer=queue.Queue.deserialize,
            )
        return self._stubs["purge_queue"]

    @property
    def pause_queue(
        self,
    ) -> Callable[[cloudtasks.PauseQueueRequest], Awaitable[queue.Queue]]:
        r"""Return a callable for the pause queue method over gRPC.

        Pauses the queue.

        If a queue is paused then the system will stop dispatching tasks
        until the queue is resumed via
        [ResumeQueue][google.cloud.tasks.v2.CloudTasks.ResumeQueue].
        Tasks can still be added when the queue is paused. A queue is
        paused if its [state][google.cloud.tasks.v2.Queue.state] is
        [PAUSED][google.cloud.tasks.v2.Queue.State.PAUSED].

        Returns:
            Callable[[~.PauseQueueRequest],
                    Awaitable[~.Queue]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "pause_queue" not in self._stubs:
            self._stubs["pause_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/PauseQueue",
                request_serializer=cloudtasks.PauseQueueRequest.serialize,
                response_deserializer=queue.Queue.deserialize,
            )
        return self._stubs["pause_queue"]

    @property
    def resume_queue(
        self,
    ) -> Callable[[cloudtasks.ResumeQueueRequest], Awaitable[queue.Queue]]:
        r"""Return a callable for the resume queue method over gRPC.

        Resume a queue.

        This method resumes a queue after it has been
        [PAUSED][google.cloud.tasks.v2.Queue.State.PAUSED] or
        [DISABLED][google.cloud.tasks.v2.Queue.State.DISABLED]. The
        state of a queue is stored in the queue's
        [state][google.cloud.tasks.v2.Queue.state]; after calling this
        method it will be set to
        [RUNNING][google.cloud.tasks.v2.Queue.State.RUNNING].

        WARNING: Resuming many high-QPS queues at the same time can lead
        to target overloading. If you are resuming high-QPS queues,
        follow the 500/50/5 pattern described in `Managing Cloud Tasks
        Scaling
        Risks <https://cloud.google.com/tasks/docs/manage-cloud-task-scaling>`__.

        Returns:
            Callable[[~.ResumeQueueRequest],
                    Awaitable[~.Queue]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "resume_queue" not in self._stubs:
            self._stubs["resume_queue"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/ResumeQueue",
                request_serializer=cloudtasks.ResumeQueueRequest.serialize,
                response_deserializer=queue.Queue.deserialize,
            )
        return self._stubs["resume_queue"]

    @property
    def get_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.GetIamPolicyRequest], Awaitable[policy_pb2.Policy]]:
        r"""Return a callable for the get iam policy method over gRPC.

        Gets the access control policy for a
        [Queue][google.cloud.tasks.v2.Queue]. Returns an empty policy if
        the resource exists and does not have a policy set.

        Authorization requires the following `Google
        IAM <https://cloud.google.com/iam>`__ permission on the
        specified resource parent:

        -  ``cloudtasks.queues.getIamPolicy``

        Returns:
            Callable[[~.GetIamPolicyRequest],
                    Awaitable[~.Policy]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_iam_policy" not in self._stubs:
            self._stubs["get_iam_policy"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/GetIamPolicy",
                request_serializer=iam_policy_pb2.GetIamPolicyRequest.SerializeToString,
                response_deserializer=policy_pb2.Policy.FromString,
            )
        return self._stubs["get_iam_policy"]

    @property
    def set_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.SetIamPolicyRequest], Awaitable[policy_pb2.Policy]]:
        r"""Return a callable for the set iam policy method over gRPC.

        Sets the access control policy for a
        [Queue][google.cloud.tasks.v2.Queue]. Replaces any existing
        policy.

        Note: The Cloud Console does not check queue-level IAM
        permissions yet. Project-level permissions are required to use
        the Cloud Console.

        Authorization requires the following `Google
        IAM <https://cloud.google.com/iam>`__ permission on the
        specified resource parent:

        -  ``cloudtasks.queues.setIamPolicy``

        Returns:
            Callable[[~.SetIamPolicyRequest],
                    Awaitable[~.Policy]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "set_iam_policy" not in self._stubs:
            self._stubs["set_iam_policy"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/SetIamPolicy",
                request_serializer=iam_policy_pb2.SetIamPolicyRequest.SerializeToString,
                response_deserializer=policy_pb2.Policy.FromString,
            )
        return self._stubs["set_iam_policy"]

    @property
    def test_iam_permissions(
        self,
    ) -> Callable[
        [iam_policy_pb2.TestIamPermissionsRequest],
        Awaitable[iam_policy_pb2.TestIamPermissionsResponse],
    ]:
        r"""Return a callable for the test iam permissions method over gRPC.

        Returns permissions that a caller has on a
        [Queue][google.cloud.tasks.v2.Queue]. If the resource does not
        exist, this will return an empty set of permissions, not a
        [NOT_FOUND][google.rpc.Code.NOT_FOUND] error.

        Note: This operation is designed to be used for building
        permission-aware UIs and command-line tools, not for
        authorization checking. This operation may "fail open" without
        warning.

        Returns:
            Callable[[~.TestIamPermissionsRequest],
                    Awaitable[~.TestIamPermissionsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "test_iam_permissions" not in self._stubs:
            self._stubs["test_iam_permissions"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/TestIamPermissions",
                request_serializer=iam_policy_pb2.TestIamPermissionsRequest.SerializeToString,
                response_deserializer=iam_policy_pb2.TestIamPermissionsResponse.FromString,
            )
        return self._stubs["test_iam_permissions"]

    @property
    def list_tasks(
        self,
    ) -> Callable[
        [cloudtasks.ListTasksRequest], Awaitable[cloudtasks.ListTasksResponse]
    ]:
        r"""Return a callable for the list tasks method over gRPC.

        Lists the tasks in a queue.

        By default, only the
        [BASIC][google.cloud.tasks.v2.Task.View.BASIC] view is retrieved
        due to performance considerations;
        [response_view][google.cloud.tasks.v2.ListTasksRequest.response_view]
        controls the subset of information which is returned.

        The tasks may be returned in any order. The ordering may change
        at any time.

        Returns:
            Callable[[~.ListTasksRequest],
                    Awaitable[~.ListTasksResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_tasks" not in self._stubs:
            self._stubs["list_tasks"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/ListTasks",
                request_serializer=cloudtasks.ListTasksRequest.serialize,
                response_deserializer=cloudtasks.ListTasksResponse.deserialize,
            )
        return self._stubs["list_tasks"]

    @property
    def get_task(self) -> Callable[[cloudtasks.GetTaskRequest], Awaitable[task.Task]]:
        r"""Return a callable for the get task method over gRPC.

        Gets a task.

        Returns:
            Callable[[~.GetTaskRequest],
                    Awaitable[~.Task]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_task" not in self._stubs:
            self._stubs["get_task"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/GetTask",
                request_serializer=cloudtasks.GetTaskRequest.serialize,
                response_deserializer=task.Task.deserialize,
            )
        return self._stubs["get_task"]

    @property
    def create_task(
        self,
    ) -> Callable[[cloudtasks.CreateTaskRequest], Awaitable[gct_task.Task]]:
        r"""Return a callable for the create task method over gRPC.

        Creates a task and adds it to a queue.

        Tasks cannot be updated after creation; there is no UpdateTask
        command.

        -  The maximum task size is 100KB.

        Returns:
            Callable[[~.CreateTaskRequest],
                    Awaitable[~.Task]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_task" not in self._stubs:
            self._stubs["create_task"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/CreateTask",
                request_serializer=cloudtasks.CreateTaskRequest.serialize,
                response_deserializer=gct_task.Task.deserialize,
            )
        return self._stubs["create_task"]

    @property
    def delete_task(
        self,
    ) -> Callable[[cloudtasks.DeleteTaskRequest], Awaitable[empty_pb2.Empty]]:
        r"""Return a callable for the delete task method over gRPC.

        Deletes a task.

        A task can be deleted if it is scheduled or dispatched.
        A task cannot be deleted if it has executed successfully
        or permanently failed.

        Returns:
            Callable[[~.DeleteTaskRequest],
                    Awaitable[~.Empty]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_task" not in self._stubs:
            self._stubs["delete_task"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/DeleteTask",
                request_serializer=cloudtasks.DeleteTaskRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_task"]

    @property
    def run_task(self) -> Callable[[cloudtasks.RunTaskRequest], Awaitable[task.Task]]:
        r"""Return a callable for the run task method over gRPC.

        Forces a task to run now.

        When this method is called, Cloud Tasks will dispatch the task,
        even if the task is already running, the queue has reached its
        [RateLimits][google.cloud.tasks.v2.RateLimits] or is
        [PAUSED][google.cloud.tasks.v2.Queue.State.PAUSED].

        This command is meant to be used for manual debugging. For
        example, [RunTask][google.cloud.tasks.v2.CloudTasks.RunTask] can
        be used to retry a failed task after a fix has been made or to
        manually force a task to be dispatched now.

        The dispatched task is returned. That is, the task that is
        returned contains the [status][Task.status] after the task is
        dispatched but before the task is received by its target.

        If Cloud Tasks receives a successful response from the task's
        target, then the task will be deleted; otherwise the task's
        [schedule_time][google.cloud.tasks.v2.Task.schedule_time] will
        be reset to the time that
        [RunTask][google.cloud.tasks.v2.CloudTasks.RunTask] was called
        plus the retry delay specified in the queue's
        [RetryConfig][google.cloud.tasks.v2.RetryConfig].

        [RunTask][google.cloud.tasks.v2.CloudTasks.RunTask] returns
        [NOT_FOUND][google.rpc.Code.NOT_FOUND] when it is called on a
        task that has already succeeded or permanently failed.

        Returns:
            Callable[[~.RunTaskRequest],
                    Awaitable[~.Task]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "run_task" not in self._stubs:
            self._stubs["run_task"] = self._logged_channel.unary_unary(
                "/google.cloud.tasks.v2.CloudTasks/RunTask",
                request_serializer=cloudtasks.RunTaskRequest.serialize,
                response_deserializer=task.Task.deserialize,
            )
        return self._stubs["run_task"]

    def _prep_wrapped_messages(self, client_info):
        """Precompute the wrapped methods, overriding the base class method to use async wrappers."""
        self._wrapped_methods = {
            self.list_queues: self._wrap_method(
                self.list_queues,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.get_queue: self._wrap_method(
                self.get_queue,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.create_queue: self._wrap_method(
                self.create_queue,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.update_queue: self._wrap_method(
                self.update_queue,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.delete_queue: self._wrap_method(
                self.delete_queue,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.purge_queue: self._wrap_method(
                self.purge_queue,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.pause_queue: self._wrap_method(
                self.pause_queue,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.resume_queue: self._wrap_method(
                self.resume_queue,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.get_iam_policy: self._wrap_method(
                self.get_iam_policy,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.set_iam_policy: self._wrap_method(
                self.set_iam_policy,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.test_iam_permissions: self._wrap_method(
                self.test_iam_permissions,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.list_tasks: self._wrap_method(
                self.list_tasks,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.get_task: self._wrap_method(
                self.get_task,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.create_task: self._wrap_method(
                self.create_task,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.delete_task: self._wrap_method(
                self.delete_task,
                default_retry=retries.AsyncRetry(
                    initial=0.1,
                    maximum=10.0,
                    multiplier=1.3,
                    predicate=retries.if_exception_type(
                        core_exceptions.DeadlineExceeded,
                        core_exceptions.ServiceUnavailable,
                    ),
                    deadline=20.0,
                ),
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.run_task: self._wrap_method(
                self.run_task,
                default_timeout=20.0,
                client_info=client_info,
            ),
            self.get_location: self._wrap_method(
                self.get_location,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_locations: self._wrap_method(
                self.list_locations,
                default_timeout=None,
                client_info=client_info,
            ),
        }

    def _wrap_method(self, func, *args, **kwargs):
        if self._wrap_with_kind:  # pragma: NO COVER
            kwargs["kind"] = self.kind
        return gapic_v1.method_async.wrap_method(func, *args, **kwargs)

    def close(self):
        return self._logged_channel.close()

    @property
    def kind(self) -> str:
        return "grpc_asyncio"

    @property
    def list_locations(
        self,
    ) -> Callable[
        [locations_pb2.ListLocationsRequest], locations_pb2.ListLocationsResponse
    ]:
        r"""Return a callable for the list locations method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_locations" not in self._stubs:
            self._stubs["list_locations"] = self._logged_channel.unary_unary(
                "/google.cloud.location.Locations/ListLocations",
                request_serializer=locations_pb2.ListLocationsRequest.SerializeToString,
                response_deserializer=locations_pb2.ListLocationsResponse.FromString,
            )
        return self._stubs["list_locations"]

    @property
    def get_location(
        self,
    ) -> Callable[[locations_pb2.GetLocationRequest], locations_pb2.Location]:
        r"""Return a callable for the list locations method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_location" not in self._stubs:
            self._stubs["get_location"] = self._logged_channel.unary_unary(
                "/google.cloud.location.Locations/GetLocation",
                request_serializer=locations_pb2.GetLocationRequest.SerializeToString,
                response_deserializer=locations_pb2.Location.FromString,
            )
        return self._stubs["get_location"]


__all__ = ("CloudTasksGrpcAsyncIOTransport",)
