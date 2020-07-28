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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import datetime

from constants import constants
from core.domain import change_domain
from core.domain import exp_domain
from core.domain import html_cleaner
from core.domain import html_validation_service
from core.domain import interaction_registry
from core.domain import state_domain
from core.platform import models
import feconf
import python_utils
import schema_utils
import utils

from pylatexenc import latex2text

(question_models,) = models.Registry.import_models([models.NAMES.question])

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
QUESTION_PROPERTY_LANGUAGE_CODE = 'language_code'
QUESTION_PROPERTY_QUESTION_STATE_DATA = 'question_state_data'
QUESTION_PROPERTY_LINKED_SKILL_IDS = 'linked_skill_ids'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_QUESTION_PROPERTY = 'update_question_property'
CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION = 'create_new_fully_specified_question'
CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION = (
    'migrate_state_schema_to_latest_version')

# The following commands are deprecated, as these functionalities will be
# handled by a QuestionSkillLink class in the future.
CMD_ADD_QUESTION_SKILL = 'add_question_skill'
CMD_REMOVE_QUESTION_SKILL = 'remove_question_skill'

CMD_CREATE_NEW = 'create_new'


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
    QUESTION_PROPERTIES = (
        QUESTION_PROPERTY_QUESTION_STATE_DATA,
        QUESTION_PROPERTY_LANGUAGE_CODE,
        QUESTION_PROPERTY_LINKED_SKILL_IDS)

    ALLOWED_COMMANDS = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': [],
        'optional_attribute_names': []
    }, {
        'name': CMD_UPDATE_QUESTION_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'allowed_values': {'property_name': QUESTION_PROPERTIES}
    }, {
        'name': CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
        'required_attribute_names': ['question_dict', 'skill_id'],
        'optional_attribute_names': ['topic_name']
    }, {
        'name': CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': []
    }]


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
            'optional_attribute_names': []
        }
    ]


