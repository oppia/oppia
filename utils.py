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

import base64, datetime, hashlib, json, logging, os, yaml
import base, feconf, models
from google.appengine.api import users
from google.appengine.ext import ndb

DEFAULT_CATEGORY = 'Default'


def Enum(*sequential, **names):
  enums = dict(zip(sequential, sequential), **names)
  return type('Enum', (), enums)


input_views = Enum('none', 'multiple_choice', 'int', 'set', 'text', 'finished')


class InvalidCategoryError(Exception):
  """Error class for when an invalid category is passed into a classifier."""
  pass


class EntityIdNotFoundError(Exception):
  """Error class for when a story/question/state ID is not in the datastore."""
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
        template/dev/head or template/prod/head prefix.

  Returns:
    the file contents.
  """
  with open(feconf.TEMPLATE_DIR + filepath) as f:
    return f.read().decode('utf-8')


def GetJsFiles(filenames):
  """Gets the concatenated contents of some JS files.

  Args:
    filenames: an array with names of JS files (without the '.js' suffix).

  Returns:
    the concatenated contents of these JS files.
  """
  return '\n'.join(
      [GetFileContents('js/%s.js' % filename) for filename in filenames])


def GetJsFilesWithBase(filenames):
  """Gets the concatenated contents of some JS files, including the base JS.

  Args:
    filenames: an array with names of JS files (without the '.js' suffix).

  Returns:
    the concatenated contents of these JS files, with base.js prepended.
  """
  return GetJsFiles(['base'] + filenames)


def GetJsFileWithClassifiers(filename):
  """Gets the contents of a JS file, and append JS for the classifier editors.

  Args:
    filename: the name of a JS file (without the '.js' suffix).

  Returns:
    the JS file contents.
  """
  return GetJsFiles(['base', filename, 'editorClassifiers'])


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
    InvalidInputException: if content has no 'type' attribute, or an invalid
        'type' attribute.
  """
  html = ''
  widget_array = []
  widget_counter = 0
  for content in content_array:
    if 'type' not in content:
      raise InvalidInputException(
          'Content type for content_array %s does not exist', content_array)
    if content['type'] == 'widget':
      try:
        widget = GetEntity(models.Widget, content['value'])
        widget_counter += 1
        html += base.JINJA_ENV.get_template('content.html').render({
            'type': content['type'], 'blockIndex': block_number,
            'index': widget_counter})
        widget_array.append({'blockIndex': block_number, 'index': widget_counter,
            'code': widget.raw})
      except EntityIdNotFoundError:
        # Ignore empty widget content.
        pass
    elif (content['type'] in ['text', 'image', 'video']):
      html += base.JINJA_ENV.get_template('content.html').render({
          'type': content['type'], 'value': content['value']})
    else:
      raise InvalidInputException('Invalid content type %s', content['type'])
  return html, widget_array


def GetAugmentedUser(user):
  """Gets the corresponding AugmentedUser, creating a new one if it doesn't exist."""
  augmented_user = models.AugmentedUser.query().filter(
      models.AugmentedUser.user == user).get()
  if not augmented_user:
    augmented_user = models.AugmentedUser(user=user)
    augmented_user.put()
  return augmented_user


def CreateNewExploration(user, title='New Exploration', category='No category',
    id=None, init_state_name='Activity 1'):
  """Creates and returns a new exploration."""
  if id:
    exploration_hash_id = id
  else:
    exploration_hash_id = GetNewId(models.Exploration, title)
  state_hash_id = GetNewId(models.State, init_state_name)

  # Create a fake state key temporarily for initialization of the question.
  # TODO(sll): Do this in a transaction so it doesn't break other things.
  fake_state_key = ndb.Key(models.State, state_hash_id)

  none_input_view = models.InputView.gql(
      'WHERE name = :name', name='none').get()
  none_action_set = models.ActionSet(category_index=0, dest=None)
  none_action_set.put()

  exploration = models.Exploration(
      hash_id=exploration_hash_id, init_state=fake_state_key,
      owner=user, category=category)
  if title:
    exploration.title = title
  exploration.put()
  new_init_state = models.State(
      hash_id=state_hash_id, input_view=none_input_view.key,
      action_sets=[none_action_set.key], parent=exploration.key,
      classifier_categories=[DEFAULT_CATEGORY],
      name=init_state_name)
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


def CreateNewState(exploration, state_name):
  """Creates and returns a new state."""
  state_hash_id = GetNewId(models.State, state_name)
  none_input_view = models.InputView.gql(
      'WHERE name = :name', name='none').get()
  none_action_set = models.ActionSet(category_index=0)
  none_action_set.put()
  state = models.State(
      name=state_name, hash_id=state_hash_id, input_view=none_input_view.key,
      action_sets=[none_action_set.key], parent=exploration.key,
      classifier_categories=[DEFAULT_CATEGORY])
  state.put()
  none_action_set.dest = state.key
  none_action_set.put()
  exploration.states.append(state.key)
  exploration.put()
  return state


def GetYamlFromDict(dictionary):
  """Gets the YAML representation of a dict."""
  return yaml.safe_dump(dictionary, default_flow_style=False)


def GetDictFromYaml(yaml_file):
  """Gets the dict representation of a YAML file."""
  try:
    return yaml.safe_load(yaml_file)
  except yaml.YAMLError as e:
    raise InvalidInputException(e)


