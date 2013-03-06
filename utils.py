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

"""Common utility functions."""

__author__ = 'sll@google.com (Sean Lip)'

import base64
import hashlib
import json
import logging
import os

import feconf
from models.models import AugmentedUser, Widget
from models.exploration import Exploration
from models.state import State

from jinja2 import Environment, meta
from google.appengine.ext import ndb


END_DEST = 'END'


class InvalidInputException(Exception):
    """Error class for invalid input."""
    pass


class EntityIdNotFoundError(Exception):
    """Error class for when an entity ID is not in the datastore."""
    pass


def create_enum(*sequential, **names):
    enums = dict(zip(sequential, sequential), **names)
    return type('Enum', (), enums)


def log(message):
    """Logs info messages in development/debug mode.

    Args:
        message: the message to be logged.
    """
    if feconf.DEV or feconf.DEBUG:
        if isinstance(message, dict):
            logging.info(json.dumps(message, sort_keys=True, indent=4))
        else:
            logging.info(str(message))


# TODO(sll): Consider refactoring this to include ancestors.
def get_entity(entity, entity_id):
    """Gets the entity corresponding to a given id.

    Args:
        entity: the name of the entity's class.
        entity_id: string representing the entity id.

    Returns:
        the entity corresponding to the input id

    Raises:
        EntityIdNotFoundError: If the entity_id is None, or cannot be found.
    """
    entity_type = entity.__name__.lower()
    if not entity_id:
        raise EntityIdNotFoundError('No %s id supplied' % entity_type)
    entity = entity.query().filter(entity.hash_id == entity_id).get()
    if not entity:
        raise EntityIdNotFoundError(
            '%s id %s not found' % (entity_type, entity_id))
    return entity


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
        raise EntityIdNotFoundError('No %s name supplied', entity_type)
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


def get_state_by_name(name, exploration):
    """Gets the state with this name in this exploration.

    Args:
        name: string representing the entity name.
        exploration: the exploration to which this state belongs

    Returns:
        the state, if it exists; None otherwise.
    """
    if not name:
        raise EntityIdNotFoundError('No state name supplied')
    if exploration:
        state = State.query(ancestor=exploration.key).filter(
            State.name == name).get()
    else:
        raise KeyError('Queries for state entities must include ancestors.')
    return state


def check_authorship(user, exploration):
    """Checks whether the current user has rights to edit this exploration."""
    return exploration.key in get_augmented_user(user).editable_explorations


def get_new_id(entity, entity_name):
    """Gets a new id for an entity, based on its name.

    Args:
        entity: the name of the entity's class.
        entity_name: string representing the name of the entity

    Returns:
        string - the id representing the entity
    """
    new_id = base64.urlsafe_b64encode(hashlib.sha1(entity_name).digest())[:10]
    seed = 0
    while entity.query().filter(entity.hash_id == new_id).get():
        seed += 1
        new_id = base64.urlsafe_b64encode(
            hashlib.sha1('%s%s' % (entity_name, seed)).digest())[:10]
    return new_id


def get_file_contents(root, filepath):
    """Gets the contents of a file.

    Args:
        root: the path to prepend to the filepath.
        filepath: a path to a HTML, JS or CSS file. It should not include the
            template/dev/head or template/prod/head prefix.

    Returns:
        the file contents.
    """
    with open(os.path.join(root, filepath)) as f:
        return f.read().decode('utf-8')


def get_js_controllers(filenames):
    """Gets the concatenated contents of some JS controllers.

    Args:
        filenames: an array with names of JS files (without the '.js' suffix).

    Returns:
        the concatenated contents of these JS files.
    """
    return '\n'.join([get_file_contents(
        feconf.TEMPLATE_DIR, 'js/controllers/%s.js' % filename)
        for filename in filenames])


