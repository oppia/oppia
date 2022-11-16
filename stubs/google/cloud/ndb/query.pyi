from . import Cursor, Key, TYPE_MODEL, Property
from typing import (
    Any, Iterator, List, Literal, Optional, Sequence, TypeVar, Tuple, Union,
    overload)

_T = TypeVar('_T', covariant=True)

class QueryOptions: ...

class PropertyOrder:
    name: str
    reverse: bool
    def __neg__(self) -> PropertyOrder: ...

class RepeatedStructuredPropertyPredicate: ...

class ParameterizedThing: ...

class Parameter(ParameterizedThing): ...

class ParameterizedFunction(ParameterizedThing): ...

class Node: ...

class FalseNode(Node): ...

class ParameterNode(Node):
    _prop: str
    _op: str
    _param: str

class FilterNode(Node):
    _name: str
    _opsymbol: str
    _value: str

class ConjunctionNode(Node):
    def __iter__(self) -> Iterator[Node]: ...

class DisjunctionNode(Node): ...

AND = ConjunctionNode
OR = DisjunctionNode

class Query:
    kind: str
    filters: FilterNode
    ancestor: Key
    order_by: List[PropertyOrder]
    orders: List[PropertyOrder]
    project: str
    app: str
    namespace: str
    projection: List[Union[str, Property]]
    keys_only: bool
    offset: int
    limit: Optional[int]
    distinct_on: List[str]
    group_by: List[str]
    default_options: QueryOptions
    def __init__(self, **kwds: Any) -> None: ...
    def filter(self, *args: Any) -> Query: ...
    def iter(self, **kwargs: Any) -> Iterator[Any]: ...
    def order(self, *args: Any) -> Query: ...
    def __iter__(self) -> Iterator[Any]: ...
    @overload
    def fetch(
        self,
        limit: Optional[int] = ...,
        offset: Optional[int] = ...,
        projection: Optional[List[Property]] = ...,
        keys_only: Literal[False] = ...
    ) -> Sequence[TYPE_MODEL]: ...
    @overload
    def fetch(
        self,
        keys_only: Literal[True],
        limit: Optional[int] = ...
    ) -> Sequence[Key]: ...
    @overload
    def get(
        self, keys_only: Literal[False] = ..., **q_options: Any
    ) -> Optional[TYPE_MODEL]: ...
    @overload
    def get(
        self, keys_only: Literal[True], **q_options: Any
    ) -> Optional[Key]: ...
    def count(self, limit: Optional[int] = ..., **q_options: Any) -> int: ...
    @overload
    def fetch_page(
        self,
        page_size: int,
        start_cursor: Optional[Cursor],
    ) -> Tuple[Sequence[TYPE_MODEL], Cursor, bool]: ...
    @overload
    def fetch_page(
        self,
        page_size: int,
        start_cursor: Optional[Cursor],
        keys_only: Literal[False] = ...,
    ) -> Tuple[Sequence[TYPE_MODEL], Cursor, bool]: ...
    @overload
    def fetch_page(
        self,
        page_size: int,
        start_cursor: Cursor,
        keys_only: Literal[True],
    ) -> Tuple[Sequence[Key], Cursor, bool]: ...
