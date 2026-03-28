# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

from .client import __version__
from .client.abstract import AnnSearchRequest, RRFRanker, WeightedRanker
from .client.asynch import SearchFuture
from .client.prepare import Prepare
from .client.search_result import Hit, Hits, SearchResult
from .client.types import (
    BulkInsertState,
    DataType,
    FunctionType,
    Group,
    IndexType,
    Replica,
    ResourceGroupInfo,
    Shard,
    Status,
)
from .exceptions import (
    ExceptionsMessage,
    MilvusException,
    MilvusUnavailableException,
)
from .milvus_client import AsyncMilvusClient, MilvusClient
from .orm import db, utility
from .orm.collection import Collection
from .orm.connections import Connections, connections
from .orm.future import MutationFuture
from .orm.index import Index
from .orm.partition import Partition
from .orm.role import Role
from .orm.schema import CollectionSchema, FieldSchema, Function
from .orm.utility import (
    create_resource_group,
    create_user,
    delete_user,
    describe_resource_group,
    drop_collection,
    drop_resource_group,
    has_collection,
    has_partition,
    hybridts_to_datetime,
    hybridts_to_unixtime,
    index_building_progress,
    list_collections,
    list_resource_groups,
    list_usernames,
    loading_progress,
    mkts_from_datetime,
    mkts_from_hybridts,
    mkts_from_unixtime,
    reset_password,
    transfer_node,
    transfer_replica,
    update_password,
    update_resource_groups,
    wait_for_index_building_complete,
    wait_for_loading_complete,
)

# Compatiable
from .settings import Config as DefaultConfig

__all__ = [
    "AnnSearchRequest",
    "AsyncMilvusClient",
    "BulkInsertState",
    "Collection",
    "CollectionSchema",
    "Connections",
    "DataType",
    "DefaultConfig",
    "ExceptionsMessage",
    "FieldSchema",
    "Function",
    "FunctionType",
    "Group",
    "Hit",
    "Hits",
    "Index",
    "IndexType",
    "MilvusClient",
    "MilvusException",
    "MilvusUnavailableException",
    "MutationFuture",
    "Partition",
    "Prepare",
    "RRFRanker",
    "Replica",
    "ResourceGroupInfo",
    "Role",
    "SearchFuture",
    "SearchResult",
    "Shard",
    "Status",
    "WeightedRanker",
    "__version__",
    "connections",
    "create_resource_group",
    "create_user",
    "db",
    "delete_user",
    "describe_resource_group",
    "drop_collection",
    "drop_resource_group",
    "has_collection",
    "has_partition",
    "hybridts_to_datetime",
    "hybridts_to_unixtime",
    "index_building_progress",
    "list_collections",
    "list_resource_groups",
    "list_usernames",
    "loading_progress",
    "mkts_from_datetime",
    "mkts_from_hybridts",
    "mkts_from_unixtime",
    "reset_password",
    "transfer_node",
    "transfer_replica",
    "update_password",
    "update_resource_groups",
    "utility",
    "wait_for_index_building_complete",
    "wait_for_loading_complete",
]
