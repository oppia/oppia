from . import common_pb2 as _common_pb2
from . import schema_pb2 as _schema_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class InsertDataVersion(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    RowBased: _ClassVar[InsertDataVersion]
    ColumnBased: _ClassVar[InsertDataVersion]
RowBased: InsertDataVersion
ColumnBased: InsertDataVersion

class InsertRequest(_message.Message):
    __slots__ = ("base", "shardName", "db_name", "collection_name", "partition_name", "dbID", "collectionID", "partitionID", "segmentID", "timestamps", "rowIDs", "row_data", "fields_data", "num_rows", "version")
    BASE_FIELD_NUMBER: _ClassVar[int]
    SHARDNAME_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    SEGMENTID_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    ROWIDS_FIELD_NUMBER: _ClassVar[int]
    ROW_DATA_FIELD_NUMBER: _ClassVar[int]
    FIELDS_DATA_FIELD_NUMBER: _ClassVar[int]
    NUM_ROWS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    shardName: str
    db_name: str
    collection_name: str
    partition_name: str
    dbID: int
    collectionID: int
    partitionID: int
    segmentID: int
    timestamps: _containers.RepeatedScalarFieldContainer[int]
    rowIDs: _containers.RepeatedScalarFieldContainer[int]
    row_data: _containers.RepeatedCompositeFieldContainer[_common_pb2.Blob]
    fields_data: _containers.RepeatedCompositeFieldContainer[_schema_pb2.FieldData]
    num_rows: int
    version: InsertDataVersion
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., shardName: _Optional[str] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., dbID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ..., segmentID: _Optional[int] = ..., timestamps: _Optional[_Iterable[int]] = ..., rowIDs: _Optional[_Iterable[int]] = ..., row_data: _Optional[_Iterable[_Union[_common_pb2.Blob, _Mapping]]] = ..., fields_data: _Optional[_Iterable[_Union[_schema_pb2.FieldData, _Mapping]]] = ..., num_rows: _Optional[int] = ..., version: _Optional[_Union[InsertDataVersion, str]] = ...) -> None: ...

class DeleteRequest(_message.Message):
    __slots__ = ("base", "shardName", "db_name", "collection_name", "partition_name", "dbID", "collectionID", "partitionID", "int64_primary_keys", "timestamps", "num_rows", "primary_keys", "segment_id")
    BASE_FIELD_NUMBER: _ClassVar[int]
    SHARDNAME_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    INT64_PRIMARY_KEYS_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    NUM_ROWS_FIELD_NUMBER: _ClassVar[int]
    PRIMARY_KEYS_FIELD_NUMBER: _ClassVar[int]
    SEGMENT_ID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    shardName: str
    db_name: str
    collection_name: str
    partition_name: str
    dbID: int
    collectionID: int
    partitionID: int
    int64_primary_keys: _containers.RepeatedScalarFieldContainer[int]
    timestamps: _containers.RepeatedScalarFieldContainer[int]
    num_rows: int
    primary_keys: _schema_pb2.IDs
    segment_id: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., shardName: _Optional[str] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., dbID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ..., int64_primary_keys: _Optional[_Iterable[int]] = ..., timestamps: _Optional[_Iterable[int]] = ..., num_rows: _Optional[int] = ..., primary_keys: _Optional[_Union[_schema_pb2.IDs, _Mapping]] = ..., segment_id: _Optional[int] = ...) -> None: ...

class MsgPosition(_message.Message):
    __slots__ = ("channel_name", "msgID", "msgGroup", "timestamp")
    CHANNEL_NAME_FIELD_NUMBER: _ClassVar[int]
    MSGID_FIELD_NUMBER: _ClassVar[int]
    MSGGROUP_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    channel_name: str
    msgID: bytes
    msgGroup: str
    timestamp: int
    def __init__(self, channel_name: _Optional[str] = ..., msgID: _Optional[bytes] = ..., msgGroup: _Optional[str] = ..., timestamp: _Optional[int] = ...) -> None: ...

class CreateCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collectionName", "partitionName", "dbID", "collectionID", "partitionID", "schema", "virtualChannelNames", "physicalChannelNames", "partitionIDs")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONNAME_FIELD_NUMBER: _ClassVar[int]
    PARTITIONNAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_FIELD_NUMBER: _ClassVar[int]
    VIRTUALCHANNELNAMES_FIELD_NUMBER: _ClassVar[int]
    PHYSICALCHANNELNAMES_FIELD_NUMBER: _ClassVar[int]
    PARTITIONIDS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collectionName: str
    partitionName: str
    dbID: int
    collectionID: int
    partitionID: int
    schema: bytes
    virtualChannelNames: _containers.RepeatedScalarFieldContainer[str]
    physicalChannelNames: _containers.RepeatedScalarFieldContainer[str]
    partitionIDs: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collectionName: _Optional[str] = ..., partitionName: _Optional[str] = ..., dbID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ..., schema: _Optional[bytes] = ..., virtualChannelNames: _Optional[_Iterable[str]] = ..., physicalChannelNames: _Optional[_Iterable[str]] = ..., partitionIDs: _Optional[_Iterable[int]] = ...) -> None: ...

class DropCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collectionName", "dbID", "collectionID")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONNAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collectionName: str
    dbID: int
    collectionID: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collectionName: _Optional[str] = ..., dbID: _Optional[int] = ..., collectionID: _Optional[int] = ...) -> None: ...

class CreatePartitionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name", "dbID", "collectionID", "partitionID")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    dbID: int
    collectionID: int
    partitionID: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., dbID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ...) -> None: ...

class DropPartitionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name", "dbID", "collectionID", "partitionID")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    dbID: int
    collectionID: int
    partitionID: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., dbID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ...) -> None: ...

class TimeTickMsg(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class DataNodeTtMsg(_message.Message):
    __slots__ = ("base", "channel_name", "timestamp", "segments_stats")
    BASE_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_NAME_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    SEGMENTS_STATS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    channel_name: str
    timestamp: int
    segments_stats: _containers.RepeatedCompositeFieldContainer[_common_pb2.SegmentStats]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., channel_name: _Optional[str] = ..., timestamp: _Optional[int] = ..., segments_stats: _Optional[_Iterable[_Union[_common_pb2.SegmentStats, _Mapping]]] = ...) -> None: ...

class ReplicateMsg(_message.Message):
    __slots__ = ("base", "is_end", "is_cluster", "database", "collection")
    BASE_FIELD_NUMBER: _ClassVar[int]
    IS_END_FIELD_NUMBER: _ClassVar[int]
    IS_CLUSTER_FIELD_NUMBER: _ClassVar[int]
    DATABASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    is_end: bool
    is_cluster: bool
    database: str
    collection: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., is_end: bool = ..., is_cluster: bool = ..., database: _Optional[str] = ..., collection: _Optional[str] = ...) -> None: ...

class ImportFile(_message.Message):
    __slots__ = ("id", "paths")
    ID_FIELD_NUMBER: _ClassVar[int]
    PATHS_FIELD_NUMBER: _ClassVar[int]
    id: int
    paths: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, id: _Optional[int] = ..., paths: _Optional[_Iterable[str]] = ...) -> None: ...

class ImportMsg(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "collectionID", "partitionIDs", "options", "files", "schema", "jobID")
    class OptionsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONIDS_FIELD_NUMBER: _ClassVar[int]
    OPTIONS_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_FIELD_NUMBER: _ClassVar[int]
    JOBID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    collectionID: int
    partitionIDs: _containers.RepeatedScalarFieldContainer[int]
    options: _containers.ScalarMap[str, str]
    files: _containers.RepeatedCompositeFieldContainer[ImportFile]
    schema: _schema_pb2.CollectionSchema
    jobID: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., collectionID: _Optional[int] = ..., partitionIDs: _Optional[_Iterable[int]] = ..., options: _Optional[_Mapping[str, str]] = ..., files: _Optional[_Iterable[_Union[ImportFile, _Mapping]]] = ..., schema: _Optional[_Union[_schema_pb2.CollectionSchema, _Mapping]] = ..., jobID: _Optional[int] = ...) -> None: ...
