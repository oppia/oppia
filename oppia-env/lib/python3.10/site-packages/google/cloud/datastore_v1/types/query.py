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

from google.cloud.datastore_v1.types import entity as gd_entity
from google.protobuf import timestamp_pb2  # type: ignore
from google.protobuf import wrappers_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.datastore.v1",
    manifest={
        "EntityResult",
        "Query",
        "AggregationQuery",
        "KindExpression",
        "PropertyReference",
        "Projection",
        "PropertyOrder",
        "Filter",
        "CompositeFilter",
        "PropertyFilter",
        "FindNearest",
        "GqlQuery",
        "GqlQueryParameter",
        "QueryResultBatch",
    },
)


class EntityResult(proto.Message):
    r"""The result of fetching an entity from Datastore.

    Attributes:
        entity (google.cloud.datastore_v1.types.Entity):
            The resulting entity.
        version (int):
            The version of the entity, a strictly positive number that
            monotonically increases with changes to the entity.

            This field is set for
            [``FULL``][google.datastore.v1.EntityResult.ResultType.FULL]
            entity results.

            For [missing][google.datastore.v1.LookupResponse.missing]
            entities in ``LookupResponse``, this is the version of the
            snapshot that was used to look up the entity, and it is
            always set except for eventually consistent reads.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the entity was created. This field is set
            for
            [``FULL``][google.datastore.v1.EntityResult.ResultType.FULL]
            entity results. If this entity is missing, this field will
            not be set.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the entity was last changed. This field is
            set for
            [``FULL``][google.datastore.v1.EntityResult.ResultType.FULL]
            entity results. If this entity is missing, this field will
            not be set.
        cursor (bytes):
            A cursor that points to the position after the result
            entity. Set only when the ``EntityResult`` is part of a
            ``QueryResultBatch`` message.
    """

    class ResultType(proto.Enum):
        r"""Specifies what data the 'entity' field contains. A ``ResultType`` is
        either implied (for example, in ``LookupResponse.missing`` from
        ``datastore.proto``, it is always ``KEY_ONLY``) or specified by
        context (for example, in message ``QueryResultBatch``, field
        ``entity_result_type`` specifies a ``ResultType`` for all the values
        in field ``entity_results``).

        Values:
            RESULT_TYPE_UNSPECIFIED (0):
                Unspecified. This value is never used.
            FULL (1):
                The key and properties.
            PROJECTION (2):
                A projected subset of properties. The entity
                may have no key.
            KEY_ONLY (3):
                Only the key.
        """
        RESULT_TYPE_UNSPECIFIED = 0
        FULL = 1
        PROJECTION = 2
        KEY_ONLY = 3

    entity: gd_entity.Entity = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gd_entity.Entity,
    )
    version: int = proto.Field(
        proto.INT64,
        number=4,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    cursor: bytes = proto.Field(
        proto.BYTES,
        number=3,
    )


class Query(proto.Message):
    r"""A query for entities.

    The query stages are executed in the following order:

    1. kind
    2. filter
    3. projection
    4. order + start_cursor + end_cursor
    5. offset
    6. limit
    7. find_nearest

    Attributes:
        projection (MutableSequence[google.cloud.datastore_v1.types.Projection]):
            The projection to return. Defaults to
            returning all properties.
        kind (MutableSequence[google.cloud.datastore_v1.types.KindExpression]):
            The kinds to query (if empty, returns
            entities of all kinds). Currently at most 1 kind
            may be specified.
        filter (google.cloud.datastore_v1.types.Filter):
            The filter to apply.
        order (MutableSequence[google.cloud.datastore_v1.types.PropertyOrder]):
            The order to apply to the query results (if
            empty, order is unspecified).
        distinct_on (MutableSequence[google.cloud.datastore_v1.types.PropertyReference]):
            The properties to make distinct. The query results will
            contain the first result for each distinct combination of
            values for the given properties (if empty, all results are
            returned).

            Requires:

            -  If ``order`` is specified, the set of distinct on
               properties must appear before the non-distinct on
               properties in ``order``.
        start_cursor (bytes):
            A starting point for the query results. Query cursors are
            returned in query result batches and `can only be used to
            continue the same
            query <https://cloud.google.com/datastore/docs/concepts/queries#cursors_limits_and_offsets>`__.
        end_cursor (bytes):
            An ending point for the query results. Query cursors are
            returned in query result batches and `can only be used to
            limit the same
            query <https://cloud.google.com/datastore/docs/concepts/queries#cursors_limits_and_offsets>`__.
        offset (int):
            The number of results to skip. Applies before
            limit, but after all other constraints.
            Optional. Must be >= 0 if specified.
        limit (google.protobuf.wrappers_pb2.Int32Value):
            The maximum number of results to return.
            Applies after all other constraints. Optional.
            Unspecified is interpreted as no limit.
            Must be >= 0 if specified.
        find_nearest (google.cloud.datastore_v1.types.FindNearest):
            Optional. A potential Nearest Neighbors
            Search.
            Applies after all other filters and ordering.

            Finds the closest vector embeddings to the given
            query vector.
    """

    projection: MutableSequence["Projection"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Projection",
    )
    kind: MutableSequence["KindExpression"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="KindExpression",
    )
    filter: "Filter" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="Filter",
    )
    order: MutableSequence["PropertyOrder"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="PropertyOrder",
    )
    distinct_on: MutableSequence["PropertyReference"] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="PropertyReference",
    )
    start_cursor: bytes = proto.Field(
        proto.BYTES,
        number=7,
    )
    end_cursor: bytes = proto.Field(
        proto.BYTES,
        number=8,
    )
    offset: int = proto.Field(
        proto.INT32,
        number=10,
    )
    limit: wrappers_pb2.Int32Value = proto.Field(
        proto.MESSAGE,
        number=12,
        message=wrappers_pb2.Int32Value,
    )
    find_nearest: "FindNearest" = proto.Field(
        proto.MESSAGE,
        number=13,
        message="FindNearest",
    )


