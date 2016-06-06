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
should therefore be independent of the specific storage models used.
"""

import collections
import copy
import logging
import re
import string

from core.domain import html_cleaner
from core.domain import gadget_registry
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import rule_domain
from core.domain import trigger_registry
import feconf
import jinja_utils
import schema_utils
import utils


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
# TODO(bhenning): Prior to July 2015, exploration changes involving rules were
# logged using the key 'widget_handlers'. These need to be migrated to
# 'answer_groups' and 'default_outcome'.
STATE_PROPERTY_PARAM_CHANGES = 'param_changes'
STATE_PROPERTY_CONTENT = 'content'
STATE_PROPERTY_INTERACTION_ID = 'widget_id'
STATE_PROPERTY_INTERACTION_CUST_ARGS = 'widget_customization_args'
STATE_PROPERTY_INTERACTION_ANSWER_GROUPS = 'answer_groups'
STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME = 'default_outcome'
STATE_PROPERTY_UNCLASSIFIED_ANSWERS = (
    'confirmed_unclassified_answers')
STATE_PROPERTY_INTERACTION_FALLBACKS = 'fallbacks'
# These two properties are kept for legacy purposes and are not used anymore.
STATE_PROPERTY_INTERACTION_HANDLERS = 'widget_handlers'
STATE_PROPERTY_INTERACTION_STICKY = 'widget_sticky'

GADGET_PROPERTY_VISIBILITY = 'gadget_visibility'
GADGET_PROPERTY_CUST_ARGS = 'gadget_customization_args'

# This takes an additional 'state_name' parameter.
CMD_ADD_STATE = 'add_state'
# This takes additional 'old_state_name' and 'new_state_name' parameters.
CMD_RENAME_STATE = 'rename_state'
# This takes an additional 'state_name' parameter.
CMD_DELETE_STATE = 'delete_state'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_STATE_PROPERTY = 'edit_state_property'
# This takes an additional 'gadget_name' parameter.
CMD_ADD_GADGET = 'add_gadget'
# This takes additional 'old_gadget_name' and 'new_gadget_name' parameters.
CMD_RENAME_GADGET = 'rename_gadget'
# This takes an additional 'gadget_name' parameter.
CMD_DELETE_GADGET = 'delete_gadget'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_GADGET_PROPERTY = 'edit_gadget_property'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION = (
    'migrate_states_schema_to_latest_version')

# This represents the stringified version of a 'default rule.' This is to be
# used as an identifier for the default rule when storing which rule an answer
# was matched against.
DEFAULT_RULESPEC_STR = 'Default'


def _get_full_customization_args(customization_args, ca_specs):
    """Populates the given customization_args dict with default values
    if any of the expected customization_args are missing.
    """
    for ca_spec in ca_specs:
        if ca_spec.name not in customization_args:
            customization_args[ca_spec.name] = {
                'value': ca_spec.default_value
            }
    return customization_args


def _validate_customization_args_and_values(
        item_name, item_type, customization_args,
        ca_specs_to_validate_against):
    """Validates the given `customization_args` dict against the specs set out
    in `ca_specs_to_validate_against`.

    The item_name is either 'interaction', 'gadget' or 'trigger', and the
    item_type is the id/type of the interaction/gadget/trigger, respectively.
    These strings are used to populate any error messages that arise during
    validation.

    Note that this may modify the given customization_args dict, if it has
    extra or missing keys.
    """
    ca_spec_names = [
        ca_spec.name for ca_spec in ca_specs_to_validate_against]

    if not isinstance(customization_args, dict):
        raise utils.ValidationError(
            'Expected customization args to be a dict, received %s'
            % customization_args)

    # Validate and clean up the customization args.

    # Populate missing keys with the default values.
    customization_args = _get_full_customization_args(
        customization_args, ca_specs_to_validate_against)

    # Remove extra keys.
    extra_args = []
    for arg_name in customization_args.keys():
        if not isinstance(arg_name, basestring):
            raise utils.ValidationError(
                'Invalid customization arg name: %s' % arg_name)
        if arg_name not in ca_spec_names:
            extra_args.append(arg_name)
            logging.warning(
                '%s %s does not support customization arg %s.'
                % (item_name.capitalize(), item_type, arg_name))
    for extra_arg in extra_args:
        del customization_args[extra_arg]

    # Check that each value has the correct type.
    for ca_spec in ca_specs_to_validate_against:
        try:
            schema_utils.normalize_against_schema(
                customization_args[ca_spec.name]['value'],
                ca_spec.schema)
        except Exception:
            # TODO(sll): Raise an actual exception here if parameters are not
            # involved. (If they are, can we get sample values for the state
            # context parameters?)
            pass


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
        STATE_PROPERTY_INTERACTION_HANDLERS,
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
        STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
        STATE_PROPERTY_INTERACTION_FALLBACKS,
        STATE_PROPERTY_UNCLASSIFIED_ANSWERS)

    GADGET_PROPERTIES = (
        GADGET_PROPERTY_VISIBILITY,
        GADGET_PROPERTY_CUST_ARGS)

    EXPLORATION_PROPERTIES = (
        'title', 'category', 'objective', 'language_code', 'tags',
        'blurb', 'author_notes', 'param_specs', 'param_changes',
        'init_state_name')

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
        - 'add_gadget' (with gadget_dict and panel)
        - 'rename_gadget' (with old_gadget_name and new_gadget_name)
        - 'delete_gadget' (with gadget_name)
        - 'edit_gadget_property' (with gadget_name, property_name, new_value,
            and optionally, old_value)
        - 'edit_exploration_property' (with property_name, new_value and,
            optionally, old_value)
        - 'migrate_states_schema' (with from_version and to_version)

        For a state, property_name must be one of STATE_PROPERTIES. For an
        exploration, property_name must be one of EXPLORATION_PROPERTIES.
        For a gadget, property_name must be one of GADGET_PROPERTIES.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_ADD_STATE:
            self.state_name = change_dict['state_name']
        elif self.cmd == CMD_RENAME_STATE:
            self.old_state_name = change_dict['old_state_name']
            self.new_state_name = change_dict['new_state_name']
        elif self.cmd == CMD_DELETE_STATE:
            self.state_name = change_dict['state_name']
        elif self.cmd == CMD_EDIT_STATE_PROPERTY:
            if change_dict['property_name'] not in self.STATE_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.state_name = change_dict['state_name']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        elif self.cmd == CMD_EDIT_EXPLORATION_PROPERTY:
            if (change_dict['property_name'] not in
                    self.EXPLORATION_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        elif self.cmd == CMD_ADD_GADGET:
            self.gadget_dict = change_dict['gadget_dict']
            self.gadget_name = change_dict['gadget_dict']['gadget_name']
            self.panel = change_dict['panel']
        elif self.cmd == CMD_RENAME_GADGET:
            self.old_gadget_name = change_dict['old_gadget_name']
            self.new_gadget_name = change_dict['new_gadget_name']
        elif self.cmd == CMD_DELETE_GADGET:
            self.gadget_name = change_dict['gadget_name']
        elif self.cmd == CMD_EDIT_GADGET_PROPERTY:
            if change_dict['property_name'] not in self.GADGET_PROPERTIES:
                raise Exception('Invalid gadget change_dict: %s' % change_dict)
            self.gadget_name = change_dict['gadget_name']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        elif self.cmd == CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION:
            self.from_version = change_dict['from_version']
            self.to_version = change_dict['to_version']
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
        self.value = html_cleaner.clean(value)
        self.validate()

    def validate(self):
        # TODO(sll): Add HTML sanitization checking.
        # TODO(sll): Validate customization args for rich-text components.
        if self.type != 'text':
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
            'rule_type': self.rule_type,
            'inputs': self.inputs,
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        return cls(
            rulespec_dict['rule_type'],
            rulespec_dict['inputs']
        )

    def __init__(self, rule_type, inputs):
        self.rule_type = rule_type
        self.inputs = inputs

    def stringify_classified_rule(self):
        """Returns a string representation of a rule (for the stats log)."""
        if self.rule_type == rule_domain.FUZZY_RULE_TYPE:
            return self.rule_type
        else:
            param_list = [
                utils.to_ascii(val) for val in self.inputs.values()]
            return '%s(%s)' % (self.rule_type, ','.join(param_list))

    def validate(self, rule_params_list, exp_param_specs_dict):
        """Validates a RuleSpec value object. It ensures the inputs dict does
        not refer to any non-existent parameters and that it contains values
        for all the parameters the rule expects.

        Args:
            rule_params_list: A list of parameters used by the rule represented
                by this RuleSpec instance, to be used to validate the inputs of
                this RuleSpec. Each element of the list represents a single
                parameter and is a tuple with two elements:
                    0: The name (string) of the parameter.
                    1: The typed object instance for that paramter (e.g. Real).
            exp_param_specs_dict: A dict of specified parameters used in this
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type). RuleSpec
                inputs may have a parameter value which refers to one of these
                exploration parameters.
        """
        if not isinstance(self.inputs, dict):
            raise utils.ValidationError(
                'Expected inputs to be a dict, received %s' % self.inputs)
        input_key_set = set(self.inputs.keys())
        param_names_set = set([rp[0] for rp in rule_params_list])
        leftover_input_keys = input_key_set - param_names_set
        leftover_param_names = param_names_set - input_key_set

        # Check if there are input keys which are not rule parameters.
        if leftover_input_keys:
            logging.warning(
                'RuleSpec \'%s\' has inputs which are not recognized '
                'parameter names: %s' % (self.rule_type, leftover_input_keys))

        # Check if there are missing parameters.
        if leftover_param_names:
            raise utils.ValidationError(
                'RuleSpec \'%s\' is missing inputs: %s'
                % (self.rule_type, leftover_param_names))

        rule_params_dict = {rp[0]: rp[1] for rp in rule_params_list}
        for (param_name, param_value) in self.inputs.iteritems():
            param_obj = rule_params_dict[param_name]
            # Validate the parameter type given the value.
            if isinstance(param_value, basestring) and '{{' in param_value:
                # Value refers to a parameter spec. Cross-validate the type of
                # the parameter spec with the rule parameter.
                start_brace_index = param_value.index('{{') + 2
                end_brace_index = param_value.index('}}')
                param_spec_name = param_value[
                    start_brace_index:end_brace_index]
                if param_spec_name not in exp_param_specs_dict:
                    raise utils.ValidationError(
                        'RuleSpec \'%s\' has an input with name \'%s\' which '
                        'refers to an unknown parameter within the '
                        'exploration: %s' % (
                            self.rule_type, param_name, param_spec_name))
                # TODO(bhenning): The obj_type of the param_spec
                # (exp_param_specs_dict[param_spec_name]) should be validated
                # to be the same as param_obj.__name__ to ensure the rule spec
                # can accept the type of the parameter.
            else:
                # Otherwise, a simple parameter value needs to be normalizable
                # by the parameter object in order to be valid.
                param_obj.normalize(param_value)


class Outcome(object):
    """Value object representing an outcome of an interaction. An outcome
    consists of a destination state, feedback to show the user, and any
    parameter changes.
    """
    def to_dict(self):
        return {
            'dest': self.dest,
            'feedback': self.feedback,
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
        }

    @classmethod
    def from_dict(cls, outcome_dict):
        return cls(
            outcome_dict['dest'],
            outcome_dict['feedback'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in outcome_dict['param_changes']],
        )

    def __init__(self, dest, feedback, param_changes):
        # Id of the destination state.
        # TODO(sll): Check that this state actually exists.
        self.dest = dest
        # Feedback to give the reader if this rule is triggered.
        self.feedback = feedback or []
        self.feedback = [
            html_cleaner.clean(feedback_item)
            for feedback_item in self.feedback]
        # Exploration-level parameter changes to make if this rule is
        # triggered.
        self.param_changes = param_changes or []

    def validate(self):
        if not self.dest:
            raise utils.ValidationError(
                'Every outcome should have a destination.')
        if not isinstance(self.dest, basestring):
            raise utils.ValidationError(
                'Expected outcome dest to be a string, received %s'
                % self.dest)

        if not isinstance(self.feedback, list):
            raise utils.ValidationError(
                'Expected outcome feedback to be a list, received %s'
                % self.feedback)
        for feedback_item in self.feedback:
            if not isinstance(feedback_item, basestring):
                raise utils.ValidationError(
                    'Expected outcome feedback item to be a string, received '
                    '%s' % feedback_item)

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected outcome param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()


class AnswerGroup(object):
    """Value object for an answer group. Answer groups represent a set of rules
    dictating whether a shared feedback should be shared with the user. These
    rules are ORed together. Answer groups may also support fuzzy/implicit
    rules that involve soft matching of answers to a set of training data
    and/or example answers dictated by the creator.
    """
    def to_dict(self):
        return {
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs],
            'outcome': self.outcome.to_dict(),
        }

    @classmethod
    def from_dict(cls, answer_group_dict):
        return cls(
            Outcome.from_dict(answer_group_dict['outcome']),
            [RuleSpec.from_dict(rs) for rs in answer_group_dict['rule_specs']],
        )

    def __init__(self, outcome, rule_specs):
        self.rule_specs = [RuleSpec(
            rule_spec.rule_type, rule_spec.inputs
        ) for rule_spec in rule_specs]

        self.outcome = outcome

    def validate(self, obj_type, exp_param_specs_dict):
        """Rule validation.

        Verifies that all rule classes are valid, and that the AnswerGroup only
        has one fuzzy rule.
        """
        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer group rules to be a list, received %s'
                % self.rule_specs)
        if len(self.rule_specs) < 1:
            raise utils.ValidationError(
                'There must be at least one rule for each answer group.'
                % self.rule_specs)

        all_rule_classes = rule_domain.get_rules_for_obj_type(obj_type)
        seen_fuzzy_rule = False
        for rule_spec in self.rule_specs:
            rule_class = None
            try:
                rule_class = next(
                    r for r in all_rule_classes
                    if r.__name__ == rule_spec.rule_type)
            except StopIteration:
                raise utils.ValidationError(
                    'Unrecognized rule type: %s' % rule_spec.rule_type)
            if rule_class.__name__ == rule_domain.FUZZY_RULE_TYPE:
                if seen_fuzzy_rule:
                    raise utils.ValidationError(
                        'AnswerGroups can only have one fuzzy rule.')
                seen_fuzzy_rule = True

            rule_spec.validate(
                rule_domain.get_param_list(rule_class.description),
                exp_param_specs_dict)

        self.outcome.validate()

    def get_fuzzy_rule_index(self):
        """Will return the answer group's fuzzy rule index, or None if it
        doesn't exist.
        """
        for (rule_spec_index, rule_spec) in enumerate(self.rule_specs):
            if rule_spec.rule_type == rule_domain.FUZZY_RULE_TYPE:
                return rule_spec_index
        return None


class TriggerInstance(object):
    """Value object representing a trigger.

    A trigger refers to a condition that may arise during a learner
    playthrough, such as a certain number of loop-arounds on the current state,
    or a certain amount of time having elapsed.
    """
    def __init__(self, trigger_type, customization_args):
        # A string denoting the type of trigger.
        self.trigger_type = trigger_type
        # Customization args for the trigger. This is a dict: the keys and
        # values are the names of the customization_args for this trigger
        # type, and the corresponding values for this instance of the trigger,
        # respectively. The values consist of standard Python/JSON data types
        # (i.e. strings, ints, booleans, dicts and lists, but not objects).
        self.customization_args = customization_args

    def to_dict(self):
        return {
            'trigger_type': self.trigger_type,
            'customization_args': self.customization_args,
        }

    @classmethod
    def from_dict(cls, trigger_dict):
        return cls(
            trigger_dict['trigger_type'],
            trigger_dict['customization_args'])

    def validate(self):
        if not isinstance(self.trigger_type, basestring):
            raise utils.ValidationError(
                'Expected trigger type to be a string, received %s' %
                self.trigger_type)

        try:
            trigger = trigger_registry.Registry.get_trigger(self.trigger_type)
        except KeyError:
            raise utils.ValidationError(
                'Unknown trigger type: %s' % self.trigger_type)

        # Verify that the customization args are valid.
        _validate_customization_args_and_values(
            'trigger', self.trigger_type, self.customization_args,
            trigger.customization_arg_specs)


class Fallback(object):
    """Value object representing a fallback.

    A fallback consists of a trigger and an outcome. When the trigger is
    satisfied, the user flow is rerouted to the given outcome.
    """
    def __init__(self, trigger, outcome):
        self.trigger = trigger
        self.outcome = outcome

    def to_dict(self):
        return {
            'trigger': self.trigger.to_dict(),
            'outcome': self.outcome.to_dict(),
        }

    @classmethod
    def from_dict(cls, fallback_dict):
        return cls(
            TriggerInstance.from_dict(fallback_dict['trigger']),
            Outcome.from_dict(fallback_dict['outcome']))

    def validate(self):
        self.trigger.validate()
        self.outcome.validate()


class InteractionInstance(object):
    """Value object for an instance of an interaction."""

    # The default interaction used for a new state.
    _DEFAULT_INTERACTION_ID = None

    def to_dict(self):
        return {
            'id': self.id,
            'customization_args': (
                {} if self.id is None else
                _get_full_customization_args(
                    self.customization_args,
                    interaction_registry.Registry.get_interaction_by_id(
                        self.id).customization_arg_specs)),
            'answer_groups': [group.to_dict() for group in self.answer_groups],
            'default_outcome': (
                self.default_outcome.to_dict()
                if self.default_outcome is not None
                else None),
            'confirmed_unclassified_answers': (
                self.confirmed_unclassified_answers),
            'fallbacks': [fallback.to_dict() for fallback in self.fallbacks],
        }

    @classmethod
    def from_dict(cls, interaction_dict):
        default_outcome_dict = (
            Outcome.from_dict(interaction_dict['default_outcome'])
            if interaction_dict['default_outcome'] is not None else None)
        return cls(
            interaction_dict['id'],
            interaction_dict['customization_args'],
            [AnswerGroup.from_dict(h)
             for h in interaction_dict['answer_groups']],
            default_outcome_dict,
            interaction_dict['confirmed_unclassified_answers'],
            [Fallback.from_dict(f) for f in interaction_dict['fallbacks']])

    def __init__(
            self, interaction_id, customization_args, answer_groups,
            default_outcome, confirmed_unclassified_answers, fallbacks):
        self.id = interaction_id
        # Customization args for the interaction's view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        # This is a dict: the keys are names of customization_args and the
        # values are dicts with a single key, 'value', whose corresponding
        # value is the value of the customization arg.
        self.customization_args = customization_args
        self.answer_groups = answer_groups
        self.default_outcome = default_outcome
        self.confirmed_unclassified_answers = confirmed_unclassified_answers
        self.fallbacks = fallbacks

    @property
    def is_terminal(self):
        """Determines if this interaction type is terminal. If no ID is set for
        this interaction, it is assumed to not be terminal.
        """
        return self.id and interaction_registry.Registry.get_interaction_by_id(
            self.id).is_terminal

    def get_all_non_fallback_outcomes(self):
        """Returns a list of all non-fallback outcomes of this interaction, i.e.
        every answer group and the default outcome.
        """
        outcomes = []
        for answer_group in self.answer_groups:
            outcomes.append(answer_group.outcome)
        if self.default_outcome is not None:
            outcomes.append(self.default_outcome)
        return outcomes

    def get_all_outcomes(self):
        """Returns a list of all outcomes of this interaction, taking into
        consideration every answer group, the default outcome, and every
        fallback.
        """
        outcomes = self.get_all_non_fallback_outcomes()
        for fallback in self.fallbacks:
            outcomes.append(fallback.outcome)
        return outcomes

    def validate(self, exp_param_specs_dict):
        if not isinstance(self.id, basestring):
            raise utils.ValidationError(
                'Expected interaction id to be a string, received %s' %
                self.id)
        try:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                self.id)
        except KeyError:
            raise utils.ValidationError('Invalid interaction id: %s' % self.id)

        _validate_customization_args_and_values(
            'interaction', self.id, self.customization_args,
            interaction.customization_arg_specs)

        if not isinstance(self.answer_groups, list):
            raise utils.ValidationError(
                'Expected answer groups to be a list, received %s.'
                % self.answer_groups)
        if not self.is_terminal and self.default_outcome is None:
            raise utils.ValidationError(
                'Non-terminal interactions must have a default outcome.')
        if self.is_terminal and self.default_outcome is not None:
            raise utils.ValidationError(
                'Terminal interactions must not have a default outcome.')
        if self.is_terminal and self.answer_groups:
            raise utils.ValidationError(
                'Terminal interactions must not have any answer groups.')

        obj_type = (
            interaction_registry.Registry.get_interaction_by_id(
                self.id).answer_type)
        for answer_group in self.answer_groups:
            answer_group.validate(obj_type, exp_param_specs_dict)
        if self.default_outcome is not None:
            self.default_outcome.validate()

        if not isinstance(self.fallbacks, list):
            raise utils.ValidationError(
                'Expected fallbacks to be a list, received %s'
                % self.fallbacks)
        for fallback in self.fallbacks:
            fallback.validate()

    @classmethod
    def create_default_interaction(cls, default_dest_state_name):
        return cls(
            cls._DEFAULT_INTERACTION_ID,
            {}, [],
            Outcome(default_dest_state_name, [], {}), [], []
        )


class GadgetInstance(object):
    """Value object for an instance of a gadget."""

    _MAX_GADGET_NAME_LENGTH = 20

    def __init__(self, gadget_type, gadget_name,
                 visible_in_states, customization_args):
        # Backend ID referring to the gadget's type in gadget registry.
        self.type = gadget_type

        # Author-facing unique name to distinguish instances in the Editor UI.
        # Gadgets may use this name as a title in learner facing UI as well.
        self.name = gadget_name

        # List of State name strings where this Gadget is visible.
        self.visible_in_states = visible_in_states

        # Customization args for the gadget's view.
        self.customization_args = customization_args

    @property
    def gadget(self):
        """Gadget spec for validation and derived properties below."""
        return gadget_registry.Registry.get_gadget_by_type(self.type)

    @property
    def width(self):
        """Width in pixels."""
        return self.gadget.width_px

    @property
    def height(self):
        """Height in pixels."""
        return self.gadget.height_px

    @staticmethod
    def _validate_gadget_name(gadget_name):
        """Validates gadget_name is a non-empty string of alphanumerics
        allowing spaces."""
        if gadget_name == '':
            raise utils.ValidationError(
                'Gadget name must not be an empty string.')

        if not isinstance(gadget_name, basestring):
            raise utils.ValidationError(
                'Gadget name must be a string. Received type: %s' % str(
                    type(gadget_name).__name__)
            )

        if len(gadget_name) > GadgetInstance._MAX_GADGET_NAME_LENGTH:
            raise utils.ValidationError(
                '%s gadget name exceeds maximum length of %d' % (
                    gadget_name,
                    GadgetInstance._MAX_GADGET_NAME_LENGTH
                )
            )

        if not re.search(feconf.ALPHANUMERIC_SPACE_REGEX, gadget_name):
            raise utils.ValidationError(
                'Gadget names must be alphanumeric. Spaces are allowed.'
                ' Received: %s' % gadget_name
            )

    def validate(self):
        """Validate attributes of this GadgetInstance."""
        try:
            self.gadget
        except KeyError:
            raise utils.ValidationError(
                'Unknown gadget with type %s is not in the registry.' % (
                    self.type)
            )

        self._validate_gadget_name(self.name)

        _validate_customization_args_and_values(
            'gadget', self.type, self.customization_args,
            self.gadget.customization_arg_specs)

        # Do additional per-gadget validation on the customization args.
        self.gadget.validate(self.customization_args)

        if self.visible_in_states == []:
            raise utils.ValidationError(
                '%s gadget not visible in any states.' % (
                    self.name))

        # Validate state name visibility isn't repeated within each gadget.
        if len(self.visible_in_states) != len(set(self.visible_in_states)):
            redundant_visible_states = [
                state_name for state_name, count
                in collections.Counter(self.visible_in_states).items()
                if count > 1]
            raise utils.ValidationError(
                '%s specifies visibility repeatedly for state%s: %s' % (
                    self.type,
                    's' if len(redundant_visible_states) > 1 else '',
                    ', '.join(redundant_visible_states)))

    def to_dict(self):
        """Returns GadgetInstance data represented in dict form."""
        return {
            'gadget_type': self.type,
            'gadget_name': self.name,
            'visible_in_states': self.visible_in_states,
            'customization_args': _get_full_customization_args(
                self.customization_args,
                self.gadget.customization_arg_specs),
        }

    @classmethod
    def from_dict(cls, gadget_dict):
        """Returns GadgetInstance constructed from dict data."""
        return GadgetInstance(
            gadget_dict['gadget_type'],
            gadget_dict['gadget_name'],
            gadget_dict['visible_in_states'],
            gadget_dict['customization_args'])

    def update_customization_args(self, customization_args):
        """Updates the GadgetInstance's customization arguments."""
        self.customization_args = customization_args

    def update_visible_in_states(self, visible_in_states):
        """Updates the GadgetInstance's visibility in different states."""
        self.visible_in_states = visible_in_states

    def _get_full_customization_args(self):
        """Populates the customization_args dict of the gadget with
        default values, if any of the expected customization_args are missing.
        """
        full_customization_args_dict = copy.deepcopy(self.customization_args)

        for ca_spec in self.gadget.customization_arg_specs:
            if ca_spec.name not in full_customization_args_dict:
                full_customization_args_dict[ca_spec.name] = {
                    'value': ca_spec.default_value
                }
        return full_customization_args_dict


