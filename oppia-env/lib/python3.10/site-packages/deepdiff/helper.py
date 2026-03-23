import sys
import re
import os
import datetime
import uuid
import logging
import warnings
import string
import time
import enum
import ipaddress
from typing import NamedTuple, Any, List, Optional, Dict, Union, TYPE_CHECKING, Tuple, Iterable, Iterator, Set, FrozenSet, Callable, Pattern, Type, TypeVar, Generic, Literal, overload
from collections.abc import Mapping, Sequence, Generator
from ast import literal_eval
from decimal import Decimal, localcontext, InvalidOperation as InvalidDecimalOperation
from itertools import repeat
from orderly_set import StableSetEq as SetOrderedBase  # median: 1.0867 s for cache test, 5.63s for all tests
from threading import Timer

if TYPE_CHECKING:
    from pytz.tzinfo import BaseTzInfo


class np_type:
    pass


class pydantic_base_model_type:
    pass


class SetOrdered(SetOrderedBase):
    def __repr__(self) -> str:
        return str(list(self))


try:
    import numpy as np
except ImportError:  # pragma: no cover. The case without Numpy is tested locally only.
    np = None  # pragma: no cover.
    np_array_factory = 'numpy not available'  # pragma: no cover.
    np_ndarray = np_type  # pragma: no cover.
    np_bool_ = np_type  # pragma: no cover.
    np_int8 = np_type  # pragma: no cover.
    np_int16 = np_type  # pragma: no cover.
    np_int32 = np_type  # pragma: no cover.
    np_int64 = np_type  # pragma: no cover.
    np_uint8 = np_type  # pragma: no cover.
    np_uint16 = np_type  # pragma: no cover.
    np_uint32 = np_type  # pragma: no cover.
    np_uint64 = np_type  # pragma: no cover.
    np_intp = np_type  # pragma: no cover.
    np_uintp = np_type  # pragma: no cover.
    np_float32 = np_type  # pragma: no cover.
    np_float64 = np_type  # pragma: no cover.
    np_double = np_type  # pragma: no cover.
    np_floating = np_type  # pragma: no cover.
    np_complex64 = np_type  # pragma: no cover.
    np_complex128 = np_type  # pragma: no cover.
    np_cdouble = np_type  # pragma: no cover.
    np_complexfloating = np_type  # pragma: no cover.
    np_datetime64 = np_type  # pragma: no cover.
else:
    np_array_factory = np.array
    np_ndarray = np.ndarray
    np_bool_ = np.bool_
    np_int8 = np.int8
    np_int16 = np.int16
    np_int32 = np.int32
    np_int64 = np.int64
    np_uint8 = np.uint8
    np_uint16 = np.uint16
    np_uint32 = np.uint32
    np_uint64 = np.uint64
    np_intp = np.intp
    np_uintp = np.uintp
    np_float32 = np.float32
    np_float64 = np.float64
    np_double = np.double  # np.float_ is an alias for np.double and is being removed by NumPy 2.0
    np_floating = np.floating
    np_complex64 = np.complex64
    np_complex128 = np.complex128
    np_cdouble = np.cdouble  # np.complex_ is an alias for np.cdouble and is being removed by NumPy 2.0
    np_complexfloating = np.complexfloating
    np_datetime64 = np.datetime64

numpy_numbers: Tuple[Type[Any], ...] = (
    np_int8, np_int16, np_int32, np_int64, np_uint8,
    np_uint16, np_uint32, np_uint64, np_intp, np_uintp,
    np_float32, np_float64, np_double, np_floating, np_complex64,
    np_complex128, np_cdouble,)

numpy_complex_numbers: Tuple[Type[Any], ...] = (
    np_complexfloating, np_complex64, np_complex128, np_cdouble,
)

numpy_dtypes: Set[Type[Any]] = set(numpy_numbers)
numpy_dtypes.add(np_bool_)  # type: ignore
numpy_dtypes.add(np_datetime64)  # type: ignore

