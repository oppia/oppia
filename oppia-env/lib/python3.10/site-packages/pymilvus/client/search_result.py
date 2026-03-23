from typing import Any, Dict, List, Optional, Tuple, Union

import ujson

from pymilvus.client.types import DataType
from pymilvus.exceptions import MilvusException
from pymilvus.grpc_gen import common_pb2, schema_pb2
from pymilvus.grpc_gen.schema_pb2 import FieldData

from . import entity_helper


class HybridHits(list):
    ids: List[Union[str, int]]
    distances: List[float]
    lazy_field_data: List[schema_pb2.FieldData]
    has_materialized: bool
    dynamic_fields: List[str]
    start: int

    def __init__(
        self,
        start: int,
        end: int,
        all_pks: List[Union[str, int]],
        all_scores: List[float],
        fields_data: List[schema_pb2.FieldData],
        output_fields: List[str],
        pk_name: str,
    ):
        self.ids = all_pks[start:end]
        self.distances = all_scores[start:end]
        self.dynamic_fields = set(output_fields) - {
            field_data.field_name for field_data in fields_data
        }
        self.lazy_field_data = []
        self.has_materialized = False
        self.start = start
        top_k_res = [
            Hit({pk_name: all_pks[i], "distance": all_scores[i], "entity": {}}, pk_name=pk_name)
            for i in range(start, end)
        ]
        for field_data in fields_data:
            data = get_field_data(field_data)
            has_valid = len(field_data.valid_data) > 0
            if field_data.type in [
                DataType.BOOL,
                DataType.INT8,
                DataType.INT16,
                DataType.INT32,
                DataType.INT64,
                DataType.FLOAT,
                DataType.DOUBLE,
                DataType.VARCHAR,
            ]:
                if has_valid:
                    [
                        hit["entity"].__setitem__(
                            field_data.field_name,
                            data[i + start] if field_data.valid_data[i + start] else None,
                        )
                        for i, hit in enumerate(top_k_res)
                    ]
                else:
                    [
                        hit["entity"].__setitem__(field_data.field_name, data[i + start])
                        for i, hit in enumerate(top_k_res)
                    ]
            elif field_data.type == DataType.ARRAY:
                element_type = field_data.scalars.array_data.element_type
                for i, hit in enumerate(top_k_res):
                    array_data = field_data.scalars.array_data.data[i + start]
                    extracted_array_row_data = extract_array_row_data([array_data], element_type)
                    hit["entity"].__setitem__(field_data.field_name, extracted_array_row_data[0])
            elif field_data.type in [
                DataType.FLOAT_VECTOR,
                DataType.BINARY_VECTOR,
                DataType.BFLOAT16_VECTOR,
                DataType.FLOAT16_VECTOR,
                DataType.SPARSE_FLOAT_VECTOR,
                DataType.JSON,
            ]:
                self.lazy_field_data.append(field_data)
            else:
                msg = f"Unsupported field type: {field_data.type}"
                raise MilvusException(msg)
        super().__init__(top_k_res)

    def __str__(self) -> str:
        """Only print at most 10 query results"""
        reminder = f" ... and {len(self) - 10} entities remaining" if len(self) > 10 else ""
        return f"{self[:10]}{reminder}"

    def __getitem__(self, key: int):
        self.materialize()
        return super().__getitem__(key)

    def get_raw_item(self, idx: int):
        """Get the item at index without triggering materialization"""
        return list.__getitem__(self, idx)

    def __iter__(self):
        self.materialize()
        return super().__iter__()

    def materialize(self):
        if not self.has_materialized:
            for field_data in self.lazy_field_data:
                field_name = field_data.field_name

                if field_data.type in [
                    DataType.FLOAT_VECTOR,
                    DataType.BINARY_VECTOR,
                    DataType.BFLOAT16_VECTOR,
                    DataType.FLOAT16_VECTOR,
                ]:
                    data = get_field_data(field_data)
                    dim = field_data.vectors.dim
                    if field_data.type in [DataType.BINARY_VECTOR]:
                        dim = dim // 8
                    elif field_data.type in [DataType.BFLOAT16_VECTOR, DataType.FLOAT16_VECTOR]:
                        dim = dim * 2
                    idx = self.start * dim
                    for i in range(len(self)):
                        item = self.get_raw_item(i)
                        item["entity"][field_name] = data[idx : idx + dim]
                        idx += dim
                elif field_data.type == DataType.SPARSE_FLOAT_VECTOR:
                    idx = self.start
                    for i in range(len(self)):
                        item = self.get_raw_item(i)
                        item["entity"][field_name] = entity_helper.sparse_proto_to_rows(
                            field_data.vectors.sparse_float_vector, idx, idx + 1
                        )[0]
                        idx += 1
                elif field_data.type == DataType.JSON:
                    idx = self.start
                    for i in range(len(self)):
                        item = self.get_raw_item(i)
                        if field_data.valid_data and not field_data.valid_data[idx]:
                            item["entity"][field_name] = None
                        else:
                            json_data = field_data.scalars.json_data.data[idx]
                            json_dict_list = (
                                ujson.loads(json_data) if json_data is not None else None
                            )
                            if not field_data.is_dynamic:
                                item["entity"][field_data.field_name] = json_dict_list
                            elif not self.dynamic_fields:
                                item["entity"].update(json_dict_list)
                            else:
                                item["entity"].update(
                                    {
                                        k: v
                                        for k, v in json_dict_list.items()
                                        if k in self.dynamic_fields
                                    }
                                )
                        idx += 1
                else:
                    msg = f"Unsupported field type: {field_data.type}"
                    raise MilvusException(msg)

        self.has_materialized = True

    __repr__ = __str__


