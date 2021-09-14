from typing import ContextManager

class Client:

    def transaction(self) -> ContextManager[None]: ...
