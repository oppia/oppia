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

"""Controllers for the Oppia editor view."""

__author__ = 'sll@google.com (Sean Lip)'

import json
import logging

from controllers.base import BaseHandler, require_editor, require_user
import feconf
from models.models import AugmentedUser
from models.state import State
import utils

EDITOR_MODE = 'editor'


def GetStateAsDict(state):
    """Gets a Python dict representation of a state."""

    return {
        'content': state.content,
        'widget': {
            'id': state.interactive_widget,
            'params': state.interactive_params,
            'rules': state.interactive_rulesets,
        }
    }


class NewExploration(BaseHandler):
    """Creates a new exploration."""

    @require_user
    def post(self, user):  # pylint: disable-msg=C6409
        """Handles POST requests."""

        title = self.request.get('title')
        category = self.request.get('category')
        yaml = self.request.get('yaml')
        if yaml:
            exploration = utils.CreateExplorationFromYaml(
                yaml=yaml, user=user, title=title, category=category)
        else:
            exploration = utils.CreateNewExploration(
                user, title=title, category=category)

        self.response.out.write(json.dumps({
                'explorationId': exploration.hash_id,
        }))


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    @require_editor
    def get(self, user, exploration):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        self.values.update({
            'js': utils.GetJsFilesWithBase(
                ['editorExploration', 'editorTree',
                 'editorGraph', 'guiEditor', 'yamlEditor']),
            'nav_mode': EDITOR_MODE,
        })
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'editor/editor_exploration.html').render(self.values))

    @require_editor
    def post(self, user, exploration):  # pylint: disable-msg=C6409
        """Adds a new state to the given exploration."""

        state_name = self.request.get('state_name')
        if not state_name:
            raise self.InvalidInputException('Please specify a state name.')

        # Check that the state_name has not been taken.
        if utils.CheckExistenceOfName(State, state_name, exploration):
            raise self.InvalidInputException(
                'Duplicate state name for exploration %s: %s' %
                (exploration.title, state_name))

        state = utils.CreateNewState(exploration, state_name)

        self.response.out.write(json.dumps({
            'stateId': state.hash_id,
            'stateName': state.name,
            'stateContent': state.content,
        }))

    @require_editor
    def put(self, user, exploration):  # pylint: disable-msg=C6409
        """Updates properties of the given exploration."""

        for key in self.request.arguments():
            if key not in ['is_public', 'category', 'title', 'image_id']:
                raise self.InvalidInputException(
                    '\'%s\' is not a valid editable property' % key)

        is_public = self.request.get('is_public')
        category = self.request.get('category')
        title = self.request.get('title')
        image_id = self.request.get('image_id')

        if is_public:
            exploration.is_public = True
        if category:
            exploration.category = category
        if title:
            exploration.title = title
        if 'image_id' in self.request.arguments():  # NB: image_id can be null
            exploration.image_id = image_id
        exploration.put()

    @require_editor
    def delete(self, user, exploration):
        """Deletes the given exploration."""

        for state_key in exploration.states:
            state_key.delete()

        augmented_users = AugmentedUser.query().filter(
            AugmentedUser.editable_explorations == exploration.key)
        for augmented_user in augmented_users:
            augmented_user.editable_explorations.remove(exploration.key)
            augmented_user.put()

        exploration.key.delete()


class ExplorationHandler(BaseHandler):
    """Page with editor data for a single exploration."""

    @require_editor
    def get(self, user, exploration):  # pylint: disable-msg=C6409
        """Gets the question name and state list for a question page."""

        state_list = {}
        for state_key in exploration.states:
            state = state_key.get()
            ruleset = state.interactive_rulesets['submit']
            state_destinations = [{'category': rule['rule'], 'dest': rule['dest']}
                                  for rule in ruleset]
            state_list[state.hash_id] = GetStateAsDict(state)
            state_list[state.hash_id]['dests'] = state_destinations
            state_list[state.hash_id]['name'] = state.name
            state_list[state.hash_id]['stateId'] = state.hash_id

        logging.info(state_list)

        self.data_values.update({
            'exploration_id': exploration.hash_id,
            'init_state_id': exploration.init_state.get().hash_id,
            'is_public': exploration.is_public,
            'image_id': exploration.image_id,
            'category': exploration.category,
            'title': exploration.title,
            'owner': str(exploration.owner),
            'states': state_list,
        })
        self.response.out.write(json.dumps(self.data_values))


class ExplorationDownloadHandler(BaseHandler):
    """Downloads an exploration as a YAML file."""

    @require_editor
    def get(self, user, exploration):  # pylint: disable-msg=C6409
        """Handles GET requests."""
        filename = str('oppia-%s' % exploration.title)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.txt' % filename)
        # TODO(sll): Cache the YAML file.
        init_dict = {}
        exploration_dict = {}
        for state_key in exploration.states:
            state = state_key.get()
            if exploration.init_state.get().hash_id == state.hash_id:
                init_dict[state.name] = GetStateAsDict(state)
            else:
                exploration_dict[state.name] = GetStateAsDict(state)
        self.response.out.write(utils.GetYamlFromDict(init_dict))
        self.response.out.write(utils.GetYamlFromDict(exploration_dict))


