from . import common_pb2 as _common_pb2
from . import rg_pb2 as _rg_pb2
from . import schema_pb2 as _schema_pb2
from . import feder_pb2 as _feder_pb2
from . import msg_pb2 as _msg_pb2
from google.protobuf import descriptor_pb2 as _descriptor_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ShowType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    All: _ClassVar[ShowType]
    InMemory: _ClassVar[ShowType]

class OperatePrivilegeGroupType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    AddPrivilegesToGroup: _ClassVar[OperatePrivilegeGroupType]
    RemovePrivilegesFromGroup: _ClassVar[OperatePrivilegeGroupType]

class OperateUserRoleType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    AddUserToRole: _ClassVar[OperateUserRoleType]
    RemoveUserFromRole: _ClassVar[OperateUserRoleType]

class PrivilegeLevel(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    Cluster: _ClassVar[PrivilegeLevel]
    Database: _ClassVar[PrivilegeLevel]
    Collection: _ClassVar[PrivilegeLevel]

class OperatePrivilegeType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    Grant: _ClassVar[OperatePrivilegeType]
    Revoke: _ClassVar[OperatePrivilegeType]

class QuotaState(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    Unknown: _ClassVar[QuotaState]
    ReadLimited: _ClassVar[QuotaState]
    WriteLimited: _ClassVar[QuotaState]
    DenyToRead: _ClassVar[QuotaState]
    DenyToWrite: _ClassVar[QuotaState]
    DenyToDDL: _ClassVar[QuotaState]
All: ShowType
InMemory: ShowType
AddPrivilegesToGroup: OperatePrivilegeGroupType
RemovePrivilegesFromGroup: OperatePrivilegeGroupType
AddUserToRole: OperateUserRoleType
RemoveUserFromRole: OperateUserRoleType
Cluster: PrivilegeLevel
Database: PrivilegeLevel
Collection: PrivilegeLevel
Grant: OperatePrivilegeType
Revoke: OperatePrivilegeType
Unknown: QuotaState
ReadLimited: QuotaState
WriteLimited: QuotaState
DenyToRead: QuotaState
DenyToWrite: QuotaState
DenyToDDL: QuotaState
MILVUS_EXT_OBJ_FIELD_NUMBER: _ClassVar[int]
milvus_ext_obj: _descriptor.FieldDescriptor

class CreateAliasRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "alias")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    alias: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., alias: _Optional[str] = ...) -> None: ...

class DropAliasRequest(_message.Message):
    __slots__ = ("base", "db_name", "alias")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    alias: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., alias: _Optional[str] = ...) -> None: ...

class AlterAliasRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "alias")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    alias: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., alias: _Optional[str] = ...) -> None: ...

class DescribeAliasRequest(_message.Message):
    __slots__ = ("base", "db_name", "alias")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    alias: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., alias: _Optional[str] = ...) -> None: ...

class DescribeAliasResponse(_message.Message):
    __slots__ = ("status", "db_name", "alias", "collection")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    db_name: str
    alias: str
    collection: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., db_name: _Optional[str] = ..., alias: _Optional[str] = ..., collection: _Optional[str] = ...) -> None: ...

class ListAliasesRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class ListAliasesResponse(_message.Message):
    __slots__ = ("status", "db_name", "collection_name", "aliases")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    ALIASES_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    db_name: str
    collection_name: str
    aliases: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., aliases: _Optional[_Iterable[str]] = ...) -> None: ...

class CreateCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "schema", "shards_num", "consistency_level", "properties", "num_partitions")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_FIELD_NUMBER: _ClassVar[int]
    SHARDS_NUM_FIELD_NUMBER: _ClassVar[int]
    CONSISTENCY_LEVEL_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    NUM_PARTITIONS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    schema: bytes
    shards_num: int
    consistency_level: _common_pb2.ConsistencyLevel
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    num_partitions: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., schema: _Optional[bytes] = ..., shards_num: _Optional[int] = ..., consistency_level: _Optional[_Union[_common_pb2.ConsistencyLevel, str]] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., num_partitions: _Optional[int] = ...) -> None: ...

class DropCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class AlterCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "collectionID", "properties", "delete_keys")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    DELETE_KEYS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    collectionID: int
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    delete_keys: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., collectionID: _Optional[int] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., delete_keys: _Optional[_Iterable[str]] = ...) -> None: ...

class AlterCollectionFieldRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "field_name", "properties", "delete_keys")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    DELETE_KEYS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    field_name: str
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    delete_keys: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., delete_keys: _Optional[_Iterable[str]] = ...) -> None: ...

class HasCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "time_stamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    TIME_STAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    time_stamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., time_stamp: _Optional[int] = ...) -> None: ...

class BoolResponse(_message.Message):
    __slots__ = ("status", "value")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    value: bool
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., value: bool = ...) -> None: ...

class StringResponse(_message.Message):
    __slots__ = ("status", "value")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    value: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., value: _Optional[str] = ...) -> None: ...

class DescribeCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "collectionID", "time_stamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    TIME_STAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    collectionID: int
    time_stamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., collectionID: _Optional[int] = ..., time_stamp: _Optional[int] = ...) -> None: ...

class DescribeCollectionResponse(_message.Message):
    __slots__ = ("status", "schema", "collectionID", "virtual_channel_names", "physical_channel_names", "created_timestamp", "created_utc_timestamp", "shards_num", "aliases", "start_positions", "consistency_level", "collection_name", "properties", "db_name", "num_partitions", "db_id", "request_time", "update_timestamp", "update_timestamp_str")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    VIRTUAL_CHANNEL_NAMES_FIELD_NUMBER: _ClassVar[int]
    PHYSICAL_CHANNEL_NAMES_FIELD_NUMBER: _ClassVar[int]
    CREATED_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    CREATED_UTC_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    SHARDS_NUM_FIELD_NUMBER: _ClassVar[int]
    ALIASES_FIELD_NUMBER: _ClassVar[int]
    START_POSITIONS_FIELD_NUMBER: _ClassVar[int]
    CONSISTENCY_LEVEL_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    NUM_PARTITIONS_FIELD_NUMBER: _ClassVar[int]
    DB_ID_FIELD_NUMBER: _ClassVar[int]
    REQUEST_TIME_FIELD_NUMBER: _ClassVar[int]
    UPDATE_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    UPDATE_TIMESTAMP_STR_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    schema: _schema_pb2.CollectionSchema
    collectionID: int
    virtual_channel_names: _containers.RepeatedScalarFieldContainer[str]
    physical_channel_names: _containers.RepeatedScalarFieldContainer[str]
    created_timestamp: int
    created_utc_timestamp: int
    shards_num: int
    aliases: _containers.RepeatedScalarFieldContainer[str]
    start_positions: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyDataPair]
    consistency_level: _common_pb2.ConsistencyLevel
    collection_name: str
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    db_name: str
    num_partitions: int
    db_id: int
    request_time: int
    update_timestamp: int
    update_timestamp_str: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., schema: _Optional[_Union[_schema_pb2.CollectionSchema, _Mapping]] = ..., collectionID: _Optional[int] = ..., virtual_channel_names: _Optional[_Iterable[str]] = ..., physical_channel_names: _Optional[_Iterable[str]] = ..., created_timestamp: _Optional[int] = ..., created_utc_timestamp: _Optional[int] = ..., shards_num: _Optional[int] = ..., aliases: _Optional[_Iterable[str]] = ..., start_positions: _Optional[_Iterable[_Union[_common_pb2.KeyDataPair, _Mapping]]] = ..., consistency_level: _Optional[_Union[_common_pb2.ConsistencyLevel, str]] = ..., collection_name: _Optional[str] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., db_name: _Optional[str] = ..., num_partitions: _Optional[int] = ..., db_id: _Optional[int] = ..., request_time: _Optional[int] = ..., update_timestamp: _Optional[int] = ..., update_timestamp_str: _Optional[str] = ...) -> None: ...

class LoadCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "replica_number", "resource_groups", "refresh", "load_fields", "skip_load_dynamic_field", "load_params")
    class LoadParamsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    REPLICA_NUMBER_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUPS_FIELD_NUMBER: _ClassVar[int]
    REFRESH_FIELD_NUMBER: _ClassVar[int]
    LOAD_FIELDS_FIELD_NUMBER: _ClassVar[int]
    SKIP_LOAD_DYNAMIC_FIELD_FIELD_NUMBER: _ClassVar[int]
    LOAD_PARAMS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    replica_number: int
    resource_groups: _containers.RepeatedScalarFieldContainer[str]
    refresh: bool
    load_fields: _containers.RepeatedScalarFieldContainer[str]
    skip_load_dynamic_field: bool
    load_params: _containers.ScalarMap[str, str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., replica_number: _Optional[int] = ..., resource_groups: _Optional[_Iterable[str]] = ..., refresh: bool = ..., load_fields: _Optional[_Iterable[str]] = ..., skip_load_dynamic_field: bool = ..., load_params: _Optional[_Mapping[str, str]] = ...) -> None: ...

class ReleaseCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class GetStatisticsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_names", "guarantee_timestamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    GUARANTEE_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    guarantee_timestamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ..., guarantee_timestamp: _Optional[int] = ...) -> None: ...

class GetStatisticsResponse(_message.Message):
    __slots__ = ("status", "stats")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    stats: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., stats: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class GetCollectionStatisticsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class GetCollectionStatisticsResponse(_message.Message):
    __slots__ = ("status", "stats")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    stats: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., stats: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class ShowCollectionsRequest(_message.Message):
    __slots__ = ("base", "db_name", "time_stamp", "type", "collection_names")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    TIME_STAMP_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAMES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    time_stamp: int
    type: ShowType
    collection_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., time_stamp: _Optional[int] = ..., type: _Optional[_Union[ShowType, str]] = ..., collection_names: _Optional[_Iterable[str]] = ...) -> None: ...

