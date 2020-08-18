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
