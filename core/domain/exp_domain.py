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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import copy
import json
import re
import string

from constants import constants
from core.domain import change_domain
from core.domain import param_domain
from core.domain import state_domain
from core.platform import models
import feconf
import python_utils
import utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
# TODO(bhenning): Prior to July 2015, exploration changes involving rules were
# logged using the key 'widget_handlers'. These need to be migrated to
# 'answer_groups' and 'default_outcome'.
STATE_PROPERTY_PARAM_CHANGES = 'param_changes'
STATE_PROPERTY_CONTENT = 'content'
STATE_PROPERTY_SOLICIT_ANSWER_DETAILS = 'solicit_answer_details'
STATE_PROPERTY_CARD_IS_CHECKPOINT = 'card_is_checkpoint'
STATE_PROPERTY_RECORDED_VOICEOVERS = 'recorded_voiceovers'
STATE_PROPERTY_WRITTEN_TRANSLATIONS = 'written_translations'
STATE_PROPERTY_INTERACTION_ID = 'widget_id'
STATE_PROPERTY_NEXT_CONTENT_ID_INDEX = 'next_content_id_index'
STATE_PROPERTY_LINKED_SKILL_ID = 'linked_skill_id'
STATE_PROPERTY_INTERACTION_CUST_ARGS = 'widget_customization_args'
STATE_PROPERTY_INTERACTION_ANSWER_GROUPS = 'answer_groups'
STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME = 'default_outcome'
STATE_PROPERTY_UNCLASSIFIED_ANSWERS = (
    'confirmed_unclassified_answers')
STATE_PROPERTY_INTERACTION_HINTS = 'hints'
STATE_PROPERTY_INTERACTION_SOLUTION = 'solution'
# Deprecated state properties.
STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS_DEPRECATED = (
    'content_ids_to_audio_translations')  # Deprecated in state schema v27.

# These four properties are kept for legacy purposes and are not used anymore.
STATE_PROPERTY_INTERACTION_HANDLERS = 'widget_handlers'
STATE_PROPERTY_INTERACTION_STICKY = 'widget_sticky'
GADGET_PROPERTY_VISIBILITY = 'gadget_visibility'
GADGET_PROPERTY_CUST_ARGS = 'gadget_customization_args'

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'
# This takes an additional 'state_name' parameter.
CMD_ADD_STATE = 'add_state'
# This takes additional 'old_state_name' and 'new_state_name' parameters.
CMD_RENAME_STATE = 'rename_state'
# This takes an additional 'state_name' parameter.
CMD_DELETE_STATE = 'delete_state'
# TODO(#12981): Write a one-off job to modify all existing translation
# suggestions that use DEPRECATED_CMD_ADD_TRANSLATION to use
# CMD_ADD_WRITTEN_TRANSLATION instead. Suggestions in the future will only use
# CMD_ADD_WRITTEN_TRANSLATION.
# DEPRECATED: This command is deprecated. Please do not use. The command remains
# here to support old suggestions. This takes additional 'state_name',
# 'content_id', 'language_code' and 'content_html' and 'translation_html'
# parameters.
DEPRECATED_CMD_ADD_TRANSLATION = 'add_translation'
# This takes additional 'state_name', 'content_id', 'language_code',
# 'data_format', 'content_html' and 'translation_html' parameters.
CMD_ADD_WRITTEN_TRANSLATION = 'add_written_translation'
# This takes additional 'content_id' and 'state_name' parameters.
CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE = (
    'mark_written_translations_as_needing_update')
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

TYPE_INVALID_EXPRESSION = 'Invalid'
TYPE_VALID_ALGEBRAIC_EXPRESSION = 'AlgebraicExpressionInput'
TYPE_VALID_NUMERIC_EXPRESSION = 'NumericExpressionInput'
TYPE_VALID_MATH_EQUATION = 'MathEquationInput'


def clean_math_expression(math_expression):
    """Cleans a given math expression and formats it so that it is compatible
    with the new interactions' validators.

    Args:
        math_expression: str. The string representing the math expression.

    Returns:
        str. The correctly formatted string representing the math expression.
    """
    unicode_to_text = {
        u'\u221a': 'sqrt',
        u'\xb7': '*',
        u'\u03b1': 'alpha',
        u'\u03b2': 'beta',
        u'\u03b3': 'gamma',
        u'\u03b4': 'delta',
        u'\u03b5': 'epsilon',
        u'\u03b6': 'zeta',
        u'\u03b7': 'eta',
        u'\u03b8': 'theta',
        u'\u03b9': 'iota',
        u'\u03ba': 'kappa',
        u'\u03bb': 'lambda',
        u'\u03bc': 'mu',
        u'\u03bd': 'nu',
        u'\u03be': 'xi',
        u'\u03c0': 'pi',
        u'\u03c1': 'rho',
        u'\u03c3': 'sigma',
        u'\u03c4': 'tau',
        u'\u03c5': 'upsilon',
        u'\u03c6': 'phi',
        u'\u03c7': 'chi',
        u'\u03c8': 'psi',
        u'\u03c9': 'omega',
    }
    inverse_trig_fns_mapping = {
        'asin': 'arcsin',
        'acos': 'arccos',
        'atan': 'arctan'
    }
    trig_fns = ['sin', 'cos', 'tan', 'csc', 'sec', 'cot']

    # Shifting powers in trig functions to the end.
    # For eg. 'sin^2(x)' -> '(sin(x))^2'.
    for trig_fn in trig_fns:
        math_expression = re.sub(
            r'%s(\^\d)\((.)\)' % trig_fn,
            r'(%s(\2))\1' % trig_fn, math_expression)

    # Adding parens to trig functions that don't have
    # any. For eg. 'cosA' -> 'cos(A)'.
    for trig_fn in trig_fns:
        math_expression = re.sub(
            r'%s(?!\()(.)' % trig_fn, r'%s(\1)' % trig_fn, math_expression)

    # The pylatexenc lib outputs the unicode values of special characters like
    # sqrt and pi, which is why they need to be replaced with their
    # corresponding text values before performing validation. Other unicode
    # characters will be left in the string as-is, and will be rejected by the
    # expression parser.
    for unicode_char, text in unicode_to_text.items():
        math_expression = math_expression.replace(unicode_char, text)

    # Replacing trig functions that have format which is
    # incompatible with the validations.
    for invalid_trig_fn, valid_trig_fn in inverse_trig_fns_mapping.items():
        math_expression = math_expression.replace(
            invalid_trig_fn, valid_trig_fn)

    # Replacing comma used in place of a decimal point with a decimal point.
    if re.match(r'\d+,\d+', math_expression):
        math_expression = math_expression.replace(',', '.')

    # Replacing \cdot with *.
    math_expression = re.sub(r'\\cdot', '*', math_expression)

    return math_expression


