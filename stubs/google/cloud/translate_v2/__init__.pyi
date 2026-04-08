from google import auth
from typing import Dict, List, Optional, Union

class Client(object):
    def __init__(
        self, credentials: auth.credentials.Credentials = ...
    ) -> None: ...
    def translate(
        self,
        values: Union[str, List[str]],
        target_language: Optional[str] = ...,
        format_: Optional[str] = ...,
        source_language: Optional[str] = ...,
        customization_ids: Optional[Union[str, List[str]]] = ...,
        model: Optional[str] = ...,
    ) -> Union[Dict[str, str], List[Dict[str, str]]]: ...
