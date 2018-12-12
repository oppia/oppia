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

"""Unit tests for core.domain.collection_services."""

import datetime

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(collection_models, user_models) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.user])
gae_search_services = models.Registry.import_search_services()
transaction_services = models.Registry.import_transaction_services()


# TODO(bhenning): test CollectionSummaryModel changes if collections are
# updated, reverted, deleted, created, rights changed. See TODO at the top of
# exp_services_test for more original context.

# pylint: disable=protected-access
def _count_at_least_editable_collection_summaries(user_id):
    return len(collection_services._get_collection_summary_dicts_from_models(
        collection_models.CollectionSummaryModel.get_at_least_editable(
            user_id=user_id)))


class CollectionServicesUnitTests(test_utils.GenericTestBase):
    """Test the collection services module."""

    COLLECTION_ID = 'A_collection_id'

    def setUp(self):
        """Before each individual test, create dummy users."""
        super(CollectionServicesUnitTests, self).setUp()

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

        self.owner = user_services.UserActionsInfo(self.owner_id)


class CollectionQueriesUnitTests(CollectionServicesUnitTests):
    """Tests query methods."""

    def test_get_collection_titles_and_categories(self):
        self.assertEqual(
            collection_services.get_collection_titles_and_categories([]), {})

        self.save_new_default_collection('A', self.owner_id, title='TitleA')
        self.assertEqual(
            collection_services.get_collection_titles_and_categories(['A']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA'
                }
            })

        self.save_new_default_collection('B', self.owner_id, title='TitleB')
        self.assertEqual(
            collection_services.get_collection_titles_and_categories(
                ['A']), {
                    'A': {
                        'category': 'A category',
                        'title': 'TitleA'
                    }
                })
        self.assertEqual(
            collection_services.get_collection_titles_and_categories(
                ['A', 'B']), {
                    'A': {
                        'category': 'A category',
                        'title': 'TitleA',
                    },
                    'B': {
                        'category': 'A category',
                        'title': 'TitleB',
                    },
                })
        self.assertEqual(
            collection_services.get_collection_titles_and_categories(
                ['A', 'C']), {
                    'A': {
                        'category': 'A category',
                        'title': 'TitleA'
                    }
                })