numpy_dtype_str_to_type: Dict[str, Type[Any]] = {
    item.__name__: item for item in numpy_dtypes
}

try:
    from pydantic.main import BaseModel as PydanticBaseModel  # type: ignore
except ImportError:
    PydanticBaseModel = pydantic_base_model_type


logger = logging.getLogger(__name__)

py_major_version = sys.version_info.major
py_minor_version = sys.version_info.minor

py_current_version: Decimal = Decimal("{}.{}".format(py_major_version, py_minor_version))

py2 = py_major_version == 2
py3 = py_major_version == 3
py4 = py_major_version == 4


NUMERICS: FrozenSet[str] = frozenset(string.digits)


class EnumBase(str, enum.Enum):
    def __repr__(self) -> str:
        """
        We need to add a single quotes so we can easily copy the value when we do ipdb.
        """
        return f"'{self.name}'"

    def __str__(self) -> str:
        return self.name


def _int_or_zero(value: str) -> int:
    """
    Tries to extract some number from a string.

    12c becomes 12
    """
    try:
        return int(value)
    except Exception:
        result = []
        for char in value:
            if char in NUMERICS:
                result.append(char)
        if result:
            return int(''.join(result))
        return 0


def get_semvar_as_integer(version: str) -> int:
    """
    Converts:

    '1.23.5' to 1023005
    """
    version_parts = version.split('.')
    if len(version_parts) > 3:
        version_parts = version_parts[:3]
    elif len(version_parts) < 3:
        version_parts.extend(['0'] * (3 - len(version_parts)))

    return sum([10**(i * 3) * _int_or_zero(v) for i, v in enumerate(reversed(version_parts))])


# we used to use OrderedDictPlus when dictionaries in Python were not ordered.
dict_ = dict

if py4:
    logger.warning('Python 4 is not supported yet. Switching logic to Python 3.')  # pragma: no cover
    py3 = True  # pragma: no cover

if py2:  # pragma: no cover
    sys.exit('Python 2 is not supported anymore. The last version of DeepDiff that supported Py2 was 3.3.0')

pypy3 = py3 and hasattr(sys, "pypy_translation_info")


if np and get_semvar_as_integer(np.__version__) < 1019000:
    sys.exit('The minimum required Numpy version is 1.19.0. Please upgrade your Numpy package.')

strings: Tuple[Type[str], Type[bytes], Type[memoryview]] = (str, bytes, memoryview)  # which are both basestring
unicode_type = str
bytes_type = bytes
only_complex_number: Tuple[Type[Any], ...] = (complex,) + numpy_complex_numbers
only_numbers: Tuple[Type[Any], ...] = (int, float, complex, Decimal) + numpy_numbers
datetimes: Tuple[Type[Any], ...] = (datetime.datetime, datetime.date, datetime.timedelta, datetime.time, np_datetime64)
ipranges: Tuple[Type[Any], ...] = (ipaddress.IPv4Interface, ipaddress.IPv6Interface, ipaddress.IPv4Network, ipaddress.IPv6Network, ipaddress.IPv4Address, ipaddress.IPv6Address)
uuids: Tuple[Type[uuid.UUID]] = (uuid.UUID, )
times: Tuple[Type[Any], ...] = (datetime.datetime, datetime.time, np_datetime64)
numbers: Tuple[Type[Any], ...] = only_numbers + datetimes
# Type alias for use in type annotations
NumberType = Union[int, float, complex, Decimal, datetime.datetime, datetime.date, datetime.timedelta, datetime.time, Any]
booleans: Tuple[Type[bool], Type[Any]] = (bool, np_bool_)

basic_types: Tuple[Type[Any], ...] = strings + numbers + uuids + booleans + (type(None), )

class IndexedHash(NamedTuple):
    indexes: List[Any]
    item: Any

current_dir = os.path.dirname(os.path.abspath(__file__))

ID_PREFIX = '!>*id'

KEY_TO_VAL_STR = "{}:{}"

TREE_VIEW = 'tree'
TEXT_VIEW = 'text'
DELTA_VIEW = '_delta'
COLORED_VIEW = 'colored'
COLORED_COMPACT_VIEW = 'colored_compact'

