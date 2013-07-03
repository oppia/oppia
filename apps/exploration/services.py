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

"""Commands that can be used to operate on Oppia explorations.

All functions here should be agnostic of how Exploration objects are stored in
the database. In particular, the get_exploration_by_id(), query(), put() and
delete() methods should delegate to the Exploration model class. This will
enable the exploration storage model to be changed without affecting this
class and others above it.
"""

__author__ = 'Sean Lip'

import copy
import logging
import os

from apps.exploration.models import Exploration
from apps.image.models import Image
from apps.parameter.models import ParamChange
from apps.parameter.models import Parameter
from apps.state.models import AnswerHandlerInstance
from apps.state.models import Content
from apps.state.models import Rule
from apps.state.models import State
from apps.state.models import WidgetInstance
from apps.widget.models import InteractiveWidget

import feconf
import utils


# Query methods.
def get_exploration_by_id(exploration_id, strict=True):
    """Gets an exploration by id. Fails noisily if strict == True."""
    return Exploration.get(exploration_id, strict=strict)


def get_all_explorations():
    """Returns a list of all explorations."""
    return Exploration.get_all_explorations()


def get_public_explorations():
    """Returns a list of publicly-available explorations."""
    return Exploration.get_public_explorations()


def get_viewable_explorations(user):
    """Returns a list of explorations viewable by the given user."""
    return Exploration.get_viewable_explorations(user)


def get_editable_explorations(user):
    """Returns a list of explorations editable by the given user."""
    return [exploration for exploration in get_viewable_explorations(user)
            if exploration.is_editable_by(user)]


def count_explorations():
    """Returns the total number of explorations."""
    return Exploration.get_exploration_count()


# Operations involving exploration parameters.
def get_or_create_param(exploration_id, param_name, obj_type=None):
    """Returns a ParamChange instance corresponding to the given inputs.

    If the parameter does not exist in the given exploration, it is added to
    the list of exploration parameters.

    If the obj_type is not specified it is taken to be 'UnicodeString'.

    If the obj_type does not match the obj_type for the parameter in the
    exploration, an Exception is raised.
    """
    exploration = get_exploration_by_id(exploration_id)

    for param in exploration.parameters:
        if param.name == param_name:
            if obj_type and param.obj_type != obj_type:
                raise Exception(
                    'Parameter %s has wrong obj_type: was %s, expected %s'
                    % (param_name, obj_type, param.obj_type))
            return ParamChange(name=param.name, obj_type=param.obj_type)

    # The parameter was not found, so add it.
    if not obj_type:
        obj_type = 'UnicodeString'
    exploration.parameters.append(
        Parameter(name=param_name, obj_type=obj_type))
    exploration.put()
    return ParamChange(name=param_name, obj_type=obj_type)


# Operations on states belonging to an exploration.
def rename_state(exploration_id, state, new_state_name):
    """Renames a state of this exploration."""
    exploration = get_exploration_by_id(exploration_id)

    if state.name == new_state_name:
        return

    if exploration._has_state_named(new_state_name):
        raise Exception('Duplicate state name: %s' % new_state_name)

    state.name = new_state_name
    state.put()


def get_state_by_id(exploration_id, state_id):
    """Returns a state of this exploration, given its id."""
    exploration = get_exploration_by_id(exploration_id)

    for candidate_state_id in exploration.state_ids:
        if candidate_state_id == state_id:
            return State.get(state_id)

    raise Exception('State with id %s not found in exploration %s.' %
                    (state_id, exploration_id))


def modify_using_dict(exploration_id, state_id, sdict):
    """Modifies the properties of a state using values from a dict."""
    exploration = get_exploration_by_id(exploration_id)
    state = get_state_by_id(exploration_id, state_id)

    state.content = [
        Content(type=item['type'], value=item['value'])
        for item in sdict['content']
    ]

    state.param_changes = []
    for pc in sdict['param_changes']:
        instance = get_or_create_param(
            exploration_id, pc['name'], obj_type=pc['obj_type'])
        instance.values = pc['values']
        state.param_changes.append(instance)

    wdict = sdict['widget']
    state.widget = WidgetInstance(
        widget_id=wdict['widget_id'], sticky=wdict['sticky'],
        params=wdict['params'], handlers=[])

    # Augment the list of parameters in state.widget with the default widget
    # params.
    for wp in InteractiveWidget.get(wdict['widget_id']).params:
        if wp.name not in wdict['params']:
            state.widget.params[wp.name] = wp.value

    for handler in wdict['handlers']:
        handler_rules = [Rule(
            name=rule['name'],
            inputs=rule['inputs'],
            dest=State._get_id_from_name(rule['dest'], exploration),
            feedback=rule['feedback']
        ) for rule in handler['rules']]

        state.widget.handlers.append(AnswerHandlerInstance(
            name=handler['name'], rules=handler_rules))

    state.put()
    return state