class Question(python_utils.OBJECT):
    """Domain object for a question."""

    def __init__(
            self, question_id, question_state_data,
            question_state_data_schema_version, language_code, version,
            linked_skill_ids, created_on=None, last_updated=None):
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
        self.created_on = created_on
        self.last_updated = last_updated

    def to_dict(self):
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
            'linked_skill_ids': self.linked_skill_ids
        }

    @classmethod
    def create_default_question_state(cls):
        """Return a State domain object with default value for being used as
        question state data.

        Returns:
            State. The corresponding State domain object.
        """
        return state_domain.State.create_default_state(
            None, is_initial_state=True)

    @classmethod
    def _convert_state_v27_dict_to_v28_dict(cls, question_state_dict):
        """Converts from version 27 to 28. Version 28 replaces
        content_ids_to_audio_translations with recorded_voiceovers.

        Args:
            question_state_dict: dict. The dict representation of
                question_state_data.

        Returns:
            dict. The converted question_state_dict.
        """
        question_state_dict['recorded_voiceovers'] = {
            'voiceovers_mapping': (
                question_state_dict.pop('content_ids_to_audio_translations'))
        }
        return question_state_dict

    @classmethod
    def _convert_state_v28_dict_to_v29_dict(cls, question_state_dict):
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
    def _convert_state_v29_dict_to_v30_dict(cls, question_state_dict):
        """Converts from version 29 to 30. Version 30 replaces
        tagged_misconception_id with tagged_skill_misconception_id, which
        is default to None.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initalize a State domain object.

        Returns:
            dict. The converted question_state_dict.
        """
        answer_groups = question_state_dict['interaction']['answer_groups']
        for answer_group in answer_groups:
            answer_group['tagged_skill_misconception_id'] = None
            del answer_group['tagged_misconception_id']

        return question_state_dict

    @classmethod
    def _convert_state_v30_dict_to_v31_dict(cls, question_state_dict):
        """Converts from version 30 to 31. Version 31 updates the
        Voiceover model to have an initialized duration_secs attribute of 0.0.

        Args:
            question_state_dict: dict. A dict where each key-value pair
                represents respectively, a state name and a dict used to
                initalize a State domain object.

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
    def _convert_state_v31_dict_to_v32_dict(cls, question_state_dict):
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
    def _convert_state_v32_dict_to_v33_dict(cls, question_state_dict):
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
    def _convert_state_v33_dict_to_v34_dict(cls, question_state_dict):
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
            html_validation_service.add_math_content_to_math_rte_components)
        return question_state_dict

    @classmethod
    def _convert_state_v34_dict_to_v35_dict(cls, question_state_dict):
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
                    if is_valid_algebraic_expression(rule_input):
                        type_of_input = (
                            exp_domain.TYPE_VALID_ALGEBRAIC_EXPRESSION)
                    elif is_valid_numeric_expression(rule_input):
                        type_of_input = exp_domain.TYPE_VALID_NUMERIC_EXPRESSION
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
                            'written_translations']['translations_mapping']:
                        del question_state_dict['written_translations'][
                            'translations_mapping'][content_id]

                question_state_dict['interaction']['id'] = new_interaction_id
                question_state_dict['interaction']['answer_groups'] = (
                    new_answer_groups)
                if question_state_dict['interaction']['solution']:
                    correct_answer = question_state_dict['interaction'][
                        'solution']['correct_answer']['ascii']
                    correct_answer = exp_domain.clean_math_expression(
                        correct_answer)
                    question_state_dict['interaction'][
                        'solution']['correct_answer'] = correct_answer

        return question_state_dict

    @classmethod
    def update_state_from_model(
            cls, versioned_question_state, current_state_schema_version):
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
        """
        versioned_question_state['state_schema_version'] = (
            current_state_schema_version + 1)

        conversion_fn = getattr(cls, '_convert_state_v%s_dict_to_v%s_dict' % (
            current_state_schema_version, current_state_schema_version + 1))

        versioned_question_state['state'] = conversion_fn(
            versioned_question_state['state'])

    def partial_validate(self):
        """Validates the Question domain object, but doesn't require the
        object to contain an ID and a version. To be used to validate the
        question before it is finalized.
        """

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not self.linked_skill_ids:
            raise utils.ValidationError(
                'linked_skill_ids is either null or an empty list')

        if not (isinstance(self.linked_skill_ids, list) and (
                all(isinstance(
                    elem, python_utils.BASESTRING) for elem in (
                        self.linked_skill_ids)))):
            raise utils.ValidationError(
                'Expected linked_skill_ids to be a list of strings, '
                'received %s' % self.linked_skill_ids)

        if len(set(self.linked_skill_ids)) != len(self.linked_skill_ids):
            raise utils.ValidationError(
                'linked_skill_ids has duplicate skill ids')

        if not isinstance(self.question_state_data_schema_version, int):
            raise utils.ValidationError(
                'Expected schema version to be an integer, received %s' %
                self.question_state_data_schema_version)

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
        interaction = self.question_state_data.interaction
        for answer_group in interaction.answer_groups:
            if answer_group.outcome.labelled_as_correct:
                at_least_one_correct_answer = True
            if answer_group.outcome.dest is not None:
                dest_is_specified = True

        if interaction.default_outcome.labelled_as_correct:
            at_least_one_correct_answer = True

        if interaction.default_outcome.dest is not None:
            dest_is_specified = True

        if not at_least_one_correct_answer:
            raise utils.ValidationError(
                'Expected at least one answer group to have a correct ' +
                'answer.'
            )

        if dest_is_specified:
            raise utils.ValidationError(
                'Expected all answer groups to have destination as None.'
            )

        if not interaction.hints:
            raise utils.ValidationError(
                'Expected the question to have at least one hint')

        if (
                (interaction.solution is None) and
                (interaction_specs[interaction.id]['can_have_solution'])):
            raise utils.ValidationError(
                'Expected the question to have a solution'
            )
        self.question_state_data.validate({}, False)

    def validate(self):
        """Validates the Question domain object before it is saved."""

        if not isinstance(self.id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self.id)

        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be an integer, received %s' %
                self.version)

        self.partial_validate()

    @classmethod
    def from_dict(cls, question_dict):
        """Returns a Question domain object from dict.

        Returns:
            Question. The corresponding Question domain object.
        """
        question = cls(
            question_dict['id'],
            state_domain.State.from_dict(question_dict['question_state_data']),
            question_dict['question_state_data_schema_version'],
            question_dict['language_code'], question_dict['version'],
            question_dict['linked_skill_ids'])

        return question

    @classmethod
    def create_default_question(cls, question_id, skill_ids):
        """Returns a Question domain object with default values.

        Args:
            question_id: str. The unique ID of the question.
            skill_ids: list(str). List of skill IDs attached to this question.

        Returns:
            Question. A Question domain object with default values.
        """
        default_question_state_data = cls.create_default_question_state()

        return cls(
            question_id, default_question_state_data,
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, skill_ids)

    def update_language_code(self, language_code):
        """Updates the language code of the question.

        Args:
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.language_code = language_code

    def update_linked_skill_ids(self, linked_skill_ids):
        """Updates the linked skill ids of the question.

        Args:
            linked_skill_ids: list(str). The skill ids linked to the question.
        """
        self.linked_skill_ids = list(set(linked_skill_ids))

    def update_question_state_data(self, question_state_data):
        """Updates the question data of the question.

        Args:
            question_state_data: State. A State domain object
                representing the question state data.
        """
        self.question_state_data = question_state_data


class QuestionSummary(python_utils.OBJECT):
    """Domain object for Question Summary."""

    def __init__(
            self, question_id, question_content,
            question_model_created_on=None, question_model_last_updated=None):
        """Constructs a Question Summary domain object.

        Args:
            question_id: str. The ID of the question.
            question_content: str. The static HTML of the question shown to
                the learner.
            question_model_created_on: datetime.datetime. Date and time when
                the question model is created.
            question_model_last_updated: datetime.datetime. Date and time
                when the question model was last updated.
        """
        self.id = question_id
        self.question_content = html_cleaner.clean(question_content)
        self.created_on = question_model_created_on
        self.last_updated = question_model_last_updated

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSummary object.
        """
        return {
            'id': self.id,
            'question_content': self.question_content,
            'last_updated_msec': utils.get_time_in_millisecs(self.last_updated),
            'created_on_msec': utils.get_time_in_millisecs(self.created_on)
        }

    def validate(self):
        """Validates the Question summary domain object before it is saved.

        Raises:
            ValidationError: One or more attributes of question summary are
                invalid.
        """
        if not isinstance(self.id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected id to be a string, received %s' % self.id)

        if not isinstance(self.question_content, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected question content to be a string, received %s' %
                self.question_content)

        if not isinstance(self.created_on, datetime.datetime):
            raise utils.ValidationError(
                'Expected created on to be a datetime, received %s' %
                self.created_on)

        if not isinstance(self.last_updated, datetime.datetime):
            raise utils.ValidationError(
                'Expected last updated to be a datetime, received %s' %
                self.last_updated)


class QuestionSkillLink(python_utils.OBJECT):
    """Domain object for Question Skill Link.

    Attributes:
        question_id: str. The ID of the question.
        skill_id: str. The ID of the skill to which the
            question is linked.
        skill_description: str. The description of the corresponding skill.
        skill_difficulty: float. The difficulty between [0, 1] of the skill.
    """

    def __init__(
            self, question_id, skill_id, skill_description, skill_difficulty):
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

    def to_dict(self):
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


class MergedQuestionSkillLink(python_utils.OBJECT):
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
            self, question_id, skill_ids, skill_descriptions,
            skill_difficulties):
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

    def to_dict(self):
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
