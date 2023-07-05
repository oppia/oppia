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

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class ContributorDashboardAdminPageTest(test_utils.GenericTestBase):
    """Test for ContributorDashboardAdminPage."""

    USER_A_EMAIL: Final = 'userA@example.com'
    QUESTION_REVIEWER_EMAIL: Final = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL: Final = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL: Final = 'questionadmin@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_A_EMAIL, 'userA')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationExpert')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionExpert')

        user_services.add_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)
        user_services.add_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)

    def test_non_admin_access_page_raise_404(self) -> None:
        self.login(self.USER_A_EMAIL)
        self.get_html_response(
            '/contributor-dashboard-admin', expected_status_int=401)
        self.logout()

    def test_question_admin_can_access_page(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)
        response = self.get_html_response('/contributor-dashboard-admin')
        response.mustcontain(
            '<contributor-dashboard-admin-page>'
            '</contributor-dashboard-admin-page>')
        self.logout()

    def test_translation_admin_can_access_page(self) -> None:
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        response = self.get_html_response('/contributor-dashboard-admin')
        response.mustcontain(
            '<contributor-dashboard-admin-page>'
            '</contributor-dashboard-admin-page>')
        self.logout()


class ContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to reviewers for contributor's
    suggestion/application.
    """

    TRANSLATION_REVIEWER_EMAIL: Final = 'translationreviewer@example.com'
    QUESTION_REVIEWER_EMAIL: Final = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL: Final = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL: Final = 'questionadmin@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationExpert')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionExpert')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)

        user_services.add_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)
        user_services.add_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)

    def test_add_reviewer_with_invalid_username_raise_error(self) -> None:
        self.login(self.TRANSLATION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/contributionrightshandler/translation', {
                'username': 'invalid',
                'language_code': 'en'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_add_translation_reviewer(self) -> None:
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.TRANSLATION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/contributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_cannot_add_or_remove_translation_reviewer_without_language_code(
        self
    ) -> None:
        self.login(self.TRANSLATION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/contributionrightshandler/translation', {
                'username': 'translator',
            },
            csrf_token=csrf_token,
            expected_status_int=500)

        self.assertEqual(
            response['error'],
            'The language_code cannot be None if the review '
            'category is \'translation\''
        )

        response = self.delete_json(
            '/contributionrightshandler/translation', params={
                'username': 'translator'
            },
            expected_status_int=500
        )

        self.assertEqual(
            response['error'],
            'The language_code cannot be None if the review '
            'category is \'translation\''
        )

    def test_assigning_same_language_for_translation_review_raise_error(
        self
    ) -> None:
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/contributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        response = self.post_json(
            '/contributionrightshandler/translation', {
                'username': 'translator',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User translator already has rights to review translation in '
            'language code hi')

    def test_add_question_reviewer(self) -> None:
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/contributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_reviewer_raise_error(
        self
    ) -> None:
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/contributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/contributionrightshandler/question', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to review question.')

    def test_add_question_submitter(self) -> None:
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/contributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_submitter_raise_error(
        self
    ) -> None:
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/contributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/contributionrightshandler/submit_question', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to submit question.')

    def test_add_reviewer_for_invalid_category_raise_error(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/contributionrightshandler/invalid', {
                'username': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'At \'http://localhost/contributionrightshandler/invalid\' these '
            'errors are happening:\nSchema validation for \'category\' failed: '
            'Received invalid which is not in the allowed range of '
            'choices: %s' % constants.CONTRIBUTION_RIGHT_CATEGORIES
        )

    def test_remove_reviewer_with_invalid_username_raise_error(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)

        response = self.delete_json(
            '/contributionrightshandler/question', params={
                'username': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_remove_translation_reviewer(self) -> None:
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.TRANSLATION_ADMIN_EMAIL)

        self.delete_json(
            '/contributionrightshandler/translation', params={
                'username': 'translator',
                'language_code': 'hi'
            })

        self.assertFalse(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_unassigned_translation_reviewer_raise_error(self) -> None:
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.TRANSLATION_ADMIN_EMAIL)
        response = self.delete_json(
            '/contributionrightshandler/translation', params={
                'username': 'translator',
                'language_code': 'hi'
            }, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'translator does not have rights to review translation in language '
            'hi.')

    def test_remove_question_reviewer(self) -> None:
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        self.delete_json(
            '/contributionrightshandler/question', params={
                'username': 'question'
            })

        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_reviewer_raise_error(self) -> None:
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        response = self.delete_json(
            '/contributionrightshandler/question', params={
                'username': 'question'
            }, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to review question.')

    def test_remove_question_submitter(self) -> None:
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        self.delete_json(
            '/contributionrightshandler/submit_question', params={
                'username': 'question'
            })

        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_submitter_raise_error(self) -> None:
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.QUESTION_ADMIN_EMAIL)
        response = self.delete_json(
            '/contributionrightshandler/submit_question', params={
                'username': 'question'
            }, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to submit question.')


class ContributorUsersListHandlerTest(test_utils.GenericTestBase):
    """Tests ContributorUsersListHandler."""

    TRANSLATION_REVIEWER_EMAIL: Final = 'translationreviewer@example.com'
    QUESTION_REVIEWER_EMAIL: Final = 'questionreviewer@example.com'
    TRANSLATION_ADMIN_EMAIL: Final = 'translationadmin@example.com'
    QUESTION_ADMIN_EMAIL: Final = 'questionadmin@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')
        self.signup(self.TRANSLATION_ADMIN_EMAIL, 'translationAdmen')
        self.signup(self.QUESTION_ADMIN_EMAIL, 'questionAdmen')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        user_services.add_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN_EMAIL),
            feconf.ROLE_ID_TRANSLATION_ADMIN)
        user_services.add_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN_EMAIL),
            feconf.ROLE_ID_QUESTION_ADMIN)

    def test_check_contribution_reviewer_by_translation_reviewer_role(
        self
    ) -> None:
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

    def test_check_contribution_reviewer_by_question_reviewer_role(
        self
    ) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        response = self.get_json('/getcontributorusershandler/question')

        self.assertEqual(len(response['usernames']), 1)
        self.assertTrue('question' in response['usernames'])
        self.logout()

    def test_check_contributor_user_by_question_submitter_role(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL)
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        response = self.get_json('/getcontributorusershandler/submit_question')

        self.assertEqual(len(response['usernames']), 1)
        self.assertTrue('question' in response['usernames'])
        self.logout()


class ContributionRightsDataHandlerTest(test_utils.GenericTestBase):
    """Tests ContributionRightsDataHandler."""

    REVIEWER_EMAIL: Final = 'reviewer@example.com'
    TRANSLATION_ADMIN: Final = 'translationadmin@example.com'
    QUESTION_ADMIN: Final = 'questionadmin@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.TRANSLATION_ADMIN, 'translationAdmen')
        self.signup(self.QUESTION_ADMIN, 'questionAdmen')
        user_services.add_user_role(
            self.get_user_id_from_email(self.TRANSLATION_ADMIN),
            feconf.ROLE_ID_TRANSLATION_ADMIN)
        user_services.add_user_role(
            self.get_user_id_from_email(self.QUESTION_ADMIN),
            feconf.ROLE_ID_QUESTION_ADMIN)

        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

    def test_translation_admin_check_contribution_reviewer_rights(self) -> None:
        self.login(self.TRANSLATION_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            list(response.keys()),
            ['can_review_translation_for_language_codes'])
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
            list(response.keys()),
            ['can_review_translation_for_language_codes'])
        self.assertEqual(
            response['can_review_translation_for_language_codes'], ['hi'])

    def test_question_admin_check_contribution_reviewer_rights(self) -> None:
        self.login(self.QUESTION_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            list(response.keys()),
            ['can_review_questions', 'can_submit_questions'])
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
            list(response.keys()),
            ['can_review_questions', 'can_submit_questions'])
        self.assertEqual(response['can_review_questions'], True)
        self.assertEqual(response['can_submit_questions'], True)

    def test_check_contribution_reviewer_rights_invalid_username(self) -> None:
        self.login(self.TRANSLATION_ADMIN)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid username: invalid')
        self.logout()


class TranslationContributionStatsHandlerTest(test_utils.GenericTestBase):
    """Tests TranslationContributionStatsHandler."""

    CONTRIBUTOR_EMAIL: Final = 'contributor@example.com'
    CONTRIBUTOR_USERNAME: Final = 'contributor'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.CONTRIBUTOR_EMAIL, self.CONTRIBUTOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.contributor_id = self.get_user_id_from_email(
            self.CONTRIBUTOR_EMAIL)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        user_services.add_user_role(
            self.contributor_id, feconf.ROLE_ID_TRANSLATION_ADMIN)

    def _publish_topic(self, topic_id: str, topic_name: str) -> None:
        """Creates and publishes a topic.

        Args:
            topic_id: str. Topic ID.
            topic_name: str. Topic name.
        """
        topic = topic_domain.Topic.create_default_topic(
            topic_id, topic_name, 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_3'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_3']
        topic_services.save_new_topic(self.admin_id, topic)
        topic_services.publish_topic(topic_id, self.admin_id)

    def test_get_stats_without_username_raises_error(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        response = self.get_json(
            '/translationcontributionstatshandler', params={},
            expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Missing key in handler args: username.')

    def test_get_stats_with_invalid_username_raises_error(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        response = self.get_json(
            '/translationcontributionstatshandler', params={
                'username': 'invalid',
            }, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_get_stats_returns_transformed_stats(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)
        # Create and publish a topic.
        published_topic_id = 'published_topic_id'
        published_topic_name = 'published_topic_name'
        self._publish_topic(published_topic_id, published_topic_name)

        submitted_translations_count = 2
        submitted_translation_word_count = 100
        accepted_translations_count = 1
        accepted_translations_without_reviewer_edits_count = 0
        accepted_translation_word_count = 50
        rejected_translations_count = 0
        rejected_translation_word_count = 0
        # Create two translation contribution stats models, one with a linked
        # topic, one without.
        suggestion_models.TranslationContributionStatsModel.create(
            language_code='es',
            contributor_user_id=self.contributor_id,
            topic_id=published_topic_id,
            submitted_translations_count=submitted_translations_count,
            submitted_translation_word_count=submitted_translation_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            contribution_dates=[
                # Timestamp dates in sec since epoch for Mar 19 2021 UTC.
                datetime.date.fromtimestamp(1616173836),
                datetime.date.fromtimestamp(1616173837)
            ]
        )
        suggestion_models.TranslationContributionStatsModel.create(
            language_code='es',
            contributor_user_id=self.contributor_id,
            topic_id='topic_id',
            submitted_translations_count=submitted_translations_count,
            submitted_translation_word_count=submitted_translation_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            contribution_dates=[
                # Timestamp dates in sec since epoch for Mar 19 2021 UTC.
                datetime.date.fromtimestamp(1616173836),
                datetime.date.fromtimestamp(1616173837)
            ]
        )

        response = self.get_json(
            '/translationcontributionstatshandler', params={
                'username': self.CONTRIBUTOR_USERNAME,
            })

        # There should be two results, one for each topic.
        expected_response = {
            'translation_contribution_stats': [
                {
                    'language': 'español (Spanish)',
                    'topic_name': published_topic_name,
                    'submitted_translations_count': (
                        submitted_translations_count),
                    'submitted_translation_word_count': (
                        submitted_translation_word_count),
                    'accepted_translations_count': accepted_translations_count,
                    'accepted_translations_without_reviewer_edits_count': (
                        accepted_translations_without_reviewer_edits_count),
                    'accepted_translation_word_count': (
                        accepted_translation_word_count),
                    'rejected_translations_count': rejected_translations_count,
                    'rejected_translation_word_count': (
                        rejected_translation_word_count),
                    'contribution_months': ['Mar 2021']
                },
                {
                    'language': 'español (Spanish)',
                    'topic_name': 'UNKNOWN',
                    'submitted_translations_count': (
                        submitted_translations_count),
                    'submitted_translation_word_count': (
                        submitted_translation_word_count),
                    'accepted_translations_count': accepted_translations_count,
                    'accepted_translations_without_reviewer_edits_count': (
                        accepted_translations_without_reviewer_edits_count),
                    'accepted_translation_word_count': (
                        accepted_translation_word_count),
                    'rejected_translations_count': rejected_translations_count,
                    'rejected_translation_word_count': (
                        rejected_translation_word_count),
                    'contribution_months': ['Mar 2021']
                }
            ]
        }
        self.assertEqual(response, expected_response)

    def test_stats_data_not_calculated_without_topic_id_and_language_code(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)
        stats_dict_without_topic_id = [
            suggestion_registry.TranslationContributionStats(
                'es', self.CONTRIBUTOR_USERNAME, None, 2, 100, 1, 0, 50, 0, 0,
                {
                    datetime.date.fromtimestamp(1616173836),
                    datetime.date.fromtimestamp(1616173837)
                }
            )
        ]

        swap_translation_contribution_stats = self.swap_to_always_return(
            suggestion_services,
            'get_all_translation_contribution_stats',
            stats_dict_without_topic_id
        )
        with swap_translation_contribution_stats:
            response = self.get_json(
                '/translationcontributionstatshandler', params={
                    'username': self.CONTRIBUTOR_USERNAME,
                },
                expected_status_int=500
            )
        self.assertEqual(
            'There is no topic_id associated with the given '
            'TranslationContributionStatsDict.',
            response['error']
        )

        stats_dict_without_language_code = [
            suggestion_registry.TranslationContributionStats(
                None, self.CONTRIBUTOR_USERNAME, 'topic_id_1', 2, 100, 1, 0, 50,
                0, 0,
                {
                    datetime.date.fromtimestamp(1616173836),
                    datetime.date.fromtimestamp(1616173837)
                }
            )
        ]

        swap_translation_contribution_stats = self.swap_to_always_return(
            suggestion_services,
            'get_all_translation_contribution_stats',
            stats_dict_without_language_code
        )
        with swap_translation_contribution_stats:
            response = self.get_json(
                '/translationcontributionstatshandler', params={
                    'username': self.CONTRIBUTOR_USERNAME,
                },
                expected_status_int=500
            )
        self.assertEqual(
            'No language_code found for the given '
            'TranslationContributionStatsDict.',
            response['error']
        )
