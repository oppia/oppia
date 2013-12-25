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

"""Domain objects for an exploration, its states, and their constituents.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used."""

__author__ = 'Sean Lip'

import copy
import re

from core.domain import html_cleaner
from core.domain import param_domain
from core.domain import rule_domain
from core.domain import widget_registry
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration
])
import feconf
import utils


class Content(object):
    """Value object representing non-interactive content."""

    def to_dict(self):
        return {'type': self.type, 'value': self.value}

    @classmethod
    def from_dict(cls, content_dict):
        return cls(content_dict['type'], content_dict['value'])

    def __init__(self, content_type, value=''):
        self.type = content_type
        self.value = value
        self.validate()

    def validate(self):
        # TODO(sll): Add HTML sanitization checking.
        if not self.type == 'text':
            raise utils.ValidationError('Invalid content type: %s' % self.type)
        if not isinstance(self.value, basestring):
            raise utils.ValidationError(
                'Invalid content value: %s' % self.value)


class RuleSpec(object):
    """Value object representing a rule specification."""

    def to_dict(self):
        return {
            'definition': self.definition,
            'dest': self.dest,
            'feedback': self.feedback,
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes]
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        return cls(
            rulespec_dict['definition'],
            rulespec_dict['dest'],
            rulespec_dict['feedback'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in rulespec_dict['param_changes']],
        )

    def __init__(self, definition, dest, feedback, param_changes):
        # A dict specifying the rule definition. E.g.
        #
        #   {'rule_type': 'default'}
        #
        # or
        #
        #   {
        #     'rule_type': 'atomic',
        #     'name': 'LessThan',
        #     'subject': 'answer',
        #     'inputs': {'x': 5}}
        #   }
        #
        self.definition = definition
        # Id of the destination state.
        # TODO(sll): Check that this state is END_DEST or actually exists.
        self.dest = dest
        # Feedback to give the reader if this rule is triggered.
        self.feedback = feedback or []
        # Exploration-level parameter changes to make if this rule is
        # triggered.
        self.param_changes = param_changes or []

    @property
    def is_default(self):
        """Returns True if this spec corresponds to the default rule."""
        return self.definition['rule_type'] == 'default'

    def get_feedback_string(self):
        """Returns a (possibly empty) string with feedback for this rule."""
        return utils.get_random_choice(self.feedback) if self.feedback else ''

    def __str__(self):
        """Returns a string representation of a rule (for the stats log)."""
        if self.definition['rule_type'] == rule_domain.DEFAULT_RULE_TYPE:
            return 'Default'
        else:
            # TODO(sll): Treat non-atomic rules too.
            param_list = [utils.to_ascii(val) for
                          (key, val) in self.definition['inputs'].iteritems()]
            return '%s(%s)' % (self.definition['name'], ','.join(param_list))

    @classmethod
    def get_default_rule_spec(cls, state_name):
        return RuleSpec({'rule_type': 'default'}, state_name, [], [])

    def validate(self):
        if not isinstance(self.definition, dict):
            raise utils.ValidationError(
                'Expected rulespec definition to be a dict, received %s'
                % self.definition)

        if not isinstance(self.dest, basestring):
            raise utils.ValidationError(
                'Expected rulespec dest to be a string, received %s'
                % self.dest)
        if not self.dest:
            raise utils.ValidationError(
                'Every rulespec should have a destination.')

        if not isinstance(self.feedback, list):
            raise utils.ValidationError(
                'Expected rulespec feedback to be a list, received %s'
                % self.feedback)
        for feedback_item in self.feedback:
            if not isinstance(feedback_item, basestring):
                raise utils.ValidationError(
                    'Expected rulespec feedback item to be a string, received '
                    '%s' % feedback_item)

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected rulespec param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

    @classmethod
    def validate_rule_definition(cls, rule_definition, exp_param_specs):
        ATOMIC_RULE_DEFINITION_SCHEMA = [
            ('inputs', dict), ('name', basestring), ('rule_type', basestring),
            ('subject', basestring)]
        COMPOSITE_RULE_DEFINITION_SCHEMA = [
            ('children', list), ('rule_type', basestring)]
        DEFAULT_RULE_DEFINITION_SCHEMA = [('rule_type', basestring)]
        ALLOWED_COMPOSITE_RULE_TYPES = [
            rule_domain.AND_RULE_TYPE, rule_domain.OR_RULE_TYPE,
            rule_domain.NOT_RULE_TYPE]

        if 'rule_type' not in rule_definition:
            raise utils.ValidationError(
                'Rule definition %s contains no rule type.' % rule_definition)

        rule_type = rule_definition['rule_type']

        if rule_type == rule_domain.DEFAULT_RULE_TYPE:
            utils.verify_dict_keys_and_types(
                rule_definition, DEFAULT_RULE_DEFINITION_SCHEMA)
        elif rule_type == rule_domain.ATOMIC_RULE_TYPE:
            utils.verify_dict_keys_and_types(
                rule_definition, ATOMIC_RULE_DEFINITION_SCHEMA)

            if (rule_definition['subject'] not in exp_param_specs
                    and rule_definition['subject'] != 'answer'):
                raise utils.ValidationError(
                    'Unrecognized rule subject: %s' %
                    rule_definition['subject'])
        else:
            if rule_type not in ALLOWED_COMPOSITE_RULE_TYPES:
                raise utils.ValidationError(
                    'Unsupported rule type %s.' % rule_type)

            utils.verify_dict_keys_and_types(
                rule_definition, COMPOSITE_RULE_DEFINITION_SCHEMA)
            for child_rule in rule_definition['children']:
                cls.validate_rule_definition(child_rule, exp_param_specs)


