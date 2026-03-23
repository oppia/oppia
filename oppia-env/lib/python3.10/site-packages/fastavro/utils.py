import datetime
import uuid
from hashlib import md5
import random
from string import ascii_letters
from typing import Any, Iterator, Dict, List, cast

from .const import (
    INT_MIN_VALUE,
    INT_MAX_VALUE,
    LONG_MIN_VALUE,
    LONG_MAX_VALUE,
    DAYS_SHIFT,
    MLS_PER_HOUR,
    MCS_PER_HOUR,
)
from .schema import extract_record_type, extract_logical_type, parse_schema
from .types import Schema, NamedSchemas
from ._schema_common import PRIMITIVES


# high timestamp in the year 3084
MAX_TIMESTAMP_MILLIS = 2**45
# high timestamp in the year 3111
MAX_TIMESTAMP_MICROS = 2**55


def _randbytes(num: int) -> bytes:
    # TODO: Use random.randbytes when this library is Python 3.9+ only
    return random.getrandbits(num * 8).to_bytes(num, "little")


def _md5(string: str) -> str:
    return md5(string.encode()).hexdigest()


def _gen_utf8() -> str:
    return "".join(random.choices(ascii_letters, k=10))


def gen_data(schema: Schema, named_schemas: NamedSchemas, index: int) -> Any:
    record_type = extract_record_type(schema)
    logical_type = extract_logical_type(schema)

    if record_type == "null":
        return None
    elif record_type == "string":
        if logical_type == "string-uuid":
            return uuid.uuid4().hex
        return _gen_utf8()
    elif record_type == "int":
        if logical_type == "int-date":
            # date.fromordinal() requires: 1 <= ordinal <= date.max.toordinal()
            # logical reader calls: date.fromordinal(data + DAYS_SHIFT)
            return random.randint(
                -DAYS_SHIFT + 1, datetime.date.max.toordinal() - DAYS_SHIFT
            )
        if logical_type == "int-time-millis":
            return random.randint(0, MLS_PER_HOUR * 24 - 1)
        return random.randint(INT_MIN_VALUE, INT_MAX_VALUE)
    elif record_type == "long":
        if logical_type == "long-time-micros":
            return random.randint(0, MCS_PER_HOUR * 24 - 1)
        if (
            logical_type == "long-timestamp-millis"
            or logical_type == "long-local-timestamp-millis"
        ):
            return random.randint(0, MAX_TIMESTAMP_MILLIS)
        if (
            logical_type == "long-timestamp-micros"
            or logical_type == "long-local-timestamp-micros"
        ):
            return random.randint(0, MAX_TIMESTAMP_MICROS)
        return random.randint(LONG_MIN_VALUE, LONG_MAX_VALUE)
    elif record_type == "float":
        return random.random()
    elif record_type == "double":
        return random.random()
    elif record_type == "boolean":
        return index % 2 == 0
    elif record_type == "bytes":
        return _randbytes(10)
    elif record_type == "fixed":
        fixed_schema = cast(Dict[str, Any], schema)
        return _randbytes(fixed_schema["size"])
    elif record_type == "enum":
        enum_schema = cast(Dict[str, Any], schema)
        real_index = index % len(enum_schema["symbols"])
        return enum_schema["symbols"][real_index]
    elif record_type == "array":
        array_schema = cast(Dict[str, Schema], schema)
        return [
            gen_data(array_schema["items"], named_schemas, index) for _ in range(10)
        ]
    elif record_type == "map":
        map_schema = cast(Dict[str, Schema], schema)
        return {
            _gen_utf8(): gen_data(map_schema["values"], named_schemas, index)
            for _ in range(10)
        }
    elif record_type == "union" or record_type == "error_union":
        union_schema = cast(List[Schema], schema)
        real_index = index % len(union_schema)
        return gen_data(union_schema[real_index], named_schemas, index)
    elif record_type == "record" or record_type == "error":
        record_schema = cast(Dict[str, Any], schema)
        return {
            field["name"]: gen_data(field["type"], named_schemas, index)
            for field in record_schema["fields"]
        }
    else:
        named_schema = cast(str, schema)
        return gen_data(named_schemas[named_schema], named_schemas, index)


