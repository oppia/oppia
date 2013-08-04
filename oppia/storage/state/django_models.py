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

import oppia.storage.base_model.models as base_models

from django.db import models

from oppia.django_utils import JSONField

QUERY_LIMIT = 100


class StateModel(base_models.IdModel):
    """A state, represented as a JSON blob."""
    # JSON representation of a state.
    # TODO(sll): Prepend the exploration id to the id of this entity.
    value = JSONField(default={}, isdict=True)
    # When this entity was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this entity was last updated.
    last_updated = models.DateTimeField(auto_now=True)
