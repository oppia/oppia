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
import yaml

import feconf
from models.models import AugmentedUser, Widget
from models.exploration import Exploration
from models.state import State
from google.appengine.ext import ndb


END_DEST = 'END'


class InvalidCategoryError(Exception):
    """Error class for when an invalid category is passed into a classifier."""
    pass


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


def get_js_files(filenames):
    """Gets the concatenated contents of some JS files.

    Args:
        filenames: an array with names of JS files (without the '.js' suffix).

    Returns:
        the concatenated contents of these JS files.
    """
    return '\n'.join(
            [get_file_contents(feconf.TEMPLATE_DIR, 'js/%s.js' % filename)
             for filename in filenames])


def get_js_files_with_base(filenames):
    """Gets the concatenated contents of some JS files, including the base JS.

    Args:
        filenames: an array with names of JS files (without the '.js' suffix).

    Returns:
        the concatenated contents of these JS files, with base.js prepended.
    """
    return get_js_files(['base'] + filenames)


def parse_content_into_html(content_array, block_number):
    """Takes a content array and transforms it into HTML.

    Args:
        content_array: an array, each of whose members is a dict with two keys:
            type and value. The 'type' is one of the following:
                - 'text'; then the value is a text string
                - 'image'; then the value is an image ID
                - 'video'; then the value is a video ID
                - 'widget'; then the value is a widget ID
        block_number: the number of content blocks preceding this one.

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
            html += feconf.JINJA_ENV.get_template('content.html').render({
                'type': content['type'], 'value': content['value']})
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
            'code': '',
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
            'code': '',
            'dest': state_hash_id,
            'feedback': '',
            'param_changes': [],
        }]})
    state.put()
    exploration.states.append(state.key)
    exploration.put()
    return state


def get_yaml_from_dict(dictionary):
    """Gets the YAML representation of a dict."""
    return yaml.safe_dump(dictionary, default_flow_style=False)


def get_dict_from_yaml(yaml_file):
    """Gets the dict representation of a YAML file."""
    try:
        yaml_dict = yaml.safe_load(yaml_file)
        assert isinstance(yaml_dict, dict)
        return yaml_dict
    except yaml.YAMLError as e:
        raise InvalidInputException(e)


def verify_state(description):
    """Verifies a state representation without referencing other states.

    This enforces the following constraints:
    - The only permitted fields are ['content', 'widget'].
        - 'content' is optional and defaults to [].
        - 'widget' must be present.
    - Each item in the 'content' array must have the keys ['type', 'value'].
        - The type must be one of ['text', 'image', 'video', 'widget'].
    - Permitted subfields of 'widget' are ['id', 'params', 'rules'].
        - The field 'id' is mandatory, and must correspond to an actual widget
            in the feconf.SAMPLE_WIDGETS_DIR directory.
    - Each ruleset in ['widget']['rules'] must have a non-empty array value, and
        each value should contain at least the fields ['code', 'dest'].
        - For all values except the last one, the 'code' field should correspond
            to a valid rule for the widget's classifier. [NOT IMPLEMENTED YET]
        - For the last value in each ruleset, the 'code' field should equal
            'True'.
    """
    # Check the main keys.
    for key in description:
        if key not in ['content', 'widget']:
            return False, 'Invalid key: %s' % key

    if 'content' not in description:
        description['content'] = []
    if 'widget' not in description:
        return False, 'Missing key: \'widget\''

    # Validate 'content'.
    for item in description['content']:
        if len(item) != 2:
            return False, 'Invalid content item: %s' % item
        for key in item:
            if key not in ['type', 'value']:
                return False, 'Invalid key in content array: %s' % key
        if item['type'] not in ['text', 'image', 'video', 'widget']:
            return False, 'Invalid item type in content array: %s' % item['type']

    # Validate 'widget'.
    for key in description['widget']:
        if key not in ['id', 'params', 'rules']:
            return False, 'Invalid key in widget: %s' % key
    if 'id' not in description['widget']:
        return False, 'No widget id supplied'

    # Check that the widget_id refers to an actual widget.
    widget_id = description['widget']['id']
    try:
        with open(os.path.join(
                feconf.SAMPLE_WIDGETS_DIR, widget_id, '%s.config.yaml' % widget_id)):
            pass
    except IOError:
        return False, 'No widget with widget id %s exists.' % widget_id

    # Check each of the rulesets.
    if 'rules' in description['widget']:
        rulesets = description['widget']['rules']
        for ruleset_name in rulesets:
            rules = rulesets[ruleset_name]
            if not rules:
                return False, 'No rules supplied for ruleset %s' % ruleset_name

            for ind, rule in enumerate(rules):
                if 'code' not in rule:
                    return False, 'Rule %s is missing a \'code\' field.' % ind
                if 'dest' not in rule:
                    return False, 'Rule %s is missing a destination.' % ind

                if ind == len(rules) - 1:
                    rule['code'] = str(rule['code'])
                    if rule['code'] != 'True':
                        return False, 'The \'code\' field of the last rule should be \'True\''
                else:
                    # TODO(sll): Check that the rule corresponds to a valid one
                    # from the relevant classifier.
                    pass

    return True, ''


def modify_state_using_dict(exploration, state, state_dict):
    """Modifies the properties of a state using values from a dictionary.

    Returns:
        The modified state.
    """

    is_valid, error_log = verify_state(state_dict)
    if not is_valid:
        raise InvalidInputException(error_log)

    state.content = state_dict['content']
    state.interactive_widget = state_dict['widget']['id']
    if 'params' in state_dict['widget']:
        state.interactive_params = state_dict['widget']['params']

    rulesets_dict = {'submit': []}

    for rule in state_dict['widget']['rules']['submit']:
        rule_dict = {'code': rule['code']}
        if 'feedback' in rule:
            rule_dict['feedback'] = rule['feedback']
        else:
            rule_dict['feedback'] = None
        if rule['dest'] == END_DEST:
            rule_dict['dest'] = END_DEST
        else:
            dest_state = get_state_by_name(rule['dest'], exploration)
            if dest_state:
                rule_dict['dest'] = dest_state.hash_id
            else:
                raise Exception('Invalid dest: %s' % rule['dest'])
        # TODO(sll): Extract 'inputs' and 'rule' from the code.
        # TODO(yanamal): Add param_changes here.

        rulesets_dict['submit'].append(rule_dict)

    state.interactive_rulesets = rulesets_dict

    state.put()
    return state


def create_exploration_from_yaml(yaml, user, title, category, id=None):
    """Creates an exploration from a YAML file."""

    yaml = yaml.strip()
    # TODO(sll): Make this more flexible by allowing spaces between ':' and '\n'.
    init_state_name = yaml[:yaml.find(':\n')]
    logging.info(init_state_name)
    if not init_state_name:
        raise InvalidInputException(
            'Invalid YAML file: the initial state name cannot be identified')

    exploration = create_new_exploration(
        user, title=title, category=category, init_state_name=init_state_name,
        id=id)
    yaml_description = get_dict_from_yaml(yaml)

    # Create all the states first.
    for state_name, unused_state_description in yaml_description.iteritems():
        if state_name == init_state_name:
            continue
        else:
            if check_existence_of_name(State, state_name, exploration):
                raise InvalidInputException(
                    'Invalid YAML file: contains duplicate state names %s' %
                    state_name)
            state = create_new_state(exploration, state_name)

    for state_name, state_description in yaml_description.iteritems():
        state = get_state_by_name(state_name, exploration)
        modify_state_using_dict(exploration, state, state_description)

    return exploration