class AggregationQuery(proto.Message):
    r"""Datastore query for running an aggregation over a
    [Query][google.datastore.v1.Query].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        nested_query (google.cloud.datastore_v1.types.Query):
            Nested query for aggregation

            This field is a member of `oneof`_ ``query_type``.
        aggregations (MutableSequence[google.cloud.datastore_v1.types.AggregationQuery.Aggregation]):
            Optional. Series of aggregations to apply over the results
            of the ``nested_query``.

            Requires:

            -  A minimum of one and maximum of five aggregations per
               query.
    """

    class Aggregation(proto.Message):
        r"""Defines an aggregation that produces a single result.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            count (google.cloud.datastore_v1.types.AggregationQuery.Aggregation.Count):
                Count aggregator.

                This field is a member of `oneof`_ ``operator``.
            sum (google.cloud.datastore_v1.types.AggregationQuery.Aggregation.Sum):
                Sum aggregator.

                This field is a member of `oneof`_ ``operator``.
            avg (google.cloud.datastore_v1.types.AggregationQuery.Aggregation.Avg):
                Average aggregator.

                This field is a member of `oneof`_ ``operator``.
            alias (str):
                Optional. Optional name of the property to store the result
                of the aggregation.

                If not provided, Datastore will pick a default name
                following the format ``property_<incremental_id++>``. For
                example:

                ::

                   AGGREGATE
                     COUNT_UP_TO(1) AS count_up_to_1,
                     COUNT_UP_TO(2),
                     COUNT_UP_TO(3) AS count_up_to_3,
                     COUNT(*)
                   OVER (
                     ...
                   );

                becomes:

                ::

                   AGGREGATE
                     COUNT_UP_TO(1) AS count_up_to_1,
                     COUNT_UP_TO(2) AS property_1,
                     COUNT_UP_TO(3) AS count_up_to_3,
                     COUNT(*) AS property_2
                   OVER (
                     ...
                   );

                Requires:

                -  Must be unique across all aggregation aliases.
                -  Conform to [entity property
                   name][google.datastore.v1.Entity.properties] limitations.
        """

        class Count(proto.Message):
            r"""Count of entities that match the query.

            The ``COUNT(*)`` aggregation function operates on the entire entity
            so it does not require a field reference.

            Attributes:
                up_to (google.protobuf.wrappers_pb2.Int64Value):
                    Optional. Optional constraint on the maximum number of
                    entities to count.

                    This provides a way to set an upper bound on the number of
                    entities to scan, limiting latency, and cost.

                    Unspecified is interpreted as no bound.

                    If a zero value is provided, a count result of zero should
                    always be expected.

                    High-Level Example:

                    ::

                       AGGREGATE COUNT_UP_TO(1000) OVER ( SELECT * FROM k );

                    Requires:

                    -  Must be non-negative when present.
            """

            up_to: wrappers_pb2.Int64Value = proto.Field(
                proto.MESSAGE,
                number=1,
                message=wrappers_pb2.Int64Value,
            )

        class Sum(proto.Message):
            r"""Sum of the values of the requested property.

            -  Only numeric values will be aggregated. All non-numeric values
               including ``NULL`` are skipped.

            -  If the aggregated values contain ``NaN``, returns ``NaN``.
               Infinity math follows IEEE-754 standards.

            -  If the aggregated value set is empty, returns 0.

            -  Returns a 64-bit integer if all aggregated numbers are integers
               and the sum result does not overflow. Otherwise, the result is
               returned as a double. Note that even if all the aggregated values
               are integers, the result is returned as a double if it cannot fit
               within a 64-bit signed integer. When this occurs, the returned
               value will lose precision.

            -  When underflow occurs, floating-point aggregation is
               non-deterministic. This means that running the same query
               repeatedly without any changes to the underlying values could
               produce slightly different results each time. In those cases,
               values should be stored as integers over floating-point numbers.

            Attributes:
                property (google.cloud.datastore_v1.types.PropertyReference):
                    The property to aggregate on.
            """

            property: "PropertyReference" = proto.Field(
                proto.MESSAGE,
                number=1,
                message="PropertyReference",
            )

        class Avg(proto.Message):
            r"""Average of the values of the requested property.

            -  Only numeric values will be aggregated. All non-numeric values
               including ``NULL`` are skipped.

            -  If the aggregated values contain ``NaN``, returns ``NaN``.
               Infinity math follows IEEE-754 standards.

            -  If the aggregated value set is empty, returns ``NULL``.

            -  Always returns the result as a double.

            Attributes:
                property (google.cloud.datastore_v1.types.PropertyReference):
                    The property to aggregate on.
            """

            property: "PropertyReference" = proto.Field(
                proto.MESSAGE,
                number=1,
                message="PropertyReference",
            )

        count: "AggregationQuery.Aggregation.Count" = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="operator",
            message="AggregationQuery.Aggregation.Count",
        )
        sum: "AggregationQuery.Aggregation.Sum" = proto.Field(
            proto.MESSAGE,
            number=2,
            oneof="operator",
            message="AggregationQuery.Aggregation.Sum",
        )
        avg: "AggregationQuery.Aggregation.Avg" = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="operator",
            message="AggregationQuery.Aggregation.Avg",
        )
        alias: str = proto.Field(
            proto.STRING,
            number=7,
        )

    nested_query: "Query" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="query_type",
        message="Query",
    )
    aggregations: MutableSequence[Aggregation] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=Aggregation,
    )


