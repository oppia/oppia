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

import typing as t

from elastic_transport import ObjectApiResponse

from ._base import NamespacedClient
from .utils import SKIP_IN_PATH, _quote, _rewrite_parameters


class CcrClient(NamespacedClient):

    @_rewrite_parameters()
    def delete_auto_follow_pattern(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete auto-follow patterns. Delete a collection of cross-cluster replication
        auto-follow patterns.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-delete-auto-follow-pattern.html>`_

        :param name: The name of the auto follow pattern.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_ccr/auto_follow/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.delete_auto_follow_pattern",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "leader_index",
            "max_outstanding_read_requests",
            "max_outstanding_write_requests",
            "max_read_request_operation_count",
            "max_read_request_size",
            "max_retry_delay",
            "max_write_buffer_count",
            "max_write_buffer_size",
            "max_write_request_operation_count",
            "max_write_request_size",
            "read_poll_timeout",
            "remote_cluster",
        ),
    )
    def follow(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        leader_index: t.Optional[str] = None,
        max_outstanding_read_requests: t.Optional[int] = None,
        max_outstanding_write_requests: t.Optional[int] = None,
        max_read_request_operation_count: t.Optional[int] = None,
        max_read_request_size: t.Optional[str] = None,
        max_retry_delay: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        max_write_buffer_count: t.Optional[int] = None,
        max_write_buffer_size: t.Optional[str] = None,
        max_write_request_operation_count: t.Optional[int] = None,
        max_write_request_size: t.Optional[str] = None,
        pretty: t.Optional[bool] = None,
        read_poll_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        remote_cluster: t.Optional[str] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create a follower. Create a cross-cluster replication follower index that follows
        a specific leader index. When the API returns, the follower index exists and
        cross-cluster replication starts replicating operations from the leader index
        to the follower index.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-put-follow.html>`_

        :param index: The name of the follower index
        :param leader_index:
        :param max_outstanding_read_requests:
        :param max_outstanding_write_requests:
        :param max_read_request_operation_count:
        :param max_read_request_size:
        :param max_retry_delay:
        :param max_write_buffer_count:
        :param max_write_buffer_size:
        :param max_write_request_operation_count:
        :param max_write_request_size:
        :param read_poll_timeout:
        :param remote_cluster:
        :param wait_for_active_shards: Sets the number of shard copies that must be active
            before returning. Defaults to 0. Set to `all` for all shard copies, otherwise
            set to any non-negative value less than or equal to the total number of copies
            for the shard (number of replicas + 1)
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/follow'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        if not __body:
            if leader_index is not None:
                __body["leader_index"] = leader_index
            if max_outstanding_read_requests is not None:
                __body["max_outstanding_read_requests"] = max_outstanding_read_requests
            if max_outstanding_write_requests is not None:
                __body["max_outstanding_write_requests"] = (
                    max_outstanding_write_requests
                )
            if max_read_request_operation_count is not None:
                __body["max_read_request_operation_count"] = (
                    max_read_request_operation_count
                )
            if max_read_request_size is not None:
                __body["max_read_request_size"] = max_read_request_size
            if max_retry_delay is not None:
                __body["max_retry_delay"] = max_retry_delay
            if max_write_buffer_count is not None:
                __body["max_write_buffer_count"] = max_write_buffer_count
            if max_write_buffer_size is not None:
                __body["max_write_buffer_size"] = max_write_buffer_size
            if max_write_request_operation_count is not None:
                __body["max_write_request_operation_count"] = (
                    max_write_request_operation_count
                )
            if max_write_request_size is not None:
                __body["max_write_request_size"] = max_write_request_size
            if read_poll_timeout is not None:
                __body["read_poll_timeout"] = read_poll_timeout
            if remote_cluster is not None:
                __body["remote_cluster"] = remote_cluster
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="ccr.follow",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def follow_info(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get follower information. Get information about all cross-cluster replication
        follower indices. For example, the results include follower index names, leader
        index names, replication options, and whether the follower indices are active
        or paused.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-get-follow-info.html>`_

        :param index: A comma-separated list of index patterns; use `_all` to perform
            the operation on all indices
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/info'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.follow_info",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def follow_stats(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get follower stats. Get cross-cluster replication follower stats. The API returns
        shard-level stats about the "following tasks" associated with each shard for
        the specified indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-get-follow-stats.html>`_

        :param index: A comma-separated list of index patterns; use `_all` to perform
            the operation on all indices
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/stats'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.follow_stats",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "follower_cluster",
            "follower_index",
            "follower_index_uuid",
            "leader_remote_cluster",
        ),
    )
    def forget_follower(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        follower_cluster: t.Optional[str] = None,
        follower_index: t.Optional[str] = None,
        follower_index_uuid: t.Optional[str] = None,
        human: t.Optional[bool] = None,
        leader_remote_cluster: t.Optional[str] = None,
        pretty: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Forget a follower. Remove the cross-cluster replication follower retention leases
        from the leader. A following index takes out retention leases on its leader index.
        These leases are used to increase the likelihood that the shards of the leader
        index retain the history of operations that the shards of the following index
        need to run replication. When a follower index is converted to a regular index
        by the unfollow API (either by directly calling the API or by index lifecycle
        management tasks), these leases are removed. However, removal of the leases can
        fail, for example when the remote cluster containing the leader index is unavailable.
        While the leases will eventually expire on their own, their extended existence
        can cause the leader index to hold more history than necessary and prevent index
        lifecycle management from performing some operations on the leader index. This
        API exists to enable manually removing the leases when the unfollow API is unable
        to do so. NOTE: This API does not stop replication by a following index. If you
        use this API with a follower index that is still actively following, the following
        index will add back retention leases on the leader. The only purpose of this
        API is to handle the case of failure to remove the following retention leases
        after the unfollow API is invoked.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-post-forget-follower.html>`_

        :param index: the name of the leader index for which specified follower retention
            leases should be removed
        :param follower_cluster:
        :param follower_index:
        :param follower_index_uuid:
        :param leader_remote_cluster:
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/forget_follower'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if follower_cluster is not None:
                __body["follower_cluster"] = follower_cluster
            if follower_index is not None:
                __body["follower_index"] = follower_index
            if follower_index_uuid is not None:
                __body["follower_index_uuid"] = follower_index_uuid
            if leader_remote_cluster is not None:
                __body["leader_remote_cluster"] = leader_remote_cluster
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="ccr.forget_follower",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def get_auto_follow_pattern(
        self,
        *,
        name: t.Optional[str] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get auto-follow patterns. Get cross-cluster replication auto-follow patterns.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-get-auto-follow-pattern.html>`_

        :param name: Specifies the auto-follow pattern collection that you want to retrieve.
            If you do not specify a name, the API returns information for all collections.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_ccr/auto_follow/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_ccr/auto_follow"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.get_auto_follow_pattern",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def pause_auto_follow_pattern(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Pause an auto-follow pattern. Pause a cross-cluster replication auto-follow pattern.
        When the API returns, the auto-follow pattern is inactive. New indices that are
        created on the remote cluster and match the auto-follow patterns are ignored.
        You can resume auto-following with the resume auto-follow pattern API. When it
        resumes, the auto-follow pattern is active again and automatically configures
        follower indices for newly created indices on the remote cluster that match its
        patterns. Remote indices that were created while the pattern was paused will
        also be followed, unless they have been deleted or closed in the interim.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-pause-auto-follow-pattern.html>`_

        :param name: The name of the auto follow pattern that should pause discovering
            new indices to follow.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_ccr/auto_follow/{__path_parts["name"]}/pause'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.pause_auto_follow_pattern",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def pause_follow(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Pause a follower. Pause a cross-cluster replication follower index. The follower
        index will not fetch any additional operations from the leader index. You can
        resume following with the resume follower API. You can pause and resume a follower
        index to change the configuration of the following task.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-post-pause-follow.html>`_

        :param index: The name of the follower index that should pause following its
            leader index.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/pause_follow'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.pause_follow",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "remote_cluster",
            "follow_index_pattern",
            "leader_index_exclusion_patterns",
            "leader_index_patterns",
            "max_outstanding_read_requests",
            "max_outstanding_write_requests",
            "max_read_request_operation_count",
            "max_read_request_size",
            "max_retry_delay",
            "max_write_buffer_count",
            "max_write_buffer_size",
            "max_write_request_operation_count",
            "max_write_request_size",
            "read_poll_timeout",
            "settings",
        ),
    )
    def put_auto_follow_pattern(
        self,
        *,
        name: str,
        remote_cluster: t.Optional[str] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        follow_index_pattern: t.Optional[str] = None,
        human: t.Optional[bool] = None,
        leader_index_exclusion_patterns: t.Optional[t.Sequence[str]] = None,
        leader_index_patterns: t.Optional[t.Sequence[str]] = None,
        max_outstanding_read_requests: t.Optional[int] = None,
        max_outstanding_write_requests: t.Optional[int] = None,
        max_read_request_operation_count: t.Optional[int] = None,
        max_read_request_size: t.Optional[t.Union[int, str]] = None,
        max_retry_delay: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        max_write_buffer_count: t.Optional[int] = None,
        max_write_buffer_size: t.Optional[t.Union[int, str]] = None,
        max_write_request_operation_count: t.Optional[int] = None,
        max_write_request_size: t.Optional[t.Union[int, str]] = None,
        pretty: t.Optional[bool] = None,
        read_poll_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create or update auto-follow patterns. Create a collection of cross-cluster replication
        auto-follow patterns for a remote cluster. Newly created indices on the remote
        cluster that match any of the patterns are automatically configured as follower
        indices. Indices on the remote cluster that were created before the auto-follow
        pattern was created will not be auto-followed even if they match the pattern.
        This API can also be used to update auto-follow patterns. NOTE: Follower indices
        that were configured automatically before updating an auto-follow pattern will
        remain unchanged even if they do not match against the new patterns.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-put-auto-follow-pattern.html>`_

        :param name: The name of the collection of auto-follow patterns.
        :param remote_cluster: The remote cluster containing the leader indices to match
            against.
        :param follow_index_pattern: The name of follower index. The template {{leader_index}}
            can be used to derive the name of the follower index from the name of the
            leader index. When following a data stream, use {{leader_index}}; CCR does
            not support changes to the names of a follower data stream’s backing indices.
        :param leader_index_exclusion_patterns: An array of simple index patterns that
            can be used to exclude indices from being auto-followed. Indices in the remote
            cluster whose names are matching one or more leader_index_patterns and one
            or more leader_index_exclusion_patterns won’t be followed.
        :param leader_index_patterns: An array of simple index patterns to match against
            indices in the remote cluster specified by the remote_cluster field.
        :param max_outstanding_read_requests: The maximum number of outstanding reads
            requests from the remote cluster.
        :param max_outstanding_write_requests: The maximum number of outstanding reads
            requests from the remote cluster.
        :param max_read_request_operation_count: The maximum number of operations to
            pull per read from the remote cluster.
        :param max_read_request_size: The maximum size in bytes of per read of a batch
            of operations pulled from the remote cluster.
        :param max_retry_delay: The maximum time to wait before retrying an operation
            that failed exceptionally. An exponential backoff strategy is employed when
            retrying.
        :param max_write_buffer_count: The maximum number of operations that can be queued
            for writing. When this limit is reached, reads from the remote cluster will
            be deferred until the number of queued operations goes below the limit.
        :param max_write_buffer_size: The maximum total bytes of operations that can
            be queued for writing. When this limit is reached, reads from the remote
            cluster will be deferred until the total bytes of queued operations goes
            below the limit.
        :param max_write_request_operation_count: The maximum number of operations per
            bulk write request executed on the follower.
        :param max_write_request_size: The maximum total bytes of operations per bulk
            write request executed on the follower.
        :param read_poll_timeout: The maximum time to wait for new operations on the
            remote cluster when the follower index is synchronized with the leader index.
            When the timeout has elapsed, the poll for operations will return to the
            follower so that it can update some statistics. Then the follower will immediately
            attempt to read from the leader again.
        :param settings: Settings to override from the leader index. Note that certain
            settings can not be overrode (e.g., index.number_of_shards).
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        if remote_cluster is None and body is None:
            raise ValueError("Empty value passed for parameter 'remote_cluster'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_ccr/auto_follow/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if remote_cluster is not None:
                __body["remote_cluster"] = remote_cluster
            if follow_index_pattern is not None:
                __body["follow_index_pattern"] = follow_index_pattern
            if leader_index_exclusion_patterns is not None:
                __body["leader_index_exclusion_patterns"] = (
                    leader_index_exclusion_patterns
                )
            if leader_index_patterns is not None:
                __body["leader_index_patterns"] = leader_index_patterns
            if max_outstanding_read_requests is not None:
                __body["max_outstanding_read_requests"] = max_outstanding_read_requests
            if max_outstanding_write_requests is not None:
                __body["max_outstanding_write_requests"] = (
                    max_outstanding_write_requests
                )
            if max_read_request_operation_count is not None:
                __body["max_read_request_operation_count"] = (
                    max_read_request_operation_count
                )
            if max_read_request_size is not None:
                __body["max_read_request_size"] = max_read_request_size
            if max_retry_delay is not None:
                __body["max_retry_delay"] = max_retry_delay
            if max_write_buffer_count is not None:
                __body["max_write_buffer_count"] = max_write_buffer_count
            if max_write_buffer_size is not None:
                __body["max_write_buffer_size"] = max_write_buffer_size
            if max_write_request_operation_count is not None:
                __body["max_write_request_operation_count"] = (
                    max_write_request_operation_count
                )
            if max_write_request_size is not None:
                __body["max_write_request_size"] = max_write_request_size
            if read_poll_timeout is not None:
                __body["read_poll_timeout"] = read_poll_timeout
            if settings is not None:
                __body["settings"] = settings
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="ccr.put_auto_follow_pattern",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def resume_auto_follow_pattern(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Resume an auto-follow pattern. Resume a cross-cluster replication auto-follow
        pattern that was paused. The auto-follow pattern will resume configuring following
        indices for newly created indices that match its patterns on the remote cluster.
        Remote indices created while the pattern was paused will also be followed unless
        they have been deleted or closed in the interim.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-resume-auto-follow-pattern.html>`_

        :param name: The name of the auto follow pattern to resume discovering new indices
            to follow.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_ccr/auto_follow/{__path_parts["name"]}/resume'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.resume_auto_follow_pattern",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "max_outstanding_read_requests",
            "max_outstanding_write_requests",
            "max_read_request_operation_count",
            "max_read_request_size",
            "max_retry_delay",
            "max_write_buffer_count",
            "max_write_buffer_size",
            "max_write_request_operation_count",
            "max_write_request_size",
            "read_poll_timeout",
        ),
    )
    def resume_follow(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        max_outstanding_read_requests: t.Optional[int] = None,
        max_outstanding_write_requests: t.Optional[int] = None,
        max_read_request_operation_count: t.Optional[int] = None,
        max_read_request_size: t.Optional[str] = None,
        max_retry_delay: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        max_write_buffer_count: t.Optional[int] = None,
        max_write_buffer_size: t.Optional[str] = None,
        max_write_request_operation_count: t.Optional[int] = None,
        max_write_request_size: t.Optional[str] = None,
        pretty: t.Optional[bool] = None,
        read_poll_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Resume a follower. Resume a cross-cluster replication follower index that was
        paused. The follower index could have been paused with the pause follower API.
        Alternatively it could be paused due to replication that cannot be retried due
        to failures during following tasks. When this API returns, the follower index
        will resume fetching operations from the leader index.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-post-resume-follow.html>`_

        :param index: The name of the follow index to resume following.
        :param max_outstanding_read_requests:
        :param max_outstanding_write_requests:
        :param max_read_request_operation_count:
        :param max_read_request_size:
        :param max_retry_delay:
        :param max_write_buffer_count:
        :param max_write_buffer_size:
        :param max_write_request_operation_count:
        :param max_write_request_size:
        :param read_poll_timeout:
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/resume_follow'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if max_outstanding_read_requests is not None:
                __body["max_outstanding_read_requests"] = max_outstanding_read_requests
            if max_outstanding_write_requests is not None:
                __body["max_outstanding_write_requests"] = (
                    max_outstanding_write_requests
                )
            if max_read_request_operation_count is not None:
                __body["max_read_request_operation_count"] = (
                    max_read_request_operation_count
                )
            if max_read_request_size is not None:
                __body["max_read_request_size"] = max_read_request_size
            if max_retry_delay is not None:
                __body["max_retry_delay"] = max_retry_delay
            if max_write_buffer_count is not None:
                __body["max_write_buffer_count"] = max_write_buffer_count
            if max_write_buffer_size is not None:
                __body["max_write_buffer_size"] = max_write_buffer_size
            if max_write_request_operation_count is not None:
                __body["max_write_request_operation_count"] = (
                    max_write_request_operation_count
                )
            if max_write_request_size is not None:
                __body["max_write_request_size"] = max_write_request_size
            if read_poll_timeout is not None:
                __body["read_poll_timeout"] = read_poll_timeout
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="ccr.resume_follow",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def stats(
        self,
        *,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get cross-cluster replication stats. This API returns stats about auto-following
        and the same shard-level stats as the get follower stats API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-get-stats.html>`_
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_ccr/stats"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.stats",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    def unfollow(
        self,
        *,
        index: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Unfollow an index. Convert a cross-cluster replication follower index to a regular
        index. The API stops the following task associated with a follower index and
        removes index metadata and settings associated with cross-cluster replication.
        The follower index must be paused and closed before you call the unfollow API.
        NOTE: Currently cross-cluster replication does not support converting an existing
        regular index to a follower index. Converting a follower index to a regular index
        is an irreversible operation.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/ccr-post-unfollow.html>`_

        :param index: The name of the follower index that should be turned into a regular
            index.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_ccr/unfollow'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="ccr.unfollow",
            path_parts=__path_parts,
        )
