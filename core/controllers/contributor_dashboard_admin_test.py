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
import json

from core import feconf
from core.constants import constants
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models
    from mypy_imports import user_models

(suggestion_models, user_models) = models.Registry.import_models(
    [models.Names.SUGGESTION, models.Names.USER])


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
            'choices: %s' % constants.CD_USER_RIGHTS_CATEGORIES
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


class ContributorDashboardAdminStatsHandlerTest(test_utils.GenericTestBase):
    """Tests for ContributorDashboardAdminStatsHandler.
    """

    CONTRIBUTOR_EMAIL: Final = 'contributor@example.com'
    CONTRIBUTOR_USERNAME: Final = 'contributor'
    SUGGESTION_LANGUAGE_CODE: Final = 'es'
    USER_ID_1: Final = 'uid_01234567890123456789012345678912'
    TOPIC_IDS_WITH_TRANSLATION_SUBMISSIONS: Final = ['topic1', 'topic2']
    RECENT_REVIEW_OUTCOMES: Final = ['accepted', 'rejected']
    RECENT_PERFORMANCE: Final = 2
    OVERALL_ACCURACY: Final = 2.0
    SUBMITTED_TRANSLATIONS_COUNT: Final = 2
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    TOPIC_IDS_WITH_TRANSLATION_REVIEWS = ['18', '19', '20']
    REVIEWED_TRANSLATIONS_COUNT = 2
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    REJECTED_TRANSLATIONS_COUNT: Final = 0
    REJECTED_TRANSLATION_WORD_COUNT: Final = 0
    REVIEWED_QUESTIONS_COUNT = 2
    ACCEPTED_QUESTIONS_COUNT = 1
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT = 0
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT = 0
    REJECTED_QUESTIONS_COUNT: Final = 20

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CONTRIBUTOR_EMAIL, self.CONTRIBUTOR_USERNAME)
        self.contributor_id = self.get_user_id_from_email(
            self.CONTRIBUTOR_EMAIL)
        user_services.add_user_role(
            self.contributor_id, feconf.ROLE_ID_TRANSLATION_ADMIN)

        user_1_settings = user_services.create_new_user(
            'auth_id_1', 'user1@example.com')
        user_services.set_username(user_1_settings.user_id, 'user1')
        user_2_settings = user_services.create_new_user(
            'auth_id_2', 'user2@example.com')
        user_services.set_username(user_2_settings.user_id, 'user2')
        user_3_settings = user_services.create_new_user(
            'auth_id_3', 'user3@example.com')
        user_services.set_username(user_3_settings.user_id, 'user3')
        user_4_settings = user_services.create_new_user(
            'auth_id_4', 'user4@example.com')
        user_services.set_username(user_4_settings.user_id, 'user4')

        self.signup('reviewer@org.com', 'reviewer')
        user_id = self.get_user_id_from_email('reviewer@org.com')
        user_services.add_user_role(
            user_id, feconf.ROLE_ID_TRANSLATION_ADMIN)
        self.login('reviewer@org.com')
        user_services.allow_user_to_review_translation_in_language(
            user_id, 'es')
        user_services.allow_user_to_review_translation_in_language(
            user_id, 'hi')

        auth_ids = ['test1', 'test2', 'test3', 'test4']
        usernames = ['name1', 'name2', 'name3', 'name4']
        user_emails = [
            'test1@email.com', 'test2@email.com',
            'test3@email.com', 'test4@email.com']

        user_ids = []
        for auth_id, email, name in zip(auth_ids, user_emails, usernames):
            user_settings = user_services.create_new_user(auth_id, email)
            user_models.UserSettingsModel(
                id=user_settings.user_id,
                email=user_settings.email,
                roles=user_settings.roles,
                username=user_settings.username,
                normalized_username=user_settings.normalized_username,
                last_agreed_to_terms=user_settings.last_agreed_to_terms,
                last_started_state_editor_tutorial=(
                    user_settings.last_started_state_editor_tutorial),
                last_started_state_translation_tutorial=(
                    user_settings.last_started_state_translation_tutorial),
                last_logged_in=datetime.datetime.today(),
                last_edited_an_exploration=(
                    user_settings.last_edited_an_exploration),
                last_created_an_exploration=(
                    user_settings.last_created_an_exploration),
                default_dashboard=user_settings.default_dashboard,
                creator_dashboard_display_pref=(
                    user_settings.creator_dashboard_display_pref),
                user_bio=user_settings.user_bio,
                subject_interests=user_settings.subject_interests,
                first_contribution_msec=user_settings.first_contribution_msec,
                preferred_language_codes=(
                    user_settings.preferred_language_codes),
                preferred_site_language_code=(
                    user_settings.preferred_site_language_code),
                preferred_audio_language_code=(
                    user_settings.preferred_audio_language_code),
                deleted=user_settings.deleted
            ).put()

            user_ids.append(user_settings.user_id)
            user_services.set_username(user_settings.user_id, name)

        user_services.add_user_role(
            user_ids[0], feconf.ROLE_ID_QUESTION_COORDINATOR)
        user_services.add_user_role(
            user_ids[1], feconf.ROLE_ID_QUESTION_COORDINATOR)
        user_services.add_user_role(
            user_ids[2], feconf.ROLE_ID_QUESTION_COORDINATOR)
        user_services.add_user_role(
            user_ids[3], feconf.ROLE_ID_QUESTION_COORDINATOR)

        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id='model_1',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_1_settings.user_id,
            topic_ids_with_translation_submissions=[
                'topic1'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=1,
            overall_accuracy=4,
            submitted_translations_count=20,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(35))
        ).put()
        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id='model_2',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_2_settings.user_id,
            topic_ids_with_translation_submissions=[
                'topic3'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=2,
            overall_accuracy=3,
            submitted_translations_count=10,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(65))
        ).put()
        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id='model_3',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_3_settings.user_id,
            topic_ids_with_translation_submissions=[
                'topic1', 'topic2'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=3,
            overall_accuracy=2,
            submitted_translations_count=50,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id='model_4',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_4_settings.user_id,
            topic_ids_with_translation_submissions=(
                self.TOPIC_IDS_WITH_TRANSLATION_SUBMISSIONS),
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=4,
            overall_accuracy=1,
            submitted_translations_count=4,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(125))
        ).put()

        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_1',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_1_settings.user_id,
            topic_ids_with_translation_reviews=(
                self.TOPIC_IDS_WITH_TRANSLATION_REVIEWS),
            reviewed_translations_count=10,
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=(
                self.REJECTED_TRANSLATIONS_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(35))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_2',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_2_settings.user_id,
            topic_ids_with_translation_reviews=(
                self.TOPIC_IDS_WITH_TRANSLATION_REVIEWS),
            reviewed_translations_count=20,
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=(
                self.REJECTED_TRANSLATIONS_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(65))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_3',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_3_settings.user_id,
            topic_ids_with_translation_reviews=(
                self.TOPIC_IDS_WITH_TRANSLATION_REVIEWS),
            reviewed_translations_count=30,
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=(
                self.REJECTED_TRANSLATIONS_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_4',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id=user_4_settings.user_id,
            topic_ids_with_translation_reviews=(
                self.TOPIC_IDS_WITH_TRANSLATION_REVIEWS),
            reviewed_translations_count=40,
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=(
                self.REJECTED_TRANSLATIONS_COUNT),
            first_contribution_date=datetime.datetime.utcnow(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(125))
        ).put()

        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_1',
            contributor_id=user_1_settings.user_id,
            topic_ids_with_question_submissions=[
                'topic1'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=10,
            overall_accuracy=30.0,
            submitted_questions_count=10,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(35))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_2',
            contributor_id=user_2_settings.user_id,
            topic_ids_with_question_submissions=[
                'topic3'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=20,
            overall_accuracy=20.0,
            submitted_questions_count=20,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(65))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_3',
            contributor_id=user_3_settings.user_id,
            topic_ids_with_question_submissions=[
                'topic1'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=30,
            overall_accuracy=10.0,
            submitted_questions_count=30,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_4',
            contributor_id=user_4_settings.user_id,
            topic_ids_with_question_submissions=[
                'topic1', 'topic2'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=40,
            overall_accuracy=5.0,
            submitted_questions_count=40,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(125))
        ).put()

        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_1',
            contributor_id=user_1_settings.user_id,
            topic_ids_with_question_reviews=[
                'topic1'
            ],
            reviewed_questions_count=10,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(35))
        ).put()
        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_2',
            contributor_id=user_2_settings.user_id,
            topic_ids_with_question_reviews=[
                'topic1', 'topic2'
            ],
            reviewed_questions_count=20,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(65))
        ).put()
        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_3',
            contributor_id=user_3_settings.user_id,
            topic_ids_with_question_reviews=[
                'topic3'
            ],
            reviewed_questions_count=30,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_4',
            contributor_id=user_4_settings.user_id,
            topic_ids_with_question_reviews=[
                'topic3'
            ],
            reviewed_questions_count=40,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=datetime.date.today(),
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(125))
        ).put()

        suggestion_models.TranslationCoordinatorsModel(
            id='es',
            coordinator_ids=[user_ids[0], user_ids[1]],
            coordinators_count=2
        ).put()
        suggestion_models.TranslationCoordinatorsModel(
            id='hi',
            coordinator_ids=[user_ids[0], user_ids[1], user_ids[2]],
            coordinators_count=3
        ).put()

    def test_get_stats_with_invalid_contribution_type_raises_error(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        self.get_json(
            '/contributor-dashboard-admin-stats/invalid/submission', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'sort_by': None,
                'topic_ids': []
            }, expected_status_int=400)
        self.logout()

    def test_get_stats_with_invalid_sub_contribution_type_raises_error(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        self.get_json(
            '/contributor-dashboard-admin-stats/translation/invalid', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'sort_by': None,
                'topic_ids': []
            }, expected_status_int=400)
        self.logout()

    def test_get_translation_submitter_stats_for_pagination(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with language filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/submission', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_translation_submitter_stats_for_sorting(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with sorting and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/submission', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'sort_by': 'IncreasingLastActivity',
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_translation_submitter_stats_for_topic_filter(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with topic filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/submission', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'topic_ids': json.dumps(['topic1', 'topic2'])
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['stats'][0]['last_contributed_in_days'],
            95
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            False
        )
        self.logout()

    def test_get_translation_submitter_stats_for_last_activity_filter(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with max_days_since_last_activity filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/submission', {
                'page_size': 4,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'max_days_since_last_activity': 120,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            3
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['stats'][1]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            4
        )
        self.assertEqual(
            response['more'],
            False
        )
        self.logout()

    def test_get_translation_reviewer_stats_for_pagination(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with language filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/review', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_translation_reviewer_stats_for_sorting(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with sorting and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/review', {
                'page_size': 2,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'sort_by': 'IncreasingLastActivity',
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_translation_reviewer_stats_for_last_activity_filter(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with max_days_since_last_activity filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/review', {
                'page_size': 4,
                'offset': 1,
                'language_code': self.SUGGESTION_LANGUAGE_CODE,
                'max_days_since_last_activity': 120,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            3
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['stats'][1]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            4
        )
        self.assertEqual(
            response['more'],
            False
        )
        self.logout()

    def test_get_question_submitter_stats_for_pagination(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/submission', {
                'page_size': 2,
                'offset': 1,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_question_submitter_stats_for_sorting(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with sorting and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/submission', {
                'page_size': 2,
                'offset': 1,
                'sort_by': 'IncreasingLastActivity',
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_question_submitter_stats_for_topic_filter(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with topic filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/submission', {
                'page_size': 2,
                'offset': 1,
                'topic_ids': json.dumps(['topic1', 'topic2'])
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['stats'][0]['last_contributed_in_days'],
            95
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            False
        )
        self.logout()

    def test_get_question_submitter_stats_for_last_activity_filter(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with max_days_since_last_activity filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/submission', {
                'page_size': 4,
                'offset': 1,
                'max_days_since_last_activity': 120,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            3
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['stats'][1]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            4
        )
        self.assertEqual(
            response['more'],
            False
        )
        self.logout()

    def test_get_question_reviewer_stats_for_pagination(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/review', {
                'page_size': 2,
                'offset': 1,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_question_reviewer_stats_for_sorting(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with sorting and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/review', {
                'page_size': 2,
                'offset': 1,
                'sort_by': 'IncreasingLastActivity',
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            3
        )
        self.assertEqual(
            response['more'],
            True
        )
        self.logout()

    def test_get_question_reviewer_stats_for_last_activity_filter(
        self
    ) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Test with max_days_since_last_activity filter and pagination.
        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/review', {
                'page_size': 4,
                'offset': 1,
                'max_days_since_last_activity': 120,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            3
        )
        self.assertEqual(
            response['stats'][0]['contributor_name'],
            'user3'
        )
        self.assertEqual(
            response['stats'][1]['contributor_name'],
            'user2'
        )
        self.assertEqual(
            response['next_offset'],
            4
        )
        self.assertEqual(
            response['more'],
            False
        )
        self.logout()

    def test_get_translation_coordinator_stats(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/coordinate', {
                'page_size': 0,
                'offset': 0,
                'max_days_since_last_activity': 0,
                'topic_ids': [],
                'sort_by': 'DecreasingCoordinatorCounts'
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            [stat['language_id'] for stat in response['stats']],
            ['hi', 'es']
        )
        self.logout()

    def test_get_translation_coordinator_stats_with_sort(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        response = self.get_json(
            '/contributor-dashboard-admin-stats/translation/coordinate', {
                'page_size': 0,
                'offset': 0,
                'max_days_since_last_activity': 0,
                'topic_ids': [],
                'sort_by': 'IncreasingCoordinatorCounts'
            })

        self.assertEqual(
            len(response['stats']),
            2
        )
        self.assertEqual(
            response['stats'][0]['language_id'],
            'es'
        )
        self.assertEqual(
            response['stats'][1]['language_id'],
            'hi'
        )
        self.logout()

    def test_get_question_coordinator_stats(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        response = self.get_json(
            '/contributor-dashboard-admin-stats/question/coordinate', {
                'page_size': 0,
                'offset': 0,
                'max_days_since_last_activity': 0,
                'topic_ids': []
            })

        self.assertEqual(
            len(response['stats']),
            4
        )
        self.logout()


class CommunityStatsHandlerTest(test_utils.GenericTestBase):
    """Tests for getting community stats for contributor admin dashboard
    """

    def test_get_community_stats(self) -> None:
        self.signup('reviewer@org.com', 'reviewer')
        user_id = self.get_user_id_from_email('reviewer@org.com')
        user_services.add_user_role(
            user_id, feconf.ROLE_ID_TRANSLATION_ADMIN)
        self.login('reviewer@org.com')
        user_services.allow_user_to_review_translation_in_language(
            user_id, 'en')
        user_services.allow_user_to_review_translation_in_language(
            user_id, 'fr')

        stats = self.get_json(feconf.COMMUNITY_CONTRIBUTION_STATS_URL)

        self.assertEqual(stats['question_reviewers_count'], 0)
        self.assertDictEqual(
            stats['translation_reviewers_count'], {'en': 1, 'fr': 1})
