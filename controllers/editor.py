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

from controllers.base import BaseHandler, require_editor, require_user
from controllers.widgets import InteractiveWidget
from data.classifiers import normalizers
import feconf
from models.exploration import Exploration
from models.models import AugmentedUser
from models.state import State
import utils
from yaml_utils import YamlTransformer

EDITOR_MODE = 'editor'


def get_state_for_frontend(state):
    """Returns a representation of the given state for the frontend."""

    state_repr = state.as_dict()
    # Modify the YAML representation to use names instead of ids.
    modified_state_dict = copy.deepcopy(state.internals_as_dict())
    for action in modified_state_dict['widget']['rules']:
        for rule in modified_state_dict['widget']['rules'][action]:
            if rule['dest'] != utils.END_DEST:
                rule['dest'] = utils.get_entity(State, rule['dest']).name
    state_repr['yaml'] = YamlTransformer.get_yaml_from_dict(modified_state_dict)
    return state_repr


class NewExploration(BaseHandler):
    """Creates a new exploration."""

    @require_user
    def post(self, user):
        """Handles POST requests."""

        title = self.request.get('title')
        category = self.request.get('category')
        use_sample_exploration = self.request.get('use_sample')

        if not category:
            raise self.InvalidInputException('No category chosen.')

        if use_sample_exploration:
            # It is necessary to get the sample exploration as a YAML file, so
            # that new states can be created.
            exploration = utils.get_entity(Exploration, '0')
            yaml = YamlTransformer.get_exploration_as_yaml(exploration)
            if not title:
                title = 'Clone of \'Hola\''
        else:
            yaml = self.request.get('yaml')

        if not title:
            raise self.InvalidInputException('No title supplied.')

        if yaml:
            exploration = YamlTransformer.create_exploration_from_yaml(
                yaml=yaml, user=user, title=title, category=category)
        else:
            exploration = utils.create_new_exploration(
                user, title=title, category=category)

        self.response.out.write(json.dumps({
            'explorationId': exploration.hash_id,
        }))


class ExplorationPage(BaseHandler):
    """Page describing a single exploration."""

    @require_editor
    def get(self, user, exploration):
        """Handles GET requests."""
        self.values.update({
            'js': utils.get_js_controllers(
                ['editorExploration', 'editorTree', 'editorGraph',
                 'guiEditor', 'yamlEditor', 'interactiveWidgetPreview']),
            'nav_mode': EDITOR_MODE,
        })
        self.response.out.write(feconf.JINJA_ENV.get_template(
            'editor/editor_exploration.html').render(self.values))

    @require_editor
    def post(self, user, exploration):
        """Adds a new state to the given exploration."""

        state_name = self.request.get('state_name')
        if not state_name:
            raise self.InvalidInputException('Please specify a state name.')

        # Check that the state_name has not been taken.
        if utils.check_existence_of_name(State, state_name, exploration):
            raise self.InvalidInputException(
                'Duplicate state name for exploration %s: %s' %
                (exploration.title, state_name))

        state = utils.create_new_state(exploration, state_name)
        self.response.out.write(json.dumps(state.as_dict()))

    @require_editor
    def put(self, user, exploration):
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
        if 'image_id' in self.request.arguments():
            exploration.image_id = None if image_id == 'null' else image_id

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
    def get(self, user, exploration):
        """Gets the question name and state list for a question page."""

        state_list = {}
        for state_key in exploration.states:
            state = state_key.get()
            state_list[state.hash_id] = get_state_for_frontend(state)

        self.values.update({
            'exploration_id': exploration.hash_id,
            'init_state_id': exploration.init_state.get().hash_id,
            'is_public': exploration.is_public,
            'image_id': exploration.image_id,
            'category': exploration.category,
            'title': exploration.title,
            'owner': str(exploration.owner),
            'states': state_list,
        })
        self.response.out.write(json.dumps(self.values))


