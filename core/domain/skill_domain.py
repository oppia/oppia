# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Domain objects relating to skills."""

from __future__ import annotations

import copy
import datetime
import json

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import state_domain
from core.domain import translation_domain

from typing import Callable, Dict, Final, List, Literal, Optional, TypedDict

from core.domain import html_cleaner  # pylint: disable=invalid-import-from # isort:skip
from core.domain import html_validation_service  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
SKILL_PROPERTY_DESCRIPTION: Final = 'description'
SKILL_PROPERTY_LANGUAGE_CODE: Final = 'language_code'
SKILL_PROPERTY_SUPERSEDING_SKILL_ID: Final = 'superseding_skill_id'
SKILL_PROPERTY_ALL_QUESTIONS_MERGED: Final = 'all_questions_merged'
SKILL_PROPERTY_PREREQUISITE_SKILL_IDS: Final = 'prerequisite_skill_ids'

SKILL_CONTENTS_PROPERTY_EXPLANATION: Final = 'explanation'
SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES: Final = 'worked_examples'

SKILL_MISCONCEPTIONS_PROPERTY_NAME: Final = 'name'
SKILL_MISCONCEPTIONS_PROPERTY_NOTES: Final = 'notes'
SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK: Final = 'feedback'
SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED: Final = 'must_be_addressed'

# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_SKILL_PROPERTY: Final = 'update_skill_property'
CMD_UPDATE_SKILL_CONTENTS_PROPERTY: Final = 'update_skill_contents_property'
CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY: Final = (
    'update_skill_misconceptions_property')

CMD_UPDATE_RUBRICS: Final = 'update_rubrics'

CMD_ADD_SKILL_MISCONCEPTION: Final = 'add_skill_misconception'
CMD_DELETE_SKILL_MISCONCEPTION: Final = 'delete_skill_misconception'

CMD_ADD_PREREQUISITE_SKILL: Final = 'add_prerequisite_skill'
CMD_DELETE_PREREQUISITE_SKILL: Final = 'delete_prerequisite_skill'

CMD_CREATE_NEW: Final = 'create_new'
CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION: Final = (
    'migrate_contents_schema_to_latest_version')
CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION: Final = (
    'migrate_misconceptions_schema_to_latest_version')
CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION: Final = (
    'migrate_rubrics_schema_to_latest_version')


