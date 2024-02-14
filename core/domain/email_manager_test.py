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

from __future__ import annotations

import datetime
import logging
import types

from core import feconf
from core.constants import constants
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import html_cleaner
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry
from core.domain import platform_parameter_services
from core.domain import question_domain
from core.domain import rights_domain
from core.domain import story_domain
from core.domain import subscription_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import translation_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import (
    Callable, DefaultDict, Dict, Final, List, Optional, Sequence, Set, Type,
    Union)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import email_models
    from mypy_imports import secrets_services
    from mypy_imports import suggestion_models

(email_models, suggestion_models) = models.Registry.import_models(
    [models.Names.EMAIL, models.Names.SUGGESTION])
secrets_services = models.Registry.import_secrets_services()


class FailedMLTest(test_utils.EmailTestBase):
    """Test that email functionality for sending failed ML Job emails
    works.
    """

    def setUp(self) -> None:
        super().setUp()
        self.ADMIN_USERNAME = 'admusername'
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.signup(
            feconf.ADMIN_EMAIL_ADDRESS, self.ADMIN_USERNAME, True)
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

    def test_send_failed_ml_email(self) -> None:
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            # Make sure there are no emails already sent.
            messages = self._get_sent_email_messages(feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)

            # Send job failure email with mock Job ID.
            email_manager.send_job_failure_email('123ABC')

            # Make sure emails are sent.
            messages = self._get_sent_email_messages(feconf.ADMIN_EMAIL_ADDRESS)
            expected_subject = 'Failed ML Job'
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].subject, expected_subject)


class EmailToAdminTest(test_utils.EmailTestBase):
    """Test that emails are correctly sent to the admin."""

    def test_email_to_admin_is_sent_correctly(self) -> None:
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
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)

            # Send an email to admin.
            email_manager.send_mail_to_admin('Dummy Subject', 'Dummy Body')

            # Make sure emails are sent.
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].sender, 'DUMMY_SYSTEM_NAME <dummy@system.com>')
            self.assertEqual(messages[0].to, ['admin@system.com'])
            self.assertEqual(messages[0].subject, 'Dummy Subject')
            self.assertIn('Dummy Body', messages[0].html)


class DummyMailTest(test_utils.EmailTestBase):
    """Test that emails are correctly sent to the testing email id."""

    def test_sending_emails(self) -> None:
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
            messages = self._get_sent_email_messages(
                dummy_receiver_address)
            self.assertEqual(len(messages), 0)

            # Send an email.
            email_manager.send_dummy_mail_to_admin(dummy_system_name)

            # Make sure emails are sent.
            messages = self._get_sent_email_messages(dummy_receiver_address)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].sender, 'DUMMY_SYSTEM_NAME <dummy@system.com>')
            self.assertEqual(messages[0].to, [dummy_receiver_address])
            self.assertEqual(messages[0].subject, 'Test Mail')
            self.assertIn(
                'This is a test mail from DUMMY_SYSTEM_NAME', messages[0].html)


class EmailRightsTest(test_utils.GenericTestBase):
    """Test that only certain users can send certain types of emails."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_sender_id_validation(self) -> None:
        sender_ids_to_test = [
            feconf.SYSTEM_COMMITTER_ID, self.admin_id, self.moderator_id,
            self.editor_id]

        # These are given in the order of user_ids_to_test.
        expected_validation_results = {
            feconf.EMAIL_INTENT_SIGNUP: (True, False, False, False),
            feconf.EMAIL_INTENT_DAILY_BATCH: (True, False, False, False),
            feconf.EMAIL_INTENT_MARKETING: (True, False, False, False),
            feconf.EMAIL_INTENT_UNPUBLISH_EXPLORATION: (
                True, False, True, False),
            feconf.EMAIL_INTENT_DELETE_EXPLORATION: (
                True, False, True, False),
        }

        for intent, results in expected_validation_results.items():
            for ind, sender_id in enumerate(sender_ids_to_test):
                if results[ind]:
                    email_manager.require_sender_id_is_valid(
                        intent, sender_id)
                else:
                    with self.assertRaisesRegex(
                        Exception, 'Invalid sender_id'
                    ):
                        email_manager.require_sender_id_is_valid(
                            intent, sender_id)

        # Also test null and invalid intent strings.
        with self.assertRaisesRegex(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                '', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegex(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                '', self.admin_id)
        with self.assertRaisesRegex(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                'invalid_intent', feconf.SYSTEM_COMMITTER_ID)
        with self.assertRaisesRegex(Exception, 'Invalid email intent string'):
            email_manager.require_sender_id_is_valid(
                'invalid_intent', self.admin_id)


class ExplorationMembershipEmailTests(test_utils.EmailTestBase):
    """Tests that sending exploration membership email works as expected."""

    EXPLORATION_TITLE: Final = 'Title'

    def setUp(self) -> None:
        super().setUp()

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

    def test_role_email_is_sent_when_editor_assigns_role(self) -> None:
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            self.login(self.EDITOR_EMAIL)

            csrf_token = self.get_new_csrf_token()
            self.put_json('%s/%s' % (
                feconf.EXPLORATION_RIGHTS_PREFIX, self.exploration.id), {
                    'version': self.exploration.version,
                    'new_member_username': self.NEW_USER_USERNAME,
                    'new_member_role': rights_domain.ROLE_EDITOR,
                }, csrf_token=csrf_token)

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

    def test_email_is_not_sent_if_recipient_has_declined_such_emails(
        self
    ) -> None:
        user_services.update_email_preferences(
            self.new_user_id, True, False, False, False)

        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_domain.ROLE_OWNER,
                self.exploration.id, self.exploration.title)

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_domain.ROLE_OWNER,
                self.exploration.id, self.exploration.title)
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_can_send_editor_role_emails_is_false(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.can_not_send_editor_role_email_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id,
                rights_domain.ROLE_EDITOR, self.exploration.id,
                self.exploration.title)
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_role_emails_sent_are_correct(self) -> None:
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            email_manager.send_role_notification_email(
                self.editor_id, self.new_user_id, rights_domain.ROLE_VIEWER,
                self.exploration.id, self.exploration.title)

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            sent_email_model = all_models[0]

            # Check that email details are correct.
            self.assertEqual(sent_email_model.recipient_id, self.new_user_id)
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
                sent_email_model.subject, self.expected_email_subject)

    def test_correct_rights_are_written_in_manager_role_email_body(
        self
    ) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
                self.editor_id, self.new_user_id, rights_domain.ROLE_OWNER,
                self.exploration.id, self.exploration.title)

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_correct_rights_are_written_in_editor_role_email_body(
        self
    ) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
                self.editor_id, self.new_user_id, rights_domain.ROLE_EDITOR,
                self.exploration.id, self.exploration.title)

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_correct_rights_are_written_in_playtester_role_email_body(
        self
    ) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
                self.editor_id, self.new_user_id, rights_domain.ROLE_VIEWER,
                self.exploration.id, self.exploration.title)

            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)

            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

    def test_correct_undefined_role_raises_an_exception(self) -> None:
        with self.can_send_emails_ctx, self.can_send_editor_role_email_ctx:
            # Check that an exception is raised when an invalid
            # role is supplied.
            with self.assertRaisesRegex(Exception, 'Invalid role'):
                email_manager.send_role_notification_email(
                    self.editor_id, self.new_user_id, rights_domain.ROLE_NONE,
                    self.exploration.id, self.exploration.title)


class SignupEmailTests(test_utils.EmailTestBase):
    """Test that signup-email sending functionality works as expected."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.new_footer = (
            'Unsubscribe from emails at your '
            '<a href="https://www.site.com/prefs">Preferences page</a>.')
        self.new_email_subject_content = 'Welcome!'
        self.new_email_body_content = (
            'Here is some HTML text.<br>'
            'With a <b>bold</b> bit and an <i>italic</i> bit.<br>')

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

    def _set_signup_email_content_platform_parameter(
        self,
        new_email_subject_content: str,
        new_email_body_content: str
    ) -> None:
        """Sets email content platform parameters.

        Args:
            new_email_subject_content: str. The email subject.
            new_email_body_content: str. The email body.
        """
        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.SIGNUP_EMAIL_SUBJECT_CONTENT.name,
            self.admin_id,
            'Updating email subject.',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Web']
                            ],
                        }
                    ],
                    'value_when_matched': new_email_subject_content
                })
            ],
            email_manager.SIGNUP_EMAIL_SUBJECT_CONTENT.default_value
        )
        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.SIGNUP_EMAIL_BODY_CONTENT.name,
            self.admin_id,
            'Updating email body.',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Web']
                            ],
                        }
                    ],
                    'value_when_matched': new_email_body_content
                })
            ],
            email_manager.SIGNUP_EMAIL_BODY_CONTENT.default_value
        )

    def _reset_signup_email_content_platform_parameters(self) -> None:
        """Resets email content platform parameters."""
        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.SIGNUP_EMAIL_SUBJECT_CONTENT.name,
            self.admin_id,
            'Resetting email subject.',
            [],
            email_manager.SIGNUP_EMAIL_SUBJECT_CONTENT.default_value
        )
        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.SIGNUP_EMAIL_BODY_CONTENT.name,
            self.admin_id,
            'Resetting email body.',
            [],
            email_manager.SIGNUP_EMAIL_BODY_CONTENT.default_value
        )

    def _reset_the_email_platform_params_value(self) -> None:
        """Resets the email name and footer platform parameters."""
        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.EMAIL_SENDER_NAME.name,
            self.admin_id,
            'Reset the sender name to default',
            [],
            email_manager.EMAIL_SENDER_NAME.default_value
        )

        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.EMAIL_FOOTER.name,
            self.admin_id,
            'Reset the email footer to default',
            [],
            email_manager.EMAIL_FOOTER.default_value
        )

    def test_email_not_sent_if_config_does_not_permit_it(self) -> None:
        swap_get_platform_parameter_value_return_email_footer = (
            self.swap_to_always_return(
                platform_parameter_services,
                'get_platform_parameter_value',
                self.new_footer
            )
        )
        with swap_get_platform_parameter_value_return_email_footer, self.swap(
            feconf, 'CAN_SEND_EMAILS', False
        ):
            self._set_signup_email_content_platform_parameter(
                self.new_email_subject_content, self.new_email_body_content)
            self.login(self.EDITOR_EMAIL)
            self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )

            # Check that no email was sent.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))
            self._reset_signup_email_content_platform_parameters()

    def test_email_not_sent_if_content_parameter_is_not_modified(self) -> None:
        can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        log_new_error_counter = test_utils.CallCounter(logging.error)
        log_new_error_ctx = self.swap(
            logging, 'error', log_new_error_counter)

        with self.capture_logging(min_level=logging.ERROR) as logs:
            with can_send_emails_ctx, log_new_error_ctx:
                self.assertEqual(log_new_error_counter.times_called, 0)

                self.login(self.EDITOR_EMAIL)
                self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
                csrf_token = self.get_new_csrf_token()

                # No user-facing error should surface.
                self.post_json(
                    feconf.SIGNUP_DATA_URL,
                    {
                        'agreed_to_terms': True,
                        'username': self.EDITOR_USERNAME,
                        'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                        'can_receive_email_updates': (
                            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                        )
                    },
                    csrf_token=csrf_token
                )

                # However, an error should be recorded in the logs.
                self.assertEqual(log_new_error_counter.times_called, 1)
                self.assertEqual(
                    logs[0],
                    'Please ensure that the value for the admin platform '
                    'property SIGNUP_EMAIL_SUBJECT_CONTENT is set, before '
                    'allowing post-signup emails to be sent.'
                )

                # Check that no email was sent.
                messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
                self.assertEqual(0, len(messages))

    def test_email_not_sent_if_content_config_is_partially_modified(
        self
    ) -> None:
        can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        platform_parameter_registry.Registry.update_platform_parameter(
            email_manager.SIGNUP_EMAIL_SUBJECT_CONTENT.name,
            self.admin_id,
            'Updating email subject.',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Web']
                            ],
                        }
                    ],
                    'value_when_matched': self.new_email_subject_content
                })
            ],
            email_manager.SIGNUP_EMAIL_SUBJECT_CONTENT.default_value
        )

        log_new_error_counter = test_utils.CallCounter(logging.error)
        log_new_error_ctx = self.swap(
            logging, 'error', log_new_error_counter)

        with self.capture_logging(min_level=logging.ERROR) as logs:
            with can_send_emails_ctx, log_new_error_ctx:
                self.assertEqual(log_new_error_counter.times_called, 0)

                self.login(self.EDITOR_EMAIL)
                self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
                csrf_token = self.get_new_csrf_token()

                # No user-facing error should surface.
                self.post_json(
                    feconf.SIGNUP_DATA_URL,
                    {
                        'agreed_to_terms': True,
                        'username': self.EDITOR_USERNAME,
                        'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                        'can_receive_email_updates': (
                            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                        )
                    },
                    csrf_token=csrf_token
                )

                # However, an error should be recorded in the logs.
                self.assertEqual(log_new_error_counter.times_called, 1)
                self.assertEqual(
                    logs[0],
                    'Please ensure that the value for the admin platform '
                    'property SIGNUP_EMAIL_BODY_CONTENT is set, before '
                    'allowing post-signup emails to be sent.'
                )

                # Check that no email was sent.
                messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
                self.assertEqual(0, len(messages))
        self._reset_signup_email_content_platform_parameters()

    def test_email_with_bad_content_is_not_sent(self) -> None:
        can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self._set_signup_email_content_platform_parameter(
            'New email subject', 'New HTML body.<script>alert(3);</script>')

        log_new_error_counter = test_utils.CallCounter(logging.error)
        log_new_error_ctx = self.swap(
            logging, 'error', log_new_error_counter)

        with self.capture_logging(min_level=logging.ERROR) as logs:
            with can_send_emails_ctx, log_new_error_ctx:
                self.assertEqual(log_new_error_counter.times_called, 0)

                self.login(self.EDITOR_EMAIL)
                self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
                csrf_token = self.get_new_csrf_token()

                # No user-facing error should surface.
                self.post_json(
                    feconf.SIGNUP_DATA_URL,
                    {
                        'agreed_to_terms': True,
                        'username': self.EDITOR_USERNAME,
                        'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                        'can_receive_email_updates': (
                            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                        )
                    },
                    csrf_token=csrf_token
                )

                # However, an error should be recorded in the logs.
                self.assertEqual(log_new_error_counter.times_called, 1)
                self.assertTrue(logs[0].startswith(
                    'Original email HTML body does not match cleaned HTML body')
                )

                # Check that no email was sent.
                messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
                self.assertEqual(0, len(messages))
        self._reset_signup_email_content_platform_parameters()

    def test_contents_of_signup_email_are_correct(self) -> None:
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            platform_parameter_registry.Registry.update_platform_parameter(
                email_manager.EMAIL_SENDER_NAME.name,
                self.admin_id,
                'Update sender name',
                [
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'platform_type',
                                'conditions': [
                                    ['=', 'Web']
                                ],
                            }
                        ],
                        'value_when_matched': 'Email Sender'
                    })
                ],
                email_manager.EMAIL_SENDER_NAME.default_value
            )
            platform_parameter_registry.Registry.update_platform_parameter(
                email_manager.EMAIL_FOOTER.name,
                self.admin_id,
                'Update email footer',
                [
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'platform_type',
                                'conditions': [
                                    ['=', 'Web']
                                ],
                            }
                        ],
                        'value_when_matched': self.new_footer
                    })
                ],
                email_manager.EMAIL_FOOTER.default_value
            )
            self._set_signup_email_content_platform_parameter(
                self.new_email_subject_content, self.new_email_body_content)

            self.login(self.EDITOR_EMAIL)
            self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )

            # Check that an email was sent with the correct content.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            self.assertEqual(
                messages[0].sender,
                'Email Sender <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(messages[0].to, [self.EDITOR_EMAIL])
            self.assertEqual(messages[0].subject, 'Welcome!')
            self.assertEqual(messages[0].body, self.expected_text_email_content)
            self.assertEqual(messages[0].html, self.expected_html_email_content)
            self._reset_the_email_platform_params_value()
            self._reset_signup_email_content_platform_parameters()

    def test_email_only_sent_once_for_repeated_signups_by_same_user(
        self
    ) -> None:
        swap_get_platform_parameter_value_return_email_footer = (
            self.swap_to_always_return(
                platform_parameter_services,
                'get_platform_parameter_value',
                self.new_footer
            )
        )
        with swap_get_platform_parameter_value_return_email_footer, self.swap(
            feconf, 'CAN_SEND_EMAILS', True
        ):
            self._set_signup_email_content_platform_parameter(
                self.new_email_subject_content, self.new_email_body_content)

            self.login(self.EDITOR_EMAIL)
            self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )

            # Check that an email was sent.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))

            # Send a second POST request.
            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )

            # Check that no new email was sent.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))
            self._reset_signup_email_content_platform_parameters()

    def test_email_only_sent_if_signup_was_successful(self) -> None:
        swap_get_platform_parameter_value_return_email_footer = (
            self.swap_to_always_return(
                platform_parameter_services,
                'get_platform_parameter_value',
                self.new_footer
            )
        )
        with swap_get_platform_parameter_value_return_email_footer, self.swap(
            feconf, 'CAN_SEND_EMAILS', True
        ):
            self._set_signup_email_content_platform_parameter(
                self.new_email_subject_content, self.new_email_body_content)

            self.login(self.EDITOR_EMAIL)
            self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': 'BadUsername!!!',
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token,
                expected_status_int=400
            )

            # Check that no email was sent.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(0, len(messages))

            # Redo the signup process with a good username.
            self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )

            # Check that a new email was sent.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(1, len(messages))
            self._reset_signup_email_content_platform_parameters()

    def test_record_of_sent_email_is_written_to_datastore(self) -> None:
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            platform_parameter_registry.Registry.update_platform_parameter(
                email_manager.EMAIL_SENDER_NAME.name,
                self.admin_id,
                'Update sender name',
                [
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'platform_type',
                                'conditions': [
                                    ['=', 'Web']
                                ],
                            }
                        ],
                        'value_when_matched': 'Email Sender'
                    })
                ],
                email_manager.EMAIL_SENDER_NAME.default_value
            )
            platform_parameter_registry.Registry.update_platform_parameter(
                email_manager.EMAIL_FOOTER.name,
                self.admin_id,
                'Update email footer',
                [
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'platform_type',
                                'conditions': [
                                    ['=', 'Web']
                                ],
                            }
                        ],
                        'value_when_matched': self.new_footer
                    })
                ],
                email_manager.EMAIL_FOOTER.default_value
            )
            self._set_signup_email_content_platform_parameter(
                self.new_email_subject_content, self.new_email_body_content)

            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            self.login(self.EDITOR_EMAIL)
            self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                feconf.SIGNUP_DATA_URL, {
                    'agreed_to_terms': True,
                    'username': self.EDITOR_USERNAME,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )

            # Check that a new email was sent.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
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
            self.assertEqual(sent_email_model.subject, 'Welcome!')
            self.assertEqual(
                sent_email_model.html_body, self.expected_html_email_content)
            self._reset_the_email_platform_params_value()
            self._reset_signup_email_content_platform_parameters()


