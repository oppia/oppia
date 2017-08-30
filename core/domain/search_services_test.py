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

from core.tests import test_utils
from core.domain import search_services
from core.domain import exp_services
from core.domain import collection_services
from core.domain import rights_manager
from core.domain import rating_services
from core.domain import user_services
from core.platform import models

gae_search_services = models.Registry.import_search_services()

class SearchServicesUnitTests(test_utils.GenericTestBase):
    """Test the search services module"""
    EXP_ID = 'An_exploration_id'
    COLLECTION_ID = 'A_collection_id'

    def setUp(self):
        super(SearchServicesUnitTests, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        user_services.create_new_user(self.editor_id, self.EDITOR_EMAIL)
        user_services.create_new_user(self.viewer_id, self.VIEWER_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.set_admins([self.ADMIN_USERNAME])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.owner_a = user_services.UserActionsInfo(self.owner_id)

    def test_get_search_rank_from_exp_summary(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        base_search_rank = 20

        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        rights_manager.publish_exploration(self.owner_a, self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        rating_services.assign_rating_to_exploration(self.owner_id,
                                                     self.EXP_ID, 5)

        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 10)

        rating_services.assign_rating_to_exploration(self.user_id_admin,
                                                     self.EXP_ID, 2)

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
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank - 5)

        for i in xrange(50):
            rating_services.assign_rating_to_exploration(
                'user_id_%s' % i, self.EXP_ID, 1)

        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        # The rank will be at least 0.
        self.assertEqual(search_services.get_search_rank_from_exp_summary(
            exp_summary), 0)

    def test_get_collection_search_rank(self):
        self.save_new_valid_collection(self.COLLECTION_ID, self.owner_id)
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_ID)

        base_search_rank = 20
        self.assertEqual(
            search_services.get_collection_search_rank(collection_summary.id),
            base_search_rank)

        rights_manager.publish_collection(self.owner_a, self.COLLECTION_ID)

        self.assertEqual(
            search_services.get_collection_search_rank(collection_summary.id),
            base_search_rank + 30)

    def test_index_exploration_summaries(self):
        all_exploration_ids = ['id0', 'id1', 'id2', 'id3', 'id4']
        expected_exploration_ids = all_exploration_ids[:-1]
        all_exploration_titles = ['exp0', 'exp1', 'exp2', 'exp3', 'exp4']
        expected_exploration_titles = all_exploration_titles[:-1]
        all_exploration_categories = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4']
        expected_exploration_categories = all_exploration_categories[:-1]

        def mock_add_documents_to_index(docs, index):
            self.assertEqual(index, search_services.SEARCH_INDEX_EXPLORATIONS)
            ids = [doc['id'] for doc in docs]
            titles = [doc['title'] for doc in docs]
            categories = [doc['category'] for doc in docs]
            self.assertEqual(set(ids), set(expected_exploration_ids))
            self.assertEqual(set(titles), set(expected_exploration_titles))
            self.assertEqual(set(categories),
                             set(expected_exploration_categories))
            return ids

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(gae_search_services,
                                  'add_documents_to_index',
                                  add_docs_counter)
        for ind in xrange(5):
            self.save_new_valid_exploration(all_exploration_ids[ind],
                                            self.owner_id,
                                            all_exploration_titles[ind],
                                            category=
                                            all_exploration_categories[ind])
        all_exploration_summaries = [exp_services.get_exploration_summary_by_id(
            exp_id) for exp_id in all_exploration_ids]
        for ind in xrange(4):
            rights_manager.publish_exploration(self.owner_a,
                                               expected_exploration_ids[ind])
        with add_docs_swap:
            search_services.index_exploration_summaries(
                all_exploration_summaries)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_index_collection_summaries(self):
        all_collection_ids = ['id0', 'id1', 'id2', 'id3', 'id4']
        expected_collection_ids = all_collection_ids[:-1]
        all_collection_titles = ['col0', 'col1', 'col2', 'col3', 'col4']
        expected_collection_titles = all_collection_titles[:-1]
        all_collection_categories = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4']
        expected_collection_categories = all_collection_categories[:-1]

        def mock_add_documents_to_index(docs, index):
            self.assertEqual(index, search_services.SEARCH_INDEX_COLLECTIONS)
            ids = [doc['id'] for doc in docs]
            titles = [doc['title'] for doc in docs]
            categories = [doc['category'] for doc in docs]
            self.assertEqual(set(ids), set(expected_collection_ids))
            self.assertEqual(set(titles), set(expected_collection_titles))
            self.assertEqual(set(categories),
                             set(expected_collection_categories))
            return ids

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(gae_search_services,
                                  'add_documents_to_index',
                                  add_docs_counter)
        for ind in xrange(5):
            self.save_new_valid_collection(all_collection_ids[ind],
                                           self.owner_id,
                                           all_collection_titles[ind],
                                           category=all_collection_categories[
                                               ind])
        all_collection_summaries = [collection_services.
                                    get_collection_summary_by_id(exp_id) for
                                    exp_id in all_collection_ids]
        for ind in xrange(4):
            rights_manager.publish_collection(self.owner_a,
                                              expected_collection_ids[ind])
        with add_docs_swap:
            search_services.index_collection_summaries(all_collection_summaries)

        self.assertEqual(add_docs_counter.times_called, 1)
