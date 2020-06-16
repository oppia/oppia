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

"""Tests for long running jobs and continuous computations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging
import re

from core import jobs
from core import jobs_registry
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils

from google.appengine.ext import ndb
from mapreduce import input_readers

(base_models, exp_models, stats_models, job_models) = (
    models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.exploration,
        models.NAMES.statistics, models.NAMES.job]))
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()

JOB_FAILED_MESSAGE = 'failed (as expected)'


class MockJobManagerOne(jobs.BaseDeferredJobManager):
    @classmethod
    def _run(cls, additional_job_params):
        return 'output'


class MockJobManagerTwo(jobs.BaseDeferredJobManager):
    pass


class MockJobManagerWithParams(jobs.BaseDeferredJobManager):
    @classmethod
    def _run(cls, additional_job_params):
        return additional_job_params['correct']


class MockFailingJobManager(jobs.BaseDeferredJobManager):
    @classmethod
    def _run(cls, additional_job_params):
        raise Exception(JOB_FAILED_MESSAGE)


class MockJobManagerWithNoRunMethod(jobs.BaseDeferredJobManager):
    pass


class JobManagerUnitTests(test_utils.GenericTestBase):
    """Test basic job manager operations."""

    def test_create_new(self):
        """Test the creation of a new job."""
        job_id = MockJobManagerOne.create_new()
        self.assertTrue(job_id.startswith('MockJobManagerOne'))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id), jobs.STATUS_CODE_NEW)
        self.assertIsNone(MockJobManagerOne.get_time_queued_msec(job_id))
        self.assertIsNone(MockJobManagerOne.get_time_started_msec(job_id))
        self.assertIsNone(MockJobManagerOne.get_time_finished_msec(job_id))
        self.assertIsNone(MockJobManagerOne.get_metadata(job_id))
        self.assertIsNone(MockJobManagerOne.get_output(job_id))
        self.assertIsNone(MockJobManagerOne.get_error(job_id))

        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertFalse(MockJobManagerOne.has_finished(job_id))

    def test_base_job_manager_enqueue_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseJobManager should implement _real_enqueue().'):
            jobs.BaseJobManager._real_enqueue(  # pylint: disable=protected-access
                'job_id', taskqueue_services.QUEUE_NAME_DEFAULT, None, None)

    def test_failing_jobs(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        # Mocks GoogleCloudStorageInputReader() to fail a job.
        _mock_input_reader = lambda _, __: python_utils.divide(1, 0)

        input_reader_swap = self.swap(
            input_readers, 'GoogleCloudStorageInputReader', _mock_input_reader)
        assert_raises_context_manager = self.assertRaises(Exception)

        job_id = MockJobManagerOne.create_new()
        store_map_reduce_results = jobs.StoreMapReduceResults()

        with input_reader_swap, assert_raises_context_manager, logging_swap:
            store_map_reduce_results.run(
                job_id, 'core.jobs_test.MockJobManagerOne', 'output')

        expected_log_message = 'Job %s failed at' % job_id

        # The first log message is ignored as it is the traceback.
        self.assertEqual(len(observed_log_messages), 2)
        self.assertTrue(
            observed_log_messages[1].startswith(expected_log_message))

    def test_enqueue_job(self):
        """Test the enqueueing of a job."""
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 1)

        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id), jobs.STATUS_CODE_QUEUED)
        self.assertIsNotNone(MockJobManagerOne.get_time_queued_msec(job_id))
        self.assertIsNone(MockJobManagerOne.get_output(job_id))

    def test_failure_for_job_enqueued_using_wrong_manager(self):
        job_id = MockJobManagerOne.create_new()
        with self.assertRaisesRegexp(Exception, 'Invalid job type'):
            MockJobManagerTwo.enqueue(
                job_id, taskqueue_services.QUEUE_NAME_DEFAULT)

    def test_failure_for_job_with_no_run_method(self):
        job_id = MockJobManagerWithNoRunMethod.create_new()
        MockJobManagerWithNoRunMethod.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        with self.assertRaisesRegexp(Exception, 'NotImplementedError'):
            self.process_and_flush_pending_tasks()

    def test_complete_job(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        time_queued_msec = MockJobManagerOne.get_time_queued_msec(job_id)
        time_started_msec = MockJobManagerOne.get_time_started_msec(job_id)
        time_finished_msec = MockJobManagerOne.get_time_finished_msec(job_id)
        self.assertIsNotNone(time_queued_msec)
        self.assertIsNotNone(time_started_msec)
        self.assertIsNotNone(time_finished_msec)
        self.assertLess(time_queued_msec, time_started_msec)
        self.assertLess(time_started_msec, time_finished_msec)

        metadata = MockJobManagerOne.get_metadata(job_id)
        output = MockJobManagerOne.get_output(job_id)
        error = MockJobManagerOne.get_error(job_id)
        self.assertIsNone(metadata)
        self.assertEqual(output, ['output'])
        self.assertIsNone(error)

        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertTrue(MockJobManagerOne.has_finished(job_id))

    def test_deferred_job_with_additional_params(self):
        """Test the enqueueing of a job with additional parameters."""
        job_id_1 = MockJobManagerWithParams.create_new()
        MockJobManagerWithParams.enqueue(
            job_id_1, taskqueue_services.QUEUE_NAME_DEFAULT,
            additional_job_params={'random': 3, 'correct': 60})
        job_id_2 = MockJobManagerWithParams.create_new()
        MockJobManagerWithParams.enqueue(
            job_id_2, taskqueue_services.QUEUE_NAME_DEFAULT,
            additional_job_params={'random': 20, 'correct': 25})

        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            2)
        self.process_and_flush_pending_tasks()

        self.assertTrue(MockJobManagerWithParams.has_finished(job_id_1))
        self.assertEqual(MockJobManagerWithParams.get_output(job_id_1), ['60'])
        self.assertTrue(MockJobManagerWithParams.has_finished(job_id_2))
        self.assertEqual(MockJobManagerWithParams.get_output(job_id_2), ['25'])

    def test_job_failure(self):
        job_id = MockFailingJobManager.create_new()
        MockFailingJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        self.assertEqual(
            MockFailingJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)
        time_queued_msec = MockFailingJobManager.get_time_queued_msec(job_id)
        time_started_msec = MockFailingJobManager.get_time_started_msec(
            job_id)
        time_finished_msec = MockFailingJobManager.get_time_finished_msec(
            job_id)
        self.assertIsNotNone(time_queued_msec)
        self.assertIsNotNone(time_started_msec)
        self.assertIsNotNone(time_finished_msec)
        self.assertLess(time_queued_msec, time_started_msec)
        self.assertLess(time_started_msec, time_finished_msec)

        metadata = MockFailingJobManager.get_metadata(job_id)
        output = MockFailingJobManager.get_output(job_id)
        error = MockFailingJobManager.get_error(job_id)
        self.assertIsNone(metadata)
        self.assertIsNone(output)
        self.assertIn(JOB_FAILED_MESSAGE, error)

        self.assertFalse(MockFailingJobManager.is_active(job_id))
        self.assertTrue(MockFailingJobManager.has_finished(job_id))

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(job_id, ['output'])

        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.enqueue(
                job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.register_completion(job_id, ['output'])
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.register_failure(job_id, 'error')

    def test_different_jobs_are_independent(self):
        job_id = MockJobManagerOne.create_new()
        another_job_id = MockJobManagerTwo.create_new()

        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerTwo.enqueue(
            another_job_id, taskqueue_services.QUEUE_NAME_DEFAULT)

        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id), jobs.STATUS_CODE_STARTED)
        self.assertEqual(
            MockJobManagerTwo.get_status_code(another_job_id),
            jobs.STATUS_CODE_QUEUED)

    def test_cannot_instantiate_jobs_from_abstract_base_classes(self):
        with self.assertRaisesRegexp(
            Exception, 'directly create a job using the abstract base'
            ):
            jobs.BaseJobManager.create_new()

    def test_cannot_enqueue_same_job_twice(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.enqueue(
                job_id, taskqueue_services.QUEUE_NAME_DEFAULT)

    def test_can_enqueue_two_instances_of_the_same_job(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        job_id_2 = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job_id_2, taskqueue_services.QUEUE_NAME_DEFAULT)

    def test_cancel_kills_queued_job(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertTrue(MockJobManagerOne.is_active(job_id))
        MockJobManagerOne.cancel(job_id, 'admin_user_id')

        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertIsNone(MockJobManagerOne.get_output(job_id))
        self.assertEqual(
            MockJobManagerOne.get_error(job_id), 'Canceled by admin_user_id')

    def test_cancel_kills_started_job(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertTrue(MockJobManagerOne.is_active(job_id))
        MockJobManagerOne.register_start(job_id)

        # Cancel the job immediately after it has started.
        MockJobManagerOne.cancel(job_id, 'admin_user_id')

        # The job then finishes.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.register_completion(job_id, ['job_output'])

        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id),
            jobs.STATUS_CODE_CANCELED)
        # Note that no results are recorded for this job.
        self.assertIsNone(MockJobManagerOne.get_output(job_id))
        self.assertEqual(
            MockJobManagerOne.get_error(job_id), 'Canceled by admin_user_id')

    def test_cancel_does_not_kill_completed_job(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertTrue(MockJobManagerOne.is_active(job_id))
        # Complete the job.
        self.process_and_flush_pending_tasks()

        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        # Cancel the job after it has finished.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.cancel(job_id, 'admin_user_id')

        # The job should still have 'completed' status.
        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(MockJobManagerOne.get_output(job_id), ['output'])
        self.assertIsNone(MockJobManagerOne.get_error(job_id))

    def test_cancel_does_not_kill_failed_job(self):
        job_id = MockFailingJobManager.create_new()
        MockFailingJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertTrue(MockFailingJobManager.is_active(job_id))
        with self.assertRaisesRegexp(Exception, 'Task failed'):
            self.process_and_flush_pending_tasks()

        self.assertFalse(MockFailingJobManager.is_active(job_id))
        self.assertEqual(
            MockFailingJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)
        # Cancel the job after it has finished.
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockFailingJobManager.cancel(job_id, 'admin_user_id')

        # The job should still have 'failed' status.
        self.assertFalse(MockFailingJobManager.is_active(job_id))
        self.assertEqual(
            MockFailingJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_FAILED)
        self.assertIsNone(MockFailingJobManager.get_output(job_id))
        self.assertIn(
            'raise Exception', MockFailingJobManager.get_error(job_id))

    def test_cancelling_multiple_unfinished_jobs(self):
        job1_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job1_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        job2_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job2_id, taskqueue_services.QUEUE_NAME_DEFAULT)

        MockJobManagerOne.register_start(job1_id)
        MockJobManagerOne.register_start(job2_id)
        MockJobManagerOne.cancel_all_unfinished_jobs('admin_user_id')

        self.assertFalse(MockJobManagerOne.is_active(job1_id))
        self.assertFalse(MockJobManagerOne.is_active(job2_id))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job1_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertEqual(
            MockJobManagerOne.get_status_code(job2_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertIsNone(MockJobManagerOne.get_output(job1_id))
        self.assertIsNone(MockJobManagerOne.get_output(job2_id))
        self.assertEqual(
            'Canceled by admin_user_id', MockJobManagerOne.get_error(job1_id))
        self.assertEqual(
            'Canceled by admin_user_id', MockJobManagerOne.get_error(job2_id))

    def test_cancelling_one_unfinished_job(self):
        job1_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job1_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        job2_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job2_id, taskqueue_services.QUEUE_NAME_DEFAULT)

        MockJobManagerOne.register_start(job1_id)
        MockJobManagerOne.register_start(job2_id)
        MockJobManagerOne.cancel(job1_id, 'admin_user_id')
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            self.process_and_flush_pending_tasks()
        MockJobManagerOne.register_completion(job2_id, ['output'])

        self.assertFalse(MockJobManagerOne.is_active(job1_id))
        self.assertFalse(MockJobManagerOne.is_active(job2_id))
        self.assertEqual(
            MockJobManagerOne.get_status_code(job1_id),
            jobs.STATUS_CODE_CANCELED)
        self.assertEqual(
            MockJobManagerOne.get_status_code(job2_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertIsNone(MockJobManagerOne.get_output(job1_id))
        self.assertEqual(MockJobManagerOne.get_output(job2_id), ['output'])
        self.assertEqual(
            'Canceled by admin_user_id', MockJobManagerOne.get_error(job1_id))
        self.assertIsNone(MockJobManagerOne.get_error(job2_id))

    def test_compress_output_list_with_single_char_outputs(self):
        job_id = MockJobManagerOne.create_new()
        input_list = [1, 2, 3, 4, 5]
        expected_output = ['1', '2', '3', '<TRUNCATED>']
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(
            job_id, input_list, max_output_len_chars=3)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)

    def test_compress_output_list_with_multi_char_outputs(self):
        job_id = MockJobManagerOne.create_new()
        input_list = ['abcd', 'efgh', 'ijkl']
        expected_output = ['abcd', 'efgh', 'ij <TRUNCATED>']
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(
            job_id, input_list, max_output_len_chars=10)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)

    def test_compress_output_list_with_zero_max_output_len(self):
        job_id = MockJobManagerOne.create_new()
        input_list = [1, 2, 3]
        expected_output = ['<TRUNCATED>']
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(
            job_id, input_list, max_output_len_chars=0)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)

    def test_compress_output_list_with_exact_max_output_len(self):
        job_id = MockJobManagerOne.create_new()
        input_list = ['abc']
        expected_output = ['abc']
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(
            job_id, input_list, max_output_len_chars=3)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)

    def test_compress_output_list_with_empty_outputs(self):
        job_id = MockJobManagerOne.create_new()
        input_list = []
        expected_output = []
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(job_id, input_list)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)

    def test_compress_output_list_with_duplicate_outputs(self):
        job_id = MockJobManagerOne.create_new()
        input_list = ['bar', 'foo'] * 3
        expected_output = ['(3x) bar', '(3x) foo']
        max_length_for_output = sum(len(s) for s in expected_output)
        MockJobManagerOne.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(
            job_id, input_list, max_output_len_chars=max_length_for_output)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)

    def test_compress_output_list_with_truncated_duplicate_outputs(self):
        job_id = MockJobManagerOne.create_new()
        input_list = ['supercalifragilisticexpialidocious'] * 3
        expected_output = ['(3x) super <TRUNCATED>']
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        MockJobManagerOne.register_start(job_id)
        MockJobManagerOne.register_completion(
            job_id, input_list, max_output_len_chars=10)
        actual_output = MockJobManagerOne.get_output(job_id)
        self.assertEqual(actual_output, expected_output)


SUM_MODEL_ID = 'all_data_id'


class MockNumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class MockSumModel(ndb.Model):
    total = ndb.IntegerProperty(default=0)
    failed = ndb.BooleanProperty(default=False)


class TestDeferredJobManager(jobs.BaseDeferredJobManager):
    """Base class for testing deferred jobs."""
    pass


class TestAdditionJobManager(TestDeferredJobManager):
    """Test job that sums all MockNumbersModel data.

    The result is stored in a MockSumModel entity with id SUM_MODEL_ID.
    """
    @classmethod
    def _run(cls, additional_job_params):
        total = sum([
            numbers_model.number for numbers_model in MockNumbersModel.query()])
        MockSumModel(id=SUM_MODEL_ID, total=total).put()


class FailingAdditionJobManager(TestDeferredJobManager):
    """Test job that stores stuff in MockSumModel and then fails."""

    @classmethod
    def _run(cls, additional_job_params):
        total = sum([
            numbers_model.number for numbers_model in MockNumbersModel.query()])
        MockSumModel(id=SUM_MODEL_ID, total=total).put()
        raise Exception('Oops, I failed.')

    @classmethod
    def _post_failure_hook(cls, job_id):
        model = MockSumModel.get_by_id(SUM_MODEL_ID)
        model.failed = True
        model.put()


class DatastoreJobIntegrationTests(test_utils.GenericTestBase):
    """Tests the behavior of a job that affects data in the datastore.

    This job gets all MockNumbersModel instances and sums their values, and puts
    the summed values in a MockSumModel instance with id SUM_MODEL_ID. The
    computation is redone from scratch each time the job is run.
    """

    def _get_stored_total(self):
        """Returns the total summed values of all the MockNumbersModel instances
        stored in a MockSumModel instance.
        """
        sum_model = MockSumModel.get_by_id(SUM_MODEL_ID)
        return sum_model.total if sum_model else 0

    def _populate_data(self):
        """Populate the datastore with four MockNumbersModel instances."""
        MockNumbersModel(number=1).put()
        MockNumbersModel(number=2).put()
        MockNumbersModel(number=1).put()
        MockNumbersModel(number=2).put()

    def test_sequential_jobs(self):
        self._populate_data()
        self.assertEqual(self._get_stored_total(), 0)

        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new(),
            taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 6)

        MockNumbersModel(number=3).put()

        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new(),
            taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_multiple_enqueued_jobs(self):
        self._populate_data()
        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new(),
            taskqueue_services.QUEUE_NAME_DEFAULT)

        MockNumbersModel(number=3).put()
        TestAdditionJobManager.enqueue(
            TestAdditionJobManager.create_new(),
            taskqueue_services.QUEUE_NAME_DEFAULT)

        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            2)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self._get_stored_total(), 9)

    def test_failing_job(self):
        self._populate_data()
        job_id = FailingAdditionJobManager.create_new()
        FailingAdditionJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)

        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        with self.assertRaisesRegexp(
            taskqueue_services.PermanentTaskFailure, 'Oops, I failed'
            ):
            self.process_and_flush_pending_tasks()
        # The work that the failing job did before it failed is still done.
        self.assertEqual(self._get_stored_total(), 6)

        # The post-failure hook should have run.
        self.assertTrue(MockSumModel.get_by_id(SUM_MODEL_ID).failed)

        self.assertTrue(
            FailingAdditionJobManager.get_status_code(job_id),
            msg=jobs.STATUS_CODE_FAILED)


class SampleMapReduceJobManager(jobs.BaseMapReduceJobManager):
    """Test job that counts the total number of explorations."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        current_class = SampleMapReduceJobManager
        if current_class.entity_created_before_job_queued(item):
            yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, sum([int(value) for value in values]))


