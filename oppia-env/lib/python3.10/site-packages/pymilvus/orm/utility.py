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

from datetime import datetime, timedelta, timezone
from typing import List, Mapping, Optional

from pymilvus.client.types import (
    BulkInsertState,
    ResourceGroupConfig,
)
from pymilvus.client.utils import hybridts_to_unixtime as _hybridts_to_unixtime
from pymilvus.client.utils import mkts_from_datetime as _mkts_from_datetime
from pymilvus.client.utils import mkts_from_hybridts as _mkts_from_hybridts
from pymilvus.client.utils import mkts_from_unixtime as _mkts_from_unixtime
from pymilvus.exceptions import MilvusException

from .connections import connections


def mkts_from_hybridts(hybridts: int, milliseconds: float = 0.0, delta: Optional[timedelta] = None):
    """Generate a hybrid timestamp based on an existing hybrid timestamp,
    timedelta and incremental time internval.

    :param hybridts: The original hybrid timestamp used to generate a new hybrid timestamp.
                     Non-negative interger range from 0 to 18446744073709551615.
    :type  hybridts: int

    :param milliseconds: Incremental time interval. The unit of time is milliseconds.
    :type  milliseconds: float

    :param delta: A duration expressing the difference between two date, time, or datetime instances
                  to microsecond resolution.
    :type  delta: datetime.timedelta

    :return int:
        Hybrid timetamp is a non-negative interger range from 0 to 18446744073709551615.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_vector = FieldSchema("float_vector", DataType.FLOAT_VECTOR,  dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_vector])
        >>> collection = Collection(name="test_collection", schema=schema)
        >>> import pandas as pd
        >>> int64_series = pd.Series(data=list(range(10, 20)), index=list(range(10)))i
        >>> float_vector_series = [[random.random() for _ in range _DIM] for _ in range (10)]
        >>> data = pd.DataFrame({"int64" : int64_series, "float_vector": float_vector_series})
        >>> m = collection.insert(data)
        >>> ts_new = utility.mkts_from_hybridts(m.timestamp, milliseconds=1000.0)
    """
    return _mkts_from_hybridts(hybridts, milliseconds=milliseconds, delta=delta)


def mkts_from_unixtime(epoch: float, milliseconds: float = 0.0, delta: Optional[timedelta] = None):
    """
    Generate a hybrid timestamp based on Unix Epoch time, timedelta and incremental time internval.

    :param epoch: The known Unix Epoch time used to generate a hybrid timestamp.
                  The Unix Epoch time is the number of seconds that have elapsed
                  since January 1, 1970 (midnight UTC/GMT).
    :type  epoch: float

    :param milliseconds: Incremental time interval. The unit of time is milliseconds.
    :type  milliseconds: float

    :param delta: A duration expressing the difference between two date, time, or datetime instances
                  to microsecond resolution.
    :type  delta: datetime.timedelta

    :return int:
        Hybrid timetamp is a non-negative interger range from 0 to 18446744073709551615.

    :example:
        >>> import time
        >>> from pymilvus import utility
        >>> epoch_t = time.time()
        >>> ts = utility.mkts_from_unixtime(epoch_t, milliseconds=1000.0)
    """
    return _mkts_from_unixtime(epoch, milliseconds=milliseconds, delta=delta)


def mkts_from_datetime(
    d_time: datetime, milliseconds: float = 0.0, delta: Optional[timedelta] = None
):
    """
    Generate a hybrid timestamp based on datetime, timedelta and incremental time internval.

    :param d_time: The known datetime used to generate a hybrid timestamp.
    :type  d_time: datetime.datetime.

    :param milliseconds: Incremental time interval. The unit of time is milliseconds.
    :type  milliseconds: float

    :param delta: A duration expressing the difference between two date, time, or datetime instances
                  to microsecond resolution.
    :type  delta:  datetime.timedelta

    :return int:
        Hybrid timetamp is a non-negative interger range from 0 to 18446744073709551615.

    :example:
        >>> import datetime
        >>> from pymilvus import utility
        >>> d = datetime.datetime.now()
        >>> ts = utility.mkts_from_datetime(d, milliseconds=1000.0)
    """
    return _mkts_from_datetime(d_time, milliseconds=milliseconds, delta=delta)


def hybridts_to_datetime(hybridts: int, tz: Optional[timezone] = None):
    """
    Convert a hybrid timestamp to the datetime according to timezone.

    :param hybridts: The known hybrid timestamp to convert to datetime.
                     Non-negative interger range from 0 to 18446744073709551615.
    :type  hybridts: int
    :param tz: Timezone defined by a fixed offset from UTC. If argument tz is None or not specified,
               the hybridts is converted to the platform`s local date and time.
    :type  tz: datetime.timezone

    :return datetime:
        The datetime object.

    :raises Exception: If parameter tz is not of type datetime.timezone.

    :example:
        >>> import time
        >>> from pymilvus import utility
        >>> epoch_t = time.time()
        >>> ts = utility.mkts_from_unixtime(epoch_t)
        >>> d = utility.hybridts_to_datetime(ts)
    """

    if tz is not None and not isinstance(tz, timezone):
        msg = "parameter tz should be type of datetime.timezone"
        raise MilvusException(message=msg)
    epoch = _hybridts_to_unixtime(hybridts)
    return datetime.fromtimestamp(epoch, tz=tz)


