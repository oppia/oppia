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

"""Models and helper functions for access to a project's datastore metadata.

These entities cannot be created by users, but are created as the results of
__namespace__, __kind__, __property__ and __entity_group__ metadata queries
or gets.

A simplified API is also offered:

    :func:`get_namespaces`: A list of namespace names.

    :func:`get_kinds`: A list of kind names.

    :func:`get_properties_of_kind`: A list of property names
    for the given kind name.

    :func:`get_representations_of_kind`: A dict mapping
    property names to lists of representation ids.

    get_kinds(), get_properties_of_kind(), get_representations_of_kind()
    implicitly apply to the current namespace.

    get_namespaces(), get_kinds(), get_properties_of_kind(),
    get_representations_of_kind() have optional start and end arguments to
    limit the query to a range of names, such that start <= name < end.
"""

from google.cloud.ndb import exceptions
from google.cloud.ndb import model
from google.cloud.ndb import query as query_module


__all__ = [
    "get_entity_group_version",
    "get_kinds",
    "get_namespaces",
    "get_properties_of_kind",
    "get_representations_of_kind",
    "EntityGroup",
    "Kind",
    "Namespace",
    "Property",
]


class _BaseMetadata(model.Model):
    """Base class for all metadata models."""

    _use_cache = False
    _use_global_cache = False

    KIND_NAME = ""

    def __new__(cls, *args, **kwargs):
        """override to prevent instantiation"""
        if cls is _BaseMetadata:
            raise TypeError("This base class cannot be instantiated")
        return super(_BaseMetadata, cls).__new__(cls)

    @classmethod
    def _get_kind(cls):
        """Kind name override."""
        return cls.KIND_NAME


class Namespace(_BaseMetadata):
    """Model for __namespace__ metadata query results."""

    KIND_NAME = "__namespace__"
    EMPTY_NAMESPACE_ID = 1

    @property
    def namespace_name(self):
        """Return the namespace name specified by this entity's key.

        Returns:
            str: the namespace name.
        """
        return self.key_to_namespace(self.key)

    @classmethod
    def key_for_namespace(cls, namespace):
        """Return the Key for a namespace.

        Args:
            namespace (str): A string giving the namespace whose key is
                requested.

        Returns:
            key.Key: The Key for the namespace.
        """
        if namespace is not None:
            return model.Key(cls.KIND_NAME, namespace)
        else:
            return model.Key(cls.KIND_NAME, cls.EMPTY_NAMESPACE_ID)

    @classmethod
    def key_to_namespace(cls, key):
        """Return the namespace specified by a given __namespace__ key.

        Args:
            key (key.Key): key whose name is requested.

        Returns:
            str: The namespace specified by key.
        """
        return key.string_id() or ""


class Kind(_BaseMetadata):
    """Model for __kind__ metadata query results."""

    KIND_NAME = "__kind__"

    @property
    def kind_name(self):
        """Return the kind name specified by this entity's key.

        Returns:
            str: the kind name.
        """
        return self.key_to_kind(self.key)

    @classmethod
    def key_for_kind(cls, kind):
        """Return the __kind__ key for kind.

        Args:
            kind (str): kind whose key is requested.

        Returns:
            key.Key: key for kind.
        """
        return model.Key(cls.KIND_NAME, kind)

    @classmethod
    def key_to_kind(cls, key):
        """Return the kind specified by a given __kind__ key.

        Args:
            key (key.Key): key whose name is requested.

        Returns:
            str: The kind specified by key.
        """
        return key.id()


class Property(_BaseMetadata):
    """Model for __property__ metadata query results."""

    KIND_NAME = "__property__"

    @property
    def property_name(self):
        """Return the property name specified by this entity's key.

        Returns:
            str: the property name.
        """
        return self.key_to_property(self.key)

    @property
    def kind_name(self):
        """Return the kind name specified by this entity's key.

        Returns:
            str: the kind name.
        """
        return self.key_to_kind(self.key)

    property_representation = model.StringProperty(repeated=True)

    @classmethod
    def key_for_kind(cls, kind):
        """Return the __property__ key for kind.

        Args:
            kind (str): kind whose key is requested.

        Returns:
            key.Key: The parent key for __property__ keys of kind.
        """
        return model.Key(Kind.KIND_NAME, kind)

    @classmethod
    def key_for_property(cls, kind, property):
        """Return the __property__ key for property of kind.

        Args:
            kind (str): kind whose key is requested.
            property (str): property whose key is requested.

        Returns:
            key.Key: The key for property of kind.
        """
        return model.Key(Kind.KIND_NAME, kind, Property.KIND_NAME, property)

    @classmethod
    def key_to_kind(cls, key):
        """Return the kind specified by a given __property__ key.

        Args:
            key (key.Key): key whose kind name is requested.

        Returns:
            str: The kind specified by key.
        """
        if key.kind() == Kind.KIND_NAME:
            return key.id()
        else:
            return key.parent().id()

    @classmethod
    def key_to_property(cls, key):
        """Return the property specified by a given __property__ key.

        Args:
            key (key.Key): key whose property name is requested.

        Returns:
            str: property specified by key, or None if the key specified
                only a kind.
        """
        if key.kind() == Kind.KIND_NAME:
            return None
        else:
            return key.id()


