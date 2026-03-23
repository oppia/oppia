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

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import struct_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.v1",
    manifest={
        "ExplainOptions",
        "ExplainMetrics",
        "PlanSummary",
        "ExecutionStats",
    },
)


class ExplainOptions(proto.Message):
    r"""Explain options for the query.

    Attributes:
        analyze (bool):
            Optional. Whether to execute this query.

            When false (the default), the query will be
            planned, returning only metrics from the
            planning stages.

            When true, the query will be planned and
            executed, returning the full query results along
            with both planning and execution stage metrics.
    """

    analyze: bool = proto.Field(
        proto.BOOL,
        number=1,
    )


class ExplainMetrics(proto.Message):
    r"""Explain metrics for the query.

    Attributes:
        plan_summary (google.cloud.firestore_v1.types.PlanSummary):
            Planning phase information for the query.
        execution_stats (google.cloud.firestore_v1.types.ExecutionStats):
            Aggregated stats from the execution of the query. Only
            present when
            [ExplainOptions.analyze][google.firestore.v1.ExplainOptions.analyze]
            is set to true.
    """

    plan_summary: "PlanSummary" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PlanSummary",
    )
    execution_stats: "ExecutionStats" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="ExecutionStats",
    )


class PlanSummary(proto.Message):
    r"""Planning phase information for the query.

    Attributes:
        indexes_used (MutableSequence[google.protobuf.struct_pb2.Struct]):
            The indexes selected for the query. For example: [
            {"query_scope": "Collection", "properties": "(foo ASC,
            **name** ASC)"}, {"query_scope": "Collection", "properties":
            "(bar ASC, **name** ASC)"} ]
    """

    indexes_used: MutableSequence[struct_pb2.Struct] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=struct_pb2.Struct,
    )


class ExecutionStats(proto.Message):
    r"""Execution statistics for the query.

    Attributes:
        results_returned (int):
            Total number of results returned, including
            documents, projections, aggregation results,
            keys.
        execution_duration (google.protobuf.duration_pb2.Duration):
            Total time to execute the query in the
            backend.
        read_operations (int):
            Total billable read operations.
        debug_stats (google.protobuf.struct_pb2.Struct):
            Debugging statistics from the execution of the query. Note
            that the debugging stats are subject to change as Firestore
            evolves. It could include: { "indexes_entries_scanned":
            "1000", "documents_scanned": "20", "billing_details" : {
            "documents_billable": "20", "index_entries_billable":
            "1000", "min_query_cost": "0" } }
    """

    results_returned: int = proto.Field(
        proto.INT64,
        number=1,
    )
    execution_duration: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=3,
        message=duration_pb2.Duration,
    )
    read_operations: int = proto.Field(
        proto.INT64,
        number=4,
    )
    debug_stats: struct_pb2.Struct = proto.Field(
        proto.MESSAGE,
        number=5,
        message=struct_pb2.Struct,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
