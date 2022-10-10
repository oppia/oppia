import datetime
from typing import Any, Dict, List, Optional, Tuple, Union


class Request:
    cookies: Dict[str, str] = ...
    headers: Dict[str, str] = ...

    @classmethod
    def blank(
            cls,
            path: str,
            environ: Dict[str, Any] = ...,
            base_url: str = ...,
            headers: List[Tuple[str, str]] = ...,
            POST: Dict[str, Any] = ...,
            **kwargs: Any
    ) -> Request: ...

class ResponseHeaders:
    def get_all(self, key: str) -> List[str]: ...

class Response:
    headers: ResponseHeaders = ...
    def set_cookie(
            self,
            key: str,
            value: str = ...,
            max_age: Union[datetime.timedelta, float] = ...,
            secure: Optional[bool] = ...,
            overwrite: Optional[bool] = ...,
            httponly: Optional[bool] = ...,
            path: str = ...,
            domain: Optional[str] = ...,
            comment: Optional[str] = ...,
    ) -> None: ...

    def delete_cookie(
            self,
            key: str,
            path: str = ...,
            domain: Optional[str] = ...
    ) -> None: ...

class WSGIApplication:
    def __init__(
            self,
            routes: List[Tuple[str, str]] = ...,
            debug: bool = ...,
            config: Dict[str, Any] = ...
    ) -> None: ...

    def __call__(
            self,
            environ: Dict[str, str],
            start_response: Response
    ) -> Response: ...