class ExplorationChange(change_domain.BaseChange):
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

    The allowed commands, together with the attributes:
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
    """

    # The allowed list of state properties which can be used in
    # edit_state_property command.
    STATE_PROPERTIES = (
        STATE_PROPERTY_PARAM_CHANGES,
        STATE_PROPERTY_CONTENT,
        STATE_PROPERTY_SOLICIT_ANSWER_DETAILS,
        STATE_PROPERTY_CARD_IS_CHECKPOINT,
        STATE_PROPERTY_RECORDED_VOICEOVERS,
        STATE_PROPERTY_WRITTEN_TRANSLATIONS,
        STATE_PROPERTY_INTERACTION_ID,
        STATE_PROPERTY_NEXT_CONTENT_ID_INDEX,
        STATE_PROPERTY_LINKED_SKILL_ID,
        STATE_PROPERTY_INTERACTION_CUST_ARGS,
        STATE_PROPERTY_INTERACTION_STICKY,
        STATE_PROPERTY_INTERACTION_HANDLERS,
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
        STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
        STATE_PROPERTY_INTERACTION_HINTS,
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_UNCLASSIFIED_ANSWERS,
        # Deprecated state properties.
        STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS_DEPRECATED)

    # The allowed list of exploration properties which can be used in
    # edit_exploration_property command.
    EXPLORATION_PROPERTIES = (
        'title', 'category', 'objective', 'language_code', 'tags',
        'blurb', 'author_notes', 'param_specs', 'param_changes',
        'init_state_name', 'auto_tts_enabled', 'correctness_feedback_enabled')

    ALLOWED_COMMANDS = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['category', 'title'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_ADD_STATE,
        'required_attribute_names': ['state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_DELETE_STATE,
        'required_attribute_names': ['state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_RENAME_STATE,
        'required_attribute_names': ['new_state_name', 'old_state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': DEPRECATED_CMD_ADD_TRANSLATION,
        'required_attribute_names': [
            'state_name', 'content_id', 'language_code', 'content_html',
            'translation_html'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_ADD_WRITTEN_TRANSLATION,
        'required_attribute_names': [
            'state_name', 'content_id', 'language_code', 'content_html',
            'translation_html', 'data_format'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE,
        'required_attribute_names': ['content_id', 'state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_EDIT_STATE_PROPERTY,
        'required_attribute_names': [
            'property_name', 'state_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': STATE_PROPERTIES}
    }, {
        'name': CMD_EDIT_EXPLORATION_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': EXPLORATION_PROPERTIES}
    }, {
        'name': CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
        'required_attribute_names': ['version_number'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }]


class ExplorationCommitLogEntry(python_utils.OBJECT):
    """Value object representing a commit to an exploration."""

    def __init__(
            self, created_on, last_updated, user_id, exploration_id,
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
        object. This omits created_on, user_id and commit_cmds and adds username
        (derived from user_id).

        Returns:
            dict. A dict, mapping all fields of ExplorationCommitLogEntry
            instance, except created_on, user_id and commit_cmds fields and
            adding username (derived from user_id).
        """
        return {
            'last_updated': utils.get_time_in_millisecs(self.last_updated),
            'exploration_id': self.exploration_id,
            'commit_type': self.commit_type,
            'commit_message': self.commit_message,
            'version': self.version,
            'post_commit_status': self.post_commit_status,
            'post_commit_community_owned': self.post_commit_community_owned,
            'post_commit_is_private': self.post_commit_is_private,
        }


class ExpVersionReference(python_utils.OBJECT):
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
            ValidationError. One or more attributes of the ExpVersionReference
                are invalid.
        """
        if not isinstance(self.exp_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected exp_id to be a str, received %s' % self.exp_id)

        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be an int, received %s' % self.version)


class ExplorationVersionsDiff(python_utils.OBJECT):
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
            change_list: list(ExplorationChange). A list of all of the commit
                cmds from the old version of the exploration up to the next
                version.
        """

        added_state_names = []
        deleted_state_names = []
        new_to_old_state_names = {}

        for change in change_list:
            if change.cmd == CMD_ADD_STATE:
                added_state_names.append(change.state_name)
            elif change.cmd == CMD_DELETE_STATE:
                state_name = change.state_name
                if state_name in added_state_names:
                    added_state_names.remove(state_name)
                else:
                    original_state_name = state_name
                    if original_state_name in new_to_old_state_names:
                        original_state_name = new_to_old_state_names.pop(
                            original_state_name)
                    deleted_state_names.append(original_state_name)
            elif change.cmd == CMD_RENAME_STATE:
                old_state_name = change.old_state_name
                new_state_name = change.new_state_name
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
            value: key for key, value in new_to_old_state_names.items()
        }


class VersionedExplorationInteractionIdsMapping(python_utils.OBJECT):
    """Domain object representing the mapping of state names to interaction ids
    in an exploration.
    """

    def __init__(self, version, state_interaction_ids_dict):
        """Initialises an VersionedExplorationInteractionIdsMapping domain
        object.

        Args:
            version: int. The version of the exploration.
            state_interaction_ids_dict: dict. A dict where each key-value pair
                represents, respectively, a state name and an interaction id.
        """
        self.version = version
        self.state_interaction_ids_dict = state_interaction_ids_dict


