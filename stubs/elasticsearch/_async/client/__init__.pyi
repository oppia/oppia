# -*- coding: utf-8 -*-
#  Licensed to Elasticsearch B.V. under one or more contributor
#  license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright
#  ownership. Elasticsearch B.V. licenses this file to you under
#  the Apache License, Version 2.0 (the "License"); you may
#  not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
# 	http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License.

from __future__ import unicode_literals
import logging
from typing import Any, MutableMapping, Optional, Type, Union, Collection

from ..transport import AsyncTransport

from .async_search import AsyncSearchClient
from .autoscaling import AutoscalingClient
from .cat import CatClient
from .cluster import ClusterClient
from .dangling_indices import DanglingIndicesClient
from .indices import IndicesClient
from .ingest import IngestClient
from .nodes import NodesClient
from .remote import RemoteClient
from .snapshot import SnapshotClient
from .tasks import TasksClient

# xpack APIs
from .xpack import XPackClient
from .ccr import CcrClient
from .enrich import EnrichClient
from .eql import EqlClient
from .graph import GraphClient
from .ilm import IlmClient
from .license import LicenseClient
from .migration import MigrationClient
from .ml import MlClient
from .monitoring import MonitoringClient
from .rollup import RollupClient
from .searchable_snapshots import SearchableSnapshotsClient
from .security import SecurityClient
from .slm import SlmClient
from .sql import SqlClient
from .ssl import SslClient
from .transform import TransformClient
from .watcher import WatcherClient

logger: logging.Logger

