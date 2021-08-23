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

from constants import constants
from core.domain import search_services
from core.platform import models
from jobs import job_test_utils
from jobs.batch_jobs import cron_jobs
from jobs.types import job_run_result
import python_utils

from typing import Dict, List, Union # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
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
