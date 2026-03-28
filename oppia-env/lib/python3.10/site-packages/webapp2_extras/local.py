# -*- coding: utf-8 -*-
# Copyright 2011 webapp2 AUTHORS.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
webapp2_extras.local
~~~~~~~~~~~~~~~~~~~~

This module implements thread-local utilities.

This implementation comes from werkzeug.local.
"""
import six

try:
    from greenlet import getcurrent as get_current_greenlet
except ImportError:  # pragma: no cover
    try:
        from py.magic import greenlet

        get_current_greenlet = greenlet.getcurrent
        del greenlet
    except:
        # catch all, py.* fails with so many different errors.
        get_current_greenlet = int
try:
    from six.moves._thread import allocate_lock
    from six.moves._thread import get_ident as get_current_thread
except ImportError:  # pragma: no cover
    from six.moves._dummy_thread import allocate_lock
    from six.moves._dummy_thread import get_ident as get_current_thread

# get the best ident function.  if greenlets are not installed we can
# safely just use the builtin thread function and save a python methodcall
# and the cost of calculating a hash.
if get_current_greenlet is int:  # pragma: no cover
    get_ident = get_current_thread
else:
    def get_ident():
        return get_current_thread(), get_current_greenlet()


if six.PY3:  # pragma: no cover
    long = int


class Local(object):
    """A container for thread-local objects.

    Attributes are assigned or retrieved using the current thread.
    """

    __slots__ = ('__storage__', '__lock__')

    def __init__(self):
        object.__setattr__(self, '__storage__', {})
        object.__setattr__(self, '__lock__', allocate_lock())

    def __iter__(self):
        return six.iteritems(self.__storage__)

    def __call__(self, proxy):
        """Creates a proxy for a name."""
        return LocalProxy(self, proxy)

    def __release_local__(self):
        self.__storage__.pop(get_ident(), None)

    def __getattr__(self, name):
        self.__lock__.acquire()
        try:
            try:
                return self.__storage__[get_ident()][name]
            except KeyError:
                raise AttributeError(name)
        finally:
            self.__lock__.release()

    def __setattr__(self, name, value):
        self.__lock__.acquire()
        try:
            ident = get_ident()
            storage = self.__storage__
            if ident in storage:
                storage[ident][name] = value
            else:
                storage[ident] = {name: value}
        finally:
            self.__lock__.release()

    def __delattr__(self, name):
        self.__lock__.acquire()
        try:
            try:
                del self.__storage__[get_ident()][name]
            except KeyError:
                raise AttributeError(name)
        finally:
            self.__lock__.release()


@six.python_2_unicode_compatible
class LocalProxy(object):
    """Acts as a proxy for a local object.

    Forwards all operations to a proxied object. The only operations not
    supported for forwarding are right handed operands and any kind of
    assignment.

    Example usage::

        from webapp2_extras import Local
        l = Local()

        # these are proxies
        request = l('request')
        user = l('user')

    Whenever something is bound to l.user or l.request the proxy objects
    will forward all operations. If no object is bound a :exc:`RuntimeError`
    will be raised.

    To create proxies to :class:`Local` object, call the object as shown above.
    If you want to have a proxy to an object looked up by a function, you can
    pass a function to the :class:`LocalProxy` constructor::

        route_kwargs = LocalProxy(lambda: webapp2.get_request().route_kwargs)
    """

    __slots__ = ('__local', '__dict__', '__name__')

    def __init__(self, local, name=None):
        object.__setattr__(self, '_LocalProxy__local', local)
        object.__setattr__(self, '__name__', name)

    def _get_current_object(self):
        """Return the current object.  This is useful if you want the real
        object behind the proxy at a time for performance reasons or because
        you want to pass the object into a different context.
        """
        if not hasattr(self.__local, '__release_local__'):
            return self.__local()
        try:
            return getattr(self.__local, self.__name__)
        except AttributeError:
            raise RuntimeError('no object bound to %s' % self.__name__)

    @property
    def __dict__(self):
        try:
            return self._get_current_object().__dict__
        except RuntimeError:
            return AttributeError('__dict__')

    def __repr__(self):
        try:
            obj = self._get_current_object()
        except RuntimeError:
            return '<%s unbound>' % self.__class__.__name__
        return repr(obj)

    def __bool__(self):
        try:
            return bool(self._get_current_object())
        except RuntimeError:
            return False

    __nonzero__ = __bool__

    def __str__(self):
        try:
            return self._get_current_object()
        except RuntimeError:
            return repr(self)

    def __dir__(self):
        try:
            return dir(self._get_current_object())
        except RuntimeError:
            return []

    def __getattr__(self, name):
        if name == '__members__':
            return dir(self._get_current_object())
        return getattr(self._get_current_object(), name)

    def __setitem__(self, key, value):
        self._get_current_object()[key] = value

    def __delitem__(self, key):
        del self._get_current_object()[key]

    def __setslice__(self, i, j, seq):
        self._get_current_object()[i:j] = seq

    def __delslice__(self, i, j):
        del self._get_current_object()[i:j]

    def __setattr__(self, attr, value):
        setattr(self._get_current_object(), attr, value)

    def __delattr__(self, item):
        delattr(self._get_current_object(), item)

    def __lt__(self, other):
        return self._get_current_object() < other

    def __le__(self, other):
        return self._get_current_object() <= other

    def __eq__(self, other):
        return self._get_current_object() == other

    def __ne__(self, other):
        return self._get_current_object() != other

    def __gt__(self, other):
        return self._get_current_object() > other

    def __ge__(self, other):
        return self._get_current_object() >= other

    def __hash__(self):
        return hash(self._get_current_object())

    def __call__(self, *args, **kwargs):
        return self._get_current_object()(*args, **kwargs)

    def __len__(self):
        return len(self._get_current_object())

    def __getitem__(self, item):
        return self._get_current_object()[item]

    def __iter__(self):
        return iter(self._get_current_object())

    def __contains__(self, item):
        return item in self._get_current_object()

    def __getslice__(self, i, j):
        return self._get_current_object()[i:j]

    def __add__(self, other):
        return self._get_current_object() + other

    def __sub__(self, other):
        return self._get_current_object() - other

    def __mul__(self, other):
        return self._get_current_object() * other

    def __floordiv__(self, other):
        return self._get_current_object() // other

    def __mod__(self, other):
        return self._get_current_object() % other

    def __divmod__(self, other):
        return self._get_current_object().__divmod__(other)

    def __pow__(self, o):
        return self._get_current_object() ** o

    def __lshift__(self, other):
        return self._get_current_object() << other

    def __rshift__(self, other):
        return self._get_current_object() >> other

    def __and__(self, other):
        return self._get_current_object() & other

    def __xor__(self, other):
        return self._get_current_object() ^ other

    def __or__(self, other):
        return self._get_current_object() | other

    def __div__(self, other):
        return self._get_current_object().__div__(other)

    def __truediv__(self, other):
        return self._get_current_object().__truediv__(other)

    def __neg__(self):
        return -(self._get_current_object())

    def __pos__(self):
        return +(self._get_current_object())

    def __abs__(self):
        return abs(self._get_current_object())

    def __invert__(self):
        return ~(self._get_current_object())

    def __complex__(self):
        return complex(self._get_current_object())

    def __int__(self):
        return int(self._get_current_object())

    def __long__(self):
        if six.PY2:
            return long(self._get_current_object())
        return None

    def __float__(self):
        return float(self._get_current_object())

    def __oct__(self):
        return oct(self._get_current_object())

    def __hex__(self):
        return hex(self._get_current_object())

    def __index__(self):
        return self._get_current_object().__index__()

    def __coerce__(self, other):
        return self.__coerce__(other)

    def __enter__(self):
        return self.__enter__()

    def __exit__(self, *a, **kw):
        return self.__exit__(*a, **kw)
