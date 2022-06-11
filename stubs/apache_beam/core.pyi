from .ptransform import PTransform

from typing import Any, Callable, Dict, Iterable, Union


class DoFn():...


class Create(PTransform):
    def __init__(
        self,
        values: Union[
            Dict[str, Any],
            Iterable[Any]
        ],
        reshuffle: bool = True
    ) -> None: ...

def Map(fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Any: ...

def Filter(fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Any: ...