class ShowCollectionsResponse(_message.Message):
    __slots__ = ("status", "collection_names", "collection_ids", "created_timestamps", "created_utc_timestamps", "inMemory_percentages", "query_service_available")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAMES_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_IDS_FIELD_NUMBER: _ClassVar[int]
    CREATED_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    CREATED_UTC_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    INMEMORY_PERCENTAGES_FIELD_NUMBER: _ClassVar[int]
    QUERY_SERVICE_AVAILABLE_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    collection_names: _containers.RepeatedScalarFieldContainer[str]
    collection_ids: _containers.RepeatedScalarFieldContainer[int]
    created_timestamps: _containers.RepeatedScalarFieldContainer[int]
    created_utc_timestamps: _containers.RepeatedScalarFieldContainer[int]
    inMemory_percentages: _containers.RepeatedScalarFieldContainer[int]
    query_service_available: _containers.RepeatedScalarFieldContainer[bool]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., collection_names: _Optional[_Iterable[str]] = ..., collection_ids: _Optional[_Iterable[int]] = ..., created_timestamps: _Optional[_Iterable[int]] = ..., created_utc_timestamps: _Optional[_Iterable[int]] = ..., inMemory_percentages: _Optional[_Iterable[int]] = ..., query_service_available: _Optional[_Iterable[bool]] = ...) -> None: ...

class CreatePartitionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ...) -> None: ...

class DropPartitionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ...) -> None: ...

class HasPartitionRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ...) -> None: ...

class LoadPartitionsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_names", "replica_number", "resource_groups", "refresh", "load_fields", "skip_load_dynamic_field", "load_params")
    class LoadParamsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    REPLICA_NUMBER_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUPS_FIELD_NUMBER: _ClassVar[int]
    REFRESH_FIELD_NUMBER: _ClassVar[int]
    LOAD_FIELDS_FIELD_NUMBER: _ClassVar[int]
    SKIP_LOAD_DYNAMIC_FIELD_FIELD_NUMBER: _ClassVar[int]
    LOAD_PARAMS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    replica_number: int
    resource_groups: _containers.RepeatedScalarFieldContainer[str]
    refresh: bool
    load_fields: _containers.RepeatedScalarFieldContainer[str]
    skip_load_dynamic_field: bool
    load_params: _containers.ScalarMap[str, str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ..., replica_number: _Optional[int] = ..., resource_groups: _Optional[_Iterable[str]] = ..., refresh: bool = ..., load_fields: _Optional[_Iterable[str]] = ..., skip_load_dynamic_field: bool = ..., load_params: _Optional[_Mapping[str, str]] = ...) -> None: ...

class ReleasePartitionsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_names")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ...) -> None: ...

class GetPartitionStatisticsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ...) -> None: ...

class GetPartitionStatisticsResponse(_message.Message):
    __slots__ = ("status", "stats")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    stats: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., stats: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class ShowPartitionsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "collectionID", "partition_names", "type")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    collectionID: int
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    type: ShowType
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., collectionID: _Optional[int] = ..., partition_names: _Optional[_Iterable[str]] = ..., type: _Optional[_Union[ShowType, str]] = ...) -> None: ...

class ShowPartitionsResponse(_message.Message):
    __slots__ = ("status", "partition_names", "partitionIDs", "created_timestamps", "created_utc_timestamps", "inMemory_percentages")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    PARTITIONIDS_FIELD_NUMBER: _ClassVar[int]
    CREATED_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    CREATED_UTC_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    INMEMORY_PERCENTAGES_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    partitionIDs: _containers.RepeatedScalarFieldContainer[int]
    created_timestamps: _containers.RepeatedScalarFieldContainer[int]
    created_utc_timestamps: _containers.RepeatedScalarFieldContainer[int]
    inMemory_percentages: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., partition_names: _Optional[_Iterable[str]] = ..., partitionIDs: _Optional[_Iterable[int]] = ..., created_timestamps: _Optional[_Iterable[int]] = ..., created_utc_timestamps: _Optional[_Iterable[int]] = ..., inMemory_percentages: _Optional[_Iterable[int]] = ...) -> None: ...

class DescribeSegmentRequest(_message.Message):
    __slots__ = ("base", "collectionID", "segmentID")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    SEGMENTID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collectionID: int
    segmentID: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collectionID: _Optional[int] = ..., segmentID: _Optional[int] = ...) -> None: ...

class DescribeSegmentResponse(_message.Message):
    __slots__ = ("status", "indexID", "buildID", "enable_index", "fieldID")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INDEXID_FIELD_NUMBER: _ClassVar[int]
    BUILDID_FIELD_NUMBER: _ClassVar[int]
    ENABLE_INDEX_FIELD_NUMBER: _ClassVar[int]
    FIELDID_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    indexID: int
    buildID: int
    enable_index: bool
    fieldID: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., indexID: _Optional[int] = ..., buildID: _Optional[int] = ..., enable_index: bool = ..., fieldID: _Optional[int] = ...) -> None: ...

class ShowSegmentsRequest(_message.Message):
    __slots__ = ("base", "collectionID", "partitionID")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collectionID: int
    partitionID: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ...) -> None: ...

class ShowSegmentsResponse(_message.Message):
    __slots__ = ("status", "segmentIDs")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    SEGMENTIDS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    segmentIDs: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., segmentIDs: _Optional[_Iterable[int]] = ...) -> None: ...

class CreateIndexRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "field_name", "extra_params", "index_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    EXTRA_PARAMS_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    field_name: str
    extra_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    index_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., extra_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., index_name: _Optional[str] = ...) -> None: ...

class AlterIndexRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "index_name", "extra_params", "delete_keys")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    EXTRA_PARAMS_FIELD_NUMBER: _ClassVar[int]
    DELETE_KEYS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    index_name: str
    extra_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    delete_keys: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., index_name: _Optional[str] = ..., extra_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., delete_keys: _Optional[_Iterable[str]] = ...) -> None: ...

class DescribeIndexRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "field_name", "index_name", "timestamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    field_name: str
    index_name: str
    timestamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., index_name: _Optional[str] = ..., timestamp: _Optional[int] = ...) -> None: ...

class IndexDescription(_message.Message):
    __slots__ = ("index_name", "indexID", "params", "field_name", "indexed_rows", "total_rows", "state", "index_state_fail_reason", "pending_index_rows", "min_index_version", "max_index_version")
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEXID_FIELD_NUMBER: _ClassVar[int]
    PARAMS_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEXED_ROWS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_ROWS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    INDEX_STATE_FAIL_REASON_FIELD_NUMBER: _ClassVar[int]
    PENDING_INDEX_ROWS_FIELD_NUMBER: _ClassVar[int]
    MIN_INDEX_VERSION_FIELD_NUMBER: _ClassVar[int]
    MAX_INDEX_VERSION_FIELD_NUMBER: _ClassVar[int]
    index_name: str
    indexID: int
    params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    field_name: str
    indexed_rows: int
    total_rows: int
    state: _common_pb2.IndexState
    index_state_fail_reason: str
    pending_index_rows: int
    min_index_version: int
    max_index_version: int
    def __init__(self, index_name: _Optional[str] = ..., indexID: _Optional[int] = ..., params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., field_name: _Optional[str] = ..., indexed_rows: _Optional[int] = ..., total_rows: _Optional[int] = ..., state: _Optional[_Union[_common_pb2.IndexState, str]] = ..., index_state_fail_reason: _Optional[str] = ..., pending_index_rows: _Optional[int] = ..., min_index_version: _Optional[int] = ..., max_index_version: _Optional[int] = ...) -> None: ...

class DescribeIndexResponse(_message.Message):
    __slots__ = ("status", "index_descriptions")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INDEX_DESCRIPTIONS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    index_descriptions: _containers.RepeatedCompositeFieldContainer[IndexDescription]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., index_descriptions: _Optional[_Iterable[_Union[IndexDescription, _Mapping]]] = ...) -> None: ...

class GetIndexBuildProgressRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "field_name", "index_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    field_name: str
    index_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., index_name: _Optional[str] = ...) -> None: ...

class GetIndexBuildProgressResponse(_message.Message):
    __slots__ = ("status", "indexed_rows", "total_rows")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INDEXED_ROWS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_ROWS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    indexed_rows: int
    total_rows: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., indexed_rows: _Optional[int] = ..., total_rows: _Optional[int] = ...) -> None: ...

class GetIndexStateRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "field_name", "index_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    field_name: str
    index_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., index_name: _Optional[str] = ...) -> None: ...

class GetIndexStateResponse(_message.Message):
    __slots__ = ("status", "state", "fail_reason")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    FAIL_REASON_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    state: _common_pb2.IndexState
    fail_reason: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., state: _Optional[_Union[_common_pb2.IndexState, str]] = ..., fail_reason: _Optional[str] = ...) -> None: ...

class DropIndexRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "field_name", "index_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    field_name: str
    index_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., index_name: _Optional[str] = ...) -> None: ...

class InsertRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name", "fields_data", "hash_keys", "num_rows", "schema_timestamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELDS_DATA_FIELD_NUMBER: _ClassVar[int]
    HASH_KEYS_FIELD_NUMBER: _ClassVar[int]
    NUM_ROWS_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    fields_data: _containers.RepeatedCompositeFieldContainer[_schema_pb2.FieldData]
    hash_keys: _containers.RepeatedScalarFieldContainer[int]
    num_rows: int
    schema_timestamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., fields_data: _Optional[_Iterable[_Union[_schema_pb2.FieldData, _Mapping]]] = ..., hash_keys: _Optional[_Iterable[int]] = ..., num_rows: _Optional[int] = ..., schema_timestamp: _Optional[int] = ...) -> None: ...

class UpsertRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name", "fields_data", "hash_keys", "num_rows", "schema_timestamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELDS_DATA_FIELD_NUMBER: _ClassVar[int]
    HASH_KEYS_FIELD_NUMBER: _ClassVar[int]
    NUM_ROWS_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    fields_data: _containers.RepeatedCompositeFieldContainer[_schema_pb2.FieldData]
    hash_keys: _containers.RepeatedScalarFieldContainer[int]
    num_rows: int
    schema_timestamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., fields_data: _Optional[_Iterable[_Union[_schema_pb2.FieldData, _Mapping]]] = ..., hash_keys: _Optional[_Iterable[int]] = ..., num_rows: _Optional[int] = ..., schema_timestamp: _Optional[int] = ...) -> None: ...

