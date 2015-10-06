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

__author__ = 'Ben Henning'

import copy
import datetime
import os

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import event_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
(collection_models,) = models.Registry.import_models([models.NAMES.collection])
search_services = models.Registry.import_search_services()
transaction_services = models.Registry.import_transaction_services()
from core.tests import test_utils
import feconf
import utils

# TODO(bhenning): test CollectionSummaryModel changes if collections are
# updated, reverted, deleted, created, rights changed. See TODO at the top of
# exp_services_test for more original context.

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

        self.OWNER_ID = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.VIEWER_ID = self.get_user_id_from_email(self.VIEWER_EMAIL)

        user_services.get_or_create_user(self.OWNER_ID, self.OWNER_EMAIL)
        user_services.get_or_create_user(self.EDITOR_ID, self.EDITOR_EMAIL)
        user_services.get_or_create_user(self.VIEWER_ID, self.VIEWER_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.set_admins([self.ADMIN_EMAIL])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)


class CollectionQueriesUnitTests(CollectionServicesUnitTests):
    """Tests query methods."""

    def test_get_collection_titles_and_categories(self):
        self.assertEqual(
            collection_services.get_collection_titles_and_categories([]), {})

        self.save_new_default_collection('A', self.OWNER_ID, 'TitleA')
        self.assertEqual(
            collection_services.get_collection_titles_and_categories(['A']), {
                'A': {
                    'category': 'A category',
                    'title': 'TitleA'
                }
            })

        self.save_new_default_collection('B', self.OWNER_ID, 'TitleB')
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


