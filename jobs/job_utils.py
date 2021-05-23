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

"""Helper functions for beam validators and one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf

from apache_beam.io.gcp.datastore.v1new import types as beam_datastore_types

datastore_services = models.Registry.import_datastore_services()

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


def clone_model(model, **new_values):
    """Clones the entity, adding or overriding constructor attributes.

    The cloned entity will have exactly the same property values as the
    original entity, except where overridden. By default, it will have no
    parent entity or key name, unless supplied.

    IMPORTANT: This function should be used in EVERY DoFn, beacse one of Apache
    Beam's invariants is that all input values are IMMUTABLE.
    TODO(#12449): Use a metaclass to wrap DoFn.process() with a function that
    clones inputs, so that contributors don't need to remember to.

    Args:
        model: datastore_services.Model. Model to clone.
        **new_values: dict(str: *). Keyword arguments to override when
            invoking the cloned entity's constructor.

    Returns:
        datastore_services.Model. A cloned, and possibly modified, copy of self.
        Subclasses of BaseModel will return a clone with the same type.
    """
    # Reference implementation: https://stackoverflow.com/a/2712401/4859885.
    cls = model.__class__
    model_id = new_values.pop('id', model.id)
    props = {k: v.__get__(model, cls) for k, v in cls._properties.items()} # pylint: disable=protected-access
    props.update(new_values)
    return cls(id=model_id, **props)


def get_model_kind(model):
    """Returns the "kind" of the given model.

    NOTE: A model's kind is usually, but not always, the same as a model's class
    name. Specifically, the kind is different when a model overwrites the
    _get_kind() class method. Although Oppia never does this, the Apache Beam
    framework uses "kind" to refer to models extensively, so we follow the same
    convention and take special care to always return the correct value.

    Args:
        model: base_models.Model|beam_datastore_types.Entity. The model to
            inspect.

    Returns:
        bytes. The model's kind.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, base_models.BaseModel) or (
            isinstance(model, type) and
            issubclass(model, base_models.BaseModel)):
        return model._get_kind() # pylint: disable=protected-access
    elif isinstance(model, beam_datastore_types.Entity):
        return model.key.to_client_key().kind
    else:
        raise TypeError('%r is not a model type or instance' % model)


def get_model_property(model, property_name):
    """Returns the given property from a model.

    Args:
        model: base_models.Model|beam_datastore_types.Entity. The model to
            inspect.
        property_name: str. The name of the property to extract.

    Returns:
        *. The property's value.

    Raises:
        TypeError. When the argument is not a model.
    """
    if property_name == 'id':
        return get_model_id(model)
    elif isinstance(model, base_models.BaseModel):
        return getattr(model, property_name)
    elif isinstance(model, beam_datastore_types.Entity):
        return model.properties.get(property_name)
    else:
        raise TypeError('%r is not a model instance' % model)


def get_model_id(model):
    """Returns the given model's ID.

    Args:
        model: base_models.Model|beam_datastore_types.Entity. The model to
            inspect.

    Returns:
        bytes. The model's ID.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, base_models.BaseModel):
        return model.id
    elif isinstance(model, beam_datastore_types.Entity):
        return model.key.to_client_key().id_or_name
    else:
        raise TypeError('%r is not a model instance' % model)


def get_beam_entity_from_model(model):
    """Returns an Apache Beam representation of the given NDB model.

    Args:
        model: datastore_services.Model. The model to convert.

    Returns:
        beam_datastore_types.Entity. The Apache Beam representation of the
        model.
    """
    beam_entity = beam_datastore_types.Entity(
        beam_datastore_types.Key(
            model.key.flat(), project=feconf.OPPIA_PROJECT_ID))
    beam_entity.set_properties(model._to_dict()) # pylint: disable=protected-access
    return beam_entity


def get_model_from_beam_entity(beam_entity):
    """Returns an NDB model representation of the given Apache Beam entity.

    Args:
        beam_entity: beam_datastore_types.Entity. The entity to convert.

    Returns:
        datastore_services.Model. The NDB model representation of the entity.
    """
    model_id = get_model_id(beam_entity)
    model_class = (
        datastore_services.Model._lookup_model(get_model_kind(beam_entity))) # pylint: disable=protected-access
    return model_class(id=model_id, **beam_entity.properties)
