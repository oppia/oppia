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

    yaml_file = self.request.get('yaml_file')
    if not yaml_file:
      raise self.InvalidInputException('No data received.')
    description = self.Import(yaml_file)

    # Delete the old actions.
    for action_key in state.action_sets:
      action_key.delete()
    state.action_sets = []

    input_view_name = description['input_type']['name']
    input_view = models.InputView.gql(
        'WHERE name = :name', name=input_view_name).get()
    # TODO(sll): Deal with input_view.widget here (and handle its verification above).
    dests_array = []

    content = []
    for dic in description['content']:
      content_item = {}
      for key, val in dic.iteritems():
        content_item['type'] = key
        content_item['value'] = val
        content.append(content_item)

    # Retrieve the actions corresponding to this state.
    category_list = classifiers.GetCategoryList(
        state.input_view.get().classifier, state.classifier_categories)

    action_set_list = []
    for index in range(len(description['answers'])):
      dests_array_item = {}
      for key, val in description['answers'][index].iteritems():
        dest_name = val['dest']
        dest_key = None
        if dest_name != 'END':
          # Use the state with this destination name, if it exists.
          dest_state = models.State.query(ancestor=exploration.key).filter(
              models.State.name == dest_name).get()
          if dest_state:
            dest_key = dest_state.key
          else:
            dest_state = utils.CreateNewState(exploration, dest_name)
            dest_key = dest_state.key

        dests_array_item['category'] = category_list[index]
        dests_array_item['text'] = val['text']
        dests_array_item['dest'] = dest_state.hash_id if dest_key else '-1'
        dests_array.append(dests_array_item)

        action_set = models.ActionSet(
            category_index=index, text=val['text'], dest=dest_key)
        action_set.put()
        action_set_list.append(action_set.key)

    state.input_view = input_view.key
    state.text = content
    state.action_sets = action_set_list
    state.put()

    self.response.out.write(json.dumps({
        'classifier': input_view.classifier,
        'explorationId': exploration_id,
        'inputType': input_view.name,
        'state': {'desc': state.name, 'dests': dests_array},
        'stateText': content,
    }))


class ExportHandler(editor.BaseHandler):
  """Exports a state to YAML."""
  # TODO(sll): consider storing this YAML representation, when it is computed,
  # so that it does not have to be done on the fly.

  def get(self, exploration_id, state_id):  # pylint: disable-msg=C6409
    """Handles GET requests."""
    user, exploration = self.GetUserAndExploration(exploration_id)

    state = utils.GetEntity(models.State, state_id)

    # TODO(sll): This code is similar to the code in StatePage.post(). Refactor
    # to unify them.
    values = {
        'actions': [],
        'classifier': state.input_view.get().classifier,
        'inputType': state.input_view.get().name,
        'stateId': state.hash_id,
        'stateName': state.name,
        'stateText': state.text,
    }

    # Retrieve the actions corresponding to this state.
    category_list = classifiers.GetCategoryList(
        state.input_view.get().classifier, state.classifier_categories)
    for i in range(len(category_list)):
      try:
        action_set = state.action_sets[i].get()
      except IndexError:
        action_set = models.ActionSet(category_index=i)
        action_set.put()
        state.action_sets.append(action_set.key)
      # The default destination is the same state.
      action = {'category': category_list[i], 'dest': state.hash_id}
      if action_set.text:
        action['text'] = action_set.text
      if action_set.dest_exploration:
        action['dest'] = 'q-%s' % action_set.dest_exploration.get().hash_id
      elif action_set.dest:
        action['dest'] = action_set.dest.get().hash_id
      values['actions'].append(action)

    self.response.out.write(yaml.safe_dump({
        'content': [{text['type']: text['value']} for text in state.text],
        'input_type': {'name': state.input_view.get().name},
        'answers': [
            {category_list[i] if category_list[i] != 'All other inputs' else 'default':
                {'text': state.action_sets[i].get().text,
                 'dest': (state.action_sets[i].get().dest.get().name
                          if state.action_sets[i].get().dest else 'END')}
            }
            for i in range(len(state.action_sets))],
    }, default_flow_style=False))
