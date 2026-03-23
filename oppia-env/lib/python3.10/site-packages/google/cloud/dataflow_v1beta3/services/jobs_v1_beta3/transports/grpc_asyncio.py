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
from google.protobuf.json_format import MessageToJson
import google.protobuf.message
import grpc  # type: ignore
from grpc.experimental import aio  # type: ignore
import proto  # type: ignore

from google.cloud.dataflow_v1beta3.types import jobs, snapshots

from .base import DEFAULT_CLIENT_INFO, JobsV1Beta3Transport
from .grpc import JobsV1Beta3GrpcTransport

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
                    "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
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
                    "serviceName": "google.dataflow.v1beta3.JobsV1Beta3",
                    "rpcName": str(client_call_details.method),
                    "response": grpc_response,
                    "metadata": grpc_response["metadata"],
                },
            )
        return response


class JobsV1Beta3GrpcAsyncIOTransport(JobsV1Beta3Transport):
    """gRPC AsyncIO backend transport for JobsV1Beta3.

    Provides a method to create and modify Google Cloud Dataflow
    jobs. A Job is a multi-stage computation graph run by the Cloud
    Dataflow service.

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
        host: str = "dataflow.googleapis.com",
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
        host: str = "dataflow.googleapis.com",
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
                 The hostname to connect to (default: 'dataflow.googleapis.com').
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
    def create_job(self) -> Callable[[jobs.CreateJobRequest], Awaitable[jobs.Job]]:
        r"""Return a callable for the create job method over gRPC.

        Creates a Cloud Dataflow job.

        To create a job, we recommend using
        ``projects.locations.jobs.create`` with a [regional endpoint]
        (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints).
        Using ``projects.jobs.create`` is not recommended, as your job
        will always start in ``us-central1``.

        Do not enter confidential information when you supply string
        values using the API.

        Returns:
            Callable[[~.CreateJobRequest],
                    Awaitable[~.Job]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_job" not in self._stubs:
            self._stubs["create_job"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/CreateJob",
                request_serializer=jobs.CreateJobRequest.serialize,
                response_deserializer=jobs.Job.deserialize,
            )
        return self._stubs["create_job"]

    @property
    def get_job(self) -> Callable[[jobs.GetJobRequest], Awaitable[jobs.Job]]:
        r"""Return a callable for the get job method over gRPC.

        Gets the state of the specified Cloud Dataflow job.

        To get the state of a job, we recommend using
        ``projects.locations.jobs.get`` with a [regional endpoint]
        (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints).
        Using ``projects.jobs.get`` is not recommended, as you can only
        get the state of jobs that are running in ``us-central1``.

        Returns:
            Callable[[~.GetJobRequest],
                    Awaitable[~.Job]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_job" not in self._stubs:
            self._stubs["get_job"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/GetJob",
                request_serializer=jobs.GetJobRequest.serialize,
                response_deserializer=jobs.Job.deserialize,
            )
        return self._stubs["get_job"]

    @property
    def update_job(self) -> Callable[[jobs.UpdateJobRequest], Awaitable[jobs.Job]]:
        r"""Return a callable for the update job method over gRPC.

        Updates the state of an existing Cloud Dataflow job.

        To update the state of an existing job, we recommend using
        ``projects.locations.jobs.update`` with a [regional endpoint]
        (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints).
        Using ``projects.jobs.update`` is not recommended, as you can
        only update the state of jobs that are running in
        ``us-central1``.

        Returns:
            Callable[[~.UpdateJobRequest],
                    Awaitable[~.Job]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_job" not in self._stubs:
            self._stubs["update_job"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/UpdateJob",
                request_serializer=jobs.UpdateJobRequest.serialize,
                response_deserializer=jobs.Job.deserialize,
            )
        return self._stubs["update_job"]

    @property
    def list_jobs(
        self,
    ) -> Callable[[jobs.ListJobsRequest], Awaitable[jobs.ListJobsResponse]]:
        r"""Return a callable for the list jobs method over gRPC.

        List the jobs of a project.

        To list the jobs of a project in a region, we recommend using
        ``projects.locations.jobs.list`` with a [regional endpoint]
        (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints).
        To list the all jobs across all regions, use
        ``projects.jobs.aggregated``. Using ``projects.jobs.list`` is
        not recommended, because you can only get the list of jobs that
        are running in ``us-central1``.

        ``projects.locations.jobs.list`` and ``projects.jobs.list``
        support filtering the list of jobs by name. Filtering by name
        isn't supported by ``projects.jobs.aggregated``.

        Returns:
            Callable[[~.ListJobsRequest],
                    Awaitable[~.ListJobsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_jobs" not in self._stubs:
            self._stubs["list_jobs"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/ListJobs",
                request_serializer=jobs.ListJobsRequest.serialize,
                response_deserializer=jobs.ListJobsResponse.deserialize,
            )
        return self._stubs["list_jobs"]

    @property
    def aggregated_list_jobs(
        self,
    ) -> Callable[[jobs.ListJobsRequest], Awaitable[jobs.ListJobsResponse]]:
        r"""Return a callable for the aggregated list jobs method over gRPC.

        List the jobs of a project across all regions.

        **Note:** This method doesn't support filtering the list of jobs
        by name.

        Returns:
            Callable[[~.ListJobsRequest],
                    Awaitable[~.ListJobsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "aggregated_list_jobs" not in self._stubs:
            self._stubs["aggregated_list_jobs"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/AggregatedListJobs",
                request_serializer=jobs.ListJobsRequest.serialize,
                response_deserializer=jobs.ListJobsResponse.deserialize,
            )
        return self._stubs["aggregated_list_jobs"]

    @property
    def check_active_jobs(
        self,
    ) -> Callable[
        [jobs.CheckActiveJobsRequest], Awaitable[jobs.CheckActiveJobsResponse]
    ]:
        r"""Return a callable for the check active jobs method over gRPC.

        Check for existence of active jobs in the given
        project across all regions.

        Returns:
            Callable[[~.CheckActiveJobsRequest],
                    Awaitable[~.CheckActiveJobsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "check_active_jobs" not in self._stubs:
            self._stubs["check_active_jobs"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/CheckActiveJobs",
                request_serializer=jobs.CheckActiveJobsRequest.serialize,
                response_deserializer=jobs.CheckActiveJobsResponse.deserialize,
            )
        return self._stubs["check_active_jobs"]

    @property
    def snapshot_job(
        self,
    ) -> Callable[[jobs.SnapshotJobRequest], Awaitable[snapshots.Snapshot]]:
        r"""Return a callable for the snapshot job method over gRPC.

        Snapshot the state of a streaming job.

        Returns:
            Callable[[~.SnapshotJobRequest],
                    Awaitable[~.Snapshot]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "snapshot_job" not in self._stubs:
            self._stubs["snapshot_job"] = self._logged_channel.unary_unary(
                "/google.dataflow.v1beta3.JobsV1Beta3/SnapshotJob",
                request_serializer=jobs.SnapshotJobRequest.serialize,
                response_deserializer=snapshots.Snapshot.deserialize,
            )
        return self._stubs["snapshot_job"]

    def _prep_wrapped_messages(self, client_info):
        """Precompute the wrapped methods, overriding the base class method to use async wrappers."""
        self._wrapped_methods = {
            self.create_job: self._wrap_method(
                self.create_job,
                default_timeout=None,
                client_info=client_info,
            ),
            self.get_job: self._wrap_method(
                self.get_job,
                default_timeout=None,
                client_info=client_info,
            ),
            self.update_job: self._wrap_method(
                self.update_job,
                default_timeout=None,
                client_info=client_info,
            ),
            self.list_jobs: self._wrap_method(
                self.list_jobs,
                default_timeout=None,
                client_info=client_info,
            ),
            self.aggregated_list_jobs: self._wrap_method(
                self.aggregated_list_jobs,
                default_timeout=None,
                client_info=client_info,
            ),
            self.check_active_jobs: self._wrap_method(
                self.check_active_jobs,
                default_timeout=None,
                client_info=client_info,
            ),
            self.snapshot_job: self._wrap_method(
                self.snapshot_job,
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


__all__ = ("JobsV1Beta3GrpcAsyncIOTransport",)
