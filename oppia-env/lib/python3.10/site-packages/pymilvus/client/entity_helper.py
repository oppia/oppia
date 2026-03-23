import math
import struct
from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import ujson

from pymilvus.exceptions import (
    DataNotMatchException,
    ExceptionsMessage,
    MilvusException,
    ParamError,
)
from pymilvus.grpc_gen import schema_pb2 as schema_types
from pymilvus.settings import Config

from .types import DataType
from .utils import (
    SciPyHelper,
    SparseMatrixInputType,
    SparseRowOutputType,
    sparse_parse_single_row,
)

CHECK_STR_ARRAY = True


def entity_is_sparse_matrix(entity: Any):
    if SciPyHelper.is_scipy_sparse(entity):
        return True
    try:

        def is_type_in_str(v: Any, t: Any):
            if not isinstance(v, str):
                return False
            try:
                t(v)
            except ValueError:
                return False
            return True

        def is_int_type(v: Any):
            return isinstance(v, (int, np.integer)) or is_type_in_str(v, int)

        def is_float_type(v: Any):
            return isinstance(v, (float, np.floating)) or is_type_in_str(v, float)

        # must be of multiple rows
        if len(entity) == 0:
            return False
        for item in entity:
            if SciPyHelper.is_scipy_sparse(item):
                return item.shape[0] == 1
            if not isinstance(item, dict) and not isinstance(item, list):
                return False
            pairs = item.items() if isinstance(item, dict) else item
            # each row must be a list of Tuple[int, float]. we allow empty sparse row
            for pair in pairs:
                if len(pair) != 2 or not is_int_type(pair[0]) or not is_float_type(pair[1]):
                    return False
    except Exception:
        return False
    return True


# converts supported sparse matrix to schemapb.SparseFloatArray proto
def sparse_rows_to_proto(data: SparseMatrixInputType) -> schema_types.SparseFloatArray:
    # converts a sparse float vector to plain bytes. the format is the same as how
    # milvus interprets/persists the data.
    def sparse_float_row_to_bytes(indices: Iterable[int], values: Iterable[float]):
        if len(indices) != len(values):
            raise ParamError(
                message=f"length of indices and values must be the same, got {len(indices)} and {len(values)}"
            )
        data = b""
        for i, v in sorted(zip(indices, values), key=lambda x: x[0]):
            if not (0 <= i < 2**32 - 1):
                raise ParamError(
                    message=f"sparse vector index must be positive and less than 2^32-1: {i}"
                )
            if math.isnan(v):
                raise ParamError(message="sparse vector value must not be NaN")
            data += struct.pack("I", i)
            data += struct.pack("f", v)
        return data

    if not entity_is_sparse_matrix(data):
        raise ParamError(message="input must be a sparse matrix in supported format")

    result = schema_types.SparseFloatArray()

    if SciPyHelper.is_scipy_sparse(data):
        csr = data.tocsr()
        result.dim = csr.shape[1]
        for start, end in zip(csr.indptr[:-1], csr.indptr[1:]):
            result.contents.append(
                sparse_float_row_to_bytes(csr.indices[start:end], csr.data[start:end])
            )
    else:
        dim = 0
        for _, row_data in enumerate(data):
            if SciPyHelper.is_scipy_sparse(row_data):
                if row_data.shape[0] != 1:
                    raise ParamError(message="invalid input for sparse float vector: expect 1 row")
                dim = max(dim, row_data.shape[1])
                result.contents.append(sparse_float_row_to_bytes(row_data.indices, row_data.data))
            else:
                indices = []
                values = []
                row = row_data.items() if isinstance(row_data, dict) else row_data
                for index, value in row:
                    indices.append(int(index))
                    values.append(float(value))
                result.contents.append(sparse_float_row_to_bytes(indices, values))
                row_dim = 0
                if len(indices) > 0:
                    row_dim = indices[-1] + 1
                dim = max(dim, row_dim)
        result.dim = dim
    return result


# converts schema_types.SparseFloatArray proto to Iterable[SparseRowOutputType]
def sparse_proto_to_rows(
    sfv: schema_types.SparseFloatArray, start: Optional[int] = None, end: Optional[int] = None
) -> Iterable[SparseRowOutputType]:
    if not isinstance(sfv, schema_types.SparseFloatArray):
        raise ParamError(message="Vector must be a sparse float vector")
    start = start or 0
    end = end or len(sfv.contents)
    return [sparse_parse_single_row(row_bytes) for row_bytes in sfv.contents[start:end]]


