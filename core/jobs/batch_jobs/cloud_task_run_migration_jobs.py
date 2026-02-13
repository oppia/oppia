# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Jobs used to mark the CloudTaskRunModel entries as PERMENENTLY_FAILED that
have been stuck in the RUNNING or PENDING state for more than three days."""

from __future__ import annotations

import datetime
import logging

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import cloud_task_models, datastore_services

(cloud_task_models,) = models.Registry.import_models([models.Names.CLOUD_TASK])
datastore_services = models.Registry.import_datastore_services()


class MarkStaleCloudTaskRunModelsAsFailedJob(base_jobs.JobBase):
    """One-off job to mark CloudTaskRunModel entries as PERMANENTLY_FAILED if they
    have been stuck in the RUNNING or PENDING state for more than three days."""

    DATASTORE_UPDATES_ALLOWED = True

    def mark_stale_model_as_permanently_failed(
        self, cloud_task_run_model: cloud_task_models.CloudTaskRunModel
    ) -> cloud_task_models.CloudTaskRunModel:
        """Marks the given CloudTaskRunModel's latest_job_state as
        PERMANENTLY_FAILED and adds the exception message.

        Args:
            cloud_task_run_model: CloudTaskRunModel. The model to be marked as
                PERMANENTLY_FAILED.

        Returns:
            CloudTaskRunModel. The updated CloudTaskRunModel with its
            latest_job_state marked as PERMANENTLY_FAILED.
        """
        with datastore_services.get_ndb_context():
            exception_message = (
                'This CloudTaskRunModel was marked as PERMANENTLY_FAILED '
                'automatically since it has been in the %s state for more than '
                'three days.' % cloud_task_run_model.latest_job_state
            )
            cloud_task_run_model.latest_job_state = (
                cloud_task_models.CloudTaskState.PERMANENTLY_FAILED.value
            )
            cloud_task_run_model.exception_messages_for_failed_runs.append(
                exception_message
            )
            cloud_task_run_model.last_updated = datetime.datetime.utcnow()

        logging.info(
            'Marking the state of CloudTaskRunModel with id %s as PERMANENTLY_FAILED.'
            % cloud_task_run_model.id
        )

        return cloud_task_run_model

    def run(self) -> job_run_result.JobRunResult:
        """Runs the MarkStaleCloudTaskRunModelsAsFailedJob.

        This job marks CloudTaskRunModel entries as PERMANENTLY_FAILED if they
        have remained in the RUNNING or PENDING state for more than three days.

        Returns:
            JobRunResult. Contains the total number of CloudTaskRunModel entries
            marked as PERMANENTLY_FAILED, along with the IDs of those entries.
        """
        # Stale CloudTaskRunModels are those that have been in the
        # RUNNING or PENDING state for more than three days.
        stale_cloud_task_run_models = (
            self.pipeline
            | 'Get CloudTaskRunModels from the datastore'
            >> ndb_io.GetModels(cloud_task_models.CloudTaskRunModel.get_all())
            | 'Filter CloudTaskRunModels in hanging state for more than three days'
            >> beam.Filter(
                lambda model: (
                    model.latest_job_state
                    in [
                        cloud_task_models.CloudTaskState.PENDING,
                        cloud_task_models.CloudTaskState.RUNNING,
                    ]
                    and (
                        datetime.datetime.utcnow()
                        >= model.last_updated + datetime.timedelta(days=3)
                    )
                )
            )
        )

        updated_cloud_task_run_models = (
            stale_cloud_task_run_models
            | 'Mark stale CloudTaskRunModel state as PERMANENTLY_FAILED'
            >> beam.Map(
                lambda model: self.mark_stale_model_as_permanently_failed(model)
            )
        )

        count_run_result = (
            updated_cloud_task_run_models
            | 'Count updated CloudTaskRunModels'
            >> beam.combiners.Count.Globally()
            | 'Format count to JobRunResult'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'Number of CloudTaskRunModels updated to PERMANENTLY_FAILED: %d.'
                    % count
                )
            )
        )

        updated_model_ids_result = (
            updated_cloud_task_run_models
            | 'Adds updated CloudTaskRunModel IDs to job run result'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Updated state of CloudTaskRunModel with ID: %s.' % model.id
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                updated_cloud_task_run_models
                | 'Write updated CloudTaskRunModels to datastore'
                >> ndb_io.PutModels()
            )

        return (
            count_run_result,
            updated_model_ids_result,
        ) | beam.Flatten()


class MarkStaleCloudTaskRunModelsAsFailedAuditJob(
    MarkStaleCloudTaskRunModelsAsFailedJob
):
    """Audit job to check for CloudTaskRunModel entries that have been stuck in the
    RUNNING or PENDING state for more than three days and log their IDs."""

    DATASTORE_UPDATES_ALLOWED = False
