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

import copy

from constants import constants
from core.domain import html_cleaner
import feconf
import utils

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
SKILL_PROPERTY_DESCRIPTION = 'description'
SKILL_PROPERTY_LANGUAGE_CODE = 'language_code'

SKILL_CONTENTS_PROPERTY_EXPLANATION = 'explanation'
SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES = 'worked_examples'

SKILL_MISCONCEPTIONS_PROPERTY_NAME = 'name'
SKILL_MISCONCEPTIONS_PROPERTY_NOTES = 'notes'
SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK = 'feedback'

# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_SKILL_PROPERTY = 'update_skill_property'
CMD_UPDATE_SKILL_CONTENTS_PROPERTY = 'update_skill_contents_property'
CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY = (
    'update_skill_misconceptions_property')

CMD_ADD_SKILL_MISCONCEPTION = 'add_skill_misconception'
CMD_DELETE_SKILL_MISCONCEPTION = 'delete_skill_misconception'

CMD_CREATE_NEW = 'create_new'
CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION = (
    'migrate_contents_schema_to_latest_version')
CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION = (
    'migrate_misconceptions_schema_to_latest_version')


class SkillChange(object):
    """Domain object for changes made to skill object."""
    SKILL_PROPERTIES = (
        SKILL_PROPERTY_DESCRIPTION, SKILL_PROPERTY_LANGUAGE_CODE)

    SKILL_CONTENTS_PROPERTIES = (
        SKILL_CONTENTS_PROPERTY_EXPLANATION,
        SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES)

    SKILL_MISCONCEPTIONS_PROPERTIES = (
        SKILL_MISCONCEPTIONS_PROPERTY_NAME,
        SKILL_MISCONCEPTIONS_PROPERTY_NOTES,
        SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK
    )

    OPTIONAL_CMD_ATTRIBUTE_NAMES = [
        'property_name', 'new_value', 'old_value', 'misconception_id'
    ]

    def __init__(self, change_dict):
        """Initialize a SkillChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update_skill_property' (with property_name, new_value
                and old_value)
                - 'update_skill_contents_property' (with property_name,
                new_value and old_value)
                - 'update_skill_misconceptions_property' (with property_name,
                new_value and old_value)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_ADD_SKILL_MISCONCEPTION:
            self.misconception_id = change_dict['id']
        elif self.cmd == CMD_DELETE_SKILL_MISCONCEPTION:
            self.misconception_id = change_dict['id']
        elif self.cmd == CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY:
            if (change_dict['property_name'] not in
                    self.SKILL_MISCONCEPTIONS_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.misconception_id = change_dict['id']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        elif self.cmd == CMD_UPDATE_SKILL_PROPERTY:
            if change_dict['property_name'] not in self.SKILL_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
        elif self.cmd == CMD_UPDATE_SKILL_CONTENTS_PROPERTY:
            if (change_dict['property_name'] not in
                    self.SKILL_CONTENTS_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
        elif self.cmd == CMD_CREATE_NEW:
            return
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing the SkillChange domain object.

        Returns:
            A dict, mapping all fields of SkillChange instance.
        """
        skill_change_dict = {}
        skill_change_dict['cmd'] = self.cmd
        for attribute_name in self.OPTIONAL_CMD_ATTRIBUTE_NAMES:
            if hasattr(self, attribute_name):
                skill_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return skill_change_dict


class Misconception(object):
    """Domain object describing a skill misconception.
    """

    def __init__(
            self, misconception_id, name, notes, feedback):
        """Initializes a Misconception domain object.

        Args:
            misconception_id: str. The unique id of each misconception.
            name: str. The name of the misconception.
            notes: str. General advice for creators about the
                misconception (including examples) and general notes. This
                should be an html string.
            feedback: str. This can auto-populate the feedback field
                when an answer group has been tagged with a misconception. This
                should be an html string.
        """
        self.id = misconception_id
        self.name = name
        self.notes = html_cleaner.clean(notes)
        self.feedback = html_cleaner.clean(feedback)

    def to_dict(self):
        """Returns a dict representing this Misconception domain object.

        Returns:
            A dict, mapping all fields of Misconception instance.
        """
        return {
            'id': self.id,
            'name': self.name,
            'notes': self.notes,
            'feedback': self.feedback
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
            misconception_dict['notes'], misconception_dict['feedback'])

        return misconception

    @classmethod
    def create_default_misconception(cls, misconception_id):
        """Creates a Misconception object with default values.

        Args:
            misconception_id: str. ID of the new misconception.

        Returns:
            Misconception. A misconception object with given id and default
                values for all other fields.
        """
        return cls(
            misconception_id, feconf.DEFAULT_MISCONCEPTION_NAME,
            feconf.DEFAULT_MISCONCEPTION_NOTES,
            feconf.DEFAULT_MISCONCEPTION_FEEDBACK)

    def validate(self):
        """Validates various properties of the Misconception object.

        Raises:
            ValidationError: One or more attributes of the misconception are
            invalid.
        """
        if not isinstance(self.name, basestring):
            raise utils.ValidationError(
                'Expected misconception name to be a string, received %s' %
                self.name)
        if not isinstance(self.notes, basestring):
            raise utils.ValidationError(
                'Expected misconception notes to be a string, received %s' %
                self.notes)
        if not isinstance(self.feedback, basestring):
            raise utils.ValidationError(
                'Expected misconception feedback to be a string, received %s' %
                self.feedback)


