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
from core.domain import exp_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import suggestion_stats_computation_jobs
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Dict, Final, List, Set, Tuple, Type, Union

MYPY = False
if MYPY:
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(opportunity_models, suggestion_models) = models.Registry.import_models([
    models.Names.OPPORTUNITY, models.Names.SUGGESTION
])

StatsType = List[Tuple[str, Dict[str, Union[bool, int, str]]]]


class GenerateTranslationContributionStatsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        suggestion_stats_computation_jobs
        .GenerateTranslationContributionStatsJob
    ] = (
        suggestion_stats_computation_jobs
        .GenerateTranslationContributionStatsJob
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

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        # Ruling out the possibility of None for mypy type checking.
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
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [datetime.date.today()]
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

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, '')
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
            [datetime.date.today()]
        )

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

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        # Ruling out the possibility of None for mypy type checking.
        assert translation_stats_model is not None
        self.assertEqual(translation_stats_model.language_code, self.LANG_1)
        self.assertEqual(
            translation_stats_model.contributor_user_id, self.VALID_USER_ID_1)
        self.assertEqual(translation_stats_model.topic_id, '')
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
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
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
                'data_format': 'unicode'
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
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        # Ruling out the possibility of None for mypy type checking.
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
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [datetime.date.today()]
        )

    def test_creates_stats_model_from_multiple_suggestions(self) -> None:
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
                'content_html': ['111', '222', '333', '444', '555'],
                'translation_html': ['111', '222', '333', '444', '555'],
                'data_format': 'set_of_unicode_string'
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
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])

        translation_stats_model = (
            suggestion_models.TranslationContributionStatsModel.get(
                self.LANG_1, self.VALID_USER_ID_1, ''))

        # Ruling out the possibility of None for mypy type checking.
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
        self.assertItemsEqual(
            translation_stats_model.contribution_dates,
            [
                datetime.date.today(),
                datetime.date.today() - datetime.timedelta(days=1)
            ]
        )


