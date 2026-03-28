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

from elastic_transport import HeadApiResponse, ObjectApiResponse

from ._base import NamespacedClient
from .utils import (
    SKIP_IN_PATH,
    Stability,
    _quote,
    _rewrite_parameters,
    _stability_warning,
)


class IndicesClient(NamespacedClient):

    @_rewrite_parameters()
    async def add_block(
        self,
        *,
        index: str,
        block: t.Union[str, t.Literal["metadata", "read", "read_only", "write"]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Add an index block. Limits the operations allowed on an index by blocking specific
        operation types.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/index-modules-blocks.html>`_

        :param index: A comma separated list of indices to add a block to
        :param block: The block to add (one of read, write, read_only or metadata)
        :param allow_no_indices: Whether to ignore if a wildcard indices expression resolves
            into no concrete indices. (This includes `_all` string or when no indices
            have been specified)
        :param expand_wildcards: Whether to expand wildcard expression to concrete indices
            that are open, closed or both.
        :param ignore_unavailable: Whether specified concrete indices should be ignored
            when unavailable (missing or closed)
        :param master_timeout: Specify timeout for connection to master
        :param timeout: Explicit operation timeout
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if block in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'block'")
        __path_parts: t.Dict[str, str] = {
            "index": _quote(index),
            "block": _quote(block),
        }
        __path = f'/{__path_parts["index"]}/_block/{__path_parts["block"]}'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.add_block",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "analyzer",
            "attributes",
            "char_filter",
            "explain",
            "field",
            "filter",
            "normalizer",
            "text",
            "tokenizer",
        ),
    )
    async def analyze(
        self,
        *,
        index: t.Optional[str] = None,
        analyzer: t.Optional[str] = None,
        attributes: t.Optional[t.Sequence[str]] = None,
        char_filter: t.Optional[t.Sequence[t.Union[str, t.Mapping[str, t.Any]]]] = None,
        error_trace: t.Optional[bool] = None,
        explain: t.Optional[bool] = None,
        field: t.Optional[str] = None,
        filter: t.Optional[t.Sequence[t.Union[str, t.Mapping[str, t.Any]]]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        normalizer: t.Optional[str] = None,
        pretty: t.Optional[bool] = None,
        text: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        tokenizer: t.Optional[t.Union[str, t.Mapping[str, t.Any]]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get tokens from text analysis. The analyze API performs [analysis](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html)
        on a text string and returns the resulting tokens.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-analyze.html>`_

        :param index: Index used to derive the analyzer. If specified, the `analyzer`
            or field parameter overrides this value. If no index is specified or the
            index does not have a default analyzer, the analyze API uses the standard
            analyzer.
        :param analyzer: The name of the analyzer that should be applied to the provided
            `text`. This could be a built-in analyzer, or an analyzer that’s been configured
            in the index.
        :param attributes: Array of token attributes used to filter the output of the
            `explain` parameter.
        :param char_filter: Array of character filters used to preprocess characters
            before the tokenizer.
        :param explain: If `true`, the response includes token attributes and additional
            details.
        :param field: Field used to derive the analyzer. To use this parameter, you must
            specify an index. If specified, the `analyzer` parameter overrides this value.
        :param filter: Array of token filters used to apply after the tokenizer.
        :param normalizer: Normalizer to use to convert text into a single token.
        :param text: Text to analyze. If an array of strings is provided, it is analyzed
            as a multi-value field.
        :param tokenizer: Tokenizer to use to convert text into tokens.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_analyze'
        else:
            __path_parts = {}
            __path = "/_analyze"
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
            if analyzer is not None:
                __body["analyzer"] = analyzer
            if attributes is not None:
                __body["attributes"] = attributes
            if char_filter is not None:
                __body["char_filter"] = char_filter
            if explain is not None:
                __body["explain"] = explain
            if field is not None:
                __body["field"] = field
            if filter is not None:
                __body["filter"] = filter
            if normalizer is not None:
                __body["normalizer"] = normalizer
            if text is not None:
                __body["text"] = text
            if tokenizer is not None:
                __body["tokenizer"] = tokenizer
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.analyze",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def clear_cache(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        fielddata: t.Optional[bool] = None,
        fields: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        query: t.Optional[bool] = None,
        request: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Clear the cache. Clear the cache of one or more indices. For data streams, the
        API clears the caches of the stream's backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-clearcache.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param fielddata: If `true`, clears the fields cache. Use the `fields` parameter
            to clear the cache of specific fields only.
        :param fields: Comma-separated list of field names used to limit the `fielddata`
            parameter.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param query: If `true`, clears the query cache.
        :param request: If `true`, clears the request cache.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_cache/clear'
        else:
            __path_parts = {}
            __path = "/_cache/clear"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if fielddata is not None:
            __query["fielddata"] = fielddata
        if fields is not None:
            __query["fields"] = fields
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        if query is not None:
            __query["query"] = query
        if request is not None:
            __query["request"] = request
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.clear_cache",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("aliases", "settings"),
    )
    async def clone(
        self,
        *,
        index: str,
        target: str,
        aliases: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Clone an index. Clone an existing index into a new index. Each original primary
        shard is cloned into a new primary shard in the new index. IMPORTANT: Elasticsearch
        does not apply index templates to the resulting index. The API also does not
        copy index metadata from the original index. Index metadata includes aliases,
        index lifecycle management phase definitions, and cross-cluster replication (CCR)
        follower information. For example, if you clone a CCR follower index, the resulting
        clone will not be a follower index. The clone API copies most index settings
        from the source index to the resulting index, with the exception of `index.number_of_replicas`
        and `index.auto_expand_replicas`. To set the number of replicas in the resulting
        index, configure these settings in the clone request. Cloning works as follows:
        * First, it creates a new target index with the same definition as the source
        index. * Then it hard-links segments from the source index into the target index.
        If the file system does not support hard-linking, all segments are copied into
        the new index, which is a much more time consuming process. * Finally, it recovers
        the target index as though it were a closed index which had just been re-opened.
        IMPORTANT: Indices can only be cloned if they meet the following requirements:
        * The target index must not exist. * The source index must have the same number
        of primary shards as the target index. * The node handling the clone process
        must have sufficient free disk space to accommodate a second copy of the existing
        index.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-clone-index.html>`_

        :param index: Name of the source index to clone.
        :param target: Name of the target index to create.
        :param aliases: Aliases for the resulting index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param settings: Configuration options for the target index.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if target in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'target'")
        __path_parts: t.Dict[str, str] = {
            "index": _quote(index),
            "target": _quote(target),
        }
        __path = f'/{__path_parts["index"]}/_clone/{__path_parts["target"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        if not __body:
            if aliases is not None:
                __body["aliases"] = aliases
            if settings is not None:
                __body["settings"] = settings
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.clone",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def close(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Close an index. A closed index is blocked for read or write operations and does
        not allow all operations that opened indices allow. It is not possible to index
        documents or to search for documents in a closed index. Closed indices do not
        have to maintain internal data structures for indexing or searching documents,
        which results in a smaller overhead on the cluster. When opening or closing an
        index, the master node is responsible for restarting the index shards to reflect
        the new state of the index. The shards will then go through the normal recovery
        process. The data of opened and closed indices is automatically replicated by
        the cluster to ensure that enough shard copies are safely kept around at all
        times. You can open and close multiple indices. An error is thrown if the request
        explicitly refers to a missing index. This behaviour can be turned off using
        the `ignore_unavailable=true` parameter. By default, you must explicitly name
        the indices you are opening or closing. To open or close indices with `_all`,
        `*`, or other wildcard expressions, change the` action.destructive_requires_name`
        setting to `false`. This setting can also be changed with the cluster update
        settings API. Closed indices consume a significant amount of disk-space which
        can cause problems in managed environments. Closing indices can be turned off
        with the cluster settings API by setting `cluster.indices.close.enable` to `false`.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-close.html>`_

        :param index: Comma-separated list or wildcard expression of index names used
            to limit the request.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_close'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.close",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("aliases", "mappings", "settings"),
    )
    async def create(
        self,
        *,
        index: str,
        aliases: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        mappings: t.Optional[t.Mapping[str, t.Any]] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create an index. Creates a new index.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-create-index.html>`_

        :param index: Name of the index you wish to create.
        :param aliases: Aliases for the index.
        :param mappings: Mapping for fields in the index. If specified, this mapping
            can include: - Field names - Field data types - Mapping parameters
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param settings: Configuration options for the index.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        if not __body:
            if aliases is not None:
                __body["aliases"] = aliases
            if mappings is not None:
                __body["mappings"] = mappings
            if settings is not None:
                __body["settings"] = settings
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.create",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def create_data_stream(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create a data stream. Creates a data stream. You must have a matching index template
        with data stream enabled.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param name: Name of the data stream, which must meet the following criteria:
            Lowercase only; Cannot include `\\`, `/`, `*`, `?`, `"`, `<`, `>`, `|`, `,`,
            `#`, `:`, or a space character; Cannot start with `-`, `_`, `+`, or `.ds-`;
            Cannot be `.` or `..`; Cannot be longer than 255 bytes. Multi-byte characters
            count towards this limit faster.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.create_data_stream",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def data_streams_stats(
        self,
        *,
        name: t.Optional[str] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get data stream stats. Retrieves statistics for one or more data streams.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param name: Comma-separated list of data streams used to limit the request.
            Wildcard expressions (`*`) are supported. To target all data streams in a
            cluster, omit this parameter or use `*`.
        :param expand_wildcards: Type of data stream that wildcard patterns can match.
            Supports comma-separated values, such as `open,hidden`.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_data_stream/{__path_parts["name"]}/_stats'
        else:
            __path_parts = {}
            __path = "/_data_stream/_stats"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.data_streams_stats",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def delete(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete indices. Deletes one or more indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-delete-index.html>`_

        :param index: Comma-separated list of indices to delete. You cannot specify index
            aliases. By default, this parameter does not support wildcards (`*`) or `_all`.
            To use wildcards or `_all`, set the `action.destructive_requires_name` cluster
            setting to `false`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.delete",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def delete_alias(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        name: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete an alias. Removes a data stream or index from an alias.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-aliases.html>`_

        :param index: Comma-separated list of data streams or indices used to limit the
            request. Supports wildcards (`*`).
        :param name: Comma-separated list of aliases to remove. Supports wildcards (`*`).
            To remove all aliases, use `*` or `_all`.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index), "name": _quote(name)}
        __path = f'/{__path_parts["index"]}/_alias/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.delete_alias",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def delete_data_lifecycle(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete data stream lifecycles. Removes the data stream lifecycle from a data
        stream, rendering it not managed by the data stream lifecycle.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams-delete-lifecycle.html>`_

        :param name: A comma-separated list of data streams of which the data stream
            lifecycle will be deleted; use `*` to get all data streams
        :param expand_wildcards: Whether wildcard expressions should get expanded to
            open or closed indices (default: open)
        :param master_timeout: Specify timeout for connection to master
        :param timeout: Explicit timestamp for the document
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/{__path_parts["name"]}/_lifecycle'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.delete_data_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def delete_data_stream(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete data streams. Deletes one or more data streams and their backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param name: Comma-separated list of data streams to delete. Wildcard (`*`) expressions
            are supported.
        :param expand_wildcards: Type of data stream that wildcard patterns can match.
            Supports comma-separated values,such as `open,hidden`.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.delete_data_stream",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def delete_index_template(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Delete an index template. The provided <index-template> may contain multiple
        template names separated by a comma. If multiple template names are specified
        then there is no wildcard support and the provided names should match completely
        with existing templates.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-delete-template.html>`_

        :param name: Comma-separated list of index template names used to limit the request.
            Wildcard (*) expressions are supported.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_index_template/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.delete_index_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def delete_template(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Deletes a legacy index template.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-delete-template-v1.html>`_

        :param name: The name of the legacy index template to delete. Wildcard (`*`)
            expressions are supported.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_template/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "DELETE",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.delete_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    @_stability_warning(Stability.EXPERIMENTAL)
    async def disk_usage(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flush: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        run_expensive_tasks: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Analyze the index disk usage. Analyze the disk usage of each field of an index
        or data stream. This API might not support indices created in previous Elasticsearch
        versions. The result of a small index can be inaccurate as some parts of an index
        might not be analyzed by the API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-disk-usage.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. It’s recommended to execute this API with a single
            index (or the latest backing index of a data stream) as the API consumes
            resources significantly.
        :param allow_no_indices: If false, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting `foo*,bar*` returns an error if an index starts
            with `foo` but no index starts with `bar`.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`.
        :param flush: If `true`, the API performs a flush before analysis. If `false`,
            the response may not include uncommitted data.
        :param ignore_unavailable: If `true`, missing or closed indices are not included
            in the response.
        :param run_expensive_tasks: Analyzing field disk usage is resource-intensive.
            To use the API, this parameter must be set to `true`.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_disk_usage'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flush is not None:
            __query["flush"] = flush
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        if run_expensive_tasks is not None:
            __query["run_expensive_tasks"] = run_expensive_tasks
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.disk_usage",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_name="config",
    )
    @_stability_warning(Stability.EXPERIMENTAL)
    async def downsample(
        self,
        *,
        index: str,
        target_index: str,
        config: t.Optional[t.Mapping[str, t.Any]] = None,
        body: t.Optional[t.Mapping[str, t.Any]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Downsample an index. Aggregate a time series (TSDS) index and store pre-computed
        statistical summaries (`min`, `max`, `sum`, `value_count` and `avg`) for each
        metric field grouped by a configured time interval. For example, a TSDS index
        that contains metrics sampled every 10 seconds can be downsampled to an hourly
        index. All documents within an hour interval are summarized and stored as a single
        document in the downsample index. NOTE: Only indices in a time series data stream
        are supported. Neither field nor document level security can be defined on the
        source index. The source index must be read only (`index.blocks.write: true`).

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-downsample-data-stream.html>`_

        :param index: Name of the time series index to downsample.
        :param target_index: Name of the index to create.
        :param config:
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if target_index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'target_index'")
        if config is None and body is None:
            raise ValueError(
                "Empty value passed for parameters 'config' and 'body', one of them should be set."
            )
        elif config is not None and body is not None:
            raise ValueError("Cannot set both 'config' and 'body'")
        __path_parts: t.Dict[str, str] = {
            "index": _quote(index),
            "target_index": _quote(target_index),
        }
        __path = f'/{__path_parts["index"]}/_downsample/{__path_parts["target_index"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __body = config if config is not None else body
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.downsample",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def exists(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> HeadApiResponse:
        """
        Check indices. Checks if one or more indices, index aliases, or data streams
        exist.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-exists.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases. Supports
            wildcards (`*`).
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param flat_settings: If `true`, returns settings in flat format.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param include_defaults: If `true`, return all default settings in the response.
        :param local: If `true`, the request retrieves information from the local node
            only.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if local is not None:
            __query["local"] = local
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "HEAD",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.exists",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def exists_alias(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> HeadApiResponse:
        """
        Check aliases. Checks if one or more data stream or index aliases exist.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-aliases.html>`_

        :param name: Comma-separated list of aliases to check. Supports wildcards (`*`).
        :param index: Comma-separated list of data streams or indices used to limit the
            request. Supports wildcards (`*`). To target all data streams and indices,
            omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, requests that include a missing data stream
            or index in the target indices or data streams return an error.
        :param local: If `true`, the request retrieves information from the local node
            only.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH and name not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index), "name": _quote(name)}
            __path = f'/{__path_parts["index"]}/_alias/{__path_parts["name"]}'
        elif name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_alias/{__path_parts["name"]}'
        else:
            raise ValueError("Couldn't find a path for the given parameters")
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if local is not None:
            __query["local"] = local
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "HEAD",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.exists_alias",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def exists_index_template(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> HeadApiResponse:
        """
        Check index templates. Check whether index templates exist.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/index-templates.html>`_

        :param name: Comma-separated list of index template names used to limit the request.
            Wildcard (*) expressions are supported.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_index_template/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "HEAD",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.exists_index_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def exists_template(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> HeadApiResponse:
        """
        Check existence of index templates. Returns information about whether a particular
        index template exists.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-template-exists-v1.html>`_

        :param name: The comma separated names of the index templates
        :param flat_settings: Return settings in flat format (default: false)
        :param local: Return local information, do not retrieve the state from master
            node (default: false)
        :param master_timeout: Explicit operation timeout for connection to master node
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_template/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if local is not None:
            __query["local"] = local
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "HEAD",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.exists_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def explain_data_lifecycle(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get the status for a data stream lifecycle. Get information about an index or
        data stream's current data stream lifecycle status, such as time since index
        creation, time since rollover, the lifecycle configuration managing the index,
        or any errors encountered during lifecycle execution.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams-explain-lifecycle.html>`_

        :param index: The name of the index to explain
        :param include_defaults: indicates if the API should return the default values
            the system uses for the index's lifecycle
        :param master_timeout: Specify timeout for connection to master
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_lifecycle/explain'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.explain_data_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    @_stability_warning(Stability.EXPERIMENTAL)
    async def field_usage_stats(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        fields: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get field usage stats. Get field usage information for each shard and field of
        an index. Field usage statistics are automatically captured when queries are
        running on a cluster. A shard-level search request that accesses a given field,
        even if multiple times during that request, is counted as a single use.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/field-usage-stats.html>`_

        :param index: Comma-separated list or wildcard expression of index names used
            to limit the request.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting `foo*,bar*` returns an error if an index starts
            with `foo` but no index starts with `bar`.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`.
        :param fields: Comma-separated list or wildcard expressions of fields to include
            in the statistics.
        :param ignore_unavailable: If `true`, missing or closed indices are not included
            in the response.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to all or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_field_usage_stats'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if fields is not None:
            __query["fields"] = fields
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.field_usage_stats",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def flush(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        force: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        wait_if_ongoing: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Flush data streams or indices. Flushing a data stream or index is the process
        of making sure that any data that is currently only stored in the transaction
        log is also permanently stored in the Lucene index. When restarting, Elasticsearch
        replays any unflushed operations from the transaction log into the Lucene index
        to bring it back into the state that it was in before the restart. Elasticsearch
        automatically triggers flushes as needed, using heuristics that trade off the
        size of the unflushed transaction log against the cost of performing each flush.
        After each operation has been flushed it is permanently stored in the Lucene
        index. This may mean that there is no need to maintain an additional copy of
        it in the transaction log. The transaction log is made up of multiple files,
        called generations, and Elasticsearch will delete any generation files when they
        are no longer needed, freeing up disk space. It is also possible to trigger a
        flush on one or more indices using the flush API, although it is rare for users
        to need to call this API directly. If you call the flush API after indexing some
        documents then a successful response indicates that Elasticsearch has flushed
        all the documents that were indexed before the flush API was called.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-flush.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases to flush.
            Supports wildcards (`*`). To flush all data streams and indices, omit this
            parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param force: If `true`, the request forces a flush even if there are no changes
            to commit to the index.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param wait_if_ongoing: If `true`, the flush operation blocks until execution
            when another flush operation is running. If `false`, Elasticsearch returns
            an error if you request a flush when another flush operation is running.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_flush'
        else:
            __path_parts = {}
            __path = "/_flush"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if force is not None:
            __query["force"] = force
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        if wait_if_ongoing is not None:
            __query["wait_if_ongoing"] = wait_if_ongoing
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.flush",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def forcemerge(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flush: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        max_num_segments: t.Optional[int] = None,
        only_expunge_deletes: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        wait_for_completion: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Force a merge. Perform the force merge operation on the shards of one or more
        indices. For data streams, the API forces a merge on the shards of the stream's
        backing indices. Merging reduces the number of segments in each shard by merging
        some of them together and also frees up the space used by deleted documents.
        Merging normally happens automatically, but sometimes it is useful to trigger
        a merge manually. WARNING: We recommend force merging only a read-only index
        (meaning the index is no longer receiving writes). When documents are updated
        or deleted, the old version is not immediately removed but instead soft-deleted
        and marked with a "tombstone". These soft-deleted documents are automatically
        cleaned up during regular segment merges. But force merge can cause very large
        (greater than 5 GB) segments to be produced, which are not eligible for regular
        merges. So the number of soft-deleted documents can then grow rapidly, resulting
        in higher disk usage and worse search performance. If you regularly force merge
        an index receiving writes, this can also make snapshots more expensive, since
        the new documents can't be backed up incrementally.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-forcemerge.html>`_

        :param index: A comma-separated list of index names; use `_all` or empty string
            to perform the operation on all indices
        :param allow_no_indices: Whether to ignore if a wildcard indices expression resolves
            into no concrete indices. (This includes `_all` string or when no indices
            have been specified)
        :param expand_wildcards: Whether to expand wildcard expression to concrete indices
            that are open, closed or both.
        :param flush: Specify whether the index should be flushed after performing the
            operation (default: true)
        :param ignore_unavailable: Whether specified concrete indices should be ignored
            when unavailable (missing or closed)
        :param max_num_segments: The number of segments the index should be merged into
            (default: dynamic)
        :param only_expunge_deletes: Specify whether the operation should only expunge
            deleted documents
        :param wait_for_completion: Should the request wait until the force merge is
            completed.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_forcemerge'
        else:
            __path_parts = {}
            __path = "/_forcemerge"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flush is not None:
            __query["flush"] = flush
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if max_num_segments is not None:
            __query["max_num_segments"] = max_num_segments
        if only_expunge_deletes is not None:
            __query["only_expunge_deletes"] = only_expunge_deletes
        if pretty is not None:
            __query["pretty"] = pretty
        if wait_for_completion is not None:
            __query["wait_for_completion"] = wait_for_completion
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.forcemerge",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        features: t.Optional[
            t.Union[
                t.Sequence[t.Union[str, t.Literal["aliases", "mappings", "settings"]]],
                t.Union[str, t.Literal["aliases", "mappings", "settings"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index information. Returns information about one or more indices. For data
        streams, the API returns information about the stream’s backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-get-index.html>`_

        :param index: Comma-separated list of data streams, indices, and index aliases
            used to limit the request. Wildcard expressions (*) are supported.
        :param allow_no_indices: If false, the request returns an error if any wildcard
            expression, index alias, or _all value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting foo*,bar* returns an error if an index starts
            with foo but no index starts with bar.
        :param expand_wildcards: Type of index that wildcard expressions can match. If
            the request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as open,hidden.
        :param features: Return only information on specified index features
        :param flat_settings: If true, returns settings in flat format.
        :param ignore_unavailable: If false, requests that target a missing index return
            an error.
        :param include_defaults: If true, return all default settings in the response.
        :param local: If true, the request retrieves information from the local node
            only. Defaults to false, which means information is retrieved from the master
            node.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if features is not None:
            __query["features"] = features
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if local is not None:
            __query["local"] = local
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_alias(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        name: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get aliases. Retrieves information for one or more data stream or index aliases.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-aliases.html>`_

        :param index: Comma-separated list of data streams or indices used to limit the
            request. Supports wildcards (`*`). To target all data streams and indices,
            omit this parameter or use `*` or `_all`.
        :param name: Comma-separated list of aliases to retrieve. Supports wildcards
            (`*`). To retrieve all aliases, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param local: If `true`, the request retrieves information from the local node
            only.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH and name not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index), "name": _quote(name)}
            __path = f'/{__path_parts["index"]}/_alias/{__path_parts["name"]}'
        elif index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_alias'
        elif name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_alias/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_alias"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if local is not None:
            __query["local"] = local
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_alias",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_data_lifecycle(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get data stream lifecycles. Retrieves the data stream lifecycle configuration
        of one or more data streams.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams-get-lifecycle.html>`_

        :param name: Comma-separated list of data streams to limit the request. Supports
            wildcards (`*`). To target all data streams, omit this parameter or use `*`
            or `_all`.
        :param expand_wildcards: Type of data stream that wildcard patterns can match.
            Supports comma-separated values, such as `open,hidden`. Valid values are:
            `all`, `open`, `closed`, `hidden`, `none`.
        :param include_defaults: If `true`, return all default settings in the response.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/{__path_parts["name"]}/_lifecycle'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_data_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_data_stream(
        self,
        *,
        name: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        verbose: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get data streams. Retrieves information about one or more data streams.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param name: Comma-separated list of data stream names used to limit the request.
            Wildcard (`*`) expressions are supported. If omitted, all data streams are
            returned.
        :param expand_wildcards: Type of data stream that wildcard patterns can match.
            Supports comma-separated values, such as `open,hidden`.
        :param include_defaults: If true, returns all relevant default configurations
            for the index template.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param verbose: Whether the maximum timestamp for each data stream should be
            calculated and returned.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_data_stream/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_data_stream"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if verbose is not None:
            __query["verbose"] = verbose
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_data_stream",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_field_mapping(
        self,
        *,
        fields: t.Union[str, t.Sequence[str]],
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get mapping definitions. Retrieves mapping definitions for one or more fields.
        For data streams, the API retrieves field mappings for the stream’s backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-get-field-mapping.html>`_

        :param fields: Comma-separated list or wildcard expression of fields used to
            limit returned information.
        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param include_defaults: If `true`, return all default settings in the response.
        :param local: If `true`, the request retrieves information from the local node
            only.
        """
        if fields in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'fields'")
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH and fields not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index), "fields": _quote(fields)}
            __path = f'/{__path_parts["index"]}/_mapping/field/{__path_parts["fields"]}'
        elif fields not in SKIP_IN_PATH:
            __path_parts = {"fields": _quote(fields)}
            __path = f'/_mapping/field/{__path_parts["fields"]}'
        else:
            raise ValueError("Couldn't find a path for the given parameters")
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if local is not None:
            __query["local"] = local
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_field_mapping",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_index_template(
        self,
        *,
        name: t.Optional[str] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index templates. Returns information about one or more index templates.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-get-template.html>`_

        :param name: Comma-separated list of index template names used to limit the request.
            Wildcard (*) expressions are supported.
        :param flat_settings: If true, returns settings in flat format.
        :param include_defaults: If true, returns all relevant default configurations
            for the index template.
        :param local: If true, the request retrieves information from the local node
            only. Defaults to false, which means information is retrieved from the master
            node.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_index_template/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_index_template"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if local is not None:
            __query["local"] = local
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_index_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_mapping(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get mapping definitions. Retrieves mapping definitions for one or more indices.
        For data streams, the API retrieves mappings for the stream’s backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-get-mapping.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param local: If `true`, the request retrieves information from the local node
            only.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_mapping'
        else:
            __path_parts = {}
            __path = "/_mapping"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if local is not None:
            __query["local"] = local
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_mapping",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_settings(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        name: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index settings. Returns setting information for one or more indices. For
        data streams, returns setting information for the stream’s backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-get-settings.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param name: Comma-separated list or wildcard expression of settings to retrieve.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting `foo*,bar*` returns an error if an index starts
            with foo but no index starts with `bar`.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`.
        :param flat_settings: If `true`, returns settings in flat format.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param include_defaults: If `true`, return all default settings in the response.
        :param local: If `true`, the request retrieves information from the local node
            only. If `false`, information is retrieved from the master node.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH and name not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index), "name": _quote(name)}
            __path = f'/{__path_parts["index"]}/_settings/{__path_parts["name"]}'
        elif index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_settings'
        elif name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_settings/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_settings"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if local is not None:
            __query["local"] = local
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_settings",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def get_template(
        self,
        *,
        name: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        local: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index templates. Retrieves information about one or more index templates.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-get-template-v1.html>`_

        :param name: Comma-separated list of index template names used to limit the request.
            Wildcard (`*`) expressions are supported. To return all index templates,
            omit this parameter or use a value of `_all` or `*`.
        :param flat_settings: If `true`, returns settings in flat format.
        :param local: If `true`, the request retrieves information from the local node
            only.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_template/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_template"
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if local is not None:
            __query["local"] = local
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.get_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def migrate_to_data_stream(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Convert an index alias to a data stream. Converts an index alias to a data stream.
        You must have a matching index template that is data stream enabled. The alias
        must meet the following criteria: The alias must have a write index; All indices
        for the alias must have a `@timestamp` field mapping of a `date` or `date_nanos`
        field type; The alias must not have any filters; The alias must not use custom
        routing. If successful, the request removes the alias and creates a data stream
        with the same name. The indices for the alias become hidden backing indices for
        the stream. The write index for the alias becomes the write index for the stream.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param name: Name of the index alias to convert to a data stream.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/_migrate/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.migrate_to_data_stream",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("actions",),
    )
    async def modify_data_stream(
        self,
        *,
        actions: t.Optional[t.Sequence[t.Mapping[str, t.Any]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Update data streams. Performs one or more data stream modification actions in
        a single atomic operation.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param actions: Actions to perform.
        """
        if actions is None and body is None:
            raise ValueError("Empty value passed for parameter 'actions'")
        __path_parts: t.Dict[str, str] = {}
        __path = "/_data_stream/_modify"
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
            if actions is not None:
                __body["actions"] = actions
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.modify_data_stream",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def open(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Opens a closed index. For data streams, the API opens any closed backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-open-close.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). By default, you must explicitly
            name the indices you using to limit the request. To limit a request using
            `_all`, `*`, or other wildcard expressions, change the `action.destructive_requires_name`
            setting to false. You can update this setting in the `elasticsearch.yml`
            file or using the cluster update settings API.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_open'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.open",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def promote_data_stream(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Promote a data stream. Promote a data stream from a replicated data stream managed
        by cross-cluster replication (CCR) to a regular data stream. With CCR auto following,
        a data stream from a remote cluster can be replicated to the local cluster. These
        data streams can't be rolled over in the local cluster. These replicated data
        streams roll over only if the upstream data stream rolls over. In the event that
        the remote cluster is no longer available, the data stream in the local cluster
        can be promoted to a regular data stream, which allows these data streams to
        be rolled over in the local cluster. NOTE: When promoting a data stream, ensure
        the local cluster has a data stream enabled index template that matches the data
        stream. If this is missing, the data stream will not be able to roll over until
        a matching index template is created. This will affect the lifecycle management
        of the data stream and interfere with the data stream size and retention.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams.html>`_

        :param name: The name of the data stream
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/_promote/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.promote_data_stream",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "filter",
            "index_routing",
            "is_write_index",
            "routing",
            "search_routing",
        ),
    )
    async def put_alias(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        name: str,
        error_trace: t.Optional[bool] = None,
        filter: t.Optional[t.Mapping[str, t.Any]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        index_routing: t.Optional[str] = None,
        is_write_index: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        routing: t.Optional[str] = None,
        search_routing: t.Optional[str] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create or update an alias. Adds a data stream or index to an alias.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-aliases.html>`_

        :param index: Comma-separated list of data streams or indices to add. Supports
            wildcards (`*`). Wildcard patterns that match both data streams and indices
            return an error.
        :param name: Alias to update. If the alias doesn’t exist, the request creates
            it. Index alias names support date math.
        :param filter: Query used to limit documents the alias can access.
        :param index_routing: Value used to route indexing operations to a specific shard.
            If specified, this overwrites the `routing` value for indexing operations.
            Data stream aliases don’t support this parameter.
        :param is_write_index: If `true`, sets the write index or data stream for the
            alias. If an alias points to multiple indices or data streams and `is_write_index`
            isn’t set, the alias rejects write requests. If an index alias points to
            one index and `is_write_index` isn’t set, the index automatically acts as
            the write index. Data stream aliases don’t automatically set a write data
            stream, even if the alias points to one data stream.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param routing: Value used to route indexing and search operations to a specific
            shard. Data stream aliases don’t support this parameter.
        :param search_routing: Value used to route search operations to a specific shard.
            If specified, this overwrites the `routing` value for search operations.
            Data stream aliases don’t support this parameter.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index), "name": _quote(name)}
        __path = f'/{__path_parts["index"]}/_alias/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if not __body:
            if filter is not None:
                __body["filter"] = filter
            if index_routing is not None:
                __body["index_routing"] = index_routing
            if is_write_index is not None:
                __body["is_write_index"] = is_write_index
            if routing is not None:
                __body["routing"] = routing
            if search_routing is not None:
                __body["search_routing"] = search_routing
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.put_alias",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("data_retention", "downsampling"),
    )
    async def put_data_lifecycle(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        data_retention: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        downsampling: t.Optional[t.Mapping[str, t.Any]] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Update data stream lifecycles. Update the data stream lifecycle of the specified
        data streams.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/data-streams-put-lifecycle.html>`_

        :param name: Comma-separated list of data streams used to limit the request.
            Supports wildcards (`*`). To target all data streams use `*` or `_all`.
        :param data_retention: If defined, every document added to this data stream will
            be stored at least for this time frame. Any time after this duration the
            document could be deleted. When empty, every document in this data stream
            will be stored indefinitely.
        :param downsampling: If defined, every backing index will execute the configured
            downsampling configuration after the backing index is not the data stream
            write index anymore.
        :param expand_wildcards: Type of data stream that wildcard patterns can match.
            Supports comma-separated values, such as `open,hidden`. Valid values are:
            `all`, `hidden`, `open`, `closed`, `none`.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_data_stream/{__path_parts["name"]}/_lifecycle'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if not __body:
            if data_retention is not None:
                __body["data_retention"] = data_retention
            if downsampling is not None:
                __body["downsampling"] = downsampling
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.put_data_lifecycle",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "allow_auto_create",
            "composed_of",
            "data_stream",
            "deprecated",
            "ignore_missing_component_templates",
            "index_patterns",
            "meta",
            "priority",
            "template",
            "version",
        ),
        parameter_aliases={"_meta": "meta"},
    )
    async def put_index_template(
        self,
        *,
        name: str,
        allow_auto_create: t.Optional[bool] = None,
        cause: t.Optional[str] = None,
        composed_of: t.Optional[t.Sequence[str]] = None,
        create: t.Optional[bool] = None,
        data_stream: t.Optional[t.Mapping[str, t.Any]] = None,
        deprecated: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_missing_component_templates: t.Optional[t.Sequence[str]] = None,
        index_patterns: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        meta: t.Optional[t.Mapping[str, t.Any]] = None,
        pretty: t.Optional[bool] = None,
        priority: t.Optional[int] = None,
        template: t.Optional[t.Mapping[str, t.Any]] = None,
        version: t.Optional[int] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create or update an index template. Index templates define settings, mappings,
        and aliases that can be applied automatically to new indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-put-template.html>`_

        :param name: Index or template name
        :param allow_auto_create: This setting overrides the value of the `action.auto_create_index`
            cluster setting. If set to `true` in a template, then indices can be automatically
            created using that template even if auto-creation of indices is disabled
            via `actions.auto_create_index`. If set to `false`, then indices or data
            streams matching the template must always be explicitly created, and may
            never be automatically created.
        :param cause: User defined reason for creating/updating the index template
        :param composed_of: An ordered list of component template names. Component templates
            are merged in the order specified, meaning that the last component template
            specified has the highest precedence.
        :param create: If `true`, this request cannot replace or update existing index
            templates.
        :param data_stream: If this object is included, the template is used to create
            data streams and their backing indices. Supports an empty object. Data streams
            require a matching index template with a `data_stream` object.
        :param deprecated: Marks this index template as deprecated. When creating or
            updating a non-deprecated index template that uses deprecated components,
            Elasticsearch will emit a deprecation warning.
        :param ignore_missing_component_templates: The configuration option ignore_missing_component_templates
            can be used when an index template references a component template that might
            not exist
        :param index_patterns: Name of the index template to create.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param meta: Optional user metadata about the index template. May have any contents.
            This map is not automatically generated by Elasticsearch.
        :param priority: Priority to determine index template precedence when a new data
            stream or index is created. The index template with the highest priority
            is chosen. If no priority is specified the template is treated as though
            it is of priority 0 (lowest priority). This number is not automatically generated
            by Elasticsearch.
        :param template: Template to be applied. It may optionally include an `aliases`,
            `mappings`, or `settings` configuration.
        :param version: Version number used to manage index templates externally. This
            number is not automatically generated by Elasticsearch.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_index_template/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if cause is not None:
            __query["cause"] = cause
        if create is not None:
            __query["create"] = create
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if allow_auto_create is not None:
                __body["allow_auto_create"] = allow_auto_create
            if composed_of is not None:
                __body["composed_of"] = composed_of
            if data_stream is not None:
                __body["data_stream"] = data_stream
            if deprecated is not None:
                __body["deprecated"] = deprecated
            if ignore_missing_component_templates is not None:
                __body["ignore_missing_component_templates"] = (
                    ignore_missing_component_templates
                )
            if index_patterns is not None:
                __body["index_patterns"] = index_patterns
            if meta is not None:
                __body["_meta"] = meta
            if priority is not None:
                __body["priority"] = priority
            if template is not None:
                __body["template"] = template
            if version is not None:
                __body["version"] = version
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.put_index_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "date_detection",
            "dynamic",
            "dynamic_date_formats",
            "dynamic_templates",
            "field_names",
            "meta",
            "numeric_detection",
            "properties",
            "routing",
            "runtime",
            "source",
        ),
        parameter_aliases={
            "_field_names": "field_names",
            "_meta": "meta",
            "_routing": "routing",
            "_source": "source",
        },
    )
    async def put_mapping(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        date_detection: t.Optional[bool] = None,
        dynamic: t.Optional[
            t.Union[str, t.Literal["false", "runtime", "strict", "true"]]
        ] = None,
        dynamic_date_formats: t.Optional[t.Sequence[str]] = None,
        dynamic_templates: t.Optional[
            t.Union[
                t.Mapping[str, t.Mapping[str, t.Any]],
                t.Sequence[t.Mapping[str, t.Mapping[str, t.Any]]],
            ]
        ] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        field_names: t.Optional[t.Mapping[str, t.Any]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        meta: t.Optional[t.Mapping[str, t.Any]] = None,
        numeric_detection: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        properties: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        routing: t.Optional[t.Mapping[str, t.Any]] = None,
        runtime: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        source: t.Optional[t.Mapping[str, t.Any]] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        write_index_only: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Update field mappings. Adds new fields to an existing data stream or index. You
        can also use this API to change the search settings of existing fields. For data
        streams, these changes are applied to all backing indices by default.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-put-mapping.html>`_

        :param index: A comma-separated list of index names the mapping should be added
            to (supports wildcards); use `_all` or omit to add the mapping on all indices.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param date_detection: Controls whether dynamic date detection is enabled.
        :param dynamic: Controls whether new fields are added dynamically.
        :param dynamic_date_formats: If date detection is enabled then new string fields
            are checked against 'dynamic_date_formats' and if the value matches then
            a new date field is added instead of string.
        :param dynamic_templates: Specify dynamic templates for the mapping.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param field_names: Control whether field names are enabled for the index.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param meta: A mapping type can have custom meta data associated with it. These
            are not used at all by Elasticsearch, but can be used to store application-specific
            metadata.
        :param numeric_detection: Automatically map strings into numeric data types for
            all fields.
        :param properties: Mapping for a field. For new fields, this mapping can include:
            - Field name - Field data type - Mapping parameters
        :param routing: Enable making a routing value required on indexed documents.
        :param runtime: Mapping of runtime fields for the index.
        :param source: Control whether the _source field is enabled on the index.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param write_index_only: If `true`, the mappings are applied only to the current
            write index for the target.
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_mapping'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if write_index_only is not None:
            __query["write_index_only"] = write_index_only
        if not __body:
            if date_detection is not None:
                __body["date_detection"] = date_detection
            if dynamic is not None:
                __body["dynamic"] = dynamic
            if dynamic_date_formats is not None:
                __body["dynamic_date_formats"] = dynamic_date_formats
            if dynamic_templates is not None:
                __body["dynamic_templates"] = dynamic_templates
            if field_names is not None:
                __body["_field_names"] = field_names
            if meta is not None:
                __body["_meta"] = meta
            if numeric_detection is not None:
                __body["numeric_detection"] = numeric_detection
            if properties is not None:
                __body["properties"] = properties
            if routing is not None:
                __body["_routing"] = routing
            if runtime is not None:
                __body["runtime"] = runtime
            if source is not None:
                __body["_source"] = source
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.put_mapping",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_name="settings",
    )
    async def put_settings(
        self,
        *,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        body: t.Optional[t.Mapping[str, t.Any]] = None,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        flat_settings: t.Optional[bool] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        preserve_existing: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Update index settings. Changes dynamic index settings in real time. For data
        streams, index setting changes are applied to all backing indices by default.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-update-settings.html>`_

        :param settings:
        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting `foo*,bar*` returns an error if an index starts
            with `foo` but no index starts with `bar`.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`.
        :param flat_settings: If `true`, returns settings in flat format.
        :param ignore_unavailable: If `true`, returns settings in flat format.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param preserve_existing: If `true`, existing index settings remain unchanged.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        if settings is None and body is None:
            raise ValueError(
                "Empty value passed for parameters 'settings' and 'body', one of them should be set."
            )
        elif settings is not None and body is not None:
            raise ValueError("Cannot set both 'settings' and 'body'")
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_settings'
        else:
            __path_parts = {}
            __path = "/_settings"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if flat_settings is not None:
            __query["flat_settings"] = flat_settings
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if preserve_existing is not None:
            __query["preserve_existing"] = preserve_existing
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        __body = settings if settings is not None else body
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.put_settings",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "aliases",
            "index_patterns",
            "mappings",
            "order",
            "settings",
            "version",
        ),
    )
    async def put_template(
        self,
        *,
        name: str,
        aliases: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        cause: t.Optional[str] = None,
        create: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        index_patterns: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        mappings: t.Optional[t.Mapping[str, t.Any]] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        order: t.Optional[int] = None,
        pretty: t.Optional[bool] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        version: t.Optional[int] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create or update an index template. Index templates define settings, mappings,
        and aliases that can be applied automatically to new indices. Elasticsearch applies
        templates to new indices based on an index pattern that matches the index name.
        IMPORTANT: This documentation is about legacy index templates, which are deprecated
        and will be replaced by the composable templates introduced in Elasticsearch
        7.8. Composable templates always take precedence over legacy templates. If no
        composable template matches a new index, matching legacy templates are applied
        according to their order. Index templates are only applied during index creation.
        Changes to index templates do not affect existing indices. Settings and mappings
        specified in create index API requests override any settings or mappings specified
        in an index template.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-templates-v1.html>`_

        :param name: The name of the template
        :param aliases: Aliases for the index.
        :param cause:
        :param create: If true, this request cannot replace or update existing index
            templates.
        :param index_patterns: Array of wildcard expressions used to match the names
            of indices during creation.
        :param mappings: Mapping for fields in the index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param order: Order in which Elasticsearch applies this template if index matches
            multiple templates. Templates with lower 'order' values are merged first.
            Templates with higher 'order' values are merged later, overriding templates
            with lower values.
        :param settings: Configuration options for the index.
        :param version: Version number used to manage index templates externally. This
            number is not automatically generated by Elasticsearch.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_template/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if cause is not None:
            __query["cause"] = cause
        if create is not None:
            __query["create"] = create
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if aliases is not None:
                __body["aliases"] = aliases
            if index_patterns is not None:
                __body["index_patterns"] = index_patterns
            if mappings is not None:
                __body["mappings"] = mappings
            if order is not None:
                __body["order"] = order
            if settings is not None:
                __body["settings"] = settings
            if version is not None:
                __body["version"] = version
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.put_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def recovery(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        active_only: t.Optional[bool] = None,
        detailed: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index recovery information. Get information about ongoing and completed shard
        recoveries for one or more indices. For data streams, the API returns information
        for the stream's backing indices. Shard recovery is the process of initializing
        a shard copy, such as restoring a primary shard from a snapshot or creating a
        replica shard from a primary shard. When a shard recovery completes, the recovered
        shard is available for search and indexing. Recovery automatically occurs during
        the following processes: * When creating an index for the first time. * When
        a node rejoins the cluster and starts up any missing primary shard copies using
        the data that it holds in its data path. * Creation of new replica shard copies
        from the primary. * Relocation of a shard copy to a different node in the same
        cluster. * A snapshot restore operation. * A clone, shrink, or split operation.
        You can determine the cause of a shard recovery using the recovery or cat recovery
        APIs. The index recovery API reports information about completed recoveries only
        for shard copies that currently exist in the cluster. It only reports the last
        recovery for each shard copy and does not report historical information about
        earlier recoveries, nor does it report information about the recoveries of shard
        copies that no longer exist. This means that if a shard copy completes a recovery
        and then Elasticsearch relocates it onto a different node then the information
        about the original recovery will not be shown in the recovery API.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-recovery.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param active_only: If `true`, the response only includes ongoing shard recoveries.
        :param detailed: If `true`, the response includes detailed information about
            shard recoveries.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_recovery'
        else:
            __path_parts = {}
            __path = "/_recovery"
        __query: t.Dict[str, t.Any] = {}
        if active_only is not None:
            __query["active_only"] = active_only
        if detailed is not None:
            __query["detailed"] = detailed
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.recovery",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def refresh(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Refresh an index. A refresh makes recent operations performed on one or more
        indices available for search. For data streams, the API runs the refresh operation
        on the stream’s backing indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-refresh.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_refresh'
        else:
            __path_parts = {}
            __path = "/_refresh"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.refresh",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def reload_search_analyzers(
        self,
        *,
        index: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Reload search analyzers. Reload an index's search analyzers and their resources.
        For data streams, the API reloads search analyzers and resources for the stream's
        backing indices. IMPORTANT: After reloading the search analyzers you should clear
        the request cache to make sure it doesn't contain responses derived from the
        previous versions of the analyzer. You can use the reload search analyzers API
        to pick up changes to synonym files used in the `synonym_graph` or `synonym`
        token filter of a search analyzer. To be eligible, the token filter must have
        an `updateable` flag of `true` and only be used in search analyzers. NOTE: This
        API does not perform a reload for each shard of an index. Instead, it performs
        a reload for each node containing index shards. As a result, the total shard
        count returned by the API can differ from the number of index shards. Because
        reloading affects every node with an index shard, it is important to update the
        synonym file on every data node in the cluster--including nodes that don't contain
        a shard replica--before using this API. This ensures the synonym file is updated
        everywhere in the cluster in case shards are relocated in the future.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-reload-analyzers.html>`_

        :param index: A comma-separated list of index names to reload analyzers for
        :param allow_no_indices: Whether to ignore if a wildcard indices expression resolves
            into no concrete indices. (This includes `_all` string or when no indices
            have been specified)
        :param expand_wildcards: Whether to expand wildcard expression to concrete indices
            that are open, closed or both.
        :param ignore_unavailable: Whether specified concrete indices should be ignored
            when unavailable (missing or closed)
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_reload_search_analyzers'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.reload_search_analyzers",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def resolve_cluster(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_throttled: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Resolve the cluster. Resolve the specified index expressions to return information
        about each cluster, including the local cluster, if included. Multiple patterns
        and remote clusters are supported. This endpoint is useful before doing a cross-cluster
        search in order to determine which remote clusters should be included in a search.
        You use the same index expression with this endpoint as you would for cross-cluster
        search. Index and cluster exclusions are also supported with this endpoint. For
        each cluster in the index expression, information is returned about: * Whether
        the querying ("local") cluster is currently connected to each remote cluster
        in the index expression scope. * Whether each remote cluster is configured with
        `skip_unavailable` as `true` or `false`. * Whether there are any indices, aliases,
        or data streams on that cluster that match the index expression. * Whether the
        search is likely to have errors returned when you do the cross-cluster search
        (including any authorization errors if you do not have permission to query the
        index). * Cluster version information, including the Elasticsearch server version.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-resolve-cluster-api.html>`_

        :param name: Comma-separated name(s) or index pattern(s) of the indices, aliases,
            and data streams to resolve. Resources on remote clusters can be specified
            using the `<cluster>`:`<name>` syntax.
        :param allow_no_indices: If false, the request returns an error if any wildcard
            expression, index alias, or _all value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting foo*,bar* returns an error if an index starts
            with foo but no index starts with bar.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_throttled: If true, concrete, expanded or aliased indices are ignored
            when frozen. Defaults to false.
        :param ignore_unavailable: If false, the request returns an error if it targets
            a missing or closed index. Defaults to false.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_resolve/cluster/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_throttled is not None:
            __query["ignore_throttled"] = ignore_throttled
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.resolve_cluster",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def resolve_index(
        self,
        *,
        name: t.Union[str, t.Sequence[str]],
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Resolve indices. Resolve the names and/or index patterns for indices, aliases,
        and data streams. Multiple patterns and remote clusters are supported.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-resolve-index-api.html>`_

        :param name: Comma-separated name(s) or index pattern(s) of the indices, aliases,
            and data streams to resolve. Resources on remote clusters can be specified
            using the `<cluster>`:`<name>` syntax.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices. For
            example, a request targeting `foo*,bar*` returns an error if an index starts
            with `foo` but no index starts with `bar`.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_resolve/index/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.resolve_index",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("aliases", "conditions", "mappings", "settings"),
    )
    async def rollover(
        self,
        *,
        alias: str,
        new_index: t.Optional[str] = None,
        aliases: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        conditions: t.Optional[t.Mapping[str, t.Any]] = None,
        dry_run: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        mappings: t.Optional[t.Mapping[str, t.Any]] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Roll over to a new index. Creates a new index for a data stream or index alias.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-rollover-index.html>`_

        :param alias: Name of the data stream or index alias to roll over.
        :param new_index: Name of the index to create. Supports date math. Data streams
            do not support this parameter.
        :param aliases: Aliases for the target index. Data streams do not support this
            parameter.
        :param conditions: Conditions for the rollover. If specified, Elasticsearch only
            performs the rollover if the current index satisfies these conditions. If
            this parameter is not specified, Elasticsearch performs the rollover unconditionally.
            If conditions are specified, at least one of them must be a `max_*` condition.
            The index will rollover if any `max_*` condition is satisfied and all `min_*`
            conditions are satisfied.
        :param dry_run: If `true`, checks whether the current index satisfies the specified
            conditions but does not perform a rollover.
        :param mappings: Mapping for fields in the index. If specified, this mapping
            can include field names, field data types, and mapping paramaters.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param settings: Configuration options for the index. Data streams do not support
            this parameter.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to all or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if alias in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'alias'")
        __path_parts: t.Dict[str, str]
        if alias not in SKIP_IN_PATH and new_index not in SKIP_IN_PATH:
            __path_parts = {"alias": _quote(alias), "new_index": _quote(new_index)}
            __path = f'/{__path_parts["alias"]}/_rollover/{__path_parts["new_index"]}'
        elif alias not in SKIP_IN_PATH:
            __path_parts = {"alias": _quote(alias)}
            __path = f'/{__path_parts["alias"]}/_rollover'
        else:
            raise ValueError("Couldn't find a path for the given parameters")
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if dry_run is not None:
            __query["dry_run"] = dry_run
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        if not __body:
            if aliases is not None:
                __body["aliases"] = aliases
            if conditions is not None:
                __body["conditions"] = conditions
            if mappings is not None:
                __body["mappings"] = mappings
            if settings is not None:
                __body["settings"] = settings
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.rollover",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def segments(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        verbose: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index segments. Get low-level information about the Lucene segments in index
        shards. For data streams, the API returns information about the stream's backing
        indices.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-segments.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases used
            to limit the request. Supports wildcards (`*`). To target all data streams
            and indices, omit this parameter or use `*` or `_all`.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param verbose: If `true`, the request returns a verbose response.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_segments'
        else:
            __path_parts = {}
            __path = "/_segments"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        if verbose is not None:
            __query["verbose"] = verbose
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.segments",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def shard_stores(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        status: t.Optional[
            t.Union[
                t.Sequence[t.Union[str, t.Literal["all", "green", "red", "yellow"]]],
                t.Union[str, t.Literal["all", "green", "red", "yellow"]],
            ]
        ] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index shard stores. Get store information about replica shards in one or
        more indices. For data streams, the API retrieves store information for the stream's
        backing indices. The index shard stores API returns the following information:
        * The node on which each replica shard exists. * The allocation ID for each replica
        shard. * A unique ID for each replica shard. * Any errors encountered while opening
        the shard index or from an earlier failure. By default, the API returns store
        information only for primary shards that are unassigned or have one or more unassigned
        replica shards.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-shards-stores.html>`_

        :param index: List of data streams, indices, and aliases used to limit the request.
        :param allow_no_indices: If false, the request returns an error if any wildcard
            expression, index alias, or _all value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams.
        :param ignore_unavailable: If true, missing or closed indices are not included
            in the response.
        :param status: List of shard health statuses used to limit the request.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_shard_stores'
        else:
            __path_parts = {}
            __path = "/_shard_stores"
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if pretty is not None:
            __query["pretty"] = pretty
        if status is not None:
            __query["status"] = status
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.shard_stores",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("aliases", "settings"),
    )
    async def shrink(
        self,
        *,
        index: str,
        target: str,
        aliases: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Shrink an index. Shrink an index into a new index with fewer primary shards.
        Before you can shrink an index: * The index must be read-only. * A copy of every
        shard in the index must reside on the same node. * The index must have a green
        health status. To make shard allocation easier, we recommend you also remove
        the index's replica shards. You can later re-add replica shards as part of the
        shrink operation. The requested number of primary shards in the target index
        must be a factor of the number of shards in the source index. For example an
        index with 8 primary shards can be shrunk into 4, 2 or 1 primary shards or an
        index with 15 primary shards can be shrunk into 5, 3 or 1. If the number of shards
        in the index is a prime number it can only be shrunk into a single primary shard
        Before shrinking, a (primary or replica) copy of every shard in the index must
        be present on the same node. The current write index on a data stream cannot
        be shrunk. In order to shrink the current write index, the data stream must first
        be rolled over so that a new write index is created and then the previous write
        index can be shrunk. A shrink operation: * Creates a new target index with the
        same definition as the source index, but with a smaller number of primary shards.
        * Hard-links segments from the source index into the target index. If the file
        system does not support hard-linking, then all segments are copied into the new
        index, which is a much more time consuming process. Also if using multiple data
        paths, shards on different data paths require a full copy of segment files if
        they are not on the same disk since hardlinks do not work across disks. * Recovers
        the target index as though it were a closed index which had just been re-opened.
        Recovers shards to the `.routing.allocation.initial_recovery._id` index setting.
        IMPORTANT: Indices can only be shrunk if they satisfy the following requirements:
        * The target index must not exist. * The source index must have more primary
        shards than the target index. * The number of primary shards in the target index
        must be a factor of the number of primary shards in the source index. The source
        index must have more primary shards than the target index. * The index must not
        contain more than 2,147,483,519 documents in total across all shards that will
        be shrunk into a single shard on the target index as this is the maximum number
        of docs that can fit into a single shard. * The node handling the shrink process
        must have sufficient free disk space to accommodate a second copy of the existing
        index.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-shrink-index.html>`_

        :param index: Name of the source index to shrink.
        :param target: Name of the target index to create.
        :param aliases: The key is the alias name. Index alias names support date math.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param settings: Configuration options for the target index.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if target in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'target'")
        __path_parts: t.Dict[str, str] = {
            "index": _quote(index),
            "target": _quote(target),
        }
        __path = f'/{__path_parts["index"]}/_shrink/{__path_parts["target"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        if not __body:
            if aliases is not None:
                __body["aliases"] = aliases
            if settings is not None:
                __body["settings"] = settings
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.shrink",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def simulate_index_template(
        self,
        *,
        name: str,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        include_defaults: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Simulate an index. Returns the index configuration that would be applied to the
        specified index from an existing index template.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-simulate-index.html>`_

        :param name: Name of the index to simulate
        :param include_defaults: If true, returns all relevant default configurations
            for the index template.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        """
        if name in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'name'")
        __path_parts: t.Dict[str, str] = {"name": _quote(name)}
        __path = f'/_index_template/_simulate_index/{__path_parts["name"]}'
        __query: t.Dict[str, t.Any] = {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.simulate_index_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=(
            "allow_auto_create",
            "composed_of",
            "data_stream",
            "deprecated",
            "ignore_missing_component_templates",
            "index_patterns",
            "meta",
            "priority",
            "template",
            "version",
        ),
        parameter_aliases={"_meta": "meta"},
    )
    async def simulate_template(
        self,
        *,
        name: t.Optional[str] = None,
        allow_auto_create: t.Optional[bool] = None,
        composed_of: t.Optional[t.Sequence[str]] = None,
        create: t.Optional[bool] = None,
        data_stream: t.Optional[t.Mapping[str, t.Any]] = None,
        deprecated: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_missing_component_templates: t.Optional[t.Sequence[str]] = None,
        include_defaults: t.Optional[bool] = None,
        index_patterns: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        meta: t.Optional[t.Mapping[str, t.Any]] = None,
        pretty: t.Optional[bool] = None,
        priority: t.Optional[int] = None,
        template: t.Optional[t.Mapping[str, t.Any]] = None,
        version: t.Optional[int] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Simulate an index template. Returns the index configuration that would be applied
        by a particular index template.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-simulate-template.html>`_

        :param name: Name of the index template to simulate. To test a template configuration
            before you add it to the cluster, omit this parameter and specify the template
            configuration in the request body.
        :param allow_auto_create: This setting overrides the value of the `action.auto_create_index`
            cluster setting. If set to `true` in a template, then indices can be automatically
            created using that template even if auto-creation of indices is disabled
            via `actions.auto_create_index`. If set to `false`, then indices or data
            streams matching the template must always be explicitly created, and may
            never be automatically created.
        :param composed_of: An ordered list of component template names. Component templates
            are merged in the order specified, meaning that the last component template
            specified has the highest precedence.
        :param create: If true, the template passed in the body is only used if no existing
            templates match the same index patterns. If false, the simulation uses the
            template with the highest priority. Note that the template is not permanently
            added or updated in either case; it is only used for the simulation.
        :param data_stream: If this object is included, the template is used to create
            data streams and their backing indices. Supports an empty object. Data streams
            require a matching index template with a `data_stream` object.
        :param deprecated: Marks this index template as deprecated. When creating or
            updating a non-deprecated index template that uses deprecated components,
            Elasticsearch will emit a deprecation warning.
        :param ignore_missing_component_templates: The configuration option ignore_missing_component_templates
            can be used when an index template references a component template that might
            not exist
        :param include_defaults: If true, returns all relevant default configurations
            for the index template.
        :param index_patterns: Array of wildcard (`*`) expressions used to match the
            names of data streams and indices during creation.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param meta: Optional user metadata about the index template. May have any contents.
            This map is not automatically generated by Elasticsearch.
        :param priority: Priority to determine index template precedence when a new data
            stream or index is created. The index template with the highest priority
            is chosen. If no priority is specified the template is treated as though
            it is of priority 0 (lowest priority). This number is not automatically generated
            by Elasticsearch.
        :param template: Template to be applied. It may optionally include an `aliases`,
            `mappings`, or `settings` configuration.
        :param version: Version number used to manage index templates externally. This
            number is not automatically generated by Elasticsearch.
        """
        __path_parts: t.Dict[str, str]
        if name not in SKIP_IN_PATH:
            __path_parts = {"name": _quote(name)}
            __path = f'/_index_template/_simulate/{__path_parts["name"]}'
        else:
            __path_parts = {}
            __path = "/_index_template/_simulate"
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if create is not None:
            __query["create"] = create
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if include_defaults is not None:
            __query["include_defaults"] = include_defaults
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if allow_auto_create is not None:
                __body["allow_auto_create"] = allow_auto_create
            if composed_of is not None:
                __body["composed_of"] = composed_of
            if data_stream is not None:
                __body["data_stream"] = data_stream
            if deprecated is not None:
                __body["deprecated"] = deprecated
            if ignore_missing_component_templates is not None:
                __body["ignore_missing_component_templates"] = (
                    ignore_missing_component_templates
                )
            if index_patterns is not None:
                __body["index_patterns"] = index_patterns
            if meta is not None:
                __body["_meta"] = meta
            if priority is not None:
                __body["priority"] = priority
            if template is not None:
                __body["template"] = template
            if version is not None:
                __body["version"] = version
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.simulate_template",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("aliases", "settings"),
    )
    async def split(
        self,
        *,
        index: str,
        target: str,
        aliases: t.Optional[t.Mapping[str, t.Mapping[str, t.Any]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        settings: t.Optional[t.Mapping[str, t.Any]] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[
            t.Union[int, t.Union[str, t.Literal["all", "index-setting"]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Split an index. Split an index into a new index with more primary shards. * Before
        you can split an index: * The index must be read-only. * The cluster health status
        must be green. The number of times the index can be split (and the number of
        shards that each original shard can be split into) is determined by the `index.number_of_routing_shards`
        setting. The number of routing shards specifies the hashing space that is used
        internally to distribute documents across shards with consistent hashing. For
        instance, a 5 shard index with `number_of_routing_shards` set to 30 (5 x 2 x
        3) could be split by a factor of 2 or 3. A split operation: * Creates a new target
        index with the same definition as the source index, but with a larger number
        of primary shards. * Hard-links segments from the source index into the target
        index. If the file system doesn't support hard-linking, all segments are copied
        into the new index, which is a much more time consuming process. * Hashes all
        documents again, after low level files are created, to delete documents that
        belong to a different shard. * Recovers the target index as though it were a
        closed index which had just been re-opened. IMPORTANT: Indices can only be split
        if they satisfy the following requirements: * The target index must not exist.
        * The source index must have fewer primary shards than the target index. * The
        number of primary shards in the target index must be a multiple of the number
        of primary shards in the source index. * The node handling the split process
        must have sufficient free disk space to accommodate a second copy of the existing
        index.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-split-index.html>`_

        :param index: Name of the source index to split.
        :param target: Name of the target index to create.
        :param aliases: Aliases for the resulting index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param settings: Configuration options for the target index.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        if target in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'target'")
        __path_parts: t.Dict[str, str] = {
            "index": _quote(index),
            "target": _quote(target),
        }
        __path = f'/{__path_parts["index"]}/_split/{__path_parts["target"]}'
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        if not __body:
            if aliases is not None:
                __body["aliases"] = aliases
            if settings is not None:
                __body["settings"] = settings
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "PUT",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.split",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def stats(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        metric: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        completion_fields: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        fielddata_fields: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        fields: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        forbid_closed_indices: t.Optional[bool] = None,
        groups: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        include_segment_file_sizes: t.Optional[bool] = None,
        include_unloaded_segments: t.Optional[bool] = None,
        level: t.Optional[
            t.Union[str, t.Literal["cluster", "indices", "shards"]]
        ] = None,
        pretty: t.Optional[bool] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Get index statistics. For data streams, the API retrieves statistics for the
        stream's backing indices. By default, the returned statistics are index-level
        with `primaries` and `total` aggregations. `primaries` are the values for only
        the primary shards. `total` are the accumulated values for both primary and replica
        shards. To get shard-level statistics, set the `level` parameter to `shards`.
        NOTE: When moving to another node, the shard-level statistics for a shard are
        cleared. Although the shard is no longer part of the node, that node retains
        any node-level statistics to which the shard contributed.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-stats.html>`_

        :param index: A comma-separated list of index names; use `_all` or empty string
            to perform the operation on all indices
        :param metric: Limit the information returned the specific metrics.
        :param completion_fields: Comma-separated list or wildcard expressions of fields
            to include in fielddata and suggest statistics.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`.
        :param fielddata_fields: Comma-separated list or wildcard expressions of fields
            to include in fielddata statistics.
        :param fields: Comma-separated list or wildcard expressions of fields to include
            in the statistics.
        :param forbid_closed_indices: If true, statistics are not collected from closed
            indices.
        :param groups: Comma-separated list of search groups to include in the search
            statistics.
        :param include_segment_file_sizes: If true, the call reports the aggregated disk
            usage of each one of the Lucene index files (only applies if segment stats
            are requested).
        :param include_unloaded_segments: If true, the response includes information
            from segments that are not loaded into memory.
        :param level: Indicates whether statistics are aggregated at the cluster, index,
            or shard level.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH and metric not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index), "metric": _quote(metric)}
            __path = f'/{__path_parts["index"]}/_stats/{__path_parts["metric"]}'
        elif index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_stats'
        elif metric not in SKIP_IN_PATH:
            __path_parts = {"metric": _quote(metric)}
            __path = f'/_stats/{__path_parts["metric"]}'
        else:
            __path_parts = {}
            __path = "/_stats"
        __query: t.Dict[str, t.Any] = {}
        if completion_fields is not None:
            __query["completion_fields"] = completion_fields
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if fielddata_fields is not None:
            __query["fielddata_fields"] = fielddata_fields
        if fields is not None:
            __query["fields"] = fields
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if forbid_closed_indices is not None:
            __query["forbid_closed_indices"] = forbid_closed_indices
        if groups is not None:
            __query["groups"] = groups
        if human is not None:
            __query["human"] = human
        if include_segment_file_sizes is not None:
            __query["include_segment_file_sizes"] = include_segment_file_sizes
        if include_unloaded_segments is not None:
            __query["include_unloaded_segments"] = include_unloaded_segments
        if level is not None:
            __query["level"] = level
        if pretty is not None:
            __query["pretty"] = pretty
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "GET",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.stats",
            path_parts=__path_parts,
        )

    @_rewrite_parameters()
    async def unfreeze(
        self,
        *,
        index: str,
        allow_no_indices: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        wait_for_active_shards: t.Optional[str] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Unfreeze an index. When a frozen index is unfrozen, the index goes through the
        normal recovery process and becomes writeable again.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/unfreeze-index-api.html>`_

        :param index: Identifier for the index.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        :param wait_for_active_shards: The number of shard copies that must be active
            before proceeding with the operation. Set to `all` or any positive integer
            up to the total number of shards in the index (`number_of_replicas+1`).
        """
        if index in SKIP_IN_PATH:
            raise ValueError("Empty value passed for parameter 'index'")
        __path_parts: t.Dict[str, str] = {"index": _quote(index)}
        __path = f'/{__path_parts["index"]}/_unfreeze'
        __query: t.Dict[str, t.Any] = {}
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if wait_for_active_shards is not None:
            __query["wait_for_active_shards"] = wait_for_active_shards
        __headers = {"accept": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            endpoint_id="indices.unfreeze",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("actions",),
    )
    async def update_aliases(
        self,
        *,
        actions: t.Optional[t.Sequence[t.Mapping[str, t.Any]]] = None,
        error_trace: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        master_timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        pretty: t.Optional[bool] = None,
        timeout: t.Optional[t.Union[str, t.Literal[-1], t.Literal[0]]] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Create or update an alias. Adds a data stream or index to an alias.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/indices-aliases.html>`_

        :param actions: Actions to perform.
        :param master_timeout: Period to wait for a connection to the master node. If
            no response is received before the timeout expires, the request fails and
            returns an error.
        :param timeout: Period to wait for a response. If no response is received before
            the timeout expires, the request fails and returns an error.
        """
        __path_parts: t.Dict[str, str] = {}
        __path = "/_aliases"
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if master_timeout is not None:
            __query["master_timeout"] = master_timeout
        if pretty is not None:
            __query["pretty"] = pretty
        if timeout is not None:
            __query["timeout"] = timeout
        if not __body:
            if actions is not None:
                __body["actions"] = actions
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.update_aliases",
            path_parts=__path_parts,
        )

    @_rewrite_parameters(
        body_fields=("query",),
    )
    async def validate_query(
        self,
        *,
        index: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        all_shards: t.Optional[bool] = None,
        allow_no_indices: t.Optional[bool] = None,
        analyze_wildcard: t.Optional[bool] = None,
        analyzer: t.Optional[str] = None,
        default_operator: t.Optional[t.Union[str, t.Literal["and", "or"]]] = None,
        df: t.Optional[str] = None,
        error_trace: t.Optional[bool] = None,
        expand_wildcards: t.Optional[
            t.Union[
                t.Sequence[
                    t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]]
                ],
                t.Union[str, t.Literal["all", "closed", "hidden", "none", "open"]],
            ]
        ] = None,
        explain: t.Optional[bool] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        human: t.Optional[bool] = None,
        ignore_unavailable: t.Optional[bool] = None,
        lenient: t.Optional[bool] = None,
        pretty: t.Optional[bool] = None,
        q: t.Optional[str] = None,
        query: t.Optional[t.Mapping[str, t.Any]] = None,
        rewrite: t.Optional[bool] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Validate a query. Validates a query without running it.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/search-validate.html>`_

        :param index: Comma-separated list of data streams, indices, and aliases to search.
            Supports wildcards (`*`). To search all data streams or indices, omit this
            parameter or use `*` or `_all`.
        :param all_shards: If `true`, the validation is executed on all shards instead
            of one random shard per index.
        :param allow_no_indices: If `false`, the request returns an error if any wildcard
            expression, index alias, or `_all` value targets only missing or closed indices.
            This behavior applies even if the request targets other open indices.
        :param analyze_wildcard: If `true`, wildcard and prefix queries are analyzed.
        :param analyzer: Analyzer to use for the query string. This parameter can only
            be used when the `q` query string parameter is specified.
        :param default_operator: The default operator for query string query: `AND` or
            `OR`.
        :param df: Field to use as default where no field prefix is given in the query
            string. This parameter can only be used when the `q` query string parameter
            is specified.
        :param expand_wildcards: Type of index that wildcard patterns can match. If the
            request can target data streams, this argument determines whether wildcard
            expressions match hidden data streams. Supports comma-separated values, such
            as `open,hidden`. Valid values are: `all`, `open`, `closed`, `hidden`, `none`.
        :param explain: If `true`, the response returns detailed information if an error
            has occurred.
        :param ignore_unavailable: If `false`, the request returns an error if it targets
            a missing or closed index.
        :param lenient: If `true`, format-based query failures (such as providing text
            to a numeric field) in the query string will be ignored.
        :param q: Query in the Lucene query string syntax.
        :param query: Query in the Lucene query string syntax.
        :param rewrite: If `true`, returns a more detailed explanation showing the actual
            Lucene query that will be executed.
        """
        __path_parts: t.Dict[str, str]
        if index not in SKIP_IN_PATH:
            __path_parts = {"index": _quote(index)}
            __path = f'/{__path_parts["index"]}/_validate/query'
        else:
            __path_parts = {}
            __path = "/_validate/query"
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if all_shards is not None:
            __query["all_shards"] = all_shards
        if allow_no_indices is not None:
            __query["allow_no_indices"] = allow_no_indices
        if analyze_wildcard is not None:
            __query["analyze_wildcard"] = analyze_wildcard
        if analyzer is not None:
            __query["analyzer"] = analyzer
        if default_operator is not None:
            __query["default_operator"] = default_operator
        if df is not None:
            __query["df"] = df
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if expand_wildcards is not None:
            __query["expand_wildcards"] = expand_wildcards
        if explain is not None:
            __query["explain"] = explain
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if human is not None:
            __query["human"] = human
        if ignore_unavailable is not None:
            __query["ignore_unavailable"] = ignore_unavailable
        if lenient is not None:
            __query["lenient"] = lenient
        if pretty is not None:
            __query["pretty"] = pretty
        if q is not None:
            __query["q"] = q
        if rewrite is not None:
            __query["rewrite"] = rewrite
        if not __body:
            if query is not None:
                __body["query"] = query
        if not __body:
            __body = None  # type: ignore[assignment]
        __headers = {"accept": "application/json"}
        if __body is not None:
            __headers["content-type"] = "application/json"
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="indices.validate_query",
            path_parts=__path_parts,
        )