class DuplicateEmailTests(test_utils.EmailTestBase):
    """Test that duplicate emails are not sent."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.new_footer = (
            'You can change your email preferences via the '
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')
        self.new_email_subject = 'THIS IS A PLACEHOLDER.'
        self.new_email_html_body = 'Hi %s,<br><br>%s<br><br>%s' % (
            self.NEW_USER_USERNAME,
            'THIS IS A <b>PLACEHOLDER</b> AND SHOULD BE REPLACED.',
            self.new_footer)

        def _generate_hash_for_tests(
            unused_cls: Type[test_utils.TestBase],
            unused_recipient_id: str,
            unused_email_subject: str,
            unused_email_body: str
        ) -> str:
            """Returns the generated hash for tests."""
            return 'Email Hash'

        self.generate_hash_ctx = self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(
                _generate_hash_for_tests, email_models.SentEmailModel))

    def test_send_email_does_not_resend_if_same_hash_exists(self) -> None:
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 1000)

        log_new_error_counter = test_utils.CallCounter(logging.error)
        log_new_error_ctx = self.swap(
            logging, 'error', log_new_error_counter)

        with self.capture_logging(min_level=logging.ERROR) as logs:
            with can_send_emails_ctx, duplicate_email_ctx, log_new_error_ctx:
                all_models: Sequence[
                    email_models.SentEmailModel
                ] = email_models.SentEmailModel.get_all().fetch()
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
                self.assertRegex(logs[0], 'Duplicate email')

                # Check that a new email was not sent.
                messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
                self.assertEqual(0, len(messages))

                # Check that the content of this email was not recorded in
                # SentEmailModel.
                all_models = email_models.SentEmailModel.get_all().fetch()
                self.assertEqual(len(all_models), 1)

    def test_send_email_does_not_resend_within_duplicate_interval(self) -> None:
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        log_new_error_counter = test_utils.CallCounter(logging.error)
        log_new_error_ctx = self.swap(
            logging, 'error', log_new_error_counter)

        swap_get_platform_parameter_value = self.swap_to_always_return(
            platform_parameter_services,
            'get_platform_parameter_value',
            'Email Sender'
        )

        with swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR
        ) as logs:
            with can_send_emails_ctx, duplicate_email_ctx, log_new_error_ctx:
                all_models: Sequence[
                    email_models.SentEmailModel
                ] = email_models.SentEmailModel.get_all().fetch()
                self.assertEqual(len(all_models), 0)

                email_manager._send_email(  # pylint: disable=protected-access
                    self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                    feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                    feconf.SYSTEM_EMAIL_ADDRESS)

                # Check that a new email was sent.
                messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
                self.assertEqual(1, len(messages))

                # Check that the content of this email was recorded in
                # SentEmailModel.
                all_models = email_models.SentEmailModel.get_all().fetch()
                self.assertEqual(len(all_models), 1)

                # No error should be recorded in the logs.
                self.assertEqual(log_new_error_counter.times_called, 0)

                email_manager._send_email(  # pylint: disable=protected-access
                    self.new_user_id, feconf.SYSTEM_COMMITTER_ID,
                    feconf.EMAIL_INTENT_SIGNUP, 'Email Subject', 'Email Body',
                    feconf.SYSTEM_EMAIL_ADDRESS)

                # An error should be recorded in the logs.
                self.assertEqual(log_new_error_counter.times_called, 1)
                self.assertRegex(logs[0], 'Duplicate email')

                # Check that a new email was not sent.
                messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
                self.assertEqual(1, len(messages))

                # Check that the content of this email was not recorded in
                # SentEmailModel.
                all_models = email_models.SentEmailModel.get_all().fetch()
                self.assertEqual(len(all_models), 1)

    def test_sending_email_with_different_recipient_but_same_hash(self) -> None:
        """Hash for both messages is same but recipients are different."""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx, self.generate_hash_ctx:
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
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

    def test_sending_email_with_different_subject_but_same_hash(self) -> None:
        """Hash for both messages is same but subjects are different."""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx, self.generate_hash_ctx:
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
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

    def test_sending_email_with_different_body_but_same_hash(self) -> None:
        """Hash for both messages is same but body is different."""
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx, self.generate_hash_ctx:
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
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

    def test_duplicate_emails_are_sent_after_some_time_has_elapsed(
        self
    ) -> None:
        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)

        duplicate_email_ctx = self.swap(
            feconf, 'DUPLICATE_EMAIL_INTERVAL_MINS', 2)

        with can_send_emails_ctx, duplicate_email_ctx:
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 0)

            email_sent_time = (
                datetime.datetime.utcnow() - datetime.timedelta(minutes=4))

            email_models.SentEmailModel.create(
                self.new_user_id, self.NEW_USER_EMAIL,
                feconf.SYSTEM_COMMITTER_ID, feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.EMAIL_INTENT_SIGNUP, self.new_email_subject,
                self.new_email_html_body, email_sent_time)

            # Check that the content of this email was recorded in
            # SentEmailModel.
            all_models = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            email_sent_time = (
                datetime.datetime.utcnow() - datetime.timedelta(minutes=2))

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
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
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


class FeedbackMessageBatchEmailTests(test_utils.EmailTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')

        self.expected_email_subject = (
            'You\'ve received 3 new messages on your explorations')

        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)
        self.can_not_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)

    def test_email_not_sent_if_can_send_emails_is_false(self) -> None:
        feedback_messages: Dict[str, email_manager.FeedbackMessagesDict] = {
            self.exploration.id: {
                'title': self.exploration.title,
                'messages': ['Message 1.1', 'Message 1.2', 'Message 1.3']}
        }
        with self.can_not_send_emails_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

        # Check that email is not sent.
        messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_can_send_feedback_message_emails_is_false(
        self
    ) -> None:
        feedback_messages: Dict[str, email_manager.FeedbackMessagesDict] = {
            self.exploration.id: {
                'title': self.exploration.title,
                'messages': ['Message 1.1', 'Message 1.2', 'Message 1.3']}
        }
        with self.can_send_emails_ctx, self.can_not_send_feedback_email_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

        # Check that email is not sent.
        messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_feedback_messages_are_empty(self) -> None:
        feedback_messages: Dict[str, email_manager.FeedbackMessagesDict] = {}
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

        # Check that email is not sent.
        messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_correct_email_body_is_sent(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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

        feedback_messages: Dict[str, email_manager.FeedbackMessagesDict] = {
            self.exploration.id: {
                'title': self.exploration.title,
                'messages': ['Message 1.1', 'Message 1.2', 'Message 1.3']}
        }

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            email_manager.send_feedback_message_email(
                self.editor_id, feedback_messages)

            # Check that email body is correct.
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Check that email model is correct.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)

            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.recipient_id, self.editor_id)
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


class SuggestionEmailTests(test_utils.EmailTestBase):
    def setUp(self) -> None:
        super().setUp()

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

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_suggestion_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.recipient_list)

        # Check that email is not sent.
        messages = self._get_sent_email_messages(
            self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_can_send_feedback_message_emails_is_false(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.can_not_send_feedback_email_ctx:
            email_manager.send_suggestion_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.recipient_list)

        # Check that email is not sent.
        messages = self._get_sent_email_messages(
            self.EDITOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_suggestion_emails_are_correct(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
            messages = self._get_sent_email_messages(self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.editor_id)
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


class SubscriptionEmailTests(test_utils.EmailTestBase):
    def setUp(self) -> None:
        super().setUp()

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

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_emails_to_subscribers(
                self.editor_id, self.exploration.id, self.exploration.title)

        messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_can_send_subscription_emails_is_false(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.can_not_send_subscription_email_ctx:
            email_manager.send_emails_to_subscribers(
                self.editor_id, self.exploration.id, self.exploration.title)

        messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_subscription_emails_are_correct(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
            messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.new_user_id)
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


class FeedbackMessageInstantEmailTests(test_utils.EmailTestBase):
    def setUp(self) -> None:
        super().setUp()

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

    def test_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_instant_feedback_message_email(
                self.new_user_id, self.editor_id, 'editor message',
                'New Oppia message in "a subject"', self.exploration.title,
                self.exploration.id, 'a subject')

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_can_send_feedback_message_emails_is_false(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.can_not_send_feedback_email_ctx:
            email_manager.send_instant_feedback_message_email(
                self.new_user_id, self.editor_id, 'editor message',
                'New Oppia message in "a subject"', self.exploration.title,
                self.exploration.id, 'a subject')

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.NEW_USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_feedback_message_emails_are_correct(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
            messages = self._get_sent_email_messages(
                self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.new_user_id)
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


class FlagExplorationEmailTest(test_utils.EmailTestBase):
    """Test that emails are sent to moderators when explorations are flagged."""

    def setUp(self) -> None:
        super().setUp()

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

        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_flag_exploration_email(
                self.exploration.title, self.exploration.id, self.new_user_id,
                self.report_text)

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.MODERATOR_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_flag_exploration_emails_are_correct(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
            messages = self._get_sent_email_messages(self.MODERATOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email is sent to multiple moderators.
            messages = self._get_sent_email_messages(self.moderator2_email)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email models are stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = next(
                m for m in all_models if m.recipient_id == self.moderator_id)
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_email, self.MODERATOR_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_REPORT_BAD_CONTENT)
            sent_email_model = next(
                m for m in all_models if m.recipient_id == self.moderator2_id)
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_email, self.moderator2_email)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_REPORT_BAD_CONTENT)


class OnboardingReviewerInstantEmailTests(test_utils.EmailTestBase):
    """Test that correct email is sent while onboarding reviewers."""

    REVIEWER_USERNAME: Final = 'reviewer'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_id, True, False, False, False)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_mail_to_onboard_new_reviewers(
                self.reviewer_id, 'Algebra')

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_correct_completion_email_is_sent(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_mail_to_onboard_new_reviewers(
                self.reviewer_id, 'Algebra')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_ONBOARD_CD_USER)


class NotifyReviewerInstantEmailTests(test_utils.EmailTestBase):
    """Test that correct email is sent while notifying reviewers."""

    REVIEWER_USERNAME: Final = 'reviewer'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_id, True, False, False, False)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_mail_to_notify_users_to_review(
                self.reviewer_id, 'Algebra')

        messages = self._get_sent_email_messages(
            self.REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_correct_completion_email_is_sent(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_users_to_review(
                self.reviewer_id, 'Algebra')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.reviewer_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.REVIEWER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS)


class NotifyContributionAchievementEmailTests(test_utils.EmailTestBase):
    """Test that correct email is sent when notifying contributor
    achievements."""

    USERNAME: Final = 'user'
    USER_EMAIL: Final = 'user@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_EMAIL, self.USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        user_services.update_email_preferences(
            self.user_id, True, False, False, False)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'question', 'edit', None,
                'Initial Contributor'
            ))
        with self.can_not_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

        messages = self._get_sent_email_messages(
            self.USER_EMAIL)

        self.assertEqual(len(messages), 0)

    def test_that_email_not_sent_if_user_can_not_receive_emails(self) -> None:
        user_services.update_email_preferences(
            self.user_id, False, False, False, False)
        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'question', 'edit', None,
                'Initial Contributor'
            ))
        with self.can_not_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

        messages = self._get_sent_email_messages(
            self.USER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_that_translation_submitter_acceptance_ranking_email_is_sent(
        self) -> None:
        expected_email_subject = 'Oppia Translator Rank Achievement!'
        expected_email_html_body = (
            'Hi user,<br><br>'
            'This is to let you know that you have successfully achieved the '
            'Initial Contributor rank for submitting translations in हिन्दी '
            '(Hindi). Your efforts help Oppia grow better every day and '
            'support students around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!<br><br>'
            'The Oppia Contributor Dashboard Team')

        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'translation', 'acceptance', 'hi',
                'Initial Contributor'
            ))
        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)

    def test_that_question_submitter_acceptance_ranking_email_is_sent(
        self) -> None:
        expected_email_subject = 'Oppia Question Submitter Rank Achievement!'
        expected_email_html_body = (
            'Hi user,<br><br>'
            'This is to let you know that you have successfully achieved the '
            'Initial Contributor rank for submitting practice questions. Your '
            'efforts help Oppia grow better every day and support students '
            'around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!<br><br>'
            'The Oppia Contributor Dashboard Team')

        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'question', 'acceptance', None,
                'Initial Contributor'
            ))
        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)

    def test_that_translation_reviewer_review_ranking_email_is_sent(
        self) -> None:
        expected_email_subject = 'Oppia Translation Reviewer Rank Achievement!'
        expected_email_html_body = (
            'Hi user,<br><br>'
            'This is to let you know that you have successfully achieved the '
            'Initial Contributor rank for reviewing translations in हिन्दी '
            '(Hindi). Your efforts help Oppia grow better every day and '
            'support students around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!<br><br>'
            'The Oppia Contributor Dashboard Team')

        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'translation', 'review', 'hi',
                'Initial Contributor'
            ))
        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)

    def test_that_question_reviewer_review_ranking_email_is_sent(
        self) -> None:
        expected_email_subject = 'Oppia Question Reviewer Rank Achievement!'
        expected_email_html_body = (
            'Hi user,<br><br>'
            'This is to let you know that you have successfully achieved the '
            'Initial Contributor rank for reviewing  practice questions. Your '
            'efforts help Oppia grow better every day and support students '
            'around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!<br><br>'
            'The Oppia Contributor Dashboard Team')

        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'question', 'review', None,
                'Initial Contributor'
            ))
        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)

    def test_that_translation_reviewer_edit_ranking_email_is_sent(
        self) -> None:
        expected_email_subject = 'Oppia Translation Reviewer Rank Achievement!'
        expected_email_html_body = (
            'Hi user,<br><br>'
            'This is to let you know that you have successfully achieved the '
            'Initial Contributor rank for correcting translations in हिन्दी '
            '(Hindi). Your efforts help Oppia grow better every day and '
            'support students around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!<br><br>'
            'The Oppia Contributor Dashboard Team')

        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'translation', 'edit', 'hi',
                'Initial Contributor'
            ))
        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)

    def test_that_question_reviewer_edit_ranking_email_is_sent(
        self) -> None:
        expected_email_subject = 'Oppia Question Reviewer Rank Achievement!'
        expected_email_html_body = (
            'Hi user,<br><br>'
            'This is to let you know that you have successfully achieved the '
            'Initial Contributor rank for correcting practice questions. '
            'Your efforts help Oppia grow better every day and support '
            'students around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!<br><br>'
            'The Oppia Contributor Dashboard Team')

        contributor_ranking_email_info = (
            suggestion_registry.ContributorMilestoneEmailInfo(
                self.user_id, 'question', 'edit', None,
                'Initial Contributor'
            ))
        with self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_contributor_ranking_achievement(
                contributor_ranking_email_info)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(self.USER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch()
            )
            sent_email_model = all_models[0]
            self.assertEqual(sent_email_model.subject, expected_email_subject)
            self.assertEqual(sent_email_model.recipient_id, self.user_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.USER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS)


class NotifyContributionDashboardReviewersEmailTests(test_utils.EmailTestBase):
    """Tests the send_mail_to_notify_contributor_dashboard_reviewers method,
    which sends an email to reviewers with information regarding the suggestions
    that have waited the longest for review.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    mocked_review_submission_datetime: datetime.datetime = (
        datetime.datetime(2020, 6, 15, 5)
    )
    AUTHOR_USERNAME: Final = 'author'
    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_1_USERNAME: Final = 'reviewer1'
    REVIEWER_1_EMAIL: Final = 'reviewer1@community.org'
    REVIEWER_2_USERNAME: Final = 'reviewer2'
    REVIEWER_2_EMAIL: Final = 'reviewer2@community.org'

    def _create_translation_suggestion_in_lang_with_html_and_datetime(
        self,
        language_code: str,
        translation_html: str,
        submission_datetime: datetime.datetime
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion in the given language_code with the
        given translation html and submission datetime.
        """
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_INIT_STATE_CONTENT_STR,
            'translation_html': translation_html,
            'data_format': 'html'
        }

        translation_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description')

        translation_suggestion.last_updated = submission_datetime
        return translation_suggestion

    def _create_question_suggestion_with_question_html_and_datetime(
        self,
        question_html: str,
        submission_datetime: datetime.datetime
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a question suggestion with the given question html and
        submission datetime.
        """
        with self.swap(
            feconf, 'DEFAULT_INIT_STATE_CONTENT_STR', question_html):
            content_id_generator = translation_domain.ContentIdGenerator()
            add_question_change_dict: Dict[
                str, Union[str, float, question_domain.QuestionDict]
            ] = {
                'cmd': (
                    question_domain
                    .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                'question_dict': {
                    'id': 'test_id',
                    'version': 12,
                    'question_state_data': self._create_valid_question_data(
                        'default_state', content_id_generator).to_dict(),
                    'language_code': constants.DEFAULT_LANGUAGE_CODE,
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                    'next_content_id_index': (
                        content_id_generator.next_content_id_index)
                },
                'skill_id': self.skill_id,
                'skill_difficulty': 0.3
            }

        question_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description')

        question_suggestion.last_updated = submission_datetime
        return question_suggestion

    def _create_reviewable_suggestion_email_infos_from_suggestions(
        self,
        suggestions: List[suggestion_registry.BaseSuggestion]
    ) -> List[suggestion_registry.ReviewableSuggestionEmailInfo]:
        """Creates a list of ReviewableSuggestionEmailInfo objects from
        the given suggestions.
        """

        return [
            (
                suggestion_services
                .create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion)
            ) for suggestion in suggestions
        ]

    def _assert_email_data_stored_in_sent_email_model_is_correct(
        self,
        expected_email_html_body: str,
        reviewer_id: Optional[str],
        reviewer_email: str
    ) -> None:
        """Asserts that the created sent email model from the sent email
        contains the right information.
        """
        sent_email_models: Sequence[
            email_models.SentEmailModel
        ] = email_models.SentEmailModel.get_all().filter(
            email_models.SentEmailModel.recipient_id == reviewer_id).fetch()
        self.assertEqual(len(sent_email_models), 1)
        sent_email_model = sent_email_models[0]
        self.assertEqual(
            sent_email_model.subject,
            email_manager
            .CONTRIBUTOR_DASHBOARD_REVIEWER_NOTIFICATION_EMAIL_DATA[
                'email_subject'])
        self.assertEqual(
            sent_email_model.recipient_id, reviewer_id)
        self.assertEqual(
            sent_email_model.recipient_email, reviewer_email)
        self.assertEqual(
            sent_email_model.html_body, expected_email_html_body)
        self.assertEqual(
            sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
        self.assertEqual(
            sent_email_model.sender_email,
            'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
        self.assertEqual(
            sent_email_model.intent,
            feconf.EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS)

    def _swap_get_platform_parameter_value_function(
        self, param_name: str
    ) -> platform_parameter_domain.PlatformDataTypes:
        """Swap function for get_platform_parameter_value.

        Args:
            param_name: str. The name of the platform parameter.

        Returns:
            PlatformDataTypes. The defined data type of the platform parameter.
        """
        if param_name == (
            platform_parameter_list.ParamName.
            CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value
        ):
            return True
        elif param_name == (
            platform_parameter_list.ParamName.EMAIL_SENDER_NAME.value
        ):
            return email_manager.EMAIL_SENDER_NAME.default_value
        elif param_name == (
            platform_parameter_list.ParamName.EMAIL_FOOTER.value
        ):
            return email_manager.EMAIL_FOOTER.default_value
        return ''

    def _mock_logging_info(self, msg: str, *args: str) -> None:
        """Mocks logging.info() by appending the log message to the logged info
        list.
        """
        self.logged_info.append(msg % args)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_1_EMAIL, self.REVIEWER_1_USERNAME)
        self.reviewer_1_id = self.get_user_id_from_email(self.REVIEWER_1_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_1_id, True, False, False, False)
        self.signup(self.REVIEWER_2_EMAIL, self.REVIEWER_2_USERNAME)
        self.reviewer_2_id = self.get_user_id_from_email(self.REVIEWER_2_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_2_id, True, False, False, False)

        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.log_new_error_counter = test_utils.CallCounter(
            logging.error)
        self.log_new_error_ctx = self.swap(
            logging, 'error', self.log_new_error_counter)
        self.logged_info: List[str] = []
        self.log_new_info_ctx = self.swap(
            logging, 'info', self._mock_logging_info)

        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        self.reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        self.swap_get_platform_parameter_value = self.swap(
            platform_parameter_services,
            'get_platform_parameter_value',
            self._swap_get_platform_parameter_value_function
        )

    def test_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.cannot_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_contributor_dashboard_reviewers(  # pylint: disable=line-too-long
                    [self.reviewer_1_id],
                    [[self.reviewable_suggestion_email_info]]
                )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0], 'This app cannot send emails to users.')

    def test_email_not_sent_if_reviewer_notifications_is_disabled(self) -> None:
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_contributor_dashboard_reviewers(  # pylint: disable=line-too-long
                    [self.reviewer_1_id],
                    [[self.reviewable_suggestion_email_info]]
                )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'The "contributor_dashboard_reviewer_emails_is_enabled" '
                'property must be enabled on the platform parameters tab on '
                'the admin page in order to send reviewers the emails.')

    def test_email_not_sent_if_reviewer_email_does_not_exist(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_contributor_dashboard_reviewers(  # pylint: disable=line-too-long
                    ['reviewer_id_with_no_email'],
                    [[self.reviewable_suggestion_email_info]]
                )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'There was no email for the given reviewer id: '
                'reviewer_id_with_no_email.')

    def test_email_not_sent_if_no_reviewers_to_notify(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_contributor_dashboard_reviewers(  # pylint: disable=line-too-long
                    [], [[self.reviewable_suggestion_email_info]]
                )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'No Contributor Dashboard reviewers to notify.')

    def test_email_not_sent_if_no_suggestions_to_notify_the_reviewer_about(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.log_new_info_ctx:
            with self.swap_get_platform_parameter_value:
                email_manager.send_mail_to_notify_contributor_dashboard_reviewers( # pylint: disable=line-too-long
                    [self.reviewer_1_id], [[]]
                )

        messages = self._get_all_sent_email_messages()
        self.assertEqual(len(messages), 0)
        self.assertEqual(
            self.logged_info[0],
            'There were no suggestions to recommend to the reviewer with user '
            'id: %s.' % self.reviewer_1_id)

    def test_email_sent_to_reviewer_with_question_waiting_a_day_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 1
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'day ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_question_waiting_days_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 5 '
            'days ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_question_waiting_an_hour_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 1
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(hours=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'hour ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_question_waiting_hours_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(hours=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 5 '
            'hours ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_question_waiting_a_minute_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 1
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(minutes=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'minute ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_question_waiting_minutes_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(minutes=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 5 '
            'minutes ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_question_waiting_seconds_for_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(seconds=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'minute ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_multi_questions_waiting_for_a_review(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=1, hours=1))
        # Question suggestion 1 has waited 1 day for review.
        question_suggestion_1 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1)))
        # Question suggestion 2 has waited 1 hour for review.
        question_suggestion_2 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1)))
        reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_1, question_suggestion_2]))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'day ago:'
            '<br>Question 1</li><br>'
            '<li>The following question suggestion was submitted for review 1 '
            'hour ago:'
            '<br>Question 2</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [reviewable_suggestion_email_infos])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_multi_reviewers_with_multi_question_suggestions(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=1, hours=1, minutes=1))
        # Question suggestion 1 has waited 1 day for review.
        question_suggestion_1 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 1 for reviewer 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1, minutes=1)))
        # Question suggestion 2 has waited 1 hour for review.
        question_suggestion_2 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 2 for reviewer 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, minutes=1)))
        # Question suggestion 3 has waited 1 minute for review.
        question_suggestion_3 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 1 for reviewer 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, hours=1)))
        # Question suggestion 4 has waited 1 minute for review.
        question_suggestion_4 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 2 for reviewer 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, hours=1)))
        reviewer_1_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_1, question_suggestion_2]))
        reviewer_2_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_3, question_suggestion_4]))
        expected_email_html_body_reviewer_1 = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'day ago:'
            '<br>Question 1 for reviewer 1</li><br>'
            '<li>The following question suggestion was submitted for review 1 '
            'hour ago:'
            '<br>Question 2 for reviewer 1</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value)
        )
        expected_email_html_body_reviewer_2 = (
            'Hi reviewer2,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 1 '
            'minute ago:'
            '<br>Question 1 for reviewer 2</li><br>'
            '<li>The following question suggestion was submitted for review 1 '
            'minute ago:'
            '<br>Question 2 for reviewer 2</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id, self.reviewer_2_id],
                            [
                                reviewer_1_suggestion_email_infos,
                                reviewer_2_suggestion_email_infos
                            ])
                    )

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_reviewer_1)
        messages = self._get_sent_email_messages(self.REVIEWER_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_reviewer_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_reviewer_1, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_reviewer_2, self.reviewer_2_id,
            self.REVIEWER_2_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_a_day_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 1
        reviewable_suggestion_email_info.submission_datetime = (
            self.mocked_review_submission_datetime)
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 1 day ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_days_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 5 days ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_an_hour_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 1
        reviewable_suggestion_email_info.submission_datetime = (
            self.mocked_review_submission_datetime)
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(hours=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 1 hour ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_hours_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 5
        reviewable_suggestion_email_info.submission_datetime = (
            self.mocked_review_submission_datetime)
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(hours=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 5 hours ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_a_min_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 1
        reviewable_suggestion_email_info.submission_datetime = (
            self.mocked_review_submission_datetime)
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(minutes=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 1 minute ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_mins_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 5
        reviewable_suggestion_email_info.submission_datetime = (
            self.mocked_review_submission_datetime)
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(minutes=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 5 minutes ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_translation_waiting_secs_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 1
        reviewable_suggestion_email_info.submission_datetime = (
            self.mocked_review_submission_datetime)
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(seconds=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 1 minute ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [[reviewable_suggestion_email_info]])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_reviewer_with_multi_translation_waiting_for_review(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=1, hours=1))
        # Translation suggestion 1 has waited 1 day for review.
        translation_suggestion_1 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'en', '<p>Translation 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1)))
        # Translation suggestion 2 has waited 1 hour for review.
        translation_suggestion_2 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'fr', '<p>Translation 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1)))
        reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1, translation_suggestion_2]))
        expected_email_html_body = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following English translation suggestion was submitted '
            'for review 1 day ago:'
            '<br>Translation 1</li><br>'
            '<li>The following français (French) translation suggestion was '
            'submitted for review 1 hour ago:'
            '<br>Translation 2</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id],
                            [reviewable_suggestion_email_infos])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)

    def test_email_sent_to_multi_reviewers_with_multi_translations_suggestions(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=1, hours=1, minutes=1))
        # Translation suggestion 1 has waited 1 day for review.
        translation_suggestion_1 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'en', '<p>Translation 1 for reviewer 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1, minutes=1)))
        # Translation suggestion 2 has waited 1 hour for review.
        translation_suggestion_2 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'fr', '<p>Translation 2 for reviewer 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, minutes=1)))
        # Translation suggestion 3 has waited 1 minute for review.
        translation_suggestion_3 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Translation 1 for reviewer 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, hours=1)))
        # Translation suggestion 4 has waited 1 minute for review.
        translation_suggestion_4 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'fr', '<p>Translation 2 for reviewer 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, hours=1)))
        reviewer_1_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1, translation_suggestion_2]))
        reviewer_2_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_3, translation_suggestion_4]))
        expected_email_html_body_reviewer_1 = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following English translation suggestion was submitted '
            'for review 1 day ago:'
            '<br>Translation 1 for reviewer 1</li><br>'
            '<li>The following français (French) translation suggestion was '
            'submitted for review 1 hour ago:'
            '<br>Translation 2 for reviewer 1</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value)
        )
        expected_email_html_body_reviewer_2 = (
            'Hi reviewer2,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 1 minute ago:'
            '<br>Translation 1 for reviewer 2</li><br>'
            '<li>The following français (French) translation suggestion was '
            'submitted for review 1 minute ago:'
            '<br>Translation 2 for reviewer 2</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id, self.reviewer_2_id],
                            [
                                reviewer_1_suggestion_email_infos,
                                reviewer_2_suggestion_email_infos
                            ])
                    )

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_reviewer_1)
        messages = self._get_sent_email_messages(self.REVIEWER_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_reviewer_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_reviewer_1, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_reviewer_2, self.reviewer_2_id,
            self.REVIEWER_2_EMAIL)

    def test_email_sent_to_multi_reviewers_with_multi_suggestions_waiting(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=1, hours=1, minutes=1))
        # Suggestion 1 has waited 1 day for review.
        suggestion_1 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'en', '<p>Translation 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1, minutes=1)))
        # Suggestion 2 has waited 1 hour for review.
        suggestion_2 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, minutes=1)))
        # Suggestion 3 has waited 1 minute for review.
        suggestion_3 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'fr', '<p>Translation 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, hours=1)))
        # Suggestion 4 has waited 1 minute for review.
        suggestion_4 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    days=1, hours=1)))
        reviewer_1_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [suggestion_1, suggestion_2]))
        reviewer_2_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [suggestion_3, suggestion_4]))
        expected_email_html_body_reviewer_1 = (
            'Hi reviewer1,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following English translation suggestion was submitted '
            'for review 1 day ago:'
            '<br>Translation 1</li><br>'
            '<li>The following question suggestion was submitted for '
            'review 1 hour ago:'
            '<br>Question 1</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value)
        )
        expected_email_html_body_reviewer_2 = (
            'Hi reviewer2,'
            '<br><br>'
            'There are new review opportunities that we think you might be '
            'interested in on the <a href="%s%s">Contributor Dashboard</a>. '
            'Here are some examples of contributions that have been waiting '
            'the longest for review:<br><br>'
            '<ul>'
            '<li>The following français (French) translation suggestion was '
             'submitted for review 1 minute ago:'
            '<br>Translation 2</li><br>'
            '<li>The following question suggestion was submitted for '
            'review 1 minute ago:'
            '<br>Question 2</li><br>'
            '</ul><br>'
            'Please take some time to review any of the above contributions '
            '(if they still need a review) or any other contributions on the '
            'dashboard. We appreciate your help!'
            '<br><br>'
            'Thanks again, and happy reviewing!<br>'
            '- The Oppia Contributor Dashboard Team'
            '<br><br>%s' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                email_manager.EMAIL_FOOTER.default_value))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    (
                        email_manager
                        .send_mail_to_notify_contributor_dashboard_reviewers(
                            [self.reviewer_1_id, self.reviewer_2_id],
                            [
                                reviewer_1_suggestion_email_infos,
                                reviewer_2_suggestion_email_infos
                            ])
                    )

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_reviewer_1)
        messages = self._get_sent_email_messages(self.REVIEWER_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_reviewer_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_reviewer_1, self.reviewer_1_id,
            self.REVIEWER_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_reviewer_2, self.reviewer_2_id,
            self.REVIEWER_2_EMAIL)


