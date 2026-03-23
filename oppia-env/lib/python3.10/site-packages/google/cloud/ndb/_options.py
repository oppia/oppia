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

"""Support for options."""

import functools
import itertools
import logging

from google.cloud.ndb import exceptions

log = logging.getLogger(__name__)


class Options(object):
    __slots__ = (
        # Supported
        "retries",
        "timeout",
        "use_cache",
        "use_global_cache",
        "global_cache_timeout",
        "use_datastore",
        # Deprecated
        "force_writes",
        "max_memcache_items",
        "propagation",
        "deadline",
        "use_memcache",
        "memcache_timeout",
    )

    @classmethod
    def options_or_model_properties(cls, wrapped):
        return cls.options(wrapped, _disambiguate_from_model_properties=True)

    @classmethod
    def options(cls, wrapped, _disambiguate_from_model_properties=False):
        slots = set(cls.slots())
        # If there are any positional arguments, get their names.
        # inspect.signature is not available in Python 2.7, so we use the
        # arguments obtained with inspect.getargspec, which come from the
        # positional decorator used with all query_options decorated methods.
        positional = getattr(wrapped, "_positional_names", [])

        # We need for any non-option arguments to come before any option
        # arguments
        in_options = False
        for name in positional:
            if name in slots:
                in_options = True

            elif in_options and name != "_options":
                raise TypeError(
                    "All positional non-option arguments must precede option "
                    "arguments in function signature."
                )

        @functools.wraps(wrapped)
        def wrapper(*args, **kwargs):
            pass_args = []
            kw_options = {}

            # Process positional args
            for name, value in zip(positional, args):
                if name in slots:
                    kw_options[name] = value

                else:
                    pass_args.append(value)

            if _disambiguate_from_model_properties:
                model_class = args[0]
                get_arg = model_class._get_arg

            else:

                def get_arg(kwargs, name):
                    return kwargs.pop(name, None)

            # Process keyword args
            for name in slots:
                if name not in kw_options:
                    kw_options[name] = get_arg(kwargs, name)

            # If another function that uses options is delegating to this one,
            # we'll already have options.
            if "_options" not in kwargs:
                kwargs["_options"] = cls(**kw_options)

            return wrapped(*pass_args, **kwargs)

        return wrapper

    @classmethod
    def slots(cls):
        return itertools.chain(
            *(
                ancestor.__slots__
                for ancestor in cls.__mro__
                if hasattr(ancestor, "__slots__")
            )
        )

    def __init__(self, config=None, **kwargs):
        cls = type(self)
        if config is not None and not isinstance(config, cls):
            raise TypeError("Config must be a {} instance.".format(cls.__name__))

        deadline = kwargs.pop("deadline", None)
        if deadline is not None:
            timeout = kwargs.get("timeout")
            if timeout:
                raise TypeError("Can't specify both 'deadline' and 'timeout'")
            kwargs["timeout"] = deadline

        memcache_timeout = kwargs.pop("memcache_timeout", None)
        if memcache_timeout is not None:
            global_cache_timeout = kwargs.get("global_cache_timeout")
            if global_cache_timeout is not None:
                raise TypeError(
                    "Can't specify both 'memcache_timeout' and "
                    "'global_cache_timeout'"
                )
            kwargs["global_cache_timeout"] = memcache_timeout

        use_memcache = kwargs.pop("use_memcache", None)
        if use_memcache is not None:
            use_global_cache = kwargs.get("use_global_cache")
            if use_global_cache is not None:
                raise TypeError(
                    "Can't specify both 'use_memcache' and 'use_global_cache'"
                )
            kwargs["use_global_cache"] = use_memcache

        for key in self.slots():
            default = getattr(config, key, None) if config else None
            setattr(self, key, kwargs.pop(key, default))

        if kwargs.pop("xg", False):
            log.warning(
                "Use of the 'xg' option is deprecated. All transactions are "
                "cross group (up to 25 groups) transactions, by default. This "
                "option is ignored."
            )

        if kwargs:
            raise TypeError(
                "{} got an unexpected keyword argument '{}'".format(
                    type(self).__name__, next(iter(kwargs))
                )
            )

        if self.max_memcache_items is not None:
            raise exceptions.NoLongerImplementedError()

        if self.force_writes is not None:
            raise exceptions.NoLongerImplementedError()

        if self.propagation is not None:
            raise exceptions.NoLongerImplementedError()

    def __eq__(self, other):
        if type(self) is not type(other):
            return NotImplemented

        for key in self.slots():
            if getattr(self, key, None) != getattr(other, key, None):
                return False

        return True

    def __ne__(self, other):
        # required for Python 2.7 compatibility
        result = self.__eq__(other)
        if result is NotImplemented:
            result = False
        return not result

    def __repr__(self):
        options = ", ".join(
            [
                "{}={}".format(key, repr(getattr(self, key, None)))
                for key in self.slots()
                if getattr(self, key, None) is not None
            ]
        )
        return "{}({})".format(type(self).__name__, options)

    def copy(self, **kwargs):
        return type(self)(config=self, **kwargs)

    def items(self):
        for name in self.slots():
            yield name, getattr(self, name, None)


class ReadOptions(Options):
    __slots__ = ("read_consistency", "read_policy", "transaction")

    def __init__(self, config=None, **kwargs):
        read_policy = kwargs.pop("read_policy", None)
        if read_policy:
            log.warning(
                "Use of the 'read_policy' options is deprecated. Please use "
                "'read_consistency'"
            )
            if kwargs.get("read_consistency"):
                raise TypeError(
                    "Cannot use both 'read_policy' and 'read_consistency' " "options."
                )
            kwargs["read_consistency"] = read_policy

        if not kwargs.get("transaction"):
            # Avoid circular import in Python 2.7
            from google.cloud.ndb import context as context_module

            context = context_module.get_context(False)
            if context:
                kwargs["transaction"] = context.transaction

        super(ReadOptions, self).__init__(config=config, **kwargs)
