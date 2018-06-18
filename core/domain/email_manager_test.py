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
import types

from constants import constants
from core.domain import config_services
from core.domain import email_manager
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
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
            constants.SYSTEM_COMMITTER_ID, self.admin_id, self.moderator_id,
            self.editor_id]

        # These are given in the order of user_ids_to_test.
        expected_validation_results = {
            feconf.EMAIL_INTENT_SIGNUP: (True, False, False, False),
            feconf.EMAIL_INTENT_DAILY_BATCH: (True, False, False, False),
            feconf.EMAIL_INTENT_MARKETING: (True, True, False, False),
            feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION: (
                True, True, True, False),
            feconf.EMAIL_INTENT_DELETE_EXPLORATION: (
                True, True, True, False),
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
                '', constants.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                '', self.admin_id)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                'invalid_intent', constants.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager._require_sender_id_is_valid(
                'invalid_intent', self.admin_id)
        # pylint: enable=protected-access


class ExplorationMembershipEmailTests(test_utils.GenericTestBase):
    """Tests that sending exploration membership email works as expected."""

    EXPLORATION_TITLE = 'Title'

    def setUp(self):
        super(ExplorationMembershipEmailTests, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, self.EXPLORATION_TITLE)

        self.expected_email_subject = (
            '%s - invitation to collaborate') % self.EXPLORATION_TITLE

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_editor_role_email_ctx = self.swap(
            feconf, 'CAN_SEND_EDITOR_ROLE_EMAILS', True)

    def test_role_email_is_sent_when_editor_assigns_role(self):
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            self.login(self.EDITOR_EMAIL)

            response = self.testapp.get('%s/%s' % (
                feconf.EDITOR_URL_PREFIX, self.exploration.id))
            csrf_token = self.get_csrf_token_from_response(response)
            self.put_json('%s/%s' % (
                feconf.EXPLORATION_RIGHTS_PREFIX, self.exploration.id), {
                    'version': self.exploration.version,
                    'new_member_username': self.NEW_USER_USERNAME,
                    'new_member_role': rights_manager.ROLE_EDITOR,
                }, csrf_token=csrf_token)

            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

    def test_email_is_not_sent_if_recipient_has_declined_such_emails(self):
        user_services.update_email_preferences(
            self.new_user_id, True, False, False, False)

        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_OWNER,
                self.exploration.id, self.exploration.title)

            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_role_emails_sent_are_correct(self):
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_VIEWER,
                self.exploration.id, self.exploration.title)

            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            sent_email_model = all_models[0]

            # Check that email details are correct.
            self.assertEqual(
                sent_email_model.recipient_id,
                self.new_user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.NEW_USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                '%s <%s>' % (
                    self.EDITOR_USERNAME, feconf.NOREPLY_EMAIL_ADDRESS))
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION)
            self.assertEqual(
                sent_email_model.subject,
                self.expected_email_subject)

    def test_correct_rights_are_written_in_manager_role_email_body(self):
        expected_email_html_body = (
            'Hi newuser,<br>'
            '<br>'
            '<b>editor</b> has granted you manager rights to their '
            'exploration, '
            '"<a href="https://www.oppia.org/create/A">Title</a>", '
            'on Oppia.org.<br>'
            '<br>'
            'This allows you to:<br>'
            '<ul>'
            '<li>Change the exploration permissions</li><br>'
            '<li>Edit the exploration</li><br>'
            '<li>View and playtest the exploration</li><br>'
            '</ul>'
            'You can find the exploration '
            '<a href="https://www.oppia.org/create/A">here</a>.<br>'
            '<br>'
            'Thanks, and happy collaborating!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'editor has granted you manager rights to their '
            'exploration, "Title", on Oppia.org.\n'
            '\n'
            'This allows you to:\n'
            '- Change the exploration permissions\n'
            '- Edit the exploration\n'
            '- View and playtest the exploration\n'
            'You can find the exploration here.\n'
            '\n'
            'Thanks, and happy collaborating!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            # Check that correct email content is sent for Manager.
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_OWNER,
                self.exploration.id, self.exploration.title)

            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

    def test_correct_rights_are_written_in_editor_role_email_body(self):
        expected_email_html_body = (
            'Hi newuser,<br>'
            '<br>'
            '<b>editor</b> has granted you editor rights to their '
            'exploration, '
            '"<a href="https://www.oppia.org/create/A">Title</a>"'
            ', on Oppia.org.<br>'
            '<br>'
            'This allows you to:<br>'
            '<ul>'
            '<li>Edit the exploration</li><br>'
            '<li>View and playtest the exploration</li><br>'
            '</ul>'
            'You can find the exploration '
            '<a href="https://www.oppia.org/create/A">here</a>.<br>'
            '<br>'
            'Thanks, and happy collaborating!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'editor has granted you editor rights to their '
            'exploration, "Title", on Oppia.org.\n'
            '\n'
            'This allows you to:\n'
            '- Edit the exploration\n'
            '- View and playtest the exploration\n'
            'You can find the exploration here.\n'
            '\n'
            'Thanks, and happy collaborating!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            # Check that correct email content is sent for Editor.
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_EDITOR,
                self.exploration.id, self.exploration.title)

            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

    def test_correct_rights_are_written_in_playtester_role_email_body(self):
        expected_email_html_body = (
            'Hi newuser,<br>'
            '<br>'
            '<b>editor</b> has granted you playtest access to their '
            'exploration, '
            '"<a href="https://www.oppia.org/create/A">Title</a>"'
            ', on Oppia.org.<br>'
            '<br>'
            'This allows you to:<br>'
            '<ul>'
            '<li>View and playtest the exploration</li><br>'
            '</ul>'
            'You can find the exploration '
            '<a href="https://www.oppia.org/create/A">here</a>.<br>'
            '<br>'
            'Thanks, and happy collaborating!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'editor has granted you playtest access to their '
            'exploration, "Title", on Oppia.org.\n'
            '\n'
            'This allows you to:\n'
            '- View and playtest the exploration\n'
            'You can find the exploration here.\n'
            '\n'
            'Thanks, and happy collaborating!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            # Check that correct email content is sent for Playtester.
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_VIEWER,
                self.exploration.id, self.exploration.title)

            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

    def test_correct_undefined_role_raises_an_exception(self):
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            # Check that an exception is raised when an invalid
            # role is supplied.
            with self.assertRaisesRegexp(Exception, 'Invalid role'):
                email_manager.send_role_notification_email(
                    self.editor_id, self.new_user_id, rights_manager.ROLE_NONE,
                    self.exploration.id, self.exploration.title)


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
        with self.swap(feconf, 'CAN_SEND_EMAILS', False):
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
                feconf.SIGNUP_DATA_URL, {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME
                }, csrf_token=csrf_token)

            # Check that no email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

    def test_email_not_sent_if_content_config_is_not_modified(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

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
            self.post_json(
                feconf.SIGNUP_DATA_URL, {
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
            feconf, 'CAN_SEND_EMAILS', True)

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
            self.post_json(
                feconf.SIGNUP_DATA_URL, {
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
            feconf, 'CAN_SEND_EMAILS', True)

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
            self.post_json(
                feconf.SIGNUP_DATA_URL, {
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
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
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

            self.post_json(
                feconf.SIGNUP_DATA_URL, {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME
                }, csrf_token=csrf_token)

            # Check that an email was sent with the correct content.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            self.assertEqual(
                messages[0].sender,
                'Email Sender <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(messages[0].to, self.EDITOR_EMAIL)
            self.assertEqual(messages[0].subject, 'Welcome!')
            self.assertEqual(
                messages[0].body.decode(), self.expected_text_email_content)
            self.assertEqual(
                messages[0].html.decode(), self.expected_html_email_content)

    def test_email_only_sent_once_for_repeated_signups_by_same_user(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
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
                feconf.SIGNUP_DATA_URL, {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME
                }, csrf_token=csrf_token)

            # Check that an email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            # Send a second POST request.
            self.post_json(
                feconf.SIGNUP_DATA_URL, {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME
                }, csrf_token=csrf_token)

            # Check that no new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

    def test_email_only_sent_if_signup_was_successful(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
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
            self.post_json(
                feconf.SIGNUP_DATA_URL, {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME
                }, csrf_token=csrf_token)

            # Check that a new email was sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

    def test_record_of_sent_email_is_written_to_datastore(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
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

            self.post_json(
                feconf.SIGNUP_DATA_URL, {
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
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Email Sender <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_SIGNUP)
            self.assertEqual(
                sent_email_model.subject, 'Welcome!')
            self.assertEqual(
                sent_email_model.html_body, self.expected_html_email_content)


class DuplicateEmailTests(test_utils.GenericTestBase):
    """Test that duplicate emails are not sent."""

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

        # pylint: disable=unused-argument
        def _generate_hash_for_tests(
                cls, recipient_id, email_subject, email_body):
            return 'Email Hash'

        self.generate_hash_ctx = self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(
                _generate_hash_for_tests,
                email_models.SentEmailModel))

    def test_send_email_does_not_resend_if_same_hash_exists(self):
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

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

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                constants.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            # pylint: disable=protected-access
            email_manager._send_email(
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)
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
            feconf, 'CAN_SEND_EMAILS', True)

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
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)

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
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)
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
        """Hash for both messages is same but recipients are different."""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx, self.generate_hash_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            email_models.SentEmailModel.create(
                'recipient_id', self.NEW_USER_EMAIL,
                constants.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            # pylint: disable=protected-access
            email_manager._send_email(
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)
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
        """Hash for both messages is same but subjects are different."""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx, self.generate_hash_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                constants.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject1', 'Email Body',
                datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            # pylint: disable=protected-access
            email_manager._send_email(
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)
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
        """Hash for both messages is same but body is different."""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx, self.generate_hash_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                constants.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body1',
                datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            # pylint: disable=protected-access
            email_manager._send_email(
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)
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
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            email_sent_time = (datetime.datetime.utcnow() -
                               datetime.timedelta(minutes=4))

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                constants.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                email_sent_time)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_sent_time = (datetime.datetime.utcnow() -
                               datetime.timedelta(minutes=2))

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                constants.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                email_sent_time)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 2)

            # pylint: disable=protected-access
            email_manager._send_email(
                self.new_user_id, constants.SYSTEM_COMMITTER_ID,
                feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                feconf.SYSTEM_EMAIL_ADDRESS)
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


class FeedbackMessageBatchEmailTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FeedbackMessageBatchEmailTests, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')

        self.expected_email_subject = (
            'You\'ve received 3 new messages on your explorations')

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_correct_email_body_is_sent(self):
        expected_email_html_body = (
            'Hi editor,<br>'
            '<br>'
            'You\'ve received 3 new messages on your Oppia explorations:<br>'
            '<ul>'
            '<li><a href="https://www.oppia.org/create/A#/feedback">Title</a>:'
            '<br>'
            '<ul><li>Message 1.1<br></li>'
            '<li>Message 1.2<br></li>'
            '<li>Message 1.3<br></li>'
            '</ul></li></ul>'
            'You can view and reply to your messages from your '
            '<a href="https://www.oppia.org/creator_dashboard">dashboard</a>.'
            '<br>'
            '<br>Thanks, and happy teaching!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            '\n'
            'You\'ve received 3 new messages on your Oppia explorations:\n'
            '- Title:\n'
            '- Message 1.1\n'
            '- Message 1.2\n'
            '- Message 1.3\n'
            'You can view and reply to your messages from your dashboard.\n'
            '\n'
            'Thanks, and happy teaching!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        feedback_messages = {
            self.exploration.id: {
                'title': self.exploration.title,
                'messages': ['Message 1.1', 'Message 1.2', 'Message 1.3']}
        }

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

            # check that email body is correct.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # check that email model is correct.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.recipient_id, self.editor_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.EDITOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION)
            self.assertEqual(
                sent_email_model.subject, self.expected_email_subject)


class SuggestionEmailTest(test_utils.GenericTestBase):
    def setUp(self):
        super(SuggestionEmailTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.recipient_list = [self.editor_id]

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_suggestion_emails_are_correct(self):
        expected_email_subject = 'New suggestion for "Title"'

        expected_email_html_body = (
            'Hi editor,<br>'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, '
            '<a href="https://www.oppia.org/create/A">"Title"</a>.<br>'
            'You can accept or reject this suggestion by visiting the '
            '<a href="https://www.oppia.org/create/A#/feedback">'
            'feedback page</a> '
            'for your exploration.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, "Title".\n'
            'You can accept or reject this suggestion by visiting the '
            'feedback page for your exploration.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            email_manager.send_suggestion_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.recipient_list)

            # make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.editor_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.EDITOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION)


class SubscriptionEmailTest(test_utils.GenericTestBase):
    def setUp(self):
        super(SubscriptionEmailTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        subscription_services.subscribe_to_creator(
            self.new_user_id, self.editor_id)

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_subscription_email_ctx = self.swap(
            feconf, 'CAN_SEND_SUBSCRIPTION_EMAILS', True)

    def test_that_subscription_emails_are_correct(self):
        expected_email_subject = 'editor has published a new exploration!'

        expected_email_html_body = (
            'Hi newuser,<br>'
            '<br>'
            'editor has published a new exploration! You can play it here: '
            '<a href="https://www.oppia.org/explore/A">Title</a><br>'
            '<br>'
            'Thanks, and happy learning!<br>'
            '<br>'
            'Best wishes,<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'editor has published a new exploration! You can play it here: '
            'Title\n'
            '\n'
            'Thanks, and happy learning!\n'
            '\n'
            'Best wishes,\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_subscription_email_ctx:
            email_manager.send_emails_to_subscribers(
                self.editor_id, self.exploration.id, self.exploration.title)

            # make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.new_user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.NEW_USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION)


class FeedbackMessageInstantEmailTests(test_utils.GenericTestBase):
    def setUp(self):
        super(FeedbackMessageInstantEmailTests, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.recipient_list = [self.editor_id]

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_feedback_message_emails_are_correct(self):
        expected_email_subject = 'New Oppia message in "a subject"'

        expected_email_html_body = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: editor message<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: editor message\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            email_manager.send_instant_feedback_message_email(
                self.new_user_id, self.editor_id, 'editor message',
                'New Oppia message in "a subject"', self.exploration.title,
                self.exploration.id, 'a subject')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.new_user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.NEW_USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION)


class FlagExplorationEmailTest(test_utils.GenericTestBase):
    """Test that emails are sent to moderators when explorations are flagged."""

    def setUp(self):
        super(FlagExplorationEmailTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)

        self.moderator2_email = 'moderator2@example.com'
        self.moderator2_username = 'moderator2'
        self.signup(self.moderator2_email, self.moderator2_username)
        self.moderator2_id = self.get_user_id_from_email(self.moderator2_email)

        self.set_moderators([self.moderator2_username, self.MODERATOR_USERNAME])

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.owner_ids = [self.editor_id]

        self.report_text = 'AD'

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

    def test_that_flag_exploration_emails_are_correct(self):
        expected_email_subject = 'Exploration flagged by user: "Title"'

        expected_email_html_body = (
            'Hello Moderator,<br>'
            'newuser has flagged exploration "Title" on the following '
            'grounds: <br>'
            'AD .<br>'
            'You can modify the exploration by clicking '
            '<a href="https://www.oppia.org/create/A">'
            'here</a>.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hello Moderator,\n'
            'newuser has flagged exploration "Title" on the following '
            'grounds: \n'
            'AD .\n'
            'You can modify the exploration by clicking here.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx:
            email_manager.send_flag_exploration_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.report_text)

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.MODERATOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # Make sure correct email is sent to multiple moderators.
            messages = self.mail_stub.get_sent_messages(
                to=self.moderator2_email)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # Make sure correct email models are stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            all_models.sort(key=lambda x: x.recipient_id)
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.moderator_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.MODERATOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_REPORT_BAD_CONTENT)
            sent_email_model = all_models[1]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.moderator2_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.moderator2_email)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_REPORT_BAD_CONTENT)


class QueryStatusNotificationEmailTests(test_utils.GenericTestBase):
    """Test that email is send to submitter when query has completed
    or failed.
    """
    SUBMITTER_USERNAME = 'submit'
    SUBMITTER_EMAIL = 'submit@example.com'

    def setUp(self):
        super(QueryStatusNotificationEmailTests, self).setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(self.SUBMITTER_EMAIL)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)

    def test_that_correct_completion_email_is_sent(self):
        query_id = 'qid'
        expected_email_subject = 'Query qid has successfully completed'
        expected_email_html_body = (
            'Hi submit,<br>'
            'Your query with id qid has succesfully completed its '
            'execution. Visit the result page '
            '<a href="https://www.oppia.org/emaildashboardresult/qid">here</a> '
            'to see result of your query.<br><br>'
            'Thanks!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi submit,\n'
            'Your query with id qid has succesfully completed its '
            'execution. Visit the result page here '
            'to see result of your query.\n\n'
            'Thanks!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx:
            email_manager.send_query_completion_email(
                self.submitter_id, query_id)

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(), expected_email_text_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.submitter_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.SUBMITTER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION)

    def test_that_correct_failure_email_is_sent(self):
        query_id = 'qid'
        query_params = {
            'key1': 'val1',
            'key2': 'val2'
        }

        expected_email_subject = 'Query qid has failed'

        expected_email_html_body = (
            'Hi submit,<br>'
            'Your query with id qid has failed due to error '
            'during execution. '
            'Please check the query parameters and submit query again.<br><br>'
            'Thanks!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi submit,\n'
            'Your query with id qid has failed due to error '
            'during execution. '
            'Please check the query parameters and submit query again.\n\n'
            'Thanks!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        expected_admin_email_text_body = (
            '(Sent from testbed-test)\n\n'
            'Query job with qid query id has failed in its execution.\n'
            'Query parameters:\n\n'
            'key1: val1\n'
            'key2: val2\n')

        with self.can_send_emails_ctx:
            email_manager.send_query_failure_email(
                self.submitter_id, query_id, query_params)

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(), expected_email_text_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.submitter_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.SUBMITTER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, constants.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_QUERY_STATUS_NOTIFICATION)

            # Make sure that correct email is sent to admin.
            admin_messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(admin_messages), 1)
            self.assertEqual(
                admin_messages[0].body.decode(), expected_admin_email_text_body)


