# Copyright (C) 2008 John Paulett (john -at- paulett.org)
# Copyright (C) 2009-2024 David Aguilar (davvid -at- gmail.com)
# All rights reserved.
#
# This software is licensed as described in the file COPYING, which
# you should have received as part of this distribution.
import decimal
import inspect
import itertools
import sys
import warnings
from itertools import chain, islice

from . import compat, handlers, tags, util
from .backend import json
from .compat import numeric_types, string_types


def encode(
    value,
    unpicklable=True,
    make_refs=True,
    keys=False,
    max_depth=None,
    reset=True,
    backend=None,
    warn=False,
    context=None,
    max_iter=None,
    use_decimal=False,
    numeric_keys=False,
    use_base85=False,
    fail_safe=None,
    indent=None,
    separators=None,
    include_properties=False,
    handle_readonly=False,
):
    """Return a JSON formatted representation of value, a Python object.

    :param unpicklable: If set to ``False`` then the output will not contain the
        information necessary to turn the JSON data back into Python objects,
        but a simpler JSON stream is produced. It's recommended to set this
        parameter to ``False`` when your code does not rely on two objects
        having the same ``id()`` value, and when it is sufficient for those two
        objects to be equal by ``==``, such as when serializing sklearn
        instances. If you experience (de)serialization being incorrect when you
        use numpy, pandas, or sklearn handlers, this should be set to ``False``.
        If you want the output to not include the dtype for numpy arrays, add::

            jsonpickle.register(
                numpy.generic, UnpicklableNumpyGenericHandler, base=True
            )

        before your pickling code.
    :param make_refs: If set to False jsonpickle's referencing support is
        disabled.  Objects that are id()-identical won't be preserved across
        encode()/decode(), but the resulting JSON stream will be conceptually
        simpler.  jsonpickle detects cyclical objects and will break the cycle
        by calling repr() instead of recursing when make_refs is set False.
    :param keys: If set to True then jsonpickle will encode non-string
        dictionary keys instead of coercing them into strings via `repr()`.
        This is typically what you want if you need to support Integer or
        objects as dictionary keys.
    :param max_depth: If set to a non-negative integer then jsonpickle will
        not recurse deeper than 'max_depth' steps into the object.  Anything
        deeper than 'max_depth' is represented using a Python repr() of the
        object.
    :param reset: Custom pickle handlers that use the `Pickler.flatten` method or
        `jsonpickle.encode` function must call `encode` with `reset=False`
        in order to retain object references during pickling.
        This flag is not typically used outside of a custom handler or
        `__getstate__` implementation.
    :param backend: If set to an instance of jsonpickle.backend.JSONBackend,
        jsonpickle will use that backend for deserialization.
    :param warn: If set to True then jsonpickle will warn when it
        returns None for an object which it cannot pickle
        (e.g. file descriptors).
    :param context: Supply a pre-built Pickler or Unpickler object to the
        `jsonpickle.encode` and `jsonpickle.decode` machinery instead
        of creating a new instance. The `context` represents the currently
        active Pickler and Unpickler objects when custom handlers are
        invoked by jsonpickle.
    :param max_iter: If set to a non-negative integer then jsonpickle will
        consume at most `max_iter` items when pickling iterators.
    :param use_decimal: If set to True jsonpickle will allow Decimal
        instances to pass-through, with the assumption that the simplejson
        backend will be used in `use_decimal` mode.  In order to use this mode
        you will need to configure simplejson::

            jsonpickle.set_encoder_options('simplejson',
                                           use_decimal=True, sort_keys=True)
            jsonpickle.set_decoder_options('simplejson',
                                           use_decimal=True)
            jsonpickle.set_preferred_backend('simplejson')

        NOTE: A side-effect of the above settings is that float values will be
        converted to Decimal when converting to json.
    :param numeric_keys: Only use this option if the backend supports integer
        dict keys natively.  This flag tells jsonpickle to leave numeric keys
        as-is rather than conforming them to json-friendly strings.
        Using ``keys=True`` is the typical solution for integer keys, so only
        use this if you have a specific use case where you want to allow the
        backend to handle serialization of numeric dict keys.
    :param use_base85:
        If possible, use base85 to encode binary data. Base85 bloats binary data
        by 1/4 as opposed to base64, which expands it by 1/3. This argument is
        ignored on Python 2 because it doesn't support it.
    :param fail_safe: If set to a function exceptions are ignored when pickling
        and if a exception happens the function is called and the return value
        is used as the value for the object that caused the error
    :param indent: When `indent` is a non-negative integer, then JSON array
        elements and object members will be pretty-printed with that indent
        level.  An indent level of 0 will only insert newlines. ``None`` is
        the most compact representation.  Since the default item separator is
        ``(', ', ': ')``,  the output might include trailing whitespace when
        ``indent`` is specified.  You can use ``separators=(',', ': ')`` to
        avoid this.  This value is passed directly to the active JSON backend
        library and not used by jsonpickle directly.
    :param separators:
        If ``separators`` is an ``(item_separator, dict_separator)`` tuple
        then it will be used instead of the default ``(', ', ': ')``
        separators.  ``(',', ':')`` is the most compact JSON representation.
        This value is passed directly to the active JSON backend library and
        not used by jsonpickle directly.
    :param include_properties:
        Include the names and values of class properties in the generated json.
        Properties are unpickled properly regardless of this setting, this is
        meant to be used if processing the json outside of Python. Certain types
        such as sets will not pickle due to not having a native-json equivalent.
        Defaults to ``False``.
    :param handle_readonly:
        Handle objects with readonly methods, such as Django's SafeString. This
        basically prevents jsonpickle from raising an exception for such objects.
        You MUST set ``handle_readonly=True`` for the decoding if you encode with
        this flag set to ``True``.

    >>> encode('my string') == '"my string"'
    True
    >>> encode(36) == '36'
    True
    >>> encode({'foo': True}) == '{"foo": true}'
    True
    >>> encode({'foo': [1, 2, [3, 4]]}, max_depth=1)
    '{"foo": "[1, 2, [3, 4]]"}'

    """
    backend = backend or json
    context = context or Pickler(
        unpicklable=unpicklable,
        make_refs=make_refs,
        keys=keys,
        backend=backend,
        max_depth=max_depth,
        warn=warn,
        max_iter=max_iter,
        numeric_keys=numeric_keys,
        use_decimal=use_decimal,
        use_base85=use_base85,
        fail_safe=fail_safe,
        include_properties=include_properties,
        handle_readonly=handle_readonly,
        original_object=value,
    )
    return backend.encode(
        context.flatten(value, reset=reset), indent=indent, separators=separators
    )


