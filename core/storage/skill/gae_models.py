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

"""Models for storing the skill data models."""

from __future__ import annotations

from core.constants import constants
from core.platform import models

from typing import Dict, List, Mapping, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models, user_models,) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()


class SkillSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a skill snapshot."""

    pass


class SkillSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a skill snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class SkillCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to skills.

    A new instance of this model is created and saved every time a commit to
    SkillModel occurs.

    The id for this model is of the form 'skill-[skill_id]-[version]'.
    """

    # The id of the skill being edited.
    skill_id = datastore_services.StringProperty(indexed=True, required=True)

    @classmethod
    def get_instance_id(cls, skill_id: str, version: int) -> str:
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            skill_id: str. The id of the skill being edited.
            version: int. The version number of the skill after the commit.

        Returns:
            str. The commit id with the skill id and version number.
        """
        return 'skill-%s-%s' % (skill_id, version)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The history of commits is not relevant for the purposes of Takeout
        since commits don't contain relevant data corresponding to users.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because the history of commits isn't deemed as useful for users since
        commit logs don't contain relevant data corresponding to those users.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'skill_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class SkillModel(base_models.VersionedModel):
    """Model for storing Skills.

    This class should only be imported by the skill services file
    and the skill model test file.
    """

    SNAPSHOT_METADATA_CLASS = SkillSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = SkillSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = SkillCommitLogEntryModel
    ALLOW_REVERT = False

    # The description of the skill.
    description = datastore_services.StringProperty(required=True, indexed=True)
    # The schema version for each of the misconception dicts.
    misconceptions_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The schema version for each of the rubric dicts.
    rubric_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # A list of misconceptions associated with the skill, in which each
    # element is a dict.
    misconceptions = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # The rubrics for the skill that explain each difficulty level.
    rubrics = datastore_services.JsonProperty(repeated=True, indexed=False)
    # The ISO 639-1 code for the language this skill is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The schema version for the skill_contents.
    skill_contents_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # A dict representing the skill contents.
    skill_contents = datastore_services.JsonProperty(indexed=False)
    # The prerequisite skills for the skill.
    prerequisite_skill_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # The id to be used by the next misconception added.
    next_misconception_id = (
        datastore_services.IntegerProperty(required=True, indexed=False))
    # The id that the skill is merged into, in case the skill has been
    # marked as duplicate to another one and needs to be merged.
    # This is an optional field.
    superseding_skill_id = datastore_services.StringProperty(indexed=True)
    # A flag indicating whether deduplication is complete for this skill.
    # It will initially be False, and set to true only when there is a value
    # for superseding_skill_id and the merge was completed.
    all_questions_merged = (
        datastore_services.BooleanProperty(indexed=True, required=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_merged_skills(cls) -> List[SkillModel]:
        """Returns the skill models which have been merged.

        Returns:
            list(SkillModel). List of skill models which have been merged.
        """

        return [skill for skill in cls.query() if (
            skill.superseding_skill_id is not None and (
                len(skill.superseding_skill_id) > 0))]

    def compute_models_to_commit(
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
        commit_cmds: base_models.AllowedCommitCmdsListType,
        # We expect Mapping because we want to allow models that inherit
        # from BaseModel as the values, if we used Dict this wouldn't
        # be allowed.
        additional_models: Mapping[str, base_models.BaseModel]
    ) -> base_models.ModelsToPutDict:
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str|None. The commit description message, for
                unpublished skills, it may be equal to None.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
            additional_models: dict(str, BaseModel). Additional models that are
                needed for the commit process.

        Returns:
            ModelsToPutDict. A dict of models that should be put into
            the datastore.
        """
        models_to_put = super().compute_models_to_commit(
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            additional_models
        )

        skill_commit_log_entry = SkillCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type, commit_message,
            commit_cmds, constants.ACTIVITY_STATUS_PUBLIC, False
        )
        skill_commit_log_entry.skill_id = self.id
        return {
            'snapshot_metadata_model': models_to_put['snapshot_metadata_model'],
            'snapshot_content_model': models_to_put['snapshot_content_model'],
            'commit_log_model': skill_commit_log_entry,
            'versioned_model': models_to_put['versioned_model'],
        }

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconceptions_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rubric_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconceptions': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rubrics': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_contents_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_contents': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'prerequisite_skill_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'next_misconception_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'superseding_skill_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'all_questions_merged': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_by_description(cls, description: str) -> Optional[SkillModel]:
        """Gets SkillModel by description. Returns None if the skill with
        description doesn't exist.

        Args:
            description: str. The description of the skill.

        Returns:
            SkillModel|None. The skill model of the skill or None if not
            found.
        """
        return cls.get_all().filter(cls.description == description).get()


class SkillSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Skill.

    This should be used whenever the content blob of the skill is not
    needed (e.g. search results, etc).

    A SkillSummaryModel instance stores the following information:

        id, description, language_code, last_updated, created_on, version.

    The key of each instance is the skill id.
    """

    # The description of the skill.
    description = datastore_services.StringProperty(required=True, indexed=True)
    # The number of misconceptions associated with the skill.
    misconception_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The number of worked examples in the skill.
    worked_examples_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The ISO 639-1 code for the language this skill is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # Time when the skill model was last updated (not to be
    # confused with last_updated, which is the time when the
    # skill *summary* model was last updated).
    skill_model_last_updated = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    # Time when the skill model was created (not to be confused
    # with created_on, which is the time when the skill *summary*
    # model was created).
    skill_model_created_on = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    version = datastore_services.IntegerProperty(required=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconception_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'worked_examples_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_model_last_updated':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_model_created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    # TODO(#13523): Change the return value of the function below from
    # tuple(list, str|None, bool) to a domain object.
    @classmethod
    def fetch_page(
        cls,
        page_size: int,
        urlsafe_start_cursor: Optional[str],
        sort_by: Optional[str]
    ) -> Tuple[Sequence[SkillSummaryModel], Optional[str], bool]:
        """Returns the models according to values specified.

        Args:
            page_size: int. Number of skills to fetch.
            urlsafe_start_cursor: str|None. The cursor to the next page or
                None. If None, this means that the search should start from the
                first page of results.
            sort_by: str|None. A string indicating how to sort the result.

        Returns:
            3-tuple(query_models, urlsafe_start_cursor, more). where:
                query_models: list(SkillSummary). The list of summaries
                    of skills starting at the given cursor.
                urlsafe_start_cursor: str or None. A query cursor pointing to
                    the next batch of results. If there are no more results,
                    this might be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results
                    after this batch.
        """
        cursor = (
            datastore_services.make_cursor(urlsafe_cursor=urlsafe_start_cursor))
        sort = -cls.skill_model_created_on
        if sort_by == (
                constants.TOPIC_SKILL_DASHBOARD_SORT_OPTIONS[
                    'DecreasingCreatedOn']):
            sort = cls.skill_model_created_on
        elif sort_by == (
                constants.TOPIC_SKILL_DASHBOARD_SORT_OPTIONS[
                    'IncreasingUpdatedOn']):
            sort = -cls.skill_model_last_updated
        elif sort_by == (
                constants.TOPIC_SKILL_DASHBOARD_SORT_OPTIONS[
                    'DecreasingUpdatedOn']):
            sort = cls.skill_model_last_updated

        sort_query = cls.query().order(sort)
        fetch_result: Tuple[
            Sequence[SkillSummaryModel], datastore_services.Cursor, bool
        ] = sort_query.fetch_page(page_size, start_cursor=cursor)
        query_models, next_cursor, _ = fetch_result
        # TODO(#13462): Refactor this so that we don't do the lookup.
        # Do a forward lookup so that we can know if there are more values.
        fetch_result = sort_query.fetch_page(page_size + 1, start_cursor=cursor)
        plus_one_query_models, _, _ = fetch_result
        # The urlsafe returns bytes and we need to decode them to string.
        more_results = len(plus_one_query_models) == page_size + 1
        new_urlsafe_start_cursor = (
            next_cursor.urlsafe().decode('utf-8')
            if (next_cursor and more_results) else None
        )
        return (
            query_models,
            new_urlsafe_start_cursor,
            more_results
        )
