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

from __future__ import annotations

from core import feconf
from core.domain import user_query_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final, Sequence

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import email_models
    from mypy_imports import user_models

(user_models, email_models) = models.Registry.import_models(
    [models.Names.USER, models.Names.EMAIL])


class EmailDashboardDataHandlerTests(test_utils.GenericTestBase):

    SUBMITTER_EMAIL: Final = 'submit@example.com'
    SUBMITTER_USERNAME: Final = 'submit'
    USER_A_EMAIL: Final = 'a@example.com'
    USER_A_USERNAME: Final = 'a'
    SAMPLE_QUERY_PARAM: Final = {
        'inactive_in_last_n_days': 10,
        'created_at_least_n_exps': 5,
        'has_not_logged_in_for_n_days': 30
    }

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(
            self.SUBMITTER_EMAIL)
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(
            self.USER_A_EMAIL)
        self.set_curriculum_admins([self.SUBMITTER_USERNAME])

    def test_query_status_check_handler_with_invalid_query_id_raises_400(
        self
    ) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/querystatuscheck', params={'query_id': 'invalid_query_id'},
            expected_status_int=400)
        self.assertEqual(response['error'], 'Invalid query id.')

        self.logout()

    def test_query_status_check_handler(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

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

    def test_that_exception_is_raised_for_invalid_input(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)
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
                    'fake_key': 2
                }}, csrf_token=csrf_token, expected_status_int=400)

        self.logout()

    def test_starting_job(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/emaildashboarddatahandler', {
                'data': {
                    'has_not_logged_in_for_n_days': 2,
                    'inactive_in_last_n_days': 5,
                    'created_at_least_n_exps': 1,
                    'created_fewer_than_n_exps': None,
                    'edited_at_least_n_exps': None,
                    'created_collection': True,
                }}, csrf_token=csrf_token)

        self.logout()


