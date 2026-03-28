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
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore

from google.cloud.firestore_v1.types import aggregation_result
from google.cloud.firestore_v1.types import common
from google.cloud.firestore_v1.types import document as gf_document
from google.cloud.firestore_v1.types import query as gf_query
from google.cloud.firestore_v1.types import query_profile
from google.cloud.firestore_v1.types import write
from google.protobuf import timestamp_pb2  # type: ignore
from google.protobuf import wrappers_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.v1",
    manifest={
        "GetDocumentRequest",
        "ListDocumentsRequest",
        "ListDocumentsResponse",
        "CreateDocumentRequest",
        "UpdateDocumentRequest",
        "DeleteDocumentRequest",
        "BatchGetDocumentsRequest",
        "BatchGetDocumentsResponse",
        "BeginTransactionRequest",
        "BeginTransactionResponse",
        "CommitRequest",
        "CommitResponse",
        "RollbackRequest",
        "RunQueryRequest",
        "RunQueryResponse",
        "RunAggregationQueryRequest",
        "RunAggregationQueryResponse",
        "PartitionQueryRequest",
        "PartitionQueryResponse",
        "WriteRequest",
        "WriteResponse",
        "ListenRequest",
        "ListenResponse",
        "Target",
        "TargetChange",
        "ListCollectionIdsRequest",
        "ListCollectionIdsResponse",
        "BatchWriteRequest",
        "BatchWriteResponse",
    },
)


class GetDocumentRequest(proto.Message):
    r"""The request for
    [Firestore.GetDocument][google.firestore.v1.Firestore.GetDocument].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Required. The resource name of the Document to get. In the
            format:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
        mask (google.cloud.firestore_v1.types.DocumentMask):
            The fields to return. If not set, returns all
            fields.
            If the document has a field that is not present
            in this mask, that field will not be returned in
            the response.
        transaction (bytes):
            Reads the document in a transaction.

            This field is a member of `oneof`_ ``consistency_selector``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Reads the version of the document at the
            given time.
            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=2,
        message=common.DocumentMask,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=3,
        oneof="consistency_selector",
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )


class ListDocumentsRequest(proto.Message):
    r"""The request for
    [Firestore.ListDocuments][google.firestore.v1.Firestore.ListDocuments].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. The parent resource name. In the format:
            ``projects/{project_id}/databases/{database_id}/documents``
            or
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.

            For example:
            ``projects/my-project/databases/my-database/documents`` or
            ``projects/my-project/databases/my-database/documents/chatrooms/my-chatroom``
        collection_id (str):
            Optional. The collection ID, relative to ``parent``, to
            list.

            For example: ``chatrooms`` or ``messages``.

            This is optional, and when not provided, Firestore will list
            documents from all collections under the provided
            ``parent``.
        page_size (int):
            Optional. The maximum number of documents to
            return in a single response.
            Firestore may return fewer than this value.
        page_token (str):
            Optional. A page token, received from a previous
            ``ListDocuments`` response.

            Provide this to retrieve the subsequent page. When
            paginating, all other parameters (with the exception of
            ``page_size``) must match the values set in the request that
            generated the page token.
        order_by (str):
            Optional. The optional ordering of the documents to return.

            For example: ``priority desc, __name__ desc``.

            This mirrors the
            [``ORDER BY``][google.firestore.v1.StructuredQuery.order_by]
            used in Firestore queries but in a string representation.
            When absent, documents are ordered based on
            ``__name__ ASC``.
        mask (google.cloud.firestore_v1.types.DocumentMask):
            Optional. The fields to return. If not set,
            returns all fields.
            If a document has a field that is not present in
            this mask, that field will not be returned in
            the response.
        transaction (bytes):
            Perform the read as part of an already active
            transaction.

            This field is a member of `oneof`_ ``consistency_selector``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Perform the read at the provided time.

            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
        show_missing (bool):
            If the list should show missing documents.

            A document is missing if it does not exist, but there are
            sub-documents nested underneath it. When true, such missing
            documents will be returned with a key but will not have
            fields,
            [``create_time``][google.firestore.v1.Document.create_time],
            or
            [``update_time``][google.firestore.v1.Document.update_time]
            set.

            Requests with ``show_missing`` may not specify ``where`` or
            ``order_by``.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    collection_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )
    order_by: str = proto.Field(
        proto.STRING,
        number=6,
    )
    mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=7,
        message=common.DocumentMask,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=8,
        oneof="consistency_selector",
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )
    show_missing: bool = proto.Field(
        proto.BOOL,
        number=12,
    )


