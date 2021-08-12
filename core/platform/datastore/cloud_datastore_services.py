# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Provides a seam for datastore services."""

from __future__ import absolute_import
from __future__ import unicode_literals

import contextlib

from core.platform import models

from google.cloud import ndb

from typing import ( # isort:skip # pylint: disable=unused-import
    Any, Dict, List, Optional, Sequence, Text, Tuple, TypeVar)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models  # pylint: disable=unused-import
    from mypy_imports import transaction_services

transaction_services = models.Registry.import_transaction_services()


Model = ndb.Model
Key = ndb.Key
Property = ndb.Property
Query = ndb.Query
RedisCache = ndb.RedisCache

BooleanProperty = ndb.BooleanProperty
DateProperty = ndb.DateProperty
DateTimeProperty = ndb.DateTimeProperty
FloatProperty = ndb.FloatProperty
IntegerProperty = ndb.IntegerProperty
JsonProperty = ndb.JsonProperty
StringProperty = ndb.StringProperty
TextProperty = ndb.TextProperty

TYPE_MODEL_SUBCLASS = TypeVar('TYPE_MODEL_SUBCLASS', bound=Model)  # pylint: disable=invalid-name


CLIENT = ndb.Client()


def get_ndb_context(namespace: Optional[str] = None,
                    global_cache: Optional[RedisCache] = None) -> ndb.context.Context:
    """Get the context of the Cloud NDB. This context needs to be entered in
    order to do any Cloud NDB operations.

    Returns:
        ndb.context.Context. Cloud NDB context.
    """
    # The raise_context_error arg is set to False, because we want to generate
    # a new context if we are outside of one. This is used because in some
    # places we need a context but we are unsure if it exists.
    context = ndb.get_context(raise_context_error=False)
    return (
        CLIENT.context(namespace=namespace, global_cache=global_cache)
        if context is None else contextlib.nullcontext(enter_result=context)
    )


def get_multi(keys: List[Key]) -> List[Optional[TYPE_MODEL_SUBCLASS]]:
    """Fetches models corresponding to a sequence of keys.

    Args:
        keys: list(str). The keys to look up.

    Returns:
        list(datastore_services.Model | None). List whose items are either a
        Model instance or None if the corresponding key wasn't found.
    """
    return ndb.get_multi(keys)


def update_timestamps_multi(entities: Sequence[base_models.BaseModel],
                            update_last_updated_time: bool = True) -> None:
    """Update the created_on and last_updated fields of all given entities.

    Args:
        entities: list(datastore_services.Model). List of model instances to
            be stored.
        update_last_updated_time: bool. Whether to update the
            last_updated field of the model.
    """
    for entity in entities:
        entity.update_timestamps(
            update_last_updated_time=update_last_updated_time)


def put_multi(entities: List[TYPE_MODEL_SUBCLASS]) -> List[Text]:
    """Stores a sequence of Model instances.

    Args:
        entities: list(datastore_services.Model). A list of Model instances.

    Returns:
        list(str). A list with the stored keys.
    """
    return ndb.put_multi(entities)


@transaction_services.run_in_transaction_wrapper
def delete_multi_transactional(keys: List[Key]) -> List[None]:
    """Deletes models corresponding to a sequence of keys and runs it through
    a transaction. Either all models are deleted, or none of them in the case
    when the transaction fails.

    Args:
        keys: list(str). A list of keys.

    Returns:
        list(None). A list of Nones, one per deleted model.
    """
    return ndb.delete_multi(keys)


def delete_multi(keys: List[Key]) -> List[None]:
    """Deletes models corresponding to a sequence of keys.

    Args:
        keys: list(str). A list of keys.

    Returns:
        list(None). A list of Nones, one per deleted model.
    """
    return ndb.delete_multi(keys)


def query_everything(**kwargs: Dict[str, Any]) -> ndb.Query:
    """Returns a query that targets every single entity in the datastore."""
    return ndb.Query(**kwargs)


def all_of(*nodes: ndb.Node) -> ndb.Node:
    """Returns a query node which performs a boolean AND on their conditions.

    Args:
        *nodes: datastore_services.Node. The nodes to combine.

    Returns:
        datastore_services.Node. A node combining the conditions using boolean
        AND.
    """
    return ndb.AND(*nodes)


def any_of(*nodes: ndb.Node) -> ndb.Node:
    """Returns a query node which performs a boolean OR on their conditions.

    Args:
        *nodes: datastore_services.Node. The nodes to combine.

    Returns:
        datastore_services.Node. A node combining the conditions using boolean
        OR.
    """
    return ndb.OR(*nodes)


def make_cursor(urlsafe_cursor: Optional[Text] = None) -> datastore_query.Cursor:
    """Makes an immutable cursor that points to a relative position in a query.

    The position denoted by a Cursor is relative to the result of a query, even
    if the result is removed later on. Usually, the position points to whatever
    immediately follows the last result of a batch.

    A cursor should only be used on a query with an identical signature to the
    one that produced it, or on a query with its sort order reversed.

    A Cursor constructed with no arguments points to the first result of any
    query. If such a Cursor is used as an end_cursor, no results will be
    returned.

    Args:
        urlsafe_cursor: str | None. The base64-encoded serialization of a
            cursor. When None, the cursor returned will point to the first
            result of any query.

    Returns:
        datastore_query.Cursor. A cursor into an arbitrary query.
    """
    return ndb.Cursor(urlsafe=urlsafe_cursor)


def fetch_multiple_entities_by_ids_and_models(
        ids_and_models: List[Tuple[Text, List[Text]]]
) -> List[List[Optional[TYPE_MODEL_SUBCLASS]]]:
    """Fetches the entities from the datastore corresponding to the given ids
    and models.

    Args:
        ids_and_models: list(tuple(str, list(str))). The ids and their
            corresponding model names for which we have to fetch entities.

    Returns:
        list(list(datastore_services.Model)). The model instances corresponding
        to the ids and models. The models corresponding to the same tuple in the
        input are grouped together.
    """
    entity_keys: List[Key] = []
    for (model_name, entity_ids) in ids_and_models:
        # Add the keys to the list of keys whose entities we have to fetch.
        entity_keys = (
            entity_keys +
            [ndb.Key(model_name, entity_id) for entity_id in entity_ids])

    all_models: List[Optional[TYPE_MODEL_SUBCLASS]] = ndb.get_multi(entity_keys)
    all_models_grouped_by_model_type: List[List[Optional[TYPE_MODEL_SUBCLASS]]] = []

    start_index = 0
    for (_, entity_ids) in ids_and_models:
        all_models_grouped_by_model_type.append(
            all_models[start_index:start_index + len(entity_ids)])
        start_index = start_index + len(entity_ids)

    return all_models_grouped_by_model_type