def VerifyState(description):
  """Verifies a state representation.

  This enforces the following constraints:
  - The only accepted fields are ['answers', 'content', 'input_type'].
  - Permitted subfields of 'content' are ['text', 'image', 'video', 'widget'].
  - Permitted subfields of 'input_type' are ['name', 'widget'].
  - Each item in 'answers' must have exactly one key, and the corresponding
    value must also have a 'dest'. The 'text' field is optional and defaults to ''.
  - Each item in 'answers' should have a unique key.
  - 'content' is optional and defaults to [].
  - input_type.name is optional and defaults to 'none'. If it exists, it must be
    one of ['none', 'multiple_choice', 'int', 'set', 'text'].
    - If input_type.name == 'none' and there is more than one answer category, an
      error is thrown. The name of the answer category can be anything; it is
      ignored.
  - input_type.widget is optional and defaults to the default for the given
        input type.
  - If input_type != 'multiple_choice' then answers.default.dest must exist, and
    be the last one in the list.
  - If input_type == 'multiple_choice' then 'answers' must not be non-empty.
  """
  logging.info(description)
  if 'answers' not in description or len(description['answers']) == 0:
    return False, 'No answer choices supplied'

  if 'content' not in description:
    description['content'] = []
  if 'input_type' not in description:
    description['input_type'] = {'name': 'none'}

  if 'name' not in description['input_type']:
    return False, 'input_type should have a \'name\' attribute'

  for key in description:
    if key not in ['answers', 'content', 'input_type']:
      return False, 'Invalid key: %s' % key

  for item in description['content']:
    if len(item) != 2:
      return False, 'Invalid content item: %s' % item
    for key in item:
      if key not in ['type', 'value']:
        return False, 'Invalid key in content array: %s' % key

  for key in description['input_type']:
    if key not in ['name', 'widget']:
      return False, 'Invalid key in input_type: %s' % key

  if (description['input_type']['name'] not in
      ['none', 'multiple_choice', 'int', 'set', 'text']):
    return False, 'Invalid key in input_type.name: %s' % description['input_type']['name']

  for item in description['answers']:
    if len(item) != 1:
      return False, 'Invalid answer item: %s' % item
    key = item.keys()[0]
    val = item.values()[0]
    if 'dest' not in val or not val['dest']:
      return False, 'Each answer should contain a \'dest\' attribute'
    if 'text' not in val:
      item[key]['text'] = ''

  # Check uniqueness of keys in 'answers'
  answer_keys = sorted([item.keys()[0] for item in description['answers']])
  for i in range(len(answer_keys) - 1):
    if answer_keys[i] == answer_keys[i+1]:
      return False, 'Answer key %s appears more than once' % answer_keys[i]

  if description['input_type']['name'] == 'none' and len(description['answers']) > 1:
    return False, 'Expected only a single \'answer\' for a state with no input'

  if description['input_type']['name'] != 'multiple_choice':
    if description['answers'][-1].keys() != ['Default']:
      return False, 'The last category of the answers array should be \'Default\''

  return True, ''


def ModifyStateUsingDict(exploration, state, state_dict):
  """Modifies the properties of a state using values from a dictionary."""

  is_valid, error_log = VerifyState(state_dict)
  if not is_valid:
    raise self.InvalidInputException(error_log)

  # Delete the old actions.
  for action_key in state.action_sets:
    action_key.delete()
  state.action_sets = []

  input_view_name = state_dict['input_type']['name']
  input_view = models.InputView.gql(
      'WHERE name = :name', name=input_view_name).get()
  # TODO(sll): Deal with input_view.widget here (and handle its verification above).
  dests_array = []

  content = state_dict['content']

  category_list = []
  action_set_list = []
  for index in range(len(state_dict['answers'])):
    dests_array_item = {}
    for key, val in state_dict['answers'][index].iteritems():
      dest_name = val['dest']
      dest_key = None
      if dest_name != 'END':
        # Use the state with this destination name, if it exists.
        dest_state = models.State.query(ancestor=exploration.key).filter(
            models.State.name == dest_name).get()
        if dest_state:
          dest_key = dest_state.key
        else:
          dest_state = CreateNewState(exploration, dest_name)
          dest_key = dest_state.key

      category_list.append(key)
      dests_array_item['category'] = category_list[index]
      dests_array_item['text'] = val['text']
      dests_array_item['dest'] = dest_state.hash_id if dest_key else '-1'
      dests_array.append(dests_array_item)
      action_set = models.ActionSet(
          category_index=index, text=val['text'], dest=dest_key)
      action_set.put()
      action_set_list.append(action_set.key)

  state.input_view = input_view.key
  state.content = content
  state.classifier_categories = category_list
  state.action_sets = action_set_list
  state.put()


def CreateExplorationFromYaml(yaml, user, title, category, id):
  """Creates an exploration from a YAML file."""

  yaml = yaml.strip()
  # TODO(sll): Make this more flexible by allowing spaces between ':' and '\n'.
  init_state_name = yaml[0 : yaml.find(':\n')]
  logging.info(init_state_name)
  if not init_state_name:
    raise self.InvalidInputException(
        'Invalid YAML file: the initial state name cannot be identified')

  exploration = CreateNewExploration(
      user, title=title, category=category, init_state_name=init_state_name, id=id)
  yaml_description = GetDictFromYaml(yaml)

  # Create all the states first.
  for state_name, unused_state_description in yaml_description.iteritems():
    if state_name == init_state_name:
      continue
    else:
      if CheckExistenceOfName(models.State, state_name, exploration):
        raise self.InvalidInputException(
            'Invalid YAML file: contains duplicate state names %s' % state_name)
      state = CreateNewState(exploration, state_name)

  for state_name, state_description in yaml_description.iteritems():
    logging.info(state_name)
    state = models.State.query(ancestor=exploration.key).filter(
        models.State.name == state_name).get()
    ModifyStateUsingDict(exploration, state, state_description)

  return exploration
