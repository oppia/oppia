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
from core.platform import models
from core.tests import test_utils

entity = "MyEntity"
(job_models,) = models.Registry.import_models([models.NAMES.job])
JobModel = job_models.JobModel


class JobModelTest(test_utils.GenericTestBase):
    """Tests for Oppia job models."""
    def test_get_new_id(self):
        job_id = JobModel.get_new_id(entity)
        job = JobModel(id=job_id)
        self.assertTrue(entity in job_id)
        self.assertEquals(job.status_code, job_models.STATUS_CODE_NEW)

    def test_is_cancelable(self):
        """The job is cancelable if its status is either queued or started."""
        job_id = JobModel.get_new_id(entity)
        job = JobModel(id=job_id, status_code=job_models.STATUS_CODE_QUEUED)
        self.assertTrue(job.is_cancelable)
        job.status_code = job_models.STATUS_CODE_STARTED
        self.assertTrue(job.is_cancelable)
        job.status_code = job_models.STATUS_CODE_COMPLETED
        self.assertFalse(job.is_cancelable)


type1 = "MyType1"
type2 = "MyType2"
job_id1 = JobModel.get_new_id(entity)
job_id2 = JobModel.get_new_id(entity)
job_id3 = JobModel.get_new_id(entity)


class JobModelSetUpJobsTest(test_utils.GenericTestBase):
    """Tests for Oppia job models with setUp."""

    def setUp(self):
        super(JobModelSetUpJobsTest, self).setUp()
        JobModel(
            id=job_id1, job_type=type1,
            status_code=job_models.STATUS_CODE_FAILED).put()
        JobModel(
            id=job_id2, job_type=type2,
            status_code=job_models.STATUS_CODE_STARTED).put()
        JobModel(
            id=job_id3, job_type=type2,
            status_code=job_models.STATUS_CODE_COMPLETED).put()

    def test_get_all_unfinished_jobs(self):
        self.assertEquals(
            JobModel.get_all_unfinished_jobs(3),
            [JobModel.get_by_id(job_id2)])

    def test_get_unfinished_jobs(self):
        self.assertEquals(
            JobModel.get_unfinished_jobs(type1).fetch(1), [])
        self.assertEquals(
            JobModel.get_unfinished_jobs(type2).fetch(1),
            [JobModel.get_by_id(job_id2)])

    def test_do_unfinished_jobs_exist(self):
        self.assertFalse(JobModel.do_unfinished_jobs_exist(type1))
        self.assertTrue(JobModel.do_unfinished_jobs_exist(type2))
        job2 = JobModel.get(job_id2, strict=True)
        job2.status_code = job_models.STATUS_CODE_COMPLETED
        job2.put()
        self.assertFalse(JobModel.do_unfinished_jobs_exist(type2))
