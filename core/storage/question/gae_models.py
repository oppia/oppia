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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import math
import random

from constants import constants
from core.platform import models
import feconf
import python_utils
import utils

(base_models, skill_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.skill
])

datastore_services = models.Registry.import_datastore_services()


class QuestionSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a question snapshot."""

    pass


class QuestionSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a question snapshot."""

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class QuestionModel(base_models.VersionedModel):
    """Model for storing Questions.

    The ID of instances of this class are in form of random hash of 12 chars.
    """

    SNAPSHOT_METADATA_CLASS = QuestionSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = QuestionSnapshotContentModel
    ALLOW_REVERT = True

    # An object representing the question state data.
    question_state_data = (
        datastore_services.JsonProperty(indexed=False, required=True))
    # The schema version for the question state data.
    question_state_data_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The ISO 639-1 code for the language this question is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The skill ids linked to this question.
    linked_skill_ids = datastore_services.StringProperty(
        indexed=True, repeated=True)
    # The optional skill misconception ids marked as not relevant to the
    # question.
    # Note: Misconception ids are represented in two ways. In the Misconception
    # domain object the id is a number. But in the context of a question
    # (used here), the skill id needs to be included along with the
    # misconception id, this is because questions can have multiple skills
    # attached to it. Hence, the format for this field will be
    # <skill-id>-<misconceptionid>.
    inapplicable_skill_misconception_ids = datastore_services.StringProperty(
        indexed=True, repeated=True)

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'question_state_data': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_state_data_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'linked_skill_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'inapplicable_skill_misconception_ids':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def _get_new_id(cls):
        """Generates a unique ID for the question in the form of random hash
        of 12 chars.

        Returns:
            new_id: int. ID of the new QuestionModel instance.

        Raises:
            Exception. The ID generator for QuestionModel is
                producing too many collisions.
        """

        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            new_id = utils.convert_to_hash(
                python_utils.UNICODE(
                    utils.get_random_int(base_models.RAND_RANGE)),
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

        question_commit_log = QuestionCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type, commit_message,
            commit_cmds, constants.ACTIVITY_STATUS_PUBLIC, False
        )
        question_commit_log.question_id = self.id
        question_commit_log.update_timestamps()
        question_commit_log.put()

    @classmethod
    def create(
            cls, question_state_data, language_code, version, linked_skill_ids,
            inapplicable_skill_misconception_ids):
        """Creates a new QuestionModel entry.

        Args:
            question_state_data: dict. An dict representing the question
                state data.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
            version: str. The version of the question.
            linked_skill_ids: list(str). The skill ids linked to the question.
            inapplicable_skill_misconception_ids: list(str). The optional
                skill misconception ids marked as not applicable to the
                question.

        Returns:
            QuestionModel. Instance of the new QuestionModel entry.

        Raises:
            Exception. A model with the same ID already exists.
        """
        instance_id = cls._get_new_id()
        question_model_instance = cls(
            id=instance_id,
            question_state_data=question_state_data,
            language_code=language_code,
            version=version,
            linked_skill_ids=linked_skill_ids,
            inapplicable_skill_misconception_ids=(
                inapplicable_skill_misconception_ids))

        return question_model_instance

    @classmethod
    def put_multi_questions(cls, questions):
        """Puts multiple question models into the datastore.

        Args:
            questions: list(Question). The list of question objects
                to put into the datastore.
        """
        cls.update_timestamps_multi(questions)
        cls.put_multi(questions)