class CollectionProgressUnitTests(CollectionServicesUnitTests):
    """Tests functions which deal with any progress a user has made within a
    collection, including query and recording methods related to explorations
    which are played in the context of the collection.
    """

    COL_ID_0 = '0_collection_id'
    COL_ID_1 = '1_collection_id'
    EXP_ID_0 = '0_exploration_id'
    EXP_ID_1 = '1_exploration_id'
    EXP_ID_2 = '2_exploration_id'

    def _get_progress_model(self, user_id, collection_id):
        return user_models.CollectionProgressModel.get(user_id, collection_id)

    def _record_completion(self, user_id, collection_id, exploration_id):
        collection_services.record_played_exploration_in_collection_context(
            user_id, collection_id, exploration_id)

    def setUp(self):
        super(CollectionProgressUnitTests, self).setUp()

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            self.COL_ID_0, self.owner_id, exploration_id=self.EXP_ID_0)

        # Create another two explorations and add them to the collection.
        for exp_id in [self.EXP_ID_1, self.EXP_ID_2]:
            self.save_new_valid_exploration(exp_id, self.owner_id)
            collection_services.update_collection(
                self.owner_id, self.COL_ID_0, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': exp_id
                }], 'Added new exploration')

    def test_get_completed_exploration_ids(self):
        # There should be no exception if the user or collection do not exist;
        # it should also return an empty list in both of these situations.
        self.assertEqual(collection_services.get_completed_exploration_ids(
            'Fake', self.COL_ID_0), [])
        self.assertEqual(collection_services.get_completed_exploration_ids(
            self.owner_id, 'Fake'), [])

        # If no model exists, there should be no completed exploration IDs.
        self.assertIsNone(
            self._get_progress_model(self.owner_id, self.COL_ID_0))
        self.assertEqual(collection_services.get_completed_exploration_ids(
            self.owner_id, self.COL_ID_0), [])

        # If the first exploration is completed, it should be reported.
        self._record_completion(self.owner_id, self.COL_ID_0, self.EXP_ID_0)
        self.assertIsNotNone(
            self._get_progress_model(self.owner_id, self.COL_ID_0))
        self.assertEqual(collection_services.get_completed_exploration_ids(
            self.owner_id, self.COL_ID_0), [self.EXP_ID_0])

        # If all explorations are completed, all of them should be reported.
        # Also, they should be reported in the order they were completed.
        self._record_completion(self.owner_id, self.COL_ID_0, self.EXP_ID_2)
        self._record_completion(self.owner_id, self.COL_ID_0, self.EXP_ID_1)
        self.assertEqual(
            collection_services.get_completed_exploration_ids(
                self.owner_id, self.COL_ID_0),
            [self.EXP_ID_0, self.EXP_ID_2, self.EXP_ID_1])

    def test_get_next_exploration_id_to_complete_by_user(self):
        # This is an integration test depending on
        # get_completed_exploration_ids and logic interal to collection_domain
        # which is tested in isolation in collection_domain_test.

        # If the user doesn't exist, assume they haven't made any progress on
        # the collection. This means the initial explorations should be
        # suggested.
        self.assertEqual(
            collection_services.get_next_exploration_id_to_complete_by_user(
                'Fake', self.COL_ID_0), self.EXP_ID_0)

        # There should be an exception if the collection does not exist.
        with self.assertRaises(Exception):
            collection_services.get_next_exploration_id_to_complete_by_user(
                self.owner_id, 'Fake')

        # If the user hasn't made any progress in the collection yet, only the
        # initial explorations should be suggested.
        self.assertEqual(
            collection_services.get_collection_by_id(
                self.COL_ID_0).first_exploration_id,
            self.EXP_ID_0)
        self.assertEqual(
            collection_services.get_next_exploration_id_to_complete_by_user(
                self.owner_id, self.COL_ID_0), self.EXP_ID_0)

        # If the user completes the first exploration, a new one should be
        # recommended and the old one should no longer be recommended.
        self._record_completion(self.owner_id, self.COL_ID_0, self.EXP_ID_0)
        self.assertEqual(
            collection_services.get_next_exploration_id_to_complete_by_user(
                self.owner_id, self.COL_ID_0), self.EXP_ID_1)

        # Completing all of the explorations should yield no other explorations
        # to suggest.
        self._record_completion(self.owner_id, self.COL_ID_0, self.EXP_ID_1)
        self._record_completion(self.owner_id, self.COL_ID_0, self.EXP_ID_2)
        self.assertEqual(
            collection_services.get_next_exploration_id_to_complete_by_user(
                self.owner_id, self.COL_ID_0), None)

    def test_record_played_exploration_in_collection_context(self):
        # Ensure that exploration played within the context of a collection are
        # recorded correctly. This test actually validates both
        # test_get_completed_exploration_ids and
        # test_get_next_exploration_ids_to_complete_by_user.

        # By default, no completion model should exist for a given user and
        # collection.
        completion_model = self._get_progress_model(
            self.owner_id, self.COL_ID_0)
        self.assertIsNone(completion_model)

        # If the user 'completes an exploration', the model should record it.
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_0, self.EXP_ID_0)

        completion_model = self._get_progress_model(
            self.owner_id, self.COL_ID_0)
        self.assertIsNotNone(completion_model)
        self.assertEqual(
            completion_model.completed_explorations, [
                self.EXP_ID_0])

        # If the same exploration is completed again within the context of this
        # collection, it should not be duplicated.
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_0, self.EXP_ID_0)
        completion_model = self._get_progress_model(
            self.owner_id, self.COL_ID_0)
        self.assertEqual(
            completion_model.completed_explorations, [
                self.EXP_ID_0])

        # If the same exploration and another are completed within the context
        # of a different collection, it shouldn't affect this one.
        self.save_new_default_collection(self.COL_ID_1, self.owner_id)
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_1, self.EXP_ID_0)
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_1, self.EXP_ID_1)
        completion_model = self._get_progress_model(
            self.owner_id, self.COL_ID_0)
        self.assertEqual(
            completion_model.completed_explorations, [
                self.EXP_ID_0])

        # If two more explorations are completed, they are recorded in the
        # order they are completed.
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_0, self.EXP_ID_2)
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_0, self.EXP_ID_1)
        completion_model = self._get_progress_model(
            self.owner_id, self.COL_ID_0)
        self.assertEqual(
            completion_model.completed_explorations, [
                self.EXP_ID_0, self.EXP_ID_2, self.EXP_ID_1])