class Exploration(python_utils.OBJECT):
    """Domain object for an Oppia exploration."""

    def __init__(
            self, exploration_id, title, category, objective,
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
            auto_tts_enabled: bool. True if automatic text-to-speech is
                enabled.
            correctness_feedback_enabled: bool. True if correctness feedback is
                enabled.
            created_on: datetime.datetime. Date and time when the exploration
                is created.
            last_updated: datetime.datetime. Date and time when the exploration
                was last updated.
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
        for (state_name, state_dict) in states_dict.items():
            self.states[state_name] = state_domain.State.from_dict(state_dict)

        self.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in param_specs_dict.items()
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
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Returns a Exploration domain object with default values.

        'title', 'init_state_name', 'category', 'objective' if not provided are
        taken from feconf; 'tags' and 'param_changes_list' are initialized to
        empty list; 'states_schema_version' is taken from feconf; 'states_dict'
        is derived from feconf; 'param_specs_dict' is an empty dict; 'blurb' and
        'author_notes' are initialized to empty string; 'version' is
        initializated to 0.

        Args:
            exploration_id: str. The id of the exploration.
            title: str. The exploration title.
            init_state_name: str. The name of the initial state.
            category: str. The category of the exploration.
            objective: str. The objective of the exploration.
            language_code: str. The language code of the exploration.

        Returns:
            Exploration. The Exploration domain object with default
            values.
        """
        init_state_dict = state_domain.State.create_default_state(
            init_state_name, is_initial_state=True).to_dict()

        states_dict = {
            init_state_name: init_state_dict
        }

        return cls(
            exploration_id, title, category, objective, language_code, [], '',
            '', feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name, states_dict, {}, [], 0,
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
            (ps_name, ps_val) in exploration_dict['param_specs'].items()
        }

        exploration.states_schema_version = exploration_dict[
            'states_schema_version']
        init_state_name = exploration_dict['init_state_name']
        exploration.rename_state(exploration.init_state_name, init_state_name)
        exploration.add_states([
            state_name for state_name in exploration_dict['states']
            if state_name != init_state_name])

        for (state_name, sdict) in exploration_dict['states'].items():
            state = exploration.states[state_name]

            state.content = state_domain.SubtitledHtml(
                sdict['content']['content_id'], sdict['content']['html'])
            state.content.validate()

            state.param_changes = [param_domain.ParamChange(
                pc['name'], pc['generator_id'], pc['customization_args']
            ) for pc in sdict['param_changes']]

            for pc in state.param_changes:
                if pc.name not in exploration.param_specs:
                    raise Exception(
                        'Parameter %s was used in a state but not '
                        'declared in the exploration param_specs.' % pc.name)

            idict = sdict['interaction']
            interaction_answer_groups = [
                state_domain.AnswerGroup.from_dict(group)
                for group in idict['answer_groups']]

            default_outcome = (
                state_domain.Outcome.from_dict(idict['default_outcome'])
                if idict['default_outcome'] is not None else None)

            solution = (
                state_domain.Solution.from_dict(idict['id'], idict['solution'])
                if idict['solution'] else None)

            customization_args = (
                state_domain.InteractionInstance.
                convert_customization_args_dict_to_customization_args(
                    idict['id'],
                    idict['customization_args']
                )
            )
            state.interaction = state_domain.InteractionInstance(
                idict['id'], customization_args,
                interaction_answer_groups, default_outcome,
                idict['confirmed_unclassified_answers'],
                [state_domain.Hint.from_dict(h) for h in idict['hints']],
                solution)

            state.recorded_voiceovers = (
                state_domain.RecordedVoiceovers.from_dict(
                    sdict['recorded_voiceovers']))

            state.written_translations = (
                state_domain.WrittenTranslations.from_dict(
                    sdict['written_translations']))

            state.next_content_id_index = sdict['next_content_id_index']

            state.linked_skill_id = sdict['linked_skill_id']

            state.solicit_answer_details = sdict['solicit_answer_details']

            state.card_is_checkpoint = sdict['card_is_checkpoint']

            exploration.states[state_name] = state

        exploration.param_changes = [
            param_domain.ParamChange.from_dict(pc)
            for pc in exploration_dict['param_changes']]

        exploration.version = exploration_version
        exploration.created_on = exploration_created_on
        exploration.last_updated = exploration_last_updated

        return exploration

    @classmethod
    def _validate_state_name(cls, name):
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
            ValidationError. One or more attributes of the Exploration are
                invalid.
        """
        if not isinstance(self.title, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the exploration title', allow_empty=True)

        if not isinstance(self.category, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the exploration category', allow_empty=True)

        if not isinstance(self.objective, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.tags, list):
            raise utils.ValidationError(
                'Expected \'tags\' to be a list, received %s' % self.tags)
        for tag in self.tags:
            if not isinstance(tag, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each tag in \'tags\' to be a string, received '
                    '\'%s\'' % tag)

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(constants.TAG_REGEX, tag):
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

        if not isinstance(self.blurb, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected blurb to be a string, received %s' % self.blurb)

        if not isinstance(self.author_notes, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected author_notes to be a string, received %s' %
                self.author_notes)

        if not isinstance(self.states, dict):
            raise utils.ValidationError(
                'Expected states to be a dict, received %s' % self.states)
        if not self.states:
            raise utils.ValidationError('This exploration has no states.')
        for state_name in self.states:
            self._validate_state_name(state_name)
            state = self.states[state_name]
            state.validate(
                self.param_specs,
                allow_null_interaction=not strict)
            # The checks below perform validation on the Outcome domain object
            # that is specific to answer groups in explorations, but not
            # questions. This logic is here because the validation checks in
            # the Outcome domain object are used by both explorations and
            # questions.
            for answer_group in state.interaction.answer_groups:
                if not answer_group.outcome.dest:
                    raise utils.ValidationError(
                        'Every outcome should have a destination.')
                if not isinstance(
                        answer_group.outcome.dest, python_utils.BASESTRING):
                    raise utils.ValidationError(
                        'Expected outcome dest to be a string, received %s'
                        % answer_group.outcome.dest)
            if state.interaction.default_outcome is not None:
                if not state.interaction.default_outcome.dest:
                    raise utils.ValidationError(
                        'Every outcome should have a destination.')
                if not isinstance(
                        state.interaction.default_outcome.dest,
                        python_utils.BASESTRING):
                    raise utils.ValidationError(
                        'Expected outcome dest to be a string, received %s'
                        % state.interaction.default_outcome.dest)

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
                (list(self.states.keys()), self.init_state_name))

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
            if not isinstance(param_name, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected parameter name to be a string, received %s (%s).'
                    % (param_name, type(param_name)))
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

            if param_change.name in constants.INVALID_PARAMETER_NAMES:
                raise utils.ValidationError(
                    'The exploration-level parameter with name \'%s\' is '
                    'reserved. Please choose a different name.'
                    % param_change.name)
            if param_change.name not in self.param_specs:
                raise utils.ValidationError(
                    'No parameter named \'%s\' exists in this exploration'
                    % param_change.name)

        # TODO(sll): Find a way to verify the param change customization args
        # when they depend on exploration/state parameters (e.g. the generated
        # values must have the correct obj_type). Can we get sample values for
        # the reader's answer and these parameters by looking at states that
        # link to this one?

        # Check that all state param changes are valid.
        for state_name, state in self.states.items():
            for param_change in state.param_changes:
                param_change.validate()
                if param_change.name in constants.INVALID_PARAMETER_NAMES:
                    raise utils.ValidationError(
                        'The parameter name \'%s\' is reserved. Please choose '
                        'a different name for the parameter being set in '
                        'state \'%s\'.' % (param_change.name, state_name))
                if param_change.name not in self.param_specs:
                    raise utils.ValidationError(
                        'The parameter with name \'%s\' was set in state '
                        '\'%s\', but it does not exist in the list of '
                        'parameter specifications for this exploration.'
                        % (param_change.name, state_name))

        # Check that all answer groups, outcomes, and param_changes are valid.
        all_state_names = list(self.states.keys())
        for state_name, state in self.states.items():
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

            # Check if first state is a checkpoint or not.
            if not self.states[self.init_state_name].card_is_checkpoint:
                raise utils.ValidationError(
                    'Expected card_is_checkpoint of first state to be True'
                    ' but found it to be %s'
                    % (self.states[self.init_state_name].card_is_checkpoint)
                )

            # Check if terminal states are checkpoints.
            for state_name, state in self.states.items():
                interaction = state.interaction
                if interaction.is_terminal:
                    if state_name != self.init_state_name:
                        if self.states[state_name].card_is_checkpoint:
                            raise utils.ValidationError(
                                'Expected card_is_checkpoint of terminal state '
                                'to be False but found it to be %s'
                                % self.states[state_name].card_is_checkpoint
                            )

            # Check if checkpoint count is between 1 and 8, inclusive.
            checkpoint_count = 0
            for state_name, state in self.states.items():
                if state.card_is_checkpoint:
                    checkpoint_count = checkpoint_count + 1
            if not 1 <= checkpoint_count <= 8:
                raise utils.ValidationError(
                    'Expected checkpoint count to be between 1 and 8 inclusive '
                    'but found it to be %s'
                    % checkpoint_count
                )

            # Check if a state marked as a checkpoint is bypassable.
            non_initial_checkpoint_state_names = []
            for state_name, state in self.states.items():
                if (state_name != self.init_state_name
                        and state.card_is_checkpoint):
                    non_initial_checkpoint_state_names.append(state_name)

            # For every non-initial checkpoint state we remove it from the
            # states dict. Then we check if we can reach a terminal state after
            # removing the state with checkpoint. As soon as we find a terminal
            # state, we break out of the loop and raise a validation error.
            # Since, we reached a terminal state, this implies that the user was
            # not required to go through the checkpoint. Hence, the checkpoint
            # is bypassable.
            for state_name_to_exclude in non_initial_checkpoint_state_names:
                new_states = copy.deepcopy(self.states)
                new_states.pop(state_name_to_exclude)
                processed_state_names = set()
                curr_queue = [self.init_state_name]
                excluded_state_is_bypassable = False
                while curr_queue:
                    if curr_queue[0] == state_name_to_exclude:
                        curr_queue.pop(0)
                        continue
                    curr_state_name = curr_queue[0]
                    curr_queue = curr_queue[1:]
                    if not curr_state_name in processed_state_names:
                        processed_state_names.add(curr_state_name)
                        curr_state = new_states[curr_state_name]

                        # We do not need to check if the current state is
                        # terminal or not before getting all outcomes, as when
                        # we find a terminal state in an outcome, we break out
                        # of the for loop and raise a validation error.
                        all_outcomes = (
                            curr_state.interaction.get_all_outcomes())
                        for outcome in all_outcomes:
                            dest_state = outcome.dest
                            if self.states[dest_state].interaction.is_terminal:
                                excluded_state_is_bypassable = True
                                break
                            if (dest_state not in curr_queue and
                                    dest_state not in processed_state_names):
                                curr_queue.append(dest_state)
                    if excluded_state_is_bypassable:
                        raise utils.ValidationError(
                            'Cannot make %s a checkpoint as it is bypassable'
                            % state_name_to_exclude)

            try:
                self._verify_all_states_reachable()
            except utils.ValidationError as e:
                warnings_list.append(python_utils.UNICODE(e))

            try:
                self._verify_no_dead_ends()
            except utils.ValidationError as e:
                warnings_list.append(python_utils.UNICODE(e))

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

            # Check that self-loop outcomes are not labelled as correct.
            all_state_names = list(self.states.keys())
            for state_name, state in self.states.items():
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
            ValidationError. One or more states are not reachable from the
                initial state of the Exploration.
        """
        # This queue stores state names.
        processed_queue = []
        curr_queue = [self.init_state_name]

        while curr_queue:
            curr_state_name = curr_queue[0]
            curr_queue = curr_queue[1:]

            if not curr_state_name in processed_queue:
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
            ValidationError. If is impossible to complete the exploration from
                a state.
        """
        # This queue stores state names.
        processed_queue = []
        curr_queue = []

        for (state_name, state) in self.states.items():
            if state.interaction.is_terminal:
                curr_queue.append(state_name)

        while curr_queue:
            curr_state_name = curr_queue[0]
            curr_queue = curr_queue[1:]

            if not curr_state_name in processed_queue:
                processed_queue.append(curr_state_name)

                for (state_name, state) in self.states.items():
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

    def get_content_html(self, state_name, content_id):
        """Return the content for a given content id of a state.

        Args:
            state_name: str. The name of the state.
            content_id: str. The id of the content.

        Returns:
            str. The html content corresponding to the given content id of a
            state.

        Raises:
            ValueError. The given state_name does not exist.
        """
        if state_name not in self.states:
            raise ValueError('State %s does not exist' % state_name)

        return self.states[state_name].get_content_html(content_id)

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
                for (ps_name, ps_val) in self.param_specs.items()}

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

    def has_state_name(self, state_name):
        """Whether the exploration has a state with the given state name.

        Args:
            state_name: str. The name of the state.

        Returns:
            bool. Returns true if the exploration has the given state name.
        """
        state_names = list(self.states.keys())
        return state_name in state_names

    def get_interaction_id_by_state_name(self, state_name):
        """Returns the interaction id of the state.

        Args:
            state_name: str. The name of the state.

        Returns:
            str or None. The ID of the interaction.
        """
        return self.states[state_name].interaction.id

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
            for (ps_name, ps_val) in param_specs_dict.items()
        }

    def update_param_changes(self, param_changes):
        """Update the param change dict.

        Args:
            param_changes: list(ParamChange). List of ParamChange objects.
        """
        self.param_changes = param_changes

    def update_init_state_name(self, init_state_name):
        """Update the name for the initial state of the exploration.

        Args:
            init_state_name: str. The new name of the initial state.
        """
        old_init_state_name = self.init_state_name
        if init_state_name not in self.states:
            raise Exception(
                'Invalid new initial state name: %s; '
                'it is not in the list of states %s for this '
                'exploration.' % (init_state_name, list(self.states.keys())))
        self.init_state_name = init_state_name
        if old_init_state_name in self.states:
            self.states[old_init_state_name].card_is_checkpoint = False
        self.init_state.card_is_checkpoint = True

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
            ValueError. At least one of the new state names already exists in
                the states dict.
        """
        for state_name in state_names:
            if state_name in self.states:
                raise ValueError('Duplicate state name %s' % state_name)

        for state_name in state_names:
            self.states[state_name] = state_domain.State.create_default_state(
                state_name)

    def rename_state(self, old_state_name, new_state_name):
        """Renames the given state.

        Args:
            old_state_name: str. The old name of state to rename.
            new_state_name: str. The new state name.

        Raises:
            ValueError. The old state name does not exist or the new state name
                is already in states dict.
        """
        if old_state_name not in self.states:
            raise ValueError('State %s does not exist' % old_state_name)
        if (old_state_name != new_state_name and
                new_state_name in self.states):
            raise ValueError('Duplicate state name: %s' % new_state_name)

        if old_state_name == new_state_name:
            return

        self._validate_state_name(new_state_name)

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
            state_name: str. The state name to be deleted.

        Raises:
            ValueError. The state does not exist or is the initial state of the
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

    def get_translatable_text(self, language_code):
        """Returns all the contents which needs translation in the given
        language.

        Args:
            language_code: str. The language code in which translation is
                required.

        Returns:
            dict(str, dict(str, str)). A dict where state_name is the key and a
            dict with content_id as the key and html content as value.
        """
        state_names_to_content_id_mapping = {}
        for state_name, state in self.states.items():
            state_names_to_content_id_mapping[state_name] = (
                state.get_content_id_mapping_needing_translations(
                    language_code))

        return state_names_to_content_id_mapping

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

    def get_languages_with_complete_translation(self):
        """Returns a list of language code in which the exploration translation
        is 100%.

        Returns:
            list(str). A list of language code in which the translation for the
            exploration is complete i.e, 100%.
        """
        content_count = self.get_content_count()
        language_code_list = []
        for language_code, count in self.get_translation_counts().items():
            if count == content_count:
                language_code_list.append(language_code)

        return language_code_list

    def get_translation_counts(self):
        """Returns a dict representing the number of translations available in a
        language for which there exists at least one translation in the
        exploration.

        Returns:
            dict(str, int). A dict with language code as a key and number of
            translation available in that language as the value.
        """
        exploration_translation_counts = collections.defaultdict(int)
        for state in self.states.values():
            state_translation_counts = state.get_translation_counts()
            for language, count in state_translation_counts.items():
                exploration_translation_counts[language] += count

        return dict(exploration_translation_counts)

    def get_content_count(self):
        """Returns the total number of distinct content fields available in the
        exploration which are user facing and can be translated into
        different languages.

        (The content field includes state content, feedback, hints, solutions.)

        Returns:
            int. The total number of distinct content fields available inside
            the exploration.
        """
        content_count = 0
        for state in self.states.values():
            content_count += state.get_translatable_content_count()

        return content_count

    @classmethod
    def _convert_states_v41_dict_to_v42_dict(cls, states_dict):
        """Converts from version 41 to 42. Version 42 changes rule input types
        for DragAndDropSortInput and ItemSelectionInput interactions to better
        support translations. Specifically, the rule inputs will store content
        ids of the html rather than the raw html. Solution answers for
        DragAndDropSortInput and ItemSelectionInput interactions are also
        updated.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """

        def migrate_rule_inputs_and_answers(new_type, value, choices):
            """Migrates SetOfHtmlString to SetOfTranslatableHtmlContentIds,
            ListOfSetsOfHtmlStrings to ListOfSetsOfTranslatableHtmlContentIds,
            and DragAndDropHtmlString to TranslatableHtmlContentId. These
            migrations are necessary to have rules work easily for multiple
            languages; instead of comparing html for equality, we compare
            content_ids for equality.

            Args:
                new_type: str. The type to migrate to.
                value: *. The value to migrate.
                choices: list(dict). The list of subtitled html dicts to extract
                    content ids from.

            Returns:
                *. The migrated rule input.
            """

            def extract_content_id_from_choices(html):
                """Given a html, find its associated content id in choices,
                which is a list of subtitled html dicts.

                Args:
                    html: str. The html to find the content id of.

                Returns:
                    str. The content id of html.
                """
                for subtitled_html_dict in choices:
                    if subtitled_html_dict['html'] == html:
                        return subtitled_html_dict['content_id']
                # If there is no match, we discard the rule input. The frontend
                # will handle invalid content ids similar to how it handled
                # non-matching html.
                return feconf.INVALID_CONTENT_ID

            if new_type == 'TranslatableHtmlContentId':
                return extract_content_id_from_choices(value)
            elif new_type == 'SetOfTranslatableHtmlContentIds':
                return [
                    migrate_rule_inputs_and_answers(
                        'TranslatableHtmlContentId', html, choices
                    ) for html in value
                ]
            elif new_type == 'ListOfSetsOfTranslatableHtmlContentIds':
                return [
                    migrate_rule_inputs_and_answers(
                        'SetOfTranslatableHtmlContentIds', html_set, choices
                    ) for html_set in value
                ]

        for state_dict in states_dict.values():
            interaction_id = state_dict['interaction']['id']
            if interaction_id not in [
                    'DragAndDropSortInput', 'ItemSelectionInput']:
                continue

            solution = state_dict['interaction']['solution']
            choices = state_dict['interaction']['customization_args'][
                'choices']['value']
            if interaction_id == 'ItemSelectionInput':
                # The solution type will be migrated from SetOfHtmlString to
                # SetOfTranslatableHtmlContentIds.
                if solution is not None:
                    solution['correct_answer'] = (
                        migrate_rule_inputs_and_answers(
                            'SetOfTranslatableHtmlContentIds',
                            solution['correct_answer'],
                            choices)
                    )
            if interaction_id == 'DragAndDropSortInput':
                # The solution type will be migrated from ListOfSetsOfHtmlString
                # to ListOfSetsOfTranslatableHtmlContentIds.
                if solution is not None:
                    solution['correct_answer'] = (
                        migrate_rule_inputs_and_answers(
                            'ListOfSetsOfTranslatableHtmlContentIds',
                            solution['correct_answer'],
                            choices)
                    )

            for answer_group_dict in state_dict['interaction']['answer_groups']:
                for rule_spec_dict in answer_group_dict['rule_specs']:
                    rule_type = rule_spec_dict['rule_type']
                    rule_inputs = rule_spec_dict['inputs']

                    if interaction_id == 'ItemSelectionInput':
                        # All rule inputs for ItemSelectionInput will be
                        # migrated from SetOfHtmlString to
                        # SetOfTranslatableHtmlContentIds.
                        rule_inputs['x'] = migrate_rule_inputs_and_answers(
                            'SetOfTranslatableHtmlContentIds',
                            rule_inputs['x'],
                            choices)
                    if interaction_id == 'DragAndDropSortInput':
                        rule_types_with_list_of_sets = [
                            'IsEqualToOrdering',
                            'IsEqualToOrderingWithOneItemAtIncorrectPosition'
                        ]
                        if rule_type in rule_types_with_list_of_sets:
                            # For rule type IsEqualToOrdering and
                            # IsEqualToOrderingWithOneItemAtIncorrectPosition,
                            # the x input will be migrated from
                            # ListOfSetsOfHtmlStrings to
                            # ListOfSetsOfTranslatableHtmlContentIds.
                            rule_inputs['x'] = migrate_rule_inputs_and_answers(
                                'ListOfSetsOfTranslatableHtmlContentIds',
                                rule_inputs['x'],
                                choices)
                        elif rule_type == 'HasElementXAtPositionY':
                            # For rule type HasElementXAtPositionY,
                            # the x input will be migrated from
                            # DragAndDropHtmlString to
                            # TranslatableHtmlContentId, and the y input will
                            # remain as DragAndDropPositiveInt.
                            rule_inputs['x'] = migrate_rule_inputs_and_answers(
                                'TranslatableHtmlContentId',
                                rule_inputs['x'],
                                choices)
                        elif rule_type == 'HasElementXBeforeElementY':
                            # For rule type HasElementXBeforeElementY,
                            # the x and y inputs will be migrated from
                            # DragAndDropHtmlString to
                            # TranslatableHtmlContentId.
                            for rule_input_name in ['x', 'y']:
                                rule_inputs[rule_input_name] = (
                                    migrate_rule_inputs_and_answers(
                                        'TranslatableHtmlContentId',
                                        rule_inputs[rule_input_name],
                                        choices))

        return states_dict

    @classmethod
    def _convert_states_v42_dict_to_v43_dict(cls, states_dict):
        """Converts from version 42 to 43. Version 43 adds a new customization
        arg to NumericExpressionInput, AlgebraicExpressionInput, and
        MathEquationInput. The customization arg will allow creators to choose
        whether to render the division sign (÷) instead of a fraction for the
        division operation.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            interaction_id = state_dict['interaction']['id']
            if interaction_id not in [
                    'NumericExpressionInput', 'AlgebraicExpressionInput',
                    'MathEquationInput']:
                continue

            customization_args = state_dict['interaction']['customization_args']
            customization_args.update({
                'useFractionForDivision': {
                    'value': True
                }
            })

        return states_dict

    @classmethod
    def _convert_states_v43_dict_to_v44_dict(cls, states_dict, init_state_name):
        """Converts from version 43 to version 44. Version 44 adds
        card_is_checkpoint boolean to the state, which allows creators to
        mark a state as a checkpoint for the learners

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initalize a
                State domain object.
            init_state_name: str. Name of the first state.

        Returns:
            dict. The converted states_dict.
        """
        for (state_name, state_dict) in states_dict.items():
            state_dict['card_is_checkpoint'] = bool(
                state_name == init_state_name)
        return states_dict

    @classmethod
    def _convert_states_v44_dict_to_v45_dict(cls, states_dict):
        """Converts from version 44 to 45. Version 45 contains
        linked skill id.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """

        for state_dict in states_dict.values():
            state_dict['linked_skill_id'] = None
        return states_dict

    @classmethod
    def update_states_from_model(
            cls, versioned_exploration_states,
            current_states_schema_version, init_state_name):
        """Converts the states blob contained in the given
        versioned_exploration_states dict from current_states_schema_version to
        current_states_schema_version + 1.
        Note that the versioned_exploration_states being passed in is modified
        in-place.

        Args:
            versioned_exploration_states: dict. A dict with two keys:
                - states_schema_version: int. The states schema version for
                    the exploration.
                - states: dict. The dict of states which is contained in the
                    exploration. The keys are state names and the values are
                    dicts used to initialize a State domain object.
            current_states_schema_version: int. The current states
                schema version.
            init_state_name: str. Name of initial state.
        """
        versioned_exploration_states['states_schema_version'] = (
            current_states_schema_version + 1)

        conversion_fn = getattr(cls, '_convert_states_v%s_dict_to_v%s_dict' % (
            current_states_schema_version, current_states_schema_version + 1))
        if current_states_schema_version == 43:
            versioned_exploration_states['states'] = conversion_fn(
                versioned_exploration_states['states'], init_state_name)
        else:
            versioned_exploration_states['states'] = conversion_fn(
                versioned_exploration_states['states'])

    # The current version of the exploration YAML schema. If any backward-
    # incompatible changes are made to the exploration schema in the YAML
    # definitions, this version number must be changed and a migration process
    # put in place.
    CURRENT_EXP_SCHEMA_VERSION = 50
    EARLIEST_SUPPORTED_EXP_SCHEMA_VERSION = 46

    @classmethod
    def _convert_v46_dict_to_v47_dict(cls, exploration_dict):
        """Converts a v46 exploration dict into a v47 exploration dict.
        Changes rule input types for DragAndDropSortInput and ItemSelectionInput
        interactions to better support translations. Specifically, the rule
        inputs will store content ids of html rather than the raw html.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v46.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v47.
        """
        exploration_dict['schema_version'] = 47

        exploration_dict['states'] = cls._convert_states_v41_dict_to_v42_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 42

        return exploration_dict

    @classmethod
    def _convert_v47_dict_to_v48_dict(cls, exploration_dict):
        """Converts a v47 exploration dict into a v48 exploration dict.
        Adds a new customization arg to NumericExpressionInput,
        AlgebraicExpressionInput, and MathEquationInput. The customization arg
        will allow creators to choose whether to render the division sign (÷)
        instead of a fraction for the division operation.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v47.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v48.
        """
        exploration_dict['schema_version'] = 48

        exploration_dict['states'] = cls._convert_states_v42_dict_to_v43_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 43

        return exploration_dict

    @classmethod
    def _convert_v48_dict_to_v49_dict(cls, exploration_dict):
        """Converts a v48 exploration dict into a v49 exploration dict.
        Adds card_is_checkpoint to mark a state as a checkpoint for the
        learners.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v48.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v49.
        """
        exploration_dict['schema_version'] = 49
        exploration_dict['states'] = cls._convert_states_v43_dict_to_v44_dict(
            exploration_dict['states'], exploration_dict['init_state_name'])
        exploration_dict['states_schema_version'] = 44

        return exploration_dict

    @classmethod
    def _convert_v49_dict_to_v50_dict(cls, exploration_dict):
        """Converts a v49 exploration dict into a v50 exploration dict.
        Version 50 contains linked skill id to exploration state.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v49.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v50.
        """

        exploration_dict['schema_version'] = 50

        exploration_dict['states'] = cls._convert_states_v44_dict_to_v45_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 45

        return exploration_dict

    @classmethod
    def _migrate_to_latest_yaml_version(cls, yaml_content):
        """Return the YAML content of the exploration in the latest schema
        format.

        Args:
            yaml_content: str. The YAML representation of the exploration.

        Returns:
            tuple(dict, int). The dict 'exploration_dict' is the representation
            of the Exploration and the 'initial_schema_version' is the initial
            schema version provided in 'yaml_content'.

        Raises:
            InvalidInputException. The 'yaml_content' or the schema version
                is not specified.
            Exception. The exploration schema version is not valid.
        """
        try:
            exploration_dict = utils.dict_from_yaml(yaml_content)
        except utils.InvalidInputException as e:
            raise utils.InvalidInputException(
                'Please ensure that you are uploading a YAML text file, not '
                'a zip file. The YAML parser returned the following error: %s'
                % e)

        exploration_schema_version = exploration_dict['schema_version']
        if not (cls.EARLIEST_SUPPORTED_EXP_SCHEMA_VERSION <=
                exploration_schema_version
                <= cls.CURRENT_EXP_SCHEMA_VERSION):
            raise Exception(
                'Sorry, we can only process v%s to v%s exploration YAML files '
                'at present.' % (
                    cls.EARLIEST_SUPPORTED_EXP_SCHEMA_VERSION,
                    cls.CURRENT_EXP_SCHEMA_VERSION))

        if exploration_schema_version == 46:
            exploration_dict = cls._convert_v46_dict_to_v47_dict(
                exploration_dict)
            exploration_schema_version = 47

        if exploration_schema_version == 47:
            exploration_dict = cls._convert_v47_dict_to_v48_dict(
                exploration_dict)
            exploration_schema_version = 48

        if exploration_schema_version == 48:
            exploration_dict = cls._convert_v48_dict_to_v49_dict(
                exploration_dict)
            exploration_schema_version = 49

        if exploration_schema_version == 49:
            exploration_dict = cls._convert_v49_dict_to_v50_dict(
                exploration_dict)
            exploration_schema_version = 50

        return exploration_dict

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
            InvalidInputException. The initial schema version of exploration is
                outside the range [EARLIEST_SUPPORTED_EXP_SCHEMA_VERSION,
                CURRENT_EXP_SCHEMA_VERSION].
        """
        exploration_dict = cls._migrate_to_latest_yaml_version(yaml_content)
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

        return python_utils.yaml_from_dict(exp_dict)

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
                       for (state_name, state) in self.states.items()}
        })

    def serialize(self):
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded utf-8 string encoding all of the information
            composing the object.
        """
        exploration_dict = self.to_dict()
        # The only reason we add the version parameter separately is that our
        # yaml encoding/decoding of this object does not handle the version
        # parameter.
        # NOTE: If this changes in the future (i.e the version parameter is
        # added as part of the yaml representation of this object), all YAML
        # files must add a version parameter to their files with the correct
        # version of this object. The line below must then be moved to
        # to_dict().
        exploration_dict['version'] = self.version

        if self.created_on:
            exploration_dict['created_on'] = (
                utils.convert_naive_datetime_to_string(self.created_on))

        if self.last_updated:
            exploration_dict['last_updated'] = (
                utils.convert_naive_datetime_to_string(self.last_updated))

        return json.dumps(exploration_dict).encode('utf-8')

    @classmethod
    def deserialize(cls, json_string):
        """Returns an Exploration domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded utf-8 string that can be
                decoded into a dictionary representing an Exploration. Only call
                on strings that were created using serialize().

        Returns:
            Exploration. The corresponding Exploration domain object.
        """
        exploration_dict = json.loads(json_string.decode('utf-8'))
        created_on = (
            utils.convert_string_to_naive_datetime_object(
                exploration_dict['created_on'])
            if 'created_on' in exploration_dict else None)
        last_updated = (
            utils.convert_string_to_naive_datetime_object(
                exploration_dict['last_updated'])
            if 'last_updated' in exploration_dict else None)
        exploration = cls.from_dict(
            exploration_dict,
            exploration_version=exploration_dict['version'],
            exploration_created_on=created_on,
            exploration_last_updated=last_updated)

        return exploration

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
                - objective: str. The exploration objective.
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
                for (state_name, state) in self.states.items()
            },
            'title': self.title,
            'objective': self.objective,
            'language_code': self.language_code,
            'correctness_feedback_enabled': self.correctness_feedback_enabled,
        }

    def get_all_html_content_strings(self):
        """Gets all html content strings used in this exploration.

        Returns:
            list(str). The list of html content strings.
        """
        html_list = []
        for state in self.states.values():
            content_html = state.content.html
            interaction_html_list = (
                state.interaction.get_all_html_content_strings())
            html_list += [content_html] + interaction_html_list

        return html_list