class NotifyAdminsSuggestionsWaitingTooLongForReviewEmailTests(
        test_utils.EmailTestBase):
    """Tests the send_mail_to_notify_admins_suggestions_waiting_long method,
    which sends an email to admins with information regarding the suggestions
    that have waited longer than
    suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS days for
    review on the Contributor Dashboard.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    mocked_review_submission_datetime: datetime.datetime = (
        datetime.datetime(2020, 6, 15, 5)
    )
    AUTHOR_USERNAME: Final = 'author'
    AUTHOR_EMAIL: Final = 'author@example.com'
    CURRICULUM_ADMIN_1_USERNAME: Final = 'user1'
    CURRICULUM_ADMIN_1_EMAIL: Final = 'user1@community.org'
    CURRICULUM_ADMIN_2_USERNAME: Final = 'user2'
    CURRICULUM_ADMIN_2_EMAIL: Final = 'user2@community.org'

    def _create_translation_suggestion_in_lang_with_html_and_datetime(
        self,
        language_code: str,
        translation_html: str,
        submission_datetime: datetime.datetime
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion in the given language_code with the
        given translation html and submission datetime.
        """
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_INIT_STATE_CONTENT_STR,
            'translation_html': translation_html,
            'data_format': 'html'
        }

        with self.mock_datetime_utcnow(submission_datetime):
            translation_suggestion = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, add_translation_change_dict,
                'test description')

        return translation_suggestion

    def _create_question_suggestion_with_question_html_and_datetime(
        self,
        question_html: str,
        submission_datetime: datetime.datetime
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a question suggestion with the given question html and
        submission datetime.
        """
        with self.swap(
            feconf, 'DEFAULT_INIT_STATE_CONTENT_STR', question_html):
            content_id_generator = translation_domain.ContentIdGenerator()
            add_question_change_dict: Dict[
                str, Union[str, float, question_domain.QuestionDict]
            ] = {
                'cmd': (
                    question_domain
                    .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
                'question_dict': {
                    'id': 'test_id',
                    'version': 12,
                    'question_state_data': self._create_valid_question_data(
                        'default_state', content_id_generator).to_dict(),
                    'language_code': constants.DEFAULT_LANGUAGE_CODE,
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                    'next_content_id_index': (
                        content_id_generator.next_content_id_index)
                },
                'skill_id': self.skill_id,
                'skill_difficulty': 0.3
            }

        with self.mock_datetime_utcnow(submission_datetime):
            question_suggestion = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_SKILL,
                self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, add_question_change_dict,
                'test description')

        return question_suggestion

    def _create_reviewable_suggestion_email_infos_from_suggestions(
        self, suggestions: List[suggestion_registry.BaseSuggestion]
    ) -> List[suggestion_registry.ReviewableSuggestionEmailInfo]:
        """Creates a list of ReviewableSuggestionEmailInfo objects from
        the given suggestions.
        """

        return [
            (
                suggestion_services
                .create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion)
            ) for suggestion in suggestions
        ]

    def _assert_email_data_stored_in_sent_email_model_is_correct(
        self,
        expected_email_html_body: str,
        admin_id: Optional[str],
        admin_email: str
    ) -> None:
        """Asserts that the created sent email model from the sent email
        contains the right information.
        """
        sent_email_models: Sequence[
            email_models.SentEmailModel
        ] = email_models.SentEmailModel.get_all().filter(
            email_models.SentEmailModel.recipient_id == admin_id).fetch()
        self.assertEqual(len(sent_email_models), 1)
        sent_email_model = sent_email_models[0]
        self.assertEqual(
            sent_email_model.subject, (
                email_manager
                .ADMIN_NOTIFICATION_FOR_SUGGESTIONS_NEEDING_REVIEW_EMAIL_DATA[
                    'email_subject']
            ))
        self.assertEqual(
            sent_email_model.recipient_id, admin_id)
        self.assertEqual(
            sent_email_model.recipient_email, admin_email)
        self.assertEqual(
            sent_email_model.html_body, expected_email_html_body)
        self.assertEqual(
            sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
        self.assertEqual(
            sent_email_model.sender_email,
            'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
        self.assertEqual(
            sent_email_model.intent,
            feconf.EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS)

    def _swap_get_platform_parameter_value_function(
        self, param_name: str
    ) -> platform_parameter_domain.PlatformDataTypes:
        """Swap function for get_platform_parameter_value.

        Args:
            param_name: str. The name of the platform parameter.

        Returns:
            PlatformDataTypes. The defined data type of the platform parameter.
        """
        if param_name == (
            platform_parameter_list.ParamName.
            ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW.value
        ):
            return True
        elif param_name == (
            platform_parameter_list.ParamName.EMAIL_SENDER_NAME.value
        ):
            return email_manager.EMAIL_SENDER_NAME.default_value
        return ''

    def _mock_logging_info(self, msg: str, *args: str) -> None:
        """Mocks logging.info() by appending the log message to the logged info
        list.
        """
        self.logged_info.append(msg % args)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(
            self.CURRICULUM_ADMIN_1_EMAIL, self.CURRICULUM_ADMIN_1_USERNAME)
        self.admin_1_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_1_EMAIL)
        self.signup(
            self.CURRICULUM_ADMIN_2_EMAIL, self.CURRICULUM_ADMIN_2_USERNAME)
        self.admin_2_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_2_EMAIL)

        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.log_new_error_counter = test_utils.CallCounter(
            logging.error)
        self.log_new_error_ctx = self.swap(
            logging, 'error', self.log_new_error_counter)
        self.logged_info: List[str] = []
        self.log_new_info_ctx = self.swap(
            logging, 'info', self._mock_logging_info)

        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        self.reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        self.swap_get_platform_parameter_value = self.swap(
            platform_parameter_services,
            'get_platform_parameter_value',
            self._swap_get_platform_parameter_value_function
        )

    def test_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.cannot_send_emails_ctx, self.log_new_error_ctx:
                with self.swap(
                    suggestion_models,
                    'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id],
                            [],
                            [],
                            [self.reviewable_suggestion_email_info])
                    )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0], 'This app cannot send emails to users.')

    def test_email_not_sent_if_notifying_admins_about_suggestions_is_disabled(
        self
    ) -> None:
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                with self.swap(
                    suggestion_models,
                    'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id], [], [],
                            [self.reviewable_suggestion_email_info])
                    )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'The "notify_admins_suggestions_waiting_too_long" property '
                'must be enabled on the admin config page in order to send '
                'admins the emails.')

    def test_email_not_sent_if_admin_email_does_not_exist(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                with self.swap(
                    suggestion_models,
                    'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
                ):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            ['admin_id_without_email'], [], [],
                            [self.reviewable_suggestion_email_info])
                    )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'There was no email for the given admin id: '
                'admin_id_without_email.'
            )

    def test_email_not_sent_if_no_admins_to_notify(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                with self.swap(
                    suggestion_models,
                    'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
                ):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [], [], [], [self.reviewable_suggestion_email_info])
                    )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0], 'There were no admins to notify.')

    def test_email_not_sent_if_no_suggestions_to_notify_the_admin_about(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.log_new_info_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                (
                    email_manager
                    .send_mail_to_notify_admins_suggestions_waiting_long(
                        [self.admin_1_id], [], [], [])
                )

        messages = self._get_all_sent_email_messages()
        self.assertEqual(len(messages), 0)
        self.assertEqual(
            self.logged_info[0],
            'There were no Contributor Dashboard suggestions that were waiting '
            'too long for a review.')

    def test_email_sent_to_admin_if_question_has_waited_too_long_for_a_review(
        self
    ) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 5 '
            'days ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL)
        )

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id], [], [],
                            [reviewable_suggestion_email_info])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_email_sent_to_admin_if_multiple_questions_have_waited_for_review(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=2, hours=1))
        question_suggestion_1 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 1</p>',
                self.mocked_review_submission_datetime))
        # Question suggestion 2 has waited slighlty less time than question
        # suggestion 1 so that the question suggestions are not
        # indistinguishable in terms of review wait time.
        question_suggestion_2 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1)))
        reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [question_suggestion_1, question_suggestion_2]))
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 2 '
            'days ago:'
            '<br>Question 1</li><br>'
            '<li>The following question suggestion was submitted for review 2 '
            'days ago:'
            '<br>Question 2</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL)
        )

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id], [], [],
                            reviewable_suggestion_email_infos)
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_email_sent_to_admin_if_translation_has_waited_too_long_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'hi', '<p>Sample translation</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following हिन्दी (Hindi) translation suggestion was '
            'submitted for review 5 days ago:'
            '<br>Sample translation</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL)
        )

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id], [], [],
                            [reviewable_suggestion_email_info])
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_email_sent_to_admin_if_multi_translations_have_waited_for_review(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=2, hours=1))
        translation_suggestion_1 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'en', '<p>Translation 1</p>',
                self.mocked_review_submission_datetime))
        # Translation suggestion 2 has waited slighlty less time than
        # translation suggestion 1 so that the translation suggestions are not
        # indistinguishable in terms of review wait time.
        translation_suggestion_2 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'fr', '<p>Translation 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1)))
        reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [translation_suggestion_1, translation_suggestion_2]))
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following English translation suggestion was submitted '
            'for review 2 days ago:'
            '<br>Translation 1</li><br>'
            '<li>The following français (French) translation suggestion was '
            'submitted for review 2 days ago:'
            '<br>Translation 2</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL)
        )

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id], [], [],
                            reviewable_suggestion_email_infos)
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_email_sent_to_admin_if_multi_suggestion_types_waiting_for_review(
        self
    ) -> None:
        mocked_datetime_for_utcnow = (
            self.mocked_review_submission_datetime + datetime.timedelta(
                days=2, hours=1, minutes=5))
        suggestion_1 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'en', '<p>Translation 1</p>',
                self.mocked_review_submission_datetime))
        # Suggestion 2 has waited slighlty less time than suggestion 1 so that
        # the suggestions are not indistinguishable in terms of review wait
        # time.
        suggestion_2 = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'fr', '<p>Translation 2</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    minutes=5)))
        # Similarly, suggestion 3 has waited less than both suggestion 1 and
        # suggestion 2 so that the suggestions are not indistinguishable in
        # terms of review wait time.
        suggestion_3 = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>Question 1</p>',
                self.mocked_review_submission_datetime + datetime.timedelta(
                    hours=1)))
        reviewable_suggestion_email_infos = (
            self._create_reviewable_suggestion_email_infos_from_suggestions(
                [suggestion_1, suggestion_2, suggestion_3]))
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following English translation suggestion was submitted '
            'for review 2 days ago:'
            '<br>Translation 1</li><br>'
            '<li>The following français (French) translation suggestion was '
            'submitted for review 2 days ago:'
            '<br>Translation 2</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL)
        )

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id], [], [],
                            reviewable_suggestion_email_infos)
                    )

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        messages.sort(key=lambda m: m.html)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        sent_email_models: Sequence[
            email_models.SentEmailModel
        ] = email_models.SentEmailModel.get_all().filter(
            email_models.SentEmailModel.recipient_id == self.admin_1_id).fetch()
        self.assertEqual(len(sent_email_models), 2)
        # Here, we are narrowing down the type of 'sent_email_models' from
        # Sequence to List. Because Sequence is a broader type and it does not
        # contain extra methods (e.g: .sort()), and below we are using .sort()
        # method by assuming that 'sent_email_models' is an instance of list.
        # So, to avoid error we used assertion here.
        assert isinstance(sent_email_models, list)
        email_sort_fn: Callable[[email_models.SentEmailModel], str] = (
            lambda m: m.html_body if isinstance(m.html_body, str) else ''
        )
        sent_email_models.sort(key=email_sort_fn)
        sent_email_model = sent_email_models[0]
        self.assertEqual(
            sent_email_model.subject,
            email_manager
            .ADMIN_NOTIFICATION_FOR_SUGGESTIONS_NEEDING_REVIEW_EMAIL_DATA[
                'email_subject'])
        self.assertEqual(
            sent_email_model.recipient_id, self.admin_1_id)
        self.assertEqual(
            sent_email_model.recipient_email, self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(
            sent_email_model.html_body, expected_email_html_body)
        self.assertEqual(
            sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
        self.assertEqual(
            sent_email_model.sender_email,
            'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
        self.assertEqual(
            sent_email_model.intent,
            feconf.EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS)

    def test_email_sent_to_multiple_admins(self) -> None:
        question_suggestion = (
            self._create_question_suggestion_with_question_html_and_datetime(
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                question_suggestion))
        review_wait_time = 5
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body_admin_1 = (
            'Hi user1,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 5 '
            'days ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL)
        )
        expected_email_html_body_admin_2 = (
            'Hi user2,'
            '<br><br>'
            'There are suggestions on the '
            '<a href="%s%s">Contributor Dashboard</a> that have been waiting '
            'for more than 0 days for review. Please take a look at the '
            'suggestions mentioned below and help them get reviewed by going '
            'to the <a href="%s%s">admin roles page</a> and either:'
            '<br><br><ul>'
            '<li>Add more reviewers to the suggestion types that have '
            'suggestions waiting too long for a review</li><br>'
            '<li>Find the existing reviewers and email reviewers directly '
            'about the suggestions waiting for a review</li><br>'
            '</ul><br>'
            'Here are the suggestions that have been waiting too long for a '
            'review:'
            '<br><br>'
            '<ul>'
            '<li>The following question suggestion was submitted for review 5 '
            'days ago:'
            '<br>What is the meaning of life?</li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br>'
            'Best Wishes!<br><br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL,
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL))

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.swap_get_platform_parameter_value, self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                    (
                        email_manager
                        .send_mail_to_notify_admins_suggestions_waiting_long(
                            [self.admin_1_id, self.admin_2_id], [], [],
                            [reviewable_suggestion_email_info])
                    )

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_admin_1)
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_admin_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_admin_1, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_admin_2, self.admin_2_id,
            self.CURRICULUM_ADMIN_2_EMAIL)


class NotifyReviewersNewSuggestionsTests(
    test_utils.EmailTestBase):
    """Tests the send_mail_to_notify_contributor_dashboard_reviewers method,
    which sends an email to reviewers with information regarding the suggestions
    that have waited the longest for review.
    """

    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'
    timezone = datetime.timezone.utc
    mocked_review_submission_datetime: datetime.datetime = (
        datetime.datetime(2023, 10, 23, 5, tzinfo=timezone)
    )
    mocked_review_submission_datetime = (
        mocked_review_submission_datetime.replace(
            tzinfo=None))
    AUTHOR_USERNAME: Final = 'author'
    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_1_USERNAME: Final = 'reviewer1'
    REVIEWER_1_EMAIL: Final = 'reviewer1@community.org'
    REVIEWER_2_USERNAME: Final = 'reviewer2'
    REVIEWER_2_EMAIL: Final = 'reviewer2@community.org'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_1_EMAIL, self.REVIEWER_1_USERNAME)
        self.reviewer_1_id = self.get_user_id_from_email(self.REVIEWER_1_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_1_id, True, False, False, False)
        self.signup(self.REVIEWER_2_EMAIL, self.REVIEWER_2_USERNAME)
        self.reviewer_2_id = self.get_user_id_from_email(self.REVIEWER_2_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_2_id, True, False, False, False)

        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.log_new_error_counter = test_utils.CallCounter(
            logging.error)
        self.log_new_error_ctx = self.swap(
            logging, 'error', self.log_new_error_counter)
        self.logged_info: List[str] = []
        self.log_new_info_ctx = self.swap(
            logging, 'info', self._mock_logging_info)

        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(  # pylint: disable=line-too-long
                'en', '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        self.reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        self.swap_get_platform_parameter_value = self.swap(
            platform_parameter_services,
            'get_platform_parameter_value',
            self._swap_get_platform_parameter_value_function
        )

    def _create_reviewable_suggestion_email_infos_from_suggestions(
            self,
            suggestions: List[suggestion_registry.BaseSuggestion]
    ) -> List[suggestion_registry.ReviewableSuggestionEmailInfo]:
        """Creates a list of ReviewableSuggestionEmailInfo objects from
        the given suggestions.
        """

        return [
            (
                suggestion_services
                .create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion)
            ) for suggestion in suggestions
        ]

    def _assert_email_data_stored_in_sent_email_model_is_correct(
        self,
        expected_email_html_body: str,
        reviewer_id: Optional[str],
        reviewer_email: str
    ) -> None:
        """Asserts that the created sent email model from the sent email
        contains the right information.
        """
        sent_email_models: Sequence[
            email_models.SentEmailModel
        ] = email_models.SentEmailModel.get_all().filter(
            email_models.SentEmailModel.recipient_id == reviewer_id).fetch()
        self.assertEqual(len(sent_email_models), 1)
        sent_email_model = sent_email_models[0]
        self.assertEqual(
            sent_email_model.subject,
            email_manager
            .CONTRIBUTOR_DASHBOARD_REVIEWER_NOTIFICATION_EMAIL_DATA[
                'email_subject'])
        self.assertEqual(
            sent_email_model.recipient_id, reviewer_id)
        self.assertEqual(
            sent_email_model.recipient_email, reviewer_email)
        self.assertEqual(
            sent_email_model.html_body, expected_email_html_body)
        self.assertEqual(
            sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
        self.assertEqual(
            sent_email_model.sender_email,
            'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
        self.assertEqual(
            sent_email_model.intent,
            feconf.EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS)

    def _swap_get_platform_parameter_value_function(
        self, param_name: str
    ) -> platform_parameter_domain.PlatformDataTypes:
        """Swap function for get_platform_parameter_value.

        Args:
            param_name: str. The name of the platform parameter.

        Returns:
            PlatformDataTypes. The defined data type of the platform parameter.
        """
        if param_name == (
            platform_parameter_list.ParamName.
            CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED.value
        ):
            return True
        elif param_name == (
            platform_parameter_list.ParamName.EMAIL_SENDER_NAME.value
        ):
            return email_manager.EMAIL_SENDER_NAME.default_value
        elif param_name == (
            platform_parameter_list.ParamName.EMAIL_FOOTER.value
        ):
            return email_manager.EMAIL_FOOTER.default_value
        return ''

    def _mock_logging_info(self, msg: str, *args: str) -> None:
        """Mocks logging.info() by appending the log message to the logged info
        list.
        """
        self.logged_info.append(msg % args)

    def _create_translation_suggestion_in_lang_with_html_and_datetime(
        self,
        language_code: str,
        translation_html: str,
        submission_datetime: datetime.datetime
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion in the given language_code with the
        given translation html and submission datetime.
        """
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_INIT_STATE_CONTENT_STR,
            'translation_html': translation_html,
            'data_format': 'html'
        }

        translation_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description')

        translation_suggestion.last_updated = submission_datetime
        return translation_suggestion

    def test_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.cannot_send_emails_ctx, self.log_new_error_ctx:
                reviewer_ids_by_language: DefaultDict[
                        str, List[str]] = DefaultDict(list)
                suggestions_by_language: DefaultDict[str, List[
                        suggestion_registry.
                            ReviewableSuggestionEmailInfo]] = DefaultDict(list)
                reviewer_ids_by_language['en'] = []
                suggestions_by_language['en'] = []

                email_manager.send_reviewer_notifications(
                    reviewer_ids_by_language,
                    suggestions_by_language
                )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0], 'This app cannot send emails to users.')

    def test_email_not_sent_if_no_reviewers_to_notify(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                reviewer_ids_by_language: DefaultDict[
                        str, List[str]] = DefaultDict(list)
                suggestions_by_language: (DefaultDict[str, List[
                        suggestion_registry.
                            ReviewableSuggestionEmailInfo]]) = DefaultDict(
                                list)
                reviewer_ids_by_language['en'] = []
                suggestions_by_language['en'] = []

                email_manager.send_reviewer_notifications(
                    reviewer_ids_by_language,
                    suggestions_by_language
                )

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'No reviewers found for language en to notify')

    def test_email_sent_to_reviewer_with_translation_waiting_days_for_review(
        self
    ) -> None:
        translation_suggestion = (
            self._create_translation_suggestion_in_lang_with_html_and_datetime(
                'en',
                '<p>What is the meaning of life?</p>',
                self.mocked_review_submission_datetime))
        reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))
        review_wait_time = 2
        mocked_datetime_for_utcnow = (
            reviewable_suggestion_email_info.submission_datetime +
            datetime.timedelta(days=review_wait_time))
        expected_email_html_body = (
            'Hi reviewer1' +
            ',<br><br>There are new <a href="%s%s">opportunities</a>' +
            ' to review translations that we think you might be interested' +
            ' in on the Contributor Dashboard page. Here are some examples' +
            ' of contributions that are waiting for review:'
            '<br><br>The following suggestions are available for review: ' +
            '<br><br><ul><li>The following English translation suggestion ' +
            'was submitted for review 2 days ago:<br>What is the' +
            ' meaning of life?</li><br></ul><br>Please take some time ' +
            'to review any of the above contributions '
            '(if they still need a review) or any other contributions ' +
            'on the dashboard. We appreciate your help!<br><br>Thanks again,' +
            ' and happy reviewing!<br><br>The Oppia Contributor Dashboard Team'
            )

        with self.can_send_emails_ctx, self.log_new_error_ctx:
            with self.mock_datetime_utcnow(mocked_datetime_for_utcnow):
                with self.swap_get_platform_parameter_value:
                    reviewer_ids_by_language: DefaultDict[
                        str, List[str]] = DefaultDict(list)
                    suggestions_by_language: DefaultDict[str, List[suggestion_registry.ReviewableSuggestionEmailInfo]] = ( # pylint: disable=line-too-long
                        DefaultDict(list))
                    reviewer_ids_by_language['en'] = [self.reviewer_1_id]
                    suggestions_by_language['en'] = [
                        reviewable_suggestion_email_info]

                    email_manager.send_reviewer_notifications(
                        reviewer_ids_by_language,
                        suggestions_by_language
                    )

        messages = self._get_sent_email_messages(self.REVIEWER_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0].html, (expected_email_html_body % (
                feconf.OPPIA_SITE_URL, feconf.CONTRIBUTOR_DASHBOARD_URL)))


