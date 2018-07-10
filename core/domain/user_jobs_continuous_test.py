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

import collections

from core import jobs_registry
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_jobs_one_off
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_jobs_continuous
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(exp_models, stats_models, user_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics, models.NAMES.user])
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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

    def test_basic_computation_with_an_update_after_exploration_is_created(
            self):
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                'exploration', EXP_1_ID, None, editor_id,
                FEEDBACK_THREAD_SUBJECT, 'text')
            thread_id = feedback_services.get_all_threads(
                'exploration', EXP_1_ID, False)[0].id
            message = feedback_services.get_messages(thread_id)[0]

            # User creates another exploration.
            self.save_new_valid_exploration(
                EXP_2_ID, editor_id, title=EXP_2_TITLE,
                category='Category')
            exp2_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_2_ID))

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                'last_updated_ms': utils.get_time_in_millisecs(
                    message.created_on),
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
                'exploration', EXP_ID, None, user_b_id, FEEDBACK_THREAD_SUBJECT,
                'text')
            thread_id = feedback_services.get_all_threads(
                'exploration', EXP_ID, False)[0].id

            message = feedback_services.get_messages(thread_id)[0]

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                'last_updated_ms': utils.get_time_in_millisecs(
                    message.created_on),
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_creation_notification = (
                self._get_expected_activity_created_dict(
                    user_a_id, EXP_ID, EXP_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(
                recent_notifications_for_user_a, [
                    expected_thread_notification,
                    expected_creation_notification
                ])
            # User B sees only her feedback thread, but no commits.
            self.assertEqual(
                recent_notifications_for_user_b, [
                    expected_thread_notification,
                ])

    def test_subscribing_to_exploration_subscribes_to_its_feedback_threads(
            self):
        with self._get_test_context():
            self.signup(USER_A_EMAIL, USER_A_USERNAME)
            user_a_id = self.get_user_id_from_email(USER_A_EMAIL)
            self.signup(USER_B_EMAIL, USER_B_USERNAME)
            user_b_id = self.get_user_id_from_email(USER_B_EMAIL)
            user_a = user_services.UserActionsInfo(user_a_id)


            # User A creates an exploration.
            self.save_new_valid_exploration(
                EXP_ID, user_a_id, title=EXP_TITLE, category='Category')
            exp_last_updated_ms = (
                self._get_most_recent_exp_snapshot_created_on_ms(EXP_ID))

            # User B starts a feedback thread.
            feedback_services.create_thread(
                'exploration', EXP_ID, None, user_b_id, FEEDBACK_THREAD_SUBJECT,
                'text')
            thread_id = feedback_services.get_all_threads(
                'exploration', EXP_ID, False)[0].id
            message = feedback_services.get_messages(thread_id)[0]

            # User A adds user B as an editor of the exploration.
            rights_manager.assign_role_for_exploration(
                user_a, EXP_ID, user_b_id, rights_manager.ROLE_EDITOR)

            ModifiedRecentUpdatesAggregator.start_computation()
            self.assertEqual(
                self.count_jobs_in_taskqueue(
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                'last_updated_ms': utils.get_time_in_millisecs(
                    message.created_on),
                'subject': FEEDBACK_THREAD_SUBJECT,
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
            }
            expected_creation_notification = (
                self._get_expected_activity_created_dict(
                    user_a_id, EXP_ID, EXP_TITLE, 'exploration',
                    feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                    exp_last_updated_ms))

            # User A sees A's commit and B's feedback thread.
            self.assertEqual(
                recent_notifications_for_user_a, [
                    expected_thread_notification,
                    expected_creation_notification
                ])
            # User B sees A's commit and B's feedback thread.
            self.assertEqual(
                recent_notifications_for_user_b, [
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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
                    taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
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


class ModifiedUserStatsAggregator(
        user_jobs_continuous.UserStatsAggregator):
    """A modified UserStatsAggregator that does not start a new
     batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedUserStatsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedUserStatsMRJobManager(
        user_jobs_continuous.UserStatsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedUserStatsAggregator


class UserStatsAggregatorTest(test_utils.GenericTestBase):
    """ Tests the calculation of a user's statistics -
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
    EXPONENT = 2.0 / 3

    def setUp(self):
        super(UserStatsAggregatorTest, self).setUp()
        self.num_completions = collections.defaultdict(int)
        self.num_starts = collections.defaultdict(int)
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)

        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)

        self.user_a = user_services.UserActionsInfo(self.user_a_id)

    def _mock_get_statistics(self, exp_id, unused_version):
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
        completion events.
        """
        with self.swap(
            stats_services, 'get_exploration_stats', self._mock_get_statistics):
            ModifiedUserStatsAggregator.start_computation()
            self.process_and_flush_pending_tasks()

    def _generate_user_ids(self, count):
        """Generate unique user ids to rate an exploration. Each user id needs
        to be unique since each user can only give an exploration one rating.
        """
        return ['user%d' % i for i in range(count)]

    def _create_exploration(self, exp_id, user_id):
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
        user_ids = self._generate_user_ids(len(ratings))
        self.process_and_flush_pending_tasks()
        for ind, user_id in enumerate(user_ids):
            event_services.RateExplorationEventHandler.record(
                exp_id, user_id, ratings[ind], None)
        self.process_and_flush_pending_tasks()

    def _record_exploration_rating_for_user(
            self, exp_id, user_id, rating, old_rating=None):
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
        expected_user_impact_score = round(
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
        expected_user_impact_score = round(
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
        expected_user_impact_score = round(
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
        self._create_exploration(self.EXP_ID_1, self.user_a_id)

        # Give two ratings of 1.
        self._rate_exploration(self.EXP_ID_1, 2, 1)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_stats_model.impact_score, 0)
        ModifiedUserStatsAggregator.stop_computation(self.user_a_id)

        # Give two ratings of 2.
        self._rate_exploration(self.EXP_ID_1, 2, 2)
        self._run_computation()
        user_stats_model = user_models.UserStatsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_stats_model.impact_score, 0)
        ModifiedUserStatsAggregator.stop_computation(self.user_a_id)

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
        self.assertEquals(
            user_stats['total_plays'], 0)
        self.assertEquals(
            user_stats['num_ratings'], 0)
        self.assertEquals(
            user_stats['average_ratings'], None)

    def test_realtime_layer_batch_job_single_rating(self):
        self._create_exploration(
            self.EXP_ID_1, self.user_a_id)
        self._record_exploration_rating(self.EXP_ID_1, [4])

        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEquals(user_stats['total_plays'], 0)
        self.assertEquals(user_stats['num_ratings'], 1)
        self.assertEquals(user_stats['average_ratings'], 4)

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
        self.assertEquals(user_stats['total_plays'], 2)
        self.assertEquals(user_stats['num_ratings'], 2)
        self.assertEquals(user_stats['average_ratings'], 3.5)

    def test_realtime_layer_batch_job_single_exploration_multiple_owners(self):
        exploration = self._create_exploration(
            self.EXP_ID_1, self.user_a_id)

        rights_manager.assign_role_for_exploration(
            self.user_a, self.EXP_ID_1, self.user_b_id,
            rights_manager.ROLE_OWNER)

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
            'average_ratings': 22 / 6.0
        }

        user_stats_1 = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEquals(
            user_stats_1['total_plays'], expected_results['total_plays'])
        self.assertEquals(
            user_stats_1['num_ratings'], expected_results['num_ratings'])
        self.assertEquals(
            user_stats_1['average_ratings'],
            expected_results['average_ratings'])

        user_stats_2 = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_b_id))
        self.assertEquals(
            user_stats_2['total_plays'], expected_results['total_plays'])
        self.assertEquals(
            user_stats_2['num_ratings'], expected_results['num_ratings'])
        self.assertEquals(
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
        self.assertEquals(user_stats['total_plays'], 0)
        self.assertEquals(user_stats['num_ratings'], 5)
        self.assertEquals(user_stats['average_ratings'], 18 / 5.0)

    def test_realtime_layer_batch_job_user_rate_same_exp_multiple_times(self):
        self._create_exploration(
            self.EXP_ID_1, self.user_a_id)

        exp_id_1 = self.EXP_ID_1

        self._record_exploration_rating_for_user(exp_id_1, self.user_b_id, 5)
        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEquals(user_stats['total_plays'], 0)
        self.assertEquals(user_stats['num_ratings'], 1)
        self.assertEquals(user_stats['average_ratings'], 5)

        self._record_exploration_rating_for_user(
            exp_id_1, self.user_b_id, 3, old_rating=5)
        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        self.assertEquals(user_stats['total_plays'], 0)
        self.assertEquals(user_stats['num_ratings'], 1)
        self.assertEquals(user_stats['average_ratings'], 3)

    def test_both_realtime_layer_and_batch_data(self):
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
        # _mock_get_statistics() method above.
        self.assertEqual(user_stats_model.total_plays, 14)
        self.assertEqual(user_stats_model.num_ratings, 6)
        self.assertEqual(user_stats_model.average_ratings, 20 / 6.0)

        # Stop the batch job. Fire up a few events and check data from realtime
        # job.
        ModifiedUserStatsAggregator.stop_computation(self.user_a_id)
        self._record_start(exp_id_1, exp_version, state_1)
        self._record_start(exp_id_2, exp_version, state_2)
        self._record_exploration_rating(exp_id_1, [2, 5])
        self._record_exploration_rating(exp_id_2, [4, 1])

        user_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_a_id))
        # After recording two start events, the total plays is now increased by
        # two.
        self.assertEquals(user_stats['total_plays'], 16)
        self.assertEquals(user_stats['num_ratings'], 10)
        self.assertEquals(user_stats['average_ratings'], 32 / 10.0)
