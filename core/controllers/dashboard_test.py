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

"""Tests for the creator dashboard and the notifications dashboard."""

from core.controllers import dashboard
from core.domain import event_services
from core.domain import feedback_domain
from core.domain import feedback_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import stats_jobs_continuous_test
from core.domain import user_jobs_continuous
from core.domain import user_jobs_continuous_test
from core.platform import models
from core.tests import test_utils
import feconf

(user_models, stats_models) = models.Registry.import_models(
    [models.NAMES.user, models.NAMES.statistics])
taskqueue_services = models.Registry.import_taskqueue_services()


class HomePageTest(test_utils.GenericTestBase):

    def test_logged_out_homepage(self):
        """Test the logged-out version of the home page."""
        response = self.testapp.get('/')

        self.assertEqual(response.status_int, 302)
        self.assertIn('splash', response.headers['location'])
        response.follow().mustcontain(
            'I18N_SIDEBAR_ABOUT_LINK', 'I18N_TOPNAV_SIGN_IN')

    def test_notifications_dashboard_redirects_for_logged_out_users(self):
        """Test the logged-out view of the notifications dashboard."""
        response = self.testapp.get('/notifications_dashboard')
        self.assertEqual(response.status_int, 302)
        # This should redirect to the login page.
        self.assertIn('signup', response.headers['location'])
        self.assertIn('notifications_dashboard', response.headers['location'])

        self.login('reader@example.com')
        response = self.testapp.get('/notifications_dashboard')
        # This should redirect the user to complete signup.
        self.assertEqual(response.status_int, 302)
        self.logout()

    def test_logged_in_notifications_dashboard(self):
        """Test the logged-in view of the notifications dashboard."""
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/notifications_dashboard')
        self.assertEqual(response.status_int, 200)
        # The string I18N_TOPNAV_SIGN_IN cannot be part of the inner text of
        # the tag, but can appear as an attribute value.
        response.mustcontain(
            'I18N_TOPNAV_NOTIFICATIONS', 'I18N_TOPNAV_LOGOUT',
            self.get_expected_logout_url('/'),
            no=['>I18N_TOPNAV_SIGN_IN<', self.get_expected_login_url('/')])
        self.logout()


