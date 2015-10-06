# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Jobs for explorations."""

__author__ = 'Frederik Creemers'

import logging

from core import jobs
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
import feconf
import utils


class ExpSummariesCreationOneOffJob(jobs.BaseMapReduceJobManager):
    """Job that calculates summaries of explorations, which can be
    used to get e.g. the gallery. For every ExplorationModel entity,
    create a ExpSummaryModel entity containing information described
    in ExpSummariesAggregator.

    The summaries store the following information:
        title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public or
        publicized), community_owned, owner_ids, editor_ids,
        viewer_ids, version.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exploration_model):
        from core.domain import exp_services
        if not exploration_model.deleted:
            exp_services.create_exploration_summary(exploration_model.id)

    @staticmethod
    def reduce(exp_id, list_of_exps):
        pass


class IndexAllExplorationsJobManager(jobs.BaseMapReduceJobManager):
    """Job that indexes all explorations"""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        # We're inline importing here to break import loops like this: (->
        # means imports):
        #   exp_services -> event_services -> jobs_registry ->
        #   exp_jobs -> exp_services.
        from core.domain import exp_services
        if not item.deleted:
            exp_services.index_explorations_given_ids([item.id])


class ExplorationValidityJobManager(jobs.BaseMapReduceJobManager):
    """Job that checks that all explorations have appropriate validation
    statuses.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_services
        from core.domain import rights_manager

        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)
        exp_rights = rights_manager.get_exploration_rights(item.id)

        try:
            if exp_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
                exploration.validate()
            else:
                exploration.validate(strict=True)
        except utils.ValidationError as e:
            yield (item.id, unicode(e).encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class SearchRankerRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class SearchRanker(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that refreshes the search ranking.

    This job does not have a realtime component. There will be a delay in
    propagating new updates to the gallery; the length of the delay will be
    approximately the time it takes a batch job to run.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return SearchRankerRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return SearchRankerMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass


class SearchRankerMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Manager for a MapReduce job that iterates through all explorations and
    recomputes their search rankings.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return SearchRanker

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_services
        exp_services.index_explorations_given_ids([item.id])

    @staticmethod
    def reduce(key, stringified_values):
        pass


class ExplorationMigrationJobManager(jobs.BaseMapReduceJobManager):
    """A reusable one-time job that may be used to migrate exploration schema
    versions. This job will load all existing explorations from the data store
    and immediately store them back into the data store. The loading process of
    an exploration in exp_services automatically performs schema updating. This
    job persists that conversion work, keeping explorations up-to-date and
    improving the load time of new explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_domain
        from core.domain import exp_services

        if item.deleted:
            return

        # Do not upgrade explorations that fail non-strict validation.
        old_exploration = exp_services.get_exploration_by_id(item.id)
        try:
            old_exploration.validate()
        except Exception as e:
            logging.error(
                'Exploration %s failed non-strict validation: %s' %
                (item.id, e))
            return

        # If the exploration model being stored in the datastore is not the
        # most up-to-date states schema version, then update it.
        if (item.states_schema_version !=
                feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
            # Note: update_exploration does not need to apply a change list in
            # order to perform a migration. See the related comment in
            # exp_services.apply_change_list for more information.
            commit_cmds = [{
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': str(item.states_schema_version),
                'to_version': str(
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
            }]
            exp_services.update_exploration(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update exploration states from schema version %d to %d.' % (
                    item.states_schema_version,
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION))

    @staticmethod
    def reduce(key, values):
        yield (key, values)
