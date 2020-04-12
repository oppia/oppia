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

from core import jobs
from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import search_services

from core.platform import models
import feconf

(collection_models, exp_models) = models.Registry.import_models(
    [models.NAMES.collection, models.NAMES.exploration])


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


class ReplaceAdminIdOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that replaces the usage of 'Admin' in ExplorationCommitLogEntryModel
    and ExplorationRightsSnapshotMetadataModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotMetadataModel,
                exp_models.ExplorationCommitLogEntryModel]

    @staticmethod
    def map(model):
        if isinstance(model, exp_models.ExplorationRightsSnapshotMetadataModel):
            if model.committer_id == 'Admin':
                model.committer_id = feconf.SYSTEM_COMMITTER_ID
                model.put(update_last_updated_time=False)
                yield ('SUCCESS-RENAMED-SNAPSHOT', model.id)
            else:
                yield ('SUCCESS-KEPT-SNAPSHOT', model.id)
        else:
            if model.user_id == 'Admin':
                model.user_id = feconf.SYSTEM_COMMITTER_ID
                model.put(update_last_updated_time=False)
                yield ('SUCCESS-RENAMED-COMMIT', model.id)
            else:
                yield ('SUCCESS-KEPT-COMMIT', model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS-KEPT'):
            yield (key, len(values))
        else:
            yield (key, values)
