import logging
from typing import Dict, List, Optional, Union

from pymilvus.client.abstract import AnnSearchRequest, BaseRanker
from pymilvus.client.constants import DEFAULT_CONSISTENCY_LEVEL
from pymilvus.client.types import (
    ExceptionsMessage,
    OmitZeroDict,
)
from pymilvus.exceptions import (
    DataTypeNotMatchException,
    MilvusException,
    ParamError,
    PrimaryKeyException,
)
from pymilvus.orm import utility
from pymilvus.orm.collection import CollectionSchema
from pymilvus.orm.connections import connections
from pymilvus.orm.types import DataType

from ._utils import create_connection
from .check import validate_param
from .index import IndexParam, IndexParams

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class AsyncMilvusClient:
    """AsyncMilvusClient is an EXPERIMENTAL class
    which only provides part of MilvusClient's methods"""

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
        self._using = create_connection(
            uri,
            token,
            db_name,
            use_async=True,
            user=user,
            password=password,
            timeout=timeout,
            **kwargs,
        )
        self.is_self_hosted = bool(utility.get_server_type(using=self._using) == "milvus")

    async def create_collection(
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
            return await self._fast_create_collection(
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

        return await self._create_collection_with_schema(
            collection_name, schema, index_params, timeout=timeout, **kwargs
        )

    async def _fast_create_collection(
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
        if dimension is None:
            msg = "missing requried argument: 'dimension'"
            raise TypeError(msg)
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
        vector_type = DataType.FLOAT_VECTOR
        schema.add_field(vector_field_name, vector_type, dim=dimension)
        schema.verify()

        conn = self._get_connection()
        if "consistency_level" not in kwargs:
            kwargs["consistency_level"] = DEFAULT_CONSISTENCY_LEVEL
        try:
            await conn.create_collection(collection_name, schema, timeout=timeout, **kwargs)
            logger.debug("Successfully created collection: %s", collection_name)
        except Exception as ex:
            logger.error("Failed to create collection: %s", collection_name)
            raise ex from ex

        index_params = IndexParams()
        index_params.add_index(vector_field_name, index_type="AUTOINDEX", metric_type=metric_type)
        await self.create_index(collection_name, index_params, timeout=timeout)
        await self.load_collection(collection_name, timeout=timeout)

    async def _create_collection_with_schema(
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
            await conn.create_collection(collection_name, schema, timeout=timeout, **kwargs)
            logger.debug("Successfully created collection: %s", collection_name)
        except Exception as ex:
            logger.error("Failed to create collection: %s", collection_name)
            raise ex from ex

        if index_params:
            await self.create_index(collection_name, index_params, timeout=timeout)
            await self.load_collection(collection_name, timeout=timeout)

    async def drop_collection(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        await conn.drop_collection(collection_name, timeout=timeout, **kwargs)
        logger.debug("Successfully dropped collection: %s", collection_name)

    async def load_collection(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        try:
            await conn.load_collection(collection_name, timeout=timeout, **kwargs)
        except MilvusException as ex:
            logger.error("Failed to load collection: %s", collection_name)
            raise ex from ex

    async def release_collection(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        try:
            await conn.release_collection(collection_name, timeout=timeout, **kwargs)
        except MilvusException as ex:
            logger.error("Failed to load collection: %s", collection_name)
            raise ex from ex

    async def create_index(
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
            await self._create_index(collection_name, index_param, timeout=timeout, **kwargs)

    async def _create_index(
        self,
        collection_name: str,
        index_param: IndexParam,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        conn = self._get_connection()
        try:
            await conn.create_index(
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

    async def drop_index(
        self, collection_name: str, index_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        await conn.drop_index(collection_name, "", index_name, timeout=timeout, **kwargs)

    async def create_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        await conn.create_partition(collection_name, partition_name, timeout=timeout, **kwargs)

    async def drop_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        conn = self._get_connection()
        await conn.drop_partition(collection_name, partition_name, timeout=timeout, **kwargs)

    async def load_partitions(
        self,
        collection_name: str,
        partition_names: Union[str, List[str]],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if isinstance(partition_names, str):
            partition_names = [partition_names]

        conn = self._get_connection()
        await conn.load_partitions(collection_name, partition_names, timeout=timeout, **kwargs)

    async def release_partitions(
        self,
        collection_name: str,
        partition_names: Union[str, List[str]],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if isinstance(partition_names, str):
            partition_names = [partition_names]
        conn = self._get_connection()
        await conn.release_partitions(collection_name, partition_names, timeout=timeout, **kwargs)

    async def insert(
        self,
        collection_name: str,
        data: Union[Dict, List[Dict]],
        timeout: Optional[float] = None,
        partition_name: Optional[str] = "",
        **kwargs,
    ) -> Dict:
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
            res = await conn.insert_rows(
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

    async def upsert(
        self,
        collection_name: str,
        data: Union[Dict, List[Dict]],
        timeout: Optional[float] = None,
        partition_name: Optional[str] = "",
        **kwargs,
    ) -> Dict:
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
            res = await conn.upsert_rows(
                collection_name, data, partition_name=partition_name, timeout=timeout, **kwargs
            )
        except Exception as ex:
            raise ex from ex

        return OmitZeroDict(
            {
                "upsert_count": res.upsert_count,
                "cost": res.cost,
            }
        )

    async def hybrid_search(
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
        conn = self._get_connection()
        try:
            res = await conn.hybrid_search(
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

    async def search(
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
        conn = self._get_connection()
        try:
            res = await conn.search(
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

    async def query(
        self,
        collection_name: str,
        filter: str = "",
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        ids: Optional[Union[List, str, int]] = None,
        partition_names: Optional[List[str]] = None,
        **kwargs,
    ) -> List[dict]:
        if filter and not isinstance(filter, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(filter))

        if filter and ids is not None:
            raise ParamError(message=ExceptionsMessage.AmbiguousQueryFilterParam)

        if isinstance(ids, (int, str)):
            ids = [ids]

        conn = self._get_connection()

        if ids:
            try:
                schema_dict = await conn.describe_collection(
                    collection_name, timeout=timeout, **kwargs
                )
            except Exception as ex:
                logger.error("Failed to describe collection: %s", collection_name)
                raise ex from ex
            filter = self._pack_pks_expr(schema_dict, ids)

        if not output_fields:
            output_fields = ["*"]

        try:
            res = await conn.query(
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

    async def get(
        self,
        collection_name: str,
        ids: Union[list, str, int],
        output_fields: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        partition_names: Optional[List[str]] = None,
        **kwargs,
    ) -> List[dict]:
        if not isinstance(ids, list):
            ids = [ids]

        if len(ids) == 0:
            return []

        conn = self._get_connection()
        try:
            schema_dict = await conn.describe_collection(collection_name, timeout=timeout, **kwargs)
        except Exception as ex:
            logger.error("Failed to describe collection: %s", collection_name)
            raise ex from ex

        if not output_fields:
            output_fields = ["*"]

        expr = self._pack_pks_expr(schema_dict, ids)
        try:
            res = await conn.query(
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

    async def delete(
        self,
        collection_name: str,
        ids: Optional[Union[list, str, int]] = None,
        timeout: Optional[float] = None,
        filter: Optional[str] = None,
        partition_name: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, int]:
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
                schema_dict = await conn.describe_collection(
                    collection_name, timeout=timeout, **kwargs
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
            res = await conn.delete(
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

    async def close(self):
        await connections.async_remove_connection(self._using)

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
            expr = f"""{pk_field_name} in [{','.join(ids)}]"""
        else:
            ids = [str(entry) for entry in pks]
            expr = f"{pk_field_name} in [{','.join(ids)}]"
        return expr