class BulkEmailsTests(test_utils.GenericTestBase):
    SENDER_EMAIL = 'sender@example.com'
    SENDER_USERNAME = 'sender'
    FAKE_SENDER_EMAIL = 'fake@example.com'
    FAKE_SENDER_USERNAME = 'fake'
    RECIPIENT_A_EMAIL = 'a@example.com'
    RECIPIENT_A_USERNAME = 'usera'
    RECIPIENT_B_EMAIL = 'b@example.com'
    RECIPIENT_B_USERNAME = 'userb'

    def setUp(self):
        super(BulkEmailsTests, self).setUp()
        # SENDER is authorised sender.
        # FAKE_SENDER is unauthorised sender.
        # A and B are recipients.
        self.signup(self.SENDER_EMAIL, self.SENDER_USERNAME)
        self.sender_id = self.get_user_id_from_email(self.SENDER_EMAIL)
        self.signup(self.FAKE_SENDER_EMAIL, self.FAKE_SENDER_USERNAME)
        self.fake_sender_id = self.get_user_id_from_email(
            self.FAKE_SENDER_EMAIL)
        self.signup(self.RECIPIENT_A_EMAIL, self.RECIPIENT_A_USERNAME)
        self.signup(self.RECIPIENT_B_EMAIL, self.RECIPIENT_B_USERNAME)
        self.recipient_a_id = self.get_user_id_from_email(
            self.RECIPIENT_A_EMAIL)
        self.recipient_b_id = self.get_user_id_from_email(
            self.RECIPIENT_B_EMAIL)
        self.recipient_ids = [self.recipient_a_id, self.recipient_b_id]

        self.set_admins([self.SENDER_USERNAME])
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)

    def test_that_correct_email_is_sent(self):
        email_subject = 'Dummy subject'
        email_html_body = 'Dummy email body.<br>'
        email_text_body = 'Dummy email body.\n'

        with self.can_send_emails_ctx:
            # pylint: disable=protected-access
            email_manager._send_bulk_mail(
                self.recipient_ids, self.sender_id,
                feconf.BULK_EMAIL_INTENT_MARKETING, email_subject,
                email_html_body, self.SENDER_EMAIL, self.SENDER_USERNAME)
            # pylint: enable=protected-access

        messages_a = self.mail_stub.get_sent_messages(to=self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 1)
        self.assertEqual(
            messages_a[0].html.decode(), email_html_body)
        self.assertEqual(
            messages_a[0].body.decode(), email_text_body)

        messages_b = self.mail_stub.get_sent_messages(to=self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 1)
        self.assertEqual(
            messages_b[0].html.decode(), email_html_body)
        self.assertEqual(
            messages_b[0].body.decode(), email_text_body)

        # Make sure correct email model is stored.
        all_models = email_models.BulkEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 1)
        sent_email_model = all_models[0]
        self.assertEqual(
            sent_email_model.subject, email_subject)
        self.assertEqual(
            sent_email_model.html_body, email_html_body)
        self.assertEqual(
            sent_email_model.recipient_ids, self.recipient_ids)
        self.assertEqual(
            sent_email_model.sender_id, self.sender_id)
        self.assertEqual(
            sent_email_model.sender_email,
            '%s <%s>' % (self.SENDER_USERNAME, self.SENDER_EMAIL))
        self.assertEqual(
            sent_email_model.intent,
            feconf.BULK_EMAIL_INTENT_MARKETING)

    def test_that_exception_is_raised_for_unauthorised_sender(self):
        with self.can_send_emails_ctx, self.assertRaisesRegexp(
            Exception, 'Invalid sender_id for email'):
            # pylint: disable=protected-access
            email_manager._send_bulk_mail(
                self.recipient_ids, self.fake_sender_id,
                feconf.BULK_EMAIL_INTENT_MARKETING, 'email_subject',
                'email_html_body', self.FAKE_SENDER_EMAIL,
                self.FAKE_SENDER_USERNAME)
            # pylint: enable=protected-access

        messages_a = self.mail_stub.get_sent_messages(to=self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 0)

        messages_b = self.mail_stub.get_sent_messages(to=self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 0)

        all_models = email_models.BulkEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 0)


