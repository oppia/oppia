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

"""Client for interacting with the Google Cloud Firestore API.

This is the base from which all interactions with the API occur.

In the hierarchy of API concepts

* a :class:`~google.cloud.firestore_v1.client.Client` owns a
  :class:`~google.cloud.firestore_v1.collection.CollectionReference`
* a :class:`~google.cloud.firestore_v1.client.Client` owns a
  :class:`~google.cloud.firestore_v1.document.DocumentReference`
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, Generator, Iterable, List, Optional, Union

from google.api_core import gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1.base_client import (
    _CLIENT_INFO,
    BaseClient,
    _parse_batch_get,
    _path_helper,
)

# Types needed only for Type Hints
from google.cloud.firestore_v1.base_document import DocumentSnapshot
from google.cloud.firestore_v1.batch import WriteBatch
from google.cloud.firestore_v1.collection import CollectionReference
from google.cloud.firestore_v1.document import DocumentReference
from google.cloud.firestore_v1.field_path import FieldPath
from google.cloud.firestore_v1.query import CollectionGroup
from google.cloud.firestore_v1.services.firestore import client as firestore_client
from google.cloud.firestore_v1.services.firestore.transports import (
    grpc as firestore_grpc_transport,
)
from google.cloud.firestore_v1.transaction import Transaction

if TYPE_CHECKING:
    from google.cloud.firestore_v1.bulk_writer import BulkWriter  # pragma: NO COVER


class Client(BaseClient):
    """Client for interacting with Google Cloud Firestore API.

    .. note::

        Since the Cloud Firestore API requires the gRPC transport, no
        ``_http`` argument is accepted by this class.

    Args:
        project (Optional[str]): The project which the client acts on behalf
            of. If not passed, falls back to the default inferred
            from the environment.
        credentials (Optional[~google.auth.credentials.Credentials]): The
            OAuth2 Credentials to use for this client. If not passed, falls
            back to the default inferred from the environment.
        database (Optional[str]): The database name that the client targets.
            If not passed, falls back to :attr:`DEFAULT_DATABASE`.
        client_info (Optional[google.api_core.gapic_v1.client_info.ClientInfo]):
            The client info used to send a user-agent string along with API
            requests. If ``None``, then default info will be used. Generally,
            you only need to set this if you're developing your own library
            or partner tool.
        client_options (Union[dict, google.api_core.client_options.ClientOptions]):
            Client options used to set user options on the client. API Endpoint
            should be set through client_options.
    """

    def __init__(
        self,
        project=None,
        credentials=None,
        database=None,
        client_info=_CLIENT_INFO,
        client_options=None,
    ) -> None:
        super(Client, self).__init__(
            project=project,
            credentials=credentials,
            database=database,
            client_info=client_info,
            client_options=client_options,
        )

    @property
    def _firestore_api(self):
        """Lazy-loading getter GAPIC Firestore API.
        Returns:
            :class:`~google.cloud.gapic.firestore.v1`.firestore_client.FirestoreClient:
            The GAPIC client with the credentials of the current client.
        """
        return self._firestore_api_helper(
            firestore_grpc_transport.FirestoreGrpcTransport,
            firestore_client.FirestoreClient,
            firestore_client,
        )

    def collection(self, *collection_path: str) -> CollectionReference:
        """Get a reference to a collection.

        For a top-level collection:

        .. code-block:: python

            >>> client.collection('top')

        For a sub-collection:

        .. code-block:: python

            >>> client.collection('mydocs/doc/subcol')
            >>> # is the same as
            >>> client.collection('mydocs', 'doc', 'subcol')

        Sub-collections can be nested deeper in a similar fashion.

        Args:
            collection_path: Can either be

                * A single ``/``-delimited path to a collection
                * A tuple of collection path segments

        Returns:
            :class:`~google.cloud.firestore_v1.collection.CollectionReference`:
            A reference to a collection in the Firestore database.
        """
        return CollectionReference(*_path_helper(collection_path), client=self)

    def collection_group(self, collection_id: str) -> CollectionGroup:
        """
        Creates and returns a new Query that includes all documents in the
        database that are contained in a collection or subcollection with the
        given collection_id.

        .. code-block:: python

            >>> query = client.collection_group('mygroup')

        Args:
            collection_id (str) Identifies the collections to query over.

                Every collection or subcollection with this ID as the last segment of its
                path will be included. Cannot contain a slash.

        Returns:
            :class:`~google.cloud.firestore_v1.query.CollectionGroup`:
            The created Query.
        """
        return CollectionGroup(self._get_collection_reference(collection_id))

    def document(self, *document_path: str) -> DocumentReference:
        """Get a reference to a document in a collection.

        For a top-level document:

        .. code-block:: python

            >>> client.document('collek/shun')
            >>> # is the same as
            >>> client.document('collek', 'shun')

        For a document in a sub-collection:

        .. code-block:: python

            >>> client.document('mydocs/doc/subcol/child')
            >>> # is the same as
            >>> client.document('mydocs', 'doc', 'subcol', 'child')

        Documents in sub-collections can be nested deeper in a similar fashion.

        Args:
            document_path): Can either be

                * A single ``/``-delimited path to a document
                * A tuple of document path segments

        Returns:
            :class:`~google.cloud.firestore_v1.document.DocumentReference`:
            A reference to a document in a collection.
        """
        return DocumentReference(
            *self._document_path_helper(*document_path), client=self
        )

    def get_all(
        self,
        references: list,
        field_paths: Iterable[str] | None = None,
        transaction: Transaction | None = None,
        retry: retries.Retry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> Generator[DocumentSnapshot, Any, None]:
        """Retrieve a batch of documents.

        .. note::

           Documents returned by this method are not guaranteed to be
           returned in the same order that they are given in ``references``.

        .. note::

           If multiple ``references`` refer to the same document, the server
           will only return one result.

        See :meth:`~google.cloud.firestore_v1.client.Client.field_path` for
        more information on **field paths**.

        If a ``transaction`` is used and it already has write operations
        added, this method cannot be used (i.e. read-after-write is not
        allowed).

        Args:
            references (List[.DocumentReference, ...]): Iterable of document
                references to be retrieved.
            field_paths (Optional[Iterable[str, ...]]): An iterable of field
                paths (``.``-delimited list of field names) to use as a
                projection of document fields in the returned results. If
                no value is provided, all fields will be returned.
            transaction (Optional[:class:`~google.cloud.firestore_v1.transaction.Transaction`]):
                An existing transaction that these ``references`` will be
                retrieved in.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Yields:
            .DocumentSnapshot: The next document snapshot that fulfills the
            query, or :data:`None` if the document does not exist.
        """
        request, reference_map, kwargs = self._prep_get_all(
            references, field_paths, transaction, retry, timeout
        )

        response_iterator = self._firestore_api.batch_get_documents(
            request=request,
            metadata=self._rpc_metadata,
            **kwargs,
        )

        for get_doc_response in response_iterator:
            yield _parse_batch_get(get_doc_response, reference_map, self)

    def collections(
        self,
        retry: retries.Retry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> Generator[Any, Any, None]:
        """List top-level collections of the client's database.

        Args:
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            Sequence[:class:`~google.cloud.firestore_v1.collection.CollectionReference`]:
                iterator of subcollections of the current document.
        """
        request, kwargs = self._prep_collections(retry, timeout)

        iterator = self._firestore_api.list_collection_ids(
            request=request,
            metadata=self._rpc_metadata,
            **kwargs,
        )

        for collection_id in iterator:
            yield self.collection(collection_id)

    def recursive_delete(
        self,
        reference: Union[CollectionReference, DocumentReference],
        *,
        bulk_writer: Optional["BulkWriter"] = None,
        chunk_size: int = 5000,
    ) -> int:
        """Deletes documents and their subcollections, regardless of collection
        name.

        Passing a CollectionReference leads to each document in the collection
        getting deleted, as well as all of their descendents.

        Passing a DocumentReference deletes that one document and all of its
        descendents.

        Args:
            reference (Union[
                :class:`@google.cloud.firestore_v1.collection.CollectionReference`,
                :class:`@google.cloud.firestore_v1.document.DocumentReference`,
            ])
                The reference to be deleted.

            bulk_writer (Optional[:class:`@google.cloud.firestore_v1.bulk_writer.BulkWriter`])
                The BulkWriter used to delete all matching documents. Supply this
                if you want to override the default throttling behavior.

        """
        if bulk_writer is None:
            bulk_writer = self.bulk_writer()

        return self._recursive_delete(
            reference,
            bulk_writer,
            chunk_size=chunk_size,
        )

    def _recursive_delete(
        self,
        reference: Union[CollectionReference, DocumentReference],
        bulk_writer: "BulkWriter",
        *,
        chunk_size: int = 5000,
        depth: int = 0,
    ) -> int:
        """Recursion helper for `recursive_delete."""

        num_deleted: int = 0

        if isinstance(reference, CollectionReference):
            chunk: List[DocumentSnapshot]
            for chunk in (
                reference.recursive()
                .select([FieldPath.document_id()])
                ._chunkify(chunk_size)
            ):
                doc_snap: DocumentSnapshot
                for doc_snap in chunk:
                    num_deleted += 1
                    bulk_writer.delete(doc_snap.reference)

        elif isinstance(reference, DocumentReference):
            col_ref: CollectionReference
            for col_ref in reference.collections():
                num_deleted += self._recursive_delete(
                    col_ref,
                    bulk_writer,
                    chunk_size=chunk_size,
                    depth=depth + 1,
                )
            num_deleted += 1
            bulk_writer.delete(reference)

        else:
            raise TypeError(
                f"Unexpected type for reference: {reference.__class__.__name__}"
            )

        if depth == 0:
            bulk_writer.close()

        return num_deleted

    def batch(self) -> WriteBatch:
        """Get a batch instance from this client.

        Returns:
            :class:`~google.cloud.firestore_v1.batch.WriteBatch`:
            A "write" batch to be used for accumulating document changes and
            sending the changes all at once.
        """
        return WriteBatch(self)

    def transaction(self, **kwargs) -> Transaction:
        """Get a transaction that uses this client.

        See :class:`~google.cloud.firestore_v1.transaction.Transaction` for
        more information on transactions and the constructor arguments.

        Args:
            kwargs (Dict[str, Any]): The keyword arguments (other than
                ``client``) to pass along to the
                :class:`~google.cloud.firestore_v1.transaction.Transaction`
                constructor.

        Returns:
            :class:`~google.cloud.firestore_v1.transaction.Transaction`:
            A transaction attached to this client.
        """
        return Transaction(self, **kwargs)