ENUM_INCLUDE_KEYS: List[str] = ['__objclass__', 'name', 'value']


def short_repr(item: Any, max_length: int = 15) -> str:
    """Short representation of item if it is too long"""
    item = repr(item)
    if len(item) > max_length:
        item = '{}...{}'.format(item[:max_length - 3], item[-1])
    return item


class ListItemRemovedOrAdded:  # pragma: no cover
    """Class of conditions to be checked"""
    pass


class OtherTypes:
    def __repr__(self) -> str:
        return "Error: {}".format(self.__class__.__name__)  # pragma: no cover

    __str__ = __repr__


class Skipped(OtherTypes):
    pass


class Unprocessed(OtherTypes):
    pass


class NotHashed(OtherTypes):
    pass


class NotPresent:  # pragma: no cover
    """
    In a change tree, this indicated that a previously existing object has been removed -- or will only be added
    in the future.
    We previously used None for this but this caused problem when users actually added and removed None. Srsly guys? :D
    """

    def __repr__(self) -> str:
        return 'not present'  # pragma: no cover

    __str__ = __repr__


class CannotCompare(Exception):
    """
    Exception when two items cannot be compared in the compare function.
    """
    pass


unprocessed = Unprocessed()
skipped = Skipped()
not_hashed = NotHashed()
notpresent = NotPresent()

# Disabling remapping from old to new keys since the mapping is deprecated.
RemapDict = dict_


# class RemapDict(dict_):
#     """
#     DISABLED
#     Remap Dictionary.

#     For keys that have a new, longer name, remap the old key to the new key.
#     Other keys that don't have a new name are handled as before.
#     """

#     def __getitem__(self, old_key):
#         new_key = EXPANDED_KEY_MAP.get(old_key, old_key)
#         if new_key != old_key:
#             logger.warning(
#                 "DeepDiff Deprecation: %s is renamed to %s. Please start using "
#                 "the new unified naming convention.", old_key, new_key)
#         if new_key in self:
#             return self.get(new_key)
#         else:  # pragma: no cover
#             raise KeyError(new_key)


class indexed_set(set):
    """
    A set class that lets you get an item by index

    >>> a = indexed_set()
    >>> a.add(10)
    >>> a.add(20)
    >>> a[0]
    10
    """


def add_to_frozen_set(parents_ids: FrozenSet[int], item_id: int) -> FrozenSet[int]:
    return parents_ids | {item_id}


def convert_item_or_items_into_set_else_none(items: Union[str, Iterable[str], None]) -> Optional[Set[str]]:
    if items:
        if isinstance(items, str):
            return {items}
        else:
            return set(items)
    else:
        return None


def add_root_to_paths(paths: Optional[Iterable[str]]) -> Optional[SetOrdered]:
    """
    Sometimes the users want to just pass
    [key] instead of root[key] for example.
    Here we automatically add all sorts of variations that might match
    the path they were supposed to pass. 
    """
    if paths is None:
        return
    result = SetOrdered()
    for path in paths:
        if path.startswith('root'):
            result.add(path)
        else:
            if path.isdigit():
                result.add(f"root['{path}']")
                result.add(f"root[{path}]")
            elif path[0].isdigit():
                result.add(f"root['{path}']")
            else:
                result.add(f"root.{path}")
                result.add(f"root['{path}']")
    return result


RE_COMPILED_TYPE = type(re.compile(''))


def convert_item_or_items_into_compiled_regexes_else_none(items: Union[str, Pattern[str], Iterable[Union[str, Pattern[str]]], None]) -> Optional[List[Pattern[str]]]:
    if items:
        if isinstance(items, (str, RE_COMPILED_TYPE)):
            items_list = [items]  # type: ignore
        else:
            items_list = list(items)  # type: ignore
        return [i if isinstance(i, RE_COMPILED_TYPE) else re.compile(i) for i in items_list]
    else:
        return None