def _in_cycle(obj, objs, max_reached, make_refs):
    """Detect cyclic structures that would lead to infinite recursion"""
    return (
        (max_reached or (not make_refs and id(obj) in objs))
        and not util.is_primitive(obj)
        and not util.is_enum(obj)
    )


def _mktyperef(obj):
    """Return a typeref dictionary

    >>> _mktyperef(AssertionError) == {'py/type': 'builtins.AssertionError'}
    True

    """
    return {tags.TYPE: util.importable_name(obj)}


def _wrap_string_slot(string):
    """Converts __slots__ = 'a' into __slots__ = ('a',)"""
    if isinstance(string, string_types):
        return (string,)
    return string


class Pickler(object):
    def __init__(
        self,
        unpicklable=True,
        make_refs=True,
        max_depth=None,
        backend=None,
        keys=False,
        warn=False,
        max_iter=None,
        numeric_keys=False,
        use_decimal=False,
        use_base85=False,
        fail_safe=None,
        include_properties=False,
        handle_readonly=False,
        original_object=None,
    ):
        self.unpicklable = unpicklable
        self.make_refs = make_refs
        self.backend = backend or json
        self.keys = keys
        self.warn = warn
        self.numeric_keys = numeric_keys
        self.use_base85 = use_base85
        # The current recursion depth
        self._depth = -1
        # The maximal recursion depth
        self._max_depth = max_depth
        # Maps id(obj) to reference IDs
        self._objs = {}
        # Avoids garbage collection
        self._seen = []
        # maximum amount of items to take from a pickled iterator
        self._max_iter = max_iter
        # Whether to allow decimals to pass-through
        self._use_decimal = use_decimal
        # A cache of objects that have already been flattened.
        self._flattened = {}
        # Used for util.is_readonly, see +483
        self.handle_readonly = handle_readonly

        if self.use_base85:
            self._bytes_tag = tags.B85
            self._bytes_encoder = util.b85encode
        else:
            self._bytes_tag = tags.B64
            self._bytes_encoder = util.b64encode

        # ignore exceptions
        self.fail_safe = fail_safe
        self.include_properties = include_properties

        self._original_object = original_object

    def _determine_sort_keys(self):
        for _, options in getattr(self.backend, '_encoder_options', {}).values():
            if options.get("sort_keys", False):
                # the user has set one of the backends to sort keys
                return True
        return False

    def _sort_attrs(self, obj):
        if hasattr(obj, "__slots__") and self.warn:
            # Slots are read-only by default, the only way
            # to sort keys is to do it in a subclass
            # and that would require calling the init function
            # of the parent again. That could cause issues
            # so we refuse to handle it.
            raise TypeError(
                "Objects with __slots__ cannot have their keys reliably sorted by jsonpickle! Please sort the keys in the __slots__ definition instead."
            )
        # Somehow some classes don't have slots or dict
        elif hasattr(obj, "__dict__"):
            try:
                obj.__dict__ = dict(sorted(obj.__dict__.items()))
            except (TypeError, AttributeError):
                # Can't set attributes of builtin/extension type
                pass
        return obj

    def reset(self):
        self._objs = {}
        self._depth = -1
        self._seen = []
        self._flattened = {}

    def _push(self):
        """Steps down one level in the namespace."""
        self._depth += 1

    def _pop(self, value):
        """Step up one level in the namespace and return the value.
        If we're at the root, reset the pickler's state.
        """
        self._depth -= 1
        if self._depth == -1:
            self.reset()
        return value

    def _log_ref(self, obj):
        """
        Log a reference to an in-memory object.
        Return True if this object is new and was assigned
        a new ID. Otherwise return False.
        """
        objid = id(obj)
        is_new = objid not in self._objs
        if is_new:
            new_id = len(self._objs)
            self._objs[objid] = new_id
        return is_new

    def _mkref(self, obj):
        """
        Log a reference to an in-memory object, and return
        if that object should be considered newly logged.
        """
        is_new = self._log_ref(obj)
        # Pretend the object is new
        pretend_new = not self.unpicklable or not self.make_refs
        return pretend_new or is_new

    def _getref(self, obj):
        """Return a "py/id" entry for the specified object"""
        return {tags.ID: self._objs.get(id(obj))}

    def _flatten(self, obj):
        """Flatten an object and its guts into a json-safe representation"""
        if self.unpicklable and self.make_refs:
            result = self._flatten_impl(obj)
        else:
            try:
                result = self._flattened[id(obj)]
            except KeyError:
                result = self._flattened[id(obj)] = self._flatten_impl(obj)
        return result

    def flatten(self, obj, reset=True):
        """Takes an object and returns a JSON-safe representation of it.

        Simply returns any of the basic builtin datatypes

        >>> p = Pickler()
        >>> p.flatten('hello world') == 'hello world'
        True
        >>> p.flatten(49)
        49
        >>> p.flatten(350.0)
        350.0
        >>> p.flatten(True)
        True
        >>> p.flatten(False)
        False
        >>> r = p.flatten(None)
        >>> r is None
        True
        >>> p.flatten(False)
        False
        >>> p.flatten([1, 2, 3, 4])
        [1, 2, 3, 4]
        >>> p.flatten((1,2,))[tags.TUPLE]
        [1, 2]
        >>> p.flatten({'key': 'value'}) == {'key': 'value'}
        True
        """
        if reset:
            self.reset()
        if self._determine_sort_keys():
            obj = self._sort_attrs(obj)
        return self._flatten(obj)

    def _flatten_bytestring(self, obj):
        return {self._bytes_tag: self._bytes_encoder(obj)}

    def _flatten_impl(self, obj):
        #########################################
        # if obj is nonrecursive return immediately
        # for performance reasons we don't want to do recursive checks
        if type(obj) is bytes:
            return self._flatten_bytestring(obj)

        # Decimal is a primitive when use_decimal is True
        if type(obj) in util.PRIMITIVES or (
            self._use_decimal and isinstance(obj, decimal.Decimal)
        ):
            return obj
        #########################################

        self._push()
        return self._pop(self._flatten_obj(obj))

    def _max_reached(self):
        return self._depth == self._max_depth

    def _pickle_warning(self, obj):
        if self.warn:
            msg = 'jsonpickle cannot pickle %r: replaced with None' % obj
            warnings.warn(msg)

    def _flatten_obj(self, obj):
        self._seen.append(obj)

        max_reached = self._max_reached()

        try:
            in_cycle = _in_cycle(obj, self._objs, max_reached, self.make_refs)
            if in_cycle:
                # break the cycle
                flatten_func = repr
            else:
                flatten_func = self._get_flattener(obj)

            if flatten_func is None:
                self._pickle_warning(obj)
                return None

            return flatten_func(obj)

        except (KeyboardInterrupt, SystemExit) as e:
            raise e
        except Exception as e:
            if self.fail_safe is None:
                raise e
            else:
                return self.fail_safe(e)

    def _list_recurse(self, obj):
        return [self._flatten(v) for v in obj]

    def _flatten_function(self, obj):
        if self.unpicklable:
            data = {tags.FUNCTION: util.importable_name(obj)}
        else:
            data = None

        return data

    def _getstate(self, obj, data):
        state = self._flatten(obj)
        if self.unpicklable:
            data[tags.STATE] = state
        else:
            data = state
        return data

    def _flatten_key_value_pair(self, k, v, data):
        """Flatten a key/value pair into the passed-in dictionary."""
        if not util.is_picklable(k, v):
            return data
        # TODO: use inspect.getmembers_static on 3.11+ because it avoids dynamic
        # attribute lookups
        if (
            self.handle_readonly
            and k in {attr for attr, val in inspect.getmembers(self._original_object)}
            and util.is_readonly(self._original_object, k, v)
        ):
            return data

        if k is None:
            k = 'null'  # for compatibility with common json encoders

        if self.numeric_keys and isinstance(k, numeric_types):
            pass
        elif not isinstance(k, string_types):
            try:
                k = repr(k)
            except Exception:
                k = compat.ustr(k)

        data[k] = self._flatten(v)
        return data

    def _flatten_obj_attrs(self, obj, attrs, data):
        flatten = self._flatten_key_value_pair
        ok = False
        for k in attrs:
            try:
                if not k.startswith('__'):
                    value = getattr(obj, k)
                else:
                    value = getattr(obj, f"_{obj.__class__.__name__}{k}")
                flatten(k, value, data)
            except AttributeError:
                # The attribute may have been deleted
                continue
            ok = True
        return ok

    def _flatten_properties(self, obj, data, allslots=None):
        if allslots is None:
            # setting a list as a default argument can lead to some weird errors
            allslots = []

        # convert to set in case there are a lot of slots
        allslots_set = set(itertools.chain.from_iterable(allslots))

        # i don't like lambdas
        def valid_property(x):
            return not x[0].startswith('__') and x[0] not in allslots_set

        properties = [
            x[0] for x in inspect.getmembers(obj.__class__) if valid_property(x)
        ]

        properties_dict = {}
        for p_name in properties:
            p_val = getattr(obj, p_name)
            if util.is_not_class(p_val):
                properties_dict[p_name] = p_val
            else:
                properties_dict[p_name] = self._flatten(p_val)

        data[tags.PROPERTY] = properties_dict

        return data

    def _flatten_newstyle_with_slots(self, obj, data):
        """Return a json-friendly dict for new-style objects with __slots__."""
        allslots = [
            _wrap_string_slot(getattr(cls, '__slots__', tuple()))
            for cls in obj.__class__.mro()
        ]

        # add properties to the attribute list
        if self.include_properties:
            data = self._flatten_properties(obj, data, allslots)

        if not self._flatten_obj_attrs(obj, chain(*allslots), data):
            attrs = [
                x for x in dir(obj) if not x.startswith('__') and not x.endswith('__')
            ]
            self._flatten_obj_attrs(obj, attrs, data)

        return data

    def _flatten_obj_instance(self, obj):
        """Recursively flatten an instance and return a json-friendly dict"""
        data = {}
        has_class = hasattr(obj, '__class__')
        has_dict = hasattr(obj, '__dict__')
        has_slots = not has_dict and hasattr(obj, '__slots__')
        has_getnewargs = util.has_method(obj, '__getnewargs__')
        has_getnewargs_ex = util.has_method(obj, '__getnewargs_ex__')
        has_getinitargs = util.has_method(obj, '__getinitargs__')
        has_reduce, has_reduce_ex = util.has_reduce(obj)
        exclude = set(getattr(obj, '_jsonpickle_exclude', ()))

        # Support objects with __getstate__(); this ensures that
        # both __setstate__() and __getstate__() are implemented
        has_own_getstate = hasattr(type(obj), '__getstate__') and type(
            obj
        ).__getstate__ is not getattr(object, '__getstate__', None)
        # not using has_method since __getstate__() is handled separately below
        # Note: on Python 3.11+, all objects have __getstate__.

        if has_class:
            cls = obj.__class__
        else:
            cls = type(obj)

        # Check for a custom handler
        class_name = util.importable_name(cls)
        handler = handlers.get(cls, handlers.get(class_name))
        if handler is not None:
            if self.unpicklable:
                data[tags.OBJECT] = class_name
            result = handler(self).flatten(obj, data)
            if result is None:
                self._pickle_warning(obj)
            return result

        reduce_val = None

        if self.include_properties:
            data = self._flatten_properties(obj, data)

        if self.unpicklable:
            if has_reduce and not has_reduce_ex:
                try:
                    reduce_val = obj.__reduce__()
                except TypeError:
                    # A lot of builtin types have a reduce which
                    # just raises a TypeError
                    # we ignore those
                    pass

            # test for a reduce implementation, and redirect before
            # doing anything else if that is what reduce requests
            elif has_reduce_ex:
                try:
                    # we're implementing protocol 2
                    reduce_val = obj.__reduce_ex__(2)
                except TypeError:
                    # A lot of builtin types have a reduce which
                    # just raises a TypeError
                    # we ignore those
                    pass

            if reduce_val and isinstance(reduce_val, string_types):
                try:
                    varpath = iter(reduce_val.split('.'))
                    # curmod will be transformed by the
                    # loop into the value to pickle
                    curmod = sys.modules[next(varpath)]
                    for modname in varpath:
                        curmod = getattr(curmod, modname)
                        # replace obj with value retrieved
                        return self._flatten(curmod)
                except KeyError:
                    # well, we can't do anything with that, so we ignore it
                    pass

            elif reduce_val:
                # at this point, reduce_val should be some kind of iterable
                # pad out to len 5
                rv_as_list = list(reduce_val)
                insufficiency = 5 - len(rv_as_list)
                if insufficiency:
                    rv_as_list += [None] * insufficiency

                if getattr(rv_as_list[0], '__name__', '') == '__newobj__':
                    rv_as_list[0] = tags.NEWOBJ

                f, args, state, listitems, dictitems = rv_as_list

                # check that getstate/setstate is sane
                if not (
                    state
                    and has_own_getstate
                    and not hasattr(obj, '__setstate__')
                    and not isinstance(obj, dict)
                ):
                    # turn iterators to iterables for convenient serialization
                    if rv_as_list[3]:
                        rv_as_list[3] = tuple(rv_as_list[3])

                    if rv_as_list[4]:
                        rv_as_list[4] = tuple(rv_as_list[4])

                    reduce_args = list(map(self._flatten, rv_as_list))
                    last_index = len(reduce_args) - 1
                    while last_index >= 2 and reduce_args[last_index] is None:
                        last_index -= 1
                    data[tags.REDUCE] = reduce_args[: last_index + 1]

                    return data

        if has_class and not util.is_module(obj):
            if self.unpicklable:
                data[tags.OBJECT] = class_name

            if has_getnewargs_ex:
                data[tags.NEWARGSEX] = [
                    self._flatten(arg) for arg in obj.__getnewargs_ex__()
                ]

            if has_getnewargs and not has_getnewargs_ex:
                data[tags.NEWARGS] = self._flatten(obj.__getnewargs__())

            if has_getinitargs:
                data[tags.INITARGS] = self._flatten(obj.__getinitargs__())

        if has_own_getstate:
            try:
                state = obj.__getstate__()
            except TypeError:
                # Has getstate but it cannot be called, e.g. file descriptors
                # in Python3
                self._pickle_warning(obj)
                return None
            else:
                if state:
                    return self._getstate(state, data)

        if util.is_module(obj):
            if self.unpicklable:
                data[tags.REPR] = '{name}/{name}'.format(name=obj.__name__)
            else:
                data = compat.ustr(obj)
            return data

        if util.is_dictionary_subclass(obj):
            self._flatten_dict_obj(obj, data, exclude=exclude)
            return data

        if util.is_sequence_subclass(obj):
            return self._flatten_sequence_obj(obj, data)

        if util.is_iterator(obj):
            # force list in python 3
            data[tags.ITERATOR] = list(map(self._flatten, islice(obj, self._max_iter)))
            return data

        if has_dict:
            # Support objects that subclasses list and set
            if util.is_sequence_subclass(obj):
                return self._flatten_sequence_obj(obj, data)

            # hack for zope persistent objects; this unghostifies the object
            getattr(obj, '_', None)
            return self._flatten_dict_obj(obj.__dict__, data, exclude=exclude)

        if has_slots:
            return self._flatten_newstyle_with_slots(obj, data)

        # catchall return for data created above without a return
        # (e.g. __getnewargs__ is not supposed to be the end of the story)
        if data:
            return data

        self._pickle_warning(obj)
        return None

    def _ref_obj_instance(self, obj):
        """Reference an existing object or flatten if new"""
        if self.unpicklable:
            if self._mkref(obj):
                # We've never seen this object so return its
                # json representation.
                return self._flatten_obj_instance(obj)
            # We've seen this object before so place an object
            # reference tag in the data. This avoids infinite recursion
            # when processing cyclical objects.
            return self._getref(obj)
        else:
            max_reached = self._max_reached()
            in_cycle = _in_cycle(obj, self._objs, max_reached, False)
            if in_cycle:
                # A circular becomes None.
                return None

            self._mkref(obj)
            return self._flatten_obj_instance(obj)

    def _escape_key(self, k):
        return tags.JSON_KEY + encode(
            k,
            reset=False,
            keys=True,
            context=self,
            backend=self.backend,
            make_refs=self.make_refs,
        )

    def _flatten_non_string_key_value_pair(self, k, v, data):
        """Flatten only non-string key/value pairs"""
        if not util.is_picklable(k, v):
            return data
        if self.keys and not isinstance(k, string_types):
            k = self._escape_key(k)
            data[k] = self._flatten(v)
        return data

    def _flatten_string_key_value_pair(self, k, v, data):
        """Flatten string key/value pairs only."""
        if not util.is_picklable(k, v):
            return data
        if self.keys:
            if not isinstance(k, string_types):
                return data
            elif k.startswith(tags.JSON_KEY):
                k = self._escape_key(k)
        else:
            if k is None:
                k = 'null'  # for compatibility with common json encoders

            if self.numeric_keys and isinstance(k, numeric_types):
                pass
            elif not isinstance(k, string_types):
                try:
                    k = repr(k)
                except Exception:
                    k = compat.ustr(k)

        data[k] = self._flatten(v)
        return data

    def _flatten_dict_obj(self, obj, data=None, exclude=()):
        """Recursively call flatten() and return json-friendly dict"""
        if data is None:
            data = obj.__class__()

        # If we allow non-string keys then we have to do a two-phase
        # encoding to ensure that the reference IDs are deterministic.
        if self.keys:
            # Phase 1: serialize regular objects, ignore fancy keys.
            flatten = self._flatten_string_key_value_pair
            for k, v in util.items(obj, exclude=exclude):
                flatten(k, v, data)

            # Phase 2: serialize non-string keys.
            flatten = self._flatten_non_string_key_value_pair
            for k, v in util.items(obj, exclude=exclude):
                flatten(k, v, data)
        else:
            # If we have string keys only then we only need a single pass.
            flatten = self._flatten_key_value_pair
            for k, v in util.items(obj, exclude=exclude):
                flatten(k, v, data)

        # the collections.defaultdict protocol
        if hasattr(obj, 'default_factory') and callable(obj.default_factory):
            factory = obj.default_factory
            if util.is_type(factory):
                # Reference the class/type
                value = _mktyperef(factory)
            else:
                # The factory is not a type and could reference e.g. functions
                # or even the object instance itself, which creates a cycle.
                if self._mkref(factory):
                    # We've never seen this object before so pickle it in-place.
                    # Create an instance from the factory and assume that the
                    # resulting instance is a suitable exemplar.
                    value = self._flatten_obj_instance(handlers.CloneFactory(factory()))
                else:
                    # We've seen this object before.
                    # Break the cycle by emitting a reference.
                    value = self._getref(factory)
            data['default_factory'] = value

        # Sub-classes of dict
        if hasattr(obj, '__dict__') and self.unpicklable and obj != obj.__dict__:
            if self._mkref(obj.__dict__):
                dict_data = {}
                self._flatten_dict_obj(obj.__dict__, dict_data, exclude=exclude)
                data['__dict__'] = dict_data
            else:
                data['__dict__'] = self._getref(obj.__dict__)

        return data

    def _get_flattener(self, obj):
        if type(obj) in (list, dict):
            if self._mkref(obj):
                return (
                    self._list_recurse if type(obj) is list else self._flatten_dict_obj
                )
            else:
                return self._getref

        # We handle tuples and sets by encoding them in a "(tuple|set)dict"
        elif type(obj) in (tuple, set):
            if not self.unpicklable:
                return self._list_recurse
            return lambda obj: {
                tags.TUPLE if type(obj) is tuple else tags.SET: [
                    self._flatten(v) for v in obj
                ]
            }

        elif util.is_module_function(obj):
            return self._flatten_function

        elif util.is_object(obj):
            return self._ref_obj_instance

        elif util.is_type(obj):
            return _mktyperef

        # instance methods, lambdas, old style classes...
        self._pickle_warning(obj)
        return None

    def _flatten_sequence_obj(self, obj, data):
        """Return a json-friendly dict for a sequence subclass."""
        if hasattr(obj, '__dict__'):
            self._flatten_dict_obj(obj.__dict__, data)
        value = [self._flatten(v) for v in obj]
        if self.unpicklable:
            data[tags.SEQ] = value
        else:
            return value
        return data
