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

import math

from core import jobs_registry
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_services
from core.domain import exp_domain
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.domain import stats_jobs_continuous
from core.domain import event_services
from core.domain import rating_services
from core.domain import stats_jobs_continuous_test
from core.platform import models
from core.tests import test_utils
import feconf
(user_models, stats_models) = models.Registry.import_models(
    [models.NAMES.user, models.NAMES.statistics])
taskqueue_services = models.Registry.import_taskqueue_services()
search_services = models.Registry.import_search_services()


class DashboardSubscriptionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""
    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    COLLECTION_ID_1 = 'col_id_1'
    COLLECTION_ID_2 = 'col_id_2'
    EXP_ID_FOR_COLLECTION_1 = 'id_of_exp_in_collection_1'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.DashboardSubscriptionsOneOffJob.create_new()
        user_jobs_one_off.DashboardSubscriptionsOneOffJob.enqueue(job_id)
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
                subscription_services, 'subscribe_to_exploration',
                self._null_fn):
            # User A creates and saves a new valid exploration.
            self.save_new_valid_exploration(
                self.EXP_ID_1, self.user_a_id, end_state_name='End')

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
                subscription_services, 'subscribe_to_exploration',
                self._null_fn):
            # User B starts a feedback thread.
            feedback_services.create_thread(
                self.EXP_ID_1, None, self.user_b_id, 'subject', 'text')
            # User C adds to that thread.
            thread_id = feedback_services.get_threadlist(
                self.EXP_ID_1)[0]['thread_id']
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
                subscription_services, 'subscribe_to_exploration',
                self._null_fn):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a_id, self.EXP_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # User A adds user C as a viewer of the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a_id, self.EXP_ID_1, self.user_c_id,
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
            user_a_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(user_a_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_b_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_explorations(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration',
                self._null_fn):
            # User A creates and saves another valid exploration.
            self.save_new_valid_exploration(self.EXP_ID_2, self.user_a_id)

        self._run_one_off_job()

        # User A is subscribed to two explorations.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.activity_ids),
            sorted([self.EXP_ID_1, self.EXP_ID_2]))

    def test_community_owned_exploration(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration',
                self._null_fn):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a_id, self.EXP_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # The exploration becomes community-owned.
            rights_manager.publish_exploration(self.user_a_id, self.EXP_ID_1)
            rights_manager.release_ownership_of_exploration(
                self.user_a_id, self.EXP_ID_1)
            # User C edits the exploration.
            exp_services.update_exploration(
                self.user_c_id, self.EXP_ID_1, [], 'Update exploration')

        self._run_one_off_job()

        # User A and user B are subscribed to the exploration; user C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_deleted_exploration(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration',
                self._null_fn):

            # User A deletes the exploration.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID_1)

        self._run_one_off_job()

        # User A is not subscribed to the exploration.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)

    def test_collection_subscription(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration',
                self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection',
                self._null_fn):
            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

            # User A adds user B as an editor to the collection.
            rights_manager.assign_role_for_collection(
                self.user_a_id, self.COLLECTION_ID_1, self.user_b_id,
                rights_manager.ROLE_EDITOR)
            # User A adds user C as a viewer of the collection.
            rights_manager.assign_role_for_collection(
                self.user_a_id, self.COLLECTION_ID_1, self.user_c_id,
                rights_manager.ROLE_VIEWER)

        self._run_one_off_job()

        # Users A and B are subscribed to the collection. User C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        # User A is also subscribed to the exploration within the collection
        # because they created both.
        self.assertEqual(
            sorted(user_a_subscriptions_model.activity_ids), [
                self.EXP_ID_1, self.EXP_ID_FOR_COLLECTION_1])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(user_a_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_b_subscriptions_model.feedback_thread_ids, [])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_collections(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration',
                self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection',
                self._null_fn):
            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

            # User A creates and saves another valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_2, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

        self._run_one_off_job()

        # User A is subscribed to two collections.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.collection_ids),
            sorted([self.COLLECTION_ID_1, self.COLLECTION_ID_2]))

    def test_deleted_collection(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration',
                self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection',
                self._null_fn):
            # User A creates and saves a new collection.
            self.save_new_default_collection(
                self.COLLECTION_ID_1, self.user_a_id)

            # User A deletes the collection.
            collection_services.delete_collection(
                self.user_a_id, self.COLLECTION_ID_1)

            # User A deletes the exploration from earlier.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID_1)

        self._run_one_off_job()

        # User A is not subscribed to the collection.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)

    def test_adding_exploration_to_collection(self):
        with self.swap(
                subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection',
                self._null_fn):
            # User B creates and saves a new collection.
            self.save_new_default_collection(
                self.COLLECTION_ID_1, self.user_b_id)

            # User B adds the exploration created by user A to the collection.
            collection_services.update_collection(
                self.user_b_id, self.COLLECTION_ID_1, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': self.EXP_ID_1
                }], 'Add new exploration to collection.')

        # Users A and B have no subscriptions (to either explorations or
        # collections).
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)
        self.assertEqual(user_b_subscriptions_model, None)

        self._run_one_off_job()

        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)

        # User B should be subscribed to the collection and user A to the
        # exploration.
        self.assertEqual(
            user_a_subscriptions_model.activity_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.activity_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])


