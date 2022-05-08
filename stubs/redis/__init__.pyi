from .client import Redis
from .core import _StrType

StrictRedis = Redis[_StrType]
