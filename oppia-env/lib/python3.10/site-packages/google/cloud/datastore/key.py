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

"""Create / interact with Google Cloud Datastore keys."""

import base64
import copy

from google.cloud.datastore_v1.types import entity as _entity_pb2

from google.cloud._helpers import _to_bytes
from google.cloud.datastore import _app_engine_key_pb2


_DATABASE_ID_TEMPLATE = (
    "Received non-empty database ID: {!r}.\n"
    "urlsafe strings are not expected to encode a Reference that "
    "contains a database ID."
)
_BAD_ELEMENT_TEMPLATE = (
    "At most one of ID and name can be set on an element. Received "
    "id = {!r} and name = {!r}."
)
_EMPTY_ELEMENT = (
    "Exactly one of ID and name must be set on an element. "
    "Encountered an element with neither set that was not the last "
    "element of a path."
)


class Key(object):
    """An immutable representation of a datastore Key.

    .. testsetup:: key-ctor

       from google.cloud import datastore

       project = 'my-special-pony'
       client = datastore.Client(project=project)
       Key = datastore.Key

       parent_key = client.key('Parent', 'foo')

    To create a basic key directly:

    .. doctest:: key-ctor

       >>> Key('EntityKind', 1234, project=project)
       <Key('EntityKind', 1234), project=...>
       >>> Key('EntityKind', 'foo', project=project)
       <Key('EntityKind', 'foo'), project=...>

    Though typical usage comes via the
    :meth:`~google.cloud.datastore.client.Client.key` factory:

    .. doctest:: key-ctor

       >>> client.key('EntityKind', 1234)
       <Key('EntityKind', 1234), project=...>
       >>> client.key('EntityKind', 'foo')
       <Key('EntityKind', 'foo'), project=...>

    To create a key with a parent:

    .. doctest:: key-ctor

       >>> client.key('Parent', 'foo', 'Child', 1234)
       <Key('Parent', 'foo', 'Child', 1234), project=...>
       >>> client.key('Child', 1234, parent=parent_key)
       <Key('Parent', 'foo', 'Child', 1234), project=...>

    To create a partial key:

    .. doctest:: key-ctor

       >>> client.key('Parent', 'foo', 'Child')
       <Key('Parent', 'foo', 'Child'), project=...>

    To create a key from a non-default database:

    .. doctest:: key-ctor

       >>> Key('EntityKind', 1234, project=project, database='mydb')
       <Key('EntityKind', 1234), project=my-special-pony, database=mydb>

    :type path_args: tuple of string and integer
    :param path_args: May represent a partial (odd length) or full (even
                      length) key path.

    :param kwargs: Keyword arguments to be passed in.

    Accepted keyword arguments are

    * namespace (string): A namespace identifier for the key.
    * project (string): The project associated with the key.
    * database (string): The database associated with the key.
    * parent (:class:`~google.cloud.datastore.key.Key`): The parent of the key.

    The project argument is required unless it has been set implicitly.
    """

    def __init__(self, *path_args, **kwargs):
        self._flat_path = path_args
        parent = self._parent = kwargs.get("parent")
        self._namespace = kwargs.get("namespace")
        self._database = kwargs.get("database")

        project = kwargs.get("project")
        self._project = _validate_project(project, parent)
        # _flat_path, _parent, _database, _namespace, and _project must be set
        # before _combine_args() is called.
        self._path = self._combine_args()

    def __eq__(self, other):
        """Compare two keys for equality.

        Incomplete keys never compare equal to any other key.

        Completed keys compare equal if they have the same path, project,
        database, and namespace.

        (Note that database=None is considered to refer to the default database.)

        :rtype: bool
        :returns: True if the keys compare equal, else False.
        """
        if not isinstance(other, Key):
            return NotImplemented

        if self.is_partial or other.is_partial:
            return False

        return (
            self.flat_path == other.flat_path
            and self.project == other.project
            and self.namespace == other.namespace
            and self.database == other.database
        )

    def __ne__(self, other):
        """Compare two keys for inequality.

        Incomplete keys never compare equal to any other key.

        Completed keys compare equal if they have the same path, project,
        database, and namespace.

        (Note that database=None is considered to refer to the default database.)

        :rtype: bool
        :returns: False if the keys compare equal, else True.
        """
        return not self == other

    def __hash__(self):
        """Hash this key for use in a dictionary lookup.

        :rtype: int
        :returns: a hash of the key's state.
        """
        hash_val = hash(self.flat_path) + hash(self.project) + hash(self.namespace)
        if self.database:
            hash_val = hash_val + hash(self.database)
        return hash_val

    @staticmethod
    def _parse_path(path_args):
        """Parses positional arguments into key path with kinds and IDs.

        :type path_args: tuple
        :param path_args: A tuple from positional arguments. Should be
                          alternating list of kinds (string) and ID/name
                          parts (int or string).

        :rtype: :class:`list` of :class:`dict`
        :returns: A list of key parts with kind and ID or name set.
        :raises: :class:`ValueError` if there are no ``path_args``, if one of
                 the kinds is not a string or if one of the IDs/names is not
                 a string or an integer.
        """
        if len(path_args) == 0:
            raise ValueError("Key path must not be empty.")

        kind_list = path_args[::2]
        id_or_name_list = path_args[1::2]
        # Dummy sentinel value to pad incomplete key to even length path.
        partial_ending = object()
        if len(path_args) % 2 == 1:
            id_or_name_list += (partial_ending,)

        result = []
        for kind, id_or_name in zip(kind_list, id_or_name_list):
            curr_key_part = {}
            if isinstance(kind, str):
                curr_key_part["kind"] = kind
            else:
                raise ValueError(kind, "Kind was not a string.")

            if isinstance(id_or_name, str):
                curr_key_part["name"] = id_or_name
            elif isinstance(id_or_name, int):
                curr_key_part["id"] = id_or_name
            elif id_or_name is not partial_ending:
                raise ValueError(id_or_name, "ID/name was not a string or integer.")

            result.append(curr_key_part)

        return result

    def _combine_args(self):
        """Sets protected data by combining raw data set from the constructor.

        If a ``_parent`` is set, updates the ``_flat_path`` and sets the
        ``_namespace``, ``_database``, and ``_project`` if not already set.

        :rtype: :class:`list` of :class:`dict`
        :returns: A list of key parts with kind and ID or name set.
        :raises: :class:`ValueError` if the parent key is not complete.
        """
        child_path = self._parse_path(self._flat_path)

        if self._parent is not None:
            if self._parent.is_partial:
                raise ValueError("Parent key must be complete.")

            # We know that _parent.path() will return a copy.
            child_path = self._parent.path + child_path
            self._flat_path = self._parent.flat_path + self._flat_path
            if (
                self._namespace is not None
                and self._namespace != self._parent.namespace
            ):
                raise ValueError("Child namespace must agree with parent's.")
            self._namespace = self._parent.namespace
            if self._project is not None and self._project != self._parent.project:
                raise ValueError("Child project must agree with parent's.")
            if self._database is not None and self._database != self._parent.database:
                raise ValueError("Child database must agree with parent's.")
            self._database = self._parent.database
            self._project = self._parent.project

        return child_path

    def _clone(self):
        """Duplicates the Key.

        Most attributes are simple types, so don't require copying. Other
        attributes like ``parent`` are long-lived and so we re-use them.

        :rtype: :class:`google.cloud.datastore.key.Key`
        :returns: A new ``Key`` instance with the same data as the current one.
        """
        cloned_self = self.__class__(
            *self.flat_path,
            project=self.project,
            database=self.database,
            namespace=self.namespace
        )
        # If the current parent has already been set, we re-use
        # the same instance
        cloned_self._parent = self._parent
        return cloned_self

    def completed_key(self, id_or_name):
        """Creates new key from existing partial key by adding final ID/name.

        :type id_or_name: str or integer
        :param id_or_name: ID or name to be added to the key.

        :rtype: :class:`google.cloud.datastore.key.Key`
        :returns: A new ``Key`` instance with the same data as the current one
                  and an extra ID or name added.
        :raises: :class:`ValueError` if the current key is not partial or if
                 ``id_or_name`` is not a string or integer.
        """
        if not self.is_partial:
            raise ValueError("Only a partial key can be completed.")

        if isinstance(id_or_name, str):
            id_or_name_key = "name"
        elif isinstance(id_or_name, int):
            id_or_name_key = "id"
        else:
            raise ValueError(id_or_name, "ID/name was not a string or integer.")

        new_key = self._clone()
        new_key._path[-1][id_or_name_key] = id_or_name
        new_key._flat_path += (id_or_name,)
        return new_key

    def to_protobuf(self):
        """Return a protobuf corresponding to the key.

        :rtype: :class:`.entity_pb2.Key`
        :returns: The protobuf representing the key.
        """
        key = _entity_pb2.Key()
        key.partition_id.project_id = self.project
        if self.database:
            key.partition_id.database_id = self.database

        if self.namespace:
            key.partition_id.namespace_id = self.namespace

        for item in self.path:
            element = key.PathElement()
            if "kind" in item:
                element.kind = item["kind"]
            if "id" in item:
                element.id = item["id"]
            if "name" in item:
                element.name = item["name"]
            key.path.append(element)
        return key

    def to_legacy_urlsafe(self, location_prefix=None):
        """Convert to a base64 encode urlsafe string for App Engine.

        This is intended to work with the "legacy" representation of a
        datastore "Key" used within Google App Engine (a so-called
        "Reference"). The returned string can be used as the ``urlsafe``
        argument to ``ndb.Key(urlsafe=...)``. The base64 encoded values
        will have padding removed.

        .. note::

            The string returned by ``to_legacy_urlsafe`` is equivalent, but
            not identical, to the string returned by ``ndb``. The location
            prefix may need to be specified to obtain identical urlsafe
            keys.

        .. note::
            to_legacy_urlsafe only supports the default database

        :type location_prefix: str
        :param location_prefix: The location prefix of an App Engine project
                                ID. Often this value is 's~', but may also be
                                'e~', or other location prefixes currently
                                unknown.

        :rtype: bytes
        :returns: A bytestring containing the key encoded as URL-safe base64.
        """
        if self.database:
            raise ValueError("to_legacy_urlsafe only supports the default database")

        if location_prefix is None:
            project_id = self.project
        else:
            project_id = location_prefix + self.project

        reference = _app_engine_key_pb2.Reference(
            app=project_id,
            path=_to_legacy_path(self._path),  # Avoid the copy.
            name_space=self.namespace,
        )
        raw_bytes = reference.SerializeToString()
        return base64.urlsafe_b64encode(raw_bytes).strip(b"=")

    @classmethod
    def from_legacy_urlsafe(cls, urlsafe):
        """Convert urlsafe string to :class:`~google.cloud.datastore.key.Key`.

        This is intended to work with the "legacy" representation of a
        datastore "Key" used within Google App Engine (a so-called
        "Reference"). This assumes that ``urlsafe`` was created within an App
        Engine app via something like ``ndb.Key(...).urlsafe()``.

        .. note::
            from_legacy_urlsafe only supports the default database.

        :type urlsafe: bytes or unicode
        :param urlsafe: The base64 encoded (ASCII) string corresponding to a
                        datastore "Key" / "Reference".

        :rtype: :class:`~google.cloud.datastore.key.Key`.
        :returns: The key corresponding to ``urlsafe``.
        """
        urlsafe = _to_bytes(urlsafe, encoding="ascii")
        padding = b"=" * (-len(urlsafe) % 4)
        urlsafe += padding
        raw_bytes = base64.urlsafe_b64decode(urlsafe)

        reference = _app_engine_key_pb2.Reference()
        reference.ParseFromString(raw_bytes)

        project = _clean_app(reference.app)
        namespace = _get_empty(reference.name_space, "")
        _check_database_id(reference.database_id)
        flat_path = _get_flat_path(reference.path)
        return cls(*flat_path, project=project, namespace=namespace)

    @property
    def is_partial(self):
        """Boolean indicating if the key has an ID (or name).

        :rtype: bool
        :returns: ``True`` if the last element of the key's path does not have
                  an ``id`` or a ``name``.
        """
        return self.id_or_name is None

    @property
    def database(self):
        """Database getter.

        :rtype: str
        :returns: The database of the current key.
        """
        return self._database

    @property
    def namespace(self):
        """Namespace getter.

        :rtype: str
        :returns: The namespace of the current key.
        """
        return self._namespace

    @property
    def path(self):
        """Path getter.

        Returns a copy so that the key remains immutable.

        :rtype: :class:`list` of :class:`dict`
        :returns: The (key) path of the current key.
        """
        return copy.deepcopy(self._path)

    @property
    def flat_path(self):
        """Getter for the key path as a tuple.

        :rtype: tuple of string and integer
        :returns: The tuple of elements in the path.
        """
        return self._flat_path

    @property
    def kind(self):
        """Kind getter. Based on the last element of path.

        :rtype: str
        :returns: The kind of the current key.
        """
        return self.path[-1]["kind"]

    @property
    def id(self):
        """ID getter. Based on the last element of path.

        :rtype: int
        :returns: The (integer) ID of the key.
        """
        return self.path[-1].get("id")

    @property
    def name(self):
        """Name getter. Based on the last element of path.

        :rtype: str
        :returns: The (string) name of the key.
        """
        return self.path[-1].get("name")

    @property
    def id_or_name(self):
        """Getter. Based on the last element of path.

        :rtype: int (if ``id``) or string (if ``name``)
        :returns: The last element of the key's path if it is either an ``id``
                  or a ``name``.
        """
        if self.id is None:
            return self.name
        return self.id

    @property
    def project(self):
        """Project getter.

        :rtype: str
        :returns: The key's project.
        """
        return self._project

    def _make_parent(self):
        """Creates a parent key for the current path.

        Extracts all but the last element in the key path and creates a new
        key, while still matching the namespace, the database, and the project.

        :rtype: :class:`google.cloud.datastore.key.Key` or :class:`NoneType`
        :returns: A new ``Key`` instance, whose path consists of all but the
                  last element of current path. If the current key has only
                  one path element, returns ``None``.
        """
        if self.is_partial:
            parent_args = self.flat_path[:-1]
        else:
            parent_args = self.flat_path[:-2]
        if parent_args:
            return self.__class__(
                *parent_args,
                project=self.project,
                database=self.database,
                namespace=self.namespace
            )

    @property
    def parent(self):
        """The parent of the current key.

        :rtype: :class:`google.cloud.datastore.key.Key` or :class:`NoneType`
        :returns: A new ``Key`` instance, whose path consists of all but the
                  last element of current path. If the current key has only
                  one path element, returns ``None``.
        """
        if self._parent is None:
            self._parent = self._make_parent()

        return self._parent

    def __repr__(self):
        """String representation of this key.

        Includes the project and database, but suppresses them if they are
        equal to the default values.
        """
        repr = "<Key%s, project=%s" % (self._flat_path, self.project)
        if self.database:
            repr += ", database=%s" % self.database
        return repr + ">"