class NotifyAdminsContributorDashboardReviewersNeededTests(
        test_utils.EmailTestBase):
    """Test emailing admins that Contributor Dashboard reviewers are needed in
    specific suggestion types.
    """

    CURRICULUM_ADMIN_1_USERNAME: Final = 'user1'
    CURRICULUM_ADMIN_1_EMAIL: Final = 'user1@community.org'
    CURRICULUM_ADMIN_2_USERNAME: Final = 'user2'
    CURRICULUM_ADMIN_2_EMAIL: Final = 'user2@community.org'
    AUTHOR_EMAIL: Final = 'author@example.com'
    target_id: str = 'exp1'
    skill_id: str = 'skill_123456'

    def _create_translation_suggestion_with_language_code(
        self, language_code: str
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_INIT_STATE_CONTENT_STR,
            'translation_html': '<p>This is the translated content.</p>',
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion(self) -> suggestion_registry.BaseSuggestion:
        """Creates a question suggestion."""
        content_id_generator = translation_domain.ContentIdGenerator()
        add_question_change_dict: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': constants.DEFAULT_LANGUAGE_CODE,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description'
        )

    def _assert_email_data_stored_in_sent_email_model_is_correct(
        self,
        expected_email_html_body: str,
        admin_id: Optional[str],
        admin_email: str
    ) -> None:
        """Asserts that the sent email model that was created from the email
        that was sent contains the right information.
        """
        sent_email_models: Sequence[
            email_models.SentEmailModel
        ] = email_models.SentEmailModel.get_all().filter(
            email_models.SentEmailModel.recipient_id == admin_id).fetch()
        self.assertEqual(len(sent_email_models), 1)
        sent_email_model = sent_email_models[0]
        self.assertEqual(
            sent_email_model.subject,
            email_manager.ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
                'email_subject'])
        self.assertEqual(
            sent_email_model.recipient_id, admin_id)
        self.assertEqual(
            sent_email_model.recipient_email, admin_email)
        self.assertEqual(
            sent_email_model.html_body, expected_email_html_body)
        self.assertEqual(
            sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
        self.assertEqual(
            sent_email_model.sender_email,
            'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
        self.assertEqual(
            sent_email_model.intent,
            feconf.EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS)

    def _mock_logging_info(self, msg: str, *args: str) -> None:
        """Mocks logging.info() by appending the log message to the logged info
        list.
        """
        self.logged_info.append(msg % args)

    def _swap_get_platform_parameter_value_function(
        self, param_name: str
    ) -> platform_parameter_domain.PlatformDataTypes:
        """Swap function for get_platform_parameter_value.

        Args:
            param_name: str. The name of the platform parameter.

        Returns:
            PlatformDataTypes. The defined data type of the platform parameter.
        """
        if param_name == (
            platform_parameter_list.ParamName.
            ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE.value
        ):
            return True
        elif param_name == (
            platform_parameter_list.ParamName.EMAIL_SENDER_NAME.value
        ):
            return email_manager.EMAIL_SENDER_NAME.default_value
        return ''

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(
            self.CURRICULUM_ADMIN_1_EMAIL, self.CURRICULUM_ADMIN_1_USERNAME)
        self.admin_1_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_1_EMAIL)
        self.signup(
            self.CURRICULUM_ADMIN_2_EMAIL, self.CURRICULUM_ADMIN_2_USERNAME)
        self.admin_2_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_2_EMAIL)

        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)

        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.log_new_error_counter = test_utils.CallCounter(
            logging.error)
        self.log_new_error_ctx = self.swap(
            logging, 'error', self.log_new_error_counter)
        self.logged_info: List[str] = []
        self.log_new_info_ctx = self.swap(
            logging, 'info', self._mock_logging_info)

        self.suggestion_types_needing_reviewers: Dict[str, Set[str]] = {
            feconf.SUGGESTION_TYPE_ADD_QUESTION: set()
        }

        self.swap_get_platform_parameter_value = self.swap(
            platform_parameter_services,
            'get_platform_parameter_value',
            self._swap_get_platform_parameter_value_function
        )

    def test_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR
        ) as logs:
            with self.cannot_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(  # pylint: disable=line-too-long
                    [self.admin_1_id], [], [],
                    self.suggestion_types_needing_reviewers)

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0], 'This app cannot send emails to users.')

    def test_email_not_sent_if_notifying_admins_reviewers_needed_is_disabled(
        self
    ) -> None:
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(  # pylint: disable=line-too-long
                    [self.admin_1_id], [], [],
                    self.suggestion_types_needing_reviewers)

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'The "enable_admin_notifications_for_reviewer_shortage" '
                'property must be enabled on the admin config page in order to '
                'send admins the emails.')

    def test_email_not_sent_if_no_admins_to_notify(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR
        ) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(  # pylint: disable=line-too-long
                    [], [], [],
                    self.suggestion_types_needing_reviewers)

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0], 'There were no admins to notify.')

    def test_email_not_sent_if_no_suggestion_types_that_need_reviewers(
        self
    ) -> None:
        with self.can_send_emails_ctx, self.log_new_info_ctx:
            with self.swap_get_platform_parameter_value:
                (
                    email_manager.
                    send_mail_to_notify_admins_that_reviewers_are_needed(
                        [self.admin_1_id], [], [], {})
                )

        messages = self._get_all_sent_email_messages()
        self.assertEqual(len(messages), 0)
        self.assertEqual(
            self.logged_info[0],
            'There were no suggestion types that needed more reviewers on the '
            'Contributor Dashboard.')

    def test_email_not_sent_if_admin_email_does_not_exist(self) -> None:
        with self.swap_get_platform_parameter_value, self.capture_logging(
            min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx, self.log_new_error_ctx:
                email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(  # pylint: disable=line-too-long
                    ['admin_id_without_email'], [], [],
                    self.suggestion_types_needing_reviewers)

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)
            self.assertEqual(self.log_new_error_counter.times_called, 1)
            self.assertEqual(
                logs[0],
                'There was no email for the given admin id: '
                'admin_id_without_email.'
            )

    def test_email_sent_to_admin_if_question_suggestions_need_reviewers(
        self
    ) -> None:
        self._create_question_suggestion()
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_ADD_QUESTION: set()})
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>question suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> where there are not '
            'enough reviewers.'
            '<br><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id], [], [],
                self.suggestion_types_needing_reviewers)

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_email_sent_to_admins_if_question_suggestions_need_reviewers(
        self
    ) -> None:
        self._create_question_suggestion()
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_ADD_QUESTION: set()})
        expected_email_html_body_for_admin_1 = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>question suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> where there are not '
            'enough reviewers.'
            '<br><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )
        expected_email_html_body_for_admin_2 = (
            'Hi user2,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>question suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> where there are not '
            'enough reviewers.'
            '<br><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id, self.admin_2_id], [], [],
                suggestion_types_needing_reviewers)

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_1)
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_1, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_2, self.admin_2_id,
            self.CURRICULUM_ADMIN_2_EMAIL)

    def test_admin_email_sent_if_translations_need_reviewers_for_one_lang(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {'hi'}})
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>हिन्दी (Hindi) translation suggestions</b> '
            'created on the <a href="%s%s">Contributor Dashboard page</a> where'
            ' there are not enough reviewers.<br><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id], [], [],
                suggestion_types_needing_reviewers)

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_admin_emails_sent_if_translations_need_reviewers_for_one_lang(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('hi')
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {'hi'}})
        expected_email_html_body_for_admin_1 = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>हिन्दी (Hindi) translation suggestions</b> '
            'created on the <a href="%s%s">Contributor Dashboard page</a> where'
            ' there are not enough reviewers.<br><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )
        expected_email_html_body_for_admin_2 = (
            'Hi user2,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>हिन्दी (Hindi) translation suggestions</b> '
            'created on the <a href="%s%s">Contributor Dashboard page</a> where'
            ' there are not enough reviewers.<br><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id, self.admin_2_id], [], [],
                suggestion_types_needing_reviewers)

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_1)
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_1, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_2, self.admin_2_id,
            self.CURRICULUM_ADMIN_2_EMAIL)

    def test_admin_email_sent_if_translations_need_reviewers_for_multi_lang(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('fr')
        self._create_translation_suggestion_with_language_code('hi')
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {
                'fr', 'hi'}})
        expected_email_html_body = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>translation suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> in languages where '
            'there are not enough reviewers. The languages that need more '
            'reviewers are:'
            '<br><ul>'
            '<li><b>français (French)</b></li><br>'
            '<li><b>हिन्दी (Hindi)</b></li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id], [], [],
                suggestion_types_needing_reviewers)

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)

        # Make sure correct email model is stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)

    def test_admin_emails_sent_if_translations_need_reviewers_for_multi_lang(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('fr')
        self._create_translation_suggestion_with_language_code('hi')
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {
                'fr', 'hi'}})
        expected_email_html_body_for_admin_1 = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>translation suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> in languages where '
            'there are not enough reviewers. The languages that need more '
            'reviewers are:'
            '<br><ul>'
            '<li><b>français (French)</b></li><br>'
            '<li><b>हिन्दी (Hindi)</b></li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )
        expected_email_html_body_for_admin_2 = (
            'Hi user2,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>translation suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> in languages where '
            'there are not enough reviewers. The languages that need more '
            'reviewers are:'
            '<br><ul>'
            '<li><b>français (French)</b></li><br>'
            '<li><b>हिन्दी (Hindi)</b></li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id, self.admin_2_id], [], [],
                suggestion_types_needing_reviewers)

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_1)
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_2)

        # Make sure correct email models are stored.
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_1, self.admin_1_id,
            self.CURRICULUM_ADMIN_1_EMAIL)
        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_2, self.admin_2_id,
            self.CURRICULUM_ADMIN_2_EMAIL)

    def test_email_sent_to_admins_if_mutli_suggestion_types_needing_reviewers(
        self
    ) -> None:
        self._create_translation_suggestion_with_language_code('fr')
        self._create_translation_suggestion_with_language_code('hi')
        self._create_question_suggestion()
        suggestion_types_needing_reviewers = (
            suggestion_services.get_suggestion_types_that_need_reviewers())
        self.assertDictEqual(
            suggestion_types_needing_reviewers,
            {
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {
                    'fr', 'hi'},
                feconf.SUGGESTION_TYPE_ADD_QUESTION: set()
            })
        expected_email_html_body_for_admin_1 = (
            'Hi user1,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>translation suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> in languages where '
            'there are not enough reviewers. The languages that need more '
            'reviewers are:'
            '<br><ul>'
            '<li><b>français (French)</b></li><br>'
            '<li><b>हिन्दी (Hindi)</b></li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )
        expected_email_html_body_for_admin_2 = (
            'Hi user2,'
            '<br><br>'
            'In the <a href="%s%s#/roles">admin roles page,</a> please add '
            'reviewers to the Contributor Dashboard community by entering '
            'their username(s) and allow reviewing for the suggestion types '
            'that need more reviewers bolded below.'
            '<br><br>'
            'There have been <b>translation suggestions</b> created on the '
            '<a href="%s%s">Contributor Dashboard page</a> in languages where '
            'there are not enough reviewers. The languages that need more '
            'reviewers are:'
            '<br><ul>'
            '<li><b>français (French)</b></li><br>'
            '<li><b>हिन्दी (Hindi)</b></li><br>'
            '</ul><br>'
            'Thanks so much - we appreciate your help!<br><br>'
            'Best Wishes!<br>'
            '- The Oppia Contributor Dashboard Team' % (
                feconf.OPPIA_SITE_URL, feconf.ADMIN_URL, feconf.OPPIA_SITE_URL,
                feconf.CONTRIBUTOR_DASHBOARD_URL)
        )

        with self.swap_get_platform_parameter_value, self.can_send_emails_ctx:
            email_manager.send_mail_to_notify_admins_that_reviewers_are_needed(
                [self.admin_1_id], [self.admin_2_id], [],
                suggestion_types_needing_reviewers)

        # Make sure correct emails are sent.
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_1_EMAIL)
        messages.sort(key=lambda m: m.html)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[1].html, expected_email_html_body_for_admin_1)
        messages = self._get_sent_email_messages(self.CURRICULUM_ADMIN_2_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body_for_admin_2)

        # Make sure correct email models are stored.
        sent_email_models: Sequence[
            email_models.SentEmailModel
        ] = email_models.SentEmailModel.get_all().filter(
            email_models.SentEmailModel.recipient_id == self.admin_1_id).fetch()
        # Here, we are narrowing down the type of 'sent_email_models' from
        # Sequence to List. Because Sequence is a broader type and it does not
        # contain extra methods (e.g: .sort()), and below we are using .sort()
        # method by assuming that 'sent_email_models' is an instance of list.
        # So, to avoid error we used assertion here.
        assert isinstance(sent_email_models, list)
        self.assertEqual(len(sent_email_models), 2)
        email_sort_fn: Callable[[email_models.SentEmailModel], str] = (
            lambda m: m.html_body if isinstance(m.html_body, str) else ''
        )
        sent_email_models.sort(key=email_sort_fn)
        sent_email_model = sent_email_models[1]
        self.assertEqual(
            sent_email_model.subject,
            email_manager.ADMIN_NOTIFICATION_FOR_REVIEWER_SHORTAGE_EMAIL_DATA[
                'email_subject'])
        self.assertEqual(
            sent_email_model.recipient_id, self.admin_1_id)
        self.assertEqual(
            sent_email_model.recipient_email, self.CURRICULUM_ADMIN_1_EMAIL)
        self.assertEqual(
            sent_email_model.html_body, expected_email_html_body_for_admin_1)
        self.assertEqual(
            sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
        self.assertEqual(
            sent_email_model.sender_email,
            'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
        self.assertEqual(
            sent_email_model.intent,
            feconf.EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS)

        self._assert_email_data_stored_in_sent_email_model_is_correct(
            expected_email_html_body_for_admin_2, self.admin_2_id,
            self.CURRICULUM_ADMIN_2_EMAIL)


class QueryStatusNotificationEmailTests(test_utils.EmailTestBase):
    """Test that email is send to submitter when query has completed
    or failed.
    """

    SUBMITTER_USERNAME: Final = 'submit'
    SUBMITTER_EMAIL: Final = 'submit@example.com'
    SENDER_USERNAME: Final = 'sender'
    SENDER_EMAIL: Final = 'sender@example.com'
    RECIPIENT_A_EMAIL: Final = 'a@example.com'
    RECIPIENT_A_USERNAME: Final = 'usera'
    RECIPIENT_B_EMAIL: Final = 'b@example.com'
    RECIPIENT_B_USERNAME: Final = 'userb'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.SUBMITTER_EMAIL, self.SUBMITTER_USERNAME)
        self.submitter_id = self.get_user_id_from_email(self.SUBMITTER_EMAIL)
        self.signup(self.SENDER_EMAIL, self.SENDER_USERNAME)
        self.sender_id = self.get_user_id_from_email(self.SENDER_EMAIL)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.signup(self.RECIPIENT_A_EMAIL, self.RECIPIENT_A_USERNAME)
        self.signup(self.RECIPIENT_B_EMAIL, self.RECIPIENT_B_USERNAME)
        self.set_curriculum_admins([self.SENDER_USERNAME, ])
        self.recipient_a_id = self.get_user_id_from_email(
            self.RECIPIENT_A_EMAIL)
        self.recipient_b_id = self.get_user_id_from_email(
            self.RECIPIENT_B_EMAIL)
        self.recipient_ids = [self.recipient_a_id, self.recipient_b_id]

    def test_that_correct_completion_email_is_sent(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
            messages = self._get_sent_email_messages(
                self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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

    def test_that_correct_failure_email_is_sent(self) -> None:
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
            '<a href="http://localhost:8181/preferences">Preferences</a> page.')

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
            '(Sent from dev-project-id)\n\n'
            'Query job with qid query id has failed in its execution.\n'
            'Query parameters:\n\n'
            'key1: val1\n'
            'key2: val2\n')

        with self.can_send_emails_ctx:
            email_manager.send_query_failure_email(
                self.submitter_id, query_id, query_params)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)
            self.assertEqual(messages[0].body, expected_email_text_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
            admin_messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(admin_messages), 1)
            self.assertEqual(
                admin_messages[0].body, expected_admin_email_text_body)

    def test_send_user_query_email(self) -> None:
        email_subject = 'Bulk Email User Query Subject'
        email_body = 'Bulk Email User Query Body'
        email_intent = feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION
        with self.can_send_emails_ctx:
            email_manager.send_user_query_email(
                self.sender_id, self.recipient_ids,
                email_subject,
                email_body,
                email_intent)
            messages_a = self._get_sent_email_messages(
                self.RECIPIENT_A_EMAIL)
            self.assertEqual(len(messages_a), 1)

            messages_b = self._get_sent_email_messages(
                self.RECIPIENT_B_EMAIL)
            self.assertEqual(len(messages_b), 1)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.BulkEmailModel
            ] = email_models.BulkEmailModel.get_all().fetch()
            self.assertEqual(len(all_models), 1)
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, email_subject)
            self.assertEqual(
                sent_email_model.sender_id, self.sender_id)
            self.assertEqual(
                sent_email_model.sender_email,
                '%s <%s>' % (self.SENDER_USERNAME, self.SENDER_EMAIL))
            self.assertEqual(
                sent_email_model.intent,
                email_intent)


