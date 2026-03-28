import abc
from typing import Any, Dict, List, Optional, Union

import ujson

from pymilvus.exceptions import DataTypeNotMatchException, ExceptionsMessage
from pymilvus.settings import Config

from . import utils
from .constants import DEFAULT_CONSISTENCY_LEVEL, RANKER_TYPE_RRF, RANKER_TYPE_WEIGHTED

# ruff: noqa: F401
# TODO: This is a patch for older version
from .search_result import Hit, Hits, SearchResult
from .types import DataType, FunctionType


class FieldSchema:
    def __init__(self, raw: Any):
        self._raw = raw

        self.field_id = 0
        self.name = None
        self.is_primary = False
        self.description = None
        self.auto_id = False
        self.type = DataType.UNKNOWN
        self.indexes = []
        self.params = {}
        self.is_partition_key = False
        self.is_dynamic = False
        self.nullable = False
        self.default_value = None
        self.is_function_output = False
        # For array field
        self.element_type = None
        self.is_clustering_key = False
        self.__pack(self._raw)

    def __pack(self, raw: Any):
        self.field_id = raw.fieldID
        self.name = raw.name
        self.is_primary = raw.is_primary_key
        self.description = raw.description
        self.auto_id = raw.autoID
        self.type = DataType(raw.data_type)
        self.is_partition_key = raw.is_partition_key
        self.element_type = DataType(raw.element_type)
        self.is_clustering_key = raw.is_clustering_key
        self.default_value = raw.default_value
        if raw.default_value is not None and raw.default_value.WhichOneof("data") is None:
            self.default_value = None
        self.is_dynamic = raw.is_dynamic
        self.nullable = raw.nullable
        self.is_function_output = raw.is_function_output

        for type_param in raw.type_params:
            if type_param.key == "params":
                self.params[type_param.key] = ujson.loads(type_param.value)
            else:
                if type_param.key in ["mmap.enabled"]:
                    self.params["mmap_enabled"] = (
                        bool(type_param.value) if type_param.value.lower() != "false" else False
                    )
                    continue
                self.params[type_param.key] = type_param.value
                if type_param.key in ["dim"]:
                    self.params[type_param.key] = int(type_param.value)
                if type_param.key in [Config.MaxVarCharLengthKey] and raw.data_type in (
                    DataType.VARCHAR,
                    DataType.ARRAY,
                ):
                    self.params[type_param.key] = int(type_param.value)

                # TO-DO: use constants defined in orm
                if type_param.key in ["max_capacity"] and raw.data_type == DataType.ARRAY:
                    self.params[type_param.key] = int(type_param.value)

        index_dict = {}
        for index_param in raw.index_params:
            if index_param.key == "params":
                index_dict[index_param.key] = ujson.loads(index_param.value)
            else:
                index_dict[index_param.key] = index_param.value

        self.indexes.extend([index_dict])

    def dict(self):
        _dict = {
            "field_id": self.field_id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "params": self.params or {},
        }
        if self.default_value is not None:
            # default_value is nil match this situation
            if self.default_value.WhichOneof("data") is None:
                self.default_value = None
            else:
                _dict["default_value"] = self.default_value

        if self.element_type:
            _dict["element_type"] = self.element_type

        if self.is_partition_key:
            _dict["is_partition_key"] = True
        if self.is_dynamic:
            _dict["is_dynamic"] = True
        if self.auto_id:
            _dict["auto_id"] = True
        if self.nullable:
            _dict["nullable"] = True
        if self.is_primary:
            _dict["is_primary"] = self.is_primary
        if self.is_clustering_key:
            _dict["is_clustering_key"] = True
        if self.is_function_output:
            _dict["is_function_output"] = True
        return _dict


class FunctionSchema:
    def __init__(self, raw: Any):
        self._raw = raw

        self.name = None
        self.description = None
        self.type = None
        self.params = {}
        self.input_field_names = []
        self.input_field_ids = []
        self.output_field_names = []
        self.output_field_ids = []
        self.id = 0

        self.__pack(self._raw)

    def __pack(self, raw: Any):
        self.name = raw.name
        self.description = raw.description
        self.id = raw.id
        self.type = FunctionType(raw.type)
        self.params = {}
        for param in raw.params:
            self.params[param.key] = param.value
        self.input_field_names = raw.input_field_names
        self.input_field_ids = raw.input_field_ids
        self.output_field_names = raw.output_field_names
        self.output_field_ids = raw.output_field_ids

    def dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "description": self.description,
            "type": self.type,
            "params": self.params,
            "input_field_names": self.input_field_names,
            "input_field_ids": self.input_field_ids,
            "output_field_names": self.output_field_names,
            "output_field_ids": self.output_field_ids,
        }