class EntityGroup(object):
    """Model for __entity_group__ metadata. No longer supported by datastore."""

    def __new__(self, *args, **kwargs):
        raise exceptions.NoLongerImplementedError()


def get_entity_group_version(*args, **kwargs):
    """Return the version of the entity group containing key.

    Raises:
        :class:google.cloud.ndb.exceptions.NoLongerImplementedError. Always.
            This method is not supported anymore.
    """
    raise exceptions.NoLongerImplementedError()


def get_kinds(start=None, end=None):
    """Return all kinds in the specified range, for the current namespace.

    Args:
        start (str): only return kinds >= start if start is not None.
        end (str): only return kinds < end if end is not None.

    Returns:
        List[str]: Kind names between the (optional) start and end values.
    """
    # This is required for the query to find the model for __kind__
    Kind._fix_up_properties()

    query = query_module.Query(kind=Kind._get_kind())
    if start is not None and start != "":
        query = query.filter(Kind.key >= Kind.key_for_kind(start))
    if end is not None:
        if end == "":
            return []
        query = query.filter(Kind.key < Kind.key_for_kind(end))

    results = query.fetch()
    return [result.kind_name for result in results]


def get_namespaces(start=None, end=None):
    """Return all namespaces in the specified range.

    Args:
        start (str): only return namespaces >= start if start is not None.
        end (str): only return namespaces < end if end is not None.

    Returns:
        List[str]: Namespace names between the (optional) start and end values.
    """
    # This is required for the query to find the model for __namespace__
    Namespace._fix_up_properties()

    query = query_module.Query(kind=Namespace._get_kind())
    if start is not None:
        query = query.filter(Namespace.key >= Namespace.key_for_namespace(start))
    if end is not None:
        query = query.filter(Namespace.key < Namespace.key_for_namespace(end))

    results = query.fetch()
    return [result.namespace_name for result in results]


def get_properties_of_kind(kind, start=None, end=None):
    """Return all properties of kind in the specified range.

    NOTE: This function does not return unindexed properties.

    Args:
        kind (str): name of kind whose properties you want.
        start (str): only return properties >= start if start is not None.
        end (str): only return properties < end if end is not None.

    Returns:
        List[str]: Property names of kind between the (optional) start and end
            values.
    """
    # This is required for the query to find the model for __property__
    Property._fix_up_properties()

    query = query_module.Query(
        kind=Property._get_kind(), ancestor=Property.key_for_kind(kind)
    )
    if start is not None and start != "":
        query = query.filter(Property.key >= Property.key_for_property(kind, start))
    if end is not None:
        if end == "":
            return []
        query = query.filter(Property.key < Property.key_for_property(kind, end))

    results = query.fetch()
    return [prop.property_name for prop in results]


def get_representations_of_kind(kind, start=None, end=None):
    """Return all representations of properties of kind in the specified range.

    NOTE: This function does not return unindexed properties.

    Args:
        kind: name of kind whose properties you want.
        start: only return properties >= start if start is not None.
        end: only return properties < end if end is not None.

    Returns:
        dict: map of property names to their list of representations.
    """
    # This is required for the query to find the model for __property__
    Property._fix_up_properties()

    query = query_module.Query(
        kind=Property._get_kind(), ancestor=Property.key_for_kind(kind)
    )
    if start is not None and start != "":
        query = query.filter(Property.key >= Property.key_for_property(kind, start))
    if end is not None:
        if end == "":
            return {}
        query = query.filter(Property.key < Property.key_for_property(kind, end))

    representations = {}
    results = query.fetch()
    for property in results:
        representations[property.property_name] = property.property_representation

    return representations
