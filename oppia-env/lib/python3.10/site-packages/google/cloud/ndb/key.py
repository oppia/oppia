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

"""Provides a :class:`.Key` for Google Cloud Datastore.

.. testsetup:: *

    from google.cloud import ndb

A key encapsulates the following pieces of information, which together
uniquely designate a (possible) entity in Google Cloud Datastore:

* a Google Cloud Platform project (a string)
* a list of one or more ``(kind, id)`` pairs where ``kind`` is a string
  and ``id`` is either a string or an integer
* an optional database (a string)
* an optional namespace (a string)

The application ID must always be part of the key, but since most
applications can only access their own entities, it defaults to the
current application ID and you rarely need to worry about it.

The database is an optional database ID. If unspecified, it defaults
to that of the client.
For usage in Cloud NDB, the default database should always be referred
to as an empty string; please do not use "(default)".

The namespace designates a top-level partition of the key space for a
particular application. If you've never heard of namespaces, you can
safely ignore this feature.

Most of the action is in the ``(kind, id)`` pairs. A key must have at
least one ``(kind, id)`` pair. The last ``(kind, id)`` pair gives the kind
and the ID of the entity that the key refers to, the others merely
specify a "parent key".

The kind is a string giving the name of the model class used to
represent the entity. In more traditional databases this would be
the table name. A model class is a Python class derived from
:class:`.Model`. Only the class name itself is used as the kind. This means
all your model classes must be uniquely named within one application. You can
override this on a per-class basis.

The ID is either a string or an integer. When the ID is a string, the
application is in control of how it assigns IDs. For example, you
could use an email address as the ID for Account entities.

To use integer IDs, it's common to let the datastore choose a unique ID for
an entity when first inserted into the datastore. The ID can be set to
:data:`None` to represent the key for an entity that hasn't yet been
inserted into the datastore. The completed key (including the assigned ID)
will be returned after the entity is successfully inserted into the datastore.

A key for which the ID of the last ``(kind, id)`` pair is set to :data:`None`
is called an **incomplete key** or **partial key**. Such keys can only be used
to insert entities into the datastore.

A key with exactly one ``(kind, id)`` pair is called a top level key or a
root key. Top level keys are also used as entity groups, which play a
role in transaction management.

If there is more than one ``(kind, id)`` pair, all but the last pair
represent the "ancestor path", also known as the key of the "parent entity".

Other constraints:

* Kinds and string IDs must not be empty and must be at most 1500 bytes
  long (after UTF-8 encoding)
* Integer IDs must be at least ``1`` and at most ``2**63 - 1`` (i.e. the
  positive part of the range for a 64-bit signed integer)

In the "legacy" Google App Engine runtime, the default namespace could be
set via the namespace manager (``google.appengine.api.namespace_manager``).
On the gVisor Google App Engine runtime (e.g. Python 3.7), the namespace
manager is not available so the default is to have an unset or empty
namespace. To explicitly select the empty namespace pass ``namespace=""``.
"""


import base64
import functools

from google.cloud.datastore import _app_engine_key_pb2
from google.cloud.datastore import key as _key_module
import google.cloud.datastore

from google.cloud.ndb import exceptions
from google.cloud.ndb import _options
from google.cloud.ndb import tasklets
from google.cloud.ndb import utils

__all__ = ["Key", "UNDEFINED"]
_APP_ID_ENVIRONMENT = "APPLICATION_ID"
_APP_ID_DEFAULT = "_"
_WRONG_TYPE = "Cannot construct Key reference on non-Key class; received {!r}"
_REFERENCE_APP_MISMATCH = (
    "Key reference constructed uses a different app {!r} than the one specified {!r}"
)
_REFERENCE_DATABASE_MISMATCH = "Key reference constructed uses a different database {!r} than the one specified {!r}"
_REFERENCE_NAMESPACE_MISMATCH = (
    "Key reference constructed uses a different namespace {!r} than "
    "the one specified {!r}"
)
_INVALID_ID_TYPE = "Key ID must be a string or a number; received {!r}"
_NO_LEGACY = "The `google.appengine.ext.db` module is not available."
_MAX_INTEGER_ID = 0x7FFFFFFFFFFFFFFF  # 2 ** 63 - 1
_MAX_KEYPART_BYTES = 1500
_BAD_KIND = "Key kind string must be a non-empty string up to {:d} bytes; received {}"
_BAD_INTEGER_ID = "Key ID number is outside of range [1, 2^63 - 1]; received {:d}"
_BAD_STRING_ID = (
    "Key name strings must be non-empty strings up to {:d} bytes; received {}"
)

UNDEFINED = object()
"""Sentinel value.

Used to indicate a database or namespace hasn't been explicitly set in key construction.
Used to distinguish between not passing a value and passing `None`, which
indicates the default database/namespace.
"""


