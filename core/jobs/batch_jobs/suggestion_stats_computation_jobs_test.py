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

from __future__ import absolute_import
from __future__ import unicode_literals

import datetime

from core import feconf
from core.domain import exp_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import suggestion_stats_computation_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(opportunity_models, suggestion_models) = models.Registry.import_models(
    [models.NAMES.opportunity, models.NAMES.suggestion])


class GenerateTranslationContributionStatsTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        suggestion_stats_computation_jobs.GenerateTranslationContributionStats)

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    TOPIC_2_ID = 'topic_2_id'
    TOPIC_1_ID = 'topic_1_id'
    TOPIC_2_ID = 'topic_2_id'
    LANG_1 = 'lang_1'
    LANG_2 = 'lang_2'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_skips_non_translate_suggestion(self) -> None:
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            author_id=self.VALID_USER_ID_1,
            change_cmd={},
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()

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
                'data_format': 'format'
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

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, '')
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
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            translation_stats_model.contribution_dates,
            [datetime.date.today()]
        )

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
                'data_format': 'format'
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
            job_run_result.JobRunResult(stdout='SUCCESS 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, self.TOPIC_1_ID))

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
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            translation_stats_model.contribution_dates,
            [datetime.date.today()]
        )

    def test_creates_stats_model_from_one_accepted_suggestion(self) -> None:
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
                'data_format': 'format'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
            target_type='exploration',
            target_id=self.EXP_1_ID,
            target_version_at_submission=0,
            language_code=self.LANG_1
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, '')
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
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            translation_stats_model.contribution_dates,
            [datetime.date.today()]
        )

    def test_creates_stats_model_from_one_multiple_suggestions(self) -> None:
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
                'data_format': 'format'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_ACCEPTED,
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
                'content_html': '111 222 333 444 555',
                'translation_html': '111 222 333 444 555',
                'data_format': 'format'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_REJECTED,
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
            job_run_result.JobRunResult(stdout='SUCCESS 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, '')
        self.assertEqual(
            translation_stats_model.submitted_translations_count, 2)
        self.assertEqual(
            translation_stats_model.submitted_translation_word_count, 8)
        self.assertEqual(translation_stats_model.accepted_translations_count, 1)
        self.assertEqual(
            translation_stats_model
            .accepted_translations_without_reviewer_edits_count,
            1
        )
        self.assertEqual(
            translation_stats_model.accepted_translation_word_count, 3)
        self.assertEqual(translation_stats_model.rejected_translations_count, 1)
        self.assertEqual(
            translation_stats_model.rejected_translation_word_count, 5)
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            translation_stats_model.contribution_dates,
            [
                datetime.date.today(),
                datetime.date.today() - datetime.timedelta(days=1)
            ]
        )
