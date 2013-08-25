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

from core import django_utils
import core.storage.base_model.models as base_models

from django.db import models

QUERY_LIMIT = 100


class StateModel(base_models.BaseModel):
    """A state, represented as a JSON blob."""

    def __init__(self, **kwargs):
    	exploration_id = kwargs.get('exploration_id')
    	if exploration_id:
    	    del kwargs['exploration_id']
    	super(StateModel, self).__init__(**kwargs)

    @classmethod
    def get(cls, exploration_id, state_id, strict=True):
    	"""Gets a state by id."""
    	return super(StateModel, cls).get(state_id, strict=strict)

    # JSON representation of a state.
    # TODO(sll): Prepend the exploration id to the id of this entity.
    value = django_utils.JSONField(default={}, isdict=True)
    # When this entity was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this entity was last updated.
    last_updated = models.DateTimeField(auto_now=True)
