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

import copy
import logging
import re
import string

from constants import constants
from core.domain import html_cleaner
from core.domain import interaction_registry
from core.domain import param_domain
from core.platform import models
import feconf
import jinja_utils
import schema_utils
import utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


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
STATE_PROPERTY_INTERACTION_HINTS = 'hints'
STATE_PROPERTY_INTERACTION_SOLUTION = 'solution'
# These four properties are kept for legacy purposes and are not used anymore.
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
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION = (
    'migrate_states_schema_to_latest_version')

# These are categories to which answers may be classified. These values should
# not be changed because they are persisted in the data store within answer
# logs.

# Represents answers classified using rules defined as part of an interaction.
EXPLICIT_CLASSIFICATION = 'explicit'
# Represents answers which are contained within the training data of an answer
# group.
TRAINING_DATA_CLASSIFICATION = 'training_data_match'
# Represents answers which were predicted using a statistical training model
# from training data within an answer group.
STATISTICAL_CLASSIFICATION = 'statistical_classifier'
# Represents answers which led to the 'default outcome' of an interaction,
# rather than belonging to a specific answer group.
DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome'


def _get_full_customization_args(customization_args, ca_specs):
    """Populates the given customization_args dict with default values
    if any of the expected customization_args are missing.

    Args:
        customization_args: dict. The customization dict. The keys are names of
            customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs: list(dict). List of spec dictionaries. Is used to check if
            some keys are missing in customization_args. Dicts have the
            following structure:
                - name: str. The customization variable name.
                - description: str. The customization variable description.
                - default_value: *. The default value of the customization
                    variable.

    Returns:
        dict. The customization_args dict where missing keys are populated with
        the default values.
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
    in 'ca_specs_to_validate_against'. 'item_name' and 'item_type' are used to
    populate any error messages that arise during validation.
    Note that this may modify the given customization_args dict, if it has
    extra or missing keys. It also normalizes any HTML in the
    customization_args dict.

    Args:
        item_name: str. This is always 'interaction'.
        item_type: str. The item_type is the ID of the interaction.
        customization_args: dict. The customization dict. The keys are names of
            customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs_to_validate_against: list(dict). List of spec dictionaries. Is
            used to check if some keys are missing in customization_args. Dicts
            have the following structure:
                - name: str. The customization variable name.
                - description: str. The customization variable description.
                - default_value: *. The default value of the customization
                    variable.

    Raises:
        ValidationError: The given 'customization_args' is not valid.
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
            customization_args[ca_spec.name]['value'] = (
                schema_utils.normalize_against_schema(
                    customization_args[ca_spec.name]['value'],
                    ca_spec.schema))
        except Exception:
            # TODO(sll): Raise an actual exception here if parameters are not
            # involved (If they are, can we get sample values for the state
            # context parameters?).
            pass


class ExplorationChange(object):
    """Domain object class for an exploration change.

    IMPORTANT: Ensure that all changes to this class (and how these cmds are
    interpreted in general) preserve backward-compatibility with the
    exploration snapshots in the datastore. Do not modify the definitions of
    cmd keys that already exist.

    NOTE TO DEVELOPERS: Please note that, for a brief period around
    Feb - Apr 2017, change dicts related to editing of answer groups
    accidentally stored the old_value using a ruleSpecs key instead of a
    rule_specs key. So, if you are making use of this data, make sure to
    verify the format of the old_value before doing any processing.
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
        STATE_PROPERTY_INTERACTION_HINTS,
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_UNCLASSIFIED_ANSWERS)

    EXPLORATION_PROPERTIES = (
        'title', 'category', 'objective', 'language_code', 'tags',
        'blurb', 'author_notes', 'param_specs', 'param_changes',
        'init_state_name', 'auto_tts_enabled', 'correctness_feedback_enabled')

    def __init__(self, change_dict):
        """Initializes an ExplorationChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd' key
                and one or more other keys. The keys depend on what the value
                for 'cmd' is. The possible values for 'cmd' are listed below,
                together with the other keys in the dict:
                    - 'add_state' (with state_name)
                    - 'rename_state' (with old_state_name and new_state_name)
                    - 'delete_state' (with state_name)
                    - 'edit_state_property' (with state_name, property_name,
                        new_value and, optionally, old_value)
                    - 'edit_exploration_property' (with property_name,
                        new_value and, optionally, old_value)
                    - 'migrate_states_schema' (with from_version, to_version)
                For a state, property_name must be one of STATE_PROPERTIES.
                For an exploration, property_name must be one of
                EXPLORATION_PROPERTIES.

        Raises:
            Exception: The given change_dict is not valid.
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
        """Initializes a ExplorationCommitLogEntry domain object.

        Args:
            created_on: datetime.datetime. Date and time when the exploration
                commit was created.
            last_updated: datetime.datetime. Date and time when the exploration
                commit was last updated.
            user_id: str. User id of the user who has made the commit.
            username: str. Username of the user who has made the commit.
            exploration_id: str. Id of the exploration.
            commit_type: str. The type of commit.
            commit_message: str. A description of changes made to the
                exploration.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains the following
                key:
                    - cmd: str. Unique command.
                and then additional arguments for that command.
            version: int. The version of the exploration after the commit.
            post_commit_status: str. The new exploration status after the
                commit.
            post_commit_community_owned: bool. Whether the exploration is
                community-owned after the edit event.
            post_commit_is_private: bool. Whether the exploration is private
                after the edit event.
        """
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
        """Returns a dict representing this ExplorationCommitLogEntry domain
        object. This omits created_on, user_id and commit_cmds.

        Returns:
            dict. A dict, mapping all fields of ExplorationCommitLogEntry
            instance, except created_on, user_id and commit_cmds fields.
        """
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


class AudioTranslation(object):
    """Value object representing an audio translation."""

    def to_dict(self):
        """Returns a dict representing this AudioTranslation domain object.

        Returns:
            dict. A dict, mapping all fields of AudioTranslation instance.
        """
        return {
            'filename': self.filename,
            'file_size_bytes': self.file_size_bytes,
            'needs_update': self.needs_update,
        }

    @classmethod
    def from_dict(cls, audio_translation_dict):
        """Return a AudioTranslation domain object from a dict.

        Args:
            audio_translation_dict: dict. The dict representation of
                AudioTranslation object.

        Returns:
            AudioTranslation. The corresponding AudioTranslation domain object.
        """
        return cls(
            audio_translation_dict['filename'],
            audio_translation_dict['file_size_bytes'],
            audio_translation_dict['needs_update'])

    def __init__(self, filename, file_size_bytes, needs_update):
        """Initializes a AudioTranslation domain object.

        Args:
            filename: str. The corresponding audio file path.
            file_size_bytes: int. The file size, in bytes. Used to display
                potential bandwidth usage to the learner before they download
                the file.
            needs_update: bool. Whether audio is marked for needing review.
        """
        # str. The corresponding audio file path, e.g.
        # "content-en-2-h7sjp8s.mp3".
        self.filename = filename
        # int. The file size, in bytes. Used to display potential bandwidth
        # usage to the learner before they download the file.
        self.file_size_bytes = file_size_bytes
        # bool. Whether audio is marked for needing review.
        self.needs_update = needs_update

    def validate(self):
        """Validates properties of the Content.

        Raises:
            ValidationError: One or more attributes of the AudioTranslation are
            invalid.
        """
        if not isinstance(self.filename, basestring):
            raise utils.ValidationError(
                'Expected audio filename to be a string, received %s' %
                self.filename)
        dot_index = self.filename.rfind('.')
        if dot_index == -1 or dot_index == 0:
            raise utils.ValidationError(
                'Invalid audio filename: %s' % self.filename)
        extension = self.filename[dot_index + 1:]
        if extension not in feconf.ACCEPTED_AUDIO_EXTENSIONS:
            raise utils.ValidationError(
                'Invalid audio filename: it should have one of '
                'the following extensions: %s. Received: %s',
                (feconf.ACCEPTED_AUDIO_EXTENSIONS.keys(), self.filename))

        if not isinstance(self.file_size_bytes, int):
            raise utils.ValidationError(
                'Expected file size to be an int, received %s' %
                self.file_size_bytes)
        if self.file_size_bytes <= 0:
            raise utils.ValidationError(
                'Invalid file size: %s' % self.file_size_bytes)

        if not isinstance(self.needs_update, bool):
            raise utils.ValidationError(
                'Expected needs_update to be a bool, received %s' %
                self.needs_update)


class ExpVersionReference(object):
    """Value object representing an exploration ID and a version number."""

    def __init__(self, exp_id, version):
        """Initializes an ExpVersionReference domain object.

        Args:
            exp_id: str. ID of the exploration.
            version: int. Version of the exploration.
        """
        self.exp_id = exp_id
        self.version = version
        self.validate()

    def to_dict(self):
        """Returns a dict representing this ExpVersionReference domain object.

        Returns:
            dict. A dict, mapping all fields of ExpVersionReference instance.
        """
        return {
            'exp_id': self.exp_id,
            'version': self.version
        }

    def validate(self):
        """Validates properties of the ExpVersionReference.

        Raises:
            ValidationError: One or more attributes of the ExpVersionReference
            are invalid.
        """
        if not isinstance(self.exp_id, str):
            raise utils.ValidationError(
                'Expected exp_id to be a str, received %s' % self.exp_id)

        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be an int, received %s' % self.version)


class SubtitledHtml(object):
    """Value object representing subtitled HTML."""

    DEFAULT_SUBTITLED_HTML_DICT = {
        'html': '',
        'audio_translations': {}
    }

    def __init__(self, html, audio_translations):
        """Initializes a SubtitledHtml domain object.

        Args:
            html: str. A piece of user submitted HTML. This is cleaned in such
                a way as to contain a restricted set of HTML tags.
            audio_translations: dict(str: AudioTranslation). Dict mapping
                language codes (such as "en" or "hi") to AudioTranslation
                domain objects. Hybrid languages will be represented using
                composite language codes, such as "hi-en" for Hinglish.
        """
        self.html = html_cleaner.clean(html)
        self.audio_translations = audio_translations
        self.validate()

    def to_dict(self):
        """Returns a dict representing this SubtitledHtml domain object.

        Returns:
            dict. A dict, mapping all fields of SubtitledHtml instance.
        """
        return {
            'html': self.html,
            'audio_translations': {
                language_code: audio_translation.to_dict()
                for language_code, audio_translation
                in self.audio_translations.iteritems()
            }
        }

    @classmethod
    def from_dict(cls, subtitled_html_dict):
        """Return a SubtitledHtml domain object from a dict.

        Args:
            subtitled_html_dict: dict. The dict representation of SubtitledHtml
                object.

        Returns:
            SubtitledHtml. The corresponding SubtitledHtml domain object.
        """
        return cls(subtitled_html_dict['html'], {
            language_code: AudioTranslation.from_dict(audio_translation_dict)
            for language_code, audio_translation_dict in
            subtitled_html_dict['audio_translations'].iteritems()
        })

    def validate(self):
        """Validates properties of the SubtitledHtml.

        Raises:
            ValidationError: One or more attributes of the SubtitledHtml are
            invalid.
        """
        # TODO(sll): Add HTML sanitization checking.
        # TODO(sll): Validate customization args for rich-text components.
        if not isinstance(self.html, basestring):
            raise utils.ValidationError(
                'Invalid content HTML: %s' % self.html)

        if not isinstance(self.audio_translations, dict):
            raise utils.ValidationError(
                'Expected audio_translations to be a dict, received %s'
                % self.audio_translations)

        allowed_audio_language_codes = [
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES]
        for language_code, translation in self.audio_translations.iteritems():
            if not isinstance(language_code, basestring):
                raise utils.ValidationError(
                    'Expected language code to be a string, received: %s' %
                    language_code)

            if language_code not in allowed_audio_language_codes:
                raise utils.ValidationError(
                    'Unrecognized language code: %s' % language_code)

            translation.validate()

    def to_html(self, params):
        """Exports this SubtitledHTML object to an HTML string. The HTML is
        parameterized using the parameters in `params`.

        Args:
            params: dict. The keys are the parameter names and the values are
                the values of parameters.

        Raises:
            Exception: 'params' is not a dict.
        """
        if not isinstance(params, dict):
            raise Exception(
                'Expected context params for parsing subtitled HTML to be a '
                'dict, received %s' % params)

        return html_cleaner.clean(jinja_utils.parse_string(self.html, params))

    @classmethod
    def create_default_subtitled_html(cls):
        """Create a default SubtitledHtml domain object."""
        return cls('', {})


class RuleSpec(object):
    """Value object representing a rule specification."""

    def to_dict(self):
        """Returns a dict representing this RuleSpec domain object.

        Returns:
            dict. A dict, mapping all fields of RuleSpec instance.
        """
        return {
            'rule_type': self.rule_type,
            'inputs': self.inputs,
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        """Return a RuleSpec domain object from a dict.

        Args:
            rulespec_dict: dict. The dict representation of RuleSpec object.

        Returns:
            RuleSpec. The corresponding RuleSpec domain object.
        """
        return cls(
            rulespec_dict['rule_type'],
            rulespec_dict['inputs']
        )

    def __init__(self, rule_type, inputs):
        """Initializes a RuleSpec domain object.

        Args:
            rule_type: str. The rule type, e.g. "CodeContains" or "Equals". A
                full list of rule types can be found in
                extensions/interactions/rule_templates.json.
            inputs: dict. The values of the parameters needed in order to fully
                specify the rule. The keys for this dict can be deduced from
                the relevant description field in
                extensions/interactions/rule_templates.json -- they are
                enclosed in {{...}} braces.
        """
        self.rule_type = rule_type
        self.inputs = inputs

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
                    1: The typed object instance for that
                        parameter (e.g. Real).
            exp_param_specs_dict: A dict of specified parameters used in this
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type). RuleSpec
                inputs may have a parameter value which refers to one of these
                exploration parameters.

        Raises:
            ValidationError: One or more attributes of the RuleSpec are
            invalid.
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
        """Returns a dict representing this Outcome domain object.

        Returns:
            dict. A dict, mapping all fields of Outcome instance.
        """
        return {
            'dest': self.dest,
            'feedback': self.feedback.to_dict(),
            'labelled_as_correct': self.labelled_as_correct,
            'param_changes': [
                param_change.to_dict() for param_change in self.param_changes],
            'refresher_exploration_id': self.refresher_exploration_id,
        }

    @classmethod
    def from_dict(cls, outcome_dict):
        """Return a Outcome domain object from a dict.

        Args:
            outcome_dict: dict. The dict representation of Outcome object.

        Returns:
            Outcome. The corresponding Outcome domain object.
        """
        return cls(
            outcome_dict['dest'],
            SubtitledHtml.from_dict(outcome_dict['feedback']),
            outcome_dict['labelled_as_correct'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in outcome_dict['param_changes']],
            outcome_dict['refresher_exploration_id'],
        )

    def __init__(
            self, dest, feedback, labelled_as_correct, param_changes,
            refresher_exploration_id):
        """Initializes a Outcome domain object.

        Args:
            dest: str. The name of the destination state.
            feedback: SubtitledHtml. Feedback to give to the user if this rule
                is triggered.
            labelled_as_correct: bool. Whether this outcome has been labelled
                by the creator as corresponding to a "correct" answer.
            param_changes: list(ParamChange). List of exploration-level
                parameter changes to make if this rule is triggered.
            refresher_exploration_id: str or None. An optional exploration ID
                to redirect the learner to if they seem to lack understanding
                of a prerequisite concept. This should only exist if the
                destination state for this outcome is a self-loop.
        """
        # Id of the destination state.
        # TODO(sll): Check that this state actually exists.
        self.dest = dest
        # Feedback to give the reader if this rule is triggered.
        self.feedback = feedback
        # Whether this outcome has been labelled by the creator as
        # corresponding to a "correct" answer.
        self.labelled_as_correct = labelled_as_correct
        # Exploration-level parameter changes to make if this rule is
        # triggered.
        self.param_changes = param_changes or []
        # An optional exploration ID to redirect the learner to if they lack
        # understanding of a prerequisite concept. This should only exist if
        # the destination state for this outcome is a self-loop.
        self.refresher_exploration_id = refresher_exploration_id

    def validate(self):
        """Validates various properties of the Outcome.

        Raises:
            ValidationError: One or more attributes of the Outcome are invalid.
        """
        if not self.dest:
            raise utils.ValidationError(
                'Every outcome should have a destination.')
        if not isinstance(self.dest, basestring):
            raise utils.ValidationError(
                'Expected outcome dest to be a string, received %s'
                % self.dest)

        self.feedback.validate()

        if not isinstance(self.labelled_as_correct, bool):
            raise utils.ValidationError(
                'The "labelled_as_correct" field should be a boolean, received '
                '%s' % self.labelled_as_correct)

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected outcome param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

        if self.refresher_exploration_id is not None:
            if not isinstance(self.refresher_exploration_id, basestring):
                raise utils.ValidationError(
                    'Expected outcome refresher_exploration_id to be a string, '
                    'received %s' % self.refresher_exploration_id)


class AnswerGroup(object):
    """Value object for an answer group. Answer groups represent a set of rules
    dictating whether a shared feedback should be shared with the user. These
    rules are ORed together. Answer groups may also support a classifier
    that involve soft matching of answers to a set of training data and/or
    example answers dictated by the creator.
    """
    def to_dict(self):
        """Returns a dict representing this AnswerGroup domain object.

        Returns:
            dict. A dict, mapping all fields of AnswerGroup instance.
        """
        return {
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs],
            'outcome': self.outcome.to_dict(),
            'training_data': self.training_data
        }

    @classmethod
    def from_dict(cls, answer_group_dict):
        """Return a AnswerGroup domain object from a dict.

        Args:
            answer_group_dict: dict. The dict representation of AnswerGroup
                object.

        Returns:
            AnswerGroup. The corresponding AnswerGroup domain object.
        """
        return cls(
            Outcome.from_dict(answer_group_dict['outcome']),
            [RuleSpec.from_dict(rs) for rs in answer_group_dict['rule_specs']],
            answer_group_dict['training_data']
        )

    def __init__(self, outcome, rule_specs, training_data):
        """Initializes a AnswerGroup domain object.

        Args:
            outcome: Outcome. The outcome corresponding to the answer group.
            rule_specs: list(RuleSpec). List of rule specifications.
            training_data: list(*). List of answers belonging to training
                data of this answer group.
        """
        self.rule_specs = [RuleSpec(
            rule_spec.rule_type, rule_spec.inputs
        ) for rule_spec in rule_specs]

        self.outcome = outcome
        self.training_data = training_data

    def validate(self, interaction, exp_param_specs_dict):
        """Verifies that all rule classes are valid, and that the AnswerGroup
        only has one classifier rule.

        Args:
            exp_param_specs_dict: dict. A dict of all parameters used in the
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type).

        Raises:
            ValidationError: One or more attributes of the AnswerGroup are
                invalid.
            ValidationError: The AnswerGroup contains more than one classifier
                rule.
        """
        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer group rules to be a list, received %s'
                % self.rule_specs)

        if len(self.rule_specs) == 0 and len(self.training_data) == 0:
            raise utils.ValidationError(
                'There must be at least one rule or training data for each'
                ' answer group.')

        for rule_spec in self.rule_specs:
            if rule_spec.rule_type not in interaction.rules_dict:
                raise utils.ValidationError(
                    'Unrecognized rule type: %s' % rule_spec.rule_type)

            rule_spec.validate(
                interaction.get_rule_param_list(rule_spec.rule_type),
                exp_param_specs_dict)

        self.outcome.validate()


class Hint(object):
    """Value object representing a hint."""

    def __init__(self, hint_content):
        """Constructs a Hint domain object.

        Args:
            hint_content: SubtitledHtml. The hint text and audio translations.
        """
        self.hint_content = hint_content

    def to_dict(self):
        """Returns a dict representing this Hint domain object.

        Returns:
            dict. A dict mapping the field of Hint instance.
        """
        return {
            'hint_content': self.hint_content.to_dict(),
        }

    @classmethod
    def from_dict(cls, hint_dict):
        """Return a Hint domain object from a dict.

        Args:
            hint_dict: dict. The dict representation of Hint object.

        Returns:
            Hint. The corresponding Hint domain object.
        """
        return cls(SubtitledHtml.from_dict(hint_dict['hint_content']))

    def validate(self):
        """Validates all properties of Hint."""
        self.hint_content.validate()


class Solution(object):
    """Value object representing a solution.

    A solution consists of answer_is_exclusive, correct_answer and an
    explanation.When answer_is_exclusive is True, this indicates that it is
    the only correct answer; when it is False, this indicates that it is one
    possible answer. correct_answer records an answer that enables the learner
    to progress to the next card and explanation is an HTML string containing
    an explanation for the solution.
    """
    def __init__(self, interaction_id, answer_is_exclusive,
                 correct_answer, explanation):
        """Constructs a Solution domain object.

        Args:
            interaction_id: str. The interaction id.
            answer_is_exclusive: bool. True if is the only correct answer;
                False if is one of possible answer.
            correct_answer: str. The correct answer; this answer enables the
                learner to progress to the next card.
            explanation: SubtitledHtml. Contains text and audio translations for
                the solution's explanation.
        """
        self.answer_is_exclusive = answer_is_exclusive
        self.correct_answer = (
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(correct_answer))
        self.explanation = explanation

    def to_dict(self):
        """Returns a dict representing this Solution domain object.

        Returns:
            dict. A dict mapping all fields of Solution instance.
        """
        return {
            'answer_is_exclusive': self.answer_is_exclusive,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation.to_dict(),
        }

    @classmethod
    def from_dict(cls, interaction_id, solution_dict):
        """Return a Solution domain object from a dict.

        Args:
            interaction_id: str. The interaction id.
            solution_dict: dict. The dict representation of Solution object.

        Returns:
            Solution. The corresponding Solution domain object.
        """
        return cls(
            interaction_id,
            solution_dict['answer_is_exclusive'],
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(
                    solution_dict['correct_answer']),
            SubtitledHtml.from_dict(solution_dict['explanation']))

    def validate(self, interaction_id):
        """Validates all properties of Solution.

        Args:
            interaction_id: str. The interaction id.

        Raises:
            ValidationError: One or more attributes of the Solution are not
            valid.
        """
        if not isinstance(self.answer_is_exclusive, bool):
            raise utils.ValidationError(
                'Expected answer_is_exclusive to be bool, received %s' %
                self.answer_is_exclusive)
        interaction_registry.Registry.get_interaction_by_id(
            interaction_id).normalize_answer(self.correct_answer)
        self.explanation.validate()


class InteractionInstance(object):
    """Value object for an instance of an interaction."""

    # The default interaction used for a new state.
    _DEFAULT_INTERACTION_ID = None

    def to_dict(self):
        """Returns a dict representing this InteractionInstance domain object.

        Returns:
            dict. A dict mapping all fields of InteractionInstance instance.
        """
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
            'hints': [hint.to_dict() for hint in self.hints],
            'solution': self.solution.to_dict() if self.solution else None,
        }

    @classmethod
    def from_dict(cls, interaction_dict):
        """Return a InteractionInstance domain object from a dict.

        Args:
            interaction_dict: dict. The dict representation of
                InteractionInstance object.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object.
        """
        default_outcome_dict = (
            Outcome.from_dict(interaction_dict['default_outcome'])
            if interaction_dict['default_outcome'] is not None else None)
        solution_dict = (
            Solution.from_dict(
                interaction_dict['id'], interaction_dict['solution'])
            if interaction_dict['solution'] else None)

        return cls(
            interaction_dict['id'],
            interaction_dict['customization_args'],
            [AnswerGroup.from_dict(h)
             for h in interaction_dict['answer_groups']],
            default_outcome_dict,
            interaction_dict['confirmed_unclassified_answers'],
            [Hint.from_dict(h) for h in interaction_dict['hints']],
            solution_dict)

    def __init__(
            self, interaction_id, customization_args, answer_groups,
            default_outcome, confirmed_unclassified_answers, hints, solution):
        """Initializes a InteractionInstance domain object.

        Args:
            interaction_id: str. The interaction id.
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.
            default_outcome: Outcome. The default outcome of the interaction
                instance.
            confirmed_unclassified_answers: list(AnswerGroup). List of answers
                which have been confirmed to be associated with the default
                outcome.
            hints: list(Hint). List of hints for this interaction.
            solution: Solution. A possible solution for the question asked in
                this interaction.
        """
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
        self.hints = hints
        self.solution = solution

    @property
    def is_terminal(self):
        """Determines if this interaction type is terminal. If no ID is set for
        this interaction, it is assumed to not be terminal.

        Returns:
            bool. Whether the interaction is terminal.
        """
        return self.id and interaction_registry.Registry.get_interaction_by_id(
            self.id).is_terminal

    def get_all_outcomes(self):
        """Returns a list of all outcomes of this interaction, taking into
        consideration every answer group and the default outcome.

        Returns:
            list(Outcome). List of all outcomes of this interaction.
        """
        outcomes = []
        for answer_group in self.answer_groups:
            outcomes.append(answer_group.outcome)
        if self.default_outcome is not None:
            outcomes.append(self.default_outcome)
        return outcomes

    def validate(self, exp_param_specs_dict):
        """Validates various properties of the InteractionInstance.

        Args:
            exp_param_specs_dict: dict. A dict of specified parameters used in
                the exploration. Keys are parameter names and values are
                ParamSpec value objects with an object type property(obj_type).
                Is used to validate AnswerGroup objects.

        Raises:
            ValidationError: One or more attributes of the InteractionInstance
            are invalid.
        """
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

        for answer_group in self.answer_groups:
            answer_group.validate(interaction, exp_param_specs_dict)
        if self.default_outcome is not None:
            self.default_outcome.validate()

        if not isinstance(self.hints, list):
            raise utils.ValidationError(
                'Expected hints to be a list, received %s'
                % self.hints)
        for hint in self.hints:
            hint.validate()

        if self.solution:
            self.solution.validate(self.id)

        if self.solution and not self.hints:
            raise utils.ValidationError(
                'Hint(s) must be specified if solution is specified')

    @classmethod
    def create_default_interaction(cls, default_dest_state_name):
        """Create a default InteractionInstance domain object:
            - customization_args: empty dictionary;
            - answer_groups: empty list;
            - default_outcome: dest is set to 'default_dest_state_name' and
                feedback and param_changes are initialized as empty lists;
            - confirmed_unclassified_answers: empty list;

        Args:
            default_dest_state_name: str. The default destination state.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object with default values.
        """
        default_outcome = Outcome(
            default_dest_state_name,
            SubtitledHtml.create_default_subtitled_html(), False, {}, None)
        return cls(
            cls._DEFAULT_INTERACTION_ID, {}, [], default_outcome, [], [], {})


class State(object):
    """Domain object for a state."""

    NULL_INTERACTION_DICT = {
        'id': None,
        'customization_args': {},
        'answer_groups': [],
        'default_outcome': {
            'dest': feconf.DEFAULT_INIT_STATE_NAME,
            'feedback': SubtitledHtml.DEFAULT_SUBTITLED_HTML_DICT,
            'labelled_as_correct': False,
            'param_changes': [],
            'refresher_exploration_id': None,
        },
        'confirmed_unclassified_answers': [],
        'hints': [],
        'solution': None,
    }

    def __init__(self, content, param_changes, interaction,
                 classifier_model_id=None):
        """Initializes a State domain object.

        Args:
            content: list(Content). The contents displayed to the reader in
                this state. This list must have only one element.
            param_changes: list(ParamChange). Parameter changes associated with
                this state.
            interaction: InteractionInstance. The interaction instance
                associated with this state.
            classifier_model_id: str or None. The classifier model ID
                associated with this state, if applicable.
        """
        # The content displayed to the reader in this state.
        self.content = content
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args
        ) for param_change in param_changes]
        # The interaction instance associated with this state.
        self.interaction = InteractionInstance(
            interaction.id, interaction.customization_args,
            interaction.answer_groups, interaction.default_outcome,
            interaction.confirmed_unclassified_answers,
            interaction.hints, interaction.solution)
        self.classifier_model_id = classifier_model_id

    def validate(self, exp_param_specs_dict, allow_null_interaction):
        """Validates various properties of the State.

        Args:
            exp_param_specs_dict: dict or None. A dict of specified parameters
                used in this exploration. Keys are parameter names and values
                are ParamSpec value objects with an object type
                property(obj_type). It is None if the state belongs to a
                question.
            allow_null_interaction. bool. Whether this state's interaction is
                allowed to be unspecified.

        Raises:
            ValidationError: One or more attributes of the State are invalid.
        """
        self.content.validate()

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

    def get_training_data(self):
        """Retrieves training data from the State domain object."""
        exploration_training_data = []
        for (answer_group_index, answer_group) in enumerate(
                self.interaction.answer_groups):
            if answer_group.training_data:
                answers = copy.deepcopy(answer_group.training_data)
                exploration_training_data.append({
                    'answer_group_index': answer_group_index,
                    'answers': answers
                })
        return exploration_training_data

    def can_undergo_classification(self):
        """Checks whether the answers for this state satisfy the preconditions
        for a ML model to be trained.

        Returns:
            bool: True, if the conditions are satisfied.
        """
        training_examples_count = 0
        labels_count = 0
        training_examples_count += len(
            self.interaction.confirmed_unclassified_answers)
        for answer_group in self.interaction.answer_groups:
            training_examples_count += len(answer_group.training_data)
            labels_count += 1
        if ((training_examples_count >= feconf.MIN_TOTAL_TRAINING_EXAMPLES) and
                (labels_count >= feconf.MIN_ASSIGNED_LABELS)):
            return True
        return False

    def update_content(self, content_dict):
        """Update the list of Content of this state.

        Args:
            content_dict. dict. The dict representation of SubtitledHtml
                object.
        """
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = SubtitledHtml.from_dict(content_dict)

    def update_param_changes(self, param_change_dicts):
        """Update the param_changes dict attribute.

        Args:
            param_change_dicts. list(dict). List of param_change dicts that
                represent ParamChange domain object.
        """
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_change_dicts]

    def update_interaction_id(self, interaction_id):
        """Update the interaction id attribute.

        Args:
            interaction_id. str. The new interaction id to set.
        """
        self.interaction.id = interaction_id
        # TODO(sll): This should also clear interaction.answer_groups (except
        # for the default rule). This is somewhat mitigated because the client
        # updates interaction_answer_groups directly after this, but we should
        # fix it.

    def update_interaction_customization_args(self, customization_args):
        """Update the customization_args of InteractionInstance domain object.

        Args:
            customization_args. dict. The new customization_args to set.
        """
        self.interaction.customization_args = customization_args

    def update_interaction_answer_groups(self, answer_groups_list):
        """Update the list of AnswerGroup in IteractioInstancen domain object.

        Args:
            answer_groups_list. list(dict). List of dicts that represent
                AnswerGroup domain object.
        """
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

            answer_group = AnswerGroup(
                Outcome.from_dict(answer_group_dict['outcome']), [],
                answer_group_dict['training_data'])
            for rule_dict in rule_specs_list:
                rule_spec = RuleSpec.from_dict(rule_dict)

                # Normalize and store the rule params.
                rule_inputs = rule_spec.inputs
                if not isinstance(rule_inputs, dict):
                    raise Exception(
                        'Expected rule_inputs to be a dict, received %s'
                        % rule_inputs)
                for param_name, value in rule_inputs.iteritems():
                    param_type = (
                        interaction_registry.Registry.get_interaction_by_id(
                            self.interaction.id
                        ).get_rule_param_type(rule_spec.rule_type, param_name))

                    if (isinstance(value, basestring) and
                            '{{' in value and '}}' in value):
                        # TODO(jacobdavis11): Create checks that all parameters
                        # referred to exist and have the correct types.
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
        """Update the default_outcome of InteractionInstance domain object.

        Args:
            default_outcome_dict. dict. Dict that represents Outcome domain
                object.
        """
        if default_outcome_dict:
            if not isinstance(default_outcome_dict, dict):
                raise Exception(
                    'Expected default_outcome_dict to be a dict, received %s'
                    % default_outcome_dict)
            self.interaction.default_outcome = Outcome.from_dict(
                default_outcome_dict)

        else:
            self.interaction.default_outcome = None

    def update_interaction_confirmed_unclassified_answers(
            self, confirmed_unclassified_answers):
        """Update the confirmed_unclassified_answers of IteractionInstance
        domain object.

        Args:
            confirmed_unclassified_answers. list(AnswerGroup). The new list of
                answers which have been confirmed to be associated with the
                default outcome.

        Raises:
            Exception: 'confirmed_unclassified_answers' is not a list.
        """
        if not isinstance(confirmed_unclassified_answers, list):
            raise Exception(
                'Expected confirmed_unclassified_answers to be a list,'
                ' received %s' % confirmed_unclassified_answers)
        self.interaction.confirmed_unclassified_answers = (
            confirmed_unclassified_answers)

    def update_interaction_hints(self, hints_list):
        """Update the list of hints.

        Args:
            hint_list: list(dict). A list of dict; each dict represents a Hint
                object.

        Raises:
            Exception: 'hint_list' is not a list.
        """
        if not isinstance(hints_list, list):
            raise Exception(
                'Expected hints_list to be a list, received %s'
                % hints_list)
        self.interaction.hints = [
            Hint.from_dict(hint_dict)
            for hint_dict in hints_list]

    def update_interaction_solution(self, solution_dict):
        """Update the solution of interaction.

        Args:
            solution_dict: dict or None. The dict representation of
                Solution object.

        Raises:
            Exception: 'solution_dict' is not a dict.
        """
        if solution_dict is not None:
            if not isinstance(solution_dict, dict):
                raise Exception(
                    'Expected solution to be a dict, received %s'
                    % solution_dict)
            self.interaction.solution = Solution.from_dict(
                self.interaction.id, solution_dict)
        else:
            self.interaction.solution = None

    def add_hint(self, hint_content):
        """Add a new hint to the list of hints.

        Args:
            hint_content: str. The hint text.
        """
        self.interaction.hints.append(Hint(hint_content))

    def delete_hint(self, index):
        """Delete a hint from the list of hints.

        Args:
            index: int. The position of the hint in the list of hints.

        Raises:
            IndexError: Index is less than 0.
            IndexError: Index is greater than or equal than the length of hints
                list.
        """
        if index < 0 or index >= len(self.interaction.hints):
            raise IndexError('Hint index out of range')
        del self.interaction.hints[index]

    def to_dict(self):
        """Returns a dict representing this State domain object.

        Returns:
            dict. A dict mapping all fields of State instance.
        """
        return {
            'content': self.content.to_dict(),
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'interaction': self.interaction.to_dict(),
            'classifier_model_id': self.classifier_model_id,
        }

    @classmethod
    def from_dict(cls, state_dict):
        """Return a State domain object from a dict.

        Args:
            state_dict: dict. The dict representation of State object.

        Returns:
            State. The corresponding State domain object.
        """
        return cls(
            SubtitledHtml.from_dict(state_dict['content']),
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            InteractionInstance.from_dict(state_dict['interaction']),
            state_dict['classifier_model_id'],
        )

    @classmethod
    def create_default_state(
            cls, default_dest_state_name, is_initial_state=False):
        """Return a State domain object with default value.

        Args:
            default_dest_state_name: str. The default destination state.
            is_initial_state: bool. Whether this state represents the initial
                state of an exploration.

        Returns:
            State. The corresponding State domain object.
        """
        content_html = (
            feconf.DEFAULT_INIT_STATE_CONTENT_STR if is_initial_state else '')
        return cls(
            SubtitledHtml(content_html, {}),
            [],
            InteractionInstance.create_default_interaction(
                default_dest_state_name))


class ExplorationVersionsDiff(object):
    """Domain object for the difference between two versions of an Oppia
    exploration.

    Attributes:
        added_state_names: list(str). Name of the states added to the
            exploration from prev_exp_version to current_exp_version.
        deleted_state_names: list(str). Name of the states deleted from the
            exploration from prev_exp_version to current_exp_version.
        new_to_old_state_names: dict. Dictionary mapping state names of
            current_exp_version to the state names of prev_exp_version.
        old_to_new_state_names: dict. Dictionary mapping state names of
            prev_exp_version to the state names of current_exp_version.
    """

    def __init__(self, change_list):
        """Constructs an ExplorationVersionsDiff domain object.

        Args:
            change_list: list(dict). A list of all of the commit cmds from the
                old version of the exploration up to the next version.
        """

        added_state_names = []
        deleted_state_names = []
        new_to_old_state_names = {}

        for change_dict in change_list:
            if change_dict['cmd'] == CMD_ADD_STATE:
                added_state_names.append(change_dict['state_name'])
            elif change_dict['cmd'] == CMD_DELETE_STATE:
                state_name = change_dict['state_name']
                if state_name in added_state_names:
                    added_state_names.remove(state_name)
                else:
                    original_state_name = state_name
                    if original_state_name in new_to_old_state_names:
                        original_state_name = new_to_old_state_names.pop(
                            original_state_name)
                    deleted_state_names.append(original_state_name)
            elif change_dict['cmd'] == CMD_RENAME_STATE:
                old_state_name = change_dict['old_state_name']
                new_state_name = change_dict['new_state_name']
                if old_state_name in added_state_names:
                    added_state_names.remove(old_state_name)
                    added_state_names.append(new_state_name)
                elif old_state_name in new_to_old_state_names:
                    new_to_old_state_names[new_state_name] = (
                        new_to_old_state_names.pop(old_state_name))
                else:
                    new_to_old_state_names[new_state_name] = old_state_name

        self.added_state_names = added_state_names
        self.deleted_state_names = deleted_state_names
        self.new_to_old_state_names = new_to_old_state_names
        self.old_to_new_state_names = {
            value: key for key, value in new_to_old_state_names.iteritems()
        }


class Exploration(object):
    """Domain object for an Oppia exploration."""

    def __init__(self, exploration_id, title, category, objective,
                 language_code, tags, blurb, author_notes,
                 states_schema_version, init_state_name, states_dict,
                 param_specs_dict, param_changes_list, version,
                 auto_tts_enabled, correctness_feedback_enabled,
                 created_on=None, last_updated=None):
        """Initializes an Exploration domain object.

        Args:
            exploration_id: str. The exploration id.
            title: str. The exploration title.
            category: str. The category of the exploration.
            objective: str. The objective of the exploration.
            language_code: str. The language code of the exploration.
            tags: list(str). The tags given to the exploration.
            blurb: str. The blurb of the exploration.
            author_notes: str. The author notes.
            states_schema_version: int. Tbe schema version of the exploration.
            init_state_name: str. The name for the initial state of the
                exploration.
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.
            param_specs_dict: dict. A dict where each key-value pair represents
                respectively, a param spec name and a dict used to initialize a
                ParamSpec domain object.
            param_changes_list: list(dict). List of dict where each dict is
                used to initialize a ParamChange domain object.
            version: int. The version of the exploration.
            created_on: datetime.datetime. Date and time when the exploration
                is created.
            last_updated: datetime.datetime. Date and time when the exploration
                was last updated.
            auto_tts_enabled: bool. True if automatic text-to-speech is
                enabled.
            correctness_feedback_enabled: bool. True if correctness feedback is
                enabled.
        """
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
        self.auto_tts_enabled = auto_tts_enabled
        self.correctness_feedback_enabled = correctness_feedback_enabled

    @classmethod
    def create_default_exploration(
            cls, exploration_id, title=feconf.DEFAULT_EXPLORATION_TITLE,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Returns a Exploration domain object with default values.
            'title', 'category', 'objective' if not provided are taken from
            feconf; 'tags' and 'param_changes_list' are initialized to empty
            list; 'states_schema_version' and 'init_state_name' are taken from
            feconf; 'states_dict' is derived from feconf; 'param_specs_dict' is
            an empty dict; 'blurb' and 'author_notes' are initialized to empty
            empty string; 'version' is initializated to 0.

        Args:
            exploration_id: str. The id of the exploration.
            title: str. The exploration title.
            category: str. The category of the exploration.
            objective: str. The objective of the exploration.
            language_code: str. The language code of the exploration.

        Returns:
            Exploration. The Exploration domain object with default
            values.
        """
        init_state_dict = State.create_default_state(
            feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()

        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: init_state_dict
        }

        return cls(
            exploration_id, title, category, objective, language_code, [], '',
            '', feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION,
            feconf.DEFAULT_INIT_STATE_NAME, states_dict, {}, [], 0,
            feconf.DEFAULT_AUTO_TTS_ENABLED, False)

    @classmethod
    def from_dict(
            cls, exploration_dict,
            exploration_version=0, exploration_created_on=None,
            exploration_last_updated=None):
        """Return a Exploration domain object from a dict.

        Args:
            exploration_dict: dict. The dict representation of Exploration
                object.
            exploration_version: int. The version of the exploration.
            exploration_created_on: datetime.datetime. Date and time when the
                exploration is created.
            exploration_last_updated: datetime.datetime. Date and time when the
                exploration was last updated.

        Returns:
            Exploration. The corresponding Exploration domain object.
        """
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
        exploration.auto_tts_enabled = exploration_dict['auto_tts_enabled']
        exploration.correctness_feedback_enabled = exploration_dict[
            'correctness_feedback_enabled']

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

            state.content = SubtitledHtml(
                sdict['content']['html'], {
                    language_code: AudioTranslation.from_dict(translation)
                    for language_code, translation in
                    sdict['content']['audio_translations'].iteritems()
                })

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
                AnswerGroup.from_dict(group)
                for group in idict['answer_groups']]

            default_outcome = (
                Outcome.from_dict(idict['default_outcome'])
                if idict['default_outcome'] is not None else None)

            solution = (
                Solution.from_dict(idict['id'], idict['solution'])
                if idict['solution'] else None)

            state.interaction = InteractionInstance(
                idict['id'], idict['customization_args'],
                interaction_answer_groups, default_outcome,
                idict['confirmed_unclassified_answers'],
                [Hint.from_dict(h) for h in idict['hints']],
                solution)

            exploration.states[state_name] = state

        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]

        exploration.version = exploration_version
        exploration.created_on = exploration_created_on
        exploration.last_updated = exploration_last_updated

        return exploration

    @classmethod
    def _require_valid_state_name(cls, name):
        """Validates name string.

        Args:
            name: str. The name to validate.
        """
        utils.require_valid_name(name, 'a state name')

    def validate(self, strict=False):
        """Validates various properties of the Exploration.

        Args:
            strict: bool. If True, the exploration is assumed to be published,
                and the validation checks are stricter.

        Raises:
            ValidationError: One or more attributes of the Exploration are
            invalid.
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
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)
        # TODO(sll): Remove this check once App Engine supports 3-letter
        # language codes in search.
        if len(self.language_code) != 2:
            raise utils.ValidationError(
                'Invalid language_code, it should have exactly 2 letters: %s' %
                self.language_code)

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

        if not isinstance(self.auto_tts_enabled, bool):
            raise utils.ValidationError(
                'Expected auto_tts_enabled to be a bool, received %s'
                % self.auto_tts_enabled)

        if not isinstance(self.correctness_feedback_enabled, bool):
            raise utils.ValidationError(
                'Expected correctness_feedback_enabled to be a bool, received '
                '%s' % self.correctness_feedback_enabled)

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
        for state_name, state in self.states.iteritems():
            interaction = state.interaction
            default_outcome = interaction.default_outcome

            if default_outcome is not None:
                # Check the default destination, if any.
                if default_outcome.dest not in all_state_names:
                    raise utils.ValidationError(
                        'The destination %s is not a valid state.'
                        % default_outcome.dest)

                # Check that, if the outcome is a non-self-loop, then the
                # refresher_exploration_id is None.
                if (default_outcome.refresher_exploration_id is not None and
                        default_outcome.dest != state_name):
                    raise utils.ValidationError(
                        'The default outcome for state %s has a refresher '
                        'exploration ID, but is not a self-loop.' % state_name)

            for group in interaction.answer_groups:
                # Check group destinations.
                if group.outcome.dest not in all_state_names:
                    raise utils.ValidationError(
                        'The destination %s is not a valid state.'
                        % group.outcome.dest)

                # Check that, if the outcome is a non-self-loop, then the
                # refresher_exploration_id is None.
                if (group.outcome.refresher_exploration_id is not None and
                        group.outcome.dest != state_name):
                    raise utils.ValidationError(
                        'The outcome for an answer group in state %s has a '
                        'refresher exploration ID, but is not a self-loop.'
                        % state_name)

                for param_change in group.outcome.param_changes:
                    if param_change.name not in self.param_specs:
                        raise utils.ValidationError(
                            'The parameter %s was used in an answer group, '
                            'but it does not exist in this exploration'
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

            # Check that self-loop outcomes are not labelled as correct.
            all_state_names = self.states.keys()
            for state_name, state in self.states.iteritems():
                interaction = state.interaction
                default_outcome = interaction.default_outcome

                if default_outcome is not None:
                    # Check that, if the outcome is a self-loop, then the
                    # outcome is not labelled as correct.
                    if (default_outcome.dest == state_name and
                            default_outcome.labelled_as_correct):
                        raise utils.ValidationError(
                            'The default outcome for state %s is labelled '
                            'correct but is a self-loop.' % state_name)

                for group in interaction.answer_groups:
                    # Check that, if the outcome is a self-loop, then the
                    # outcome is not labelled as correct.
                    if (group.outcome.dest == state_name and
                            group.outcome.labelled_as_correct):
                        raise utils.ValidationError(
                            'The outcome for an answer group in state %s is '
                            'labelled correct but is a self-loop.' % state_name)

            if len(warnings_list) > 0:
                warning_str = ''
                for ind, warning in enumerate(warnings_list):
                    warning_str += '%s. %s ' % (ind + 1, warning)
                raise utils.ValidationError(
                    'Please fix the following issues before saving this '
                    'exploration: %s' % warning_str)

    def _verify_all_states_reachable(self):
        """Verifies that all states are reachable from the initial state.

        Raises:
            ValidationError: One or more states are not reachable from the
            initial state of the Exploration.
        """
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
        """Verifies that all states can reach a terminal state.

        Raises:
            ValidationError: If is impossible to complete the exploration from
                a state.
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
                        state.interaction.get_all_outcomes())
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

    # Derived attributes of an exploration.
    @property
    def init_state(self):
        """The state which forms the start of this exploration.

        Returns:
            State. The corresponding State domain object.
        """
        return self.states[self.init_state_name]

    @property
    def param_specs_dict(self):
        """A dict of param specs, each represented as Python dicts.

        Returns:
            dict. Dict of parameter specs.
        """
        return {ps_name: ps_val.to_dict()
                for (ps_name, ps_val) in self.param_specs.iteritems()}

    @property
    def param_change_dicts(self):
        """A list of param changes, represented as JSONifiable Python dicts.

        Returns:
            list(dict). List of dicts, each representing a parameter change.
        """
        return [param_change.to_dict() for param_change in self.param_changes]

    @classmethod
    def is_demo_exploration_id(cls, exploration_id):
        """Whether the given exploration id is a demo exploration.

        Args:
            exploration_id: str. The exploration id.

        Returns:
            bool. Whether the corresponding exploration is a demo exploration.
        """
        return exploration_id in feconf.DEMO_EXPLORATIONS

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations.

        Returns:
            bool. True is the current exploration is a demo exploration.
        """
        return self.is_demo_exploration_id(self.id)

    def update_title(self, title):
        """Update the exploration title.

        Args:
            title: str. The exploration title to set.
        """
        self.title = title

    def update_category(self, category):
        """Update the exploration category.

        Args:
            category: str. The exploration category to set.
        """
        self.category = category

    def update_objective(self, objective):
        """Update the exploration objective.

        Args:
            objective: str. The exploration objective to set.
        """
        self.objective = objective

    def update_language_code(self, language_code):
        """Update the exploration language code.

        Args:
            language_code: str. The exploration language code to set.
        """
        self.language_code = language_code

    def update_tags(self, tags):
        """Update the tags of the exploration.

        Args:
            tags: list(str). List of tags to set.
        """
        self.tags = tags

    def update_blurb(self, blurb):
        """Update the blurb of the exploration.

        Args:
            blurb: str. The blurb to set.
        """
        self.blurb = blurb

    def update_author_notes(self, author_notes):
        """Update the author notes of the exploration.

        Args:
            author_notes: str. The author notes to set.
        """
        self.author_notes = author_notes

    def update_param_specs(self, param_specs_dict):
        """Update the param spec dict.

        Args:
            param_specs_dict: dict. A dict where each key-value pair represents
                respectively, a param spec name and a dict used to initialize a
                ParamSpec domain object.
        """
        self.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in param_specs_dict.iteritems()
        }

    def update_param_changes(self, param_changes_list):
        """Update the param change dict.

        Args:
           param_changes_list: list(dict). List of dict where each dict is
                used to initialize a ParamChange domain object.
        """
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change)
            for param_change in param_changes_list
        ]

    def update_init_state_name(self, init_state_name):
        """Update the name for the initial state of the exploration.

        Args:
            init_state_name: str. The new name of the initial state.
        """
        if init_state_name not in self.states:
            raise Exception(
                'Invalid new initial state name: %s; '
                'it is not in the list of states %s for this '
                'exploration.' % (init_state_name, self.states.keys()))
        self.init_state_name = init_state_name

    def update_auto_tts_enabled(self, auto_tts_enabled):
        """Update whether automatic text-to-speech is enabled.

        Args:
            auto_tts_enabled: bool. Whether automatic text-to-speech
                is enabled or not.
        """
        self.auto_tts_enabled = auto_tts_enabled

    def update_correctness_feedback_enabled(self, correctness_feedback_enabled):
        """Update whether correctness feedback is enabled.

        Args:
            correctness_feedback_enabled: bool. Whether correctness feedback
                is enabled or not.
        """
        self.correctness_feedback_enabled = correctness_feedback_enabled

    # Methods relating to states.
    def add_states(self, state_names):
        """Adds multiple states to the exploration.

        Args:
            state_names: list(str). List of state names to add.

        Raises:
            ValueError: At least one of the new state names already exists in
            the states dict.
        """
        for state_name in state_names:
            if state_name in self.states:
                raise ValueError('Duplicate state name %s' % state_name)

        for state_name in state_names:
            self.states[state_name] = State.create_default_state(state_name)

    def rename_state(self, old_state_name, new_state_name):
        """Renames the given state.

        Args:
            old_state_names: str. The old name of state to rename.
            new_state_names: str. The new state name.

        Raises:
            ValueError: The old state name does not exist or the new state name
            is already in states dict.
        """
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
        """Deletes the given state.

        Args:
            state_names: str. The state name to be deleted.

        Raises:
            ValueError: The state does not exist or is the initial state of the
            exploration.
        """
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


    def get_trainable_states_dict(self, old_states, exp_versions_diff):
        """Retrieves the state names of all trainable states in an exploration
        segregated into state names with changed and unchanged answer groups.
        In this method, the new_state_name refers to the name of the state in
        the current version of the exploration whereas the old_state_name refers
        to the name of the state in the previous version of the exploration.

        Args:
            old_states: dict. Dictionary containing all State domain objects.
            exp_versions_diff: ExplorationVersionsDiff. An instance of the
                exploration versions diff class.

        Returns:
            dict. The trainable states dict. This dict has three keys
                representing state names with changed answer groups and
                unchanged answer groups respectively.
        """
        trainable_states_dict = {
            'state_names_with_changed_answer_groups': [],
            'state_names_with_unchanged_answer_groups': []
        }
        new_states = self.states

        for new_state_name in new_states:
            new_state = new_states[new_state_name]
            if not new_state.can_undergo_classification():
                continue

            old_state_name = new_state_name
            if new_state_name in exp_versions_diff.new_to_old_state_names:
                old_state_name = exp_versions_diff.new_to_old_state_names[
                    new_state_name]

            # The case where a new state is added. When this happens, the
            # old_state_name will be equal to the new_state_name and it will not
            # be present in the exploration's older version.
            if old_state_name not in old_states:
                trainable_states_dict[
                    'state_names_with_changed_answer_groups'].append(
                        new_state_name)
                continue
            old_state = old_states[old_state_name]
            old_training_data = old_state.get_training_data()
            new_training_data = new_state.get_training_data()

            # Check if the training data and interaction_id of the state in the
            # previous version of the exploration and the state in the new
            # version of the exploration match. If any of them are not equal,
            # we create a new job for the state in the current version.
            if new_training_data == old_training_data and (
                    new_state.interaction.id == old_state.interaction.id):
                trainable_states_dict[
                    'state_names_with_unchanged_answer_groups'].append(
                        new_state_name)
            else:
                trainable_states_dict[
                    'state_names_with_changed_answer_groups'].append(
                        new_state_name)

        return trainable_states_dict

    @classmethod
    def _convert_states_v0_dict_to_v1_dict(cls, states_dict):
        """Converts old states schema to the modern v1 schema. v1 contains the
        schema version 1 and does not contain any old constructs, such as
        widgets. This is a complete migration of everything previous to the
        schema versioning update to the earliest versioned schema.
        Note that the states_dict being passed in is modified in-place.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        # ensure widgets are renamed to be interactions.
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

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
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
        # reached from other states, etc.).
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
        # state to end with (in case it expects an END state).
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

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
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

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
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

            try:
                is_terminal = (
                    interaction_registry.Registry.get_interaction_by_id(
                        interaction['id']
                    ).is_terminal if interaction['id'] is not None else False)
            except KeyError:
                raise utils.ExplorationConversionError(
                    'Trying to migrate exploration containing non-existent '
                    'interaction ID: %s' % interaction['id'])
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

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
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

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
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

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            if interaction['id'] == 'CodeRepl':
                interaction['customization_args']['language']['value'] = (
                    'python')

        return states_dict

    # TODO(bhenning): Remove pre_v4_states_conversion_func when the answer
    # migration is completed.
    @classmethod
    def _convert_states_v7_dict_to_v8_dict(cls, states_dict):
        """Converts from version 7 to 8. Version 8 contains classifier
        model id.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            state_dict['classifier_model_id'] = None
        return states_dict

    @classmethod
    def _convert_states_v8_dict_to_v9_dict(cls, states_dict):
        """Converts from version 8 to 9. Version 9 contains 'correct'
        field in answer groups.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            answer_groups = state_dict['interaction']['answer_groups']
            for answer_group in answer_groups:
                answer_group['correct'] = False
        return states_dict

    @classmethod
    def _convert_states_v9_dict_to_v10_dict(cls, states_dict):
        """Converts from version 9 to 10. Version 10 contains hints
        and solution in each interaction.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            if 'hints' not in interaction:
                interaction['hints'] = []
                for fallback in interaction['fallbacks']:
                    if fallback['outcome']['feedback']:
                        interaction['hints'].append({
                            'hint_text': fallback['outcome']['feedback'][0]
                        })
            if 'solution' not in interaction:
                interaction['solution'] = None
        return states_dict

    @classmethod
    def _convert_states_v10_dict_to_v11_dict(cls, states_dict):
        """Converts from version 10 to 11. Version 11 refactors the content to
        be an HTML string with audio translations.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            content_html = state_dict['content'][0]['value']
            state_dict['content'] = {
                'html': content_html,
                'audio_translations': []
            }
        return states_dict

    @classmethod
    def _convert_states_v11_dict_to_v12_dict(cls, states_dict):
        """Converts from version 11 to 12. Version 12 refactors audio
        translations from a list to a dict keyed by language code.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            old_audio_translations = state_dict['content']['audio_translations']
            state_dict['content']['audio_translations'] = {
                old_translation['language_code']: {
                    'filename': old_translation['filename'],
                    'file_size_bytes': old_translation['file_size_bytes'],
                    'needs_update': old_translation['needs_update'],
                }
                for old_translation in old_audio_translations
            }
        return states_dict

    @classmethod
    def _convert_states_v12_dict_to_v13_dict(cls, states_dict):
        """Converts from version 12 to 13. Version 13 sets empty
        solutions to None and removes fallbacks.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if 'fallbacks' in state_dict['interaction']:
                del state_dict['interaction']['fallbacks']
            if not state_dict['interaction']['solution']:
                state_dict['interaction']['solution'] = None
        return states_dict

    @classmethod
    def _convert_states_v13_dict_to_v14_dict(cls, states_dict):
        """Converts from version 13 to 14. Version 14 adds
        audio translations to feedback, hints, and solutions.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if state_dict['interaction']['default_outcome'] is not None:
                old_feedback_list = (
                    state_dict['interaction']['default_outcome']['feedback'])
                default_feedback_html = (
                    old_feedback_list[0] if len(old_feedback_list) > 0 else '')
                state_dict['interaction']['default_outcome']['feedback'] = {
                    'html': default_feedback_html,
                    'audio_translations': {}
                }
            for answer_group_dict in state_dict['interaction']['answer_groups']:
                old_answer_group_feedback_list = (
                    answer_group_dict['outcome']['feedback'])
                feedback_html = (
                    old_answer_group_feedback_list[0]
                    if len(old_answer_group_feedback_list) > 0 else '')
                answer_group_dict['outcome']['feedback'] = {
                    'html': feedback_html,
                    'audio_translations': {}
                }
            for hint_dict in state_dict['interaction']['hints']:
                hint_content_html = hint_dict['hint_text']
                del hint_dict['hint_text']
                hint_dict['hint_content'] = {
                    'html': hint_content_html,
                    'audio_translations': {}
                }
            if state_dict['interaction']['solution']:
                explanation = (
                    state_dict['interaction']['solution']['explanation'])
                state_dict['interaction']['solution']['explanation'] = {
                    'html': explanation,
                    'audio_translations': {}
                }
        return states_dict

    @classmethod
    def _convert_states_v14_dict_to_v15_dict(cls, states_dict):
        """Converts from version 14 to 15. Version 15 renames the "correct"
        field in answer groups to "labelled_as_correct" and (for safety) resets
        all "labelled_as_correct" values to False.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            answer_groups = state_dict['interaction']['answer_groups']
            for answer_group in answer_groups:
                answer_group['labelled_as_correct'] = False
                del answer_group['correct']
        return states_dict

    @classmethod
    def _convert_states_v15_dict_to_v16_dict(cls, states_dict):
        """Converts from version 15 to 16. Version 16 adds a
        refresher_exploration_id field to each outcome.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            answer_groups = state_dict['interaction']['answer_groups']
            for answer_group in answer_groups:
                answer_group['outcome']['refresher_exploration_id'] = None

            if state_dict['interaction']['default_outcome'] is not None:
                default_outcome = state_dict['interaction']['default_outcome']
                default_outcome['refresher_exploration_id'] = None
        return states_dict

    @classmethod
    def _convert_states_v16_dict_to_v17_dict(cls, states_dict):
        """Converts from version 16 to 17. Version 17 moves the
        labelled_as_correct field to the outcome dict (so that it also appears
        for the default outcome) and adds two new customization args to
        FractionInput interactions.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            answer_groups = state_dict['interaction']['answer_groups']
            for answer_group in answer_groups:
                answer_group['outcome']['labelled_as_correct'] = (
                    answer_group['labelled_as_correct'])
                del answer_group['labelled_as_correct']

            default_outcome = state_dict['interaction']['default_outcome']
            if default_outcome is not None:
                default_outcome['labelled_as_correct'] = False

            if state_dict['interaction']['id'] == 'FractionInput':
                customization_args = state_dict[
                    'interaction']['customization_args']
                customization_args.update({
                    'allowImproperFraction': {
                        'value': True
                    },
                    'allowNonzeroIntegerPart': {
                        'value': True
                    }
                })

        return states_dict

    @classmethod
    def _convert_states_v17_dict_to_v18_dict(cls, states_dict):
        """Converts from version 17 to 18. Version 18 adds a new
        customization arg to FractionInput interactions which allows
        you to add custom placeholders.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] == 'FractionInput':
                customization_args = state_dict[
                    'interaction']['customization_args']
                customization_args.update({
                    'customPlaceholder': {
                        'value': ''
                    }
                })

        return states_dict

    @classmethod
    def _convert_states_v18_dict_to_v19_dict(cls, states_dict):
        """Converts from version 18 to 19. Version 19 adds training_data
        parameter to each answer group to store training data of that
        answer group.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            answer_groups_to_remove = []
            answer_groups = state_dict['interaction']['answer_groups']
            for answer_group_index, answer_group in enumerate(answer_groups):
                if answer_group['rule_specs']:
                    training_data = []
                    classifier_rule_index = None
                    rule_specs = answer_group['rule_specs']

                    for rule_index, rule in enumerate(rule_specs):
                        if rule['rule_type'] == 'FuzzyMatches':
                            training_data = rule['inputs']['training_data']
                            classifier_rule_index = rule_index
                            break

                    if classifier_rule_index:
                        answer_group['rule_specs'].pop(classifier_rule_index)

                    answer_group['training_data'] = training_data

                    if not training_data and not answer_group['rule_specs']:
                        answer_groups_to_remove.append(answer_group_index)

            for index in answer_groups_to_remove:
                state_dict['interaction']['answer_groups'].pop(index)

        return states_dict

    @classmethod
    def update_states_from_model(
            cls, versioned_exploration_states, current_states_schema_version):
        """Converts the states blob contained in the given
        versioned_exploration_states dict from current_states_schema_version to
        current_states_schema_version + 1.
        Note that the versioned_exploration_states being passed in is modified
        in-place.

        Args:
            versioned_exploration_states: dict. A dict with two keys:
                - states_schema_version: int. The states schema version for the
                    exploration.
                - states: dict. The dict of states comprising the exploration.
                    The keys are state names and the values are dicts used to
                    initialize a State domain object.
            current_states_schema_version: int. The current states
                schema version.
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
    CURRENT_EXP_SCHEMA_VERSION = 24
    LAST_UNTITLED_SCHEMA_VERSION = 9

    @classmethod
    def _convert_v1_dict_to_v2_dict(cls, exploration_dict):
        """Converts a v1 exploration dict into a v2 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v1.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v2.
        """
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
        """Converts a v2 exploration dict into a v3 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v2.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v3.
        """
        exploration_dict['schema_version'] = 3

        exploration_dict['objective'] = ''
        exploration_dict['language_code'] = constants.DEFAULT_LANGUAGE_CODE
        exploration_dict['skill_tags'] = []
        exploration_dict['blurb'] = ''
        exploration_dict['author_notes'] = ''

        return exploration_dict

    @classmethod
    def _convert_v3_dict_to_v4_dict(cls, exploration_dict):
        """Converts a v3 exploration dict into a v4 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v3.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v4.
        """
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
        """Converts a v4 exploration dict into a v5 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v4.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v5.
        """
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
        """Converts a v5 exploration dict into a v6 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v5.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v6.
        """
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
        """Converts a v6 exploration dict into a v7 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v6.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v7.
        """
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
        """Converts a v7 exploration dict into a v8 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v7.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v8.
        """
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
        """Converts a v8 exploration dict into a v9 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v8.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v9.
        """
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
        """Converts a v9 exploration dict into a v10 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v9.
            title: str. The exploration title.
            category: str. The exploration category.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v10.
        """

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
    def _convert_v10_dict_to_v11_dict(cls, exploration_dict):
        """Converts a v10 exploration dict into a v11 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v10.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v11.
        """

        exploration_dict['schema_version'] = 11

        exploration_dict['states'] = cls._convert_states_v7_dict_to_v8_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 8

        return exploration_dict

    @classmethod
    def _convert_v11_dict_to_v12_dict(cls, exploration_dict):
        """Converts a v11 exploration dict into a v12 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v11.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v12.
        """

        exploration_dict['schema_version'] = 12

        exploration_dict['states'] = cls._convert_states_v8_dict_to_v9_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 9

        return exploration_dict

    @classmethod
    def _convert_v12_dict_to_v13_dict(cls, exploration_dict):
        """Converts a v12 exploration dict into a v13 exploration dict."""

        exploration_dict['schema_version'] = 13

        exploration_dict['states'] = cls._convert_states_v9_dict_to_v10_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 10

        return exploration_dict

    @classmethod
    def _convert_v13_dict_to_v14_dict(cls, exploration_dict):
        """Converts a v13 exploration dict into a v14 exploration dict."""

        exploration_dict['schema_version'] = 14

        exploration_dict['states'] = cls._convert_states_v10_dict_to_v11_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 11

        return exploration_dict

    @classmethod
    def _convert_v14_dict_to_v15_dict(cls, exploration_dict):
        """Converts a v14 exploration dict into a v15 exploration dict."""

        exploration_dict['schema_version'] = 15

        exploration_dict['states'] = cls._convert_states_v11_dict_to_v12_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 12

        return exploration_dict

    @classmethod
    def _convert_v15_dict_to_v16_dict(cls, exploration_dict):
        """Converts a v15 exploration dict into a v16 exploration dict."""
        exploration_dict['schema_version'] = 16

        exploration_dict['states'] = cls._convert_states_v12_dict_to_v13_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 13

        return exploration_dict

    @classmethod
    def _convert_v16_dict_to_v17_dict(cls, exploration_dict):
        """Converts a v16 exploration dict into a v17 exploration dict.

        Removes gadgets and skins.
        """
        exploration_dict['schema_version'] = 17

        if 'skin_customizations' in exploration_dict:
            del exploration_dict['skin_customizations']

        return exploration_dict

    @classmethod
    def _convert_v17_dict_to_v18_dict(cls, exploration_dict):
        """ Converts a v17 exploration dict into a v18 exploration dict.

        Adds auto_tts_enabled property.
        """
        exploration_dict['schema_version'] = 18

        if exploration_dict['category'] == 'Languages':
            exploration_dict['auto_tts_enabled'] = False
        else:
            exploration_dict['auto_tts_enabled'] = True

        return exploration_dict

    @classmethod
    def _convert_v18_dict_to_v19_dict(cls, exploration_dict):
        """ Converts a v18 exploration dict into a v19 exploration dict.

        Adds audio translations to feedback, hints, and solutions.
        """
        exploration_dict['schema_version'] = 19

        exploration_dict['states'] = cls._convert_states_v13_dict_to_v14_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 14

        return exploration_dict

    @classmethod
    def _convert_v19_dict_to_v20_dict(cls, exploration_dict):
        """ Converts a v19 exploration dict into a v20 exploration dict.

        Introduces a correctness property at the top level, and changes each
        answer group's "correct" field to "labelled_as_correct" instead.
        """
        exploration_dict['schema_version'] = 20

        exploration_dict['states'] = cls._convert_states_v14_dict_to_v15_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 15

        exploration_dict['correctness_feedback_enabled'] = False

        return exploration_dict

    @classmethod
    def _convert_v20_dict_to_v21_dict(cls, exploration_dict):
        """ Converts a v20 exploration dict into a v21 exploration dict.

        Adds a refresher_exploration_id field to each answer group outcome, and
        to the default outcome (if it exists).
        """
        exploration_dict['schema_version'] = 21

        exploration_dict['states'] = cls._convert_states_v15_dict_to_v16_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 16

        return exploration_dict

    @classmethod
    def _convert_v21_dict_to_v22_dict(cls, exploration_dict):
        """ Converts a v21 exploration dict into a v22 exploration dict.

        Moves the labelled_as_correct field from the answer group level to the
        outcome level, and adds two extra customization args to the
        FractionInput interaction.
        """
        exploration_dict['schema_version'] = 22

        exploration_dict['states'] = cls._convert_states_v16_dict_to_v17_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 17

        return exploration_dict

    @classmethod
    def _convert_v22_dict_to_v23_dict(cls, exploration_dict):
        """ Converts a v22 exploration dict into a v23 exploration dict.

        Adds a new customization arg to FractionInput interactions
        which allows you to add custom placeholders.
        """
        exploration_dict['schema_version'] = 23

        exploration_dict['states'] = cls._convert_states_v17_dict_to_v18_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 18

        return exploration_dict

    @classmethod
    def _convert_v23_dict_to_v24_dict(cls, exploration_dict):
        """ Converts a v23 exploration dict into a v24 exploration dict.

        Adds training_data parameter to each answer group to store training
        data of corresponding answer group.
        """
        exploration_dict['schema_version'] = 24

        exploration_dict['states'] = cls._convert_states_v18_dict_to_v19_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 19

        return exploration_dict

    @classmethod
    def _migrate_to_latest_yaml_version(
            cls, yaml_content, title=None, category=None):
        """Return the YAML content of the exploration in the latest schema
        format.

        Args:
            yaml_content: str. The YAML representation of the exploration.
            title: str. The exploration title.
            category: str. The exploration category.

        Returns:
            tuple(dict, int). The dict 'exploration_dict' is the representation
            of the Exploration and the 'initial_schema_version' is the initial
            schema version provided in 'yaml_content'.

        Raises:
            Exception: 'yaml_content' or the exploration schema version is not
                valid.
        """
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

        if exploration_schema_version == 10:
            exploration_dict = cls._convert_v10_dict_to_v11_dict(
                exploration_dict)
            exploration_schema_version = 11

        if exploration_schema_version == 11:
            exploration_dict = cls._convert_v11_dict_to_v12_dict(
                exploration_dict)
            exploration_schema_version = 12

        if exploration_schema_version == 12:
            exploration_dict = cls._convert_v12_dict_to_v13_dict(
                exploration_dict)
            exploration_schema_version = 13

        if exploration_schema_version == 13:
            exploration_dict = cls._convert_v13_dict_to_v14_dict(
                exploration_dict)
            exploration_schema_version = 14

        if exploration_schema_version == 14:
            exploration_dict = cls._convert_v14_dict_to_v15_dict(
                exploration_dict)
            exploration_schema_version = 15

        if exploration_schema_version == 15:
            exploration_dict = cls._convert_v15_dict_to_v16_dict(
                exploration_dict)
            exploration_schema_version = 16

        if exploration_schema_version == 16:
            exploration_dict = cls._convert_v16_dict_to_v17_dict(
                exploration_dict)
            exploration_schema_version = 17

        if exploration_schema_version == 17:
            exploration_dict = cls._convert_v17_dict_to_v18_dict(
                exploration_dict)
            exploration_schema_version = 18

        if exploration_schema_version == 18:
            exploration_dict = cls._convert_v18_dict_to_v19_dict(
                exploration_dict)
            exploration_schema_version = 19

        if exploration_schema_version == 19:
            exploration_dict = cls._convert_v19_dict_to_v20_dict(
                exploration_dict)
            exploration_schema_version = 20

        if exploration_schema_version == 20:
            exploration_dict = cls._convert_v20_dict_to_v21_dict(
                exploration_dict)
            exploration_schema_version = 21

        if exploration_schema_version == 21:
            exploration_dict = cls._convert_v21_dict_to_v22_dict(
                exploration_dict)
            exploration_schema_version = 22

        if exploration_schema_version == 22:
            exploration_dict = cls._convert_v22_dict_to_v23_dict(
                exploration_dict)
            exploration_schema_version = 23

        if exploration_schema_version == 23:
            exploration_dict = cls._convert_v23_dict_to_v24_dict(
                exploration_dict)
            exploration_schema_version = 24

        return (exploration_dict, initial_schema_version)

    @classmethod
    def from_yaml(cls, exploration_id, yaml_content):
        """Creates and returns exploration from a YAML text string for YAML
        schema versions 10 and later.

        Args:
            exploration_id: str. The id of the exploration.
            yaml_content: str. The YAML representation of the exploration.

        Returns:
            Exploration. The corresponding exploration domain object.

        Raises:
            Exception: The initial schema version of exploration is less than
                or equal to 9.
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

        Args:
            exploration_id: str. The id of the exploration.
            title: str. The exploration title.
            category: str. The exploration category.
            yaml_content: str. The YAML representation of the exploration.

        Returns:
            Exploration. The corresponding exploration domain object.

        Raises:
            Exception: The initial schema version of exploration is less than
                or equal to 9.
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
        """Convert the exploration domain object into YAML string.

        Returns:
            str. The YAML representation of this exploration.
        """
        exp_dict = self.to_dict()
        exp_dict['schema_version'] = self.CURRENT_EXP_SCHEMA_VERSION

        # The ID is the only property which should not be stored within the
        # YAML representation.
        del exp_dict['id']

        return utils.yaml_from_dict(exp_dict)

    def to_dict(self):
        """Returns a copy of the exploration as a dictionary. It includes all
        necessary information to represent the exploration.

        Returns:
            dict. A dict mapping all fields of Exploration instance.
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
            'auto_tts_enabled': self.auto_tts_enabled,
            'correctness_feedback_enabled': self.correctness_feedback_enabled,
            'states': {state_name: state.to_dict()
                       for (state_name, state) in self.states.iteritems()}
        })

    def to_player_dict(self):
        """Returns a copy of the exploration suitable for inclusion in the
        learner view.

        Returns:
            dict. A dict mapping some fields of Exploration instance. The
            fields inserted in the dict (as key) are:
                - init_state_name: str. The name for the initial state of the
                    exploration.
                - param_change. list(dict). List of param_change dicts that
                    represent ParamChange domain object.
                - param_specs: dict. A dict where each key-value pair
                    represents respectively, a param spec name and a dict used
                    to initialize a ParamSpec domain object.
                - states: dict. Keys are states names and values are dict
                    representation of State domain object.
                - title: str. The exploration title.
                - language_code: str. The language code of the exploration.
                - correctness_feedback_enabled: str. Whether to show correctness
                    feedback.
        """
        return {
            'init_state_name': self.init_state_name,
            'param_changes': self.param_change_dicts,
            'param_specs': self.param_specs_dict,
            'states': {
                state_name: state.to_dict()
                for (state_name, state) in self.states.iteritems()
            },
            'title': self.title,
            'language_code': self.language_code,
            'correctness_feedback_enabled': self.correctness_feedback_enabled,
        }

    def get_interaction_ids(self):
        """Gets all interaction ids used in this exploration.

        Returns:
            list(str). The list of interaction ids.
        """
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
        """Initializes a ExplorationSummary domain object.

        Args:
            exploration_id: str. The exploration id.
            title: str. The exploration title.
            category: str. The exploration category.
            objective: str. The exploration objective.
            language_code: str. The code that represents the exploration
                language.
            tags: list(str). List of tags.
            ratings: dict. Dict whose keys are '1', '2', '3', '4', '5' and
                whose values are nonnegative integers representing frequency
                counts. Note that the keys need to be strings in order for this
                dict to be JSON-serializable.
            scaled_average_rating: float. The average rating.
            status: str. The status of the exploration.
            community_owned: bool. Whether the exploration is community-owned.
            owner_ids: list(str). List of the users ids who are the owners of
                this exploration.
            editor_ids: list(str). List of the users ids who have access to
                edit this exploration.
            viewer_ids: list(str). List of the users ids who have access to
                view this exploration.
            contributor_ids: list(str). List of the users ids of the user who
                have contributed to this exploration.
            contributors_summary: dict. A summary about contributors of current
                exploration. The keys are user ids and the values are the
                number of commits made by that user.
            version: int. The version of the exploration.
            exploration_model_created_on: datetime.datetime. Date and time when
                the exploration model is created.
            exploration_model_last_updated: datetime.datetime. Date and time
                when the exploration model was last updated.
            first_published_msec: int. Time in milliseconds since the Epoch,
                when the exploration was first published.
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

    def to_metadata_dict(self):
        """Given an exploration summary, this method returns a dict containing
        id, title and objective of the exploration.

        Returns:
            A metadata dict for the given exploration summary.
            The metadata dict has three keys:
                - 'id': str. The exploration ID.
                - 'title': str. The exploration title.
                - 'objective': str. The exploration objective.
        """
        return {
            'id': self.id,
            'title': self.title,
            'objective': self.objective,
        }