class MapReduceJobForCheckingParamNames(jobs.BaseMapReduceOneOffJobManager):
    """Test job that checks correct param_name."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        jobs.BaseMapReduceOneOffJobManager.get_mapper_param('exp_id')


class ParamNameTests(test_utils.GenericTestBase):

    def test_job_raises_error_with_invalid_param_name(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id_1')
        exp_services.save_new_exploration('owner_id', exploration)

        job_id = MapReduceJobForCheckingParamNames.create_new()
        params = {
            'invalid_param_name': 'exp_id_1'
        }

        MapReduceJobForCheckingParamNames.enqueue(
            job_id, additional_job_params=params)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'MapReduce task to URL .+ failed')

        with assert_raises_regexp_context_manager:
            self.process_and_flush_pending_tasks()

    def test_job_with_correct_param_name(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id_1')
        exp_services.save_new_exploration('owner_id', exploration)

        job_id = MapReduceJobForCheckingParamNames.create_new()
        params = {
            'exp_id': 'exp_id_1'
        }

        MapReduceJobForCheckingParamNames.enqueue(
            job_id, additional_job_params=params)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_tasks()

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)


class MapReduceJobIntegrationTests(test_utils.GenericTestBase):
    """Tests MapReduce jobs end-to-end."""

    def setUp(self):
        """Create an exploration so that there is something to count."""
        super(MapReduceJobIntegrationTests, self).setUp()
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)
        self.process_and_flush_pending_tasks()

    def test_count_all_explorations(self):
        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 1)
        self.process_and_flush_pending_tasks()

        self.assertEqual(jobs.get_job_output(job_id), ['[u\'sum\', 1]'])
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)

    def test_base_map_reduce_job_manager_entity_classes_to_map_over_raise_error(
            self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Classes derived from BaseMapReduceJobManager must implement '
            'entity_classes_to_map_over()'):
            jobs.BaseMapReduceJobManager.entity_classes_to_map_over()

    def test_base_map_reduce_job_manager_map_raise_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Classes derived from BaseMapReduceJobManager must implement '
            'map as a @staticmethod.'):
            jobs.BaseMapReduceJobManager.map('item')

    def test_base_map_reduce_job_manager_reduce_raise_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Classes derived from BaseMapReduceJobManager must implement '
            'reduce as a @staticmethod'):
            jobs.BaseMapReduceJobManager.reduce('key', [])

    def test_raises_error_with_existing_mapper_param(self):
        job_id = SampleMapReduceJobManager.create_new()
        with self.assertRaisesRegexp(
            Exception,
            'Additional job param entity_kinds shadows an existing mapper '
            'param'):
            SampleMapReduceJobManager.enqueue(
                job_id, taskqueue_services.QUEUE_NAME_DEFAULT,
                additional_job_params={'entity_kinds': ''})


class JobRegistryTests(test_utils.GenericTestBase):
    """Tests job registry."""

    def test_each_one_off_class_is_subclass_of_base_job_manager(self):
        for klass in jobs_registry.ONE_OFF_JOB_MANAGERS:
            self.assertTrue(issubclass(klass, jobs.BaseJobManager))

    def test_is_abstract_method_raises_exception_for_abstract_classes(self):
        class TestMockAbstractClass(jobs.BaseJobManager):
            """A sample Abstract Class."""
            pass

        mock_abstract_base_classes = [TestMockAbstractClass]
        with self.assertRaisesRegexp(
            Exception,
            'Tried to directly create a job using the abstract base '
            'manager class TestMockAbstractClass, which is not allowed.'):
            with self.swap(
                jobs, 'ABSTRACT_BASE_CLASSES', mock_abstract_base_classes):
                TestMockAbstractClass.create_new()

    def test_each_one_off_class_is_not_abstract(self):
        for klass in jobs_registry.ONE_OFF_JOB_MANAGERS:
            klass.create_new()

    def test_validity_of_each_continuous_computation_class(self):
        for klass in jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS:
            self.assertTrue(
                issubclass(klass, jobs.BaseContinuousComputationManager))

            event_types_listened_to = klass.get_event_types_listened_to()
            self.assertTrue(isinstance(event_types_listened_to, list))
            for event_type in event_types_listened_to:
                self.assertTrue(
                    isinstance(event_type, python_utils.BASESTRING))
                self.assertTrue(issubclass(
                    event_services.Registry.get_event_class_by_type(
                        event_type),
                    event_services.BaseEventHandler))

            rdc = klass._get_realtime_datastore_class()  # pylint: disable=protected-access
            self.assertTrue(issubclass(
                rdc, jobs.BaseRealtimeDatastoreClassForContinuousComputations))

            # The list of allowed base classes. This can be extended as the
            # need arises, though we may also want to implement
            # _get_continuous_computation_class() and
            # entity_created_before_job_queued() for other base classes
            # that are added to this list.
            allowed_base_batch_job_classes = [
                jobs.BaseMapReduceJobManagerForContinuousComputations]
            self.assertTrue(any([
                issubclass(klass._get_batch_job_manager_class(), superclass)  # pylint: disable=protected-access
                for superclass in allowed_base_batch_job_classes]))


class BaseMapReduceJobManagerForContinuousComputationsTests(
        test_utils.GenericTestBase):

    def test_raise_error_with_get_continuous_computation_class(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of '
                'BaseMapReduceJobManagerForContinuousComputations must '
                'implement the _get_continuous_computation_class() method.')):
            (
                jobs.BaseMapReduceJobManagerForContinuousComputations.  # pylint: disable=protected-access
                _get_continuous_computation_class()
            )

    def test_raise_error_with_post_cancel_hook(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of '
                'BaseMapReduceJobManagerForContinuousComputations must '
                'implement the _get_continuous_computation_class() method.')):
            (
                jobs.BaseMapReduceJobManagerForContinuousComputations.  # pylint: disable=protected-access
                _post_cancel_hook('job_id', 'cancel message')
            )

    def test_raise_error_with_post_failure_hook(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of '
                'BaseMapReduceJobManagerForContinuousComputations must '
                'implement the _get_continuous_computation_class() method.')):
            (
                jobs.BaseMapReduceJobManagerForContinuousComputations.  # pylint: disable=protected-access
                _post_failure_hook('job_id')
            )


class BaseContinuousComputationManagerTests(test_utils.GenericTestBase):

    def test_raise_error_with_get_event_types_listened_to(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of BaseContinuousComputationManager must implement '
                'get_event_types_listened_to(). This method should return a '
                'list of strings, each representing an event type that this '
                'class subscribes to.')):
            jobs.BaseContinuousComputationManager.get_event_types_listened_to()

    def test_raise_error_with_get_realtime_datastore_class(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of BaseContinuousComputationManager must implement '
                '_get_realtime_datastore_class(). This method should return '
                'the datastore class to be used by the realtime layer.')):
            jobs.BaseContinuousComputationManager._get_realtime_datastore_class(  # pylint: disable=protected-access
                )

    def test_raise_error_with_get_batch_job_manager_class(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of BaseContinuousComputationManager must implement '
                '_get_batch_job_manager_class(). This method should return the'
                'manager class for the continuously-running batch job.')):
            jobs.BaseContinuousComputationManager._get_batch_job_manager_class()  # pylint: disable=protected-access

    def test_raise_error_with_handle_incoming_event(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            re.escape(
                'Subclasses of BaseContinuousComputationManager must implement '
                '_handle_incoming_event(...). Please check the docstring of '
                'this method in jobs.BaseContinuousComputationManager for '
                'important developer information.')):
            jobs.BaseContinuousComputationManager._handle_incoming_event(  # pylint: disable=protected-access
                1, 'event_type')


class JobQueriesTests(test_utils.GenericTestBase):
    """Tests queries for jobs."""

    def test_get_data_for_recent_jobs(self):
        self.assertEqual(jobs.get_data_for_recent_jobs(), [])

        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        recent_jobs = jobs.get_data_for_recent_jobs()
        self.assertEqual(len(recent_jobs), 1)
        self.assertDictContainsSubset({
            'id': job_id,
            'status_code': jobs.STATUS_CODE_QUEUED,
            'job_type': 'MockJobManagerOne',
            'is_cancelable': True,
            'error': None
        }, recent_jobs[0])


class TwoClassesMapReduceJobManager(jobs.BaseMapReduceJobManager):
    """A test job handler that counts entities in two datastore classes."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel, exp_models.ExplorationRightsModel]

    @staticmethod
    def map(item):
        yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield [key, sum([int(value) for value in values])]


