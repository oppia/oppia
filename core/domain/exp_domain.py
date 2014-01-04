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
import string

from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import param_domain
from core.domain import rule_domain
from core.domain import widget_registry
import feconf
import jinja_utils
import utils


class ExplorationChange(object):
    """Domain object class for an exploration change.

    IMPORTANT: Ensure that all changes to this class (and how these cmds are
    interpreted in general) preserve backward-compatibility with the
    exploration snapshots in the datastore. Do not modify the definitions of
    cmd keys that already exist.
    """

    STATE_PROPERTIES = (
        'param_changes', 'content', 'widget_id',
        'widget_customization_args', 'widget_sticky', 'widget_handlers')

    EXPLORATION_PROPERTIES = (
        'title', 'category', 'param_specs', 'param_changes')

    def __init__(self, change_dict):
        """Initializes an ExplorationChange object from a dict.

        change_dict represents a command. It should have a 'cmd' key, and one
        or more other keys. The keys depend on what the value for 'cmd' is.

        The possible values for 'cmd' are listed below, together with the other
        keys in the dict:
        - 'add_state' (with state_name)
        - 'rename_state' (with old_state_name and new_state_name)
        - 'delete_state' (with state_name)
        - 'edit_state_property' (with state_name, property_name, new_value and,
            optionally, old_value)
        - 'edit_exploration_property' (with property_name, new_value and,
            optionally, old_value)

        For a state, property_name must be one of STATE_PROPERTIES. For an
        exploration, property_name must be one of EXPLORATION_PROPERTIES.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == 'add_state':
            self.state_name = change_dict['state_name']
        elif self.cmd == 'rename_state':
            self.old_state_name = change_dict['old_state_name']
            self.new_state_name = change_dict['new_state_name']
        elif self.cmd == 'delete_state':
            self.state_name = change_dict['state_name']
        elif self.cmd == 'edit_state_property':
            if change_dict['property_name'] not in self.STATE_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.state_name = change_dict['state_name']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        elif self.cmd == 'edit_exploration_property':
            if (change_dict['property_name'] not in
                    self.EXPLORATION_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)


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

    def to_html(self, params):
        """Exports this content object to an HTML string.

        The content object is parameterized using the parameters in `params`.
        """
        if not isinstance(params, dict):
            raise Exception(
                'Expected context params for parsing content to be a dict, '
                'received %s' % params)

        return '<div>%s</div>' % jinja_utils.parse_string(self.value, params)


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

    def __init__(self, exploration_id, title, category, default_skin,
                 init_state_name, states_dict, param_specs_dict,
                 param_changes_list, version):
        self.id = exploration_id
        self.title = title
        self.category = category
        self.default_skin = default_skin
        self.init_state_name = init_state_name

        self.states = {}
        for (state_name, state_dict) in states_dict.iteritems():
            self.states[state_name] = State.from_dict(state_dict)

        self.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in param_specs_dict.iteritems()
        }
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_changes_list]

        self.version = version

    @classmethod
    def create_default_exploration(cls, exploration_id, title, category):
        init_state_dict = State.create_default_state(
            feconf.DEFAULT_STATE_NAME).to_dict()
        states_dict = {
            feconf.DEFAULT_STATE_NAME: init_state_dict
        }

        return cls(
            exploration_id, title, category, 'conversation_v1',
            feconf.DEFAULT_STATE_NAME, states_dict, {}, [], 0)

    @classmethod
    def _require_valid_name(cls, name, name_type):
        """Generic name validation.

        Args:
          name: the name to validate.
          name_type: a human-readable string, like 'the exploration title' or
            'a state name'. This will be shown in error messages.
        """
        # This check is needed because state names are used in URLs and as ids
        # for statistics, so the name length should be bounded above.
        if len(name) > 50 or len(name) < 1:
            raise utils.ValidationError(
                'The length of %s should be between 1 and 50 '
                'characters; received %s' % (name_type, name))

        if name[0] in string.whitespace or name[-1] in string.whitespace:
            raise utils.ValidationError(
                'Names should not start or end with whitespace.')

        if re.search('\s\s+', name):
            raise utils.ValidationError(
                'Adjacent whitespace in %s should be collapsed.' % name_type)

        for c in feconf.INVALID_NAME_CHARS:
            if c in name:
                raise utils.ValidationError(
                    'Invalid character %s in %s: %s' % (c, name_type, name))

    @classmethod
    def _require_valid_state_name(cls, name):
        cls._require_valid_name(name, 'a state name')

        if name.lower() == feconf.END_DEST.lower():
            raise utils.ValidationError(
                'Invalid state name: %s' % feconf.END_DEST)

    def validate(self, strict=False):
        """Validates the exploration before it is committed to storage.

        If strict is True, performs advanced validation.
        """
        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        self._require_valid_name(self.title, 'the exploration title')

        if not isinstance(self.category, basestring):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        self._require_valid_name(self.category, 'the exploration category')

        if not isinstance(self.default_skin, basestring):
            raise utils.ValidationError(
                'Expected default_skin to be a string, received %s (%s).'
                % self.default_skin, type(self.default_skin))
        # TODO(sll): Check that the skin name corresponds to a valid skin.
        if not self.default_skin:
            raise utils.ValidationError(
                'Expected a default_skin to be specified.')

        if not isinstance(self.states, dict):
            raise utils.ValidationError(
                'Expected states to be a dict, received %s' % self.states)
        if not self.states:
            raise utils.ValidationError('This exploration has no states.')
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

        if strict:
            warnings_list = []
            try:
                self._verify_no_self_loops()
            except utils.ValidationError as e:
                warnings_list.append(unicode(e))

            try:
                self._verify_all_states_reachable()
            except utils.ValidationError as e:
                warnings_list.append(unicode(e))

            try:
                self._verify_no_dead_ends()
            except utils.ValidationError as e:
                warnings_list.append(unicode(e))

            if len(warnings_list) > 0:
                warning_str = ''
                for ind, warning in enumerate(warnings_list):
                    warning_str += '%s. %s ' % (ind + 1, warning)
                raise utils.ValidationError(
                    'Please fix the following issues before saving this '
                    'exploration: %s' % warning_str)

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

    @classmethod
    def is_demo_exploration_id(cls, exploration_id):
        """Whether the exploration id is that of a demo exploration."""
        return exploration_id.isdigit() and (
            0 <= int(exploration_id) < len(feconf.DEMO_EXPLORATIONS))

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations."""
        return self.is_demo_exploration_id(self.id)

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

    # Methods relating to parameters.
    def get_obj_type_for_param(self, param_name):
        """Returns the obj_type for the given parameter."""
        try:
            return self.param_specs[param_name].obj_type
        except:
            raise Exception('Exploration %s has no parameter named %s' %
                            (self.title, param_name))

    def _get_updated_param_dict(self, param_dict, param_changes):
        """Updates a param dict using the given list of param_changes.

        Note that the list of parameter changes is ordered. Parameter
        changes later in the list may depend on parameter changes that have
        been set earlier in the same list.
        """
        new_param_dict = copy.deepcopy(param_dict)
        for pc in param_changes:
            obj_type = self.get_obj_type_for_param(pc.name)
            new_param_dict[pc.name] = pc.get_normalized_value(
                obj_type, new_param_dict)
        return new_param_dict

    def get_init_params(self):
        """Returns an initial set of exploration parameters for a reader."""
        return self._get_updated_param_dict({}, self.param_changes)

    def update_with_state_params(self, state_name, param_dict):
        """Updates a reader's params using the params for the given state.

        Args:
          - state_name: str. The name of the state.
          - param_dict: dict. A dict containing parameter names and their
              values. This dict represents the current context which is to
              be updated.

        Returns:
          dict. An updated param dict after the changes in the state's
            param_changes list have been applied in sequence.
        """
        state = self.states[state_name]
        return self._get_updated_param_dict(param_dict, state.param_changes)

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

    def export_state_to_frontend_dict(self, state_name):
        """Gets a state dict with rule descriptions."""
        state_dict = self.states[state_name].to_dict()

        for handler in state_dict['widget']['handlers']:
            for rule_spec in handler['rule_specs']:

                widget = widget_registry.Registry.get_widget_by_id(
                    feconf.INTERACTIVE_PREFIX,
                    state_dict['widget']['widget_id']
                )

                input_type = widget.get_handler_by_name(
                    handler['name']).input_type

                rule_spec['description'] = rule_domain.get_rule_description(
                    rule_spec['definition'], self.param_specs, input_type
                )

        return state_dict

    def classify(self, state_name, handler_name, answer, params):
        """Return the first rule that is satisfied by a reader's answer."""
        state = self.states[state_name]

        # Get the widget to determine the input type.
        generic_handler = widget_registry.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, state.widget.widget_id
        ).get_handler_by_name(handler_name)

        handler = next(
            h for h in state.widget.handlers if h.name == handler_name)
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.id))

        if generic_handler.input_type is None:
            return handler.rule_specs[0]
        else:
            for rule_spec in handler.rule_specs:
                if rule_domain.evaluate_rule(
                        rule_spec.definition, self.param_specs,
                        generic_handler.input_type, params, answer, fs):
                    return rule_spec

            raise Exception(
                'No matching rule found for handler %s.' % handler.name)

    # The current version of the exploration schema. If any backward-
    # incompatible changes are made to the exploration schema in the YAML
    # definitions, this version number must be changed and a migration process
    # put in place.
    CURRENT_EXPLORATION_SCHEMA_VERSION = 2

    @classmethod
    def _convert_v1_dict_to_v2_dict(cls, exploration_dict):
        """Converts a v1 exploration dict into a v2 exploration dict."""
        exploration_dict['schema_version'] = 2
        exploration_dict['init_state_name'] = (
            exploration_dict['states'][0]['name'])

        states_dict = {}
        for state in exploration_dict['states']:
            states_dict[state['name']] = state
            del states_dict[state['name']]['name']
        exploration_dict['states'] = states_dict

        return exploration_dict

    @classmethod
    def from_yaml(cls, exploration_id, title, category, yaml_content):
        """Creates and returns exploration from a YAML text string."""
        exploration_dict = utils.dict_from_yaml(yaml_content)

        exploration_schema_version = exploration_dict.get('schema_version')
        if not (1 <= exploration_schema_version
                <= cls.CURRENT_EXPLORATION_SCHEMA_VERSION):
            raise Exception(
                'Sorry, we can only process v1 and v2 YAML files at present.')
        if exploration_schema_version == 1:
            exploration_dict = cls._convert_v1_dict_to_v2_dict(
                exploration_dict)

        exploration = cls.create_default_exploration(
            exploration_id, title, category)
        exploration.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val) for
            (ps_name, ps_val) in exploration_dict['param_specs'].iteritems()
        }

        init_state_name = exploration_dict['init_state_name']
        exploration.rename_state(exploration.init_state_name, init_state_name)
        exploration.add_states([
            state_name for state_name in exploration_dict['states']
            if state_name != init_state_name])

        for (state_name, sdict) in exploration_dict['states'].iteritems():
            state = exploration.states[state_name]

            state.content = [
                Content(item['type'], html_cleaner.clean(item['value']))
                for item in sdict['content']
            ]

            state.param_changes = [param_domain.ParamChange(
                pc['name'], pc['generator_id'], pc['customization_args']
            ) for pc in sdict['param_changes']]

            for pc in state.param_changes:
                if pc.name not in exploration.param_specs:
                    raise Exception('Parameter %s was used in a state but not '
                                    'declared in the exploration param_specs.'
                                    % pc.name)

            wdict = sdict['widget']
            widget_handlers = [AnswerHandlerInstance.from_dict({
                'name': handler['name'],
                'rule_specs': [{
                    'definition': rule_spec['definition'],
                    'dest': rule_spec['dest'],
                    'feedback': [html_cleaner.clean(feedback)
                                 for feedback in rule_spec['feedback']],
                    'param_changes': rule_spec.get('param_changes', []),
                } for rule_spec in handler['rule_specs']],
            }) for handler in wdict['handlers']]

            state.widget = WidgetInstance(
                wdict['widget_id'], wdict['customization_args'],
                widget_handlers, wdict['sticky'])

            exploration.states[state_name] = state

        exploration.default_skin = exploration_dict['default_skin']
        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]

        return exploration

    def to_yaml(self):
        return utils.yaml_from_dict({
            'default_skin': self.default_skin,
            'init_state_name': self.init_state_name,
            'param_changes': self.param_change_dicts,
            'param_specs': self.param_specs_dict,
            'states': {state_name: state.to_dict()
                       for (state_name, state) in self.states.iteritems()},
            'schema_version': self.CURRENT_EXPLORATION_SCHEMA_VERSION
        })
