import warnings

from . import FIFOCache

warnings.warn(
    "cachetools.fifo is deprecated, please use cachetools.FIFOCache", DeprecationWarning
)
