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

from google.cloud.datastore_v1.types import aggregation_result
from google.cloud.datastore_v1.types import entity
from google.cloud.datastore_v1.types import query as gd_query
from google.cloud.datastore_v1.types import query_profile
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.datastore.v1",
    manifest={
        "LookupRequest",
        "LookupResponse",
        "RunQueryRequest",
        "RunQueryResponse",
        "RunAggregationQueryRequest",
        "RunAggregationQueryResponse",
        "BeginTransactionRequest",
        "BeginTransactionResponse",
        "RollbackRequest",
        "RollbackResponse",
        "CommitRequest",
        "CommitResponse",
        "AllocateIdsRequest",
        "AllocateIdsResponse",
        "ReserveIdsRequest",
        "ReserveIdsResponse",
        "Mutation",
        "PropertyTransform",
        "MutationResult",
        "PropertyMask",
        "ReadOptions",
        "TransactionOptions",
    },
)


class LookupRequest(proto.Message):
    r"""The request for
    [Datastore.Lookup][google.datastore.v1.Datastore.Lookup].

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        read_options (google.cloud.datastore_v1.types.ReadOptions):
            The options for this lookup request.
        keys (MutableSequence[google.cloud.datastore_v1.types.Key]):
            Required. Keys of entities to look up.
        property_mask (google.cloud.datastore_v1.types.PropertyMask):
            The properties to return. Defaults to returning all
            properties.

            If this field is set and an entity has a property not
            referenced in the mask, it will be absent from
            [LookupResponse.found.entity.properties][].

            The entity's key is always returned.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    read_options: "ReadOptions" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="ReadOptions",
    )
    keys: MutableSequence[entity.Key] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=entity.Key,
    )
    property_mask: "PropertyMask" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="PropertyMask",
    )


class LookupResponse(proto.Message):
    r"""The response for
    [Datastore.Lookup][google.datastore.v1.Datastore.Lookup].

    Attributes:
        found (MutableSequence[google.cloud.datastore_v1.types.EntityResult]):
            Entities found as ``ResultType.FULL`` entities. The order of
            results in this field is undefined and has no relation to
            the order of the keys in the input.
        missing (MutableSequence[google.cloud.datastore_v1.types.EntityResult]):
            Entities not found as ``ResultType.KEY_ONLY`` entities. The
            order of results in this field is undefined and has no
            relation to the order of the keys in the input.
        deferred (MutableSequence[google.cloud.datastore_v1.types.Key]):
            A list of keys that were not looked up due to
            resource constraints. The order of results in
            this field is undefined and has no relation to
            the order of the keys in the input.
        transaction (bytes):
            The identifier of the transaction that was started as part
            of this Lookup request.

            Set only when
            [ReadOptions.new_transaction][google.datastore.v1.ReadOptions.new_transaction]
            was set in
            [LookupRequest.read_options][google.datastore.v1.LookupRequest.read_options].
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which these entities were read or
            found missing.
    """

    found: MutableSequence[gd_query.EntityResult] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=gd_query.EntityResult,
    )
    missing: MutableSequence[gd_query.EntityResult] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=gd_query.EntityResult,
    )
    deferred: MutableSequence[entity.Key] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=entity.Key,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=5,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )


class RunQueryRequest(proto.Message):
    r"""The request for
    [Datastore.RunQuery][google.datastore.v1.Datastore.RunQuery].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        partition_id (google.cloud.datastore_v1.types.PartitionId):
            Entities are partitioned into subsets,
            identified by a partition ID. Queries are scoped
            to a single partition. This partition ID is
            normalized with the standard default context
            partition ID.
        read_options (google.cloud.datastore_v1.types.ReadOptions):
            The options for this query.
        query (google.cloud.datastore_v1.types.Query):
            The query to run.

            This field is a member of `oneof`_ ``query_type``.
        gql_query (google.cloud.datastore_v1.types.GqlQuery):
            The GQL query to run. This query must be a
            non-aggregation query.

            This field is a member of `oneof`_ ``query_type``.
        property_mask (google.cloud.datastore_v1.types.PropertyMask):
            The properties to return. This field must not be set for a
            projection query.

            See
            [LookupRequest.property_mask][google.datastore.v1.LookupRequest.property_mask].
        explain_options (google.cloud.datastore_v1.types.ExplainOptions):
            Optional. Explain options for the query. If
            set, additional query statistics will be
            returned. If not, only query results will be
            returned.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    partition_id: entity.PartitionId = proto.Field(
        proto.MESSAGE,
        number=2,
        message=entity.PartitionId,
    )
    read_options: "ReadOptions" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="ReadOptions",
    )
    query: gd_query.Query = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="query_type",
        message=gd_query.Query,
    )
    gql_query: gd_query.GqlQuery = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="query_type",
        message=gd_query.GqlQuery,
    )
    property_mask: "PropertyMask" = proto.Field(
        proto.MESSAGE,
        number=10,
        message="PropertyMask",
    )
    explain_options: query_profile.ExplainOptions = proto.Field(
        proto.MESSAGE,
        number=12,
        message=query_profile.ExplainOptions,
    )


