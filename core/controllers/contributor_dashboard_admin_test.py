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

from core.domain import user_services
from core.tests import test_utils
import feconf


class AddContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to add reviewers for contributor's
    suggestion/application.
    """

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    CONTRIBUTOR_DASHBOARD_ADMIN = 'contributordashboardadmin@example.com'

    def setUp(self):
        super(AddContributionRightsHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.CONTRIBUTOR_DASHBOARD_ADMIN, 'cda')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)

        user_services.update_user_role(
            self.get_user_id_from_email(self.CONTRIBUTOR_DASHBOARD_ADMIN),
            feconf.ROLE_ID_CONTRIBUTOR_DASHBOARD_ADMIN)

    def test_add_reviewer_with_invalid_username_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'invalid',
                'category': 'translation',
                'language_code': 'en'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_add_translation_reviewer(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_add_translation_reviewer_in_invalid_language_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_assigning_same_language_for_translation_review_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User translator already has rights to review translation in '
            'language code hi')

    def test_add_voiceover_reviewer(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_voiceover_applications(
            self.voiceover_reviewer_id, language_code='hi'))

    def test_add_voiceover_reviewer_in_invalid_language(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

    def test_assigning_same_language_for_voiceover_review_raise_error(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User voiceartist already has rights to review voiceover in '
            'language code hi')

    def test_add_question_reviewer(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_reviewer_raise_error(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to review question.')

    def test_add_question_submitter(self):
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'submit_question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_submitter_raise_error(self):
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'submit_question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'submit_question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to submit question.')

    def test_add_reviewer_for_invalid_category_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid category: invalid')


class RemoveContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to remove reviewers from contributor dashboard page."""

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    CONTRIBUTOR_DASHBOARD_ADMIN = 'contributordashboardadmin@example.com'

    def setUp(self):
        super(RemoveContributionRightsHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.CONTRIBUTOR_DASHBOARD_ADMIN, 'cda')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.update_user_role(
            self.get_user_id_from_email(self.CONTRIBUTOR_DASHBOARD_ADMIN),
            feconf.ROLE_ID_CONTRIBUTOR_DASHBOARD_ADMIN)

    def test_add_reviewer_without_username_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'removal_type': 'all'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(response['error'], 'Missing username param')

    def test_add_reviewer_with_invalid_username_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'invalid',
                'removal_type': 'all'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_remove_translation_reviewer(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_translation_reviewer_in_invalid_language_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'category': 'translation',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_remove_unassigned_translation_reviewer_raise_error(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'translator does not have rights to review translation in language '
            'hi.')

    def test_remove_voiceover_reviewer(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))
        user_services.allow_user_to_review_voiceover_in_language(
            self.voiceover_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_voiceover_applications(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_voiceover_reviewer_in_invalid_language_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'category': 'voiceover',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_remove_unassigned_voiceover_reviewer_raise_error(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'voiceartist does not have rights to review voiceover in language '
            'hi.')

    def test_remove_question_reviewer(self):
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'question'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_reviewer_raise_error(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to review question.')

    def test_remove_question_submitter(self):
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'submit_question'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_submitter_raise_error(self):
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'submit_question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to submit question.')

    def test_remove_reviewer_for_invalid_category_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid category: invalid')

    def test_remove_reviewer_for_invalid_removal_type_raise_error(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid removal_type: invalid')

    def test_remove_reviewer_from_all_reviewable_items(self):
        user_services.allow_user_to_review_question(
            self.translation_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.translation_reviewer_id))

        user_services.allow_user_to_review_voiceover_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))

        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'all'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_question_suggestions(
            self.translation_reviewer_id))
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))


class ContributorUsersListHandlerTest(test_utils.GenericTestBase):
    """Tests ContributorUsersListHandler."""

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'
    CONTRIBUTOR_DASHBOARD_ADMIN = 'contributordashboardadmin@example.com'

    def setUp(self):
        super(ContributorUsersListHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.CONTRIBUTOR_DASHBOARD_ADMIN, 'cda')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.update_user_role(
            self.get_user_id_from_email(self.CONTRIBUTOR_DASHBOARD_ADMIN),
            feconf.ROLE_ID_CONTRIBUTOR_DASHBOARD_ADMIN)

    def test_check_contribution_reviewer_by_translation_reviewer_role(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.voiceover_reviewer_id, 'hi')
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'translation',
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('translator' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contribution_reviewer_by_voiceover_reviewer_role(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        user_services.allow_user_to_review_voiceover_in_language(
            self.translation_reviewer_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.voiceover_reviewer_id, 'hi')
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'voiceover',
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('translator' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contribution_reviewer_by_question_reviewer_role(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        user_services.allow_user_to_review_question(self.voiceover_reviewer_id)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'question'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('question' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contributor_user_by_question_submitter_role(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        user_services.allow_user_to_submit_question(self.voiceover_reviewer_id)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'submit_question'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('question' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contribution_reviewer_with_invalid_language_code_raise_error(
            self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'voiceover',
                'language_code': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid language_code: invalid')
        self.logout()

    def test_check_contribution_reviewer_with_invalid_category_raise_error(
            self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'invalid',
                'language_code': 'hi'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid category: invalid')
        self.logout()


class ContributionRightsDataHandlerTest(test_utils.GenericTestBase):
    """Tests ContributionRightsDataHandler."""

    REVIEWER_EMAIL = 'reviewer@example.com'
    CONTRIBUTOR_DASHBOARD_ADMIN = 'contributordashboardadmin@example.com'

    def setUp(self):
        super(ContributionRightsDataHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.CONTRIBUTOR_DASHBOARD_ADMIN, 'cda')
        user_services.update_user_role(
            self.get_user_id_from_email(self.CONTRIBUTOR_DASHBOARD_ADMIN),
            feconf.ROLE_ID_CONTRIBUTOR_DASHBOARD_ADMIN)

        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

    def test_check_contribution_reviewer_rights(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response['can_review_translation_for_language_codes'], [])
        self.assertEqual(
            response['can_review_voiceover_for_language_codes'], [])
        self.assertEqual(response['can_review_questions'], False)
        self.assertEqual(response['can_submit_questions'], False)

        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_id)
        user_services.allow_user_to_submit_question(self.reviewer_id)

        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response['can_review_translation_for_language_codes'], ['hi'])
        self.assertEqual(
            response['can_review_voiceover_for_language_codes'], ['hi'])
        self.assertEqual(response['can_review_questions'], True)
        self.assertEqual(response['can_submit_questions'], True)

    def test_check_contribution_reviewer_rights_invalid_username(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid username: invalid')
        self.logout()

    def test_check_contribution_reviewer_rights_without_username(self):
        self.login(self.CONTRIBUTOR_DASHBOARD_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={},
            expected_status_int=400)

        self.assertEqual(response['error'], 'Missing username param')
        self.logout()
