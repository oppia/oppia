try:
    from . import _logical_writers
except ImportError:
    from . import _logical_writers_py as _logical_writers  # type: ignore

LOGICAL_WRITERS = _logical_writers.LOGICAL_WRITERS

__all__ = ["LOGICAL_WRITERS"]
