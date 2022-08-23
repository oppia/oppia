# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.domain.access_validator."""

from __future__ import annotations

from core import feconf
from core.domain import config_services
from core.tests import test_utils

ACCESS_VALIDATION_HANDLER_PREFIX = feconf.ACCESS_VALIDATION_HANDLER_PREFIX


class ClassroomPageAccessValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME]) # type: ignore[no-untyped-call]
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)) # type: ignore[no-untyped-call]
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL) # type: ignore[no-untyped-call]
        config_services.set_property( # type: ignore[no-untyped-call]
            self.user_id_admin, 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': '',
                'topic_list_intro': ''
            }])

    def test_validation_returns_true_if_classroom_is_available(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response( # type: ignore[no-untyped-call]
            '%s/can_access_classroom_page?classroom_url_fragment=%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'math'))

    def test_validation_returns_false_if_classroom_doesnot_exists(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/can_access_classroom_page?classroom_url_fragment=%s' %
            (ACCESS_VALIDATION_HANDLER_PREFIX, 'not_valid'),
            expected_status_int=404)


class ReleaseCoordinatorAccessValidationHandlerTests(
        test_utils.GenericTestBase):
    """Test for release coordinator access validation."""

    def setUp(self) -> None:
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super().setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_guest_user_does_not_pass_validation(self) -> None:
        self.get_json(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=401)

    def test_exploration_editor_does_not_pass_validation(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX, expected_status_int=401)

    def test_release_coordinator_passes_validation(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        self.get_html_response( # type: ignore[no-untyped-call]
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATION_HANDLER_PREFIX)


class ProfileExistsValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_profile_validation_returns_true_if_user_views_other_profile(
        self
    ) -> None:
        # Viewer looks at editor's profile page.
        self.login(self.VIEWER_EMAIL)
        self.get_html_response( # type: ignore[no-untyped-call]
            '%s/does_profile_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.EDITOR_USERNAME))
        self.logout()

    def test_profile_validation_returns_true_if_user_views_own_profile(
        self
    ) -> None:
        # Editor looks at their own profile page.
        self.login(self.EDITOR_EMAIL)
        self.get_html_response( # type: ignore[no-untyped-call]
            '%s/does_profile_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.EDITOR_USERNAME))
        self.logout()

    def test_profile_validation_returns_false_if_profile_doesnot_exist(
        self
    ) -> None:
        # Editor looks at non-existing profile page.
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/does_profile_exist/%s' % (
                ACCESS_VALIDATION_HANDLER_PREFIX, self.BLOG_ADMIN_USERNAME),
                expected_status_int=404)
        self.logout()


class ManageOwnAccountValidationHandlerTests(test_utils.GenericTestBase):

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.banned_user) # type: ignore[no-untyped-call]

    def test_banned_user_cannot_manage_account(self) -> None:
        self.login(self.banned_user_email)
        self.get_json(
            '%s/can_manage_own_account' % ACCESS_VALIDATION_HANDLER_PREFIX,
            expected_status_int=401)

    def test_normal_user_can_manage_account(self) -> None:
        self.login(self.user_email)
        self.get_html_response( # type: ignore[no-untyped-call]
            '%s/can_manage_own_account' % ACCESS_VALIDATION_HANDLER_PREFIX)
        self.logout()
