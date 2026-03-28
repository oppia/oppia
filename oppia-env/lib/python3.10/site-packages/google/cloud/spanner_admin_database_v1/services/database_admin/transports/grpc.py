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

from google.cloud.spanner_admin_database_v1.types import backup
from google.cloud.spanner_admin_database_v1.types import backup as gsad_backup
from google.cloud.spanner_admin_database_v1.types import spanner_database_admin
from google.iam.v1 import iam_policy_pb2  # type: ignore
from google.iam.v1 import policy_pb2  # type: ignore
from google.longrunning import operations_pb2
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from .base import DatabaseAdminTransport, DEFAULT_CLIENT_INFO


class DatabaseAdminGrpcTransport(DatabaseAdminTransport):
    """gRPC backend transport for DatabaseAdmin.

    Cloud Spanner Database Admin API

    The Cloud Spanner Database Admin API can be used to:

    -  create, drop, and list databases
    -  update the schema of pre-existing databases
    -  create, delete and list backups for a database
    -  restore a database from an existing backup

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
    def list_databases(
        self,
    ) -> Callable[
        [spanner_database_admin.ListDatabasesRequest],
        spanner_database_admin.ListDatabasesResponse,
    ]:
        r"""Return a callable for the list databases method over gRPC.

        Lists Cloud Spanner databases.

        Returns:
            Callable[[~.ListDatabasesRequest],
                    ~.ListDatabasesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_databases" not in self._stubs:
            self._stubs["list_databases"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/ListDatabases",
                request_serializer=spanner_database_admin.ListDatabasesRequest.serialize,
                response_deserializer=spanner_database_admin.ListDatabasesResponse.deserialize,
            )
        return self._stubs["list_databases"]

    @property
    def create_database(
        self,
    ) -> Callable[
        [spanner_database_admin.CreateDatabaseRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the create database method over gRPC.

        Creates a new Cloud Spanner database and starts to prepare it
        for serving. The returned [long-running
        operation][google.longrunning.Operation] will have a name of the
        format ``<database_name>/operations/<operation_id>`` and can be
        used to track preparation of the database. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CreateDatabaseMetadata][google.spanner.admin.database.v1.CreateDatabaseMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Database][google.spanner.admin.database.v1.Database], if
        successful.

        Returns:
            Callable[[~.CreateDatabaseRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_database" not in self._stubs:
            self._stubs["create_database"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/CreateDatabase",
                request_serializer=spanner_database_admin.CreateDatabaseRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_database"]

    @property
    def get_database(
        self,
    ) -> Callable[
        [spanner_database_admin.GetDatabaseRequest], spanner_database_admin.Database
    ]:
        r"""Return a callable for the get database method over gRPC.

        Gets the state of a Cloud Spanner database.

        Returns:
            Callable[[~.GetDatabaseRequest],
                    ~.Database]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_database" not in self._stubs:
            self._stubs["get_database"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/GetDatabase",
                request_serializer=spanner_database_admin.GetDatabaseRequest.serialize,
                response_deserializer=spanner_database_admin.Database.deserialize,
            )
        return self._stubs["get_database"]

    @property
    def update_database_ddl(
        self,
    ) -> Callable[
        [spanner_database_admin.UpdateDatabaseDdlRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the update database ddl method over gRPC.

        Updates the schema of a Cloud Spanner database by
        creating/altering/dropping tables, columns, indexes, etc. The
        returned [long-running operation][google.longrunning.Operation]
        will have a name of the format
        ``<database_name>/operations/<operation_id>`` and can be used to
        track execution of the schema change(s). The
        [metadata][google.longrunning.Operation.metadata] field type is
        [UpdateDatabaseDdlMetadata][google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata].
        The operation has no response.

        Returns:
            Callable[[~.UpdateDatabaseDdlRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_database_ddl" not in self._stubs:
            self._stubs["update_database_ddl"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/UpdateDatabaseDdl",
                request_serializer=spanner_database_admin.UpdateDatabaseDdlRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["update_database_ddl"]

    @property
    def drop_database(
        self,
    ) -> Callable[[spanner_database_admin.DropDatabaseRequest], empty_pb2.Empty]:
        r"""Return a callable for the drop database method over gRPC.

        Drops (aka deletes) a Cloud Spanner database. Completed backups
        for the database will be retained according to their
        ``expire_time``. Note: Cloud Spanner might continue to accept
        requests for a few seconds after the database has been deleted.

        Returns:
            Callable[[~.DropDatabaseRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "drop_database" not in self._stubs:
            self._stubs["drop_database"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/DropDatabase",
                request_serializer=spanner_database_admin.DropDatabaseRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["drop_database"]

    @property
    def get_database_ddl(
        self,
    ) -> Callable[
        [spanner_database_admin.GetDatabaseDdlRequest],
        spanner_database_admin.GetDatabaseDdlResponse,
    ]:
        r"""Return a callable for the get database ddl method over gRPC.

        Returns the schema of a Cloud Spanner database as a list of
        formatted DDL statements. This method does not show pending
        schema updates, those may be queried using the
        [Operations][google.longrunning.Operations] API.

        Returns:
            Callable[[~.GetDatabaseDdlRequest],
                    ~.GetDatabaseDdlResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_database_ddl" not in self._stubs:
            self._stubs["get_database_ddl"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/GetDatabaseDdl",
                request_serializer=spanner_database_admin.GetDatabaseDdlRequest.serialize,
                response_deserializer=spanner_database_admin.GetDatabaseDdlResponse.deserialize,
            )
        return self._stubs["get_database_ddl"]

    @property
    def set_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.SetIamPolicyRequest], policy_pb2.Policy]:
        r"""Return a callable for the set iam policy method over gRPC.

        Sets the access control policy on a database or backup resource.
        Replaces any existing policy.

        Authorization requires ``spanner.databases.setIamPolicy``
        permission on
        [resource][google.iam.v1.SetIamPolicyRequest.resource]. For
        backups, authorization requires ``spanner.backups.setIamPolicy``
        permission on
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
                "/google.spanner.admin.database.v1.DatabaseAdmin/SetIamPolicy",
                request_serializer=iam_policy_pb2.SetIamPolicyRequest.SerializeToString,
                response_deserializer=policy_pb2.Policy.FromString,
            )
        return self._stubs["set_iam_policy"]

    @property
    def get_iam_policy(
        self,
    ) -> Callable[[iam_policy_pb2.GetIamPolicyRequest], policy_pb2.Policy]:
        r"""Return a callable for the get iam policy method over gRPC.

        Gets the access control policy for a database or backup
        resource. Returns an empty policy if a database or backup exists
        but does not have a policy set.

        Authorization requires ``spanner.databases.getIamPolicy``
        permission on
        [resource][google.iam.v1.GetIamPolicyRequest.resource]. For
        backups, authorization requires ``spanner.backups.getIamPolicy``
        permission on
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
                "/google.spanner.admin.database.v1.DatabaseAdmin/GetIamPolicy",
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
        database or backup resource.

        Attempting this RPC on a non-existent Cloud Spanner database
        will result in a NOT_FOUND error if the user has
        ``spanner.databases.list`` permission on the containing Cloud
        Spanner instance. Otherwise returns an empty set of permissions.
        Calling this method on a backup that does not exist will result
        in a NOT_FOUND error if the user has ``spanner.backups.list``
        permission on the containing instance.

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
                "/google.spanner.admin.database.v1.DatabaseAdmin/TestIamPermissions",
                request_serializer=iam_policy_pb2.TestIamPermissionsRequest.SerializeToString,
                response_deserializer=iam_policy_pb2.TestIamPermissionsResponse.FromString,
            )
        return self._stubs["test_iam_permissions"]

    @property
    def create_backup(
        self,
    ) -> Callable[[gsad_backup.CreateBackupRequest], operations_pb2.Operation]:
        r"""Return a callable for the create backup method over gRPC.

        Starts creating a new Cloud Spanner Backup. The returned backup
        [long-running operation][google.longrunning.Operation] will have
        a name of the format
        ``projects/<project>/instances/<instance>/backups/<backup>/operations/<operation_id>``
        and can be used to track creation of the backup. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CreateBackupMetadata][google.spanner.admin.database.v1.CreateBackupMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Backup][google.spanner.admin.database.v1.Backup], if
        successful. Cancelling the returned operation will stop the
        creation and delete the backup. There can be only one pending
        backup creation per database. Backup creation of different
        databases can run concurrently.

        Returns:
            Callable[[~.CreateBackupRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_backup" not in self._stubs:
            self._stubs["create_backup"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/CreateBackup",
                request_serializer=gsad_backup.CreateBackupRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["create_backup"]

    @property
    def copy_backup(
        self,
    ) -> Callable[[backup.CopyBackupRequest], operations_pb2.Operation]:
        r"""Return a callable for the copy backup method over gRPC.

        Starts copying a Cloud Spanner Backup. The returned backup
        [long-running operation][google.longrunning.Operation] will have
        a name of the format
        ``projects/<project>/instances/<instance>/backups/<backup>/operations/<operation_id>``
        and can be used to track copying of the backup. The operation is
        associated with the destination backup. The
        [metadata][google.longrunning.Operation.metadata] field type is
        [CopyBackupMetadata][google.spanner.admin.database.v1.CopyBackupMetadata].
        The [response][google.longrunning.Operation.response] field type
        is [Backup][google.spanner.admin.database.v1.Backup], if
        successful. Cancelling the returned operation will stop the
        copying and delete the backup. Concurrent CopyBackup requests
        can run on the same source backup.

        Returns:
            Callable[[~.CopyBackupRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "copy_backup" not in self._stubs:
            self._stubs["copy_backup"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/CopyBackup",
                request_serializer=backup.CopyBackupRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["copy_backup"]

    @property
    def get_backup(self) -> Callable[[backup.GetBackupRequest], backup.Backup]:
        r"""Return a callable for the get backup method over gRPC.

        Gets metadata on a pending or completed
        [Backup][google.spanner.admin.database.v1.Backup].

        Returns:
            Callable[[~.GetBackupRequest],
                    ~.Backup]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_backup" not in self._stubs:
            self._stubs["get_backup"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/GetBackup",
                request_serializer=backup.GetBackupRequest.serialize,
                response_deserializer=backup.Backup.deserialize,
            )
        return self._stubs["get_backup"]

    @property
    def update_backup(
        self,
    ) -> Callable[[gsad_backup.UpdateBackupRequest], gsad_backup.Backup]:
        r"""Return a callable for the update backup method over gRPC.

        Updates a pending or completed
        [Backup][google.spanner.admin.database.v1.Backup].

        Returns:
            Callable[[~.UpdateBackupRequest],
                    ~.Backup]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_backup" not in self._stubs:
            self._stubs["update_backup"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/UpdateBackup",
                request_serializer=gsad_backup.UpdateBackupRequest.serialize,
                response_deserializer=gsad_backup.Backup.deserialize,
            )
        return self._stubs["update_backup"]

    @property
    def delete_backup(self) -> Callable[[backup.DeleteBackupRequest], empty_pb2.Empty]:
        r"""Return a callable for the delete backup method over gRPC.

        Deletes a pending or completed
        [Backup][google.spanner.admin.database.v1.Backup].

        Returns:
            Callable[[~.DeleteBackupRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_backup" not in self._stubs:
            self._stubs["delete_backup"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/DeleteBackup",
                request_serializer=backup.DeleteBackupRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_backup"]

    @property
    def list_backups(
        self,
    ) -> Callable[[backup.ListBackupsRequest], backup.ListBackupsResponse]:
        r"""Return a callable for the list backups method over gRPC.

        Lists completed and pending backups. Backups returned are
        ordered by ``create_time`` in descending order, starting from
        the most recent ``create_time``.

        Returns:
            Callable[[~.ListBackupsRequest],
                    ~.ListBackupsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_backups" not in self._stubs:
            self._stubs["list_backups"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/ListBackups",
                request_serializer=backup.ListBackupsRequest.serialize,
                response_deserializer=backup.ListBackupsResponse.deserialize,
            )
        return self._stubs["list_backups"]

    @property
    def restore_database(
        self,
    ) -> Callable[
        [spanner_database_admin.RestoreDatabaseRequest], operations_pb2.Operation
    ]:
        r"""Return a callable for the restore database method over gRPC.

        Create a new database by restoring from a completed backup. The
        new database must be in the same project and in an instance with
        the same instance configuration as the instance containing the
        backup. The returned database [long-running
        operation][google.longrunning.Operation] has a name of the
        format
        ``projects/<project>/instances/<instance>/databases/<database>/operations/<operation_id>``,
        and can be used to track the progress of the operation, and to
        cancel it. The [metadata][google.longrunning.Operation.metadata]
        field type is
        [RestoreDatabaseMetadata][google.spanner.admin.database.v1.RestoreDatabaseMetadata].
        The [response][google.longrunning.Operation.response] type is
        [Database][google.spanner.admin.database.v1.Database], if
        successful. Cancelling the returned operation will stop the
        restore and delete the database. There can be only one database
        being restored into an instance at a time. Once the restore
        operation completes, a new restore operation can be initiated,
        without waiting for the optimize operation associated with the
        first restore to complete.

        Returns:
            Callable[[~.RestoreDatabaseRequest],
                    ~.Operation]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "restore_database" not in self._stubs:
            self._stubs["restore_database"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/RestoreDatabase",
                request_serializer=spanner_database_admin.RestoreDatabaseRequest.serialize,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["restore_database"]

    @property
    def list_database_operations(
        self,
    ) -> Callable[
        [spanner_database_admin.ListDatabaseOperationsRequest],
        spanner_database_admin.ListDatabaseOperationsResponse,
    ]:
        r"""Return a callable for the list database operations method over gRPC.

        Lists database
        [longrunning-operations][google.longrunning.Operation]. A
        database operation has a name of the form
        ``projects/<project>/instances/<instance>/databases/<database>/operations/<operation>``.
        The long-running operation
        [metadata][google.longrunning.Operation.metadata] field type
        ``metadata.type_url`` describes the type of the metadata.
        Operations returned include those that have
        completed/failed/canceled within the last 7 days, and pending
        operations.

        Returns:
            Callable[[~.ListDatabaseOperationsRequest],
                    ~.ListDatabaseOperationsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_database_operations" not in self._stubs:
            self._stubs["list_database_operations"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/ListDatabaseOperations",
                request_serializer=spanner_database_admin.ListDatabaseOperationsRequest.serialize,
                response_deserializer=spanner_database_admin.ListDatabaseOperationsResponse.deserialize,
            )
        return self._stubs["list_database_operations"]

    @property
    def list_backup_operations(
        self,
    ) -> Callable[
        [backup.ListBackupOperationsRequest], backup.ListBackupOperationsResponse
    ]:
        r"""Return a callable for the list backup operations method over gRPC.

        Lists the backup [long-running
        operations][google.longrunning.Operation] in the given instance.
        A backup operation has a name of the form
        ``projects/<project>/instances/<instance>/backups/<backup>/operations/<operation>``.
        The long-running operation
        [metadata][google.longrunning.Operation.metadata] field type
        ``metadata.type_url`` describes the type of the metadata.
        Operations returned include those that have
        completed/failed/canceled within the last 7 days, and pending
        operations. Operations returned are ordered by
        ``operation.metadata.value.progress.start_time`` in descending
        order starting from the most recently started operation.

        Returns:
            Callable[[~.ListBackupOperationsRequest],
                    ~.ListBackupOperationsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_backup_operations" not in self._stubs:
            self._stubs["list_backup_operations"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/ListBackupOperations",
                request_serializer=backup.ListBackupOperationsRequest.serialize,
                response_deserializer=backup.ListBackupOperationsResponse.deserialize,
            )
        return self._stubs["list_backup_operations"]

    @property
    def list_database_roles(
        self,
    ) -> Callable[
        [spanner_database_admin.ListDatabaseRolesRequest],
        spanner_database_admin.ListDatabaseRolesResponse,
    ]:
        r"""Return a callable for the list database roles method over gRPC.

        Lists Cloud Spanner database roles.

        Returns:
            Callable[[~.ListDatabaseRolesRequest],
                    ~.ListDatabaseRolesResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_database_roles" not in self._stubs:
            self._stubs["list_database_roles"] = self.grpc_channel.unary_unary(
                "/google.spanner.admin.database.v1.DatabaseAdmin/ListDatabaseRoles",
                request_serializer=spanner_database_admin.ListDatabaseRolesRequest.serialize,
                response_deserializer=spanner_database_admin.ListDatabaseRolesResponse.deserialize,
            )
        return self._stubs["list_database_roles"]

    def close(self):
        self.grpc_channel.close()

    @property
    def delete_operation(
        self,
    ) -> Callable[[operations_pb2.DeleteOperationRequest], None]:
        r"""Return a callable for the delete_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_operation" not in self._stubs:
            self._stubs["delete_operation"] = self.grpc_channel.unary_unary(
                "/google.longrunning.Operations/DeleteOperation",
                request_serializer=operations_pb2.DeleteOperationRequest.SerializeToString,
                response_deserializer=None,
            )
        return self._stubs["delete_operation"]

    @property
    def cancel_operation(
        self,
    ) -> Callable[[operations_pb2.CancelOperationRequest], None]:
        r"""Return a callable for the cancel_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "cancel_operation" not in self._stubs:
            self._stubs["cancel_operation"] = self.grpc_channel.unary_unary(
                "/google.longrunning.Operations/CancelOperation",
                request_serializer=operations_pb2.CancelOperationRequest.SerializeToString,
                response_deserializer=None,
            )
        return self._stubs["cancel_operation"]

    @property
    def get_operation(
        self,
    ) -> Callable[[operations_pb2.GetOperationRequest], operations_pb2.Operation]:
        r"""Return a callable for the get_operation method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_operation" not in self._stubs:
            self._stubs["get_operation"] = self.grpc_channel.unary_unary(
                "/google.longrunning.Operations/GetOperation",
                request_serializer=operations_pb2.GetOperationRequest.SerializeToString,
                response_deserializer=operations_pb2.Operation.FromString,
            )
        return self._stubs["get_operation"]

    @property
    def list_operations(
        self,
    ) -> Callable[
        [operations_pb2.ListOperationsRequest], operations_pb2.ListOperationsResponse
    ]:
        r"""Return a callable for the list_operations method over gRPC."""
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_operations" not in self._stubs:
            self._stubs["list_operations"] = self.grpc_channel.unary_unary(
                "/google.longrunning.Operations/ListOperations",
                request_serializer=operations_pb2.ListOperationsRequest.SerializeToString,
                response_deserializer=operations_pb2.ListOperationsResponse.FromString,
            )
        return self._stubs["list_operations"]

    @property
    def kind(self) -> str:
        return "grpc"


__all__ = ("DatabaseAdminGrpcTransport",)
