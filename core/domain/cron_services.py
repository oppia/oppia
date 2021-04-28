# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Service functions relating to cron controllers."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import logging

from core import jobs
from core.platform import models
import feconf

import utils

from mapreduce import model as mapreduce_model

(base_models, job_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.job, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()

# Only non-versioned models should be included in this list. Activities that
# use versioned models should have their own delete functions.
MODEL_CLASSES_TO_MARK_AS_DELETED = (user_models.UserQueryModel,)


def get_stuck_jobs(recency_msecs):
    """Returns a list of jobs which were last updated at most recency_msecs
    milliseconds ago and have experienced more than one retry.

    Returns:
        list(job_models.JobModel). Jobs which have retried at least once and
        haven't finished yet.
    """
    threshold_time = (
        datetime.datetime.utcnow() -
        datetime.timedelta(0, 0, 0, recency_msecs))
    shard_state_model_class = mapreduce_model.ShardState

    # TODO(sll): Clean up old jobs so that this query does not have to iterate
    # over so many elements in a full table scan.
    recent_job_models = shard_state_model_class.all()

    stuck_jobs = []
    for job_model in recent_job_models:
        if job_model.update_time > threshold_time and job_model.retries > 0:
            stuck_jobs.append(job_model)

    return stuck_jobs


def delete_models_marked_as_deleted():
    """Hard-delete all models that are marked as deleted (have deleted field set
    to True) and were last updated more than eight weeks ago.
    """
    date_now = datetime.datetime.utcnow()
    date_before_which_to_hard_delete = (
        date_now - feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)
    for model_class in models.Registry.get_all_storage_model_classes():
        deleted_models = model_class.query(
            model_class.deleted == True  # pylint: disable=singleton-comparison
        ).fetch()
        models_to_hard_delete = [
            deleted_model for deleted_model in deleted_models
            if deleted_model.last_updated < date_before_which_to_hard_delete
        ]
        if issubclass(model_class, base_models.VersionedModel):
            model_ids_to_hard_delete = [
                model.id for model in models_to_hard_delete
            ]
            model_class.delete_multi(
                model_ids_to_hard_delete, '', '', force_deletion=True)
        else:
            model_class.delete_multi(models_to_hard_delete)


def mark_outdated_models_as_deleted():
    """Mark models in MODEL_CLASSES_TO_MARK_AS_DELETED, as deleted if they were
    last updated more than four weeks ago.
    """
    date_before_which_to_mark_as_deleted = (
        datetime.datetime.utcnow() - feconf.PERIOD_TO_MARK_MODELS_AS_DELETED)
    models_to_mark_as_deleted = []
    for model_class in MODEL_CLASSES_TO_MARK_AS_DELETED:
        models_to_mark_as_deleted.extend(
            model_class.query(
                model_class.last_updated < date_before_which_to_mark_as_deleted
            ).fetch()
        )
    for model_to_mark_as_deleted in models_to_mark_as_deleted:
        model_to_mark_as_deleted.deleted = True
    datastore_services.update_timestamps_multi(models_to_mark_as_deleted)
    datastore_services.put_multi(models_to_mark_as_deleted)


class MapReduceStateModelsCleanupManager(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for cleaning up old auxiliary entities for MR jobs."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """The entity types this job will handle."""
        return [
            mapreduce_model.MapreduceState,
            mapreduce_model.ShardState
        ]

    @staticmethod
    def map(item):
        """Implements the map function which will clean up jobs that have not
        finished.

        Args:
            item: mapreduce_model.MapreduceState or mapreduce_model.ShardState.
                A shard or job which may still be running.

        Yields:
            tuple(str, int). Describes the action taken for the item, and the
            number of items this action was applied to.
        """
        max_start_time_msec = (
            MapReduceStateModelsCleanupManager.get_mapper_param(
                jobs.MAPPER_PARAM_MAX_START_TIME_MSEC))

        if isinstance(item, mapreduce_model.MapreduceState):
            if (item.result_status == 'success' and
                    utils.get_time_in_millisecs(item.start_time) <
                    max_start_time_msec):
                item.delete()
                yield ('mr_state_deleted', 1)
            else:
                yield ('mr_state_remaining', 1)

        if isinstance(item, mapreduce_model.ShardState):
            if (item.result_status == 'success' and
                    utils.get_time_in_millisecs(item.update_time) <
                    max_start_time_msec):
                item.delete()
                yield ('shard_state_deleted', 1)
            else:
                yield ('shard_state_remaining', 1)

    @staticmethod
    def reduce(key, stringified_values):
        """Implements the reduce function which logs the results of the mapping
        function.

        Args:
            key: str. Describes the action taken by a map call. One of:
                'mr_state_deleted', 'mr_state_remaining', 'shard_state_deleted',
                'shard_state_remaining'.
            stringified_values: list(str). A list where each element is a
                stringified number, counting the mapped items sharing the key.
        """
        values = [ast.literal_eval(v) for v in stringified_values]
        if key.endswith('_deleted'):
            logging.warning(
                'Delete count: %s entities (%s)' % (sum(values), key))
        else:
            logging.warning(
                'Entities remaining count: %s entities (%s)' %
                (sum(values), key))


class JobModelsCleanupManager(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for cleaning up old entities of JobModel."""

    TWELVE_WEEKS = datetime.timedelta(weeks=12)
    STATUSES_TO_DELETE = [
        job_models.STATUS_CODE_COMPLETED,
        job_models.STATUS_CODE_FAILED,
        job_models.STATUS_CODE_CANCELED
    ]

    @classmethod
    def entity_classes_to_map_over(cls):
        """The entity types this job will handle."""
        return [job_models.JobModel]

    @staticmethod
    def map(model):
        date_twelve_weeks_ago = (
            datetime.datetime.utcnow() - JobModelsCleanupManager.TWELVE_WEEKS)
        twelve_weeks_ago_in_millisecs = utils.get_time_in_millisecs(
            date_twelve_weeks_ago)
        if (
                model.time_finished_msec < twelve_weeks_ago_in_millisecs and
                model.status_code in JobModelsCleanupManager.STATUSES_TO_DELETE
        ):
            model.delete()
            yield ('SUCCESS_DELETED', model.id)
        else:
            yield ('SUCCESS_KEPT', model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))
