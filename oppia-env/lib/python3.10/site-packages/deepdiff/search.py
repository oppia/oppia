#!/usr/bin/env python
import re
from collections.abc import MutableMapping, Iterable
from typing import Any, Dict, FrozenSet, List, Pattern, Set, Union, Tuple
from deepdiff.helper import SetOrdered
import logging

from deepdiff.helper import (
    strings, numbers, add_to_frozen_set, get_doc, dict_, RE_COMPILED_TYPE, ipranges
)


logger = logging.getLogger(__name__)


doc = get_doc('search_doc.rst')


class DeepSearch(Dict[str, Union[Dict[str, Any], SetOrdered, List[str]]]):
    r"""
    **DeepSearch**

    Deep Search inside objects to find the item matching your criteria.

    **Parameters**

    obj : The object to search within

    item : The item to search for

    verbose_level : int >= 0, default = 1.
        Verbose level one shows the paths of found items.
        Verbose level 2 shows the path and value of the found items.

    exclude_paths: list, default = None.
        List of paths to exclude from the report.

    exclude_types: list, default = None.
        List of object types to exclude from the report.

    case_sensitive: Boolean, default = False

    match_string: Boolean, default = False
        If True, the value of the object or its children have to exactly match the item.
        If False, the value of the item can be a part of the value of the object or its children

    use_regexp: Boolean, default = False

    strict_checking: Boolean, default = True
        If True, it will check the type of the object to match, so when searching for '1234',
        it will NOT match the int 1234. Currently this only affects the numeric values searching.

    **Returns**

        A DeepSearch object that has the matched paths and matched values.

    **Supported data types**

    int, string, unicode, dictionary, list, tuple, set, frozenset, OrderedDict, NamedTuple and custom objects!

    **Examples**

    Importing
        >>> from deepdiff import DeepSearch
        >>> from pprint import pprint

    Search in list for string
        >>> obj = ["long somewhere", "string", 0, "somewhere great!"]
        >>> item = "somewhere"
        >>> ds = DeepSearch(obj, item, verbose_level=2)
        >>> print(ds)
        {'matched_values': {'root[3]': 'somewhere great!', 'root[0]': 'long somewhere'}}

    Search in nested data for string
        >>> obj = ["something somewhere", {"long": "somewhere", "string": 2, 0: 0, "somewhere": "around"}]
        >>> item = "somewhere"
        >>> ds = DeepSearch(obj, item, verbose_level=2)
        >>> pprint(ds, indent=2)
        { 'matched_paths': {"root[1]['somewhere']": 'around'},
          'matched_values': { 'root[0]': 'something somewhere',
                              "root[1]['long']": 'somewhere'}}

    """

    warning_num: int = 0

    def __init__(self,
                 obj: Any,
                 item: Any,
                 exclude_paths: Union[SetOrdered, Set[str], List[str]] = SetOrdered(),
                 exclude_regex_paths: Union[SetOrdered, Set[Union[str, Pattern[str]]], List[Union[str, Pattern[str]]]] = SetOrdered(),
                 exclude_types: Union[SetOrdered, Set[type], List[type]] = SetOrdered(),
                 verbose_level: int = 1,
                 case_sensitive: bool = False,
                 match_string: bool = False,
                 use_regexp: bool = False,
                 strict_checking: bool = True,
                 **kwargs: Any) -> None:
        if kwargs:
            raise ValueError((
                "The following parameter(s) are not valid: %s\n"
                "The valid parameters are obj, item, exclude_paths, exclude_types,\n"
                "case_sensitive, match_string and verbose_level."
            ) % ', '.join(kwargs.keys()))

        self.obj: Any = obj
        self.case_sensitive: bool = case_sensitive if isinstance(item, strings) else True
        item = item if self.case_sensitive else (item.lower() if isinstance(item, str) else item)
        self.exclude_paths: SetOrdered = SetOrdered(exclude_paths)
        self.exclude_regex_paths: List[Pattern[str]] = [re.compile(exclude_regex_path) for exclude_regex_path in exclude_regex_paths]
        self.exclude_types: SetOrdered = SetOrdered(exclude_types)
        self.exclude_types_tuple: tuple[type, ...] = tuple(
            exclude_types)  # we need tuple for checking isinstance
        self.verbose_level: int = verbose_level
        self.update(
            matched_paths=self.__set_or_dict(),
            matched_values=self.__set_or_dict(),
            unprocessed=[])
        # Type narrowing for mypy/pyright
        self.matched_paths: Union[Dict[str, Any], SetOrdered]
        self.matched_values: Union[Dict[str, Any], SetOrdered]
        self.unprocessed: List[str]
        self.use_regexp: bool = use_regexp
        if not strict_checking and (isinstance(item, numbers) or isinstance(item, ipranges)):
            item = str(item)
        if self.use_regexp:
            try:
                item = re.compile(item)
            except TypeError as e:
                raise TypeError(f"The passed item of {item} is not usable for regex: {e}") from None
        self.strict_checking: bool = strict_checking

        # Cases where user wants to match exact string item
        self.match_string: bool = match_string

        self.__search(obj, item, parents_ids=frozenset({id(obj)}))

        empty_keys = [k for k, v in self.items() if not v]

        for k in empty_keys:
            del self[k]

    def __set_or_dict(self) -> Union[Dict[str, Any], SetOrdered]:
        return dict_() if self.verbose_level >= 2 else SetOrdered()

    def __report(self, report_key: str, key: str, value: Any) -> None:
        if self.verbose_level >= 2:
            report_dict = self[report_key]
            if isinstance(report_dict, dict):
                report_dict[key] = value
        else:
            report_set = self[report_key]
            if isinstance(report_set, SetOrdered):
                report_set.add(key)

    def __search_obj(self,
                     obj: Any,
                     item: Any,
                     parent: str,
                     parents_ids: FrozenSet[int] = frozenset(),
                     is_namedtuple: bool = False) -> None:
        """Search objects"""
        found = False
        if obj == item:
            found = True
            # We report the match but also continue inside the match to see if there are
            # further matches inside the `looped` object.
            self.__report(report_key='matched_values', key=parent, value=obj)

        try:
            if is_namedtuple:
                obj = obj._asdict()
            else:
                # Skip magic methods. Slightly hacky, but unless people are defining
                # new magic methods they want to search, it should work fine.
                obj = {i: getattr(obj, i) for i in dir(obj)
                       if not (i.startswith('__') and i.endswith('__'))}
        except AttributeError:
            try:
                obj = {i: getattr(obj, i) for i in obj.__slots__}
            except AttributeError:
                if not found:
                    unprocessed = self.get('unprocessed', [])
                    if isinstance(unprocessed, list):
                        unprocessed.append("%s" % parent)

                return

        self.__search_dict(
            obj, item, parent, parents_ids, print_as_attribute=True)

    def __skip_this(self, item: Any, parent: str) -> bool:
        skip = False
        if parent in self.exclude_paths:
            skip = True
        elif self.exclude_regex_paths and any(
                [exclude_regex_path.search(parent) for exclude_regex_path in self.exclude_regex_paths]):
            skip = True
        else:
            if isinstance(item, self.exclude_types_tuple):
                skip = True

        return skip

    def __search_dict(self,
                      obj: Union[Dict[Any, Any], MutableMapping[Any, Any]],
                      item: Any,
                      parent: str,
                      parents_ids: FrozenSet[int] = frozenset(),
                      print_as_attribute: bool = False) -> None:
        """Search dictionaries"""
        if print_as_attribute:
            parent_text = "%s.%s"
        else:
            parent_text = "%s[%s]"

        obj_keys = SetOrdered(obj.keys())

        for item_key in obj_keys:
            if not print_as_attribute and isinstance(item_key, strings):
                item_key_str = "'%s'" % item_key
            else:
                item_key_str = item_key

            obj_child = obj[item_key]

            item_id = id(obj_child)

            if parents_ids and item_id in parents_ids:
                continue

            parents_ids_added = add_to_frozen_set(parents_ids, item_id)

            new_parent = parent_text % (parent, item_key_str)
            new_parent_cased = new_parent if self.case_sensitive else new_parent.lower()

            str_item = str(item)
            if (self.match_string and str_item == new_parent_cased) or\
               (not self.match_string and str_item in new_parent_cased) or\
               (self.use_regexp and item.search(new_parent_cased)):
                self.__report(
                    report_key='matched_paths',
                    key=new_parent,
                    value=obj_child)

            self.__search(
                obj_child,
                item,
                parent=new_parent,
                parents_ids=parents_ids_added)

    def __search_iterable(self,
                          obj: Iterable[Any],
                          item: Any,
                          parent: str = "root",
                          parents_ids: FrozenSet[int] = frozenset()) -> None:
        """Search iterables except dictionaries, sets and strings."""
        for i, thing in enumerate(obj):
            new_parent = "{}[{}]".format(parent, i)
            if self.__skip_this(thing, parent=new_parent):
                continue

            if self.case_sensitive or not isinstance(thing, strings):
                thing_cased = thing
            else:
                thing_cased = thing.lower() if isinstance(thing, str) else thing

            if not self.use_regexp and thing_cased == item:
                self.__report(
                    report_key='matched_values', key=new_parent, value=thing)
            else:
                item_id = id(thing)
                if parents_ids and item_id in parents_ids:
                    continue
                parents_ids_added = add_to_frozen_set(parents_ids, item_id)
                self.__search(thing, item, "%s[%s]" %
                              (parent, i), parents_ids_added)

    def __search_str(self, obj: Union[str, bytes, memoryview], item: Union[str, bytes, memoryview, Pattern[str]], parent: str) -> None:
        """Compare strings"""
        obj_text = obj if self.case_sensitive else (obj.lower() if isinstance(obj, str) else obj)

        is_matched = False
        if self.use_regexp and isinstance(item, type(re.compile(''))):
            is_matched = bool(item.search(str(obj_text)))
        elif (self.match_string and str(item) == str(obj_text)) or (not self.match_string and str(item) in str(obj_text)):
            is_matched = True
        if is_matched:
            self.__report(report_key='matched_values', key=parent, value=obj)

    def __search_numbers(self, obj: Any, item: Any, parent: str) -> None:
        if (
            item == obj or (
                not self.strict_checking and (
                    item == str(obj) or (
                        self.use_regexp and item.search(str(obj))
                    )
                )
            )
        ):
            self.__report(report_key='matched_values', key=parent, value=obj)

    def __search_tuple(self, obj: Tuple[Any, ...], item: Any, parent: str, parents_ids: FrozenSet[int]) -> None:
        # Checking to see if it has _fields. Which probably means it is a named
        # tuple.
        try:
            getattr(obj, '_asdict')
        # It must be a normal tuple
        except AttributeError:
            self.__search_iterable(obj, item, parent, parents_ids)
        # We assume it is a namedtuple then
        else:
            self.__search_obj(
                obj, item, parent, parents_ids, is_namedtuple=True)

    def __search(self, obj: Any, item: Any, parent: str = "root", parents_ids: FrozenSet[int] = frozenset()) -> None:
        """The main search method"""
        if self.__skip_this(item, parent):
            return

        elif isinstance(obj, strings) and isinstance(item, (strings, RE_COMPILED_TYPE)):
            self.__search_str(obj, item, parent)

        elif isinstance(obj, strings) and isinstance(item, numbers):
            return

        elif isinstance(obj, ipranges):
            self.__search_str(str(obj), item, parent)

        elif isinstance(obj, numbers):
            self.__search_numbers(obj, item, parent)

        elif isinstance(obj, MutableMapping):
            self.__search_dict(obj, item, parent, parents_ids)

        elif isinstance(obj, tuple):
            self.__search_tuple(obj, item, parent, parents_ids)

        elif isinstance(obj, (set, frozenset)):
            if self.warning_num < 10:
                logger.warning(
                    "Set item detected in the path."
                    "'set' objects do NOT support indexing. But DeepSearch will still report a path."
                )
                self.warning_num += 1
            self.__search_iterable(obj, item, parent, parents_ids)

        elif isinstance(obj, Iterable) and not isinstance(obj, strings):
            self.__search_iterable(obj, item, parent, parents_ids)

        else:
            self.__search_obj(obj, item, parent, parents_ids)


class grep:
    __doc__ = doc

    def __init__(self,
                 item: Any,
                 **kwargs: Any) -> None:
        self.item: Any = item
        self.kwargs: Dict[str, Any] = kwargs

    def __ror__(self, other: Any) -> "DeepSearch":
        return DeepSearch(obj=other, item=self.item, **self.kwargs)


if __name__ == "__main__":  # pragma: no cover
    import doctest
    doctest.testmod()
