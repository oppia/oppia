from __future__ import annotations

import collections.abc
import os
import typing


__all__ = ['ConfigSettings', 'Distribution', 'StrPath', 'SubprocessRunner']

ConfigSettings = collections.abc.Mapping[str, str | collections.abc.Sequence[str]]
Distribution = typing.Literal['sdist', 'wheel', 'editable']

StrPath = str | os.PathLike[str]

TYPE_CHECKING = False

if TYPE_CHECKING:
    from pyproject_hooks import SubprocessRunner
else:
    SubprocessRunner = collections.abc.Callable[
        [collections.abc.Sequence[str], str | None, collections.abc.Mapping[str, str] | None], None
    ]
