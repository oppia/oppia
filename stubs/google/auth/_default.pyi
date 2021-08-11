from typing import Any, Optional, Sequence, Tuple
from . import credentials
from . import transport

def default(
        scopes: Sequence[str] = ...,
        request: transport.Request = ...,
        quota_project_id: Optional[str] = ...,
        default_scopes: Optional[Sequence[str]] = ...,
) -> Tuple[credentials.Credentials, Optional[str]]: ...
