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

"""Classes for representing collections for the Google Cloud Firestore API."""
from __future__ import annotations

import random
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncGenerator,
    AsyncIterator,
    Coroutine,
    Generator,
    Generic,
    Iterable,
    Sequence,
    Tuple,
    Union,
    Optional,
)

from google.api_core import retry as retries

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.base_query import QueryType

if TYPE_CHECKING:  # pragma: NO COVER
    # Types needed only for Type Hints
    from google.cloud.firestore_v1.base_aggregation import BaseAggregationQuery
    from google.cloud.firestore_v1.base_document import DocumentSnapshot
    from google.cloud.firestore_v1.base_vector_query import (
        BaseVectorQuery,
        DistanceMeasure,
    )
    from google.cloud.firestore_v1.document import DocumentReference
    from google.cloud.firestore_v1.field_path import FieldPath
    from google.cloud.firestore_v1.query_profile import ExplainOptions
    from google.cloud.firestore_v1.query_results import QueryResultsList
    from google.cloud.firestore_v1.stream_generator import StreamGenerator
    from google.cloud.firestore_v1.transaction import Transaction
    from google.cloud.firestore_v1.vector import Vector
    from google.cloud.firestore_v1.vector_query import VectorQuery

_AUTO_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"


class BaseCollectionReference(Generic[QueryType]):
    """A reference to a collection in a Firestore database.

    The collection may already exist or this class can facilitate creation
    of documents within the collection.

    Args:
        path (Tuple[str, ...]): The components in the collection path.
            This is a series of strings representing each collection and
            sub-collection ID, as well as the document IDs for any documents
            that contain a sub-collection.
        kwargs (dict): The keyword arguments for the constructor. The only
            supported keyword is ``client`` and it must be a
            :class:`~google.cloud.firestore_v1.client.Client` if provided. It
            represents the client that created this collection reference.

    Raises:
        ValueError: if

            * the ``path`` is empty
            * there are an even number of elements
            * a collection ID in ``path`` is not a string
            * a document ID in ``path`` is not a string
        TypeError: If a keyword other than ``client`` is used.
    """

    def __init__(self, *path, **kwargs) -> None:
        _helpers.verify_path(path, is_collection=True)
        self._path = path
        self._client = kwargs.pop("client", None)
        if kwargs:
            raise TypeError(
                "Received unexpected arguments", kwargs, "Only `client` is supported"
            )

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._path == other._path and self._client == other._client

    @property
    def id(self):
        """The collection identifier.

        Returns:
            str: The last component of the path.
        """
        return self._path[-1]

    @property
    def parent(self):
        """Document that owns the current collection.

        Returns:
            Optional[:class:`~google.cloud.firestore_v1.document.DocumentReference`]:
            The parent document, if the current collection is not a
            top-level collection.
        """
        if len(self._path) == 1:
            return None
        else:
            parent_path = self._path[:-1]
        return self._client.document(*parent_path)

    def _query(self) -> QueryType:
        raise NotImplementedError

    def _aggregation_query(self) -> BaseAggregationQuery:
        raise NotImplementedError

    def _vector_query(self) -> BaseVectorQuery:
        raise NotImplementedError

    def document(self, document_id: Optional[str] = None) -> DocumentReference:
        """Create a sub-document underneath the current collection.

        Args:
            document_id (Optional[str]): The document identifier
                within the current collection. If not provided, will default
                to a random 20 character string composed of digits,
                uppercase and lowercase and letters.

        Returns:
            :class:`~google.cloud.firestore_v1.document.DocumentReference`:
            The child document.
        """
        if document_id is None:
            document_id = _auto_id()

        # Append `self._path` and the passed document's ID as long as the first
        # element in the path is not an empty string, which comes from setting the
        # parent to "" for recursive queries.
        child_path = self._path + (document_id,) if self._path[0] else (document_id,)
        return self._client.document(*child_path)

    def _parent_info(self) -> Tuple[Any, str]:
        """Get fully-qualified parent path and prefix for this collection.

        Returns:
            Tuple[str, str]: Pair of

            * the fully-qualified (with database and project) path to the
              parent of this collection (will either be the database path
              or a document path).
            * the prefix to a document in this collection.
        """
        parent_doc = self.parent
        if parent_doc is None:
            parent_path = _helpers.DOCUMENT_PATH_DELIMITER.join(
                (self._client._database_string, "documents")
            )
        else:
            parent_path = parent_doc._document_path

        expected_prefix = _helpers.DOCUMENT_PATH_DELIMITER.join((parent_path, self.id))
        return parent_path, expected_prefix

    def _prep_add(
        self,
        document_data: dict,
        document_id: Optional[str] = None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
    ) -> Tuple[DocumentReference, dict]:
        """Shared setup for async / sync :method:`add`"""
        if document_id is None:
            document_id = _auto_id()

        document_ref = self.document(document_id)
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return document_ref, kwargs

    def add(
        self,
        document_data: dict,
        document_id: Optional[str] = None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
    ) -> Union[Tuple[Any, Any], Coroutine[Any, Any, Tuple[Any, Any]]]:
        raise NotImplementedError

    def _prep_list_documents(
        self,
        page_size: Optional[int] = None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
    ) -> Tuple[dict, dict]:
        """Shared setup for async / sync :method:`list_documents`"""
        parent, _ = self._parent_info()
        request = {
            "parent": parent,
            "collection_id": self.id,
            "page_size": page_size,
            "show_missing": True,
            # list_documents returns an iterator of document references, which do not
            # include any fields. To save on data transfer, we can set a field_path mask
            # to include no fields
            "mask": {"field_paths": None},
        }
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, kwargs

    def list_documents(
        self,
        page_size: Optional[int] = None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
    ) -> Union[
        Generator[DocumentReference, Any, Any], AsyncGenerator[DocumentReference, Any]
    ]:
        raise NotImplementedError

    def recursive(self) -> QueryType:
        return self._query().recursive()

    def select(self, field_paths: Iterable[str]) -> QueryType:
        """Create a "select" query with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.select` for
        more information on this method.

        Args:
            field_paths (Iterable[str, ...]): An iterable of field paths
                (``.``-delimited list of field names) to use as a projection
                of document fields in the query results.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A "projected" query.
        """
        query = self._query()
        return query.select(field_paths)

    def where(
        self,
        field_path: Optional[str] = None,
        op_string: Optional[str] = None,
        value=None,
        *,
        filter=None,
    ) -> QueryType:
        """Create a "where" query with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.where` for
        more information on this method.

        Args:
            field_path (str): A field path (``.``-delimited list of
                field names) for the field to filter on. Optional.
            op_string (str): A comparison operation in the form of a string.
                Acceptable values are ``<``, ``<=``, ``==``, ``>=``, ``>``,
                and ``in``. Optional.
            value (Any): The value to compare the field against in the filter.
                If ``value`` is :data:`None` or a NaN, then ``==`` is the only
                allowed operation.  If ``op_string`` is ``in``, ``value``
                must be a sequence of values. Optional.
            filter (class:`~google.cloud.firestore_v1.base_query.BaseFilter`): an instance of a Filter.
                Either a FieldFilter or a CompositeFilter.
        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A filtered query.
        Raises:
            ValueError, if both the positional arguments (field_path, op_string, value)
                and the filter keyword argument are passed at the same time.
        """
        query = self._query()
        if field_path and op_string:
            if filter is not None:
                raise ValueError(
                    "Can't pass in both the positional arguments and 'filter' at the same time"
                )
            if field_path == "__name__" and op_string == "in":
                wrapped_names = []

                for name in value:
                    if isinstance(name, str):
                        name = self.document(name)

                    wrapped_names.append(name)

                value = wrapped_names
            return query.where(field_path, op_string, value)
        else:
            return query.where(filter=filter)

    def order_by(self, field_path: str, **kwargs) -> QueryType:
        """Create an "order by" query with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.order_by` for
        more information on this method.

        Args:
            field_path (str): A field path (``.``-delimited list of
                field names) on which to order the query results.
            kwargs (Dict[str, Any]): The keyword arguments to pass along
                to the query. The only supported keyword is ``direction``,
                see :meth:`~google.cloud.firestore_v1.query.Query.order_by`
                for more information.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            An "order by" query.
        """
        query = self._query()
        return query.order_by(field_path, **kwargs)

    def limit(self, count: int) -> QueryType:
        """Create a limited query with this collection as parent.

        .. note::
           `limit` and `limit_to_last` are mutually exclusive.
           Setting `limit` will drop previously set `limit_to_last`.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.limit` for
        more information on this method.

        Args:
            count (int): Maximum number of documents to return that match
                the query.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A limited query.
        """
        query = self._query()
        return query.limit(count)

    def limit_to_last(self, count: int):
        """Create a limited to last query with this collection as parent.

        .. note::
           `limit` and `limit_to_last` are mutually exclusive.
           Setting `limit_to_last` will drop previously set `limit`.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.limit_to_last`
        for more information on this method.

        Args:
            count (int): Maximum number of documents to return that
                match the query.
        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A limited to last query.
        """
        query = self._query()
        return query.limit_to_last(count)

    def offset(self, num_to_skip: int) -> QueryType:
        """Skip to an offset in a query with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.offset` for
        more information on this method.

        Args:
            num_to_skip (int): The number of results to skip at the beginning
                of query results. (Must be non-negative.)

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            An offset query.
        """
        query = self._query()
        return query.offset(num_to_skip)

    def start_at(
        self, document_fields: Union[DocumentSnapshot, dict, list, tuple]
    ) -> QueryType:
        """Start query at a cursor with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.start_at` for
        more information on this method.

        Args:
            document_fields (Union[:class:`~google.cloud.firestore_v1.\
                document.DocumentSnapshot`, dict, list, tuple]):
                A document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor.
        """
        query = self._query()
        return query.start_at(document_fields)

    def start_after(
        self, document_fields: Union[DocumentSnapshot, dict, list, tuple]
    ) -> QueryType:
        """Start query after a cursor with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.start_after` for
        more information on this method.

        Args:
            document_fields (Union[:class:`~google.cloud.firestore_v1.\
                document.DocumentSnapshot`, dict, list, tuple]):
                A document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor.
        """
        query = self._query()
        return query.start_after(document_fields)

    def end_before(
        self, document_fields: Union[DocumentSnapshot, dict, list, tuple]
    ) -> QueryType:
        """End query before a cursor with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.end_before` for
        more information on this method.

        Args:
            document_fields (Union[:class:`~google.cloud.firestore_v1.\
                document.DocumentSnapshot`, dict, list, tuple]):
                A document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor.
        """
        query = self._query()
        return query.end_before(document_fields)

    def end_at(
        self, document_fields: Union[DocumentSnapshot, dict, list, tuple]
    ) -> QueryType:
        """End query at a cursor with this collection as parent.

        See
        :meth:`~google.cloud.firestore_v1.query.Query.end_at` for
        more information on this method.

        Args:
            document_fields (Union[:class:`~google.cloud.firestore_v1.\
                document.DocumentSnapshot`, dict, list, tuple]):
                A document snapshot or a dictionary/list/tuple of fields
                representing a query results cursor. A cursor is a collection
                of values that represent a position in a query result set.

        Returns:
            :class:`~google.cloud.firestore_v1.query.Query`:
            A query with cursor.
        """
        query = self._query()
        return query.end_at(document_fields)

    def _prep_get_or_stream(
        self,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
    ) -> Tuple[Any, dict]:
        """Shared setup for async / sync :meth:`get` / :meth:`stream`"""
        query = self._query()
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return query, kwargs

    def get(
        self,
        transaction: Optional[Transaction] = None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> (
        QueryResultsList[DocumentSnapshot]
        | Coroutine[Any, Any, QueryResultsList[DocumentSnapshot]]
    ):
        raise NotImplementedError

    def stream(
        self,
        transaction: Optional[Transaction] = None,
        retry: retries.Retry | retries.AsyncRetry | object | None = None,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> StreamGenerator[DocumentSnapshot] | AsyncIterator[DocumentSnapshot]:
        raise NotImplementedError

    def on_snapshot(self, callback):
        raise NotImplementedError

    def count(self, alias=None):
        """
        Adds a count over the nested query.

        :type alias: str
        :param alias: (Optional) The alias for the count
        """
        return self._aggregation_query().count(alias=alias)

    def sum(self, field_ref: str | FieldPath, alias=None):
        """
        Adds a sum over the nested query.

        :type field_ref: Union[str, google.cloud.firestore_v1.field_path.FieldPath]
        :param field_ref: The field to aggregate across.

        :type alias: Optional[str]
        :param alias: Optional name of the field to store the result of the aggregation into.
            If not provided, Firestore will pick a default name following the format field_<incremental_id++>.

        """
        return self._aggregation_query().sum(field_ref, alias=alias)

    def avg(self, field_ref: str | FieldPath, alias=None):
        """
        Adds an avg over the nested query.

        :type field_ref: Union[str, google.cloud.firestore_v1.field_path.FieldPath]
        :param field_ref: The field to aggregate across.

        :type alias: Optional[str]
        :param alias: Optional name of the field to store the result of the aggregation into.
            If not provided, Firestore will pick a default name following the format field_<incremental_id++>.
        """
        return self._aggregation_query().avg(field_ref, alias=alias)

    def find_nearest(
        self,
        vector_field: str,
        query_vector: Union[Vector, Sequence[float]],
        limit: int,
        distance_measure: DistanceMeasure,
        *,
        distance_result_field: Optional[str] = None,
        distance_threshold: Optional[float] = None,
    ) -> VectorQuery:
        """
        Finds the closest vector embeddings to the given query vector.

        Args:
            vector_field (str): An indexed vector field to search upon. Only documents which contain
                vectors whose dimensionality match the query_vector can be returned.
            query_vector(Union[Vector, Sequence[float]]): The query vector that we are searching on. Must be a vector of no more
                than 2048 dimensions.
            limit (int): The number of nearest neighbors to return. Must be a positive integer of no more than 1000.
            distance_measure (:class:`DistanceMeasure`): The Distance Measure to use.
            distance_result_field (Optional[str]):
                Name of the field to output the result of the vector distance calculation
            distance_threshold (Optional[float]):
                A threshold for which no less similar documents will be returned.

        Returns:
            :class`~firestore_v1.vector_query.VectorQuery`: the vector query.
        """
        return self._vector_query().find_nearest(
            vector_field,
            query_vector,
            limit,
            distance_measure,
            distance_result_field=distance_result_field,
            distance_threshold=distance_threshold,
        )


def _auto_id() -> str:
    """Generate a "random" automatically generated ID.

    Returns:
        str: A 20 character string composed of digits, uppercase and
        lowercase and letters.
    """

    return "".join(random.choice(_AUTO_ID_CHARS) for _ in range(20))


def _item_to_document_ref(collection_reference, item) -> DocumentReference:
    """Convert Document resource to document ref.

    Args:
        collection_reference (google.api_core.page_iterator.GRPCIterator):
            iterator response
        item (dict): document resource
    """
    document_id = item.name.split(_helpers.DOCUMENT_PATH_DELIMITER)[-1]
    return collection_reference.document(document_id)
