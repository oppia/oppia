import datetime
import io
from re import Pattern
from typing import Any, Callable, Dict, List, Optional, Tuple, Union


class Request:
    uri: str
    body: bytes
    environ: Dict[str, Any]
    route_kwargs: Dict[str, Any]
    path: str
    cookies: Dict[str, str] = ...
    headers: Dict[str, str] = ...
    GET: Dict[str, Any]
    method: str
    params: Dict[str, str]
    domain: str

    def arguments(self) -> List[str]: ...
    def get(self, value: str) -> Any: ...

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

class ResponseHeaders(Dict[str, Any]):
    def get_all(self, key: str) -> List[str]: ...

class Response:
    headers: ResponseHeaders = ...
    content_type: str
    charset: str
    cache_control: Any
    pragma: Any
    expires: Any
    body_file: io.BytesIO
    status: int
    body: bytes

    def write(self, content: Union[bytes, str]) -> None: ...
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
    debug: bool

    def __init__(
        self,
        routes: List[Route] = ...,
        debug: bool = ...,
        config: Dict[str, Any] = ...
    ) -> None: ...

    def __call__(
        self,
        environ: Dict[str, str],
        start_response: Response
    ) -> Response: ...

class Route:
    def __init__(
        self,
        template: Union[str, Pattern[str]],
        handler: Callable[..., object],
        *,
        name: str = ...
    ) -> None: ...

class RequestHandler:
    request: Request
    response: Response
    app: WSGIApplication

    def error(self, code: int) -> None: ...
    def dispatch(self) -> None: ...
    def initialize(self, request: Request, response: Response) -> None: ...

    @classmethod
    def write(cls, content: bytes) -> None: ...
    @classmethod
    def redirect(
        cls,
        uri: str,
        permanent: bool = False,
        abort: bool = False,
        code: Optional[int] = None,
        body: Any = None
    ) -> Response: ...
