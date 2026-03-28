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

import copy
import json
from typing import Dict, List, Optional, Union

import pandas as pd

from pymilvus.client import utils
from pymilvus.client.abstract import BaseRanker
from pymilvus.client.constants import DEFAULT_CONSISTENCY_LEVEL
from pymilvus.client.search_result import SearchResult
from pymilvus.client.types import (
    CompactionPlans,
    CompactionState,
    Replica,
    cmp_consistency_level,
    get_consistency_level,
)
from pymilvus.exceptions import (
    AutoIDException,
    DataTypeNotMatchException,
    DataTypeNotSupportException,
    ExceptionsMessage,
    IndexNotExistException,
    PartitionAlreadyExistException,
    SchemaNotReadyException,
)
from pymilvus.grpc_gen import schema_pb2
from pymilvus.settings import Config

from .connections import connections
from .constants import UNLIMITED
from .future import MutationFuture, SearchFuture
from .index import Index
from .iterator import QueryIterator, SearchIterator
from .mutation import MutationResult
from .partition import Partition
from .prepare import Prepare
from .schema import (
    CollectionSchema,
    FieldSchema,
    check_insert_schema,
    check_schema,
    check_upsert_schema,
    construct_fields_from_dataframe,
    is_row_based,
    is_valid_insert_data,
)
from .types import DataType
from .utility import _get_connection


