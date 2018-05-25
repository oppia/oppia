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

from constants import constants
import feconf

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
SKILL_PROPERTY_DESCRIPTION = 'description'
SKILL_PROPERTY_LANGUAGE_CODE = 'language_code'

SKILL_CONTENTS_PROPERTY_EXPLANATION = 'explanation'
SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES = 'worked_examples'

SKILL_MISCONCEPTIONS_PROPERTY_TAG_NAME = 'tag_name'
SKILL_MISCONCEPTIONS_PROPERTY_DESCRIPTION = 'description'
SKILL_MISCONCEPTIONS_PROPERTY_DEFAULT_FEEDBACK = 'default_feedback'

# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_SKILL_PROPERTY = 'update_skill_property'
CMD_UPDATE_SKILL_CONTENTS_PROPERTY = 'update_skill_contents_property'
CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY = (
    'update_skill_misconceptions_property')

CMD_ADD_SKILL_MISCONCEPTION = 'add_skill_misconception'
CMD_DELETE_SKILL_MISCONCEPTION = 'delete_skill_misconception'

CMD_CREATE_NEW = 'create_new'


class SkillChange(object):
    """Domain object for changes made to skill object."""
    SKILL_PROPERTIES = (
        SKILL_PROPERTY_DESCRIPTION, SKILL_PROPERTY_LANGUAGE_CODE)

    SKILL_CONTENTS_PROPERTIES = (
        SKILL_CONTENTS_PROPERTY_EXPLANATION,
        SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES)

    SKILL_MISCONCEPTIONS_PROPERTIES = (
        SKILL_MISCONCEPTIONS_PROPERTY_TAG_NAME,
        SKILL_MISCONCEPTIONS_PROPERTY_DESCRIPTION,
        SKILL_MISCONCEPTIONS_PROPERTY_DEFAULT_FEEDBACK
    )

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
            self.tag_name = change_dict['tag_name']
            self.description = change_dict['description']
            self.default_feedback = change_dict['default_feedback']
        elif self.cmd == CMD_DELETE_SKILL_MISCONCEPTION:
            self.tag_name = change_dict['tag_name']
        elif self.cmd == CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY:
            if (change_dict['property_name'] not in
                    self.SKILL_MISCONCEPTIONS_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.tag_name = change_dict['tag_name']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        elif self.cmd == CMD_UPDATE_SKILL_PROPERTY:
            if change_dict['property_name'] not in self.SKILL_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        elif self.cmd == CMD_UPDATE_SKILL_CONTENTS_PROPERTY:
            if (change_dict['property_name'] not in
                    self.SKILL_CONTENTS_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)


class Misconception(object):
    """Domain object describing a skill misconception.
    """

    def __init__(
            self, tag_name, description, default_feedback):
        """Initializes a Misconception domain object.

        Args:
            tag_name: str. The unique name for each misconception.
            description: str. General advice for creators about the
                misconception (including examples) and general notes.
            default_feedback: str. This can auto-populate the feedback field
                when an answer group has been tagged with a misconception.
        """
        self.tag_name = tag_name
        self.description = description
        self.default_feedback = default_feedback

    def to_dict(self):
        """Returns a dict representing this Misconception domain object.

        Returns:
            A dict, mapping all fields of Misconception instance.
        """
        return {
            'tag_name': self.tag_name,
            'description': self.description,
            'default_feedback': self.default_feedback
        }

    @classmethod
    def from_dict(cls, misconception_dict):
        """Return a Misconception domain object from a dict.

        Args:
            misconception_dict: dict. The dict representation of
                Misconception object.

        Returns:
            Misconception. The corresponding Misconception domain object.
        """
        misconception = cls(
            misconception_dict['tag_name'], misconception_dict['description'],
            misconception_dict['default_feedback'])

        return misconception


class SkillContents(object):
    """Domain object representing the skill_contents dict."""

    def __init__(self, explanation, worked_examples):
        """Constructs a SkillContents domain object.

        Args:
            explanation: str. An explanation on how to apply the skill.
            worked_examples: list(str). A list of worked out examples of the
                skill.
        """
        self.explanation = explanation
        self.worked_examples = worked_examples

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
            created_on: datetime.datetime. Date and time when the skill is
                created.
            last_updated: datetime.datetime. Date and time when the
                skill was last updated.
            misconceptions_schema_version: int. The schema version for the
                misconceptions object.
            skill_contents_schema_version: int. The schema version for the
                skill_contents object.
            language_code: str. The ISO 639-1 code for the language this
                skill is written in.
            version: int. The version of the skill.
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
    def create_default_skill(cls, skill_id):
        """Returns a skill domain object with default values. This is for
        the frontend where a default blank skill would be shown to the user
        when the skill is created for the first time.

        Args:
            skill_id: str. The unique id of the skill.

        Returns:
            Skill. The Skill domain object with the default values.
        """
        skill_contents = SkillContents(feconf.DEFAULT_SKILL_EXPLANATION, [])
        return cls(
            skill_id, feconf.DEFAULT_SKILL_DESCRIPTION, [], skill_contents,
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
                    skill_contents dict.
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