class SearchResult(list):
    """A list[list[dict]] Contains nq * limit results.

    The first level is the results for each nq, and the second level
    is the top-k(limit) results for each query.

    Examples:
        >>> nq_res = client.search()
        >>> for topk_res in nq_res:
        >>>     for one_res in topk_res:
        >>>         print(one_res)
        {"id": 1, "distance": 0.1, "entity": {"vector": [1.0, 2.0, 3.0], "name": "a"}}
        ...

        >>> res[0][0]
        {"id": 1, "distance": 0.1, "entity": {"vector": [1.0, 2.0, 3.0], "name": "a"}}

        >>> res.recalls
        [0.9, 0.9, 0.9]

        >>> res.extra
        {"cost": 1}

    Attributes:
        recalls(List[float], optional): The recalls of the search result, one for each query.
        extra(Dict, optional): The extra information of the search result.
    """

    def __init__(
        self,
        res: schema_pb2.SearchResultData,
        round_decimal: Optional[int] = None,
        status: Optional[common_pb2.Status] = None,
        session_ts: Optional[int] = 0,
    ):
        _data = self._parse_search_result_data(res, round_decimal)
        super().__init__(_data)

        # set recalls
        self.recalls = res.recalls if len(res.recalls) > 0 else None

        # set extra info
        self.extra = {}
        if status and status.extra_info and "report_value" in status.extra_info:
            self.extra = {"cost": int(status.extra_info["report_value"])}

        # iterator related
        self._session_ts = session_ts
        self._search_iterator_v2_results = res.search_iterator_v2_results

    def __str__(self) -> str:
        """Only print at most 10 results"""
        result_msg = f"data: {self[:10]}"

        # Optional messages
        recall_msg = f",recalls: {self.recalls[:10]}" if self.recalls else ""
        extra_msg = f",{self.extra}" if self.extra else ""
        reminder = f" ... and {len(self) - 10} results remaining" if len(self) > 10 else ""

        return f"{result_msg}{recall_msg}{reminder}{extra_msg}"

    __repr__ = __str__

    def materialize(self):
        for i in range(len(self)):
            self[i].materialize()

    def _parse_search_result_data(
        self,
        res: schema_pb2.SearchResultData,
        round_decimal: Optional[int],
    ) -> List[List[Dict[str, Any]]]:
        _pk_name = res.primary_field_name or "id"

        all_pks: List[Union[str, int]] = []
        all_scores: List[float] = []
        if res.ids.HasField("int_id"):
            all_pks = res.ids.int_id.data
        elif res.ids.HasField("str_id"):
            all_pks = res.ids.str_id.data

        if isinstance(round_decimal, int) and round_decimal > 0:
            all_scores = [round(x, round_decimal) for x in res.scores]
        else:
            all_scores = res.scores

        data = []
        nq_thres = 0

        for topk in res.topks:
            start, end = nq_thres, nq_thres + topk
            data.append(
                HybridHits(
                    start,
                    end,
                    all_pks,
                    all_scores,
                    res.fields_data,
                    res.output_fields,
                    _pk_name,
                )
            )
            nq_thres += topk
        return data

    def _get_fields_by_range(
        self, start: int, end: int, all_fields_data: List[schema_pb2.FieldData]
    ) -> Dict[str, Tuple[List[Any], schema_pb2.FieldData]]:
        field2data: Dict[str, Tuple[List[Any], schema_pb2.FieldData]] = {}

        for field in all_fields_data:
            name, scalars, dtype = field.field_name, field.scalars, field.type
            field_meta = schema_pb2.FieldData(
                type=dtype,
                field_name=name,
                field_id=field.field_id,
                is_dynamic=field.is_dynamic,
            )
            if dtype == DataType.BOOL:
                field2data[name] = (
                    apply_valid_data(
                        scalars.bool_data.data[start:end], field.valid_data, start, end
                    ),
                    field_meta,
                )
                continue

            if dtype in (DataType.INT8, DataType.INT16, DataType.INT32):
                field2data[name] = (
                    apply_valid_data(
                        scalars.int_data.data[start:end], field.valid_data, start, end
                    ),
                    field_meta,
                )
                continue

            if dtype == DataType.INT64:
                field2data[name] = (
                    apply_valid_data(
                        scalars.long_data.data[start:end], field.valid_data, start, end
                    ),
                    field_meta,
                )
                continue

            if dtype == DataType.FLOAT:
                field2data[name] = (
                    apply_valid_data(
                        scalars.float_data.data[start:end], field.valid_data, start, end
                    ),
                    field_meta,
                )
                continue

            if dtype == DataType.DOUBLE:
                field2data[name] = (
                    apply_valid_data(
                        scalars.double_data.data[start:end], field.valid_data, start, end
                    ),
                    field_meta,
                )
                continue

            if dtype == DataType.VARCHAR:
                field2data[name] = (
                    apply_valid_data(
                        scalars.string_data.data[start:end], field.valid_data, start, end
                    ),
                    field_meta,
                )
                continue

            if dtype == DataType.JSON:
                res = apply_valid_data(
                    scalars.json_data.data[start:end], field.valid_data, start, end
                )
                json_dict_list = [ujson.loads(item) if item is not None else item for item in res]
                field2data[name] = json_dict_list, field_meta
                continue

            if dtype == DataType.ARRAY:
                res = apply_valid_data(
                    scalars.array_data.data[start:end], field.valid_data, start, end
                )
                field2data[name] = (
                    extract_array_row_data(res, scalars.array_data.element_type),
                    field_meta,
                )
                continue

            # vectors
            dim, vectors = field.vectors.dim, field.vectors
            field_meta.vectors.dim = dim
            if dtype == DataType.FLOAT_VECTOR:
                if start == 0 and (end - start) * dim >= len(vectors.float_vector.data):
                    # If the range equals to the length of vectors.float_vector.data, direct return
                    # it to avoid a copy. This logic improves performance by 25% for the case
                    # retrival 1536 dim embeddings with topk=16384.
                    field2data[name] = vectors.float_vector.data, field_meta
                else:
                    field2data[name] = (
                        vectors.float_vector.data[start * dim : end * dim],
                        field_meta,
                    )
                continue

            if dtype == DataType.BINARY_VECTOR:
                field2data[name] = (
                    vectors.binary_vector[start * (dim // 8) : end * (dim // 8)],
                    field_meta,
                )
                continue
            # TODO(SPARSE): do we want to allow the user to specify the return format?
            if dtype == DataType.SPARSE_FLOAT_VECTOR:
                field2data[name] = (
                    entity_helper.sparse_proto_to_rows(vectors.sparse_float_vector, start, end),
                    field_meta,
                )
                continue

            if dtype == DataType.BFLOAT16_VECTOR:
                field2data[name] = (
                    vectors.bfloat16_vector[start * (dim * 2) : end * (dim * 2)],
                    field_meta,
                )
                continue

            if dtype == DataType.FLOAT16_VECTOR:
                field2data[name] = (
                    vectors.float16_vector[start * (dim * 2) : end * (dim * 2)],
                    field_meta,
                )
                continue

        return field2data

    def get_session_ts(self):
        """Iterator related inner method"""
        # TODO(Goose): change it into properties
        return self._session_ts

    def get_search_iterator_v2_results_info(self):
        """Iterator related inner method"""
        # TODO(Goose): Change it into properties
        return self._search_iterator_v2_results


def get_field_data(field_data: FieldData):
    if field_data.type == DataType.BOOL:
        return field_data.scalars.bool_data.data
    if field_data.type in {DataType.INT8, DataType.INT16, DataType.INT32}:
        return field_data.scalars.int_data.data
    if field_data.type == DataType.INT64:
        return field_data.scalars.long_data.data
    if field_data.type == DataType.FLOAT:
        return field_data.scalars.float_data.data
    if field_data.type == DataType.DOUBLE:
        return field_data.scalars.double_data.data
    if field_data.type == DataType.VARCHAR:
        return field_data.scalars.string_data.data
    if field_data.type == DataType.JSON:
        return field_data.scalars.json_data.data
    if field_data.type == DataType.ARRAY:
        return field_data.scalars.array_data.data
    if field_data.type == DataType.FLOAT_VECTOR:
        return field_data.vectors.float_vector.data
    if field_data.type == DataType.BINARY_VECTOR:
        return field_data.vectors.binary_vector
    if field_data.type == DataType.BFLOAT16_VECTOR:
        return field_data.vectors.bfloat16_vector
    if field_data.type == DataType.FLOAT16_VECTOR:
        return field_data.vectors.float16_vector
    if field_data.type == DataType.SPARSE_FLOAT_VECTOR:
        return field_data.vectors.sparse_float_vector
    msg = f"Unsupported field type: {field_data.type}"
    raise MilvusException(msg)


class Hits(list):
    """List[Dict] Topk search result with pks, distances, and output fields.

        [
            {"id": 1, "distance": 0.3, "entity": {"vector": [1, 2, 3]}},
            {"id": 2, "distance": 0.2, "entity": {"vector": [4, 5, 6]}},
            {"id": 3, "distance": 0.1, "entity": {"vector": [7, 8, 9]}},
        ]

    Examples:
        >>> res = client.search()
        >>> hits = res[0]
        >>> for hit in hits:
        >>>     print(hit)
        {"id": 1, "distance": 0.3, "entity": {"vector": [1, 2, 3]}}
        {"id": 2, "distance": 0.2, "entity": {"vector": [4, 5, 6]}}
        {"id": 3, "distance": 0.1, "entity": {"vector": [7, 8, 9]}}

    Attributes:
        ids(List[Union[str, int]]): topk primary keys
        distances(List[float]): topk distances
    """

    ids: List[Union[str, int]]
    distances: List[float]

    def __init__(
        self,
        topk: int,
        pks: List[Union[int, str]],
        distances: List[float],
        fields: Dict[str, Tuple[List[Any], schema_pb2.FieldData]],
        output_fields: List[str],
        pk_name: str,
    ):
        """
        Args:
            fields(Dict[str, Tuple[List[Any], schema_pb2.FieldData]]):
                field name to a tuple of topk data and field meta
        """
        self.ids = pks
        self.distances = distances

        all_fields = list(fields.keys())
        dynamic_fields = list(set(output_fields) - set(all_fields))

        top_k_res = []
        for i in range(topk):
            entity = {}
            for fname, (data, field_meta) in fields.items():
                if len(data) <= i:
                    entity[fname] = None
                # Get dense vectors
                if field_meta.type in (
                    DataType.FLOAT_VECTOR,
                    DataType.BINARY_VECTOR,
                    DataType.BFLOAT16_VECTOR,
                    DataType.FLOAT16_VECTOR,
                ):
                    dim = field_meta.vectors.dim
                    if field_meta.type in [DataType.BINARY_VECTOR]:
                        dim = dim // 8
                    elif field_meta.type in [DataType.BFLOAT16_VECTOR, DataType.FLOAT16_VECTOR]:
                        dim = dim * 2
                    entity[fname] = data[i * dim : (i + 1) * dim]
                    continue

                # Get dynamic fields
                if field_meta.type == DataType.JSON and field_meta.is_dynamic:
                    if len(dynamic_fields) > 0:
                        entity.update({k: v for k, v in data[i].items() if k in dynamic_fields})
                        continue

                    if fname in output_fields:
                        entity.update(data[i])
                        continue

                # sparse float vector and other fields
                entity[fname] = data[i]
            top_k_res.append(
                Hit({pk_name: pks[i], "distance": distances[i], "entity": entity}, pk_name=pk_name)
            )

        super().__init__(top_k_res)

    def __str__(self) -> str:
        """Only print at most 10 query results"""
        reminder = f" ... and {len(self) - 10} entities remaining" if len(self) > 10 else ""
        return f"{self[:10]}{reminder}"

    __repr__ = __str__


from collections import UserDict


class Hit(UserDict):
    """Enhanced result in dict that can get data in dict[dict]

    Examples:
        >>> res = {
        >>>     "my_id": 1,
        >>>     "distance": 0.3,
        >>>     "entity": {
        >>>         "emb": [1, 2, 3],
        >>>         "desc": "a description"
        >>>     }
        >>> }
        >>> h = Hit(res, pk_name="my_id")
        >>> h
        {"my_id": 1, "distance": 0.3, "entity": {"emb": [1, 2, 3], "desc": "a description"}}
        >>> h["my_id"]
        1
        >>> h["distance"]
        0.3
        >>> h["entity"]["emb"]
        [1, 2, 3]
        >>> h["entity"]["desc"]
        "a description"
        >>> h.get("emb")
        [1, 2, 3]
    """

    def __init__(self, *args, pk_name: str = "", **kwargs):
        super().__init__(*args, **kwargs)

        self._pk_name = pk_name

    def __getattr__(self, item: str):
        """Patch for orm, will be deprecated soon"""

        # hit.entity return self
        if item == "entity":
            return self

        try:
            return self.__getitem__(item)
        except KeyError as exc:
            raise AttributeError from exc

    def to_dict(self) -> Dict[str, Any]:
        """Patch for orm, will be deprecated soon"""
        return self

    @property
    def id(self) -> Union[str, int]:
        """Patch for orm, will be deprecated soon"""
        return self.data.get(self._pk_name)

    @property
    def distance(self) -> float:
        """Patch for orm, will be deprecated soon"""
        return self.data.get("distance")

    @property
    def pk(self) -> Union[str, int]:
        """Alias of id, will be deprecated soon"""
        return self.id

    @property
    def score(self) -> float:
        """Alias of distance, will be deprecated soon"""
        return self.distance

    @property
    def fields(self) -> Dict[str, Any]:
        """Patch for orm, will be deprecated soon"""
        return self.get("entity")

    def __getitem__(self, key: str):
        try:
            return self.data[key]
        except KeyError:
            pass
        return self.data["entity"][key]

    def get(self, key: Any, default: Any = None):
        try:
            return self.__getitem__(key)
        except KeyError:
            pass
        return default


def extract_array_row_data(
    scalars: List[schema_pb2.ScalarField], element_type: DataType
) -> List[List[Any]]:
    row = []
    for ith_array in scalars:
        if ith_array is None:
            row.append(None)
            continue

        if element_type == DataType.INT64:
            row.append(ith_array.long_data.data)
            continue

        if element_type == DataType.BOOL:
            row.append(ith_array.bool_data.data)
            continue

        if element_type in (DataType.INT8, DataType.INT16, DataType.INT32):
            row.append(ith_array.int_data.data)
            continue

        if element_type == DataType.FLOAT:
            row.append(ith_array.float_data.data)
            continue

        if element_type == DataType.DOUBLE:
            row.append(ith_array.double_data.data)
            continue

        if element_type in (DataType.STRING, DataType.VARCHAR):
            row.append(ith_array.string_data.data)
            continue
    return row


def apply_valid_data(
    data: List[Any], valid_data: Union[None, List[bool]], start: int, end: int
) -> List[Any]:
    if valid_data:
        for i, valid in enumerate(valid_data[start:end]):
            if not valid:
                data[i] = None
    return data
