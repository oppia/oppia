# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Domain objects relating to questions."""

from __future__ import annotations

import collections
import copy
import datetime
import re

from core import feconf
from core import schema_utils
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import customization_args_util
from core.domain import exp_domain
from core.domain import expression_parser
from core.domain import state_domain
from core.domain import translation_domain
from extensions import domain

from pylatexenc import latex2text
from typing import (
    Dict, Final, List, Literal, Optional, Set, Tuple, TypedDict, Union, cast,
    overload)

from core.domain import html_cleaner  # pylint: disable=invalid-import-from # isort:skip
from core.domain import html_validation_service  # pylint: disable=invalid-import-from # isort:skip
from core.domain import interaction_registry  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
QUESTION_PROPERTY_LANGUAGE_CODE: Final = 'language_code'
QUESTION_PROPERTY_QUESTION_STATE_DATA: Final = 'question_state_data'
QUESTION_PROPERTY_LINKED_SKILL_IDS: Final = 'linked_skill_ids'
QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS: Final = (
    'inapplicable_skill_misconception_ids')
QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX: Final = 'next_content_id_index'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_QUESTION_PROPERTY: Final = 'update_question_property'
CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION: Final = (
    'create_new_fully_specified_question')
CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION: Final = (
    'migrate_state_schema_to_latest_version')

# The following commands are deprecated, as these functionalities will be
# handled by a QuestionSkillLink class in the future.
CMD_ADD_QUESTION_SKILL: Final = 'add_question_skill'
CMD_REMOVE_QUESTION_SKILL: Final = 'remove_question_skill'

CMD_CREATE_NEW: Final = 'create_new'


