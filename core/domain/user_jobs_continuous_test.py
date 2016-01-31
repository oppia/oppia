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

import math
from collections import defaultdict

from core import jobs_registry
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import stats_jobs_continuous
from core.domain import user_jobs_continuous
from core.platform import models
from core.tests import test_utils
import feconf

(exp_models, user_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])
taskqueue_services = models.Registry.import_taskqueue_services()

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


class ModifiedRecentUpdatesAggregator(
        user_jobs_continuous.DashboardRecentUpdatesAggregator):
    """A modified DashboardRecentUpdatesAggregator that does not start a new
     batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedRecentUpdatesMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedRecentUpdatesMRJobManager(
        user_jobs_continuous.RecentUpdatesMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedRecentUpdatesAggregator


class RecentUpdatesAggregatorUnitTests(test_utils.GenericTestBase):
    """Tests for computations involving the 'recent notifications' section of
    the user dashboard.
    """

    ALL_CC_MANAGERS_FOR_TESTS = [
        ModifiedRecentUpdatesAggregator]

    def _get_expected_activity_created_dict(
            self, user_id, activity_id, activity_title, activity_type,
            commit_type, last_updated_ms):
        return {
            'activity_id': activity_id,
            'activity_title': activity_title,
            'author_id': user_id,
            'last_updated_ms': last_updated_ms,
            'subject': (
                'New %s created with title \'%s\'.' % (
                    activity_type, activity_title)),
            'type': commit_type,
        }

    def _get_most_recent_exp_snapshot_created_on_ms(self, exp_id):
        most_recent_snapshot = exp_services.get_exploration_snapshots_metadata(
            exp_id)[-1]
        return most_recent_snapshot['created_on_ms']

    def _get_most_recent_collection_snapshot_created_on_ms(
            self, collection_id):
        most_recent_snapshot = (
            collection_services.get_collection_snapshots_metadata(
                collection_id)[-1])
        return most_recent_snapshot['created_on_ms']

    def _get_test_context(self):
        return self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS)

    def test_basic_computation_for_explorations(self):
        with self._get_test_context():
            self.save_new_valid_exploration(
                EXP_ID, USER_ID, title=EXP_TITLE, category='Category')
            expected_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

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
            self.assertEqual(
                recent_notifications[0],
                self._get_expected_activity_created_dict(
                    USER_ID, EXP_ID, EXP_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    expected_last_updated_ms))

    def test_basic_computation_ignores_automated_exploration_commits(self):
        with self._get_test_context():
            self.save_new_exp_with_states_schema_v0(EXP_ID, USER_ID, EXP_TITLE)

            # Confirm that the exploration is at version 1.
            exploration = exp_services.get_exploration_by_id(EXP_ID)
            self.assertEqual(exploration.version, 1)

            v1_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

            # Start migration job on all explorations, including this one.
            job_id = (
                exp_jobs_one_off.ExplorationMigrationJobManager.create_new())
            exp_jobs_one_off.ExplorationMigrationJobManager.enqueue(job_id)
            self.process_and_flush_pending_tasks()

            # Confirm that the exploration is at version 2.
            exploration = exp_services.get_exploration_by_id(EXP_ID)
            self.assertEqual(exploration.version, 2)

            v2_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

            # Run the aggregator.
            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()
            ModifiedRecentUpdatesAggregator.stop_computation(USER_ID)

            recent_notifications = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    USER_ID)[1])
            self.assertEqual(len(recent_notifications), 1)
            self.assertEqual(
                recent_notifications[0],
                self._get_expected_activity_created_dict(
                    USER_ID, EXP_ID, EXP_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT, v1_last_updated_ms))
            self.assertLess(
                recent_notifications[0]['last_updated_ms'], v2_last_updated_ms)

            # Another user makes a commit; this one should now show up in the
            # original user's dashboard.
            exp_services.update_exploration(
                ANOTHER_USER_ID, EXP_ID, [], 'Update exploration')
            v3_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

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
                'last_updated_ms': v3_last_updated_ms,
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': ANOTHER_USER_ID,
                'subject': 'Update exploration',
            }], recent_notifications)

    def test_basic_computation_with_an_update_after_exploration_is_created(self):
        with self._get_test_context():
            self.save_new_valid_exploration(
                EXP_ID, USER_ID, title=EXP_TITLE, category='Category')
            # Another user makes a commit; this, too, shows up in the
            # original user's dashboard.
            exp_services.update_exploration(
                ANOTHER_USER_ID, EXP_ID, [], 'Update exploration')
            expected_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

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
        with self._get_test_context():
            self.save_new_valid_exploration(
                EXP_ID, USER_ID, title=EXP_TITLE, category='Category')
            last_updated_ms_before_deletion = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))
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

    def test_multiple_exploration_commits_and_feedback_messages(self):
        with self._get_test_context():
            self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
            editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

            # User creates an exploration.
            self.save_new_valid_exploration(
                EXP_1_ID, editor_id, title=EXP_1_TITLE,
                category='Category')

            exp1_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_1_ID))

            # User gives feedback on it.
            feedback_services.create_thread(
                EXP_1_ID, None, editor_id, FEEDBACK_THREAD_SUBJECT,
                'text')
            thread_id = feedback_services.get_all_threads(
                EXP_1_ID, False)[0]['thread_id']
            message = feedback_services.get_messages(EXP_1_ID, thread_id)[0]

            # User creates another exploration.
            self.save_new_valid_exploration(
                EXP_2_ID, editor_id, title=EXP_2_TITLE,
                category='Category')
            exp2_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_2_ID))

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
                1)
            self.process_and_flush_pending_tasks()

            recent_notifications = (
                ModifiedRecentUpdatesAggregator.get_recent_notifications(
                    editor_id)[1])
            self.assertEqual([(
                self._get_expected_activity_created_dict(
                    editor_id, EXP_2_ID, EXP_2_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    exp2_last_updated_ms)
            ), {
                'activity_id': EXP_1_ID,
                'activity_title': EXP_1_TITLE,
                'author_id': editor_id,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }, (
                self._get_expected_activity_created_dict(
                    editor_id, EXP_1_ID, EXP_1_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    exp1_last_updated_ms)
            )], recent_notifications)

    def test_making_feedback_thread_does_not_subscribe_to_exploration(self):
        with self._get_test_context():
            self.signup(USER_A_EMAIL, USER_A_USERNAME)
            user_a_id = self.get_user_id_from_email(USER_A_EMAIL)
            self.signup(USER_B_EMAIL, USER_B_USERNAME)
            user_b_id = self.get_user_id_from_email(USER_B_EMAIL)

            # User A creates an exploration.
            self.save_new_valid_exploration(
                EXP_ID, user_a_id, title=EXP_TITLE, category='Category')
            exp_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

            # User B starts a feedback thread.
            feedback_services.create_thread(
                EXP_ID, None, user_b_id, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = feedback_services.get_all_threads(
                EXP_ID, False)[0]['thread_id']

            message = feedback_services.get_messages(
                EXP_ID, thread_id)[0]

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
            expected_thread_notification = {
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': user_b_id,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_creation_notification = (
                self._get_expected_activity_created_dict(
                    user_a_id, EXP_ID, EXP_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(recent_notifications_for_user_a, [
                expected_thread_notification,
                expected_creation_notification
            ])
            # User B sees only her feedback thread, but no commits.
            self.assertEqual(recent_notifications_for_user_b, [
                expected_thread_notification,
            ])

    def test_subscribing_to_exploration_subscribes_to_its_feedback_threads(self):
        with self._get_test_context():
            self.signup(USER_A_EMAIL, USER_A_USERNAME)
            user_a_id = self.get_user_id_from_email(USER_A_EMAIL)
            self.signup(USER_B_EMAIL, USER_B_USERNAME)
            user_b_id = self.get_user_id_from_email(USER_B_EMAIL)

            # User A creates an exploration.
            self.save_new_valid_exploration(
                EXP_ID, user_a_id, title=EXP_TITLE, category='Category')
            exp_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

            # User B starts a feedback thread.
            feedback_services.create_thread(
                EXP_ID, None, user_b_id, FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = feedback_services.get_all_threads(
                EXP_ID, False)[0]['thread_id']
            message = feedback_services.get_messages(
                EXP_ID, thread_id)[0]

            # User A adds user B as an editor of the exploration.
            rights_manager.assign_role_for_exploration(
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
            expected_thread_notification = {
                'activity_id': EXP_ID,
                'activity_title': EXP_TITLE,
                'author_id': user_b_id,
                'last_updated_ms': message['created_on'],
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_creation_notification = (
                self._get_expected_activity_created_dict(
                    user_a_id, EXP_ID, EXP_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(recent_notifications_for_user_a, [
                expected_thread_notification,
                expected_creation_notification
            ])
            # User B sees A's commit and B's feedback thread.
            self.assertEqual(recent_notifications_for_user_b, [
                expected_thread_notification,
                expected_creation_notification,
            ])

    def test_basic_computation_for_collections(self):
        with self._get_test_context():
            self.save_new_default_collection(
                COLLECTION_ID, USER_ID, title=COLLECTION_TITLE)
            expected_last_updated_ms = (
                self._get_most_recent_collection_snapshot_created_on_ms(
                    COLLECTION_ID))

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
            self.assertEqual(
                recent_notifications[0],
                self._get_expected_activity_created_dict(
                    USER_ID, COLLECTION_ID, COLLECTION_TITLE, 'collection',
                    feconf.UPDATE_TYPE_COLLECTION_COMMIT,
                    expected_last_updated_ms))

    def test_basic_computation_with_an_update_after_collection_is_created(self):
        with self._get_test_context():
            self.save_new_default_collection(
                COLLECTION_ID, USER_ID, title=COLLECTION_TITLE)
            # Another user makes a commit; this, too, shows up in the
            # original user's dashboard.
            collection_services.update_collection(
                ANOTHER_USER_ID, COLLECTION_ID, [{
                    'cmd': 'edit_collection_property',
                    'property_name': 'title',
                    'new_value': 'A new title'
                }], 'Update collection')
            expected_last_updated_ms = (
                self._get_most_recent_collection_snapshot_created_on_ms(
                    COLLECTION_ID))

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
                'type': feconf.UPDATE_TYPE_COLLECTION_COMMIT,
                'last_updated_ms': expected_last_updated_ms,
                'activity_id': COLLECTION_ID,
                'activity_title': 'A new title',
                'author_id': ANOTHER_USER_ID,
                'subject': 'Update collection',
            }], recent_notifications)

    def test_basic_computation_works_if_collection_is_deleted(self):
        with self._get_test_context():
            self.save_new_default_collection(
                COLLECTION_ID, USER_ID, title=COLLECTION_TITLE)
            last_updated_ms_before_deletion = (
                self._get_most_recent_collection_snapshot_created_on_ms(
                    COLLECTION_ID))
            collection_services.delete_collection(USER_ID, COLLECTION_ID)

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
                'type': feconf.UPDATE_TYPE_COLLECTION_COMMIT,
                'activity_id': COLLECTION_ID,
                'activity_title': COLLECTION_TITLE,
                'author_id': USER_ID,
                'subject': feconf.COMMIT_MESSAGE_COLLECTION_DELETED,
            }, recent_notifications[0])
            self.assertLess(
                last_updated_ms_before_deletion,
                recent_notifications[0]['last_updated_ms'])


class ModifiedUserImpactAggregator(
        user_jobs_continuous.UserImpactAggregator):
    """A modified UserImpactAggregator that does not start a new
     batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedUserImpactMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedUserImpactMRJobManager(
        user_jobs_continuous.UserImpactMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedUserImpactAggregator


class UserImpactAggregatorTest(test_utils.GenericTestBase):
    """ Tests the calculation of a user's impact score from the
    continuous computation of UserImpactAggregator.
    """

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    # Constants imported from the impact job manager.
    impact_mr_job_manager = ModifiedUserImpactMRJobManager
    NUM_RATINGS_SCALER_CUTOFF = impact_mr_job_manager.NUM_RATINGS_SCALER_CUTOFF
    NUM_RATINGS_SCALER = impact_mr_job_manager.NUM_RATINGS_SCALER
    MIN_AVERAGE_RATING = impact_mr_job_manager.MIN_AVERAGE_RATING
    MULTIPLIER = impact_mr_job_manager.MULTIPLIER
    # The impact score takes the ln of the number of completions as a factor,
    # so the minimum number of completions to get a nonzero impact score
    # is 2.
    MIN_NUM_COMPLETIONS = 2
    BELOW_MIN_RATING = int(math.ceil(MIN_AVERAGE_RATING - 1))
    ABOVE_MIN_RATING = int(math.floor(MIN_AVERAGE_RATING + 1))

    def setUp(self):
        super(UserImpactAggregatorTest, self).setUp()
        self.num_completions = defaultdict(int)

    def _mock_get_statistics(self, exp_id, unused_version):
        current_completions = {
            self.EXP_ID_1: {
                'complete_exploration_count':
                self.num_completions[self.EXP_ID_1]
            },
            self.EXP_ID_2: {
                'complete_exploration_count':
                self.num_completions[self.EXP_ID_2]
            },
        }
        return current_completions[exp_id]

    @classmethod
    def _mock_get_zero_impact_score(cls, unused_exploration_id):
        return 0

    @classmethod
    def _mock_get_below_zero_impact_score(cls, unused_exploration_id):
        return -1

    @classmethod
    def _mock_get_positive_impact_score(cls, unused_exploration_id):
        return 1

    def _run_computation(self):
        """Runs the MapReduce job after running the continuous
        statistics aggregator for explorations to get the correct num
        completion events."""
        with self.swap(stats_jobs_continuous.StatisticsAggregator,
                       'get_statistics', self._mock_get_statistics):
            ModifiedUserImpactAggregator.start_computation()
            self.process_and_flush_pending_tasks()

    def _run_exp_impact_calculation_and_assert_equals(
            self, exploration_id, expected_impact):
        with self.swap(stats_jobs_continuous.StatisticsAggregator,
                       'get_statistics', self._mock_get_statistics):
            self.assertEqual(
                expected_impact,
                self.impact_mr_job_manager._get_exp_impact_score(  # pylint: disable=protected-access
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
        user_ids = ['user%d' % i for i in range(num_ratings)]
        for user_id in user_ids:
            rating_services.assign_rating_to_exploration(
                user_id, exp_id, rating)

    def _complete_exploration(self, exploration, num_completions):
        """Log a completion of exploration with id exp_id num_completions
        times."""
        exp_version = 1
        state = exploration.init_state_name
        session_ids = ['session%d' % i for i in range(num_completions)]
        for session_id in session_ids:
            event_services.StartExplorationEventHandler.record(
                exploration.id, exp_version, state, session_id, {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.CompleteExplorationEventHandler.record(
                exploration.id, exp_version, state, session_id, 27, {},
                feconf.PLAY_TYPE_NORMAL)
        # Set the number of completions, so mock can function
        # correctly.
        self.num_completions[exploration.id] += num_completions

    def test_user_with_no_explorations_has_no_impact(self):
        """Test that a user who is not a contributor on any exploration
        is not assigned an impact score by the UserImpactMRJobManager.
        """
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            user_a_id, strict=False)
        self.assertIsNone(user_stats_model)

    def test_standard_user_impact_calculation_one_exploration(self):
        """Test that a user who is a contributor on one exploration that:
        - has a number of ratings for that exploration above the treshold
        for the scaler for number of ratings
        - has an average rating above the minimum average rating
        - has a number of playthroughs > 1
        is assigned the correct impact score by the
        UserImpactMRJobManager.
        """
        # Sign up a user and have them create an exploration.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration = self._create_exploration(self.EXP_ID_1, user_a_id)
        # Give this exploration as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            exploration.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        # Give this exploration more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration, self.MIN_NUM_COMPLETIONS)

        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)

        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_standard_user_impact_calculation_multiple_explorations(self):
        """Test that a user who is a contributor on two explorations that:
        - have a number of ratings for that exploration above the treshold
        for the scaler for number of ratings
        - have an average rating above the minimum average rating
        - have a number of playthroughs > 1
        is assigned the correct impact score by the
        UserImpactMRJobManager.
        """
        # Sign up a user and have them create two explorations.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration_1 = self._create_exploration(self.EXP_ID_1, user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, user_a_id)
        # Give these explorations as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        self._rate_exploration(
            exploration_2.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(exploration_2, self.MIN_NUM_COMPLETIONS)

        # The user impact score should be the rounded sum of these two impacts
        # (2 * the same impact).
        expected_user_impact_score = round(
            2 * math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)

        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_only_yield_when_impact_greater_than_zero(self):
        """Tests that map only yields an impact score for an
        exploration when the impact score is greater than 0."""
        # Sign up a user and have them create an exploration.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        self._create_exploration(self.EXP_ID_1, user_a_id)
        exp_model = exp_models.ExplorationModel.get(self.EXP_ID_1)

        # Use mock impact scores to verify that map only yields when
        # the impact score > 0.
        # Should not yield when impact score < 0.
        with self.swap(
            user_jobs_continuous.UserImpactMRJobManager,
            '_get_exp_impact_score', self._mock_get_zero_impact_score
            ):
            results = self.impact_mr_job_manager.map(exp_model)
            with self.assertRaises(StopIteration):
                next(results)
        with self.swap(
            user_jobs_continuous.UserImpactMRJobManager,
            '_get_exp_impact_score', self._mock_get_below_zero_impact_score
            ):
            results = self.impact_mr_job_manager.map(exp_model)
            with self.assertRaises(StopIteration):
                next(results)
        # Should yield one result when impact score > 0.
        with self.swap(
            user_jobs_continuous.UserImpactMRJobManager,
            '_get_exp_impact_score', self._mock_get_positive_impact_score
            ):
            results = self.impact_mr_job_manager.map(exp_model)
            next(results)
            with self.assertRaises(StopIteration):
                next(results)

    def test_impact_for_exp_with_one_completion(self):
        """Test that when an exploration has only one completion,
        the impact returned from the impact function is 0.
        """
        # Sign up a user and have them create an exploration.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration = self._create_exploration(self.EXP_ID_1, user_a_id)
        # Give this exploration as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            exploration.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        # Complete the exploration once.
        self._complete_exploration(exploration, 1)
        # Verify that the impact calculated is 0.
        self._run_exp_impact_calculation_and_assert_equals(
            exploration.id, 0)

    def test_impact_for_exp_with_no_ratings(self):
        """Test that when an exploration has no ratings, the impact returned
        from the impact function is 0.
        """
        # Sign up a user and have them create an exploration.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration = self._create_exploration(self.EXP_ID_1, user_a_id)
        # Give this exploration more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration, self.MIN_NUM_COMPLETIONS)
        # Verify that the impact calculated is 0.
        self._run_exp_impact_calculation_and_assert_equals(
            exploration.id, 0)

    def test_impact_for_exp_with_avg_rating_not_greater_than_min(self):
        """Test that an exploration has an average rating less than the
        minimum average rating, the impact returned from the impact function
        is 0.
        """
        # Sign up a user and have them create an exploration.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration = self._create_exploration(self.EXP_ID_1, user_a_id)
        # Give this exploration more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration, self.MIN_NUM_COMPLETIONS)

        # Rate this exploration once, with exactly the minimum average
        # rating.
        self._rate_exploration(exploration.id, 1, self.BELOW_MIN_RATING)
        # Verify that the impact calculated is 0.
        self._run_exp_impact_calculation_and_assert_equals(
            exploration.id, 0)

        # Rate this exploration again, dropping the average below the minimum.
        self._rate_exploration(exploration.id, 1, self.BELOW_MIN_RATING)
        # Verify that the impact calculated is still 0.
        self._run_exp_impact_calculation_and_assert_equals(
            exploration.id, 0)

    def test_impact_with_ratings_scaler(self):
        """Test that the ratings scaler is being properly applied in the
        impact calculation.
        """
        # Sign up a user and have them create an exploration.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration = self._create_exploration(self.EXP_ID_1, user_a_id)
        # Give this exploration more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration, self.MIN_NUM_COMPLETIONS)
        # Rate this exploration only twice, but give rating above minimum
        # average rating.
        self._rate_exploration(
            exploration.id, 2, self.ABOVE_MIN_RATING)

        expected_exp_impact_score = (
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            (self.NUM_RATINGS_SCALER * 2) *
            self.MULTIPLIER)
        self._run_exp_impact_calculation_and_assert_equals(
            exploration.id, expected_exp_impact_score)

    def test_scaler_multiplier_independence(self):
        """Test that when one exploration has less than 10 ratings,
        the other exploration's impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration_1 = self._create_exploration(self.EXP_ID_1, user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, user_a_id)
        # Give one explorations as many ratings as necessary to avoid
        # the scaler for number of ratings. Give the other only 1.
        self._rate_exploration(
            exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        self._rate_exploration(
            exploration_2.id, 1, self.ABOVE_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(exploration_2, self.MIN_NUM_COMPLETIONS)

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
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_no_ratings_independence(self):
        """Test that when one exploration has no ratings, the other exploration's
        impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration_1 = self._create_exploration(self.EXP_ID_1, user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, user_a_id)
        # Give one exploration as many ratings as necessary to avoid
        # the scaler for number of ratings. Don't give the other any ratings.
        self._rate_exploration(
            exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(exploration_2, self.MIN_NUM_COMPLETIONS)
        # We expect the second exploration to yield 0 (since it has no
        # ratings), so the expected impact score is just the impact score for
        # exploration 1.
        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_min_avg_rating_independence(self):
        """Test that when one exploration has less than the minimum average
        rating, the other exploration's impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration_1 = self._create_exploration(self.EXP_ID_1, user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, user_a_id)
        # Give these explorations as many ratings as necessary to avoid
        # the scaler for number of ratings. Rate one above the minimum,
        # rate the other below.
        self._rate_exploration(
            exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        self._rate_exploration(
            exploration_2.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.BELOW_MIN_RATING)
        # Give these explorations more than one playthrough (so
        # ln(num_completions) != 0.
        self._complete_exploration(exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(exploration_2, self.MIN_NUM_COMPLETIONS)
        # We expect the second exploration to yield 0 (since its average rating
        # is below the minimum), so the expected impact score is just the
        # impact score for exploration 1.
        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)

    def test_num_completions_independence(self):
        """Test that when one exploration has less than the minimum number
        of completions, the other exploration's impact score is not impacted.
        """
        # Sign up a user and have them create two explorations.
        user_a_id = self._sign_up_user(
            self.USER_A_EMAIL, self.USER_A_USERNAME)
        exploration_1 = self._create_exploration(self.EXP_ID_1, user_a_id)
        exploration_2 = self._create_exploration(self.EXP_ID_2, user_a_id)
        # Give these explorations as many ratings as necessary to avoid
        # the scaler for number of ratings.
        self._rate_exploration(
            exploration_1.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        self._rate_exploration(
            exploration_2.id, self.NUM_RATINGS_SCALER_CUTOFF,
            self.ABOVE_MIN_RATING)
        # Give one exploration the minimum number of completions. Give the other
        # only one.
        self._complete_exploration(exploration_1, self.MIN_NUM_COMPLETIONS)
        self._complete_exploration(exploration_2, 1)
        # We expect the second exploration to yield 0 (since its average rating
        # is below the minimum), so the expected impact score is just the
        # impact score for exploration 1.
        expected_user_impact_score = round(
            math.log(self.MIN_NUM_COMPLETIONS) *
            (self.ABOVE_MIN_RATING - self.MIN_AVERAGE_RATING) *
            self.MULTIPLIER)
        # Verify that the impact score matches the expected.
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(user_a_id)
        self.assertEqual(
            user_stats_model.impact_score, expected_user_impact_score)
