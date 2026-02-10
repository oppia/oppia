import datetime
from .context import Context as Context
from .query import (
    AND as AND,
    OR as OR,
    Query as Query,
    Node as Node,
    ConjunctionNode as ConjunctionNode,
    DisjunctionNode as DisjunctionNode,
    FilterNode as FilterNode,
    PropertyOrder as PropertyOrder,
)
from google.cloud import datastore
from redis import StrictRedis

from typing import (
    Any,
    Callable,
    Dict,
    Generic,
    Iterable,
    Iterator,
    List,
    Literal,
    Optional,
    Sequence,
    Type,
    TypeVar,
    Tuple,
    Union,
    overload,
)


TYPE_MODEL = TypeVar('TYPE_MODEL', bound='Model')
T = TypeVar('T')

class Client:
    def context(
        self, namespace: Optional[str], global_cache: Optional[RedisCache]
    ) -> Context: ...

# Model Stubs
class Model(type):
    key: Key = ...
    _key: Key = ...
    _values: Dict[str, Any] = ...
    _properties: Dict[str, Any] = ...
    def __init__(*args: Any, **kwds: Any) -> None: ...
    def populate(self, **constructor_options: Any) -> None: ...
    def to_dict(
        self, exclude: Optional[List[str]] = None
    ) -> Dict[str, Any]: ...
    @classmethod
    def query(cls: Type[TYPE_MODEL], *args: Any, **kwds: Any) -> Query: ...
    def put(self, **ctx_options: Any) -> None: ...
    @classmethod
    def get_by_id(
        cls: Type[TYPE_MODEL], id: str, **ctx_options: Any
    ) -> TYPE_MODEL: ...
    def _pre_put_hook(self) -> None: ...
    @classmethod
    def _lookup_model(cls: Type[TYPE_MODEL], kind: Optional[str]) -> TYPE_MODEL: ...
    @classmethod
    def _get_kind(cls) -> str: ...

def get_context(**kwds: Any) -> Context: ...
def get_multi(
    keys: List[Key], **ctx_options: Any
) -> List[Optional[TYPE_MODEL]]: ...
def put_multi(entities: List[TYPE_MODEL], **ctx_options: Any) -> List[str]: ...
def delete_multi(keys: Sequence[Key], **ctx_options: Any) -> List[None]: ...