class QuestionSkillLinkModel(base_models.BaseModel):
    """Model for storing Question-Skill Links.

    The ID of instances of this class has the form '[question_id]:[skill_id]'.
    """

    # The ID of the question.
    question_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The ID of the skill to which the question is linked.
    skill_id = datastore_services.StringProperty(required=True, indexed=True)
    # The difficulty of the skill.
    skill_difficulty = (
        datastore_services.FloatProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'question_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_difficulty': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

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
    def create(cls, question_id, skill_id, skill_difficulty):
        """Creates a new QuestionSkillLinkModel entry.

        Args:
            question_id: str. The ID of the question.
            skill_id: str. The ID of the skill to which the question is linked.
            skill_difficulty: float. The difficulty between [0, 1] of the skill.

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
            skill_id=skill_id,
            skill_difficulty=skill_difficulty
        )
        return question_skill_link_model_instance

    @classmethod
    def get_total_question_count_for_skill_ids(cls, skill_ids):
        """Returns the number of questions assigned to the given skill_ids.

        Args:
            skill_ids: list(str). Skill IDs for which the question count is
                requested.

        Returns:
            int. The number of questions assigned to the given skill_ids.
        """
        total_question_count = cls.query().filter(
            cls.skill_id.IN(skill_ids)).count()

        return total_question_count

    @classmethod
    def get_question_skill_links_by_skill_ids(
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
            list(QuestionSkillLinkModel), str|None. The QuestionSkillLinkModels
            corresponding to given skill_ids, the next cursor value to be
            used for the next page (or None if no more pages are left). The
            returned next cursor value is urlsafe.
        """
        question_skill_count = min(
            len(skill_ids), constants.MAX_SKILLS_PER_QUESTION
        ) * question_count

        if not start_cursor == '':
            cursor = datastore_services.make_cursor(urlsafe_cursor=start_cursor)
            question_skill_link_models, next_cursor, more = cls.query(
                cls.skill_id.IN(skill_ids)
                # Order by cls.key is needed alongside cls.last_updated so as to
                # resolve conflicts, if any.
                # Reference SO link: https://stackoverflow.com/q/12449197
            ).order(-cls.last_updated, cls.key).fetch_page(
                question_skill_count,
                start_cursor=cursor
            )
        else:
            question_skill_link_models, next_cursor, more = cls.query(
                cls.skill_id.IN(skill_ids)
            ).order(-cls.last_updated, cls.key).fetch_page(
                question_skill_count
            )
        next_cursor_str = (
            next_cursor.urlsafe() if (next_cursor and more) else None
        )
        return question_skill_link_models, next_cursor_str

    @classmethod
    def get_question_skill_links_based_on_difficulty_equidistributed_by_skill(
            cls, total_question_count, skill_ids, difficulty_requested):
        """Fetches the list of constant number of random QuestionSkillLinkModels
        linked to the skills, sorted by the absolute value of the difference
        between skill difficulty and the requested difficulty.

        Args:
            total_question_count: int. The number of questions expected.
            skill_ids: list(str). The ids of skills for which the linked
                question ids are to be retrieved.
            difficulty_requested: float. The skill difficulty of the questions
                requested to be fetched.

        Returns:
            list(QuestionSkillLinkModel). A list of random
            QuestionSkillLinkModels corresponding to given skill_ids, with
            total_question_count/len(skill_ids) number of questions for
            each skill. If not evenly divisible, it will be rounded up.
            If not enough questions for a skill, just return all questions
            it links to.
        """
        if len(skill_ids) > feconf.MAX_NUMBER_OF_SKILL_IDS:
            raise Exception('Please keep the number of skill IDs below 20.')

        if (not skill_ids) or (total_question_count == 0):
            return []

        question_count_per_skill = int(
            math.ceil(python_utils.divide(
                float(total_question_count), float(len(skill_ids)))))

        question_skill_link_mapping = {}

        # For fetching the questions randomly we have used a random offset.
        # But this is a temporary solution since this method scales linearly.
        # Other alternative methods were:
        # 1) Using a random id in question id filter
        # 2) Adding an additional column that can be filtered upon.
        # But these methods are not viable because google datastore limits
        # each query to have at most one inequality filter. So we can't filter
        # on both question_id and difficulty. Please see
        # https://github.com/oppia/oppia/pull/9061#issuecomment-629765809
        # for more details.

        def get_offset(query):
            """Helper function to get the offset."""
            question_count = query.count()
            if question_count > 2 * question_count_per_skill:
                return utils.get_random_int(
                    question_count - (question_count_per_skill * 2))
            return 0

        for skill_id in skill_ids:
            query = cls.query(cls.skill_id == skill_id)

            equal_questions_query = query.filter(
                cls.skill_difficulty == difficulty_requested)

            # We fetch more questions here in order to try and ensure that the
            # eventual number of returned questions is sufficient to meet the
            # number requested, even after deduplication.
            new_question_skill_link_models = equal_questions_query.fetch(
                limit=question_count_per_skill * 2,
                offset=get_offset(equal_questions_query))
            for model in new_question_skill_link_models:
                if model.question_id in question_skill_link_mapping:
                    new_question_skill_link_models.remove(model)

            if len(new_question_skill_link_models) >= question_count_per_skill:
                new_question_skill_link_models = random.sample(
                    new_question_skill_link_models, question_count_per_skill)
            else:
                # Fetch QuestionSkillLinkModels with difficulty smaller than
                # requested difficulty.
                easier_questions_query = query.filter(
                    cls.skill_difficulty < difficulty_requested)
                easier_question_skill_link_models = (
                    easier_questions_query.fetch(
                        limit=question_count_per_skill * 2,
                        offset=get_offset(easier_questions_query)))
                for model in easier_question_skill_link_models:
                    if model.question_id in question_skill_link_mapping:
                        easier_question_skill_link_models.remove(model)
                question_extra_count = (
                    len(new_question_skill_link_models) +
                    len(easier_question_skill_link_models) -
                    question_count_per_skill)
                if question_extra_count >= 0:
                    easier_question_skill_link_models = random.sample(
                        easier_question_skill_link_models,
                        question_count_per_skill -
                        len(new_question_skill_link_models)
                    )
                    new_question_skill_link_models.extend(
                        easier_question_skill_link_models)
                else:
                    # Fetch QuestionSkillLinkModels with difficulty larger than
                    # requested difficulty.
                    new_question_skill_link_models.extend(
                        easier_question_skill_link_models)
                    harder_questions_query = query.filter(
                        cls.skill_difficulty > difficulty_requested)
                    harder_question_skill_link_models = (
                        harder_questions_query.fetch(
                            limit=question_count_per_skill * 2,
                            offset=get_offset(harder_questions_query)))
                    harder_question_skill_link_models = (
                        harder_questions_query.fetch())
                    for model in harder_question_skill_link_models:
                        if model.question_id in question_skill_link_mapping:
                            harder_question_skill_link_models.remove(model)
                    question_extra_count = (
                        len(new_question_skill_link_models) +
                        len(harder_question_skill_link_models) -
                        question_count_per_skill)
                    if question_extra_count >= 0:
                        harder_question_skill_link_models = (
                            random.sample(
                                harder_question_skill_link_models,
                                question_count_per_skill -
                                len(new_question_skill_link_models)
                            ))
                    new_question_skill_link_models.extend(
                        harder_question_skill_link_models)

            new_question_skill_link_models = (
                new_question_skill_link_models[:question_count_per_skill])

            for model in new_question_skill_link_models:
                if model.question_id not in question_skill_link_mapping:
                    question_skill_link_mapping[model.question_id] = model

        return list(question_skill_link_mapping.values())

    @classmethod
    def get_question_skill_links_equidistributed_by_skill(
            cls, total_question_count, skill_ids):
        """Fetches the list of constant number of random
        QuestionSkillLinkModels linked to the skills.

        Args:
            total_question_count: int. The number of questions expected.
            skill_ids: list(str). The ids of skills for which the linked
                question ids are to be retrieved.

        Returns:
            list(QuestionSkillLinkModel). A list of random
            QuestionSkillLinkModels corresponding to given skill_ids, with
            total_question_count/len(skill_ids) number of questions for
            each skill. If not evenly divisible, it will be rounded up.
            If not enough questions for a skill, just return all questions
            it links to.
        """
        if len(skill_ids) > feconf.MAX_NUMBER_OF_SKILL_IDS:
            raise Exception('Please keep the number of skill IDs below 20.')

        if not skill_ids:
            return []

        question_count_per_skill = int(
            math.ceil(
                python_utils.divide(
                    float(total_question_count), float(len(skill_ids)))))
        question_skill_link_models = []
        existing_question_ids = []

        def get_offset(query):
            """Helper function to get the offset."""
            question_count = query.count()
            if question_count > 2 * question_count_per_skill:
                return utils.get_random_int(
                    question_count - (question_count_per_skill * 2))
            return 0

        for skill_id in skill_ids:
            query = cls.query(cls.skill_id == skill_id)

            # We fetch more questions here in order to try and ensure that the
            # eventual number of returned questions is sufficient to meet the
            # number requested, even after deduplication.
            new_question_skill_link_models = query.fetch(
                limit=question_count_per_skill * 2,
                offset=get_offset(query))

            # Deduplicate if the same question is linked to multiple skills.
            for model in new_question_skill_link_models:
                if model.question_id in existing_question_ids:
                    new_question_skill_link_models.remove(model)
            if len(new_question_skill_link_models) > question_count_per_skill:
                sampled_question_skill_link_models = random.sample(
                    new_question_skill_link_models,
                    question_count_per_skill
                )
            else:
                sampled_question_skill_link_models = (
                    new_question_skill_link_models)

            question_skill_link_models.extend(
                sampled_question_skill_link_models)
            existing_question_ids.extend([
                model.question_id for model in (
                    sampled_question_skill_link_models)
            ])

        return question_skill_link_models

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
        question_skill_link_models = cls.query().filter(
            cls.skill_id == skill_id,
            cls.deleted == False) #pylint: disable=singleton-comparison
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
        cls.update_timestamps_multi(question_skill_links)
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

    The id for this model is of the form 'question-[question_id]-[version]'.
    """

    # The id of the question being edited.
    question_id = datastore_services.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_model_association_to_user():
        """This model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user.
        This model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'question_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

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

    question_model_last_updated, question_model_created_on,
    question_state_data.

    The key of each instance is the question id.
    """

    # Time when the question model was last updated (not to be
    # confused with last_updated, which is the time when the
    # question *summary* model was last updated).
    question_model_last_updated = datastore_services.DateTimeProperty(
        indexed=True, required=True)
    # Time when the question model was created (not to be confused
    # with created_on, which is the time when the question *summary*
    # model was created).
    question_model_created_on = datastore_services.DateTimeProperty(
        indexed=True, required=True)
    # The html content for the question.
    question_content = (
        datastore_services.TextProperty(indexed=False, required=True))
    # The ID of the interaction.
    interaction_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    # The misconception ids addressed in the question. This includes
    # tagged misconceptions ids as well as inapplicable misconception
    # ids in the question.
    misconception_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model data has already been exported as a part of the QuestionModel
        export_data function, and thus a new export_data function does not
        need to be defined here.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user, but this isn't exported
        because because noteworthy details that belong to this model have
        already been exported as a part of the QuestionModel export_data
        function.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'question_model_last_updated':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_model_created_on':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_content': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconception_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
