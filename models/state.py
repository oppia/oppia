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

from base_model import BaseModel
from data.objects.models import objects
import feconf
import parameter
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
    # TODO(sll): Ensure the types for param_changes are consistent.

    # The name of the rule.
    name = ndb.StringProperty(required=True)
    # Parameters for the classification rule. TODO(sll): Make these the actual params.
    inputs = ndb.JsonProperty(default={})
    # The id of the destination state.
    dest = ndb.StringProperty()
    # Feedback to give the reader if this rule is triggered.
    feedback = ndb.TextProperty(repeated=True)
    # State-level parameter changes to make if this rule is triggered.
    param_changes = parameter.ParameterChangeProperty(repeated=True)


class AnswerHandlerInstance(ndb.Model):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    rules = ndb.LocalStructuredProperty(Rule, repeated=True)


class WidgetInstance(ndb.Model):
    """An instance of a widget."""
    # The id of the interactive widget class for this state.
    widget_id = ndb.StringProperty(default='Continue')
    # Parameters for the interactive widget view, stored as key-value pairs.
    # Each parameter is single-valued. The values may be Jinja templates that
    # refer to state parameters.
    params = ndb.JsonProperty(default={})
    # If true, keep the widget instance from the previous state if both are of
    # the same type.
    sticky = ndb.BooleanProperty(default=False)
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
    param_changes = parameter.ParameterChangeProperty(repeated=True)
    # The interactive widget associated with this state.
    widget = ndb.StructuredProperty(WidgetInstance, required=True)
    # A dict whose keys are unresolved answers associated with this state, and
    # whose values are their counts.
    unresolved_answers = ndb.JsonProperty(default={})

    @classmethod
    def create(cls, exploration, name, state_id=None):
        """Creates a new state."""
        state_id = state_id or cls.get_new_id(name)
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

    def internals_as_dict(self, human_readable_dests=False):
        """Gets a Python dict of the internals of the state."""
        state_dict = copy.deepcopy(self.to_dict(
            exclude=['name', 'unresolved_answers']))
        if human_readable_dests:
            # Change the dest ids to human-readable names.
            for handler in state_dict['widget']['handlers']:
                for rule in handler['rules']:
                    if rule['dest'] != feconf.END_DEST:
                        dest_state = State.get_by_id(
                            rule['dest'], parent=self.key.parent())
                        rule['dest'] = dest_state.name
        return state_dict

    @classmethod
    def get_by_name(cls, name, exploration, strict=True):
        """Gets a state by name. Fails noisily if strict == True."""
        assert name and exploration
        state = cls.query(ancestor=exploration.key).filter(
            cls.name == name).get()
        if strict and not state:
            raise Exception('State %s not found.' % name)
        return state

    @classmethod
    def modify_using_dict(cls, exploration, state, state_dict):
        """Modifies the properties of a state using values from a dictionary.

        Args:
            exploration: the exploration containing this state.
            state: the state.
            state_dict: a valid dict representing the state.

        Returns:
            The modified state.
        """
        state.content = [
            Content(type=item['type'], value=item['value'])
            for item in state_dict['content']
        ]

        state.param_changes = [
            parameter.ParameterChange(**param_change)
            for param_change in state_dict['param_changes']
        ]

        state.widget = WidgetInstance(
            widget_id=state_dict['widget']['widget_id'],
            sticky=state_dict['widget']['sticky'])

        state.widget.params = state_dict['widget']['params']
        widget_params = Widget.get(state_dict['widget']['widget_id']).params
        for wp in widget_params:
            if wp.name not in state_dict['widget']['params']:
                state.widget.params[wp.name] = wp.value

        state.widget.handlers = []
        for handler in state_dict['widget']['handlers']:
            state_handler = AnswerHandlerInstance(name=handler['name'])

            for rule in handler['rules']:
                rule_dest = (
                    feconf.END_DEST if rule['dest'] == feconf.END_DEST
                    else State.get_by_name(rule['dest'], exploration).id)

                state_handler.rules.append(Rule(
                    feedback=rule['feedback'], inputs=rule['inputs'],
                    name=rule['name'], dest=rule_dest
                ))

            state.widget.handlers.append(state_handler)

        state.put()
        return state

    def transition(self, answer, params, interactive_widget_properties):
        """Handle feedback interactions with readers."""

        dest_id = None
        feedback = None
        recorded_answer = answer

        if interactive_widget_properties['classifier']:
            # Import the relevant classifier module.
            classifier_module = '.'.join([
                feconf.SAMPLE_CLASSIFIERS_DIR.replace('/', '.'),
                interactive_widget_properties['classifier'],
                interactive_widget_properties['classifier']])
            Classifier = importlib.import_module(classifier_module)
            logging.info(Classifier.__name__)

            norm_answer = Classifier.DEFAULT_NORMALIZER().normalize(answer)
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
                if self.widget.widget_id == 'MultipleChoiceInput':
                    recorded_answer = (
                        self.widget.params['choices'][int(answer)])

            if rule.name == 'Default':
                dest_id = rule.dest
                feedback = (utils.get_random_choice(rule.feedback)
                            if rule.feedback else '')
                break

            func_name, param_list = self.get_classifier_info(
                self.widget.widget_id, handler.name, rule, params)
            param_list = [norm_answer] + param_list
            classifier_output = getattr(Classifier, func_name)(*param_list)

            return_value, unused_return_data = (
                utils.normalize_classifier_return(classifier_output))

            if return_value:
                dest_id = rule.dest
                feedback = (utils.get_random_choice(rule.feedback)
                            if rule.feedback else '')
                break

        return dest_id, feedback, rule, recorded_answer

    def get_typed_object(self, mutable_rule, param):
        param_spec = mutable_rule[
            mutable_rule.find('{{' + param) + 2:]
        param_spec = param_spec[param_spec.find('|') + 1:]
        normalizer_string = param_spec[: param_spec.find('}}')]

        # TODO(sll): This is to support legacy types; try and get rid of it.
        if normalizer_string == 'String':
            normalizer_string = 'NormalizedString'

        return getattr(objects, normalizer_string)

    def get_classifier_info(self, widget_id, handler_name, rule, state_params):
        classifier_func = rule.name.replace(' ', '')
        first_bracket = classifier_func.find('(')
        mutable_rule = InteractiveWidget.get(widget_id).get_readable_name(
            handler_name, rule.name)

        func_name = classifier_func[: first_bracket]
        str_params = classifier_func[first_bracket + 1: -1].split(',')

        param_list = []
        for index, param in enumerate(str_params):
            parsed_param = rule.inputs[param]
            if isinstance(parsed_param, basestring) and '{{' in parsed_param:
                parsed_param = utils.parse_with_jinja(
                    parsed_param, state_params)

            typed_object = self.get_typed_object(mutable_rule, param)
            normalized_param = typed_object.normalize(parsed_param)
            param_list.append(normalized_param)

        return func_name, param_list
