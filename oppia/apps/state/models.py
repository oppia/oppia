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


import feconf
import oppia.apps.base_model.models as base_models
import oppia.apps.parameter.models as param_models
from oppia.domain import rule_domain
from oppia.domain import widget_domain
import utils

from google.appengine.ext import ndb


class Content(base_models.BaseModel):
    """Non-interactive content in a state."""
    type = ndb.StringProperty(choices=['text', 'image', 'video', 'widget'])
    # TODO(sll): Generalize this so the value can be a dict (for a widget).
    value = ndb.TextProperty(default='')


class RuleSpec(base_models.BaseModel):
    """A rule."""
    # TODO(sll): Ensure the types for param_changes are consistent.

    # The name of the rule class.
    name = ndb.StringProperty(required=True)
    # Parameters for the classification rule.
    # TODO(sll): Make these the actual params.
    inputs = ndb.JsonProperty(default={})
    # The id of the destination state.
    dest = ndb.StringProperty(required=True)
    # Feedback to give the reader if this rule is triggered.
    feedback = ndb.TextProperty(repeated=True)
    # Exploration-level parameter changes to make if this rule is triggered.
    param_changes = param_models.ParamChangeProperty(repeated=True)

    def get_feedback_string(self):
        """Returns a (possibly empty) string with feedback for this rule."""
        return utils.get_random_choice(self.feedback) if self.feedback else ''

    def __str__(self):
        """Returns a string representation of a rule (for the stats log)."""
        param_list = [
            utils.to_ascii(self.inputs[key]) for key in self.inputs]
        return '%s(%s)' % (self.name, ','.join(param_list))


DEFAULT_RULE_SPEC_REPR = str(RuleSpec(name='Default'))


class AnswerHandlerInstance(base_models.BaseModel):
    """An answer event stream (submit, click, drag, etc.)."""
    name = ndb.StringProperty(default='submit')
    rule_specs = ndb.LocalStructuredProperty(RuleSpec, repeated=True)


class WidgetInstance(base_models.BaseModel):
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
    # Answer handlers and rule specs.
    handlers = ndb.LocalStructuredProperty(AnswerHandlerInstance, repeated=True)


class State(base_models.IdModel):
    """A state which forms part of an exploration."""

    def get_default_rule_spec(self):
        return RuleSpec(name='Default', dest=self.id)

    def get_default_handler(self):
        return AnswerHandlerInstance(rule_specs=[self.get_default_rule_spec()])

    def get_default_widget(self):
        return WidgetInstance(handlers=[self.get_default_handler()])

    def _pre_put_hook(self):
        """Ensures that the widget and at least one handler for it exists."""
        # Every state should have an interactive widget.
        if not self.widget:
            self.widget = self.get_default_widget()
        elif not self.widget.handlers:
            self.widget.handlers = [self.get_default_handler()]

        # TODO(sll): Do other validation.

    # Human-readable name for the state.
    name = ndb.StringProperty(default=feconf.DEFAULT_STATE_NAME)
    # The content displayed to the reader in this state.
    content = ndb.StructuredProperty(Content, repeated=True)
    # Parameter changes associated with this state.
    param_changes = param_models.ParamChangeProperty(repeated=True)
    # The interactive widget associated with this state. Set to be the default
    # widget if not explicitly specified by the caller.
    widget = ndb.StructuredProperty(WidgetInstance, required=True)

    @classmethod
    def get_by_name(cls, name, exploration, strict=True):
        """Gets a state by name. Fails noisily if strict == True."""
        assert name and exploration

        # TODO(sll): This is too slow; improve it.
        state = None
        for state_id in exploration.state_ids:
            candidate_state = State.get(state_id)
            if candidate_state.name == name:
                state = candidate_state
                break

        if strict and not state:
            raise Exception('State %s not found.' % name)
        return state

    @classmethod
    def _get_id_from_name(cls, name, exploration):
        """Converts a state name to an id. Handles the END state case."""
        if name == feconf.END_DEST:
            return feconf.END_DEST
        return State.get_by_name(name, exploration).id

    def classify(self, handler_name, answer, params):
        """Classify a reader's answer and return the rule it satisfies."""
        # Get the widget to determine the input type.
        generic_handler = widget_domain.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, self.widget.widget_id
        ).get_handler_by_name(handler_name)
        all_rule_classes = generic_handler.rules

        handlers = [h for h in self.widget.handlers if h.name == handler_name]
        if not handlers:
            raise Exception('No handlers found for %s' % handler_name)
        handler = handlers[0]

        if generic_handler.input_type is None:
            selected_rule = handler.rule_specs[0]
        else:
            selected_rule = self.find_first_match(
                handler, all_rule_classes, answer, params)

        return selected_rule

    def find_first_match(self, handler, all_rule_classes, answer, params):
        for ind, rule in enumerate(handler.rule_specs):
            if rule.name == 'Default':
                return rule

            # Find the relevant rule in all_rule_classes, instantiate it,
            # and evaluate it.
            for r in all_rule_classes:
                if r.__name__ == rule.name:
                    param_list = self.get_param_list(
                        self.widget.widget_id, handler.name, rule, params)
                    match = r(*param_list).eval(answer)
                    if match:
                        return rule

        raise Exception(
            'No matching rule found for handler %s.' % handler.name)

    def get_param_list(self, widget_id, handler_name, rule, state_params):
        # TODO(sll): In the frontend, use the rule descriptions as the single
        # source of truth for the params.

        # Get the readable rule description.
        rule_description = widget_domain.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, widget_id
        ).get_rule_description(handler_name, rule.name)

        param_defns = rule_domain.get_param_list(rule_description)

        param_list = []
        for (param_name, obj_cls) in param_defns:
            parsed_param = rule.inputs[param_name]
            if isinstance(parsed_param, basestring) and '{{' in parsed_param:
                parsed_param = utils.parse_with_jinja(
                    parsed_param, state_params)

            normalized_param = obj_cls.normalize(parsed_param)
            param_list.append(normalized_param)

        return param_list
