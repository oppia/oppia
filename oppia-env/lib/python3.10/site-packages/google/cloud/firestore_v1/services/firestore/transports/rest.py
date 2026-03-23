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
import logging
import json  # type: ignore

from google.auth.transport.requests import AuthorizedSession  # type: ignore
from google.auth import credentials as ga_credentials  # type: ignore
from google.api_core import exceptions as core_exceptions
from google.api_core import retry as retries
from google.api_core import rest_helpers
from google.api_core import rest_streaming
from google.api_core import gapic_v1
import google.protobuf

from google.protobuf import json_format
from google.cloud.location import locations_pb2  # type: ignore

from requests import __version__ as requests_version
import dataclasses
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union
import warnings


from google.cloud.firestore_v1.types import document
from google.cloud.firestore_v1.types import document as gf_document
from google.cloud.firestore_v1.types import firestore
from google.protobuf import empty_pb2  # type: ignore
from google.longrunning import operations_pb2  # type: ignore


from .rest_base import _BaseFirestoreRestTransport
from .base import DEFAULT_CLIENT_INFO as BASE_DEFAULT_CLIENT_INFO

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


class FirestoreRestInterceptor:
    """Interceptor for Firestore.

    Interceptors are used to manipulate requests, request metadata, and responses
    in arbitrary ways.
    Example use cases include:
    * Logging
    * Verifying requests according to service or custom semantics
    * Stripping extraneous information from responses

    These use cases and more can be enabled by injecting an
    instance of a custom subclass when constructing the FirestoreRestTransport.

    .. code-block:: python
        class MyCustomFirestoreInterceptor(FirestoreRestInterceptor):
            def pre_batch_get_documents(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_batch_get_documents(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_batch_write(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_batch_write(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_begin_transaction(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_begin_transaction(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_commit(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_commit(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_create_document(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_create_document(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_delete_document(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_get_document(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_get_document(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_collection_ids(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_collection_ids(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_list_documents(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_list_documents(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_partition_query(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_partition_query(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_rollback(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def pre_run_aggregation_query(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_run_aggregation_query(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_run_query(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_run_query(self, response):
                logging.log(f"Received response: {response}")
                return response

            def pre_update_document(self, request, metadata):
                logging.log(f"Received request: {request}")
                return request, metadata

            def post_update_document(self, response):
                logging.log(f"Received response: {response}")
                return response

        transport = FirestoreRestTransport(interceptor=MyCustomFirestoreInterceptor())
        client = FirestoreClient(transport=transport)


    """

    def pre_batch_get_documents(
        self,
        request: firestore.BatchGetDocumentsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.BatchGetDocumentsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for batch_get_documents

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_batch_get_documents(
        self, response: rest_streaming.ResponseIterator
    ) -> rest_streaming.ResponseIterator:
        """Post-rpc interceptor for batch_get_documents

        DEPRECATED. Please use the `post_batch_get_documents_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_batch_get_documents` interceptor runs
        before the `post_batch_get_documents_with_metadata` interceptor.
        """
        return response

    def post_batch_get_documents_with_metadata(
        self,
        response: rest_streaming.ResponseIterator,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        rest_streaming.ResponseIterator, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for batch_get_documents

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_batch_get_documents_with_metadata`
        interceptor in new development instead of the `post_batch_get_documents` interceptor.
        When both interceptors are used, this `post_batch_get_documents_with_metadata` interceptor runs after the
        `post_batch_get_documents` interceptor. The (possibly modified) response returned by
        `post_batch_get_documents` will be passed to
        `post_batch_get_documents_with_metadata`.
        """
        return response, metadata

    def pre_batch_write(
        self,
        request: firestore.BatchWriteRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.BatchWriteRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for batch_write

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_batch_write(
        self, response: firestore.BatchWriteResponse
    ) -> firestore.BatchWriteResponse:
        """Post-rpc interceptor for batch_write

        DEPRECATED. Please use the `post_batch_write_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_batch_write` interceptor runs
        before the `post_batch_write_with_metadata` interceptor.
        """
        return response

    def post_batch_write_with_metadata(
        self,
        response: firestore.BatchWriteResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.BatchWriteResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for batch_write

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_batch_write_with_metadata`
        interceptor in new development instead of the `post_batch_write` interceptor.
        When both interceptors are used, this `post_batch_write_with_metadata` interceptor runs after the
        `post_batch_write` interceptor. The (possibly modified) response returned by
        `post_batch_write` will be passed to
        `post_batch_write_with_metadata`.
        """
        return response, metadata

    def pre_begin_transaction(
        self,
        request: firestore.BeginTransactionRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.BeginTransactionRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for begin_transaction

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_begin_transaction(
        self, response: firestore.BeginTransactionResponse
    ) -> firestore.BeginTransactionResponse:
        """Post-rpc interceptor for begin_transaction

        DEPRECATED. Please use the `post_begin_transaction_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_begin_transaction` interceptor runs
        before the `post_begin_transaction_with_metadata` interceptor.
        """
        return response

    def post_begin_transaction_with_metadata(
        self,
        response: firestore.BeginTransactionResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.BeginTransactionResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for begin_transaction

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_begin_transaction_with_metadata`
        interceptor in new development instead of the `post_begin_transaction` interceptor.
        When both interceptors are used, this `post_begin_transaction_with_metadata` interceptor runs after the
        `post_begin_transaction` interceptor. The (possibly modified) response returned by
        `post_begin_transaction` will be passed to
        `post_begin_transaction_with_metadata`.
        """
        return response, metadata

    def pre_commit(
        self,
        request: firestore.CommitRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.CommitRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for commit

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_commit(
        self, response: firestore.CommitResponse
    ) -> firestore.CommitResponse:
        """Post-rpc interceptor for commit

        DEPRECATED. Please use the `post_commit_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_commit` interceptor runs
        before the `post_commit_with_metadata` interceptor.
        """
        return response

    def post_commit_with_metadata(
        self,
        response: firestore.CommitResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.CommitResponse, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for commit

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_commit_with_metadata`
        interceptor in new development instead of the `post_commit` interceptor.
        When both interceptors are used, this `post_commit_with_metadata` interceptor runs after the
        `post_commit` interceptor. The (possibly modified) response returned by
        `post_commit` will be passed to
        `post_commit_with_metadata`.
        """
        return response, metadata

    def pre_create_document(
        self,
        request: firestore.CreateDocumentRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.CreateDocumentRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for create_document

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_create_document(self, response: document.Document) -> document.Document:
        """Post-rpc interceptor for create_document

        DEPRECATED. Please use the `post_create_document_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_create_document` interceptor runs
        before the `post_create_document_with_metadata` interceptor.
        """
        return response

    def post_create_document_with_metadata(
        self,
        response: document.Document,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[document.Document, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for create_document

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_create_document_with_metadata`
        interceptor in new development instead of the `post_create_document` interceptor.
        When both interceptors are used, this `post_create_document_with_metadata` interceptor runs after the
        `post_create_document` interceptor. The (possibly modified) response returned by
        `post_create_document` will be passed to
        `post_create_document_with_metadata`.
        """
        return response, metadata

    def pre_delete_document(
        self,
        request: firestore.DeleteDocumentRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.DeleteDocumentRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_document

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def pre_get_document(
        self,
        request: firestore.GetDocumentRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.GetDocumentRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for get_document

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_get_document(self, response: document.Document) -> document.Document:
        """Post-rpc interceptor for get_document

        DEPRECATED. Please use the `post_get_document_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_get_document` interceptor runs
        before the `post_get_document_with_metadata` interceptor.
        """
        return response

    def post_get_document_with_metadata(
        self,
        response: document.Document,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[document.Document, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for get_document

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_get_document_with_metadata`
        interceptor in new development instead of the `post_get_document` interceptor.
        When both interceptors are used, this `post_get_document_with_metadata` interceptor runs after the
        `post_get_document` interceptor. The (possibly modified) response returned by
        `post_get_document` will be passed to
        `post_get_document_with_metadata`.
        """
        return response, metadata

    def pre_list_collection_ids(
        self,
        request: firestore.ListCollectionIdsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.ListCollectionIdsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_collection_ids

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_list_collection_ids(
        self, response: firestore.ListCollectionIdsResponse
    ) -> firestore.ListCollectionIdsResponse:
        """Post-rpc interceptor for list_collection_ids

        DEPRECATED. Please use the `post_list_collection_ids_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_list_collection_ids` interceptor runs
        before the `post_list_collection_ids_with_metadata` interceptor.
        """
        return response

    def post_list_collection_ids_with_metadata(
        self,
        response: firestore.ListCollectionIdsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.ListCollectionIdsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_collection_ids

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_list_collection_ids_with_metadata`
        interceptor in new development instead of the `post_list_collection_ids` interceptor.
        When both interceptors are used, this `post_list_collection_ids_with_metadata` interceptor runs after the
        `post_list_collection_ids` interceptor. The (possibly modified) response returned by
        `post_list_collection_ids` will be passed to
        `post_list_collection_ids_with_metadata`.
        """
        return response, metadata

    def pre_list_documents(
        self,
        request: firestore.ListDocumentsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.ListDocumentsRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for list_documents

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_list_documents(
        self, response: firestore.ListDocumentsResponse
    ) -> firestore.ListDocumentsResponse:
        """Post-rpc interceptor for list_documents

        DEPRECATED. Please use the `post_list_documents_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_list_documents` interceptor runs
        before the `post_list_documents_with_metadata` interceptor.
        """
        return response

    def post_list_documents_with_metadata(
        self,
        response: firestore.ListDocumentsResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.ListDocumentsResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for list_documents

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_list_documents_with_metadata`
        interceptor in new development instead of the `post_list_documents` interceptor.
        When both interceptors are used, this `post_list_documents_with_metadata` interceptor runs after the
        `post_list_documents` interceptor. The (possibly modified) response returned by
        `post_list_documents` will be passed to
        `post_list_documents_with_metadata`.
        """
        return response, metadata

    def pre_partition_query(
        self,
        request: firestore.PartitionQueryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.PartitionQueryRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for partition_query

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_partition_query(
        self, response: firestore.PartitionQueryResponse
    ) -> firestore.PartitionQueryResponse:
        """Post-rpc interceptor for partition_query

        DEPRECATED. Please use the `post_partition_query_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_partition_query` interceptor runs
        before the `post_partition_query_with_metadata` interceptor.
        """
        return response

    def post_partition_query_with_metadata(
        self,
        response: firestore.PartitionQueryResponse,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.PartitionQueryResponse, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for partition_query

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_partition_query_with_metadata`
        interceptor in new development instead of the `post_partition_query` interceptor.
        When both interceptors are used, this `post_partition_query_with_metadata` interceptor runs after the
        `post_partition_query` interceptor. The (possibly modified) response returned by
        `post_partition_query` will be passed to
        `post_partition_query_with_metadata`.
        """
        return response, metadata

    def pre_rollback(
        self,
        request: firestore.RollbackRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.RollbackRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for rollback

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def pre_run_aggregation_query(
        self,
        request: firestore.RunAggregationQueryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.RunAggregationQueryRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for run_aggregation_query

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_run_aggregation_query(
        self, response: rest_streaming.ResponseIterator
    ) -> rest_streaming.ResponseIterator:
        """Post-rpc interceptor for run_aggregation_query

        DEPRECATED. Please use the `post_run_aggregation_query_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_run_aggregation_query` interceptor runs
        before the `post_run_aggregation_query_with_metadata` interceptor.
        """
        return response

    def post_run_aggregation_query_with_metadata(
        self,
        response: rest_streaming.ResponseIterator,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        rest_streaming.ResponseIterator, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for run_aggregation_query

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_run_aggregation_query_with_metadata`
        interceptor in new development instead of the `post_run_aggregation_query` interceptor.
        When both interceptors are used, this `post_run_aggregation_query_with_metadata` interceptor runs after the
        `post_run_aggregation_query` interceptor. The (possibly modified) response returned by
        `post_run_aggregation_query` will be passed to
        `post_run_aggregation_query_with_metadata`.
        """
        return response, metadata

    def pre_run_query(
        self,
        request: firestore.RunQueryRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[firestore.RunQueryRequest, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Pre-rpc interceptor for run_query

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_run_query(
        self, response: rest_streaming.ResponseIterator
    ) -> rest_streaming.ResponseIterator:
        """Post-rpc interceptor for run_query

        DEPRECATED. Please use the `post_run_query_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_run_query` interceptor runs
        before the `post_run_query_with_metadata` interceptor.
        """
        return response

    def post_run_query_with_metadata(
        self,
        response: rest_streaming.ResponseIterator,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        rest_streaming.ResponseIterator, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Post-rpc interceptor for run_query

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_run_query_with_metadata`
        interceptor in new development instead of the `post_run_query` interceptor.
        When both interceptors are used, this `post_run_query_with_metadata` interceptor runs after the
        `post_run_query` interceptor. The (possibly modified) response returned by
        `post_run_query` will be passed to
        `post_run_query_with_metadata`.
        """
        return response, metadata

    def pre_update_document(
        self,
        request: firestore.UpdateDocumentRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        firestore.UpdateDocumentRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for update_document

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_update_document(
        self, response: gf_document.Document
    ) -> gf_document.Document:
        """Post-rpc interceptor for update_document

        DEPRECATED. Please use the `post_update_document_with_metadata`
        interceptor instead.

        Override in a subclass to read or manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code. This `post_update_document` interceptor runs
        before the `post_update_document_with_metadata` interceptor.
        """
        return response

    def post_update_document_with_metadata(
        self,
        response: gf_document.Document,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[gf_document.Document, Sequence[Tuple[str, Union[str, bytes]]]]:
        """Post-rpc interceptor for update_document

        Override in a subclass to read or manipulate the response or metadata after it
        is returned by the Firestore server but before it is returned to user code.

        We recommend only using this `post_update_document_with_metadata`
        interceptor in new development instead of the `post_update_document` interceptor.
        When both interceptors are used, this `post_update_document_with_metadata` interceptor runs after the
        `post_update_document` interceptor. The (possibly modified) response returned by
        `post_update_document` will be passed to
        `post_update_document_with_metadata`.
        """
        return response, metadata

    def pre_cancel_operation(
        self,
        request: operations_pb2.CancelOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.CancelOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for cancel_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_cancel_operation(self, response: None) -> None:
        """Post-rpc interceptor for cancel_operation

        Override in a subclass to manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code.
        """
        return response

    def pre_delete_operation(
        self,
        request: operations_pb2.DeleteOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.DeleteOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for delete_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_delete_operation(self, response: None) -> None:
        """Post-rpc interceptor for delete_operation

        Override in a subclass to manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code.
        """
        return response

    def pre_get_operation(
        self,
        request: operations_pb2.GetOperationRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.GetOperationRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for get_operation

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_get_operation(
        self, response: operations_pb2.Operation
    ) -> operations_pb2.Operation:
        """Post-rpc interceptor for get_operation

        Override in a subclass to manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code.
        """
        return response

    def pre_list_operations(
        self,
        request: operations_pb2.ListOperationsRequest,
        metadata: Sequence[Tuple[str, Union[str, bytes]]],
    ) -> Tuple[
        operations_pb2.ListOperationsRequest, Sequence[Tuple[str, Union[str, bytes]]]
    ]:
        """Pre-rpc interceptor for list_operations

        Override in a subclass to manipulate the request or metadata
        before they are sent to the Firestore server.
        """
        return request, metadata

    def post_list_operations(
        self, response: operations_pb2.ListOperationsResponse
    ) -> operations_pb2.ListOperationsResponse:
        """Post-rpc interceptor for list_operations

        Override in a subclass to manipulate the response
        after it is returned by the Firestore server but before
        it is returned to user code.
        """
        return response


@dataclasses.dataclass
class FirestoreRestStub:
    _session: AuthorizedSession
    _host: str
    _interceptor: FirestoreRestInterceptor


class FirestoreRestTransport(_BaseFirestoreRestTransport):
    """REST backend synchronous transport for Firestore.

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

    It sends JSON representations of protocol buffers over HTTP/1.1
    """

    def __init__(
        self,
        *,
        host: str = "firestore.googleapis.com",
        credentials: Optional[ga_credentials.Credentials] = None,
        credentials_file: Optional[str] = None,
        scopes: Optional[Sequence[str]] = None,
        client_cert_source_for_mtls: Optional[Callable[[], Tuple[bytes, bytes]]] = None,
        quota_project_id: Optional[str] = None,
        client_info: gapic_v1.client_info.ClientInfo = DEFAULT_CLIENT_INFO,
        always_use_jwt_access: Optional[bool] = False,
        url_scheme: str = "https",
        interceptor: Optional[FirestoreRestInterceptor] = None,
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
        self._interceptor = interceptor or FirestoreRestInterceptor()
        self._prep_wrapped_messages(client_info)

    class _BatchGetDocuments(
        _BaseFirestoreRestTransport._BaseBatchGetDocuments, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.BatchGetDocuments")

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
                stream=True,
            )
            return response

        def __call__(
            self,
            request: firestore.BatchGetDocumentsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> rest_streaming.ResponseIterator:
            r"""Call the batch get documents method over HTTP.

            Args:
                request (~.firestore.BatchGetDocumentsRequest):
                    The request object. The request for
                [Firestore.BatchGetDocuments][google.firestore.v1.Firestore.BatchGetDocuments].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.BatchGetDocumentsResponse:
                    The streamed response for
                [Firestore.BatchGetDocuments][google.firestore.v1.Firestore.BatchGetDocuments].

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseBatchGetDocuments._get_http_options()
            )

            request, metadata = self._interceptor.pre_batch_get_documents(
                request, metadata
            )
            transcoded_request = _BaseFirestoreRestTransport._BaseBatchGetDocuments._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreRestTransport._BaseBatchGetDocuments._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreRestTransport._BaseBatchGetDocuments._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.BatchGetDocuments",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "BatchGetDocuments",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._BatchGetDocuments._get_response(
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
            resp = rest_streaming.ResponseIterator(
                response, firestore.BatchGetDocumentsResponse
            )

            resp = self._interceptor.post_batch_get_documents(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_batch_get_documents_with_metadata(
                resp, response_metadata
            )
            return resp

    class _BatchWrite(_BaseFirestoreRestTransport._BaseBatchWrite, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.BatchWrite")

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
            request: firestore.BatchWriteRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore.BatchWriteResponse:
            r"""Call the batch write method over HTTP.

            Args:
                request (~.firestore.BatchWriteRequest):
                    The request object. The request for
                [Firestore.BatchWrite][google.firestore.v1.Firestore.BatchWrite].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.BatchWriteResponse:
                    The response from
                [Firestore.BatchWrite][google.firestore.v1.Firestore.BatchWrite].

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseBatchWrite._get_http_options()
            )

            request, metadata = self._interceptor.pre_batch_write(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseBatchWrite._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseFirestoreRestTransport._BaseBatchWrite._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseBatchWrite._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.BatchWrite",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "BatchWrite",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._BatchWrite._get_response(
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
            resp = firestore.BatchWriteResponse()
            pb_resp = firestore.BatchWriteResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_batch_write(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_batch_write_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore.BatchWriteResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.batch_write",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "BatchWrite",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _BeginTransaction(
        _BaseFirestoreRestTransport._BaseBeginTransaction, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.BeginTransaction")

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
            request: firestore.BeginTransactionRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore.BeginTransactionResponse:
            r"""Call the begin transaction method over HTTP.

            Args:
                request (~.firestore.BeginTransactionRequest):
                    The request object. The request for
                [Firestore.BeginTransaction][google.firestore.v1.Firestore.BeginTransaction].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.BeginTransactionResponse:
                    The response for
                [Firestore.BeginTransaction][google.firestore.v1.Firestore.BeginTransaction].

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseBeginTransaction._get_http_options()
            )

            request, metadata = self._interceptor.pre_begin_transaction(
                request, metadata
            )
            transcoded_request = _BaseFirestoreRestTransport._BaseBeginTransaction._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreRestTransport._BaseBeginTransaction._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreRestTransport._BaseBeginTransaction._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.BeginTransaction",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "BeginTransaction",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._BeginTransaction._get_response(
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
            resp = firestore.BeginTransactionResponse()
            pb_resp = firestore.BeginTransactionResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_begin_transaction(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_begin_transaction_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore.BeginTransactionResponse.to_json(
                        response
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.begin_transaction",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "BeginTransaction",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _Commit(_BaseFirestoreRestTransport._BaseCommit, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.Commit")

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
            request: firestore.CommitRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore.CommitResponse:
            r"""Call the commit method over HTTP.

            Args:
                request (~.firestore.CommitRequest):
                    The request object. The request for
                [Firestore.Commit][google.firestore.v1.Firestore.Commit].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.CommitResponse:
                    The response for
                [Firestore.Commit][google.firestore.v1.Firestore.Commit].

            """

            http_options = _BaseFirestoreRestTransport._BaseCommit._get_http_options()

            request, metadata = self._interceptor.pre_commit(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseCommit._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseFirestoreRestTransport._BaseCommit._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseCommit._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.Commit",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "Commit",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._Commit._get_response(
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
            resp = firestore.CommitResponse()
            pb_resp = firestore.CommitResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_commit(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_commit_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore.CommitResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.commit",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "Commit",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _CreateDocument(
        _BaseFirestoreRestTransport._BaseCreateDocument, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.CreateDocument")

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
            request: firestore.CreateDocumentRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> document.Document:
            r"""Call the create document method over HTTP.

            Args:
                request (~.firestore.CreateDocumentRequest):
                    The request object. The request for
                [Firestore.CreateDocument][google.firestore.v1.Firestore.CreateDocument].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.document.Document:
                    A Firestore document.

                Must not exceed 1 MiB - 4 bytes.

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseCreateDocument._get_http_options()
            )

            request, metadata = self._interceptor.pre_create_document(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseCreateDocument._get_transcoded_request(
                    http_options, request
                )
            )

            body = (
                _BaseFirestoreRestTransport._BaseCreateDocument._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseCreateDocument._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.CreateDocument",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "CreateDocument",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._CreateDocument._get_response(
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
            resp = document.Document()
            pb_resp = document.Document.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_create_document(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_create_document_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = document.Document.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.create_document",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "CreateDocument",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _DeleteDocument(
        _BaseFirestoreRestTransport._BaseDeleteDocument, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.DeleteDocument")

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
            request: firestore.DeleteDocumentRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the delete document method over HTTP.

            Args:
                request (~.firestore.DeleteDocumentRequest):
                    The request object. The request for
                [Firestore.DeleteDocument][google.firestore.v1.Firestore.DeleteDocument].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreRestTransport._BaseDeleteDocument._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_document(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseDeleteDocument._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseDeleteDocument._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.DeleteDocument",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "DeleteDocument",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._DeleteDocument._get_response(
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

    class _GetDocument(_BaseFirestoreRestTransport._BaseGetDocument, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.GetDocument")

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
            request: firestore.GetDocumentRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> document.Document:
            r"""Call the get document method over HTTP.

            Args:
                request (~.firestore.GetDocumentRequest):
                    The request object. The request for
                [Firestore.GetDocument][google.firestore.v1.Firestore.GetDocument].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.document.Document:
                    A Firestore document.

                Must not exceed 1 MiB - 4 bytes.

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseGetDocument._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_document(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseGetDocument._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseGetDocument._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.GetDocument",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "GetDocument",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._GetDocument._get_response(
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
            resp = document.Document()
            pb_resp = document.Document.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_get_document(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_get_document_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = document.Document.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.get_document",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "GetDocument",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListCollectionIds(
        _BaseFirestoreRestTransport._BaseListCollectionIds, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.ListCollectionIds")

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
            request: firestore.ListCollectionIdsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore.ListCollectionIdsResponse:
            r"""Call the list collection ids method over HTTP.

            Args:
                request (~.firestore.ListCollectionIdsRequest):
                    The request object. The request for
                [Firestore.ListCollectionIds][google.firestore.v1.Firestore.ListCollectionIds].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.ListCollectionIdsResponse:
                    The response from
                [Firestore.ListCollectionIds][google.firestore.v1.Firestore.ListCollectionIds].

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseListCollectionIds._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_collection_ids(
                request, metadata
            )
            transcoded_request = _BaseFirestoreRestTransport._BaseListCollectionIds._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreRestTransport._BaseListCollectionIds._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreRestTransport._BaseListCollectionIds._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.ListCollectionIds",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "ListCollectionIds",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._ListCollectionIds._get_response(
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
            resp = firestore.ListCollectionIdsResponse()
            pb_resp = firestore.ListCollectionIdsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_collection_ids(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_collection_ids_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore.ListCollectionIdsResponse.to_json(
                        response
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.list_collection_ids",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "ListCollectionIds",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _ListDocuments(
        _BaseFirestoreRestTransport._BaseListDocuments, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.ListDocuments")

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
            request: firestore.ListDocumentsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore.ListDocumentsResponse:
            r"""Call the list documents method over HTTP.

            Args:
                request (~.firestore.ListDocumentsRequest):
                    The request object. The request for
                [Firestore.ListDocuments][google.firestore.v1.Firestore.ListDocuments].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.ListDocumentsResponse:
                    The response for
                [Firestore.ListDocuments][google.firestore.v1.Firestore.ListDocuments].

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseListDocuments._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_documents(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseListDocuments._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseListDocuments._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.ListDocuments",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "ListDocuments",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._ListDocuments._get_response(
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
            resp = firestore.ListDocumentsResponse()
            pb_resp = firestore.ListDocumentsResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_list_documents(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_list_documents_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore.ListDocumentsResponse.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.list_documents",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "ListDocuments",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _Listen(_BaseFirestoreRestTransport._BaseListen, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.Listen")

        def __call__(
            self,
            request: firestore.ListenRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> rest_streaming.ResponseIterator:
            raise NotImplementedError(
                "Method Listen is not available over REST transport"
            )

    class _PartitionQuery(
        _BaseFirestoreRestTransport._BasePartitionQuery, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.PartitionQuery")

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
            request: firestore.PartitionQueryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> firestore.PartitionQueryResponse:
            r"""Call the partition query method over HTTP.

            Args:
                request (~.firestore.PartitionQueryRequest):
                    The request object. The request for
                [Firestore.PartitionQuery][google.firestore.v1.Firestore.PartitionQuery].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.PartitionQueryResponse:
                    The response for
                [Firestore.PartitionQuery][google.firestore.v1.Firestore.PartitionQuery].

            """

            http_options = (
                _BaseFirestoreRestTransport._BasePartitionQuery._get_http_options()
            )

            request, metadata = self._interceptor.pre_partition_query(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BasePartitionQuery._get_transcoded_request(
                    http_options, request
                )
            )

            body = (
                _BaseFirestoreRestTransport._BasePartitionQuery._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BasePartitionQuery._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.PartitionQuery",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "PartitionQuery",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._PartitionQuery._get_response(
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
            resp = firestore.PartitionQueryResponse()
            pb_resp = firestore.PartitionQueryResponse.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_partition_query(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_partition_query_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = firestore.PartitionQueryResponse.to_json(
                        response
                    )
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.partition_query",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "PartitionQuery",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _Rollback(_BaseFirestoreRestTransport._BaseRollback, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.Rollback")

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
            request: firestore.RollbackRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ):
            r"""Call the rollback method over HTTP.

            Args:
                request (~.firestore.RollbackRequest):
                    The request object. The request for
                [Firestore.Rollback][google.firestore.v1.Firestore.Rollback].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = _BaseFirestoreRestTransport._BaseRollback._get_http_options()

            request, metadata = self._interceptor.pre_rollback(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseRollback._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseFirestoreRestTransport._BaseRollback._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseRollback._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.Rollback",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "Rollback",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._Rollback._get_response(
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

    class _RunAggregationQuery(
        _BaseFirestoreRestTransport._BaseRunAggregationQuery, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.RunAggregationQuery")

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
                stream=True,
            )
            return response

        def __call__(
            self,
            request: firestore.RunAggregationQueryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> rest_streaming.ResponseIterator:
            r"""Call the run aggregation query method over HTTP.

            Args:
                request (~.firestore.RunAggregationQueryRequest):
                    The request object. The request for
                [Firestore.RunAggregationQuery][google.firestore.v1.Firestore.RunAggregationQuery].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.RunAggregationQueryResponse:
                    The response for
                [Firestore.RunAggregationQuery][google.firestore.v1.Firestore.RunAggregationQuery].

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseRunAggregationQuery._get_http_options()
            )

            request, metadata = self._interceptor.pre_run_aggregation_query(
                request, metadata
            )
            transcoded_request = _BaseFirestoreRestTransport._BaseRunAggregationQuery._get_transcoded_request(
                http_options, request
            )

            body = _BaseFirestoreRestTransport._BaseRunAggregationQuery._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = _BaseFirestoreRestTransport._BaseRunAggregationQuery._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.RunAggregationQuery",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "RunAggregationQuery",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._RunAggregationQuery._get_response(
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
            resp = rest_streaming.ResponseIterator(
                response, firestore.RunAggregationQueryResponse
            )

            resp = self._interceptor.post_run_aggregation_query(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_run_aggregation_query_with_metadata(
                resp, response_metadata
            )
            return resp

    class _RunQuery(_BaseFirestoreRestTransport._BaseRunQuery, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.RunQuery")

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
                stream=True,
            )
            return response

        def __call__(
            self,
            request: firestore.RunQueryRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> rest_streaming.ResponseIterator:
            r"""Call the run query method over HTTP.

            Args:
                request (~.firestore.RunQueryRequest):
                    The request object. The request for
                [Firestore.RunQuery][google.firestore.v1.Firestore.RunQuery].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.firestore.RunQueryResponse:
                    The response for
                [Firestore.RunQuery][google.firestore.v1.Firestore.RunQuery].

            """

            http_options = _BaseFirestoreRestTransport._BaseRunQuery._get_http_options()

            request, metadata = self._interceptor.pre_run_query(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseRunQuery._get_transcoded_request(
                    http_options, request
                )
            )

            body = _BaseFirestoreRestTransport._BaseRunQuery._get_request_body_json(
                transcoded_request
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseRunQuery._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.RunQuery",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "RunQuery",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._RunQuery._get_response(
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
            resp = rest_streaming.ResponseIterator(response, firestore.RunQueryResponse)

            resp = self._interceptor.post_run_query(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_run_query_with_metadata(
                resp, response_metadata
            )
            return resp

    class _UpdateDocument(
        _BaseFirestoreRestTransport._BaseUpdateDocument, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.UpdateDocument")

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
            request: firestore.UpdateDocumentRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> gf_document.Document:
            r"""Call the update document method over HTTP.

            Args:
                request (~.firestore.UpdateDocumentRequest):
                    The request object. The request for
                [Firestore.UpdateDocument][google.firestore.v1.Firestore.UpdateDocument].
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                ~.gf_document.Document:
                    A Firestore document.

                Must not exceed 1 MiB - 4 bytes.

            """

            http_options = (
                _BaseFirestoreRestTransport._BaseUpdateDocument._get_http_options()
            )

            request, metadata = self._interceptor.pre_update_document(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseUpdateDocument._get_transcoded_request(
                    http_options, request
                )
            )

            body = (
                _BaseFirestoreRestTransport._BaseUpdateDocument._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseUpdateDocument._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.UpdateDocument",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "UpdateDocument",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._UpdateDocument._get_response(
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
            resp = gf_document.Document()
            pb_resp = gf_document.Document.pb(resp)

            json_format.Parse(response.content, pb_resp, ignore_unknown_fields=True)

            resp = self._interceptor.post_update_document(resp)
            response_metadata = [(k, str(v)) for k, v in response.headers.items()]
            resp, _ = self._interceptor.post_update_document_with_metadata(
                resp, response_metadata
            )
            if CLIENT_LOGGING_SUPPORTED and _LOGGER.isEnabledFor(
                logging.DEBUG
            ):  # pragma: NO COVER
                try:
                    response_payload = gf_document.Document.to_json(response)
                except:
                    response_payload = None
                http_response = {
                    "payload": response_payload,
                    "headers": dict(response.headers),
                    "status": response.status_code,
                }
                _LOGGER.debug(
                    "Received response for google.firestore_v1.FirestoreClient.update_document",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "UpdateDocument",
                        "metadata": http_response["headers"],
                        "httpResponse": http_response,
                    },
                )
            return resp

    class _Write(_BaseFirestoreRestTransport._BaseWrite, FirestoreRestStub):
        def __hash__(self):
            return hash("FirestoreRestTransport.Write")

        def __call__(
            self,
            request: firestore.WriteRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> rest_streaming.ResponseIterator:
            raise NotImplementedError(
                "Method Write is not available over REST transport"
            )

    @property
    def batch_get_documents(
        self,
    ) -> Callable[
        [firestore.BatchGetDocumentsRequest], firestore.BatchGetDocumentsResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._BatchGetDocuments(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def batch_write(
        self,
    ) -> Callable[[firestore.BatchWriteRequest], firestore.BatchWriteResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._BatchWrite(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def begin_transaction(
        self,
    ) -> Callable[
        [firestore.BeginTransactionRequest], firestore.BeginTransactionResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._BeginTransaction(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def commit(self) -> Callable[[firestore.CommitRequest], firestore.CommitResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._Commit(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def create_document(
        self,
    ) -> Callable[[firestore.CreateDocumentRequest], document.Document]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._CreateDocument(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def delete_document(
        self,
    ) -> Callable[[firestore.DeleteDocumentRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._DeleteDocument(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def get_document(
        self,
    ) -> Callable[[firestore.GetDocumentRequest], document.Document]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._GetDocument(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_collection_ids(
        self,
    ) -> Callable[
        [firestore.ListCollectionIdsRequest], firestore.ListCollectionIdsResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListCollectionIds(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def list_documents(
        self,
    ) -> Callable[[firestore.ListDocumentsRequest], firestore.ListDocumentsResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._ListDocuments(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def listen(self) -> Callable[[firestore.ListenRequest], firestore.ListenResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._Listen(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def partition_query(
        self,
    ) -> Callable[[firestore.PartitionQueryRequest], firestore.PartitionQueryResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._PartitionQuery(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def rollback(self) -> Callable[[firestore.RollbackRequest], empty_pb2.Empty]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._Rollback(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def run_aggregation_query(
        self,
    ) -> Callable[
        [firestore.RunAggregationQueryRequest], firestore.RunAggregationQueryResponse
    ]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._RunAggregationQuery(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def run_query(
        self,
    ) -> Callable[[firestore.RunQueryRequest], firestore.RunQueryResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._RunQuery(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def update_document(
        self,
    ) -> Callable[[firestore.UpdateDocumentRequest], gf_document.Document]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._UpdateDocument(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def write(self) -> Callable[[firestore.WriteRequest], firestore.WriteResponse]:
        # The return type is fine, but mypy isn't sophisticated enough to determine what's going on here.
        # In C++ this would require a dynamic_cast
        return self._Write(self._session, self._host, self._interceptor)  # type: ignore

    @property
    def cancel_operation(self):
        return self._CancelOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _CancelOperation(
        _BaseFirestoreRestTransport._BaseCancelOperation, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.CancelOperation")

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
            request: operations_pb2.CancelOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> None:
            r"""Call the cancel operation method over HTTP.

            Args:
                request (operations_pb2.CancelOperationRequest):
                    The request object for CancelOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreRestTransport._BaseCancelOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_cancel_operation(
                request, metadata
            )
            transcoded_request = _BaseFirestoreRestTransport._BaseCancelOperation._get_transcoded_request(
                http_options, request
            )

            body = (
                _BaseFirestoreRestTransport._BaseCancelOperation._get_request_body_json(
                    transcoded_request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseCancelOperation._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.CancelOperation",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "CancelOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._CancelOperation._get_response(
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

            return self._interceptor.post_cancel_operation(None)

    @property
    def delete_operation(self):
        return self._DeleteOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _DeleteOperation(
        _BaseFirestoreRestTransport._BaseDeleteOperation, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.DeleteOperation")

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
            request: operations_pb2.DeleteOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> None:
            r"""Call the delete operation method over HTTP.

            Args:
                request (operations_pb2.DeleteOperationRequest):
                    The request object for DeleteOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.
            """

            http_options = (
                _BaseFirestoreRestTransport._BaseDeleteOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_delete_operation(
                request, metadata
            )
            transcoded_request = _BaseFirestoreRestTransport._BaseDeleteOperation._get_transcoded_request(
                http_options, request
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseDeleteOperation._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.DeleteOperation",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "DeleteOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._DeleteOperation._get_response(
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

            return self._interceptor.post_delete_operation(None)

    @property
    def get_operation(self):
        return self._GetOperation(self._session, self._host, self._interceptor)  # type: ignore

    class _GetOperation(
        _BaseFirestoreRestTransport._BaseGetOperation, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.GetOperation")

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
            request: operations_pb2.GetOperationRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.Operation:
            r"""Call the get operation method over HTTP.

            Args:
                request (operations_pb2.GetOperationRequest):
                    The request object for GetOperation method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                operations_pb2.Operation: Response from GetOperation method.
            """

            http_options = (
                _BaseFirestoreRestTransport._BaseGetOperation._get_http_options()
            )

            request, metadata = self._interceptor.pre_get_operation(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseGetOperation._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseGetOperation._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.GetOperation",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "GetOperation",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._GetOperation._get_response(
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
            resp = operations_pb2.Operation()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_get_operation(resp)
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
                    "Received response for google.firestore_v1.FirestoreAsyncClient.GetOperation",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "GetOperation",
                        "httpResponse": http_response,
                        "metadata": http_response["headers"],
                    },
                )
            return resp

    @property
    def list_operations(self):
        return self._ListOperations(self._session, self._host, self._interceptor)  # type: ignore

    class _ListOperations(
        _BaseFirestoreRestTransport._BaseListOperations, FirestoreRestStub
    ):
        def __hash__(self):
            return hash("FirestoreRestTransport.ListOperations")

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
            request: operations_pb2.ListOperationsRequest,
            *,
            retry: OptionalRetry = gapic_v1.method.DEFAULT,
            timeout: Optional[float] = None,
            metadata: Sequence[Tuple[str, Union[str, bytes]]] = (),
        ) -> operations_pb2.ListOperationsResponse:
            r"""Call the list operations method over HTTP.

            Args:
                request (operations_pb2.ListOperationsRequest):
                    The request object for ListOperations method.
                retry (google.api_core.retry.Retry): Designation of what errors, if any,
                    should be retried.
                timeout (float): The timeout for this request.
                metadata (Sequence[Tuple[str, Union[str, bytes]]]): Key/value pairs which should be
                    sent along with the request as metadata. Normally, each value must be of type `str`,
                    but for metadata keys ending with the suffix `-bin`, the corresponding values must
                    be of type `bytes`.

            Returns:
                operations_pb2.ListOperationsResponse: Response from ListOperations method.
            """

            http_options = (
                _BaseFirestoreRestTransport._BaseListOperations._get_http_options()
            )

            request, metadata = self._interceptor.pre_list_operations(request, metadata)
            transcoded_request = (
                _BaseFirestoreRestTransport._BaseListOperations._get_transcoded_request(
                    http_options, request
                )
            )

            # Jsonify the query params
            query_params = (
                _BaseFirestoreRestTransport._BaseListOperations._get_query_params_json(
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
                    f"Sending request for google.firestore_v1.FirestoreClient.ListOperations",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "ListOperations",
                        "httpRequest": http_request,
                        "metadata": http_request["headers"],
                    },
                )

            # Send the request
            response = FirestoreRestTransport._ListOperations._get_response(
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
            resp = operations_pb2.ListOperationsResponse()
            resp = json_format.Parse(content, resp)
            resp = self._interceptor.post_list_operations(resp)
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
                    "Received response for google.firestore_v1.FirestoreAsyncClient.ListOperations",
                    extra={
                        "serviceName": "google.firestore.v1.Firestore",
                        "rpcName": "ListOperations",
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


__all__ = ("FirestoreRestTransport",)
