from typing import Any, IO, Union

class YAMLError(Exception): ...
class Loader: ...

def load(
    stream: Union[str, bytes, IO[Any]],
    Loader: Any = ...
) -> Any: ...

def safe_load(
    stream: Union[str, bytes, IO[Any]]
) -> Any: ...

def dump(
    data: Any,
    stream: IO[str] | None = ...,
    Dumper: Any = ...,
    **kwargs: Any
) -> str: ...

def safe_dump(
    data: Any,
    stream: IO[str] | None = ...,
    **kwargs: Any
) -> str: ...