class AsyncElasticsearch(object):
    transport: AsyncTransport

    async_search: AsyncSearchClient
    autoscaling: AutoscalingClient
    cat: CatClient
    cluster: ClusterClient
    indices: IndicesClient
    ingest: IngestClient
    nodes: NodesClient
    remote: RemoteClient
    snapshot: SnapshotClient
    tasks: TasksClient

    xpack: XPackClient
    ccr: CcrClient
    dangling_indices: DanglingIndicesClient
    enrich: EnrichClient
    eql: EqlClient
    graph: GraphClient
    ilm: IlmClient
    license: LicenseClient
    migration: MigrationClient
    ml: MlClient
    monitoring: MonitoringClient
    rollup: RollupClient
    searchable_snapshots: SearchableSnapshotsClient
    security: SecurityClient
    slm: SlmClient
    sql: SqlClient
    ssl: SslClient
    transform: TransformClient
    watcher: WatcherClient
    def __init__(
        self,
        hosts: Any = ...,
        transport_class: Type[AsyncTransport] = ...,
        **kwargs: Any
    ) -> None: ...
    def __repr__(self) -> str: ...
    async def __aenter__(self) -> "AsyncElasticsearch": ...
    async def __aexit__(self, *_: Any) -> None: ...
    async def close(self) -> None: ...
    # AUTO-GENERATED-API-DEFINITIONS #
    async def ping(
        self,
        *,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> bool: ...
    async def info(
        self,
        *,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def create(
        self,
        index: Any,
        id: Any,
        *,
        body: Any,
        doc_type: Optional[Any] = ...,
        pipeline: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def index(
        self,
        index: Any,
        *,
        body: Any,
        doc_type: Optional[Any] = ...,
        id: Optional[Any] = ...,
        if_primary_term: Optional[Any] = ...,
        if_seq_no: Optional[Any] = ...,
        op_type: Optional[Any] = ...,
        pipeline: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        require_alias: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def bulk(
        self,
        *,
        body: Any,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        pipeline: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        require_alias: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def clear_scroll(
        self,
        *,
        body: Optional[Any] = ...,
        scroll_id: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def count(
        self,
        *,
        body: Optional[Any] = ...,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        analyze_wildcard: Optional[Any] = ...,
        analyzer: Optional[Any] = ...,
        default_operator: Optional[Any] = ...,
        df: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        ignore_throttled: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        lenient: Optional[Any] = ...,
        min_score: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        q: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        terminate_after: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def delete(
        self,
        index: Any,
        id: Any,
        *,
        doc_type: Optional[Any] = ...,
        if_primary_term: Optional[Any] = ...,
        if_seq_no: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def delete_by_query(
        self,
        index: Any,
        *,
        body: Any,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        analyze_wildcard: Optional[Any] = ...,
        analyzer: Optional[Any] = ...,
        conflicts: Optional[Any] = ...,
        default_operator: Optional[Any] = ...,
        df: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        from_: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        lenient: Optional[Any] = ...,
        max_docs: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        q: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        request_cache: Optional[Any] = ...,
        requests_per_second: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        scroll: Optional[Any] = ...,
        scroll_size: Optional[Any] = ...,
        search_timeout: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        size: Optional[Any] = ...,
        slices: Optional[Any] = ...,
        sort: Optional[Any] = ...,
        stats: Optional[Any] = ...,
        terminate_after: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        version: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        wait_for_completion: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def delete_by_query_rethrottle(
        self,
        task_id: Any,
        *,
        requests_per_second: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def delete_script(
        self,
        id: Any,
        *,
        master_timeout: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def exists(
        self,
        index: Any,
        id: Any,
        *,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        stored_fields: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> bool: ...
    async def exists_source(
        self,
        index: Any,
        id: Any,
        *,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> bool: ...
    async def explain(
        self,
        index: Any,
        id: Any,
        *,
        body: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        analyze_wildcard: Optional[Any] = ...,
        analyzer: Optional[Any] = ...,
        default_operator: Optional[Any] = ...,
        df: Optional[Any] = ...,
        lenient: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        q: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        stored_fields: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def field_caps(
        self,
        *,
        body: Optional[Any] = ...,
        index: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        fields: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        include_unmapped: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def get(
        self,
        index: Any,
        id: Any,
        *,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        stored_fields: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def get_script(
        self,
        id: Any,
        *,
        master_timeout: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def get_source(
        self,
        index: Any,
        id: Any,
        *,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def mget(
        self,
        *,
        body: Any,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        stored_fields: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def msearch(
        self,
        *,
        body: Any,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        ccs_minimize_roundtrips: Optional[Any] = ...,
        max_concurrent_searches: Optional[Any] = ...,
        max_concurrent_shard_requests: Optional[Any] = ...,
        pre_filter_shard_size: Optional[Any] = ...,
        rest_total_hits_as_int: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        typed_keys: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def msearch_template(
        self,
        *,
        body: Any,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        ccs_minimize_roundtrips: Optional[Any] = ...,
        max_concurrent_searches: Optional[Any] = ...,
        rest_total_hits_as_int: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        typed_keys: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def mtermvectors(
        self,
        *,
        body: Optional[Any] = ...,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        field_statistics: Optional[Any] = ...,
        fields: Optional[Any] = ...,
        ids: Optional[Any] = ...,
        offsets: Optional[Any] = ...,
        payloads: Optional[Any] = ...,
        positions: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        term_statistics: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def put_script(
        self,
        id: Any,
        *,
        body: Any,
        context: Optional[Any] = ...,
        master_timeout: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def rank_eval(
        self,
        *,
        body: Any,
        index: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def reindex(
        self,
        *,
        body: Any,
        max_docs: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        requests_per_second: Optional[Any] = ...,
        scroll: Optional[Any] = ...,
        slices: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        wait_for_completion: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def reindex_rethrottle(
        self,
        task_id: Any,
        *,
        requests_per_second: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def render_search_template(
        self,
        *,
        body: Optional[Any] = ...,
        id: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def scripts_painless_execute(
        self,
        *,
        body: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def scroll(
        self,
        *,
        body: Optional[Any] = ...,
        scroll_id: Optional[Any] = ...,
        rest_total_hits_as_int: Optional[Any] = ...,
        scroll: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def search(
        self,
        *,
        body: Optional[Any] = ...,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        allow_partial_search_results: Optional[Any] = ...,
        analyze_wildcard: Optional[Any] = ...,
        analyzer: Optional[Any] = ...,
        batched_reduce_size: Optional[Any] = ...,
        ccs_minimize_roundtrips: Optional[Any] = ...,
        default_operator: Optional[Any] = ...,
        df: Optional[Any] = ...,
        docvalue_fields: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        explain: Optional[Any] = ...,
        from_: Optional[Any] = ...,
        ignore_throttled: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        lenient: Optional[Any] = ...,
        max_concurrent_shard_requests: Optional[Any] = ...,
        pre_filter_shard_size: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        q: Optional[Any] = ...,
        request_cache: Optional[Any] = ...,
        rest_total_hits_as_int: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        scroll: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        seq_no_primary_term: Optional[Any] = ...,
        size: Optional[Any] = ...,
        sort: Optional[Any] = ...,
        stats: Optional[Any] = ...,
        stored_fields: Optional[Any] = ...,
        suggest_field: Optional[Any] = ...,
        suggest_mode: Optional[Any] = ...,
        suggest_size: Optional[Any] = ...,
        suggest_text: Optional[Any] = ...,
        terminate_after: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        track_scores: Optional[Any] = ...,
        track_total_hits: Optional[Any] = ...,
        typed_keys: Optional[Any] = ...,
        version: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def search_shards(
        self,
        *,
        index: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        local: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def search_template(
        self,
        *,
        body: Any,
        index: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        ccs_minimize_roundtrips: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        explain: Optional[Any] = ...,
        ignore_throttled: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        profile: Optional[Any] = ...,
        rest_total_hits_as_int: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        scroll: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        typed_keys: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def termvectors(
        self,
        index: Any,
        *,
        body: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        id: Optional[Any] = ...,
        field_statistics: Optional[Any] = ...,
        fields: Optional[Any] = ...,
        offsets: Optional[Any] = ...,
        payloads: Optional[Any] = ...,
        positions: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        realtime: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        term_statistics: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def update(
        self,
        index: Any,
        id: Any,
        *,
        body: Any,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        if_primary_term: Optional[Any] = ...,
        if_seq_no: Optional[Any] = ...,
        lang: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        require_alias: Optional[Any] = ...,
        retry_on_conflict: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def update_by_query(
        self,
        index: Any,
        *,
        body: Optional[Any] = ...,
        doc_type: Optional[Any] = ...,
        _source: Optional[Any] = ...,
        _source_excludes: Optional[Any] = ...,
        _source_includes: Optional[Any] = ...,
        allow_no_indices: Optional[Any] = ...,
        analyze_wildcard: Optional[Any] = ...,
        analyzer: Optional[Any] = ...,
        conflicts: Optional[Any] = ...,
        default_operator: Optional[Any] = ...,
        df: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        from_: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        lenient: Optional[Any] = ...,
        max_docs: Optional[Any] = ...,
        pipeline: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        q: Optional[Any] = ...,
        refresh: Optional[Any] = ...,
        request_cache: Optional[Any] = ...,
        requests_per_second: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        scroll: Optional[Any] = ...,
        scroll_size: Optional[Any] = ...,
        search_timeout: Optional[Any] = ...,
        search_type: Optional[Any] = ...,
        size: Optional[Any] = ...,
        slices: Optional[Any] = ...,
        sort: Optional[Any] = ...,
        stats: Optional[Any] = ...,
        terminate_after: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        version: Optional[Any] = ...,
        version_type: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        wait_for_completion: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def update_by_query_rethrottle(
        self,
        task_id: Any,
        *,
        requests_per_second: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def get_script_context(
        self,
        *,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def get_script_languages(
        self,
        *,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def close_point_in_time(
        self,
        *,
        body: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
    async def open_point_in_time(
        self,
        *,
        index: Optional[Any] = ...,
        expand_wildcards: Optional[Any] = ...,
        ignore_unavailable: Optional[Any] = ...,
        keep_alive: Optional[Any] = ...,
        preference: Optional[Any] = ...,
        routing: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
