from typing import (
    Any,
    Callable,
    Dict,
    Iterator,
    IO,
    Optional,
    Union,
    Tuple,
    Generic,
    TypeVar,
)
from .io.json_decoder import AvroJSONDecoder
from .types import AvroMessage, Schema

T = TypeVar("T")

class file_reader(Generic[T]):
    decoder: Union[IO, AvroJSONDecoder]
    return_record_name: bool
    metadata: Dict[str, str]
    codec: str
    reader_schema: Optional[Schema]
    writer_schema: Schema
    _header: Dict[str, Any]
    def __init__(
        self,
        fo_or_decoder: Union[IO, AvroJSONDecoder],
        reader_schema: Optional[Schema] = ...,
        options: Dict = ...,
    ): ...
    def __iter__(self) -> Iterator[T]: ...
    def __next__(self) -> T: ...

class reader(file_reader[AvroMessage]):
    def __init__(
        self,
        fo: Union[IO, AvroJSONDecoder],
        reader_schema: Optional[Schema] = ...,
        return_record_name: bool = ...,
        return_record_name_override: bool = ...,
        handle_unicode_errors: str = ...,
    ): ...

class block_reader(file_reader[Block]):
    def __init__(
        self,
        fo: IO,
        reader_schema: Optional[Schema] = ...,
        return_record_name: bool = ...,
        return_record_name_override: bool = ...,
        handle_unicode_errors: str = ...,
    ): ...

class Block:
    num_records: int
    writer_schema: Dict
    reader_schema: Dict
    offset: int
    size: int
    def __init__(
        self,
        bytes_: bytes,
        num_records: int,
        codec: str,
        reader_schema: Dict,
        writer_schema: Dict,
        offset: int,
        size: int,
        options: Dict,
    ): ...
    def __iter__(self) -> Iterator[AvroMessage]: ...
    def __str__(self) -> str: ...

def schemaless_reader(
    fo: IO,
    writer_schema: Schema,
    reader_schema: Optional[Schema],
    return_record_name: bool = ...,
    return_record_name_override: bool = ...,
    handle_unicode_errors: str = ...,
) -> AvroMessage: ...
def is_avro(path_or_buffer: Union[str, IO]) -> bool: ...

BLOCK_READERS: Dict[str, Callable]
