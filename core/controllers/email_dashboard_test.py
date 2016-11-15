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

from core.domain import config_services
from core.platform import models
from core.tests import test_utils

import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])

taskqueue_services = models.Registry.import_taskqueue_services()


class EmailDashboardDataHandlerTests(test_utils.GenericTestBase):

    SUBMITTER_EMAIL = 'submit@example.com'
    SUBMITTER_USERNAME = 'submit'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    def setUp(self):
        super(EmailDashboardDataHandlerTests, self).setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.SUBMITTER_EMAIL)
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(
            self.USER_A_EMAIL)
        config_services.set_property(
            self.submitter_id, 'whitelisted_email_senders',
            [self.SUBMITTER_USERNAME])

    def test_that_handler_works_correctly(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/emaildashboard'))
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': 2,
                    'inactive_in_last_n_days': 5,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': 2
                }}, csrf_token)
        self.logout()

        query_models = user_models.UserQueryModel.query().fetch()

        # Check that model is stored.
        self.assertEqual(len(query_models), 1)
        query_model = query_models[0]

        # Check that correct information is stored in model.
        self.assertEqual(query_model.has_not_logged_in_for_n_days, 2)
        self.assertEqual(query_model.inactive_in_last_n_days, 5)
        self.assertEqual(query_model.created_at_least_n_exps, 1)
        self.assertEqual(query_model.edited_fewer_than_n_exps, 2)
        self.assertIsNone(query_model.edited_at_least_n_exps)
        self.assertIsNone(query_model.created_fewer_than_n_exps)
        self.assertEqual(query_model.submitter_id, self.submitter_id)

        # Check that MR job has been enqueued.
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT), 1)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_tasks()

    def test_that_page_is_accessible_to_authorised_users_only(self):
        # Make sure that only authorised users can access query pages.
        self.login(self.USER_A_EMAIL)
        with self.assertRaisesRegexp(Exception, '401 Unauthorized'):
            self.testapp.get('/emaildashboard')
        with self.assertRaisesRegexp(Exception, '401 Unauthorized'):
            self.testapp.get('/querystatuscheck')
        self.logout()

    def test_that_exception_is_raised_for_invalid_input(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/emaildashboard'))
        with self.assertRaisesRegexp(Exception, '400 Invalid input for query.'):
            self.post_json(
                '/emaildashboarddatahandler', {
                    'data': {
                        'has_not_logged_in_for_n_days': 2,
                        'inactive_in_last_n_days': 5,
                        'created_at_least_n_exps': 1,
                        'created_fewer_than_n_exps': None,
                        'edited_at_least_n_exps': None,
                        'fake_key': 2
                    }}, csrf_token)

        with self.assertRaisesRegexp(Exception, '400 Invalid input for query.'):
            self.post_json(
                '/emaildashboarddatahandler', {
                    'data': {
                        'has_not_logged_in_for_n_days': 2,
                        'inactive_in_last_n_days': 5,
                        'created_at_least_n_exps': 'invalid_value',
                        'created_fewer_than_n_exps': 'None',
                        'edited_at_least_n_exps': None
                    }}, csrf_token)
        self.logout()
