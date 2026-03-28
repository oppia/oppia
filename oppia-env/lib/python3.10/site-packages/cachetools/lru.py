import warnings

from . import LRUCache

warnings.warn(
    "cachetools.lru is deprecated, please use cachetools.LRUCache", DeprecationWarning
)