class StateIdMapping(object):
    """Domain object for state ID mapping model."""

    def __init__(
            self, exploration_id, exploration_version, state_names_to_ids,
            largest_state_id_used):
        """Initialize state id mapping model object.

        Args:
            exploration_id: str. The exploration id whose state names are
                mapped.
            exploration_version: int. The version of the exploration.
            state_names_to_ids: dict. A dictionary mapping a state name to
                unique ID.
            largest_state_id_used: int. The largest integer so far that has been
                used as a state ID for this exploration.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_names_to_ids = state_names_to_ids
        self.largest_state_id_used = largest_state_id_used

    def has_state_changed_significantly(self, old_state, new_state):
        """Checks whether there is any significant change in old and new version
        of the given state.

        A significant change has happened when interaction id has been changed
        in new version of the state.

        Args:
            old_state: dict. Old version of the state.
            new_state: dict. New version of the state.

        Returns:
            bool. A boolean indicating whether change is significant or not.
        """
        # State has changed significantly if interaction id in new state is
        # different from old state.
        return old_state.interaction.id != new_state.interaction.id

    def create_mapping_for_new_version(
            self, old_exploration, new_exploration, change_list):
        """Get state name to id mapping for new exploration's states.

        Args:
            old_exploration: Exploration. Old version of the exploration.
            new_exploration: Exploration. New version of the exploration.
            change_list: list(dict). List of changes between old and new
                exploration.

        Returns:
            StateIdMapping. Domain object for state id mapping.
        """
        new_state_names = []
        state_ids_to_names = {}

        # Generate state id to name mapping dict for old exploration.
        for state_name in old_exploration.states:
            state_ids_to_names[self.get_state_id(state_name)] = state_name

        old_state_ids_to_names = copy.deepcopy(state_ids_to_names)

        # Analyse each command in change list one by one to create state id
        # mapping for new exploration.
        for change_dict in change_list:
            # During v1 -> v2 migration of states, all pseudo END states were
            # replaced by an explicit END state through this migration.
            # We account for that change in the state id mapping too.
            if change_dict['cmd'] == 'migrate_states_schema_to_latest_version':
                pseudo_end_state_name = 'END'
                if int(change_dict['from_version']) < 2 <= int(
                        change_dict['to_version']):
                    # The explicit end state is created only if there is some
                    # state that used to refer to an implicit 'END' state.
                    # This is confirmed by checking that there is a state
                    # called 'END' in the immediate version of the exploration
                    # after migration and no state called 'END' is present
                    # in previous version of exploration.
                    if (pseudo_end_state_name in (
                            new_exploration.states) and (
                                pseudo_end_state_name not in (
                                    self.state_names_to_ids))):
                        new_state_names.append(pseudo_end_state_name)
            elif change_dict['cmd'] == CMD_ADD_STATE:
                new_state_names.append(change_dict['state_name'])
                assert change_dict['state_name'] not in (
                    state_ids_to_names.values())

            elif change_dict['cmd'] == CMD_DELETE_STATE:
                removed_state_name = change_dict['state_name']

                # Find state name in state id mapping. If it exists then
                # remove it from mapping.
                if removed_state_name in state_ids_to_names.values():
                    key = None
                    for (state_id, state_name) in (
                            state_ids_to_names.iteritems()):
                        if state_name == removed_state_name:
                            key = state_id
                            break
                    state_ids_to_names.pop(key)

                    assert removed_state_name not in new_state_names
                else:
                    # If the state is not present in state id mapping then
                    # remove it from new state names list.
                    new_state_names.remove(removed_state_name)

            elif change_dict['cmd'] == CMD_RENAME_STATE:
                old_state_name = change_dict['old_state_name']
                new_state_name = change_dict['new_state_name']

                # Find whether old state name is present in state id mapping.
                # If it is then replace the old state name to new state name.
                if old_state_name in state_ids_to_names.values():
                    key = None
                    for (state_id, state_name) in (
                            state_ids_to_names.iteritems()):
                        if state_name == old_state_name:
                            key = state_id
                            break
                    state_ids_to_names[key] = new_state_name

                    assert old_state_name not in new_state_names
                    assert new_state_name not in new_state_names
                else:
                    # If old state name is not present in state id mapping then
                    # remove it from new state names and add new state name
                    # in new state names list.
                    new_state_names.remove(old_state_name)
                    new_state_names.append(new_state_name)

        new_state_names_to_ids = dict(
            zip(state_ids_to_names.values(), state_ids_to_names.keys()))

        # Go through each state id and name and compare the new state
        # with its corresponding old state to find whether significant
        # change has happened or not.
        for (state_id, state_name) in state_ids_to_names.iteritems():
            new_state = new_exploration.states[state_name]
            old_state = old_exploration.states[old_state_ids_to_names[state_id]]

            if self.has_state_changed_significantly(old_state, new_state):
                # If significant change has happend then treat that state as
                # new state and assign new state id to that state.
                new_state_names_to_ids.pop(state_name)
                new_state_names.append(state_name)

        # Assign new ids to each state in new state names list.
        largest_state_id_used = self.largest_state_id_used
        for state_name in sorted(new_state_names):
            largest_state_id_used += 1

            # Check that the state name being assigned is not present in
            # mapping.
            assert state_name not in new_state_names_to_ids.keys()
            new_state_names_to_ids[state_name] = largest_state_id_used

        state_id_map = StateIdMapping(
            new_exploration.id, new_exploration.version, new_state_names_to_ids,
            largest_state_id_used)
        state_id_map.validate()
        return state_id_map

    @classmethod
    def create_mapping_for_new_exploration(cls, exploration):
        """Create state name to id mapping for exploration's states.

        Args:
            exploration: Exploration. New exploration for which state id mapping
                is to be generated.

        Returns:
            StateIdMapping. Domain object for state id mapping.
        """
        largest_state_id_used = -1
        state_names_to_ids = {}

        # Assign state id to each state in exploration.
        for state_name in exploration.states:
            largest_state_id_used += 1
            state_names_to_ids[state_name] = largest_state_id_used

        state_id_map = cls(
            exploration.id, exploration.version, state_names_to_ids,
            largest_state_id_used)
        state_id_map.validate()
        return state_id_map

    def validate(self):
        """Validates the state id mapping domain object."""
        state_ids = self.state_names_to_ids.values()
        if len(set(state_ids)) != len(state_ids):
            raise Exception('Assigned state ids should be unique.')

        if not all(state_ids) <= self.largest_state_id_used:
            raise Exception(
                'Assigned state ids should be smaller than last state id used.')

    def get_state_id(self, state_name):
        """Get state id for given state name.

        Args:
            state_name: str. State name.

        Returns:
            int. Unique id assigned to given state name.
        """
        if state_name in self.state_names_to_ids:
            return self.state_names_to_ids[state_name]