class CollectionSummaryQueriesUnitTests(CollectionServicesUnitTests):
    """Tests collection query methods which operate on CollectionSummary
    objects.
    """
    COL_ID_0 = '0_arch_bridges_in_england'
    COL_ID_1 = '1_welcome_introduce_oppia'
    COL_ID_2 = '2_welcome_introduce_oppia_interactions'
    COL_ID_3 = '3_welcome_gadgets'
    COL_ID_4 = '4_languages_learning_basic_verbs_in_spanish'
    COL_ID_5 = '5_languages_private_collection_in_spanish'

    def setUp(self):
        super(CollectionSummaryQueriesUnitTests, self).setUp()

        # Setup the collections to fit into 2 different categoriers. Ensure 2 of
        # them have similar titles.
        self.save_new_default_collection(
            self.COL_ID_0, self.OWNER_ID, title='Bridges in England',
            category='Architecture')
        self.save_new_default_collection(
            self.COL_ID_1, self.OWNER_ID, title='Introduce Oppia',
            category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_2, self.OWNER_ID,
            title='Introduce Interactions in Oppia', category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_3, self.OWNER_ID, title='Welcome to Gadgets',
            category='Welcome')
        self.save_new_default_collection(
            self.COL_ID_4, self.OWNER_ID,
            title='Learning basic verbs in Spanish', category='Languages')
        self.save_new_default_collection(
            self.COL_ID_5, self.OWNER_ID,
            title='Private collection in Spanish', category='Languages')

        # Publish collections 0-4. Private collections should not show up in
        # a search query, even if they're indexed.
        rights_manager.publish_collection(self.OWNER_ID, self.COL_ID_0)
        rights_manager.publish_collection(self.OWNER_ID, self.COL_ID_1)
        rights_manager.publish_collection(self.OWNER_ID, self.COL_ID_2)
        rights_manager.publish_collection(self.OWNER_ID, self.COL_ID_3)
        rights_manager.publish_collection(self.OWNER_ID, self.COL_ID_4)

        # Add the collections to the search index.
        collection_services.index_collections_given_ids([
            self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
            self.COL_ID_4])

    def _summaries_to_ids(self, col_summaries):
        return sorted([col_summary.id for col_summary in col_summaries])

    def _create_search_query(self, terms, categories):
        query = ' '.join(terms)
        if categories:
            query += ' category=(' + ' OR '.join([
                '"%s"' % category for category in categories]) + ')'
        return query

    def test_get_collection_summaries_with_no_query(self):
        # An empty query should return all collections.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(''))
        self.assertEqual(self._summaries_to_ids(col_summaries), [
            self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
            self.COL_ID_4
        ]);
        self.assertIsNone(search_cursor)

    def test_get_collection_summaries_with_deleted_collections(self):
        # Ensure a deleted collection does not show up in search results.
        collection_services.delete_collection(self.OWNER_ID, self.COL_ID_0)
        collection_services.delete_collection(self.OWNER_ID, self.COL_ID_2)
        collection_services.delete_collection(self.OWNER_ID, self.COL_ID_4)

        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(''))
        self.assertEqual(
            self._summaries_to_ids(col_summaries),
            [self.COL_ID_1, self.COL_ID_3])

        collection_services.delete_collection(self.OWNER_ID, self.COL_ID_1)
        collection_services.delete_collection(self.OWNER_ID, self.COL_ID_3)

        # If no collections are loaded, a blank query should not get any
        # collections.
        self.assertEqual(
            collection_services.get_collection_summaries_matching_query(''),
            ([], None))

    def test_search_collection_summaries(self):
        # Search within the 'Architecture' category.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(
                self._create_search_query([], ['Architecture'])))
        self.assertEqual(
            self._summaries_to_ids(col_summaries), [self.COL_ID_0])

        # Search for collections containing 'Oppia'.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(
                self._create_search_query(['Oppia'], [])))
        self.assertEqual(
            self._summaries_to_ids(col_summaries),
            [self.COL_ID_1, self.COL_ID_2])

        # Search for collections containing 'Oppia' and 'Introduce'.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(
                self._create_search_query(['Oppia', 'Introduce'], [])))
        self.assertEqual(
            self._summaries_to_ids(col_summaries),
            [self.COL_ID_1, self.COL_ID_2])

        # Search for collections containing 'England'.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(
                self._create_search_query(['England'], [])))
        self.assertEqual(
            self._summaries_to_ids(col_summaries), [self.COL_ID_0])

        # Search for collections containing 'in'.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(
                self._create_search_query(['in'], [])))
        self.assertEqual(
            self._summaries_to_ids(col_summaries),
            [self.COL_ID_0, self.COL_ID_2, self.COL_ID_4])

        # Search for collections containing 'in' in the 'Architecture' and
        # 'Welcome' categories.
        (col_summaries, search_cursor) = (
            collection_services.get_collection_summaries_matching_query(
                self._create_search_query(
                    ['in'], ['Architecture', 'Welcome'])))
        self.assertEqual(
            self._summaries_to_ids(col_summaries),
            [self.COL_ID_0, self.COL_ID_2])

    def test_collection_summaries_pagination_in_filled_gallery(self):
        # Ensure the maximum number of collections that can fit on the gallery
        # page is maintained by the summaries function.
        with self.swap(feconf, 'GALLERY_PAGE_SIZE', 2):
            # Need to load 3 pages to find all of the collections. Since the
            # returned order is arbitrary, we need to concatenate the results
            # to ensure all collections are returned. We validate the correct
            # length is returned each time.
            found_col_ids = []

            # Page 1: 2 initial collections.
            (col_summaries, search_cursor) = (
                collection_services.get_collection_summaries_matching_query(
                    '', None))
            self.assertEqual(len(col_summaries), 2)
            self.assertIsNotNone(search_cursor)
            found_col_ids += self._summaries_to_ids(col_summaries)

            # Page 2: 2 more collections.
            (col_summaries, search_cursor) = (
                collection_services.get_collection_summaries_matching_query(
                    '', search_cursor))
            self.assertEqual(len(col_summaries), 2)
            self.assertIsNotNone(search_cursor)
            found_col_ids += self._summaries_to_ids(col_summaries)

            # Page 3: 1 final collection.
            (col_summaries, search_cursor) = (
                collection_services.get_collection_summaries_matching_query(
                    '', search_cursor))
            self.assertEqual(len(col_summaries), 1)
            self.assertIsNone(search_cursor)
            found_col_ids += self._summaries_to_ids(col_summaries)

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
            self.COLLECTION_ID, self.OWNER_ID)
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
            collection = self.save_new_valid_collection(_id, self.OWNER_ID)
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

        self.save_new_default_collection(self.COLLECTION_ID, self.OWNER_ID)
        # The collection shows up in queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.OWNER_ID), 1)

        collection_services.delete_collection(
            self.OWNER_ID, self.COLLECTION_ID)
        with self.assertRaises(Exception):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # The deleted collection does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.OWNER_ID), 0)

        # But the models still exist in the backend.
        self.assertIn(
            self.COLLECTION_ID,
            [collection.id
            for collection in collection_models.CollectionModel.get_all(
                include_deleted_entities=True)]
        )

        # The collection summary is deleted, however.
        self.assertNotIn(
            self.COLLECTION_ID,
            [collection.id
            for collection in collection_models.CollectionSummaryModel.get_all(
                include_deleted_entities=True)]
        )

    def test_hard_deletion_of_collections(self):
        """Test that hard deletion of collections works correctly."""
        self.save_new_default_collection(self.COLLECTION_ID, self.OWNER_ID)
        # The collection shows up in queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.OWNER_ID), 1)

        collection_services.delete_collection(
            self.OWNER_ID, self.COLLECTION_ID, force_deletion=True)
        with self.assertRaises(Exception):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # The deleted collection does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.OWNER_ID), 0)

        # The collection model has been purged from the backend.
        self.assertNotIn(
            self.COLLECTION_ID,
            [collection.id
            for collection in collection_models.CollectionModel.get_all(
                include_deleted_entities=True)]
        )

    def test_summaries_of_hard_deleted_collections(self):
        """Test that summaries of hard deleted collections are
        correctly deleted.
        """
        self.save_new_default_collection(self.COLLECTION_ID, self.OWNER_ID)

        collection_services.delete_collection(
            self.OWNER_ID, self.COLLECTION_ID, force_deletion=True)
        with self.assertRaises(Exception):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # The deleted collection summary does not show up in any queries.
        self.assertEqual(
            _count_at_least_editable_collection_summaries(self.OWNER_ID), 0)

        # The collection summary model has been purged from the backend.
        self.assertNotIn(
            self.COLLECTION_ID,
            [collection.id
            for collection in collection_models.CollectionSummaryModel.get_all(
                include_deleted_entities=True)]
        )

    def test_collections_are_removed_from_index_when_deleted(self):
        """Tests that deleted collections are removed from the search index."""

        self.save_new_default_collection(self.COLLECTION_ID, self.OWNER_ID)

        def mock_delete_docs(doc_ids, index):
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(doc_ids, [self.COLLECTION_ID])

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index', mock_delete_docs)

        with delete_docs_swap:
            collection_services.delete_collection(
                self.OWNER_ID, self.COLLECTION_ID)

    def test_create_new_collection_error_cases(self):
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID, '', '', '')
        with self.assertRaisesRegexp(Exception, 'between 1 and 50 characters'):
            collection_services.save_new_collection(self.OWNER_ID, collection)

        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID, 'title', '', '')
        with self.assertRaisesRegexp(Exception, 'between 1 and 50 characters'):
            collection_services.save_new_collection(self.OWNER_ID, collection)

    def test_save_and_retrieve_collection(self):
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.OWNER_ID)
        collection_services._save_collection(
            self.OWNER_ID, collection, '',
            _get_collection_change_list('title', ''))

        retrieved_collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(retrieved_collection.title, 'A title')
        self.assertEqual(retrieved_collection.category, 'A category')
        self.assertEqual(len(retrieved_collection.nodes), 1)

    def test_save_and_retrieve_collection_summary(self):
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.OWNER_ID)
        collection_services._save_collection(
            self.OWNER_ID, collection, '',
            _get_collection_change_list('title', ''))

        # Change the collection's title and category properties.
        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, [{
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

        self.assertEqual(retrieved_collection_summary.title, 'A new title')
        self.assertEqual(
            retrieved_collection_summary.category, 'A new category')


class LoadingAndDeletionOfCollectionDemosTest(CollectionServicesUnitTests):

    def test_loading_and_validation_and_deletion_of_demo_collections(self):
        """Test loading, validation and deletion of the demo collections."""
        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(), 0)

        self.assertGreaterEqual(
            len(feconf.DEMO_COLLECTIONS), 1,
            msg='There must be at least one demo collection.')
        for ind in range(len(feconf.DEMO_COLLECTIONS)):
            start_time = datetime.datetime.utcnow()

            collection_id = str(ind)
            collection_services.load_demo(collection_id)
            collection = collection_services.get_collection_by_id(
                collection_id)
            collection.validate()

            duration = datetime.datetime.utcnow() - start_time
            processing_time = duration.seconds + duration.microseconds / 1E6
            self.log_line(
                'Loaded and validated collection %s (%.2f seconds)' % (
                collection.title.encode('utf-8'), processing_time))

        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(),
            len(feconf.DEMO_COLLECTIONS))

        for ind in range(len(feconf.DEMO_COLLECTIONS)):
            collection_services.delete_demo(str(ind))
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
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.OWNER_ID, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXPLORATION_ID)

    def test_add_node(self):
        # Verify the initial collection only has 1 exploration in it.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.exploration_ids, [self.EXPLORATION_ID])

        _NEW_EXP_ID = 'new_exploration_id'
        self.save_new_valid_exploration(_NEW_EXP_ID, self.OWNER_ID)
        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': _NEW_EXP_ID
            }], 'Added new exploration')

        # Verify the new exploration was added.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(
            collection.exploration_ids, [self.EXPLORATION_ID, _NEW_EXP_ID])

    def test_delete_node(self):
        # Verify the initial collection only has 1 exploration in it.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.exploration_ids, [self.EXPLORATION_ID])

        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, [{
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
            self.OWNER_ID, self.COLLECTION_ID, [{
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
            self.OWNER_ID, self.COLLECTION_ID, [{
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
            self.OWNER_ID, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'objective',
                'new_value': 'Some new objective'
            }], 'Changed the objective')

        # Verify the objective is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        self.assertEqual(collection.objective, 'Some new objective')

    def test_update_collection_node_prerequisite_skills(self):
        # Verify initial prerequisite skills are empty.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        collection_node = collection.get_node(self.EXPLORATION_ID)
        self.assertEqual(collection_node.prerequisite_skills, [])

        # Update the prerequisite skills.
        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
                'exploration_id': self.EXPLORATION_ID,
                'property_name': 'prerequisite_skills',
                'new_value': ['first', 'second']
            }], 'Changed the prerequisite skills of a collection node')

        # Verify the prerequisites are different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        collection_node = collection.get_node(self.EXPLORATION_ID)
        self.assertEqual(
            collection_node.prerequisite_skills, ['first', 'second'])

    def test_update_collection_node_acquired_skills(self):
        # Verify initial acquired skills are empty.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        collection_node = collection.get_node(self.EXPLORATION_ID)
        self.assertEqual(collection_node.acquired_skills, [])

        # Update the acquired skills.
        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
                'exploration_id': self.EXPLORATION_ID,
                'property_name': 'acquired_skills',
                'new_value': ['third', 'fourth']
            }], 'Changed the acquired skills of a collection node')

        # Verify the acquired are different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_ID)
        collection_node = collection.get_node(self.EXPLORATION_ID)
        self.assertEqual(collection_node.acquired_skills, ['third', 'fourth'])


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

    def setUp(self):
        super(CommitMessageHandlingTests, self).setUp()
        self.EXP_ID = 'an_exploration_id'
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.OWNER_ID, exploration_id=self.EXP_ID)

    def test_record_commit_message(self):
        """Check published collections record commit messages."""
        rights_manager.publish_collection(self.OWNER_ID, self.COLLECTION_ID)

        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, _get_node_change_list(
                self.EXP_ID,
                collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS,
                ['Skill']), 'A message')

        self.assertEqual(
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_ID)[1]['commit_message'],
            'A message')

    def test_demand_commit_message(self):
        """Check published collections demand commit messages."""
        rights_manager.publish_collection(self.OWNER_ID, self.COLLECTION_ID)

        with self.assertRaisesRegexp(
                ValueError, 'Collection is public so expected a commit '
                            'message but received none.'):
            collection_services.update_collection(
                self.OWNER_ID, self.COLLECTION_ID, _get_node_change_list(
                    self.EXP_ID,
                    collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS,
                    ['Skill']), '')

    def test_unpublished_collections_can_accept_commit_message(self):
        """Test unpublished collections can accept optional commit messages."""

        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, _get_node_change_list(
                self.EXP_ID,
                collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS,
                ['Skill']), 'A message')

        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, _get_node_change_list(
                self.EXP_ID,
                collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS,
                ['Skill']), '')

        collection_services.update_collection(
            self.OWNER_ID, self.COLLECTION_ID, _get_node_change_list(
                self.EXP_ID,
                collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS,
                ['Skill']), None)


