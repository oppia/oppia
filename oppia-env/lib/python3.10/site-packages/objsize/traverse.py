"""
Handling of traversal.
"""

import collections
import gc
import inspect
import sys
import types
import warnings
from typing import Any, Callable, Dict, Iterable, Iterator, Optional, Set, Tuple

# Common type: a set of objects' ID
MarkedSet = Set[int]
FilterFunc = Callable[[Any], bool]
GetReferentsFunc = Callable[..., Iterable[Any]]
SizeFunc = Callable[[Any], int]

SharedObjectType = (
    type,
    types.ModuleType,
    types.FrameType,
    types.BuiltinFunctionType,
)

SharedObjectOrFunctionType = (
    *SharedObjectType,
    types.FunctionType,
    types.LambdaType,
)


def safe_is_instance(obj: Any, type_tuple) -> bool:
    """
    Return whether an object is an instance of a class or of a subclass thereof.
    See :py:func:`isinstance()` for more information.

    Catches :class:`ReferenceError` because applying :py:func:`isinstance()` on :py:func:`weakref.proxy`
    objects attempts to dereference the proxy objects, which may yield an exception.

    Parameters
    ----------
    obj :
        Any object
    type_tuple :
        A type or a tuple of types

    Returns
    -------
    bool
        True if the objects matches one of the types
    """
    try:
        return isinstance(obj, type_tuple)
    except ReferenceError:
        return False


def shared_object_or_function_filter(obj: Any) -> bool:
    """Filters objects that are likely to be shared among many objects."""
    return not safe_is_instance(obj, SharedObjectOrFunctionType)


def shared_object_filter(obj: Any) -> bool:
    """Filters objects that are likely to be shared among many objects, but includes functions and lambdas."""
    return not safe_is_instance(obj, SharedObjectType)


def default_get_referents(*objs: Any) -> Iterable[Any]:
    """See https://docs.python.org/3/library/gc.html#gc.get_referents"""
    yield from gc.get_referents(*objs)

    # Starting from Python 3.12, c.get_referents(*objs) does not return the object's internal dict.
    for obj in objs:
        try:
            yield obj.__dict__
        except AttributeError:
            pass


default_object_filter = shared_object_or_function_filter
"""By default, we filter shared objects, i.e., types, modules, functions, and lambdas"""
default_get_size = sys.getsizeof
"""See https://docs.python.org/3/library/sys.html#sys.getsizeof"""


def _iter_modules_globals():
    modules = list(sys.modules.values())
    for mod in modules:
        try:
            yield vars(mod)
        except TypeError:
            pass


def _default(optional_value, default_value):
    if optional_value is None:
        return default_value
    return optional_value


def _default_generator(optional_value, default_value_generator):
    if optional_value is None:
        return default_value_generator()
    return optional_value


