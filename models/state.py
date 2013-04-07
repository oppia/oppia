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

import copy
import importlib
import logging
import os

from base_model import BaseModel
from data.classifiers import normalizers
import feconf
import utils
from widget import InteractiveWidget
from widget import Widget

from google.appengine.ext import ndb


class Content(ndb.Model):
    """Non-interactive content in a state."""
    type = ndb.StringProperty(choices=['text', 'image', 'video', 'widget'])
    value = ndb.TextProperty(default='')


class Rule(ndb.Model):
    """A rule for an answer classifier."""
    # The name of the rule.
    name = ndb.StringProperty(required=True)
    # Parameters for the classification rule. TODO(sll): Make these the actual params.
    inputs = ndb.JsonProperty(default={})
    # The id of the destination state.
    dest = ndb.StringProperty()
    # Feedback to give the reader if this rule is triggered.
    feedback = ndb.TextProperty(repeated=True)
    # Parameter changes to make if this rule is triggered.
    param_changes = ndb.JsonProperty(default={})


class AnswerHandlerInstance(ndb.Model):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    rules = ndb.LocalStructuredProperty(Rule, repeated=True)


class WidgetInstance(ndb.Model):
    """An instance of a widget."""
    # The id of the interactive widget class for this state.
    widget_id = ndb.StringProperty(default='Continue')
    # Parameter overrides for the interactive widget view, stored as key-value
    # pairs.
    params = ndb.JsonProperty(default={})
    # Answer handlers and rulesets.
    handlers = ndb.LocalStructuredProperty(AnswerHandlerInstance, repeated=True)


