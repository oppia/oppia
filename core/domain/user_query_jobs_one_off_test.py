# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for query MR job."""

import datetime

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import user_query_jobs_one_off
from core.domain import user_query_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])

taskqueue_services = models.Registry.import_taskqueue_services()


class UserQueryJobOneOffTests(test_utils.GenericTestBase):
    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    EXP_ID_3 = 'exp_id_3'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
    USER_D_EMAIL = 'd@example.com'
    USER_D_USERNAME = 'd'
    USER_E_EMAIL = 'e@example.com'
    USER_E_USERNAME = 'e'
    USER_SUBMITTER_EMAIL = 'submit@example.com'
    USER_SUBMITTER_USERNAME = 'submit'

    def _run_one_off_job(self, query_id):
        """Runs the one-off MapReduce job."""
        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        params = {
            'query_id': query_id
        }
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params=params)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_tasks()

    def setUp(self):
        super(UserQueryJobOneOffTests, self).setUp()
        # User A has no created or edited explorations
        # User B has one created exploration
        # User C has one edited exploration
        # User D has created an exploration and then edited it.
        # User E has created an exploration 10 days before.
        # Submitter is the user who submits the query.
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)
        self.signup(self.USER_E_EMAIL, self.USER_E_USERNAME)
        self.user_e_id = self.get_user_id_from_email(self.USER_E_EMAIL)
        self.signup(self.USER_SUBMITTER_EMAIL, self.USER_SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.USER_SUBMITTER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_c_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_d_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_2, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_3, self.user_e_id, end_state_name='End')
        user_e_settings = user_services.get_user_settings(self.user_e_id)
        user_e_settings.last_created_an_exploration = (
            user_e_settings.last_created_an_exploration -
            datetime.timedelta(days=10))
        # Last edited time also changes when user creates an explorationan.
        user_e_settings.last_edited_an_exploration = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        user_e_settings.last_logged_in = (
            user_e_settings.last_logged_in - datetime.timedelta(days=10))
        user_services._save_user_settings(user_e_settings) # pylint: disable=protected-access

        user_a_settings = user_services.get_user_settings(self.user_a_id)
        user_a_settings.last_logged_in = (
            user_a_settings.last_logged_in - datetime.timedelta(days=3))
        user_services._save_user_settings(user_a_settings) # pylint: disable=protected-access

        # Set tmpsuperadm1n as admin in ADMIN_USERNAMES config property.
        self.set_admins(['tmpsuperadm1n'])

    def test_user_has_not_logged_in_last_n_days(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, has_not_logged_in_for_n_days=6)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)

        # List of users who has not logged_in in last 6 days.
        qualifying_user_ids = [self.user_e_id]
        self.assertEqual(len(query.user_ids), 1)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

        query_id = user_query_services.save_new_query_model(
            self.submitter_id, has_not_logged_in_for_n_days=2)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)

        # List of users logged_in in last 2 days.
        qualifying_user_ids = (
            [self.user_a_id, self.user_e_id])
        self.assertEqual(len(query.user_ids), 2)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

        # Test for legacy user.
        user_settings = user_services.get_user_settings(self.user_a_id)
        user_settings.last_logged_in = None
        user_services._save_user_settings(user_settings) # pylint: disable=protected-access

        query_id = user_query_services.save_new_query_model(
            self.submitter_id, has_not_logged_in_for_n_days=6)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = ([self.user_a_id, self.user_e_id])

        # Make sure that legacy user is included in qualified user's list.
        self.assertEqual(len(query.user_ids), 2)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_is_inactive_in_last_n_days(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, inactive_in_last_n_days=3)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)

        # List of users who were not active in last 3 days.
        qualifying_user_ids = [self.user_e_id]
        self.assertEqual(len(query.user_ids), 1)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_created_at_least_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, created_at_least_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_b_id, self.user_d_id, self.user_e_id]
        self.assertEqual(len(query.user_ids), 3)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_created_fewer_than_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, created_fewer_than_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_a_id, self.user_c_id]
        self.assertEqual(len(query.user_ids), 2)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_edited_at_least_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, edited_at_least_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = (
            [self.user_b_id, self.user_c_id, self.user_d_id, self.user_e_id])
        self.assertEqual(len(query.user_ids), 4)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_edited_fewer_than_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, edited_fewer_than_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_a_id]
        self.assertEqual(len(query.user_ids), 1)
        self.assertEqual(query.user_ids, qualifying_user_ids)

    def test_combination_of_query_params(self):
        query_a_id = user_query_services.save_new_query_model(
            self.submitter_id, created_at_least_n_exps=1)
        self._run_one_off_job(query_a_id)

        query_b_id = user_query_services.save_new_query_model(
            self.submitter_id, edited_at_least_n_exps=1)
        self._run_one_off_job(query_b_id)

        query_combined_id = user_query_services.save_new_query_model(
            self.submitter_id, created_at_least_n_exps=1,
            edited_at_least_n_exps=1)
        self._run_one_off_job(query_combined_id)

        qualifying_user_ids_a = [self.user_b_id, self.user_d_id, self.user_e_id]
        qualifying_user_ids_b = (
            [self.user_b_id, self.user_c_id, self.user_d_id, self.user_e_id])
        qualifying_user_ids_combined = (
            [self.user_b_id, self.user_d_id, self.user_e_id])

        query_a = user_models.UserQueryModel.get(query_a_id)
        query_b = user_models.UserQueryModel.get(query_b_id)
        query_combined = user_models.UserQueryModel.get(query_combined_id)

        self.assertEqual(len(query_a.user_ids), 3)
        self.assertEqual(
            sorted(query_a.user_ids), sorted(qualifying_user_ids_a))

        self.assertEqual(len(query_b.user_ids), 4)
        self.assertEqual(
            sorted(query_b.user_ids), sorted(qualifying_user_ids_b))

        self.assertEqual(len(query_combined.user_ids), 3)
        self.assertEqual(
            sorted(query_combined.user_ids),
            sorted(qualifying_user_ids_combined))

    def test_that_correct_email_is_sent_upon_completion(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, edited_fewer_than_n_exps=1)

        self._run_one_off_job(query_id)
        query = user_models.UserQueryModel.get(query_id)
        self.assertEqual(
            query.query_status, feconf.USER_QUERY_STATUS_COMPLETED)

        expected_email_html_body = (
            'Hi submit,<br>'
            'Your query with id %s has succesfully completed its '
            'execution. Visit the result page '
            '<a href="https://www.oppia.org/emaildashboardresult/%s">'
            'here</a> '
            'to see result of your query.<br><br>'
            'Thanks!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.'
        ) % (query_id, query_id)

        expected_email_text_body = (
            'Hi submit,\n'
            'Your query with id %s has succesfully completed its '
            'execution. Visit the result page here '
            'to see result of your query.\n\n'
            'Thanks!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the '
            'Preferences page.'
        ) % query_id

        messages = self.mail_stub.get_sent_messages(
            to=self.USER_SUBMITTER_EMAIL)
        self.assertEqual(
            messages[0].html.decode(), expected_email_html_body)
        self.assertEqual(
            messages[0].body.decode(), expected_email_text_body)
