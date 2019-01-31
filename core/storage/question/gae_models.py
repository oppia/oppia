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

from constants import constants
from core.platform import models
import core.storage.user.gae_models as user_models
import utils

from google.appengine.datastore import datastore_query
from google.appengine.ext import ndb

(base_models, skill_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.skill
])


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

    # An object representing the question state data.
    question_state_data = ndb.JsonProperty(indexed=False, required=True)
    # The schema version for the question state data.
    question_state_schema_version = ndb.IntegerProperty(
        required=True, indexed=True)
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
            commit_type, commit_message, commit_cmds,
            constants.ACTIVITY_STATUS_PUBLIC, False
        )
        question_commit_log.question_id = self.id
        question_commit_log.put()

    @classmethod
    def create(
            cls, question_state_data, language_code, version):
        """Creates a new QuestionModel entry.

        Args:
            question_state_data: dict. An dict representing the question
                state data.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
            version: str. The version of the question.

        Returns:
            QuestionModel. Instance of the new QuestionModel entry.

        Raises:
            Exception: A model with the same ID already exists.
        """
        instance_id = cls._get_new_id()
        question_model_instance = cls(
            id=instance_id,
            question_state_data=question_state_data,
            language_code=language_code,
            version=version)

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
    def get_model_id(cls, question_id, skill_id):
        """Returns the model id by combining the questions and skill id.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.

        Returns:
            str. The calculated model id.
        """
        return '%s:%s' % (question_id, skill_id)

    @classmethod
    def create(cls, question_id, skill_id):
        """Creates a new QuestionSkillLinkModel entry.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.

        Raises:
            Exception. The given question is already linked to the given skill.

        Returns:
            QuestionSkillLinkModel. Instance of the new QuestionSkillLinkModel
                entry.
        """
        question_skill_link_id = cls.get_model_id(question_id, skill_id)
        if cls.get(question_skill_link_id, strict=False) is not None:
            raise Exception(
                'The given question is already linked to given skill')

        question_skill_link_model_instance = cls(
            id=question_skill_link_id,
            question_id=question_id,
            skill_id=skill_id
        )
        return question_skill_link_model_instance

    @classmethod
    def get_question_skill_links_and_skill_descriptions(
            cls, question_count, skill_ids, start_cursor):
        """Fetches the list of QuestionSkillLinkModels linked to the skill in
        batches.

        Args:
            question_count: int. The number of questions to be returned.
            skill_ids: list(str). The ids of skills for which the linked
                question ids are to be retrieved.
            start_cursor: str. The starting point from which the batch of
                questions are to be returned. This value should be urlsafe.

        Returns:
            list(QuestionSkillLinkModel), list(str), str|None. The
                QuestionSkillLinkModels corresponding to given skill_ids, the
                corresponding skill descriptions and the next cursor value to be
                used for the next page (or None if no more pages are left). The
                returned next cursor value is urlsafe.
        """
        if not start_cursor == '':
            cursor = datastore_query.Cursor(urlsafe=start_cursor)
            question_skill_link_models, next_cursor, more = cls.query(
                cls.skill_id.IN(skill_ids)
                # Order by cls.key is needed alongside cls.last_updated so as to
                # resolve conflicts, if any.
                # Reference SO link: https://stackoverflow.com/q/12449197
            ).order(-cls.last_updated, cls.key).fetch_page(
                question_count,
                start_cursor=cursor
            )
        else:
            question_skill_link_models, next_cursor, more = cls.query(
                cls.skill_id.IN(skill_ids)
            ).order(-cls.last_updated, cls.key).fetch_page(
                question_count
            )

        skill_ids = [model.skill_id for model in question_skill_link_models]
        skills = skill_models.SkillModel.get_multi(skill_ids)
        skill_descriptions = [skill.description for skill in skills]
        next_cursor_str = (
            next_cursor.urlsafe() if (next_cursor and more) else None
        )
        return question_skill_link_models, skill_descriptions, next_cursor_str

    @classmethod
    def get_all_question_ids_linked_to_skill_id(cls, skill_id):
        """Returns a list of all question ids corresponding to the given skill
        id.

        Args:
            skill_id: str. ID of the skill.

        Returns:
            list(str). The list of all question ids corresponding to the given
                skill id.
        """
        question_skill_link_models = cls.query(cls.skill_id == skill_id)
        question_ids = [
            model.question_id for model in question_skill_link_models
        ]
        return question_ids

    @classmethod
    def get_models_by_skill_id(cls, skill_id):
        """Returns a list of QuestionSkillLink domains of a particular skill ID.

        Args:
            skill_id: str. ID of the skill.

        Returns:
            list(QuestionSkillLinkModel)|None. The list of question skill link
            domains that are linked to the skill ID. None if the skill
            ID doesn't exist.
        """
        return QuestionSkillLinkModel.query().filter(
            cls.skill_id == skill_id).fetch()

    @classmethod
    def get_models_by_question_id(cls, question_id):
        """Returns a list of QuestionSkillLinkModels of a particular
        question ID.

        Args:
            question_id: str. ID of the question.

        Returns:
            list(QuestionSkillLinkModel)|None. The list of question skill link
            models that are linked to the question ID, or None if there are no
            question skill link models associated with the question ID.
        """
        return QuestionSkillLinkModel.query().filter(
            cls.question_id == question_id,
            cls.deleted == False).fetch() #pylint: disable=singleton-comparison

    @classmethod
    def put_multi_question_skill_links(cls, question_skill_links):
        """Puts multiple question skill link models into the datastore.

        Args:
            question_skill_links: list(QuestionSkillLink). The list of
            question skill link domain objects to put into the datastore.
        """
        cls.put_multi(question_skill_links)


    @classmethod
    def delete_multi_question_skill_links(cls, question_skill_links):
        """Deletes multiple question skill links from the datastore.

        Args:
            question_skill_links: list(QuestionSkillLinkModel). The list of
            question skill link domain objects to delete from the datastore.
        """
        cls.delete_multi(question_skill_links)


class QuestionCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to questions.

    A new instance of this model is created and saved every time a commit to
    QuestionModel occurs.

    The id for this model is of the form
    'question-{{QUESTION_ID}}-{{QUESTION_VERSION}}'.
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
        return 'question-%s-%s' % (question_id, question_version)


class QuestionSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia question.

    This should be used whenever the content blob of the question is not
    needed (e.g. in search results, etc).

    A QuestionSummaryModel instance stores the following information:

    creator_id, question_model_last_updated, question_model_created_on,
    question_state_data.

    The key of each instance is the question id.
    """
    # The user ID of the creator of the question.
    creator_id = ndb.StringProperty(required=True)
    # Time when the question model was last updated (not to be
    # confused with last_updated, which is the time when the
    # question *summary* model was last updated).
    question_model_last_updated = ndb.DateTimeProperty(indexed=True)
    # Time when the question model was created (not to be confused
    # with created_on, which is the time when the question *summary*
    # model was created).
    question_model_created_on = ndb.DateTimeProperty(indexed=True)
    # The html content for the question.
    question_content = ndb.TextProperty(indexed=False, required=True)

    @classmethod
    def get_by_creator_id(cls, creator_id):
        """Gets QuestionSummaryModel by creator_id.

        Args:
            creator_id: str. The user ID of the creator of the question.

        Returns:
            QuestionSummaryModel. The summary model of the question.
        """
        return QuestionSummaryModel.query().filter(
            cls.creator_id == creator_id).fetch()


class QuestionRightsSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a question rights snapshot."""
    pass


class QuestionRightsSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a question rights snapshot."""
    pass


class QuestionRightsModel(base_models.VersionedModel):
    """Storage model for rights related to a question.

    The id of each instance is the id of the corresponding question.
    """

    SNAPSHOT_METADATA_CLASS = QuestionRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = QuestionRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user ID of the creator of the question.
    creator_id = ndb.StringProperty(indexed=True, required=True)
