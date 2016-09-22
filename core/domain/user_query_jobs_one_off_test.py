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

from core.domain import exp_services
from core.domain import user_query_jobs_one_off
from core.domain import user_query_services
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])
taskqueue_services = models.Registry.import_taskqueue_services()


class UserQueryJobOneOffTests(test_utils.GenericTestBase):
    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
    USER_D_EMAIL = 'd@example.com'
    USER_D_USERNAME = 'd'
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
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT), 1)
        self.process_and_flush_pending_tasks()

    def setUp(self):
        super(UserQueryJobOneOffTests, self).setUp()
        # User A has no created or edited explorations
        # User B has one created exploration
        # User C has one edited exploration
        # User D has created an exploration and then edited it.
        # (This is used to check that there are no duplicate
        # entries in the contribution lists.)
        # Submitter is the user who submits the query.
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)
        self.signup(self.USER_SUBMITTER_EMAIL, self.USER_SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.USER_SUBMITTER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(self.user_c_id, self.EXP_ID_1, [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_d_id, end_state_name='End')

        exp_services.update_exploration(self.user_d_id, self.EXP_ID_2, [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }], 'Test edit')

        # set tmpsuperadm1n as admin in ADMIN_USERNAMES config property.
        self.set_admins(['tmpsuperadm1n'])

    def test_user_is_active_in_last_n_days(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, active_in_last_n_days=3)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_b_id, self.user_c_id, self.user_d_id]
        self.assertEqual(len(query.user_ids), 3)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_created_more_than_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, created_more_than_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_b_id, self.user_d_id]
        self.assertEqual(len(query.user_ids), 2)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_created_fewer_than_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, created_fewer_than_n_exps=0)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_a_id, self.user_c_id]
        #self.assertEqual(len(query.user_ids), 2)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_edited_more_than_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, edited_more_than_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_b_id, self.user_c_id, self.user_d_id]
        self.assertEqual(len(query.user_ids), 3)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_user_has_edited_fewer_than_n_exps(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, edited_fewer_than_n_exps=0)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = [self.user_a_id]
        self.assertEqual(len(query.user_ids), 1)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))

    def test_combination_of_query_params(self):
        query_id = user_query_services.save_new_query_model(
            self.submitter_id, created_fewer_than_n_exps=3,
            edited_fewer_than_n_exps=1)
        self._run_one_off_job(query_id)

        query = user_models.UserQueryModel.get(query_id)
        qualifying_user_ids = (
            [self.user_a_id, self.user_b_id, self.user_c_id, self.user_d_id])
        self.assertEqual(len(query.user_ids), 4)
        self.assertEqual(sorted(query.user_ids), sorted(qualifying_user_ids))
