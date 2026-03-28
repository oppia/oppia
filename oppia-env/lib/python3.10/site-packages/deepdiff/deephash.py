#!/usr/bin/env python
import logging
import datetime
import uuid
from typing import Union, Optional, Any, List, TYPE_CHECKING, Dict, Tuple, Set, Callable, Iterator, Generator, TypeVar, Protocol
from collections.abc import Iterable, MutableMapping
from collections import defaultdict
from hashlib import sha1, sha256
from pathlib import Path
from enum import Enum
import re
from deepdiff.helper import (strings, numbers, times, unprocessed, not_hashed, add_to_frozen_set,
                             convert_item_or_items_into_set_else_none, get_doc, ipranges,
                             convert_item_or_items_into_compiled_regexes_else_none,
                             get_id, type_is_subclass_of_type_group, type_in_type_group,
                             number_to_string, datetime_normalize, KEY_TO_VAL_STR,
                             get_truncate_datetime, dict_, add_root_to_paths, PydanticBaseModel)

from deepdiff.base import Base

if TYPE_CHECKING:
    from pytz.tzinfo import BaseTzInfo
    import pandas as pd
    import polars as pl
    import numpy as np

# Type aliases for better readability
HashableType = Union[str, int, float, bytes, bool, tuple, frozenset, type(None)]
HashResult = Union[str, Any]  # Can be string hash or unprocessed marker
HashTuple = Tuple[HashResult, int]  # (hash_result, count)
HashesDict = Dict[Any, Union[HashTuple, List[Any]]]  # Special case for UNPROCESSED_KEY
PathType = Union[str, List[str], Set[str]]
RegexType = Union[str, re.Pattern[str], List[Union[str, re.Pattern[str]]]]
NumberToStringFunc = Callable[..., str]  # More flexible for different number_to_string implementations


try:
    import pandas
except ImportError:
    pandas = False  # type: ignore

try:
    import polars
except ImportError:
    polars = False  # type: ignore
try:
    import numpy as np
    booleanTypes: Tuple[type, ...] = (bool, np.bool_)  # type: ignore
except ImportError:
    booleanTypes = (bool,)  # type: ignore

logger: logging.Logger = logging.getLogger(__name__)

UNPROCESSED_KEY: object = object()

EMPTY_FROZENSET: frozenset = frozenset()

INDEX_VS_ATTRIBUTE: Tuple[str, str] = ('[%s]', '.%s')


HASH_LOOKUP_ERR_MSG: str = '{} is not one of the hashed items.'


def sha256hex(obj: Union[str, bytes]) -> str:
    """Use Sha256 as a cryptographic hash."""
    if isinstance(obj, str):
        obj = obj.encode('utf-8')
    return sha256(obj).hexdigest()


def sha1hex(obj: Union[str, bytes]) -> str:
    """Use Sha1 as a cryptographic hash."""
    if isinstance(obj, str):
        obj = obj.encode('utf-8')
    return sha1(obj).hexdigest()


default_hasher: Callable[[Union[str, bytes]], str] = sha256hex


def combine_hashes_lists(items: List[List[str]], prefix: Union[str, bytes]) -> str:
    """
    Combines lists of hashes into one hash
    This can be optimized in future.
    It needs to work with both murmur3 hashes (int) and sha256 (str)
    Although murmur3 is not used anymore.
    """
    if isinstance(prefix, bytes):
        prefix = prefix.decode('utf-8')
    hashes_bytes = b''
    for item in items:
        # In order to make sure the order of hashes in each item does not affect the hash
        # we resort them.
        hashes_bytes += (''.join(map(str, sorted(item))) + '--').encode('utf-8')
    return prefix + str(default_hasher(hashes_bytes))


class BoolObj(Enum):
    TRUE = 1
    FALSE = 0


