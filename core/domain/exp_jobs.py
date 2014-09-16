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

__author__ = 'Marcel Schmittfull, Frederik Creemers'

import ast

from core import jobs
from core.domain import exp_domain
#from core.domain import exp_services
#from core.domain import rights_manager
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
transaction_services = models.Registry.import_transaction_services()

import feconf

from google.appengine.ext import ndb
import utils


# TODO(msl): only batch job implemented so far, still need realtime layer

class ExpSummaryRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    # exploration summary
    exp_summary = ndb.JsonProperty(repeated=True)


class ExpSummaryAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job computing summaries of all explorations.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        # TODO(msl): This job does not listen to any events, still listing
        # dummy event here jobs_test assumes >=1 events listened to.
        return [feconf.EVENT_TYPE_START_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return ExpSummaryRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return ExpSummaryMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass

    # Public query method.
    @classmethod
    def get_exp_summaries(cls):
        """Return exploration summaries as a dict keyed by exploration id.
        """
        summary_dicts = {}
        summary_models = exp_models.ExpSummaryModel.get_all()
        if summary_models is not None:
            for summary_model in summary_models:
                summary_dicts[summary_model.id] = summary_model
        return summary_dicts


class ExpSummaryMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates summaries of explorations, which can be
    used to get e.g. the gallery. For every ExplorationModel entity,
    create a ExpSummaryModel entity containing exploration id, title,
    category, etc (see gae_models for a list of all entries).
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return ExpSummaryAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if ExpSummaryMRJobManager._entity_created_before_job_queued(item):
            # create new ExpSummaryModel entity
            exp_models.ExpSummaryModel.summarize_exploration(item)
            yield (item.id, None)

    @staticmethod
    def reduce(exp_id, list_of_exps):
        pass



## Code below is used for production tests (copy and delete many explorations)

class ExpCopiesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    ExpCopy = ndb.JsonProperty(repeated=True)

class ExpCopiesAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job creating 10 copies of every
    existing exploration, with the eid being '[old_eid]copy[copy_number]',
    title 'Copy' and category 'Copies'.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        # TODO(msl): This job does not listen to any events, still listing
        # dummy event here jobs_test assumes >=1 events listened to.
        return [feconf.EVENT_TYPE_START_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return ExpCopiesRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return ExpCopiesMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass

class ExpCopiesMRJobManager(
    jobs.BaseMapReduceJobManagerForContinuousComputations):
    """A continuous-computation job creating 10 copies of every
    existing exploration, with the eid being '[old_eid]copy[copy_number]',
    title 'Copy' and category 'Copies'.
    """

    @classmethod
    def _get_continuous_computation_class(cls):
        return ExpCopiesAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_services
        if ExpCopiesMRJobManager._entity_created_before_job_queued(item):
            for count in range(0, 10):
                yield ('%scopy%d' % (item.id, count),
                       exp_services.get_exploration_from_model(item).to_yaml())

    @staticmethod
    def reduce(exp_id, list_of_exps):
        from core.domain import exp_services
        from core.domain import rights_manager
        for stringified_exp in list_of_exps:
            exploration = exp_domain.Exploration.from_yaml(exp_id, 'Copy', 'Copies', stringified_exp)
            exp_services.save_new_exploration(feconf.ADMIN_COMMITTER_ID,
                                              exploration)
            rights_manager.publish_exploration(
                feconf.ADMIN_COMMITTER_ID, exp_id)



## Job to delete all copied explorations

class DeleteExpCopiesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass

class DeleteExpCopiesAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job deleting all explorations in category
    'Copies'.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        # TODO(msl): This job does not listen to any events, still listing
        # dummy event here jobs_test assumes >=1 events listened to.
        return [feconf.EVENT_TYPE_START_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return DeleteExpCopiesRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return DeleteExpCopiesMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass

class DeleteExpCopiesMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that deletes all explorations in category 'Copies'.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return DeleteExpCopiesAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_services
        if item.category == 'Copies':
            exp_services.delete_exploration(feconf.ADMIN_COMMITTER_ID,
                                            item.id,
                                            force_deletion=True)

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
