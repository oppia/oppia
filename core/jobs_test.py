# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for long running jobs."""

__author__ = 'Sean Lip'


from core import jobs
import test_utils


class JobModelUnitTests(test_utils.GenericTestBase):
    """Tests for the tracking of job status in the datastore."""

    class DummyJob(jobs.BaseJob):
        IS_VALID_JOB_CLASS = True

    class AnotherDummyJob(jobs.BaseJob):
        IS_VALID_JOB_CLASS = True

    def test_create_new_job(self):
        """Test the creation of a new job."""
        new_job = self.DummyJob()
        self.assertEqual(new_job._job_id, 'job-DummyJob')
        self.assertIsNone(new_job.execution_time_sec)
        self.assertIsNone(new_job.status_code)
        self.assertIsNone(new_job.output)
        self.assertFalse(new_job.is_active)

    def test_enqueue_new_job(self):
        """Test the enqueueing of a new job."""
        new_job = self.DummyJob()
        new_job.mark_queued()
        self.assertTrue(new_job.is_active)
        self.assertEqual(new_job.execution_time_sec, 0)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_QUEUED)
        self.assertIsNone(new_job.output)

    def test_job_completion(self):
        new_job = self.DummyJob()
        new_job.mark_queued()

        new_job.mark_started()
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_STARTED)

        new_job.mark_completed(20, 'output')
        self.assertEqual(new_job.execution_time_sec, 20)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(new_job.output, 'output')

    def test_job_failure(self):
        new_job = self.DummyJob()
        new_job.mark_queued()

        new_job.mark_started()
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_STARTED)
        self.assertTrue(new_job.is_active)

        new_job.mark_failed(20, 'output')
        self.assertEqual(new_job.execution_time_sec, 20)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertEqual(new_job.output, 'output')
        self.assertFalse(new_job.is_active)

    def test_job_restart(self):
        new_job = self.DummyJob()
        new_job.mark_queued()
        new_job.mark_started()

        new_job.mark_queued()
        self.assertEqual(new_job.execution_time_sec, 0)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_QUEUED)
        self.assertIsNone(new_job.output)

        new_job.mark_started()
        new_job.mark_failed(20, 'output')
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)

        new_job.mark_queued()
        self.assertEqual(new_job.execution_time_sec, 0)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_QUEUED)
        self.assertIsNone(new_job.output)

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""

        new_job = self.DummyJob()
        with self.assertRaisesRegexp(Exception, 'Job was not created'):
            new_job.mark_started()
        with self.assertRaisesRegexp(Exception, 'Job was not created'):
            new_job.mark_completed(20, 'output')
        with self.assertRaisesRegexp(Exception, 'Job was not created'):
            new_job.mark_failed(20, 'output')

        new_job.mark_queued()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job.mark_completed(20, 'output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job.mark_failed(20, 'output')

        new_job.mark_started()
        new_job.mark_completed(20, 'output')
        new_job.mark_queued()

    def test_different_jobs_are_independent(self):
        new_job = self.DummyJob()
        another_job = self.AnotherDummyJob()

        new_job.mark_queued()
        new_job.mark_started()
        another_job.mark_queued()

        new_job.mark_failed(20, 'output')
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertEqual(another_job.status_code, jobs.STATUS_CODE_QUEUED)

    def test_one_job_runs_per_class(self):
        new_job = self.DummyJob()
        new_job.mark_queued()
        new_job.mark_started()

        same_job = self.DummyJob()
        self.assertEqual(same_job.status_code, jobs.STATUS_CODE_STARTED)

    def test_can_only_instantiate_valid_jobs(self):
        new_job = self.DummyJob()
        new_job.mark_queued()
        new_job.mark_started()

        with self.assertRaisesRegexp(
                Exception, 'Tried to directly initialize'):
            jobs.BaseJob()