class AccountDeletionEmailUnitTest(test_utils.EmailTestBase):
    """Unit test related to account deletion application emails."""

    APPLICANT_USERNAME: Final = 'applicant'
    APPLICANT_EMAIL: Final = 'applicant@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.APPLICANT_EMAIL, self.APPLICANT_USERNAME)
        self.applicant_id = self.get_user_id_from_email(self.APPLICANT_EMAIL)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_account_deleted_email(
                self.applicant_id, self.APPLICANT_EMAIL)

        messages = self._get_sent_email_messages(
            self.APPLICANT_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_account_deletion_failed_email_is_sent_correctly(self) -> None:
        dummy_admin_address = 'admin@system.com'

        admin_email_ctx = self.swap(
            feconf, 'ADMIN_EMAIL_ADDRESS', dummy_admin_address)

        with self.can_send_emails_ctx, admin_email_ctx:
            # Make sure there are no emails already sent.
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(messages, [])

            # Send an account deletion failed email to admin.
            email_manager.send_account_deletion_failed_email(
                self.applicant_id, self.APPLICANT_EMAIL
            )

            # Make sure emails are sent.
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].to, ['admin@system.com'])
            self.assertEqual(
                messages[0].subject,
                'WIPEOUT: Account deletion failed'
            )
            self.assertIn(
                'The Wipeout process failed for the user with ID \'%s\' and '
                'email \'%s\'.' % (self.applicant_id, self.APPLICANT_EMAIL),
                messages[0].html
            )

    def test_that_correct_account_deleted_email_is_sent(self) -> None:
        expected_email_subject = 'Account deleted'
        expected_email_html_body = (
            'Hi applicant@example.com,<br><br>'
            'Your account was successfully deleted.<br><br>'
            '- The Oppia Team')

        with self.can_send_emails_ctx:
            email_manager.send_account_deleted_email(
                self.applicant_id, self.APPLICANT_EMAIL)

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.APPLICANT_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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