class MutationResult(_message.Message):
    __slots__ = ("status", "IDs", "succ_index", "err_index", "acknowledged", "insert_cnt", "delete_cnt", "upsert_cnt", "timestamp")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    IDS_FIELD_NUMBER: _ClassVar[int]
    SUCC_INDEX_FIELD_NUMBER: _ClassVar[int]
    ERR_INDEX_FIELD_NUMBER: _ClassVar[int]
    ACKNOWLEDGED_FIELD_NUMBER: _ClassVar[int]
    INSERT_CNT_FIELD_NUMBER: _ClassVar[int]
    DELETE_CNT_FIELD_NUMBER: _ClassVar[int]
    UPSERT_CNT_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    IDs: _schema_pb2.IDs
    succ_index: _containers.RepeatedScalarFieldContainer[int]
    err_index: _containers.RepeatedScalarFieldContainer[int]
    acknowledged: bool
    insert_cnt: int
    delete_cnt: int
    upsert_cnt: int
    timestamp: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., IDs: _Optional[_Union[_schema_pb2.IDs, _Mapping]] = ..., succ_index: _Optional[_Iterable[int]] = ..., err_index: _Optional[_Iterable[int]] = ..., acknowledged: bool = ..., insert_cnt: _Optional[int] = ..., delete_cnt: _Optional[int] = ..., upsert_cnt: _Optional[int] = ..., timestamp: _Optional[int] = ...) -> None: ...

class DeleteRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_name", "expr", "hash_keys", "consistency_level", "expr_template_values")
    class ExprTemplateValuesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _schema_pb2.TemplateValue
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_schema_pb2.TemplateValue, _Mapping]] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    EXPR_FIELD_NUMBER: _ClassVar[int]
    HASH_KEYS_FIELD_NUMBER: _ClassVar[int]
    CONSISTENCY_LEVEL_FIELD_NUMBER: _ClassVar[int]
    EXPR_TEMPLATE_VALUES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_name: str
    expr: str
    hash_keys: _containers.RepeatedScalarFieldContainer[int]
    consistency_level: _common_pb2.ConsistencyLevel
    expr_template_values: _containers.MessageMap[str, _schema_pb2.TemplateValue]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., expr: _Optional[str] = ..., hash_keys: _Optional[_Iterable[int]] = ..., consistency_level: _Optional[_Union[_common_pb2.ConsistencyLevel, str]] = ..., expr_template_values: _Optional[_Mapping[str, _schema_pb2.TemplateValue]] = ...) -> None: ...

class SubSearchRequest(_message.Message):
    __slots__ = ("dsl", "placeholder_group", "dsl_type", "search_params", "nq", "expr_template_values")
    class ExprTemplateValuesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _schema_pb2.TemplateValue
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_schema_pb2.TemplateValue, _Mapping]] = ...) -> None: ...
    DSL_FIELD_NUMBER: _ClassVar[int]
    PLACEHOLDER_GROUP_FIELD_NUMBER: _ClassVar[int]
    DSL_TYPE_FIELD_NUMBER: _ClassVar[int]
    SEARCH_PARAMS_FIELD_NUMBER: _ClassVar[int]
    NQ_FIELD_NUMBER: _ClassVar[int]
    EXPR_TEMPLATE_VALUES_FIELD_NUMBER: _ClassVar[int]
    dsl: str
    placeholder_group: bytes
    dsl_type: _common_pb2.DslType
    search_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    nq: int
    expr_template_values: _containers.MessageMap[str, _schema_pb2.TemplateValue]
    def __init__(self, dsl: _Optional[str] = ..., placeholder_group: _Optional[bytes] = ..., dsl_type: _Optional[_Union[_common_pb2.DslType, str]] = ..., search_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., nq: _Optional[int] = ..., expr_template_values: _Optional[_Mapping[str, _schema_pb2.TemplateValue]] = ...) -> None: ...

class SearchRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_names", "dsl", "placeholder_group", "dsl_type", "output_fields", "search_params", "travel_timestamp", "guarantee_timestamp", "nq", "not_return_all_meta", "consistency_level", "use_default_consistency", "search_by_primary_keys", "sub_reqs", "expr_template_values")
    class ExprTemplateValuesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _schema_pb2.TemplateValue
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_schema_pb2.TemplateValue, _Mapping]] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    DSL_FIELD_NUMBER: _ClassVar[int]
    PLACEHOLDER_GROUP_FIELD_NUMBER: _ClassVar[int]
    DSL_TYPE_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    SEARCH_PARAMS_FIELD_NUMBER: _ClassVar[int]
    TRAVEL_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    GUARANTEE_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    NQ_FIELD_NUMBER: _ClassVar[int]
    NOT_RETURN_ALL_META_FIELD_NUMBER: _ClassVar[int]
    CONSISTENCY_LEVEL_FIELD_NUMBER: _ClassVar[int]
    USE_DEFAULT_CONSISTENCY_FIELD_NUMBER: _ClassVar[int]
    SEARCH_BY_PRIMARY_KEYS_FIELD_NUMBER: _ClassVar[int]
    SUB_REQS_FIELD_NUMBER: _ClassVar[int]
    EXPR_TEMPLATE_VALUES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    dsl: str
    placeholder_group: bytes
    dsl_type: _common_pb2.DslType
    output_fields: _containers.RepeatedScalarFieldContainer[str]
    search_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    travel_timestamp: int
    guarantee_timestamp: int
    nq: int
    not_return_all_meta: bool
    consistency_level: _common_pb2.ConsistencyLevel
    use_default_consistency: bool
    search_by_primary_keys: bool
    sub_reqs: _containers.RepeatedCompositeFieldContainer[SubSearchRequest]
    expr_template_values: _containers.MessageMap[str, _schema_pb2.TemplateValue]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ..., dsl: _Optional[str] = ..., placeholder_group: _Optional[bytes] = ..., dsl_type: _Optional[_Union[_common_pb2.DslType, str]] = ..., output_fields: _Optional[_Iterable[str]] = ..., search_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., travel_timestamp: _Optional[int] = ..., guarantee_timestamp: _Optional[int] = ..., nq: _Optional[int] = ..., not_return_all_meta: bool = ..., consistency_level: _Optional[_Union[_common_pb2.ConsistencyLevel, str]] = ..., use_default_consistency: bool = ..., search_by_primary_keys: bool = ..., sub_reqs: _Optional[_Iterable[_Union[SubSearchRequest, _Mapping]]] = ..., expr_template_values: _Optional[_Mapping[str, _schema_pb2.TemplateValue]] = ...) -> None: ...

class Hits(_message.Message):
    __slots__ = ("IDs", "row_data", "scores")
    IDS_FIELD_NUMBER: _ClassVar[int]
    ROW_DATA_FIELD_NUMBER: _ClassVar[int]
    SCORES_FIELD_NUMBER: _ClassVar[int]
    IDs: _containers.RepeatedScalarFieldContainer[int]
    row_data: _containers.RepeatedScalarFieldContainer[bytes]
    scores: _containers.RepeatedScalarFieldContainer[float]
    def __init__(self, IDs: _Optional[_Iterable[int]] = ..., row_data: _Optional[_Iterable[bytes]] = ..., scores: _Optional[_Iterable[float]] = ...) -> None: ...

class SearchResults(_message.Message):
    __slots__ = ("status", "results", "collection_name", "session_ts")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESULTS_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    SESSION_TS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    results: _schema_pb2.SearchResultData
    collection_name: str
    session_ts: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., results: _Optional[_Union[_schema_pb2.SearchResultData, _Mapping]] = ..., collection_name: _Optional[str] = ..., session_ts: _Optional[int] = ...) -> None: ...

class HybridSearchRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "partition_names", "requests", "rank_params", "travel_timestamp", "guarantee_timestamp", "not_return_all_meta", "output_fields", "consistency_level", "use_default_consistency")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    REQUESTS_FIELD_NUMBER: _ClassVar[int]
    RANK_PARAMS_FIELD_NUMBER: _ClassVar[int]
    TRAVEL_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    GUARANTEE_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    NOT_RETURN_ALL_META_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    CONSISTENCY_LEVEL_FIELD_NUMBER: _ClassVar[int]
    USE_DEFAULT_CONSISTENCY_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    requests: _containers.RepeatedCompositeFieldContainer[SearchRequest]
    rank_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    travel_timestamp: int
    guarantee_timestamp: int
    not_return_all_meta: bool
    output_fields: _containers.RepeatedScalarFieldContainer[str]
    consistency_level: _common_pb2.ConsistencyLevel
    use_default_consistency: bool
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ..., requests: _Optional[_Iterable[_Union[SearchRequest, _Mapping]]] = ..., rank_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., travel_timestamp: _Optional[int] = ..., guarantee_timestamp: _Optional[int] = ..., not_return_all_meta: bool = ..., output_fields: _Optional[_Iterable[str]] = ..., consistency_level: _Optional[_Union[_common_pb2.ConsistencyLevel, str]] = ..., use_default_consistency: bool = ...) -> None: ...

class FlushRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_names")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAMES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_names: _Optional[_Iterable[str]] = ...) -> None: ...

class FlushResponse(_message.Message):
    __slots__ = ("status", "db_name", "coll_segIDs", "flush_coll_segIDs", "coll_seal_times", "coll_flush_ts", "channel_cps")
    class CollSegIDsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _schema_pb2.LongArray
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_schema_pb2.LongArray, _Mapping]] = ...) -> None: ...
    class FlushCollSegIDsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _schema_pb2.LongArray
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_schema_pb2.LongArray, _Mapping]] = ...) -> None: ...
    class CollSealTimesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    class CollFlushTsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    class ChannelCpsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _msg_pb2.MsgPosition
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_msg_pb2.MsgPosition, _Mapping]] = ...) -> None: ...
    STATUS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLL_SEGIDS_FIELD_NUMBER: _ClassVar[int]
    FLUSH_COLL_SEGIDS_FIELD_NUMBER: _ClassVar[int]
    COLL_SEAL_TIMES_FIELD_NUMBER: _ClassVar[int]
    COLL_FLUSH_TS_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_CPS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    db_name: str
    coll_segIDs: _containers.MessageMap[str, _schema_pb2.LongArray]
    flush_coll_segIDs: _containers.MessageMap[str, _schema_pb2.LongArray]
    coll_seal_times: _containers.ScalarMap[str, int]
    coll_flush_ts: _containers.ScalarMap[str, int]
    channel_cps: _containers.MessageMap[str, _msg_pb2.MsgPosition]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., db_name: _Optional[str] = ..., coll_segIDs: _Optional[_Mapping[str, _schema_pb2.LongArray]] = ..., flush_coll_segIDs: _Optional[_Mapping[str, _schema_pb2.LongArray]] = ..., coll_seal_times: _Optional[_Mapping[str, int]] = ..., coll_flush_ts: _Optional[_Mapping[str, int]] = ..., channel_cps: _Optional[_Mapping[str, _msg_pb2.MsgPosition]] = ...) -> None: ...

class QueryRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "expr", "output_fields", "partition_names", "travel_timestamp", "guarantee_timestamp", "query_params", "not_return_all_meta", "consistency_level", "use_default_consistency", "expr_template_values")
    class ExprTemplateValuesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _schema_pb2.TemplateValue
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_schema_pb2.TemplateValue, _Mapping]] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    EXPR_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    TRAVEL_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    GUARANTEE_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    QUERY_PARAMS_FIELD_NUMBER: _ClassVar[int]
    NOT_RETURN_ALL_META_FIELD_NUMBER: _ClassVar[int]
    CONSISTENCY_LEVEL_FIELD_NUMBER: _ClassVar[int]
    USE_DEFAULT_CONSISTENCY_FIELD_NUMBER: _ClassVar[int]
    EXPR_TEMPLATE_VALUES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    expr: str
    output_fields: _containers.RepeatedScalarFieldContainer[str]
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    travel_timestamp: int
    guarantee_timestamp: int
    query_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    not_return_all_meta: bool
    consistency_level: _common_pb2.ConsistencyLevel
    use_default_consistency: bool
    expr_template_values: _containers.MessageMap[str, _schema_pb2.TemplateValue]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., expr: _Optional[str] = ..., output_fields: _Optional[_Iterable[str]] = ..., partition_names: _Optional[_Iterable[str]] = ..., travel_timestamp: _Optional[int] = ..., guarantee_timestamp: _Optional[int] = ..., query_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., not_return_all_meta: bool = ..., consistency_level: _Optional[_Union[_common_pb2.ConsistencyLevel, str]] = ..., use_default_consistency: bool = ..., expr_template_values: _Optional[_Mapping[str, _schema_pb2.TemplateValue]] = ...) -> None: ...

class QueryResults(_message.Message):
    __slots__ = ("status", "fields_data", "collection_name", "output_fields", "session_ts", "primary_field_name")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    FIELDS_DATA_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    SESSION_TS_FIELD_NUMBER: _ClassVar[int]
    PRIMARY_FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    fields_data: _containers.RepeatedCompositeFieldContainer[_schema_pb2.FieldData]
    collection_name: str
    output_fields: _containers.RepeatedScalarFieldContainer[str]
    session_ts: int
    primary_field_name: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., fields_data: _Optional[_Iterable[_Union[_schema_pb2.FieldData, _Mapping]]] = ..., collection_name: _Optional[str] = ..., output_fields: _Optional[_Iterable[str]] = ..., session_ts: _Optional[int] = ..., primary_field_name: _Optional[str] = ...) -> None: ...

class QueryCursor(_message.Message):
    __slots__ = ("session_ts", "str_pk", "int_pk")
    SESSION_TS_FIELD_NUMBER: _ClassVar[int]
    STR_PK_FIELD_NUMBER: _ClassVar[int]
    INT_PK_FIELD_NUMBER: _ClassVar[int]
    session_ts: int
    str_pk: str
    int_pk: int
    def __init__(self, session_ts: _Optional[int] = ..., str_pk: _Optional[str] = ..., int_pk: _Optional[int] = ...) -> None: ...

class VectorIDs(_message.Message):
    __slots__ = ("collection_name", "field_name", "id_array", "partition_names")
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    ID_ARRAY_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    collection_name: str
    field_name: str
    id_array: _schema_pb2.IDs
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., id_array: _Optional[_Union[_schema_pb2.IDs, _Mapping]] = ..., partition_names: _Optional[_Iterable[str]] = ...) -> None: ...

class VectorsArray(_message.Message):
    __slots__ = ("id_array", "data_array")
    ID_ARRAY_FIELD_NUMBER: _ClassVar[int]
    DATA_ARRAY_FIELD_NUMBER: _ClassVar[int]
    id_array: VectorIDs
    data_array: _schema_pb2.VectorField
    def __init__(self, id_array: _Optional[_Union[VectorIDs, _Mapping]] = ..., data_array: _Optional[_Union[_schema_pb2.VectorField, _Mapping]] = ...) -> None: ...

class CalcDistanceRequest(_message.Message):
    __slots__ = ("base", "op_left", "op_right", "params")
    BASE_FIELD_NUMBER: _ClassVar[int]
    OP_LEFT_FIELD_NUMBER: _ClassVar[int]
    OP_RIGHT_FIELD_NUMBER: _ClassVar[int]
    PARAMS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    op_left: VectorsArray
    op_right: VectorsArray
    params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., op_left: _Optional[_Union[VectorsArray, _Mapping]] = ..., op_right: _Optional[_Union[VectorsArray, _Mapping]] = ..., params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class CalcDistanceResults(_message.Message):
    __slots__ = ("status", "int_dist", "float_dist")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INT_DIST_FIELD_NUMBER: _ClassVar[int]
    FLOAT_DIST_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    int_dist: _schema_pb2.IntArray
    float_dist: _schema_pb2.FloatArray
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., int_dist: _Optional[_Union[_schema_pb2.IntArray, _Mapping]] = ..., float_dist: _Optional[_Union[_schema_pb2.FloatArray, _Mapping]] = ...) -> None: ...

class FlushAllRequest(_message.Message):
    __slots__ = ("base", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ...) -> None: ...

class FlushAllResponse(_message.Message):
    __slots__ = ("status", "flush_all_ts")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    FLUSH_ALL_TS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    flush_all_ts: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., flush_all_ts: _Optional[int] = ...) -> None: ...

class PersistentSegmentInfo(_message.Message):
    __slots__ = ("segmentID", "collectionID", "partitionID", "num_rows", "state", "level", "is_sorted")
    SEGMENTID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    NUM_ROWS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    LEVEL_FIELD_NUMBER: _ClassVar[int]
    IS_SORTED_FIELD_NUMBER: _ClassVar[int]
    segmentID: int
    collectionID: int
    partitionID: int
    num_rows: int
    state: _common_pb2.SegmentState
    level: _common_pb2.SegmentLevel
    is_sorted: bool
    def __init__(self, segmentID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ..., num_rows: _Optional[int] = ..., state: _Optional[_Union[_common_pb2.SegmentState, str]] = ..., level: _Optional[_Union[_common_pb2.SegmentLevel, str]] = ..., is_sorted: bool = ...) -> None: ...

class GetPersistentSegmentInfoRequest(_message.Message):
    __slots__ = ("base", "dbName", "collectionName")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DBNAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONNAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    dbName: str
    collectionName: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., dbName: _Optional[str] = ..., collectionName: _Optional[str] = ...) -> None: ...

class GetPersistentSegmentInfoResponse(_message.Message):
    __slots__ = ("status", "infos")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INFOS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    infos: _containers.RepeatedCompositeFieldContainer[PersistentSegmentInfo]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., infos: _Optional[_Iterable[_Union[PersistentSegmentInfo, _Mapping]]] = ...) -> None: ...

class QuerySegmentInfo(_message.Message):
    __slots__ = ("segmentID", "collectionID", "partitionID", "mem_size", "num_rows", "index_name", "indexID", "nodeID", "state", "nodeIds", "level", "is_sorted")
    SEGMENTID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITIONID_FIELD_NUMBER: _ClassVar[int]
    MEM_SIZE_FIELD_NUMBER: _ClassVar[int]
    NUM_ROWS_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEXID_FIELD_NUMBER: _ClassVar[int]
    NODEID_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    NODEIDS_FIELD_NUMBER: _ClassVar[int]
    LEVEL_FIELD_NUMBER: _ClassVar[int]
    IS_SORTED_FIELD_NUMBER: _ClassVar[int]
    segmentID: int
    collectionID: int
    partitionID: int
    mem_size: int
    num_rows: int
    index_name: str
    indexID: int
    nodeID: int
    state: _common_pb2.SegmentState
    nodeIds: _containers.RepeatedScalarFieldContainer[int]
    level: _common_pb2.SegmentLevel
    is_sorted: bool
    def __init__(self, segmentID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partitionID: _Optional[int] = ..., mem_size: _Optional[int] = ..., num_rows: _Optional[int] = ..., index_name: _Optional[str] = ..., indexID: _Optional[int] = ..., nodeID: _Optional[int] = ..., state: _Optional[_Union[_common_pb2.SegmentState, str]] = ..., nodeIds: _Optional[_Iterable[int]] = ..., level: _Optional[_Union[_common_pb2.SegmentLevel, str]] = ..., is_sorted: bool = ...) -> None: ...

class GetQuerySegmentInfoRequest(_message.Message):
    __slots__ = ("base", "dbName", "collectionName")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DBNAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONNAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    dbName: str
    collectionName: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., dbName: _Optional[str] = ..., collectionName: _Optional[str] = ...) -> None: ...

class GetQuerySegmentInfoResponse(_message.Message):
    __slots__ = ("status", "infos")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INFOS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    infos: _containers.RepeatedCompositeFieldContainer[QuerySegmentInfo]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., infos: _Optional[_Iterable[_Union[QuerySegmentInfo, _Mapping]]] = ...) -> None: ...

class DummyRequest(_message.Message):
    __slots__ = ("request_type",)
    REQUEST_TYPE_FIELD_NUMBER: _ClassVar[int]
    request_type: str
    def __init__(self, request_type: _Optional[str] = ...) -> None: ...

class DummyResponse(_message.Message):
    __slots__ = ("response",)
    RESPONSE_FIELD_NUMBER: _ClassVar[int]
    response: str
    def __init__(self, response: _Optional[str] = ...) -> None: ...

class RegisterLinkRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class RegisterLinkResponse(_message.Message):
    __slots__ = ("address", "status")
    ADDRESS_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    address: _common_pb2.Address
    status: _common_pb2.Status
    def __init__(self, address: _Optional[_Union[_common_pb2.Address, _Mapping]] = ..., status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ...) -> None: ...

