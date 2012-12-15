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

"""Converter between YAML and datastore representations of an exploration."""

__author__ = 'sll@google.com (Sean Lip)'

import datetime, json, logging, os, yaml
import base, classifiers, editor, feconf, main, models, reader, utils

from google.appengine.api import users
from google.appengine.ext import ndb

EDITOR_MODE = 'editor'


def ValidateState(description):
  """Validates a state representation.

  This enforces the following constraints:
  - The only accepted fields are ['answers', 'content', 'input_type'].
  - Permitted subfields of 'content' are ['text', 'image', 'video', 'widget'].
  - Permitted subfields of 'input_type' are ['name', 'widget'].
  - Each item in 'answers' must have exactly one key.
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
    if len(item) != 1:
      return False, 'Invalid content item: %s' % item
    for key in item:
      if key not in ['text', 'image', 'video', 'widget']:
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

  if description['input_type']['name'] == 'none' and len(description['answers']) > 1:
    return False, 'Expected only a single answer for a state with no input'

  if description['input_type']['name'] != 'multiple_choice':
    if description['answers'][-1].keys() != ['default']:
      return False, 'The last category of the answers array should be \'default\''

  return True, ''


class ImportPage(editor.BaseHandler):
  """Imports a YAML file and creates a state from it."""

  def Import(self, yaml_file):
      """Converts a YAML file into a state description."""
      try:
        description = yaml.safe_load(yaml_file)
      except yaml.YAMLError as e:
        raise self.InvalidInputException(e)

      is_valid, error_log = ValidateState(description)
      if is_valid:
        return description
      else:
        raise self.InvalidInputException(error_log)

  def get(self, exploration_id):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user, exploration = self.GetUserAndExploration(exploration_id)

    self.values.update({
        'js': utils.GetJsFileWithClassifiers('editorConverter'),
        'mode': EDITOR_MODE,
    })
    self.response.out.write(
        base.JINJA_ENV.get_template('editor/editor_converter.html').render(self.values))

  def put(self, exploration_id):  # pylint: disable-msg=C6409
    """Creates an exploration from a YAML file.

    Args:
      exploration_id: string representing the exploration id.
    """
    user, exploration = self.GetUserAndExploration(exploration_id)
    state_id = self.request.get('state_id')
    if not state_id:
      raise self.InvalidInputException('No state id received.')
    state = utils.GetEntity(models.State, state_id)

    state_name = self.request.get('state_name')
    yaml_file = self.request.get('yaml_file')
    if not state_name and not yaml_file:
      raise self.InvalidInputException('No data received.')
    if state_name and yaml_file:
      raise self.InvalidInputException(
          'Only one of the state name and the state description can be edited'
          'at a time')

    if state_name:
      # Replace the state name with this one, after checking validity.
      if state_name == 'END':
        raise self.InvalidInputException('Invalid state name: END')
      # Check that no other state has this name.
      if (state_name != state.name and utils.CheckExistenceOfName(
              models.State, state_name, exploration)):
          raise self.InvalidInputException(
              'Duplicate state name: %s', state_name)
      state.name = state_name
      state.put()
      return

    # Otherwise, a YAML file has been passed in.
    description = self.Import(yaml_file)

    input_view_name = description['input_type']['name']
    input_view = models.InputView.gql(
        'WHERE name = :name', name=input_view_name).get()
    # TODO(sll): Deal with input_view.widget here (and handle its verification above).

    content = []
    for dic in description['content']:
      content_item = {}
      for key, val in dic.iteritems():
        content_item['type'] = key
        content_item['value'] = val
        content.append(content_item)
    action_set_list = []
    for index in range(len(description['answers'])):
      for key, val in description['answers'][index].iteritems():
        # TODO(sll): add destination information here (remember that it could
        # be 'END').
        # TODO(sll): If a dest state does not exist, it needs to be created. States
        # are referred to by their name in 'description'.
        if 'text' not in val:
          val['text'] = ''
        action_set = models.ActionSet(category_index=index, text=val['text'])
        action_set.put()
        action_set_list.append(action_set.key)

    state.input_view = input_view.key
    state.text = content
    state.action_sets = action_set_list
    state.put()

    action_set.dest = state.key
    action_set.put()

    self.response.out.write(json.dumps({
        'explorationId': exploration_id,
    }))
