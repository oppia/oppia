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

import abc
from abc import ABC
from typing import TYPE_CHECKING, Any, Coroutine, List, Optional, Tuple, Union

from google.api_core import gapic_v1
from google.api_core import retry as retries

from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.field_path import FieldPath
from google.cloud.firestore_v1.types import (
    StructuredAggregationQuery,
)

# Types needed only for Type Hints
if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1 import transaction
    from google.cloud.firestore_v1.async_stream_generator import AsyncStreamGenerator
    from google.cloud.firestore_v1.query_profile import ExplainOptions
    from google.cloud.firestore_v1.query_results import QueryResultsList
    from google.cloud.firestore_v1.stream_generator import (
        StreamGenerator,
    )


class AggregationResult(object):
    """
    A class representing result from Aggregation Query
    :type alias: str
    :param alias: The alias for the aggregation.
    :type value: int
    :param value: The resulting value from the aggregation.
    :type read_time:
    :param value: The resulting read_time
    """

    def __init__(self, alias: str, value: float, read_time=None):
        self.alias = alias
        self.value = value
        self.read_time = read_time

    def __repr__(self):
        return f"<Aggregation alias={self.alias}, value={self.value}, readtime={self.read_time}>"


class BaseAggregation(ABC):
    def __init__(self, alias: str | None = None):
        self.alias = alias

    @abc.abstractmethod
    def _to_protobuf(self):
        """Convert this instance to the protobuf representation"""


class CountAggregation(BaseAggregation):
    def __init__(self, alias: str | None = None):
        super(CountAggregation, self).__init__(alias=alias)

    def _to_protobuf(self):
        """Convert this instance to the protobuf representation"""
        aggregation_pb = StructuredAggregationQuery.Aggregation()
        aggregation_pb.alias = self.alias
        aggregation_pb.count = StructuredAggregationQuery.Aggregation.Count()
        return aggregation_pb


class SumAggregation(BaseAggregation):
    def __init__(self, field_ref: str | FieldPath, alias: str | None = None):
        if isinstance(field_ref, FieldPath):
            # convert field path to string
            field_ref = field_ref.to_api_repr()
        self.field_ref = field_ref
        super(SumAggregation, self).__init__(alias=alias)

    def _to_protobuf(self):
        """Convert this instance to the protobuf representation"""
        aggregation_pb = StructuredAggregationQuery.Aggregation()
        aggregation_pb.alias = self.alias
        aggregation_pb.sum = StructuredAggregationQuery.Aggregation.Sum()
        aggregation_pb.sum.field.field_path = self.field_ref
        return aggregation_pb


class AvgAggregation(BaseAggregation):
    def __init__(self, field_ref: str | FieldPath, alias: str | None = None):
        if isinstance(field_ref, FieldPath):
            # convert field path to string
            field_ref = field_ref.to_api_repr()
        self.field_ref = field_ref
        super(AvgAggregation, self).__init__(alias=alias)

    def _to_protobuf(self):
        """Convert this instance to the protobuf representation"""
        aggregation_pb = StructuredAggregationQuery.Aggregation()
        aggregation_pb.alias = self.alias
        aggregation_pb.avg = StructuredAggregationQuery.Aggregation.Avg()
        aggregation_pb.avg.field.field_path = self.field_ref
        return aggregation_pb


def _query_response_to_result(
    response_pb,
) -> List[AggregationResult]:
    results = [
        AggregationResult(
            alias=key,
            value=response_pb.result.aggregate_fields[key].integer_value
            or response_pb.result.aggregate_fields[key].double_value,
            read_time=response_pb.read_time,
        )
        for key in response_pb.result.aggregate_fields.pb.keys()
    ]

    return results


class BaseAggregationQuery(ABC):
    """Represents an aggregation query to the Firestore API."""

    def __init__(self, nested_query, alias: str | None = None) -> None:
        self._nested_query = nested_query
        self._alias = alias
        self._collection_ref = nested_query._parent
        self._aggregations: List[BaseAggregation] = []

    @property
    def _client(self):
        return self._collection_ref._client

    def count(self, alias: str | None = None):
        """
        Adds a count over the nested query
        """
        count_aggregation = CountAggregation(alias=alias)
        self._aggregations.append(count_aggregation)
        return self

    def sum(self, field_ref: str | FieldPath, alias: str | None = None):
        """
        Adds a sum over the nested query
        """
        sum_aggregation = SumAggregation(field_ref, alias=alias)
        self._aggregations.append(sum_aggregation)
        return self

    def avg(self, field_ref: str | FieldPath, alias: str | None = None):
        """
        Adds an avg over the nested query
        """
        avg_aggregation = AvgAggregation(field_ref, alias=alias)
        self._aggregations.append(avg_aggregation)
        return self

    def add_aggregation(self, aggregation: BaseAggregation) -> None:
        """
        Adds an aggregation operation to the nested query

        :type aggregation: :class:`google.cloud.firestore_v1.aggregation.BaseAggregation`
        :param aggregation: An aggregation operation, e.g. a CountAggregation
        """
        self._aggregations.append(aggregation)

    def add_aggregations(self, aggregations: List[BaseAggregation]) -> None:
        """
        Adds a list of aggregations to the nested query

        :type aggregations: list
        :param aggregations: a list of aggregation operations
        """
        self._aggregations.extend(aggregations)

    def _to_protobuf(self) -> StructuredAggregationQuery:
        pb = StructuredAggregationQuery()
        pb.structured_query = self._nested_query._to_protobuf()

        for aggregation in self._aggregations:
            aggregation_pb = aggregation._to_protobuf()
            pb.aggregations.append(aggregation_pb)
        return pb

    def _prep_stream(
        self,
        transaction=None,
        retry: Union[retries.Retry, retries.AsyncRetry, None, object] = None,
        timeout: float | None = None,
        explain_options: Optional[ExplainOptions] = None,
    ) -> Tuple[dict, dict]:
        parent_path, expected_prefix = self._collection_ref._parent_info()
        request = {
            "parent": parent_path,
            "structured_aggregation_query": self._to_protobuf(),
            "transaction": _helpers.get_transaction_id(transaction),
        }
        if explain_options:
            request["explain_options"] = explain_options._to_dict()
        kwargs = _helpers.make_retry_timeout_kwargs(retry, timeout)

        return request, kwargs

    @abc.abstractmethod
    def get(
        self,
        transaction=None,
        retry: Union[
            retries.Retry, retries.AsyncRetry, None, object
        ] = gapic_v1.method.DEFAULT,
        timeout: float | None = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> (
        QueryResultsList[AggregationResult]
        | Coroutine[Any, Any, List[List[AggregationResult]]]
    ):
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
            (QueryResultsList[List[AggregationResult]] | Coroutine[Any, Any, List[List[AggregationResult]]]):
            The aggregation query results.
        """

    @abc.abstractmethod
    def stream(
        self,
        transaction: Optional[transaction.Transaction] = None,
        retry: retries.Retry
        | retries.AsyncRetry
        | object
        | None = gapic_v1.method.DEFAULT,
        timeout: Optional[float] = None,
        *,
        explain_options: Optional[ExplainOptions] = None,
    ) -> (
        StreamGenerator[List[AggregationResult]]
        | AsyncStreamGenerator[List[AggregationResult]]
    ):
        """Runs the aggregation query.

        This sends a``RunAggregationQuery`` RPC and returns a generator in the stream of ``RunAggregationQueryResponse`` messages.

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
            StreamGenerator[List[AggregationResult]] | AsyncStreamGenerator[List[AggregationResult]]:
            A generator of the query results.
        """
