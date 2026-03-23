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

"""Model classes for datastore objects and properties for models.

.. testsetup:: *

    from unittest import mock
    from google.cloud import ndb
    from google.cloud.ndb import context as context_module

    client = mock.Mock(
        project="testing",
        database=None,
        namespace=None,
        stub=mock.Mock(spec=()),
        spec=("project", "namespace", "database", "stub"),
    )
    context = context_module.Context(client).use()
    context.__enter__()

.. testcleanup:: *

    context.__exit__(None, None, None)

A model class represents the structure of entities stored in the datastore.
Applications define model classes to indicate the structure of their entities,
then instantiate those model classes to create entities.

All model classes must inherit (directly or indirectly) from Model. Through
the magic of metaclasses, straightforward assignments in the model class
definition can be used to declare the model's structure::

    class Person(Model):
        name = StringProperty()
        age = IntegerProperty()

We can now create a Person entity and write it to Cloud Datastore::

    person = Person(name='Arthur Dent', age=42)
    key = person.put()

The return value from put() is a Key (see the documentation for
``ndb/key.py``), which can be used to retrieve the same entity later::

    person2 = key.get()
    person2 == person  # Returns True

To update an entity, simply change its attributes and write it back (note that
this doesn't change the key)::

    person2.name = 'Arthur Philip Dent'
    person2.put()

We can also delete an entity (by using the key)::

    key.delete()

The property definitions in the class body tell the system the names and the
types of the fields to be stored in Cloud Datastore, whether they must be
indexed, their default value, and more.

Many different Property types exist.  Most are indexed by default, the
exceptions are indicated in the list below:

- :class:`StringProperty`: a short text string, limited to at most 1500 bytes
  (when UTF-8 encoded from :class:`str` to bytes).
- :class:`TextProperty`: an unlimited text string; unindexed.
- :class:`BlobProperty`: an unlimited byte string; unindexed.
- :class:`IntegerProperty`: a 64-bit signed integer.
- :class:`FloatProperty`: a double precision floating point number.
- :class:`BooleanProperty`: a bool value.
- :class:`DateTimeProperty`: a datetime object. Note: Datastore always uses
  UTC as the timezone.
- :class:`DateProperty`: a date object.
- :class:`TimeProperty`: a time object.
- :class:`GeoPtProperty`: a geographical location, i.e. (latitude, longitude).
- :class:`KeyProperty`: a Cloud Datastore Key value, optionally constrained to
  referring to a specific kind.
- :class:`UserProperty`: a User object (for backwards compatibility only)
- :class:`StructuredProperty`: a field that is itself structured like an
  entity; see below for more details.
- :class:`LocalStructuredProperty`: like StructuredProperty but the on-disk
  representation is an opaque blob; unindexed.
- :class:`ComputedProperty`: a property whose value is computed from other
  properties by a user-defined function. The property value is written to Cloud
  Datastore so that it can be used in queries, but the value from Cloud
  Datastore is not used when the entity is read back.
- :class:`GenericProperty`: a property whose type is not constrained; mostly
  used by the Expando class (see below) but also usable explicitly.
- :class:`JsonProperty`: a property whose value is any object that can be
  serialized using JSON; the value written to Cloud Datastore is a JSON
  representation of that object.
- :class:`PickleProperty`: a property whose value is any object that can be
  serialized using Python's pickle protocol; the value written to the Cloud
  Datastore is the pickled representation of that object, using the highest
  available pickle protocol

Most Property classes have similar constructor signatures.  They
accept several optional keyword arguments:

- name=<string>: the name used to store the property value in the datastore.
  Unlike the following options, this may also be given as a positional
  argument.
- indexed=<bool>: indicates whether the property should be indexed (allowing
  queries on this property's value).
- repeated=<bool>: indicates that this property can have multiple values in
  the same entity.
- write_empty_list<bool>: For repeated value properties, controls whether
  properties with no elements (the empty list) is written to Datastore. If
  true, written, if false, then nothing is written to Datastore.
- required=<bool>: indicates that this property must be given a value.
- default=<value>: a default value if no explicit value is given.
- choices=<list of values>: a list or tuple of allowable values.
- validator=<function>: a general-purpose validation function. It will be
  called with two arguments (prop, value) and should either return the
  validated value or raise an exception. It is also allowed for the function
  to modify the value, but the function should be idempotent. For example: a
  validator that returns value.strip() or value.lower() is fine, but one that
  returns value + '$' is not).
- verbose_name=<value>: A human readable name for this property. This human
  readable name can be used for html form labels.

The repeated and required/default options are mutually exclusive: a repeated
property cannot be required nor can it specify a default value (the default is
always an empty list and an empty list is always an allowed value), but a
required property can have a default.

Some property types have additional arguments.  Some property types do not
support all options.

Repeated properties are always represented as Python lists; if there is only
one value, the list has only one element. When a new list is assigned to a
repeated property, all elements of the list are validated. Since it is also
possible to mutate lists in place, repeated properties are re-validated before
they are written to the datastore.

No validation happens when an entity is read from Cloud Datastore; however
property values read that have the wrong type (e.g. a string value for an
IntegerProperty) are ignored.

For non-repeated properties, None is always a possible value, and no validation
is called when the value is set to None. However for required properties,
writing the entity to Cloud Datastore requires the value to be something other
than None (and valid).

The StructuredProperty is different from most other properties; it lets you
define a sub-structure for your entities. The substructure itself is defined
using a model class, and the attribute value is an instance of that model
class. However, it is not stored in the datastore as a separate entity;
instead, its attribute values are included in the parent entity using a naming
convention (the name of the structured attribute followed by a dot followed by
the name of the subattribute). For example::

    class Address(Model):
      street = StringProperty()
      city = StringProperty()

    class Person(Model):
      name = StringProperty()
      address = StructuredProperty(Address)

    p = Person(name='Harry Potter',
               address=Address(street='4 Privet Drive',
               city='Little Whinging'))
    k = p.put()

This would write a single 'Person' entity with three attributes (as you could
verify using the Datastore Viewer in the Admin Console)::

    name = 'Harry Potter'
    address.street = '4 Privet Drive'
    address.city = 'Little Whinging'

Structured property types can be nested arbitrarily deep, but in a hierarchy of
nested structured property types, only one level can have the repeated flag
set. It is fine to have multiple structured properties referencing the same
model class.

It is also fine to use the same model class both as a top-level entity class
and as for a structured property; however, queries for the model class will
only return the top-level entities.

The LocalStructuredProperty works similar to StructuredProperty on the Python
side. For example::

    class Address(Model):
        street = StringProperty()
        city = StringProperty()

    class Person(Model):
        name = StringProperty()
        address = LocalStructuredProperty(Address)

    p = Person(name='Harry Potter',
               address=Address(street='4 Privet Drive',
               city='Little Whinging'))
    k = p.put()

However, the data written to Cloud Datastore is different; it writes a 'Person'
entity with a 'name' attribute as before and a single 'address' attribute
whose value is a blob which encodes the Address value (using the standard
"protocol buffer" encoding).

The Model class offers basic query support. You can create a Query object by
calling the query() class method. Iterating over a Query object returns the
entities matching the query one at a time. Query objects are fully described
in the documentation for query, but there is one handy shortcut that is only
available through Model.query(): positional arguments are interpreted as filter
expressions which are combined through an AND operator. For example::

    Person.query(Person.name == 'Harry Potter', Person.age >= 11)

is equivalent to::

    Person.query().filter(Person.name == 'Harry Potter', Person.age >= 11)

Keyword arguments passed to .query() are passed along to the Query()
constructor.

It is possible to query for field values of structured properties. For
example::

    qry = Person.query(Person.address.city == 'London')

A number of top-level functions also live in this module:

- :func:`get_multi` reads multiple entities at once.
- :func:`put_multi` writes multiple entities at once.
- :func:`delete_multi` deletes multiple entities at once.

All these have a corresponding ``*_async()`` variant as well. The
``*_multi_async()`` functions return a list of Futures.

There are many other interesting features. For example, Model subclasses may
define pre-call and post-call hooks for most operations (get, put, delete,
allocate_ids), and Property classes may be subclassed to suit various needs.
Documentation for writing a Property subclass is in the docs for the
:class:`Property` class.
"""


import copy
import datetime
import functools
import inspect
import json
import pickle
import zlib

import pytz

from google.cloud.datastore import entity as ds_entity_module
from google.cloud.datastore import helpers
from google.cloud.datastore_v1.types import entity as entity_pb2

from google.cloud.ndb import _legacy_entity_pb
from google.cloud.ndb import _datastore_types
from google.cloud.ndb import exceptions
from google.cloud.ndb import key as key_module
from google.cloud.ndb import _options as options_module
from google.cloud.ndb import query as query_module
from google.cloud.ndb import _transaction
from google.cloud.ndb import tasklets
from google.cloud.ndb import utils


__all__ = [
    "Key",
    "BlobKey",
    "GeoPt",
    "Rollback",
    "KindError",
    "InvalidPropertyError",
    "BadProjectionError",
    "UnprojectedPropertyError",
    "ReadonlyPropertyError",
    "ComputedPropertyError",
    "UserNotFoundError",
    "IndexProperty",
    "Index",
    "IndexState",
    "ModelAdapter",
    "make_connection",
    "ModelAttribute",
    "Property",
    "ModelKey",
    "BooleanProperty",
    "IntegerProperty",
    "FloatProperty",
    "BlobProperty",
    "CompressedTextProperty",
    "TextProperty",
    "StringProperty",
    "GeoPtProperty",
    "PickleProperty",
    "JsonProperty",
    "User",
    "UserProperty",
    "KeyProperty",
    "BlobKeyProperty",
    "DateTimeProperty",
    "DateProperty",
    "TimeProperty",
    "StructuredProperty",
    "LocalStructuredProperty",
    "GenericProperty",
    "ComputedProperty",
    "MetaModel",
    "Model",
    "Expando",
    "get_multi_async",
    "get_multi",
    "put_multi_async",
    "put_multi",
    "delete_multi_async",
    "delete_multi",
    "get_indexes_async",
    "get_indexes",
]


_MEANING_PREDEFINED_ENTITY_USER = 20
_MEANING_COMPRESSED = 22

_ZLIB_COMPRESSION_MARKERS = (
    # As produced by zlib. Indicates compressed byte sequence using DEFLATE at
    # default compression level, with a 32K window size.
    # From https://github.com/madler/zlib/blob/master/doc/rfc1950.txt
    b"x\x9c",
    # Other compression levels produce the following marker.
    b"x^",
)

_MAX_STRING_LENGTH = 1500
Key = key_module.Key
BlobKey = _datastore_types.BlobKey
GeoPt = helpers.GeoPoint
Rollback = exceptions.Rollback

_getfullargspec = inspect.getfullargspec


class KindError(exceptions.BadValueError):
    """Raised when an implementation for a kind can't be found.

    May also be raised when the kind is not a byte string.
    """


class InvalidPropertyError(exceptions.Error):
    """Raised when a property is not applicable to a given use.

    For example, a property must exist and be indexed to be used in a query's
    projection or group by clause.
    """


BadProjectionError = InvalidPropertyError
"""This alias for :class:`InvalidPropertyError` is for legacy support."""


class UnprojectedPropertyError(exceptions.Error):
    """Raised when getting a property value that's not in the projection."""


class ReadonlyPropertyError(exceptions.Error):
    """Raised when attempting to set a property value that is read-only."""


class ComputedPropertyError(ReadonlyPropertyError):
    """Raised when attempting to set or delete a computed property."""


class UserNotFoundError(exceptions.Error):
    """No email argument was specified, and no user is logged in."""


class _NotEqualMixin(object):
    """Mix-in class that implements __ne__ in terms of __eq__."""

    def __ne__(self, other):
        """Implement self != other as not(self == other)."""
        eq = self.__eq__(other)
        if eq is NotImplemented:
            return NotImplemented
        return not eq


class IndexProperty(_NotEqualMixin):
    """Immutable object representing a single property in an index."""

    @utils.positional(1)
    def __new__(cls, name, direction):
        instance = super(IndexProperty, cls).__new__(cls)
        instance._name = name
        instance._direction = direction
        return instance

    @property
    def name(self):
        """str: The property name being indexed."""
        return self._name

    @property
    def direction(self):
        """str: The direction in the index, ``asc`` or ``desc``."""
        return self._direction

    def __repr__(self):
        """Return a string representation."""
        return "{}(name={!r}, direction={!r})".format(
            type(self).__name__, self.name, self.direction
        )

    def __eq__(self, other):
        """Compare two index properties for equality."""
        if not isinstance(other, IndexProperty):
            return NotImplemented
        return self.name == other.name and self.direction == other.direction

    def __hash__(self):
        return hash((self.name, self.direction))


class Index(_NotEqualMixin):
    """Immutable object representing an index."""

    @utils.positional(1)
    def __new__(cls, kind, properties, ancestor):
        instance = super(Index, cls).__new__(cls)
        instance._kind = kind
        instance._properties = properties
        instance._ancestor = ancestor
        return instance

    @property
    def kind(self):
        """str: The kind being indexed."""
        return self._kind

    @property
    def properties(self):
        """List[IndexProperty]: The properties being indexed."""
        return self._properties

    @property
    def ancestor(self):
        """bool: Indicates if this is an ancestor index."""
        return self._ancestor

    def __repr__(self):
        """Return a string representation."""
        return "{}(kind={!r}, properties={!r}, ancestor={})".format(
            type(self).__name__, self.kind, self.properties, self.ancestor
        )

    def __eq__(self, other):
        """Compare two indexes."""
        if not isinstance(other, Index):
            return NotImplemented

        return (
            self.kind == other.kind
            and self.properties == other.properties
            and self.ancestor == other.ancestor
        )

    def __hash__(self):
        return hash((self.kind, self.properties, self.ancestor))


class IndexState(_NotEqualMixin):
    """Immutable object representing an index and its state."""

    @utils.positional(1)
    def __new__(cls, definition, state, id):
        instance = super(IndexState, cls).__new__(cls)
        instance._definition = definition
        instance._state = state
        instance._id = id
        return instance

    @property
    def definition(self):
        """Index: The index corresponding to the tracked state."""
        return self._definition

    @property
    def state(self):
        """str: The index state.

        Possible values are ``error``, ``deleting``, ``serving`` or
        ``building``.
        """
        return self._state

    @property
    def id(self):
        """int: The index ID."""
        return self._id

    def __repr__(self):
        """Return a string representation."""
        return "{}(definition={!r}, state={!r}, id={:d})".format(
            type(self).__name__, self.definition, self.state, self.id
        )

    def __eq__(self, other):
        """Compare two index states."""
        if not isinstance(other, IndexState):
            return NotImplemented

        return (
            self.definition == other.definition
            and self.state == other.state
            and self.id == other.id
        )

    def __hash__(self):
        return hash((self.definition, self.state, self.id))


class ModelAdapter(object):
    def __new__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


def _entity_from_ds_entity(ds_entity, model_class=None):
    """Create an entity from a datastore entity.

    Args:
        ds_entity (google.cloud.datastore_v1.types.Entity): An entity to be
            deserialized.
        model_class (class): Optional; ndb Model class type.

    Returns:
        .Model: The deserialized entity.
    """
    class_key = ds_entity.get("class")
    if class_key:
        # If this is a projection query, we'll get multiple entities with
        # scalar values rather than single entities with array values.
        # It's weird:
        #   https://cloud.google.com/datastore/docs/concepts/queries#datastore-datastore-array-value-python
        if not isinstance(class_key, list):
            kind = class_key
        else:
            kind = class_key[-1]
    else:
        kind = ds_entity.kind

    model_class = model_class or Model._lookup_model(kind)
    entity = model_class()

    if ds_entity.key:
        entity._key = key_module.Key._from_ds_key(ds_entity.key)

    for name, value in ds_entity.items():
        # If ``name`` was used to define the property, ds_entity name will not
        # match model property name.
        name = model_class._code_name_from_stored_name(name)

        prop = getattr(model_class, name, None)

        # Backwards compatibility shim. NDB previously stored structured
        # properties as sets of dotted name properties. Datastore now has
        # native support for embedded entities and NDB now uses that, by
        # default. This handles the case of reading structured properties from
        # older NDB datastore instances.
        #
        # Turns out this is also useful when doing projection queries with
        # repeated structured properties, in which case, due to oddities with
        # how Datastore handles these things, we'll get a scalar value for the
        # subvalue, instead of an array, like you'd expect when just
        # marshalling the entity normally (instead of in a projection query).
        #
        def new_entity(key):
            return _BaseValue(ds_entity_module.Entity(key))

        if prop is None and "." in name:
            supername, subname = name.split(".", 1)
            # Code name for structured property could be different than stored
            # name if ``name`` was set when defined.
            supername = model_class._code_name_from_stored_name(supername)
            structprop = getattr(model_class, supername, None)
            if isinstance(structprop, StructuredProperty):
                subvalue = value
                value = structprop._get_base_value(entity)
                if value in (None, []):  # empty list for repeated props
                    kind = structprop._model_class._get_kind()
                    key = key_module.Key(kind, None)
                    if structprop._repeated:
                        if isinstance(subvalue, list):
                            # Not a projection
                            value = [new_entity(key._key) for _ in subvalue]
                        else:
                            # Is a projection, so subvalue is scalar. Only need
                            # one subentity.
                            value = [new_entity(key._key)]
                    else:
                        value = new_entity(key._key)

                    structprop._store_value(entity, value)

                if structprop._repeated:
                    if isinstance(subvalue, list):
                        # Not a projection

                        # In the rare case of using a repeated
                        # StructuredProperty where the sub-model is an Expando,
                        # legacy NDB could write repeated properties of
                        # different lengths for the subproperties, which was a
                        # bug. We work around this when reading out such values
                        # by making sure our repeated property is the same
                        # length as the longest subproperty.
                        # Make sure to create a key of the same kind as
                        # the other entries in the value list
                        while len(subvalue) > len(value):
                            # Need to make some more subentities
                            expando_kind = structprop._model_class._get_kind()
                            expando_key = key_module.Key(expando_kind, None)
                            value.append(new_entity(expando_key._key))

                        # Branch coverage bug,
                        # See: https://github.com/nedbat/coveragepy/issues/817
                        for subentity, subsubvalue in zip(  # pragma no branch
                            value, subvalue
                        ):
                            subentity.b_val.update({subname: subsubvalue})
                    else:
                        # Is a projection, so subvalue is scalar and we only
                        # have one subentity.
                        value[0].b_val.update({subname: subvalue})
                else:
                    value.b_val.update({subname: subvalue})

                continue

        if prop is None and kind is not None and kind != model_class.__name__:
            # kind and model_class name do not match, so this is probably a
            # polymodel. We need to check if the prop belongs to the subclass.
            model_subclass = Model._lookup_model(kind)
            prop = getattr(model_subclass, name, None)

        def base_value_or_none(value):
            return None if value is None else _BaseValue(value)

        if not (prop is not None and isinstance(prop, Property)):
            if value is not None and isinstance(entity, Expando):  # pragma: NO BRANCH
                if isinstance(value, list):
                    value = [base_value_or_none(sub_value) for sub_value in value]
                else:
                    value = _BaseValue(value)
                setattr(entity, name, value)
            continue  # pragma: NO COVER

        if value is not None:
            if prop._repeated:
                # A repeated property will have a scalar value if this is a
                # projection query.
                if isinstance(value, list):
                    # Not a projection
                    value = [base_value_or_none(sub_value) for sub_value in value]
                else:
                    # Projection
                    value = [_BaseValue(value)]

            else:
                value = _BaseValue(value)

        value = prop._from_datastore(ds_entity, value)

        prop._store_value(entity, value)

    return entity


def _entity_from_protobuf(protobuf):
    """Deserialize an entity from a protobuffer.

    Args:
        protobuf (google.cloud.datastore_v1.types.Entity): An entity protobuf
            to be deserialized.

    Returns:
        .Model: The deserialized entity.
    """
    ds_entity = helpers.entity_from_protobuf(protobuf)
    return _entity_from_ds_entity(ds_entity)


def _properties_of(*entities):
    """Get the model properties for one or more entities.

    After collecting any properties local to the given entities, will traverse the
    entities' MRO (class hierarchy) up from the entities' class through all of its
    ancestors, collecting any ``Property`` instances defined for those classes.

    Args:
        entities (Tuple[model.Model]): The entities to get properties for. All entities
            are expected to be of the same class.

    Returns:
        Iterator[Property]: Iterator over the entities' properties.
    """
    seen = set()

    entity_type = type(entities[0])  # assume all entities are same type
    for level in entities + tuple(entity_type.mro()):
        if not hasattr(level, "_properties"):
            continue

        level_properties = getattr(level, "_properties", {})
        for prop in level_properties.values():
            if (
                not isinstance(prop, Property)
                or isinstance(prop, ModelKey)
                or prop._name in seen
            ):
                continue

            seen.add(prop._name)
            yield prop


def _entity_to_ds_entity(entity, set_key=True):
    """Convert an NDB entity to Datastore entity.

    Args:
        entity (Model): The entity to be converted.

    Returns:
        google.cloud.datastore.entity.Entity: The converted entity.

    Raises:
        ndb.exceptions.BadValueError: If entity has uninitialized properties.
    """
    data = {"_exclude_from_indexes": []}
    uninitialized = []

    for prop in _properties_of(entity):
        if not prop._is_initialized(entity):
            uninitialized.append(prop._name)

        prop._to_datastore(entity, data)

    if uninitialized:
        missing = ", ".join(uninitialized)
        raise exceptions.BadValueError(
            "Entity has uninitialized properties: {}".format(missing)
        )

    exclude_from_indexes = data.pop("_exclude_from_indexes")
    ds_entity = None
    if set_key:
        key = entity._key
        if key is None:
            key = key_module.Key(entity._get_kind(), None)
        ds_entity = ds_entity_module.Entity(
            key._key, exclude_from_indexes=exclude_from_indexes
        )
    else:
        ds_entity = ds_entity_module.Entity(exclude_from_indexes=exclude_from_indexes)

    # Some properties may need to set meanings for backwards compatibility,
    # so we look for them. They are set using the _to_datastore calls above.
    meanings = data.pop("_meanings", None)
    if meanings is not None:
        ds_entity._meanings = meanings

    ds_entity.update(data)

    return ds_entity


def _entity_to_protobuf(entity, set_key=True):
    """Serialize an entity to a protocol buffer.

    Args:
        entity (Model): The entity to be serialized.

    Returns:
        google.cloud.datastore_v1.types.Entity: The protocol buffer
            representation. Note that some methods are now only
            accessible via the `_pb` property.
    """
    ds_entity = _entity_to_ds_entity(entity, set_key=set_key)
    return helpers.entity_to_protobuf(ds_entity)