class ListDocumentsResponse(proto.Message):
    r"""The response for
    [Firestore.ListDocuments][google.firestore.v1.Firestore.ListDocuments].

    Attributes:
        documents (MutableSequence[google.cloud.firestore_v1.types.Document]):
            The Documents found.
        next_page_token (str):
            A token to retrieve the next page of
            documents.
            If this field is omitted, there are no
            subsequent pages.
    """

    @property
    def raw_page(self):
        return self

    documents: MutableSequence[gf_document.Document] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gf_document.Document,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class CreateDocumentRequest(proto.Message):
    r"""The request for
    [Firestore.CreateDocument][google.firestore.v1.Firestore.CreateDocument].

    Attributes:
        parent (str):
            Required. The parent resource. For example:
            ``projects/{project_id}/databases/{database_id}/documents``
            or
            ``projects/{project_id}/databases/{database_id}/documents/chatrooms/{chatroom_id}``
        collection_id (str):
            Required. The collection ID, relative to ``parent``, to
            list. For example: ``chatrooms``.
        document_id (str):
            The client-assigned document ID to use for
            this document.
            Optional. If not specified, an ID will be
            assigned by the service.
        document (google.cloud.firestore_v1.types.Document):
            Required. The document to create. ``name`` must not be set.
        mask (google.cloud.firestore_v1.types.DocumentMask):
            The fields to return. If not set, returns all
            fields.
            If the document has a field that is not present
            in this mask, that field will not be returned in
            the response.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    collection_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    document_id: str = proto.Field(
        proto.STRING,
        number=3,
    )
    document: gf_document.Document = proto.Field(
        proto.MESSAGE,
        number=4,
        message=gf_document.Document,
    )
    mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=5,
        message=common.DocumentMask,
    )


class UpdateDocumentRequest(proto.Message):
    r"""The request for
    [Firestore.UpdateDocument][google.firestore.v1.Firestore.UpdateDocument].

    Attributes:
        document (google.cloud.firestore_v1.types.Document):
            Required. The updated document.
            Creates the document if it does not already
            exist.
        update_mask (google.cloud.firestore_v1.types.DocumentMask):
            The fields to update.
            None of the field paths in the mask may contain
            a reserved name.

            If the document exists on the server and has
            fields not referenced in the mask, they are left
            unchanged.
            Fields referenced in the mask, but not present
            in the input document, are deleted from the
            document on the server.
        mask (google.cloud.firestore_v1.types.DocumentMask):
            The fields to return. If not set, returns all
            fields.
            If the document has a field that is not present
            in this mask, that field will not be returned in
            the response.
        current_document (google.cloud.firestore_v1.types.Precondition):
            An optional precondition on the document.
            The request will fail if this is set and not met
            by the target document.
    """

    document: gf_document.Document = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gf_document.Document,
    )
    update_mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=2,
        message=common.DocumentMask,
    )
    mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=common.DocumentMask,
    )
    current_document: common.Precondition = proto.Field(
        proto.MESSAGE,
        number=4,
        message=common.Precondition,
    )


class DeleteDocumentRequest(proto.Message):
    r"""The request for
    [Firestore.DeleteDocument][google.firestore.v1.Firestore.DeleteDocument].

    Attributes:
        name (str):
            Required. The resource name of the Document to delete. In
            the format:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
        current_document (google.cloud.firestore_v1.types.Precondition):
            An optional precondition on the document.
            The request will fail if this is set and not met
            by the target document.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    current_document: common.Precondition = proto.Field(
        proto.MESSAGE,
        number=2,
        message=common.Precondition,
    )


