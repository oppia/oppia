# Copyright 2020 Google LLC All rights reserved.
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
import datetime
import logging
from typing import AsyncGenerator, Iterable

from google.api_core import gapic_v1
from google.api_core import retry_async as retries
from google.cloud._helpers import _datetime_to_pb_timestamp  # type: ignore
from google.protobuf.timestamp_pb2 import Timestamp

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.base_document import (
    BaseDocumentReference,
    DocumentSnapshot,
    _first_write_result,
)
from google.cloud.firestore_v1.types import write

logger = logging.getLogger(__name__)


class AsyncDocumentReference(BaseDocumentReference):
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

    def __init__(self, *path, **kwargs) -> None:
        super(AsyncDocumentReference, self).__init__(*path, **kwargs)

    async def create(
        self,
        document_data: dict,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> write.WriteResult:
        """Create the current document in the Firestore database.

        Args:
            document_data (dict): Property names and values to use for
                creating a document.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            :class:`~google.cloud.firestore_v1.types.WriteResult`:
                The write result corresponding to the committed document.
                A write result contains an ``update_time`` field.

        Raises:
            :class:`google.cloud.exceptions.Conflict`:
                If the document already exists.
        """
        batch, kwargs = self._prep_create(document_data, retry, timeout)
        write_results = await batch.commit(**kwargs)
        return _first_write_result(write_results)

    async def set(
        self,
        document_data: dict,
        merge: bool = False,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> write.WriteResult:
        """Replace the current document in the Firestore database.

        A write ``option`` can be specified to indicate preconditions of
        the "set" operation. If no ``option`` is specified and this document
        doesn't exist yet, this method will create it.

        Overwrites all content for the document with the fields in
        ``document_data``. This method performs almost the same functionality
        as :meth:`create`. The only difference is that this method doesn't
        make any requirements on the existence of the document (unless
        ``option`` is used), whereas as :meth:`create` will fail if the
        document already exists.

        Args:
            document_data (dict): Property names and values to use for
                replacing a document.
            merge (Optional[bool] or Optional[List<apispec>]):
                If True, apply merging instead of overwriting the state
                of the document.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            :class:`~google.cloud.firestore_v1.types.WriteResult`:
            The write result corresponding to the committed document. A write
            result contains an ``update_time`` field.
        """
        batch, kwargs = self._prep_set(document_data, merge, retry, timeout)
        write_results = await batch.commit(**kwargs)
        return _first_write_result(write_results)

    async def update(
        self,
        field_updates: dict,
        option: _helpers.WriteOption | None = None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> write.WriteResult:
        """Update an existing document in the Firestore database.

        By default, this method verifies that the document exists on the
        server before making updates. A write ``option`` can be specified to
        override these preconditions.

        Each key in ``field_updates`` can either be a field name or a
        **field path** (For more information on **field paths**, see
        :meth:`~google.cloud.firestore_v1.client.Client.field_path`.) To
        illustrate this, consider a document with

        .. code-block:: python

           >>> snapshot = await document.get()
           >>> snapshot.to_dict()
           {
               'foo': {
                   'bar': 'baz',
               },
               'other': True,
           }

        stored on the server. If the field name is used in the update:

        .. code-block:: python

           >>> field_updates = {
           ...     'foo': {
           ...         'quux': 800,
           ...     },
           ... }
           >>> await document.update(field_updates)

        then all of ``foo`` will be overwritten on the server and the new
        value will be

        .. code-block:: python

           >>> snapshot = await document.get()
           >>> snapshot.to_dict()
           {
               'foo': {
                   'quux': 800,
               },
               'other': True,
           }

        On the other hand, if a ``.``-delimited **field path** is used in the
        update:

        .. code-block:: python

           >>> field_updates = {
           ...     'foo.quux': 800,
           ... }
           >>> await document.update(field_updates)

        then only ``foo.quux`` will be updated on the server and the
        field ``foo.bar`` will remain intact:

        .. code-block:: python

           >>> snapshot = await document.get()
           >>> snapshot.to_dict()
           {
               'foo': {
                   'bar': 'baz',
                   'quux': 800,
               },
               'other': True,
           }

        .. warning::

           A **field path** can only be used as a top-level key in
           ``field_updates``.

        To delete / remove a field from an existing document, use the
        :attr:`~google.cloud.firestore_v1.transforms.DELETE_FIELD` sentinel.
        So with the example above, sending

        .. code-block:: python

           >>> field_updates = {
           ...     'other': firestore.DELETE_FIELD,
           ... }
           >>> await document.update(field_updates)

        would update the value on the server to:

        .. code-block:: python

           >>> snapshot = await document.get()
           >>> snapshot.to_dict()
           {
               'foo': {
                   'bar': 'baz',
               },
           }

        To set a field to the current time on the server when the
        update is received, use the
        :attr:`~google.cloud.firestore_v1.transforms.SERVER_TIMESTAMP`
        sentinel.
        Sending

        .. code-block:: python

           >>> field_updates = {
           ...     'foo.now': firestore.SERVER_TIMESTAMP,
           ... }
           >>> await document.update(field_updates)

        would update the value on the server to:

        .. code-block:: python

           >>> snapshot = await document.get()
           >>> snapshot.to_dict()
           {
               'foo': {
                   'bar': 'baz',
                   'now': datetime.datetime(2012, ...),
               },
               'other': True,
           }

        Args:
            field_updates (dict): Field names or paths to update and values
                to update with.
            option (Optional[:class:`~google.cloud.firestore_v1.client.WriteOption`]):
                A write option to make assertions / preconditions on the server
                state of the document before applying changes.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            :class:`~google.cloud.firestore_v1.types.WriteResult`:
            The write result corresponding to the updated document. A write
            result contains an ``update_time`` field.

        Raises:
            :class:`google.cloud.exceptions.NotFound`:
                If the document does not exist.
        """
        batch, kwargs = self._prep_update(field_updates, option, retry, timeout)
        write_results = await batch.commit(**kwargs)
        return _first_write_result(write_results)

    async def delete(
        self,
        option: _helpers.WriteOption | None = None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> Timestamp:
        """Delete the current document in the Firestore database.

        Args:
            option (Optional[:class:`~google.cloud.firestore_v1.client.WriteOption`]):
                A write option to make assertions / preconditions on the server
                state of the document before applying changes.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            :class:`google.protobuf.timestamp_pb2.Timestamp`:
            The time that the delete request was received by the server.
            If the document did not exist when the delete was sent (i.e.
            nothing was deleted), this method will still succeed and will
            still return the time that the request was received by the server.
        """
        request, kwargs = self._prep_delete(option, retry, timeout)

        commit_response = await self._client._firestore_api.commit(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

        return commit_response.commit_time

    async def get(
        self,
        field_paths: Iterable[str] | None = None,
        transaction=None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> DocumentSnapshot:
        """Retrieve a snapshot of the current document.

        See :meth:`~google.cloud.firestore_v1.base_client.BaseClient.field_path` for
        more information on **field paths**.

        If a ``transaction`` is used and it already has write operations
        added, this method cannot be used (i.e. read-after-write is not
        allowed).

        Args:
            field_paths (Optional[Iterable[str, ...]]): An iterable of field
                paths (``.``-delimited list of field names) to use as a
                projection of document fields in the returned results. If
                no value is provided, all fields will be returned.
            transaction (Optional[:class:`~google.cloud.firestore_v1.async_transaction.AsyncTransaction`]):
                An existing transaction that this reference
                will be retrieved in.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            :class:`~google.cloud.firestore_v1.base_document.DocumentSnapshot`:
                A snapshot of the current document. If the document does not
                exist at the time of the snapshot is taken, the snapshot's
                :attr:`reference`, :attr:`data`, :attr:`update_time`, and
                :attr:`create_time` attributes will all be ``None`` and
                its :attr:`exists` attribute will be ``False``.
        """
        from google.cloud.firestore_v1.base_client import _parse_batch_get

        request, kwargs = self._prep_batch_get(field_paths, transaction, retry, timeout)

        response_iter = await self._client._firestore_api.batch_get_documents(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

        async for resp in response_iter:
            # Immediate return as the iterator should only ever have one item.
            return _parse_batch_get(
                get_doc_response=resp,
                reference_map={self._document_path: self},
                client=self._client,
            )

        logger.warning(
            "`batch_get_documents` unexpectedly returned empty "
            "stream. Expected one object.",
        )

        return DocumentSnapshot(
            self,
            None,
            exists=False,
            read_time=_datetime_to_pb_timestamp(datetime.datetime.now()),
            create_time=None,
            update_time=None,
        )

    async def collections(
        self,
        page_size: int | None = None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> AsyncGenerator:
        """List subcollections of the current document.

        Args:
            page_size (Optional[int]]): The maximum number of collections
                in each page of results from this request. Non-positive values
                are ignored. Defaults to a sensible value set by the API.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            Sequence[:class:`~google.cloud.firestore_v1.async_collection.AsyncCollectionReference`]:
                iterator of subcollections of the current document. If the
                document does not exist at the time of `snapshot`, the
                iterator will be empty
        """
        request, kwargs = self._prep_collections(page_size, retry, timeout)

        iterator = await self._client._firestore_api.list_collection_ids(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

        async for collection_id in iterator:
            yield self.collection(collection_id)
