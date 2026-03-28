"""
Traversal over Python's objects subtree and calculating the total size of the subtree (deep size).
"""

import warnings
from typing import Any, Iterable, Iterator, Optional

from objsize.traverse import (
    FilterFunc,
    GetReferentsFunc,
    MarkedSet,
    ObjSizeSettings,
    SharedObjectOrFunctionType,
    SharedObjectType,
    SizeFunc,
    TraversalContext,
    default_get_referents,
    default_object_filter,
    safe_is_instance,
    shared_object_filter,
    shared_object_or_function_filter,
)

__version__ = "0.7.1"

default_settings = ObjSizeSettings()
"""
The default instance :py:class:`obj objsize settings <objsize.traverse.ObjSizeSettings>`.
It can be updated to modify the default behaviour of objsize.
"""


def traverse_bfs(
    *objs,
    exclude: Optional[Iterable[Any]] = None,
    marked_set: Optional[MarkedSet] = None,
    exclude_set: Optional[MarkedSet] = None,
    get_referents_func: Optional[GetReferentsFunc] = None,
    filter_func: Optional[FilterFunc] = None,
    exclude_modules_globals: Optional[bool] = None,
) -> Iterator[Any]:
    """
    Traverse all the arguments' subtree.
    By default, this excludes shared objects, i.e., types, modules, functions, and lambdas.

    Parameters
    ----------
    objs : object(s)
        One or more object(s).
    exclude :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    marked_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    exclude_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    get_referents_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    filter_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    exclude_modules_globals :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.

    Yields
    ------
    object
        The traversed objects, one by one.
    """
    settings = default_settings.replace(get_referents_func, filter_func, None, exclude, exclude_modules_globals)
    yield from settings.traverse_bfs(*objs, marked_set=marked_set, exclude_set=exclude_set)


def traverse_exclusive_bfs(
    *objs,
    exclude: Optional[Iterable[Any]] = None,
    marked_set: Optional[MarkedSet] = None,
    exclude_set: Optional[MarkedSet] = None,
    get_referents_func: Optional[GetReferentsFunc] = None,
    filter_func: Optional[FilterFunc] = None,
    exclude_modules_globals: Optional[bool] = None,
) -> Iterator[Any]:
    """
    Traverse all the arguments' subtree, excluding non-exclusive objects.
    That is, objects that are referenced by objects that are not in this subtree.

    Parameters
    ----------
    objs : object(s)
        One or more object(s).
    exclude :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    marked_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    exclude_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    get_referents_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    filter_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    exclude_modules_globals :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.

    Yields
    ------
    object
        The traversed objects, one by one.

    See Also
    --------
    traverse_bfs : to understand which objects are traversed.
    """
    settings = default_settings.replace(get_referents_func, filter_func, None, exclude, exclude_modules_globals)
    yield from settings.traverse_exclusive_bfs(*objs, marked_set=marked_set, exclude_set=exclude_set)


def get_deep_size(  # pylint: disable=too-many-arguments
    *objs,
    exclude: Optional[Iterable[Any]] = None,
    marked_set: Optional[MarkedSet] = None,
    exclude_set: Optional[MarkedSet] = None,
    get_size_func: Optional[SizeFunc] = None,
    get_referents_func: Optional[GetReferentsFunc] = None,
    filter_func: Optional[FilterFunc] = None,
    exclude_modules_globals: Optional[bool] = None,
) -> int:
    """
    Calculates the deep size of all the arguments.

    Parameters
    ----------
    objs : object(s)
        One or more object(s).
    exclude :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    marked_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    exclude_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    get_size_func :
        See :py:class:`~objsize.size.ObjSizeSettings`.
    get_referents_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    filter_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    exclude_modules_globals :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.

    Returns
    -------
    int
        The objects' deep size in bytes.

    See Also
    --------
    traverse_bfs : to understand which objects are traversed.
    """
    settings = default_settings.replace(
        get_referents_func, filter_func, get_size_func, exclude, exclude_modules_globals
    )
    return settings.get_deep_size(*objs, marked_set=marked_set, exclude_set=exclude_set)


def get_exclusive_deep_size(  # pylint: disable=too-many-arguments
    *objs,
    exclude: Optional[Iterable[Any]] = None,
    marked_set: Optional[MarkedSet] = None,
    exclude_set: Optional[MarkedSet] = None,
    get_size_func: Optional[SizeFunc] = None,
    get_referents_func: Optional[GetReferentsFunc] = None,
    filter_func: Optional[FilterFunc] = None,
    exclude_modules_globals: Optional[bool] = None,
) -> int:
    """
    Calculates the deep size of all the arguments, excluding non-exclusive objects.

    Parameters
    ----------
    objs : object(s)
        One or more object(s).
    exclude :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    marked_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    exclude_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    get_size_func :
        See :py:class:`~objsize.size.ObjSizeSettings`.
    get_referents_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    filter_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    exclude_modules_globals :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.

    Returns
    -------
    int
        The objects' deep size in bytes.

    See Also
    --------
    traverse_exclusive_bfs : to understand which objects are traversed.
    """
    settings = default_settings.replace(
        get_referents_func, filter_func, get_size_func, exclude, exclude_modules_globals
    )
    return settings.get_exclusive_deep_size(*objs, marked_set=marked_set, exclude_set=exclude_set)


def get_exclude_set(
    exclude: Optional[Iterable[Any]] = None,
    exclude_set: Optional[MarkedSet] = None,
    get_referents_func: GetReferentsFunc = default_get_referents,
    filter_func: FilterFunc = default_object_filter,
    exclude_modules_globals: bool = False,
) -> set:
    """
    Traverse all the arguments' subtree without ingesting the result, just to update the `exclude_set`.
    See `traverse_bfs()` for more information.

    :deprecated: It will be removed on version 1.0.0.

    Parameters
    ----------
    exclude :
        One or more object(s).
    exclude_set :
        See :py:class:`~objsize.traverse.TraversalContext`.
    get_referents_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    filter_func :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.
    exclude_modules_globals :
        See :py:class:`~objsize.traverse.ObjSizeSettings`.

    Returns
    -------
    set
        The updated exclude-set.

    Attention
    ---------
    Deprecated. It will be removed on version 1.0.0.
    """
    warnings.warn("objsize.get_exclude_set() is deprecated. It will be removed on version 1.0.0.", DeprecationWarning)
    settings = default_settings.replace(get_referents_func, filter_func, None, exclude, exclude_modules_globals)
    return settings.new_context(exclude_set=exclude_set).exclude_set
