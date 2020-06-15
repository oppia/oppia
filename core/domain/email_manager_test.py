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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from constants import constants
from core.domain import config_domain
from core.domain import config_services
from core.domain import email_manager
from core.domain import html_cleaner
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(email_models,) = models.Registry.import_models([models.NAMES.email])


class FailedMLTest(test_utils.GenericTestBase):
    """Test that email functionality for sending failed ML Job emails
    works.
    """

    def setUp(self):
        super(FailedMLTest, self).setUp()
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        config_property = config_domain.Registry.get_config_property(
            'notification_emails_for_failed_tasks')
        config_property.set_value(
            'committer_id', ['moderator@example.com'])

    def test_send_failed_ml_email(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            # Make sure there are no emails already sent.
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)
            messages = self.mail_stub.get_sent_messages(
                to='moderator@example.com')
            self.assertEqual(len(messages), 0)

            # Send job failure email with mock Job ID.
            email_manager.send_job_failure_email('123ABC')

            # Make sure emails are sent.
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            expected_subject = 'Failed ML Job'
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].subject.decode(), expected_subject)
            messages = self.mail_stub.get_sent_messages(
                to='moderator@example.com')
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].subject.decode(), expected_subject)


class EmailToAdminTest(test_utils.GenericTestBase):
    """Test that emails are correctly sent to the admin."""

    def test_email_to_admin_is_sent_correctly(self):
        dummy_system_name = 'DUMMY_SYSTEM_NAME'
        dummy_system_address = 'dummy@system.com'
        dummy_admin_address = 'admin@system.com'

        send_email_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        system_name_ctx = self.swap(
            feconf, 'SYSTEM_EMAIL_NAME', dummy_system_name)
        system_email_ctx = self.swap(
            feconf, 'SYSTEM_EMAIL_ADDRESS', dummy_system_address)
        admin_email_ctx = self.swap(
            feconf, 'ADMIN_EMAIL_ADDRESS', dummy_admin_address)

        with send_email_ctx, system_name_ctx, system_email_ctx, admin_email_ctx:
            # Make sure there are no emails already sent.
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)

            # Send an email to the admin.
            email_manager.send_mail_to_admin('Dummy Subject', 'Dummy Body')

            # Make sure emails are sent.
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].sender, 'DUMMY_SYSTEM_NAME <dummy@system.com>')
            self.assertEqual(messages[0].to, 'admin@system.com')
            self.assertEqual(messages[0].subject.decode(), 'Dummy Subject')
            self.assertIn('Dummy Body', messages[0].html.decode())


