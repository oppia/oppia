# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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
import logging
import re
import string

from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import rule_domain
from core.domain import skins_services
import feconf
import jinja_utils
import utils


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
STATE_PROPERTY_PARAM_CHANGES = 'param_changes'
STATE_PROPERTY_CONTENT = 'content'
STATE_PROPERTY_INTERACTION_ID = 'widget_id'
STATE_PROPERTY_INTERACTION_CUST_ARGS = 'widget_customization_args'
STATE_PROPERTY_INTERACTION_HANDLERS = 'widget_handlers'
# Kept for legacy purposes; not used anymore.
STATE_PROPERTY_INTERACTION_STICKY = 'widget_sticky'


def _is_interaction_terminal(interaction_id):
    """Returns whether the given interaction id marks the end of an
    exploration.
    """
    return interaction_registry.Registry.get_interaction_by_id(
        interaction_id).is_terminal


class ExplorationChange(object):
    """Domain object class for an exploration change.

    IMPORTANT: Ensure that all changes to this class (and how these cmds are
    interpreted in general) preserve backward-compatibility with the
    exploration snapshots in the datastore. Do not modify the definitions of
    cmd keys that already exist.
    """

    STATE_PROPERTIES = (
        STATE_PROPERTY_PARAM_CHANGES,
        STATE_PROPERTY_CONTENT,
        STATE_PROPERTY_INTERACTION_ID,
        STATE_PROPERTY_INTERACTION_CUST_ARGS,
        STATE_PROPERTY_INTERACTION_STICKY,
        STATE_PROPERTY_INTERACTION_HANDLERS)

    EXPLORATION_PROPERTIES = (
        'title', 'category', 'objective', 'language_code', 'skill_tags',
        'blurb', 'author_notes', 'param_specs', 'param_changes',
        'default_skin_id', 'init_state_name')

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


class ExplorationCommitLogEntry(object):
    """Value object representing a commit to an exploration."""

    def __init__(
            self, created_on, last_updated, user_id, username, exploration_id,
            commit_type, commit_message, commit_cmds, version,
            post_commit_status, post_commit_community_owned,
            post_commit_is_private):
        self.created_on = created_on
        self.last_updated = last_updated
        self.user_id = user_id
        self.username = username
        self.exploration_id = exploration_id
        self.commit_type = commit_type
        self.commit_message = commit_message
        self.commit_cmds = commit_cmds
        self.version = version
        self.post_commit_status = post_commit_status
        self.post_commit_community_owned = post_commit_community_owned
        self.post_commit_is_private = post_commit_is_private

    def to_dict(self):
        """This omits created_on, user_id and (for now) commit_cmds."""
        return {
            'last_updated': utils.get_time_in_millisecs(self.last_updated),
            'username': self.username,
            'exploration_id': self.exploration_id,
            'commit_type': self.commit_type,
            'commit_message': self.commit_message,
            'version': self.version,
            'post_commit_status': self.post_commit_status,
            'post_commit_community_owned': self.post_commit_community_owned,
            'post_commit_is_private': self.post_commit_is_private,
        }


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
        # TODO(sll): Validate customization args for rich-text components.
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

        return html_cleaner.clean(jinja_utils.parse_string(self.value, params))


class RuleSpec(object):
    """Value object representing a rule specification."""

    def to_dict(self):
        return {
            'definition': self.definition,
            'dest': self.dest,
            'feedback': self.feedback,
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
        }

    def to_dict_with_obj_type(self):
        dict_with_obj_type = self.to_dict()
        dict_with_obj_type['obj_type'] = self.obj_type
        return dict_with_obj_type

    @classmethod
    def from_dict_and_obj_type(cls, rulespec_dict, obj_type):
        return cls(
            rulespec_dict['definition'],
            rulespec_dict['dest'],
            rulespec_dict['feedback'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in rulespec_dict['param_changes']],
            obj_type,
        )

    def __init__(self, definition, dest, feedback, param_changes, obj_type):
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
        self.obj_type = obj_type

    @property
    def is_default(self):
        """Returns True if this spec corresponds to the default rule."""
        return self.definition['rule_type'] == 'default'

    @property
    def is_generic(self):
        """Returns whether this rule is generic."""
        if self.is_default:
            return True
        return rule_domain.is_generic(self.obj_type, self.definition['name'])

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
    def get_default_rule_spec(cls, state_name, obj_type):
        return RuleSpec({'rule_type': 'default'}, state_name, [], [], obj_type)

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