class BatchGetDocumentsRequest(proto.Message):
    r"""The request for
    [Firestore.BatchGetDocuments][google.firestore.v1.Firestore.BatchGetDocuments].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``.
        documents (MutableSequence[str]):
            The names of the documents to retrieve. In the format:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
            The request will fail if any of the document is not a child
            resource of the given ``database``. Duplicate names will be
            elided.
        mask (google.cloud.firestore_v1.types.DocumentMask):
            The fields to return. If not set, returns all
            fields.
            If a document has a field that is not present in
            this mask, that field will not be returned in
            the response.
        transaction (bytes):
            Reads documents in a transaction.

            This field is a member of `oneof`_ ``consistency_selector``.
        new_transaction (google.cloud.firestore_v1.types.TransactionOptions):
            Starts a new transaction and reads the
            documents. Defaults to a read-only transaction.
            The new transaction ID will be returned as the
            first response in the stream.

            This field is a member of `oneof`_ ``consistency_selector``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Reads documents as they were at the given
            time.
            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    documents: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=common.DocumentMask,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=4,
        oneof="consistency_selector",
    )
    new_transaction: common.TransactionOptions = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="consistency_selector",
        message=common.TransactionOptions,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )


class BatchGetDocumentsResponse(proto.Message):
    r"""The streamed response for
    [Firestore.BatchGetDocuments][google.firestore.v1.Firestore.BatchGetDocuments].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        found (google.cloud.firestore_v1.types.Document):
            A document that was requested.

            This field is a member of `oneof`_ ``result``.
        missing (str):
            A document name that was requested but does not exist. In
            the format:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.

            This field is a member of `oneof`_ ``result``.
        transaction (bytes):
            The transaction that was started as part of this request.
            Will only be set in the first response, and only if
            [BatchGetDocumentsRequest.new_transaction][google.firestore.v1.BatchGetDocumentsRequest.new_transaction]
            was set in the request.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the document was read. This may be
            monotically increasing, in this case the previous documents
            in the result stream are guaranteed not to have changed
            between their read_time and this one.
    """

    found: gf_document.Document = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="result",
        message=gf_document.Document,
    )
    missing: str = proto.Field(
        proto.STRING,
        number=2,
        oneof="result",
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=3,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )


class BeginTransactionRequest(proto.Message):
    r"""The request for
    [Firestore.BeginTransaction][google.firestore.v1.Firestore.BeginTransaction].

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``.
        options (google.cloud.firestore_v1.types.TransactionOptions):
            The options for the transaction.
            Defaults to a read-write transaction.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    options: common.TransactionOptions = proto.Field(
        proto.MESSAGE,
        number=2,
        message=common.TransactionOptions,
    )


class BeginTransactionResponse(proto.Message):
    r"""The response for
    [Firestore.BeginTransaction][google.firestore.v1.Firestore.BeginTransaction].

    Attributes:
        transaction (bytes):
            The transaction that was started.
    """

    transaction: bytes = proto.Field(
        proto.BYTES,
        number=1,
    )


class CommitRequest(proto.Message):
    r"""The request for
    [Firestore.Commit][google.firestore.v1.Firestore.Commit].

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``.
        writes (MutableSequence[google.cloud.firestore_v1.types.Write]):
            The writes to apply.

            Always executed atomically and in order.
        transaction (bytes):
            If set, applies all writes in this
            transaction, and commits it.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    writes: MutableSequence[write.Write] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=write.Write,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=3,
    )


class CommitResponse(proto.Message):
    r"""The response for
    [Firestore.Commit][google.firestore.v1.Firestore.Commit].

    Attributes:
        write_results (MutableSequence[google.cloud.firestore_v1.types.WriteResult]):
            The result of applying the writes.

            This i-th write result corresponds to the i-th
            write in the request.
        commit_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the commit occurred. Any read with an
            equal or greater ``read_time`` is guaranteed to see the
            effects of the commit.
    """

    write_results: MutableSequence[write.WriteResult] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=write.WriteResult,
    )
    commit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )


class RollbackRequest(proto.Message):
    r"""The request for
    [Firestore.Rollback][google.firestore.v1.Firestore.Rollback].

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``.
        transaction (bytes):
            Required. The transaction to roll back.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=2,
    )