def make_connection(*args, **kwargs):
    raise exceptions.NoLongerImplementedError()


class ModelAttribute(object):
    """Base for classes that implement a ``_fix_up()`` method."""

    def _fix_up(self, cls, code_name):
        """Fix-up property name. To be implemented by subclasses.

        Args:
            cls (type): The model class that owns the property.
            code_name (str): The name of the :class:`Property` being fixed up.
        """


class _BaseValue(_NotEqualMixin):
    """A marker object wrapping a "base type" value.

    This is used to be able to tell whether ``entity._values[name]`` is a
    user value (i.e. of a type that the Python code understands) or a
    base value (i.e of a type that serialization understands).
    User values are unwrapped; base values are wrapped in a
    :class:`_BaseValue` instance.

    Args:
        b_val (Any): The base value to be wrapped.

    Raises:
        TypeError: If ``b_val`` is :data:`None`.
        TypeError: If ``b_val`` is a list.
    """

    def __init__(self, b_val):
        if b_val is None:
            raise TypeError("Cannot wrap None")
        if isinstance(b_val, list):
            raise TypeError("Lists cannot be wrapped. Received", b_val)
        self.b_val = b_val

    def __repr__(self):
        return "_BaseValue({!r})".format(self.b_val)

    def __eq__(self, other):
        """Compare two :class:`_BaseValue` instances."""
        if not isinstance(other, _BaseValue):
            return NotImplemented

        return self.b_val == other.b_val

    def __hash__(self):
        raise TypeError("_BaseValue is not immutable")


class Property(ModelAttribute):
    """A class describing a typed, persisted attribute of an entity.

    .. warning::

        This is not to be confused with Python's ``@property`` built-in.

    .. note::

        This is just a base class; there are specific subclasses that
        describe properties of various types (and :class:`GenericProperty`
        which describes a dynamically typed property).

    The :class:`Property` does not reserve any "public" names (i.e. names
    that don't start with an underscore). This is intentional; the subclass
    :class:`StructuredProperty` uses the public attribute namespace to refer to
    nested property names (this is essential for specifying queries on
    subproperties).

    The :meth:`IN` attribute is provided as an alias for ``_IN``, but ``IN``
    can be overridden if a subproperty has the same name.

    The :class:`Property` class and its predefined subclasses allow easy
    subclassing using composable (or stackable) validation and
    conversion APIs. These require some terminology definitions:

    * A **user value** is a value such as would be set and accessed by the
      application code using standard attributes on the entity.
    * A **base value** is a value such as would be serialized to
      and deserialized from Cloud Datastore.

    A property will be a member of a :class:`Model` and will be used to help
    store values in an ``entity`` (i.e. instance of a model subclass). The
    underlying stored values can be either user values or base values.

    To interact with the composable conversion and validation API, a
    :class:`Property` subclass can define

    * ``_to_base_type()``
    * ``_from_base_type()``
    * ``_validate()``

    These should **not** call their ``super()`` method, since the methods
    are meant to be composed. For example with composable validation:

    .. code-block:: python

        class Positive(ndb.IntegerProperty):
            def _validate(self, value):
                if value < 1:
                    raise ndb.exceptions.BadValueError("Non-positive", value)


        class SingleDigit(Positive):
            def _validate(self, value):
                if value > 9:
                    raise ndb.exceptions.BadValueError("Multi-digit", value)

    neither ``_validate()`` method calls ``super()``. Instead, when a
    ``SingleDigit`` property validates a value, it composes all validation
    calls in order:

    * ``SingleDigit._validate``
    * ``Positive._validate``
    * ``IntegerProperty._validate``

    The API supports "stacking" classes with ever more sophisticated
    user / base conversions:

    * the user to base conversion goes from more sophisticated to less
      sophisticated
    * the base to user conversion goes from less sophisticated to more
      sophisticated

    For example, see the relationship between :class:`BlobProperty`,
    :class:`TextProperty` and :class:`StringProperty`.

    The validation API distinguishes between "lax" and "strict" user values.
    The set of lax values is a superset of the set of strict values. The
    ``_validate()`` method takes a lax value and if necessary converts it to
    a strict value. For example, an integer (lax) can be converted to a
    floating point (strict) value. This means that when setting the property
    value, lax values are accepted, while when getting the property value, only
    strict values will be returned. If no conversion is needed, ``_validate()``
    may return :data:`None`. If the argument is outside the set of accepted lax
    values, ``_validate()`` should raise an exception, preferably
    :exc:`TypeError` or :exc:`.BadValueError`.

    A class utilizing all three may resemble:

    .. code-block:: python

        class WidgetProperty(ndb.Property):

            def _validate(self, value):
                # Lax user value to strict user value.
                if not isinstance(value, Widget):
                    raise ndb.exceptions.BadValueError(value)

            def _to_base_type(self, value):
                # (Strict) user value to base value.
                if isinstance(value, Widget):
                    return value.to_internal()

            def _from_base_type(self, value):
                # Base value to (strict) user value.'
                if not isinstance(value, _WidgetInternal):
                    return Widget(value)

    There are some things that ``_validate()``, ``_to_base_type()`` and
    ``_from_base_type()`` do **not** need to handle:

    * :data:`None`: They will not be called with :data:`None` (and if they
      return :data:`None`, this means that the value does not need conversion).
    * Repeated values: The infrastructure takes care of calling
      ``_from_base_type()`` or ``_to_base_type()`` for each list item in a
      repeated value.
    * Wrapping "base" values: The wrapping and unwrapping is taken care of by
      the infrastructure that calls the composable APIs.
    * Comparisons: The comparison operations call ``_to_base_type()`` on
      their operand.
    * Distinguishing between user and base values: the infrastructure
      guarantees that ``_from_base_type()`` will be called with an
      (unwrapped) base value, and that ``_to_base_type()`` will be called
      with a user value.
    * Returning the original value: if any of these return :data:`None`, the
      original value is kept. (Returning a different value not equal to
      :data:`None` will substitute the different value.)

    Additionally, :meth:`_prepare_for_put` can be used to integrate with
    datastore save hooks used by :class:`Model` instances.

    .. automethod:: _prepare_for_put

    Args:
        name (str): The name of the property.
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (Any): The default value for this property.
        choices (Iterable[Any]): A container of allowed values for this
            property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.
    """

    # Instance default fallbacks provided by class.
    _code_name = None
    _name = None
    _indexed = True
    _repeated = False
    _required = False
    _default = None
    _choices = None
    _validator = None
    _verbose_name = None
    _write_empty_list = False
    # Non-public class attributes.
    _FIND_METHODS_CACHE = {}

    @utils.positional(2)
    def __init__(
        self,
        name=None,
        indexed=None,
        repeated=None,
        required=None,
        default=None,
        choices=None,
        validator=None,
        verbose_name=None,
        write_empty_list=None,
    ):
        # NOTE: These explicitly avoid setting the values so that the
        #       instances will fall back to the class on lookup.
        if name is not None:
            self._name = self._verify_name(name)
        if indexed is not None:
            self._indexed = indexed
        if repeated is not None:
            self._repeated = repeated
        if required is not None:
            self._required = required
        if default is not None:
            self._default = default
        self._verify_repeated()
        if choices is not None:
            self._choices = self._verify_choices(choices)
        if validator is not None:
            self._validator = self._verify_validator(validator)
        if verbose_name is not None:
            self._verbose_name = verbose_name
        if write_empty_list is not None:
            self._write_empty_list = write_empty_list

    @staticmethod
    def _verify_name(name):
        """Verify the name of the property.

        Args:
            name (str): The name of the property.

        Returns:
            str: The ``name`` passed in.

        Raises:
            TypeError: If the ``name`` is not a string.
            ValueError: If the name contains a ``.``.
        """
        if not isinstance(name, str):
            raise TypeError("Name {!r} is not a string".format(name))

        if "." in name:
            raise ValueError("Name {!r} cannot contain period characters".format(name))

        return name

    def _verify_repeated(self):
        """Checks if the repeated / required / default values are compatible.

        Raises:
            ValueError: If ``repeated`` is :data:`True` but one of
                ``required`` or ``default`` is set.
        """
        if self._repeated and (self._required or self._default is not None):
            raise ValueError("repeated is incompatible with required or default")

    @staticmethod
    def _verify_choices(choices):
        """Verify the choices for a property with a limited set of values.

        Args:
            choices (Union[list, tuple, set, frozenset]): An iterable of
                allowed values for the property.

        Returns:
            frozenset: The ``choices`` cast to a frozen set.

        Raises:
            TypeError: If ``choices`` is not one of the expected container
                types.
        """
        if not isinstance(choices, (list, tuple, set, frozenset)):
            raise TypeError(
                "choices must be a list, tuple or set; received {!r}".format(choices)
            )
        return frozenset(choices)

    @staticmethod
    def _verify_validator(validator):
        """Verify the validator for a property.

        The validator will be called as follows:

        .. code-block:: python

            value = validator(prop, value)

        The ``validator`` should be idempotent, i.e. calling it a second time
        should not further modify the value. So a validator that returns e.g.
        ``value.lower()`` or ``value.strip()`` is fine, but one that returns
        ``value + "$"`` is not.

        Args:
            validator (Callable[[Property, Any], bool]): A callable that can
                validate a property value.

        Returns:
            Callable[[Property, Any], bool]: The ``validator``.

        Raises:
            TypeError: If ``validator`` is not callable. This is determined by
                checking is the attribute ``__call__`` is defined.
        """
        # NOTE: Checking for ``_call__`` is done to match the original
        #       implementation. It's not clear why ``callable()`` was not used.
        if getattr(validator, "__call__", None) is None:
            raise TypeError(
                "validator must be callable or None; received {!r}".format(validator)
            )

        return validator

    def _constructor_info(self):
        """Helper for :meth:`__repr__`.

        Yields:
            Tuple[str, bool]: Pairs of argument name and a boolean indicating
            if that argument is a keyword.
        """
        # inspect.signature not available in Python 2.7, so we use positional
        # decorator combined with argspec instead.
        argspec = getattr(self.__init__, "_argspec", _getfullargspec(self.__init__))
        positional = getattr(self.__init__, "_positional_args", 1)
        for index, name in enumerate(argspec.args):
            if name == "self":
                continue
            yield name, index >= positional

    def __repr__(self):
        """Return a compact unambiguous string representation of a property.

        This cycles through all stored attributes and displays the ones that
        differ from the default values.
        """
        args = []
        cls = type(self)
        for name, is_keyword in self._constructor_info():
            attr = "_{}".format(name)
            instance_val = getattr(self, attr)
            default_val = getattr(cls, attr)

            if instance_val is not default_val:
                if isinstance(instance_val, type):
                    as_str = instance_val.__name__
                else:
                    as_str = repr(instance_val)

                if is_keyword:
                    as_str = "{}={}".format(name, as_str)
                args.append(as_str)

        return "{}({})".format(cls.__name__, ", ".join(args))

    def _datastore_type(self, value):
        """Internal hook used by property filters.

        Sometimes the low-level query interface needs a specific data type
        in order for the right filter to be constructed. See
        :meth:`_comparison`.

        Args:
            value (Any): The value to be converted to a low-level type.

        Returns:
            Any: The passed-in ``value``, always. Subclasses may alter this
            behavior.
        """
        return value

    def _comparison(self, op, value):
        """Internal helper for comparison operators.

        Args:
            op (str): The comparison operator. One of ``=``, ``!=``, ``<``,
                ``<=``, ``>``, ``>=`` or ``in``.
            value (Any): The value to compare against.

        Returns:
            FilterNode: A FilterNode instance representing the requested
            comparison.

        Raises:
            BadFilterError: If the current property is not indexed.
        """
        # Import late to avoid circular imports.
        from google.cloud.ndb import query

        if not self._indexed:
            raise exceptions.BadFilterError(
                "Cannot query for unindexed property {}".format(self._name)
            )

        if value is not None:
            value = self._do_validate(value)
            value = self._call_to_base_type(value)
            value = self._datastore_type(value)

        return query.FilterNode(self._name, op, value)

    # Comparison operators on Property instances don't compare the
    # properties; instead they return ``FilterNode``` instances that can be
    # used in queries.

    def __eq__(self, value):
        """FilterNode: Represents the ``=`` comparison."""
        return self._comparison("=", value)

    def __ne__(self, value):
        """FilterNode: Represents the ``!=`` comparison."""
        return self._comparison("!=", value)

    def __lt__(self, value):
        """FilterNode: Represents the ``<`` comparison."""
        return self._comparison("<", value)

    def __le__(self, value):
        """FilterNode: Represents the ``<=`` comparison."""
        return self._comparison("<=", value)

    def __gt__(self, value):
        """FilterNode: Represents the ``>`` comparison."""
        return self._comparison(">", value)

    def __ge__(self, value):
        """FilterNode: Represents the ``>=`` comparison."""
        return self._comparison(">=", value)

    def _validate_and_canonicalize_values(self, value):
        if not self._indexed:
            raise exceptions.BadFilterError(
                "Cannot query for unindexed property {}".format(self._name)
            )

        if not isinstance(value, (list, tuple, set, frozenset)):
            raise exceptions.BadArgumentError(
                "For field {}, expected list, tuple or set, got {!r}".format(
                    self._name, value
                )
            )

        values = []
        for sub_value in value:
            if sub_value is not None:
                sub_value = self._do_validate(sub_value)
                sub_value = self._call_to_base_type(sub_value)
                sub_value = self._datastore_type(sub_value)
            values.append(sub_value)
        return values

    def _NOT_IN(self, value, server_op=False):
        """.FilterNode: Represents the ``not_in`` filter."""
        # Import late to avoid circular imports.
        from google.cloud.ndb import query

        values = self._validate_and_canonicalize_values(value)
        return query.FilterNode(self._name, "not_in", values)

    def _IN(self, value, server_op=False):
        """For the ``in`` comparison operator.

        The ``in`` operator cannot be overloaded in the way we want
        to, so we define a method. For example:

        .. code-block:: python

            Employee.query(Employee.rank.IN([4, 5, 6]))

        Note that the method is called ``_IN()`` but may normally be invoked
        as ``IN()``; ``_IN()`` is provided for the case that a
        :class:`.StructuredProperty` refers to a model that has a property
        named ``IN``.

        Args:
            value (Iterable[Any]): The set of values that the property value
                must be contained in.

        Returns:
            Union[~google.cloud.ndb.query.DisjunctionNode, \
                ~google.cloud.ndb.query.FilterNode, \
                ~google.cloud.ndb.query.FalseNode]: A node corresponding
            to the desired in filter.

            * If ``value`` is empty, this will return a :class:`.FalseNode`
            * If ``len(value) == 1``, this will return a :class:`.FilterNode`
            * Otherwise, this will return a :class:`.DisjunctionNode`

        Raises:
            ~google.cloud.ndb.exceptions.BadFilterError: If the current
                property is not indexed.
            ~google.cloud.ndb.exceptions.BadArgumentError: If ``value`` is not
                a basic container (:class:`list`, :class:`tuple`, :class:`set`
                or :class:`frozenset`).
        """
        # Import late to avoid circular imports.
        from google.cloud.ndb import query

        values = self._validate_and_canonicalize_values(value)
        return query.FilterNode(self._name, "in", values, server_op=server_op)

    IN = _IN
    NOT_IN = _NOT_IN

    """Used to check if a property value is contained in a set of values.

    For example:

    .. code-block:: python

        Employee.query(Employee.rank.IN([4, 5, 6]))
    """

    def __neg__(self):
        """Return a descending sort order on this property.

        For example:

        .. code-block:: python

            Employee.query().order(-Employee.rank)
        """
        # Import late to avoid circular imports.
        from google.cloud.ndb import query

        return query.PropertyOrder(name=self._name, reverse=True)

    def __pos__(self):
        """Return an ascending sort order on this property.

        Note that this is redundant but provided for consistency with
        :meth:`__neg__`. For example, the following two are equivalent:

        .. code-block:: python

            Employee.query().order(+Employee.rank)
            Employee.query().order(Employee.rank)
        """
        # Import late to avoid circular imports.
        from google.cloud.ndb import query

        return query.PropertyOrder(name=self._name, reverse=False)

    def _do_validate(self, value):
        """Call all validations on the value.

        This transforms the ``value`` via:

        * Calling the derived ``_validate()`` method(s) (on subclasses that
          don't define ``_to_base_type()``),
        * Calling the custom validator function

        After transforming, it checks if the transformed value is in
        ``choices`` (if defined).

        It's possible that one of the ``_validate()`` methods will raise
        an exception.

        If ``value`` is a base-value, this will do nothing and return it.

        .. note::

            This does not call all composable ``_validate()`` methods.
            It only calls ``_validate()`` methods up to the
            first class in the hierarchy that defines a ``_to_base_type()``
            method, when the MRO is traversed looking for ``_validate()`` and
            ``_to_base_type()`` methods.

        .. note::

            For a repeated property this method should be called
            for each value in the list, not for the list as a whole.

        Args:
            value (Any): The value to be converted / validated.

        Returns:
            Any: The transformed ``value``, possibly modified in an idempotent
            way.
        """
        if self._validator is not None:
            new_value = self._validator(self, value)
            if new_value is not None:
                value = new_value

        if isinstance(value, _BaseValue):
            return value

        value = self._call_shallow_validation(value)

        if self._choices is not None:
            if value not in self._choices:
                raise exceptions.BadValueError(
                    "Value {!r} for property {} is not an allowed "
                    "choice".format(value, self._name)
                )

        return value

    def _fix_up(self, cls, code_name):
        """Internal helper called to tell the property its name.

        This is called by :meth:`_fix_up_properties`, which is called by
        :class:`MetaModel` when finishing the construction of a :class:`Model`
        subclass. The name passed in is the name of the class attribute to
        which the current property is assigned (a.k.a. the code name). Note
        that this means that each property instance must be assigned to (at
        most) one class attribute. E.g. to declare three strings, you must
        call create three :class:`StringProperty` instances:

        .. code-block:: python

            class MyModel(ndb.Model):
                foo = ndb.StringProperty()
                bar = ndb.StringProperty()
                baz = ndb.StringProperty()

        you cannot write:

        .. code-block:: python

            class MyModel(ndb.Model):
                foo = bar = baz = ndb.StringProperty()

        Args:
            cls (type): The class that the property is stored on. This argument
                is unused by this method, but may be used by subclasses.
            code_name (str): The name (on the class) that refers to this
                property.
        """
        self._code_name = code_name
        if self._name is None:
            self._name = code_name

    def _store_value(self, entity, value):
        """Store a value in an entity for this property.

        This assumes validation has already taken place. For a repeated
        property the value should be a list.

        Args:
            entity (Model): An entity to set a value on.
            value (Any): The value to be stored for this property.
        """
        entity._values[self._name] = value

    def _set_value(self, entity, value):
        """Set a value in an entity for a property.

        This performs validation first. For a repeated property the value
        should be a list (or similar container).

        Args:
            entity (Model): An entity to set a value on.
            value (Any): The value to be stored for this property.

        Raises:
            ReadonlyPropertyError: If the ``entity`` is the result of a
                projection query.
            exceptions.BadValueError: If the current property is repeated but the
                ``value`` is not a basic container (:class:`list`,
                :class:`tuple`, :class:`set` or :class:`frozenset`).
        """
        if entity._projection:
            raise ReadonlyPropertyError(
                "You cannot set property values of a projection entity"
            )

        if self._repeated:
            if not isinstance(value, (list, tuple, set, frozenset)):
                raise exceptions.BadValueError(
                    "In field {}, expected list or tuple, got {!r}".format(
                        self._name, value
                    )
                )
            value = [self._do_validate(v) for v in value]
        else:
            if value is not None:
                value = self._do_validate(value)

        self._store_value(entity, value)

    def _has_value(self, entity, unused_rest=None):
        """Determine if the entity has a value for this property.

        Args:
            entity (Model): An entity to check if the current property has
                a value set.
            unused_rest (None): An always unused keyword.
        """
        return self._name in entity._values

    def _retrieve_value(self, entity, default=None):
        """Retrieve the value for this property from an entity.

        This returns :data:`None` if no value is set, or the ``default``
        argument if given. For a repeated property this returns a list if a
        value is set, otherwise :data:`None`. No additional transformations
        are applied.

        Args:
            entity (Model): An entity to get a value from.
            default (Optional[Any]): The default value to use as fallback.
        """
        return entity._values.get(self._name, default)

    def _get_user_value(self, entity):
        """Return the user value for this property of the given entity.

        This implies removing the :class:`_BaseValue` wrapper if present, and
        if it is, calling all ``_from_base_type()`` methods, in the reverse
        method resolution order of the property's class. It also handles
        default values and repeated properties.

        Args:
            entity (Model): An entity to get a value from.

        Returns:
            Any: The original value (if not :class:`_BaseValue`) or the wrapped
            value converted from the base type.
        """
        return self._apply_to_values(entity, self._opt_call_from_base_type)

    def _get_base_value(self, entity):
        """Return the base value for this property of the given entity.

        This implies calling all ``_to_base_type()`` methods, in the method
        resolution order of the property's class, and adding a
        :class:`_BaseValue` wrapper, if one is not already present. (If one
        is present, no work is done.)  It also handles default values and
        repeated properties.

        Args:
            entity (Model): An entity to get a value from.

        Returns:
            Union[_BaseValue, List[_BaseValue]]: The original value
            (if :class:`_BaseValue`) or the value converted to the base type
            and wrapped.
        """
        return self._apply_to_values(entity, self._opt_call_to_base_type)

    def _get_base_value_unwrapped_as_list(self, entity):
        """Like _get_base_value(), but always returns a list.

        Args:
            entity (Model): An entity to get a value from.

        Returns:
            List[Any]: The unwrapped base values. For an unrepeated
            property, if the value is missing or :data:`None`, returns
            ``[None]``; for a repeated property, if the original value is
            missing or :data:`None` or empty, returns ``[]``.
        """
        wrapped = self._get_base_value(entity)
        if self._repeated:
            return [w.b_val for w in wrapped]
        else:
            if wrapped is None:
                return [None]
            return [wrapped.b_val]

    def _opt_call_from_base_type(self, value):
        """Call ``_from_base_type()`` if necessary.

        If ``value`` is a :class:`_BaseValue`, unwrap it and call all
        :math:`_from_base_type` methods. Otherwise, return the value
        unchanged.

        Args:
            value (Any): The value to invoke :meth:`_call_from_base_type`
               for.

        Returns:
            Any: The original value (if not :class:`_BaseValue`) or the value
            converted from the base type.
        """
        if isinstance(value, _BaseValue):
            value = self._call_from_base_type(value.b_val)
        return value

    def _value_to_repr(self, value):
        """Turn a value (base or not) into its repr().

        This exists so that property classes can override it separately.

        This manually applies ``_from_base_type()`` so as not to have a side
        effect on what's contained in the entity. Printing a value should not
        change it.

        Args:
            value (Any): The value to convert to a pretty-print ``repr``.

        Returns:
            str: The ``repr`` of the "true" value.
        """
        val = self._opt_call_from_base_type(value)
        return repr(val)

    def _opt_call_to_base_type(self, value):
        """Call ``_to_base_type()`` if necessary.

        If ``value`` is a :class:`_BaseValue`, return it unchanged.
        Otherwise, call all ``_validate()`` and ``_to_base_type()`` methods
        and wrap it in a :class:`_BaseValue`.

        Args:
            value (Any): The value to invoke :meth:`_call_to_base_type`
               for.

        Returns:
            _BaseValue: The original value (if :class:`_BaseValue`) or the
            value converted to the base type and wrapped.
        """
        if not isinstance(value, _BaseValue):
            value = _BaseValue(self._call_to_base_type(value))
        return value

    def _call_from_base_type(self, value):
        """Call all ``_from_base_type()`` methods on the value.

        This calls the methods in the reverse method resolution order of
        the property's class.

        Args:
            value (Any): The value to be converted.

        Returns:
            Any: The transformed ``value``.
        """
        methods = self._find_methods("_from_base_type", reverse=True)
        call = self._apply_list(methods)
        return call(value)

    def _call_to_base_type(self, value):
        """Call all ``_validate()`` and ``_to_base_type()`` methods on value.

        This calls the methods in the method resolution order of the
        property's class. For example, given the hierarchy

        .. code-block:: python

            class A(Property):
                def _validate(self, value):
                    ...
                def _to_base_type(self, value):
                    ...

            class B(A):
                def _validate(self, value):
                    ...
                def _to_base_type(self, value):
                    ...

            class C(B):
                def _validate(self, value):
                    ...

        the full list of methods (in order) is:

        * ``C._validate()``
        * ``B._validate()``
        * ``B._to_base_type()``
        * ``A._validate()``
        * ``A._to_base_type()``

        Args:
            value (Any): The value to be converted / validated.

        Returns:
            Any: The transformed ``value``.
        """
        methods = self._find_methods("_validate", "_to_base_type")
        call = self._apply_list(methods)
        value = call(value)

        # Legacy NDB, because it didn't delegate to Datastore for serializing
        # entities, would directly write a Key protocol buffer for a key. We,
        # however, need to transform NDB keys to Datastore keys before
        # delegating to Datastore to generate protocol buffers. You might be
        # tempted to do this in KeyProperty._to_base_type, and that works great
        # for properties of KeyProperty type. If, however, you're computing a
        # key in a ComputedProperty, ComputedProperty doesn't know to call
        # KeyProperty's base type. (Probably ComputedProperty should take
        # another property type as a constructor argument for this purpose,
        # but that wasn't part of the original design and adding it introduces
        # backwards compatibility issues.) See: Issue #284
        if isinstance(value, key_module.Key):
            value = value._key  # Datastore key

        return value

    def _call_shallow_validation(self, value):
        """Call the "initial" set of ``_validate()`` methods.

        This is similar to :meth:`_call_to_base_type` except it only calls
        those ``_validate()`` methods that can be called without needing to
        call ``_to_base_type()``.

        An example: suppose the class hierarchy is

        .. code-block:: python

            class A(Property):
                def _validate(self, value):
                    ...
                def _to_base_type(self, value):
                    ...

            class B(A):
                def _validate(self, value):
                    ...
                def _to_base_type(self, value):
                    ...

            class C(B):
                def _validate(self, value):
                    ...

        The full list of methods (in order) called by
        :meth:`_call_to_base_type` is:

        * ``C._validate()``
        * ``B._validate()``
        * ``B._to_base_type()``
        * ``A._validate()``
        * ``A._to_base_type()``

        whereas the full list of methods (in order) called here stops once
        a ``_to_base_type()`` method is encountered:

        * ``C._validate()``
        * ``B._validate()``

        Args:
            value (Any): The value to be converted / validated.

        Returns:
            Any: The transformed ``value``.
        """
        methods = []
        for method in self._find_methods("_validate", "_to_base_type"):
            # Stop if ``_to_base_type()`` is encountered.
            if method.__name__ != "_validate":
                break
            methods.append(method)

        call = self._apply_list(methods)
        return call(value)

    @classmethod
    def _find_methods(cls, *names, **kwargs):
        """Compute a list of composable methods.

        Because this is a common operation and the class hierarchy is
        static, the outcome is cached (assuming that for a particular list
        of names the reversed flag is either always on, or always off).

        Args:
            names (Tuple[str, ...]): One or more method names to look up on
                the current class or base classes.
            reverse (bool): Optional flag, default False; if True, the list is
              reversed.

        Returns:
            List[Callable]: Class method objects.
        """
        reverse = kwargs.get("reverse", False)
        # Get cache on current class / set cache if it doesn't exist.
        # Using __qualname__ was better for getting a qualified name, but it's
        # not available in Python 2.7.
        key = "{}.{}".format(cls.__module__, cls.__name__)
        cache = cls._FIND_METHODS_CACHE.setdefault(key, {})
        hit = cache.get(names)
        if hit is not None:
            if reverse:
                return list(reversed(hit))
            else:
                return hit

        methods = []
        for klass in cls.__mro__:
            for name in names:
                method = klass.__dict__.get(name)
                if method is not None:
                    methods.append(method)

        cache[names] = methods
        if reverse:
            return list(reversed(methods))
        else:
            return methods

    def _apply_list(self, methods):
        """Chain together a list of callables for transforming a value.

        .. note::

            Each callable in ``methods`` is an unbound instance method, e.g.
            accessed via ``Property.foo`` rather than ``instance.foo``.
            Therefore, calling these methods will require ``self`` as the
            first argument.

        If one of the method returns :data:`None`, the previous value is kept;
        otherwise the last value is replace.

        Exceptions thrown by a method in ``methods`` are not caught, so it
        is up to the caller to catch them.

        Args:
            methods (Iterable[Callable[[Any], Any]]): An iterable of methods
                to apply to a value.

        Returns:
            Callable[[Any], Any]: A callable that takes a single value and
            applies each method in ``methods`` to it.
        """

        def call(value):
            for method in methods:
                new_value = method(self, value)
                if new_value is not None:
                    value = new_value
            return value

        return call

    def _apply_to_values(self, entity, function):
        """Apply a function to the property value / values of a given entity.

        This retrieves the property value, applies the function, and then
        stores the value back. For a repeated property, the function is
        applied separately to each of the values in the list. The
        resulting value or list of values is both stored back in the
        entity and returned from this method.

        Args:
            entity (Model): An entity to get a value from.
            function (Callable[[Any], Any]): A transformation to apply to
                the value.

        Returns:
            Any: The transformed value store on the entity for this property.
        """
        value = self._retrieve_value(entity, self._default)
        if self._repeated:
            if value is None:
                value = []
                self._store_value(entity, value)
            else:
                # NOTE: This assumes, but does not check, that ``value`` is
                #       iterable. This relies on ``_set_value`` having checked
                #       and converted to a ``list`` for a repeated property.
                value[:] = map(function, value)
        else:
            if value is not None:
                new_value = function(value)
                if new_value is not None and new_value is not value:
                    self._store_value(entity, new_value)
                    value = new_value

        return value

    def _get_value(self, entity):
        """Get the value for this property from an entity.

        For a repeated property this initializes the value to an empty
        list if it is not set.

        Args:
            entity (Model): An entity to get a value from.

        Returns:
            Any: The user value stored for the current property.

        Raises:
            UnprojectedPropertyError: If the ``entity`` is the result of a
                projection query and the current property is not one of the
                projected properties.
        """
        if entity._projection:
            if self._name not in entity._projection:
                raise UnprojectedPropertyError(
                    "Property {} is not in the projection".format(self._name)
                )

        return self._get_user_value(entity)

    def _delete_value(self, entity):
        """Delete the value for this property from an entity.

        .. note::

            If no value exists this is a no-op; deleted values will not be
            serialized but requesting their value will return :data:`None` (or
            an empty list in the case of a repeated property).

        Args:
            entity (Model): An entity to get a value from.
        """
        if self._name in entity._values:
            del entity._values[self._name]

    def _is_initialized(self, entity):
        """Ask if the entity has a value for this property.

        This returns :data:`False` if a value is stored but the stored value
        is :data:`None`.

        Args:
            entity (Model): An entity to get a value from.
        """
        return not self._required or (
            (self._has_value(entity) or self._default is not None)
            and self._get_value(entity) is not None
        )

    def __get__(self, entity, unused_cls=None):
        """Descriptor protocol: get the value from the entity.

        Args:
            entity (Model): An entity to get a value from.
            unused_cls (type): The class that owns this instance.
        """
        if entity is None:
            # Handle the case where ``__get__`` is called on the class
            # rather than an instance.
            return self
        return self._get_value(entity)

    def __set__(self, entity, value):
        """Descriptor protocol: set the value on the entity.

        Args:
            entity (Model): An entity to set a value on.
            value (Any): The value to set.
        """
        self._set_value(entity, value)

    def __delete__(self, entity):
        """Descriptor protocol: delete the value from the entity.

        Args:
            entity (Model): An entity to delete a value from.
        """
        self._delete_value(entity)

    def _serialize(self, entity, pb, prefix="", parent_repeated=False, projection=None):
        """Serialize this property to a protocol buffer.

        Some subclasses may override this method.

        Args:
            entity (Model): The entity that owns this property.
            pb (google.cloud.datastore_v1.proto.entity_pb2.Entity): An existing
                entity protobuf instance that we'll add a value to.
            prefix (Optional[str]): Name prefix used for
                :class:`StructuredProperty` (if present, must end in ``.``).
            parent_repeated (Optional[bool]): Indicates if the parent (or an
                earlier ancestor) is a repeated property.
            projection (Optional[Union[list, tuple]]): An iterable of strings
                representing the projection for the model instance, or
                :data:`None` if the instance is not a projection.

        Raises:
            NotImplementedError: Always. No longer implemented.
        """
        raise exceptions.NoLongerImplementedError()

    def _deserialize(self, entity, p, unused_depth=1):
        """Deserialize this property from a protocol buffer.

        Raises:
            NotImplementedError: Always. This method is deprecated.
        """
        raise exceptions.NoLongerImplementedError()

    def _legacy_deserialize(self, entity, p, unused_depth=1):
        """Internal helper to deserialize this property from a protocol buffer.
           Ported from legacy NDB, used for decoding pickle properties.
           This is an older style GAE protocol buffer deserializer and is not
           used to deserialize the modern Google Cloud Datastore protocol buffer.

        Subclasses may override this method.

        Args:
            entity: The entity, a Model (subclass) instance.
            p: A Property Message object (a protocol buffer).
            depth: Optional nesting depth, default 1 (unused here, but used
                   by some subclasses that override this method).
        """

        if p.meaning() == _legacy_entity_pb.Property.EMPTY_LIST:
            self._store_value(entity, [])
            return

        val = self._legacy_db_get_value(p.value(), p)
        if val is not None:
            val = _BaseValue(val)

        # TODO(from legacy-datastore port): May never be suitable.
        # replace the remainder of the function with the following commented
        # out code once its feasible to make breaking changes such as not calling
        # _store_value().

        # if self._repeated:
        #   entity._values.setdefault(self._name, []).append(val)
        # else:
        #   entity._values[self._name] = val

        if self._repeated:
            if self._has_value(entity):
                value = self._retrieve_value(entity)
                assert isinstance(value, list), repr(value)
                value.append(val)
            else:
                # We promote single values to lists if we are a list property
                value = [val]
        else:
            value = val
        self._store_value(entity, value)

    def _db_set_value(self, v, unused_p, value):
        """Helper for :meth:`_serialize`.

        Raises:
            NotImplementedError: Always. No longer implemented.
        """
        raise exceptions.NoLongerImplementedError()

    def _db_get_value(self, v, unused_p):
        """Helper for :meth:`_deserialize`.

        Raises:
            NotImplementedError: Always. This method is deprecated.
        """
        raise exceptions.NoLongerImplementedError()

    @staticmethod
    def _legacy_db_get_value(v, p):
        # Ported from https://github.com/GoogleCloudPlatform/datastore-ndb-python/blob/cf4cab3f1f69cd04e1a9229871be466b53729f3f/ndb/model.py#L2647
        entity_pb = _legacy_entity_pb
        # A custom 'meaning' for compressed properties.
        _MEANING_URI_COMPRESSED = "ZLIB"
        # The Epoch (a zero POSIX timestamp).
        _EPOCH = datetime.datetime.utcfromtimestamp(0)
        # This is awkward but there seems to be no faster way to inspect
        # what union member is present.  datastore_types.FromPropertyPb(),
        # the undisputed authority, has the same series of if-elif blocks.
        # (We don't even want to think about multiple members... :-)
        if v.has_stringvalue():
            sval = v.stringvalue()
            meaning = p.meaning()
            if meaning == entity_pb.Property.BLOBKEY:
                sval = BlobKey(sval)
            elif meaning == entity_pb.Property.BLOB:
                if p.meaning_uri() == _MEANING_URI_COMPRESSED:
                    sval = _CompressedValue(sval)
            elif meaning == entity_pb.Property.ENTITY_PROTO:
                # NOTE: This is only used for uncompressed LocalStructuredProperties.
                pb = entity_pb.EntityProto()
                pb.MergePartialFromString(sval)
                modelclass = Expando
                if pb.key().path.element_size():
                    kind = pb.key().path.element[-1].type
                    modelclass = Model._kind_map.get(kind, modelclass)
                sval = modelclass._from_pb(pb)
            elif meaning != entity_pb.Property.BYTESTRING:
                try:
                    sval.decode("ascii")
                    # If this passes, don't return unicode.
                except UnicodeDecodeError:
                    try:
                        sval = str(sval.decode("utf-8"))
                    except UnicodeDecodeError:
                        pass
            return sval
        elif v.has_int64value():
            ival = v.int64value()
            if p.meaning() == entity_pb.Property.GD_WHEN:
                return _EPOCH + datetime.timedelta(microseconds=ival)
            return ival
        elif v.has_booleanvalue():
            # The booleanvalue field is an int32, so booleanvalue() returns
            # an int, hence the conversion.
            return bool(v.booleanvalue())
        elif v.has_doublevalue():
            return v.doublevalue()
        elif v.has_referencevalue():
            rv = v.referencevalue()
            app = rv.app()
            namespace = rv.name_space()
            pairs = [
                (elem.type(), elem.id() or elem.name())
                for elem in rv.pathelement_list()
            ]
            return Key(pairs=pairs, app=app, namespace=namespace)
        elif v.has_pointvalue():
            pv = v.pointvalue()
            return GeoPt(pv.x(), pv.y())
        elif v.has_uservalue():
            return _unpack_user(v)
        else:
            # A missing value implies null.
            return None

    def _prepare_for_put(self, entity):
        """Allow this property to define a pre-put hook.

        This base class implementation does nothing, but subclasses may
        provide hooks.

        Args:
            entity (Model): An entity with values.
        """
        pass

    def _check_property(self, rest=None, require_indexed=True):
        """Check this property for specific requirements.

        Called by ``Model._check_properties()``.

        Args:
            rest: Optional subproperty to check, of the form
                ``name1.name2...nameN``.
            required_indexed (bool): Indicates if the current property must
                be indexed.

        Raises:
            InvalidPropertyError: If ``require_indexed`` is :data:`True`
                but the current property is not indexed.
            InvalidPropertyError: If a subproperty is specified via ``rest``
                (:class:`StructuredProperty` overrides this method to handle
                subproperties).
        """
        if require_indexed and not self._indexed:
            raise InvalidPropertyError("Property is unindexed: {}".format(self._name))

        if rest:
            raise InvalidPropertyError(
                "Referencing subproperty {}.{} but {} is not a structured "
                "property".format(self._name, rest, self._name)
            )

    def _get_for_dict(self, entity):
        """Retrieve the value like ``_get_value()``.

        This is intended to be processed for ``_to_dict()``.

        Property subclasses can override this if they want the dictionary
        returned by ``entity._to_dict()`` to contain a different value. The
        main use case is allowing :class:`StructuredProperty` and
        :class:`LocalStructuredProperty` to allow the default ``_get_value()``
        behavior.

        * If you override ``_get_for_dict()`` to return a different type, you
          must override ``_validate()`` to accept values of that type and
          convert them back to the original type.

        * If you override ``_get_for_dict()``, you must handle repeated values
          and :data:`None` correctly. However, ``_validate()`` does not need to
          handle these.

        Args:
            entity (Model): An entity to get a value from.

        Returns:
            Any: The user value stored for the current property.
        """
        return self._get_value(entity)

    def _to_datastore(self, entity, data, prefix="", repeated=False):
        """Helper to convert property to Datastore serializable data.

        Called to help assemble a Datastore entity prior to serialization for
        storage. Subclasses (like StructuredProperty) may need to override the
        default behavior.

        Args:
            entity (entity.Entity): The NDB entity to convert.
            data (dict): The data that will eventually be used to construct the
                Datastore entity. This method works by updating ``data``.
            prefix (str): Optional name prefix used for StructuredProperty (if
                present, must end in ".".
            repeated (bool): `True` if values should be repeated because an
                ancestor node is repeated property.

        Return:
            Sequence[str]: Any keys that were set on ``data`` by this method
                call.
        """
        value = self._get_base_value_unwrapped_as_list(entity)
        if not self._repeated:
            value = value[0]

        key = prefix + self._name
        if repeated:
            data.setdefault(key, []).append(value)
        else:
            data[key] = value

        if not self._indexed:
            data["_exclude_from_indexes"].append(key)

        return (key,)

    def _from_datastore(self, ds_entity, value):
        """Helper to convert property value from Datastore serializable data.

        Called to modify the value of a property during deserialization from
        storage. Subclasses (like BlobProperty) may need to override the
        default behavior, which is simply to return the received value without
        modification.

        Args:
            ds_entity (~google.cloud.datastore.Entity): The Datastore entity to
                convert.
            value (_BaseValue): The stored value of this property for the
                entity being deserialized.

        Return:
            value [Any]: The transformed value.
        """
        return value