DEFAULT_RULESPEC = RuleSpec.get_default_rule_spec(feconf.END_DEST)
DEFAULT_RULESPEC_STR = str(DEFAULT_RULESPEC)


class AnswerHandlerInstance(object):
    """Value object for an answer event stream (submit, click ,drag, etc.)."""

    def to_dict(self):
        return {
            'name': self.name,
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs]
        }

    @classmethod
    def from_dict(cls, handler_dict):
        return cls(
            handler_dict['name'],
            [RuleSpec.from_dict(rs) for rs in handler_dict['rule_specs']],
        )

    def __init__(self, name, rule_specs=None):
        if rule_specs is None:
            rule_specs = []

        self.name = name
        self.rule_specs = [RuleSpec(
            rule_spec.definition, rule_spec.dest, rule_spec.feedback,
            rule_spec.param_changes
        ) for rule_spec in rule_specs]

    @property
    def default_rule_spec(self):
        """The default rule spec."""
        assert self.rule_specs[-1].is_default
        return self.rule_specs[-1]

    @classmethod
    def get_default_handler(cls, state_name):
        return cls('submit', [RuleSpec.get_default_rule_spec(state_name)])

    def validate(self):
        if self.name != 'submit':
            raise utils.ValidationError(
                'Unexpected answer handler name: %s' % self.name)

        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer handler rule specs to be a list, received %s'
                % self.rule_specs)
        if len(self.rule_specs) < 1:
            raise utils.ValidationError(
                'There must be at least one rule spec for each answer handler.'
                % self.rule_specs)
        for rule_spec in self.rule_specs:
            rule_spec.validate()


