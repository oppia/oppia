from typing import List, Optional, Set

from .repository import AbstractSchemaRepository
from .types import Schema, NamedSchemas

FINGERPRINT_ALGORITHMS: str

def load_schema(
    schema_path: str,
    *,
    repo: Optional[AbstractSchemaRepository] = ...,
    named_schemas: Optional[NamedSchemas] = ...,
    _write_hint: bool = ...,
    _injected_schemas: Optional[Set[str]] = ...,
) -> Schema: ...
def parse_schema(
    schema: Schema,
    named_schemas: Optional[NamedSchemas] = ...,
    *,
    expand: bool = ...,
    _write_hint: bool = ...,
    _force: bool = ...,
    _ignore_default_error: bool = ...,
) -> Schema: ...
def fullname(schema: Schema) -> str: ...
def expand_schema(schema: Schema) -> Schema: ...
def load_schema_ordered(
    ordered_schemas: List[str], *, _write_hint: bool = ...
) -> Schema: ...
def to_parsing_canonical_form(schema: Schema) -> str: ...
def fingerprint(parsing_canonical_form: str, algorithm: str) -> str: ...
