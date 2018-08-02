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

from constants import constants
from core.domain import exp_domain
from core.domain import html_cleaner
from core.platform import models
import feconf
import utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
QUESTION_PROPERTY_LANGUAGE_CODE = 'language_code'
QUESTION_PROPERTY_QUESTION_STATE_DATA = 'question_state_data'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_QUESTION_PROPERTY = 'update_question_property'
CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION = 'create_new_fully_specified_question'

# The following commands are deprecated, as these functionalities will be
# handled by a QuestionSkillLink class in the future.
CMD_ADD_QUESTION_SKILL = 'add_question_skill'
CMD_REMOVE_QUESTION_SKILL = 'remove_question_skill'

CMD_CREATE_NEW = 'create_new'


class QuestionChange(object):
    """Domain object for changes made to question object."""
    QUESTION_PROPERTIES = (
        QUESTION_PROPERTY_QUESTION_STATE_DATA,
        QUESTION_PROPERTY_LANGUAGE_CODE)

    def __init__(self, change_dict):
        """Initialize a QuestionChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update question property' (with property_name, new_value
                and old_value)
                - 'create_new_fully_specified_question' (with question_dict,
                skill_id)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_UPDATE_QUESTION_PROPERTY:
            if (change_dict['property_name'] in
                    self.QUESTION_PROPERTIES):
                self.property_name = change_dict['property_name']
                self.new_value = change_dict['new_value']
                self.old_value = change_dict['old_value']
            else:
                raise Exception('Invalid change_dict: %s' % change_dict)

        if self.cmd == CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION:
            self.question_dict = change_dict['question_dict']
            self.skill_id = change_dict['skill_id']

    def to_dict(self):
        """Returns a dict representing QuestionChange domain object.

        Returns:
            dict. A dict representing QuestionChange instance.
        """
        if self.cmd == CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION:
            return {
                'cmd': self.cmd,
                'question_dict': self.question_dict,
                'skill_id': self.skill_id
            }

        return {
            'cmd': self.cmd,
            'property_name': self.property_name,
            'new_value': self.new_value,
            'old_value': self.old_value
        }


class Question(object):
    """Domain object for a question."""

    def __init__(
            self, question_id, question_state_data,
            question_state_schema_version, language_code, version,
            created_on=None, last_updated=None):
        """Constructs a Question domain object.

        Args:
            question_id: str. The unique ID of the question.
            question_state_data: State. An object representing the question
                state data.
            question_state_schema_version: int. The schema version of the
                question states (equivalent to the states schema version of
                explorations).
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
            version: int. The version of the question.
            created_on: datetime.datetime. Date and time when the question was
                created.
            last_updated: datetime.datetime. Date and time when the
                question was last updated.
        """
        self.id = question_id
        self.question_state_data = question_state_data
        self.language_code = language_code
        self.question_state_schema_version = question_state_schema_version
        self.version = version
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
            'question_state_schema_version': self.question_state_schema_version,
            'language_code': self.language_code,
            'version': self.version
        }

    @classmethod
    def create_default_question_state(cls):
        """Return a State domain object with default value for being used as
        question state data.

        Returns:
            State. The corresponding State domain object.
        """
        return exp_domain.State.create_default_state(
            None, is_initial_state=True)

    def partial_validate(self):
        """Validates the Question domain object, but doesn't require the
        object to contain an idea and a version. To be used to validate the
        question before it is finalized."""

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not isinstance(self.question_state_schema_version, int):
            raise utils.ValidationError(
                'Expected schema version to be an integer, received %s' %
                self.question_state_schema_version)

        if not isinstance(self.question_state_data, exp_domain.State):
            raise utils.ValidationError(
                'Expected question state data to be a State object, '
                'received %s' % self.question_state_data)

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        at_least_one_correct_answer = False
        dest_is_specified = False
        interaction = self.question_state_data.interaction
        for answer_group in interaction.answer_groups:
            if answer_group.labelled_as_correct:
                at_least_one_correct_answer = True
            if answer_group.dest is not None:
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

        if interaction.solution is None:
            raise utils.ValidationError(
                'Expected the question to have a solution'
            )
        self.question_state_data.validate({}, False)

    def validate(self):
        """Validates the Question domain object before it is saved."""

        if not isinstance(self.id, basestring):
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
            exp_domain.State.from_dict(question_dict['question_state_data']),
            question_dict['question_state_schema_version'],
            question_dict['language_code'], question_dict['version'])

        return question

    @classmethod
    def create_default_question(cls, question_id):
        """Returns a Question domain object with default values.

        Args:
            question_id: str. The unique ID of the question.

        Returns:
            Question. A Question domain object with default values.
        """
        default_question_state_data = cls.create_default_question_state()

        return cls(
            question_id, default_question_state_data,
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0)

    def update_language_code(self, language_code):
        """Updates the language code of the question.

        Args:
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.language_code = language_code

    def update_question_state_data(self, question_state_data_dict):
        """Updates the question data of the question.

        Args:
            question_state_data_dict: dict. A dict representing the question
                state data.
        """
        self.question_state_data = exp_domain.State.from_dict(
            question_state_data_dict)


class QuestionSummary(object):
    """Domain object for Question Summary.
    """
    def __init__(
            self, creator_id, question_id, question_content,
            question_model_created_on=None, question_model_last_updated=None):
        """Constructs a Question Summary domain object.

        Args:
            creator_id: str. The user ID of the creator of the question.
            question_id: str. The ID of the question.
            question_content: str. The static HTML of the question shown to
                the learner.
            question_model_created_on: datetime.datetime. Date and time when
                the question model is created.
            question_model_last_updated: datetime.datetime. Date and time
                when the question model was last updated.
        """
        self.id = question_id
        self.creator_id = creator_id
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
            'creator_id': self.creator_id,
            'question_content': self.question_content,
            'last_updated_msec': utils.get_time_in_millisecs(self.last_updated),
            'created_on_msec': utils.get_time_in_millisecs(self.created_on)
        }


class QuestionSkillLink(object):
    """Domain object for Question Skill Link.

    Attributes:
        question_id: str. The ID of the question.
        skill_id: str. The ID of the skill to which the
            question is linked.
    """

    def __init__(self, question_id, skill_id):
        """Constructs a Question Skill Link domain object.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.
        """
        self.question_id = question_id
        self.skill_id = skill_id

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSkillLink object.
        """
        return {
            'question_id': self.question_id,
            'skill_id': self.skill_id,
        }


class QuestionRights(object):
    """Domain object for question rights."""

    def __init__(self, question_id, creator_id):
        """Constructs a QuestionRights domain object.

        Args:
            question_id: str. The id of the question.
            creator_id: str. The id of the user who has initially created
                the question.
        """
        self.id = question_id
        self.creator_id = creator_id

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict representation of QuestionRights suitable for use
                by the frontend.
        """
        return {
            'question_id': self.id,
            'creator_id': self.creator_id
        }

    def is_creator(self, user_id):
        """Checks whether given user is a creator of the question.

        Args:
            user_id: str or None. ID of the user.

        Returns:
            bool. Whether the user is creator of this question.
        """
        return bool(user_id == self.creator_id)
