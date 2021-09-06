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
from core.domain import recommendations_services
from core.domain import search_services
from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.batch_jobs import cron_jobs
from jobs.types import job_run_result
import python_utils

from typing import Dict, List, Union # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import exp_models
    from mypy_imports import recommendations_models
    from mypy_imports import user_models

(
    exp_models, recommendations_models, user_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.recommendations, models.NAMES.user
])

platform_search_services = models.Registry.import_search_services()


class IndexExplorationsInSearchTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.IndexExplorationsInSearch

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

    def test_indexes_non_deleted_model(self) -> None:
        exp_summary = self.create_model( # type: ignore[no-untyped-call]
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
            self.assert_job_output_is([ # type: ignore[no-untyped-call]
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed')
            ])

    def test_indexes_non_deleted_models(self) -> None:
        for i in python_utils.RANGE(5):
            exp_summary = self.create_model( # type: ignore[no-untyped-call]
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
            self.assert_job_output_is([ # type: ignore[no-untyped-call]
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed'),
            ])

    def test_reports_failed_when_indexing_fails(self) -> None:
        exp_summary = self.create_model( # type: ignore[no-untyped-call]
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
            self.assert_job_output_is([ # type: ignore[no-untyped-call]
                job_run_result.JobRunResult(
                    stderr='FAILURE 1 models not indexed'
                )
            ])

    def test_skips_deleted_model(self) -> None:
        exp_summary = self.create_model( # type: ignore[no-untyped-call]
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
            self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

    def test_skips_private_model(self) -> None:
        exp_summary = self.create_model( # type: ignore[no-untyped-call]
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
            self.assert_job_output_is([ # type: ignore[no-untyped-call]
                job_run_result.JobRunResult(stdout='SUCCESS 1 models indexed')
            ])


class CollectWeeklyDashboardStatsTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.CollectWeeklyDashboardStats

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)

    def setUp(self) -> None:
        super().setUp() # type: ignore[no-untyped-call]
        self.formated_datetime = datetime.datetime.utcnow().strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

    def test_updates_existing_stats_model_when_no_values_are_provided(
            self
    ) -> None:
        user_settings_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_stats_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1,
        )

        self.put_multi([user_settings_model, user_stats_model]) # type: ignore[no-untyped-call]

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
            job_run_result.JobRunResult(stdout='SUCCESS OLD 1')
        ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_1)
        self.assertIsNotNone(user_stats_model)
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

    def test_fails_when_existing_stats_has_wrong_schema_version(self) -> None:
        user_settings_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_stats_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1,
            schema_version=0
        )

        self.put_multi([user_settings_model, user_stats_model]) # type: ignore[no-untyped-call]

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception,
            'Sorry, we can only process v1-v%d dashboard stats schemas at '
            'present.' % feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION
        ):
            self.assert_job_output_is([  # type: ignore[no-untyped-call]
                job_run_result.JobRunResult(stdout='SUCCESS OLD 1')
            ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_1)
        self.assertIsNotNone(user_stats_model)
        self.assertEqual(user_stats_model.weekly_creator_stats_list, [])

    def test_updates_existing_stats_model_when_values_are_provided(
            self
    ) -> None:
        user_settings_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_stats_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1,
            num_ratings=10,
            average_ratings=4.5,
            total_plays=22,
        )

        self.put_multi([user_settings_model, user_stats_model]) # type: ignore[no-untyped-call]

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
            job_run_result.JobRunResult(stdout='SUCCESS OLD 1')
        ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_1)
        self.assertIsNotNone(user_stats_model)
        self.assertEqual(
            user_stats_model.weekly_creator_stats_list,
            [{
                self.formated_datetime: {
                    'num_ratings': 10,
                    'average_ratings': 4.5,
                    'total_plays': 22
                }
            }]
        )

    def test_creates_new_stats_model_if_not_existing(self) -> None:
        user_settings_model = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_settings_model.update_timestamps()
        user_settings_model.put()

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
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
        user_settings_model_1 = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_1, email='a@a.com')
        user_settings_model_2 = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserSettingsModel,
            id=self.VALID_USER_ID_2, email='b@b.com')
        user_stats_model_1 = self.create_model( # type: ignore[no-untyped-call]
            user_models.UserStatsModel,
            id=self.VALID_USER_ID_1)

        self.put_multi([ # type: ignore[no-untyped-call]
            user_settings_model_1, user_settings_model_2, user_stats_model_1])

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
            job_run_result.JobRunResult(stdout='SUCCESS OLD 1'),
            job_run_result.JobRunResult(stdout='SUCCESS NEW 1')
        ])

        user_stats_model = user_models.UserStatsModel.get(self.VALID_USER_ID_2)
        self.assertIsNotNone(user_stats_model)


class ComputeExplorationRecommendationsTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.ComputeExplorationRecommendations

    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    EXP_3_ID = 'exp_3_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

    def test_does_nothing_when_only_one_exploration_exists(self) -> None:
        exp_summary = self.create_model( # type: ignore[no-untyped-call]
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

        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

        exp_recommendations_model = (
            recommendations_models.ExplorationRecommendationsModel.get(
                self.EXP_1_ID, strict=False))
        self.assertIsNone(exp_recommendations_model)

    def test_creates_recommendations_for_similar_explorations(self) -> None:
        recommendations_services.create_default_topic_similarities() # type: ignore[no-untyped-call]
        exp_summary_1 = self.create_model( # type: ignore[no-untyped-call]
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
        exp_summary_2 = self.create_model( # type: ignore[no-untyped-call]
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
        self.put_multi([exp_summary_1, exp_summary_2]) # type: ignore[no-untyped-call]

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
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
        exp_summary_1 = self.create_model(  # type: ignore[no-untyped-call]
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
        exp_summary_2 = self.create_model(  # type: ignore[no-untyped-call]
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
        self.put_multi([exp_summary_1, exp_summary_2])  # type: ignore[no-untyped-call]

        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

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
        exp_summary_1 = self.create_model(  # type: ignore[no-untyped-call]
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
        exp_summary_2 = self.create_model(  # type: ignore[no-untyped-call]
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
        self.put_multi([exp_summary_1, exp_summary_2])  # type: ignore[no-untyped-call]

        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

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
        exp_summary_1 = self.create_model(  # type: ignore[no-untyped-call]
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
        exp_summary_2 = self.create_model(  # type: ignore[no-untyped-call]
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
        exp_summary_3 = self.create_model(  # type: ignore[no-untyped-call]
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
        self.put_multi([exp_summary_1, exp_summary_2, exp_summary_3])  # type: ignore[no-untyped-call]

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
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
