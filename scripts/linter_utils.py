# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Helpers for the scripts.pre_commit_linter module.

Do not use this module anywhere else in the code base!
"""

import collections
import functools
import inspect
import threading


def memoize(func):
    """Decorator which provides thread-safe, cached-access to the return values
    of function calls.

    NOTE: This function uses dicts to manage the cache. This means that all
    values provided as arguments to func *must be hashable!*

    Args:
        func: callable.

    Returns:
        callable. The same func, but calls to it using the same arguments are
            made exactly once.
    """
    # We use key-locks so that they don't interfere with each other while trying
    # to update the cache.
    key_locks = collections.defaultdict(threading.Lock)
    lock_for_key_locks = threading.Lock()
    def threadsafe_access(key):
        """Returns a threading.Lock unique to the given key.

        Args:
            key: *. A hashable value.

        Returns:
            threading.Lock. A lock unique to the given key.
        """
        with lock_for_key_locks:
            return key_locks[key]

    cache = {}
    lock_for_cache = threading.Lock()
    def get_from_cache(key, factory):
        """Returns and associates a factory-provided value to the given key if a
        value isn't associated to it yet. Otherwise, returns the pre-existing
        associated value.

        The factory is run on a thread to take advantage of concurrency. We do
        this because linter operations which we want to memoize are IO-bound
        (file reading) and would thus benefit greatly from threading.

        Args:
            key: *. A hashable value.
            factory: callable. A value producer that takes no arguments.

        Returns:
            *. The result of factory(), or the last value to be associated to
            key.
        """
        if key not in cache:
            with threadsafe_access(key):
                if key not in cache:
                    container = [None]
                    def producer():
                        """Places factory result into the container."""
                        container[0] = factory()
                    t = threading.Thread(target=producer)
                    t.start()
                    t.join()
                    with lock_for_cache:
                        cache[key] = container[0]
                    return container[0]
        with lock_for_cache:
            return cache[key]

    # In order to allow calls to functions with default arguments to use the
    # same hash as calls which explicitly supply them, we fetch those default
    # values and use them to build the kwargs that func will actually see.
    arg_names, _, _, defaults = inspect.getargspec(func)
    defaults = defaults if defaults is not None else ()
    default_func_kwargs = dict(zip(arg_names[-len(defaults):], defaults))

    @functools.wraps(func)
    def memoized_func(*args, **kwargs):
        """The same func, but calls to it using the same argument values are
        made exactly once.

        Returns:
            The value of func(*args, **kwargs).
        """
        func_kwargs = default_func_kwargs.copy()
        func_kwargs.update(kwargs)
        key = (tuple(args), tuple(sorted(func_kwargs.iteritems())))
        return get_from_cache(key, factory=lambda: func(*args, **kwargs))

    return memoized_func
