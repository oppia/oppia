import hashlib
from io import StringIO
import math
from os import path
from copy import deepcopy
import re
from typing import Tuple, Set, Optional, List, Any

from .types import DictSchema, Schema, NamedSchemas
from .repository import (
    FlatDictRepository,
    SchemaRepositoryError,
    AbstractSchemaRepository,
)
from .const import AVRO_TYPES
from ._schema_common import (
    PRIMITIVES,
    UnknownType,
    SchemaParseException,
    RESERVED_PROPERTIES,
    OPTIONAL_FIELD_PROPERTIES,
    RESERVED_FIELD_PROPERTIES,
    JAVA_FINGERPRINT_MAPPING,
    FINGERPRINT_ALGORITHMS,
    RABIN_64,
    rabin_fingerprint,
)

SYMBOL_REGEX = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")
NO_DEFAULT = object()


def _get_name_and_record_counts_from_union(schema: List[Schema]) -> Tuple[int, int]:
    record_type_count = 0
    named_type_count = 0
    for s in schema:
        extracted_type = extract_record_type(s)
        if extracted_type == "record":
            record_type_count += 1
            named_type_count += 1
        elif extracted_type == "enum" or extracted_type == "fixed":
            named_type_count += 1
        elif extracted_type not in AVRO_TYPES:
            named_type_count += 1
            # There should probably be extra checks to see if this simple name
            # is actually a record, but the current behavior doesn't do the
            # check and just assumes it is or could be a record
            record_type_count += 1

    return named_type_count, record_type_count


def is_single_record_union(schema: List[Schema]) -> bool:
    return _get_name_and_record_counts_from_union(schema)[1] == 1


def is_single_name_union(schema: List[Schema]) -> bool:
    return _get_name_and_record_counts_from_union(schema)[0] == 1


def extract_record_type(schema: Schema) -> str:
    if isinstance(schema, dict):
        return schema["type"]

    if isinstance(schema, list):
        return "union"

    return schema


def extract_logical_type(schema: Schema) -> Optional[str]:
    if not isinstance(schema, dict):
        return None
    d_schema = schema
    rt = d_schema["type"]
    lt = d_schema.get("logicalType")
    if lt:
        # TODO: Building this string every time is going to be relatively slow.
        return f"{rt}-{lt}"
    return None


def fullname(schema: DictSchema) -> str:
    """Returns the fullname of a schema

    Parameters
    ----------
    schema
        Input schema


    Example::

        from fastavro.schema import fullname

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

        fname = fullname(schema)
        assert fname == "test.Weather"
    """
    return schema_name(schema, "")[1]


def schema_name(schema: DictSchema, parent_ns: str) -> Tuple[str, str]:
    try:
        name = schema["name"]
    except KeyError:
        raise SchemaParseException(
            f'"name" is a required field missing from the schema: {schema}'
        )

    namespace = schema.get("namespace", parent_ns)
    if "." in name:
        return name.rsplit(".", 1)[0], name
    elif namespace:
        return namespace, f"{namespace}.{name}"
    else:
        return "", name


def expand_schema(schema: Schema) -> Schema:
    """Returns a schema where all named types are expanded to their real schema

    NOTE: The output of this function produces a schema that can include
    multiple definitions of the same named type (as per design) which are not
    valid per the avro specification. Therefore, the output of this should not
    be passed to the normal `writer`/`reader` functions as it will likely
    result in an error.

    Parameters
    ----------
    schema: dict
        Input schema


    Example::

        from fastavro.schema import expand_schema

        original_schema = {
            "name": "MasterSchema",
            "namespace": "com.namespace.master",
            "type": "record",
            "fields": [{
                "name": "field_1",
                "type": {
                    "name": "Dependency",
                    "namespace": "com.namespace.dependencies",
                    "type": "record",
                    "fields": [
                        {"name": "sub_field_1", "type": "string"}
                    ]
                }
            }, {
                "name": "field_2",
                "type": "com.namespace.dependencies.Dependency"
            }]
        }

        expanded_schema = expand_schema(original_schema)

        assert expanded_schema == {
            "name": "com.namespace.master.MasterSchema",
            "type": "record",
            "fields": [{
                "name": "field_1",
                "type": {
                    "name": "com.namespace.dependencies.Dependency",
                    "type": "record",
                    "fields": [
                        {"name": "sub_field_1", "type": "string"}
                    ]
                }
            }, {
                "name": "field_2",
                "type": {
                    "name": "com.namespace.dependencies.Dependency",
                    "type": "record",
                    "fields": [
                        {"name": "sub_field_1", "type": "string"}
                    ]
                }
            }]
        }
    """
    return parse_schema(schema, expand=True, _write_hint=False)


