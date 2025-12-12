# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for jobs.contributor_admin_stats_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import (
    change_domain,
    skill_domain,
    state_domain,
    topic_domain,
    topic_services,
)
from core.jobs import job_test_utils
from core.jobs.batch_jobs import contributor_admin_stats_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Any, Final, List, Mapping, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        exp_models,
        opportunity_models,
        story_models,
        suggestion_models,
        topic_models,
    )

(
    exp_models,
    opportunity_models,
    story_models,
    suggestion_models,
    topic_models,
) = models.Registry.import_models(
    [
        models.Names.EXPLORATION,
        models.Names.OPPORTUNITY,
        models.Names.STORY,
        models.Names.SUGGESTION,
        models.Names.TOPIC,
    ]
)


class ContributorDashboardTest(job_test_utils.JobTestBase):
    """Setup for Contributor Admin Dashboard Jobs Tests"""

    LANGUAGE_CODE: Final = 'es'
    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    TOPIC_ID: Final = 'topic_id'
    SUBMITTED_TRANSLATIONS_COUNT: Final = 20
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 15
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 5
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    REJECTED_TRANSLATIONS_COUNT: Final = 5
    REJECTED_TRANSLATION_WORD_COUNT: Final = 5
    REVIEWED_TRANSLATIONS_COUNT = 20
    REVIEWED_TRANSLATION_WORD_COUNT = 10
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT = 10
    FIRST_CONTRIBUTION_DATE = datetime.date(2023, 4, 2)
    LAST_CONTRIBUTION_DATE = datetime.date(2023, 5, 2)
    SUBMITTED_QUESTION_COUNT = 10
    ACCEPTED_QUESTIONS_COUNT = 5
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT = 3
    REVIEWED_QUESTIONS_COUNT = 10
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT = 3
    CONTRIBUTION_DATES: Final = [
        datetime.date(2022, 5, 2),
        datetime.date(2023, 4, 2),
    ]

    score_category: str = 'translation.English'

    topic_name = 'topic'
    target_id = 'exp1'
    target_id_2 = 'exp2'
    target_id_3 = 'exp3'
    target_id_4 = 'exp4'
    target_version_at_submission = 1
    change_cmd: Mapping[str, change_domain.AcceptableChangeDictTypes] = {}
    # Language code that would normally be derived from the change_cmd.
    translation_language_code = 'en'
    # Language code that would normally be derived from the question_dict in
    # the change_cmd.
    question_language_code = 'en'
    mocked_datetime_utcnow = datetime.datetime(2020, 6, 15, 5)

    def setUp(self) -> None:
        super().setUp()

        self.translation_contribution_model_1 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=1,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic2',
            submitted_translations_count=1,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=0,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=[datetime.date(2022, 5, 2)],
        )

        self.translation_contribution_model_2 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=2,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic1',
            submitted_translations_count=1,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=0,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=self.CONTRIBUTION_DATES,
        )

        self.translation_contribution_model_3 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=3,
            language_code=self.LANGUAGE_CODE,
            contributor_user_id='user2',
            topic_id='topic1',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=self.CONTRIBUTION_DATES,
        )

        self.translation_contribution_model_4 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=4,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic3',
            submitted_translations_count=1,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=1,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=self.CONTRIBUTION_DATES,
        )

        self.translation_contribution_model_with_no_topic = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=5,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='',
            submitted_translations_count=20,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=1,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=self.CONTRIBUTION_DATES,
        )

        self.translation_contribution_model_with_invalid_topic = (
            self.create_model(
                suggestion_models.TranslationContributionStatsModel,
                id=6,
                language_code='hi',
                contributor_user_id='user1',
                topic_id='invalid_topic',
                submitted_translations_count=20,
                submitted_translation_word_count=(
                    self.SUBMITTED_TRANSLATION_WORD_COUNT
                ),
                accepted_translations_count=0,
                accepted_translations_without_reviewer_edits_count=0,
                accepted_translation_word_count=(
                    self.ACCEPTED_TRANSLATION_WORD_COUNT
                ),
                rejected_translations_count=1,
                rejected_translation_word_count=(
                    self.REJECTED_TRANSLATION_WORD_COUNT
                ),
                contribution_dates=self.CONTRIBUTION_DATES,
            )
        )

        self.translation_contribution_model_5 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=7,
            language_code='hi',
            contributor_user_id='user3',
            topic_id='topic3',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=self.CONTRIBUTION_DATES,
        )

        self.translation_contribution_model_6 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=8,
            language_code='hi',
            contributor_user_id='user4',
            topic_id='topic2',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_without_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            rejected_translations_count=self.REJECTED_TRANSLATIONS_COUNT,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT
            ),
            contribution_dates=self.CONTRIBUTION_DATES,
        )

        self.translation_review_model_1 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            id=9,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user1',
            topic_id='topic1',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.translation_review_model_2 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            id=10,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user1',
            topic_id='topic2',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.translation_review_model_3 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            id=11,
            language_code='hi',
            reviewer_user_id='user2',
            topic_id='topic1',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.translation_review_model_4 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            id=12,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user3',
            topic_id='topic4',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.translation_review_model_with_invalid_topic = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            id=13,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user3',
            topic_id='invalid_topic',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT
            ),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_contribution_model_1 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=14,
            contributor_user_id='user1',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_contribution_model_2 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=15,
            contributor_user_id='user1',
            topic_id='topic2',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_contribution_model_3 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=16,
            contributor_user_id='user2',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_contribution_model_4 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=17,
            contributor_user_id='user3',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_contribution_model_5 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=18,
            contributor_user_id='user4',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_contribution_model_with_invalid_topic = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=19,
            contributor_user_id='user3',
            topic_id='invalid_topic',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_review_model_1 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            id=20,
            reviewer_user_id='user1',
            topic_id='topic1',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_review_model_2 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            id=21,
            reviewer_user_id='user1',
            topic_id='topic2',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_review_model_3 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            id=22,
            reviewer_user_id='user2',
            topic_id='topic1',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_review_model_4 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            id=23,
            reviewer_user_id='user3',
            topic_id='topic1',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_review_model_with_invalid_topic = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            id=24,
            reviewer_user_id='user3',
            topic_id='invalid_topic',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT
            ),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE,
        )

        self.question_suggestion_rejected_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=25,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_REJECTED,
            author_id='user1',
            final_reviewer_id='reviewer_1',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            created_on=datetime.datetime(2023, 5, 2),
        )

        self.question_suggestion_accepted_with_edits_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=26,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=True,
            created_on=datetime.datetime(2023, 4, 2),
        )

        self.question_suggestion_accepted_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=27,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 3, 2),
        )

        self.question_suggestion_accepted_model_user2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=28,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_2,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user2',
            final_reviewer_id='reviewer_3',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 3, 2),
        )

        self.question_suggestion_accepted_model_user3 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=29,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_2,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user3',
            final_reviewer_id='reviewer_3',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 3, 2),
        )

        self.question_suggestion_accepted_model_with_incomplete_contribution_stats = self.create_model(  # pylint: disable=line-too-long
            suggestion_models.GeneralSuggestionModel,
            id=30,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user4',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 3, 2),
        )

        self.translation_suggestion_rejected_model_user1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=31,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_REJECTED,
            author_id='user1',
            final_reviewer_id='reviewer_3',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 5, 2),
        )

        self.translation_suggestion_rejected_model_user2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=32,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_REJECTED,
            author_id='user2',
            final_reviewer_id='reviewer_3',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='es',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 4, 2),
        )

        self.translation_suggestion_accepted_with_edits_model = (
            self.create_model(  # pylint: disable=line-too-long
                suggestion_models.GeneralSuggestionModel,
                id=33,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id=self.target_id_2,
                target_version_at_submission=self.target_version_at_submission,
                status=suggestion_models.STATUS_ACCEPTED,
                author_id='user1',
                final_reviewer_id='reviewer_2',
                change_cmd=self.change_cmd,
                score_category=self.score_category,
                language_code='hi',
                edited_by_reviewer=True,
                created_on=datetime.datetime(2023, 3, 2),
            )
        )

        self.translation_suggestion_accepted_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=34,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_3,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 2, 2),
        )

        self.translation_suggestion_in_review_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=35,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='user1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 2, 2),
        )

        self.translation_suggestion_in_review_model_user3 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=36,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_3,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='user3',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 2, 2),
        )

        self.translation_suggestion_in_review_model_user4 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=37,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_2,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='user4',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 2, 2),
        )

        self.transaltion_suggestion_accepted_model_with_incomplete_contribution_stats = self.create_model(  # pylint: disable=line-too-long
            suggestion_models.GeneralSuggestionModel,
            id=38,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='user4',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 2, 2),
        )

        self.transaltion_suggestion_model_with_none_story_id = (
            self.create_model(  # pylint: disable=line-too-long
                suggestion_models.GeneralSuggestionModel,
                id=39,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id='exp5',
                target_version_at_submission=self.target_version_at_submission,
                status=suggestion_models.STATUS_IN_REVIEW,
                author_id='user5',
                final_reviewer_id='reviewer_2',
                change_cmd=self.change_cmd,
                score_category=self.score_category,
                language_code='hi',
                edited_by_reviewer=False,
                created_on=datetime.datetime(2023, 2, 2),
            )
        )

        self.transaltion_suggestion_model_with_no_story_model = (
            self.create_model(  # pylint: disable=line-too-long
                suggestion_models.GeneralSuggestionModel,
                id=40,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id='exp6',
                target_version_at_submission=self.target_version_at_submission,
                status=suggestion_models.STATUS_IN_REVIEW,
                author_id='user6',
                final_reviewer_id='reviewer_3',
                change_cmd=self.change_cmd,
                score_category=self.score_category,
                language_code='pt',
                edited_by_reviewer=False,
                created_on=datetime.datetime(2023, 2, 2),
            )
        )

        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.target_id,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            states={
                'state1': state_domain.State.create_default_state(
                    'state1',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2',
                    'content_2',
                    'default_outcome_3',
                ).to_dict(),
            },
            next_content_id_index=4,
        )

        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.target_id_2,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            states={
                'state1': state_domain.State.create_default_state(
                    'state1',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2',
                    'content_2',
                    'default_outcome_3',
                ).to_dict(),
            },
            next_content_id_index=4,
        )

        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.target_id_3,
            title='exploration 3 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            states={
                'state1': state_domain.State.create_default_state(
                    'state1',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2',
                    'content_2',
                    'default_outcome_3',
                ).to_dict(),
            },
            next_content_id_index=4,
        )

        self.exp_4 = self.create_model(
            exp_models.ExplorationModel,
            id=self.target_id_4,
            title='exploration 4 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            states={
                'state1': state_domain.State.create_default_state(
                    'state1',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2',
                    'content_2',
                    'default_outcome_3',
                ).to_dict(),
            },
            next_content_id_index=4,
        )

        self.exp_context_1 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id,
            story_id='story1',
        )

        self.exp_context_2 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id_2,
            story_id='story2',
        )

        self.exp_context_3 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id_3,
            story_id='story3',
        )

        self.exp_context_4 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id_4,
            story_id='story4',
        )

        self.exp_context_with_no_story_model = self.create_model(
            exp_models.ExplorationContextModel, id='exp6', story_id='story6'
        )

        self.topic_model_1 = self.create_model(
            topic_models.TopicModel,
            id='topic1',
            name='name1',
            canonical_name='name-a',
            description='description',
            story_reference_schema_version=1,
            uncategorized_skill_ids=[self.target_id, self.target_id_2],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic1',
            canonical_story_references=[
                {'story_id': 'story1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragm',
        )

        self.topic_model_2 = self.create_model(
            topic_models.TopicModel,
            id='topic2',
            name='name2',
            canonical_name='name-b',
            description='description',
            story_reference_schema_version=1,
            uncategorized_skill_ids=[self.target_id],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic2',
            canonical_story_references=[
                {'story_id': 'story2', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragmm',
        )

        self.topic_model_3 = self.create_model(
            topic_models.TopicModel,
            id='topic3',
            name='name3',
            canonical_name='name-c',
            description='description',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic3',
            canonical_story_references=[
                {'story_id': 'story3', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragmmm',
        )

        self.topic_model_4 = self.create_model(
            topic_models.TopicModel,
            id='topic4',
            name='name4',
            canonical_name='name-d',
            description='description',
            story_reference_schema_version=1,
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic4',
            canonical_story_references=[
                {'story_id': 'story4', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragmmmm',
        )

        self.story_1 = self.create_model(
            story_models.StoryModel,
            id='story1',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic1',
            url_fragment='story',
            story_contents={
                'nodes': [
                    {
                        'id': 'node',
                        'outline': 'outline',
                        'title': 'node title',
                        'description': 'description',
                        'destination_node_ids': ['123'],
                        'acquired_skill_ids': [],
                        'exploration_id': self.target_id,
                        'prerequisite_skill_ids': [],
                        'outline_is_finalized': True,
                    }
                ],
                'initial_node_id': 'abc',
                'next_node_id': 'efg',
            },
            notes='note',
        )

        self.story_2 = self.create_model(
            story_models.StoryModel,
            id='story2',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic2',
            url_fragment='story',
            story_contents={
                'nodes': [
                    {
                        'id': 'node',
                        'outline': 'outline',
                        'title': 'node title',
                        'description': 'description',
                        'destination_node_ids': ['123'],
                        'acquired_skill_ids': [],
                        'exploration_id': self.target_id_2,
                        'prerequisite_skill_ids': [],
                        'outline_is_finalized': True,
                    }
                ],
                'initial_node_id': 'abc',
                'next_node_id': 'efg',
            },
            notes='note',
        )

        self.story_3 = self.create_model(
            story_models.StoryModel,
            id='story3',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic3',
            url_fragment='story',
            story_contents={
                'nodes': [
                    {
                        'id': 'node',
                        'outline': 'outline',
                        'title': 'node title',
                        'description': 'description',
                        'destination_node_ids': ['123'],
                        'acquired_skill_ids': [],
                        'exploration_id': self.target_id_3,
                        'prerequisite_skill_ids': [],
                        'outline_is_finalized': True,
                    }
                ],
                'initial_node_id': 'abc',
                'next_node_id': 'efg',
            },
            notes='note',
        )

        self.story_4 = self.create_model(
            story_models.StoryModel,
            id='story4',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic4',
            url_fragment='story',
            story_contents={
                'nodes': [
                    {
                        'id': 'node',
                        'outline': 'outline',
                        'title': 'node title',
                        'description': 'description',
                        'destination_node_ids': ['123'],
                        'acquired_skill_ids': [],
                        'exploration_id': self.target_id_4,
                        'prerequisite_skill_ids': [],
                        'outline_is_finalized': True,
                    }
                ],
                'initial_node_id': 'abc',
                'next_node_id': 'efg',
            },
            notes='note',
        )

        topic = topic_domain.Topic.create_default_topic(
            'topic1', 'name1', 'name-a', 'description', 'fragm'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        topic = topic_domain.Topic.create_default_topic(
            'topic2', 'name2', 'name-b', 'description', 'fragmm'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        topic = topic_domain.Topic.create_default_topic(
            'topic3', 'name3', 'name-c', 'description', 'fragmmm'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        topic = topic_domain.Topic.create_default_topic(
            'topic4', 'name4', 'name-d', 'description', 'fragmmmmm'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        # Skill ids 'exp1' and 'exp2' are assigned to topic1.
        unused_topic_assignment = skill_domain.TopicAssignment(
            'topic1', 'name1', 2, 1
        )
        # Skill id 'exp1' is assigned to topic2.
        unused_topic_assignment = skill_domain.TopicAssignment(
            'topic2', 'name1', 2, 1
        )

        self.exp_opportunity_model_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.target_id,
            topic_id='topic1',
            chapter_title='irelevant',
            content_count=1,
            story_id='story1',
            story_title='story title',
            topic_name='name1',
        )
        self.exp_opportunity_model_2 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.target_id_2,
            topic_id='topic2',
            chapter_title='irelevant',
            content_count=1,
            story_id='story2',
            story_title='story title',
            topic_name='name2',
        )
        self.exp_opportunity_model_3 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.target_id_3,
            topic_id='topic3',
            chapter_title='irelevant',
            content_count=1,
            story_id='story3',
            story_title='story title',
            topic_name='name3',
        )
        self.exp_opportunity_model_4 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.target_id,
            topic_id='topic4',
            chapter_title='irelevant',
            content_count=1,
            story_id='story4',
            story_title='story title',
            topic_name='name4',
        )
        self.skill_opportunity_model_1 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id=self.target_id,
            skill_description='A skill description',
            question_count=3,
        )
        self.skill_opportunity_model_2 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id=self.target_id_2,
            skill_description='A skill description',
            question_count=2,
        )


class GenerateContributorAdminStatsJobTests(ContributorDashboardTest):

    JOB_CLASS: Type[
        contributor_admin_stats_jobs.GenerateContributorAdminStatsJob
    ] = contributor_admin_stats_jobs.GenerateContributorAdminStatsJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_creates_admin_stats(self) -> None:
        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_2.update_timestamps()
        self.translation_contribution_model_3.update_timestamps()
        self.translation_contribution_model_4.update_timestamps()
        self.translation_contribution_model_with_no_topic.update_timestamps()
        self.translation_contribution_model_with_invalid_topic.update_timestamps()  # pylint: disable=line-too-long
        self.translation_contribution_model_5.update_timestamps()
        self.translation_review_model_1.update_timestamps()
        self.translation_review_model_2.update_timestamps()
        self.translation_review_model_3.update_timestamps()
        self.translation_review_model_4.update_timestamps()
        self.translation_review_model_with_invalid_topic.update_timestamps()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_2.update_timestamps()
        self.question_contribution_model_3.update_timestamps()
        self.question_contribution_model_4.update_timestamps()
        self.question_contribution_model_with_invalid_topic.update_timestamps()
        self.question_review_model_1.update_timestamps()
        self.question_review_model_2.update_timestamps()
        self.question_review_model_3.update_timestamps()
        self.question_review_model_4.update_timestamps()
        self.question_review_model_with_invalid_topic.update_timestamps()
        self.question_suggestion_rejected_model.update_timestamps()
        self.question_suggestion_accepted_with_edits_model.update_timestamps()
        self.question_suggestion_accepted_model.update_timestamps()
        self.question_suggestion_accepted_model_user2.update_timestamps()
        self.question_suggestion_accepted_model_user3.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.translation_suggestion_rejected_model_user2.update_timestamps()
        self.translation_suggestion_accepted_with_edits_model.update_timestamps()  # pylint: disable=line-too-long
        self.translation_suggestion_accepted_model.update_timestamps()
        self.translation_suggestion_in_review_model.update_timestamps()
        self.translation_suggestion_in_review_model_user3.update_timestamps()
        self.exp_opportunity_model_1.update_timestamps()
        self.exp_opportunity_model_2.update_timestamps()
        self.exp_opportunity_model_3.update_timestamps()
        self.skill_opportunity_model_1.update_timestamps()
        self.skill_opportunity_model_2.update_timestamps()

        self.put_multi(
            [
                self.translation_contribution_model_1,
                self.translation_contribution_model_2,
                self.translation_contribution_model_3,
                self.translation_contribution_model_4,
                self.translation_contribution_model_with_no_topic,
                self.translation_contribution_model_with_invalid_topic,
                self.translation_contribution_model_5,
                self.translation_review_model_1,
                self.translation_review_model_2,
                self.translation_review_model_3,
                self.translation_review_model_4,
                self.translation_review_model_with_invalid_topic,
                self.question_contribution_model_1,
                self.question_contribution_model_2,
                self.question_contribution_model_3,
                self.question_contribution_model_4,
                self.question_contribution_model_with_invalid_topic,
                self.question_review_model_1,
                self.question_review_model_2,
                self.question_review_model_3,
                self.question_review_model_4,
                self.question_review_model_with_invalid_topic,
                self.question_suggestion_rejected_model,
                self.question_suggestion_accepted_with_edits_model,
                self.question_suggestion_accepted_model,
                self.question_suggestion_accepted_model_user2,
                self.question_suggestion_accepted_model_user3,
                self.translation_suggestion_rejected_model_user1,
                self.translation_suggestion_rejected_model_user2,
                self.translation_suggestion_accepted_with_edits_model,
                self.translation_suggestion_accepted_model,
                self.translation_suggestion_in_review_model,
                self.translation_suggestion_in_review_model_user3,
                self.exp_opportunity_model_1,
                self.exp_opportunity_model_2,
                self.exp_opportunity_model_3,
                self.skill_opportunity_model_1,
                self.skill_opportunity_model_2,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Translation Reviewer Models SUCCESS: 3'
                ),
                job_run_result.JobRunResult(
                    stdout='Translation Submitter Models SUCCESS: 3'
                ),
                job_run_result.JobRunResult(
                    stdout='Question Submitter Models SUCCESS: 3'
                ),
                job_run_result.JobRunResult(
                    stdout='Question Reviewer Models SUCCESS: 3'
                ),
            ]
        )

        # Check for TranslationSubmitterTotalContributionStatsModel.
        translation_submitter_all_models = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel.get_all()
        )
        self.assertEqual(3, translation_submitter_all_models.count())

        translation_submitter_total_stats = suggestion_models.TranslationSubmitterTotalContributionStatsModel.get(
            'hi', 'user1'
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_submitter_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2', 'topic3'],
            translation_submitter_total_stats.topic_ids_with_translation_submissions,
        )
        self.assertEqual(
            ['accepted', 'accepted_with_edits', 'rejected'],
            translation_submitter_total_stats.recent_review_outcomes,
        )
        self.assertEqual(
            0, translation_submitter_total_stats.recent_performance
        )
        self.assertEqual(
            66.67, translation_submitter_total_stats.overall_accuracy
        )
        self.assertEqual(
            3, translation_submitter_total_stats.submitted_translations_count
        )
        self.assertEqual(
            300,
            translation_submitter_total_stats.submitted_translation_word_count,
        )
        self.assertEqual(
            2, translation_submitter_total_stats.accepted_translations_count
        )
        self.assertEqual(
            1,
            translation_submitter_total_stats.accepted_translations_without_reviewer_edits_count,
        )
        self.assertEqual(
            150,
            translation_submitter_total_stats.accepted_translation_word_count,
        )
        self.assertEqual(
            1, translation_submitter_total_stats.rejected_translations_count
        )
        self.assertEqual(
            15,
            translation_submitter_total_stats.rejected_translation_word_count,
        )
        self.assertEqual(
            datetime.date(2022, 5, 2),
            translation_submitter_total_stats.first_contribution_date,
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            translation_submitter_total_stats.last_contribution_date,
        )

        # Check for TranslationReviewerTotalContributionStatsModel.
        translation_reviewer_all_models = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel.get_all()
        )
        self.assertEqual(3, translation_reviewer_all_models.count())

        translation_reviewer_total_stats = suggestion_models.TranslationReviewerTotalContributionStatsModel.get(
            'es', 'user1'
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_reviewer_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            translation_reviewer_total_stats.topic_ids_with_translation_reviews,
        )
        self.assertEqual(
            40, translation_reviewer_total_stats.reviewed_translations_count
        )
        self.assertEqual(
            30, translation_reviewer_total_stats.accepted_translations_count
        )
        self.assertEqual(
            20,
            translation_reviewer_total_stats.accepted_translations_with_reviewer_edits_count,
        )
        self.assertEqual(
            100,
            translation_reviewer_total_stats.accepted_translation_word_count,
        )
        self.assertEqual(
            10, translation_reviewer_total_stats.rejected_translations_count
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            translation_reviewer_total_stats.first_contribution_date,
        )
        self.assertEqual(
            datetime.date(2023, 5, 2),
            translation_reviewer_total_stats.last_contribution_date,
        )

        # Check for QuestionSubmitterTotalContributionStatsModel.
        question_submitter_all_models = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.get_all()
        )
        self.assertEqual(3, question_submitter_all_models.count())

        question_submitter_total_stats = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.get(
                'user1'
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_submitter_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            question_submitter_total_stats.topic_ids_with_question_submissions,
        )
        self.assertEqual(
            ['accepted', 'accepted_with_edits', 'rejected'],
            question_submitter_total_stats.recent_review_outcomes,
        )
        self.assertEqual(0, question_submitter_total_stats.recent_performance)
        self.assertEqual(50, question_submitter_total_stats.overall_accuracy)
        self.assertEqual(
            20, question_submitter_total_stats.submitted_questions_count
        )
        self.assertEqual(
            10, question_submitter_total_stats.accepted_questions_count
        )
        self.assertEqual(
            6,
            question_submitter_total_stats.accepted_questions_without_reviewer_edits_count,
        )
        self.assertEqual(
            1, question_submitter_total_stats.rejected_questions_count
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            question_submitter_total_stats.first_contribution_date,
        )
        self.assertEqual(
            datetime.date(2023, 5, 2),
            question_submitter_total_stats.last_contribution_date,
        )

        # Check for QuestionReviewerTotalContributionStatsModel.
        question_reviewer_all_models = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel.get_all()
        )
        self.assertEqual(3, question_reviewer_all_models.count())

        question_reviewer_total_stats = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel.get(
                'user1'
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_reviewer_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            question_reviewer_total_stats.topic_ids_with_question_reviews,
        )
        self.assertEqual(
            20, question_reviewer_total_stats.reviewed_questions_count
        )
        self.assertEqual(
            10, question_reviewer_total_stats.accepted_questions_count
        )
        self.assertEqual(
            6,
            question_reviewer_total_stats.accepted_questions_with_reviewer_edits_count,
        )
        self.assertEqual(
            10, question_reviewer_total_stats.rejected_questions_count
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            question_reviewer_total_stats.first_contribution_date,
        )
        self.assertEqual(
            datetime.date(2023, 5, 2),
            question_reviewer_total_stats.last_contribution_date,
        )

    def test_job_for_recent_review_outcomes_limit(self) -> None:
        for i in range(1, 130):
            if i < 40:
                suggestion_models.GeneralSuggestionModel(
                    id=i,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_ACCEPTED,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code=None,
                    edited_by_reviewer=True,
                ).put()
            elif 40 < i < 80:
                suggestion_models.GeneralSuggestionModel(
                    id=i,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_REJECTED,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code=None,
                    edited_by_reviewer=True,
                ).put()
            elif 80 < i < 120:
                suggestion_models.GeneralSuggestionModel(
                    id=i,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_ACCEPTED,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code=None,
                    edited_by_reviewer=False,
                ).put()
            else:
                suggestion_models.GeneralSuggestionModel(
                    id=i,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_IN_REVIEW,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code=None,
                    edited_by_reviewer=False,
                ).put()

        for i in range(1, 130):
            if i < 40:
                suggestion_models.GeneralSuggestionModel(
                    id=i + 130,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id_2,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_ACCEPTED,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code='hi',
                    edited_by_reviewer=True,
                ).put()
            elif 40 < i < 80:
                suggestion_models.GeneralSuggestionModel(
                    id=i + 130,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id_2,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_REJECTED,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code='hi',
                    edited_by_reviewer=True,
                ).put()
            elif 80 < i < 120:
                suggestion_models.GeneralSuggestionModel(
                    id=i + 130,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id_2,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_ACCEPTED,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code='hi',
                    edited_by_reviewer=False,
                ).put()
            else:
                suggestion_models.GeneralSuggestionModel(
                    id=i + 130,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id=self.target_id_2,
                    target_version_at_submission=self.target_version_at_submission,
                    status=suggestion_models.STATUS_IN_REVIEW,
                    author_id='user1',
                    final_reviewer_id='reviewer_2',
                    change_cmd=self.change_cmd,
                    score_category=self.score_category,
                    language_code='hi',
                    edited_by_reviewer=False,
                ).put()

        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_1.put()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_1.put()
        self.skill_opportunity_model_1.update_timestamps()
        self.skill_opportunity_model_1.put()
        self.exp_opportunity_model_2.update_timestamps()
        self.exp_opportunity_model_2.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Question Submitter Models SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='Translation Submitter Models SUCCESS: 1'
                ),
            ]
        )

        translation_model = suggestion_models.TranslationSubmitterTotalContributionStatsModel.get(
            'hi', 'user1'
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_model is not None

        self.assertEqual(100, len(translation_model.recent_review_outcomes))

        question_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel.get(
                'user1'
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_model is not None

        self.assertEqual(100, len(question_model.recent_review_outcomes))

    def test_job_give_error_outputs(self) -> None:
        self.question_suggestion_rejected_model.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.exp_opportunity_model_1.update_timestamps()
        self.skill_opportunity_model_1.update_timestamps()

        self.put_multi(
            [
                self.question_suggestion_rejected_model,
                self.translation_suggestion_rejected_model_user1,
                self.exp_opportunity_model_1,
                self.skill_opportunity_model_1,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: \"Unable to create total question contribution '
                        'stats for contributor id(user1): min() arg is an '
                        'empty sequence\": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: \"Unable to create total translation contribution '
                        'stats for contributor id(user1) and language code(hi): '
                        'min() arg is an empty sequence\": 1'
                    )
                ),
            ]
        )

    def test_skip_generation_if_users_are_deleted(self) -> None:
        suggestion_models.GeneralSuggestionModel(
            id=1,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_2,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='pid_1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=True,
        ).put()

        suggestion_models.GeneralSuggestionModel(
            id=2,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_SKILL,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='pid_2',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=False,
        ).put()

        self.assert_job_output_is_empty()


