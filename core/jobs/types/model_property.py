# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Domain object for the property of a model."""

from __future__ import annotations

from core.jobs import job_utils
from core.platform import models

from typing import Any, Callable, Iterator, Tuple, Type, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

# The ModelProperty class can accept `id` Python property and all other
# properties that are derived from datastore_services.Property. Thus
# to generalize the type of properties that ModelProperty can accept,
# we defined a type variable here.
PropertyType = Union[
    datastore_services.Property,
    Callable[[base_models.BaseModel], str]
]


class ModelProperty:
    """Represents a Property in a BaseModel subclass."""

    __slots__ = ('_model_kind', '_property_name')

    def __init__(
        self,
        model_class: Type[base_models.BaseModel],
        property_obj: PropertyType
    ) -> None:
        """Initializes a new ModelProperty instance.

        Args:
            model_class: type(base_model.BaseModel). The model's class.
            property_obj: datastore_services.Property|@property. An NDB Property
                or a Python @property.

        Raises:
            TypeError. The model_class is not a type.
            TypeError. The model_class is not a subclass of BaseModel.
            TypeError. The property_obj is not an NDB Property.
            ValueError. The property_obj is not in the model_class.
        """
        if not isinstance(model_class, type):
            raise TypeError('%r is not a model class' % model_class)
        if not issubclass(model_class, base_models.BaseModel):
            raise TypeError('%r is not a subclass of BaseModel' % model_class)

        self._model_kind = job_utils.get_model_kind(model_class)

        if property_obj is model_class.id:
            # BaseModel.id is a Python @property, not an NDB Property.
            property_name = 'id'
        elif not isinstance(property_obj, datastore_services.Property):
            raise TypeError('%r is not an NDB Property' % property_obj)
        elif not any(
                p is property_obj for p in model_class._properties.values()): # pylint: disable=protected-access
            raise ValueError(
                '%r is not a property of %s' % (property_obj, self._model_kind))
        else:
            property_name = property_obj._name  # pylint: disable=protected-access

        self._property_name = property_name

    @property
    def model_kind(self) -> str:
        """Returns the kind of model this instance refers to.

        Returns:
            str. The model's kind.
        """
        return self._model_kind

    @property
    def property_name(self) -> str:
        """Returns the name of the property this instance refers to.

        Returns:
            str. The name of the property.
        """
        return self._property_name

    # Here we use type Any because this method yields the values of properties
    # of a model and that values can be of type string, list, integer and other
    # types too. So, that's why Iterator[Any] type is used as a yield type of
    # function.
    def yield_value_from_model(
        self, model: base_models.BaseModel
    ) -> Iterator[Any]:
        """Yields the value(s) of the property from the given model.

        If the property is repeated, all values are yielded. Otherwise, a single
        value is yielded.

        Args:
            model: *. A subclass of BaseModel.

        Yields:
            *. The value(s) of the property.

        Raises:
            TypeError. When the argument is not a model.
        """
        if not isinstance(model, self._to_model_class()):
            raise TypeError(
                '%r is not an instance of %s' % (model, self._model_kind))
        value = job_utils.get_model_property(model, self._property_name)
        if self._is_repeated_property():
            for item in value:
                yield item
        else:
            yield value

    def _to_model_class(self) -> Type[base_models.BaseModel]:
        """Returns the model class associated with this instance.

        Returns:
            type(BaseModel). The model type.
        """
        model_class = job_utils.get_model_class(self._model_kind)

        # To narrow down the type from datastore_services.Model to
        # base_models.BaseModel, we used assert statement here.
        assert issubclass(model_class, base_models.BaseModel)
        return model_class

    def _to_property(self) -> PropertyType:
        """Returns the Property object associated with this instance.

        Returns:
            *. A property instance.
        """
        property_obj = getattr(self._to_model_class(), self._property_name)

        # The behavior of `id` Python property is different during type
        # checking and during runtime. During type checking it is considered as
        # `Callable[]` because a Python property is decorated using Python's
        # property class, while during runtime a Python property is considered
        # as instance of Python's inbuilt property class. So to split the
        # assertion in both the cases, we used `if MYPY:` clause here.
        if MYPY: # pragma: no cover
            assert (
                isinstance(property_obj, datastore_services.Property) and
                callable(property_obj)
            )
        else:
            assert isinstance(
                property_obj,
                (datastore_services.Property, property)
            )

        return property_obj

    def _is_repeated_property(self) -> bool:
        """Returns whether the property is repeated.

        Returns:
            bool. Whether the property is repeated.
        """
        model_property = self._to_property()
        if (
            self._property_name != 'id' and
            isinstance(model_property, datastore_services.Property)
        ):
            return model_property._repeated  # pylint: disable=protected-access
        else:
            return False

    def __getstate__(self) -> Tuple[str, str]:
        """Called by pickle to get the value that uniquely defines self.

        Returns:
            tuple(str, str). The model's kind and the name of the property.
        """
        return self._model_kind, self._property_name

    def __setstate__(self, state: Tuple[str, str]) -> None:
        """Called by pickle to build an instance from __getstate__'s value.

        Args:
            state: tuple(str, str). The model's kind and the property's name.
        """
        self._model_kind, self._property_name = state

    def __str__(self) -> str:
        return '%s.%s' % (self._model_kind, self._property_name)

    def __repr__(self) -> str:
        return 'ModelProperty(%s, %s)' % (self._model_kind, self)

    # NOTE: Here we use type Any because the function could also return
    # NotImplemented:
    # https://github.com/python/mypy/issues/363#issue-39383094
    def __eq__(self, other: Any) -> Any:
        return (
            (self._model_kind, self._property_name) == (
                other._model_kind, other._property_name) # pylint: disable=protected-access
            if self.__class__ is other.__class__ else NotImplemented)

    # NOTE: Here we use type Any because the function could also return
    # NotImplemented:
    # https://github.com/python/mypy/issues/363#issue-39383094
    def __ne__(self, other: Any) -> Any:
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __hash__(self) -> int:
        return hash((self._model_kind, self._property_name))
