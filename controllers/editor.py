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

import copy
import importlib
import json
import logging

from controllers.base import BaseHandler
from controllers.base import require_editor
from controllers.base import require_user
from controllers.widgets import InteractiveWidget
from data.classifiers import normalizers
import feconf
from models.exploration import Exploration
from models.state import Content
from models.state import State
import utils
from yaml_utils import YamlTransformer

from google.appengine.api import users

EDITOR_MODE = 'editor'


def get_state_for_frontend(state, exploration):
    """Returns a representation of the given state for the frontend."""

    state_repr = state.as_dict()
    # Modify the YAML representation to use names instead of ids.
    modified_state_dict = copy.deepcopy(state.internals_as_dict())
    for action in modified_state_dict['widget']['rules']:
        for rule in modified_state_dict['widget']['rules'][action]:
            if rule['dest'] != utils.END_DEST:
                rule['dest'] = State.get(rule['dest'], exploration).name
    state_repr['yaml'] = YamlTransformer.get_yaml_from_dict(modified_state_dict)
    return state_repr


class NewExploration(BaseHandler):
    """Creates a new exploration."""

    @require_user
    def post(self, user):
        """Handles POST requests."""

        title = self.request.get('title')
        category = self.request.get('category')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        yaml = self.request.get('yaml')

        if yaml:
            exploration = YamlTransformer.create_exploration_from_yaml(
                yaml_file=yaml, user=user, title=title, category=category)
        else:
            exploration = utils.create_new_exploration(
                user, title=title, category=category)

        self.response.write(json.dumps({
            'explorationId': exploration.id,
        }))


class ForkExploration(BaseHandler):
    """Forks an existing exploration."""

    @require_user
    def post(self, user):
        """Handles POST requests."""

        payload = json.loads(self.request.get('payload'))

        exploration_id = payload.get('exploration_id')

        if not utils.is_demo_exploration(exploration_id):
            raise self.InvalidInputException('Exploration cannot be forked.')

        forked_exploration = Exploration.get(exploration_id)
        if not forked_exploration:
            raise self.InvalidInputException(
                'Exploration %s does not exist.' % exploration_id)

        # Get the demo exploration as a YAML file, so that new states can be
        # created.
        yaml = YamlTransformer.get_exploration_as_yaml(forked_exploration)
        title = 'Copy of %s' % forked_exploration.title
        category = forked_exploration.category

        exploration = YamlTransformer.create_exploration_from_yaml(
            yaml_file=yaml, user=user, title=title, category=category)

        self.response.write(json.dumps({
            'explorationId': exploration.id,
        }))


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    @require_editor
    def get(self, unused_user, unused_exploration):
        """Handles GET requests."""
        self.values.update({
            'js': utils.get_js_controllers(
                ['editorExploration', 'editorTree', 'editorGraph',
                 'guiEditor', 'yamlEditor', 'interactiveWidgetPreview']),
            'nav_mode': EDITOR_MODE,
        })
        self.render_template('editor/editor_exploration.html')

    @require_editor
    def post(self, unused_user, exploration):
        """Adds a new state to the given exploration."""

        payload = json.loads(self.request.get('payload'))

        state_name = payload.get('state_name')
        if not state_name:
            raise self.InvalidInputException('Please specify a state name.')

        # Check that the state_name has not been taken.
        if utils.check_existence_of_name(State, state_name, exploration):
            raise self.InvalidInputException(
                'Duplicate state name for exploration %s: %s' %
                (exploration.title, state_name))

        state = utils.create_new_state(exploration, state_name)
        self.response.write(json.dumps(state.as_dict()))

    @require_editor
    def put(self, user, exploration):
        """Updates properties of the given exploration."""

        payload = json.loads(self.request.get('payload'))

        is_public = payload.get('is_public')
        category = payload.get('category')
        title = payload.get('title')
        image_id = payload.get('image_id')
        editors = payload.get('editors')

        if is_public:
            exploration.is_public = True
        if category:
            exploration.category = category
        if title:
            exploration.title = title
        if 'image_id' in self.request.arguments():
            exploration.image_id = None if image_id == 'null' else image_id
        if editors:
            if user == exploration.owner:
                exploration.editors = editors
                for email in editors:
                    editor = users.User(email=email)
                    augmented_user = utils.get_augmented_user(editor)
                    if (exploration.key not in
                        augmented_user.editable_explorations):
                        augmented_user.editable_explorations.append(
                            exploration.key)
                        augmented_user.put()
            else:
                raise self.UnauthorizedUserException(
                    'Only the exploration owner can add new collaborators.')

        exploration.put()

    @require_editor
    def delete(self, unused_user, exploration):
        """Deletes the given exploration."""
        utils.delete_exploration(exploration)


class ExplorationHandler(BaseHandler):
    """Page with editor data for a single exploration."""

    @require_editor
    def get(self, unused_user, exploration):
        """Gets the question name and state list for a question page."""

        state_list = {}
        for state_key in exploration.states:
            state = state_key.get()
            state_list[state.id] = get_state_for_frontend(state, exploration)

        self.values.update({
            'exploration_id': exploration.id,
            'init_state_id': exploration.init_state.get().id,
            'is_public': exploration.is_public,
            'image_id': exploration.image_id,
            'category': exploration.category,
            'title': exploration.title,
            'owner': str(exploration.owner),
            'editors': exploration.editors,
            'states': state_list,
        })
        self.response.write(json.dumps(self.values))