class SkillChange(change_domain.BaseChange):
    """Domain object for changes made to skill object.

    The allowed commands, together with the attributes:
        - 'add_skill_misconception' (with new_misconception_dict)
        - 'delete_skill_misconception' (with misconception_id)
        - 'create_new'
        - 'update_skill_property' (with property_name, new_value
        and old_value)
        - 'update_skill_contents_property' (with property_name,
        new_value and old_value)
        - 'update_skill_misconceptions_property' (
            with misconception_id, property_name, new_value and old_value)
        - 'migrate_contents_schema_to_latest_version' (with
        from_version and to_version)
        - 'migrate_misconceptions_schema_to_latest_version' (with
        from_version and to_version)
    """

    # The allowed list of skill properties which can be used in
    # update_skill_property command.
    SKILL_PROPERTIES: List[str] = [
        SKILL_PROPERTY_DESCRIPTION, SKILL_PROPERTY_LANGUAGE_CODE,
        SKILL_PROPERTY_SUPERSEDING_SKILL_ID,
        SKILL_PROPERTY_ALL_QUESTIONS_MERGED,
        SKILL_PROPERTY_PREREQUISITE_SKILL_IDS
    ]

    # The allowed list of skill contents properties which can be used in
    # update_skill_contents_property command.
    SKILL_CONTENTS_PROPERTIES: List[str] = [
        SKILL_CONTENTS_PROPERTY_EXPLANATION,
        SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES
    ]

    # The allowed list of misconceptions properties which can be used in
    # update_skill_misconceptions_property command.
    SKILL_MISCONCEPTIONS_PROPERTIES: List[str] = [
        SKILL_MISCONCEPTIONS_PROPERTY_NAME,
        SKILL_MISCONCEPTIONS_PROPERTY_NOTES,
        SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK,
        SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED
    ]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': [],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_SKILL_MISCONCEPTION,
        'required_attribute_names': ['new_misconception_dict'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_SKILL_MISCONCEPTION,
        'required_attribute_names': ['misconception_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_PREREQUISITE_SKILL,
        'required_attribute_names': ['skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_PREREQUISITE_SKILL,
        'required_attribute_names': ['skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_RUBRICS,
        'required_attribute_names': ['difficulty', 'explanations'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
        'required_attribute_names': [
            'misconception_id', 'property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SKILL_MISCONCEPTIONS_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_SKILL_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SKILL_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SKILL_CONTENTS_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class CreateNewSkillCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_CREATE_NEW command.
    """

    pass


class AddSkillMisconceptionCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_ADD_SKILL_MISCONCEPTION command.
    """

    new_misconception_dict: MisconceptionDict


class DeleteSkillMisconceptionCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_DELETE_SKILL_MISCONCEPTION command.
    """

    misconception_id: int


class AddPrerequisiteSkillCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_ADD_PREREQUISITE_SKILL command.
    """

    skill_id: str


class DeletePrerequisiteSkillCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_DELETE_PREREQUISITE_SKILL command.
    """

    skill_id: str


class UpdateRubricsCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_RUBRICS command.
    """

    difficulty: str
    explanations: List[str]


class UpdateSkillMisconceptionPropertyNameCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY command with
    SKILL_MISCONCEPTIONS_PROPERTY_NAME as allowed value.
    """

    misconception_id: int
    property_name: Literal['name']
    new_value: str
    old_value: str


class UpdateSkillMisconceptionPropertyNotesCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY command with
    SKILL_MISCONCEPTIONS_PROPERTY_NOTES as allowed value.
    """

    misconception_id: int
    property_name: Literal['notes']
    new_value: str
    old_value: str


class UpdateSkillMisconceptionPropertyFeedbackCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY command with
    SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK as allowed value.
    """

    misconception_id: int
    property_name: Literal['feedback']
    new_value: str
    old_value: str


class UpdateSkillMisconceptionPropertyMustBeAddressedCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY command with
    SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED as allowed value.
    """

    misconception_id: int
    property_name: Literal['must_be_addressed']
    new_value: bool
    old_value: bool


class UpdateSkillPropertyDescriptionCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_PROPERTY command with
    SKILL_PROPERTY_DESCRIPTION as allowed value.
    """

    property_name: Literal['description']
    new_value: str
    old_value: str


class UpdateSkillPropertyLanguageCodeCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_PROPERTY command with
    SKILL_PROPERTY_LANGUAGE_CODE as allowed value.
    """

    property_name: Literal['language_code']
    new_value: str
    old_value: str


class UpdateSkillPropertySupersedingSkillIdCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_PROPERTY command with
    SKILL_PROPERTY_SUPERSEDING_SKILL_ID as
    allowed value.
    """

    property_name: Literal['superseding_skill_id']
    new_value: str
    old_value: str


class UpdateSkillPropertyAllQuestionsMergedCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_PROPERTY command with
    SKILL_PROPERTY_ALL_QUESTIONS_MERGED as
    allowed value.
    """

    property_name: Literal['all_questions_merged']
    new_value: bool
    old_value: bool


class UpdateSkillPropertyPrerequisiteSkillIdsCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_PROPERTY command with
    SKILL_PROPERTY_PREREQUISITE_SKILL_IDS as
    allowed value.
    """

    property_name: Literal['prerequisite_skill_ids']
    new_value: List[str]
    old_value: List[str]


class UpdateSkillContentsPropertyExplanationCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_CONTENTS_PROPERTY command
    with SKILL_CONTENTS_PROPERTY_EXPLANATION as
    allowed value.
    """

    property_name: Literal['explanation']
    new_value: state_domain.SubtitledHtmlDict
    old_value: state_domain.SubtitledHtmlDict


class UpdateSkillContentsPropertyWorkedExamplesCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_UPDATE_SKILL_CONTENTS_PROPERTY command
    with SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES
    as allowed value.
    """

    property_name: Literal['worked_examples']
    new_value: List[WorkedExampleDict]
    old_value: List[WorkedExampleDict]


class MigrateContentsSchemaToLatestVersionCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: str
    to_version: str


class MigrateMisconceptionsSchemaToLatestVersionCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: str
    to_version: str


class MigrateRubricsSchemaToLatestVersionCmd(SkillChange):
    """Class representing the SkillChange's
    CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: str
    to_version: str


class MisconceptionDict(TypedDict):
    """Dictionary representing the Misconception object."""

    id: int
    name: str
    notes: str
    feedback: str
    must_be_addressed: bool


class VersionedMisconceptionDict(TypedDict):
    """Dictionary representing the versioned Misconception object."""

    schema_version: int
    misconceptions: List[MisconceptionDict]


class Misconception:
    """Domain object describing a skill misconception."""

    def __init__(
        self,
        misconception_id: int,
        name: str,
        notes: str,
        feedback: str,
        must_be_addressed: bool
    ) -> None:
        """Initializes a Misconception domain object.

        Args:
            misconception_id: int. The unique id of each misconception.
            name: str. The name of the misconception.
            notes: str. General advice for creators about the
                misconception (including examples) and general notes. This
                should be an html string.
            feedback: str. This can auto-populate the feedback field
                when an answer group has been tagged with a misconception. This
                should be an html string.
            must_be_addressed: bool. Whether the misconception should
                necessarily be addressed in all questions linked to the skill.
        """
        self.id = misconception_id
        self.name = name
        self.notes = html_cleaner.clean(notes)
        self.feedback = html_cleaner.clean(feedback)
        self.must_be_addressed = must_be_addressed

    def to_dict(self) -> MisconceptionDict:
        """Returns a dict representing this Misconception domain object.

        Returns:
            dict. A dict, mapping all fields of Misconception instance.
        """
        return {
            'id': self.id,
            'name': self.name,
            'notes': self.notes,
            'feedback': self.feedback,
            'must_be_addressed': self.must_be_addressed
        }

    @classmethod
    def from_dict(cls, misconception_dict: MisconceptionDict) -> Misconception:
        """Returns a Misconception domain object from a dict.

        Args:
            misconception_dict: dict. The dict representation of
                Misconception object.

        Returns:
            Misconception. The corresponding Misconception domain object.
        """
        misconception = cls(
            misconception_dict['id'], misconception_dict['name'],
            misconception_dict['notes'], misconception_dict['feedback'],
            misconception_dict['must_be_addressed'])

        return misconception

    @classmethod
    def require_valid_misconception_id(cls, misconception_id: int) -> None:
        """Validates the misconception id for a Misconception object.

        Args:
            misconception_id: int. The misconception id to be validated.

        Raises:
            ValidationError. The misconception id is invalid.
        """
        if not isinstance(misconception_id, int):
            raise utils.ValidationError(
                'Expected misconception ID to be an integer, received %s' %
                misconception_id)

        if misconception_id < 0:
            raise utils.ValidationError(
                'Expected misconception ID to be >= 0, received %s' %
                misconception_id)

    def validate(self) -> None:
        """Validates various properties of the Misconception object.

        Raises:
            ValidationError. One or more attributes of the misconception are
                invalid.
        """
        self.require_valid_misconception_id(self.id)
        if not isinstance(self.name, str):
            raise utils.ValidationError(
                'Expected misconception name to be a string, received %s' %
                self.name)

        misconception_name_length_limit = (
            android_validation_constants.MAX_CHARS_IN_MISCONCEPTION_NAME)
        if len(self.name) > misconception_name_length_limit:
            raise utils.ValidationError(
                'Misconception name should be less than %d chars, received %s'
                % (misconception_name_length_limit, self.name))

        if not isinstance(self.notes, str):
            raise utils.ValidationError(
                'Expected misconception notes to be a string, received %s' %
                self.notes)

        if not isinstance(self.must_be_addressed, bool):
            raise utils.ValidationError(
                'Expected must_be_addressed to be a bool, received %s' %
                self.must_be_addressed)

        if not isinstance(self.feedback, str):
            raise utils.ValidationError(
                'Expected misconception feedback to be a string, received %s' %
                self.feedback)


class RubricDict(TypedDict):
    """Dictionary representing the Rubric object."""

    difficulty: str
    explanations: List[str]


class VersionedRubricDict(TypedDict):
    """Dictionary representing the versioned Rubric object."""

    schema_version: int
    rubrics: List[RubricDict]


class Rubric:
    """Domain object describing a skill rubric."""

    def __init__(
        self,
        difficulty: str,
        explanations: List[str]
    ) -> None:
        """Initializes a Rubric domain object.

        Args:
            difficulty: str. The question difficulty that this rubric addresses.
            explanations: list(str). The different explanations for the
                corresponding difficulty.
        """
        self.difficulty = difficulty
        self.explanations = [
            html_cleaner.clean(explanation) for explanation in explanations]

    def to_dict(self) -> RubricDict:
        """Returns a dict representing this Rubric domain object.

        Returns:
            dict. A dict, mapping all fields of Rubric instance.
        """
        return {
            'difficulty': self.difficulty,
            'explanations': self.explanations
        }

    @classmethod
    def from_dict(cls, rubric_dict: RubricDict) -> Rubric:
        """Returns a Rubric domain object from a dict.

        Args:
            rubric_dict: dict. The dict representation of Rubric object.

        Returns:
            Rubric. The corresponding Rubric domain object.
        """
        rubric = cls(
            rubric_dict['difficulty'], rubric_dict['explanations'])

        return rubric

    def validate(self) -> None:
        """Validates various properties of the Rubric object.

        Raises:
            ValidationError. One or more attributes of the rubric are
                invalid.
        """
        if not isinstance(self.difficulty, str):
            raise utils.ValidationError(
                'Expected difficulty to be a string, received %s' %
                self.difficulty)
        if self.difficulty not in constants.SKILL_DIFFICULTIES:
            raise utils.ValidationError(
                'Invalid difficulty received for rubric: %s' % self.difficulty)

        if not isinstance(self.explanations, list):
            raise utils.ValidationError(
                'Expected explanations to be a list, received %s' %
                self.explanations)

        for explanation in self.explanations:
            if not isinstance(explanation, str):
                raise utils.ValidationError(
                    'Expected each explanation to be a string, received %s' %
                    explanation)

        if len(self.explanations) > 10:
            raise utils.ValidationError(
                'Expected number of explanations to be less than or equal '
                'to 10, received %d' % len(self.explanations))

        for explanation in self.explanations:
            if len(explanation) > 300:
                raise utils.ValidationError(
                    'Explanation should be less than or equal to 300 chars, '
                    'received %d chars' % len(explanation))
        if (
                self.difficulty == constants.SKILL_DIFFICULTIES[1] and
                len(self.explanations) == 0
        ):
            raise utils.ValidationError(
                'Expected at least one explanation in medium level rubrics')


class WorkedExampleDict(TypedDict):
    """Dictionary representing the WorkedExample object."""

    question: state_domain.SubtitledHtmlDict
    explanation: state_domain.SubtitledHtmlDict


class WorkedExample:
    """Domain object for representing the worked_example dict."""

    def __init__(
        self,
        question: state_domain.SubtitledHtml,
        explanation: state_domain.SubtitledHtml
    ) -> None:
        """Constructs a WorkedExample domain object.

        Args:
            question: SubtitledHtml. The example question.
            explanation: SubtitledHtml. The explanation for the above example
                question.
        """
        self.question = question
        self.explanation = explanation

    def validate(self) -> None:
        """Validates various properties of the WorkedExample object.

        Raises:
            ValidationError. One or more attributes of the worked example are
                invalid.
        """
        if not isinstance(self.question, state_domain.SubtitledHtml):
            raise utils.ValidationError(
                'Expected example question to be a SubtitledHtml object, '
                'received %s' % self.question)
        self.question.validate()
        if not isinstance(self.explanation, state_domain.SubtitledHtml):
            raise utils.ValidationError(
                'Expected example explanation to be a SubtitledHtml object, '
                'received %s' % self.question)
        self.explanation.validate()

    def to_dict(self) -> WorkedExampleDict:
        """Returns a dict representing this WorkedExample domain object.

        Returns:
            dict. A dict, mapping all fields of WorkedExample instance.
        """
        return {
            'question': self.question.to_dict(),
            'explanation': self.explanation.to_dict()
        }

    @classmethod
    def from_dict(cls, worked_example_dict: WorkedExampleDict) -> WorkedExample:
        """Return a WorkedExample domain object from a dict.

        Args:
            worked_example_dict: dict. The dict representation of
                WorkedExample object.

        Returns:
            WorkedExample. The corresponding WorkedExample domain object.
        """
        worked_example = cls(
            state_domain.SubtitledHtml(
                worked_example_dict['question']['content_id'],
                worked_example_dict['question']['html']),
            state_domain.SubtitledHtml(
                worked_example_dict['explanation']['content_id'],
                worked_example_dict['explanation']['html'])
        )

        return worked_example


class SkillContentsDict(TypedDict):
    """Dictionary representing the SkillContents object."""

    explanation: state_domain.SubtitledHtmlDict
    worked_examples: List[WorkedExampleDict]
    recorded_voiceovers: state_domain.RecordedVoiceoversDict
    written_translations: translation_domain.WrittenTranslationsDict


class VersionedSkillContentsDict(TypedDict):
    """Dictionary representing the versioned SkillContents object."""

    schema_version: int
    skill_contents: SkillContentsDict


class SkillContents:
    """Domain object representing the skill_contents dict."""

    def __init__(
        self,
        explanation: state_domain.SubtitledHtml,
        worked_examples: List[WorkedExample],
        recorded_voiceovers: state_domain.RecordedVoiceovers,
        written_translations: translation_domain.WrittenTranslations
    ) -> None:
        """Constructs a SkillContents domain object.

        Args:
            explanation: SubtitledHtml. An explanation on how to apply the
                skill.
            worked_examples: list(WorkedExample). A list of worked examples
                for the skill. Each element should be a WorkedExample object.
            recorded_voiceovers: RecordedVoiceovers. The recorded voiceovers for
                the skill contents and their translations in different
                languages.
            written_translations: WrittenTranslations. A text translation of
                the skill contents.
        """
        self.explanation = explanation
        self.worked_examples = worked_examples
        self.recorded_voiceovers = recorded_voiceovers
        self.written_translations = written_translations

    def validate(self) -> None:
        """Validates various properties of the SkillContents object.

        Raises:
            ValidationError. One or more attributes of skill contents are
                invalid.
        """
        available_content_ids = set([])
        if not isinstance(self.explanation, state_domain.SubtitledHtml):
            raise utils.ValidationError(
                'Expected skill explanation to be a SubtitledHtml object, '
                'received %s' % self.explanation)
        self.explanation.validate()
        available_content_ids.add(self.explanation.content_id)
        if not isinstance(self.worked_examples, list):
            raise utils.ValidationError(
                'Expected worked examples to be a list, received %s' %
                self.worked_examples)
        for example in self.worked_examples:
            if not isinstance(example, WorkedExample):
                raise utils.ValidationError(
                    'Expected worked example to be a WorkedExample object, '
                    'received %s' % example)
            example.validate()
            if example.question.content_id in available_content_ids:
                raise utils.ValidationError(
                    'Found a duplicate content id %s'
                    % example.question.content_id)
            if example.explanation.content_id in available_content_ids:
                raise utils.ValidationError(
                    'Found a duplicate content id %s'
                    % example.explanation.content_id)
            available_content_ids.add(example.question.content_id)
            available_content_ids.add(example.explanation.content_id)

        self.recorded_voiceovers.validate(list(available_content_ids))
        self.written_translations.validate(list(available_content_ids))

    def to_dict(self) -> SkillContentsDict:
        """Returns a dict representing this SkillContents domain object.

        Returns:
            dict. A dict, mapping all fields of SkillContents instance.
        """
        return {
            'explanation': self.explanation.to_dict(),
            'worked_examples': [worked_example.to_dict()
                                for worked_example in self.worked_examples],
            'recorded_voiceovers': self.recorded_voiceovers.to_dict(),
            'written_translations': self.written_translations.to_dict()
        }

    @classmethod
    def from_dict(cls, skill_contents_dict: SkillContentsDict) -> SkillContents:
        """Return a SkillContents domain object from a dict.

        Args:
            skill_contents_dict: dict. The dict representation of
                SkillContents object.

        Returns:
            SkillContents. The corresponding SkillContents domain object.
        """
        skill_contents = cls(
            state_domain.SubtitledHtml(
                skill_contents_dict['explanation']['content_id'],
                skill_contents_dict['explanation']['html']),
            [WorkedExample.from_dict(example)
             for example in skill_contents_dict['worked_examples']],
            state_domain.RecordedVoiceovers.from_dict(skill_contents_dict[
                'recorded_voiceovers']),
            translation_domain.WrittenTranslations.from_dict(
                skill_contents_dict['written_translations'])
        )

        return skill_contents


class SkillDict(TypedDict):
    """Dictionary representing the Skill object."""

    id: str
    description: str
    misconceptions: List[MisconceptionDict]
    rubrics: List[RubricDict]
    skill_contents: SkillContentsDict
    misconceptions_schema_version: int
    rubric_schema_version: int
    skill_contents_schema_version: int
    language_code: str
    version: int
    next_misconception_id: int
    superseding_skill_id: Optional[str]
    all_questions_merged: bool
    prerequisite_skill_ids: List[str]


class SerializableSkillDict(SkillDict):
    """Dictionary representing the serializable Skill object."""

    created_on: str
    last_updated: str


class Skill:
    """Domain object for an Oppia Skill."""

    def __init__(
        self,
        skill_id: str,
        description: str,
        misconceptions: List[Misconception],
        rubrics: List[Rubric],
        skill_contents: SkillContents,
        misconceptions_schema_version: int,
        rubric_schema_version: int,
        skill_contents_schema_version: int,
        language_code: str,
        version: int,
        next_misconception_id: int,
        superseding_skill_id: Optional[str],
        all_questions_merged: bool,
        prerequisite_skill_ids: List[str],
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a Skill domain object.

        Args:
            skill_id: str. The unique ID of the skill.
            description: str. Describes the observable behaviour of the skill.
            misconceptions: list(Misconception). The list of misconceptions
                associated with the skill.
            rubrics: list(Rubric). The list of rubrics that explain each
                difficulty level of a skill.
            skill_contents: SkillContents. The object representing the contents
                of the skill.
            misconceptions_schema_version: int. The schema version for the
                misconceptions object.
            rubric_schema_version: int. The schema version for the
                rubric object.
            skill_contents_schema_version: int. The schema version for the
                skill_contents object.
            language_code: str. The ISO 639-1 code for the language this
                skill is written in.
            version: int. The version of the skill.
            next_misconception_id: int. The misconception id to be used by
                the next misconception added.
            superseding_skill_id: str|None. Skill ID of the skill we
                merge this skill into. This is non null only if we indicate
                that this skill is a duplicate and needs to be merged into
                another one.
            all_questions_merged: bool. Flag that indicates if all
                questions are moved from this skill to the superseding skill.
            prerequisite_skill_ids: list(str). The prerequisite skill IDs for
                the skill.
            created_on: datetime.datetime. Date and time when the skill is
                created.
            last_updated: datetime.datetime. Date and time when the
                skill was last updated.
        """
        self.id = skill_id
        self.description = description
        self.misconceptions = misconceptions
        self.skill_contents = skill_contents
        self.misconceptions_schema_version = misconceptions_schema_version
        self.rubric_schema_version = rubric_schema_version
        self.skill_contents_schema_version = skill_contents_schema_version
        self.language_code = language_code
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version
        self.rubrics = rubrics
        self.next_misconception_id = next_misconception_id
        self.superseding_skill_id = superseding_skill_id
        self.all_questions_merged = all_questions_merged
        self.prerequisite_skill_ids = prerequisite_skill_ids

    @classmethod
    def require_valid_skill_id(cls, skill_id: str) -> None:
        """Checks whether the skill id is a valid one.

        Args:
            skill_id: str. The skill id to validate.
        """
        if not isinstance(skill_id, str):
            raise utils.ValidationError('Skill id should be a string.')

        if len(skill_id) != 12:
            raise utils.ValidationError('Invalid skill id.')

    @classmethod
    def require_valid_description(cls, description: str) -> None:
        """Checks whether the description of the skill is a valid one.

        Args:
            description: str. The description to validate.
        """
        if not isinstance(description, str):
            raise utils.ValidationError('Description should be a string.')

        if description == '':
            raise utils.ValidationError('Description field should not be empty')

        description_length_limit = (
            android_validation_constants.MAX_CHARS_IN_SKILL_DESCRIPTION)
        if len(description) > description_length_limit:
            raise utils.ValidationError(
                'Skill description should be less than %d chars, received %s'
                % (description_length_limit, description))

    def validate(self) -> None:
        """Validates various properties of the Skill object.

        Raises:
            ValidationError. One or more attributes of skill are invalid.
        """
        self.require_valid_description(self.description)

        Misconception.require_valid_misconception_id(self.next_misconception_id)

        if not isinstance(self.misconceptions_schema_version, int):
            raise utils.ValidationError(
                'Expected misconceptions schema version to be an integer, '
                'received %s' % self.misconceptions_schema_version)
        if (
                self.misconceptions_schema_version !=
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected misconceptions schema version to be %s, received %s'
                % (
                    feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
                    self.misconceptions_schema_version)
            )

        if not isinstance(self.rubric_schema_version, int):
            raise utils.ValidationError(
                'Expected rubric schema version to be an integer, '
                'received %s' % self.rubric_schema_version)
        if (
                self.rubric_schema_version !=
                feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected rubric schema version to be %s, received %s'
                % (
                    feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
                    self.rubric_schema_version)
            )

        if not isinstance(self.skill_contents_schema_version, int):
            raise utils.ValidationError(
                'Expected skill contents schema version to be an integer, '
                'received %s' % self.skill_contents_schema_version)
        if (
                self.skill_contents_schema_version !=
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected skill contents schema version to be %s, received %s'
                % (
                    feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
                    self.skill_contents_schema_version)
            )

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.skill_contents, SkillContents):
            raise utils.ValidationError(
                'Expected skill_contents to be a SkillContents object, '
                'received %s' % self.skill_contents)
        self.skill_contents.validate()

        if not isinstance(self.rubrics, list):
            raise utils.ValidationError(
                'Expected rubrics to be a list, '
                'received %s' % self.skill_contents)

        difficulties_list = []
        for rubric in self.rubrics:
            if not isinstance(rubric, Rubric):
                raise utils.ValidationError(
                    'Expected each rubric to be a Rubric '
                    'object, received %s' % rubric)
            if rubric.difficulty in difficulties_list:
                raise utils.ValidationError(
                    'Duplicate rubric found for: %s' % rubric.difficulty)
            difficulties_list.append(rubric.difficulty)
            rubric.validate()

        if len(difficulties_list) != 3:
            raise utils.ValidationError(
                'All 3 difficulties should be addressed in rubrics')

        if difficulties_list != constants.SKILL_DIFFICULTIES:
            raise utils.ValidationError(
                'The difficulties should be ordered as follows [%s, %s, %s]'
                % (
                    constants.SKILL_DIFFICULTIES[0],
                    constants.SKILL_DIFFICULTIES[1],
                    constants.SKILL_DIFFICULTIES[2]))

        if not isinstance(self.misconceptions, list):
            raise utils.ValidationError(
                'Expected misconceptions to be a list, '
                'received %s' % self.misconceptions)

        if not isinstance(self.prerequisite_skill_ids, list):
            raise utils.ValidationError(
                'Expected prerequisite_skill_ids to be a list, '
                'received %s' % self.prerequisite_skill_ids)

        for skill_id in self.prerequisite_skill_ids:
            if not isinstance(skill_id, str):
                raise utils.ValidationError(
                    'Expected each skill ID to be a string, '
                    'received %s' % skill_id)
        misconception_id_list = []
        for misconception in self.misconceptions:
            if not isinstance(misconception, Misconception):
                raise utils.ValidationError(
                    'Expected each misconception to be a Misconception '
                    'object, received %s' % misconception)
            if misconception.id in misconception_id_list:
                raise utils.ValidationError(
                    'Duplicate misconception ID found: %s' % misconception.id)
            misconception_id_list.append(misconception.id)
            if int(misconception.id) >= int(self.next_misconception_id):
                raise utils.ValidationError(
                    'The misconception with id %s is out of bounds.'
                    % misconception.id)
            misconception.validate()
        if (self.all_questions_merged and
                self.superseding_skill_id is None):
            raise utils.ValidationError(
                'Expected a value for superseding_skill_id when '
                'all_questions_merged is True.')
        if (self.superseding_skill_id is not None and
                self.all_questions_merged is None):
            raise utils.ValidationError(
                'Expected a value for all_questions_merged when '
                'superseding_skill_id is set.')

    def to_dict(self) -> SkillDict:
        """Returns a dict representing this Skill domain object.

        Returns:
            dict. A dict, mapping all fields of Skill instance.
        """
        return {
            'id': self.id,
            'description': self.description,
            'misconceptions': [
                misconception.to_dict()
                for misconception in self.misconceptions],
            'rubrics': [
                rubric.to_dict() for rubric in self.rubrics],
            'skill_contents': self.skill_contents.to_dict(),
            'language_code': self.language_code,
            'misconceptions_schema_version': self.misconceptions_schema_version,
            'rubric_schema_version': self.rubric_schema_version,
            'skill_contents_schema_version': self.skill_contents_schema_version,
            'version': self.version,
            'next_misconception_id': self.next_misconception_id,
            'superseding_skill_id': self.superseding_skill_id,
            'all_questions_merged': self.all_questions_merged,
            'prerequisite_skill_ids': self.prerequisite_skill_ids
        }

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded str encoding all of the information composing
            the object.
        """
        # Here we use MyPy ignore because to_dict() method returns a general
        # dictionary representation of domain object (SkillDict) which
        # does not contain properties like created_on and last_updated but
        # MyPy expects skill_dict, a dictionary which contains all the
        # properties of domain object. That's why we are explicitly changing
        # the type of skill_dict, here which causes MyPy to throw an
        # error. Thus, to silence the error, we added an ignore here.
        skill_dict: SerializableSkillDict = self.to_dict()  # type: ignore[assignment]
        # The only reason we add the version parameter separately is that our
        # yaml encoding/decoding of this object does not handle the version
        # parameter.
        # NOTE: If this changes in the future (i.e the version parameter is
        # added as part of the yaml representation of this object), all YAML
        # files must add a version parameter to their files with the correct
        # version of this object. The line below must then be moved to
        # to_dict().
        skill_dict['version'] = self.version

        if self.created_on:
            skill_dict['created_on'] = utils.convert_naive_datetime_to_string(
                self.created_on)

        if self.last_updated:
            skill_dict['last_updated'] = utils.convert_naive_datetime_to_string(
                self.last_updated)

        return json.dumps(skill_dict)

    @classmethod
    def deserialize(cls, json_string: str) -> Skill:
        """Returns a Skill domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a Skill.
                Only call on strings that were created using serialize().

        Returns:
            Skill. The corresponding Skill domain object.
        """
        skill_dict = json.loads(json_string)
        created_on = (
            utils.convert_string_to_naive_datetime_object(
                skill_dict['created_on'])
            if 'created_on' in skill_dict else None)
        last_updated = (
            utils.convert_string_to_naive_datetime_object(
                skill_dict['last_updated'])
            if 'last_updated' in skill_dict else None)
        skill = cls.from_dict(
            skill_dict,
            skill_version=skill_dict['version'],
            skill_created_on=created_on,
            skill_last_updated=last_updated)

        return skill

    @classmethod
    def from_dict(
        cls,
        skill_dict: SkillDict,
        skill_version: int = 0,
        skill_created_on: Optional[datetime.datetime] = None,
        skill_last_updated: Optional[datetime.datetime] = None
    ) -> Skill:
        """Returns a Skill domain object from a dict.

        Args:
            skill_dict: dict. The dictionary representation of skill
                object.
            skill_version: int. The version of the skill.
            skill_created_on: datetime.datetime. Date and time when the
                skill is created.
            skill_last_updated: datetime.datetime. Date and time when the
                skill was last updated.

        Returns:
            Skill. The corresponding Skill domain object.
        """
        skill = cls(
            skill_dict['id'], skill_dict['description'],
            [
                Misconception.from_dict(misconception_dict)
                for misconception_dict in skill_dict['misconceptions']
            ],
            [
                Rubric.from_dict(rubric_dict)
                for rubric_dict in skill_dict['rubrics']
            ],
            SkillContents.from_dict(
                skill_dict['skill_contents']),
            skill_dict['misconceptions_schema_version'],
            skill_dict['rubric_schema_version'],
            skill_dict['skill_contents_schema_version'],
            skill_dict['language_code'],
            skill_version,
            skill_dict['next_misconception_id'],
            skill_dict['superseding_skill_id'],
            skill_dict['all_questions_merged'],
            skill_dict['prerequisite_skill_ids'],
            skill_created_on,
            skill_last_updated)

        return skill

    @classmethod
    def create_default_skill(
        cls,
        skill_id: str,
        description: str,
        rubrics: List[Rubric]
    ) -> Skill:
        """Returns a skill domain object with default values. This is for
        the frontend where a default blank skill would be shown to the user
        when the skill is created for the first time.

        Args:
            skill_id: str. The unique id of the skill.
            description: str. The initial description for the skill.
            rubrics: list(Rubric). The list of rubrics for the skill.

        Returns:
            Skill. The Skill domain object with the default values.
        """
        explanation_content_id = feconf.DEFAULT_SKILL_EXPLANATION_CONTENT_ID
        skill_contents = SkillContents(
            state_domain.SubtitledHtml(
                explanation_content_id, feconf.DEFAULT_SKILL_EXPLANATION), [],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    explanation_content_id: {}
                }
            }),
            translation_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    explanation_content_id: {}
                }
            }))
        skill_contents.explanation.validate()
        return cls(
            skill_id, description, [], rubrics, skill_contents,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, 0, None, False, [])

    def generate_skill_misconception_id(self, misconception_id: int) -> str:
        """Given a misconception id, it returns the skill-misconception-id.
        It is of the form <skill_id>-<misconception_id>.

        Args:
            misconception_id: int. The id of the misconception.

        Returns:
            str. The format is '<skill_id>-<misconception_id>', where skill_id
            is the skill ID of the misconception and misconception_id is
            the id of the misconception.
        """
        return '%s-%d' % (self.id, misconception_id)

    @classmethod
    def convert_html_fields_in_skill_contents(
        cls,
        skill_contents_dict: SkillContentsDict,
        conversion_fn: Callable[[str], str]
    ) -> SkillContentsDict:
        """Applies a conversion function on all the html strings in a skill
        to migrate them to a desired state.

        Args:
            skill_contents_dict: dict. The dict representation of skill
                contents.
            conversion_fn: function. The conversion function to be applied on
                the skill_contents_dict.

        Returns:
            dict. The converted skill_contents_dict.
        """
        skill_contents_dict['explanation']['html'] = conversion_fn(
            skill_contents_dict['explanation']['html'])

        for value_index, value in enumerate(
                skill_contents_dict['worked_examples']):
            skill_contents_dict['worked_examples'][value_index][
                'question']['html'] = conversion_fn(value['question']['html'])
            skill_contents_dict['worked_examples'][value_index][
                'explanation']['html'] = conversion_fn(
                    value['explanation']['html'])
        return skill_contents_dict

    @classmethod
    def _convert_skill_contents_v1_dict_to_v2_dict(
        cls, skill_contents_dict: SkillContentsDict
    ) -> SkillContentsDict:
        """Converts v1 skill contents to the v2 schema. In the v2 schema,
        the new Math components schema is introduced.

        Args:
            skill_contents_dict: dict. The v1 skill_contents_dict.

        Returns:
            dict. The converted skill_contents_dict.
        """
        return cls.convert_html_fields_in_skill_contents(
            skill_contents_dict,
            html_validation_service.add_math_content_to_math_rte_components)

    @classmethod
    def _convert_skill_contents_v2_dict_to_v3_dict(
        cls, skill_contents_dict: SkillContentsDict
    ) -> SkillContentsDict:
        """Converts v2 skill contents to the v3 schema. The v3 schema
        deprecates oppia-noninteractive-svgdiagram tag and converts existing
        occurences of it to oppia-noninteractive-image tag.

        Args:
            skill_contents_dict: dict. The v1 skill_contents_dict.

        Returns:
            dict. The converted skill_contents_dict.
        """
        return cls.convert_html_fields_in_skill_contents(
            skill_contents_dict,
            html_validation_service.convert_svg_diagram_tags_to_image_tags)

    @classmethod
    def _convert_skill_contents_v3_dict_to_v4_dict(
        cls, skill_contents_dict: SkillContentsDict
    ) -> SkillContentsDict:
        """Converts v3 skill contents to the v4 schema. The v4 schema
        fixes HTML encoding issues.

        Args:
            skill_contents_dict: dict. The v3 skill_contents_dict.

        Returns:
            dict. The converted skill_contents_dict.
        """
        return cls.convert_html_fields_in_skill_contents(
            skill_contents_dict,
            html_validation_service.fix_incorrectly_encoded_chars)

    @classmethod
    def update_skill_contents_from_model(
        cls,
        versioned_skill_contents: VersionedSkillContentsDict,
        current_version: int
    ) -> None:
        """Converts the skill_contents blob contained in the given
        versioned_skill_contents dict from current_version to
        current_version + 1. Note that the versioned_skill_contents being
        passed in is modified in-place.

        Args:
            versioned_skill_contents: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    skill_contents dict.
                - skill_contents: dict. The dict comprising the skill
                    contents.
            current_version: int. The current schema version of skill_contents.
        """
        versioned_skill_contents['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_skill_contents_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))
        versioned_skill_contents['skill_contents'] = conversion_fn(
            versioned_skill_contents['skill_contents'])

    @classmethod
    def update_misconceptions_from_model(
        cls,
        versioned_misconceptions: VersionedMisconceptionDict,
        current_version: int
    ) -> None:
        """Converts the misconceptions blob contained in the given
        versioned_misconceptions dict from current_version to
        current_version + 1. Note that the versioned_misconceptions being
        passed in is modified in-place.

        Args:
            versioned_misconceptions: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    misconceptions dict.
                - misconceptions: list(dict). The list of dicts comprising the
                    misconceptions of the skill.
            current_version: int. The current schema version of misconceptions.
        """
        versioned_misconceptions['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_misconception_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))

        updated_misconceptions = []
        for misconception in versioned_misconceptions['misconceptions']:
            updated_misconceptions.append(conversion_fn(misconception))

        versioned_misconceptions['misconceptions'] = updated_misconceptions

    @classmethod
    def _convert_misconception_v1_dict_to_v2_dict(
        cls, misconception_dict: MisconceptionDict
    ) -> MisconceptionDict:
        """Converts v1 misconception schema to the v2 schema. In the v2 schema,
        the field must_be_addressed has been added.

        Args:
            misconception_dict: dict. The v1 misconception dict.

        Returns:
            dict. The converted misconception_dict.
        """
        misconception_dict['must_be_addressed'] = True
        return misconception_dict

    @classmethod
    def _convert_misconception_v2_dict_to_v3_dict(
        cls, misconception_dict: MisconceptionDict
    ) -> MisconceptionDict:
        """Converts v2 misconception schema to the v3 schema. In the v3 schema,
        the new Math components schema is introduced.

        Args:
            misconception_dict: dict. The v2 misconception dict.

        Returns:
            dict. The converted misconception_dict.
        """
        misconception_dict['notes'] = (
            html_validation_service.add_math_content_to_math_rte_components(
                misconception_dict['notes']))
        misconception_dict['feedback'] = (
            html_validation_service.add_math_content_to_math_rte_components(
                misconception_dict['feedback']))
        return misconception_dict

    @classmethod
    def _convert_misconception_v3_dict_to_v4_dict(
        cls, misconception_dict: MisconceptionDict
    ) -> MisconceptionDict:
        """Converts v3 misconception schema to the v4 schema. The v4 schema
        deprecates oppia-noninteractive-svgdiagram tag and converts existing
        occurences of it to oppia-noninteractive-image tag.

        Args:
            misconception_dict: dict. The v3 misconception dict.

        Returns:
            dict. The converted misconception_dict.
        """
        misconception_dict['notes'] = (
            html_validation_service.convert_svg_diagram_tags_to_image_tags(
                misconception_dict['notes']))
        misconception_dict['feedback'] = (
            html_validation_service.convert_svg_diagram_tags_to_image_tags(
                misconception_dict['feedback']))
        return misconception_dict

    @classmethod
    def _convert_misconception_v4_dict_to_v5_dict(
        cls, misconception_dict: MisconceptionDict
    ) -> MisconceptionDict:
        """Converts v4 misconception schema to the v5 schema. The v5 schema
        fixes HTML encoding issues.

        Args:
            misconception_dict: dict. The v4 misconception dict.

        Returns:
            dict. The converted misconception_dict.
        """
        misconception_dict['notes'] = (
            html_validation_service.fix_incorrectly_encoded_chars(
                misconception_dict['notes']))
        misconception_dict['feedback'] = (
            html_validation_service.fix_incorrectly_encoded_chars(
                misconception_dict['feedback']))
        return misconception_dict

    @classmethod
    def _convert_rubric_v1_dict_to_v2_dict(
        cls, rubric_dict: RubricDict
    ) -> RubricDict:
        """Converts v1 rubric schema to the v2 schema. In the v2 schema,
        multiple explanations have been added for each difficulty.

        Args:
            rubric_dict: dict. The v1 rubric dict.

        Returns:
            dict. The converted rubric_dict.
        """
        # Here we use MyPy ignore because in convert functions, we allow less
        # strict typing because here we are working with previous versions of
        # the domain object and in previous versions of the domain object there
        # are some fields that are discontinued in the latest domain object
        # (eg. explanation). So, while accessing these discontinued fields MyPy
        # throws an error. Thus, to avoid the error, we used ignore here.
        explanation = rubric_dict['explanation']  # type: ignore[misc]
        # Here we use MyPy ignore because MyPy doesn't allow key deletion from
        # TypedDict.
        del rubric_dict['explanation']  # type: ignore[misc]
        rubric_dict['explanations'] = [explanation]
        return rubric_dict

    @classmethod
    def _convert_rubric_v2_dict_to_v3_dict(
        cls, rubric_dict: RubricDict
    ) -> RubricDict:
        """Converts v2 rubric schema to the v3 schema. In the v3 schema,
        the new Math components schema is introduced.

        Args:
            rubric_dict: dict. The v2 rubric dict.

        Returns:
            dict. The converted rubric_dict.
        """
        for explanation_index, explanation in enumerate(
                rubric_dict['explanations']):
            rubric_dict['explanations'][explanation_index] = (
                html_validation_service.add_math_content_to_math_rte_components(
                    explanation))
        return rubric_dict

    @classmethod
    def _convert_rubric_v3_dict_to_v4_dict(
        cls, rubric_dict: RubricDict
    ) -> RubricDict:
        """Converts v3 rubric schema to the v4 schema. The v4 schema
        deprecates oppia-noninteractive-svgdiagram tag and converts existing
        occurences of it to oppia-noninteractive-image tag.

        Args:
            rubric_dict: dict. The v2 rubric dict.

        Returns:
            dict. The converted rubric_dict.
        """
        for explanation_index, explanation in enumerate(
                rubric_dict['explanations']):
            rubric_dict['explanations'][explanation_index] = (
                html_validation_service.convert_svg_diagram_tags_to_image_tags(
                    explanation))
        return rubric_dict

    @classmethod
    def _convert_rubric_v4_dict_to_v5_dict(
        cls, rubric_dict: RubricDict
    ) -> RubricDict:
        """Converts v4 rubric schema to the v5 schema. The v4 schema
        fixes HTML encoding issues.

        Args:
            rubric_dict: dict. The v4 rubric dict.

        Returns:
            dict. The converted rubric_dict.
        """
        for explanation_index, explanation in enumerate(
                rubric_dict['explanations']):
            rubric_dict['explanations'][explanation_index] = (
                html_validation_service.fix_incorrectly_encoded_chars(
                    explanation))
        return rubric_dict

    @classmethod
    def update_rubrics_from_model(
        cls,
        versioned_rubrics: VersionedRubricDict,
        current_version: int
    ) -> None:
        """Converts the rubrics blob contained in the given
        versioned_rubrics dict from current_version to
        current_version + 1. Note that the versioned_rubrics being
        passed in is modified in-place.

        Args:
            versioned_rubrics: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    rubrics dict.
                - rubrics: list(dict). The list of dicts comprising the
                    rubrics of the skill.
            current_version: int. The current schema version of rubrics.
        """
        versioned_rubrics['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_rubric_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))

        updated_rubrics = []
        for rubric in versioned_rubrics['rubrics']:
            updated_rubrics.append(conversion_fn(rubric))

        versioned_rubrics['rubrics'] = updated_rubrics

    def get_all_html_content_strings(self) -> List[str]:
        """Returns all html strings that are part of the skill
        (or any of its subcomponents).

        Returns:
            list(str). The list of html contents.
        """
        html_content_strings = [self.skill_contents.explanation.html]

        for rubric in self.rubrics:
            for explanation in rubric.explanations:
                html_content_strings.append(explanation)

        for example in self.skill_contents.worked_examples:
            html_content_strings.append(example.question.html)
            html_content_strings.append(example.explanation.html)

        for misconception in self.misconceptions:
            html_content_strings.append(misconception.notes)
            html_content_strings.append(misconception.feedback)

        return html_content_strings

    def update_description(self, description: str) -> None:
        """Updates the description of the skill.

        Args:
            description: str. The new description of the skill.
        """
        self.description = description

    def update_language_code(self, language_code: str) -> None:
        """Updates the language code of the skill.

        Args:
            language_code: str. The new language code of the skill.
        """
        self.language_code = language_code

    def update_superseding_skill_id(self, superseding_skill_id: str) -> None:
        """Updates the superseding skill ID of the skill.

        Args:
            superseding_skill_id: str. ID of the skill that supersedes this one.
        """
        self.superseding_skill_id = superseding_skill_id

    def record_that_all_questions_are_merged(
        self, all_questions_merged: bool
    ) -> None:
        """Updates the flag value which indicates if all questions are merged.

        Args:
            all_questions_merged: bool. Flag indicating if all questions are
                merged to the superseding skill.
        """
        self.all_questions_merged = all_questions_merged

    def update_explanation(
        self, explanation: state_domain.SubtitledHtml
    ) -> None:
        """Updates the explanation of the skill.

        Args:
            explanation: SubtitledHtml. The new explanation of the skill.
        """
        old_content_ids = []
        if self.skill_contents.explanation:
            old_content_ids = [self.skill_contents.explanation.content_id]

        self.skill_contents.explanation = explanation

        new_content_ids = [self.skill_contents.explanation.content_id]
        self._update_content_ids_in_assets(old_content_ids, new_content_ids)

    def update_worked_examples(
        self, worked_examples: List[WorkedExample]
    ) -> None:
        """Updates the worked examples list of the skill by performing a copy
        of the provided list.

        Args:
            worked_examples: list(WorkedExample). The new worked examples of
                the skill.
        """
        old_content_ids = [
            example_field.content_id
            for example in self.skill_contents.worked_examples
            for example_field in (example.question, example.explanation)]

        self.skill_contents.worked_examples = list(worked_examples)

        new_content_ids = [
            example_field.content_id
            for example in self.skill_contents.worked_examples
            for example_field in (example.question, example.explanation)]

        self._update_content_ids_in_assets(old_content_ids, new_content_ids)

    def _update_content_ids_in_assets(
        self,
        old_ids_list: List[str],
        new_ids_list: List[str]
    ) -> None:
        """Adds or deletes content ids in recorded_voiceovers and
        written_translations.

        Args:
            old_ids_list: list(str). A list of content ids present earlier
                in worked_examples.
                state.
            new_ids_list: list(str). A list of content ids currently present
                in worked_examples.
        """
        content_ids_to_delete = set(old_ids_list) - set(new_ids_list)
        content_ids_to_add = set(new_ids_list) - set(old_ids_list)
        written_translations = self.skill_contents.written_translations
        recorded_voiceovers = self.skill_contents.recorded_voiceovers

        for content_id in content_ids_to_delete:
            recorded_voiceovers.delete_content_id_for_voiceover(content_id)
            written_translations.delete_content_id_for_translation(
                content_id)

        for content_id in content_ids_to_add:
            recorded_voiceovers.add_content_id_for_voiceover(content_id)
            written_translations.add_content_id_for_translation(content_id)

    def _find_misconception_index(self, misconception_id: int) -> Optional[int]:
        """Returns the index of the misconception with the given misconception
        id, or None if it is not in the misconceptions list.

        Args:
            misconception_id: int. The id of the misconception.

        Returns:
            int or None. The index of the corresponding misconception, or None
            if there is no such misconception.
        """
        for ind, misconception in enumerate(self.misconceptions):
            if misconception.id == misconception_id:
                return ind
        return None

    def add_misconception(self, misconception: Misconception) -> None:
        """Adds a new misconception to the skill.

        Args:
            misconception: Misconception. The misconception to be added.
        """

        self.misconceptions.append(misconception)
        self.next_misconception_id = self.get_incremented_misconception_id(
            misconception.id)

    def _find_prerequisite_skill_id_index(
        self, skill_id_to_find: str
    ) -> Optional[int]:
        """Returns the index of the skill_id in the prerequisite_skill_ids
        array.

        Args:
            skill_id_to_find: str. The skill ID to search for.

        Returns:
            int|None. The index of the skill_id, if it exists or None.
        """
        for ind, skill_id in enumerate(self.prerequisite_skill_ids):
            if skill_id == skill_id_to_find:
                return ind
        return None

    def add_prerequisite_skill(self, skill_id: str) -> None:
        """Adds a prerequisite skill to the skill.

        Args:
            skill_id: str. The skill ID to add.

        Raises:
            ValueError. The skill is already a prerequisite skill.
        """
        if self._find_prerequisite_skill_id_index(skill_id) is not None:
            raise ValueError('The skill is already a prerequisite skill.')
        self.prerequisite_skill_ids.append(skill_id)

    def delete_prerequisite_skill(self, skill_id: str) -> None:
        """Removes a prerequisite skill from the skill.

        Args:
            skill_id: str. The skill ID to remove.

        Raises:
            ValueError. The skill to remove is not a prerequisite skill.
        """
        index = self._find_prerequisite_skill_id_index(skill_id)
        if index is None:
            raise ValueError('The skill to remove is not a prerequisite skill.')
        del self.prerequisite_skill_ids[index]

    def update_rubric(
        self, difficulty: str, explanations: List[str]
    ) -> None:
        """Adds or updates the rubric of the given difficulty.

        Args:
            difficulty: str. The difficulty of the rubric.
            explanations: list(str). The explanations for the rubric.

        Raises:
            ValueError. No rubric for given difficulty.
        """
        for rubric in self.rubrics:
            if rubric.difficulty == difficulty:
                rubric.explanations = copy.deepcopy(explanations)
                return
        raise ValueError(
            'There is no rubric for the given difficulty.')

    def get_incremented_misconception_id(self, misconception_id: int) -> int:
        """Returns the incremented misconception id.

        Args:
            misconception_id: int. The id of the misconception to be
                incremented.

        Returns:
            int. The incremented misconception id.
        """
        return misconception_id + 1

    def delete_misconception(self, misconception_id: int) -> None:
        """Removes a misconception with the given id.

        Args:
            misconception_id: int. The id of the misconception to be removed.

        Raises:
            ValueError. There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        del self.misconceptions[index]

    def update_misconception_name(
        self, misconception_id: int, name: str
    ) -> None:
        """Updates the name of the misconception with the given id.

        Args:
            misconception_id: int. The id of the misconception to be edited.
            name: str. The new name of the misconception.

        Raises:
            ValueError. There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].name = name

    def update_misconception_must_be_addressed(
        self, misconception_id: int, must_be_addressed: bool
    ) -> None:
        """Updates the must_be_addressed value of the misconception with the
        given id.

        Args:
            misconception_id: int. The id of the misconception to be edited.
            must_be_addressed: bool. The new must_be_addressed value for the
                misconception.

        Raises:
            ValueError. There is no misconception with the given id.
            ValueError. The must_be_addressed should be bool.
        """
        if not isinstance(must_be_addressed, bool):
            raise ValueError('must_be_addressed should be a bool value.')
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].must_be_addressed = must_be_addressed

    def update_misconception_notes(
        self, misconception_id: int, notes: str
    ) -> None:
        """Updates the notes of the misconception with the given id.

        Args:
            misconception_id: int. The id of the misconception to be edited.
            notes: str. The new notes of the misconception.

        Raises:
            ValueError. There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].notes = notes

    def update_misconception_feedback(
        self, misconception_id: int, feedback: str
    ) -> None:
        """Updates the feedback of the misconception with the given id.

        Args:
            misconception_id: int. The id of the misconception to be edited.
            feedback: str. The html string that corresponds to the new feedback
                of the misconception.

        Raises:
            ValueError. There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].feedback = feedback


class SkillSummaryDict(TypedDict):
    """Dictionary representing the SkillSummary object."""

    id: str
    description: str
    language_code: str
    version: int
    misconception_count: int
    worked_examples_count: int
    skill_model_created_on: float
    skill_model_last_updated: float


class SkillSummary:
    """Domain object for Skill Summary."""

    def __init__(
        self,
        skill_id: str,
        description: str,
        language_code: str,
        version: int,
        misconception_count: int,
        worked_examples_count: int,
        skill_model_created_on: datetime.datetime,
        skill_model_last_updated: datetime.datetime
    ) -> None:
        """Constructs a SkillSummary domain object.

        Args:
            skill_id: str. The unique id of the skill.
            description: str. The short description of the skill.
            language_code: str. The language code of the skill.
            version: int. The version of the skill.
            misconception_count: int. The number of misconceptions associated
                with the skill.
            worked_examples_count: int. The number of worked examples in the
                skill.
            skill_model_created_on: datetime.datetime. Date and time when
                the skill model is created.
            skill_model_last_updated: datetime.datetime. Date and time
                when the skill model was last updated.
        """
        self.id = skill_id
        self.description = description
        self.language_code = language_code
        self.version = version
        self.misconception_count = misconception_count
        self.worked_examples_count = worked_examples_count
        self.skill_model_created_on = skill_model_created_on
        self.skill_model_last_updated = skill_model_last_updated

    def validate(self) -> None:
        """Validates various properties of the Skill Summary object.

        Raises:
            ValidationError. One or more attributes of skill summary are
                invalid.
        """
        if not isinstance(self.description, str):
            raise utils.ValidationError('Description should be a string.')

        if self.description == '':
            raise utils.ValidationError('Description field should not be empty')

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.misconception_count, int):
            raise utils.ValidationError(
                'Expected misconception_count to be an int, '
                'received \'%s\'' % self.misconception_count)

        if self.misconception_count < 0:
            raise utils.ValidationError(
                'Expected misconception_count to be non-negative, '
                'received \'%s\'' % self.misconception_count)

        if not isinstance(self.worked_examples_count, int):
            raise utils.ValidationError(
                'Expected worked_examples_count to be an int, '
                'received \'%s\'' % self.worked_examples_count)

        if self.worked_examples_count < 0:
            raise utils.ValidationError(
                'Expected worked_examples_count to be non-negative, '
                'received \'%s\'' % self.worked_examples_count)

    def to_dict(self) -> SkillSummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this SkillSummary object.
        """
        return {
            'id': self.id,
            'description': self.description,
            'language_code': self.language_code,
            'version': self.version,
            'misconception_count': self.misconception_count,
            'worked_examples_count': self.worked_examples_count,
            'skill_model_created_on': utils.get_time_in_millisecs(
                self.skill_model_created_on),
            'skill_model_last_updated': utils.get_time_in_millisecs(
                self.skill_model_last_updated)
        }


class AugmentedSkillSummaryDict(TypedDict):
    """Dictionary representing the AugmentedSkillSummary object."""

    id: str
    description: str
    language_code: str
    version: int
    misconception_count: int
    worked_examples_count: int
    topic_names: List[str]
    classroom_names: List[str]
    skill_model_created_on: float
    skill_model_last_updated: float


class AugmentedSkillSummary:
    """Domain object for Augmented Skill Summary, which has all the properties
    of SkillSummary along with the topic names to which the skill is assigned
    and the classroom names to which the topics are assigned.
    """

    def __init__(
        self,
        skill_id: str,
        description: str,
        language_code: str,
        version: int,
        misconception_count: int,
        worked_examples_count: int,
        topic_names: List[str],
        classroom_names: List[str],
        skill_model_created_on: datetime.datetime,
        skill_model_last_updated: datetime.datetime
    ) -> None:
        """Constructs an AugmentedSkillSummary domain object.

        Args:
            skill_id: str. The unique id of the skill.
            description: str. The short description of the skill.
            language_code: str. The language code of the skill.
            version: int. The version of the skill.
            misconception_count: int. The number of misconceptions associated
                with the skill.
            worked_examples_count: int. The number of worked examples in the
                skill.
            topic_names: list(str). The names of the topics to which the skill
                is assigned.
            classroom_names: list(str). The names of the classrooms to which the
                skill is assigned.
            skill_model_created_on: datetime.datetime. Date and time when
                the skill model is created.
            skill_model_last_updated: datetime.datetime. Date and time
                when the skill model was last updated.
        """
        self.id = skill_id
        self.description = description
        self.language_code = language_code
        self.version = version
        self.misconception_count = misconception_count
        self.worked_examples_count = worked_examples_count
        self.skill_model_created_on = skill_model_created_on
        self.skill_model_last_updated = skill_model_last_updated
        self.topic_names = topic_names
        self.classroom_names = classroom_names

    def to_dict(self) -> AugmentedSkillSummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this AugmentedSkillSummary object.
        """
        return {
            'id': self.id,
            'description': self.description,
            'language_code': self.language_code,
            'version': self.version,
            'misconception_count': self.misconception_count,
            'worked_examples_count': self.worked_examples_count,
            'topic_names': self.topic_names,
            'classroom_names': self.classroom_names,
            'skill_model_created_on': utils.get_time_in_millisecs(
                self.skill_model_created_on),
            'skill_model_last_updated': utils.get_time_in_millisecs(
                self.skill_model_last_updated)
        }