class AuditGenerateContributorAdminStatsJobTests(ContributorDashboardTest):

    JOB_CLASS: Type[
        contributor_admin_stats_jobs.AuditGenerateContributorAdminStatsJob
    ] = contributor_admin_stats_jobs.AuditGenerateContributorAdminStatsJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_audits_admin_stats(self) -> None:

        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_2.update_timestamps()
        self.translation_contribution_model_3.update_timestamps()
        self.translation_contribution_model_4.update_timestamps()
        self.translation_contribution_model_5.update_timestamps()
        self.translation_review_model_1.update_timestamps()
        self.translation_review_model_2.update_timestamps()
        self.translation_review_model_3.update_timestamps()
        self.translation_review_model_4.update_timestamps()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_2.update_timestamps()
        self.question_contribution_model_3.update_timestamps()
        self.question_contribution_model_4.update_timestamps()
        self.question_review_model_1.update_timestamps()
        self.question_review_model_2.update_timestamps()
        self.question_review_model_3.update_timestamps()
        self.question_review_model_4.update_timestamps()
        self.question_suggestion_rejected_model.update_timestamps()
        self.question_suggestion_accepted_with_edits_model.update_timestamps()
        self.question_suggestion_accepted_model.update_timestamps()
        self.question_suggestion_accepted_model_user2.update_timestamps()
        self.question_suggestion_accepted_model_user3.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.translation_suggestion_rejected_model_user2.update_timestamps()
        self.translation_suggestion_accepted_with_edits_model.update_timestamps()  # pylint: disable=line-too-long
        self.translation_suggestion_accepted_model.update_timestamps()
        self.translation_suggestion_in_review_model_user3.update_timestamps()
        self.exp_opportunity_model_1.update_timestamps()
        self.exp_opportunity_model_2.update_timestamps()
        self.exp_opportunity_model_3.update_timestamps()
        self.skill_opportunity_model_1.update_timestamps()
        self.skill_opportunity_model_2.update_timestamps()

        self.put_multi(
            [
                self.translation_contribution_model_1,
                self.translation_contribution_model_2,
                self.translation_contribution_model_3,
                self.translation_contribution_model_4,
                self.translation_contribution_model_5,
                self.translation_review_model_1,
                self.translation_review_model_2,
                self.translation_review_model_3,
                self.translation_review_model_4,
                self.question_contribution_model_1,
                self.question_contribution_model_2,
                self.question_contribution_model_3,
                self.question_contribution_model_4,
                self.question_review_model_1,
                self.question_review_model_2,
                self.question_review_model_3,
                self.question_review_model_4,
                self.question_suggestion_rejected_model,
                self.question_suggestion_accepted_with_edits_model,
                self.question_suggestion_accepted_model,
                self.question_suggestion_accepted_model_user2,
                self.question_suggestion_accepted_model_user3,
                self.translation_suggestion_rejected_model_user1,
                self.translation_suggestion_rejected_model_user2,
                self.translation_suggestion_accepted_with_edits_model,
                self.translation_suggestion_accepted_model,
                self.translation_suggestion_in_review_model_user3,
                self.exp_opportunity_model_1,
                self.exp_opportunity_model_2,
                self.exp_opportunity_model_3,
                self.skill_opportunity_model_1,
                self.skill_opportunity_model_2,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Translation Reviewer Models SUCCESS: 3'
                ),
                job_run_result.JobRunResult(
                    stdout='Translation Submitter Models SUCCESS: 3'
                ),
                job_run_result.JobRunResult(
                    stdout='Question Submitter Models SUCCESS: 3'
                ),
                job_run_result.JobRunResult(
                    stdout='Question Reviewer Models SUCCESS: 3'
                ),
            ]
        )

    def test_job_for_recent_review_outcomes_limit(self) -> None:
        for i in range(1, 120):
            suggestion_models.GeneralSuggestionModel(
                id=i,
                suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id=self.target_id,
                target_version_at_submission=self.target_version_at_submission,
                status=suggestion_models.STATUS_ACCEPTED,
                author_id='user1',
                final_reviewer_id='reviewer_2',
                change_cmd=self.change_cmd,
                score_category=self.score_category,
                language_code=None,
                edited_by_reviewer=True,
            ).put()

        for i in range(1, 120):
            suggestion_models.GeneralSuggestionModel(
                id=i + 120,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id=self.target_id_2,
                target_version_at_submission=self.target_version_at_submission,
                status=suggestion_models.STATUS_ACCEPTED,
                author_id='user1',
                final_reviewer_id='reviewer_2',
                change_cmd=self.change_cmd,
                score_category=self.score_category,
                language_code='hi',
                edited_by_reviewer=True,
            ).put()

        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_1.put()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_1.put()
        self.skill_opportunity_model_1.update_timestamps()
        self.skill_opportunity_model_1.put()
        self.exp_opportunity_model_2.update_timestamps()
        self.exp_opportunity_model_2.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Translation Submitter Models SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='Question Submitter Models SUCCESS: 1'
                ),
            ]
        )

    def test_job_give_error_outputs(self) -> None:
        self.question_suggestion_rejected_model.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.exp_opportunity_model_1.update_timestamps()
        self.skill_opportunity_model_1.update_timestamps()

        self.put_multi(
            [
                self.question_suggestion_rejected_model,
                self.translation_suggestion_rejected_model_user1,
                self.exp_opportunity_model_1,
                self.skill_opportunity_model_1,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: "Unable to create total question contribution '
                        'stats for contributor id(user1): min() arg is an '
                        'empty sequence": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: "Unable to create total translation contribution '
                        'stats for contributor id(user1) and language code(hi): '
                        'min() arg is an empty sequence": 1'
                    )
                ),
            ]
        )

    def test_skip_audit_if_users_are_deleted(self) -> None:
        suggestion_models.GeneralSuggestionModel(
            id=1,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id_2,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='pid_1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=True,
        ).put()

        suggestion_models.GeneralSuggestionModel(
            id=2,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_SKILL,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='pid_2',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None,
            edited_by_reviewer=False,
        ).put()

        self.assert_job_output_is_empty()


