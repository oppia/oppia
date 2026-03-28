# Stubs for requests_mock.adapter

from http.cookiejar import CookieJar
from io import IOBase
from typing import Any, Callable, Dict, List, NewType, Optional, Pattern, Type, TypeVar, Union

from requests import Response
from requests.adapters import BaseAdapter
from urllib3.response import HTTPResponse

from requests_mock.request import Request
from requests_mock.response import Context

AnyMatcher = NewType("AnyMatcher", object)

ANY: AnyMatcher = ...

T = TypeVar('T')
Callback = Callable[[Request, Context], T]
Matcher = Callable[[Request], Optional[Response]]
AdditionalMatcher = Callable[[Request], bool]

class _RequestHistoryTracker:
    request_history: List[Request] = ...
    def __init__(self) -> None: ...
    @property
    def last_request(self) -> Optional[Request]: ...
    @property
    def called(self) -> bool: ...
    @property
    def called_once(self) -> bool: ...
    @property
    def call_count(self) -> int: ...

class _RunRealHTTP(Exception): ...

class _Matcher(_RequestHistoryTracker):
    def __init__(
        self, 
        method: Any, 
        url: Any, 
        responses: Any, 
        complete_qs: Any, 
        request_headers: Any, 
        additional_matcher: AdditionalMatcher, 
        real_http: Any, 
        case_sensitive: Any
    ) -> None: ...
    def __call__(self, request: Request) -> Optional[Response]: ...
    
class Adapter(BaseAdapter, _RequestHistoryTracker):
    def __init__(self, case_sensitive: bool = ...) -> None: ...
    def register_uri(
        self,
        method: Union[str, AnyMatcher],
        url: Union[str, Pattern[str], AnyMatcher],
        response_list: Optional[List[Dict[str, Any]]] = ...,
        *,
        request_headers: Dict[str, str] = ...,
        complete_qs: bool = ...,
        status_code: int = ...,
        reason: str = ...,
        headers: Dict[str, str] = ...,
        cookies: Union[CookieJar, Dict[str, str]] = ...,
        json: Union[Any, Callback[Any]] = ...,
        text: Union[str, Callback[str]] = ...,
        content: Union[bytes, Callback[bytes]] = ...,
        body: Union[IOBase, Callback[IOBase]] = ...,
        raw: Union[HTTPResponse, Callback[HTTPResponse]] = ...,
        exc: Union[Exception, Type[Exception]] = ...,
        additional_matcher: AdditionalMatcher = ...,
        **kwargs: Any
    ) -> _Matcher: ...
    def add_matcher(self, matcher: Matcher) -> None: ...
    def reset(self) -> None: ...
