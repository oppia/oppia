# Copyright 2014 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Class for representing a single entity in the Cloud Datastore."""


from google.cloud._helpers import _ensure_tuple_or_list


class Entity(dict):
    """Entities are akin to rows in a relational database

    An entity storing the actual instance of data.

    Each entity is officially represented with a
    :class:`~google.cloud.datastore.key.Key`, however it is possible that
    you might create an entity with only a partial key (that is, a key
    with a kind, and possibly a parent, but without an ID).  In such a
    case, the datastore service will automatically assign an ID to the
    partial key.

    Entities in this API act like dictionaries with extras built in that
    allow you to delete or persist the data stored on the entity.

    Entities are mutable and act like a subclass of a dictionary.
    This means you could take an existing entity and change the key
    to duplicate the object.

    Use :meth:`~google.cloud.datastore.client.Client.get` to retrieve an
    existing entity:

    .. testsetup:: entity-ctor

        import uuid

        from google.cloud import datastore

        unique = str(uuid.uuid4())[0:8]
        client = datastore.Client(namespace='ns{}'.format(unique))

        entity = datastore.Entity(client.key('EntityKind', 1234))
        entity['property'] = 'value'
        client.put(entity)

    .. doctest:: entity-ctor

        >>> key = client.key('EntityKind', 1234)
        >>> client.get(key)
        <Entity('EntityKind', 1234) {'property': 'value'}>

    You can the set values on the entity just like you would on any
    other dictionary.

    .. doctest:: entity-ctor

        >>> entity['age'] = 20
        >>> entity['name'] = 'JJ'

    .. testcleanup:: entity-ctor

        client.delete(entity.key)

    However, not all types are allowed as a value for a Google Cloud Datastore
    entity. The following basic types are supported by the API:

    * :class:`datetime.datetime`
    * :class:`~google.cloud.datastore.key.Key`
    * :class:`bool`
    * :class:`float`
    * :class:`int` (as well as :class:`long` in Python 2)
    * ``unicode`` (called ``str`` in Python 3)
    * ``bytes`` (called ``str`` in Python 2)
    * :class:`~google.cloud.datastore.helpers.GeoPoint`
    * :data:`None`

    In addition, three container types are supported:

    * :class:`list`
    * :class:`~google.cloud.datastore.entity.Entity`
    * :class:`dict` (will just be treated like an ``Entity`` without
      a key or ``exclude_from_indexes``)

    Each entry in a list must be one of the value types (basic or
    container) and each value in an
    :class:`~google.cloud.datastore.entity.Entity` must as well. In
    this case an :class:`~google.cloud.datastore.entity.Entity` **as a
    container** acts as a :class:`dict`, but also has the special annotations
    of ``key`` and ``exclude_from_indexes``.

    And you can treat an entity like a regular Python dictionary:

    .. testsetup:: entity-dict

        from google.cloud import datastore

        entity = datastore.Entity()
        entity['age'] = 20
        entity['name'] = 'JJ'

    .. doctest:: entity-dict

        >>> sorted(entity.keys())
        ['age', 'name']
        >>> sorted(entity.items())
        [('age', 20), ('name', 'JJ')]

    .. note::

        When saving an entity to the backend, values which are "text"
        (``unicode`` in Python2, ``str`` in Python3) will be saved using
        the 'text_value' field, after being encoded to UTF-8.  When
        retrieved from the back-end, such values will be decoded to "text"
        again.  Values which are "bytes" (``str`` in Python2, ``bytes`` in
        Python3), will be saved using the 'blob_value' field, without
        any decoding / encoding step.

    :type key: :class:`google.cloud.datastore.key.Key`
    :param key: Optional key to be set on entity.

    :type exclude_from_indexes: tuple of string
    :param exclude_from_indexes: Names of fields whose values are not to be
                                 indexed for this entity.
    """

    def __init__(self, key=None, exclude_from_indexes=()):
        super(Entity, self).__init__()
        self.key = key
        self.exclude_from_indexes = set(
            _ensure_tuple_or_list("exclude_from_indexes", exclude_from_indexes)
        )
        """Names of fields which are *not* to be indexed for this entity."""
        # NOTE: This will be populated when parsing a protobuf in
        #       google.cloud.datastore.helpers.entity_from_protobuf.
        self._meanings = {}

    def __eq__(self, other):
        """Compare two entities for equality.

        Entities compare equal if their keys compare equal and their
        properties compare equal.

        :rtype: bool
        :returns: True if the entities compare equal, else False.
        """
        if not isinstance(other, Entity):
            return NotImplemented

        return (
            self.key == other.key
            and self.exclude_from_indexes == other.exclude_from_indexes
            and self._meanings == other._meanings
            and super(Entity, self).__eq__(other)
        )

    def __ne__(self, other):
        """Compare two entities for inequality.

        Entities compare equal if their keys compare equal and their
        properties compare equal.

        :rtype: bool
        :returns: False if the entities compare equal, else True.
        """
        return not self == other

    @property
    def kind(self):
        """Get the kind of the current entity.

        .. note::

            This relies entirely on the :class:`google.cloud.datastore.key.Key`
            set on the entity.  That means that we're not storing the kind
            of the entity at all, just the properties and a pointer to a
            Key which knows its Kind.
        """
        if self.key:
            return self.key.kind

    @property
    def id(self):
        """Get the ID of the current entity.

        .. note::

            This relies entirely on the :class:`google.cloud.datastore.key.Key`
            set on the entity.  That means that we're not storing the ID
            of the entity at all, just the properties and a pointer to a
            Key which knows its ID.
        """
        if self.key is None:
            return None
        else:
            return self.key.id

    def __repr__(self):
        if self.key:
            return "<Entity%s %s>" % (
                self.key._flat_path,
                super(Entity, self).__repr__(),
            )
        else:
            return "<Entity %s>" % (super(Entity, self).__repr__(),)
