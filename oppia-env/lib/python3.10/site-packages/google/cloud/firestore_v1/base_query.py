# Copyright 2017 Google LLC All rights reserved.
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

"""Classes for representing queries for the Google Cloud Firestore API.

A :class:`~google.cloud.firestore_v1.query.Query` can be created directly from
a :class:`~google.cloud.firestore_v1.collection.Collection` and that can be
a more common way to create a query than direct usage of the constructor.
"""
from __future__ import annotations

import abc
import copy
import math
import warnings
from typing import (
    TYPE_CHECKING,
    Any,
    Coroutine,
    Dict,
    Iterable,
    List,
    Optional,
    Sequence,
    Tuple,
    Type,
    Union,
    TypeVar,
)

from google.api_core import retry as retries
from google.protobuf import wrappers_pb2

from google.cloud import firestore_v1
from google.cloud.firestore_v1 import _helpers, document
from google.cloud.firestore_v1 import field_path as field_path_module
from google.cloud.firestore_v1 import transforms

# Types needed only for Type Hints
from google.cloud.firestore_v1.base_document import DocumentSnapshot
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from google.cloud.firestore_v1.order import Order
from google.cloud.firestore_v1.types import (
    Cursor,
    RunQueryResponse,
    StructuredQuery,
    query,
)
from google.cloud.firestore_v1.vector import Vector

if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.async_stream_generator import AsyncStreamGenerator
    from google.cloud.firestore_v1.field_path import FieldPath
    from google.cloud.firestore_v1.query_profile import ExplainOptions
    from google.cloud.firestore_v1.query_results import QueryResultsList
    from google.cloud.firestore_v1.stream_generator import StreamGenerator


_BAD_DIR_STRING: str
_BAD_OP_NAN: str
_BAD_OP_NULL: str
_BAD_OP_STRING: str
_COMPARISON_OPERATORS: Dict[str, Any]
_EQ_OP: str
_NEQ_OP: str
_INVALID_CURSOR_TRANSFORM: str
_INVALID_WHERE_TRANSFORM: str
_MISMATCH_CURSOR_W_ORDER_BY: str
_MISSING_ORDER_BY: str
_NO_ORDERS_FOR_CURSOR: str
_operator_enum: Any


_EQ_OP = "=="
_NEQ_OP = "!="
_operator_enum = StructuredQuery.FieldFilter.Operator
_COMPARISON_OPERATORS = {
    "<": _operator_enum.LESS_THAN,
    "<=": _operator_enum.LESS_THAN_OR_EQUAL,
    _EQ_OP: _operator_enum.EQUAL,
    _NEQ_OP: _operator_enum.NOT_EQUAL,
    ">=": _operator_enum.GREATER_THAN_OR_EQUAL,
    ">": _operator_enum.GREATER_THAN,
    "array_contains": _operator_enum.ARRAY_CONTAINS,
    "in": _operator_enum.IN,
    "not-in": _operator_enum.NOT_IN,
    "array_contains_any": _operator_enum.ARRAY_CONTAINS_ANY,
}
# set of operators that don't involve equlity comparisons
# will be used in query normalization
_INEQUALITY_OPERATORS = (
    _operator_enum.LESS_THAN,
    _operator_enum.LESS_THAN_OR_EQUAL,
    _operator_enum.GREATER_THAN_OR_EQUAL,
    _operator_enum.GREATER_THAN,
    _operator_enum.NOT_EQUAL,
    _operator_enum.NOT_IN,
)
_BAD_OP_STRING = "Operator string {!r} is invalid. Valid choices are: {}."
_BAD_OP_NAN_NULL = 'Only equality ("==") or not-equal ("!=") filters can be used with None or NaN values'
_INVALID_WHERE_TRANSFORM = "Transforms cannot be used as where values."
_BAD_DIR_STRING = "Invalid direction {!r}. Must be one of {!r} or {!r}."
_INVALID_CURSOR_TRANSFORM = "Transforms cannot be used as cursor values."
_MISSING_ORDER_BY = (
    'The "order by" field path {!r} is not present in the cursor data {!r}. '
    "All fields sent to ``order_by()`` must be present in the fields "
    "if passed to one of ``start_at()`` / ``start_after()`` / "
    "``end_before()`` / ``end_at()`` to define a cursor."
)

_NO_ORDERS_FOR_CURSOR = (
    "Attempting to create a cursor with no fields to order on. "
    "When defining a cursor with one of ``start_at()`` / ``start_after()`` / "
    "``end_before()`` / ``end_at()``, all fields in the cursor must "
    "come from fields set in ``order_by()``."
)
_MISMATCH_CURSOR_W_ORDER_BY = "The cursor {!r} does not match the order fields {!r}."

_not_passed = object()

QueryType = TypeVar("QueryType", bound="BaseQuery")


class BaseFilter(abc.ABC):
    """Base class for Filters"""

    @abc.abstractmethod
    def _to_pb(self):
        """Build the protobuf representation based on values in the filter"""


def _validate_opation(op_string, value):
    """
    Given an input operator string (e.g, '!='), and a value (e.g. None),
    ensure that the operator and value combination is valid, and return
    an approproate new operator value. A new operator will be used if
    the operaion is a comparison against Null or NaN

    Args:
        op_string (Optional[str]): the requested operator
        value (Any): the value the operator is acting on
    Returns:
        str | StructuredQuery.UnaryFilter.Operator: operator to use in requests
    Raises:
        ValueError: if the operator and value combination is invalid
    """
    if value is None:
        if op_string == _EQ_OP:
            return StructuredQuery.UnaryFilter.Operator.IS_NULL
        elif op_string == _NEQ_OP:
            return StructuredQuery.UnaryFilter.Operator.IS_NOT_NULL
        else:
            raise ValueError(_BAD_OP_NAN_NULL)

    elif _isnan(value):
        if op_string == _EQ_OP:
            return StructuredQuery.UnaryFilter.Operator.IS_NAN
        elif op_string == _NEQ_OP:
            return StructuredQuery.UnaryFilter.Operator.IS_NOT_NAN
        else:
            raise ValueError(_BAD_OP_NAN_NULL)
    elif isinstance(value, (transforms.Sentinel, transforms._ValueList)):
        raise ValueError(_INVALID_WHERE_TRANSFORM)
    else:
        return op_string