def prepare_string_for_hashing(
        obj: Union[str, bytes, memoryview],
        ignore_string_type_changes: bool = False,
        ignore_string_case: bool = False,
        encodings: Optional[List[str]] = None,
        ignore_encoding_errors: bool = False,
) -> str:
    """
    Clean type conversions
    """
    original_type = obj.__class__.__name__
    # https://docs.python.org/3/library/codecs.html#codecs.decode
    errors_mode = 'ignore' if ignore_encoding_errors else 'strict'
    if isinstance(obj, memoryview):
        obj = obj.tobytes()
    if isinstance(obj, bytes):
        err = None
        encodings = ['utf-8'] if encodings is None else encodings
        encoded = False
        for encoding in encodings:
            try:
                obj = obj.decode(encoding, errors=errors_mode)
                encoded = True
                break
            except UnicodeDecodeError as er:
                err = er
        if not encoded and err is not None:
            obj_decoded = obj.decode('utf-8', errors='ignore')  # type: ignore
            start = max(err.start - 20, 0)
            start_prefix = ''
            if start > 0:
                start_prefix = '...'
            end = err.end + 20
            end_suffix = '...'
            if end >= len(obj):
                end = len(obj)
                end_suffix = ''
            raise UnicodeDecodeError(
                err.encoding,
                err.object,
                err.start,
                err.end,
                f"{err.reason} in '{start_prefix}{obj_decoded[start:end]}{end_suffix}'. Please either pass ignore_encoding_errors=True or pass the encoding via encodings=['utf-8', '...']."
            ) from None
    if not ignore_string_type_changes:
        obj = KEY_TO_VAL_STR.format(original_type, obj)
    if ignore_string_case:
        obj = obj.lower()
    return str(obj)


doc = get_doc('deephash_doc.rst')


