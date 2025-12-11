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

"""Unit tests for jobs.batch_jobs.exp_search_indexing_jobs."""

from __future__ import annotations
from unittest import mock

from core.constants import constants
from core.domain import search_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_search_indexing_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict, List, Tuple, Type, Union

MYPY = False
if MYPY:
    from mypy_imports import exp_models
    from mypy_imports import search_services as platform_search_services

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])

platform_search_services = models.Registry.import_search_services()

StatsType = List[Tuple[str, List[Dict[str, Union[bool, int, str]]]]]


class IndexExplorationsInSearchJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[exp_search_indexing_jobs.IndexExplorationsInSearchJob] = (
        exp_search_indexing_jobs.IndexExplorationsInSearchJob
    )

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
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        add_docs_to_index_patch = mock.patch.object(
            platform_search_services,
            'add_documents_to_index',
            side_effect=lambda _, __: None,
        )

        with add_docs_to_index_patch:
            self.assert_job_output_is(
                [job_run_result.JobRunResult.as_stdout('SUCCESS: 1')]
            )

        add_docs_to_index_patch.assert_called_once_with(
            *(
                [
                    {
                        'id': 'abcd',
                        'language_code': 'lang',
                        'title': 'title',
                        'category': 'category',
                        'tags': [],
                        'objective': 'objective',
                        'rank': 20,
                    }
                ],
                search_services.SEARCH_INDEX_EXPLORATIONS,
            )
        )

    def test_indexes_non_deleted_models(self) -> None:
        for i in range(5):
            exp_summary = self.create_model(
                exp_models.ExpSummaryModel,
                id='abcd%s' % i,
                deleted=False,
                title='title',
                category='category',
                objective='objective',
                language_code='lang',
                community_owned=False,
                status=constants.ACTIVITY_STATUS_PUBLIC,
            )
            exp_summary.update_timestamps()
            exp_summary.put()

        add_docs_to_index_patch = mock.patch.object(
            platform_search_services,
            'add_documents_to_index',
            side_effect=lambda _, __: None,
        )

        max_batch_size_patch = mock.patch.object(
            exp_search_indexing_jobs.IndexExplorationsInSearchJob,
            'MAX_BATCH_SIZE',
            1,
        )

        with add_docs_to_index_patch, max_batch_size_patch:
            self.assert_job_output_is(
                [job_run_result.JobRunResult.as_stdout('SUCCESS: 5')]
            )

        add_docs_to_index_patch.assert_has_calls(
            [
                mock.call(*arg)
                for arg in [
                    (
                        [
                            {
                                'id': 'abcd%s' % i,
                                'language_code': 'lang',
                                'title': 'title',
                                'category': 'category',
                                'tags': [],
                                'objective': 'objective',
                                'rank': 20,
                            }
                        ],
                        search_services.SEARCH_INDEX_EXPLORATIONS,
                    )
                    for i in range(5)
                ]
            ]
        )

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
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        def add_docs_to_index_mock(
            unused_documents: Dict[str, Union[int, str, List[str]]],
            unused_index_name: str,
        ) -> None:
            raise platform_search_services.SearchException('search exception')

        add_docs_to_index_patch = mock.patch.object(
            platform_search_services,
            'add_documents_to_index',
            side_effect=add_docs_to_index_mock,
        )

        with add_docs_to_index_patch:
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult.as_stderr(
                        'ERROR: "search exception": 1'
                    )
                ]
            )

        add_docs_to_index_patch.assert_called_once_with(
            *(
                [
                    {
                        'id': 'abcd',
                        'language_code': 'lang',
                        'title': 'title',
                        'category': 'category',
                        'tags': [],
                        'objective': 'objective',
                        'rank': 20,
                    }
                ],
                search_services.SEARCH_INDEX_EXPLORATIONS,
            )
        )

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
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        add_docs_to_index_patch = mock.patch.object(
            platform_search_services,
            'add_documents_to_index',
            side_effect=lambda _, __: None,
        )

        with add_docs_to_index_patch:
            self.assert_job_output_is_empty()

        add_docs_to_index_patch.assert_not_called()

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
            status=constants.ACTIVITY_STATUS_PRIVATE,
        )
        exp_summary.update_timestamps()
        exp_summary.put()

        add_docs_to_index_patch = mock.patch.object(
            platform_search_services,
            'add_documents_to_index',
            side_effect=lambda _, __: None,
        )

        with add_docs_to_index_patch:
            self.assert_job_output_is(
                [job_run_result.JobRunResult.as_stdout('SUCCESS: 1')]
            )

        add_docs_to_index_patch.assert_called_once_with(
            *([], search_services.SEARCH_INDEX_EXPLORATIONS)
        )