class QuestionChange(change_domain.BaseChange):
    """Domain object for changes made to question object.

    The allowed commands, together with the attributes:
        - 'create_new'
        - 'update question property' (with property_name, new_value
        and old_value)
        - 'create_new_fully_specified_question' (with question_dict,
        skill_id)
        - 'migrate_state_schema_to_latest_version' (with from_version
        and to_version)
    """

    # The allowed list of question properties which can be used in
    # update_question_property command.
    QUESTION_PROPERTIES: List[str] = [
        QUESTION_PROPERTY_QUESTION_STATE_DATA,
        QUESTION_PROPERTY_LANGUAGE_CODE,
        QUESTION_PROPERTY_LINKED_SKILL_IDS,
        QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
        QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': [],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_QUESTION_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': QUESTION_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
        'required_attribute_names': ['question_dict', 'skill_id'],
        'optional_attribute_names': ['topic_name'],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class CreateNewQuestionCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_CREATE_NEW command.
    """

    pass


class UpdateQuestionPropertyQuestionStateDataCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_UPDATE_QUESTION_PROPERTY command with
    QUESTION_PROPERTY_QUESTION_STATE_DATA as allowed value.
    """

    property_name: Literal['question_state_data']
    new_value: state_domain.StateDict
    old_value: state_domain.StateDict


class UpdateQuestionPropertyLanguageCodeCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_UPDATE_QUESTION_PROPERTY command with
    QUESTION_PROPERTY_LANGUAGE_CODE as allowed value.
    """

    property_name: Literal['language_code']
    new_value: str
    old_value: str


class UpdateQuestionPropertyNextContentIdIndexCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_UPDATE_QUESTION_PROPERTY command with
    QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX as allowed value.
    """

    property_name: Literal['next_content_id_index']
    new_value: int
    old_value: int


class UpdateQuestionPropertyLinkedSkillIdsCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_UPDATE_QUESTION_PROPERTY command with
    QUESTION_PROPERTY_LINKED_SKILL_IDS as allowed value.
    """

    property_name: Literal['linked_skill_ids']
    new_value: List[str]
    old_value: List[str]


class UpdateQuestionPropertySkillMisconceptionIdsCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_UPDATE_QUESTION_PROPERTY command with
    QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS
    as allowed value.
    """

    property_name: Literal['inapplicable_skill_misconception_ids']
    new_value: List[str]
    old_value: List[str]


class CreateNewFullySpecifiedQuestionCmd(QuestionChange):
    """Class representing the QuestionChange's
    CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION command.
    """

    question_dict: QuestionDict
    skill_id: str
    topic_name: str


class MigrateStateSchemaToLatestVersion(QuestionChange):
    """Class representing the QuestionChange's
    CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: str
    to_version: str


class QuestionSuggestionChangeDict(TypedDict):
    """Dictionary representing the QuestionSuggestionChange domain object."""

    # Note: Here we are defining question's id as None, because while submitting
    # question suggestion from the frontend we are never providing question id
    # in its payload.
    id: None
    question_state_data: state_domain.StateDict
    question_state_data_schema_version: int
    language_code: str
    version: int
    linked_skill_ids: List[str]
    inapplicable_skill_misconception_ids: List[str]
    next_content_id_index: int


class QuestionSuggestionChange(change_domain.BaseChange):
    """Domain object for changes made to question suggestion object.

    The allowed commands, together with the attributes:
        - 'create_new_fully_specified_question' (with question_dict,
        skill_id, skill_difficulty)
    """

    ALLOWED_COMMANDS = [
        {
            'name': CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'required_attribute_names': [
                'question_dict', 'skill_id', 'skill_difficulty'],
            'optional_attribute_names': [],
            'user_id_attribute_names': [],
            'allowed_values': {},
            'deprecated_values': {}
        }
    ]


class CreateNewFullySpecifiedQuestionSuggestionCmd(QuestionSuggestionChange):
    """Class representing the QuestionSuggestionChange's
    CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION command.
    """

    question_dict: QuestionDict
    skill_id: str
    skill_difficulty: float


class QuestionDict(TypedDict):
    """Dictionary representing the Question domain object."""

    id: str
    question_state_data: state_domain.StateDict
    question_state_data_schema_version: int
    language_code: str
    version: int
    linked_skill_ids: List[str]
    inapplicable_skill_misconception_ids: List[str]
    next_content_id_index: int


class VersionedQuestionStateDict(TypedDict):
    """Dictionary representing the versioned State object for Question."""

    state_schema_version: int
    state: state_domain.StateDict


class Question(translation_domain.BaseTranslatableObject):
    """Domain object for a question."""

    def __init__(
        self,
        question_id: str,
        question_state_data: state_domain.State,
        question_state_data_schema_version: int,
        language_code: str,
        version: int,
        linked_skill_ids: List[str],
        inapplicable_skill_misconception_ids: List[str],
        next_content_id_index: int,
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a Question domain object.

        Args:
            question_id: str. The unique ID of the question.
            question_state_data: State. An object representing the question
                state data.
            question_state_data_schema_version: int. The schema version of the
                question states (equivalent to the states schema version of
                explorations).
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
            version: int. The version of the question.
            linked_skill_ids: list(str). Skill ids linked to the question.
                Note: Do not update this field manually.
            inapplicable_skill_misconception_ids: list(str). Optional
                misconception ids that are marked as not relevant to the
                question.
            next_content_id_index: int. The next content_id index to use for
                generation of new content_ids.
            created_on: datetime.datetime. Date and time when the question was
                created.
            last_updated: datetime.datetime. Date and time when the
                question was last updated.
        """
        self.id = question_id
        self.question_state_data = question_state_data
        self.language_code = language_code
        self.question_state_data_schema_version = (
            question_state_data_schema_version)
        self.version = version
        self.linked_skill_ids = linked_skill_ids
        self.inapplicable_skill_misconception_ids = (
            inapplicable_skill_misconception_ids)
        self.next_content_id_index = next_content_id_index
        self.created_on = created_on
        self.last_updated = last_updated

    def get_translatable_contents_collection(
        self,
        **kwargs: Optional[str]
    ) -> translation_domain.TranslatableContentsCollection:
        """Get all translatable fields in the question.

        Returns:
            translatable_contents_collection: TranslatableContentsCollection.
            An instance of TranslatableContentsCollection class.
        """
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_fields_from_translatable_object(
            self.question_state_data)
        return translatable_contents_collection

    def to_dict(self) -> QuestionDict:
        """Returns a dict representing this Question domain object.

        Returns:
            dict. A dict representation of the Question instance.
        """
        return {
            'id': self.id,
            'question_state_data': self.question_state_data.to_dict(),
            'question_state_data_schema_version': (
                self.question_state_data_schema_version),
            'language_code': self.language_code,
            'version': self.version,
            'linked_skill_ids': self.linked_skill_ids,
            'inapplicable_skill_misconception_ids': (
                self.inapplicable_skill_misconception_ids),
            'next_content_id_index': self.next_content_id_index,
        }

    @classmethod
    def create_default_question_state(
        cls, content_id_generator: translation_domain.ContentIdGenerator
    ) -> state_domain.State:
        """Return a State domain object with default value for being used as
        question state data.

        Returns:
            State. The corresponding State domain object.
        """
        return state_domain.State.create_default_state(
            None,
            content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            content_id_generator.generate(
                translation_domain.ContentType.DEFAULT_OUTCOME),
            is_initial_state=True)

    @classmethod
    def _convert_state_v27_dict_to_v28_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 27 to 28. Version 28 replaces
        content_ids_to_audio_translations with recorded_voiceovers.

        Args:
            question_state_dict: dict. The dict representation of
                question_state_data.

        Returns:
            dict. The converted question_state_dict.
        """
        # Here we use MyPy ignore because in _convert_* functions, we allow less
        # strict typing because here we are working with previous versions of
        # the domain object and in previous versions of the domain object there
        # are some fields that are discontinued in the latest domain object and
        # here 'content_ids_to_audio_translations' is discontinued in the
        # latest recorded_voiceovers. So, while accessing these discontinued
        # fields MyPy throws an error. Thus to avoid the error, we used ignore.
        question_state_dict['recorded_voiceovers'] = {
            'voiceovers_mapping': (
                question_state_dict.pop('content_ids_to_audio_translations'))  # type: ignore[misc]
        }
        return question_state_dict

    @classmethod
    def _convert_state_v28_dict_to_v29_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 28 to 29. Version 29 adds
        solicit_answer_details boolean variable to the state, which
        allows the creator to ask for answer details from the learner
        about why they landed on a particular answer.

        Args:
            question_state_dict: dict. The dict representation of
                question_state_data.

        Returns:
            dict. The converted question_state_dict.
        """
        question_state_dict['solicit_answer_details'] = False
        return question_state_dict

    @classmethod
    def _convert_state_v29_dict_to_v30_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 29 to 30. Version 30 replaces
        tagged_misconception_id with tagged_skill_misconception_id, which
        is default to None.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        answer_groups = question_state_dict['interaction']['answer_groups']
        for answer_group in answer_groups:
            answer_group['tagged_skill_misconception_id'] = None
            # Here we use MyPy ignore because in _convert_* functions, we allow
            # less strict typing because here we are working with previous
            # versions of the domain object and in previous versions of the
            # domain object there are some fields that are discontinued in
            # the latest domain object and here 'tagged_misconception_id' is
            # discontinued in the latest answer_group. So, while accessing these
            # discontinued fields MyPy throws an error. Thus to avoid the
            # error, we used ignore here.
            del answer_group['tagged_misconception_id']  # type: ignore[misc]

        return question_state_dict

    @classmethod
    def _convert_state_v30_dict_to_v31_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 30 to 31. Version 31 updates the
        Voiceover model to have an initialized duration_secs attribute of 0.0.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        # Get the voiceovers_mapping metadata.
        voiceovers_mapping = (
            question_state_dict['recorded_voiceovers']['voiceovers_mapping'])
        language_codes_to_audio_metadata = voiceovers_mapping.values()
        for language_codes in language_codes_to_audio_metadata:
            for audio_metadata in language_codes.values():
                # Initialize duration_secs with 0.0 for every voiceover
                # recording under Content, Feedback, Hints, and Solutions.
                # This is necessary to keep the state functional
                # when migrating to v31.
                audio_metadata['duration_secs'] = 0.0
        return question_state_dict

    @classmethod
    def _convert_state_v31_dict_to_v32_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 31 to 32. Version 32 adds a new
        customization arg to SetInput interaction which allows
        creators to add custom text to the "Add" button.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'SetInput':
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'buttonText': {
                    'value': 'Add item'
                }
            })

        return question_state_dict

    @classmethod
    def _convert_state_v32_dict_to_v33_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 32 to 33. Version 33 adds a new
        customization arg to MultipleChoiceInput Interaction which allows
        answer choices to be shuffled.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'MultipleChoiceInput':
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'showChoicesInShuffledOrder': {
                    'value': True
                }
            })

        return question_state_dict

    @classmethod
    def _convert_state_v33_dict_to_v34_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 33 to 34. Version 34 adds a new
        attribute for math components. The new attribute has an additional field
        to for storing SVG filenames.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        question_state_dict = state_domain.State.convert_html_fields_in_state(
            question_state_dict,
            html_validation_service.add_math_content_to_math_rte_components,
            state_uses_old_interaction_cust_args_schema=True,
            state_uses_old_rule_template_schema=True)
        return question_state_dict

    @classmethod
    def _convert_state_v34_dict_to_v35_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 34 to 35. Version 35 upgrades all explorations
        that use the MathExpressionInput interaction to use one of
        AlgebraicExpressionInput, NumericExpressionInput, or MathEquationInput
        interactions.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        is_valid_algebraic_expression = schema_utils.get_validator(
            'is_valid_algebraic_expression')
        is_valid_numeric_expression = schema_utils.get_validator(
            'is_valid_numeric_expression')
        is_valid_math_equation = schema_utils.get_validator(
            'is_valid_math_equation')
        ltt = latex2text.LatexNodes2Text()

        if question_state_dict['interaction']['id'] == 'MathExpressionInput':
            new_answer_groups = []
            types_of_inputs = set()
            for group in question_state_dict['interaction']['answer_groups']:
                new_answer_group = copy.deepcopy(group)
                for rule_spec in new_answer_group['rule_specs']:
                    rule_input = ltt.latex_to_text(rule_spec['inputs']['x'])

                    rule_input = exp_domain.clean_math_expression(
                        rule_input)

                    type_of_input = exp_domain.TYPE_INVALID_EXPRESSION
                    if is_valid_numeric_expression(rule_input):
                        type_of_input = exp_domain.TYPE_VALID_NUMERIC_EXPRESSION
                    elif is_valid_algebraic_expression(rule_input):
                        type_of_input = (
                            exp_domain.TYPE_VALID_ALGEBRAIC_EXPRESSION)
                    elif is_valid_math_equation(rule_input):
                        type_of_input = exp_domain.TYPE_VALID_MATH_EQUATION

                    types_of_inputs.add(type_of_input)

                    if type_of_input != exp_domain.TYPE_INVALID_EXPRESSION:
                        rule_spec['inputs']['x'] = rule_input
                        if type_of_input == exp_domain.TYPE_VALID_MATH_EQUATION:
                            rule_spec['inputs']['y'] = 'both'
                        rule_spec['rule_type'] = 'MatchesExactlyWith'

                new_answer_groups.append(new_answer_group)

            if exp_domain.TYPE_INVALID_EXPRESSION not in types_of_inputs:
                # If at least one rule input is an equation, we remove
                # all other rule inputs that are expressions.
                if exp_domain.TYPE_VALID_MATH_EQUATION in types_of_inputs:
                    new_interaction_id = exp_domain.TYPE_VALID_MATH_EQUATION
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
                elif exp_domain.TYPE_VALID_ALGEBRAIC_EXPRESSION in (
                        types_of_inputs):
                    new_interaction_id = (
                        exp_domain.TYPE_VALID_ALGEBRAIC_EXPRESSION)
                    for group in new_answer_groups:
                        new_rule_specs = []
                        for rule_spec in group['rule_specs']:
                            if is_valid_algebraic_expression(
                                    rule_spec['inputs']['x']):
                                new_rule_specs.append(rule_spec)
                        group['rule_specs'] = new_rule_specs
                else:
                    new_interaction_id = (
                        exp_domain.TYPE_VALID_NUMERIC_EXPRESSION)

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
                            question_state_dict[
                                'interaction']['answer_groups'])]
                new_answer_groups_feedback_keys = [
                    answer_group['outcome'][
                        'feedback']['content_id'] for answer_group in (
                            new_answer_groups)]
                content_ids_to_delete = set(
                    old_answer_groups_feedback_keys) - set(
                        new_answer_groups_feedback_keys)
                for content_id in content_ids_to_delete:
                    if content_id in question_state_dict['recorded_voiceovers'][
                            'voiceovers_mapping']:
                        del question_state_dict['recorded_voiceovers'][
                            'voiceovers_mapping'][content_id]
                    if content_id in question_state_dict[
                            # Here we use MyPy ignore because this is a
                            # conversion function for old schema and the
                            # StateDict doesn't have the writtent translation
                            # property in the latest schema.
                            'written_translations']['translations_mapping']: # type: ignore[misc]
                            # Here we use MyPy ignore because this is a
                            # conversion function for old schema and the
                            # StateDict doesn't have the writtent translation
                            # property in the latest schema.
                        del question_state_dict['written_translations'][ # type: ignore[misc]
                            'translations_mapping'][content_id]

                question_state_dict['interaction']['id'] = new_interaction_id
                question_state_dict['interaction']['answer_groups'] = (
                    new_answer_groups)
                if question_state_dict['interaction']['solution'] is not None:
                    # Ruling out the possibility of any other type for MyPy type
                    # checking, because for 'ExpressionInput' interactions, the
                    # correct_answer is formatted as a Dict type.
                    assert isinstance(
                        question_state_dict['interaction']['solution'][
                            'correct_answer'
                        ],
                        dict
                    )
                    correct_answer = question_state_dict['interaction'][
                        'solution']['correct_answer']['ascii']
                    correct_answer = exp_domain.clean_math_expression(
                        correct_answer)
                    question_state_dict['interaction'][
                        'solution']['correct_answer'] = correct_answer

        return question_state_dict

    @classmethod
    def _convert_state_v35_dict_to_v36_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 35 to 36. Version 35 adds translation support
        for interaction customization arguments. This migration converts
        customization arguments whose schemas have been changed from unicode to
        SubtitledUnicode or html to SubtitledHtml. It also populates missing
        customization argument keys on all interactions, removes extra
        customization arguments, normalizes customization arguments against
        its schema, and changes PencilCodeEditor's customization argument
        name from initial_code to initialCode.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        max_existing_content_id_index = -1
        # Here we use MyPy ignore because the latest schema of state
        # dict doesn't contains written_translations property.
        translations_mapping = question_state_dict[
            'written_translations']['translations_mapping'] # type: ignore[misc]
        for content_id in translations_mapping:
            # Find maximum existing content_id index.
            content_id_suffix = content_id.split('_')[-1]

            # Possible values of content_id_suffix are a digit, or from
            # a 'outcome' (from 'default_outcome'). If the content_id_suffix
            # is not a digit, we disregard it here.
            if content_id_suffix.isdigit():
                max_existing_content_id_index = max(
                    max_existing_content_id_index,
                    int(content_id_suffix)
                )

            # Move 'html' field to 'translation' field and set 'data_format'
            # to 'html' for all WrittenTranslations.
            for lang_code in translations_mapping[content_id]:
                translations_mapping[
                    content_id][lang_code]['data_format'] = 'html'
                translations_mapping[
                    content_id][lang_code]['translation'] = (
                        translations_mapping[content_id][lang_code]['html'])
                # Here we use MyPy ignore because MyPy doesn't allow key
                # deletion from TypedDict.
                del translations_mapping[content_id][lang_code]['html']

        interaction_id = question_state_dict['interaction']['id']
        if interaction_id is None:
            question_state_dict['next_content_id_index'] = ( # type: ignore[misc]
                max_existing_content_id_index + 1)
            return question_state_dict

        class ContentIdCounter:
            """This helper class is used to keep track of
            next_content_id_index and new_content_ids, and provides a
            function to generate new content_ids.
            """

            new_content_ids = []

            def __init__(self, next_content_id_index: int) -> None:
                """Initializes a ContentIdCounter object.

                Args:
                    next_content_id_index: int. The next content id index.
                """
                self.next_content_id_index = next_content_id_index

            def generate_content_id(self, content_id_prefix: str) -> str:
                """Generate a new content_id from the prefix provided and
                the next content id index.

                Args:
                    content_id_prefix: str. The prefix of the content_id.

                Returns:
                    str. The generated content_id.
                """
                content_id = '%s%i' % (
                    content_id_prefix,
                    self.next_content_id_index)
                self.next_content_id_index += 1
                self.new_content_ids.append(content_id)
                return content_id

        content_id_counter = (
            ContentIdCounter(max_existing_content_id_index + 1))

        ca_dict = question_state_dict['interaction']['customization_args']
        if (interaction_id == 'PencilCodeEditor' and
                'initial_code' in ca_dict):
            ca_dict['initialCode'] = ca_dict['initial_code']
            del ca_dict['initial_code']

        # Retrieve a cached version (state schema v35) of
        # interaction_specs.json to ensure that this migration remains
        # stable even when interaction_specs.json is changed.
        ca_specs = [
            domain.CustomizationArgSpec(
                ca_spec_dict['name'],
                ca_spec_dict['description'],
                ca_spec_dict['schema'],
                ca_spec_dict['default_value']
            ) for ca_spec_dict in (
                interaction_registry.Registry
                .get_all_specs_for_state_schema_version(36)[
                    interaction_id]['customization_arg_specs']
            )
        ]

        for ca_spec in ca_specs:
            schema = ca_spec.schema
            ca_name = ca_spec.name
            content_id_prefix = 'ca_%s_' % ca_name

            # We only have to migrate unicode to SubtitledUnicode or
            # list of html to list of SubtitledHtml. No interactions
            # were changed from html to SubtitledHtml.
            is_subtitled_unicode_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE)
            is_subtitled_html_list_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_LIST and
                schema['items']['type'] ==
                schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['items']['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)

            if is_subtitled_unicode_spec:
                # Default is a SubtitledHtml dict or SubtitleUnicode dict.
                # Here we use cast because in this if is_subtitled_unicode_spec
                # clause, default_value can only be of SubtitledUnicodeDict
                # type. So, to narrow down the type from various default_value
                # types, we used cast here.
                default_value = cast(
                    state_domain.SubtitledUnicodeDict, ca_spec.default_value
                )
                new_value = copy.deepcopy(default_value)
                # Here we use cast because in this _convert function we are
                # converting older versions of customization arg dicts that
                # contains Unicode and Html to newer versions of customization
                # arg dicts that contains 'SubtitledUnicodeDict' and
                # 'SubtitledHtmlDict', and by using cast here we are
                # representing an older version of customization arg dictionary.
                older_version_unicode_ca_dict = cast(
                    Dict[str, Dict[str, str]], ca_dict
                )

                # If available, assign value to html or unicode_str.
                if ca_name in ca_dict:
                    new_value['unicode_str'] = older_version_unicode_ca_dict[
                        ca_name
                    ]['value']

                # Assign content_id.
                new_value['content_id'] = (
                    content_id_counter
                    .generate_content_id(content_id_prefix)
                )

                # Here we use cast because in this _convert function we are
                # converting older versions of customization arg dicts that
                # contains Unicode and Html to newer versions of customization
                # arg dicts that contains 'SubtitledUnicodeDict' and
                # 'SubtitledHtmlDict', and by using cast here we are
                # representing an newer version of customization arg dictionary.
                updated_unicode_cust_arg_dict = cast(
                    Dict[str, Dict[str, state_domain.SubtitledUnicodeDict]],
                    ca_dict
                )

                updated_unicode_cust_arg_dict[ca_name] = {'value': new_value}
            elif is_subtitled_html_list_spec:
                new_subtitled_html_list_value: (
                    List[state_domain.SubtitledHtmlDict]
                ) = []

                # Here we use cast because in this _convert function we are
                # converting older versions of customization arg dicts that
                # contains list of Unicode and Html to newer versions of
                # customization arg dicts that contains list of
                # 'SubtitledUnicodeDict' and 'SubtitledHtmlDict', and by using
                # cast here we are representing an older version of
                # customization arg dictionary.
                older_version_html_list_ca_dict = cast(
                    Dict[str, Dict[str, List[str]]], ca_dict
                )

                if ca_name in ca_dict:
                    # Assign values to html fields.
                    for html in older_version_html_list_ca_dict[
                        ca_name
                    ]['value']:
                        new_subtitled_html_list_value.append({
                            'html': html, 'content_id': ''
                        })
                else:
                    # Default is a list of SubtitledHtml dict.
                    # Here we use cast because in this 'else' clause
                    # default_value can only be of List[SubtitledHtmlDict]
                    # type. So, to narrow down the type from various
                    # default_value types, we used cast here.
                    new_subtitled_html_list_value.extend(
                        cast(
                            List[state_domain.SubtitledHtmlDict],
                            ca_spec.default_value
                        )
                    )

                # Assign content_ids.
                for subtitled_html_dict in new_subtitled_html_list_value:
                    subtitled_html_dict['content_id'] = (
                        content_id_counter
                        .generate_content_id(content_id_prefix)
                    )

                # Here we use cast because in this _convert function we are
                # converting older versions of customization arg dicts that
                # contains list of Unicode and Html to newer versions of
                # customization arg dicts that contains list of
                # 'SubtitledUnicodeDict' and 'SubtitledHtmlDict', and
                # by using cast here we are representing an newer version
                # of customization arg dictionary.
                updated_html_list_ca_dict = cast(
                    Dict[str, Dict[str, List[state_domain.SubtitledHtmlDict]]],
                    ca_dict
                )

                updated_html_list_ca_dict[ca_name] = {
                    'value': new_subtitled_html_list_value
                }
            elif ca_name not in ca_dict:
                # Here we use cast because we are narrowing down to the types
                # of customization arg values that are not altered by above
                # if clauses.
                ca_default_value = cast(
                    state_domain.UnionOfCustomizationArgsDictValues,
                    ca_spec.default_value
                )
                ca_dict[ca_name] = {'value': ca_default_value}

        (
            customization_args_util
            .validate_customization_args_and_values(
                'interaction',
                interaction_id,
                ca_dict,
                ca_specs)
        )
        # Here we use MyPy ignore because the latest schema of state
        # dict doesn't contains next_content_id_index property.
        question_state_dict['next_content_id_index'] = ( # type: ignore[misc]
            content_id_counter.next_content_id_index)
        for new_content_id in content_id_counter.new_content_ids:
            # Here we use MyPy ignore because the latest schema of state
            # dict doesn't contains written_translations property.
            question_state_dict['written_translations'][ # type: ignore[misc]
                'translations_mapping'][new_content_id] = {}
            question_state_dict[
                'recorded_voiceovers'][
                    'voiceovers_mapping'][new_content_id] = {}

        return question_state_dict

    @classmethod
    def _convert_state_v36_dict_to_v37_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 36 to 37. Version 37 changes all rules with
        type CaseSensitiveEquals to Equals.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'TextInput':
            answer_group_dicts = question_state_dict[
                'interaction']['answer_groups']
            for answer_group_dict in answer_group_dicts:
                for rule_spec_dict in answer_group_dict['rule_specs']:
                    if rule_spec_dict['rule_type'] == 'CaseSensitiveEquals':
                        rule_spec_dict['rule_type'] = 'Equals'

        return question_state_dict

    @classmethod
    def _convert_state_v37_dict_to_v38_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 37 to 38. Version 38 adds a customization arg
        for the Math interactions that allows creators to specify the letters
        that would be displayed to the learner.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] in (
                'AlgebraicExpressionInput', 'MathEquationInput'):
            variables = set()
            for group in question_state_dict[
                    'interaction']['answer_groups']:
                for rule_spec in group['rule_specs']:
                    rule_input = rule_spec['inputs']['x']
                    # Ruling out the possibility of any other type for mypy
                    # type checking.
                    assert isinstance(rule_input, str)
                    for variable in expression_parser.get_variables(
                            rule_input):
                        # Replacing greek letter names with greek symbols.
                        if len(variable) > 1:
                            variable = (
                                constants.GREEK_LETTER_NAMES_TO_SYMBOLS[
                                    variable])
                        variables.add(variable)

            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'customOskLetters': {
                    'value': sorted(variables)
                }
            })

        return question_state_dict

    @classmethod
    def _convert_state_v38_dict_to_v39_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 38 to 39. Version 39 adds a new
        customization arg to NumericExpressionInput interaction which allows
        creators to modify the placeholder text.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'NumericExpressionInput':
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': (
                            'Type an expression here, using only numbers.')
                    }
                }
            })
            # Here we use MyPy ignore because the latest schema of state
            # dict doesn't contains written_translations property.
            question_state_dict['written_translations']['translations_mapping'][ # type: ignore[misc]
                'ca_placeholder_0'] = {}
            question_state_dict['recorded_voiceovers']['voiceovers_mapping'][
                'ca_placeholder_0'] = {}

        return question_state_dict

    @classmethod
    def _convert_state_v39_dict_to_v40_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 39 to 40. Version 40 converts TextInput rule
        inputs from NormalizedString to SetOfNormalizedString.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'TextInput':
            answer_group_dicts = question_state_dict[
                'interaction']['answer_groups']
            for answer_group_dict in answer_group_dicts:
                rule_type_to_inputs: Dict[
                    str, Set[state_domain.AllowedRuleSpecInputTypes]
                ] = collections.defaultdict(set)
                for rule_spec_dict in answer_group_dict['rule_specs']:
                    rule_type = rule_spec_dict['rule_type']
                    rule_inputs = rule_spec_dict['inputs']['x']
                    rule_type_to_inputs[rule_type].add(rule_inputs)
                # Here we use MyPy ignore because in _convert_* functions, we
                # allow less strict typing because here we are working with
                # previous versions of the domain object and in previous
                # versions of the domain object there are some fields whose type
                # does not match with the latest domain object's types. So,
                # while assigning these old fields  MyPy throws an error. Thus
                # to avoid the error, we used ignore here.
                answer_group_dict['rule_specs'] = [{
                    'rule_type': rule_type,
                    'inputs': {'x': list(rule_type_to_inputs[rule_type])}  # type: ignore[dict-item]
                } for rule_type in rule_type_to_inputs]

        return question_state_dict

    @classmethod
    def _convert_state_v40_dict_to_v41_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 40 to 41. Version 41 adds
        TranslatableSetOfUnicodeString and TranslatableSetOfNormalizedString
        objects to RuleSpec domain objects to allow for translations.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        class ContentIdCounter:
            """This helper class is used to keep track of
            next_content_id_index and new_content_ids, and provides a
            function to generate new content_ids.
            """

            def __init__(self, next_content_id_index: int) -> None:
                """Initializes a ContentIdCounter object.

                Args:
                    next_content_id_index: int. The next content id index.
                """
                self.new_content_ids: List[str] = []
                self.next_content_id_index = next_content_id_index

            def generate_content_id(self, content_id_prefix: str) -> str:
                """Generate a new content_id from the prefix provided and
                the next content id index.

                Args:
                    content_id_prefix: str. The prefix of the content_id.

                Returns:
                    str. The generated content_id.
                """
                content_id = '%s%i' % (
                    content_id_prefix,
                    self.next_content_id_index)
                self.next_content_id_index += 1
                self.new_content_ids.append(content_id)
                return content_id

        # As of Jan 2021, which is when this migration is to be run, only
        # TextInput and SetInput have translatable rule inputs, and every rule
        # for these interactions takes exactly one translatable input named x.
        interaction_id = question_state_dict['interaction']['id']
        if interaction_id in ['TextInput', 'SetInput']:
            content_id_counter = ContentIdCounter(
                # Here we use MyPy ignore because the latest schema of state
                # dict doesn't contains next_content_id_index property.
                question_state_dict['next_content_id_index']) # type: ignore[misc]
            answer_group_dicts = question_state_dict[
                'interaction']['answer_groups']
            for answer_group_dict in answer_group_dicts:
                for rule_spec_dict in answer_group_dict['rule_specs']:
                    content_id = content_id_counter.generate_content_id(
                        'rule_input_')
                    # Here we use MyPy ignore because the expected
                    # type for `rule_spec_dict['inputs']['x']` is
                    # AllowedRuleSpecInputTypes but here we are providing
                    # Dict[str, AllowedRuleSpecInputTypes] values which
                    # causes MyPy to throw `incompatible type` error. Thus
                    # to avoid the error, we used ignore here.
                    # Convert to TranslatableSetOfNormalizedString.
                    if interaction_id == 'TextInput':
                        rule_spec_dict['inputs']['x'] = {
                            'contentId': content_id,
                            'normalizedStrSet': rule_spec_dict['inputs']['x']  # type: ignore[dict-item]
                        }
                    # Here we use MyPy ignore because the expected
                    # type for `rule_spec_dict['inputs']['x']` is
                    # AllowedRuleSpecInputTypes but here we are providing
                    # Dict[str, AllowedRuleSpecInputTypes] values which
                    # causes MyPy to throw `incompatible type` error. Thus
                    # to avoid the error, we used ignore here.
                    elif interaction_id == 'SetInput':
                        # Convert to TranslatableSetOfUnicodeString.
                        rule_spec_dict['inputs']['x'] = {
                            'contentId': content_id,
                            'unicodeStrSet': rule_spec_dict['inputs']['x']  # type: ignore[dict-item]
                        }
            # Here we use MyPy ignore because the latest schema of state
            # dict doesn't contains next_content_id_index property.
            question_state_dict['next_content_id_index'] = ( # type: ignore[misc]
                content_id_counter.next_content_id_index)
            for new_content_id in content_id_counter.new_content_ids:
                # Here we use MyPy ignore because the latest schema of state
                # dict doesn't contains written_translations property.
                question_state_dict[
                    'written_translations'][ # type: ignore[misc]
                        'translations_mapping'][new_content_id] = {}
                question_state_dict[
                    'recorded_voiceovers'][
                        'voiceovers_mapping'][new_content_id] = {}

        return question_state_dict

    @classmethod
    def _convert_state_v41_dict_to_v42_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 41 to 42. Version 42 changes rule input types
        for DragAndDropSortInput and ItemSelectionInput interactions to better
        support translations. Specifically, the rule inputs will store content
        ids of the html rather than the raw html. Solution answers for
        DragAndDropSortInput and ItemSelectionInput interactions are also
        updated.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """

        @overload
        def migrate_rule_inputs_and_answers(
            new_type: str,
            value: str,
            choices: List[state_domain.SubtitledHtmlDict]
        ) -> str: ...

        @overload
        def migrate_rule_inputs_and_answers(
            new_type: str,
            value: List[str],
            choices: List[state_domain.SubtitledHtmlDict]
        ) -> List[str]: ...

        @overload
        def migrate_rule_inputs_and_answers(
            new_type: str,
            value: List[List[str]],
            choices: List[state_domain.SubtitledHtmlDict]
        ) -> List[List[str]]: ...

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
        ) -> Union[List[List[str]], List[str], str]:
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
                # Here we use cast because this 'elif' condition forces value
                # to have type List[str].
                set_of_content_ids = cast(List[str], value)
                return [
                    migrate_rule_inputs_and_answers(
                        'TranslatableHtmlContentId', html, choices
                    ) for html in set_of_content_ids
                ]
            elif new_type == 'ListOfSetsOfTranslatableHtmlContentIds':
                # Here we use cast because this 'elif' condition forces value
                # to have type List[List[str]].
                list_of_set_of_content_ids = cast(
                    List[List[str]], value
                )
                return [
                    migrate_rule_inputs_and_answers(
                        'SetOfTranslatableHtmlContentIds', html_set, choices
                    ) for html_set in list_of_set_of_content_ids
                ]

        interaction_id = question_state_dict['interaction']['id']
        if interaction_id in ['DragAndDropSortInput', 'ItemSelectionInput']:
            solution = question_state_dict['interaction']['solution']
            # Here we use cast because we are narrowing down the type from
            # various customization args value types to List[SubtitledHtmlDict]
            # type, and this is done because here we are accessing 'choices' key
            # over 'DragAndDropSortInput' and 'ItemSelectionInput' customization
            # args and in these customization args 'choices' key will only have
            # values of type List[SubtitledHtmlDict].
            choices = cast(
                List[state_domain.SubtitledHtmlDict],
                question_state_dict['interaction']['customization_args'][
                    'choices']['value']
            )

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

            answer_group_dicts = question_state_dict[
                'interaction']['answer_groups']
            for answer_group_dict in answer_group_dicts:
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

        return question_state_dict

    @classmethod
    def _convert_state_v42_dict_to_v43_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 42 to 43. Version 43 adds a new customization
        arg to NumericExpressionInput, AlgebraicExpressionInput, and
        MathEquationInput. The customization arg will allow creators to choose
        whether to render the division sign (÷) instead of a fraction for the
        division operation.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] in [
                'NumericExpressionInput', 'AlgebraicExpressionInput',
                'MathEquationInput']:
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'useFractionForDivision': {
                    'value': True
                }
            })

        return question_state_dict

    @classmethod
    def _convert_state_v43_dict_to_v44_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 43 to version 44. Version 44 adds
        card_is_checkpoint boolean to the state, which allows creators to
        mark a state as a checkpoint for the learners.

        Args:
            question_state_dict: dict. A dict representation of
                question_state_data.

        Returns:
            dict. The converted question_state_dict.
        """
        question_state_dict['card_is_checkpoint'] = False
        return question_state_dict

    @classmethod
    def _convert_state_v44_dict_to_v45_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 44 to 45. Version 45 contains
        linked skil id.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted states_dict.
        """

        question_state_dict['linked_skill_id'] = None

        return question_state_dict

    @classmethod
    def _convert_state_v45_dict_to_v46_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 45 to 46. Version 46 ensures that the written
        translations in a state containing unicode content do not contain HTML
        tags and the data_format is unicode. This does not affect questions, so
        no conversion is required.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted states_dict.
        """

        return question_state_dict

    @classmethod
    def _convert_state_v46_dict_to_v47_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 46 to 47. Version 52 deprecates
        oppia-noninteractive-svgdiagram tag and converts existing occurences of
        it to oppia-noninteractive-image tag.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted states_dict.
        """

        state_domain.State.convert_html_fields_in_state(
            question_state_dict,
            html_validation_service.convert_svg_diagram_tags_to_image_tags,
            state_schema_version=46)
        return question_state_dict

    @classmethod
    def _convert_state_v47_dict_to_v48_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts draft change list from state version 47 to 48. Version 48
        fixes encoding issues in HTML fields.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted states_dict.
        """

        state_domain.State.convert_html_fields_in_state(
            question_state_dict,
            html_validation_service.fix_incorrectly_encoded_chars,
            state_schema_version=48)
        return question_state_dict

    @classmethod
    def _convert_state_v48_dict_to_v49_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 48 to 49. Version 49 adds
        requireNonnegativeInput customization arg to NumericInput
        interaction which allows creators to set input range greater than
        or equal to zero.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'NumericInput':
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'requireNonnegativeInput': {
                    'value': False
                }
            })
        return question_state_dict

    @classmethod
    def _convert_state_v49_dict_to_v50_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 49 to 50. Version 50 removes rules from
        explorations that use one of the following rules:
        [ContainsSomeOf, OmitsSomeOf, MatchesWithGeneralForm]. It also renames
        `customOskLetters` cust arg to `allowedVariables`.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict[
                'interaction']['id'] in exp_domain.MATH_INTERACTION_TYPES:
            filtered_answer_groups = []
            for answer_group_dict in question_state_dict[
                    'interaction']['answer_groups']:
                filtered_rule_specs = []
                for rule_spec_dict in answer_group_dict['rule_specs']:
                    rule_type = rule_spec_dict['rule_type']
                    if rule_type not in (
                            exp_domain.MATH_INTERACTION_DEPRECATED_RULES):
                        filtered_rule_specs.append(
                            copy.deepcopy(rule_spec_dict))
                answer_group_dict['rule_specs'] = filtered_rule_specs
                if len(filtered_rule_specs) > 0:
                    filtered_answer_groups.append(
                        copy.deepcopy(answer_group_dict))
            question_state_dict[
                'interaction']['answer_groups'] = filtered_answer_groups

            # Renaming cust arg.
        if question_state_dict[
                'interaction']['id'] in exp_domain.ALGEBRAIC_MATH_INTERACTIONS:
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args['allowedVariables'] = copy.deepcopy(
                customization_args['customOskLetters'])
            del customization_args['customOskLetters']

        return question_state_dict

    @classmethod
    def _convert_state_v50_dict_to_v51_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 50 to 51. Version 51 adds a new
        dest_if_really_stuck field to Outcome class to redirect learners
        to a state for strengthening concepts when they get really stuck.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """

        answer_groups = question_state_dict['interaction']['answer_groups']
        for answer_group in answer_groups:
            answer_group['outcome']['dest_if_really_stuck'] = None

        if question_state_dict['interaction']['default_outcome'] is not None:
            question_state_dict[
                'interaction']['default_outcome']['dest_if_really_stuck'] = None

        return question_state_dict

    @classmethod
    def _convert_state_v51_dict_to_v52_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 51 to 52. Version 52 fixes content IDs for
        translations and voiceovers in exploration but no action is required in
        question dicts.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """

        return question_state_dict

    @classmethod
    def _convert_state_v52_dict_to_v53_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 52 to 53. Version 53 fixes errored data present
        in exploration state, RTE and interactions.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """

        # The version 53 only fixes the data for `Exploration` and make
        # no changes in the `Question` that is why we are simply returning.
        return question_state_dict

    @classmethod
    def _convert_state_v53_dict_to_v54_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 53 to 54. Version 54 adds
        catchMisspellings customization arg to TextInput
        interaction which allows creators to detect misspellings.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        if question_state_dict['interaction']['id'] == 'TextInput':
            customization_args = question_state_dict[
                'interaction']['customization_args']
            customization_args.update({
                'catchMisspellings': {
                    'value': False
                }
            })
        return question_state_dict

    @classmethod
    def _convert_state_v54_dict_to_v55_dict(
        cls,
        question_state_dict: state_domain.StateDict
    ) -> Tuple[state_domain.StateDict, int]:
        """Converts from v54 to v55. Version 55 removes next_content_id_index
        and WrittenTranslation from State. This version also updates the
        content-ids for each translatable field in the state with its new
        content-id.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        # Here we use MyPy ignore because the latest schema of state
        # dict doesn't contains next_content_id_index property.
        del question_state_dict['next_content_id_index'] # type: ignore[misc]
        # Here we use MyPy ignore because the latest schema of state
        # dict doesn't contains written_translations property.
        del question_state_dict['written_translations'] # type: ignore[misc]
        states_dict, next_content_id_index = (
            state_domain.State
            .update_old_content_id_to_new_content_id_in_v54_states({
                'question_state': question_state_dict
            })
        )

        return states_dict['question_state'], next_content_id_index

    @classmethod
    def _convert_state_v55_dict_to_v56_dict(
        cls, question_state_dict: state_domain.StateDict
    ) -> state_domain.StateDict:
        """Converts from version 55 to 56. Version 56 adds a field for
        inapplicable skill misconception IDs for the exploration.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initialize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """

        question_state_dict['inapplicable_skill_misconception_ids'] = []

        return question_state_dict

    @classmethod
    def update_state_from_model(
        cls,
        versioned_question_state: VersionedQuestionStateDict,
        current_state_schema_version: int
    ) -> Optional[int]:
        """Converts the state object contained in the given
        versioned_question_state dict from current_state_schema_version to
        current_state_schema_version + 1.
        Note that the versioned_question_state being passed in is modified
        in-place.

        Args:
            versioned_question_state: dict. A dict with two keys:
                - state_schema_version: int. The state schema version for the
                    question.
                - state: The State domain object representing the question
                    state data.
            current_state_schema_version: int. The current state
                schema version.

        Returns:
            int|None. The next content id index if the current state schema
            version is 53 else None.
        """
        versioned_question_state['state_schema_version'] = (
            current_state_schema_version + 1)

        conversion_fn = getattr(cls, '_convert_state_v%s_dict_to_v%s_dict' % (
            current_state_schema_version, current_state_schema_version + 1))

        if current_state_schema_version == 54:
            versioned_question_state['state'], next_content_id_index = (
                conversion_fn(versioned_question_state['state'])
            )
            assert isinstance(next_content_id_index, int)
            return next_content_id_index

        versioned_question_state['state'] = conversion_fn(
            versioned_question_state['state'])

        return None

    def partial_validate(self) -> None:
        """Validates the Question domain object, but doesn't require the
        object to contain an ID and a version. To be used to validate the
        question before it is finalized.
        """

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not self.linked_skill_ids:
            raise utils.ValidationError(
                'linked_skill_ids is either null or an empty list')

        if not (isinstance(self.linked_skill_ids, list) and (
                all(isinstance(elem, str) for elem in (
                    self.linked_skill_ids)))):
            raise utils.ValidationError(
                'Expected linked_skill_ids to be a list of strings, '
                'received %s' % self.linked_skill_ids)

        if len(set(self.linked_skill_ids)) != len(self.linked_skill_ids):
            raise utils.ValidationError(
                'linked_skill_ids has duplicate skill ids')
        inapplicable_skill_misconception_ids_is_list = isinstance(
            self.inapplicable_skill_misconception_ids, list)
        if not (inapplicable_skill_misconception_ids_is_list and (
                all(isinstance(elem, str) for elem in (
                        self.inapplicable_skill_misconception_ids)))):
            raise utils.ValidationError(
                'Expected inapplicable_skill_misconception_ids to be a list '
                'of strings, received %s'
                % self.inapplicable_skill_misconception_ids)

        if not (all(
                re.match(
                    constants.VALID_SKILL_MISCONCEPTION_ID_REGEX, elem
                ) for elem in self.inapplicable_skill_misconception_ids)):
            raise utils.ValidationError(
                'Expected inapplicable_skill_misconception_ids to be a list '
                'of strings of the format <skill_id>-<misconception_id>, '
                'received %s' % self.inapplicable_skill_misconception_ids)

        if len(set(self.inapplicable_skill_misconception_ids)) != len(
                self.inapplicable_skill_misconception_ids):
            raise utils.ValidationError(
                'inapplicable_skill_misconception_ids has duplicate values')

        if not isinstance(self.question_state_data_schema_version, int):
            raise utils.ValidationError(
                'Expected schema version to be an integer, received %s' %
                self.question_state_data_schema_version)

        if self.question_state_data_schema_version != (
            feconf.CURRENT_STATE_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected question state schema version to be %s, received '
                '%s' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION,
                    self.question_state_data_schema_version))

        if not isinstance(self.question_state_data, state_domain.State):
            raise utils.ValidationError(
                'Expected question state data to be a State object, '
                'received %s' % self.question_state_data)

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        interaction_specs = interaction_registry.Registry.get_all_specs()
        at_least_one_correct_answer = False
        dest_is_specified = False
        dest_if_stuck_is_specified = False
        interaction = self.question_state_data.interaction
        for answer_group in interaction.answer_groups:
            if answer_group.outcome.labelled_as_correct:
                at_least_one_correct_answer = True
            if answer_group.outcome.dest is not None:
                dest_is_specified = True
            if answer_group.outcome.dest_if_really_stuck is not None:
                dest_if_stuck_is_specified = True
            if answer_group.outcome.refresher_exploration_id is not None:
                raise utils.ValidationError(
                    'refresher_exploration_id should be None for '
                    'Question outcome.'
                )

        # Ruling out the possibility of None for MyPy type checking, because
        # interaction.default_outcome can be None in the case of explorations
        # but while creating the questions we are always providing default
        # outcome. So, we are sure that here interaction.default_outcome is
        # never going to be None, that's why we used assert here.
        assert interaction.default_outcome is not None
        if interaction.default_outcome.labelled_as_correct:
            at_least_one_correct_answer = True

        if interaction.default_outcome.dest is not None:
            dest_is_specified = True

        if interaction.default_outcome.dest_if_really_stuck is not None:
            dest_if_stuck_is_specified = True

        if interaction.default_outcome.refresher_exploration_id is not None:
            raise utils.ValidationError(
                'refresher_exploration_id should be None for '
                'Question default outcome.'
            )

        if not at_least_one_correct_answer:
            raise utils.ValidationError(
                'Expected at least one answer group to have a correct '
                'answer.'
            )

        if dest_is_specified:
            raise utils.ValidationError(
                'Expected all answer groups to have destination as None.'
            )

        if dest_if_stuck_is_specified:
            raise utils.ValidationError(
                'Expected all answer groups to have destination for the '
                'stuck learner as None.'
            )

        if not interaction.hints:
            raise utils.ValidationError(
                'Expected the question to have at least one hint')

        # Here, we are asserting that id is never going to be None, because
        # None interactions are not allowed to contain questions, so if an
        # interaction have questions then it definitely have interaction_id.
        assert interaction.id is not None
        if (
                (interaction.solution is None) and
                (interaction_specs[interaction.id]['can_have_solution'])):
            raise utils.ValidationError(
                'Expected the question to have a solution'
            )
        # Here the variable `tagged_skill_misconception_id_required`
        # represents that the tagged skill misconception id field is
        # required for it.
        self.question_state_data.validate(
            {},
            False,
            tagged_skill_misconception_id_required=True,
            strict=True)
        self.validate_translatable_contents(self.next_content_id_index)

    def validate(self) -> None:
        """Validates the Question domain object before it is saved."""

        if not isinstance(self.id, str):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self.id)

        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be an integer, received %s' %
                self.version)
        if self.version < 0:
            raise utils.ValidationError(
                'Expected version to be non-negative, received %s' % (
                    self.version))
        self.partial_validate()

    @classmethod
    def from_dict(cls, question_dict: QuestionDict) -> Question:
        """Returns a Question domain object from dict.

        Returns:
            Question. The corresponding Question domain object.
        """
        question = cls(
            question_dict['id'],
            state_domain.State.from_dict(question_dict['question_state_data']),
            question_dict['question_state_data_schema_version'],
            question_dict['language_code'], question_dict['version'],
            question_dict['linked_skill_ids'],
            question_dict['inapplicable_skill_misconception_ids'],
            question_dict['next_content_id_index'])

        return question

    @classmethod
    def create_default_question(
        cls, question_id: str, skill_ids: List[str]
    ) -> Question:
        """Returns a Question domain object with default values.

        Args:
            question_id: str. The unique ID of the question.
            skill_ids: list(str). List of skill IDs attached to this question.

        Returns:
            Question. A Question domain object with default values.
        """
        content_id_generator = translation_domain.ContentIdGenerator()
        default_question_state_data = cls.create_default_question_state(
            content_id_generator)

        return cls(
            question_id, default_question_state_data,
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, skill_ids, [],
            content_id_generator.next_content_id_index)

    def update_language_code(self, language_code: str) -> None:
        """Updates the language code of the question.

        Args:
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.language_code = language_code

    def update_linked_skill_ids(self, linked_skill_ids: List[str]) -> None:
        """Updates the linked skill ids of the question.

        Args:
            linked_skill_ids: list(str). The skill ids linked to the question.
        """
        self.linked_skill_ids = list(set(linked_skill_ids))

    def update_inapplicable_skill_misconception_ids(
        self, inapplicable_skill_misconception_ids: List[str]
    ) -> None:
        """Updates the optional misconception ids marked as not applicable
        to the question.

        Args:
            inapplicable_skill_misconception_ids: list(str). The optional
                skill misconception ids marked as not applicable to the
                question.
        """
        self.inapplicable_skill_misconception_ids = list(
            set(inapplicable_skill_misconception_ids))

    def update_next_content_id_index(
        self, next_content_id_index: int
    ) -> None:
        """Updates the next content id index for the question."""
        self.next_content_id_index = next_content_id_index

    def update_question_state_data(
        self, question_state_data: state_domain.State
    ) -> None:
        """Updates the question data of the question.

        Args:
            question_state_data: State. A State domain object
                representing the question state data.
        """
        self.question_state_data = question_state_data


class QuestionSummaryDict(TypedDict):
    """Dictionary representing the QuestionSummary domain object."""

    id: str
    question_content: str
    interaction_id: str
    last_updated_msec: float
    created_on_msec: float
    misconception_ids: List[str]
    version: int


class QuestionSummary:
    """Domain object for Question Summary."""

    def __init__(
        self,
        question_id: str,
        question_content: str,
        misconception_ids: List[str],
        interaction_id: str,
        question_model_created_on: datetime.datetime,
        question_model_last_updated: datetime.datetime,
        version: int
    ) -> None:
        """Constructs a Question Summary domain object.

        Args:
            question_id: str. The ID of the question.
            question_content: str. The static HTML of the question shown to
                the learner.
            misconception_ids: list(str). The misconception ids addressed in
                the question. This includes tagged misconceptions ids as well
                as inapplicable misconception ids in the question.
            interaction_id: str. The ID of the interaction.
            question_model_created_on: datetime.datetime. Date and time when
                the question model is created.
            question_model_last_updated: datetime.datetime. Date and time
                when the question model was last updated.
            version: int. The current version of the question.
        """
        self.id = question_id
        self.question_content = html_cleaner.clean(question_content)
        self.misconception_ids = misconception_ids
        self.interaction_id = interaction_id
        self.created_on = question_model_created_on
        self.last_updated = question_model_last_updated
        self.version = version

    def to_dict(self) -> QuestionSummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSummary object.
        """

        return {
            'id': self.id,
            'question_content': self.question_content,
            'interaction_id': self.interaction_id,
            'last_updated_msec': utils.get_time_in_millisecs(self.last_updated),
            'created_on_msec': utils.get_time_in_millisecs(self.created_on),
            'misconception_ids': self.misconception_ids,
            'version': self.version
        }

    def validate(self) -> None:
        """Validates the Question summary domain object before it is saved.

        Raises:
            ValidationError. One or more attributes of question summary are
                invalid.
        """
        if not isinstance(self.id, str):
            raise utils.ValidationError(
                'Expected id to be a string, received %s' % self.id)

        if not isinstance(self.question_content, str):
            raise utils.ValidationError(
                'Expected question content to be a string, received %s' %
                self.question_content)

        if not isinstance(self.interaction_id, str):
            raise utils.ValidationError(
                'Expected interaction id to be a string, received %s' %
                self.interaction_id)

        if not isinstance(self.created_on, datetime.datetime):
            raise utils.ValidationError(
                'Expected created on to be a datetime, received %s' %
                self.created_on)

        if not isinstance(self.last_updated, datetime.datetime):
            raise utils.ValidationError(
                'Expected last updated to be a datetime, received %s' %
                self.last_updated)

        if not (isinstance(self.misconception_ids, list) and (
                all(isinstance(elem, str) for elem in (
                    self.misconception_ids)))):
            raise utils.ValidationError(
                'Expected misconception ids to be a list of '
                'strings, received %s' % self.misconception_ids)
        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be int, received %s' % self.version)
        if self.version < 0:
            raise utils.ValidationError(
                'Expected version to be non-negative, received %s' % (
                    self.version))


