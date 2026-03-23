from typing import Any, Iterable

from .types import Schema

def validate(
    datum: Any,
    schema: Schema,
    field: str = ...,
    raise_errors: bool = ...,
    strict: bool = ...,
) -> bool: ...
def validate_many(
    records: Iterable[Any],
    schema: Schema,
    raise_errors: bool = ...,
    strict: bool = ...,
) -> bool: ...
