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

"""Jobs used to clean up abandoned certificate assessment attempts.

A CertificateAssessmentAttemptModel entry is created when a learner starts a
certificate assessment and stays in an in-progress state (is_submitted is
False) until the learner submits it. If a learner disconnects mid-assessment
or simply walks away, that in-progress attempt can linger in the datastore
forever, even though the learner is allowed to resume it only within a short
grace period.

DeleteAbandonedCertificateAssessmentAttemptsJob deletes in-progress attempts
whose deadline has passed. The deadline is computed as:

    started_at + certificate offering time limit + grace period

The grace period is an additional buffer on top of the assessment's time
limit that accounts for brief network losses, during which a learner may
reconnect and resume the same attempt. Any in-progress attempt still present
after this combined window is treated as abandoned and removed.

The audit job reports which attempts would be deleted without writing any
changes. Both jobs only read from the datastore through Beam's NDB I/O
transforms, so they are safe to run over large datasets.
"""

from __future__ import annotations

import datetime
import logging

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import certificate_assessment_offering_models

(certificate_assessment_offering_models,) = models.Registry.import_models(
    [models.Names.CERTIFICATE_ASSESSMENT_OFFERING]
)

# The grace period (in minutes) added on top of the certificate offering's
# time limit when computing an attempt's deadline. It gives learners a buffer
# to reconnect and resume an in-progress attempt after brief network losses.
ABANDONED_CERTIFICATE_ASSESSMENT_ATTEMPT_GRACE_PERIOD_MINUTES = 60