class KindExpression(proto.Message):
    r"""A representation of a kind.

    Attributes:
        name (str):
            The name of the kind.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class PropertyReference(proto.Message):
    r"""A reference to a property relative to the kind expressions.

    Attributes:
        name (str):
            A reference to a property.

            Requires:

            -  MUST be a dot-delimited (``.``) string of segments, where
               each segment conforms to [entity property
               name][google.datastore.v1.Entity.properties] limitations.
    """

    name: str = proto.Field(
        proto.STRING,
        number=2,
    )


class Projection(proto.Message):
    r"""A representation of a property in a projection.

    Attributes:
        property (google.cloud.datastore_v1.types.PropertyReference):
            The property to project.
    """

    property: "PropertyReference" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PropertyReference",
    )


class PropertyOrder(proto.Message):
    r"""The desired order for a specific property.

    Attributes:
        property (google.cloud.datastore_v1.types.PropertyReference):
            The property to order by.
        direction (google.cloud.datastore_v1.types.PropertyOrder.Direction):
            The direction to order by. Defaults to ``ASCENDING``.
    """

    class Direction(proto.Enum):
        r"""The sort direction.

        Values:
            DIRECTION_UNSPECIFIED (0):
                Unspecified. This value must not be used.
            ASCENDING (1):
                Ascending.
            DESCENDING (2):
                Descending.
        """
        DIRECTION_UNSPECIFIED = 0
        ASCENDING = 1
        DESCENDING = 2

    property: "PropertyReference" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PropertyReference",
    )
    direction: Direction = proto.Field(
        proto.ENUM,
        number=2,
        enum=Direction,
    )


class Filter(proto.Message):
    r"""A holder for any type of filter.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        composite_filter (google.cloud.datastore_v1.types.CompositeFilter):
            A composite filter.

            This field is a member of `oneof`_ ``filter_type``.
        property_filter (google.cloud.datastore_v1.types.PropertyFilter):
            A filter on a property.

            This field is a member of `oneof`_ ``filter_type``.
    """

    composite_filter: "CompositeFilter" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="filter_type",
        message="CompositeFilter",
    )
    property_filter: "PropertyFilter" = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="filter_type",
        message="PropertyFilter",
    )


class CompositeFilter(proto.Message):
    r"""A filter that merges multiple other filters using the given
    operator.

    Attributes:
        op (google.cloud.datastore_v1.types.CompositeFilter.Operator):
            The operator for combining multiple filters.
        filters (MutableSequence[google.cloud.datastore_v1.types.Filter]):
            The list of filters to combine.

            Requires:

            -  At least one filter is present.
    """

    class Operator(proto.Enum):
        r"""A composite filter operator.

        Values:
            OPERATOR_UNSPECIFIED (0):
                Unspecified. This value must not be used.
            AND (1):
                The results are required to satisfy each of
                the combined filters.
            OR (2):
                Documents are required to satisfy at least
                one of the combined filters.
        """
        OPERATOR_UNSPECIFIED = 0
        AND = 1
        OR = 2

    op: Operator = proto.Field(
        proto.ENUM,
        number=1,
        enum=Operator,
    )
    filters: MutableSequence["Filter"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Filter",
    )


class PropertyFilter(proto.Message):
    r"""A filter on a specific property.

    Attributes:
        property (google.cloud.datastore_v1.types.PropertyReference):
            The property to filter by.
        op (google.cloud.datastore_v1.types.PropertyFilter.Operator):
            The operator to filter by.
        value (google.cloud.datastore_v1.types.Value):
            The value to compare the property to.
    """

    class Operator(proto.Enum):
        r"""A property filter operator.

        Values:
            OPERATOR_UNSPECIFIED (0):
                Unspecified. This value must not be used.
            LESS_THAN (1):
                The given ``property`` is less than the given ``value``.

                Requires:

                -  That ``property`` comes first in ``order_by``.
            LESS_THAN_OR_EQUAL (2):
                The given ``property`` is less than or equal to the given
                ``value``.

                Requires:

                -  That ``property`` comes first in ``order_by``.
            GREATER_THAN (3):
                The given ``property`` is greater than the given ``value``.

                Requires:

                -  That ``property`` comes first in ``order_by``.
            GREATER_THAN_OR_EQUAL (4):
                The given ``property`` is greater than or equal to the given
                ``value``.

                Requires:

                -  That ``property`` comes first in ``order_by``.
            EQUAL (5):
                The given ``property`` is equal to the given ``value``.
            IN (6):
                The given ``property`` is equal to at least one value in the
                given array.

                Requires:

                -  That ``value`` is a non-empty ``ArrayValue``, subject to
                   disjunction limits.
                -  No ``NOT_IN`` is in the same query.
            NOT_EQUAL (9):
                The given ``property`` is not equal to the given ``value``.

                Requires:

                -  No other ``NOT_EQUAL`` or ``NOT_IN`` is in the same
                   query.
                -  That ``property`` comes first in the ``order_by``.
            HAS_ANCESTOR (11):
                Limit the result set to the given entity and its
                descendants.

                Requires:

                -  That ``value`` is an entity key.
                -  All evaluated disjunctions must have the same
                   ``HAS_ANCESTOR`` filter.
            NOT_IN (13):
                The value of the ``property`` is not in the given array.

                Requires:

                -  That ``value`` is a non-empty ``ArrayValue`` with at most
                   10 values.
                -  No other ``OR``, ``IN``, ``NOT_IN``, ``NOT_EQUAL`` is in
                   the same query.
                -  That ``field`` comes first in the ``order_by``.
        """
        OPERATOR_UNSPECIFIED = 0
        LESS_THAN = 1
        LESS_THAN_OR_EQUAL = 2
        GREATER_THAN = 3
        GREATER_THAN_OR_EQUAL = 4
        EQUAL = 5
        IN = 6
        NOT_EQUAL = 9
        HAS_ANCESTOR = 11
        NOT_IN = 13

    property: "PropertyReference" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PropertyReference",
    )
    op: Operator = proto.Field(
        proto.ENUM,
        number=2,
        enum=Operator,
    )
    value: gd_entity.Value = proto.Field(
        proto.MESSAGE,
        number=3,
        message=gd_entity.Value,
    )


class FindNearest(proto.Message):
    r"""Nearest Neighbors search config. The ordering provided by
    FindNearest supersedes the order_by stage. If multiple documents
    have the same vector distance, the returned document order is not
    guaranteed to be stable between queries.

    Attributes:
        vector_property (google.cloud.datastore_v1.types.PropertyReference):
            Required. An indexed vector property to search upon. Only
            documents which contain vectors whose dimensionality match
            the query_vector can be returned.
        query_vector (google.cloud.datastore_v1.types.Value):
            Required. The query vector that we are
            searching on. Must be a vector of no more than
            2048 dimensions.
        distance_measure (google.cloud.datastore_v1.types.FindNearest.DistanceMeasure):
            Required. The Distance Measure to use,
            required.
        limit (google.protobuf.wrappers_pb2.Int32Value):
            Required. The number of nearest neighbors to
            return. Must be a positive integer of no more
            than 100.
        distance_result_property (str):
            Optional. Optional name of the field to output the result of
            the vector distance calculation. Must conform to [entity
            property][google.datastore.v1.Entity.properties]
            limitations.
        distance_threshold (google.protobuf.wrappers_pb2.DoubleValue):
            Optional. Option to specify a threshold for which no less
            similar documents will be returned. The behavior of the
            specified ``distance_measure`` will affect the meaning of
            the distance threshold. Since DOT_PRODUCT distances increase
            when the vectors are more similar, the comparison is
            inverted.

            For EUCLIDEAN, COSINE: WHERE distance <= distance_threshold
            For DOT_PRODUCT: WHERE distance >= distance_threshold
    """

    class DistanceMeasure(proto.Enum):
        r"""The distance measure to use when comparing vectors.

        Values:
            DISTANCE_MEASURE_UNSPECIFIED (0):
                Should not be set.
            EUCLIDEAN (1):
                Measures the EUCLIDEAN distance between the vectors. See
                `Euclidean <https://en.wikipedia.org/wiki/Euclidean_distance>`__
                to learn more. The resulting distance decreases the more
                similar two vectors are.
            COSINE (2):
                COSINE distance compares vectors based on the angle between
                them, which allows you to measure similarity that isn't
                based on the vectors magnitude. We recommend using
                DOT_PRODUCT with unit normalized vectors instead of COSINE
                distance, which is mathematically equivalent with better
                performance. See `Cosine
                Similarity <https://en.wikipedia.org/wiki/Cosine_similarity>`__
                to learn more about COSINE similarity and COSINE distance.
                The resulting COSINE distance decreases the more similar two
                vectors are.
            DOT_PRODUCT (3):
                Similar to cosine but is affected by the magnitude of the
                vectors. See `Dot
                Product <https://en.wikipedia.org/wiki/Dot_product>`__ to
                learn more. The resulting distance increases the more
                similar two vectors are.
        """
        DISTANCE_MEASURE_UNSPECIFIED = 0
        EUCLIDEAN = 1
        COSINE = 2
        DOT_PRODUCT = 3

    vector_property: "PropertyReference" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PropertyReference",
    )
    query_vector: gd_entity.Value = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gd_entity.Value,
    )
    distance_measure: DistanceMeasure = proto.Field(
        proto.ENUM,
        number=3,
        enum=DistanceMeasure,
    )
    limit: wrappers_pb2.Int32Value = proto.Field(
        proto.MESSAGE,
        number=4,
        message=wrappers_pb2.Int32Value,
    )
    distance_result_property: str = proto.Field(
        proto.STRING,
        number=5,
    )
    distance_threshold: wrappers_pb2.DoubleValue = proto.Field(
        proto.MESSAGE,
        number=6,
        message=wrappers_pb2.DoubleValue,
    )


class GqlQuery(proto.Message):
    r"""A `GQL
    query <https://cloud.google.com/datastore/docs/apis/gql/gql_reference>`__.

    Attributes:
        query_string (str):
            A string of the format described
            `here <https://cloud.google.com/datastore/docs/apis/gql/gql_reference>`__.
        allow_literals (bool):
            When false, the query string must not contain any literals
            and instead must bind all values. For example,
            ``SELECT * FROM Kind WHERE a = 'string literal'`` is not
            allowed, while ``SELECT * FROM Kind WHERE a = @value`` is.
        named_bindings (MutableMapping[str, google.cloud.datastore_v1.types.GqlQueryParameter]):
            For each non-reserved named binding site in the query
            string, there must be a named parameter with that name, but
            not necessarily the inverse.

            Key must match regex ``[A-Za-z_$][A-Za-z_$0-9]*``, must not
            match regex ``__.*__``, and must not be ``""``.
        positional_bindings (MutableSequence[google.cloud.datastore_v1.types.GqlQueryParameter]):
            Numbered binding site @1 references the first numbered
            parameter, effectively using 1-based indexing, rather than
            the usual 0.

            For each binding site numbered i in ``query_string``, there
            must be an i-th numbered parameter. The inverse must also be
            true.
    """

    query_string: str = proto.Field(
        proto.STRING,
        number=1,
    )
    allow_literals: bool = proto.Field(
        proto.BOOL,
        number=2,
    )
    named_bindings: MutableMapping[str, "GqlQueryParameter"] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=5,
        message="GqlQueryParameter",
    )
    positional_bindings: MutableSequence["GqlQueryParameter"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="GqlQueryParameter",
    )


class GqlQueryParameter(proto.Message):
    r"""A binding parameter for a GQL query.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        value (google.cloud.datastore_v1.types.Value):
            A value parameter.

            This field is a member of `oneof`_ ``parameter_type``.
        cursor (bytes):
            A query cursor. Query cursors are returned in
            query result batches.

            This field is a member of `oneof`_ ``parameter_type``.
    """

    value: gd_entity.Value = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="parameter_type",
        message=gd_entity.Value,
    )
    cursor: bytes = proto.Field(
        proto.BYTES,
        number=3,
        oneof="parameter_type",
    )


class QueryResultBatch(proto.Message):
    r"""A batch of results produced by a query.

    Attributes:
        skipped_results (int):
            The number of results skipped, typically
            because of an offset.
        skipped_cursor (bytes):
            A cursor that points to the position after the last skipped
            result. Will be set when ``skipped_results`` != 0.
        entity_result_type (google.cloud.datastore_v1.types.EntityResult.ResultType):
            The result type for every entity in ``entity_results``.
        entity_results (MutableSequence[google.cloud.datastore_v1.types.EntityResult]):
            The results for this batch.
        end_cursor (bytes):
            A cursor that points to the position after
            the last result in the batch.
        more_results (google.cloud.datastore_v1.types.QueryResultBatch.MoreResultsType):
            The state of the query after the current
            batch.
        snapshot_version (int):
            The version number of the snapshot this batch was returned
            from. This applies to the range of results from the query's
            ``start_cursor`` (or the beginning of the query if no cursor
            was given) to this batch's ``end_cursor`` (not the query's
            ``end_cursor``).

            In a single transaction, subsequent query result batches for
            the same query can have a greater snapshot version number.
            Each batch's snapshot version is valid for all preceding
            batches. The value will be zero for eventually consistent
            queries.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Read timestamp this batch was returned from. This applies to
            the range of results from the query's ``start_cursor`` (or
            the beginning of the query if no cursor was given) to this
            batch's ``end_cursor`` (not the query's ``end_cursor``).

            In a single transaction, subsequent query result batches for
            the same query can have a greater timestamp. Each batch's
            read timestamp is valid for all preceding batches. This
            value will not be set for eventually consistent queries in
            Cloud Datastore.
    """

    class MoreResultsType(proto.Enum):
        r"""The possible values for the ``more_results`` field.

        Values:
            MORE_RESULTS_TYPE_UNSPECIFIED (0):
                Unspecified. This value is never used.
            NOT_FINISHED (1):
                There may be additional batches to fetch from
                this query.
            MORE_RESULTS_AFTER_LIMIT (2):
                The query is finished, but there may be more
                results after the limit.
            MORE_RESULTS_AFTER_CURSOR (4):
                The query is finished, but there may be more
                results after the end cursor.
            NO_MORE_RESULTS (3):
                The query is finished, and there are no more
                results.
        """
        MORE_RESULTS_TYPE_UNSPECIFIED = 0
        NOT_FINISHED = 1
        MORE_RESULTS_AFTER_LIMIT = 2
        MORE_RESULTS_AFTER_CURSOR = 4
        NO_MORE_RESULTS = 3

    skipped_results: int = proto.Field(
        proto.INT32,
        number=6,
    )
    skipped_cursor: bytes = proto.Field(
        proto.BYTES,
        number=3,
    )
    entity_result_type: "EntityResult.ResultType" = proto.Field(
        proto.ENUM,
        number=1,
        enum="EntityResult.ResultType",
    )
    entity_results: MutableSequence["EntityResult"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="EntityResult",
    )
    end_cursor: bytes = proto.Field(
        proto.BYTES,
        number=4,
    )
    more_results: MoreResultsType = proto.Field(
        proto.ENUM,
        number=5,
        enum=MoreResultsType,
    )
    snapshot_version: int = proto.Field(
        proto.INT64,
        number=7,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
