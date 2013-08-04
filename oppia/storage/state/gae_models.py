# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Model for an Oppia state."""

__author__ = 'Sean Lip'

from oppia.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb


class StateModel(base_models.IdModel):
    """A state, represented as a JSON blob."""
    # JSON representation of a state.
    # TODO(sll): Prepend the exploration id to the id of this entity.
    value = ndb.JsonProperty(required=True)
    # When this entity was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this entity was last updated.
    last_updated = ndb.DateTimeProperty(auto_now=True)
