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
from core.platform import models
taskqueue_services = models.Registry.import_taskqueue_services()
import test_utils

from google.appengine.ext import ndb


class DummyJob(jobs.BaseJob):
    IS_VALID_JOB_CLASS = True

    def _run(self):
        return 'output'


class AnotherDummyJob(jobs.BaseJob):
    IS_VALID_JOB_CLASS = True

    def _run(self):
        return 'output'


class DummyFailingJob(jobs.BaseJob):
    IS_VALID_JOB_CLASS = True

    def _run(self):
        raise Exception('failed')


class JobWithNoRunMethod(jobs.BaseJob):
    IS_VALID_JOB_CLASS = True


class JobUnitTests(test_utils.GenericTestBase):
    """Test basic job operations."""

    def test_create_new(self):
        """Test the creation of a new job."""
        job = DummyJob.create_new()
        self.assertTrue(job._job_id.startswith('DummyJob'))
        self.assertEqual(job.status_code, jobs.STATUS_CODE_NEW)
        self.assertIsNone(job.time_queued)
        self.assertIsNone(job.time_started)
        self.assertIsNone(job.time_finished)
        self.assertIsNone(job.output)
        self.assertIsNone(job.error)

        self.assertFalse(job.is_active)
        self.assertFalse(job.has_finished)
        self.assertIsNone(job.execution_time_sec)

    def test_enqueue_job(self):
        """Test the enqueueing of a job."""
        job = DummyJob.create_new()
        job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        self.assertEqual(job.status_code, jobs.STATUS_CODE_QUEUED)
        self.assertIsNotNone(job.time_queued)
        self.assertIsNone(job.time_started)
        self.assertIsNone(job.time_finished)
        self.assertIsNone(job.output)
        self.assertIsNone(job.error)

        self.assertTrue(job.is_active)
        self.assertFalse(job.has_finished)
        self.assertIsNone(job.execution_time_sec)

    def test_failure_for_job_with_no_run_method(self):
        job = JobWithNoRunMethod.create_new()
        job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(Exception, 'NotImplementedError'):
            self.process_and_flush_pending_tasks()

    def test_job_loading(self):
        job = DummyJob.create_new()

        with self.assertRaisesRegexp(Exception, 'Tried to load job of type'):
            AnotherDummyJob(job._job_id)

        DummyJob(job._job_id)

    def test_complete_job(self):
        job = DummyJob.create_new()
        job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()

        job.reload()
        self.assertEqual(job.status_code, jobs.STATUS_CODE_COMPLETED)
        self.assertIsNotNone(job.time_queued)
        self.assertIsNotNone(job.time_started)
        self.assertLess(job.time_queued, job.time_started)
        self.assertIsNotNone(job.time_finished)
        self.assertLess(job.time_started, job.time_finished)
        self.assertEqual(job.output, 'output')
        self.assertIsNone(job.error)

        self.assertFalse(job.is_active)
        self.assertTrue(job.has_finished)
        self.assertEqual(
            job.execution_time_sec, job.time_finished - job.time_started)

    def test_job_failure(self):
        job = DummyFailingJob.create_new()
        job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        job.reload()
        self.assertEqual(job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertIsNotNone(job.time_queued)
        self.assertIsNotNone(job.time_started)
        self.assertLess(job.time_queued, job.time_started)
        self.assertIsNotNone(job.time_finished)
        self.assertLess(job.time_started, job.time_finished)
        self.assertIsNone(job.output)
        self.assertIn('failed', job.error)

        self.assertFalse(job.is_active)
        self.assertTrue(job.has_finished)
        self.assertEqual(
            job.execution_time_sec, job.time_finished - job.time_started)

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""
        job = DummyJob.create_new()
        job.enqueue()
        job._mark_started()
        job._mark_completed('output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job._mark_queued()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job._mark_completed('output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job._mark_failed('error')

    def test_different_jobs_are_independent(self):
        job = DummyJob.create_new()
        another_job = AnotherDummyJob.create_new()

        job.enqueue()
        job._mark_started()
        another_job.enqueue()

        job._mark_failed('error')
        self.assertEqual(job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertEqual(another_job.status_code, jobs.STATUS_CODE_QUEUED)

    def test_can_only_instantiate_valid_jobs(self):
        with self.assertRaisesRegexp(
                Exception, 'initialize a job using the abstract base class'):
            jobs.BaseJob.create_new()

    def test_cannot_enqueue_same_job_twice(self):
        job = DummyJob.create_new()
        job.enqueue()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job.enqueue()

    def test_cancel_kills_queued_job(self):
        job = DummyJob.create_new()
        job.enqueue()
        self.assertTrue(job.is_active)
        job.cancel('admin_user_id')

        job.reload()
        self.assertFalse(job.is_active)
        self.assertEquals(job.status_code, jobs.STATUS_CODE_CANCELED)
        self.assertIsNone(job.output)
        self.assertEquals(job.error, 'Canceled by admin_user_id')

    def test_cancel_kills_started_job(self):
        job = DummyJob.create_new()
        job.enqueue()
        self.assertTrue(job.is_active)
        job._mark_started()

        # Cancel the job immediately after it has started.
        job.cancel('admin_user_id')

        # The job then finishes.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job._mark_completed(job._run())

        job.reload()
        self.assertFalse(job.is_active)
        self.assertEquals(job.status_code, jobs.STATUS_CODE_CANCELED)
        # Note that no results are recorded for this job.
        self.assertIsNone(job.output)
        self.assertEquals(job.error, 'Canceled by admin_user_id')

    def test_cancel_does_not_kill_completed_job(self):
        job = DummyJob.create_new()
        job.enqueue()
        self.assertTrue(job.is_active)
        # Complete the job.
        self.process_and_flush_pending_tasks()

        job.reload()
        self.assertFalse(job.is_active)
        self.assertEquals(job.status_code, jobs.STATUS_CODE_COMPLETED)
        # Cancel the job after it has finished.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job.cancel('admin_user_id')

        # The job should still have 'completed' status.
        job.reload()
        self.assertFalse(job.is_active)
        self.assertEquals(job.status_code, jobs.STATUS_CODE_COMPLETED)
        self.assertEquals(job.output, 'output')
        self.assertIsNone(job.error)

    def test_cancel_does_not_kill_failed_job(self):
        job = DummyFailingJob.create_new()
        job.enqueue()
        self.assertTrue(job.is_active)
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        job.reload()
        self.assertFalse(job.is_active)
        self.assertEquals(job.status_code, jobs.STATUS_CODE_FAILED)
        # Cancel the job after it has finished.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job.cancel('admin_user_id')

        # The job should still have 'failed' status.
        job.reload()
        self.assertFalse(job.is_active)
        self.assertEquals(job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertIsNone(job.output)
        self.assertIn('raise Exception', job.error)

    def test_cancelling_multiple_unfinished_jobs(self):
        job1 = DummyJob.create_new()
        job1.enqueue()
        job2 = DummyJob.create_new()
        job2.enqueue()

        job1._mark_started()
        job2._mark_started()

        DummyJob.cancel_all_unfinished_jobs('admin_user_id')

        job1.reload()
        job2.reload()
        self.assertFalse(job1.is_active)
        self.assertFalse(job2.is_active)
        self.assertEquals(job1.status_code, jobs.STATUS_CODE_CANCELED)
        self.assertEquals(job2.status_code, jobs.STATUS_CODE_CANCELED)
        self.assertIsNone(job1.output)
        self.assertIsNone(job2.output)
        self.assertEquals(job1.error, 'Canceled by admin_user_id')
        self.assertEquals(job2.error, 'Canceled by admin_user_id')

    def test_cancelling_one_unfinished_job(self):
        job1 = DummyJob.create_new()
        job1.enqueue()
        job2 = DummyJob.create_new()
        job2.enqueue()

        job1._mark_started()
        job2._mark_started()
        job1.cancel('admin_user_id')
        job2._mark_completed(job1._run())

        job1.reload()
        job2.reload()
        self.assertFalse(job1.is_active)
        self.assertFalse(job2.is_active)
        self.assertEquals(job1.status_code, jobs.STATUS_CODE_CANCELED)
        self.assertEquals(job2.status_code, jobs.STATUS_CODE_COMPLETED)
        self.assertIsNone(job1.output)
        self.assertEquals(job2.output, 'output')
        self.assertEquals(job1.error, 'Canceled by admin_user_id')
        self.assertIsNone(job2.error)


TEST_INPUT_DATA = [(1, 2), (3, 4), (1, 5)]
SUM_MODEL_ID = 'all_data_id'


class NumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class SumModel(ndb.Model):
    total = ndb.IntegerProperty(default=0)
    failed = ndb.BooleanProperty(default=False)


class TestJob(jobs.BaseJob):
    """Base class for test jobs."""
    IS_VALID_JOB_CLASS = True


class TestAdditionJob(TestJob):
    """Test job that sums all NumbersModel data.

    The result is stored in a SumModel entity with id SUM_MODEL_ID.
    """
    def _run(self):
        total = sum([
            numbers_model.number for numbers_model in NumbersModel.query()])
        SumModel(id=SUM_MODEL_ID, total=total).put()


class FailingAdditionJob(TestJob):
    """Test job that stores stuff in SumModel and then fails."""

    def _run(self):
        total = sum([
            numbers_model.number for numbers_model in NumbersModel.query()])
        SumModel(id=SUM_MODEL_ID, total=total).put()
        raise Exception('Oops, I failed.')

    def _post_failure_hook(self):
        model = SumModel.get_by_id(SUM_MODEL_ID)
        model.failed = True
        model.put()


class DatastoreJobIntegrationTests(test_utils.GenericTestBase):
    """Tests the behavior of a job that affects data in the datastore.

    This job gets all NumbersModel instances and sums their values, and puts
    the summed values in a SumModel instance with id SUM_MODEL_ID. The
    computation is redone from scratch each time the job is run.
    """

    def _get_stored_total(self):
        sum_model = SumModel.get_by_id(SUM_MODEL_ID)
        return sum_model.total if sum_model else 0

    def _populate_data(self):
        """Populate the datastore with four NumbersModel instances."""
        NumbersModel(number=1).put()
        NumbersModel(number=2).put()
        NumbersModel(number=1).put()
        NumbersModel(number=2).put()

    def test_sequential_jobs(self):
        self._populate_data()
        self.assertEqual(self._get_stored_total(), 0)

        TestAdditionJob.create_new().enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 6)

        NumbersModel(number=3).put()

        TestAdditionJob.create_new().enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_queued_jobs(self):
        self._populate_data()
        TestAdditionJob.create_new().enqueue()

        NumbersModel(number=3).put()
        TestAdditionJob.create_new().enqueue()

        self.assertEqual(self.count_jobs_in_taskqueue(), 2)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_job_failure(self):
        self._populate_data()
        FailingAdditionJob.create_new().enqueue()

        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(
                taskqueue_services.PermanentTaskFailure, 'Oops, I failed'):
            self.process_and_flush_pending_tasks()
        # The work that the failing job did before it failed is still done.
        self.assertEqual(self._get_stored_total(), 6)

        # The post-failure hook should have run.
        self.assertTrue(SumModel.get_by_id(SUM_MODEL_ID).failed)

        all_jobs = FailingAdditionJob.get_all_jobs()
        self.assertEqual(len(all_jobs), 1)
        self.assertTrue(all_jobs[0]. status_code, jobs.STATUS_CODE_FAILED)
