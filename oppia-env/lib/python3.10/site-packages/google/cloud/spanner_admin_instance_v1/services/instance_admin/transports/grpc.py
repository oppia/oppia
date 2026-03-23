# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
import warnings
from typing import Callable, Dict, Optional, Sequence, Tuple, Union

from google.api_core import grpc_helpers
from google.api_core import operations_v1
from google.api_core import gapic_v1
import google.auth  # type: ignore
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.grpc import SslCredentials  # type: ignore

import grpc  # type: ignore

from google.cloud.spanner_admin_instance_v1.types import spanner_instance_admin
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from .base import InstanceAdminTransport, DEFAULT_CLIENT_INFO


class InstanceAdminGrpcTransport(InstanceAdminTransport):
    """gRPC backend transport for InstanceAdmin.

    Cloud Spanner Instance Admin API
    The Cloud Spanner Instance Admin API can be used to create,
    delete, modify and list instances. Instances are dedicated Cloud
    Spanner serving and storage resources to be used by Cloud
    Spanner databases.
    Each instance has a "configuration", which dictates where the
    serving resources for the Cloud Spanner instance are located
    (e.g., US-central, Europe). Configurations are created by Google
    based on resource availability.

    Cloud Spanner billing is based on the instances that exist and
    their sizes. After an instance exists, there are no additional
    per-database or per-operation charges for use of the instance
    (though there may be additional network bandwidth charges).
    Instances offer isolation: problems with databases in one
    instance will not affect other instances. However, within an
    instance databases can affect each other. For example, if one
    database in an instance receives a lot of requests and consumes
    most of the instance resources, fewer resources are available
    for other databases in that instance, and their performance may
    suffer.

    This class defines the same methods as the primary client, so the
    primary client can load the underlying transport implementation
    and call it.

    It sends protocol buffers over the wire using gRPC (which is built on
    top of HTTP/2); the ``grpcio`` package must be installed.
    """

    _stubs: Dict[str, Callable]

    def __init__(
        self,
        *,
        host: str = "spanner.googleapis.com",
        credentials: ga_credentials.Credentials = None,
        credentials_file: str = None,
        scopes: Sequence[str] = None,
        channel: grpc.Channel = None,
        api_mtls_endpoint: str = None,
        client_cert_source: Callable[[], Tuple[bytes, bytes]] = None,
        ssl_channel_credentials: grpc.ChannelCredentials = None,
        client_cert_source_for_mtls: Callable[[], Tuple[bytes, bytes]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        api_audience: Optional[str] = None,
    ) -> None:
        """Instantiate the transport.

        Args:
            host (Optional[str]):
                 The hostname to connect to.
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
                This argument is ignored if ``channel`` is provided.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if ``channel`` is provided.
            scopes (Optional(Sequence[str])): A list of scopes. This argument is
                ignored if ``channel`` is provided.
            channel (Optional[grpc.Channel]): A ``Channel`` instance through
                which to make calls.
            api_mtls_endpoint (Optional[str]): Deprecated. The mutual TLS endpoint.
                If provided, it overrides the ``host`` argument and tries to create
                a mutual TLS channel with client SSL credentials from
                ``client_cert_source`` or application default SSL credentials.
            client_cert_source (Optional[Callable[[], Tuple[bytes, bytes]]]):
                Deprecated. A callback to provide client SSL certificate bytes and
                private key bytes, both in PEM format. It is ignored if
                ``api_mtls_endpoint`` is None.
            ssl_channel_credentials (grpc.ChannelCredentials): SSL credentials
                for the grpc channel. It is ignored if ``channel`` is provided.
            client_cert_source_for_mtls (Optional[Callable[[], Tuple[bytes, bytes]]]):
                A callback to provide client certificate bytes and private key bytes,
                both in PEM format. It is used to configure a mutual TLS channel. It is
                ignored if ``channel`` or ``ssl_channel_credentials`` is provided.
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
          google.auth.exceptions.MutualTLSChannelError: If mutual TLS transport
              creation failed for any reason.
          google.api_core.exceptions.DuplicateCredentialArgs: If both ``credentials``
              and ``credentials_file`` are passed.
        """
        self._grpc_channel = None
        self._ssl_channel_credentials = ssl_channel_credentials
        self._stubs: Dict[str, Callable] = {}
        self._operations_client: Optional[operations_v1.OperationsClient] = None

        if api_mtls_endpoint:
            warnings.warn("api_mtls_endpoint is deprecated", DeprecationWarning)
        if client_cert_source:
            warnings.warn("client_cert_source is deprecated", DeprecationWarning)

        if channel:
            # Ignore credentials if a channel was passed.
            credentials = False
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
            self._grpc_channel = type(self).create_channel(
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

        # Wrap messages. This must be done after self._grpc_channel exists
        self._prep_wrapped_messages(client_info)

    @classmethod
    def create_channel(
        cls,
        host: str = "spanner.googleapis.com",
        credentials: ga_credentials.Credentials = None,
        credentials_file: str = None,
        scopes: Optional[Sequence[str]] = None,
        quota_project_id: Optional[str] = None,
        **kwargs,
    ) -> grpc.Channel:
        """Create and return a gRPC channel object.
        Args:
            host (Optional[str]): The host for the channel to use.
            credentials (Optional[~.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify this application to the service. If
                none are specified, the client will attempt to ascertain
                the credentials from the environment.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is mutually exclusive with credentials.
            scopes (Optional[Sequence[str]]): A optional list of scopes needed for this
                service. These are only used when credentials are not specified and
                are passed to :func:`google.auth.default`.
            quota_project_id (Optional[str]): An optional project to use for billing
                and quota.
            kwargs (Optional[dict]): Keyword arguments, which are passed to the
                channel creation.
        Returns:
            grpc.Channel: A gRPC channel object.

        Raises:
            google.api_core.exceptions.DuplicateCredentialArgs: If both ``credentials``
              and ``credentials_file`` are passed.
        """

        return grpc_helpers.create_channel(
            host,
            credentials=credentials,
            credentials_file=credentials_file,
            quota_project_id=quota_project_id,
            default_scopes=cls.AUTH_SCOPES,
            scopes=scopes,
            default_host=cls.DEFAULT_HOST,
            **kwargs,
        )

    @property
    def grpc_channel(self) -> grpc.Channel:
        """Return the channel designed to connect to this service."""
        return self._grpc_channel

    @property
    def operations_client(self) -> operations_v1.OperationsClient:
        """Create the client designed to process long-running operations.

        This property caches on the instance; repeated calls return the same
        client.
        """
        # Quick check: Only create a new client if we do not already have one.
        if self._operations_client is None:
            self._operations_client = operations_v1.OperationsClient(self.grpc_channel)

        # Return the client from cache.
        return self._operations_client

    @property
    def list_instance_configs(
        self,
    ) -> Callable[
        [spanner_instance_admin.ListInstanceConfigsRequest],
        spanner_instance_admin.ListInstanceConfigsResponse,
    ]:
        r"""Return a callable for the list instance configs method over gRPC.

        Lists the supported instance configurations for a
        given project.

        Returns:
            Callable[[~.ListInstanceConfigsRequest],
                    ~.ListInstanceConfigsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_instance_configs" not in self._stubs:
            self._stubs["list_instance_configs"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/ListInstanceConfigs",
                request_serializer=spanner_instance_admin.ListInstanceConfigsRequest.serialize,
                response_deserializer=spanner_instance_admin.ListInstanceConfigsResponse.deserialize,
            )
        return self._stubs["list_instance_configs"]

    @property
    def get_instance_config(
        self,
    ) -> Callable[
        [spanner_instance_admin.GetInstanceConfigRequest],
        spanner_instance_admin.InstanceConfig,
    ]:
        r"""Return a callable for the get instance config method over gRPC.

        Gets information about a particular instance
        configuration.

        Returns:
            Callable[[~.GetInstanceConfigRequest],
                    ~.InstanceConfig]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_instance_config" not in self._stubs:
            self._stubs["get_instance_config"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/GetInstanceConfig",
                request_serializer=spanner_instance_admin.GetInstanceConfigRequest.serialize,
                response_deserializer=spanner_instance_admin.InstanceConfig.deserialize,
            )
        return self._stubs["get_instance_config"]

    @property
    def create_instance_config(
        self,
    ) -> Callable[
        [spanner_instance_admin.CreateInstanceConfigRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the create instance config method over gRPC.

        Creates an instance config and begins preparing it to be used.
        The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of preparing the new instance config. The instance
        config name is assigned by the caller. If the named instance
        config already exists, ``CreateInstanceConfig`` returns
        ``ALREADY_EXISTS``.

        Immediately after the request returns:

        -  The instance config is readable via the API, with all
           requested attributes. The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field is set to true. Its state is ``CREATING``.

        While the operation is pending:

        -  Cancelling the operation renders the instance config
           immediately unreadable via the API.
        -  Except for deleting the creating resource, all other attempts
           to modify the instance config are rejected.

        Upon completion of the returned operation:

        -  Instances can be created using the instance configuration.
        -  The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field becomes false. Its state becomes ``READY``.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_config_name>/operations/<operation_id>`` and
        can be used to track creation of the instance config. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CreateInstanceConfigMetadata][google.spanner.admin.instance.v1.CreateInstanceConfigMetadata].
        The [response][google.longrunning.Operation.response] field type
        is
        [InstanceConfig][google.spanner.admin.instance.v1.InstanceConfig],
        if successful.

        Authorization requires ``spanner.instanceConfigs.create``
        permission on the resource
        [parent][google.spanner.admin.instance.v1.CreateInstanceConfigRequest.parent].

        Returns:
            Callable[[~.CreateInstanceConfigRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_instance_config" not in self._stubs:
            self._stubs["create_instance_config"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/CreateInstanceConfig",
                request_serializer=spanner_instance_admin.CreateInstanceConfigRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_instance_config"]

    @property
    def update_instance_config(
        self,
    ) -> Callable[
        [spanner_instance_admin.UpdateInstanceConfigRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the update instance config method over gRPC.

        Updates an instance config. The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of updating the instance. If the named instance
        config does not exist, returns ``NOT_FOUND``.

        Only user managed configurations can be updated.

        Immediately after the request returns:

        -  The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field is set to true.

        While the operation is pending:

        -  Cancelling the operation sets its metadata's
           [cancel_time][google.spanner.admin.instance.v1.UpdateInstanceConfigMetadata.cancel_time].
           The operation is guaranteed to succeed at undoing all
           changes, after which point it terminates with a ``CANCELLED``
           status.
        -  All other attempts to modify the instance config are
           rejected.
        -  Reading the instance config via the API continues to give the
           pre-request values.

        Upon completion of the returned operation:

        -  Creating instances using the instance configuration uses the
           new values.
        -  The instance config's new values are readable via the API.
        -  The instance config's
           [reconciling][google.spanner.admin.instance.v1.InstanceConfig.reconciling]
           field becomes false.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_config_name>/operations/<operation_id>`` and
        can be used to track the instance config modification. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [UpdateInstanceConfigMetadata][google.spanner.admin.instance.v1.UpdateInstanceConfigMetadata].
        The [response][google.longrunning.Operation.response] field type
        is
        [InstanceConfig][google.spanner.admin.instance.v1.InstanceConfig],
        if successful.

        Authorization requires ``spanner.instanceConfigs.update``
        permission on the resource
        [name][google.spanner.admin.instance.v1.InstanceConfig.name].

        Returns:
            Callable[[~.UpdateInstanceConfigRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_instance_config" not in self._stubs:
            self._stubs["update_instance_config"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/UpdateInstanceConfig",
                request_serializer=spanner_instance_admin.UpdateInstanceConfigRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["update_instance_config"]

    @property
    def delete_instance_config(
        self,
    ) -> Callable[
        [spanner_instance_admin.DeleteInstanceConfigRequest], empty_pb2.Empty
    ]:
        r"""Return a callable for the delete instance config method over gRPC.

        Deletes the instance config. Deletion is only allowed when no
        instances are using the configuration. If any instances are
        using the config, returns ``FAILED_PRECONDITION``.

        Only user managed configurations can be deleted.

        Authorization requires ``spanner.instanceConfigs.delete``
        permission on the resource
        [name][google.spanner.admin.instance.v1.InstanceConfig.name].

        Returns:
            Callable[[~.DeleteInstanceConfigRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_instance_config" not in self._stubs:
            self._stubs["delete_instance_config"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/DeleteInstanceConfig",
                request_serializer=spanner_instance_admin.DeleteInstanceConfigRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_instance_config"]

    @property
    def list_instance_config_operations(
        self,
    ) -> Callable[
        [spanner_instance_admin.ListInstanceConfigOperationsRequest],
        spanner_instance_admin.ListInstanceConfigOperationsResponse,
    ]:
        r"""Return a callable for the list instance config
        operations method over gRPC.

        Lists the user-managed instance config [long-running
        operations][google.longrunning.Operation] in the given project.
        An instance config operation has a name of the form
        ``projects/<project>/instanceConfigs/<instance_config>/operations/<operation>``.
        The long-running operation
        [metadata][google.longrunning.Operation.metadata] field type
        ``metadata.type_url`` describes the type of the metadata.
        Operations returned include those that have
        completed/failed/canceled within the last 7 days, and pending
        operations. Operations returned are ordered by
        ``operation.metadata.value.start_time`` in descending order
        starting from the most recently started operation.

        Returns:
            Callable[[~.ListInstanceConfigOperationsRequest],
                    ~.ListInstanceConfigOperationsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_instance_config_operations" not in self._stubs:
            self._stubs[
                "list_instance_config_operations"
            ] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/ListInstanceConfigOperations",
                request_serializer=spanner_instance_admin.ListInstanceConfigOperationsRequest.serialize,
                response_deserializer=spanner_instance_admin.ListInstanceConfigOperationsResponse.deserialize,
            )
        return self._stubs["list_instance_config_operations"]

    @property
    def list_instances(
        self,
    ) -> Callable[
        [spanner_instance_admin.ListInstancesRequest],
        spanner_instance_admin.ListInstancesResponse,
    ]:
        r"""Return a callable for the list instances method over gRPC.

        Lists all instances in the given project.

        Returns:
            Callable[[~.ListInstancesRequest],
                    ~.ListInstancesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_instances" not in self._stubs:
            self._stubs["list_instances"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/ListInstances",
                request_serializer=spanner_instance_admin.ListInstancesRequest.serialize,
                response_deserializer=spanner_instance_admin.ListInstancesResponse.deserialize,
            )
        return self._stubs["list_instances"]

    @property
    def get_instance(
        self,
    ) -> Callable[
        [spanner_instance_admin.GetInstanceRequest], spanner_instance_admin.Instance
    ]:
        r"""Return a callable for the get instance method over gRPC.

        Gets information about a particular instance.

        Returns:
            Callable[[~.GetInstanceRequest],
                    ~.Instance]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_instance" not in self._stubs:
            self._stubs["get_instance"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/GetInstance",
                request_serializer=spanner_instance_admin.GetInstanceRequest.serialize,
                response_deserializer=spanner_instance_admin.Instance.deserialize,
            )
        return self._stubs["get_instance"]

    @property
    def create_instance(
        self,
    ) -> Callable[
        [spanner_instance_admin.CreateInstanceRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the create instance method over gRPC.

        Creates an instance and begins preparing it to begin serving.
        The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of preparing the new instance. The instance name is
        assigned by the caller. If the named instance already exists,
        ``CreateInstance`` returns ``ALREADY_EXISTS``.

        Immediately upon completion of this request:

        -  The instance is readable via the API, with all requested
           attributes but no allocated resources. Its state is
           ``CREATING``.

        Until completion of the returned operation:

        -  Cancelling the operation renders the instance immediately
           unreadable via the API.
        -  The instance can be deleted.
        -  All other attempts to modify the instance are rejected.

        Upon completion of the returned operation:

        -  Billing for all successfully-allocated resources begins (some
           types may have lower than the requested levels).
        -  Databases can be created in the instance.
        -  The instance's allocated resource levels are readable via the
           API.
        -  The instance's state becomes ``READY``.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_name>/operations/<operation_id>`` and can be
        used to track creation of the instance. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CreateInstanceMetadata][google.spanner.admin.instance.v1.CreateInstanceMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Instance][google.spanner.admin.instance.v1.Instance], if
        successful.

        Returns:
            Callable[[~.CreateInstanceRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_instance" not in self._stubs:
            self._stubs["create_instance"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/CreateInstance",
                request_serializer=spanner_instance_admin.CreateInstanceRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_instance"]

    @property
    def update_instance(
        self,
    ) -> Callable[
        [spanner_instance_admin.UpdateInstanceRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the update instance method over gRPC.

        Updates an instance, and begins allocating or releasing
        resources as requested. The returned [long-running
        operation][google.longrunning.Operation] can be used to track
        the progress of updating the instance. If the named instance
        does not exist, returns ``NOT_FOUND``.

        Immediately upon completion of this request:

        -  For resource types for which a decrease in the instance's
           allocation has been requested, billing is based on the
           newly-requested level.

        Until completion of the returned operation:

        -  Cancelling the operation sets its metadata's
           [cancel_time][google.spanner.admin.instance.v1.UpdateInstanceMetadata.cancel_time],
           and begins restoring resources to their pre-request values.
           The operation is guaranteed to succeed at undoing all
           resource changes, after which point it terminates with a
           ``CANCELLED`` status.
        -  All other attempts to modify the instance are rejected.
        -  Reading the instance via the API continues to give the
           pre-request resource levels.

        Upon completion of the returned operation:

        -  Billing begins for all successfully-allocated resources (some
           types may have lower than the requested levels).
        -  All newly-reserved resources are available for serving the
           instance's tables.
        -  The instance's new resource levels are readable via the API.

        The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<instance_name>/operations/<operation_id>`` and can be
        used to track the instance modification. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [UpdateInstanceMetadata][google.spanner.admin.instance.v1.UpdateInstanceMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Instance][google.spanner.admin.instance.v1.Instance], if
        successful.

        Authorization requires ``spanner.instances.update`` permission
        on the resource
        [name][google.spanner.admin.instance.v1.Instance.name].

        Returns:
            Callable[[~.UpdateInstanceRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_instance" not in self._stubs:
            self._stubs["update_instance"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/UpdateInstance",
                request_serializer=spanner_instance_admin.UpdateInstanceRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["update_instance"]

    @property
    def delete_instance(
        self,
    ) -> Callable[[spanner_instance_admin.DeleteInstanceRequest], empty_pb2.Empty]:
        r"""Return a callable for the delete instance method over gRPC.

        Deletes an instance.

        Immediately upon completion of the request:

        -  Billing ceases for all of the instance's reserved resources.

        Soon afterward:

        -  The instance and *all of its databases* immediately and
           irrevocably disappear from the API. All data in the databases
           is permanently deleted.

        Returns:
            Callable[[~.DeleteInstanceRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_instance" not in self._stubs:
            self._stubs["delete_instance"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/DeleteInstance",
                request_serializer=spanner_instance_admin.DeleteInstanceRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_instance"]

    @property
    def set_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.SetIamPolicyRequest], policy_pb2.Policy]:
        r"""Return a callable for the set iam policy method over gRPC.

        Sets the access control policy on an instance resource. Replaces
        any existing policy.

        Authorization requires ``spanner.instances.setIamPolicy`` on
        [resource][google.iam.v1.SetIamPolicyRequest.resource].

        Returns:
            Callable[[~.SetIamPolicyRequest],
                    ~.Policy]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "set_iam_policy" not in self._stubs:
            self._stubs["set_iam_policy"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/SetIamPolicy",
                request_serializer=iam_policy_pb2.SetIamPolicyRequest.SerializeToString,
                response_deserializer=policy_pb2.Policy.FromString,
            )
        return self._stubs["set_iam_policy"]

    @property
    def get_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.GetIamPolicyRequest], policy_pb2.Policy]:
        r"""Return a callable for the get iam policy method over gRPC.

        Gets the access control policy for an instance resource. Returns
        an empty policy if an instance exists but does not have a policy
        set.

        Authorization requires ``spanner.instances.getIamPolicy`` on
        [resource][google.iam.v1.GetIamPolicyRequest.resource].

        Returns:
            Callable[[~.GetIamPolicyRequest],
                    ~.Policy]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_iam_policy" not in self._stubs:
            self._stubs["get_iam_policy"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/GetIamPolicy",
                request_serializer=iam_policy_pb2.GetIamPolicyRequest.SerializeToString,
                response_deserializer=policy_pb2.Policy.FromString,
            )
        return self._stubs["get_iam_policy"]

    @property
    def test_iam_permissions(
        self,
    ) -> Callable[
        [iam_policy_pb2.TestIamPermissionsRequest],
        iam_policy_pb2.TestIamPermissionsResponse,
    ]:
        r"""Return a callable for the test iam permissions method over gRPC.

        Returns permissions that the caller has on the specified
        instance resource.

        Attempting this RPC on a non-existent Cloud Spanner instance
        resource will result in a NOT_FOUND error if the user has
        ``spanner.instances.list`` permission on the containing Google
        Cloud Project. Otherwise returns an empty set of permissions.

        Returns:
            Callable[[~.TestIamPermissionsRequest],
                    ~.TestIamPermissionsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "test_iam_permissions" not in self._stubs:
            self._stubs["test_iam_permissions"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.instance.v1.InstanceAdmin/TestIamPermissions",
                request_serializer=iam_policy_pb2.TestIamPermissionsRequest.SerializeToString,
                response_deserializer=iam_policy_pb2.TestIamPermissionsResponse.FromString,
            )
        return self._stubs["test_iam_permissions"]

    def close(self):
        self.grpc_channel.close()

    @property
    def kind(self) -> str:
        return "grpc"


__all__ = ("InstanceAdminGrpcTransport",)