class SkinInstance(object):
    """Domain object for a skin instance."""

    def __init__(self, skin_id, skin_customizations):
        """Initializes SkinInstance with any customizations provided.

        If no customizations are necessary, skin_customizations may be set to
        None, in which case defaults will be generated that provide empty
        gadget panels for each panel specified in the skin.
        """
        # TODO(sll): Deprecate this property; it is not used.
        self.skin_id = skin_id
        # panel_contents_dict has panel strings as keys and
        # lists of GadgetInstance instances as values.
        self.panel_contents_dict = {}

        default_skin_customizations = (
            SkinInstance._get_default_skin_customizations())

        # Ensure that skin_customizations is a dict.
        if skin_customizations is None:
            skin_customizations = (
                SkinInstance._get_default_skin_customizations())

        # Populate panel_contents_dict with default skin customizations
        # if they are not specified in skin_customizations.
        for panel in default_skin_customizations['panels_contents']:
            if panel not in skin_customizations['panels_contents']:
                self.panel_contents_dict[panel] = []
            else:
                self.panel_contents_dict[panel] = [
                    GadgetInstance(
                        gdict['gadget_type'],
                        gdict['gadget_name'],
                        gdict['visible_in_states'],
                        gdict['customization_args']
                    ) for gdict in skin_customizations['panels_contents'][panel]
                ]

    @staticmethod
    def _get_default_skin_customizations():
        """Generates default skin customizations when none are specified."""
        return {
            'panels_contents': {
                panel_name: []
                for panel_name in feconf.PANELS_PROPERTIES
            }
        }

    def validate_gadget_panel(self, panel_name, gadget_list):
        """
        Validate proper fit given space requirements specified by
        feconf.PANELS_PROPERTIES.

        Args:
        - panel_name: str. Unique name that identifies this panel in the skin.
            This should correspond to an entry in feconf.PANELS_PROPERTIES.
        - gadget_list: list of GadgetInstance instances.
        """
        # If the panel contains no gadgets, max() will raise an error,
        # so we return early.
        if not gadget_list:
            return

        panel_spec = feconf.PANELS_PROPERTIES[panel_name]

        # This is a dict whose keys are state names, and whose corresponding
        # values are lists of GadgetInstance instances representing the gadgets
        # visible in that state. Note that the keys only include states for
        # which at least one gadget is visible.
        gadget_visibility_map = collections.defaultdict(list)
        for gadget_instance in gadget_list:
            for state_name in set(gadget_instance.visible_in_states):
                gadget_visibility_map[state_name].append(gadget_instance)

        # Validate limitations and fit considering visibility for each state.
        for state_name, gadget_instances in gadget_visibility_map.iteritems():
            if len(gadget_instances) > panel_spec['max_gadgets']:
                raise utils.ValidationError(
                    "'%s' panel expected at most %d gadget%s, but %d gadgets"
                    " are visible in state '%s'." % (
                        panel_name,
                        panel_spec['max_gadgets'],
                        's' if panel_spec['max_gadgets'] != 1 else '',
                        len(gadget_instances),
                        state_name))

            # Calculate total width and height of gadgets given custom args and
            # panel stackable axis.
            total_width = 0
            total_height = 0

            if (panel_spec['stackable_axis'] ==
                    feconf.GADGET_PANEL_AXIS_HORIZONTAL):
                total_width += panel_spec['pixels_between_gadgets'] * (
                    len(gadget_instances) - 1)
                total_width += sum(
                    gadget.width for gadget in gadget_instances)
                total_height = max(
                    gadget.height for gadget in gadget_instances)
            else:
                raise utils.ValidationError(
                    "Unrecognized axis for '%s' panel. ")

            # Validate fit for each dimension.
            if panel_spec['height'] < total_height:
                raise utils.ValidationError(
                    "Height %d of panel \'%s\' exceeds limit of %d" % (
                        total_height, panel_name, panel_spec['height']))
            elif panel_spec['width'] < total_width:
                raise utils.ValidationError(
                    "Width %d of panel \'%s\' exceeds limit of %d" % (
                        total_width, panel_name, panel_spec['width']))

    def validate(self):
        """Validates that gadgets fit the skin panel dimensions, and that the
        gadgets themselves are valid."""

        # A list to validate each gadget_instance.name is unique.
        gadget_instance_names = []

        for panel_name, gadget_instances in (
                self.panel_contents_dict.iteritems()):

            # Validate existence of panels in the skin.
            if panel_name not in feconf.PANELS_PROPERTIES:
                raise utils.ValidationError(
                    'The panel name \'%s\' is invalid.' % panel_name)

            # Validate gadgets fit each skin panel.
            self.validate_gadget_panel(panel_name, gadget_instances)

            # Validate gadget internal attributes.
            for gadget_instance in gadget_instances:
                gadget_instance.validate()
                if gadget_instance.name in gadget_instance_names:
                    raise utils.ValidationError(
                        '%s gadget instance name must be unique.' % (
                            gadget_instance.name)
                    )
                gadget_instance_names.append(gadget_instance.name)

    def to_dict(self):
        """Returns SkinInstance data represented in dict form."""
        return {
            'skin_id': self.skin_id,
            'skin_customizations': {
                'panels_contents': {
                    panel: [
                        gadget_instance.to_dict() for gadget_instance
                        in instances_list]
                    for panel, instances_list in
                    self.panel_contents_dict.iteritems()
                },
            }
        }

    @classmethod
    def from_dict(cls, skin_dict):
        """Returns SkinInstance instance given dict form."""
        return SkinInstance(
            skin_dict['skin_id'],
            skin_dict['skin_customizations'])

    def get_state_names_required_by_gadgets(self):
        """Returns a list of strings representing State names required by
        GadgetInstances in this skin."""
        state_names = set()
        for gadget_instances in self.panel_contents_dict.values():
            for gadget_instance in gadget_instances:
                for state_name in gadget_instance.visible_in_states:
                    state_names.add(state_name)

        # We convert to a sorted list for clean deterministic testing.
        return sorted(state_names)


