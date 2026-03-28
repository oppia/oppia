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

"""Classes for iterating over stream results async for the Google Cloud
Firestore API.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, AsyncGenerator, Coroutine, Optional, TypeVar

from google.cloud.firestore_v1.query_profile import (
    ExplainMetrics,
    QueryExplainError,
)
import google.cloud.firestore_v1.types.query_profile as query_profile_pb

if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.query_profile import ExplainOptions


T = TypeVar("T")


class AsyncStreamGenerator(AsyncGenerator[T, Any]):
    """Asynchronous Generator for the streamed results.

    Args:
        response_generator (AsyncGenerator):
            The inner generator that yields the returned results in the stream.
        explain_options
            (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
            Query profiling options for this stream request.
    """

    def __init__(
        self,
        response_generator: AsyncGenerator[T | query_profile_pb.ExplainMetrics, Any],
        explain_options: Optional[ExplainOptions] = None,
    ):
        self._generator = response_generator
        self._explain_options = explain_options
        self._explain_metrics = None

    def __aiter__(self) -> AsyncGenerator[T, Any]:
        return self

    async def __anext__(self) -> T:
        try:
            next_value = await self._generator.__anext__()
            if type(next_value) is query_profile_pb.ExplainMetrics:
                self._explain_metrics = ExplainMetrics._from_pb(next_value)
                raise StopAsyncIteration
            else:
                return next_value
        except StopAsyncIteration:
            raise

    def asend(self, value: Any = None) -> Coroutine[Any, Any, T]:
        return self._generator.asend(value)

    def athrow(self, *args, **kwargs) -> Coroutine[Any, Any, T]:
        return self._generator.athrow(*args, **kwargs)

    def aclose(self):
        return self._generator.aclose()

    @property
    def explain_options(self) -> ExplainOptions | None:
        """Query profiling options for this stream request."""
        return self._explain_options

    async def get_explain_metrics(self) -> ExplainMetrics:
        """
        Get the metrics associated with the query execution.
        Metrics are only available when explain_options is set on the query. If
        ExplainOptions.analyze is False, only plan_summary is available. If it is
        True, execution_stats is also available.
        :rtype: :class:`~google.cloud.firestore_v1.query_profile.ExplainMetrics`
        :returns: The metrics associated with the query execution.
        :raises: :class:`~google.cloud.firestore_v1.query_profile.QueryExplainError`
            if explain_metrics is not available on the query.
        """
        if self._explain_metrics is not None:
            return self._explain_metrics
        elif self._explain_options is None:
            raise QueryExplainError("explain_options not set on query.")
        elif self._explain_options.analyze is False:
            # We need to run the query to get the explain_metrics. Since no
            # query results are returned, it's ok to discard the returned value.
            try:
                await self.__anext__()
            except StopAsyncIteration:
                pass

            if self._explain_metrics is None:
                raise QueryExplainError(
                    "Did not receive explain_metrics for this query, despite "
                    "explain_options is set and analyze = False."
                )
            else:
                return self._explain_metrics
        raise QueryExplainError(
            "explain_metrics not available until query is complete."
        )
