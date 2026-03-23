# Copyright 2023 Google LLC All rights reserved.
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

"""Classes for representing Async aggregation queries for the Google Cloud Firestore API.

A :class:`~google.cloud.firestore_v1.async_aggregation.AsyncAggregationQuery` can be created directly from
a :class:`~google.cloud.firestore_v1.async_collection.AsyncCollection` and that can be
a more common way to create an aggregation query than direct usage of the constructor.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, AsyncGenerator, List, Optional, Union

from google.api_core import gapic_v1
from google.api_core import retry_async as retries

from google.cloud.firestore_v1 import transaction
from google.cloud.firestore_v1.async_stream_generator import AsyncStreamGenerator
from google.cloud.firestore_v1.base_aggregation import (
    BaseAggregationQuery,
    _query_response_to_result,
)
from google.cloud.firestore_v1.query_results import QueryResultsList

if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.base_aggregation import AggregationResult
    from google.cloud.firestore_v1.query_profile import ExplainMetrics, ExplainOptions
    import google.cloud.firestore_v1.types.query_profile as query_profile_pb


class AsyncAggregationQuery(BaseAggregationQuery):
    """Represents an aggregation query to the Firestore API."""

    def __init__(
        self,
        nested_query,
    ) -> None:
        super(AsyncAggregationQuery, self).__init__(nested_query)

    async def get(
        self,
        transaction=None,
        retry: Union[retries.AsyncRetry, None, object] = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> QueryResultsList[List[AggregationResult]]:
        """Runs the aggregation query.

        This sends a ``RunAggregationQuery`` RPC and returns a list of aggregation results in the stream of ``RunAggregationQueryResponse`` messages.

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
            QueryResultsList[List[AggregationResult]]: The aggregation query results.

        """
        explain_metrics: ExplainMetrics | None = None

        stream_result = self.stream(
            transaction=transaction,
            retry=retry,
            timeout=timeout,
            explain_options=explain_options,
        )
        try:
            result = [aggregation async for aggregation in stream_result]

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
    ) -> AsyncGenerator[List[AggregationResult] | query_profile_pb.ExplainMetrics, Any]:
        """Internal method for stream(). Runs the aggregation query.

        This sends a ``RunAggregationQuery`` RPC and then returns a generator which
        consumes each document returned in the stream of ``RunAggregationQueryResponse``
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
            List[AggregationResult] | query_profile_pb.ExplainMetrics:
            The result of aggregations of this query. Query results will be
            yielded as `List[AggregationResult]`. When the result contains
            returned explain metrics, yield `query_profile_pb.ExplainMetrics`
            individually.
        """
        request, kwargs = self._prep_stream(
            transaction,
            retry,
            timeout,
            explain_options,
        )

        response_iterator = await self._client._firestore_api.run_aggregation_query(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

        async for response in response_iterator:
            result = _query_response_to_result(response)
            if result:
                yield result

            if response.explain_metrics:
                metrics = response.explain_metrics
                yield metrics

    def stream(
        self,
        transaction: Optional[transaction.Transaction] = None,
        retry: retries.AsyncRetry | object | None = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> AsyncStreamGenerator[List[AggregationResult]]:
        """Runs the aggregation query.

        This sends a ``RunAggregationQuery`` RPC and then returns a generator
        which consumes each document returned in the stream of
        ``RunAggregationQueryResponse`` messages.

        If a ``transaction`` is used and it already has write operations added,
        this method cannot be used (i.e. read-after-write is not allowed).

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

        Returns:
            `AsyncStreamGenerator[List[AggregationResult]]`:
                A generator of the query results.
        """

        inner_generator = self._make_stream(
            transaction=transaction,
            retry=retry,
            timeout=timeout,
            explain_options=explain_options,
        )
        return AsyncStreamGenerator(inner_generator, explain_options)
