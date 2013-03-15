# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Model for an Oppia state."""

__author__ = 'Sean Lip'

import os

import feconf
import importlib
import logging

from google.appengine.ext import ndb


class Content(ndb.Model):
    """Non-interactive content in a state."""
    type = ndb.StringProperty(choices=['text', 'image', 'video', 'widget'])
    value = ndb.TextProperty(default='')


class State(ndb.Model):
    """A state which forms part of an exploration."""
    # NB: This element's parent should be an Exploration.
    # Human-readable name for the state.
    name = ndb.StringProperty(default='Activity 1')
    # The content displayed to the reader in this state.
    content = ndb.StructuredProperty(Content, repeated=True)
    # The id of the interactive widget class for this state.
    interactive_widget = ndb.StringProperty(default='Continue')
    # Parameter overrides for the interactive widget view, stored as key-value
    # pairs.
    interactive_params = ndb.JsonProperty(default={})
    # Rulesets for the interactive widget. Each ruleset is a key-value pair: the
    # key is the name of the reader's action (submit, click, etc.) and the value
    # is a list of rules, each represented as a dict with six elements:
    # - rule: the raw classification rule
    # - inputs: parameters for that classification rule
    # - code: Python code to check whether the answer satisfies the category
    # - dest: the destination state id
    # - feedback: feedback text
    # - param_changes: parameter changes
    # TODO(yanamal): Implement the parameter changes parts (the rest are done).
    # TODO(sll): Add validation.
    interactive_rulesets = ndb.JsonProperty(default={'submit': []})
    # Parameter changes associated with this state.
    param_changes = ndb.JsonProperty(default={})

    @property
    def id(self):
        return self.key.id()

    @classmethod
    def create(cls, state_id, exploration, name):
        """Creates a new state."""
        new_state = cls(
            id=state_id,
            parent=exploration.key,
            name=name,
            interactive_rulesets={'submit': [{
                'rule': 'Default',
                'inputs': {},
                'code': 'True',
                'dest': state_id,
                'feedback': '',
                'param_changes': [],
            }]}
        )
        new_state.put()
        return new_state

    @classmethod
    def get(cls, state_id, exploration):
        """Gets a state by id. If it does not exist, returns None."""
        return cls.get_by_id(state_id, parent=exploration.key)

    def as_dict(self):
        """Gets a Python dict representation of the state."""
        state_dict = self.internals_as_dict()
        state_dict['id'] = self.id
        state_dict['name'] = self.name
        return state_dict

    def internals_as_dict(self):
        """Gets a Python dict of the internals of the state."""
        state_dict = {
            'content': [{'type': item.type, 'value': item.value} for
                        item in self.content],
            'param_changes': self.param_changes,
            'widget': {
                'id': self.interactive_widget,
                'params': self.interactive_params,
                'rules': self.interactive_rulesets,
            }
        }

        return state_dict

    @classmethod
    def get_by_name(cls, name, exploration):
        """Gets a state by name. If it does not exist, returns None."""
        assert name
        assert exploration
        return cls.query(ancestor=exploration.key).filter(
            cls.name == name).get()

    @classmethod
    def modify_using_dict(cls, exploration, state, state_dict):
        """Modifies the properties of a state using values from a dictionary.

        Args:
            exploration: the exploration containing this state.
            state: the state.
            state_dict: the dict used to modify the state.

        Returns:
            The modified state.
        """
        is_valid, error_log = cls.verify(state_dict)
        if not is_valid:
            raise cls.InvalidInputException(error_log)

        if 'content' in state_dict:
            state.content = [
                Content(type=content['type'], value=content['value'])
                for content in state_dict['content']
            ]
        if 'param_changes' in state_dict:
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

            if rule['dest'] == feconf.END_DEST:
                rule_dict['dest'] = feconf.END_DEST
            else:
                dest_state = State.get_by_name(rule['dest'], exploration)
                if dest_state:
                    rule_dict['dest'] = dest_state.id
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

    @classmethod
    def verify(cls, description):
        """Verifies a state representation without referencing other states.

        The following constraints are enforced either here or in the state
        model:
        - The only permitted fields are ['content', 'param_changes', 'widget'].
            - 'content' is optional and defaults to [].
            - 'param_changes' is optional and defaults to {}.
            - 'widget' must be present.
        - Each item in the 'content' array must have the keys
           ['type', 'value'].
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

        Args:
            description: A dict representation of a state.

        Returns:
            A 2-tuple. The first element is a boolean stating whether the state
            is valid. The second element is a string providing an error message
            if applicable.
        """
        logging.info(description)

        # Check the main keys.
        for key in description:
            if key not in ['content', 'param_changes', 'widget']:
                return False, 'Invalid key: %s' % key

        if 'widget' not in description:
            return False, 'Missing key: \'widget\''

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
                    return (False,
                            'No rules supplied for ruleset %s' % ruleset_name)

                for ind, rule in enumerate(rules):
                    if 'code' not in rule:
                        return (False,
                                'Rule %s is missing a \'code\' field.' % ind)
                    if 'dest' not in rule:
                        return (False,
                                'Rule %s is missing a destination.' % ind)

                    if ind == len(rules) - 1:
                        rule['code'] = str(rule['code'])
                        if rule['code'] != 'True':
                            return (False, 'The \'code\' field of the last '
                                    'rule should be \'True\'')
                    else:
                        # TODO(sll): Check that the rule corresponds to a
                        # valid one from the relevant classifier.
                        pass

        return True, ''