# Property Stubs
class Property(Generic[T]):
    _name: str
    _repeated: bool
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[T, List[T]]] = ...,
        choices: Union[List[T], Tuple[T, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> RepeatedProperty[T]: ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[T] = ...,
        choices: Union[List[T], Tuple[T, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> Property[T]: ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[T, List[T]]] = ...,
        choices: Union[List[T], Tuple[T, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> Property[T]: ...
    
    def __init__(
        self,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[T, List[T]]] = ...,
        choices: Union[List[T], Tuple[T, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> None: ...
    def __eq__(self, value: object) -> FilterNode: ...  # type: ignore[override]
    def __ne__(self, value: object) -> FilterNode: ...  # type: ignore[override]
    def __lt__(self, value: object) -> FilterNode: ...
    def __le__(self, value: object) -> FilterNode: ...
    def __gt__(self, value: object) -> FilterNode: ...
    def __ge__(self, value: object) -> FilterNode: ...
    IN: Any = ...
    def __neg__(self) -> PropertyOrder: ...
    def __pos__(self) -> PropertyOrder: ...
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> Property[T]: ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> T: ...
    def __set__(self, entity: Any, value: T) -> None: ...
    def __delete__(self, entity: Any) -> None: ...

class RepeatedProperty(Property[T]):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> RepeatedProperty[T]: ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[T]: ...
    def __set__(self, entity: Any, value: Union[List[T], T]) -> None: ...

class BooleanProperty(Property[bool]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[bool, List[bool]]] = ...,
        choices: Union[List[bool], Tuple[bool, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedBooleanProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[bool] = ...,
        choices: Union[List[bool], Tuple[bool, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'BooleanProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[bool, List[bool]]] = ...,
        choices: Union[List[bool], Tuple[bool, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'BooleanProperty': ...

class DateTimeProperty(Property[datetime.datetime]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_now: bool = ...,
        auto_now_add: bool = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[datetime.datetime, List[datetime.datetime]]] = ...,
        choices: Union[List[datetime.datetime], Tuple[datetime.datetime, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedDateTimeProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_now: bool = ...,
        auto_now_add: bool = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[datetime.datetime] = ...,
        choices: Union[List[datetime.datetime], Tuple[datetime.datetime, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'DateTimeProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_now: bool = ...,
        auto_now_add: bool = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[datetime.datetime, List[datetime.datetime]]] = ...,
        choices: Union[List[datetime.datetime], Tuple[datetime.datetime, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'DateTimeProperty': ...


class DateProperty(DateTimeProperty, Property[datetime.date]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_now: bool = ...,
        auto_now_add: bool = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[datetime.date, List[datetime.date]]] = ...,
        choices: Union[List[datetime.date], Tuple[datetime.date, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedDateProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_now: bool = ...,
        auto_now_add: bool = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[datetime.date] = ...,
        choices: Union[List[datetime.date], Tuple[datetime.date, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'DateProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_now: bool = ...,
        auto_now_add: bool = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[datetime.date, List[datetime.date]]] = ...,
        choices: Union[List[datetime.date], Tuple[datetime.date, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'DateProperty': ...
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'DateProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> datetime.date: ...
    def __set__(self, entity: Any, value: datetime.date) -> None: ...
class ComputedProperty(Property[Any]): ...
class IntegerProperty(Property[int]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[int, List[int]]] = ...,
        choices: Union[List[int], Tuple[int, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedIntegerProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[int] = ...,
        choices: Union[List[int], Tuple[int, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'IntegerProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[int, List[int]]] = ...,
        choices: Union[List[int], Tuple[int, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'IntegerProperty': ...

class FloatProperty(Property[float]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[float, List[float]]] = ...,
        choices: Union[List[float], Tuple[float, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedFloatProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[float] = ...,
        choices: Union[List[float], Tuple[float, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'FloatProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[float, List[float]]] = ...,
        choices: Union[List[float], Tuple[float, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'FloatProperty': ...

class JsonProperty(Property[Any]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        compressed: bool = ...,
        json_type: Optional[Any] = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[Any, List[Any]]] = ...,
        choices: Union[List[Any], Tuple[Any, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedJsonProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        compressed: bool = ...,
        json_type: Optional[Any] = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[Any] = ...,
        choices: Union[List[Any], Tuple[Any, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'JsonProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        compressed: bool = ...,
        json_type: Optional[Any] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[Any, List[Any]]] = ...,
        choices: Union[List[Any], Tuple[Any, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'JsonProperty': ...


class UserProperty(Property[Any]):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_current_user: bool = ...,
        auto_current_user_add: bool = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[Any, List[Any]]] = ...,
        choices: Union[List[Any], Tuple[Any, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'RepeatedUserProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_current_user: bool = ...,
        auto_current_user_add: bool = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[Any] = ...,
        choices: Union[List[Any], Tuple[Any, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'UserProperty': ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        auto_current_user: bool = ...,
        auto_current_user_add: bool = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[Any, List[Any]]] = ...,
        choices: Union[List[Any], Tuple[Any, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> 'UserProperty': ...


class TextProperty(Property[str]): ...
class StringProperty(TextProperty):
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        *,
        repeated: Literal[True],
        required: Optional[bool] = ...,
        default: Optional[Union[str, List[str]]] = ...,
        choices: Union[List[str], Tuple[str, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> RepeatedStringProperty: ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Literal[False] = ...,
        required: Optional[bool] = ...,
        default: Optional[str] = ...,
        choices: Union[List[str], Tuple[str, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> StringProperty: ...
    @overload
    def __new__(
        cls,
        name: Optional[str] = ...,
        indexed: Optional[bool] = ...,
        repeated: Optional[bool] = ...,
        required: Optional[bool] = ...,
        default: Optional[Union[str, List[str]]] = ...,
        choices: Union[List[str], Tuple[str, ...], None] = ...,
        validator: Optional[Callable[..., Any]] = ...,
        verbose_name: Optional[str] = ...,
    ) -> StringProperty: ...

class RepeatedStringProperty(StringProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> RepeatedStringProperty: ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[str]: ...

class RepeatedBooleanProperty(BooleanProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedBooleanProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[bool]: ...
    def __set__(self, entity: Any, value: Union[List[bool], bool]) -> None: ...

class RepeatedDateTimeProperty(DateTimeProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedDateTimeProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[datetime.datetime]: ...
    def __set__(self, entity: Any, value: Union[List[datetime.datetime], datetime.datetime]) -> None: ...

class RepeatedDateProperty(DateProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedDateProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[datetime.date]: ...
    def __set__(self, entity: Any, value: Union[List[datetime.date], datetime.date]) -> None: ...

class RepeatedIntegerProperty(IntegerProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedIntegerProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[int]: ...
    def __set__(self, entity: Any, value: Union[List[int], int]) -> None: ...

class RepeatedFloatProperty(FloatProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedFloatProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[float]: ...
    def __set__(self, entity: Any, value: Union[List[float], float]) -> None: ...

class RepeatedJsonProperty(JsonProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedJsonProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[Any]: ...
    def __set__(self, entity: Any, value: Union[List[Any], Any]) -> None: ...

class RepeatedUserProperty(UserProperty):
    @overload
    def __get__(self, entity: None, unused_cls: Optional[Any] = ...) -> 'RepeatedUserProperty': ...
    @overload
    def __get__(self, entity: Any, unused_cls: Optional[Any] = ...) -> List[Any]: ...
    def __set__(self, entity: Any, value: Union[List[Any], Any]) -> None: ...

class Cursor:
    def __init__(self, urlsafe: Optional[str]) -> None: ...
    def urlsafe(self) -> bytes: ...

# Key Stubs
class Key:
    def __new__(cls, *_args: Any, **kwargs: Any) -> Key: ...
    def namespace(self) -> Optional[str]: ...
    def app(self) -> Optional[str]: ...
    def project(self) -> Optional[str]: ...
    def id(self) -> str: ...
    def flat(self) -> Optional[Iterable[Union[str, int]]]: ...
    def kind(self) -> Optional[str]: ...
    def get(self, **ctx_options: Any) -> Optional[Model]: ...
    def delete(self, **ctx_options: Any) -> None: ...
    @classmethod
    def _from_ds_key(cls, ds_key: datastore.Key) -> Key: ...

class RedisCache:
    def __init__(self, redis_instance: StrictRedis[str]): ...

# Transaction Options Stubs
class TransactionOptions(object):
    NESTED = 1  # join=False
    MANDATORY = 2  # join=True
    ALLOWED = 3  # join=True
    INDEPENDENT = 4  # join=False
