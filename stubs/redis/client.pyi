from .core import CoreCommands as CoreCommands, _Key, _StrType

from typing import Any, Generic, List


class Redis(CoreCommands[_StrType]):
    def __init__(
        self,
        host: str = ...,
        port: int = ...,
        db: int = ...,
        decode_responses: bool = ...,
    ) -> None: ...
    def pipeline(
        self,
        transaction: bool = ...,
        shard_hint: Any = ...,
    ) -> Pipeline[_StrType]: ...


class Pipeline(Redis[_StrType], Generic[_StrType]):
    def hgetall(self, name: _Key) -> Pipeline[_StrType]: ...  # type: ignore[override]
    def execute(self, raise_on_error: bool = True) -> List[Any]: ...
