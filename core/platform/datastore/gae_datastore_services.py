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

def fetch_multiple_entities_by_keys(keys):
    """Fetches the entities from the datastore corresponding to the keys."""

    return ndb.get_multi(keys)


def get_keys_from_ids_and_model(entity_ids, model_name):
    """Returns the list of keys corresponding to the ids and the model."""

    return [ndb.Key(model_name, entity_id) for entity_id in entity_ids]
