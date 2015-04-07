"""Jobs for open feedbacks."""

from core import jobs
from core.platform import models
(base_models, feedback_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.feedback, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils

from google.appengine.ext import ndb


class OpenFeedbacksRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class OpenFeedbacksStatisticsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes the number of open feedbacks
    for explorations.

    This job does not have a realtime component. There will be a delay in
    propagating new updates to the dashboard; the length of the delay will be
    approximately the time it takes a batch job to run.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return OpenFeedbacksRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return OpenFeedbacksMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass

    # Public query methods.
    @classmethod
    def get_num_of_open_feedbacks(cls, exploration_id):
        """
        Args:
          - exploration_id: id of the exploration to get statistics for
          - exploration_version: str. Which version of the exploration to get
              statistics for; this can be a version number, the string 'all',
              or the string 'none'.

        Returns the number of open feedbacks.
        """

        exp_model = user_models.OpenFeedbacksModel.get(
            exploration_id, strict=False)
        return exp_model.num_of_open_feedbacks if exp_model else None


class OpenFeedbacksMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """
    Job that calculates and creates summary models for exploration view.
    Includes: * number of open feedbacks for an exploration.
    """
    
    STATUS_CHOICES_OPEN = 'open'

    @classmethod
    def _get_continuous_computation_class(cls):
        return OpenFeedbacksStatisticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackThreadModel]

    @staticmethod
    def map(item):
        if (item.status == STATUS_CHOICES_OPEN):
            feedback_models.OpenFeedbacksModel.create_or_update(
                item.id.split('.')[0])


    @staticmethod
    def reduce(key, stringified_values):
        pass
