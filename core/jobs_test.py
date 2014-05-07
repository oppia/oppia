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

from google.appengine.ext import deferred
from google.appengine.ext import ndb


class JobModelUnitTests(test_utils.GenericTestBase):
    """Tests for the tracking of job status in the datastore."""

    class DummyJob(jobs.BaseJob):
        IS_VALID_JOB_CLASS = True

    class AnotherDummyJob(jobs.BaseJob):
        IS_VALID_JOB_CLASS = True

    def test_create_new(self):
        """Test the creation of a new job."""
        new_job = self.DummyJob.create_new()
        self.assertTrue(new_job._job_id.startswith('DummyJob'))
        self.assertIsNone(new_job.execution_time_sec)
        self.assertIsNone(new_job.status_code)
        self.assertIsNone(new_job.output)
        self.assertFalse(new_job.is_active)

    def test_enqueue_new_job(self):
        """Test the enqueueing of a new job."""
        new_job = self.DummyJob.create_new()
        new_job.mark_queued()
        self.assertTrue(new_job.is_active)
        self.assertEqual(new_job.execution_time_sec, 0)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_QUEUED)
        self.assertIsNone(new_job.output)

    def test_job_completion(self):
        new_job = self.DummyJob.create_new()
        new_job.mark_queued()

        new_job.mark_started()
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_STARTED)

        new_job.mark_completed(20, 'output')
        self.assertEqual(new_job.execution_time_sec, 20)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(new_job.output, 'output')

    def test_job_failure(self):
        new_job = self.DummyJob.create_new()
        new_job.mark_queued()

        new_job.mark_started()
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_STARTED)
        self.assertTrue(new_job.is_active)

        new_job.mark_failed(20, 'output')
        self.assertEqual(new_job.execution_time_sec, 20)
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertEqual(new_job.output, 'output')
        self.assertFalse(new_job.is_active)

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""
        new_job = self.DummyJob.create_new()
        new_job.mark_queued()
        new_job.mark_started()
        new_job.mark_completed(20, 'output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job.mark_queued()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job.mark_completed(20, 'output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            new_job.mark_failed(20, 'output')

    def test_different_jobs_are_independent(self):
        new_job = self.DummyJob.create_new()
        another_job = self.AnotherDummyJob.create_new()

        new_job.mark_queued()
        new_job.mark_started()
        another_job.mark_queued()

        new_job.mark_failed(20, 'output')
        self.assertEqual(new_job.status_code, jobs.STATUS_CODE_FAILED)
        self.assertEqual(another_job.status_code, jobs.STATUS_CODE_QUEUED)

    def test_can_only_instantiate_valid_jobs(self):
        new_job = self.DummyJob.create_new()
        new_job.mark_queued()
        new_job.mark_started()

        with self.assertRaisesRegexp(
                Exception, 'Tried to directly initialize'):
            jobs.BaseJob.create_new()


TEST_INPUT_DATA = [(1, 2), (3, 4), (1, 5)]
SUM_MODEL_ID = 'all_data_id'


class NumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class SumModel(ndb.Model):
    total = ndb.IntegerProperty(default=0)


class TestJob(jobs.BaseJob):
    """Base class for test jobs."""
    IS_VALID_JOB_CLASS = True

    def enqueue(self):
        """Overwrites the superclass to use the deferred task queue stub."""
        self.mark_queued()
        deferred.defer(self._run_job)


class TestAdditionJob(TestJob):
    """Test job that sums all NumbersModel data.

    The result is stored in a SumModel entity with id SUM_MODEL_ID.
    """
    def run(self):
        total = sum([
            numbers_model.number for numbers_model in NumbersModel.query()])
        SumModel(id=SUM_MODEL_ID, total=total).put()


class JobLifecycleUnitTests(test_utils.GenericTestBase):
    """Tests a real job."""

    def _get_stored_total(self):
        sum_model = SumModel.get_by_id(SUM_MODEL_ID)
        return sum_model.total if sum_model else 0

    def _populate_data(self):
        """Populate the datastore with four NumbersModel instances."""
        NumbersModel(number=1).put()
        NumbersModel(number=2).put()
        NumbersModel(number=1).put()
        NumbersModel(number=2).put()

    def test_addition_job_workflow(self):
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

    def test_two_jobs(self):
        self._populate_data()
        TestAdditionJob.create_new().enqueue()

        NumbersModel(number=3).put()
        TestAdditionJob.create_new().enqueue()

        self.assertEqual(self.count_jobs_in_taskqueue(), 2)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_error_case(self):
        job = TestAdditionJob.create_new()
        job.enqueue()
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            job.enqueue()
