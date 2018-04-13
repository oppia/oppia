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

"""Models for storing the question data models."""

from core.platform import models
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class QuestionSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a question snapshot."""
    pass


class QuestionSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a question snapshot."""
    pass


class QuestionModel(base_models.VersionedModel):
    """Model for storing Questions.

    The ID of instances of this class has the form
    {{random_hash_of_16_chars}}
    """
    SNAPSHOT_METADATA_CLASS = QuestionSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = QuestionSnapshotContentModel
    ALLOW_REVERT = True

    # The title of the question.
    title = ndb.StringProperty(required=True, indexed=True)
    # A dict representing the question data.
    question_data = ndb.JsonProperty(indexed=False)
    # The schema version for the data.
    question_data_schema_version = (
        ndb.IntegerProperty(required=True, indexed=True))
    # The ISO 639-1 code for the language this question is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)

    @classmethod
    def _get_new_id(cls):
        """Generates a unique ID for the question of the form
        {{random_hash_of_16_chars}}

        Returns:
           new_id: int. ID of the new QuestionModel instance.

        Raises:
            Exception: The ID generator for QuestionModel is
            producing too many collisions.
        """

        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s' % (
                utils.convert_to_hash(
                    str(utils.get_random_int(base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for QuestionModel is producing too many '
            'collisions.')

    @classmethod
    def create(
            cls, title, question_data, question_data_schema_version,
            language_code):
        """Creates a new QuestionModel entry.

        Args:
            title: str. The title of the question.
            question_data: dict. A dict representing the question data.
            question_data_schema_version: int. The schema version for the data.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.

        Returns:
            QuestionModel. Instance of the new QuestionModel entry.

        Raises:
            Exception: A model with the same ID already exists.
        """
        instance_id = cls._get_new_id()
        question_model_instance = cls(
            id=instance_id, title=title,
            question_data=question_data,
            question_data_schema_version=question_data_schema_version,
            language_code=language_code)

        return question_model_instance
