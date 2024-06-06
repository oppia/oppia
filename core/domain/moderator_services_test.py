# coding: utf-8
#
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

"""Unit tests for core.domain.moderator services."""

from __future__ import annotations

from core.domain import moderator_services
from core.domain import platform_parameter_list
from core.tests import test_utils


class FlagExplorationEmailEnqueueTaskTests(test_utils.EmailTestBase):
    """Test that flag-exploration-email-tasks works as expected."""

    email_footer = (
        'You can change your email preferences via the '
        '<a href="http://localhost:8181/preferences">Preferences</a> page.'
    )

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.no_user = None

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.owner_ids = [self.editor_id]

        self.report_text = 'AD'

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, email_footer),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'moderator')
        ]
    )
    def test_that_flag_exploration_emails_are_correct(self) -> None:

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

        moderator_services.enqueue_flag_exploration_email_task(
            self.exploration.id, self.report_text, self.new_user_id)

        self.process_and_flush_pending_tasks()

        # Make sure correct email is sent.
        messages = self._get_sent_email_messages(self.MODERATOR_EMAIL)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].html, expected_email_html_body)
        self.assertEqual(messages[0].body, expected_email_text_body)
