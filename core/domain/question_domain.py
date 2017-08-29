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

"""Domain objects relating to question."""

from constants import constants
from core.platform import models

import feconf
import utils
(question_models,) = models.Registry.import_models([models.NAMES.question])


class Question(object):
    """Domain object for a questions.

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
            cls, question_id, collection_id,
            title=feconf.DEFAULT_QUESTION_TITLE,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
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