class DummyMailTest(test_utils.GenericTestBase):
    """Test that emails are correctly sent to the testing email id."""

    def test_sending_emails(self):
        dummy_system_name = 'DUMMY_SYSTEM_NAME'
        dummy_system_address = 'dummy@system.com'
        dummy_receiver_address = 'admin@system.com'

        send_email_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        system_name_ctx = self.swap(
            feconf, 'SYSTEM_EMAIL_NAME', dummy_system_name)
        system_email_ctx = self.swap(
            feconf, 'SYSTEM_EMAIL_ADDRESS', dummy_system_address)
        admin_email_ctx = self.swap(
            feconf, 'ADMIN_EMAIL_ADDRESS', dummy_receiver_address)

        with send_email_ctx, system_name_ctx, system_email_ctx, admin_email_ctx:
            # Make sure there are no emails already sent.
            messages = self.mail_stub.get_sent_messages(
                to=dummy_receiver_address)
            self.assertEqual(len(messages), 0)

            # Send an email.
            email_manager.send_dummy_mail_to_admin(dummy_system_name)

            # Make sure emails are sent.
            messages = self.mail_stub.get_sent_messages(
                to=dummy_receiver_address)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].sender, 'DUMMY_SYSTEM_NAME <dummy@system.com>')
            self.assertEqual(messages[0].to, dummy_receiver_address)
            self.assertEqual(
                messages[0].subject.decode(), 'Test Mail')
            self.assertIn('This is a test mail from DUMMY_SYSTEM_NAME',
                          messages[0].html.decode())


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
            feconf.EMAIL_INTENT_MARKETING: (True, True, False, False),
            feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION: (
                True, True, True, False),
            feconf.EMAIL_INTENT_DELETE_EXPLORATION: (
                True, True, True, False),
        }

        for intent in expected_validation_results:
            for ind, sender_id in enumerate(sender_ids_to_test):
                if expected_validation_results[intent][ind]:
                    email_manager.require_sender_id_is_valid(
                        intent, sender_id)
                else:
                    with self.assertRaisesRegexp(
                        Exception, 'Invalid sender_id'
                        ):
                        email_manager.require_sender_id_is_valid(
                            intent, sender_id)

        # Also test null and invalid intent strings.
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                '', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                '', self.admin_id)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                'invalid_intent', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegexp(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                'invalid_intent', self.admin_id)


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
            'A', self.editor_id, title=self.EXPLORATION_TITLE)

        self.expected_email_subject = (
            '%s - invitation to collaborate') % self.EXPLORATION_TITLE

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_editor_role_email_ctx = self.swap(
            feconf, 'CAN_SEND_EDITOR_ROLE_EMAILS', True)
        self.can_not_send_editor_role_email_ctx = self.swap(
            feconf, 'CAN_SEND_EDITOR_ROLE_EMAILS', False)

    def test_role_email_is_sent_when_editor_assigns_role(self):
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            self.login(self.EDITOR_EMAIL)

            csrf_token = self.get_new_csrf_token()
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

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_OWNER,
                self.exploration.id, self.exploration.title)
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_can_send_editor_role_emails_is_false(self):
        with self.can_send_emails_ctx, self.can_not_send_editor_role_email_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_manager.ROLE_EDITOR,
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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
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

    def test_correct_rights_are_written_in_voice_artist_role_email_body(self):
        expected_email_html_body = (
            'Hi newuser,<br>'
            '<br>'
            '<b>editor</b> has granted you voice artist rights to their '
            'exploration, '
            '"<a href="https://www.oppia.org/create/A">Title</a>"'
            ', on Oppia.org.<br>'
            '<br>'
            'This allows you to:<br>'
            '<ul>'
            '<li>Voiceover the exploration</li><br>'
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
            'editor has granted you voice artist rights to their '
            'exploration, "Title", on Oppia.org.\n'
            '\n'
            'This allows you to:\n'
            '- Voiceover the exploration\n'
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
            # Check that correct email content is sent for Voice Artist.
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id,
                rights_manager.ROLE_VOICE_ARTIST, self.exploration.id,
                self.exploration.title)

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
            csrf_token = self.get_new_csrf_token()

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
            """Appends the error message to the logged errors list."""
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, log_new_error_ctx:
            self.assertEqual(log_new_error_counter.times_called, 0)

            self.login(self.EDITOR_EMAIL)
            csrf_token = self.get_new_csrf_token()

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
            """Appends the error message to the logged errors list."""
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, log_new_error_ctx:
            self.assertEqual(log_new_error_counter.times_called, 0)

            self.login(self.EDITOR_EMAIL)
            csrf_token = self.get_new_csrf_token()

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
            """Appends the error message to the logged errors list."""
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, log_new_error_ctx:
            self.assertEqual(log_new_error_counter.times_called, 0)

            self.login(self.EDITOR_EMAIL)
            csrf_token = self.get_new_csrf_token()

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
            csrf_token = self.get_new_csrf_token()

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
            csrf_token = self.get_new_csrf_token()

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
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': 'BadUsername!!!'
                },
                csrf_token=csrf_token, expected_status_int=400)

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
            csrf_token = self.get_new_csrf_token()

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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
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
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')
        self.new_email_subject = 'THIS IS A PLACEHOLDER.'
        self.new_email_html_body = 'Hi %s,<br><br>%s<br><br>%s' % (
            self.NEW_USER_USERNAME,
            'THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.',
            self.new_footer)

        def _generate_hash_for_tests(
                unused_cls, unused_recipient_id, unused_email_subject,
                unused_email_body):
            """Returns the generated hash for tests."""
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
            """Appends the error message to the logged errors list."""
            logged_errors.append(error_message)

        log_new_error_counter = test_utils.CallCounter(_log_error_for_tests)
        log_new_error_ctx = self.swap(
            email_manager, 'log_new_error', log_new_error_counter)

        with can_send_emails_ctx, duplicate_email_ctx, log_new_error_ctx:
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            cleaned_html_body = html_cleaner.clean(self.new_email_html_body)
            raw_plaintext_body = cleaned_html_body.replace(
                '<br/>', '\n').replace('<br>', '\n').replace(
                    '<li>', '<li>- ').replace('</p><p>', '</p>\n<p>')
            cleaned_plaintext_body = html_cleaner.strip_html_tags(
                raw_plaintext_body)
            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, self.new_email_subject,
                cleaned_plaintext_body, datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager.send_post_signup_email(
                self.new_user_id, test_for_duplicate_email=True)

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
            """Appends the error message to the logged errors list."""
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
                self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
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
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, self.new_email_subject,
                self.new_email_html_body, datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager.send_post_signup_email(
                self.new_user_id, test_for_duplicate_email=True)

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
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, '%s%s' % (
                    self.new_email_subject, 1), self.new_email_html_body,
                datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager.send_post_signup_email(
                self.new_user_id, test_for_duplicate_email=True)

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
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, self.new_email_subject,
                '%s%s' % (self.new_email_html_body, 1),
                datetime.datetime.utcnow())

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_manager.send_post_signup_email(
                self.new_user_id, test_for_duplicate_email=True)

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
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, self.new_email_subject,
                self.new_email_html_body, email_sent_time)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_sent_time = (datetime.datetime.utcnow() -
                               datetime.timedelta(minutes=2))

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, self.new_email_subject,
                self.new_email_html_body, email_sent_time)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 2)

            email_manager.send_post_signup_email(
                self.new_user_id, test_for_duplicate_email=True)

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
            'A', self.editor_id, title='Title')

        self.expected_email_subject = (
            'You\'ve received 3 new messages on your explorations')

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.can_not_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)

    def test_email_not_sent_if_can_send_emails_is_false(self):
        feedback_messages = {
            self.exploration.id: {
                'title': self.exploration.title,
                'messages': ['Message 1.1', 'Message 1.2', 'Message 1.3']}
        }
        with self.can_not_send_emails_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

        # Check that email is not sent.
        messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_can_send_feedback_message_emails_is_false(self):
        feedback_messages = {
            self.exploration.id: {
                'title': self.exploration.title,
                'messages': ['Message 1.1', 'Message 1.2', 'Message 1.3']}
        }
        with self.can_send_emails_ctx, self.can_not_send_feedback_email_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

        # Check that email is not sent.
        messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_feedback_messages_are_empty(self):
        feedback_messages = {}
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

        # Check that email is not sent.
        messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

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
            '<a href="https://www.oppia.org/creator-dashboard">dashboard</a>.'
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

            # Check that email body is correct.
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

            # Check that email model is correct.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.recipient_id, self.editor_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.EDITOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION)
            self.assertEqual(
                sent_email_model.subject, self.expected_email_subject)


