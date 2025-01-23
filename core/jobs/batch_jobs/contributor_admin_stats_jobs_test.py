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
from core.domain import change_domain
from core.domain import skill_domain
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import contributor_admin_stats_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Mapping, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import story_models
    from mypy_imports import suggestion_models
    from mypy_imports import topic_models

(
    exp_models,
    story_models,
    suggestion_models,
    topic_models) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.STORY,
    models.Names.SUGGESTION,
    models.Names.TOPIC
])


class ContributorDashboardTest(job_test_utils.JobTestBase):
    """ Setup for Contributor Admin Dashboard Jobs Tests
    """

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
        datetime.date(2023, 4, 2)
    ]

    score_category: str = 'translation.English'

    topic_name = 'topic'
    target_id = 'exp1'
    target_id_2 = 'exp2'
    target_id_3 = 'exp3'
    target_id_4 = 'exp4'
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
            submitted_translations_count=1,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=0,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=[datetime.date(2022, 5, 2)]
        )

        self.translation_contribution_model_2 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='topic1',
            submitted_translations_count=1,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=1,
            accepted_translations_without_reviewer_edits_count=1,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=0,
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
            submitted_translations_count=1,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=1,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=self.CONTRIBUTION_DATES
        )

        self.translation_contribution_model_with_no_topic = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code='hi',
            contributor_user_id='user1',
            topic_id='',
            submitted_translations_count=20,
            submitted_translation_word_count=(
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            accepted_translations_count=0,
            accepted_translations_without_reviewer_edits_count=0,
            accepted_translation_word_count=(
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            rejected_translations_count=1,
            rejected_translation_word_count=(
                self.REJECTED_TRANSLATION_WORD_COUNT),
            contribution_dates=self.CONTRIBUTION_DATES
        )

        self.translation_contribution_model_with_invalid_topic = (
            self.create_model(
                suggestion_models.TranslationContributionStatsModel,
                language_code='hi',
                contributor_user_id='user1',
                topic_id='invalid_topic',
                submitted_translations_count=20,
                submitted_translation_word_count=(
                    self.SUBMITTED_TRANSLATION_WORD_COUNT),
                accepted_translations_count=0,
                accepted_translations_without_reviewer_edits_count=0,
                accepted_translation_word_count=(
                    self.ACCEPTED_TRANSLATION_WORD_COUNT),
                rejected_translations_count=1,
                rejected_translation_word_count=(
                    self.REJECTED_TRANSLATION_WORD_COUNT),
                contribution_dates=self.CONTRIBUTION_DATES
        ))

        self.translation_contribution_model_5 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code='hi',
            contributor_user_id='user3',
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

        self.translation_contribution_model_6 = self.create_model(
            suggestion_models.TranslationContributionStatsModel,
            language_code='hi',
            contributor_user_id='user4',
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

        self.translation_review_model_with_invalid_topic = self.create_model(
            suggestion_models.TranslationReviewStatsModel,
            language_code=self.LANGUAGE_CODE,
            reviewer_user_id='user3',
            topic_id='invalid_topic',
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

        self.question_contribution_model_5 = self.create_model(
            suggestion_models.QuestionContributionStatsModel,
            contributor_user_id='user4',
            topic_id='topic1',
            submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
            accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
            accepted_questions_without_reviewer_edits_count=(
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
            last_contribution_date=self.LAST_CONTRIBUTION_DATE
        )

        self.question_contribution_model_with_invalid_topic = (
            self.create_model(
                suggestion_models.QuestionContributionStatsModel,
                contributor_user_id='user3',
                topic_id='invalid_topic',
                submitted_questions_count=self.SUBMITTED_QUESTION_COUNT,
                accepted_questions_count=self.ACCEPTED_QUESTIONS_COUNT,
                accepted_questions_without_reviewer_edits_count=(
                    self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
                first_contribution_date=self.FIRST_CONTRIBUTION_DATE,
                last_contribution_date=self.LAST_CONTRIBUTION_DATE
        ))

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

        self.question_review_model_with_invalid_topic = self.create_model(
            suggestion_models.QuestionReviewStatsModel,
            reviewer_user_id='user3',
            topic_id='invalid_topic',
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
            language_code=None,
            created_on=datetime.datetime(2023, 5, 2))

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
            edited_by_reviewer=True,
            created_on=datetime.datetime(2023, 4, 2))

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
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 3, 2))

        self.question_suggestion_accepted_model_user2 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 3, 2))

        self.question_suggestion_accepted_model_user3 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 3, 2))

        self.question_suggestion_accepted_model_with_incomplete_contribution_stats = ( # pylint: disable=line-too-long
            self.create_model(
                suggestion_models.GeneralSuggestionModel,
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
                created_on=datetime.datetime(2023, 3, 2)))

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
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 5, 2))

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
            edited_by_reviewer=False,
            created_on=datetime.datetime(2023, 4, 2))

        self.translation_suggestion_accepted_with_edits_model = self.create_model( # pylint: disable=line-too-long
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 3, 2))

        self.translation_suggestion_accepted_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 2, 2))

        self.translation_suggestion_in_review_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 2, 2))

        self.translation_suggestion_in_review_model_user3 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 2, 2))

        self.translation_suggestion_in_review_model_user4 = self.create_model(
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 2, 2))

        self.transaltion_suggestion_accepted_model_with_incomplete_contribution_stats = self.create_model( # pylint: disable=line-too-long
            suggestion_models.GeneralSuggestionModel,
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
            created_on=datetime.datetime(2023, 2, 2))

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
                    'state1', 'content_0', 'default_outcome_1',
                    is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2', 'content_2', 'default_outcome_3',
                ).to_dict()
            },
            next_content_id_index=4
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
                    'state1', 'content_0', 'default_outcome_1',
                    is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2', 'content_2', 'default_outcome_3',
                ).to_dict()
            },
            next_content_id_index=4
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
                    'state1', 'content_0', 'default_outcome_1',
                    is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2', 'content_2', 'default_outcome_3',
                ).to_dict()
            },
            next_content_id_index=4
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
                    'state1', 'content_0', 'default_outcome_1',
                    is_initial_state=True
                ).to_dict(),
                'state2': state_domain.State.create_default_state(
                    'state2', 'content_2', 'default_outcome_3',
                ).to_dict()
            },
            next_content_id_index=4
        )

        self.exp_context_1 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id,
            story_id='story1'
        )

        self.exp_context_2 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id_2,
            story_id='story2'
        )

        self.exp_context_3 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id_3,
            story_id='story3'
        )

        self.exp_context_4 = self.create_model(
            exp_models.ExplorationContextModel,
            id=self.target_id_4,
            story_id='story4'
        )

        self.topic_model_1 = self.create_model(
            topic_models.TopicModel,
            id='topic1',
            name='name1',
            canonical_name='name-a',
            description='description',
            story_reference_schema_version=1,
            uncategorized_skill_ids=[
                self.target_id, self.target_id_2],
            subtopic_schema_version=1,
            next_subtopic_id=1,
            language_code='cs',
            url_fragment='topic1',
            canonical_story_references=[{
                'story_id': 'story1',
                'story_is_published': False
            }],
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
            canonical_story_references=[{
                'story_id': 'story2',
                'story_is_published': False
            }],
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
            canonical_story_references=[{
                'story_id': 'story3',
                'story_is_published': False
            }],
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
            canonical_story_references=[{
                'story_id': 'story4',
                'story_is_published': False
            }],
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
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.target_id,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')

        self.story_2 = self.create_model(
            story_models.StoryModel,
            id='story2',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic2',
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.target_id_2,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')

        self.story_3 = self.create_model(
            story_models.StoryModel,
            id='story3',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic3',
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.target_id_3,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')

        self.story_4 = self.create_model(
            story_models.StoryModel,
            id='story4',
            title='story title',
            language_code='en',
            story_contents_schema_version=1,
            corresponding_topic_id='topic4',
            url_fragment='story',
            story_contents={
                'nodes': [{
                    'id': 'node',
                    'outline': 'outline',
                    'title': 'node title',
                    'description': 'description',
                    'destination_node_ids': ['123'],
                    'acquired_skill_ids': [],
                    'exploration_id': self.target_id_4,
                    'prerequisite_skill_ids': [],
                    'outline_is_finalized': True
                }],
                'initial_node_id': 'abc',
                'next_node_id': 'efg'
            },
            notes='note')

        topic = topic_domain.Topic.create_default_topic(
            'topic1', 'name1', 'name-a', 'description', 'fragm')
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        topic = topic_domain.Topic.create_default_topic(
            'topic2', 'name2', 'name-b', 'description', 'fragmm')
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        topic = topic_domain.Topic.create_default_topic(
            'topic3', 'name3', 'name-c', 'description', 'fragmmm')
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        topic = topic_domain.Topic.create_default_topic(
            'topic4', 'name4', 'name-d', 'description', 'fragmmmmm')
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)

        # Skill ids 'exp1' and 'exp2' are assigned to topic1.
        unused_topic_assignment = skill_domain.TopicAssignment(
            'topic1', 'name1', 2, 1)
        # Skill id 'exp1' is assigned to topic2.
        unused_topic_assignment = skill_domain.TopicAssignment(
            'topic2', 'name1', 2, 1)


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
        self.translation_contribution_model_with_invalid_topic.update_timestamps() # pylint: disable=line-too-long
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
        self.translation_suggestion_accepted_with_edits_model.update_timestamps() # pylint: disable=line-too-long
        self.translation_suggestion_accepted_model.update_timestamps()
        self.translation_suggestion_in_review_model.update_timestamps()
        self.translation_suggestion_in_review_model_user3.update_timestamps()
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()
        self.topic_model_3.update_timestamps()
        self.topic_model_4.update_timestamps()
        self.exp_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.exp_3.update_timestamps()
        self.exp_4.update_timestamps()
        self.story_1.update_timestamps()
        self.story_2.update_timestamps()
        self.story_3.update_timestamps()
        self.story_4.update_timestamps()
        self.exp_context_1.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.exp_context_3.update_timestamps()
        self.exp_context_4.update_timestamps()

        self.put_multi([
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
            self.topic_model_1,
            self.topic_model_2,
            self.topic_model_3,
            self.topic_model_4,
            self.exp_1,
            self.exp_2,
            self.exp_3,
            self.exp_4,
            self.story_1,
            self.story_2,
            self.story_3,
            self.story_4,
            self.exp_context_1,
            self.exp_context_2,
            self.exp_context_3,
            self.exp_context_4
        ])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Translation Reviewer Models SUCCESS: 3'),
            job_run_result.JobRunResult(
                stdout='Translation Submitter Models SUCCESS: 3'),
            job_run_result.JobRunResult(
                stdout='Question Submitter Models SUCCESS: 3'),
            job_run_result.JobRunResult(
                stdout='Question Reviewer Models SUCCESS: 3')
        ])

        # Check for TranslationSubmitterTotalContributionStatsModel.
        translation_submitter_all_models = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get_all()
        )
        self.assertEqual(3, translation_submitter_all_models.count())

        translation_submitter_total_stats = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get('hi', 'user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_submitter_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2', 'topic3'],
            translation_submitter_total_stats
            .topic_ids_with_translation_submissions
        )
        self.assertEqual(
            ['accepted', 'accepted_with_edits', 'rejected'],
            translation_submitter_total_stats.recent_review_outcomes
        )
        self.assertEqual(
            0,
            translation_submitter_total_stats.recent_performance
        )
        self.assertEqual(
            66.67,
            translation_submitter_total_stats.overall_accuracy
        )
        self.assertEqual(
            3,
            translation_submitter_total_stats.submitted_translations_count
        )
        self.assertEqual(
            300,
            translation_submitter_total_stats.submitted_translation_word_count
        )
        self.assertEqual(
            2,
            translation_submitter_total_stats.accepted_translations_count
        )
        self.assertEqual(
            1,
            translation_submitter_total_stats
            .accepted_translations_without_reviewer_edits_count
        )
        self.assertEqual(
            150,
            translation_submitter_total_stats.accepted_translation_word_count
        )
        self.assertEqual(
            1,
            translation_submitter_total_stats.rejected_translations_count
        )
        self.assertEqual(
            15,
            translation_submitter_total_stats.rejected_translation_word_count
        )
        self.assertEqual(
            datetime.date(2022, 5, 2),
            translation_submitter_total_stats.first_contribution_date
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            translation_submitter_total_stats.last_contribution_date
        )

        # Check for TranslationReviewerTotalContributionStatsModel.
        translation_reviewer_all_models = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get_all()
        )
        self.assertEqual(3, translation_reviewer_all_models.count())

        translation_reviewer_total_stats = (
            suggestion_models.TranslationReviewerTotalContributionStatsModel
            .get('es', 'user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_reviewer_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            translation_reviewer_total_stats
            .topic_ids_with_translation_reviews
        )
        self.assertEqual(
            40,
            translation_reviewer_total_stats.reviewed_translations_count
        )
        self.assertEqual(
            30,
            translation_reviewer_total_stats.accepted_translations_count
        )
        self.assertEqual(
            20,
            translation_reviewer_total_stats
            .accepted_translations_with_reviewer_edits_count
        )
        self.assertEqual(
            100,
            translation_reviewer_total_stats.accepted_translation_word_count
        )
        self.assertEqual(
            10,
            translation_reviewer_total_stats.rejected_translations_count
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            translation_reviewer_total_stats.first_contribution_date
        )
        self.assertEqual(
            datetime.date(2023, 5, 2),
            translation_reviewer_total_stats.last_contribution_date
        )

        # Check for QuestionSubmitterTotalContributionStatsModel.
        question_submitter_all_models = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_all()
        )
        self.assertEqual(3, question_submitter_all_models.count())

        question_submitter_total_stats = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get('user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_submitter_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            question_submitter_total_stats
            .topic_ids_with_question_submissions
        )
        self.assertEqual(
            ['accepted', 'accepted_with_edits', 'rejected'],
            question_submitter_total_stats.recent_review_outcomes
        )
        self.assertEqual(
            0,
            question_submitter_total_stats.recent_performance
        )
        self.assertEqual(
            50,
            question_submitter_total_stats.overall_accuracy
        )
        self.assertEqual(
            20,
            question_submitter_total_stats.submitted_questions_count
        )
        self.assertEqual(
            10,
            question_submitter_total_stats.accepted_questions_count
        )
        self.assertEqual(
            6,
            question_submitter_total_stats
            .accepted_questions_without_reviewer_edits_count
        )
        self.assertEqual(
            1,
            question_submitter_total_stats.rejected_questions_count
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            question_submitter_total_stats.first_contribution_date
        )
        self.assertEqual(
            datetime.date(2023, 5, 2),
            question_submitter_total_stats.last_contribution_date
        )

        # Check for QuestionReviewerTotalContributionStatsModel.
        question_reviewer_all_models = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get_all()
        )
        self.assertEqual(3, question_reviewer_all_models.count())

        question_reviewer_total_stats = (
            suggestion_models.QuestionReviewerTotalContributionStatsModel
            .get('user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_reviewer_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            question_reviewer_total_stats
            .topic_ids_with_question_reviews
        )
        self.assertEqual(
            20,
            question_reviewer_total_stats.reviewed_questions_count
        )
        self.assertEqual(
            10,
            question_reviewer_total_stats.accepted_questions_count
        )
        self.assertEqual(
            6,
            question_reviewer_total_stats
            .accepted_questions_with_reviewer_edits_count
        )
        self.assertEqual(
            10,
            question_reviewer_total_stats.rejected_questions_count
        )
        self.assertEqual(
            datetime.date(2023, 4, 2),
            question_reviewer_total_stats.first_contribution_date
        )
        self.assertEqual(
            datetime.date(2023, 5, 2),
            question_reviewer_total_stats.last_contribution_date
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
                edited_by_reviewer=True).put()
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
                edited_by_reviewer=True).put()
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
                edited_by_reviewer=False).put()
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
                edited_by_reviewer=False).put()

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
                edited_by_reviewer=True).put()
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
                edited_by_reviewer=True).put()
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
                edited_by_reviewer=False).put()
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
                edited_by_reviewer=False).put()

        self.topic_model_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.story_2.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.put_multi([
            self.topic_model_1,
            self.exp_2,
            self.story_2,
            self.exp_context_2])
        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_1.put()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_1.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Question Submitter Models SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='Translation Submitter Models SUCCESS: 1')
        ])

        translation_model = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get('hi', 'user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_model is not None

        self.assertEqual(100, len(translation_model.recent_review_outcomes))

        question_model = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get('user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_model is not None

        self.assertEqual(100, len(question_model.recent_review_outcomes))

    def test_job_does_not_creates_stats_if_contribution_stats_model_does_not_exist_for_a_question_suggestion(self) -> None: # pylint: disable=line-too-long
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_2.update_timestamps()
        self.question_contribution_model_5.update_timestamps()
        self.question_suggestion_rejected_model.update_timestamps()
        self.question_suggestion_accepted_with_edits_model.update_timestamps()
        self.question_suggestion_accepted_model.update_timestamps()
        self.question_suggestion_accepted_model_with_incomplete_contribution_stats.update_timestamps() # pylint: disable=line-too-long
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()

        self.put_multi([
            self.question_contribution_model_1,
            self.question_contribution_model_2,
            self.question_contribution_model_5,
            self.question_suggestion_rejected_model,
            self.question_suggestion_accepted_with_edits_model,
            self.question_suggestion_accepted_model,
            self.question_suggestion_accepted_model_with_incomplete_contribution_stats, # pylint: disable=line-too-long
            self.topic_model_1,
            self.topic_model_2,
        ])

        # The model is only created for user1, and not for user4. The job also
        # prints the debugging logs for user4.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Question Submitter Models SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout=(
                    'Question submitter ID: user4.\nUnique skill IDs '
                    'with question suggestion: \n- exp1\n-- Topic ID: topic1\n'
                    '-- Topic ID: topic2\nUnique topic IDs with contribution '
                    'stats: \n- topic1\nUnique valid topic IDs with '
                    'contribution stats: \n- topic1\n'))
        ])

        # Check for QuestionSubmitterTotalContributionStatsModel.
        question_submitter_all_models = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get_all()
        )
        self.assertEqual(1, question_submitter_all_models.count())

        question_submitter_total_stats = (
            suggestion_models.QuestionSubmitterTotalContributionStatsModel
            .get('user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert question_submitter_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2'],
            question_submitter_total_stats
            .topic_ids_with_question_submissions
        )
        self.assertEqual(
            ['accepted', 'accepted_with_edits', 'rejected'],
            question_submitter_total_stats.recent_review_outcomes
        )

    def test_job_does_not_creates_stats_if_contribution_stats_model_does_not_exist_for_a_translation_suggestion(self) -> None: # pylint: disable=line-too-long
        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_2.update_timestamps()
        self.translation_contribution_model_4.update_timestamps()
        self.translation_contribution_model_6.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.translation_suggestion_accepted_with_edits_model.update_timestamps() # pylint: disable=line-too-long
        self.translation_suggestion_accepted_model.update_timestamps()
        self.translation_suggestion_in_review_model_user4.update_timestamps()
        self.transaltion_suggestion_accepted_model_with_incomplete_contribution_stats.update_timestamps() # pylint: disable=line-too-long
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()
        self.topic_model_3.update_timestamps()
        self.exp_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.exp_3.update_timestamps()
        self.story_1.update_timestamps()
        self.story_2.update_timestamps()
        self.story_3.update_timestamps()
        self.exp_context_1.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.exp_context_3.update_timestamps()

        self.put_multi([
            self.translation_contribution_model_1,
            self.translation_contribution_model_2,
            self.translation_contribution_model_4,
            self.translation_contribution_model_6,
            self.translation_suggestion_rejected_model_user1,
            self.translation_suggestion_accepted_with_edits_model,
            self.translation_suggestion_accepted_model,
            self.translation_suggestion_in_review_model_user4,
            self.transaltion_suggestion_accepted_model_with_incomplete_contribution_stats, # pylint: disable=line-too-long
            self.topic_model_1,
            self.topic_model_2,
            self.topic_model_3,
            self.exp_1,
            self.exp_2,
            self.exp_3,
            self.story_1,
            self.story_2,
            self.story_3,
            self.exp_context_1,
            self.exp_context_2,
            self.exp_context_3,
        ])

        # The model is only created for user1, and not for user4. The job also
        # prints the debugging logs for user4.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Translation Submitter Models SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout=(
                    'Translation submitter ID: user4, Language code: hi\n'
                    'Unique exp IDs with translation suggestion: \n- exp1\n-- '
                    'Story ID: story1\n---- Topic ID: topic1\n- exp2\n-- '
                    'Story ID: story2\n---- Topic ID: topic2\nUnique topic '
                    'IDs with contribution stats: \n- topic2\nUnique valid '
                    'topic IDs with contribution stats: \n- topic2\n'))
        ])

        # Check for TranslationSubmitterTotalContributionStatsModel.
        translation_submitter_all_models = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get_all()
        )
        self.assertEqual(1, translation_submitter_all_models.count())

        translation_submitter_total_stats = (
            suggestion_models.TranslationSubmitterTotalContributionStatsModel
            .get('hi', 'user1')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation_submitter_total_stats is not None
        self.assertItemsEqual(
            ['topic1', 'topic2', 'topic3'],
            translation_submitter_total_stats
            .topic_ids_with_translation_submissions
        )
        self.assertEqual(
            ['accepted', 'accepted_with_edits', 'rejected'],
            translation_submitter_total_stats.recent_review_outcomes
        )


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
        self.translation_suggestion_accepted_with_edits_model.update_timestamps() # pylint: disable=line-too-long
        self.translation_suggestion_accepted_model.update_timestamps()
        self.translation_suggestion_in_review_model_user3.update_timestamps()
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()
        self.topic_model_3.update_timestamps()
        self.topic_model_4.update_timestamps()
        self.exp_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.exp_3.update_timestamps()
        self.exp_4.update_timestamps()
        self.story_1.update_timestamps()
        self.story_2.update_timestamps()
        self.story_3.update_timestamps()
        self.story_4.update_timestamps()
        self.exp_context_1.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.exp_context_3.update_timestamps()
        self.exp_context_4.update_timestamps()

        self.put_multi([
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
            self.topic_model_1,
            self.topic_model_2,
            self.topic_model_3,
            self.topic_model_4,
            self.exp_1,
            self.exp_2,
            self.exp_3,
            self.exp_4,
            self.story_1,
            self.story_2,
            self.story_3,
            self.story_4,
            self.exp_context_1,
            self.exp_context_2,
            self.exp_context_3,
            self.exp_context_4
        ])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Translation Reviewer Models SUCCESS: 3'),
            job_run_result.JobRunResult(
                stdout='Translation Submitter Models SUCCESS: 3'),
            job_run_result.JobRunResult(
                stdout='Question Submitter Models SUCCESS: 3'),
            job_run_result.JobRunResult(
                stdout='Question Reviewer Models SUCCESS: 3')
        ])

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
            edited_by_reviewer=True).put()

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
            edited_by_reviewer=True).put()

        self.topic_model_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.story_2.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.put_multi([
            self.topic_model_1,
            self.exp_2,
            self.story_2,
            self.exp_context_2])
        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_1.put()
        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_1.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Translation Submitter Models SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='Question Submitter Models SUCCESS: 1')
        ])

    def test_job_does_not_audits_stats_if_contribution_stats_model_does_not_exist_for_a_suggestion(self) -> None: # pylint: disable=line-too-long

        self.question_contribution_model_1.update_timestamps()
        self.question_contribution_model_2.update_timestamps()
        self.question_contribution_model_5.update_timestamps()
        self.question_suggestion_rejected_model.update_timestamps()
        self.question_suggestion_accepted_with_edits_model.update_timestamps()
        self.question_suggestion_accepted_model.update_timestamps()
        self.question_suggestion_accepted_model_with_incomplete_contribution_stats.update_timestamps() # pylint: disable=line-too-long
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()

        self.put_multi([
            self.question_contribution_model_1,
            self.question_contribution_model_2,
            self.question_contribution_model_5,
            self.question_suggestion_rejected_model,
            self.question_suggestion_accepted_with_edits_model,
            self.question_suggestion_accepted_model,
            self.question_suggestion_accepted_model_with_incomplete_contribution_stats, # pylint: disable=line-too-long
            self.topic_model_1,
            self.topic_model_2,
        ])

        # The model is only created for user1, and not for user4. The job also
        # prints the debugging logs for user4.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Question Submitter Models SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout=(
                    'Question submitter ID: user4.\nUnique skill IDs '
                    'with question suggestion: \n- exp1\n-- Topic ID: topic1\n'
                    '-- Topic ID: topic2\nUnique topic IDs with contribution '
                    'stats: \n- topic1\nUnique valid topic IDs with '
                    'contribution stats: \n- topic1\n'))
        ])

    def test_job_does_not_audits_stats_if_contribution_stats_model_does_not_exist_for_a_translation_suggestion(self) -> None: # pylint: disable=line-too-long
        self.translation_contribution_model_1.update_timestamps()
        self.translation_contribution_model_2.update_timestamps()
        self.translation_contribution_model_4.update_timestamps()
        self.translation_contribution_model_6.update_timestamps()
        self.translation_suggestion_rejected_model_user1.update_timestamps()
        self.translation_suggestion_accepted_with_edits_model.update_timestamps() # pylint: disable=line-too-long
        self.translation_suggestion_accepted_model.update_timestamps()
        self.translation_suggestion_in_review_model_user4.update_timestamps()
        self.transaltion_suggestion_accepted_model_with_incomplete_contribution_stats.update_timestamps() # pylint: disable=line-too-long
        self.topic_model_1.update_timestamps()
        self.topic_model_2.update_timestamps()
        self.topic_model_3.update_timestamps()
        self.exp_1.update_timestamps()
        self.exp_2.update_timestamps()
        self.exp_3.update_timestamps()
        self.story_1.update_timestamps()
        self.story_2.update_timestamps()
        self.story_3.update_timestamps()
        self.exp_context_1.update_timestamps()
        self.exp_context_2.update_timestamps()
        self.exp_context_3.update_timestamps()

        self.put_multi([
            self.translation_contribution_model_1,
            self.translation_contribution_model_2,
            self.translation_contribution_model_4,
            self.translation_contribution_model_6,
            self.translation_suggestion_rejected_model_user1,
            self.translation_suggestion_accepted_with_edits_model,
            self.translation_suggestion_accepted_model,
            self.translation_suggestion_in_review_model_user4,
            self.transaltion_suggestion_accepted_model_with_incomplete_contribution_stats, # pylint: disable=line-too-long
            self.topic_model_1,
            self.topic_model_2,
            self.topic_model_3,
            self.exp_1,
            self.exp_2,
            self.exp_3,
            self.story_1,
            self.story_2,
            self.story_3,
            self.exp_context_1,
            self.exp_context_2,
            self.exp_context_3,
        ])

        # The model is only created for user1, and not for user4. The job also
        # prints the debugging logs for user4.
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Translation Submitter Models SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout=(
                    'Translation submitter ID: user4, Language code: hi\n'
                    'Unique exp IDs with translation suggestion: \n- exp1\n-- '
                    'Story ID: story1\n---- Topic ID: topic1\n- exp2\n-- '
                    'Story ID: story2\n---- Topic ID: topic2\nUnique topic '
                    'IDs with contribution stats: \n- topic2\nUnique valid '
                    'topic IDs with contribution stats: \n- topic2\n'))
        ])
