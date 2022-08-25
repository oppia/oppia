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

from __future__ import annotations

import collections
import copy
import datetime
import json
import re
import string

from core import feconf
from core import schema_utils
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import param_domain
from core.domain import state_domain
from core.domain import translation_domain
from extensions.objects.models import objects

from typing import (
    Callable, Dict, List, Mapping, Optional, Sequence,
    Set, Tuple, Union, cast
)
from typing_extensions import Final, TypedDict

from core.domain import html_cleaner  # pylint: disable=invalid-import-from # isort:skip
from core.domain import html_validation_service  # pylint: disable=invalid-import-from # isort:skip
from core.domain import interaction_registry  # pylint: disable=invalid-import-from # isort:skip
from core.platform import models  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
# TODO(bhenning): Prior to July 2015, exploration changes involving rules were
# logged using the key 'widget_handlers'. These need to be migrated to
# 'answer_groups' and 'default_outcome'.
STATE_PROPERTY_PARAM_CHANGES: Final = 'param_changes'
STATE_PROPERTY_CONTENT: Final = 'content'
STATE_PROPERTY_SOLICIT_ANSWER_DETAILS: Final = 'solicit_answer_details'
STATE_PROPERTY_CARD_IS_CHECKPOINT: Final = 'card_is_checkpoint'
STATE_PROPERTY_RECORDED_VOICEOVERS: Final = 'recorded_voiceovers'
STATE_PROPERTY_WRITTEN_TRANSLATIONS: Final = 'written_translations'
STATE_PROPERTY_INTERACTION_ID: Final = 'widget_id'
STATE_PROPERTY_NEXT_CONTENT_ID_INDEX: Final = 'next_content_id_index'
STATE_PROPERTY_LINKED_SKILL_ID: Final = 'linked_skill_id'
STATE_PROPERTY_INTERACTION_CUST_ARGS: Final = 'widget_customization_args'
STATE_PROPERTY_INTERACTION_ANSWER_GROUPS: Final = 'answer_groups'
STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME: Final = 'default_outcome'
STATE_PROPERTY_UNCLASSIFIED_ANSWERS: Final = (
    'confirmed_unclassified_answers')
STATE_PROPERTY_INTERACTION_HINTS: Final = 'hints'
STATE_PROPERTY_INTERACTION_SOLUTION: Final = 'solution'
# Deprecated state properties.
STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS_DEPRECATED: Final = (
    # Deprecated in state schema v27.
    'content_ids_to_audio_translations')

# These four properties are kept for legacy purposes and are not used anymore.
STATE_PROPERTY_INTERACTION_HANDLERS: Final = 'widget_handlers'
STATE_PROPERTY_INTERACTION_STICKY: Final = 'widget_sticky'
GADGET_PROPERTY_VISIBILITY: Final = 'gadget_visibility'
GADGET_PROPERTY_CUST_ARGS: Final = 'gadget_customization_args'

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW: Final = 'create_new'
# This takes an additional 'state_name' parameter.
CMD_ADD_STATE: Final = 'add_state'
# This takes additional 'old_state_name' and 'new_state_name' parameters.
CMD_RENAME_STATE: Final = 'rename_state'
# This takes an additional 'state_name' parameter.
CMD_DELETE_STATE: Final = 'delete_state'
# TODO(#12981): Write a one-off job to modify all existing translation
# suggestions that use DEPRECATED_CMD_ADD_TRANSLATION to use
# CMD_ADD_WRITTEN_TRANSLATION instead. Suggestions in the future will only use
# CMD_ADD_WRITTEN_TRANSLATION.
# DEPRECATED: This command is deprecated. Please do not use. The command remains
# here to support old suggestions. This takes additional 'state_name',
# 'content_id', 'language_code' and 'content_html' and 'translation_html'
# parameters.
DEPRECATED_CMD_ADD_TRANSLATION: Final = 'add_translation'
# This takes additional 'state_name', 'content_id', 'language_code',
# 'data_format', 'content_html' and 'translation_html' parameters.
CMD_ADD_WRITTEN_TRANSLATION: Final = 'add_written_translation'
# This takes additional 'content_id', 'language_code' and 'state_name'
# parameters.
CMD_MARK_WRITTEN_TRANSLATION_AS_NEEDING_UPDATE: Final = (
    'mark_written_translation_as_needing_update')
# This takes additional 'content_id' and 'state_name' parameters.
CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE: Final = (
    'mark_written_translations_as_needing_update')
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_STATE_PROPERTY: Final = 'edit_state_property'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_EXPLORATION_PROPERTY: Final = 'edit_exploration_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION: Final = (
    'migrate_states_schema_to_latest_version')

# These are categories to which answers may be classified. These values should
# not be changed because they are persisted in the data store within answer
# logs.

# Represents answers classified using rules defined as part of an interaction.
EXPLICIT_CLASSIFICATION: Final = 'explicit'
# Represents answers which are contained within the training data of an answer
# group.
TRAINING_DATA_CLASSIFICATION: Final = 'training_data_match'
# Represents answers which were predicted using a statistical training model
# from training data within an answer group.
STATISTICAL_CLASSIFICATION: Final = 'statistical_classifier'
# Represents answers which led to the 'default outcome' of an interaction,
# rather than belonging to a specific answer group.
DEFAULT_OUTCOME_CLASSIFICATION: Final = 'default_outcome'

TYPE_INVALID_EXPRESSION: Final = 'Invalid'
TYPE_VALID_ALGEBRAIC_EXPRESSION: Final = 'AlgebraicExpressionInput'
TYPE_VALID_NUMERIC_EXPRESSION: Final = 'NumericExpressionInput'
TYPE_VALID_MATH_EQUATION: Final = 'MathEquationInput'
MATH_INTERACTION_TYPES: Final = [
    TYPE_VALID_ALGEBRAIC_EXPRESSION,
    TYPE_VALID_NUMERIC_EXPRESSION,
    TYPE_VALID_MATH_EQUATION
]
ALGEBRAIC_MATH_INTERACTIONS: Final = [
    TYPE_VALID_ALGEBRAIC_EXPRESSION,
    TYPE_VALID_MATH_EQUATION
]
MATH_INTERACTION_DEPRECATED_RULES: Final = [
    'ContainsSomeOf', 'OmitsSomeOf', 'MatchesWithGeneralForm']


def clean_math_expression(math_expression: str) -> str:
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


class MetadataVersionHistoryDict(TypedDict):
    """Dictionary representing MetadataVersionHistory object."""

    last_edited_version_number: Optional[int]
    last_edited_committer_id: str


