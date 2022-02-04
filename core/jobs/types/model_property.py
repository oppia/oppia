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

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class ModelProperty:
    """Represents a Property in a BaseModel subclass."""

    __slots__ = ('_model_kind', '_property_name')

    def __init__(self, model_class, property_obj):
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
        elif not issubclass(model_class, base_models.BaseModel):
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
            property_name = property_obj._name # pylint: disable=protected-access

        self._property_name = property_name

    @property
    def model_kind(self):
        """Returns the kind of model this instance refers to.

        Returns:
            str. The model's kind.
        """
        return self._model_kind

    @property
    def property_name(self):
        """Returns the name of the property this instance refers to.

        Returns:
            str. The name of the property.
        """
        return self._property_name

    def yield_value_from_model(self, model):
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

    def _to_model_class(self):
        """Returns the model class associated with this instance.

        Returns:
            type(BaseModel). The model type.
        """
        return job_utils.get_model_class(self._model_kind)

    def _to_property(self):
        """Returns the Property object associated with this instance.

        Returns:
            *. A property instance.
        """
        return getattr(self._to_model_class(), self._property_name)

    def _is_repeated_property(self):
        """Returns whether the property is repeated.

        Returns:
            bool. Whether the property is repeated.
        """
        return self._property_name != 'id' and self._to_property()._repeated # pylint: disable=protected-access

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self.

        Returns:
            tuple(str, str). The model's kind and the name of the property.
        """
        return self._model_kind, self._property_name

    def __setstate__(self, state):
        """Called by pickle to build an instance from __getstate__'s value.

        Args:
            state: tuple(str, str). The model's kind and the property's name.
        """
        self._model_kind, self._property_name = state

    def __str__(self):
        return '%s.%s' % (self._model_kind, self._property_name)

    def __repr__(self):
        return 'ModelProperty(%s, %s)' % (self._model_kind, self)

    def __eq__(self, other):
        return (
            (self._model_kind, self._property_name) == (
                other._model_kind, other._property_name) # pylint: disable=protected-access
            if self.__class__ is other.__class__ else NotImplemented)

    def __ne__(self, other):
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __hash__(self):
        return hash((self._model_kind, self._property_name))