def _validate_key(value, entity=None):
    """Validate a key.

    Args:
        value (~google.cloud.ndb.key.Key): The key to be validated.
        entity (Optional[Model]): The entity that the key is being validated
            for.

    Returns:
        ~google.cloud.ndb.key.Key: The passed in ``value``.

    Raises:
        exceptions.BadValueError: If ``value`` is not a :class:`~google.cloud.ndb.key.Key`.
        KindError: If ``entity`` is specified, but the kind of the entity
            doesn't match the kind of ``value``.
    """
    if not isinstance(value, Key):
        raise exceptions.BadValueError("Expected Key, got {!r}".format(value))

    if entity and type(entity) not in (Model, Expando):
        if value.kind() != entity._get_kind():
            raise KindError(
                "Expected Key kind to be {}; received "
                "{}".format(entity._get_kind(), value.kind())
            )

    return value


class ModelKey(Property):
    """Special property to store a special "key" for a :class:`Model`.

    This is intended to be used as a pseudo-:class:`Property` on each
    :class:`Model` subclass. It is **not** intended for other usage in
    application code.

    It allows key-only queries to be done for a given kind.

    .. automethod:: _validate
    """

    def __init__(self):
        super(ModelKey, self).__init__()
        self._name = "__key__"

    def _comparison(self, op, value):
        """Internal helper for comparison operators.

        This uses the base implementation in :class:`Property`, but doesn't
        allow comparison to :data:`None`.

        Args:
            op (str): The comparison operator. One of ``=``, ``!=``, ``<``,
                ``<=``, ``>``, ``>=`` or ``in``.
            value (Any): The value to compare against.

        Returns:
            FilterNode: A FilterNode instance representing the requested
            comparison.

        Raises:
            exceptions.BadValueError: If ``value`` is :data:`None`.
        """
        if value is not None:
            return super(ModelKey, self)._comparison(op, value)

        raise exceptions.BadValueError("__key__ filter query can't be compared to None")

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~google.cloud.ndb.key.Key): The value to check.

        Returns:
            ~google.cloud.ndb.key.Key: The passed-in ``value``.
        """
        return _validate_key(value)

    @staticmethod
    def _set_value(entity, value):
        """Set the entity key on an entity.

        Args:
            entity (Model): An entity to set the entity key on.
            value (~google.cloud.ndb.key.Key): The key to be set on the entity.
        """
        if value is not None:
            value = _validate_key(value, entity=entity)
            value = entity._validate_key(value)

        entity._entity_key = value

    @staticmethod
    def _get_value(entity):
        """Get the entity key from an entity.

        Args:
            entity (Model): An entity to get the entity key from.

        Returns:
            ~google.cloud.ndb.key.Key: The entity key stored on ``entity``.
        """
        return entity._entity_key

    @staticmethod
    def _delete_value(entity):
        """Remove / disassociate the entity key from an entity.

        Args:
            entity (Model): An entity to remove the entity key from.
        """
        entity._entity_key = None


class BooleanProperty(Property):
    """A property that contains values of type bool.

    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (bool): The value to check.

        Returns:
            bool: The passed-in ``value``.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`bool`.
        """
        if not isinstance(value, bool):
            raise exceptions.BadValueError(
                "In field {}, expected bool, got {!r}".format(self._name, value)
            )
        return value

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (Union[int, bool]): The value to be converted.

        Returns:
            Optional[bool]: The converted value. If the current property is
            an ``int`` value, this will convert to a ``bool``.
        """
        # When loading a LocalStructuredProperty from a database written with the legacy
        # GAE NDB, the boolean properties will have int values.
        # See: Issue #623 (https://github.com/googleapis/python-ndb/issues/623)
        if type(value) is int:
            return bool(value)


class IntegerProperty(Property):
    """A property that contains values of type integer.

    .. note::

        If a value is a :class:`bool`, it will be coerced to ``0`` (for
        :data:`False`) or ``1`` (for :data:`True`).

    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (Union[int, bool]): The value to check.

        Returns:
            int: The passed-in ``value``.

        Raises:
            exceptions.BadValueError: If ``value`` is not an :class:`int` or convertible
                to one.
        """
        if not isinstance(value, int):
            raise exceptions.BadValueError(
                "In field {}, expected integer, got {!r}".format(self._name, value)
            )
        return int(value)