class CollectionSchema:
    def __init__(self, raw: Any):
        self._raw = raw

        self.collection_name = None
        self.description = None
        self.params = {}
        self.fields = []
        self.functions = []
        self.statistics = {}
        self.auto_id = False  # auto_id is not in collection level any more later
        self.aliases = []
        self.collection_id = 0
        self.consistency_level = DEFAULT_CONSISTENCY_LEVEL  # by default
        self.properties = {}
        self.num_shards = 0
        self.num_partitions = 0
        self.enable_dynamic_field = False
        self.created_timestamp = 0
        self.update_timestamp = 0
        if self._raw:
            self.__pack(self._raw)

    def __pack(self, raw: Any):
        self.collection_name = raw.schema.name
        self.description = raw.schema.description
        self.aliases = list(raw.aliases)
        self.collection_id = raw.collectionID
        self.num_shards = raw.shards_num
        self.num_partitions = raw.num_partitions
        self.created_timestamp = raw.created_timestamp
        self.update_timestamp = raw.update_timestamp
        # keep compatible with older Milvus
        try:
            self.consistency_level = raw.consistency_level
        except Exception:
            self.consistency_level = DEFAULT_CONSISTENCY_LEVEL

        try:
            self.enable_dynamic_field = raw.schema.enable_dynamic_field
        except Exception:
            self.enable_dynamic_field = False

        # TODO: extra_params here
        # for kv in raw.extra_params:

        self.fields = [FieldSchema(f) for f in raw.schema.fields]
        self.functions = [FunctionSchema(f) for f in raw.schema.functions]
        function_output_field_names = [f for fn in self.functions for f in fn.output_field_names]
        for field in self.fields:
            if field.name in function_output_field_names:
                field.is_function_output = True
        # for s in raw.statistics:

        for p in raw.properties:
            self.properties[p.key] = p.value

    @classmethod
    def _rewrite_schema_dict(cls, schema_dict: Dict):
        fields = schema_dict.get("fields", [])
        if not fields:
            return

        for field_dict in fields:
            if field_dict.get("auto_id", None) is not None:
                schema_dict["auto_id"] = field_dict["auto_id"]
                return

    def dict(self):
        if not self._raw:
            return {}
        _dict = {
            "collection_name": self.collection_name,
            "auto_id": self.auto_id,
            "num_shards": self.num_shards,
            "description": self.description,
            "fields": [f.dict() for f in self.fields],
            "functions": [f.dict() for f in self.functions],
            "aliases": self.aliases,
            "collection_id": self.collection_id,
            "consistency_level": self.consistency_level,
            "properties": self.properties,
            "num_partitions": self.num_partitions,
            "enable_dynamic_field": self.enable_dynamic_field,
        }

        if self.created_timestamp != 0:
            _dict["created_timestamp"] = self.created_timestamp
        if self.update_timestamp != 0:
            _dict["update_timestamp"] = self.update_timestamp
        self._rewrite_schema_dict(_dict)
        return _dict

    def __str__(self):
        return self.dict().__str__()