class ObjSizeSettings:
    """
    Object traversal and size settings.

    Parameters
    ----------
    filter_func :
        Receives an objects and return :py:obj:`True` if the object---and its subtree---should be traversed.
        Default: :py:func:`shared_object_filter`.
        By default, this excludes shared objects, i.e., types, modules, functions, and lambdas.
    get_referents_func :
        Receives any number of objects and returns iterable over the objects that are referred by these objects.
        Default: :py:func:`gc.get_referents`.
    get_size_func :
        A function that determines the object size.
        Default: :py:func:`sys.getsizeof`.
    exclude :
        Objects that will be excluded from this calculation, as well as their subtrees.
    exclude_modules_globals :
        If True (default), loaded modules globals will be added to the
        :py:attr:`~TraversalContext.exclude_set`.
    """

    def __init__(
        self,
        get_referents_func: Optional[GetReferentsFunc] = None,
        filter_func: Optional[FilterFunc] = None,
        get_size_func: Optional[SizeFunc] = None,
        exclude: Optional[Iterable] = None,
        exclude_modules_globals: Optional[bool] = None,
    ):
        self.get_referents_func = _default(get_referents_func, default_get_referents)
        self.filter_func = _default(filter_func, default_object_filter)
        self.get_size_func = _default(get_size_func, default_get_size)
        self.exclude = _default(exclude, None)
        self.exclude_modules_globals = _default(exclude_modules_globals, True)

    def replace(
        self,
        get_referents_func: Optional[GetReferentsFunc] = None,
        filter_func: Optional[FilterFunc] = None,
        get_size_func: Optional[SizeFunc] = None,
        exclude: Optional[Iterable] = None,
        exclude_modules_globals: Optional[bool] = None,
    ) -> "ObjSizeSettings":
        """
        Replaces some of the settings into a new settings object.

        Returns
        -------
            A new settings instance
        """
        return ObjSizeSettings(
            get_referents_func=_default(get_referents_func, self.get_referents_func),
            filter_func=_default(filter_func, self.filter_func),
            get_size_func=_default(get_size_func, self.get_size_func),
            exclude=_default(exclude, self.exclude),
            exclude_modules_globals=_default(exclude_modules_globals, self.exclude_modules_globals),
        )

    def update(
        self,
        get_referents_func: Optional[GetReferentsFunc] = None,
        filter_func: Optional[FilterFunc] = None,
        get_size_func: Optional[SizeFunc] = None,
        exclude: Optional[Iterable] = None,
        exclude_modules_globals: Optional[bool] = None,
    ):
        """
        Updates some of the settings in place.
        """
        self.get_referents_func = _default(get_referents_func, self.get_referents_func)
        self.filter_func = _default(filter_func, self.filter_func)
        self.get_size_func = _default(get_size_func, self.get_size_func)
        self.exclude = _default(exclude, self.exclude)
        self.exclude_modules_globals = _default(exclude_modules_globals, self.exclude_modules_globals)

    def new_context(self, *, marked_set: Optional[MarkedSet] = None, exclude_set: Optional[MarkedSet] = None):
        """See :py:class:`TraversalContext`."""
        return TraversalContext(self, marked_set, exclude_set)

    def traverse_bfs(
        self, *objs: Any, marked_set: Optional[MarkedSet] = None, exclude_set: Optional[MarkedSet] = None
    ) -> Iterator[Any]:
        """See :py:meth:`TraversalContext.traverse_bfs`"""
        yield from self.new_context(marked_set=marked_set, exclude_set=exclude_set).traverse_bfs(*objs)

    def traverse_exclusive_bfs(
        self, *objs: Any, marked_set: Optional[MarkedSet] = None, exclude_set: Optional[MarkedSet] = None
    ) -> Iterator[Any]:
        """See :py:meth:`TraversalContext.traverse_exclusive_bfs`"""
        yield from self.new_context(marked_set=marked_set, exclude_set=exclude_set).traverse_exclusive_bfs(*objs)

    def get_deep_size(
        self, *objs: Any, marked_set: Optional[MarkedSet] = None, exclude_set: Optional[MarkedSet] = None
    ) -> int:
        """See :py:meth:`TraversalContext.get_deep_size`"""
        return self.new_context(marked_set=marked_set, exclude_set=exclude_set).get_deep_size(*objs)

    def get_exclusive_deep_size(
        self, *objs: Any, marked_set: Optional[MarkedSet] = None, exclude_set: Optional[MarkedSet] = None
    ) -> int:
        """See :py:meth:`TraversalContext.get_exclusive_deep_size`"""
        return self.new_context(marked_set=marked_set, exclude_set=exclude_set).get_exclusive_deep_size(*objs)


