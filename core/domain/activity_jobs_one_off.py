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

from constants import constants
from core import jobs
from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import question_services
from core.domain import search_services
from core.domain import skill_services
from core.platform import models
import feconf
import python_utils

(
    base_models, config_models, collection_models, exp_models,
    skill_models, story_models, topic_models, subtopic_models,
    question_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.config, models.NAMES.collection,
    models.NAMES.exploration, models.NAMES.skill, models.NAMES.story,
    models.NAMES.topic, models.NAMES.subtopic, models.NAMES.question
])
transaction_services = models.Registry.import_transaction_services()


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


class AddContentUserIdsContentJob(jobs.BaseMapReduceOneOffJobManager):
    """For every snapshot content of a rights model, merge the data from all
    the user id fields in content together and put them in the
    content_user_ids field of an appropriate RightsSnapshotMetadataModel.
    """

    @staticmethod
    def _add_collection_user_ids(snapshot_content_model):
        """Merge the user ids from the snapshot content and put them in
        the snapshot metadata content_user_ids field.
        """
        content_dict = (
            collection_models.CollectionRightsModel.convert_to_valid_dict(
                snapshot_content_model.content))
        reconstituted_rights_model = (
            collection_models.CollectionRightsModel(**content_dict))
        snapshot_metadata_model = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                snapshot_content_model.id))
        snapshot_metadata_model.content_user_ids = list(sorted(
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids)))
        snapshot_metadata_model.update_timestamps(
            update_last_updated_time=False)
        snapshot_metadata_model.put()

    @staticmethod
    def _add_exploration_user_ids(snapshot_content_model):
        """Merge the user ids from the snapshot content and put them in
        the snapshot metadata content_user_ids field.
        """
        content_dict = (
            exp_models.ExplorationRightsModel.convert_to_valid_dict(
                snapshot_content_model.content))
        reconstituted_rights_model = (
            exp_models.ExplorationRightsModel(**content_dict))
        snapshot_metadata_model = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                snapshot_content_model.id))
        snapshot_metadata_model.content_user_ids = list(sorted(
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids)))
        snapshot_metadata_model.update_timestamps(
            update_last_updated_time=False)
        snapshot_metadata_model.put()

    @staticmethod
    def _add_topic_user_ids(snapshot_content_model):
        """Merge the user ids from the snapshot content and put them in
        the snapshot metadata content_user_ids field.
        """
        reconstituted_rights_model = topic_models.TopicRightsModel(
            **snapshot_content_model.content)
        snapshot_metadata_model = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                snapshot_content_model.id))
        snapshot_metadata_model.content_user_ids = list(sorted(set(
            reconstituted_rights_model.manager_ids)))
        snapshot_metadata_model.update_timestamps(
            update_last_updated_time=False)
        snapshot_metadata_model.put()

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(AddContentUserIdsContentJob, cls).enqueue(
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
            AddContentUserIdsContentJob._add_collection_user_ids(
                rights_snapshot_model)
        elif isinstance(
                rights_snapshot_model,
                exp_models.ExplorationRightsSnapshotContentModel):
            AddContentUserIdsContentJob._add_exploration_user_ids(
                rights_snapshot_model)
        elif isinstance(
                rights_snapshot_model,
                topic_models.TopicRightsSnapshotContentModel):
            AddContentUserIdsContentJob._add_topic_user_ids(
                rights_snapshot_model)
        yield ('SUCCESS-%s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))


class AuditSnapshotMetadataModelsJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits commit_cmds field of the snapshot metadata models. We log
    the length of the commit_cmd, the possible 'cmd' values, and all the other
    keys.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(AuditSnapshotMetadataModelsJob, cls).enqueue(
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
        if isinstance(
                snapshot_model,
                collection_models.CollectionRightsSnapshotMetadataModel):
            model_type_name = 'collection'
        elif isinstance(
                snapshot_model,
                exp_models.ExplorationRightsSnapshotMetadataModel):
            model_type_name = 'exploration'
        elif isinstance(
                snapshot_model,
                topic_models.TopicRightsSnapshotMetadataModel):
            model_type_name = 'topic'

        if snapshot_model.deleted:
            yield ('%s-deleted' % model_type_name, 1)
            return

        first_commit_cmd = None
        for commit_cmd in snapshot_model.commit_cmds:
            if 'cmd' in commit_cmd:
                cmd_name = commit_cmd['cmd']
                yield ('%s-cmd-%s' % (model_type_name, cmd_name), 1)
            else:
                cmd_name = 'missing_cmd'
                yield ('%s-missing-cmd' % model_type_name, 1)

            if first_commit_cmd is None:
                first_commit_cmd = cmd_name

            for field_key in commit_cmd.keys():
                if field_key != 'cmd':
                    yield (
                        '%s-%s-field-%s' % (
                            model_type_name, cmd_name, field_key
                        ),
                        1
                    )

        if first_commit_cmd is not None:
            yield (
                '%s-%s-length-%s' % (
                    model_type_name,
                    first_commit_cmd,
                    len(snapshot_model.commit_cmds)),
                1
            )
        else:
            yield (
                '%s-length-%s' % (
                    model_type_name, len(snapshot_model.commit_cmds)),
                1
            )

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class ValidateSnapshotMetadataModelsJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that validates whether each SnapshotMetadata model has a
    corresponding CommitLog model pair and the corresponding parent model.
    """

    FAILURE_PREFIX = 'VALIDATION FAILURE'
    SNAPSHOT_METADATA_MODELS = [
        collection_models.CollectionSnapshotMetadataModel,
        collection_models.CollectionRightsSnapshotMetadataModel,
        exp_models.ExplorationSnapshotMetadataModel,
        exp_models.ExplorationRightsSnapshotMetadataModel,
        question_models.QuestionSnapshotMetadataModel,
        skill_models.SkillSnapshotMetadataModel,
        story_models.StorySnapshotMetadataModel,
        topic_models.TopicSnapshotMetadataModel,
        subtopic_models.SubtopicPageSnapshotMetadataModel,
        topic_models.TopicRightsSnapshotMetadataModel
    ]
    MODEL_NAMES_TO_PROPERTIES = {
        'CollectionSnapshotMetadataModel': {
            'parent_model_class': collection_models.CollectionModel,
            'commit_log_model_class': (
                collection_models.CollectionCommitLogEntryModel),
            'id_string_format': 'collection-%s-%s'
        },
        'ExplorationSnapshotMetadataModel': {
            'parent_model_class': exp_models.ExplorationModel,
            'commit_log_model_class': exp_models.ExplorationCommitLogEntryModel,
            'id_string_format': 'exploration-%s-%s'
        },
        'QuestionSnapshotMetadataModel': {
            'parent_model_class': question_models.QuestionModel,
            'commit_log_model_class': (
                question_models.QuestionCommitLogEntryModel),
            'id_string_format': 'question-%s-%s'
        },
        'SkillSnapshotMetadataModel': {
            'parent_model_class': skill_models.SkillModel,
            'commit_log_model_class': skill_models.SkillCommitLogEntryModel,
            'id_string_format': 'skill-%s-%s'
        },
        'StorySnapshotMetadataModel': {
            'parent_model_class': story_models.StoryModel,
            'commit_log_model_class': story_models.StoryCommitLogEntryModel,
            'id_string_format': 'story-%s-%s'
        },
        'TopicSnapshotMetadataModel': {
            'parent_model_class': topic_models.TopicModel,
            'commit_log_model_class': topic_models.TopicCommitLogEntryModel,
            'id_string_format': 'topic-%s-%s'
        },
        'SubtopicPageSnapshotMetadataModel': {
            'parent_model_class': subtopic_models.SubtopicPageModel,
            'commit_log_model_class': (
                subtopic_models.SubtopicPageCommitLogEntryModel),
            'id_string_format': 'subtopicpage-%s-%s'
        },
        'TopicRightsSnapshotMetadataModel': {
            'parent_model_class': topic_models.TopicRightsModel,
            'commit_log_model_class': topic_models.TopicCommitLogEntryModel,
            'id_string_format': 'rights-%s-%s'
        },
        'CollectionRightsSnapshotMetadataModel': {
            'parent_model_class': collection_models.CollectionRightsModel,
            'commit_log_model_class': (
                collection_models.CollectionCommitLogEntryModel),
            'id_string_format': 'rights-%s-%s'
        },
        'ExplorationRightsSnapshotMetadataModel': {
            'parent_model_class': exp_models.ExplorationRightsModel,
            'commit_log_model_class': exp_models.ExplorationCommitLogEntryModel,
            'id_string_format': 'rights-%s-%s'
        },
    }
    # This list consists of the rights snapshot metadata models for which
    # the commit log model is not created when the commit cmd is "create"
    # or "delete".
    MODEL_NAMES_WITH_PARTIAL_COMMIT_LOGS = [
        'CollectionRightsSnapshotMetadataModel',
        'ExplorationRightsSnapshotMetadataModel'
    ]

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of SnapshotMetadata models that is associated
        with a CommitLogEntry model.
        """
        return ValidateSnapshotMetadataModelsJob.SNAPSHOT_METADATA_MODELS

    @staticmethod
    def map(snapshot_model):
        """Implements the map function for this job."""
        job_class = ValidateSnapshotMetadataModelsJob
        class_name = snapshot_model.__class__.__name__
        missing_commit_log_msg = (
            '%s - MISSING COMMIT LOGS' % job_class.FAILURE_PREFIX)
        found_commit_log_msg = 'FOUND COMMIT LOGS'

        # Note: The subtopic snapshot ID is in the format
        # '<topicId>-<subtopicNum>-<version>'.
        model_id, version = snapshot_model.id.rsplit('-', 1)
        model_properties = job_class.MODEL_NAMES_TO_PROPERTIES[class_name]
        commit_log_id = (
            model_properties['id_string_format'] % (model_id, version))
        parent_model_class = (
            model_properties['parent_model_class'].get_by_id(model_id))
        commit_log_model_class = (
            model_properties['commit_log_model_class'].get_by_id(
                commit_log_id))
        if class_name in job_class.MODEL_NAMES_WITH_PARTIAL_COMMIT_LOGS:
            if snapshot_model.commit_type in ['create', 'delete']:
                missing_commit_log_msg = (
                    'COMMIT LOGS SHOULD NOT EXIST AND DOES NOT EXIST')
                found_commit_log_msg = (
                    '%s - COMMIT LOGS SHOULD NOT EXIST BUT EXISTS' % (
                        job_class.FAILURE_PREFIX))

        message_prefix = (
            missing_commit_log_msg if commit_log_model_class is None
            else found_commit_log_msg)
        yield ('%s - %s' % (message_prefix, class_name), snapshot_model.id)

        if parent_model_class is None:
            yield (
                '%s - MISSING PARENT MODEL - %s' % (
                    job_class.FAILURE_PREFIX, class_name),
                snapshot_model.id)
        else:
            yield ('FOUND PARENT MODEL - %s' % class_name, 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key.startswith(ValidateSnapshotMetadataModelsJob.FAILURE_PREFIX):
            yield (key, values)
        else:
            yield (key, len(values))


class AddMissingCommitLogsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that adds the missing commit log entry model for the corresponding
    snapshot models. These commit log entry model were found missing on running
    a validation job introduced in the PR #10770. This job needs to be run once
    only to fill the missing data.
    """

    # This list consists of the snapshot models whose associated commit log
    # models are missing. The commit logs were found missing in a validation
    # job.
    SNAPSHOT_METADATA_MODELS_WITH_MISSING_COMMIT_LOGS = [
        exp_models.ExplorationRightsSnapshotMetadataModel,
        question_models.QuestionSnapshotMetadataModel,
        skill_models.SkillSnapshotMetadataModel
    ]
    MODEL_NAMES_TO_PROPERTIES = {
        'QuestionSnapshotMetadataModel': {
            'parent_model_class': question_models.QuestionModel,
            'commit_log_model_class': (
                question_models.QuestionCommitLogEntryModel),
            'id_string_format': 'question-%s-%s',
            'id_field': 'question_id',
            'delete_method': question_services.delete_question
        },
        'SkillSnapshotMetadataModel': {
            'parent_model_class': skill_models.SkillModel,
            'commit_log_model_class': skill_models.SkillCommitLogEntryModel,
            'id_string_format': 'skill-%s-%s',
            'id_field': 'skill_id',
            'delete_method': skill_services.delete_skill
        },
        'ExplorationRightsSnapshotMetadataModel': {
            'parent_model_class': exp_models.ExplorationRightsModel,
            'commit_log_model_class': exp_models.ExplorationCommitLogEntryModel,
            'id_string_format': 'rights-%s-%s',
            'id_field': 'exploration_id',
            'delete_method': exp_services.delete_exploration
        }
    }
    # "Public" is the default value for post_commit_status for the
    # question and skill models.
    MODEL_NAMES_WITH_DEFAULT_COMMIT_STATUS = [
        'QuestionSnapshotMetadataModel', 'SkillSnapshotMetadataModel']
    # For the exp rights commit log model, post_commit_status is assigned
    # from the exp rights model.
    MODEL_NAMES_WITH_COMMIT_STATUS_IN_RIGHTS = [
        'ExplorationRightsSnapshotMetadataModel']

    @classmethod
    def entity_classes_to_map_over(cls):
        return cls.SNAPSHOT_METADATA_MODELS_WITH_MISSING_COMMIT_LOGS

    @staticmethod
    def map(snapshot_model):
        job_class = AddMissingCommitLogsOneOffJob
        model_class_name = snapshot_model.__class__.__name__
        model_id, version_str = snapshot_model.id.rsplit('-', 1)
        model_properties = job_class.MODEL_NAMES_TO_PROPERTIES[model_class_name]
        version = int(version_str)
        commit_log_id = (
            model_properties['id_string_format'] % (model_id, version))
        commit_log_model = (
            model_properties['commit_log_model_class'].get_by_id(
                commit_log_id))
        commit_logs_should_exist = True

        parent_model = (
            model_properties['parent_model_class'].get_by_id(model_id))
        if model_class_name == 'ExplorationRightsSnapshotMetadataModel':
            if snapshot_model.commit_type in ['create', 'delete']:
                commit_logs_should_exist = False

        if commit_log_model is not None or not commit_logs_should_exist:
            yield ('Found commit log model-%s' % model_class_name, 1)
            return

        if parent_model is None:
            yield ('Missing Parent Model-No changes-%s' % model_class_name, 1)
            return

        if parent_model.deleted:
            model_properties['delete_method'](
                feconf.SYSTEM_COMMITTER_ID, parent_model.id,
                force_deletion=True)
            yield (
                'SUCCESS-Parent model marked deleted-' +
                'Deleted all related models-%s' % (
                    model_class_name), snapshot_model.id)
            return

        commit_log_model = model_properties['commit_log_model_class'](
            id=python_utils.UNICODE(commit_log_id),
            user_id=snapshot_model.committer_id,
            commit_type=snapshot_model.commit_type,
            commit_message=snapshot_model.commit_message,
            commit_cmds=snapshot_model.commit_cmds,
            created_on=snapshot_model.created_on,
            last_updated=snapshot_model.last_updated,
            version=version
        )
        setattr(
            commit_log_model, model_properties['id_field'], model_id)
        if model_class_name in (
                job_class.MODEL_NAMES_WITH_DEFAULT_COMMIT_STATUS):
            commit_log_model.post_commit_status = (
                constants.ACTIVITY_STATUS_PUBLIC)
        elif model_class_name in (
                job_class.MODEL_NAMES_WITH_COMMIT_STATUS_IN_RIGHTS):
            rights_model = exp_models.ExplorationRightsModel.get_version(
                model_id, version)
            commit_log_model.post_commit_status = rights_model.status
        commit_log_model.post_commit_is_private = (
            commit_log_model.post_commit_status == (
                constants.ACTIVITY_STATUS_PRIVATE))
        commit_log_model.update_timestamps(update_last_updated_time=False)
        commit_log_model.put()
        yield (
            'SUCCESS-Added missing commit log model-%s' % model_class_name,
            snapshot_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, values)
        else:
            yield (key, len(values))


class SnapshotMetadataCommitMsgAuditOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that audits the commit_message field of the
    BaseSnapshotMetadataModels to determine frequency of string sizes. This job
    is temporary and only used once.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(SnapshotMetadataCommitMsgAuditOneOffJob, cls).enqueue(
            job_id, shard_count=16)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            # BaseSnapshotMetadata models.
            config_models.ConfigPropertySnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotMetadataModel,
            collection_models.CollectionSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotMetadataModel,
            exp_models.ExplorationSnapshotMetadataModel,
            skill_models.SkillSnapshotMetadataModel,
            story_models.StorySnapshotMetadataModel,
            subtopic_models.SubtopicPageSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotMetadataModel,
            topic_models.TopicSnapshotMetadataModel,
            question_models.QuestionSnapshotMetadataModel,
            # CommitLogEntry models.
            collection_models.CollectionCommitLogEntryModel,
            exp_models.ExplorationCommitLogEntryModel,
            skill_models.SkillCommitLogEntryModel,
            story_models.StoryCommitLogEntryModel,
            subtopic_models.SubtopicPageCommitLogEntryModel,
            topic_models.TopicCommitLogEntryModel,
            question_models.QuestionCommitLogEntryModel,
        ]

    @staticmethod
    def map(item):
        model_name = item.__class__.__name__
        model_id = item.id
        identifier_message = (
            '%s with id %s. Message: %s' % (
                model_name, model_id, item.commit_message))
        if not item.commit_message or len(item.commit_message) <= 375:
            yield ('LESS_OR_EQUAL_TO_375', 1)
        else:
            yield ('GREATER_THAN_375', identifier_message.encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        if key == 'LESS_OR_EQUAL_TO_375':
            yield (key, len(values))
        else:
            yield (key, values)


class SnapshotMetadataCommitMsgShrinkOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that truncates the length of commit messages to ensure that they do
    not exceed the limit of 375 characters.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(SnapshotMetadataCommitMsgShrinkOneOffJob, cls).enqueue(
            job_id, shard_count=16)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            # BaseSnapshotMetadata models.
            config_models.ConfigPropertySnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotMetadataModel,
            collection_models.CollectionSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotMetadataModel,
            exp_models.ExplorationSnapshotMetadataModel,
            skill_models.SkillSnapshotMetadataModel,
            story_models.StorySnapshotMetadataModel,
            subtopic_models.SubtopicPageSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotMetadataModel,
            topic_models.TopicSnapshotMetadataModel,
            question_models.QuestionSnapshotMetadataModel,
            # CommitLogEntry models.
            collection_models.CollectionCommitLogEntryModel,
            exp_models.ExplorationCommitLogEntryModel,
            skill_models.SkillCommitLogEntryModel,
            story_models.StoryCommitLogEntryModel,
            subtopic_models.SubtopicPageCommitLogEntryModel,
            topic_models.TopicCommitLogEntryModel,
            question_models.QuestionCommitLogEntryModel,
        ]

    @staticmethod
    def map(item):
        model_name = item.__class__.__name__
        model_id = item.id
        identifier_message = (
            '%s with id %s. Message: %s' % (
                model_name, model_id, item.commit_message))
        if item.commit_message and len(item.commit_message) > 375:
            item.commit_message = item.commit_message[:375]
            item.update_timestamps(update_last_updated_time=False)
            item.put()
            yield ('TRUNCATED', identifier_message.encode('utf-8'))
        else:
            yield ('NOT_TRUNCATED', 1)

    @staticmethod
    def reduce(key, values):
        if key == 'NOT_TRUNCATED':
            yield (key, len(values))
        else:
            yield (key, values)
