from typing import (
    Any, Awaitable, Dict, Generic, Iterable, Iterator, List, Mapping,
    Optional, TypeVar, Union
)

_Key = Union[str, bytes]
_Value = Union[bytes, float, int, str]
_StrType = TypeVar("_StrType", bound = Union[str, bytes])


class BasicKeyCommands(Generic[_StrType]):
    def delete(self, *names: _Key) -> int: ...
    def get(self, name: _Key) -> Optional[_StrType]: ...
    def mset(self, mapping: Dict[str, str]) -> bool: ...
    def mget(
        self,
        keys: Union[_Key, Iterable[_Key]],
        *args: _Key
    ) -> List[Optional[str]]: ...


class HashCommands(Generic[_StrType]):
    def hgetall(self, name: _Key) -> Dict[_StrType, _StrType]: ...
    def hset(
        self,
        name: str,
        key: Optional[str] = None,
        value: Optional[str] = None,
        mapping: Mapping[bytes, bytes] = ...,
    ) -> Union[Awaitable[int], int]:...


class ManagementCommands:
    def flushdb(self, asynchronous: bool = ..., **kwargs: Any) -> bool: ...
    def memory_stats(self, **kwargs: Any) -> Dict[str, int]: ...


class ScanCommands(Generic[_StrType]):
    def scan_iter(
        self,
        match: Optional[_Key] = ...,
        count: Optional[int] = ...,
        _type: Optional[str] = ...,
        **kwargs: Any
    ) -> Iterator[_StrType]: ...


class DataAccessCommands(
    BasicKeyCommands[_StrType],
    HashCommands[_StrType],
    ScanCommands[_StrType],
): ...


class CoreCommands(
    DataAccessCommands[_StrType],
    ManagementCommands,
): ...
