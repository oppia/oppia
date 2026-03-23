# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import contextlib
import functools
import sys
import threading
import types

import requests

from requests_mock import adapter
from requests_mock import exceptions

DELETE = 'DELETE'
GET = 'GET'
HEAD = 'HEAD'
OPTIONS = 'OPTIONS'
PATCH = 'PATCH'
POST = 'POST'
PUT = 'PUT'

_original_send = requests.Session.send

# NOTE(phodge): we need to use an RLock (reentrant lock) here because
# requests.Session.send() is reentrant. See further comments where we
# monkeypatch get_adapter()
_send_lock = threading.RLock()


@contextlib.contextmanager
def threading_rlock(timeout):
    kwargs = {}
    if sys.version_info.major >= 3:
        # python2 doesn't support the timeout argument
        kwargs['timeout'] = timeout

    if not _send_lock.acquire(**kwargs):
        m = "Could not acquire threading lock - possible deadlock scenario"
        raise Exception(m)

    try:
        yield
    finally:
        _send_lock.release()


def _is_bound_method(method):
    """
    bound_method 's self is a obj
    unbound_method 's self is None
    """
    if isinstance(method, types.MethodType) and hasattr(method, '__self__'):
        return True

    return False


def _set_method(target, name, method):
    """ Set a mocked method onto the target.

    Target may be either an instance of a Session object of the
    requests.Session class. First we Bind the method if it's an instance.

    If method is a bound_method, can direct setattr
    """
    if not isinstance(target, type) and not _is_bound_method(method):
        method = types.MethodType(method, target)

    setattr(target, name, method)