class Key(object):
    """An immutable datastore key.

    For flexibility and convenience, multiple constructor signatures are
    supported.

    The primary way to construct a key is using positional arguments:

    .. testsetup:: *

        from unittest import mock
        from google.cloud.ndb import context as context_module
        client = mock.Mock(
            project="testing",
            database=None,
            namespace=None,
            stub=mock.Mock(spec=()),
            spec=("project", "database", "namespace", "stub"),
        )
        context = context_module.Context(client).use()
        context.__enter__()
        kind1, id1 = "Parent", "C"
        kind2, id2 = "Child", 42

    .. testcleanup:: *

        context.__exit__(None, None, None)

    .. doctest:: key-constructor-primary

        >>> ndb.Key(kind1, id1, kind2, id2)
        Key('Parent', 'C', 'Child', 42)

    This is shorthand for either of the following two longer forms:

    .. doctest:: key-constructor-flat-or-pairs

        >>> ndb.Key(pairs=[(kind1, id1), (kind2, id2)])
        Key('Parent', 'C', 'Child', 42)
        >>> ndb.Key(flat=[kind1, id1, kind2, id2])
        Key('Parent', 'C', 'Child', 42)

    Either of the above constructor forms can additionally pass in another
    key via the ``parent`` keyword. The ``(kind, id)`` pairs of the parent key
    are inserted before the ``(kind, id)`` pairs passed explicitly.

    .. doctest:: key-constructor-parent

        >>> parent = ndb.Key(kind1, id1)
        >>> parent
        Key('Parent', 'C')
        >>> ndb.Key(kind2, id2, parent=parent)
        Key('Parent', 'C', 'Child', 42)

    You can also construct a Key from a "urlsafe" encoded string:

    .. doctest:: key-constructor-urlsafe

        >>> ndb.Key(urlsafe=b"agdleGFtcGxlcgsLEgRLaW5kGLkKDA")
        Key('Kind', 1337, project='example')

    For rare use cases the following constructors exist:

    .. testsetup:: key-constructor-rare

        from google.cloud.datastore import _app_engine_key_pb2
        reference = _app_engine_key_pb2.Reference(
            app="example",
            path=_app_engine_key_pb2.Path(element=[
                _app_engine_key_pb2.Path.Element(type="Kind", id=1337),
            ]),
        )

    .. doctest:: key-constructor-rare

        >>> # Passing in a low-level Reference object
        >>> reference
        app: "example"
        path {
          element {
            type: "Kind"
            id: 1337
          }
        }
        <BLANKLINE>
        >>> ndb.Key(reference=reference)
        Key('Kind', 1337, project='example')
        >>> # Passing in a serialized low-level Reference
        >>> serialized = reference.SerializeToString()
        >>> serialized
        b'j\\x07exampler\\x0b\\x0b\\x12\\x04Kind\\x18\\xb9\\n\\x0c'
        >>> ndb.Key(serialized=serialized)
        Key('Kind', 1337, project='example')
        >>> # For unpickling, the same as ndb.Key(**kwargs)
        >>> kwargs = {"pairs": [("Cheese", "Cheddar")], "namespace": "good"}
        >>> ndb.Key(kwargs)
        Key('Cheese', 'Cheddar', namespace='good')

    The "urlsafe" string is really a websafe-base64-encoded serialized
    ``Reference``, but it's best to think of it as just an opaque unique
    string.

    If a ``Reference`` is passed (using one of the ``reference``,
    ``serialized`` or ``urlsafe`` keywords), the positional arguments and
    ``namespace`` must match what is already present in the ``Reference``
    (after decoding if necessary). The parent keyword cannot be combined with
    a ``Reference`` in any form.

    Keys are immutable, which means that a Key object cannot be modified
    once it has been created. This is enforced by the implementation as
    well as Python allows.

    Keys also support interaction with the datastore; the methods :meth:`get`,
    :meth:`get_async`, :meth:`delete` and :meth:`delete_async` are
    the only ones that engage in any kind of I/O activity.

    Keys may be pickled.

    Subclassing Key is best avoided; it would be hard to get right.

    Args:
        path_args (Union[Tuple[str, ...], Tuple[Dict]]): Either a tuple of
            ``(kind, id)`` pairs or a single dictionary containing only keyword
            arguments.
        reference (Optional[\
            ~google.cloud.datastore._app_engine_key_pb2.Reference]): A
            reference protobuf representing a key.
        serialized (Optional[bytes]): A reference protobuf serialized to bytes.
        urlsafe (Optional[bytes]): A reference protobuf serialized to bytes. The
            raw bytes are then converted to a websafe base64-encoded string.
        pairs (Optional[Iterable[Tuple[str, Union[str, int]]]]): An iterable
            of ``(kind, id)`` pairs. If this argument is used, then
            ``path_args`` should be empty.
        flat (Optional[Iterable[Union[str, int]]]): An iterable of the
            ``(kind, id)`` pairs but flattened into a single value. For
            example, the pairs ``[("Parent", 1), ("Child", "a")]`` would be
            flattened to ``["Parent", 1, "Child", "a"]``.
        project (Optional[str]): The Google Cloud Platform project (previously
            on Google App Engine, this was called the Application ID).
        app (Optional[str]): DEPRECATED: Synonym for ``project``.
        namespace (Optional[str]): The namespace for the key.
        parent (Optional[Key]): The parent of the key being
            constructed. If provided, the key path will be **relative** to the
            parent key's path.
        database (Optional[str]): The database to use.
            Defaults to that of the client if a parent was specified, and
            to the default database if it was not.

    Raises:
        TypeError: If none of ``reference``, ``serialized``, ``urlsafe``,
            ``pairs`` or ``flat`` is provided as an argument and no positional
            arguments were given with the path.
    """

    _hash_value = None

    def __new__(cls, *path_args, **kwargs):
        _constructor_handle_positional(path_args, kwargs)
        instance = super(Key, cls).__new__(cls)

        if "reference" in kwargs or "serialized" in kwargs or "urlsafe" in kwargs:
            ds_key, reference = _parse_from_ref(cls, **kwargs)
        elif "pairs" in kwargs or "flat" in kwargs:
            ds_key = _parse_from_args(**kwargs)
            reference = None
        else:
            raise TypeError("Key() cannot create a Key instance without arguments.")

        instance._key = ds_key
        instance._reference = reference
        return instance

    @classmethod
    def _from_ds_key(cls, ds_key):
        """Factory constructor for a :class:`~google.cloud.datastore.key.Key`.

        This bypasses the actual constructor and directly sets the ``_key``
        attribute to ``ds_key``.

        Args:
            ds_key (~google.cloud.datastore.key.Key): A key from
                ``google-cloud-datastore``.

        Returns:
            Key: The constructed :class:`Key`.
        """
        key = super(Key, cls).__new__(cls)
        key._key = ds_key
        key._reference = None
        return key

    def __repr__(self):
        """String representation used by :class:`str() <str>` and :func:`repr`.

        We produce a short string that conveys all relevant information,
        suppressing project, database, and namespace when they are equal to their
        respective defaults.

        In many cases, this string should be able to be used to invoke the constructor.

        For example:

        .. doctest:: key-repr

            >>> key = ndb.Key("hi", 100)
            >>> repr(key)
            "Key('hi', 100)"
            >>>
            >>> key = ndb.Key(
            ...     "bye", "hundred", project="specific", database="db", namespace="space",
            ... )
            >>> str(key)
            "Key('bye', 'hundred', project='specific', database='db', namespace='space')"
        """
        args = ["{!r}".format(item) for item in self.flat()]
        if self.project() != _project_from_app(None):
            args.append("project={!r}".format(self.app()))
        if self.database():
            args.append("database={!r}".format(self.database()))
        if self.namespace() is not None:
            args.append("namespace={!r}".format(self.namespace()))

        return "Key({})".format(", ".join(args))

    def __str__(self):
        """Alias for :meth:`__repr__`."""
        return self.__repr__()

    def __hash__(self):
        """Hash value, for use in dictionary lookups.

        .. note::

            This ignores ``app``, ``database``, and ``namespace``. Since :func:`hash` isn't
            expected to return a unique value (it just reduces the chance of
            collision), this doesn't try to increase entropy by including other
            values. The primary concern is that hashes of equal keys are
            equal, not the other way around.
        """
        hash_value = self._hash_value
        if hash_value is None:
            self._hash_value = hash_value = hash(self.pairs())
        return hash_value

    def _tuple(self):
        """Helper to return an orderable tuple."""
        return (self.app(), self.namespace(), self.database() or "", self.pairs())

    def __eq__(self, other):
        """Equality comparison operation."""
        if not isinstance(other, Key):
            return NotImplemented

        return self._tuple() == other._tuple()

    def __ne__(self, other):
        """The opposite of __eq__."""
        if not isinstance(other, Key):
            return NotImplemented
        return not self.__eq__(other)

    def __lt__(self, other):
        """Less than ordering."""
        if not isinstance(other, Key):
            raise TypeError
        return self._tuple() < other._tuple()

    def __le__(self, other):
        """Less than or equal ordering."""
        if not isinstance(other, Key):
            raise TypeError
        return self._tuple() <= other._tuple()

    def __gt__(self, other):
        """Greater than ordering."""
        if not isinstance(other, Key):
            raise TypeError
        return not self <= other

    def __ge__(self, other):
        """Greater than or equal ordering."""
        if not isinstance(other, Key):
            raise TypeError
        return not self < other

    def __getstate__(self):
        """Private API used for pickling.

        Returns:
            Tuple[Dict[str, Any]]: A tuple containing a single dictionary of
            state to pickle. The dictionary has four keys: ``pairs``, ``app``,
            ``database``, and ``namespace``.
        """
        to_pickle = (
            {
                "pairs": self.pairs(),
                "app": self.app(),
                "namespace": self.namespace(),
            },
        )
        if self.database():
            to_pickle[0]["database"] = self.database()
        return to_pickle

    def __setstate__(self, state):
        """Private API used for unpickling.

        Args:
            state (Tuple[Dict[str, Any]]): A tuple containing a single
                dictionary of pickled state. This should match the signature
                returned from :func:`__getstate__`, in particular, it should
                have four keys: ``pairs``, ``app``, ``database``, and ``namespace``.

        Raises:
            TypeError: If the ``state`` does not have length 1.
            TypeError: If the single element in ``state`` is not a dictionary.
        """
        if len(state) != 1:
            msg = "Invalid state length, expected 1; received {:d}".format(len(state))
            raise TypeError(msg)

        kwargs = state[0]
        if not isinstance(kwargs, dict):
            raise TypeError(
                "Key accepts a dict of keyword arguments as state; "
                "received {!r}".format(kwargs)
            )

        flat = _get_path(None, kwargs["pairs"])
        _clean_flat_path(flat)
        project = _project_from_app(kwargs["app"])

        database = None
        if "database" in kwargs:
            database = kwargs["database"]

        self._key = _key_module.Key(
            *flat,
            project=project,
            namespace=kwargs["namespace"],
            database=database,
        )
        self._reference = None

    def __getnewargs__(self):
        """Private API used to specify ``__new__`` arguments when unpickling.

        .. note::

            This method is provided for backwards compatibility, though it
            isn't needed.

        Returns:
            Tuple[Dict[str, Any]]: A tuple containing a single dictionary of
            state to pickle. The dictionary has four keys: ``pairs``, ``app``,
            ``database`` and ``namespace``.
        """
        return (
            {
                "pairs": self.pairs(),
                "app": self.app(),
                "namespace": self.namespace(),
                "database": self.database() if self.database() is not None else None,
            },
        )

    def parent(self):
        """Parent key constructed from all but the last ``(kind, id)`` pairs.

        If there is only one ``(kind, id)`` pair, return :data:`None`.

        .. doctest:: key-parent

            >>> key = ndb.Key(
            ...     pairs=[
            ...         ("Purchase", "Food"),
            ...         ("Type", "Drink"),
            ...         ("Coffee", 11),
            ...     ]
            ... )
            >>> parent = key.parent()
            >>> parent
            Key('Purchase', 'Food', 'Type', 'Drink')
            >>>
            >>> grandparent = parent.parent()
            >>> grandparent
            Key('Purchase', 'Food')
            >>>
            >>> grandparent.parent() is None
            True
        """
        if self._key.parent is None:
            return None
        return Key._from_ds_key(self._key.parent)

    def root(self):
        """The root key.

        This is either the current key or the highest parent.

        .. doctest:: key-root

            >>> key = ndb.Key("a", 1, "steak", "sauce")
            >>> root_key = key.root()
            >>> root_key
            Key('a', 1)
            >>> root_key.root() is root_key
            True
        """
        root_key = self._key
        while root_key.parent is not None:
            root_key = root_key.parent

        if root_key is self._key:
            return self

        return Key._from_ds_key(root_key)

    def namespace(self):
        """The namespace for the key, if set.

        .. doctest:: key-namespace

            >>> key = ndb.Key("A", "B")
            >>> key.namespace() is None
            True
            >>>
            >>> key = ndb.Key("A", "B", namespace="rock")
            >>> key.namespace()
            'rock'
        """
        return self._key.namespace

    def project(self):
        """The project ID for the key.

        .. warning::

            This **may** differ from the original ``app`` passed in to the
            constructor. This is because prefixed application IDs like
            ``s~example`` are "legacy" identifiers from Google App Engine.
            They have been replaced by equivalent project IDs, e.g. here it
            would be ``example``.

        .. doctest:: key-app

            >>> key = ndb.Key("A", "B", project="s~example")
            >>> key.project()
            'example'
            >>>
            >>> key = ndb.Key("A", "B", project="example")
            >>> key.project()
            'example'
        """
        return self._key.project

    app = project

    def database(self):
        """The database ID for the key.

        .. doctest:: key-database

           >>> key = ndb.Key("A", "B", database="mydb")
           >>> key.database()
           'mydb'
        """
        return self._key.database

    def id(self):
        """The string or integer ID in the last ``(kind, id)`` pair, if any.

        .. doctest:: key-id

            >>> key_int = ndb.Key("A", 37)
            >>> key_int.id()
            37
            >>> key_str = ndb.Key("A", "B")
            >>> key_str.id()
            'B'
            >>> key_partial = ndb.Key("A", None)
            >>> key_partial.id() is None
            True
        """
        return self._key.id_or_name

    def string_id(self):
        """The string ID in the last ``(kind, id)`` pair, if any.

        .. doctest:: key-string-id

            >>> key_int = ndb.Key("A", 37)
            >>> key_int.string_id() is None
            True
            >>> key_str = ndb.Key("A", "B")
            >>> key_str.string_id()
            'B'
            >>> key_partial = ndb.Key("A", None)
            >>> key_partial.string_id() is None
            True
        """
        return self._key.name

    def integer_id(self):
        """The integer ID in the last ``(kind, id)`` pair, if any.

        .. doctest:: key-integer-id

            >>> key_int = ndb.Key("A", 37)
            >>> key_int.integer_id()
            37
            >>> key_str = ndb.Key("A", "B")
            >>> key_str.integer_id() is None
            True
            >>> key_partial = ndb.Key("A", None)
            >>> key_partial.integer_id() is None
            True
        """
        return self._key.id

    def pairs(self):
        """The ``(kind, id)`` pairs for the key.

        .. doctest:: key-pairs

            >>> key = ndb.Key("Satellite", "Moon", "Space", "Dust")
            >>> key.pairs()
            (('Satellite', 'Moon'), ('Space', 'Dust'))
            >>>
            >>> partial_key = ndb.Key("Known", None)
            >>> partial_key.pairs()
            (('Known', None),)
        """
        flat = self.flat()
        pairs = []
        for i in range(0, len(flat), 2):
            pairs.append(flat[i : i + 2])  # noqa: E203
        return tuple(pairs)

    def flat(self):
        """The flat path for the key.

        .. doctest:: key-flat

            >>> key = ndb.Key("Satellite", "Moon", "Space", "Dust")
            >>> key.flat()
            ('Satellite', 'Moon', 'Space', 'Dust')
            >>>
            >>> partial_key = ndb.Key("Known", None)
            >>> partial_key.flat()
            ('Known', None)
        """
        flat_path = self._key.flat_path
        if len(flat_path) % 2 == 1:
            flat_path += (None,)
        return flat_path

    def kind(self):
        """The kind of the entity referenced.

        This comes from the last ``(kind, id)`` pair.

        .. doctest:: key-kind

            >>> key = ndb.Key("Satellite", "Moon", "Space", "Dust")
            >>> key.kind()
            'Space'
            >>>
            >>> partial_key = ndb.Key("Known", None)
            >>> partial_key.kind()
            'Known'
        """
        return self._key.kind

    def reference(self):
        """The ``Reference`` protobuf object for this key.

        The return value will be stored on the current key, so the caller
        promises not to mutate it.

        .. doctest:: key-reference

            >>> key = ndb.Key("Trampoline", 88, project="xy", database="wv", namespace="zt")
            >>> key.reference()
            app: "xy"
            path {
              element {
                type: "Trampoline"
                id: 88
              }
            }
            name_space: "zt"
            database_id: "wv"
            <BLANKLINE>
        """
        if self._reference is None:
            if self._key.database:
                self._reference = _app_engine_key_pb2.Reference(
                    app=self._key.project,
                    path=_to_legacy_path(self._key.path),
                    database_id=self._key.database,
                    name_space=self._key.namespace,
                )
            else:
                self._reference = _app_engine_key_pb2.Reference(
                    app=self._key.project,
                    path=_to_legacy_path(self._key.path),
                    name_space=self._key.namespace,
                )
        return self._reference

    def serialized(self):
        """A ``Reference`` protobuf serialized to bytes.

        .. doctest:: key-serialized

            >>> key = ndb.Key("Kind", 1337, project="example", database="example-db")
            >>> key.serialized()
            b'j\\x07exampler\\x0b\\x0b\\x12\\x04Kind\\x18\\xb9\\n\\x0c\\xba\\x01\\nexample-db'
        """
        reference = self.reference()
        return reference.SerializeToString()

    def urlsafe(self):
        """A ``Reference`` protobuf serialized and encoded as urlsafe base 64.

        .. doctest:: key-urlsafe

            >>> key = ndb.Key("Kind", 1337, project="example")
            >>> key.urlsafe()
            b'agdleGFtcGxlcgsLEgRLaW5kGLkKDA'
        """
        raw_bytes = self.serialized()
        return base64.urlsafe_b64encode(raw_bytes).strip(b"=")

    def to_legacy_urlsafe(self, location_prefix):
        """
        A urlsafe serialized ``Reference`` protobuf with an App Engine prefix.

        This will produce a urlsafe string which includes an App Engine
        location prefix ("partition"), compatible with the Google Datastore
        admin console.

        This only supports the default database. For a named database,
        please use urlsafe() instead.

        Arguments:
            location_prefix (str): A location prefix ("partition") to be
                prepended to the key's `project` when serializing the key. A
                typical value is "s~", but "e~" or other partitions are
                possible depending on the project's region and other factors.

        .. doctest:: key-legacy-urlsafe

            >>> key = ndb.Key("Kind", 1337, project="example")
            >>> key.to_legacy_urlsafe("s~")
            b'aglzfmV4YW1wbGVyCwsSBEtpbmQYuQoM'
        """
        if self._key.database:
            raise ValueError("to_legacy_urlsafe only supports the default database")
        return google.cloud.datastore.Key(
            *self.flat(),
            **{"namespace": self._key.namespace, "project": self._key.project},
        ).to_legacy_urlsafe(location_prefix=location_prefix)

    @_options.ReadOptions.options
    @utils.positional(1)
    def get(
        self,
        read_consistency=None,
        read_policy=None,
        transaction=None,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        use_datastore=None,
        global_cache_timeout=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    ):
        """Synchronously get the entity for this key.

        Returns the retrieved :class:`.Model` or :data:`None` if there is no
        such entity.

        Args:
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
            Union[:class:`.Model`, :data:`None`]
        """
        return self.get_async(_options=_options).result()

    @_options.ReadOptions.options
    @utils.positional(1)
    def get_async(
        self,
        read_consistency=None,
        read_policy=None,
        transaction=None,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        use_datastore=None,
        global_cache_timeout=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    ):
        """Asynchronously get the entity for this key.

        The result for the returned future will either be the retrieved
        :class:`.Model` or :data:`None` if there is no such entity.

        Args:
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
            :class:`~google.cloud.ndb.tasklets.Future`
        """
        # Avoid circular import in Python 2.7
        from google.cloud.ndb import model
        from google.cloud.ndb import context as context_module
        from google.cloud.ndb import _datastore_api

        cls = model.Model._kind_map.get(self.kind())

        if cls:
            cls._pre_get_hook(self)

        @tasklets.tasklet
        def get():
            context = context_module.get_context()
            use_cache = context._use_cache(self, _options)

            if use_cache:
                try:
                    # This result may be None, if None is cached for this key.
                    result = context.cache.get_and_validate(self)
                except KeyError:
                    pass
                else:
                    raise tasklets.Return(result)

            entity_pb = yield _datastore_api.lookup(self._key, _options)
            if entity_pb is not _datastore_api._NOT_FOUND:
                result = model._entity_from_protobuf(entity_pb)
            else:
                result = None

            if use_cache:
                context.cache[self] = result

            raise tasklets.Return(result)

        future = get()
        if cls:
            future.add_done_callback(functools.partial(cls._post_get_hook, self))
        return future

    @_options.Options.options
    @utils.positional(1)
    def delete(
        self,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        use_datastore=None,
        global_cache_timeout=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    ):
        """Synchronously delete the entity for this key.

        This is a no-op if no such entity exists.

        Note:
            If in a transaction, the entity can only be deleted at transaction
            commit time. In that case, this function will schedule the entity
            to be deleted as part of the transaction and will return
            immediately, which is effectively the same as calling
            :meth:`delete_async` and ignoring the returned future. If not in a
            transaction, this function will block synchronously until the
            entity is deleted, as one would expect.

        Args:
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
        """
        # Avoid circular import in Python 2.7
        from google.cloud.ndb import _transaction

        future = self.delete_async(_options=_options)
        if not _transaction.in_transaction():
            return future.result()

    @_options.Options.options
    @utils.positional(1)
    def delete_async(
        self,
        retries=None,
        timeout=None,
        deadline=None,
        use_cache=None,
        use_global_cache=None,
        use_datastore=None,
        global_cache_timeout=None,
        use_memcache=None,
        memcache_timeout=None,
        max_memcache_items=None,
        force_writes=None,
        _options=None,
    ):
        """Schedule deletion of the entity for this key.

        The result of the returned future becomes available once the
        deletion is complete. In all cases the future's result is :data:`None`
        (i.e. there is no way to tell whether the entity existed or not).

        Args:
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
        """
        # Avoid circular import in Python 2.7
        from google.cloud.ndb import model
        from google.cloud.ndb import context as context_module
        from google.cloud.ndb import _datastore_api

        cls = model.Model._kind_map.get(self.kind())
        if cls:
            cls._pre_delete_hook(self)

        @tasklets.tasklet
        def delete():
            result = yield _datastore_api.delete(self._key, _options)

            context = context_module.get_context()
            if context._use_cache(self, _options):
                context.cache[self] = None

            raise tasklets.Return(result)

        future = delete()

        if cls:
            future.add_done_callback(functools.partial(cls._post_delete_hook, self))

        return future

    @classmethod
    def from_old_key(cls, old_key):
        """Factory constructor to convert from an "old"-style datastore key.

        The ``old_key`` was expected to be a ``google.appengine.ext.db.Key``
        (which was an alias for ``google.appengine.api.datastore_types.Key``).

        However, the ``google.appengine.ext.db`` module was part of the legacy
        Google App Engine runtime and is not generally available.

        Raises:
            NotImplementedError: Always.
        """
        raise NotImplementedError(_NO_LEGACY)

    def to_old_key(self):
        """Convert to an "old"-style datastore key.

        See :meth:`from_old_key` for more information on why this method
        is not supported.

        Raises:
            NotImplementedError: Always.
        """
        raise NotImplementedError(_NO_LEGACY)


