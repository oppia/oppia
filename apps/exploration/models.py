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

from apps.base_model.models import IdModel
from apps.parameter.models import Parameter
from apps.parameter.models import ParamChange
from apps.state.models import State
import feconf
import utils

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.ext.db import BadValueError


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(IdModel):
    """Storage model for an Oppia exploration.

    This class should only be imported by the exploration services file and the
    Exploration model test file.
    """
    # TODO(sll): Write a test that ensures that the only two files that are
    # allowed to import this class are the exploration services file and the
    # Exploration tests file.

    # TODO(sll): Consider splitting this file into a domain file and a model
    # file. The former would contain all properties and methods that need not
    # be re-implemented for multiple storage models. The latter would contain
    # only the attributes and methods that need to be re-implemented for the
    # different storage models.

    def _pre_put_hook(self):
        """Validates the exploration before it is put into the datastore."""
        if not self.states:
            raise BadValueError('This exploration has no states.')
        if not self.is_demo and not self.editors:
            raise BadValueError('This exploration has no editors.')

    # The category this exploration belongs to.
    category = ndb.StringProperty(required=True)
    # What this exploration is called.
    title = ndb.StringProperty(default='New exploration')
    # The list of states this exploration consists of. This list should not be
    # empty.
    states = ndb.KeyProperty(kind=State, repeated=True)
    # The list of parameters associated with this exploration.
    parameters = ndb.LocalStructuredProperty(Parameter, repeated=True)
    # Whether this exploration is publicly viewable.
    is_public = ndb.BooleanProperty(default=False)
    # The id for the image to show as a preview of the exploration.
    image_id = ndb.StringProperty()
    # List of users who can edit this exploration. If the exploration is a demo
    # exploration, the list is empty. Otherwise, the first element is the
    # original creator of the exploration.
    editors = ndb.UserProperty(repeated=True)

    @property
    def init_state(self):
        """The state which forms the start of this exploration."""
        return self.states[0].get()

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations."""
        return self.id.isdigit() and (
            0 <= int(self.id) < len(feconf.DEMO_EXPLORATIONS))

    def _has_state_named(self, state_name):
        """Whether the exploration contains a state with the given name."""
        return any([state.get().name == state_name for state in self.states])

    def is_editable_by(self, user):
        """Whether the given user has rights to edit this exploration."""
        return user and (
            user in self.editors or users.is_current_user_admin())

    def is_owned_by(self, user):
        """Whether the given user owns the exploration."""
        if self.is_demo:
            return users.is_current_user_admin()
        else:
            return user and user == self.editors[0]

    @classmethod
    def get_public_explorations(cls):
        """Returns an iterable containing publicly-available explorations."""
        return cls.query().filter(cls.is_public == True)

    @classmethod
    def get_viewable_explorations(cls, user):
        """Returns a list of explorations viewable by the given user."""
        return cls.query().filter(
            ndb.OR(cls.is_public == True, cls.editors == user)
        )

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.query().count()

    @property
    def as_yaml(self):
        """Returns a YAML version of the exploration."""
        params = []
        for param in self.parameters:
            params.append({'name': param.name, 'obj_type': param.obj_type,
                           'values': param.values})

        init_states_list = []
        others_states_list = []

        for state_key in self.states:
            state = state_key.get()
            state_internals = state.internals_as_dict(
                self, human_readable_dests=True)

            if self.init_state.id == state.id:
                init_states_list.append(state_internals)
            else:
                others_states_list.append(state_internals)

        full_state_list = init_states_list + others_states_list
        result_dict = {'parameters': params, 'states': full_state_list}
        return utils.yaml_from_dict(result_dict)

    def add_state(self, state_name, state_id=None):
        """Adds a new state, and returns it."""
        if self._has_state_named(state_name):
            raise Exception('Duplicate state name %s' % state_name)

        state_id = state_id or State.get_new_id(state_name)
        new_state = State(id=state_id, name=state_name)
        new_state.put()

        self.states.append(new_state.key)
        self.put()

        return new_state

    def rename_state(self, state, new_state_name):
        """Renames a state of this exploration."""
        if state.name == new_state_name:
            return

        if self._has_state_named(new_state_name):
            raise Exception('Duplicate state name: %s' % new_state_name)

        state.name = new_state_name
        state.put()

    def get_state_by_id(self, state_id):
        """Returns a state of this exploration, given its id."""
        for state_key in self.states:
            if state_key.id() == state_id:
                return state_key.get()

    def get_param_change_instance(self, param_name, obj_type=None):
        """Gets a ParamChange instance corresponding to the param_name.

        Creates the parameter, defaulting to the given obj_type (or, if not
        specified, UnicodeString), if no such param_name exists.
        """
        for param in self.parameters:
            if param.name == param_name:
                if obj_type and param.obj_type != obj_type:
                    raise Exception(
                        'Parameter %s has wrong obj_type: was %s, expected %s'
                        % (param_name, obj_type, param.obj_type))
                return ParamChange(name=param.name, obj_type=param.obj_type)

        # The parameter was not found, so add it.
        if not obj_type:
            obj_type = 'UnicodeString'
        self.parameters.append(
            Parameter(name=param_name, obj_type=obj_type))
        self.put()
        return ParamChange(name=param_name, obj_type=obj_type)
