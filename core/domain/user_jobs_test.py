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
from core.domain import subscription_services
from core.domain import user_jobs
from core.platform import models
(user_models,) = models.Registry.import_models([models.NAMES.user])
taskqueue_services = models.Registry.import_taskqueue_services()
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
    """Tests for computations involving the 'recent notifications' section of
    the user dashboard.
    """

    ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS = [
        ModifiedRecentUpdatesAggregator]

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

            self.save_new_valid_exploration(
                EXP_ID, USER_ID, title=EXP_TITLE, category='Category')
            expected_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            self.assertEqual(
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    USER_ID)[1],
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

            self.save_new_valid_exploration(
                EXP_ID, USER_ID, title=EXP_TITLE, category='Category')
            # Another user makes a commit; this, too, shows up in the
            # original user's dashboard.
            exp_services.update_exploration(
                ANOTHER_USER_ID, EXP_ID, [], 'Update exploration')
            expected_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            recent_notifications = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    USER_ID)[1])
            self.assertEqual([{
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'last_updated_ms': expected_last_updated_ms,
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': ANOTHER_USER_ID,
                'subject': 'Update exploration',
            }], recent_notifications)

    def test_basic_computation_works_if_exploration_is_deleted(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            USER_ID = 'user_id'

            self.save_new_valid_exploration(
                EXP_ID, USER_ID, title=EXP_TITLE, category='Category')
            last_updated_ms_before_deletion = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)
            exp_services.delete_exploration(USER_ID, EXP_ID)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            recent_notifications = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    USER_ID)[1])
            self.assertEqual(len(recent_notifications), 1)
            self.assertEqual(sorted(recent_notifications[0].keys()), [
                'activity_id', 'activity_title', 'author_id',
                'last_updated_ms', 'subject', 'type'])
            self.assertDictContainsSubset({
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': USER_ID,
                'subject': feconf.COMMIT_MESSAGE_EXPLORATION_DELETED,
            }, recent_notifications[0])
            self.assertLess(
                last_updated_ms_before_deletion,
                recent_notifications[0]['last_updated_ms'])

    def test_multiple_commits_and_feedback_messages(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_1_ID = 'eid1'
            EXP_1_TITLE = 'Title1'
            EXP_2_ID = 'eid2'
            EXP_2_TITLE = 'Title2'
            FEEDBACK_THREAD_SUBJECT = 'feedback thread subject'

            self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
            self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

            # User creates an exploration.
            self.save_new_valid_exploration(
                EXP_1_ID, self.EDITOR_ID, title=EXP_1_TITLE,
                category='Category')
            exp1_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_1_ID).last_updated)

            # User gives feedback on it.
            feedback_services.create_thread(
                EXP_1_ID, None, self.EDITOR_ID, FEEDBACK_THREAD_SUBJECT,
                'text')
            thread_id = (
                feedback_services.get_threadlist(EXP_1_ID)[0]['thread_id'])
            message = feedback_services.get_messages(thread_id)[0]

            # User creates another exploration.
            self.save_new_valid_exploration(
                EXP_2_ID, self.EDITOR_ID, title=EXP_2_TITLE,
                category='Category')
            exp2_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_2_ID).last_updated)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            recent_notifications = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    self.EDITOR_ID)[1])
            self.assertEqual([(
                self._get_expected_exploration_created_dict(
                    self.EDITOR_ID, EXP_2_ID, EXP_2_TITLE,
                    exp2_last_updated_ms)
            ), {
                'activity_id': EXP_1_ID,
                'activity_title': EXP_1_TITLE,
                'author_id': self.EDITOR_ID,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }, (
                self._get_expected_exploration_created_dict(
                    self.EDITOR_ID, EXP_1_ID, EXP_1_TITLE,
                    exp1_last_updated_ms)
            )], recent_notifications)

    def test_making_feedback_thread_does_not_subscribe_to_exp(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            EXP_ID = 'eid'
            EXP_TITLE = 'Title'
            FEEDBACK_THREAD_SUBJECT = 'feedback thread subject'

            USER_A_EMAIL = 'user_a@example.com'
            USER_A_USERNAME = 'a'
            self.signup(USER_A_EMAIL, USER_A_USERNAME)
            user_a_id = self.get_user_id_from_email(USER_A_EMAIL)

            USER_B_EMAIL = 'user_b@example.com'
            USER_B_USERNAME = 'b'
            self.signup(USER_B_EMAIL, USER_B_USERNAME)
            user_b_id = self.get_user_id_from_email(USER_B_EMAIL)

            # User A creates an exploration.
            self.save_new_valid_exploration(
                EXP_ID, user_a_id, title=EXP_TITLE, category='Category')
            exp_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            # User B starts a feedback thread.
            feedback_services.create_thread(
                EXP_ID, None, user_b_id, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = (
                feedback_services.get_threadlist(EXP_ID)[0]['thread_id'])
            message = feedback_services.get_messages(thread_id)[0]

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            recent_notifications_for_user_a = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    user_a_id)[1])
            recent_notifications_for_user_b = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    user_b_id)[1])
            expected_feedback_thread_notification_dict = {
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': user_b_id,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_exploration_created_notification_dict = (
                self._get_expected_exploration_created_dict(
                    user_a_id, EXP_ID, EXP_TITLE, exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(recent_notifications_for_user_a, [
                expected_feedback_thread_notification_dict,
                expected_exploration_created_notification_dict
            ])
            # User B sees only her feedback thread, but no commits.
            self.assertEqual(recent_notifications_for_user_b, [
                expected_feedback_thread_notification_dict,
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
            self.signup(USER_A_EMAIL, USER_A_USERNAME)
            user_a_id = self.get_user_id_from_email(USER_A_EMAIL)

            USER_B_EMAIL = 'user_b@example.com'
            USER_B_USERNAME = 'b'
            self.signup(USER_B_EMAIL, USER_B_USERNAME)
            user_b_id = self.get_user_id_from_email(USER_B_EMAIL)

            # User A creates an exploration.
            self.save_new_valid_exploration(
                EXP_ID, user_a_id, title=EXP_TITLE, category='Category')
            exp_last_updated_ms = utils.get_time_in_millisecs(
                exp_services.get_exploration_by_id(EXP_ID).last_updated)

            # User B starts a feedback thread.
            feedback_services.create_thread(
                EXP_ID, None, user_b_id, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = (
                feedback_services.get_threadlist(EXP_ID)[0]['thread_id'])
            message = feedback_services.get_messages(thread_id)[0]

            # User A adds user B as an editor of the exploration.
            rights_manager.assign_role(
                user_a_id, EXP_ID, user_b_id, rights_manager.ROLE_EDITOR)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            recent_notifications_for_user_a = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    user_a_id)[1])
            recent_notifications_for_user_b = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    user_b_id)[1])
            expected_feedback_thread_notification_dict = {
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': user_b_id,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_exploration_created_notification_dict = (
                self._get_expected_exploration_created_dict(
                    user_a_id, EXP_ID, EXP_TITLE, exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(recent_notifications_for_user_a, [
                expected_feedback_thread_notification_dict,
                expected_exploration_created_notification_dict
            ])
            # User B sees A's commit and B's feedback thread.
            self.assertEqual(recent_notifications_for_user_b, [
                expected_feedback_thread_notification_dict,
                expected_exploration_created_notification_dict,
            ])


class DashboardSubscriptionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""
    EXP_ID = 'exp_id'
    EXP_ID_2 = 'exp_id_2'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs.DashboardSubscriptionsOneOffJob.create_new()
        user_jobs.DashboardSubscriptionsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()

    def _null_fn(self, *args, **kwargs):
        """A mock for functions of the form subscribe_to_*() to represent
        behavior prior to the implementation of subscriptions.
        """
        pass

    def setUp(self):
        super(DashboardSubscriptionsOneOffJobTests, self).setUp()

        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_activity', self._null_fn):
            # User A creates and saves a new valid exploration.
            self.save_new_valid_exploration(
                self.EXP_ID, self.user_a_id, end_state_name='End')

    def test_null_case(self):
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_b_subscriptions_model, None)

        self._run_one_off_job()

        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_b_subscriptions_model, None)

    def test_feedback_thread_subscription(self):
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(user_b_subscriptions_model, None)
        self.assertEqual(user_c_subscriptions_model, None)

        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_activity', self._null_fn):
            # User B starts a feedback thread.
            feedback_services.create_thread(
                self.EXP_ID, None, self.user_b_id, 'subject', 'text')
            # User C adds to that thread.
            thread_id = (
                feedback_services.get_threadlist(self.EXP_ID)[0]['thread_id'])
            feedback_services.create_message(
                thread_id, self.user_c_id, None, None, 'more text')

        self._run_one_off_job()

        # Both users are subscribed to the feedback thread.
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id)

        self.assertEqual(user_b_subscriptions_model.activity_ids, [])
        self.assertEqual(user_c_subscriptions_model.activity_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.feedback_thread_ids, [thread_id])
        self.assertEqual(
            user_c_subscriptions_model.feedback_thread_ids, [thread_id])

    def test_exploration_subscription(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_activity', self._null_fn):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role(
                self.user_a_id, self.EXP_ID, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # User A adds user C as a viewer of the exploration.
            rights_manager.assign_role(
                self.user_a_id, self.EXP_ID, self.user_c_id,
                rights_manager.ROLE_VIEWER)

        self._run_one_off_job()

        # Users A and B are subscribed to the exploration. User C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [self.EXP_ID])
        self.assertEqual(user_a_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_b_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_explorations(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_activity', self._null_fn):
            # User A creates and saves another valid exploration.
            self.save_new_valid_exploration(self.EXP_ID_2, self.user_a_id)

        self._run_one_off_job()

        # User A is subscribed to two explorations.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.activity_ids),
            sorted([self.EXP_ID, self.EXP_ID_2]))

    def test_community_owned_exploration(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_activity', self._null_fn):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role(
                self.user_a_id, self.EXP_ID, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # The exploration becomes community-owned.
            rights_manager.publish_exploration(self.user_a_id, self.EXP_ID)
            rights_manager.release_ownership(self.user_a_id, self.EXP_ID)
            # User C edits the exploration.
            exp_services.update_exploration(
                self.user_c_id, self.EXP_ID, [], 'Update exploration')

        self._run_one_off_job()

        # User A and user B are subscribed to the exploration; user C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [self.EXP_ID])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_deleted_exploration(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_activity', self._null_fn):

            # User A deletes the exploration.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID)

        self._run_one_off_job()

        # User A is not subscribed to the exploration.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)
