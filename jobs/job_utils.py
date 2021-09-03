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

from __future__ import absolute_import
from __future__ import unicode_literals

from core.platform import models
import feconf

from apache_beam.io.gcp.datastore.v1new import types as beam_datastore_types
from google.cloud.ndb import model as ndb_model
from google.cloud.ndb import query as ndb_query

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services

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
    model_id = new_values.pop('id', None) or get_model_id(model)
    cls = model.__class__
    props = {k: v.__get__(model, cls) for k, v in cls._properties.items()} # pylint: disable=protected-access
    props.update(new_values)
    with datastore_services.get_ndb_context():
        return cls(id=model_id, **props)


def get_model_class(kind):
    """Returns the model class corresponding to the given kind.

    NOTE: A model's kind is usually, but not always, the same as a model's class
    name. Specifically, the kind is different when a model overrides the
    _get_kind() class method. Although Oppia never does this, the Apache Beam
    framework uses "kind" to refer to models _extensively_, so we follow the
    same convention and take special care to always return the correct value.

    Args:
        kind: str. The model's kind.

    Returns:
        type(datastore_services.Model). The corresponding class.

    Raises:
        KindError. Internally raised by _lookup_model when the kind is invalid.
    """
    return datastore_services.Model._lookup_model(kind)  # pylint: disable=protected-access


def get_model_kind(model: datastore_services.Model) -> str:
    """Returns the "kind" of the given model.

    NOTE: A model's kind is usually, but not always, the same as a model's class
    name. Specifically, the kind is different when a model overwrites the
    _get_kind() class method. Although Oppia never does this, the Apache Beam
    framework uses "kind" to refer to models extensively, so we follow the same
    convention and take special care to always return the correct value.

    Args:
        model: datastore_services.Model. The model to inspect.

    Returns:
        str. The model's kind.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, datastore_services.Model) or (
            isinstance(model, type) and
            issubclass(model, datastore_services.Model)):
        return model._get_kind()  # pylint: disable=protected-access
    else:
        raise TypeError('%r is not a model type or instance' % model)


def get_model_id(model):
    """Returns the given model's ID.

    Args:
        model: datastore_services.Model. The model to inspect.

    Returns:
        bytes. The model's ID.

    Raises:
        TypeError. When the argument is not a model.
    """
    if isinstance(model, datastore_services.Model):
        return None if model.key is None else model.key.id()
    else:
        raise TypeError('%r is not a model instance' % model)


def get_model_property(model, property_name):
    """Returns the given property from a model.

    Args:
        model: datastore_services.Model. The model to inspect.
        property_name: str. The name of the property to extract.

    Returns:
        *. The property's value.

    Raises:
        TypeError. When the argument is not a model.
    """
    if property_name == 'id':
        return get_model_id(model)
    elif isinstance(model, datastore_services.Model):
        return getattr(model, property_name)
    else:
        raise TypeError('%r is not a model instance' % model)


def get_beam_entity_from_ndb_model(model):
    """Returns an Apache Beam entity equivalent to the given NDB model.

    Args:
        model: datastore_services.Model. The NDB model.

    Returns:
        beam_datastore_types.Entity. The Apache Beam entity.
    """
    # We use private _entity_to_ds_entity here because it provides
    # a functionality that we need and writing it ourselves would be
    # too complicated.
    return beam_datastore_types.Entity.from_client_entity(
        ndb_model._entity_to_ds_entity(model) # pylint: disable=protected-access
    )


def get_ndb_model_from_beam_entity(beam_entity):
    """Returns an NDB model equivalent to the given Apache Beam entity.

    Args:
        beam_entity: beam_datastore_types.Entity. The Apache Beam entity.

    Returns:
        datastore_services.Model. The NDB model.
    """
    ndb_key = get_ndb_key_from_beam_key(beam_entity.key)
    # We use private _lookup_model and _entity_from_ds_entity here because it
    # provides a functionality that we need and writing it ourselves would be
    # too complicated.
    ndb_model_class = datastore_services.Model._lookup_model(ndb_key.kind())  # pylint: disable=protected-access
    return ndb_model._entity_from_ds_entity( # pylint: disable=protected-access
        beam_entity.to_client_entity(), model_class=ndb_model_class)


def get_ndb_key_from_beam_key(beam_key):
    """Returns an NDB key equivalent to the given Apache Beam key.

    Args:
        beam_key: beam_datastore_types.Key. The Apache Beam key.

    Returns:
        datastore_services.Key. The NDB key.
    """
    return datastore_services.Key._from_ds_key(beam_key.to_client_key())  # pylint: disable=protected-access


def get_beam_key_from_ndb_key(ndb_key):
    """Returns an Apache Beam key equivalent to the given NDB key.

    Args:
        ndb_key: datastore_services.Key. The NDB key.

    Returns:
        beam_datastore_types.Key. The Apache Beam key.
    """
    return beam_datastore_types.Key(
        ndb_key.flat(), project=ndb_key.project(),
        namespace=ndb_key.namespace())


def get_beam_query_from_ndb_query(query, namespace=None):
    """Returns an equivalent Apache Beam query from the given NDB query.

    This function helps developers avoid learning two types of query syntaxes.
    Specifically, the datastoreio module offered by the Apache Beam SDK only
    accepts Beam datastore queries, and are implemented very differently from
    NDB queries. This function adapts the two patterns to make job code easier
    to write.

    Args:
        query: datastore_services.Query. The NDB query to convert.
        namespace: str|None. Namespace for isolating the NDB operations of
            tests.

    Returns:
        beam_datastore_types.Query. The equivalent Apache Beam query.
    """
    kind = query.kind
    # This is needed mainly for testing and it adds an easy way to force
    # the queries into their own namespace.
    namespace = namespace or query.namespace

    if query.filters:
        filters = _get_beam_filters_from_ndb_filter_node(query.filters)
    else:
        filters = None

    if query.order_by:
        order = _get_beam_order_from_ndb_order(query.order_by)
    else:
        order = ()

    if kind is None and not order:
        order = ('__key__',)

    return beam_datastore_types.Query(
        kind=kind,
        namespace=namespace,
        project=feconf.OPPIA_PROJECT_ID,
        filters=filters,
        order=order
    )


def _get_beam_filters_from_ndb_filter_node(filter_node):
    """Returns an equivalent Apache Beam filter from the given NDB filter node.

    Args:
        filter_node: ndb_query.FilterNode. The filter node to convert.

    Returns:
        tuple(tuple(str, str, str)). The equivalent Apache Beam filters. Items
        are: (property name, comparison operator, property value).
    """
    if isinstance(filter_node, ndb_query.ConjunctionNode):
        nodes = list(filter_node)  # pylint: disable=protected-access
    elif isinstance(filter_node, ndb_query.FilterNode):
        nodes = [filter_node]  # pylint: disable=protected-access
    else:
        raise TypeError(
            '`!=`, `IN`, and `OR` are forbidden filters. To emulate their '
            'behavior, use multiple AND queries and flatten them into a single '
            'PCollection.')

    return [(n._name, n._opsymbol, n._value) for n in nodes] # pylint: disable=protected-access


def _get_beam_order_from_ndb_order(orders):
    """Returns an equivalent Apache Beam order from the given datastore Order.

    Args:
        orders: list(datastore_query.Order). The datastore order to convert.

    Returns:
        tuple(str). The equivalent Apache Beam order.
    """
    return tuple('%s%s' % ('-' if o.reverse else '', o.name) for o in orders)
