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

"""Tests for continuous computations relating to feedback analytics."""

from core import jobs_registry
from core.domain import feedback_jobs_continuous
from core.domain import feedback_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class MockFeedbackAnalyticsAggregator(
        feedback_jobs_continuous.FeedbackAnalyticsAggregator):
    """A modified FeedbackAnalyticsAggregator that does not start a new batch
    job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockFeedbackAnalyticsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class MockFeedbackAnalyticsMRJobManager(
        feedback_jobs_continuous.FeedbackAnalyticsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return MockFeedbackAnalyticsAggregator


class FeedbackAnalyticsAggregatorUnitTests(test_utils.GenericTestBase):
    """Tests for statistics aggregations.
    Note: We are testing realtime model and MR job separately because in the
    test environment the realtime datastore is not automatically cleared after
    a batch job completes.
    """
    ALL_CC_MANAGERS_FOR_TESTS = [MockFeedbackAnalyticsAggregator]

    def _get_swap_context(self):
        """Substitutes the jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS
        value with ALL_CC_MANAGERS_FOR_TESTS.
        """
        return self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS)

    def _run_job(self):
        """Runs the job, then processes and flushes all the pending tasks."""
        self.process_and_flush_pending_tasks()
        MockFeedbackAnalyticsAggregator.start_computation()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def _run_job_and_check_results(
            self, exp_id, expected_thread_analytics_dict):
        """Runs the job and checks the thread analytics dict."""
        self._run_job()
        self.assertEqual(
            MockFeedbackAnalyticsAggregator.get_thread_analytics(
                exp_id).to_dict(),
            expected_thread_analytics_dict)

    def test_no_threads_job_not_run(self):
        # Create a new exploration, but don't create any threads and don't even
        # start the MR job.
        with self._get_swap_context():
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')
            self.assertEqual(
                MockFeedbackAnalyticsAggregator.get_thread_analytics(
                    exp_id).to_dict(), {
                        'num_open_threads': 0,
                        'num_total_threads': 0,
                    })

    def test_get_thread_analytics_multi(self):
        with self._get_swap_context():
            exp_id_1 = 'eid1'
            exp_id_2 = 'eid2'
            self.save_new_valid_exploration(exp_id_1, 'owner')
            self.save_new_valid_exploration(exp_id_2, 'owner')

            initial_feedback_threads = (
                MockFeedbackAnalyticsAggregator.get_thread_analytics_multi(
                    [exp_id_1, exp_id_2]))
            self.assertEqual(len(initial_feedback_threads), 2)
            self.assertEqual(initial_feedback_threads[0].to_dict(), {
                'num_open_threads': 0,
                'num_total_threads': 0,
            })
            self.assertEqual(initial_feedback_threads[1].to_dict(), {
                'num_open_threads': 0,
                'num_total_threads': 0,
            })

            feedback_services.create_thread(
                'exploration', exp_id_1, 'owner', 'subject', 'text')
            self.process_and_flush_pending_tasks()
            feedback_threads = (
                MockFeedbackAnalyticsAggregator.get_thread_analytics_multi(
                    [exp_id_1, exp_id_2]))
            self.assertEqual(len(feedback_threads), 2)
            self.assertEqual(feedback_threads[0].to_dict(), {
                'num_open_threads': 1,
                'num_total_threads': 1,
            })
            self.assertEqual(feedback_threads[1].to_dict(), {
                'num_open_threads': 0,
                'num_total_threads': 0,
            })

            self._run_job()
            feedback_threads_after_running_job = (
                MockFeedbackAnalyticsAggregator.get_thread_analytics_multi(
                    [exp_id_1, exp_id_2]))
            self.assertEqual(len(feedback_threads_after_running_job), 2)
            self.assertEqual(feedback_threads_after_running_job[0].to_dict(), {
                'num_open_threads': 1,
                'num_total_threads': 1,
            })
            self.assertEqual(feedback_threads_after_running_job[1].to_dict(), {
                'num_open_threads': 0,
                'num_total_threads': 0,
            })

    def test_no_threads(self):
        with self._get_swap_context():
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 0,
                })

    def test_single_thread_single_exp(self):
        with self._get_swap_context():
            exp_id = 'eid'
            thread_id = 'exploration.eid.tid'
            self.save_new_valid_exploration(exp_id, 'owner')
            thread = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id)
            thread.message_count = 0
            thread.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread.entity_id = exp_id
            thread.subject = 'subject'
            thread.put()
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

    def test_multiple_threads_single_exp(self):
        with self._get_swap_context():
            exp_id = 'eid'
            thread_id_1 = 'exploration.eid.tid1'
            thread_id_2 = 'exploration.eid.tid2'
            self.save_new_valid_exploration(exp_id, 'owner')
            thread_1 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_1)
            thread_1.message_count = 0
            thread_1.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_1.entity_id = exp_id
            thread_1.subject = 'subject'
            thread_1.put()
            thread_2 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_2)
            thread_2.message_count = 0
            thread_2.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_2.entity_id = exp_id
            thread_2.subject = 'subject'
            thread_2.put()

            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })

    def test_multiple_threads_multiple_exp(self):
        with self._get_swap_context():
            exp_id_1 = 'eid1'
            exp_id_2 = 'eid2'
            exp_id_3 = 'eid3'
            thread_id_1 = 'exploration.eid1.tid1'
            thread_id_2 = 'exploration.eid1.tid2'
            thread_id_3 = 'exploration.eid3.tid3'
            self.save_new_valid_exploration(exp_id_1, 'owner')
            self.save_new_valid_exploration(exp_id_2, 'owner')
            self.save_new_valid_exploration(exp_id_3, 'owner')

            thread_1 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_1)
            thread_1.message_count = 0
            thread_1.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_1.entity_id = exp_id_1
            thread_1.subject = 'subject'
            thread_1.put()
            thread_2 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_2)
            thread_2.message_count = 0
            thread_2.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_2.entity_id = exp_id_1
            thread_2.subject = 'subject'
            thread_2.put()
            thread_3 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_3)
            thread_3.message_count = 0
            thread_3.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_3.entity_id = exp_id_3
            thread_3.subject = 'subject'
            thread_3.put()
            self.process_and_flush_pending_tasks()
            MockFeedbackAnalyticsAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()
            # Do a multi call for all explorations and check for stats.
            feedback_analytics_multi = (
                MockFeedbackAnalyticsAggregator
                .get_thread_analytics_multi([exp_id_1, exp_id_2, exp_id_3]))
            self.assertEqual(
                feedback_analytics_multi[0].to_dict(),
                {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })
            self.assertEqual(
                feedback_analytics_multi[1].to_dict(),
                {
                    'num_open_threads': 0,
                    'num_total_threads': 0,
                })
            self.assertEqual(
                feedback_analytics_multi[2].to_dict(),
                {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })
            # Do calls for each exploration separately and check for stats.
            self.assertEqual(
                MockFeedbackAnalyticsAggregator.get_thread_analytics(
                    exp_id_1).to_dict(),
                {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })
            self.assertEqual(
                MockFeedbackAnalyticsAggregator.get_thread_analytics(
                    exp_id_2).to_dict(),
                {
                    'num_open_threads': 0,
                    'num_total_threads': 0,
                })
            self.assertEqual(
                MockFeedbackAnalyticsAggregator.get_thread_analytics(
                    exp_id_3).to_dict(),
                {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

    def test_thread_closed_job_running(self):
        with self._get_swap_context():
            # Create test objects.
            user_id = 'uid'
            exp_id = 'eid'
            thread_id_1 = 'exploration.eid.tid1'
            self.save_new_valid_exploration(exp_id, 'owner')
            thread_1 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_1)
            thread_1.message_count = 0
            thread_1.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_1.entity_id = exp_id
            thread_1.subject = 'subject'
            thread_1.put()

            # Start job.
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

            # Stop job.
            MockFeedbackAnalyticsAggregator.stop_computation(user_id)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Close thread.
            thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
                thread_id_1)
            thread.status = feedback_models.STATUS_CHOICES_FIXED
            thread.put()

            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

    def test_thread_closed_reopened_again(self):
        with self._get_swap_context():
            # Create test objects.
            user_id = 'uid'
            exp_id = 'eid'
            thread_id_1 = 'exploration.eid.tid1'
            self.save_new_valid_exploration(exp_id, 'owner')
            thread_1 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_1)
            thread_1.message_count = 0
            thread_1.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_1.entity_id = exp_id
            thread_1.subject = 'subject'
            thread_1.put()

            # Start job.
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

            # Stop job.
            MockFeedbackAnalyticsAggregator.stop_computation(user_id)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Close thread.
            thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
                thread_id_1)
            thread.status = feedback_models.STATUS_CHOICES_FIXED
            thread.put()

            # Restart job.
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

            # Stop job.
            MockFeedbackAnalyticsAggregator.stop_computation(user_id)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Reopen thread.
            thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
                thread_id_1)
            thread.status = feedback_models.STATUS_CHOICES_OPEN
            thread.put()

            # Restart job.
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

    def test_thread_closed_status_changed(self):
        with self._get_swap_context():
            # Create test objects.
            user_id = 'uid'
            exp_id = 'eid'
            thread_id_1 = 'exploration.eid.tid1'
            self.save_new_valid_exploration(exp_id, 'owner')
            thread_1 = feedback_models.GeneralFeedbackThreadModel.create(
                thread_id_1)
            thread_1.message_count = 0
            thread_1.entity_type = feconf.ENTITY_TYPE_EXPLORATION
            thread_1.entity_id = exp_id
            thread_1.subject = 'subject'
            thread_1.put()

            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })
            # Stop job.
            MockFeedbackAnalyticsAggregator.stop_computation(user_id)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Close thread.
            thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
                thread_id_1)
            thread.status = feedback_models.STATUS_CHOICES_FIXED
            thread.put()

            # Restart job.
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

            # Stop job.
            MockFeedbackAnalyticsAggregator.stop_computation(user_id)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            # Change thread status.
            thread = feedback_models.GeneralFeedbackThreadModel.get_by_id(
                thread_id_1)
            thread.status = feedback_models.STATUS_CHOICES_IGNORED
            thread.put()

            # Restart job.
            self._run_job_and_check_results(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })


class RealtimeFeedbackAnalyticsUnitTests(test_utils.GenericTestBase):
    """Tests for realtime analytics of feedback models."""

    ALL_CC_MANAGERS_FOR_TESTS = [MockFeedbackAnalyticsAggregator]

    def _get_swap_context(self):
        """Substitutes the jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS
        value with ALL_CC_MANAGERS_FOR_TESTS.
        """
        return self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS)

    def _flush_tasks_and_check_analytics(
            self, exp_id, expected_thread_analytics_dict):
        """Processes and flushes the pending tasks, then checks the thread
        analytics dict.
        """
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            MockFeedbackAnalyticsAggregator.get_thread_analytics(
                exp_id).to_dict(), expected_thread_analytics_dict)

    def test_no_threads(self):
        with self._get_swap_context():
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')

            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 0,
                })

    def test_single_thread_single_exp(self):
        with self._get_swap_context():
            # Create test objects.
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')

            # Trigger thread creation event.
            self.process_and_flush_pending_tasks()
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')

            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

    def test_multiple_threads_single_exp(self):
        with self._get_swap_context():
            # Create test objects.
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')

            # Trigger thread creation events.
            self.process_and_flush_pending_tasks()
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')

            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })

    def test_multiple_threads_multiple_exp(self):
        with self._get_swap_context():
            # Create test objects.
            exp_id_1 = 'eid1'
            exp_id_2 = 'eid2'
            self.save_new_valid_exploration(exp_id_1, 'owner')
            self.save_new_valid_exploration(exp_id_2, 'owner')

            # Trigger thread creation events.
            self.process_and_flush_pending_tasks()
            feedback_services.create_thread(
                'exploration', exp_id_1, None, 'a subject', 'some text')
            feedback_services.create_thread(
                'exploration', exp_id_1, None, 'a subject', 'some text')
            feedback_services.create_thread(
                'exploration', exp_id_2, None, 'a subject', 'some text')
            feedback_services.create_thread(
                'exploration', exp_id_2, None, 'a subject', 'some text')

            self._flush_tasks_and_check_analytics(
                exp_id_1, {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })
            self._flush_tasks_and_check_analytics(
                exp_id_2, {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })

    def test_thread_closed_job_running(self):
        with self._get_swap_context():
            # Create test objects.
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')

            # Trigger thread creation events.
            self.process_and_flush_pending_tasks()
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

            # Trigger close event.
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
            thread_id = threadlist[0].id
            feedback_services.create_message(
                thread_id, 'author', feedback_models.STATUS_CHOICES_FIXED,
                None, 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

    def test_thread_closed_reopened_again(self):
        with self._get_swap_context():
            # Create test objects.
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')

            # Trigger thread creation events.
            self.process_and_flush_pending_tasks()
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')

            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

            # Trigger close event.
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
            thread_id = threadlist[0].id
            feedback_services.create_message(
                thread_id, 'author', feedback_models.STATUS_CHOICES_FIXED,
                None, 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

            # Trigger reopen event.
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
            thread_id = threadlist[0].id
            feedback_services.create_message(
                thread_id, 'author', feedback_models.STATUS_CHOICES_OPEN,
                None, 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

    def test_thread_closed_status_changed(self):
        with self._get_swap_context():
            # Create test objects.
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')

            # Trigger thread creation events.
            self.process_and_flush_pending_tasks()
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')

            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

            # Trigger close event.
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
            thread_id = threadlist[0].id
            feedback_services.create_message(
                thread_id, 'author', feedback_models.STATUS_CHOICES_FIXED,
                None, 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

            # Trigger thread status change event.
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
            thread_id = threadlist[0].id
            feedback_services.create_message(
                thread_id, 'author', feedback_models.STATUS_CHOICES_IGNORED,
                None, 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 0,
                    'num_total_threads': 1,
                })

    def test_realtime_with_batch_computation(self):
        with self._get_swap_context():
            # Create test objects.
            user_id = 'uid'
            exp_id = 'eid'
            self.save_new_valid_exploration(exp_id, 'owner')
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')

            # Start job.
            self.process_and_flush_pending_tasks()
            MockFeedbackAnalyticsAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
            self.process_and_flush_pending_tasks()

            # Stop job.
            MockFeedbackAnalyticsAggregator.stop_computation(user_id)
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 1,
                    'num_total_threads': 1,
                })

            # Create another thread but don't start job.
            feedback_services.create_thread(
                'exploration', exp_id, None, 'a subject', 'some text')
            self._flush_tasks_and_check_analytics(
                exp_id, {
                    'num_open_threads': 2,
                    'num_total_threads': 2,
                })
