# Copyright 2024 Google LLC All rights reserved.
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

from __future__ import annotations

from typing import TYPE_CHECKING, Any, AsyncGenerator, Optional, TypeVar, Union

from google.api_core import gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1.async_stream_generator import AsyncStreamGenerator
from google.cloud.firestore_v1.base_query import (
    BaseQuery,
    _collection_group_query_response_to_snapshot,
    _query_response_to_snapshot,
)
from google.cloud.firestore_v1.base_vector_query import BaseVectorQuery
from google.cloud.firestore_v1.query_results import QueryResultsList

# Types needed only for Type Hints
if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.base_document import DocumentSnapshot
    from google.cloud.firestore_v1.query_profile import ExplainMetrics, ExplainOptions
    from google.cloud.firestore_v1 import transaction
    import google.cloud.firestore_v1.types.query_profile as query_profile_pb

TAsyncVectorQuery = TypeVar("TAsyncVectorQuery", bound="AsyncVectorQuery")


class AsyncVectorQuery(BaseVectorQuery):
    """Represents an async vector query to the Firestore API."""

    def __init__(
        self,
        nested_query: Union[BaseQuery, TAsyncVectorQuery],
    ) -> None:
        """Presents the vector query.
        Args:
            nested_query (BaseQuery | VectorQuery): the base query to apply as the prefilter.
        """
        super(AsyncVectorQuery, self).__init__(nested_query)

    async def get(
        self,
        transaction=None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> QueryResultsList[DocumentSnapshot]:
        """Runs the vector query.

        This sends a ``RunQuery`` RPC and returns a list of document messages.

        Args:
            transaction
                (Optional[:class:`~google.cloud.firestore_v1.transaction.Transaction`]):
                An existing transaction that this query will run in.
                If a ``transaction`` is used and it already has write operations
                added, this method cannot be used (i.e. read-after-write is not
                allowed).
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.
            explain_options
                (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
                Options to enable query profiling for this query. When set,
                explain_metrics will be available on the returned generator.

        Returns:
            QueryResultsList[DocumentSnapshot]: The documents in the collection
            that match this query.
        """
        explain_metrics: ExplainMetrics | None = None

        stream_result = self.stream(
            transaction=transaction,
            retry=retry,
            timeout=timeout,
            explain_options=explain_options,
        )
        try:
            result = [snapshot async for snapshot in stream_result]

            if explain_options is None:
                explain_metrics = None
            else:
                explain_metrics = await stream_result.get_explain_metrics()
        finally:
            await stream_result.aclose()

        return QueryResultsList(result, explain_options, explain_metrics)

    async def _make_stream(
        self,
        transaction: Optional[transaction.Transaction] = None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        explain_options: Optional[ExplainOptions] = None,
    ) -> AsyncGenerator[DocumentSnapshot | query_profile_pb.ExplainMetrics, Any]:
        """Internal method for stream(). Read the documents in the collection
        that match this query.

        This sends a ``RunQuery`` RPC and then returns a generator which
        consumes each document returned in the stream of ``RunQueryResponse``
        messages.

        If a ``transaction`` is used and it already has write operations
        added, this method cannot be used (i.e. read-after-write is not
        allowed).

        Args:
            transaction (Optional[:class:`~google.cloud.firestore_v1.transaction.\
                Transaction`]):
                An existing transaction that the query will run in.
            retry (Optional[google.api_core.retry.Retry]): Designation of what
                errors, if any, should be retried.  Defaults to a
                system-specified policy.
            timeout (Optional[float]): The timeout for this request. Defaults
                to a system-specified value.
            explain_options
                (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
                Options to enable query profiling for this query. When set,
                explain_metrics will be available on the returned generator.

        Yields:
            [:class:`~google.cloud.firestore_v1.base_document.DocumentSnapshot` \
                | google.cloud.firestore_v1.types.query_profile.ExplainMetrtics]:
            The next document that fulfills the query. Query results will be
            yielded as `DocumentSnapshot`. When the result contains returned
            explain metrics, yield `query_profile_pb.ExplainMetrics` individually.
        """
        request, expected_prefix, kwargs = self._prep_stream(
            transaction,
            retry,
            timeout,
            explain_options,
        )

        response_iterator = await self._client._firestore_api.run_query(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )
        async for response in response_iterator:
            if self._nested_query._all_descendants:
                snapshot = _collection_group_query_response_to_snapshot(
                    response, self._nested_query._parent
                )
            else:
                snapshot = _query_response_to_snapshot(
                    response, self._nested_query._parent, expected_prefix
                )
            if snapshot is not None:
                yield snapshot

            if response.explain_metrics:
                metrics = response.explain_metrics
                yield metrics

    def stream(
        self,
        transaction=None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> AsyncStreamGenerator[DocumentSnapshot]:
        """Reads the documents in the collection that match this query.

        This sends a ``RunQuery`` RPC and then returns an iterator which
        consumes each document returned in the stream of ``RunQueryResponse``
        messages.

        If a ``transaction`` is used and it already has write operations
        added, this method cannot be used (i.e. read-after-write is not
        allowed).

        Args:
            transaction
                (Optional[:class:`~google.cloud.firestore_v1.transaction.Transaction`]):
                An existing transaction that this query will run in.
            retry (google.api_core.retry.Retry): Designation of what errors, if any,
                should be retried.  Defaults to a system-specified policy.
            timeout (float): The timeout for this request.  Defaults to a
                system-specified value.
            explain_options
                (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
                Options to enable query profiling for this query. When set,
                explain_metrics will be available on the returned generator.

        Returns:
            `AsyncStreamGenerator[DocumentSnapshot]`:
            An asynchronous generator of the queryresults.
        """

        inner_generator = self._make_stream(
            transaction=transaction,
            retry=retry,
            timeout=timeout,
            explain_options=explain_options,
        )
        return AsyncStreamGenerator(inner_generator, explain_options)
