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

import collections
import copy
import logging
import re
import string

from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import gadget_registry
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import rule_domain
from core.domain import skins_services
import feconf
import jinja_utils
import utils


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
# TODO(bhenning): Answer submission events that were logged with property edits
# 'widget_handlers' should be migrated to 'answer_groups' and 'default_outcome'.
STATE_PROPERTY_PARAM_CHANGES = 'param_changes'
STATE_PROPERTY_CONTENT = 'content'
STATE_PROPERTY_INTERACTION_ID = 'widget_id'
STATE_PROPERTY_INTERACTION_CUST_ARGS = 'widget_customization_args'
STATE_PROPERTY_INTERACTION_ANSWER_GROUPS = 'answer_groups'
STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME = 'default_outcome'
# Kept for legacy purposes; not used anymore.
STATE_PROPERTY_INTERACTION_HANDLERS = 'widget_handlers'
STATE_PROPERTY_INTERACTION_STICKY = 'widget_sticky'

# This takes an additional 'state_name' parameter.
CMD_ADD_STATE = 'add_state'
# This takes additional 'old_state_name' and 'new_state_name' parameters.
CMD_RENAME_STATE = 'rename_state'
# This takes an additional 'state_name' parameter.
CMD_DELETE_STATE = 'delete_state'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_STATE_PROPERTY = 'edit_state_property'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION = (
    'migrate_states_schema_to_latest_version')


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
        STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME)

    EXPLORATION_PROPERTIES = (
        'title', 'category', 'objective', 'language_code', 'tags',
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
        - 'migrate_states_schema' (with from_version and to_version)

        For a state, property_name must be one of STATE_PROPERTIES. For an
        exploration, property_name must be one of EXPLORATION_PROPERTIES.
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


DEFAULT_RULESPEC_STR = 'Default'


class RuleSpec(object):
    """Value object representing a rule specification."""

    def to_dict(self):
        return {
            'inputs': self.inputs,
            'name': self.name,
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        return cls(
            rulespec_dict['inputs'],
            rulespec_dict['name']
        )

    def __init__(self, inputs, name):
        self.inputs = inputs
        self.name = name

    def stringify_classified_rule(self):
        """Returns a string representation of a rule (for the stats log)."""
        param_list = [utils.to_ascii(val) for
                      (key, val) in self.inputs.iteritems()]
        return '%s(%s)' % (self.name, ','.join(param_list))

    def validate(self, obj_type):
        if not isinstance(self.inputs, dict):
            raise utils.ValidationError(
                'Expected inputs to be a dict, received %s' % self.inputs)
        rules = rule_domain.get_rules_for_obj_type(obj_type)
        params = [rule.params for rule in rules]
        unvalidated_inputs = [
            input_name for input_name in self.inputs.keys()
            if input_name in params]
        if len(unvalidated_inputs) != 0:
            raise utils.ValidationError(
                'RuleSpec has inputs that are unrecognized by the rule it is '
                'represented by: %s' % unvalidated_inputs)


class InteractionOutcome(object):
    """Value object representing an outcome of an interaction. An outcome
    consists of a destination state, feedback to show the user, and any
    parameters that should be changed as a result of this outcome.
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

    def get_feedback_string(self):
        """Returns a (possibly empty) string with feedback for this rule."""
        return utils.get_random_choice(self.feedback) if self.feedback else ''

    def validate(self):
        if not isinstance(self.dest, basestring):
            raise utils.ValidationError(
                'Expected outcome dest to be a string, received %s'
                % self.dest)
        if not self.dest:
            raise utils.ValidationError(
                'Every outcome should have a destination.')

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
    rules are ORed together. Answer groups may also support fuzzy/implicit rules
    that involve soft matching of answers to a set of training data and/or
    example answers dictated by the creator.
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
            InteractionOutcome.from_dict(answer_group_dict['outcome']),
            [RuleSpec.from_dict(rs) for rs in answer_group_dict['rule_specs']],
        )

    def __init__(self, outcome, rule_specs=None):
        if rule_specs is None:
            rule_specs = []

        self.rule_specs = [RuleSpec(
            rule_spec.inputs, rule_spec.name
        ) for rule_spec in rule_specs]

        self.outcome = outcome

    def validate(self, obj_type):
        # Rule validation.
        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer group rules to be a list, received %s'
                % self.rule_specs)
        if len(self.rule_specs) < 1:
            raise utils.ValidationError(
                'There must be at least one rule for each answer group.'
                % self.rule_specs)

        for rule in self.rule_specs:
            rule.validate(obj_type)

        self.outcome.validate()


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
        interaction_dict = {
            'id': self.id,
            'customization_args': (
                {} if self.id is None
                else self._get_full_customization_args()),
            'answer_groups': [
                group.to_dict()
                for group in self.answer_groups],
            'default_outcome': (
                self.default_outcome.to_dict()
                if self.default_outcome is not None
                else None),
            'triggers': self.triggers,
        }
        return interaction_dict

    @classmethod
    def from_dict(cls, interaction_dict):
        default_outcome_dict = (
            InteractionOutcome.from_dict(interaction_dict['default_outcome'])
            if interaction_dict['default_outcome'] is not None else None)
        return cls(
            interaction_dict['id'],
            interaction_dict['customization_args'],
            [AnswerGroup.from_dict(h)
            for h in interaction_dict['answer_groups']],
            default_outcome_dict, interaction_dict['triggers'])

    def __init__(
            self, interaction_id, customization_args, answer_groups,
            default_outcome, triggers):
        self.id = interaction_id
        # Customization args for the interaction's view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        # This is a dict: the keys are names of customization_args and the
        # values are dicts with a single key, 'value', whose corresponding
        # value is the value of the customization arg.
        self.customization_args = customization_args
        # Answer groups.
        self.answer_groups = answer_groups
        self.default_outcome = default_outcome
        # TODO(sll): Create Trigger class.
        self.triggers = copy.deepcopy(triggers)

    @property
    def is_terminal(self):
        """Determines if this interaction type is terminal. If no ID is set for
        this interaction, it is assumed to not be terminal.
        """
        return self.id and interaction_registry.Registry.get_interaction_by_id(
            self.id).is_terminal

    def get_all_outcomes(self):
        """Returns a list of all outcomes of this interaction, taking into
        consideration every answer group and the default outcome.
        """
        outcomes = []
        for answer_group in self.answer_groups:
            outcomes.append(answer_group.outcome)
        if self.default_outcome is not None:
            outcomes.append(self.default_outcome)
        return outcomes

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

        if not isinstance(self.answer_groups, list):
            raise utils.ValidationError(
                'Expected answer groups to be a list, received %s.'
                % self.answer_groups)
        if not self.is_terminal and self.default_outcome is None:
            raise utils.ValidationError(
                'Non-terminal interactions must have a default outcome.')

        obj_type = (
            interaction_registry.Registry.get_interaction_by_id(
                self.id).get_submit_handler().obj_type
            if self.id is not None else None)
        for group in self.answer_groups:
            group.validate(obj_type)
        if (self.default_outcome is not None):
            self.default_outcome.validate()

        # TODO(sll): Update trigger validation.
        if not isinstance(self.triggers, list):
            raise utils.ValidationError(
                'Expected triggers to be a list, received %s'
                % self.triggers)
        if self.triggers:
            raise utils.ValidationError('Expected empty triggers list.')

    @classmethod
    def create_default_interaction(cls, default_dest_state_name):
        return cls(
            cls._DEFAULT_INTERACTION_ID,
            {}, [],
            InteractionOutcome(default_dest_state_name, [], {}), []
        )


class GadgetInstance(object):
    """Value object for an instance of a gadget."""

    def __init__(self, gadget_id, visible_in_states, customization_args):
        self.id = gadget_id

        # List of State name strings where this Gadget is visible.
        self.visible_in_states = visible_in_states

        # Customization args for the gadget's view.
        self.customization_args = customization_args

    @property
    def gadget(self):
        """Gadget spec for validation and derived properties below."""
        return gadget_registry.Registry.get_gadget_by_id(self.id)

    @property
    def width(self):
        """Width in pixels."""
        return self.gadget.get_width(self.customization_args)

    @property
    def height(self):
        """Height in pixels."""
        return self.gadget.get_height(self.customization_args)

    def validate(self):
        """Validate attributes of this GadgetInstance."""
        try:
            self.gadget
        except KeyError:
            raise utils.ValidationError(
                'Unknown gadget with ID %s is not in the registry.' % self.id)

        unknown_customization_arguments = set(
            self.customization_args.iterkeys()) - set(
                [customization_arg.name for customization_arg
                 in self.gadget.customization_arg_specs])
        if unknown_customization_arguments:
            for arg_name in unknown_customization_arguments:
                logging.warning(
                    'Gadget %s does not support customization arg %s.'
                    % (self.id, arg_name))
            del self.customization_args[arg_name]

        self.gadget.validate(self.customization_args)

        if self.visible_in_states == []:
            raise utils.ValidationError(
                '%s gadget not visible in any states.' % (
                    self.gadget.name))

        # Validate state name visibility isn't repeated within each gadget.
        if len(self.visible_in_states) != len(set(self.visible_in_states)):
            redundant_visible_states = [
                state_name for state_name, count
                in collections.Counter(self.visible_in_states).items()
                if count > 1]
            raise utils.ValidationError(
                '%s specifies visibility repeatedly for state%s: %s' % (
                    self.id,
                    's' if len(redundant_visible_states) > 1 else '',
                    ', '.join(redundant_visible_states)))

    def to_dict(self):
        """Returns GadgetInstance data represented in dict form."""
        return {
            'gadget_id': self.id,
            'visible_in_states': self.visible_in_states,
            'customization_args': self._get_full_customization_args(),
        }

    @classmethod
    def from_dict(cls, gadget_dict):
        """Returns GadgetInstance constructed from dict data."""
        return GadgetInstance(
            gadget_dict['gadget_id'],
            gadget_dict['visible_in_states'],
            gadget_dict['customization_args'])

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
        self.skin_id = skin_id
        # panel_contents_dict has gadget_panel_name strings as keys and
        # lists of GadgetInstance instances as values.
        self.panel_contents_dict = {}

        for panel_name, gdict_list in skin_customizations[
                'panels_contents'].iteritems():
            self.panel_contents_dict[panel_name] = [GadgetInstance(
                gdict['gadget_id'], gdict['visible_in_states'],
                gdict['customization_args']) for gdict in gdict_list]

    @property
    def skin(self):
        """Skin spec for validation and derived properties."""
        return skins_services.Registry.get_skin_by_id(self.skin_id)

    def validate(self):
        """Validates that gadgets fit the skin panel dimensions, and that the
        gadgets themselves are valid."""
        for panel_name, gadget_instances_list in (
                self.panel_contents_dict.iteritems()):

            # Validate existence of panels in the skin.
            if not panel_name in self.skin.panels_properties:
                raise utils.ValidationError(
                    '%s panel not found in skin %s' % (
                        panel_name, self.skin_id)
                )

            # Validate gadgets fit each skin panel.
            self.skin.validate_panel(panel_name, gadget_instances_list)

            # Validate gadget internal attributes.
            for gadget_instance in gadget_instances_list:
                gadget_instance.validate()

    def to_dict(self):
        """Returns SkinInstance data represented in dict form."""
        return {
            'skin_id': self.skin_id,
            'skin_customizations': {
                'panels_contents': {
                    panel_name: [
                        gadget_instance.to_dict() for gadget_instance
                        in instances_list]
                    for panel_name, instances_list in
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
        for gadget_instances_list in self.panel_contents_dict.values():
            for gadget_instance in gadget_instances_list:
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
        'triggers': [],
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
            interaction.answer_groups, interaction.default_outcome,
            interaction.triggers)

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

        if not allow_null_interaction and self.interaction.id is None:
            raise utils.ValidationError(
                'This state does not have any interaction specified.')
        elif self.interaction.id is not None:
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

            answer_group = AnswerGroup(InteractionOutcome.from_dict(
                answer_group_dict['outcome']))
            answer_group.outcome.feedback = [
                html_cleaner.clean(feedback)
                for feedback in answer_group.outcome.feedback]
            for rule_dict in rule_specs_list:
                rule_spec = RuleSpec.from_dict(rule_dict)

                matched_rule = (
                    interaction_registry.Registry.get_interaction_by_id(
                        self.interaction.id
                    ).get_rule_by_name(rule_spec.name))

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
        if not isinstance(default_outcome_dict, dict):
            raise Exception(
                'Expected default_outcome_dict to be a dict, received %s'
                % default_outcome_dict)
        self.interaction.default_outcome = InteractionOutcome.from_dict(
            default_outcome_dict)
        self.interaction.default_outcome.feedback = [
            html_cleaner.clean(feedback)
            for feedback in self.interaction.default_outcome.feedback]

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
                 language_code, tags, blurb, author_notes, default_skin,
                 skin_customizations, states_schema_version, init_state_name,
                 states_dict, param_specs_dict, param_changes_list, version,
                 created_on=None, last_updated=None):
        self.id = exploration_id
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.tags = tags
        self.blurb = blurb
        self.author_notes = author_notes
        self.default_skin = default_skin
        self.states_schema_version = states_schema_version
        self.init_state_name = init_state_name

        self.skin_instance = SkinInstance(default_skin, skin_customizations)

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
            'tags', 'blurb', 'author_notes', 'default_skin',
            'states_schema_version', 'init_state_name', 'version']

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
            '', 'conversation_v1', feconf.DEFAULT_SKIN_CUSTOMIZATIONS,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION,
            feconf.DEFAULT_INIT_STATE_NAME, states_dict, {}, [], 0)

    @classmethod
    def create_exploration_from_dict(
            cls, exploration_dict,
            exploration_version=0, exploration_created_on=None,
            exploration_last_updated=None):
        # NOTE TO DEVELOPERS: It is absolutely ESSENTIAL this conversion to and from
        # an ExplorationModel/dictionary MUST be exhaustive and complete.
        exploration = cls.create_default_exploration(
            exploration_dict['id'],
            exploration_dict['title'],
            exploration_dict['category'],
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
                        'param_changes': group['outcome'].get(
                            'param_changes', []),
                    },
                    'rule_specs': [{
                        'inputs': rule_spec['inputs'],
                        'name': rule_spec['name'],
                    } for rule_spec in group['rule_specs']],
                })
                for group in idict['answer_groups']]

            default_outcome = (
                InteractionOutcome.from_dict(idict['default_outcome'])
                if idict['default_outcome'] is not None else None)

            state.interaction = InteractionInstance(
                idict['id'], idict['customization_args'],
                interaction_answer_groups, default_outcome,
                idict['triggers'])

            exploration.states[state_name] = state

        exploration.default_skin = exploration_dict['default_skin']
        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]

        exploration.skin_instance = SkinInstance(
            exploration_dict['default_skin'],
            exploration_dict['skin_customizations'])

        exploration.version = exploration_version
        exploration.created_on = exploration_created_on
        exploration.last_updated = exploration_last_updated

        return exploration

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

            if re.search('\s\s+', tag):
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

        # Check that all rule definitions, destinations and param changes are
        # valid.
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
                            'The parameter %s was used in a rule, but it '
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
                interaction_outcomes = curr_state.interaction.get_all_outcomes()
                for interaction_outcome in interaction_outcomes:
                    dest_state = interaction_outcome.dest
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
        """Verifies that all states can reach a terminal state."""
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
                    interaction_outcomes = state.interaction.get_all_outcomes()
                    for interaction_outcome in interaction_outcomes:
                        if interaction_outcome.dest == curr_state_name:
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
            other_interaction_outcomes = other_state.interaction.get_all_outcomes()
            for interaction_outcome in other_interaction_outcomes:
                if interaction_outcome.dest == old_state_name:
                    interaction_outcome.dest = new_state_name

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
            interaction_outcomes = other_state.interaction.get_all_outcomes()
            for interaction_outcome in interaction_outcomes:
                if interaction_outcome.dest == state_name:
                    interaction_outcome.dest = other_state_name

        del self.states[state_name]

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
        _OLD_END_DEST = 'END'

        # Adds an explicit state called 'END' with an EndExploration to replace
        # links other states have to an implicit 'END' state. Otherwise, if no
        # states refer to a state called 'END', no new state will be introduced
        # since it would be isolated from all other states in the graph and
        # create additional warnings for the user. If they were not referring to
        # an 'END' state before, then they would only be receiving warnings
        # about not being able to complete the exploration. The introduction of
        # a real END state would produce additional warnings (state cannot be
        # reached from other states, etc.)
        targets_end_state = False
        has_end_state = False
        for (state_name, sdict) in states_dict.iteritems():
            if not has_end_state and state_name == _OLD_END_DEST:
                has_end_state = True

            if not targets_end_state:
                for handler in sdict['interaction']['handlers']:
                    for rule_spec in handler['rule_specs']:
                        if rule_spec['dest'] == _OLD_END_DEST:
                            targets_end_state = True
                            break

        # Ensure any explorations pointing to an END state has a valid END
        # state to end with (in case it expects an END state)
        if targets_end_state and not has_end_state:
            states_dict[_OLD_END_DEST] = {
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
                            'dest': _OLD_END_DEST,
                            'feedback': [],
                            'param_changes': []
                        }]
                    }],
                    'triggers': []
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
        for (state_name, sdict) in states_dict.iteritems():
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
        for (state_name, sdict) in states_dict.iteritems():
            interaction = sdict['interaction']
            answer_groups = []
            default_outcome = None
            for handler in interaction['handlers']:
                if 'name' in handler:
                    del handler['name']

                # Each rule spec becomes a new answer group.
                for rule_spec in handler['rule_specs']:
                    group = copy.deepcopy(rule_spec)

                    # Rules don't have a rule_type key anymore.
                    is_default_rule = False
                    if 'rule_type' in group['definition']:
                        rule_type = group['definition']['rule_type']
                        is_default_rule = (rule_type == 'default')
                        del group['definition']['rule_type']

                    # The rule turns into the group's only rule. Rules do not
                    # have definitions anymore. Do not copy the definition if it
                    # is a default rule.
                    if not is_default_rule:
                        definition = group['definition']
                        group['rule_specs'] = [{
                            'inputs': copy.deepcopy(definition['inputs']),
                            'name': copy.deepcopy(definition['name'])
                        }]
                    del group['definition']

                    # Answer groups now have an outcome.
                    group['outcome'] = {
                        'dest': copy.deepcopy(group['dest']),
                        'feedback': copy.deepcopy(group['feedback']),
                        'param_changes': copy.deepcopy(group['param_changes'])
                    }
                    del group['dest']
                    del group['feedback']
                    del group['param_changes']

                    if is_default_rule:
                        default_outcome = group['outcome']
                    else:
                        answer_groups.append(group)

            is_terminal = (
                interaction_registry.Registry.get_interaction_by_id(
                interaction['id']).is_terminal
                if interaction['id'] is not None else False)
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
    def update_states_v0_to_v1_from_model(cls, versioned_exploration_states):
        """Converts from states schema version 0 to 1 of the states blob
        contained in the versioned exploration states dict provided.

        Note that the versioned_exploration_states being passed in is modified
        in-place.
        """
        versioned_exploration_states['states_schema_version'] = 1
        converted_states = cls._convert_states_v0_dict_to_v1_dict(
            versioned_exploration_states['states'])
        versioned_exploration_states['states'] = converted_states

    @classmethod
    def update_states_v1_to_v2_from_model(cls, versioned_exploration_states):
        """Converts from states schema version 1 to 2 of the states blob
        contained in the versioned exploration states dict provided.

        Note that the versioned_exploration_states being passed in is modified
        in-place.
        """
        versioned_exploration_states['states_schema_version'] = 2
        converted_states = cls._convert_states_v1_dict_to_v2_dict(
            versioned_exploration_states['states'])
        versioned_exploration_states['states'] = converted_states

    @classmethod
    def update_states_v2_to_v3_from_model(cls, versioned_exploration_states):
        """Converts from states schema version 2 to 3 of the states blob
        contained in the versioned exploration states dict provided.

        Note that the versioned_exploration_states being passed in is modified
        in-place.
        """
        versioned_exploration_states['states_schema_version'] = 3
        converted_states = cls._convert_states_v2_dict_to_v3_dict(
            versioned_exploration_states['states'])
        versioned_exploration_states['states'] = converted_states

    @classmethod
    def update_states_v3_to_v4_from_model(cls, versioned_exploration_states):
        """Converts from states schema version 3 to 4 of the states blob
        contained in the versioned exploration states dict provided.

        Note that the versioned_exploration_states being passed in is modified
        in-place.
        """
        versioned_exploration_states['states_schema_version'] = 4
        converted_states = cls._convert_states_v3_dict_to_v4_dict(
            versioned_exploration_states['states'])
        versioned_exploration_states['states'] = converted_states

    # The current version of the exploration YAML schema. If any backward-
    # incompatible changes are made to the exploration schema in the YAML
    # definitions, this version number must be changed and a migration process
    # put in place.
    CURRENT_EXPLORATION_SCHEMA_VERSION = 7

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

        exploration_dict['skin_customizations'] = (
            feconf.DEFAULT_SKIN_CUSTOMIZATIONS)

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

        # Ensure the exploration is at states schema version 3 after upgrades
        exploration_dict['states_schema_version'] = 3

        return exploration_dict

    @classmethod
    def _convert_v6_dict_to_v7_dict(cls, exploration_dict):
        """Converts a v6 exploration dict into a v7 exploration dict."""
        exploration_dict['schema_version'] = 7

        # Ensure this exploration is up-to-date with states schema v4.
        exploration_dict['states'] = cls._convert_states_v3_dict_to_v4_dict(
            exploration_dict['states'])

        # Ensure the exploration is at states schema version 4 after upgrades
        exploration_dict['states_schema_version'] = 4

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

        exploration_dict['id'] = exploration_id
        exploration_dict['title'] = title
        exploration_dict['category'] = category

        return Exploration.create_exploration_from_dict(exploration_dict)

    def to_yaml(self):
        exp_dict = self.to_dict()
        exp_dict['schema_version'] = self.CURRENT_EXPLORATION_SCHEMA_VERSION

        # Remove elements from the exploration dictionary that should not be
        # saved within the YAML representation.
        del exp_dict['id']
        del exp_dict['title']
        del exp_dict['category']

        return utils.yaml_from_dict(exp_dict)

    def to_dict(self):
        """Returns a copy of the exploration as a dictionary. It includes all
        necessary information to represent the exploration."""
        return copy.deepcopy({
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'author_notes': self.author_notes,
            'blurb': self.blurb,
            'default_skin': self.default_skin,
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
        learner view."""
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
        }

    def get_gadget_ids(self):
        """Get all gadget ids used in this exploration."""
        result = set()
        for gadget_instances_list in (
                self.skin_instance.panel_contents_dict.itervalues()):
            result.update([
                gadget_instance.id for gadget_instance
                in gadget_instances_list])
        return sorted(result)

    def get_interaction_ids(self):
        """Get all interaction ids used in this exploration."""
        return list(set([
            state.interaction.id for state in self.states.itervalues()]))


class ExplorationSummary(object):
    """Domain object for an Oppia exploration summary."""

    def __init__(self, exploration_id, title, category, objective,
                 language_code, tags, ratings, status,
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
        self.tags = tags
        self.ratings = ratings
        self.status = status
        self.community_owned = community_owned
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.version = version
        self.exploration_model_created_on = exploration_model_created_on
        self.exploration_model_last_updated = exploration_model_last_updated
