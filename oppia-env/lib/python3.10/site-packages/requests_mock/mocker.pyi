# Stubs for requests_mock.mocker

from json import JSONEncoder
from http.cookiejar import CookieJar
from io import IOBase
from typing import Any, Callable, Dict, List, Optional, Pattern, Type, TypeVar, Union, overload

from requests import Response, Session
from urllib3.response import HTTPResponse

from requests_mock.adapter import AnyMatcher, _Matcher, Callback, AdditionalMatcher
from requests_mock.request import Request

DELETE: str
GET: str
HEAD: str
OPTIONS: str
PATCH: str
POST: str
PUT: str

class MockerCore:
    case_sensitive: bool = ...
    def __init__(self, **kwargs: Any) -> None: ...
    def start(self) -> None: ...
    def stop(self) -> None: ...
    def add_matcher(self, matcher: Callable[[Request], Optional[Response]]) -> None: ...
    @property
    def request_history(self) -> List[Request]: ...
    @property
    def last_request(self) -> Optional[Request]: ...
    @property
    def called(self) -> bool: ...
    @property
    def called_once(self) -> bool: ...
    @property
    def call_count(self) -> int: ...
    def reset(self) -> None: ...
    def reset_mock(self) -> None: ...

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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def request(
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def get(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def head(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def options(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def post(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def put(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def patch(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

    def delete(
      self,
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
      json_encoder: Optional[Type[JSONEncoder]] = ...,
      **kwargs: Any,
    ) -> _Matcher: ...

_T = TypeVar('_T')
_CallableT = TypeVar("_CallableT", bound=Callable)

class Mocker(MockerCore):
    TEST_PREFIX: str = ...
    real_http: bool = ...

    def __init__(
      self,
      *,
      kw: str = ...,
      case_sensitive: bool = ...,
      adapter: Any = ...,
      session: Optional[Session] = ...,
      real_http: bool = ...,
      json_encoder: Optional[Type[JSONEncoder]] = ...,
    ) -> None: ...
    def __enter__(self) -> Any: ...
    def __exit__(self, type: Any, value: Any, traceback: Any) -> None: ...
    @overload
    def __call__(self, obj: type[_T]) -> type[_T]: ...
    @overload
    def __call__(self, obj: _CallableT) -> _CallableT: ...
    def copy(self) -> Mocker: ...
    def decorate_callable(self, func: _CallableT) -> _CallableT: ...
    def decorate_class(self, klass: Type[_T]) -> Type[_T]: ...

mock = Mocker
