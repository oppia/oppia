# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Oppia job models."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import job_models

(base_models, job_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.JOB
])


class JobModelTest(test_utils.GenericTestBase):
    """Tests for Oppia job models."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            job_models.JobModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_is_cancelable(self) -> None:
        """The job is cancelable if its status is either queued or started."""
        job = job_models.JobModel(
            id='MyJobId', status_code=job_models.STATUS_CODE_NEW)
        self.assertFalse(job.is_cancelable)
        job.status_code = job_models.STATUS_CODE_QUEUED
        self.assertTrue(job.is_cancelable)
        job.status_code = job_models.STATUS_CODE_STARTED
        self.assertTrue(job.is_cancelable)
        job.status_code = job_models.STATUS_CODE_FAILED
        self.assertFalse(job.is_cancelable)
        job.status_code = job_models.STATUS_CODE_CANCELED
        self.assertFalse(job.is_cancelable)

    def test_get_export_policy(self) -> None:
        expected_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'job_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_queued_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_started_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_finished_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'metadata': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'output': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'error': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'has_been_cleaned_up': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'additional_job_params': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        model = job_models.JobModel
        self.assertEqual(model.get_export_policy(), expected_dict)

    def test_get_model_association_to_user(self) -> None:
        model = job_models.JobModel
        self.assertEqual(
            model.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)


class JobModelSetUpJobsTest(test_utils.GenericTestBase):
    """Tests for Oppia job models with setUp."""

    def setUp(self) -> None:
        super().setUp()
        job_models.JobModel(
            id='MyJobId1', job_type='JobType1',
            status_code=job_models.STATUS_CODE_FAILED).put()
        job_models.JobModel(
            id='MyJobId2', job_type='JobType2',
            status_code=job_models.STATUS_CODE_STARTED).put()
        job_models.JobModel(
            id='MyJobId3', job_type='JobType2',
            status_code=job_models.STATUS_CODE_COMPLETED).put()

    def test_get_all_unfinished_jobs(self) -> None:
        self.assertEqual(
            job_models.JobModel.get_all_unfinished_jobs(3),
            [job_models.JobModel.get_by_id('MyJobId2')])

    def test_get_unfinished_jobs(self) -> None:
        self.assertEqual(
            job_models.JobModel.get_unfinished_jobs('JobType1').fetch(1), [])
        self.assertEqual(
            job_models.JobModel.get_unfinished_jobs('JobType2').fetch(1),
            [job_models.JobModel.get_by_id('MyJobId2')])

    def test_do_unfinished_jobs_exist(self) -> None:
        self.assertFalse(job_models.JobModel.do_unfinished_jobs_exist(
            'JobType1'))
        self.assertTrue(job_models.JobModel.do_unfinished_jobs_exist(
            'JobType2'))
        job2 = job_models.JobModel.get('MyJobId2', strict=True)
        # Ruling out the possibility of None for mypy type checking.
        assert job2 is not None
        job2.status_code = job_models.STATUS_CODE_COMPLETED
        job2.update_timestamps()
        job2.put()
        self.assertFalse(job_models.JobModel.do_unfinished_jobs_exist(
            'JobType2'))