class RunQueryRequest(proto.Message):
    r"""The request for
    [Firestore.RunQuery][google.firestore.v1.Firestore.RunQuery].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. The parent resource name. In the format:
            ``projects/{project_id}/databases/{database_id}/documents``
            or
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
            For example:
            ``projects/my-project/databases/my-database/documents`` or
            ``projects/my-project/databases/my-database/documents/chatrooms/my-chatroom``
        structured_query (google.cloud.firestore_v1.types.StructuredQuery):
            A structured query.

            This field is a member of `oneof`_ ``query_type``.
        transaction (bytes):
            Run the query within an already active
            transaction.
            The value here is the opaque transaction ID to
            execute the query in.

            This field is a member of `oneof`_ ``consistency_selector``.
        new_transaction (google.cloud.firestore_v1.types.TransactionOptions):
            Starts a new transaction and reads the
            documents. Defaults to a read-only transaction.
            The new transaction ID will be returned as the
            first response in the stream.

            This field is a member of `oneof`_ ``consistency_selector``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Reads documents as they were at the given
            time.
            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
        explain_options (google.cloud.firestore_v1.types.ExplainOptions):
            Optional. Explain options for the query. If
            set, additional query statistics will be
            returned. If not, only query results will be
            returned.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    structured_query: gf_query.StructuredQuery = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="query_type",
        message=gf_query.StructuredQuery,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=5,
        oneof="consistency_selector",
    )
    new_transaction: common.TransactionOptions = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="consistency_selector",
        message=common.TransactionOptions,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )
    explain_options: query_profile.ExplainOptions = proto.Field(
        proto.MESSAGE,
        number=10,
        message=query_profile.ExplainOptions,
    )


class RunQueryResponse(proto.Message):
    r"""The response for
    [Firestore.RunQuery][google.firestore.v1.Firestore.RunQuery].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        transaction (bytes):
            The transaction that was started as part of this request.
            Can only be set in the first response, and only if
            [RunQueryRequest.new_transaction][google.firestore.v1.RunQueryRequest.new_transaction]
            was set in the request. If set, no other fields will be set
            in this response.
        document (google.cloud.firestore_v1.types.Document):
            A query result, not set when reporting
            partial progress.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the document was read. This may be
            monotonically increasing; in this case, the previous
            documents in the result stream are guaranteed not to have
            changed between their ``read_time`` and this one.

            If the query returns no results, a response with
            ``read_time`` and no ``document`` will be sent, and this
            represents the time at which the query was run.
        skipped_results (int):
            The number of results that have been skipped
            due to an offset between the last response and
            the current response.
        done (bool):
            If present, Firestore has completely finished
            the request and no more documents will be
            returned.

            This field is a member of `oneof`_ ``continuation_selector``.
        explain_metrics (google.cloud.firestore_v1.types.ExplainMetrics):
            Query explain metrics. This is only present when the
            [RunQueryRequest.explain_options][google.firestore.v1.RunQueryRequest.explain_options]
            is provided, and it is sent only once with the last response
            in the stream.
    """

    transaction: bytes = proto.Field(
        proto.BYTES,
        number=2,
    )
    document: gf_document.Document = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gf_document.Document,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    skipped_results: int = proto.Field(
        proto.INT32,
        number=4,
    )
    done: bool = proto.Field(
        proto.BOOL,
        number=6,
        oneof="continuation_selector",
    )
    explain_metrics: query_profile.ExplainMetrics = proto.Field(
        proto.MESSAGE,
        number=11,
        message=query_profile.ExplainMetrics,
    )


class RunAggregationQueryRequest(proto.Message):
    r"""The request for
    [Firestore.RunAggregationQuery][google.firestore.v1.Firestore.RunAggregationQuery].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. The parent resource name. In the format:
            ``projects/{project_id}/databases/{database_id}/documents``
            or
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
            For example:
            ``projects/my-project/databases/my-database/documents`` or
            ``projects/my-project/databases/my-database/documents/chatrooms/my-chatroom``
        structured_aggregation_query (google.cloud.firestore_v1.types.StructuredAggregationQuery):
            An aggregation query.

            This field is a member of `oneof`_ ``query_type``.
        transaction (bytes):
            Run the aggregation within an already active
            transaction.
            The value here is the opaque transaction ID to
            execute the query in.

            This field is a member of `oneof`_ ``consistency_selector``.
        new_transaction (google.cloud.firestore_v1.types.TransactionOptions):
            Starts a new transaction as part of the
            query, defaulting to read-only.
            The new transaction ID will be returned as the
            first response in the stream.

            This field is a member of `oneof`_ ``consistency_selector``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Executes the query at the given timestamp.

            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
        explain_options (google.cloud.firestore_v1.types.ExplainOptions):
            Optional. Explain options for the query. If
            set, additional query statistics will be
            returned. If not, only query results will be
            returned.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    structured_aggregation_query: gf_query.StructuredAggregationQuery = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="query_type",
        message=gf_query.StructuredAggregationQuery,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=4,
        oneof="consistency_selector",
    )
    new_transaction: common.TransactionOptions = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="consistency_selector",
        message=common.TransactionOptions,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )
    explain_options: query_profile.ExplainOptions = proto.Field(
        proto.MESSAGE,
        number=8,
        message=query_profile.ExplainOptions,
    )