class SuggestionEmailTests(test_utils.GenericTestBase):
    def setUp(self):
        super(SuggestionEmailTests, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.recipient_list = [self.editor_id]

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.can_not_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_suggestion_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.recipient_list)

        # Check that email is not sent.
        messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_can_send_feedback_message_emails_is_false(self):
        with self.can_send_emails_ctx, self.can_not_send_feedback_email_ctx:
            email_manager.send_suggestion_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.recipient_list)

        # Check that email is not sent.
        messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

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

            # Make sure correct email is sent.
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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_SUGGESTION_NOTIFICATION)


class SubscriptionEmailTests(test_utils.GenericTestBase):
    def setUp(self):
        super(SubscriptionEmailTests, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        subscription_services.subscribe_to_creator(
            self.new_user_id, self.editor_id)

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_subscription_email_ctx = self.swap(
            feconf, 'CAN_SEND_SUBSCRIPTION_EMAILS', True)
        self.can_not_send_subscription_email_ctx = self.swap(
            feconf, 'CAN_SEND_SUBSCRIPTION_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_emails_to_subscribers(
                self.editor_id, self.exploration.id, self.exploration.title)

        messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_can_send_subscription_emails_is_false(self):
        with self.can_send_emails_ctx, self.can_not_send_subscription_email_ctx:
            email_manager.send_emails_to_subscribers(
                self.editor_id, self.exploration.id, self.exploration.title)

        messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
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
            'A', self.editor_id, title='Title')
        self.recipient_list = [self.editor_id]

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.can_not_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)

    def test_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_instant_feedback_message_email(
                self.new_user_id, self.editor_id, 'editor message',
                'New Oppia message in "a subject"', self.exploration.title,
                self.exploration.id, 'a subject')

        # Make sure correct email is sent.
        messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_can_send_feedback_message_emails_is_false(self):
        with self.can_send_emails_ctx, self.can_not_send_feedback_email_ctx:
            email_manager.send_instant_feedback_message_email(
                self.new_user_id, self.editor_id, 'editor message',
                'New Oppia message in "a subject"', self.exploration.title,
                self.exploration.id, 'a subject')

        # Make sure correct email is sent.
        messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
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
            'A', self.editor_id, title='Title')
        self.owner_ids = [self.editor_id]

        self.report_text = 'AD'

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_flag_exploration_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.report_text)

        # Make sure correct email is sent.
        messages = self.mail_stub.get_sent_messages(to=self.MODERATOR_EMAIL)
        self.assertEqual(len(messages), 0)

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
            sent_email_model = python_utils.NEXT(
                m for m in all_models if m.recipient_id == self.moderator_id)
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_email, self.MODERATOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_REPORT_BAD_CONTENT)
            sent_email_model = python_utils.NEXT(
                m for m in all_models if m.recipient_id == self.moderator2_id)
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_email, self.moderator2_email)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_REPORT_BAD_CONTENT)