class ExplorationDownloadHandler(BaseHandler):
    """Downloads an exploration as a YAML file."""

    @require_editor
    def get(self, user, exploration):
        """Handles GET requests."""
        filename = str('oppia-%s' % exploration.title)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.txt' % filename)
        # TODO(sll): Cache the YAML file.
        self.response.out.write(
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
            for k, v in d.items():
                self.recursively_remove_attr(d[k], attr_to_remove)

    @require_editor
    def put(self, user, exploration, state):
        """Saves updates to a state."""

        yaml_file_json = self.request.get('yaml_file')
        if yaml_file_json:
            # The user has uploaded a YAML file. Process only this action.
            yaml_file = json.loads(yaml_file_json)
            state = YamlTransformer.modify_state_using_dict(
                exploration, state, YamlTransformer.get_dict_from_yaml(yaml_file))
            self.response.out.write(json.dumps(get_state_for_frontend(state)))
            return

        state_name_json = self.request.get('state_name')
        param_changes_json = self.request.get('param_changes')
        interactive_widget_json = self.request.get('interactive_widget')
        interactive_params_json = self.request.get('interactive_params')
        interactive_rulesets_json = self.request.get('interactive_rulesets')
        content_json = self.request.get('content')

        for arg in self.request.arguments():
            logging.info(arg)
            logging.info(self.request.get(arg))

        if state_name_json:
            state_name = json.loads(state_name_json)
            # Replace the state name with this one, after checking validity.
            if state_name == utils.END_DEST:
                raise self.InvalidInputException('Invalid state name: END')
            if (state_name != state.name and utils.check_existence_of_name(
                    State, state_name, exploration)):
                raise self.InvalidInputException(
                    'Duplicate state name: %s', state_name)
            state.name = state_name
            state.put()

        if param_changes_json:
            state.param_changes = json.loads(param_changes_json)

        if interactive_widget_json:
            state.interactive_widget = json.loads(interactive_widget_json)

        if interactive_params_json:
            state.interactive_params = json.loads(interactive_params_json)

        if interactive_rulesets_json:
            state.interactive_rulesets = json.loads(interactive_rulesets_json)
            ruleset = state.interactive_rulesets['submit']

            self.recursively_remove_attr(
                state.interactive_rulesets['submit'], u'$$hashKey')

            if len(ruleset) > 1:
                interactive_widget_properties = InteractiveWidget.get_interactive_widget(
                    state.interactive_widget)['actions']['submit']
                # Import the relevant classifier module to be used in eval() below.
                classifier_module = '.'.join([
                    feconf.SAMPLE_CLASSIFIERS_DIR.replace('/', '.'),
                    interactive_widget_properties['classifier'],
                    interactive_widget_properties['classifier']])
                Classifier = importlib.import_module(classifier_module)
            else:
                assert 'attrs' not in ruleset[0] or 'classifier' not in ruleset[0]['attrs']

            # TODO(yanamal): Do additional calculations here to get the parameter
            # changes, if necessary.
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
                    mutable_rule = mutable_rule[mutable_rule.find('{{') + 2:]
                    mutable_rule = mutable_rule[mutable_rule.find('|') + 1:]
                    normalizer_string = mutable_rule[: mutable_rule.find('}}')]
                    mutable_rule = mutable_rule[mutable_rule.find('}}') + 2:]

                    normalizer = getattr(normalizers, normalizer_string)
                    normalized_param = normalizer(rule['inputs'][param])
                    if normalized_param is None:
                        raise self.InvalidInputException(
                            '%s has the wrong type. Please replace it with a '
                            '%s.' % (rule['inputs'][param], normalizer_string))

                    if normalizer.__name__ == 'String':
                        result += 'u\'' + unicode(normalized_param) + '\''
                    else:
                        result += str(normalized_param)

                result += ')'

                logging.info(result)
                rule['code'] = result

        if content_json:
            content = json.loads(content_json)
            state.content = [{'type': item['type'], 'value': item['value']}
                             for item in content]

        state.put()
        logging.info(get_state_for_frontend(state))
        self.response.out.write(json.dumps(get_state_for_frontend(state)))

    @require_editor
    def delete(self, user, exploration, state):
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
