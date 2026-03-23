# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
#
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore

from google.cloud.datastore_v1.types import entity
from google.cloud.datastore_v1.types import query
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.datastore.v1",
    manifest={
        "AggregationResult",
        "AggregationResultBatch",
    },
)


class AggregationResult(proto.Message):
    r"""The result of a single bucket from a Datastore aggregation query.

    The keys of ``aggregate_properties`` are the same for all results in
    an aggregation query, unlike entity queries which can have different
    fields present for each result.

    Attributes:
        aggregate_properties (MutableMapping[str, google.cloud.datastore_v1.types.Value]):
            The result of the aggregation functions, ex:
            ``COUNT(*) AS total_entities``.

            The key is the
            [alias][google.datastore.v1.AggregationQuery.Aggregation.alias]
            assigned to the aggregation function on input and the size
            of this map equals the number of aggregation functions in
            the query.
    """

    aggregate_properties: MutableMapping[str, entity.Value] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=2,
        message=entity.Value,
    )


class AggregationResultBatch(proto.Message):
    r"""A batch of aggregation results produced by an aggregation
    query.

    Attributes:
        aggregation_results (MutableSequence[google.cloud.datastore_v1.types.AggregationResult]):
            The aggregation results for this batch.
        more_results (google.cloud.datastore_v1.types.QueryResultBatch.MoreResultsType):
            The state of the query after the current batch. Only
            COUNT(*) aggregations are supported in the initial launch.
            Therefore, expected result type is limited to
            ``NO_MORE_RESULTS``.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            Read timestamp this batch was returned from.

            In a single transaction, subsequent query result
            batches for the same query can have a greater
            timestamp. Each batch's read timestamp is valid
            for all preceding batches.
    """

    aggregation_results: MutableSequence["AggregationResult"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="AggregationResult",
    )
    more_results: query.QueryResultBatch.MoreResultsType = proto.Field(
        proto.ENUM,
        number=2,
        enum=query.QueryResultBatch.MoreResultsType,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
