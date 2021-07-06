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

"""Tests for user-related one-off computations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import event_services
from core.domain import rating_services
from core.domain import taskqueue_services
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.tests import test_utils
import feconf


class DashboardStatsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard stats job."""

    CURRENT_DATE_AS_STRING = user_services.get_current_date_as_string()
    DATE_AFTER_ONE_WEEK = (
        (datetime.datetime.utcnow() + datetime.timedelta(7)).strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT))

    USER_SESSION_ID = 'session1'

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    EXP_VERSION = 1

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.DashboardStatsOneOffJob.create_new()
        user_jobs_one_off.DashboardStatsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def setUp(self):
        super(DashboardStatsOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def mock_get_current_date_as_string(self):
        return self.CURRENT_DATE_AS_STRING

    def _rate_exploration(self, user_id, exp_id, rating):
        """Assigns rating to the exploration corresponding to the given
        exploration id.

        Args:
            user_id: str. The user id.
            exp_id: str. The exploration id.
            rating: int. The rating to be assigned to the given exploration.
        """
        rating_services.assign_rating_to_exploration(user_id, exp_id, rating)

    def _record_play(self, exp_id, state):
        """Calls StartExplorationEventHandler and records the 'play' event
        corresponding to the given exploration id.

        Args:
            exp_id: str. The exploration id.
            state: dict(str, *). The state of the exploration corresponding to
                the given id.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, self.EXP_VERSION, state, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)

    def test_weekly_stats(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._record_play(exp_id, init_state_name)
        self._rate_exploration('user1', exp_id, 5)

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, None)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id), None)

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, [{
            self.mock_get_current_date_as_string(): {
                'num_ratings': 1,
                'average_ratings': 5.0,
                'total_plays': 1
            }
        }])
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id),
            {
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 5.0,
                    'total_plays': 1
                }
            })

    def test_weekly_stats_if_no_explorations(self):
        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 0,
                    'average_ratings': None,
                    'total_plays': 0
                }
            }])

    def test_weekly_stats_for_single_exploration(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._record_play(exp_id, init_state_name)
        self._rate_exploration('user1', exp_id, 5)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 5.0,
                    'total_plays': 1
                }
            }])

    def test_weekly_stats_for_multiple_explorations(self):
        exploration_1 = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id_1 = exploration_1.id
        exploration_2 = self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id)
        exp_id_2 = exploration_2.id
        init_state_name_1 = exploration_1.init_state_name
        self._record_play(exp_id_1, init_state_name_1)
        self._rate_exploration('user1', exp_id_1, 5)
        self._rate_exploration('user2', exp_id_2, 4)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 2,
                    'average_ratings': 4.5,
                    'total_plays': 1
                }
            }])

    def test_stats_for_multiple_weeks(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._rate_exploration('user1', exp_id, 4)
        self._record_play(exp_id, init_state_name)
        self._record_play(exp_id, init_state_name)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 2,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.process_and_flush_pending_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 4.0,
                    'total_plays': 2
                }
            }])

        self._rate_exploration('user2', exp_id, 2)

        def _mock_get_date_after_one_week():
            """Returns the date of the next week."""
            return self.DATE_AFTER_ONE_WEEK

        with self.swap(
            user_services,
            'get_current_date_as_string',
            _mock_get_date_after_one_week):
            self._run_one_off_job()

        expected_results_list = [
            {
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 4.0,
                    'total_plays': 2
                }
            },
            {
                _mock_get_date_after_one_week(): {
                    'num_ratings': 2,
                    'average_ratings': 3.0,
                    'total_plays': 2
                }
            }
        ]
        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, expected_results_list)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id),
            expected_results_list[1])