def _project_from_app(app, allow_empty=False):
    """Convert a legacy Google App Engine app string to a project.

    Args:
        app (str): The application value to be used. If the caller passes
            :data:`None` and ``allow_empty`` is :data:`False`, then this will
            use the project set by the current client context. (See
            :meth:`~client.Client.context`.)
        allow_empty (bool): Flag determining if an empty (i.e. :data:`None`)
            project is allowed. Defaults to :data:`False`.

    Returns:
        str: The cleaned project.
    """
    # Avoid circular import in Python 2.7
    from google.cloud.ndb import context as context_module

    if app is None:
        if allow_empty:
            return None
        client = context_module.get_context().client
        app = client.project

    # NOTE: This is the same behavior as in the helper
    #       ``google.cloud.datastore.key._clean_app()``.
    parts = app.split("~", 1)
    return parts[-1]


def _from_reference(reference, app, namespace, database):
    """Convert Reference protobuf to :class:`~google.cloud.datastore.key.Key`.

    This is intended to work with the "legacy" representation of a
    datastore "Key" used within Google App Engine (a so-called
    "Reference"). This assumes that ``serialized`` was created within an App
    Engine app via something like ``ndb.Key(...).reference()``.

    However, the actual type used here is different since this code will not
    run in the App Engine standard environment where the type was
    ``google.appengine.datastore.entity_pb.Reference``.

    Args:
        serialized (bytes): A reference protobuf serialized to bytes.
        app (Optional[str]): The application ID / project ID for the
            constructed key.
        namespace (Optional[str]): The namespace for the constructed key.
        database (Optional[str]): The database for the constructed key.

    Returns:
        google.cloud.datastore.key.Key: The key corresponding to
        ``serialized``.

    Raises:
        RuntimeError: If ``app`` is not :data:`None`, but not the same as
            ``reference.app``.
        RuntimeError: If ``database`` is not :data:`None`, but not the same as
            ``reference.database_id``.
        RuntimeError: If ``namespace`` is not :data:`None`, but not the same as
            ``reference.name_space``.
    """
    project = _project_from_app(reference.app)
    if app is not None:
        if _project_from_app(app) != project:
            raise RuntimeError(_REFERENCE_APP_MISMATCH.format(reference.app, app))

    parsed_database = _key_module._get_empty(reference.database_id, "")
    if database is not None:
        if database != parsed_database:
            raise RuntimeError(
                _REFERENCE_DATABASE_MISMATCH.format(reference.database_id, database)
            )

    parsed_namespace = _key_module._get_empty(reference.name_space, "")
    if namespace is not None:
        if namespace != parsed_namespace:
            raise RuntimeError(
                _REFERENCE_NAMESPACE_MISMATCH.format(reference.name_space, namespace)
            )

    flat_path = _key_module._get_flat_path(reference.path)
    return google.cloud.datastore.Key(
        *flat_path,
        project=project,
        database=parsed_database,
        namespace=parsed_namespace,
    )


