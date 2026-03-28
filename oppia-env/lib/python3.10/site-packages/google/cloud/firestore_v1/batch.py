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

"""Helpers for batch requests to the Google Cloud Firestore API."""
from __future__ import annotations
from google.api_core import gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1.base_batch import BaseWriteBatch


class WriteBatch(BaseWriteBatch):
    """Accumulate write operations to be sent in a batch. Use this over
    `BulkWriteBatch` for lower volumes or when the order of operations
    within a given batch is important.

    This has the same set of methods for write operations that
    :class:`~google.cloud.firestore_v1.document.DocumentReference` does,
    e.g. :meth:`~google.cloud.firestore_v1.document.DocumentReference.create`.

    Args:
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            The client that created this batch.
    """

    def __init__(self, client) -> None:
        super(WriteBatch, self).__init__(client=client)

    def commit(
        self,
        retry: retries.Retry | object | None = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
    ) -> list:
        """Commit the changes accumulated in this batch.

        Args:
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.

        Returns:
            List[:class:`google.cloud.firestore_v1.write.WriteResult`, ...]:
            The write results corresponding to the changes committed, returned
            in the same order as the changes were applied to this batch. A
            write result contains an ``update_time`` field.
        """
        request, kwargs = self._prep_commit(retry, timeout)

        commit_response = self._client._firestore_api.commit(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

        self._write_pbs = []
        self.write_results = results = list(commit_response.write_results)
        self.commit_time = commit_response.commit_time

        return results

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type is None:
            self.commit()
