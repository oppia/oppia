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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils

(base_models, job_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.job])


class JobModelTest(test_utils.GenericTestBase):
    """Tests for Oppia job models."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            job_models.JobModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_is_cancelable(self):
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


class JobModelSetUpJobsTest(test_utils.GenericTestBase):
    """Tests for Oppia job models with setUp."""

    def setUp(self):
        super(JobModelSetUpJobsTest, self).setUp()
        job_models.JobModel(
            id='MyJobId1', job_type='JobType1',
            status_code=job_models.STATUS_CODE_FAILED).put()
        job_models.JobModel(
            id='MyJobId2', job_type='JobType2',
            status_code=job_models.STATUS_CODE_STARTED).put()
        job_models.JobModel(
            id='MyJobId3', job_type='JobType2',
            status_code=job_models.STATUS_CODE_COMPLETED).put()

    def test_get_all_unfinished_jobs(self):
        self.assertEqual(
            job_models.JobModel.get_all_unfinished_jobs(3),
            [job_models.JobModel.get_by_id('MyJobId2')])

    def test_get_unfinished_jobs(self):
        self.assertEqual(
            job_models.JobModel.get_unfinished_jobs('JobType1').fetch(1), [])
        self.assertEqual(
            job_models.JobModel.get_unfinished_jobs('JobType2').fetch(1),
            [job_models.JobModel.get_by_id('MyJobId2')])

    def test_do_unfinished_jobs_exist(self):
        self.assertFalse(job_models.JobModel.do_unfinished_jobs_exist(
            'JobType1'))
        self.assertTrue(job_models.JobModel.do_unfinished_jobs_exist(
            'JobType2'))
        job2 = job_models.JobModel.get('MyJobId2', strict=True)
        job2.status_code = job_models.STATUS_CODE_COMPLETED
        job2.update_timestamps()
        job2.put()
        self.assertFalse(job_models.JobModel.do_unfinished_jobs_exist(
            'JobType2'))


class ContinuousComputationModelTest(test_utils.GenericTestBase):
    """Tests for Oppia continuous computation models."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            job_models.ContinuousComputationModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)