DEFAULT_RULESPEC_STR = 'Default'


class AnswerHandlerInstance(object):
    """Value object for an answer event stream (submit, click ,drag, etc.)."""

    def to_dict(self):
        return {
            'name': self.name,
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs]
        }

    @classmethod
    def from_dict_and_obj_type(cls, handler_dict, obj_type):
        return cls(
            handler_dict['name'],
            [RuleSpec.from_dict_and_obj_type(rs, obj_type)
             for rs in handler_dict['rule_specs']],
        )

    def __init__(self, name, rule_specs=None):
        if rule_specs is None:
            rule_specs = []

        self.name = name
        self.rule_specs = [RuleSpec(
            rule_spec.definition, rule_spec.dest, rule_spec.feedback,
            rule_spec.param_changes, rule_spec.obj_type
        ) for rule_spec in rule_specs]

    @property
    def default_rule_spec(self):
        """The default rule spec."""
        assert self.rule_specs[-1].is_default
        return self.rule_specs[-1]

    @classmethod
    def get_default_handler(cls, state_name, obj_type):
        return cls('submit', [
            RuleSpec.get_default_rule_spec(state_name, obj_type)])

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


class InteractionInstance(object):
    """Value object for an instance of an interaction."""

    # The default interaction used for a new state.
    _DEFAULT_INTERACTION_ID = None

    def _get_full_customization_args(self):
        """Populates the customization_args dict of the interaction with
        default values, if any of the expected customization_args are missing.
        """
        full_customization_args_dict = copy.deepcopy(self.customization_args)

        interaction = interaction_registry.Registry.get_interaction_by_id(
            self.id)
        for ca_spec in interaction.customization_arg_specs:
            if ca_spec.name not in full_customization_args_dict:
                full_customization_args_dict[ca_spec.name] = {
                    'value': ca_spec.default_value
                }
        return full_customization_args_dict

    def to_dict(self):
        return {
            'id': self.id,
            'customization_args': (
                {} if self.id is None
                else self._get_full_customization_args()),
            'handlers': [handler.to_dict() for handler in self.handlers],
        }

    @classmethod
    def _get_obj_type(cls, interaction_id):
        if interaction_id is None:
            return None
        else:
            return interaction_registry.Registry.get_interaction_by_id(
                interaction_id)._handlers[0]['obj_type']

    @classmethod
    def from_dict(cls, interaction_dict):
        obj_type = cls._get_obj_type(interaction_dict['id'])
        return cls(
            interaction_dict['id'],
            interaction_dict['customization_args'],
            [AnswerHandlerInstance.from_dict_and_obj_type(h, obj_type)
             for h in interaction_dict['handlers']])

    def __init__(
            self, interaction_id, customization_args, handlers):
        self.id = interaction_id
        # Customization args for the interaction's view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        # This is a dict: the keys are names of customization_args and the
        # values are dicts with a single key, 'value', whose corresponding
        # value is the value of the customization arg.
        self.customization_args = customization_args
        # Answer handlers and rule specs.
        self.handlers = [AnswerHandlerInstance(h.name, h.rule_specs)
                         for h in handlers]

    def validate(self):
        if not isinstance(self.id, basestring):
            raise utils.ValidationError(
                'Expected interaction id to be a string, received %s' %
                self.id)
        try:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                self.id)
        except KeyError:
            raise utils.ValidationError('Invalid interaction id: %s' % self.id)

        customization_arg_names = [
            ca_spec.name for ca_spec in interaction.customization_arg_specs]

        if not isinstance(self.customization_args, dict):
            raise utils.ValidationError(
                'Expected customization args to be a dict, received %s'
                % self.customization_args)

        # Validate and clean up the customization args.
        extra_args = []
        for (arg_name, arg_value) in self.customization_args.iteritems():
            if not isinstance(arg_name, basestring):
                raise utils.ValidationError(
                    'Invalid customization arg name: %s' % arg_name)
            if arg_name not in customization_arg_names:
                extra_args.append(arg_name)
                logging.warning(
                    'Interaction %s does not support customization arg %s.'
                    % (self.id, arg_name))
        for extra_arg in extra_args:
            del self.customization_args[extra_arg]

        try:
            interaction.validate_customization_arg_values(
                self.customization_args)
        except Exception:
            # TODO(sll): Raise an exception here if parameters are not
            # involved. (If they are, can we get sample values for the state
            # context parameters?)
            pass

        if not isinstance(self.handlers, list):
            raise utils.ValidationError(
                'Expected answer handlers to be a list, received %s'
                % self.handlers)
        if len(self.handlers) < 1:
            raise utils.ValidationError(
                'At least one answer handler must be specified for each '
                'interaction instance.')
        for handler in self.handlers:
            handler.validate()

    @classmethod
    def create_default_interaction(cls, default_dest_state_name):
        default_obj_type = InteractionInstance._get_obj_type(
            cls._DEFAULT_INTERACTION_ID)
        return cls(
            cls._DEFAULT_INTERACTION_ID,
            {},
            [AnswerHandlerInstance.get_default_handler(
                default_dest_state_name, default_obj_type)]
        )


