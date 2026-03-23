# Copyright 2021 Google LLC All rights reserved.
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
from google.api_core import gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.base_batch import BaseBatch
from google.cloud.firestore_v1.types.firestore import BatchWriteResponse


class BulkWriteBatch(BaseBatch):
    """Accumulate write operations to be sent in a batch. Use this over
    `WriteBatch` for higher volumes (e.g., via `BulkWriter`) and when the order
    of operations within a given batch is unimportant.

    Because the order in which individual write operations are applied to the database
    is not guaranteed, `batch_write` RPCs can never contain multiple operations
    to the same document. If calling code detects a second write operation to a
    known document reference, it should first cut off the previous batch and
    send it, then create a new batch starting with the latest write operation.
    In practice, the [Async]BulkWriter classes handle this.

    This has the same set of methods for write operations that
    :class:`~google.cloud.firestore_v1.document.DocumentReference` does,
    e.g. :meth:`~google.cloud.firestore_v1.document.DocumentReference.create`.

    Args:
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            The client that created this batch.
    """

    def __init__(self, client) -> None:
        super(BulkWriteBatch, self).__init__(client=client)

    def commit(
        self,
        retry: retries.Retry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> BatchWriteResponse:
        """Writes the changes accumulated in this batch.

        Write operations are not guaranteed to be applied in order and must not
        contain multiple writes to any given document. Preferred over `commit`
        for performance reasons if these conditions are acceptable.

        Args:
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            :class:`google.cloud.firestore_v1.write.BatchWriteResponse`:
            Container holding the write results corresponding to the changes
            committed, returned in the same order as the changes were applied to
            this batch. An individual write result contains an ``update_time``
            field.
        """
        request, kwargs = self._prep_commit(retry, timeout)

        _api = self._client._firestore_api
        save_response: BatchWriteResponse = _api.batch_write(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

        self._write_pbs = []
        self.write_results = list(save_response.write_results)

        return save_response

    def _prep_commit(self, retry: retries.Retry | object | None, timeout: float | None):
        request = {
            "database": self._client._database_string,
            "writes": self._write_pbs,
            "labels": None,
        }
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)
        return request, kwargs