class EmailPreferencesTests(test_utils.GenericTestBase):

    def test_can_users_receive_thread_email(self):
        user_ids = ('someUser1', 'someUser2')
        exp_id = 'someExploration'
        usernames = ('username1', 'username2')
        emails = ('user1@example.com', 'user2@example.com')

        for user_id, username, user_email in zip(user_ids, usernames, emails):
            user_services.create_new_user(user_id, user_email)
            user_services.set_username(user_id, username)

        # Both users can receive all emails in default setting.
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [True, True])
        self.assertTrue(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), [True, True])

        # First user have muted feedback notifications for this exploration,
        # therefore he should receive only suggestion emails.
        user_services.set_email_preferences_for_exploration(
            user_ids[0], exp_id, mute_feedback_notifications=True)
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [True, True])
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), [False, True])

        # Second user have muted suggestion notifications for this exploration,
        # therefore he should receive only feedback emails.
        user_services.set_email_preferences_for_exploration(
            user_ids[1], exp_id, mute_suggestion_notifications=True)
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [True, False])
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), [False, True])

        # Both users have disabled all emails globally, therefore they
        # should not receive any emails.
        for user_id in user_ids:
            user_services.update_email_preferences(
                user_id, True, True, False, True)

        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [False, False])
        self.assertTrue(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), [False, False])

        # Both users have unmuted feedback/suggestion emails for this
        # exploration, but all emails are still disabled globally,
        # therefore they should not receive any emails.
        user_services.set_email_preferences_for_exploration(
            user_ids[0], exp_id, mute_feedback_notifications=False)
        user_services.set_email_preferences_for_exploration(
            user_ids[1], exp_id, mute_suggestion_notifications=False)
        user_services.update_email_preferences(
            user_id, True, True, False, True)
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [False, False])
        self.assertTrue(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), [False, False])

        # Both user have enabled all emails globally, therefore they should
        # receive all emails.
        for user_id in user_ids:
            user_services.update_email_preferences(
                user_id, True, True, True, True)

        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [True, True])
        self.assertTrue(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), [True, True])
