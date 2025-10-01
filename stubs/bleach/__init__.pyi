# stubs/bleach/__init__.pyi
from typing import Any, Iterable, Mapping

def clean(
    text: str,
    tags: Iterable[str] | None = ...,
    attributes: Mapping[str, Iterable[str]] | Iterable[str] | None = ...,
    styles: Iterable[str] | None = ...,
    protocols: Iterable[str] | None = ...,
    strip: bool = ...,
    strip_comments: bool = ...,
) -> str: ...

def linkify(
    text: str,
    callbacks: Any = ...,
    skip_tags: Iterable[str] | None = ...,
    parse_email: bool = ...
) -> str: ...