def parse_schema(
    schema: Schema,
    named_schemas: Optional[NamedSchemas] = None,
    *,
    expand: bool = False,
    _write_hint: bool = True,
    _force: bool = False,
    _ignore_default_error: bool = False,
) -> Schema:
    """Returns a parsed avro schema

    It is not necessary to call parse_schema but doing so and saving the parsed
    schema for use later will make future operations faster as the schema will
    not need to be reparsed.

    Parameters
    ----------
    schema
        Input schema
    named_schemas
        Dictionary of named schemas to their schema definition
    expand
        If true, named schemas will be fully expanded to their true schemas
        rather than being represented as just the name. This format should be
        considered an output only and not passed in to other reader/writer
        functions as it does not conform to the avro specification and will
        likely cause an exception
    _write_hint
        Internal API argument specifying whether or not the __fastavro_parsed
        marker should be added to the schema
    _force
        Internal API argument. If True, the schema will always be parsed even
        if it has been parsed and has the __fastavro_parsed marker
    _ignore_default_error
        Internal API argument. If True, when a union has the wrong default
        value, an error will not be raised.


    Example::

        from fastavro import parse_schema
        from fastavro import writer

        parsed_schema = parse_schema(original_schema)
        with open('weather.avro', 'wb') as out:
            writer(out, parsed_schema, records)


    Sometimes you might have two schemas where one schema references another.
    For the sake of example, let's assume you have a `Parent` schema that
    references a `Child` schema`. If you were to try to parse the parent schema
    on its own, you would get an exception because the child schema isn't
    defined. To accommodate this, we can use the `named_schemas` argument to pass
    a shared dictionary when parsing both of the schemas. The dictionary will
    get populated with the necessary schema references to make parsing possible.
    For example::

        from fastavro import parse_schema

        named_schemas = {}
        parsed_child = parse_schema(child_schema, named_schemas)
        parsed_parent = parse_schema(parent_schema, named_schemas)
    """
    if named_schemas is None:
        named_schemas = {}

    if isinstance(schema, dict) and "__fastavro_parsed" in schema:
        if "__named_schemas" in schema:
            for key, value in schema["__named_schemas"].items():
                named_schemas[key] = value
        else:
            # Some old schemas might only have __fastavro_parsed and not
            # __named_schemas since that came later. For these schemas, we need
            # to re-parse the schema to handle named types
            return _parse_schema(
                schema,
                "",
                expand,
                _write_hint,
                set(),
                named_schemas,
                NO_DEFAULT,
                _ignore_default_error,
            )

    if _force or expand:
        return _parse_schema(
            schema,
            "",
            expand,
            _write_hint,
            set(),
            named_schemas,
            NO_DEFAULT,
            _ignore_default_error,
        )
    elif isinstance(schema, dict) and "__fastavro_parsed" in schema:
        return schema
    elif isinstance(schema, list):
        # If we are given a list we should make sure that the immediate sub
        # schemas have the hint in them
        return [
            parse_schema(
                s,
                named_schemas,
                expand=expand,
                _write_hint=_write_hint,
                _force=_force,
                _ignore_default_error=_ignore_default_error,
            )
            for s in schema
        ]
    else:
        return _parse_schema(
            schema,
            "",
            expand,
            _write_hint,
            set(),
            named_schemas,
            NO_DEFAULT,
            _ignore_default_error,
        )


