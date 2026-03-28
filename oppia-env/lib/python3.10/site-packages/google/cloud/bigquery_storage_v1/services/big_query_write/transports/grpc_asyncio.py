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
from typing import Awaitable, Callable, Dict, Optional, Sequence, Tuple, Union

from google.api_core import gapic_v1
from google.api_core import grpc_helpers_async
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.grpc import SslCredentials  # type: ignore

import grpc  # type: ignore
from grpc.experimental import aio  # type: ignore

from google.cloud.bigquery_storage_v1.types import storage
from google.cloud.bigquery_storage_v1.types import stream
from .base import BigQueryWriteTransport, DEFAULT_CLIENT_INFO
from .grpc import BigQueryWriteGrpcTransport


class BigQueryWriteGrpcAsyncIOTransport(BigQueryWriteTransport):
    """gRPC AsyncIO backend transport for BigQueryWrite.

    BigQuery Write API.
    The Write API can be used to write data to BigQuery.
    For supplementary information about the Write API, see:
    https://cloud.google.com/bigquery/docs/write-api

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
        host: str = "bigquerystorage.googleapis.com",
        credentials: ga_credentials.Credentials = None,
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
                This argument is ignored if ``channel`` is provided.
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
        host: str = "bigquerystorage.googleapis.com",
        credentials: ga_credentials.Credentials = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        channel: aio.Channel = None,
        api_mtls_endpoint: str = None,
        client_cert_source: Callable[[], Tuple[bytes, bytes]] = None,
        ssl_channel_credentials: grpc.ChannelCredentials = None,
        client_cert_source_for_mtls: Callable[[], Tuple[bytes, bytes]] = None,
        quota_project_id=None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
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
            scopes (Optional[Sequence[str]]): A optional list of scopes needed for this
                service. These are only used when credentials are not specified and
                are passed to :func:`google.auth.default`.
            channel (Optional[aio.Channel]): A ``Channel`` instance through
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

    @property
    def grpc_channel(self) -> aio.Channel:
        """Create the channel designed to connect to this service.

        This property caches on the instance; repeated calls return
        the same channel.
        """
        # Return the channel from cache.
        return self._grpc_channel

    @property
    def create_write_stream(
        self,
    ) -> Callable[[storage.CreateWriteStreamRequest], Awaitable[stream.WriteStream]]:
        r"""Return a callable for the create write stream method over gRPC.

        Creates a write stream to the given table. Additionally, every
        table has a special stream named '_default' to which data can be
        written. This stream doesn't need to be created using
        CreateWriteStream. It is a stream that can be used
        simultaneously by any number of clients. Data written to this
        stream is considered committed as soon as an acknowledgement is
        received.

        Returns:
            Callable[[~.CreateWriteStreamRequest],
                    Awaitable[~.WriteStream]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_write_stream" not in self._stubs:
            self._stubs["create_write_stream"] = self.grpc_channel.unary_unary(
                "/google.cloud.bigquery.storage.v1.BigQueryWrite/CreateWriteStream",
                request_serializer=storage.CreateWriteStreamRequest.serialize,
                response_deserializer=stream.WriteStream.deserialize,
            )
        return self._stubs["create_write_stream"]

    @property
    def append_rows(
        self,
    ) -> Callable[[storage.AppendRowsRequest], Awaitable[storage.AppendRowsResponse]]:
        r"""Return a callable for the append rows method over gRPC.

        Appends data to the given stream.

        If ``offset`` is specified, the ``offset`` is checked against
        the end of stream. The server returns ``OUT_OF_RANGE`` in
        ``AppendRowsResponse`` if an attempt is made to append to an
        offset beyond the current end of the stream or
        ``ALREADY_EXISTS`` if user provides an ``offset`` that has
        already been written to. User can retry with adjusted offset
        within the same RPC connection. If ``offset`` is not specified,
        append happens at the end of the stream.

        The response contains an optional offset at which the append
        happened. No offset information will be returned for appends to
        a default stream.

        Responses are received in the same order in which requests are
        sent. There will be one response for each successful inserted
        request. Responses may optionally embed error information if the
        originating AppendRequest was not successfully processed.

        The specifics of when successfully appended data is made visible
        to the table are governed by the type of stream:

        -  For COMMITTED streams (which includes the default stream),
           data is visible immediately upon successful append.

        -  For BUFFERED streams, data is made visible via a subsequent
           ``FlushRows`` rpc which advances a cursor to a newer offset
           in the stream.

        -  For PENDING streams, data is not made visible until the
           stream itself is finalized (via the ``FinalizeWriteStream``
           rpc), and the stream is explicitly committed via the
           ``BatchCommitWriteStreams`` rpc.

        Note: For users coding against the gRPC api directly, it may be
        necessary to supply the x-goog-request-params system parameter
        with ``write_stream=<full_write_stream_name>``.

        More information about system parameters:
        https://cloud.google.com/apis/docs/system-parameters

        Returns:
            Callable[[~.AppendRowsRequest],
                    Awaitable[~.AppendRowsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "append_rows" not in self._stubs:
            self._stubs["append_rows"] = self.grpc_channel.stream_stream(
                "/google.cloud.bigquery.storage.v1.BigQueryWrite/AppendRows",
                request_serializer=storage.AppendRowsRequest.serialize,
                response_deserializer=storage.AppendRowsResponse.deserialize,
            )
        return self._stubs["append_rows"]

    @property
    def get_write_stream(
        self,
    ) -> Callable[[storage.GetWriteStreamRequest], Awaitable[stream.WriteStream]]:
        r"""Return a callable for the get write stream method over gRPC.

        Gets information about a write stream.

        Returns:
            Callable[[~.GetWriteStreamRequest],
                    Awaitable[~.WriteStream]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_write_stream" not in self._stubs:
            self._stubs["get_write_stream"] = self.grpc_channel.unary_unary(
                "/google.cloud.bigquery.storage.v1.BigQueryWrite/GetWriteStream",
                request_serializer=storage.GetWriteStreamRequest.serialize,
                response_deserializer=stream.WriteStream.deserialize,
            )
        return self._stubs["get_write_stream"]

    @property
    def finalize_write_stream(
        self,
    ) -> Callable[
        [storage.FinalizeWriteStreamRequest],
        Awaitable[storage.FinalizeWriteStreamResponse],
    ]:
        r"""Return a callable for the finalize write stream method over gRPC.

        Finalize a write stream so that no new data can be appended to
        the stream. Finalize is not supported on the '_default' stream.

        Returns:
            Callable[[~.FinalizeWriteStreamRequest],
                    Awaitable[~.FinalizeWriteStreamResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "finalize_write_stream" not in self._stubs:
            self._stubs["finalize_write_stream"] = self.grpc_channel.unary_unary(
                "/google.cloud.bigquery.storage.v1.BigQueryWrite/FinalizeWriteStream",
                request_serializer=storage.FinalizeWriteStreamRequest.serialize,
                response_deserializer=storage.FinalizeWriteStreamResponse.deserialize,
            )
        return self._stubs["finalize_write_stream"]

    @property
    def batch_commit_write_streams(
        self,
    ) -> Callable[
        [storage.BatchCommitWriteStreamsRequest],
        Awaitable[storage.BatchCommitWriteStreamsResponse],
    ]:
        r"""Return a callable for the batch commit write streams method over gRPC.

        Atomically commits a group of ``PENDING`` streams that belong to
        the same ``parent`` table.

        Streams must be finalized before commit and cannot be committed
        multiple times. Once a stream is committed, data in the stream
        becomes available for read operations.

        Returns:
            Callable[[~.BatchCommitWriteStreamsRequest],
                    Awaitable[~.BatchCommitWriteStreamsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "batch_commit_write_streams" not in self._stubs:
            self._stubs["batch_commit_write_streams"] = self.grpc_channel.unary_unary(
                "/google.cloud.bigquery.storage.v1.BigQueryWrite/BatchCommitWriteStreams",
                request_serializer=storage.BatchCommitWriteStreamsRequest.serialize,
                response_deserializer=storage.BatchCommitWriteStreamsResponse.deserialize,
            )
        return self._stubs["batch_commit_write_streams"]

    @property
    def flush_rows(
        self,
    ) -> Callable[[storage.FlushRowsRequest], Awaitable[storage.FlushRowsResponse]]:
        r"""Return a callable for the flush rows method over gRPC.

        Flushes rows to a BUFFERED stream.

        If users are appending rows to BUFFERED stream, flush operation
        is required in order for the rows to become available for
        reading. A Flush operation flushes up to any previously flushed
        offset in a BUFFERED stream, to the offset specified in the
        request.

        Flush is not supported on the \_default stream, since it is not
        BUFFERED.

        Returns:
            Callable[[~.FlushRowsRequest],
                    Awaitable[~.FlushRowsResponse]]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "flush_rows" not in self._stubs:
            self._stubs["flush_rows"] = self.grpc_channel.unary_unary(
                "/google.cloud.bigquery.storage.v1.BigQueryWrite/FlushRows",
                request_serializer=storage.FlushRowsRequest.serialize,
                response_deserializer=storage.FlushRowsResponse.deserialize,
            )
        return self._stubs["flush_rows"]

    def close(self):
        return self.grpc_channel.close()


__all__ = ("BigQueryWriteGrpcAsyncIOTransport",)