class WidgetInstance(object):
    """Value object for a widget instance."""

    def to_dict(self):
        return {
            'widget_id': self.widget_id,
            'customization_args': self.customization_args,
            'handlers': [handler.to_dict() for handler in self.handlers],
            'sticky': self.sticky
        }

    @classmethod
    def from_dict(cls, widget_dict):
        return cls(
            widget_dict['widget_id'],
            widget_dict['customization_args'],
            [AnswerHandlerInstance.from_dict(h)
             for h in widget_dict['handlers']],
            widget_dict['sticky'],
        )

    def __init__(self, widget_id, customization_args, handlers, sticky=False):
        self.widget_id = widget_id
        # Customization args for the interactive widget view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        self.customization_args = customization_args
        # Answer handlers and rule specs.
        self.handlers = [AnswerHandlerInstance(h.name, h.rule_specs)
                         for h in handlers]
        # If true, keep the widget instance from the previous state if both are
        # of the same type.
        self.sticky = sticky

    def validate(self):
        if not isinstance(self.widget_id, basestring):
            raise utils.ValidationError(
                'Expected widget id to be a string, received %s'
                % self.widget_id)
        try:
            widget = widget_registry.Registry.get_widget_by_id(
                feconf.INTERACTIVE_PREFIX, self.widget_id)
        except KeyError:
            raise utils.ValidationError(
                'Invalid widget name: %s' % self.widget_id)

        widget_customization_arg_names = [wp.name for wp in widget.params]

        if not isinstance(self.customization_args, dict):
            raise utils.ValidationError(
                'Expected widget customization args to be a dict, received %s'
                % self.customization_args)
        for (arg_name, arg_value) in self.customization_args.iteritems():
            if not isinstance(arg_name, basestring):
                raise utils.ValidationError(
                    'Invalid widget customization arg name: %s' % arg_name)
            if arg_name not in widget_customization_arg_names:
                raise Exception(
                    'Parameter %s for widget %s is invalid.'
                    % (arg_name, self.widget_id))
            # TODO(sll): Find a way to verify that the arg_values have the
            # correct type. Can we get sample values for the state context
            # parameters?

        # TODO(sll): Shouldn't this be a dict?
        if not isinstance(self.handlers, list):
            raise utils.ValidationError(
                'Expected widget answer handlers to be a list, received %s'
                % self.handlers)
        if len(self.handlers) < 1:
            raise utils.ValidationError(
                'At least one answer handler must be specified for each '
                'state widget instance.')
        for handler in self.handlers:
            handler.validate()

        if not isinstance(self.sticky, bool):
            raise utils.ValidationError(
                'Expected widget sticky flag to be a boolean, received %s'
                % self.sticky)

    @classmethod
    def create_default_widget(cls, default_dest_state_name):
        return cls(
            feconf.DEFAULT_WIDGET_ID,
            {},
            [AnswerHandlerInstance.get_default_handler(
                default_dest_state_name)]
        )


class State(object):
    """Domain object for a state."""

    def __init__(self, content, param_changes, widget):
        # The content displayed to the reader in this state.
        self.content = [Content(item.type, item.value) for item in content]
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args)
            for param_change in param_changes]
        # The interactive widget instance associated with this state.
        self.widget = WidgetInstance(
            widget.widget_id, widget.customization_args, widget.handlers,
            widget.sticky)

    def validate(self):
        if not isinstance(self.content, list):
            raise utils.ValidationError(
                'Expected state content to be a list, received %s'
                % self.content)
        if len(self.content) != 1:
            raise utils.ValidationError(
                'The state content list must have exactly one element. '
                'Received %s' % self.content)
        self.content[0].validate()

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected state param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

        self.widget.validate()

    def update_content(self, content_list):
        # TODO(sll): Must sanitize all content in noninteractive widget attrs.
        self.content = [Content.from_dict(content_list[0])]

    def update_param_changes(self, param_change_dicts):
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_change_dicts]

    def update_widget_id(self, widget_id):
        self.widget.widget_id = widget_id
        # TODO(sll): This should also clear widget.handlers (except for the
        # default rule).

    def update_widget_customization_args(self, widget_customization_args):
        self.widget.customization_args = widget_customization_args

    def update_widget_sticky(self, widget_sticky):
        self.widget.sticky = widget_sticky

    def update_widget_handlers(self, widget_handlers_dict):
        if not isinstance(widget_handlers_dict, dict):
            raise Exception(
                'Expected widget_handlers to be a dictionary, received %s'
                % widget_handlers_dict)
        ruleset = widget_handlers_dict['submit']
        if not isinstance(ruleset, list):
            raise Exception(
                'Expected widget_handlers[submit] to be a list, received %s'
                % ruleset)

        widget_handlers = [AnswerHandlerInstance('submit', [])]
        generic_widget = widget_registry.Registry.get_widget_by_id(
            'interactive', self.widget.widget_id)

        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for rule_ind in range(len(ruleset)):
            rule_dict = ruleset[rule_ind]
            rule_dict['feedback'] = [html_cleaner.clean(feedback)
                                     for feedback in rule_dict['feedback']]
            if 'param_changes' not in rule_dict:
                rule_dict['param_changes'] = []
            rule_spec = RuleSpec.from_dict(rule_dict)
            rule_type = rule_spec.definition['rule_type']

            if rule_ind == len(ruleset) - 1:
                if rule_type != rule_domain.DEFAULT_RULE_TYPE:
                    raise ValueError(
                        'Invalid ruleset: the last rule should be a default '
                        'rule')
            else:
                if rule_type == rule_domain.DEFAULT_RULE_TYPE:
                    raise ValueError(
                        'Invalid ruleset: rules other than the '
                        'last one should not be default rules.')

                # TODO(sll): Generalize this to Boolean combinations of rules.
                matched_rule = generic_widget.get_rule_by_name(
                    'submit', rule_spec.definition['name'])

                # Normalize and store the rule params.
                # TODO(sll): Generalize this to Boolean combinations of rules.
                rule_inputs = rule_spec.definition['inputs']
                if not isinstance(rule_inputs, dict):
                    raise Exception(
                        'Expected rule_inputs to be a dict, received %s'
                        % rule_inputs)
                for param_name, value in rule_inputs.iteritems():
                    param_type = rule_domain.get_obj_type_for_param_name(
                        matched_rule, param_name)

                    if (isinstance(value, basestring) and
                            '{{' in value and '}}' in value):
                        # TODO(jacobdavis11): Create checks that all parameters
                        # referred to exist and have the correct types
                        normalized_param = value
                    else:
                        try:
                            normalized_param = param_type.normalize(value)
                        except TypeError:
                            raise Exception(
                                '%s has the wrong type. It should be a %s.' %
                                (value, param_type.__name__))
                    rule_inputs[param_name] = normalized_param

            widget_handlers[0].rule_specs.append(rule_spec)
            self.widget.handlers = widget_handlers

    def to_dict(self):
        return {
            'content': [item.to_dict() for item in self.content],
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'widget': self.widget.to_dict()
        }

    @classmethod
    def from_dict(cls, state_dict):
        widget = WidgetInstance.from_dict(state_dict['widget'])

        return cls(
            [Content.from_dict(item) for item in state_dict['content']],
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            widget
        )

    @classmethod
    def create_default_state(cls, default_dest_state_name):
        return cls(
            [Content('text', '')], [],
            WidgetInstance.create_default_widget(default_dest_state_name))


