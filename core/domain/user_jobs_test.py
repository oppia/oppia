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
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import user_jobs
from core.tests import test_utils
import feconf
import utils


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

    def _save_new_default_exploration(
            self, user_id, exp_id, exp_title, category):
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, exp_title, category)
        exp_services.save_new_exploration(user_id, exploration)

    def _get_expected_exploration_created_dict(
            self, user_id, exp_id, exp_title, last_updated_ms):
        return {
            'activity_id': exp_id,
            'activity_title': exp_title,
            'author_id': user_id,
            'last_updated_ms': last_updated_ms,
            'subject': (
                'New exploration created with title \'%s\'.' % exp_title),
            'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
        }

    def test_basic_computation(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            USER_ID = 'user_id'

            self._save_new_default_exploration(
                USER_ID, EXP_ID, EXP_TITLE, 'Category')
            expected_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            self.assertEqual(
                ModifiedRecentUpdatesAggregator.get_recent_updates(USER_ID),
                [self._get_expected_exploration_created_dict(
                    USER_ID, EXP_ID, EXP_TITLE, expected_last_updated_ms)])

    def test_basic_computation_with_an_update_after_creation(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            USER_ID = 'user_id'
            ANOTHER_USER_ID = 'another_user_id'

            self._save_new_default_exploration(
                USER_ID, EXP_ID, EXP_TITLE, 'Category')
            # Another user makes a commit; this, too, shows up in the
            # original user's dashboard.
            exp_services.update_exploration(
                ANOTHER_USER_ID, EXP_ID, [], 'Update exploration')
            expected_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(USER_ID))
            self.assertEqual([{
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'last_updated_ms': expected_last_updated_ms,
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': ANOTHER_USER_ID,
                'subject': 'Update exploration',
            }], recent_updates)

    def test_basic_computation_works_if_exploration_is_deleted(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            USER_ID = 'user_id'

            self._save_new_default_exploration(
                USER_ID, EXP_ID, EXP_TITLE, 'Category')
            last_updated_ms_before_deletion = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)
            exp_services.delete_exploration(USER_ID, EXP_ID)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(USER_ID))
            self.assertEqual(len(recent_updates), 1)
            self.assertEqual(sorted(recent_updates[0].keys()), [
                'activity_id', 'activity_title', 'author_id',
                'last_updated_ms', 'subject', 'type'])
            self.assertDictContainsSubset({
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': USER_ID,
                'subject': 'Exploration deleted.',
            }, recent_updates[0])
            self.assertLess(
                last_updated_ms_before_deletion,
                recent_updates[0]['last_updated_ms'])

    def test_multiple_commits_and_feedback_messages(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_1_ID = 'eid1'
            EXP_1_TITLE = 'Title1'
            EXP_2_ID = 'eid2'
            EXP_2_TITLE = 'Title2'
            FEEDBACK_THREAD_SUBJECT = 'feedback thread subject'
            USER_EMAIL = 'user@example.com'
            USER_USERNAME = 'username'
            self.register_editor(USER_EMAIL, username=USER_USERNAME)
            user_id = self.get_user_id_from_email(USER_EMAIL)

            # User creates an exploration.
            self._save_new_default_exploration(
                user_id, EXP_1_ID, EXP_1_TITLE, 'Category')
            exp1_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_1_ID).last_updated)

            # User gives feedback on it.
            feedback_services.create_thread(
                EXP_1_ID, None, user_id, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = (
                feedback_services.get_threadlist(EXP_1_ID)[0]['thread_id'])
            message = feedback_services.get_messages(thread_id)[0]

            # User creates another exploration.
            self._save_new_default_exploration(
                user_id, EXP_2_ID, EXP_2_TITLE, 'Category')
            exp2_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_2_ID).last_updated)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id))
            self.assertEqual([(
                self._get_expected_exploration_created_dict(
                    user_id, EXP_2_ID, EXP_2_TITLE, exp2_last_updated_ms)
            ), {
                'activity_id': EXP_1_ID,
                'activity_title': EXP_1_TITLE,
                'author_id': user_id,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }, (
                self._get_expected_exploration_created_dict(
                    user_id, EXP_1_ID, EXP_1_TITLE, exp1_last_updated_ms)
            )], recent_updates)

    def test_making_feedback_thread_does_not_subscribe_to_exp(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            FEEDBACK_THREAD_SUBJECT = 'feedback thread subject'
            USER_A_EMAIL = 'user_a@example.com'
            USER_A_USERNAME = 'a'
            self.register_editor(USER_A_EMAIL, username=USER_A_USERNAME)
            user_id_a = self.get_user_id_from_email(USER_A_EMAIL)

            USER_B_EMAIL = 'user_b@example.com'
            USER_B_USERNAME = 'b'
            self.register_editor(USER_B_EMAIL, username=USER_B_USERNAME)
            user_id_b = self.get_user_id_from_email(USER_B_EMAIL)

            # User A creates an exploration.
            self._save_new_default_exploration(
                user_id_a, EXP_ID, EXP_TITLE, 'Category')
            exp_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            # User B starts a feedback thread.
            feedback_services.create_thread(
                EXP_ID, None, user_id_b, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = (
                feedback_services.get_threadlist(EXP_ID)[0]['thread_id'])
            message = feedback_services.get_messages(thread_id)[0]

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates_for_user_a = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id_a))
            recent_updates_for_user_b = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id_b))
            expected_feedback_thread_update_dict = {
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': user_id_b,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_exploration_created_update_dict = (
                self._get_expected_exploration_created_dict(
                    user_id_a, EXP_ID, EXP_TITLE, exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(recent_updates_for_user_a, [
                expected_feedback_thread_update_dict,
                expected_exploration_created_update_dict
            ])
            # User B sees only her feedback thread, but no commits.
            self.assertEqual(recent_updates_for_user_b, [
                expected_feedback_thread_update_dict,
            ])

    def test_subscribing_to_exp_subscribes_to_its_feedback_threads(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            FEEDBACK_THREAD_SUBJECT = 'feedback thread subject'
            USER_A_EMAIL = 'user_a@example.com'
            USER_A_USERNAME = 'a'
            self.register_editor(USER_A_EMAIL, username=USER_A_USERNAME)
            user_id_a = self.get_user_id_from_email(USER_A_EMAIL)

            USER_B_EMAIL = 'user_b@example.com'
            USER_B_USERNAME = 'b'
            self.register_editor(USER_B_EMAIL, username=USER_B_USERNAME)
            user_id_b = self.get_user_id_from_email(USER_B_EMAIL)

            # User A creates an exploration.
            self._save_new_default_exploration(
                user_id_a, EXP_ID, EXP_TITLE, 'Category')
            exp_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            # User B starts a feedback thread.
            feedback_services.create_thread(
                EXP_ID, None, user_id_b, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = (
                feedback_services.get_threadlist(EXP_ID)[0]['thread_id'])
            message = feedback_services.get_messages(thread_id)[0]

            # User A adds user B as an editor of the exploration.
            rights_manager.assign_role(
                user_id_a, EXP_ID, user_id_b, rights_manager.ROLE_EDITOR)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            recent_updates_for_user_a = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id_a))
            recent_updates_for_user_b = (
                ModifiedRecentUpdatesAggregator.get_recent_updates(user_id_b))
            expected_feedback_thread_update_dict = {
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': user_id_b,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_exploration_created_update_dict = (
                self._get_expected_exploration_created_dict(
                    user_id_a, EXP_ID, EXP_TITLE, exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(recent_updates_for_user_a, [
                expected_feedback_thread_update_dict,
                expected_exploration_created_update_dict
            ])
            # User B sees A's commit and B's feedback thread.
            self.assertEqual(recent_updates_for_user_b, [
                expected_feedback_thread_update_dict,
                expected_exploration_created_update_dict,
            ])