def get_id(obj: Any) -> str:
    """
    Adding some characters to id so they are not just integers to reduce the risk of collision.
    """
    return "{}{}".format(ID_PREFIX, id(obj))


def get_type(obj: Any) -> Type[Any]:
    """
    Get the type of object or if it is a class, return the class itself.
    """
    if isinstance(obj, np_ndarray):
        return obj.dtype.type  # type: ignore
    return obj if type(obj) is type else type(obj)


def numpy_dtype_string_to_type(dtype_str: str) -> Type[Any]:
    return numpy_dtype_str_to_type[dtype_str]


def type_in_type_group(item: Any, type_group: Tuple[Type[Any], ...]) -> bool:
    return get_type(item) in type_group


def type_is_subclass_of_type_group(item: Any, type_group: Tuple[Type[Any], ...]) -> bool:
    return isinstance(item, type_group) \
        or (isinstance(item, type) and issubclass(item, type_group)) \
        or type_in_type_group(item, type_group)


def get_doc(doc_filename: str) -> str:
    try:
        with open(os.path.join(current_dir, '../docs/', doc_filename), 'r') as doc_file:
            doc = doc_file.read()
    except Exception:  # pragma: no cover
        doc = 'Failed to load the docstrings. Please visit: https://zepworks.com/deepdiff/current/'  # pragma: no cover
    return doc


number_formatting: Dict[str, str] = {
    "f": r'{:.%sf}',
    "e": r'{:.%se}',
}


