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

from google.cloud import datastore as cloud_datastore_types

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


def get_model_kind(item):
    """Returns the "kind", a globally unique identifier, of the given item.

    NOTE: A model's kind is usually, but not always, the same as a model's class
    name. This function will always return the correct value for "kind", even if
    it is different from the class's name.

    Args:
        item: base_models.Model|cloud_datastore_types.Entity. The item to
            inspect.

    Returns:
        str. The item's kind.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(item, base_models.BaseModel) or (
            isinstance(item, type) and issubclass(item, base_models.BaseModel)):
        return item._get_kind() # pylint: disable=protected-access
    elif isinstance(item, cloud_datastore_types.Entity):
        return item.kind
    else:
        raise TypeError('%r is not a model type' % type(item).__name__)