class QuestionSkillLinkDict(TypedDict):
    """Dictionary representing the QuestionSkillLink domain object."""

    question_id: str
    skill_id: str
    skill_description: str
    skill_difficulty: float


class QuestionSkillLink:
    """Domain object for Question Skill Link.

    Attributes:
        question_id: str. The ID of the question.
        skill_id: str. The ID of the skill to which the
            question is linked.
        skill_description: str. The description of the corresponding skill.
        skill_difficulty: float. The difficulty between [0, 1] of the skill.
    """

    def __init__(
        self,
        question_id: str,
        skill_id: str,
        skill_description: str,
        skill_difficulty: float
    ) -> None:
        """Constructs a Question Skill Link domain object.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.
            skill_description: str. The description of the corresponding skill.
            skill_difficulty: float. The difficulty between [0, 1] of the skill.
        """
        self.question_id = question_id
        self.skill_id = skill_id
        self.skill_description = skill_description
        self.skill_difficulty = skill_difficulty

    def to_dict(self) -> QuestionSkillLinkDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSkillLink object.
        """
        return {
            'question_id': self.question_id,
            'skill_id': self.skill_id,
            'skill_description': self.skill_description,
            'skill_difficulty': self.skill_difficulty,
        }


class MergedQuestionSkillLinkDict(TypedDict):
    """Dictionary representing the MergedQuestionSkillLink domain object."""

    question_id: str
    skill_ids: List[str]
    skill_descriptions: List[str]
    skill_difficulties: List[float]


class MergedQuestionSkillLink:
    """Domain object for the Merged Question Skill Link object, returned to the
    editors.

    Attributes:
        question_id: str. The ID of the question.
        skill_ids: list(str). The skill IDs of the linked skills.
        skill_descriptions: list(str). The descriptions of the skills to which
            the question is linked.
        skill_difficulties: list(float). The difficulties between [0, 1] of the
            skills.
    """

    def __init__(
        self,
        question_id: str,
        skill_ids: List[str],
        skill_descriptions: List[str],
        skill_difficulties: List[float]
    ) -> None:
        """Constructs a Merged Question Skill Link domain object.

        Args:
            question_id: str. The ID of the question.
            skill_ids: list(str). The skill IDs of the linked skills.
            skill_descriptions: list(str). The descriptions of the skills to
                which the question is linked.
            skill_difficulties: list(float). The difficulties between [0, 1] of
                the skills.
        """
        self.question_id = question_id
        self.skill_ids = skill_ids
        self.skill_descriptions = skill_descriptions
        self.skill_difficulties = skill_difficulties

    def to_dict(self) -> MergedQuestionSkillLinkDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this MergedQuestionSkillLink object.
        """
        return {
            'question_id': self.question_id,
            'skill_ids': self.skill_ids,
            'skill_descriptions': self.skill_descriptions,
            'skill_difficulties': self.skill_difficulties,
        }