class Exploration(object):
    """Domain object for an Oppia exploration."""

    def __init__(self, exploration_model):
        # TODO(sll): Change this to take in parameters, rather than the whole
        # model.
        self.id = exploration_model.id
        self.category = exploration_model.category
        self.title = exploration_model.title
        self.default_skin = exploration_model.default_skin

        self.init_state_name = exploration_model.init_state_name
        self.states = {}
        for (state_name, state_dict) in exploration_model.states.iteritems():
            self.states[state_name] = State.from_dict(state_dict)

        self.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in exploration_model.param_specs.iteritems()
        }
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in exploration_model.param_changes]

        self.version = exploration_model.version

    @classmethod
    def _require_valid_state_name(cls, name):
        # This check is needed because state names are used in URLs and as ids
        # for statistics, so the name length should be bounded above.
        if len(name) > 50 or len(name) < 1:
            raise utils.ValidationError(
                'State name should have a length of at most 50 characters.')

        for c in feconf.INVALID_NAME_CHARS:
            if c in name:
                raise utils.ValidationError(
                    'Invalid character %s in state name %s' % (c, name))

        if name == feconf.END_DEST:
            raise utils.ValidationError(
                'Invalid state name: %s' % feconf.END_DEST)

    def validate(self, strict=False):
        """Validates the exploration before it is committed to storage.

        If strict is True, performs advanced checks and returns a list of
        warnings.
        """
        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        if not self.title:
            raise utils.ValidationError('This exploration has no title.')
        for c in feconf.INVALID_NAME_CHARS:
            if c in self.title:
                raise utils.ValidationError(
                    'Invalid character %s in exploration title %s'
                    % (c, self.title))

        if not isinstance(self.category, basestring):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        if not self.category:
            raise utils.ValidationError('This exploration has no category.')
        for c in feconf.INVALID_NAME_CHARS:
            if c in self.category:
                raise utils.ValidationError(
                    'Invalid character %s in exploration category %s'
                    % (c, self.category))

        if not isinstance(self.default_skin, basestring):
            raise utils.ValidationError(
                'Expected default_skin to be a string, received %s (%s).'
                % self.default_skin, type(self.default_skin))
        # TODO(sll): Check that the skin name corresponds to a valid skin.
        if not self.default_skin:
            raise utils.ValidationError(
                'Expected a default_skin to be specified.')

        if not self.states:
            raise utils.ValidationError('This exploration has no states.')

        if not isinstance(self.states, dict):
            raise utils.ValidationError(
                'Expected states to be a dict, received %s' % self.states)

        for state_name in self.states:
            self._require_valid_state_name(state_name)
            self.states[state_name].validate()

        if not self.init_state_name:
            raise utils.ValidationError(
                'This exploration has no initial state name specified.')
        if self.init_state_name not in self.states:
            raise utils.ValidationError(
                'There is no state corresponding to the exploration\'s '
                'initial state name.')

        if not isinstance(self.param_specs, dict):
            raise utils.ValidationError(
                'Expected param_specs to be a dict, received %s'
                % self.param_specs)

        for param_name in self.param_specs:
            if not isinstance(param_name, basestring):
                raise utils.ValidationError(
                    'Expected parameter name to be a string, received %s (%s).'
                    % param_name, type(param_name))
            if not re.match(feconf.ALPHANUMERIC_REGEX, param_name):
                raise utils.ValidationError(
                    'Only parameter names with characters in [a-zA-Z0-9] are '
                    'accepted.')
            self.param_specs[param_name].validate()

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()
            if param_change.name not in self.param_specs:
                raise utils.ValidationError(
                    'No parameter named %s exists in this exploration'
                    % param_change.name)

        # TODO(sll): Find a way to verify the param change customization args
        # when they depend on exploration/state parameters (e.g. the generated
        # values must have the correct obj_type). Can we get sample values for
        # the reader's answer and these parameters by looking at states that
        # link to this one?

        # Check that all state param changes are valid.
        for state in self.states.values():
            for param_change in state.param_changes:
                param_change.validate()
                if param_change.name not in self.param_specs:
                    raise utils.ValidationError(
                        'The parameter %s was used in a state, but it does '
                        'not exist in this exploration.' % param_change.name)

        # Check that all rule definitions, destinations and param changes are
        # valid.
        all_state_names = self.states.keys() + [feconf.END_DEST]
        for state in self.states.values():
            for handler in state.widget.handlers:
                for rule_spec in handler.rule_specs:
                    RuleSpec.validate_rule_definition(
                        rule_spec.definition, self.param_specs)

                    if rule_spec.dest not in all_state_names:
                        raise utils.ValidationError(
                            'The destination %s is not a valid state.'
                            % rule_spec.dest)

                    for param_change in rule_spec.param_changes:
                        if param_change.name not in self.param_specs:
                            raise utils.ValidationError(
                                'The parameter %s was used in a rule, but it '
                                'does not exist in this exploration'
                                % param_change.name)

        warnings = []
        if strict:
            try:
                self._verify_no_self_loops()
            except utils.ValidationError as e:
                warnings.append(e)

            try:
                self._verify_all_states_reachable()
            except utils.ValidationError as e:
                warnings.append(e)

            try:
                self._verify_no_dead_ends()
            except utils.ValidationError as e:
                warnings.append(e)

        return warnings

    def _verify_no_self_loops(self):
        """Verify that there are no self-loops."""
        for (state_name, state) in self.states.iteritems():
            for handler in state.widget.handlers:
                for rule in handler.rule_specs:
                    # Check that there are no feedback-less self-loops.
                    # NB: Sometimes it makes sense for a self-loop to not have
                    # feedback, such as unreachable rules in a ruleset for
                    # multiple-choice questions. This should be handled in the
                    # frontend so that a valid dict with feedback for every
                    # self-loop is always saved to the backend.
                    if (rule.dest == state_name and not rule.feedback
                            and not state.widget.sticky):
                        raise utils.ValidationError(
                            'State "%s" has a self-loop with no feedback. '
                            'This is likely to frustrate the reader.' %
                            state_name)

    def _verify_all_states_reachable(self):
        """Verifies that all states are reachable from the initial state."""
        # This queue stores state names.
        processed_queue = []
        curr_queue = [self.init_state_name]

        while curr_queue:
            curr_state_name = curr_queue[0]
            curr_queue = curr_queue[1:]

            if curr_state_name in processed_queue:
                continue

            processed_queue.append(curr_state_name)

            curr_state = self.states[curr_state_name]

            for handler in curr_state.widget.handlers:
                for rule in handler.rule_specs:
                    dest_state = rule.dest
                    if (dest_state not in curr_queue and
                            dest_state not in processed_queue and
                            dest_state != feconf.END_DEST):
                        curr_queue.append(dest_state)

        if len(self.states) != len(processed_queue):
            unseen_states = list(
                set(self.states.keys()) - set(processed_queue))
            raise utils.ValidationError(
                'The following states are not reachable from the initial '
                'state: %s' % ', '.join(unseen_states))

    def _verify_no_dead_ends(self):
        """Verifies that the END state is reachable from all states."""
        # This queue stores state names.
        processed_queue = []
        curr_queue = [feconf.END_DEST]

        while curr_queue:
            curr_state_name = curr_queue[0]
            curr_queue = curr_queue[1:]

            if curr_state_name in processed_queue:
                continue

            if curr_state_name != feconf.END_DEST:
                processed_queue.append(curr_state_name)

            for (state_name, state) in self.states.iteritems():
                if (state_name not in curr_queue
                        and state_name not in processed_queue):
                    for handler in state.widget.handlers:
                        for rule_spec in handler.rule_specs:
                            if rule_spec.dest == curr_state_name:
                                curr_queue.append(state_name)
                                break

        if len(self.states) != len(processed_queue):
            dead_end_states = list(
                set(self.states.keys()) - set(processed_queue))
            raise utils.ValidationError(
                'The END state is not reachable from the following states: %s'
                % ', '.join(dead_end_states))

    # Derived attributes of an exploration,
    @property
    def init_state(self):
        """The state which forms the start of this exploration."""
        return self.states[self.init_state_name]

    @property
    def param_specs_dict(self):
        """A dict of param specs, each represented as Python dicts."""
        return {ps_name: ps_val.to_dict()
                for (ps_name, ps_val) in self.param_specs.iteritems()}

    @property
    def param_change_dicts(self):
        """A list of param changes, represented as JSONifiable Python dicts."""
        return [param_change.to_dict() for param_change in self.param_changes]

    def get_obj_type_for_param(self, param_name):
        """Returns the obj_type for the given parameter."""
        try:
            return self.param_specs[param_name].obj_type
        except:
            raise Exception('Exploration %s has no parameter named %s' %
                            (self.title, param_name))

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations."""
        return self.id.isdigit() and (
            0 <= int(self.id) < len(feconf.DEMO_EXPLORATIONS))

    def update_title(self, title):
        self.title = title

    def update_category(self, category):
        self.category = category

    def update_param_specs(self, param_specs_dict):
        self.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in param_specs_dict.iteritems()
        }

    def update_param_changes(self, param_changes_list):
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change)
            for param_change in param_changes_list
        ]

    # Methods relating to states.
    def add_states(self, state_names):
        """Adds multiple states to the exploration."""
        for state_name in state_names:
            if state_name in self.states:
                raise ValueError('Duplicate state name %s' % state_name)

        for state_name in state_names:
            self.states[state_name] = State.create_default_state(state_name)

    def rename_state(self, old_state_name, new_state_name):
        """Renames the given state."""
        if old_state_name not in self.states:
            raise ValueError('State %s does not exist' % old_state_name)
        if (old_state_name != new_state_name and
                new_state_name in self.states):
            raise ValueError('Duplicate state name: %s' % new_state_name)

        if old_state_name == new_state_name:
            return

        self._require_valid_state_name(new_state_name)

        if self.init_state_name == old_state_name:
            self.init_state_name = new_state_name

        self.states[new_state_name] = copy.deepcopy(
            self.states[old_state_name])
        del self.states[old_state_name]

        # Find all destinations in the exploration which equal the renamed
        # state, and change the name appropriately.
        for other_state_name in self.states:
            other_state = self.states[other_state_name]
            for handler in other_state.widget.handlers:
                for rule in handler.rule_specs:
                    if rule.dest == old_state_name:
                        rule.dest = new_state_name

    def delete_state(self, state_name):
        """Deletes the given state."""
        if state_name not in self.states:
            raise ValueError('State %s does not exist' % state_name)

        # Do not allow deletion of initial states.
        if self.init_state_name == state_name:
            raise ValueError('Cannot delete initial state of an exploration.')

        # Find all destinations in the exploration which equal the deleted
        # state, and change them to loop back to their containing state.
        for other_state_name in self.states:
            other_state = self.states[other_state_name]
            for handler in other_state.widget.handlers:
                for rule in handler.rule_specs:
                    if rule.dest == state_name:
                        rule.dest = other_state_name

        del self.states[state_name]