class CombineStatsTests(job_test_utils.PipelinedTestBase):

    def create_test_pipeline(
        self, entry_stats: StatsType
    ) -> beam.PCollection[Dict[str, Union[int, Set[datetime.date]]]]:
        """Creates testing pipeline with some entry stats.

        Args:
            entry_stats: StatsType. The stast with which to start the pipeline.

        Returns:
            PCollection. The testing pipeline to be executed.
        """
        return (
            self.pipeline
            | beam.Create(entry_stats)
            | beam.CombinePerKey(
                suggestion_stats_computation_jobs.CombineStats())
            | beam.Values()  # pylint: disable=no-value-for-parameter
            | beam.Map(lambda stats: stats.to_dict())
        )

    def test_correctly_combine_one_in_review_stat_not_edited_by_reviewer(
        self
    ) -> None:
        entry_stats: StatsType = [(
            'key.key.key',
            {
                'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                'edited_by_reviewer': False,
                'content_word_count': 5,
                'last_updated_date': '2021-05-01'
            }
        )]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{
            'language_code': None,
            'contributor_user_id': None,
            'topic_id': None,
            'submitted_translations_count': 1,
            'submitted_translation_word_count': 5,
            'accepted_translations_count': 0,
            'accepted_translations_without_reviewer_edits_count': 0,
            'accepted_translation_word_count': 0,
            'rejected_translations_count': 0,
            'rejected_translation_word_count': 0,
            'contribution_dates': {datetime.date(2021, 5, 1)}
        }])

    def test_correctly_combine_one_in_review_stat_edited_by_reviewer(
        self
    ) -> None:
        entry_stats: StatsType = [(
            'key.key.key',
            {
                'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                'edited_by_reviewer': True,
                'content_word_count': 10,
                'last_updated_date': '2021-05-05'
            }
        )]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{
            'language_code': None,
            'contributor_user_id': None,
            'topic_id': None,
            'submitted_translations_count': 1,
            'submitted_translation_word_count': 10,
            'accepted_translations_count': 0,
            'accepted_translations_without_reviewer_edits_count': 0,
            'accepted_translation_word_count': 0,
            'rejected_translations_count': 0,
            'rejected_translation_word_count': 0,
            'contribution_dates': {datetime.date(2021, 5, 5)}
        }])

    def test_correctly_combine_one_accepted_stat_edited_by_reviewer(
        self
    ) -> None:
        entry_stats: StatsType = [(
            'key.key.key',
            {
                'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                'edited_by_reviewer': True,
                'content_word_count': 15,
                'last_updated_date': '2019-05-05'
            }
        )]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{
            'language_code': None,
            'contributor_user_id': None,
            'topic_id': None,
            'submitted_translations_count': 1,
            'submitted_translation_word_count': 15,
            'accepted_translations_count': 1,
            'accepted_translations_without_reviewer_edits_count': 0,
            'accepted_translation_word_count': 15,
            'rejected_translations_count': 0,
            'rejected_translation_word_count': 0,
            'contribution_dates': {datetime.date(2019, 5, 5)}
        }])

    def test_correctly_combine_one_accepted_stat_not_edited_by_reviewer(
        self
    ) -> None:
        entry_stats: StatsType = [(
            'key.key.key',
            {
                'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                'edited_by_reviewer': False,
                'content_word_count': 20,
                'last_updated_date': '2021-05-05'
            }
        )]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{
            'language_code': None,
            'contributor_user_id': None,
            'topic_id': None,
            'submitted_translations_count': 1,
            'submitted_translation_word_count': 20,
            'accepted_translations_count': 1,
            'accepted_translations_without_reviewer_edits_count': 1,
            'accepted_translation_word_count': 20,
            'rejected_translations_count': 0,
            'rejected_translation_word_count': 0,
            'contribution_dates': {datetime.date(2021, 5, 5)}
        }])

    def test_correctly_combine_one_rejected_stat_not_edited_by_reviewer(
        self
    ) -> None:
        entry_stats: StatsType = [(
            'key.key.key',
            {
                'suggestion_status': suggestion_models.STATUS_REJECTED,
                'edited_by_reviewer': False,
                'content_word_count': 25,
                'last_updated_date': '2021-05-05'
            }
        )]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{
            'language_code': None,
            'contributor_user_id': None,
            'topic_id': None,
            'submitted_translations_count': 1,
            'submitted_translation_word_count': 25,
            'accepted_translations_count': 0,
            'accepted_translations_without_reviewer_edits_count': 0,
            'accepted_translation_word_count': 0,
            'rejected_translations_count': 1,
            'rejected_translation_word_count': 25,
            'contribution_dates': {datetime.date(2021, 5, 5)}
        }])

    def test_correctly_combine_multiple_stats_with_same_key(self) -> None:
        entry_stats: StatsType = [
            (
                'key.key.key',
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 3,
                    'last_updated_date': '2021-05-05'
                },
            ), (
                'key.key.key',
                {
                    'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                    'edited_by_reviewer': False,
                    'content_word_count': 7,
                    'last_updated_date': '2021-05-06'
                },
            ), (
                'key.key.key', {
                    'suggestion_status': suggestion_models.STATUS_REJECTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 11,
                    'last_updated_date': '2021-05-05'
                },
            ), (
                'key.key.key',
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': True,
                    'content_word_count': 13,
                    'last_updated_date': '2021-05-05'
                }
            )
        ]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{
            'language_code': None,
            'contributor_user_id': None,
            'topic_id': None,
            'submitted_translations_count': 4,
            'submitted_translation_word_count': 34,
            'accepted_translations_count': 2,
            'accepted_translations_without_reviewer_edits_count': 1,
            'accepted_translation_word_count': 16,
            'rejected_translations_count': 1,
            'rejected_translation_word_count': 11,
            'contribution_dates': {
                datetime.date(2021, 5, 5), datetime.date(2021, 5, 6)
            }
        }])

    def test_correctly_combine_multiple_stats_with_different_key(self) -> None:
        entry_stats: StatsType = [
            (
                'key.key.key1',
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 3,
                    'last_updated_date': '2021-05-05'
                },
            ), (
                'key.key.key1',
                {
                    'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                    'edited_by_reviewer': False,
                    'content_word_count': 7,
                    'last_updated_date': '2021-05-06'
                }
            ), (
                'key.key.key2',
                {
                    'suggestion_status': suggestion_models.STATUS_REJECTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 11,
                    'last_updated_date': '2021-05-05'
                },
            ), (
                'key.key.key2',
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': True,
                    'content_word_count': 13,
                    'last_updated_date': '2021-05-05'
                }
            )
        ]
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [
            {
                'language_code': None,
                'contributor_user_id': None,
                'topic_id': None,
                'submitted_translations_count': 2,
                'submitted_translation_word_count': 24,
                'accepted_translations_count': 1,
                'accepted_translations_without_reviewer_edits_count': 0,
                'accepted_translation_word_count': 13,
                'rejected_translations_count': 1,
                'rejected_translation_word_count': 11,
                'contribution_dates': {datetime.date(2021, 5, 5)}
            }, {
                'language_code': None,
                'contributor_user_id': None,
                'topic_id': None,
                'submitted_translations_count': 2,
                'submitted_translation_word_count': 10,
                'accepted_translations_count': 1,
                'accepted_translations_without_reviewer_edits_count': 1,
                'accepted_translation_word_count': 3,
                'rejected_translations_count': 0,
                'rejected_translation_word_count': 0,
                'contribution_dates': {
                    datetime.date(2021, 5, 6), datetime.date(2021, 5, 5)
                }
            },
        ])