class Collection:
    def __init__(
        self,
        name: str,
        schema: Optional[CollectionSchema] = None,
        using: str = "default",
        **kwargs,
    ) -> None:
        """Constructs a collection by name, schema and other parameters.

        Args:
            name (``str``): the name of collection
            schema (``CollectionSchema``, optional): the schema of collection, defaults to None.
            using (``str``, optional): Milvus connection alias name, defaults to 'default'.
            **kwargs (``dict``):

                * *num_shards (``int``, optional): how many shards will the insert data be divided.
                * *shards_num (``int``, optional, deprecated):
                    how many shards will the insert data be divided.
                * *consistency_level* (``int/ str``)
                    Which consistency level to use when searching in the collection.
                    Options of consistency level: Strong, Bounded, Eventually, Session, Customized.

                    Note: can be overwritten by the same parameter specified in search.

                * *properties* (``dict``, optional)
                    Collection properties.

                * *timeout* (``float``)
                    An optional duration of time in seconds to allow for the RPCs.
                    If timeout is not set, the client keeps waiting until the server
                    responds or an error occurs.


        Raises:
            SchemaNotReadyException: if the schema is wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> fields = [
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=128)
            ... ]
            >>> schema = CollectionSchema(fields=fields)
            >>> prop = {"collection.ttl.seconds": 1800}
            >>> collection = Collection(name="test_collection_init", schema=schema, properties=prop)
            >>> collection.name
            'test_collection_init'
        """
        self._name = name
        self._using = using
        self._kwargs = kwargs
        self._num_shards = None
        conn = self._get_connection()

        has = conn.has_collection(self._name, **kwargs)
        if has:
            resp = conn.describe_collection(self._name, **kwargs)
            s_consistency_level = resp.get("consistency_level", DEFAULT_CONSISTENCY_LEVEL)
            arg_consistency_level = kwargs.get("consistency_level", s_consistency_level)
            if not cmp_consistency_level(s_consistency_level, arg_consistency_level):
                raise SchemaNotReadyException(
                    message=ExceptionsMessage.ConsistencyLevelInconsistent
                )
            server_schema = CollectionSchema.construct_from_dict(resp)
            self._consistency_level = s_consistency_level
            if schema is None:
                self._schema = server_schema
            else:
                if not isinstance(schema, CollectionSchema):
                    raise SchemaNotReadyException(message=ExceptionsMessage.SchemaType)
                if server_schema != schema:
                    raise SchemaNotReadyException(message=ExceptionsMessage.SchemaInconsistent)
                self._schema = schema

        else:
            if schema is None:
                raise SchemaNotReadyException(
                    message=ExceptionsMessage.CollectionNotExistNoSchema % name
                )
            if isinstance(schema, CollectionSchema):
                schema.verify()
                check_schema(schema)
                consistency_level = get_consistency_level(
                    kwargs.get("consistency_level", DEFAULT_CONSISTENCY_LEVEL)
                )

                conn.create_collection(self._name, schema, **kwargs)
                self._schema = schema
                self._consistency_level = consistency_level
            else:
                raise SchemaNotReadyException(message=ExceptionsMessage.SchemaType)

        self._schema_dict = self._schema.to_dict()
        self._schema_dict["consistency_level"] = self._consistency_level

    def __repr__(self) -> str:
        _dict = {
            "name": self.name,
            "description": self.description,
            "schema": self._schema,
        }
        r = ["<Collection>:\n-------------\n"]
        s = "<{}>: {}\n"
        for k, v in _dict.items():
            r.append(s.format(k, v))
        return "".join(r)

    def _get_connection(self):
        return connections._fetch_handler(self._using)

    # TODO(SPARSE): support pd.SparseDtype
    @classmethod
    def construct_from_dataframe(cls, name: str, dataframe: pd.DataFrame, **kwargs):
        if not isinstance(dataframe, pd.DataFrame):
            raise SchemaNotReadyException(message=ExceptionsMessage.DataFrameType)
        primary_field = kwargs.pop("primary_field", None)
        if primary_field is None:
            raise SchemaNotReadyException(message=ExceptionsMessage.NoPrimaryKey)
        pk_index = -1
        for i, field in enumerate(dataframe):
            if field == primary_field:
                pk_index = i
        if pk_index == -1:
            raise SchemaNotReadyException(message=ExceptionsMessage.PrimaryKeyNotExist)
        if "auto_id" in kwargs and not isinstance(kwargs.get("auto_id"), bool):
            raise AutoIDException(message=ExceptionsMessage.AutoIDType)
        auto_id = kwargs.pop("auto_id", False)
        if auto_id:
            if dataframe[primary_field].isnull().all():
                dataframe = dataframe.drop(primary_field, axis=1)
            else:
                raise SchemaNotReadyException(message=ExceptionsMessage.AutoIDWithData)

        using = kwargs.get("using", Config.MILVUS_CONN_ALIAS)
        conn = _get_connection(using)
        if conn.has_collection(name, **kwargs):
            resp = conn.describe_collection(name, **kwargs)
            server_schema = CollectionSchema.construct_from_dict(resp)
            schema = server_schema
        else:
            fields_schema = construct_fields_from_dataframe(dataframe)
            if auto_id:
                fields_schema.insert(
                    pk_index,
                    FieldSchema(
                        name=primary_field,
                        dtype=DataType.INT64,
                        is_primary=True,
                        auto_id=True,
                        **kwargs,
                    ),
                )

            for field in fields_schema:
                if auto_id is False and field.name == primary_field:
                    field.is_primary = True
                    field.auto_id = False
                if field.dtype == DataType.VARCHAR:
                    field.params[Config.MaxVarCharLengthKey] = int(Config.MaxVarCharLength)
            schema = CollectionSchema(fields=fields_schema)

        check_schema(schema)
        collection = cls(name, schema, **kwargs)
        res = collection.insert(data=dataframe)
        return collection, res

    @property
    def schema(self) -> CollectionSchema:
        """CollectionSchema: schema of the collection."""
        return self._schema

    @property
    def aliases(self) -> list:
        """List[str]: all the aliases of the collection."""
        conn = self._get_connection()
        resp = conn.describe_collection(self._name)
        return resp["aliases"]

    @property
    def description(self) -> str:
        """str: a text description of the collection."""
        return self.schema.description

    @property
    def name(self) -> str:
        """str: the name of the collection."""
        return self._name

    @property
    def is_empty(self) -> bool:
        """bool: whether the collection is empty or not."""
        return self.num_entities == 0

    @property
    def num_shards(self) -> int:
        """int: number of shards used by the collection."""
        if self._num_shards is None:
            self._num_shards = self.describe().get("num_shards")
        return self._num_shards

    @property
    def num_entities(self) -> int:
        """int: The number of entities in the collection, not real time.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_num_entities", schema)
            >>> collection.num_entities
            0
            >>> collection.insert([[1, 2], [[1.0, 2.0], [3.0, 4.0]]])
            >>> collection.num_entities
            0
            >>> collection.flush()
            >>> collection.num_entities
            2
        """
        conn = self._get_connection()
        stats = conn.get_collection_stats(collection_name=self._name)
        result = {stat.key: stat.value for stat in stats}
        result["row_count"] = int(result["row_count"])
        return result["row_count"]

    @property
    def primary_field(self) -> FieldSchema:
        """FieldSchema: the primary field of the collection."""
        return self.schema.primary_field

    def flush(self, timeout: Optional[float] = None, **kwargs):
        """Seal all segments in the collection. Inserts after flushing will be written into
            new segments. Only sealed segments can be indexed.

        Args:
            timeout (float): an optional duration of time in seconds to allow for the RPCs.
                If timeout is not set, the client keeps waiting until the server
                responds or an error occurs.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> fields = [
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=128)
            ... ]
            >>> schema = CollectionSchema(fields=fields)
            >>> collection = Collection(name="test_collection_flush", schema=schema)
            >>> collection.insert([[1, 2], [[1.0, 2.0], [3.0, 4.0]]])
            >>> collection.flush()
            >>> collection.num_entities
            2
        """
        conn = self._get_connection()
        conn.flush([self.name], timeout=timeout, **kwargs)

    def drop(self, timeout: Optional[float] = None, **kwargs):
        """Drops the collection. The same as `utility.drop_collection()`

        Args:
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_drop", schema)
            >>> utility.has_collection("test_collection_drop")
            True
            >>> collection.drop()
            >>> utility.has_collection("test_collection_drop")
            False
        """
        conn = self._get_connection()
        conn.drop_collection(self._name, timeout=timeout, **kwargs)

    def set_properties(self, properties: dict, timeout: Optional[float] = None, **kwargs):
        """Set properties for the collection
        Args:
            properties (``dict``): collection properties.
                 support collection TTL with key `collection.ttl.seconds`
                 support collection replica number with key `collection.replica.number`
                 support collection resource groups with key `collection.resource_groups`.
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.
        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> fields = [
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=128)
            ... ]
            >>> schema = CollectionSchema(fields=fields)
            >>> collection = Collection("test_set_properties", schema)
            >>> collection.set_properties({"collection.ttl.seconds": 60})
        """
        conn = self._get_connection()
        conn.alter_collection_properties(
            self.name,
            properties=properties,
            timeout=timeout,
            **kwargs,
        )

    def load(
        self,
        partition_names: Optional[list] = None,
        replica_number: Optional[int] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Load the data into memory.

        Args:
            partition_names (``List[str]``): The specified partitions to load.
            replica_number (``int``, optional): The replica number to load, defaults to None.
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.
            **kwargs (``dict``, optional):

                * *_async*(``bool``)
                    Indicate if invoke asynchronously.

                * *refresh*(``bool``)
                    Whether to renew the segment list of this collection before loading
                * *resource_groups(``List[str]``)
                    Specify resource groups which can be used during loading.
                * *load_fields(``List[str]``)
                    Specify load fields list needed during this load
                * *_skip_load_dynamic_field(``bool``)
                    Specify whether this load shall skip dynamic schmea field

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> connections.connect()
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_load", schema)
            >>> collection.insert([[1, 2], [[1.0, 2.0], [3.0, 4.0]]])
            >>> index_param = {"index_type": "FLAT", "metric_type": "L2", "params": {}}
            >>> collection.create_index("films", index_param)
            >>> collection.load()
        """
        conn = self._get_connection()
        if partition_names is not None:
            conn.load_partitions(
                collection_name=self._name,
                partition_names=partition_names,
                replica_number=replica_number,
                timeout=timeout,
                **kwargs,
            )
        else:
            conn.load_collection(
                collection_name=self._name,
                replica_number=replica_number,
                timeout=timeout,
                **kwargs,
            )

    def release(self, timeout: Optional[float] = None, **kwargs):
        """Releases the collection data from memory.

        Args:
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_release", schema)
            >>> collection.insert([[1, 2], [[1.0, 2.0], [3.0, 4.0]]])
            >>> index_param = {"index_type": "FLAT", "metric_type": "L2", "params": {}}
            >>> collection.create_index("films", index_param)
            >>> collection.load()
            >>> collection.release()
        """
        conn = self._get_connection()
        conn.release_collection(self._name, timeout=timeout, **kwargs)

    def insert(
        self,
        data: Union[List, pd.DataFrame, Dict, utils.SparseMatrixInputType],
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> MutationResult:
        """Insert data into the collection.

        Args:
            data (``list/tuple/pandas.DataFrame/sparse types``): The specified data to insert
            partition_name (``str``): The partition name which the data will be inserted to,
                if partition name is not passed, then the data will be inserted
                to default partition
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.
        Returns:
            MutationResult: contains 2 properties `insert_count`, and, `primary_keys`
                `insert_count`: how may entites have been inserted into Milvus,
                `primary_keys`: list of primary keys of the inserted entities
        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_insert", schema)
            >>> data = [
            ...     [random.randint(1, 100) for _ in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> res = collection.insert(data)
            >>> res.insert_count
            10
        """
        if not is_valid_insert_data(data):
            raise DataTypeNotSupportException(
                message="The type of data should be List, pd.DataFrame or Dict"
            )

        conn = self._get_connection()
        if is_row_based(data):
            return conn.insert_rows(
                collection_name=self._name,
                entities=data,
                partition_name=partition_name,
                timeout=timeout,
                schema=self._schema_dict,
                **kwargs,
            )

        check_insert_schema(self.schema, data)
        entities = Prepare.prepare_data(data, self.schema)
        return conn.batch_insert(
            self._name,
            entities,
            partition_name,
            timeout=timeout,
            schema=self._schema_dict,
            **kwargs,
        )

    def delete(
        self,
        expr: str,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Delete entities with an expression condition.

        Args:
            expr (``str``): The specified data to insert.
            partition_names (``List[str]``): Name of partitions to delete entities.
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.
            **kwargs (``dict``): Optional search params

                * *consistency_level* (``str/int``, optional)
                    Which consistency level to use when searching in the collection.

                    Options of consistency level: Strong, Bounded, Eventually, Session, Customized.

                    Note: this parameter overwrites the same one specified when creating collection,
                    if no consistency level was specified, search will use the
                    consistency level when you create the collection.

        Returns:
            MutationResult:
                contains `delete_count` properties represents how many entities might be deleted.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("film_date", DataType.INT64),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2),
            ... ])
            >>> collection = Collection("test_collection_delete", schema)
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [i + 2000 for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> collection.insert(data)
            >>> res = collection.delete("film_id in [ 0, 1 ]")
            >>> print(f"- Deleted entities: {res}")
            - Delete results: [0, 1]
        """

        conn = self._get_connection()
        res = conn.delete(self._name, expr, partition_name, timeout=timeout, **kwargs)
        if kwargs.get("_async", False):
            return MutationFuture(res)
        return MutationResult(res)

    def upsert(
        self,
        data: Union[List, pd.DataFrame, Dict, utils.SparseMatrixInputType],
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> MutationResult:
        """Upsert data into the collection.

        Args:
            data (``list/tuple/pandas.DataFrame/sparse types``): The specified data to upsert
            partition_name (``str``): The partition name which the data will be upserted at,
                if partition name is not passed, then the data will be upserted
                in default partition
            timeout (float, optional): an optional duration of time in seconds to allow
                for the RPCs. If timeout is not set, the client keeps waiting until the
                server responds or an error occurs.
        Returns:
            MutationResult: contains 2 properties `upsert_count`, and, `primary_keys`
                `upsert_count`: how may entites have been upserted at Milvus,
                `primary_keys`: list of primary keys of the upserted entities
        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_upsert", schema)
            >>> data = [
            ...     [random.randint(1, 100) for _ in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> res = collection.upsert(data)
            >>> res.upsert_count
            10
        """

        if not is_valid_insert_data(data):
            raise DataTypeNotSupportException(
                message="The type of data should be List, pd.DataFrame or Dict"
            )

        conn = self._get_connection()
        if is_row_based(data):
            res = conn.upsert_rows(
                self._name,
                data,
                partition_name,
                timeout=timeout,
                schema=self._schema_dict,
                **kwargs,
            )
            return MutationResult(res)

        check_upsert_schema(self.schema, data)
        entities = Prepare.prepare_data(data, self.schema, False)
        res = conn.upsert(
            self._name,
            entities,
            partition_name,
            timeout=timeout,
            schema=self._schema_dict,
            **kwargs,
        )

        return MutationFuture(res) if kwargs.get("_async", False) else MutationResult(res)

    def search(
        self,
        data: Union[List, utils.SparseMatrixInputType],
        anns_field: str,
        param: Dict,
        limit: int,
        expr: Optional[str] = None,
        partition_names: Optional[List[str]] = None,
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        round_decimal: int = -1,
        **kwargs,
    ):
        """Conducts a vector similarity search with an optional boolean expression as filter.

        Args:
            data (``List[List[float]]/sparse types``): The vectors of search data.
                the length of data is number of query (nq),
                and the dim of every vector in data must be equal to the vector field of collection.
            anns_field (``str``): The name of the vector field used to search of collection.
            param (``dict[str, Any]``):
                The parameters of search. The followings are valid keys of param.
                * *metric_type* (``str``)
                    similar metricy types, the value must be of type str.
                * *offset* (``int``, optional)
                    offset for pagination.
                * *params of index: *nprobe*, *ef*, *search_k*, etc
                    Corresponding search params for a certain index.
                example for param::

                    {
                        "metric_type": "L2",
                        "offset": 10,
                        "params": {"nprobe": 12},
                    }

            limit (``int``): The max number of returned record, also known as `topk`.
            expr (``str``, Optional): The boolean expression used to filter attribute.

                example for expr::

                    "id_field >= 0", "id_field in [1, 2, 3, 4]"

            partition_names (``List[str]``, optional): The names of partitions to search on.
            output_fields (``List[str]``, optional):
                The name of fields to return in the search result.
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
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_search", schema)
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> collection.insert(data)
            >>> index_param = {"index_type": "FLAT", "metric_type": "L2", "params": {}}
            >>> collection.create_index("films", index_param)
            >>> collection.load()
            >>> # search
            >>> search_param = {
            ...     "data": [[1.0, 1.0]],
            ...     "anns_field": "films",
            ...     "param": {"metric_type": "L2", "offset": 1},
            ...     "limit": 2,
            ...     "expr": "film_id > 0",
            ... }
            >>> res = collection.search(**search_param)
            >>> assert len(res) == 1
            >>> hits = res[0]
            >>> assert len(hits) == 2
            >>> print(f"- Total hits: {len(hits)}, hits ids: {hits.ids} ")
            - Total hits: 2, hits ids: [8, 5]
            >>> print(f"- Top1 hit id: {hits[0].id}, score: {hits[0].score} ")
            - Top1 hit id: 8, score: 0.10143111646175385
        """
        if expr is not None and not isinstance(expr, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(expr))

        empty_scipy_sparse = utils.SciPyHelper.is_scipy_sparse(data) and (data.shape[0] == 0)
        if (isinstance(data, list) and len(data) == 0) or empty_scipy_sparse:
            resp = SearchResult(schema_pb2.SearchResultData())
            return SearchFuture(None) if kwargs.get("_async", False) else resp

        conn = self._get_connection()
        resp = conn.search(
            self._name,
            data,
            anns_field,
            param,
            limit,
            expr,
            partition_names,
            output_fields,
            round_decimal,
            timeout=timeout,
            schema=self._schema_dict,
            **kwargs,
        )

        return SearchFuture(resp) if kwargs.get("_async", False) else resp

    def hybrid_search(
        self,
        reqs: List,
        rerank: BaseRanker,
        limit: int,
        partition_names: Optional[List[str]] = None,
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

            partition_names (``List[str]``, optional): The names of partitions to search on.
            output_fields (``List[str]``, optional):
                The name of fields to return in the search result.
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
            >>> from pymilvus import (Collection, FieldSchema, CollectionSchema, DataType,
            >>>     AnnSearchRequest, RRFRanker, WeightedRanker)
            >>> import random
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2),
            ...     FieldSchema("poster", dtype=DataType.FLOAT_VECTOR, dim=2),
            ... ])
            >>> collection = Collection("test_collection_search", schema)
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> collection.insert(data)
            >>> index_param = {"index_type": "FLAT", "metric_type": "L2", "params": {}}
            >>> collection.create_index("films", index_param)
            >>> collection.create_index("poster", index_param)
            >>> collection.load()
            >>> # search
            >>> search_param1 = {
            ...     "data": [[1.0, 1.0]],
            ...     "anns_field": "films",
            ...     "param": {"metric_type": "L2", "offset": 1},
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
            >>> res = collection.hybrid_search([req1, req2], WeightedRanker(0.9, 0.1), 2)
            >>> assert len(res) == 1
            >>> hits = res[0]
            >>> assert len(hits) == 2
            >>> print(f"- Total hits: {len(hits)}, hits ids: {hits.ids} ")
            - Total hits: 2, hits ids: [8, 5]
            >>> print(f"- Top1 hit id: {hits[0].id}, score: {hits[0].score} ")
            - Top1 hit id: 8, score: 0.10143111646175385
        """
        if isinstance(reqs, list) and len(reqs) == 0:
            resp = SearchResult(schema_pb2.SearchResultData())
            return SearchFuture(None) if kwargs.get("_async", False) else resp

        conn = self._get_connection()
        resp = conn.hybrid_search(
            self._name,
            reqs,
            rerank,
            limit,
            partition_names,
            output_fields,
            round_decimal,
            timeout=timeout,
            schema=self._schema_dict,
            **kwargs,
        )

        return SearchFuture(resp) if kwargs.get("_async", False) else resp

    def search_iterator(
        self,
        data: Union[List, utils.SparseMatrixInputType],
        anns_field: str,
        param: Dict,
        batch_size: Optional[int] = 1000,
        limit: Optional[int] = UNLIMITED,
        expr: Optional[str] = None,
        partition_names: Optional[List[str]] = None,
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        round_decimal: int = -1,
        **kwargs,
    ):
        if expr is not None and not isinstance(expr, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(expr))
        param["params"] = utils.get_params(param)
        return SearchIterator(
            connection=self._get_connection(),
            collection_name=self._name,
            data=data,
            ann_field=anns_field,
            param=param,
            batch_size=batch_size,
            limit=limit,
            expr=expr,
            partition_names=partition_names,
            output_fields=output_fields,
            timeout=timeout,
            round_decimal=round_decimal,
            schema=self._schema_dict,
            **kwargs,
        )

    def query(
        self,
        expr: str,
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Query with expressions

        Args:
            expr (``str``): The query expression.
            output_fields(``List[str]``): A list of field names to return. Defaults to None.
            partition_names: (``List[str]``, optional): A list of partition names to query in.
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server
                responds or an error occurs.
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
            >>> # insert
            >>> data = [
            ...     [i for i in range(10)],
            ...     [i + 2000 for i in range(10)],
            ...     [[random.random() for _ in range(2)] for _ in range(10)],
            ... ]
            >>> collection.insert(data)
            >>> index_param = {"index_type": "FLAT", "metric_type": "L2", "params": {}}
            >>> collection.create_index("films", index_param)
            >>> collection.load()
            >>> # query
            >>> expr = "film_id <= 1"
            >>> res = collection.query(expr, output_fields=["film_date"], offset=1, limit=1)
            >>> assert len(res) == 1
            >>> print(f"- Query results: {res}")
            - Query results: [{'film_id': 1, 'film_date': 2001}]
        """
        if not isinstance(expr, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(expr))

        conn = self._get_connection()
        return conn.query(
            self._name,
            expr,
            output_fields,
            partition_names,
            timeout=timeout,
            schema=self._schema_dict,
            **kwargs,
        )

    def query_iterator(
        self,
        batch_size: Optional[int] = 1000,
        limit: Optional[int] = UNLIMITED,
        expr: Optional[str] = None,
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if expr is not None and not isinstance(expr, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(expr))
        return QueryIterator(
            connection=self._get_connection(),
            collection_name=self._name,
            batch_size=batch_size,
            limit=limit,
            expr=expr,
            output_fields=output_fields,
            partition_names=partition_names,
            schema=self._schema_dict,
            timeout=timeout,
            **kwargs,
        )

    @property
    def partitions(self) -> List[Partition]:
        """List[Partition]: List of Partition object.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_partitions", schema)
            >>> collection.partitions
            [{"name": "_default", "description": "", "num_entities": 0}]
        """
        conn = self._get_connection()
        partition_strs = conn.list_partitions(self._name)
        partitions = []
        for partition in partition_strs:
            partitions.append(Partition(self, partition, construct_only=True))
        return partitions

    def partition(self, partition_name: str, **kwargs) -> Partition:
        """Get the existing partition object according to name. Return None if not existed.

        Args:
            partition_name (``str``): The name of the partition to get.

        Returns:
            Partition: Partition object corresponding to partition_name.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_partition", schema)
            >>> collection.partition("_default")
            {"name": "_default", "description": "", "num_entities": 0}
        """
        if not self.has_partition(partition_name, **kwargs):
            return None
        return Partition(self, partition_name, construct_only=True, **kwargs)

    def create_partition(self, partition_name: str, description: str = "", **kwargs) -> Partition:
        """Create a new partition corresponding to name if not existed.

        Args:
            partition_name (``str``): The name of the partition to create.
            description (``str``, optional): The description of this partition.

        Returns:
            Partition: Partition object corresponding to partition_name.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_create_partition", schema)
            >>> collection.create_partition("comedy", description="comedy films")
            {"name": "comedy", "collection_name": "test_create_partition", "description": ""}
            >>> collection.partition("comedy")
            {"name": "comedy", "collection_name": "test_create_partition", "description": ""}
        """
        if self.has_partition(partition_name, **kwargs) is True:
            raise PartitionAlreadyExistException(message=ExceptionsMessage.PartitionAlreadyExist)
        return Partition(self, partition_name, description=description, **kwargs)

    def has_partition(self, partition_name: str, timeout: Optional[float] = None, **kwargs) -> bool:
        """Checks if a specified partition exists.

        Args:
            partition_name (``str``): The name of the partition to check.
            timeout (``float``, optional): An optional duration of time in seconds to allow for
                the RPC. When timeout is set to None, client waits until server
                response or error occur.

        Returns:
            bool: True if exists, otherwise false.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_has_partition", schema)
            >>> collection.create_partition("comedy", description="comedy films")
            {"name": "comedy", "description": "comedy films", "num_entities": 0}
            >>> collection.has_partition("comedy")
            True
            >>> collection.has_partition("science_fiction")
            False
        """
        conn = self._get_connection()
        return conn.has_partition(self._name, partition_name, timeout=timeout, **kwargs)

    def drop_partition(self, partition_name: str, timeout: Optional[float] = None, **kwargs):
        """Drop the partition in this collection.

        Args:
            partition_name (``str``): The name of the partition to drop.
            timeout (``float``, optional): An optional duration of time in seconds to allow for
                the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_drop_partition", schema)
            >>> collection.create_partition("comedy", description="comedy films")
            {"name": "comedy", "description": "comedy films", "num_entities": 0}
            >>> collection.has_partition("comedy")
            True
            >>> collection.drop_partition("comedy")
            >>> collection.has_partition("comedy")
            False
        """
        conn = self._get_connection()
        return conn.drop_partition(self._name, partition_name, timeout=timeout, **kwargs)

    @property
    def indexes(self) -> List[Index]:
        """List[Index]: list of indexes of this collection.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_indexes", schema)
            >>> collection.indexes
            []
        """
        conn = self._get_connection()
        indexes = []
        tmp_index = conn.list_indexes(self._name)
        for index in tmp_index:
            if index is not None:
                info_dict = {kv.key: kv.value for kv in index.params}
                if info_dict.get("params"):
                    info_dict["params"] = json.loads(info_dict["params"])

                index_info = Index(
                    collection=self,
                    field_name=index.field_name,
                    index_params=info_dict,
                    index_name=index.index_name,
                    construct_only=True,
                )
                indexes.append(index_info)
        return indexes

    def index(self, **kwargs) -> Index:
        """Get the index object of index name.

        Args:
            **kwargs (``dict``):
                * *index_name* (``str``)
                    The name of index. If no index is specified, the default index name is used.

        Returns:
            Index: Index object corresponding to index_name.

        Raises:
            IndexNotExistException: If the index doesn't exists.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_index", schema)
            >>> index = {"index_type": "IVF_FLAT", "params": {"nlist": 128}, "metric_type": "L2"}
            >>> collection.create_index("films", index)
            Status(code=0, message='')
            >>> collection.indexes
            [<pymilvus.index.Index object at 0x7f4435587e20>]
            >>> collection.index()
            <pymilvus.index.Index object at 0x7f44355a1460>
        """
        copy_kwargs = copy.deepcopy(kwargs)
        index_name = copy_kwargs.pop("index_name", Config.IndexName)
        conn = self._get_connection()
        tmp_index = conn.describe_index(self._name, index_name, **copy_kwargs)
        if tmp_index is not None:
            field_name = tmp_index.pop("field_name", None)
            index_name = tmp_index.pop("index_name", index_name)
            tmp_index.pop("total_rows")
            tmp_index.pop("indexed_rows")
            tmp_index.pop("pending_index_rows")
            tmp_index.pop("state")
            return Index(self, field_name, tmp_index, construct_only=True, index_name=index_name)
        raise IndexNotExistException(message=ExceptionsMessage.IndexNotExist)

    def create_index(
        self,
        field_name: str,
        index_params: Optional[Dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Creates index for a specified field, with a index name.

        Args:
            field_name (``str``): The name of the field to create index
            index_params (``dict``, optional): The parameters to index
                * *index_type* (``str``)
                    "index_type" as the key, example values: "FLAT", "IVF_FLAT", etc.

                * *metric_type* (``str``)
                    "metric_type" as the key, examples values: "L2", "IP", "JACCARD".

                * *params* (``dict``)
                    "params" as the key, corresponding index params.

            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server
                response or error occur.
            index_name (``str``): The name of index which will be created, must be unique.
                If no index name is specified, the default index name will be used.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_create_index", schema)
            >>> index_params = {
            ...     "index_type": "IVF_FLAT",
            ...     "params": {"nlist": 128},
            ...     "metric_type": "L2"}
            >>> collection.create_index("films", index_params, index_name="idx")
            Status(code=0, message='')
        """
        conn = self._get_connection()
        return conn.create_index(self._name, field_name, index_params, timeout=timeout, **kwargs)

    def alter_index(
        self,
        index_name: str,
        extra_params: dict,
        timeout: Optional[float] = None,
    ):
        """Alter index for a specified field, with a index name.
        Args:
            index_name (``str``): The name of the index to alter
            extra_params (``dict``): The parameters to index
                * *mmap.enabled* (``str``)
                    "mmap.enabled" as the key, example values: True or False.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server
                response or error occur.
        Raises:
            MilvusException: If anything goes wrong.
        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> from pymilvus import IndexType, MetricType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("title", DataType.STRING),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_alter_index", schema)
            >>> index_params = {
            ...     "index_type": IndexType.IVF_FLAT,
            ...     "metric_type": MetricType.L2,
            ...     "params": {"nlist": 128}
            ... }
            >>> collection.create_index("films", index_params, index_name="idx")
            Status(code=0, message='')
            >>> collection.alter_index_properties("idx", {"mmap.enabled": True})
        """
        conn = self._get_connection()
        return conn.alter_index_properties(self._name, index_name, extra_params, timeout=timeout)

    def has_index(self, timeout: Optional[float] = None, **kwargs) -> bool:
        """Check whether a specified index exists.

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            **kwargs (``dict``):
                * *index_name* (``str``)
                  The name of index. If no index is specified, the default index name will be used.

        Returns:
            bool: Whether the specified index exists.

        Examples:
            >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_has_index", schema)
            >>> index = {"index_type": "IVF_FLAT", "params": {"nlist": 128}, "metric_type": "L2"}
            >>> collection.create_index("films", index)
            >>> collection.has_index()
            True
        """
        conn = self._get_connection()
        copy_kwargs = copy.deepcopy(kwargs)
        index_name = copy_kwargs.pop("index_name", Config.IndexName)

        return (
            conn.describe_index(self._name, index_name, timeout=timeout, **copy_kwargs) is not None
        )

    def drop_index(self, timeout: Optional[float] = None, **kwargs):
        """Drop index and its corresponding index files.
        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            **kwargs (``dict``):
                * *index_name* (``str``)
                  The name of index. If no index is specified, the default index name will be used.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus Collection, FieldSchema, CollectionSchema, DataType
            >>> schema = CollectionSchema([
            ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
            ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
            ... ])
            >>> collection = Collection("test_collection_has_index", schema)
            >>> index = {"index_type": "IVF_FLAT", "params": {"nlist": 128}, "metric_type": "L2"}
            >>> collection.create_index("films", index)
            >>> collection.has_index()
            True
            >>> collection.drop_index()
            >>> collection.has_index()
            False
        """
        copy_kwargs = copy.deepcopy(kwargs)
        index_name = copy_kwargs.pop("index_name", Config.IndexName)
        conn = self._get_connection()
        tmp_index = conn.describe_index(self._name, index_name, timeout=timeout, **copy_kwargs)
        if tmp_index is not None:
            conn.drop_index(
                collection_name=self._name,
                field_name=tmp_index["field_name"],
                index_name=index_name,
                timeout=timeout,
                **copy_kwargs,
            )

    def compact(
        self, is_clustering: Optional[bool] = False, timeout: Optional[float] = None, **kwargs
    ):
        """Compact merge the small segments in a collection

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            is_clustering (``bool``, optional): Option to trigger clustering compaction.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        if is_clustering:
            self.clustering_compaction_id = conn.compact(
                self._name, is_clustering=is_clustering, timeout=timeout, **kwargs
            )
        else:
            self.compaction_id = conn.compact(
                self._name, is_clustering=is_clustering, timeout=timeout, **kwargs
            )

    def get_compaction_state(
        self, timeout: Optional[float] = None, is_clustering: Optional[bool] = False, **kwargs
    ) -> CompactionState:
        """Get the current compaction state

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            is_clustering (``bool``, optional): Option to get clustering compaction state.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        if is_clustering:
            return conn.get_compaction_state(
                self.clustering_compaction_id, timeout=timeout, **kwargs
            )
        return conn.get_compaction_state(self.compaction_id, timeout=timeout, **kwargs)

    def wait_for_compaction_completed(
        self,
        timeout: Optional[float] = None,
        is_clustering: Optional[bool] = False,
        **kwargs,
    ) -> CompactionState:
        """Block until the current collection's compaction completed

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            is_clustering (``bool``, optional): Option to get clustering compaction state.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        if is_clustering:
            return conn.wait_for_compaction_completed(
                self.clustering_compaction_id, timeout=timeout, **kwargs
            )
        return conn.wait_for_compaction_completed(self.compaction_id, timeout=timeout, **kwargs)

    def get_compaction_plans(
        self, timeout: Optional[float] = None, is_clustering: Optional[bool] = False, **kwargs
    ) -> CompactionPlans:
        """Get the current compaction plans

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            is_clustering (``bool``, optional): Option to get clustering compaction plan.

        Returns:
            CompactionPlans: All the plans' states of this compaction.
        """
        conn = self._get_connection()
        if is_clustering:
            return conn.get_compaction_plans(
                self.clustering_compaction_id, timeout=timeout, **kwargs
            )
        return conn.get_compaction_plans(self.compaction_id, timeout=timeout, **kwargs)

    def get_replicas(self, timeout: Optional[float] = None, **kwargs) -> Replica:
        """Get the current loaded replica information

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.
        Returns:
            Replica: All the replica information.
        """
        conn = self._get_connection()
        return conn.get_replicas(self.name, timeout=timeout, **kwargs)

    def describe(self, timeout: Optional[float] = None):
        conn = self._get_connection()
        return conn.describe_collection(self.name, timeout=timeout)