class DashboardStatisticsTest(test_utils.GenericTestBase):
    OWNER_EMAIL_1 = 'owner1@example.com'
    OWNER_USERNAME_1 = 'owner1'
    OWNER_EMAIL_2 = 'owner2@example.com'
    OWNER_USERNAME_2 = 'owner2'

    EXP_ID_1 = 'exp_id_1'
    EXP_TITLE_1 = 'Exploration title 1'
    EXP_ID_2 = 'exp_id_2'
    EXP_TITLE_2 = 'Exploration title 2'

    EXP_DEFAULT_VERSION = 1

    USER_SESSION_ID = 'session1'
    USER_IMPACT_SCORE_DEFAULT = 0.0

    def setUp(self):
        super(DashboardStatisticsTest, self).setUp()
        self.signup(self.OWNER_EMAIL_1, self.OWNER_USERNAME_1)
        self.signup(self.OWNER_EMAIL_2, self.OWNER_USERNAME_2)

        self.owner_id_1 = self.get_user_id_from_email(self.OWNER_EMAIL_1)
        self.owner_id_2 = self.get_user_id_from_email(self.OWNER_EMAIL_2)

    def _record_start(self, exp_id, exp_version, state):
        """Record start event to an exploration.
        Completing the exploration is not necessary here since the total_plays
        are currently being counted taking into account only the # of starts.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)

    def _rate_exploration(self, exp_id, ratings):
        """Create num_ratings ratings for exploration with exp_id,
        of values from ratings.
        """
        # Generate unique user ids to rate an exploration. Each user id needs
        # to be unique since each user can only give an exploration one rating.
        user_ids = ['user%d' % i for i in range(len(ratings))]
        self.process_and_flush_pending_tasks()
        for ind, user_id in enumerate(user_ids):
            rating_services.assign_rating_to_exploration(
                user_id, exp_id, ratings[ind])
        self.process_and_flush_pending_tasks()

    def _run_user_stats_aggregator_job(self):
        (user_jobs_continuous_test.ModifiedUserStatsAggregator.
         start_computation())
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            0)
        self.process_and_flush_pending_tasks()

    def _run_stats_aggregator_jobs(self):
        (stats_jobs_continuous_test.ModifiedStatisticsAggregator
         .start_computation())
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            0)
        self.process_and_flush_pending_tasks()

    def test_stats_no_explorations(self):
        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self._run_user_stats_aggregator_job()
        self.assertIsNone(user_models.UserStatsModel.get(
            self.owner_id_1, strict=False))
        self.logout()

    def test_one_play_for_single_exploration(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._run_stats_aggregator_jobs()

        self._run_user_stats_aggregator_job()
        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(user_model.total_plays, 1)
        self.assertEquals(
            user_model.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model.num_ratings, 0)
        self.assertIsNone(user_model.average_ratings)
        self.logout()

    def test_one_rating_for_single_exploration(self):
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_id = self.EXP_ID_1
        self._rate_exploration(exp_id, [4])

        self._run_user_stats_aggregator_job()
        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(user_model.total_plays, 0)
        self.assertEquals(
            user_model.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model.num_ratings, 1)
        self.assertEquals(user_model.average_ratings, 4)
        self.logout()

    def test_one_play_and_rating_for_single_exploration(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_id = self.EXP_ID_1

        exp_version = self.EXP_DEFAULT_VERSION
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._run_stats_aggregator_jobs()

        self._rate_exploration(exp_id, [3])

        self._run_user_stats_aggregator_job()
        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(user_model.total_plays, 1)
        self.assertEquals(
            user_model.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model.num_ratings, 1)
        self.assertEquals(user_model.average_ratings, 3)
        self.logout()

    def test_multiple_plays_and_ratings_for_single_exploration(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._run_stats_aggregator_jobs()

        self._rate_exploration(exp_id, [3, 4, 5])

        self._run_user_stats_aggregator_job()
        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(user_model.total_plays, 4)
        self.assertEquals(
            user_model.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model.num_ratings, 3)
        self.assertEquals(user_model.average_ratings, 4)
        self.logout()

    def test_one_play_and_rating_for_multiple_explorations(self):
        exploration_1 = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id_1 = self.EXP_ID_1
        state_1 = exploration_1.init_state_name

        self._record_start(exp_id_1, exp_version, state_1)
        self._run_stats_aggregator_jobs()

        self._rate_exploration(exp_id_1, [4])

        self._run_user_stats_aggregator_job()
        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(user_model.total_plays, 1)
        self.assertEquals(
            user_model.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model.num_ratings, 1)
        self.assertEquals(user_model.average_ratings, 4)
        self.logout()

    def test_multiple_plays_and_ratings_for_multiple_explorations(self):
        exploration_1 = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)
        exploration_2 = self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)

        exp_version = self.EXP_DEFAULT_VERSION

        exp_id_1 = self.EXP_ID_1
        state_1 = exploration_1.init_state_name
        exp_id_2 = self.EXP_ID_2
        state_2 = exploration_2.init_state_name

        self._record_start(exp_id_1, exp_version, state_1)
        self._record_start(exp_id_2, exp_version, state_2)
        self._record_start(exp_id_2, exp_version, state_2)

        self._rate_exploration(exp_id_1, [4])
        self._rate_exploration(exp_id_2, [3, 3])

        self._run_stats_aggregator_jobs()
        self._run_user_stats_aggregator_job()

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(user_model.total_plays, 3)
        self.assertEquals(
            user_model.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model.num_ratings, 3)
        self.assertEquals(user_model.average_ratings, 10/3.0)
        self.logout()

    def test_stats_for_single_exploration_with_multiple_owners(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        rights_manager.assign_role_for_exploration(
            self.owner_id_1, self.EXP_ID_1, self.owner_id_2,
            rights_manager.ROLE_OWNER)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._run_stats_aggregator_jobs()

        self._rate_exploration(exp_id, [3, 4, 5])
        self.logout()

        self.login(self.OWNER_EMAIL_2)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        self._rate_exploration(exp_id, [3, 4, 5])

        self._run_user_stats_aggregator_job()

        user_model_1 = user_models.UserStatsModel.get(
            self.owner_id_1)
        self.assertEquals(user_model_1.total_plays, 2)
        self.assertEquals(
            user_model_1.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model_1.num_ratings, 3)
        self.assertEquals(user_model_1.average_ratings, 4)

        user_model_2 = user_models.UserStatsModel.get(
            self.owner_id_2)
        self.assertEquals(user_model_2.total_plays, 2)
        self.assertEquals(
            user_model_2.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(user_model_2.num_ratings, 3)
        self.assertEquals(user_model_2.average_ratings, 4)
        self.logout()

    def test_stats_for_multiple_explorations_with_multiple_owners(self):
        exploration_1 = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)
        exploration_2 = self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)

        rights_manager.assign_role_for_exploration(
            self.owner_id_1, self.EXP_ID_1, self.owner_id_2,
            rights_manager.ROLE_OWNER)
        rights_manager.assign_role_for_exploration(
            self.owner_id_1, self.EXP_ID_2, self.owner_id_2,
            rights_manager.ROLE_OWNER)

        self.login(self.OWNER_EMAIL_2)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)

        exp_version = self.EXP_DEFAULT_VERSION

        exp_id_1 = self.EXP_ID_1
        state_1 = exploration_1.init_state_name
        exp_id_2 = self.EXP_ID_2
        state_2 = exploration_2.init_state_name

        self._record_start(exp_id_1, exp_version, state_1)
        self._record_start(exp_id_1, exp_version, state_1)
        self._record_start(exp_id_2, exp_version, state_2)
        self._record_start(exp_id_2, exp_version, state_2)
        self._record_start(exp_id_2, exp_version, state_2)
        self._run_stats_aggregator_jobs()

        self._rate_exploration(exp_id_1, [5, 3])
        self._rate_exploration(exp_id_2, [5, 5])

        self._run_user_stats_aggregator_job()

        expected_results = {
            'total_plays': 5,
            'num_ratings': 4,
            'average_ratings': 18/4.0
        }

        user_model_2 = user_models.UserStatsModel.get(self.owner_id_2)
        self.assertEquals(
            user_model_2.total_plays, expected_results['total_plays'])
        self.assertEquals(
            user_model_2.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(
            user_model_2.num_ratings, expected_results['num_ratings'])
        self.assertEquals(
            user_model_2.average_ratings, expected_results['average_ratings'])
        self.logout()

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)

        user_model_1 = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEquals(
            user_model_1.total_plays, expected_results['total_plays'])
        self.assertEquals(
            user_model_1.impact_score, self.USER_IMPACT_SCORE_DEFAULT)
        self.assertEquals(
            user_model_1.num_ratings, expected_results['num_ratings'])
        self.assertEquals(
            user_model_1.average_ratings, expected_results['average_ratings'])
        self.logout()


class DashboardHandlerTest(test_utils.GenericTestBase):

    COLLABORATOR_EMAIL = 'collaborator@example.com'
    COLLABORATOR_USERNAME = 'collaborator'

    EXP_ID = 'exp_id'
    EXP_TITLE = 'Exploration title'

    def setUp(self):
        super(DashboardHandlerTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.collaborator_id = self.get_user_id_from_email(
            self.COLLABORATOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_no_explorations(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.logout()

    def test_managers_can_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        self.set_admins([self.OWNER_USERNAME])

        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLIC)

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLICIZED)
        self.logout()

    def test_collaborators_can_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner_id, self.EXP_ID, self.collaborator_id,
            rights_manager.ROLE_EDITOR)
        self.set_admins([self.OWNER_USERNAME])

        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLIC)

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLICIZED)

        self.logout()

    def test_viewer_cannot_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner_id, self.EXP_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        self.set_admins([self.OWNER_USERNAME])

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.logout()

    def test_can_see_feedback_thread_counts(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)

        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['num_open_threads'], 0)
        self.assertEqual(
            response['explorations_list'][0]['num_total_threads'], 0)

        def mock_get_thread_analytics_multi(unused_exploration_ids):
            return [feedback_domain.FeedbackAnalytics(self.EXP_ID, 2, 3)]

        with self.swap(
            feedback_services, 'get_thread_analytics_multi',
            mock_get_thread_analytics_multi):

            response = self.get_json(feconf.DASHBOARD_DATA_URL)
            self.assertEqual(len(response['explorations_list']), 1)
            self.assertEqual(
                response['explorations_list'][0]['num_open_threads'], 2)
            self.assertEqual(
                response['explorations_list'][0]['num_total_threads'], 3)

        self.logout()


class NotificationsDashboardHandlerTest(test_utils.GenericTestBase):

    DASHBOARD_DATA_URL = '/notificationsdashboardhandler/data'

    def setUp(self):
        super(NotificationsDashboardHandlerTest, self).setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def _get_recent_notifications_mock_by_viewer(self, unused_user_id):
        """Returns a single feedback thread by VIEWER_ID."""
        return (100000, [{
            'activity_id': 'exp_id',
            'activity_title': 'exp_title',
            'author_id': self.viewer_id,
            'last_updated_ms': 100000,
            'subject': 'Feedback Message Subject',
            'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
        }])

    def _get_recent_notifications_mock_by_anonymous_user(self, unused_user_id):
        """Returns a single feedback thread by an anonymous user."""
        return (200000, [{
            'activity_id': 'exp_id',
            'activity_title': 'exp_title',
            'author_id': None,
            'last_updated_ms': 100000,
            'subject': 'Feedback Message Subject',
            'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
        }])

    def test_author_ids_are_handled_correctly(self):
        """Test that author ids are converted into author usernames
        and that anonymous authors are handled correctly.
        """
        with self.swap(
            user_jobs_continuous.DashboardRecentUpdatesAggregator,
            'get_recent_notifications',
            self._get_recent_notifications_mock_by_viewer):

            self.login(self.VIEWER_EMAIL)
            response = self.get_json(self.DASHBOARD_DATA_URL)
            self.assertEqual(len(response['recent_notifications']), 1)
            self.assertEqual(
                response['recent_notifications'][0]['author_username'],
                self.VIEWER_USERNAME)
            self.assertNotIn('author_id', response['recent_notifications'][0])

        with self.swap(
            user_jobs_continuous.DashboardRecentUpdatesAggregator,
            'get_recent_notifications',
            self._get_recent_notifications_mock_by_anonymous_user):

            self.login(self.VIEWER_EMAIL)
            response = self.get_json(self.DASHBOARD_DATA_URL)
            self.assertEqual(len(response['recent_notifications']), 1)
            self.assertEqual(
                response['recent_notifications'][0]['author_username'], '')
            self.assertNotIn('author_id', response['recent_notifications'][0])


class CreationButtonsTest(test_utils.GenericTestBase):

    def setUp(self):
        super(CreationButtonsTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

    def test_new_exploration_ids(self):
        """Test generation of exploration ids."""
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.DASHBOARD_URL)
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        exp_a_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token
        )[dashboard.EXPLORATION_ID_KEY]
        self.assertEqual(len(exp_a_id), 12)

        self.logout()

    def test_exploration_upload_button(self):
        """Test that the exploration upload button appears when appropriate."""
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.DASHBOARD_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['ng-click="showUploadExplorationModal()"'])

        with self.swap(feconf, 'ALLOW_YAML_FILE_UPLOAD', True):
            response = self.testapp.get(feconf.DASHBOARD_URL)
            self.assertEqual(response.status_int, 200)
            response.mustcontain('ng-click="showUploadExplorationModal()"')

        self.logout()
