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

from core.domain import platform_parameter_list
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils

from typing import Final


class FeaturedActivitiesHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1: Final = 'exp_id_1'
    EXP_ID_2: Final = 'exp_id_2'
    EXP_ID_3: Final = 'exp_id_3'
    COL_ID_1: Final = 'col_id_1'
    COL_ID_2: Final = 'col_id_2'
    COL_ID_3: Final = 'col_id_3'
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

        self.save_new_valid_collection(
            self.COL_ID_1, self.user_id, exploration_id=self.EXP_ID_1)

        rights_manager.publish_collection(self.user, self.COL_ID_1)

        self.save_new_valid_collection(
            self.COL_ID_2, self.user_id, exploration_id=self.EXP_ID_1)

    def test_nonexistent_exploration_id_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a nonexistent exploration
        # results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_nonexistent_collection_id_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a nonexistent collection
        # results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'collection',
                    'id': self.COL_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_and_nonexistent_exploration_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public exploration
        # and a nonexistent exploration results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }, {
                    'type': 'exploration',
                    'id': self.EXP_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_and_nonexistent_collection_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public collection
        # and a nonexistent collection results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'collection',
                    'id': self.COL_ID_1,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_nonexistent_exploration_and_collection_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a nonexistent exploration
        # and a nonexistent collection results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_3,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_exploration_and_nonexistent_collection_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public exploration
        # and a nonexistent collection results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_collection_and_nonexistent_exploration_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a publlic collection
        # and a nonexistent exploration results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'collection',
                    'id': self.COL_ID_1,
                }, {
                    'type': 'exploration',
                    'id': self.EXP_ID_3,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_private_exploration_id_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a private exploration
        # results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_private_collection_id_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a private collection
        # results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'collection',
                    'id': self.COL_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_and_private_exploration_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public exploration
        # and private exploration results in an error.

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
        self.logout()

    def test_public_and_private_collection_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public exploration
        # and private exploration results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'collection',
                    'id': self.COL_ID_1,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_private_exploration_and_private_collection_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a private exploration
        # and private collection results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_exploration_and_private_collection_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public exploration
        # and private collection results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_collection_and_private_exploration_ids_should_fail(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Posting a list that includes a public collection
        # and private exploration results in an error.

        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'collection',
                    'id': self.COL_ID_1,
                }, {
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }],
            }, csrf_token=csrf_token, expected_status_int=400)
        self.logout()

    def test_public_exploration_and_public_collection_ids_should_succeed(
        self
    ) -> None:
        self.login(self.MODERATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        # Posting a list that only contains public activities succeeds.

        # Public Exploration & Public Collection.
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }, {
                    'type': 'collection',
                    'id': self.COL_ID_1,
                }],
            }, csrf_token=csrf_token)
        featured_activity_references = self.get_json(
            '/moderatorhandler/featured')['featured_activity_references']
        self.assertEqual(featured_activity_references[0]['id'], self.EXP_ID_1)
        self.assertEqual(featured_activity_references[1]['id'], self.COL_ID_1)
        self.logout()


class EmailDraftHandlerTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (
                platform_parameter_list.ParamName.UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY,  # pylint: disable=line-too-long
                'I\'m writing to inform you that '
                'I have unpublished the above exploration.'
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                'system@example.com'
            )
        ]
    )
    def test_get_draft_email_body(self) -> None:
        self.login(self.MODERATOR_EMAIL)
        expected_draft_text_body = (
            'I\'m writing to inform you that '
            'I have unpublished the above exploration.')
        d_text = self.get_json(
            '/moderatorhandler/email_draft')['draft_email_body']
        self.assertEqual(d_text, expected_draft_text_body)
        self.logout()
