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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections

from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_jobs_continuous
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(exp_models, stats_models, user_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics, models.NAMES.user])

COLLECTION_ID = 'cid'
COLLECTION_TITLE = 'Title'

EXP_ID = 'eid'
EXP_TITLE = 'Title'
EXP_1_ID = 'eid1'
EXP_1_TITLE = 'Title1'
EXP_2_ID = 'eid2'
EXP_2_TITLE = 'Title2'

FEEDBACK_THREAD_SUBJECT = 'feedback thread subject'

USER_ID = 'user_id'
ANOTHER_USER_ID = 'another_user_id'
USER_A_EMAIL = 'user_a@example.com'
USER_A_USERNAME = 'a'
USER_B_EMAIL = 'user_b@example.com'
USER_B_USERNAME = 'b'


class MockUserStatsAggregator(
        user_jobs_continuous.UserStatsAggregator):
    """A modified UserStatsAggregator that does not start a new
     batch job when the previous one has finished.
    """

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class UserStatsAggregatorTest(test_utils.GenericTestBase):
    """Tests the calculation of a user's statistics -
    impact score, average ratings, total plays
    from the continuous computation of UserStatsAggregator.
    """

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    EXP_ID_3 = 'exp_id_3'
    EXP_DEFAULT_VERSION = 1

    USER_SESSION_ID = 'session1'
    USER_A_EMAIL = 'a@example.com'
    USER_B_EMAIL = 'b@example.com'
    USER_A_USERNAME = 'a'
    USER_B_USERNAME = 'b'

    MIN_NUM_COMPLETIONS = 2
    EXPONENT = python_utils.divide(2.0, 3)

    def setUp(self):
        super(UserStatsAggregatorTest, self).setUp()
        self.num_completions = collections.defaultdict(int)
        self.num_starts = collections.defaultdict(int)
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)

        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)

        self.user_a = user_services.get_user_actions_info(self.user_a_id)

    def mock_get_statistics(self, exp_id, unused_version):
        current_completions = {
            self.EXP_ID_1: stats_domain.ExplorationStats(
                self.EXP_ID_1, self.EXP_DEFAULT_VERSION, 5, 2, 0, 0, 0, 0, {
                    'state1': stats_domain.StateStats(
                        0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0),
                    'state2': stats_domain.StateStats(
                        0, 0, 0, 0, 0, 0, 7, 1, 0, 0, 0),
                }
            ),
            self.EXP_ID_2: stats_domain.ExplorationStats(
                self.EXP_ID_2, self.EXP_DEFAULT_VERSION, 5, 2, 0, 0, 0, 0, {
                    'state1': stats_domain.StateStats(
                        0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0),
                    'state2': stats_domain.StateStats(
                        0, 0, 0, 0, 0, 0, 7, 1, 0, 0, 0),
                }
            ),
            self.EXP_ID_3: stats_domain.ExplorationStats(
                self.EXP_ID_3, self.EXP_DEFAULT_VERSION, 0, 0, 0, 0, 0, 0, {})
        }
        return current_completions[exp_id]

    def _run_computation(self):
        """Runs the MapReduce job after running the continuous
        statistics aggregator for explorations to get the correct num
        completion events.
        """
        user_stats_aggregator_swap = self.swap(
            user_jobs_continuous, 'UserStatsAggregator',
            MockUserStatsAggregator)
        get_statistics_swap = self.swap(
            stats_services, 'get_exploration_stats', self.mock_get_statistics)
        with get_statistics_swap, user_stats_aggregator_swap:
            MockUserStatsAggregator.start_computation()
            self.process_and_flush_pending_tasks()
            self.process_and_flush_pending_mapreduce_tasks()

    def _generate_user_ids(self, count):
        """Generate unique user ids to rate an exploration. Each user id needs
        to be unique since each user can only give an exploration one rating.
        """
        return ['user%d' % i for i in python_utils.RANGE(count)]

    def _create_exploration(self, exp_id, user_id):
        """Creates the default exploration with the given exploration id and
        then, returns its instance.
        """
        exploration = exp_domain.Exploration.create_default_exploration(exp_id)
        exp_services.save_new_exploration(user_id, exploration)
        return exploration

    def _record_start(self, exp_id, exp_version, state):
        """Record start event to an exploration.
        Completing the exploration is not necessary here since the total_plays
        are currently being counted taking into account only the # of starts.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)

    def _rate_exploration(self, exp_id, num_ratings, rating):
        """Create num_ratings ratings for exploration with exp_id,
        of value rating.
        """
        # Each user id needs to be unique since each user can only give an
        # exploration one rating.
        user_ids = self._generate_user_ids(num_ratings)
        for user_id in user_ids:
            rating_services.assign_rating_to_exploration(
                user_id, exp_id, rating)

    def _record_exploration_rating(self, exp_id, ratings):
        """Records the exploration rating corresponding to the given exploration
        id.
        """
        user_ids = self._generate_user_ids(len(ratings))
        self.process_and_flush_pending_tasks()
        for ind, user_id in enumerate(user_ids):
            event_services.RateExplorationEventHandler.record(
                exp_id, user_id, ratings[ind], None)
        self.process_and_flush_pending_tasks()

    def _record_exploration_rating_for_user(
            self, exp_id, user_id, rating, old_rating=None):
        """Records the exploration rating provided by the user corresponding to
        the given user id.
        """
        self.process_and_flush_pending_tasks()
        event_services.RateExplorationEventHandler.record(
            exp_id, user_id, rating, old_rating)
        self.process_and_flush_pending_tasks()

    def test_stats_for_user_with_no_explorations(self):
        """Test that a user who is not a contributor on any exploration
        is not assigned value of impact score, total plays and average ratings.
        """
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertIsNone(user_stats_model)

    def test_standard_user_stats_calculation_one_exploration(self):
        exploration = self._create_exploration(self.EXP_ID_1, self.user_a_id)
        # Give this exploration an average rating of 4.
        avg_rating = 4
        self._rate_exploration(exploration.id, 5, avg_rating)

        # The expected answer count is the sum of the first hit counts in the
        # statistics defined in _get_mock_statistics() method above.
        expected_answer_count = 15
        reach = expected_answer_count ** self.EXPONENT
        expected_user_impact_score = python_utils.ROUND(
            ((avg_rating - 2) * reach) ** self.EXPONENT)

        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_exploration_multiple_contributors(self):
        exploration = self._create_exploration(self.EXP_ID_1, self.user_a_id)
        # Give this exploration an average rating of 4.
        avg_rating = 4
        self._rate_exploration(exploration.id, 5, avg_rating)
        exp_services.update_exploration(self.user_b_id, self.EXP_ID_1, [], '')

        # The expected answer count is the sum of the first hit counts in the
        # statistics defined in _get_mock_statistics() method above.
        expected_answer_count = 15
        reach = expected_answer_count ** self.EXPONENT
        contrib = 0.5
        expected_user_impact_score = python_utils.ROUND(
            ((avg_rating - 2) * reach * contrib) ** self.EXPONENT)

        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)
        user_stats_model = user_models.UserStatsModel.get(self.user_b_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_standard_user_stats_calculation_multiple_explorations(self):
        exploration_1 = self._create_exploration(self.EXP_ID_1, self.user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, self.user_a_id)
        avg_rating = 4
        self._rate_exploration(exploration_1.id, 2, avg_rating)
        self._rate_exploration(exploration_2.id, 2, avg_rating)

        # The expected answer count is the sum of the first hit counts in the
        # statistics defined in _get_mock_statistics() method above.
        expected_answer_count = 15
        reach = expected_answer_count ** self.EXPONENT
        impact_per_exp = ((avg_rating - 2) * reach) # * 1 for contribution
        expected_user_impact_score = python_utils.ROUND(
            (impact_per_exp * 2) ** self.EXPONENT)

        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_only_yield_when_rating_greater_than_two(self):
        """Tests that map only yields an impact score for an
        exploration when the impact score is greater than 0.
        """
        user_stats_aggregator_swap = self.swap(
            user_jobs_continuous, 'UserStatsAggregator',
            MockUserStatsAggregator)
        self._create_exploration(self.EXP_ID_1, self.user_a_id)

        # Give two ratings of 1.
        self._rate_exploration(self.EXP_ID_1, 2, 1)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_stats_model.impact_score, 0)
        with user_stats_aggregator_swap:
            MockUserStatsAggregator.stop_computation(self.user_a_id)

        user_stats_aggregator_swap = self.swap(
            user_jobs_continuous, 'UserStatsAggregator',
            MockUserStatsAggregator)
        # Give two ratings of 2.
        self._rate_exploration(self.EXP_ID_1, 2, 2)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_stats_model.impact_score, 0)
        with user_stats_aggregator_swap:
            MockUserStatsAggregator.stop_computation(self.user_a_id)

        # Give two ratings of 3. The impact score should now be nonzero.
        self._rate_exploration(self.EXP_ID_1, 2, 3)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertIsNotNone(user_stats_model)
        self.assertGreater(user_stats_model.impact_score, 0)

    def test_impact_for_exp_with_no_answers(self):
        """Test that when an exploration has no answers, it is considered to
        have no reach.
        """
        exploration = self._create_exploration(self.EXP_ID_3, self.user_a_id)
        self._rate_exploration(exploration.id, 5, 3)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, 0)

    def test_impact_for_exp_with_no_contributors_summary(self):
        self._create_exploration(self.EXP_ID_3, self.user_a_id)
        model1 = exp_models.ExpSummaryModel.get(self.EXP_ID_3)
        model1.contributors_summary = {}
        model1.update_timestamps()
        model1.put()

        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        self.assertEqual(user_stats_model.impact_score, 0)

    def test_impact_for_exp_with_no_ratings(self):
        """Test that when an exploration has no ratings, the impact returned
        from the impact function is 0.
        """
        self._create_exploration(self.EXP_ID_1, self.user_a_id)
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_stats_model, None)

    def test_realtime_layer_batch_job_no_ratings_plays(self):
        self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(
            user_stats['total_plays'], 0)
        self.assertEqual(
            user_stats['num_ratings'], 0)
        self.assertEqual(
            user_stats['average_ratings'], None)

    def test_realtime_layer_batch_job_single_rating(self):
        self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self._record_exploration_rating(self.EXP_ID_1, [4])

        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(user_stats['total_plays'], 0)
        self.assertEqual(user_stats['num_ratings'], 1)
        self.assertEqual(user_stats['average_ratings'], 4)

    def test_realtime_layer_batch_job_single_exploration_one_owner(self):
        exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)

        exp_id = self.EXP_ID_1
        exp_version = self.EXP_DEFAULT_VERSION
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._record_exploration_rating(exp_id, [2, 5])

        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(user_stats['total_plays'], 2)
        self.assertEqual(user_stats['num_ratings'], 2)
        self.assertEqual(user_stats['average_ratings'], 3.5)

    def test_realtime_layer_batch_job_single_exploration_multiple_owners(self):
        exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID_1, self.user_b_id,
            rights_domain.ROLE_OWNER)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._record_exploration_rating(exp_id, [3, 4, 5])
        self._record_exploration_rating(exp_id, [1, 5, 4])

        expected_results = {
            'total_plays': 2,
            'num_ratings': 6,
            'average_ratings': python_utils.divide(22, 6.0)
        }

        user_stats_1 = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(
            user_stats_1['total_plays'], expected_results['total_plays'])
        self.assertEqual(
            user_stats_1['num_ratings'], expected_results['num_ratings'])
        self.assertEqual(
            user_stats_1['average_ratings'],
            expected_results['average_ratings'])

        user_stats_2 = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_b_id))
        self.assertEqual(
            user_stats_2['total_plays'], expected_results['total_plays'])
        self.assertEqual(
            user_stats_2['num_ratings'], expected_results['num_ratings'])
        self.assertEqual(
            user_stats_2['average_ratings'],
            expected_results['average_ratings'])

    def test_realtime_layer_batch_job_multiple_explorations_one_owner(self):
        self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self._create_exploration(
            self.EXP_ID_2, self.user_a_id)

        self._record_exploration_rating(self.EXP_ID_1, [4, 5, 2])
        self._record_exploration_rating(self.EXP_ID_2, [5, 2])

        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(user_stats['total_plays'], 0)
        self.assertEqual(user_stats['num_ratings'], 5)
        self.assertEqual(
            user_stats['average_ratings'], python_utils.divide(18, 5.0))

    def test_realtime_layer_batch_job_user_rate_same_exp_multiple_times(self):
        self._create_exploration(
            self.EXP_ID_1, self.user_a_id)

        exp_id_1 = self.EXP_ID_1

        self._record_exploration_rating_for_user(exp_id_1, self.user_b_id, 5)
        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(user_stats['total_plays'], 0)
        self.assertEqual(user_stats['num_ratings'], 1)
        self.assertEqual(user_stats['average_ratings'], 5)

        self._record_exploration_rating_for_user(
            exp_id_1, self.user_b_id, 3, old_rating=5)
        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEqual(user_stats['total_plays'], 0)
        self.assertEqual(user_stats['num_ratings'], 1)
        self.assertEqual(user_stats['average_ratings'], 3)

    def test_both_realtime_layer_and_batch_data(self):
        user_stats_aggregator_swap = self.swap(
            user_jobs_continuous, 'UserStatsAggregator',
            MockUserStatsAggregator)
        exploration_1 = self._create_exploration(self.EXP_ID_1, self.user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, self.user_a_id)

        exp_id_1 = self.EXP_ID_1
        exp_id_2 = self.EXP_ID_2
        exp_version = self.EXP_DEFAULT_VERSION
        state_1 = exploration_1.init_state_name
        state_2 = exploration_2.init_state_name

        self._rate_exploration(exp_id_1, 2, 4)
        self._rate_exploration(exp_id_2, 4, 3)

        # Run the computation and check data from batch job.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(self.user_a_id)
        # The total plays is the sum of the number of starts of both the
        # exploration_1 and exploration_2 as defined in the
        # mock_get_statistics() method above.
        self.assertEqual(user_stats_model.total_plays, 14)
        self.assertEqual(user_stats_model.num_ratings, 6)
        self.assertEqual(
            user_stats_model.average_ratings, python_utils.divide(20, 6.0))

        # Stop the batch job. Fire up a few events and check data from realtime
        # job.
        with user_stats_aggregator_swap:
            MockUserStatsAggregator.stop_computation(self.user_a_id)

        self._record_start(exp_id_1, exp_version, state_1)
        self._record_start(exp_id_2, exp_version, state_2)
        self._record_exploration_rating(exp_id_1, [2, 5])
        self._record_exploration_rating(exp_id_2, [4, 1])

        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        # After recording two start events, the total plays is now increased by
        # two.
        self.assertEqual(user_stats['total_plays'], 16)
        self.assertEqual(user_stats['num_ratings'], 10)
        self.assertEqual(
            user_stats['average_ratings'], python_utils.divide(32, 10.0))

    def test_job_with_deleted_exploration_summary_creates_no_user_stats_model(
            self):
        self._create_exploration(self.EXP_ID_3, self.user_a_id)
        model1 = exp_models.ExpSummaryModel.get(self.EXP_ID_3)
        model1.deleted = True
        model1.update_timestamps()
        model1.put()

        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertIsNone(user_stats_model)
