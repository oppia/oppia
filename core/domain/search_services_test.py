# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

from core.domain import search_services
from core.domain import rights_manager
from core.domain import collection_services
from core.tests import test_utils

class SearchServicesUnitTests(test_utils.GenericTestBase):
    """Test the search services module"""

    COLLECTION_ID = "A_collection_id"

    def setUp(self):
        super(SearchServicesUnitTests, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_index_collections_given_ids(self):
        all_collection_ids = ['id0', 'id1', 'id2', 'id3', 'id4']
        expected_collection_ids = all_collection_ids[:-1]
        all_collection_titles = [
            'title 0', 'title 1', 'title 2', 'title 3', 'title 4']
        expected_collection_titles = all_collection_titles[:-1]
        all_collection_categories = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4']
        expected_collection_categories = all_collection_categories[:-1]

        def mock_add_documents_to_index(docs, index):
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            ids = [doc['id'] for doc in docs]
            titles = [doc['title'] for doc in docs]
            categories = [doc['category'] for doc in docs]
            self.assertEqual(set(ids), set(expected_collection_ids))
            self.assertEqual(set(titles), set(expected_collection_titles))
            self.assertEqual(
                set(categories), set(expected_collection_categories))
            return ids

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(search_services,
                                  'add_documents_to_index',
                                  add_docs_counter)

        for ind in xrange(5):
            self.save_new_valid_collection(
                all_collection_ids[ind],
                self.owner_id,
                all_collection_titles[ind],
                category=all_collection_categories[ind])

        # We're only publishing the first 4 collections, so we're not
        # expecting the last collection to be indexed.
        for ind in xrange(4):
            rights_manager.publish_collection(
                self.owner_id,
                expected_collection_ids[ind])

        with add_docs_swap:
            search_services.index_collections_given_ids(all_collection_ids)

        self.assertEqual(add_docs_counter.times_called, 1)
