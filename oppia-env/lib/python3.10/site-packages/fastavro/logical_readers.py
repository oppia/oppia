try:
    from . import _logical_readers
except ImportError:
    from . import _logical_readers_py as _logical_readers  # type: ignore

LOGICAL_READERS = _logical_readers.LOGICAL_READERS

__all__ = ["LOGICAL_READERS"]