def _from_serialized(serialized, app, namespace, database):
    """Convert serialized protobuf to :class:`~google.cloud.datastore.key.Key`.

    This is intended to work with the "legacy" representation of a
    datastore "Key" used within Google App Engine (a so-called
    "Reference"). This assumes that ``serialized`` was created within an App
    Engine app via something like ``ndb.Key(...).serialized()``.

    Args:
        serialized (bytes): A reference protobuf serialized to bytes.
        app (Optional[str]): The application ID / project ID for the
            constructed key.
        namespace (Optional[str]): The namespace for the constructed key.
        database (Optional[str]): The database for the constructed key.

    Returns:
        Tuple[google.cloud.datastore.key.Key, .Reference]: The key
        corresponding to ``serialized`` and the Reference protobuf.
    """
    reference = _app_engine_key_pb2.Reference()
    reference.ParseFromString(serialized)
    return _from_reference(reference, app, namespace, database), reference


def _from_urlsafe(urlsafe, app, namespace, database):
    """Convert urlsafe string to :class:`~google.cloud.datastore.key.Key`.

    .. note::

       This is borrowed from
       :meth:`~google.cloud.datastore.key.Key.from_legacy_urlsafe`.
       It is provided here, rather than calling that method, since component
       parts need to be re-used.

    This is intended to work with the "legacy" representation of a
    datastore "Key" used within Google App Engine (a so-called
    "Reference"). This assumes that ``urlsafe`` was created within an App
    Engine app via something like ``ndb.Key(...).urlsafe()``.

    Args:
        urlsafe (Union[bytes, str]): The base64 encoded (ASCII) string
            corresponding to a datastore "Key" / "Reference".
        app (Optional[str]): The application ID / project ID for the
            constructed key.
        namespace (Optional[str]): The namespace for the constructed key.
        database (Optional[str]): The database for the constructed key.

    Returns:
        Tuple[google.cloud.datastore.key.Key, .Reference]: The key
        corresponding to ``urlsafe`` and the Reference protobuf.
    """
    if isinstance(urlsafe, str):  # pragma: NO BRANCH
        urlsafe = urlsafe.encode("ascii")
    padding = b"=" * (-len(urlsafe) % 4)
    urlsafe += padding
    raw_bytes = base64.urlsafe_b64decode(urlsafe)
    return _from_serialized(raw_bytes, app, namespace, database)