class FieldFilter(BaseFilter):
    """Class representation of a Field Filter."""

    def __init__(self, field_path, op_string, value=None):
        self.field_path = field_path
        self.value = value
        self.op_string = _validate_opation(op_string, value)

    def _to_pb(self):
        """Returns the protobuf representation, either a StructuredQuery.UnaryFilter or a StructuredQuery.FieldFilter"""
        if self.value is None or _isnan(self.value):
            filter_pb = query.StructuredQuery.UnaryFilter(
                field=query.StructuredQuery.FieldReference(field_path=self.field_path),
                op=self.op_string,
            )
        else:
            filter_pb = query.StructuredQuery.FieldFilter(
                field=query.StructuredQuery.FieldReference(field_path=self.field_path),
                op=_enum_from_op_string(self.op_string),
                value=_helpers.encode_value(self.value),
            )
        return filter_pb


class BaseCompositeFilter(BaseFilter):
    """Base class for a Composite Filter. (either OR or AND)."""

    def __init__(
        self,
        operator=StructuredQuery.CompositeFilter.Operator.OPERATOR_UNSPECIFIED,
        filters=None,
    ):
        self.operator = operator
        if filters is None:
            self.filters = []
        else:
            self.filters = filters

    def __repr__(self):
        repr = f"op: {self.operator}\nFilters:"
        for filter in self.filters:
            repr += f"\n\t{filter}"
        return repr

    def _to_pb(self):
        """Build the protobuf representation based on values in the Composite Filter."""
        filter_pb = StructuredQuery.CompositeFilter(
            op=self.operator,
        )
        for filter in self.filters:
            if isinstance(filter, BaseCompositeFilter):
                fb = query.StructuredQuery.Filter(composite_filter=filter._to_pb())
            else:
                fb = _filter_pb(filter._to_pb())
            filter_pb.filters.append(fb)

        return filter_pb


class Or(BaseCompositeFilter):
    """Class representation of an OR Filter."""

    def __init__(self, filters):
        super().__init__(
            operator=StructuredQuery.CompositeFilter.Operator.OR, filters=filters
        )


class And(BaseCompositeFilter):
    """Class representation of an AND Filter."""

    def __init__(self, filters):
        super().__init__(
            operator=StructuredQuery.CompositeFilter.Operator.AND, filters=filters
        )


