import datetime
import importlib.util
import struct
from copy import deepcopy
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Dict, Iterable, List, Optional, Tuple, Union

import ujson

from pymilvus.exceptions import MilvusException, ParamError
from pymilvus.grpc_gen.common_pb2 import Status

from .constants import LOGICAL_BITS, LOGICAL_BITS_MASK
from .types import DataType

MILVUS = "milvus"
ZILLIZ = "zilliz"

valid_index_types = [
    "GPU_IVF_FLAT",
    "GPU_IVF_PQ",
    "FLAT",
    "IVF_FLAT",
    "IVF_SQ8",
    "IVF_PQ",
    "HNSW",
    "BIN_FLAT",
    "BIN_IVF_FLAT",
    "DISKANN",
    "AUTOINDEX",
    "GPU_CAGRA",
    "GPU_BRUTE_FORCE",
]

valid_index_params_keys = [
    "nlist",
    "m",
    "nbits",
    "M",
    "efConstruction",
    "PQM",
    "n_trees",
    "intermediate_graph_degree",
    "graph_degree",
    "build_algo",
    "cache_dataset_on_device",
]

valid_binary_index_types = [
    "BIN_FLAT",
    "BIN_IVF_FLAT",
]

valid_binary_metric_types = [
    "JACCARD",
    "HAMMING",
    "TANIMOTO",
    "SUBSTRUCTURE",
    "SUPERSTRUCTURE",
]


def check_status(status: Status):
    if status.code != 0 or status.error_code != 0:
        raise MilvusException(status.code, status.reason, status.error_code)


def is_successful(status: Status):
    return status.code == 0 and status.error_code == 0


def hybridts_to_unixtime(ts: int):
    physical = ts >> LOGICAL_BITS
    return physical / 1000.0


def mkts_from_hybridts(
    hybridts: int,
    milliseconds: Union[float] = 0.0,
    delta: Optional[timedelta] = None,
) -> int:
    if not isinstance(milliseconds, (int, float)):
        raise MilvusException(message="parameter milliseconds should be type of int or float")

    if isinstance(delta, datetime.timedelta):
        milliseconds += delta.microseconds / 1000.0
    elif delta is not None:
        raise MilvusException(message="parameter delta should be type of datetime.timedelta")

    if not isinstance(hybridts, int):
        raise MilvusException(message="parameter hybridts should be type of int")

    logical = hybridts & LOGICAL_BITS_MASK
    physical = hybridts >> LOGICAL_BITS

    return int((int(physical + milliseconds) << LOGICAL_BITS) + logical)


