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

"""Tests for methods relating to sending emails."""

__author__ = 'Sean Lip'

from core.domain import config_services
from core.domain import email_manager
from core.platform import models
(email_models,) = models.Registry.import_models([models.NAMES.email])
from core.tests import test_utils
import feconf


class EmailRightsTest(test_utils.GenericTestBase):
    """Test that only certain users can send certain types of emails."""

    def setUp(self):
        super(EmailRightsTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.MODERATOR_ID = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_EMAIL])

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.ADMIN_ID = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_EMAIL])

    def test_sender_id_validation(self):
        sender_ids_to_test = [
            feconf.SYSTEM_COMMITTER_ID, self.ADMIN_ID, self.MODERATOR_ID,
            self.EDITOR_ID]

        # These are given in the order of user_ids_to_test.
        expected_validation_results = {
            email_models.INTENT_SIGNUP: (True, False, False, False),
            email_models.INTENT_DAILY_BATCH: (True, False, False, False),
            email_models.INTENT_MARKETING: (False, True, False, False),
            email_models.INTENT_PUBLICIZE_EXPLORATION: (
                False, True, True, False),
            email_models.INTENT_UNPUBLISH_EXPLORATION: (
                False, True, True, False),
            email_models.INTENT_DELETE_EXPLORATION: (
                False, True, True, False),
        }

        for intent in expected_validation_results:
            for ind, sender_id in enumerate(sender_ids_to_test):
                if expected_validation_results[intent][ind]:
                    email_manager._require_sender_id_is_valid(
                        intent, sender_id)
                else:
                    with self.assertRaisesRegexp(
                            Exception, 'Invalid sender_id'):
                        email_manager._require_sender_id_is_valid(
                            intent, sender_id)

        # Also test null and invalid intent strings.
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                '', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                '', self.ADMIN_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                'invalid_intent', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                'invalid_intent', self.ADMIN_ID)