class State(object):
    """Domain object for a state."""

    NULL_INTERACTION_DICT = {
        'id': None,
        'customization_args': {},
        'answer_groups': [],
        'default_outcome': {
            'dest': feconf.DEFAULT_INIT_STATE_NAME,
            'feedback': [],
            'param_changes': [],
        },
        'confirmed_unclassified_answers': [],
        'fallbacks': [],
    }

    def __init__(self, content, param_changes, interaction):
        # The content displayed to the reader in this state.
        self.content = [Content(item.type, item.value) for item in content]
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args
        ) for param_change in param_changes]
        # The interaction instance associated with this state.
        self.interaction = InteractionInstance(
            interaction.id, interaction.customization_args,
            interaction.answer_groups, interaction.default_outcome,
            interaction.confirmed_unclassified_answers, interaction.fallbacks)

    def validate(self, exp_param_specs_dict, allow_null_interaction):
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

        if not allow_null_interaction and self.interaction.id is None:
            raise utils.ValidationError(
                'This state does not have any interaction specified.')
        elif self.interaction.id is not None:
            self.interaction.validate(exp_param_specs_dict)

    def update_content(self, content_list):
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = [Content.from_dict(content_list[0])]

    def update_param_changes(self, param_change_dicts):
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_change_dicts]

    def update_interaction_id(self, interaction_id):
        self.interaction.id = interaction_id
        # TODO(sll): This should also clear interaction.answer_groups (except
        # for the default rule). This is somewhat mitigated because the client
        # updates interaction_answer_groups directly after this, but we should
        # fix it.

    def update_interaction_customization_args(self, customization_args):
        self.interaction.customization_args = customization_args

    def update_interaction_answer_groups(self, answer_groups_list):
        if not isinstance(answer_groups_list, list):
            raise Exception(
                'Expected interaction_answer_groups to be a list, received %s'
                % answer_groups_list)

        interaction_answer_groups = []

        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for answer_group_dict in answer_groups_list:
            rule_specs_list = answer_group_dict['rule_specs']
            if not isinstance(rule_specs_list, list):
                raise Exception(
                    'Expected answer group rule specs to be a list, '
                    'received %s' % rule_specs_list)

            answer_group = AnswerGroup(Outcome.from_dict(
                answer_group_dict['outcome']), [])
            answer_group.outcome.feedback = [
                html_cleaner.clean(feedback)
                for feedback in answer_group.outcome.feedback]
            for rule_dict in rule_specs_list:
                rule_spec = RuleSpec.from_dict(rule_dict)

                matched_rule = (
                    interaction_registry.Registry.get_interaction_by_id(
                        self.interaction.id
                    ).get_rule_by_name(rule_spec.rule_type))

                # Normalize and store the rule params.
                rule_inputs = rule_spec.inputs
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

                answer_group.rule_specs.append(rule_spec)
            interaction_answer_groups.append(answer_group)
        self.interaction.answer_groups = interaction_answer_groups

    def update_interaction_default_outcome(self, default_outcome_dict):
        if default_outcome_dict:
            if not isinstance(default_outcome_dict, dict):
                raise Exception(
                    'Expected default_outcome_dict to be a dict, received %s'
                    % default_outcome_dict)
            self.interaction.default_outcome = Outcome.from_dict(
                default_outcome_dict)
            self.interaction.default_outcome.feedback = [
                html_cleaner.clean(feedback)
                for feedback in self.interaction.default_outcome.feedback]
        else:
            self.interaction.default_outcome = None

    def update_interaction_confirmed_unclassified_answers(
            self, confirmed_unclassified_answers):
        if not isinstance(confirmed_unclassified_answers, list):
            raise Exception(
                'Expected confirmed_unclassified_answers to be a list,'
                ' received %s' % confirmed_unclassified_answers)
        self.interaction.confirmed_unclassified_answers = (
            confirmed_unclassified_answers)

    def update_interaction_fallbacks(self, fallbacks_list):
        if not isinstance(fallbacks_list, list):
            raise Exception(
                'Expected fallbacks_list to be a list, received %s'
                % fallbacks_list)
        self.interaction.fallbacks = [
            Fallback.from_dict(fallback_dict)
            for fallback_dict in fallbacks_list]

    def to_dict(self):
        return {
            'content': [item.to_dict() for item in self.content],
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'interaction': self.interaction.to_dict()
        }

    @classmethod
    def from_dict(cls, state_dict):
        return cls(
            [Content.from_dict(item)
             for item in state_dict['content']],
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            InteractionInstance.from_dict(state_dict['interaction']))

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
                 language_code, tags, blurb, author_notes, skin_customizations,
                 states_schema_version, init_state_name, states_dict,
                 param_specs_dict, param_changes_list, version,
                 created_on=None, last_updated=None):
        self.id = exploration_id
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.tags = tags
        self.blurb = blurb
        self.author_notes = author_notes
        self.states_schema_version = states_schema_version
        self.init_state_name = init_state_name

        self.skin_instance = SkinInstance(
            feconf.DEFAULT_SKIN_ID, skin_customizations)

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

    @classmethod
    def create_default_exploration(
            cls, exploration_id, title=feconf.DEFAULT_EXPLORATION_TITLE,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=feconf.DEFAULT_LANGUAGE_CODE):
        init_state_dict = State.create_default_state(
            feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()

        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: init_state_dict
        }

        return cls(
            exploration_id, title, category, objective, language_code, [], '',
            '', None, feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION,
            feconf.DEFAULT_INIT_STATE_NAME, states_dict, {}, [], 0)

    @classmethod
    def from_dict(
            cls, exploration_dict,
            exploration_version=0, exploration_created_on=None,
            exploration_last_updated=None):
        # NOTE TO DEVELOPERS: It is absolutely ESSENTIAL this conversion to and
        # from an ExplorationModel/dictionary MUST be exhaustive and complete.
        exploration = cls.create_default_exploration(
            exploration_dict['id'],
            title=exploration_dict['title'],
            category=exploration_dict['category'],
            objective=exploration_dict['objective'],
            language_code=exploration_dict['language_code'])
        exploration.tags = exploration_dict['tags']
        exploration.blurb = exploration_dict['blurb']
        exploration.author_notes = exploration_dict['author_notes']

        exploration.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val) for
            (ps_name, ps_val) in exploration_dict['param_specs'].iteritems()
        }

        exploration.states_schema_version = exploration_dict[
            'states_schema_version']
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
            interaction_answer_groups = [
                AnswerGroup.from_dict({
                    'outcome': {
                        'dest': group['outcome']['dest'],
                        'feedback': [
                            html_cleaner.clean(feedback)
                            for feedback in group['outcome']['feedback']],
                        'param_changes': group['outcome']['param_changes'],
                    },
                    'rule_specs': [{
                        'inputs': rule_spec['inputs'],
                        'rule_type': rule_spec['rule_type'],
                    } for rule_spec in group['rule_specs']],
                })
                for group in idict['answer_groups']]

            default_outcome = (
                Outcome.from_dict(idict['default_outcome'])
                if idict['default_outcome'] is not None else None)

            state.interaction = InteractionInstance(
                idict['id'], idict['customization_args'],
                interaction_answer_groups, default_outcome,
                idict['confirmed_unclassified_answers'],
                [Fallback.from_dict(f) for f in idict['fallbacks']])

            exploration.states[state_name] = state

        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]

        exploration.skin_instance = SkinInstance(
            feconf.DEFAULT_SKIN_ID, exploration_dict['skin_customizations'])

        exploration.version = exploration_version
        exploration.created_on = exploration_created_on
        exploration.last_updated = exploration_last_updated

        return exploration

    @classmethod
    def _require_valid_state_name(cls, name):
        utils.require_valid_name(name, 'a state name')

    def validate(self, strict=False):
        """Validates the exploration before it is committed to storage.

        If strict is True, performs advanced validation.
        """
        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the exploration title', allow_empty=True)

        if not isinstance(self.category, basestring):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the exploration category', allow_empty=True)

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

        if not isinstance(self.tags, list):
            raise utils.ValidationError(
                'Expected \'tags\' to be a list, received %s' % self.tags)
        for tag in self.tags:
            if not isinstance(tag, basestring):
                raise utils.ValidationError(
                    'Expected each tag in \'tags\' to be a string, received '
                    '\'%s\'' % tag)

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(feconf.TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain lowercase letters and spaces, '
                    'received \'%s\'' % tag)

            if (tag[0] not in string.ascii_lowercase or
                    tag[-1] not in string.ascii_lowercase):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received '
                    ' \'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received \'%s\'' % tag)
        if len(set(self.tags)) != len(self.tags):
            raise utils.ValidationError('Some tags duplicate each other')

        if not isinstance(self.blurb, basestring):
            raise utils.ValidationError(
                'Expected blurb to be a string, received %s' % self.blurb)

        if not isinstance(self.author_notes, basestring):
            raise utils.ValidationError(
                'Expected author_notes to be a string, received %s' %
                self.author_notes)

        if not isinstance(self.states, dict):
            raise utils.ValidationError(
                'Expected states to be a dict, received %s' % self.states)
        if not self.states:
            raise utils.ValidationError('This exploration has no states.')
        for state_name in self.states:
            self._require_valid_state_name(state_name)
            self.states[state_name].validate(
                self.param_specs,
                allow_null_interaction=not strict)

        if self.states_schema_version is None:
            raise utils.ValidationError(
                'This exploration has no states schema version.')
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

        # Check that all answer groups, outcomes, and param_changes are valid.
        all_state_names = self.states.keys()
        for state in self.states.values():
            interaction = state.interaction

            # Check the default destination, if any
            if (interaction.default_outcome is not None and
                    interaction.default_outcome.dest not in all_state_names):
                raise utils.ValidationError(
                    'The destination %s is not a valid state.'
                    % interaction.default_outcome.dest)

            for group in interaction.answer_groups:
                # Check group destinations.
                if group.outcome.dest not in all_state_names:
                    raise utils.ValidationError(
                        'The destination %s is not a valid state.'
                        % group.outcome.dest)

                for param_change in group.outcome.param_changes:
                    if param_change.name not in self.param_specs:
                        raise utils.ValidationError(
                            'The parameter %s was used in an answer group, '
                            'but it does not exist in this exploration'
                            % param_change.name)

        # Check that all fallbacks are valid.
        for state in self.states.values():
            interaction = state.interaction

            for fallback in interaction.fallbacks:
                # Check fallback destinations.
                if fallback.outcome.dest not in all_state_names:
                    raise utils.ValidationError(
                        'The fallback destination %s is not a valid state.'
                        % fallback.outcome.dest)

                for param_change in fallback.outcome.param_changes:
                    if param_change.name not in self.param_specs:
                        raise utils.ValidationError(
                            'The parameter %s was used in a fallback, but it '
                            'does not exist in this exploration'
                            % param_change.name)

        # Check that state names required by gadgets exist.
        state_names_required_by_gadgets = set(
            self.skin_instance.get_state_names_required_by_gadgets())
        missing_state_names = state_names_required_by_gadgets - set(
            self.states.keys())
        if missing_state_names:
            raise utils.ValidationError(
                'Exploration missing required state%s: %s' % (
                    's' if len(missing_state_names) > 1 else '',
                    ', '.join(sorted(missing_state_names)))
                )

        # Check that GadgetInstances fit the skin and that gadgets are valid.
        self.skin_instance.validate()

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

            if not self.title:
                warnings_list.append(
                    'A title must be specified (in the \'Settings\' tab).')

            if not self.category:
                warnings_list.append(
                    'A category must be specified (in the \'Settings\' tab).')

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

            if not curr_state.interaction.is_terminal:
                all_outcomes = curr_state.interaction.get_all_outcomes()
                for outcome in all_outcomes:
                    dest_state = outcome.dest
                    if (dest_state not in curr_queue and
                            dest_state not in processed_queue):
                        curr_queue.append(dest_state)

        if len(self.states) != len(processed_queue):
            unseen_states = list(
                set(self.states.keys()) - set(processed_queue))
            raise utils.ValidationError(
                'The following states are not reachable from the initial '
                'state: %s' % ', '.join(unseen_states))

    def _verify_no_dead_ends(self):
        """Verifies that all states can reach a terminal state without using
        fallbacks.
        """
        # This queue stores state names.
        processed_queue = []
        curr_queue = []

        for (state_name, state) in self.states.iteritems():
            if state.interaction.is_terminal:
                curr_queue.append(state_name)

        while curr_queue:
            curr_state_name = curr_queue[0]
            curr_queue = curr_queue[1:]

            if curr_state_name in processed_queue:
                continue

            processed_queue.append(curr_state_name)

            for (state_name, state) in self.states.iteritems():
                if (state_name not in curr_queue
                        and state_name not in processed_queue):
                    all_outcomes = (
                        state.interaction.get_all_non_fallback_outcomes())
                    for outcome in all_outcomes:
                        if outcome.dest == curr_state_name:
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
        """Whether the given exploration id is a demo exploration."""
        return exploration_id in feconf.DEMO_EXPLORATIONS

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

    def update_tags(self, tags):
        self.tags = tags

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
            other_outcomes = other_state.interaction.get_all_outcomes()
            for outcome in other_outcomes:
                if outcome.dest == old_state_name:
                    outcome.dest = new_state_name

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
            all_outcomes = other_state.interaction.get_all_outcomes()
            for outcome in all_outcomes:
                if outcome.dest == state_name:
                    outcome.dest = other_state_name

        del self.states[state_name]

    # Methods relating to gadgets.
    def add_gadget(self, gadget_dict, panel):
        """Adds a gadget to the associated panel."""
        gadget_instance = GadgetInstance(
            gadget_dict['gadget_type'], gadget_dict['gadget_name'],
            gadget_dict['visible_in_states'],
            gadget_dict['customization_args'])

        self.skin_instance.panel_contents_dict[panel].append(
            gadget_instance)

    def rename_gadget(self, old_gadget_name, new_gadget_name):
        """Renames the given gadget."""
        if old_gadget_name not in self.get_all_gadget_names():
            raise ValueError('Gadget %s does not exist.' % old_gadget_name)
        if (old_gadget_name != new_gadget_name and
                new_gadget_name in self.get_all_gadget_names()):
            raise ValueError('Duplicate gadget name: %s' % new_gadget_name)

        if old_gadget_name == new_gadget_name:
            return

        GadgetInstance._validate_gadget_name(new_gadget_name)  # pylint: disable=protected-access

        gadget_instance = self.get_gadget_instance_by_name(old_gadget_name)
        gadget_instance.name = new_gadget_name

    def delete_gadget(self, gadget_name):
        """Deletes the given gadget."""
        if gadget_name not in self.get_all_gadget_names():
            raise ValueError('Gadget %s does not exist.' % gadget_name)

        panel = self._get_panel_for_gadget(gadget_name)
        gadget_index = None
        for index in range(len(
                self.skin_instance.panel_contents_dict[panel])):
            if self.skin_instance.panel_contents_dict[
                    panel][index].name == gadget_name:
                gadget_index = index
                break
        del self.skin_instance.panel_contents_dict[panel][gadget_index]

    def get_gadget_instance_by_name(self, gadget_name):
        """Returns the GadgetInstance with the given name."""
        for gadget_instances in (
                self.skin_instance.panel_contents_dict.itervalues()):
            for gadget_instance in gadget_instances:
                if gadget_instance.name == gadget_name:
                    return gadget_instance
        raise ValueError('Gadget %s does not exist.' % gadget_name)

    def get_all_gadget_names(self):
        """Convenience method to query against current gadget names."""
        gadget_names = set()
        for gadget_instances in (
                self.skin_instance.panel_contents_dict.itervalues()):
            for gadget_instance in gadget_instances:
                gadget_names.add(gadget_instance.name)
        return sorted(gadget_names)

    def _get_panel_for_gadget(self, gadget_name):
        """Returns the panel name for the given GadgetInstance."""
        for panel, gadget_instances in (
                self.skin_instance.panel_contents_dict.iteritems()):
            for gadget_instance in gadget_instances:
                if gadget_instance.name == gadget_name:
                    return panel
        raise ValueError('Gadget %s does not exist.' % gadget_name)

    def _update_gadget_visibilities_for_renamed_state(
            self, old_state_name, new_state_name):
        """Updates the visible_in_states property for gadget instances
        visible in the renamed state."""
        affected_gadget_instances = (
            self._get_gadget_instances_visible_in_state(old_state_name))

        for gadget_instance in affected_gadget_instances:
            # Order within visible_in_states does not affect functionality.
            # It's sorted purely for deterministic testing.
            gadget_instance.visible_in_states.remove(old_state_name)
            gadget_instance.visible_in_states.append(new_state_name)
            gadget_instance.visible_in_states.sort()

    def _update_gadget_visibilities_for_deleted_state(self, state_name):
        """Updates the visible_in_states property for gadget instances
        visible in the deleted state."""
        affected_gadget_instances = (
            self._get_gadget_instances_visible_in_state(state_name))

        for gadget_instance in affected_gadget_instances:
            gadget_instance.visible_in_states.remove(state_name)
            if len(gadget_instance.visible_in_states) == 0:
                raise utils.ValidationError(
                    "Deleting '%s' state leaves '%s' gadget with no visible "
                    'states. This is not currently supported and should be '
                    'handled with editor guidance on the front-end.' % (
                        state_name,
                        gadget_instance.name)
                )

    def _get_gadget_instances_visible_in_state(self, state_name):
        """Helper function to retrieve gadget instances visible in
        a given state."""
        visible_gadget_instances = []
        for gadget_instances in (
                self.skin_instance.panel_contents_dict.itervalues()):
            for gadget_instance in gadget_instances:
                if state_name in gadget_instance.visible_in_states:
                    visible_gadget_instances.append(gadget_instance)
        return visible_gadget_instances

    @classmethod
    def _convert_states_v0_dict_to_v1_dict(cls, states_dict):
        """Converts old states schema to the modern v1 schema. v1 contains the
        schema version 1 and does not contain any old constructs, such as
        widgets. This is a complete migration of everything previous to the
        schema versioning update to the earliest versioned schema.

        Note that the states_dict being passed in is modified in-place.
        """
        # ensure widgets are renamed to be interactions
        for _, state_defn in states_dict.iteritems():
            if 'widget' not in state_defn:
                continue
            state_defn['interaction'] = copy.deepcopy(state_defn['widget'])
            state_defn['interaction']['id'] = copy.deepcopy(
                state_defn['interaction']['widget_id'])
            del state_defn['interaction']['widget_id']
            if 'sticky' in state_defn['interaction']:
                del state_defn['interaction']['sticky']
            del state_defn['widget']
        return states_dict

    @classmethod
    def _convert_states_v1_dict_to_v2_dict(cls, states_dict):
        """Converts from version 1 to 2. Version 1 assumes the existence of an
        implicit 'END' state, but version 2 does not. As a result, the
        conversion process involves introducing a proper ending state for all
        explorations previously designed under this assumption.

        Note that the states_dict being passed in is modified in-place.
        """
        # The name of the implicit END state before the migration. Needed here
        # to migrate old explorations which expect that implicit END state.
        old_end_dest = 'END'

        # Adds an explicit state called 'END' with an EndExploration to replace
        # links other states have to an implicit 'END' state. Otherwise, if no
        # states refer to a state called 'END', no new state will be introduced
        # since it would be isolated from all other states in the graph and
        # create additional warnings for the user. If they were not referring
        # to an 'END' state before, then they would only be receiving warnings
        # about not being able to complete the exploration. The introduction of
        # a real END state would produce additional warnings (state cannot be
        # reached from other states, etc.)
        targets_end_state = False
        has_end_state = False
        for (state_name, sdict) in states_dict.iteritems():
            if not has_end_state and state_name == old_end_dest:
                has_end_state = True

            if not targets_end_state:
                for handler in sdict['interaction']['handlers']:
                    for rule_spec in handler['rule_specs']:
                        if rule_spec['dest'] == old_end_dest:
                            targets_end_state = True
                            break

        # Ensure any explorations pointing to an END state has a valid END
        # state to end with (in case it expects an END state)
        if targets_end_state and not has_end_state:
            states_dict[old_end_dest] = {
                'content': [{
                    'type': 'text',
                    'value': 'Congratulations, you have finished!'
                }],
                'interaction': {
                    'id': 'EndExploration',
                    'customization_args': {
                        'recommendedExplorationIds': {
                            'value': []
                        }
                    },
                    'handlers': [{
                        'name': 'submit',
                        'rule_specs': [{
                            'definition': {
                                'rule_type': 'default'
                            },
                            'dest': old_end_dest,
                            'feedback': [],
                            'param_changes': []
                        }]
                    }],
                },
                'param_changes': []
            }

        return states_dict

    @classmethod
    def _convert_states_v2_dict_to_v3_dict(cls, states_dict):
        """Converts from version 2 to 3. Version 3 introduces a triggers list
        within interactions.

        Note that the states_dict being passed in is modified in-place.
        """
        # Ensure all states interactions have a triggers list.
        for sdict in states_dict.values():
            interaction = sdict['interaction']
            if 'triggers' not in interaction:
                interaction['triggers'] = []

        return states_dict

    @classmethod
    def _convert_states_v3_dict_to_v4_dict(cls, states_dict):
        """Converts from version 3 to 4. Version 4 introduces a new structure
        for rules by organizing them into answer groups instead of handlers.
        This migration involves a 1:1 mapping from rule specs to answer groups
        containing just that single rule. Default rules have their destination
        state name and feedback copied to the default_outcome portion of an
        interaction instance.

        Note that the states_dict being passed in is modified in-place.
        """
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            answer_groups = []
            default_outcome = None
            for handler in interaction['handlers']:
                # Ensure the name is 'submit'.
                if 'name' in handler and handler['name'] != 'submit':
                    raise utils.ExplorationConversionError(
                        'Error: Can only convert rules with a name '
                        '\'submit\' in states v3 to v4 conversion process. '
                        'Encountered name: %s' % handler['name'])

                # Each rule spec becomes a new answer group.
                for rule_spec in handler['rule_specs']:
                    group = {}

                    # Rules don't have a rule_type key anymore.
                    is_default_rule = False
                    if 'rule_type' in rule_spec['definition']:
                        rule_type = rule_spec['definition']['rule_type']
                        is_default_rule = (rule_type == 'default')

                        # Ensure the rule type is either default or atomic.
                        if not is_default_rule and rule_type != 'atomic':
                            raise utils.ExplorationConversionError(
                                'Error: Can only convert default and atomic '
                                'rules in states v3 to v4 conversion process. '
                                'Encountered rule of type: %s' % rule_type)

                    # Ensure the subject is answer.
                    if ('subject' in rule_spec['definition'] and
                            rule_spec['definition']['subject'] != 'answer'):
                        raise utils.ExplorationConversionError(
                            'Error: Can only convert rules with an \'answer\' '
                            'subject in states v3 to v4 conversion process. '
                            'Encountered subject: %s'
                            % rule_spec['definition']['subject'])

                    # The rule turns into the group's only rule. Rules do not
                    # have definitions anymore. Do not copy the inputs and name
                    # if it is a default rule.
                    if not is_default_rule:
                        definition = rule_spec['definition']
                        group['rule_specs'] = [{
                            'inputs': copy.deepcopy(definition['inputs']),
                            'rule_type': copy.deepcopy(definition['name'])
                        }]

                    # Answer groups now have an outcome.
                    group['outcome'] = {
                        'dest': copy.deepcopy(rule_spec['dest']),
                        'feedback': copy.deepcopy(rule_spec['feedback']),
                        'param_changes': (
                            copy.deepcopy(rule_spec['param_changes'])
                            if 'param_changes' in rule_spec else [])
                    }

                    if is_default_rule:
                        default_outcome = group['outcome']
                    else:
                        answer_groups.append(group)

            is_terminal = (
                interaction_registry.Registry.get_interaction_by_id(
                    interaction['id']
                ).is_terminal if interaction['id'] is not None else False)
            if not is_terminal:
                interaction['answer_groups'] = answer_groups
                interaction['default_outcome'] = default_outcome
            else:
                # Terminal nodes have no answer groups or outcomes.
                interaction['answer_groups'] = []
                interaction['default_outcome'] = None
            del interaction['handlers']

        return states_dict

    @classmethod
    def _convert_states_v4_dict_to_v5_dict(cls, states_dict):
        """Converts from version 4 to 5. Version 5 removes the triggers list
        within interactions, and replaces it with a fallbacks list.

        Note that the states_dict being passed in is modified in-place.
        """
        # Ensure all states interactions have a fallbacks list.
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            if 'triggers' in interaction:
                del interaction['triggers']
            if 'fallbacks' not in interaction:
                interaction['fallbacks'] = []

        return states_dict

    @classmethod
    def _convert_states_v5_dict_to_v6_dict(cls, states_dict):
        """Converts from version 5 to 6. Version 6 introduces a list of
        confirmed unclassified answers. Those are answers which are confirmed
        to be associated with the default outcome during classification.
        """
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            if 'confirmed_unclassified_answers' not in interaction:
                interaction['confirmed_unclassified_answers'] = []

        return states_dict

    @classmethod
    def _convert_states_v6_dict_to_v7_dict(cls, states_dict):
        """Converts from version 6 to 7. Version 7 forces all CodeRepl
        interactions to use Python.
        """
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            if interaction['id'] == 'CodeRepl':
                interaction['customization_args']['language']['value'] = (
                    'python')

        return states_dict

    @classmethod
    def update_states_from_model(
            cls, versioned_exploration_states, current_states_schema_version):
        """Converts the states blob contained in the given
        versioned_exploration_states dict from current_states_schema_version to
        current_states_schema_version + 1.

        Note that the versioned_exploration_states being passed in is modified
        in-place.
        """
        versioned_exploration_states['states_schema_version'] = (
            current_states_schema_version + 1)

        conversion_fn = getattr(cls, '_convert_states_v%s_dict_to_v%s_dict' % (
            current_states_schema_version, current_states_schema_version + 1))
        versioned_exploration_states['states'] = conversion_fn(
            versioned_exploration_states['states'])

    # The current version of the exploration YAML schema. If any backward-
    # incompatible changes are made to the exploration schema in the YAML
    # definitions, this version number must be changed and a migration process
    # put in place.
    CURRENT_EXP_SCHEMA_VERSION = 10
    LAST_UNTITLED_SCHEMA_VERSION = 9

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
    def _convert_v4_dict_to_v5_dict(cls, exploration_dict):
        """Converts a v4 exploration dict into a v5 exploration dict."""
        exploration_dict['schema_version'] = 5

        # Rename the 'skill_tags' field to 'tags'.
        exploration_dict['tags'] = exploration_dict['skill_tags']
        del exploration_dict['skill_tags']

        exploration_dict['skin_customizations'] = {
            'panels_contents': {
                'bottom': [],
                'left': [],
                'right': []
            }
        }

        return exploration_dict

    @classmethod
    def _convert_v5_dict_to_v6_dict(cls, exploration_dict):
        """Converts a v5 exploration dict into a v6 exploration dict."""
        exploration_dict['schema_version'] = 6

        # Ensure this exploration is up-to-date with states schema v3.
        exploration_dict['states'] = cls._convert_states_v0_dict_to_v1_dict(
            exploration_dict['states'])
        exploration_dict['states'] = cls._convert_states_v1_dict_to_v2_dict(
            exploration_dict['states'])
        exploration_dict['states'] = cls._convert_states_v2_dict_to_v3_dict(
            exploration_dict['states'])

        # Update the states schema version to reflect the above conversions to
        # the states dict.
        exploration_dict['states_schema_version'] = 3

        return exploration_dict

    @classmethod
    def _convert_v6_dict_to_v7_dict(cls, exploration_dict):
        """Converts a v6 exploration dict into a v7 exploration dict."""
        exploration_dict['schema_version'] = 7

        # Ensure this exploration is up-to-date with states schema v4.
        exploration_dict['states'] = cls._convert_states_v3_dict_to_v4_dict(
            exploration_dict['states'])

        # Update the states schema version to reflect the above conversions to
        # the states dict.
        exploration_dict['states_schema_version'] = 4

        return exploration_dict

    @classmethod
    def _convert_v7_dict_to_v8_dict(cls, exploration_dict):
        """Converts a v7 exploration dict into a v8 exploration dict."""
        exploration_dict['schema_version'] = 8

        # Ensure this exploration is up-to-date with states schema v5.
        exploration_dict['states'] = cls._convert_states_v4_dict_to_v5_dict(
            exploration_dict['states'])

        # Update the states schema version to reflect the above conversions to
        # the states dict.
        exploration_dict['states_schema_version'] = 5

        return exploration_dict

    @classmethod
    def _convert_v8_dict_to_v9_dict(cls, exploration_dict):
        """Converts a v8 exploration dict into a v9 exploration dict."""
        exploration_dict['schema_version'] = 9

        # Ensure this exploration is up-to-date with states schema v6.
        exploration_dict['states'] = cls._convert_states_v5_dict_to_v6_dict(
            exploration_dict['states'])

        # Update the states schema version to reflect the above conversions to
        # the states dict.
        exploration_dict['states_schema_version'] = 6

        return exploration_dict

    @classmethod
    def _convert_v9_dict_to_v10_dict(cls, exploration_dict, title, category):
        """Converts a v9 exploration dict into a v10 exploration dict."""

        exploration_dict['schema_version'] = 10

        # From v10 onwards, the title and schema version are stored in the YAML
        # file.
        exploration_dict['title'] = title
        exploration_dict['category'] = category

        # Remove the 'default_skin' property.
        del exploration_dict['default_skin']

        # Upgrade all gadget panel customizations to have exactly one empty
        # bottom panel. This is fine because, for previous schema versions,
        # gadgets functionality had not been released yet.
        exploration_dict['skin_customizations'] = {
            'panels_contents': {
                'bottom': [],
            }
        }

        # Ensure this exploration is up-to-date with states schema v7.
        exploration_dict['states'] = cls._convert_states_v6_dict_to_v7_dict(
            exploration_dict['states'])

        # Update the states schema version to reflect the above conversions to
        # the states dict.
        exploration_dict['states_schema_version'] = 7

        return exploration_dict

    @classmethod
    def _migrate_to_latest_yaml_version(
            cls, yaml_content, title=None, category=None):
        try:
            exploration_dict = utils.dict_from_yaml(yaml_content)
        except Exception as e:
            raise Exception(
                'Please ensure that you are uploading a YAML text file, not '
                'a zip file. The YAML parser returned the following error: %s'
                % e)

        exploration_schema_version = exploration_dict.get('schema_version')
        initial_schema_version = exploration_schema_version
        if exploration_schema_version is None:
            raise Exception('Invalid YAML file: no schema version specified.')
        if not (1 <= exploration_schema_version
                <= cls.CURRENT_EXP_SCHEMA_VERSION):
            raise Exception(
                'Sorry, we can only process v1 to v%s exploration YAML files '
                'at present.' % cls.CURRENT_EXP_SCHEMA_VERSION)
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

        if exploration_schema_version == 4:
            exploration_dict = cls._convert_v4_dict_to_v5_dict(
                exploration_dict)
            exploration_schema_version = 5

        if exploration_schema_version == 5:
            exploration_dict = cls._convert_v5_dict_to_v6_dict(
                exploration_dict)
            exploration_schema_version = 6

        if exploration_schema_version == 6:
            exploration_dict = cls._convert_v6_dict_to_v7_dict(
                exploration_dict)
            exploration_schema_version = 7

        if exploration_schema_version == 7:
            exploration_dict = cls._convert_v7_dict_to_v8_dict(
                exploration_dict)
            exploration_schema_version = 8

        if exploration_schema_version == 8:
            exploration_dict = cls._convert_v8_dict_to_v9_dict(
                exploration_dict)
            exploration_schema_version = 9

        if exploration_schema_version == 9:
            exploration_dict = cls._convert_v9_dict_to_v10_dict(
                exploration_dict, title, category)
            exploration_schema_version = 10

        return (exploration_dict, initial_schema_version)

    @classmethod
    def from_yaml(cls, exploration_id, yaml_content):
        """Creates and returns exploration from a YAML text string for YAML
        schema versions 10 and later.
        """
        migration_result = cls._migrate_to_latest_yaml_version(yaml_content)
        exploration_dict = migration_result[0]
        initial_schema_version = migration_result[1]

        if (initial_schema_version <=
                cls.LAST_UNTITLED_SCHEMA_VERSION):
            raise Exception(
                'Expected a YAML version >= 10, received: %d' % (
                    initial_schema_version))

        exploration_dict['id'] = exploration_id
        return Exploration.from_dict(exploration_dict)

    @classmethod
    def from_untitled_yaml(cls, exploration_id, title, category, yaml_content):
        """Creates and returns exploration from a YAML text string. This is
        for importing explorations using YAML schema version 9 or earlier.
        """
        migration_result = cls._migrate_to_latest_yaml_version(
            yaml_content, title, category)
        exploration_dict = migration_result[0]
        initial_schema_version = migration_result[1]

        if (initial_schema_version >
                cls.LAST_UNTITLED_SCHEMA_VERSION):
            raise Exception(
                'Expected a YAML version <= 9, received: %d' % (
                    initial_schema_version))

        exploration_dict['id'] = exploration_id
        return Exploration.from_dict(exploration_dict)

    def to_yaml(self):
        exp_dict = self.to_dict()
        exp_dict['schema_version'] = self.CURRENT_EXP_SCHEMA_VERSION

        # The ID is the only property which should not be stored within the
        # YAML representation.
        del exp_dict['id']

        return utils.yaml_from_dict(exp_dict)

    def to_dict(self):
        """Returns a copy of the exploration as a dictionary. It includes all
        necessary information to represent the exploration.
        """
        return copy.deepcopy({
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'author_notes': self.author_notes,
            'blurb': self.blurb,
            'states_schema_version': self.states_schema_version,
            'init_state_name': self.init_state_name,
            'language_code': self.language_code,
            'objective': self.objective,
            'param_changes': self.param_change_dicts,
            'param_specs': self.param_specs_dict,
            'tags': self.tags,
            'skin_customizations': self.skin_instance.to_dict()[
                'skin_customizations'],
            'states': {state_name: state.to_dict()
                       for (state_name, state) in self.states.iteritems()}
        })

    def to_player_dict(self):
        """Returns a copy of the exploration suitable for inclusion in the
        learner view.
        """
        return {
            'init_state_name': self.init_state_name,
            'param_changes': self.param_change_dicts,
            'param_specs': self.param_specs_dict,
            'skin_customizations': self.skin_instance.to_dict()[
                'skin_customizations'],
            'states': {
                state_name: state.to_dict()
                for (state_name, state) in self.states.iteritems()
            },
            'title': self.title,
            'language_code': self.language_code,
        }

    def get_gadget_types(self):
        """Get all gadget types used in this exploration."""
        result = set()
        for gadget_instances in (
                self.skin_instance.panel_contents_dict.itervalues()):
            result.update([
                gadget_instance.type for gadget_instance
                in gadget_instances])
        return sorted(result)

    def get_interaction_ids(self):
        """Get all interaction ids used in this exploration."""
        return list(set([
            state.interaction.id for state in self.states.itervalues()
            if state.interaction.id is not None]))


class ExplorationSummary(object):
    """Domain object for an Oppia exploration summary."""

    def __init__(self, exploration_id, title, category, objective,
                 language_code, tags, ratings, scaled_average_rating, status,
                 community_owned, owner_ids, editor_ids,
                 viewer_ids, contributor_ids, contributors_summary, version,
                 exploration_model_created_on,
                 exploration_model_last_updated,
                 first_published_msec):
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
        self.tags = tags
        self.ratings = ratings
        self.scaled_average_rating = scaled_average_rating
        self.status = status
        self.community_owned = community_owned
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.contributor_ids = contributor_ids
        self.contributors_summary = contributors_summary
        self.version = version
        self.exploration_model_created_on = exploration_model_created_on
        self.exploration_model_last_updated = exploration_model_last_updated
        self.first_published_msec = first_published_msec
