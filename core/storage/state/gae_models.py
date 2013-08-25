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

import core.storage.base_model.gae_models as base_models
import core.storage.exploration.gae_models as exp_models

from google.appengine.ext import ndb


class StateModel(base_models.BaseModel):
    """A state, represented as a JSON blob."""

    @classmethod
    def _get_exploration_key(cls, exploration_id):
    	return ndb.Key(
    		exp_models.ExplorationModel._get_kind(), exploration_id)

    def __init__(self, **kwargs):
    	exploration_id = kwargs.get('exploration_id')
    	exploration_key = None
    	if exploration_id:
    	    exploration_key = StateModel._get_exploration_key(exploration_id)
    	    del kwargs['exploration_id']
    	super(StateModel, self).__init__(parent=exploration_key, **kwargs)

    @classmethod
    def get(cls, exploration_id, state_id, strict=True):
    	"""Gets a state by id."""
    	exploration_key = cls._get_exploration_key(exploration_id)
    	return super(StateModel, cls).get(
    		state_id, strict=strict, parent=exploration_key)

    # JSON representation of a state.
    value = ndb.JsonProperty(required=True)
    # When this entity was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this entity was last updated.
    last_updated = ndb.DateTimeProperty(auto_now=True)
