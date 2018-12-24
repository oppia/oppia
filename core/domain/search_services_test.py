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

from core.domain import collection_services
from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

gae_search_services = models.Registry.import_search_services()


class SearchServicesUnitTests(test_utils.GenericTestBase):
    """Test the search services module."""
    EXP_ID = 'An_exploration_id'
    COLLECTION_ID = 'A_collection_id'

    def setUp(self):
        super(SearchServicesUnitTests, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        user_services.create_new_user(self.editor_id, self.EDITOR_EMAIL)
        user_services.create_new_user(self.translator_id, self.TRANSLATOR_EMAIL)
        user_services.create_new_user(self.viewer_id, self.VIEWER_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.set_admins([self.ADMIN_USERNAME])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_get_search_rank(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)

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
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 10)

        rating_services.assign_rating_to_exploration(
            self.user_id_admin, self.EXP_ID, 2)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 8)

    def test_search_ranks_cannot_be_negative(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        base_search_rank = 20

        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        # A user can (down-)rate an exploration at most once.
        for i in xrange(50):
            rating_services.assign_rating_to_exploration(
                'user_id_1', self.EXP_ID, 1)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank - 5)

        for i in xrange(50):
            rating_services.assign_rating_to_exploration(
                'user_id_%s' % i, self.EXP_ID, 1)

        # The rank will be at least 0.
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(search_services.get_search_rank_from_exp_summary(
            exp_summary), 0)

    def test_search_explorations(self):
        expected_query_string = 'a query string'
        expected_cursor = 'cursor'
        expected_sort = 'title'
        expected_limit = 30
        expected_result_cursor = 'rcursor'
        doc_ids = ['id1', 'id2']

        def mock_search(query_string, index, cursor=None, limit=20, sort='',
                        ids_only=False, retries=3):
            self.assertEqual(query_string, expected_query_string)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(cursor, expected_cursor)
            self.assertEqual(limit, expected_limit)
            self.assertEqual(sort, expected_sort)
            self.assertEqual(ids_only, True)
            self.assertEqual(retries, 3)

            return doc_ids, expected_result_cursor

        with self.swap(gae_search_services, 'search', mock_search):
            result, cursor = search_services.search_explorations(
                expected_query_string,
                expected_limit,
                sort=expected_sort,
                cursor=expected_cursor,
            )

        self.assertEqual(cursor, expected_result_cursor)
        self.assertEqual(result, doc_ids)

    def test_patch_exploration_search_document(self):

        def mock_get_doc(doc_id, index):
            self.assertEqual(doc_id, self.EXP_ID)
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)
            return {'a': 'b', 'c': 'd'}

        def mock_add_docs(docs, index):
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)
            self.assertEqual(docs, [{'a': 'b', 'c': 'e', 'f': 'g'}])

        get_doc_swap = self.swap(
            gae_search_services, 'get_document_from_index', mock_get_doc)

        add_docs_counter = test_utils.CallCounter(mock_add_docs)
        add_docs_swap = self.swap(
            gae_search_services, 'add_documents_to_index', add_docs_counter)

        with get_doc_swap, add_docs_swap:
            patch = {'c': 'e', 'f': 'g'}
            search_services.patch_exploration_search_document(
                self.EXP_ID, patch)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_search_collections(self):
        expected_query_string = 'a query string'
        expected_cursor = 'cursor'
        expected_sort = 'title'
        expected_limit = 30
        expected_result_cursor = 'rcursor'
        doc_ids = ['id1', 'id2']

        def mock_search(query_string, index, cursor=None, limit=20, sort='',
                        ids_only=False, retries=3):
            self.assertEqual(query_string, expected_query_string)
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(cursor, expected_cursor)
            self.assertEqual(limit, expected_limit)
            self.assertEqual(sort, expected_sort)
            self.assertEqual(ids_only, True)
            self.assertEqual(retries, 3)

            return doc_ids, expected_result_cursor

        with self.swap(gae_search_services, 'search', mock_search):
            result, cursor = search_services.search_collections(
                expected_query_string,
                expected_limit,
                sort=expected_sort,
                cursor=expected_cursor,
            )

        self.assertEqual(cursor, expected_result_cursor)
        self.assertEqual(result, doc_ids)

    def test_patch_collection_search_document(self):

        def mock_get_doc(doc_id, index):
            self.assertEqual(doc_id, self.COLLECTION_ID)
            self.assertEqual(
                index, search_services.SEARCH_INDEX_COLLECTIONS)
            return {'a': 'b', 'c': 'd'}

        def mock_add_docs(docs, index):
            self.assertEqual(
                index, search_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(docs, [{'a': 'b', 'c': 'e', 'f': 'g'}])

        get_doc_swap = self.swap(
            gae_search_services, 'get_document_from_index', mock_get_doc)

        add_docs_counter = test_utils.CallCounter(mock_add_docs)
        add_docs_swap = self.swap(
            gae_search_services, 'add_documents_to_index', add_docs_counter)

        with get_doc_swap, add_docs_swap:
            patch = {'c': 'e', 'f': 'g'}
            search_services.patch_collection_search_document(
                self.COLLECTION_ID, patch)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_update_private_collection_status_in_search(self):

        def mock_delete_docs(ids, index):
            self.assertEqual(ids, [self.COLLECTION_ID])
            self.assertEqual(
                index, search_services.SEARCH_INDEX_COLLECTIONS)

        def mock_get_rights(unused_collection_id):
            return rights_manager.ActivityRights(
                self.COLLECTION_ID, [self.owner_id], [self.editor_id],
                [self.translator_id], [self.viewer_id],
                status=rights_manager.ACTIVITY_STATUS_PRIVATE
            )

        delete_docs_counter = test_utils.CallCounter(mock_delete_docs)

        delete_docs_swap = self.swap(
            gae_search_services, 'delete_documents_from_index',
            delete_docs_counter)
        get_rights_swap = self.swap(
            rights_manager, 'get_collection_rights', mock_get_rights)

        with get_rights_swap, delete_docs_swap:
            search_services.update_collection_status_in_search(
                self.COLLECTION_ID)

        self.assertEqual(delete_docs_counter.times_called, 1)

    def test_demo_collections_are_added_to_search_index(self):
        results = search_services.search_collections('Welcome', 2)[0]
        self.assertEqual(results, [])

        collection_services.load_demo('0')
        results = search_services.search_collections('Welcome', 2)[0]
        self.assertEqual(results, ['0'])

    def test_demo_explorations_are_added_to_search_index(self):
        results, _ = search_services.search_explorations('Welcome', 2)
        self.assertEqual(results, [])

        exp_services.load_demo('0')
        results, _ = search_services.search_explorations('Welcome', 2)
        self.assertEqual(results, ['0'])

    def test_update_private_exploration_status_in_search(self):

        def mock_delete_docs(ids, index):
            self.assertEqual(ids, [self.EXP_ID])
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)

        def mock_get_rights(unused_exp_id):
            return rights_manager.ActivityRights(
                self.EXP_ID, [self.owner_id], [self.editor_id],
                [self.translator_id], [self.viewer_id],
                status=rights_manager.ACTIVITY_STATUS_PRIVATE
            )

        delete_docs_counter = test_utils.CallCounter(mock_delete_docs)

        delete_docs_swap = self.swap(
            gae_search_services, 'delete_documents_from_index',
            delete_docs_counter)
        get_rights_swap = self.swap(
            rights_manager, 'get_exploration_rights', mock_get_rights)

        with get_rights_swap, delete_docs_swap:
            search_services.update_exploration_status_in_search(self.EXP_ID)

        self.assertEqual(delete_docs_counter.times_called, 1)
