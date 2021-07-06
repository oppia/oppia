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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.controllers import creator_dashboard
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_domain
from core.domain import feedback_services
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(user_models, stats_models, suggestion_models, feedback_models) = (
    models.Registry.import_models(
        [models.NAMES.user, models.NAMES.statistics, models.NAMES.suggestion,
         models.NAMES.feedback]))


class OldContributorDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old contributor dashboard page URL
    to the new one.
    """

    def test_old_contributor_dashboard_page_url(self):
        """Test to validate that the old contributor dashboard page url
        redirects to the new one.
        """
        response = self.get_html_response(
            '/contributor_dashboard', expected_status_int=301)
        self.assertEqual(
            'http://localhost/contributor-dashboard',
            response.headers['location'])


class OldCreatorDashboardRedirectPageTest(test_utils.GenericTestBase):
    """Test for redirecting the old creator dashboard page URL
    to the new one.
    """

    def test_old_creator_dashboard_page_url(self):
        """Test to validate that the old creator dashboard page url redirects
        to the new one.
        """
        response = self.get_html_response(
            '/creator_dashboard', expected_status_int=301)
        self.assertEqual(
            'http://localhost/creator-dashboard', response.headers['location'])


class HomePageTests(test_utils.GenericTestBase):

    def test_logged_out_homepage(self):
        """Test the logged-out version of the home page."""
        response = self.get_html_response('/')
        self.assertEqual(response.status_int, 200)
        self.assertIn('</oppia-splash-page-root>', response)


class CreatorDashboardStatisticsTests(test_utils.GenericTestBase):
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
        super(CreatorDashboardStatisticsTests, self).setUp()
        self.signup(self.OWNER_EMAIL_1, self.OWNER_USERNAME_1)
        self.signup(self.OWNER_EMAIL_2, self.OWNER_USERNAME_2)

        self.owner_id_1 = self.get_user_id_from_email(self.OWNER_EMAIL_1)
        self.owner_id_2 = self.get_user_id_from_email(self.OWNER_EMAIL_2)
        self.owner_1 = user_services.get_user_actions_info(self.owner_id_1)

    def _record_start(self, exp_id, exp_version, state):
        """Record start event to an exploration.
        Completing the exploration is not necessary here since the total_plays
        are currently being counted taking into account only the # of starts.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.StatsEventsHandler.record(
            exp_id, exp_version, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })
        self.process_and_flush_pending_tasks()

    def _rate_exploration(self, exp_id, ratings):
        """Create num_ratings ratings for exploration with exp_id,
        of values from ratings.
        """
        # Generate unique user ids to rate an exploration. Each user id needs
        # to be unique since each user can only give an exploration one rating.
        user_ids = ['user%d' % i for i in python_utils.RANGE(len(ratings))]
        self.process_and_flush_pending_tasks()
        for ind, user_id in enumerate(user_ids):
            rating_services.assign_rating_to_exploration(
                user_id, exp_id, ratings[ind])
        self.process_and_flush_pending_tasks()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        job_id = user_jobs_one_off.DashboardStatsOneOffJob.create_new()
        user_jobs_one_off.DashboardStatsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_stats_no_explorations(self):
        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.assertIsNone(user_models.UserStatsModel.get(
            self.owner_id_1, strict=False))
        self.logout()

    def test_one_play_for_single_exploration(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(user_model.total_plays, 1)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model.impact_score)
        self.assertEqual(user_model.num_ratings, 0)
        self.assertIsNone(user_model.average_ratings)
        self.logout()

    def test_one_rating_for_single_exploration(self):
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_id = self.EXP_ID_1
        self._rate_exploration(exp_id, [4])

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(user_model.total_plays, 0)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model.impact_score)
        self.assertEqual(user_model.num_ratings, 1)
        self.assertEqual(user_model.average_ratings, 4)
        self.logout()

    def test_one_play_and_rating_for_single_exploration(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_id = self.EXP_ID_1

        exp_version = self.EXP_DEFAULT_VERSION
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)

        self._rate_exploration(exp_id, [3])

        def _mock_get_date_after_one_week():
            """Returns the date of the next week."""
            return (
                (datetime.datetime.utcnow() + datetime.timedelta(7)).strftime(
                    feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT))

        # Test to see if last week stats get updated by setting the date to the
        # next week.
        with self.swap(
            user_services, 'get_current_date_as_string',
            _mock_get_date_after_one_week):
            self._run_one_off_job()
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(
            response['last_week_stats']
            [_mock_get_date_after_one_week()]['average_ratings'], 3)

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(user_model.total_plays, 1)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model.impact_score)
        self.assertEqual(user_model.num_ratings, 1)
        self.assertEqual(user_model.average_ratings, 3)

        def _mock_get_last_week_dashboard_stats(user_id):
            """Mocks 'get_last_week_dashboard_stats()' to return more than one
            key-value pair.
            """
            return {
                'date1': {user_id: 'stats1'}, 'date2': {user_id: 'stats2'}
            }

        # 'last_week_stats' is None if 'get_last_week_dashboard_stats()' returns
        # more than one key-value pair.
        with self.swap(
            user_services, 'get_last_week_dashboard_stats',
            _mock_get_last_week_dashboard_stats):
            response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
            self.assertIsNone(response['last_week_stats'])
        self.logout()

    def test_multiple_plays_and_ratings_for_single_exploration(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)

        self._rate_exploration(exp_id, [3, 4, 5])

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(user_model.total_plays, 4)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model.impact_score)
        self.assertEqual(user_model.num_ratings, 3)
        self.assertEqual(user_model.average_ratings, 4)
        self.logout()

    def test_one_play_and_rating_for_multiple_explorations(self):
        exploration_1 = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id_1 = self.EXP_ID_1
        state_1 = exploration_1.init_state_name

        self._record_start(exp_id_1, exp_version, state_1)

        self._rate_exploration(exp_id_1, [4])

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(user_model.total_plays, 1)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model.impact_score)
        self.assertEqual(user_model.num_ratings, 1)
        self.assertEqual(user_model.average_ratings, 4)
        self.logout()

    def test_multiple_plays_and_ratings_for_multiple_explorations(self):
        exploration_1 = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)
        exploration_2 = self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
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

        user_model = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(user_model.total_plays, 3)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model.impact_score)
        self.assertEqual(user_model.num_ratings, 3)
        self.assertEqual(
            user_model.average_ratings, python_utils.divide(10, 3.0))
        self.logout()

    def test_stats_for_single_exploration_with_multiple_owners(self):
        exploration = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)

        rights_manager.assign_role_for_exploration(
            self.owner_1, self.EXP_ID_1, self.owner_id_2,
            rights_domain.ROLE_OWNER)

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        exp_version = self.EXP_DEFAULT_VERSION
        exp_id = self.EXP_ID_1
        state = exploration.init_state_name

        self._record_start(exp_id, exp_version, state)
        self._record_start(exp_id, exp_version, state)

        self._rate_exploration(exp_id, [3, 4, 5])
        self.logout()

        self.login(self.OWNER_EMAIL_2)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)

        self._rate_exploration(exp_id, [3, 4, 5])

        user_model_1 = user_models.UserStatsModel.get(
            self.owner_id_1)
        self.assertEqual(user_model_1.total_plays, 2)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model_1.impact_score)
        self.assertEqual(user_model_1.num_ratings, 3)
        self.assertEqual(user_model_1.average_ratings, 4)

        user_model_2 = user_models.UserStatsModel.get(
            self.owner_id_2)
        self.assertEqual(user_model_2.total_plays, 2)
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model_2.impact_score)
        self.assertEqual(user_model_2.num_ratings, 3)
        self.assertEqual(user_model_2.average_ratings, 4)
        self.logout()

    def test_stats_for_multiple_explorations_with_multiple_owners(self):
        exploration_1 = self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)
        exploration_2 = self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)

        rights_manager.assign_role_for_exploration(
            self.owner_1, self.EXP_ID_1, self.owner_id_2,
            rights_domain.ROLE_OWNER)
        rights_manager.assign_role_for_exploration(
            self.owner_1, self.EXP_ID_2, self.owner_id_2,
            rights_domain.ROLE_OWNER)

        self.login(self.OWNER_EMAIL_2)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
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

        self._rate_exploration(exp_id_1, [5, 3])
        self._rate_exploration(exp_id_2, [5, 5])

        expected_results = {
            'total_plays': 5,
            'num_ratings': 4,
            'average_ratings': python_utils.divide(18, 4.0)
        }

        user_model_2 = user_models.UserStatsModel.get(self.owner_id_2)
        self.assertEqual(
            user_model_2.total_plays, expected_results['total_plays'])
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model_2.impact_score)
        self.assertEqual(
            user_model_2.num_ratings, expected_results['num_ratings'])
        self.assertEqual(
            user_model_2.average_ratings, expected_results['average_ratings'])
        self.logout()

        self.login(self.OWNER_EMAIL_1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)

        user_model_1 = user_models.UserStatsModel.get(self.owner_id_1)
        self.assertEqual(
            user_model_1.total_plays, expected_results['total_plays'])
        # TODO(#11475): Calculate impact_score with an Apache Beam job.
        self.assertIsNone(user_model_2.impact_score)
        self.assertEqual(
            user_model_1.num_ratings, expected_results['num_ratings'])
        self.assertEqual(
            user_model_1.average_ratings, expected_results['average_ratings'])
        self.logout()


