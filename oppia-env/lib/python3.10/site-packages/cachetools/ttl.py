import warnings

from . import TTLCache

warnings.warn(
    "cachetools.ttl is deprecated, please use cachetools.TTLCache", DeprecationWarning
)