class SkillContents(object):
    """Domain object representing the skill_contents dict."""

    def __init__(self, explanation, worked_examples):
        """Constructs a SkillContents domain object.

        Args:
            explanation: str. An explanation on how to apply the skill.
            worked_examples: list(str). A list of worked examples for the skill.
                Each element should be an html string.
        """
        self.explanation = explanation
        self.worked_examples = [
            html_cleaner.clean(example) for example in worked_examples]

    def validate(self):
        """Validates various properties of the SkillContents object.

        Raises:
            ValidationError: One or more attributes of skill contents are
            invalid.
        """
        if not isinstance(self.explanation, basestring):
            raise utils.ValidationError(
                'Expected skill explanation to be a string, received %s' %
                self.explanation)
        if not isinstance(self.worked_examples, list):
            raise utils.ValidationError(
                'Expected worked examples to be a list, received %s' %
                self.worked_examples)
        for example in self.worked_examples:
            if not isinstance(example, basestring):
                raise utils.ValidationError(
                    'Expected each worked example to be a string, received %s' %
                    example)

    def to_dict(self):
        """Returns a dict representing this SkillContents domain object.

        Returns:
            A dict, mapping all fields of SkillContents instance.
        """
        return {
            'explanation': self.explanation,
            'worked_examples': self.worked_examples
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
            skill_contents_dict['explanation'],
            skill_contents_dict['worked_examples']
        )

        return skill_contents


