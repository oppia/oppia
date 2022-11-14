from typing import Generator, TextIO, TypeVar

T = TypeVar('T')


class Requirements:
    ...


class Distribution:
    project_name: str
    version: str

    def has_metadata(self, key: str) -> bool: ...
    def get_metadata(self, key: str) -> str: ...


def find_distributions(
    path_item: str, only: bool = False
) -> Generator[Distribution, None, None]: ...


def parse_requirements(
    strs: TextIO
) -> Generator[Requirements, None, None]: ...


def parse_version(v: T) -> T: ...
