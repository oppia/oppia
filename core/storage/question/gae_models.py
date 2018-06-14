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

(base_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user_model])


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
            new_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for QuestionModel is producing too many '
            'collisions.')

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """
        super(QuestionModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        question_commit_log = QuestionCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds
        )
        question_commit_log.question_id = self.id
        question_commit_log.put()

    @classmethod
    def create(
            cls, question_data, question_data_schema_version,
            language_code):
        """Creates a new QuestionModel entry.

        Args:
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
            id=instance_id,
            question_data=question_data,
            question_data_schema_version=question_data_schema_version,
            language_code=language_code)

        return question_model_instance


class QuestionSkillLinkModel(base_models.BaseModel):
    """Model for storing Question-Skill Links.

    The ID of instances of this class has the form
    {{random_hash_of_12_chars}}
    """

    # The ID of the question.
    question_id = ndb.StringProperty(required=True, indexed=True)
    # The ID of the skill to which the question is linked.
    skill_id = ndb.StringProperty(required=True, indexed=True)

    @classmethod
    def create(
            cls, question_id, skill_id):
        """Creates a new QuestionSkillLinkModel entry.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.

        Returns:
            QuestionSkillLinkModel. Instance of the new
            QuestionSkillLinkModel entry.
        """

        question_skill_link_model_instance = cls(
            question_id=question_id, skill_id=skill_id)

        return question_skill_link_model_instance


class QuestionCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to questions.

    A new instance of this model is created and saved every time a commit to
    QuestionModel occurs.

    The id for this model is of the form
    'question.{{QUESTION_ID}}.{{QUESTION_VERSION}}'.
    """
    # The id of the question being edited.
    question_id = ndb.StringProperty(indexed=True, required=True)

    @classmethod
    def _get_instance_id(cls, question_id, question_version):
        """Returns ID of the question commit log entry model.

        Args:
            question_id: str. The question id whose states are mapped.
            question_version: int. The version of the question.

        Returns:
            str. A string containing question ID and
                question version.
        """
        return 'question.%s.%s' % (question_id, question_version)

    @classmethod
    def get_all_question_commits(cls, question_id, latest_version):
        """Fetches all the commits made on a particular question up to latest
        version of question.

        Args:
            question_id: str. The question id.
            latest_version: int. Latest version of the question.

        Returns:
            list(QuestionCommitLogEntryModel). Commit log entry model
            for each version of the given question.
        """
        model_ids = []
        for version in range(1, latest_version + 1):
            model_ids.append(cls._get_instance_id(question_id, version))

        models = cls.get_multi(model_ids)
        return models
