import datetime
from typing import Dict, Optional, Text, Union


class Request:
    cookies: Dict[Text, Text] = ...
    headers: Dict[Text, Text] = ...

class Response:
    def set_cookie(
            self,
            key: Text,
            value: Text = ...,
            max_age: Union[datetime.timedelta, float] = ...,
            secure: Optional[bool] = ...,
            overwrite: Optional[bool] = ...,
            httponly: Optional[bool] = ...,
            path: Text = ...,
            domain: Optional[Text] = ...,
            comment: Optional[Text] = ...,
    ) -> None: ...

    def delete_cookie(
            self,
            key: Text,
            path: Text = ...,
            domain: Optional[Text] = ...
    ) -> None: ...
