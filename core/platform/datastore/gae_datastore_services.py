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

from google.appengine.ext import ndb

def fetch_multiple_entities_by_ids_and_models(ids_and_models):
    """Fetches the entities from the datastore corresponding to the given ids
    and models.

    Args:
        ids_and_models: list(list(model_name, entity_ids)). The ids and their
            corresponding models for which we have to fetch entities.

    Returns:
        list(Model instance). The model instances corresponding to the
    """
    entity_keys = []
    for ids_and_model in ids_and_models:
        model_name = ids_and_model[0]
        entity_ids = ids_and_model[1]

        # Add the keys to the list of keys whose entities we have to fetch.
        entity_keys = (
            entity_keys +
            [ndb.Key(model_name, entity_id) for entity_id in entity_ids])

    return ndb.get_multi(entity_keys)