class FloatProperty(Property):
    """A property that contains values of type float.

    .. note::

        If a value is a :class:`bool` or :class:`int`, it will be
        coerced to a floating point value.

    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (Union[float, int, bool]): The value to check.

        Returns:
            float: The passed-in ``value``, possibly converted to a
            :class:`float`.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`float` or convertible
                to one.
        """
        if not isinstance(value, (float, int)):
            raise exceptions.BadValueError(
                "In field {}, expected float, got {!r}".format(self._name, value)
            )
        return float(value)


class _CompressedValue(bytes):
    """A marker object wrapping compressed values.

    Args:
        z_val (bytes): A return value of ``zlib.compress``.
    """

    def __init__(self, z_val):
        self.z_val = z_val

    def __repr__(self):
        return "_CompressedValue({!r})".format(self.z_val)

    def __eq__(self, other):
        """Compare two compressed values."""
        if not isinstance(other, _CompressedValue):
            return NotImplemented

        return self.z_val == other.z_val

    def __hash__(self):
        raise TypeError("_CompressedValue is not immutable")


class BlobProperty(Property):
    """A property that contains values that are byte strings.

    .. note::

        Unlike most property types, a :class:`BlobProperty` is **not**
        indexed by default.

    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    .. automethod:: _validate

    Args:
        name (str): The name of the property.
        compressed (bool): Indicates if the value should be compressed (via
            ``zlib``).
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (bytes): The default value for this property.
        choices (Iterable[bytes]): A container of allowed values for this
            property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.

    Raises:
        NotImplementedError: If the property is both compressed and indexed.
    """

    _indexed = False
    _compressed = False

    @utils.positional(2)
    def __init__(
        self,
        name=None,
        compressed=None,
        indexed=None,
        repeated=None,
        required=None,
        default=None,
        choices=None,
        validator=None,
        verbose_name=None,
        write_empty_list=None,
    ):
        super(BlobProperty, self).__init__(
            name=name,
            indexed=indexed,
            repeated=repeated,
            required=required,
            default=default,
            choices=choices,
            validator=validator,
            verbose_name=verbose_name,
            write_empty_list=write_empty_list,
        )
        if compressed is not None:
            self._compressed = compressed
        if self._compressed and self._indexed:
            raise NotImplementedError(
                "BlobProperty {} cannot be compressed and "
                "indexed at the same time.".format(self._name)
            )

    def _value_to_repr(self, value):
        """Turn the value into a user friendly representation.

        .. note::

            This will truncate the value based on the "visual" length, e.g.
            if it contains many ``\\xXX`` or ``\\uUUUU`` sequences, those
            will count against the length as more than one character.

        Args:
            value (Any): The value to convert to a pretty-print ``repr``.

        Returns:
            str: The ``repr`` of the "true" value.
        """
        long_repr = super(BlobProperty, self)._value_to_repr(value)
        if len(long_repr) > _MAX_STRING_LENGTH + 4:
            # Truncate, assuming the final character is the closing quote.
            long_repr = long_repr[:_MAX_STRING_LENGTH] + "..." + long_repr[-1]
        return long_repr

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (bytes): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`bytes`.
            exceptions.BadValueError: If the current property is indexed but the value
                exceeds the maximum length (1500 bytes).
        """
        if not isinstance(value, bytes):
            raise exceptions.BadValueError(
                "In field {}, expected bytes, got {!r}".format(self._name, value)
            )

        if self._indexed and len(value) > _MAX_STRING_LENGTH:
            raise exceptions.BadValueError(
                "Indexed value {} must be at most {:d} "
                "bytes".format(self._name, _MAX_STRING_LENGTH)
            )

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (bytes): The value to be converted.

        Returns:
            Optional[bytes]: The converted value. If the current property is
            compressed, this will return a wrapped version of the compressed
            value. Otherwise, it will return :data:`None` to indicate that
            the value didn't need to be converted.
        """
        if self._compressed:
            return _CompressedValue(zlib.compress(value))

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (bytes): The value to be converted.

        Returns:
            Optional[bytes]: The converted value. If the current property is
            a (wrapped) compressed value, this will unwrap the value and return
            the decompressed form. Otherwise, it will return :data:`None` to
            indicate that the value didn't need to be unwrapped and
            decompressed.
        """
        # First, check for legacy compressed LocalStructuredProperty values.
        # See https://github.com/googleapis/python-ndb/issues/359
        if self._compressed and isinstance(value, ds_entity_module.Entity):
            return

        if self._compressed and not isinstance(value, _CompressedValue):
            if not value.startswith(_ZLIB_COMPRESSION_MARKERS):
                return value
            value = _CompressedValue(value)

        if isinstance(value, _CompressedValue):
            return zlib.decompress(value.z_val)

    def _to_datastore(self, entity, data, prefix="", repeated=False):
        """Override of :method:`Property._to_datastore`.

        If this is a compressed property, we need to set the backwards-
        compatible `_meanings` field, so that it can be properly read later.
        """
        keys = super(BlobProperty, self)._to_datastore(
            entity, data, prefix=prefix, repeated=repeated
        )
        if self._compressed:
            key = prefix + self._name
            value = data[key]
            if isinstance(value, _CompressedValue):
                value = value.z_val
                data[key] = value

            if self._repeated:
                compressed_value = []
                for rval in value:
                    if rval and not rval.startswith(_ZLIB_COMPRESSION_MARKERS):
                        rval = zlib.compress(rval)
                    compressed_value.append(rval)
                value = compressed_value
                data[key] = value
            if not self._repeated:
                values = [
                    zlib.compress(v)
                    if v and not v.startswith(_ZLIB_COMPRESSION_MARKERS)
                    else v
                    for v in (value if repeated else [value])
                ]
                value = values if repeated else values[0]
                data[key] = value

            if value and not repeated:
                data.setdefault("_meanings", {})[key] = (
                    _MEANING_COMPRESSED,
                    value,
                )
        return keys

    def _from_datastore(self, ds_entity, value):
        """Override of :method:`Property._from_datastore`.

        Need to check the ds_entity for a compressed meaning that would
        indicate we are getting a compressed value.
        """
        if self._name in ds_entity._meanings and not self._compressed:
            root_meaning = ds_entity._meanings[self._name][0]
            sub_meanings = None
            # meaning may be a tuple. Attempt unwrap
            if isinstance(root_meaning, tuple):
                root_meaning, sub_meanings = root_meaning
            # decompress values if needed
            if root_meaning == _MEANING_COMPRESSED and not self._repeated:
                value.b_val = zlib.decompress(value.b_val)
            elif root_meaning == _MEANING_COMPRESSED and self._repeated:
                for sub_value in value:
                    sub_value.b_val = zlib.decompress(sub_value.b_val)
            elif isinstance(sub_meanings, list) and self._repeated:
                for idx, sub_value in enumerate(value):
                    try:
                        if sub_meanings[idx] == _MEANING_COMPRESSED:
                            sub_value.b_val = zlib.decompress(sub_value.b_val)
                    except IndexError:
                        # value list size exceeds sub_meanings list
                        break
        return value

    def _db_set_compressed_meaning(self, p):
        """Helper for :meth:`_db_set_value`.

        Raises:
            NotImplementedError: Always. No longer implemented.
        """
        raise exceptions.NoLongerImplementedError()

    def _db_set_uncompressed_meaning(self, p):
        """Helper for :meth:`_db_set_value`.

        Raises:
            NotImplementedError: Always. No longer implemented.
        """
        raise exceptions.NoLongerImplementedError()


class CompressedTextProperty(BlobProperty):
    """A version of :class:`TextProperty` which compresses values.

    Values are stored as ``zlib`` compressed UTF-8 byte sequences rather than
    as strings as in a regular :class:`TextProperty`. This class allows NDB to
    support passing `compressed=True` to :class:`TextProperty`. It is not
    necessary to instantiate this class directly.
    """

    __slots__ = ()

    def __init__(self, *args, **kwargs):
        indexed = kwargs.pop("indexed", False)
        if indexed:
            raise NotImplementedError(
                "A TextProperty cannot be indexed. Previously this was "
                "allowed, but this usage is no longer supported."
            )

        kwargs["compressed"] = True
        super(CompressedTextProperty, self).__init__(*args, **kwargs)

    def _constructor_info(self):
        """Helper for :meth:`__repr__`.

        Yields:
            Tuple[str, bool]: Pairs of argument name and a boolean indicating
            if that argument is a keyword.
        """
        parent_init = super(CompressedTextProperty, self).__init__
        # inspect.signature not available in Python 2.7, so we use positional
        # decorator combined with argspec instead.
        argspec = getattr(parent_init, "_argspec", _getfullargspec(parent_init))
        positional = getattr(parent_init, "_positional_args", 1)
        for index, name in enumerate(argspec.args):
            if name in ("self", "indexed", "compressed"):
                continue
            yield name, index >= positional

    @property
    def _indexed(self):
        """bool: Indicates that the property is not indexed."""
        return False

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (Union[bytes, str]): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is :class:`bytes`, but is not a valid
                UTF-8 encoded string.
            exceptions.BadValueError: If ``value`` is neither :class:`bytes` nor
                :class:`str`.
            exceptions.BadValueError: If the current property is indexed but the UTF-8
                encoded value exceeds the maximum length (1500 bytes).
        """
        if not isinstance(value, str):
            # In Python 2.7, bytes is a synonym for str
            if isinstance(value, bytes):
                try:
                    value = value.decode("utf-8")
                except UnicodeError:
                    raise exceptions.BadValueError(
                        "In field {}, expected valid UTF-8, got {!r}".format(
                            self._name, value
                        )
                    )
            else:
                raise exceptions.BadValueError(
                    "In field {}, expected string, got {!r}".format(self._name, value)
                )

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (Union[bytes, str]): The value to be converted.

        Returns:
            Optional[bytes]: The converted value. If ``value`` is a
            :class:`str`, this will return the UTF-8 encoded bytes for it.
            Otherwise, it will return :data:`None`.
        """
        if isinstance(value, str):
            return value.encode("utf-8")

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        .. note::

            Older versions of ``ndb`` could write non-UTF-8 ``TEXT``
            properties. This means that if ``value`` is :class:`bytes`, but is
            not a valid UTF-8 encoded string, it can't (necessarily) be
            rejected. But, :meth:`_validate` now rejects such values, so it's
            not possible to write new non-UTF-8 ``TEXT`` properties.

        Args:
            value (Union[bytes, str]): The value to be converted.

        Returns:
            Optional[str]: The converted value. If ``value`` is a valid UTF-8
                encoded :class:`bytes` string, this will return the decoded
                :class:`str` corresponding to it. Otherwise, it will return
                :data:`None`.
        """
        if isinstance(value, bytes):
            try:
                return value.decode("utf-8")
            except UnicodeError:
                pass

    def _db_set_uncompressed_meaning(self, p):
        """Helper for :meth:`_db_set_value`.

        Raises:
            NotImplementedError: Always. This method is virtual.
        """
        raise NotImplementedError


class TextProperty(Property):
    """An unindexed property that contains UTF-8 encoded text values.

    A :class:`TextProperty` is intended for values of unlimited length, hence
    is **not** indexed. Previously, a :class:`TextProperty` could be indexed
    via:

    .. code-block:: python

        class Item(ndb.Model):
            description = ndb.TextProperty(indexed=True)
            ...

    but this usage is no longer supported. If indexed text is desired, a
    :class:`StringProperty` should be used instead.

    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    .. automethod:: _validate

    Args:
        name (str): The name of the property.
        compressed (bool): Indicates if the value should be compressed (via
            ``zlib``). An instance of :class:`CompressedTextProperty` will be
            substituted if `True`.
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (Any): The default value for this property.
        choices (Iterable[Any]): A container of allowed values for this
            property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.

    Raises:
        NotImplementedError: If ``indexed=True`` is provided.
    """

    def __new__(cls, *args, **kwargs):
        # If "compressed" is True, substitute CompressedTextProperty
        compressed = kwargs.get("compressed", False)
        if compressed:
            return CompressedTextProperty(*args, **kwargs)

        return super(TextProperty, cls).__new__(cls)

    def __init__(self, *args, **kwargs):
        indexed = kwargs.pop("indexed", False)
        if indexed:
            raise NotImplementedError(
                "A TextProperty cannot be indexed. Previously this was "
                "allowed, but this usage is no longer supported."
            )

        super(TextProperty, self).__init__(*args, **kwargs)

    def _constructor_info(self):
        """Helper for :meth:`__repr__`.

        Yields:
            Tuple[str, bool]: Pairs of argument name and a boolean indicating
            if that argument is a keyword.
        """
        parent_init = super(TextProperty, self).__init__
        # inspect.signature not available in Python 2.7, so we use positional
        # decorator combined with argspec instead.
        argspec = getattr(parent_init, "_argspec", _getfullargspec(parent_init))
        positional = getattr(parent_init, "_positional_args", 1)
        for index, name in enumerate(argspec.args):
            if name == "self" or name == "indexed":
                continue
            yield name, index >= positional

    @property
    def _indexed(self):
        """bool: Indicates that the property is not indexed."""
        return False

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (Union[bytes, str]): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is :class:`bytes`, but is not a valid
                UTF-8 encoded string.
            exceptions.BadValueError: If ``value`` is neither :class:`bytes` nor
                :class:`str`.
            exceptions.BadValueError: If the current property is indexed but the UTF-8
                encoded value exceeds the maximum length (1500 bytes).
        """
        if isinstance(value, bytes):
            try:
                encoded_length = len(value)
                value = value.decode("utf-8")
            except UnicodeError:
                raise exceptions.BadValueError(
                    "In field {}, expected valid UTF-8, got {!r}".format(
                        self._name, value
                    )
                )
        elif isinstance(value, str):
            encoded_length = len(value.encode("utf-8"))
        else:
            raise exceptions.BadValueError("Expected string, got {!r}".format(value))

        if self._indexed and encoded_length > _MAX_STRING_LENGTH:
            raise exceptions.BadValueError(
                "Indexed value {} must be at most {:d} "
                "bytes".format(self._name, _MAX_STRING_LENGTH)
            )

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (Union[bytes, str]): The value to be converted.

        Returns:
            Optional[str]: The converted value. If ``value`` is a
            :class:`bytes`, this will return the UTF-8 decoded ``str`` for it.
            Otherwise, it will return :data:`None`.
        """
        if isinstance(value, bytes):
            return value.decode("utf-8")

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        .. note::

            Older versions of ``ndb`` could write non-UTF-8 ``TEXT``
            properties. This means that if ``value`` is :class:`bytes`, but is
            not a valid UTF-8 encoded string, it can't (necessarily) be
            rejected. But, :meth:`_validate` now rejects such values, so it's
            not possible to write new non-UTF-8 ``TEXT`` properties.

        Args:
            value (Union[bytes, str]): The value to be converted.

        Returns:
            Optional[str]: The converted value. If ``value`` is a a valid UTF-8
            encoded :class:`bytes` string, this will return the decoded
            :class:`str` corresponding to it. Otherwise, it will return
            :data:`None`.
        """
        if isinstance(value, bytes):
            try:
                return value.decode("utf-8")
            except UnicodeError:
                pass

    def _db_set_uncompressed_meaning(self, p):
        """Helper for :meth:`_db_set_value`.

        Raises:
            NotImplementedError: Always. No longer implemented.
        """
        raise exceptions.NoLongerImplementedError()


class StringProperty(TextProperty):
    """An indexed property that contains UTF-8 encoded text values.

    This is nearly identical to :class:`TextProperty`, but is indexed. Values
    must be at most 1500 bytes (when UTF-8 encoded from :class:`str` to bytes).

    Raises:
        NotImplementedError: If ``indexed=False`` is provided.
    """

    def __init__(self, *args, **kwargs):
        indexed = kwargs.pop("indexed", True)
        if not indexed:
            raise NotImplementedError(
                "A StringProperty must be indexed. Previously setting "
                "``indexed=False`` was allowed, but this usage is no longer "
                "supported."
            )

        super(StringProperty, self).__init__(*args, **kwargs)

    @property
    def _indexed(self):
        """bool: Indicates that the property is indexed."""
        return True


class GeoPtProperty(Property):
    """A property that contains :attr:`.GeoPt` values.

    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~google.cloud.datastore.helpers.GeoPoint): The value to
                check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :attr:`.GeoPt`.
        """
        if not isinstance(value, GeoPt):
            raise exceptions.BadValueError(
                "In field {}, expected GeoPt, got {!r}".format(self._name, value)
            )


class PickleProperty(BlobProperty):
    """A property that contains values that are pickle-able.

    .. note::

        Unlike most property types, a :class:`PickleProperty` is **not**
        indexed by default.

    This will use :func:`pickle.dumps` with the highest available pickle
    protocol to convert to bytes and :func:`pickle.loads` to convert **from**
    bytes. The base value stored in the datastore will be the pickled bytes.

    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    """

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (Any): The value to be converted.

        Returns:
            bytes: The pickled ``value``.
        """
        return pickle.dumps(value, pickle.HIGHEST_PROTOCOL)

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (bytes): The value to be converted.

        Returns:
            Any: The unpickled ``value``.
        """
        if type(value) is bytes:  # pragma: NO BRANCH
            return pickle.loads(value, encoding="bytes")
        return pickle.loads(value)  # pragma: NO COVER


class JsonProperty(BlobProperty):
    """A property that contains JSON-encodable values.

    .. note::

        Unlike most property types, a :class:`JsonProperty` is **not**
        indexed by default.

    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    .. automethod:: _validate

    Args:
        name (str): The name of the property.
        compressed (bool): Indicates if the value should be compressed (via
            ``zlib``).
        json_type (type): The expected type of values that this property can
            hold. If :data:`None`, any type is allowed.
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (Any): The default value for this property.
        choices (Iterable[Any]): A container of allowed values for this
            property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.
    """

    _json_type = None

    @utils.positional(2)
    def __init__(
        self,
        name=None,
        compressed=None,
        json_type=None,
        indexed=None,
        repeated=None,
        required=None,
        default=None,
        choices=None,
        validator=None,
        verbose_name=None,
        write_empty_list=None,
    ):
        super(JsonProperty, self).__init__(
            name=name,
            compressed=compressed,
            indexed=indexed,
            repeated=repeated,
            required=required,
            default=default,
            choices=choices,
            validator=validator,
            verbose_name=verbose_name,
            write_empty_list=write_empty_list,
        )
        if json_type is not None:
            self._json_type = json_type

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (Any): The value to check.

        Raises:
            TypeError: If the current property has a JSON type set and
                ``value`` is not an instance of that type.
        """
        if self._json_type is None:
            return
        if not isinstance(value, self._json_type):
            raise TypeError("JSON property must be a {}".format(self._json_type))

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (Any): The value to be converted.

        Returns:
            bytes: The ``value``, JSON encoded as an ASCII byte string.
        """
        as_str = json.dumps(value, separators=(",", ":"), ensure_ascii=True)
        return as_str.encode("ascii")

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (Union[bytes, str]): The value to be converted.

        Returns:
            Any: The ``value`` (ASCII bytes or string) loaded as JSON.
        """
        # We write and retrieve `bytes` normally, but for some reason get back
        # `str` from a projection query.
        if not isinstance(value, str):
            value = value.decode("ascii")
        return json.loads(value)


@functools.total_ordering
class User(object):
    """Provides the email address, nickname, and ID for a Google Accounts user.

    .. note::

        This class is a port of ``google.appengine.api.users.User``.
        In the (legacy) Google App Engine standard environment, this
        constructor relied on several environment variables to provide a
        fallback for inputs. In particular:

        * ``AUTH_DOMAIN`` for the ``_auth_domain`` argument
        * ``USER_EMAIL`` for the ``email`` argument
        * ``USER_ID`` for the ``_user_id`` argument
        * ``FEDERATED_IDENTITY`` for the (now removed) ``federated_identity``
          argument
        * ``FEDERATED_PROVIDER`` for the (now removed) ``federated_provider``
          argument

        However in the gVisor Google App Engine runtime (e.g. Python 3.7),
        none of these environment variables will be populated.

    .. note::

        Previous versions of the Google Cloud Datastore API had an explicit
        ``UserValue`` field. However, the ``google.datastore.v1`` API returns
        previously stored user values as an ``Entity`` with the meaning set to
        ``ENTITY_USER=20``.

    .. warning::

        The ``federated_identity`` and ``federated_provider`` are
        decommissioned and have been removed from the constructor. Additionally
        ``_strict_mode`` has been removed from the constructor and the
        ``federated_identity()`` and ``federated_provider()`` methods have been
        removed from this class.

    Args:
        email (str): The user's email address.
        _auth_domain (str): The auth domain for the current application.
        _user_id (str): The user ID.

    Raises:
        ValueError: If the ``_auth_domain`` is not passed in.
        UserNotFoundError: If ``email`` is empty.
    """

    def __init__(self, email=None, _auth_domain=None, _user_id=None):
        if _auth_domain is None:
            raise ValueError("_auth_domain is required")

        if not email:
            raise UserNotFoundError

        self._auth_domain = _auth_domain
        self._email = email
        self._user_id = _user_id

    def nickname(self):
        """The nickname for this user.

        A nickname is a human-readable string that uniquely identifies a Google
        user with respect to this application, akin to a username. For some
        users, this nickname is an email address or part of the email address.

        Returns:
            str: The nickname of the user.
        """
        if (
            self._email
            and self._auth_domain
            and self._email.endswith("@" + self._auth_domain)
        ):
            suffix_len = len(self._auth_domain) + 1
            return self._email[:-suffix_len]
        else:
            return self._email

    def email(self):
        """Returns the user's email address."""
        return self._email

    def user_id(self):
        """Obtains the user ID of the user.

        Returns:
            Optional[str]: A permanent unique identifying string or
            :data:`None`. If the email address was set explicitly, this will
            return :data:`None`.
        """
        return self._user_id

    def auth_domain(self):
        """Obtains the user's authentication domain.

        Returns:
            str: The authentication domain. This method is internal and
            should not be used by client applications.
        """
        return self._auth_domain

    @classmethod
    def _from_ds_entity(cls, user_entity):
        """Convert the user value to a datastore entity.

        Args:
            user_entity (~google.cloud.datastore.entity.Entity): A user value
                datastore entity.
        """
        kwargs = {
            "email": user_entity["email"],
            "_auth_domain": user_entity["auth_domain"],
        }
        if "user_id" in user_entity:
            kwargs["_user_id"] = user_entity["user_id"]
        return cls(**kwargs)

    def __str__(self):
        return str(self.nickname())

    def __repr__(self):
        values = ["email={!r}".format(self._email)]
        if self._user_id:
            values.append("_user_id={!r}".format(self._user_id))
        return "users.User({})".format(", ".join(values))

    def __hash__(self):
        return hash((self._email, self._auth_domain))

    def __eq__(self, other):
        if not isinstance(other, User):
            return NotImplemented

        return self._email == other._email and self._auth_domain == other._auth_domain

    def __lt__(self, other):
        if not isinstance(other, User):
            return NotImplemented

        return (self._email, self._auth_domain) < (
            other._email,
            other._auth_domain,
        )


