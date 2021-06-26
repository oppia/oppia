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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import taskqueue_services
from core.domain import user_query_jobs_one_off
from core.domain import user_query_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserQueryJobOneOffTests(test_utils.EmailTestBase):
    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    EXP_ID_3 = 'exp_id_3'
    EXP_ID_4 = 'exp_id_4'
    COLLECTION_ID_1 = 'collection_id_1'
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
    USER_F_EMAIL = 'f@example.com'
    USER_F_USERNAME = 'f'
    USER_G_EMAIL = 'g@example.com'
    USER_G_USERNAME = 'g'
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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

    def _run_one_off_job_resulting_in_failure(self, query_id):
        """Runs the one-off MapReduce job and fails it. After failing the job,
        a failure email is sent to the initiator of the query. To achieve this,
        we need to turn feconf.CAN_SEND_EMAILS True.
        """
        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        params = {
            'query_id': query_id,
        }
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params=params)
        user_query_jobs_one_off.UserQueryOneOffJob.register_start(job_id)

        # This swap is required so that query failure email can be sent.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_jobs_one_off.UserQueryOneOffJob.register_failure(
                job_id, 'error')

    def setUp(self):
        super(UserQueryJobOneOffTests, self).setUp()
        # User A has no created or edited explorations.
        # User B has one created exploration.
        # User C has one edited exploration.
        # User D has created an exploration and a collection and then edited
        # the exploration.
        # User E has created an exploration with logic proof interaction
        # 10 days before.
        # User F has one created exploration but is not subscribed to emails.
        # Submitter is the user who submits the query.
        # User G has no user contribution model.
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        user_services.update_email_preferences(
            self.user_a_id, True, True, True, True)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        user_services.update_email_preferences(
            self.user_b_id, True, True, True, True)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        user_services.update_email_preferences(
            self.user_c_id, True, True, True, True)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)
        user_services.update_email_preferences(
            self.user_d_id, True, True, True, True)
        self.signup(self.USER_E_EMAIL, self.USER_E_USERNAME)
        self.user_e_id = self.get_user_id_from_email(self.USER_E_EMAIL)
        user_services.update_email_preferences(
            self.user_e_id, True, True, True, True)
        self.signup(self.USER_F_EMAIL, self.USER_F_USERNAME)
        self.user_f_id = self.get_user_id_from_email(self.USER_F_EMAIL)
        user_services.update_email_preferences(
            self.user_f_id, False, True, True, True)
        self.signup(self.USER_G_EMAIL, self.USER_G_USERNAME)
        self.user_g_id = self.get_user_id_from_email(self.USER_G_EMAIL)
        user_services.update_email_preferences(
            self.user_g_id, True, True, True, True)
        self.signup(self.USER_SUBMITTER_EMAIL, self.USER_SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.USER_SUBMITTER_EMAIL)
        user_services.update_email_preferences(
            self.submitter_id, True, True, True, True)

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
        user_d_settings = user_services.get_user_settings(self.user_d_id)
        user_d_settings.last_edited_an_exploration = (
            datetime.datetime.utcnow() - datetime.timedelta(days=2))
        self.save_new_valid_collection(
            self.COLLECTION_ID_1, self.user_d_id, exploration_id=self.EXP_ID_1)

        self.save_new_valid_exploration(
            self.EXP_ID_3, self.user_e_id, end_state_name='End',
            interaction_id='LogicProof')
        user_e_settings = user_services.get_user_settings(self.user_e_id)
        user_e_settings.last_created_an_exploration = (
            user_e_settings.last_created_an_exploration -
            datetime.timedelta(days=10))
        # Last edited time also changes when user creates an exploration.
        user_e_settings.last_edited_an_exploration = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        user_services.update_last_logged_in(
            user_e_settings,
            user_e_settings.last_logged_in - datetime.timedelta(days=10))

        self.save_new_valid_exploration(
            self.EXP_ID_4, self.user_f_id, end_state_name='End')

        user_a_settings = user_services.get_user_settings(self.user_a_id)
        user_services.update_last_logged_in(
            user_a_settings,
            user_a_settings.last_logged_in - datetime.timedelta(days=3))

        user_contribution_model = user_models.UserContributionsModel.get(
            self.user_g_id)
        user_contribution_model.delete()

        # Set tmpsuperadm1n as admin in ADMIN_USERNAMES config property.
        self.set_admins(['tmpsuperadm1n'])

    def test_predicate_functions(self):
        predicates = constants.EMAIL_DASHBOARD_PREDICATE_DEFINITION
        job_class = user_query_jobs_one_off.UserQueryOneOffJob
        for predicate in predicates:
            predicate_function = getattr(
                job_class, '_is_%s_query_satisfied' % predicate['backend_id'])
            self.assertIsNotNone(predicate_function)

    def test_that_user_without_user_contribution_model_is_skipped(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'used_logic_proof_interaction': True,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertNotIn(self.user_g_id, query.user_ids)

    def test_user_has_not_logged_in_last_n_days(self):
        user_query_1_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'has_not_logged_in_for_n_days': 6,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_1_id)

        query_1 = user_models.UserQueryModel.get(user_query_1_id)

        # List of users who has not logged_in in last 6 days.
        self.assertItemsEqual(query_1.user_ids, [self.user_e_id])

        user_query_2_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'has_not_logged_in_for_n_days': 2,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_2_id)

        query_2 = user_models.UserQueryModel.get(user_query_2_id)

        # List of users logged_in in last 2 days.
        qualifying_user_ids = [self.user_a_id, self.user_e_id]
        self.assertItemsEqual(query_2.user_ids, qualifying_user_ids)

        # Test for legacy user.
        user_settings = user_services.get_user_settings(self.user_a_id)
        user_services.update_last_logged_in(user_settings, None)

        user_query_3_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'has_not_logged_in_for_n_days': 6,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_3_id)

        query = user_models.UserQueryModel.get(user_query_3_id)

        # Make sure that legacy user is included in qualified user's list.
        self.assertItemsEqual(query.user_ids, [self.user_a_id, self.user_e_id])

    def test_user_is_inactive_in_last_n_days(self):
        number_of_days = 3
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'inactive_in_last_n_days': number_of_days,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)

        # user_d has created an exploration 10 days ago but edited an
        # exploration 2 days ago.
        self.assertNotIn(self.user_d_id, query.user_ids)
        # List of users who were not active in last 3 days.
        self.assertItemsEqual(query.user_ids, [self.user_e_id])

    def test_user_has_created_at_least_n_exps(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'created_at_least_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertItemsEqual(
            query.user_ids, [self.user_b_id, self.user_d_id, self.user_e_id])

    def test_user_has_created_fewer_than_n_exps(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'created_fewer_than_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertItemsEqual(query.user_ids, [self.user_a_id, self.user_c_id])

    def test_user_has_edited_at_least_n_exps(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'edited_at_least_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        qualifying_user_ids = [
            self.user_b_id, self.user_c_id, self.user_d_id, self.user_e_id]
        self.assertItemsEqual(query.user_ids, qualifying_user_ids)

    def test_user_has_edited_fewer_than_n_exps(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'edited_fewer_than_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertItemsEqual(query.user_ids, [self.user_a_id])

    def test_user_has_created_collection(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'created_collection': True,
                'used_logic_proof_interaction': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertItemsEqual(query.user_ids, [self.user_d_id])

    def test_user_has_used_logic_proof_interaction(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'used_logic_proof_interaction': True,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertItemsEqual(query.user_ids, [self.user_e_id])

    def test_combination_of_query_params(self):
        user_query_1_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'created_at_least_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_1_id)

        user_query_2_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'edited_at_least_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_2_id)

        user_query_3_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'created_at_least_n_exps': 1,
                'edited_at_least_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False,
            })
        self._run_one_off_job(user_query_3_id)

        qualifying_user_ids_a = [self.user_b_id, self.user_d_id, self.user_e_id]
        qualifying_user_ids_b = (
            [self.user_b_id, self.user_c_id, self.user_d_id, self.user_e_id])
        qualifying_user_ids_combined = (
            [self.user_b_id, self.user_d_id, self.user_e_id])

        query_1 = user_models.UserQueryModel.get(user_query_1_id)
        query_2 = user_models.UserQueryModel.get(user_query_2_id)
        query_combined = user_models.UserQueryModel.get(user_query_3_id)

        self.assertEqual(len(query_1.user_ids), 3)
        self.assertEqual(
            sorted(query_1.user_ids), sorted(qualifying_user_ids_a))

        self.assertEqual(len(query_2.user_ids), 4)
        self.assertEqual(
            sorted(query_2.user_ids), sorted(qualifying_user_ids_b))

        self.assertEqual(len(query_combined.user_ids), 3)
        self.assertEqual(
            sorted(query_combined.user_ids),
            sorted(qualifying_user_ids_combined))

    def test_that_correct_email_is_sent_upon_completion(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'edited_fewer_than_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })

        self._run_one_off_job(user_query_id)
        query = user_models.UserQueryModel.get(user_query_id)
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.'
        ) % (user_query_id, user_query_id)

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
        ) % user_query_id

        messages = self._get_sent_email_messages(
            self.USER_SUBMITTER_EMAIL)
        self.assertEqual(
            messages[0].html.decode(), expected_email_html_body)
        self.assertEqual(
            messages[0].body.decode(), expected_email_text_body)

    def test_that_correct_email_is_sent_upon_failure(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'edited_fewer_than_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })

        self._run_one_off_job_resulting_in_failure(user_query_id)
        query = user_models.UserQueryModel.get(user_query_id)

        self.assertEqual(
            query.query_status, feconf.USER_QUERY_STATUS_FAILED)

        expected_email_html_body = (
            'Hi submit,<br>'
            'Your query with id %s has failed due to error '
            'during execution. '
            'Please check the query parameters and submit query again.<br><br>'
            'Thanks!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.'
        ) % user_query_id

        expected_email_text_body = (
            'Hi submit,\n'
            'Your query with id %s has failed due to error '
            'during execution. '
            'Please check the query parameters and submit query again.\n\n'
            'Thanks!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.'
        ) % user_query_id

        messages = self._get_sent_email_messages(
            self.USER_SUBMITTER_EMAIL)
        self.assertEqual(
            messages[0].html.decode(), expected_email_html_body)
        self.assertEqual(
            messages[0].body.decode(), expected_email_text_body)

    def test_that_user_unsubscribed_from_emails_is_skipped(self):
        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, {
                'created_at_least_n_exps': 1,
                'used_logic_proof_interaction': False,
                'created_collection': False
            })
        self._run_one_off_job(user_query_id)

        query = user_models.UserQueryModel.get(user_query_id)
        self.assertNotIn(self.user_f_id, query.user_ids)
