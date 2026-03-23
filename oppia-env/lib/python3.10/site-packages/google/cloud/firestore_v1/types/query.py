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

from google.cloud.firestore_v1.types import document
from google.protobuf import wrappers_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.v1",
    manifest={
        "StructuredQuery",
        "StructuredAggregationQuery",
        "Cursor",
    },
)


class StructuredQuery(proto.Message):
    r"""A Firestore query.

    The query stages are executed in the following order:

    1. from
    2. where
    3. select
    4. order_by + start_at + end_at
    5. offset
    6. limit
    7. find_nearest

    Attributes:
        select (google.cloud.firestore_v1.types.StructuredQuery.Projection):
            Optional sub-set of the fields to return.

            This acts as a
            [DocumentMask][google.firestore.v1.DocumentMask] over the
            documents returned from a query. When not set, assumes that
            the caller wants all fields returned.
        from_ (MutableSequence[google.cloud.firestore_v1.types.StructuredQuery.CollectionSelector]):
            The collections to query.
        where (google.cloud.firestore_v1.types.StructuredQuery.Filter):
            The filter to apply.
        order_by (MutableSequence[google.cloud.firestore_v1.types.StructuredQuery.Order]):
            The order to apply to the query results.

            Firestore allows callers to provide a full ordering, a
            partial ordering, or no ordering at all. In all cases,
            Firestore guarantees a stable ordering through the following
            rules:

            -  The ``order_by`` is required to reference all fields used
               with an inequality filter.
            -  All fields that are required to be in the ``order_by``
               but are not already present are appended in
               lexicographical ordering of the field name.
            -  If an order on ``__name__`` is not specified, it is
               appended by default.

            Fields are appended with the same sort direction as the last
            order specified, or 'ASCENDING' if no order was specified.
            For example:

            -  ``ORDER BY a`` becomes ``ORDER BY a ASC, __name__ ASC``
            -  ``ORDER BY a DESC`` becomes
               ``ORDER BY a DESC, __name__ DESC``
            -  ``WHERE a > 1`` becomes
               ``WHERE a > 1 ORDER BY a ASC, __name__ ASC``
            -  ``WHERE __name__ > ... AND a > 1`` becomes
               ``WHERE __name__ > ... AND a > 1 ORDER BY a ASC, __name__ ASC``
        start_at (google.cloud.firestore_v1.types.Cursor):
            A potential prefix of a position in the result set to start
            the query at.

            The ordering of the result set is based on the ``ORDER BY``
            clause of the original query.

            ::

               SELECT * FROM k WHERE a = 1 AND b > 2 ORDER BY b ASC, __name__ ASC;

            This query's results are ordered by
            ``(b ASC, __name__ ASC)``.

            Cursors can reference either the full ordering or a prefix
            of the location, though it cannot reference more fields than
            what are in the provided ``ORDER BY``.

            Continuing off the example above, attaching the following
            start cursors will have varying impact:

            -  ``START BEFORE (2, /k/123)``: start the query right
               before ``a = 1 AND b > 2 AND __name__ > /k/123``.
            -  ``START AFTER (10)``: start the query right after
               ``a = 1 AND b > 10``.

            Unlike ``OFFSET`` which requires scanning over the first N
            results to skip, a start cursor allows the query to begin at
            a logical position. This position is not required to match
            an actual result, it will scan forward from this position to
            find the next document.

            Requires:

            -  The number of values cannot be greater than the number of
               fields specified in the ``ORDER BY`` clause.
        end_at (google.cloud.firestore_v1.types.Cursor):
            A potential prefix of a position in the result set to end
            the query at.

            This is similar to ``START_AT`` but with it controlling the
            end position rather than the start position.

            Requires:

            -  The number of values cannot be greater than the number of
               fields specified in the ``ORDER BY`` clause.
        offset (int):
            The number of documents to skip before returning the first
            result.

            This applies after the constraints specified by the
            ``WHERE``, ``START AT``, & ``END AT`` but before the
            ``LIMIT`` clause.

            Requires:

            -  The value must be greater than or equal to zero if
               specified.
        limit (google.protobuf.wrappers_pb2.Int32Value):
            The maximum number of results to return.

            Applies after all other constraints.

            Requires:

            -  The value must be greater than or equal to zero if
               specified.
        find_nearest (google.cloud.firestore_v1.types.StructuredQuery.FindNearest):
            Optional. A potential nearest neighbors
            search.
            Applies after all other filters and ordering.

            Finds the closest vector embeddings to the given
            query vector.
    """

    class Direction(proto.Enum):
        r"""A sort direction.

        Values:
            DIRECTION_UNSPECIFIED (0):
                Unspecified.
            ASCENDING (1):
                Ascending.
            DESCENDING (2):
                Descending.
        """
        DIRECTION_UNSPECIFIED = 0
        ASCENDING = 1
        DESCENDING = 2

    class CollectionSelector(proto.Message):
        r"""A selection of a collection, such as ``messages as m1``.

        Attributes:
            collection_id (str):
                The collection ID.
                When set, selects only collections with this ID.
            all_descendants (bool):
                When false, selects only collections that are immediate
                children of the ``parent`` specified in the containing
                ``RunQueryRequest``. When true, selects all descendant
                collections.
        """

        collection_id: str = proto.Field(
            proto.STRING,
            number=2,
        )
        all_descendants: bool = proto.Field(
            proto.BOOL,
            number=3,
        )

    class Filter(proto.Message):
        r"""A filter.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            composite_filter (google.cloud.firestore_v1.types.StructuredQuery.CompositeFilter):
                A composite filter.

                This field is a member of `oneof`_ ``filter_type``.
            field_filter (google.cloud.firestore_v1.types.StructuredQuery.FieldFilter):
                A filter on a document field.

                This field is a member of `oneof`_ ``filter_type``.
            unary_filter (google.cloud.firestore_v1.types.StructuredQuery.UnaryFilter):
                A filter that takes exactly one argument.

                This field is a member of `oneof`_ ``filter_type``.
        """

        composite_filter: "StructuredQuery.CompositeFilter" = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="filter_type",
            message="StructuredQuery.CompositeFilter",
        )
        field_filter: "StructuredQuery.FieldFilter" = proto.Field(
            proto.MESSAGE,
            number=2,
            oneof="filter_type",
            message="StructuredQuery.FieldFilter",
        )
        unary_filter: "StructuredQuery.UnaryFilter" = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="filter_type",
            message="StructuredQuery.UnaryFilter",
        )

    class CompositeFilter(proto.Message):
        r"""A filter that merges multiple other filters using the given
        operator.

        Attributes:
            op (google.cloud.firestore_v1.types.StructuredQuery.CompositeFilter.Operator):
                The operator for combining multiple filters.
            filters (MutableSequence[google.cloud.firestore_v1.types.StructuredQuery.Filter]):
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
                    Documents are required to satisfy all of the
                    combined filters.
                OR (2):
                    Documents are required to satisfy at least
                    one of the combined filters.
            """
            OPERATOR_UNSPECIFIED = 0
            AND = 1
            OR = 2

        op: "StructuredQuery.CompositeFilter.Operator" = proto.Field(
            proto.ENUM,
            number=1,
            enum="StructuredQuery.CompositeFilter.Operator",
        )
        filters: MutableSequence["StructuredQuery.Filter"] = proto.RepeatedField(
            proto.MESSAGE,
            number=2,
            message="StructuredQuery.Filter",
        )

    class FieldFilter(proto.Message):
        r"""A filter on a specific field.

        Attributes:
            field (google.cloud.firestore_v1.types.StructuredQuery.FieldReference):
                The field to filter by.
            op (google.cloud.firestore_v1.types.StructuredQuery.FieldFilter.Operator):
                The operator to filter by.
            value (google.cloud.firestore_v1.types.Value):
                The value to compare to.
        """

        class Operator(proto.Enum):
            r"""A field filter operator.

            Values:
                OPERATOR_UNSPECIFIED (0):
                    Unspecified. This value must not be used.
                LESS_THAN (1):
                    The given ``field`` is less than the given ``value``.

                    Requires:

                    -  That ``field`` come first in ``order_by``.
                LESS_THAN_OR_EQUAL (2):
                    The given ``field`` is less than or equal to the given
                    ``value``.

                    Requires:

                    -  That ``field`` come first in ``order_by``.
                GREATER_THAN (3):
                    The given ``field`` is greater than the given ``value``.

                    Requires:

                    -  That ``field`` come first in ``order_by``.
                GREATER_THAN_OR_EQUAL (4):
                    The given ``field`` is greater than or equal to the given
                    ``value``.

                    Requires:

                    -  That ``field`` come first in ``order_by``.
                EQUAL (5):
                    The given ``field`` is equal to the given ``value``.
                NOT_EQUAL (6):
                    The given ``field`` is not equal to the given ``value``.

                    Requires:

                    -  No other ``NOT_EQUAL``, ``NOT_IN``, ``IS_NOT_NULL``, or
                       ``IS_NOT_NAN``.
                    -  That ``field`` comes first in the ``order_by``.
                ARRAY_CONTAINS (7):
                    The given ``field`` is an array that contains the given
                    ``value``.
                IN (8):
                    The given ``field`` is equal to at least one value in the
                    given array.

                    Requires:

                    -  That ``value`` is a non-empty ``ArrayValue``, subject to
                       disjunction limits.
                    -  No ``NOT_IN`` filters in the same query.
                ARRAY_CONTAINS_ANY (9):
                    The given ``field`` is an array that contains any of the
                    values in the given array.

                    Requires:

                    -  That ``value`` is a non-empty ``ArrayValue``, subject to
                       disjunction limits.
                    -  No other ``ARRAY_CONTAINS_ANY`` filters within the same
                       disjunction.
                    -  No ``NOT_IN`` filters in the same query.
                NOT_IN (10):
                    The value of the ``field`` is not in the given array.

                    Requires:

                    -  That ``value`` is a non-empty ``ArrayValue`` with at most
                       10 values.
                    -  No other ``OR``, ``IN``, ``ARRAY_CONTAINS_ANY``,
                       ``NOT_IN``, ``NOT_EQUAL``, ``IS_NOT_NULL``, or
                       ``IS_NOT_NAN``.
                    -  That ``field`` comes first in the ``order_by``.
            """
            OPERATOR_UNSPECIFIED = 0
            LESS_THAN = 1
            LESS_THAN_OR_EQUAL = 2
            GREATER_THAN = 3
            GREATER_THAN_OR_EQUAL = 4
            EQUAL = 5
            NOT_EQUAL = 6
            ARRAY_CONTAINS = 7
            IN = 8
            ARRAY_CONTAINS_ANY = 9
            NOT_IN = 10

        field: "StructuredQuery.FieldReference" = proto.Field(
            proto.MESSAGE,
            number=1,
            message="StructuredQuery.FieldReference",
        )
        op: "StructuredQuery.FieldFilter.Operator" = proto.Field(
            proto.ENUM,
            number=2,
            enum="StructuredQuery.FieldFilter.Operator",
        )
        value: document.Value = proto.Field(
            proto.MESSAGE,
            number=3,
            message=document.Value,
        )

    class UnaryFilter(proto.Message):
        r"""A filter with a single operand.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            op (google.cloud.firestore_v1.types.StructuredQuery.UnaryFilter.Operator):
                The unary operator to apply.
            field (google.cloud.firestore_v1.types.StructuredQuery.FieldReference):
                The field to which to apply the operator.

                This field is a member of `oneof`_ ``operand_type``.
        """

        class Operator(proto.Enum):
            r"""A unary operator.

            Values:
                OPERATOR_UNSPECIFIED (0):
                    Unspecified. This value must not be used.
                IS_NAN (2):
                    The given ``field`` is equal to ``NaN``.
                IS_NULL (3):
                    The given ``field`` is equal to ``NULL``.
                IS_NOT_NAN (4):
                    The given ``field`` is not equal to ``NaN``.

                    Requires:

                    -  No other ``NOT_EQUAL``, ``NOT_IN``, ``IS_NOT_NULL``, or
                       ``IS_NOT_NAN``.
                    -  That ``field`` comes first in the ``order_by``.
                IS_NOT_NULL (5):
                    The given ``field`` is not equal to ``NULL``.

                    Requires:

                    -  A single ``NOT_EQUAL``, ``NOT_IN``, ``IS_NOT_NULL``, or
                       ``IS_NOT_NAN``.
                    -  That ``field`` comes first in the ``order_by``.
            """
            OPERATOR_UNSPECIFIED = 0
            IS_NAN = 2
            IS_NULL = 3
            IS_NOT_NAN = 4
            IS_NOT_NULL = 5

        op: "StructuredQuery.UnaryFilter.Operator" = proto.Field(
            proto.ENUM,
            number=1,
            enum="StructuredQuery.UnaryFilter.Operator",
        )
        field: "StructuredQuery.FieldReference" = proto.Field(
            proto.MESSAGE,
            number=2,
            oneof="operand_type",
            message="StructuredQuery.FieldReference",
        )

    class Order(proto.Message):
        r"""An order on a field.

        Attributes:
            field (google.cloud.firestore_v1.types.StructuredQuery.FieldReference):
                The field to order by.
            direction (google.cloud.firestore_v1.types.StructuredQuery.Direction):
                The direction to order by. Defaults to ``ASCENDING``.
        """

        field: "StructuredQuery.FieldReference" = proto.Field(
            proto.MESSAGE,
            number=1,
            message="StructuredQuery.FieldReference",
        )
        direction: "StructuredQuery.Direction" = proto.Field(
            proto.ENUM,
            number=2,
            enum="StructuredQuery.Direction",
        )

    class FieldReference(proto.Message):
        r"""A reference to a field in a document, ex: ``stats.operations``.

        Attributes:
            field_path (str):
                A reference to a field in a document.

                Requires:

                -  MUST be a dot-delimited (``.``) string of segments, where
                   each segment conforms to [document field
                   name][google.firestore.v1.Document.fields] limitations.
        """

        field_path: str = proto.Field(
            proto.STRING,
            number=2,
        )

    class Projection(proto.Message):
        r"""The projection of document's fields to return.

        Attributes:
            fields (MutableSequence[google.cloud.firestore_v1.types.StructuredQuery.FieldReference]):
                The fields to return.

                If empty, all fields are returned. To only return the name
                of the document, use ``['__name__']``.
        """

        fields: MutableSequence["StructuredQuery.FieldReference"] = proto.RepeatedField(
            proto.MESSAGE,
            number=2,
            message="StructuredQuery.FieldReference",
        )

    class FindNearest(proto.Message):
        r"""Nearest Neighbors search config. The ordering provided by
        FindNearest supersedes the order_by stage. If multiple documents
        have the same vector distance, the returned document order is not
        guaranteed to be stable between queries.

        Attributes:
            vector_field (google.cloud.firestore_v1.types.StructuredQuery.FieldReference):
                Required. An indexed vector field to search upon. Only
                documents which contain vectors whose dimensionality match
                the query_vector can be returned.
            query_vector (google.cloud.firestore_v1.types.Value):
                Required. The query vector that we are
                searching on. Must be a vector of no more than
                2048 dimensions.
            distance_measure (google.cloud.firestore_v1.types.StructuredQuery.FindNearest.DistanceMeasure):
                Required. The distance measure to use,
                required.
            limit (google.protobuf.wrappers_pb2.Int32Value):
                Required. The number of nearest neighbors to
                return. Must be a positive integer of no more
                than 1000.
            distance_result_field (str):
                Optional. Optional name of the field to output the result of
                the vector distance calculation. Must conform to [document
                field name][google.firestore.v1.Document.fields]
                limitations.
            distance_threshold (google.protobuf.wrappers_pb2.DoubleValue):
                Optional. Option to specify a threshold for which no less
                similar documents will be returned. The behavior of the
                specified ``distance_measure`` will affect the meaning of
                the distance threshold. Since DOT_PRODUCT distances increase
                when the vectors are more similar, the comparison is
                inverted.

                -  For EUCLIDEAN, COSINE: WHERE distance <=
                   distance_threshold
                -  For DOT_PRODUCT: WHERE distance >= distance_threshold
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

        vector_field: "StructuredQuery.FieldReference" = proto.Field(
            proto.MESSAGE,
            number=1,
            message="StructuredQuery.FieldReference",
        )
        query_vector: document.Value = proto.Field(
            proto.MESSAGE,
            number=2,
            message=document.Value,
        )
        distance_measure: "StructuredQuery.FindNearest.DistanceMeasure" = proto.Field(
            proto.ENUM,
            number=3,
            enum="StructuredQuery.FindNearest.DistanceMeasure",
        )
        limit: wrappers_pb2.Int32Value = proto.Field(
            proto.MESSAGE,
            number=4,
            message=wrappers_pb2.Int32Value,
        )
        distance_result_field: str = proto.Field(
            proto.STRING,
            number=5,
        )
        distance_threshold: wrappers_pb2.DoubleValue = proto.Field(
            proto.MESSAGE,
            number=6,
            message=wrappers_pb2.DoubleValue,
        )

    select: Projection = proto.Field(
        proto.MESSAGE,
        number=1,
        message=Projection,
    )
    from_: MutableSequence[CollectionSelector] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=CollectionSelector,
    )
    where: Filter = proto.Field(
        proto.MESSAGE,
        number=3,
        message=Filter,
    )
    order_by: MutableSequence[Order] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=Order,
    )
    start_at: "Cursor" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="Cursor",
    )
    end_at: "Cursor" = proto.Field(
        proto.MESSAGE,
        number=8,
        message="Cursor",
    )
    offset: int = proto.Field(
        proto.INT32,
        number=6,
    )
    limit: wrappers_pb2.Int32Value = proto.Field(
        proto.MESSAGE,
        number=5,
        message=wrappers_pb2.Int32Value,
    )
    find_nearest: FindNearest = proto.Field(
        proto.MESSAGE,
        number=9,
        message=FindNearest,
    )


class StructuredAggregationQuery(proto.Message):
    r"""Firestore query for running an aggregation over a
    [StructuredQuery][google.firestore.v1.StructuredQuery].


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        structured_query (google.cloud.firestore_v1.types.StructuredQuery):
            Nested structured query.

            This field is a member of `oneof`_ ``query_type``.
        aggregations (MutableSequence[google.cloud.firestore_v1.types.StructuredAggregationQuery.Aggregation]):
            Optional. Series of aggregations to apply over the results
            of the ``structured_query``.

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
            count (google.cloud.firestore_v1.types.StructuredAggregationQuery.Aggregation.Count):
                Count aggregator.

                This field is a member of `oneof`_ ``operator``.
            sum (google.cloud.firestore_v1.types.StructuredAggregationQuery.Aggregation.Sum):
                Sum aggregator.

                This field is a member of `oneof`_ ``operator``.
            avg (google.cloud.firestore_v1.types.StructuredAggregationQuery.Aggregation.Avg):
                Average aggregator.

                This field is a member of `oneof`_ ``operator``.
            alias (str):
                Optional. Optional name of the field to store the result of
                the aggregation into.

                If not provided, Firestore will pick a default name
                following the format ``field_<incremental_id++>``. For
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
                     COUNT_UP_TO(2) AS field_1,
                     COUNT_UP_TO(3) AS count_up_to_3,
                     COUNT(*) AS field_2
                   OVER (
                     ...
                   );

                Requires:

                -  Must be unique across all aggregation aliases.
                -  Conform to [document field
                   name][google.firestore.v1.Document.fields] limitations.
        """

        class Count(proto.Message):
            r"""Count of documents that match the query.

            The ``COUNT(*)`` aggregation function operates on the entire
            document so it does not require a field reference.

            Attributes:
                up_to (google.protobuf.wrappers_pb2.Int64Value):
                    Optional. Optional constraint on the maximum number of
                    documents to count.

                    This provides a way to set an upper bound on the number of
                    documents to scan, limiting latency, and cost.

                    Unspecified is interpreted as no bound.

                    High-Level Example:

                    ::

                       AGGREGATE COUNT_UP_TO(1000) OVER ( SELECT * FROM k );

                    Requires:

                    -  Must be greater than zero when present.
            """

            up_to: wrappers_pb2.Int64Value = proto.Field(
                proto.MESSAGE,
                number=1,
                message=wrappers_pb2.Int64Value,
            )

        class Sum(proto.Message):
            r"""Sum of the values of the requested field.

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
                field (google.cloud.firestore_v1.types.StructuredQuery.FieldReference):
                    The field to aggregate on.
            """

            field: "StructuredQuery.FieldReference" = proto.Field(
                proto.MESSAGE,
                number=1,
                message="StructuredQuery.FieldReference",
            )

        class Avg(proto.Message):
            r"""Average of the values of the requested field.

            -  Only numeric values will be aggregated. All non-numeric values
               including ``NULL`` are skipped.

            -  If the aggregated values contain ``NaN``, returns ``NaN``.
               Infinity math follows IEEE-754 standards.

            -  If the aggregated value set is empty, returns ``NULL``.

            -  Always returns the result as a double.

            Attributes:
                field (google.cloud.firestore_v1.types.StructuredQuery.FieldReference):
                    The field to aggregate on.
            """

            field: "StructuredQuery.FieldReference" = proto.Field(
                proto.MESSAGE,
                number=1,
                message="StructuredQuery.FieldReference",
            )

        count: "StructuredAggregationQuery.Aggregation.Count" = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="operator",
            message="StructuredAggregationQuery.Aggregation.Count",
        )
        sum: "StructuredAggregationQuery.Aggregation.Sum" = proto.Field(
            proto.MESSAGE,
            number=2,
            oneof="operator",
            message="StructuredAggregationQuery.Aggregation.Sum",
        )
        avg: "StructuredAggregationQuery.Aggregation.Avg" = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="operator",
            message="StructuredAggregationQuery.Aggregation.Avg",
        )
        alias: str = proto.Field(
            proto.STRING,
            number=7,
        )

    structured_query: "StructuredQuery" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="query_type",
        message="StructuredQuery",
    )
    aggregations: MutableSequence[Aggregation] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=Aggregation,
    )


class Cursor(proto.Message):
    r"""A position in a query result set.

    Attributes:
        values (MutableSequence[google.cloud.firestore_v1.types.Value]):
            The values that represent a position, in the
            order they appear in the order by clause of a
            query.

            Can contain fewer values than specified in the
            order by clause.
        before (bool):
            If the position is just before or just after
            the given values, relative to the sort order
            defined by the query.
    """

    values: MutableSequence[document.Value] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=document.Value,
    )
    before: bool = proto.Field(
        proto.BOOL,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