class CollectionSummaryQueriesUnitTests(CollectionServicesUnitTests):
    """Tests collection query methods which operate on CollectionSummary
    objects.
    """
    COL_ID_0 = '0_arch_bridges_in_england'
    COL_ID_1 = '1_welcome_introduce_oppia'
    COL_ID_2 = '2_welcome_introduce_oppia_interactions'
    COL_ID_3 = '3_welcome'
    COL_ID_4 = '4_languages_learning_basic_verbs_in_spanish'
    COL_ID_5 = '5_languages_private_collection_in_spanish'

    def setUp(self):
        super(CollectionSummaryQueriesUnitTests, self).setUp()

        # Setup the collections to fit into 2 different categoriers. Ensure 2 of
        # them have similar titles.
        self.save_new_default_collection(
            self.COL_ID_0, self.owner_id, title='Bridges in England',
            category='Architecture')
        self.save_new_default_collection(
            self.COL_ID_1, self.owner_id, title='Introduce Oppia',
            category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_2, self.owner_id,
            title='Introduce Interactions in Oppia', category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_3, self.owner_id, title='Welcome', category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_4, self.owner_id,
            title='Learning basic verbs in Spanish', category='Languages')
        self.save_new_default_collection(
            self.COL_ID_5, self.owner_id,
            title='Private collection in Spanish', category='Languages')

        # Publish collections 0-4. Private collections should not show up in
        # a search query, even if they're indexed.
        rights_manager.publish_collection(self.owner, self.COL_ID_0)
        rights_manager.publish_collection(self.owner, self.COL_ID_1)
        rights_manager.publish_collection(self.owner, self.COL_ID_2)
        rights_manager.publish_collection(self.owner, self.COL_ID_3)
        rights_manager.publish_collection(self.owner, self.COL_ID_4)

        # Add the collections to the search index.
        collection_services.index_collections_given_ids([
            self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
            self.COL_ID_4])


    def _create_search_query(self, terms, categories):
        query = ' '.join(terms)
        if categories:
            query += ' category=(' + ' OR '.join([
                '"%s"' % category for category in categories]) + ')'
        return query

    def test_get_collection_summaries_with_no_query(self):
        # An empty query should return all collections.
        (col_ids, search_cursor) = (
            collection_services.get_collection_ids_matching_query(''))
        self.assertEqual(sorted(col_ids), [
            self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
            self.COL_ID_4
        ])
        self.assertIsNone(search_cursor)

    def test_get_collection_summaries_with_deleted_collections(self):
        # Ensure a deleted collection does not show up in search results.
        collection_services.delete_collection(self.owner_id, self.COL_ID_0)
        collection_services.delete_collection(self.owner_id, self.COL_ID_2)
        collection_services.delete_collection(self.owner_id, self.COL_ID_4)

        col_ids = (
            collection_services.get_collection_ids_matching_query(''))[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_3])

        collection_services.delete_collection(self.owner_id, self.COL_ID_1)
        collection_services.delete_collection(self.owner_id, self.COL_ID_3)

        # If no collections are loaded, a blank query should not get any
        # collections.
        self.assertEqual(
            collection_services.get_collection_ids_matching_query(''),
            ([], None))

    def test_search_collection_summaries(self):
        # Search within the 'Architecture' category.
        col_ids = (
            collection_services.get_collection_ids_matching_query(
                self._create_search_query([], ['Architecture'])))[0]
        self.assertEqual(col_ids, [self.COL_ID_0])

        # Search for collections containing 'Oppia'.
        col_ids = (
            collection_services.get_collection_ids_matching_query(
                self._create_search_query(['Oppia'], [])))[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_2])

        # Search for collections containing 'Oppia' and 'Introduce'.
        col_ids = (
            collection_services.get_collection_ids_matching_query(
                self._create_search_query(['Oppia', 'Introduce'], [])))[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_2])

        # Search for collections containing 'England'.
        col_ids = (
            collection_services.get_collection_ids_matching_query(
                self._create_search_query(['England'], [])))[0]
        self.assertEqual(col_ids, [self.COL_ID_0])

        # Search for collections containing 'in'.
        col_ids = (
            collection_services.get_collection_ids_matching_query(
                self._create_search_query(['in'], [])))[0]
        self.assertEqual(
            sorted(col_ids), [self.COL_ID_0, self.COL_ID_2, self.COL_ID_4])

        # Search for collections containing 'in' in the 'Architecture' and
        # 'Welcome' categories.
        col_ids = (
            collection_services.get_collection_ids_matching_query(
                self._create_search_query(
                    ['in'], ['Architecture', 'Welcome'])))[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_0, self.COL_ID_2])

    def test_collection_summaries_pagination_in_filled_search_results(self):
        # Ensure the maximum number of collections that can fit on the search
        # results page is maintained by the summaries function.
        with self.swap(feconf, 'SEARCH_RESULTS_PAGE_SIZE', 2):
            # Need to load 3 pages to find all of the collections. Since the
            # returned order is arbitrary, we need to concatenate the results
            # to ensure all collections are returned. We validate the correct
            # length is returned each time.
            found_col_ids = []

            # Page 1: 2 initial collections.
            (col_ids, search_cursor) = (
                collection_services.get_collection_ids_matching_query(
                    ''))
            self.assertEqual(len(col_ids), 2)
            self.assertIsNotNone(search_cursor)
            found_col_ids += col_ids

            # Page 2: 2 more collections.
            (col_ids, search_cursor) = (
                collection_services.get_collection_ids_matching_query(
                    '', cursor=search_cursor))
            self.assertEqual(len(col_ids), 2)
            self.assertIsNotNone(search_cursor)
            found_col_ids += col_ids

            # Page 3: 1 final collection.
            (col_ids, search_cursor) = (
                collection_services.get_collection_ids_matching_query(
                    '', cursor=search_cursor))
            self.assertEqual(len(col_ids), 1)
            self.assertIsNone(search_cursor)
            found_col_ids += col_ids

            # Validate all collections were seen.
            self.assertEqual(sorted(found_col_ids), [
                self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
                self.COL_ID_4])