class GetMetricsRequest(_message.Message):
    __slots__ = ("base", "request")
    BASE_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    request: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., request: _Optional[str] = ...) -> None: ...

class GetMetricsResponse(_message.Message):
    __slots__ = ("status", "response", "component_name")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_FIELD_NUMBER: _ClassVar[int]
    COMPONENT_NAME_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    response: str
    component_name: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., response: _Optional[str] = ..., component_name: _Optional[str] = ...) -> None: ...

class ComponentInfo(_message.Message):
    __slots__ = ("nodeID", "role", "state_code", "extra_info")
    NODEID_FIELD_NUMBER: _ClassVar[int]
    ROLE_FIELD_NUMBER: _ClassVar[int]
    STATE_CODE_FIELD_NUMBER: _ClassVar[int]
    EXTRA_INFO_FIELD_NUMBER: _ClassVar[int]
    nodeID: int
    role: str
    state_code: _common_pb2.StateCode
    extra_info: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, nodeID: _Optional[int] = ..., role: _Optional[str] = ..., state_code: _Optional[_Union[_common_pb2.StateCode, str]] = ..., extra_info: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class ComponentStates(_message.Message):
    __slots__ = ("state", "subcomponent_states", "status")
    STATE_FIELD_NUMBER: _ClassVar[int]
    SUBCOMPONENT_STATES_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    state: ComponentInfo
    subcomponent_states: _containers.RepeatedCompositeFieldContainer[ComponentInfo]
    status: _common_pb2.Status
    def __init__(self, state: _Optional[_Union[ComponentInfo, _Mapping]] = ..., subcomponent_states: _Optional[_Iterable[_Union[ComponentInfo, _Mapping]]] = ..., status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ...) -> None: ...

class GetComponentStatesRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class LoadBalanceRequest(_message.Message):
    __slots__ = ("base", "src_nodeID", "dst_nodeIDs", "sealed_segmentIDs", "collectionName", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    SRC_NODEID_FIELD_NUMBER: _ClassVar[int]
    DST_NODEIDS_FIELD_NUMBER: _ClassVar[int]
    SEALED_SEGMENTIDS_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONNAME_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    src_nodeID: int
    dst_nodeIDs: _containers.RepeatedScalarFieldContainer[int]
    sealed_segmentIDs: _containers.RepeatedScalarFieldContainer[int]
    collectionName: str
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., src_nodeID: _Optional[int] = ..., dst_nodeIDs: _Optional[_Iterable[int]] = ..., sealed_segmentIDs: _Optional[_Iterable[int]] = ..., collectionName: _Optional[str] = ..., db_name: _Optional[str] = ...) -> None: ...

class ManualCompactionRequest(_message.Message):
    __slots__ = ("collectionID", "timetravel", "majorCompaction", "collection_name", "db_name", "partition_id", "channel", "segment_ids")
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    TIMETRAVEL_FIELD_NUMBER: _ClassVar[int]
    MAJORCOMPACTION_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_ID_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_FIELD_NUMBER: _ClassVar[int]
    SEGMENT_IDS_FIELD_NUMBER: _ClassVar[int]
    collectionID: int
    timetravel: int
    majorCompaction: bool
    collection_name: str
    db_name: str
    partition_id: int
    channel: str
    segment_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, collectionID: _Optional[int] = ..., timetravel: _Optional[int] = ..., majorCompaction: bool = ..., collection_name: _Optional[str] = ..., db_name: _Optional[str] = ..., partition_id: _Optional[int] = ..., channel: _Optional[str] = ..., segment_ids: _Optional[_Iterable[int]] = ...) -> None: ...

class ManualCompactionResponse(_message.Message):
    __slots__ = ("status", "compactionID", "compactionPlanCount")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    COMPACTIONID_FIELD_NUMBER: _ClassVar[int]
    COMPACTIONPLANCOUNT_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    compactionID: int
    compactionPlanCount: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., compactionID: _Optional[int] = ..., compactionPlanCount: _Optional[int] = ...) -> None: ...

class GetCompactionStateRequest(_message.Message):
    __slots__ = ("compactionID",)
    COMPACTIONID_FIELD_NUMBER: _ClassVar[int]
    compactionID: int
    def __init__(self, compactionID: _Optional[int] = ...) -> None: ...

class GetCompactionStateResponse(_message.Message):
    __slots__ = ("status", "state", "executingPlanNo", "timeoutPlanNo", "completedPlanNo", "failedPlanNo")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    EXECUTINGPLANNO_FIELD_NUMBER: _ClassVar[int]
    TIMEOUTPLANNO_FIELD_NUMBER: _ClassVar[int]
    COMPLETEDPLANNO_FIELD_NUMBER: _ClassVar[int]
    FAILEDPLANNO_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    state: _common_pb2.CompactionState
    executingPlanNo: int
    timeoutPlanNo: int
    completedPlanNo: int
    failedPlanNo: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., state: _Optional[_Union[_common_pb2.CompactionState, str]] = ..., executingPlanNo: _Optional[int] = ..., timeoutPlanNo: _Optional[int] = ..., completedPlanNo: _Optional[int] = ..., failedPlanNo: _Optional[int] = ...) -> None: ...

class GetCompactionPlansRequest(_message.Message):
    __slots__ = ("compactionID",)
    COMPACTIONID_FIELD_NUMBER: _ClassVar[int]
    compactionID: int
    def __init__(self, compactionID: _Optional[int] = ...) -> None: ...

class GetCompactionPlansResponse(_message.Message):
    __slots__ = ("status", "state", "mergeInfos")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    MERGEINFOS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    state: _common_pb2.CompactionState
    mergeInfos: _containers.RepeatedCompositeFieldContainer[CompactionMergeInfo]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., state: _Optional[_Union[_common_pb2.CompactionState, str]] = ..., mergeInfos: _Optional[_Iterable[_Union[CompactionMergeInfo, _Mapping]]] = ...) -> None: ...

class CompactionMergeInfo(_message.Message):
    __slots__ = ("sources", "target")
    SOURCES_FIELD_NUMBER: _ClassVar[int]
    TARGET_FIELD_NUMBER: _ClassVar[int]
    sources: _containers.RepeatedScalarFieldContainer[int]
    target: int
    def __init__(self, sources: _Optional[_Iterable[int]] = ..., target: _Optional[int] = ...) -> None: ...

class GetFlushStateRequest(_message.Message):
    __slots__ = ("segmentIDs", "flush_ts", "db_name", "collection_name")
    SEGMENTIDS_FIELD_NUMBER: _ClassVar[int]
    FLUSH_TS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    segmentIDs: _containers.RepeatedScalarFieldContainer[int]
    flush_ts: int
    db_name: str
    collection_name: str
    def __init__(self, segmentIDs: _Optional[_Iterable[int]] = ..., flush_ts: _Optional[int] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class GetFlushStateResponse(_message.Message):
    __slots__ = ("status", "flushed")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    FLUSHED_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    flushed: bool
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., flushed: bool = ...) -> None: ...

class GetFlushAllStateRequest(_message.Message):
    __slots__ = ("base", "flush_all_ts", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    FLUSH_ALL_TS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    flush_all_ts: int
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., flush_all_ts: _Optional[int] = ..., db_name: _Optional[str] = ...) -> None: ...

class GetFlushAllStateResponse(_message.Message):
    __slots__ = ("status", "flushed")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    FLUSHED_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    flushed: bool
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., flushed: bool = ...) -> None: ...

class ImportRequest(_message.Message):
    __slots__ = ("collection_name", "partition_name", "channel_names", "row_based", "files", "options", "db_name", "clustering_info")
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_NAMES_FIELD_NUMBER: _ClassVar[int]
    ROW_BASED_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    OPTIONS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    CLUSTERING_INFO_FIELD_NUMBER: _ClassVar[int]
    collection_name: str
    partition_name: str
    channel_names: _containers.RepeatedScalarFieldContainer[str]
    row_based: bool
    files: _containers.RepeatedScalarFieldContainer[str]
    options: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    db_name: str
    clustering_info: bytes
    def __init__(self, collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ..., channel_names: _Optional[_Iterable[str]] = ..., row_based: bool = ..., files: _Optional[_Iterable[str]] = ..., options: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., db_name: _Optional[str] = ..., clustering_info: _Optional[bytes] = ...) -> None: ...

class ImportResponse(_message.Message):
    __slots__ = ("status", "tasks")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    TASKS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    tasks: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., tasks: _Optional[_Iterable[int]] = ...) -> None: ...

class GetImportStateRequest(_message.Message):
    __slots__ = ("task",)
    TASK_FIELD_NUMBER: _ClassVar[int]
    task: int
    def __init__(self, task: _Optional[int] = ...) -> None: ...

class GetImportStateResponse(_message.Message):
    __slots__ = ("status", "state", "row_count", "id_list", "infos", "id", "collection_id", "segment_ids", "create_ts")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    ROW_COUNT_FIELD_NUMBER: _ClassVar[int]
    ID_LIST_FIELD_NUMBER: _ClassVar[int]
    INFOS_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_ID_FIELD_NUMBER: _ClassVar[int]
    SEGMENT_IDS_FIELD_NUMBER: _ClassVar[int]
    CREATE_TS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    state: _common_pb2.ImportState
    row_count: int
    id_list: _containers.RepeatedScalarFieldContainer[int]
    infos: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    id: int
    collection_id: int
    segment_ids: _containers.RepeatedScalarFieldContainer[int]
    create_ts: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., state: _Optional[_Union[_common_pb2.ImportState, str]] = ..., row_count: _Optional[int] = ..., id_list: _Optional[_Iterable[int]] = ..., infos: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., id: _Optional[int] = ..., collection_id: _Optional[int] = ..., segment_ids: _Optional[_Iterable[int]] = ..., create_ts: _Optional[int] = ...) -> None: ...

class ListImportTasksRequest(_message.Message):
    __slots__ = ("collection_name", "limit", "db_name")
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    collection_name: str
    limit: int
    db_name: str
    def __init__(self, collection_name: _Optional[str] = ..., limit: _Optional[int] = ..., db_name: _Optional[str] = ...) -> None: ...

