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

"""Classes for iterating over stream results for the Google Cloud Firestore API.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, Generator, Optional, TypeVar

from google.cloud.firestore_v1.query_profile import (
    ExplainMetrics,
    QueryExplainError,
)

if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1.query_profile import ExplainOptions


T = TypeVar("T")


class StreamGenerator(Generator[T, Any, Optional[ExplainMetrics]]):
    """Generator for the streamed results.

    Args:
        response_generator (Generator[T, Any, Optional[ExplainMetrics]]):
            The inner generator that yields the returned document in the stream.
        explain_options
            (Optional[:class:`~google.cloud.firestore_v1.query_profile.ExplainOptions`]):
            Query profiling options for this stream request.
    """

    def __init__(
        self,
        response_generator: Generator[T, Any, Optional[ExplainMetrics]],
        explain_options: Optional[ExplainOptions] = None,
    ):
        self._generator = response_generator
        self._explain_options = explain_options
        self._explain_metrics = None

    def __iter__(self) -> StreamGenerator:
        return self

    def __next__(self) -> T:
        try:
            return self._generator.__next__()
        except StopIteration as e:
            # If explain_metrics is available, it would be returned.
            if e.value:
                self._explain_metrics = ExplainMetrics._from_pb(e.value)
            raise

    def send(self, value: Any = None) -> T:
        return self._generator.send(value)

    def throw(self, *args, **kwargs) -> T:
        return self._generator.throw(*args, **kwargs)

    def close(self):
        return self._generator.close()

    @property
    def explain_options(self) -> ExplainOptions | None:
        """Query profiling options for this stream request."""
        return self._explain_options

    def get_explain_metrics(self) -> ExplainMetrics:
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
                next(self)
            except StopIteration:
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