class AuditAndLogIncorretDataInContributorAdminStatsJobTests(
    ContributorDashboardTest
):

    JOB_CLASS: Type[
        contributor_admin_stats_jobs.AuditAndLogIncorretDataInContributorAdminStatsJob
    ] = (
        contributor_admin_stats_jobs.AuditAndLogIncorretDataInContributorAdminStatsJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='LOGGED TRANSLATION SUGGESTION COUNT SUCCESS: 0'
                ),
                job_run_result.JobRunResult(
                    stdout='LOGGED QUESTION SUGGESTION COUNT SUCCESS: 0'
                ),
            ]
        )

    def test_job_audits_admin_stats(self) -> None:

        self.translation_contribution_model_3.update_timestamps()
        self.translation_contribution_model_with_invalid_topic.update_timestamps()  # pylint: disable=line-too-long
        self.translation_review_model_1.update_timestamps()
        self.translation_review_model_2.update_timestamps()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_with_invalid_topic.update_timestamps()
        self.question_review_model_1.update_timestamps()
        self.question_review_model_2.update_timestamps()
        self.question_suggestion_accepted_model.update_timestamps()
        self.question_suggestion_accepted_model_user2.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.translation_suggestion_rejected_model_user2.update_timestamps()
        self.transaltion_suggestion_model_with_none_story_id.update_timestamps()  # pylint: disable=line-too-long
        self.transaltion_suggestion_model_with_no_story_model.update_timestamps()  # pylint: disable=line-too-long
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()
        self.exp_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.story_1.update_timestamps()
        self.story_2.update_timestamps()
        self.exp_context_1.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.exp_context_with_no_story_model.update_timestamps()

        self.put_multi(
            [
                self.translation_contribution_model_3,
                self.translation_contribution_model_with_invalid_topic,
                self.translation_review_model_1,
                self.translation_review_model_2,
                self.question_contribution_model_1,
                self.question_contribution_model_with_invalid_topic,
                self.question_review_model_1,
                self.question_review_model_2,
                self.question_suggestion_accepted_model,
                self.question_suggestion_accepted_model_user2,
                self.translation_suggestion_rejected_model_user1,
                self.translation_suggestion_rejected_model_user2,
                self.transaltion_suggestion_model_with_none_story_id,
                self.transaltion_suggestion_model_with_no_story_model,
                self.topic_model_1,
                self.topic_model_2,
                self.exp_1,
                self.exp_2,
                self.story_1,
                self.story_2,
                self.exp_context_1,
                self.exp_context_2,
                self.exp_context_with_no_story_model,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        '<====TRANSLATION_CONTRIBUTION====>\n{\nsuggestion_id: 31,\n'
                        'suggestion_type: translate_content,\ntarget_type: exploration'
                        ',\ntraget_id: exp1,\ntarget_verion_at_submission: 1,\nstatus:'
                        ' rejected,\nlanguage_code: hi,\ncorresponding_topic_id: [\n{'
                        'topic_id: topic1, problem: no_stats_model},\n],\n'
                        'exp_opportunity_model_exists: False,\n},\n'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        '<====TRANSLATION_CONTRIBUTION====>\n{\nsuggestion_id: 39,\n'
                        'suggestion_type: translate_content,\ntarget_type: exploration'
                        ',\ntraget_id: exp5,\ntarget_verion_at_submission: 1,\nstatus:'
                        ' review,\nlanguage_code: hi,\ncorresponding_topic_id: [\n{'
                        'topic_id: None, problem: no_exp_context_model},\n],\n'
                        'exp_opportunity_model_exists: False,\n},\n'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        '<====TRANSLATION_CONTRIBUTION====>\n{\nsuggestion_id: 40,\n'
                        'suggestion_type: translate_content,\ntarget_type: exploration'
                        ',\ntraget_id: exp6,\ntarget_verion_at_submission: 1,\nstatus:'
                        ' review,\nlanguage_code: pt,\ncorresponding_topic_id: [\n{'
                        'topic_id: None, problem: no_story_model},\n],\n'
                        'exp_opportunity_model_exists: False,\n},\n'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        '<====QUESTION_CONTRIBUTION====>\n{\nsuggestion_id: 27,\n'
                        'suggestion_type: add_question,\ntarget_type: exploration,'
                        '\ntraget_id: exp1,\ntarget_verion_at_submission: 1,\nstatus:'
                        ' accepted,\ncorresponding_topic_id: [\n{topic_id: topic2, '
                        'problem: no_stats_model},\n],\nskill_opportunity_model_exists'
                        ': False,\n},\n'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=(
                        '<====QUESTION_CONTRIBUTION====>\n{\nsuggestion_id: 28,\n'
                        'suggestion_type: add_question,\ntarget_type: exploration,\n'
                        'traget_id: exp2,\ntarget_verion_at_submission: 1,\nstatus: '
                        'accepted,\ncorresponding_topic_id: [\n{topic_id: topic1, '
                        'problem: no_stats_model},\n],\nskill_opportunity_model_exists'
                        ': False,\n},\n'
                    )
                ),
                job_run_result.JobRunResult(
                    stdout=('LOGGED QUESTION SUGGESTION COUNT SUCCESS: 2')
                ),
                job_run_result.JobRunResult(
                    stdout=('LOGGED TRANSLATION SUGGESTION COUNT SUCCESS: 3')
                ),
            ]
        )