class BaseQuery(object):
    """Represents a query to the Firestore API.

    Instances of this class are considered immutable: all methods that
    would modify an instance instead return a new instance.

    Args:
        parent (:class:`~google.cloud.firestore_v1.collection.CollectionReference`):
            The collection that this query applies to.
        projection (Optional[:class:`google.cloud.firestore_v1.\
            query.StructuredQuery.Projection`]):
            A projection of document fields to limit the query results to.
        field_filters (Optional[Tuple[:class:`google.cloud.firestore_v1.\
            query.StructuredQuery.FieldFilter`, ...]]):
            The filters to be applied in the query.
        orders (Optional[Tuple[:class:`google.cloud.firestore_v1.\
            query.StructuredQuery.Order`, ...]]):
            The "order by" entries to use in the query.
        limit (Optional[int]):
            The maximum number of documents the query is allowed to return.
        limit_to_last (Optional[bool]):
            Denotes whether a provided limit is applied to the end of the result set.
        offset (Optional[int]):
            The number of results to skip.
        start_at (Optional[Tuple[dict, bool]]):
            Two-tuple of :

            * a mapping of fields. Any field that is present in this mapping
              must also be present in ``orders``
            * an ``after`` flag

            The fields and the flag combine to form a cursor used as
            a starting point in a query result set. If the ``after``
            flag is :data:`True`, the results will start just after any
            documents which have fields matching the cursor, otherwise
            any matching documents will be included in the result set.
            When the query is formed, the document values
            will be used in the order given by ``orders``.
        end_at (Optional[Tuple[dict, bool]]):
            Two-tuple of:

            * a mapping of fields. Any field that is present in this mapping
              must also be present in ``orders``
            * a ``before`` flag

            The fields and the flag combine to form a cursor used as
            an ending point in a query result set. If the ``before``
            flag is :data:`True`, the results will end just before any
            documents which have fields matching the cursor, otherwise
            any matching documents will be included in the result set.
            When the query is formed, the document values
            will be used in the order given by ``orders``.
        all_descendants (Optional[bool]):
            When false, selects only collections that are immediate children
            of the `parent` specified in the containing `RunQueryRequest`.
            When true, selects all descendant collections.
        recursive (Optional[bool]):
            When true, returns all documents and all documents in any subcollections
            below them. Defaults to false.
    """

    ASCENDING = "ASCENDING"
    """str: Sort query results in ascending order on a field."""
    DESCENDING = "DESCENDING"
    """str: Sort query results in descending order on a field."""

    def __init__(
        self,
        parent,
        projection=None,
        field_filters=(),
        orders=(),
        limit=None,
        limit_to_last=False,
        offset=None,
        start_at=None,
        end_at=None,
        all_descendants=False,
        recursive=False,
    ) -> None:
        self._parent = parent
        self._projection = projection
        self._field_filters = field_filters
        self._orders = orders
        self._limit = limit
        self._limit_to_last = limit_to_last
        self._offset = offset
        self._start_at = start_at
        self._end_at = end_at
        self._all_descendants = all_descendants
        self._recursive = recursive

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return (
            self._parent == other._parent
            and self._projection == other._projection
            and self._field_filters == other._field_filters
            and self._orders == other._orders
            and self._limit == other._limit
            and self._limit_to_last == other._limit_to_last
            and self._offset == other._offset
            and self._start_at == other._start_at
            and self._end_at == other._end_at
            and self._all_descendants == other._all_descendants
        )

    @property
    def _client(self):
        """The client of the parent collection.

        Returns:
            :class:`~google.cloud.firestore_v1.client.Client`:
            The client that owns this query.
        """
        return self._parent._client

    def select(self: QueryType, field_paths: Iterable[str]) -> QueryType:
        """Project documents matching query to a limited set of fields.

        See :meth:`~google.cloud.firestore_v1.client.Client.field_path` for
        more information on **field paths**.

        If the current query already has a projection set (i.e. has already
        called :meth:`~google.cloud.firestore_v1.query.Query.select`), this
        will overwrite it.

        Args:
            field_paths (Iterable[str, ...]): An iterable of field paths
                (``.``-delimited list of field names) to use as a projection
                of document fields in the query results.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A "projected" query. Acts as a copy of the current query,
            modified with the newly added projection.
        Raises:
            ValueError: If any ``field_path`` is invalid.
        """
        field_paths = list(field_paths)
        for field_path in field_paths:
            field_path_module.split_field_path(field_path)

        new_projection = query.StructuredQuery.Projection(
            fields=[
                query.StructuredQuery.FieldReference(field_path=field_path)
                for field_path in field_paths
            ]
        )
        return self._copy(projection=new_projection)

    def _copy(
        self: QueryType,
        *,
        projection: Optional[query.StructuredQuery.Projection] | object = _not_passed,
        field_filters: Optional[Tuple[query.StructuredQuery.FieldFilter]]
        | object = _not_passed,
        orders: Optional[Tuple[query.StructuredQuery.Order]] | object = _not_passed,
        limit: Optional[int] | object = _not_passed,
        limit_to_last: Optional[bool] | object = _not_passed,
        offset: Optional[int] | object = _not_passed,
        start_at: Optional[Tuple[dict, bool]] | object = _not_passed,
        end_at: Optional[Tuple[dict, bool]] | object = _not_passed,
        all_descendants: Optional[bool] | object = _not_passed,
        recursive: Optional[bool] | object = _not_passed,
    ) -> QueryType:
        return self.__class__(
            self._parent,
            projection=self._evaluate_param(projection, self._projection),
            field_filters=self._evaluate_param(field_filters, self._field_filters),
            orders=self._evaluate_param(orders, self._orders),
            limit=self._evaluate_param(limit, self._limit),
            limit_to_last=self._evaluate_param(limit_to_last, self._limit_to_last),
            offset=self._evaluate_param(offset, self._offset),
            start_at=self._evaluate_param(start_at, self._start_at),
            end_at=self._evaluate_param(end_at, self._end_at),
            all_descendants=self._evaluate_param(
                all_descendants, self._all_descendants
            ),
            recursive=self._evaluate_param(recursive, self._recursive),
        )

    def _evaluate_param(self, value, fallback_value):
        """Helper which allows `None` to be passed into `copy` and be set on the
        copy instead of being misinterpreted as an unpassed parameter."""
        return value if value is not _not_passed else fallback_value

    def where(
        self: QueryType,
        field_path: Optional[str] = None,
        op_string: Optional[str] = None,
        value=None,
        *,
        filter=None,
    ) -> QueryType:
        """Filter the query on a field.

        See :meth:`~google.cloud.firestore_v1.client.Client.field_path` for
        more information on **field paths**.

        Returns a new :class:`~google.cloud.firestore_v1.query.Query` that
        filters on a specific field path, according to an operation (e.g.
        ``==`` or "equals") and a particular value to be paired with that
        operation.

        Args:
            field_path (Optional[str]): A field path (``.``-delimited list of
                field names) for the field to filter on.
            op_string (Optional[str]): A comparison operation in the form of a string.
                Acceptable values are ``<``, ``<=``, ``==``, ``!=``, ``>=``, ``>``,
                ``in``, ``not-in``, ``array_contains`` and ``array_contains_any``.
            value (Any): The value to compare the field against in the filter.
                If ``value`` is :data:`None` or a NaN, then ``==`` is the only
                allowed operation.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A filtered query. Acts as a copy of the current query,
            modified with the newly added filter.

        Raises:
            ValueError: If
                * ``field_path`` is invalid.
                * If ``value`` is a NaN or :data:`None` and ``op_string`` is not ``==``.
                * FieldFilter was passed without using the filter keyword argument.
                * `And` or `Or` was passed without using the filter keyword argument .
                * Both the positional arguments and the keyword argument `filter` were passed.
        """

        if isinstance(field_path, FieldFilter):
            raise ValueError(
                "FieldFilter object must be passed using keyword argument 'filter'"
            )
        if isinstance(field_path, BaseCompositeFilter):
            raise ValueError(
                "'Or' and 'And' objects must be passed using keyword argument 'filter'"
            )

        field_path_module.split_field_path(field_path)
        new_filters = self._field_filters

        if field_path is not None and op_string is not None:
            if filter is not None:
                raise ValueError(
                    "Can't pass in both the positional arguments and 'filter' at the same time"
                )
            warnings.warn(
                "Detected filter using positional arguments. Prefer using the 'filter' keyword argument instead.",
                UserWarning,
                stacklevel=2,
            )
            op = _validate_opation(op_string, value)
            if isinstance(op, StructuredQuery.UnaryFilter.Operator):
                filter_pb = query.StructuredQuery.UnaryFilter(
                    field=query.StructuredQuery.FieldReference(field_path=field_path),
                    op=op,
                )
            else:
                filter_pb = query.StructuredQuery.FieldFilter(
                    field=query.StructuredQuery.FieldReference(field_path=field_path),
                    op=_enum_from_op_string(op_string),
                    value=_helpers.encode_value(value),
                )

            new_filters += (filter_pb,)
        elif isinstance(filter, BaseFilter):
            new_filters += (filter._to_pb(),)
        else:
            raise ValueError(
                "Filter must be provided through positional arguments or the 'filter' keyword argument."
            )
        return self._copy(field_filters=new_filters)

    @staticmethod
    def _make_order(field_path, direction) -> StructuredQuery.Order:
        """Helper for :meth:`order_by`."""
        return query.StructuredQuery.Order(
            field=query.StructuredQuery.FieldReference(field_path=field_path),
            direction=_enum_from_direction(direction),
        )

    def order_by(
        self: QueryType, field_path: str, direction: str = ASCENDING
    ) -> QueryType:
        """Modify the query to add an order clause on a specific field.

        See :meth:`~google.cloud.firestore_v1.client.Client.field_path` for
        more information on **field paths**.

        Successive :meth:`~google.cloud.firestore_v1.query.Query.order_by`
        calls will further refine the ordering of results returned by the query
        (i.e. the new "order by" fields will be added to existing ones).

        Args:
            field_path (str): A field path (``.``-delimited list of
                field names) on which to order the query results.
            direction (Optional[str]): The direction to order by. Must be one
                of :attr:`ASCENDING` or :attr:`DESCENDING`, defaults to
                :attr:`ASCENDING`.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            An ordered query. Acts as a copy of the current query, modified
            with the newly added "order by" constraint.

        Raises:
            ValueError: If ``field_path`` is invalid.
            ValueError: If ``direction`` is not one of :attr:`ASCENDING` or
                :attr:`DESCENDING`.
        """
        field_path_module.split_field_path(field_path)  # raises

        order_pb = self._make_order(field_path, direction)

        new_orders = self._orders + (order_pb,)
        return self._copy(orders=new_orders)

    def limit(self: QueryType, count: int) -> QueryType:
        """Limit a query to return at most `count` matching results.

        If the current query already has a `limit` set, this will override it.

        .. note::
           `limit` and `limit_to_last` are mutually exclusive.
           Setting `limit` will drop previously set `limit_to_last`.

        Args:
            count (int): Maximum number of documents to return that match
                the query.
        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A limited query. Acts as a copy of the current query, modified
            with the newly added "limit" filter.
        """
        return self._copy(limit=count, limit_to_last=False)

    def limit_to_last(self: QueryType, count: int) -> QueryType:
        """Limit a query to return the last `count` matching results.
        If the current query already has a `limit_to_last`
        set, this will override it.

        .. note::
           `limit` and `limit_to_last` are mutually exclusive.
           Setting `limit_to_last` will drop previously set `limit`.

        Args:
            count (int): Maximum number of documents to return that match
                the query.
        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A limited query. Acts as a copy of the current query, modified
            with the newly added "limit" filter.
        """
        return self._copy(limit=count, limit_to_last=True)

    def _resolve_chunk_size(self, num_loaded: int, chunk_size: int) -> int:
        """Utility function for chunkify."""
        if self._limit is not None and (num_loaded + chunk_size) > self._limit:
            return max(self._limit - num_loaded, 0)
        return chunk_size

    def offset(self: QueryType, num_to_skip: int) -> QueryType:
        """Skip to an offset in a query.

        If the current query already has specified an offset, this will
        overwrite it.

        Args:
            num_to_skip (int): The number of results to skip at the beginning
                of query results. (Must be non-negative.)

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            An offset query. Acts as a copy of the current query, modified
            with the newly added "offset" field.
        """
        return self._copy(offset=num_to_skip)

    def _check_snapshot(self, document_snapshot) -> None:
        """Validate local snapshots for non-collection-group queries.

        Raises:
            ValueError: for non-collection-group queries, if the snapshot
                is from a different collection.
        """
        if self._all_descendants:
            return

        if document_snapshot.reference._path[:-1] != self._parent._path:
            raise ValueError("Cannot use snapshot from another collection as a cursor.")

    def _cursor_helper(
        self: QueryType,
        document_fields_or_snapshot: Union[DocumentSnapshot, dict, list, tuple, None],
        before: bool,
        start: bool,
    ) -> QueryType:
        """Set values to be used for a ``start_at`` or ``end_at`` cursor.

        The values will later be used in a query protobuf.

        When the query is sent to the server, the ``document_fields_or_snapshot`` will
        be used in the order given by fields set by
        :meth:`~google.cloud.firestore_v1.query.Query.order_by`.

        Args:
            document_fields_or_snapshot
                (Union[:class:`~google.cloud.firestore_v1.document.DocumentSnapshot`, dict, list, tuple]):
                a document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.
            before (bool): Flag indicating if the document in
                ``document_fields_or_snapshot`` should (:data:`False`) or
                shouldn't (:data:`True`) be included in the result set.
            start (Optional[bool]): determines if the cursor is a ``start_at``
                cursor (:data:`True`) or an ``end_at`` cursor (:data:`False`).

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor. Acts as a copy of the current query, modified
            with the newly added "start at" cursor.
        """
        if isinstance(document_fields_or_snapshot, tuple):
            document_fields_or_snapshot = list(document_fields_or_snapshot)
        elif isinstance(document_fields_or_snapshot, document.DocumentSnapshot):
            self._check_snapshot(document_fields_or_snapshot)
        else:
            # NOTE: We copy so that the caller can't modify after calling.
            document_fields_or_snapshot = copy.deepcopy(document_fields_or_snapshot)

        cursor_pair = document_fields_or_snapshot, before
        query_kwargs = {
            "projection": self._projection,
            "field_filters": self._field_filters,
            "orders": self._orders,
            "limit": self._limit,
            "offset": self._offset,
            "all_descendants": self._all_descendants,
        }
        if start:
            query_kwargs["start_at"] = cursor_pair
            query_kwargs["end_at"] = self._end_at
        else:
            query_kwargs["start_at"] = self._start_at
            query_kwargs["end_at"] = cursor_pair

        return self._copy(**query_kwargs)

    def start_at(
        self: QueryType,
        document_fields_or_snapshot: Union[DocumentSnapshot, dict, list, tuple, None],
    ) -> QueryType:
        """Start query results at a particular document value.

        The result set will **include** the document specified by
        ``document_fields_or_snapshot``.

        If the current query already has specified a start cursor -- either
        via this method or
        :meth:`~google.cloud.firestore_v1.query.Query.start_after` -- this
        will overwrite it.

        When the query is sent to the server, the ``document_fields`` will
        be used in the order given by fields set by
        :meth:`~google.cloud.firestore_v1.query.Query.order_by`.

        Args:
            document_fields_or_snapshot
                (Union[:class:`~google.cloud.firestore_v1.document.DocumentSnapshot`, dict, list, tuple]):
                a document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor. Acts as
            a copy of the current query, modified with the newly added
            "start at" cursor.
        """
        return self._cursor_helper(document_fields_or_snapshot, before=True, start=True)

    def start_after(
        self: QueryType,
        document_fields_or_snapshot: Union[DocumentSnapshot, dict, list, tuple, None],
    ) -> QueryType:
        """Start query results after a particular document value.

        The result set will **exclude** the document specified by
        ``document_fields_or_snapshot``.

        If the current query already has specified a start cursor -- either
        via this method or
        :meth:`~google.cloud.firestore_v1.query.Query.start_at` -- this will
        overwrite it.

        When the query is sent to the server, the ``document_fields_or_snapshot`` will
        be used in the order given by fields set by
        :meth:`~google.cloud.firestore_v1.query.Query.order_by`.

        Args:
            document_fields_or_snapshot
                (Union[:class:`~google.cloud.firestore_v1.document.DocumentSnapshot`, dict, list, tuple]):
                a document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor. Acts as a copy of the current query, modified
            with the newly added "start after" cursor.
        """
        return self._cursor_helper(
            document_fields_or_snapshot, before=False, start=True
        )

    def end_before(
        self: QueryType,
        document_fields_or_snapshot: Union[DocumentSnapshot, dict, list, tuple, None],
    ) -> QueryType:
        """End query results before a particular document value.

        The result set will **exclude** the document specified by
        ``document_fields_or_snapshot``.

        If the current query already has specified an end cursor -- either
        via this method or
        :meth:`~google.cloud.firestore_v1.query.Query.end_at` -- this will
        overwrite it.

        When the query is sent to the server, the ``document_fields_or_snapshot`` will
        be used in the order given by fields set by
        :meth:`~google.cloud.firestore_v1.query.Query.order_by`.

        Args:
            document_fields_or_snapshot
                (Union[:class:`~google.cloud.firestore_v1.document.DocumentSnapshot`, dict, list, tuple]):
                a document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor. Acts as a copy of the current query, modified
            with the newly added "end before" cursor.
        """
        return self._cursor_helper(
            document_fields_or_snapshot, before=True, start=False
        )

    def end_at(
        self: QueryType,
        document_fields_or_snapshot: Union[DocumentSnapshot, dict, list, tuple, None],
    ) -> QueryType:
        """End query results at a particular document value.

        The result set will **include** the document specified by
        ``document_fields_or_snapshot``.

        If the current query already has specified an end cursor -- either
        via this method or
        :meth:`~google.cloud.firestore_v1.query.Query.end_before` -- this will
        overwrite it.

        When the query is sent to the server, the ``document_fields_or_snapshot`` will
        be used in the order given by fields set by
        :meth:`~google.cloud.firestore_v1.query.Query.order_by`.

        Args:
            document_fields_or_snapshot
                (Union[:class:`~google.cloud.firestore_v1.document.DocumentSnapshot`, dict, list, tuple]):
                a document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor. Acts as a copy of the current query, modified
            with the newly added "end at" cursor.
        """
        return self._cursor_helper(
            document_fields_or_snapshot, before=False, start=False
        )

    def _filters_pb(self) -> Optional[StructuredQuery.Filter]:
        """Convert all the filters into a single generic Filter protobuf.

        This may be a lone field filter or unary filter, may be a composite
        filter or may be :data:`None`.

        Returns:
            :class:`google.cloud.firestore_v1.types.StructuredQuery.Filter`:
            A "generic" filter representing the current query's filters.
        """
        num_filters = len(self._field_filters)
        if num_filters == 0:
            return None
        elif num_filters == 1:
            filter = self._field_filters[0]
            if isinstance(filter, query.StructuredQuery.CompositeFilter):
                return query.StructuredQuery.Filter(composite_filter=filter)
            else:
                return _filter_pb(filter)
        else:
            composite_filter = query.StructuredQuery.CompositeFilter(
                op=StructuredQuery.CompositeFilter.Operator.AND,
            )
            for filter_ in self._field_filters:
                if isinstance(filter_, query.StructuredQuery.CompositeFilter):
                    composite_filter.filters.append(
                        query.StructuredQuery.Filter(composite_filter=filter_)
                    )
                else:
                    composite_filter.filters.append(_filter_pb(filter_))

            return query.StructuredQuery.Filter(composite_filter=composite_filter)

    @staticmethod
    def _normalize_projection(projection) -> StructuredQuery.Projection:
        """Helper:  convert field paths to message."""
        if projection is not None:
            fields = list(projection.fields)

            if not fields:
                field_ref = query.StructuredQuery.FieldReference(field_path="__name__")
                return query.StructuredQuery.Projection(fields=[field_ref])

        return projection

    def _normalize_orders(self) -> list:
        """Helper:  adjust orders based on cursors, where clauses."""
        orders = list(self._orders)
        _has_snapshot_cursor = False

        if self._start_at:
            if isinstance(self._start_at[0], document.DocumentSnapshot):
                _has_snapshot_cursor = True

        if self._end_at:
            if isinstance(self._end_at[0], document.DocumentSnapshot):
                _has_snapshot_cursor = True
        if _has_snapshot_cursor:
            # added orders should use direction of last order
            last_direction = orders[-1].direction if orders else BaseQuery.ASCENDING
            order_keys = [order.field.field_path for order in orders]
            for filter_ in self._field_filters:
                # FieldFilter.Operator should not compare equal to
                # UnaryFilter.Operator, but it does
                if isinstance(filter_.op, StructuredQuery.FieldFilter.Operator):
                    field = filter_.field.field_path
                    # skip equality filters and filters on fields already ordered
                    if filter_.op in _INEQUALITY_OPERATORS and field not in order_keys:
                        orders.append(self._make_order(field, last_direction))
            # add __name__ if not already in orders
            if "__name__" not in [order.field.field_path for order in orders]:
                orders.append(self._make_order("__name__", last_direction))

        return orders

    def _normalize_cursor(self, cursor, orders) -> Tuple[List, bool] | None:
        """Helper: convert cursor to a list of values based on orders."""
        if cursor is None:
            return None

        if not orders:
            raise ValueError(_NO_ORDERS_FOR_CURSOR)

        document_fields, before = cursor

        order_keys = [order.field.field_path for order in orders]

        if isinstance(document_fields, document.DocumentSnapshot):
            snapshot = document_fields
            document_fields = snapshot.to_dict()
            document_fields["__name__"] = snapshot.reference

        if isinstance(document_fields, dict):
            # Transform to list using orders
            values = []
            data = document_fields

            # It isn't required that all order by have a cursor.
            # However, we need to be sure they are specified in order without gaps
            for order_key in order_keys[: len(data)]:
                try:
                    if order_key in data:
                        values.append(data[order_key])
                    else:
                        values.append(
                            field_path_module.get_nested_value(order_key, data)
                        )
                except KeyError:
                    msg = _MISSING_ORDER_BY.format(order_key, data)
                    raise ValueError(msg)

            document_fields = values

        if document_fields and len(document_fields) > len(orders):
            msg = _MISMATCH_CURSOR_W_ORDER_BY.format(document_fields, order_keys)
            raise ValueError(msg)

        _transform_bases = (transforms.Sentinel, transforms._ValueList)

        for index, key_field in enumerate(zip(order_keys, document_fields)):
            key, field = key_field

            if isinstance(field, _transform_bases):
                msg = _INVALID_CURSOR_TRANSFORM
                raise ValueError(msg)

            if key == "__name__" and isinstance(field, str):
                document_fields[index] = self._parent.document(field)

        return document_fields, before

    def _to_protobuf(self) -> StructuredQuery:
        """Convert the current query into the equivalent protobuf.

        Returns:
            :class:`google.cloud.firestore_v1.types.StructuredQuery`:
            The query protobuf.
        """
        projection = self._normalize_projection(self._projection)
        orders = self._normalize_orders()
        start_at = self._normalize_cursor(self._start_at, orders)
        end_at = self._normalize_cursor(self._end_at, orders)

        query_kwargs = {
            "select": projection,
            "from_": [
                query.StructuredQuery.CollectionSelector(
                    collection_id=self._parent.id, all_descendants=self._all_descendants
                )
            ],
            "where": self._filters_pb(),
            "order_by": orders,
            "start_at": _cursor_pb(start_at),
            "end_at": _cursor_pb(end_at),
        }
        if self._offset is not None:
            query_kwargs["offset"] = self._offset
        if self._limit is not None:
            query_kwargs["limit"] = wrappers_pb2.Int32Value(value=self._limit)
        return query.StructuredQuery(**query_kwargs)

    def find_nearest(
        self,
        vector_field: str,
        query_vector: Union[Vector, Sequence[float]],
        limit: int,
        distance_measure: DistanceMeasure,
        *,
        distance_result_field: Optional[str] = None,
        distance_threshold: Optional[float] = None,
    ):
        raise NotImplementedError

    def count(
        self, alias: str | None = None
    ) -> Type["firestore_v1.base_aggregation.BaseAggregationQuery"]:
        raise NotImplementedError

    def sum(
        self, field_ref: str | FieldPath, alias: str | None = None
    ) -> Type["firestore_v1.base_aggregation.BaseAggregationQuery"]:
        raise NotImplementedError

    def avg(
        self, field_ref: str | FieldPath, alias: str | None = None
    ) -> Type["firestore_v1.base_aggregation.BaseAggregationQuery"]:
        raise NotImplementedError

    def get(
        self,
        transaction=None,
        retry: Optional[retries.Retry] = None,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> (
        QueryResultsList[DocumentSnapshot]
        | Coroutine[Any, Any, QueryResultsList[DocumentSnapshot]]
    ):
        raise NotImplementedError

    def _prep_stream(
        self,
        transaction=None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
        explain_options: Optional[ExplainOptions] = None,
    ) -> Tuple[dict, str, dict]:
        """Shared setup for async / sync :meth:`stream`"""
        if self._limit_to_last:
            raise ValueError(
                "Query results for queries that include limit_to_last() "
                "constraints cannot be streamed. Use Query.get() instead."
            )

        parent_path, expected_prefix = self._parent._parent_info()
        request = {
            "parent": parent_path,
            "structured_query": self._to_protobuf(),
            "transaction": _helpers.get_transaction_id(transaction),
        }
        if explain_options is not None:
            request["explain_options"] = explain_options._to_dict()
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, expected_prefix, kwargs

    def stream(
        self,
        transaction=None,
        retry: Optional[retries.Retry] = None,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> (
        StreamGenerator[document.DocumentSnapshot]
        | AsyncStreamGenerator[DocumentSnapshot]
    ):
        raise NotImplementedError

    def on_snapshot(self, callback):
        raise NotImplementedError

    def recursive(self: QueryType) -> QueryType:
        """Returns a copy of this query whose iterator will yield all matching
        documents as well as each of their descendent subcollections and documents.

        This differs from the `all_descendents` flag, which only returns descendents
        whose subcollection names match the parent collection's name. To return
        all descendents, regardless of their subcollection name, use this.
        """
        copied = self._copy(recursive=True, all_descendants=True)
        if copied._parent and copied._parent.id:
            original_collection_id = "/".join(copied._parent._path)

            # Reset the parent to nothing so we can recurse through the entire
            # database. This is required to have
            # `CollectionSelector.collection_id` not override
            # `CollectionSelector.all_descendants`, which happens if both are
            # set.
            copied._parent = copied._get_collection_reference_class()("")
            copied._parent._client = self._parent._client

            # But wait! We don't want to load the entire database; only the
            # collection the user originally specified. To accomplish that, we
            # add the following arcane filters.

            REFERENCE_NAME_MIN_ID = "__id-9223372036854775808__"
            start_at = f"{original_collection_id}/{REFERENCE_NAME_MIN_ID}"

            # The backend interprets this null character is flipping the filter
            # to mean the end of the range instead of the beginning.
            nullChar = "\0"
            end_at = f"{original_collection_id}{nullChar}/{REFERENCE_NAME_MIN_ID}"

            copied = (
                copied.order_by(field_path_module.FieldPath.document_id())
                .start_at({field_path_module.FieldPath.document_id(): start_at})
                .end_at({field_path_module.FieldPath.document_id(): end_at})
            )

        return copied

    def _comparator(self, doc1, doc2) -> int:
        _orders = self._orders

        # Add implicit sorting by name, using the last specified direction.
        if len(_orders) == 0:
            lastDirection = BaseQuery.ASCENDING
        else:
            if _orders[-1].direction == 1:
                lastDirection = BaseQuery.ASCENDING
            else:
                lastDirection = BaseQuery.DESCENDING

        orderBys = list(_orders)

        order_pb = query.StructuredQuery.Order(
            field=query.StructuredQuery.FieldReference(field_path="id"),
            direction=_enum_from_direction(lastDirection),
        )
        orderBys.append(order_pb)

        for orderBy in orderBys:
            if orderBy.field.field_path == "id":
                # If ordering by document id, compare resource paths.
                comp = Order()._compare_to(doc1.reference._path, doc2.reference._path)
            else:
                if (
                    orderBy.field.field_path not in doc1._data
                    or orderBy.field.field_path not in doc2._data
                ):
                    raise ValueError(
                        "Can only compare fields that exist in the "
                        "DocumentSnapshot. Please include the fields you are "
                        "ordering on in your select() call."
                    )
                v1 = doc1._data[orderBy.field.field_path]
                v2 = doc2._data[orderBy.field.field_path]
                encoded_v1 = _helpers.encode_value(v1)
                encoded_v2 = _helpers.encode_value(v2)
                comp = Order().compare(encoded_v1, encoded_v2)

            if comp != 0:
                # 1 == Ascending, -1 == Descending
                return orderBy.direction * comp

        return 0

    @staticmethod
    def _get_collection_reference_class():
        raise NotImplementedError


def _enum_from_op_string(op_string: str) -> int:
    """Convert a string representation of a binary operator to an enum.

    These enums come from the protobuf message definition
    ``StructuredQuery.FieldFilter.Operator``.

    Args:
        op_string (str): A comparison operation in the form of a string.
            Acceptable values are ``<``, ``<=``, ``==``, ``!=``, ``>=``
            and ``>``.

    Returns:
        int: The enum corresponding to ``op_string``.

    Raises:
        ValueError: If ``op_string`` is not a valid operator.
    """
    try:
        return _COMPARISON_OPERATORS[op_string]
    except KeyError:
        choices = ", ".join(sorted(_COMPARISON_OPERATORS.keys()))
        msg = _BAD_OP_STRING.format(op_string, choices)
        raise ValueError(msg)


def _isnan(value) -> bool:
    """Check if a value is NaN.

    This differs from ``math.isnan`` in that **any** input type is
    allowed.

    Args:
        value (Any): A value to check for NaN-ness.

    Returns:
        bool: Indicates if the value is the NaN float.
    """
    if isinstance(value, float):
        return math.isnan(value)
    else:
        return False


def _enum_from_direction(direction: str) -> int:
    """Convert a string representation of a direction to an enum.

    Args:
        direction (str): A direction to order by. Must be one of
            :attr:`~google.cloud.firestore.BaseQuery.ASCENDING` or
            :attr:`~google.cloud.firestore.BaseQuery.DESCENDING`.

    Returns:
        int: The enum corresponding to ``direction``.

    Raises:
        ValueError: If ``direction`` is not a valid direction.
    """
    if isinstance(direction, int):
        return direction

    if direction == BaseQuery.ASCENDING:
        return StructuredQuery.Direction.ASCENDING
    elif direction == BaseQuery.DESCENDING:
        return StructuredQuery.Direction.DESCENDING
    else:
        msg = _BAD_DIR_STRING.format(
            direction, BaseQuery.ASCENDING, BaseQuery.DESCENDING
        )
        raise ValueError(msg)


def _filter_pb(field_or_unary) -> StructuredQuery.Filter:
    """Convert a specific protobuf filter to the generic filter type.

    Args:
        field_or_unary (Union[google.cloud.firestore_v1.\
            query.StructuredQuery.FieldFilter, google.cloud.\
            firestore_v1.query.StructuredQuery.FieldFilter]): A
            field or unary filter to convert to a generic filter.

    Returns:
        google.cloud.firestore_v1.types.\
        StructuredQuery.Filter: A "generic" filter.

    Raises:
        ValueError: If ``field_or_unary`` is not a field or unary filter.
    """
    if isinstance(field_or_unary, query.StructuredQuery.FieldFilter):
        return query.StructuredQuery.Filter(field_filter=field_or_unary)
    elif isinstance(field_or_unary, query.StructuredQuery.UnaryFilter):
        return query.StructuredQuery.Filter(unary_filter=field_or_unary)
    else:
        raise ValueError("Unexpected filter type", type(field_or_unary), field_or_unary)


def _cursor_pb(cursor_pair: Optional[Tuple[list, bool]]) -> Optional[Cursor]:
    """Convert a cursor pair to a protobuf.

    If ``cursor_pair`` is :data:`None`, just returns :data:`None`.

    Args:
        cursor_pair (Optional[Tuple[list, bool]]): Two-tuple of

            * a list of field values.
            * a ``before`` flag

    Returns:
        Optional[google.cloud.firestore_v1.types.Cursor]: A
        protobuf cursor corresponding to the values.
    """
    if cursor_pair is not None:
        data, before = cursor_pair
        value_pbs = [_helpers.encode_value(value) for value in data]
        return query.Cursor(values=value_pbs, before=before)
    else:
        return None


def _query_response_to_snapshot(
    response_pb: RunQueryResponse, collection, expected_prefix: str
) -> Optional[document.DocumentSnapshot]:
    """Parse a query response protobuf to a document snapshot.

    Args:
        response_pb (google.cloud.firestore_v1.\
            firestore.RunQueryResponse): A
        collection (:class:`~google.cloud.firestore_v1.collection.CollectionReference`):
            A reference to the collection that initiated the query.
        expected_prefix (str): The expected prefix for fully-qualified
            document names returned in the query results. This can be computed
            directly from ``collection`` via :meth:`_parent_info`.

    Returns:
        Optional[:class:`~google.cloud.firestore.document.DocumentSnapshot`]:
        A snapshot of the data returned in the query. If
        ``response_pb.document`` is not set, the snapshot will be :data:`None`.
    """
    if not response_pb._pb.HasField("document"):
        return None

    document_id = _helpers.get_doc_id(response_pb.document, expected_prefix)
    reference = collection.document(document_id)
    data = _helpers.decode_dict(response_pb.document.fields, collection._client)
    snapshot = document.DocumentSnapshot(
        reference,
        data,
        exists=True,
        read_time=response_pb.read_time,
        create_time=response_pb.document.create_time,
        update_time=response_pb.document.update_time,
    )
    return snapshot


def _collection_group_query_response_to_snapshot(
    response_pb: RunQueryResponse, collection
) -> Optional[document.DocumentSnapshot]:
    """Parse a query response protobuf to a document snapshot.

    Args:
        response_pb (google.cloud.firestore_v1.\
            firestore.RunQueryResponse): A
        collection (:class:`~google.cloud.firestore_v1.collection.CollectionReference`):
            A reference to the collection that initiated the query.

    Returns:
        Optional[:class:`~google.cloud.firestore.document.DocumentSnapshot`]:
        A snapshot of the data returned in the query. If
        ``response_pb.document`` is not set, the snapshot will be :data:`None`.
    """
    if not response_pb._pb.HasField("document"):
        return None
    reference = collection._client.document(response_pb.document.name)
    data = _helpers.decode_dict(response_pb.document.fields, collection._client)
    snapshot = document.DocumentSnapshot(
        reference,
        data,
        exists=True,
        read_time=response_pb._pb.read_time,
        create_time=response_pb._pb.document.create_time,
        update_time=response_pb._pb.document.update_time,
    )
    return snapshot


class BaseCollectionGroup(BaseQuery):
    """Represents a Collection Group in the Firestore API.

    This is a specialization of :class:`.Query` that includes all documents in the
    database that are contained in a collection or subcollection of the given
    parent.

    Args:
        parent (:class:`~google.cloud.firestore_v1.collection.CollectionReference`):
            The collection that this query applies to.
    """

    _PARTITION_QUERY_ORDER = (
        BaseQuery._make_order(
            field_path_module.FieldPath.document_id(),
            BaseQuery.ASCENDING,
        ),
    )

    def __init__(
        self,
        parent,
        projection=None,
        field_filters=(),
        orders=(),
        limit=None,
        limit_to_last=False,
        offset=None,
        start_at=None,
        end_at=None,
        all_descendants=True,
        recursive=False,
    ) -> None:
        if not all_descendants:
            raise ValueError("all_descendants must be True for collection group query.")

        super(BaseCollectionGroup, self).__init__(
            parent=parent,
            projection=projection,
            field_filters=field_filters,
            orders=orders,
            limit=limit,
            limit_to_last=limit_to_last,
            offset=offset,
            start_at=start_at,
            end_at=end_at,
            all_descendants=all_descendants,
            recursive=recursive,
        )

    def _validate_partition_query(self):
        if self._field_filters:
            raise ValueError("Can't partition query with filters.")

        if self._projection:
            raise ValueError("Can't partition query with projection.")

        if self._limit:
            raise ValueError("Can't partition query with limit.")

        if self._offset:
            raise ValueError("Can't partition query with offset.")

    def _get_query_class(self):
        raise NotImplementedError

    def _prep_get_partitions(
        self,
        partition_count,
        retry: retries.Retry | object | None = None,
        timeout: float | None = None,
    ) -> Tuple[dict, dict]:
        self._validate_partition_query()
        parent_path, expected_prefix = self._parent._parent_info()
        klass = self._get_query_class()
        query = klass(
            self._parent,
            orders=self._PARTITION_QUERY_ORDER,
            start_at=self._start_at,
            end_at=self._end_at,
            all_descendants=self._all_descendants,
        )
        request = {
            "parent": parent_path,
            "structured_query": query._to_protobuf(),
            "partition_count": partition_count,
        }
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, kwargs

    def get_partitions(
        self,
        partition_count,
        retry: Optional[retries.Retry] = None,
        timeout: Optional[float] = None,
    ):
        raise NotImplementedError


class QueryPartition:
    """Represents a bounded partition of a collection group query.

    Contains cursors that can be used in a query as a starting and/or end point for the
    collection group query. The cursors may only be used in a query that matches the
    constraints of the query that produced this partition.

    Args:
        query (BaseQuery): The original query that this is a partition of.
        start_at (Optional[~google.cloud.firestore_v1.document.DocumentSnapshot]):
            Cursor for first query result to include. If `None`, the partition starts at
            the beginning of the result set.
        end_at (Optional[~google.cloud.firestore_v1.document.DocumentSnapshot]):
            Cursor for first query result after the last result included in the
            partition. If `None`, the partition runs to the end of the result set.

    """

    def __init__(self, query, start_at, end_at):
        self._query = query
        self._start_at = start_at
        self._end_at = end_at

    @property
    def start_at(self):
        return self._start_at

    @property
    def end_at(self):
        return self._end_at

    def query(self):
        """Generate a new query using this partition's bounds.

        Returns:
            BaseQuery: Copy of the original query with start and end bounds set by the
                cursors from this partition.
        """
        query = self._query
        start_at = ([self.start_at], True) if self.start_at else None
        end_at = ([self.end_at], True) if self.end_at else None

        return type(query)(
            query._parent,
            all_descendants=query._all_descendants,
            orders=query._PARTITION_QUERY_ORDER,
            start_at=start_at,
            end_at=end_at,
        )
