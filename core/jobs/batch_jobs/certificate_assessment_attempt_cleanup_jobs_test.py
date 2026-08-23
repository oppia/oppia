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

"""Tests for certificate_assessment_attempt_cleanup_jobs."""

from __future__ import annotations

import datetime

from core.jobs import job_test_utils
from core.jobs.batch_jobs import certificate_assessment_attempt_cleanup_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import certificate_assessment_offering_models

(certificate_assessment_offering_models,) = models.Registry.import_models(
    [models.Names.CERTIFICATE_ASSESSMENT_OFFERING]
)


def _create_offering_model(
    self: job_test_utils.JobTestBase,
    certificate_id: str,
    time_limit_in_minutes: int,
) -> certificate_assessment_offering_models.CertificateAssessmentOfferingModel:
    """Helper to build a CertificateAssessmentOfferingModel for these tests.

    Args:
        certificate_id: str. The id of the certificate offering.
        time_limit_in_minutes: int. The offering's time limit in minutes.

    Returns:
        CertificateAssessmentOfferingModel. The created offering model.
    """
    return self.create_model(
        certificate_assessment_offering_models.CertificateAssessmentOfferingModel,
        id=certificate_id,
        title='Certificate for %s' % certificate_id,
        description='Description for %s.' % certificate_id,
        classroom_id='classroom_1',
        topic_ids=['topic_1'],
        total_questions=5,
        time_limit_in_minutes=time_limit_in_minutes,
        demonstrates=[],
        async_status='Available',
    )


def _create_attempt_model(
    self: job_test_utils.JobTestBase,
    attempt_id: str,
    certificate_id: str,
    started_at: datetime.datetime,
    is_submitted: bool = False,
) -> certificate_assessment_offering_models.CertificateAssessmentAttemptModel:
    """Helper to build a CertificateAssessmentAttemptModel for these tests.

    Args:
        attempt_id: str. The id of the attempt.
        certificate_id: str. The id of the certificate being attempted.
        started_at: datetime.datetime. When the attempt was started.
        is_submitted: bool. Whether the attempt has been submitted.

    Returns:
        CertificateAssessmentAttemptModel. The created attempt model.
    """
    return self.create_model(
        certificate_assessment_offering_models.CertificateAssessmentAttemptModel,
        id=attempt_id,
        learner_id='learner_1',
        certificate_id=certificate_id,
        total_score=0.0,
        attempt_index=1,
        attempt_data={},
        version_data={'certificate_id': certificate_id},
        started_at=started_at,
        finished_at=None,
        is_submitted=is_submitted,
    )