class State(BaseModel):
    """A state which forms part of an exploration."""
    # NB: This element's parent should be an Exploration.

    def get_default_rule(self):
        return Rule(name='Default', dest=self.id)

    def get_default_handler(self):
        return AnswerHandlerInstance(rules=[self.get_default_rule()])

    def get_default_widget(self):
        return WidgetInstance(handlers=[self.get_default_handler()])

    def _pre_put_hook(self):
        """Ensures that the widget and at least one handler for it exists."""
        if not self.widget:
            self.widget = self.get_default_widget()
        elif not self.widget.handlers:
            self.widget.handlers = [self.get_default_handler()]
        # TODO(sll): Do other validation.

    # Human-readable name for the state.
    name = ndb.StringProperty(default='Activity 1')
    # The content displayed to the reader in this state.
    content = ndb.StructuredProperty(Content, repeated=True)
    # Parameter changes associated with this state.
    param_changes = ndb.JsonProperty(default={})
    # The interactive widget associated with this state.
    widget = ndb.StructuredProperty(WidgetInstance, required=True)
    # A dict whose keys are unresolved answers associated with this state, and
    # whose values are their counts.
    unresolved_answers = ndb.JsonProperty(default={})

    @classmethod
    def create(cls, state_id, exploration, name):
        """Creates a new state."""
        new_state = cls(id=state_id, parent=exploration.key, name=name)
        new_state.widget = new_state.get_default_widget()
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
        state_dict = copy.deepcopy(self.to_dict(
            exclude=['name', 'unresolved_answers']))
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
            raise Exception(error_log)

        if 'content' in state_dict:
            state.content = [
                Content(type=content['type'], value=content['value'])
                for content in state_dict['content']
            ]
        if 'param_changes' in state_dict:
            state.param_changes = state_dict['param_changes']

        state.widget = WidgetInstance(widget_id=state_dict['widget']['widget_id'])

        widget_params = Widget.get(state_dict['widget']['widget_id']).params
        parameters = {}
        for param in widget_params:
            if param.name in state_dict['widget']['params']:
                parameters[param.name] = state_dict['widget']['params'][param.name]
                del state_dict['widget']['params'][param.name]
            else:
                parameters[param.name] = param.default_value

        if state_dict['widget']['params']:
            raise Exception('Extra parameters not used: %s' %
                            state_dict['widget']['params'])

        state.widget.params = parameters

        for handler in state_dict['widget']['handlers']:

            state_handler = AnswerHandlerInstance(name=handler['name'])

            for rule in handler['rules']:
                rule_instance = Rule()
                rule_instance.feedback = rule.get('feedback', [])

                if rule['dest'] == feconf.END_DEST:
                    rule_instance.dest = feconf.END_DEST
                else:
                    dest_state = State.get_by_name(rule['dest'], exploration)
                    if dest_state:
                        rule_instance.dest = dest_state.id
                    else:
                        raise Exception(
                            'Invalid destination: %s' % rule['dest'])

                if 'inputs' in rule:
                    rule_instance.inputs = rule['inputs']

                rule_instance.name = rule['name']

                state_handler.rules.append(rule_instance)

        state.widget.handlers = [state_handler]
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
        - Permitted subfields of 'widget' are ['widget_id', 'params', 'handlers'].
            - The field 'widget_id' is mandatory, and must correspond to an actual
                widget in the feconf.SAMPLE_WIDGETS_DIR directory.
        - Each ruleset in ['widget']['handlers'] must have a non-empty array value,
            and each value should contain at least the fields ['name', 'dest'].
            - For the last value in each ruleset, the 'name' field should equal
                'Default'.

        Args:
            description: A dict representation of a state.

        Returns:
            A 2-tuple. The first element is a boolean stating whether the state
            is valid. The second element is a string providing an error message
            if applicable.
        """
        # Check the main keys.
        for key in description:
            if key not in ['content', 'param_changes', 'widget']:
                return False, 'Invalid key: %s' % key

        if 'widget' not in description:
            return False, 'Missing key: \'widget\''

        # Validate 'widget'.
        for key in description['widget']:
            if key not in ['widget_id', 'params', 'handlers']:
                return False, 'Invalid key in widget: %s' % key
        if 'widget_id' not in description['widget']:
            return False, 'No widget id supplied'

        # Check that the widget_id refers to an actual widget.
        widget_id = description['widget']['widget_id']
        try:
            with open(os.path.join(feconf.SAMPLE_WIDGETS_DIR, widget_id,
                                   '%s.config.yaml' % widget_id)):
                pass
        except IOError:
            return False, 'No widget with widget id %s exists.' % widget_id

        # Check each of the rulesets.
        if 'handlers' in description['widget']:
            handlers = description['widget']['handlers']
            for handler in handlers:
                for ind, rule in enumerate(handler['rules']):
                    if 'name' not in rule:
                        return (False,
                                'Rule %s is missing a \'name\' field.' % ind)
                    if 'dest' not in rule:
                        return (False,
                                'Rule %s is missing a destination.' % ind)

                    if ind == len(handler['rules']) - 1:
                        if rule['name'] != 'Default':
                            return (False, 'The \'name\' field of the last '
                                    'rule should be \'Default\'')
                    else:
                        # TODO(sll): Check that the rule corresponds to a
                        # valid one from the relevant classifier.
                        pass

                    if 'feedback' in rule:
                        if not rule['feedback']:
                            rule['feedback'] = []
                        elif isinstance(rule['feedback'], basestring):
                            rule['feedback'] = [rule['feedback']]
                    else:
                        rule['feedback'] = []

        return True, ''

    def transition(self, answer, params, interactive_widget_properties):
        """Handle feedback interactions with readers."""

        dest_id = None
        feedback = None
        default_recorded_answer = None

        if interactive_widget_properties['classifier'] != 'None':
            # Import the relevant classifier module to be used in eval() below.
            classifier_module = '.'.join([
                feconf.SAMPLE_CLASSIFIERS_DIR.replace('/', '.'),
                interactive_widget_properties['classifier'],
                interactive_widget_properties['classifier']])
            Classifier = importlib.import_module(classifier_module)
            logging.info(Classifier.__name__)

            norm_answer = Classifier.DEFAULT_NORMALIZER(answer)
            if norm_answer is None:
                raise Exception(
                    'Invalid input: could not normalize the answer.')

        answer_handler = None
        for handler in self.widget.handlers:
            if handler.name == 'submit':
                answer_handler = handler

        for ind, rule in enumerate(answer_handler.rules):
            if ind == len(answer_handler.rules) - 1:
                # TODO(sll): This is a special case for multiple-choice input
                # which should really be handled generically. However, it's
                # not very interesting anyway because the reader's answer
                # in this case is already known (it's just the last of the
                # multiple-choice options given).
                recorded_answer = answer
                if self.widget.widget_id == 'MultipleChoiceInput':
                    recorded_answer = (
                        self.widget.params['choices'][int(answer)])

                default_recorded_answer = recorded_answer

            if rule.name == 'Default':
                dest_id = rule.dest
                feedback = (utils.get_random_choice(rule.feedback)
                            if rule.feedback else '')
                break

            # Add the 'answer' variable, and prepend classifier.
            code = 'Classifier.' + self.get_code(
                self.widget.widget_id, handler.name, rule).replace(
                    '(', '(norm_answer,', 1)

            code = utils.parse_with_jinja(code, params)
            if code is None:
                continue

            logging.info(code)

            return_value, unused_return_data = (
                utils.normalize_classifier_return(eval(code)))

            if return_value:
                dest_id = rule.dest
                feedback = (utils.get_random_choice(rule.feedback)
                            if rule.feedback else '')
                break

        return dest_id, feedback, default_recorded_answer

    def get_code(self, widget_id, handler_name, rule):
        classifier_func = rule.name.replace(' ', '')
        first_bracket = classifier_func.find('(')
        result = classifier_func[: first_bracket + 1]

        mutable_rule = InteractiveWidget.get(widget_id).get_readable_name(
            handler_name, rule.name)

        params = classifier_func[first_bracket + 1: -1].split(',')
        for index, param in enumerate(params):
            if index != 0:
                result += ','

            # Get the normalizer specified in the rule.
            param_spec = mutable_rule[
                mutable_rule.find('{{' + param) + 2:]
            param_spec = param_spec[param_spec.find('|') + 1:]
            normalizer_string = param_spec[: param_spec.find('}}')]

            normalizer = getattr(normalizers, normalizer_string)

            if (normalizer.__name__ == 'String' or
                    normalizer.__name__ == 'MusicNote'):
                result += 'u\'' + unicode(rule.inputs[param]) + '\''
            else:
                result += str(rule.inputs[param])

        result += ')'

        return result
