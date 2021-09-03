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
from core.domain import search_services
from core.platform import models
import feconf
from jobs import job_test_utils
from jobs.batch_jobs import cron_jobs
from jobs.types import job_run_result
import python_utils

import apache_beam as beam
from typing import Dict, Iterable, List, Set, Tuple, Union # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(
    exp_models, opportunity_models, suggestion_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.opportunity, models.NAMES.suggestion
])
platform_search_services = models.Registry.import_search_services()

StatsType = List[Tuple[str, List[Dict[str, Union[bool, int, str]]]]]


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


class GenerateTranslationContributionStatsTests(job_test_utils.JobTestBase):

    JOB_CLASS = cron_jobs.GenerateTranslationContributionStats

    VALID_USER_ID_1 = 'uid_%s' % ('a' * feconf.USER_ID_RANDOM_PART_LENGTH)
    VALID_USER_ID_2 = 'uid_%s' % ('b' * feconf.USER_ID_RANDOM_PART_LENGTH)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty() # type: ignore[no-untyped-call]

    def test_skips_non_translate_suggestion(self) -> None:
        suggestion_model = self.create_model(  # type: ignore[no-untyped-call]
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            author_id=self.VALID_USER_ID_1,
            change_cmd={},
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='topic',
            target_id='topic_id',
            target_version_at_submission=0,
            language_code='lang'
        )
        suggestion_model.update_timestamps()
        suggestion_model.put()

        self.assert_job_output_is_empty()  # type: ignore[no-untyped-call]

    def test_creates_stats_model_from_one_suggestion(self) -> None:
        exp_summary = self.create_model( # type: ignore[no-untyped-call]
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id=self.VALID_USER_ID_1,
            change_cmd={
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'state',
                'content_id': 'content_id',
                'language_code': 'lang',
                'content_html': '123456789',
                'translation_html': '123456789',
                'data_format': 'format'
            },
            score_category='irelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='topic',
            target_id='topic_id',
            target_version_at_submission=0,
            language_code='lang'
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        self.assert_job_output_is([ # type: ignore[no-untyped-call]
            job_run_result.JobRunResult(stdout='SUCCESS 1')
        ])


class CombineStatsTests(job_test_utils.PipelinedTestBase):

    def create_test_pipeline(
        self, entry_stats: StatsType
    ) -> beam.PCollection[Dict[str, Union[int, Set[datetime.date]]]]:
        return (
            self.pipeline
            | beam.Create(entry_stats)
            | beam.CombineValues(cron_jobs.CombineStats())
            | beam.Values()
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{ # type: ignore[no-untyped-call]
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{ # type: ignore[no-untyped-call]
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{ # type: ignore[no-untyped-call]
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{ # type: ignore[no-untyped-call]
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{ # type: ignore[no-untyped-call]
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [{ # type: ignore[no-untyped-call]
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
        self.assert_pcoll_equal(self.create_test_pipeline(entry_stats), [ # type: ignore[no-untyped-call]
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