# Stubs for requests_mock

from requests_mock.adapter import (
    ANY as ANY, 
    Adapter as Adapter, 
    Callback as Callback, 
    AdditionalMatcher as AdditionalMatcher,
)
from requests_mock.exceptions import (
    MockException as MockException, 
    NoMockAddress as NoMockAddress,
)
from requests_mock.mocker import (
    DELETE as DELETE, 
    GET as GET, 
    HEAD as HEAD,
    Mocker as Mocker,
    MockerCore as MockerCore,
    OPTIONS as OPTIONS,
    PATCH as PATCH,
    POST as POST,
    PUT as PUT,
    mock as mock,
)
from requests_mock.request import (
    Request as Request,
    _RequestObjectProxy as _RequestObjectProxy,  # For backward compatibility
)
from requests_mock.response import (
    CookieJar as CookieJar,
    create_response as create_response,
    Context as Context,
)