class ExplorationVersionHistoryDict(TypedDict):
    """Dictionary representing ExplorationVersionHistory object."""

    exploration_id: str
    exploration_version: int
    state_version_history: Dict[str, state_domain.StateVersionHistoryDict]
    metadata_version_history: MetadataVersionHistoryDict
    committer_ids: List[str]


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
    STATE_PROPERTIES: List[str] = [
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
        STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS_DEPRECATED
    ]

    # The allowed list of exploration properties which can be used in
    # edit_exploration_property command.
    EXPLORATION_PROPERTIES: List[str] = [
        'title', 'category', 'objective', 'language_code', 'tags',
        'blurb', 'author_notes', 'param_specs', 'param_changes',
        'init_state_name', 'auto_tts_enabled', 'correctness_feedback_enabled',
        'edits_allowed'
    ]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['category', 'title'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_STATE,
        'required_attribute_names': ['state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_STATE,
        'required_attribute_names': ['state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_RENAME_STATE,
        'required_attribute_names': ['new_state_name', 'old_state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': DEPRECATED_CMD_ADD_TRANSLATION,
        'required_attribute_names': [
            'state_name', 'content_id', 'language_code', 'content_html',
            'translation_html'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_WRITTEN_TRANSLATION,
        'required_attribute_names': [
            'state_name', 'content_id', 'language_code', 'content_html',
            'translation_html', 'data_format'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MARK_WRITTEN_TRANSLATION_AS_NEEDING_UPDATE,
        'required_attribute_names': [
            'content_id',
            'language_code',
            'state_name'
        ],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE,
        'required_attribute_names': ['content_id', 'state_name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_EDIT_STATE_PROPERTY,
        'required_attribute_names': [
            'property_name', 'state_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': STATE_PROPERTIES},
        # TODO(#12991): Remove this once once we use the migration jobs to
        # remove the deprecated values from the server data.
        'deprecated_values': {'property_name': ['fallbacks']}
    }, {
        'name': CMD_EDIT_EXPLORATION_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': EXPLORATION_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
        'required_attribute_names': ['version_number'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]

    # TODO(#12991): Remove this once once we use the migration jobs to remove
    # the deprecated commands from the server data.
    DEPRECATED_COMMANDS: List[str] = [
        'clone', 'add_gadget', 'edit_gadget_property',
        'delete_gadget', 'rename_gadget']


class TransientCheckpointUrlDict(TypedDict):
    """Dictionary representing the TransientCheckpointUrl object."""

    exploration_id: str
    furthest_reached_checkpoint_state_name: str
    furthest_reached_checkpoint_exp_version: int
    most_recently_reached_checkpoint_state_name: str
    most_recently_reached_checkpoint_exp_version: int


class TransientCheckpointUrl:
    """Domain object representing the checkpoint progress of a
    logged-out user.
    """

    def __init__(
        self,
        exploration_id: str,
        furthest_reached_checkpoint_state_name: str,
        furthest_reached_checkpoint_exp_version: int,
        most_recently_reached_checkpoint_state_name: str,
        most_recently_reached_checkpoint_exp_version: int
    ) -> None:
        """Initializes a TransientCheckpointUrl domain object.

        Args:
            exploration_id: str. Id of the exploration.
            furthest_reached_checkpoint_state_name: str. State name of the
                furthest reached checkpoint in the exploration.
            furthest_reached_checkpoint_exp_version: int. Exploration version
                in which the user has completed most checkpoints.
            most_recently_reached_checkpoint_state_name: str. State name of
                the most recently reached checkpoint in the exploration.
            most_recently_reached_checkpoint_exp_version: int. Exploration
                version in which a checkpoint was most recently reached.
        """
        self.exploration_id = exploration_id
        self.furthest_reached_checkpoint_state_name = (
            furthest_reached_checkpoint_state_name)
        self.furthest_reached_checkpoint_exp_version = (
            furthest_reached_checkpoint_exp_version)
        self.most_recently_reached_checkpoint_state_name = (
            most_recently_reached_checkpoint_state_name)
        self.most_recently_reached_checkpoint_exp_version = (
            most_recently_reached_checkpoint_exp_version)

    def to_dict(self) -> TransientCheckpointUrlDict:
        """Convert the TransientCheckpointUrl domain instance into a dictionary
        form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the TransientCheckpointUrl class
            information in a dictionary form.
        """

        return {
            'exploration_id': self.exploration_id,
            'furthest_reached_checkpoint_exp_version': (
                self.furthest_reached_checkpoint_exp_version),
            'furthest_reached_checkpoint_state_name': (
                self.furthest_reached_checkpoint_state_name),
            'most_recently_reached_checkpoint_exp_version': (
                self.most_recently_reached_checkpoint_exp_version),
            'most_recently_reached_checkpoint_state_name': (
                self.most_recently_reached_checkpoint_state_name)
        }

    def validate(self) -> None:
        """Validates properties of the TransientCheckpointUrl object.

        Raises:
            ValidationError. One or more attributes of the
                TransientCheckpointUrl are invalid.
        """
        if not isinstance(self.exploration_id, str):
            raise utils.ValidationError(
            'Expected exploration_id to be a str, received %s'
                % self.exploration_id)

        if not isinstance(self.furthest_reached_checkpoint_state_name, str):
            raise utils.ValidationError(
                'Expected furthest_reached_checkpoint_state_name to be a str,'
                'received %s' % self.furthest_reached_checkpoint_state_name
            )

        if not isinstance(self.furthest_reached_checkpoint_exp_version, int):
            raise utils.ValidationError(
                'Expected furthest_reached_checkpoint_exp_version to be an int'
            )

        if not isinstance(
            self.most_recently_reached_checkpoint_state_name, str
        ):
            raise utils.ValidationError(
                'Expected most_recently_reached_checkpoint_state_name to be a'
                ' str, received %s'
                % self.most_recently_reached_checkpoint_state_name
            )

        if not isinstance(
            self.most_recently_reached_checkpoint_exp_version, int
        ):
            raise utils.ValidationError(
                'Expected most_recently_reached_checkpoint_exp_version'
                ' to be an int'
            )


class ExplorationCommitLogEntryDict(TypedDict):
    """Dictionary representing the ExplorationCommitLogEntry object."""

    last_updated: float
    exploration_id: str
    commit_type: str
    commit_message: str
    version: int
    post_commit_status: str
    post_commit_community_owned: bool
    post_commit_is_private: bool


class ExplorationCommitLogEntry:
    """Value object representing a commit to an exploration."""

    # Here, Any is used because argument `commit_cmds` can accept
    # List of dictionaries that can contain arbitrary no of keys
    # with different types of values like int, str, List[str], Dict
    # and other types too. So, to make the argument generalized for
    # every dictionary we used Any type here.
    def __init__(
        self,
        created_on: datetime.datetime,
        last_updated: datetime.datetime,
        user_id: str,
        exploration_id: str,
        commit_type: str,
        commit_message: str,
        commit_cmds: Sequence[
            Mapping[str, change_domain.AcceptableChangeDictTypes]
        ],
        version: int,
        post_commit_status: str,
        post_commit_community_owned: bool,
        post_commit_is_private: bool
    ) -> None:
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

    def to_dict(self) -> ExplorationCommitLogEntryDict:
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


class ExpVersionReferenceDict(TypedDict):
    """Dictionary representing the ExpVersionReference object."""

    exp_id: str
    version: int


class ExpVersionReference:
    """Value object representing an exploration ID and a version number."""

    def __init__(self, exp_id: str, version: int) -> None:
        """Initializes an ExpVersionReference domain object.

        Args:
            exp_id: str. ID of the exploration.
            version: int. Version of the exploration.
        """
        self.exp_id = exp_id
        self.version = version
        self.validate()

    def to_dict(self) -> ExpVersionReferenceDict:
        """Returns a dict representing this ExpVersionReference domain object.

        Returns:
            dict. A dict, mapping all fields of ExpVersionReference instance.
        """
        return {
            'exp_id': self.exp_id,
            'version': self.version
        }

    def validate(self) -> None:
        """Validates properties of the ExpVersionReference.

        Raises:
            ValidationError. One or more attributes of the ExpVersionReference
                are invalid.
        """
        if not isinstance(self.exp_id, str):
            raise utils.ValidationError(
                'Expected exp_id to be a str, received %s' % self.exp_id)

        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be an int, received %s' % self.version)


class ExplorationVersionsDiff:
    """Domain object for the difference between two versions of an Oppia
    exploration.

    Attributes:
        added_state_names: list(str). Names of the states added to the
            exploration from prev_exp_version to current_exp_version. It stores
            the newest names of the added states.
        deleted_state_names: list(str). Name sof the states deleted from the
            exploration from prev_exp_version to current_exp_version. It stores
            the initial names of the deleted states from pre_exp_version.
        new_to_old_state_names: dict. Dictionary mapping state names of
            current_exp_version to the state names of prev_exp_version.
            It doesn't include the name changes of added/deleted states.
        old_to_new_state_names: dict. Dictionary mapping state names of
            prev_exp_version to the state names of current_exp_version.
            It doesn't include the name changes of added/deleted states.
    """

    def __init__(self, change_list: List[ExplorationChange]) -> None:
        """Constructs an ExplorationVersionsDiff domain object.

        Args:
            change_list: list(ExplorationChange). A list of all of the commit
                cmds from the old version of the exploration up to the next
                version.
        """

        added_state_names: List[str] = []
        deleted_state_names: List[str] = []
        new_to_old_state_names: Dict[str, str] = {}

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


class VersionedExplorationInteractionIdsMapping:
    """Domain object representing the mapping of state names to interaction ids
    in an exploration.
    """

    def __init__(
        self,
        version: int,
        state_interaction_ids_dict: Dict[str, str]
    ) -> None:
        """Initialises an VersionedExplorationInteractionIdsMapping domain
        object.

        Args:
            version: int. The version of the exploration.
            state_interaction_ids_dict: dict. A dict where each key-value pair
                represents, respectively, a state name and an interaction id.
        """
        self.version = version
        self.state_interaction_ids_dict = state_interaction_ids_dict


class ExplorationDict(TypedDict):
    """Dictionary representing the Exploration object."""

    id: str
    title: str
    category: str
    objective: str
    language_code: str
    tags: List[str]
    blurb: str
    author_notes: str
    states_schema_version: int
    init_state_name: str
    states: Dict[str, state_domain.StateDict]
    param_specs: Dict[str, param_domain.ParamSpecDict]
    param_changes: List[param_domain.ParamChangeDict]
    auto_tts_enabled: bool
    correctness_feedback_enabled: bool
    edits_allowed: bool


class VersionedExplorationDict(ExplorationDict):
    """Dictionary representing versioned Exploration object."""

    schema_version: int


class ExplorationPlayerDict(TypedDict):
    """Dictionary representing Exploration for learner view."""

    init_state_name: str
    param_changes: List[param_domain.ParamChangeDict]
    param_specs: Dict[str, param_domain.ParamSpecDict]
    states: Dict[str, state_domain.StateDict]
    title: str
    objective: str
    language_code: str
    correctness_feedback_enabled: bool


class VersionedExplorationStatesDict(TypedDict):
    """Dictionary representing the versioned Exploration state."""

    states_schema_version: int
    states: Dict[str, state_domain.StateDict]


class Exploration(translation_domain.BaseTranslatableObject):
    """Domain object for an Oppia exploration."""

    def __init__(
        self,
        exploration_id: str,
        title: str,
        category: str,
        objective: str,
        language_code: str,
        tags: List[str],
        blurb: str,
        author_notes: str,
        states_schema_version: int,
        init_state_name: str,
        states_dict: Dict[str, state_domain.StateDict],
        param_specs_dict: Dict[str, param_domain.ParamSpecDict],
        param_changes_list: List[param_domain.ParamChangeDict],
        version: int,
        auto_tts_enabled: bool,
        correctness_feedback_enabled: bool,
        edits_allowed: bool,
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
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
            edits_allowed: bool. True when edits to the exploration is allowed.
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

        self.states: Dict[str, state_domain.State] = {}
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
        self.edits_allowed = edits_allowed

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields/objects in the exploration.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        for state in self.states.values():
            (
                translatable_contents_collection
                .add_fields_from_translatable_object(state)
            )
        return translatable_contents_collection

    @classmethod
    def create_default_exploration(
        cls,
        exploration_id: str,
        title: str = feconf.DEFAULT_EXPLORATION_TITLE,
        init_state_name: str = feconf.DEFAULT_INIT_STATE_NAME,
        category: str = feconf.DEFAULT_EXPLORATION_CATEGORY,
        objective: str = feconf.DEFAULT_EXPLORATION_OBJECTIVE,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> Exploration:
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
            feconf.DEFAULT_AUTO_TTS_ENABLED,
            feconf.DEFAULT_CORRECTNESS_FEEDBACK_ENABLED, True)

    @classmethod
    def from_dict(
        cls,
        exploration_dict: ExplorationDict,
        exploration_version: int = 0,
        exploration_created_on: Optional[datetime.datetime] = None,
        exploration_last_updated: Optional[datetime.datetime] = None
    ) -> Exploration:
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

        Raises:
            Exception. Some parameter was used in a state but not declared
                in the Exploration dict.
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
        exploration.edits_allowed = exploration_dict['edits_allowed']

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
                if idict['solution'] is not None and idict['id'] is not None
                else None
            )

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
    def _validate_state_name(cls, name: str) -> None:
        """Validates name string.

        Args:
            name: str. The name to validate.
        """
        utils.require_valid_name(name, 'a state name')

    def validate(self, strict: bool = False) -> None:
        """Validates various properties of the Exploration.

        Args:
            strict: bool. If True, the exploration is assumed to be published,
                and the validation checks are stricter.

        Raises:
            ValidationError. One or more attributes of the Exploration are
                invalid.
        """
        if not isinstance(self.title, str):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the exploration title', allow_empty=True)

        if not isinstance(self.category, str):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the exploration category', allow_empty=True)

        if not isinstance(self.objective, str):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, str):
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
            if not isinstance(tag, str):
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

        if not isinstance(self.blurb, str):
            raise utils.ValidationError(
                'Expected blurb to be a string, received %s' % self.blurb)

        if not isinstance(self.author_notes, str):
            raise utils.ValidationError(
                'Expected author_notes to be a string, received %s' %
                self.author_notes)

        if not isinstance(self.states, dict):
            raise utils.ValidationError(
                'Expected states to be a dict, received %s' % self.states)
        if not self.states:
            raise utils.ValidationError('This exploration has no states.')
        for state_name, state in self.states.items():
            self._validate_state_name(state_name)
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
                if not isinstance(answer_group.outcome.dest, str):
                    raise utils.ValidationError(
                        'Expected outcome dest to be a string, received %s'
                        % answer_group.outcome.dest)

                outcome = answer_group.outcome
                if outcome.dest_if_really_stuck is not None:
                    if not isinstance(outcome.dest_if_really_stuck, str):
                        raise utils.ValidationError(
                            'Expected dest_if_really_stuck to be a '
                            'string, received %s' %
                            outcome.dest_if_really_stuck)

            if state.interaction.default_outcome is not None:
                if not state.interaction.default_outcome.dest:
                    raise utils.ValidationError(
                        'Every outcome should have a destination.')
                if not isinstance(state.interaction.default_outcome.dest, str):
                    raise utils.ValidationError(
                        'Expected outcome dest to be a string, received %s'
                        % state.interaction.default_outcome.dest)

                interaction_default_outcome = state.interaction.default_outcome
                if interaction_default_outcome.dest_if_really_stuck is not None:
                    if not isinstance(
                        interaction_default_outcome.dest_if_really_stuck, str
                    ):
                        raise utils.ValidationError(
                            'Expected dest_if_really_stuck to be a '
                            'string, received %s'
                            % interaction_default_outcome.dest_if_really_stuck)

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

        if not isinstance(self.edits_allowed, bool):
            raise utils.ValidationError(
                'Expected edits_allowed to be a bool, received '
                '%s' % self.edits_allowed)

        for param_name in self.param_specs:
            if not isinstance(param_name, str):
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

                # Check default if-stuck destinations.
                if (
                    default_outcome.dest_if_really_stuck is not None and
                    default_outcome.dest_if_really_stuck not in all_state_names
                ):
                    raise utils.ValidationError(
                        'The destination for the stuck learner %s '
                        'is not a valid state.'
                        % default_outcome.dest_if_really_stuck)

                if default_outcome.dest_if_really_stuck == state_name:
                    raise utils.ValidationError(
                        'The destination for a stuck learner cannot be the '
                        'same state.')

                # Check that, if the outcome is a non-self-loop, then the
                # refresher_exploration_id is None.
                if (
                    default_outcome.refresher_exploration_id is not None and
                    default_outcome.dest != state_name
                ):
                    raise utils.ValidationError(
                        'The default outcome for state %s has a refresher '
                        'exploration ID, but is not a self-loop.' % state_name)

            for group in interaction.answer_groups:
                # Check group destinations.
                if group.outcome.dest not in all_state_names:
                    raise utils.ValidationError(
                        'The destination %s is not a valid state.'
                        % group.outcome.dest)

                # Check group if-stuck destinations.
                if (
                    group.outcome.dest_if_really_stuck is not None and
                    group.outcome.dest_if_really_stuck not in all_state_names
                ):
                    raise utils.ValidationError(
                        'The destination for the stuck learner %s '
                        'is not a valid state.'
                        % group.outcome.dest_if_really_stuck)

                if (
                    group.outcome.dest_if_really_stuck is not None and
                    group.outcome.dest_if_really_stuck == state_name
                ):
                    raise utils.ValidationError(
                        'The destination for a stuck learner cannot be the '
                        'same state.')

                # Check that, if the outcome is a non-self-loop, then the
                # refresher_exploration_id is None.
                if (
                    group.outcome.refresher_exploration_id is not None and
                    group.outcome.dest != state_name
                ):
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
                        if state.card_is_checkpoint:
                            raise utils.ValidationError(
                                'Expected card_is_checkpoint of terminal state '
                                'to be False but found it to be %s'
                                % state.card_is_checkpoint
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
                            # Ruling out the possibility of None for mypy type
                            # checking, because above we are already validating
                            # if outcome exists then it should have destination.
                            assert dest_state is not None
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
                warnings_list.append(str(e))

            try:
                self._verify_no_dead_ends()
            except utils.ValidationError as e:
                warnings_list.append(str(e))

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
                    if (
                        default_outcome.dest == state_name and
                        default_outcome.labelled_as_correct
                    ):
                        raise utils.ValidationError(
                            'The default outcome for state %s is labelled '
                            'correct but is a self-loop.' % state_name)

                for group in interaction.answer_groups:
                    # Check that, if the outcome is a self-loop, then the
                    # outcome is not labelled as correct.
                    if (
                        group.outcome.dest == state_name and
                        group.outcome.labelled_as_correct
                    ):
                        raise utils.ValidationError(
                            'The outcome for an answer group in state %s is '
                            'labelled correct but is a self-loop.' % state_name)

                    if (
                        group.outcome.labelled_as_correct and
                        group.outcome.dest_if_really_stuck is not None
                    ):
                        raise utils.ValidationError(
                            'The outcome for the state is labelled '
                            'correct but a destination for the stuck learner '
                            'is specified.')

            if len(warnings_list) > 0:
                warning_str = ''
                for ind, warning in enumerate(warnings_list):
                    warning_str += '%s. %s ' % (ind + 1, warning)
                raise utils.ValidationError(
                    'Please fix the following issues before saving this '
                    'exploration: %s' % warning_str)

    def _verify_all_states_reachable(self) -> None:
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
                        if (
                            dest_state is not None and
                            dest_state not in curr_queue and
                            dest_state not in processed_queue
                        ):
                            curr_queue.append(dest_state)

        if len(self.states) != len(processed_queue):
            unseen_states = list(
                set(self.states.keys()) - set(processed_queue))
            raise utils.ValidationError(
                'The following states are not reachable from the initial '
                'state: %s' % ', '.join(unseen_states))

    def _verify_no_dead_ends(self) -> None:
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

    def get_content_html(self, state_name: str, content_id: str) -> str:
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
    def init_state(self) -> state_domain.State:
        """The state which forms the start of this exploration.

        Returns:
            State. The corresponding State domain object.
        """
        return self.states[self.init_state_name]

    @property
    def param_specs_dict(self) -> Dict[str, param_domain.ParamSpecDict]:
        """A dict of param specs, each represented as Python dicts.

        Returns:
            dict. Dict of parameter specs.
        """
        return {ps_name: ps_val.to_dict()
                for (ps_name, ps_val) in self.param_specs.items()}

    @property
    def param_change_dicts(self) -> List[param_domain.ParamChangeDict]:
        """A list of param changes, represented as JSONifiable Python dicts.

        Returns:
            list(dict). List of dicts, each representing a parameter change.
        """
        return [param_change.to_dict() for param_change in self.param_changes]

    @classmethod
    def is_demo_exploration_id(cls, exploration_id: str) -> bool:
        """Whether the given exploration id is a demo exploration.

        Args:
            exploration_id: str. The exploration id.

        Returns:
            bool. Whether the corresponding exploration is a demo exploration.
        """
        return exploration_id in feconf.DEMO_EXPLORATIONS

    @property
    def is_demo(self) -> bool:
        """Whether the exploration is one of the demo explorations.

        Returns:
            bool. True is the current exploration is a demo exploration.
        """
        return self.is_demo_exploration_id(self.id)

    def has_state_name(self, state_name: str) -> bool:
        """Whether the exploration has a state with the given state name.

        Args:
            state_name: str. The name of the state.

        Returns:
            bool. Returns true if the exploration has the given state name.
        """
        state_names = list(self.states.keys())
        return state_name in state_names

    def get_interaction_id_by_state_name(
        self, state_name: str
    ) -> Optional[str]:
        """Returns the interaction id of the state.

        Args:
            state_name: str. The name of the state.

        Returns:
            str|None. The ID of the interaction.
        """
        return self.states[state_name].interaction.id

    def update_title(self, title: str) -> None:
        """Update the exploration title.

        Args:
            title: str. The exploration title to set.
        """
        self.title = title

    def update_category(self, category: str) -> None:
        """Update the exploration category.

        Args:
            category: str. The exploration category to set.
        """
        self.category = category

    def update_objective(self, objective: str) -> None:
        """Update the exploration objective.

        Args:
            objective: str. The exploration objective to set.
        """
        self.objective = objective

    def update_language_code(self, language_code: str) -> None:
        """Update the exploration language code.

        Args:
            language_code: str. The exploration language code to set.
        """
        self.language_code = language_code

    def update_tags(self, tags: List[str]) -> None:
        """Update the tags of the exploration.

        Args:
            tags: list(str). List of tags to set.
        """
        self.tags = tags

    def update_blurb(self, blurb: str) -> None:
        """Update the blurb of the exploration.

        Args:
            blurb: str. The blurb to set.
        """
        self.blurb = blurb

    def update_author_notes(self, author_notes: str) -> None:
        """Update the author notes of the exploration.

        Args:
            author_notes: str. The author notes to set.
        """
        self.author_notes = author_notes

    def update_param_specs(
        self, param_specs_dict: Dict[str, param_domain.ParamSpecDict]
    ) -> None:
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

    def update_param_changes(
        self, param_changes: List[param_domain.ParamChange]
    ) -> None:
        """Update the param change dict.

        Args:
            param_changes: list(ParamChange). List of ParamChange objects.
        """
        self.param_changes = param_changes

    def update_init_state_name(self, init_state_name: str) -> None:
        """Update the name for the initial state of the exploration.

        Args:
            init_state_name: str. The new name of the initial state.

        Raises:
            Exception. Invalid initial state name.
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

    def update_auto_tts_enabled(self, auto_tts_enabled: bool) -> None:
        """Update whether automatic text-to-speech is enabled.

        Args:
            auto_tts_enabled: bool. Whether automatic text-to-speech
                is enabled or not.
        """
        self.auto_tts_enabled = auto_tts_enabled

    def update_correctness_feedback_enabled(
        self, correctness_feedback_enabled: bool
    ) -> None:
        """Update whether correctness feedback is enabled.

        Args:
            correctness_feedback_enabled: bool. Whether correctness feedback
                is enabled or not.
        """
        self.correctness_feedback_enabled = correctness_feedback_enabled

    # Methods relating to states.
    def add_states(self, state_names: List[str]) -> None:
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

    def rename_state(self, old_state_name: str, new_state_name: str) -> None:
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
        for other_state in self.states.values():
            other_outcomes = other_state.interaction.get_all_outcomes()
            for outcome in other_outcomes:
                if outcome.dest == old_state_name:
                    outcome.dest = new_state_name

    def delete_state(self, state_name: str) -> None:
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
        for other_state_name, other_state in self.states.items():
            all_outcomes = other_state.interaction.get_all_outcomes()
            for outcome in all_outcomes:
                if outcome.dest == state_name:
                    outcome.dest = other_state_name

        del self.states[state_name]

    def get_translatable_text(
        self, language_code: str
    ) -> Dict[str, Dict[str, state_domain.TranslatableItem]]:
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

    def get_trainable_states_dict(
        self,
        old_states: Dict[str, state_domain.State],
        exp_versions_diff: ExplorationVersionsDiff
    ) -> Dict[str, List[str]]:
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
        trainable_states_dict: Dict[str, List[str]] = {
            'state_names_with_changed_answer_groups': [],
            'state_names_with_unchanged_answer_groups': []
        }
        new_states = self.states

        for new_state_name, new_state in new_states.items():
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

    def get_languages_with_complete_translation(self) -> List[str]:
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

    def get_translation_counts(self) -> Dict[str, int]:
        """Returns a dict representing the number of translations available in a
        language for which there exists at least one translation in the
        exploration.

        Returns:
            dict(str, int). A dict with language code as a key and number of
            translation available in that language as the value.
        """
        exploration_translation_counts: Dict[
            str, int
        ] = collections.defaultdict(int)
        for state in self.states.values():
            state_translation_counts = state.get_translation_counts()
            for language, count in state_translation_counts.items():
                exploration_translation_counts[language] += count

        return dict(exploration_translation_counts)

    def get_content_count(self) -> int:
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

    def get_metadata(self) -> ExplorationMetadata:
        """Gets the ExplorationMetadata domain object for the exploration."""
        return ExplorationMetadata(
            self.title, self. category, self.objective, self.language_code,
            self.tags, self.blurb, self.author_notes,
            self.states_schema_version, self.init_state_name,
            self.param_specs, self.param_changes, self.auto_tts_enabled,
            self.correctness_feedback_enabled, self.edits_allowed
        )

    @classmethod
    def _convert_states_v41_dict_to_v42_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
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

        # Here we use MyPy ignore because MyPy expects a return value in
        # every condition when we define a return type but here we are
        # returning only in if-else conditions and we are not returning
        # when none of the condition matches which causes MyPy to throw
        # a 'Missing return statement' error. Thus to avoid the error,
        # we used ignore here.
        def migrate_rule_inputs_and_answers(  # type: ignore[return]
            new_type: str,
            value: Union[List[List[str]], List[str], str],
            choices: List[state_domain.SubtitledHtmlDict]
        ) -> Union[List[str], str]:
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

            def extract_content_id_from_choices(html: str) -> str:
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
                # Here 'TranslatableHtmlContentId' can only be of str type, thus
                # to narrow down the type we used assert here.
                assert isinstance(value, str)
                return extract_content_id_from_choices(value)
            elif new_type == 'SetOfTranslatableHtmlContentIds':
                # Here 'migrate_rule_inputs_and_answers' method calls itself
                # recursively and because of this MyPy assumes its type as
                # recursive, like if this method returns List[str] then MyPy
                # assumes its type as List[List[str]]. So, because of this,
                # MyPy throws an error. Thus to avoid the error, we used
                # ignore here.
                return [
                    migrate_rule_inputs_and_answers(  # type: ignore[misc]
                        'TranslatableHtmlContentId', html, choices
                    ) for html in value
                ]
            elif new_type == 'ListOfSetsOfTranslatableHtmlContentIds':
                # Here 'migrate_rule_inputs_and_answers' method calls itself
                # recursively and because of this MyPy assumes its type as
                # recursive, like if this method returns List[str] then MyPy
                # assumes its type as List[List[str]]. So, because of this,
                # MyPy throws an error. Thus to avoid the error, we used
                # ignore here.
                return [
                    migrate_rule_inputs_and_answers(  # type: ignore[misc]
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
                    # Ruling out the possibility of any other type for MyPy type
                    # checking because for interaction 'ItemSelectionInput',
                    # the correct_answer is formatted as List[str] type.
                    assert isinstance(solution['correct_answer'], list)
                    list_of_html_contents = []
                    for html_content in solution['correct_answer']:
                        assert isinstance(html_content, str)
                        list_of_html_contents.append(html_content)
                    solution['correct_answer'] = (
                        migrate_rule_inputs_and_answers(
                            'SetOfTranslatableHtmlContentIds',
                            list_of_html_contents,
                            choices)
                    )
            if interaction_id == 'DragAndDropSortInput':
                # The solution type will be migrated from ListOfSetsOfHtmlString
                # to ListOfSetsOfTranslatableHtmlContentIds.
                if solution is not None:
                    # Ruling out the possibility of any other type for MyPy type
                    # checking because for interaction 'DragAndDropSortInput',
                    # the correct_answer is formatted as List[List[str]] type.
                    assert isinstance(solution['correct_answer'], list)
                    list_of_html_content_list = []
                    for html_content_list in solution['correct_answer']:
                        assert isinstance(html_content_list, list)
                        list_of_html_content_list.append(html_content_list)
                    solution['correct_answer'] = (
                        migrate_rule_inputs_and_answers(
                            'ListOfSetsOfTranslatableHtmlContentIds',
                            list_of_html_content_list,
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
                        # Ruling out the possibility of any other type
                        # for MyPy type checking because for interaction
                        # 'ItemSelectionInput', the rule inputs are formatted
                        # as List[str] type.
                        assert isinstance(rule_inputs['x'], list)
                        list_of_html_contents = []
                        for html_content in rule_inputs['x']:
                            assert isinstance(html_content, str)
                            list_of_html_contents.append(html_content)
                        rule_inputs['x'] = migrate_rule_inputs_and_answers(
                            'SetOfTranslatableHtmlContentIds',
                            list_of_html_contents,
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
                            # Ruling out the possibility of any other type
                            # for MyPy type checking because for interaction
                            # 'DragAndDropSortInput', the rule inputs are
                            # formatted as List[List[str]] type.
                            assert isinstance(rule_inputs['x'], list)
                            list_of_html_content_list = []
                            for html_content_list in rule_inputs['x']:
                                assert isinstance(html_content_list, list)
                                list_of_html_content_list.append(
                                    html_content_list
                                )
                            rule_inputs['x'] = migrate_rule_inputs_and_answers(
                                'ListOfSetsOfTranslatableHtmlContentIds',
                                list_of_html_content_list,
                                choices)
                        elif rule_type == 'HasElementXAtPositionY':
                            # For rule type HasElementXAtPositionY,
                            # the x input will be migrated from
                            # DragAndDropHtmlString to
                            # TranslatableHtmlContentId, and the y input will
                            # remain as DragAndDropPositiveInt.
                            # Ruling out the possibility of any other type
                            # for MyPy type checking because for interaction
                            # 'HasElementXAtPositionY', the rule inputs are
                            # formatted as str type.
                            assert isinstance(rule_inputs['x'], str)
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
                                rule_input_value = rule_inputs[rule_input_name]
                                # Ruling out the possibility of any other type
                                # for MyPy type checking because for interaction
                                # 'HasElementXBeforeElementY', the rule inputs
                                # are formatted as str type.
                                assert isinstance(rule_input_value, str)
                                rule_inputs[rule_input_name] = (
                                    migrate_rule_inputs_and_answers(
                                        'TranslatableHtmlContentId',
                                        rule_input_value,
                                        choices))

        return states_dict

    @classmethod
    def _convert_states_v42_dict_to_v43_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
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
    def _convert_states_v43_dict_to_v44_dict(
        cls,
        states_dict: Dict[str, state_domain.StateDict],
        init_state_name: str
    ) -> Dict[str, state_domain.StateDict]:
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
    def _convert_states_v44_dict_to_v45_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
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
    def _convert_states_v45_dict_to_v46_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 45 to 46. Version 46 ensures that the written
        translations in a state containing unicode content do not contain HTML
        tags and the data_format is unicode.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """

        for state_dict in states_dict.values():
            list_of_subtitled_unicode_content_ids = []
            interaction_customisation_args = state_dict['interaction'][
                'customization_args']
            if interaction_customisation_args:
                customisation_args = (
                    state_domain.InteractionInstance
                    .convert_customization_args_dict_to_customization_args(
                        state_dict['interaction']['id'],
                        state_dict['interaction']['customization_args'],
                        state_schema_version=45))
                for ca_name in customisation_args:
                    list_of_subtitled_unicode_content_ids.extend(
                        state_domain.InteractionCustomizationArg
                        .traverse_by_schema_and_get(
                            customisation_args[ca_name].schema,
                            customisation_args[ca_name].value,
                            [schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE],
                            lambda subtitled_unicode:
                            subtitled_unicode.content_id
                        )
                    )
                translations_mapping = (
                    state_dict['written_translations']['translations_mapping'])
                for content_id in translations_mapping:
                    if content_id in list_of_subtitled_unicode_content_ids:
                        for language_code in translations_mapping[content_id]:
                            written_translation = (
                                translations_mapping[content_id][language_code])
                            written_translation['data_format'] = (
                                schema_utils.SCHEMA_TYPE_UNICODE)
                            # Here, we are narrowing down the type from
                            # Union[List[str], str] to str.
                            assert isinstance(
                                written_translation['translation'],
                                str
                            )
                            written_translation['translation'] = (
                                html_cleaner.strip_html_tags(
                                    written_translation['translation']))
        return states_dict

    @classmethod
    def _convert_states_v46_dict_to_v47_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 46 to 47. Version 52 deprecates
        oppia-noninteractive-svgdiagram tag and converts existing occurences of
        it to oppia-noninteractive-image tag.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """

        for state_dict in states_dict.values():
            interaction_customisation_args = state_dict['interaction'][
                'customization_args']
            if interaction_customisation_args:
                state_domain.State.convert_html_fields_in_state(
                    state_dict,
                    html_validation_service
                    .convert_svg_diagram_tags_to_image_tags, 46)
        return states_dict

    @classmethod
    def _convert_states_v47_dict_to_v48_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 47 to 48. Version 48 fixes encoding issues in
        HTML fields.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """

        for state_dict in states_dict.values():
            interaction_customisation_args = state_dict['interaction'][
                'customization_args']
            if interaction_customisation_args:
                state_domain.State.convert_html_fields_in_state(
                    state_dict,
                    html_validation_service.fix_incorrectly_encoded_chars,
                    state_schema_version=48)
        return states_dict

    @classmethod
    def _convert_states_v48_dict_to_v49_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 48 to 49. Version 49 adds
        requireNonnegativeInput customization arg to NumericInput
        interaction which allows creators to set input should be greater
        than or equal to zero.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """

        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] == 'NumericInput':
                customization_args = state_dict['interaction'][
                    'customization_args']
                customization_args.update({
                    'requireNonnegativeInput': {
                        'value': False
                    }
                })

        return states_dict

    @classmethod
    def _convert_states_v49_dict_to_v50_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 49 to 50. Version 50 removes rules from
        explorations that use one of the following rules:
        [ContainsSomeOf, OmitsSomeOf, MatchesWithGeneralForm]. It also renames
        `customOskLetters` cust arg to `allowedVariables`.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] in MATH_INTERACTION_TYPES:
                filtered_answer_groups = []
                for answer_group_dict in state_dict[
                        'interaction']['answer_groups']:
                    filtered_rule_specs = []
                    for rule_spec_dict in answer_group_dict['rule_specs']:
                        rule_type = rule_spec_dict['rule_type']
                        if rule_type not in MATH_INTERACTION_DEPRECATED_RULES:
                            filtered_rule_specs.append(
                                copy.deepcopy(rule_spec_dict))
                    answer_group_dict['rule_specs'] = filtered_rule_specs
                    if len(filtered_rule_specs) > 0:
                        filtered_answer_groups.append(
                            copy.deepcopy(answer_group_dict))
                state_dict[
                    'interaction']['answer_groups'] = filtered_answer_groups

                # Renaming cust arg.
                if state_dict[
                        'interaction']['id'] in ALGEBRAIC_MATH_INTERACTIONS:
                    customization_args = state_dict[
                        'interaction']['customization_args']
                    customization_args['allowedVariables'] = copy.deepcopy(
                        customization_args['customOskLetters'])
                    del customization_args['customOskLetters']

        return states_dict

    @classmethod
    def _convert_states_v50_dict_to_v51_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 50 to 51. Version 51 adds a new
        dest_if_really_stuck field to Outcome class to redirect learners
        to a state for strengthening concepts when they get really stuck.

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
                answer_group['outcome']['dest_if_really_stuck'] = None

            if state_dict['interaction']['default_outcome'] is not None:
                state_dict['interaction'][
                    'default_outcome']['dest_if_really_stuck'] = None

        return states_dict

    @classmethod
    def _convert_states_v51_dict_to_v52_dict(
        cls, states_dict: Dict[str, state_domain.StateDict]
    ) -> Dict[str, state_domain.StateDict]:
        """Converts from version 51 to 52. Version 52 correctly updates
        the content IDs for translations and for voiceovers. In the 49 to 50
        conversion we removed some interaction rules and thus also some parts of
        the exploration that had its content IDs, but then the content IDs in
        translations and voiceovers were not updated.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            interaction = state_dict['interaction']
            content_id_list = [state_dict['content']['content_id']]

            for answer_group in interaction['answer_groups']:
                content_id_list.append(
                    answer_group['outcome']['feedback']['content_id']
                )

                for rule_spec in answer_group['rule_specs']:
                    for param_name, value in rule_spec['inputs'].items():
                        interaction_id = interaction['id']
                        # Ruling out the possibility of None for mypy type
                        # checking.
                        assert interaction_id is not None
                        param_type = (
                            interaction_registry.Registry.get_interaction_by_id( # type: ignore[no-untyped-call]
                                interaction_id
                            ).get_rule_param_type(
                                rule_spec['rule_type'], param_name
                            )
                        )

                        if issubclass(
                            param_type, objects.BaseTranslatableObject
                        ):
                            # We can assume that the value will be a dict,
                            # as the param_type is BaseTranslatableObject.
                            assert isinstance(value, dict)
                            content_id = value['contentId']
                            # We can assume the contentId will be str,
                            # as the param_type is BaseTranslatableObject.
                            assert isinstance(content_id, str)
                            content_id_list.append(content_id)

            default_outcome = interaction['default_outcome']
            if default_outcome:
                content_id_list.append(
                    default_outcome['feedback']['content_id'])

            for hint in interaction['hints']:
                content_id_list.append(hint['hint_content']['content_id'])

            interaction_solution = interaction['solution']
            if interaction_solution:
                content_id_list.append(
                    interaction_solution['explanation']['content_id'])

            if interaction['id'] is not None:
                customisation_args = (
                    state_domain.InteractionInstance
                    .convert_customization_args_dict_to_customization_args(
                        interaction['id'],
                        interaction['customization_args'],
                        state_schema_version=51
                    )
                )
                for ca_name in customisation_args:
                    content_id_list.extend(
                        customisation_args[ca_name].get_content_ids()
                    )

            translations_mapping = (
                state_dict['written_translations']['translations_mapping'])
            new_translations_mapping = {}
            for content_id, translation_item in translations_mapping.items():
                if content_id in content_id_list:
                    new_translations_mapping[content_id] = translation_item
            state_dict['written_translations']['translations_mapping'] = (
                new_translations_mapping)

            voiceovers_mapping = (
                state_dict['recorded_voiceovers']['voiceovers_mapping'])
            new_voiceovers_mapping = {}
            for content_id, voiceover_item in voiceovers_mapping.items():
                if content_id in content_id_list:
                    new_voiceovers_mapping[content_id] = voiceover_item
            state_dict['recorded_voiceovers']['voiceovers_mapping'] = (
                new_voiceovers_mapping)

        return states_dict

    @classmethod
    def update_states_from_model(
        cls,
        versioned_exploration_states: VersionedExplorationStatesDict,
        current_states_schema_version: int,
        init_state_name: str
    ) -> None:
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
    CURRENT_EXP_SCHEMA_VERSION = 57
    EARLIEST_SUPPORTED_EXP_SCHEMA_VERSION = 46

    @classmethod
    def _convert_v46_dict_to_v47_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
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
    def _convert_v47_dict_to_v48_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
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
    def _convert_v48_dict_to_v49_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
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
    def _convert_v49_dict_to_v50_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
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
    def _convert_v50_dict_to_v51_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v50 exploration dict into a v51 exploration dict.
        Version 51 ensures that unicode written_translations are stripped of
        HTML tags and have data_format field set to unicode.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v50.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v51.
        """

        exploration_dict['schema_version'] = 51

        exploration_dict['states'] = cls._convert_states_v45_dict_to_v46_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 46

        return exploration_dict

    @classmethod
    def _convert_v51_dict_to_v52_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v51 exploration dict into a v52 exploration dict.
        Version 52 deprecates oppia-noninteractive-svgdiagram tag and converts
        existing occurences of it to oppia-noninteractive-image tag.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v51.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v52.
        """

        exploration_dict['schema_version'] = 52

        exploration_dict['states'] = cls._convert_states_v46_dict_to_v47_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 47

        return exploration_dict

    @classmethod
    def _convert_v52_dict_to_v53_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v52 exploration dict into a v53 exploration dict.
        Version 53 fixes encoding issues in HTML fields.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v51.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v52.
        """

        exploration_dict['schema_version'] = 53

        exploration_dict['states'] = cls._convert_states_v47_dict_to_v48_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 48

        return exploration_dict

    @classmethod
    def _convert_v53_dict_to_v54_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v53 exploration dict into a v54 exploration dict.
        Adds a new customization arg to NumericInput interaction
        which allows creators to set input greator than or equal to zero.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v53.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v54.
        """
        exploration_dict['schema_version'] = 54

        exploration_dict['states'] = cls._convert_states_v48_dict_to_v49_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 49

        return exploration_dict

    @classmethod
    def _convert_v54_dict_to_v55_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v54 exploration dict into a v55 exploration dict.
        Removes rules from explorations that use one of the following rules:
        [ContainsSomeOf, OmitsSomeOf, MatchesWithGeneralForm]. It also renames
        `customOskLetters` cust arg to `allowedVariables`.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v54.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v55.
        """
        exploration_dict['schema_version'] = 55

        exploration_dict['states'] = cls._convert_states_v49_dict_to_v50_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 50

        return exploration_dict

    @classmethod
    def _convert_v55_dict_to_v56_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v55 exploration dict into a v56 exploration dict.
        Version 56 adds a new dest_if_really_stuck field to the Outcome class
        to redirect the learners to a state for strengthening concepts when
        they get really stuck.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v55.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v56.
        """
        exploration_dict['schema_version'] = 56

        exploration_dict['states'] = cls._convert_states_v50_dict_to_v51_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 51

        return exploration_dict

    @classmethod
    def _convert_v56_dict_to_v57_dict(
        cls, exploration_dict: VersionedExplorationDict
    ) -> VersionedExplorationDict:
        """Converts a v56 exploration dict into a v57 exploration dict.
        Version 57 correctly updates the content IDs for translations and
        for voiceovers.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v56.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v57.
        """
        exploration_dict['schema_version'] = 57

        exploration_dict['states'] = cls._convert_states_v51_dict_to_v52_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 52

        return exploration_dict

    @classmethod
    def _migrate_to_latest_yaml_version(
        cls, yaml_content: str
    ) -> VersionedExplorationDict:
        """Return the YAML content of the exploration in the latest schema
        format.

        Args:
            yaml_content: str. The YAML representation of the exploration.

        Returns:
            exploration_dict. The dict 'exploration_dict' is the representation
            of the Exploration.

        Raises:
            InvalidInputException. The 'yaml_content' or the schema version
                is not specified.
            Exception. The exploration schema version is not valid.
        """
        # Here, cast is used to narrow down the return type of dict_from_yaml()
        # from Dict[str, Any] to VersionedExplorationDict.
        try:
            exploration_dict = cast(
                VersionedExplorationDict,
                utils.dict_from_yaml(yaml_content)
            )
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

        if exploration_schema_version == 50:
            exploration_dict = cls._convert_v50_dict_to_v51_dict(
                exploration_dict)
            exploration_schema_version = 51

        if exploration_schema_version == 51:
            exploration_dict = cls._convert_v51_dict_to_v52_dict(
                exploration_dict)
            exploration_schema_version = 52

        if exploration_schema_version == 52:
            exploration_dict = cls._convert_v52_dict_to_v53_dict(
                exploration_dict)
            exploration_schema_version = 53

        if exploration_schema_version == 53:
            exploration_dict = cls._convert_v53_dict_to_v54_dict(
                exploration_dict)
            exploration_schema_version = 54

        if exploration_schema_version == 54:
            exploration_dict = cls._convert_v54_dict_to_v55_dict(
                exploration_dict)
            exploration_schema_version = 55

        if exploration_schema_version == 55:
            exploration_dict = cls._convert_v55_dict_to_v56_dict(
                exploration_dict)
            exploration_schema_version = 56

        if exploration_schema_version == 56:
            exploration_dict = cls._convert_v56_dict_to_v57_dict(
                exploration_dict)
            exploration_schema_version = 57

        return exploration_dict

    @classmethod
    def from_yaml(cls, exploration_id: str, yaml_content: str) -> Exploration:
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

    def to_yaml(self) -> str:
        """Convert the exploration domain object into YAML string.

        Returns:
            str. The YAML representation of this exploration.
        """
        exp_dict = self.to_dict()
        # The dictionary returned by `to_dict()` method is ExplorationDict
        # and ExplorationDict does not contain `schema_version` key, but here
        # we are defining a `schema_version` key which causes MyPy to throw
        # error TypedDict has no key 'schema_version'. Thus to silent the error,
        # we used ignore here.
        exp_dict['schema_version'] = self.CURRENT_EXP_SCHEMA_VERSION  # type: ignore[misc]

        # The ID is the only property which should not be stored within the
        # YAML representation.
        # MyPy doesn't allow key deletion from TypedDict, thus we add an ignore.
        del exp_dict['id']  # type: ignore[misc]

        return utils.yaml_from_dict(exp_dict)

    def to_dict(self) -> ExplorationDict:
        """Returns a copy of the exploration as a dictionary. It includes all
        necessary information to represent the exploration.

        Returns:
            dict. A dict mapping all fields of Exploration instance.
        """
        exploration_dict: ExplorationDict = ({
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
            'edits_allowed': self.edits_allowed,
            'states': {state_name: state.to_dict()
                       for (state_name, state) in self.states.items()}
        })
        exploration_dict_deepcopy = copy.deepcopy(exploration_dict)
        return exploration_dict_deepcopy

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded str encoding all of the information composing
            the object.
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
        # The dictionary returned by `to_dict()` method is ExplorationDict
        # and ExplorationDict does not contain `version`, `created_on` and
        # `last_updated` keys, but here we are defining those keys which
        # causes MyPy to throw error TypedDict has no `version` key. Thus
        # to silent the error, we used ignore here.
        exploration_dict['version'] = self.version  # type: ignore[misc]

        if self.created_on:
            exploration_dict['created_on'] = (  # type: ignore[misc]
                utils.convert_naive_datetime_to_string(self.created_on))

        if self.last_updated:
            exploration_dict['last_updated'] = (  # type: ignore[misc]
                utils.convert_naive_datetime_to_string(self.last_updated))

        return json.dumps(exploration_dict)

    @classmethod
    def deserialize(cls, json_string: str) -> Exploration:
        """Returns an Exploration domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a Exploration.
                Only call on strings that were created using serialize().

        Returns:
            Exploration. The corresponding Exploration domain object.
        """
        exploration_dict = json.loads(json_string)
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

    def to_player_dict(self) -> ExplorationPlayerDict:
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
                - correctness_feedback_enabled: bool. Whether to show
                    correctness feedback.
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

    def get_all_html_content_strings(self) -> List[str]:
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


class ExplorationSummaryMetadataDict(TypedDict):
    """Dictionary representing the meta data for exploration summary."""

    id: str
    title: str
    objective: str


class ExplorationSummary:
    """Domain object for an Oppia exploration summary."""

    def __init__(
        self,
        exploration_id: str,
        title: str,
        category: str,
        objective: str,
        language_code: str,
        tags: List[str],
        ratings: Dict[str, int],
        scaled_average_rating: float,
        status: str,
        community_owned: bool,
        owner_ids: List[str],
        editor_ids: List[str],
        voice_artist_ids: List[str],
        viewer_ids: List[str],
        contributor_ids: List[str],
        contributors_summary: Dict[str, int],
        version: int,
        exploration_model_created_on: datetime.datetime,
        exploration_model_last_updated: datetime.datetime,
        first_published_msec: Optional[float],
        deleted: bool = False
    ) -> None:
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
            first_published_msec: float|None. Time in milliseconds since the
                Epoch, when the exploration was first published, or None if
                Exploration is not published yet.
            deleted: bool. Whether the exploration is marked as deleted.
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
        self.deleted = deleted

    def validate(self) -> None:
        """Validates various properties of the ExplorationSummary.

        Raises:
            ValidationError. One or more attributes of the ExplorationSummary
                are invalid.
        """
        if not isinstance(self.title, str):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the exploration title', allow_empty=True)

        if not isinstance(self.category, str):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the exploration category', allow_empty=True)

        if not isinstance(self.objective, str):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, str):
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
            if not isinstance(tag, str):
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

        if not isinstance(self.scaled_average_rating, (float, int)):
            raise utils.ValidationError(
                'Expected scaled_average_rating to be float, received %s' % (
                    self.scaled_average_rating))

        if not isinstance(self.status, str):
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
            if not isinstance(owner_id, str):
                raise utils.ValidationError(
                    'Expected each id in owner_ids to '
                    'be string, received %s' % owner_id)

        if not isinstance(self.editor_ids, list):
            raise utils.ValidationError(
                'Expected editor_ids to be list, received %s' % self.editor_ids)
        for editor_id in self.editor_ids:
            if not isinstance(editor_id, str):
                raise utils.ValidationError(
                    'Expected each id in editor_ids to '
                    'be string, received %s' % editor_id)

        if not isinstance(self.voice_artist_ids, list):
            raise utils.ValidationError(
                'Expected voice_artist_ids to be list, received %s' % (
                    self.voice_artist_ids))
        for voice_artist_id in self.voice_artist_ids:
            if not isinstance(voice_artist_id, str):
                raise utils.ValidationError(
                    'Expected each id in voice_artist_ids to '
                    'be string, received %s' % voice_artist_id)

        if not isinstance(self.viewer_ids, list):
            raise utils.ValidationError(
                'Expected viewer_ids to be list, received %s' % self.viewer_ids)
        for viewer_id in self.viewer_ids:
            if not isinstance(viewer_id, str):
                raise utils.ValidationError(
                    'Expected each id in viewer_ids to '
                    'be string, received %s' % viewer_id)

        all_user_ids_with_rights = (
            self.owner_ids + self.editor_ids + self.voice_artist_ids +
            self.viewer_ids)
        if len(all_user_ids_with_rights) != len(set(all_user_ids_with_rights)):
            raise utils.ValidationError(
                'Users should not be assigned to multiple roles at once, '
                'received users: %s' % ', '.join(all_user_ids_with_rights))

        if not isinstance(self.contributor_ids, list):
            raise utils.ValidationError(
                'Expected contributor_ids to be list, received %s' % (
                    self.contributor_ids))
        for contributor_id in self.contributor_ids:
            if not isinstance(contributor_id, str):
                raise utils.ValidationError(
                    'Expected each id in contributor_ids to '
                    'be string, received %s' % contributor_id)

        if not isinstance(self.contributors_summary, dict):
            raise utils.ValidationError(
                'Expected contributors_summary to be dict, received %s' % (
                    self.contributors_summary))

    def to_metadata_dict(self) -> ExplorationSummaryMetadataDict:
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

    def is_private(self) -> bool:
        """Checks whether the exploration is private.

        Returns:
            bool. Whether the exploration is private.
        """
        return bool(self.status == constants.ACTIVITY_STATUS_PRIVATE)

    def is_solely_owned_by_user(self, user_id: str) -> bool:
        """Checks whether the exploration is solely owned by the user.

        Args:
            user_id: str. The id of the user.

        Returns:
            bool. Whether the exploration is solely owned by the user.
        """
        return user_id in self.owner_ids and len(self.owner_ids) == 1

    def does_user_have_any_role(self, user_id: str) -> bool:
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

    def add_contribution_by_user(self, contributor_id: str) -> None:
        """Add a new contributor to the contributors summary.

        Args:
            contributor_id: str. ID of the contributor to be added.
        """
        # We don't want to record the contributions of system users.
        if contributor_id not in constants.SYSTEM_USER_IDS:
            self.contributors_summary[contributor_id] = (
                self.contributors_summary.get(contributor_id, 0) + 1)

        self.contributor_ids = list(self.contributors_summary.keys())


class ExplorationChangeMergeVerifier:
    """Class to check for mergeability.

    Attributes:
        added_state_names: list(str). Names of the states added to the
            exploration from prev_exp_version to current_exp_version. It
            stores the latest name of the added state.
        deleted_state_names: list(str). Names of the states deleted from
            the exploration from prev_exp_version to current_exp_version.
            It stores the initial name of the deleted state from
            pre_exp_version.
        new_to_old_state_names: dict. Dictionary mapping state names of
            current_exp_version to the state names of prev_exp_version.
            It doesn't include the name changes of added/deleted states.
        changed_properties: dict. List of all the properties changed
            according to the state and property name.
        changed_translations: dict. List of all the translations changed
            according to the state and content_id name.
    """

    # PROPERTIES_CONFLICTING_INTERACTION_ID_CHANGE: List of the properties
    # in which if there are any changes then interaction id
    # changes can not be merged. This list can be changed when any
    # new property is added or deleted which affects or is affected
    # by interaction id and whose changes directly conflicts with
    # interaction id changes.
    PROPERTIES_CONFLICTING_INTERACTION_ID_CHANGES: List[str] = [
        STATE_PROPERTY_INTERACTION_CUST_ARGS,
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS
    ]

    # PROPERTIES_CONFLICTING_CUST_ARGS_CHANGES: List of the properties
    # in which if there are any changes then customization args
    # changes can not be merged. This list can be changed when any
    # new property is added or deleted which affects or is affected
    # by customization args and whose changes directly conflicts with
    # cust args changes.
    PROPERTIES_CONFLICTING_CUST_ARGS_CHANGES: List[str] = [
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_RECORDED_VOICEOVERS,
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS
    ]

    # PROPERTIES_CONFLICTING_ANSWER_GROUPS_CHANGES: List of the properties
    # in which if there are any changes then answer groups
    # changes can not be merged. This list can be changed when any
    # new property is added or deleted which affects or is affected
    # by answer groups and whose changes directly conflicts with
    # answer groups changes.
    PROPERTIES_CONFLICTING_ANSWER_GROUPS_CHANGES: List[str] = [
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_RECORDED_VOICEOVERS,
        STATE_PROPERTY_INTERACTION_CUST_ARGS
    ]

    # PROPERTIES_CONFLICTING_SOLUTION_CHANGES: List of the properties
    # in which if there are any changes then solution
    # changes can not be merged. This list can be changed when any
    # new property is added or deleted which affects or is affected
    # by solution and whose changes directly conflicts with
    # solution changes.
    PROPERTIES_CONFLICTING_SOLUTION_CHANGES: List[str] = [
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
        STATE_PROPERTY_RECORDED_VOICEOVERS,
        STATE_PROPERTY_INTERACTION_CUST_ARGS
    ]

    # PROPERTIES_CONFLICTING_VOICEOVERS_CHANGES: List of the properties
    # in which if there are any changes then voiceovers
    # changes can not be merged. This list can be changed when any
    # new property is added or deleted which affects or is affected
    # by voiceovers and whose changes directly conflicts with
    # voiceovers changes.
    PROPERTIES_CONFLICTING_VOICEOVERS_CHANGES: List[str] = [
        STATE_PROPERTY_CONTENT,
        STATE_PROPERTY_INTERACTION_SOLUTION,
        STATE_PROPERTY_INTERACTION_HINTS,
        STATE_PROPERTY_WRITTEN_TRANSLATIONS,
        STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
        STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
        STATE_PROPERTY_INTERACTION_CUST_ARGS
    ]

    # NON_CONFLICTING_PROPERTIES: List of the properties
    # in which if there are any changes then they are always mergeable.
    NON_CONFLICTING_PROPERTIES: List[str] = [
        STATE_PROPERTY_UNCLASSIFIED_ANSWERS,
        STATE_PROPERTY_NEXT_CONTENT_ID_INDEX,
        STATE_PROPERTY_LINKED_SKILL_ID,
        STATE_PROPERTY_CARD_IS_CHECKPOINT
    ]

    def __init__(self, composite_change_list: List[ExplorationChange]) -> None:

        self.added_state_names: List[str] = []
        self.deleted_state_names: List[str] = []
        self.new_to_old_state_names: Dict[str, str] = (
            collections.defaultdict(str)
        )
        self.changed_properties: Dict[str, Set[str]] = (
            collections.defaultdict(set)
        )
        self.changed_translations: Dict[str, Set[str]] = (
            collections.defaultdict(set)
        )

        for change in composite_change_list:
            self._parse_exp_change(change)

    def _get_property_name_from_content_id(self, content_id: str) -> str:
        """Returns property name from content id.

        Args:
            content_id: string. Id of the content.

        Returns:
            string. Name of the property of which the
            content is part of.
        """
        property_name_to_content_id_identifier: Dict[
            str, Callable[[str], bool]
        ] = {
            STATE_PROPERTY_CONTENT: (
                lambda content_id: content_id == 'content'),
            STATE_PROPERTY_INTERACTION_CUST_ARGS: (
                lambda content_id: content_id[:3] == 'ca_'),
            STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME: (
                lambda content_id: content_id == 'default_outcome'),
            STATE_PROPERTY_INTERACTION_SOLUTION: (
                lambda content_id: content_id == 'solution'),
            STATE_PROPERTY_INTERACTION_HINTS: (
                lambda content_id: content_id[:4] == 'hint'),
            STATE_PROPERTY_INTERACTION_ANSWER_GROUPS: (
                lambda content_id: (
                    content_id[:8] == 'feedback' or
                    content_id[:10] == 'rule_input')),
        }

        for prop_name, identifier_function in (
                property_name_to_content_id_identifier.items()):
            if identifier_function(content_id):
                property_name = prop_name
                break
        return property_name

    def _parse_exp_change(self, change: ExplorationChange) -> None:
        """This function take the change and according to the cmd
        add the property name in the lists defined above.

        Args:
            change: ExplorationChange. A change from the
                composite_change_list.
        """
        if change.cmd == CMD_ADD_STATE:
            self.added_state_names.append(change.state_name)
        elif change.cmd == CMD_DELETE_STATE:
            state_name = change.state_name
            if state_name in self.added_state_names:
                self.added_state_names.remove(state_name)
            else:
                original_state_name = state_name
                if original_state_name in self.new_to_old_state_names:
                    original_state_name = self.new_to_old_state_names.pop(
                        original_state_name)
                self.deleted_state_names.append(original_state_name)
        elif change.cmd == CMD_RENAME_STATE:
            old_state_name = change.old_state_name
            new_state_name = change.new_state_name
            if old_state_name in self.added_state_names:
                self.added_state_names.remove(old_state_name)
                self.added_state_names.append(new_state_name)
            elif old_state_name in self.new_to_old_state_names:
                self.new_to_old_state_names[new_state_name] = (
                    self.new_to_old_state_names.pop(old_state_name))
            else:
                self.new_to_old_state_names[new_state_name] = old_state_name

        elif change.cmd == CMD_EDIT_STATE_PROPERTY:
            # A condition to store the name of the properties changed
            # in changed_properties dict.
            state_name = change.state_name
            if state_name in self.new_to_old_state_names:
                state_name = self.new_to_old_state_names[change.state_name]
            self.changed_properties[state_name].add(
                change.property_name)
        elif change.cmd == CMD_ADD_WRITTEN_TRANSLATION:
            changed_property = self._get_property_name_from_content_id(
                change.content_id)
            # A condition to store the name of the properties changed
            # in changed_properties dict.
            state_name = change.state_name
            if state_name in self.new_to_old_state_names:
                state_name = self.new_to_old_state_names[change.state_name]
            self.changed_translations[state_name].add(
                changed_property)
            self.changed_properties[state_name].add(
                STATE_PROPERTY_WRITTEN_TRANSLATIONS)

    def is_change_list_mergeable(
        self,
        change_list: List[ExplorationChange],
        exp_at_change_list_version: Exploration,
        current_exploration: Exploration
    ) -> Tuple[bool, bool]:
        """Checks whether the change list from the old version of an
        exploration can be merged on the latest version of an exploration.

        Args:
            change_list: list(ExplorationChange). List of the changes made
                by the user on the frontend, which needs to be checked
                for mergeability.
            exp_at_change_list_version: obj. Old version of an exploration.
            current_exploration: obj. Exploration on which the change list
                is to be applied.

        Returns:
            tuple(boolean, boolean). A tuple consisting of two fields.
            1. boolean. Whether the given change list is mergeable on
            the current_exploration or not.
            2. boolean. Whether we need to send the change list to the
            admin to review for the future improvement of the cases
            to merge the change list.
        """
        old_to_new_state_names = {
            value: key for key, value in self.new_to_old_state_names.items()
        }

        if self.added_state_names or self.deleted_state_names:
            # In case of the addition and the deletion of the state,
            # we are rejecting the mergebility because these cases
            # change the flow of the exploration and are quite complex
            # for now to handle. So in such cases, we are sending the
            # changelist, frontend_version, backend_version and
            # exploration id to the admin, so that we can look into the
            # situations and can figure out the way if it’s possible to
            # handle these cases.

            return False, True

        changes_are_mergeable = False

        # state_names_of_renamed_states: dict. Stores the changes in
        # states names in change_list where the key is the state name in
        # frontend version and the value is the renamed name from the
        # change list if there is any rename state change.
        state_names_of_renamed_states: Dict[str, str] = {}
        for change in change_list:
            change_is_mergeable = False
            if change.cmd == CMD_RENAME_STATE:
                old_state_name = change.old_state_name
                new_state_name = change.new_state_name
                if old_state_name in state_names_of_renamed_states:
                    state_names_of_renamed_states[new_state_name] = (
                        state_names_of_renamed_states.pop(old_state_name))
                else:
                    state_names_of_renamed_states[new_state_name] = (
                        old_state_name)
                if (state_names_of_renamed_states[new_state_name] not in
                        old_to_new_state_names):
                    change_is_mergeable = True
            elif change.cmd == CMD_EDIT_STATE_PROPERTY:
                state_name = state_names_of_renamed_states.get(
                    change.state_name) or change.state_name
                if state_name in old_to_new_state_names:
                    # Here we will send the changelist, frontend_version,
                    # backend_version and exploration to the admin, so
                    # that the changes related to state renames can be
                    # reviewed and the proper conditions can be written
                    # to handle those cases.
                    return False, True
                old_exp_states = (
                    exp_at_change_list_version.states[state_name])
                current_exp_states = (
                    current_exploration.states[state_name])
                if (change.property_name ==
                        STATE_PROPERTY_CONTENT):
                    if (old_exp_states.content.html ==
                            current_exp_states.content.html):
                        if (STATE_PROPERTY_CONTENT not in
                                self.changed_translations[state_name] and
                                STATE_PROPERTY_RECORDED_VOICEOVERS not in
                                self.changed_properties[state_name]):
                            change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif (change.property_name ==
                      STATE_PROPERTY_INTERACTION_ID):
                    if (old_exp_states.interaction.id ==
                            current_exp_states.interaction.id):
                        if not self.changed_properties[state_name].intersection(
                                (self
                                 .PROPERTIES_CONFLICTING_INTERACTION_ID_CHANGES
                                )):
                            change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                # Customization args differ for every interaction, so in
                # case of different interactions merging is simply not
                # possible, but in case of same interaction, the values in
                # the customization_args are often lists so if someone
                # changes even one item of that list then determining which
                # item is changed is not feasible, so suppose there is long
                # list of values in item selection interaction and one user
                # deletes one value and another one edits another value,
                # so after deletion the indices of all the values will be
                # changed and it will not be possible to compare and know
                # that which value is changed by second user.
                # So we will not be handling the merge on the basis of
                # individual fields.
                elif (change.property_name ==
                      STATE_PROPERTY_INTERACTION_CUST_ARGS):
                    if (old_exp_states.interaction.id ==
                            current_exp_states.interaction.id):
                        if not self.changed_properties[state_name].intersection(
                                self.PROPERTIES_CONFLICTING_CUST_ARGS_CHANGES +
                                [STATE_PROPERTY_INTERACTION_CUST_ARGS]):
                            if (change.property_name not in
                                    self.changed_translations[state_name]):
                                change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif (change.property_name ==
                      STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                    if (old_exp_states.interaction.id ==
                            current_exp_states.interaction.id):
                        if not self.changed_properties[state_name].intersection(
                                self.PROPERTIES_CONFLICTING_CUST_ARGS_CHANGES +
                                [STATE_PROPERTY_INTERACTION_ANSWER_GROUPS]):
                            if (change.property_name not in
                                    self.changed_translations[state_name]):
                                change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif (change.property_name ==
                      STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME
                     ):
                    if (change.property_name not in
                            self.changed_properties[state_name] and
                            change.property_name not in
                            self.changed_translations[state_name]):
                        change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif change.property_name in self.NON_CONFLICTING_PROPERTIES:
                    change_is_mergeable = True
                # We’ll not be able to handle the merge if changelists
                # affect the different indices of the hint in the same
                # state because whenever there is even a small change
                # in one field of any hint, they treat the whole hints
                # list as a new value.
                # So it will not be possible to find out the exact change.
                elif (change.property_name ==
                      STATE_PROPERTY_INTERACTION_HINTS):
                    if (change.property_name not in
                            self.changed_properties[state_name] and
                            change.property_name not in
                            self.changed_translations[state_name]):
                        change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif (change.property_name ==
                      STATE_PROPERTY_INTERACTION_SOLUTION):
                    if (old_exp_states.interaction.id ==
                            current_exp_states.interaction.id):
                        if not self.changed_properties[state_name].intersection(
                                self.PROPERTIES_CONFLICTING_CUST_ARGS_CHANGES +
                                [STATE_PROPERTY_INTERACTION_SOLUTION]):
                            if (change.property_name not in
                                    self.changed_translations[state_name]):
                                change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif (change.property_name ==
                      STATE_PROPERTY_SOLICIT_ANSWER_DETAILS):
                    if (old_exp_states.interaction.id ==
                            current_exp_states.interaction.id and
                            old_exp_states.solicit_answer_details ==
                            current_exp_states.solicit_answer_details):
                        change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
                elif (change.property_name ==
                      STATE_PROPERTY_RECORDED_VOICEOVERS):
                    if not self.changed_properties[state_name].intersection(
                            self.PROPERTIES_CONFLICTING_VOICEOVERS_CHANGES +
                            [STATE_PROPERTY_RECORDED_VOICEOVERS]):
                        change_is_mergeable = True
                    if not self.changed_properties[state_name]:
                        change_is_mergeable = True
            elif change.cmd == CMD_ADD_WRITTEN_TRANSLATION:
                state_name = state_names_of_renamed_states.get(
                    change.state_name) or change.state_name
                if state_name in old_to_new_state_names:
                    # Here we will send the changelist, frontend_version,
                    # backend_version and exploration to the admin, so
                    # that the changes related to state renames can be
                    # reviewed and the proper conditions can be written
                    # to handle those cases.
                    return False, True
                changed_property = self._get_property_name_from_content_id(
                    change.content_id)
                if (changed_property not in
                        (self.changed_properties[state_name] |
                         self.changed_translations[state_name])):
                    change_is_mergeable = True
                if not self.changed_properties[state_name]:
                    change_is_mergeable = True
            elif change.cmd == CMD_MARK_WRITTEN_TRANSLATION_AS_NEEDING_UPDATE:
                change_is_mergeable = True
            elif change.cmd == CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE:
                change_is_mergeable = True
            elif change.cmd == CMD_EDIT_EXPLORATION_PROPERTY:
                change_is_mergeable = (
                    exp_at_change_list_version.__getattribute__(
                        change.property_name) ==
                    current_exploration.__getattribute__(
                        change.property_name))

            if change_is_mergeable:
                changes_are_mergeable = True
                continue
            changes_are_mergeable = False
            break

        return changes_are_mergeable, False


class ExplorationMetadataDict(TypedDict):
    """Dictionary representing the ExplorationMetadata object."""

    title: str
    category: str
    objective: str
    language_code: str
    tags: List[str]
    blurb: str
    author_notes: str
    states_schema_version: int
    init_state_name: str
    param_specs: Dict[str, param_domain.ParamSpecDict]
    param_changes: List[param_domain.ParamChangeDict]
    auto_tts_enabled: bool
    correctness_feedback_enabled: bool
    edits_allowed: bool


class ExplorationMetadata:
    """Class to represent the exploration metadata properties."""

    def __init__(
        self,
        title: str,
        category: str,
        objective: str,
        language_code: str,
        tags: List[str],
        blurb: str,
        author_notes: str,
        states_schema_version: int,
        init_state_name: str,
        param_specs: Dict[str, param_domain.ParamSpec],
        param_changes: List[param_domain.ParamChange],
        auto_tts_enabled: bool,
        correctness_feedback_enabled: bool,
        edits_allowed: bool
    ) -> None:
        """Initializes an ExplorationMetadata domain object.

        Args:
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
            param_specs: dict(str, ParamSpec). A dict where each key-value pair
                represents respectively, a param spec name and a ParamSpec
                domain object.
            param_changes: list(ParamChange). List of ParamChange domain
                objects.
            auto_tts_enabled: bool. True if automatic text-to-speech is
                enabled.
            correctness_feedback_enabled: bool. True if correctness feedback is
                enabled.
            edits_allowed: bool. True when edits to the exploration is allowed.
        """
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.tags = tags
        self.blurb = blurb
        self.author_notes = author_notes
        self.states_schema_version = states_schema_version
        self.init_state_name = init_state_name
        self.param_specs = param_specs
        self.param_changes = param_changes
        self.auto_tts_enabled = auto_tts_enabled
        self.correctness_feedback_enabled = correctness_feedback_enabled
        self.edits_allowed = edits_allowed

    def to_dict(self) -> ExplorationMetadataDict:
        """Gets the dict representation of ExplorationMetadata domain object.

        Returns:
            dict. The dict representation of the ExplorationMetadata
            domain object.
        """
        return {
            'title': self.title,
            'category': self.category,
            'objective': self.objective,
            'language_code': self.language_code,
            'tags': self.tags,
            'blurb': self.blurb,
            'author_notes': self.author_notes,
            'states_schema_version': self.states_schema_version,
            'init_state_name': self.init_state_name,
            'param_specs': {
                ps_name: ps_value.to_dict()
                for (ps_name, ps_value) in self.param_specs.items()
            },
            'param_changes': [
                p_change.to_dict() for p_change in self.param_changes
            ],
            'auto_tts_enabled': self.auto_tts_enabled,
            'correctness_feedback_enabled': self.correctness_feedback_enabled,
            'edits_allowed': self.edits_allowed
        }


class MetadataVersionHistory:
    """Class to represent an element of the version history list of the
    exploration metadata.

    Attributes:
        last_edited_version_number: int. The version number of the
            exploration in which the metadata was last edited.
        last_edited_committer_id: str. The user id of the user who committed
            the latest changes to the exploration metadata.
    """

    def __init__(
        self,
        last_edited_version_number: Optional[int],
        last_edited_committer_id: str
    ):
        """Initializes the MetadataVersionHistory domain object.

        Args:
            last_edited_version_number: int. The version number of the
                exploration in which the metadata was last edited.
            last_edited_committer_id: str. The user id of the user who
                committed the latest changes to the exploration metadata.
        """
        self.last_edited_version_number = last_edited_version_number
        self.last_edited_committer_id = last_edited_committer_id

    def to_dict(self) -> MetadataVersionHistoryDict:
        """Returns a dict representation of the MetadataVersionHistory domain
        object.

        Returns:
            dict. The dict representation of the MetadataVersionHistory domain
            object.
        """
        return {
            'last_edited_version_number': self.last_edited_version_number,
            'last_edited_committer_id': self.last_edited_committer_id
        }

    @classmethod
    def from_dict(
        cls, metadata_version_history_dict: MetadataVersionHistoryDict
    ) -> MetadataVersionHistory:
        """Returns an MetadataVersionHistory domain object from a dict.

        Args:
            metadata_version_history_dict: dict. The dict representation of
                MetadataVersionHistory object.

        Returns:
            MetadataVersionHistory. The corresponding MetadataVersionHistory
            domain object.
        """
        return cls(
            metadata_version_history_dict['last_edited_version_number'],
            metadata_version_history_dict['last_edited_committer_id']
        )


class ExplorationVersionHistory:
    """Class to represent the version history of an exploration at a
    particular version.

    Attributes:
        exploration_id: str. The id of the exploration.
        exploration_version: int. The version number of the exploration.
        state_version_history: Dict[str, StateVersionHistory].
            The mapping of state names and StateVersionHistory domain objects.
        metadata_version_history: MetadataVersionHistory. The details of the
            last commit on the exploration metadata.
        committer_ids: List[str]. A list of user ids who made the
            'previous commit' on each state and the exploration metadata.
    """

    def __init__(
        self,
        exploration_id: str,
        exploration_version: int,
        state_version_history_dict: Dict[
            str, state_domain.StateVersionHistoryDict
        ],
        metadata_last_edited_version_number: Optional[int],
        metadata_last_edited_committer_id: str,
        committer_ids: List[str]
    ) -> None:
        """Initializes the ExplorationVersionHistory domain object.

        Args:
            exploration_id: str. The id of the exploration.
            exploration_version: int. The version number of the exploration.
            state_version_history_dict: dict. The mapping of state names and
                dicts of StateVersionHistory domain objects.
            metadata_last_edited_version_number: int. The version number of the
                exploration in which the metadata was last edited.
            metadata_last_edited_committer_id: str. The user id of the user who
                committed the latest changes to the exploration metadata.
            committer_ids: List[str]. A list of user ids who made the
                'previous commit' on each state and the exploration metadata.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_version_history = {
            state_name: state_domain.StateVersionHistory.from_dict(vh_dict)
            for state_name, vh_dict in state_version_history_dict.items()
        }
        self.metadata_version_history = MetadataVersionHistory(
            metadata_last_edited_version_number,
            metadata_last_edited_committer_id
        )
        self.committer_ids = committer_ids

    def to_dict(self) -> ExplorationVersionHistoryDict:
        """Returns a dict representation of the ExplorationVersionHistory
        domain object.

        Returns:
            dict. A dict representation of the ExplorationVersionHistory
            domain object.
        """
        return {
            'exploration_id': self.exploration_id,
            'exploration_version': self.exploration_version,
            'state_version_history': {
                state_name: state_vh.to_dict()
                for state_name, state_vh in self.state_version_history.items()
            },
            'metadata_version_history': (
                self.metadata_version_history.to_dict()
            ),
            'committer_ids': self.committer_ids
        }
