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
from jobs.batch_jobs import other_jobs

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
platform_search_services = models.Registry.import_search_services()

class IndexExplorationsInSearchTests(job_test_utils.JobTestBase):

    JOB_CLASS = other_jobs.IndexExplorationsInSearch

    def test_empty_storage(self):
        self.assert_job_output_is_empty()

    def test_indexes_non_deleted_model(self):
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

        indexed_docs = []
        def mock_add_documents_to_index(docs, index):
            indexed_docs.extend(docs)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)

        add_docs_to_index_swap = self.swap(
            platform_search_services,
            'add_documents_to_index',
            mock_add_documents_to_index
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is(['SUCCESS'])

        self.assertItemsEqual(
            indexed_docs,
            [{
                'id': 'abcd',
                'language_code': 'lang',
                'title': 'title',
                'category': 'category',
                'tags': [],
                'objective': 'objective',
                'rank': 20,
            }]
        )

    def test_indexes_non_deleted_models(self):
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
                status=constants.ACTIVITY_STATUS_PUBLIC
            )
            exp_summary.update_timestamps()
            exp_summary.put()

        indexed_docs = []
        def mock_add_documents_to_index(docs, index):
            indexed_docs.extend(docs)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)

        add_docs_to_index_swap = self.swap(
            platform_search_services,
            'add_documents_to_index',
            mock_add_documents_to_index
        )

        self.swap(other_jobs.IndexExplorationsInSearch, 'MAX_BATCH_SIZE', 2)

        with add_docs_to_index_swap:
            self.assert_job_output_is(
                ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS'])

        self.assertItemsEqual(
            indexed_docs,
            [{
                'id': 'abcd%s' % i,
                'language_code': 'lang',
                'title': 'title',
                'category': 'category',
                'tags': [],
                'objective': 'objective',
                'rank': 20,
            } for i in range(5)]
        )

    def test_skips_deleted_model(self):
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

        indexed_docs = []
        def mock_add_documents_to_index(docs, index):
            indexed_docs.extend(docs)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)

        add_docs_to_index_swap = self.swap(
            platform_search_services,
            'add_documents_to_index',
            mock_add_documents_to_index
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is([])

        self.assertEqual(indexed_docs, [])

    def test_skips_private_model(self):
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

        indexed_docs = []
        def mock_add_documents_to_index(docs, index):
            indexed_docs.extend(docs)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)

        add_docs_to_index_swap = self.swap(
            platform_search_services,
            'add_documents_to_index',
            mock_add_documents_to_index
        )

        with add_docs_to_index_swap:
            self.assert_job_output_is(['SUCCESS'])

        self.assertEqual(indexed_docs, [])