def get_input_num_rows(entity: Any) -> int:
    if SciPyHelper.is_scipy_sparse(entity):
        return entity.shape[0]
    return len(entity)


def entity_type_to_dtype(entity_type: Any):
    if isinstance(entity_type, int):
        return entity_type
    if isinstance(entity_type, str):
        # case sensitive
        return schema_types.DataType.Value(entity_type)
    raise ParamError(message=f"invalid entity type: {entity_type}")


def get_max_len_of_var_char(field_info: Dict) -> int:
    k = Config.MaxVarCharLengthKey
    v = Config.MaxVarCharLength
    return field_info.get("params", {}).get(k, v)


def convert_to_str_array(orig_str_arr: Any, field_info: Dict, check: bool = True):
    arr = []
    if Config.EncodeProtocol.lower() != "utf-8".lower():
        for s in orig_str_arr:
            arr.append(s.encode(Config.EncodeProtocol))
    else:
        arr = orig_str_arr
    max_len = int(get_max_len_of_var_char(field_info))
    if check:
        for s in arr:
            if not isinstance(s, str):
                raise ParamError(
                    message=f"field ({field_info['name']}) expects string input, got: {type(s)}"
                )
            if len(s) > max_len:
                raise ParamError(
                    message=f"invalid input of field ({field_info['name']}), "
                    f"length of string exceeds max length. length: {len(s)}, max length: {max_len}"
                )
    return arr


def entity_to_str_arr(entity_values: Any, field_info: Any, check: bool = True):
    return convert_to_str_array(entity_values, field_info, check=check)


