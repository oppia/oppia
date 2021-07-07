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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core import jobs
from core import jobs_registry
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import python_utils

from mapreduce import input_readers

(base_models, exp_models, stats_models, job_models) = (
    models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.exploration,
        models.NAMES.statistics, models.NAMES.job]))

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

JOB_FAILED_MESSAGE = 'failed (as expected)'


class MockJobManagerOne(jobs.BaseMapReduceJobManager):
    """Test job that counts the total number of explorations."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        current_class = MockJobManagerOne
        if current_class.entity_created_before_job_queued(item):
            yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, sum([int(value) for value in values]))


class MockJobManagerTwo(jobs.BaseMapReduceJobManager):
    """Test job that counts the total number of explorations."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        current_class = MockJobManagerTwo
        if current_class.entity_created_before_job_queued(item):
            yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, sum([int(value) for value in values]))


class MockFailingJobManager(jobs.BaseMapReduceJobManager):

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        current_class = MockFailingJobManager
        if current_class.entity_created_before_job_queued(item):
            yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, sum([int(value) for value in values]))


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

    def test_enqueue_job(self):
        """Test the enqueueing of a job."""
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id), jobs.STATUS_CODE_QUEUED)
        self.assertIsNotNone(MockJobManagerOne.get_time_queued_msec(job_id))
        self.assertIsNone(MockJobManagerOne.get_output(job_id))

    def test_complete_job(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            MockJobManagerOne.get_status_code(job_id),
            jobs.STATUS_CODE_QUEUED)
        self.process_and_flush_pending_mapreduce_tasks()

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

        output = MockJobManagerOne.get_output(job_id)
        error = MockJobManagerOne.get_error(job_id)
        self.assertEqual(output, [])
        self.assertIsNone(error)

        self.assertFalse(MockJobManagerOne.is_active(job_id))
        self.assertTrue(MockJobManagerOne.has_finished(job_id))

    def test_base_job_manager_enqueue_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseJobManager should implement _real_enqueue().'):
            jobs.BaseJobManager._real_enqueue(  # pylint: disable=protected-access
                'job_id', taskqueue_services.QUEUE_NAME_DEFAULT, None, None)

    def test_cannot_instantiate_jobs_from_abstract_base_classes(self):
        with self.assertRaisesRegexp(
            Exception, 'directly create a job using the abstract base'
            ):
            jobs.BaseJobManager.create_new()

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

    def test_failure_for_job_enqueued_using_wrong_manager(self):
        job_id = MockJobManagerOne.create_new()
        with self.assertRaisesRegexp(Exception, 'Invalid job type'):
            MockJobManagerTwo.enqueue(
                job_id, taskqueue_services.QUEUE_NAME_DEFAULT)

    def test_cancelling_multiple_unfinished_jobs(self):
        job1_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job1_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        job2_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(
            job2_id, taskqueue_services.QUEUE_NAME_DEFAULT)

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

    def test_status_code_transitions(self):
        """Test that invalid status code transitions are caught."""
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)

        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.register_completion(job_id, ['output'])
        with self.assertRaisesRegexp(Exception, 'Invalid status code change'):
            MockJobManagerOne.register_failure(job_id, 'error')

    def test_failing_jobs(self):
        # Mocks GoogleCloudStorageInputReader() to fail a job.
        _mock_input_reader = lambda _, __: python_utils.divide(1, 0)

        input_reader_swap = self.swap(
            input_readers, 'GoogleCloudStorageInputReader', _mock_input_reader)

        job_id = MockJobManagerOne.create_new()
        store_map_reduce_results = jobs.StoreMapReduceResults()

        with python_utils.ExitStack() as stack:
            captured_logs = stack.enter_context(
                self.capture_logging(min_level=logging.ERROR))
            stack.enter_context(input_reader_swap)
            stack.enter_context(
                self.assertRaisesRegexp(
                    Exception,
                    r'Invalid status code change for job '
                    r'MockJobManagerOne-\w+-\w+: from new to failed'
                )
            )

            store_map_reduce_results.run(
                job_id, 'core.jobs_test.MockJobManagerOne', 'output')

        # The first log message is ignored as it is the traceback.
        self.assertEqual(len(captured_logs), 1)
        self.assertTrue(
            captured_logs[0].startswith('Job %s failed at' % job_id))

    def test_register_failure(self):
        job_id = MockJobManagerOne.create_new()
        MockJobManagerOne.enqueue(job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        model = job_models.JobModel.get(job_id, strict=True)
        model.status_code = jobs.STATUS_CODE_STARTED
        model.job_type = MockJobManagerOne.__name__
        MockJobManagerOne.register_failure(job_id, 'Error')
        model = job_models.JobModel.get(job_id, strict=True)
        self.assertEqual(model.error, 'Error')
        self.assertEqual(model.status_code, jobs.STATUS_CODE_FAILED)


SUM_MODEL_ID = 'all_data_id'


class MockNumbersModel(datastore_services.Model):
    number = datastore_services.IntegerProperty()


class MockSumModel(datastore_services.Model):
    total = datastore_services.IntegerProperty(default=0)
    failed = datastore_services.BooleanProperty(default=False)


class FailingAdditionJobManager(jobs.BaseMapReduceJobManager):
    """Test job that stores stuff in MockSumModel and then fails."""

    @classmethod
    def _post_failure_hook(cls, job_id):
        model = MockSumModel.get_by_id(SUM_MODEL_ID)
        model.failed = True
        model.update_timestamps()
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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'MapReduce task failed: Task<.*>')

        with assert_raises_regexp_context_manager:
            self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)


class MapReduceJobIntegrationTests(test_utils.GenericTestBase):
    """Tests MapReduce jobs end-to-end."""

    def setUp(self):
        """Create an exploration so that there is something to count."""
        super(MapReduceJobIntegrationTests, self).setUp()
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_count_all_explorations(self):
        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
        self.process_and_flush_pending_mapreduce_tasks()

    def test_count_entities(self):
        self.assertEqual(exp_models.ExplorationModel.query().count(), 1)
        self.assertEqual(exp_models.ExplorationRightsModel.query().count(), 1)

        job_id = TwoClassesMapReduceJobManager.create_new()
        TwoClassesMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            TwoClassesMapReduceJobManager.get_output(job_id), ['[u\'sum\', 2]'])
        self.assertEqual(
            TwoClassesMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
