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

def Import(yaml_file):
    """Converts a YAML file to an exploration and saves it in the datastore."""
    # TODO(sll): Enforce the following constraints.
    # - There must be at least one state.
    # - Each state_name must exist and be unique. No state may be named 'END'.
    # - Content is optional, treated as [] if non-existent.
    # - input_type.widget is optional, treated as default for given input type
    #   if non-existent
    # - input_type.name is optional, the default is exact match. If present, it
    #   must be one of some enum, otherwise it goes to the default.
    # - answers.default.dest must exist, and be valid.
    # - All dest states must be valid.
    #
    # NB: the first state in the list is the initial state.

    exploration = yaml.safe_load(yaml_file)

    logging.info(exploration)
    return exploration


class ImportPage(editor.BaseHandler):
  """Imports a YAML file and creates an exploration."""

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

    yaml_file = self.request.get('yaml_file')
    if not yaml_file:
      self.JsonError('No exploration data received.')
      return

    description = Import(yaml_file)

    # Delete all states belonging to this exploration first.
    for state in exploration.states:
      state.delete()
    exploration.states = []

    init_state_found = False

    for state_name in description:
      state_hash_id = utils.GetNewId(models.State, state_name)
      input_view_name = 'none'
      if ('input_type' in description[state_name] and
          'name' in description[state_name]['input_type']):
        input_view_name = description[state_name]['input_type']['name']
      input_view = models.InputView.gql(
          'WHERE name = :name', name=input_view_name).get()

      content = []
      for dic in description[state_name]['content']:
        content_item = {}
        for key, val in dic.iteritems():
          content_item['type'] = key
          content_item['value'] = val
          content.append(content_item)

      action_set_list = []
      for index in range(len(description[state_name]['answers'])):
        for key, val in description[state_name]['answers'][index].iteritems():
          # TODO(sll): add destination information here (remember that it could
          # be 'END').
          action_set = models.ActionSet(category_index=index, text=val['text'])
          action_set.put()
          action_set_list.append(action_set.key)

      state = models.State(
          name=state_name, hash_id=state_hash_id, text=content,
          input_view=input_view.key, action_sets=action_set_list,
          parent=exploration.key)
      state.put()

      action_set.dest = state.key
      action_set.put()
      exploration.states.append(state.key)

      # TODO(sll): ensure that this actually finds the correct initial state.
      if not init_state_found:
        init_state_found = True
        exploration.init_state = state.key

    exploration.put()

    self.response.out.write(json.dumps({
        'explorationId': exploration_id,
    }))
