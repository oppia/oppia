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

"""Model for an Oppia exploration."""

__author__ = 'Sean Lip'

from google.appengine.ext import ndb

from state import State
from parameter import Parameter


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(ndb.Model):
    """An exploration (which is made up of several states)."""
    # A hash_id to show in the browser.
    hash_id = ndb.StringProperty(required=True)
    # The original creator of this exploration.
    owner = ndb.UserProperty()
    # The category this exploration belongs to.
    # TODO(sll): Should this be a 'repeated' property?
    category = ndb.StringProperty(required=True)
    # What this exploration is called.
    title = ndb.StringProperty(default='New exploration')
    # The state which forms the start of this exploration.
    init_state = ndb.KeyProperty(kind=State, required=True)
    # The list of states this exploration consists of.
    states = ndb.KeyProperty(kind=State, repeated=True)
    # The list of parameters associated with this exploration
    parameters = ndb.KeyProperty(kind=Parameter, repeated=True)
    # Whether this exploration is publicly viewable.
    is_public = ndb.BooleanProperty(default=False)
    # The id for the image to show as a preview of the exploration.
    image_id = ndb.StringProperty()

    def delete(self):
        """Deletes an exploration."""
        for state_key in self.states:
            state_key.delete()
        self.key.delete()