def _constructor_handle_positional(path_args, kwargs):
    """Properly handle positional arguments to Key constructor.

    This will modify ``kwargs`` in a few cases:

    * The constructor was called with a dictionary as the only
      positional argument (and no keyword arguments were passed). In
      this case, the contents of the dictionary passed in will be copied
      into ``kwargs``.
    * The constructor was called with at least one (non-dictionary)
      positional argument. In this case all of the positional arguments
      will be added to ``kwargs`` for the key ``flat``.

    Args:
        path_args (Tuple): The positional arguments.
        kwargs (Dict[str, Any]): The keyword arguments.

    Raises:
        TypeError: If keyword arguments were used while the first and
            only positional argument was a dictionary.
        TypeError: If positional arguments were provided and the keyword
            ``flat`` was used.
    """
    if not path_args:
        return

    if len(path_args) == 1 and isinstance(path_args[0], dict):
        if kwargs:
            raise TypeError(
                "Key() takes no keyword arguments when a dict is the "
                "the first and only non-keyword argument (for "
                "unpickling)."
            )
        kwargs.update(path_args[0])
    else:
        if "flat" in kwargs:
            raise TypeError(
                "Key() with positional arguments "
                "cannot accept flat as a keyword argument."
            )
        kwargs["flat"] = path_args