class CollectionSnapshotUnitTests(CollectionServicesUnitTests):
    """Test methods relating to collection snapshots."""

    def test_get_collection_snapshots_metadata(self):
        v1_collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.OWNER_ID)

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
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertIn('created_on_ms', snapshots_metadata[0])

        # Publish the collection. This does not affect the collection version
        # history.
        rights_manager.publish_collection(self.OWNER_ID, self.COLLECTION_ID)

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
            'committer_id': self.OWNER_ID,
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
            self.OWNER_ID, self.COLLECTION_ID, change_list, 'Changed title.')

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
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list,
            'committer_id': self.OWNER_ID,
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
                'committer_id_2', v1_collection, '',
                _get_collection_change_list('title', ''))

        # Another person modifies the collection.
        new_change_list = [{
            'cmd': 'edit_collection_property',
            'property_name': 'title',
            'new_value': 'New title'
        }]
        collection_services.update_collection(
            'committer_id_2', self.COLLECTION_ID, new_change_list,
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
            'committer_id': self.OWNER_ID,
            'commit_message': (
                'New collection created with title \'A title\'.'),
            'commit_type': 'create',
            'version_number': 1
        }, snapshots_metadata[0])
        self.assertDictContainsSubset({
            'commit_cmds': change_list,
            'committer_id': self.OWNER_ID,
            'commit_message': 'Changed title.',
            'commit_type': 'edit',
            'version_number': 2,
        }, snapshots_metadata[1])
        self.assertDictContainsSubset({
            'commit_cmds': new_change_list,
            'committer_id': 'committer_id_2',
            'commit_message': 'Second commit.',
            'commit_type': 'edit',
            'version_number': 3,
        }, snapshots_metadata[2])
        self.assertLess(
            snapshots_metadata[1]['created_on_ms'],
            snapshots_metadata[2]['created_on_ms'])

    def test_versioning_with_add_and_delete_nodes(self):
        collection = self.save_new_valid_collection(
            self.COLLECTION_ID, self.OWNER_ID)

        collection.title = 'First title'
        collection_services._save_collection(
            self.OWNER_ID, collection, 'Changed title.',
            _get_collection_change_list('title', 'First title'))
        commit_dict_2 = {
            'committer_id': self.OWNER_ID,
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
                'new_exploration_id', self.OWNER_ID).id)
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
                ValueError, 'is not part of this collection'):
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

    COMMIT_ALBERT_CREATE_COLLECTION_1 = {
        'username': ALBERT_NAME,
        'version': 1,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New collection created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_BOB_EDIT_COLLECTION_1 = {
        'username': BOB_NAME,
        'version': 2,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_CREATE_COLLECTION_2 = {
        'username': ALBERT_NAME,
        'version': 1,
        'collection_id': COLLECTION_ID_2,
        'commit_type': 'create',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'New collection created with title \'A title\'.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_COLLECTION_1 = {
        'username': 'albert',
        'version': 3,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert1 title.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_EDIT_COLLECTION_2 = {
        'username': 'albert',
        'version': 2,
        'collection_id': COLLECTION_ID_2,
        'commit_type': 'edit',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': 'Changed title to Albert2.',
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_DELETE_COLLECTION_1 = {
        'username': 'albert',
        'version': 4,
        'collection_id': COLLECTION_ID_1,
        'commit_type': 'delete',
        'post_commit_community_owned': False,
        'post_commit_is_private': True,
        'commit_message': feconf.COMMIT_MESSAGE_COLLECTION_DELETED,
        'post_commit_status': 'private'
    }

    COMMIT_ALBERT_PUBLISH_COLLECTION_2 = {
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

        self.ALBERT_ID = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.BOB_ID = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        # This needs to be done in a toplevel wrapper because the datastore
        # puts to the event log are asynchronous.
        @transaction_services.toplevel_wrapper
        def populate_datastore():
            collection_1 = self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.ALBERT_ID)

            collection_1.title = 'Exploration 1 title'
            collection_services._save_collection(
                self.BOB_ID, collection_1, 'Changed title.',
                _get_collection_change_list('title', 'Exploration 1 title'))

            collection_2 = self.save_new_valid_collection(
                self.COLLECTION_ID_2, self.ALBERT_ID)

            collection_1.title = 'Exploration 1 Albert title'
            collection_services._save_collection(
                self.ALBERT_ID, collection_1,
                'Changed title to Albert1 title.',
                _get_collection_change_list(
                    'title', 'Exploration 1 Albert title'))

            collection_2.title = 'Exploration 2 Albert title'
            collection_services._save_collection(
                self.ALBERT_ID, collection_2, 'Changed title to Albert2.',
                _get_collection_change_list(
                    'title', 'Exploration 2 Albert title'))

            collection_services.delete_collection(
                self.ALBERT_ID, self.COLLECTION_ID_1)

            # This commit should not be recorded.
            with self.assertRaisesRegexp(
                    Exception, 'This collection cannot be published'):
                rights_manager.publish_collection(
                    self.BOB_ID, self.COLLECTION_ID_2)

            rights_manager.publish_collection(
                self.ALBERT_ID, self.COLLECTION_ID_2)

        populate_datastore()

    def test_get_next_page_of_all_commits(self):
        all_commits = collection_services.get_next_page_of_all_commits()[0]
        self.assertEqual(len(all_commits), 7)
        for ind, commit in enumerate(all_commits):
            if ind != 0:
                self.assertGreater(
                    all_commits[ind - 1].last_updated,
                    all_commits[ind].last_updated)

        commit_dicts = [commit.to_dict() for commit in all_commits]

        # Note that commits are ordered from most recent to least recent.
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_CREATE_COLLECTION_1, commit_dicts[-1])
        self.assertDictContainsSubset(
            self.COMMIT_BOB_EDIT_COLLECTION_1, commit_dicts[-2])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_CREATE_COLLECTION_2, commit_dicts[-3])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_EDIT_COLLECTION_1, commit_dicts[-4])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_EDIT_COLLECTION_2, commit_dicts[-5])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_DELETE_COLLECTION_1, commit_dicts[-6])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_PUBLISH_COLLECTION_2, commit_dicts[-7])

    def test_get_next_page_of_all_non_private_commits(self):
        # TODO(frederikcreemers@gmail.com) test max_age here.
        all_commits = (
            collection_services.get_next_page_of_all_non_private_commits()[0])
        self.assertEqual(len(all_commits), 1)
        commit_dicts = [commit.to_dict() for commit in all_commits]
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_PUBLISH_COLLECTION_2, commit_dicts[0])

    def test_paging(self):
        all_commits, cursor, more = (
            collection_services.get_next_page_of_all_commits(page_size=5))
        self.assertEqual(len(all_commits), 5)
        commit_dicts = [commit.to_dict() for commit in all_commits]
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_CREATE_COLLECTION_2, commit_dicts[-1])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_EDIT_COLLECTION_1, commit_dicts[-2])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_EDIT_COLLECTION_2, commit_dicts[-3])
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_DELETE_COLLECTION_1, commit_dicts[-4])
        self.assertTrue(more)

        all_commits, cursor, more = (
            collection_services.get_next_page_of_all_commits(
                page_size=5, urlsafe_start_cursor=cursor))
        self.assertEqual(len(all_commits), 2)
        commit_dicts = [commit.to_dict() for commit in all_commits]
        self.assertDictContainsSubset(
            self.COMMIT_ALBERT_CREATE_COLLECTION_1, commit_dicts[-1])
        self.assertDictContainsSubset(
            self.COMMIT_BOB_EDIT_COLLECTION_1, commit_dicts[-2])
        self.assertFalse(more)


