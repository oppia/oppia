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

import ast

from core import jobs
from core.domain import exp_domain
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils

from google.appengine.ext import ndb



class ExpSummaryRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class ExpSummariesAggregator(jobs.BaseContinuousComputationManager):
    """A one-off-computation job computing summaries of all explorations.
    The summaries store the following information:

        title, category, objective, language_code, skill_tags,
        last_updated, created_on, status (private, public or
        publicized), community_owned, owner_ids, editor_ids,
        viewer_ids, version.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return ExpSummaryRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return ExpSummaryMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass


class ExpSummaryMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates summaries of explorations, which can be
    used to get e.g. the gallery. For every ExplorationModel entity,
    create a ExpSummaryModel entity containing information described
    in ExpSummariesAggregator.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return ExpSummariesAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exploration_model):
        from core.domain import exp_services
        if ExpSummaryMRJobManager._entity_created_before_job_queued(
				exploration_model):
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
        # We're inline importing here to break import loops like this: (-> means imports)
        # exp_services -> event_services -> jobs_registry -> exp_jobs -> exp_services.
        from core.domain import exp_services
        exp_services.index_explorations_given_ids([item.id])
