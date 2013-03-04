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

"""Common utility functions for Yaml files."""

__author__ = 'sll@google.com (Sean Lip)'


import logging
import os
import yaml

from controllers.base import BaseHandler
import feconf
from models.state import State
import utils


class YamlTransformer(BaseHandler):
    """Handles operations involving YAML files."""

    @classmethod
    def get_yaml_from_dict(cls, dictionary):
        """Gets the YAML representation of a dict."""
        return yaml.safe_dump(dictionary, default_flow_style=False)

    @classmethod
    def get_dict_from_yaml(cls, yaml_file):
        """Gets the dict representation of a YAML file."""
        try:
            yaml_dict = yaml.safe_load(yaml_file)
            assert isinstance(yaml_dict, dict)
            return yaml_dict
        except yaml.YAMLError as e:
            raise cls.InvalidInputException(e)

    @classmethod
    def get_exploration_as_yaml(cls, exploration):
        """Returns a copy of the exploration as YAML."""
        init_dict = {}
        exploration_dict = {}
        for state_key in exploration.states:
            state = state_key.get()

            state_internals = state.internals_as_dict()
            # Change the dest id to a dest name.
            for action in state_internals['widget']['rules']:
                for rule in state_internals['widget']['rules'][action]:
                    if rule['dest'] != utils.END_DEST:
                        rule['dest'] = utils.get_entity(State, rule['dest']).name

            if exploration.init_state.get().hash_id == state.hash_id:
                init_dict[state.name] = state.internals_as_dict()
            else:
                exploration_dict[state.name] = state.internals_as_dict()

        result = YamlTransformer.get_yaml_from_dict(init_dict)
        if exploration_dict:
            result += YamlTransformer.get_yaml_from_dict(exploration_dict)
        return result

    @classmethod
    def create_exploration_from_yaml(cls, yaml, user, title, category, id=None):
        """Creates an exploration from a YAML file."""

        # TODO(sll): If the exploration creation throws an error, the
        # newly-created exploration should be deleted.

        yaml = yaml.strip()
        # TODO(sll): Make this more flexible by allowing spaces between ':' and '\n'.
        init_state_name = yaml[:yaml.find(':\n')]
        logging.info(init_state_name)
        if not init_state_name:
            raise cls.InvalidInputException(
                'Invalid YAML file: the initial state name cannot be identified')

        exploration = utils.create_new_exploration(
            user, title=title, category=category, init_state_name=init_state_name,
            id=id)
        yaml_description = cls.get_dict_from_yaml(yaml)

        # Create all the states first.
        for state_name, unused_state_description in yaml_description.iteritems():
            if state_name == init_state_name:
                continue
            else:
                if utils.check_existence_of_name(State, state_name, exploration):
                    raise cls.InvalidInputException(
                        'Invalid YAML file: contains duplicate state names %s' %
                        state_name)
                state = utils.create_new_state(exploration, state_name)

        for state_name, state_description in yaml_description.iteritems():
            state = utils.get_state_by_name(state_name, exploration)
            cls.modify_state_using_dict(exploration, state, state_description)

        return exploration

    @classmethod
    def verify_state(cls, description):
        """Verifies a state representation without referencing other states.

        This enforces the following constraints:
        - The only permitted fields are ['content', 'param_changes', 'widget'].
            - 'content' is optional and defaults to [].
            - 'param_changes' is optional and defaults to {}.
            - 'widget' must be present.
        - Each item in the 'content' array must have the keys ['type', 'value'].
            - The type must be one of ['text', 'image', 'video', 'widget'].
        - Permitted subfields of 'widget' are ['id', 'params', 'rules'].
            - The field 'id' is mandatory, and must correspond to an actual
                widget in the feconf.SAMPLE_WIDGETS_DIR directory.
        - Each ruleset in ['widget']['rules'] must have a non-empty array value,
            and each value should contain at least the fields ['code', 'dest'].
            - For all values except the last one, the 'code' field should
                correspond to a valid rule for the widget's classifier. [NOT
                IMPLEMENTED YET]
            - For the last value in each ruleset, the 'code' field should equal
                'True'.
        """
        logging.info(description)

        # Check the main keys.
        for key in description:
            if key not in ['content', 'param_changes', 'widget']:
                return False, 'Invalid key: %s' % key

        if 'content' not in description:
            description['content'] = []
        if 'param_changes' not in description:
            description['param_changes'] = {}
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
            with open(os.path.join(feconf.SAMPLE_WIDGETS_DIR, widget_id,
                      '%s.config.yaml' % widget_id)):
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

    @classmethod
    def modify_state_using_dict(cls, exploration, state, state_dict):
        """Modifies the properties of a state using values from a dictionary.

        Returns:
            The modified state.
        """
        is_valid, error_log = cls.verify_state(state_dict)
        if not is_valid:
            raise cls.InvalidInputException(error_log)

        state.content = state_dict['content']
        state.param_changes = state_dict['param_changes']
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

            if rule['dest'] == utils.END_DEST:
                rule_dict['dest'] = utils.END_DEST
            else:
                dest_state = utils.get_state_by_name(rule['dest'], exploration)
                if dest_state:
                    rule_dict['dest'] = dest_state.hash_id
                else:
                    raise cls.InvalidInputException(
                        'Invalid dest: %s' % rule['dest'])

            if 'rule' in rule:
                rule_dict['rule'] = rule['rule']

            if 'inputs' in rule:
                rule_dict['inputs'] = rule['inputs']

            if 'attrs' in rule:
                rule_dict['attrs'] = rule['attrs']

            # TODO(yanamal): Add param_changes here.

            rulesets_dict['submit'].append(rule_dict)

        state.interactive_rulesets = rulesets_dict
        state.put()
        return state
