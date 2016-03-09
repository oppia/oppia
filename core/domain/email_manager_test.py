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

import datetime

from core.domain import config_services
from core.domain import email_manager
from core.platform import models
from core.tests import test_utils
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])

class EmailRightsTest(test_utils.GenericTestBase):
    """Test that only certain users can send certain types of emails."""

    def setUp(self):
        super(EmailRightsTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

    def test_sender_id_validation(self):
        sender_ids_to_test = [
            feconf.SYSTEM_COMMITTER_ID, self.admin_id, self.moderator_id,
            self.editor_id]

        # These are given in the order of user_ids_to_test.
        expected_validation_results = {
            feconf.EMAIL_INTENT_SIGNUP: (True, False, False, False),
            feconf.EMAIL_INTENT_DAILY_BATCH: (True, False, False, False),
            feconf.EMAIL_INTENT_MARKETING: (False, True, False, False),
            feconf.EMAIL_INTENT_PUBLICIZE_EXPLORATION: (
                False, True, True, False),
            feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION: (
                False, True, True, False),
            feconf.EMAIL_INTENT_DELETE_EXPLORATION: (
                False, True, True, False),
        }

        # pylint: disable=protected-access
        for intent in expected_validation_results:
            for ind, sender_id in enumerate(sender_ids_to_test):
                if expected_validation_results[intent][ind]:
                    email_manager._require_sender_id_is_valid(
                        intent, sender_id)
                else:
                    with self.assertRaisesRegexp(
                        Exception, 'Invalid sender_id'
                        ):
                        email_manager._require_sender_id_is_valid(
                            intent, sender_id)

        # Also test null and invalid intent strings.
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                '', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                '', self.admin_id)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                'invalid_intent', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                'invalid_intent', self.admin_id)
        # pylint: enable=protected-access


