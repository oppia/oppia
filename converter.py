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


class ImportPage(editor.BaseHandler):
  """Imports a YAML file and creates a state from it."""

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
    """Creates an exploration from a YAML file."""

    user, exploration = self.GetUserAndExploration(exploration_id)

    state_id = self.request.get('state_id')
    if not state_id:
      raise self.InvalidInputException('No state id received.')
    state = utils.GetEntity(models.State, state_id)

    yaml_file = self.request.get('yaml_file')
    if not yaml_file:
      raise self.InvalidInputException('No data received.')

    utils.ModifyStateUsingDict(exploration, state, utils.GetDictFromYaml(yaml_file))

    self.response.out.write(json.dumps({
        'classifier': input_view.classifier,
        'explorationId': exploration_id,
        'inputType': input_view.name,
        'state': {'desc': state.name, 'dests': dests_array},
        'stateContent': content,
    }))