class DeleteAbandonedCertificateAssessmentAttemptsJobTests(
    job_test_utils.JobTestBase
):
    """Tests for DeleteAbandonedCertificateAssessmentAttemptsJob."""

    JOB_CLASS: Type[
        certificate_assessment_attempt_cleanup_jobs.DeleteAbandonedCertificateAssessmentAttemptsJob
    ] = (
        certificate_assessment_attempt_cleanup_jobs.DeleteAbandonedCertificateAssessmentAttemptsJob
    )

    def test_empty_storage(self) -> None:
        """Test that the job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 0.'
                ),
            ]
        )

    def test_deletes_abandoned_in_progress_attempt(self) -> None:
        """An in-progress attempt past its deadline should be deleted."""
        offering_model = _create_offering_model(self, 'cert_1', 20)
        abandoned_attempt = _create_attempt_model(
            self,
            'attempt_abandoned',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(hours=3),
        )
        self.put_multi([offering_model, abandoned_attempt])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Deleted CertificateAssessmentAttemptModel with ID: '
                    'attempt_abandoned.'
                ),
            ]
        )

        deleted_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_abandoned', strict=False
        )
        self.assertIsNone(deleted_model)

    def test_keeps_in_progress_attempt_within_deadline(self) -> None:
        """An in-progress attempt still inside its deadline should be kept."""
        offering_model = _create_offering_model(self, 'cert_1', 20)
        active_attempt = _create_attempt_model(
            self,
            'attempt_active',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(minutes=5),
        )
        self.put_multi([offering_model, active_attempt])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 0.'
                ),
            ]
        )

        kept_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_active'
        )
        self.assertIsNotNone(kept_model)

    def test_keeps_in_progress_attempt_past_time_limit_within_grace_period(
        self,
    ) -> None:
        """An in-progress attempt past its time limit but still inside the
        combined deadline (time limit plus grace period) should be kept.
        """
        offering_model = _create_offering_model(self, 'cert_1', 20)
        active_attempt = _create_attempt_model(
            self,
            'attempt_active',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(minutes=70),
        )
        self.put_multi([offering_model, active_attempt])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 0.'
                ),
            ]
        )

        kept_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_active'
        )
        self.assertIsNotNone(kept_model)

    def test_keeps_submitted_attempt_even_if_old(self) -> None:
        """A submitted attempt should never be deleted, however old."""
        offering_model = _create_offering_model(self, 'cert_1', 20)
        submitted_attempt = _create_attempt_model(
            self,
            'attempt_submitted',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(days=30),
            is_submitted=True,
        )
        self.put_multi([offering_model, submitted_attempt])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 0.'
                ),
            ]
        )

        kept_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_submitted'
        )
        self.assertIsNotNone(kept_model)

    def test_deletes_only_the_abandoned_attempts_of_one_offering(self) -> None:
        """When several attempts share one offering, only those past their
        deadline should be deleted.
        """
        offering_model = _create_offering_model(self, 'cert_1', 20)
        abandoned_attempt = _create_attempt_model(
            self,
            'attempt_abandoned',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(hours=3),
        )
        active_attempt = _create_attempt_model(
            self,
            'attempt_active',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(minutes=5),
        )
        submitted_attempt = _create_attempt_model(
            self,
            'attempt_submitted',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(days=30),
            is_submitted=True,
        )
        self.put_multi(
            [
                offering_model,
                abandoned_attempt,
                active_attempt,
                submitted_attempt,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Deleted CertificateAssessmentAttemptModel with ID: '
                    'attempt_abandoned.'
                ),
            ]
        )

        deleted_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_abandoned', strict=False
        )
        self.assertIsNone(deleted_model)
        kept_active_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_active'
        )
        self.assertIsNotNone(kept_active_model)
        kept_submitted_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_submitted'
        )
        self.assertIsNotNone(kept_submitted_model)

    def test_keeps_attempt_without_matching_offering(self) -> None:
        """An attempt whose offering no longer exists has no computable
        deadline and should be left untouched.
        """
        orphaned_attempt = _create_attempt_model(
            self,
            'attempt_orphaned',
            'cert_missing',
            datetime.datetime.utcnow() - datetime.timedelta(days=10),
        )
        self.put_multi([orphaned_attempt])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels deleted: 0.'
                ),
            ]
        )

        kept_model = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_orphaned'
        )
        self.assertIsNotNone(kept_model)


class DeleteAbandonedCertificateAssessmentAttemptsAuditJobTests(
    job_test_utils.JobTestBase
):
    """Tests for DeleteAbandonedCertificateAssessmentAttemptsAuditJob."""

    JOB_CLASS: Type[
        certificate_assessment_attempt_cleanup_jobs.DeleteAbandonedCertificateAssessmentAttemptsAuditJob
    ] = (
        certificate_assessment_attempt_cleanup_jobs.DeleteAbandonedCertificateAssessmentAttemptsAuditJob
    )

    def test_empty_storage(self) -> None:
        """Test that the audit job runs successfully with empty storage."""
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels that would '
                    'be deleted: 0.'
                ),
            ]
        )

    def test_audit_job_reports_but_does_not_delete_attempts(self) -> None:
        """The audit job should log abandoned attempts without deleting them."""
        offering_model = _create_offering_model(self, 'cert_1', 20)
        abandoned_attempt = _create_attempt_model(
            self,
            'attempt_abandoned',
            'cert_1',
            datetime.datetime.utcnow() - datetime.timedelta(hours=3),
        )
        self.put_multi([offering_model, abandoned_attempt])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentAttemptModels that would '
                    'be deleted: 1.'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Would delete CertificateAssessmentAttemptModel with ID: '
                    'attempt_abandoned.'
                ),
            ]
        )

        kept_attempt = certificate_assessment_offering_models.CertificateAssessmentAttemptModel.get(
            'attempt_abandoned', strict=False
        )
        self.assertIsNotNone(kept_attempt)
