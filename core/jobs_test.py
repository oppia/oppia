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
from core.domain import exp_domain
from core.domain import exp_services
from core.platform import models
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
taskqueue_services = models.Registry.import_taskqueue_services()
import test_utils

from google.appengine.ext import ndb


class DummyJobManager(jobs.BaseDeferredJobManager):
    @classmethod
    def _run(cls):
        return 'output'


class AnotherDummyJobManager(jobs.BaseDeferredJobManager):
    @classmethod
    def _run(cls):
        return 'output'


class DummyFailingJobManager(jobs.BaseDeferredJobManager):
    @classmethod
    def _run(cls):
        raise Exception('failed')


class JobWithNoRunMethodManager(jobs.BaseDeferredJobManager):
    pass


class JobManagerUnitTests(test_utils.GenericTestBase):
    """Test basic job manager operations."""

    def test_create_new(self):
        """Test the creation of a new job."""
        job_id = DummyJobManager.create_new()
        self.assertTrue(job_id.startswith('DummyJob'))
        self.assertEqual(
            DummyJobManager.get_status_code(job_id), jobs.STATUS_CODE_NEW)
        self.assertIsNone(DummyJobManager.get_time_queued(job_id))
        self.assertIsNone(DummyJobManager.get_time_started(job_id))
        self.assertIsNone(DummyJobManager.get_time_finished(job_id))
        self.assertIsNone(DummyJobManager.get_metadata(job_id))
        self.assertIsNone(DummyJobManager.get_output(job_id))
        self.assertIsNone(DummyJobManager.get_error(job_id))

        self.assertFalse(DummyJobManager.is_active(job_id))
        self.assertFalse(DummyJobManager.has_finished(job_id))

    def test_enqueue_job(self):
        """Test the enqueueing of a job."""
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        self.assertEqual(
            DummyJobManager.get_status_code(job_id), jobs.STATUS_CODE_QUEUED)
        self.assertIsNotNone(DummyJobManager.get_time_queued(job_id))
        self.assertIsNone(DummyJobManager.get_output(job_id))

    def test_failure_for_job_enqueued_using_wrong_manager(self):
        job_id = DummyJobManager.create_new()
        with self.assertRaisesRegexp(Exception, 'Invalid job type'):
            AnotherDummyJobManager.enqueue(job_id)

    def test_failure_for_job_with_no_run_method(self):
        job_id = JobWithNoRunMethodManager.create_new()
        JobWithNoRunMethodManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(Exception, 'NotImplementedError'):
            self.process_and_flush_pending_tasks()

    def test_complete_job(self):
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            DummyJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        time_queued = DummyJobManager.get_time_queued(job_id)
        time_started = DummyJobManager.get_time_started(job_id)
        time_finished = DummyJobManager.get_time_finished(job_id)
        self.assertIsNotNone(time_queued)
        self.assertIsNotNone(time_started)
        self.assertIsNotNone(time_finished)
        self.assertLess(time_queued, time_started)
        self.assertLess(time_started, time_finished)

        metadata = DummyJobManager.get_metadata(job_id)
        output = DummyJobManager.get_output(job_id)
        error = DummyJobManager.get_error(job_id)
        self.assertIsNone(metadata)
        self.assertEqual(output, 'output')
        self.assertIsNone(error)

        self.assertFalse(DummyJobManager.is_active(job_id))
        self.assertTrue(DummyJobManager.has_finished(job_id))

    def test_job_failure(self):
        job_id = DummyFailingJobManager.create_new()
        DummyFailingJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        self.assertEqual(
            DummyFailingJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)
        time_queued = DummyFailingJobManager.get_time_queued(job_id)
        time_started = DummyFailingJobManager.get_time_started(job_id)
        time_finished = DummyFailingJobManager.get_time_finished(job_id)
        self.assertIsNotNone(time_queued)
        self.assertIsNotNone(time_started)
        self.assertIsNotNone(time_finished)
        self.assertLess(time_queued, time_started)
        self.assertLess(time_started, time_finished)

        metadata = DummyFailingJobManager.get_metadata(job_id)
        output = DummyFailingJobManager.get_output(job_id)
        error = DummyFailingJobManager.get_error(job_id)
        self.assertIsNone(metadata)
        self.assertIsNone(output)
        self.assertIn('failed', error)

        self.assertFalse(DummyFailingJobManager.is_active(job_id))
        self.assertTrue(DummyFailingJobManager.has_finished(job_id))

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        DummyJobManager.register_start(job_id)
        DummyJobManager.register_completion(job_id, 'output')

        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyJobManager.enqueue(job_id)
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyJobManager.register_completion(job_id, 'output')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyJobManager.register_failure(job_id, 'error')

    def test_different_jobs_are_independent(self):
        job_id = DummyJobManager.create_new()
        another_job_id = AnotherDummyJobManager.create_new()

        DummyJobManager.enqueue(job_id)
        DummyJobManager.register_start(job_id)
        AnotherDummyJobManager.enqueue(another_job_id)

        self.assertEqual(
            DummyJobManager.get_status_code(job_id), jobs.STATUS_CODE_STARTED)
        self.assertEqual(
            AnotherDummyJobManager.get_status_code(another_job_id),
            jobs.STATUS_CODE_QUEUED)

    def test_cannot_instantiate_jobs_from_abstract_base_classes(self):
        with self.assertRaisesRegexp(
                Exception, 'directly create a job using the abstract base'):
            jobs.BaseJobManager.create_new()

    def test_cannot_enqueue_same_job_twice(self):
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyJobManager.enqueue(job_id)

    def test_cancel_kills_queued_job(self):
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        self.assertTrue(DummyJobManager.is_active(job_id))
        DummyJobManager.cancel(job_id, 'admin_user_id')

        self.assertFalse(DummyJobManager.is_active(job_id))
        self.assertEquals(
            DummyJobManager.get_status_code(job_id), jobs.STATUS_CODE_CANCELED)
        self.assertIsNone(DummyJobManager.get_output(job_id))
        self.assertEquals(
            DummyJobManager.get_error(job_id), 'Canceled by admin_user_id')

    def test_cancel_kills_started_job(self):
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        self.assertTrue(DummyJobManager.is_active(job_id))
        DummyJobManager.register_start(job_id)

        # Cancel the job immediately after it has started.
        DummyJobManager.cancel(job_id, 'admin_user_id')

        # The job then finishes.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyJobManager.register_completion(job_id, 'job_output')

        self.assertFalse(DummyJobManager.is_active(job_id))
        self.assertEquals(
            DummyJobManager.get_status_code(job_id), jobs.STATUS_CODE_CANCELED)
        # Note that no results are recorded for this job.
        self.assertIsNone(DummyJobManager.get_output(job_id))
        self.assertEquals(
            DummyJobManager.get_error(job_id), 'Canceled by admin_user_id')

    def test_cancel_does_not_kill_completed_job(self):
        job_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job_id)
        self.assertTrue(DummyJobManager.is_active(job_id))
        # Complete the job.
        self.process_and_flush_pending_tasks()

        self.assertFalse(DummyJobManager.is_active(job_id))
        self.assertEquals(
            DummyJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        # Cancel the job after it has finished.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyJobManager.cancel(job_id, 'admin_user_id')

        # The job should still have 'completed' status.
        self.assertFalse(DummyJobManager.is_active(job_id))
        self.assertEquals(
            DummyJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertEquals(DummyJobManager.get_output(job_id), 'output')
        self.assertIsNone(DummyJobManager.get_error(job_id))

    def test_cancel_does_not_kill_failed_job(self):
        job_id = DummyFailingJobManager.create_new()
        DummyFailingJobManager.enqueue(job_id)
        self.assertTrue(DummyFailingJobManager.is_active(job_id))
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        self.assertFalse(DummyFailingJobManager.is_active(job_id))
        self.assertEquals(
            DummyFailingJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)
        # Cancel the job after it has finished.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            DummyFailingJobManager.cancel(job_id, 'admin_user_id')

        # The job should still have 'failed' status.
        self.assertFalse(DummyFailingJobManager.is_active(job_id))
        self.assertEquals(
            DummyFailingJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)
        self.assertIsNone(DummyFailingJobManager.get_output(job_id))
        self.assertIn(
            'raise Exception', DummyFailingJobManager.get_error(job_id))

    def test_cancelling_multiple_unfinished_jobs(self):
        job1_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job1_id)
        job2_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job2_id)

        DummyJobManager.register_start(job1_id)
        DummyJobManager.register_start(job2_id)
        DummyJobManager.cancel_all_unfinished_jobs('admin_user_id')

        self.assertFalse(DummyJobManager.is_active(job1_id))
        self.assertFalse(DummyJobManager.is_active(job2_id))
        self.assertEquals(
            DummyJobManager.get_status_code(job1_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertEquals(
            DummyJobManager.get_status_code(job2_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertIsNone(DummyJobManager.get_output(job1_id))
        self.assertIsNone(DummyJobManager.get_output(job2_id))
        self.assertEquals(
            'Canceled by admin_user_id', DummyJobManager.get_error(job1_id))
        self.assertEquals(
            'Canceled by admin_user_id', DummyJobManager.get_error(job2_id))

    def test_cancelling_one_unfinished_job(self):
        job1_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job1_id)
        job2_id = DummyJobManager.create_new()
        DummyJobManager.enqueue(job2_id)

        DummyJobManager.register_start(job1_id)
        DummyJobManager.register_start(job2_id)
        DummyJobManager.cancel(job1_id, 'admin_user_id')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            self.process_and_flush_pending_tasks()
        DummyJobManager.register_completion(job2_id, 'output')

        self.assertFalse(DummyJobManager.is_active(job1_id))
        self.assertFalse(DummyJobManager.is_active(job2_id))
        self.assertEquals(
            DummyJobManager.get_status_code(job1_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertEquals(
            DummyJobManager.get_status_code(job2_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertIsNone(DummyJobManager.get_output(job1_id))
        self.assertEquals(DummyJobManager.get_output(job2_id), 'output')
        self.assertEquals(
            'Canceled by admin_user_id', DummyJobManager.get_error(job1_id))
        self.assertIsNone(DummyJobManager.get_error(job2_id))


TEST_INPUT_DATA = [(1, 2), (3, 4), (1, 5)]
SUM_MODEL_ID = 'all_data_id'


class NumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class SumModel(ndb.Model):
    total = ndb.IntegerProperty(default=0)
    failed = ndb.BooleanProperty(default=False)


class TestDeferredJobManager(jobs.BaseDeferredJobManager):
    """Base class for testing deferred jobs."""
    pass


class TestAdditionJobManager(TestDeferredJobManager):
    """Test job that sums all NumbersModel data.

    The result is stored in a SumModel entity with id SUM_MODEL_ID.
    """
    @classmethod
    def _run(cls):
        total = sum([
            numbers_model.number for numbers_model in NumbersModel.query()])
        SumModel(id=SUM_MODEL_ID, total=total).put()


class FailingAdditionJobManager(TestDeferredJobManager):
    """Test job that stores stuff in SumModel and then fails."""
    IS_VALID_JOB_CLASS = True

    @classmethod
    def _run(cls):
        total = sum([
            numbers_model.number for numbers_model in NumbersModel.query()])
        SumModel(id=SUM_MODEL_ID, total=total).put()
        raise Exception('Oops, I failed.')

    @classmethod
    def _post_failure_hook(cls, job_id):
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

        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new())
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 6)

        NumbersModel(number=3).put()

        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new())
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_multiple_enqueued_jobs(self):
        self._populate_data()
        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new())

        NumbersModel(number=3).put()
        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new())

        self.assertEqual(self.count_jobs_in_taskqueue(), 2)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_failing_job(self):
        self._populate_data()
        job_id = FailingAdditionJobManager.create_new()
        FailingAdditionJobManager.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        with self.assertRaisesRegexp(
                taskqueue_services.PermanentTaskFailure, 'Oops, I failed'):
            self.process_and_flush_pending_tasks()
        # The work that the failing job did before it failed is still done.
        self.assertEqual(self._get_stored_total(), 6)

        # The post-failure hook should have run.
        self.assertTrue(SumModel.get_by_id(SUM_MODEL_ID).failed)

        self.assertTrue(
            FailingAdditionJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)


class SampleMapReduceJobManager(jobs.BaseMapReduceJobManager):
    """Test job that counts the total number of explorations."""

    @classmethod
    def entity_class_to_map_over(cls):
        return exp_models.ExplorationModel

    @staticmethod
    def map(item):
        yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, sum([int(value) for value in values]))


class MapReduceJobIntegrationTests(test_utils.GenericTestBase):
    """Tests MapReduce jobs end-to-end."""

    def setUp(self):
        """Create an exploration so that there is something to count."""
        super(MapReduceJobIntegrationTests, self).setUp()
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', 'title', 'A category')
        exp_services.save_new_exploration('owner_id', exploration)

    def test_count_all_explorations(self):
        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            SampleMapReduceJobManager.get_output(job_id), [['sum', 1]])
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