class RunAggregationQueryResponse(proto.Message):
    r"""The response for
    [Firestore.RunAggregationQuery][google.firestore.v1.Firestore.RunAggregationQuery].

    Attributes:
        result (google.cloud.firestore_v1.types.AggregationResult):
            A single aggregation result.

            Not present when reporting partial progress.
        transaction (bytes):
            The transaction that was started as part of
            this request.
            Only present on the first response when the
            request requested to start a new transaction.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the aggregate result was computed. This is
            always monotonically increasing; in this case, the previous
            AggregationResult in the result stream are guaranteed not to
            have changed between their ``read_time`` and this one.

            If the query returns no results, a response with
            ``read_time`` and no ``result`` will be sent, and this
            represents the time at which the query was run.
        explain_metrics (google.cloud.firestore_v1.types.ExplainMetrics):
            Query explain metrics. This is only present when the
            [RunAggregationQueryRequest.explain_options][google.firestore.v1.RunAggregationQueryRequest.explain_options]
            is provided, and it is sent only once with the last response
            in the stream.
    """

    result: aggregation_result.AggregationResult = proto.Field(
        proto.MESSAGE,
        number=1,
        message=aggregation_result.AggregationResult,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=2,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    explain_metrics: query_profile.ExplainMetrics = proto.Field(
        proto.MESSAGE,
        number=10,
        message=query_profile.ExplainMetrics,
    )


class PartitionQueryRequest(proto.Message):
    r"""The request for
    [Firestore.PartitionQuery][google.firestore.v1.Firestore.PartitionQuery].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. The parent resource name. In the format:
            ``projects/{project_id}/databases/{database_id}/documents``.
            Document resource names are not supported; only database
            resource names can be specified.
        structured_query (google.cloud.firestore_v1.types.StructuredQuery):
            A structured query.
            Query must specify collection with all
            descendants and be ordered by name ascending.
            Other filters, order bys, limits, offsets, and
            start/end cursors are not supported.

            This field is a member of `oneof`_ ``query_type``.
        partition_count (int):
            The desired maximum number of partition
            points. The partitions may be returned across
            multiple pages of results. The number must be
            positive. The actual number of partitions
            returned may be fewer.

            For example, this may be set to one fewer than
            the number of parallel queries to be run, or in
            running a data pipeline job, one fewer than the
            number of workers or compute instances
            available.
        page_token (str):
            The ``next_page_token`` value returned from a previous call
            to PartitionQuery that may be used to get an additional set
            of results. There are no ordering guarantees between sets of
            results. Thus, using multiple sets of results will require
            merging the different result sets.

            For example, two subsequent calls using a page_token may
            return:

            -  cursor B, cursor M, cursor Q
            -  cursor A, cursor U, cursor W

            To obtain a complete result set ordered with respect to the
            results of the query supplied to PartitionQuery, the results
            sets should be merged: cursor A, cursor B, cursor M, cursor
            Q, cursor U, cursor W
        page_size (int):
            The maximum number of partitions to return in this call,
            subject to ``partition_count``.

            For example, if ``partition_count`` = 10 and ``page_size`` =
            8, the first call to PartitionQuery will return up to 8
            partitions and a ``next_page_token`` if more results exist.
            A second call to PartitionQuery will return up to 2
            partitions, to complete the total of 10 specified in
            ``partition_count``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Reads documents as they were at the given
            time.
            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    structured_query: gf_query.StructuredQuery = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="query_type",
        message=gf_query.StructuredQuery,
    )
    partition_count: int = proto.Field(
        proto.INT64,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=5,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )


class PartitionQueryResponse(proto.Message):
    r"""The response for
    [Firestore.PartitionQuery][google.firestore.v1.Firestore.PartitionQuery].

    Attributes:
        partitions (MutableSequence[google.cloud.firestore_v1.types.Cursor]):
            Partition results. Each partition is a split point that can
            be used by RunQuery as a starting or end point for the query
            results. The RunQuery requests must be made with the same
            query supplied to this PartitionQuery request. The partition
            cursors will be ordered according to same ordering as the
            results of the query supplied to PartitionQuery.

            For example, if a PartitionQuery request returns partition
            cursors A and B, running the following three queries will
            return the entire result set of the original query:

            -  query, end_at A
            -  query, start_at A, end_at B
            -  query, start_at B

            An empty result may indicate that the query has too few
            results to be partitioned, or that the query is not yet
            supported for partitioning.
        next_page_token (str):
            A page token that may be used to request an additional set
            of results, up to the number specified by
            ``partition_count`` in the PartitionQuery request. If blank,
            there are no more results.
    """

    @property
    def raw_page(self):
        return self

    partitions: MutableSequence[gf_query.Cursor] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gf_query.Cursor,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class WriteRequest(proto.Message):
    r"""The request for
    [Firestore.Write][google.firestore.v1.Firestore.Write].

    The first request creates a stream, or resumes an existing one from
    a token.

    When creating a new stream, the server replies with a response
    containing only an ID and a token, to use in the next request.

    When resuming a stream, the server first streams any responses later
    than the given token, then a response containing only an up-to-date
    token, to use in the next request.

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``. This is
            only required in the first message.
        stream_id (str):
            The ID of the write stream to resume.
            This may only be set in the first message. When
            left empty, a new write stream will be created.
        writes (MutableSequence[google.cloud.firestore_v1.types.Write]):
            The writes to apply.

            Always executed atomically and in order.
            This must be empty on the first request.
            This may be empty on the last request.
            This must not be empty on all other requests.
        stream_token (bytes):
            A stream token that was previously sent by the server.

            The client should set this field to the token from the most
            recent [WriteResponse][google.firestore.v1.WriteResponse] it
            has received. This acknowledges that the client has received
            responses up to this token. After sending this token,
            earlier tokens may not be used anymore.

            The server may close the stream if there are too many
            unacknowledged responses.

            Leave this field unset when creating a new stream. To resume
            a stream at a specific point, set this field and the
            ``stream_id`` field.

            Leave this field unset when creating a new stream.
        labels (MutableMapping[str, str]):
            Labels associated with this write request.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    stream_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    writes: MutableSequence[write.Write] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=write.Write,
    )
    stream_token: bytes = proto.Field(
        proto.BYTES,
        number=4,
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=5,
    )