def hybridts_to_unixtime(hybridts: int):
    """
    Convert a hybrid timestamp to UNIX Epoch time ignoring the logic part.

    :param hybridts: The known hybrid timestamp to convert to UNIX Epoch time.
                     Non-negative interger range from 0 to 18446744073709551615.
    :type  hybridts: int

    :return float:
        The Unix Epoch time is the number of seconds that have elapsed since
        January 1, 1970 (midnight UTC/GMT).

    :example:
        >>> import time
        >>> from pymilvus import utility
        >>> epoch1 = time.time()
        >>> ts = utility.mkts_from_unixtime(epoch1)
        >>> epoch2 = utility.hybridts_to_unixtime(ts)
        >>> assert epoch1 == epoch2
    """
    return _hybridts_to_unixtime(hybridts)


def _get_connection(alias: str):
    return connections._fetch_handler(alias)


def loading_progress(
    collection_name: str,
    partition_names: Optional[List[str]] = None,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """Show loading progress of sealed segments in percentage.

    :param collection_name: The name of collection is loading
    :type  collection_name: str

    :param partition_names: The names of partitions is loading
    :type  partition_names: str list

    :return dict:
        {'loading_progress': '100%'}
    :raises MilvusException: If anything goes wrong.
    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> import pandas as pd
        >>> import random
        >>> fields = [
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", DataType.FLOAT_VECTOR, dim=8),
        ... ]
        >>> schema = CollectionSchema(fields)
        >>> collection = Collection("test_loading_progress", schema)
        >>> data = pd.DataFrame({
        ...     "film_id" : pd.Series(data=list(range(10, 20)), index=list(range(10))),
        ...     "films": [[random.random() for _ in range(8)] for _ in range (10)],
        ... })
        >>> collection.insert(data)
        >>> collection.create_index(
        ...     "films",
        ...     {"index_type": "IVF_FLAT", "params": {"nlist": 8}, "metric_type": "L2"})
        >>> collection.load(_async=True)
        >>> utility.loading_progress("test_loading_progress")
        {'loading_progress': '100%'}
    """
    progress = _get_connection(using).get_loading_progress(
        collection_name, partition_names, timeout=timeout
    )
    return {
        "loading_progress": f"{progress:.0f}%",
    }


def load_state(
    collection_name: str,
    partition_names: Optional[List[str]] = None,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """Show load state of collection or partitions.
    :param collection_name: The name of collection is loading
    :type  collection_name: str

    :param partition_names: The names of partitions is loading
    :type  partition_names: str list

    :return LoadState:
        The current state of collection or partitions.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> from pymilvus.client.types import LoadState
        >>> import pandas as pd
        >>> import random
        >>> assert utility.load_state("test_load_state") == LoadState.NotExist
        >>> fields = [
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", DataType.FLOAT_VECTOR, dim=8),
        ... ]
        >>> schema = CollectionSchema(fields)
        >>> collection = Collection("test_load_state", schema)
        >>> assert utility.load_state("test_load_state") == LoadState.NotLoad
        >>> data = pd.DataFrame({
        ...     "film_id" : pd.Series(data=list(range(10, 20)), index=list(range(10))),
        ...     "films": [[random.random() for _ in range(8)] for _ in range (10)],
        ... })
        >>> collection.insert(data)
        >>> collection.create_index(
        ...     "films",
        ...     {"index_type": "IVF_FLAT", "params": {"nlist": 8}, "metric_type": "L2"})
        >>> collection.load(_async=True)
        >>> assert utility.load_state("test_load_state") == LoadState.Loaded
    """
    return _get_connection(using).get_load_state(collection_name, partition_names, timeout=timeout)


def wait_for_loading_complete(
    collection_name: str,
    partition_names: Optional[List[str]] = None,
    timeout: Optional[float] = None,
    using: str = "default",
):
    """
    Block until loading is done or Raise Exception after timeout.

    :param collection_name: The name of collection to wait for loading complete
    :type  collection_name: str

    :param partition_names: The names of partitions to wait for loading complete
    :type  partition_names: str list

    :param timeout: The timeout for this method, unit: second
    :type  timeout: int

    :raises MilvusException: If anything goes wrong.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_fvec = FieldSchema("float_vector", DataType.FLOAT_VECTOR, dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_fvec])
        >>> collection = Collection(name="test_collection", schema=schema)
        >>> import pandas as pd
        >>> int64_series = pd.Series(data=list(range(10, 20)), index=list(range(10)))i
        >>> float_vector_series = [[random.random() for _ in range _DIM] for _ in range (10)]
        >>> data = pd.DataFrame({"int64" : int64_series, "float_vector": float_vector_series})
        >>> collection.insert(data)
        >>> collection.load() # load collection to memory
        >>> utility.wait_for_loading_complete("test_collection")
    """
    if not partition_names or len(partition_names) == 0:
        return _get_connection(using).wait_for_loading_collection(collection_name, timeout=timeout)
    return _get_connection(using).wait_for_loading_partitions(
        collection_name, partition_names, timeout=timeout
    )


def index_building_progress(
    collection_name: str,
    index_name: str = "",
    using: str = "default",
    timeout: Optional[float] = None,
):
    """
    Show # indexed entities vs. # total entities.

    :param collection_name: The name of collection is building index
    :type  collection_name: str

    :param index_name: The name of index is building.
                        Default index_name is to be used if index_name is not specific.
    :type index_name: str

    :return dict:

        Index building progress is a dict contains num of indexed entities and num of total
        entities.
        {'total_rows':total_rows,'indexed_rows':indexed_rows}

    :raises CollectionNotExistException: If collection doesn't exist.
    :raises IndexNotExistException: If index doesn't exist.
    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> fields = [
        ...     FieldSchema("int64", DataType.INT64, is_primary=True, auto_id=True),
        ...     FieldSchema("float_vector", DataType.FLOAT_VECTOR, dim=128),
        ... ]
        >>> schema = CollectionSchema(fields, description="test index_building_progress")
        >>> c = Collection(name="test_index_building_progress", schema=schema)

        >>> import random
        >>> vectors = [[random.random() for _ in range(_DIM)] for _ in range(5000)]
        >>> c.insert([vectors])
        >>> c.load()
        >>> index_params = {
        ...    "metric_type": "L2",
        ...    "index_type": "IVF_FLAT",
        ...    "params": {"nlist": 1024}
        ... }
        >>> index = c.create_index(
        ...     field_name="float_vector",
        ...     index_params=index_params,
        ...     index_name="ivf_flat")
        >>> utility.index_building_progress("test_collection", c.name)
    """
    return _get_connection(using).get_index_build_progress(
        collection_name=collection_name, index_name=index_name, timeout=timeout
    )


def wait_for_index_building_complete(
    collection_name: str,
    index_name: str = "",
    timeout: Optional[float] = None,
    using: str = "default",
):
    """
    Block until building is done or Raise Exception after timeout.

    :param collection_name: The name of collection to wait
    :type  collection_name: str

    :param index_name: The name of index to wait
    :type  index_name: str

    :param timeout: The timeout for this method, unit: second
    :type  timeout: int

    :raises CollectionNotExistException: If collection doesn't exist.
    :raises IndexNotExistException: If index doesn't exist.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_vector = FieldSchema("float_vector", DataType.FLOAT_VECTOR, dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_vector], description="test")
        >>> collection = Collection(name="test_collection", schema=schema)
        >>> import random
        >>> import numpy as np
        >>> import pandas as pd
        >>> vectors = [[random.random() for _ in range(_DIM)] for _ in range(5000)]
        >>> int64_series = pd.Series(data=list(range(5000, 10000)), index=list(range(5000)))
        >>> vectors = [[random.random() for _ in range(_DIM)] for _ in range (5000)]
        >>> data = pd.DataFrame({"int64" : int64_series, "float_vector": vectors})
        >>> collection.insert(data)
        >>> collection.load() # load collection to memory
        >>> index_param = {
        >>>    "metric_type": "L2",
        >>>    "index_type": "IVF_FLAT",
        >>>    "params": {"nlist": 1024}
        >>> }
        >>> collection.create_index("float_vector", index_param)
        >>> utility.index_building_progress("test_collection", "")
        >>> utility.loading_progress("test_collection")

    """
    return _get_connection(using).wait_for_creating_index(
        collection_name, index_name, timeout=timeout
    )[0]


def has_collection(collection_name: str, using: str = "default", timeout: Optional[float] = None):
    """
    Checks whether a specified collection exists.

    :param collection_name: The name of collection to check.
    :type  collection_name: str

    :return bool:
        Whether the collection exists.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_vector = FieldSchema("float_vector", DataType.FLOAT_VECTOR,  dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_vector], description="test")
        >>> collection = Collection(name="test_collection", schema=schema)
        >>> utility.has_collection("test_collection")
    """
    return _get_connection(using).has_collection(collection_name, timeout=timeout)


def has_partition(
    collection_name: str,
    partition_name: str,
    using: str = "default",
    timeout: Optional[float] = None,
) -> bool:
    """
    Checks if a specified partition exists in a collection.

    :param collection_name: The collection name of partition to check
    :type  collection_name: str

    :param partition_name: The name of partition to check.
    :type  partition_name: str

    :return bool:
        Whether the partition exist.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_vector = FieldSchema("float_vector", DataType.FLOAT_VECTOR, dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_vector], description="test")
        >>> collection = Collection(name="test_collection", schema=schema)
        >>> utility.has_partition("_default")
    """
    return _get_connection(using).has_partition(collection_name, partition_name, timeout=timeout)


def drop_collection(collection_name: str, timeout: Optional[float] = None, using: str = "default"):
    """
    Drop a collection by name

    :param collection_name: A string representing the collection to be deleted
    :type  collection_name: str
    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur.
    :type  timeout: float

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> schema = CollectionSchema(fields=[
        ...     FieldSchema("int64", DataType.INT64, description="int64", is_primary=True),
        ...     FieldSchema("float_vector", DataType.FLOAT_VECTOR, is_primary=False, dim=128),
        ... ])
        >>> collection = Collection(name="drop_collection_test", schema=schema)
        >>> utility.has_collection("drop_collection_test")
        >>> True
        >>> utility.drop_collection("drop_collection_test")
        >>> utility.has_collection("drop_collection_test")
        >>> False
    """
    return _get_connection(using).drop_collection(collection_name, timeout=timeout)


def rename_collection(
    old_collection_name: str,
    new_collection_name: str,
    new_db_name: str = "",
    timeout: Optional[float] = None,
    using: str = "default",
):
    """
    Rename a collection to new collection name

    :param old_collection_name: A string representing old name of the renamed collection
    :type  old_collection_name: str

    :param new_collection_name: A string representing new name of the renamed collection
    :type  new_collection_name: str

    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur.
    :type  timeout: float

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> schema = CollectionSchema(fields=[
        ...     FieldSchema("int64", DataType.INT64, description="int64", is_primary=True),
        ...     FieldSchema("float_vector", DataType.FLOAT_VECTOR, is_primary=False, dim=128),
        ... ])
        >>> collection = Collection(name="old_collection", schema=schema)
        >>> utility.rename_collection("old_collection", "new_collection")
        >>> True
        >>> utility.drop_collection("new_collection")
        >>> utility.has_collection("new_collection")
        >>> False
    """
    return _get_connection(using).rename_collections(
        old_name=old_collection_name,
        new_name=new_collection_name,
        new_db_name=new_db_name,
        timeout=timeout,
    )


def list_collections(timeout: Optional[float] = None, using: str = "default") -> list:
    """
    Returns a list of all collection names.

    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur.
    :type  timeout: float

    :param using: An optional alias for the database host. Default value is "default".
    :type using: str

    :return list[str]:
        List of collection names, return when operation is successful

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_vector = FieldSchema("float_vector", DataType.FLOAT_VECTOR, dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_vector], description="test")
        >>> collection = Collection(name="test_collection", schema=schema)
        >>> utility.list_collections()
    """
    return _get_connection(using).list_collections(timeout=timeout)


def load_balance(
    collection_name: str,
    src_node_id: int,
    dst_node_ids: Optional[List[int]] = None,
    sealed_segment_ids: Optional[List[int]] = None,
    timeout: Optional[float] = None,
    using: str = "default",
):
    """Do load balancing operation from source query node to destination query node.

    :param collection_name: The collection to balance.
    :type  collection_name: str

    :param src_node_id: The source query node id to balance.
    :type  src_node_id: int

    :param dst_node_ids: The destination query node ids to balance.
    :type  dst_node_ids: list[int]

    :param sealed_segment_ids: Sealed segment ids to balance.
    :type  sealed_segment_ids: list[int]

    :param timeout: The timeout for this method, unit: second
    :type  timeout: int

    :raises BaseException: If query nodes not exist.
    :raises BaseException: If sealed segments not exist.

    :example:
        >>> from pymilvus import connections, utility
        >>>
        >>> connections.connect()
        >>>
        >>> src_node_id = 0
        >>> dst_node_ids = [1]
        >>> sealed_segment_ids = []
        >>> res = utility.load_balance("test", src_node_id, dst_node_ids, sealed_segment_ids)
    """
    if dst_node_ids is None:
        dst_node_ids = []
    if sealed_segment_ids is None:
        sealed_segment_ids = []
    return _get_connection(using).load_balance(
        collection_name, src_node_id, dst_node_ids, sealed_segment_ids, timeout=timeout
    )


def get_query_segment_info(
    collection_name: str,
    timeout: Optional[float] = None,
    using: str = "default",
):
    """
    Notifies Proxy to return segments information from query nodes.

    :param collection_name: A string representing the collection to get segments info.
    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur.
    :type  timeout: float

    :return: QuerySegmentInfo:
        QuerySegmentInfo is the growing segments's information in query cluster.
    :rtype: QuerySegmentInfo

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> _DIM = 128
        >>> field_int64 = FieldSchema("int64", DataType.INT64, description="int64", is_primary=True)
        >>> field_vector = FieldSchema("float_vector", DataType.FLOAT_VECTOR,  dim=_DIM)
        >>> schema = CollectionSchema(fields=[field_int64, field_vector])
        >>> collection = Collection(name="test_get_segment_info", schema=schema)
        >>> import pandas as pd
        >>> int64_series = pd.Series(data=list(range(10, 20)), index=list(range(10)))i
        >>> float_vector_series = [[random.random() for _ in range _DIM] for _ in range (10)]
        >>> data = pd.DataFrame({"int64" : int64_series, "float_vector": float_vector_series})
        >>> collection.insert(data)
        >>> collection.load() # load collection to memory
        >>> res = utility.get_query_segment_info("test_get_segment_info")
    """
    return _get_connection(using).get_query_segment_info(collection_name, timeout=timeout)


def create_alias(
    collection_name: str,
    alias: str,
    timeout: Optional[float] = None,
    using: str = "default",
):
    """Specify alias for a collection.
    Alias cannot be duplicated, you can't assign the same alias to different collections.
    But you can specify multiple aliases for a collection, for example:
        before create_alias("collection_1", "bob"):
            aliases of collection_1 are ["tom"]
        after create_alias("collection_1", "bob"):
            aliases of collection_1 are ["tom", "bob"]

    :param alias: The alias of the collection.
    :type  alias: str.

    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur
    :type  timeout: float

    :raises CollectionNotExistException: If the collection does not exist.
    :raises BaseException: If the alias failed to create.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> schema = CollectionSchema([
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
        ... ])
        >>> collection = Collection("test_collection_create_alias", schema)
        >>> utility.create_alias(collection.name, "alias")
        Status(code=0, message='')
    """
    return _get_connection(using).create_alias(collection_name, alias, timeout=timeout)


def drop_alias(alias: str, timeout: Optional[float] = None, using: str = "default"):
    """Delete the alias.
    No need to provide collection name because an alias can only be assigned to one collection
    and the server knows which collection it belongs.
    For example:
        before drop_alias("bob"):
            aliases of collection_1 are ["tom", "bob"]
        after drop_alias("bob"):
            aliases of collection_1 are = ["tom"]

    :param alias: The alias to drop.
    :type  alias: str

    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur
    :type  timeout: float

    :raises CollectionNotExistException: If the collection does not exist.
    :raises BaseException: If the alias doesn't exist.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> schema = CollectionSchema([
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
        ... ])
        >>> collection = Collection("test_collection_drop_alias", schema)
        >>> utility.create_alias(collection.name, "alias")
        >>> utility.drop_alias("alias")
        Status(code=0, message='')
    """
    return _get_connection(using).drop_alias(alias, timeout=timeout)


def alter_alias(
    collection_name: str,
    alias: str,
    timeout: Optional[float] = None,
    using: str = "default",
):
    """Change the alias of a collection to another collection.
    Raise error if the alias doesn't exist.
    Alias cannot be duplicated, you can't assign same alias to different collections.
    This api can change alias owner collection, for example:
        before alter_alias("collection_2", "bob"):
            collection_1's aliases = ["bob"]
            collection_2's aliases = []
        after alter_alias("collection_2", "bob"):
            collection_1's aliases = []
            collection_2's aliases = ["bob"]

    :param collection_name: The collection name to witch this alias is goting to alter.
    :type  collection_name: str.

    :param alias: The alias of the collection.
    :type  alias: str

    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur
    :type  timeout: float

    :raises CollectionNotExistException: If the collection does not exist.
    :raises BaseException: If the alias failed to alter.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> schema = CollectionSchema([
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
        ... ])
        >>> collection = Collection("test_collection_alter_alias", schema)
        >>> utility.alter_alias(collection.name, "alias")
        if the alias exists, return Status(code=0, message='')
        otherwise return Status(code=1, message='alias does not exist')
    """
    return _get_connection(using).alter_alias(collection_name, alias, timeout=timeout)


def list_aliases(collection_name: str, timeout: Optional[float] = None, using: str = "default"):
    """Returns alias list of the collection.

    :return list of str:
        The collection aliases, returned when the operation succeeds.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> fields = [
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=128)
        ... ]
        >>> schema = CollectionSchema(fields)
        >>> collection = Collection("test_collection_list_aliases", schema)
        >>> utility.create_alias(collection.name, "tom")
        >>> utility.list_aliases(collection.name)
        ['tom']
    """
    conn = _get_connection(using)
    resp = conn.list_aliases(collection_name, timeout=timeout)
    return resp["aliases"]


def do_bulk_insert(
    collection_name: str,
    files: List[str],
    partition_name: Optional[str] = None,
    timeout: Optional[float] = None,
    using: str = "default",
    **kwargs,
) -> int:
    """do_bulk_insert inserts entities through files, currently supports row-based json file.
    User need to create the json file with a specified json format which is described in
    the official user guide.

    Let's say a collection has two fields: "id" and "vec"(dimension=8),
    the row-based json format is:

      {"rows": [
          {"id": "0", "vec": [0.190, 0.046, 0.143, 0.972, 0.592, 0.238, 0.266, 0.995]},
          {"id": "1", "vec": [0.149, 0.586, 0.012, 0.673, 0.588, 0.917, 0.949, 0.944]},
          ......
        ]
      }

    The json file must be uploaded to root path of MinIO/S3 storage which is
    accessed by milvus server. For example:

        the milvus.yml specify the MinIO/S3 storage bucketName as "a-bucket",
        user can upload his json file to a-bucket/xxx.json,
        then call do_bulk_insert(files=["a-bucket/xxx.json"])

    :param collection_name: the name of the collection
    :type  collection_name: str

    :param partition_name: the name of the partition
    :type  partition_name: str

    :param files: related path of the file to be imported, for row-based json file,
        only allow one file each invocation.
    :type  files: list[str]

    :param timeout: The timeout for this method, unit: second
    :type  timeout: int

    :param kwargs: other infos

    :return: id of the task
    :rtype:  int

    :raises BaseException: If collection_name doesn't exist.
    :raises BaseException: If the files input is illegal.

    :example:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> schema = CollectionSchema([
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=2)
        ... ])
        >>> collection = Collection("test_collection_bulk_insert", schema)
        >>> task_id = utility.do_bulk_insert(collection_name=collection.name, files=['data.json'])
        >>> print(task_id)
    """
    return _get_connection(using).do_bulk_insert(
        collection_name, partition_name, files, timeout=timeout, **kwargs
    )


def get_bulk_insert_state(
    task_id: int,
    timeout: Optional[float] = None,
    using: str = "default",
    **kwargs,
) -> BulkInsertState:
    """get_bulk_insert_state returns state of a certain task_id

    :param task_id: the task id returned by bulk_insert
    :type  task_id: int

    :return: BulkInsertState
    :rtype:  BulkInsertState

    :example:
        >>> from pymilvus import connections, utility, BulkInsertState
        >>> connections.connect()
        >>> # the id is returned by do_bulk_insert()
        >>> state = utility.get_bulk_insert_state(task_id=id)
        >>> if state.state == BulkInsertState.ImportFailed or \
        ...     state.state == BulkInsertState.ImportFailedAndCleaned:
        >>>     print("task id:", state.task_id, "failed, reason:", state.failed_reason)
    """
    return _get_connection(using).get_bulk_insert_state(task_id, timeout=timeout, **kwargs)


def list_bulk_insert_tasks(
    limit: int = 0,
    collection_name: Optional[str] = None,
    timeout: Optional[float] = None,
    using: str = "default",
    **kwargs,
) -> list:
    """list_bulk_insert_tasks lists all bulk load tasks

    :param limit: maximum number of tasks returned, list all tasks if the value is 0,
        else return the latest tasks
    :type  limit: int

    :param collection_name: target collection name, list all tasks if the name is empty
    :type  collection_name: str

    :return: list[BulkInsertState]
    :rtype:  list[BulkInsertState]

    :example:
        >>> from pymilvus import connections, utility, BulkInsertState
        >>> connections.connect()
        >>> tasks = utility.list_bulk_insert_tasks(collection_name=collection_name)
        >>> print(tasks)
    """
    return _get_connection(using).list_bulk_insert_tasks(
        limit, collection_name, timeout=timeout, **kwargs
    )


def reset_password(
    user: str,
    old_password: str,
    new_password: str,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """
        Reset the user & password of the connection.
        You must provide the original password to check if the operation is valid.
        Note: after this operation, the connection is also ready to use.

    :param user: the user of the Milvus connection.
    :type  user: str
    :param old_password: the original password of the Milvus connection.
    :type  old_password: str
    :param new_password: the newly password of this user.
    :type  new_password: str

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.reset_password(user, old_password, new_password)
        >>> users = utility.list_usernames()
        >>> print(f"users in Milvus: {users}")
    """
    return _get_connection(using).reset_password(user, old_password, new_password, timeout=timeout)


def create_user(
    user: str,
    password: str,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """Create User using the given user and password.
    :param user: the user name.
    :type  user: str
    :param password: the password.
    :type  password: str

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.create_user(user, password)
        >>> connections.connect(user=user, password=password)
        >>> users = utility.list_usernames()
        >>> print(f"users in Milvus: {users}")
    """
    return _get_connection(using).create_user(user, password, timeout=timeout)


def update_password(
    user: str,
    old_password: str,
    new_password: str,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """
        Update user password using the given user and password.
        You must provide the original password to check if the operation is valid.
        Note: after this operation, PyMilvus won't change the related header of this connection.
        So if you update credential for this connection, the connection may be invalid.

    :param user: the user name.
    :type  user: str
    :param old_password: the original password.
    :type  old_password: str
    :param new_password: the newly password of this user.
    :type  new_password: str

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.update_password(user, old_password, new_password)
        >>> connections.connect(user=user, password=new_password)
        >>> users = utility.list_usernames()
        >>> print(f"users in Milvus: {users}")
    """
    return _get_connection(using).update_password(user, old_password, new_password, timeout=timeout)


def delete_user(user: str, using: str = "default", timeout: Optional[float] = None):
    """Delete User corresponding to the username.
    :param user: the user name.
    :type  user: str

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.delete_user(user)
        >>> users = utility.list_usernames()
        >>> print(f"users in Milvus: {users}")
    """
    return _get_connection(using).delete_user(user, timeout=timeout)


def list_usernames(using: str = "default", timeout: Optional[float] = None):
    """List all usernames.
    :return list of str:
        The usernames in Milvus instances.

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> users = utility.list_usernames()
        >>> print(f"users in Milvus: {users}")
    """
    return _get_connection(using).list_usernames(timeout=timeout)


def list_roles(include_user_info: bool, using: str = "default", timeout: Optional[float] = None):
    """List All Role Info
    :param include_user_info: whether to obtain the user information associated with roles
    :type  include_user_info: bool
    :return RoleInfo

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> roles = utility.list_roles()
        >>> print(f"roles in Milvus: {roles}")
    """
    return _get_connection(using).select_all_role(include_user_info, timeout=timeout)


def list_user(
    username: str,
    include_role_info: bool,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """List One User Info
    :param username: user name.
    :type  username: str
    :param include_role_info: whether to obtain the role information associated with the user
    :type  include_role_info: bool
    :return UserInfo

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> user = utility.list_user(username, include_role_info)
        >>> print(f"user info: {user}")
    """
    return _get_connection(using).select_one_user(username, include_role_info, timeout=timeout)


def list_users(include_role_info: bool, using: str = "default", timeout: Optional[float] = None):
    """List All User Info
    :param include_role_info: whether to obtain the role information associated with users
    :type  include_role_info: bool
    :return UserInfo

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> users = utility.list_users(include_role_info)
        >>> print(f"users info: {users}")
    """
    return _get_connection(using).select_all_user(include_role_info, timeout=timeout)


def get_server_version(using: str = "default", timeout: Optional[float] = None) -> str:
    """get the running server's version

    :returns: server's version
    :rtype: str

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.get_server_version()
        >>> "2.2.0"
    """
    return _get_connection(using).get_server_version(timeout=timeout)


def create_resource_group(
    name: str, using: str = "default", timeout: Optional[float] = None, **kwargs
):
    """Create a resource group
        It will success whether or not the resource group exists.

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.create_resource_group(name)
        >>> rgs = utility.list_resource_groups()
        >>> print(f"resource groups in Milvus: {rgs}")
    """
    return _get_connection(using).create_resource_group(name, timeout, **kwargs)


def update_resource_groups(
    configs: Mapping[str, ResourceGroupConfig],
    using: str = "default",
    timeout: Optional[float] = None,
):
    """Update resource groups.
        This function updates the resource groups based on the provided configurations.

    :param configs: A mapping of resource group names to their configurations.
    :type configs: Mapping[str, ResourceGroupConfig]
    :param using: The name of the connection to use. Defaults to "default".
    :type using: (str, optional)
    :param timeout: The timeout value in seconds. Defaults to None.
    :type timeout: (float, optional)

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> configs = {
        ...     "resource_group_1": ResourceGroupConfig(
        ...         requests={"node_num": 1},
        ...         limits={"node_num": 5},
        ...         transfer_from=[{"resource_group": "resource_group_2"}],
        ...         transfer_to=[{"resource_group": "resource_group_2"}],
        ...     ),
        ...     "resource_group_2": ResourceGroupConfig(
        ...         requests={"node_num": 4},
        ...         limits={"node_num": 4},
        ...         transfer_from=[{"resource_group": "__default_resource_group"}],
        ...         transfer_to=[{"resource_group": "resource_group_1"}],
        ...     ),
        ... }
        >>> utility.update_resource_groups(configs)
    """
    return _get_connection(using).update_resource_groups(configs, timeout)


def drop_resource_group(name: str, using: str = "default", timeout: Optional[float] = None):
    """Drop a resource group
        It will success if the resource group is existed and empty, otherwise fail.

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> utility.drop_resource_group(name)
        >>> rgs = utility.list_resource_groups()
        >>> print(f"resource groups in Milvus: {rgs}")
    """
    return _get_connection(using).drop_resource_group(name, timeout)


def describe_resource_group(name: str, using: str = "default", timeout: Optional[float] = None):
    """Drop a resource group
        It will success if the resource group is existed and empty, otherwise fail.

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> rgInfo = utility.list_resource_groups(name)
        >>> print(f"resource group info: {rgInfo}")
    """
    return _get_connection(using).describe_resource_group(name, timeout)


def list_resource_groups(using: str = "default", timeout: Optional[float] = None):
    """list all resource group names

    :return: all resource group names
    :rtype: list[str]
    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> rgs = utility.list_resource_groups()
        >>> print(f"resource group names: {rgs}")
    """
    return _get_connection(using).list_resource_groups(timeout)


def transfer_node(
    source_group: str,
    target_group: str,
    num_nodes: int,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """transfer num_node from source resource group to target resource_group

    :param source_group: source resource group name
    :type source_group: str
    :param target_group: target resource group name
    :type target_group: str
    :param num_nodes: transfer node num
    :type num_nodes: int

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> rgs = utility.transfer_node(source_group, target_group, num_nodes)
    """
    return _get_connection(using).transfer_node(source_group, target_group, num_nodes, timeout)


def transfer_replica(
    source_group: str,
    target_group: str,
    collection_name: str,
    num_replicas: int,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """transfer num_replica from source resource group to target resource group

    :param source_group: source resource group name
    :type source_group: str
    :param target_group: target resource group name
    :type target_group: str
    :param collection_name: collection name which replica belong to
    :type collection_name: str
    :param num_replicas: transfer replica num
    :type num_replicas: int

    :example:
        >>> from pymilvus import connections, utility
        >>> connections.connect()
        >>> rgs = utility.transfer_replica(source, target, collection_name, num_replica)
    """
    return _get_connection(using).transfer_replica(
        source_group, target_group, collection_name, num_replicas, timeout
    )


def flush_all(using: str = "default", timeout: Optional[float] = None, **kwargs):
    """Flush all collections. All insertions, deletions, and upserts before
        `flush_all` will be synced.

    Args:
        timeout (float): an optional duration of time in seconds to allow for the RPCs.
            If timeout is not set, the client keeps waiting until the server responds or
            an error occurs.
        **kwargs (``dict``, optional):
            * *db*(``string``)
                database to flush.
            * *_async*(``bool``)
                Indicate if invoke asynchronously. Default `False`.

    Examples:
        >>> from pymilvus import Collection, FieldSchema, CollectionSchema, DataType, utility
        >>> fields = [
        ...     FieldSchema("film_id", DataType.INT64, is_primary=True),
        ...     FieldSchema("films", dtype=DataType.FLOAT_VECTOR, dim=128)
        ... ]
        >>> schema = CollectionSchema(fields=fields)
        >>> collection = Collection(name="test_collection_flush", schema=schema)
        >>> collection.insert([[1, 2], [[1.0, 2.0], [3.0, 4.0]]])
        >>> utility.flush_all(_async=False) # synchronized flush_all
        >>> # or use `future` to flush_all asynchronously
        >>> future = utility.flush_all(_async=True)
        >>> future.done() # flush_all finished
    """
    return _get_connection(using).flush_all(timeout=timeout, **kwargs)


def get_server_type(using: str = "default"):
    """Get the server type. Now, it will return "zilliz" if the connection related to
        an instance on the zilliz cloud, otherwise "milvus" will be returned.

    :param using: Alias to the connection. Default connection is used if this is not specified.
    :type  using: str

    :return: The server type.
    :rtype: str
    """
    return _get_connection(using).get_server_type()


def list_indexes(
    collection_name: str,
    using: str = "default",
    timeout: Optional[float] = None,
    **kwargs,
):
    """List all indexes of collection. If `field_name` is not specified,
        return all the indexes of this collection, otherwise this interface will return
        all indexes on this field of the collection.

    :param collection_name: The name of collection.
    :type  collection_name: str

    :param using: Alias to the connection. Default connection is used if this is not specified.
    :type  using: str

    :param timeout: An optional duration of time in seconds to allow for the RPC. When timeout
                    is set to None, client waits until server response or error occur
    :type  timeout: float/int

    :param kwargs:
        * *field_name* (``str``)
            The name of field. If no field name is specified, all indexes
            of this collection will be returned.
    :type  kwargs: dict

    :return: The name list of all indexes.
    :rtype: str list
    """
    indexes = _get_connection(using).list_indexes(collection_name, timeout, **kwargs)
    field_name = kwargs.get("field_name")
    index_name_list = []
    for index in indexes:
        if index is not None:
            if field_name is None:
                # list all indexes anyway.
                index_name_list.append(index.index_name)
            if field_name is not None and index.field_name == field_name:
                # list all indexes of this field.
                index_name_list.append(index.index_name)
    return index_name_list