def parse_content_into_html(content_array, block_number, params={}):
    """Takes a content array and transforms it into HTML.

    Args:
        content_array: an array, each of whose members is a dict with two keys:
            type and value. The 'type' is one of the following:
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
    html = ''
    widget_array = []
    widget_counter = 0
    for content in content_array:
        if 'type' not in content:
            raise InvalidInputException(
                'Content type for content_array %s does not exist',
                content_array)
        if content['type'] == 'widget':
            try:
                widget = get_entity(Widget, content['value'])
                widget_counter += 1
                html += feconf.JINJA_ENV.get_template('content.html').render({
                    'type': content['type'], 'blockIndex': block_number,
                    'index': widget_counter})
                widget_array.append({
                    'blockIndex': block_number,
                    'index': widget_counter,
                    'code': widget.raw})
            except EntityIdNotFoundError:
                # Ignore empty widget content.
                pass
        elif (content['type'] in ['text', 'image', 'video']):
            if content['type'] == 'text':
                value = parse_with_jinja(content['value'], params)
            else:
                value = content['value']

            html += feconf.JINJA_ENV.get_template('content.html').render({
                'type': content['type'], 'value': value})
        else:
            raise InvalidInputException(
                'Invalid content type %s', content['type'])
    return html, widget_array


def get_augmented_user(user):
    """Gets the corresponding AugmentedUser, creating a new one if it doesn't exist."""
    augmented_user = AugmentedUser.query().filter(
        AugmentedUser.user == user).get()
    if not augmented_user:
        augmented_user = AugmentedUser(user=user)
        augmented_user.put()
    return augmented_user


def create_new_exploration(user, title='New Exploration', category='No category',
                           id=None, init_state_name='Activity 1'):
    """Creates and returns a new exploration."""
    if id:
        exploration_hash_id = id
    else:
        exploration_hash_id = get_new_id(Exploration, title)
    state_hash_id = get_new_id(State, init_state_name)

    # Create a fake state key temporarily for initialization of the question.
    # TODO(sll): Do this in a transaction so it doesn't break other things.
    fake_state_key = ndb.Key(State, state_hash_id)

    exploration = Exploration(
        hash_id=exploration_hash_id, init_state=fake_state_key,
        owner=user, category=category)
    if title:
        exploration.title = title
    exploration.put()
    new_init_state = State(
        hash_id=state_hash_id,
        parent=exploration.key,
        name=init_state_name,
        interactive_rulesets={'submit': [{
            'rule': 'Default',
            'inputs': {},
            'code': 'True',
            'dest': state_hash_id,
            'feedback': '',
            'param_changes': [],
        }]})
    new_init_state.put()

    # Replace the fake key with its real counterpart.
    exploration.init_state = new_init_state.key
    exploration.states = [new_init_state.key]
    exploration.put()
    if user:
        augmented_user = get_augmented_user(user)
        augmented_user.editable_explorations.append(exploration.key)
        augmented_user.put()
    return exploration


def create_new_state(exploration, state_name):
    """Creates and returns a new state."""
    state_hash_id = get_new_id(State, state_name)
    state = State(
        name=state_name, hash_id=state_hash_id, parent=exploration.key,
        interactive_rulesets={'submit': [{
            'rule': 'Default',
            'inputs': {},
            'code': 'True',
            'dest': state_hash_id,
            'feedback': '',
            'param_changes': [],
        }]})
    state.put()
    exploration.states.append(state.key)
    exploration.put()
    return state


def delete_exploration(exploration):
    """Deletes an exploration."""
    augmented_users = AugmentedUser.query().filter(
        AugmentedUser.editable_explorations == exploration.key)
    for augmented_user in augmented_users:
        augmented_user.editable_explorations.remove(exploration.key)
        augmented_user.put()

    exploration.delete()


def parse_with_jinja(string, params):
    """Parses a string using Jinja templating.

    Args:
    - string: the string to be parsed.
    - params: the parameters to parse the string with.

    Returns:
      the parsed string, or None if the string could not be parsed.
    """
    # Pass the code through a Jinja templating process.
    # Find the variables in 'code'.
    can_parse_as_jinja = True
    variables = meta.find_undeclared_variables(
        Environment().parse(string))
    for var in variables:
        if var not in params:
            can_parse_as_jinja = False
            break

    if can_parse_as_jinja:
        # Parse as Jinja, using the reader's parameters.
        return Environment().from_string(string).render(params)
    else:
        logging.info('Cannot parse %s using %s' % (string, params))
        return None