class BulkEmailsTests(test_utils.EmailTestBase):
    SENDER_EMAIL: Final = 'sender@example.com'
    SENDER_USERNAME: Final = 'sender'
    FAKE_SENDER_EMAIL: Final = 'fake@example.com'
    FAKE_SENDER_USERNAME: Final = 'fake'
    RECIPIENT_A_EMAIL: Final = 'a@example.com'
    RECIPIENT_A_USERNAME: Final = 'usera'
    RECIPIENT_B_EMAIL: Final = 'b@example.com'
    RECIPIENT_B_USERNAME: Final = 'userb'

    def setUp(self) -> None:
        super().setUp()
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

        self.set_curriculum_admins([self.SENDER_USERNAME])
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)

    def test_that_correct_email_is_sent(self) -> None:
        email_subject = 'Dummy subject'
        email_html_body = 'Dummy email body.<br>'
        email_text_body = 'Dummy email body.\n'

        with self.can_send_emails_ctx:
            email_manager.send_user_query_email(
                self.sender_id, self.recipient_ids, email_subject,
                email_html_body, feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION)

        messages_a = self._get_sent_email_messages(
            self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 1)
        self.assertEqual(messages_a[0].html, email_html_body)
        self.assertEqual(messages_a[0].body, email_text_body)

        messages_b = self._get_sent_email_messages(
            self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 1)
        self.assertEqual(messages_b[0].html, email_html_body)
        self.assertEqual(messages_b[0].body, email_text_body)

        # Make sure correct email model is stored.
        all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.BulkEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 1)
        sent_email_model = all_models[0]
        self.assertEqual(
            sent_email_model.subject, email_subject)
        self.assertEqual(
            sent_email_model.html_body, email_html_body)
        self.assertEqual(
            sent_email_model.sender_id, self.sender_id)
        self.assertEqual(
            sent_email_model.sender_email,
            '%s <%s>' % (self.SENDER_USERNAME, self.SENDER_EMAIL))
        self.assertEqual(
            sent_email_model.intent,
            feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION)

    def test_email_not_sent_if_original_html_not_matches_cleaned_html(
        self
    ) -> None:
        email_subject = 'Dummy Email Subject'
        email_html_body = 'Dummy email body.<td>'

        with self.can_send_emails_ctx:
            email_manager.send_user_query_email(
                self.sender_id, self.recipient_ids,
                email_subject, email_html_body,
                feconf.BULK_EMAIL_INTENT_CREATE_EXPLORATION)

        # Check that no email was sent.
        messages_a = self._get_sent_email_messages(
            self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 0)

        messages_b = self._get_sent_email_messages(
            self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 0)

    def test_that_exception_is_raised_for_unauthorised_sender(self) -> None:
        with self.can_send_emails_ctx, (
            self.assertRaisesRegex(
                Exception, 'Invalid sender_id for email')):
            email_manager.send_user_query_email(
                self.fake_sender_id, self.recipient_ids, 'email_subject',
                'email_html_body', feconf.BULK_EMAIL_INTENT_MARKETING)

        messages_a = self._get_sent_email_messages(
            self.RECIPIENT_A_EMAIL)
        self.assertEqual(len(messages_a), 0)

        messages_b = self._get_sent_email_messages(
            self.RECIPIENT_B_EMAIL)
        self.assertEqual(len(messages_b), 0)

        all_models: Sequence[
            email_models.BulkEmailModel
        ] = email_models.BulkEmailModel.get_all().fetch()
        self.assertEqual(len(all_models), 0)

    def test_that_test_email_is_sent_for_bulk_emails(self) -> None:
        email_subject = 'Test Subject'
        email_body = 'Test Body'
        with self.can_send_emails_ctx:
            email_manager.send_test_email_for_bulk_emails(
                self.sender_id, email_subject, email_body
            )
        messages = self._get_sent_email_messages(self.SENDER_EMAIL)
        self.assertEqual(len(messages), 1)


