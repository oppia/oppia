try:
    from . import _read
except ImportError:
    from . import _read_py as _read  # type: ignore

from . import json_read
from . import logical_readers
from . import _read_common

# Private API
HEADER_SCHEMA = _read_common.HEADER_SCHEMA
SYNC_SIZE = _read_common.SYNC_SIZE
MAGIC = _read_common.MAGIC
BLOCK_READERS = _read.BLOCK_READERS

# Public API
reader = iter_avro = _read.reader
block_reader = _read.block_reader
schemaless_reader = _read.schemaless_reader
json_reader = json_read.json_reader
is_avro = _read.is_avro
LOGICAL_READERS = logical_readers.LOGICAL_READERS
SchemaResolutionError = _read_common.SchemaResolutionError

__all__ = [
    "reader",
    "schemaless_reader",
    "is_avro",
    "block_reader",
    "SchemaResolutionError",
    "LOGICAL_READERS",
]
