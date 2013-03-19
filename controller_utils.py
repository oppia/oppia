# Copyright 2012 Google Inc. All Rights Reserved.
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

"""This file contains utility functions that can be used by controllers."""

__author__ = 'sll@google.com (Sean Lip)'

import os

import feconf
from models.augmented_user import AugmentedUser
from models.exploration import Exploration
from models.widget import InteractiveWidget
from models.widget import NonInteractiveWidget
from models.state import State
import utils

from google.appengine.ext import ndb


def parse_content_into_html(content_array, block_number, params=None):
    """Takes a Content array and transforms it into HTML.

    Args:
        content_array: an array, each of whose members is of type Content. This
            object has two keys: type and value. The 'type' is one of the
            following:
                - 'text'; then the value is a text string
                - 'image'; then the value is an image ID
                - 'video'; then the value is a video ID
                - 'widget'; then the value is a widget ID
        block_number: the number of content blocks preceding this one.
        params: any parameters used for templatizing text strings.

    Returns:
        the HTML string representing the array.

    Raises:
        InvalidInputException: if content has no 'type' attribute, or an invalid
            'type' attribute.
    """
    if params is None:
        params = {}

    html = ''
    widget_array = []
    widget_counter = 0
    for content in content_array:
        if content.type == 'widget':
            try:
                widget = NonInteractiveWidget.get_with_params(
                    content.value, params)
                widget_counter += 1
                html += feconf.JINJA_ENV.get_template('content.html').render({
                    'type': content.type, 'blockIndex': block_number,
                    'index': widget_counter})
                widget_array.append({
                    'blockIndex': block_number,
                    'index': widget_counter,
                    'code': widget.raw})
            except utils.EntityIdNotFoundError:
                # Ignore empty widget content.
                pass
        elif (content.type in ['text', 'image', 'video']):
            if content.type == 'text':
                value = utils.parse_with_jinja(content.value, params)
            else:
                value = content.value

            html += feconf.JINJA_ENV.get_template('content.html').render({
                'type': content.type, 'value': value})
        else:
            raise utils.InvalidInputException(
                'Invalid content type %s', content.type)
    return html, widget_array


def create_new_exploration(
        user, title, category, exploration_id=None, init_state_name='Activity 1'):
    """Creates and returns a new exploration."""
    exploration = Exploration.create(
        user, title, category, exploration_id, init_state_name)
    if user:
        augmented_user = AugmentedUser.get(user)
        augmented_user.editable_explorations.append(exploration.key)
        augmented_user.put()
    return exploration


def delete_exploration(exploration):
    """Deletes an exploration."""
    augmented_users = AugmentedUser.query().filter(
        AugmentedUser.editable_explorations == exploration.key)
    for augmented_user in augmented_users:
        augmented_user.editable_explorations.remove(exploration.key)
        augmented_user.put()

    exploration.delete()


def check_existence_of_name(entity, name, ancestor=None):
    """Checks whether an entity with the given name and ancestor already exists.

    Args:
        entity: the name of the entity's class.
        name: string representing the entity name.
        ancestor: the ancestor entity, if applicable.

    Returns:
        True if an entity exists with the same name and ancestor, else False.

    Raises:
        EntityIdNotFoundError: If no entity name is supplied.
        KeyError: If a state entity is queried and no ancestor is supplied.
    """
    entity_type = entity.__name__.lower()
    if not name:
        raise utils.EntityIdNotFoundError('No %s name supplied', entity_type)
    if ancestor:
        entity = entity.query(ancestor=ancestor.key).filter(
            entity.name == name).get()
    else:
        if entity == State:
            raise KeyError('Queries for state entities must include ancestors.')
        else:
            entity = entity.query().filter(entity.name == name).get()
    if not entity:
        return False
    return True


def check_can_edit(user, exploration):
    """Checks whether the current user has rights to edit this exploration."""
    return (user.email() in exploration.editors or
            exploration.key in AugmentedUser.get(user).editable_explorations)


def create_exploration_from_yaml(
        yaml_file, user, title, category, exploration_id=None):
    """Creates an exploration from a YAML file."""

    yaml_file = yaml_file.strip()
    # TODO(sll): Make this more flexible by allowing spaces between ':'
    # and '\n'.
    init_state_name = yaml_file[:yaml_file.find(':\n')]
    if not init_state_name:
        raise utils.InvalidInputException(
            'Invalid YAML file: the initial state name cannot '
            'be identified')

    exploration = create_new_exploration(
        user, title, category, exploration_id=exploration_id,
        init_state_name=init_state_name)

    try:
        yaml_description = utils.get_dict_from_yaml(yaml_file)

        # Create all the states first.
        for state_name, unused_state_desc in yaml_description.iteritems():
            if state_name == init_state_name:
                continue
            else:
                if check_existence_of_name(State, state_name, exploration):
                    raise utils.InvalidInputException(
                        'Invalid YAML file: contains duplicate state '
                        'names %s' % state_name)
                state = exploration.add_state(state_name)

        for state_name, state_description in yaml_description.iteritems():
            state = State.get_by_name(state_name, exploration)
            State.modify_using_dict(exploration, state, state_description)
    except Exception:
        delete_exploration(exploration)
        raise

    return exploration


def load_default_explorations():
    """Initializes the demo explorations."""

    for index, exploration in enumerate(feconf.DEMO_EXPLORATIONS):
        assert len(exploration) == 3

        filename = '%s.yaml' % exploration[0]
        title = exploration[1]
        category = exploration[2]

        with open(
                os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR, filename)) as f:
            yaml_file = f.read().decode('utf-8')

        exploration = create_exploration_from_yaml(
            yaml_file=yaml_file, user=None, title=title, category=category,
            exploration_id=str(index))
        exploration.is_public = True
        exploration.put()


def ensure_default_data_is_loaded():
    """Ensures that the default explorations and widgets exist."""
    # TODO(sll): This is fragile. Should we do it only if we fail to get
    # the exploration?

    if not InteractiveWidget.get('Continue'):
        InteractiveWidget.load_default_widgets()
        NonInteractiveWidget.load_default_widgets()

    if not Exploration.get('0'):
        load_default_explorations()
