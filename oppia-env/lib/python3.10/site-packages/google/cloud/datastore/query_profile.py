# Copyright 2024 Google LLC
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

from typing import Any

import datetime

from dataclasses import dataclass
from google.protobuf.json_format import MessageToDict


@dataclass(frozen=True)
class ExplainOptions:
    """
    Class used to configure query profiling on a query.
    Set on a query object using the explain_options attribute at query construction time.

    :type analyze: bool
    :param analyze: Whether to execute this query. When false (the default),
        the query will be planned, returning only metrics from the planning stages.
        When true, the query will be planned and executed, returning the full
        query results along with both planning and execution stage metrics.
    """

    analyze: bool = False

    def _to_dict(self):
        return {"analyze": self.analyze}


@dataclass(frozen=True)
class PlanSummary:
    """
    Contains planning phase information about a query.

    :type indexes_used: list[dict[str, Any]]
    :param indexes_used: The indexes selected for this query.
    """

    indexes_used: list[dict[str, Any]]


@dataclass(frozen=True)
class ExecutionStats:
    """
    Execution phase information about a query.

    Only available when explain_options.analyze is True.

    :type results_returned: int
    :param results_returned: Total number of results returned, including
        documents, projections, aggregation results, keys.
    :type execution_duration: datetime.timedelta
    :param execution_duration: Total time to execute the query in the backend.
    :type read_operations: int
    :param read_operations: Total billable read operations.
    :type debug_stats: dict[str, Any]
    :param debug_stats: Debugging statistics from the execution of the query.
        Note that the debugging stats are subject to change as Firestore evolves
    """

    results_returned: int
    execution_duration: datetime.timedelta
    read_operations: int
    debug_stats: dict[str, Any]


@dataclass(frozen=True)
class ExplainMetrics:
    """
    ExplainMetrics contains information about the planning and execution of a query.

    When explain_options.analyze is false, only plan_summary is available.
    When explain_options.analyze is true, execution_stats is also available.

    :type plan_summary: PlanSummary
    :param plan_summary: Planning phase information about the query.
    :type execution_stats: ExecutionStats
    :param execution_stats: Execution phase information about the query.
    """

    plan_summary: PlanSummary

    @staticmethod
    def _from_pb(metrics_pb):
        dict_repr = MessageToDict(metrics_pb._pb, preserving_proto_field_name=True)
        plan_summary = PlanSummary(
            indexes_used=dict_repr.get("plan_summary", {}).get("indexes_used", [])
        )
        if "execution_stats" in dict_repr:
            stats_dict = dict_repr.get("execution_stats", {})
            execution_stats = ExecutionStats(
                results_returned=int(stats_dict.get("results_returned", 0)),
                execution_duration=metrics_pb.execution_stats.execution_duration,
                read_operations=int(stats_dict.get("read_operations", 0)),
                debug_stats=stats_dict.get("debug_stats", {}),
            )
            return _ExplainAnalyzeMetrics(
                plan_summary=plan_summary, _execution_stats=execution_stats
            )
        else:
            return ExplainMetrics(plan_summary=plan_summary)

    @property
    def execution_stats(self) -> ExecutionStats:
        raise QueryExplainError(
            "execution_stats not available when explain_options.analyze=False."
        )


@dataclass(frozen=True)
class _ExplainAnalyzeMetrics(ExplainMetrics):
    """
    Subclass of ExplainMetrics that includes execution_stats.
    Only available when explain_options.analyze is True.
    """

    plan_summary: PlanSummary
    _execution_stats: ExecutionStats

    @property
    def execution_stats(self) -> ExecutionStats:
        return self._execution_stats


class QueryExplainError(Exception):
    """
    Error returned when there is a problem accessing query profiling information.
    """

    pass