class DeepHash(Base):
    __doc__ = doc
    
    # Class attributes
    hashes: Dict[Any, Any]
    exclude_types_tuple: Tuple[type, ...]
    ignore_repetition: bool
    exclude_paths: Optional[Set[str]]
    include_paths: Optional[Set[str]]
    exclude_regex_paths: Optional[List[re.Pattern[str]]]
    hasher: Callable[[Union[str, bytes]], str]
    use_enum_value: bool
    default_timezone: Union[datetime.timezone, "BaseTzInfo"]
    significant_digits: Optional[int]
    truncate_datetime: Optional[str]
    number_format_notation: str
    ignore_type_in_groups: Any
    ignore_string_type_changes: bool
    ignore_numeric_type_changes: bool
    ignore_string_case: bool
    exclude_obj_callback: Optional[Callable[[Any, str], bool]]
    apply_hash: bool
    type_check_func: Callable[[type, Any], bool]
    number_to_string: Any
    ignore_private_variables: bool
    encodings: Optional[List[str]]
    ignore_encoding_errors: bool
    ignore_iterable_order: bool
    custom_operators: Optional[List[Any]]

    def __init__(self,
                 obj: Any,
                 *,
                 apply_hash: bool = True,
                 custom_operators: Optional[List[Any]] = None,
                 default_timezone: Union[datetime.timezone, "BaseTzInfo"] = datetime.timezone.utc,
                 encodings: Optional[List[str]] = None,
                 exclude_obj_callback: Optional[Callable[[Any, str], bool]] = None,
                 exclude_paths: Optional[PathType] = None,
                 exclude_regex_paths: Optional[RegexType] = None,
                 exclude_types: Optional[Union[List[type], Set[type], Tuple[type, ...]]] = None,
                 hasher: Optional[Callable[[Union[str, bytes]], str]] = None,
                 hashes: Optional[Union[Dict[Any, Any], "DeepHash"]] = None,
                 ignore_encoding_errors: bool = False,
                 ignore_iterable_order: bool = True,
                 ignore_numeric_type_changes: bool = False,
                 ignore_private_variables: bool = True,
                 ignore_repetition: bool = True,
                 ignore_string_case: bool = False,
                 ignore_string_type_changes: bool = False,
                 ignore_type_in_groups: Any = None,
                 ignore_type_subclasses: bool = False,
                 ignore_uuid_types: bool = False,
                 include_paths: Optional[PathType] = None,
                 number_format_notation: str = "f",
                 number_to_string_func: Optional[NumberToStringFunc] = None,
                 parent: str = "root",
                 significant_digits: Optional[int] = None,
                 truncate_datetime: Optional[str] = None,
                 use_enum_value: bool = False,
                 **kwargs) -> None:
        if kwargs:
            raise ValueError(
                ("The following parameter(s) are not valid: %s\n"
                 "The valid parameters are obj, hashes, exclude_types, significant_digits, truncate_datetime,"
                 "exclude_paths, include_paths, exclude_regex_paths, hasher, ignore_repetition, "
                 "number_format_notation, apply_hash, ignore_type_in_groups, ignore_string_type_changes, "
                 "ignore_numeric_type_changes, ignore_type_subclasses, ignore_string_case, ignore_uuid_types, "
                 "number_to_string_func, ignore_private_variables, parent, use_enum_value, default_timezone "
                 "encodings, ignore_encoding_errors") % ', '.join(kwargs.keys()))
        if isinstance(hashes, MutableMapping):
            self.hashes = hashes
        elif isinstance(hashes, DeepHash):
            self.hashes = hashes.hashes
        else:
            self.hashes = dict_()
        exclude_types = set() if exclude_types is None else set(exclude_types)
        self.exclude_types_tuple = tuple(exclude_types)  # we need tuple for checking isinstance
        self.ignore_repetition = ignore_repetition
        self.exclude_paths = add_root_to_paths(convert_item_or_items_into_set_else_none(exclude_paths))
        self.include_paths = add_root_to_paths(convert_item_or_items_into_set_else_none(include_paths))
        self.exclude_regex_paths = convert_item_or_items_into_compiled_regexes_else_none(exclude_regex_paths)
        self.hasher = default_hasher if hasher is None else hasher
        self.hashes[UNPROCESSED_KEY] = []  # type: ignore
        self.use_enum_value = use_enum_value
        self.default_timezone = default_timezone
        self.significant_digits = self.get_significant_digits(significant_digits, ignore_numeric_type_changes)
        self.truncate_datetime = get_truncate_datetime(truncate_datetime)
        self.number_format_notation = number_format_notation
        self.ignore_type_in_groups = self.get_ignore_types_in_groups(
            ignore_type_in_groups=ignore_type_in_groups,
            ignore_string_type_changes=ignore_string_type_changes,
            ignore_numeric_type_changes=ignore_numeric_type_changes,
            ignore_type_subclasses=ignore_type_subclasses,
            ignore_uuid_types=ignore_uuid_types,
        )
        self.ignore_string_type_changes = ignore_string_type_changes
        self.ignore_numeric_type_changes = ignore_numeric_type_changes
        self.ignore_string_case = ignore_string_case
        self.exclude_obj_callback = exclude_obj_callback
        # makes the hash return constant size result if true
        # the only time it should be set to False is when
        # testing the individual hash functions for different types of objects.
        self.apply_hash = apply_hash
        self.type_check_func = type_in_type_group if ignore_type_subclasses else type_is_subclass_of_type_group
        # self.type_check_func = type_is_subclass_of_type_group if ignore_type_subclasses else type_in_type_group
        self.number_to_string = number_to_string_func or number_to_string
        self.ignore_private_variables = ignore_private_variables
        self.encodings = encodings
        self.ignore_encoding_errors = ignore_encoding_errors
        self.ignore_iterable_order = ignore_iterable_order
        self.custom_operators = custom_operators

        self._hash(obj, parent=parent, parents_ids=frozenset({get_id(obj)}))

        if self.hashes[UNPROCESSED_KEY]:
            logger.warning("Can not hash the following items: {}.".format(self.hashes[UNPROCESSED_KEY]))
        else:
            del self.hashes[UNPROCESSED_KEY]

    sha256hex: Callable[[Union[str, bytes]], str] = sha256hex
    sha1hex: Callable[[Union[str, bytes]], str] = sha1hex

    def __getitem__(self, obj: Any, extract_index: Optional[int] = 0) -> Any:
        return self._getitem(self.hashes, obj, extract_index=extract_index, use_enum_value=self.use_enum_value)

    @staticmethod
    def _getitem(hashes: Dict[Any, Any], obj: Any, extract_index: Optional[int] = 0, use_enum_value: bool = False) -> Any:
        """
        extract_index is zero for hash and 1 for count and None to get them both.
        To keep it backward compatible, we only get the hash by default so it is set to zero by default.
        """

        key = obj
        if obj is True:
            key = BoolObj.TRUE
        elif obj is False:
            key = BoolObj.FALSE
        elif use_enum_value and isinstance(obj, Enum):
            key = obj.value

        result_n_count: Tuple[Any, int] = (None, 0)  # type: ignore

        try:
            result_n_count = hashes[key]
        except (TypeError, KeyError):
            key = get_id(obj)
            try:
                result_n_count = hashes[key]
            except KeyError:
                raise KeyError(HASH_LOOKUP_ERR_MSG.format(obj)) from None

        if obj is UNPROCESSED_KEY:
            extract_index = None

        return result_n_count if extract_index is None else result_n_count[extract_index]

    def __contains__(self, obj: Any) -> bool:
        result = False
        try:
            result = obj in self.hashes
        except (TypeError, KeyError):
            result = False
        if not result:
            result = get_id(obj) in self.hashes
        return result

    def get(self, key: Any, default: Any = None, extract_index: Optional[int] = 0) -> Any:
        """
        Get method for the hashes dictionary.
        It can extract the hash for a given key that is already calculated when extract_index=0
        or the count of items that went to building the object whenextract_index=1.
        """
        return self.get_key(self.hashes, key, default=default, extract_index=extract_index)

    @staticmethod
    def get_key(hashes: Dict[Any, Any], key: Any, default: Any = None, extract_index: Optional[int] = 0, use_enum_value: bool = False) -> Any:
        """
        get_key method for the hashes dictionary.
        It can extract the hash for a given key that is already calculated when extract_index=0
        or the count of items that went to building the object whenextract_index=1.
        """
        try:
            result = DeepHash._getitem(hashes, key, extract_index=extract_index, use_enum_value=use_enum_value)
        except KeyError:
            result = default
        return result

    def _get_objects_to_hashes_dict(self, extract_index: Optional[int] = 0) -> Dict[Any, Any]:
        """
        A dictionary containing only the objects to hashes,
        or a dictionary of objects to the count of items that went to build them.
        extract_index=0 for hashes and extract_index=1 for counts.
        """
        result = dict_()
        for key, value in self.hashes.items():
            if key is UNPROCESSED_KEY:
                result[key] = value
            else:
                result[key] = value[extract_index]
        return result

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, DeepHash):
            return self.hashes == other.hashes
        else:
            # We only care about the hashes
            return self._get_objects_to_hashes_dict() == other

    __req__ = __eq__

    def __repr__(self) -> str:
        """
        Hide the counts since it will be confusing to see them when they are hidden everywhere else.
        """
        from deepdiff.summarize import summarize
        return summarize(self._get_objects_to_hashes_dict(extract_index=0), max_length=500)

    def __str__(self) -> str:
        return str(self._get_objects_to_hashes_dict(extract_index=0))

    def __bool__(self) -> bool:
        return bool(self.hashes)

    def keys(self) -> Any:
        return self.hashes.keys()

    def values(self) -> Generator[Any, None, None]:
        return (i[0] for i in self.hashes.values())  # Just grab the item and not its count

    def items(self) -> Generator[Tuple[Any, Any], None, None]:
        return ((i, v[0]) for i, v in self.hashes.items())

    def _prep_obj(self, obj: Any, parent: str, parents_ids: frozenset = EMPTY_FROZENSET, is_namedtuple: bool = False, is_pydantic_object: bool = False) -> HashTuple:
        """prepping objects"""
        original_type = type(obj) if not isinstance(obj, type) else obj

        obj_to_dict_strategies = []
        if is_namedtuple:
            obj_to_dict_strategies.append(lambda o: o._asdict())
        elif is_pydantic_object:
            obj_to_dict_strategies.append(lambda o: {k: v for (k, v) in o.__dict__.items() if v !="model_fields_set"})
        else:
            obj_to_dict_strategies.append(lambda o: o.__dict__)

        if hasattr(obj, "__slots__"):
            obj_to_dict_strategies.append(lambda o: {i: getattr(o, i) for i in o.__slots__})
        else:
            import inspect
            obj_to_dict_strategies.append(lambda o: dict(inspect.getmembers(o, lambda m: not inspect.isroutine(m))))

        for get_dict in obj_to_dict_strategies:
            try:
                d = get_dict(obj)
                break
            except AttributeError:
                pass
        else:
            self.hashes[UNPROCESSED_KEY].append(obj)  # type: ignore
            return (unprocessed, 0)
        obj = d

        result, counts = self._prep_dict(obj, parent=parent, parents_ids=parents_ids,
                                         print_as_attribute=True, original_type=original_type)
        result = "nt{}".format(result) if is_namedtuple else "obj{}".format(result)
        return result, counts

    def _skip_this(self, obj: Any, parent: str) -> bool:
        skip = False
        if self.exclude_paths and parent in self.exclude_paths:
            skip = True
        if self.include_paths and parent != 'root':
            if parent not in self.include_paths:
                skip = True
                for prefix in self.include_paths:
                    if parent.startswith(prefix):
                        skip = False
                        break
        elif self.exclude_regex_paths and any(
                [exclude_regex_path.search(parent) for exclude_regex_path in self.exclude_regex_paths]):  # type: ignore
            skip = True
        elif self.exclude_types_tuple and isinstance(obj, self.exclude_types_tuple):
            skip = True
        elif self.exclude_obj_callback and self.exclude_obj_callback(obj, parent):
            skip = True
        return skip

    def _prep_dict(self, obj: Union[Dict[Any, Any], MutableMapping], parent: str, parents_ids: frozenset = EMPTY_FROZENSET, print_as_attribute: bool = False, original_type: Optional[type] = None) -> HashTuple:

        result = []
        counts = 1

        key_text = "%s{}".format(INDEX_VS_ATTRIBUTE[print_as_attribute])
        for key, item in obj.items():
            counts += 1
            # ignore private variables
            if self.ignore_private_variables and isinstance(key, str) and key.startswith('__'):
                continue
            key_formatted = "'%s'" % key if not print_as_attribute and isinstance(key, strings) else key
            key_in_report = key_text % (parent, key_formatted)

            key_hash, _ = self._hash(key, parent=key_in_report, parents_ids=parents_ids)
            if not key_hash:
                continue
            item_id = get_id(item)
            if (parents_ids and item_id in parents_ids) or self._skip_this(item, parent=key_in_report):
                continue
            parents_ids_added = add_to_frozen_set(parents_ids, item_id)
            hashed, count = self._hash(item, parent=key_in_report, parents_ids=parents_ids_added)
            hashed = KEY_TO_VAL_STR.format(key_hash, hashed)
            result.append(hashed)
            counts += count

        result.sort()
        result = ';'.join(result)
        if print_as_attribute:
            type_ = original_type or type(obj)
            type_str = type_.__name__
            for type_group in self.ignore_type_in_groups:
                if self.type_check_func(type_, type_group):
                    type_str = ','.join(map(lambda x: x.__name__, type_group))
                    break
        else:
            type_str = 'dict'
        return "{}:{{{}}}".format(type_str, result), counts

    def _prep_iterable(self, obj: Iterable[Any], parent: str, parents_ids: frozenset = EMPTY_FROZENSET) -> HashTuple:

        counts = 1
        result = defaultdict(int)

        for i, item in enumerate(obj):
            new_parent = "{}[{}]".format(parent, i)
            if self._skip_this(item, parent=new_parent):
                continue

            item_id = get_id(item)
            if parents_ids and item_id in parents_ids:
                continue

            parents_ids_added = add_to_frozen_set(parents_ids, item_id)
            hashed, count = self._hash(item, parent=new_parent, parents_ids=parents_ids_added)
            # counting repetitions
            result[hashed] += 1
            counts += count

        if self.ignore_repetition:
            result = list(result.keys())
        else:
            result = [
                '{}|{}'.format(i, v) for i, v in result.items()
            ]

        result = map(str, result) # making sure the result items are string so join command works.
        if self.ignore_iterable_order:
            result = sorted(result)  
        result = ','.join(result)
        result = KEY_TO_VAL_STR.format(type(obj).__name__, result)

        return result, counts

    def _prep_bool(self, obj: bool) -> BoolObj:
        return BoolObj.TRUE if obj else BoolObj.FALSE


    def _prep_path(self, obj: Path) -> str:
        type_ = obj.__class__.__name__
        return KEY_TO_VAL_STR.format(type_, obj)

    def _prep_number(self, obj: Union[int, float, complex]) -> str:
        type_ = "number" if self.ignore_numeric_type_changes else obj.__class__.__name__
        if self.significant_digits is not None:
            obj = self.number_to_string(obj, significant_digits=self.significant_digits,
                                        number_format_notation=self.number_format_notation)  # type: ignore
        return KEY_TO_VAL_STR.format(type_, obj)

    def _prep_ipranges(self, obj) -> str:
        type_ = 'iprange'
        obj = str(obj)
        return KEY_TO_VAL_STR.format(type_, obj)

    def _prep_datetime(self, obj: datetime.datetime) -> str:
        type_ = 'datetime'
        obj = datetime_normalize(self.truncate_datetime, obj, default_timezone=self.default_timezone)
        return KEY_TO_VAL_STR.format(type_, obj)

    def _prep_date(self, obj: datetime.date) -> str:
        type_ = 'datetime'  # yes still datetime but it doesn't need normalization
        return KEY_TO_VAL_STR.format(type_, obj)

    def _prep_tuple(self, obj: tuple, parent: str, parents_ids: frozenset) -> HashTuple:
        # Checking to see if it has _fields. Which probably means it is a named
        # tuple.
        try:
            obj._asdict  # type: ignore
        # It must be a normal tuple
        except AttributeError:
            result, counts = self._prep_iterable(obj=obj, parent=parent, parents_ids=parents_ids)
        # We assume it is a namedtuple then
        else:
            result, counts = self._prep_obj(obj, parent, parents_ids=parents_ids, is_namedtuple=True)
        return result, counts

    def _hash(self, obj: Any, parent: str, parents_ids: frozenset = EMPTY_FROZENSET) -> HashTuple:
        """The main hash method"""
        counts = 1
        if self.custom_operators is not None:
            for operator in self.custom_operators:
                func = getattr(operator, 'normalize_value_for_hashing', None)
                if func is None:
                    raise NotImplementedError(f"{operator.__class__.__name__} needs to define a normalize_value_for_hashing method to be compatible with ignore_order=True or iterable_compare_func.".format(operator))
                else:
                    obj = func(parent, obj)

        if isinstance(obj, booleanTypes):
            obj = self._prep_bool(obj)
            result = None
        elif self.use_enum_value and isinstance(obj, Enum):
            obj = obj.value
        else:
            result = not_hashed
        try:
            result, counts = self.hashes[obj]
        except (TypeError, KeyError):
            pass
        else:
            return result, counts

        if self._skip_this(obj, parent):
            return None, 0

        elif obj is None:
            result = 'NONE'

        elif isinstance(obj, strings):
            result = prepare_string_for_hashing(
                obj,
                ignore_string_type_changes=self.ignore_string_type_changes,
                ignore_string_case=self.ignore_string_case,
                encodings=self.encodings,
                ignore_encoding_errors=self.ignore_encoding_errors,
            )

        elif isinstance(obj, Path):
            result = self._prep_path(obj)

        elif isinstance(obj, times):
            result = self._prep_datetime(obj)  # type: ignore

        elif isinstance(obj, datetime.date):
            result = self._prep_date(obj)

        elif isinstance(obj, numbers):  # type: ignore
            result = self._prep_number(obj)

        elif isinstance(obj, ipranges):
            result = self._prep_ipranges(obj)

        elif isinstance(obj, uuid.UUID):
            # Handle UUID objects (including uuid6.UUID) by using their integer value
            result = str(obj.int)

        elif isinstance(obj, MutableMapping):
            result, counts = self._prep_dict(obj=obj, parent=parent, parents_ids=parents_ids)

        elif isinstance(obj, tuple):
            result, counts = self._prep_tuple(obj=obj, parent=parent, parents_ids=parents_ids)

        elif (pandas and isinstance(obj, pandas.DataFrame)):  # type: ignore
            def gen():  # type: ignore
                yield ('dtype', obj.dtypes)  # type: ignore
                yield ('index', obj.index)  # type: ignore
                yield from obj.items()  # type: ignore  # which contains (column name, series tuples)
            result, counts = self._prep_iterable(obj=gen(), parent=parent, parents_ids=parents_ids)
        elif (polars and isinstance(obj, polars.DataFrame)):  # type: ignore
            def gen():
                yield from obj.columns  # type: ignore
                yield from list(obj.schema.items())  # type: ignore
                yield from obj.rows()  # type: ignore
            result, counts = self._prep_iterable(obj=gen(), parent=parent, parents_ids=parents_ids)

        elif isinstance(obj, Iterable):
            result, counts = self._prep_iterable(obj=obj, parent=parent, parents_ids=parents_ids)

        elif obj == BoolObj.TRUE or obj == BoolObj.FALSE:
            result = 'bool:true' if obj is BoolObj.TRUE else 'bool:false'
        elif isinstance(obj, PydanticBaseModel):
            result, counts = self._prep_obj(obj=obj, parent=parent, parents_ids=parents_ids, is_pydantic_object=True)
        else:
            result, counts = self._prep_obj(obj=obj, parent=parent, parents_ids=parents_ids)

        if result is not_hashed:  # pragma: no cover
            self.hashes[UNPROCESSED_KEY].append(obj)  # type: ignore

        elif result is unprocessed:
            pass

        elif self.apply_hash:
            if isinstance(obj, strings):
                result_cleaned = result
            else:
                result_cleaned = prepare_string_for_hashing(
                    str(result), ignore_string_type_changes=self.ignore_string_type_changes,
                    ignore_string_case=self.ignore_string_case)
            result = self.hasher(result_cleaned)

        # It is important to keep the hash of all objects.
        # The hashes will be later used for comparing the objects.
        # Object to hash when possible otherwise ObjectID to hash
        try:
            self.hashes[obj] = (result, counts)
        except TypeError:
            obj_id = get_id(obj)
            self.hashes[obj_id] = (result, counts)

        return result, counts


if __name__ == "__main__":  # pragma: no cover
    import doctest
    doctest.testmod()
