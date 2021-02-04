# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.search_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import python_utils

gae_search_services = models.Registry.import_search_services()


class SearchServicesUnitTests(test_utils.GenericTestBase):
    """Test the search services module."""

    EXP_ID = 'An_exploration_id'
    COLLECTION_ID = 'A_collection_id'

    def setUp(self):
        super(SearchServicesUnitTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.set_admins([self.ADMIN_USERNAME])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_get_search_rank(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_ID)

        base_search_rank = 20

        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_ID, 5)
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 10)

        rating_services.assign_rating_to_exploration(
            self.user_id_admin, self.EXP_ID, 2)
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 8)

    def test_search_ranks_cannot_be_negative(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_ID)

        base_search_rank = 20

        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        # A user can (down-)rate an exploration at most once.
        for i in python_utils.RANGE(50):
            rating_services.assign_rating_to_exploration(
                'user_id_1', self.EXP_ID, 1)
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank - 5)

        for i in python_utils.RANGE(50):
            rating_services.assign_rating_to_exploration(
                'user_id_%s' % i, self.EXP_ID, 1)

        # The rank will be at least 0.
        exp_summary = exp_fetchers.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(search_services.get_search_rank_from_exp_summary(
            exp_summary), 0)

    def test_search_explorations(self):
        expected_query_string = 'a query string'
        expected_offset = '0'
        expected_size = 30
        expected_result_offset = '30'
        doc_ids = ['id1', 'id2']

        def mock_search(
                query_string, index, categories, language_codes, offset=None,
                size=20, ids_only=False, retries=3):
            self.assertEqual(query_string, expected_query_string)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(categories, [])
            self.assertEqual(language_codes, [])
            self.assertEqual(offset, expected_offset)
            self.assertEqual(size, expected_size)
            self.assertEqual(ids_only, True)
            self.assertEqual(retries, 3)

            return doc_ids, expected_result_offset

        with self.swap(gae_search_services, 'search', mock_search):
            result, result_offset = search_services.search_explorations(
                expected_query_string, [], [], expected_size,
                offset=expected_offset,
            )

        self.assertEqual(result_offset, expected_result_offset)
        self.assertEqual(result, doc_ids)

    def test_search_collections(self):
        expected_query_string = 'a query string'
        expected_offset = '0'
        expected_size = 30
        expected_result_offset = '30'
        doc_ids = ['id1', 'id2']

        def mock_search(
                query_string, index, categories, language_codes, offset=None,
                size=20, ids_only=False, retries=3):
            self.assertEqual(query_string, expected_query_string)
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(categories, [])
            self.assertEqual(language_codes, [])
            self.assertEqual(offset, expected_offset)
            self.assertEqual(size, expected_size)
            self.assertEqual(ids_only, True)
            self.assertEqual(retries, 3)

            return doc_ids, expected_result_offset

        with self.swap(gae_search_services, 'search', mock_search):
            result, result_offset = search_services.search_collections(
                expected_query_string, [], [], expected_size,
                offset=expected_offset,
            )

        self.assertEqual(result_offset, expected_result_offset)
        self.assertEqual(result, doc_ids)

    def test_demo_collections_are_added_to_search_index(self):
        results = search_services.search_collections('Welcome', [], [], 2)[0]
        self.assertEqual(results, [])

        collection_services.load_demo('0')
        results = search_services.search_collections('Welcome', [], [], 2)[0]
        self.assertEqual(results, ['0'])

    def test_demo_explorations_are_added_to_search_index(self):
        results, _ = search_services.search_explorations('Welcome', [], [], 2)
        self.assertEqual(results, [])

        exp_services.load_demo('0')
        results, _ = search_services.search_explorations('Welcome', [], [], 2)
        self.assertEqual(results, ['0'])

    def test_clear_exploration_search_index(self):
        exp_services.load_demo('0')
        result = search_services.search_explorations('Welcome', [], [], 2)[0]
        self.assertEqual(result, ['0'])
        search_services.clear_exploration_search_index()
        result = search_services.search_explorations('Welcome', [], [], 2)[0]
        self.assertEqual(result, [])

    def test_clear_collection_search_index(self):
        collection_services.load_demo('0')
        result = search_services.search_collections('Welcome', [], [], 2)[0]
        self.assertEqual(result, ['0'])
        search_services.clear_collection_search_index()
        result = search_services.search_collections('Welcome', [], [], 2)[0]
        self.assertEqual(result, [])

    def test_delete_explorations_from_search_index(self):

        def _mock_delete_docs(ids, index):
            """Mocks delete_documents_from_index()."""
            self.assertEqual(ids, [self.EXP_ID])
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)

        delete_docs_counter = test_utils.CallCounter(_mock_delete_docs)

        delete_docs_swap = self.swap(
            gae_search_services, 'delete_documents_from_index',
            delete_docs_counter)

        with delete_docs_swap:
            search_services.delete_explorations_from_search_index([self.EXP_ID])

        self.assertEqual(delete_docs_counter.times_called, 1)

    def test_delete_collections_from_search_index(self):

        def _mock_delete_docs(ids, index):
            """Mocks delete_documents_from_index()."""
            self.assertEqual(ids, [self.COLLECTION_ID])
            self.assertEqual(index, search_services.SEARCH_INDEX_COLLECTIONS)

        delete_docs_counter = test_utils.CallCounter(_mock_delete_docs)

        delete_docs_swap = self.swap(
            gae_search_services, 'delete_documents_from_index',
            delete_docs_counter)

        with delete_docs_swap:
            search_services.delete_collections_from_search_index(
                [self.COLLECTION_ID])

        self.assertEqual(delete_docs_counter.times_called, 1)
