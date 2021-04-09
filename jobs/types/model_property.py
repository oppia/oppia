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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import itertools

from core.platform import models
import feconf
from jobs import job_utils
import python_utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services  = models.Registry.import_datastore_services()


class ModelProperty(python_utils.OBJECT):
    """Represents a Property in a BaseModel subclass."""

    __slots__ = ('_model_class', '_property_obj')

    def __init__(self, model_class, property_obj):
        """Initializes a new ModelProperty instance.

        Args:
            model_class: class. A subclass of base_models.BaseModel.
            property_obj: datastore_services.Property|@property. An instance of
                an NDB Property or Python @property.

        Raises:
            TypeError. The model_class is not a class.
            TypeError. The model_class is not a subclass of BaseModel.
            TypeError. The property_class is not a type.
            TypeError. The property_class is not a subclass of Property.
        """
        if not isinstance(model_class, type):
            raise TypeError('%r is not a model class' % model_class)
        elif not issubclass(model_class, base_models.BaseModel):
            raise TypeError('%r is not a subclass of BaseModel' % model_class)

        if property_obj is model_class.id:
            # BaseModel.id is a Python @property, not an NDB Property.
            pass
        elif not isinstance(property_obj, datastore_services.Property):
            raise TypeError('%r is not a property' % property_obj)
        elif not any(
                property_obj is p for p in model_class._properties.values()):
            raise ValueError('%r is not in properties of model' % property_obj)

        self._model_class = model_class
        self._property_obj = property_obj

    @property
    def model_kind(self):
        """Returns the kind of model this instance refers to.

        Returns:
            bytes. The model's kind.
        """
        return job_utils.get_model_kind(self._model_class)

    @property
    def property_name(self):
        """Returns the name of the property this instance refers to.

        Returns:
            bytes. The name of the property.
        """
        return (
            'id' if self._property_obj is self._model_class.id else
            self._property_obj._name)

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
        if not isinstance(model, self._model_class):
            raise TypeError('%r is not an instance of %s' % (
                model, self.model_kind))
        value = job_utils.get_model_property(model, self.property_name)
        if self._is_repeated_property:
            for v in value:
                yield v
        else:
            yield value

    @property
    def _is_repeated_property(self):
        """Returns whether the property is repeated.

        Returns:
            bool. Whether the property is repeated.
        """
        return (
            self._property_obj is not self._model_class.id and
            self._property_obj._repeated)

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self.

        Returns:
            tuple(class, bytes). The model class and the name of the property.
                We can't return the property object itself because it isn't
                picklable.
        """
        return (self._model_class, self.property_name)

    def __setstate__(self, state):
        """Called by pickle to build an instance from __getstate__'s value.

        Args:
            state: tuple(class, bytes). The model class and the name of the
                property.
        """
        self._model_class, property_name = state
        self._property_obj = self._model_class._properties[property_name]

    def __str__(self):
        return '%s.%s' % (self.model_kind, self.property_name)

    def __eq__(self, other):
        return (
            (self._model_class is other._model_class and
                self._property_obj is other._property_obj)
            if self.__class__ is other.__class__ else NotImplemented)

    def __ne__(self, other):
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __hash__(self):
        return hash((self._model_class, self._property_obj))
