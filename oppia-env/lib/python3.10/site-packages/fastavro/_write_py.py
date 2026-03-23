"""Python code for writing AVRO files"""

# This code is a modified version of the code at
# http://svn.apache.org/viewvc/avro/trunk/lang/py/src/avro/ which is under
# Apache 2.0 license (http://www.apache.org/licenses/LICENSE-2.0)

from abc import ABC, abstractmethod
import json
from io import BytesIO
from os import urandom, SEEK_SET
import bz2
import lzma
import zlib
from typing import Union, IO, Iterable, Any, Optional, Dict
from warnings import warn

from .const import NAMED_TYPES
from .io.binary_encoder import BinaryEncoder
from .io.json_encoder import AvroJSONEncoder
from .validation import _validate
from .read import HEADER_SCHEMA, SYNC_SIZE, MAGIC, reader
from .logical_writers import LOGICAL_WRITERS
from .schema import extract_record_type, extract_logical_type, parse_schema
from ._write_common import _is_appendable
from .types import Schema, NamedSchemas


def write_null(encoder, datum, schema, named_schemas, fname, options):
    """null is written as zero bytes"""
    encoder.write_null()


def write_boolean(encoder, datum, schema, named_schemas, fname, options):
    """A boolean is written as a single byte whose value is either 0 (false) or
    1 (true)."""
    encoder.write_boolean(datum)


def write_int(encoder, datum, schema, named_schemas, fname, options):
    """int and long values are written using variable-length, zig-zag coding."""
    encoder.write_int(datum)


def write_long(encoder, datum, schema, named_schemas, fname, options):
    """int and long values are written using variable-length, zig-zag coding."""
    encoder.write_long(datum)


def write_float(encoder, datum, schema, named_schemas, fname, options):
    """A float is written as 4 bytes.  The float is converted into a 32-bit
    integer using a method equivalent to Java's floatToIntBits and then encoded
    in little-endian format."""
    encoder.write_float(datum)


def write_double(encoder, datum, schema, named_schemas, fname, options):
    """A double is written as 8 bytes.  The double is converted into a 64-bit
    integer using a method equivalent to Java's doubleToLongBits and then
    encoded in little-endian format."""
    encoder.write_double(datum)


def write_bytes(encoder, datum, schema, named_schemas, fname, options):
    """Bytes are encoded as a long followed by that many bytes of data."""
    encoder.write_bytes(datum)


def write_utf8(encoder, datum, schema, named_schemas, fname, options):
    """A string is encoded as a long followed by that many bytes of UTF-8
    encoded character data."""
    encoder.write_utf8(datum)


def write_crc32(encoder, datum):
    """A 4-byte, big-endian CRC32 checksum"""
    encoder.write_crc32(datum)


def write_fixed(encoder, datum, schema, named_schemas, fname, options):
    """Fixed instances are encoded using the number of bytes declared in the
    schema."""
    if len(datum) != schema["size"]:
        raise ValueError(
            f"data of length {len(datum)} does not match schema size: {schema}"
        )
    encoder.write_fixed(datum)


def write_enum(encoder, datum, schema, named_schemas, fname, options):
    """An enum is encoded by a int, representing the zero-based position of
    the symbol in the schema."""
    index = schema["symbols"].index(datum)
    encoder.write_enum(index)


def write_array(encoder, datum, schema, named_schemas, fname, options):
    """Arrays are encoded as a series of blocks.

    Each block consists of a long count value, followed by that many array
    items.  A block with count zero indicates the end of the array.  Each item
    is encoded per the array's item schema.

    If a block's count is negative, then the count is followed immediately by a
    long block size, indicating the number of bytes in the block.  The actual
    count in this case is the absolute value of the count written."""
    encoder.write_array_start()
    if len(datum) > 0:
        encoder.write_item_count(len(datum))
        dtype = schema["items"]
        for item in datum:
            write_data(encoder, item, dtype, named_schemas, fname, options)
            encoder.end_item()
    encoder.write_array_end()


