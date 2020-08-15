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

"""One-off jobs for activities."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core import jobs
from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import search_services
from core.platform import models
import feconf

(
    collection_models, exp_models,
    question_models, skill_models,
    story_models, topic_models) = models.Registry.import_models([
        models.NAMES.collection, models.NAMES.exploration,
        models.NAMES.question, models.NAMES.skill,
        models.NAMES.story, models.NAMES.topic])


class ActivityContributorsSummaryOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that computes the number of commits done by contributors for
    each collection and exploration.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionModel, exp_models.ExplorationModel]

    @staticmethod
    def map(model):
        if model.deleted:
            return

        if isinstance(model, collection_models.CollectionModel):
            summary = collection_services.get_collection_summary_by_id(model.id)
            summary.contributors_summary = (
                collection_services.compute_collection_contributors_summary(
                    model.id))
            summary.contributor_ids = list(summary.contributors_summary)
            collection_services.save_collection_summary(summary)
        else:
            summary = exp_fetchers.get_exploration_summary_by_id(model.id)
            summary.contributors_summary = (
                exp_services.compute_exploration_contributors_summary(model.id))
            summary.contributor_ids = list(summary.contributors_summary)
            exp_services.save_exploration_summary(summary)
        yield ('SUCCESS', model.id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class AuditContributorsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Audit job that compares the contents of contributor_ids and
    contributors_summary.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel,
                collection_models.CollectionSummaryModel]

    @staticmethod
    def map(model):
        ids_set = set(model.contributor_ids)
        summary_set = set(model.contributors_summary)
        if len(ids_set) != len(model.contributor_ids):
            # When the contributor_ids contain duplicate ids.
            yield (
                'DUPLICATE_IDS',
                (model.id, model.contributor_ids, model.contributors_summary)
            )
        if ids_set - summary_set:
            # When the contributor_ids contain id that is not in
            # contributors_summary.
            yield (
                'MISSING_IN_SUMMARY',
                (model.id, model.contributor_ids, model.contributors_summary)
            )
        if summary_set - ids_set:
            # When the contributors_summary contains id that is not in
            # contributor_ids.
            yield (
                'MISSING_IN_IDS',
                (model.id, model.contributor_ids, model.contributors_summary)
            )
        yield ('SUCCESS', model.id)

    @staticmethod
    def reduce(key, values):
        if key == 'SUCCESS':
            yield (key, len(values))
        else:
            yield (key, values)


class IndexAllActivitiesJobManager(jobs.BaseMapReduceOneOffJobManager):
    """Job that indexes all explorations and collections and compute their
    ranks.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel,
                collection_models.CollectionSummaryModel]

    @staticmethod
    def map(item):
        if not item.deleted:
            if isinstance(item, exp_models.ExpSummaryModel):
                search_services.index_exploration_summaries([item])
            else:
                search_services.index_collection_summaries([item])

    @staticmethod
    def reduce(key, values):
        pass


class RemoveCommitUsernamesOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that sets the username in *CommitLogEntryModels to None in order to
    remove it from the datastore.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(RemoveCommitUsernamesOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            collection_models.CollectionCommitLogEntryModel,
            exp_models.ExplorationCommitLogEntryModel,
            question_models.QuestionCommitLogEntryModel,
            skill_models.SkillCommitLogEntryModel,
            story_models.StoryCommitLogEntryModel,
            topic_models.TopicCommitLogEntryModel,
            topic_models.SubtopicPageCommitLogEntryModel
        ]

    @staticmethod
    def map(commit_model):
        class_name = commit_model.__class__.__name__
        # This is an only way to remove the field from the model,
        # see https://stackoverflow.com/a/15116016/3688189 and
        # https://stackoverflow.com/a/12701172/3688189.
        if 'username' in commit_model._properties:  # pylint: disable=protected-access
            del commit_model._properties['username']  # pylint: disable=protected-access
            if 'username' in commit_model._values:  # pylint: disable=protected-access
                del commit_model._values['username']  # pylint: disable=protected-access
            commit_model.put(update_last_updated_time=False)
            yield ('SUCCESS_REMOVED - %s' % class_name, commit_model.id)
        else:
            yield ('SUCCESS_ALREADY_REMOVED - %s' % class_name, commit_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class FixCommitLastUpdatedOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that sets the last_updated in *CommitLogEntryModels to created_on if
    the last_updated is in the timespan when user ID migration was done.
    """

    MIGRATION_START = datetime.datetime.strptime(
        '2020-06-28T07:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
    MIGRATION_END = datetime.datetime.strptime(
        '2020-06-30T13:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
    TEST_SERVER_MIGRATION_START = datetime.datetime.strptime(
        '2020-06-12T07:00:00Z', '%Y-%m-%dT%H:%M:%SZ')
    TEST_SERVER_MIGRATION_END = datetime.datetime.strptime(
        '2020-06-14T13:00:00Z', '%Y-%m-%dT%H:%M:%SZ')

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(FixCommitLastUpdatedOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            collection_models.CollectionCommitLogEntryModel,
            exp_models.ExplorationCommitLogEntryModel,
            question_models.QuestionCommitLogEntryModel,
            skill_models.SkillCommitLogEntryModel,
            story_models.StoryCommitLogEntryModel,
            topic_models.TopicCommitLogEntryModel,
            topic_models.SubtopicPageCommitLogEntryModel
        ]

    @staticmethod
    def map(commit_model):
        class_name = commit_model.__class__.__name__
        last_updated = commit_model.last_updated
        created_on = commit_model.created_on
        if (FixCommitLastUpdatedOneOffJob.MIGRATION_START < last_updated <
                FixCommitLastUpdatedOneOffJob.MIGRATION_END):
            commit_model.last_updated = commit_model.created_on
            commit_model.put(update_last_updated_time=False)
            yield ('SUCCESS_FIXED - %s' % class_name, commit_model.id)
        elif (FixCommitLastUpdatedOneOffJob.TEST_SERVER_MIGRATION_START <
              last_updated <
              FixCommitLastUpdatedOneOffJob.TEST_SERVER_MIGRATION_END):
            commit_model.last_updated = commit_model.created_on
            commit_model.put(update_last_updated_time=False)
            yield (
                'SUCCESS_TEST_SERVER_FIXED - %s' % class_name, commit_model.id)
        elif (datetime.timedelta(0) < last_updated - created_on <
              datetime.timedelta(hours=1)):
            yield ('SUCCESS_NEWLY_CREATED - %s' % class_name, commit_model.id)
        elif commit_model.user_id in feconf.SYSTEM_USERS.keys():
            yield ('SUCCESS_ADMIN - %s' % class_name, commit_model.id)
        else:
            yield ('FAILURE_INCORRECT - %s' % class_name, commit_model.id)


    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key.startswith('FAILURE_INCORRECT'):
            yield (key, values)
        else:
            yield (key, len(values))


class AddMentionedUserIdsContentJob(jobs.BaseMapReduceOneOffJobManager):
    """For every snapshot content of a rights model, merge the data from all
    the user id fields in content together and put them in the
    mentioned_user_ids field of an appropriate RightsSnapshotMetadataModel.
    """

    @staticmethod
    def _add_collection_user_ids(snapshot_content_model):
        """Merge the user ids from the snapshot and put them in the parent
        collection rights model.
        """
        content_dict = (
            collection_models.CollectionRightsModel.convert_to_valid_dict(
                snapshot_content_model.content))
        reconstituted_rights_model = (
            collection_models.CollectionRightsModel(**content_dict))
        snapshot_metadata_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                snapshot_content_model.id))
        snapshot_metadata_model.mentioned_user_ids = list(
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids))
        snapshot_metadata_model.put(update_last_updated_time=False)

    @staticmethod
    def _add_exploration_user_ids(snapshot_content_model):
        """Merge the user ids from the snapshot and put them in the parent
        exploration rights model.
        """
        content_dict = (
            exp_models.ExplorationRightsModel.convert_to_valid_dict(
                snapshot_content_model.content))
        reconstituted_rights_model = (
            exp_models.ExplorationRightsModel(**content_dict))
        snapshot_metadata_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                snapshot_content_model.id))
        snapshot_metadata_model.mentioned_user_ids = list(
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids))
        snapshot_metadata_model.put(update_last_updated_time=False)

    @staticmethod
    def _add_topic_user_ids(snapshot_content_model):
        """Merge the user ids from the snapshot and put them in the parent
        topic rights model.
        """
        reconstituted_rights_model = topic_models.TopicRightsModel(
            **snapshot_content_model.content)
        snapshot_metadata_model = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                snapshot_content_model.id))
        snapshot_metadata_model.mentioned_user_ids = set(
            reconstituted_rights_model.manager_ids)
        snapshot_metadata_model.put(update_last_updated_time=False)

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(AddMentionedUserIdsContentJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotContentModel,
                exp_models.ExplorationRightsSnapshotContentModel,
                topic_models.TopicRightsSnapshotContentModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        class_name = rights_snapshot_model.__class__.__name__
        if isinstance(
                rights_snapshot_model,
                collection_models.CollectionRightsSnapshotContentModel):
            AddMentionedUserIdsContentJob._add_collection_user_ids(
                rights_snapshot_model)
        elif isinstance(
                rights_snapshot_model,
                exp_models.ExplorationRightsSnapshotContentModel):
            AddMentionedUserIdsContentJob._add_exploration_user_ids(
                rights_snapshot_model)
        elif isinstance(
                rights_snapshot_model,
                topic_models.TopicRightsSnapshotContentModel):
            AddMentionedUserIdsContentJob._add_topic_user_ids(
                rights_snapshot_model)
        yield ('SUCCESS-%s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))


class AddMentionedUserIdsMetadataJob(jobs.BaseMapReduceOneOffJobManager):
    """For every snapshot metadata of a rights model, merge the data from all
    the user id fields in commit_cmds together and put them in the
    mentioned_user_ids field of an appropriate RightsSnapshotMetadataModel.
    """

    @staticmethod
    def are_commit_cmds_role_change(commit_cmds):
        """Check if commit_cmds are of a role change type and there is just one
        commit.

        Args:
            commit_cmds: list(dict(str, str)). List of commit commands.

        Returns:
            bool. True when there is one command and it is of role_change type.
        """
        role_change_cmds = (
            feconf.CMD_CHANGE_ROLE,
            feconf.CMD_REMOVE_MANAGER_ROLE)
        return (
            len(commit_cmds) == 1 and commit_cmds[0]['cmd'] in role_change_cmds)

    @staticmethod
    def _add_col_and_exp_user_ids(snapshot_model):
        """Merge the user ids from the snapshot and put them in the parent
        collection rights model.
        """
        if AddMentionedUserIdsMetadataJob.are_commit_cmds_role_change(
                snapshot_model.commit_cmds):
            mentioned_user_ids = set(snapshot_model.mentioned_user_ids)
            mentioned_user_ids.add(snapshot_model.commit_cmds[0]['assignee_id'])
            snapshot_model.mentioned_user_ids = list(mentioned_user_ids)
            snapshot_model.put(update_last_updated_time=False)

    @staticmethod
    def _add_topic_user_ids(snapshot_model):
        """Merge the user ids from the snapshot and put them in the parent
        topic rights model.
        """
        commit_cmds = snapshot_model.commit_cmds
        if AddMentionedUserIdsMetadataJob.are_commit_cmds_role_change(
                commit_cmds):
            mentioned_user_ids = set(snapshot_model.mentioned_user_ids)
            if commit_cmds[0]['cmd'] == feconf.CMD_CHANGE_ROLE:
                mentioned_user_ids.add(
                    snapshot_model.commit_cmds[0]['assignee_id'])
            elif commit_cmds[0]['cmd'] == feconf.CMD_REMOVE_MANAGER_ROLE:
                mentioned_user_ids.add(
                    snapshot_model.commit_cmds[0]['removed_user_id'])
            snapshot_model.mentioned_user_ids = list(mentioned_user_ids)
            snapshot_model.put(update_last_updated_time=False)

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(AddMentionedUserIdsMetadataJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotMetadataModel,
                exp_models.ExplorationRightsSnapshotMetadataModel,
                topic_models.TopicRightsSnapshotMetadataModel]

    @staticmethod
    def map(snapshot_model):
        """Implements the map function for this job."""
        class_name = snapshot_model.__class__.__name__
        if isinstance(
                snapshot_model,
                collection_models.CollectionRightsSnapshotMetadataModel):
            AddMentionedUserIdsMetadataJob._add_col_and_exp_user_ids(
                snapshot_model)
        elif isinstance(
                snapshot_model,
                exp_models.ExplorationRightsSnapshotMetadataModel):
            AddMentionedUserIdsMetadataJob._add_col_and_exp_user_ids(
                snapshot_model)
        elif isinstance(
                snapshot_model,
                topic_models.TopicRightsSnapshotMetadataModel):
            AddMentionedUserIdsMetadataJob._add_topic_user_ids(snapshot_model)
        yield ('SUCCESS-%s' % class_name, snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))
