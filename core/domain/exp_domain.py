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
import functools
import re
import string

from constants import constants
from core.domain import change_domain
from core.domain import html_validation_service
from core.domain import interaction_registry
from core.domain import param_domain
from core.domain import state_domain
from core.platform import models
import feconf
import python_utils
import schema_utils
import utils

from pylatexenc import latex2text

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
# TODO(bhenning): Prior to July 2015, exploration changes involving rules were
# logged using the key 'widget_handlers'. These need to be migrated to
# 'answer_groups' and 'default_outcome'.
STATE_PROPERTY_PARAM_CHANGES = 'param_changes'
STATE_PROPERTY_CONTENT = 'content'
STATE_PROPERTY_SOLICIT_ANSWER_DETAILS = 'solicit_answer_details'
STATE_PROPERTY_RECORDED_VOICEOVERS = 'recorded_voiceovers'
STATE_PROPERTY_WRITTEN_TRANSLATIONS = 'written_translations'
STATE_PROPERTY_INTERACTION_ID = 'widget_id'
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
# This takes additional 'state_name', 'content_id', 'language_code' and
# 'content_html' and 'translation_html' parameters.
CMD_ADD_TRANSLATION = 'add_translation'
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
        STATE_PROPERTY_RECORDED_VOICEOVERS,
        STATE_PROPERTY_WRITTEN_TRANSLATIONS,
        STATE_PROPERTY_INTERACTION_ID,
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
        'optional_attribute_names': []
    }, {
        'name': CMD_ADD_STATE,
        'required_attribute_names': ['state_name'],
        'optional_attribute_names': []
    }, {
        'name': CMD_DELETE_STATE,
        'required_attribute_names': ['state_name'],
        'optional_attribute_names': []
    }, {
        'name': CMD_RENAME_STATE,
        'required_attribute_names': ['new_state_name', 'old_state_name'],
        'optional_attribute_names': []
    }, {
        'name': CMD_ADD_TRANSLATION,
        'required_attribute_names': [
            'state_name', 'content_id', 'language_code', 'content_html',
            'translation_html'],
        'optional_attribute_names': []
    }, {
        'name': CMD_EDIT_STATE_PROPERTY,
        'required_attribute_names': [
            'property_name', 'state_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'allowed_values': {'property_name': STATE_PROPERTIES}
    }, {
        'name': CMD_EDIT_EXPLORATION_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'allowed_values': {'property_name': EXPLORATION_PROPERTIES}
    }, {
        'name': CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': []
    }, {
        'name': exp_models.ExplorationModel.CMD_REVERT_COMMIT,
        'required_attribute_names': ['version_number'],
        'optional_attribute_names': []
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


class ExplorationMathRichTextInfo(python_utils.OBJECT):
    """Value object representing all the information related to math rich
    text components in an exploration's HTML.
    """

    def __init__(
            self, exp_id, math_images_generation_required,
            latex_strings_without_svg):
        """Initializes an ExplorationMathRichTextInfo domain object.

        Args:
            exp_id: str. ID of the exploration.
            math_images_generation_required: bool. A boolean which indicates
                whether the exploration requires images to be generated and
                saved for the math rich-text components.
            latex_strings_without_svg: list(str). list of unique LaTeX strings
                from the math rich-text components having the 'svg_filename'
                field as an empty string. Basically these are the LaTeX strings
                for which we need to generate and save an SVG image.
        """
        self.exp_id = exp_id
        self.math_images_generation_required = math_images_generation_required
        self.latex_strings_without_svg = latex_strings_without_svg
        self.validate()

    def to_dict(self):
        """Returns a dict representing this ExplorationMathRichTextInfo domain
        object.

        Returns:
            dict. A dict, mapping all fields of ExplorationMathRichTextInfo
            instance.
        """
        return {
            'exp_id': self.exp_id,
            'math_images_generation_required': (
                self.math_images_generation_required),
            'latex_strings_without_svg': self.latex_strings_without_svg
        }

    def validate(self):
        """Validates properties of the ExplorationMathRichTextInfo.

        Raises:
            ValidationError. Attributes of the ExplorationMathRichTextInfo
                are invalid.
        """
        if not isinstance(self.exp_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected exp_id to be a str, received %s' % self.exp_id)
        if not isinstance(self.math_images_generation_required, bool):
            raise utils.ValidationError(
                'Expected math_images_generation_required to be an bool, '
                'received %s' % self.math_images_generation_required)
        if not isinstance(self.latex_strings_without_svg, list):
            raise utils.ValidationError(
                'Expected latex_strings to be a list, received %s' % (
                    self.latex_strings_without_svg))
        for latex_string in self.latex_strings_without_svg:
            if not isinstance(latex_string, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each element in the list of latex strings to be'
                    ' a str, received %s' % latex_string)

    def get_svg_size_in_bytes(self):
        """Returns the approximate size of SVG images for the LaTeX strings in
        bytes.

        Returns:
            int. The approximate size of Math SVGs in bytes.
        """

        # The approximate size for an SVG image for a LaTeX expression with one
        # character is around 1000 Kb. But, when the number of characters
        # increases the size of SVG per character reduces. For example: If the
        # size of SVG for the character 'a' is 1000 bytes, the size of SVG for
        # 'abc' will be less than 3000 bytes. So the below approximation to
        # find the size will give us the maximum size.
        size_in_bytes = 0
        for latex_string in self.latex_strings_without_svg:
            # The characters in special LaTeX keywords like 'frac' and 'sqrt'
            # don't add up to the total size of SVG.
            length_of_expression = len(latex_string)
            size_in_bytes += (length_of_expression * 1000)
        return size_in_bytes

    def get_longest_latex_expression(self):
        """Returns the longest LaTeX string among the LaTeX strings in the
        object.

        Returns:
            str. The longest LaTeX string.
        """
        return max(self.latex_strings_without_svg, key=len)


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

            state.interaction = state_domain.InteractionInstance(
                idict['id'], idict['customization_args'],
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

            state.solicit_answer_details = sdict['solicit_answer_details']

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
        if init_state_name not in self.states:
            raise Exception(
                'Invalid new initial state name: %s; '
                'it is not in the list of states %s for this '
                'exploration.' % (init_state_name, list(self.states.keys())))
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
            content_count += state.get_content_count()

        return content_count

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
        # Ensure widgets are renamed to be interactions.
        for _, state_defn in states_dict.items():
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
        for (state_name, sdict) in states_dict.items():
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
            answer_group_indexes_to_preserve = []
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

                    if classifier_rule_index is not None:
                        answer_group['rule_specs'].pop(classifier_rule_index)

                    answer_group['training_data'] = training_data

                    if training_data or answer_group['rule_specs']:
                        answer_group_indexes_to_preserve.append(
                            answer_group_index)

            preserved_answer_groups = []
            for answer_group_index in answer_group_indexes_to_preserve:
                preserved_answer_groups.append(
                    answer_groups[answer_group_index])

            state_dict['interaction']['answer_groups'] = preserved_answer_groups

        return states_dict

    @classmethod
    def _convert_states_v19_dict_to_v20_dict(cls, states_dict):
        """Converts from version 19 to 20. Version 20 adds
        tagged_misconception field to answer groups and
        missing_prerequisite_skill_id field to outcomes.

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
                answer_group['outcome']['missing_prerequisite_skill_id'] = None
                answer_group['tagged_misconception_id'] = None

            default_outcome = state_dict['interaction']['default_outcome']
            if default_outcome is not None:
                default_outcome['missing_prerequisite_skill_id'] = None

        return states_dict

    @classmethod
    def _convert_states_v20_dict_to_v21_dict(cls, states_dict):
        """Converts from version 20 to 21. Version 21 moves audio_translations
        from SubtitledHTML to content_ids_to_audio_translations.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            content_ids_to_audio_translations = {}
            content_id = 'content'
            content_ids_to_audio_translations[content_id] = (
                state_dict['content'].pop('audio_translations'))
            state_dict['content']['content_id'] = content_id

            for index, answer_group in enumerate(
                    state_dict['interaction']['answer_groups']):
                content_id = 'feedback_' + python_utils.convert_to_bytes(
                    index + 1)
                content_ids_to_audio_translations[content_id] = (
                    answer_group['outcome']['feedback'].pop(
                        'audio_translations'))
                answer_group['outcome']['feedback']['content_id'] = content_id

            if state_dict['interaction']['default_outcome']:
                default_outcome = state_dict['interaction']['default_outcome']
                content_id = 'default_outcome'
                content_ids_to_audio_translations[content_id] = (
                    default_outcome['feedback'].pop('audio_translations'))
                default_outcome['feedback']['content_id'] = (content_id)

            for index, hint in enumerate(state_dict['interaction']['hints']):
                content_id = 'hint_' + python_utils.convert_to_bytes(index + 1)
                content_ids_to_audio_translations[content_id] = (
                    hint['hint_content'].pop('audio_translations'))
                hint['hint_content']['content_id'] = content_id

            if state_dict['interaction']['solution']:
                solution = state_dict['interaction']['solution']
                content_id = 'solution'
                content_ids_to_audio_translations[content_id] = (
                    solution['explanation'].pop('audio_translations'))
                solution['explanation']['content_id'] = content_id

            state_dict['content_ids_to_audio_translations'] = (
                content_ids_to_audio_translations)
        return states_dict

    @classmethod
    def _convert_states_v21_dict_to_v22_dict(cls, states_dict):
        """Converts from version 21 to 22. Version 22 converts all Rich Text
        Editor content to be compatible with the textAngular format.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for key, state_dict in states_dict.items():
            states_dict[key] = state_domain.State.convert_html_fields_in_state(
                state_dict, html_validation_service.convert_to_textangular)
        return states_dict

    @classmethod
    def _convert_states_v22_dict_to_v23_dict(cls, states_dict):
        """Converts from version 22 to 23. Version 23 ensures that all
        all oppia-noninteractive-image tags have caption attribute.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for key, state_dict in states_dict.items():
            states_dict[key] = state_domain.State.convert_html_fields_in_state(
                state_dict, html_validation_service.add_caption_attr_to_image)
        return states_dict

    @classmethod
    def _convert_states_v23_dict_to_v24_dict(cls, states_dict):
        """Converts from version 23 to 24. Version 24 converts all Rich Text
        Editor content to be compatible with the CKEditor format.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for key, state_dict in states_dict.items():
            states_dict[key] = state_domain.State.convert_html_fields_in_state(
                state_dict, html_validation_service.convert_to_ckeditor)
        return states_dict

    @classmethod
    def _convert_states_v24_dict_to_v25_dict(cls, exp_id, states_dict):
        """Converts from version 24 to 25. Version 25 adds the dimensions of
        images in the oppia-noninteractive-image tags.

        Args:
            exp_id: str. ID of the exploration.
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for key, state_dict in states_dict.items():
            add_dimensions_to_image_tags = functools.partial(
                html_validation_service.add_dimensions_to_image_tags, # pylint: disable=line-too-long
                exp_id)
            states_dict[key] = state_domain.State.convert_html_fields_in_state(
                state_dict,
                add_dimensions_to_image_tags)
            if state_dict['interaction']['id'] == 'ImageClickInput':
                filename = state_dict['interaction']['customization_args'][
                    'imageAndRegions']['value']['imagePath']
                state_dict['interaction']['customization_args'][
                    'imageAndRegions']['value']['imagePath'] = (
                        html_validation_service.get_filename_with_dimensions(
                            filename, exp_id))

        return states_dict

    @classmethod
    def _convert_states_v25_dict_to_v26_dict(cls, states_dict):
        """Converts from version 25 to 26. Version 26 adds a new
        customization arg to DragAndDropSortInput interaction which allows
        multiple sort items in the same position.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] == 'DragAndDropSortInput':
                customization_args = state_dict[
                    'interaction']['customization_args']
                customization_args.update({
                    'allowMultipleItemsInSamePosition': {
                        'value': False
                    }
                })

        return states_dict

    @classmethod
    def _convert_states_v26_dict_to_v27_dict(cls, states_dict):
        """Converts from version 26 to 27. Version 27 adds written_translations
        dict to the state, which will allow translators to add translation
        script for the state contents.

        NOTE: This migration will also filter out the content_id from
        content_ids_to_audio_translations such that the state passes the new
        validation check safely. The earlier state validation used to check that
        the set of all content ids present within the state is subset of the
        content_ids_to_audio_translations keys, but the new validation will
        check whether both are equal.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            state_content_id_list = []

            # Add state card's content id into the state_content_id_list.
            state_content_id_list.append(state_dict['content']['content_id'])

            # Add answer_groups content id into the state_content_id_list.
            for answer_group in state_dict['interaction']['answer_groups']:
                answer_feedback = answer_group['outcome']['feedback']
                state_content_id_list.append(answer_feedback['content_id'])

            # If present, add default_outcome content id into
            # state_content_id_list.
            default_outcome = state_dict['interaction']['default_outcome']
            if default_outcome is not None:
                state_content_id_list.append(
                    default_outcome['feedback']['content_id'])

            # Add hints content id into state_content_id_list.
            for hint in state_dict['interaction']['hints']:
                state_content_id_list.append(hint['hint_content']['content_id'])

            # If present, add solution content id into state_content_id_list.
            solution = state_dict['interaction']['solution']
            if solution:
                state_content_id_list.append(
                    solution['explanation']['content_id'])

            # Filter content_ids_to_audio_translations with unwanted content id.
            # These are the extra content id present within the
            # content_ids_to_audio_translations dict which is of no use as html
            # linked to these content_ids are not available in the state.
            citat = state_dict['content_ids_to_audio_translations']
            extra_content_ids_in_citat = (
                set(citat.keys()) - set(state_content_id_list))
            for content_id in extra_content_ids_in_citat:
                state_dict['content_ids_to_audio_translations'].pop(content_id)

            # Create written_translations using the state_content_id_list.
            translations_mapping = {}
            for content_id in state_content_id_list:
                translations_mapping[content_id] = {}

            state_dict['written_translations'] = {}
            state_dict['written_translations']['translations_mapping'] = (
                translations_mapping)

        return states_dict

    @classmethod
    def _convert_states_v27_dict_to_v28_dict(cls, states_dict):
        """Converts from version 27 to 28. Version 28 replaces
        content_ids_to_audio_translations with recorded_voiceovers.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            state_dict['recorded_voiceovers'] = {
                'voiceovers_mapping': (
                    state_dict.pop('content_ids_to_audio_translations'))
            }
        return states_dict

    @classmethod
    def _convert_states_v28_dict_to_v29_dict(cls, states_dict):
        """Converts from version 28 to 29. Version 29 adds
        solicit_answer_details boolean variable to the state, which
        allows the creator to ask for answer details from the learner
        about why they landed on a particular answer.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            state_dict['solicit_answer_details'] = False
        return states_dict

    @classmethod
    def _convert_states_v29_dict_to_v30_dict(cls, states_dict):
        """Converts from version 29 to 30. Version 30 replaces
        tagged_misconception_id with tagged_skill_misconception_id, which
        contains the skill id and misconception id of the tagged misconception,
        connected by '-'.

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
                answer_group['tagged_skill_misconception_id'] = None
                del answer_group['tagged_misconception_id']
        return states_dict

    @classmethod
    def _convert_states_v30_dict_to_v31_dict(cls, states_dict):
        """Converts from version 30 to 31. Version 31 updates the
        Voiceover model to have an initialized duration_secs attribute
        of 0.0. This will be updated when a new mp3 audio file is uploaded
        for the exploration.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            # Get the voiceovers_mapping metadata.
            voiceovers_mapping = (
                state_dict['recorded_voiceovers']['voiceovers_mapping'])
            language_codes_to_audio_metadata = voiceovers_mapping.values()
            for language_codes in language_codes_to_audio_metadata:
                for audio_metadata in language_codes.values():
                    # Initialize duration_secs with 0.0 for every voiceover
                    # recording under Content, Feedback, Hints, and Solutions.
                    # This is necessary to keep the state functional
                    # when migrating to v31.
                    audio_metadata['duration_secs'] = 0.0
        return states_dict

    @classmethod
    def _convert_states_v31_dict_to_v32_dict(cls, states_dict):
        """Converts from version 31 to 32. Version 32 adds a new
        customization arg to SetInput interaction which allows
        creators to add custom text to the "Add" button.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] == 'SetInput':
                customization_args = state_dict[
                    'interaction']['customization_args']
                customization_args.update({
                    'buttonText': {
                        'value': 'Add item'
                    }
                })

        return states_dict

    @classmethod
    def _convert_states_v32_dict_to_v33_dict(cls, states_dict):
        """Converts from version 32 to 33. Version 33 adds a new
        customization arg to MultipleChoiceInput which allows
        answer choices to be shuffled.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] == 'MultipleChoiceInput':
                customization_args = state_dict[
                    'interaction']['customization_args']
                customization_args.update({
                    'showChoicesInShuffledOrder': {
                        'value': False
                    }
                })

        return states_dict

    @classmethod
    def _convert_states_v33_dict_to_v34_dict(cls, states_dict):
        """Converts from version 33 to 34. Version 34 adds a new
        attribute math components. The new attribute has an additional field to
        for storing SVG filenames.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        for key, state_dict in states_dict.items():
            states_dict[key] = state_domain.State.convert_html_fields_in_state(
                state_dict,
                html_validation_service.add_math_content_to_math_rte_components)
        return states_dict

    @classmethod
    def _convert_states_v34_dict_to_v35_dict(cls, states_dict):
        """Converts from version 34 to 35. Version 35 upgrades all explorations
        that use the MathExpressionInput interaction to use one of
        AlgebraicExpressionInput, NumericExpressionInput, or MathEquationInput
        interactions.

        Args:
            states_dict: dict. A dict where each key-value pair represents,
                respectively, a state name and a dict used to initialize a
                State domain object.

        Returns:
            dict. The converted states_dict.
        """
        is_valid_algebraic_expression = schema_utils.get_validator(
            'is_valid_algebraic_expression')
        is_valid_numeric_expression = schema_utils.get_validator(
            'is_valid_numeric_expression')
        is_valid_math_equation = schema_utils.get_validator(
            'is_valid_math_equation')
        ltt = latex2text.LatexNodes2Text()

        for state_dict in states_dict.values():
            if state_dict['interaction']['id'] == 'MathExpressionInput':
                new_answer_groups = []
                types_of_inputs = set()
                for group in state_dict['interaction']['answer_groups']:
                    new_answer_group = copy.deepcopy(group)
                    for rule_spec in new_answer_group['rule_specs']:
                        rule_input = ltt.latex_to_text(rule_spec['inputs']['x'])

                        rule_input = clean_math_expression(
                            rule_input)

                        type_of_input = TYPE_INVALID_EXPRESSION
                        if is_valid_algebraic_expression(rule_input):
                            type_of_input = TYPE_VALID_ALGEBRAIC_EXPRESSION
                        elif is_valid_numeric_expression(rule_input):
                            type_of_input = TYPE_VALID_NUMERIC_EXPRESSION
                        elif is_valid_math_equation(rule_input):
                            type_of_input = TYPE_VALID_MATH_EQUATION

                        types_of_inputs.add(type_of_input)

                        if type_of_input != TYPE_INVALID_EXPRESSION:
                            rule_spec['inputs']['x'] = rule_input
                            if type_of_input == TYPE_VALID_MATH_EQUATION:
                                rule_spec['inputs']['y'] = 'both'
                            rule_spec['rule_type'] = 'MatchesExactlyWith'

                    new_answer_groups.append(new_answer_group)

                if TYPE_INVALID_EXPRESSION not in types_of_inputs:
                    # If at least one rule input is an equation, we remove
                    # all other rule inputs that are expressions.
                    if TYPE_VALID_MATH_EQUATION in types_of_inputs:
                        new_interaction_id = TYPE_VALID_MATH_EQUATION
                        for group in new_answer_groups:
                            new_rule_specs = []
                            for rule_spec in group['rule_specs']:
                                if is_valid_math_equation(
                                        rule_spec['inputs']['x']):
                                    new_rule_specs.append(rule_spec)
                            group['rule_specs'] = new_rule_specs
                    # Otherwise, if at least one rule_input is an algebraic
                    # expression, we remove all other rule inputs that are
                    # numeric expressions.
                    elif TYPE_VALID_ALGEBRAIC_EXPRESSION in (
                            types_of_inputs):
                        new_interaction_id = TYPE_VALID_ALGEBRAIC_EXPRESSION
                        for group in new_answer_groups:
                            new_rule_specs = []
                            for rule_spec in group['rule_specs']:
                                if is_valid_algebraic_expression(
                                        rule_spec['inputs']['x']):
                                    new_rule_specs.append(rule_spec)
                            group['rule_specs'] = new_rule_specs
                    else:
                        new_interaction_id = TYPE_VALID_NUMERIC_EXPRESSION

                    # Removing answer groups that have no rule specs left after
                    # the filtration done above.
                    new_answer_groups = [
                        answer_group for answer_group in new_answer_groups if (
                            len(answer_group['rule_specs']) != 0)]

                    # Removing feedback keys, from voiceovers_mapping and
                    # translations_mapping, that correspond to the rules that
                    # got deleted.
                    old_answer_groups_feedback_keys = [
                        answer_group['outcome'][
                            'feedback']['content_id'] for answer_group in (
                                state_dict['interaction']['answer_groups'])]
                    new_answer_groups_feedback_keys = [
                        answer_group['outcome'][
                            'feedback']['content_id'] for answer_group in (
                                new_answer_groups)]
                    content_ids_to_delete = set(
                        old_answer_groups_feedback_keys) - set(
                            new_answer_groups_feedback_keys)
                    for content_id in content_ids_to_delete:
                        if content_id in state_dict['recorded_voiceovers'][
                                'voiceovers_mapping']:
                            del state_dict['recorded_voiceovers'][
                                'voiceovers_mapping'][content_id]
                        if content_id in state_dict['written_translations'][
                                'translations_mapping']:
                            del state_dict['written_translations'][
                                'translations_mapping'][content_id]

                    state_dict['interaction']['id'] = new_interaction_id
                    state_dict['interaction']['answer_groups'] = (
                        new_answer_groups)
                    if state_dict['interaction']['solution']:
                        correct_answer = state_dict['interaction'][
                            'solution']['correct_answer']['ascii']
                        correct_answer = clean_math_expression(correct_answer)
                        state_dict['interaction'][
                            'solution']['correct_answer'] = correct_answer

        return states_dict

    @classmethod
    def update_states_from_model(
            cls, versioned_exploration_states, current_states_schema_version,
            exploration_id):
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
            exploration_id: str. ID of the exploration.
        """
        versioned_exploration_states['states_schema_version'] = (
            current_states_schema_version + 1)

        conversion_fn = getattr(cls, '_convert_states_v%s_dict_to_v%s_dict' % (
            current_states_schema_version, current_states_schema_version + 1))
        if current_states_schema_version == 24:
            conversion_fn = functools.partial(conversion_fn, exploration_id)
        versioned_exploration_states['states'] = conversion_fn(
            versioned_exploration_states['states'])

    # The current version of the exploration YAML schema. If any backward-
    # incompatible changes are made to the exploration schema in the YAML
    # definitions, this version number must be changed and a migration process
    # put in place.
    CURRENT_EXP_SCHEMA_VERSION = 40
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

        for _, state_defn in exploration_dict['states'].items():
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
        """Converts a v12 exploration dict into a v13 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v12.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v13.
        """

        exploration_dict['schema_version'] = 13

        exploration_dict['states'] = cls._convert_states_v9_dict_to_v10_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 10

        return exploration_dict

    @classmethod
    def _convert_v13_dict_to_v14_dict(cls, exploration_dict):
        """Converts a v13 exploration dict into a v14 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v13.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v14.
        """

        exploration_dict['schema_version'] = 14

        exploration_dict['states'] = cls._convert_states_v10_dict_to_v11_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 11

        return exploration_dict

    @classmethod
    def _convert_v14_dict_to_v15_dict(cls, exploration_dict):
        """Converts a v14 exploration dict into a v15 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v14.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v15.
        """

        exploration_dict['schema_version'] = 15

        exploration_dict['states'] = cls._convert_states_v11_dict_to_v12_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 12

        return exploration_dict

    @classmethod
    def _convert_v15_dict_to_v16_dict(cls, exploration_dict):
        """Converts a v15 exploration dict into a v16 exploration dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v15.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v16.
        """

        exploration_dict['schema_version'] = 16

        exploration_dict['states'] = cls._convert_states_v12_dict_to_v13_dict(
            exploration_dict['states'])

        exploration_dict['states_schema_version'] = 13

        return exploration_dict

    @classmethod
    def _convert_v16_dict_to_v17_dict(cls, exploration_dict):
        """Converts a v16 exploration dict into a v17 exploration dict.

        Removes gadgets and skins.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v16.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v17.
        """

        exploration_dict['schema_version'] = 17

        if 'skin_customizations' in exploration_dict:
            del exploration_dict['skin_customizations']

        return exploration_dict

    @classmethod
    def _convert_v17_dict_to_v18_dict(cls, exploration_dict):
        """Converts a v17 exploration dict into a v18 exploration dict.

        Adds auto_tts_enabled property.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v17.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v18.
        """

        exploration_dict['schema_version'] = 18

        if exploration_dict['category'] == 'Languages':
            exploration_dict['auto_tts_enabled'] = False
        else:
            exploration_dict['auto_tts_enabled'] = True

        return exploration_dict

    @classmethod
    def _convert_v18_dict_to_v19_dict(cls, exploration_dict):
        """Converts a v18 exploration dict into a v19 exploration dict.

        Adds audio translations to feedback, hints, and solutions.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v18.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v19.
        """

        exploration_dict['schema_version'] = 19

        exploration_dict['states'] = cls._convert_states_v13_dict_to_v14_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 14

        return exploration_dict

    @classmethod
    def _convert_v19_dict_to_v20_dict(cls, exploration_dict):
        """Converts a v19 exploration dict into a v20 exploration dict.

        Introduces a correctness property at the top level, and changes each
        answer group's "correct" field to "labelled_as_correct" instead.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v19.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v20.
        """

        exploration_dict['schema_version'] = 20

        exploration_dict['states'] = cls._convert_states_v14_dict_to_v15_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 15

        exploration_dict['correctness_feedback_enabled'] = False

        return exploration_dict

    @classmethod
    def _convert_v20_dict_to_v21_dict(cls, exploration_dict):
        """Converts a v20 exploration dict into a v21 exploration dict.

        Adds a refresher_exploration_id field to each answer group outcome, and
        to the default outcome (if it exists).

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v20.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v21.
        """

        exploration_dict['schema_version'] = 21

        exploration_dict['states'] = cls._convert_states_v15_dict_to_v16_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 16

        return exploration_dict

    @classmethod
    def _convert_v21_dict_to_v22_dict(cls, exploration_dict):
        """Converts a v21 exploration dict into a v22 exploration dict.

        Moves the labelled_as_correct field from the answer group level to the
        outcome level, and adds two extra customization args to the
        FractionInput interaction.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v21.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v22.
        """

        exploration_dict['schema_version'] = 22

        exploration_dict['states'] = cls._convert_states_v16_dict_to_v17_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 17

        return exploration_dict

    @classmethod
    def _convert_v22_dict_to_v23_dict(cls, exploration_dict):
        """Converts a v22 exploration dict into a v23 exploration dict.

        Adds a new customization arg to FractionInput interactions
        which allows you to add custom placeholders.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v22.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v23.
        """

        exploration_dict['schema_version'] = 23

        exploration_dict['states'] = cls._convert_states_v17_dict_to_v18_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 18

        return exploration_dict

    @classmethod
    def _convert_v23_dict_to_v24_dict(cls, exploration_dict):
        """Converts a v23 exploration dict into a v24 exploration dict.

        Adds training_data parameter to each answer group to store training
        data of corresponding answer group.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v23.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v24.
        """

        exploration_dict['schema_version'] = 24

        exploration_dict['states'] = cls._convert_states_v18_dict_to_v19_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 19

        return exploration_dict

    @classmethod
    def _convert_v24_dict_to_v25_dict(cls, exploration_dict):
        """Converts a v24 exploration dict into a v25 exploration dict.

        Adds additional tagged_misconception_id and
        missing_prerequisite_skill_id fields to answer groups and outcomes
        respectively.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v24.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v25.
        """

        exploration_dict['schema_version'] = 25

        exploration_dict['states'] = cls._convert_states_v19_dict_to_v20_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 20

        return exploration_dict

    @classmethod
    def _convert_v25_dict_to_v26_dict(cls, exploration_dict):
        """Converts a v25 exploration dict into a v26 exploration dict.

        Move audio_translations into a seperate dict.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v25.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v26.
        """

        exploration_dict['schema_version'] = 26

        exploration_dict['states'] = cls._convert_states_v20_dict_to_v21_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 21

        return exploration_dict

    @classmethod
    def _convert_v26_dict_to_v27_dict(cls, exploration_dict):
        """Converts a v26 exploration dict into a v27 exploration dict.

        Converts all Rich Text Editor content to be compatible with the
        textAngular format.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v26.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v27.
        """

        exploration_dict['schema_version'] = 27

        exploration_dict['states'] = cls._convert_states_v21_dict_to_v22_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 22

        return exploration_dict

    @classmethod
    def _convert_v27_dict_to_v28_dict(cls, exploration_dict):
        """Converts a v27 exploration dict into a v28 exploration dict.

        Adds caption attribute to all oppia-noninteractive-image tags.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v27.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v28.
        """

        exploration_dict['schema_version'] = 28

        exploration_dict['states'] = cls._convert_states_v22_dict_to_v23_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 23

        return exploration_dict

    @classmethod
    def _convert_v28_dict_to_v29_dict(cls, exploration_dict):
        """Converts a v28 exploration dict into a v29 exploration dict.

        Converts all Rich Text Editor content to be compatible with the
        CKEditor format.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v28.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v29.
        """

        exploration_dict['schema_version'] = 29

        exploration_dict['states'] = cls._convert_states_v23_dict_to_v24_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 24

        return exploration_dict

    @classmethod
    def _convert_v29_dict_to_v30_dict(cls, exp_id, exploration_dict):
        """Converts a v29 exploration dict into a v30 exploration dict.

        Adds dimensions to all oppia-noninteractive-image tags.

        Args:
            exp_id: str. ID of the exploration.
            exploration_dict: dict. The dict representation of an exploration
                with schema version v29.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v30.
        """

        exploration_dict['schema_version'] = 30

        exploration_dict['states'] = cls._convert_states_v24_dict_to_v25_dict(
            exp_id, exploration_dict['states'])
        exploration_dict['states_schema_version'] = 25

        return exploration_dict

    @classmethod
    def _convert_v30_dict_to_v31_dict(cls, exploration_dict):
        """Converts a v30 exploration dict into a v31 exploration dict.

        Adds a new customization arg to DragAndDropSortInput interactions
        which allows multiple sort items in the same position.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v30.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v31.
        """

        exploration_dict['schema_version'] = 31

        exploration_dict['states'] = cls._convert_states_v25_dict_to_v26_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 26

        return exploration_dict

    @classmethod
    def _convert_v31_dict_to_v32_dict(cls, exploration_dict):
        """Converts a v31 exploration dict into a v32 exploration dict.

        Adds content_tranlations in state for adding text translation.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v31.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v32.
        """

        exploration_dict['schema_version'] = 32

        exploration_dict['states'] = cls._convert_states_v26_dict_to_v27_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 27

        return exploration_dict

    @classmethod
    def _convert_v32_dict_to_v33_dict(cls, exploration_dict):
        """Converts a v32 exploration dict into a v33 exploration dict.

        Replaces content_ids_to_audio_translations with recorded_voiceovers in
        each state of the exploration.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v32.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v33.
        """

        exploration_dict['schema_version'] = 33

        exploration_dict['states'] = cls._convert_states_v27_dict_to_v28_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 28

        return exploration_dict

    @classmethod
    def _convert_v33_dict_to_v34_dict(cls, exploration_dict):
        """Converts a v33 exploration dict into a v34 exploration dict.

        Adds solicit_answer_details in state to ask learners for the
        answer details.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v33.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v34.
        """
        exploration_dict['schema_version'] = 34

        exploration_dict['states'] = cls._convert_states_v28_dict_to_v29_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 29

        return exploration_dict

    @classmethod
    def _convert_v34_dict_to_v35_dict(cls, exploration_dict):
        """Converts a v34 exploration dict into a v35 exploration dict.
        Replaces tagged_misconception_id with tagged_skill_misconception_id,
        which contains the skill id and misconception id of the tagged
        misconception, connected by '-'.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v34.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v35.
        """
        exploration_dict['schema_version'] = 35

        exploration_dict['states'] = cls._convert_states_v29_dict_to_v30_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 30

        return exploration_dict

    @classmethod
    def _convert_v35_dict_to_v36_dict(cls, exploration_dict):
        """Converts a v35 exploration dict into a v36 exploration dict.
        Updates existing explorations to match the Voiceover class to have
        the duration attribute initalised to 0.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v35.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v36.
        """
        exploration_dict['schema_version'] = 36

        exploration_dict['states'] = cls._convert_states_v30_dict_to_v31_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 31

        return exploration_dict

    @classmethod
    def _convert_v36_dict_to_v37_dict(cls, exploration_dict):
        """Converts a v36 exploration dict into a v37 exploration dict.
        Adds a new customization arg to SetInput interactions
        which allows creators to customize the "Add item" button.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v36.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v37.
        """
        exploration_dict['schema_version'] = 37

        exploration_dict['states'] = cls._convert_states_v31_dict_to_v32_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 32

        return exploration_dict

    @classmethod
    def _convert_v37_dict_to_v38_dict(cls, exploration_dict):
        """Converts a v37 exploration dict into a v38 exploration dict.
        Adds a new customization arg to MultipleChoiceInput which allows
        answer choices to be shuffled.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v37.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v38.
        """
        exploration_dict['schema_version'] = 38

        exploration_dict['states'] = cls._convert_states_v32_dict_to_v33_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 33

        return exploration_dict

    @classmethod
    def _convert_v38_dict_to_v39_dict(cls, exploration_dict):
        """Converts a v38 exploration dict into a v39 exploration dict.
        Adds a new attribute math components. The new attribute has an
        additional field to for storing SVG filenames.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v38.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v39.
        """
        exploration_dict['schema_version'] = 39

        exploration_dict['states'] = cls._convert_states_v33_dict_to_v34_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 34

        return exploration_dict

    @classmethod
    def _convert_v39_dict_to_v40_dict(cls, exploration_dict):
        """Converts a v39 exploration dict into a v40 exploration dict.
        Upgrades all explorations that use the MathExpressionInput interaction
        to use one of AlgebraicExpressionInput, NumericExpressionInput, or
        MathEquationInput interactions.

        Args:
            exploration_dict: dict. The dict representation of an exploration
                with schema version v39.

        Returns:
            dict. The dict representation of the Exploration domain object,
            following schema version v40.
        """
        exploration_dict['schema_version'] = 40

        exploration_dict['states'] = cls._convert_states_v34_dict_to_v35_dict(
            exploration_dict['states'])
        exploration_dict['states_schema_version'] = 35

        return exploration_dict

    @classmethod
    def _migrate_to_latest_yaml_version(
            cls, yaml_content, exp_id, title=None, category=None):
        """Return the YAML content of the exploration in the latest schema
        format.

        Args:
            yaml_content: str. The YAML representation of the exploration.
            exp_id: str. ID of the exploration.
            title: str. The exploration title.
            category: str. The exploration category.

        Returns:
            tuple(dict, int). The dict 'exploration_dict' is the representation
            of the Exploration and the 'initial_schema_version' is the initial
            schema version provided in 'yaml_content'.

        Raises:
            Exception. The 'yaml_content' or the exploration schema version is
                not valid.
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

        if exploration_schema_version == 24:
            exploration_dict = cls._convert_v24_dict_to_v25_dict(
                exploration_dict)
            exploration_schema_version = 25

        if exploration_schema_version == 25:
            exploration_dict = cls._convert_v25_dict_to_v26_dict(
                exploration_dict)
            exploration_schema_version = 26

        if exploration_schema_version == 26:
            exploration_dict = cls._convert_v26_dict_to_v27_dict(
                exploration_dict)
            exploration_schema_version = 27

        if exploration_schema_version == 27:
            exploration_dict = cls._convert_v27_dict_to_v28_dict(
                exploration_dict)
            exploration_schema_version = 28

        if exploration_schema_version == 28:
            exploration_dict = cls._convert_v28_dict_to_v29_dict(
                exploration_dict)
            exploration_schema_version = 29

        if exploration_schema_version == 29:
            exploration_dict = cls._convert_v29_dict_to_v30_dict(
                exp_id, exploration_dict)
            exploration_schema_version = 30

        if exploration_schema_version == 30:
            exploration_dict = cls._convert_v30_dict_to_v31_dict(
                exploration_dict)
            exploration_schema_version = 31

        if exploration_schema_version == 31:
            exploration_dict = cls._convert_v31_dict_to_v32_dict(
                exploration_dict)
            exploration_schema_version = 32

        if exploration_schema_version == 32:
            exploration_dict = cls._convert_v32_dict_to_v33_dict(
                exploration_dict)
            exploration_schema_version = 33

        if exploration_schema_version == 33:
            exploration_dict = cls._convert_v33_dict_to_v34_dict(
                exploration_dict)
            exploration_schema_version = 34

        if exploration_schema_version == 34:
            exploration_dict = cls._convert_v34_dict_to_v35_dict(
                exploration_dict)
            exploration_schema_version = 35

        if exploration_schema_version == 35:
            exploration_dict = cls._convert_v35_dict_to_v36_dict(
                exploration_dict)
            exploration_schema_version = 36

        if exploration_schema_version == 36:
            exploration_dict = cls._convert_v36_dict_to_v37_dict(
                exploration_dict)
            exploration_schema_version = 37

        if exploration_schema_version == 37:
            exploration_dict = cls._convert_v37_dict_to_v38_dict(
                exploration_dict)
            exploration_schema_version = 38

        if exploration_schema_version == 38:
            exploration_dict = cls._convert_v38_dict_to_v39_dict(
                exploration_dict)
            exploration_schema_version = 39

        if exploration_schema_version == 39:
            exploration_dict = cls._convert_v39_dict_to_v40_dict(
                exploration_dict)
            exploration_schema_version = 40

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
            Exception. The initial schema version of exploration is less than
                or equal to 9.
        """
        migration_result = cls._migrate_to_latest_yaml_version(
            yaml_content, exploration_id)
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
            Exception. The initial schema version of exploration is less than
                or equal to 9.
        """
        migration_result = cls._migrate_to_latest_yaml_version(
            yaml_content, exploration_id, title=title, category=category)
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
            html_list = html_list + [content_html] + interaction_html_list

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