class ValidateTotalContributionStatsJobTests(ContributorDashboardTest):
    """Tests for ValidateTotalContributionStatsJob."""

    JOB_CLASS = contributor_admin_stats_jobs.ValidateTotalContributionStatsJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_successful_validation_emits_one_translation_and_one_question(
        self,
    ) -> None:
        # Here we use type Any because this list contains models of various
        # kinds.
        models_to_put: List[Any] = []

        topic = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name='t',
            canonical_name='t',
            description='d',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='t',
            canonical_story_references=[
                {'story_id': 'story1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragm',
        )
        models_to_put.append(topic)

        contrib = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=1,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            language_code=self.LANGUAGE_CODE,
            topic_id=self.TOPIC_ID,
            submitted_translations_count=3,
            submitted_translation_word_count=30,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=10,
            rejected_translations_count=1,
            rejected_translation_word_count=10,
            contribution_dates=self.CONTRIBUTION_DATES,
        )
        contrib.update_timestamps()
        models_to_put.append(contrib)

        exp_opportunity_model_x = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='expX',
            topic_id='topicx',
            chapter_title='irelevant',
            content_count=1,
            story_id='storyx',
            story_title='story title',
            topic_name='namex',
        )
        exp_opportunity_model_x.update_timestamps()
        models_to_put.append(exp_opportunity_model_x)

        skill_opportunity_model_1 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='expY',
            skill_description='A skill description',
            question_count=1,
        )
        skill_opportunity_model_1.update_timestamps()
        models_to_put.append(skill_opportunity_model_1)

        for status, edited in [
            ('accepted', False),
            ('accepted', True),
            ('rejected', False),
        ]:
            sugg = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id='expX',
                target_version_at_submission=1,
                status=status,
                author_id=self.CONTRIBUTOR_USER_ID,
                final_reviewer_id='rev',
                change_cmd={},
                score_category='translation.X',
                language_code=self.LANGUAGE_CODE,
                edited_by_reviewer=edited,
                created_on=datetime.datetime.utcnow(),
            )
            models_to_put.append(sugg)

        total = self.create_model(
            suggestion_models.TranslationSubmitterTotalContributionStatsModel,
            id=f'{self.LANGUAGE_CODE}.{self.CONTRIBUTOR_USER_ID}',
            language_code=self.LANGUAGE_CODE,
            contributor_id=self.CONTRIBUTOR_USER_ID,
            topic_ids_with_translation_submissions=[self.TOPIC_ID],
            recent_review_outcomes=[
                'accepted',
                'accepted_with_edits',
                'rejected',
            ],
            recent_performance=0,
            overall_accuracy=round(1 / 3 * 100, 2),
            submitted_translations_count=3,
            submitted_translation_word_count=30,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=10,
            rejected_translations_count=1,
            rejected_translation_word_count=10,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        total.update_timestamps()
        models_to_put.append(total)

        q_contrib = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=2,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_questions_count=3,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=1,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        q_contrib.update_timestamps()
        models_to_put.append(q_contrib)

        for status, edited in [
            ('accepted', False),
            ('accepted', True),
            ('rejected', False),
        ]:
            qsugg = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id='expY',
                target_version_at_submission=1,
                status=status,
                author_id=self.CONTRIBUTOR_USER_ID,
                final_reviewer_id='rev',
                change_cmd={},
                score_category='question.X',
                language_code=None,
                edited_by_reviewer=edited,
                created_on=datetime.datetime.utcnow(),
            )
            models_to_put.append(qsugg)

        q_total = self.create_model(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel,
            id=self.CONTRIBUTOR_USER_ID,
            contributor_id=self.CONTRIBUTOR_USER_ID,
            topic_ids_with_question_submissions=[self.TOPIC_ID],
            recent_review_outcomes=[
                'accepted',
                'accepted_with_edits',
                'rejected',
            ],
            recent_performance=(1 + 1 - 2 * 1),
            overall_accuracy=round(1 / 3 * 100, 2),
            submitted_questions_count=3,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=1,
            rejected_questions_count=1,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        q_total.update_timestamps()
        models_to_put.append(q_total)

        self.put_multi(models_to_put)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Valid Translation Submitter Models SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='Valid Question Submitter Models SUCCESS: 1'
                ),
            ]
        )

    def test_skip_validation_if_users_are_deleted(
        self,
    ) -> None:
        # Here we use type Any because this list contains models of various
        # kinds.
        models_to_put: List[Any] = []

        topic = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name='t',
            canonical_name='t',
            description='d',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='t',
            canonical_story_references=[
                {'story_id': 'story1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragm',
        )
        models_to_put.append(topic)

        exp_opportunity_model_x = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='expX',
            topic_id='topicx',
            chapter_title='irelevant',
            content_count=1,
            story_id='storyx',
            story_title='story title',
            topic_name='namex',
        )
        exp_opportunity_model_x.update_timestamps()
        models_to_put.append(exp_opportunity_model_x)

        skill_opportunity_model_1 = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='expY',
            skill_description='A skill description',
            question_count=1,
        )
        skill_opportunity_model_1.update_timestamps()
        models_to_put.append(skill_opportunity_model_1)

        for status, edited in [
            ('accepted', False),
            ('accepted', True),
            ('rejected', False),
        ]:
            sugg = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id='expX',
                target_version_at_submission=1,
                status=status,
                author_id='pid_1',
                final_reviewer_id='rev',
                change_cmd={},
                score_category='translation.X',
                language_code=self.LANGUAGE_CODE,
                edited_by_reviewer=edited,
                created_on=datetime.datetime.utcnow(),
            )
            models_to_put.append(sugg)

        for status, edited in [
            ('accepted', False),
            ('accepted', True),
            ('rejected', False),
        ]:
            qsugg = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                target_type=feconf.ENTITY_TYPE_EXPLORATION,
                target_id='expY',
                target_version_at_submission=1,
                status=status,
                author_id='pid_1',
                final_reviewer_id='rev',
                change_cmd={},
                score_category='question.X',
                language_code=None,
                edited_by_reviewer=edited,
                created_on=datetime.datetime.utcnow(),
            )
            models_to_put.append(qsugg)

        self.put_multi(models_to_put)

        self.assert_job_output_is_empty()

    def test_failed_validation_for_translation_triggers_all_failure_conditions(
        self,
    ) -> None:
        # Here we use type Any because this list contains models of various
        # kinds.
        models_to_put: List[Any] = []

        bad_contrib = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            contributor_user_id='user123',
            language_code='zz',
            topic_id='topic1',
            submitted_translations_count=5,
            submitted_translation_word_count=50,
            accepted_translations_count=2,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=20,
            rejected_translations_count=1,
            rejected_translation_word_count=5,
            contribution_dates=self.CONTRIBUTION_DATES,
        )
        bad_contrib.update_timestamps()
        models_to_put.append(bad_contrib)

        exp_opportunity_model_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='exp1',
            topic_id='topicx',
            chapter_title='irelevant',
            content_count=1,
            story_id='storyx',
            story_title='story title',
            topic_name='namex',
        )
        exp_opportunity_model_1.update_timestamps()
        models_to_put.append(exp_opportunity_model_1)

        exp_opportunity_model_2 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='exp2',
            topic_id='topicx',
            chapter_title='irelevant',
            content_count=1,
            story_id='storyx',
            story_title='story title',
            topic_name='namex',
        )
        exp_opportunity_model_2.update_timestamps()
        models_to_put.append(exp_opportunity_model_2)

        gs1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp1',
            target_version_at_submission=1,
            status='accepted',
            author_id='user123',
            final_reviewer_id='rev1',
            change_cmd={},
            score_category='translation.X',
            language_code='zz',
            edited_by_reviewer=False,
            created_on=datetime.datetime.combine(
                self.CONTRIBUTION_DATES[0], datetime.time.min
            ),
        )
        gs2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp2',
            target_version_at_submission=1,
            status='rejected',
            author_id='user123',
            final_reviewer_id='rev1',
            change_cmd={},
            score_category='translation.Y',
            language_code='zz',
            edited_by_reviewer=False,
            created_on=datetime.datetime.combine(
                self.CONTRIBUTION_DATES[1], datetime.time.min
            ),
        )
        models_to_put.extend([gs1, gs2])

        bad_total = self.create_model(
            suggestion_models.TranslationSubmitterTotalContributionStatsModel,
            id='zz.user123',
            language_code='zz',
            contributor_id='user123',
            topic_ids_with_translation_submissions=['other_topic'],
            recent_review_outcomes=[],
            recent_performance=0,
            overall_accuracy=0.0,
            submitted_translations_count=1,
            submitted_translation_word_count=0,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=0,
            rejected_translations_count=0,
            rejected_translation_word_count=0,
            first_contribution_date=self.CONTRIBUTION_DATES[1],
            last_contribution_date=self.CONTRIBUTION_DATES[0],
        )
        bad_total.update_timestamps()
        models_to_put.append(bad_total)

        self.put_multi(models_to_put)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Invalid Total Translation Submitter Models FAILED: 1'
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: \"\nValidation failed for '
                        'TranslationSubmitterTotalContributionStatsModel '
                        'zz.user123:\n'
                        '-> missing topic_ids {\'topic1\'} in total stats\n'
                        '-> field submitted_translations_count aggregated 5 != '
                        'total 1\n'
                        '-> field submitted_translation_word_count aggregated 50 '
                        '!= total 0\n'
                        '-> field accepted_translations_count aggregated 2 != '
                        'total 1\n'
                        '-> field '
                        'accepted_translations_without_reviewer_edits_count '
                        'aggregated 1 != total 0\n'
                        '-> field accepted_translation_word_count aggregated 20 '
                        '!= total 0\n'
                        '-> field rejected_translations_count aggregated 1 != '
                        'total 0\n'
                        '-> field rejected_translation_word_count aggregated 5 != '
                        'total 0\n'
                        '-> first contribution 2022-05-02 != 2023-04-02\n'
                        '-> last contribution 2023-04-02 != 2022-05-02\n'
                        '-> recent outcomes [\'accepted\', \'rejected\'] != []\n'
                        '-> recent performance -1 != 0\n'
                        '-> accuracy 100.0 != 0.0\n\": 1'
                    )
                ),
            ]
        )

    def test_failed_validation_for_question_triggers_all_failure_conditions(
        self,
    ) -> None:
        # Here we use type Any because this list contains models of various
        # types.
        models_to_put: List[Any] = []

        # 1) Create the TopicModel so the contrib is considered "valid".
        topic = self.create_model(
            topic_models.TopicModel,
            id='topic_q',
            name='QTopic',
            canonical_name='QTopic',
            description='desc',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='qtopic',
            canonical_story_references=[
                {'story_id': 'story1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragm',
        )
        models_to_put.append(topic)

        # 2) Create real QuestionContributionStatsModel for topic 'topic_q'.
        q_contrib = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='user_q',
            topic_id='topic_q',
            submitted_questions_count=3,
            accepted_questions_count=2,
            accepted_questions_without_reviewer_edits_count=1,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        q_contrib.update_timestamps()
        models_to_put.append(q_contrib)

        skill_opportunity_model_q = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='exp_q',
            skill_description='A skill description',
            question_count=1,
        )
        skill_opportunity_model_q.update_timestamps()
        models_to_put.append(skill_opportunity_model_q)

        # 3) Create rejected GeneralSuggestionModel for the recent outcomes.
        qsugg = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp_q',
            target_version_at_submission=1,
            status='rejected',
            author_id='user_q',
            final_reviewer_id='rev_q',
            change_cmd={},
            score_category='question.Y',
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime.combine(
                self.CONTRIBUTION_DATES[0], datetime.time.min
            ),
        )
        models_to_put.append(qsugg)

        # 4) Build a QuestionSubmitterTotalContributionStatsModel.
        bad_q_total = self.create_model(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel,
            id='user_q',
            contributor_id='user_q',
            topic_ids_with_question_submissions=['other_topic'],
            recent_review_outcomes=[],
            recent_performance=0,
            overall_accuracy=0.0,
            submitted_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=0,
            rejected_questions_count=0,
            first_contribution_date=self.CONTRIBUTION_DATES[1],
            last_contribution_date=self.CONTRIBUTION_DATES[0],
        )
        bad_q_total.update_timestamps()
        models_to_put.append(bad_q_total)

        # 5) Persist all of them.
        self.put_multi(models_to_put)

        # 7) We expect two question‐failure results in sequence.
        self.assert_job_output_is(
            [
                # Count of invalids (always on stdout, even for errors).
                job_run_result.JobRunResult(
                    stdout='Invalid Total Question Submitter Models FAILED: 1'
                ),
                # The detailed stderr log.
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: \"\nValidation failed for '
                        'QuestionSubmitterTotalContributionStatsModel user_q:\n'
                        '-> missing topic_ids {\'topic_q\'} in total stats\n'
                        '-> field submitted_questions_count aggregated 3 != total '
                        '1\n'
                        '-> field accepted_questions_count aggregated 2 != total '
                        '1\n'
                        '-> field accepted_questions_without_reviewer_edits_count '
                        'aggregated 1 != total 0\n'
                        '-> field rejected_questions_count 1 != total 0\n'
                        f'-> first contribution {self.CONTRIBUTION_DATES[0]} != '
                        f'{self.CONTRIBUTION_DATES[1]}\n'
                        f'-> last contribution {self.CONTRIBUTION_DATES[1]} != '
                        f'{self.CONTRIBUTION_DATES[0]}\n'
                        '-> recent outcomes [\'rejected\'] != []\n'
                        '-> recent performance -2 != 0\n'
                        '-> accuracy 100.0 != 0.0\n\": 1'
                    )
                ),
            ]
        )

    def test_more_than_hundred_translation_and_question_suggestions(
        self,
    ) -> None:
        # Here we use type Any because this list contains models of various
        # kinds.
        models_to_put: List[Any] = []
        recent_review_outcomes: List[str] = []

        exp_opportunity_model_x = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='expX',
            topic_id='topicx',
            chapter_title='irelevant',
            content_count=1,
            story_id='storyx',
            story_title='story title',
            topic_name='namex',
        )
        exp_opportunity_model_x.update_timestamps()
        models_to_put.append(exp_opportunity_model_x)

        skill_opportunity_model_x = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='expX',
            skill_description='A skill description',
            question_count=1,
        )
        skill_opportunity_model_x.update_timestamps()
        models_to_put.append(skill_opportunity_model_x)

        sugg = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='expX',
            target_version_at_submission=1,
            status='review',
            author_id=self.CONTRIBUTOR_USER_ID,
            change_cmd={},
            score_category='translation.X',
            language_code=self.LANGUAGE_CODE,
            edited_by_reviewer=False,
            created_on=datetime.datetime.utcnow(),
        )
        models_to_put.append(sugg)
        sugg = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='expX',
            target_version_at_submission=1,
            status='review',
            author_id=self.CONTRIBUTOR_USER_ID,
            change_cmd={},
            score_category='translation.X',
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime.utcnow(),
        )
        models_to_put.append(sugg)

        for i in range(150):
            if i < 100:
                sugg = self.create_model(
                    suggestion_models.GeneralSuggestionModel,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id='expX',
                    target_version_at_submission=1,
                    status='accepted',
                    author_id=self.CONTRIBUTOR_USER_ID,
                    final_reviewer_id='rev',
                    change_cmd={},
                    score_category='translation.X',
                    language_code=self.LANGUAGE_CODE,
                    edited_by_reviewer=False,
                    created_on=datetime.datetime.utcnow(),
                )
                models_to_put.append(sugg)
                sugg = self.create_model(
                    suggestion_models.GeneralSuggestionModel,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id='expX',
                    target_version_at_submission=1,
                    status='accepted',
                    author_id=self.CONTRIBUTOR_USER_ID,
                    final_reviewer_id='rev',
                    change_cmd={},
                    score_category='translation.X',
                    language_code=None,
                    edited_by_reviewer=False,
                    created_on=datetime.datetime.utcnow(),
                )
                models_to_put.append(sugg)
            elif 100 <= i < 125:
                sugg = self.create_model(
                    suggestion_models.GeneralSuggestionModel,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id='expX',
                    target_version_at_submission=1,
                    status='accepted',
                    author_id=self.CONTRIBUTOR_USER_ID,
                    final_reviewer_id='rev',
                    change_cmd={},
                    score_category='translation.X',
                    language_code=self.LANGUAGE_CODE,
                    edited_by_reviewer=True,
                    created_on=datetime.datetime.utcnow(),
                )
                models_to_put.append(sugg)
                sugg = self.create_model(
                    suggestion_models.GeneralSuggestionModel,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id='expX',
                    target_version_at_submission=1,
                    status='accepted',
                    author_id=self.CONTRIBUTOR_USER_ID,
                    final_reviewer_id='rev',
                    change_cmd={},
                    score_category='translation.X',
                    language_code=None,
                    edited_by_reviewer=True,
                    created_on=datetime.datetime.utcnow(),
                )
                models_to_put.append(sugg)
            else:
                sugg = self.create_model(
                    suggestion_models.GeneralSuggestionModel,
                    suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id='expX',
                    target_version_at_submission=1,
                    status='rejected',
                    author_id=self.CONTRIBUTOR_USER_ID,
                    final_reviewer_id='rev',
                    change_cmd={},
                    score_category='translation.X',
                    language_code=self.LANGUAGE_CODE,
                    edited_by_reviewer=False,
                    created_on=datetime.datetime.utcnow(),
                )
                models_to_put.append(sugg)
                sugg = self.create_model(
                    suggestion_models.GeneralSuggestionModel,
                    suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
                    target_type=feconf.ENTITY_TYPE_EXPLORATION,
                    target_id='expX',
                    target_version_at_submission=1,
                    status='rejected',
                    author_id=self.CONTRIBUTOR_USER_ID,
                    final_reviewer_id='rev',
                    change_cmd={},
                    score_category='translation.X',
                    language_code=None,
                    edited_by_reviewer=False,
                    created_on=datetime.datetime.utcnow(),
                )
                models_to_put.append(sugg)

        for i in range(100):
            if i < 50:
                recent_review_outcomes.append('accepted')
            elif 50 <= i < 75:
                recent_review_outcomes.append('accepted_with_edits')
            else:
                recent_review_outcomes.append('rejected')

        topic = self.create_model(
            topic_models.TopicModel,
            id=self.TOPIC_ID,
            name='t',
            canonical_name='t',
            description='d',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='t',
            canonical_story_references=[
                {'story_id': 'story1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fragm',
        )
        models_to_put.append(topic)

        contrib = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=1,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            language_code=self.LANGUAGE_CODE,
            topic_id=self.TOPIC_ID,
            submitted_translations_count=27,
            submitted_translation_word_count=270,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=10,
            rejected_translations_count=25,
            rejected_translation_word_count=250,
            contribution_dates=self.CONTRIBUTION_DATES,
        )
        contrib.update_timestamps()
        models_to_put.append(contrib)

        total = self.create_model(
            suggestion_models.TranslationSubmitterTotalContributionStatsModel,
            id=f'{self.LANGUAGE_CODE}.{self.CONTRIBUTOR_USER_ID}',
            language_code=self.LANGUAGE_CODE,
            contributor_id=self.CONTRIBUTOR_USER_ID,
            topic_ids_with_translation_submissions=[self.TOPIC_ID],
            recent_review_outcomes=recent_review_outcomes,
            recent_performance=25,
            overall_accuracy=round(1 / 27 * 100, 2),
            submitted_translations_count=27,
            submitted_translation_word_count=270,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=10,
            rejected_translations_count=25,
            rejected_translation_word_count=250,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        total.update_timestamps()
        models_to_put.append(total)

        q_contrib = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=2,
            contributor_user_id=self.CONTRIBUTOR_USER_ID,
            topic_id=self.TOPIC_ID,
            submitted_questions_count=27,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=1,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        q_contrib.update_timestamps()
        models_to_put.append(q_contrib)

        q_total = self.create_model(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel,
            id=self.CONTRIBUTOR_USER_ID,
            contributor_id=self.CONTRIBUTOR_USER_ID,
            topic_ids_with_question_submissions=[self.TOPIC_ID],
            recent_review_outcomes=recent_review_outcomes,
            recent_performance=25,
            overall_accuracy=round(1 / 27 * 100, 2),
            submitted_questions_count=27,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=1,
            rejected_questions_count=25,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        q_total.update_timestamps()
        models_to_put.append(q_total)

        self.put_multi(models_to_put)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Valid Translation Submitter Models SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='Valid Question Submitter Models SUCCESS: 1'
                ),
            ]
        )

    def test_translation_skip_recent_and_accuracy_when_zero_submissions(
        self,
    ) -> None:
        # 1) Create a valid TopicModel.
        topic = self.create_model(
            topic_models.TopicModel,
            id='t0',
            name='t0',
            canonical_name='t0',
            description='d',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='t0',
            canonical_story_references=[
                {'story_id': 's1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='f0',
        )
        topic.update_timestamps()

        # 2) No TranslationContributionStatsModel at all (so sums = 0).
        # 3) One TranslationSubmitterTotalContributionStatsModel with
        #    submitted_translations_count = 0.
        total = self.create_model(
            suggestion_models.TranslationSubmitterTotalContributionStatsModel,
            id='en.userX',
            language_code='en',
            contributor_id='userX',
            topic_ids_with_translation_submissions=[],
            recent_review_outcomes=[],
            recent_performance=0,
            overall_accuracy=0.0,
            submitted_translations_count=0,
            submitted_translation_word_count=0,
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=0,
            rejected_translations_count=0,
            rejected_translation_word_count=0,
            first_contribution_date=None,
            last_contribution_date=None,
        )
        total.update_timestamps()

        self.put_multi([topic, total])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Valid Translation Submitter Models SUCCESS: 1'
                )
            ]
        )

    def test_question_skip_date_when_no_valid_contributions(self) -> None:
        # 1) Create a valid TopicModel but no QuestionContributionStatsModel.
        topic = self.create_model(
            topic_models.TopicModel,
            id='q0',
            name='q0',
            canonical_name='q0',
            description='d',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='q0',
            canonical_story_references=[
                {'story_id': 's1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='f0',
        )
        topic.update_timestamps()

        # 2) One QuestionSubmitterTotalContributionStatsModel but no
        #    underlying contributions.
        q_total = self.create_model(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel,
            id='userQ',
            contributor_id='userQ',
            topic_ids_with_question_submissions=[],
            recent_review_outcomes=[],
            recent_performance=0,
            overall_accuracy=0.0,
            submitted_questions_count=0,
            accepted_questions_count=0,
            accepted_questions_without_reviewer_edits_count=0,
            rejected_questions_count=0,
            first_contribution_date=None,
            last_contribution_date=None,
        )
        q_total.update_timestamps()

        self.put_multi([topic, q_total])

        # Should succeed—no date‐related errors when there are no contributions.
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Valid Question Submitter Models SUCCESS: 1'
                )
            ]
        )

    def test_question_skip_accuracy_when_zero_submissions(self) -> None:
        # Build on previous: create one minimal contribution and total=0.
        contrib = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='uZ',
            topic_id='qZ',
            submitted_questions_count=0,
            accepted_questions_count=0,
            accepted_questions_without_reviewer_edits_count=0,
            first_contribution_date=None,
            last_contribution_date=None,
        )
        contrib.update_timestamps()

        q_total = self.create_model(
            suggestion_models.QuestionSubmitterTotalContributionStatsModel,
            id='uZ',
            contributor_id='uZ',
            topic_ids_with_question_submissions=['qZ'],
            recent_review_outcomes=[],
            recent_performance=0,
            overall_accuracy=0.0,
            submitted_questions_count=0,
            accepted_questions_count=0,
            accepted_questions_without_reviewer_edits_count=0,
            rejected_questions_count=0,
            first_contribution_date=None,
            last_contribution_date=None,
        )
        q_total.update_timestamps()

        # We still need a valid topic to avoid the "missing topic_ids" error.
        topic = self.create_model(
            topic_models.TopicModel,
            id='qZ',
            name='qZ',
            canonical_name='qZ',
            description='d',
            story_reference_schema_version=1,
            uncategorized_skill_ids=['skill1'],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='en',
            url_fragment='qZ',
            canonical_story_references=[
                {'story_id': 's1', 'story_is_published': False}
            ],
            page_title_fragment_for_web='fz',
        )
        topic.update_timestamps()

        self.put_multi([topic, contrib, q_total])

        # Should pass, because the accuracy branch is skipped when zero.
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Valid Question Submitter Models SUCCESS: 1'
                )
            ]
        )

    def test_translation_missing_total_emits_missing_log(self) -> None:
        # Test missing TranslationSubmitterTotalContributionStatsModel.

        # Here we use type Any because this list contains models of various
        # kinds.
        models_to_put: List[Any] = []

        # 1) Create an exploration opportunity so the suggestion is considered.
        exp_opportunity = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id='exp_missing_total',
            topic_id='topic_missing',
            chapter_title='irrelevant',
            content_count=1,
            story_id='story_missing',
            story_title='story title',
            topic_name='topic_missing',
        )
        exp_opportunity.update_timestamps()
        models_to_put.append(exp_opportunity)

        # 2) TranslationContributionStatsModel.
        contrib = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            id=101,
            contributor_user_id='u1',
            language_code='lang1',
            topic_id='topic_missing',
            submitted_translations_count=2,
            submitted_translation_word_count=20,
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=10,
            rejected_translations_count=1,
            rejected_translation_word_count=10,
            contribution_dates=self.CONTRIBUTION_DATES,
        )
        contrib.update_timestamps()
        models_to_put.append(contrib)

        # 3) One GeneralSuggestionModel for translation authored by u1/lang1.
        sugg = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=102,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp_missing_total',
            target_version_at_submission=1,
            status='accepted',
            author_id='u1',
            final_reviewer_id='rev',
            change_cmd={},
            score_category='translation.X',
            language_code='lang1',
            edited_by_reviewer=False,
            created_on=datetime.datetime.utcnow(),
        )
        models_to_put.append(sugg)

        self.put_multi(models_to_put)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Missing Total Translation Submitter Models FAILED: 1'
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: \"Missing '
                        'TranslationSubmitterTotalContributionStatsModel for key '
                        '(\'u1\', \'lang1\'):\n'
                        '-> TranslationContributionStatsModel:\n'
                        '--101\n'
                        '-> Translation GeneralSuggestionModel:\n'
                        '--102\n\": 1'
                    )
                ),
            ]
        )

    def test_question_missing_total_emits_missing_log(self) -> None:
        # Test missing QuestionSubmitterTotalContributionStatsModel.

        # Here we use type Any because this list contains models of various
        # kinds.
        models_to_put: List[Any] = []

        # 1) Create a skill opportunity so the suggestion is considered.
        skill_opportunity = self.create_model(
            opportunity_models.SkillOpportunityModel,
            id='exp_q_missing',
            skill_description='A skill description',
            question_count=1,
        )
        skill_opportunity.update_timestamps()
        models_to_put.append(skill_opportunity)

        # 2) QuestionContributionStatsModel (no matching total intentionally).
        q_contrib = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            id=202,
            contributor_user_id='uq',
            topic_id='topic_q_missing',
            submitted_questions_count=1,
            accepted_questions_count=1,
            accepted_questions_without_reviewer_edits_count=0,
            first_contribution_date=self.CONTRIBUTION_DATES[0],
            last_contribution_date=self.CONTRIBUTION_DATES[1],
        )
        q_contrib.update_timestamps()
        models_to_put.append(q_contrib)

        # 3) One GeneralSuggestionModel for question authored by uq.
        qsugg = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=203,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp_q_missing',
            target_version_at_submission=1,
            status='accepted',
            author_id='uq',
            final_reviewer_id='rev_q',
            change_cmd={},
            score_category='question.X',
            language_code=None,
            edited_by_reviewer=False,
            created_on=datetime.datetime.utcnow(),
        )
        models_to_put.append(qsugg)

        self.put_multi(models_to_put)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='Missing Total Question Submitter Models FAILED: 1'
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'ERROR: \"Missing '
                        'QuestionSubmitterTotalContributionStatsModel for '
                        'key uq:\n'
                        '-> QuestionContributionStatsModel:\n'
                        '--202\n'
                        '-> Question GeneralSuggestionModel:\n'
                        '--203\n\": 1'
                    )
                ),
            ]
        )