class DeleteAbandonedCertificateAssessmentAttemptsJob(base_jobs.JobBase):
    """Deletes in-progress certificate assessment attempts whose deadline has
    passed.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def get_certificate_id_time_limit_pair(
        self,
        offering_model: (
            certificate_assessment_offering_models.CertificateAssessmentOfferingModel
        ),
    ) -> Tuple[str, int]:
        """Extracts the (certificate_id, time_limit_in_minutes) pair from a
        certificate assessment offering model.

        Args:
            offering_model: CertificateAssessmentOfferingModel. The offering
                model to read from.

        Returns:
            tuple(str, int). The certificate id paired with the offering's
            time limit in minutes.
        """
        return (offering_model.id, offering_model.time_limit_in_minutes)

    def get_attempt_abandonment_status(
        self,
        attempt_model: (
            certificate_assessment_offering_models.CertificateAssessmentAttemptModel
        ),
        certificate_id_to_time_limit: Dict[str, int],
    ) -> Tuple[
        certificate_assessment_offering_models.CertificateAssessmentAttemptModel,
        bool,
    ]:
        """Determines whether an attempt is abandoned, i.e. in-progress and
        past its deadline.

        An attempt is only considered for cleanup when it has not been
        submitted and its certificate offering still exists, so its deadline
        can be computed. Attempts without a matching offering are left
        untouched by this job.

        Args:
            attempt_model: CertificateAssessmentAttemptModel. The attempt
                model to check.
            certificate_id_to_time_limit: dict(str, int). Side input mapping
                certificate id to the offering's time limit in minutes.

        Returns:
            tuple(CertificateAssessmentAttemptModel, bool). The attempt model
            paired with whether it should be deleted.
        """
        if attempt_model.is_submitted:
            return (attempt_model, False)
        time_limit_in_minutes = certificate_id_to_time_limit.get(
            attempt_model.certificate_id
        )
        if time_limit_in_minutes is None:
            return (attempt_model, False)
        deadline = attempt_model.started_at + datetime.timedelta(
            minutes=(
                time_limit_in_minutes
                + ABANDONED_CERTIFICATE_ASSESSMENT_ATTEMPT_GRACE_PERIOD_MINUTES
            )
        )
        current_time = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )
        return (attempt_model, current_time > deadline)

    def delete_attempt(
        self,
        attempt_model: (
            certificate_assessment_offering_models.CertificateAssessmentAttemptModel
        ),
    ) -> (
        certificate_assessment_offering_models.CertificateAssessmentAttemptModel
    ):
        """Logs and returns an attempt that will be deleted.

        Args:
            attempt_model: CertificateAssessmentAttemptModel. The attempt
                model to delete.

        Returns:
            CertificateAssessmentAttemptModel. The attempt model to delete.
        """
        logging.info(
            'Deleting abandoned CertificateAssessmentAttemptModel with id %s.',
            attempt_model.id,
        )
        return attempt_model

    def create_count_job_run_result(
        self,
        count: int,
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult with the given count.

        Args:
            count: int. The number of deleted attempts.

        Returns:
            JobRunResult. The count formatted as a JobRunResult.
        """
        if self.DATASTORE_UPDATES_ALLOWED:
            return job_run_result.JobRunResult.as_stdout(
                'Number of CertificateAssessmentAttemptModels deleted: %d.'
                % count
            )
        return job_run_result.JobRunResult.as_stdout(
            'Number of CertificateAssessmentAttemptModels that would be '
            'deleted: %d.' % count
        )

    def create_model_job_run_result(
        self,
        attempt_model: (
            certificate_assessment_offering_models.CertificateAssessmentAttemptModel
        ),
    ) -> job_run_result.JobRunResult:
        """Creates a JobRunResult with the given attempt model.

        Args:
            attempt_model: CertificateAssessmentAttemptModel. The deleted
                attempt model.

        Returns:
            JobRunResult. The attempt id formatted as a JobRunResult.
        """
        if self.DATASTORE_UPDATES_ALLOWED:
            return job_run_result.JobRunResult.as_stdout(
                'Deleted CertificateAssessmentAttemptModel with ID: %s.'
                % attempt_model.id
            )
        return job_run_result.JobRunResult.as_stdout(
            'Would delete CertificateAssessmentAttemptModel with ID: %s.'
            % attempt_model.id
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the DeleteAbandonedCertificateAssessmentAttemptsJob.

        Returns:
            JobRunResult. Contains the total number of attempts deleted,
            along with the IDs of those attempts.
        """
        attempt_models = (
            self.pipeline
            | 'Get CertificateAssessmentAttemptModels from the datastore'
            >> ndb_io.GetModels(
                certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get_all()
            )
        )

        offering_models = (
            self.pipeline
            | 'Get CertificateAssessmentOfferingModels from the datastore'
            >> ndb_io.GetModels(
                certificate_assessment_offering_models.CertificateAssessmentOfferingModel.get_all()
            )
        )

        certificate_id_to_time_limit = (
            offering_models
            | 'Map offerings to certificate id and time limit pairs'
            >> beam.Map(self.get_certificate_id_time_limit_pair)
        )

        attempt_abandonment_statuses = (
            attempt_models
            | 'Compute abandonment status for each attempt'
            >> beam.Map(
                self.get_attempt_abandonment_status,
                certificate_id_to_time_limit=beam.pvalue.AsDict(
                    certificate_id_to_time_limit
                ),
            )
        )

        abandoned_attempt_models = (
            attempt_abandonment_statuses
            | 'Keep only abandoned attempts'
            >> beam.Filter(lambda model_and_status: model_and_status[1])
            | 'Extract abandoned attempt models'
            >> beam.Map(lambda model_and_status: model_and_status[0])
            | 'Log abandoned attempt models' >> beam.Map(self.delete_attempt)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                abandoned_attempt_models
                | 'Extract keys of abandoned attempts'
                >> beam.Map(lambda model: model.key)
                | 'Delete abandoned attempt keys from the datastore'
                >> ndb_io.DeleteModels()
            )

        count_run_result = (
            abandoned_attempt_models
            | 'Count abandoned attempts' >> beam.combiners.Count.Globally()
            | 'Format count of abandoned attempts to JobRunResult'
            >> beam.Map(self.create_count_job_run_result)
        )

        abandoned_attempt_id_results = (
            abandoned_attempt_models
            | 'Add abandoned attempt IDs to job run result'
            >> beam.Map(self.create_model_job_run_result)
        )

        return (
            count_run_result,
            abandoned_attempt_id_results,
        ) | 'Combine abandoned attempt cleanup results' >> beam.Flatten()


class DeleteAbandonedCertificateAssessmentAttemptsAuditJob(
    DeleteAbandonedCertificateAssessmentAttemptsJob
):
    """Audit job to report which in-progress certificate assessment attempts
    would be deleted as abandoned, without writing any changes."""

    DATASTORE_UPDATES_ALLOWED = False