class SignupEmailTests(test_utils.GenericTestBase):
    """Test that signup-email sending functionality works as expected."""

    def setUp(self):
        super(SignupEmailTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.new_footer = (
            'Unsubscribe from emails at your '
            '<a href="https://www.site.com/prefs">Preferences page</a>.')
        self.new_email_content = {
            'subject': 'Welcome!',
            'html_body': (
                'Here is some HTML text.<br>'
                'With a <b>bold</b> bit and an <i>italic</i> bit.<br>')
        }

        self.expected_text_email_content = (
            'Hi editor,\n'
            '\n'
            'Here is some HTML text.\n'
            'With a bold bit and an italic bit.\n'
            '\n'
            '\n'
            'Unsubscribe from emails at your Preferences page.')
        self.expected_html_email_content = (
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
                self.admin_id, email_manager.EMAIL_FOOTER.name,
                self.new_footer)
            config_services.set_property(
                self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.new_email_content)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            self.post_json(feconf.SIGNUP_DATA_URL, {
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
            self.post_json(feconf.SIGNUP_DATA_URL, {
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
            self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name, {
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
            self.post_json(feconf.SIGNUP_DATA_URL, {
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
            self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name, {
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
            self.post_json(feconf.SIGNUP_DATA_URL, {
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
                self.admin_id, email_manager.EMAIL_FOOTER.name,
                self.new_footer)
            config_services.set_property(
                self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.new_email_content)
            config_services.set_property(
                self.admin_id, email_manager.EMAIL_SENDER_NAME.name,
                'Email Sender')

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            self.post_json(feconf.SIGNUP_DATA_URL, {
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
                messages[0].body.decode(), self.expected_text_email_content)
            self.assertEqual(
                messages[0].html.decode(), self.expected_html_email_content)

    def test_email_only_sent_once_for_repeated_signups_by_same_user(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS_TO_USERS', True):
            config_services.set_property(
                self.admin_id, email_manager.EMAIL_FOOTER.name,
                self.new_footer)
            config_services.set_property(
                self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.new_email_content)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            self.post_json(feconf.SIGNUP_DATA_URL, {
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
                self.admin_id, email_manager.EMAIL_FOOTER.name,
                self.new_footer)
            config_services.set_property(
                self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.new_email_content)

            self.login(self.EDITOR_EMAIL)
            response = self.testapp.get(feconf.SIGNUP_URL)
            csrf_token = self.get_csrf_token_from_response(response)

            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': 'BadUsername!!!'
                },
                csrf_token=csrf_token,
                expect_errors=True,
                expected_status_int=400)

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
                self.admin_id, email_manager.EMAIL_FOOTER.name,
                self.new_footer)
            config_services.set_property(
                self.admin_id, email_manager.SIGNUP_EMAIL_CONTENT.name,
                self.new_email_content)
            config_services.set_property(
                self.admin_id, email_manager.EMAIL_SENDER_NAME.name,
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
                sent_email_model.intent, feconf.EMAIL_INTENT_SIGNUP)
            self.assertEqual(
                sent_email_model.subject, 'Welcome!')
            self.assertEqual(
                sent_email_model.html_body, self.expected_html_email_content)


class GenerateHashTests(test_utils.GenericTestBase):
    """Test that generating hash functionality works as expected."""

    def test_same_inputs_always_gives_same_hashes(self):
        # pylint: disable=protected-access
        email_hash1 = email_manager._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body')

        email_hash2 = email_manager._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body')
        self.assertEqual(email_hash1, email_hash2)
        # pylint: enable=protected-access

    def test_different_inputs_give_different_hashes(self):
        # pylint: disable=protected-access
        email_hash1 = email_manager._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body')

        email_hash2 = email_manager._generate_hash(
            'recipient_id', 'email_subject', 'email_html_body2')
        self.assertNotEqual(email_hash1, email_hash2)

        email_hash2 = email_manager._generate_hash(
            'recipient_id2', 'email_subject', 'email_html_body')
        self.assertNotEqual(email_hash1, email_hash2)

        email_hash2 = email_manager._generate_hash(
            'recipient_id', 'email_subject2', 'email_html_body')
        self.assertNotEqual(email_hash1, email_hash2)

        email_hash2 = email_manager._generate_hash(
            'recipient_id2', 'email_subject2', 'email_html_body2')
        self.assertNotEqual(email_hash1, email_hash2)
        # pylint: enable=protected-access


class DuplicateEmailTests(test_utils.GenericTestBase):
    """Test that duplicate emails are not sent"""

    def setUp(self):
        super(DuplicateEmailTests, self).setUp()

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.new_footer = (
            'Unsubscribe from emails at your '
            '<a href="https://www.site.com/prefs">Preferences page</a>.')
        self.new_email_content = {
            'subject': 'Welcome!',
            'html_body': (
                'Here is some HTML text.<br>'
                'With a <b>bold</b> bit and an <i>italic</i> bit.<br>')
        }

    def test_send_email_does_not_resend_if_same_hash_exists(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 1000)

        logged_errors = []

        def _log_error_for_tests(error_message):
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, duplicate_email_ctx, log_new_error_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            # pylint: disable=protected-access
            email_hash = email_manager._generate_hash(
                self.new_user_id, 'Email Subject', 'Email Body')
            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                datetime.datetime.utcnow(), email_hash)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')
            # pylint: enable=protected-access

            # An error should be recorded in the logs.
            self.assertEqual(log_new_error_counter.times_called, 1)
            self.assertRegexpMatches(logged_errors[0], 'Duplicate email')

            # Check that a new email was not sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(0, len(messages))

            # Check that the content of this email was not recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

    def test_send_email_does_not_resend_within_duplicate_interval(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        logged_errors = []

        def _log_error_for_tests(error_message):
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, duplicate_email_ctx, log_new_error_ctx:
            config_services.set_property(
                self.admin_id, email_manager.EMAIL_SENDER_NAME.name,
                'Email Sender')

            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            # pylint: disable=protected-access
            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            # No error should be recorded in the logs.
            self.assertEqual(log_new_error_counter.times_called, 0)

            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')
            # pylint: enable=protected-access

            # An error should be recorded in the logs.
            self.assertEqual(log_new_error_counter.times_called, 1)
            self.assertRegexpMatches(logged_errors[0], 'Duplicate email')

            # Check that a new email was not sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was not recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

    def test_sending_email_with_different_recipient_but_same_hash(self):
        """Hash for both messages is same but recipients are different"""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            # pylint: disable=protected-access
            email_hash = email_manager._generate_hash(
                self.new_user_id, 'Email Subject', 'Email Body')
            email_models.SentEmailModel.create(
                'recipient_id', self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                datetime.datetime.utcnow(), email_hash)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')
            # pylint: enable=protected-access

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 2)

            # Check that the contents of the model are correct.
            sent_email_model1 = all_models[0]
            sent_email_model2 = all_models[1]

            self.assertEqual(
                sent_email_model1.email_hash, sent_email_model2.email_hash)
            self.assertNotEqual(
                sent_email_model1.recipient_id, sent_email_model2.recipient_id)
            self.assertEqual(
                sent_email_model1.subject, sent_email_model2.subject)
            self.assertEqual(
                sent_email_model1.html_body, sent_email_model2.html_body)

    def test_sending_email_with_different_subject_but_same_hash(self):
        """Hash for both messages is same but subjects are different"""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            # pylint: disable=protected-access
            email_hash = email_manager._generate_hash(
                self.new_user_id, 'Email Subject', 'Email Body')
            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject1', 'Email Body',
                datetime.datetime.utcnow(), email_hash)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')
            # pylint: enable=protected-access

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 2)

            # Check that the contents of the model are correct.
            sent_email_model1 = all_models[0]
            sent_email_model2 = all_models[1]

            self.assertEqual(
                sent_email_model1.email_hash, sent_email_model2.email_hash)
            self.assertEqual(
                sent_email_model1.recipient_id, sent_email_model2.recipient_id)
            self.assertNotEqual(
                sent_email_model1.subject, sent_email_model2.subject)
            self.assertEqual(
                sent_email_model1.html_body, sent_email_model2.html_body)

    def test_sending_email_with_different_body_but_same_hash(self):
        """Hash for both messages is same but body is different"""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            # pylint: disable=protected-access
            email_hash = email_manager._generate_hash(
                self.new_user_id, 'Email Subject', 'Email Body')
            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body1',
                datetime.datetime.utcnow(), email_hash)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')
            # pylint: enable=protected-access

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 2)

            # Check that the contents of the model are correct.
            sent_email_model1 = all_models[0]
            sent_email_model2 = all_models[1]

            self.assertEqual(
                sent_email_model1.email_hash, sent_email_model2.email_hash)
            self.assertEqual(
                sent_email_model1.recipient_id, sent_email_model2.recipient_id)
            self.assertEqual(
                sent_email_model1.subject, sent_email_model2.subject)
            self.assertNotEqual(
                sent_email_model1.html_body, sent_email_model2.html_body)

    def test_duplicate_emails_are_sent_after_some_time_has_elapsed(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS_TO_USERS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            # pylint: disable=protected-access
            email_hash = email_manager._generate_hash(
                self.new_user_id, 'Email Subject', 'Email Body')
            email_sent_time = (datetime.datetime.utcnow() -
                               datetime.timedelta(minutes=4))

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                email_sent_time, email_hash)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_sent_time = (datetime.datetime.utcnow() -
                               datetime.timedelta(minutes=2))

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                email_sent_time, email_hash)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 2)

            email_manager._send_email(
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body')
            # pylint: enable=protected-access

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(1, len(messages))

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 3)

            # Check that the contents of the model are correct.
            sent_email_model1 = all_models[0]
            sent_email_model2 = all_models[1]
            sent_email_model3 = all_models[2]

            self.assertEqual(
                sent_email_model1.email_hash, sent_email_model2.email_hash)
            self.assertEqual(
                sent_email_model1.email_hash, sent_email_model3.email_hash)