class Skill(object):
    """Domain object for an Oppia Skill."""

    def __init__(
            self, skill_id, description, misconceptions,
            skill_contents, misconceptions_schema_version,
            skill_contents_schema_version, language_code, version,
            created_on=None, last_updated=None):
        """Constructs a Skill domain object.

        Args:
            skill_id: str. The unique ID of the skill.
            description: str. Describes the observable behaviour of the skill.
            misconceptions: list(Misconception). The list of misconceptions
                associated with the skill.
            skill_contents: SkillContents. The object representing the contents
                of the skill.
            misconceptions_schema_version: int. The schema version for the
                misconceptions object.
            skill_contents_schema_version: int. The schema version for the
                skill_contents object.
            language_code: str. The ISO 639-1 code for the language this
                skill is written in.
            version: int. The version of the skill.
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
        self.skill_contents_schema_version = skill_contents_schema_version
        self.language_code = language_code
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version

    @classmethod
    def require_valid_skill_id(cls, skill_id):
        """Checks whether the skill id is a valid one.

        Args:
            skill_id: str. The skill id to validate.
        """
        if not isinstance(skill_id, basestring):
            raise utils.ValidationError('Skill id should be a string.')

        if len(skill_id) != 12:
            raise utils.ValidationError('Invalid skill id.')

    @classmethod
    def require_valid_description(cls, description):
        """Checks whether the description of the skill is a valid one.

        Args:
            description: str. The description to validate.
        """
        if not isinstance(description, basestring):
            raise utils.ValidationError('Description should be a string.')

        if description == '':
            raise utils.ValidationError('Description field should not be empty')

    def validate(self):
        """Validates various properties of the Skill object.

        Raises:
            ValidationError: One or more attributes of skill are invalid.
        """
        self.require_valid_description(self.description)

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

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.skill_contents, SkillContents):
            raise utils.ValidationError(
                'Expected skill_contents to be a SkillContents object, '
                'received %s' % self.skill_contents)
        self.skill_contents.validate()

        if not isinstance(self.misconceptions, list):
            raise utils.ValidationError(
                'Expected misconceptions to be a list, '
                'received %s' % self.skill_contents)
        for misconception in self.misconceptions:
            if not isinstance(misconception, Misconception):
                raise utils.ValidationError(
                    'Expected each misconception to be a Misconception '
                    'object, received %s' % misconception)
            misconception.validate()

    def to_dict(self):
        """Returns a dict representing this Skill domain object.

        Returns:
            A dict, mapping all fields of Skill instance.
        """
        return {
            'id': self.id,
            'description': self.description,
            'misconceptions': [
                misconception.to_dict()
                for misconception in self.misconceptions],
            'skill_contents': self.skill_contents.to_dict(),
            'language_code': self.language_code,
            'misconceptions_schema_version': self.misconceptions_schema_version,
            'skill_contents_schema_version': self.skill_contents_schema_version,
            'version': self.version
        }

    @classmethod
    def create_default_skill(cls, skill_id, description):
        """Returns a skill domain object with default values. This is for
        the frontend where a default blank skill would be shown to the user
        when the skill is created for the first time.

        Args:
            skill_id: str. The unique id of the skill.
            description: str. The initial description for the skill.

        Returns:
            Skill. The Skill domain object with the default values.
        """
        skill_contents = SkillContents(feconf.DEFAULT_SKILL_EXPLANATION, [])
        return cls(
            skill_id, description, [], skill_contents,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0)

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

    def update_explanation(self, explanation):
        """Updates the explanation of the skill.

        Args:
            explanation: str. The new explanation of the skill.
        """
        self.skill_contents.explanation = explanation

    def update_worked_examples(self, worked_examples):
        """Updates the worked examples list of the skill.

        Args:
            worked_examples: list(str). The new worked examples of the skill.
        """
        self.skill_contents.worked_examples = worked_examples

    def _find_misconception_index(self, misconception_id):
        """Returns the index of the misconception with the given misconception
        id, or None if it is not in the misconceptions list.

        Args:
            misconception_id: str. The id of the misconception.

        Returns:
            int or None. The index of the corresponding misconception, or None
                if there is no such misconception.
        """
        for ind, misconception in enumerate(self.misconceptions):
            if misconception.id == misconception_id:
                return ind
        return None

    def add_misconception(self, misconception_id):
        """Adds a new misconception to the skill.

        Args:
            misconception_id: str. The id of the new misconception to be added.
        """
        misconception = Misconception.create_default_misconception(
            misconception_id)
        self.misconceptions.append(misconception)

    def delete_misconception(self, misconception_id):
        """Removes a misconception with the given id.

        Args:
            misconception_id: str. The id of the misconception to be removed.

        Raises:
            ValueError: There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        del self.misconceptions[index]

    def update_misconception_name(self, misconception_id, name):
        """Updates the name of the misconception with the given id.

        Args:
            misconception_id: str. The id of the misconception to be edited.
            name: str. The new name of the misconception.

        Raises:
            ValueError: There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].name = name

    def update_misconception_notes(self, misconception_id, notes):
        """Updates the notes of the misconception with the given id.

        Args:
            misconception_id: str. The id of the misconception to be edited.
            notes: str. The new notes of the misconception.

        Raises:
            ValueError: There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].notes = notes

    def update_misconception_feedback(self, misconception_id, feedback):
        """Updates the feedback of the misconception with the given id.

        Args:
            misconception_id: str. The id of the misconception to be edited.
            feedback: str. The html string that corresponds to the new feedback
                of the misconception.

        Raises:
            ValueError: There is no misconception with the given id.
        """
        index = self._find_misconception_index(misconception_id)
        if index is None:
            raise ValueError(
                'There is no misconception with the given id.')
        self.misconceptions[index].feedback = feedback


class SkillSummary(object):
    """Domain object for Skill Summary."""

    def __init__(
            self, skill_id, description, language_code, version,
            misconception_count, skill_model_created_on,
            skill_model_last_updated):
        """Constructs a SkillSummary domain object.

        Args:
            skill_id: str. The unique id of the skill.
            description: str. The short description of the skill.
            language_code: str. The language code of the skill.
            version: int. The version of the skill.
            misconception_count: int. The number of misconceptions associated
                with the skill.
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
        self.skill_model_created_on = skill_model_created_on
        self.skill_model_last_updated = skill_model_last_updated

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
            'skill_model_created_on': self.skill_model_created_on,
            'skill_model_last_updated': self.skill_model_last_updated
        }
