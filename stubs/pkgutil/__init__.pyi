# Sources from stubs are taken: https://fossies.org/linux/pycharm/plugins/
# python-ce/helpers/typeshed/stdlib/pkgutil.pyi

from importlib.abc import Loader, PathEntryFinder
from typing import Iterable, Iterator, NamedTuple, Optional


class ModuleInfo(NamedTuple):
     module_finder: PathEntryFinder
     name: str
     ispkg: bool


def find_loader(fullname: str) -> Optional[Loader]: ...


def iter_modules(
    path: Optional[Iterable[str]] = ...,
    prefix: str = ...
) -> Iterator[ModuleInfo]: ...


def get_data(package: str, resource: str) -> bytes | None: ...
