import warnings

from . import RRCache

warnings.warn(
    "cachetools.rr is deprecated, please use cachetools.RRCache", DeprecationWarning
)