class ListImportTasksResponse(_message.Message):
    __slots__ = ("status", "tasks")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    TASKS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    tasks: _containers.RepeatedCompositeFieldContainer[GetImportStateResponse]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., tasks: _Optional[_Iterable[_Union[GetImportStateResponse, _Mapping]]] = ...) -> None: ...

class GetReplicasRequest(_message.Message):
    __slots__ = ("base", "collectionID", "with_shard_nodes", "collection_name", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    WITH_SHARD_NODES_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collectionID: int
    with_shard_nodes: bool
    collection_name: str
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collectionID: _Optional[int] = ..., with_shard_nodes: bool = ..., collection_name: _Optional[str] = ..., db_name: _Optional[str] = ...) -> None: ...

class GetReplicasResponse(_message.Message):
    __slots__ = ("status", "replicas")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    REPLICAS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    replicas: _containers.RepeatedCompositeFieldContainer[ReplicaInfo]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., replicas: _Optional[_Iterable[_Union[ReplicaInfo, _Mapping]]] = ...) -> None: ...

class ReplicaInfo(_message.Message):
    __slots__ = ("replicaID", "collectionID", "partition_ids", "shard_replicas", "node_ids", "resource_group_name", "num_outbound_node")
    class NumOutboundNodeEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    REPLICAID_FIELD_NUMBER: _ClassVar[int]
    COLLECTIONID_FIELD_NUMBER: _ClassVar[int]
    PARTITION_IDS_FIELD_NUMBER: _ClassVar[int]
    SHARD_REPLICAS_FIELD_NUMBER: _ClassVar[int]
    NODE_IDS_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    NUM_OUTBOUND_NODE_FIELD_NUMBER: _ClassVar[int]
    replicaID: int
    collectionID: int
    partition_ids: _containers.RepeatedScalarFieldContainer[int]
    shard_replicas: _containers.RepeatedCompositeFieldContainer[ShardReplica]
    node_ids: _containers.RepeatedScalarFieldContainer[int]
    resource_group_name: str
    num_outbound_node: _containers.ScalarMap[str, int]
    def __init__(self, replicaID: _Optional[int] = ..., collectionID: _Optional[int] = ..., partition_ids: _Optional[_Iterable[int]] = ..., shard_replicas: _Optional[_Iterable[_Union[ShardReplica, _Mapping]]] = ..., node_ids: _Optional[_Iterable[int]] = ..., resource_group_name: _Optional[str] = ..., num_outbound_node: _Optional[_Mapping[str, int]] = ...) -> None: ...

class ShardReplica(_message.Message):
    __slots__ = ("leaderID", "leader_addr", "dm_channel_name", "node_ids")
    LEADERID_FIELD_NUMBER: _ClassVar[int]
    LEADER_ADDR_FIELD_NUMBER: _ClassVar[int]
    DM_CHANNEL_NAME_FIELD_NUMBER: _ClassVar[int]
    NODE_IDS_FIELD_NUMBER: _ClassVar[int]
    leaderID: int
    leader_addr: str
    dm_channel_name: str
    node_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, leaderID: _Optional[int] = ..., leader_addr: _Optional[str] = ..., dm_channel_name: _Optional[str] = ..., node_ids: _Optional[_Iterable[int]] = ...) -> None: ...

class CreateCredentialRequest(_message.Message):
    __slots__ = ("base", "username", "password", "created_utc_timestamps", "modified_utc_timestamps")
    BASE_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    PASSWORD_FIELD_NUMBER: _ClassVar[int]
    CREATED_UTC_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    MODIFIED_UTC_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    username: str
    password: str
    created_utc_timestamps: int
    modified_utc_timestamps: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., created_utc_timestamps: _Optional[int] = ..., modified_utc_timestamps: _Optional[int] = ...) -> None: ...

class UpdateCredentialRequest(_message.Message):
    __slots__ = ("base", "username", "oldPassword", "newPassword", "created_utc_timestamps", "modified_utc_timestamps")
    BASE_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    OLDPASSWORD_FIELD_NUMBER: _ClassVar[int]
    NEWPASSWORD_FIELD_NUMBER: _ClassVar[int]
    CREATED_UTC_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    MODIFIED_UTC_TIMESTAMPS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    username: str
    oldPassword: str
    newPassword: str
    created_utc_timestamps: int
    modified_utc_timestamps: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., username: _Optional[str] = ..., oldPassword: _Optional[str] = ..., newPassword: _Optional[str] = ..., created_utc_timestamps: _Optional[int] = ..., modified_utc_timestamps: _Optional[int] = ...) -> None: ...

class DeleteCredentialRequest(_message.Message):
    __slots__ = ("base", "username")
    BASE_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    username: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., username: _Optional[str] = ...) -> None: ...

class ListCredUsersResponse(_message.Message):
    __slots__ = ("status", "usernames")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    USERNAMES_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    usernames: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., usernames: _Optional[_Iterable[str]] = ...) -> None: ...

class ListCredUsersRequest(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class RoleEntity(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class UserEntity(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class CreateRoleRequest(_message.Message):
    __slots__ = ("base", "entity")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ENTITY_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    entity: RoleEntity
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., entity: _Optional[_Union[RoleEntity, _Mapping]] = ...) -> None: ...

class DropRoleRequest(_message.Message):
    __slots__ = ("base", "role_name", "force_drop")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ROLE_NAME_FIELD_NUMBER: _ClassVar[int]
    FORCE_DROP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    role_name: str
    force_drop: bool
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., role_name: _Optional[str] = ..., force_drop: bool = ...) -> None: ...

class CreatePrivilegeGroupRequest(_message.Message):
    __slots__ = ("base", "group_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    GROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    group_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., group_name: _Optional[str] = ...) -> None: ...

class DropPrivilegeGroupRequest(_message.Message):
    __slots__ = ("base", "group_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    GROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    group_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., group_name: _Optional[str] = ...) -> None: ...

class ListPrivilegeGroupsRequest(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class ListPrivilegeGroupsResponse(_message.Message):
    __slots__ = ("status", "privilege_groups")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    PRIVILEGE_GROUPS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    privilege_groups: _containers.RepeatedCompositeFieldContainer[PrivilegeGroupInfo]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., privilege_groups: _Optional[_Iterable[_Union[PrivilegeGroupInfo, _Mapping]]] = ...) -> None: ...

class OperatePrivilegeGroupRequest(_message.Message):
    __slots__ = ("base", "group_name", "privileges", "type")
    BASE_FIELD_NUMBER: _ClassVar[int]
    GROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    PRIVILEGES_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    group_name: str
    privileges: _containers.RepeatedCompositeFieldContainer[PrivilegeEntity]
    type: OperatePrivilegeGroupType
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., group_name: _Optional[str] = ..., privileges: _Optional[_Iterable[_Union[PrivilegeEntity, _Mapping]]] = ..., type: _Optional[_Union[OperatePrivilegeGroupType, str]] = ...) -> None: ...

class OperateUserRoleRequest(_message.Message):
    __slots__ = ("base", "username", "role_name", "type")
    BASE_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    ROLE_NAME_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    username: str
    role_name: str
    type: OperateUserRoleType
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., username: _Optional[str] = ..., role_name: _Optional[str] = ..., type: _Optional[_Union[OperateUserRoleType, str]] = ...) -> None: ...

class PrivilegeGroupInfo(_message.Message):
    __slots__ = ("group_name", "privileges")
    GROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    PRIVILEGES_FIELD_NUMBER: _ClassVar[int]
    group_name: str
    privileges: _containers.RepeatedCompositeFieldContainer[PrivilegeEntity]
    def __init__(self, group_name: _Optional[str] = ..., privileges: _Optional[_Iterable[_Union[PrivilegeEntity, _Mapping]]] = ...) -> None: ...

class SelectRoleRequest(_message.Message):
    __slots__ = ("base", "role", "include_user_info")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ROLE_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_USER_INFO_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    role: RoleEntity
    include_user_info: bool
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., role: _Optional[_Union[RoleEntity, _Mapping]] = ..., include_user_info: bool = ...) -> None: ...

class RoleResult(_message.Message):
    __slots__ = ("role", "users")
    ROLE_FIELD_NUMBER: _ClassVar[int]
    USERS_FIELD_NUMBER: _ClassVar[int]
    role: RoleEntity
    users: _containers.RepeatedCompositeFieldContainer[UserEntity]
    def __init__(self, role: _Optional[_Union[RoleEntity, _Mapping]] = ..., users: _Optional[_Iterable[_Union[UserEntity, _Mapping]]] = ...) -> None: ...

class SelectRoleResponse(_message.Message):
    __slots__ = ("status", "results")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESULTS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    results: _containers.RepeatedCompositeFieldContainer[RoleResult]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., results: _Optional[_Iterable[_Union[RoleResult, _Mapping]]] = ...) -> None: ...

class SelectUserRequest(_message.Message):
    __slots__ = ("base", "user", "include_role_info")
    BASE_FIELD_NUMBER: _ClassVar[int]
    USER_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_ROLE_INFO_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    user: UserEntity
    include_role_info: bool
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., user: _Optional[_Union[UserEntity, _Mapping]] = ..., include_role_info: bool = ...) -> None: ...

class UserResult(_message.Message):
    __slots__ = ("user", "roles")
    USER_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    user: UserEntity
    roles: _containers.RepeatedCompositeFieldContainer[RoleEntity]
    def __init__(self, user: _Optional[_Union[UserEntity, _Mapping]] = ..., roles: _Optional[_Iterable[_Union[RoleEntity, _Mapping]]] = ...) -> None: ...

class SelectUserResponse(_message.Message):
    __slots__ = ("status", "results")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESULTS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    results: _containers.RepeatedCompositeFieldContainer[UserResult]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., results: _Optional[_Iterable[_Union[UserResult, _Mapping]]] = ...) -> None: ...

