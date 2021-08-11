from typing import Any, Optional, Sequence, Text, Tuple
from . import credentials
from . import transport

def default(
        scopes: Sequence[Text] = ...,
        request: transport.Request = ...,
        quota_project_id: Optional[Text] = ...,
        default_scopes: Optional[Sequence[Text]] = ...,
) -> Tuple[credentials.Credentials, Optional[Text]]: ...