def mkts_from_unixtime(
    epoch: Union[float],
    milliseconds: Union[float] = 0.0,
    delta: Optional[timedelta] = None,
) -> int:
    if not isinstance(epoch, (int, float)):
        raise MilvusException(message="parameter epoch should be type of int or float")

    if not isinstance(milliseconds, (int, float)):
        raise MilvusException(message="parameter milliseconds should be type of int or float")

    if isinstance(delta, datetime.timedelta):
        milliseconds += delta.microseconds / 1000.0
    elif delta is not None:
        raise MilvusException(message="parameter delta should be type of datetime.timedelta")

    epoch += milliseconds / 1000.0
    int_msecs = int(epoch * 1000 // 1)
    return int(int_msecs << LOGICAL_BITS)


def mkts_from_datetime(
    d_time: datetime.datetime,
    milliseconds: Union[float] = 0.0,
    delta: Optional[timedelta] = None,
) -> int:
    if not isinstance(d_time, datetime.datetime):
        raise MilvusException(message="parameter d_time should be type of datetime.datetime")

    return mkts_from_unixtime(d_time.timestamp(), milliseconds=milliseconds, delta=delta)


def check_invalid_binary_vector(entities: List) -> bool:
    for entity in entities:
        if entity["type"] == DataType.BINARY_VECTOR:
            if not isinstance(entity["values"], list) and len(entity["values"]) == 0:
                return False

            dim = len(entity["values"][0]) * 8
            if dim == 0:
                return False

            for values in entity["values"]:
                if len(values) * 8 != dim:
                    return False
                if not isinstance(values, bytes):
                    return False
    return True


def len_of(field_data: Any) -> int:
    if field_data.HasField("scalars"):
        if field_data.scalars.HasField("bool_data"):
            return len(field_data.scalars.bool_data.data)

        if field_data.scalars.HasField("int_data"):
            return len(field_data.scalars.int_data.data)

        if field_data.scalars.HasField("long_data"):
            return len(field_data.scalars.long_data.data)

        if field_data.scalars.HasField("float_data"):
            return len(field_data.scalars.float_data.data)

        if field_data.scalars.HasField("double_data"):
            return len(field_data.scalars.double_data.data)

        if field_data.scalars.HasField("string_data"):
            return len(field_data.scalars.string_data.data)

        if field_data.scalars.HasField("bytes_data"):
            return len(field_data.scalars.bytes_data.data)

        if field_data.scalars.HasField("json_data"):
            return len(field_data.scalars.json_data.data)

        if field_data.scalars.HasField("array_data"):
            return len(field_data.scalars.array_data.data)

        raise MilvusException(message="Unsupported scalar type")

    if field_data.HasField("vectors"):
        dim = field_data.vectors.dim
        if field_data.vectors.HasField("float_vector"):
            total_len = len(field_data.vectors.float_vector.data)
            if total_len % dim != 0:
                raise MilvusException(
                    message=f"Invalid vector length: total_len={total_len}, dim={dim}"
                )
            return int(total_len / dim)
        if field_data.vectors.HasField("bfloat16_vector") or field_data.vectors.HasField(
            "float16_vector"
        ):
            total_len = (
                len(field_data.vectors.bfloat16_vector)
                if field_data.vectors.HasField("bfloat16_vector")
                else len(field_data.vectors.float16_vector)
            )
            data_wide_in_bytes = 2
            if total_len % (dim * data_wide_in_bytes) != 0:
                raise MilvusException(
                    message=f"Invalid bfloat16 or float16 vector length: total_len={total_len}, dim={dim}"
                )
            return int(total_len / (dim * data_wide_in_bytes))
        if field_data.vectors.HasField("sparse_float_vector"):
            return len(field_data.vectors.sparse_float_vector.contents)

        total_len = len(field_data.vectors.binary_vector)
        return int(total_len / (dim / 8))

    raise MilvusException(message="Unknown data type")


def traverse_rows_info(fields_info: Any, entities: List):
    location, primary_key_loc, auto_id_loc = {}, None, None

    for i, field in enumerate(fields_info):
        is_auto_id = False
        is_dynamic = False

        if field.get("auto_id", False):
            auto_id_loc = i
            is_auto_id = True

        if field.get("is_primary", False):
            primary_key_loc = i

        field_name = field["name"]
        location[field_name] = i

        if field.get("is_dynamic", False):
            is_dynamic = True

        for j, entity in enumerate(entities):
            if is_auto_id:
                if field_name in entity:
                    raise ParamError(
                        message=f"auto id enabled, {field_name} shouldn't in entities[{j}]"
                    )
                continue

            if is_dynamic and field_name in entity:
                raise ParamError(
                    message=f"dynamic field enabled, {field_name} shouldn't in entities[{j}]"
                )

    # though impossible from sdk
    if primary_key_loc is None:
        raise ParamError(message="primary key not found")

    return location, primary_key_loc, auto_id_loc


def traverse_info(fields_info: Any):
    location, primary_key_loc, auto_id_loc = {}, None, None
    for i, field in enumerate(fields_info):
        if field.get("is_primary", False):
            primary_key_loc = i

        if field.get("auto_id", False):
            auto_id_loc = i
            continue
        location[field["name"]] = i

    return location, primary_key_loc, auto_id_loc


def traverse_upsert_info(fields_info: Any):
    location, primary_key_loc = {}, None
    for i, field in enumerate(fields_info):
        if field.get("is_primary", False):
            primary_key_loc = i

        location[field["name"]] = i

    return location, primary_key_loc


def get_params(search_params: Dict):
    # after 2.5.2, all parameters of search_params can be written into one layer
    # no more parameters will be written searchParams.params
    # to ensure compatibility and milvus can still get a json format parameter
    # try to write all the parameters under searchParams into searchParams.Params
    params = deepcopy(search_params.get("params", {}))
    for key, value in search_params.items():
        if key in params:
            if params[key] != value:
                raise ParamError(
                    message=f"ambiguous parameter: {key}, in search_param: {value}, in search_param.params: {params[key]}"
                )
        elif key != "params":
            params[key] = value

    return params


def get_server_type(host: str):
    return ZILLIZ if (isinstance(host, str) and "zilliz" in host.lower()) else MILVUS


def dumps(v: Union[dict, str]) -> str:
    return ujson.dumps(v) if isinstance(v, dict) else str(v)


class SciPyHelper:
    _checked = False

    # whether scipy.sparse.*_matrix classes exists
    _matrix_available = False
    # whether scipy.sparse.*_array classes exists
    _array_available = False

    @classmethod
    def _init(cls):
        if cls._checked:
            return
        scipy_spec = importlib.util.find_spec("scipy")
        if scipy_spec is not None:
            # when scipy is not installed, find_spec("scipy.sparse") directly
            # throws exception instead of returning None.
            sparse_spec = importlib.util.find_spec("scipy.sparse")
            if sparse_spec is not None:
                scipy_sparse = importlib.util.module_from_spec(sparse_spec)
                sparse_spec.loader.exec_module(scipy_sparse)
                # all scipy.sparse.*_matrix classes are introduced in the same scipy
                # version, so we only need to check one of them.
                cls._matrix_available = hasattr(scipy_sparse, "csr_matrix")
                # all scipy.sparse.*_array classes are introduced in the same scipy
                # version, so we only need to check one of them.
                cls._array_available = hasattr(scipy_sparse, "csr_array")

        cls._checked = True

    @classmethod
    def is_spmatrix(cls, data: Any):
        cls._init()
        if not cls._matrix_available:
            return False

        # ruff: noqa: PLC0415
        from scipy.sparse import isspmatrix

        return isspmatrix(data)

    @classmethod
    def is_sparray(cls, data: Any):
        cls._init()
        if not cls._array_available:
            return False

        # ruff: noqa: PLC0415
        from scipy.sparse import issparse, isspmatrix

        return issparse(data) and not isspmatrix(data)

    @classmethod
    def is_scipy_sparse(cls, data: Any):
        return cls.is_spmatrix(data) or cls.is_sparray(data)


# in search results, if output fields includes a sparse float vector field, we
# will return a SparseRowOutputType for each entity. Using Dict for readability.
# TODO(SPARSE): to allow the user to specify output format.
SparseRowOutputType = Dict[int, float]


# this import will be called only during static type checking
if TYPE_CHECKING:
    from scipy.sparse import (
        bsr_array,
        coo_array,
        csc_array,
        csr_array,
        dia_array,
        dok_array,
        lil_array,
        spmatrix,
    )

# we accept the following types as input for sparse matrix in user facing APIs
# such as insert, search, etc.:
# - scipy sparse array/matrix family: csr, csc, coo, bsr, dia, dok, lil
# - iterable of iterables, each element(iterable) is a sparse vector with index
#   as key and value as float.
#   dict example: [{2: 0.33, 98: 0.72, ...}, {4: 0.45, 198: 0.52, ...}, ...]
#   list of tuple example: [[(2, 0.33), (98, 0.72), ...], [(4, 0.45), ...], ...]
#   both index/value can be str numbers: {'2': '3.1'}
SparseMatrixInputType = Union[
    Iterable[
        Union[
            SparseRowOutputType,
            Iterable[Tuple[int, float]],  # only type hint, we accept int/float like types
        ]
    ],
    "csc_array",
    "coo_array",
    "bsr_array",
    "dia_array",
    "dok_array",
    "lil_array",
    "csr_array",
    "spmatrix",
]


def is_sparse_vector_type(data_type: DataType) -> bool:
    return data_type == data_type.SPARSE_FLOAT_VECTOR


dense_vector_type_set = {DataType.FLOAT_VECTOR, DataType.FLOAT16_VECTOR, DataType.BFLOAT16_VECTOR}


def is_dense_vector_type(data_type: DataType) -> bool:
    return data_type in dense_vector_type_set


def is_float_vector_type(data_type: DataType):
    return is_sparse_vector_type(data_type) or is_dense_vector_type(data_type)


def is_binary_vector_type(data_type: DataType):
    return data_type == DataType.BINARY_VECTOR


def is_vector_type(data_type: DataType):
    return is_float_vector_type(data_type) or is_binary_vector_type(data_type)


# parses plain bytes to a sparse float vector(SparseRowOutputType)
def sparse_parse_single_row(data: bytes) -> SparseRowOutputType:
    if len(data) % 8 != 0:
        raise ParamError(message=f"The length of data must be a multiple of 8, got {len(data)}")

    return {
        struct.unpack("I", data[i : i + 4])[0]: struct.unpack("f", data[i + 4 : i + 8])[0]
        for i in range(0, len(data), 8)
    }
