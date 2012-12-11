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

import base64, datetime, hashlib, json, logging, os
import base, feconf, models
from google.appengine.api import users
from google.appengine.ext import ndb

DEFAULT_CATEGORY = 'All other inputs'


def Enum(*sequential, **names):
  enums = dict(zip(sequential, sequential), **names)
  return type('Enum', (), enums)


input_views = Enum('none', 'multiple_choice', 'int', 'set', 'text', 'finished')


class InvalidInputError(Exception):
  """Error class for when invalid input is entered into a classifier."""
  pass


class InvalidCategoryError(Exception):
  """Error class for when an invalid category is passed into a classifier."""
  pass


class InvalidParamError(Exception):
  """Error class for when an invalid parameter is passed into a classifier."""
  pass


class EntityIdNotFoundError(Exception):
  """Error class for when a story/question/state ID is not in the datastore."""
  pass


class InvalidStoryError(Exception):
  """Error class for when a story is not yet ready for viewing."""
  pass


def Log(message):
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
def GetEntity(entity, entity_id):
  """Gets the story, question or state corresponding to a given id.

  Args:
    entity: one of models.Exploration or models.State
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
    raise EntityIdNotFoundError('%s id %s not found' % (entity_type, entity_id))
  return entity


def CheckExistenceOfName(entity, name, ancestor=None):
  """Checks whether an entity with the given name and ancestor already exists.

  Args:
    entity: one of models.Exploration or models.State
    name: string representing the entity name.
    ancestor: the ancestor entity, if applicable.

  Returns:
    True if such an entity exists with the same name and ancestor, else False.

  Raises:
    EntityIdNotFoundError: If no entity name is supplied.
    KeyError: If a non-story entity is queried and no ancestor is supplied.
  """
  entity_type = entity.__name__.lower()
  if not name:
    raise EntityIdNotFoundError('No %s name supplied', entity_type)
  if ancestor:
    entity = entity.query(ancestor=ancestor.key).filter(
        entity.name == name).get()
  else:
    if entity == models.State:
      raise KeyError('Queries for state entities should include ancestors.')
    else:
      entity = entity.query().filter(entity.name == name).get()
  if not entity:
    return False
  return True


def CheckAuthorship(exploration):
  """Checks whether the current user has rights to edit this exploration.

  Args:
    exploration: an exploration.

  Raises:
    EntityIdNotFoundError: if the current user does not have editing rights to
        the given exploration.
  """
  user = users.get_current_user()
  if user not in exploration.editors:
    raise EntityIdNotFoundError('%s is not an editor of this story.' % user)


def GetNewId(entity, entity_name):
  """Gets a new id for an entity, based on its name.

  Args:
    entity: one of models.Exploration or models.State
    entity_name: string representing the name of the story, question or state

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


def GetFileContents(filepath):
  """Gets the contents of a file in the template directories.

  Args:
    filepath: a path to a HTML, JS or CSS file. It should not include the
        template/standard/head or template/output/standard prefix.

  Returns:
    the file contents.
  """
  file_contents = open(feconf.TEMPLATE_DIR + filepath, 'r')
  return file_contents.read().decode('utf-8')


def GetJsFile(filename):
  """Gets the contents of a JS file, including the base JS.

  Args:
    filename: the name of a JS file (without the '.js' suffix).

  Returns:
    the JS file contents.
  """
  return GetFileContents('js/base.js') + GetFileContents('js/%s.js' % filename)


def GetJsFileWithClassifiers(filename):
  """Gets the contents of a JS file, and append JS for the classifier editors.

  Args:
    filename: the name of a JS file (without the '.js' suffix).

  Returns:
    the JS file contents.
  """
  return GetJsFile(filename) + GetFileContents('js/editorClassifiers.js')


def GetCssFile(filename):
  """Gets the contents of a CSS file.

  Args:
    filename: The name of a CSS file (without the '.css' suffix).

  Returns:
    the CSS file contents.
  """
  return GetFileContents('css/%s.css' % filename)


def GetInputTemplate(template_name):
  """Gets a template for the reader's input view.

  Args:
    template_name: the name of the template.

  Returns:
    the corresponding input template.
  """
  return GetFileContents('input_views/%s.html' % template_name)


def ParseContentIntoHtml(content_array, block_number):
  """Takes a content array and transforms it into HTML.

  Args:
    content_array: an array, each of whose members is a dict with two keys: type
        and value. The 'type' is one of the following:
          - 'text'; then the value is a text string
          - 'image'; then the value is an image ID
          - 'video'; then the value is a video ID
          - 'widget'; then the value is a widget ID
    block_number: the number of content blocks preceding this one.

  Returns:
    the HTML string representing the array.

  Raises:
    InvalidInputError: if content has no 'type' attribute, or an invalid 'type'
        attribute.
  """
  html = ''
  widget_array = []
  widget_counter = 0
  for content in content_array:
    if 'type' not in content:
      raise InvalidInputError(
          'Content type for content_array %s does not exist', content_array)
    if content['type'] == 'widget':
      widget = GetEntity(models.Widget, content['value'])
      widget_counter += 1
      html += base.JINJA_ENV.get_template('content.html').render({
          'type': content['type'], 'blockIndex': block_number,
          'index': widget_counter})
      widget_array.append({'blockIndex': block_number, 'index': widget_counter,
          'code': widget.raw})
    elif (content['type'] in ['text', 'image', 'video']):
      html += base.JINJA_ENV.get_template('content.html').render({
          'type': content['type'], 'value': content['value']})
    else:
      raise InvalidInputError('Invalid content type %s', content['type'])
  return html, widget_array


def GetAugmentedUser(user):
  """Gets the corresponding AugmentedUser, creating a new one if it doesn't exist."""
  augmented_user = models.AugmentedUser.query().filter(
      models.AugmentedUser.user == user).get()
  if not augmented_user:
    augmented_user = models.AugmentedUser(user=user)
    augmented_user.put()
  return augmented_user


def CreateNewExploration(user, title, id=None):
  """Creates and returns a new exploration."""
  if id:
    exploration_hash_id = id
  else:
    exploration_hash_id = GetNewId(models.Exploration, title)
  state_hash_id = GetNewId(models.State, 'Initial state')

  # Create a fake state key temporarily for initialization of the question.
  # TODO(sll): Do this in a transaction so it doesn't break other things.
  fake_state_key = ndb.Key(models.State, state_hash_id)

  none_input_view = models.InputView.gql(
      'WHERE name = :name', name='none').get()
  none_action_set = models.ActionSet(category_index=0, dest=None)
  none_action_set.put()

  exploration = models.Exploration(
      hash_id=exploration_hash_id, init_state=fake_state_key,
      metadata={'title': title, 'owner': str(user)})
  if title:
    exploration.title = title
  exploration.put()
  new_init_state = models.State(
      hash_id=state_hash_id, input_view=none_input_view.key,
      action_sets=[none_action_set.key], parent=exploration.key)
  new_init_state.put()

  # Replace the fake key with its real counterpart.
  exploration.init_state = new_init_state.key
  exploration.states = [new_init_state.key]
  exploration.put()
  if user:
    augmented_user = GetAugmentedUser(user)
    augmented_user.editable_explorations.append(exploration.key)
    augmented_user.put()
  return exploration

