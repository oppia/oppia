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

"""Classes for representing aggregation queries for the Google Cloud Firestore API.

A :class:`~google.cloud.firestore_v1.aggregation.AggregationQuery` can be created directly from
a :class:`~google.cloud.firestore_v1.collection.Collection` and that can be
a more common way to create an aggregation query than direct usage of the constructor.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, Generator, List, Optional, Union

from google.api_core import exceptions, gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1.base_aggregation import (
    AggregationResult,
    BaseAggregationQuery,
    _query_response_to_result,
)
from google.cloud.firestore_v1.query_results import QueryResultsList
from google.cloud.firestore_v1.stream_generator import StreamGenerator

# Types needed only for Type Hints
if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1 import transaction
    from google.cloud.firestore_v1.query_profile import ExplainMetrics
    from google.cloud.firestore_v1.query_profile import ExplainOptions


class AggregationQuery(BaseAggregationQuery):
    """Represents an aggregation query to the Firestore API."""

    def __init__(
        self,
        nested_query,
    ) -> None:
        super(AggregationQuery, self).__init__(nested_query)

    def get(
        self,
        transaction=None,
        retry: Union[retries.Retry, None, object] = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> QueryResultsList[AggregationResult]:
        """Runs the aggregation query.

        This sends a ``RunAggregationQuery`` RPC and returns a list of
        aggregation results in the stream of ``RunAggregationQueryResponse``
        messages.

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
            QueryResultsList[AggregationResult]: The aggregation query results.

        """
        explain_metrics: ExplainMetrics | None = None

        result = self.stream(
            transaction=transaction,
            retry=retry,
            timeout=timeout,
            explain_options=explain_options,
        )
        result_list = list(result)

        if explain_options is None:
            explain_metrics = None
        else:
            explain_metrics = result.get_explain_metrics()

        return QueryResultsList(result_list, explain_options, explain_metrics)

    def _get_stream_iterator(self, transaction, retry, timeout, explain_options=None):
        """Helper method for :meth:`stream`."""
        request, kwargs = self._prep_stream(
            transaction,
            retry,
            timeout,
            explain_options,
        )

        return self._client._firestore_api.run_aggregation_query(
            request=request,
            metadata=self._client._rpc_metadata,
            **kwargs,
        )

    def _retry_query_after_exception(self, exc, retry, transaction):
        """Helper method for :meth:`stream`."""
        if transaction is None:  # no snapshot-based retry inside transaction
            if retry is gapic_v1.method.DEFAULT:
                transport = self._client._firestore_api._transport
                gapic_callable = transport.run_aggregation_query
                retry = gapic_callable._retry
            return retry._predicate(exc)

        return False

    def _make_stream(
        self,
        transaction: Optional[transaction.Transaction] = None,
        retry: Union[retries.Retry, None, object] = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        explain_options: Optional[ExplainOptions] = None,
    ) -> Generator[List[AggregationResult], Any, Optional[ExplainMetrics]]:
        """Internal method for stream(). Runs the aggregation query.

        This sends a ``RunAggregationQuery`` RPC and then returns a generator
        which consumes each document returned in the stream of
        ``RunAggregationQueryResponse`` messages.

        If a ``transaction`` is used and it already has write operations added,
        this method cannot be used (i.e. read-after-write is not allowed).

        Args:
            transaction
                (Optional[:class:`~google.cloud.firestore_v1.transaction.Transaction`]):
                An existing transaction that this query will run in.
            retry (Optional[google.api_core.retry.Retry]): Designation of what
                errors, if any, should be retried.  Defaults to a
                system-specified policy.
            timeout (Optional[float]): The timeout for this request.  Defaults
                to a system-specified value.
            explain_options
                (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
                Options to enable query profiling for this query. When set,
                explain_metrics will be available on the returned generator.

        Yields:
            List[AggregationResult]:
            The result of aggregations of this query.

        Returns:
            (Optional[google.cloud.firestore_v1.types.query_profile.ExplainMetrtics]):
            The results of query profiling, if received from the service.

        """
        metrics: ExplainMetrics | None = None

        response_iterator = self._get_stream_iterator(
            transaction,
            retry,
            timeout,
            explain_options,
        )
        while True:
            try:
                response = next(response_iterator, None)
            except exceptions.GoogleAPICallError as exc:
                if self._retry_query_after_exception(exc, retry, transaction):
                    response_iterator = self._get_stream_iterator(
                        transaction,
                        retry,
                        timeout,
                    )
                    continue
                else:
                    raise

            if response is None:  # EOI
                break

            if metrics is None and response.explain_metrics:
                metrics = response.explain_metrics

            result = _query_response_to_result(response)
            if result:
                yield result

        return metrics

    def stream(
        self,
        transaction: Optional["transaction.Transaction"] = None,
        retry: Union[retries.Retry, None, object] = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> StreamGenerator[List[AggregationResult]]:
        """Runs the aggregation query.

        This sends a ``RunAggregationQuery`` RPC and then returns a generator
        which consumes each document returned in the stream of
        ``RunAggregationQueryResponse`` messages.

        If a ``transaction`` is used and it already has write operations added,
        this method cannot be used (i.e. read-after-write is not allowed).

        Args:
            transaction
                (Optional[:class:`~google.cloud.firestore_v1.transaction.Transaction`]):
                An existing transaction that this query will run in.
            retry (Optional[google.api_core.retry.Retry]): Designation of what
                errors, if any, should be retried.  Defaults to a
                system-specified policy.
            timeout (Optinal[float]): The timeout for this request.  Defaults
            to a system-specified value.
            explain_options
                (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
                Options to enable query profiling for this query. When set,
                explain_metrics will be available on the returned generator.

        Returns:
            `StreamGenerator[List[AggregationResult]]`:
            A generator of the query results.
        """
        inner_generator = self._make_stream(
            transaction=transaction,
            retry=retry,
            timeout=timeout,
            explain_options=explain_options,
        )
        return StreamGenerator(inner_generator, explain_options)