class EmailDashboardResultTests(test_utils.EmailTestBase):
    """Tests for email dashboard result handler."""

    USER_A_EMAIL: Final = 'a@example.com'
    USER_A_USERNAME: Final = 'a'
    USER_B_EMAIL: Final = 'b@example.com'
    USER_B_USERNAME: Final = 'b'
    SUBMITTER_EMAIL: Final = 'submi@example.com'
    SUBMITTER_USERNAME: Final = 'submit'
    NEW_SUBMITTER_EMAIL: Final = 'new_submi@example.com'
    NEW_SUBMITTER_USERNAME: Final = 'submit2'
    EXP_ID_1: Final = 'exp_1'
    EXP_ID_2: Final = 'exp_2'
    SAMPLE_QUERY_PARAM: Final = {
        'inactive_in_last_n_days': 10,
        'created_at_least_n_exps': 5,
        'has_not_logged_in_for_n_days': 30
    }

    def setUp(self) -> None:
        super().setUp()
        # User A has one created exploration.
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, 'systemUser')
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
        self.set_curriculum_admins(
            [self.SUBMITTER_USERNAME, self.NEW_SUBMITTER_USERNAME])

    def test_email_dashboard_result_page(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

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

    def test_email_dashboard_result_page_with_invalid_query_id_raises_400(
        self
    ) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        response = self.get_html_response(
            '/emaildashboardresult/aaa', expected_status_int=400)
        self.assertIn(
            b'<oppia-error-page-root></oppia-error-page-root>', response.body)

        self.logout()

    def test_email_dashboard_result_page_with_invalid_user_raises_401(
        self
    ) -> None:
        self.login(self.NEW_SUBMITTER_EMAIL, is_super_admin=True)

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
            user_ids=[]
        ).put()

        response = self.get_html_response(
            '/emaildashboardresult/%s' % query_id, expected_status_int=401)
        self.assertIn(
            b'<oppia-error-page-root></oppia-error-page-root>', response.body)

        self.logout()

    def test_email_dashboard_result_post_passes(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        query_id = user_models.UserQueryModel.get_new_id('')
        query_model = user_models.UserQueryModel(
            id=query_id, inactive_in_last_n_days=10,
            has_not_logged_in_for_n_days=30,
            created_at_least_n_exps=5,
            created_fewer_than_n_exps=None,
            edited_at_least_n_exps=None,
            edited_fewer_than_n_exps=None,
            submitter_id=self.submitter_id,
            query_status=feconf.USER_QUERY_STATUS_COMPLETED,
            user_ids=[self.user_a_id, self.user_b_id]
        )
        query_model.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            # Send email from email dashboard result page.
            self.login(self.SUBMITTER_EMAIL, is_super_admin=True)
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardresult/%s' % query_id, {
                    'email_subject': 'subject',
                    'email_body': 'body',
                    'max_recipients': None,
                    'email_intent': 'bulk_email_create_exploration'
                }, csrf_token=csrf_token)
            self.logout()

            # Check that emails are sent to qualified users.
            messages_a = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages_a), 1)
            self.assertEqual(messages_a[0].html, 'body')
            self.assertEqual(messages_a[0].body, 'body')

            messages_b = self._get_sent_email_messages(
                self.USER_B_EMAIL)
            self.assertEqual(len(messages_b), 1)
            self.assertEqual(messages_b[0].html, 'body')
            self.assertEqual(messages_b[0].body, 'body')

            # Check that correct email model is stored in backend.
            query_model = user_models.UserQueryModel.get_by_id(query_id)
            sent_email_model = email_models.BulkEmailModel.get(
                query_model.sent_email_model_id)
            self.assertEqual(
                sent_email_model.subject, 'subject')
            self.assertEqual(
                sent_email_model.html_body, 'body')
            self.assertEqual(
                sent_email_model.sender_id, self.submitter_id)
            self.assertEqual(
                sent_email_model.sender_email,
                '%s <%s>' % (self.SUBMITTER_USERNAME, self.SUBMITTER_EMAIL))
            self.assertEqual(
                sent_email_model.intent,
                feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION)

            # Check that BulkEmailModel id is stored in UsetBulkEmailModel of
            # recipients.
            recipient_a = user_models.UserBulkEmailsModel.get(self.user_a_id)
            self.assertEqual(
                recipient_a.sent_email_model_ids,
                [query_model.sent_email_model_id])
            recipient_b = user_models.UserBulkEmailsModel.get(self.user_b_id)
            self.assertEqual(
                recipient_b.sent_email_model_ids,
                [query_model.sent_email_model_id])

    def test_email_dashboard_result_post_with_invalid_query_id_raises_400(
        self
    ) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        params = {
            'email_body': 'valid_email_body',
            'email_subject': 'valid_email_subject',
            'email_intent': 'bulk_email_create_exploration',
            'max_recipients': None
        }
        response = self.post_json(
            '/emaildashboardresult/%s' % 'invalid_query_id', params,
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(response['error'], '400 Invalid query id.')
        self.logout()

    def test_email_dashboard_result_post_with_invalid_user_raises_401(
        self
    ) -> None:
        self.login(self.NEW_SUBMITTER_EMAIL, is_super_admin=True)

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
            user_ids=[]
        ).put()

        csrf_token = self.get_new_csrf_token()
        params = {
            'email_body': 'valid_email_body',
            'email_subject': 'valid_email_subject',
            'email_intent': 'bulk_email_create_exploration',
            'max_recipients': None
        }
        response = self.post_json(
            '/emaildashboardresult/%s' % query_id, params,
            csrf_token=csrf_token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            '%s is not an authorized user for this query.' % (
                self.NEW_SUBMITTER_USERNAME))
        self.logout()

    def test_that_no_emails_are_sent_if_query_is_canceled(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

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
            user_ids=[self.user_a_id, self.user_b_id]
        ).put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardcancelresult/%s' % query_id, {},
                csrf_token=csrf_token)
            self.logout()

            query_model = user_models.UserQueryModel.get_by_id(query_id)
            self.assertEqual(
                query_model.query_status, feconf.USER_QUERY_STATUS_ARCHIVED)
            self.assertTrue(query_model.deleted)

            # Check that no email is sent to qualified users.
            messages_a = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages_a), 0)
            messages_b = self._get_sent_email_messages(
                self.USER_B_EMAIL)
            self.assertEqual(len(messages_b), 0)

    def test_cancel_email_handler_with_invalid_query_id_raises_400(
        self
    ) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/emaildashboardcancelresult/%s' % 'invalid_query_id', {},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(response['error'], '400 Invalid query id.')
        self.logout()

    def test_cancel_email_handler_with_invalid_user_raises_401(self) -> None:
        self.login(self.NEW_SUBMITTER_EMAIL, is_super_admin=True)

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
            user_ids=[]
        ).put()

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/emaildashboardcancelresult/%s' % query_id, {},
            csrf_token=csrf_token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            '%s is not an authorized user for this query.' % (
                self.NEW_SUBMITTER_USERNAME))
        self.logout()

    def test_that_test_email_for_bulk_emails_is_sent(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

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
            user_ids=[self.user_a_id, self.user_b_id]
        ).put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            email_subject = 'email_subject'
            email_body = 'email_body'

            # Check that correct test email is sent.
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/emaildashboardtestbulkemailhandler/%s' % query_id, {
                    'email_body': email_body,
                    'email_subject': email_subject
                }, csrf_token=csrf_token)
            self.logout()

            query_model = user_models.UserQueryModel.get(query_id)

            # Check that correct test email is sent to submitter of query.
            # One email is sent when query is completed and other is test email.
            test_email_html_body = (
                '[This is a test email.]<br><br> %s' % email_body)
            test_email_text_body = '[This is a test email.]\n\n %s' % email_body

            messages = self._get_sent_email_messages(self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, test_email_html_body)
            self.assertEqual(messages[0].body, test_email_text_body)

            all_model: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.query().fetch()
            self.assertEqual(len(all_model), 1)

            sent_email_model = all_model[0]
            self.assertEqual(
                sent_email_model.subject, email_subject)
            self.assertEqual(
                sent_email_model.html_body, test_email_html_body)
            self.assertEqual(
                sent_email_model.recipient_id, query_model.submitter_id)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.intent, feconf.BULK_EMAIL_INTENT_TEST)

    def test_bulk_email_handler_with_invalid_query_id_raises_400(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/emaildashboardtestbulkemailhandler/%s' % 'invalid_query_id', {
                'email_subject': 'valid_email_subject',
                'email_body': 'valid_email_body'
            }, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(response['error'], '400 Invalid query id.')
        self.logout()

    def test_bulk_email_handler_with_invalid_user_raises_401(self) -> None:
        self.login(self.NEW_SUBMITTER_EMAIL, is_super_admin=True)

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
            user_ids=[]
        ).put()

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/emaildashboardtestbulkemailhandler/%s' % query_id, {
                'email_subject': 'valid_email_subject',
                'email_body': 'valid_email_body'
            }, csrf_token=csrf_token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            '%s is not an authorized user for this query.' % (
                self.NEW_SUBMITTER_USERNAME))
        self.logout()

    def test_handler_with_invalid_num_queries_to_fetch_raises_error_400(
        self
    ) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/emaildashboarddatahandler',
            params={'invalid_param_key': '2'},
            expected_status_int=400)

        error_msg = (
            'Missing key in handler args: num_queries_to_fetch.\n'
            'Found extra args: [\'invalid_param_key\'].')
        self.assertEqual(
            response['error'], error_msg)

        self.logout()

    def test_email_dashboard_data_handler(self) -> None:
        self.login(self.SUBMITTER_EMAIL, is_super_admin=True)

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
