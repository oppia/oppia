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
forever.

DeleteAbandonedCertificateAssessmentAttemptsAuditJob reports in-progress
attempts that were started more than the abandonment period ago without
writing any changes, and DeleteAbandonedCertificateAssessmentAttemptsJob
opts into deleting them. Since certificate assessments no longer impose a
time limit, the age of the attempt alone decides whether it is abandoned:

    started_at + ABANDONED_CERTIFICATE_ASSESSMENT_ATTEMPT_AGE_LIMIT_DAYS

An in-progress attempt still present after this window is treated as
abandoned.

Both jobs only read from the datastore through Beam's NDB I/O transforms, so
they are safe to run over large datasets.
"""

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
    from mypy_imports import certificate_assessment_offering_models

(certificate_assessment_offering_models,) = models.Registry.import_models(
    [models.Names.CERTIFICATE_ASSESSMENT_OFFERING]
)

# The number of days after which an in-progress certificate assessment attempt
# is considered abandoned and can be cleaned up. Learners may resume an
# in-progress attempt at their own pace, so an attempt that has not been
# submitted within this window is treated as abandoned.
ABANDONED_CERTIFICATE_ASSESSMENT_ATTEMPT_AGE_LIMIT_DAYS = 7


class DeleteAbandonedCertificateAssessmentAttemptsAuditJob(base_jobs.JobBase):
    """Audit job to report which in-progress certificate assessment attempts
    would be deleted as abandoned, without writing any changes.
    """

    DATASTORE_UPDATES_ALLOWED = False

    def is_attempt_abandoned(
        self,
        attempt_model: (
            certificate_assessment_offering_models.CertificateAssessmentAttemptModel
        ),
    ) -> bool:
        """Determines whether an in-progress attempt is abandoned, i.e. it was
        started more than the abandonment period ago and has not been
        submitted.

        Args:
            attempt_model: CertificateAssessmentAttemptModel. The attempt
                model to check.

        Returns:
            bool. Whether the attempt should be treated as abandoned.
        """
        if attempt_model.is_submitted:
            return False
        abandonment_cutoff: datetime.datetime = (
            attempt_model.started_at
            + datetime.timedelta(
                days=ABANDONED_CERTIFICATE_ASSESSMENT_ATTEMPT_AGE_LIMIT_DAYS
            )
        )
        current_time = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )
        return current_time > abandonment_cutoff

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
        """Runs the DeleteAbandonedCertificateAssessmentAttemptsAuditJob.

        Returns:
            JobRunResult. Contains the total number of abandoned attempts
            found, along with the IDs of those attempts.
        """
        abandoned_attempt_models = (
            self.pipeline
            | 'Get CertificateAssessmentAttemptModels from the datastore'
            >> ndb_io.GetModels(
                certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get_all()
            )
            | 'Find abandoned in-progress attempts'
            >> beam.Filter(self.is_attempt_abandoned)
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


class DeleteAbandonedCertificateAssessmentAttemptsJob(
    DeleteAbandonedCertificateAssessmentAttemptsAuditJob
):
    """Deletes in-progress certificate assessment attempts that have been
    started more than the abandonment period ago.
    """

    DATASTORE_UPDATES_ALLOWED = True