def convert_to_json(obj: object):
    def preprocess_numpy_types(obj: Any):
        if isinstance(obj, dict):
            return {k: preprocess_numpy_types(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [preprocess_numpy_types(item) for item in obj]
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        return obj

    if isinstance(obj, dict):
        for k in obj:
            if not isinstance(k, str):
                raise DataNotMatchException(message=ExceptionsMessage.JSONKeyMustBeStr)

    processed_obj = preprocess_numpy_types(obj)

    return ujson.dumps(processed_obj, ensure_ascii=False).encode(Config.EncodeProtocol)


def convert_to_json_arr(objs: List[object], field_info: Any):
    arr = []
    for obj in objs:
        if obj is None:
            raise ParamError(message=f"field ({field_info['name']}) expects a non-None input")
        arr.append(convert_to_json(obj))
    return arr


def entity_to_json_arr(entity_values: Dict, field_info: Any):
    return convert_to_json_arr(entity_values, field_info)


def convert_to_array_arr(objs: List[Any], field_info: Any):
    return [convert_to_array(obj, field_info) for obj in objs]


def convert_to_array(obj: List[Any], field_info: Any):
    field_data = schema_types.ScalarField()
    element_type = field_info.get("element_type", None)
    if element_type == DataType.BOOL:
        field_data.bool_data.data.extend(obj)
        return field_data
    if element_type in (DataType.INT8, DataType.INT16, DataType.INT32):
        field_data.int_data.data.extend(obj)
        return field_data
    if element_type == DataType.INT64:
        field_data.long_data.data.extend(obj)
        return field_data
    if element_type == DataType.FLOAT:
        field_data.float_data.data.extend(obj)
        return field_data
    if element_type == DataType.DOUBLE:
        field_data.double_data.data.extend(obj)
        return field_data
    if element_type in (DataType.VARCHAR, DataType.STRING):
        field_data.string_data.data.extend(obj)
        return field_data
    raise ParamError(
        message=f"Unsupported element type: {element_type} for Array field: {field_info.get('name')}"
    )


def entity_to_array_arr(entity_values: List[Any], field_info: Any):
    return convert_to_array_arr(entity_values, field_info)


def pack_field_value_to_field_data(
    field_value: Any, field_data: schema_types.FieldData, field_info: Any
):
    field_type = field_data.type
    field_name = field_info["name"]
    if field_type == DataType.BOOL:
        try:
            if field_value is None:
                field_data.scalars.bool_data.data.extend([])
            else:
                field_data.scalars.bool_data.data.append(field_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "bool", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type in (DataType.INT8, DataType.INT16, DataType.INT32):
        try:
            # need to extend it, or cannot correctly identify field_data.scalars.int_data.data
            if field_value is None:
                field_data.scalars.int_data.data.extend([])
            else:
                field_data.scalars.int_data.data.append(field_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "int", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.INT64:
        try:
            if field_value is None:
                field_data.scalars.long_data.data.extend([])
            else:
                field_data.scalars.long_data.data.append(field_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "int64", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.FLOAT:
        try:
            if field_value is None:
                field_data.scalars.float_data.data.extend([])
            else:
                field_data.scalars.float_data.data.append(field_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "float", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.DOUBLE:
        try:
            if field_value is None:
                field_data.scalars.double_data.data.extend([])
            else:
                field_data.scalars.double_data.data.append(field_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "double", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.FLOAT_VECTOR:
        try:
            f_value = field_value
            if isinstance(field_value, np.ndarray):
                if field_value.dtype not in ("float32", "float64"):
                    raise ParamError(
                        message="invalid input for float32 vector. Expected an np.ndarray with dtype=float32"
                    )
                f_value = field_value.tolist()

            field_data.vectors.dim = len(f_value)
            field_data.vectors.float_vector.data.extend(f_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "float_vector", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.BINARY_VECTOR:
        try:
            field_data.vectors.dim = len(field_value) * 8
            field_data.vectors.binary_vector += bytes(field_value)
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "binary_vector", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.FLOAT16_VECTOR:
        try:
            if isinstance(field_value, bytes):
                v_bytes = field_value
            elif isinstance(field_value, np.ndarray):
                if field_value.dtype != "float16":
                    raise ParamError(
                        message="invalid input for float16 vector. Expected an np.ndarray with dtype=float16"
                    )
                v_bytes = field_value.view(np.uint8).tobytes()
            else:
                raise ParamError(
                    message="invalid input type for float16 vector. Expected an np.ndarray with dtype=float16"
                )

            field_data.vectors.dim = len(v_bytes) // 2
            field_data.vectors.float16_vector += v_bytes
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "float16_vector", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.BFLOAT16_VECTOR:
        try:
            if isinstance(field_value, bytes):
                v_bytes = field_value
            elif isinstance(field_value, np.ndarray):
                if field_value.dtype != "bfloat16":
                    raise ParamError(
                        message="invalid input for bfloat16 vector. Expected an np.ndarray with dtype=bfloat16"
                    )
                v_bytes = field_value.view(np.uint8).tobytes()
            else:
                raise ParamError(
                    message="invalid input type for bfloat16 vector. Expected an np.ndarray with dtype=bfloat16"
                )

            field_data.vectors.dim = len(v_bytes) // 2
            field_data.vectors.bfloat16_vector += v_bytes
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "bfloat16_vector", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.SPARSE_FLOAT_VECTOR:
        try:
            if not SciPyHelper.is_scipy_sparse(field_value):
                field_value = [field_value]
            elif field_value.shape[0] != 1:
                raise ParamError(message="invalid input for sparse float vector: expect 1 row")
            if not entity_is_sparse_matrix(field_value):
                raise ParamError(message="invalid input for sparse float vector")
            field_data.vectors.sparse_float_vector.contents.append(
                sparse_rows_to_proto(field_value).contents[0]
            )
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "sparse_float_vector", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.VARCHAR:
        try:
            if field_value is None:
                field_data.scalars.string_data.data.extend([])
            else:
                field_data.scalars.string_data.data.append(
                    convert_to_str_array(field_value, field_info, CHECK_STR_ARRAY)
                )
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "varchar", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.JSON:
        try:
            if field_value is None:
                field_data.scalars.json_data.data.extend([])
            else:
                field_data.scalars.json_data.data.append(convert_to_json(field_value))
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "json", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    elif field_type == DataType.ARRAY:
        try:
            if field_value is None:
                field_data.scalars.array_data.data.extend([])
            else:
                field_data.scalars.array_data.data.append(convert_to_array(field_value, field_info))
        except (TypeError, ValueError) as e:
            raise DataNotMatchException(
                message=ExceptionsMessage.FieldDataInconsistent
                % (field_name, "array", type(field_value))
                + f" Detail: {e!s}"
            ) from e
    else:
        raise ParamError(message=f"Unsupported data type: {field_type}")


# Don't change entity inside.
def entity_to_field_data(entity: Dict, field_info: Any, num_rows: int) -> schema_types.FieldData:
    entity_type = entity.get("type")
    field_name = entity.get("name")
    entity_values = entity.get("values")
    field_data = schema_types.FieldData(
        type=entity_type_to_dtype(entity_type),
        field_name=field_name,
    )

    valid_data = []
    if field_info.get("nullable", False) or field_info.get("default_value", None):
        if len(entity_values) == 0:
            valid_data = [False] * num_rows
        else:
            valid_data = [value is not None for value in entity_values]
            entity_values = [value for value in entity_values if value is not None]

    field_data.valid_data.extend(valid_data)

    try:
        if entity_type == DataType.BOOL:
            field_data.scalars.bool_data.data.extend(entity_values)
        elif entity_type in (DataType.INT8, DataType.INT16, DataType.INT32):
            field_data.scalars.int_data.data.extend(entity_values)
        elif entity_type == DataType.INT64:
            field_data.scalars.long_data.data.extend(entity_values)
        elif entity_type == DataType.FLOAT:
            field_data.scalars.float_data.data.extend(entity_values)
        elif entity_type == DataType.DOUBLE:
            field_data.scalars.double_data.data.extend(entity_values)

        elif entity_type == DataType.FLOAT_VECTOR:
            # TODO: get dimension from field_info
            field_data.vectors.dim = len(entity_values[0])
            all_floats = [f for vector in entity_values for f in vector]
            field_data.vectors.float_vector.data.extend(all_floats)
        elif entity_type == DataType.BINARY_VECTOR:
            field_data.vectors.dim = len(entity_values[0]) * 8
            field_data.vectors.binary_vector = b"".join(entity_values)
        elif entity_type == DataType.FLOAT16_VECTOR:
            field_data.vectors.dim = len(entity_values[0]) // 2
            field_data.vectors.float16_vector = b"".join(entity_values)
        elif entity_type == DataType.BFLOAT16_VECTOR:
            field_data.vectors.dim = len(entity_values[0]) // 2
            field_data.vectors.bfloat16_vector = b"".join(entity_values)
        elif entity_type == DataType.SPARSE_FLOAT_VECTOR:
            field_data.vectors.sparse_float_vector.CopyFrom(sparse_rows_to_proto(entity_values))

        elif entity_type == DataType.VARCHAR:
            field_data.scalars.string_data.data.extend(
                entity_to_str_arr(entity_values, field_info, CHECK_STR_ARRAY)
            )
        elif entity_type == DataType.JSON:
            field_data.scalars.json_data.data.extend(entity_to_json_arr(entity_values, field_info))
        elif entity_type == DataType.ARRAY:
            field_data.scalars.array_data.data.extend(
                entity_to_array_arr(entity_values, field_info)
            )
        else:
            raise ParamError(message=f"Unsupported data type: {entity_type}")
    except (TypeError, ValueError) as e:
        raise DataNotMatchException(
            message=ExceptionsMessage.FieldDataInconsistent
            % (field_name, entity_type.name, type(entity_values[0]))
            + f" Detail: {e!s}"
        ) from e
    return field_data


def extract_dynamic_field_from_result(raw: Any):
    dynamic_field_name = None
    field_names = set()
    if raw.fields_data:
        for field_data in raw.fields_data:
            field_names.add(field_data.field_name)
            if field_data.is_dynamic:
                dynamic_field_name = field_data.field_name

    dynamic_fields = set()
    for name in raw.output_fields:
        if name == dynamic_field_name:
            dynamic_fields.clear()
            break
        if name not in field_names:
            dynamic_fields.add(name)
    return dynamic_field_name, dynamic_fields


def extract_array_row_data_with_validity(field_data: Any, entity_rows: List[Dict], row_count: int):
    field_name = field_data.field_name
    data = field_data.scalars.array_data.data
    element_type = field_data.scalars.array_data.element_type
    if element_type == DataType.INT64:
        [
            entity_rows[i].__setitem__(
                field_name, data[i].long_data.data if field_data.valid_data[i] else None
            )
            for i in range(row_count)
        ]
    elif element_type == DataType.BOOL:
        [
            entity_rows[i].__setitem__(
                field_name, data[i].bool_data.data if field_data.valid_data[i] else None
            )
            for i in range(row_count)
        ]
    elif element_type in (
        DataType.INT8,
        DataType.INT16,
        DataType.INT32,
    ):
        [
            entity_rows[i].__setitem__(
                field_name, data[i].int_data.data if field_data.valid_data[i] else None
            )
            for i in range(row_count)
        ]
    elif element_type == DataType.FLOAT:
        [
            entity_rows[i].__setitem__(
                field_name, data[i].float_data.data if field_data.valid_data[i] else None
            )
            for i in range(row_count)
        ]
    elif element_type == DataType.DOUBLE:
        [
            entity_rows[i].__setitem__(
                field_name, data[i].double_data.data if field_data.valid_data[i] else None
            )
            for i in range(row_count)
        ]
    elif element_type in (
        DataType.STRING,
        DataType.VARCHAR,
    ):
        [
            entity_rows[i].__setitem__(
                field_name, data[i].string_data.data if field_data.valid_data[i] else None
            )
            for i in range(row_count)
        ]
    else:
        raise MilvusException(message=f"Unsupported data type: {element_type}")


def extract_array_row_data_no_validity(field_data: Any, entity_rows: List[Dict], row_count: int):
    field_name = field_data.field_name
    data = field_data.scalars.array_data.data
    element_type = field_data.scalars.array_data.element_type
    if element_type == DataType.INT64:
        [entity_rows[i].__setitem__(field_name, data[i].long_data.data) for i in range(row_count)]
    elif element_type == DataType.BOOL:
        [entity_rows[i].__setitem__(field_name, data[i].bool_data.data) for i in range(row_count)]
    elif element_type in (
        DataType.INT8,
        DataType.INT16,
        DataType.INT32,
    ):
        [entity_rows[i].__setitem__(field_name, data[i].int_data.data) for i in range(row_count)]
    elif element_type == DataType.FLOAT:
        [entity_rows[i].__setitem__(field_name, data[i].float_data.data) for i in range(row_count)]
    elif element_type == DataType.DOUBLE:
        [entity_rows[i].__setitem__(field_name, data[i].double_data.data) for i in range(row_count)]
    elif element_type in (
        DataType.STRING,
        DataType.VARCHAR,
    ):
        [entity_rows[i].__setitem__(field_name, data[i].string_data.data) for i in range(row_count)]
    else:
        raise MilvusException(message=f"Unsupported data type: {element_type}")


def extract_array_row_data(field_data: Any, index: int):
    array = field_data.scalars.array_data.data[index]
    if field_data.scalars.array_data.element_type == DataType.INT64:
        return array.long_data.data
    if field_data.scalars.array_data.element_type == DataType.BOOL:
        return array.bool_data.data
    if field_data.scalars.array_data.element_type in (
        DataType.INT8,
        DataType.INT16,
        DataType.INT32,
    ):
        return array.int_data.data
    if field_data.scalars.array_data.element_type == DataType.FLOAT:
        return array.float_data.data
    if field_data.scalars.array_data.element_type == DataType.DOUBLE:
        return array.double_data.data
    if field_data.scalars.array_data.element_type in (
        DataType.STRING,
        DataType.VARCHAR,
    ):
        return array.string_data.data
    return None


def extract_row_data_from_fields_data_v2(
    field_data: Any,
    entity_rows: List[Dict],
) -> bool:
    row_count = len(entity_rows)
    has_valid = len(field_data.valid_data) > 0
    field_name = field_data.field_name
    valid_data = field_data.valid_data

    def assign_scalar(data: List[Any]) -> None:
        if has_valid:
            [
                entity_rows[i].__setitem__(field_name, None if not valid_data[i] else data[i])
                for i in range(row_count)
            ]
        else:
            [entity_rows[i].__setitem__(field_name, data[i]) for i in range(row_count)]

    if field_data.type == DataType.BOOL:
        data = field_data.scalars.bool_data.data
        assign_scalar(data)
        return False

    if field_data.type in (DataType.INT8, DataType.INT16, DataType.INT32):
        data = field_data.scalars.int_data.data
        assign_scalar(data)
        return False

    if field_data.type == DataType.INT64:
        data = field_data.scalars.long_data.data
        assign_scalar(data)
        return False

    if field_data.type == DataType.FLOAT:
        data = field_data.scalars.float_data.data
        assign_scalar(data)
        return False

    if field_data.type == DataType.DOUBLE:
        data = field_data.scalars.double_data.data
        assign_scalar(data)
        return False

    if field_data.type == DataType.VARCHAR:
        data = field_data.scalars.string_data.data
        assign_scalar(data)
        return False

    if field_data.type == DataType.JSON:
        return True

    if field_data.type == DataType.ARRAY:
        if has_valid:
            extract_array_row_data_with_validity(field_data, entity_rows, row_count)
        else:
            extract_array_row_data_no_validity(field_data, entity_rows, row_count)
        return False
    if field_data.type in (
        DataType.FLOAT_VECTOR,
        DataType.FLOAT16_VECTOR,
        DataType.BFLOAT16_VECTOR,
        DataType.BINARY_VECTOR,
        DataType.SPARSE_FLOAT_VECTOR,
    ):
        return True
    if field_data.type == DataType.STRING:
        raise MilvusException(message="Not support string yet")
    return False


# pylint: disable=R1702 (too-many-nested-blocks)
# pylint: disable=R0915 (too-many-statements)
def extract_row_data_from_fields_data(
    fields_data: Any,
    index: Any,
    dynamic_output_fields: Optional[List] = None,
):
    if not fields_data:
        return {}

    entity_row_data = {}
    dynamic_fields = dynamic_output_fields or set()

    def check_append(field_data: Any):
        if field_data.type == DataType.STRING:
            raise MilvusException(message="Not support string yet")

        if field_data.type == DataType.BOOL and len(field_data.scalars.bool_data.data) >= index:
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = field_data.scalars.bool_data.data[index]
            return

        if (
            field_data.type in (DataType.INT8, DataType.INT16, DataType.INT32)
            and len(field_data.scalars.int_data.data) >= index
        ):
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = field_data.scalars.int_data.data[index]
            return

        if field_data.type == DataType.INT64 and len(field_data.scalars.long_data.data) >= index:
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = field_data.scalars.long_data.data[index]
            return

        if field_data.type == DataType.FLOAT and len(field_data.scalars.float_data.data) >= index:
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = np.single(
                field_data.scalars.float_data.data[index]
            )
            return

        if field_data.type == DataType.DOUBLE and len(field_data.scalars.double_data.data) >= index:
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = field_data.scalars.double_data.data[index]
            return

        if (
            field_data.type == DataType.VARCHAR
            and len(field_data.scalars.string_data.data) >= index
        ):
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = field_data.scalars.string_data.data[index]
            return

        if field_data.type == DataType.JSON and len(field_data.scalars.json_data.data) >= index:
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            json_dict = ujson.loads(field_data.scalars.json_data.data[index])

            if not field_data.is_dynamic:
                entity_row_data[field_data.field_name] = json_dict
                return

            if not dynamic_fields:
                entity_row_data.update(json_dict)
                return

            entity_row_data.update({k: v for k, v in json_dict.items() if k in dynamic_fields})
            return
        if field_data.type == DataType.ARRAY and len(field_data.scalars.array_data.data) >= index:
            if len(field_data.valid_data) > 0 and field_data.valid_data[index] is False:
                entity_row_data[field_data.field_name] = None
                return
            entity_row_data[field_data.field_name] = extract_array_row_data(field_data, index)

        if field_data.type == DataType.FLOAT_VECTOR:
            dim = field_data.vectors.dim
            if len(field_data.vectors.float_vector.data) >= index * dim:
                start_pos, end_pos = index * dim, (index + 1) * dim
                # Here we use numpy.array to convert the float64 values to numpy.float32 values,
                # and return a list of numpy.float32 to users
                # By using numpy.array, performance improved by 60% for topk=16384 dim=1536 case.
                arr = np.array(
                    field_data.vectors.float_vector.data[start_pos:end_pos], dtype=np.float32
                )
                entity_row_data[field_data.field_name] = list(arr)
        elif field_data.type == DataType.BINARY_VECTOR:
            dim = field_data.vectors.dim
            if len(field_data.vectors.binary_vector) >= index * (dim // 8):
                start_pos, end_pos = index * (dim // 8), (index + 1) * (dim // 8)
                entity_row_data[field_data.field_name] = [
                    field_data.vectors.binary_vector[start_pos:end_pos]
                ]
        elif field_data.type == DataType.BFLOAT16_VECTOR:
            dim = field_data.vectors.dim
            if len(field_data.vectors.bfloat16_vector) >= index * (dim * 2):
                start_pos, end_pos = index * (dim * 2), (index + 1) * (dim * 2)
                entity_row_data[field_data.field_name] = [
                    field_data.vectors.bfloat16_vector[start_pos:end_pos]
                ]
        elif field_data.type == DataType.FLOAT16_VECTOR:
            dim = field_data.vectors.dim
            if len(field_data.vectors.float16_vector) >= index * (dim * 2):
                start_pos, end_pos = index * (dim * 2), (index + 1) * (dim * 2)
                entity_row_data[field_data.field_name] = [
                    field_data.vectors.float16_vector[start_pos:end_pos]
                ]
        elif field_data.type == DataType.SPARSE_FLOAT_VECTOR:
            entity_row_data[field_data.field_name] = sparse_parse_single_row(
                field_data.vectors.sparse_float_vector.contents[index]
            )

    for field_data in fields_data:
        check_append(field_data)

    return entity_row_data
