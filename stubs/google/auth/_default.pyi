from typing import Any, Optional, Sequence, Text, Tuple
from . import credentials

def default(
        scopes: Sequence[Text] = ...,
        request:Any = ...,
        quota_project_id: Optional[Text] = ...,
        default_scopes: Optional[Sequence[Text]] = ...,
) -> Tuple[credentials.Credentials, Optional[Text]]: ...