class ExplorationDownloadHandler(BaseHandler):
    """Downloads an exploration as a YAML file."""

    @require_editor
    def get(self, unused_user, exploration):
        """Handles GET requests."""
        filename = 'oppia-%s' % utils.to_string(exploration.title)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.txt' % filename)
        # TODO(sll): Cache the YAML file.
        self.response.write(
            YamlTransformer.get_exploration_as_yaml(exploration))


class StateHandler(BaseHandler):
    """Handles state transactions."""

    # Recursively removes keys from a dict.
    def recursively_remove_attr(self, d, attr_to_remove):
        if isinstance(d, list):
            for item in d:
                self.recursively_remove_attr(item, attr_to_remove)
        elif isinstance(d, dict):
            if attr_to_remove in d:
                del d[attr_to_remove]
            for key, unused_value in d.items():
                self.recursively_remove_attr(d[key], attr_to_remove)

    @require_editor
    def put(self, unused_user, exploration, state):
        """Saves updates to a state."""

        payload = json.loads(self.request.get('payload'))

        yaml_file = payload.get('yaml_file')
        if yaml_file:
            # The user has uploaded a YAML file. Process only this action.
            state = YamlTransformer.modify_state_using_dict(
                exploration, state,
                YamlTransformer.get_dict_from_yaml(yaml_file))
            self.response.write(json.dumps(
                get_state_for_frontend(state, exploration)))
            return

        state_name = payload.get('state_name')
        param_changes = payload.get('param_changes')
        interactive_widget = payload.get('interactive_widget')
        interactive_params = payload.get('interactive_params')
        interactive_rulesets = payload.get('interactive_rulesets')
        content = payload.get('content')

        if state_name:
            # Replace the state name with this one, after checking validity.
            if state_name == utils.END_DEST:
                raise self.InvalidInputException('Invalid state name: END')
            if (state_name != state.name and utils.check_existence_of_name(
                    State, state_name, exploration)):
                raise self.InvalidInputException(
                    'Duplicate state name: %s', state_name)
            state.name = state_name
            state.put()

        if param_changes:
            state.param_changes = param_changes

        if interactive_widget:
            state.interactive_widget = interactive_widget

        if interactive_params:
            state.interactive_params = interactive_params

        if interactive_rulesets:
            state.interactive_rulesets = interactive_rulesets
            ruleset = state.interactive_rulesets['submit']

            self.recursively_remove_attr(
                state.interactive_rulesets['submit'], u'$$hashKey')

            if len(ruleset) > 1:
                interactive_widget_properties = (
                    InteractiveWidget.get_interactive_widget(
                        state.interactive_widget)['actions']['submit'])
                # Import the relevant classifier module to use in eval() below.
                classifier_module = '.'.join([
                    feconf.SAMPLE_CLASSIFIERS_DIR.replace('/', '.'),
                    interactive_widget_properties['classifier'],
                    interactive_widget_properties['classifier']])
                Classifier = importlib.import_module(classifier_module)
            else:
                assert ('attrs' not in ruleset[0] or
                        'classifier' not in ruleset[0]['attrs'])

            # TODO(yanamal): Do additional calculations here to get the
            # parameter changes, if necessary.
            for rule_ind in range(len(ruleset)):
                rule = ruleset[rule_ind]
                logging.info(rule)

                # Generate the code to be executed.
                if rule['rule'] == 'Default':
                    # This is the default rule.
                    assert rule_ind == len(ruleset) - 1
                    rule['code'] = 'True'
                    continue

                classifier_func = rule['attrs']['classifier'].replace(' ', '')
                first_bracket = classifier_func.find('(')
                result = classifier_func[: first_bracket + 1]

                mutable_rule = rule['rule']

                # TODO(sll): The next line is wrong. It should account for
                # commas within brackets.
                params = classifier_func[first_bracket + 1: -1].split(',')
                for index, param in enumerate(params):
                    if param not in rule['inputs']:
                        raise self.InvalidInputException(
                            'Parameter %s could not be replaced.' % param)
                    if index != 0:
                        result += ','

                    # Get the normalizer specified in the rule.
                    param_spec = mutable_rule[
                        mutable_rule.find('{{' + param) + 2:]
                    param_spec = param_spec[param_spec.find('|') + 1:]
                    normalizer_string = param_spec[: param_spec.find('}}')]

                    normalizer = getattr(normalizers, normalizer_string)
                    # TODO(sll): Make the following check more robust.
                    if (not isinstance(rule['inputs'][param], basestring) or
                        '{{' not in rule['inputs'][param] or
                        '}}' not in rule['inputs'][param]):
                        normalized_param = normalizer(rule['inputs'][param])
                    else:
                        normalized_param = rule['inputs'][param]

                    if normalized_param is None:
                        raise self.InvalidInputException(
                            '%s has the wrong type. Please replace it with a '
                            '%s.' % (rule['inputs'][param], normalizer_string))

                    if (normalizer.__name__ == 'String' or
                        normalizer.__name__ == 'MusicNote'):
                        result += 'u\'' + unicode(normalized_param) + '\''
                    else:
                        result += str(normalized_param)

                result += ')'

                logging.info(result)
                rule['code'] = result

        if content:
            state.content = [Content(type=item['type'], value=item['value'])
                             for item in content]

        state.put()
        self.response.write(json.dumps(
            get_state_for_frontend(state, exploration)))

    @require_editor
    def delete(self, unused_user, exploration, state):
        """Deletes the state with id state_id."""

        # Do not allow deletion of initial states.
        if exploration.init_state == state.key:
            raise self.InvalidInputException(
                'Cannot delete initial state of an exploration.')

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