class ObjectEntity(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class PrivilegeEntity(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class GrantorEntity(_message.Message):
    __slots__ = ("user", "privilege")
    USER_FIELD_NUMBER: _ClassVar[int]
    PRIVILEGE_FIELD_NUMBER: _ClassVar[int]
    user: UserEntity
    privilege: PrivilegeEntity
    def __init__(self, user: _Optional[_Union[UserEntity, _Mapping]] = ..., privilege: _Optional[_Union[PrivilegeEntity, _Mapping]] = ...) -> None: ...

class GrantPrivilegeEntity(_message.Message):
    __slots__ = ("entities",)
    ENTITIES_FIELD_NUMBER: _ClassVar[int]
    entities: _containers.RepeatedCompositeFieldContainer[GrantorEntity]
    def __init__(self, entities: _Optional[_Iterable[_Union[GrantorEntity, _Mapping]]] = ...) -> None: ...

class GrantEntity(_message.Message):
    __slots__ = ("role", "object", "object_name", "grantor", "db_name")
    ROLE_FIELD_NUMBER: _ClassVar[int]
    OBJECT_FIELD_NUMBER: _ClassVar[int]
    OBJECT_NAME_FIELD_NUMBER: _ClassVar[int]
    GRANTOR_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    role: RoleEntity
    object: ObjectEntity
    object_name: str
    grantor: GrantorEntity
    db_name: str
    def __init__(self, role: _Optional[_Union[RoleEntity, _Mapping]] = ..., object: _Optional[_Union[ObjectEntity, _Mapping]] = ..., object_name: _Optional[str] = ..., grantor: _Optional[_Union[GrantorEntity, _Mapping]] = ..., db_name: _Optional[str] = ...) -> None: ...

class SelectGrantRequest(_message.Message):
    __slots__ = ("base", "entity")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ENTITY_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    entity: GrantEntity
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., entity: _Optional[_Union[GrantEntity, _Mapping]] = ...) -> None: ...

class SelectGrantResponse(_message.Message):
    __slots__ = ("status", "entities")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    ENTITIES_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    entities: _containers.RepeatedCompositeFieldContainer[GrantEntity]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., entities: _Optional[_Iterable[_Union[GrantEntity, _Mapping]]] = ...) -> None: ...

class OperatePrivilegeRequest(_message.Message):
    __slots__ = ("base", "entity", "type", "version")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ENTITY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    entity: GrantEntity
    type: OperatePrivilegeType
    version: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., entity: _Optional[_Union[GrantEntity, _Mapping]] = ..., type: _Optional[_Union[OperatePrivilegeType, str]] = ..., version: _Optional[str] = ...) -> None: ...

class OperatePrivilegeV2Request(_message.Message):
    __slots__ = ("base", "role", "grantor", "type", "db_name", "collection_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ROLE_FIELD_NUMBER: _ClassVar[int]
    GRANTOR_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    role: RoleEntity
    grantor: GrantorEntity
    type: OperatePrivilegeType
    db_name: str
    collection_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., role: _Optional[_Union[RoleEntity, _Mapping]] = ..., grantor: _Optional[_Union[GrantorEntity, _Mapping]] = ..., type: _Optional[_Union[OperatePrivilegeType, str]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class UserInfo(_message.Message):
    __slots__ = ("user", "password", "roles")
    USER_FIELD_NUMBER: _ClassVar[int]
    PASSWORD_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    user: str
    password: str
    roles: _containers.RepeatedCompositeFieldContainer[RoleEntity]
    def __init__(self, user: _Optional[str] = ..., password: _Optional[str] = ..., roles: _Optional[_Iterable[_Union[RoleEntity, _Mapping]]] = ...) -> None: ...

class RBACMeta(_message.Message):
    __slots__ = ("users", "roles", "grants", "privilege_groups")
    USERS_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    GRANTS_FIELD_NUMBER: _ClassVar[int]
    PRIVILEGE_GROUPS_FIELD_NUMBER: _ClassVar[int]
    users: _containers.RepeatedCompositeFieldContainer[UserInfo]
    roles: _containers.RepeatedCompositeFieldContainer[RoleEntity]
    grants: _containers.RepeatedCompositeFieldContainer[GrantEntity]
    privilege_groups: _containers.RepeatedCompositeFieldContainer[PrivilegeGroupInfo]
    def __init__(self, users: _Optional[_Iterable[_Union[UserInfo, _Mapping]]] = ..., roles: _Optional[_Iterable[_Union[RoleEntity, _Mapping]]] = ..., grants: _Optional[_Iterable[_Union[GrantEntity, _Mapping]]] = ..., privilege_groups: _Optional[_Iterable[_Union[PrivilegeGroupInfo, _Mapping]]] = ...) -> None: ...

class BackupRBACMetaRequest(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class BackupRBACMetaResponse(_message.Message):
    __slots__ = ("status", "RBAC_meta")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RBAC_META_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    RBAC_meta: RBACMeta
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., RBAC_meta: _Optional[_Union[RBACMeta, _Mapping]] = ...) -> None: ...

class RestoreRBACMetaRequest(_message.Message):
    __slots__ = ("base", "RBAC_meta")
    BASE_FIELD_NUMBER: _ClassVar[int]
    RBAC_META_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    RBAC_meta: RBACMeta
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., RBAC_meta: _Optional[_Union[RBACMeta, _Mapping]] = ...) -> None: ...

class GetLoadingProgressRequest(_message.Message):
    __slots__ = ("base", "collection_name", "partition_names", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ..., db_name: _Optional[str] = ...) -> None: ...

class GetLoadingProgressResponse(_message.Message):
    __slots__ = ("status", "progress", "refresh_progress")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    PROGRESS_FIELD_NUMBER: _ClassVar[int]
    REFRESH_PROGRESS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    progress: int
    refresh_progress: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., progress: _Optional[int] = ..., refresh_progress: _Optional[int] = ...) -> None: ...

class GetLoadStateRequest(_message.Message):
    __slots__ = ("base", "collection_name", "partition_names", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAMES_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collection_name: str
    partition_names: _containers.RepeatedScalarFieldContainer[str]
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collection_name: _Optional[str] = ..., partition_names: _Optional[_Iterable[str]] = ..., db_name: _Optional[str] = ...) -> None: ...

class GetLoadStateResponse(_message.Message):
    __slots__ = ("status", "state")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    state: _common_pb2.LoadState
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., state: _Optional[_Union[_common_pb2.LoadState, str]] = ...) -> None: ...

class MilvusExt(_message.Message):
    __slots__ = ("version",)
    VERSION_FIELD_NUMBER: _ClassVar[int]
    version: str
    def __init__(self, version: _Optional[str] = ...) -> None: ...

class GetVersionRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class GetVersionResponse(_message.Message):
    __slots__ = ("status", "version")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    version: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., version: _Optional[str] = ...) -> None: ...

class CheckHealthRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class CheckHealthResponse(_message.Message):
    __slots__ = ("status", "isHealthy", "reasons", "quota_states")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    ISHEALTHY_FIELD_NUMBER: _ClassVar[int]
    REASONS_FIELD_NUMBER: _ClassVar[int]
    QUOTA_STATES_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    isHealthy: bool
    reasons: _containers.RepeatedScalarFieldContainer[str]
    quota_states: _containers.RepeatedScalarFieldContainer[QuotaState]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., isHealthy: bool = ..., reasons: _Optional[_Iterable[str]] = ..., quota_states: _Optional[_Iterable[_Union[QuotaState, str]]] = ...) -> None: ...

class CreateResourceGroupRequest(_message.Message):
    __slots__ = ("base", "resource_group", "config")
    BASE_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    resource_group: str
    config: _rg_pb2.ResourceGroupConfig
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., resource_group: _Optional[str] = ..., config: _Optional[_Union[_rg_pb2.ResourceGroupConfig, _Mapping]] = ...) -> None: ...

class UpdateResourceGroupsRequest(_message.Message):
    __slots__ = ("base", "resource_groups")
    class ResourceGroupsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _rg_pb2.ResourceGroupConfig
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_rg_pb2.ResourceGroupConfig, _Mapping]] = ...) -> None: ...
    BASE_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUPS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    resource_groups: _containers.MessageMap[str, _rg_pb2.ResourceGroupConfig]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., resource_groups: _Optional[_Mapping[str, _rg_pb2.ResourceGroupConfig]] = ...) -> None: ...

class DropResourceGroupRequest(_message.Message):
    __slots__ = ("base", "resource_group")
    BASE_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    resource_group: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., resource_group: _Optional[str] = ...) -> None: ...

class TransferNodeRequest(_message.Message):
    __slots__ = ("base", "source_resource_group", "target_resource_group", "num_node")
    BASE_FIELD_NUMBER: _ClassVar[int]
    SOURCE_RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    TARGET_RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    NUM_NODE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    source_resource_group: str
    target_resource_group: str
    num_node: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., source_resource_group: _Optional[str] = ..., target_resource_group: _Optional[str] = ..., num_node: _Optional[int] = ...) -> None: ...

class TransferReplicaRequest(_message.Message):
    __slots__ = ("base", "source_resource_group", "target_resource_group", "collection_name", "num_replica", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    SOURCE_RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    TARGET_RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    NUM_REPLICA_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    source_resource_group: str
    target_resource_group: str
    collection_name: str
    num_replica: int
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., source_resource_group: _Optional[str] = ..., target_resource_group: _Optional[str] = ..., collection_name: _Optional[str] = ..., num_replica: _Optional[int] = ..., db_name: _Optional[str] = ...) -> None: ...

class ListResourceGroupsRequest(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class ListResourceGroupsResponse(_message.Message):
    __slots__ = ("status", "resource_groups")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUPS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    resource_groups: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., resource_groups: _Optional[_Iterable[str]] = ...) -> None: ...

class DescribeResourceGroupRequest(_message.Message):
    __slots__ = ("base", "resource_group")
    BASE_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    resource_group: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., resource_group: _Optional[str] = ...) -> None: ...

class DescribeResourceGroupResponse(_message.Message):
    __slots__ = ("status", "resource_group")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_GROUP_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    resource_group: ResourceGroup
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., resource_group: _Optional[_Union[ResourceGroup, _Mapping]] = ...) -> None: ...

