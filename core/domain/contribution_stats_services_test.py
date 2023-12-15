# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Tests the functions to get stats displayed in contributor Admin Dashboard."""

from __future__ import annotations

import datetime

from core.domain import contribution_stats_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models, ) = models.Registry.import_models([
    models.Names.SUGGESTION
])


class ContributorAdminDashboardServicesUnitTest(test_utils.GenericTestBase):
    """Test the Contributor Admin Dashboard services."""

    SUGGESTION_LANGUAGE_CODE: Final = 'es'
    USER_ID_1: Final = 'uid_01234567890123456789012345678912'
    TOPIC_IDS_WITH_TRANSLATION_SUBMISSIONS: Final = ['topic1', 'topic2']
    RECENT_REVIEW_OUTCOMES: Final = ['accepted', 'rejected']
    RECENT_PERFORMANCE: Final = 2
    OVERALL_ACCURACY: Final = 2.0
    SUBMITTED_TRANSLATIONS_COUNT: Final = 2
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    REJECTED_TRANSLATIONS_COUNT: Final = 0
    REJECTED_TRANSLATION_WORD_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    TOPIC_IDS_WITH_TRANSLATION_REVIEWS = ['18', '19', '20']
    REVIEWED_TRANSLATIONS_COUNT = 2
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT = 0
    ACCEPTED_TRANSLATION_WORD_COUNT = 50
    SUBMITTED_QUESTIONS_COUNT = 2
    ACCEPTED_QUESTIONS_COUNT = 1
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT = 0
    REJECTED_QUESTIONS_COUNT = 20
    TOPIC_IDS_WITH_QUESTION_SUBMISSIONS = [
        'topic1', 'topic2', 'topic3'
    ]
    TOPIC_IDS_WITH_QUESTION_REVIEWS: Final = ['18', '19', '20']
    REVIEWED_QUESTIONS_COUNT = 2
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT = 0

    def setUp(self) -> None:

        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id='model_1',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id='user1',
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
            contributor_id='user2',
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
            contributor_id='user3',
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
                datetime.date.today() - datetime.timedelta(9))
        ).put()
        suggestion_models.TranslationSubmitterTotalContributionStatsModel(
            id='model_4',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id='user4',
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
                datetime.date.today() - datetime.timedelta(25))
        ).put()

        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_1',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id='user1',
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
                datetime.date.today() - datetime.timedelta(65))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_2',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id='user2',
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
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_3',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id='user3',
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
                datetime.date.today() - datetime.timedelta(125))
        ).put()
        suggestion_models.TranslationReviewerTotalContributionStatsModel(
            id='model_4',
            language_code=self.SUGGESTION_LANGUAGE_CODE,
            contributor_id='user4',
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
                datetime.date.today() - datetime.timedelta(155))
        ).put()

        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_1',
            contributor_id='user1',
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
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(125))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_2',
            contributor_id='user2',
            topic_ids_with_question_submissions=[
                'topic2', 'topic3'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=20,
            overall_accuracy=20.0,
            submitted_questions_count=20,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_3',
            contributor_id='user3',
            topic_ids_with_question_submissions=[
                'topic3'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=30,
            overall_accuracy=10.0,
            submitted_questions_count=30,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(35))
        ).put()
        suggestion_models.QuestionSubmitterTotalContributionStatsModel(
            id='model_4',
            contributor_id='user4',
            topic_ids_with_question_submissions=[
                'topic4'
            ],
            recent_review_outcomes=self.RECENT_REVIEW_OUTCOMES,
            recent_performance=40,
            overall_accuracy=5.0,
            submitted_questions_count=40,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(5))
        ).put()

        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_1',
            contributor_id='user1',
            topic_ids_with_question_reviews=[
                'topic1'
            ],
            reviewed_questions_count=10,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(95))
        ).put()
        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_2',
            contributor_id='user2',
            topic_ids_with_question_reviews=[
                'topic1', 'topic2'
            ],
            reviewed_questions_count=20,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(35))
        ).put()
        suggestion_models.QuestionReviewerTotalContributionStatsModel(
            id='model_3',
            contributor_id='user3',
            topic_ids_with_question_reviews=[
                'topic3'
            ],
            reviewed_questions_count=30,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            rejected_questions_count=self.REJECTED_QUESTIONS_COUNT,
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=(
                datetime.date.today() - datetime.timedelta(5))
        ).put()

        suggestion_models.TranslationCoordinatorsModel(
            id='en',
            coordinator_ids=['user1', 'user2'],
            coordinators_count=2
        ).put()
        suggestion_models.TranslationCoordinatorsModel(
            id='hi',
            coordinator_ids=['user1', 'user2', 'user3'],
            coordinators_count=3
        ).put()

    def test_get_translation_submitter_admin_stats(self) -> None:
        stats, next_offset, more = (
            contribution_stats_services.get_translation_submitter_total_stats( # pylint: disable=line-too-long
            page_size=2,
            offset=1,
            language_code='es',
            sort_by=None,
            topic_ids=None,
            max_days_since_last_activity=90
            )
        )

        self.assertEqual(2, len(stats))
        self.assertTrue(more)
        self.assertEqual(3, next_offset)
        self.assertEqual('user3', stats[0].contributor_id)
        self.assertEqual('user2', stats[1].contributor_id)

    def test_get_translation_reviewer_admin_stats(self) -> None:
        stats, next_offset, more = (
            contribution_stats_services.get_translation_reviewer_total_stats( # pylint: disable=line-too-long
            page_size=2,
            offset=1,
            language_code='es',
            sort_by=None,
            max_days_since_last_activity=None
            )
        )

        self.assertEqual(2, len(stats))
        self.assertTrue(more)
        self.assertEqual(3, next_offset)
        self.assertEqual('user3', stats[0].contributor_id)
        self.assertEqual('user2', stats[1].contributor_id)

    def test_get_question_submitter_admin_stats(self) -> None:
        stats, next_offset, more = (
            contribution_stats_services.get_question_submitter_total_stats( # pylint: disable=line-too-long
            page_size=2,
            offset=1,
            sort_by=None,
            topic_ids=None,
            max_days_since_last_activity=None
            )
        )

        self.assertEqual(2, len(stats))
        self.assertTrue(more)
        self.assertEqual(3, next_offset)
        self.assertEqual('user3', stats[0].contributor_id)
        self.assertEqual('user2', stats[1].contributor_id)

    def test_get_question_reviewer_admin_stats(self) -> None:
        stats, next_offset, more = (
            contribution_stats_services.get_question_reviewer_total_stats( # pylint: disable=line-too-long
            page_size=2,
            offset=1,
            sort_by=None,
            max_days_since_last_activity=None
            )
        )

        self.assertEqual(2, len(stats))
        self.assertFalse(more)
        self.assertEqual(3, next_offset)
        self.assertEqual('user2', stats[0].contributor_id)
        self.assertEqual('user1', stats[1].contributor_id)

    def test_get_translation_coordinator_stats(self) -> None:
        stats = (
            contribution_stats_services.get_all_translation_coordinator_stats(
                suggestion_models.SortChoices
                .SORT_KEY_INCREASING_COORDINATOR_COUNTS.value
            ))

        self.assertEqual(2, len(stats))
        self.assertEqual('en', stats[0].language_id)

        stats = (
            contribution_stats_services.get_all_translation_coordinator_stats(
                suggestion_models.SortChoices
                .SORT_KEY_DECREASING_COORDINATOR_COUNTS.value
            ))

        self.assertEqual(2, len(stats))
        self.assertEqual('hi', stats[0].language_id)

    def test_get_translator_counts(self) -> None:
        stats = contribution_stats_services.get_translator_counts('es')

        self.assertEqual(4, stats)