class WriteResponse(proto.Message):
    r"""The response for
    [Firestore.Write][google.firestore.v1.Firestore.Write].

    Attributes:
        stream_id (str):
            The ID of the stream.
            Only set on the first message, when a new stream
            was created.
        stream_token (bytes):
            A token that represents the position of this
            response in the stream. This can be used by a
            client to resume the stream at this point.

            This field is always set.
        write_results (MutableSequence[google.cloud.firestore_v1.types.WriteResult]):
            The result of applying the writes.

            This i-th write result corresponds to the i-th
            write in the request.
        commit_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the commit occurred. Any read with an
            equal or greater ``read_time`` is guaranteed to see the
            effects of the write.
    """

    stream_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    stream_token: bytes = proto.Field(
        proto.BYTES,
        number=2,
    )
    write_results: MutableSequence[write.WriteResult] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=write.WriteResult,
    )
    commit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )


class ListenRequest(proto.Message):
    r"""A request for
    [Firestore.Listen][google.firestore.v1.Firestore.Listen]

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``.
        add_target (google.cloud.firestore_v1.types.Target):
            A target to add to this stream.

            This field is a member of `oneof`_ ``target_change``.
        remove_target (int):
            The ID of a target to remove from this
            stream.

            This field is a member of `oneof`_ ``target_change``.
        labels (MutableMapping[str, str]):
            Labels associated with this target change.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    add_target: "Target" = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="target_change",
        message="Target",
    )
    remove_target: int = proto.Field(
        proto.INT32,
        number=3,
        oneof="target_change",
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=4,
    )


class ListenResponse(proto.Message):
    r"""The response for
    [Firestore.Listen][google.firestore.v1.Firestore.Listen].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        target_change (google.cloud.firestore_v1.types.TargetChange):
            Targets have changed.

            This field is a member of `oneof`_ ``response_type``.
        document_change (google.cloud.firestore_v1.types.DocumentChange):
            A [Document][google.firestore.v1.Document] has changed.

            This field is a member of `oneof`_ ``response_type``.
        document_delete (google.cloud.firestore_v1.types.DocumentDelete):
            A [Document][google.firestore.v1.Document] has been deleted.

            This field is a member of `oneof`_ ``response_type``.
        document_remove (google.cloud.firestore_v1.types.DocumentRemove):
            A [Document][google.firestore.v1.Document] has been removed
            from a target (because it is no longer relevant to that
            target).

            This field is a member of `oneof`_ ``response_type``.
        filter (google.cloud.firestore_v1.types.ExistenceFilter):
            A filter to apply to the set of documents
            previously returned for the given target.

            Returned when documents may have been removed
            from the given target, but the exact documents
            are unknown.

            This field is a member of `oneof`_ ``response_type``.
    """

    target_change: "TargetChange" = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="response_type",
        message="TargetChange",
    )
    document_change: write.DocumentChange = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="response_type",
        message=write.DocumentChange,
    )
    document_delete: write.DocumentDelete = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="response_type",
        message=write.DocumentDelete,
    )
    document_remove: write.DocumentRemove = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="response_type",
        message=write.DocumentRemove,
    )
    filter: write.ExistenceFilter = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="response_type",
        message=write.ExistenceFilter,
    )


class Target(proto.Message):
    r"""A specification of a set of documents to listen to.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        query (google.cloud.firestore_v1.types.Target.QueryTarget):
            A target specified by a query.

            This field is a member of `oneof`_ ``target_type``.
        documents (google.cloud.firestore_v1.types.Target.DocumentsTarget):
            A target specified by a set of document
            names.

            This field is a member of `oneof`_ ``target_type``.
        resume_token (bytes):
            A resume token from a prior
            [TargetChange][google.firestore.v1.TargetChange] for an
            identical target.

            Using a resume token with a different target is unsupported
            and may fail.

            This field is a member of `oneof`_ ``resume_type``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Start listening after a specific ``read_time``.

            The client must know the state of matching documents at this
            time.

            This field is a member of `oneof`_ ``resume_type``.
        target_id (int):
            The target ID that identifies the target on the stream. Must
            be a positive number and non-zero.

            If ``target_id`` is 0 (or unspecified), the server will
            assign an ID for this target and return that in a
            ``TargetChange::ADD`` event. Once a target with
            ``target_id=0`` is added, all subsequent targets must also
            have ``target_id=0``. If an ``AddTarget`` request with
            ``target_id != 0`` is sent to the server after a target with
            ``target_id=0`` is added, the server will immediately send a
            response with a ``TargetChange::Remove`` event.

            Note that if the client sends multiple ``AddTarget``
            requests without an ID, the order of IDs returned in
            ``TargetChage.target_ids`` are undefined. Therefore, clients
            should provide a target ID instead of relying on the server
            to assign one.

            If ``target_id`` is non-zero, there must not be an existing
            active target on this stream with the same ID.
        once (bool):
            If the target should be removed once it is
            current and consistent.
        expected_count (google.protobuf.wrappers_pb2.Int32Value):
            The number of documents that last matched the query at the
            resume token or read time.

            This value is only relevant when a ``resume_type`` is
            provided. This value being present and greater than zero
            signals that the client wants
            ``ExistenceFilter.unchanged_names`` to be included in the
            response.
    """

    class DocumentsTarget(proto.Message):
        r"""A target specified by a set of documents names.

        Attributes:
            documents (MutableSequence[str]):
                The names of the documents to retrieve. In the format:
                ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
                The request will fail if any of the document is not a child
                resource of the given ``database``. Duplicate names will be
                elided.
        """

        documents: MutableSequence[str] = proto.RepeatedField(
            proto.STRING,
            number=2,
        )

    class QueryTarget(proto.Message):
        r"""A target specified by a query.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            parent (str):
                The parent resource name. In the format:
                ``projects/{project_id}/databases/{database_id}/documents``
                or
                ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
                For example:
                ``projects/my-project/databases/my-database/documents`` or
                ``projects/my-project/databases/my-database/documents/chatrooms/my-chatroom``
            structured_query (google.cloud.firestore_v1.types.StructuredQuery):
                A structured query.

                This field is a member of `oneof`_ ``query_type``.
        """

        parent: str = proto.Field(
            proto.STRING,
            number=1,
        )
        structured_query: gf_query.StructuredQuery = proto.Field(
            proto.MESSAGE,
            number=2,
            oneof="query_type",
            message=gf_query.StructuredQuery,
        )

    query: QueryTarget = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="target_type",
        message=QueryTarget,
    )
    documents: DocumentsTarget = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="target_type",
        message=DocumentsTarget,
    )
    resume_token: bytes = proto.Field(
        proto.BYTES,
        number=4,
        oneof="resume_type",
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=11,
        oneof="resume_type",
        message=timestamp_pb2.Timestamp,
    )
    target_id: int = proto.Field(
        proto.INT32,
        number=5,
    )
    once: bool = proto.Field(
        proto.BOOL,
        number=6,
    )
    expected_count: wrappers_pb2.Int32Value = proto.Field(
        proto.MESSAGE,
        number=12,
        message=wrappers_pb2.Int32Value,
    )


class TargetChange(proto.Message):
    r"""Targets being watched have changed.

    Attributes:
        target_change_type (google.cloud.firestore_v1.types.TargetChange.TargetChangeType):
            The type of change that occurred.
        target_ids (MutableSequence[int]):
            The target IDs of targets that have changed.

            If empty, the change applies to all targets.

            The order of the target IDs is not defined.
        cause (google.rpc.status_pb2.Status):
            The error that resulted in this change, if
            applicable.
        resume_token (bytes):
            A token that can be used to resume the stream for the given
            ``target_ids``, or all targets if ``target_ids`` is empty.

            Not set on every target change.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The consistent ``read_time`` for the given ``target_ids``
            (omitted when the target_ids are not at a consistent
            snapshot).

            The stream is guaranteed to send a ``read_time`` with
            ``target_ids`` empty whenever the entire stream reaches a
            new consistent snapshot. ADD, CURRENT, and RESET messages
            are guaranteed to (eventually) result in a new consistent
            snapshot (while NO_CHANGE and REMOVE messages are not).

            For a given stream, ``read_time`` is guaranteed to be
            monotonically increasing.
    """

    class TargetChangeType(proto.Enum):
        r"""The type of change.

        Values:
            NO_CHANGE (0):
                No change has occurred. Used only to send an updated
                ``resume_token``.
            ADD (1):
                The targets have been added.
            REMOVE (2):
                The targets have been removed.
            CURRENT (3):
                The targets reflect all changes committed before the targets
                were added to the stream.

                This will be sent after or with a ``read_time`` that is
                greater than or equal to the time at which the targets were
                added.

                Listeners can wait for this change if read-after-write
                semantics are desired.
            RESET (4):
                The targets have been reset, and a new initial state for the
                targets will be returned in subsequent changes.

                After the initial state is complete, ``CURRENT`` will be
                returned even if the target was previously indicated to be
                ``CURRENT``.
        """
        NO_CHANGE = 0
        ADD = 1
        REMOVE = 2
        CURRENT = 3
        RESET = 4

    target_change_type: TargetChangeType = proto.Field(
        proto.ENUM,
        number=1,
        enum=TargetChangeType,
    )
    target_ids: MutableSequence[int] = proto.RepeatedField(
        proto.INT32,
        number=2,
    )
    cause: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=3,
        message=status_pb2.Status,
    )
    resume_token: bytes = proto.Field(
        proto.BYTES,
        number=4,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )


class ListCollectionIdsRequest(proto.Message):
    r"""The request for
    [Firestore.ListCollectionIds][google.firestore.v1.Firestore.ListCollectionIds].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. The parent document. In the format:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.
            For example:
            ``projects/my-project/databases/my-database/documents/chatrooms/my-chatroom``
        page_size (int):
            The maximum number of results to return.
        page_token (str):
            A page token. Must be a value from
            [ListCollectionIdsResponse][google.firestore.v1.ListCollectionIdsResponse].
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Reads documents as they were at the given
            time.
            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_selector``.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=3,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="consistency_selector",
        message=timestamp_pb2.Timestamp,
    )


