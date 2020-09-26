# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from google.appengine.datastore import datastore_query
from google.appengine.ext import ndb


def make_cursor(urlsafe_cursor=None):
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
    return datastore_query.Cursor(urlsafe=urlsafe_cursor)


def fetch_multiple_entities_by_ids_and_models(ids_and_models):
    """Fetches the entities from the datastore corresponding to the given ids
    and models.

    Args:
        ids_and_models: list(tuple(str, list(str))). The ids and their
            corresponding model names for which we have to fetch entities.

    Returns:
        list(list(ndb.Model)). The model instances corresponding to the ids and
        models. The models corresponding to the same tuple in the input are
        grouped together.
    """
    entity_keys = []
    for (model_name, entity_ids) in ids_and_models:
        # Add the keys to the list of keys whose entities we have to fetch.
        entity_keys = (
            entity_keys +
            [ndb.Key(model_name, entity_id) for entity_id in entity_ids])

    all_models = ndb.get_multi(entity_keys)
    all_models_grouped_by_model_type = []

    start_index = 0
    for (_, entity_ids) in ids_and_models:
        all_models_grouped_by_model_type.append(
            all_models[start_index:start_index + len(entity_ids)])
        start_index = start_index + len(entity_ids)

    return all_models_grouped_by_model_type
