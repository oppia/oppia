"""Python code for reading AVRO files"""

# This code is a modified version of the code at
# http://svn.apache.org/viewvc/avro/trunk/lang/py/src/avro/ which is under
# Apache 2.0 license (http://www.apache.org/licenses/LICENSE-2.0)

import bz2
import json
import lzma
import zlib
from datetime import datetime, timezone
from decimal import Context
from io import BytesIO
from struct import error as StructError
from typing import IO, Union, Optional, Generic, TypeVar, Iterator, Dict
from warnings import warn

from .io.binary_decoder import BinaryDecoder
from .io.json_decoder import AvroJSONDecoder
from .logical_readers import LOGICAL_READERS
from .schema import (
    extract_record_type,
    is_single_record_union,
    is_single_name_union,
    extract_logical_type,
    parse_schema,
)
from .types import Schema, AvroMessage, NamedSchemas
from ._read_common import (
    SchemaResolutionError,
    MAGIC,
    SYNC_SIZE,
    HEADER_SCHEMA,
    missing_codec_lib,
)
from .const import NAMED_TYPES, AVRO_TYPES

T = TypeVar("T")

decimal_context = Context()
epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
epoch_naive = datetime(1970, 1, 1)


def _default_named_schemas() -> Dict[str, NamedSchemas]:
    return {"writer": {}, "reader": {}}


def match_types(writer_type, reader_type, named_schemas):
    if isinstance(writer_type, list) or isinstance(reader_type, list):
        return True
    if isinstance(writer_type, dict) or isinstance(reader_type, dict):
        try:
            return match_schemas(writer_type, reader_type, named_schemas)
        except SchemaResolutionError:
            return False
    if writer_type == reader_type:
        return True
    # promotion cases
    elif writer_type == "int" and reader_type in ["long", "float", "double"]:
        return True
    elif writer_type == "long" and reader_type in ["float", "double"]:
        return True
    elif writer_type == "float" and reader_type == "double":
        return True
    elif writer_type == "string" and reader_type == "bytes":
        return True
    elif writer_type == "bytes" and reader_type == "string":
        return True
    writer_schema = named_schemas["writer"].get(writer_type)
    reader_schema = named_schemas["reader"].get(reader_type)
    if writer_schema is not None and reader_schema is not None:
        return match_types(writer_schema, reader_schema, named_schemas)
    return False


def match_schemas(w_schema, r_schema, named_schemas):
    error_msg = f"Schema mismatch: {w_schema} is not {r_schema}"
    if isinstance(w_schema, list):
        # If the writer is a union, checks will happen in read_union after the
        # correct schema is known
        return r_schema
    elif isinstance(r_schema, list):
        # If the reader is a union, ensure one of the new schemas is the same
        # as the writer
        for schema in r_schema:
            if match_types(w_schema, schema, named_schemas):
                return schema
        else:
            raise SchemaResolutionError(error_msg)
    else:
        # Check for dicts as primitive types are just strings
        if isinstance(w_schema, dict):
            w_type = w_schema["type"]
        else:
            w_type = w_schema
        if isinstance(r_schema, dict):
            r_type = r_schema["type"]
        else:
            r_type = r_schema

        if w_type == r_type == "map":
            if match_types(w_schema["values"], r_schema["values"], named_schemas):
                return r_schema
        elif w_type == r_type == "array":
            if match_types(w_schema["items"], r_schema["items"], named_schemas):
                return r_schema
        elif w_type in NAMED_TYPES and r_type in NAMED_TYPES:
            if w_type == r_type == "fixed" and w_schema["size"] != r_schema["size"]:
                raise SchemaResolutionError(
                    f"Schema mismatch: {w_schema} size is different than {r_schema} size"
                )

            w_unqual_name = w_schema["name"].split(".")[-1]
            r_unqual_name = r_schema["name"].split(".")[-1]
            r_aliases = r_schema.get("aliases", [])
            if (
                w_unqual_name == r_unqual_name
                or w_schema["name"] in r_aliases
                or w_unqual_name in r_aliases
            ):
                return r_schema
        elif w_type not in AVRO_TYPES and r_type in NAMED_TYPES:
            if match_types(w_type, r_schema["name"], named_schemas):
                return r_schema["name"]
        elif match_types(w_type, r_type, named_schemas):
            return r_schema
        raise SchemaResolutionError(error_msg)