class CollectionCommitLogSpecialCasesUnitTests(CollectionServicesUnitTests):
    """Test special cases relating to the collection commit logs."""

    def test_paging_with_no_commits(self):
        all_commits, cursor, more = (
            collection_services.get_next_page_of_all_commits(page_size=5))
        self.assertEqual(len(all_commits), 0)


class CollectionSearchTests(CollectionServicesUnitTests):
    """Test collection search."""

    def test_demo_collections_are_added_to_search_index(self):
        results, cursor = collection_services.search_collections('Welcome', 2)
        self.assertEqual(results, [])

        collection_services.load_demo('0')
        results, cursor = collection_services.search_collections('Welcome', 2)
        self.assertEqual(results, ['0'])

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

        for i in xrange(5):
            self.save_new_valid_collection(
                all_collection_ids[i],
                self.OWNER_ID,
                all_collection_titles[i],
                category=all_collection_categories[i])

        # We're only publishing the first 4 collections, so we're not
        # expecting the last collection to be indexed.
        for i in xrange(4):
            rights_manager.publish_collection(
                self.OWNER_ID,
                expected_collection_ids[i])

        with add_docs_swap:
            collection_services.index_collections_given_ids(all_collection_ids)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_patch_collection_search_document(self):

        def mock_get_doc(doc_id, index):
            self.assertEqual(doc_id, self.COLLECTION_ID)
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            return {'a': 'b', 'c': 'd'}

        def mock_add_docs(docs, index):
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(docs, [{'a': 'b', 'c': 'e', 'f': 'g'}])

        get_doc_swap = self.swap(
            search_services, 'get_document_from_index', mock_get_doc)

        add_docs_counter = test_utils.CallCounter(mock_add_docs)
        add_docs_swap = self.swap(
            search_services, 'add_documents_to_index', add_docs_counter)

        with get_doc_swap, add_docs_swap:
            patch = {'c': 'e', 'f': 'g'}
            collection_services.patch_collection_search_document(
                self.COLLECTION_ID, patch)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_update_publicized_collection_status_in_search(self):

        def mock_get_doc(doc_id, index):
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(doc_id, self.COLLECTION_ID)
            return {}

        def mock_add_docs(docs, index):
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(docs, [{'is': 'featured'}])

        def mock_get_rights(collection_id):
            return rights_manager.ActivityRights(
                self.COLLECTION_ID,
                [self.OWNER_ID], [self.EDITOR_ID], [self.VIEWER_ID],
                status=rights_manager.ACTIVITY_STATUS_PUBLICIZED
            )

        get_doc_counter = test_utils.CallCounter(mock_get_doc)
        add_docs_counter = test_utils.CallCounter(mock_add_docs)

        get_doc_swap = self.swap(
            search_services, 'get_document_from_index', get_doc_counter)
        add_docs_swap = self.swap(
            search_services, 'add_documents_to_index', add_docs_counter)
        get_rights_swap = self.swap(
            rights_manager, 'get_collection_rights', mock_get_rights)

        with get_doc_swap, add_docs_swap, get_rights_swap:
            collection_services.update_collection_status_in_search(
                self.COLLECTION_ID)

        self.assertEqual(get_doc_counter.times_called, 1)
        self.assertEqual(add_docs_counter.times_called, 1)

    def test_update_private_collection_status_in_search(self):

        def mock_delete_docs(ids, index):
            self.assertEqual(ids, [self.COLLECTION_ID])
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)

        def mock_get_rights(collection_id):
            return rights_manager.ActivityRights(
                self.COLLECTION_ID,
                [self.OWNER_ID], [self.EDITOR_ID], [self.VIEWER_ID],
                status=rights_manager.ACTIVITY_STATUS_PRIVATE
            )

        delete_docs_counter = test_utils.CallCounter(mock_delete_docs)

        delete_docs_swap = self.swap(
            search_services, 'delete_documents_from_index',
            delete_docs_counter)
        get_rights_swap = self.swap(
            rights_manager, 'get_collection_rights', mock_get_rights)

        with get_rights_swap, delete_docs_swap:
            collection_services.update_collection_status_in_search(
                self.COLLECTION_ID)

        self.assertEqual(delete_docs_counter.times_called, 1)

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

        with self.swap(search_services, 'search', mock_search):
            result, cursor = collection_services.search_collections(
                expected_query_string,
                expected_limit,
                sort=expected_sort,
                cursor=expected_cursor,
            )

        self.assertEqual(cursor, expected_result_cursor)
        self.assertEqual(result, doc_ids)

    def test_get_search_rank(self):
        self.save_new_valid_collection(self.COLLECTION_ID, self.OWNER_ID)

        # The search rank has a 'last updated' bonus of 80.
        _BASE_SEARCH_RANK = 20 + 80

        self.assertEqual(
            collection_services._get_search_rank(self.COLLECTION_ID),
            _BASE_SEARCH_RANK)

        rights_manager.publish_collection(self.OWNER_ID, self.COLLECTION_ID)
        rights_manager.publicize_collection(
            self.user_id_admin, self.COLLECTION_ID)
        self.assertEqual(
            collection_services._get_search_rank(self.COLLECTION_ID),
            _BASE_SEARCH_RANK + 30)