class RunQueryResponse(proto.Message):
    r"""The response for
    [Datastore.RunQuery][google.datastore.v1.Datastore.RunQuery].

    Attributes:
        batch (google.cloud.datastore_v1.types.QueryResultBatch):
            A batch of query results (always present).
        query (google.cloud.datastore_v1.types.Query):
            The parsed form of the ``GqlQuery`` from the request, if it
            was set.
        transaction (bytes):
            The identifier of the transaction that was started as part
            of this RunQuery request.

            Set only when
            [ReadOptions.new_transaction][google.datastore.v1.ReadOptions.new_transaction]
            was set in
            [RunQueryRequest.read_options][google.datastore.v1.RunQueryRequest.read_options].
        explain_metrics (google.cloud.datastore_v1.types.ExplainMetrics):
            Query explain metrics. This is only present when the
            [RunQueryRequest.explain_options][google.datastore.v1.RunQueryRequest.explain_options]
            is provided, and it is sent only once with the last response
            in the stream.
    """

    batch: gd_query.QueryResultBatch = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gd_query.QueryResultBatch,
    )
    query: gd_query.Query = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gd_query.Query,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=5,
    )
    explain_metrics: query_profile.ExplainMetrics = proto.Field(
        proto.MESSAGE,
        number=9,
        message=query_profile.ExplainMetrics,
    )


class RunAggregationQueryRequest(proto.Message):
    r"""The request for
    [Datastore.RunAggregationQuery][google.datastore.v1.Datastore.RunAggregationQuery].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        partition_id (google.cloud.datastore_v1.types.PartitionId):
            Entities are partitioned into subsets,
            identified by a partition ID. Queries are scoped
            to a single partition. This partition ID is
            normalized with the standard default context
            partition ID.
        read_options (google.cloud.datastore_v1.types.ReadOptions):
            The options for this query.
        aggregation_query (google.cloud.datastore_v1.types.AggregationQuery):
            The query to run.

            This field is a member of `oneof`_ ``query_type``.
        gql_query (google.cloud.datastore_v1.types.GqlQuery):
            The GQL query to run. This query must be an
            aggregation query.

            This field is a member of `oneof`_ ``query_type``.
        explain_options (google.cloud.datastore_v1.types.ExplainOptions):
            Optional. Explain options for the query. If
            set, additional query statistics will be
            returned. If not, only query results will be
            returned.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    partition_id: entity.PartitionId = proto.Field(
        proto.MESSAGE,
        number=2,
        message=entity.PartitionId,
    )
    read_options: "ReadOptions" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="ReadOptions",
    )
    aggregation_query: gd_query.AggregationQuery = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="query_type",
        message=gd_query.AggregationQuery,
    )
    gql_query: gd_query.GqlQuery = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="query_type",
        message=gd_query.GqlQuery,
    )
    explain_options: query_profile.ExplainOptions = proto.Field(
        proto.MESSAGE,
        number=11,
        message=query_profile.ExplainOptions,
    )


class RunAggregationQueryResponse(proto.Message):
    r"""The response for
    [Datastore.RunAggregationQuery][google.datastore.v1.Datastore.RunAggregationQuery].

    Attributes:
        batch (google.cloud.datastore_v1.types.AggregationResultBatch):
            A batch of aggregation results. Always
            present.
        query (google.cloud.datastore_v1.types.AggregationQuery):
            The parsed form of the ``GqlQuery`` from the request, if it
            was set.
        transaction (bytes):
            The identifier of the transaction that was started as part
            of this RunAggregationQuery request.

            Set only when
            [ReadOptions.new_transaction][google.datastore.v1.ReadOptions.new_transaction]
            was set in
            [RunAggregationQueryRequest.read_options][google.datastore.v1.RunAggregationQueryRequest.read_options].
        explain_metrics (google.cloud.datastore_v1.types.ExplainMetrics):
            Query explain metrics. This is only present when the
            [RunAggregationQueryRequest.explain_options][google.datastore.v1.RunAggregationQueryRequest.explain_options]
            is provided, and it is sent only once with the last response
            in the stream.
    """

    batch: aggregation_result.AggregationResultBatch = proto.Field(
        proto.MESSAGE,
        number=1,
        message=aggregation_result.AggregationResultBatch,
    )
    query: gd_query.AggregationQuery = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gd_query.AggregationQuery,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=5,
    )
    explain_metrics: query_profile.ExplainMetrics = proto.Field(
        proto.MESSAGE,
        number=9,
        message=query_profile.ExplainMetrics,
    )


class BeginTransactionRequest(proto.Message):
    r"""The request for
    [Datastore.BeginTransaction][google.datastore.v1.Datastore.BeginTransaction].

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        transaction_options (google.cloud.datastore_v1.types.TransactionOptions):
            Options for a new transaction.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    transaction_options: "TransactionOptions" = proto.Field(
        proto.MESSAGE,
        number=10,
        message="TransactionOptions",
    )