class TopicAssignmentDict(TypedDict):
    """Dictionary representing the TopicAssignment object."""

    topic_id: str
    topic_name: str
    topic_version: int
    subtopic_id: Optional[int]


class TopicAssignment:
    """Domain object for Topic Assignment, which provides the details of a
    single topic (and, if applicable, the subtopic within that topic) to which
    the skill is assigned.
    """

    def __init__(
        self,
        topic_id: str,
        topic_name: str,
        topic_version: int,
        subtopic_id: Optional[int]
    ) -> None:
        """Constructs a TopicAssignment domain object.

        Args:
            topic_id: str. The unique id of the topic.
            topic_name: str. The name of the topic.
            topic_version: int. The current version of the topic to which the
                skill is assigned.
            subtopic_id: int or None. The id of the subtopic to which the skill
                is assigned, or None if the skill is not assigned to any
                subtopic.
        """
        self.topic_id = topic_id
        self.topic_name = topic_name
        self.topic_version = topic_version
        self.subtopic_id = subtopic_id

    def to_dict(self) -> TopicAssignmentDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this TopicAssignment object.
        """
        return {
            'topic_id': self.topic_id,
            'topic_name': self.topic_name,
            'topic_version': self.topic_version,
            'subtopic_id': self.subtopic_id,
        }


class UserSkillMasteryDict(TypedDict):
    """Dictionary representing the UserSkillMastery object."""

    user_id: str
    skill_id: str
    degree_of_mastery: float


class UserSkillMastery:
    """Domain object for a user's mastery of a particular skill."""

    def __init__(
        self,
        user_id: str,
        skill_id: str,
        degree_of_mastery: float
    ) -> None:
        """Constructs a SkillMastery domain object for a user.

        Args:
            user_id: str. The user id of the user.
            skill_id: str. The id of the skill.
            degree_of_mastery: float. The user's mastery of the
                corresponding skill.
        """
        self.user_id = user_id
        self.skill_id = skill_id
        self.degree_of_mastery = degree_of_mastery

    def to_dict(self) -> UserSkillMasteryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this SkillMastery object.
        """
        return {
            'user_id': self.user_id,
            'skill_id': self.skill_id,
            'degree_of_mastery': self.degree_of_mastery
        }

    @classmethod
    def from_dict(
        cls, skill_mastery_dict: UserSkillMasteryDict
    ) -> UserSkillMastery:
        """Returns a UserSkillMastery domain object from the given dict.

        Args:
            skill_mastery_dict: dict. A dict mapping all the fields of
                UserSkillMastery object.

        Returns:
            SkillMastery. The SkillMastery domain object.
        """
        return cls(
            skill_mastery_dict['user_id'],
            skill_mastery_dict['skill_id'],
            skill_mastery_dict['degree_of_mastery']
        )


class CategorizedSkills:
    """Domain object for representing categorized skills' ids and
    descriptions. Here, 'categorized skill' means that the skill is assigned
    to some topic. If a skill is assigned to a topic but not a
    subtopic, then it is termed as 'uncategorized' which also comes under
    CategorizedSkills because it is at least assigned to a topic.

    Attributes:
        categorized_skills: dict[str, dict[str, list(ShortSkillSummary)].
            The parent dict contains keys as topic names. The children dicts
            contain keys as subtopic titles and values as list of short skill
            summaries. An extra key called 'uncategorized' is present in every
            child dict to represent the skills that are not assigned to any
            subtopic but are assigned to the parent topic.
    """

    def __init__(self) -> None:
        """Constructs a CategorizedSkills domain object."""
        self.categorized_skills: Dict[
            str, Dict[str, List[ShortSkillSummary]]
        ] = {}

    def add_topic(self, topic_name: str, subtopic_titles: List[str]) -> None:
        """Adds a topic to the categorized skills and initializes its
        'uncategorized' and subtopic skills as empty lists.

        Args:
            topic_name: str. The name of the topic.
            subtopic_titles: list(str). The list of subtopic titles of the
                topic.

        Raises:
            ValidationError. Topic name is already added.
        """
        if topic_name in self.categorized_skills:
            raise utils.ValidationError(
                'Topic name \'%s\' is already added.' % topic_name)

        self.categorized_skills[topic_name] = {}
        self.categorized_skills[topic_name]['uncategorized'] = []
        for subtopic_title in subtopic_titles:
            self.categorized_skills[topic_name][subtopic_title] = []

    def add_uncategorized_skill(
        self,
        topic_name: str,
        skill_id: str,
        skill_description: str
    ) -> None:
        """Adds an uncategorized skill id and description for the given topic.

        Args:
            topic_name: str. The name of the topic.
            skill_id: str. The id of the skill.
            skill_description: str. The description of the skill.
        """
        self.require_topic_name_to_be_added(topic_name)
        self.categorized_skills[topic_name]['uncategorized'].append(
            ShortSkillSummary(skill_id, skill_description))

    def add_subtopic_skill(
        self,
        topic_name: str,
        subtopic_title: str,
        skill_id: str,
        skill_description: str
    ) -> None:
        """Adds a subtopic skill id and description for the given topic.

        Args:
            topic_name: str. The name of the topic.
            subtopic_title: str. The title of the subtopic.
            skill_id: str. The id of the skill.
            skill_description: str. The description of the skill.
        """
        self.require_topic_name_to_be_added(topic_name)
        self.require_subtopic_title_to_be_added(topic_name, subtopic_title)
        self.categorized_skills[topic_name][subtopic_title].append(
            ShortSkillSummary(skill_id, skill_description))

    def require_topic_name_to_be_added(self, topic_name: str) -> None:
        """Checks whether the given topic name is valid i.e. added to the
        categorized skills dict.

        Args:
            topic_name: str. The name of the topic.

        Raises:
            ValidationError. Topic name is not added.
        """
        if not topic_name in self.categorized_skills:
            raise utils.ValidationError(
                'Topic name \'%s\' is not added.' % topic_name)

    def require_subtopic_title_to_be_added(
        self, topic_name: str, subtopic_title: str
    ) -> None:
        """Checks whether the given subtopic title is added to the
        categorized skills dict under the given topic name.

        Args:
            topic_name: str. The name of the topic.
            subtopic_title: str. The title of the subtopic.

        Raises:
            ValidationError. Subtopic title is not added.
        """
        if not subtopic_title in self.categorized_skills[topic_name]:
            raise utils.ValidationError(
                'Subtopic title \'%s\' is not added.' % subtopic_title)

    def to_dict(self) -> Dict[str, Dict[str, List[ShortSkillSummaryDict]]]:
        """Returns a dictionary representation of this domain object."""
        categorized_skills_dict = copy.deepcopy(self.categorized_skills)

        result_categorized_skills_dict: Dict[
            str, Dict[str, List[ShortSkillSummaryDict]]
        ] = {}
        for topic_name in categorized_skills_dict:
            # The key 'uncategorized' will also be covered by this loop.
            result_categorized_skills_dict[topic_name] = {}
            for subtopic_title in categorized_skills_dict[topic_name]:
                result_categorized_skills_dict[topic_name][subtopic_title] = [
                    short_skill_summary.to_dict() for short_skill_summary in
                    categorized_skills_dict[topic_name][subtopic_title]
                ]
        return result_categorized_skills_dict


class ShortSkillSummaryDict(TypedDict):
    """Dictionary representing the ShortSkillSummary object."""

    skill_id: str
    skill_description: str


class ShortSkillSummary:
    """Domain object for a short skill summary. It contains the id and
    description of the skill. It is different from the SkillSummary in the
    sense that the latter contains many other properties of the skill along with
    the skill id and description.
    """

    def __init__(self, skill_id: str, skill_description: str) -> None:
        """Constructs a ShortSkillSummary domain object.

        Args:
            skill_id: str. The id of the skill.
            skill_description: str. The description of the skill.
        """
        self.skill_id = skill_id
        self.skill_description = skill_description

    def to_dict(self) -> ShortSkillSummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this ShortSkillSummary object.
        """
        return {
            'skill_id': self.skill_id,
            'skill_description': self.skill_description
        }

    @classmethod
    def from_skill_summary(
        cls, skill_summary: SkillSummary
    ) -> ShortSkillSummary:
        """Returns a ShortSkillSummary domain object from the given skill
        summary.

        Args:
            skill_summary: SkillSummary. The skill summary domain object.

        Returns:
            ShortSkillSummary. The ShortSkillSummary domain object.
        """
        return cls(
            skill_summary.id,
            skill_summary.description)
