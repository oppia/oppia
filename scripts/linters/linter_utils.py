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

"""Helpers for the scripts.linters.pre_commit_linter module.

Do not use this module anywhere else in the code base!
"""

from __future__ import annotations

import collections
import contextlib
import functools
import inspect
import shutil
import sys
import tempfile
import threading

from core import python_utils


def memoize(func):
    """Decorator which provides thread-safe, cached-access to the return values
    of function calls.

    NOTE: This function uses dicts to manage the cache. This means that all
    values provided as arguments to func *must be hashable!*

    Args:
        func: callable. The callable function that is going to be run in
            thread-safe, cached-access environment.

    Returns:
        callable. The same func, but calls to it using the same arguments are
        made exactly once.
    """
    key_locks = {}
    lock_for_key_locks = threading.Lock()
    def threadsafe_access(key):
        """Returns a threading.Lock unique to the given key.

        Args:
            key: *. A hashable value.

        Returns:
            threading.Lock. A lock unique to the given key.
        """
        # Use double-checked locking to prevent race-conditions.
        if key not in key_locks:
            with lock_for_key_locks:
                if key not in key_locks:
                    key_locks[key] = threading.Lock()
        return key_locks[key]

    cache = {}
    def get_from_cache(key, factory):
        """Returns and associates a factory-provided value to the given key if a
        value isn't associated to it yet. Otherwise, returns the pre-existing
        associated value.

        Args:
            key: *. A hashable value.
            factory: callable. A value producer that takes no arguments.

        Returns:
            *. The result of factory(), or the last value to be associated to
            key.
        """
        if key in cache:
            return cache[key]
        with threadsafe_access(key):
            if key not in cache:
                cache[key] = factory()
        return cache[key]

    # In order to allow calls to functions with default arguments to use the
    # same hash as calls which explicitly supply them, we fetch those default
    # values and use them to build the kwargs that func will actually see.
    arg_names, _, _, defaults = inspect.getargspec(func)
    defaults = defaults if defaults is not None else ()
    default_func_kwargs = dict(
        python_utils.ZIP(arg_names[-len(defaults):], defaults))

    @functools.wraps(func)
    def memoized_func(*args, **kwargs):
        """The same func, but calls to it using the same argument values are
        made exactly once.

        Returns:
            function(*). The value of func(*args, **kwargs).
        """
        func_kwargs = default_func_kwargs.copy()
        func_kwargs.update(kwargs)
        key = (tuple(args), tuple(sorted(func_kwargs.items())))
        return get_from_cache(key, lambda: func(*args, **kwargs))

    return memoized_func


@contextlib.contextmanager
def redirect_stdout(new_target):
    """Redirect stdout to the new target.

    Args:
        new_target: TextIOWrapper. The new target to which stdout is redirected.

    Yields:
        TextIOWrapper. The new target.
    """
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def get_duplicates_from_list_of_strings(strings):
    """Returns a list of duplicate strings in the list of given strings.

    Args:
        strings: list(str). A list of strings.

    Returns:
        list(str). A list of duplicate string present in the given list of
        strings.
    """
    duplicates = []
    item_count_map = collections.defaultdict(int)
    for string in strings:
        item_count_map[string] += 1
        # Counting as duplicate once it's appeared twice in the list.
        if item_count_map[string] == 2:
            duplicates.append(string)

    return duplicates


@contextlib.contextmanager
def temp_dir(suffix='', prefix='', parent=None):
    """Creates a temporary directory which is only usable in a `with` context.

    Args:
        suffix: str. Appended to the temporary directory.
        prefix: str. Prepended to the temporary directory.
        parent: str or None. The parent directory to place the temporary one. If
            None, a platform-specific directory is used instead.

    Yields:
        str. The full path to the temporary directory.
    """
    new_dir = tempfile.mkdtemp(suffix=suffix, prefix=prefix, dir=parent)
    try:
        yield new_dir
    finally:
        shutil.rmtree(new_dir)


def print_failure_message(failure_message):
    """Prints the given failure message in red color.

    Args:
        failure_message: str. The failure message to print.
    """
    # \033[91m is the ANSI escape sequences for red color.
    print('\033[91m' + failure_message + '\033[0m')


def print_success_message(success_message):
    """Prints the given success_message in red color.

    Args:
        success_message: str. The success message to print.
    """
    # \033[91m is the ANSI escape sequences for green color.
    print('\033[92m' + success_message + '\033[0m')
