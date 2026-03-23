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

"""Helpers for batch requests to the Google Cloud Firestore API."""
from __future__ import annotations
import abc
from typing import Dict, Union

# Types needed only for Type Hints
from google.api_core import retry as retries

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.base_document import BaseDocumentReference
from google.cloud.firestore_v1.types import write as write_pb


class BaseBatch(metaclass=abc.ABCMeta):
    """Accumulate write operations to be sent in a batch.

    This has the same set of methods for write operations that
    :class:`~google.cloud.firestore_v1.document.DocumentReference` does,
    e.g. :meth:`~google.cloud.firestore_v1.document.DocumentReference.create`.

    Args:
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            The client that created this batch.
    """

    def __init__(self, client) -> None:
        self._client = client
        self._write_pbs: list[write_pb.Write] = []
        self._document_references: Dict[str, BaseDocumentReference] = {}
        self.write_results: list[write_pb.WriteResult] | None = None
        self.commit_time = None

    def __len__(self):
        return len(self._document_references)

    def __contains__(self, reference: BaseDocumentReference):
        return reference._document_path in self._document_references

    def _add_write_pbs(self, write_pbs: list[write_pb.Write]) -> None:
        """Add `Write`` protobufs to this transaction.

        This method intended to be over-ridden by subclasses.

        Args:
            write_pbs (List[google.cloud.firestore_v1.\
                write_pb2.Write]): A list of write protobufs to be added.
        """
        self._write_pbs.extend(write_pbs)

    @abc.abstractmethod
    def commit(self):
        """Sends all accumulated write operations to the server. The details of this
        write depend on the implementing class."""
        raise NotImplementedError()

    def create(self, reference: BaseDocumentReference, document_data: dict) -> None:
        """Add a "change" to this batch to create a document.

        If the document given by ``reference`` already exists, then this
        batch will fail when :meth:`commit`-ed.

        Args:
            reference (:class:`~google.cloud.firestore_v1.document.DocumentReference`):
                A document reference to be created in this batch.
            document_data (dict): Property names and values to use for
                creating a document.
        """
        write_pbs = _helpers.pbs_for_create(reference._document_path, document_data)
        self._document_references[reference._document_path] = reference
        self._add_write_pbs(write_pbs)

    def set(
        self,
        reference: BaseDocumentReference,
        document_data: dict,
        merge: Union[bool, list] = False,
    ) -> None:
        """Add a "change" to replace a document.

        See
        :meth:`google.cloud.firestore_v1.document.DocumentReference.set` for
        more information on how ``option`` determines how the change is
        applied.

        Args:
            reference (:class:`~google.cloud.firestore_v1.document.DocumentReference`):
                A document reference that will have values set in this batch.
            document_data (dict):
                Property names and values to use for replacing a document.
            merge (Optional[bool] or Optional[List<apispec>]):
                If True, apply merging instead of overwriting the state
                of the document.
        """
        if merge is not False:
            write_pbs = _helpers.pbs_for_set_with_merge(
                reference._document_path, document_data, merge
            )
        else:
            write_pbs = _helpers.pbs_for_set_no_merge(
                reference._document_path, document_data
            )

        self._document_references[reference._document_path] = reference
        self._add_write_pbs(write_pbs)

    def update(
        self,
        reference: BaseDocumentReference,
        field_updates: dict,
        option: _helpers.WriteOption | None = None,
    ) -> None:
        """Add a "change" to update a document.

        See
        :meth:`google.cloud.firestore_v1.document.DocumentReference.update`
        for more information on ``field_updates`` and ``option``.

        Args:
            reference (:class:`~google.cloud.firestore_v1.document.DocumentReference`):
                A document reference that will be updated in this batch.
            field_updates (dict):
                Field names or paths to update and values to update with.
            option (Optional[:class:`~google.cloud.firestore_v1.client.WriteOption`]):
                A write option to make assertions / preconditions on the server
                state of the document before applying changes.
        """
        if option.__class__.__name__ == "ExistsOption":
            raise ValueError("you must not pass an explicit write option to " "update.")
        write_pbs = _helpers.pbs_for_update(
            reference._document_path, field_updates, option
        )
        self._document_references[reference._document_path] = reference
        self._add_write_pbs(write_pbs)

    def delete(
        self,
        reference: BaseDocumentReference,
        option: _helpers.WriteOption | None = None,
    ) -> None:
        """Add a "change" to delete a document.

        See
        :meth:`google.cloud.firestore_v1.document.DocumentReference.delete`
        for more information on how ``option`` determines how the change is
        applied.

        Args:
            reference (:class:`~google.cloud.firestore_v1.document.DocumentReference`):
                A document reference that will be deleted in this batch.
            option (Optional[:class:`~google.cloud.firestore_v1.client.WriteOption`]):
                A write option to make assertions / preconditions on the server
                state of the document before applying changes.
        """
        write_pb = _helpers.pb_for_delete(reference._document_path, option)
        self._document_references[reference._document_path] = reference
        self._add_write_pbs([write_pb])


class BaseWriteBatch(BaseBatch):
    """Base class for a/sync implementations of the `commit` RPC. `commit` is useful
    for lower volumes or when the order of write operations is important."""

    def _prep_commit(
        self,
        retry: retries.Retry | retries.AsyncRetry | object | None,
        timeout: float | None,
    ):
        """Shared setup for async/sync :meth:`commit`."""
        request = {
            "database": self._client._database_string,
            "writes": self._write_pbs,
            "transaction": None,
        }
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)
        return request, kwargs