def _raise_default_value_error(
    default: Any, schema_type: Any, ignore_default_error: bool
):
    if ignore_default_error:
        return
    elif isinstance(schema_type, list):
        text = f"a schema in union with type: {schema_type}"
    else:
        text = f"schema type: {schema_type}"

    raise SchemaParseException(f"Default value <{default}> must match {text}")


def _maybe_float(value: Any) -> Any:
    try:
        return float(value)
    except (TypeError, ValueError):
        return value


def _default_matches_schema(default: Any, schema: Schema) -> bool:
    # TODO: Consider using the validate functions here
    if (
        (schema == "null" and default is not None)
        or (schema == "boolean" and not isinstance(default, bool))
        or (schema == "string" and not isinstance(default, str))
        or (schema == "bytes" and not isinstance(default, str))
        or (schema == "double" and not isinstance(_maybe_float(default), float))
        or (schema == "float" and not isinstance(_maybe_float(default), float))
        or (schema == "int" and not isinstance(default, int))
        or (schema == "long" and not isinstance(default, int))
    ):
        return False
    return True


def _parse_schema(
    schema: Schema,
    namespace: str,
    expand: bool,
    _write_hint: bool,
    names: Set[str],
    named_schemas: NamedSchemas,
    default: Any,
    ignore_default_error: bool,
) -> Schema:
    # union schemas
    if isinstance(schema, list):
        parsed_schemas = [
            _parse_schema(
                s,
                namespace,
                expand,
                False,
                names,
                named_schemas,
                NO_DEFAULT,
                ignore_default_error,
            )
            for s in schema
        ]
        if default is not NO_DEFAULT:
            for s in parsed_schemas:
                if _default_matches_schema(default, s):
                    break
            else:
                _raise_default_value_error(default, schema, ignore_default_error)
        return parsed_schemas

    # string schemas; this could be either a named schema or a primitive type
    elif not isinstance(schema, dict):
        if schema in PRIMITIVES:
            if default is not NO_DEFAULT:
                if not _default_matches_schema(default, schema):
                    _raise_default_value_error(default, schema, ignore_default_error)
            return schema

        if "." not in schema and namespace:
            schema = namespace + "." + schema

        if schema not in named_schemas:
            raise UnknownType(schema)

        if expand and "name" in named_schemas[schema]:
            # If `name` is in the schema, it has been fully resolved and so we
            # can include the full schema. If `name` is not in the schema yet,
            # then we are still recursing that schema and must use the named
            # schema or else we will have infinite recursion when printing the
            # final schema
            return named_schemas[schema]
        return schema

    else:
        # Remaining valid schemas must be dict types
        schema_type = schema["type"]

        parsed_schema = {
            key: value
            for key, value in schema.items()
            if key not in RESERVED_PROPERTIES
        }
        parsed_schema["type"] = schema_type

        if "doc" in schema:
            parsed_schema["doc"] = schema["doc"]

        # Correctness checks for logical types
        logical_type = parsed_schema.get("logicalType")
        if logical_type == "decimal":
            scale = parsed_schema.get("scale")
            if scale and (not isinstance(scale, int) or scale < 0):
                raise SchemaParseException(
                    f"decimal scale must be a positive integer, not {scale}"
                )

            precision = parsed_schema.get("precision")
            if precision:
                if not isinstance(precision, int) or precision <= 0:
                    raise SchemaParseException(
                        "decimal precision must be a positive integer, "
                        + f"not {precision}"
                    )
                if schema_type == "fixed":
                    # https://avro.apache.org/docs/current/spec.html#Decimal
                    size = schema["size"]
                    max_precision = int(math.floor(math.log10(2) * (8 * size - 1)))
                    if precision > max_precision:
                        raise SchemaParseException(
                            f"decimal precision of {precision} doesn't fit "
                            + f"into array of length {size}"
                        )

            if scale and precision and precision < scale:
                raise SchemaParseException(
                    "decimal scale must be less than or equal to "
                    + f"the precision of {precision}"
                )

        if schema_type == "array":
            parsed_schema["items"] = _parse_schema(
                schema["items"],
                namespace,
                expand,
                False,
                names,
                named_schemas,
                NO_DEFAULT,
                ignore_default_error,
            )
            if default is not NO_DEFAULT and not isinstance(default, list):
                _raise_default_value_error(default, schema_type, ignore_default_error)

        elif schema_type == "map":
            parsed_schema["values"] = _parse_schema(
                schema["values"],
                namespace,
                expand,
                False,
                names,
                named_schemas,
                NO_DEFAULT,
                ignore_default_error,
            )
            if default is not NO_DEFAULT and not isinstance(default, dict):
                _raise_default_value_error(default, schema_type, ignore_default_error)

        elif schema_type == "enum":
            _, fullname = schema_name(schema, namespace)
            if fullname in names:
                raise SchemaParseException(f"redefined named type: {fullname}")
            names.add(fullname)

            _validate_enum_symbols(schema)

            if default is not NO_DEFAULT and not isinstance(default, str):
                _raise_default_value_error(default, schema_type, ignore_default_error)

            named_schemas[fullname] = parsed_schema

            parsed_schema["name"] = fullname
            parsed_schema["symbols"] = schema["symbols"]

        elif schema_type == "fixed":
            _, fullname = schema_name(schema, namespace)
            if fullname in names:
                raise SchemaParseException(f"redefined named type: {fullname}")
            names.add(fullname)

            if default is not NO_DEFAULT and not isinstance(default, str):
                _raise_default_value_error(default, schema_type, ignore_default_error)

            named_schemas[fullname] = parsed_schema

            parsed_schema["name"] = fullname
            parsed_schema["size"] = schema["size"]

        elif schema_type == "record" or schema_type == "error":
            # records
            namespace, fullname = schema_name(schema, namespace)
            if fullname in names:
                raise SchemaParseException(f"redefined named type: {fullname}")
            names.add(fullname)

            if default is not NO_DEFAULT and not isinstance(default, dict):
                _raise_default_value_error(default, schema_type, ignore_default_error)

            named_schemas[fullname] = parsed_schema

            fields = []
            for field in schema.get("fields", []):
                fields.append(
                    parse_field(
                        field,
                        namespace,
                        expand,
                        names,
                        named_schemas,
                        ignore_default_error,
                    )
                )

            parsed_schema["name"] = fullname
            parsed_schema["fields"] = fields

            # Hint that we have parsed the record
            if _write_hint:
                # Make a copy of parsed_schema so that we don't have a cyclical
                # reference. Using deepcopy is pretty slow, and we don't need a
                # true deepcopy so this works good enough
                named_schemas[fullname] = {k: v for k, v in parsed_schema.items()}

                parsed_schema["__fastavro_parsed"] = True
                parsed_schema["__named_schemas"] = named_schemas

        elif schema_type in PRIMITIVES:
            parsed_schema["type"] = schema_type
            if default is not NO_DEFAULT:
                if (
                    (schema_type == "null" and default is not None)
                    or (schema_type == "boolean" and not isinstance(default, bool))
                    or (schema_type == "string" and not isinstance(default, str))
                    or (schema_type == "bytes" and not isinstance(default, str))
                    or (schema_type == "double" and not isinstance(default, float))
                    or (schema_type == "float" and not isinstance(default, float))
                    or (schema_type == "int" and not isinstance(default, int))
                    or (schema_type == "long" and not isinstance(default, int))
                ):
                    _raise_default_value_error(
                        default, schema_type, ignore_default_error
                    )

        else:
            raise UnknownType(schema)

        return parsed_schema


