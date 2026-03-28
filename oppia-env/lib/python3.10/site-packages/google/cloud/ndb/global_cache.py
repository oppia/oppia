# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""GlobalCache interface and its implementations."""

import abc
import base64
import hashlib
import os
import pymemcache.exceptions
import redis.exceptions
import threading
import time
import warnings

import pymemcache
import redis as redis_module

# Python 2.7 doesn't have ConnectionError. In Python 3, ConnectionError is subclass of
# OSError, which Python 2.7 does have.
ConnectionError = getattr(__builtins__, "ConnectionError", OSError)


class GlobalCache(object):
    """Abstract base class for a global entity cache.

    A global entity cache is shared across contexts, sessions, and possibly
    even servers. A concrete implementation is available which uses Redis.

    Essentially, this class models a simple key/value store where keys and
    values are arbitrary ``bytes`` instances. "Compare and swap", aka
    "optimistic transactions" should also be supported.

    Concrete implementations can either by synchronous or asynchronous.
    Asynchronous implementations should return
    :class:`~google.cloud.ndb.tasklets.Future` instances whose eventual results
    match the return value described for each method. Because coordinating with
    the single threaded event model used by ``NDB`` can be tricky with remote
    services, it's not recommended that casual users write asynchronous
    implementations, as some specialized knowledge is required.

    Attributes:
        strict_read (bool): If :data:`False`, transient errors that occur as part of a
            entity lookup operation will be logged as warnings but not raised to the
            application layer. If :data:`True`, in the event of transient errors, cache
            operations will be retried a number of times before eventually raising the
            transient error to the application layer, if it does not resolve after
            retrying. Setting this to :data:`True` will cause NDB operations to take
            longer to complete if there are transient errors in the cache layer.
        strict_write (bool): If :data:`False`, transient errors that occur as part of
            a put or delete operation will be logged as warnings, but not raised to the
            application layer. If :data:`True`, in the event of transient errors, cache
            operations will be retried a number of times before eventually raising the
            transient error to the application layer if it does not resolve after
            retrying. Setting this to :data:`False` somewhat increases the risk
            that other clients might read stale data from the cache. Setting this to
            :data:`True` will cause NDB operations to take longer to complete if there
            are transient errors in the cache layer.
    """

    __metaclass__ = abc.ABCMeta

    transient_errors = ()
    """Exceptions that should be treated as transient errors in non-strict modes.

    Instances of these exceptions, if raised, will be logged as warnings but will not
    be raised to the application layer, depending on the values of the ``strict_read``
    and ``strict_write`` attributes of the instance.

    This should be overridden by subclasses.
    """

    strict_read = True
    strict_write = True

    @abc.abstractmethod
    def get(self, keys):
        """Retrieve entities from the cache.

        Arguments:
            keys (List[bytes]): The keys to get.

        Returns:
            List[Union[bytes, None]]]: Serialized entities, or :data:`None`,
                for each key.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def set(self, items, expires=None):
        """Store entities in the cache.

        Arguments:
            items (Dict[bytes, Union[bytes, None]]): Mapping of keys to
                serialized entities.
            expires (Optional[float]): Number of seconds until value expires.

        Returns:
            Optional[Dict[bytes, Any]]: May return :data:`None`, or a `dict` mapping
                keys to arbitrary results. If the result for a key is an instance of
                `Exception`, the result will be raised as an exception in that key's
                future.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def set_if_not_exists(self, items, expires=None):
        """Stores entities in the cache if and only if keys are not already set.

        Arguments:
            items (Dict[bytes, Union[bytes, None]]): Mapping of keys to
                serialized entities.
            expires (Optional[float]): Number of seconds until value expires.


        Returns:
            Dict[bytes, bool]: A `dict` mapping to boolean value that will be
                :data:`True` if that key was set with a new value, and :data:`False`
                otherwise.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, keys):
        """Remove entities from the cache.

        Arguments:
            keys (List[bytes]): The keys to remove.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def watch(self, items):
        """Begin an optimistic transaction for the given items.

        A future call to :meth:`compare_and_swap` will only set values for keys
        whose values haven't changed since the call to this method. Values are used to
        check that the watched value matches the expected value for a given key.

        Arguments:
            items (Dict[bytes, bytes]): The items to watch.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def unwatch(self, keys):
        """End an optimistic transaction for the given keys.

        Indicates that value for the key wasn't found in the database, so there will not
        be a future call to :meth:`compare_and_swap`, and we no longer need to watch
        this key.

        Arguments:
            keys (List[bytes]): The keys to watch.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def compare_and_swap(self, items, expires=None):
        """Like :meth:`set` but using an optimistic transaction.

        Only keys whose values haven't changed since a preceding call to
        :meth:`watch` will be changed.

        Arguments:
            items (Dict[bytes, Union[bytes, None]]): Mapping of keys to
                serialized entities.
            expires (Optional[float]): Number of seconds until value expires.

        Returns:
            Dict[bytes, bool]: A mapping of key to result. A key will have a result of
                :data:`True` if it was changed successfully.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def clear(self):
        """Clear all keys from global cache.

        Will be called if there previously was a connection error, to prevent clients
        from reading potentially stale data from the cache.
        """
        raise NotImplementedError


class _InProcessGlobalCache(GlobalCache):
    """Reference implementation of :class:`GlobalCache`.

    Not intended for production use. Uses a single process wide dictionary to
    keep an in memory cache. For use in testing and to have an easily grokkable
    reference implementation. Thread safety is potentially a little sketchy.
    """

    cache = {}
    """Dict: The cache.

    Relies on atomicity of ``__setitem__`` for thread safety. See:
    http://effbot.org/pyfaq/what-kinds-of-global-value-mutation-are-thread-safe.htm
    """

    def __init__(self):
        self._watch_keys = {}

    def get(self, keys):
        """Implements :meth:`GlobalCache.get`."""
        now = time.time()
        results = [self.cache.get(key) for key in keys]
        entity_pbs = []
        for result in results:
            if result is not None:
                entity_pb, expires = result
                if expires and expires < now:
                    entity_pb = None
            else:
                entity_pb = None

            entity_pbs.append(entity_pb)

        return entity_pbs

    def set(self, items, expires=None):
        """Implements :meth:`GlobalCache.set`."""
        if expires:
            expires = time.time() + expires

        for key, value in items.items():
            self.cache[key] = (value, expires)  # Supposedly threadsafe

    def set_if_not_exists(self, items, expires=None):
        """Implements :meth:`GlobalCache.set_if_not_exists`."""
        if expires:
            expires = time.time() + expires

        results = {}
        for key, value in items.items():
            set_value = (value, expires)
            results[key] = self.cache.setdefault(key, set_value) is set_value

        return results

    def delete(self, keys):
        """Implements :meth:`GlobalCache.delete`."""
        for key in keys:
            self.cache.pop(key, None)  # Threadsafe?

    def watch(self, items):
        """Implements :meth:`GlobalCache.watch`."""
        for key, value in items.items():
            self._watch_keys[key] = value

    def unwatch(self, keys):
        """Implements :meth:`GlobalCache.unwatch`."""
        for key in keys:
            self._watch_keys.pop(key, None)

    def compare_and_swap(self, items, expires=None):
        """Implements :meth:`GlobalCache.compare_and_swap`."""
        if expires:
            expires = time.time() + expires

        results = {key: False for key in items.keys()}
        for key, new_value in items.items():
            watch_value = self._watch_keys.get(key)
            current_value = self.cache.get(key)
            current_value = current_value[0] if current_value else current_value
            if watch_value == current_value:
                self.cache[key] = (new_value, expires)
                results[key] = True

        return results

    def clear(self):
        """Implements :meth:`GlobalCache.clear`."""
        self.cache.clear()


class RedisCache(GlobalCache):
    """Redis implementation of the :class:`GlobalCache`.

    This is a synchronous implementation. The idea is that calls to Redis
    should be fast enough not to warrant the added complexity of an
    asynchronous implementation.

    Args:
        redis (redis.Redis): Instance of Redis client to use.
        strict_read (bool): If :data:`False`, connection errors during read operations
            will be logged with a warning and treated as cache misses, but will not
            raise an exception in the application, with connection errors during reads
            being treated as cache misses. If :data:`True`, in the event of connection
            errors, cache operations will be retried a number of times before eventually
            raising the connection error to the application layer, if it does not
            resolve after retrying. Setting this to :data:`True` will cause NDB
            operations to take longer to complete if there are transient errors in the
            cache layer. Default: :data:`False`.
        strict_write (bool): If :data:`False`, connection errors during write
            operations will be logged with a warning, but will not raise an exception in
            the application. If :data:`True`, connection errors during write will be
            raised as exceptions in the application. Because write operations involve
            cache invalidation, setting this to :data:`False` may allow other clients to
            retrieve stale data from the cache. If :data:`True`, in the event of
            connection errors, cache operations will be retried a number of times before
            eventually raising the connection error to the application layer, if it does
            not resolve after retrying. Setting this to :data:`True` will cause NDB
            operations to take longer to complete if there are transient errors in the
            cache layer. Default: :data:`True`.
    """

    transient_errors = (
        IOError,
        ConnectionError,
        redis.exceptions.ConnectionError,
        redis.exceptions.TimeoutError,
    )

    @classmethod
    def from_environment(cls, strict_read=False, strict_write=True):
        """Generate a class:`RedisCache` from an environment variable.

        This class method looks for the ``REDIS_CACHE_URL`` environment
        variable and, if it is set, passes its value to ``Redis.from_url`` to
        construct a ``Redis`` instance which is then used to instantiate a
        ``RedisCache`` instance.

        Args:
            strict_read (bool): If :data:`False`, connection errors during read
                operations will be logged with a warning and treated as cache misses,
                but will not raise an exception in the application, with connection
                errors during reads being treated as cache misses. If :data:`True`, in
                the event of connection errors, cache operations will be retried a
                number of times before eventually raising the connection error to the
                application layer, if it does not resolve after retrying. Setting this
                to :data:`True` will cause NDB operations to take longer to complete if
                there are transient errors in the cache layer. Default: :data:`False`.
            strict_write (bool): If :data:`False`, connection errors during write
                operations will be logged with a warning, but will not raise an
                exception in the application. If :data:`True`, connection errors during
                write will be raised as exceptions in the application. Because write
                operations involve cache invalidation, setting this to :data:`False` may
                allow other clients to retrieve stale data from the cache. If
                :data:`True`, in the event of connection errors, cache operations will
                be retried a number of times before eventually raising the connection
                error to the application layer, if it does not resolve after retrying.
                Setting this to :data:`True` will cause NDB operations to take longer to
                complete if there are transient errors in the cache layer.  Default:
                :data:`True`.

        Returns:
            Optional[RedisCache]: A :class:`RedisCache` instance or
                :data:`None`, if ``REDIS_CACHE_URL`` is not set in the
                environment.
        """
        url = os.environ.get("REDIS_CACHE_URL")
        if url:
            return cls(redis_module.Redis.from_url(url))

    def __init__(self, redis, strict_read=False, strict_write=True):
        self.redis = redis
        self.strict_read = strict_read
        self.strict_write = strict_write
        self._pipes = threading.local()

    @property
    def pipes(self):
        local = self._pipes
        if not hasattr(local, "pipes"):
            local.pipes = {}
        return local.pipes

    def get(self, keys):
        """Implements :meth:`GlobalCache.get`."""
        res = self.redis.mget(keys)
        return res

    def set(self, items, expires=None):
        """Implements :meth:`GlobalCache.set`."""
        self.redis.mset(items)
        if expires:
            for key in items.keys():
                self.redis.expire(key, expires)

    def set_if_not_exists(self, items, expires=None):
        """Implements :meth:`GlobalCache.set_if_not_exists`."""
        results = {}
        for key, value in items.items():
            results[key] = key_was_set = self.redis.setnx(key, value)
            if key_was_set and expires:
                self.redis.expire(key, expires)

        return results

    def delete(self, keys):
        """Implements :meth:`GlobalCache.delete`."""
        self.redis.delete(*keys)

    def watch(self, items):
        """Implements :meth:`GlobalCache.watch`."""
        for key, value in items.items():
            pipe = self.redis.pipeline()
            pipe.watch(key)
            if pipe.get(key) == value:
                self.pipes[key] = pipe
            else:
                pipe.reset()

    def unwatch(self, keys):
        """Implements :meth:`GlobalCache.watch`."""
        for key in keys:
            pipe = self.pipes.pop(key, None)
            if pipe:
                pipe.reset()

    def compare_and_swap(self, items, expires=None):
        """Implements :meth:`GlobalCache.compare_and_swap`."""
        results = {key: False for key in items.keys()}

        pipes = self.pipes
        for key, value in items.items():
            pipe = pipes.pop(key, None)
            if pipe is None:
                continue

            try:
                pipe.multi()
                if expires:
                    pipe.setex(key, expires, value)
                else:
                    pipe.set(key, value)
                pipe.execute()
                results[key] = True

            except redis_module.exceptions.WatchError:
                pass

            finally:
                pipe.reset()

        return results

    def clear(self):
        """Implements :meth:`GlobalCache.clear`."""
        self.redis.flushdb()


class MemcacheCache(GlobalCache):
    """Memcache implementation of the :class:`GlobalCache`.

    This is a synchronous implementation. The idea is that calls to Memcache
    should be fast enough not to warrant the added complexity of an
    asynchronous implementation.

    Args:
        client (pymemcache.Client): Instance of Memcache client to use.
        strict_read (bool): If :data:`False`, connection errors during read
            operations will be logged with a warning and treated as cache misses,
            but will not raise an exception in the application, with connection
            errors during reads being treated as cache misses. If :data:`True`, in
            the event of connection errors, cache operations will be retried a
            number of times before eventually raising the connection error to the
            application layer, if it does not resolve after retrying. Setting this
            to :data:`True` will cause NDB operations to take longer to complete if
            there are transient errors in the cache layer. Default: :data:`False`.
        strict_write (bool): If :data:`False`, connection errors during write
            operations will be logged with a warning, but will not raise an
            exception in the application. If :data:`True`, connection errors during
            write will be raised as exceptions in the application. Because write
            operations involve cache invalidation, setting this to :data:`False` may
            allow other clients to retrieve stale data from the cache. If :data:`True`,
            in the event of connection errors, cache operations will be retried a number
            of times before eventually raising the connection error to the application
            layer, if it does not resolve after retrying.  Setting this to :data:`True`
            will cause NDB operations to take longer to complete if there are transient
            errors in the cache layer. Default: :data:`True`.
    """

    class KeyNotSet(Exception):
        def __init__(self, key):
            self.key = key
            super(MemcacheCache.KeyNotSet, self).__init__(
                "SET operation failed in memcache for key: {}".format(key)
            )

        def __eq__(self, other):
            if isinstance(other, type(self)):
                return self.key == other.key
            return NotImplemented

    transient_errors = (
        IOError,
        ConnectionError,
        KeyNotSet,
        pymemcache.exceptions.MemcacheServerError,
        pymemcache.exceptions.MemcacheUnexpectedCloseError,
    )

    @staticmethod
    def _parse_host_string(host_string):
        split = host_string.split(":")
        if len(split) == 1:
            return split[0], 11211

        elif len(split) == 2:
            host, port = split
            try:
                port = int(port)
                return host, port
            except ValueError:
                pass

        raise ValueError("Invalid memcached host_string: {}".format(host_string))

    @staticmethod
    def _key(key):
        encoded = base64.b64encode(key)
        if len(encoded) > 250:
            encoded = hashlib.sha1(encoded).hexdigest()
        return encoded

    @classmethod
    def from_environment(cls, max_pool_size=4, strict_read=False, strict_write=True):
        """Generate a ``pymemcache.Client`` from an environment variable.

        This class method looks for the ``MEMCACHED_HOSTS`` environment
        variable and, if it is set, parses the value as a space delimited list of
        hostnames, optionally with ports. For example:

            "localhost"
            "localhost:11211"
            "1.1.1.1:11211 2.2.2.2:11211 3.3.3.3:11211"

        Args:
            max_pool_size (int): Size of connection pool to be used by client. If set to
                ``0`` or ``1``, connection pooling will not be used. Default: ``4``
            strict_read (bool): If :data:`False`, connection errors during read
                operations will be logged with a warning and treated as cache misses,
                but will not raise an exception in the application, with connection
                errors during reads being treated as cache misses. If :data:`True`, in
                the event of connection errors, cache operations will be retried a
                number of times before eventually raising the connection error to the
                application layer, if it does not resolve after retrying. Setting this
                to :data:`True` will cause NDB operations to take longer to complete if
                there are transient errors in the cache layer. Default: :data:`False`.
            strict_write (bool): If :data:`False`, connection errors during write
                operations will be logged with a warning, but will not raise an
                exception in the application. If :data:`True`, connection errors during
                write will be raised as exceptions in the application. Because write
                operations involve cache invalidation, setting this to :data:`False` may
                allow other clients to retrieve stale data from the cache. If
                :data:`True`, in the event of connection errors, cache operations will
                be retried a number of times before eventually raising the connection
                error to the application layer, if it does not resolve after retrying.
                Setting this to :data:`True` will cause NDB operations to take longer to
                complete if there are transient errors in the cache layer. Default:
                :data:`True`.

        Returns:
            Optional[MemcacheCache]: A :class:`MemcacheCache` instance or
                :data:`None`, if ``MEMCACHED_HOSTS`` is not set in the
                environment.
        """
        hosts_string = os.environ.get("MEMCACHED_HOSTS")
        if not hosts_string:
            return None

        hosts = [
            cls._parse_host_string(host_string.strip())
            for host_string in hosts_string.split()
        ]

        if not max_pool_size:
            max_pool_size = 1

        if len(hosts) == 1:
            client = pymemcache.PooledClient(hosts[0], max_pool_size=max_pool_size)

        else:
            client = pymemcache.HashClient(
                hosts, use_pooling=True, max_pool_size=max_pool_size
            )

        return cls(client, strict_read=strict_read, strict_write=strict_write)

    def __init__(self, client, strict_read=False, strict_write=True):
        self.client = client
        self.strict_read = strict_read
        self.strict_write = strict_write
        self._cas = threading.local()

    @property
    def caskeys(self):
        local = self._cas
        if not hasattr(local, "caskeys"):
            local.caskeys = {}
        return local.caskeys

    def get(self, keys):
        """Implements :meth:`GlobalCache.get`."""
        keys = [self._key(key) for key in keys]
        result = self.client.get_many(keys)
        return [result.get(key) for key in keys]

    def set(self, items, expires=None):
        """Implements :meth:`GlobalCache.set`."""
        expires = expires if expires else 0
        orig_items = items
        items = {}
        orig_keys = {}
        for orig_key, value in orig_items.items():
            key = self._key(orig_key)
            orig_keys[key] = orig_key
            items[key] = value

        unset_keys = self.client.set_many(items, expire=expires, noreply=False)
        if unset_keys:
            unset_keys = [orig_keys[key] for key in unset_keys]
            warnings.warn(
                "Keys failed to set in memcache: {}".format(unset_keys),
                RuntimeWarning,
            )
            return {key: MemcacheCache.KeyNotSet(key) for key in unset_keys}

    def set_if_not_exists(self, items, expires=None):
        """Implements :meth:`GlobalCache.set_if_not_exists`."""
        expires = expires if expires else 0
        results = {}
        for key, value in items.items():
            results[key] = self.client.add(
                self._key(key), value, expire=expires, noreply=False
            )

        return results

    def delete(self, keys):
        """Implements :meth:`GlobalCache.delete`."""
        keys = [self._key(key) for key in keys]
        self.client.delete_many(keys)

    def watch(self, items):
        """Implements :meth:`GlobalCache.watch`."""
        caskeys = self.caskeys
        keys = []
        prev_values = {}
        for key, prev_value in items.items():
            key = self._key(key)
            keys.append(key)
            prev_values[key] = prev_value

        for key, (value, caskey) in self.client.gets_many(keys).items():
            if prev_values[key] == value:
                caskeys[key] = caskey

    def unwatch(self, keys):
        """Implements :meth:`GlobalCache.unwatch`."""
        keys = [self._key(key) for key in keys]
        caskeys = self.caskeys
        for key in keys:
            caskeys.pop(key, None)

    def compare_and_swap(self, items, expires=None):
        """Implements :meth:`GlobalCache.compare_and_swap`."""
        caskeys = self.caskeys
        results = {}
        for orig_key, value in items.items():
            key = self._key(orig_key)
            caskey = caskeys.pop(key, None)
            if caskey is None:
                continue

            expires = expires if expires else 0
            results[orig_key] = bool(
                self.client.cas(key, value, caskey, expire=expires, noreply=False)
            )

        return results

    def clear(self):
        """Implements :meth:`GlobalCache.clear`."""
        self.client.flush_all()