class State(object):
    """Domain object for a state."""

    NULL_INTERACTION_DICT = {
        'id': None,
        'customization_args': {},
        'handlers': [{
            'name': 'submit',
            'rule_specs': [{
                'dest': feconf.DEFAULT_INIT_STATE_NAME,
                'definition': {
                    'rule_type': 'default',
                },
                'feedback': [],
                'param_changes': [],
            }],
        }],
    }

    def __init__(self, content, param_changes, interaction):
        # The content displayed to the reader in this state.
        self.content = [Content(item.type, item.value) for item in content]
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args)
            for param_change in param_changes]
        # The interaction instance associated with this state.
        self.interaction = InteractionInstance(
            interaction.id, interaction.customization_args,
            interaction.handlers)

    def validate(self, allow_null_interaction):
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

        if not allow_null_interaction:
            if self.interaction.id is None:
                raise utils.ValidationError(
                    'This state does not have any interaction specified.')
            else:
                self.interaction.validate()

    def update_content(self, content_list):
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = [Content.from_dict(content_list[0])]

    def update_param_changes(self, param_change_dicts):
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_change_dicts]

    def update_interaction_id(self, interaction_id):
        self.interaction.id = interaction_id
        # TODO(sll): This should also clear interaction.handlers (except for
        # the default rule). This is somewhat mitigated because the client
        # updates interaction_handlers directly after this, but we should fix
        # it.

    def update_interaction_customization_args(self, customization_args):
        self.interaction.customization_args = customization_args

    def update_interaction_handlers(self, handlers_dict):
        if not isinstance(handlers_dict, dict):
            raise Exception(
                'Expected interaction_handlers to be a dictionary, received %s'
                % handlers_dict)
        ruleset = handlers_dict[feconf.SUBMIT_HANDLER_NAME]
        if not isinstance(ruleset, list):
            raise Exception(
                'Expected interaction_handlers.submit to be a list, '
                'received %s' % ruleset)

        interaction_handlers = [AnswerHandlerInstance('submit', [])]

        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for rule_ind in range(len(ruleset)):
            rule_dict = ruleset[rule_ind]
            rule_dict['feedback'] = [html_cleaner.clean(feedback)
                                     for feedback in rule_dict['feedback']]
            if 'param_changes' not in rule_dict:
                rule_dict['param_changes'] = []
            obj_type = InteractionInstance._get_obj_type(self.interaction.id)
            rule_spec = RuleSpec.from_dict_and_obj_type(rule_dict, obj_type)
            rule_type = rule_spec.definition['rule_type']

            if rule_ind == len(ruleset) - 1:
                if rule_type != rule_domain.DEFAULT_RULE_TYPE:
                    raise ValueError(
                        'Invalid ruleset %s: the last rule should be a '
                        'default rule' % rule_dict)
            else:
                if rule_type == rule_domain.DEFAULT_RULE_TYPE:
                    raise ValueError(
                        'Invalid ruleset %s: rules other than the '
                        'last one should not be default rules.' % rule_dict)

                # TODO(sll): Generalize this to Boolean combinations of rules.
                matched_rule = (
                    interaction_registry.Registry.get_interaction_by_id(
                        self.interaction.id
                    ).get_rule_by_name('submit', rule_spec.definition['name']))

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

            interaction_handlers[0].rule_specs.append(rule_spec)
            self.interaction.handlers = interaction_handlers

    def to_dict(self):
        return {
            'content': [item.to_dict() for item in self.content],
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'interaction': self.interaction.to_dict()
        }

    @classmethod
    def _get_current_state_dict(cls, state_dict):
        """If the state dict still uses 'widget', change it to 'interaction'.

        This corresponds to the v3 --> v4 migration in the YAML representation
        of an exploration.
        """
        if 'widget' in state_dict:
            # This is an old version of the state dict which still uses
            # 'widget'.
            state_dict['interaction'] = copy.deepcopy(state_dict['widget'])
            state_dict['interaction']['id'] = copy.deepcopy(
                state_dict['interaction']['widget_id'])
            del state_dict['interaction']['widget_id']
            del state_dict['widget']

        return copy.deepcopy(state_dict)

    @classmethod
    def from_dict(cls, state_dict):
        current_state_dict = cls._get_current_state_dict(state_dict)

        return cls(
            [Content.from_dict(item)
             for item in current_state_dict['content']],
            [param_domain.ParamChange.from_dict(param)
             for param in current_state_dict['param_changes']],
            InteractionInstance.from_dict(current_state_dict['interaction']))

    @classmethod
    def create_default_state(
            cls, default_dest_state_name, is_initial_state=False):
        text_str = (
            feconf.DEFAULT_INIT_STATE_CONTENT_STR if is_initial_state else '')
        return cls(
            [Content('text', text_str)], [],
            InteractionInstance.create_default_interaction(
                default_dest_state_name))


