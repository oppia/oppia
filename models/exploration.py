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

from base_model import BaseModel
import feconf
from state import State
import utils

from google.appengine.ext import ndb


class Parameter(ndb.Model):
    """A parameter definition for an exploration."""
    # The name of the parameter
    name = ndb.StringProperty(required=True)
    # The data type of the parameter - for now only string or list
    param_type = ndb.StringProperty(required=True)


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(BaseModel):
    """An exploration (which is made up of several states)."""
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
    parameters = ndb.StructuredProperty(Parameter, repeated=True)
    # Whether this exploration is publicly viewable.
    is_public = ndb.BooleanProperty(default=False)
    # The id for the image to show as a preview of the exploration.
    image_id = ndb.StringProperty()
    # List of email addresses of users who can edit this exploration.
    editors = ndb.StringProperty(repeated=True)

    @classmethod
    def create(cls, user, title, category, exploration_id,
               init_state_name='Activity 1'):
        """Creates and returns a new exploration."""
        if exploration_id is None:
            exploration_id = utils.get_new_id(Exploration, title)
        state_id = utils.get_new_id(State, init_state_name)

        # Temporarily create a fake initial state key.
        # TODO(sll): Do this in a transaction so it doesn't break other things.
        fake_state_key = ndb.Key(State, state_id)

        exploration = Exploration(
            id=exploration_id, owner=user, title=title,
            init_state=fake_state_key, category=category)
        exploration.put()
        new_init_state = State.create(state_id, exploration, init_state_name)

        # Replace the fake key with its real counterpart.
        exploration.init_state = new_init_state.key
        exploration.states = [new_init_state.key]
        exploration.put()
        return exploration

    @classmethod
    def get(cls, exploration_id):
        """Gets an exploration by id. If it does not exist, returns None."""
        return cls.get_by_id(exploration_id)

    def delete(self):
        """Deletes an exploration."""
        for state_key in self.states:
            state_key.delete()
        self.key.delete()

    def is_demo(self):
        """Checks if the exploration is one of the demos."""
        return len(self.id) < 4

    def as_yaml(self):
        """Returns a copy of the exploration as YAML."""
        init_dict = {}
        exploration_dict = {}
        for state_key in self.states:
            state = state_key.get()

            state_internals = state.internals_as_dict()
            # Change the dest id to a dest name.
            for handler in state_internals['widget']['handlers']:
                for rule in handler['rules']:
                    if rule['dest'] != feconf.END_DEST:
                        rule['dest'] = State.get(rule['dest'], self).name

            if self.init_state.get().id == state.id:
                init_dict[state.name] = state_internals
            else:
                exploration_dict[state.name] = state_internals

        result = utils.get_yaml_from_dict(init_dict)
        if exploration_dict:
            result += utils.get_yaml_from_dict(exploration_dict)
        return result

    def add_state(self, state_name):
        """Adds a new state to the exploration, and returns the state."""
        state_id = utils.get_new_id(State, state_name)
        state = State.create(state_id, self, state_name)

        self.states.append(state.key)
        self.put()
        return state
