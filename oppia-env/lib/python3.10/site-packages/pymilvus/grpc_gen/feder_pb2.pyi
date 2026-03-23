from . import common_pb2 as _common_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SegmentIndexData(_message.Message):
    __slots__ = ("segmentID", "index_data")
    SEGMENTID_FIELD_NUMBER: _ClassVar[int]
    INDEX_DATA_FIELD_NUMBER: _ClassVar[int]
    segmentID: int
    index_data: str
    def __init__(self, segmentID: _Optional[int] = ..., index_data: _Optional[str] = ...) -> None: ...

class FederSegmentSearchResult(_message.Message):
    __slots__ = ("segmentID", "visit_info")
    SEGMENTID_FIELD_NUMBER: _ClassVar[int]
    VISIT_INFO_FIELD_NUMBER: _ClassVar[int]
    segmentID: int
    visit_info: str
    def __init__(self, segmentID: _Optional[int] = ..., visit_info: _Optional[str] = ...) -> None: ...

class ListIndexedSegmentRequest(_message.Message):
    __slots__ = ("base", "collection_name", "index_name")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collection_name: str
    index_name: str
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collection_name: _Optional[str] = ..., index_name: _Optional[str] = ...) -> None: ...

class ListIndexedSegmentResponse(_message.Message):
    __slots__ = ("status", "segmentIDs")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    SEGMENTIDS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    segmentIDs: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., segmentIDs: _Optional[_Iterable[int]] = ...) -> None: ...

class DescribeSegmentIndexDataRequest(_message.Message):
    __slots__ = ("base", "collection_name", "index_name", "segmentsIDs")
    BASE_FIELD_NUMBER: _ClassVar[int]
    COLLECTION_NAME_FIELD_NUMBER: _ClassVar[int]
    INDEX_NAME_FIELD_NUMBER: _ClassVar[int]
    SEGMENTSIDS_FIELD_NUMBER: _ClassVar[int]
    base: _common_pb2.MsgBase
    collection_name: str
    index_name: str
    segmentsIDs: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, base: _Optional[_Union[_common_pb2.MsgBase, _Mapping]] = ..., collection_name: _Optional[str] = ..., index_name: _Optional[str] = ..., segmentsIDs: _Optional[_Iterable[int]] = ...) -> None: ...

class DescribeSegmentIndexDataResponse(_message.Message):
    __slots__ = ("status", "index_data", "index_params")
    class IndexDataEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: int
        value: SegmentIndexData
        def __init__(self, key: _Optional[int] = ..., value: _Optional[_Union[SegmentIndexData, _Mapping]] = ...) -> None: ...
    STATUS_FIELD_NUMBER: _ClassVar[int]
    INDEX_DATA_FIELD_NUMBER: _ClassVar[int]
    INDEX_PARAMS_FIELD_NUMBER: _ClassVar[int]
    status: _common_pb2.Status
    index_data: _containers.MessageMap[int, SegmentIndexData]
    index_params: _containers.RepeatedCompositeFieldContainer[_common_pb2.KeyValuePair]
    def __init__(self, status: _Optional[_Union[_common_pb2.Status, _Mapping]] = ..., index_data: _Optional[_Mapping[int, SegmentIndexData]] = ..., index_params: _Optional[_Iterable[_Union[_common_pb2.KeyValuePair, _Mapping]]] = ...) -> None: ...
