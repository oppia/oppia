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

"""Tests for the contributor dashboard admin page controllers."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import user_services
from core.tests import test_utils
import feconf


class ContributorDashboardAdminPageTest(test_utils.GenericTestBase):
    """Test for ContributorDashboardAdminPage."""

    USER_A_EMAIL = 'userA@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL = 'questionadmin@example.com'

    def setUp(self):
        super(ContributorDashboardAdminPageTest, self).setUp()
        self.signup(self.USER_A_EMAIL, 'userA')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationExpert')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionExpert')

        user_services.update_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)
        user_services.update_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)

    def test_non_admin_access_page_raise_404(self):
        self.login(self.USER_A_EMAIL)
        self.get_html_response(
            '/contributor-dashboard-admin', expected_status_int=401)
        self.logout()

    def test_question_admin_can_access_page(self):
        self.login(self.QUESTION_ADMIN_EMAIL)
        response = self.get_html_response('/contributor-dashboard-admin')
        response.mustcontain(
            '<contributor-dashboard-admin-page>'
            '</contributor-dashboard-admin-page>')
        self.logout()

    def test_translation_admin_can_access_page(self):
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        response = self.get_html_response('/contributor-dashboard-admin')
        response.mustcontain(
            '<contributor-dashboard-admin-page>'
            '</contributor-dashboard-admin-page>')
        self.logout()


class AddContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to add reviewers for contributor's
    suggestion/application.
    """

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL = 'questionadmin@example.com'

    def setUp(self):
        super(AddContributionRightsHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationExpert')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionExpert')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)

        user_services.update_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)
        user_services.update_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)

    def test_add_reviewer_with_invalid_username_raise_error(self):
        self.login(self.TRANSLATION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler/translation', {
                'username': 'invalid',
                'language_code': 'en'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_add_translation_reviewer(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.TRANSLATION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_assigning_same_language_for_translation_review_raise_error(self):
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        response = self.post_json(
            '/addcontributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User translator already has rights to review translation in '
            'language code hi')

    def test_add_question_reviewer(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_reviewer_raise_error(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcontributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to review question.')

    def test_add_question_submitter(self):
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_submitter_raise_error(self):
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcontributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to submit question.')

    def test_add_reviewer_for_invalid_category_raise_error(self):
        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler/invalid', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Schema validation for \'category\' failed: Received invalid which '
            'is not in the allowed range of choices: %s' % (
                constants.CONTRIBUTION_RIGHT_CATEGORIES))


class RemoveContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to remove reviewers from contributor dashboard page."""

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL = 'questionadmin@example.com'

    def setUp(self):
        super(RemoveContributionRightsHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationAdmen')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionAdmen')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.update_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)
        user_services.update_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)

    def test_add_reviewer_with_invalid_username_raise_error(self):
        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler/question', {
                'username': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_remove_translation_reviewer(self):
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.TRANSLATION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_unassigned_translation_reviewer_raise_error(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'translator does not have rights to review translation in language '
            'hi.')

    def test_remove_question_reviewer(self):
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler/question', {
                'username': 'question',
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_reviewer_raise_error(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to review question.')

    def test_remove_question_submitter(self):
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_submitter_raise_error(self):
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to submit question.')


class ContributorUsersListHandlerTest(test_utils.GenericTestBase):
    """Tests ContributorUsersListHandler."""

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL = 'questionadmin@example.com'

    def setUp(self):
        super(ContributorUsersListHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationAdmen')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionAdmen')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.update_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)
        user_services.update_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)

    def test_check_contribution_reviewer_by_translation_reviewer_role(self):
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        response = self.get_json(
            '/getcontributorusershandler/translation', params={
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 1)
        self.assertTrue('translator' in response['usernames'])
        self.logout()

    def test_check_contribution_reviewer_by_question_reviewer_role(self):
        self.login(self.QUESTION_ADMIN_EMAIL)
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        response = self.get_json('/getcontributorusershandler/question')

        self.assertEqual(len(response['usernames']), 1)
        self.assertTrue('question' in response['usernames'])
        self.logout()

    def test_check_contributor_user_by_question_submitter_role(self):
        self.login(self.QUESTION_ADMIN_EMAIL)
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        response = self.get_json('/getcontributorusershandler/submit_question')

        self.assertEqual(len(response['usernames']), 1)
        self.assertTrue('question' in response['usernames'])
        self.logout()


class ContributionRightsDataHandlerTest(test_utils.GenericTestBase):
    """Tests ContributionRightsDataHandler."""

    REVIEWER_EMAIL = 'reviewer@example.com'
    TRANSLATION_ADMIN = 'translationadmin@example.com'
    QUESTION_ADMIN = 'questionadmin@example.com'

    def setUp(self):
        super(ContributionRightsDataHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.TRANSLATION_ADMIN, 'translationAdmen')
        self.signup(self.QUESTION_ADMIN, 'questionAdmen')
        user_services.update_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN),
            feconf.ROLE_ID_TRANSLATION_ADMIN)
        user_services.update_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN),
            feconf.ROLE_ID_QUESTION_ADMIN)

        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

    def test_translation_admin_check_contribution_reviewer_rights(self):
        self.login(self.TRANSLATION_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response.keys(), ['can_review_translation_for_language_codes'])
        self.assertEqual(
            response['can_review_translation_for_language_codes'], [])

        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_id)
        user_services.allow_user_to_submit_question(self.reviewer_id)

        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response.keys(), ['can_review_translation_for_language_codes'])
        self.assertEqual(
            response['can_review_translation_for_language_codes'], ['hi'])

    def test_question_admin_check_contribution_reviewer_rights(self):
        self.login(self.QUESTION_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response.keys(), ['can_review_questions', 'can_submit_questions'])
        self.assertEqual(response['can_review_questions'], False)

        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_id)
        user_services.allow_user_to_submit_question(self.reviewer_id)

        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response.keys(), ['can_review_questions', 'can_submit_questions'])
        self.assertEqual(response['can_review_questions'], True)
        self.assertEqual(response['can_submit_questions'], True)

    def test_check_contribution_reviewer_rights_invalid_username(self):
        self.login(self.TRANSLATION_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid username: invalid')
        self.logout()
