import array
import numbers
from collections.abc import Mapping, Sequence
from typing import Any, Iterable

from .const import INT_MAX_VALUE, INT_MIN_VALUE, LONG_MAX_VALUE, LONG_MIN_VALUE
from ._validate_common import ValidationError, ValidationErrorData
from .schema import extract_record_type, extract_logical_type, schema_name, parse_schema
from .logical_writers import LOGICAL_WRITERS
from ._schema_common import UnknownType
from .types import Schema, NamedSchemas

NoValue = object()


def _validate_null(datum, **kwargs):
    """Checks that the data value is None."""
    return datum is None


def _validate_boolean(datum, **kwargs):
    """Check that the data value is bool instance"""
    return isinstance(datum, bool)


def _validate_string(datum, **kwargs):
    """Check that the data value is string"""
    return isinstance(datum, str)


def _validate_bytes(datum, **kwargs):
    """Check that the data value is python bytes type"""
    return isinstance(datum, (bytes, bytearray))


def _validate_int(datum, **kwargs):
    """
    Check that the data value is a non floating
    point number with size less that Int32.

    Int32 = -2147483648<=datum<=2147483647

    conditional python types: int, numbers.Integral
    """
    return (
        isinstance(datum, (int, numbers.Integral))
        and INT_MIN_VALUE <= datum <= INT_MAX_VALUE
        and not isinstance(datum, bool)
    )


def _validate_long(datum, **kwargs):
    """
    Check that the data value is a non floating
    point number with size less that long64.

    Int64 = -9223372036854775808 <= datum <= 9223372036854775807

    conditional python types: int, numbers.Integral
    """
    return (
        isinstance(datum, (int, numbers.Integral))
        and LONG_MIN_VALUE <= datum <= LONG_MAX_VALUE
        and not isinstance(datum, bool)
    )


def _validate_float(datum, **kwargs):
    """
    Check that the data value is a floating
    point number or double precision.

    conditional python types
    (int, float, numbers.Real)
    """
    return isinstance(datum, (int, float, numbers.Real)) and not isinstance(datum, bool)


def _validate_fixed(datum, schema, **kwargs):
    """
    Check that the data value is fixed width bytes,
    matching the schema['size'] exactly!
    """
    return isinstance(datum, bytes) and len(datum) == schema["size"]


def _validate_enum(datum, schema, **kwargs):
    """Check that the data value matches one of the enum symbols."""
    return datum in schema["symbols"]


def _validate_array(datum, schema, named_schemas, parent_ns, raise_errors, options):
    """Check that the data list values all match schema['items']."""
    return (
        isinstance(datum, (Sequence, array.array))
        and not isinstance(datum, str)
        and all(
            _validate(
                datum=d,
                schema=schema["items"],
                named_schemas=named_schemas,
                field=parent_ns,
                raise_errors=raise_errors,
                options=options,
            )
            for d in datum
        )
    )


def _validate_map(datum, schema, named_schemas, parent_ns, raise_errors, options):
    """
    Check that the data is a Map(k,v)
    matching values to schema['values'] type.
    """
    return (
        isinstance(datum, Mapping)
        and all(isinstance(k, str) for k in datum)
        and all(
            _validate(
                datum=v,
                schema=schema["values"],
                named_schemas=named_schemas,
                field=parent_ns,
                raise_errors=raise_errors,
                options=options,
            )
            for v in datum.values()
        )
    )


def _validate_record(datum, schema, named_schemas, parent_ns, raise_errors, options):
    """
    Check that the data is a Mapping type with all schema defined fields
    validated as True.
    """
    _, fullname = schema_name(schema, parent_ns)
    return (
        isinstance(datum, Mapping)
        and not ("-type" in datum and datum["-type"] != fullname)
        and all(
            _validate(
                datum=datum.get(f["name"], f.get("default", NoValue)),
                schema=f["type"],
                named_schemas=named_schemas,
                field=f"{fullname}.{f['name']}",
                raise_errors=raise_errors,
                options=options,
            )
            for f in schema["fields"]
        )
    )


def _validate_union(datum, schema, named_schemas, parent_ns, raise_errors, options):
    """
    Check that the data is a list type with possible options to
    validate as True.
    """
    if isinstance(datum, tuple) and not options.get("disable_tuple_notation"):
        (name, datum) = datum
        for candidate in schema:
            if extract_record_type(candidate) == "record":
                schema_name = candidate["name"]
            else:
                schema_name = candidate
            if schema_name == name:
                return _validate(
                    datum,
                    schema=candidate,
                    named_schemas=named_schemas,
                    field=parent_ns,
                    raise_errors=raise_errors,
                    options=options,
                )
        else:
            return False

    errors = []
    for s in schema:
        try:
            ret = _validate(
                datum,
                schema=s,
                named_schemas=named_schemas,
                field=parent_ns,
                raise_errors=raise_errors,
                options=options,
            )
            if ret:
                # We exit on the first passing type in Unions
                return True
        except ValidationError as e:
            errors.extend(e.errors)
    if raise_errors:
        raise ValidationError(*errors)
    return False