class ExplorationSummary(python_utils.OBJECT):
    """Domain object for an Oppia exploration summary."""

    def __init__(
            self, exploration_id, title, category, objective,
            language_code, tags, ratings, scaled_average_rating, status,
            community_owned, owner_ids, editor_ids, voice_artist_ids,
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
            voice_artist_ids: list(str). List of the users ids who have access
                to voiceover this exploration.
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
        self.voice_artist_ids = voice_artist_ids
        self.viewer_ids = viewer_ids
        self.contributor_ids = contributor_ids
        self.contributors_summary = contributors_summary
        self.version = version
        self.exploration_model_created_on = exploration_model_created_on
        self.exploration_model_last_updated = exploration_model_last_updated
        self.first_published_msec = first_published_msec

    def validate(self):
        """Validates various properties of the ExplorationSummary.

        Raises:
            ValidationError. One or more attributes of the ExplorationSummary
                are invalid.
        """
        if not isinstance(self.title, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the exploration title', allow_empty=True)

        if not isinstance(self.category, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the exploration category', allow_empty=True)

        if not isinstance(self.objective, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.tags, list):
            raise utils.ValidationError(
                'Expected \'tags\' to be a list, received %s' % self.tags)
        for tag in self.tags:
            if not isinstance(tag, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each tag in \'tags\' to be a string, received '
                    '\'%s\'' % tag)

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(constants.TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain lowercase letters and spaces, '
                    'received \'%s\'' % tag)

            if (tag[0] not in string.ascii_lowercase or
                    tag[-1] not in string.ascii_lowercase):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received '
                    '\'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received \'%s\'' % tag)
        if len(set(self.tags)) != len(self.tags):
            raise utils.ValidationError('Some tags duplicate each other')

        if not isinstance(self.ratings, dict):
            raise utils.ValidationError(
                'Expected ratings to be a dict, received %s' % self.ratings)

        valid_rating_keys = ['1', '2', '3', '4', '5']
        actual_rating_keys = sorted(self.ratings.keys())
        if valid_rating_keys != actual_rating_keys:
            raise utils.ValidationError(
                'Expected ratings to have keys: %s, received %s' % (
                    (', ').join(valid_rating_keys),
                    (', ').join(actual_rating_keys)))
        for value in self.ratings.values():
            if not isinstance(value, int):
                raise utils.ValidationError(
                    'Expected value to be int, received %s' % value)
            if value < 0:
                raise utils.ValidationError(
                    'Expected value to be non-negative, received %s' % (
                        value))

        if not isinstance(self.scaled_average_rating, float):
            raise utils.ValidationError(
                'Expected scaled_average_rating to be float, received %s' % (
                    self.scaled_average_rating))

        if not isinstance(self.status, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected status to be string, received %s' % self.status)

        if not isinstance(self.community_owned, bool):
            raise utils.ValidationError(
                'Expected community_owned to be bool, received %s' % (
                    self.community_owned))

        if not isinstance(self.owner_ids, list):
            raise utils.ValidationError(
                'Expected owner_ids to be list, received %s' % self.owner_ids)
        for owner_id in self.owner_ids:
            if not isinstance(owner_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in owner_ids to '
                    'be string, received %s' % owner_id)

        if not isinstance(self.editor_ids, list):
            raise utils.ValidationError(
                'Expected editor_ids to be list, received %s' % self.editor_ids)
        for editor_id in self.editor_ids:
            if not isinstance(editor_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in editor_ids to '
                    'be string, received %s' % editor_id)

        if not isinstance(self.voice_artist_ids, list):
            raise utils.ValidationError(
                'Expected voice_artist_ids to be list, received %s' % (
                    self.voice_artist_ids))
        for voice_artist_id in self.voice_artist_ids:
            if not isinstance(voice_artist_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in voice_artist_ids to '
                    'be string, received %s' % voice_artist_id)

        if not isinstance(self.viewer_ids, list):
            raise utils.ValidationError(
                'Expected viewer_ids to be list, received %s' % self.viewer_ids)
        for viewer_id in self.viewer_ids:
            if not isinstance(viewer_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in viewer_ids to '
                    'be string, received %s' % viewer_id)

        if not isinstance(self.contributor_ids, list):
            raise utils.ValidationError(
                'Expected contributor_ids to be list, received %s' % (
                    self.contributor_ids))
        for contributor_id in self.contributor_ids:
            if not isinstance(contributor_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in contributor_ids to '
                    'be string, received %s' % contributor_id)

        if not isinstance(self.contributors_summary, dict):
            raise utils.ValidationError(
                'Expected contributors_summary to be dict, received %s' % (
                    self.contributors_summary))

    def to_metadata_dict(self):
        """Given an exploration summary, this method returns a dict containing
        id, title and objective of the exploration.

        Returns:
            dict. A metadata dict for the given exploration summary.
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

    def is_private(self):
        """Checks whether the exploration is private.

        Returns:
            bool. Whether the exploration is private.
        """
        return self.status == constants.ACTIVITY_STATUS_PRIVATE

    def is_solely_owned_by_user(self, user_id):
        """Checks whether the exploration is solely owned by the user.

        Args:
            user_id: str. The id of the user.

        Returns:
            bool. Whether the exploration is solely owned by the user.
        """
        return user_id in self.owner_ids and len(self.owner_ids) == 1

    def does_user_have_any_role(self, user_id):
        """Checks if a given user has any role within the exploration.

        Args:
            user_id: str. User id of the user.

        Returns:
            bool. Whether the given user has any role in the exploration.
        """
        return (
            user_id in self.owner_ids or
            user_id in self.editor_ids or
            user_id in self.voice_artist_ids or
            user_id in self.viewer_ids
        )

    def add_contribution_by_user(self, contributor_id):
        """Add a new contributor to the contributors summary.

        Args:
            contributor_id: str. ID of the contributor to be added.
        """
        # We don't want to record the contributions of system users.
        if contributor_id not in constants.SYSTEM_USER_IDS:
            self.contributors_summary[contributor_id] = (
                self.contributors_summary.get(contributor_id, 0) + 1)

        self.contributor_ids = list(self.contributors_summary.keys())
