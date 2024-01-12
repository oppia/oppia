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

"""Tests for the moderator page."""

from __future__ import annotations

from core import feconf
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils

from typing import Final


class FeaturedActivitiesHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1: Final = 'exp_id_1'
    EXP_ID_2: Final = 'exp_id_2'
    username = 'albert'
    user_email = 'albert@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.user = user_services.get_user_actions_info(self.user_id)
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id)
        rights_manager.publish_exploration(self.user, self.EXP_ID_1)

        self.save_new_valid_exploration(self.EXP_ID_2, self.user_id)

    def test_unpublished_activities_cannot_be_added_to_featured_list(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes private activities results in an error.
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }, {
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)

        # Posting a list that only contains public activities succeeds.
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }],
            }, csrf_token=csrf_token)
        featured_activity_references = self.get_json(
            '/moderatorhandler/featured')['featured_activity_references']
        self.assertEqual(featured_activity_references[0]['id'], self.EXP_ID_1)
        self.logout()


class EmailDraftHandlerTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_email_moderator_action_ctx = self.swap(
            feconf, 'REQUIRE_EMAIL_ON_MODERATOR_ACTION', True)

    def test_get_draft_email_body(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        d_text = self.get_json(
            '/moderatorhandler/email_draft')['draft_email_body']
        self.assertEqual(d_text, '')
        expected_draft_text_body = (
            'I\'m writing to inform you that '
            'I have unpublished the above exploration.')
        with self.can_send_emails_ctx, self.can_send_email_moderator_action_ctx:
            d_text = self.get_json(
                '/moderatorhandler/email_draft')['draft_email_body']
            self.assertEqual(d_text, expected_draft_text_body)
        self.logout()