class UserProperty(Property):
    """A property that contains :class:`.User` values.

    .. warning::

        This exists for backwards compatibility with existing Cloud Datastore
        schemas only; storing :class:`.User` objects directly in Cloud
        Datastore is not recommended.

    .. warning::

        The ``auto_current_user`` and ``auto_current_user_add`` arguments are
        no longer supported.

    .. note::

        On Google App Engine standard, after saving a :class:`User` the user ID
        would automatically be populated by the datastore, even if it wasn't
        set in the :class:`User` value being stored. For example:

        .. code-block:: python

            >>> class Simple(ndb.Model):
            ...     u = ndb.UserProperty()
            ...
            >>> entity = Simple(u=users.User("user@example.com"))
            >>> entity.u.user_id() is None
            True
            >>>
            >>> entity.put()
            >>> # Reload without the cached values
            >>> entity = entity.key.get(use_cache=False,
            ...     use_global_cache=False)
            >>> entity.u.user_id()
            '...9174...'

        However in the gVisor Google App Engine runtime (e.g. Python 3.7),
        this will behave differently. The user ID will only be stored if it
        is manually set in the :class:`User` instance, either by the running
        application or by retrieving a stored :class:`User` that already has
        a user ID set.

    .. automethod:: _validate
    .. automethod:: _prepare_for_put

    Args:
        name (str): The name of the property.
        auto_current_user (bool): Deprecated flag. When supported, if this flag
            was set to :data:`True`, the property value would be set to the
            currently signed-in user whenever the model instance is stored in
            the datastore, overwriting the property's previous value.
            This was useful for tracking which user modifies a model instance.
        auto_current_user_add (bool): Deprecated flag. When supported, if this
            flag was set to :data:`True`, the property value would be set to
            the currently signed-in user he first time the model instance is
            stored in the datastore, unless the property has already been
            assigned a value. This was useful for tracking which user creates
            a model instance, which may not be the same user that modifies it
            later.
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (bytes): The default value for this property.
        choices (Iterable[bytes]): A container of allowed values for this
            property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.

    Raises:
        NotImplementedError: If ``auto_current_user`` is provided.
        NotImplementedError: If ``auto_current_user_add`` is provided.
    """

    _auto_current_user = False
    _auto_current_user_add = False

    @utils.positional(2)
    def __init__(
        self,
        name=None,
        auto_current_user=None,
        auto_current_user_add=None,
        indexed=None,
        repeated=None,
        required=None,
        default=None,
        choices=None,
        validator=None,
        verbose_name=None,
        write_empty_list=None,
    ):
        super(UserProperty, self).__init__(
            name=name,
            indexed=indexed,
            repeated=repeated,
            required=required,
            default=default,
            choices=choices,
            validator=validator,
            verbose_name=verbose_name,
            write_empty_list=write_empty_list,
        )
        if auto_current_user is not None:
            raise exceptions.NoLongerImplementedError()

        if auto_current_user_add is not None:
            raise exceptions.NoLongerImplementedError()

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (User): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`User`.
        """
        # Might be GAE User or our own version
        if type(value).__name__ != "User":
            raise exceptions.BadValueError(
                "In field {}, expected User, got {!r}".format(self._name, value)
            )

    def _prepare_for_put(self, entity):
        """Pre-put hook

        This is a no-op. In previous versions of ``ndb``, this method
        populated the value based on ``auto_current_user`` or
        ``auto_current_user_add``, but these flags have been disabled.

        Args:
            entity (Model): An entity with values.
        """

    def _to_base_type(self, value):
        """Convert the user value to a datastore entity.

        Arguments:
            value (User): The user value.

        Returns:
            ~google.cloud.datastore.entity.Entity: The datastore entity.
        """
        user_entity = ds_entity_module.Entity()

        # Set required fields.
        user_entity["email"] = str(value.email())
        user_entity.exclude_from_indexes.add("email")
        user_entity["auth_domain"] = str(value.auth_domain())
        user_entity.exclude_from_indexes.add("auth_domain")
        # Set optional field.
        user_id = value.user_id()
        if user_id:
            user_entity["user_id"] = str(user_id)
            user_entity.exclude_from_indexes.add("user_id")

        return user_entity

    def _from_base_type(self, ds_entity):
        """Convert the user value from a datastore entity.

        Arguments:
            ds_entity (~google.cloud.datastore.entity.Entity): The datastore
                entity.

        Returns:
            User: The converted entity.
        """
        return User._from_ds_entity(ds_entity)

    def _to_datastore(self, entity, data, prefix="", repeated=False):
        """Override of :method:`Property._to_datastore`.

        We just need to set the meaning to indicate value is a User.
        """
        keys = super(UserProperty, self)._to_datastore(
            entity, data, prefix=prefix, repeated=repeated
        )

        for key in keys:
            value = data.get(key)
            if value:
                data.setdefault("_meanings", {})[key] = (
                    _MEANING_PREDEFINED_ENTITY_USER,
                    value,
                )


class KeyProperty(Property):
    """A property that contains :class:`~google.cloud.ndb.key.Key` values.

    The constructor for :class:`KeyProperty` allows at most two positional
    arguments. Any usage of :data:`None` as a positional argument will
    be ignored. Any of the following signatures are allowed:

    .. testsetup:: key-property-constructor

        from google.cloud import ndb


        class SimpleModel(ndb.Model):
            pass

    .. doctest:: key-property-constructor

        >>> name = "my_value"
        >>> ndb.KeyProperty(name)
        KeyProperty('my_value')
        >>> ndb.KeyProperty(SimpleModel)
        KeyProperty(kind='SimpleModel')
        >>> ndb.KeyProperty(name, SimpleModel)
        KeyProperty('my_value', kind='SimpleModel')
        >>> ndb.KeyProperty(SimpleModel, name)
        KeyProperty('my_value', kind='SimpleModel')

    The type of the positional arguments will be used to determine their
    purpose: a string argument is assumed to be the ``name`` and a
    :class:`type` argument is assumed to be the ``kind`` (and checked that
    the type is a subclass of :class:`Model`).

    .. automethod:: _validate

    Args:
        name (str): The name of the property.
        kind (Union[type, str]): The (optional) kind to be stored. If provided
            as a positional argument, this must be a subclass of :class:`Model`
            otherwise the kind name is sufficient.
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (~google.cloud.ndb.key.Key): The default value for this property.
        choices (Iterable[~google.cloud.ndb.key.Key]): A container of allowed values for this
            property.
        validator (Callable[[~google.cloud.ndb.model.Property, ~google.cloud.ndb.key.Key], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.
    """

    _kind = None

    def _handle_positional(wrapped):
        @functools.wraps(wrapped)
        def wrapper(self, *args, **kwargs):
            for arg in args:
                if isinstance(arg, str):
                    if "name" in kwargs:
                        raise TypeError("You can only specify name once")

                    kwargs["name"] = arg

                elif isinstance(arg, type):
                    if "kind" in kwargs:
                        raise TypeError("You can only specify kind once")

                    kwargs["kind"] = arg

                elif arg is not None:
                    raise TypeError("Unexpected positional argument: {!r}".format(arg))

            return wrapped(self, **kwargs)

        wrapper._wrapped = wrapped
        return wrapper

    @utils.positional(3)
    @_handle_positional
    def __init__(
        self,
        name=None,
        kind=None,
        indexed=None,
        repeated=None,
        required=None,
        default=None,
        choices=None,
        validator=None,
        verbose_name=None,
        write_empty_list=None,
    ):
        if isinstance(kind, type) and issubclass(kind, Model):
            kind = kind._get_kind()

        else:
            if kind is not None and not isinstance(kind, str):
                raise TypeError("Kind must be a Model class or a string")

        super(KeyProperty, self).__init__(
            name=name,
            indexed=indexed,
            repeated=repeated,
            required=required,
            default=default,
            choices=choices,
            validator=validator,
            verbose_name=verbose_name,
            write_empty_list=write_empty_list,
        )
        if kind is not None:
            self._kind = kind

    def _constructor_info(self):
        """Helper for :meth:`__repr__`.

        Yields:
            Tuple[str, bool]: Pairs of argument name and a boolean indicating
            if that argument is a keyword.
        """
        yield "name", False
        yield "kind", True
        from_inspect = super(KeyProperty, self)._constructor_info()
        for name, is_keyword in from_inspect:
            if name in ("args", "name", "kind"):
                continue
            yield name, is_keyword

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~google.cloud.ndb.key.Key): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`.Key`.
            exceptions.BadValueError: If ``value`` is a partial :class:`.Key` (i.e. it
                has no name or ID set).
            exceptions.BadValueError: If the current property has an associated ``kind``
                and ``value`` does not match that kind.
        """
        if not isinstance(value, Key):
            raise exceptions.BadValueError(
                "In field {}, expected Key, got {!r}".format(self._name, value)
            )

        # Reject incomplete keys.
        if not value.id():
            raise exceptions.BadValueError(
                "In field {}, expected complete Key, got {!r}".format(self._name, value)
            )

        # Verify kind if provided.
        if self._kind is not None:
            if value.kind() != self._kind:
                raise exceptions.BadValueError(
                    "In field {}, expected Key with kind={!r}, got "
                    "{!r}".format(self._name, self._kind, value)
                )

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (~key.Key): The value to be converted.

        Returns:
            google.cloud.datastore.Key: The converted value.

        Raises:
            TypeError: If ``value`` is not a :class:`~key.Key`.
        """
        if not isinstance(value, key_module.Key):
            raise TypeError(
                "Cannot convert to datastore key, expected Key value; "
                "received {}".format(value)
            )
        return value._key

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (google.cloud.datastore.Key): The value to be converted.

        Returns:
            key.Key: The converted value.
        """
        return key_module.Key._from_ds_key(value)


class BlobKeyProperty(Property):
    """A property containing :class:`~google.cloud.ndb.model.BlobKey` values.

    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~google.cloud.ndb.model.BlobKey): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a
                :class:`~google.cloud.ndb.model.BlobKey`.
        """
        if not isinstance(value, BlobKey):
            raise exceptions.BadValueError(
                "In field {}, expected BlobKey, got {!r}".format(self._name, value)
            )


class DateTimeProperty(Property):
    """A property that contains :class:`~datetime.datetime` values.

    If ``tzinfo`` is not set, this property expects "naive" datetime stamps,
    i.e. no timezone can be set. Furthermore, the assumption is that naive
    datetime stamps represent UTC.

    If ``tzinfo`` is set, timestamps will be stored as UTC and converted back
    to the timezone set by ``tzinfo`` when reading values back out.

    .. note::

        Unlike Django, ``auto_now_add`` can be overridden by setting the
        value before writing the entity. And unlike the legacy
        ``google.appengine.ext.db``, ``auto_now`` does not supply a default
        value. Also unlike legacy ``db``, when the entity is written, the
        property values are updated to match what was written. Finally, beware
        that this also updates the value in the in-process cache, **and** that
        ``auto_now_add`` may interact weirdly with transaction retries (a retry
        of a property with ``auto_now_add`` set will reuse the value that was
        set on the first try).

    .. automethod:: _validate
    .. automethod:: _prepare_for_put

    Args:
        name (str): The name of the property.
        auto_now (bool): Indicates that the property should be set to the
            current datetime when an entity is created and whenever it is
            updated.
        auto_now_add (bool): Indicates that the property should be set to the
            current datetime when an entity is created.
        tzinfo (Optional[datetime.tzinfo]): If set, values read from Datastore
            will be converted to this timezone. Otherwise, values will be
            returned as naive datetime objects with an implied UTC timezone.
        indexed (bool): Indicates if the value should be indexed.
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (~datetime.datetime): The default value for this property.
        choices (Iterable[~datetime.datetime]): A container of allowed values
            for this property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.

    Raises:
        ValueError: If ``repeated=True`` and ``auto_now=True``.
        ValueError: If ``repeated=True`` and ``auto_now_add=True``.
    """

    _auto_now = False
    _auto_now_add = False
    _tzinfo = None

    @utils.positional(2)
    def __init__(
        self,
        name=None,
        auto_now=None,
        auto_now_add=None,
        tzinfo=None,
        indexed=None,
        repeated=None,
        required=None,
        default=None,
        choices=None,
        validator=None,
        verbose_name=None,
        write_empty_list=None,
    ):
        super(DateTimeProperty, self).__init__(
            name=name,
            indexed=indexed,
            repeated=repeated,
            required=required,
            default=default,
            choices=choices,
            validator=validator,
            verbose_name=verbose_name,
            write_empty_list=write_empty_list,
        )
        if self._repeated:
            if auto_now:
                raise ValueError(
                    "DateTimeProperty {} could use auto_now and be "
                    "repeated, but there would be no point.".format(self._name)
                )
            elif auto_now_add:
                raise ValueError(
                    "DateTimeProperty {} could use auto_now_add and be "
                    "repeated, but there would be no point.".format(self._name)
                )
        if auto_now is not None:
            self._auto_now = auto_now
        if auto_now_add is not None:
            self._auto_now_add = auto_now_add
        if tzinfo is not None:
            self._tzinfo = tzinfo

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~datetime.datetime): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`~datetime.datetime`.
        """
        if not isinstance(value, datetime.datetime):
            raise exceptions.BadValueError(
                "In field {}, expected datetime, got {!r}".format(self._name, value)
            )

        if self._tzinfo is None and value.tzinfo is not None:
            raise exceptions.BadValueError(
                "DatetimeProperty without tzinfo {} can only support naive "
                "datetimes (presumed UTC). Please set tzinfo to support "
                "alternate timezones.".format(self._name)
            )

    @staticmethod
    def _now():
        """datetime.datetime: Return current datetime.

        Subclasses will override this to return different forms of "now".
        """
        return datetime.datetime.utcnow()

    def _prepare_for_put(self, entity):
        """Sets the current timestamp when "auto" is set.

        If one of the following scenarios occur

        * ``auto_now=True``
        * ``auto_now_add=True`` and the ``entity`` doesn't have a value set

        then this hook will run before the ``entity`` is ``put()`` into
        the datastore.

        Args:
            entity (Model): An entity with values.
        """
        if self._auto_now or (self._auto_now_add and not self._has_value(entity)):
            value = self._now()
            self._store_value(entity, value)

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (Union[int, datetime.datetime]): The value to be converted.
                The value will be `int` for entities retrieved by a projection
                query and is a timestamp as the number of nanoseconds since the
                epoch.

        Returns:
            Optional[datetime.datetime]: If ``tzinfo`` is set on this property,
                the value converted to the timezone in ``tzinfo``. Otherwise
                returns the value without ``tzinfo`` or ``None`` if value did
                not have ``tzinfo`` set.
        """
        if isinstance(value, int):
            # Projection query, value is integer nanoseconds
            seconds = value / 1e6
            value = datetime.datetime.fromtimestamp(seconds, pytz.utc)

        if self._tzinfo is not None:
            if value.tzinfo is None:
                value = value.replace(tzinfo=pytz.utc)
            return value.astimezone(self._tzinfo)

        elif value.tzinfo is not None:
            return value.replace(tzinfo=None)

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (datetime.datetime): The value to be converted.

        Returns:
            Optional[datetime.datetime]: The converted value.

        Raises:
            TypeError: If ``value`` is not a :class:`~key.Key`.
        """
        if self._tzinfo is not None and value.tzinfo is not None:
            return value.astimezone(pytz.utc)


class DateProperty(DateTimeProperty):
    """A property that contains :class:`~datetime.date` values.

    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~datetime.date): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`~datetime.date`.
        """
        if not isinstance(value, datetime.date):
            raise exceptions.BadValueError(
                "In field {}, expected date, got {!r}".format(self._name, value)
            )

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (~datetime.date): The value to be converted.

        Returns:
            ~datetime.datetime: The converted value: a datetime object with the
            time set to ``00:00``.

        Raises:
            TypeError: If ``value`` is not a :class:`~datetime.date`.
        """
        if not isinstance(value, datetime.date):
            raise TypeError(
                "Cannot convert to datetime expected date value; "
                "received {}".format(value)
            )
        return datetime.datetime(value.year, value.month, value.day)

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (~datetime.datetime): The value to be converted.

        Returns:
            ~datetime.date: The converted value: the date that ``value``
            occurs on.
        """
        return value.date()

    @staticmethod
    def _now():
        """datetime.datetime: Return current date."""
        return datetime.datetime.utcnow().date()


class TimeProperty(DateTimeProperty):
    """A property that contains :class:`~datetime.time` values.

    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    .. automethod:: _validate
    """

    def _validate(self, value):
        """Validate a ``value`` before setting it.

        Args:
            value (~datetime.time): The value to check.

        Raises:
            exceptions.BadValueError: If ``value`` is not a :class:`~datetime.time`.
        """
        if not isinstance(value, datetime.time):
            raise exceptions.BadValueError(
                "In field {}, expected time, got {!r}".format(self._name, value)
            )

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value (~datetime.time): The value to be converted.

        Returns:
            ~datetime.datetime: The converted value: a datetime object with the
            date set to ``1970-01-01``.

        Raises:
            TypeError: If ``value`` is not a :class:`~datetime.time`.
        """
        if not isinstance(value, datetime.time):
            raise TypeError(
                "Cannot convert to datetime expected time value; "
                "received {}".format(value)
            )
        return datetime.datetime(
            1970,
            1,
            1,
            value.hour,
            value.minute,
            value.second,
            value.microsecond,
        )

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.

        Args:
            value (~datetime.datetime): The value to be converted.

        Returns:
            ~datetime.time: The converted value: the time that ``value``
            occurs at.
        """
        return value.time()

    @staticmethod
    def _now():
        """datetime.datetime: Return current time."""
        return datetime.datetime.utcnow().time()


class StructuredProperty(Property):
    """A Property whose value is itself an entity.

    The values of the sub-entity are indexed and can be queried.
    """

    _model_class = None
    _kwargs = None

    def __init__(self, model_class, name=None, **kwargs):
        super(StructuredProperty, self).__init__(name=name, **kwargs)
        if self._repeated:
            if model_class._has_repeated:
                raise TypeError(
                    "This StructuredProperty cannot use repeated=True "
                    "because its model class (%s) contains repeated "
                    "properties (directly or indirectly)." % model_class.__name__
                )
        self._model_class = model_class

    def _get_value(self, entity):
        """Override _get_value() to *not* raise UnprojectedPropertyError.

        This is necessary because the projection must include both the
        sub-entity and the property name that is projected (e.g. 'foo.bar'
        instead of only 'foo'). In that case the original code would fail,
        because it only looks for the property name ('foo'). Here we check for
        a value, and only call the original code if the value is None.
        """
        value = self._get_user_value(entity)
        if value is None and entity._projection:
            # Invoke super _get_value() to raise the proper exception.
            return super(StructuredProperty, self)._get_value(entity)
        return value

    def _get_for_dict(self, entity):
        value = self._get_value(entity)
        if self._repeated:
            value = [v._to_dict() for v in value]
        elif value is not None:
            value = value._to_dict()
        return value

    def __getattr__(self, attrname):
        """Dynamically get a subproperty."""
        # Optimistically try to use the dict key.
        prop = self._model_class._properties.get(attrname)

        # We're done if we have a hit and _code_name matches.
        if prop is None or prop._code_name != attrname:
            # Otherwise, use linear search looking for a matching _code_name.
            for candidate in self._model_class._properties.values():
                if candidate._code_name == attrname:
                    prop = candidate
                    break

        if prop is None:
            raise AttributeError(
                "Model subclass %s has no attribute %s"
                % (self._model_class.__name__, attrname)
            )

        prop_copy = copy.copy(prop)
        prop_copy._name = self._name + "." + prop_copy._name

        # Cache the outcome, so subsequent requests for the same attribute
        # name will get the copied property directly rather than going
        # through the above motions all over again.
        setattr(self, attrname, prop_copy)

        return prop_copy

    def _comparison(self, op, value):
        if op != query_module._EQ_OP:
            raise exceptions.BadFilterError("StructuredProperty filter can only use ==")
        if not self._indexed:
            raise exceptions.BadFilterError(
                "Cannot query for unindexed StructuredProperty %s" % self._name
            )
        # Import late to avoid circular imports.
        from .query import ConjunctionNode, PostFilterNode
        from .query import RepeatedStructuredPropertyPredicate

        if value is None:
            from .query import (
                FilterNode,
            )  # Import late to avoid circular imports.

            return FilterNode(self._name, op, value)

        value = self._do_validate(value)
        filters = []
        match_keys = []
        for prop_name, prop in self._model_class._properties.items():
            subvalue = prop._get_value(value)
            if prop._repeated:
                if subvalue:  # pragma: no branch
                    raise exceptions.BadFilterError(
                        "Cannot query for non-empty repeated property %s" % prop._name
                    )
                continue  # pragma: NO COVER

            if subvalue is not None:  # pragma: no branch
                altprop = getattr(self, prop._code_name)
                filt = altprop._comparison(op, subvalue)
                filters.append(filt)
                match_keys.append(prop._name)

        if not filters:
            raise exceptions.BadFilterError(
                "StructuredProperty filter without any values"
            )

        if len(filters) == 1:
            return filters[0]

        if self._repeated:
            entity_pb = _entity_to_protobuf(value)
            predicate = RepeatedStructuredPropertyPredicate(
                self._name, match_keys, entity_pb
            )
            filters.append(PostFilterNode(predicate))

        return ConjunctionNode(*filters)

    def _IN(self, value):
        if not isinstance(value, (list, tuple, set, frozenset)):
            raise exceptions.BadArgumentError(
                "Expected list, tuple or set, got %r" % (value,)
            )
        from .query import DisjunctionNode, FalseNode

        # Expand to a series of == filters.
        filters = [self._comparison(query_module._EQ_OP, val) for val in value]
        if not filters:
            # DisjunctionNode doesn't like an empty list of filters.
            # Running the query will still fail, but this matches the
            # behavior of IN for regular properties.
            return FalseNode()
        else:
            return DisjunctionNode(*filters)

    IN = _IN

    def _validate(self, value):
        if isinstance(value, dict):
            # A dict is assumed to be the result of a _to_dict() call.
            return self._model_class(**value)
        if not isinstance(value, self._model_class):
            raise exceptions.BadValueError(
                "In field {}, expected {} instance, got {!r}".format(
                    self._name, self._model_class.__name__, value.__class__
                )
            )

    def _has_value(self, entity, rest=None):
        """Check if entity has a value for this property.

        Basically, prop._has_value(self, ent, ['x', 'y']) is similar to
          (prop._has_value(ent) and prop.x._has_value(ent.x) and
           prop.x.y._has_value(ent.x.y)), assuming prop.x and prop.x.y exist.

        Args:
            entity (ndb.Model): An instance of a model.
            rest (list[str]): optional list of attribute names to check in
                addition.

        Returns:
            bool: True if the entity has a value for that property.
        """
        ok = super(StructuredProperty, self)._has_value(entity)
        if ok and rest:
            value = self._get_value(entity)
            if self._repeated:
                if len(value) != 1:
                    raise RuntimeError(
                        "Failed to retrieve sub-entity of StructuredProperty"
                        " %s" % self._name
                    )
                subent = value[0]
            else:
                subent = value

            if subent is None:
                return True

            subprop = subent._properties.get(rest[0])
            if subprop is None:
                ok = False
            else:
                ok = subprop._has_value(subent, rest[1:])

        return ok

    def _check_property(self, rest=None, require_indexed=True):
        """Override for Property._check_property().

        Raises:
            InvalidPropertyError if no subproperty is specified or if something
            is wrong with the subproperty.
        """
        if not rest:
            raise InvalidPropertyError(
                "Structured property %s requires a subproperty" % self._name
            )
        self._model_class._check_properties([rest], require_indexed=require_indexed)

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.

        Args:
            value: The given class value to be converted.

        Returns:
            bytes

        Raises:
            TypeError: If ``value`` is not the correct ``Model`` type.
        """
        if not isinstance(value, self._model_class):
            raise TypeError(
                "Cannot convert to protocol buffer. Expected {} value; "
                "received {}".format(self._model_class.__name__, value)
            )
        return _entity_to_ds_entity(value, set_key=False)

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.
        Args:
            value(~google.cloud.datastore.Entity or bytes): The value to be
            converted.
        Returns:
            The converted value with given class.
        """
        if isinstance(value, ds_entity_module.Entity):
            value = _entity_from_ds_entity(value, model_class=self._model_class)
        return value

    def _get_value_size(self, entity):
        values = self._retrieve_value(entity, self._default)
        if values is None:
            return 0
        if not isinstance(values, list):
            values = [values]
        return len(values)

    def _to_datastore(self, entity, data, prefix="", repeated=False):
        """Override of :method:`Property._to_datastore`.

        If ``legacy_data`` is ``True``, then we need to override the default
        behavior to store everything in a single Datastore entity that uses
        dotted attribute names, rather than nesting entities.
        """
        # Avoid Python 2.7 circular import
        from google.cloud.ndb import context as context_module

        context = context_module.get_context()

        # The easy way
        if not context.legacy_data:
            return super(StructuredProperty, self)._to_datastore(
                entity, data, prefix=prefix, repeated=repeated
            )

        # The hard way
        next_prefix = prefix + self._name + "."
        next_repeated = repeated or self._repeated
        keys = []

        values = self._get_user_value(entity)
        if not self._repeated:
            values = (values,)

        if values:
            props = tuple(_properties_of(*values))

            for value in values:
                if value is None:
                    keys.extend(
                        super(StructuredProperty, self)._to_datastore(
                            entity, data, prefix=prefix, repeated=repeated
                        )
                    )
                    continue

                for prop in props:
                    keys.extend(
                        prop._to_datastore(
                            value, data, prefix=next_prefix, repeated=next_repeated
                        )
                    )

        return set(keys)

    def _prepare_for_put(self, entity):
        values = self._get_user_value(entity)
        if not self._repeated:
            values = [values]
        for value in values:
            if value is not None:
                value._prepare_for_put()


class LocalStructuredProperty(BlobProperty):
    """A property that contains ndb.Model value.

    .. note::
        Unlike most property types, a :class:`LocalStructuredProperty`
        is **not** indexed.
    .. automethod:: _to_base_type
    .. automethod:: _from_base_type
    .. automethod:: _validate

    Args:
        model_class (type): The class of the property. (Must be subclass of
            ``ndb.Model``.)
        name (str): The name of the property.
        compressed (bool): Indicates if the value should be compressed (via
            ``zlib``).
        repeated (bool): Indicates if this property is repeated, i.e. contains
            multiple values.
        required (bool): Indicates if this property is required on the given
            model type.
        default (Any): The default value for this property.
        validator (Callable[[~google.cloud.ndb.model.Property, Any], bool]): A
            validator to be used to check values.
        verbose_name (str): A longer, user-friendly name for this property.
        write_empty_list (bool): Indicates if an empty list should be written
            to the datastore.
    """

    _model_class = None
    _keep_keys = False
    _kwargs = None

    def __init__(self, model_class, **kwargs):
        indexed = kwargs.pop("indexed", False)
        if indexed:
            raise NotImplementedError(
                "Cannot index LocalStructuredProperty {}.".format(self._name)
            )
        keep_keys = kwargs.pop("keep_keys", False)
        super(LocalStructuredProperty, self).__init__(**kwargs)
        self._model_class = model_class
        self._keep_keys = keep_keys

    def _validate(self, value):
        """Validate a ``value`` before setting it.
        Args:
            value: The value to check.
        Raises:
            exceptions.BadValueError: If ``value`` is not a given class.
        """
        if isinstance(value, dict):
            # A dict is assumed to be the result of a _to_dict() call.
            return self._model_class(**value)

        if not isinstance(value, self._model_class):
            raise exceptions.BadValueError(
                "In field {}, expected {}, got {!r}".format(
                    self._name, self._model_class.__name__, value
                )
            )

    def _get_for_dict(self, entity):
        value = self._get_value(entity)
        if self._repeated:
            value = [v._to_dict() for v in value]
        elif value is not None:
            value = value._to_dict()
        return value

    def _to_base_type(self, value):
        """Convert a value to the "base" value type for this property.
        Args:
            value: The given class value to be converted.
        Returns:
            bytes
        Raises:
            TypeError: If ``value`` is not the correct ``Model`` type.
        """
        if not isinstance(value, self._model_class):
            raise TypeError(
                "Cannot convert to bytes expected {} value; "
                "received {}".format(self._model_class.__name__, value)
            )
        return _entity_to_protobuf(
            value, set_key=self._keep_keys
        )._pb.SerializePartialToString()

    def _from_base_type(self, value):
        """Convert a value from the "base" value type for this property.
        Args:
            value(~google.cloud.datastore.Entity or bytes): The value to be
            converted.
        Returns:
            The converted value with given class.
        """
        if isinstance(value, bytes):
            pb = entity_pb2.Entity()
            pb._pb.MergeFromString(value)
            entity_value = helpers.entity_from_protobuf(pb)
            if not entity_value.keys():
                # No properties. Maybe dealing with legacy pb format.
                from google.cloud.ndb._legacy_entity_pb import EntityProto

                pb = EntityProto()
                pb.MergePartialFromString(value)
                entity_value.update(pb.entity_props())
            value = entity_value
        if not self._keep_keys and value.key:
            value.key = None
        model_class = self._model_class
        kind = self._model_class.__name__
        if "class" in value and value["class"]:
            kind = value["class"][-1] or model_class
        if kind != self._model_class.__name__:
            # if this is a polymodel, find correct subclass.
            model_class = Model._lookup_model(kind)
        return _entity_from_ds_entity(value, model_class=model_class)

    def _prepare_for_put(self, entity):
        values = self._get_user_value(entity)
        if not self._repeated:
            values = [values]
        for value in values:
            if value is not None:
                value._prepare_for_put()

    def _to_datastore(self, entity, data, prefix="", repeated=False):
        """Override of :method:`Property._to_datastore`.

        Although this property's entities should be stored as serialized
        strings, when stored using old NDB they appear as unserialized
        entities in the datastore. When serialized as strings in this class,
        they can't be read by old NDB either. To avoid these incompatibilities,
        we store them as entities when legacy_data is set to True, which is the
        default behavior.
        """
        # Avoid Python 2.7 circular import
        from google.cloud.ndb import context as context_module

        context = context_module.get_context()

        keys = super(LocalStructuredProperty, self)._to_datastore(
            entity, data, prefix=prefix, repeated=repeated
        )

        if context.legacy_data:
            values = self._get_user_value(entity)
            if not self._repeated:
                values = [values]
            legacy_values = []
            for value in values:
                ds_entity = None
                if value is not None:
                    ds_entity = _entity_to_ds_entity(value, set_key=self._keep_keys)
                legacy_values.append(ds_entity)
            if not self._repeated:
                legacy_values = legacy_values[0]
            data[self._name] = legacy_values

        return keys


class GenericProperty(Property):
    """A Property whose value can be (almost) any basic type.
    This is mainly used for Expando and for orphans (values present in
    Cloud Datastore but not represented in the Model subclass) but can
    also be used explicitly for properties with dynamically-typed
    values.

    This supports compressed=True, which is only effective for str
    values (not for unicode), and implies indexed=False.
    """

    _compressed = False
    _kwargs = None

    def __init__(self, name=None, compressed=False, **kwargs):
        if compressed:  # Compressed implies unindexed.
            kwargs.setdefault("indexed", False)
        super(GenericProperty, self).__init__(name=name, **kwargs)
        self._compressed = compressed
        if compressed and self._indexed:
            raise NotImplementedError(
                "GenericProperty %s cannot be compressed and "
                "indexed at the same time." % self._name
            )

    def _to_base_type(self, value):
        if self._compressed and isinstance(value, bytes):
            return _CompressedValue(zlib.compress(value))

    def _from_base_type(self, value):
        if isinstance(value, _CompressedValue):
            return zlib.decompress(value.z_val)

    def _validate(self, value):
        if self._indexed:
            if isinstance(value, bytes) and len(value) > _MAX_STRING_LENGTH:
                raise exceptions.BadValueError(
                    "Indexed value %s must be at most %d bytes"
                    % (self._name, _MAX_STRING_LENGTH)
                )


class ComputedProperty(GenericProperty):
    """A Property whose value is determined by a user-supplied function.
    Computed properties cannot be set directly, but are instead generated by a
    function when required. They are useful to provide fields in Cloud
    Datastore that can be used for filtering or sorting without having to
    manually set the value in code - for example, sorting on the length of a
    BlobProperty, or using an equality filter to check if another field is not
    empty. ComputedProperty can be declared as a regular property, passing a
    function as the first argument, or it can be used as a decorator for the
    function that does the calculation.

    Example:

    >>> class DatastoreFile(ndb.Model):
    ...   name = ndb.model.StringProperty()
    ...   n_lower = ndb.model.ComputedProperty(lambda self: self.name.lower())
    ...
    ...   data = ndb.model.BlobProperty()
    ...
    ...   @ndb.model.ComputedProperty
    ...   def size(self):
    ...     return len(self.data)
    ...
    ...   def _compute_hash(self):
    ...     return hashlib.sha1(self.data).hexdigest()
    ...   hash = ndb.model.ComputedProperty(_compute_hash, name='sha1')
    """

    _kwargs = None
    _func = None

    def __init__(self, func, name=None, indexed=None, repeated=None, verbose_name=None):
        """Constructor.

        Args:

        func: A function that takes one argument, the model instance, and
            returns a calculated value.
        """
        super(ComputedProperty, self).__init__(
            name=name,
            indexed=indexed,
            repeated=repeated,
            verbose_name=verbose_name,
        )
        self._func = func

    def _set_value(self, entity, value):
        raise ComputedPropertyError("Cannot assign to a ComputedProperty")

    def _delete_value(self, entity):
        raise ComputedPropertyError("Cannot delete a ComputedProperty")

    def _get_value(self, entity):
        # About projections and computed properties: if the computed
        # property itself is in the projection, don't recompute it; this
        # prevents raising UnprojectedPropertyError if one of the
        # dependents is not in the projection.  However, if the computed
        # property is not in the projection, compute it normally -- its
        # dependents may all be in the projection, and it may be useful to
        # access the computed value without having it in the projection.
        # In this case, if any of the dependents is not in the projection,
        # accessing it in the computation function will raise
        # UnprojectedPropertyError which will just bubble up.
        if entity._projection and self._name in entity._projection:
            return super(ComputedProperty, self)._get_value(entity)
        value = self._func(entity)
        self._store_value(entity, value)
        return value

    def _prepare_for_put(self, entity):
        self._get_value(entity)  # For its side effects.


class MetaModel(type):
    """Metaclass for Model.

    This exists to fix up the properties -- they need to know their name. For
    example, defining a model:

    .. code-block:: python

        class Book(ndb.Model):
            pages = ndb.IntegerProperty()

    the ``Book.pages`` property doesn't have the name ``pages`` assigned.
    This is accomplished by calling the ``_fix_up_properties()`` method on the
    class itself.
    """

    def __init__(cls, name, bases, classdict):
        super(MetaModel, cls).__init__(name, bases, classdict)
        cls._fix_up_properties()

    def __repr__(cls):
        props = []
        for _, prop in sorted(cls._properties.items()):
            props.append("{}={!r}".format(prop._code_name, prop))
        return "{}<{}>".format(cls.__name__, ", ".join(props))


class Model(_NotEqualMixin, metaclass=MetaModel):
    """A class describing Cloud Datastore entities.

    Model instances are usually called entities. All model classes
    inheriting from :class:`Model` automatically have :class:`MetaModel` as
    their metaclass, so that the properties are fixed up properly after the
    class is defined.

    Because of this, you cannot use the same :class:`Property` object to
    describe multiple properties -- you must create separate :class:`Property`
    objects for each property. For example, this does not work:

    .. code-block:: python

        reuse_prop = ndb.StringProperty()

        class Wrong(ndb.Model):
            first = reuse_prop
            second = reuse_prop

    instead each class attribute needs to be distinct:

    .. code-block:: python

        class NotWrong(ndb.Model):
            first = ndb.StringProperty()
            second = ndb.StringProperty()

    The "kind" for a given :class:`Model` subclass is normally equal to the
    class name (exclusive of the module name or any other parent scope). To
    override the kind, define :meth:`_get_kind`, as follows:

    .. code-block:: python

        class MyModel(ndb.Model):
            @classmethod
            def _get_kind(cls):
                return "AnotherKind"

    A newly constructed entity will not be persisted to Cloud Datastore without
    an explicit call to :meth:`put`.

    User-defined properties can be passed to the constructor via keyword
    arguments:

    .. doctest:: model-keywords

        >>> class MyModel(ndb.Model):
        ...     value = ndb.FloatProperty()
        ...     description = ndb.StringProperty()
        ...
        >>> MyModel(value=7.34e22, description="Mass of the moon")
        MyModel(description='Mass of the moon', value=7.34e+22)

    In addition to user-defined properties, there are seven accepted keyword
    arguments:

    * ``key``
    * ``id``
    * ``app``
    * ``namespace``
    * ``database``
    * ``parent``
    * ``projection``

    Of these, ``key`` is a public attribute on :class:`Model` instances:

    .. testsetup:: model-key

        from google.cloud import ndb


        class MyModel(ndb.Model):
            value = ndb.FloatProperty()
            description = ndb.StringProperty()

    .. doctest:: model-key

        >>> entity1 = MyModel(id=11)
        >>> entity1.key
        Key('MyModel', 11)
        >>> entity2 = MyModel(parent=entity1.key)
        >>> entity2.key
        Key('MyModel', 11, 'MyModel', None)
        >>> entity3 = MyModel(key=ndb.Key(MyModel, "e-three"))
        >>> entity3.key
        Key('MyModel', 'e-three')

    However, a user-defined property can be defined on the model with the
    same name as one of those keyword arguments. In this case, the user-defined
    property "wins":

    .. doctest:: model-keyword-id-collision

        >>> class IDCollide(ndb.Model):
        ...     id = ndb.FloatProperty()
        ...
        >>> entity = IDCollide(id=17)
        >>> entity
        IDCollide(id=17.0)
        >>> entity.key is None
        True

    In such cases of argument "collision", an underscore can be used as a
    keyword argument prefix:

    .. doctest:: model-keyword-id-collision

        >>> entity = IDCollide(id=17, _id=2009)
        >>> entity
        IDCollide(key=Key('IDCollide', 2009), id=17.0)

    For the **very** special case of a property named ``key``, the ``key``
    attribute will no longer be the entity's key but instead will be the
    property value. Instead, the entity's key is accessible via ``_key``:

    .. doctest:: model-keyword-key-collision

        >>> class KeyCollide(ndb.Model):
        ...     key = ndb.StringProperty()
        ...
        >>> entity1 = KeyCollide(key="Take fork in road", id=987)
        >>> entity1
        KeyCollide(_key=Key('KeyCollide', 987), key='Take fork in road')
        >>> entity1.key
        'Take fork in road'
        >>> entity1._key
        Key('KeyCollide', 987)
        >>>
        >>> entity2 = KeyCollide(key="Go slow", _key=ndb.Key(KeyCollide, 1))
        >>> entity2
        KeyCollide(_key=Key('KeyCollide', 1), key='Go slow')

    The constructor accepts keyword arguments based on the properties
    defined on model subclass. However, using keywords for nonexistent
    or non-:class:`Property` class attributes will cause a failure:

    .. doctest:: model-keywords-fail

        >>> class Simple(ndb.Model):
        ...     marker = 1001
        ...     some_name = ndb.StringProperty()
        ...
        >>> Simple(some_name="Value set here.")
        Simple(some_name='Value set here.')
        >>> Simple(some_name="Value set here.", marker=29)
        Traceback (most recent call last):
          ...
        TypeError: Cannot set non-property marker
        >>> Simple(some_name="Value set here.", missing=29)
        Traceback (most recent call last):
          ...
        AttributeError: type object 'Simple' has no attribute 'missing'

    .. automethod:: _get_kind

    Args:
        key (Key): Datastore key for this entity (kind must match this model).
            If ``key`` is used, ``id`` and ``parent`` must be unset or
            :data:`None`.
        id (str): Key ID for this model. If ``id`` is used, ``key`` must be
            :data:`None`.
        parent (Key): The parent model or :data:`None` for a top-level model.
            If ``parent`` is used, ``key`` must be :data:`None`.
        namespace (str): Namespace for the entity key.
        project (str): Project ID for the entity key.
        app (str): DEPRECATED: Synonym for ``project``.
        database (str): Database for the entity key.
        kwargs (Dict[str, Any]): Additional keyword arguments. These should map
            to properties of this model.

    Raises:
        exceptions.BadArgumentError: If the constructor is called with ``key`` and one
            of ``id``, ``app``, ``namespace``, ``database``, or ``parent`` specified.
    """

    # Class variables updated by _fix_up_properties()
    _properties = None
    _has_repeated = False
    _kind_map = {}  # Dict mapping {kind: Model subclass}

    # Defaults for instance variables.
    _entity_key = None
    _values = None
    _projection = ()  # Tuple of names of projected properties.

    # Hardcoded pseudo-property for the key.
    _key = ModelKey()
    key = _key
    """A special pseudo-property for key queries.

    For example:

    .. code-block:: python

        key = ndb.Key(MyModel, 808)
        query = MyModel.query(MyModel.key > key)

    will create a query for the reserved ``__key__`` property.
    """

    def __setstate__(self, state):
        if type(state) is dict:
            # this is not a legacy pb. set __dict__
            self.__init__()
            self.__dict__.update(state)
        else:
            # this is a legacy pickled object. We need to deserialize.
            pb = _legacy_entity_pb.EntityProto()
            pb.MergePartialFromString(state)
            self.__init__()
            self.__class__._from_pb(pb, set_key=False, ent=self)

    def __init__(_self, **kwargs):
        # NOTE: We use ``_self`` rather than ``self`` so users can define a
        #       property named 'self'.
        self = _self
        key = self._get_arg(kwargs, "key")
        id_ = self._get_arg(kwargs, "id")
        project = self._get_arg(kwargs, "project")
        app = self._get_arg(kwargs, "app")
        database = self._get_arg(kwargs, "database", key_module.UNDEFINED)
        namespace = self._get_arg(kwargs, "namespace", key_module.UNDEFINED)
        parent = self._get_arg(kwargs, "parent")
        projection = self._get_arg(kwargs, "projection")

        if app and project:
            raise exceptions.BadArgumentError(
                "Can't specify both 'app' and 'project'. They are synonyms."
            )

        if not project:
            project = app

        key_parts_unspecified = (
            id_ is None
            and parent is None
            and project is None
            and database is key_module.UNDEFINED
            and namespace is key_module.UNDEFINED
        )
        if key is not None:
            if not key_parts_unspecified:
                raise exceptions.BadArgumentError(
                    "Model constructor given 'key' does not accept "
                    "'id', 'project', 'app', 'namespace', 'database', or 'parent'."
                )
            self._key = _validate_key(key, entity=self)
        elif not key_parts_unspecified:
            self._key = Key(
                self._get_kind(),
                id_,
                parent=parent,
                project=project,
                database=database,
                namespace=namespace,
            )

        self._values = {}
        self._set_attributes(kwargs)
        # Set the projection last, otherwise it will prevent _set_attributes().
        if projection:
            self._set_projection(projection)

    def _get_property_for(self, p, indexed=True, depth=0):
        """Internal helper to get the Property for a protobuf-level property."""
        if isinstance(p.name(), str):
            p.set_name(bytes(p.name(), encoding="utf-8"))
        parts = p.name().decode().split(".")
        if len(parts) <= depth:
            # Apparently there's an unstructured value here.
            # Assume it is a None written for a missing value.
            # (It could also be that a schema change turned an unstructured
            # value into a structured one.  In that case, too, it seems
            # better to return None than to return an unstructured value,
            # since the latter doesn't match the current schema.)
            return None
        next = parts[depth]
        prop = self._properties.get(next)
        if prop is None:
            prop = self._fake_property(p, next, indexed)
        return prop

    def _clone_properties(self):
        """Relocate ``_properties`` from class to instance.

        Internal helper, in case properties need to be modified for an instance but not
        the class.
        """
        cls = type(self)
        if self._properties is cls._properties:
            self._properties = dict(cls._properties)

    def _fake_property(self, p, next, indexed=True):
        """Internal helper to create a fake Property. Ported from legacy datastore"""
        # A custom 'meaning' for compressed properties.
        _MEANING_URI_COMPRESSED = "ZLIB"
        self._clone_properties()
        if p.name() != next.encode("utf-8") and not p.name().endswith(
            b"." + next.encode("utf-8")
        ):
            prop = StructuredProperty(Expando, next)
            prop._store_value(self, _BaseValue(Expando()))
        else:
            compressed = p.meaning_uri() == _MEANING_URI_COMPRESSED
            prop = GenericProperty(
                next, repeated=p.multiple(), indexed=indexed, compressed=compressed
            )
        prop._code_name = next
        self._properties[prop._name] = prop
        return prop

    @classmethod
    def _from_pb(cls, pb, set_key=True, ent=None, key=None):
        """Internal helper, ported from GoogleCloudPlatform/datastore-ndb-python,
        to create an entity from an EntityProto protobuf."""
        if not isinstance(pb, _legacy_entity_pb.EntityProto):
            raise TypeError("pb must be a EntityProto; received %r" % pb)
        if ent is None:
            ent = cls()

        # A key passed in overrides a key in the pb.
        if key is None and pb.key().path.element_size():
            # modern NDB expects strings.
            if not isinstance(pb.key_.app_, str):  # pragma: NO BRANCH
                pb.key_.app_ = pb.key_.app_.decode()
            if not isinstance(pb.key_.name_space_, str):  # pragma: NO BRANCH
                pb.key_.name_space_ = pb.key_.name_space_.decode()

            key = Key(reference=pb.key())
        # If set_key is not set, skip a trivial incomplete key.
        if key is not None and (set_key or key.id() or key.parent()):
            ent._key = key

        # NOTE(darke): Keep a map from (indexed, property name) to the property.
        # This allows us to skip the (relatively) expensive call to
        # _get_property_for for repeated fields.
        _property_map = {}
        projection = []
        for indexed, plist in (
            (True, pb.property_list()),
            # (False, pb.raw_property_list()),
            (False, pb.property_list()),
        ):
            for p in plist:
                if p.meaning() == _legacy_entity_pb.Property.INDEX_VALUE:
                    projection.append(p.name().decode())
                property_map_key = (p.name(), indexed)
                _property_map[property_map_key] = ent._get_property_for(p, indexed)
                _property_map[property_map_key]._legacy_deserialize(ent, p)

        ent._set_projection(projection)
        return ent

    @classmethod
    def _get_arg(cls, kwargs, keyword, default=None):
        """Parse keywords for fields that aren't user-defined properties.

        This is used to re-map special keyword arguments in the presence
        of name collision. For example if ``id`` is a property on the current
        :class:`Model`, then it may be desirable to pass ``_id`` (instead of
        ``id``) to the constructor.

        If the argument is found as ``_{keyword}`` or ``{keyword}``, it will
        be removed from ``kwargs``.

        Args:
            kwargs (Dict[str, Any]): A keyword arguments dictionary.
            keyword (str): A keyword to be converted.
            default (Any): Returned if argument isn't found.

        Returns:
            Optional[Any]: The ``keyword`` argument, if found, otherwise
                ``default``.
        """
        alt_keyword = "_" + keyword
        if alt_keyword in kwargs:
            return kwargs.pop(alt_keyword)

        if keyword in kwargs:
            obj = getattr(cls, keyword, None)
            if not isinstance(obj, Property) or isinstance(obj, ModelKey):
                return kwargs.pop(keyword)

        return default

    def _set_attributes(self, kwargs):
        """Set attributes from keyword arguments.

        Args:
            kwargs (Dict[str, Any]): A keyword arguments dictionary.
        """
        cls = type(self)
        for name, value in kwargs.items():
            # NOTE: This raises an ``AttributeError`` for unknown properties
            #       and that is the intended behavior.
            prop = getattr(cls, name)
            if not isinstance(prop, Property):
                raise TypeError("Cannot set non-property {}".format(name))
            prop._set_value(self, value)

    def __repr__(self):
        """Return an unambiguous string representation of an entity."""
        by_args = []
        has_key_property = False
        for prop in self._properties.values():
            if prop._code_name == "key":
                has_key_property = True

            if not prop._has_value(self):
                continue

            value = prop._retrieve_value(self)
            if value is None:
                arg_repr = "None"
            elif prop._repeated:
                arg_reprs = [prop._value_to_repr(sub_value) for sub_value in value]
                arg_repr = "[{}]".format(", ".join(arg_reprs))
            else:
                arg_repr = prop._value_to_repr(value)

            by_args.append("{}={}".format(prop._code_name, arg_repr))

        by_args.sort()

        if self._key is not None:
            if has_key_property:
                entity_key_name = "_key"
            else:
                entity_key_name = "key"
            by_args.insert(0, "{}={!r}".format(entity_key_name, self._key))

        if self._projection:
            by_args.append("_projection={!r}".format(self._projection))

        return "{}({})".format(type(self).__name__, ", ".join(by_args))

    @classmethod
    def _get_kind(cls):
        """str: Return the kind name for this class.

        This defaults to ``cls.__name__``; users may override this to give a
        class a different name when stored in Google Cloud Datastore than the
        name of the class.
        """
        return cls.__name__

    @classmethod
    def _class_name(cls):
        """A hook for PolyModel to override.

        For regular models and expandos this is just an alias for
        _get_kind().  For PolyModel subclasses, it returns the class name
        (as set in the 'class' attribute thereof), whereas _get_kind()
        returns the kind (the class name of the root class of a specific
        PolyModel hierarchy).
        """
        return cls._get_kind()

    @classmethod
    def _default_filters(cls):
        """Return an iterable of filters that are always to be applied.

        This is used by PolyModel to quietly insert a filter for the
        current class name.
        """
        return ()

    def __hash__(self):
        """Not implemented hash function.

        Raises:
            TypeError: Always, to emphasize that entities are mutable.
        """
        raise TypeError("Model is mutable, so cannot be hashed.")

    def __eq__(self, other):
        """Compare two entities of the same class for equality."""
        if type(other) is not type(self):
            return NotImplemented

        if self._key != other._key:
            return False

        return self._equivalent(other)

    def _equivalent(self, other):
        """Compare two entities of the same class, excluding keys.

        Args:
            other (Model): An entity of the same class. It is assumed that
                the type and the key of ``other`` match the current entity's
                type and key (and the caller is responsible for checking).

        Returns:
            bool: Indicating if the current entity and ``other`` are
            equivalent.
        """
        if set(self._projection) != set(other._projection):
            return False

        if len(self._properties) != len(other._properties):
            return False  # Can only happen for Expandos.

        prop_names = set(self._properties.keys())
        other_prop_names = set(other._properties.keys())
        if prop_names != other_prop_names:
            return False  # Again, only possible for Expandos

        # Restrict properties to the projection if set.
        if self._projection:
            prop_names = set(self._projection)

        for name in prop_names:
            value = self._properties[name]._get_value(self)
            if value != other._properties[name]._get_value(other):
                return False

        return True

    def __lt__(self, value):
        """The ``<`` comparison is not well-defined."""
        raise TypeError("Model instances are not orderable.")

    def __le__(self, value):
        """The ``<=`` comparison is not well-defined."""
        raise TypeError("Model instances are not orderable.")

    def __gt__(self, value):
        """The ``>`` comparison is not well-defined."""
        raise TypeError("Model instances are not orderable.")

    def __ge__(self, value):
        """The ``>=`` comparison is not well-defined."""
        raise TypeError("Model instances are not orderable.")

    @classmethod
    def _lookup_model(cls, kind, default_model=None):
        """Get the model class for the given kind.

        Args:
            kind (str): The name of the kind to look up.
            default_model (Optional[type]): The model class to return if the
                kind can't be found.

        Returns:
            type: The model class for the requested kind or the default model.

        Raises:
            .KindError: If the kind was not found and no ``default_model`` was
                provided.
        """
        model_class = cls._kind_map.get(kind, default_model)
        if model_class is None:
            raise KindError(
                (
                    "No model class found for the kind '{}'. Did you forget "
                    "to import it?"
                ).format(kind)
            )
        return model_class

    def _set_projection(self, projection):
        """Set the projected properties for this instance.

        Args:
            projection (Union[list, tuple]): An iterable of strings
                representing the projection for the model instance.
        """
        self._projection = tuple(projection)

        # Handle projections for structured properties by recursively setting
        # projections on sub-entities.
        by_prefix = {}
        for name in projection:
            if "." in name:
                head, tail = name.split(".", 1)
                by_prefix.setdefault(head, []).append(tail)

        for name, projection in by_prefix.items():
            prop = self._properties.get(name)
            value = prop._get_user_value(self)
            if prop._repeated:
                for entity in value:
                    entity._set_projection(projection)
            else:
                value._set_projection(projection)

    @classmethod
    def _check_properties(cls, property_names, require_indexed=True):
        """Internal helper to check the given properties exist and meet
        specified requirements.

        Called from query.py.

        Args:
            property_names (list): List or tuple of property names -- each
            being a string, possibly containing dots (to address subproperties
            of structured properties).

        Raises:
            InvalidPropertyError: if one of the properties is invalid.
            AssertionError: if the argument is not a list or tuple of strings.
        """
        assert isinstance(property_names, (list, tuple)), repr(property_names)
        for name in property_names:
            if "." in name:
                name, rest = name.split(".", 1)
            else:
                rest = None
            prop = cls._properties.get(name)
            if prop is None:
                raise InvalidPropertyError("Unknown property {}".format(name))
            else:
                prop._check_property(rest, require_indexed=require_indexed)

    @classmethod
    def _fix_up_properties(cls):
        """Fix up the properties by calling their ``_fix_up()`` method.

        .. note::

            This is called by :class:`MetaModel`, but may also be called
            manually after dynamically updating a model class.

        Raises:
            KindError: If the returned kind from ``_get_kind()`` is not a
                :class:`str`.
            TypeError: If a property on this model has a name beginning with
                an underscore.
        """
        kind = cls._get_kind()
        if not isinstance(kind, str):
            raise KindError(
                "Class {} defines a ``_get_kind()`` method that returns "
                "a non-string ({!r})".format(cls.__name__, kind)
            )

        cls._properties = {}

        # Skip the classes in ``ndb.model``.
        if cls.__module__ == __name__:
            return

        for name in dir(cls):
            attr = getattr(cls, name, None)
            if isinstance(attr, ModelAttribute) and not isinstance(attr, ModelKey):
                if name.startswith("_"):
                    raise TypeError(
                        "ModelAttribute {} cannot begin with an underscore "
                        "character. ``_`` prefixed attributes are reserved "
                        "for temporary Model instance values.".format(name)
                    )
                attr._fix_up(cls, name)
                if isinstance(attr, Property):
                    if attr._repeated or (
                        isinstance(attr, StructuredProperty)
                        and attr._model_class._has_repeated
                    ):
                        cls._has_repeated = True
                    cls._properties[attr._name] = attr

        cls._update_kind_map()

    @classmethod
    def _update_kind_map(cls):
        """Update the kind map to include this class."""
        cls._kind_map[cls._get_kind()] = cls

    @staticmethod
    def _validate_key(key):
        """Validation for ``_key`` attribute (designed to be overridden).

        Args:
            key (~google.cloud.ndb.key.Key): Proposed key to use for this entity.

        Returns:
            ~google.cloud.ndb.key.Key: The validated ``key``.
        """
        return key

    @classmethod
    def _gql(cls, query_string, *args, **kwargs):
        """Run a GQL query using this model as the FROM entity.

        Args:
            query_string (str): The WHERE part of a GQL query (including the
                WHERE keyword).
            args: if present, used to call bind() on the query.
            kwargs: if present, used to call bind() on the query.

        Returns:
            :class:query.Query: A query instance.
        """
        # import late to avoid circular import problems
        from google.cloud.ndb import query

        gql = "SELECT * FROM {} {}".format(cls._class_name(), query_string)
        return query.gql(gql, *args, **kwargs)

    gql = _gql

    @options_module.Options.options
    @utils.keyword_only(
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        global_cache_timeout=None,
        use_datastore=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    )
    @utils.positional(1)
    def _put(self, **kwargs):
        """Synchronously write this entity to Cloud Datastore.

        If the operation creates or completes a key, the entity's key
        attribute is set to the new, complete key.

        Args:
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.

        Returns:
            key.Key: The key for the entity. This is always a complete key.
        """
        return self._put_async(_options=kwargs["_options"]).result()

    put = _put

    @options_module.Options.options
    @utils.keyword_only(
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        global_cache_timeout=None,
        use_datastore=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    )
    @utils.positional(1)
    def _put_async(self, **kwargs):
        """Asynchronously write this entity to Cloud Datastore.

        If the operation creates or completes a key, the entity's key
        attribute is set to the new, complete key.

        Args:
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.

        Returns:
            tasklets.Future: The eventual result will be the key for the
                entity. This is always a complete key.
        """
        # Avoid Python 2.7 circular import
        from google.cloud.ndb import context as context_module
        from google.cloud.ndb import _datastore_api

        self._pre_put_hook()

        @tasklets.tasklet
        def put(self):
            ds_entity = _entity_to_ds_entity(self)
            ds_key = yield _datastore_api.put(ds_entity, kwargs["_options"])
            if ds_key:
                self._key = key_module.Key._from_ds_key(ds_key)

            context = context_module.get_context()
            if context._use_cache(self._key, kwargs["_options"]):
                context.cache[self._key] = self

            raise tasklets.Return(self._key)

        self._prepare_for_put()
        future = put(self)
        future.add_done_callback(self._post_put_hook)
        return future

    put_async = _put_async

    def _prepare_for_put(self):
        if self._properties:
            for prop in self._properties.values():
                prop._prepare_for_put(self)

    @classmethod
    @utils.keyword_only(
        distinct=False,
        ancestor=None,
        order_by=None,
        orders=None,
        project=None,
        app=None,
        namespace=None,
        projection=None,
        distinct_on=None,
        group_by=None,
        default_options=None,
    )
    def _query(cls, *filters, **kwargs):
        """Generate a query for this class.

        Args:
            *filters (query.FilterNode): Filters to apply to this query.
            distinct (Optional[bool]): Setting this to :data:`True` is
                shorthand for setting `distinct_on` to `projection`.
            ancestor (key.Key): Entities returned will be descendants of
                `ancestor`.
            order_by (list[Union[str, google.cloud.ndb.model.Property]]):
                The model properties used to order query results.
            orders (list[Union[str, google.cloud.ndb.model.Property]]):
                Deprecated. Synonym for `order_by`.
            project (str): The project to perform the query in. Also known as
                the app, in Google App Engine. If not passed, uses the
                client's value.
            app (str): Deprecated. Synonym for `project`.
            namespace (str): The namespace to which to restrict results.
                If not passed, uses the client's value.
            projection (list[str]): The fields to return as part of the
                query results.
            distinct_on (list[str]): The field names used to group query
                results.
            group_by (list[str]): Deprecated. Synonym for distinct_on.
            default_options (QueryOptions): QueryOptions object.
        """
        # Validating distinct
        if kwargs["distinct"]:
            if kwargs["distinct_on"]:
                raise TypeError("Cannot use `distinct` and `distinct_on` together.")

            if kwargs["group_by"]:
                raise TypeError("Cannot use `distinct` and `group_by` together.")

            if not kwargs["projection"]:
                raise TypeError("Cannot use `distinct` without `projection`.")

            kwargs["distinct_on"] = kwargs["projection"]

        # Avoid circular import
        from google.cloud.ndb import query as query_module

        query = query_module.Query(
            kind=cls._get_kind(),
            ancestor=kwargs["ancestor"],
            order_by=kwargs["order_by"],
            orders=kwargs["orders"],
            project=kwargs["project"],
            app=kwargs["app"],
            namespace=kwargs["namespace"],
            projection=kwargs["projection"],
            distinct_on=kwargs["distinct_on"],
            group_by=kwargs["group_by"],
            default_options=kwargs["default_options"],
        )
        query = query.filter(*cls._default_filters())
        query = query.filter(*filters)
        return query

    query = _query

    @classmethod
    @options_module.Options.options
    @utils.positional(4)
    def _allocate_ids(
        cls,
        size=None,
        max=None,
        parent=None,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        global_cache_timeout=None,
        use_datastore=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    ):
        """Allocates a range of key IDs for this model class.

        Args:
            size (int): Number of IDs to allocate. Must be specified.
            max (int): Maximum ID to allocated. This feature is no longer
                supported. You must always specify ``size``.
            parent (key.Key): Parent key for which the IDs will be allocated.
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.

        Returns:
            tuple(key.Key): Keys for the newly allocated IDs.
        """
        future = cls._allocate_ids_async(size, max, parent, _options=_options)
        return future.result()

    allocate_ids = _allocate_ids

    @classmethod
    @options_module.Options.options
    @utils.positional(4)
    def _allocate_ids_async(
        cls,
        size=None,
        max=None,
        parent=None,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        global_cache_timeout=None,
        use_datastore=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    ):
        """Allocates a range of key IDs for this model class.

        Args:
            size (int): Number of IDs to allocate. Must be specified.
            max (int): Maximum ID to allocated. This feature is no longer
                supported. You must always specify ``size``.
            parent (key.Key): Parent key for which the IDs will be allocated.
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.

        Returns:
            tasklets.Future: Eventual result is ``tuple(key.Key)``: Keys for
                the newly allocated IDs.
        """
        # Avoid Python 2.7 circular import
        from google.cloud.ndb import _datastore_api

        if max:
            raise NotImplementedError(
                "The 'max' argument to 'allocate_ids' is no longer supported. "
                "There is no support for it in the Google Datastore backend "
                "service."
            )

        if not size:
            raise TypeError("Must pass non-zero 'size' to 'allocate_ids'")

        @tasklets.tasklet
        def allocate_ids():
            cls._pre_allocate_ids_hook(size, max, parent)
            kind = cls._get_kind()
            keys = [key_module.Key(kind, None, parent=parent)._key for _ in range(size)]
            key_pbs = yield _datastore_api.allocate(keys, _options)
            keys = tuple(
                (
                    key_module.Key._from_ds_key(helpers.key_from_protobuf(key_pb))
                    for key_pb in key_pbs
                )
            )
            raise tasklets.Return(keys)

        future = allocate_ids()
        future.add_done_callback(
            functools.partial(cls._post_allocate_ids_hook, size, max, parent)
        )
        return future

    allocate_ids_async = _allocate_ids_async

    @classmethod
    @options_module.ReadOptions.options
    @utils.positional(6)
    def _get_by_id(
        cls,
        id,
        parent=None,
        namespace=None,
        project=None,
        app=None,
        read_consistency=None,
        read_policy=None,
        transaction=None,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        global_cache_timeout=None,
        use_datastore=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
        database=None,
    ):
        """Get an instance of Model class by ID.

        This really just a shorthand for ``Key(cls, id, ....).get()``.

        Args:
            id (Union[int, str]): ID of the entity to load.
            parent (Optional[key.Key]): Key for the parent of the entity to
                load.
            namespace (Optional[str]): Namespace for the entity to load. If not
                passed, uses the client's value.
            project (Optional[str]): Project id for the entity to load. If not
                passed, uses the client's value.
            app (str): DEPRECATED: Synonym for `project`.
            read_consistency: Set this to ``ndb.EVENTUAL`` if, instead of
                waiting for the Datastore to finish applying changes to all
                returned results, you wish to get possibly-not-current results
                faster. You can't do this if using a transaction.
            read_policy: DEPRECATED: Synonym for ``read_consistency``.
            transaction (bytes): Any results returned will be consistent with
                the Datastore state represented by this transaction id.
                Defaults to the currently running transaction. Cannot be used
                with ``read_consistency=ndb.EVENTUAL``.
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.
            database (Optional[str]): This parameter is ignored. Please set the database on the Client instead.

        Returns:
            Optional[Model]: The retrieved entity, if one is found.
        """
        return cls._get_by_id_async(
            id,
            parent=parent,
            namespace=namespace,
            project=project,
            app=app,
            _options=_options,
            database=database,
        ).result()

    get_by_id = _get_by_id

    @classmethod
    @options_module.ReadOptions.options
    @utils.positional(6)
    def _get_by_id_async(
        cls,
        id,
        parent=None,
        namespace=None,
        project=None,
        app=None,
        read_consistency=None,
        read_policy=None,
        transaction=None,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        global_cache_timeout=None,
        use_datastore=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
        database: str = None,
    ):
        """Get an instance of Model class by ID.

        This is the asynchronous version of :meth:`get_by_id`.

        Args:
            id (Union[int, str]): ID of the entity to load.
            parent (Optional[key.Key]): Key for the parent of the entity to
                load.
            namespace (Optional[str]): Namespace for the entity to load. If not
                passed, uses the client's value.
            project (Optional[str]): Project id for the entity to load. If not
                passed, uses the client's value.
            app (str): DEPRECATED: Synonym for `project`.
            read_consistency: Set this to ``ndb.EVENTUAL`` if, instead of
                waiting for the Datastore to finish applying changes to all
                returned results, you wish to get possibly-not-current results
                faster. You can't do this if using a transaction.
            read_policy: DEPRECATED: Synonym for ``read_consistency``.
            transaction (bytes): Any results returned will be consistent with
                the Datastore state represented by this transaction id.
                Defaults to the currently running transaction. Cannot be used
                with ``read_consistency=ndb.EVENTUAL``.
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.
            database (Optional[str]): This parameter is ignored. Please set the database on the Client instead.

        Returns:
            tasklets.Future: Optional[Model]: The retrieved entity, if one is
                found.
        """
        if app:
            if project:
                raise TypeError("Can't pass 'app' and 'project' arguments together.")

            project = app

        # Key class is weird about keyword args. If you want it to use defaults
        # you have to not pass them at all.
        key_args = {}

        if project:
            key_args["app"] = project

        if namespace is not None:
            key_args["namespace"] = namespace

        key = key_module.Key(cls._get_kind(), id, parent=parent, **key_args)
        return key.get_async(_options=_options)

    get_by_id_async = _get_by_id_async

    @classmethod
    @options_module.ReadOptions.options_or_model_properties
    @utils.positional(6)
    def _get_or_insert(_cls, _name, *args, **kwargs):
        """Transactionally retrieves an existing entity or creates a new one.

        Will attempt to look up an entity with the given ``name`` and
        ``parent``. If none is found a new entity will be created using the
        given ``name`` and ``parent``, and passing any ``kw_model_args`` to the
        constructor the ``Model`` class.

        If not already in a transaction, a new transaction will be created and
        this operation will be run in that transaction.

        Args:
            name (str): Name of the entity to load or create.
            parent (Optional[key.Key]): Key for the parent of the entity to
                load.
            namespace (Optional[str]): Namespace for the entity to load. If not
                passed, uses the client's value.
            project (Optional[str]): Project id for the entity to load. If not
                passed, uses the client's value.
            app (str): DEPRECATED: Synonym for `project`.
            **kw_model_args: Keyword arguments to pass to the constructor of
                the model class if an instance for the specified key name does
                not already exist. If an instance with the supplied ``name``
                and ``parent`` already exists, these arguments will be
                discarded.
            read_consistency: Set this to ``ndb.EVENTUAL`` if, instead of
                waiting for the Datastore to finish applying changes to all
                returned results, you wish to get possibly-not-current results
                faster. You can't do this if using a transaction.
            read_policy: DEPRECATED: Synonym for ``read_consistency``.
            transaction (bytes): Any results returned will be consistent with
                the Datastore state represented by this transaction id.
                Defaults to the currently running transaction. Cannot be used
                with ``read_consistency=ndb.EVENTUAL``.
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.

        Returns:
            Model: The entity that was either just retrieved or created.
        """
        return _cls._get_or_insert_async(_name, *args, **kwargs).result()

    get_or_insert = _get_or_insert

    @classmethod
    @options_module.ReadOptions.options_or_model_properties
    @utils.positional(6)
    def _get_or_insert_async(_cls, _name, *args, **kwargs):
        """Transactionally retrieves an existing entity or creates a new one.

        This is the asynchronous version of :meth:``_get_or_insert``.

        Args:
            name (str): Name of the entity to load or create.
            parent (Optional[key.Key]): Key for the parent of the entity to
                load.
            namespace (Optional[str]): Namespace for the entity to load. If not
                passed, uses the client's value.
            project (Optional[str]): Project id for the entity to load. If not
                passed, uses the client's value.
            app (str): DEPRECATED: Synonym for `project`.
            **kw_model_args: Keyword arguments to pass to the constructor of
                the model class if an instance for the specified key name does
                not already exist. If an instance with the supplied ``name``
                and ``parent`` already exists, these arguments will be
                discarded.
            read_consistency: Set this to ``ndb.EVENTUAL`` if, instead of
                waiting for the Datastore to finish applying changes to all
                returned results, you wish to get possibly-not-current results
                faster. You can't do this if using a transaction.
            read_policy: DEPRECATED: Synonym for ``read_consistency``.
            transaction (bytes): Any results returned will be consistent with
                the Datastore state represented by this transaction id.
                Defaults to the currently running transaction. Cannot be used
                with ``read_consistency=ndb.EVENTUAL``.
            retries (int): Number of times to retry this operation in the case
                of transient server errors. Operation will potentially be tried
                up to ``retries`` + 1 times. Set to ``0`` to try operation only
                once, with no retries.
            timeout (float): Override the gRPC timeout, in seconds.
            deadline (float): DEPRECATED: Synonym for ``timeout``.
            use_cache (bool): Specifies whether to store entities in in-process
                cache; overrides in-process cache policy for this operation.
            use_global_cache (bool): Specifies whether to store entities in
                global cache; overrides global cache policy for this operation.
            use_datastore (bool): Specifies whether to store entities in
                Datastore; overrides Datastore policy for this operation.
            global_cache_timeout (int): Maximum lifetime for entities in global
                cache; overrides global cache timeout policy for this
                operation.
            use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
            memcache_timeout (int): DEPRECATED: Synonym for
                ``global_cache_timeout``.
            max_memcache_items (int): No longer supported.
            force_writes (bool): No longer supported.

        Returns:
            tasklets.Future: Model: The entity that was either just retrieved
                or created.
        """
        name = _name
        parent = _cls._get_arg(kwargs, "parent")
        namespace = _cls._get_arg(kwargs, "namespace")
        app = _cls._get_arg(kwargs, "app")
        project = _cls._get_arg(kwargs, "project")
        options = kwargs.pop("_options")

        if not isinstance(name, str):
            raise TypeError("'name' must be a string; received {!r}".format(name))

        elif not name:
            raise TypeError("'name' must not be an empty string.")

        if app:
            if project:
                raise TypeError("Can't pass 'app' and 'project' arguments together.")

            project = app

        # Key class is weird about keyword args. If you want it to use defaults
        # you have to not pass them at all.
        key_args = {}

        if project:
            key_args["app"] = project

        if namespace is not None:
            key_args["namespace"] = namespace

        key = key_module.Key(_cls._get_kind(), name, parent=parent, **key_args)

        @tasklets.tasklet
        def get_or_insert():
            @tasklets.tasklet
            def insert():
                entity = _cls(**kwargs)
                entity._key = key
                yield entity.put_async(_options=options)

                raise tasklets.Return(entity)

            # We don't need to start a transaction just to check if the entity
            # exists already
            entity = yield key.get_async(_options=options)
            if entity is not None:
                raise tasklets.Return(entity)

            if _transaction.in_transaction():
                entity = yield insert()

            else:
                entity = yield _transaction.transaction_async(insert)

            raise tasklets.Return(entity)

        return get_or_insert()

    get_or_insert_async = _get_or_insert_async

    def _populate(self, **kwargs):
        """Populate an instance from keyword arguments.

        Each keyword argument will be used to set a corresponding property.
        Each keyword must refer to a valid property name. This is similar to
        passing keyword arguments to the ``Model`` constructor, except that no
        provision for key, id, or parent are made.

        Arguments:
            **kwargs: Keyword arguments corresponding to properties of this
                model class.
        """
        self._set_attributes(kwargs)

    populate = _populate

    def _has_complete_key(self):
        """Return whether this entity has a complete key.

        Returns:
            bool: :data:``True`` if and only if entity has a key and that key
                has a name or an id.
        """
        return self._key is not None and self._key.id() is not None

    has_complete_key = _has_complete_key

    @utils.positional(2)
    def _to_dict(self, include=None, exclude=None):
        """Return a ``dict`` containing the entity's property values.

        Arguments:
            include (Optional[Union[list, tuple, set]]): Set of property names
                to include. Default is to include all names.
            exclude (Optional[Union[list, tuple, set]]): Set of property names
                to exclude. Default is to not exclude any names.
        """
        values = {}
        for prop in self._properties.values():
            name = prop._code_name
            if include is not None and name not in include:
                continue
            if exclude is not None and name in exclude:
                continue

            try:
                values[name] = prop._get_for_dict(self)
            except UnprojectedPropertyError:
                # Ignore unprojected property errors, rather than failing
                pass

        return values

    to_dict = _to_dict

    @classmethod
    def _code_name_from_stored_name(cls, name):
        """Return the code name from a property when it's different from the
        stored name. Used in deserialization from datastore."""
        if name in cls._properties:
            return cls._properties[name]._code_name

        # If name isn't in cls._properties but there is a property with that
        # name, it means that property has a different codename, and returning
        # this name will potentially clobber the real property.  Take for
        # example:
        #
        # class SomeKind(ndb.Model):
        #     foo = ndb.IntegerProperty(name="bar")
        #
        # If we are passed "bar", we know to translate that to "foo", because
        # the datastore property, "bar", is the NDB property, "foo". But if we
        # are passed "foo", here, then that must be the datastore property,
        # "foo", which isn't even mapped to anything in the NDB model.
        #
        prop = getattr(cls, name, None)
        if prop:
            # Won't map to a property, so this datastore property will be
            # effectively ignored.
            return " "

        return name

    @classmethod
    def _pre_allocate_ids_hook(cls, size, max, parent):
        pass

    @classmethod
    def _post_allocate_ids_hook(cls, size, max, parent, future):
        pass

    @classmethod
    def _pre_delete_hook(self, key):
        pass

    @classmethod
    def _post_delete_hook(self, key, future):
        pass

    @classmethod
    def _pre_get_hook(self, key):
        pass

    @classmethod
    def _post_get_hook(self, key, future):
        pass

    @classmethod
    def _pre_put_hook(self):
        pass

    @classmethod
    def _post_put_hook(self, future):
        pass


class Expando(Model):
    """Model subclass to support dynamic Property names and types.

    Sometimes the set of properties is not known ahead of time.  In such
    cases you can use the Expando class.  This is a Model subclass that
    creates properties on the fly, both upon assignment and when loading
    an entity from Cloud Datastore.  For example::

        >>> class SuperPerson(Expando):
                name = StringProperty()
                superpower = StringProperty()

        >>> razorgirl = SuperPerson(name='Molly Millions',
                                    superpower='bionic eyes, razorblade hands',
                                    rasta_name='Steppin\' Razor',
                                    alt_name='Sally Shears')
        >>> elastigirl = SuperPerson(name='Helen Parr',
                                     superpower='stretchable body')
        >>> elastigirl.max_stretch = 30  # Meters

        >>> print(razorgirl._properties.keys())
            ['rasta_name', 'name', 'superpower', 'alt_name']
        >>> print(elastigirl._properties)
            {'max_stretch': GenericProperty('max_stretch'),
             'name': StringProperty('name'),
             'superpower': StringProperty('superpower')}

    Note: You can inspect the properties of an expando instance using the
    _properties attribute, as shown above. This property exists for plain Model
    instances too; it is just not as interesting for those.
    """

    # Set this to False (in an Expando subclass or entity) to make
    # properties default to unindexed.
    _default_indexed = True

    # Set this to True to write [] to Cloud Datastore instead of no property
    _write_empty_list_for_dynamic_properties = None

    def _set_attributes(self, kwds):
        for name, value in kwds.items():
            setattr(self, name, value)

    def __getattr__(self, name):
        prop = self._properties.get(name)
        if prop is None:
            return super(Expando, self).__getattribute__(name)
        return prop._get_value(self)

    def __setattr__(self, name, value):
        if (
            name.startswith("_")
            or isinstance(getattr(self.__class__, name, None), (Property, property))
            or isinstance(self._properties.get(name, None), (Property, property))
        ):
            return super(Expando, self).__setattr__(name, value)

        if "." in name:
            # Legacy structured property
            supername, subname = name.split(".", 1)
            supervalue = getattr(self, supername, None)
            if isinstance(supervalue, Expando):
                return setattr(supervalue, subname, value)
            return setattr(self, supername, {subname: value})

        self._clone_properties()

        if isinstance(value, Model):
            prop = StructuredProperty(Model, name)
        elif isinstance(value, dict):
            prop = StructuredProperty(Expando, name)
        else:
            prop = GenericProperty(
                name,
                repeated=isinstance(value, (list, tuple)),
                indexed=self._default_indexed,
                write_empty_list=self._write_empty_list_for_dynamic_properties,
            )
        prop._code_name = name
        self._properties[name] = prop
        prop._set_value(self, value)

    def __delattr__(self, name):
        if name.startswith("_") or isinstance(
            getattr(self.__class__, name, None), (Property, property)
        ):
            return super(Expando, self).__delattr__(name)
        prop = self._properties.get(name)
        if not isinstance(prop, Property):
            raise TypeError(
                "Model properties must be Property instances; not %r" % prop
            )
        prop._delete_value(self)
        if name in super(Expando, self)._properties:
            raise RuntimeError(
                "Property %s still in the list of properties for the "
                "base class." % name
            )
        del self._properties[name]


@options_module.ReadOptions.options
@utils.positional(1)
def get_multi_async(
    keys,
    read_consistency=None,
    read_policy=None,
    transaction=None,
    retries=None,
    timeout=None,
    deadline=None,
    use_cache=None,
    use_global_cache=None,
    global_cache_timeout=None,
    use_datastore=None,
    use_memcache=None,
    memcache_timeout=None,
    max_memcache_items=None,
    force_writes=None,
    _options=None,
):
    """Fetches a sequence of keys.

    Args:
        keys (Sequence[:class:`~google.cloud.ndb.key.Key`]): A sequence of
            keys.
        read_consistency: Set this to ``ndb.EVENTUAL`` if, instead of
            waiting for the Datastore to finish applying changes to all
            returned results, you wish to get possibly-not-current results
            faster. You can't do this if using a transaction.
        transaction (bytes): Any results returned will be consistent with
            the Datastore state represented by this transaction id.
            Defaults to the currently running transaction. Cannot be used
            with ``read_consistency=ndb.EVENTUAL``.
        retries (int): Number of times to retry this operation in the case
            of transient server errors. Operation will potentially be tried
            up to ``retries`` + 1 times. Set to ``0`` to try operation only
            once, with no retries.
        timeout (float): Override the gRPC timeout, in seconds.
        deadline (float): DEPRECATED: Synonym for ``timeout``.
        use_cache (bool): Specifies whether to store entities in in-process
            cache; overrides in-process cache policy for this operation.
        use_global_cache (bool): Specifies whether to store entities in
            global cache; overrides global cache policy for this operation.
        use_datastore (bool): Specifies whether to store entities in
            Datastore; overrides Datastore policy for this operation.
        global_cache_timeout (int): Maximum lifetime for entities in global
            cache; overrides global cache timeout policy for this
            operation.
        use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
        memcache_timeout (int): DEPRECATED: Synonym for
            ``global_cache_timeout``.
        max_memcache_items (int): No longer supported.
        read_policy: DEPRECATED: Synonym for ``read_consistency``.
        force_writes (bool): No longer supported.

    Returns:
        List[:class:`~google.cloud.ndb.tasklets.Future`]: List of futures.
    """
    return [key.get_async(_options=_options) for key in keys]


@options_module.ReadOptions.options
@utils.positional(1)
def get_multi(
    keys,
    read_consistency=None,
    read_policy=None,
    transaction=None,
    retries=None,
    timeout=None,
    deadline=None,
    use_cache=None,
    use_global_cache=None,
    global_cache_timeout=None,
    use_datastore=None,
    use_memcache=None,
    memcache_timeout=None,
    max_memcache_items=None,
    force_writes=None,
    _options=None,
):
    """Fetches a sequence of keys.

    Args:
        keys (Sequence[:class:`~google.cloud.ndb.key.Key`]): A sequence of
            keys.
        read_consistency: Set this to ``ndb.EVENTUAL`` if, instead of
            waiting for the Datastore to finish applying changes to all
            returned results, you wish to get possibly-not-current results
            faster. You can't do this if using a transaction.
        transaction (bytes): Any results returned will be consistent with
            the Datastore state represented by this transaction id.
            Defaults to the currently running transaction. Cannot be used
            with ``read_consistency=ndb.EVENTUAL``.
        retries (int): Number of times to retry this operation in the case
            of transient server errors. Operation will potentially be tried
            up to ``retries`` + 1 times. Set to ``0`` to try operation only
            once, with no retries.
        timeout (float): Override the gRPC timeout, in seconds.
        deadline (float): DEPRECATED: Synonym for ``timeout``.
        use_cache (bool): Specifies whether to store entities in in-process
            cache; overrides in-process cache policy for this operation.
        use_global_cache (bool): Specifies whether to store entities in
            global cache; overrides global cache policy for this operation.
        use_datastore (bool): Specifies whether to store entities in
            Datastore; overrides Datastore policy for this operation.
        global_cache_timeout (int): Maximum lifetime for entities in global
            cache; overrides global cache timeout policy for this
            operation.
        use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
        memcache_timeout (int): DEPRECATED: Synonym for
            ``global_cache_timeout``.
        max_memcache_items (int): No longer supported.
        read_policy: DEPRECATED: Synonym for ``read_consistency``.
        force_writes (bool): No longer supported.

    Returns:
        List[Union[:class:`~google.cloud.ndb.model.Model`, :data:`None`]]: List
            containing the retrieved models or None where a key was not found.
    """
    futures = [key.get_async(_options=_options) for key in keys]
    return [future.result() for future in futures]


@options_module.Options.options
@utils.positional(1)
def put_multi_async(
    entities,
    retries=None,
    timeout=None,
    deadline=None,
    use_cache=None,
    use_global_cache=None,
    global_cache_timeout=None,
    use_datastore=None,
    use_memcache=None,
    memcache_timeout=None,
    max_memcache_items=None,
    force_writes=None,
    _options=None,
):
    """Stores a sequence of Model instances.

    Args:
        retries (int): Number of times to retry this operation in the case
            of transient server errors. Operation will potentially be tried
            up to ``retries`` + 1 times. Set to ``0`` to try operation only
            once, with no retries.
        entities (List[:class:`~google.cloud.ndb.model.Model`]): A sequence
            of models to store.
        timeout (float): Override the gRPC timeout, in seconds.
        deadline (float): DEPRECATED: Synonym for ``timeout``.
        use_cache (bool): Specifies whether to store entities in in-process
            cache; overrides in-process cache policy for this operation.
        use_global_cache (bool): Specifies whether to store entities in
            global cache; overrides global cache policy for this operation.
        use_datastore (bool): Specifies whether to store entities in
            Datastore; overrides Datastore policy for this operation.
        global_cache_timeout (int): Maximum lifetime for entities in global
            cache; overrides global cache timeout policy for this
            operation.
        use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
        memcache_timeout (int): DEPRECATED: Synonym for
            ``global_cache_timeout``.
        max_memcache_items (int): No longer supported.
        force_writes (bool): No longer supported.

    Returns:
        List[:class:`~google.cloud.ndb.tasklets.Future`]: List of futures.
    """
    return [entity.put_async(_options=_options) for entity in entities]


@options_module.Options.options
@utils.positional(1)
def put_multi(
    entities,
    retries=None,
    timeout=None,
    deadline=None,
    use_cache=None,
    use_global_cache=None,
    global_cache_timeout=None,
    use_datastore=None,
    use_memcache=None,
    memcache_timeout=None,
    max_memcache_items=None,
    force_writes=None,
    _options=None,
):
    """Stores a sequence of Model instances.

    Args:
        entities (List[:class:`~google.cloud.ndb.model.Model`]): A sequence
            of models to store.
        retries (int): Number of times to retry this operation in the case
            of transient server errors. Operation will potentially be tried
            up to ``retries`` + 1 times. Set to ``0`` to try operation only
            once, with no retries.
        timeout (float): Override the gRPC timeout, in seconds.
        deadline (float): DEPRECATED: Synonym for ``timeout``.
        use_cache (bool): Specifies whether to store entities in in-process
            cache; overrides in-process cache policy for this operation.
        use_global_cache (bool): Specifies whether to store entities in
            global cache; overrides global cache policy for this operation.
        use_datastore (bool): Specifies whether to store entities in
            Datastore; overrides Datastore policy for this operation.
        global_cache_timeout (int): Maximum lifetime for entities in global
            cache; overrides global cache timeout policy for this
            operation.
        use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
        memcache_timeout (int): DEPRECATED: Synonym for
            ``global_cache_timeout``.
        max_memcache_items (int): No longer supported.
        force_writes (bool): No longer supported.

    Returns:
        List[:class:`~google.cloud.ndb.key.Key`]: A list with the stored keys.
    """
    futures = [entity.put_async(_options=_options) for entity in entities]
    return [future.result() for future in futures]


@options_module.Options.options
@utils.positional(1)
def delete_multi_async(
    keys,
    retries=None,
    timeout=None,
    deadline=None,
    use_cache=None,
    use_global_cache=None,
    global_cache_timeout=None,
    use_datastore=None,
    use_memcache=None,
    memcache_timeout=None,
    max_memcache_items=None,
    force_writes=None,
    _options=None,
):
    """Deletes a sequence of keys.

    Args:
        retries (int): Number of times to retry this operation in the case
            of transient server errors. Operation will potentially be tried
            up to ``retries`` + 1 times. Set to ``0`` to try operation only
            once, with no retries.
        keys (Sequence[:class:`~google.cloud.ndb.key.Key`]): A sequence of
            keys.
        timeout (float): Override the gRPC timeout, in seconds.
        deadline (float): DEPRECATED: Synonym for ``timeout``.
        use_cache (bool): Specifies whether to store entities in in-process
            cache; overrides in-process cache policy for this operation.
        use_global_cache (bool): Specifies whether to store entities in
            global cache; overrides global cache policy for this operation.
        use_datastore (bool): Specifies whether to store entities in
            Datastore; overrides Datastore policy for this operation.
        global_cache_timeout (int): Maximum lifetime for entities in global
            cache; overrides global cache timeout policy for this
            operation.
        use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
        memcache_timeout (int): DEPRECATED: Synonym for
            ``global_cache_timeout``.
        max_memcache_items (int): No longer supported.
        force_writes (bool): No longer supported.

    Returns:
        List[:class:`~google.cloud.ndb.tasklets.Future`]: List of futures.
    """
    return [key.delete_async(_options=_options) for key in keys]


@options_module.Options.options
@utils.positional(1)
def delete_multi(
    keys,
    retries=None,
    timeout=None,
    deadline=None,
    use_cache=None,
    use_global_cache=None,
    global_cache_timeout=None,
    use_datastore=None,
    use_memcache=None,
    memcache_timeout=None,
    max_memcache_items=None,
    force_writes=None,
    _options=None,
):
    """Deletes a sequence of keys.

    Args:
        keys (Sequence[:class:`~google.cloud.ndb.key.Key`]): A sequence of
            keys.
        retries (int): Number of times to retry this operation in the case
            of transient server errors. Operation will potentially be tried
            up to ``retries`` + 1 times. Set to ``0`` to try operation only
            once, with no retries.
        timeout (float): Override the gRPC timeout, in seconds.
        deadline (float): DEPRECATED: Synonym for ``timeout``.
        use_cache (bool): Specifies whether to store entities in in-process
            cache; overrides in-process cache policy for this operation.
        use_global_cache (bool): Specifies whether to store entities in
            global cache; overrides global cache policy for this operation.
        use_datastore (bool): Specifies whether to store entities in
            Datastore; overrides Datastore policy for this operation.
        global_cache_timeout (int): Maximum lifetime for entities in global
            cache; overrides global cache timeout policy for this
            operation.
        use_memcache (bool): DEPRECATED: Synonym for ``use_global_cache``.
        memcache_timeout (int): DEPRECATED: Synonym for
            ``global_cache_timeout``.
        max_memcache_items (int): No longer supported.
        force_writes (bool): No longer supported.

    Returns:
        List[:data:`None`]: A list whose items are all None, one per deleted
            key.
    """
    futures = [key.delete_async(_options=_options) for key in keys]
    return [future.result() for future in futures]


def get_indexes_async(**options):
    """Get a data structure representing the configured indexes."""
    raise NotImplementedError


def get_indexes(**options):
    """Get a data structure representing the configured indexes."""
    raise NotImplementedError


def _unpack_user(v):
    """Internal helper to unpack a User value from a protocol buffer."""
    uv = v.uservalue()
    email = str(uv.email().decode("utf-8"))
    auth_domain = str(uv.auth_domain().decode("utf-8"))
    obfuscated_gaiaid = uv.obfuscated_gaiaid().decode("utf-8")
    obfuscated_gaiaid = str(obfuscated_gaiaid)

    value = User(
        email=email,
        _auth_domain=auth_domain,
        _user_id=obfuscated_gaiaid,
    )
    return value