VALIDATORS = {
    "null": _validate_null,
    "boolean": _validate_boolean,
    "string": _validate_string,
    "int": _validate_int,
    "long": _validate_long,
    "float": _validate_float,
    "double": _validate_float,
    "bytes": _validate_bytes,
    "fixed": _validate_fixed,
    "enum": _validate_enum,
    "array": _validate_array,
    "map": _validate_map,
    "union": _validate_union,
    "error_union": _validate_union,
    "record": _validate_record,
    "error": _validate_record,
    "request": _validate_record,
}


def _validate(datum, schema, named_schemas, field, raise_errors, options):
    # This function expects the schema to already be parsed
    record_type = extract_record_type(schema)
    result = None

    if datum is NoValue and options.get("strict"):
        result = False
    else:
        if datum is NoValue:
            datum = None

        logical_type = extract_logical_type(schema)
        if logical_type:
            prepare = LOGICAL_WRITERS.get(logical_type)
            if prepare:
                datum = prepare(datum, schema)

        validator = VALIDATORS.get(record_type)
        if validator:
            result = validator(
                datum,
                schema=schema,
                named_schemas=named_schemas,
                parent_ns=field,
                raise_errors=raise_errors,
                options=options,
            )
        elif record_type in named_schemas:
            result = _validate(
                datum,
                schema=named_schemas[record_type],
                named_schemas=named_schemas,
                field=field,
                raise_errors=raise_errors,
                options=options,
            )
        else:
            raise UnknownType(record_type)

    if raise_errors and result is False:
        raise ValidationError(ValidationErrorData(datum, schema, field))

    return result


def validate(
    datum: Any,
    schema: Schema,
    field: str = "",
    raise_errors: bool = True,
    strict: bool = False,
    disable_tuple_notation: bool = False,
) -> bool:
    """
    Determine if a python datum is an instance of a schema.

    Parameters
    ----------
    datum
        Data being validated
    schema
        Schema
    field
        Record field being validated
    raise_errors
        If true, errors are raised for invalid data. If false, a simple
        True (valid) or False (invalid) result is returned
    strict
        If true, fields without values will raise errors rather than implicitly
        defaulting to None
    disable_tuple_notation
        If set to True, tuples will not be treated as a special case. Therefore,
        using a tuple to indicate the type of a record will not work


    Example::

        from fastavro.validation import validate
        schema = {...}
        record = {...}
        validate(record, schema)
    """
    named_schemas: NamedSchemas = {}
    parsed_schema = parse_schema(schema, named_schemas)
    return _validate(
        datum,
        parsed_schema,
        named_schemas,
        field,
        raise_errors,
        options={"strict": strict, "disable_tuple_notation": disable_tuple_notation},
    )


def validate_many(
    records: Iterable[Any],
    schema: Schema,
    raise_errors: bool = True,
    strict: bool = False,
    disable_tuple_notation: bool = False,
) -> bool:
    """
    Validate a list of data!

    Parameters
    ----------
    records
        List of records to validate
    schema
        Schema
    raise_errors
        If true, errors are raised for invalid data. If false, a simple
        True (valid) or False (invalid) result is returned
    strict
        If true, fields without values will raise errors rather than implicitly
        defaulting to None
    disable_tuple_notation
        If set to True, tuples will not be treated as a special case. Therefore,
        using a tuple to indicate the type of a record will not work


    Example::

        from fastavro.validation import validate_many
        schema = {...}
        records = [{...}, {...}, ...]
        validate_many(records, schema)
    """
    named_schemas: NamedSchemas = {}
    parsed_schema = parse_schema(schema, named_schemas)
    errors = []
    results = []
    for record in records:
        try:
            results.append(
                _validate(
                    record,
                    parsed_schema,
                    named_schemas,
                    field="",
                    raise_errors=raise_errors,
                    options={
                        "strict": strict,
                        "disable_tuple_notation": disable_tuple_notation,
                    },
                )
            )
        except ValidationError as e:
            errors.extend(e.errors)
    if raise_errors and errors:
        raise ValidationError(*errors)
    return all(results)