class ResourceGroup(_message.Message):
    __slots__ = ("name", "capacity", "num_available_node", "num_loaded_replica", "num_outgoing_node", "num_incoming_node", "config", "nodes")
    class NumLoadedReplicaEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    class NumOutgoingNodeEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    class NumIncomingNodeEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CAPACITY_FIELD_NUMBER: _ClassVar[int]
    NUM_AVAILABLE_NODE_FIELD_NUMBER: _ClassVar[int]
    NUM_LOADED_REPLICA_FIELD_NUMBER: _ClassVar[int]
    NUM_OUTGOING_NODE_FIELD_NUMBER: _ClassVar[int]
    NUM_INCOMING_NODE_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    NODES_FIELD_NUMBER: _ClassVar[int]
    name: str
    capacity: int
    num_available_node: int
    num_loaded_replica: _containers.ScalarMap[str, int]
    num_outgoing_node: _containers.ScalarMap[str, int]
    num_incoming_node: _containers.ScalarMap[str, int]
    config: _rg_pb2.ResourceGroupConfig
    nodes: _containers.RepeatedCompositeFieldContainer[_common_pb2.NodeInfo]
    def __init__(self, name: _Optional[str] = ..., capacity: _Optional[int] = ..., num_available_node: _Optional[int] = ..., num_loaded_replica: _Optional[_Mapping[str, int]] = ..., num_outgoing_node: _Optional[_Mapping[str, int]] = ..., num_incoming_node: _Optional[_Mapping[str, int]] = ..., config: _Optional[_Union[_rg_pb2.ResourceGroupConfig, _Mapping]] = ..., nodes: _Optional[_Iterable[_Union[_common_pb2.NodeInfo, _Mapping]]] = ...) -> None: ...

class RenameCollectionRequest(_message.Message):
    __slots__ = ("base", "db_name", "oldName", "newName", "newDBName")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    OLDNAME_FIELD_NUMBER: _ClassVar[int]
    NEWNAME_FIELD_NUMBER: _ClassVar[int]
    NEWDBNAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    oldName: str
    newName: str
    newDBName: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., oldName: _Optional[str] = ..., newName: _Optional[str] = ..., newDBName: _Optional[str] = ...) -> None: ...

class GetIndexStatisticsRequest(_message.Message):
    __slots__ = ("base", "db_name", "collection_name", "index_name", "timestamp")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    collection_name: str
    index_name: str
    timestamp: int
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., index_name: _Optional[str] = ..., timestamp: _Optional[int] = ...) -> None: ...

class GetIndexStatisticsResponse(_message.Message):
    __slots__ = ("status", "index_descriptions")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INDEX_DESCRIPTIONS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    index_descriptions: _containers.RepeatedCompositeFieldContainer[IndexDescription]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., index_descriptions: _Optional[_Iterable[_Union[IndexDescription, _Mapping]]] = ...) -> None: ...

class ConnectRequest(_message.Message):
    __slots__ = ("base", "client_info")
    BASE_FIELD_NUMBER: _ClassVar[int]
    CLIENT_INFO_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    client_info: _common_pb2.ClientInfo
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., client_info: _Optional[_Union[_common_pb2.ClientInfo, _Mapping]] = ...) -> None: ...

class ConnectResponse(_message.Message):
    __slots__ = ("status", "server_info", "identifier")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    SERVER_INFO_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIER_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    server_info: _common_pb2.ServerInfo
    identifier: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., server_info: _Optional[_Union[_common_pb2.ServerInfo, _Mapping]] = ..., identifier: _Optional[int] = ...) -> None: ...

class AllocTimestampRequest(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class AllocTimestampResponse(_message.Message):
    __slots__ = ("status", "timestamp")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    timestamp: int
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., timestamp: _Optional[int] = ...) -> None: ...

class CreateDatabaseRequest(_message.Message):
    __slots__ = ("base", "db_name", "properties")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class DropDatabaseRequest(_message.Message):
    __slots__ = ("base", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ...) -> None: ...

class ListDatabasesRequest(_message.Message):
    __slots__ = ("base",)
    BASE_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ...) -> None: ...

class ListDatabasesResponse(_message.Message):
    __slots__ = ("status", "db_names", "created_timestamp", "db_ids")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    DB_NAMES_FIELD_NUMBER: _ClassVar[int]
    CREATED_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    DB_IDS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    db_names: _containers.RepeatedScalarFieldContainer[str]
    created_timestamp: _containers.RepeatedScalarFieldContainer[int]
    db_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., db_names: _Optional[_Iterable[str]] = ..., created_timestamp: _Optional[_Iterable[int]] = ..., db_ids: _Optional[_Iterable[int]] = ...) -> None: ...

class AlterDatabaseRequest(_message.Message):
    __slots__ = ("base", "db_name", "db_id", "properties", "delete_keys")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    DB_ID_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    DELETE_KEYS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    db_id: str
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    delete_keys: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ..., db_id: _Optional[str] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ..., delete_keys: _Optional[_Iterable[str]] = ...) -> None: ...

class DescribeDatabaseRequest(_message.Message):
    __slots__ = ("base", "db_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    db_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., db_name: _Optional[str] = ...) -> None: ...

class DescribeDatabaseResponse(_message.Message):
    __slots__ = ("status", "db_name", "dbID", "created_timestamp", "properties")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    DBID_FIELD_NUMBER: _ClassVar[int]
    CREATED_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    PROPERTIES_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    db_name: str
    dbID: int
    created_timestamp: int
    properties: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., db_name: _Optional[str] = ..., dbID: _Optional[int] = ..., created_timestamp: _Optional[int] = ..., properties: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...

class ReplicateMessageRequest(_message.Message):
    __slots__ = ("base", "channel_name", "BeginTs", "EndTs", "Msgs", "StartPositions", "EndPositions")
    BASE_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_NAME_FIELD_NUMBER: _ClassVar[int]
    BEGINTS_FIELD_NUMBER: _ClassVar[int]
    ENDTS_FIELD_NUMBER: _ClassVar[int]
    MSGS_FIELD_NUMBER: _ClassVar[int]
    STARTPOSITIONS_FIELD_NUMBER: _ClassVar[int]
    ENDPOSITIONS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    channel_name: str
    BeginTs: int
    EndTs: int
    Msgs: _containers.RepeatedScalarFieldContainer[bytes]
    StartPositions: _containers.RepeatedCompositeFieldContainer[_msg_pb2.MsgPosition]
    EndPositions: _containers.RepeatedCompositeFieldContainer[_msg_pb2.MsgPosition]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., channel_name: _Optional[str] = ..., BeginTs: _Optional[int] = ..., EndTs: _Optional[int] = ..., Msgs: _Optional[_Iterable[bytes]] = ..., StartPositions: _Optional[_Iterable[_Union[_msg_pb2.MsgPosition, _Mapping]]] = ..., EndPositions: _Optional[_Iterable[_Union[_msg_pb2.MsgPosition, _Mapping]]] = ...) -> None: ...

class ReplicateMessageResponse(_message.Message):
    __slots__ = ("status", "position")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    POSITION_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    position: str
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., position: _Optional[str] = ...) -> None: ...

class ImportAuthPlaceholder(_message.Message):
    __slots__ = ("db_name", "collection_name", "partition_name")
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    PARTITION_NAME_FIELD_NUMBER: _ClassVar[int]
    db_name: str
    collection_name: str
    partition_name: str
    def __init__(self, db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., partition_name: _Optional[str] = ...) -> None: ...

class GetImportProgressAuthPlaceholder(_message.Message):
    __slots__ = ("db_name",)
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    db_name: str
    def __init__(self, db_name: _Optional[str] = ...) -> None: ...

class ListImportsAuthPlaceholder(_message.Message):
    __slots__ = ("db_name", "collection_name")
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    db_name: str
    collection_name: str
    def __init__(self, db_name: _Optional[str] = ..., collection_name: _Optional[str] = ...) -> None: ...

class RunAnalyzerRequest(_message.Message):
    __slots__ = ("base", "analyzer_params", "placeholder", "with_detail", "with_hash", "db_name", "collection_name", "field_name", "analyzer_names")
    BASE_FIELD_NUMBER: _ClassVar[int]
    ANALYZER_PARAMS_FIELD_NUMBER: _ClassVar[int]
    PLACEHOLDER_FIELD_NUMBER: _ClassVar[int]
    WITH_DETAIL_FIELD_NUMBER: _ClassVar[int]
    WITH_HASH_FIELD_NUMBER: _ClassVar[int]
    DB_NAME_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    FIELD_NAME_FIELD_NUMBER: _ClassVar[int]
    ANALYZER_NAMES_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    analyzer_params: str
    placeholder: _containers.RepeatedScalarFieldContainer[bytes]
    with_detail: bool
    with_hash: bool
    db_name: str
    collection_name: str
    field_name: str
    analyzer_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., analyzer_params: _Optional[str] = ..., placeholder: _Optional[_Iterable[bytes]] = ..., with_detail: bool = ..., with_hash: bool = ..., db_name: _Optional[str] = ..., collection_name: _Optional[str] = ..., field_name: _Optional[str] = ..., analyzer_names: _Optional[_Iterable[str]] = ...) -> None: ...

class AnalyzerToken(_message.Message):
    __slots__ = ("token", "start_offset", "end_offset", "position", "position_length", "hash")
    TOKEN_FIELD_NUMBER: _ClassVar[int]
    START_OFFSET_FIELD_NUMBER: _ClassVar[int]
    END_OFFSET_FIELD_NUMBER: _ClassVar[int]
    POSITION_FIELD_NUMBER: _ClassVar[int]
    POSITION_LENGTH_FIELD_NUMBER: _ClassVar[int]
    HASH_FIELD_NUMBER: _ClassVar[int]
    token: str
    start_offset: int
    end_offset: int
    position: int
    position_length: int
    hash: int
    def __init__(self, token: _Optional[str] = ..., start_offset: _Optional[int] = ..., end_offset: _Optional[int] = ..., position: _Optional[int] = ..., position_length: _Optional[int] = ..., hash: _Optional[int] = ...) -> None: ...

class AnalyzerResult(_message.Message):
    __slots__ = ("tokens",)
    TOKENS_FIELD_NUMBER: _ClassVar[int]
    tokens: _containers.RepeatedCompositeFieldContainer[AnalyzerToken]
    def __init__(self, tokens: _Optional[_Iterable[_Union[AnalyzerToken, _Mapping]]] = ...) -> None: ...

class RunAnalyzerResponse(_message.Message):
    __slots__ = ("status", "results")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    RESULTS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    results: _containers.RepeatedCompositeFieldContainer[AnalyzerResult]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., results: _Optional[_Iterable[_Union[AnalyzerResult, _Mapping]]] = ...) -> None: ...