def _validate_project(project, parent):
    """Ensure the project is set appropriately.

    If ``parent`` is passed, skip the test (it will be checked / fixed up
    later).

    If ``project`` is unset, attempt to infer the project from the environment.

    :type project: str
    :param project: A project.

    :type parent: :class:`google.cloud.datastore.key.Key`
    :param parent: (Optional) The parent of the key or ``None``.

    :rtype: str
    :returns: The ``project`` passed in, or implied from the environment.
    :raises: :class:`ValueError` if ``project`` is ``None`` and no project
             can be inferred from the parent.
    """
    if parent is None:
        if project is None:
            raise ValueError("A Key must have a project set.")

    return project


def _clean_app(app_str):
    """Clean a legacy (i.e. from App Engine) app string.

    :type app_str: str
    :param app_str: The ``app`` value stored in a "Reference" pb.

    :rtype: str
    :returns: The cleaned value.
    """
    parts = app_str.split("~", 1)
    return parts[-1]


def _get_empty(value, empty_value):
    """Check if a protobuf field is "empty".

    :type value: object
    :param value: A basic field from a protobuf.

    :type empty_value: object
    :param empty_value: The "empty" value for the same type as
                        ``value``.
    """
    if value == empty_value:
        return None
    else:
        return value


def _check_database_id(database_id):
    """Make sure a "Reference" database ID is empty.

    Here, "empty" means either ``None`` or ``""``.

    :type database_id: unicode
    :param database_id: The ``database_id`` field from a "Reference" protobuf.

    :raises: :exc:`ValueError` if the ``database_id`` is not empty.
    """
    if database_id is not None and database_id != "":
        msg = _DATABASE_ID_TEMPLATE.format(database_id)
        raise ValueError(msg)


