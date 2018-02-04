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

"""Jobs operating on explorations that can be used for production tests.
To use these jobs, first need to register them in jobs_registry (at
the moment they are not displayed there to avoid accidental use)."""

from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
import feconf

(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])


class ExpCopiesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class ExpCopiesAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job creating 10 published copies of every
    existing exploration, with the eid being '[old_eid]copy[copy_number]',
    title 'Copy' and category 'Copies'.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

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
    """A continuous-computation job creating 10 published copies of every
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
        if ExpCopiesMRJobManager._entity_created_before_job_queued(item):
            for count in range(10):
                yield ('%scopy%d' % (item.id, count),
                       exp_services.get_exploration_from_model(item).to_yaml())

    @staticmethod
    def reduce(exp_id, list_of_exps):
        for stringified_exp in list_of_exps:
            exploration = exp_domain.Exploration.from_untitled_yaml(
                exp_id, 'Copy', 'Copies', stringified_exp)
            exp_services.save_new_exploration(
                feconf.SYSTEM_COMMITTER_ID, exploration)
            system_user = user_services.get_system_user()
            rights_manager.publish_exploration(
                system_user, exp_id)


# Job to delete all copied explorations.
class DeleteExpCopiesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class DeleteExpCopiesAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job deleting all explorations in category
    'Copies'.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

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
        if item.category == 'Copies':
            exp_services.delete_exploration(
                feconf.SYSTEM_COMMITTER_ID, item.id, force_deletion=True)

    @staticmethod
    def reduce(exp_id, list_of_exps):
        pass