class TwoClassesMapReduceJobIntegrationTests(test_utils.GenericTestBase):
    """Tests MapReduce jobs using two classes end-to-end."""

    def setUp(self):
        """Create an exploration so that there is something to count."""
        super(TwoClassesMapReduceJobIntegrationTests, self).setUp()
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        # Note that this ends up creating an entry in the
        # ExplorationRightsModel as well.
        exp_services.save_new_exploration('owner_id', exploration)
        self.process_and_flush_pending_tasks()

    def test_count_entities(self):
        self.assertEqual(exp_models.ExplorationModel.query().count(), 1)
        self.assertEqual(exp_models.ExplorationRightsModel.query().count(), 1)

        job_id = TwoClassesMapReduceJobManager.create_new()
        TwoClassesMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()

        self.assertEqual(
            TwoClassesMapReduceJobManager.get_output(job_id), ['[u\'sum\', 2]'])
        self.assertEqual(
            TwoClassesMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)


class MockStartExplorationRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    count = ndb.IntegerProperty(default=0)


class MockStartExplorationMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):

    @classmethod
    def _get_continuous_computation_class(cls):
        return StartExplorationEventCounter

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        current_class = MockStartExplorationMRJobManager
        if current_class.entity_created_before_job_queued(item):
            yield (
                item.exploration_id, {
                    'event_type': item.event_type,
                })

    @staticmethod
    def reduce(key, stringified_values):
        started_count = 0
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                started_count += 1
        stats_models.ExplorationAnnotationsModel(
            id=key, num_starts=started_count).put()


