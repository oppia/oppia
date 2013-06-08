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

from apps.base_model.models import BaseModel
from apps.parameter.models import ParamChangeProperty
from apps.widget.models import InteractiveWidget
from apps.widget.models import Widget
from data.objects.models import objects
import feconf
import utils

from google.appengine.ext import ndb


class Content(ndb.Model):
    """Non-interactive content in a state."""
    type = ndb.StringProperty(choices=['text', 'image', 'video', 'widget'])
    # TODO(sll): Generalize this so that the value can be a dict (for a widget).
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
    param_changes = ParamChangeProperty(repeated=True)


class AnswerHandlerInstance(ndb.Model):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    rules = ndb.LocalStructuredProperty(Rule, repeated=True)
    # This is a derived property from the corresponding AnswerHandler in
    # widget.py. It is added automatically on State.put().
    classifier = ndb.StringProperty()


class WidgetInstance(ndb.Model):
    """An instance of a widget."""
    # The id of the interactive widget class for this state.
    widget_id = ndb.StringProperty(default='interactive-Continue')
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
        # Every state should have a parent exploration.
        if not self.key.parent():
            raise Exception('This state does not have a parent exploration.')

        # Every state should have an interactive widget.
        if not self.widget:
            self.widget = self.get_default_widget()
        elif not self.widget.handlers:
            self.widget.handlers = [self.get_default_handler()]

        # TODO(sll): Do other validation.

        # Add the corresponding AnswerHandler classifiers for easy reference.
        widget = InteractiveWidget.get(self.widget.widget_id)
        for curr_handler in self.widget.handlers:
            for w_handler in widget.handlers:
                if w_handler.name == curr_handler.name:
                    curr_handler.classifier = w_handler.classifier

    # Human-readable name for the state.
    name = ndb.StringProperty(default=feconf.DEFAULT_STATE_NAME)
    # The content displayed to the reader in this state.
    content = ndb.StructuredProperty(Content, repeated=True)
    # Parameter changes associated with this state.
    param_changes = ParamChangeProperty(repeated=True)
    # The interactive widget associated with this state. Set to be the default
    # widget if not explicitly specified by the caller.
    widget = ndb.StructuredProperty(WidgetInstance, required=True)
    # A dict whose keys are unresolved answers associated with this state, and
    # whose values are their counts.
    unresolved_answers = ndb.JsonProperty(default={})

    @classmethod
    def create(cls, exploration, name, state_id=None):
        """Creates a new state."""
        state_id = state_id or cls.get_new_id(name)
        new_state = cls(id=state_id, parent=exploration.key, name=name)
        new_state.put()
        return new_state

    @classmethod
    def get(cls, state_id, exploration):
        """Gets a state by id. If it does not exist, returns None."""
        return cls.get_by_id(state_id, parent=exploration.key)

    def as_dict(self):
        """Gets a Python dict representation of the state."""
        state_dict = self.internals_as_dict()
        state_dict.update({'id': self.id, 'name': self.name,
                           'unresolved_answers': self.unresolved_answers})
        return state_dict

    def internals_as_dict(self, human_readable_dests=False):
        """Gets a Python dict of the internals of the state."""
        state_dict = copy.deepcopy(self.to_dict(
            exclude=['unresolved_answers']))
        # Remove the computed 'classifier' property.
        for handler in state_dict['widget']['handlers']:
            del handler['classifier']

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
    def _get_id_from_name(cls, name, exploration):
        """Converts a state name to an id. Handles the END state case."""
        if name == feconf.END_DEST:
            return feconf.END_DEST
        return State.get_by_name(name, exploration).id

    @classmethod
    def modify_using_dict(cls, exploration, state, sdict):
        """Modifies the properties of a state using values from a dict."""
        state.content = [
            Content(type=item['type'], value=item['value'])
            for item in sdict['content']
        ]

        state.param_changes = []
        for pc in sdict['param_changes']:
            instance = exploration.get_param_change_instance(
                pc['name'], pc['obj_type'])
            instance.values = pc['values']
            state.param_changes.append(instance)

        wdict = sdict['widget']
        state.widget = WidgetInstance(
            widget_id=wdict['widget_id'], sticky=wdict['sticky'],
            params=wdict['params'], handlers=[])

        # Augment the list of parameters in state.widget with the default widget
        # params.
        for wp in Widget.get(wdict['widget_id']).params:
            if wp.name not in wdict['params']:
                state.widget.params[wp.name] = wp.value

        for handler in wdict['handlers']:
            handler_rules = [Rule(
                name=rule['name'],
                inputs=rule['inputs'],
                dest=State._get_id_from_name(rule['dest'], exploration),
                feedback=rule['feedback']
            ) for rule in handler['rules']]

            state.widget.handlers.append(AnswerHandlerInstance(
                name=handler['name'], rules=handler_rules))

        state.put()
        return state

    def transition(self, answer, params, handler_name):
        """Handle feedback interactions with readers."""

        recorded_answer = answer
        # TODO(sll): This is a special case for multiple-choice input
        # which should really be handled generically.
        if self.widget.widget_id == 'interactive-MultipleChoiceInput':
            recorded_answer = self.widget.params['choices'][int(answer)]

        handlers = [h for h in self.widget.handlers if h.name == handler_name]
        if not handlers:
            raise Exception('No handlers found for %s' % handler_name)
        handler = handlers[0]

        if handler.classifier is None:
            selected_rule = handler.rules[0]
        else:
            # Import the relevant classifier module.
            classifier_module = '.'.join([
                feconf.SAMPLE_CLASSIFIERS_DIR.replace('/', '.'),
                handler.classifier, handler.classifier])
            Classifier = importlib.import_module(classifier_module)

            norm_answer = Classifier.DEFAULT_NORMALIZER().normalize(answer)
            if norm_answer is None:
                raise Exception('Could not normalize %s.' % answer)

            selected_rule = self.find_first_match(
                handler, Classifier, norm_answer, params)

        feedback = (utils.get_random_choice(selected_rule.feedback)
                    if selected_rule.feedback else '')
        return selected_rule.dest, feedback, selected_rule, recorded_answer

    def find_first_match(self, handler, Classifier, norm_answer, params):
        for ind, rule in enumerate(handler.rules):
            if rule.name == 'Default':
                return rule

            func_name, param_list = self.get_classifier_info(
                self.widget.widget_id, handler.name, rule, params)
            param_list = [norm_answer] + param_list
            classifier_output = getattr(Classifier, func_name)(*param_list)

            match, _ = utils.normalize_classifier_return(classifier_output)

            if match:
                return rule

        raise Exception('No matching rule found for handler %s.' % handler.name)

    def get_typed_object(self, mutable_rule, param):
        param_spec = mutable_rule[mutable_rule.find('{{' + param) + 2:]
        param_spec = param_spec[param_spec.find('|') + 1:]
        normalizer_string = param_spec[: param_spec.find('}}')]
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