class TraversalContext:
    """
    Object traversal context.

    Parameters
    ----------
    settings :
        See :py:class:`ObjSizeSettings`
    marked_set :
        An existing set of marked objects' ID, i.e., `id(obj)`.
        Objects that their ID is in this set will not be traversed.
        If a set is given, it will be updated with all the traversed objects' ID.
    exclude_set :
        Similar to the marked set, but contains excluded objects' ID.
    """

    def __init__(
        self,
        settings: Optional[ObjSizeSettings] = None,
        marked_set: Optional[MarkedSet] = None,
        exclude_set: Optional[MarkedSet] = None,
    ):
        if marked_set is not None or exclude_set is not None:
            warnings.warn(
                "marked_set and exclude_set parameters are deprecated. They will be removed on version 1.0.0. "
                "Please use objsize.traverse.TraversalContext(settings) instead.",
                DeprecationWarning,
            )
        self.settings = _default_generator(settings, ObjSizeSettings)
        self.marked_set = _default_generator(marked_set, set)
        self.exclude_set = _default_generator(exclude_set, set)
        self._update_exclude_set()

    def _update_exclude_set(self):
        """
        Traverse all the excluded subtree without ingesting the result, just to update the `exclude_set`.
        See `traverse_bfs()` for more information.
        """
        # None shouldn't be included in size calculations because it is a singleton
        self.exclude_set.add(id(None))

        if self.settings.exclude_modules_globals:
            # Modules' "globals" should not be included as they are shared
            self.exclude_set.update(map(id, _iter_modules_globals()))

        if self.settings.exclude is not None:
            collections.deque(self.traverse_bfs(*self.settings.exclude, exclude=True), maxlen=0)

    def _obj_filter_iterator(self, obj_it: Iterable[Any]) -> Iterator[Tuple[int, Any]]:
        """
        Filters the input. Only yields objects such that:
         - Object ID was not already marked/excluded (using the marked-set/exclude-set).
         - Object pass the given filter function (see above).
        """
        for obj in obj_it:
            obj_id = id(obj)
            if obj_id not in self.marked_set and obj_id not in self.exclude_set and self.settings.filter_func(obj):
                yield obj_id, obj

    def _filter(self, obj_it: Iterable[Any]) -> Dict[int, Any]:
        """Apply filter, and screen repeated objects (using dict notation)."""
        return dict(self._obj_filter_iterator(obj_it))

    def traverse_bfs(self, *objs: Any, exclude=False) -> Iterator[Any]:
        """
        Traverse all the arguments' subtree.

        Parameters
        ----------
        objs : object(s)
            One or more object(s).
        exclude: bool
            If true, all objects will be added to the exclude set.

        Yields
        ------
        object
            The traversed objects, one by one.
        """
        if not exclude:
            marked_set = self.marked_set
        else:
            marked_set = self.exclude_set

        obj_it: Iterable[Any] = iter(objs)

        while obj_it:
            # Apply filter, and screen repeated objects.
            objs_map = self._filter(obj_it)

            # We stop when there are no new valid objects to traverse.
            if not objs_map:
                break

            # Update the marked set with the ids, so we will not traverse them again.
            marked_set.update(objs_map.keys())

            # Yield traversed objects
            yield from objs_map.values()

            # Lookup all the object referred to by the object from the current round.
            obj_it = self.settings.get_referents_func(*objs_map.values())

    def traverse_exclusive_bfs(self, *objs: Any) -> Iterator[Any]:
        """
        Traverse all the arguments' subtree, excluding non-exclusive objects.
        That is, objects that are referenced by objects that are not in this subtree.

        Parameters
        ----------
        objs : object(s)
            One or more object(s).

        Yields
        ------
        object
            The traversed objects, one by one.

        See Also
        --------
        :py:meth:`traverse_bfs` : to understand which objects are traversed.
        """
        # The arguments are considered the root objects, which we include regardless of their exclusiveness.
        root_obj_ids = set(map(id, objs))

        # We have to complete the entire traverse, so we will have a complete marked set.
        subtree = tuple(self.traverse_bfs(*objs))

        # We keep the current frame and `subtree` objects in addition to the marked-set because they refer to objects
        # in our subtree which may cause them to appear non-exclusive.
        # `objs` should not be added as it only refers to the root objects.
        frame_set = self.marked_set | {id(inspect.currentframe()), id(subtree)}

        # We first make sure that any "old" objects that may refer to our subtree were collected.
        gc.collect()

        # Test for each object that all the object that refer to it is in the marked-set, frame-set, or is a root
        # See: https://docs.python.org/3.7/library/gc.html#gc.get_referrers
        for obj in subtree:
            if id(obj) in root_obj_ids or frame_set.issuperset(map(id, gc.get_referrers(obj))):
                yield obj

    def get_deep_size(self, *objs: Any) -> int:
        """
        Calculates the deep size of all the arguments.

        Parameters
        ----------
        objs : object(s)
            One or more object(s).

        Returns
        -------
        int
            The objects' deep size in bytes.

        See Also
        --------
        :py:func:`~objsize.traverse.TraversalContext.traverse_bfs` : to understand which objects are traversed.
        """
        return sum(map(self.settings.get_size_func, self.traverse_bfs(*objs)))

    def get_exclusive_deep_size(self, *objs: Any) -> int:
        """
        Calculates the deep size of all the arguments, excluding non-exclusive objects.

        Parameters
        ----------
        objs : object(s)
            One or more object(s).

        Returns
        -------
        int
            The objects' deep size in bytes.

        See Also
        --------
        :py:func:`~objsize.traverse.TraversalContext.traverse_exclusive_bfs` :
            to understand which objects are traversed.
        """
        return sum(map(self.settings.get_size_func, self.traverse_exclusive_bfs(*objs)))
