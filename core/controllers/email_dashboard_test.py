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
from core.domain import user_query_jobs_one_off
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

    def setUp(self):
        super(EmailDashboardDataHandlerTests, self).setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.SUBMITTER_EMAIL)
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(
            self.USER_A_EMAIL)
        self.set_admins([self.SUBMITTER_USERNAME])

    def test_that_handler_works_correctly(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': 2,
                    'inactive_in_last_n_days': 5,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': 2
                }}, csrf_token=csrf_token)
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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

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
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

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
                    'fake_key': 2
                }}, csrf_token=csrf_token, expected_status_int=400)

        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': 2,
                    'inactive_in_last_n_days': 5,
                    'created_at_least_n_exps': 'invalid_value',
                    'created_fewer_than_n_exps': 'None',
                    'edited_at_least_n_exps': None
                }}, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_email_dashboard_page(self):
        self.login(self.SUBMITTER_EMAIL)

        response = self.get_html_response('/emaildashboard')
        self.assertIn('{"title": "Email Dashboard - Oppia"})', response.body)

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
            '{"title": "Email Dashboard Result - Oppia"})', response.body)

        self.logout()

    def test_handler_with_invalid_num_queries_to_fetch_raises_error_400(self):
        self.login(self.SUBMITTER_EMAIL)

        response = self.get_json(
            '/emaildashboarddatahandler',
            params={'num_queries_to_fetch': '-5'},
            expected_status_int=400)
        self.assertEqual(
            response['error'], '400 Invalid input for query results.')

        response = self.get_json(
            '/emaildashboarddatahandler',
            params={'num_queries_to_fetch': 'invalid_data'},
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
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

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

    def test_email_dashboard_result_page_with_invalid_query_id_raises_400(self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params={'query_id': user_query_id})

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            1)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/emaildashboardresult/%s' % 'invalid_query_id', {},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(response['error'], '400 Invalid query id.')
        self.logout()

    def test_email_dashboard_result_page_with_mismatch_of_query_id_raises_401(
            self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_1_id = user_query_services.save_new_user_query(
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        user_query_2_id = user_query_services.save_new_user_query(
            self.new_submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        job_id_1 = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id_1, additional_job_params={'query_id': user_query_1_id})

        job_id_2 = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id_2, additional_job_params={'query_id': user_query_2_id})

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            2)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

        csrf_token = self.get_new_csrf_token()

        # Raises authorization error when passing a query id whose associated
        # query model is not created by the logged in user.
        response = self.post_json(
            '/emaildashboardresult/%s' % user_query_2_id, {},
            csrf_token=csrf_token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            '%s is not an authorized user for this query.'
            % (self.submitter_id))
        self.logout()

    def test_cancel_email_handler_with_invalid_query_id_raises_400(self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params={'query_id': user_query_id})

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            1)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/emaildashboardcancelresult/%s' % 'invalid_query_id', {},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(response['error'], '400 Invalid query id.')
        self.logout()

    def test_cancel_email_handler_with_mismatch_of_query_id_raises_401(self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_1_id = user_query_services.save_new_user_query(
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        user_query_2_id = user_query_services.save_new_user_query(
            self.new_submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        job_id_1 = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id_1, additional_job_params={'query_id': user_query_1_id})

        job_id_2 = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id_2, additional_job_params={'query_id': user_query_2_id})

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            2)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

        csrf_token = self.get_new_csrf_token()
        # Raises authorization error when passing a query id whose associated
        # query model is not created by the logged in user.
        response = self.post_json(
            '/emaildashboardcancelresult/%s' % user_query_2_id, {},
            csrf_token=csrf_token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            '%s is not an authorized user for this query.'
            % (self.submitter_id))
        self.logout()

    def test_bulk_email_handler_with_invalid_query_id_raises_400(self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_id = user_query_services.save_new_user_query(
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params={'query_id': user_query_id})

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            1)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/emaildashboardtestbulkemailhandler/%s' % 'invalid_query_id', {},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(response['error'], '400 Invalid query id.')
        self.logout()

    def test_bulk_email_handler_with_mismatch_of_query_id_raises_401(self):
        self.login(self.SUBMITTER_EMAIL)

        user_query_1_id = user_query_services.save_new_user_query(
            self.submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        user_query_2_id = user_query_services.save_new_user_query(
            self.new_submitter_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        job_id_1 = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id_1, additional_job_params={'query_id': user_query_1_id})

        job_id_2 = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id_2, additional_job_params={'query_id': user_query_2_id})

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            2)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS),
            0)

        csrf_token = self.get_new_csrf_token()

        # Raises authorization error when passing a query id whose associated
        # query model is not created by the logged in user.
        response = self.post_json(
            '/emaildashboardtestbulkemailhandler/%s' % user_query_2_id, {},
            csrf_token=csrf_token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            '%s is not an authorized user for this query.'
            % (self.submitter_id))
        self.logout()

    def test_that_correct_emails_are_sent_to_all_users(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': None,
                    'inactive_in_last_n_days': None,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': None
                }}, csrf_token=csrf_token)
        self.logout()

        query_models = user_models.UserQueryModel.query().fetch()
        # Check that model is stored.
        self.assertEqual(len(query_models), 1)
        query_model = query_models[0]

        # Check that MR job has been enqueued.
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()
            # Check that qualified users are valid.
            query_models = user_models.UserQueryModel.query().fetch()
            self.assertEqual(len(query_models[0].user_ids), 2)
            self.assertEqual(
                sorted(query_models[0].user_ids),
                sorted([self.user_a_id, self.user_b_id]))

            # Check that query completion email is sent to submitter.
            messages = self._get_sent_email_messages(
                self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)

            # Send email from email dashboard result page.
            self.login(self.SUBMITTER_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardresult/%s' % query_model.id, {
                    'data': {
                        'email_subject': 'subject',
                        'email_body': 'body',
                        'max_recipients': None,
                        'email_intent': 'bulk_email_marketing'
                    }}, csrf_token=csrf_token)
            self.logout()

            # Check that emails are sent to qualified users.
            messages_a = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages_a), 1)
            self.assertEqual(
                messages_a[0].html.decode(), 'body')
            self.assertEqual(
                messages_a[0].body.decode(), 'body')

            messages_b = self._get_sent_email_messages(
                self.USER_B_EMAIL)
            self.assertEqual(len(messages_b), 1)
            self.assertEqual(
                messages_b[0].html.decode(), 'body')
            self.assertEqual(
                messages_b[0].body.decode(), 'body')

            # Check that correct email model is stored in backend.
            query_models = user_models.UserQueryModel.query().fetch()
            sent_email_model = email_models.BulkEmailModel.get(
                query_models[0].sent_email_model_id)
            self.assertEqual(
                sent_email_model.subject, 'subject')
            self.assertEqual(
                sent_email_model.html_body, 'body')
            self.assertEqual(
                sorted(sent_email_model.recipient_ids),
                sorted([self.user_a_id, self.user_b_id]))
            self.assertEqual(
                sent_email_model.sender_id, self.submitter_id)
            self.assertEqual(
                sent_email_model.sender_email,
                '%s <%s>' % (self.SUBMITTER_USERNAME, self.SUBMITTER_EMAIL))
            self.assertEqual(
                sent_email_model.intent,
                feconf.BULK_EMAIL_INTENT_MARKETING)

            # Check that BulkEmailModel id is stored in UsetBulkEmailModel of
            # recipients.
            recipient_a = user_models.UserBulkEmailsModel.get(self.user_a_id)
            self.assertEqual(
                recipient_a.sent_email_model_ids,
                [query_models[0].sent_email_model_id])
            recipient_b = user_models.UserBulkEmailsModel.get(self.user_b_id)
            self.assertEqual(
                recipient_b.sent_email_model_ids,
                [query_models[0].sent_email_model_id])

    def test_that_valid_exceptions_are_raised(self):
        # Check that exception is raised for incorrect query id.
        self.login(self.SUBMITTER_EMAIL)
        with self.assertRaisesRegexp(Exception, '400 Bad Request'):
            self.get_html_response('/emaildashboardresult/%s' % 'q123')

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': None,
                    'inactive_in_last_n_days': None,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': None
                }}, csrf_token=csrf_token)
        query_models = user_models.UserQueryModel.query().fetch()

        # Check that exception is raised if query is still processing.
        self.assertEqual(
            query_models[0].query_status, feconf.USER_QUERY_STATUS_PROCESSING)
        with self.assertRaisesRegexp(Exception, '400 Bad Request'):
            self.get_html_response(
                '/emaildashboardresult/%s' % query_models[0].id)
        self.logout()

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        # Complete execution of query.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()
            query_models = user_models.UserQueryModel.query().fetch()
            self.assertEqual(
                query_models[0].query_status,
                feconf.USER_QUERY_STATUS_COMPLETED)

        # Check that exception is raised for unauthorized user.
        self.login(self.USER_A_EMAIL)
        with self.assertRaisesRegexp(Exception, '401 Unauthorized'):
            self.get_html_response(
                '/emaildashboardresult/%s' % query_models[0].id)
        self.logout()

        # Check that exception is raised if current user is not submitter of
        # that query.
        self.login(self.NEW_SUBMITTER_EMAIL)
        with self.assertRaisesRegexp(Exception, '401 Unauthorized'):
            self.get_html_response(
                '/emaildashboardresult/%s' % query_models[0].id)
        self.logout()

        # Check that exception is raised for accessing query result after
        # query result has been used.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            # Send email from email dashboard result page.
            self.login(self.SUBMITTER_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardresult/%s' % query_models[0].id, {
                    'data': {
                        'email_subject': 'subject',
                        'email_body': 'body',
                        'max_recipients': 1,
                        'email_intent': 'bulk_email_marketing'
                    }}, csrf_token=csrf_token)
            self.logout()

        query_models = user_models.UserQueryModel.query().fetch()
        self.assertEqual(
            query_models[0].query_status, feconf.USER_QUERY_STATUS_ARCHIVED)
        self.assertTrue(query_models[0].deleted)
        self.login(self.SUBMITTER_EMAIL)
        with self.assertRaisesRegexp(Exception, '400 Bad Request'):
            self.get_html_response(
                '/emaildashboardresult/%s' % query_models[0].id)
        self.logout()

    def test_that_correct_emails_are_sent_to_max_n_recipients(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': None,
                    'inactive_in_last_n_days': None,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': None
                }}, csrf_token=csrf_token)
        self.logout()

        query_models = user_models.UserQueryModel.query().fetch()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()
            # Check that qualified users are valid.
            query_models = user_models.UserQueryModel.query().fetch()
            self.assertEqual(len(query_models[0].user_ids), 2)

            # Send email from email dashboard result page.
            self.login(self.SUBMITTER_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardresult/%s' % query_models[0].id, {
                    'data': {
                        'email_subject': 'subject',
                        'email_body': 'body',
                        'max_recipients': 1,
                        'email_intent': 'bulk_email_marketing'
                    }}, csrf_token=csrf_token)
            self.logout()

            # Check that emails are sent to max n qualified users.
            # One email is sent to submitter for query completion and second
            # is sent to one of the 2 qualified users.
            messages = self._get_sent_email_messages(
                self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].to, [self.SUBMITTER_EMAIL])
            messages_a = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            messages_b = self._get_sent_email_messages(
                self.USER_B_EMAIL)
            self.assertEqual(sorted([len(messages_a), len(messages_b)]), [0, 1])

    def test_that_no_emails_are_sent_if_query_is_canceled(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': None,
                    'inactive_in_last_n_days': None,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': None
                }}, csrf_token=csrf_token)
        self.logout()

        query_models = user_models.UserQueryModel.query().fetch()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()
            # Check that qualified users are valid.
            query_models = user_models.UserQueryModel.query().fetch()
            self.assertEqual(len(query_models[0].user_ids), 2)

            # Send email from email dashboard result page.
            self.login(self.SUBMITTER_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardcancelresult/%s' % query_models[0].id, {},
                csrf_token=csrf_token)
            self.logout()

            query_models = user_models.UserQueryModel.query().fetch()
            self.assertEqual(
                query_models[0].query_status, feconf.USER_QUERY_STATUS_ARCHIVED)
            self.assertTrue(query_models[0].deleted)

            # Check that no email is sent to qualified users.
            messages_a = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages_a), 0)
            messages_b = self._get_sent_email_messages(
                self.USER_B_EMAIL)
            self.assertEqual(len(messages_b), 0)

    def test_that_test_email_for_bulk_emails_is_sent(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': None,
                    'inactive_in_last_n_days': None,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': None
                }}, csrf_token=csrf_token)
        self.logout()

        query_models = user_models.UserQueryModel.query().fetch()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

            email_subject = 'email_subject'
            email_body = 'email_body'

            # Check that correct test email is sent.
            self.login(self.SUBMITTER_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardtestbulkemailhandler/%s' % query_models[0].id, {
                    'email_body': email_body,
                    'email_subject': email_subject
                }, csrf_token=csrf_token)
            self.logout()

            # Check that correct test email is sent to submitter of query.
            # One email is sent when query is completed and other is test email.
            test_email_html_body = (
                '[This is a test email.]<br><br> %s' % email_body)
            test_email_text_body = '[This is a test email.]\n\n %s' % email_body

            messages = self._get_sent_email_messages(
                self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 2)
            self.assertEqual(
                messages[1].html.decode(), test_email_html_body)
            self.assertEqual(
                messages[1].body.decode(), test_email_text_body)

            all_model = email_models.SentEmailModel.query().fetch()
            self.assertEqual(len(all_model), 2)

            sent_email_model = all_model[0]
            self.assertEqual(
                sent_email_model.subject, email_subject)
            self.assertEqual(
                sent_email_model.html_body, test_email_html_body)
            self.assertEqual(
                sent_email_model.recipient_id, query_models[0].submitter_id)
            self.assertEqual(
                sent_email_model.sender_id, query_models[0].submitter_id)
            self.assertEqual(
                sent_email_model.intent, feconf.BULK_EMAIL_INTENT_TEST)

    def test_that_test_email_is_not_sent_to_query_recipients(self):
        self.login(self.SUBMITTER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': None,
                    'inactive_in_last_n_days': None,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'edited_fewer_than_n_exps': None
                }}, csrf_token=csrf_token)
        self.logout()

        query_models = user_models.UserQueryModel.query().fetch()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            self.process_and_flush_pending_mapreduce_tasks()

            self.login(self.SUBMITTER_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardtestbulkemailhandler/%s' % query_models[0].id, {
                    'email_body': 'email_body',
                    'email_subject': 'email_subject'
                }, csrf_token=csrf_token)
            self.logout()

            # Check that test email is sent to submitter of query.
            # One email is sent when query is completed and other is test email.
            messages = self._get_sent_email_messages(
                self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 2)

            # Check that no emails are sent to query recipients.
            query_models = user_models.UserQueryModel.query().fetch()
            query_model = query_models[0]
            self.assertEqual(len(query_model.user_ids), 2)
            self.assertEqual(
                sorted(query_model.user_ids),
                sorted([self.user_a_id, self.user_b_id]))
            # Check that no emails are sent to user A or user B.
            messages_a = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages_a), 0)
            messages_b = self._get_sent_email_messages(
                self.USER_B_EMAIL)
            self.assertEqual(len(messages_b), 0)