class OnboardingReviewerInstantEmailTests(test_utils.GenericTestBase):
    """Test that correct email is sent while onboarding reviewers."""
    REVIEWER_USERNAME = 'reviewer'
    REVIEWER_EMAIL = 'reviewer@example.com'

    def setUp(self):
        super(OnboardingReviewerInstantEmailTests, self).setUp()
        self.signup(self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_id, True, False, False, False)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_mail_to_onboard_new_reviewers(
                self.reviewer_id, 'Algebra')

        # Make sure correct email is sent.
        messages = self.mail_stub.get_sent_messages(to=self.REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_correct_completion_email_is_sent(self):
        expected_email_subject = 'Invitation to review suggestions'
        expected_email_html_body = (
            'Hi reviewer,<br><br>'
            'Thank you for actively contributing high-quality suggestions for '
            'Oppia\'s lessons in Algebra, and for helping to make these lessons'
            ' better for students around the world!<br><br>'
            'In recognition of your contributions, we would like to invite you'
            ' to become one of Oppia\'s reviewers. As a reviewer, you will be '
            'able to review suggestions in Algebra, and contribute to helping '
            'ensure that any edits made to lessons preserve the lessons\' '
            'quality and are beneficial for students.<br><br>'
            'If you\'d like to help out as a reviewer, please visit your '
            '<a href="https://www.oppia.org/creator-dashboard/">dashboard</a>. '
            'and set your review preferences accordingly. Note that, if you '
            'accept,you will receive occasional emails inviting you to review '
            'incoming suggestions by others.<br><br>'
            'Again, thank you for your contributions to the Oppia '
            'community!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_mail_to_onboard_new_reviewers(
                self.reviewer_id, 'Algebra')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_ONBOARD_REVIEWER)


class NotifyReviewerInstantEmailTests(test_utils.GenericTestBase):
    """Test that correct email is sent while notifying reviewers."""
    REVIEWER_USERNAME = 'reviewer'
    REVIEWER_EMAIL = 'reviewer@example.com'

    def setUp(self):
        super(NotifyReviewerInstantEmailTests, self).setUp()
        self.signup(self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_id, True, False, False, False)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_mail_to_notify_users_to_review(
                self.reviewer_id, 'Algebra')

        messages = self.mail_stub.get_sent_messages(to=self.REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_correct_completion_email_is_sent(self):
        expected_email_subject = 'Notification to review suggestions'
        expected_email_html_body = (
            'Hi reviewer,<br><br>'
            'Just a heads-up that there are new suggestions to '
            'review in Algebra, which you are registered as a reviewer for.'
            '<br><br>Please take a look at and accept/reject these suggestions '
            'at your earliest convenience. You can visit your '
            '<a href="https://www.oppia.org/creator-dashboard/">dashboard</a> '
            'to view the list of suggestions that need a review.<br><br>'
            'Thank you for helping improve Oppia\'s lessons!'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_users_to_review(
                self.reviewer_id, 'Algebra')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_REVIEW_SUGGESTIONS)


class QueryStatusNotificationEmailTests(test_utils.GenericTestBase):
    """Test that email is send to submitter when query has completed
    or failed.
    """
    SUBMITTER_USERNAME = 'submit'
    SUBMITTER_EMAIL = 'submit@example.com'
    SENDER_USERNAME = 'sender'
    SENDER_EMAIL = 'sender@example.com'
    RECIPIENT_A_EMAIL = 'a@example.com'
    RECIPIENT_A_USERNAME = 'usera'
    RECIPIENT_B_EMAIL = 'b@example.com'
    RECIPIENT_B_USERNAME = 'userb'

    def setUp(self):
        super(QueryStatusNotificationEmailTests, self).setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(self.SUBMITTER_EMAIL)
        self.signup(self.SENDER_EMAIL, self.SENDER_USERNAME)
        self.sender_id = self.get_user_id_from_email(self.SENDER_EMAIL)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.signup(self.RECIPIENT_A_EMAIL, self.RECIPIENT_A_USERNAME)
        self.signup(self.RECIPIENT_B_EMAIL, self.RECIPIENT_B_USERNAME)
        self.set_admins([self.SENDER_USERNAME, ])
        self.recipient_a_id = self.get_user_id_from_email(
            self.RECIPIENT_A_EMAIL)
        self.recipient_b_id = self.get_user_id_from_email(
            self.RECIPIENT_B_EMAIL)
        self.recipient_ids = [self.recipient_a_id, self.recipient_b_id]

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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
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
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
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

    def test_send_user_query_email(self):
        email_subject = 'Bulk Email User Query Subject'
        email_body = 'Bulk Email User Query Body'
        email_intent = feconf.BULK_EMAIL_INTENT_MARKETING
        with self.can_send_emails_ctx:
            email_manager.send_user_query_email(
                self.sender_id, self.recipient_ids,
                email_subject,
                email_body,
                email_intent)
            messages_a = self.mail_stub.get_sent_messages(
                to=self.RECIPIENT_A_EMAIL)
            self.assertEqual(len(messages_a), 1)

            messages_b = self.mail_stub.get_sent_messages(
                to=self.RECIPIENT_B_EMAIL)
            self.assertEqual(len(messages_b), 1)

            # Make sure correct email model is stored.
            all_models = email_models.BulkEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, email_subject)
            self.assertEqual(
                sent_email_model.recipient_ids, self.recipient_ids)
            self.assertEqual(
                sent_email_model.sender_id, self.sender_id)
            self.assertEqual(
                sent_email_model.sender_email,
                '%s <%s>' % (self.SENDER_USERNAME, self.SENDER_EMAIL))
            self.assertEqual(
                sent_email_model.intent,
                email_intent)


