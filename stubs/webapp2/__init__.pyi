import datetime
from typing import Any, Dict, List, Optional, Text, Tuple, Union


class Request:
    cookies: Dict[Text, Text] = ...
    headers: Dict[Text, Text] = ...

    @classmethod
    def blank(
            cls,
            path: Text,
            environ: Dict[Text, Any] = ...,
            base_url: Text = ...,
            headers: List[Tuple[Text, Text]] = ...,
            POST: Dict[Text, Any] = ...,
            **kwargs: Any
    ) -> Request: ...

class ResponseHeaders:
    def get_all(self, key: Text) -> List[Text]: ...

class Response:
    headers: ResponseHeaders = ...
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