class SignupEmailTests(test_utils.GenericTestBase):
    """Test that signup-email sending functionality works as expected."""

    def setUp(self):
        super(SignupEmailTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.ADMIN_ID = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_EMAIL])

        self.NEW_FOOTER = (
            'Unsubscribe from emails at your '
            '<a href="https://www.site.com/prefs">Preferences page</a>.')
        self.NEW_EMAIL_CONTENT = {
            'subject': 'Welcome!',
            'html_body': (
                'Here is some HTML text.<br>'
                'With a <b>bold</b> bit and an <i>italic</i> bit.<br>')
        }

        self.EXPECTED_PLAINTEXT_EMAIL_CONTENT = (
            'Hi editor,\n'
            '\n'
            'Here is some HTML text.\n'
            'With a bold bit and an italic bit.\n'
            '\n'
            '\n'
            'Unsubscribe from emails at your Preferences page.')
        self.EXPECTED_HTML_EMAIL_CONTENT = (
            'Hi editor,<br>'
            '<br>'
            'Here is some HTML text.<br>'
            'With a <b>bold</b> bit and an <i>italic</i> bit.<br>'
            '<br>'
            '<br>'
            'Unsubscribe from emails at your '
            '<a href="https://www.site.com/prefs">Preferences page</a>.')

    def test_email_not_sent_if_config_does_not_permit_it(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', False):
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_FOOTER.name,
                self.NEW_FOOTER)
            config_services.set_property(
                self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.NEW_EMAIL_CONTENT)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # Check that no email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

    def test_email_not_sent_if_content_config_is_not_modified(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        logged_errors = []

        def _log_error_for_tests(error_message):
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, log_new_error_ctx:
            self.assertEqual(log_new_error_counter.times_called, 0)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            # No user-facing error should surface.
            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # However, an error should be recorded in the logs.
            self.assertEqual(log_new_error_counter.times_called, 1)
            self.assertEqual(
                logged_errors[0],
                'Please ensure that the value for the admin config property '
                'SIGNUP_EMAIL_CONTENT is set, before allowing post-signup '
                'emails to be sent.')

            # Check that no email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

    def test_email_not_sent_if_content_config_is_partially_modified(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        config_services.set_property(
            self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name, {
                'subject': (
                    email_manager.SIGNUP_EMAIL_CONTENT.default_value[
                        'subject']),
                'html_body': 'New HTML body.',
            })

        logged_errors = []

        def _log_error_for_tests(error_message):
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, log_new_error_ctx:
            self.assertEqual(log_new_error_counter.times_called, 0)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            # No user-facing error should surface.
            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # However, an error should be recorded in the logs.
            self.assertEqual(log_new_error_counter.times_called, 1)
            self.assertEqual(
                logged_errors[0],
                'Please ensure that the value for the admin config property '
                'SIGNUP_EMAIL_CONTENT is set, before allowing post-signup '
                'emails to be sent.')

            # Check that no email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

    def test_email_with_bad_content_is_not_sent(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        config_services.set_property(
            self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name, {
                'subject': 'New email subject',
                'html_body': 'New HTML body.<script>alert(3);</script>',
            })

        logged_errors = []

        def _log_error_for_tests(error_message):
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, log_new_error_ctx:
            self.assertEqual(log_new_error_counter.times_called, 0)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            # No user-facing error should surface.
            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # However, an error should be recorded in the logs.
            self.assertEqual(log_new_error_counter.times_called, 1)
            self.assertTrue(logged_errors[0].startswith(
                'Original email HTML body does not match cleaned HTML body'))

            # Check that no email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

    def test_contents_of_signup_email_are_correct(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_FOOTER.name,
                self.NEW_FOOTER)
            config_services.set_property(
                self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.NEW_EMAIL_CONTENT)
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_SENDER_NAME.name,
                'Email Sender')

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # Check that an email was sent with the correct content.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            self.assertEqual(
                messages[0].sender,
                'Email Sender <%s>' % feconf.SYSTEM_EMAIL_ADDRESS)
            self.assertEqual(messages[0].to, self.EDITOR_EMAIL)
            self.assertEqual(messages[0].subject, 'Welcome!')
            self.assertEqual(
                messages[0].body.decode(),
                self.EXPECTED_PLAINTEXT_EMAIL_CONTENT)
            self.assertEqual(
                messages[0].html.decode(), self.EXPECTED_HTML_EMAIL_CONTENT)

    def test_email_only_sent_once_for_repeated_signups_by_same_user(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_FOOTER.name,
                self.NEW_FOOTER)
            config_services.set_property(
                self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.NEW_EMAIL_CONTENT)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # Check that an email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            # Send a second POST request.
            self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # Check that no new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

    def test_email_only_sent_if_signup_was_successful(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_FOOTER.name,
                self.NEW_FOOTER)
            config_services.set_property(
                self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.NEW_EMAIL_CONTENT)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            response_dict = self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': 'BadUsername!!!'
            },
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)

            # Check that no email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

            # Redo the signup process with a good username.
            self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

    def test_record_of_sent_email_is_written_to_datastore(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_FOOTER.name,
                self.NEW_FOOTER)
            config_services.set_property(
                self.ADMIN_ID, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.NEW_EMAIL_CONTENT)
            config_services.set_property(
                self.ADMIN_ID, email_manager.EMAIL_SENDER_NAME.name,
                'Email Sender')

            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            self.post_json(feconf.SIGNUP_DATA_URL, {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME
            }, csrf_token=csrf_token)

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            # Check that the contents of the model are correct.
            sent_email_model = all_models[0]

            self.assertEqual(
                sent_email_model.recipient_id,
                self.get_user_id_from_email(self.EDITOR_EMAIL))
            self.assertEqual(
                sent_email_model.recipient_email, self.EDITOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Email Sender <%s>' % feconf.SYSTEM_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, email_models.INTENT_SIGNUP)
            self.assertEqual(
                sent_email_model.subject, 'Welcome!')
            self.assertEqual(
                sent_email_model.html_body, self.EXPECTED_HTML_EMAIL_CONTENT)
