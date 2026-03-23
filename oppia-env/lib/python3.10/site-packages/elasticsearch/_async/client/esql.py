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
from .utils import _rewrite_parameters


class EsqlClient(NamespacedClient):

    @_rewrite_parameters(
        body_fields=(
            "query",
            "columnar",
            "filter",
            "locale",
            "params",
            "profile",
            "tables",
        ),
        ignore_deprecated_options={"params"},
    )
    async def query(
        self,
        *,
        query: t.Optional[str] = None,
        columnar: t.Optional[bool] = None,
        delimiter: t.Optional[str] = None,
        drop_null_columns: t.Optional[bool] = None,
        error_trace: t.Optional[bool] = None,
        filter: t.Optional[t.Mapping[str, t.Any]] = None,
        filter_path: t.Optional[t.Union[str, t.Sequence[str]]] = None,
        format: t.Optional[
            t.Union[
                str,
                t.Literal[
                    "arrow", "cbor", "csv", "json", "smile", "tsv", "txt", "yaml"
                ],
            ]
        ] = None,
        human: t.Optional[bool] = None,
        locale: t.Optional[str] = None,
        params: t.Optional[
            t.Sequence[t.Union[None, bool, float, int, str, t.Any]]
        ] = None,
        pretty: t.Optional[bool] = None,
        profile: t.Optional[bool] = None,
        tables: t.Optional[
            t.Mapping[str, t.Mapping[str, t.Mapping[str, t.Any]]]
        ] = None,
        body: t.Optional[t.Dict[str, t.Any]] = None,
    ) -> ObjectApiResponse[t.Any]:
        """
        Run an ES|QL query. Get search results for an ES|QL (Elasticsearch query language)
        query.

        `<https://www.elastic.co/guide/en/elasticsearch/reference/8.17/esql-rest.html>`_

        :param query: The ES|QL query API accepts an ES|QL query string in the query
            parameter, runs it, and returns the results.
        :param columnar: By default, ES|QL returns results as rows. For example, FROM
            returns each individual document as one row. For the JSON, YAML, CBOR and
            smile formats, ES|QL can return the results in a columnar fashion where one
            row represents all the values of a certain column in the results.
        :param delimiter: The character to use between values within a CSV row. Only
            valid for the CSV format.
        :param drop_null_columns: Should columns that are entirely `null` be removed
            from the `columns` and `values` portion of the results? Defaults to `false`.
            If `true` then the response will include an extra section under the name
            `all_columns` which has the name of all columns.
        :param filter: Specify a Query DSL query in the filter parameter to filter the
            set of documents that an ES|QL query runs on.
        :param format: A short version of the Accept header, e.g. json, yaml.
        :param locale:
        :param params: To avoid any attempts of hacking or code injection, extract the
            values in a separate list of parameters. Use question mark placeholders (?)
            in the query string for each of the parameters.
        :param profile: If provided and `true` the response will include an extra `profile`
            object with information on how the query was executed. This information is
            for human debugging and its format can change at any time but it can give
            some insight into the performance of each part of the query.
        :param tables: Tables to use with the LOOKUP operation. The top level key is
            the table name and the next level key is the column name.
        """
        if query is None and body is None:
            raise ValueError("Empty value passed for parameter 'query'")
        __path_parts: t.Dict[str, str] = {}
        __path = "/_query"
        __query: t.Dict[str, t.Any] = {}
        __body: t.Dict[str, t.Any] = body if body is not None else {}
        if delimiter is not None:
            __query["delimiter"] = delimiter
        if drop_null_columns is not None:
            __query["drop_null_columns"] = drop_null_columns
        if error_trace is not None:
            __query["error_trace"] = error_trace
        if filter_path is not None:
            __query["filter_path"] = filter_path
        if format is not None:
            __query["format"] = format
        if human is not None:
            __query["human"] = human
        if pretty is not None:
            __query["pretty"] = pretty
        if not __body:
            if query is not None:
                __body["query"] = query
            if columnar is not None:
                __body["columnar"] = columnar
            if filter is not None:
                __body["filter"] = filter
            if locale is not None:
                __body["locale"] = locale
            if params is not None:
                __body["params"] = params
            if profile is not None:
                __body["profile"] = profile
            if tables is not None:
                __body["tables"] = tables
        __headers = {"accept": "application/json", "content-type": "application/json"}
        return await self.perform_request(  # type: ignore[return-value]
            "POST",
            __path,
            params=__query,
            headers=__headers,
            body=__body,
            endpoint_id="esql.query",
            path_parts=__path_parts,
        )
