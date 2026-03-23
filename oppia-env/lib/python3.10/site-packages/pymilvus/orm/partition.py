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

from typing import Dict, List, Optional, TypeVar, Union

import pandas as pd
import ujson

from pymilvus.client import utils
from pymilvus.client.abstract import BaseRanker
from pymilvus.client.search_result import SearchResult
from pymilvus.client.types import Replica
from pymilvus.exceptions import MilvusException

from .mutation import MutationResult

Collection = TypeVar("Collection")
Partition = TypeVar("Partition")


class Partition:
    def __init__(
        self,
        collection: Union[Collection, str],
        name: str,
        description: str = "",
        **kwargs,
    ) -> Partition:
        # ruff: noqa: PLC0415
        from .collection import Collection

        if isinstance(collection, Collection):
            self._collection = collection
        elif isinstance(collection, str):
            self._collection = Collection(collection)
        else:
            msg = "Collection must be of type pymilvus.Collection or String"
            raise MilvusException(message=msg)

        self._name = name
        self._description = description

        if kwargs.get("construct_only", False):
            return

        if not self._collection.has_partition(self.name, **kwargs):
            conn = self._get_connection()
            conn.create_partition(self._collection.name, self.name, **kwargs)

    def __repr__(self) -> str:
        return ujson.dumps(
            {
                "name": self.name,
                "collection_name": self._collection.name,
                "description": self.description,
            }
        )

    def _get_connection(self):
        return self._collection._get_connection()

    @property
    def description(self) -> str:
        """str: discription of the partition.

        Examples:
            >>> from pymilvus import connections, Collection, Partition
            >>> connections.connect()
            >>> collection = Collection("test_partition_description")
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> partition.description
            'comedy films'
        """
        return self._description

    @property
    def name(self) -> str:
        """str: name of the partition

        Examples:
            >>> from pymilvus import connections, Collection, Partition
            >>> connections.connect()
            >>> collection = Collection("test_partition_name")
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> partition.name
            'comedy'
        """
        return self._name

    @property
    def is_empty(self) -> bool:
        """bool: whether the partition is empty

        Examples:
            >>> from pymilvus import connections, Collection, Partition
            >>> connections.connect()
            >>> collection = Collection("test_partition_is_empty")
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> partition.is_empty
            True
        """
        return self.num_entities == 0

    @property
    def num_entities(self) -> int:
        """int: number of entities in the partition

        Examples:
            >>> from pymilvus import connections
            >>> connections.connect()
            >>> from pymilvus import Collection, Partition, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_partition_num_entities", schema)
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[float(i) for i in range(2)] for _ in range(10)],
            ... ]
            >>> partition.insert(data)
            >>> partition.num_entities
            10
        """
        conn = self._get_connection()
        stats = conn.get_partition_stats(
            collection_name=self._collection.name, partition_name=self.name
        )
        result = {stat.key: stat.value for stat in stats}
        result["row_count"] = int(result["row_count"])
        return result["row_count"]

    def flush(self, timeout: Optional[float] = None, **kwargs):
        """Seal all segment in the collection of this partition.
            Inserts after flushing will be written into new segments.
            Only sealed segments can be indexed.

        Args:
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs.  If timeout is not set, the client keeps waiting until the server
                responds or an error occurs.
        """
        conn = self._get_connection()
        conn.flush([self._collection.name], timeout=timeout, **kwargs)

    def drop(self, timeout: Optional[float] = None, **kwargs):
        """Drop the partition, the same as Collection.drop_partition

        Args:
            timeout (``float``, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the server
                responds or an error occurs.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import connections, Collection, Partition
            >>> connections.connect()
            >>> collection = Collection("test_partition_drop")
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> partition.drop()
        """
        conn = self._get_connection()
        return conn.drop_partition(self._collection.name, self.name, timeout=timeout, **kwargs)

    def load(self, replica_number: Optional[int] = None, timeout: Optional[float] = None, **kwargs):
        """Load the partition data into memory.

        Args:
            replica_number (``int``, optional): The replica number to load, defaults to None.
            timeout (``float``, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.

        Raises:
            MilvusException: If anything goes wrong

        Examples:
            >>> from pymilvus import connections
            >>> connections.connect()
            >>> from pymilvus import Collection, Partition, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_partition_load", schema)
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> partition.load()
        """
        conn = self._get_connection()
        return conn.load_partitions(
            collection_name=self._collection.name,
            partition_names=[self.name],
            replica_number=replica_number,
            timeout=timeout,
            **kwargs,
        )

    def release(self, timeout: Optional[float] = None, **kwargs):
        """Release the partition data from memory.

        Args:
            timeout (``float``, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.

        Raises:
            MilvusException: If anything goes wrong

        Examples:
            >>> from pymilvus import connections
            >>> connections.connect()
            >>> from pymilvus import Collection, Partition, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_partition_release", schema)
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> partition.load()
            >>> partition.release()
        """
        conn = self._get_connection()
        return conn.release_partitions(
            collection_name=self._collection.name,
            partition_names=[self.name],
            timeout=timeout,
            **kwargs,
        )

    def insert(
        self,
        data: Union[List, pd.DataFrame, utils.SparseMatrixInputType],
        timeout: Optional[float] = None,
        **kwargs,
    ) -> MutationResult:
        """Insert data into the partition, the same as Collection.insert(data, [partition])

        Args:
            data (``list/tuple/pandas.DataFrame/sparse types``): The specified data to insert
            partition_name (``str``): The partition name which the data will be inserted to,
                if partition name is not passed, then the data will be inserted to default partition
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC
                If timeout is set to None, the client keeps waiting until the server
                responds or an error occurs.
        Returns:
            MutationResult: contains 2 properties `insert_count`, and, `primary_keys`
                `insert_count`: how may entites have been inserted into Milvus,
                `primary_keys`: list of primary keys of the inserted entities
        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import connections
            >>> connections.connect()
            >>> from pymilvus import Collection, Partition, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_partition_insert", schema)
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[float(i) for i in range(2)] for _ in range(10)],
            ... ]
            >>> res = partition.insert(data)
            >>> res.insert_count
            10
        """
        return self._collection.insert(data, self.name, timeout=timeout, **kwargs)

    def delete(self, expr: str, timeout: Optional[float] = None, **kwargs):
        """Delete entities with an expression condition.

        Args:
            expr (``str``): The specified data to insert.
            partition_names (``List[str]``): Name of partitions to delete entities.
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server responds
                or an error occurs.

        Returns:
            MutationResult: contains `delete_count` properties represents
            how many entities might be deleted.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, Partition, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> test_collection = Collection("test_partition_delete", schema)
            >>> test_partition = Partition(test_collection, "comedy films")
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[float(i) for i in range(2)] for _ in range(10)],
            ... ]
            >>> test_partition.insert(data)
            (insert count: 10, delete count: 0, upsert count: 0, timestamp: 431044482906718212)
            >>> test_partition.delete("film_id in [0, 1]")
            (insert count: 0, delete count: 2, upsert count: 0, timestamp: 431044582560759811)
        """
        return self._collection.delete(expr, self.name, timeout=timeout, **kwargs)

    def upsert(
        self,
        data: Union[List, pd.DataFrame, utils.SparseMatrixInputType],
        timeout: Optional[float] = None,
        **kwargs,
    ) -> MutationResult:
        """Upsert data into the collection.

        Args:
            data (``list/tuple/pandas.DataFrame/sparse types``): The specified data to upsert
            partition_name (``str``): The partition name which the data will be upserted at,
                if partition name is not passed, then the data will be upserted in default partition
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server responds
                or an error occurs.
        Returns:
            MutationResult: contains 2 properties `upsert_count`, and, `primary_keys`
                `upsert_count`: how may entites have been upserted at Milvus,
                `primary_keys`: list of primary keys of the upserted entities
        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, Partition, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_partition_upsert", schema)
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[float(i) for i in range(2)] for _ in range(10)],
            ... ]
            >>> res = partition.upsert(data)
            >>> res.upsert_count
            10
        """
        return self._collection.upsert(data, self.name, timeout=timeout, **kwargs)

    def search(
        self,
        data: Union[List, utils.SparseMatrixInputType],
        anns_field: str,
        param: Dict,
        limit: int,
        expr: Optional[str] = None,
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        round_decimal: int = -1,
        **kwargs,
    ) -> SearchResult:
        """Conducts a vector similarity search with an optional boolean expression as filter.

        Args:
            data (``List[List[float]]`` or sparse types): The vectors of search data.
                the length of data is number of query (nq),
                and the dim of every vector in data must be equal to the vector field of collection.
            anns_field (``str``): The name of the vector field used to search of collection.
            param (``dict[str, Any]``):

                The parameters of search. The followings are valid keys of param.

                * *nprobe*, *ef*, *search_k*, etc
                    Corresponding search params for a certain index.

                * *metric_type* (``str``)
                    similar metricy types, the value must be of type str.

                * *offset* (``int``, optional)
                    offset for pagination.

                * *limit* (``int``, optional)
                    limit for the search results and pagination.

                example for param::

                    {
                        "nprobe": 128,
                        "metric_type": "L2",
                        "offset": 10,
                        "limit": 10,
                    }

            limit (``int``): The max number of returned record, also known as `topk`.
            expr (``str``): The boolean expression used to filter attribute. Default to None.

                example for expr::

                    "id_field >= 0", "id_field in [1, 2, 3, 4]"

            output_fields (``List[str]``, optional):
                The name of fields to return in the search result.  Can only get scalar fields.
            round_decimal (``int``, optional): The specified number of decimal places of
                returned distance......... Defaults to -1 means no round to returned distance.
            **kwargs (``dict``): Optional search params

                *  *_async* (``bool``, optional)
                    Indicate if invoke asynchronously.
                    Returns a SearchFuture if True, else returns results from server directly.

                * *_callback* (``function``, optional)
                    The callback function which is invoked after server response successfully.
                    It functions only if _async is set to True.

                * *consistency_level* (``str/int``, optional)
                    Which consistency level to use when searching in the collection.

                    Options of consistency level: Strong, Bounded, Eventually, Session, Customized.

                    Note: this parameter overwrites the same one specified when creating collection,
                    if no consistency level was specified, search will use the
                    consistency level when you create the collection.

                * *guarantee_timestamp* (``int``, optional)
                    Instructs Milvus to see all operations performed before this timestamp.
                    By default Milvus will search all operations performed to date.

                    Note: only valid in Customized consistency level.

                * *graceful_time* (``int``, optional)
                    Search will use the (current_timestamp - the graceful_time) as the
                    `guarantee_timestamp`. By default with 5s.

                    Note: only valid in Bounded consistency level

        Returns:
            SearchResult:
                Returns ``SearchResult`` if `_async` is False , otherwise ``SearchFuture``

        .. _Metric type documentations:
            https://milvus.io/docs/v2.2.x/metric.md
        .. _Index documentations:
            https://milvus.io/docs/v2.2.x/index.md
        .. _How guarantee ts works:
            https://github.com/milvus-io/milvus/blob/master/docs/developer_guides/how-guarantee-ts-works.md

        Raises:
            MilvusException: If anything goes wrong

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_search", schema)
            >>> collection.create_index(
            ...     "films",
            ...     {"index_type": "FLAT", "metric_type": "L2", "params": {}})
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> partition.insert(data)
            >>> partition.load()
            >>> # search
            >>> search_param = {
            ...     "data": [[1.0, 1.0]],
            ...     "anns_field": "films",
            ...     "param": {"metric_type": "L2"},
            ...     "limit": 2,
            ...     "expr": "film_id > 0",
            ... }
            >>> res = partition.search(**search_param)
            >>> assert len(res) == 1
            >>> hits = res[0]
            >>> assert len(hits) == 2
            >>> print(f"- Total hits: {len(hits)}, hits ids: {hits.ids} ")
            - Total hits: 2, hits ids: [8, 5]
            >>> print(f"- Top1 hit id: {hits[0].id}, score: {hits[0].score} ")
            - Top1 hit id: 8, score: 0.10143111646175385
        """

        return self._collection.search(
            data=data,
            anns_field=anns_field,
            param=param,
            limit=limit,
            expr=expr,
            partition_names=[self.name],
            output_fields=output_fields,
            round_decimal=round_decimal,
            timeout=timeout,
            **kwargs,
        )

    def hybrid_search(
        self,
        reqs: List,
        rerank: BaseRanker,
        limit: int,
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        round_decimal: int = -1,
        **kwargs,
    ):
        """Conducts multi vector similarity search with a rerank for rearrangement.

        Args:
            reqs (``List[AnnSearchRequest]``): The vector search requests.
            rerank (``BaseRanker``): The reranker for rearrange nummer of limit results.
            limit (``int``): The max number of returned record, also known as `topk`.

            output_fields (``List[str]``, optional):
                The name of fields to return in the search result.  Can only get scalar fields.
            round_decimal (``int``, optional):
                The specified number of decimal places of returned distance.
                Defaults to -1 means no round to returned distance.
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server
                responds or an error occurs.
            **kwargs (``dict``): Optional search params

                *  *_async* (``bool``, optional)
                    Indicate if invoke asynchronously.
                    Returns a SearchFuture if True, else returns results from server directly.

                * *_callback* (``function``, optional)
                    The callback function which is invoked after server response successfully.
                    It functions only if _async is set to True.

                * *offset* (``int``, optinal)
                    offset for pagination.

                * *consistency_level* (``str/int``, optional)
                    Which consistency level to use when searching in the collection.

                    Options of consistency level: Strong, Bounded, Eventually, Session, Customized.

                    Note: this parameter overwrites the same one specified when creating collection,
                    if no consistency level was specified, search will use the
                    consistency level when you create the collection.

                * *guarantee_timestamp* (``int``, optional)
                    Instructs Milvus to see all operations performed before this timestamp.
                    By default Milvus will search all operations performed to date.

                    Note: only valid in Customized consistency level.

                * *graceful_time* (``int``, optional)
                    Search will use the (current_timestamp - the graceful_time) as the
                    `guarantee_timestamp`. By default with 5s.

                    Note: only valid in Bounded consistency level

        Returns:
            SearchResult:
                Returns ``SearchResult`` if `_async` is False , otherwise ``SearchFuture``

        .. _Metric type documentations:
            https://milvus.io/docs/v2.2.x/metric.md
        .. _Index documentations:
            https://milvus.io/docs/v2.2.x/index.md
        .. _How guarantee ts works:
            https://github.com/milvus-io/milvus/blob/master/docs/developer_guides/how-guarantee-ts-works.md

        Raises:
            MilvusException: If anything goes wrong

        Examples:
            >>> from pymilvus import (Collection, FieldSchema, CollectionSchema, DataType
            >>>     AnnSearchRequest, RRFRanker, WeightedRanker)
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2),
            ...     FieldSchema("poster", dtype=DataType.FLOAT_VECTOR, dim=2),
            ... ])
            >>> collection = Collection("test_collection_search", schema)
            >>> collection.create_index(
            ...     "films",
            ...     {"index_type": "FLAT", "metric_type": "L2", "params": {}})
            >>> collection.create_index(
            ...     "poster",
            ...     {"index_type": "FLAT", "metric_type": "L2", "params": {}})
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> partition.insert(data)
            >>> partition.load()
            >>> # search
            >>> search_param1 = {
            ...     "data": [[1.0, 1.0]],
            ...     "anns_field": "films",
            ...     "param": {"metric_type": "L2"},
            ...     "limit": 2,
            ...     "expr": "film_id > 0",
            ... }
            >>> req1 = AnnSearchRequest(**search_param1)
            >>> search_param2 = {
            ...     "data": [[2.0, 2.0]],
            ...     "anns_field": "poster",
            ...     "param": {"metric_type": "L2", "offset": 1},
            ...     "limit": 2,
            ...     "expr": "film_id > 0",
            ... }
            >>> req2 = AnnSearchRequest(**search_param2)
            >>> res = partition.hybrid_search([req1, req2], WeightedRanker(0.9, 0.1), 2)
            >>> assert len(res) == 1
            >>> hits = res[0]
            >>> assert len(hits) == 2
            >>> print(f"- Total hits: {len(hits)}, hits ids: {hits.ids} ")
            - Total hits: 2, hits ids: [8, 5]
            >>> print(f"- Top1 hit id: {hits[0].id}, score: {hits[0].score} ")
            - Top1 hit id: 8, score: 0.10143111646175385
        """

        return self._collection.hybrid_search(
            reqs=reqs,
            rerank=rerank,
            limit=limit,
            partition_names=[self.name],
            output_fields=output_fields,
            round_decimal=round_decimal,
            timeout=timeout,
            **kwargs,
        )

    def query(
        self,
        expr: str,
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Query with expressions

        Args:
            expr (``str``): The query expression.
            output_fields(``List[str]``): A list of field names to return. Defaults to None.
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server responds
                or an error occurs.
            **kwargs (``dict``, optional):

                * *consistency_level* (``str/int``, optional)
                    Which consistency level to use when searching in the collection.

                    Options of consistency level: Strong, Bounded, Eventually, Session, Customized.

                    Note: this parameter overwrites the same one specified when creating collection,
                    if no consistency level was specified, search will use the
                    consistency level when you create the collection.

                * *guarantee_timestamp* (``int``, optional)
                    Instructs Milvus to see all operations performed before this timestamp.
                    By default Milvus will search all operations performed to date.

                    Note: only valid in Customized consistency level.

                * *graceful_time* (``int``, optional)
                    Search will use the (current_timestamp - the graceful_time) as the
                    `guarantee_timestamp`. By default with 5s.

                    Note: only valid in Bounded consistency level

                * *offset* (``int``)
                    Combined with limit to enable pagination

                * *limit* (``int``)
                    Combined with limit to enable pagination

        Returns:
            List, contains all results

        Raises:
            MilvusException: If anything goes wrong

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("film_date", DataType.INT64),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_query", schema)
            >>> collection.create_index(
            ...     "films",
            ...     {"index_type": "FLAT", "metric_type": "L2", "params": {}})
            >>> partition = Partition(collection, "comedy", "comedy films")
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [i + 2000 for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> partition.insert(data)
            >>> partition.load()
            >>> # query
            >>> expr = "film_id in [ 0, 1 ]"
            >>> res = partition.query(expr, output_fields=["film_date"])
            >>> assert len(res) == 2
            >>> print(f"- Query results: {res}")
            - Query results: [{'film_id': 0, 'film_date': 2000}, {'film_id': 1, 'film_date': 2001}]
        """

        return self._collection.query(
            expr=expr,
            output_fields=output_fields,
            partition_names=[self.name],
            timeout=timeout,
            **kwargs,
        )

    def get_replicas(self, timeout: Optional[float] = None, **kwargs) -> Replica:
        """Get the current loaded replica information

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow for
            the RPC. When timeout is set to None, client waits until server response or error occur.
        Returns:
            Replica: All the replica information.
        """
        return self._collection.get_replicas(timeout=timeout, **kwargs)