class ListCollectionIdsResponse(proto.Message):
    r"""The response from
    [Firestore.ListCollectionIds][google.firestore.v1.Firestore.ListCollectionIds].

    Attributes:
        collection_ids (MutableSequence[str]):
            The collection ids.
        next_page_token (str):
            A page token that may be used to continue the
            list.
    """

    @property
    def raw_page(self):
        return self

    collection_ids: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=1,
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class BatchWriteRequest(proto.Message):
    r"""The request for
    [Firestore.BatchWrite][google.firestore.v1.Firestore.BatchWrite].

    Attributes:
        database (str):
            Required. The database name. In the format:
            ``projects/{project_id}/databases/{database_id}``.
        writes (MutableSequence[google.cloud.firestore_v1.types.Write]):
            The writes to apply.

            Method does not apply writes atomically and does
            not guarantee ordering. Each write succeeds or
            fails independently. You cannot write to the
            same document more than once per request.
        labels (MutableMapping[str, str]):
            Labels associated with this batch write.
    """

    database: str = proto.Field(
        proto.STRING,
        number=1,
    )
    writes: MutableSequence[write.Write] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=write.Write,
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=3,
    )


class BatchWriteResponse(proto.Message):
    r"""The response from
    [Firestore.BatchWrite][google.firestore.v1.Firestore.BatchWrite].

    Attributes:
        write_results (MutableSequence[google.cloud.firestore_v1.types.WriteResult]):
            The result of applying the writes.

            This i-th write result corresponds to the i-th
            write in the request.
        status (MutableSequence[google.rpc.status_pb2.Status]):
            The status of applying the writes.

            This i-th write status corresponds to the i-th
            write in the request.
    """

    write_results: MutableSequence[write.WriteResult] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=write.WriteResult,
    )
    status: MutableSequence[status_pb2.Status] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=status_pb2.Status,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