def write_map(encoder, datum, schema, named_schemas, fname, options):
    """Maps are encoded as a series of blocks.

    Each block consists of a long count value, followed by that many key/value
    pairs.  A block with count zero indicates the end of the map.  Each item is
    encoded per the map's value schema.

    If a block's count is negative, then the count is followed immediately by a
    long block size, indicating the number of bytes in the block. The actual
    count in this case is the absolute value of the count written."""
    encoder.write_map_start()
    if len(datum) > 0:
        encoder.write_item_count(len(datum))
        vtype = schema["values"]
        for key, val in datum.items():
            encoder.write_utf8(key)
            write_data(encoder, val, vtype, named_schemas, fname, options)
    encoder.write_map_end()


def write_union(encoder, datum, schema, named_schemas, fname, options):
    """A union is encoded by first writing a long value indicating the
    zero-based position within the union of the schema of its value. The value
    is then encoded per the indicated schema within the union."""

    best_match_index = -1
    if isinstance(datum, tuple) and not options.get("disable_tuple_notation"):
        (name, datum) = datum
        for index, candidate in enumerate(schema):
            extracted_type = extract_record_type(candidate)
            if extracted_type in NAMED_TYPES:
                schema_name = candidate["name"]
            else:
                schema_name = extracted_type
            if name == schema_name:
                best_match_index = index
                break

        if best_match_index == -1:
            field = f"on field {fname}" if fname else ""
            msg = (
                f"provided union type name {name} not found in schema "
                + f"{schema} {field}"
            )
            raise ValueError(msg)
        index = best_match_index
    else:
        pytype = type(datum)
        most_fields = -1

        # All of Python's floating point values are doubles, so to
        # avoid loss of precision, we should always prefer 'double'
        # if we are forced to choose between float and double.
        #
        # If 'double' comes before 'float' in the union, then we'll immediately
        # choose it, and don't need to worry. But if 'float' comes before
        # 'double', we don't want to pick it.
        #
        # So, if we ever see 'float', we skim through the rest of the options,
        # just to see if 'double' is a possibility, because we'd prefer it.
        could_be_float = False

        for index, candidate in enumerate(schema):
            if could_be_float:
                if extract_record_type(candidate) == "double":
                    best_match_index = index
                    break
                else:
                    # Nothing except "double" is even worth considering.
                    continue

            if _validate(
                datum,
                candidate,
                named_schemas,
                raise_errors=False,
                field="",
                options=options,
            ):
                record_type = extract_record_type(candidate)
                if record_type == "record":
                    logical_type = extract_logical_type(candidate)
                    if logical_type:
                        prepare = LOGICAL_WRITERS.get(logical_type)
                        if prepare:
                            datum = prepare(datum, candidate)

                    candidate_fields = set(f["name"] for f in candidate["fields"])
                    datum_fields = set(datum)
                    fields = len(candidate_fields.intersection(datum_fields))
                    if fields > most_fields:
                        best_match_index = index
                        most_fields = fields
                elif record_type == "float":
                    best_match_index = index
                    # Continue in the loop, because it's possible that there's
                    # another candidate which has record type 'double'
                    could_be_float = True
                else:
                    best_match_index = index
                    break
        if best_match_index == -1:
            field = f"on field {fname}" if fname else ""
            raise ValueError(
                f"{repr(datum)} (type {pytype}) do not match {schema} {field}"
            )
        index = best_match_index

    # write data
    # TODO: There should be a way to give just the index
    encoder.write_index(index, schema[index])
    write_data(encoder, datum, schema[index], named_schemas, fname, options)