# Creation and deletion methods.
def create_new(
    user, title, category, exploration_id=None,
        init_state_name=feconf.DEFAULT_STATE_NAME, image_id=None):
    """Creates and returns a new exploration."""
    # Generate a new exploration id, if one wasn't passed in.
    exploration_id = exploration_id or Exploration.get_new_id(title)

    state_id = State.get_new_id(init_state_name)
    new_state = State(id=state_id, name=init_state_name)
    new_state.put()

    # Note that demo explorations do not have owners, so user may be None.
    exploration = Exploration(
        id=exploration_id, title=title, category=category,
        image_id=image_id, state_ids=[state_id],
        editors=[user] if user else [])

    exploration.put()
    return exploration


def create_from_yaml(
    yaml_file, user, title, category, exploration_id=None,
        image_id=None):
    """Creates an exploration from a YAML file."""
    exploration_dict = utils.dict_from_yaml(yaml_file)
    init_state_name = exploration_dict['states'][0]['name']

    exploration = create_new(
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
            modify_using_dict(exploration.id, state['state'].id, state['desc'])
    except Exception:
        exploration.delete()
        raise

    return exploration


def load_demos():
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

        exploration = create_from_yaml(
            yaml_file=yaml_file, user=None, title=title, category=category,
            exploration_id=str(index), image_id=image_id)
        exploration.is_public = True
        exploration.put()


def delete_demos():
    """Deletes the demo explorations."""
    exploration_list = []
    for int_id in range(len(feconf.DEMO_EXPLORATIONS)):
        exploration = get_exploration_by_id(str(int_id), strict=False)
        if not exploration:
            # This exploration does not exist, so it cannot be deleted.
            logging.info('No exploration with id %s found.' % int_id)
        else:
            exploration_list.append(exploration)

    for exploration in exploration_list:
        exploration.delete()


# Methods for exporting states and explorations to other formats.
def export_state_internals_to_dict(
        exploration_id, state_id, human_readable_dests=False):
    """Gets a Python dict of the internals of the state."""

    state = get_state_by_id(exploration_id, state_id)

    state_dict = copy.deepcopy(state.to_dict(exclude=['unresolved_answers']))
    # Remove the computed 'classifier' property.
    for handler in state_dict['widget']['handlers']:
        del handler['classifier']

    if human_readable_dests:
        # Change the dest ids to human-readable names.
        for handler in state_dict['widget']['handlers']:
            for rule in handler['rules']:
                if rule['dest'] != feconf.END_DEST:
                    dest_state = get_state_by_id(exploration_id, rule['dest'])
                    rule['dest'] = dest_state.name
    return state_dict


def export_state_to_dict(exploration_id, state_id):
    """Gets a Python dict representation of the state."""
    state = get_state_by_id(exploration_id, state_id)

    state_dict = export_state_internals_to_dict(exploration_id, state_id)
    state_dict.update({'id': state.id, 'name': state.name,
                       'unresolved_answers': state.unresolved_answers})
    return state_dict


def export_to_yaml(exploration_id):
    """Returns a YAML version of the exploration."""
    # TODO(sll): Cache the return value?

    exploration = get_exploration_by_id(exploration_id)

    params = []
    for param in exploration.parameters:
        params.append({'name': param.name, 'obj_type': param.obj_type,
                       'values': param.values})

    init_states_list = []
    others_states_list = []

    for state_id in exploration.state_ids:
        state_internals = export_state_internals_to_dict(
            exploration.id, state_id, human_readable_dests=True)

        if exploration.init_state.id == state_id:
            init_states_list.append(state_internals)
        else:
            others_states_list.append(state_internals)

    full_state_list = init_states_list + others_states_list
    result_dict = {'parameters': params, 'states': full_state_list}
    return utils.yaml_from_dict(result_dict)
