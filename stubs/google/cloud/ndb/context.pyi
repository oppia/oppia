from abc import ABCMeta
from typing import ContextManager

# Typing of Context's methods is taken from https://github.com/python/
# typeshed/blob/master/stubs/google-cloud-ndb/google/cloud/ndb/context.pyi
class Context(ContextManager[None], metaclass=ABCMeta):
    def clear_cache(self) -> None: ...
