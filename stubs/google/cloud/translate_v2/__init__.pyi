from typing import Dict, List, Optional, Text, Union
from google import auth

class Client(object):
    def __init__(
            self,
            credentials: auth.credentials.Credentials = ...
    ) -> None: ...
    def translate(
        self,
        values: Union[Text, List[Text]],
        target_language: Optional[Text] = ...,
        format_: Optional[Text] = ...,
        source_language: Optional[Text] = ...,
        customization_ids: Optional[Union[Text, List[Text]]] = ...,
        model: Optional[Text] = ...,
    ) -> Union[Dict[Text, Text], List[Dict[Text, Text]]]: ...