def write_record(encoder, datum, schema, named_schemas, fname, options):
    """A record is encoded by encoding the values of its fields in the order
    that they are declared. In other words, a record is encoded as just the
    concatenation of the encodings of its fields.  Field values are encoded per
    their schema."""
    extras = set(datum) - set(field["name"] for field in schema["fields"])
    if (options.get("strict") or options.get("strict_allow_default")) and extras:
        raise ValueError(
            f'record contains more fields than the schema specifies: {", ".join(extras)}'
        )
    for field in schema["fields"]:
        name = field["name"]
        field_type = field["type"]
        if name not in datum:
            if options.get("strict") or (
                options.get("strict_allow_default") and "default" not in field
            ):
                raise ValueError(
                    f"Field {name} is specified in the schema but missing from the record"
                )
            elif "default" not in field and "null" not in field_type:
                raise ValueError(f"no value and no default for {name}")
        datum_value = datum.get(name, field.get("default"))
        if field_type == "float" or field_type == "double":
            # Handle float values like "NaN"
            datum_value = float(datum_value)
        write_data(
            encoder,
            datum_value,
            field_type,
            named_schemas,
            name,
            options,
        )


WRITERS = {
    "null": write_null,
    "boolean": write_boolean,
    "string": write_utf8,
    "int": write_int,
    "long": write_long,
    "float": write_float,
    "double": write_double,
    "bytes": write_bytes,
    "fixed": write_fixed,
    "enum": write_enum,
    "array": write_array,
    "map": write_map,
    "union": write_union,
    "error_union": write_union,
    "record": write_record,
    "error": write_record,
}


def write_data(encoder, datum, schema, named_schemas, fname, options):
    """Write a datum of data to output stream.

    Parameters
    ----------
    encoder: encoder
        Type of encoder (e.g. binary or json)
    datum: object
        Data to write
    schema: dict
        Schema to use
    named_schemas: dict
        Mapping of fullname to schema definition
    """

    record_type = extract_record_type(schema)
    logical_type = extract_logical_type(schema)

    fn = WRITERS.get(record_type)
    if fn:
        if logical_type:
            prepare = LOGICAL_WRITERS.get(logical_type)
            if prepare:
                datum = prepare(datum, schema)
        try:
            return fn(encoder, datum, schema, named_schemas, fname, options)
        except TypeError as ex:
            if fname:
                raise TypeError(f"{ex} on field {fname}")
            raise
    else:
        return write_data(
            encoder, datum, named_schemas[record_type], named_schemas, "", options
        )


def write_header(encoder, metadata, sync_marker):
    header = {
        "magic": MAGIC,
        "meta": {key: value.encode() for key, value in metadata.items()},
        "sync": sync_marker,
    }
    write_data(encoder, header, HEADER_SCHEMA, {}, "", {})


def null_write_block(encoder, block_bytes, compression_level):
    """Write block in "null" codec."""
    encoder.write_long(len(block_bytes))
    encoder._fo.write(block_bytes)


def deflate_write_block(encoder, block_bytes, compression_level):
    """Write block in "deflate" codec."""
    # The first two characters and last character are zlib
    # wrappers around deflate data.
    if compression_level is not None:
        data = zlib.compress(block_bytes, compression_level)[2:-1]
    else:
        data = zlib.compress(block_bytes)[2:-1]
    encoder.write_long(len(data))
    encoder._fo.write(data)


def bzip2_write_block(encoder, block_bytes, compression_level):
    """Write block in "bzip2" codec."""
    data = bz2.compress(block_bytes)
    encoder.write_long(len(data))
    encoder._fo.write(data)


def xz_write_block(encoder, block_bytes, compression_level):
    """Write block in "xz" codec."""
    data = lzma.compress(block_bytes)
    encoder.write_long(len(data))
    encoder._fo.write(data)


BLOCK_WRITERS = {
    "null": null_write_block,
    "deflate": deflate_write_block,
    "bzip2": bzip2_write_block,
    "xz": xz_write_block,
}


def _missing_codec_lib(codec, *libraries):
    def missing(encoder, block_bytes, compression_level):
        raise ValueError(
            f"{codec} codec is supported but you need to install one of the "
            + f"following libraries: {libraries}"
        )

    return missing


def snappy_write_block(encoder, block_bytes, compression_level):
    """Write block in "snappy" codec."""
    data = snappy_compress(block_bytes)
    encoder.write_long(len(data) + 4)  # for CRC
    encoder._fo.write(data)
    encoder.write_crc32(block_bytes)


