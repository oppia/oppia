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
import json
import logging as std_logging
import pickle
import warnings
from typing import Callable, Dict, Optional, Sequence, Tuple, Union

from google.api_core import grpc_helpers
from google.api_core import gapic_v1
import google.auth  # type: ignore
from google.auth import credentials as ga_credentials  # type: ignore
from google.auth.transport.grpc import SslCredentials  # type: ignore
from google.protobuf.json_format import MessageToJson
import google.protobuf.message

import grpc  # type: ignore
import proto  # type: ignore

from google.cloud.firestore_v1.types import document
from google.cloud.firestore_v1.types import document as gf_document
from google.cloud.firestore_v1.types import firestore
from google.cloud.location import locations_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from .base import FirestoreTransport, DEFAULT_CLIENT_INFO

try:
    from google.api_core import client_logging  # type: ignore

    CLIENT_LOGGING_SUPPORTED = True  # pragma: NO COVER
except ImportError:  # pragma: NO COVER
    CLIENT_LOGGING_SUPPORTED = False

_LOGGER = std_logging.getLogger(__name__)


class _LoggingClientInterceptor(grpc.UnaryUnaryClientInterceptor):  # pragma: NO COVER
    def intercept_unary_unary(self, continuation, client_call_details, request):
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
                    "serviceName": "google.firestore.v1.Firestore",
                    "rpcName": str(client_call_details.method),
                    "request": grpc_request,
                    "metadata": grpc_request["metadata"],
                },
            )
        response = continuation(client_call_details, request)
        if logging_enabled:  # pragma: NO COVER
            response_metadata = response.trailing_metadata()
            # Convert gRPC metadata `<class 'grpc.aio._metadata.Metadata'>` to list of tuples
            metadata = (
                dict([(k, str(v)) for k, v in response_metadata])
                if response_metadata
                else None
            )
            result = response.result()
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
                f"Received response for {client_call_details.method}.",
                extra={
                    "serviceName": "google.firestore.v1.Firestore",
                    "rpcName": client_call_details.method,
                    "response": grpc_response,
                    "metadata": grpc_response["metadata"],
                },
            )
        return response