class VoiceoverApplicationEmailUnitTest(test_utils.GenericTestBase):
    """Unit test related to voiceover application emails."""
    APPLICANT_USERNAME = 'applicant'
    APPLICANT_EMAIL = 'applicant@example.com'

    def setUp(self):
        super(VoiceoverApplicationEmailUnitTest, self).setUp()
        self.signup(self.APPLICANT_EMAIL, self.APPLICANT_USERNAME)
        self.applicant_id = self.get_user_id_from_email(self.APPLICANT_EMAIL)
        user_services.update_email_preferences(
            self.applicant_id, True, False, False, False)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_accepted_voiceover_application_email(
                self.applicant_id, 'Lesson to voiceover', 'en')

        messages = self.mail_stub.get_sent_messages(to=self.APPLICANT_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_correct_accepted_voiceover_application_email_is_sent(self):
        expected_email_subject = (
            '[Accepted] Updates on submitted voiceover application')
        expected_email_html_body = (
            'Hi applicant,<br><br>'
            'Congratulations! Your voiceover application for '
            '"Lesson to voiceover" lesson got accepted and you have been '
            'assigned with a voice artist role in the lesson. Now you will be '
            'able to add voiceovers to the lesson in English '
            'language.'
            '<br><br>You can check the wiki page to learn'
            '<a href="https://github.com/oppia/oppia/wiki/'
            'Instructions-for-voice-artists">how to voiceover a lesson</a>'
            '<br><br>'
            'Thank you for helping improve Oppia\'s lessons!'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_accepted_voiceover_application_email(
                self.applicant_id, 'Lesson to voiceover', 'en')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.APPLICANT_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.applicant_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.APPLICANT_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_VOICEOVER_APPLICATION_UPDATES)

    def test_that_correct_rejected_voiceover_application_email_is_sent(self):
        expected_email_subject = 'Updates on submitted voiceover application'
        expected_email_html_body = (
            'Hi applicant,<br><br>'
            'Your voiceover application for "Lesson to voiceover" lesson in '
            'language English got rejected and the reviewer has left a message.'
            '<br><br>Review message: A rejection message!<br><br>'
            'You can create a new voiceover application through the'
            '<a href="https://oppia.org/community-dashboard">'
            'community dashboard</a> page.<br><br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_rejected_voiceover_application_email(
                self.applicant_id, 'Lesson to voiceover', 'en',
                'A rejection message!')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.APPLICANT_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.applicant_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.APPLICANT_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_VOICEOVER_APPLICATION_UPDATES)