class Exploration(object):
    """Domain object for an Oppia exploration."""

    def __init__(self, exploration_id, title, category, objective,
                 language_code, skill_tags, blurb, author_notes, default_skin,
                 init_state_name, states_dict, param_specs_dict,
                 param_changes_list, version, created_on=None,
                 last_updated=None):
        self.id = exploration_id
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.skill_tags = skill_tags
        self.blurb = blurb
        self.author_notes = author_notes
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
        self.created_on = created_on
        self.last_updated = last_updated

    def is_equal_to(self, other):
        simple_props = [
            'id', 'title', 'category', 'objective', 'language_code',
            'skill_tags', 'blurb', 'author_notes', 'default_skin',
            'init_state_name', 'version']

        for prop in simple_props:
            if getattr(self, prop) != getattr(other, prop):
                return False

        for (state_name, state_obj) in self.states.iteritems():
            if state_name not in other.states:
                return False
            if state_obj.to_dict() != other.states[state_name].to_dict():
                return False

        for (ps_name, ps_obj) in self.param_specs.iteritems():
            if ps_name not in other.param_specs:
                return False
            if ps_obj.to_dict() != other.param_specs[ps_name].to_dict():
                return False

        for i in xrange(len(self.param_changes)):
            if (self.param_changes[i].to_dict() !=
                    other.param_changes[i].to_dict()):
                return False

        return True

    @classmethod
    def create_default_exploration(
            cls, exploration_id, title, category, objective='',
            language_code=feconf.DEFAULT_LANGUAGE_CODE):
        init_state_dict = State.create_default_state(
            feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()

        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: init_state_dict
        }

        return cls(
            exploration_id, title, category, objective, language_code, [], '',
            '', 'conversation_v1', feconf.DEFAULT_INIT_STATE_NAME, states_dict,
            {}, [], 0)

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

    def validate(self, strict=False, allow_null_interaction=False):
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

        if not isinstance(self.objective, basestring):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not any([self.language_code == lc['code']
                    for lc in feconf.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.skill_tags, list):
            raise utils.ValidationError(
                'Expected skill_tags to be a list, received %s' %
                self.skill_tags)
        for tag in self.skill_tags:
            if not isinstance(tag, basestring):
                raise utils.ValidationError(
                    'Expected each tag in skill_tags to be a string, received '
                    '%s' % tag)

        if not isinstance(self.blurb, basestring):
            raise utils.ValidationError(
                'Expected blurb to be a string, received %s' % self.blurb)

        if not isinstance(self.author_notes, basestring):
            raise utils.ValidationError(
                'Expected author_notes to be a string, received %s' %
                self.author_notes)

        if not self.default_skin:
            raise utils.ValidationError(
                'Expected a default_skin to be specified.')
        if not isinstance(self.default_skin, basestring):
            raise utils.ValidationError(
                'Expected default_skin to be a string, received %s (%s).'
                % self.default_skin, type(self.default_skin))
        if not self.default_skin in skins_services.Registry.get_all_skin_ids():
            raise utils.ValidationError(
                'Unrecognized skin id: %s' % self.default_skin)

        if not isinstance(self.states, dict):
            raise utils.ValidationError(
                'Expected states to be a dict, received %s' % self.states)
        if not self.states:
            raise utils.ValidationError('This exploration has no states.')
        for state_name in self.states:
            self._require_valid_state_name(state_name)
            self.states[state_name].validate(
                allow_null_interaction=allow_null_interaction)

        if not self.init_state_name:
            raise utils.ValidationError(
                'This exploration has no initial state name specified.')
        if self.init_state_name not in self.states:
            raise utils.ValidationError(
                'There is no state in %s corresponding to the exploration\'s '
                'initial state name %s.' %
                (self.states.keys(), self.init_state_name))

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
                    'No parameter named \'%s\' exists in this exploration'
                    % param_change.name)
            if param_change.name in feconf.INVALID_PARAMETER_NAMES:
                raise utils.ValidationError(
                    'The exploration-level parameter with name \'%s\' is '
                    'reserved. Please choose a different name.'
                    % param_change.name)

        # TODO(sll): Find a way to verify the param change customization args
        # when they depend on exploration/state parameters (e.g. the generated
        # values must have the correct obj_type). Can we get sample values for
        # the reader's answer and these parameters by looking at states that
        # link to this one?

        # Check that all state param changes are valid.
        for state_name, state in self.states.iteritems():
            for param_change in state.param_changes:
                param_change.validate()
                if param_change.name not in self.param_specs:
                    raise utils.ValidationError(
                        'The parameter with name \'%s\' was set in state '
                        '\'%s\', but it does not exist in the list of '
                        'parameter specifications for this exploration.'
                        % (param_change.name, state_name))
                if param_change.name in feconf.INVALID_PARAMETER_NAMES:
                    raise utils.ValidationError(
                        'The parameter name \'%s\' is reserved. Please choose '
                        'a different name for the parameter being set in '
                        'state \'%s\'.' % (param_change.name, state_name))

        # Check that all rule definitions, destinations and param changes are
        # valid.
        all_state_names = self.states.keys() + [feconf.END_DEST]
        for state in self.states.values():
            for handler in state.interaction.handlers:
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
                self._verify_all_states_reachable()
            except utils.ValidationError as e:
                warnings_list.append(unicode(e))

            try:
                self._verify_no_dead_ends()
            except utils.ValidationError as e:
                warnings_list.append(unicode(e))

            if not self.objective:
                warnings_list.append(
                    'An objective must be specified (in the \'Settings\' tab).'
                )

            if not self.language_code:
                warnings_list.append(
                    'A language must be specified (in the \'Settings\' tab).')

            if len(warnings_list) > 0:
                warning_str = ''
                for ind, warning in enumerate(warnings_list):
                    warning_str += '%s. %s ' % (ind + 1, warning)
                raise utils.ValidationError(
                    'Please fix the following issues before saving this '
                    'exploration: %s' % warning_str)

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

            if not _is_interaction_terminal(curr_state.interaction.id):
                for handler in curr_state.interaction.handlers:
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
        """Verifies that all states can reach a terminal state."""
        # This queue stores state names.
        processed_queue = []
        curr_queue = [feconf.END_DEST]

        for (state_name, state) in self.states.iteritems():
            if _is_interaction_terminal(state.interaction.id):
                curr_queue.append(state_name)

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
                    for handler in state.interaction.handlers:
                        for rule_spec in handler.rule_specs:
                            if rule_spec.dest == curr_state_name:
                                curr_queue.append(state_name)
                                break

        if len(self.states) != len(processed_queue):
            dead_end_states = list(
                set(self.states.keys()) - set(processed_queue))
            raise utils.ValidationError(
                'It is impossible to complete the exploration from the '
                'following states: %s' % ', '.join(dead_end_states))

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

    def update_objective(self, objective):
        self.objective = objective

    def update_language_code(self, language_code):
        self.language_code = language_code

    def update_skill_tags(self, skill_tags):
        self.skill_tags = skill_tags

    def update_blurb(self, blurb):
        self.blurb = blurb

    def update_author_notes(self, author_notes):
        self.author_notes = author_notes

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

    def update_default_skin_id(self, default_skin_id):
        self.default_skin = default_skin_id

    def update_init_state_name(self, init_state_name):
        if init_state_name not in self.states:
            raise Exception(
                'Invalid new initial state name: %s; '
                'it is not in the list of states %s for this '
                'exploration.' % (init_state_name, self.states.keys()))
        self.init_state_name = init_state_name

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

        self.states[new_state_name] = copy.deepcopy(
            self.states[old_state_name])
        del self.states[old_state_name]

        if self.init_state_name == old_state_name:
            self.update_init_state_name(new_state_name)

        # Find all destinations in the exploration which equal the renamed
        # state, and change the name appropriately.
        for other_state_name in self.states:
            other_state = self.states[other_state_name]
            for handler in other_state.interaction.handlers:
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
            for handler in other_state.interaction.handlers:
                for rule in handler.rule_specs:
                    if rule.dest == state_name:
                        rule.dest = other_state_name

        del self.states[state_name]

    # The current version of the exploration schema. If any backward-
    # incompatible changes are made to the exploration schema in the YAML
    # definitions, this version number must be changed and a migration process
    # put in place.
    CURRENT_EXPLORATION_SCHEMA_VERSION = 4

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
    def _convert_v2_dict_to_v3_dict(cls, exploration_dict):
        """Converts a v2 exploration dict into a v3 exploration dict."""
        exploration_dict['schema_version'] = 3

        exploration_dict['objective'] = ''
        exploration_dict['language_code'] = feconf.DEFAULT_LANGUAGE_CODE
        exploration_dict['skill_tags'] = []
        exploration_dict['blurb'] = ''
        exploration_dict['author_notes'] = ''

        return exploration_dict

    @classmethod
    def _convert_v3_dict_to_v4_dict(cls, exploration_dict):
        """Converts a v3 exploration dict into a v4 exploration dict."""
        exploration_dict['schema_version'] = 4

        for _, state_defn in exploration_dict['states'].iteritems():
            state_defn['interaction'] = copy.deepcopy(state_defn['widget'])
            state_defn['interaction']['id'] = copy.deepcopy(
                state_defn['interaction']['widget_id'])
            del state_defn['interaction']['widget_id']
            del state_defn['interaction']['sticky']
            del state_defn['widget']

        return exploration_dict

    @classmethod
    def from_yaml(cls, exploration_id, title, category, yaml_content):
        """Creates and returns exploration from a YAML text string."""
        try:
            exploration_dict = utils.dict_from_yaml(yaml_content)
        except Exception as e:
            raise Exception(
                'Please ensure that you are uploading a YAML text file, not '
                'a zip file. The YAML parser returned the following error: %s'
                % e)

        exploration_schema_version = exploration_dict.get('schema_version')
        if exploration_schema_version is None:
            raise Exception('Invalid YAML file: no schema version specified.')
        if not (1 <= exploration_schema_version
                <= cls.CURRENT_EXPLORATION_SCHEMA_VERSION):
            raise Exception(
                'Sorry, we can only process v1, v2, v3 and v4 YAML files at '
                'present.')
        if exploration_schema_version == 1:
            exploration_dict = cls._convert_v1_dict_to_v2_dict(
                exploration_dict)
            exploration_schema_version = 2

        if exploration_schema_version == 2:
            exploration_dict = cls._convert_v2_dict_to_v3_dict(
                exploration_dict)
            exploration_schema_version = 3

        if exploration_schema_version == 3:
            exploration_dict = cls._convert_v3_dict_to_v4_dict(
                exploration_dict)
            exploration_schema_version = 4

        exploration = cls.create_default_exploration(
            exploration_id, title, category,
            objective=exploration_dict['objective'],
            language_code=exploration_dict['language_code'])
        exploration.skill_tags = exploration_dict['skill_tags']
        exploration.blurb = exploration_dict['blurb']
        exploration.author_notes = exploration_dict['author_notes']

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

            idict = sdict['interaction']
            interaction_handlers = [
                AnswerHandlerInstance.from_dict_and_obj_type({
                    'name': handler['name'],
                    'rule_specs': [{
                        'definition': rule_spec['definition'],
                        'dest': rule_spec['dest'],
                        'feedback': [html_cleaner.clean(feedback)
                                     for feedback in rule_spec['feedback']],
                        'param_changes': rule_spec.get('param_changes', []),
                    } for rule_spec in handler['rule_specs']],
                }, InteractionInstance._get_obj_type(idict['id']))
                for handler in idict['handlers']]

            state.interaction = InteractionInstance(
                idict['id'], idict['customization_args'],
                interaction_handlers)

            exploration.states[state_name] = state

        exploration.default_skin = exploration_dict['default_skin']
        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]

        return exploration

    def to_yaml(self):
        return utils.yaml_from_dict({
            'author_notes': self.author_notes,
            'blurb': self.blurb,
            'default_skin': self.default_skin,
            'init_state_name': self.init_state_name,
            'language_code': self.language_code,
            'objective': self.objective,
            'param_changes': self.param_change_dicts,
            'param_specs': self.param_specs_dict,
            'skill_tags': self.skill_tags,
            'states': {state_name: state.to_dict()
                       for (state_name, state) in self.states.iteritems()},
            'schema_version': self.CURRENT_EXPLORATION_SCHEMA_VERSION
        })

    def to_player_dict(self):
        """Returns a copy of the exploration suitable for inclusion in the
        learner view."""
        return {
            'init_state_name': self.init_state_name,
            'param_changes': self.param_change_dicts,
            'param_specs': self.param_specs_dict,
            'states': {
                state_name: state.to_dict()
                for (state_name, state) in self.states.iteritems()
            },
            'title': self.title,
        }

    def get_interaction_ids(self):
        """Get all interaction ids used in this exploration."""
        return list(set([
            state.interaction.id for state in self.states.values()]))


class ExplorationSummary(object):
    """Domain object for an Oppia exploration summary."""

    def __init__(self, exploration_id, title, category, objective,
                 language_code, skill_tags, ratings, status,
                 community_owned, owner_ids, editor_ids,
                 viewer_ids, version, exploration_model_created_on,
                 exploration_model_last_updated):
        """'ratings' is a dict whose keys are '1', '2', '3', '4', '5' and whose
        values are nonnegative integers representing frequency counts. Note
        that the keys need to be strings in order for this dict to be
        JSON-serializable.
        """

        self.id = exploration_id
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.skill_tags = skill_tags
        self.ratings = ratings
        self.status = status
        self.community_owned = community_owned
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.version = version
        self.exploration_model_created_on = exploration_model_created_on
        self.exploration_model_last_updated = exploration_model_last_updated