def parse_field(field, namespace, expand, names, named_schemas, ignore_default_error):
    parsed_field = {
        key: value
        for key, value in field.items()
        if key not in RESERVED_FIELD_PROPERTIES
    }

    for prop in OPTIONAL_FIELD_PROPERTIES:
        if prop in field:
            parsed_field[prop] = field[prop]

    # Aliases must be a list
    aliases = parsed_field.get("aliases", [])
    if not isinstance(aliases, list):
        raise SchemaParseException(f"aliases must be a list, not {aliases}")

    default = field.get("default", NO_DEFAULT)

    parsed_field["name"] = field["name"]
    parsed_field["type"] = _parse_schema(
        field["type"],
        namespace,
        expand,
        False,
        names,
        named_schemas,
        default,
        ignore_default_error,
    )

    return parsed_field


def load_schema(
    schema_path: str,
    *,
    repo: Optional[AbstractSchemaRepository] = None,
    named_schemas: Optional[NamedSchemas] = None,
    _write_hint: bool = True,
    _injected_schemas: Optional[Set[str]] = None,
) -> Schema:
    """Returns a schema loaded from repository.

    Will recursively load referenced schemas attempting to load them from
    same repository, using `schema_path` as schema name.

    If `repo` is not provided, `FlatDictRepository` is used.
    `FlatDictRepository` will try to load schemas from the same directory
    assuming files are named with the convention `<full_name>.avsc`.

    Parameters
    ----------
    schema_path
        Full schema name, or path to schema file if default repo is used.
    repo:
        Schema repository instance.
    named_schemas
        Dictionary of named schemas to their schema definition
    _write_hint
        Internal API argument specifying whether or not the __fastavro_parsed
        marker should be added to the schema
    _injected_schemas
        Internal API argument. Set of names that have been injected


    Consider the following example with default FlatDictRepository...


    namespace.Parent.avsc::

        {
            "type": "record",
            "name": "Parent",
            "namespace": "namespace",
            "fields": [
                {
                    "name": "child",
                    "type": "Child"
                }
            ]
        }


    namespace.Child.avsc::

        {
            "type": "record",
            "namespace": "namespace",
            "name": "Child",
            "fields": []
        }


    Code::

        from fastavro.schema import load_schema

        parsed_schema = load_schema("namespace.Parent.avsc")
    """
    schema_name = schema_path
    if repo is None:
        file_dir, file_name = path.split(schema_path)
        schema_name, _file_ext = path.splitext(file_name)
        repo = FlatDictRepository(file_dir)

    if named_schemas is None:
        named_schemas = {}

    if _injected_schemas is None:
        _injected_schemas = set()

    return _load_schema(
        schema_name, repo, named_schemas, _write_hint, _injected_schemas
    )


