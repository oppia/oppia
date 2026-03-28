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

"""Classes for representing documents for the Google Cloud Firestore API."""
from __future__ import annotations

import copy
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Iterable,
    Optional,
    Tuple,
    Union,
    Awaitable,
)

from google.api_core import retry as retries

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1 import field_path as field_path_module
from google.cloud.firestore_v1.types import common

# Types needed only for Type Hints
if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.types import Document, firestore, write


class BaseDocumentReference(object):
    """A reference to a document in a Firestore database.

    The document may already exist or can be created by this class.

    Args:
        path (Tuple[str, ...]): The components in the document path.
            This is a series of strings representing each collection and
            sub-collection ID, as well as the document IDs for any documents
            that contain a sub-collection (as well as the base document).
        kwargs (dict): The keyword arguments for the constructor. The only
            supported keyword is ``client`` and it must be a
            :class:`~google.cloud.firestore_v1.client.Client`. It represents
            the client that created this document reference.

    Raises:
        ValueError: if

            * the ``path`` is empty
            * there are an even number of elements
            * a collection ID in ``path`` is not a string
            * a document ID in ``path`` is not a string
        TypeError: If a keyword other than ``client`` is used.
    """

    _document_path_internal = None

    def __init__(self, *path, **kwargs) -> None:
        _helpers.verify_path(path, is_collection=False)
        self._path = path
        self._client = kwargs.pop("client", None)
        if kwargs:
            raise TypeError(
                "Received unexpected arguments", kwargs, "Only `client` is supported"
            )

    def __copy__(self):
        """Shallow copy the instance.

        We leave the client "as-is" but tuple-unpack the path.

        Returns:
            .DocumentReference: A copy of the current document.
        """
        result = self.__class__(*self._path, client=self._client)
        result._document_path_internal = self._document_path_internal
        return result

    def __deepcopy__(self, unused_memo):
        """Deep copy the instance.

        This isn't a true deep copy, wee leave the client "as-is" but
        tuple-unpack the path.

        Returns:
            .DocumentReference: A copy of the current document.
        """
        return self.__copy__()

    def __eq__(self, other):
        """Equality check against another instance.

        Args:
            other (Any): A value to compare against.

        Returns:
            Union[bool, NotImplementedType]: Indicating if the values are
            equal.
        """
        if isinstance(other, self.__class__):
            return self._client == other._client and self._path == other._path
        else:
            return NotImplemented

    def __hash__(self):
        return hash(self._path) + hash(self._client)

    def __ne__(self, other):
        """Inequality check against another instance.

        Args:
            other (Any): A value to compare against.

        Returns:
            Union[bool, NotImplementedType]: Indicating if the values are
            not equal.
        """
        if isinstance(other, self.__class__):
            return self._client != other._client or self._path != other._path
        else:
            return NotImplemented

    @property
    def path(self):
        """Database-relative for this document.

        Returns:
            str: The document's relative path.
        """
        return "/".join(self._path)

    @property
    def _document_path(self):
        """Create and cache the full path for this document.

        Of the form:

            ``projects/{project_id}/databases/{database_id}/...
                  documents/{document_path}``

        Returns:
            str: The full document path.

        Raises:
            ValueError: If the current document reference has no ``client``.
        """
        if self._document_path_internal is None:
            if self._client is None:
                raise ValueError("A document reference requires a `client`.")
            self._document_path_internal = _get_document_path(self._client, self._path)

        return self._document_path_internal

    @property
    def id(self):
        """The document identifier (within its collection).

        Returns:
            str: The last component of the path.
        """
        return self._path[-1]

    @property
    def parent(self):
        """Collection that owns the current document.

        Returns:
            :class:`~google.cloud.firestore_v1.collection.CollectionReference`:
            The parent collection.
        """
        parent_path = self._path[:-1]
        return self._client.collection(*parent_path)

    def collection(self, collection_id: str):
        """Create a sub-collection underneath the current document.

        Args:
            collection_id (str): The sub-collection identifier (sometimes
                referred to as the "kind").

        Returns:
            :class:`~google.cloud.firestore_v1.collection.CollectionReference`:
            The child collection.
        """
        child_path = self._path + (collection_id,)
        return self._client.collection(*child_path)

    def _prep_create(
        self,
        document_data: dict,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> Tuple[Any, dict]:
        batch = self._client.batch()
        batch.create(self, document_data)
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return batch, kwargs

    def create(
        self,
        document_data: dict,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> write.WriteResult | Awaitable[write.WriteResult]:
        raise NotImplementedError

    def _prep_set(
        self,
        document_data: dict,
        merge: bool = False,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> Tuple[Any, dict]:
        batch = self._client.batch()
        batch.set(self, document_data, merge=merge)
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return batch, kwargs

    def set(
        self,
        document_data: dict,
        merge: bool = False,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ):
        raise NotImplementedError

    def _prep_update(
        self,
        field_updates: dict,
        option: _helpers.WriteOption | None = None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> Tuple[Any, dict]:
        batch = self._client.batch()
        batch.update(self, field_updates, option=option)
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return batch, kwargs

    def update(
        self,
        field_updates: dict,
        option: _helpers.WriteOption | None = None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ):
        raise NotImplementedError

    def _prep_delete(
        self,
        option: _helpers.WriteOption | None = None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> Tuple[dict, dict]:
        """Shared setup for async/sync :meth:`delete`."""
        write_pb = _helpers.pb_for_delete(self._document_path, option)
        request = {
            "database": self._client._database_string,
            "writes": [write_pb],
            "transaction": None,
        }
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, kwargs

    def delete(
        self,
        option: _helpers.WriteOption | None = None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ):
        raise NotImplementedError

    def _prep_batch_get(
        self,
        field_paths: Iterable[str] | None = None,
        transaction=None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> Tuple[dict, dict]:
        """Shared setup for async/sync :meth:`get`."""
        if isinstance(field_paths, str):
            raise ValueError("'field_paths' must be a sequence of paths, not a string.")

        if field_paths is not None:
            mask = common.DocumentMask(field_paths=sorted(field_paths))
        else:
            mask = None

        request = {
            "database": self._client._database_string,
            "documents": [self._document_path],
            "mask": mask,
            "transaction": _helpers.get_transaction_id(transaction),
        }
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, kwargs

    def get(
        self,
        field_paths: Iterable[str] | None = None,
        transaction=None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> "DocumentSnapshot" | Awaitable["DocumentSnapshot"]:
        raise NotImplementedError

    def _prep_collections(
        self,
        page_size: int | None = None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ) -> Tuple[dict, dict]:
        """Shared setup for async/sync :meth:`collections`."""
        request = {"parent": self._document_path, "page_size": page_size}
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, kwargs

    def collections(
        self,
        page_size: int | None = None,
        retry: retries.Retry | retries.AsyncRetry | None | object = None,
        timeout: float | None = None,
    ):
        raise NotImplementedError

    def on_snapshot(self, callback):
        raise NotImplementedError


class DocumentSnapshot(object):
    """A snapshot of document data in a Firestore database.

    This represents data retrieved at a specific time and may not contain
    all fields stored for the document (i.e. a hand-picked selection of
    fields may have been retrieved).

    Instances of this class are not intended to be constructed by hand,
    rather they'll be returned as responses to various methods, such as
    :meth:`~google.cloud.DocumentReference.get`.

    Args:
        reference (:class:`~google.cloud.firestore_v1.document.DocumentReference`):
            A document reference corresponding to the document that contains
            the data in this snapshot.
        data (Dict[str, Any]):
            The data retrieved in the snapshot.
        exists (bool):
            Indicates if the document existed at the time the snapshot was
            retrieved.
        read_time (:class:`proto.datetime_helpers.DatetimeWithNanoseconds`):
            The time that this snapshot was read from the server.
        create_time (:class:`proto.datetime_helpers.DatetimeWithNanoseconds`):
            The time that this document was created.
        update_time (:class:`proto.datetime_helpers.DatetimeWithNanoseconds`):
            The time that this document was last updated.
    """

    def __init__(
        self, reference, data, exists, read_time, create_time, update_time
    ) -> None:
        self._reference = reference
        # We want immutable data, so callers can't modify this value
        # out from under us.
        self._data = copy.deepcopy(data)
        self._exists = exists
        self.read_time = read_time
        self.create_time = create_time
        self.update_time = update_time

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._reference == other._reference and self._data == other._data

    def __hash__(self):
        return hash(self._reference) + hash(self.update_time)

    @property
    def _client(self):
        """The client that owns the document reference for this snapshot.

        Returns:
            :class:`~google.cloud.firestore_v1.client.Client`:
            The client that owns this document.
        """
        return self._reference._client

    @property
    def exists(self):
        """Existence flag.

        Indicates if the document existed at the time this snapshot
        was retrieved.

        Returns:
            bool: The existence flag.
        """
        return self._exists

    @property
    def id(self):
        """The document identifier (within its collection).

        Returns:
            str: The last component of the path of the document.
        """
        return self._reference.id

    @property
    def reference(self):
        """Document reference corresponding to document that owns this data.

        Returns:
            :class:`~google.cloud.firestore_v1.document.DocumentReference`:
            A document reference corresponding to this document.
        """
        return self._reference

    def get(self, field_path: str) -> Any:
        """Get a value from the snapshot data.

        If the data is nested, for example:

        .. code-block:: python

           >>> snapshot.to_dict()
           {
               'top1': {
                   'middle2': {
                       'bottom3': 20,
                       'bottom4': 22,
                   },
                   'middle5': True,
               },
               'top6': b'\x00\x01 foo',
           }

        a **field path** can be used to access the nested data. For
        example:

        .. code-block:: python

           >>> snapshot.get('top1')
           {
               'middle2': {
                   'bottom3': 20,
                   'bottom4': 22,
               },
               'middle5': True,
           }
           >>> snapshot.get('top1.middle2')
           {
               'bottom3': 20,
               'bottom4': 22,
           }
           >>> snapshot.get('top1.middle2.bottom3')
           20

        See :meth:`~google.cloud.firestore_v1.client.Client.field_path` for
        more information on **field paths**.

        A copy is returned since the data may contain mutable values,
        but the data stored in the snapshot must remain immutable.

        Args:
            field_path (str): A field path (``.``-delimited list of
                field names).

        Returns:
            Any or None:
                (A copy of) the value stored for the ``field_path`` or
                None if snapshot document does not exist.

        Raises:
            KeyError: If the ``field_path`` does not match nested data
                in the snapshot.
        """
        if not self._exists:
            return None
        nested_data = field_path_module.get_nested_value(field_path, self._data)
        return copy.deepcopy(nested_data)

    def to_dict(self) -> Union[Dict[str, Any], None]:
        """Retrieve the data contained in this snapshot.

        A copy is returned since the data may contain mutable values,
        but the data stored in the snapshot must remain immutable.

        Returns:
            Dict[str, Any] or None:
                The data in the snapshot.  Returns None if reference
                does not exist.
        """
        if not self._exists:
            return None
        return copy.deepcopy(self._data)

    def _to_protobuf(self) -> Optional[Document]:
        return _helpers.document_snapshot_to_protobuf(self)


def _get_document_path(client, path: Tuple[str]) -> str:
    """Convert a path tuple into a full path string.

    Of the form:

        ``projects/{project_id}/databases/{database_id}/...
              documents/{document_path}``

    Args:
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            The client that holds configuration details and a GAPIC client
            object.
        path (Tuple[str, ...]): The components in a document path.

    Returns:
        str: The fully-qualified document path.
    """
    parts = (client._database_string, "documents") + path
    return _helpers.DOCUMENT_PATH_DELIMITER.join(parts)


def _consume_single_get(response_iterator) -> firestore.BatchGetDocumentsResponse:
    """Consume a gRPC stream that should contain a single response.

    The stream will correspond to a ``BatchGetDocuments`` request made
    for a single document.

    Args:
        response_iterator (~google.cloud.exceptions.GrpcRendezvous): A
            streaming iterator returned from a ``BatchGetDocuments``
            request.

    Returns:
        ~google.cloud.firestore_v1.\
            firestore.BatchGetDocumentsResponse: The single "get"
        response in the batch.

    Raises:
        ValueError: If anything other than exactly one response is returned.
    """
    # Calling ``list()`` consumes the entire iterator.
    all_responses = list(response_iterator)
    if len(all_responses) != 1:
        raise ValueError(
            "Unexpected response from `BatchGetDocumentsResponse`",
            all_responses,
            "Expected only one result",
        )

    return all_responses[0]


def _first_write_result(write_results: list) -> write.WriteResult:
    """Get first write result from list.

    For cases where ``len(write_results) > 1``, this assumes the writes
    occurred at the same time (e.g. if an update and transform are sent
    at the same time).

    Args:
        write_results (List[google.cloud.firestore_v1.\
            write.WriteResult, ...]: The write results from a
            ``CommitResponse``.

    Returns:
        google.cloud.firestore_v1.types.WriteResult: The
        lone write result from ``write_results``.

    Raises:
        ValueError: If there are zero write results. This is likely to
            **never** occur, since the backend should be stable.
    """
    if not write_results:
        raise ValueError("Expected at least one write result")

    return write_results[0]