try:
    from cramjam import snappy

    snappy_compress = snappy.compress_raw
except ImportError:
    try:
        import snappy

        snappy_compress = snappy.compress
        warn(
            "Snappy compression will use `cramjam` in the future. Please make sure you have `cramjam` installed",
            DeprecationWarning,
        )
    except ImportError:
        BLOCK_WRITERS["snappy"] = _missing_codec_lib("snappy", "cramjam")
    else:
        BLOCK_WRITERS["snappy"] = snappy_write_block
else:
    BLOCK_WRITERS["snappy"] = snappy_write_block


def zstandard_write_block(encoder, block_bytes, compression_level):
    """Write block in "zstandard" codec."""
    if compression_level is not None:
        data = zstandard.ZstdCompressor(level=compression_level).compress(block_bytes)
    else:
        data = zstandard.ZstdCompressor().compress(block_bytes)
    encoder.write_long(len(data))
    encoder._fo.write(data)


try:
    import zstandard
except ImportError:
    BLOCK_WRITERS["zstandard"] = _missing_codec_lib("zstandard", "zstandard")
else:
    BLOCK_WRITERS["zstandard"] = zstandard_write_block


def lz4_write_block(encoder, block_bytes, compression_level):
    """Write block in "lz4" codec."""
    data = lz4.block.compress(block_bytes)
    encoder.write_long(len(data))
    encoder._fo.write(data)


try:
    import lz4.block
except ImportError:
    BLOCK_WRITERS["lz4"] = _missing_codec_lib("lz4", "lz4")
else:
    BLOCK_WRITERS["lz4"] = lz4_write_block


class GenericWriter(ABC):
    def __init__(self, schema, metadata=None, validator=None, options={}):
        self._named_schemas = {}
        self.validate_fn = _validate if validator else None
        self.metadata = metadata or {}
        self.options = options

        # A schema of None is allowed when appending and when doing so the
        # self.schema will be updated later
        if schema is not None:
            self.schema = parse_schema(schema, self._named_schemas)

        if isinstance(schema, dict):
            schema = {
                key: value
                for key, value in schema.items()
                if key not in ("__fastavro_parsed", "__named_schemas")
            }
        elif isinstance(schema, list):
            schemas = []
            for s in schema:
                if isinstance(s, dict):
                    schemas.append(
                        {
                            key: value
                            for key, value in s.items()
                            if key
                            not in (
                                "__fastavro_parsed",
                                "__named_schemas",
                            )
                        }
                    )
                else:
                    schemas.append(s)
            schema = schemas

        self.metadata["avro.schema"] = json.dumps(schema)

    @abstractmethod
    def write(self, record):
        pass

    @abstractmethod
    def flush(self):
        pass