def _exactly_one_specified(*values):
    """Make sure exactly one of ``values`` is truthy.

    Args:
        values (Tuple[Any, ...]): Some values to be checked.

    Returns:
        bool: Indicating if exactly one of ``values`` was truthy.
    """
    count = sum(1 for value in values if value)
    return count == 1


def _parse_from_ref(
    klass,
    reference=None,
    serialized=None,
    urlsafe=None,
    app=None,
    namespace=None,
    database: str = None,
    **kwargs
):
    """Construct a key from a Reference.

    This makes sure that **exactly** one of ``reference``, ``serialized`` and
    ``urlsafe`` is specified (all three are different representations of a
    ``Reference`` protobuf).

    Args:
        klass (type): The class of the instance being constructed. It must
            be :class:`.Key`; we do not allow constructing :class:`.Key`
            subclasses from a serialized Reference protobuf.
        reference (Optional[\
            ~google.cloud.datastore._app_engine_key_pb2.Reference]): A
            reference protobuf representing a key.
        serialized (Optional[bytes]): A reference protobuf serialized to bytes.
        urlsafe (Optional[bytes]): A reference protobuf serialized to bytes. The
            raw bytes are then converted to a websafe base64-encoded string.
        app (Optional[str]): The Google Cloud Platform project (previously
            on Google App Engine, this was called the Application ID).
        namespace (Optional[str]): The namespace for the key.
        database (Optional[str]): The database for the Key.
        kwargs (Dict[str, Any]): Any extra keyword arguments not covered by
            the explicitly provided ones. These are passed through to indicate
            to the user that the wrong combination of arguments was used, e.g.
            if ``parent`` and ``urlsafe`` were used together.

    Returns:
        Tuple[~.datastore.Key, \
            ~google.cloud.datastore._app_engine_key_pb2.Reference]:
        A pair of the constructed key and the reference that was serialized
        in one of the arguments.

    Raises:
        TypeError: If ``klass`` is not :class:`.Key`.
        TypeError: If ``kwargs`` isn't empty.
        TypeError: If any number other than exactly one of ``reference``,
            ``serialized`` or ``urlsafe`` is provided.
    """
    if klass is not Key:
        raise TypeError(_WRONG_TYPE.format(klass))

    if kwargs or not _exactly_one_specified(reference, serialized, urlsafe):
        raise TypeError(
            "Cannot construct Key reference from incompatible " "keyword arguments."
        )

    if reference:
        ds_key = _from_reference(reference, app, namespace, database)
    elif serialized:
        ds_key, reference = _from_serialized(serialized, app, namespace, database)
    else:
        # NOTE: We know here that ``urlsafe`` is truth-y;
        #       ``_exactly_one_specified()`` guarantees this.
        ds_key, reference = _from_urlsafe(urlsafe, app, namespace, database)

    return ds_key, reference