class EmailPreferencesTests(test_utils.EmailTestBase):

    def test_can_users_receive_thread_email(self) -> None:
        gae_ids = ('someUser1', 'someUser2')
        exp_id = 'someExploration'
        usernames = ('username1', 'username2')
        emails = ('user1@example.com', 'user2@example.com')

        user_ids = []
        for user_id, username, user_email in zip(gae_ids, usernames, emails):
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


class ModeratorActionEmailsTests(test_utils.EmailTestBase):
    RECIPIENT_EMAIL: Final = 'a@example.com'
    RECIPIENT_USERNAME: Final = 'usera'

    def setUp(self) -> None:
        super().setUp()
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

    def test_exception_raised_if_email_on_moderator_action_is_false(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'For moderator emails to be sent, please ensure that '
            'REQUIRE_EMAIL_ON_MODERATOR_ACTION is set to True.'):
            email_manager.require_moderator_email_prereqs_are_satisfied()

    def test_exception_raised_if_can_send_emails_is_false(self) -> None:
        with self.can_send_email_moderator_action_ctx, self.assertRaisesRegex(
            Exception,
            'For moderator emails to be sent, please ensure that '
            'CAN_SEND_EMAILS is set to True.'):
            email_manager.require_moderator_email_prereqs_are_satisfied()

    def test_correct_email_draft_received_on_exploration_unpublish(
        self
    ) -> None:
        expected_draft_text_body = (
            'I\'m writing to inform you that '
            'I have unpublished the above exploration.')
        with self.can_send_emails_ctx, self.can_send_email_moderator_action_ctx:
            d_text = email_manager.get_moderator_unpublish_exploration_email()
            self.assertEqual(d_text, expected_draft_text_body)

    def test_blank_draft_received_exploration_unpublish_exception_raised(
        self
    ) -> None:
        expected_draft_text_body = ''
        with self.can_not_send_emails_ctx:
            d_text = email_manager.get_moderator_unpublish_exploration_email()
            self.assertEqual(d_text, expected_draft_text_body)

    def test_correct_moderator_action_email_sent(self) -> None:
        email_intent = 'unpublish_exploration'
        exploration_title = 'Title'
        email_html_body = 'Dummy email body.<br>'
        with self.can_send_emails_ctx, (
            self.can_send_email_moderator_action_ctx):
            email_manager.send_moderator_action_email(
                self.moderator_id, self.recipient_id,
                email_intent, exploration_title, email_html_body)
        messages = self._get_sent_email_messages(
            self.RECIPIENT_EMAIL)
        self.assertEqual(len(messages), 1)