def generate_one(schema: Schema) -> Any:
    """
    Returns a single instance of arbitrary data that conforms to the schema.

    Parameters
    ----------
    schema
        Schema that data should conform to


    Example::

        from fastavro import schemaless_writer
        from fastavro.utils import generate_one

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

        with open('weather.avro', 'wb') as out:
            schemaless_writer(out, schema, generate_one(schema))
    """
    return next(generate_many(schema, 1))


def generate_many(schema: Schema, count: int) -> Iterator[Any]:
    """
    A generator that yields arbitrary data that conforms to the schema. It will
    yield a number of data structures equal to what is given in the count

    Parameters
    ----------
    schema
        Schema that data should conform to
    count
        Number of objects to generate


    Example::

        from fastavro import writer
        from fastavro.utils import generate_many

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

        with open('weather.avro', 'wb') as out:
            writer(out, schema, generate_many(schema, 5))
    """
    named_schemas: NamedSchemas = {}
    parsed_schema = parse_schema(schema, named_schemas)
    for index in range(count):
        yield gen_data(parsed_schema, named_schemas, index)


def anonymize_schema(schema: Schema) -> Schema:
    """Returns an anonymized schema

    Parameters
    ----------
    schema
        Schema to anonymize


    Example::

        from fastavro.utils import anonymize_schema

        anonymized_schema = anonymize_schema(original_schema)
    """
    named_schemas: NamedSchemas = {}
    parsed_schema = parse_schema(schema, named_schemas)
    return _anonymize_schema(parsed_schema, named_schemas)


def _anonymize_schema(schema: Schema, named_schemas: NamedSchemas) -> Schema:
    # union schemas
    if isinstance(schema, list):
        return [_anonymize_schema(s, named_schemas) for s in schema]

    # string schemas; this could be either a named schema or a primitive type
    elif not isinstance(schema, dict):
        if schema in PRIMITIVES:
            return schema
        else:
            return f"A_{_md5(schema)}"

    else:
        # Remaining valid schemas must be dict types
        schema_type = schema["type"]

        parsed_schema = {}
        parsed_schema["type"] = schema_type

        if "doc" in schema:
            parsed_schema["doc"] = _md5(schema["doc"])

        if schema_type == "array":
            parsed_schema["items"] = _anonymize_schema(schema["items"], named_schemas)

        elif schema_type == "map":
            parsed_schema["values"] = _anonymize_schema(schema["values"], named_schemas)

        elif schema_type == "enum":
            parsed_schema["name"] = f"A_{_md5(schema['name'])}"
            parsed_schema["symbols"] = [
                f"A_{_md5(symbol)}" for symbol in schema["symbols"]
            ]

        elif schema_type == "fixed":
            parsed_schema["name"] = f"A_{_md5(schema['name'])}"
            parsed_schema["size"] = schema["size"]

        elif schema_type == "record" or schema_type == "error":
            # records
            parsed_schema["name"] = f"A_{_md5(schema['name'])}"
            parsed_schema["fields"] = [
                anonymize_field(field, named_schemas) for field in schema["fields"]
            ]

        elif schema_type in PRIMITIVES:
            parsed_schema["type"] = schema_type

        return parsed_schema


def anonymize_field(
    field: Dict[str, Any], named_schemas: NamedSchemas
) -> Dict[str, Any]:
    parsed_field: Dict[str, Any] = {}

    if "doc" in field:
        parsed_field["doc"] = _md5(field["doc"])
    if "aliases" in field:
        parsed_field["aliases"] = [_md5(alias) for alias in field["aliases"]]
    if "default" in field:
        parsed_field["default"] = field["default"]

    # TODO: Defaults for enums should be hashed. Maybe others too?

    parsed_field["name"] = _md5(field["name"])
    parsed_field["type"] = _anonymize_schema(field["type"], named_schemas)

    return parsed_field