class CreatorDashboardHandlerTests(test_utils.GenericTestBase):

    COLLABORATOR_EMAIL = 'collaborator@example.com'
    COLLABORATOR_USERNAME = 'collaborator'

    OWNER_EMAIL_1 = 'owner1@example.com'
    OWNER_USERNAME_1 = 'owner1'
    OWNER_EMAIL_2 = 'owner2@example.com'
    OWNER_USERNAME_2 = 'owner2'

    EXP_ID = 'exp_id'
    EXP_TITLE = 'Exploration title'
    EXP_ID_1 = 'exp_id_1'
    EXP_TITLE_1 = 'Exploration title 1'
    EXP_ID_2 = 'exp_id_2'
    EXP_TITLE_2 = 'Exploration title 2'
    EXP_ID_3 = 'exp_id_3'
    EXP_TITLE_3 = 'Exploration title 3'

    def setUp(self):
        super(CreatorDashboardHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.OWNER_EMAIL_1, self.OWNER_USERNAME_1)
        self.signup(self.OWNER_EMAIL_2, self.OWNER_USERNAME_2)
        self.signup(self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner_id_1 = self.get_user_id_from_email(self.OWNER_EMAIL_1)
        self.owner_id_2 = self.get_user_id_from_email(self.OWNER_EMAIL_2)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.owner_1 = user_services.get_user_actions_info(self.owner_id_1)
        self.collaborator_id = self.get_user_id_from_email(
            self.COLLABORATOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_no_explorations(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.logout()

    def test_no_explorations_and_visit_dashboard(self):
        self.login(self.OWNER_EMAIL)
        # Testing that creator only visit dashboard without any exploration
        # created.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 0)
        self.logout()

    def test_create_single_exploration_and_visit_dashboard(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        # Testing the quantity of exploration created and it should be 1.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.logout()

    def test_create_two_explorations_delete_one_and_visit_dashboard(self):
        self.login(self.OWNER_EMAIL_1)
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_1, title=self.EXP_TITLE_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_1, title=self.EXP_TITLE_2)
        # Testing the quantity of exploration and it should be 2.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 2)
        exp_services.delete_exploration(self.owner_id_1, self.EXP_ID_1)
        # Testing whether 1 exploration left after deletion of previous one.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.logout()

    def test_create_multiple_explorations_delete_all_and_visit_dashboard(self):
        self.login(self.OWNER_EMAIL_2)
        self.save_new_default_exploration(
            self.EXP_ID_1, self.owner_id_2, title=self.EXP_TITLE_1)
        self.save_new_default_exploration(
            self.EXP_ID_2, self.owner_id_2, title=self.EXP_TITLE_2)
        self.save_new_default_exploration(
            self.EXP_ID_3, self.owner_id_2, title=self.EXP_TITLE_3)
        # Testing for quantity of explorations to be 3.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 3)
        # Testing for deletion of all created previously.
        exp_services.delete_exploration(self.owner_id_2, self.EXP_ID_1)
        exp_services.delete_exploration(self.owner_id_2, self.EXP_ID_2)
        exp_services.delete_exploration(self.owner_id_2, self.EXP_ID_3)
        # All explorations have been deleted, so the dashboard query should not
        # load any explorations.
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 0)
        self.logout()

    def test_managers_can_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        self.set_admins([self.OWNER_USERNAME])

        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PUBLIC)

        self.logout()

    def test_collaborators_can_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.collaborator_id,
            rights_domain.ROLE_EDITOR)
        self.set_admins([self.OWNER_USERNAME])

        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_domain.ACTIVITY_STATUS_PUBLIC)

        self.logout()

    def test_viewer_cannot_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner, self.EXP_ID, self.viewer_id,
            rights_domain.ROLE_VIEWER)
        self.set_admins([self.OWNER_USERNAME])

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        self.logout()

    def test_can_see_feedback_thread_counts(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)

        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['num_open_threads'], 0)
        self.assertEqual(
            response['explorations_list'][0]['num_total_threads'], 0)

        def mock_get_thread_analytics_multi(unused_exploration_ids):
            return [feedback_domain.FeedbackAnalytics(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID, 2, 3)]

        with self.swap(
            feedback_services, 'get_thread_analytics_multi',
            mock_get_thread_analytics_multi):

            response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
            self.assertEqual(len(response['explorations_list']), 1)
            self.assertEqual(
                response['explorations_list'][0]['num_open_threads'], 2)
            self.assertEqual(
                response['explorations_list'][0]['num_total_threads'], 3)

        self.logout()

    def test_can_see_subscribers(self):
        self.login(self.OWNER_EMAIL)

        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscribers_list']), 0)

        # Subscribe to creator.
        subscription_services.subscribe_to_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscribers_list']), 1)
        self.assertEqual(
            response['subscribers_list'][0]['subscriber_username'],
            self.VIEWER_USERNAME)

        # Unsubscribe from creator.
        subscription_services.unsubscribe_from_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['subscribers_list']), 0)

    def test_get_topic_summary_dicts_with_new_structure_players_enabled(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['topic_summary_dicts']), 0)
        self.save_new_topic(
            'topic_id', self.owner_id, name='Name',
            description='Description',
            canonical_story_ids=['story_id_1', 'story_id_2'],
            additional_story_ids=['story_id_3'],
            uncategorized_skill_ids=['skill_id_1', 'skill_id_2'],
            subtopics=[], next_subtopic_id=1)
        response = self.get_json(feconf.CREATOR_DASHBOARD_DATA_URL)
        self.assertEqual(len(response['topic_summary_dicts']), 1)
        self.assertTrue(isinstance(response['topic_summary_dicts'], list))
        self.assertEqual(response['topic_summary_dicts'][0]['name'], 'Name')
        self.assertEqual(
            response['topic_summary_dicts'][0]['id'], 'topic_id')
        self.logout()

    def test_can_update_display_preference(self):
        self.login(self.OWNER_EMAIL)
        display_preference = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['display_preference']
        self.assertEqual(display_preference, 'card')
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.CREATOR_DASHBOARD_DATA_URL,
            {'display_preference': 'list'},
            csrf_token=csrf_token)
        display_preference = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['display_preference']
        self.assertEqual(display_preference, 'list')
        self.logout()

    def test_can_create_collections(self):
        self.set_admins([self.OWNER_USERNAME])
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        collection_id = self.post_json(
            feconf.NEW_COLLECTION_URL, {}, csrf_token=csrf_token)[
                creator_dashboard.COLLECTION_ID_KEY]
        collection = collection_services.get_collection_by_id(collection_id)
        self.assertEqual(collection.id, collection_id)
        self.assertEqual(collection.title, feconf.DEFAULT_COLLECTION_TITLE)
        self.assertEqual(
            collection.objective, feconf.DEFAULT_COLLECTION_CATEGORY)
        self.assertEqual(
            collection.category, feconf.DEFAULT_COLLECTION_OBJECTIVE)
        self.assertEqual(
            collection.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.logout()

    def test_get_collections_list(self):
        self.set_admins([self.OWNER_USERNAME])
        self.login(self.OWNER_EMAIL)
        collection_list = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['collections_list']
        self.assertEqual(collection_list, [])
        self.save_new_default_collection(
            'collection_id', self.owner_id, title='A title',
            objective='An objective', category='A category')
        collection_list = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['collections_list']
        self.assertEqual(len(collection_list), 1)
        self.assertEqual(collection_list[0]['id'], 'collection_id')
        self.assertEqual(collection_list[0]['title'], 'A title')
        self.assertEqual(collection_list[0]['objective'], 'An objective')
        self.assertEqual(collection_list[0]['category'], 'A category')
        self.logout()

    def test_get_suggestions_list(self):
        self.login(self.OWNER_EMAIL)
        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['created_suggestions_list']
        self.assertEqual(suggestions, [])
        change_dict = {
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'state_name': 'Introduction',
            'new_value': ''
        }
        self.save_new_default_exploration('exploration_id', self.owner_id)
        suggestion_services.create_suggestion(
            'edit_exploration_state_content', 'exploration',
            'exploration_id', 1, self.owner_id, change_dict, '')
        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['created_suggestions_list'][0]
        change_dict['old_value'] = {
            'content_id': 'content',
            'html': ''
        }
        self.assertEqual(suggestions['change'], change_dict)
        # Test to check if suggestions populate old value of the change.
        self.assertEqual(
            suggestions['change']['old_value']['content_id'], 'content')
        self.logout()

    def test_get_suggestions_to_review_list(self):
        self.login(self.OWNER_EMAIL)

        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['suggestions_to_review_list']
        self.assertEqual(suggestions, [])

        change_dict = {
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'state_name': 'Introduction',
            'new_value': ''
        }
        self.save_new_default_exploration('exp1', self.owner_id)

        user_models.UserContributionProficiencyModel.create(
            self.owner_id, 'category1', 15)
        model1 = feedback_models.GeneralFeedbackThreadModel.create(
            'exploration.exp1.thread_1')
        model1.entity_type = 'exploration'
        model1.entity_id = 'exp1'
        model1.subject = 'subject'
        model1.update_timestamps()
        model1.put()

        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp1', 1, suggestion_models.STATUS_IN_REVIEW, self.owner_id_1,
            self.owner_id_2, change_dict, 'category1',
            'exploration.exp1.thread_1', None)

        change_dict['old_value'] = {
            'content_id': 'content',
            'html': ''
        }
        suggestions = self.get_json(
            feconf.CREATOR_DASHBOARD_DATA_URL)['suggestions_to_review_list']

        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]['change'], change_dict)
        # Test to check if suggestions populate old value of the change.
        self.assertEqual(
            suggestions[0]['change']['old_value']['content_id'], 'content')

        self.logout()

    def test_creator_dashboard_page(self):
        self.login(self.OWNER_EMAIL)

        response = self.get_html_response(feconf.CREATOR_DASHBOARD_URL)
        self.assertIn('Creator Dashboard | Oppia', response.body)

        self.logout()


class CreationButtonsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CreationButtonsTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

    def test_new_exploration_ids(self):
        """Test generation of exploration ids."""
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()
        exp_a_id = self.post_json(
            feconf.NEW_EXPLORATION_URL, {}, csrf_token=csrf_token
        )[creator_dashboard.EXPLORATION_ID_KEY]
        self.assertEqual(len(exp_a_id), 12)

        self.logout()

    def test_can_non_admins_can_not_upload_exploration(self):
        self.login(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            feconf.UPLOAD_EXPLORATION_URL, {}, csrf_token=csrf_token,
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You do not have credentials to upload explorations.')

        self.logout()

    def test_can_upload_exploration(self):
        with self.swap(constants, 'ALLOW_YAML_FILE_UPLOAD', True):
            self.set_admins([self.ADMIN_USERNAME])
            self.login(self.ADMIN_EMAIL, is_super_admin=True)

            csrf_token = self.get_new_csrf_token()
            explorations_list = self.get_json(
                feconf.CREATOR_DASHBOARD_DATA_URL)['explorations_list']
            self.assertEqual(explorations_list, [])
            exp_a_id = self.post_json(
                '%s?yaml_file=%s' % (
                    feconf.UPLOAD_EXPLORATION_URL,
                    self.SAMPLE_YAML_CONTENT), {},
                csrf_token=csrf_token)[creator_dashboard.EXPLORATION_ID_KEY]
            explorations_list = self.get_json(
                feconf.CREATOR_DASHBOARD_DATA_URL)['explorations_list']
            exploration = exp_fetchers.get_exploration_by_id(exp_a_id)
            self.assertEqual(explorations_list[0]['id'], exp_a_id)
            self.assertEqual(exploration.to_yaml(), self.SAMPLE_YAML_CONTENT)
            self.logout()

    def test_can_not_upload_exploration_when_server_does_not_allow_file_upload(
            self):
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '%s?yaml_file=%s' % (
                feconf.UPLOAD_EXPLORATION_URL,
                self.SAMPLE_YAML_CONTENT), {}, csrf_token=csrf_token,
            expected_status_int=400)

        self.logout()
