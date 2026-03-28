import warnings

from . import Cache

warnings.warn(
    "cachetools.cache is deprecated, please use cachetools.Cache", DeprecationWarning
)
