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
from core.platform import models
import feconf
import utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
QUESTION_PROPERTY_TITLE = 'title'
QUESTION_PROPERTY_LANGUAGE_CODE = 'language_code'
QUESTION_PROPERTY_QUESTION_DATA = 'question_data'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_QUESTION_PROPERTY = 'update_question_property'

CMD_ADD_QUESTION_SKILL = 'add_question_skill'
CMD_REMOVE_QUESTION_SKILL = 'remove_question_skill'


class QuestionChange(object):
    """Domain object for changes made to question object."""
    QUESTION_PROPERTIES = (
        QUESTION_PROPERTY_TITLE, QUESTION_PROPERTY_QUESTION_DATA,
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
        elif self.cmd == CMD_ADD_QUESTION_SKILL:
            self.skill_name = change_dict['skill_name']
        elif self.cmd == CMD_REMOVE_QUESTION_SKILL:
            self.skill_id = change_dict['skill_id']

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
        title: str. The title of the question.
        question_data: dict. A dict representing the question data.
        question_data_schema_version: int. The schema version for the data.
        collection_id: str. The ID of the collection containing the question.
        language_code: str. The ISO 639-1 code for the language this
            question is written in.
    """

    def __init__(self, question_id, title, question_data,
                 question_data_schema_version, collection_id, language_code):
        """Constructs a Question domain object.

        Args:
            question_id: str. The unique ID of the question.
            title: str. The title of the question.
            question_data: dict. A dict representing the question data.
            question_data_schema_version: int. The schema version for the data.
            collection_id: str. The ID of the collection containing the
                question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.question_id = question_id
        self.title = title
        self.question_data = question_data
        self.question_data_schema_version = question_data_schema_version
        self.collection_id = collection_id
        self.language_code = language_code

    def to_dict(self):
        """Returns a dict representing this Question domain object.

        Returns:
            dict. A dict representation of the Question instance.
        """
        return {
            'question_id': self.question_id,
            'title': self.title,
            'question_data': self.question_data,
            'question_data_schema_version': self.question_data_schema_version,
            'collection_id': self.collection_id,
            'language_code': self.language_code
        }

    def validate(self):
        """Validates the Question domain object before it is saved."""

        if not isinstance(self.question_id, basestring):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self.question_id)

        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)

        if not isinstance(self.question_data, dict):
            raise utils.ValidationError(
                'Expected question_data to be a dict, received %s' %
                self.question_data)
        question_data = exp_domain.State.from_dict(self.question_data)
        question_data.validate(None, True)

        if not isinstance(self.question_data_schema_version, int):
            raise utils.ValidationError(
                'Expected question_data_schema_version to be a integer,' +
                'received %s' % self.question_data_schema_version)

        if not isinstance(self.collection_id, basestring):
            raise utils.ValidationError(
                'Expected collection_id to be a string, received %s' %
                self.collection_id)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)

        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

    @classmethod
    def from_dict(cls, question_dict):
        """Returns a Question domain object from dict.

        Returns:
            Question. The corresponding Question domain object.
        """
        question = cls(
            question_dict['question_id'], question_dict['title'],
            question_dict['question_data'],
            question_dict['question_data_schema_version'],
            question_dict['collection_id'], question_dict['language_code'])

        return question

    @classmethod
    def create_default_question(
            cls, question_id, collection_id, title, language_code):
        """Returns a Question domain object with default values.

        Args:
            question_id: str. The unique ID of the question.
            collection_id: str. The ID of the collection containing the
                question.
            title: str. The title of the question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.

        Returns:
            Question. A Question domain object with default values.
        """
        return cls(
            question_id, title, {},
            feconf.CURRENT_QUESTION_SCHEMA_VERSION,
            collection_id, language_code)

    def update_title(self, title):
        """Updates the title of the question.

        Args:
            title: str. The title of the question.
        """
        self.title = title

    def update_language_code(self, language_code):
        """Updates the language code of the question.

        Args:
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        self.language_code = language_code

    def update_question_data(self, question_data):
        """Updates the question data of the question.

        Args:
            question_data: dict. A dict representing the question data.
        """
        self.question_data = question_data


class QuestionSummary(object):
    """Domain object for Question Summary.

    Attributes:
        question_id: str. The ID of the question.
        question_title: str. The title of the question.
        skill_names: list(str). The list of skill names associated with the
            question.
    """
    def __init__(self, question_id, question_title, skill_names):
        """Constructs a Question Summary domain object.

        Args:
            question_id: str. The ID of the question.
            question_title: str. The title of the question.
            skill_names: list(str). The list of skill names associated with the
                question.
        """
        self.question_id = question_id
        self.question_title = question_title
        self.skill_names = skill_names

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this QuestionSummary object.
        """
        return {
            'question_id': self.question_id,
            'question_title': self.question_title,
            'skill_names': self.skill_names
        }