def _load_schema(schema_name, repo, named_schemas, write_hint, injected_schemas):
    try:
        schema = repo.load(schema_name)
        return _parse_schema_with_repo(
            schema,
            repo,
            named_schemas,
            write_hint,
            injected_schemas,
        )
    except SchemaRepositoryError as error:
        raise error


def _parse_schema_with_repo(
    schema,
    repo,
    named_schemas,
    write_hint,
    injected_schemas,
):
    try:
        schema_copy = deepcopy(named_schemas)
        return parse_schema(
            schema,
            named_schemas=named_schemas,
            _write_hint=write_hint,
        )
    except UnknownType as error:
        missing_subject = error.name
        try:
            sub_schema = _load_schema(
                missing_subject,
                repo,
                named_schemas=schema_copy,
                write_hint=False,
                injected_schemas=injected_schemas,
            )
        except SchemaRepositoryError:
            raise error

        if sub_schema["name"] not in injected_schemas:
            injected_schema = _inject_schema(schema, sub_schema)
            if isinstance(schema, str) or isinstance(schema, list):
                schema = injected_schema[0]
            injected_schemas.add(sub_schema["name"])
        return _parse_schema_with_repo(
            schema, repo, schema_copy, write_hint, injected_schemas
        )


def _inject_schema(outer_schema, inner_schema, namespace="", is_injected=False):
    # Once injected, we can stop checking to see if we need to inject since it
    # should only be done once at most
    if is_injected is True:
        return outer_schema, is_injected

    # union schemas
    if isinstance(outer_schema, list):
        union = []
        for each_schema in outer_schema:
            if is_injected:
                union.append(each_schema)
            else:
                return_schema, injected = _inject_schema(
                    each_schema, inner_schema, namespace, is_injected
                )
                union.append(return_schema)
                if injected is True:
                    is_injected = injected
        return union, is_injected

    # string schemas; this could be either a named schema or a primitive type
    elif not isinstance(outer_schema, dict):
        if outer_schema in PRIMITIVES:
            return outer_schema, is_injected

        if "." not in outer_schema and namespace:
            outer_schema = namespace + "." + outer_schema

        if outer_schema == inner_schema["name"]:
            return inner_schema, True
        else:
            # Hit a named schema that has already been loaded previously. Return
            # the outer_schema so we keep looking
            return outer_schema, is_injected
    else:
        # Remaining valid schemas must be dict types
        schema_type = outer_schema["type"]

        if schema_type == "array":
            return_schema, injected = _inject_schema(
                outer_schema["items"], inner_schema, namespace, is_injected
            )
            outer_schema["items"] = return_schema
            return outer_schema, injected

        elif schema_type == "map":
            return_schema, injected = _inject_schema(
                outer_schema["values"], inner_schema, namespace, is_injected
            )
            outer_schema["values"] = return_schema
            return outer_schema, injected

        elif schema_type == "enum":
            return outer_schema, is_injected

        elif schema_type == "fixed":
            return outer_schema, is_injected

        elif schema_type == "record" or schema_type == "error":
            # records
            namespace, _ = schema_name(outer_schema, namespace)
            fields = []
            for field in outer_schema.get("fields", []):
                if is_injected:
                    fields.append(field)
                else:
                    return_schema, injected = _inject_schema(
                        field["type"], inner_schema, namespace, is_injected
                    )
                    field["type"] = return_schema
                    fields.append(field)

                    if injected is True:
                        is_injected = injected
            if fields:
                outer_schema["fields"] = fields

            return outer_schema, is_injected

        elif schema_type in PRIMITIVES:
            return outer_schema, is_injected

        else:
            raise Exception(
                "Internal error; "
                + "You should raise an issue in the fastavro github repository"
            )