def number_to_string(number: Any, significant_digits: int, number_format_notation: Literal['f', 'e'] = 'f') -> Any:
    """
    Convert numbers to string considering significant digits.
    """
    try:
        using = number_formatting[number_format_notation]
    except KeyError:
        raise ValueError("number_format_notation got invalid value of {}. The valid values are 'f' and 'e'".format(number_format_notation)) from None

    if not isinstance(number, numbers):  # type: ignore
        return number
    elif isinstance(number, Decimal):
        with localcontext() as ctx:
            # Precision = number of integer digits + significant_digits
            # Using number//1 to get the integer part of the number
            ctx.prec = len(str(abs(number // 1))) + significant_digits
            try:
                number = number.quantize(Decimal('0.' + '0' * significant_digits))
            except InvalidDecimalOperation:
                # Sometimes rounding up causes a higher precision to be needed for the quantize operation
                # For example '999.99999999' will become '1000.000000' after quantize
                ctx.prec += 1
                number = number.quantize(Decimal('0.' + '0' * significant_digits))
    elif isinstance(number, only_complex_number):  # type: ignore
        # Case for complex numbers.
        number = number.__class__(
            "{real}+{imag}j".format(  # type: ignore
                real=number_to_string(
                    number=number.real,  # type: ignore
                    significant_digits=significant_digits,
                    number_format_notation=number_format_notation
                ),
                imag=number_to_string(
                    number=number.imag,  # type: ignore
                    significant_digits=significant_digits,
                    number_format_notation=number_format_notation
                )
            )  # type: ignore
        )
    else:
        number = round(number=number, ndigits=significant_digits)  # type: ignore

        if significant_digits == 0:
            number = int(number)  # type: ignore

    if number == 0.0:
        # Special case for 0: "-0.xx" should compare equal to "0.xx"
        number = abs(number)  # type: ignore

    # Cast number to string
    result = (using % significant_digits).format(number)
    # https://bugs.python.org/issue36622
    if number_format_notation == 'e':
        # Removing leading 0 for exponential part.
        result = re.sub(
            pattern=r'(?<=e(\+|\-))0(?=\d)+',
            repl=r'',
            string=result
        )
    return result


class DeepDiffDeprecationWarning(DeprecationWarning):
    """
    Use this warning instead of DeprecationWarning
    """
    pass


def cartesian_product(a: Iterable[Tuple[Any, ...]], b: Iterable[Any]) -> Iterator[Tuple[Any, ...]]:
    """
    Get the Cartesian product of two iterables

    **parameters**

    a: list of lists
    b: iterable to do the Cartesian product
    """

    for i in a:
        for j in b:
            yield i + (j,)


def cartesian_product_of_shape(dimentions: Iterable[int], result: Optional[Tuple[Tuple[Any, ...], ...]] = None) -> Iterator[Tuple[Any, ...]]:
    """
    Cartesian product of a dimentions iterable.
    This is mainly used to traverse Numpy ndarrays.

    Each array has dimentions that are defines in ndarray.shape
    """
    if result is None:
        result = ((),)  # a tuple with an empty tuple
    for dimension in dimentions:
        result = tuple(cartesian_product(result, range(dimension)))
    return iter(result)


def get_numpy_ndarray_rows(obj: Any, shape: Optional[Tuple[int, ...]] = None) -> Generator[Tuple[Tuple[int, ...], Any], None, None]:
    """
    Convert a multi dimensional numpy array to list of rows
    """
    if shape is None:
        shape = obj.shape  # type: ignore

    dimentions = shape[:-1] if shape else ()
    for path_tuple in cartesian_product_of_shape(dimentions):
        result = obj
        for index in path_tuple:
            result = result[index]
        yield path_tuple, result


class _NotFound:

    def __eq__(self, other: Any) -> bool:
        return False

    __req__ = __eq__

    def __repr__(self) -> str:
        return 'not found'

    __str__ = __repr__


not_found = _NotFound()

warnings.simplefilter('once', DeepDiffDeprecationWarning)


class RepeatedTimer:
    """
    Threaded Repeated Timer by MestreLion
    https://stackoverflow.com/a/38317060/1497443
    """

    def __init__(self, interval: float, function: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
        self._timer = None
        self.interval = interval
        self.function = function
        self.args = args
        self.start_time = time.time()
        self.kwargs = kwargs
        self.is_running = False
        self.start()

    def _get_duration_sec(self) -> int:
        return int(time.time() - self.start_time)

    def _run(self) -> None:
        self.is_running = False
        self.start()
        self.function(*self.args, **self.kwargs)

    def start(self) -> None:
        self.kwargs.update(duration=self._get_duration_sec())
        if not self.is_running:
            self._timer = Timer(self.interval, self._run)
            self._timer.start()
            self.is_running = True

    def stop(self) -> int:
        duration = self._get_duration_sec()
        if self._timer is not None:
            self._timer.cancel()
        self.is_running = False
        return duration


def _eval_decimal(params: str) -> Decimal:
    return Decimal(params)


def _eval_datetime(params: str) -> datetime.datetime:
    params_with_parens = f'({params})'
    params_tuple = literal_eval(params_with_parens)
    return datetime.datetime(*params_tuple)  # type: ignore


def _eval_date(params: str) -> datetime.date:
    params_with_parens = f'({params})'
    params_tuple = literal_eval(params_with_parens)
    return datetime.date(*params_tuple)  # type: ignore


LITERAL_EVAL_PRE_PROCESS: List[Tuple[str, str, Callable[[str], Any]]] = [
    ('Decimal(', ')', _eval_decimal),
    ('datetime.datetime(', ')', _eval_datetime),
    ('datetime.date(', ')', _eval_date),
]


def literal_eval_extended(item: str) -> Any:
    """
    An extended version of literal_eval
    """
    try:
        return literal_eval(item)
    except (SyntaxError, ValueError):
        for begin, end, func in LITERAL_EVAL_PRE_PROCESS:
            if item.startswith(begin) and item.endswith(end):
                # Extracting and removing extra quotes so for example "Decimal('10.1')" becomes "'10.1'" and then '10.1'
                params = item[len(begin): -len(end)].strip('\'\"')
                return func(params)
        raise


def time_to_seconds(t: datetime.time) -> int:
    return (t.hour * 60 + t.minute) * 60 + t.second


def datetime_normalize(
    truncate_datetime:Union[str, None],
    obj:Union[datetime.datetime, datetime.time],
    default_timezone: Union[
        datetime.timezone, "BaseTzInfo"
    ] = datetime.timezone.utc,
) -> Any:
    if truncate_datetime:
        if truncate_datetime == 'second':
            obj = obj.replace(microsecond=0)
        elif truncate_datetime == 'minute':
            obj = obj.replace(second=0, microsecond=0)
        elif truncate_datetime == 'hour':
            obj = obj.replace(minute=0, second=0, microsecond=0)
        elif truncate_datetime == 'day':
            obj = obj.replace(hour=0, minute=0, second=0, microsecond=0)
    if isinstance(obj, datetime.datetime):
        if has_timezone(obj):
            obj = obj.astimezone(default_timezone)
        else:
            obj = obj.replace(tzinfo=default_timezone)
    elif isinstance(obj, datetime.time):
        return time_to_seconds(obj)
    return obj


def has_timezone(dt: datetime.datetime) -> bool:
    """
    Function to check if a datetime object has a timezone

    Checking dt.tzinfo.utcoffset(dt) ensures that the datetime object is truly timezone-aware
    because some datetime objects may have a tzinfo attribute that is not None but still
    doesn't provide a valid offset.

    Certain tzinfo objects, such as pytz.timezone(None), can exist but do not provide meaningful UTC offset information.
    If tzinfo is present but calling .utcoffset(dt) returns None, the datetime is not truly timezone-aware.
    """
    return dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None


def get_truncate_datetime(truncate_datetime: Union[str, None]) -> Union[str, None]:
    """
    Validates truncate_datetime value
    """
    if truncate_datetime not in {None, 'second', 'minute', 'hour', 'day'}:
        raise ValueError("truncate_datetime must be second, minute, hour or day")
    return truncate_datetime


def cartesian_product_numpy(*arrays: Any) -> Any:
    """
    Cartesian product of Numpy arrays by Paul Panzer
    https://stackoverflow.com/a/49445693/1497443
    """
    la = len(arrays)
    dtype = np.result_type(*arrays)  # type: ignore
    arr = np.empty((la, *map(len, arrays)), dtype=dtype)  # type: ignore
    idx = slice(None), *repeat(None, la)
    for i, a in enumerate(arrays):
        arr[i, ...] = a[idx[:la - i]]
    return arr.reshape(la, -1).T


def diff_numpy_array(A: Any, B: Any) -> Any:
    """
    Numpy Array A - B
    return items in A that are not in B
    By Divakar
    https://stackoverflow.com/a/52417967/1497443
    """
    return A[~np.isin(A, B)]  # type: ignore


PYTHON_TYPE_TO_NUMPY_TYPE: Dict[Type[Any], Type[Any]] = {
    int: np_int64,
    float: np_float64,
    Decimal: np_float64
}


def get_homogeneous_numpy_compatible_type_of_seq(seq: Sequence[Any]) -> Union[Type[Any], Literal[False]]:
    """
    Return with the numpy dtype if the array can be converted to a non-object numpy array.
    Originally written by mgilson https://stackoverflow.com/a/13252348/1497443
    This is the modified version.
    """
    iseq = iter(seq)
    first_type = type(next(iseq))
    if first_type in {int, float, Decimal}:
        type_match = first_type if all((type(x) is first_type) for x in iseq) else False
        if type_match:
            return PYTHON_TYPE_TO_NUMPY_TYPE.get(type_match, False)
        else:
            return False
    else:
        return False


def detailed__dict__(obj: Any, ignore_private_variables: bool = True, ignore_keys: FrozenSet[str] = frozenset(), include_keys: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Get the detailed dictionary of an object.

    This is used so we retrieve object properties too.
    """
    if include_keys:
        result = {}
        for key in include_keys:
            try:
                value = getattr(obj, key)
            except Exception:
                pass
            else:
                if not callable(value) or key == '__objclass__':  # We don't want to compare functions, however for backward compatibility, __objclass__ needs to be reported.
                    result[key] = value
    else:
        result = obj.__dict__.copy()  # A shallow copy
        private_var_prefix = f"_{obj.__class__.__name__}__"  # The semi private variables in Python get this prefix
        for key in ignore_keys:
            if key in result or (
                ignore_private_variables and key.startswith('__') and not key.startswith(private_var_prefix)
            ):
                del result[key]
        if isinstance(obj, PydanticBaseModel):
            getter = lambda x, y: getattr(type(x), y)
        else:
            getter = getattr
        for key in dir(obj):
            if key not in result and key not in ignore_keys and (
                    not ignore_private_variables or (
                        ignore_private_variables and not key.startswith('__') and not key.startswith(private_var_prefix)
                    )
            ):
                value = getter(obj, key)
                if not callable(value):
                    result[key] = value
    return result


def named_tuple_repr(self: NamedTuple) -> str:
    fields = []
    for field, value in self._asdict().items():
        # Only include fields that do not have their default value
        if field in self._field_defaults:
            if value != self._field_defaults[field]:
                fields.append(f"{field}={value!r}")
        else:
            fields.append(f"{field}={value!r}")

    return f"{self.__class__.__name__}({', '.join(fields)})"


class OpcodeTag(EnumBase):
    insert = 'insert'
    delete = 'delete'
    equal = 'equal'
    replace = 'replace'  # type: ignore
    # swapped = 'swapped'  # in the future we should support reporting of items swapped with each other


class Opcode(NamedTuple):
    tag: str
    t1_from_index: int
    t1_to_index: int
    t2_from_index: int
    t2_to_index: int
    old_values: Optional[List[Any]] = None
    new_values: Optional[List[Any]] = None

    __repr__ = __str__ = named_tuple_repr


class FlatDataAction(EnumBase):
    values_changed = 'values_changed'
    type_changes = 'type_changes'
    set_item_added = 'set_item_added'
    set_item_removed = 'set_item_removed'
    dictionary_item_added = 'dictionary_item_added'
    dictionary_item_removed = 'dictionary_item_removed'
    iterable_item_added = 'iterable_item_added'
    iterable_item_removed = 'iterable_item_removed'
    iterable_item_moved = 'iterable_item_moved'
    iterable_items_inserted = 'iterable_items_inserted'  # opcode
    iterable_items_deleted = 'iterable_items_deleted'  # opcode
    iterable_items_replaced = 'iterable_items_replaced'  # opcode
    iterable_items_equal = 'iterable_items_equal'  # opcode
    attribute_removed = 'attribute_removed'
    attribute_added = 'attribute_added'
    unordered_iterable_item_added = 'unordered_iterable_item_added'
    unordered_iterable_item_removed = 'unordered_iterable_item_removed'
    initiated = "initiated"


OPCODE_TAG_TO_FLAT_DATA_ACTION = {
    OpcodeTag.insert: FlatDataAction.iterable_items_inserted,
    OpcodeTag.delete: FlatDataAction.iterable_items_deleted,
    OpcodeTag.replace: FlatDataAction.iterable_items_replaced,
    OpcodeTag.equal: FlatDataAction.iterable_items_equal,
}

FLAT_DATA_ACTION_TO_OPCODE_TAG = {v: i for i, v in OPCODE_TAG_TO_FLAT_DATA_ACTION.items()}


UnkownValueCode: str = 'unknown___'


class FlatDeltaRow(NamedTuple):
    path: List
    action: FlatDataAction
    value: Optional[Any] = UnkownValueCode
    old_value: Optional[Any] = UnkownValueCode
    type: Optional[Any] = UnkownValueCode
    old_type: Optional[Any] = UnkownValueCode
    new_path: Optional[List] = None
    t1_from_index: Optional[int] = None
    t1_to_index: Optional[int] = None
    t2_from_index: Optional[int] = None
    t2_to_index: Optional[int] = None

    __repr__ = __str__ = named_tuple_repr


JSON = Union[Dict[str, str], List[str], List[int], Dict[str, "JSON"], List["JSON"], str, int, float, bool, None]


class SummaryNodeType(EnumBase):
    dict = 'dict'
    list = 'list'
    leaf = 'leaf'
