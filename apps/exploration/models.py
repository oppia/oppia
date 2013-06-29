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

import os

from apps.base_model.models import IdModel
from apps.image.models import Image
from apps.parameter.models import Parameter
from apps.parameter.models import ParamChange
from apps.state.models import State
import feconf
import logging
import utils

from google.appengine.ext import ndb
from google.appengine.ext.db import BadValueError


# TODO(sll): Add an anyone-can-edit mode.
class Exploration(IdModel):
    """An exploration (which is made up of several states)."""
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

    # The state which forms the start of this exploration.
    @property
    def init_state(self):
        return self.states[0].get()

    def _has_state_named(self, state_name):
        """Checks if a state with the given name exists in this exploration."""
        return any([state.get().name == state_name for state in self.states])

    def _pre_put_hook(self):
        """Validates the exploration before it is put into the datastore."""
        if not self.states:
            raise BadValueError('This exploration has no states.')
        if not self.is_demo_exploration() and not self.editors:
            raise BadValueError('This exploration has no editors.')

    @classmethod
    def create(cls, user, title, category, exploration_id=None,
               init_state_name=feconf.DEFAULT_STATE_NAME, image_id=None):
        """Creates and returns a new exploration."""
        # Generate a new exploration id, if one wasn't passed in.
        exploration_id = exploration_id or cls.get_new_id(title)

        # Note that demo explorations do not have owners, so user may be None.
        exploration = cls(
            id=exploration_id, title=title, category=category,
            image_id=image_id, states=[],
            editors=[user] if user else [])
        exploration.add_state(init_state_name)
        exploration.put()

        return exploration

    def delete(self):
        """Deletes an exploration."""
        for state_key in self.states:
            state_key.delete()
        self.key.delete()

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

    @classmethod
    def create_from_yaml(
        cls, yaml_file, user, title, category, exploration_id=None,
            image_id=None):
        """Creates an exploration from a YAML file."""
        exploration_dict = utils.dict_from_yaml(yaml_file)
        init_state_name = exploration_dict['states'][0]['name']

        exploration = cls.create(
            user, title, category, exploration_id=exploration_id,
            init_state_name=init_state_name, image_id=image_id)

        init_state = State.get_by_name(init_state_name, exploration)

        try:
            for param in exploration_dict['parameters']:
                exploration.parameters.append(Parameter(
                    name=param['name'], obj_type=param['obj_type'],
                    values=param['values'])
                )

            state_list = []
            exploration_states = exploration_dict['states']
            for state_description in exploration_states:
                state_name = state_description['name']
                state = (init_state if state_name == init_state_name
                         else exploration.add_state(state_name))
                state_list.append({'state': state, 'desc': state_description})

            for index, state in enumerate(state_list):
                State.modify_using_dict(
                    exploration, state['state'], state['desc'])
        except Exception:
            exploration.delete()
            raise

        return exploration

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

    def is_demo_exploration(self):
        """Checks if the exploration is one of the demo explorations."""
        if not self.id.isdigit():
            return False

        id_int = int(self.id)
        return id_int >= 0 and id_int < len(feconf.DEMO_EXPLORATIONS)

    @classmethod
    def load_demo_explorations(cls):
        """Initializes the demo explorations."""
        for index, exploration in enumerate(feconf.DEMO_EXPLORATIONS):
            assert len(exploration) in [3, 4], (
                'Invalid format for demo exploration: %s' % exploration)

            yaml_filename = '%s.yaml' % exploration[0]
            yaml_file = utils.get_file_contents(
                os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR, yaml_filename))

            title = exploration[1]
            category = exploration[2]
            image_filename = exploration[3] if len(exploration) == 4 else None

            image_id = None
            if image_filename:
                with open(os.path.join(
                        feconf.SAMPLE_IMAGES_DIR, image_filename)) as f:
                    raw_image = f.read()
                image_id = Image.create(raw_image)

            exploration = cls.create_from_yaml(
                yaml_file=yaml_file, user=None, title=title, category=category,
                exploration_id=str(index), image_id=image_id)
            exploration.is_public = True
            exploration.put()

    @classmethod
    def delete_demo_explorations(cls):
        """Deletes the demo explorations."""
        exploration_list = []
        for int_id in range(len(feconf.DEMO_EXPLORATIONS)):
            exploration = cls.get(str(int_id), strict=False)
            if not exploration:
                # This exploration does not exist, so it cannot be deleted.
                logging.info('No exploration with id %s found.' % int_id)
            else:
                exploration_list.append(exploration)

        for exploration in exploration_list:
            exploration.delete()

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
