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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import json

import android_validation_constants
from constants import constants
from core.domain import change_domain
from core.domain import html_cleaner
from core.domain import html_validation_service
from core.domain import state_domain
import feconf
import python_utils
import utils

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
SKILL_PROPERTY_DESCRIPTION = 'description'
SKILL_PROPERTY_LANGUAGE_CODE = 'language_code'
SKILL_PROPERTY_SUPERSEDING_SKILL_ID = 'superseding_skill_id'
SKILL_PROPERTY_ALL_QUESTIONS_MERGED = 'all_questions_merged'
SKILL_PROPERTY_PREREQUISITE_SKILL_IDS = 'prerequisite_skill_ids'

SKILL_CONTENTS_PROPERTY_EXPLANATION = 'explanation'
SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES = 'worked_examples'

SKILL_MISCONCEPTIONS_PROPERTY_NAME = 'name'
SKILL_MISCONCEPTIONS_PROPERTY_NOTES = 'notes'
SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK = 'feedback'
SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED = 'must_be_addressed'

# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_SKILL_PROPERTY = 'update_skill_property'
CMD_UPDATE_SKILL_CONTENTS_PROPERTY = 'update_skill_contents_property'
CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY = (
    'update_skill_misconceptions_property')

CMD_UPDATE_RUBRICS = 'update_rubrics'

CMD_ADD_SKILL_MISCONCEPTION = 'add_skill_misconception'
CMD_DELETE_SKILL_MISCONCEPTION = 'delete_skill_misconception'

CMD_ADD_PREREQUISITE_SKILL = 'add_prerequisite_skill'
CMD_DELETE_PREREQUISITE_SKILL = 'delete_prerequisite_skill'

CMD_CREATE_NEW = 'create_new'
CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION = (
    'migrate_contents_schema_to_latest_version')
CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION = (
    'migrate_misconceptions_schema_to_latest_version')
CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION = (
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
    SKILL_PROPERTIES = (
        SKILL_PROPERTY_DESCRIPTION, SKILL_PROPERTY_LANGUAGE_CODE,
        SKILL_PROPERTY_SUPERSEDING_SKILL_ID,
        SKILL_PROPERTY_ALL_QUESTIONS_MERGED,
        SKILL_PROPERTY_PREREQUISITE_SKILL_IDS)

    # The allowed list of skill contents properties which can be used in
    # update_skill_contents_property command.
    SKILL_CONTENTS_PROPERTIES = (
        SKILL_CONTENTS_PROPERTY_EXPLANATION,
        SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES)

    # The allowed list of misconceptions properties which can be used in
    # update_skill_misconceptions_property command.
    SKILL_MISCONCEPTIONS_PROPERTIES = (
        SKILL_MISCONCEPTIONS_PROPERTY_NAME,
        SKILL_MISCONCEPTIONS_PROPERTY_NOTES,
        SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK,
        SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED
    )

    ALLOWED_COMMANDS = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': [],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_ADD_SKILL_MISCONCEPTION,
        'required_attribute_names': ['new_misconception_dict'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_DELETE_SKILL_MISCONCEPTION,
        'required_attribute_names': ['misconception_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_ADD_PREREQUISITE_SKILL,
        'required_attribute_names': ['skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_DELETE_PREREQUISITE_SKILL,
        'required_attribute_names': ['skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_UPDATE_RUBRICS,
        'required_attribute_names': ['difficulty', 'explanations'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
        'required_attribute_names': [
            'misconception_id', 'property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SKILL_MISCONCEPTIONS_PROPERTIES}
    }, {
        'name': CMD_UPDATE_SKILL_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SKILL_PROPERTIES}
    }, {
        'name': CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SKILL_CONTENTS_PROPERTIES}
    }, {
        'name': CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }, {
        'name': CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': []
    }]


class Misconception(python_utils.OBJECT):
    """Domain object describing a skill misconception."""

    def __init__(
            self, misconception_id, name, notes, feedback, must_be_addressed):
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

    def to_dict(self):
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
    def from_dict(cls, misconception_dict):
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
    def require_valid_misconception_id(cls, misconception_id):
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

    def validate(self):
        """Validates various properties of the Misconception object.

        Raises:
            ValidationError. One or more attributes of the misconception are
                invalid.
        """
        self.require_valid_misconception_id(self.id)
        if not isinstance(self.name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected misconception name to be a string, received %s' %
                self.name)

        misconception_name_length_limit = (
            android_validation_constants.MAX_CHARS_IN_MISCONCEPTION_NAME)
        if len(self.name) > misconception_name_length_limit:
            raise utils.ValidationError(
                'Misconception name should be less than %d chars, received %s'
                % (misconception_name_length_limit, self.name))

        if not isinstance(self.notes, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected misconception notes to be a string, received %s' %
                self.notes)

        if not isinstance(self.must_be_addressed, bool):
            raise utils.ValidationError(
                'Expected must_be_addressed to be a bool, received %s' %
                self.must_be_addressed)

        if not isinstance(self.feedback, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected misconception feedback to be a string, received %s' %
                self.feedback)


class Rubric(python_utils.OBJECT):
    """Domain object describing a skill rubric."""

    def __init__(self, difficulty, explanations):
        """Initializes a Rubric domain object.

        Args:
            difficulty: str. The question difficulty that this rubric addresses.
            explanations: list(str). The different explanations for the
                corresponding difficulty.
        """
        self.difficulty = difficulty
        self.explanations = [
            html_cleaner.clean(explanation) for explanation in explanations]

    def to_dict(self):
        """Returns a dict representing this Rubric domain object.

        Returns:
            dict. A dict, mapping all fields of Rubric instance.
        """
        return {
            'difficulty': self.difficulty,
            'explanations': self.explanations
        }

    @classmethod
    def from_dict(cls, rubric_dict):
        """Returns a Rubric domain object from a dict.

        Args:
            rubric_dict: dict. The dict representation of Rubric object.

        Returns:
            Rubric. The corresponding Rubric domain object.
        """
        rubric = cls(
            rubric_dict['difficulty'], rubric_dict['explanations'])

        return rubric

    def validate(self):
        """Validates various properties of the Rubric object.

        Raises:
            ValidationError. One or more attributes of the rubric are
                invalid.
        """
        if not isinstance(self.difficulty, python_utils.BASESTRING):
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
            if not isinstance(explanation, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each explanation to be a string, received %s' %
                    explanation)


class WorkedExample(python_utils.OBJECT):
    """Domain object for representing the worked_example dict."""

    def __init__(self, question, explanation):
        """Constructs a WorkedExample domain object.

        Args:
            question: SubtitledHtml. The example question.
            explanation: SubtitledHtml. The explanation for the above example
                question.
        """
        self.question = question
        self.explanation = explanation

    def validate(self):
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

    def to_dict(self):
        """Returns a dict representing this WorkedExample domain object.

        Returns:
            dict. A dict, mapping all fields of WorkedExample instance.
        """
        return {
            'question': self.question.to_dict(),
            'explanation': self.explanation.to_dict()
        }

    @classmethod
    def from_dict(cls, worked_example_dict):
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
        worked_example.question.validate()
        worked_example.explanation.validate()

        return worked_example


class SkillContents(python_utils.OBJECT):
    """Domain object representing the skill_contents dict."""

    def __init__(
            self, explanation, worked_examples, recorded_voiceovers,
            written_translations):
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

    def validate(self):
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

        self.recorded_voiceovers.validate(available_content_ids)
        self.written_translations.validate(available_content_ids)

    def to_dict(self):
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
    def from_dict(cls, skill_contents_dict):
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
            state_domain.WrittenTranslations.from_dict(skill_contents_dict[
                'written_translations'])
        )
        skill_contents.explanation.validate()

        return skill_contents


class Skill(python_utils.OBJECT):
    """Domain object for an Oppia Skill."""

    def __init__(
            self, skill_id, description, misconceptions, rubrics,
            skill_contents, misconceptions_schema_version,
            rubric_schema_version, skill_contents_schema_version,
            language_code, version, next_misconception_id, superseding_skill_id,
            all_questions_merged, prerequisite_skill_ids,
            created_on=None, last_updated=None):
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
    def require_valid_skill_id(cls, skill_id):
        """Checks whether the skill id is a valid one.

        Args:
            skill_id: str. The skill id to validate.
        """
        if not isinstance(skill_id, python_utils.BASESTRING):
            raise utils.ValidationError('Skill id should be a string.')

        if len(skill_id) != 12:
            raise utils.ValidationError('Invalid skill id.')

    @classmethod
    def require_valid_description(cls, description):
        """Checks whether the description of the skill is a valid one.

        Args:
            description: str. The description to validate.
        """
        if not isinstance(description, python_utils.BASESTRING):
            raise utils.ValidationError('Description should be a string.')

        if description == '':
            raise utils.ValidationError('Description field should not be empty')

        description_length_limit = (
            android_validation_constants.MAX_CHARS_IN_SKILL_DESCRIPTION)
        if len(description) > description_length_limit:
            raise utils.ValidationError(
                'Skill description should be less than %d chars, received %s'
                % (description_length_limit, description))

    def validate(self):
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

        if not isinstance(self.language_code, python_utils.BASESTRING):
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
            if not isinstance(skill_id, python_utils.BASESTRING):
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

    def to_dict(self):
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

    def serialize(self):
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded utf-8 string encoding all of the information
            composing the object.
        """
        skill_dict = self.to_dict()
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

        return json.dumps(skill_dict).encode('utf-8')

    @classmethod
    def deserialize(cls, json_string):
        """Returns a Skill domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a Skill. Only call
                on strings that were created using serialize().

        Returns:
            Skill. The corresponding Skill domain object.
        """
        skill_dict = json.loads(json_string.decode('utf-8'))
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
            cls, skill_dict, skill_version=0, skill_created_on=None,
            skill_last_updated=None):
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
    def create_default_skill(cls, skill_id, description, rubrics):
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
            state_domain.WrittenTranslations.from_dict({
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

    def generate_skill_misconception_id(self, misconception_id):
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
    def _convert_skill_contents_v1_dict_to_v2_dict(cls, skill_contents_dict):
        """Converts v1 skill contents to the v2 schema. In the v2 schema,
        the new Math components schema is introduced.

        Args:
            skill_contents_dict: dict. The v1 skill_contents_dict.

        Returns:
            dict. The converted skill_contents_dict.
        """
        skill_contents_dict['explanation']['html'] = (
            html_validation_service.add_math_content_to_math_rte_components(
                skill_contents_dict['explanation']['html']))
        skill_contents_dict['written_translations'] = (
            state_domain.WrittenTranslations.
            convert_html_in_written_translations(
                skill_contents_dict['written_translations'],
                html_validation_service.
                add_math_content_to_math_rte_components))

        for value_index, value in enumerate(
                skill_contents_dict['worked_examples']):
            skill_contents_dict['worked_examples'][value_index][
                'question']['html'] = (
                    html_validation_service.
                    add_math_content_to_math_rte_components(
                        value['question']['html']))
            skill_contents_dict['worked_examples'][value_index][
                'explanation']['html'] = (
                    html_validation_service.
                    add_math_content_to_math_rte_components(
                        value['explanation']['html']))
        return skill_contents_dict

    @classmethod
    def update_skill_contents_from_model(
            cls, versioned_skill_contents, current_version):
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
            cls, versioned_misconceptions, current_version):
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
    def _convert_misconception_v1_dict_to_v2_dict(cls, misconception_dict):
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
    def _convert_misconception_v2_dict_to_v3_dict(cls, misconception_dict):
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
    def _convert_rubric_v1_dict_to_v2_dict(cls, rubric_dict):
        """Converts v1 rubric schema to the v2 schema. In the v2 schema,
        multiple explanations have been added for each difficulty.

        Args:
            rubric_dict: dict. The v1 rubric dict.

        Returns:
            dict. The converted rubric_dict.
        """
        explanation = rubric_dict['explanation']
        del rubric_dict['explanation']
        rubric_dict['explanations'] = [explanation]
        return rubric_dict

    @classmethod
    def _convert_rubric_v2_dict_to_v3_dict(cls, rubric_dict):
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
    def update_rubrics_from_model(cls, versioned_rubrics, current_version):
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

    def get_all_html_content_strings(self):
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

    def update_description(self, description):
        """Updates the description of the skill.

        Args:
            description: str. The new description of the skill.
        """
        self.description = description

    def update_language_code(self, language_code):
        """Updates the language code of the skill.

        Args:
            language_code: str. The new language code of the skill.
        """
        self.language_code = language_code

    def update_superseding_skill_id(self, superseding_skill_id):
        """Updates the superseding skill ID of the skill.

        Args:
            superseding_skill_id: str. ID of the skill that supersedes this one.
        """
        self.superseding_skill_id = superseding_skill_id

    def record_that_all_questions_are_merged(self, all_questions_merged):
        """Updates the flag value which indicates if all questions are merged.

        Args:
            all_questions_merged: bool. Flag indicating if all questions are
                merged to the superseding skill.
        """
        self.all_questions_merged = all_questions_merged

    def update_explanation(self, explanation):
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

    def update_worked_examples(self, worked_examples):
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

    def _update_content_ids_in_assets(self, old_ids_list, new_ids_list):
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

    def _find_misconception_index(self, misconception_id):
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

    def add_misconception(self, misconception):
        """Adds a new misconception to the skill.

        Args:
            misconception: Misconception. The misconception to be added.
        """

        self.misconceptions.append(misconception)
        self.next_misconception_id = self.get_incremented_misconception_id(
            misconception.id)

    def _find_prerequisite_skill_id_index(self, skill_id_to_find):
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

    def add_prerequisite_skill(self, skill_id):
        """Adds a prerequisite skill to the skill.

        Args:
            skill_id: str. The skill ID to add.

        Raises:
            ValueError. The skill is already a prerequisite skill.
        """
        if self._find_prerequisite_skill_id_index(skill_id) is not None:
            raise ValueError('The skill is already a prerequisite skill.')
        self.prerequisite_skill_ids.append(skill_id)

    def delete_prerequisite_skill(self, skill_id):
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

    def update_rubric(self, difficulty, explanations):
        """Adds or updates the rubric of the given difficulty.

        Args:
            difficulty: str. The difficulty of the rubric.
            explanations: list(str). The explanations for the rubric.
        """
        for rubric in self.rubrics:
            if rubric.difficulty == difficulty:
                rubric.explanations = copy.deepcopy(explanations)
                return
        raise ValueError(
            'There is no rubric for the given difficulty.')

    def get_incremented_misconception_id(self, misconception_id):
        """Returns the incremented misconception id.

        Args:
            misconception_id: int. The id of the misconception to be
                incremented.

        Returns:
            int. The incremented misconception id.
        """
        return misconception_id + 1

    def delete_misconception(self, misconception_id):
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

    def update_misconception_name(self, misconception_id, name):
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
            self, misconception_id, must_be_addressed):
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

    def update_misconception_notes(self, misconception_id, notes):
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

    def update_misconception_feedback(self, misconception_id, feedback):
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


class SkillSummary(python_utils.OBJECT):
    """Domain object for Skill Summary."""

    def __init__(
            self, skill_id, description, language_code, version,
            misconception_count, worked_examples_count, skill_model_created_on,
            skill_model_last_updated):
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

    def validate(self):
        """Validates various properties of the Skill Summary object.

        Raises:
            ValidationError. One or more attributes of skill summary are
                invalid.
        """
        if not isinstance(self.description, python_utils.BASESTRING):
            raise utils.ValidationError('Description should be a string.')

        if self.description == '':
            raise utils.ValidationError('Description field should not be empty')

        if not isinstance(self.language_code, python_utils.BASESTRING):
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

    def to_dict(self):
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


class AugmentedSkillSummary(python_utils.OBJECT):
    """Domain object for Augmented Skill Summary, which has all the properties
    of SkillSummary along with the topic names to which the skill is assigned
    and the classroom names to which the topics are assigned.
    """

    def __init__(
            self, skill_id, description, language_code, version,
            misconception_count, worked_examples_count, topic_names,
            classroom_names, skill_model_created_on, skill_model_last_updated):
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

    def to_dict(self):
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


class TopicAssignment(python_utils.OBJECT):
    """Domain object for Topic Assignment, which provides the details of a
    single topic (and, if applicable, the subtopic within that topic) to which
    the skill is assigned.
    """

    def __init__(
            self, topic_id, topic_name, topic_version, subtopic_id):
        """Constructs a TopicAssignment domain object.

        Args:
            topic_id: str. The unique id of the topic.
            topic_name: str. The name of the topic.
            topic_version: int. The current version of the topic to which the
                skill is assigned.
            subtopic_id: str or None. The id of the subtopic to which the skill
                is assigned, or None if the skill is not assigned to any
                subtopic.
        """
        self.topic_id = topic_id
        self.topic_name = topic_name
        self.topic_version = topic_version
        self.subtopic_id = subtopic_id

    def to_dict(self):
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


class UserSkillMastery(python_utils.OBJECT):
    """Domain object for a user's mastery of a particular skill."""

    def __init__(self, user_id, skill_id, degree_of_mastery):
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

    def to_dict(self):
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
    def from_dict(cls, skill_mastery_dict):
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
