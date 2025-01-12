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

"""Unit tests for jobs.batch_jobs.suggestion_stats_computation_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import question_domain
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import suggestion_stats_computation_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict, Final, List, Tuple, Type, Union

MYPY = False
if MYPY:
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(opportunity_models, suggestion_models) = models.Registry.import_models([
    models.Names.OPPORTUNITY, models.Names.SUGGESTION
])

StatsType = List[Tuple[str, Dict[str, Union[bool, int, str]]]]


class GenerateContributionStatsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        suggestion_stats_computation_jobs
        .GenerateContributionStatsJob
    ] = (
        suggestion_stats_computation_jobs
        .GenerateContributionStatsJob
    )

    VALID_USER_ID_1: Final = 'uid_%s' % (
        'a' * feconf.USER_ID_RANDOM_PART_LENGTH
    )
    VALID_USER_ID_2: Final = 'uid_%s' % (
        'b' * feconf.USER_ID_RANDOM_PART_LENGTH
    )
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'
    TOPIC_1_ID: Final = 'topic_1_id'
    TOPIC_2_ID: Final = 'topic_2_id'
    LANG_1: Final = 'lang_1'
    LANG_2: Final = 'lang_2'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_creates_stats_model_from_one_in_review_suggestion(self) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'html'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1
            )
            suggestion_model.update_timestamps()
            suggestion_model.put()
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 3)
        self.assertEqual(translation_stats_model.accepted_translations_count, 0)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 0)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [suggestion_model.created_on.date()]
        )

    def test_reports_failure_on_broken_model(self) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion_id',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': 111,
                'translation_html': 111,
                'data_format': 'html'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'ERROR: "suggestion_id: argument cannot be of \'int\' '
                    'type, must be of text type": 1'
                )
            )
        ])

    def test_creates_stats_model_from_one_suggestion_in_legacy_format(
        self
    ) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.DEPRECATED_CMD_ADD_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 a',
                    'translation_html': '111 a'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1
            )
            suggestion_model.update_timestamps()
            suggestion_model.put()
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 2)
        self.assertEqual(translation_stats_model.accepted_translations_count, 0)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 0)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [suggestion_model.created_on.date()]
        )

    def test_creates_stats_model_from_one_suggestion_in_set_format(
        self
    ) -> None:
         # Define a fixed datetime.
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': ['111 a', '222 b', '333 c'],
                    'translation_html': ['111 a', '222 b', '333 c'],
                    'data_format': 'set_of_normalized_string'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1
            )
            suggestion_model.update_timestamps()
            suggestion_model.put()
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 6)
        self.assertEqual(translation_stats_model.accepted_translations_count, 0)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 0)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [suggestion_model.created_on.date()]
        )

    def test_creates_stats_model_from_one_in_review_suggestion_with_opportunity(
        self
    ) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'html'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1
            )
            suggestion_model.update_timestamps()
            suggestion_model.put()
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 3)
        self.assertEqual(translation_stats_model.accepted_translations_count, 0)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 0)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [suggestion_model.created_on.date()]
        )

    def test_creates_translation_stats_models_from_one_accepted_suggestion(
        self
    ) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'unicode'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_ACCEPTED,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                final_reviewer_id='reviewer1'
            )
            suggestion_model.update_timestamps()
            suggestion_model.put()
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, 'reviewer1', self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        assert translation_review_stats_model is not None

        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 3)
        self.assertEqual(translation_stats_model.accepted_translations_count, 1)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            1
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 3)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [suggestion_model.created_on.date()]
        )

        self.assertEqual(
            translation_review_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_review_stats_model.reviewer_user_id, 'reviewer1')
        self.assertEqual(
            translation_review_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_review_stats_model.reviewed_translations_count, 1)
        self.assertEqual(
            translation_review_stats_model.reviewed_translation_word_count, 3)
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count, 1)
        self.assertEqual(
            translation_review_stats_model
            .accepted_translations_with_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translation_word_count, 3)
        self.assertEqual(
            translation_review_stats_model.first_contribution_date,
            mocked_now.date()
        )
        self.assertEqual(
            translation_review_stats_model.last_contribution_date,
            mocked_now.date()
        )

    def test_escapes_stats_without_opportunity(
        self
    ) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id='reviewer1'
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()

        self.assert_job_output_is([])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, 'reviewer1', ''))

        assert translation_stats_model is None
        assert translation_review_stats_model is None

    def test_creates_translation_stats_models_from_two_accepted_suggestions(
        self
    ) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            first_suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'unicode'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_ACCEPTED,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                final_reviewer_id=None
            )
            first_suggestion_model.update_timestamps()
            first_suggestion_model.put()
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()

            second_suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'unicode'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_ACCEPTED,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                final_reviewer_id=None
            )
            second_suggestion_model.update_timestamps()
            second_suggestion_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, feconf.SUGGESTION_BOT_USER_ID, self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        assert translation_review_stats_model is not None

        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 2)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 6)
        self.assertEqual(translation_stats_model.accepted_translations_count, 2)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            2
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 6)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [first_suggestion_model.created_on.date()]
        )

        self.assertEqual(
            translation_review_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_review_stats_model.reviewer_user_id,
            feconf.SUGGESTION_BOT_USER_ID)
        self.assertEqual(
            translation_review_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_review_stats_model.reviewed_translations_count, 2)
        self.assertEqual(
            translation_review_stats_model.reviewed_translation_word_count, 6)
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count, 2)
        self.assertEqual(
            translation_review_stats_model
            .accepted_translations_with_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translation_word_count, 6)
        self.assertEqual(
            translation_review_stats_model.first_contribution_date,
            mocked_now.date()
        )
        self.assertEqual(
            translation_review_stats_model.last_contribution_date,
            mocked_now.date()
        )

    def test_creates_multiple_stats_models_from_multiple_users(
        self
    ) -> None:
        # Define a fixed datetime.
        mocked_now = datetime.datetime(2024, 10, 28)

        with self.mock_datetime_utcnow(mocked_now):
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()
            first_suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'unicode'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_ACCEPTED,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                final_reviewer_id='reviewer1'
            )
            first_suggestion_model.update_timestamps()
            first_suggestion_model.put()

            second_suggestion_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_2,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'unicode'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_ACCEPTED,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                final_reviewer_id='reviewer1'
            )
            second_suggestion_model.update_timestamps()
            second_suggestion_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        first_translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))
        second_translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_2, self.TOPIC_1_ID))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, 'reviewer1', self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert first_translation_stats_model is not None
        assert second_translation_stats_model is not None
        assert translation_review_stats_model is not None

        self.assertEqual(
            first_translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            first_translation_stats_model.contributor_user_id,
            self.VALID_USER_ID_1
        )
        self.assertEqual(
            first_translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            first_translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            first_translation_stats_model.submitted_translation_word_count, 3)
        self.assertEqual(
            first_translation_stats_model.accepted_translations_count, 1)
        self.assertEqual(
            first_translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            1
        )
        self.assertEqual(
            first_translation_stats_model.accepted_translation_word_count, 3)
        self.assertEqual(
            first_translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            first_translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            first_translation_stats_model.contribution_dates,
            [first_suggestion_model.created_on.date()]
        )

        self.assertEqual(
            second_translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            second_translation_stats_model.contributor_user_id,
            self.VALID_USER_ID_2
        )
        self.assertEqual(
            second_translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            second_translation_stats_model.submitted_translations_count, 1)
        self.assertEqual(
            second_translation_stats_model.submitted_translation_word_count, 3)
        self.assertEqual(
            second_translation_stats_model.accepted_translations_count, 1)
        self.assertEqual(
            second_translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            1
        )
        self.assertEqual(
            second_translation_stats_model.accepted_translation_word_count, 3)
        self.assertEqual(
            second_translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            second_translation_stats_model.rejected_translation_word_count, 0)
        self.assertItemsEqual(
            second_translation_stats_model.contribution_dates,
            [second_suggestion_model.created_on.date()]
        )

        self.assertEqual(
            translation_review_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_review_stats_model.reviewer_user_id, 'reviewer1')
        self.assertEqual(
            translation_review_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_review_stats_model.reviewed_translations_count, 2)
        self.assertEqual(
            translation_review_stats_model.reviewed_translation_word_count, 6)
        self.assertEqual(
            translation_review_stats_model.accepted_translations_count, 2)
        self.assertEqual(
            translation_review_stats_model
            .accepted_translations_with_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_review_stats_model.accepted_translation_word_count, 6)
        self.assertEqual(
            translation_review_stats_model.first_contribution_date,
            mocked_now.date()
        )
        self.assertEqual(
            translation_review_stats_model.last_contribution_date,
            mocked_now.date()
        )

    def _create_valid_question_data(
        self,
        default_dest_state_name: str,
        content_id_generator: translation_domain.ContentIdGenerator
    ) -> state_domain.State:
        """Creates a valid question_data dict.

        Args:
            default_dest_state_name: str. The default destination state.
            content_id_generator: ContentIdGenerator. A ContentIdGenerator
                object to be used for generating new content Id.

        Returns:
            dict. The default question_data dict.
        """
        state = state_domain.State.create_default_state(
            default_dest_state_name,
            content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            content_id_generator.generate(
                translation_domain.ContentType.DEFAULT_OUTCOME),
            is_initial_state=True)
        state.update_interaction_id('TextInput')
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': content_id_generator.generate(
                    translation_domain.ContentType.SOLUTION),
                'html': '<p>This is a solution.</p>',
            },
        }
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.HINT),
                    '<p>This is a hint.</p>')),
        ]
        # Ruling out the possibility of None for mypy type checking, because
        # we above we are already updating the value of interaction_id.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, solution_dict)
        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': content_id_generator.generate(
                        translation_domain.ContentType.CUSTOMIZATION_ARG,
                        extra_prefix='placeholder'),
                    'unicode_str': 'Enter text here',
                },
            },
            'rows': {'value': 1},
            'catchMisspellings': {'value': False}
        })
        # Here, state is a State domain object and it is created using
        # 'create_default_state' method. So, 'state' is a default_state
        # and it is always going to contain a default_outcome. Thus to
        # narrow down the type from Optional[Outcome] to Outcome for
        # default_outcome, we used assert here.
        assert state.interaction.default_outcome is not None
        state.interaction.default_outcome.labelled_as_correct = True
        state.interaction.default_outcome.dest = None
        return state

    def _create_question(self) -> str:
        """Creates a question.

        Returns:
            str. A topic ID.
        """
        skill_id = skill_services.get_new_skill_id()
        skill = (
            skill_domain.Skill.create_default_skill(
                skill_id, 'description', []))
        skill.rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3']),
        ]
        skill_services.save_new_skill('owner_id', skill)

        topic_id = topic_fetchers.get_new_topic_id()
        canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id1'
            )
        ]
        additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id2'
            )
        ]
        uncategorized_skill_ids = [skill_id]
        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [skill_id],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })
        subtopics = [subtopic]
        skill_ids_for_diagnostic_test = [skill_id]

        topic = topic_domain.Topic(
            topic_id, 'Topic1', 'topic-three', 'topic-three', None,
            None, None, 'description',
            canonical_story_references, additional_story_references,
            uncategorized_skill_ids, subtopics,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, 2,
            'en', 0, feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            'topic meta tag content', False,
            'topic page title', skill_ids_for_diagnostic_test)
        topic_services.save_new_topic('topic_admin', topic)

        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [skill_id],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })

        content_id_generator = translation_domain.ContentIdGenerator()
        state = self._create_valid_question_data(
            'default_state', content_id_generator)
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': state.to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': [skill_id],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion_1_id = 'skill1.thread1'
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            skill_id, 1,
            suggestion_models.STATUS_ACCEPTED, 'author_1',
            None, suggestion_change, 'category1',
            suggestion_1_id, 'en')

        return topic_id

    def test_creates_question_stats_models_from_one_accepted_suggestion(
        self
    ) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            topic_id = self._create_question()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED QUESTION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED QUESTION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        question_stats_models = (
            suggestion_models.QuestionContributionStatsModel.get_all_by_user_id(
                'author_1'))
        question_review_stats_models = (
            suggestion_models.QuestionReviewStatsModel.get_all_by_user_id(
                feconf.SUGGESTION_BOT_USER_ID))

        self.assertEqual(
            len(question_stats_models), 1
        )
        self.assertEqual(
            len(question_review_stats_models), 1
        )

        question_stats_model = question_stats_models[0]
        question_review_stats_model = question_review_stats_models[0]

        # Ruling out the possibility of None for mypy type checking.
        assert question_stats_model is not None
        assert question_review_stats_model is not None

        self.assertEqual(
            question_stats_model.contributor_user_id, 'author_1')
        self.assertEqual(question_stats_model.topic_id, topic_id)
        self.assertEqual(
            question_stats_model.submitted_questions_count, 1)
        self.assertEqual(question_stats_model.accepted_questions_count, 1)
        self.assertEqual(
            question_stats_model
            .accepted_questions_without_reviewer_edits_count,
            1
        )
        self.assertEqual(
            question_stats_model.first_contribution_date,
            mocked_now.date()
        )
        self.assertEqual(
            question_stats_model.last_contribution_date,
            mocked_now.date()
        )

        self.assertEqual(
            question_review_stats_model.reviewer_user_id,
            feconf.SUGGESTION_BOT_USER_ID
        )
        self.assertEqual(question_review_stats_model.topic_id, topic_id)
        self.assertEqual(
            question_review_stats_model.reviewed_questions_count, 1)
        self.assertEqual(
            question_review_stats_model.accepted_questions_count, 1)
        self.assertEqual(
            question_review_stats_model
            .accepted_questions_with_reviewer_edits_count,
            0
        )
        self.assertEqual(
            question_review_stats_model.first_contribution_date,
            mocked_now.date()
        )
        self.assertEqual(
            question_review_stats_model.last_contribution_date,
            mocked_now.date()
        )

    def test_creates_stats_model_from_multiple_suggestions(self) -> None:
        mocked_now = datetime.datetime(2025, 1, 7)
        with self.mock_datetime_utcnow(mocked_now):
            opportunity_model = self.create_model(
                opportunity_models.ExplorationOpportunitySummaryModel,
                id=self.EXP_1_ID,
                topic_id=self.TOPIC_1_ID,
                chapter_title='irelevant',
                content_count=1,
                story_id='irelevant',
                story_title='irelevant',
                topic_name='irelevant'
            )
            opportunity_model.update_timestamps()
            opportunity_model.put()
            suggestion_1_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': '111 222 333',
                    'translation_html': '111 222 333',
                    'data_format': 'html'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                created_on=mocked_now
            )
            suggestion_1_model.update_timestamps()
            suggestion_2_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': ['111', '222', '333', '444', '555'],
                    'translation_html': ['111', '222', '333', '444', '555'],
                    'data_format': 'set_of_unicode_string'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                created_on=mocked_now - datetime.timedelta(days=2)
            )
            suggestion_2_model.update_timestamps()
            suggestion_3_model = self.create_model(
                suggestion_models.GeneralSuggestionModel,
                suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                author_id=self.VALID_USER_ID_1,
                change_cmd={
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'state',
                    'content_id': 'content_id',
                    'language_code': 'lang',
                    'content_html': ['111', '222', '333', '444', '555'],
                    'translation_html': ['111', '222', '333', '444', '555'],
                    'data_format': 'set_of_unicode_string'
                },
                score_category='irelevant',
                status=suggestion_models.STATUS_IN_REVIEW,
                target_type='exploration',
                target_id=self.EXP_1_ID,
                target_version_at_submission=0,
                language_code=self.LANG_1,
                created_on=mocked_now - datetime.timedelta(days=1)
            )
            suggestion_3_model.update_timestamps()
            suggestion_models.GeneralSuggestionModel.put_multi([
                suggestion_1_model, suggestion_2_model, suggestion_3_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, self.TOPIC_1_ID)
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 3)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 13)
        self.assertEqual(translation_stats_model.accepted_translations_count, 0)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            0
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 0)
        self.assertEqual(translation_stats_model.rejected_translations_count, 0)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 0)
        # We are checking whether contribution_dates are added in ascending
        # order.
        self.assertListEqual(
            translation_stats_model.contribution_dates,
            [
                suggestion_2_model.created_on.date(),
                suggestion_3_model.created_on.date(),
                suggestion_1_model.created_on.date()
            ]
        )


class AuditGenerateContributionStatsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        suggestion_stats_computation_jobs
        .AuditGenerateContributionStatsJob
    ] = (
        suggestion_stats_computation_jobs
        .AuditGenerateContributionStatsJob
    )

    VALID_USER_ID_1: Final = 'uid_%s' % (
        'a' * feconf.USER_ID_RANDOM_PART_LENGTH
    )
    VALID_USER_ID_2: Final = 'uid_%s' % (
        'b' * feconf.USER_ID_RANDOM_PART_LENGTH
    )
    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'
    TOPIC_1_ID: Final = 'topic_1_id'
    TOPIC_2_ID: Final = 'topic_2_id'
    LANG_1: Final = 'lang_1'
    LANG_2: Final = 'lang_2'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_creates_stats_model_from_one_in_review_suggestion(self) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'html'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)

    def test_reports_failure_on_broken_model(self) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='suggestion_id',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': 111,
                'translation_html': 111,
                'data_format': 'html'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'ERROR: "suggestion_id: argument cannot be of \'int\' '
                    'type, must be of text type": 1'
                )
            )
        ])

    def test_creates_stats_model_from_one_suggestion_in_legacy_format(
        self
    ) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.DEPRECATED_CMD_ADD_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 a',
                'translation_html': '111 a'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)

    def test_creates_stats_model_from_one_suggestion_in_set_format(
        self
    ) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': ['111 a', '222 b', '333 c'],
                'translation_html': ['111 a', '222 b', '333 c'],
                'data_format': 'set_of_normalized_string'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)

    def test_creates_stats_model_from_one_in_review_suggestion_with_opportunity(
        self
    ) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'html'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)

    def test_creates_translation_stats_models_from_one_accepted_suggestion(
        self
    ) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id='reviewer1'
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, 'reviewer1', self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)
        self.assertIsNone(translation_review_stats_model)

    def test_escapes_stats_without_opportunity(
        self
    ) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id='reviewer1'
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()

        self.assert_job_output_is([])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, 'reviewer1', ''))

        assert translation_stats_model is None
        assert translation_review_stats_model is None

    def test_creates_translation_stats_models_from_two_accepted_suggestions(
        self
    ) -> None:
        first_suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id=None
        )
        first_suggestion_model.update_timestamps()
        first_suggestion_model.put()
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()

        second_suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id=None
        )
        second_suggestion_model.update_timestamps()
        second_suggestion_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, feconf.SUGGESTION_BOT_USER_ID, self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)
        self.assertIsNone(translation_review_stats_model)

    def test_creates_multiple_stats_models_from_multiple_users(
        self
    ) -> None:
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()
        first_suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id='reviewer1'
        )
        first_suggestion_model.update_timestamps()
        first_suggestion_model.put()

        second_suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_2,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'unicode'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            final_reviewer_id='reviewer1'
        )
        second_suggestion_model.update_timestamps()
        second_suggestion_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 2'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        first_translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))
        second_translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_2, self.TOPIC_1_ID))
        translation_review_stats_model = (
            suggestion_models.TranslationReviewStatsModel.get(
                self.LANG_1, 'reviewer1', self.TOPIC_1_ID))

        self.assertIsNone(first_translation_stats_model)
        self.assertIsNone(second_translation_stats_model)
        self.assertIsNone(translation_review_stats_model)

    def _create_valid_question_data(
        self,
        default_dest_state_name: str,
        content_id_generator: translation_domain.ContentIdGenerator
    ) -> state_domain.State:
        """Creates a valid question_data dict.

        Args:
            default_dest_state_name: str. The default destination state.
            content_id_generator: ContentIdGenerator. A ContentIdGenerator
                object to be used for generating new content Id.

        Returns:
            dict. The default question_data dict.
        """
        state = state_domain.State.create_default_state(
            default_dest_state_name,
            content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            content_id_generator.generate(
                translation_domain.ContentType.DEFAULT_OUTCOME),
            is_initial_state=True)
        state.update_interaction_id('TextInput')
        solution_dict: state_domain.SolutionDict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': content_id_generator.generate(
                    translation_domain.ContentType.SOLUTION),
                'html': '<p>This is a solution.</p>',
            },
        }
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.HINT),
                    '<p>This is a hint.</p>')),
        ]
        # Ruling out the possibility of None for mypy type checking, because
        # we above we are already updating the value of interaction_id.
        assert state.interaction.id is not None
        solution = state_domain.Solution.from_dict(
            state.interaction.id, solution_dict)
        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': content_id_generator.generate(
                        translation_domain.ContentType.CUSTOMIZATION_ARG,
                        extra_prefix='placeholder'),
                    'unicode_str': 'Enter text here',
                },
            },
            'rows': {'value': 1},
            'catchMisspellings': {'value': False}
        })
        # Here, state is a State domain object and it is created using
        # 'create_default_state' method. So, 'state' is a default_state
        # and it is always going to contain a default_outcome. Thus to
        # narrow down the type from Optional[Outcome] to Outcome for
        # default_outcome, we used assert here.
        assert state.interaction.default_outcome is not None
        state.interaction.default_outcome.labelled_as_correct = True
        state.interaction.default_outcome.dest = None
        return state

    def _create_question(self) -> str:
        """Creates a question.

        Returns:
            str. A topic ID.
        """
        skill_id = skill_services.get_new_skill_id()
        skill = (
            skill_domain.Skill.create_default_skill(
                skill_id, 'description', []))
        skill.rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3']),
        ]
        skill_services.save_new_skill('owner_id', skill)

        topic_id = topic_fetchers.get_new_topic_id()
        canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id1'
            )
        ]
        additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(
                'story_id2'
            )
        ]
        uncategorized_skill_ids = [skill_id]
        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [skill_id],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })
        subtopics = [subtopic]
        skill_ids_for_diagnostic_test = [skill_id]

        topic = topic_domain.Topic(
            topic_id, 'Topic1', 'topic-three', 'topic-three', None,
            None, None, 'description',
            canonical_story_references, additional_story_references,
            uncategorized_skill_ids, subtopics,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, 2,
            'en', 0, feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            'topic meta tag content', False,
            'topic page title', skill_ids_for_diagnostic_test)
        topic_services.save_new_topic('topic_admin', topic)

        subtopic = topic_domain.Subtopic.from_dict({
            'id': 1,
            'title': 'subtopic1',
            'skill_ids': [skill_id],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'thumbnail_size_in_bytes': None,
            'url_fragment': 'subtopic-one'
        })

        content_id_generator = translation_domain.ContentIdGenerator()
        state = self._create_valid_question_data(
            'default_state', content_id_generator)
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': state.to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': [skill_id],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion_1_id = 'skill1.thread1'
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            skill_id, 1,
            suggestion_models.STATUS_ACCEPTED, 'author_1',
            None, suggestion_change, 'category1',
            suggestion_1_id, 'en')

        return topic_id

    def test_creates_question_stats_models_from_one_accepted_suggestion(
        self
    ) -> None:
        self._create_question()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED QUESTION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED QUESTION REVIEW STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        question_stats_models = (
            suggestion_models.QuestionContributionStatsModel.get_all_by_user_id(
                'author_1'))
        question_review_stats_models = (
            suggestion_models.QuestionReviewStatsModel.get_all_by_user_id(
                feconf.SUGGESTION_BOT_USER_ID))

        self.assertEqual(
            len(question_stats_models), 0
        )
        self.assertEqual(
            len(question_review_stats_models), 0
        )

    def test_creates_stats_model_from_multiple_suggestions(self) -> None:
        opportunity_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id=self.TOPIC_1_ID,
            chapter_title='irelevant',
            content_count=1,
            story_id='irelevant',
            story_title='irelevant',
            topic_name='irelevant'
        )
        opportunity_model.update_timestamps()
        opportunity_model.put()
        suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '111 222 333',
                'translation_html': '111 222 333',
                'data_format': 'html'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_1_model.update_timestamps()
        suggestion_2_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': ['111', '222', '333', '444', '555'],
                'translation_html': ['111', '222', '333', '444', '555'],
                'data_format': 'set_of_unicode_string'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1,
            last_updated=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        )
        suggestion_2_model.update_timestamps(update_last_updated_time=False)
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_1_model, suggestion_2_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED TRANSLATION CONTRIBUTION STATS'
                ' COUNT SUCCESS: 1'
            )
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

        self.assertIsNone(translation_stats_model)