class Writer(GenericWriter):
    def __init__(
        self,
        fo: Union[IO, BinaryEncoder],
        schema: Schema,
        codec: str = "null",
        sync_interval: int = 1000 * SYNC_SIZE,
        metadata: Optional[Dict[str, str]] = None,
        validator: bool = False,
        sync_marker: bytes = b"",
        compression_level: Optional[int] = None,
        options: Dict[str, bool] = {},
    ):
        super().__init__(schema, metadata, validator, options)

        self.metadata["avro.codec"] = codec
        if isinstance(fo, BinaryEncoder):
            self.encoder = fo
        else:
            self.encoder = BinaryEncoder(fo)
        self.io = BinaryEncoder(BytesIO())
        self.block_count = 0
        self.sync_interval = sync_interval
        self.compression_level = compression_level

        if _is_appendable(self.encoder._fo):
            # Seed to the beginning to read the header
            self.encoder._fo.seek(0)
            avro_reader = reader(self.encoder._fo)
            header = avro_reader._header

            self._named_schemas = {}
            self.schema = parse_schema(avro_reader.writer_schema, self._named_schemas)

            codec = avro_reader.metadata.get("avro.codec", "null")

            self.sync_marker = header["sync"]

            # Seek to the end of the file
            self.encoder._fo.seek(0, 2)

            self.block_writer = BLOCK_WRITERS[codec]
        else:
            self.sync_marker = sync_marker or urandom(SYNC_SIZE)

            try:
                self.block_writer = BLOCK_WRITERS[codec]
            except KeyError:
                raise ValueError(f"unrecognized codec: {codec}")

            write_header(self.encoder, self.metadata, self.sync_marker)

    def dump(self):
        self.encoder.write_long(self.block_count)
        self.block_writer(self.encoder, self.io._fo.getvalue(), self.compression_level)
        self.encoder._fo.write(self.sync_marker)
        self.io._fo.truncate(0)
        self.io._fo.seek(0, SEEK_SET)
        self.block_count = 0

    def write(self, record):
        if self.validate_fn:
            self.validate_fn(
                record, self.schema, self._named_schemas, "", True, self.options
            )
        write_data(self.io, record, self.schema, self._named_schemas, "", self.options)
        self.block_count += 1
        if self.io._fo.tell() >= self.sync_interval:
            self.dump()

    def write_block(self, block):
        # Clear existing block if there are any records pending
        if self.io._fo.tell() or self.block_count > 0:
            self.dump()
        self.encoder.write_long(block.num_records)
        self.block_writer(self.encoder, block.bytes_.getvalue(), self.compression_level)
        self.encoder._fo.write(self.sync_marker)

    def flush(self):
        if self.io._fo.tell() or self.block_count > 0:
            self.dump()
        self.encoder._fo.flush()


class JSONWriter(GenericWriter):
    def __init__(
        self,
        fo: AvroJSONEncoder,
        schema: Schema,
        codec: str = "null",
        sync_interval: int = 1000 * SYNC_SIZE,
        metadata: Optional[Dict[str, str]] = None,
        validator: bool = False,
        sync_marker: bytes = b"",
        codec_compression_level: Optional[int] = None,
        options: Dict[str, bool] = {},
    ):
        super().__init__(schema, metadata, validator, options)

        self.encoder = fo
        self.encoder.configure(self.schema, self._named_schemas)

    def write(self, record):
        if self.validate_fn:
            self.validate_fn(
                record, self.schema, self._named_schemas, "", True, self.options
            )
        write_data(
            self.encoder, record, self.schema, self._named_schemas, "", self.options
        )

    def flush(self):
        self.encoder.flush()


