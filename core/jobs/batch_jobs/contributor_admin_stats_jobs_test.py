# coding: utf-8
#
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

"""Unit tests for jobs.blog_validation_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import change_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import contributor_admin_stats_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Mapping, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models) = models.Registry.import_models([
    models.Names.SUGGESTION
])


class GenerateContributorAdminStatsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        contributor_admin_stats_jobs.GenerateContributorAdminStatsJob
    ] = contributor_admin_stats_jobs.GenerateContributorAdminStatsJob

    LANGUAGE_CODE: Final = 'es'
    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    TOPIC_ID: Final = 'topic_id'
    SUBMITTED_TRANSLATIONS_COUNT: Final = 2
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 5
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    REJECTED_TRANSLATIONS_COUNT: Final = 5
    REJECTED_TRANSLATION_WORD_COUNT: Final = 5
    REVIEWED_TRANSLATIONS_COUNT = 10
    REVIEWED_TRANSLATION_WORD_COUNT = 10
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT = 10
    FIRST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE = datetime.date.fromtimestamp(1616173836)
    SUBMITTED_QUESTION_COUNT = 2
    ACCEPTED_QUESTIONS_COUNT = 1
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT = 5
    REVIEWED_QUESTIONS_COUNT = 2
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT = 5
    CONTRIBUTION_DATES: Final = [
        datetime.date(2023, 5, 2),
        datetime.date(2023, 4, 2)
    ]

    score_category: str = (
        'translation' +
        '.' + 'English')

    topic_name = 'topic'
    target_id = 'exp1'
    target_version_at_submission = 1
    change_cmd: Mapping[
        str, change_domain.AcceptableChangeDictTypes
    ] = {}
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
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic2',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
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
            contribution_dates=self.CONTRIBUTION_DATES
        )

        self.translation_contribution_model_2 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic1',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
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
            contribution_dates=self.CONTRIBUTION_DATES
        )

        self.translation_contribution_model_3 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code=self.LANGUAGE_CODE,
            contributor_user_id='user2',
            topic_id='topic1',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
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
            contribution_dates=self.CONTRIBUTION_DATES
        )

        self.translation_contribution_model_4 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic3',
            submitted_translations_count=self.SUBMITTED_TRANSLATIONS_COUNT,
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
            contribution_dates=self.CONTRIBUTION_DATES
        )

        self.translation_review_model_1 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user1',
            topic_id='topic1',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.translation_review_model_2 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user1',
            topic_id='topic2',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.translation_review_model_3 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            language_code='hi',
            reviewer_user_id='user2',
            topic_id='topic1',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.translation_review_model_4 = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user3',
            topic_id='topic4',
            reviewed_translations_count=self.REVIEWED_TRANSLATIONS_COUNT,
            reviewed_translation_word_count=(
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=self.ACCEPTED_TRANSLATIONS_COUNT,
            accepted_translations_with_reviewer_edits_count=(
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_contribution_model_1 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='user1',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_contribution_model_2 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='user1',
            topic_id='topic2',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_contribution_model_3 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='user2',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_contribution_model_4 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='user3',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_review_model_1 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            reviewer_user_id='user1',
            topic_id='topic1',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_review_model_2 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            reviewer_user_id='user1',
            topic_id='topic2',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_review_model_3 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            reviewer_user_id='user2',
            topic_id='topic1',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_review_model_4 = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            reviewer_user_id='user3',
            topic_id='topic1',
            reviewed_questions_count=self.REVIEWED_QUESTIONS_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_with_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_suggestion_rejected_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_REJECTED,
            author_id='user1',
            final_reviewer_id='reviewer_1',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code=None)

        self.question_suggestion_accepted_with_edits_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            edited_by_reviewer=True)

        self.question_suggestion_accepted_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            edited_by_reviewer=False)

        self.translation_suggestion_rejected_model_user1 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            edited_by_reviewer=False)

        self.translation_suggestion_rejected_model_user2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            edited_by_reviewer=False)

        self.translation_suggestion_accepted_with_edits_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=True,
            created_on=datetime.datetime(2023, 3, 2))

        self.translation_suggestion_accepted_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='user1',
            final_reviewer_id='reviewer_2',
            change_cmd=self.change_cmd,
            score_category=self.score_category,
            language_code='hi',
            edited_by_reviewer=True,
            created_on=datetime.datetime(2023, 3, 2))

    def test_job_deletes_sent_email_model_with_user_as_sender(self) -> None:
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 3'),
            job_run_result.JobRunResult(stdout='SUCCESS: 3'),
            job_run_result.JobRunResult(stdout='SUCCESS: 4'),
            job_run_result.JobRunResult(stdout='SUCCESS: 3'),
        ])