def read_null(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_null()


def skip_null(decoder, writer_schema=None, named_schemas=None):
    decoder.read_null()


def read_boolean(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_boolean()


def skip_boolean(decoder, writer_schema=None, named_schemas=None):
    decoder.read_boolean()


def read_int(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_int()


def skip_int(decoder, writer_schema=None, named_schemas=None):
    decoder.read_int()


def read_long(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_long()


def skip_long(decoder, writer_schema=None, named_schemas=None):
    decoder.read_long()


def read_float(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_float()


def skip_float(decoder, writer_schema=None, named_schemas=None):
    decoder.read_float()


def read_double(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_double()


def skip_double(decoder, writer_schema=None, named_schemas=None):
    decoder.read_double()


def read_bytes(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_bytes()


def skip_bytes(decoder, writer_schema=None, named_schemas=None):
    decoder.read_bytes()


def read_utf8(
    decoder,
    writer_schema=None,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    return decoder.read_utf8(
        handle_unicode_errors=options.get("handle_unicode_errors", "strict")
    )


def skip_utf8(decoder, writer_schema=None, named_schemas=None):
    decoder.read_utf8()


def read_fixed(
    decoder,
    writer_schema,
    named_schemas=None,
    reader_schema=None,
    options={},
):
    size = writer_schema["size"]
    return decoder.read_fixed(size)


def skip_fixed(decoder, writer_schema, named_schemas=None):
    size = writer_schema["size"]
    decoder.read_fixed(size)


def read_enum(
    decoder,
    writer_schema,
    named_schemas,
    reader_schema=None,
    options={},
):
    symbol = writer_schema["symbols"][decoder.read_enum()]
    if reader_schema and symbol not in reader_schema["symbols"]:
        default = reader_schema.get("default")
        if default:
            return default
        else:
            symlist = reader_schema["symbols"]
            msg = f"{symbol} not found in reader symbol list {reader_schema['name']}, known symbols: {symlist}"
            raise SchemaResolutionError(msg)
    return symbol


def skip_enum(decoder, writer_schema, named_schemas):
    decoder.read_enum()


def read_array(
    decoder,
    writer_schema,
    named_schemas,
    reader_schema=None,
    options={},
):
    if reader_schema:

        def item_reader(decoder, w_schema, r_schema, options):
            return read_data(
                decoder,
                w_schema["items"],
                named_schemas,
                r_schema["items"],
                options,
            )

    else:

        def item_reader(decoder, w_schema, r_schema, options):
            return read_data(
                decoder,
                w_schema["items"],
                named_schemas,
                None,
                options,
            )

    read_items = []

    decoder.read_array_start()

    for item in decoder.iter_array():
        read_items.append(
            item_reader(
                decoder,
                writer_schema,
                reader_schema,
                options,
            )
        )

    decoder.read_array_end()

    return read_items


def skip_array(decoder, writer_schema, named_schemas):
    decoder.read_array_start()

    for item in decoder.iter_array():
        skip_data(decoder, writer_schema["items"], named_schemas)

    decoder.read_array_end()


def read_map(
    decoder,
    writer_schema,
    named_schemas,
    reader_schema=None,
    options={},
):
    if reader_schema:

        def item_reader(decoder, w_schema, r_schema):
            return read_data(
                decoder,
                w_schema["values"],
                named_schemas,
                r_schema["values"],
                options,
            )

    else:

        def item_reader(decoder, w_schema, r_schema):
            return read_data(
                decoder,
                w_schema["values"],
                named_schemas,
                None,
                options,
            )

    read_items = {}

    decoder.read_map_start()

    for item in decoder.iter_map():
        key = decoder.read_utf8()
        read_items[key] = item_reader(decoder, writer_schema, reader_schema)

    decoder.read_map_end()

    return read_items


def skip_map(decoder, writer_schema, named_schemas):
    decoder.read_map_start()

    for item in decoder.iter_map():
        decoder.read_utf8()
        skip_data(decoder, writer_schema["values"], named_schemas)

    decoder.read_map_end()


def read_union(
    decoder,
    writer_schema,
    named_schemas,
    reader_schema=None,
    options={},
):
    # schema resolution
    index = decoder.read_index()
    idx_schema = writer_schema[index]
    idx_reader_schema = None

    if reader_schema:
        msg = f"schema mismatch: {writer_schema} not found in {reader_schema}"
        # Handle case where the reader schema is just a single type (not union)
        if not isinstance(reader_schema, list):
            if match_types(idx_schema, reader_schema, named_schemas):
                result = read_data(
                    decoder,
                    idx_schema,
                    named_schemas,
                    reader_schema,
                    options,
                )
            else:
                raise SchemaResolutionError(msg)
        else:
            for schema in reader_schema:
                if match_types(idx_schema, schema, named_schemas):
                    idx_reader_schema = schema
                    result = read_data(
                        decoder,
                        idx_schema,
                        named_schemas,
                        schema,
                        options,
                    )
                    break
            else:
                raise SchemaResolutionError(msg)
    else:
        result = read_data(decoder, idx_schema, named_schemas, None, options)

    return_record_name_override = options.get("return_record_name_override")
    return_record_name = options.get("return_record_name")
    return_named_type_override = options.get("return_named_type_override")
    return_named_type = options.get("return_named_type")
    if return_named_type_override and is_single_name_union(writer_schema):
        return result
    elif return_named_type and extract_record_type(idx_schema) in NAMED_TYPES:
        schema_name = (
            idx_reader_schema["name"] if idx_reader_schema else idx_schema["name"]
        )
        return (schema_name, result)
    elif return_named_type and extract_record_type(idx_schema) not in AVRO_TYPES:
        # idx_schema is a named type
        schema_name = (
            named_schemas["reader"][idx_reader_schema]["name"]
            if idx_reader_schema
            else named_schemas["writer"][idx_schema]["name"]
        )
        return (schema_name, result)
    elif return_record_name_override and is_single_record_union(writer_schema):
        return result
    elif return_record_name and extract_record_type(idx_schema) == "record":
        schema_name = (
            idx_reader_schema["name"] if idx_reader_schema else idx_schema["name"]
        )
        return (schema_name, result)
    elif return_record_name and extract_record_type(idx_schema) not in AVRO_TYPES:
        # idx_schema is a named type
        schema_name = (
            named_schemas["reader"][idx_reader_schema]["name"]
            if idx_reader_schema
            else named_schemas["writer"][idx_schema]["name"]
        )
        return (schema_name, result)
    else:
        return result


def skip_union(decoder, writer_schema, named_schemas):
    # schema resolution
    index = decoder.read_index()
    skip_data(decoder, writer_schema[index], named_schemas)


def read_record(
    decoder,
    writer_schema,
    named_schemas,
    reader_schema=None,
    options={},
):
    """A record is encoded by encoding the values of its fields in the order
    that they are declared. In other words, a record is encoded as just the
    concatenation of the encodings of its fields.  Field values are encoded per
    their schema.

    Schema Resolution:
     * the ordering of fields may be different: fields are matched by name.
     * schemas for fields with the same name in both records are resolved
         recursively.
     * if the writer's record contains a field with a name not present in the
         reader's record, the writer's value for that field is ignored.
     * if the reader's record schema has a field that contains a default value,
         and writer's schema does not have a field with the same name, then the
         reader should use the default value from its field.
     * if the reader's record schema has a field with no default value, and
         writer's schema does not have a field with the same name, then the
         field's value is unset.
    """
    record = {}
    if reader_schema is None:
        for field in writer_schema["fields"]:
            record[field["name"]] = read_data(
                decoder,
                field["type"],
                named_schemas,
                None,
                options,
            )
    else:
        readers_field_dict = {}
        aliases_field_dict = {}
        for f in reader_schema["fields"]:
            readers_field_dict[f["name"]] = f
            for alias in f.get("aliases", []):
                aliases_field_dict[alias] = f

        for field in writer_schema["fields"]:
            readers_field = readers_field_dict.get(
                field["name"],
                aliases_field_dict.get(field["name"]),
            )
            if readers_field:
                record[readers_field["name"]] = read_data(
                    decoder,
                    field["type"],
                    named_schemas,
                    readers_field["type"],
                    options,
                )
            else:
                skip_data(decoder, field["type"], named_schemas)

        # fill in default values
        if len(readers_field_dict) > len(record):
            writer_fields = [f["name"] for f in writer_schema["fields"]]
            for f_name, field in readers_field_dict.items():
                if f_name not in writer_fields and f_name not in record:
                    if "default" in field:
                        record[field["name"]] = field["default"]
                    else:
                        msg = f"No default value for field {field['name']} in {reader_schema['name']}"
                        raise SchemaResolutionError(msg)

    return record


def skip_record(decoder, writer_schema, named_schemas):
    for field in writer_schema["fields"]:
        skip_data(decoder, field["type"], named_schemas)


READERS = {
    "null": read_null,
    "boolean": read_boolean,
    "string": read_utf8,
    "int": read_int,
    "long": read_long,
    "float": read_float,
    "double": read_double,
    "bytes": read_bytes,
    "fixed": read_fixed,
    "enum": read_enum,
    "array": read_array,
    "map": read_map,
    "union": read_union,
    "error_union": read_union,
    "record": read_record,
    "error": read_record,
    "request": read_record,
}

SKIPS = {
    "null": skip_null,
    "boolean": skip_boolean,
    "string": skip_utf8,
    "int": skip_int,
    "long": skip_long,
    "float": skip_float,
    "double": skip_double,
    "bytes": skip_bytes,
    "fixed": skip_fixed,
    "enum": skip_enum,
    "array": skip_array,
    "map": skip_map,
    "union": skip_union,
    "error_union": skip_union,
    "record": skip_record,
    "error": skip_record,
    "request": skip_record,
}


def maybe_promote(data, writer_type, reader_type):
    if writer_type == "int":
        # No need to promote to long since they are the same type in Python
        if reader_type == "float" or reader_type == "double":
            return float(data)
    if writer_type == "long":
        if reader_type == "float" or reader_type == "double":
            return float(data)
    if writer_type == "string" and reader_type == "bytes":
        return data.encode()
    if writer_type == "bytes" and reader_type == "string":
        return data.decode()
    return data


def read_data(
    decoder,
    writer_schema,
    named_schemas,
    reader_schema=None,
    options={},
):
    """Read data from file object according to schema."""

    record_type = extract_record_type(writer_schema)

    if reader_schema:
        reader_schema = match_schemas(
            writer_schema,
            reader_schema,
            named_schemas,
        )

    reader_fn = READERS.get(record_type)
    if reader_fn:
        try:
            data = reader_fn(
                decoder,
                writer_schema,
                named_schemas,
                reader_schema,
                options,
            )
        except StructError:
            raise EOFError(f"cannot read {record_type} from {decoder.fo}")

        if "logicalType" in writer_schema:
            logical_type = extract_logical_type(writer_schema)
            fn = LOGICAL_READERS.get(logical_type)
            if fn:
                return fn(data, writer_schema, reader_schema)

        if reader_schema is not None:
            return maybe_promote(data, record_type, extract_record_type(reader_schema))
        else:
            return data
    else:
        return read_data(
            decoder,
            named_schemas["writer"][record_type],
            named_schemas,
            named_schemas["reader"].get(reader_schema),
            options,
        )


def skip_data(decoder, writer_schema, named_schemas):
    record_type = extract_record_type(writer_schema)

    reader_fn = SKIPS.get(record_type)
    if reader_fn:
        reader_fn(decoder, writer_schema, named_schemas)
    else:
        skip_data(decoder, named_schemas["writer"][record_type], named_schemas)


def skip_sync(fo, sync_marker):
    """Skip an expected sync marker, complaining if it doesn't match"""
    if fo.read(SYNC_SIZE) != sync_marker:
        raise ValueError("expected sync marker not found")


def null_read_block(decoder):
    """Read block in "null" codec."""
    return BytesIO(decoder.read_bytes())


def deflate_read_block(decoder):
    """Read block in "deflate" codec."""
    data = decoder.read_bytes()
    # -15 is the log of the window size; negative indicates "raw" (no
    # zlib headers) decompression.  See zlib.h.
    return BytesIO(zlib.decompressobj(-15).decompress(data))


def bzip2_read_block(decoder):
    """Read block in "bzip2" codec."""
    data = decoder.read_bytes()
    return BytesIO(bz2.decompress(data))


def xz_read_block(decoder):
    length = read_long(decoder)
    data = decoder.read_fixed(length)
    return BytesIO(lzma.decompress(data))


BLOCK_READERS = {
    "null": null_read_block,
    "deflate": deflate_read_block,
    "bzip2": bzip2_read_block,
    "xz": xz_read_block,
}


def snappy_read_block(decoder):
    length = read_long(decoder)
    data = decoder.read_fixed(length - 4)
    decoder.read_fixed(4)  # CRC
    return BytesIO(snappy_decompress(data))


try:
    from cramjam import snappy

    snappy_decompress = snappy.decompress_raw
except ImportError:
    try:
        import snappy

        snappy_decompress = snappy.decompress
        warn(
            "Snappy compression will use `cramjam` in the future. Please make sure you have `cramjam` installed",
            DeprecationWarning,
        )
    except ImportError:
        BLOCK_READERS["snappy"] = missing_codec_lib("snappy", "cramjam")
    else:
        BLOCK_READERS["snappy"] = snappy_read_block
else:
    BLOCK_READERS["snappy"] = snappy_read_block


def zstandard_read_block(decoder):
    length = read_long(decoder)
    data = decoder.read_fixed(length)
    return BytesIO(zstandard.ZstdDecompressor().decompressobj().decompress(data))


try:
    import zstandard
except ImportError:
    BLOCK_READERS["zstandard"] = missing_codec_lib("zstandard", "zstandard")
else:
    BLOCK_READERS["zstandard"] = zstandard_read_block


def lz4_read_block(decoder):
    length = read_long(decoder)
    data = decoder.read_fixed(length)
    return BytesIO(lz4.block.decompress(data))


try:
    import lz4.block
except ImportError:
    BLOCK_READERS["lz4"] = missing_codec_lib("lz4", "lz4")
else:
    BLOCK_READERS["lz4"] = lz4_read_block


def _iter_avro_records(
    decoder,
    header,
    codec,
    writer_schema,
    named_schemas,
    reader_schema,
    options,
):
    """Return iterator over avro records."""
    sync_marker = header["sync"]

    read_block = BLOCK_READERS.get(codec)
    if not read_block:
        raise ValueError(f"Unrecognized codec: {codec}")

    block_count = 0
    while True:
        try:
            block_count = decoder.read_long()
        except EOFError:
            return

        block_fo = read_block(decoder)

        for i in range(block_count):
            yield read_data(
                BinaryDecoder(block_fo),
                writer_schema,
                named_schemas,
                reader_schema,
                options,
            )

        skip_sync(decoder.fo, sync_marker)


def _iter_avro_blocks(
    decoder,
    header,
    codec,
    writer_schema,
    named_schemas,
    reader_schema,
    options,
):
    """Return iterator over avro blocks."""
    sync_marker = header["sync"]

    read_block = BLOCK_READERS.get(codec)
    if not read_block:
        raise ValueError(f"Unrecognized codec: {codec}")

    while True:
        offset = decoder.fo.tell()
        try:
            num_block_records = decoder.read_long()
        except EOFError:
            return

        block_bytes = read_block(decoder)

        skip_sync(decoder.fo, sync_marker)

        size = decoder.fo.tell() - offset

        yield Block(
            block_bytes,
            num_block_records,
            codec,
            reader_schema,
            writer_schema,
            named_schemas,
            offset,
            size,
            options,
        )


class Block:
    """An avro block. Will yield records when iterated over

    .. attribute:: num_records

        Number of records in the block

    .. attribute:: writer_schema

        The schema used when writing

    .. attribute:: reader_schema

        The schema used when reading (if provided)

    .. attribute:: offset

        Offset of the block from the beginning of the avro file

    .. attribute:: size

        Size of the block in bytes
    """

    def __init__(
        self,
        bytes_,
        num_records,
        codec,
        reader_schema,
        writer_schema,
        named_schemas,
        offset,
        size,
        options,
    ):
        self.bytes_ = bytes_
        self.num_records = num_records
        self.codec = codec
        self.reader_schema = reader_schema
        self.writer_schema = writer_schema
        self._named_schemas = named_schemas
        self.offset = offset
        self.size = size
        self.options = options

    def __iter__(self):
        for i in range(self.num_records):
            yield read_data(
                BinaryDecoder(self.bytes_),
                self.writer_schema,
                self._named_schemas,
                self.reader_schema,
                self.options,
            )

    def __str__(self):
        return (
            f"Avro block: {len(self.bytes_)} bytes, "
            + f"{self.num_records} records, "
            + f"codec: {self.codec}, position {self.offset}+{self.size}"
        )


class file_reader(Generic[T]):
    def __init__(
        self,
        fo_or_decoder,
        reader_schema=None,
        options={},
    ):
        if isinstance(fo_or_decoder, AvroJSONDecoder):
            self.decoder = fo_or_decoder
        else:
            # If a decoder was not provided, assume binary
            self.decoder = BinaryDecoder(fo_or_decoder)

        self._named_schemas = _default_named_schemas()
        if reader_schema:
            self.reader_schema = parse_schema(
                reader_schema, self._named_schemas["reader"], _write_hint=False
            )

        else:
            self.reader_schema = None
        self.options = options
        self._elems = None

    def _read_header(self):
        try:
            self._header = read_data(
                self.decoder,
                HEADER_SCHEMA,
                self._named_schemas,
                None,
                self.options,
            )
        except EOFError:
            raise ValueError("cannot read header - is it an avro file?")

        # `meta` values are bytes. So, the actual decoding has to be external.
        self.metadata = {k: v.decode() for k, v in self._header["meta"].items()}

        self._schema = json.loads(self.metadata["avro.schema"])
        self.codec = self.metadata.get("avro.codec", "null")

        # Older avro files created before we were more strict about
        # defaults might have been writen with a bad default. Since we re-parse
        # the writer schema here, it will now fail. Therefore, if a user
        # provides a reader schema that passes parsing, we will ignore those
        # default errors
        if self.reader_schema is not None:
            ignore_default_error = True
        else:
            ignore_default_error = False

        # Always parse the writer schema since it might have named types that
        # need to be stored in self._named_types
        self.writer_schema = parse_schema(
            self._schema,
            self._named_schemas["writer"],
            _write_hint=False,
            _force=True,
            _ignore_default_error=ignore_default_error,
        )

    @property
    def schema(self):
        import warnings

        warnings.warn(
            "The 'schema' attribute is deprecated. Please use 'writer_schema'",
            DeprecationWarning,
        )
        return self._schema

    def __iter__(self) -> Iterator[T]:
        if not self._elems:
            raise NotImplementedError
        return self._elems

    def __next__(self) -> T:
        return next(self._elems)


class reader(file_reader[AvroMessage]):
    """Iterator over records in an avro file.

    Parameters
    ----------
    fo
        File-like object to read from
    reader_schema
        Reader schema
    return_record_name
        If true, when reading a union of records, the result will be a tuple
        where the first value is the name of the record and the second value is
        the record itself
    return_record_name_override
        If true, this will modify the behavior of return_record_name so that
        the record name is only returned for unions where there is more than
        one record. For unions that only have one record, this option will make
        it so that the record is returned by itself, not a tuple with the name.
    return_named_type
        If true, when reading a union of named types, the result will be a tuple
        where the first value is the name of the type and the second value is
        the record itself
        NOTE: Using this option will ignore return_record_name and
        return_record_name_override
    return_named_type_override
        If true, this will modify the behavior of return_named_type so that
        the named type is only returned for unions where there is more than
        one named type. For unions that only have one named type, this option
        will make it so that the named type is returned by itself, not a tuple
        with the name
    handle_unicode_errors
        Default `strict`. Should be set to a valid string that can be used in
        the errors argument of the string decode() function. Examples include
        `replace` and `ignore`


    Example::

        from fastavro import reader
        with open('some-file.avro', 'rb') as fo:
            avro_reader = reader(fo)
            for record in avro_reader:
                process_record(record)

    The `fo` argument is a file-like object so another common example usage
    would use an `io.BytesIO` object like so::

        from io import BytesIO
        from fastavro import writer, reader

        fo = BytesIO()
        writer(fo, schema, records)
        fo.seek(0)
        for record in reader(fo):
            process_record(record)

    .. attribute:: metadata

        Key-value pairs in the header metadata

    .. attribute:: codec

        The codec used when writing

    .. attribute:: writer_schema

        The schema used when writing

    .. attribute:: reader_schema

        The schema used when reading (if provided)
    """

    def __init__(
        self,
        fo: Union[IO, AvroJSONDecoder],
        reader_schema: Optional[Schema] = None,
        return_record_name: bool = False,
        return_record_name_override: bool = False,
        handle_unicode_errors: str = "strict",
        return_named_type: bool = False,
        return_named_type_override: bool = False,
    ):
        options = {
            "return_record_name": return_record_name,
            "return_record_name_override": return_record_name_override,
            "handle_unicode_errors": handle_unicode_errors,
            "return_named_type": return_named_type,
            "return_named_type_override": return_named_type_override,
        }
        super().__init__(fo, reader_schema, options)

        if isinstance(self.decoder, AvroJSONDecoder):
            self.decoder.configure(self.reader_schema, self._named_schemas["reader"])

            self.writer_schema = self.reader_schema
            self.reader_schema = None
            self._named_schemas["writer"] = self._named_schemas["reader"]
            self._named_schemas["reader"] = {}

            def _elems():
                while not self.decoder.done:
                    yield read_data(
                        self.decoder,
                        self.writer_schema,
                        self._named_schemas,
                        self.reader_schema,
                        self.options,
                    )
                    self.decoder.drain()

            self._elems = _elems()

        else:
            self._read_header()

            self._elems = _iter_avro_records(
                self.decoder,
                self._header,
                self.codec,
                self.writer_schema,
                self._named_schemas,
                self.reader_schema,
                self.options,
            )


class block_reader(file_reader[Block]):
    """Iterator over :class:`.Block` in an avro file.

    Parameters
    ----------
    fo
        Input stream
    reader_schema
        Reader schema
    return_record_name
        If true, when reading a union of records, the result will be a tuple
        where the first value is the name of the record and the second value is
        the record itself
    return_record_name_override
        If true, this will modify the behavior of return_record_name so that
        the record name is only returned for unions where there is more than
        one record. For unions that only have one record, this option will make
        it so that the record is returned by itself, not a tuple with the name.
    return_named_type
        If true, when reading a union of named types, the result will be a tuple
        where the first value is the name of the type and the second value is
        the record itself
        NOTE: Using this option will ignore return_record_name and
        return_record_name_override
    return_named_type_override
        If true, this will modify the behavior of return_named_type so that
        the named type is only returned for unions where there is more than
        one named type. For unions that only have one named type, this option
        will make it so that the named type is returned by itself, not a tuple
        with the name
    handle_unicode_errors
        Default `strict`. Should be set to a valid string that can be used in
        the errors argument of the string decode() function. Examples include
        `replace` and `ignore`


    Example::

        from fastavro import block_reader
        with open('some-file.avro', 'rb') as fo:
            avro_reader = block_reader(fo)
            for block in avro_reader:
                process_block(block)

    .. attribute:: metadata

        Key-value pairs in the header metadata

    .. attribute:: codec

        The codec used when writing

    .. attribute:: writer_schema

        The schema used when writing

    .. attribute:: reader_schema

        The schema used when reading (if provided)
    """

    def __init__(
        self,
        fo: IO,
        reader_schema: Optional[Schema] = None,
        return_record_name: bool = False,
        return_record_name_override: bool = False,
        handle_unicode_errors: str = "strict",
        return_named_type: bool = False,
        return_named_type_override: bool = False,
    ):
        options = {
            "return_record_name": return_record_name,
            "return_record_name_override": return_record_name_override,
            "handle_unicode_errors": handle_unicode_errors,
            "return_named_type": return_named_type,
            "return_named_type_override": return_named_type_override,
        }
        super().__init__(fo, reader_schema, options)

        self._read_header()

        self._elems = _iter_avro_blocks(
            self.decoder,
            self._header,
            self.codec,
            self.writer_schema,
            self._named_schemas,
            self.reader_schema,
            self.options,
        )


def schemaless_reader(
    fo: IO,
    writer_schema: Schema,
    reader_schema: Optional[Schema] = None,
    return_record_name: bool = False,
    return_record_name_override: bool = False,
    handle_unicode_errors: str = "strict",
    return_named_type: bool = False,
    return_named_type_override: bool = False,
) -> AvroMessage:
    """Reads a single record written using the
    :meth:`~fastavro._write_py.schemaless_writer`

    Parameters
    ----------
    fo
        Input stream
    writer_schema
        Schema used when calling schemaless_writer
    reader_schema
        If the schema has changed since being written then the new schema can
        be given to allow for schema migration
    return_record_name
        If true, when reading a union of records, the result will be a tuple
        where the first value is the name of the record and the second value is
        the record itself
    return_record_name_override
        If true, this will modify the behavior of return_record_name so that
        the record name is only returned for unions where there is more than
        one record. For unions that only have one record, this option will make
        it so that the record is returned by itself, not a tuple with the name.
    return_named_type
        If true, when reading a union of named types, the result will be a tuple
        where the first value is the name of the type and the second value is
        the record itself
        NOTE: Using this option will ignore return_record_name and
        return_record_name_override
    return_named_type_override
        If true, this will modify the behavior of return_named_type so that
        the named type is only returned for unions where there is more than
        one named type. For unions that only have one named type, this option
        will make it so that the named type is returned by itself, not a tuple
        with the name
    handle_unicode_errors
        Default `strict`. Should be set to a valid string that can be used in
        the errors argument of the string decode() function. Examples include
        `replace` and `ignore`


    Example::

        parsed_schema = fastavro.parse_schema(schema)
        with open('file', 'rb') as fp:
            record = fastavro.schemaless_reader(fp, parsed_schema)

    Note: The ``schemaless_reader`` can only read a single record.
    """
    if writer_schema == reader_schema:
        # No need for the reader schema if they are the same
        reader_schema = None

    named_schemas: Dict[str, NamedSchemas] = _default_named_schemas()
    writer_schema = parse_schema(writer_schema, named_schemas["writer"])

    if reader_schema:
        reader_schema = parse_schema(reader_schema, named_schemas["reader"])

    decoder = BinaryDecoder(fo)

    options = {
        "return_record_name": return_record_name,
        "return_record_name_override": return_record_name_override,
        "handle_unicode_errors": handle_unicode_errors,
        "return_named_type": return_named_type,
        "return_named_type_override": return_named_type_override,
    }

    return read_data(
        decoder,
        writer_schema,
        named_schemas,
        reader_schema,
        options,
    )


def is_avro(path_or_buffer: Union[str, IO]) -> bool:
    """Return True if path (or buffer) points to an Avro file. This will only
    work for avro files that contain the normal avro schema header like those
    create from :func:`~fastavro._write_py.writer`. This function is not intended
    to be used with binary data created from
    :func:`~fastavro._write_py.schemaless_writer` since that does not include the
    avro header.

    Parameters
    ----------
    path_or_buffer
        Path to file
    """
    fp: IO
    if isinstance(path_or_buffer, str):
        fp = open(path_or_buffer, "rb")
        close = True
    else:
        fp = path_or_buffer
        close = False

    try:
        header = fp.read(len(MAGIC))
        return header == MAGIC
    finally:
        if close:
            fp.close()
