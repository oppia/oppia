import logging
from typing import Dict, List, Optional, Union

from pymilvus.client.abstract import AnnSearchRequest, BaseRanker
from pymilvus.client.constants import DEFAULT_CONSISTENCY_LEVEL
from pymilvus.client.search_iterator import SearchIteratorV2
from pymilvus.client.types import (
    ExceptionsMessage,
    LoadState,
    OmitZeroDict,
    ReplicaInfo,
    ResourceGroupConfig,
)
from pymilvus.client.utils import get_params, is_vector_type
from pymilvus.exceptions import (
    DataTypeNotMatchException,
    ErrorCode,
    MilvusException,
    ParamError,
    PrimaryKeyException,
    ServerVersionIncompatibleException,
)
from pymilvus.orm import utility
from pymilvus.orm.collection import CollectionSchema
from pymilvus.orm.connections import connections
from pymilvus.orm.constants import FIELDS, METRIC_TYPE, TYPE, UNLIMITED
from pymilvus.orm.iterator import QueryIterator, SearchIterator
from pymilvus.orm.types import DataType

from ._utils import create_connection
from .check import validate_param
from .index import IndexParam, IndexParams

logger = logging.getLogger(__name__)


class MilvusClient:
    """The Milvus Client"""

    # pylint: disable=logging-too-many-args, too-many-instance-attributes

    def __init__(
        self,
        uri: str = "http://localhost:19530",
        user: str = "",
        password: str = "",
        db_name: str = "",
        token: str = "",
        timeout: Optional[float] = None,
        **kwargs,
    ) -> None:
        """A client for the common Milvus use case.

        This client attempts to hide away the complexity of using Pymilvus. In a lot ofcases what
        the user wants is a simple wrapper that supports adding data, deleting data, and searching.

        Args:
            uri (str, optional): The connection address to use to connect to the
                instance. Defaults to "http://localhost:19530". Another example:
                "https://username:password@in01-12a.aws-us-west-2.vectordb.zillizcloud.com:19538
            timeout (float, optional): What timeout to use for function calls. Defaults
                to None.
        """
        self._using = create_connection(
            uri, token, db_name, user=user, password=password, timeout=timeout, **kwargs
        )
        self.is_self_hosted = bool(utility.get_server_type(using=self._using) == "milvus")

    def create_collection(
        self,
        collection_name: str,
        dimension: Optional[int] = None,
        primary_field_name: str = "id",  # default is "id"
        id_type: str = "int",  # or "string",
        vector_field_name: str = "vector",  # default is  "vector"
        metric_type: str = "COSINE",
        auto_id: bool = False,
        timeout: Optional[float] = None,
        schema: Optional[CollectionSchema] = None,
        index_params: Optional[IndexParams] = None,
        **kwargs,
    ):
        if schema is None:
            return self._fast_create_collection(
                collection_name,
                dimension,
                primary_field_name=primary_field_name,
                id_type=id_type,
                vector_field_name=vector_field_name,
                metric_type=metric_type,
                auto_id=auto_id,
                timeout=timeout,
                **kwargs,
            )

        return self._create_collection_with_schema(
            collection_name, schema, index_params, timeout=timeout, **kwargs
        )

    def _fast_create_collection(
        self,
        collection_name: str,
        dimension: int,
        primary_field_name: str = "id",  # default is "id"
        id_type: Union[DataType, str] = DataType.INT64,  # or "string",
        vector_field_name: str = "vector",  # default is  "vector"
        metric_type: str = "COSINE",
        auto_id: bool = False,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        validate_param("dimension", dimension, int)

        if "enable_dynamic_field" not in kwargs:
            kwargs["enable_dynamic_field"] = True

        schema = self.create_schema(auto_id=auto_id, **kwargs)

        if id_type in ("int", DataType.INT64):
            pk_data_type = DataType.INT64
        elif id_type in ("string", "str", DataType.VARCHAR):
            pk_data_type = DataType.VARCHAR
        else:
            raise PrimaryKeyException(message=ExceptionsMessage.PrimaryFieldType)

        pk_args = {}
        if "max_length" in kwargs and pk_data_type == DataType.VARCHAR:
            pk_args["max_length"] = kwargs["max_length"]

        schema.add_field(primary_field_name, pk_data_type, is_primary=True, **pk_args)
        schema.add_field(vector_field_name, DataType.FLOAT_VECTOR, dim=dimension)
        schema.verify()

        conn = self._get_connection()
        if "consistency_level" not in kwargs:
            kwargs["consistency_level"] = DEFAULT_CONSISTENCY_LEVEL
        try:
            conn.create_collection(collection_name, schema, timeout=timeout, **kwargs)
            logger.debug("Successfully created collection: %s", collection_name)
        except Exception as ex:
            logger.error("Failed to create collection: %s", collection_name)
            raise ex from ex

        index_params = IndexParams()
        index_params.add_index(vector_field_name, index_type="AUTOINDEX", metric_type=metric_type)
        self.create_index(collection_name, index_params, timeout=timeout)
        self.load_collection(collection_name, timeout=timeout)

    def create_index(
        self,
        collection_name: str,
        index_params: IndexParams,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        validate_param("collection_name", collection_name, str)
        validate_param("index_params", index_params, IndexParams)
        if len(index_params) == 0:
            raise ParamError(message="IndexParams is empty, no index can be created")

        for index_param in index_params:
            self._create_index(collection_name, index_param, timeout=timeout, **kwargs)

    def _create_index(
        self,
        collection_name: str,
        index_param: IndexParam,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        try:
            conn.create_index(
                collection_name,
                index_param.field_name,
                index_param.get_index_configs(),
                timeout=timeout,
                index_name=index_param.index_name,
                **kwargs,
            )
            logger.debug("Successfully created an index on collection: %s", collection_name)
        except Exception as ex:
            logger.error("Failed to create an index on collection: %s", collection_name)
            raise ex from ex

    def insert(
        self,
        collection_name: str,
        data: Union[Dict, List[Dict]],
        timeout: Optional[float] = None,
        partition_name: Optional[str] = "",
        **kwargs,
    ) -> Dict:
        """Insert data into the collection.

        If the Milvus Client was initiated without an existing Collection, the first dict passed
        in will be used to initiate the collection.

        Args:
            data (List[Dict[str, any]]): A list of dicts to pass in. If list not provided, will
                cast to list.
            timeout (float, optional): The timeout to use, will override init timeout. Defaults
                to None.

        Raises:
            DataNotMatchException: If the data has missing fields an exception will be thrown.
            MilvusException: General Milvus error on insert.

        Returns:
            Dict: Number of rows that were inserted and the inserted primary key list.
        """
        # If no data provided, we cannot input anything
        if isinstance(data, Dict):
            data = [data]

        msg = "wrong type of argument 'data',"
        msg += f"expected 'Dict' or list of 'Dict', got '{type(data).__name__}'"

        if not isinstance(data, List):
            raise TypeError(msg)

        if len(data) == 0:
            return {"insert_count": 0, "ids": []}

        conn = self._get_connection()
        # Insert into the collection.
        try:
            res = conn.insert_rows(
                collection_name, data, partition_name=partition_name, timeout=timeout
            )
        except Exception as ex:
            raise ex from ex
        return OmitZeroDict(
            {
                "insert_count": res.insert_count,
                "ids": res.primary_keys,
                "cost": res.cost,
            }
        )

    def upsert(
        self,
        collection_name: str,
        data: Union[Dict, List[Dict]],
        timeout: Optional[float] = None,
        partition_name: Optional[str] = "",
        **kwargs,
    ) -> Dict:
        """Upsert data into the collection.

        Args:
            data (List[Dict[str, any]]): A list of dicts to pass in. If list not provided, will
                cast to list.
            timeout (float, optional): The timeout to use, will override init timeout. Defaults
                to None.

        Raises:
            DataNotMatchException: If the data has missing fields an exception will be thrown.
            MilvusException: General Milvus error on upsert.

        Returns:
            Dict: Number of rows that were upserted.
        """
        # If no data provided, we cannot input anything
        if isinstance(data, Dict):
            data = [data]

        msg = "wrong type of argument 'data',"
        msg += f"expected 'Dict' or list of 'Dict', got '{type(data).__name__}'"

        if not isinstance(data, List):
            raise TypeError(msg)

        if len(data) == 0:
            return {"upsert_count": 0}

        conn = self._get_connection()
        # Upsert into the collection.
        try:
            res = conn.upsert_rows(
                collection_name, data, partition_name=partition_name, timeout=timeout, **kwargs
            )
        except Exception as ex:
            raise ex from ex

        return OmitZeroDict(
            {
                "upsert_count": res.upsert_count,
                "cost": res.cost,
                # milvus server supports upsert on autoid=ture from v2.4.15
                # upsert on autoid=ture will return new ids for user
                "primary_keys": res.primary_keys,
            }
        )

    def hybrid_search(
        self,
        collection_name: str,
        reqs: List[AnnSearchRequest],
        ranker: BaseRanker,
        limit: int = 10,
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        partition_names: Optional[List[str]] = None,
        **kwargs,
    ) -> List[List[dict]]:
        """Conducts multi vector similarity search with a rerank for rearrangement.

        Args:
            collection_name(``string``): The name of collection.
            reqs (``List[AnnSearchRequest]``): The vector search requests.
            ranker (``BaseRanker``): The ranker for rearrange nummer of limit results.
            limit (``int``): The max number of returned record, also known as `topk`.

            partition_names (``List[str]``, optional): The names of partitions to search on.
            output_fields (``List[str]``, optional):
                The name of fields to return in the search result.  Can only get scalar fields.
            round_decimal (``int``, optional):
                The specified number of decimal places of returned distance.
                Defaults to -1 means no round to returned distance.
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server
                responds or an error occurs.
            **kwargs (``dict``): Optional search params

                * *offset* (``int``, optinal)
                    offset for pagination.

                * *consistency_level* (``str/int``, optional)
                    Which consistency level to use when searching in the collection.

                    Options of consistency level: Strong, Bounded, Eventually, Session, Customized.

                    Note: this parameter overwrites the same one specified when creating collection,
                    if no consistency level was specified, search will use the
                    consistency level when you create the collection.

        Returns:
            List[List[dict]]: A nested list of dicts containing the result data.

        Raises:
            MilvusException: If anything goes wrong
        """

        conn = self._get_connection()
        try:
            res = conn.hybrid_search(
                collection_name,
                reqs,
                ranker,
                limit=limit,
                partition_names=partition_names,
                output_fields=output_fields,
                timeout=timeout,
                **kwargs,
            )
        except Exception as ex:
            logger.error("Failed to hybrid search collection: %s", collection_name)
            raise ex from ex

        return res

    def search(
        self,
        collection_name: str,
        data: Union[List[list], list],
        filter: str = "",
        limit: int = 10,
        output_fields: Optional[List[str]] = None,
        search_params: Optional[dict] = None,
        timeout: Optional[float] = None,
        partition_names: Optional[List[str]] = None,
        anns_field: Optional[str] = None,
        **kwargs,
    ) -> List[List[dict]]:
        """Search for a query vector/vectors.

        In order for the search to process, a collection needs to have been either provided
        at init or data needs to have been inserted.

        Args:
            data (Union[List[list], list]): The vector/vectors to search.
            limit (int, optional): How many results to return per search. Defaults to 10.
            filter(str, optional): A filter to use for the search. Defaults to None.
            output_fields (List[str], optional): List of which field values to return. If None
                specified, only primary fields including distances will be returned.
            search_params (dict, optional): The search params to use for the search.
            timeout (float, optional): Timeout to use, overides the client level assigned at init.
                Defaults to None.

        Raises:
            ValueError: The collection being searched doesnt exist. Need to insert data first.

        Returns:
            List[List[dict]]: A nested list of dicts containing the result data. Embeddings are
                not included in the result data.
        """
        conn = self._get_connection()
        try:
            res = conn.search(
                collection_name,
                data,
                anns_field or "",
                search_params or {},
                expression=filter,
                limit=limit,
                output_fields=output_fields,
                partition_names=partition_names,
                expr_params=kwargs.pop("filter_params", {}),
                timeout=timeout,
                **kwargs,
            )
        except Exception as ex:
            logger.error("Failed to search collection: %s", collection_name)
            raise ex from ex

        return res

    def query(
        self,
        collection_name: str,
        filter: str = "",
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        ids: Optional[Union[List, str, int]] = None,
        partition_names: Optional[List[str]] = None,
        **kwargs,
    ) -> List[dict]:
        """Query for entries in the Collection.

        Args:
            filter (str): The filter to use for the query.
            output_fields (List[str], optional): List of which field values to return. If None
                specified, all fields excluding vector field will be returned.
            partitions (List[str], optional): Which partitions to perform query. Defaults to None.
            timeout (float, optional): Timeout to use, overides the client level assigned at init.
                Defaults to None.

        Raises:
            ValueError: Missing collection.

        Returns:
            List[dict]: A list of result dicts, vectors are not included.
        """
        if filter and not isinstance(filter, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(filter))

        if filter and ids is not None:
            raise ParamError(message=ExceptionsMessage.AmbiguousQueryFilterParam)

        if isinstance(ids, (int, str)):
            ids = [ids]

        conn = self._get_connection()

        if ids:
            try:
                schema_dict = conn.describe_collection(collection_name, timeout=timeout, **kwargs)
            except Exception as ex:
                logger.error("Failed to describe collection: %s", collection_name)
                raise ex from ex
            filter = self._pack_pks_expr(schema_dict, ids)

        if not output_fields:
            output_fields = ["*"]

        try:
            res = conn.query(
                collection_name,
                expr=filter,
                output_fields=output_fields,
                partition_names=partition_names,
                timeout=timeout,
                expr_params=kwargs.pop("filter_params", {}),
                **kwargs,
            )
        except Exception as ex:
            logger.error("Failed to query collection: %s", collection_name)
            raise ex from ex

        return res

    def query_iterator(
        self,
        collection_name: str,
        batch_size: Optional[int] = 1000,
        limit: Optional[int] = UNLIMITED,
        filter: Optional[str] = "",
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if filter is not None and not isinstance(filter, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(filter))

        conn = self._get_connection()
        # set up schema for iterator
        try:
            schema_dict = conn.describe_collection(collection_name, timeout=timeout, **kwargs)
        except Exception as ex:
            logger.error("Failed to describe collection: %s", collection_name)
            raise ex from ex

        return QueryIterator(
            connection=conn,
            collection_name=collection_name,
            batch_size=batch_size,
            limit=limit,
            expr=filter,
            output_fields=output_fields,
            partition_names=partition_names,
            schema=schema_dict,
            timeout=timeout,
            **kwargs,
        )

    def search_iterator(
        self,
        collection_name: str,
        data: Union[List[list], list],
        batch_size: Optional[int] = 1000,
        filter: Optional[str] = None,
        limit: Optional[int] = UNLIMITED,
        output_fields: Optional[List[str]] = None,
        search_params: Optional[dict] = None,
        timeout: Optional[float] = None,
        partition_names: Optional[List[str]] = None,
        anns_field: Optional[str] = None,
        round_decimal: int = -1,
        **kwargs,
    ) -> Union[SearchIteratorV2, SearchIterator]:
        """Creates an iterator for searching vectors in batches.

        This method returns an iterator that performs vector similarity search in batches,
        which is useful when dealing with large result sets. It automatically attempts to use
        Search Iterator V2 if supported by the server, otherwise falls back to V1.

        Args:
            collection_name (str): Name of the collection to search in.
            data (Union[List[list], list]): Vector data to search with. For V2, only single vector
                search is supported.
            batch_size (int, optional): Number of results to fetch per batch. Defaults to 1000.
                Must be between 1 and MAX_BATCH_SIZE.
            filter (str, optional): Filtering expression to filter the results. Defaults to None.
            limit (int, optional): Total number of results to return. Defaults to UNLIMITED.
                (Deprecated) This parameter is deprecated and will be removed in a future release.
            output_fields (List[str], optional): Fields to return in the results.
            search_params (dict, optional): Parameters for the search operation.
            timeout (float, optional): Timeout in seconds for each RPC call.
            partition_names (List[str], optional): Names of partitions to search in.
            anns_field (str, optional): Name of the vector field to search. Can be empty when
                there is only one vector field in the collection.
            round_decimal (int, optional): Number of decimal places for distance values.
                Defaults to -1 (no rounding).
            **kwargs: Additional arguments to pass to the search operation.

        Returns:
            SearchIterator: An iterator object that yields search results in batches.

        Raises:
            MilvusException: If the search operation fails.
            ParamError: If the input parameters are invalid (e.g., invalid batch_size or multiple
                vectors in data when using V2).

        Examples:
            >>> # Search with iterator
            >>> iterator = client.search_iterator(
            ...     collection_name="my_collection",
            ...     data=[[0.1, 0.2]],
            ...     batch_size=100
            ... )
        """

        conn = self._get_connection()

        # compatibility logic, change this when support get version from server
        try:
            return SearchIteratorV2(
                connection=conn,
                collection_name=collection_name,
                data=data,
                batch_size=batch_size,
                limit=limit,
                filter=filter,
                output_fields=output_fields,
                search_params=search_params or {},
                timeout=timeout,
                partition_names=partition_names,
                anns_field=anns_field or "",
                round_decimal=round_decimal,
                **kwargs,
            )
        except ServerVersionIncompatibleException:
            # for compatibility, return search_iterator V1
            logger.warning(ExceptionsMessage.SearchIteratorV2FallbackWarning)
        except Exception as ex:
            raise ex from ex

        # following is the old code for search_iterator V1
        if filter is not None and not isinstance(filter, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(filter))

        # set up schema for iterator
        try:
            schema_dict = conn.describe_collection(collection_name, timeout=timeout, **kwargs)
        except Exception as ex:
            logger.error("Failed to describe collection: %s", collection_name)
            raise ex from ex
        # if anns_field is not provided
        # if only one vector field, use to search
        # if multiple vector fields, raise exception and abort
        if anns_field is None or anns_field == "":
            vec_field = None
            fields = schema_dict[FIELDS]
            vec_field_count = 0
            for field in fields:
                if is_vector_type(field[TYPE]):
                    vec_field_count += 1
                    vec_field = field
            if vec_field is None:
                raise MilvusException(
                    code=ErrorCode.UNEXPECTED_ERROR,
                    message="there should be at least one vector field in milvus collection",
                )
            if vec_field_count > 1:
                raise MilvusException(
                    code=ErrorCode.UNEXPECTED_ERROR,
                    message="must specify anns_field when there are more than one vector field",
                )
            anns_field = vec_field["name"]
            if anns_field is None or anns_field == "":
                raise MilvusException(
                    code=ErrorCode.UNEXPECTED_ERROR,
                    message=f"cannot get anns_field name for search iterator, got:{anns_field}",
                )
        # set up metrics type for search_iterator which is mandatory
        if search_params is None:
            search_params = {}
        if METRIC_TYPE not in search_params:
            indexes = conn.list_indexes(collection_name)
            for index in indexes:
                if anns_field == index.index_name:
                    params = index.params
                    for param in params:
                        if param.key == METRIC_TYPE:
                            search_params[METRIC_TYPE] = param.value
        if METRIC_TYPE not in search_params:
            raise MilvusException(
                ParamError, f"Cannot set up metrics type for anns_field:{anns_field}"
            )

        search_params["params"] = get_params(search_params)

        return SearchIterator(
            connection=self._get_connection(),
            collection_name=collection_name,
            data=data,
            ann_field=anns_field,
            param=search_params,
            batch_size=batch_size,
            limit=limit,
            expr=filter,
            partition_names=partition_names,
            output_fields=output_fields,
            timeout=timeout,
            round_decimal=round_decimal,
            schema=schema_dict,
            **kwargs,
        )

    def get(
        self,
        collection_name: str,
        ids: Union[list, str, int],
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        partition_names: Optional[List[str]] = None,
        **kwargs,
    ) -> List[dict]:
        """Grab the inserted vectors using the primary key from the Collection.

        Due to current implementations, grabbing a large amount of vectors is slow.

        Args:
            ids (str): The pk's to get vectors for. Depending on pk_field type it can be int or str
            or a list of either.
            timeout (float, optional): Timeout to use, overides the client level assigned at
                init. Defaults to None.

        Raises:
            ValueError: Missing collection.

        Returns:
            List[dict]: A list of result dicts with keys {pk_field, vector_field}
        """
        if not isinstance(ids, list):
            ids = [ids]

        if len(ids) == 0:
            return []

        conn = self._get_connection()
        try:
            schema_dict, _ = conn._get_schema_from_cache_or_remote(collection_name, timeout=timeout)
        except Exception as ex:
            logger.error("Failed to describe collection: %s", collection_name)
            raise ex from ex

        if not output_fields:
            output_fields = ["*"]

        expr = self._pack_pks_expr(schema_dict, ids)
        try:
            res = conn.query(
                collection_name,
                expr=expr,
                output_fields=output_fields,
                partition_names=partition_names,
                timeout=timeout,
                **kwargs,
            )
        except Exception as ex:
            logger.error("Failed to get collection: %s", collection_name)
            raise ex from ex

        return res

    def delete(
        self,
        collection_name: str,
        ids: Optional[Union[list, str, int]] = None,
        timeout: Optional[float] = None,
        filter: Optional[str] = None,
        partition_name: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, int]:
        """Delete entries in the collection by their pk or by filter.

        Starting from version 2.3.2, Milvus no longer includes the primary keys in the result
        when processing the delete operation on expressions.
        This change is due to the large amount of data involved.
        The delete interface no longer returns any results.
        If no exceptions are thrown, it indicates a successful deletion.
        However, for backward compatibility, If the primary_keys returned from old
        Milvus(previous 2.3.2) is not empty, the list of primary keys is still returned.

        Args:
            ids (list, str, int, optional): The pk's to delete.
                Depending on pk_field type it can be int or str or a list of either.
                Default to None.
            filter(str, optional): A filter to use for the deletion. Defaults to none.
            timeout (int, optional): Timeout to use, overides the client level assigned at init.
                Defaults to None.

            Note: You need to passin either ids or filter, and they cannot be used at the same time.

        Returns:
            Dict: with key 'deleted_count' and value number of rows that were deleted.
        """
        pks = kwargs.get("pks", [])
        if isinstance(pks, (int, str)):
            pks = [pks]

        for pk in pks:
            if not isinstance(pk, (int, str)):
                msg = f"wrong type of argument pks, expect list, int or str, got '{type(pk).__name__}'"
                raise TypeError(msg)

        if ids is not None:
            if isinstance(ids, (int, str)):
                pks.append(ids)
            elif isinstance(ids, list):
                for id in ids:
                    if not isinstance(id, (int, str)):
                        msg = f"wrong type of argument ids, expect list, int or str, got '{type(id).__name__}'"
                        raise TypeError(msg)
                pks.extend(ids)
            else:
                msg = f"wrong type of argument ids, expect list, int or str, got '{type(ids).__name__}'"
                raise TypeError(msg)

        # validate ambiguous delete filter param before describe collection rpc
        if filter and len(pks) > 0:
            raise ParamError(message=ExceptionsMessage.AmbiguousDeleteFilterParam)

        expr = ""
        conn = self._get_connection()
        if len(pks) > 0:
            try:
                schema_dict, _ = conn._get_schema_from_cache_or_remote(
                    collection_name, timeout=timeout
                )
            except Exception as ex:
                logger.error("Failed to describe collection: %s", collection_name)
                raise ex from ex
            expr = self._pack_pks_expr(schema_dict, pks)
        else:
            if not isinstance(filter, str):
                raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(filter))
            expr = filter

        ret_pks = []
        try:
            res = conn.delete(
                collection_name=collection_name,
                expression=expr,
                partition_name=partition_name,
                expr_params=kwargs.pop("filter_params", {}),
                timeout=timeout,
                **kwargs,
            )
            if res.primary_keys:
                ret_pks.extend(res.primary_keys)
        except Exception as ex:
            logger.error("Failed to delete primary keys in collection: %s", collection_name)
            raise ex from ex

        # compatible with deletions that returns primary keys
        if ret_pks:
            return ret_pks

        return OmitZeroDict({"delete_count": res.delete_count, "cost": res.cost})

    def get_collection_stats(self, collection_name: str, timeout: Optional[float] = None) -> Dict:
        conn = self._get_connection()
        stats = conn.get_collection_stats(collection_name, timeout=timeout)
        result = {stat.key: stat.value for stat in stats}
        if "row_count" in result:
            result["row_count"] = int(result["row_count"])
        return result

    def describe_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        return conn.describe_collection(collection_name, timeout=timeout, **kwargs)

    def has_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        return conn.has_collection(collection_name, timeout=timeout, **kwargs)

    def list_collections(self, **kwargs):
        conn = self._get_connection()
        return conn.list_collections(**kwargs)

    def drop_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        """Delete the collection stored in this object"""
        conn = self._get_connection()
        conn.drop_collection(collection_name, timeout=timeout, **kwargs)

    def rename_collection(
        self,
        old_name: str,
        new_name: str,
        target_db: Optional[str] = "",
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.rename_collections(old_name, new_name, target_db, timeout=timeout, **kwargs)

    @classmethod
    def create_schema(cls, **kwargs):
        kwargs["check_fields"] = False  # do not check fields for now
        return CollectionSchema([], **kwargs)

    @classmethod
    def prepare_index_params(cls, field_name: str = "", **kwargs) -> IndexParams:
        index_params = IndexParams()
        if field_name:
            validate_param("field_name", field_name, str)
            index_params.add_index(field_name, **kwargs)
        return index_params

    def _create_collection_with_schema(
        self,
        collection_name: str,
        schema: CollectionSchema,
        index_params: IndexParams,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        schema.verify()

        conn = self._get_connection()
        if "consistency_level" not in kwargs:
            kwargs["consistency_level"] = DEFAULT_CONSISTENCY_LEVEL
        try:
            conn.create_collection(collection_name, schema, timeout=timeout, **kwargs)
            logger.debug("Successfully created collection: %s", collection_name)
        except Exception as ex:
            logger.error("Failed to create collection: %s", collection_name)
            raise ex from ex

        if index_params:
            self.create_index(collection_name, index_params, timeout=timeout)
            self.load_collection(collection_name, timeout=timeout)

    def close(self):
        connections.remove_connection(self._using)

    def _get_connection(self):
        return connections._fetch_handler(self._using)

    def _extract_primary_field(self, schema_dict: Dict) -> dict:
        fields = schema_dict.get("fields", [])
        if not fields:
            return {}

        for field_dict in fields:
            if field_dict.get("is_primary", None) is not None:
                return field_dict

        return {}

    def _pack_pks_expr(self, schema_dict: Dict, pks: List) -> str:
        primary_field = self._extract_primary_field(schema_dict)
        pk_field_name = primary_field["name"]
        data_type = primary_field["type"]

        # Varchar pks need double quotes around the values
        if data_type == DataType.VARCHAR:
            ids = ["'" + str(entry) + "'" for entry in pks]
            expr = f"""{pk_field_name} in [{",".join(ids)}]"""
        else:
            ids = [str(entry) for entry in pks]
            expr = f"{pk_field_name} in [{','.join(ids)}]"
        return expr

    def load_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        """Loads the collection."""
        conn = self._get_connection()
        try:
            conn.load_collection(collection_name, timeout=timeout, **kwargs)
        except MilvusException as ex:
            logger.error("Failed to load collection: %s", collection_name)
            raise ex from ex

    def release_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        try:
            conn.release_collection(collection_name, timeout=timeout, **kwargs)
        except MilvusException as ex:
            logger.error("Failed to load collection: %s", collection_name)
            raise ex from ex

    def get_load_state(
        self,
        collection_name: str,
        partition_name: Optional[str] = "",
        timeout: Optional[float] = None,
        **kwargs,
    ) -> Dict:
        conn = self._get_connection()
        partition_names = None
        if partition_name:
            partition_names = [partition_name]
        try:
            state = conn.get_load_state(collection_name, partition_names, timeout=timeout, **kwargs)
        except Exception as ex:
            raise ex from ex

        ret = {"state": state}
        if state == LoadState.Loading:
            progress = conn.get_loading_progress(collection_name, partition_names, timeout=timeout)
            ret["progress"] = progress

        return ret

    def refresh_load(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        kwargs.pop("_refresh", None)
        conn = self._get_connection()
        conn.load_collection(collection_name, timeout=timeout, _refresh=True, **kwargs)

    def list_indexes(self, collection_name: str, field_name: Optional[str] = "", **kwargs):
        """List all indexes of collection. If `field_name` is not specified,
            return all the indexes of this collection, otherwise this interface will return
            all indexes on this field of the collection.

        :param collection_name: The name of collection.
        :type  collection_name: str

        :param field_name: The name of field.  If no field name is specified, all indexes
                of this collection will be returned.

        :return: The name list of all indexes.
        :rtype: str list
        """
        conn = self._get_connection()
        indexes = conn.list_indexes(collection_name, **kwargs)
        index_name_list = []
        for index in indexes:
            if not index:
                continue
            if not field_name or index.field_name == field_name:
                index_name_list.append(index.index_name)
        return index_name_list

    def drop_index(
        self, collection_name: str, index_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.drop_index(collection_name, "", index_name, timeout=timeout, **kwargs)

    def describe_index(
        self, collection_name: str, index_name: str, timeout: Optional[float] = None, **kwargs
    ) -> Dict:
        conn = self._get_connection()
        return conn.describe_index(collection_name, index_name, timeout=timeout, **kwargs)

    def alter_index_properties(
        self,
        collection_name: str,
        index_name: str,
        properties: dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.alter_index_properties(
            collection_name, index_name, properties=properties, timeout=timeout, **kwargs
        )

    def drop_index_properties(
        self,
        collection_name: str,
        index_name: str,
        property_keys: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.drop_index_properties(
            collection_name, index_name, property_keys=property_keys, timeout=timeout, **kwargs
        )

    def alter_collection_properties(
        self, collection_name: str, properties: dict, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.alter_collection_properties(
            collection_name,
            properties=properties,
            timeout=timeout,
            **kwargs,
        )

    def drop_collection_properties(
        self,
        collection_name: str,
        property_keys: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.drop_collection_properties(
            collection_name, property_keys=property_keys, timeout=timeout, **kwargs
        )

    def alter_collection_field(
        self,
        collection_name: str,
        field_name: str,
        field_params: dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.alter_collection_field_properties(
            collection_name,
            field_name=field_name,
            field_params=field_params,
            timeout=timeout,
            **kwargs,
        )

    def create_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.create_partition(collection_name, partition_name, timeout=timeout, **kwargs)

    def drop_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.drop_partition(collection_name, partition_name, timeout=timeout, **kwargs)

    def has_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ) -> bool:
        conn = self._get_connection()
        return conn.has_partition(collection_name, partition_name, timeout=timeout, **kwargs)

    def list_partitions(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ) -> List[str]:
        conn = self._get_connection()
        return conn.list_partitions(collection_name, timeout=timeout, **kwargs)

    def load_partitions(
        self,
        collection_name: str,
        partition_names: Union[str, List[str]],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if isinstance(partition_names, str):
            partition_names = [partition_names]

        conn = self._get_connection()
        conn.load_partitions(collection_name, partition_names, timeout=timeout, **kwargs)

    def release_partitions(
        self,
        collection_name: str,
        partition_names: Union[str, List[str]],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if isinstance(partition_names, str):
            partition_names = [partition_names]
        conn = self._get_connection()
        conn.release_partitions(collection_name, partition_names, timeout=timeout, **kwargs)

    def get_partition_stats(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ) -> Dict:
        conn = self._get_connection()
        if not isinstance(partition_name, str):
            msg = f"wrong type of argument 'partition_name', str expected, got '{type(partition_name).__name__}'"
            raise TypeError(msg)
        ret = conn.get_partition_stats(collection_name, partition_name, timeout=timeout, **kwargs)
        result = {stat.key: stat.value for stat in ret}
        if "row_count" in result:
            result["row_count"] = int(result["row_count"])
        return result

    def create_user(self, user_name: str, password: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        return conn.create_user(user_name, password, timeout=timeout, **kwargs)

    def drop_user(self, user_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        return conn.delete_user(user_name, timeout=timeout, **kwargs)

    def update_password(
        self,
        user_name: str,
        old_password: str,
        new_password: str,
        reset_connection: Optional[bool] = False,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.update_password(user_name, old_password, new_password, timeout=timeout, **kwargs)
        if reset_connection:
            conn._setup_authorization_interceptor(user_name, new_password, None)
            conn._setup_grpc_channel()

    def list_users(self, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        return conn.list_usernames(timeout=timeout, **kwargs)

    def describe_user(self, user_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        try:
            res = conn.select_one_user(user_name, True, timeout=timeout, **kwargs)
        except Exception as ex:
            raise ex from ex
        if res.groups:
            item = res.groups[0]
            return {"user_name": user_name, "roles": item.roles}
        return {}

    def grant_role(self, user_name: str, role_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        conn.add_user_to_role(user_name, role_name, timeout=timeout, **kwargs)

    def revoke_role(
        self, user_name: str, role_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.remove_user_from_role(user_name, role_name, timeout=timeout, **kwargs)

    def create_role(self, role_name: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        conn.create_role(role_name, timeout=timeout, **kwargs)

    def drop_role(
        self, role_name: str, force_drop: bool = False, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.drop_role(role_name, force_drop=force_drop, timeout=timeout, **kwargs)

    def describe_role(self, role_name: str, timeout: Optional[float] = None, **kwargs) -> Dict:
        conn = self._get_connection()
        db_name = kwargs.pop("db_name", "")
        try:
            res = conn.select_grant_for_one_role(role_name, db_name, timeout=timeout, **kwargs)
        except Exception as ex:
            raise ex from ex
        ret = {}
        ret["role"] = role_name
        ret["privileges"] = [dict(i) for i in res.groups]
        return ret

    def list_roles(self, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        try:
            res = conn.select_all_role(False, timeout=timeout, **kwargs)
        except Exception as ex:
            raise ex from ex

        groups = res.groups
        return [g.role_name for g in groups]

    def grant_privilege(
        self,
        role_name: str,
        object_type: str,
        privilege: str,
        object_name: str,
        db_name: Optional[str] = "",
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.grant_privilege(
            role_name, object_type, object_name, privilege, db_name, timeout=timeout, **kwargs
        )

    def revoke_privilege(
        self,
        role_name: str,
        object_type: str,
        privilege: str,
        object_name: str,
        db_name: Optional[str] = "",
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.revoke_privilege(
            role_name, object_type, object_name, privilege, db_name, timeout=timeout, **kwargs
        )

    def grant_privilege_v2(
        self,
        role_name: str,
        privilege: str,
        collection_name: str,
        db_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Grant a privilege or a privilege group to a role.

        Args:
            role_name (``str``): The name of the role.
            privilege (``str``): The privilege or privilege group to grant.
            collection_name (``str``): The name of the collection.
            db_name (``str``, optional): The name of the database. It will use default database
                if not specified.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.grant_privilege_v2(
            role_name,
            privilege,
            collection_name,
            db_name=db_name,
            timeout=timeout,
            **kwargs,
        )

    def revoke_privilege_v2(
        self,
        role_name: str,
        privilege: str,
        collection_name: str,
        db_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Revoke a privilege or a privilege group from a role.

        Args:
            role_name (``str``): The name of the role.
            privilege (``str``): The privilege or privilege group to revoke.
            collection_name (``str``): The name of the collection.
            db_name (``str``, optional): The name of the database. It will use default database
                if not specified.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.revoke_privilege_v2(
            role_name,
            privilege,
            collection_name,
            db_name=db_name,
            timeout=timeout,
            **kwargs,
        )

    def create_alias(
        self, collection_name: str, alias: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.create_alias(collection_name, alias, timeout=timeout, **kwargs)

    def drop_alias(self, alias: str, timeout: Optional[float] = None, **kwargs):
        conn = self._get_connection()
        conn.drop_alias(alias, timeout=timeout, **kwargs)

    def alter_alias(
        self, collection_name: str, alias: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        conn.alter_alias(collection_name, alias, timeout=timeout, **kwargs)

    def describe_alias(self, alias: str, timeout: Optional[float] = None, **kwargs) -> Dict:
        conn = self._get_connection()
        return conn.describe_alias(alias, timeout=timeout, **kwargs)

    def list_aliases(
        self, collection_name: str = "", timeout: Optional[float] = None, **kwargs
    ) -> List[str]:
        conn = self._get_connection()
        return conn.list_aliases(collection_name, timeout=timeout, **kwargs)

    # deprecated same to use_database
    def using_database(self, db_name: str, **kwargs):
        self.use_database(db_name, **kwargs)

    def use_database(self, db_name: str, **kwargs):
        conn = self._get_connection()
        conn.reset_db_name(db_name)

    def create_database(
        self,
        db_name: str,
        properties: Optional[dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        conn.create_database(db_name=db_name, properties=properties, timeout=timeout, **kwargs)

    def drop_database(self, db_name: str, **kwargs):
        conn = self._get_connection()
        conn.drop_database(db_name, **kwargs)

    def list_databases(self, timeout: Optional[float] = None, **kwargs) -> List[str]:
        conn = self._get_connection()
        return conn.list_database(timeout=timeout, **kwargs)

    def describe_database(self, db_name: str, **kwargs) -> dict:
        conn = self._get_connection()
        return conn.describe_database(db_name, **kwargs)

    def alter_database_properties(self, db_name: str, properties: dict, **kwargs):
        conn = self._get_connection()
        conn.alter_database(db_name, properties, **kwargs)

    def drop_database_properties(self, db_name: str, property_keys: List[str], **kwargs):
        conn = self._get_connection()
        conn.drop_database_properties(db_name, property_keys, **kwargs)

    def flush(
        self,
        collection_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Seal all segments in the collection. Inserts after flushing will be written into
            new segments.

        Args:
            collection_name(``string``): The name of collection.
            timeout (float): an optional duration of time in seconds to allow for the RPCs.
                If timeout is not set, the client keeps waiting until the server
                responds or an error occurs.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.flush([collection_name], timeout=timeout, **kwargs)

    def compact(
        self,
        collection_name: str,
        is_clustering: Optional[bool] = False,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> int:
        """Compact merge the small segments in a collection

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

            is_clustering (``bool``, optional): Option to trigger clustering compaction.

        Raises:
            MilvusException: If anything goes wrong.

        Returns:
            int: An integer represents the server's compaction job. You can use this job ID
            for subsequent state inquiries.
        """
        conn = self._get_connection()
        return conn.compact(collection_name, is_clustering=is_clustering, timeout=timeout, **kwargs)

    def get_compaction_state(
        self,
        job_id: int,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> str:
        """Get the state of compaction job

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.

        Returns:
            str: the state of this compaction job. Possible values are "UndefiedState", "Executing"
            and "Completed".
        """
        conn = self._get_connection()
        result = conn.get_compaction_state(job_id, timeout=timeout, **kwargs)
        return result.state_name

    def get_server_version(
        self,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> str:
        """Get the running server's version

        Args:
            timeout (``float``, optional): A duration of time in seconds to allow for the RPC.
                If timeout is set to None, the client keeps waiting until the server
                responds or an error occurs.

        Returns:
            str: A string represent the server's version.

        Raises:
            MilvusException: If anything goes wrong
        """
        conn = self._get_connection()
        return conn.get_server_version(timeout=timeout, **kwargs)

    def create_privilege_group(
        self,
        group_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Create a new privilege group.

        Args:
            group_name (``str``): The name of the privilege group.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.create_privilege_group(group_name, timeout=timeout, **kwargs)

    def drop_privilege_group(
        self,
        group_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Drop a privilege group.

        Args:
            group_name (``str``): The name of the privilege group.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.drop_privilege_group(group_name, timeout=timeout, **kwargs)

    def list_privilege_groups(
        self,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> List[Dict[str, str]]:
        """List all privilege groups.

        Args:
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Returns:
            List[Dict[str, str]]: A list of privilege groups.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        try:
            res = conn.list_privilege_groups(timeout=timeout, **kwargs)
        except Exception as ex:
            logger.exception("Failed to list privilege groups.")
            raise ex from ex
        ret = []
        for g in res.groups:
            ret.append({"privilege_group": g.privilege_group, "privileges": g.privileges})
        return ret

    def add_privileges_to_group(
        self,
        group_name: str,
        privileges: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Add privileges to a privilege group.

        Args:
            group_name (``str``): The name of the privilege group.
            privileges (``List[str]``): A list of privileges to be added to the group.
                Privileges should be the same type in a group otherwise it will raise an exception.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.add_privileges_to_group(group_name, privileges, timeout=timeout, **kwargs)

    def remove_privileges_from_group(
        self,
        group_name: str,
        privileges: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Remove privileges from a privilege group.

        Args:
            group_name (``str``): The name of the privilege group.
            privileges (``List[str]``): A list of privileges to be removed from the group.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        conn.remove_privileges_from_group(group_name, privileges, timeout=timeout, **kwargs)

    def create_resource_group(self, name: str, timeout: Optional[float] = None, **kwargs):
        """Create a resource group
            It will success whether or not the resource group exists.

        Args:
            name: The name of the resource group.
        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        return conn.create_resource_group(name, timeout, **kwargs)

    def update_resource_groups(
        self,
        configs: Dict[str, ResourceGroupConfig],
        timeout: Optional[float] = None,
    ):
        """Update resource groups.
            This function updates the resource groups based on the provided configurations.

        Args:
            configs: A mapping of resource group names to their configurations.
            timeout: The timeout value in seconds. Defaults to None.
        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        return conn.update_resource_groups(configs, timeout)

    def drop_resource_group(
        self,
        name: str,
        timeout: Optional[float] = None,
    ):
        """Drop a resource group
            It will success if the resource group is existed and empty, otherwise fail.

        Args:
            name: The name of the resource group.
            timeout: The timeout value in seconds. Defaults to None.
        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        return conn.drop_resource_group(name, timeout)

    def describe_resource_group(self, name: str, timeout: Optional[float] = None):
        """Drop a resource group
            It will success if the resource group is existed and empty, otherwise fail.

        Args:
            name: The name of the resource group.
            timeout: The timeout value in seconds. Defaults to None.
        Returns:
            ResourceGroupInfo: The detail info of the resource group.
        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        return conn.describe_resource_group(name, timeout)

    def list_resource_groups(self, timeout: Optional[float] = None):
        """list all resource group names

        Args:
            timeout: The timeout value in seconds. Defaults to None.
        Returns:
            list[str]: all resource group names
        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        return conn.list_resource_groups(timeout)

    def transfer_replica(
        self,
        source_group: str,
        target_group: str,
        collection_name: str,
        num_replicas: int,
        timeout: Optional[float] = None,
    ):
        """transfer num_replica from source resource group to target resource group

        Args:
            source_group: source resource group name
            target_group: target resource group name
            collection_name: collection name which replica belong to
            num_replicas: transfer replica num
            timeout: The timeout value in seconds. Defaults to None.

        Raises:
            MilvusException: If anything goes wrong.
        """
        conn = self._get_connection()
        return conn.transfer_replica(
            source_group, target_group, collection_name, num_replicas, timeout
        )

    def describe_replica(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ) -> List[ReplicaInfo]:
        """Get the current loaded replica information

        Args:
            collection_name (``str``): The name of the given collection.
            timeout (``float``, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur.
        Returns:
            List[ReplicaInfo]: All the replica information.
        """
        conn = self._get_connection()
        return conn.describe_replica(collection_name, timeout=timeout, **kwargs)

    def run_analyzer(
        self,
        texts: Union[str, List[str]],
        analyzer_params: Optional[Union[str, Dict]] = None,
        with_hash: bool = False,
        with_detail: bool = False,
        collection_name: Optional[str] = None,
        field_name: Optional[str] = None,
        analyzer_names: Optional[Union[str, List[str]]] = None,
        timeout: Optional[float] = None,
    ):
        """Run analyzer. Return result tokens of analysis.
        Args:
            text(``str``,``List[str]``): The input text (string or string list).
            analyzer_params(``str``,``Dict``,``None``): The parameters of analyzer.
            timeout(``float``, optional): The timeout value in seconds. Defaults to None.
        Returns:
                (``List[str]``,``List[List[str]]``): The result tokens of analysis.
        """

        return self._get_connection().run_analyzer(
            texts,
            analyzer_params=analyzer_params,
            with_hash=with_hash,
            with_detail=with_detail,
            collection_name=collection_name,
            field_name=field_name,
            analyzer_names=analyzer_names,
            timeout=timeout,
        )