def load_schema_ordered(
    ordered_schemas: List[str], *, _write_hint: bool = True
) -> Schema:
    """Returns a schema loaded from a list of schemas.

    The list of schemas should be ordered such that any dependencies are listed
    before any other schemas that use those dependencies. For example, if schema
    `A` depends on schema `B` and schema B depends on schema `C`, then the list
    of schemas should be [C, B, A].

    Parameters
    ----------
    ordered_schemas
        List of paths to schemas
    _write_hint
        Internal API argument specifying whether or not the __fastavro_parsed
        marker should be added to the schema


    Consider the following example...


    Parent.avsc::

        {
            "type": "record",
            "name": "Parent",
            "namespace": "namespace",
            "fields": [
                {
                    "name": "child",
                    "type": "Child"
                }
            ]
        }


    namespace.Child.avsc::

        {
            "type": "record",
            "namespace": "namespace",
            "name": "Child",
            "fields": []
        }


    Code::

        from fastavro.schema import load_schema_ordered

        parsed_schema = load_schema_ordered(
            ["path/to/namespace.Child.avsc", "path/to/Parent.avsc"]
        )
    """
    loaded_schemas = []
    named_schemas: NamedSchemas = {}
    for idx, schema_path in enumerate(ordered_schemas):
        # _write_hint is always False except maybe the outer most schema
        _last = _write_hint if idx + 1 == len(ordered_schemas) else False
        schema = load_schema(
            schema_path, named_schemas=named_schemas, _write_hint=_last
        )
        loaded_schemas.append(schema)

    top_first_order = loaded_schemas[::-1]
    outer_schema = top_first_order.pop(0)

    while top_first_order:
        sub_schema = top_first_order.pop(0)
        _inject_schema(outer_schema, sub_schema)

    return outer_schema


