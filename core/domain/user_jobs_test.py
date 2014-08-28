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

"""Tests for user dashboard computations."""

__author__ = 'Sean Lip'

from core import jobs_registry
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import user_jobs
from core.tests import test_utils
import feconf


class ModifiedRecentUpdatesAggregator(
        user_jobs.DashboardRecentUpdatesAggregator):
    """A modified DashboardRecentUpdatesAggregator that does not start a new
     batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedRecentUpdatesMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedRecentUpdatesMRJobManager(user_jobs.RecentUpdatesMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedRecentUpdatesAggregator


class RecentUpdatesAggregatorUnitTests(test_utils.GenericTestBase):
    """Tests for computations involving the recent updates section of the
    dashboard.
    """

    ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS = [
        ModifiedRecentUpdatesAggregator]

    def test_basic_computation(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            exp_title = 'Title'
            user_id = 'user_id'

            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id, exp_title, 'Category')
            exp_services.save_new_exploration(user_id, exploration)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id))
            self.assertEqual(len(recent_updates), 1)
            self.assertDictContainsSubset({
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'activity_id': exp_id,
                'activity_title': exp_title,
                'author_id': user_id,
                'subject': (
                    'New exploration created with title \'%s\'.' % exp_title),
            }, recent_updates[0])

    def test_basic_computation_with_an_update_after_creation(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            exp_title = 'Title'
            user_id = 'user_id'

            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id, exp_title, 'Category')
            exp_services.save_new_exploration(user_id, exploration)

            # Another user makes a commit; this, too, shows up in the
            # original user's dashboard.
            another_user_id = 'another_user_id'
            exp_services.update_exploration(
                another_user_id, exp_id, [], 'Update exploration')

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id))
            self.assertEqual(len(recent_updates), 1)
            self.assertDictContainsSubset({
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'activity_id': exp_id,
                'activity_title': exp_title,
                'author_id': another_user_id,
                'subject': 'Update exploration',
            }, recent_updates[0])

    def test_basic_computation_works_if_exploration_is_deleted(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            exp_title = 'Title'
            user_id = 'user_id'

            exploration = exp_domain.Exploration.create_default_exploration(
                exp_id, exp_title, 'Category')
            exp_services.save_new_exploration(user_id, exploration)
            exp_services.delete_exploration(user_id, exp_id)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id))
            self.assertEqual(len(recent_updates), 1)
            self.assertDictContainsSubset({
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'activity_id': exp_id,
                'activity_title': exp_title,
                'author_id': user_id,
                'subject': 'Exploration deleted.',
            }, recent_updates[0])
