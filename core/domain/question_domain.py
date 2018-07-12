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
QUESTION_PROPERTY_CONTENT = 'content'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_QUESTION_PROPERTY = 'update_question_property'

# The following commands are deprecated, as these functionalities will be
# handled by a QuestionSkillLink class in the future.
CMD_ADD_QUESTION_SKILL = 'add_question_skill'
CMD_REMOVE_QUESTION_SKILL = 'remove_question_skill'

CMD_CREATE_NEW = 'create_new'


class QuestionChange(object):
    """Domain object for changes made to question object."""
    QUESTION_PROPERTIES = (
        QUESTION_PROPERTY_QUESTION_STATE_DATA,
        QUESTION_PROPERTY_LANGUAGE_CODE,
        QUESTION_PROPERTY_CONTENT)

    def __init__(self, change_dict):
        """Initialize a QuestionChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update question property' (with property_name, new_value
                and old_value)

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
                self.old_value = change_dict.get('old_value')
            else:
                raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing QuestionChange domain object.

        Returns:
            dict. A dict representing QuestionChange instance.
        """
        return {
            'cmd': self.cmd,
            'property_name': self.property_name,
            'new_value': self.new_value,
            'old_value': self.old_value
        }


class Question(object):
    """Domain object for a question.

    Attributes:
        question_id: str. The unique ID of the question.
        question_state_data: State. An object representing the question
            state data.
        language_code: str. The ISO 639-1 code for the language this
            question is written in.
        status: str. The status of the question among approved, rejected,
            pending or private.
        version: int. The version of the question.
    """

    def __init__(
            self, question_id, question_state_data, language_code, version):
        """Constructs a Question domain object.

        Args:
            question_id: str. The unique ID of the question.
            question_state_data: State. An object representing the question
                state data.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
            version: int. The version of the question.
        """
        self.id = question_id
        self.question_state_data = question_state_data
        self.language_code = language_code
        self.version = version

    def to_dict(self):
        """Returns a dict representing this Question domain object.

        Returns:
            dict. A dict representation of the Question instance.
        """
        return {
            'id': self.id,
            'question_state_data': self.question_state_data,
            'language_code': self.language_code,
            'version': self.version
        }

    def validate(self, strict=False):
        """Validates the Question domain object before it is saved."""

        if not isinstance(self.id, basestring):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self.id)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version to be an integer, received %s' %
                self.version)

        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if strict:
            at_least_one_correct_answer = False
            dest_is_specified = False
            interaction = self.question_state_data['interaction']
            for answer_group in interaction['answer_groups']:
                if answer_group['labelled_as_correct']:
                    at_least_one_correct_answer = True
                if answer_group['dest'] is not None:
                    dest_is_specified = True

            if interaction['default_outcome']['labelled_as_correct']:
                at_least_one_correct_answer = True

            if interaction['default_outcome']['dest'] is not None:
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

            if (len(interaction['hints']) == 0) or (
                    interaction['solution'] is None):
                raise utils.ValidationError(
                    'Expected the question to have at least one hint and a ' +
                    'solution.'
                )

            question_state_data = exp_domain.State.from_dict(
                self.question_state_data)
            question_state_data.validate({}, False)

    @classmethod
    def from_dict(cls, question_dict):
        """Returns a Question domain object from dict.

        Returns:
            Question. The corresponding Question domain object.
        """
        question = cls(
            question_dict['id'],
            question_dict['question_state_data'],
            question_dict['language_code'],
            question_dict['version'])

        return question

    @classmethod
    def create_default_question(cls, question_id):
        """Returns a Question domain object with default values.

        Args:
            question_id: str. The unique ID of the question.

        Returns:
            Question. A Question domain object with default values.
        """
        default_question_state_data = exp_domain.State.create_default_state(
            feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True)

        return cls(
            question_id, default_question_state_data,
            constants.DEFAULT_LANGUAGE_CODE, feconf.CURRENT_QUESTION_VERSION)

    def update_language_code(self, language_code):
        """Updates the language code of the question.

        Args:
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.language_code = language_code

    def update_question_state_data(self, question_state_data):
        """Updates the question data of the question.

        Args:
            question_state_data: State. An object representing the question
                state data.
        """
        self.question_state_data = question_state_data


class QuestionSummary(object):
    """Domain object for Question Summary.
    """
    def __init__(
            self, creator_id, question_id, question_content,
            question_model_last_updated=None, question_model_created_on=None):
        """Constructs a Question Summary domain object.

        Args:
            creator_id: str. The user ID of the creator of the question.
            question_id: str. The ID of the question.
            question_model_last_updated: datetime.datetime. Date and time
                when the question model was last updated.
            question_model_created_on: datetime.datetime. Date and time when
                the question model is created.
            question_content: str. The static HTML of the question shown to
                the learner.
        """
        self.id = question_id
        self.creator_id = creator_id
        self.created_on = question_model_created_on
        self.last_updated = question_model_last_updated
        self.question_content = html_cleaner.clean(question_content)

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSummary object.
        """
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'last_updated': self.last_updated,
            'created_on': self.created_on,
            'question_content': self.question_content
        }

    def update_html_content(self, html_content):
        """Updates html content of a question.

        Args:
            html_content: str. The static HTML of the question shown to
                the learner.
        """
        self.question_content = html_content


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
        """Checks whether given user is a manager of the question.

        Args:
            user_id: str or None. ID of the user.

        Returns:
            bool. Whether the user is creator of this question.
        """
        return bool(user_id is self.creator_id)