def _add_id_or_name(flat_path, element_pb, empty_allowed):
    """Add the ID or name from an element to a list.

    :type flat_path: list
    :param flat_path: List of accumulated path parts.

    :type element_pb: :class:`._app_engine_key_pb2.Path.Element`
    :param element_pb: The element containing ID or name.

    :type empty_allowed: bool
    :param empty_allowed: Indicates if neither ID or name need be set. If
                          :data:`False`, then **exactly** one of them must be.

    :raises: :exc:`ValueError` if 0 or 2 of ID/name are set (unless
             ``empty_allowed=True`` and 0 are set).
    """
    id_ = element_pb.id
    name = element_pb.name
    # NOTE: Below 0 and the empty string are the "null" values for their
    #       respective types, indicating that the value is unset.
    if id_ == 0:
        if name == "":
            if not empty_allowed:
                raise ValueError(_EMPTY_ELEMENT)
        else:
            flat_path.append(name)
    else:
        if name == "":
            flat_path.append(id_)
        else:
            msg = _BAD_ELEMENT_TEMPLATE.format(id_, name)
            raise ValueError(msg)


def _get_flat_path(path_pb):
    """Convert a legacy "Path" protobuf to a flat path.

    For example

    .. code:: python

        Element {
          type: "parent"
          id: 59
        }
        Element {
          type: "child"
          name: "naem"
        }

    would convert to ``('parent', 59, 'child', 'naem')``.

    :type path_pb: :class:`._app_engine_key_pb2.Path`
    :param path_pb: Legacy protobuf "Path" object (from a "Reference").

    :rtype: tuple
    :returns: The path parts from ``path_pb``.
    """
    num_elts = len(path_pb.element)
    last_index = num_elts - 1

    result = []
    for index, element in enumerate(path_pb.element):
        result.append(element.type)
        _add_id_or_name(result, element, index == last_index)

    return tuple(result)


def _to_legacy_path(dict_path):
    """Convert a tuple of ints and strings in a legacy "Path".

    .. note:

        This assumes, but does not verify, that each entry in
        ``dict_path`` is valid (i.e. doesn't have more than one
        key out of "name" / "id").

    :type dict_path: lsit
    :param dict_path: The "structured" path for a key, i.e. it
                      is a list of dictionaries, each of which has
                      "kind" and one of "name" / "id" as keys.

    :rtype: :class:`._app_engine_key_pb2.Path`
    :returns: The legacy path corresponding to ``dict_path``.
    """
    elements = []
    for part in dict_path:
        element_kwargs = {"type": part["kind"]}
        if "id" in part:
            element_kwargs["id"] = part["id"]
        elif "name" in part:
            element_kwargs["name"] = part["name"]
        element = _app_engine_key_pb2.Path.Element(**element_kwargs)
        elements.append(element)

    return _app_engine_key_pb2.Path(element=elements)