class StatePage(BaseHandler):
    """Allows content creators to edit a state."""

    @require_editor
    def get(self, user, exploration, unused_state):  # pylint: disable-msg=C6409
        """Gets a page representing an exploration with a list of states."""
        self.values.update({
            'js': utils.GetJsFilesWithBase(
                ['editorExploration', 'editorGraph',
                 'editorTree', 'guiEditor', 'yamlEditor']),
            'nav_mode': EDITOR_MODE,
        })
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'editor/editor_exploration.html').render(self.values))

    @require_editor
    def post(self, user, exploration, state):  # pylint: disable-msg=C6409
        """Returns the properties of a state when it is opened for editing."""

        values = {
            'actions': [],
            'interactiveWidget': state.interactive_widget,
            'interactiveRulesets': state.interactive_rulesets,
            'interactiveParams': state.interactive_params,
            'stateId': state.hash_id,
            'stateName': state.name,
            'stateContent': state.content,
            'yaml': '',
        }

        # Retrieve the actions corresponding to this state.
        ruleset = state.interactive_rulesets['submit']
        for rule in ruleset:
            action = {'category': rule['rule'], 'dest': rule['dest']}
            if rule['feedback']:
                action['feedback'] = rule['feedback']
            values['actions'].append(action)

        values['yaml'] = utils.GetYamlFromDict(GetStateAsDict(state))

        self.response.out.write(json.dumps(values))


class StateHandler(BaseHandler):
    """Handles state transactions."""

    @require_editor
    def put(self, user, exploration, state):  # pylint: disable-msg=C6409
        """Saves updates to a state."""

        yaml_file = self.request.get('yaml_file')
        if yaml_file:
            # The user has uploaded a YAML file. Process only this action.
            state = utils.ModifyStateUsingDict(
                exploration, state, utils.GetDictFromYaml(yaml_file))
            dests_array = []
            for rule in state.interactive_rulesets['submit']:
                dests_array.append(rule['dest'])
            self.response.out.write(json.dumps({
                'explorationId': exploration.hash_id,
                'state': {'name': state.name, 'dests': dests_array},
                'stateContent': state.content,
            }))
            return

        state_name = self.request.get('state_name')
        interactive_widget = self.request.get('interactive_widget')
        interactive_params_json = self.request.get('interactive_params')
        interactive_rulesets_json = self.request.get('interactive_rulesets')
        state_content_json = self.request.get('state_content')

        if state_name:
            # Replace the state name with this one, after checking validity.
            if state_name == utils.END_DEST:
                raise self.InvalidInputException('Invalid state name: END')
            if (state_name != state.name and utils.CheckExistenceOfName(
                State, state_name, exploration)):
                raise self.InvalidInputException(
                    'Duplicate state name: %s', state_name)
            state.name = state_name
            state.put()

        if interactive_widget:
            state.interactive_widget = interactive_widget

        if interactive_params_json:
            state.interactive_params = json.loads(interactive_params_json)

        if interactive_rulesets_json:
            state.interactive_rulesets = json.loads(interactive_rulesets_json)
            # TODO(sll): Do additional calculations here to get the parameter changes,
            # if necessary.
            ruleset = state.interactive_rulesets['submit']
            for rule_ind in range(len(ruleset)):
                rule = ruleset[rule_ind]

                # Generate the code to be executed.
                if 'attrs' not in rule or 'classifier' not in rule['attrs']:
                    # This is the default rule.
                    assert rule_ind == len(ruleset) - 1
                    rule['code'] = 'True'
                    continue

                classifier_func = rule['attrs']['classifier'].replace(' ', '')
                first_bracket = classifier_func.find('(')
                result = classifier_func[: first_bracket + 1]

                params = classifier_func[first_bracket + 1: -1].split(',')
                for param in params:
                    if param not in rule['inputs']:
                        raise self.InvalidInputException(
                            'Parameter %s could not be replaced.' % param)
                    result += ','

                    # IMPORTANT TODO(sll): The following is a hack for text
                    # input. Should call a pre-converter method to convert the
                    # answer and the parameters into the appropriate type for
                    # the classifier according to the relevant validation rules.
                    # (Don't forget to escape quotes in strings, handle
                    # parameter replacements, etc.)
                    result += 'u\'' + rule['inputs'][param] + '\''
                result += ')'

                logging.info(result)

        if state_content_json:
            state_content = json.loads(state_content_json)
            state.content = [{'type': item['type'], 'value': item['value']}
                             for item in state_content]

        state.put()

    @require_editor
    def delete(self, user, exploration, state):  # pylint: disable-msg=C6409
        """Deletes the state with id state_id."""

        # Do not allow deletion of initial states.
        if exploration.init_state == state.key:
            raise self.InvalidInputException(
                'Cannot delete initial state of an exploration.')
            return

        # Find all dests in this exploration which equal the state to be
        # deleted, and change them to loop back to their containing state.
        for state_key in exploration.states:
            origin_state = state_key.get()
            changed = False
            for key in origin_state.interactive_rulesets:
                rules = origin_state.interactive_rulesets[key]
                for rule in rules:
                    if rule['dest'] == state.key:
                        rule['dest'] = origin_state.key
                        changed = True
            if changed:
                origin_state.put()

        # Delete the state with id state_id.
        state.key.delete()
        exploration.states.remove(state.key)
        exploration.put()