def _parse_from_args(
    pairs=None,
    flat=None,
    project=None,
    app=None,
    namespace=UNDEFINED,
    parent=None,
    database=UNDEFINED,
):
    """Construct a key from the path (and possibly a parent key).

    Args:
        pairs (Optional[Iterable[Tuple[str, Union[str, int]]]]): An iterable
            of (kind, ID) pairs.
        flat (Optional[Iterable[Union[str, int]]]): An iterable of the
            (kind, ID) pairs but flattened into a single value. For example,
            the pairs ``[("Parent", 1), ("Child", "a")]`` would be flattened to
            ``["Parent", 1, "Child", "a"]``.
        project (Optional[str]): The Google Cloud Platform project (previously
            on Google App Engine, this was called the Application ID).
        app (Optional[str]): DEPRECATED: Synonym for ``project``.
        namespace (Optional[str]): The namespace for the key.
        parent (Optional[~.ndb.key.Key]): The parent of the key being
            constructed. If provided, the key path will be **relative** to the
            parent key's path.
        database (Optional[str]): The database for the key.
            Defaults to that of the client if a parent was specified, and
            to the default database if it was not.

    Returns:
        ~.datastore.Key: The constructed key.

    Raises:
        exceptions.BadValueError: If ``parent`` is passed but is not a ``Key``.
    """
    # Avoid circular import in Python 2.7
    from google.cloud.ndb import context as context_module

    flat = _get_path(flat, pairs)
    _clean_flat_path(flat)

    if project and app:
        raise TypeError("Can't specify both 'project' and 'app'. They are synonyms.")
    elif not app:
        app = project

    parent_ds_key = None
    if parent is None:
        project = _project_from_app(app)

        if namespace is UNDEFINED:
            namespace = context_module.get_context().get_namespace()

        if database is UNDEFINED:
            database = context_module.get_context().client.database

    else:
        project = _project_from_app(app, allow_empty=True)
        if not isinstance(parent, Key):
            raise exceptions.BadValueError(
                "Expected Key instance, got {!r}".format(parent)
            )

        if namespace is UNDEFINED:
            namespace = None

        if database is UNDEFINED:
            database = None

        # Offload verification of parent to ``google.cloud.datastore.Key()``.
        parent_ds_key = parent._key

    if database == "":
        database = None

    if namespace == "":
        namespace = None

    return google.cloud.datastore.Key(
        *flat,
        parent=parent_ds_key,
        project=project,
        database=database,
        namespace=namespace,
    )