class BeginTransactionResponse(proto.Message):
    r"""The response for
    [Datastore.BeginTransaction][google.datastore.v1.Datastore.BeginTransaction].

    Attributes:
        transaction (bytes):
            The transaction identifier (always present).
    """

    transaction: bytes = proto.Field(
        proto.BYTES,
        number=1,
    )


class RollbackRequest(proto.Message):
    r"""The request for
    [Datastore.Rollback][google.datastore.v1.Datastore.Rollback].

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        transaction (bytes):
            Required. The transaction identifier, returned by a call to
            [Datastore.BeginTransaction][google.datastore.v1.Datastore.BeginTransaction].
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=1,
    )


class RollbackResponse(proto.Message):
    r"""The response for
    [Datastore.Rollback][google.datastore.v1.Datastore.Rollback]. (an
    empty message).

    """


class CommitRequest(proto.Message):
    r"""The request for
    [Datastore.Commit][google.datastore.v1.Datastore.Commit].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        mode (google.cloud.datastore_v1.types.CommitRequest.Mode):
            The type of commit to perform. Defaults to
            ``TRANSACTIONAL``.
        transaction (bytes):
            The identifier of the transaction associated with the
            commit. A transaction identifier is returned by a call to
            [Datastore.BeginTransaction][google.datastore.v1.Datastore.BeginTransaction].

            This field is a member of `oneof`_ ``transaction_selector``.
        single_use_transaction (google.cloud.datastore_v1.types.TransactionOptions):
            Options for beginning a new transaction for this request.
            The transaction is committed when the request completes. If
            specified,
            [TransactionOptions.mode][google.datastore.v1.TransactionOptions]
            must be
            [TransactionOptions.ReadWrite][google.datastore.v1.TransactionOptions.ReadWrite].

            This field is a member of `oneof`_ ``transaction_selector``.
        mutations (MutableSequence[google.cloud.datastore_v1.types.Mutation]):
            The mutations to perform.

            When mode is ``TRANSACTIONAL``, mutations affecting a single
            entity are applied in order. The following sequences of
            mutations affecting a single entity are not permitted in a
            single ``Commit`` request:

            -  ``insert`` followed by ``insert``
            -  ``update`` followed by ``insert``
            -  ``upsert`` followed by ``insert``
            -  ``delete`` followed by ``update``

            When mode is ``NON_TRANSACTIONAL``, no two mutations may
            affect a single entity.
    """

    class Mode(proto.Enum):
        r"""The modes available for commits.

        Values:
            MODE_UNSPECIFIED (0):
                Unspecified. This value must not be used.
            TRANSACTIONAL (1):
                Transactional: The mutations are either all applied, or none
                are applied. Learn about transactions
                `here <https://cloud.google.com/datastore/docs/concepts/transactions>`__.
            NON_TRANSACTIONAL (2):
                Non-transactional: The mutations may not
                apply as all or none.
        """
        MODE_UNSPECIFIED = 0
        TRANSACTIONAL = 1
        NON_TRANSACTIONAL = 2

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    mode: Mode = proto.Field(
        proto.ENUM,
        number=5,
        enum=Mode,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=1,
        oneof="transaction_selector",
    )
    single_use_transaction: "TransactionOptions" = proto.Field(
        proto.MESSAGE,
        number=10,
        oneof="transaction_selector",
        message="TransactionOptions",
    )
    mutations: MutableSequence["Mutation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="Mutation",
    )


class CommitResponse(proto.Message):
    r"""The response for
    [Datastore.Commit][google.datastore.v1.Datastore.Commit].

    Attributes:
        mutation_results (MutableSequence[google.cloud.datastore_v1.types.MutationResult]):
            The result of performing the mutations.
            The i-th mutation result corresponds to the i-th
            mutation in the request.
        index_updates (int):
            The number of index entries updated during
            the commit, or zero if none were updated.
        commit_time (google.protobuf.timestamp_pb2.Timestamp):
            The transaction commit timestamp. Not set for
            non-transactional commits.
    """

    mutation_results: MutableSequence["MutationResult"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="MutationResult",
    )
    index_updates: int = proto.Field(
        proto.INT32,
        number=4,
    )
    commit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )


class AllocateIdsRequest(proto.Message):
    r"""The request for
    [Datastore.AllocateIds][google.datastore.v1.Datastore.AllocateIds].

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        keys (MutableSequence[google.cloud.datastore_v1.types.Key]):
            Required. A list of keys with incomplete key
            paths for which to allocate IDs. No key may be
            reserved/read-only.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    keys: MutableSequence[entity.Key] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=entity.Key,
    )