class MutationResult:
    def __init__(self, raw: Any):
        self._raw = raw
        self._primary_keys = []
        self._insert_cnt = 0
        self._delete_cnt = 0
        self._upsert_cnt = 0
        self._timestamp = 0
        self._succ_index = []
        self._err_index = []
        self._cost = 0

        self._pack(raw)

    @property
    def primary_keys(self):
        return self._primary_keys

    @property
    def insert_count(self):
        return self._insert_cnt

    @property
    def delete_count(self):
        return self._delete_cnt

    @property
    def upsert_count(self):
        return self._upsert_cnt

    @property
    def timestamp(self):
        return self._timestamp

    @property
    def succ_count(self):
        return len(self._succ_index)

    @property
    def err_count(self):
        return len(self._err_index)

    @property
    def succ_index(self):
        return self._succ_index

    @property
    def err_index(self):
        return self._err_index

    # The unit of this cost is vcu, similar to token
    @property
    def cost(self):
        return self._cost

    def __str__(self):
        if self.cost:
            return (
                f"(insert count: {self._insert_cnt}, delete count: {self._delete_cnt}, upsert count: {self._upsert_cnt}, "
                f"timestamp: {self._timestamp}, success count: {self.succ_count}, err count: {self.err_count}, "
                f"cost: {self._cost})"
            )
        return (
            f"(insert count: {self._insert_cnt}, delete count: {self._delete_cnt}, upsert count: {self._upsert_cnt}, "
            f"timestamp: {self._timestamp}, success count: {self.succ_count}, err count: {self.err_count}"
        )

    __repr__ = __str__

    # TODO
    # def error_code(self):
    #     pass
    #
    # def error_reason(self):
    #     pass

    def _pack(self, raw: Any):
        which = raw.IDs.WhichOneof("id_field")
        if which == "int_id":
            self._primary_keys = raw.IDs.int_id.data
        elif which == "str_id":
            self._primary_keys = raw.IDs.str_id.data

        self._insert_cnt = raw.insert_cnt
        self._delete_cnt = raw.delete_cnt
        self._upsert_cnt = raw.upsert_cnt
        self._timestamp = raw.timestamp
        self._succ_index = raw.succ_index
        self._err_index = raw.err_index
        self._cost = int(
            raw.status.extra_info["report_value"] if raw.status and raw.status.extra_info else "0"
        )


class BaseRanker:
    def __int__(self):
        return

    def dict(self):
        return {}

    def __str__(self):
        return self.dict().__str__()


class RRFRanker(BaseRanker):
    def __init__(
        self,
        k: int = 60,
    ):
        self._strategy = RANKER_TYPE_RRF
        self._k = k

    def dict(self):
        params = {
            "k": self._k,
        }
        return {
            "strategy": self._strategy,
            "params": params,
        }


class WeightedRanker(BaseRanker):
    def __init__(self, *nums, norm_score: bool = True):
        self._strategy = RANKER_TYPE_WEIGHTED
        weights = []
        for num in nums:
            # isinstance(True, int) is True, thus we need to check bool first
            if isinstance(num, bool) or not isinstance(num, (int, float)):
                error_msg = f"Weight must be a number, got {type(num)}"
                raise TypeError(error_msg)
            weights.append(num)
        self._weights = weights
        self._norm_score = norm_score

    def dict(self):
        params = {
            "weights": self._weights,
            "norm_score": self._norm_score,
        }
        return {
            "strategy": self._strategy,
            "params": params,
        }


class AnnSearchRequest:
    def __init__(
        self,
        data: Union[List, utils.SparseMatrixInputType],
        anns_field: str,
        param: Dict,
        limit: int,
        expr: Optional[str] = None,
        expr_params: Optional[dict] = None,
    ):
        self._data = data
        self._anns_field = anns_field
        self._param = param
        self._limit = limit

        if expr is not None and not isinstance(expr, str):
            raise DataTypeNotMatchException(message=ExceptionsMessage.ExprType % type(expr))
        self._expr = expr
        self._expr_params = expr_params

    @property
    def data(self):
        return self._data

    @property
    def anns_field(self):
        return self._anns_field

    @property
    def param(self):
        return self._param

    @property
    def limit(self):
        return self._limit

    @property
    def expr(self):
        return self._expr

    @property
    def expr_params(self):
        return self._expr_params

    def __str__(self):
        return {
            "anns_field": self.anns_field,
            "param": self.param,
            "limit": self.limit,
            "expr": self.expr,
        }.__str__()


class LoopBase:
    def __init__(self):
        self.__index = 0

    def __iter__(self):
        return self

    def __getitem__(self, item: Any):
        if isinstance(item, slice):
            _start = item.start or 0
            _end = min(item.stop, self.__len__()) if item.stop else self.__len__()
            _step = item.step or 1

            return [self.get__item(i) for i in range(_start, _end, _step)]

        if item >= self.__len__():
            msg = "Index out of range"
            raise IndexError(msg)

        return self.get__item(item)

    def __next__(self):
        while self.__index < self.__len__():
            self.__index += 1
            return self.__getitem__(self.__index - 1)

        # iterate stop, raise Exception
        self.__index = 0
        raise StopIteration

    def __str__(self):
        return str(list(map(str, self.__getitem__(slice(0, 10)))))

    @abc.abstractmethod
    def get__item(self, item: Any):
        raise NotImplementedError
