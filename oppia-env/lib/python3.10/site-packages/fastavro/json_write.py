from typing import IO, Iterable, Any

from ._write_py import writer
from .io.json_encoder import AvroJSONEncoder
from .types import Schema


def json_writer(
    fo: IO,
    schema: Schema,
    records: Iterable[Any],
    *,
    write_union_type: bool = True,
    validator: bool = False,
    encoder=AvroJSONEncoder,
    strict: bool = False,
    strict_allow_default: bool = False,
    disable_tuple_notation: bool = False,
) -> None:
    """Write records to fo (stream) according to schema

    Parameters
    ----------
    fo
        File-like object to write to
    schema
        Writer schema
    records
        Records to write. This is commonly a list of the dictionary
        representation of the records, but it can be any iterable
    write_union_type
        Determine whether to write the union type in the json message.
        If this is set to False the output will be clear json.
        It may however not be decodable back to avro record by `json_read`.
    validator
        If true, validation will be done on the records
    encoder
        By default the standard AvroJSONEncoder will be used, but a custom one
        could be passed here
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

        from fastavro import json_writer, parse_schema

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

        with open('some-file', 'w') as out:
            json_writer(out, parsed_schema, records)
    """
    return writer(
        encoder(fo, write_union_type=write_union_type),
        schema,
        records,
        validator=validator,
        strict=strict,
        strict_allow_default=strict_allow_default,
        disable_tuple_notation=disable_tuple_notation,
    )