class CollectionCreateAndDeleteUnitTests(CollectionServicesUnitTests):
    """Test creation and deletion methods."""

    def test_retrieval_of_collections(self):
        """Test the get_collection_by_id() method."""
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            collection_services.get_collection_by_id('fake_eid')

        collection = self.save_new_default_collection(
            self.COLLECTION_ID, self.owner_id)
        retrieved_collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.id, retrieved_collection.id)
        self.assertEqual(collection.title, retrieved_collection.title)

        with self.assertRaises(Exception):
            collection_services.get_collection_by_id('fake_collection')

    def test_retrieval_of_multiple_collection(self):
        collections = {}
        chars = 'abcde'
        collection_ids = ['%s%s' % (self.COLLECTION_ID, c) for c in chars]
        for _id in collection_ids:
            collection = self.save_new_valid_collection(_id, self.owner_id)
            collections[_id] = collection

        result = collection_services.get_multiple_collections_by_id(
            collection_ids)
        for _id in collection_ids:
            self.assertEqual(result.get(_id).title, collections.get(_id).title)

        # Test retrieval of non-existent ids.
        result = collection_services.get_multiple_collections_by_id(
            collection_ids + ['doesnt_exist'], strict=False
        )
        for _id in collection_ids:
            self.assertEqual(result.get(_id).title, collections.get(_id).title)

        self.assertNotIn('doesnt_exist', result)

        with self.assertRaises(Exception):
            collection_services.get_multiple_collection_by_id(
                collection_ids + ['doesnt_exist'])

    def test_soft_deletion_of_collections(self):
        """Test that soft deletion of collections works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)
        # The collection shows up in queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.owner_id), 1)

        collection_services.delete_collection(
            self.owner_id, self.COLLECTION_ID)
        with self.assertRaises(Exception):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # The deleted collection does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.owner_id), 0)

        # But the models still exist in the backend.
        self.assertIn(
            self.COLLECTION_ID, [
                collection.id
                for collection in collection_models.CollectionModel.get_all(
                    include_deleted=True)])

        # The collection summary is deleted, however.
        self.assertNotIn(
            self.COLLECTION_ID, [
                collection.id
                for collection in
                collection_models.CollectionSummaryModel.get_all(
                    include_deleted=True)])

    def test_hard_deletion_of_collections(self):
        """Test that hard deletion of collections works correctly."""
        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)
        # The collection shows up in queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.owner_id), 1)

        collection_services.delete_collection(
            self.owner_id, self.COLLECTION_ID, force_deletion=True)
        with self.assertRaises(Exception):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # The deleted collection does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.owner_id), 0)

        # The collection model has been purged from the backend.
        self.assertNotIn(
            self.COLLECTION_ID, [
                collection.id
                for collection in collection_models.CollectionModel.get_all(
                    include_deleted=True)])

    def test_summaries_of_hard_deleted_collections(self):
        """Test that summaries of hard deleted collections are
        correctly deleted.
        """
        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)

        collection_services.delete_collection(
            self.owner_id, self.COLLECTION_ID, force_deletion=True)
        with self.assertRaises(Exception):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # The deleted collection summary does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.owner_id), 0)

        # The collection summary model has been purged from the backend.
        self.assertNotIn(
            self.COLLECTION_ID, [
                collection.id
                for collection in
                collection_models.CollectionSummaryModel.get_all(
                    include_deleted=True)])

    def test_collections_are_removed_from_index_when_deleted(self):
        """Tests that deleted collections are removed from the search index."""

        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)

        def mock_delete_docs(doc_ids, index):
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(doc_ids, [self.COLLECTION_ID])

        delete_docs_swap = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            mock_delete_docs)

        with delete_docs_swap:
            collection_services.delete_collection(
                self.owner_id, self.COLLECTION_ID)

    def test_create_new_collection(self):
        # Test that creating a new collection (with an empty title, etc.)
        # succeeds.
        collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID)

    def test_save_and_retrieve_collection(self):
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id)
        collection_services._save_collection(
            self.owner_id, collection, '',
            _get_collection_change_list('title', ''))

        retrieved_collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(retrieved_collection.title, 'A title')
        self.assertEqual(retrieved_collection.category, 'A category')
        self.assertEqual(len(retrieved_collection.nodes), 1)

    def test_save_and_retrieve_collection_summary(self):
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id)
        collection_services._save_collection(
            self.owner_id, collection, '',
            _get_collection_change_list('title', ''))

        # Change the collection's title and category properties.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID,
            [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'A new title'
            }, {
                'cmd': 'edit_collection_property',
                'property_name': 'category',
                'new_value': 'A new category'
            }],
            'Change title and category')

        retrieved_collection_summary = (
            collection_services.get_collection_summary_by_id(
                self.COLLECTION_ID))

        self.assertEqual(
            retrieved_collection_summary.contributor_ids,
            [self.owner_id])
        self.assertEqual(retrieved_collection_summary.title, 'A new title')
        self.assertEqual(
            retrieved_collection_summary.category, 'A new category')

    def test_update_collection_by_migration_bot(self):
        exp_id = 'exp_id'
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=exp_id)
        rights_manager.publish_exploration(self.owner, exp_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        # This should not give an error.
        collection_services.update_collection(
            feconf.MIGRATION_BOT_USER_ID, self.COLLECTION_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Did migration.')

        # Check that the version of the collection is incremented.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.version, 2)


class LoadingAndDeletionOfCollectionDemosTests(CollectionServicesUnitTests):

    def test_loading_and_validation_and_deletion_of_demo_collections(self):
        """Test loading, validation and deletion of the demo collections."""
        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(), 0)

        self.assertGreaterEqual(
            len(feconf.DEMO_COLLECTIONS), 1,
            msg='There must be at least one demo collection.')
        for collection_id in feconf.DEMO_COLLECTIONS:
            start_time = datetime.datetime.utcnow()

            collection_services.load_demo(collection_id)
            collection = collection_services.get_collection_by_id(
                collection_id)
            collection.validate()

            duration = datetime.datetime.utcnow() - start_time
            processing_time = duration.seconds + duration.microseconds / 1E6
            self.log_line(
                'Loaded and validated collection %s (%.2f seconds)' %
                (collection.title.encode('utf-8'), processing_time))

        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(),
            len(feconf.DEMO_COLLECTIONS))

        for collection_id in feconf.DEMO_COLLECTIONS:
            collection_services.delete_demo(collection_id)
        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(), 0)


class UpdateCollectionNodeTests(CollectionServicesUnitTests):
    """Test updating a single collection node."""

    EXPLORATION_ID = 'exp_id_0'
    COLLECTION_TITLE = 'title'
    COLLECTION_CATEGORY = 'category'
    COLLECTION_OBJECTIVE = 'objective'

    def setUp(self):
        super(UpdateCollectionNodeTests, self).setUp()
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXPLORATION_ID)

    def test_add_node(self):
        # Verify the initial collection only has 1 exploration in it.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.exploration_ids, [self.EXPLORATION_ID])

        new_exp_id = 'new_exploration_id'
        self.save_new_valid_exploration(new_exp_id, self.owner_id)
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': new_exp_id
            }], 'Added new exploration')

        # Verify the new exploration was added.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(
            collection.exploration_ids, [self.EXPLORATION_ID, new_exp_id])

    def test_add_node_with_non_existent_exploration(self):
        non_existent_exp_id = 'non_existent_exploration_id'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected collection to only reference valid explorations'):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_ID, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': non_existent_exp_id
                }], 'Added non-existent exploration')

    def test_add_node_with_private_exploration_in_public_collection(self):
        """Ensures public collections cannot reference private explorations."""

        private_exp_id = 'private_exp_id0'
        self.save_new_valid_exploration(private_exp_id, self.owner_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        self.assertTrue(
            rights_manager.is_collection_public(self.COLLECTION_ID))
        self.assertTrue(rights_manager.is_exploration_private(private_exp_id))
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Cannot reference a private exploration within a public '
            'collection'):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_ID, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': private_exp_id
                }], 'Added private exploration')

    def test_add_node_with_public_exploration_in_private_collection(self):
        """Ensures private collections can reference public and private
        explorations.
        """
        public_exp_id = 'public_exp_id0'
        private_exp_id = 'private_exp_id0'
        self.save_new_valid_exploration(public_exp_id, self.owner_id)
        self.save_new_valid_exploration(private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, public_exp_id)

        self.assertTrue(
            rights_manager.is_collection_private(self.COLLECTION_ID))
        self.assertTrue(rights_manager.is_exploration_public(public_exp_id))
        self.assertTrue(rights_manager.is_exploration_private(private_exp_id))

        # No exception should be raised for either insertion.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': public_exp_id
            }, {
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': private_exp_id
            }], 'Added public and private explorations')

    def test_delete_node(self):
        # Verify the initial collection only has 1 exploration in it.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.exploration_ids, [self.EXPLORATION_ID])

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_DELETE_COLLECTION_NODE,
                'exploration_id': self.EXPLORATION_ID,
            }], 'Deleted exploration')

        # Verify the exploration was deleted (the collection is now empty).
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.nodes, [])

    def test_update_collection_title(self):
        # Verify initial title.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.title, self.COLLECTION_TITLE)

        # Update the title.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Some new title'
            }], 'Changed the title')

        # Verify the title is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.title, 'Some new title')

    def test_update_collection_category(self):
        # Verify initial category.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.category, self.COLLECTION_CATEGORY)

        # Update the category.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'category',
                'new_value': 'Some new category'
            }], 'Changed the category')

        # Verify the category is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.category, 'Some new category')

    def test_update_collection_objective(self):
        # Verify initial objective.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.objective, self.COLLECTION_OBJECTIVE)

        # Update the objective.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'objective',
                'new_value': 'Some new objective'
            }], 'Changed the objective')

        # Verify the objective is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.objective, 'Some new objective')

    def test_update_collection_language_code(self):
        # Verify initial language code.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.language_code, 'en')

        # Update the language code.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'language_code',
                'new_value': 'fi'
            }], 'Changed the language to Finnish')

        # Verify the language is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.language_code, 'fi')

    def test_update_collection_tags(self):
        # Verify initial tags.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.tags, [])

        # Update the tags.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'tags',
                'new_value': ['test']
            }], 'Add a new tag')

        # Verify that the tags are different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.tags, ['test'])

        # Verify that error will be thrown when duplicate tags are introduced.
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected tags to be unique, but found duplicates'):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_ID, [{
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': 'tags',
                    'new_value': ['duplicate', 'duplicate']
                }], 'Add a new tag')


def _get_node_change_list(exploration_id, property_name, new_value):
    """Generates a change list for a single collection node change."""
    return [{
        'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
        'exploration_id': exploration_id,
        'property_name': property_name,
        'new_value': new_value
    }]


def _get_collection_change_list(property_name, new_value):
    """Generates a change list for a single collection property change."""
    return [{
        'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
        'property_name': property_name,
        'new_value': new_value
    }]


def _get_added_exploration_change_list(exploration_id):
    """Generates a change list for adding an exploration to a collection."""
    return [{
        'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
        'exploration_id': exploration_id
    }]


def _get_deleted_exploration_change_list(exploration_id):
    """Generates a change list for deleting an exploration from a collection."""
    return [{
        'cmd': collection_domain.CMD_DELETE_COLLECTION_NODE,
        'exploration_id': exploration_id
    }]


class CommitMessageHandlingTests(CollectionServicesUnitTests):
    """Test the handling of commit messages."""

    EXP_ID = 'an_exploration_id'

    def setUp(self):
        super(CommitMessageHandlingTests, self).setUp()
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=self.EXP_ID)

    def test_record_commit_message(self):
        """Check published collections record commit messages."""
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), 'A message')

        self.assertEqual(
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID)[1]['commit_message'],
            'A message')

    def test_demand_commit_message(self):
        """Check published collections demand commit messages."""
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        with self.assertRaisesRegexp(
            ValueError,
            'Collection is public so expected a commit message but '
            'received none.'
            ):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_ID, _get_collection_change_list(
                    collection_domain.COLLECTION_PROPERTY_TITLE,
                    'New Title'), '')

    def test_unpublished_collections_can_accept_commit_message(self):
        """Test unpublished collections can accept optional commit messages."""

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), 'A message')

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), '')

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), None)


class CollectionSnapshotUnitTests(CollectionServicesUnitTests):
    """Test methods relating to collection snapshots."""

    SECOND_USERNAME = 'abc123'
    SECOND_EMAIL = 'abc123@gmail.com'

    def test_get_collection_snapshots_metadata(self):
        self.signup(self.SECOND_EMAIL, self.SECOND_USERNAME)
        second_committer_id = self.get_user_id_from_email(self.SECOND_EMAIL)

        exp_id = 'exp_id0'
        v1_collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=exp_id)

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category',
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on_ms', snapshots_metadata[0])

        # Publish the collection and any explorations contained within it. This
        # does not affect the collection version history.
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)
        rights_manager.publish_exploration(self.owner, exp_id)

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 1)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on_ms', snapshots_metadata[0])

        # Modify the collection. This affects the collection version history.
        change_list = [{
            'cmd': 'edit_collection_property',
            'property_name': 'title',
            'new_value': 'First title'
        }]
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, change_list, 'Changed title.')

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 2)
        self.assertIn('created_on_ms', snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list,
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertLess(
            snapshots_metadata[0]['created_on_ms'],
            snapshots_metadata[1]['created_on_ms'])

        # Using the old version of the collection should raise an error.
        with self.assertRaisesRegexp(Exception, 'version 1, which is too old'):
            collection_services._save_collection(
                second_committer_id, v1_collection, '',
                _get_collection_change_list('title', ''))

        # Another person modifies the collection.
        new_change_list = [{
            'cmd': 'edit_collection_property',
            'property_name': 'title',
            'new_value': 'New title'
        }]
        collection_services.update_collection(
            second_committer_id, self.COLLECTION_ID, new_change_list,
            'Second commit.')

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset({
            'commit_cmds': [{
                'cmd': 'create_new',
                'title': 'A title',
                'category': 'A category'
            }],
            'committer_id': self.owner_id,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list,
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertDictContainsSubset({
            'commit_cmds': new_change_list,
            'committer_id': second_committer_id,
            'commit_message': 'Second commit.',
            'commit_type': 'edit',
            'version_number': 3,
        }, snapshots_metadata[2])
        self.assertLess(
            snapshots_metadata[1]['created_on_ms'],
            snapshots_metadata[2]['created_on_ms'])

    def test_versioning_with_add_and_delete_nodes(self):
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id)

        collection.title = 'First title'
        collection_services._save_collection(
            self.owner_id, collection, 'Changed title.',
            _get_collection_change_list('title', 'First title'))
        commit_dict_2 = {
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'version_number': 2,
        }
        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 2)

        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        collection.add_node(
            self.save_new_valid_exploration(
                'new_exploration_id', self.owner_id).id)
        collection_services._save_collection(
            'committer_id_2', collection, 'Added new exploration',
            _get_added_exploration_change_list('new_exploration_id'))

        commit_dict_3 = {
            'committer_id': 'committer_id_2',
            'commit_message': 'Added new exploration',
            'version_number': 3,
        }
        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 3)
        self.assertDictContainsSubset(
            commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        for ind in range(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # Perform an invalid action: delete an exploration that does not exist.
        # This should not create a new version.
        with self.assertRaisesRegexp(
            ValueError, 'is not part of this collection'
            ):
            collection.delete_node('invalid_exploration_id')

        # Now delete the newly added exploration.
        collection.delete_node('new_exploration_id')
        collection_services._save_collection(
            'committer_id_3', collection, 'Deleted exploration',
            _get_deleted_exploration_change_list('new_exploration_id'))

        commit_dict_4 = {
            'committer_id': 'committer_id_3',
            'commit_message': 'Deleted exploration',
            'version_number': 4,
        }
        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID))
        self.assertEqual(len(snapshots_metadata), 4)
        self.assertDictContainsSubset(commit_dict_4, snapshots_metadata[3])
        self.assertDictContainsSubset(commit_dict_3, snapshots_metadata[2])
        self.assertDictContainsSubset(commit_dict_2, snapshots_metadata[1])
        for ind in range(len(snapshots_metadata) - 1):
            self.assertLess(
                snapshots_metadata[ind]['created_on_ms'],
                snapshots_metadata[ind + 1]['created_on_ms'])

        # The final collection should have exactly one collection node.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(len(collection.nodes), 1)


class CollectionCommitLogUnitTests(CollectionServicesUnitTests):
    """Test methods relating to the collection commit log."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    COLLECTION_ID_1 = 'cid1'
    COLLECTION_ID_2 = 'cid2'

    COMMIT_ALBERT_CREATE_COL_1 = {
        'username': ALBERT_NAME,
        'version': 1,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New collection created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_BOB_EDIT_COL_1 = {
        'username': BOB_NAME,
        'version': 2,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_CREATE_COL_2 = {
        'username': ALBERT_NAME,
        'version': 1,
        'collection_id': COLLECTION_ID_2,
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New collection created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_COL_1 = {
        'username': 'albert',
        'version': 3,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert1 title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_COL_2 = {
        'username': 'albert',
        'version': 2,
        'collection_id': COLLECTION_ID_2,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert2.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_DELETE_COL_1 = {
        'username': 'albert',
        'version': 4,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'delete',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': feconf.COMMIT_MESSAGE_COLLECTION_DELETED,
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_PUBLISH_COL_2 = {
        'username': 'albert',
        'version': None,
        'collection_id': COLLECTION_ID_2,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': False,
        'commit_message': 'collection published.',
        'post_commit_status': 'public'
    }

    def setUp(self):
        """Populate the database of collections to be queried against.

        The sequence of events is:
        - (1) Albert creates COLLECTION_ID_1.
        - (2) Bob edits the title of COLLECTION_ID_1.
        - (3) Albert creates COLLECTION_ID_2.
        - (4) Albert edits the title of COLLECTION_ID_1.
        - (5) Albert edits the title of COLLECTION_ID_2.
        - (6) Albert deletes COLLECTION_ID_1.
        - Bob tries to publish COLLECTION_ID_2, and is denied access.
        - (7) Albert publishes COLLECTION_ID_2.
        """
        super(CollectionCommitLogUnitTests, self).setUp()

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert = user_services.UserActionsInfo(self.albert_id)
        self.bob = user_services.UserActionsInfo(self.bob_id)

        # This needs to be done in a toplevel wrapper because the datastore
        # puts to the event log are asynchronous.
        @transaction_services.toplevel_wrapper
        def populate_datastore():
            collection_1 = self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.albert_id)

            collection_1.title = 'Exploration 1 title'
            collection_services._save_collection(
                self.bob_id, collection_1, 'Changed title.',
                _get_collection_change_list('title', 'Exploration 1 title'))

            collection_2 = self.save_new_valid_collection(
                self.COLLECTION_ID_2, self.albert_id)

            collection_1.title = 'Exploration 1 Albert title'
            collection_services._save_collection(
                self.albert_id, collection_1,
                'Changed title to Albert1 title.',
                _get_collection_change_list(
                    'title', 'Exploration 1 Albert title'))

            collection_2.title = 'Exploration 2 Albert title'
            collection_services._save_collection(
                self.albert_id, collection_2, 'Changed title to Albert2.',
                _get_collection_change_list(
                    'title', 'Exploration 2 Albert title'))

            collection_services.delete_collection(
                self.albert_id, self.COLLECTION_ID_1)

            # This commit should not be recorded.
            with self.assertRaisesRegexp(
                Exception, 'This collection cannot be published'
                ):
                rights_manager.publish_collection(
                    self.bob, self.COLLECTION_ID_2)

            rights_manager.publish_collection(
                self.albert, self.COLLECTION_ID_2)

        populate_datastore()


class CollectionSearchTests(CollectionServicesUnitTests):
    """Test collection search."""

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
        add_docs_swap = self.swap(
            gae_search_services,
            'add_documents_to_index',
            add_docs_counter)

        for ind in xrange(5):
            self.save_new_valid_collection(
                all_collection_ids[ind],
                self.owner_id,
                title=all_collection_titles[ind],
                category=all_collection_categories[ind])

        # We're only publishing the first 4 collections, so we're not
        # expecting the last collection to be indexed.
        for ind in xrange(4):
            rights_manager.publish_collection(
                self.owner, expected_collection_ids[ind])

        with add_docs_swap:
            collection_services.index_collections_given_ids(all_collection_ids)

        self.assertEqual(add_docs_counter.times_called, 1)


class CollectionSummaryTests(CollectionServicesUnitTests):
    """Test collection summaries."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    COLLECTION_ID_1 = 'cid1'
    COLLECTION_ID_2 = 'cid2'

    def test_is_editable_by(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)

        # Check that only the owner may edit.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertTrue(collection_summary.is_editable_by(
            user_id=self.owner_id))
        self.assertFalse(collection_summary.is_editable_by(
            user_id=self.editor_id))
        self.assertFalse(collection_summary.is_editable_by(
            user_id=self.viewer_id))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_collection(
            self.owner, self.COLLECTION_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            self.owner, self.COLLECTION_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertTrue(collection_summary.is_editable_by(
            user_id=self.owner_id))
        self.assertTrue(collection_summary.is_editable_by(
            user_id=self.editor_id))
        self.assertFalse(collection_summary.is_editable_by(
            user_id=self.viewer_id))

    def test_contributor_ids(self):
        # Sign up two users.
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        albert = user_services.UserActionsInfo(albert_id)

        # Have Albert create a collection.
        self.save_new_valid_collection(self.COLLECTION_ID, albert_id)
        # Have Bob edit the collection.
        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection Bob title'
        }]
        collection_services.update_collection(
            bob_id, self.COLLECTION_ID, changelist_cmds,
            'Changed title to Bob title.')
        # Albert adds an owner and an editor.
        rights_manager.assign_role_for_collection(
            albert, self.COLLECTION_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            albert, self.COLLECTION_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)
        # Verify that only Albert and Bob are listed as contributors for the
        # collection.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertEqual(
            collection_summary.contributor_ids,
            [albert_id, bob_id])

    def _check_contributors_summary(self, collection_id, expected):
        contributors_summary = collection_services.get_collection_summary_by_id(
            collection_id).contributors_summary
        self.assertEqual(expected, contributors_summary)

    def test_contributor_summary(self):
        albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # Have Albert create a new collection. Version 1.
        self.save_new_valid_collection(self.COLLECTION_ID, albert_id)
        self._check_contributors_summary(self.COLLECTION_ID, {albert_id: 1})
        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection Bob title'
        }]
        # Have Bob update that collection. Version 2.
        collection_services.update_collection(
            bob_id, self.COLLECTION_ID, changelist_cmds, 'Changed title.')
        self._check_contributors_summary(
            self.COLLECTION_ID,
            {albert_id: 1, bob_id: 1})
        # Have Bob update that collection. Version 3.
        collection_services.update_collection(
            bob_id, self.COLLECTION_ID, changelist_cmds, 'Changed title.')
        self._check_contributors_summary(
            self.COLLECTION_ID,
            {albert_id: 1, bob_id: 2})

        # Have Albert update that collection. Version 4.
        collection_services.update_collection(
            albert_id, self.COLLECTION_ID, changelist_cmds, 'Changed title.')
        self._check_contributors_summary(
            self.COLLECTION_ID,
            {albert_id: 2, bob_id: 2})

        # TODO(madiyar): uncomment after revert_collection implementation
        # Have Albert revert to version 3. Version 5
        # collection_services.revert_collection(albert_id,
        #       self.COLLECTION_ID, 4, 3)
        # self._check_contributors_summary(self.COLLECTION_ID,
        #                                 {albert_id: 1, bob_id: 2})


class GetCollectionAndCollectionRightsTests(CollectionServicesUnitTests):

    def test_get_collection_and_collection_rights_object(self):
        collection_id = self.COLLECTION_ID
        self.save_new_valid_collection(
            collection_id, self.owner_id, objective='The objective')

        (collection, collection_rights) = (
            collection_services.get_collection_and_collection_rights_by_id(
                collection_id))
        self.assertEqual(collection.id, collection_id)
        self.assertEqual(collection_rights.id, collection_id)

        (collection, collection_rights) = (
            collection_services.get_collection_and_collection_rights_by_id(
                'fake_id'))
        self.assertIsNone(collection)
        self.assertIsNone(collection_rights)