class FirestoreGrpcTransport(FirestoreTransport):
    """gRPC backend transport for Firestore.

    The Cloud Firestore service.

    Cloud Firestore is a fast, fully managed, serverless,
    cloud-native NoSQL document database that simplifies storing,
    syncing, and querying data for your mobile, web, and IoT apps at
    global scale. Its client libraries provide live synchronization
    and offline support, while its security features and
    integrations with Firebase and Google Cloud Platform accelerate
    building truly serverless apps.

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
        host: str = "firestore.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        channel: Optional[Union[grpc.Channel, Callable[..., grpc.Channel]]] = None,
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
                 The hostname to connect to (default: 'firestore.googleapis.com').
            credentials (Optional[google.auth.credentials.Credentials]): The
                authorization credentials to attach to requests. These
                credentials identify the application to the service; if none
                are specified, the client will attempt to ascertain the
                credentials from the environment.
                This argument is ignored if a ``channel`` instance is provided.
            credentials_file (Optional[str]): A file with credentials that can
                be loaded with :func:`google.auth.load_credentials_from_file`.
                This argument is ignored if a ``channel`` instance is provided.
            scopes (Optional(Sequence[str])): A list of scopes. This argument is
                ignored if a ``channel`` instance is provided.
            channel (Optional[Union[grpc.Channel, Callable[..., grpc.Channel]]]):
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
          google.auth.exceptions.MutualTLSChannelError: If mutual TLS transport
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

        if isinstance(channel, grpc.Channel):
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

        self._interceptor = _LoggingClientInterceptor()
        self._logged_channel = grpc.intercept_channel(
            self._grpc_channel, self._interceptor
        )

        # Wrap messages. This must be done after self._logged_channel exists
        self._prep_wrapped_messages(client_info)

    @classmethod
    def create_channel(
        cls,
        host: str = "firestore.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
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
    def get_document(
        self,
    ) -> Callable[[firestore.GetDocumentRequest], document.Document]:
        r"""Return a callable for the get document method over gRPC.

        Gets a single document.

        Returns:
            Callable[[~.GetDocumentRequest],
                    ~.Document]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "get_document" not in self._stubs:
            self._stubs["get_document"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/GetDocument",
                request_serializer=firestore.GetDocumentRequest.serialize,
                response_deserializer=document.Document.deserialize,
            )
        return self._stubs["get_document"]

    @property
    def list_documents(
        self,
    ) -> Callable[[firestore.ListDocumentsRequest], firestore.ListDocumentsResponse]:
        r"""Return a callable for the list documents method over gRPC.

        Lists documents.

        Returns:
            Callable[[~.ListDocumentsRequest],
                    ~.ListDocumentsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_documents" not in self._stubs:
            self._stubs["list_documents"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/ListDocuments",
                request_serializer=firestore.ListDocumentsRequest.serialize,
                response_deserializer=firestore.ListDocumentsResponse.deserialize,
            )
        return self._stubs["list_documents"]

    @property
    def update_document(
        self,
    ) -> Callable[[firestore.UpdateDocumentRequest], gf_document.Document]:
        r"""Return a callable for the update document method over gRPC.

        Updates or inserts a document.

        Returns:
            Callable[[~.UpdateDocumentRequest],
                    ~.Document]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "update_document" not in self._stubs:
            self._stubs["update_document"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/UpdateDocument",
                request_serializer=firestore.UpdateDocumentRequest.serialize,
                response_deserializer=gf_document.Document.deserialize,
            )
        return self._stubs["update_document"]

    @property
    def delete_document(
        self,
    ) -> Callable[[firestore.DeleteDocumentRequest], empty_pb2.Empty]:
        r"""Return a callable for the delete document method over gRPC.

        Deletes a document.

        Returns:
            Callable[[~.DeleteDocumentRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "delete_document" not in self._stubs:
            self._stubs["delete_document"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/DeleteDocument",
                request_serializer=firestore.DeleteDocumentRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["delete_document"]

    @property
    def batch_get_documents(
        self,
    ) -> Callable[
        [firestore.BatchGetDocumentsRequest], firestore.BatchGetDocumentsResponse
    ]:
        r"""Return a callable for the batch get documents method over gRPC.

        Gets multiple documents.

        Documents returned by this method are not guaranteed to
        be returned in the same order that they were requested.

        Returns:
            Callable[[~.BatchGetDocumentsRequest],
                    ~.BatchGetDocumentsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "batch_get_documents" not in self._stubs:
            self._stubs["batch_get_documents"] = self._logged_channel.unary_stream(
                "/google.firestore.v1.Firestore/BatchGetDocuments",
                request_serializer=firestore.BatchGetDocumentsRequest.serialize,
                response_deserializer=firestore.BatchGetDocumentsResponse.deserialize,
            )
        return self._stubs["batch_get_documents"]

    @property
    def begin_transaction(
        self,
    ) -> Callable[
        [firestore.BeginTransactionRequest], firestore.BeginTransactionResponse
    ]:
        r"""Return a callable for the begin transaction method over gRPC.

        Starts a new transaction.

        Returns:
            Callable[[~.BeginTransactionRequest],
                    ~.BeginTransactionResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "begin_transaction" not in self._stubs:
            self._stubs["begin_transaction"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/BeginTransaction",
                request_serializer=firestore.BeginTransactionRequest.serialize,
                response_deserializer=firestore.BeginTransactionResponse.deserialize,
            )
        return self._stubs["begin_transaction"]

    @property
    def commit(self) -> Callable[[firestore.CommitRequest], firestore.CommitResponse]:
        r"""Return a callable for the commit method over gRPC.

        Commits a transaction, while optionally updating
        documents.

        Returns:
            Callable[[~.CommitRequest],
                    ~.CommitResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "commit" not in self._stubs:
            self._stubs["commit"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/Commit",
                request_serializer=firestore.CommitRequest.serialize,
                response_deserializer=firestore.CommitResponse.deserialize,
            )
        return self._stubs["commit"]

    @property
    def rollback(self) -> Callable[[firestore.RollbackRequest], empty_pb2.Empty]:
        r"""Return a callable for the rollback method over gRPC.

        Rolls back a transaction.

        Returns:
            Callable[[~.RollbackRequest],
                    ~.Empty]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "rollback" not in self._stubs:
            self._stubs["rollback"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/Rollback",
                request_serializer=firestore.RollbackRequest.serialize,
                response_deserializer=empty_pb2.Empty.FromString,
            )
        return self._stubs["rollback"]

    @property
    def run_query(
        self,
    ) -> Callable[[firestore.RunQueryRequest], firestore.RunQueryResponse]:
        r"""Return a callable for the run query method over gRPC.

        Runs a query.

        Returns:
            Callable[[~.RunQueryRequest],
                    ~.RunQueryResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "run_query" not in self._stubs:
            self._stubs["run_query"] = self._logged_channel.unary_stream(
                "/google.firestore.v1.Firestore/RunQuery",
                request_serializer=firestore.RunQueryRequest.serialize,
                response_deserializer=firestore.RunQueryResponse.deserialize,
            )
        return self._stubs["run_query"]

    @property
    def run_aggregation_query(
        self,
    ) -> Callable[
        [firestore.RunAggregationQueryRequest], firestore.RunAggregationQueryResponse
    ]:
        r"""Return a callable for the run aggregation query method over gRPC.

        Runs an aggregation query.

        Rather than producing [Document][google.firestore.v1.Document]
        results like
        [Firestore.RunQuery][google.firestore.v1.Firestore.RunQuery],
        this API allows running an aggregation to produce a series of
        [AggregationResult][google.firestore.v1.AggregationResult]
        server-side.

        High-Level Example:

        ::

           -- Return the number of documents in table given a filter.
           SELECT COUNT(*) FROM ( SELECT * FROM k where a = true );

        Returns:
            Callable[[~.RunAggregationQueryRequest],
                    ~.RunAggregationQueryResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "run_aggregation_query" not in self._stubs:
            self._stubs["run_aggregation_query"] = self._logged_channel.unary_stream(
                "/google.firestore.v1.Firestore/RunAggregationQuery",
                request_serializer=firestore.RunAggregationQueryRequest.serialize,
                response_deserializer=firestore.RunAggregationQueryResponse.deserialize,
            )
        return self._stubs["run_aggregation_query"]

    @property
    def partition_query(
        self,
    ) -> Callable[[firestore.PartitionQueryRequest], firestore.PartitionQueryResponse]:
        r"""Return a callable for the partition query method over gRPC.

        Partitions a query by returning partition cursors
        that can be used to run the query in parallel. The
        returned partition cursors are split points that can be
        used by RunQuery as starting/end points for the query
        results.

        Returns:
            Callable[[~.PartitionQueryRequest],
                    ~.PartitionQueryResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "partition_query" not in self._stubs:
            self._stubs["partition_query"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/PartitionQuery",
                request_serializer=firestore.PartitionQueryRequest.serialize,
                response_deserializer=firestore.PartitionQueryResponse.deserialize,
            )
        return self._stubs["partition_query"]

    @property
    def write(self) -> Callable[[firestore.WriteRequest], firestore.WriteResponse]:
        r"""Return a callable for the write method over gRPC.

        Streams batches of document updates and deletes, in
        order. This method is only available via gRPC or
        WebChannel (not REST).

        Returns:
            Callable[[~.WriteRequest],
                    ~.WriteResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "write" not in self._stubs:
            self._stubs["write"] = self._logged_channel.stream_stream(
                "/google.firestore.v1.Firestore/Write",
                request_serializer=firestore.WriteRequest.serialize,
                response_deserializer=firestore.WriteResponse.deserialize,
            )
        return self._stubs["write"]

    @property
    def listen(self) -> Callable[[firestore.ListenRequest], firestore.ListenResponse]:
        r"""Return a callable for the listen method over gRPC.

        Listens to changes. This method is only available via
        gRPC or WebChannel (not REST).

        Returns:
            Callable[[~.ListenRequest],
                    ~.ListenResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "listen" not in self._stubs:
            self._stubs["listen"] = self._logged_channel.stream_stream(
                "/google.firestore.v1.Firestore/Listen",
                request_serializer=firestore.ListenRequest.serialize,
                response_deserializer=firestore.ListenResponse.deserialize,
            )
        return self._stubs["listen"]

    @property
    def list_collection_ids(
        self,
    ) -> Callable[
        [firestore.ListCollectionIdsRequest], firestore.ListCollectionIdsResponse
    ]:
        r"""Return a callable for the list collection ids method over gRPC.

        Lists all the collection IDs underneath a document.

        Returns:
            Callable[[~.ListCollectionIdsRequest],
                    ~.ListCollectionIdsResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "list_collection_ids" not in self._stubs:
            self._stubs["list_collection_ids"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/ListCollectionIds",
                request_serializer=firestore.ListCollectionIdsRequest.serialize,
                response_deserializer=firestore.ListCollectionIdsResponse.deserialize,
            )
        return self._stubs["list_collection_ids"]

    @property
    def batch_write(
        self,
    ) -> Callable[[firestore.BatchWriteRequest], firestore.BatchWriteResponse]:
        r"""Return a callable for the batch write method over gRPC.

        Applies a batch of write operations.

        The BatchWrite method does not apply the write operations
        atomically and can apply them out of order. Method does not
        allow more than one write per document. Each write succeeds or
        fails independently. See the
        [BatchWriteResponse][google.firestore.v1.BatchWriteResponse] for
        the success status of each write.

        If you require an atomically applied set of writes, use
        [Commit][google.firestore.v1.Firestore.Commit] instead.

        Returns:
            Callable[[~.BatchWriteRequest],
                    ~.BatchWriteResponse]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "batch_write" not in self._stubs:
            self._stubs["batch_write"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/BatchWrite",
                request_serializer=firestore.BatchWriteRequest.serialize,
                response_deserializer=firestore.BatchWriteResponse.deserialize,
            )
        return self._stubs["batch_write"]

    @property
    def create_document(
        self,
    ) -> Callable[[firestore.CreateDocumentRequest], document.Document]:
        r"""Return a callable for the create document method over gRPC.

        Creates a new document.

        Returns:
            Callable[[~.CreateDocumentRequest],
                    ~.Document]:
                A function that, when called, will call the underlying RPC
                on the server.
        """
        # Generate a "stub function" on-the-fly which will actually make
        # the request.
        # gRPC handles serialization and deserialization, so we just need
        # to pass in the functions for each.
        if "create_document" not in self._stubs:
            self._stubs["create_document"] = self._logged_channel.unary_unary(
                "/google.firestore.v1.Firestore/CreateDocument",
                request_serializer=firestore.CreateDocumentRequest.serialize,
                response_deserializer=document.Document.deserialize,
            )
        return self._stubs["create_document"]

    def close(self):
        self._logged_channel.close()

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
            self._stubs["delete_operation"] = self._logged_channel.unary_unary(
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
            self._stubs["cancel_operation"] = self._logged_channel.unary_unary(
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
            self._stubs["get_operation"] = self._logged_channel.unary_unary(
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
            self._stubs["list_operations"] = self._logged_channel.unary_unary(
                "/google.longrunning.Operations/ListOperations",
                request_serializer=operations_pb2.ListOperationsRequest.SerializeToString,
                response_deserializer=operations_pb2.ListOperationsResponse.FromString,
            )
        return self._stubs["list_operations"]

    @property
    def kind(self) -> str:
        return "grpc"


__all__ = ("FirestoreGrpcTransport",)