class UserImpactScoreOneOffJobTest(test_utils.GenericTestBase):
    """ Tests the calculation of a user's impact score from the one-off
    UserImpactCalculationOneOffJob.
    """

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    # Constants imported from the oneoff job.
    impact_one_off_job = user_jobs_one_off.UserImpactCalculationOneOffJob
    NUM_RATINGS_SCALER_CUTOFF = impact_one_off_job.NUM_RATINGS_SCALER_CUTOFF
    NUM_RATINGS_SCALER = impact_one_off_job.NUM_RATINGS_SCALER
    MIN_AVERAGE_RATING = impact_one_off_job.MIN_AVERAGE_RATING
    MULTIPLIER = impact_one_off_job.MULTIPLIER
    # The impact score takes the ln of the number of completions as a factor,
    # so the minimum number of completions to get a nonzero impact score
    # is 2.
    MIN_NUM_COMPLETIONS = 2
    BELOW_MIN_RATING = int(math.ceil(MIN_AVERAGE_RATING - 1))
    ABOVE_MIN_RATING = int(math.floor(MIN_AVERAGE_RATING + 1))

    num_completions = {EXP_ID_1: 0, EXP_ID_2: 0}

    def _mock_get_statistics(self, exp_id, version):
        current_completions = {
            self.EXP_ID_1:
                {'complete_exploration_count':
                    self.num_completions[self.EXP_ID_1]},
            self.EXP_ID_2:
                {'complete_exploration_count':
                    self.num_completions[self.EXP_ID_2]},
        }
        return current_completions[exp_id]

    @classmethod
    def _mock_get_zero_impact_score(cls, exploration_id):
        return 0

    @classmethod
    def _mock_get_below_zero_impact_score(cls, exploration_id):
        return -1

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job after running the continuous
        statistics aggregator for explorations to get the correct num
        completion events."""
        with self.swap(stats_jobs_continuous.StatisticsAggregator,
                    'get_statistics', self._mock_get_statistics):
                job_id = self.impact_one_off_job.create_new()
                self.impact_one_off_job.enqueue(job_id)
                self.process_and_flush_pending_tasks()

    def _run_exp_impact_calculation_and_assert_equals(
            self, exploration_id, expected_impact):
        with self.swap(stats_jobs_continuous.StatisticsAggregator,
                    'get_statistics', self._mock_get_statistics):
            self.assertEqual(expected_impact,
                self.impact_one_off_job._get_exp_impact_score(
                exploration_id))

    def _sign_up_user(self, user_email, username):
        # Sign up a user, have them create an exploration.
        self.signup(user_email, username)
        return self.get_user_id_from_email(user_email)

    def _create_exploration(self, exp_id, user_id):
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, 'A title', 'A category')
        exp_services.save_new_exploration(user_id, exploration)
        return exploration

    def _rate_exploration(self, exp_id, num_ratings, rating):
        """Create num_ratings ratings for exploration with exp_id,
        of value rating.
        """
        # Each user id needs to be unique since each user can only give an
        # exploration one rating.
        user_ids = ['user{}'.format(i) for i in range(num_ratings)]
        for user_id in user_ids:
            rating_services.assign_rating_to_exploration(
                user_id, exp_id, rating
            )

    def _complete_exploration(self, exploration, num_completions):
        """Log a completion of exploration with id exp_id num_completions
        times."""
        exp_version = 1
        state = exploration.init_state_name
        session_ids = ['session{}'.format(i) for i in range(num_completions)]
        for session_id in session_ids:
            event_services.StartExplorationEventHandler.record(
                exploration.id, exp_version, state, session_id, {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.CompleteExplorationEventHandler.record(
                exploration.id, exp_version, state, session_id, 27, {},
                feconf.PLAY_TYPE_NORMAL)
        # Set the number of completions, so mock can function
        # correctly.
        self.num_completions[exploration.id] = num_completions

    def test_user_with_no_explorations_has_no_impact(self):
        """Test that a user who is not a contributor on any exploration
        is not assigned an impact score by the UserImpactCalculationOneOffJob.
        """
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertIsNone(user_stats_model)

    def test_standard_user_impact_calculation_one_exploration(self):
        """Test that a user who is a contributor on one exploration that:
        - has a number of ratings for that exploration above the treshold
        for the scaler for number of ratings
        - has an average rating above the minimum average rating
        - has a number of playthroughs > 1
        is assigned the correct impact score by the
        UserImpactCalculationOneOffJob.
        """
        # Sign up a user and have them create an exploration.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        # Give this exploration as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            self.exploration.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        # Give this exploration more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration, self.MIN_NUM_COMPLETIONS)

        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)

        # Verify that the impact score matches the expected.
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, expected_user_impact_score)

    def test_standard_user_impact_calculation_multiple_explorations(self):
        """Test that a user who is a contributor on two explorations that:
        - have a number of ratings for that exploration above the treshold
        for the scaler for number of ratings
        - have an average rating above the minimum average rating
        - have a number of playthroughs > 1
        is assigned the correct impact score by the
        UserImpactCalculationOneOffJob.
        """
        # Sign up a user and have them create two explorations.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration_1 = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self.exploration_2 = self._create_exploration(
            self.EXP_ID_2, self.user_a_id)
        # Give these explorations as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            self.exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        self._rate_exploration(
            self.exploration_2.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(self.exploration_2, self.MIN_NUM_COMPLETIONS)

        # The user impact score should be the rounded sum of these two impacts
        # (2 * the same impact).
        expected_user_impact_score = round(2 * 
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)

        # Verify that the impact score matches the expected.
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, expected_user_impact_score)

    def test_only_yield_when_impact_greater_than_zero(self):
        """Tests that map only yields an impact score for an
        exploration when the impact score is greater than 0."""
        # Sign up a user and have them create an exploration.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)

        # Use mock impact scores to verify that map only yields when
        # the impact score > 0.
        with self.swap(self.impact_one_off_job,
                '_get_exp_impact_score',
                self._mock_get_zero_impact_score):
            results = self.impact_one_off_job.map(self.exploration)
            with self.assertRaises(StopIteration):
                next(results)
        with self.swap(self.impact_one_off_job,
                '_get_exp_impact_score',
                self._mock_get_below_zero_impact_score):
            results = self.impact_one_off_job.map(self.exploration)
            with self.assertRaises(StopIteration):
                next(results)

    def test_impact_for_exp_with_one_completion(self):
        """Test that when an exploration has only one completion,
        the impact returned from the impact function is 0.
        """
        # Sign up a user and have them create an exploration.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        # Give this exploration as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            self.exploration.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        # Complete the exploration once.
        self._complete_exploration(self.exploration, 1)
        # Verify that the impact calculated is 0.
        self._run_exp_impact_calculation_and_assert_equals(
            self.exploration.id, 0)

    def test_impact_for_exp_with_no_ratings(self):
        """Test that when an exploration has no ratings, the impact returned
        from the impact function is 0.
        """
        # Sign up a user and have them create an exploration.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        # Give this exploration more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration, self.MIN_NUM_COMPLETIONS)
        # Verify that the impact calculated is 0.
        self._run_exp_impact_calculation_and_assert_equals(
            self.exploration.id, 0)

    def test_impact_for_exp_with_avg_rating_not_greater_than_min(self):
        """Test that an exploration has an average rating less than the
        minimum average rating, the impact returned from the impact function
        is 0.
        """
        # Sign up a user and have them create an exploration.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        # Give this exploration more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration, self.MIN_NUM_COMPLETIONS)

        # Rate this exploration once, with exactly the minimum average
        # rating.
        self._rate_exploration(self.exploration.id, 1, self.BELOW_MIN_RATING)
        # Verify that the impact calculated is 0.
        self._run_exp_impact_calculation_and_assert_equals(
            self.exploration.id, 0)

        # Rate this exploration again, dropping the average below the minimum.
        self._rate_exploration(self.exploration.id, 1, self.BELOW_MIN_RATING)
        # Verify that the impact calculated is still 0.
        self._run_exp_impact_calculation_and_assert_equals(
            self.exploration.id, 0)

    def test_impact_with_ratings_scaler(self):
        """Test that the ratings scaler is being properly applied in the
        impact calculation.
        """
        # Sign up a user and have them create an exploration.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        # Give this exploration more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration, self.MIN_NUM_COMPLETIONS)
        # Rate this exploration only twice, but give rating above minimum
        # average rating.
        self._rate_exploration(
            self.exploration.id, 2, self.ABOVE_MIN_RATING)

        expected_exp_impact_score = (
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            (self.NUM_RATINGS_SCALER * 2) *
            self.MULTIPLIER)
        self._run_exp_impact_calculation_and_assert_equals(
            self.exploration.id, expected_exp_impact_score)

    def test_scaler_multiplier_independence(self):
        """Test that when one exploration has less than 10 ratings,
        the other exploration's impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration_1 = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self.exploration_2 = self._create_exploration(
            self.EXP_ID_2, self.user_a_id)
        # Give one explorations as many ratings as necessary to avoid
        # the scaler for number of ratings. Give the other only 1.
        self._rate_exploration(
            self.exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        self._rate_exploration(
            self.exploration_2.id, 1, self.ABOVE_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(self.exploration_2, self.MIN_NUM_COMPLETIONS)

        # Calculate the expected impact for each exploration.
        exp_1_impact = (
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        exp_2_impact = (
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.NUM_RATINGS_SCALER *
            self.MULTIPLIER)
        # The user impact score should be the rounded sum of these two impacts.
        expected_user_impact_score = round(exp_1_impact + exp_2_impact)

        # Verify that the impact score matches the expected.
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, expected_user_impact_score)

    def test_no_ratings_independence(self):
        """Test that when one exploration has no ratings, the other exploration's
        impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration_1 = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self.exploration_2 = self._create_exploration(
            self.EXP_ID_2, self.user_a_id)
        # Give one exploration as many ratings as necessary to avoid
        # the scaler for number of ratings. Don't give the other any ratings.
        self._rate_exploration(
            self.exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(self.exploration_2, self.MIN_NUM_COMPLETIONS)
        # We expect the second exploration to yield 0 (since it has no
        # ratings), so the expected impact score is just the impact score for
        # exploration 1.
        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        # Verify that the impact score matches the expected.
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, expected_user_impact_score)

    def test_min_avg_rating_independence(self):
        """Test that when one exploration has less than the minimum average
        rating, the other exploration's impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration_1 = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self.exploration_2 = self._create_exploration(
            self.EXP_ID_2, self.user_a_id)
        # Give these explorations as many ratings as necessary to avoid
        # the scaler for number of ratings. Rate one above the minimum,
        # rate the other below.
        self._rate_exploration(
            self.exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        self._rate_exploration(
            self.exploration_2.id, self.NUM_RATINGS_SCALER_CUTOFF,
                self.BELOW_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions != 0).
        self._complete_exploration(self.exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(self.exploration_2, self.MIN_NUM_COMPLETIONS)
        # We expect the second exploration to yield 0 (since its average rating
        # is below the minimum), so the expected impact score is just the
        # impact score for exploration 1.
        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        # Verify that the impact score matches the expected.
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, expected_user_impact_score)

    def test_num_completions_independence(self):
        """Test that when one exploration has less than the minimum number
        of completions, the other exploration's impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        self.user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.exploration_1 = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self.exploration_2 = self._create_exploration(
            self.EXP_ID_2, self.user_a_id)
        # Give these explorations as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            self.exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        self._rate_exploration(
            self.exploration_2.id, self.NUM_RATINGS_SCALER_CUTOFF, self.ABOVE_MIN_RATING)
        # Give one exploration the minimum number of completions. Give the other
        # only one.
        self._complete_exploration(self.exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(self.exploration_2, 1)
        # We expect the second exploration to yield 0 (since its average rating
        # is below the minimum), so the expected impact score is just the
        # impact score for exploration 1.
        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        # Verify that the impact score matches the expected.
        self._run_one_off_job()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, expected_user_impact_score)


class UserFirstContributionMsecOneOffJobTests(test_utils.GenericTestBase):

    EXP_ID = 'test_exp'

    def setUp(self):
        super(UserFirstContributionMsecOneOffJobTests, self).setUp()

    def test_contribution_msec_updates_on_published_explorations(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.admin_id, end_state_name='End')
        self.init_state_name = exploration.init_state_name

        # Test that no contribution time is set.
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        self.assertIsNone(
            user_services.get_user_settings(self.admin_id).first_contribution_msec)

        # Test all owners and editors of exploration after publication have
        # updated times.
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin_id, self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            self.admin_id, self.EXP_ID)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [{
                'cmd': 'edit_state_property',
                'state_name': self.init_state_name,
                'property_name': 'widget_id',
                'new_value': 'MultipleChoiceInput'
            }], 'commit')
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        self.assertIsNotNone(user_services.get_user_settings(self.admin_id)
            .first_contribution_msec)
        self.assertIsNotNone(user_services.get_user_settings(self.editor_id)
            .first_contribution_msec)

    def test_contribution_msec_does_not_update_on_unpublished_explorations(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_EMAIL])

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        self.init_state_name = exploration.init_state_name
        exp_services.publish_exploration_and_update_user_profiles(
            self.owner_id, self.EXP_ID)
        # We now manually reset the user's first_contribution_msec to None.
        # This is to test that the one off job skips over the unpublished
        # exploration and does not reset the user's first_contribution_msec.
        user_services._update_first_contribution_msec(
            self.owner_id, None)
        rights_manager.unpublish_exploration(self.admin_id, self.EXP_ID)

        # Test that first contribution time is not set for unpublished
        # explorations.
        job_id = user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new()
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)