class MockerCore(object):
    """A wrapper around common mocking functions.

    Automate the process of mocking the requests library. This will keep the
    same general options available and prevent repeating code.
    """

    _PROXY_FUNCS = {
        'last_request',
        'add_matcher',
        'request_history',
        'called',
        'called_once',
        'call_count',
        'reset',
    }

    case_sensitive = False
    """case_sensitive handles a backwards incompatible bug. The URL used to
    match against our matches and that is saved in request_history is always
    lowercased. This is incorrect as it reports incorrect history to the user
    and doesn't allow case sensitive path matching.

    Unfortunately fixing this change is backwards incompatible in the 1.X
    series as people may rely on this behaviour. To work around this you can
    globally set:

    requests_mock.mock.case_sensitive = True

    or for pytest set in your configuration:

    [pytest]
    requests_mock_case_sensitive = True

    which will prevent the lowercase being executed and return case sensitive
    url and query information.

    This will become the default in a 2.X release. See bug: #1584008.
    """

    def __init__(self, session=None, **kwargs):
        if session and not isinstance(session, requests.Session):
            raise TypeError("Only a requests.Session object can be mocked")

        self._mock_target = session or requests.Session
        self.case_sensitive = kwargs.pop('case_sensitive', self.case_sensitive)
        self._adapter = (
            kwargs.pop('adapter', None) or
            adapter.Adapter(case_sensitive=self.case_sensitive)
        )

        self._json_encoder = kwargs.pop('json_encoder', None)
        self.real_http = kwargs.pop('real_http', False)
        self._last_send = None

        if kwargs:
            raise TypeError('Unexpected Arguments: %s' % ', '.join(kwargs))

    def start(self):
        """Start mocking requests.

        Install the adapter and the wrappers required to intercept requests.
        """
        if self._last_send:
            raise RuntimeError('Mocker has already been started')

        # backup last `send` for restoration on `self.stop`
        self._last_send = self._mock_target.send
        self._last_get_adapter = self._mock_target.get_adapter

        def _fake_get_adapter(session, url):
            return self._adapter

        def _fake_send(session, request, **kwargs):
            # NOTE(phodge): we need to use a threading lock here in case there
            # are multiple threads running - one thread could restore the
            # original get_adapter() just as a second thread is about to
            # execute _original_send() below
            with threading_rlock(timeout=10):
                # mock get_adapter
                #
                # NOTE(phodge): requests.Session.send() is actually
                # reentrant due to how it resolves redirects with nested
                # calls to send(), however the reentry occurs _after_ the
                # call to self.get_adapter(), so it doesn't matter that we
                # will restore _last_get_adapter before a nested send() has
                # completed as long as we monkeypatch get_adapter() each
                # time immediately before calling original send() like we
                # are doing here.
                _set_method(session, "get_adapter", _fake_get_adapter)

                # NOTE(jamielennox): self._last_send vs _original_send. Whilst
                # it seems like here we would use _last_send there is the
                # possibility that the user has messed up and is somehow
                # nesting their mockers.  If we call last_send at this point
                # then we end up calling this function again and the outer
                # level adapter ends up winning.  All we really care about here
                # is that our adapter is in place before calling send so we
                # always jump directly to the real function so that our most
                # recently patched send call ends up putting in the most recent
                # adapter. It feels funny, but it works.

                try:
                    return _original_send(session, request, **kwargs)
                except exceptions.NoMockAddress:
                    if not self.real_http:
                        raise
                except adapter._RunRealHTTP:
                    # this mocker wants you to run the request through the real
                    # requests library rather than the mocking. Let it.
                    pass
                finally:
                    # restore get_adapter
                    _set_method(session, "get_adapter", self._last_get_adapter)

            # if we are here it means we must run the real http request
            # Or, with nested mocks, to the parent mock, that is why we use
            # _last_send here instead of _original_send
            if isinstance(self._mock_target, type):
                return self._last_send(session, request, **kwargs)
            else:
                return self._last_send(request, **kwargs)

        _set_method(self._mock_target, "send", _fake_send)

    def stop(self):
        """Stop mocking requests.

        This should have no impact if mocking has not been started.
        When nesting mockers, make sure to stop the innermost first.
        """
        if self._last_send:
            self._mock_target.send = self._last_send
            self._last_send = None

    # for familiarity with MagicMock
    def reset_mock(self):
        self.reset()

    def __getattr__(self, name):
        if name in self._PROXY_FUNCS:
            try:
                return getattr(self._adapter, name)
            except AttributeError:
                pass

        raise AttributeError(name)

    def register_uri(self, *args, **kwargs):
        # you can pass real_http here, but it's private to pass direct to the
        # adapter, because if you pass direct to the adapter you'll see the exc
        kwargs['_real_http'] = kwargs.pop('real_http', False)
        kwargs.setdefault('json_encoder', self._json_encoder)
        return self._adapter.register_uri(*args, **kwargs)

    def request(self, *args, **kwargs):
        return self.register_uri(*args, **kwargs)

    def get(self, *args, **kwargs):
        return self.request(GET, *args, **kwargs)

    def options(self, *args, **kwargs):
        return self.request(OPTIONS, *args, **kwargs)

    def head(self, *args, **kwargs):
        return self.request(HEAD, *args, **kwargs)

    def post(self, *args, **kwargs):
        return self.request(POST, *args, **kwargs)

    def put(self, *args, **kwargs):
        return self.request(PUT, *args, **kwargs)

    def patch(self, *args, **kwargs):
        return self.request(PATCH, *args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.request(DELETE, *args, **kwargs)


class Mocker(MockerCore):
    """The standard entry point for mock Adapter loading.
    """

    #: Defines with what should method name begin to be patched
    TEST_PREFIX = 'test'

    def __init__(self, **kwargs):
        """Create a new mocker adapter.

        :param str kw: Pass the mock object through to the decorated function
            as this named keyword argument, rather than a positional argument.
        :param bool real_http: True to send the request to the real requested
            uri if there is not a mock installed for it. Defaults to False.
        """
        self._kw = kwargs.pop('kw', None)
        super(Mocker, self).__init__(**kwargs)

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, type, value, traceback):
        self.stop()

    def __call__(self, obj):
        if isinstance(obj, type):
            return self.decorate_class(obj)

        return self.decorate_callable(obj)

    def copy(self):
        """Returns an exact copy of current mock
        """
        m = type(self)(
            kw=self._kw,
            real_http=self.real_http,
            case_sensitive=self.case_sensitive
        )
        return m

    def decorate_callable(self, func):
        """Decorates a callable

        :param callable func: callable to decorate
        """
        @functools.wraps(func)
        def inner(*args, **kwargs):
            with self.copy() as m:
                if self._kw:
                    kwargs[self._kw] = m
                else:
                    args = list(args)
                    args.append(m)

                return func(*args, **kwargs)

        return inner

    def decorate_class(self, klass):
        """Decorates methods in a class with request_mock

        Method will be decorated only if it name begins with `TEST_PREFIX`

        :param object klass: class which methods will be decorated
        """
        for attr_name in dir(klass):
            if not attr_name.startswith(self.TEST_PREFIX):
                continue

            attr = getattr(klass, attr_name)
            if not hasattr(attr, '__call__'):
                continue

            m = self.copy()
            setattr(klass, attr_name, m(attr))

        return klass


mock = Mocker
