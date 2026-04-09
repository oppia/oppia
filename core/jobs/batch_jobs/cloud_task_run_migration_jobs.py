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

from core import feconf
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

# CloudTaskRunModel and VoiceoverRegenerationJobModel entries that remain
# in RUNNING or PENDING states beyond the allowed threshold are considered stale.
# Such entries are likely stuck due to unforeseen issues, so they are transitioned
# to PERMANENTLY_FAILED and FAILED respectively to ensure accurate tracking and recovery.
STALE_TASK_THRESHOLD_DAYS = 3


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
            cloud_task_run_model.last_updated = datetime.datetime.now(
                datetime.timezone.utc
            ).replace(tzinfo=None)

        logging.info(
            'Marking the state of CloudTaskRunModel with id %s as PERMANENTLY_FAILED.'
            % cloud_task_run_model.id
        )

        return cloud_task_run_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
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
                        cloud_task_models.CloudTaskState.PENDING.value,
                        cloud_task_models.CloudTaskState.RUNNING.value,
                    ]
                    and (
                        datetime.datetime.now(datetime.timezone.utc).replace(
                            tzinfo=None
                        )
                        >= model.last_updated
                        + datetime.timedelta(days=STALE_TASK_THRESHOLD_DAYS)
                    )
                )
            )
        )

        updated_cloud_task_run_models = (
            stale_cloud_task_run_models
            | 'Mark stale CloudTaskRunModel state as PERMANENTLY_FAILED'
            >> beam.Map(self.mark_stale_model_as_permanently_failed)
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


class MarkStaleVoiceoverRegenerationJobModelsAsFailedJob(base_jobs.JobBase):
    """One-off job to update the content voiceover regeneration status in
    VoiceoverRegenerationJobModel entries, marking them as FAILED if
    they have remained in the GENERATING state for more than three days.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def mark_stale_model_as_failed(
        self,
        voiceover_regeneration_task_mapping_model: cloud_task_models.VoiceoverRegenerationJobModel,
    ) -> cloud_task_models.VoiceoverRegenerationJobModel:
        """Marks the given VoiceoverRegenerationJobModel's content
        voiceover generation status as FAILED.

        Args:
            voiceover_regeneration_task_mapping_model: VoiceoverRegenerationJobModel.
                The model to be marked as FAILED.

        Returns:
            VoiceoverRegenerationJobModel. The updated VoiceoverRegenerationJobModel with its
            content voiceover generation status marked as FAILED.
        """
        counter = 0
        with datastore_services.get_ndb_context():
            for (
                language_accent_code,
                content_status_map,
            ) in (
                voiceover_regeneration_task_mapping_model.language_accent_to_content_status_map.items()
            ):
                for content_id, status in content_status_map.items():
                    if (
                        status
                        == feconf.VoiceoverRegenerationState.GENERATING.value
                    ):
                        voiceover_regeneration_task_mapping_model.language_accent_to_content_status_map[
                            language_accent_code
                        ][
                            content_id
                        ] = feconf.VoiceoverRegenerationState.FAILED.value
                        counter += 1

            voiceover_regeneration_task_mapping_model.last_updated = (
                datetime.datetime.now(datetime.timezone.utc).replace(
                    tzinfo=None
                )
            )

        logging.info(
            'Marked the GENERATING status of the %s contents to FAILED in VoiceoverRegenerationJobModel with ID: %s.'
            % (counter, voiceover_regeneration_task_mapping_model.id)
        )

        return voiceover_regeneration_task_mapping_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the MarkStaleVoiceoverRegenerationJobModelsAsFailedJob.

        This job marks VoiceoverRegenerationJobModel entries as FAILED if they
        have remained in the GENERATING state for more than three days.

        Returns:
            JobRunResult. Contains the total number of VoiceoverRegenerationJobModel entries
            marked as FAILED, along with the IDs of those entries.
        """
        # Stale VoiceoverRegenerationJobModels are those that have been in the
        # GENERATING state for more than three days.
        stale_voiceover_regeneration_task_mapping_models = (
            self.pipeline
            | 'Get VoiceoverRegenerationJobModels from the datastore'
            >> ndb_io.GetModels(
                cloud_task_models.VoiceoverRegenerationJobModel.get_all()
            )
            | 'Filter VoiceoverRegenerationJobModels which was last updated more than three days ago'
            >> beam.Filter(
                lambda model: (
                    datetime.datetime.now(datetime.timezone.utc).replace(
                        tzinfo=None
                    )
                    >= model.last_updated
                    + datetime.timedelta(days=STALE_TASK_THRESHOLD_DAYS)
                )
            )
        )

        updated_voiceover_regeneration_task_mapping_models = (
            stale_voiceover_regeneration_task_mapping_models
            | 'Mark stale VoiceoverRegenerationJobModel state as FAILED'
            >> beam.Map(self.mark_stale_model_as_failed)
        )

        count_run_result = (
            updated_voiceover_regeneration_task_mapping_models
            | 'Count updated VoiceoverRegenerationJobModels'
            >> beam.combiners.Count.Globally()
            | 'Format count to JobRunResult'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'Number of VoiceoverRegenerationJobModels updated to FAILED: %d.'
                    % count
                )
            )
        )

        updated_model_ids_result = (
            updated_voiceover_regeneration_task_mapping_models
            | 'Adds updated VoiceoverRegenerationJobModel IDs to job run result'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Updated state of VoiceoverRegenerationJobModel with ID: %s.'
                    % model.id
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                updated_voiceover_regeneration_task_mapping_models
                | 'Write updated VoiceoverRegenerationJobModels to datastore'
                >> ndb_io.PutModels()
            )

        return (
            count_run_result,
            updated_model_ids_result,
        ) | beam.Flatten()


class MarkStaleVoiceoverRegenerationJobModelsAsFailedAuditJob(
    MarkStaleVoiceoverRegenerationJobModelsAsFailedJob
):
    """Audit job to check for content status in the VoiceoverRegenerationJobModel
    entries that have been stuck in the GENERATING state for more than three
    days and log their IDs."""

    DATASTORE_UPDATES_ALLOWED = False