class AccountDeletionEmailUnitTest(test_utils.GenericTestBase):
    """Unit test related to account deletion application emails."""
    APPLICANT_USERNAME = 'applicant'
    APPLICANT_EMAIL = 'applicant@example.com'

    def setUp(self):
        super(AccountDeletionEmailUnitTest, self).setUp()
        self.signup(self.APPLICANT_EMAIL, self.APPLICANT_USERNAME)
        self.applicant_id = self.get_user_id_from_email(self.APPLICANT_EMAIL)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_account_deleted_email(
                self.applicant_id, self.APPLICANT_EMAIL)

        messages = self.mail_stub.get_sent_messages(to=self.APPLICANT_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_correct_account_deleted_email_is_sent(self):
        expected_email_subject = 'Account deleted'
        expected_email_html_body = (
            'Hi applicant@example.com,<br><br>'
            'Your account was successfully deleted.'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_account_deleted_email(
                self.applicant_id, self.APPLICANT_EMAIL)

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(to=self.APPLICANT_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.applicant_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.APPLICANT_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_ACCOUNT_DELETED)


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
            email_manager.send_user_query_email(
                self.sender_id, self.recipient_ids, email_subject,
                email_html_body, feconf.BULK_EMAIL_INTENT_MARKETING)

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

    def test_email_not_sent_if_original_html_not_matches_cleaned_html(self):
        email_subject = 'Dummy Email Subject'
        email_html_body = 'Dummy email body.<td>'

        with self.can_send_emails_ctx:
            email_manager.send_user_query_email(
                self.sender_id, self.recipient_ids,
                email_subject, email_html_body,
                feconf.BULK_EMAIL_INTENT_MARKETING)

        # Check that no email was sent.
        messages_a = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 0)

        messages_b = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 0)

    def test_that_exception_is_raised_for_unauthorised_sender(self):
        with self.can_send_emails_ctx, self.assertRaisesRegexp(
            Exception, 'Invalid sender_id for email'):
            email_manager.send_user_query_email(
                self.fake_sender_id, self.recipient_ids, 'email_subject',
                'email_html_body', feconf.BULK_EMAIL_INTENT_MARKETING)

        messages_a = self.mail_stub.get_sent_messages(to=self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 0)

        messages_b = self.mail_stub.get_sent_messages(to=self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 0)

        all_models = email_models.BulkEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 0)

    def test_that_test_email_is_sent_for_bulk_emails(self):
        email_subject = 'Test Subject'
        email_body = 'Test Body'
        with self.can_send_emails_ctx:
            email_manager.send_test_email_for_bulk_emails(
                self.sender_id, email_subject, email_body
            )
        messages = self.mail_stub.get_sent_messages(to=self.SENDER_EMAIL)
        self.assertEqual(len(messages), 1)


class EmailPreferencesTests(test_utils.GenericTestBase):

    def test_can_users_receive_thread_email(self):
        gae_ids = ('someUser1', 'someUser2')
        exp_id = 'someExploration'
        usernames = ('username1', 'username2')
        emails = ('user1@example.com', 'user2@example.com')

        user_ids = []
        for user_id, username, user_email in python_utils.ZIP(
                gae_ids, usernames, emails):
            user_settings = user_services.create_new_user(user_id, user_email)
            user_ids.append(user_settings.user_id)
            user_services.set_username(user_settings.user_id, username)

        # Both users can receive all emails in default setting.
        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [True, True])
        self.assertTrue(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), msg=[True, True])

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
            user_ids, exp_id, False), msg=[False, False])

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
            user_ids, exp_id, False), msg=[False, False])

        # Both user have enabled all emails globally, therefore they should
        # receive all emails.
        for user_id in user_ids:
            user_services.update_email_preferences(
                user_id, True, True, True, True)

        self.assertListEqual(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, True), [True, True])
        self.assertTrue(email_manager.can_users_receive_thread_email(
            user_ids, exp_id, False), msg=[True, True])


class ModeratorActionEmailsTests(test_utils.GenericTestBase):
    MODERATOR_EMAIL = 'moderator@example.com'
    MODERATOR_USERNAME = 'moderator'
    RECIPIENT_EMAIL = 'a@example.com'
    RECIPIENT_USERNAME = 'usera'

    def setUp(self):
        super(ModeratorActionEmailsTests, self).setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.signup(self.RECIPIENT_EMAIL, self.RECIPIENT_USERNAME)
        self.recipient_id = self.get_user_id_from_email(
            self.RECIPIENT_EMAIL)
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_email_moderator_action_ctx = self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True)

    def test_exception_raised_if_email_on_moderator_action_is_false(self):
        with self.assertRaisesRegexp(
            Exception,
            'For moderator emails to be sent, please ensure that '
            'REQUIRE_EMAIL_ON_MODERATOR_ACTION is set to True.'):
            email_manager.require_moderator_email_prereqs_are_satisfied()

    def test_exception_raised_if_can_send_emails_is_false(self):
        with self.can_send_email_moderator_action_ctx, self.assertRaisesRegexp(
            Exception,
            'For moderator emails to be sent, please ensure that '
            'CAN_SEND_EMAILS is set to True.'):
            email_manager.require_moderator_email_prereqs_are_satisfied()

    def test_correct_email_draft_received_on_exploration_unpublish(self):
        expected_draft_text_body = ('I\'m writing to inform you that '
                                    'I have unpublished the above exploration.')
        with self.can_send_emails_ctx, self.can_send_email_moderator_action_ctx:
            d_text = email_manager.get_moderator_unpublish_exploration_email()
            self.assertEqual(d_text, expected_draft_text_body)

    def test_blank_draft_received_exploration_unpublish_exception_raised(self):
        expected_draft_text_body = ''
        with self.can_not_send_emails_ctx:
            d_text = email_manager.get_moderator_unpublish_exploration_email()
            self.assertEqual(d_text, expected_draft_text_body)

    def test_correct_moderator_action_email_sent(self):
        email_intent = 'unpublish_exploration'
        exploration_title = 'Title'
        email_html_body = 'Dummy email body.<br>'
        with self.can_send_emails_ctx, self.can_send_email_moderator_action_ctx:
            email_manager.send_moderator_action_email(
                self.moderator_id, self.recipient_id,
                email_intent, exploration_title, email_html_body)
        messages = self.mail_stub.get_sent_messages(to=self.RECIPIENT_EMAIL)
        self.assertEqual(len(messages), 1)


