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

"""Unit tests for jobs.batch_jobs.validation_jobs."""

from __future__ import absolute_import
from __future__ import unicode_literals

import datetime

from constants import constants
from core.domain import exp_domain
from core.domain import recommendations_services
from core.domain import search_services
from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.batch_jobs import cron_jobs
from jobs.types import job_run_result
import python_utils

import apache_beam as beam
from typing import Dict, List, Set, Tuple, Union, cast # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import recommendations_models
    from mypy_imports import suggestion_models
    from mypy_imports import user_models

(
    exp_models, opportunity_models,
    recommendations_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.opportunity,
    models.NAMES.recommendations, models.NAMES.suggestion, models.NAMES.user
])
platform_search_services = models.Registry.import_search_services()

StatsType = List[Tuple[str, List[Dict[str, Union[bool, int, str]]]]]


class IndexExplorationsInSearchTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.IndexExplorationsInSearch

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_indexes_non_deleted_model(self) -> None:
        exp_summary = self.create_model(
            exp_models.ExpSummaryModel,
            id='abcd',
            deleted=False,
            title='title',
            category='category',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        add_docs_to_index_swap = self.swap_with_checks(
            platform_search_services,
            'add_documents_to_index',
            lambda _, __: None,
            expected_args=[
                ([{
                    'id': 'abcd',
                    'language_code': 'lang',
                    'title': 'title',
                    'category': 'category',
                    'tags': [],
                    'objective': 'objective',
                    'rank': 20,
                }], search_services.SEARCH_INDEX_EXPLORATIONS)
            ]
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed')
            ])

    def test_indexes_non_deleted_models(self) -> None:
        for i in python_utils.RANGE(5):
            exp_summary = self.create_model(
                exp_models.ExpSummaryModel,
                id='abcd%s' % i,
                deleted=False,
                title='title',
                category='category',
                objective='objective',
                language_code='lang',
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC
            )
            exp_summary.update_timestamps()
            exp_summary.put()

        add_docs_to_index_swap = self.swap_with_checks(
            platform_search_services,
            'add_documents_to_index',
            lambda _, __: None,
            expected_args=[
                (
                    [{
                        'id': 'abcd%s' % i,
                        'language_code': 'lang',
                        'title': 'title',
                        'category': 'category',
                        'tags': [],
                        'objective': 'objective',
                        'rank': 20,
                    }],
                    search_services.SEARCH_INDEX_EXPLORATIONS
                ) for i in python_utils.RANGE(5)
            ]
        )

        max_batch_size_swap = self.swap(
            cron_jobs.IndexExplorationsInSearch, 'MAX_BATCH_SIZE', 1)

        with add_docs_to_index_swap, max_batch_size_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
            ])

    def test_reports_failed_when_indexing_fails(self) -> None:
        exp_summary = self.create_model(
            exp_models.ExpSummaryModel,
            id='abcd',
            deleted=False,
            title='title',
            category='category',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        def add_docs_to_index_mock(
                unused_documents: Dict[str, Union[int, str, List[str]]],
                unused_index_name: str
        ) -> None:
            raise platform_search_services.SearchException # type: ignore[attr-defined]

        add_docs_to_index_swap = self.swap_with_checks(
            platform_search_services,
            'add_documents_to_index',
            add_docs_to_index_mock,
            expected_args=[
                (
                    [{
                        'id': 'abcd',
                        'language_code': 'lang',
                        'title': 'title',
                        'category': 'category',
                        'tags': [],
                        'objective': 'objective',
                        'rank': 20,
                    }],
                    search_services.SEARCH_INDEX_EXPLORATIONS
                )
            ]
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr='FAILURE 1 models not indexed'
                )
            ])

    def test_skips_deleted_model(self) -> None:
        exp_summary = self.create_model(
            exp_models.ExpSummaryModel,
            id='abcd',
            deleted=True,
            title='title',
            category='category',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        add_docs_to_index_swap = self.swap_with_checks(
            platform_search_services,
            'add_documents_to_index',
            lambda _, __: None,
            called=False
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is_empty()

    def test_skips_private_model(self) -> None:
        exp_summary = self.create_model(
            exp_models.ExpSummaryModel,
            id='abcd',
            deleted=False,
            title='title',
            category='category',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PRIVATE
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        add_docs_to_index_swap = self.swap_with_checks(
            platform_search_services,
            'add_documents_to_index',
            lambda _, __: None,
            expected_args=[([], search_services.SEARCH_INDEX_EXPLORATIONS)]
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed')
            ])


class CollectWeeklyDashboardStatsTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.CollectWeeklyDashboardStats

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)

    def setUp(self) -> None:
        super().setUp()
        self.formated_datetime = datetime.datetime.utcnow().strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_updates_existing_stats_model_when_no_values_are_provided(
            self
    ) -> None:
        user_settings_model = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_stats_model = self.create_model(
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1,
        )

        self.put_multi([user_settings_model, user_stats_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS OLD 1')
        ])

        new_user_stats_model = cast(
            user_models.UserStatsModel,
            user_models.UserStatsModel.get(self.VALID_USER_ID_1))
        self.assertIsNotNone(new_user_stats_model)
        self.assertEqual(
            new_user_stats_model.weekly_creator_stats_list,
            [{
                self.formated_datetime: {
                    'num_ratings': 0,
                    'average_ratings': None,
                    'total_plays': 0
                }
            }]
        )

    def test_fails_when_existing_stats_has_wrong_schema_version(self) -> None:
        user_settings_model = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_stats_model = self.create_model(
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1,
            schema_version=0
        )

        self.put_multi([user_settings_model, user_stats_model])

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception,
            'Sorry, we can only process v1-v%d dashboard stats schemas at '
            'present.' % feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION
        ):
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='SUCCESS OLD 1')
            ])

        new_user_stats_model = cast(
            user_models.UserStatsModel,
            user_models.UserStatsModel.get(self.VALID_USER_ID_1))
        self.assertIsNotNone(new_user_stats_model)
        self.assertEqual(new_user_stats_model.weekly_creator_stats_list, [])

    def test_updates_existing_stats_model_when_values_are_provided(
            self
    ) -> None:
        user_settings_model = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_stats_model = self.create_model(
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1,
            num_ratings=10,
            average_ratings=4.5,
            total_plays=22,
        )

        self.put_multi([user_settings_model, user_stats_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS OLD 1')
        ])

        new_user_stats_model = cast(
            user_models.UserStatsModel,
            user_models.UserStatsModel.get(self.VALID_USER_ID_1))
        self.assertIsNotNone(new_user_stats_model)
        self.assertEqual(
            new_user_stats_model.weekly_creator_stats_list,
            [{
                self.formated_datetime: {
                    'num_ratings': 10,
                    'average_ratings': 4.5,
                    'total_plays': 22
                }
            }]
        )

    def test_creates_new_stats_model_if_not_existing(self) -> None:
        user_settings_model = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_settings_model.update_timestamps()
        user_settings_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS NEW 1')
        ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_1)
        # Ruling out the possibility of None for mypy type checking.
        assert user_stats_model is not None
        self.assertEqual(
            user_stats_model.weekly_creator_stats_list,
            [{
                self.formated_datetime: {
                    'num_ratings': 0,
                    'average_ratings': None,
                    'total_plays': 0
                }
            }]
        )

    def test_handles_multiple_models(self) -> None:
        user_settings_model_1 = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_settings_model_2 = self.create_model(
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_2, email='b@b.com')
        user_stats_model_1 = self.create_model(
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1)

        self.put_multi([
            user_settings_model_1, user_settings_model_2, user_stats_model_1])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS OLD 1'),
            job_run_result.JobRunResult(stdout='SUCCESS NEW 1')
        ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_2)
        self.assertIsNotNone(user_stats_model)


class GenerateTranslationContributionStatsTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.GenerateTranslationContributionStats

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
            | beam.CombineValues(cron_jobs.CombineStats())
            | beam.Values()  # pylint: disable=no-value-for-parameter
            | beam.Map(lambda stats: stats.to_dict())
        )

    def test_correctly_combine_one_in_review_stat_not_edited_by_reviewer(
        self
    ) -> None:
        entry_stats: StatsType = [(
            'key.key.key',
            [{
                'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                'edited_by_reviewer': False,
                'content_word_count': 5,
                'last_updated_date': '2021-05-01'
            }]
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
            [{
                'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                'edited_by_reviewer': True,
                'content_word_count': 10,
                'last_updated_date': '2021-05-05'
            }]
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
            [{
                'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                'edited_by_reviewer': True,
                'content_word_count': 15,
                'last_updated_date': '2019-05-05'
            }]
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
            [{
                'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                'edited_by_reviewer': False,
                'content_word_count': 20,
                'last_updated_date': '2021-05-05'
            }]
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
            [{
                'suggestion_status': suggestion_models.STATUS_REJECTED,
                'edited_by_reviewer': False,
                'content_word_count': 25,
                'last_updated_date': '2021-05-05'
            }]
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
        entry_stats: StatsType = [(
            'key.key.key',
            [
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 3,
                    'last_updated_date': '2021-05-05'
                },
                {
                    'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                    'edited_by_reviewer': False,
                    'content_word_count': 7,
                    'last_updated_date': '2021-05-06'
                },
                {
                    'suggestion_status': suggestion_models.STATUS_REJECTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 11,
                    'last_updated_date': '2021-05-05'
                },
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': True,
                    'content_word_count': 13,
                    'last_updated_date': '2021-05-05'
                }
            ]
        )]
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
        entry_stats: StatsType = [(
            'key.key.key1',
            [
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 3,
                    'last_updated_date': '2021-05-05'
                },
                {
                    'suggestion_status': suggestion_models.STATUS_IN_REVIEW,
                    'edited_by_reviewer': False,
                    'content_word_count': 7,
                    'last_updated_date': '2021-05-06'
                }
            ]
        ), (
            'key.key.key2',
            [
                {
                    'suggestion_status': suggestion_models.STATUS_REJECTED,
                    'edited_by_reviewer': False,
                    'content_word_count': 11,
                    'last_updated_date': '2021-05-05'
                },
                {
                    'suggestion_status': suggestion_models.STATUS_ACCEPTED,
                    'edited_by_reviewer': True,
                    'content_word_count': 13,
                    'last_updated_date': '2021-05-05'
                }
            ]
        )]
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


class ComputeExplorationRecommendationsTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.ComputeExplorationRecommendations

    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    EXP_3_ID = 'exp_3_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_does_nothing_when_only_one_exploration_exists(self) -> None:
        exp_summary = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_1_ID,
            deleted=False,
            title='title',
            category='category',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        self.assert_job_output_is_empty()

        exp_recommendations_model = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_1_ID, strict=False))
        self.assertIsNone(exp_recommendations_model)

    def test_creates_recommendations_for_similar_explorations(self) -> None:
        recommendations_services.create_default_topic_similarities() # type: ignore[no-untyped-call]
        exp_summary_1 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_1_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_1.update_timestamps()
        exp_summary_2 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_2_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_2.update_timestamps()
        self.put_multi([exp_summary_1, exp_summary_2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS 2')
        ])

        exp_recommendations_model_1 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert exp_recommendations_model_1 is not None
        self.assertEqual(
            exp_recommendations_model_1.recommended_exploration_ids,
            [self.EXP_2_ID]
        )
        exp_recommendations_model_2 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_2_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert exp_recommendations_model_2 is not None
        self.assertEqual(
            exp_recommendations_model_2.recommended_exploration_ids,
            [self.EXP_1_ID]
        )

    def test_skips_private_explorations(self) -> None:
        recommendations_services.create_default_topic_similarities()  # type: ignore[no-untyped-call]
        exp_summary_1 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_1_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PRIVATE,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_1.update_timestamps()
        exp_summary_2 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_2_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PRIVATE,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_2.update_timestamps()
        self.put_multi([exp_summary_1, exp_summary_2])

        self.assert_job_output_is_empty()

        exp_recommendations_model_1 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_1_ID, strict=False))
        self.assertIsNone(exp_recommendations_model_1)
        exp_recommendations_model_2 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_2_ID, strict=False))
        self.assertIsNone(exp_recommendations_model_2)

    def test_does_not_create_recommendations_for_different_explorations(
            self
    ) -> None:
        recommendations_services.create_default_topic_similarities()  # type: ignore[no-untyped-call]
        exp_summary_1 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_1_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang1',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_1.update_timestamps()
        exp_summary_2 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_2_ID,
            deleted=False,
            title='title',
            category='Sport',
            objective='objective',
            language_code='lang2',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_2.update_timestamps()
        self.put_multi([exp_summary_1, exp_summary_2])

        self.assert_job_output_is_empty()

        exp_recommendations_model_1 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_1_ID, strict=False))
        self.assertIsNone(exp_recommendations_model_1)
        exp_recommendations_model_2 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_2_ID, strict=False))
        self.assertIsNone(exp_recommendations_model_2)

    def test_creates_recommendations_for_three_explorations(self) -> None:
        recommendations_services.create_default_topic_similarities()  # type: ignore[no-untyped-call]
        exp_summary_1 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_1_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang1',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_1.update_timestamps()
        exp_summary_2 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_2_ID,
            deleted=False,
            title='title',
            category='Sport',
            objective='objective',
            language_code='lang1',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_2.update_timestamps()
        exp_summary_3 = self.create_model(
            exp_models.ExpSummaryModel,
            id=self.EXP_3_ID,
            deleted=False,
            title='title',
            category='Architecture',
            objective='objective',
            language_code='lang1',
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            exploration_model_last_updated=datetime.datetime.utcnow()
        )
        exp_summary_3.update_timestamps()
        self.put_multi([exp_summary_1, exp_summary_2, exp_summary_3])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS 3')
        ])

        exp_recommendations_model_1 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_1_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert exp_recommendations_model_1 is not None
        self.assertEqual(
            exp_recommendations_model_1.recommended_exploration_ids,
            [self.EXP_3_ID, self.EXP_2_ID]
        )
        exp_recommendations_model_2 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_2_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert exp_recommendations_model_2 is not None
        self.assertEqual(
            exp_recommendations_model_2.recommended_exploration_ids,
            [self.EXP_1_ID, self.EXP_3_ID]
        )
        exp_recommendations_model_3 = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_3_ID))
        # Ruling out the possibility of None for mypy type checking.
        assert exp_recommendations_model_3 is not None
        self.assertEqual(
            exp_recommendations_model_3.recommended_exploration_ids,
            [self.EXP_1_ID, self.EXP_2_ID]
        )
