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

"""Polymorphic models and queries.

The standard NDB Model class only supports 'functional polymorphism'.
That is, you can create a subclass of Model, and then subclass that
class, as many generations as necessary, and those classes will share
all the same properties and behaviors of their base classes.  However,
subclassing Model in this way gives each subclass its own kind.  This
means that it is not possible to do 'polymorphic queries'.  Building a
query on a base class will only return entities whose kind matches
that base class's kind, and exclude entities that are instances of
some subclass of that base class.

The PolyModel class defined here lets you create class hierarchies
that support polymorphic queries.  Simply subclass PolyModel instead
of Model.
"""

from google.cloud.ndb import model


__all__ = ["PolyModel"]

_CLASS_KEY_PROPERTY = "class"


class _ClassKeyProperty(model.StringProperty):
    """Property to store the 'class key' of a polymorphic class.

    The class key is a list of strings describing a polymorphic entity's
    place within its class hierarchy.  This property is automatically
    calculated.  For example:

    .. testsetup:: class-key-property

        from google.cloud import ndb


        class Animal(ndb.PolyModel):
            pass


        class Feline(Animal):
            pass


        class Cat(Feline):
            pass

    .. doctest:: class-key-property

        >>> Animal().class_
        ['Animal']
        >>> Feline().class_
        ['Animal', 'Feline']
        >>> Cat().class_
        ['Animal', 'Feline', 'Cat']
    """

    def __init__(self, name=_CLASS_KEY_PROPERTY, indexed=True):
        """Constructor.

        If you really want to you can give this a different datastore name
        or make it unindexed.  For example:

        .. code-block:: python

            class Foo(PolyModel):
                class_ = _ClassKeyProperty(indexed=False)
        """
        super(_ClassKeyProperty, self).__init__(
            name=name, indexed=indexed, repeated=True
        )

    def _set_value(self, entity, value):
        """The class_ property is read-only from the user's perspective."""
        raise TypeError("%s is a read-only property" % self._code_name)

    def _get_value(self, entity):
        """Compute and store a default value if necessary."""
        value = super(_ClassKeyProperty, self)._get_value(entity)
        if not value:
            value = entity._class_key()
            self._store_value(entity, value)
        return value

    def _prepare_for_put(self, entity):
        """Ensure the class_ property is initialized before it is serialized."""
        self._get_value(entity)  # For its side effects.


class PolyModel(model.Model):
    """Base class for class hierarchies supporting polymorphic queries.

    Use this class to build hierarchies that can be queried based on
    their types.

    Example:

    Consider the following model hierarchy::

        +------+
        |Animal|
        +------+
          |
          +-----------------+
          |                 |
        +------+          +------+
        |Canine|          |Feline|
        +------+          +------+
          |                 |
          +-------+         +-------+
          |       |         |       |
        +---+   +----+    +---+   +-------+
        |Dog|   |Wolf|    |Cat|   |Panther|
        +---+   +----+    +---+   +-------+

    This class hierarchy has three levels.  The first is the `root
    class`.  All models in a single class hierarchy must inherit from
    this root.  All models in the hierarchy are stored as the same
    kind as the root class.  For example, Panther entities when stored
    to Cloud Datastore are of the kind `Animal`.  Querying against the
    Animal kind will retrieve Cats, Dogs and Canines, for example,
    that match your query.  Different classes stored in the `root
    class` kind are identified by their class key.  When loaded from
    Cloud Datastore, it is mapped to the appropriate implementation
    class.

    Polymorphic properties:

    Properties that are defined in a given base class within a
    hierarchy are stored in Cloud Datastore for all subclasses only.
    So, if the Feline class had a property called `whiskers`, the Cat
    and Panther entities would also have whiskers, but not Animal,
    Canine, Dog or Wolf.

    Polymorphic queries:

    When written to Cloud Datastore, all polymorphic objects
    automatically have a property called `class` that you can query
    against.  Using this property it is possible to easily write a
    query against any sub-hierarchy.  For example, to fetch only
    Canine objects, including all Dogs and Wolves:

    .. code-block:: python

        Canine.query()

    The `class` property is not meant to be used by your code other
    than for queries.  Since it is supposed to represent the real
    Python class it is intended to be hidden from view.  Although if
    you feel the need, it is accessible as the `class_` attribute.

    Root class:

    The root class is the class from which all other classes of the
    hierarchy inherits from.  Each hierarchy has a single root class.
    A class is a root class if it is an immediate child of PolyModel.
    The subclasses of the root class are all the same kind as the root
    class. In other words:

    .. code-block:: python

        Animal.kind() == Feline.kind() == Panther.kind() == 'Animal'

    Note:

    All classes in a given hierarchy must have unique names, since
    the class name is used to identify the appropriate subclass.
    """

    class_ = _ClassKeyProperty()

    _class_map = {}  # Map class key -> suitable subclass.

    @classmethod
    def _update_kind_map(cls):
        """Override; called by Model._fix_up_properties().

        Update the kind map as well as the class map, except for PolyModel
        itself (its class key is empty).  Note that the kind map will
        contain entries for all classes in a PolyModel hierarchy; they all
        have the same kind, but different class names.  PolyModel class
        names, like regular Model class names, must be globally unique.
        """
        cls._kind_map[cls._class_name()] = cls
        class_key = cls._class_key()
        if class_key:
            cls._class_map[tuple(class_key)] = cls

    @classmethod
    def _class_key(cls):
        """Return the class key.

        This is a list of class names, e.g. ['Animal', 'Feline', 'Cat'].
        """
        return [c._class_name() for c in cls._get_hierarchy()]

    @classmethod
    def _get_kind(cls):
        """Override.

        Make sure that the kind returned is the root class of the
        polymorphic hierarchy.
        """
        bases = cls._get_hierarchy()
        if not bases:
            # We have to jump through some hoops to call the superclass'
            # _get_kind() method.  First, this is called by the metaclass
            # before the PolyModel name is defined, so it can't use
            # super(PolyModel, cls)._get_kind().  Second, we can't just call
            # Model._get_kind() because that always returns 'Model'.  Hence
            # the '__func__' hack.
            return model.Model._get_kind.__func__(cls)
        else:
            return bases[0]._class_name()

    @classmethod
    def _class_name(cls):
        """Return the class name.

        This overrides Model._class_name() which is an alias for _get_kind().
        This is overridable in case you want to use a different class
        name.  The main use case is probably to maintain backwards
        compatibility with datastore contents after renaming a class.

        NOTE: When overriding this for an intermediate class in your
        hierarchy (as opposed to a leaf class), make sure to test
        cls.__name__, or else all subclasses will appear to have the
        same class name.
        """
        return cls.__name__

    @classmethod
    def _get_hierarchy(cls):
        """Internal helper to return the list of polymorphic base classes.
        This returns a list of class objects, e.g. [Animal, Feline, Cat].
        """
        bases = []
        for base in cls.mro():  # pragma: no branch
            if hasattr(base, "_get_hierarchy"):
                bases.append(base)
        del bases[-1]  # Delete PolyModel itself
        bases.reverse()
        return bases

    @classmethod
    def _default_filters(cls):
        if len(cls._get_hierarchy()) <= 1:
            return ()
        return (cls.class_ == cls._class_name(),)