class AllocateIdsResponse(proto.Message):
    r"""The response for
    [Datastore.AllocateIds][google.datastore.v1.Datastore.AllocateIds].

    Attributes:
        keys (MutableSequence[google.cloud.datastore_v1.types.Key]):
            The keys specified in the request (in the
            same order), each with its key path completed
            with a newly allocated ID.
    """

    keys: MutableSequence[entity.Key] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=entity.Key,
    )


class ReserveIdsRequest(proto.Message):
    r"""The request for
    [Datastore.ReserveIds][google.datastore.v1.Datastore.ReserveIds].

    Attributes:
        project_id (str):
            Required. The ID of the project against which
            to make the request.
        database_id (str):
            The ID of the database against which to make
            the request.
            '(default)' is not allowed; please use empty
            string '' to refer the default database.
        keys (MutableSequence[google.cloud.datastore_v1.types.Key]):
            Required. A list of keys with complete key
            paths whose numeric IDs should not be
            auto-allocated.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=8,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=9,
    )
    keys: MutableSequence[entity.Key] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=entity.Key,
    )


class ReserveIdsResponse(proto.Message):
    r"""The response for
    [Datastore.ReserveIds][google.datastore.v1.Datastore.ReserveIds].

    """


class Mutation(proto.Message):
    r"""A mutation to apply to an entity.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        insert (google.cloud.datastore_v1.types.Entity):
            The entity to insert. The entity must not
            already exist. The entity key's final path
            element may be incomplete.

            This field is a member of `oneof`_ ``operation``.
        update (google.cloud.datastore_v1.types.Entity):
            The entity to update. The entity must already
            exist. Must have a complete key path.

            This field is a member of `oneof`_ ``operation``.
        upsert (google.cloud.datastore_v1.types.Entity):
            The entity to upsert. The entity may or may
            not already exist. The entity key's final path
            element may be incomplete.

            This field is a member of `oneof`_ ``operation``.
        delete (google.cloud.datastore_v1.types.Key):
            The key of the entity to delete. The entity
            may or may not already exist. Must have a
            complete key path and must not be
            reserved/read-only.

            This field is a member of `oneof`_ ``operation``.
        base_version (int):
            The version of the entity that this mutation
            is being applied to. If this does not match the
            current version on the server, the mutation
            conflicts.

            This field is a member of `oneof`_ ``conflict_detection_strategy``.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The update time of the entity that this
            mutation is being applied to. If this does not
            match the current update time on the server, the
            mutation conflicts.

            This field is a member of `oneof`_ ``conflict_detection_strategy``.
        conflict_resolution_strategy (google.cloud.datastore_v1.types.Mutation.ConflictResolutionStrategy):
            The strategy to use when a conflict is detected. Defaults to
            ``SERVER_VALUE``. If this is set, then
            ``conflict_detection_strategy`` must also be set.
        property_mask (google.cloud.datastore_v1.types.PropertyMask):
            The properties to write in this mutation. None of the
            properties in the mask may have a reserved name, except for
            ``__key__``. This field is ignored for ``delete``.

            If the entity already exists, only properties referenced in
            the mask are updated, others are left untouched. Properties
            referenced in the mask but not in the entity are deleted.
        property_transforms (MutableSequence[google.cloud.datastore_v1.types.PropertyTransform]):
            Optional. The transforms to perform on the entity.

            This field can be set only when the operation is ``insert``,
            ``update``, or ``upsert``. If present, the transforms are be
            applied to the entity regardless of the property mask, in
            order, after the operation.
    """

    class ConflictResolutionStrategy(proto.Enum):
        r"""The possible ways to resolve a conflict detected in a
        mutation.

        Values:
            STRATEGY_UNSPECIFIED (0):
                Unspecified. Defaults to ``SERVER_VALUE``.
            SERVER_VALUE (1):
                The server entity is kept.
            FAIL (3):
                The whole commit request fails.
        """
        STRATEGY_UNSPECIFIED = 0
        SERVER_VALUE = 1
        FAIL = 3

    insert: entity.Entity = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="operation",
        message=entity.Entity,
    )
    update: entity.Entity = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="operation",
        message=entity.Entity,
    )
    upsert: entity.Entity = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="operation",
        message=entity.Entity,
    )
    delete: entity.Key = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="operation",
        message=entity.Key,
    )
    base_version: int = proto.Field(
        proto.INT64,
        number=8,
        oneof="conflict_detection_strategy",
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=11,
        oneof="conflict_detection_strategy",
        message=timestamp_pb2.Timestamp,
    )
    conflict_resolution_strategy: ConflictResolutionStrategy = proto.Field(
        proto.ENUM,
        number=10,
        enum=ConflictResolutionStrategy,
    )
    property_mask: "PropertyMask" = proto.Field(
        proto.MESSAGE,
        number=9,
        message="PropertyMask",
    )
    property_transforms: MutableSequence["PropertyTransform"] = proto.RepeatedField(
        proto.MESSAGE,
        number=12,
        message="PropertyTransform",
    )


class PropertyTransform(proto.Message):
    r"""A transformation of an entity property.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        property (str):
            Optional. The name of the property.

            Property paths (a list of property names separated by dots
            (``.``)) may be used to refer to properties inside entity
            values. For example ``foo.bar`` means the property ``bar``
            inside the entity property ``foo``.

            If a property name contains a dot ``.`` or a backlslash
            ``\``, then that name must be escaped.
        set_to_server_value (google.cloud.datastore_v1.types.PropertyTransform.ServerValue):
            Sets the property to the given server value.

            This field is a member of `oneof`_ ``transform_type``.
        increment (google.cloud.datastore_v1.types.Value):
            Adds the given value to the property's
            current value.
            This must be an integer or a double value.
            If the property is not an integer or double, or
            if the property does not yet exist, the
            transformation will set the property to the
            given value. If either of the given value or the
            current property value are doubles, both values
            will be interpreted as doubles. Double
            arithmetic and representation of double values
            follows IEEE 754 semantics. If there is
            positive/negative integer overflow, the property
            is resolved to the largest magnitude
            positive/negative integer.

            This field is a member of `oneof`_ ``transform_type``.
        maximum (google.cloud.datastore_v1.types.Value):
            Sets the property to the maximum of its
            current value and the given value.

            This must be an integer or a double value.
            If the property is not an integer or double, or
            if the property does not yet exist, the
            transformation will set the property to the
            given value. If a maximum operation is applied
            where the property and the input value are of
            mixed types (that is - one is an integer and one
            is a double) the property takes on the type of
            the larger operand. If the operands are
            equivalent (e.g. 3 and 3.0), the property does
            not change. 0, 0.0, and -0.0 are all zero. The
            maximum of a zero stored value and zero input
            value is always the stored value.
            The maximum of any numeric value x and NaN is
            NaN.

            This field is a member of `oneof`_ ``transform_type``.
        minimum (google.cloud.datastore_v1.types.Value):
            Sets the property to the minimum of its
            current value and the given value.

            This must be an integer or a double value.
            If the property is not an integer or double, or
            if the property does not yet exist, the
            transformation will set the property to the
            input value. If a minimum operation is applied
            where the property and the input value are of
            mixed types (that is - one is an integer and one
            is a double) the property takes on the type of
            the smaller operand. If the operands are
            equivalent (e.g. 3 and 3.0), the property does
            not change. 0, 0.0, and -0.0 are all zero. The
            minimum of a zero stored value and zero input
            value is always the stored value. The minimum of
            any numeric value x and NaN is NaN.

            This field is a member of `oneof`_ ``transform_type``.
        append_missing_elements (google.cloud.datastore_v1.types.ArrayValue):
            Appends the given elements in order if they
            are not already present in the current property
            value. If the property is not an array, or if
            the property does not yet exist, it is first set
            to the empty array.

            Equivalent numbers of different types (e.g. 3L
            and 3.0) are considered equal when checking if a
            value is missing. NaN is equal to NaN, and the
            null value is equal to the null value. If the
            input contains multiple equivalent values, only
            the first will be considered.

            The corresponding transform result will be the
            null value.

            This field is a member of `oneof`_ ``transform_type``.
        remove_all_from_array (google.cloud.datastore_v1.types.ArrayValue):
            Removes all of the given elements from the
            array in the property. If the property is not an
            array, or if the property does not yet exist, it
            is set to the empty array.

            Equivalent numbers of different types (e.g. 3L
            and 3.0) are considered equal when deciding
            whether an element should be removed. NaN is
            equal to NaN, and the null value is equal to the
            null value. This will remove all equivalent
            values if there are duplicates.

            The corresponding transform result will be the
            null value.

            This field is a member of `oneof`_ ``transform_type``.
    """

    class ServerValue(proto.Enum):
        r"""A value that is calculated by the server.

        Values:
            SERVER_VALUE_UNSPECIFIED (0):
                Unspecified. This value must not be used.
            REQUEST_TIME (1):
                The time at which the server processed the
                request, with millisecond precision. If used on
                multiple properties (same or different entities)
                in a transaction, all the properties will get
                the same server timestamp.
        """
        SERVER_VALUE_UNSPECIFIED = 0
        REQUEST_TIME = 1

    property: str = proto.Field(
        proto.STRING,
        number=1,
    )
    set_to_server_value: ServerValue = proto.Field(
        proto.ENUM,
        number=2,
        oneof="transform_type",
        enum=ServerValue,
    )
    increment: entity.Value = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="transform_type",
        message=entity.Value,
    )
    maximum: entity.Value = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="transform_type",
        message=entity.Value,
    )
    minimum: entity.Value = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="transform_type",
        message=entity.Value,
    )
    append_missing_elements: entity.ArrayValue = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="transform_type",
        message=entity.ArrayValue,
    )
    remove_all_from_array: entity.ArrayValue = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="transform_type",
        message=entity.ArrayValue,
    )


class MutationResult(proto.Message):
    r"""The result of applying a mutation.

    Attributes:
        key (google.cloud.datastore_v1.types.Key):
            The automatically allocated key.
            Set only when the mutation allocated a key.
        version (int):
            The version of the entity on the server after
            processing the mutation. If the mutation doesn't
            change anything on the server, then the version
            will be the version of the current entity or, if
            no entity is present, a version that is strictly
            greater than the version of any previous entity
            and less than the version of any possible future
            entity.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The create time of the entity. This field
            will not be set after a 'delete'.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The update time of the entity on the server
            after processing the mutation. If the mutation
            doesn't change anything on the server, then the
            timestamp will be the update timestamp of the
            current entity. This field will not be set after
            a 'delete'.
        conflict_detected (bool):
            Whether a conflict was detected for this
            mutation. Always false when a conflict detection
            strategy field is not set in the mutation.
        transform_results (MutableSequence[google.cloud.datastore_v1.types.Value]):
            The results of applying each
            [PropertyTransform][google.datastore.v1.PropertyTransform],
            in the same order of the request.
    """

    key: entity.Key = proto.Field(
        proto.MESSAGE,
        number=3,
        message=entity.Key,
    )
    version: int = proto.Field(
        proto.INT64,
        number=4,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    conflict_detected: bool = proto.Field(
        proto.BOOL,
        number=5,
    )
    transform_results: MutableSequence[entity.Value] = proto.RepeatedField(
        proto.MESSAGE,
        number=8,
        message=entity.Value,
    )


class PropertyMask(proto.Message):
    r"""The set of arbitrarily nested property paths used to restrict
    an operation to only a subset of properties in an entity.

    Attributes:
        paths (MutableSequence[str]):
            The paths to the properties covered by this mask.

            A path is a list of property names separated by dots
            (``.``), for example ``foo.bar`` means the property ``bar``
            inside the entity property ``foo`` inside the entity
            associated with this path.

            If a property name contains a dot ``.`` or a backslash
            ``\``, then that name must be escaped.

            A path must not be empty, and may not reference a value
            inside an [array
            value][google.datastore.v1.Value.array_value].
    """

    paths: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=1,
    )


class ReadOptions(proto.Message):
    r"""The options shared by read requests.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        read_consistency (google.cloud.datastore_v1.types.ReadOptions.ReadConsistency):
            The non-transactional read consistency to
            use.

            This field is a member of `oneof`_ ``consistency_type``.
        transaction (bytes):
            The identifier of the transaction in which to read. A
            transaction identifier is returned by a call to
            [Datastore.BeginTransaction][google.datastore.v1.Datastore.BeginTransaction].

            This field is a member of `oneof`_ ``consistency_type``.
        new_transaction (google.cloud.datastore_v1.types.TransactionOptions):
            Options for beginning a new transaction for this request.

            The new transaction identifier will be returned in the
            corresponding response as either
            [LookupResponse.transaction][google.datastore.v1.LookupResponse.transaction]
            or
            [RunQueryResponse.transaction][google.datastore.v1.RunQueryResponse.transaction].

            This field is a member of `oneof`_ ``consistency_type``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Reads entities as they were at the given
            time. This value is only supported for Cloud
            Firestore in Datastore mode.

            This must be a microsecond precision timestamp
            within the past one hour, or if Point-in-Time
            Recovery is enabled, can additionally be a whole
            minute timestamp within the past 7 days.

            This field is a member of `oneof`_ ``consistency_type``.
    """

    class ReadConsistency(proto.Enum):
        r"""The possible values for read consistencies.

        Values:
            READ_CONSISTENCY_UNSPECIFIED (0):
                Unspecified. This value must not be used.
            STRONG (1):
                Strong consistency.
            EVENTUAL (2):
                Eventual consistency.
        """
        READ_CONSISTENCY_UNSPECIFIED = 0
        STRONG = 1
        EVENTUAL = 2

    read_consistency: ReadConsistency = proto.Field(
        proto.ENUM,
        number=1,
        oneof="consistency_type",
        enum=ReadConsistency,
    )
    transaction: bytes = proto.Field(
        proto.BYTES,
        number=2,
        oneof="consistency_type",
    )
    new_transaction: "TransactionOptions" = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="consistency_type",
        message="TransactionOptions",
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="consistency_type",
        message=timestamp_pb2.Timestamp,
    )


class TransactionOptions(proto.Message):
    r"""Options for beginning a new transaction.

    Transactions can be created explicitly with calls to
    [Datastore.BeginTransaction][google.datastore.v1.Datastore.BeginTransaction]
    or implicitly by setting
    [ReadOptions.new_transaction][google.datastore.v1.ReadOptions.new_transaction]
    in read requests.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        read_write (google.cloud.datastore_v1.types.TransactionOptions.ReadWrite):
            The transaction should allow both reads and
            writes.

            This field is a member of `oneof`_ ``mode``.
        read_only (google.cloud.datastore_v1.types.TransactionOptions.ReadOnly):
            The transaction should only allow reads.

            This field is a member of `oneof`_ ``mode``.
    """

    class ReadWrite(proto.Message):
        r"""Options specific to read / write transactions.

        Attributes:
            previous_transaction (bytes):
                The transaction identifier of the transaction
                being retried.
        """

        previous_transaction: bytes = proto.Field(
            proto.BYTES,
            number=1,
        )

    class ReadOnly(proto.Message):
        r"""Options specific to read-only transactions.

        Attributes:
            read_time (google.protobuf.timestamp_pb2.Timestamp):
                Reads entities at the given time.

                This must be a microsecond precision timestamp
                within the past one hour, or if Point-in-Time
                Recovery is enabled, can additionally be a whole
                minute timestamp within the past 7 days.
        """

        read_time: timestamp_pb2.Timestamp = proto.Field(
            proto.MESSAGE,
            number=1,
            message=timestamp_pb2.Timestamp,
        )

    read_write: ReadWrite = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="mode",
        message=ReadWrite,
    )
    read_only: ReadOnly = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="mode",
        message=ReadOnly,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