class CollectionChangedEventsTests(CollectionServicesUnitTests):

    def test_collection_contents_change_event_triggers(self):
        recorded_ids = []

        @classmethod
        def mock_record(cls, collection_id):
            recorded_ids.append(collection_id)

        record_event_swap = self.swap(
            event_services.CollectionContentChangeEventHandler,
            'record',
            mock_record)

        with record_event_swap:
            self.save_new_valid_collection(self.COLLECTION_ID, self.OWNER_ID)
            collection_services.update_collection(
                self.OWNER_ID, self.COLLECTION_ID,
                _get_collection_change_list('title', 'Title'), '')

        self.assertEqual(
            recorded_ids, [self.COLLECTION_ID, self.COLLECTION_ID])

    def test_collection_status_change_event(self):
        recorded_ids = []

        @classmethod
        def mock_record(cls, collection_id):
            recorded_ids.append(collection_id)

        record_event_swap = self.swap(
            event_services.CollectionStatusChangeEventHandler,
            'record', mock_record)

        with record_event_swap:
            self.save_new_default_collection(self.COLLECTION_ID, self.OWNER_ID)
            rights_manager.create_new_collection_rights(
                self.COLLECTION_ID, self.OWNER_ID)
            rights_manager.publish_collection(
                self.OWNER_ID, self.COLLECTION_ID)
            rights_manager.publicize_collection(
                self.user_id_admin, self.COLLECTION_ID)
            rights_manager.unpublicize_collection(
                self.user_id_admin, self.COLLECTION_ID)
            rights_manager.unpublish_collection(
                self.user_id_admin, self.COLLECTION_ID)

        # There are only 4 CollectionStatusChangeEvents fired because
        # create_new_collection_rights does not fire a
        # CollectionStatusChangeEvent.
        self.assertEqual(recorded_ids, [
            self.COLLECTION_ID, self.COLLECTION_ID,
            self.COLLECTION_ID, self.COLLECTION_ID])