def writer(
    fo: Union[IO, AvroJSONEncoder],
    schema: Schema,
    records: Iterable[Any],
    codec: str = "null",
    sync_interval: int = 1000 * SYNC_SIZE,
    metadata: Optional[Dict[str, str]] = None,
    validator: bool = False,
    sync_marker: bytes = b"",
    codec_compression_level: Optional[int] = None,
    *,
    strict: bool = False,
    strict_allow_default: bool = False,
    disable_tuple_notation: bool = False,
):
    """Write records to fo (stream) according to schema

    Parameters
    ----------
    fo
        Output stream
    schema
        Writer schema
    records
        Records to write. This is commonly a list of the dictionary
        representation of the records, but it can be any iterable
    codec
        Compression codec, can be 'null', 'deflate' or 'snappy' (if installed)
    sync_interval
        Size of sync interval
    metadata
        Header metadata
    validator
        If true, validation will be done on the records
    sync_marker
        A byte string used as the avro sync marker. If not provided, a random
        byte string will be used.
    codec_compression_level
        Compression level to use with the specified codec (if the codec
        supports it)
    strict
        If set to True, an error will be raised if records do not contain
        exactly the same fields that the schema states
    strict_allow_default
        If set to True, an error will be raised if records do not contain
        exactly the same fields that the schema states unless it is a missing
        field that has a default value in the schema
    disable_tuple_notation
        If set to True, tuples will not be treated as a special case. Therefore,
        using a tuple to indicate the type of a record will not work


    Example::

        from fastavro import writer, parse_schema

        schema = {
            'doc': 'A weather reading.',
            'name': 'Weather',
            'namespace': 'test',
            'type': 'record',
            'fields': [
                {'name': 'station', 'type': 'string'},
                {'name': 'time', 'type': 'long'},
                {'name': 'temp', 'type': 'int'},
            ],
        }
        parsed_schema = parse_schema(schema)

        records = [
            {u'station': u'011990-99999', u'temp': 0, u'time': 1433269388},
            {u'station': u'011990-99999', u'temp': 22, u'time': 1433270389},
            {u'station': u'011990-99999', u'temp': -11, u'time': 1433273379},
            {u'station': u'012650-99999', u'temp': 111, u'time': 1433275478},
        ]

        with open('weather.avro', 'wb') as out:
            writer(out, parsed_schema, records)

    The `fo` argument is a file-like object so another common example usage
    would use an `io.BytesIO` object like so::

        from io import BytesIO
        from fastavro import writer

        fo = BytesIO()
        writer(fo, schema, records)

    Given an existing avro file, it's possible to append to it by re-opening
    the file in `a+b` mode. If the file is only opened in `ab` mode, we aren't
    able to read some of the existing header information and an error will be
    raised. For example::

        # Write initial records
        with open('weather.avro', 'wb') as out:
            writer(out, parsed_schema, records)

        # Write some more records
        with open('weather.avro', 'a+b') as out:
            writer(out, None, more_records)

    Note: When appending, any schema provided will be ignored since the schema
    in the avro file will be re-used. Therefore it is convenient to just use
    None as the schema.
    """
    # Sanity check that records is not a single dictionary (as that is a common
    # mistake and the exception that gets raised is not helpful)
    if isinstance(records, dict):
        raise ValueError('"records" argument should be an iterable, not dict')

    output: Union[JSONWriter, Writer]
    if isinstance(fo, AvroJSONEncoder):
        output = JSONWriter(
            fo,
            schema,
            codec,
            sync_interval,
            metadata,
            validator,
            sync_marker,
            codec_compression_level,
            options={
                "strict": strict,
                "strict_allow_default": strict_allow_default,
                "disable_tuple_notation": disable_tuple_notation,
            },
        )
    else:
        output = Writer(
            BinaryEncoder(fo),
            schema,
            codec,
            sync_interval,
            metadata,
            validator,
            sync_marker,
            codec_compression_level,
            options={
                "strict": strict,
                "strict_allow_default": strict_allow_default,
                "disable_tuple_notation": disable_tuple_notation,
            },
        )

    for record in records:
        output.write(record)
    output.flush()


def schemaless_writer(
    fo: IO,
    schema: Schema,
    record: Any,
    *,
    strict: bool = False,
    strict_allow_default: bool = False,
    disable_tuple_notation: bool = False,
):
    """Write a single record without the schema or header information

    Parameters
    ----------
    fo
        Output file
    schema
        Schema
    record
        Record to write
    strict
        If set to True, an error will be raised if records do not contain
        exactly the same fields that the schema states
    strict_allow_default
        If set to True, an error will be raised if records do not contain
        exactly the same fields that the schema states unless it is a missing
        field that has a default value in the schema
    disable_tuple_notation
        If set to True, tuples will not be treated as a special case. Therefore,
        using a tuple to indicate the type of a record will not work


    Example::

        parsed_schema = fastavro.parse_schema(schema)
        with open('file', 'wb') as fp:
            fastavro.schemaless_writer(fp, parsed_schema, record)

    Note: The ``schemaless_writer`` can only write a single record.
    """
    named_schemas: NamedSchemas = {}
    schema = parse_schema(schema, named_schemas)

    encoder = BinaryEncoder(fo)
    write_data(
        encoder,
        record,
        schema,
        named_schemas,
        "",
        {
            "strict": strict,
            "strict_allow_default": strict_allow_default,
            "disable_tuple_notation": disable_tuple_notation,
        },
    )
    encoder.flush()