class StartExplorationEventCounter(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that counts 'start exploration' events.

    This class should only be used in tests.
    """

    @classmethod
    def get_event_types_listened_to(cls):
        return [feconf.EVENT_TYPE_START_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return MockStartExplorationRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockStartExplorationMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        """Override this method so that it does not immediately start a
        new MapReduce job. Non-test subclasses should not do this.
        """
        pass

    @classmethod
    def _handle_incoming_event(
            cls, active_realtime_layer, event_type, exp_id, unused_exp_version,
            unused_state_name, unused_session_id, unused_params,
            unused_play_type):

        def _increment_counter():
            """Increments the count, if the realtime model corresponding to the
            active real-time model id exists.
            """
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            realtime_class(
                id=realtime_model_id, count=1,
                realtime_layer=active_realtime_layer).put()

        transaction_services.run_in_transaction(_increment_counter)

    # Public query method.
    @classmethod
    def get_count(cls, exploration_id):
        """Return the number of 'start exploration' events received.

        Answers the query by combining the existing MR job output and the
        active realtime_datastore_class.
        """
        mr_model = stats_models.ExplorationAnnotationsModel.get(
            exploration_id, strict=False)
        realtime_model = cls._get_realtime_datastore_class().get(
            cls.get_active_realtime_layer_id(exploration_id), strict=False)

        answer = 0
        if mr_model is not None:
            answer += mr_model.num_starts
        if realtime_model is not None:
            answer += realtime_model.count
        return answer


class MockMRJobManager(jobs.BaseMapReduceJobManagerForContinuousComputations):

    @classmethod
    def _get_continuous_computation_class(cls):
        return MockContinuousComputationManager

    @classmethod
    def entity_classes_to_map_over(cls):
        return []


class MockContinuousComputationManager(jobs.BaseContinuousComputationManager):
    TIMES_RUN = 0

    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return MockStartExplorationRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        if cls.TIMES_RUN < 2:
            (
                super(cls, MockContinuousComputationManager)
                ._kickoff_batch_job_after_previous_one_ends()
            )
            cls.TIMES_RUN = cls.TIMES_RUN + 1


class ContinuousComputationTests(test_utils.GenericTestBase):
    """Tests continuous computations for 'start exploration' events."""

    EXP_ID = 'exp_id'

    ALL_CC_MANAGERS_FOR_TESTS = [
        StartExplorationEventCounter, MockContinuousComputationManager]

    def setUp(self):
        """Create an exploration and register the event listener manually."""
        super(ContinuousComputationTests, self).setUp()

        exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID)
        exp_services.save_new_exploration('owner_id', exploration)
        self.process_and_flush_pending_tasks()

    def test_cannot_get_entity_with_invalid_id(self):
        with self.assertRaisesRegexp(
            ValueError, 'Invalid realtime id: invalid_entity_id'):
            MockStartExplorationRealtimeModel.get('invalid_entity_id')

    def test_cannot_put_realtime_class_with_invalid_id(self):
        realtime_class = MockStartExplorationRealtimeModel

        with self.assertRaisesRegexp(
            Exception,
            'Realtime layer 1 does not match realtime id '
            'invalid_realtime_model_id'):
            realtime_class(
                id='invalid_realtime_model_id', count=1, realtime_layer=1).put()

    def test_continuous_computation_workflow(self):
        """An integration test for continuous computations."""
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS
            ):
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 0)

            # Record an event. This will put the event in the task queue.
            event_services.StartExplorationEventHandler.record(
                self.EXP_ID, 1, feconf.DEFAULT_INIT_STATE_NAME, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 0)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EVENTS), 1)

            # When the task queue is flushed, the data is recorded in the two
            # realtime layers.
            self.process_and_flush_pending_tasks()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_EVENTS), 0)
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 1)
            self.assertEqual(MockStartExplorationRealtimeModel.get(
                '0:%s' % self.EXP_ID).count, 1)
            self.assertEqual(MockStartExplorationRealtimeModel.get(
                '1:%s' % self.EXP_ID).count, 1)

            # The batch job has not run yet, so no entity for self.EXP_ID will
            # have been created in the batch model yet.
            with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
                stats_models.ExplorationAnnotationsModel.get(self.EXP_ID)

            # Launch the batch computation.
            batch_job_id = StartExplorationEventCounter.start_computation()
            # Data in realtime layer 0 is still there.
            self.assertEqual(MockStartExplorationRealtimeModel.get(
                '0:%s' % self.EXP_ID).count, 1)
            # Data in realtime layer 1 has been deleted.
            self.assertIsNone(MockStartExplorationRealtimeModel.get(
                '1:%s' % self.EXP_ID, strict=False))

            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.assertTrue(
                MockStartExplorationMRJobManager.is_active(batch_job_id))
            self.assertFalse(
                MockStartExplorationMRJobManager.has_finished(batch_job_id))
            self.process_and_flush_pending_tasks()
            self.assertFalse(
                MockStartExplorationMRJobManager.is_active(batch_job_id))
            self.assertTrue(
                MockStartExplorationMRJobManager.has_finished(batch_job_id))
            self.assertEqual(
                stats_models.ExplorationAnnotationsModel.get(
                    self.EXP_ID).num_starts, 1)

            # The overall count is still 1.
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 1)
            # Data in realtime layer 0 has been deleted.
            self.assertIsNone(MockStartExplorationRealtimeModel.get(
                '0:%s' % self.EXP_ID, strict=False))
            # Data in realtime layer 1 has been deleted.
            self.assertIsNone(MockStartExplorationRealtimeModel.get(
                '1:%s' % self.EXP_ID, strict=False))

    def test_events_coming_in_while_batch_job_is_running(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS
            ):
            # Currently no events have been recorded.
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 0)

            # Enqueue the batch computation. (It is running on 0 events).
            StartExplorationEventCounter._kickoff_batch_job()  # pylint: disable=protected-access
            # Record an event while this job is in the queue. Simulate
            # this by directly calling on_incoming_event(), because using
            # StartExplorationEventHandler.record() would just put the event
            # in the task queue, which we don't want to flush yet.
            event_services.StartExplorationEventHandler._handle_event(  # pylint: disable=protected-access
                self.EXP_ID, 1, feconf.DEFAULT_INIT_STATE_NAME, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            StartExplorationEventCounter.on_incoming_event(
                event_services.StartExplorationEventHandler.EVENT_TYPE,
                self.EXP_ID, 1, feconf.DEFAULT_INIT_STATE_NAME, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            # The overall count is now 1.
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 1)

            # Finish the job.
            self.process_and_flush_pending_tasks()
            # When the batch job completes, the overall count is still 1.
            self.assertEqual(
                StartExplorationEventCounter.get_count(self.EXP_ID), 1)
            # The batch job result should still be 0, since the event arrived
            # after the batch job started.
            with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
                stats_models.ExplorationAnnotationsModel.get(self.EXP_ID)

    def test_cannot_start_new_job_while_existing_job_still_running(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS
            ):
            StartExplorationEventCounter.start_computation()
            with self.assertRaisesRegexp(
                Exception,
                'Attempted to start computation StartExplorationEventCounter, '
                'which is already running'):
                StartExplorationEventCounter.start_computation()

            self.process_and_flush_pending_tasks()
            StartExplorationEventCounter.stop_computation('admin_user_id')

    def test_get_continuous_computations_info_with_existing_model(self):
        job_models.ContinuousComputationModel(
            id='StartExplorationEventCounter').put()
        continuous_computations_data = jobs.get_continuous_computations_info(
            [StartExplorationEventCounter])

        expected_continuous_computations_data = [{
            'active_realtime_layer_index': 0,
            'computation_type': 'StartExplorationEventCounter',
            'status_code': 'idle',
            'is_startable': True,
            'is_stoppable': False,
            'last_finished_msec': None,
            'last_started_msec': None,
            'last_stopped_msec': None
        }]

        self.assertEqual(
            expected_continuous_computations_data, continuous_computations_data)

    def test_failing_continuous_job(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        StartExplorationEventCounter.start_computation()

        status = StartExplorationEventCounter.get_status_code()
        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

        with self.swap(logging, 'error', _mock_logging_function):
            StartExplorationEventCounter.on_batch_job_failure()

        self.run_but_do_not_flush_pending_tasks()
        StartExplorationEventCounter.stop_computation('admin_user_id')

        self.assertEqual(
            observed_log_messages, ['Job StartExplorationEventCounter failed.'])

    def test_cancelling_continuous_job(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        StartExplorationEventCounter.start_computation()

        status = StartExplorationEventCounter.get_status_code()
        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

        with self.swap(logging, 'info', _mock_logging_function):
            StartExplorationEventCounter.on_batch_job_canceled()

        self.run_but_do_not_flush_pending_tasks()
        StartExplorationEventCounter.stop_computation('admin_user_id')

        self.assertEqual(
            observed_log_messages,
            ['Job StartExplorationEventCounter canceled.'])

    def test_kickoff_batch_job_after_previous_one_ends(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS
        ):
            self.assertEqual(MockContinuousComputationManager.TIMES_RUN, 0)
            MockContinuousComputationManager.start_computation()
            (
                MockContinuousComputationManager  # pylint: disable=protected-access
                ._kickoff_batch_job_after_previous_one_ends()
            )
            status = MockContinuousComputationManager.get_status_code()

            self.assertEqual(
                status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

            self.run_but_do_not_flush_pending_tasks()
            MockContinuousComputationManager.stop_computation('admin_user_id')
            status = MockContinuousComputationManager.get_status_code()

            self.assertEqual(
                status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)
            self.assertEqual(MockContinuousComputationManager.TIMES_RUN, 1)


# TODO(sll): When we have some concrete ContinuousComputations running in
# production, add an integration test to ensure that the registration of event
# handlers in the main codebase is happening correctly.