def _get_path(flat, pairs):
    """Get a flat path of key arguments.

    Does this from exactly one of ``flat`` or ``pairs``.

    Args:
        pairs (Optional[Iterable[Tuple[str, Union[str, int]]]]): An iterable
            of (kind, ID) pairs.
        flat (Optional[Iterable[Union[str, int]]]): An iterable of the
            (kind, ID) pairs but flattened into a single value. For example,
            the pairs ``[("Parent", 1), ("Child", "a")]`` would be flattened to
            ``["Parent", 1, "Child", "a"]``.

    Returns:
        List[Union[str, int]]: The flattened path as a list.

    Raises:
        TypeError: If both ``flat`` and ``pairs`` are provided.
        ValueError: If the ``flat`` path does not have an even number of
            elements.
        TypeError: If the paths are both empty.
    """
    if flat:
        if pairs is not None:
            raise TypeError("Key() cannot accept both flat and pairs arguments.")
        if len(flat) % 2:
            raise ValueError("Key() must have an even number of positional arguments.")
        flat = list(flat)
    else:
        flat = []
        for kind, id_ in pairs:
            flat.extend((kind, id_))

    if not flat:
        raise TypeError("Key must consist of at least one pair.")

    return flat


def _clean_flat_path(flat):
    """Verify and convert the flat path for a key.

    This may modify ``flat`` in place. In particular, if the last element is
    :data:`None` (for a partial key), this will pop it off the end. Also
    if some of the kinds are instance of :class:`.Model`, they will be
    converted to strings in ``flat``.

    Args:
        flat (List[Union[str, int]]): The flattened path as a list.

    Raises:
        TypeError: If the kind in a pair is an invalid type.
        exceptions.BadArgumentError: If a key ID is :data:`None` (indicating a partial
           key), but in a pair other than the last one.
        TypeError: If a key ID is not a string or integer.
    """
    # Verify the inputs in ``flat``.
    for i in range(0, len(flat), 2):
        # Make sure the ``kind`` is either a string or a Model.
        kind = flat[i]
        if isinstance(kind, type):
            kind = kind._get_kind()
            flat[i] = kind
        if not isinstance(kind, str):
            raise TypeError(
                "Key kind must be a string or Model class; "
                "received {!r}".format(kind)
            )
        # Make sure the ``id_`` is either a string or int. In the special case
        # of a partial key, ``id_`` can be ``None`` for the last pair.
        id_ = flat[i + 1]
        if id_ is None:
            if i + 2 < len(flat):
                raise exceptions.BadArgumentError("Incomplete Key entry must be last")
        elif not isinstance(id_, (str, int)):
            raise TypeError(_INVALID_ID_TYPE.format(id_))

    # Remove trailing ``None`` for a partial key.
    if flat[-1] is None:
        flat.pop()


def _verify_path_value(value, is_str, is_kind=False):
    """Verify a key path value: one of a kind, string ID or integer ID.

    Args:
        value (Union[str, int]): The value to verify
        is_str (bool): Flag indicating if the ``value`` is a string. If
            :data:`False`, then the ``value`` is assumed to be an integer.
        is_kind (Optional[bool]): Flag indicating if the value is meant to
            be a kind. Defaults to :data:`False`.

    Returns:
        Union[str, int]: The ``value`` passed in, if it passed verification
        checks.

    Raises:
        ValueError: If the ``value`` is a ``str`` for the kind, but the number
            of UTF-8 encoded bytes is outside of the range ``[1, 1500]``.
        ValueError: If the ``value`` is a ``str`` for the name, but the number
            of UTF-8 encoded bytes is outside of the range ``[1, 1500]``.
        ValueError: If the ``value`` is an integer but lies outside of the
            range ``[1, 2^63 - 1]``.
    """
    if is_str:
        if 1 <= len(value.encode("utf-8")) <= _MAX_KEYPART_BYTES:
            return value

        if is_kind:
            raise ValueError(_BAD_KIND.format(_MAX_KEYPART_BYTES, value))
        else:
            raise ValueError(_BAD_STRING_ID.format(_MAX_KEYPART_BYTES, value))
    else:
        if 1 <= value <= _MAX_INTEGER_ID:
            return value

        raise ValueError(_BAD_INTEGER_ID.format(value))


def _to_legacy_path(dict_path):
    """Convert a tuple of ints and strings in a legacy "Path".

    .. note:

        This assumes, but does not verify, that each entry in
        ``dict_path`` is valid (i.e. doesn't have more than one
        key out of "name" / "id").

    Args:
        dict_path (Iterable[Tuple[str, Union[str, int]]]): The "structured"
            path for a ``google-cloud-datastore`` key, i.e. it is a list of
            dictionaries, each of which has "kind" and one of "name" / "id" as
            keys.

    Returns:
        _app_engine_key_pb2.Path: The legacy path corresponding to
        ``dict_path``.
    """
    elements = []
    for part in dict_path:
        element_kwargs = {"type": _verify_path_value(part["kind"], True, is_kind=True)}
        if "id" in part:
            element_kwargs["id"] = _verify_path_value(part["id"], False)
        elif "name" in part:
            element_kwargs["name"] = _verify_path_value(part["name"], True)
        element = _app_engine_key_pb2.Path.Element(**element_kwargs)
        elements.append(element)

    return _app_engine_key_pb2.Path(element=elements)
