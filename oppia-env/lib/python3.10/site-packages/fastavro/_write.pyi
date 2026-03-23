from typing import Callable, Dict, IO, Iterable, Optional, Union, Any
from .io.binary_encoder import BinaryEncoder
from .io.json_encoder import AvroJSONEncoder
from .types import AvroMessage, Schema

def writer(
    fo: Union[IO, AvroJSONEncoder],
    schema: Schema,
    records: Iterable[Any],
    codec: str = ...,
    sync_interval: int = ...,
    metadata: Optional[Dict[str, str]] = ...,
    validator: bool = ...,
    sync_marker: bytes = ...,
    codec_compression_level: Optional[int] = ...,
    *,
    strict: bool = ...,
    strict_allow_default: bool = ...,
    disable_tuple_notation: bool = ...,
) -> None: ...

class GenericWriter:
    schema: Schema
    validate_fn: Optional[Callable]
    metadata: Dict

class Writer(GenericWriter):
    encoder: BinaryEncoder
    io: BinaryEncoder
    block_count: int
    sync_interval: int
    compression_level: Optional[int]
    block_writer: Callable
    def __init__(
        self,
        fo: Union[IO, BinaryEncoder],
        schema: Schema,
        codec: str = ...,
        sync_interval: int = ...,
        metadata: Optional[Dict[str, str]] = ...,
        validator: bool = ...,
        sync_marker: bytes = ...,
        compression_level: Optional[int] = ...,
        options: Dict[str, bool] = ...,
    ): ...
    def dump(self) -> None: ...
    def write(self, record: AvroMessage) -> None: ...
    def write_block(self, block) -> None: ...  # type: ignore  # Should be a read.Block
    def flush(self) -> None: ...

def schemaless_writer(
    fo: IO,
    schema: Schema,
    record: Any,
    *,
    strict: bool = ...,
    strict_allow_default: bool = ...,
    disable_tuple_notation: bool = ...,
) -> None: ...
