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


class JobModelUnitTests(test_utils.GenericTestBase):
    """Tests for the tracking of job status in the datastore."""

    def test_create_new(self):
        """Test the creation of a new job."""
        new_job = DummyJob.create_new()
        self.assertTrue(new_job._job_id.startswith('DummyJob'))
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_NEW)
        self.assertIsNone(new_job.time_queued)
        self.assertIsNone(new_job.time_started)
        self.assertIsNone(new_job.time_finished)
        self.assertIsNone(new_job.output)
        self.assertIsNone(new_job.error)

        self.assertFalse(new_job.is_active)
        self.assertFalse(new_job.has_finished)
        self.assertIsNone(new_job.execution_time_sec)

    def test_enqueue_job(self):
        """Test the enqueueing of a job."""
        new_job = DummyJob.create_new()
        new_job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_QUEUED)
        self.assertIsNotNone(new_job.time_queued)
        self.assertIsNone(new_job.time_started)
        self.assertIsNone(new_job.time_finished)
        self.assertIsNone(new_job.output)
        self.assertIsNone(new_job.error)

        self.assertTrue(new_job.is_active)
        self.assertFalse(new_job.has_finished)
        self.assertIsNone(new_job.execution_time_sec)

    def test_failure_for_job_with_no_run_method(self):
        new_job = JobWithNoRunMethod.create_new()
        new_job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(Exception, 'NotImplementedError'):
            self.process_and_flush_pending_tasks()

    def test_complete_job(self):
        new_job = DummyJob.create_new()
        new_job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()

        new_job = DummyJob.load_from_datastore_model(new_job._job_id)

        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_COMPLETED)
        self.assertIsNotNone(new_job.time_queued)
        self.assertIsNotNone(new_job.time_started)
        self.assertLess(new_job.time_queued, new_job.time_started)
        self.assertIsNotNone(new_job.time_finished)
        self.assertLess(new_job.time_started, new_job.time_finished)
        self.assertEqual(new_job.output, 'output')
        self.assertIsNone(new_job.error)

        self.assertFalse(new_job.is_active)
        self.assertTrue(new_job.has_finished)
        self.assertEqual(
            new_job.execution_time_sec,
            new_job.time_finished - new_job.time_started)

    def test_job_failure(self):
        new_job = DummyFailingJob.create_new()
        new_job.enqueue()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        new_job = DummyJob.load_from_datastore_model(new_job._job_id)

        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertIsNotNone(new_job.time_queued)
        self.assertIsNotNone(new_job.time_started)
        self.assertLess(new_job.time_queued, new_job.time_started)
        self.assertIsNotNone(new_job.time_finished)
        self.assertLess(new_job.time_started, new_job.time_finished)
        self.assertIsNone(new_job.output)
        self.assertIn('failed', new_job.error)

        self.assertFalse(new_job.is_active)
        self.assertTrue(new_job.has_finished)
        self.assertEqual(
            new_job.execution_time_sec,
            new_job.time_finished - new_job.time_started)

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""
        new_job = DummyJob.create_new()
        new_job.enqueue()
        new_job._mark_started()
        new_job._mark_completed('output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job._mark_queued()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job._mark_completed('output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job._mark_failed('error')

    def test_different_jobs_are_independent(self):
        new_job = DummyJob.create_new()
        another_job = AnotherDummyJob.create_new()

        new_job.enqueue()
        new_job._mark_started()
        another_job.enqueue()

        new_job._mark_failed('error')
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertEqual(another_job.status_code, jobs.STATUS_CODE_QUEUED)

    def test_can_only_instantiate_valid_jobs(self):
        new_job = DummyJob.create_new()
        new_job._mark_queued()
        new_job._mark_started()

        with self.assertRaisesRegexp(
                Exception, 'initialize a job using the abstract base class'):
            jobs.BaseJob.create_new()


# TODO(sll): Add tests for
# - job cancellation
# - job hooks
# - datastore model querying by job type
# - datastore model querying for unfinished jobs


TEST_INPUT_DATA = [(1, 2), (3, 4), (1, 5)]
SUM_MODEL_ID = 'all_data_id'


class NumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class SumModel(ndb.Model):
    total = ndb.IntegerProperty(default=0)


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

    def test_double_enqueueing(self):
        job = TestAdditionJob.create_new()
        job.enqueue()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job.enqueue()
