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
from google.cloud.datastore_v1 import gapic_version as package_version

__version__ = package_version.__version__


from .services.datastore import DatastoreClient
from .services.datastore import DatastoreAsyncClient

from .types.aggregation_result import AggregationResult
from .types.aggregation_result import AggregationResultBatch
from .types.datastore import AllocateIdsRequest
from .types.datastore import AllocateIdsResponse
from .types.datastore import BeginTransactionRequest
from .types.datastore import BeginTransactionResponse
from .types.datastore import CommitRequest
from .types.datastore import CommitResponse
from .types.datastore import LookupRequest
from .types.datastore import LookupResponse
from .types.datastore import Mutation
from .types.datastore import MutationResult
from .types.datastore import PropertyMask
from .types.datastore import PropertyTransform
from .types.datastore import ReadOptions
from .types.datastore import ReserveIdsRequest
from .types.datastore import ReserveIdsResponse
from .types.datastore import RollbackRequest
from .types.datastore import RollbackResponse
from .types.datastore import RunAggregationQueryRequest
from .types.datastore import RunAggregationQueryResponse
from .types.datastore import RunQueryRequest
from .types.datastore import RunQueryResponse
from .types.datastore import TransactionOptions
from .types.entity import ArrayValue
from .types.entity import Entity
from .types.entity import Key
from .types.entity import PartitionId
from .types.entity import Value
from .types.query import AggregationQuery
from .types.query import CompositeFilter
from .types.query import EntityResult
from .types.query import Filter
from .types.query import FindNearest
from .types.query import GqlQuery
from .types.query import GqlQueryParameter
from .types.query import KindExpression
from .types.query import Projection
from .types.query import PropertyFilter
from .types.query import PropertyOrder
from .types.query import PropertyReference
from .types.query import Query
from .types.query import QueryResultBatch
from .types.query_profile import ExecutionStats
from .types.query_profile import ExplainMetrics
from .types.query_profile import ExplainOptions
from .types.query_profile import PlanSummary

__all__ = (
    "DatastoreAsyncClient",
    "AggregationQuery",
    "AggregationResult",
    "AggregationResultBatch",
    "AllocateIdsRequest",
    "AllocateIdsResponse",
    "ArrayValue",
    "BeginTransactionRequest",
    "BeginTransactionResponse",
    "CommitRequest",
    "CommitResponse",
    "CompositeFilter",
    "DatastoreClient",
    "Entity",
    "EntityResult",
    "ExecutionStats",
    "ExplainMetrics",
    "ExplainOptions",
    "Filter",
    "FindNearest",
    "GqlQuery",
    "GqlQueryParameter",
    "Key",
    "KindExpression",
    "LookupRequest",
    "LookupResponse",
    "Mutation",
    "MutationResult",
    "PartitionId",
    "PlanSummary",
    "Projection",
    "PropertyFilter",
    "PropertyMask",
    "PropertyOrder",
    "PropertyReference",
    "PropertyTransform",
    "Query",
    "QueryResultBatch",
    "ReadOptions",
    "ReserveIdsRequest",
    "ReserveIdsResponse",
    "RollbackRequest",
    "RollbackResponse",
    "RunAggregationQueryRequest",
    "RunAggregationQueryResponse",
    "RunQueryRequest",
    "RunQueryResponse",
    "TransactionOptions",
    "Value",
)
