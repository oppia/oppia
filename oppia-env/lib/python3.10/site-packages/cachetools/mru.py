import warnings

from . import MRUCache

warnings.warn(
    "cachetools.mru is deprecated, please use cachetools.MRUCache", DeprecationWarning
)