class CommunityReviewerEmailTest(test_utils.GenericTestBase):
    """Test for assignment and removal of reviewer in community."""
    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        super(CommunityReviewerEmailTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.translation_reviewer_id, True, False, False, False)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.voiceover_reviewer_id, True, False, False, False)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.question_reviewer_id, True, False, False, False)

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_assign_translation_reviewer_email_for_can_send_emails_is_false(
            self):
        with self.can_not_send_emails_ctx:
            email_manager.send_email_to_new_community_reviewer(
                self.translation_reviewer_id,
                constants.REVIEW_CATEGORY_TRANSLATION, language_code='hi')

        messages = self.mail_stub.get_sent_messages(
            to=self.TRANSLATION_REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_assign_translation_reviewer_email_for_invalid_review_category(
            self):
        with self.assertRaisesRegexp(Exception, 'Invalid review_category'):
            email_manager.send_email_to_new_community_reviewer(
                self.translation_reviewer_id, 'invalid_category')

    def test_schema_of_new_reviewer_email_data_constant(self):
        self.assertEqual(sorted(email_manager.NEW_REVIEWER_EMAIL_DATA.keys()), [
            constants.REVIEW_CATEGORY_QUESTION,
            constants.REVIEW_CATEGORY_TRANSLATION,
            constants.REVIEW_CATEGORY_VOICEOVER])
        for category_details in email_manager.NEW_REVIEWER_EMAIL_DATA.values():
            self.assertEqual(len(category_details), 4)
            self.assertTrue(
                'description' in category_details or (
                    'description_template' in category_details))
            self.assertTrue('review_category' in category_details)
            self.assertTrue(
                'rights_message' in category_details or (
                    'rights_message_template' in category_details))
            self.assertTrue('to_check' in category_details)

    def test_send_assigned_translation_reviewer_email(self):
        expected_email_subject = (
            'You have been invited to review Oppia translations')
        expected_email_html_body = (
            'Hi translator,<br><br>'
            'This is to let you know that the Oppia team has added you as a '
            'reviewer for Hindi language translations. This allows you to '
            'review translation suggestions made by contributors in the '
            'Hindi language.<br><br>'
            'You can check the translation suggestions waiting for review in '
            'the <a href="https://www.oppia.org/community-dashboard">'
            'Community Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_new_community_reviewer(
                self.translation_reviewer_id,
                constants.REVIEW_CATEGORY_TRANSLATION, language_code='hi')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(
                to=self.TRANSLATION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.translation_reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email,
                self.TRANSLATION_REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_ONBOARD_REVIEWER)

    def test_send_assigned_voiceover_reviewer_email(self):
        expected_email_subject = (
            'You have been invited to review Oppia voiceovers')
        expected_email_html_body = (
            'Hi voiceartist,<br><br>'
            'This is to let you know that the Oppia team has added you as a '
            'reviewer for Hindi language voiceovers. This allows you to '
            'review voiceover applications made by contributors in the '
            'Hindi language.<br><br>'
            'You can check the voiceover applications waiting for review in '
            'the <a href="https://www.oppia.org/community-dashboard">'
            'Community Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_new_community_reviewer(
                self.voiceover_reviewer_id,
                constants.REVIEW_CATEGORY_VOICEOVER, language_code='hi')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(
                to=self.VOICEOVER_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.voiceover_reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email,
                self.VOICEOVER_REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_ONBOARD_REVIEWER)

    def test_send_assigned_question_reviewer_email(self):
        expected_email_subject = (
            'You have been invited to review Oppia questions')
        expected_email_html_body = (
            'Hi question,<br><br>'
            'This is to let you know that the Oppia team has added you as a '
            'reviewer for questions. This allows you to review question '
            'suggestions made by contributors.<br><br>'
            'You can check the question suggestions waiting for review in the '
            '<a href="https://www.oppia.org/community-dashboard">'
            'Community Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_new_community_reviewer(
                self.question_reviewer_id,
                constants.REVIEW_CATEGORY_QUESTION, language_code='hi')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(
                to=self.QUESTION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.question_reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.QUESTION_REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_ONBOARD_REVIEWER)

    def test_email_is_not_sent_can_send_emails_is_false(self):
        with self.can_not_send_emails_ctx:
            email_manager.send_email_to_removed_community_reviewer(
                self.translation_reviewer_id,
                constants.REVIEW_CATEGORY_TRANSLATION, language_code='hi')

        messages = self.mail_stub.get_sent_messages(
            to=self.TRANSLATION_REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_remove_translation_reviewer_email_for_invalid_review_category(
            self):
        with self.assertRaisesRegexp(Exception, 'Invalid review_category'):
            email_manager.send_email_to_removed_community_reviewer(
                self.translation_reviewer_id, 'invalid_category')

    def test_schema_of_removed_reviewer_email_data_constant(self):
        self.assertEqual(
            sorted(email_manager.REMOVED_REVIEWER_EMAIL_DATA.keys()), [
                constants.REVIEW_CATEGORY_QUESTION,
                constants.REVIEW_CATEGORY_TRANSLATION,
                constants.REVIEW_CATEGORY_VOICEOVER])
        for category_details in (
                email_manager.REMOVED_REVIEWER_EMAIL_DATA.values()):
            self.assertEqual(len(category_details), 4)
            self.assertTrue(
                'role_description' in category_details or (
                    'role_description_template' in category_details))
            self.assertTrue('review_category' in category_details)
            self.assertTrue(
                'rights_message' in category_details or (
                    'rights_message_template' in category_details))
            self.assertTrue('contribution_allowed' in category_details)

    def test_send_removed_translation_reviewer_email(self):
        expected_email_subject = (
            'You have been unassigned as a translation reviewer')
        expected_email_html_body = (
            'Hi translator,<br><br>'
            'The Oppia team has removed you from the translation reviewer role '
            'in the Hindi language. You won\'t be able to review translation '
            'suggestions made by contributors in the Hindi language any more, '
            'but you can still contribute translations through the '
            '<a href="https://www.oppia.org/community-dashboard">'
            'Community Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')


        with self.can_send_emails_ctx:
            email_manager.send_email_to_removed_community_reviewer(
                self.translation_reviewer_id,
                constants.REVIEW_CATEGORY_TRANSLATION, language_code='hi')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(
                to=self.TRANSLATION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.translation_reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email,
                self.TRANSLATION_REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_REMOVE_REVIEWER)

    def test_send_removed_voiceover_reviewer_email(self):
        expected_email_subject = (
            'You have been unassigned as a voiceover reviewer')
        expected_email_html_body = (
            'Hi voiceartist,<br><br>'
            'The Oppia team has removed you from the voiceover reviewer role '
            'in the Hindi language. You won\'t be able to review voiceover '
            'applications made by contributors in the Hindi language any more, '
            'but you can still contribute voiceovers through the '
            '<a href="https://www.oppia.org/community-dashboard">'
            'Community Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')


        with self.can_send_emails_ctx:
            email_manager.send_email_to_removed_community_reviewer(
                self.voiceover_reviewer_id,
                constants.REVIEW_CATEGORY_VOICEOVER, language_code='hi')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(
                to=self.VOICEOVER_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.voiceover_reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.VOICEOVER_REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_REMOVE_REVIEWER)

    def test_send_removed_question_reviewer_email(self):
        expected_email_subject = (
            'You have been unassigned as a question reviewer')
        expected_email_html_body = (
            'Hi question,<br><br>'
            'The Oppia team has removed you from the question reviewer role. '
            'You won\'t be able to review question suggestions made by '
            'contributors any more, but you can still contribute questions '
            'through the <a href="https://www.oppia.org/community-dashboard">'
            'Community Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')


        with self.can_send_emails_ctx:
            email_manager.send_email_to_removed_community_reviewer(
                self.question_reviewer_id, constants.REVIEW_CATEGORY_QUESTION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self.mail_stub.get_sent_messages(
                to=self.QUESTION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(), expected_email_html_body)

            # Make sure correct email model is stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.question_reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.QUESTION_REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_REMOVE_REVIEWER)