class CollectionSummaryTests(CollectionServicesUnitTests):
    """Test collection summaries."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    COLLECTION_ID_1 = 'cid1'
    COLLECTION_ID_2 = 'cid2'

    def test_is_collection_summary_editable(self):
        self.save_new_default_collection(self.COLLECTION_ID, self.OWNER_ID)

        # Check that only the owner may edit.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertTrue(collection_services.is_collection_summary_editable(
            collection_summary, user_id=self.OWNER_ID))
        self.assertFalse(collection_services.is_collection_summary_editable(
            collection_summary, user_id=self.EDITOR_ID))
        self.assertFalse(collection_services.is_collection_summary_editable(
            collection_summary, user_id=self.VIEWER_ID))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_collection(
            self.OWNER_ID, self.COLLECTION_ID, self.VIEWER_ID,
            rights_manager.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            self.OWNER_ID, self.COLLECTION_ID, self.EDITOR_ID,
            rights_manager.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_ID)
        self.assertTrue(collection_services.is_collection_summary_editable(
            collection_summary, user_id=self.OWNER_ID))
        self.assertTrue(collection_services.is_collection_summary_editable(
            collection_summary, user_id=self.EDITOR_ID))
        self.assertFalse(collection_services.is_collection_summary_editable(
            collection_summary, user_id=self.VIEWER_ID))


class CollectionSummaryGetTests(CollectionServicesUnitTests):
    """Test collection summaries get_* functions."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    COLLECTION_ID_1 = 'cid1'
    COLLECTION_ID_2 = 'cid2'

    EXPECTED_VERSION_1 = 3
    EXPECTED_VERSION_2 = 2

    def setUp(self):
        """Populate the database of collections and their summaries.

        The sequence of events is:
        - (1) Albert creates COLLECTION_ID_1.
        - (2) Bob edits the title of COLLECTION_ID_1.
        - (3) Albert creates COLLECTION_ID_2.
        - (4) Albert edits the title of COLLECTION_ID_1.
        - (5) Albert edits the title of COLLECTION_ID_2.
        - Bob tries to publish COLLECTION_ID_2, and is denied access.
        - (6) Albert publishes COLLECTION_ID_2.
        """
        super(CollectionServicesUnitTests, self).setUp()

        self.ALBERT_ID = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.BOB_ID = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        collection_1 = self.save_new_valid_collection(
            self.COLLECTION_ID_1, self.ALBERT_ID)

        collection_1.title = 'Collection 1 title'
        collection_services._save_collection(
            self.BOB_ID, collection_1, 'Changed title.',
            _get_collection_change_list('title', 'Collection 1 title'))

        collection_2 = self.save_new_valid_collection(
            self.COLLECTION_ID_2, self.ALBERT_ID)

        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection 1 Albert title'
        }]
        collection_services.update_collection(
            self.ALBERT_ID, self.COLLECTION_ID_1, changelist_cmds,
            'Changed title to Albert1 title.')

        collection_2.title = 'Collection 2 Albert title'
        collection_services._save_collection(
            self.ALBERT_ID, collection_2, 'Changed title to Albert2.',
            _get_collection_change_list('title', 'Collection 2 Albert title'))

        with self.assertRaisesRegexp(
                Exception, 'This collection cannot be published'):
            rights_manager.publish_collection(
                self.BOB_ID, self.COLLECTION_ID_2)

        rights_manager.publish_collection(self.ALBERT_ID, self.COLLECTION_ID_2)
