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
the database. In particular, the get_by_id(), query(), put() and delete()
methods should delegate to the Exploration model class. This will enable the
exploration storage model to be changed without affecting this class and others
above it.
"""

__author__ = 'Sean Lip'

import logging
import os

from apps.exploration.models import Exploration
from apps.image.models import Image
from apps.parameter.models import Parameter
from apps.state.models import State

import feconf
import utils


# Query methods.
def get_by_id(exploration_id, strict=True):
    """Gets an exploration by id. Fails noisily if strict == True."""
    return Exploration.get(exploration_id, strict=strict)


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


# Direct creation and deletion methods.
def create_new(
    user, title, category, exploration_id=None,
        init_state_name=feconf.DEFAULT_STATE_NAME, image_id=None):
    """Creates and returns a new exploration."""
    # Generate a new exploration id, if one wasn't passed in.
    exploration_id = exploration_id or Exploration.get_new_id(title)

    # Note that demo explorations do not have owners, so user may be None.
    exploration = Exploration(
        id=exploration_id, title=title, category=category,
        image_id=image_id, states=[],
        editors=[user] if user else [])
    exploration.add_state(init_state_name)
    exploration.put()
    return exploration


def delete(exploration_id):
    """Deletes the exploration corresponding to the given exploration_id."""
    exploration = get_by_id(exploration_id)
    for state_key in exploration.states:
        state_key.delete()
    exploration.key.delete()


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
            State.modify_using_dict(
                exploration, state['state'], state['desc'])
    except Exception:
        delete(exploration.id)
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
        exploration = get_by_id(str(int_id), strict=False)
        if not exploration:
            # This exploration does not exist, so it cannot be deleted.
            logging.info('No exploration with id %s found.' % int_id)
        else:
            exploration_list.append(exploration)

    for exploration in exploration_list:
        delete(exploration.id)
