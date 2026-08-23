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

DeleteAbandonedCertificateAssessmentAttemptsAuditJob reports in-progress
attempts whose deadline has passed without writing any changes, and
DeleteAbandonedCertificateAssessmentAttemptsJob opts into deleting them. The
deadline is computed as:

    started_at + certificate offering time limit + grace period

The grace period is an additional buffer on top of the assessment's time
limit that accounts for brief network losses, during which a learner may
reconnect and resume the same attempt. Any in-progress attempt still present
after this combined window is treated as abandoned.

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
from typing import Any, Dict, Iterable, Iterator, Tuple

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


class DeleteAbandonedCertificateAssessmentAttemptsAuditJob(base_jobs.JobBase):
    """Audit job to report which in-progress certificate assessment attempts
    would be deleted as abandoned, without writing any changes.
    """

    DATASTORE_UPDATES_ALLOWED = False

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

    def is_attempt_abandoned(
        self,
        attempt_model: (
            certificate_assessment_offering_models.CertificateAssessmentAttemptModel
        ),
        time_limit_in_minutes: int,
    ) -> bool:
        """Determines whether an in-progress attempt is past its deadline,
        i.e. abandoned.

        Args:
            attempt_model: CertificateAssessmentAttemptModel. The attempt
                model to check.
            time_limit_in_minutes: int. The offering's time limit in minutes.

        Returns:
            bool. Whether the attempt should be treated as abandoned.
        """
        deadline: datetime.datetime = (
            attempt_model.started_at
            + datetime.timedelta(
                minutes=(
                    time_limit_in_minutes
                    + ABANDONED_CERTIFICATE_ASSESSMENT_ATTEMPT_GRACE_PERIOD_MINUTES
                )
            )
        )
        current_time = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )
        return current_time > deadline

    def find_abandoned_attempts_in_group(
        self,
        grouped_record: Tuple[
            str,
            # Here we use type Any because the co-grouped values could either
            # be ints (offering time limits) or attempt models.
            Dict[str, Iterable[Any]],
        ],
    ) -> Iterator[
        certificate_assessment_offering_models.CertificateAssessmentAttemptModel
    ]:
        """Yields the abandoned in-progress attempts that belong to one
        certificate offering.

        An attempt is only considered for cleanup when it has not been
        submitted and its certificate offering still exists, so its deadline
        can be computed. Attempts without a matching offering are left
        untouched by this job.

        Args:
            grouped_record: tuple(str, dict). The co-grouped record of one
                certificate id with its offering's time limits and its
                attempts, e.g.
                ('cert_1', {'time_limits': [20], 'attempts': [...]}).

        Yields:
            CertificateAssessmentAttemptModel. Each abandoned in-progress
            attempt found in the group.
        """
        _, records = grouped_record
        time_limits = list(records['time_limits'])
        if not time_limits:
            return
        time_limit_in_minutes = time_limits[0]
        for attempt_model in records['attempts']:
            if not attempt_model.is_submitted and self.is_attempt_abandoned(
                attempt_model, time_limit_in_minutes
            ):
                yield attempt_model

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
        attempt_pairs = (
            self.pipeline
            | 'Get CertificateAssessmentAttemptModels from the datastore'
            >> ndb_io.GetModels(
                certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get_all()
            )
            | 'Key attempts by their certificate id'
            >> beam.Map(lambda model: (model.certificate_id, model))
        )

        offering_time_limit_pairs = (
            self.pipeline
            | 'Get CertificateAssessmentOfferingModels from the datastore'
            >> ndb_io.GetModels(
                certificate_assessment_offering_models.CertificateAssessmentOfferingModel.get_all()
            )
            | 'Key offering time limits by their certificate id'
            >> beam.Map(self.get_certificate_id_time_limit_pair)
        )

        abandoned_attempt_models = (
            {
                'attempts': attempt_pairs,
                'time_limits': offering_time_limit_pairs,
            }
            | 'CoGroup attempts with their certificate offerings'
            >> beam.CoGroupByKey()
            | 'Find abandoned in-progress attempts'
            >> beam.FlatMap(self.find_abandoned_attempts_in_group)
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
    """Deletes in-progress certificate assessment attempts whose deadline has
    passed.
    """

    DATASTORE_UPDATES_ALLOWED = True