def to_parsing_canonical_form(schema: Schema) -> str:
    """Returns a string represening the parsing canonical form of the schema.

    For more details on the parsing canonical form, see here:
    https://avro.apache.org/docs/current/spec.html#Parsing+Canonical+Form+for+Schemas

    Parameters
    ----------
    schema
        Schema to transform

    """
    fo = StringIO()
    _to_parsing_canonical_form(parse_schema(schema), fo)
    return fo.getvalue()


def _to_parsing_canonical_form(schema, fo):
    # union schemas
    if isinstance(schema, list):
        fo.write("[")
        for idx, s in enumerate(schema):
            if idx != 0:
                fo.write(",")
            _to_parsing_canonical_form(s, fo)
        fo.write("]")

    # string schemas; this could be either a named schema or a primitive type
    elif not isinstance(schema, dict):
        fo.write(f'"{schema}"')

    else:
        # Remaining valid schemas must be dict types
        schema_type = schema["type"]

        if schema_type == "array":
            fo.write(f'{{"type":"{schema_type}","items":')
            _to_parsing_canonical_form(schema["items"], fo)
            fo.write("}")

        elif schema_type == "map":
            fo.write(f'{{"type":"{schema_type}","values":')
            _to_parsing_canonical_form(schema["values"], fo)
            fo.write("}")

        elif schema_type == "enum":
            name = schema["name"]
            fo.write(f'{{"name":"{name}","type":"{schema_type}","symbols":[')

            for idx, symbol in enumerate(schema["symbols"]):
                if idx != 0:
                    fo.write(",")
                fo.write(f'"{symbol}"')
            fo.write("]}")

        elif schema_type == "fixed":
            name = schema["name"]
            size = schema["size"]
            fo.write(f'{{"name":"{name}","type":"{schema_type}","size":{size}}}')

        elif schema_type == "record" or schema_type == "error":
            name = schema["name"]
            fo.write(f'{{"name":"{name}","type":"record","fields":[')

            for idx, field in enumerate(schema["fields"]):
                if idx != 0:
                    fo.write(",")
                name = field["name"]
                fo.write(f'{{"name":"{name}","type":')
                _to_parsing_canonical_form(field["type"], fo)
                fo.write("}")
            fo.write("]}")

        elif schema_type in PRIMITIVES:
            fo.write(f'"{schema_type}"')


def fingerprint(parsing_canonical_form: str, algorithm: str) -> str:
    """Returns a string represening a fingerprint/hash of the parsing canonical
    form of a schema.

    For more details on the fingerprint, see here:
    https://avro.apache.org/docs/current/spec.html#schema_fingerprints

    Parameters
    ----------
    parsing_canonical_form
        The parsing canonical form of a schema
    algorithm
        The hashing algorithm

    """
    if algorithm not in FINGERPRINT_ALGORITHMS:
        raise ValueError(
            f"Unknown schema fingerprint algorithm {algorithm}. "
            + f"Valid values include: {FINGERPRINT_ALGORITHMS}"
        )

    # Fix Java names
    algorithm = JAVA_FINGERPRINT_MAPPING.get(algorithm, algorithm)

    if algorithm == RABIN_64:
        return rabin_fingerprint(parsing_canonical_form.encode())

    h = hashlib.new(algorithm, parsing_canonical_form.encode())
    return h.hexdigest()


def _validate_enum_symbols(schema):
    symbols = schema["symbols"]
    for symbol in symbols:
        if not isinstance(symbol, str) or not SYMBOL_REGEX.fullmatch(symbol):
            raise SchemaParseException(
                "Every symbol must match the regular expression [A-Za-z_][A-Za-z0-9_]*"
            )
    if len(symbols) != len(set(symbols)):
        raise SchemaParseException("All symbols in an enum must be unique")

    if "default" in schema and schema["default"] not in symbols:
        raise SchemaParseException("Default value for enum must be in symbols list")