class CDUserEmailTest(test_utils.EmailTestBase):
    """Test for assignment and removal of contribution reviewers."""

    TRANSLATION_REVIEWER_EMAIL: Final = 'translationreviewer@example.com'
    QUESTION_REVIEWER_EMAIL: Final = 'questionreviewer@example.com'
    QUESTION_SUBMITTER_EMAIL: Final = 'questionsubmitter@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.QUESTION_SUBMITTER_EMAIL, 'questionSuggestor')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.translation_reviewer_id, True, False, False, False)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.question_reviewer_id, True, False, False, False)
        self.question_submitter_id = self.get_user_id_from_email(
            self.QUESTION_SUBMITTER_EMAIL)
        user_services.update_email_preferences(
            self.question_submitter_id, True, False, False, False)

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)

    def test_assign_translation_reviewer_email_for_can_send_emails_is_false(
        self
    ) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_email_to_new_cd_user(
                self.translation_reviewer_id,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                language_code='hi')

        messages = self._get_sent_email_messages(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_without_language_code_email_not_sent_to_new_translation_reviewer(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The language_code cannot be None'
        ):
            with self.can_not_send_emails_ctx:
                email_manager.send_email_to_new_cd_user(
                    self.translation_reviewer_id,
                    constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION
                )

    def test_without_language_code_email_not_sent_to_removed_translation_reviewer(   # pylint: disable=line-too-long
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'The language_code cannot be None'
        ):
            with self.can_not_send_emails_ctx:
                email_manager.send_email_to_removed_cd_user(
                    self.translation_reviewer_id,
                    constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION)

    def test_assign_translation_reviewer_email_for_invalid_category(
        self
    ) -> None:
        with self.assertRaisesRegex(Exception, 'Invalid category'):
            email_manager.send_email_to_new_cd_user(
                self.translation_reviewer_id, 'invalid_category')

    def test_schema_of_new_cd_user_email_data_constant(self) -> None:
        self.assertEqual(
            sorted(email_manager.NEW_CD_USER_EMAIL_DATA.keys()),
            [
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION
            ])
        for category_details in (
            email_manager.NEW_CD_USER_EMAIL_DATA.values()
        ):
            self.assertEqual(len(category_details), 5)
            self.assertTrue(
                'description' in category_details or (
                    'description_template' in category_details))
            self.assertTrue('category' in category_details)
            self.assertTrue(
                'rights_message' in category_details or (
                    'rights_message_template' in category_details))
            self.assertTrue('to_review' in category_details or (
                    'to_submit' in category_details))

    def test_send_assigned_translation_reviewer_email(self) -> None:
        expected_email_subject = (
            'You have been invited to review Oppia translations')
        expected_email_html_body = (
            'Hi translator,<br><br>'
            'This is to let you know that the Oppia team has added you as a '
            'reviewer for हिन्दी (hindi) language translations. This allows you'
            ' to review translation suggestions made by contributors in the '
            'हिन्दी (hindi) language.<br><br>'
            'You can check the translation suggestions waiting for review in '
            'the <a href="https://www.oppia.org/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_new_cd_user(
                self.translation_reviewer_id,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.TRANSLATION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
                sent_email_model.intent,
                feconf.EMAIL_INTENT_ONBOARD_CD_USER)

    def test_send_assigned_question_reviewer_email(self) -> None:
        expected_email_subject = (
            'You have been invited to review Oppia questions')
        expected_email_html_body = (
            'Hi question,<br><br>'
            'This is to let you know that the Oppia team has added you as a '
            'reviewer for questions. This allows you to review question '
            'suggestions made by contributors.<br><br>'
            'You can check the question suggestions waiting for review in the '
            '<a href="https://www.oppia.org/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_new_cd_user(
                self.question_reviewer_id,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.QUESTION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
                sent_email_model.intent,
                feconf.EMAIL_INTENT_ONBOARD_CD_USER)

    def test_send_assigned_question_submitter_email(self) -> None:
        expected_email_subject = (
            'You have been invited to submit Oppia questions')
        expected_email_html_body = (
            'Hi questionSuggestor,<br><br>'
            'This is to let you know that the Oppia team has added you as a '
            'contributor to submit question suggestions ' 
            'for use in lessons.<br><br>'
            'You can now start to submit questions in the '
            '<a href="https://www.oppia.org/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_new_cd_user(
                self.question_submitter_id,
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.QUESTION_SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.question_submitter_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.QUESTION_SUBMITTER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_ONBOARD_CD_USER)

    def test_email_is_not_sent_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_email_to_removed_cd_user(
                self.translation_reviewer_id,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                language_code='hi')

        messages = self._get_sent_email_messages(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.assertEqual(len(messages), 0)

    def test_remove_translation_reviewer_email_for_invalid_category(
        self
    ) -> None:
        with self.assertRaisesRegex(Exception, 'Invalid category'):
            email_manager.send_email_to_removed_cd_user(
                self.translation_reviewer_id, 'invalid_category')

    def test_schema_of_removed_reviewer_email_data_constant(self) -> None:
        self.assertEqual(
            sorted(email_manager.REMOVED_CD_USER_EMAIL_DATA.keys()),
                [
                    constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                    constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                    constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION
                ])
        for category_details in (
                email_manager.REMOVED_CD_USER_EMAIL_DATA.values()):
            self.assertEqual(len(category_details), 3)
            self.assertTrue(
                'role_description' in category_details or (
                    'role_description_template' in category_details))
            self.assertTrue('category' in category_details)
            self.assertTrue(
                'rights_message' in category_details or (
                    'rights_message_template' in category_details))

    def test_send_removed_translation_reviewer_email(self) -> None:
        expected_email_subject = (
            'You have been unassigned as a translation reviewer')
        expected_email_html_body = (
            'Hi translator,<br><br>'
            'The Oppia team has removed you from the translation reviewer role '
            'in the हिन्दी (hindi) language. You won\'t be able to review '
            'translation suggestions made by contributors in the हिन्दी (hindi)'
            ' language any more, but you can still contribute translations '
            'through the <a href="https://www.oppia.org/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_removed_cd_user(
                self.translation_reviewer_id,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.TRANSLATION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
                sent_email_model.intent, feconf.EMAIL_INTENT_REMOVE_CD_USER)

    def test_send_removed_question_reviewer_email(self) -> None:
        expected_email_subject = (
            'You have been unassigned as a question reviewer')
        expected_email_html_body = (
            'Hi question,<br><br>'
            'The Oppia team has removed you from the question reviewer role. '
            'You won\'t be able to review question suggestions made by '
            'contributors any more, but you can still contribute questions '
            'through the <a href="https://www.oppia.org/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_removed_cd_user(
                self.question_reviewer_id,
                constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.QUESTION_REVIEWER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
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
                sent_email_model.intent, feconf.EMAIL_INTENT_REMOVE_CD_USER)

    def test_send_removed_question_submitter_email(self) -> None:
        expected_email_subject = (
            'You have been unassigned as a question submitter')
        expected_email_html_body = (
            'Hi questionSuggestor,<br><br>'
            'The Oppia team has removed you from the question submitter role. '
            'You won\'t be able to submit question suggestions '
            'any more, but you can still contribute questions '
            'through the <a href="https://www.oppia.org/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Thanks, and happy contributing!<br><br>'
            'Best wishes,<br>'
            'The Oppia Community')

        with self.can_send_emails_ctx:
            email_manager.send_email_to_removed_cd_user(
                self.question_submitter_id,
                constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                language_code='hi')

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.QUESTION_SUBMITTER_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.SentEmailModel
            ] = email_models.SentEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.recipient_id, self.question_submitter_id)
            self.assertEqual(
                sent_email_model.recipient_email, self.QUESTION_SUBMITTER_EMAIL)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                'Site Admin <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent, feconf.EMAIL_INTENT_REMOVE_CD_USER)


class NotMergeableChangesEmailUnitTest(test_utils.EmailTestBase):
    """Unit test related to not mergeable change list emails sent to admin."""

    dummy_admin_address: str = 'admin@system.com'

    def setUp(self) -> None:
        super().setUp()
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.admin_email_ctx = self.swap(
            feconf, 'ADMIN_EMAIL_ADDRESS', self.dummy_admin_address)

    def test_not_mergeable_change_list_email_is_sent_correctly(self) -> None:
        with self.can_send_emails_ctx, self.admin_email_ctx:
            # Make sure there are no emails already sent.
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(messages, [])

            # Send an account deletion failed email to admin.
            email_manager.send_not_mergeable_change_list_to_admin_for_review(
                'testExploration', 1, 2, [{'field1': 'value1'}]
            )

            # Make sure emails are sent.
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].to, ['admin@system.com'])
            self.assertEqual(
                messages[0].subject,
                'Some changes were rejected due to a conflict'
            )
            self.assertIn(
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration '
                'testExploration because the changes were conflicting and '
                'could not be saved. Please see the '
                'rejected change list below:<br>'
                'Discarded change list: [{\'field1\': \'value1\'}] <br><br>'
                'Frontend Version: 1<br>'
                'Backend Version: 2<br><br>'
                'Thanks!',
                messages[0].html
            )


class MailchimpSecretTest(test_utils.GenericTestBase):
    """Tests for the verify_mailchimp_secret."""

    def setUp(self) -> None:
        super().setUp()
        self.swap_webhook_secrets_return_none = self.swap_to_always_return(
            secrets_services, 'get_secret', None)
        self.swap_webhook_secrets_return_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'secret',
            expected_args=[
                ('MAILCHIMP_WEBHOOK_SECRET',),
                ('MAILCHIMP_WEBHOOK_SECRET',),
            ]
        )

    def test_cloud_secrets_return_none_logs_exception(self) -> None:
        with self.swap_webhook_secrets_return_none:
            with self.capture_logging(min_level=logging.WARNING) as logs:
                self.assertFalse(
                    email_manager.verify_mailchimp_secret('secret'))
                self.assertEqual(
                    ['Mailchimp Webhook secret is not available.'], logs
                )

    def test_cloud_secrets_return_secret_passes(self) -> None:
        with self.swap_webhook_secrets_return_secret:
            self.assertTrue(
                email_manager.verify_mailchimp_secret('secret'))
            self.assertFalse(
                email_manager.verify_mailchimp_secret('not-secret'))


class CurriculumAdminsChapterNotificationsReminderMailTests(
    test_utils.EmailTestBase):
    CURRICULUM_ADMIN_1_USERNAME: Final = 'user1'
    CURRICULUM_ADMIN_1_EMAIL: Final = 'user1@community.org'
    CURRICULUM_ADMIN_2_USERNAME: Final = 'user2'
    CURRICULUM_ADMIN_2_EMAIL: Final = 'user2@community.org'

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_1_EMAIL, self.CURRICULUM_ADMIN_1_USERNAME)
        self.admin_1_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_1_EMAIL)
        self.signup(
            self.CURRICULUM_ADMIN_2_EMAIL, self.CURRICULUM_ADMIN_2_USERNAME)
        self.admin_2_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_2_EMAIL)
        self.can_send_emails_ctx = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.can_not_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        self.log_new_error_counter = test_utils.CallCounter(
            logging.error)

    def test_that_email_not_sent_if_can_send_emails_is_false(self) -> None:
        with self.can_not_send_emails_ctx:
            email_manager.send_reminder_mail_to_notify_curriculum_admins(
                [self.CURRICULUM_ADMIN_1_EMAIL, self.CURRICULUM_ADMIN_2_EMAIL],
                [])

            messages = self._get_sent_email_messages(
                self.CURRICULUM_ADMIN_1_EMAIL)
            self.assertEqual(len(messages), 0)
            messages = self._get_sent_email_messages(
                self.CURRICULUM_ADMIN_2_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_email_not_sent_if_no_admins_to_notify(self) -> None:
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with self.can_send_emails_ctx:
                email_manager.send_reminder_mail_to_notify_curriculum_admins(
                    [], [])

                messages = self._get_all_sent_email_messages()
                self.assertEqual(len(messages), 0)
                self.assertEqual(
                    logs[0], 'There were no curriculum admins to notify.')

    def test_email_not_sent_if_no_overdue_or_upcoming_chapters(self) -> None:
        story_publication_timeliness = story_domain.StoryPublicationTimeliness(
            'story_1', 'Story', 'Topic', [], [])
        with self.can_send_emails_ctx:
            email_manager.send_reminder_mail_to_notify_curriculum_admins(
                [self.admin_1_id], [story_publication_timeliness])

            messages = self._get_all_sent_email_messages()
            self.assertEqual(len(messages), 0)

    def test_email_sent_if_chapters_are_overdue(self) -> None:
        story_publication_timeliness = story_domain.StoryPublicationTimeliness(
            'story_1', 'Story', 'Topic', ['Chapter 1', 'Chapter 2'], []
        )
        expected_email_html_body = (
            'Dear Curriculum Admin, <br><br>'
            'The following stories have unpublished chapters which are behind '
            'schedule. Please publish them or adjust the planned publication '
            'date.<br><br>'
            '<ol>'
            '<li>Story (Topic) - <a href="%s">Link</a><ul>'
            '<li>Chapter 1</li>'
            '<li>Chapter 2</li>'
            '</ul></li>'
            '</ol>'
            'Regards,<br> Oppia Foundation'
        ) % (
            str(feconf.OPPIA_SITE_URL) + str(feconf.STORY_EDITOR_URL_PREFIX) +
            '/story_1')
        expected_email_subject = 'Chapter Publication Notifications'

        with self.can_send_emails_ctx:
            email_manager.send_reminder_mail_to_notify_curriculum_admins(
                [self.admin_1_id], [story_publication_timeliness]
            )

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.CURRICULUM_ADMIN_1_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.BulkEmailModel
            ] = email_models.BulkEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                '. <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CURRICULUM_ADMINS_CHAPTERS)
            self.assertEqual(
                sent_email_model.html_body, expected_email_html_body)

    def test_email_sent_if_chapters_are_upcoming(self) -> None:
        story_publication_timeliness = story_domain.StoryPublicationTimeliness(
            'story_1', 'Story', 'Topic', [], ['Chapter 1', 'Chapter 2']
        )
        expected_email_html_body = (
            'Dear Curriculum Admin, <br><br>'
            'The following stories have unpublished chapters which are due for'
            ' publication in the next ' +
            str(constants.CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS) + ' days.'
            ' Please ensure'
            ' they are published on or before the planned date or adjust the '
            'planned publication date.'
            '<br><br>'
            '<ol>'
            '<li>Story (Topic) - <a href="%s">Link</a><ul>'
            '<li>Chapter 1</li>'
            '<li>Chapter 2</li>'
            '</ul></li>'
            '</ol>'
            'Regards,<br> Oppia Foundation'
        ) % (
            str(feconf.OPPIA_SITE_URL) + str(feconf.STORY_EDITOR_URL_PREFIX) +
            '/story_1')
        expected_email_subject = 'Chapter Publication Notifications'

        with self.can_send_emails_ctx:
            email_manager.send_reminder_mail_to_notify_curriculum_admins(
                [self.admin_1_id], [story_publication_timeliness]
            )

            # Make sure correct email is sent.
            messages = self._get_sent_email_messages(
                self.CURRICULUM_ADMIN_1_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].html, expected_email_html_body)

            # Make sure correct email model is stored.
            all_models: Sequence[
                email_models.BulkEmailModel
            ] = email_models.BulkEmailModel.get_all().fetch()
            sent_email_model = all_models[0]
            self.assertEqual(
                sent_email_model.subject, expected_email_subject)
            self.assertEqual(
                sent_email_model.sender_id, feconf.SYSTEM_COMMITTER_ID)
            self.assertEqual(
                sent_email_model.sender_email,
                '. <%s>' % feconf.NOREPLY_EMAIL_ADDRESS)
            self.assertEqual(
                sent_email_model.intent,
                feconf.EMAIL_INTENT_NOTIFY_CURRICULUM_ADMINS_CHAPTERS)
            self.assertEqual(
                sent_email_model.html_body, expected_email_html_body)
