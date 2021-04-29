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

"""Tests for email dashboard handler."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import taskqueue_services
from core.domain import user_query_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models, email_models) = models.Registry.import_models(
    [models.NAMES.user, models.NAMES.email])


class EmailDashboardDataHandlerTests(test_utils.GenericTestBase):

    SUBMITTER_EMAIL = 'submit@example.com'
    SUBMITTER_USERNAME = 'submit'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    SAMPLE_QUERY_PARAM = {
        'inactive_in_last_n_days': 10,
        'created_at_least_n_exps': 5,
        'has_not_logged_in_for_n_days': 30
    }

    def setUp(self):
        super(EmailDashboardDataHandlerTests, self).setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.SUBMITTER_EMAIL)
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(
            self.USER_A_EMAIL)
        self.set_admins([self.SUBMITTER_USERNAME])

    def test_query_status_check_handler_with_invalid_query_id_raises_400(
            self):
        self.login(self.SUBMITTER_EMAIL)

        response = self.get_json(
            '/querystatuscheck', params={'query_id': 'invalid_query_id'},
            expected_status_int=400)
        self.assertEqual(response['error'], 'Invalid query id.')

        self.logout()

    def test_query_status_check_handler(self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, self.SAMPLE_QUERY_PARAM)

        query_data = self.get_json(
            '/querystatuscheck', params={'query_id': user_query_id})['query']

        self.assertEqual(query_data['id'], user_query_id)
        self.assertEqual(
            query_data['status'], feconf.USER_QUERY_STATUS_PROCESSING)
        self.assertEqual(
            query_data['submitter_username'], self.SUBMITTER_USERNAME)
        self.assertNotIn('submitter_id', query_data)

        self.logout()

    def test_that_page_is_accessible_to_authorised_users_only(self):
        # Make sure that only authorised users can access query pages.
        self.login(self.USER_A_EMAIL)
        with self.assertRaisesRegexp(Exception, '401 Unauthorized'):
            self.get_html_response('/emaildashboard')
        with self.assertRaisesRegexp(Exception, '401 Unauthorized'):
            self.get_html_response('/querystatuscheck')
        self.logout()

    def test_that_exception_is_raised_for_invalid_input(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': 2,
                    'inactive_in_last_n_days': 5,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': 'None',
                    'edited_at_least_n_exps': None,
                    'created_collection': True,
                    'used_logic_proof_interaction': False,
                    'fake_key': 2
                }}, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_email_dashboard_page(self):
        self.login(self.SUBMITTER_EMAIL)

        response = self.get_html_response('/emaildashboard')
        self.assertIn(b'{"title": "Email Dashboard - Oppia"})', response.body)

        self.logout()


class EmailDashboardResultTests(test_utils.EmailTestBase):
    """Tests for email dashboard result handler."""

    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    SUBMITTER_EMAIL = 'submi@example.com'
    SUBMITTER_USERNAME = 'submit'
    NEW_SUBMITTER_EMAIL = 'new_submi@example.com'
    NEW_SUBMITTER_USERNAME = 'submit2'
    EXP_ID_1 = 'exp_1'
    EXP_ID_2 = 'exp_2'
    SAMPLE_QUERY_PARAM = {
        'inactive_in_last_n_days': 10,
        'created_at_least_n_exps': 5,
        'has_not_logged_in_for_n_days': 30
    }

    def setUp(self):
        super(EmailDashboardResultTests, self).setUp()
        # User A has one created exploration.
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(
            self.USER_A_EMAIL)
        user_services.update_email_preferences(
            self.user_a_id, True, True, True, True)
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_a_id, end_state_name='End')
        # User B has one created exploration.
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(
            self.USER_B_EMAIL)
        user_services.update_email_preferences(
            self.user_b_id, True, True, True, True)
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_b_id, end_state_name='End')

        # Submitter and new_submitter are submitter of query.
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.SUBMITTER_EMAIL)
        self.signup(self.NEW_SUBMITTER_EMAIL, self.NEW_SUBMITTER_USERNAME)
        self.new_submitter_id = self.get_user_id_from_email(
            self.NEW_SUBMITTER_EMAIL)
        self.set_admins(
            [self.SUBMITTER_USERNAME, self.NEW_SUBMITTER_USERNAME])

    def test_email_dashboard_result_page(self):
        self.login(self.SUBMITTER_EMAIL)

        query_id = user_models.UserQueryModel.get_new_id('')
        user_models.UserQueryModel(
            id=query_id, inactive_in_last_n_days=10,
            has_not_logged_in_for_n_days=30,
            created_at_least_n_exps=5,
            created_fewer_than_n_exps=None,
            edited_at_least_n_exps=None,
            edited_fewer_than_n_exps=None,
            submitter_id=self.submitter_id,
            query_status=feconf.USER_QUERY_STATUS_COMPLETED,
            user_ids=[]).put()
        response = self.get_html_response('/emaildashboardresult/%s' % query_id)

        self.assertIn(
            b'{"title": "Email Dashboard Result - Oppia"})', response.body)

        self.logout()

    def test_handler_with_invalid_num_queries_to_fetch_raises_error_400(self):
        self.login(self.SUBMITTER_EMAIL)

        response = self.get_json(
            '/emaildashboarddatahandler',
            params={'invalid_param_key': '2'},
            expected_status_int=400)
        self.assertEqual(
            response['error'], '400 Invalid input for query results.')

        self.logout()

    def test_email_dashboard_data_handler(self):
        self.login(self.SUBMITTER_EMAIL)

        response = self.get_json(
            '/emaildashboarddatahandler',
            params={'num_queries_to_fetch': 1})
        self.assertEqual(response['recent_queries'], [])

        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, self.SAMPLE_QUERY_PARAM)

        response = self.get_json(
            '/emaildashboarddatahandler',
            params={'num_queries_to_fetch': 1})

        self.assertEqual(len(response['recent_queries']), 1)

        recent_query = response['recent_queries'][0]

        self.assertEqual(recent_query['id'], user_query_id)
        self.assertEqual(
            recent_query['status'], feconf.USER_QUERY_STATUS_PROCESSING)
        self.assertNotIn('submitter_id', recent_query)

        self.logout()
