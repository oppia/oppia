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

from __future__ import annotations

import datetime
import logging
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models
    from mypy_imports import datastore_services
    from mypy_imports import search_services as gae_search_services
    from mypy_imports import user_models

(collection_models, user_models) = models.Registry.import_models([
    models.Names.COLLECTION, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()
gae_search_services = models.Registry.import_search_services()


# TODO(bhenning): Test CollectionSummaryModel changes if collections are
# updated, reverted, deleted, created, rights changed. See TODO(msl): At
# the top of exp_services_test for more original context.


def count_at_least_editable_collection_summaries(user_id: str) -> int:
    """Returns the count of collection summaries that are atleast editable."""
    return len(collection_services.get_collection_summary_dicts_from_models(
        collection_models.CollectionSummaryModel.get_at_least_editable(
            user_id=user_id)))


class CollectionServicesUnitTests(test_utils.GenericTestBase):
    """Test the collection services module."""

    COLLECTION_0_ID: Final = 'A_collection_0_id'
    COLLECTION_1_ID: Final = 'A_collection_1_id'

    def setUp(self) -> None:
        """Before each individual test, create dummy users."""
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))

        self.owner = user_services.get_user_actions_info(self.owner_id)


class MockCollectionModel(collection_models.CollectionModel):

    nodes = datastore_services.JsonProperty(repeated=True)


class CollectionQueriesUnitTests(CollectionServicesUnitTests):
    """Tests query methods."""

    def test_get_collection_titles_and_categories(self) -> None:
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

    def test_get_collection_from_model(self) -> None:
        rights_manager.create_new_collection_rights(
            'collection_id', self.owner_id)

        collection_model = collection_models.CollectionModel(
            id='collection_id',
            category='category',
            title='title',
            objective='objective',
            collection_contents={
                'nodes': {}
            },
        )

        collection_model.commit(
            self.owner_id, 'collection model created',
            [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])

        collection = collection_services.get_collection_from_model(
            collection_model)

        self.assertEqual(collection.id, 'collection_id')
        self.assertEqual(collection.title, 'title')
        self.assertEqual(collection.category, 'category')
        self.assertEqual(collection.objective, 'objective')
        self.assertEqual(
            collection.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.assertEqual(collection.version, 1)
        self.assertEqual(
            collection.schema_version, feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    def test_get_collection_from_model_with_schema_version_2_copies_nodes(
        self
    ) -> None:
        collection_model = MockCollectionModel(
            id='collection_id',
            category='category',
            title='title',
            schema_version=2,
            objective='objective',
            version=1,
            nodes=[
                {
                    'exploration_id': 'exp_id1',
                    'acquired_skills': ['11'],
                    'prerequisite_skills': ['22'],
                }, {
                    'exploration_id': 'exp_id2',
                    'acquired_skills': ['33'],
                    'prerequisite_skills': ['44'],
                }
            ]
        )

        collection = (
            collection_services.get_collection_from_model(collection_model))
        self.assertEqual(collection.id, 'collection_id')
        self.assertEqual(collection.title, 'title')
        self.assertEqual(collection.category, 'category')
        self.assertEqual(collection.objective, 'objective')
        self.assertEqual(
            collection.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.assertEqual(collection.version, 1)
        self.assertEqual(
            collection.nodes[0].to_dict(), {'exploration_id': 'exp_id1'})
        self.assertEqual(
            collection.nodes[1].to_dict(), {'exploration_id': 'exp_id2'})
        self.assertEqual(
            collection.schema_version, feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    def test_get_collection_from_model_with_invalid_schema_version_raises_error(
        self
    ) -> None:
        rights_manager.create_new_collection_rights(
            'collection_id', self.owner_id)

        collection_model = collection_models.CollectionModel(
            id='collection_id',
            category='category',
            title='title',
            schema_version=0,
            objective='objective',
            collection_contents={
                'nodes': {}
            },
        )

        collection_model.commit(
            self.owner_id, 'collection model created',
            [{
                'cmd': 'create_new',
                'title': 'title',
                'category': 'category',
            }])

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d collection schemas at '
            'present.' % feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
            collection_services.get_collection_from_model(collection_model)

    def test_get_different_collections_by_version(self) -> None:
        self.save_new_valid_collection('collection_id', self.owner_id)

        collection_services.update_collection(
            self.owner_id, 'collection_id', [
                {
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': 'objective',
                    'new_value': 'Some new objective'
                },
                {
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'Some new title'
                },
                {
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': 'category',
                    'new_value': 'Some new category'
                }
            ], 'Changed properties')

        collection = collection_services.get_collection_by_id(
            'collection_id', version=1)

        self.assertEqual(collection.id, 'collection_id')
        self.assertEqual(collection.category, 'A category')
        self.assertEqual(collection.objective, 'An objective')
        self.assertEqual(
            collection.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.assertEqual(
            collection.schema_version, feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

        collection = collection_services.get_collection_by_id(
            'collection_id', version=0)

        self.assertEqual(collection.id, 'collection_id')
        self.assertEqual(collection.title, 'Some new title')
        self.assertEqual(collection.category, 'Some new category')
        self.assertEqual(collection.objective, 'Some new objective')
        self.assertEqual(
            collection.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.assertEqual(
            collection.schema_version, feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    def test_get_collection_summary_by_id_with_invalid_collection_id(
        self
    ) -> None:
        collection = collection_services.get_collection_summary_by_id(
            'invalid_collection_id')

        self.assertIsNone(collection)

    def test_save_collection_without_change_list_raises_error(self) -> None:
        collection = self.save_new_valid_collection(
            'collection_id', self.owner_id)

        apply_change_list_swap = self.swap(
            collection_services, 'apply_change_list', lambda _, __: collection)

        with apply_change_list_swap, self.assertRaisesRegex(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save collection'):
            # Here we use MyPy ignore because the argument `change_list`
            # of update_collection method can only accept values of type
            # List[Dict[]], but here for testing purposes we are providing
            # None which causes MyPy to throw incompatible argument type
            # error. Thus to avoid the error, we used ignore here.
            collection_services.update_collection(
                self.owner_id, 'collection_id', None, 'commit message')  # type: ignore[arg-type]

    def test_save_collection_with_mismatch_of_versions_raises_error(
        self
    ) -> None:
        self.save_new_valid_collection(
            'collection_id', self.owner_id)

        collection_model = collection_models.CollectionModel.get(
            'collection_id')
        collection_model.version = 0

        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 0 of collection '
            'from version 1. Please reload the page and try again.'):
            collection_services.update_collection(
                self.owner_id, 'collection_id',
                [{
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': 'objective',
                    'new_value': 'Some new objective'
                }], 'changed objective')

    def test_get_multiple_collections_from_model_by_id(self) -> None:
        rights_manager.create_new_collection_rights(
            'collection_id_1', self.owner_id)

        collection_model = collection_models.CollectionModel(
            id='collection_id_1',
            category='category 1',
            title='title 1',
            objective='objective 1',
            collection_contents={
                'nodes': {}
            },
        )

        collection_model.commit(
            self.owner_id, 'collection model created',
            [{
                'cmd': 'create_new',
                'title': 'title 1',
                'category': 'category 1',
            }])

        rights_manager.create_new_collection_rights(
            'collection_id_2', self.owner_id)

        collection_model = collection_models.CollectionModel(
            id='collection_id_2',
            category='category 2',
            title='title 2',
            objective='objective 2',
            collection_contents={
                'nodes': {}
            },
        )

        collection_model.commit(
            self.owner_id, 'collection model created',
            [{
                'cmd': 'create_new',
                'title': 'title 2',
                'category': 'category 2',
            }])

        collections = collection_services.get_multiple_collections_by_id(
            ['collection_id_1', 'collection_id_2'])

        self.assertEqual(len(collections), 2)
        self.assertEqual(collections['collection_id_1'].title, 'title 1')
        self.assertEqual(collections['collection_id_1'].category, 'category 1')
        self.assertEqual(
            collections['collection_id_1'].objective, 'objective 1')

        self.assertEqual(collections['collection_id_2'].title, 'title 2')
        self.assertEqual(collections['collection_id_2'].category, 'category 2')
        self.assertEqual(
            collections['collection_id_2'].objective, 'objective 2')

    def test_get_multiple_collections_by_id_with_invalid_collection_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Couldn\'t find collections with the following ids'):
            collection_services.get_multiple_collections_by_id(
                ['collection_id_1', 'collection_id_2'])

    def test_get_explorations_completed_in_collections(self) -> None:
        collection = self.save_new_valid_collection(
            'collection_id', self.owner_id, exploration_id='exp_id')

        self.save_new_valid_exploration('exp_id_1', self.owner_id)

        collection.add_node('exp_id_1')

        completed_exp_ids = (
            collection_services.get_explorations_completed_in_collections(
                self.owner_id, ['collection_id']))

        self.assertEqual(completed_exp_ids, [[]])

        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, 'collection_id', 'exp_id')

        completed_exp_ids = (
            collection_services.get_explorations_completed_in_collections(
                self.owner_id, ['collection_id']))

        self.assertEqual(completed_exp_ids, [['exp_id']])

        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, 'collection_id', 'exp_id_1')

        completed_exp_ids = (
            collection_services.get_explorations_completed_in_collections(
                self.owner_id, ['collection_id']))

        self.assertEqual(completed_exp_ids, [['exp_id', 'exp_id_1']])

    def test_update_collection_by_swapping_collection_nodes(self) -> None:
        collection = self.save_new_valid_collection(
            'collection_id', self.owner_id, exploration_id='exp_id_1')

        self.save_new_valid_exploration('exp_id_2', self.owner_id)

        collection_services.update_collection(
            self.owner_id, 'collection_id', [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': 'exp_id_2'
            }], 'Added new exploration')

        collection = collection_services.get_collection_by_id('collection_id')

        self.assertEqual(collection.nodes[0].exploration_id, 'exp_id_1')
        self.assertEqual(collection.nodes[1].exploration_id, 'exp_id_2')

        collection_services.update_collection(
            self.owner_id, 'collection_id', [{
                'cmd': collection_domain.CMD_SWAP_COLLECTION_NODES,
                'first_index': 0,
                'second_index': 1
            }], 'Swapped collection nodes')

        collection = collection_services.get_collection_by_id('collection_id')

        self.assertEqual(collection.nodes[0].exploration_id, 'exp_id_2')
        self.assertEqual(collection.nodes[1].exploration_id, 'exp_id_1')

    def test_update_collection_with_invalid_cmd_raises_error(self) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)

        self.save_new_valid_collection('collection_id', self.owner_id)

        with self.assertRaisesRegex(
            Exception, 'Command invalid command is not allowed'), logging_swap:
            collection_services.update_collection(
                self.owner_id, 'collection_id', [{
                    'cmd': 'invalid command'
                }], 'Commit message')

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages[0],
            'ValidationError Command invalid command is not allowed '
            'collection_id [{\'cmd\': \'invalid command\'}]')


class CollectionProgressUnitTests(CollectionServicesUnitTests):
    """Tests functions which deal with any progress a user has made within a
    collection, including query and recording methods related to explorations
    which are played in the context of the collection.
    """

    COL_ID_0: Final = '0_collection_id'
    COL_ID_1: Final = '1_collection_id'
    EXP_ID_0: Final = '0_exploration_id'
    EXP_ID_1: Final = '1_exploration_id'
    EXP_ID_2: Final = '2_exploration_id'

    def _get_progress_model(
        self, user_id: str, collection_id: str
    ) -> Optional[user_models.CollectionProgressModel]:
        """Returns the CollectionProgressModel for the given user id and
        collection id.
        """
        return user_models.CollectionProgressModel.get(user_id, collection_id)

    def _record_completion(
        self, user_id: str, collection_id: str, exploration_id: str
    ) -> None:
        """Records the played exploration in the collection by the user
        corresponding to the given user id.
        """
        collection_services.record_played_exploration_in_collection_context(
            user_id, collection_id, exploration_id)

    def setUp(self) -> None:
        super().setUp()

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

    def test_get_completed_exploration_ids(self) -> None:
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

    def test_get_next_exploration_id_to_complete_by_user(self) -> None:
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
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id Fake not found'):
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

    def test_record_played_exploration_in_collection_context(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert completion_model is not None
        self.assertEqual(
            completion_model.completed_explorations, [
                self.EXP_ID_0])

        # If the same exploration is completed again within the context of this
        # collection, it should not be duplicated.
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.COL_ID_0, self.EXP_ID_0)
        completion_model = self._get_progress_model(
            self.owner_id, self.COL_ID_0)
        # Ruling out the possibility of None for mypy type checking.
        assert completion_model is not None
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
        # Ruling out the possibility of None for mypy type checking.
        assert completion_model is not None
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
        # Ruling out the possibility of None for mypy type checking.
        assert completion_model is not None
        self.assertEqual(
            completion_model.completed_explorations, [
                self.EXP_ID_0, self.EXP_ID_2, self.EXP_ID_1])


class CollectionSummaryQueriesUnitTests(CollectionServicesUnitTests):
    """Tests collection query methods which operate on CollectionSummary
    objects.
    """

    COL_ID_0: Final = '0_arch_bridges_in_england'
    COL_ID_1: Final = '1_welcome_introduce_oppia'
    COL_ID_2: Final = '2_welcome_introduce_oppia_interactions'
    COL_ID_3: Final = '3_welcome'
    COL_ID_4: Final = '4_languages_learning_basic_verbs_in_spanish'
    COL_ID_5: Final = '5_languages_private_collection_in_spanish'

    def setUp(self) -> None:
        super().setUp()

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

    def _create_search_query(
        self, terms: List[str], categories: List[str]
    ) -> str:
        """Returns the search query derived from terms and categories."""
        query = ' '.join(terms)
        if categories:
            query += ' category=(' + ' OR '.join([
                '"%s"' % category for category in categories]) + ')'
        return query

    def test_get_collection_summaries_matching_ids(self) -> None:
        summaries = collection_services.get_collection_summaries_matching_ids([
            self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, 'nonexistent'])
        # Ruling out the possibility of None of individual elements of a list
        # for mypy type checking.
        assert summaries[0] is not None
        self.assertEqual(summaries[0].title, 'Bridges in England')
        assert summaries[1] is not None
        self.assertEqual(summaries[1].title, 'Introduce Oppia')
        assert summaries[2] is not None
        self.assertEqual(summaries[2].title, 'Introduce Interactions in Oppia')
        self.assertIsNone(summaries[3])

    def test_get_collection_summaries_subscribed_to(self) -> None:
        summaries = collection_services.get_collection_summaries_subscribed_to(
            self.owner_id)
        self.assertEqual(summaries[0].title, 'Bridges in England')
        self.assertEqual(summaries[1].title, 'Introduce Oppia')
        self.assertEqual(summaries[2].title, 'Introduce Interactions in Oppia')
        self.assertEqual(summaries[3].title, 'Welcome')
        self.assertEqual(summaries[4].title, 'Learning basic verbs in Spanish')
        self.assertEqual(summaries[5].title, 'Private collection in Spanish')

    def test_publish_collection_raise_exception_for_invalid_collection_id(
        self
    ) -> None:
        system_user = user_services.get_system_user()
        with self.assertRaisesRegex(
            Exception,
            'No collection summary model exists for the given id:'
            ' Invalid_collection_id'
        ):
            with self.swap_to_always_return(
                rights_manager, 'publish_collection', True
            ):
                collection_services.publish_collection_and_update_user_profiles(
                    system_user,
                    'Invalid_collection_id'
                )

    def test_get_collection_summaries_with_no_query(self) -> None:
        # An empty query should return all collections.
        (col_ids, search_cursor) = (
            collection_services.get_collection_ids_matching_query('', [], []))
        self.assertEqual(sorted(col_ids), [
            self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
            self.COL_ID_4
        ])
        self.assertIsNone(search_cursor)

    def test_get_collection_summaries_with_deleted_collections(self) -> None:
        # Ensure a deleted collection does not show up in search results.
        collection_services.delete_collection(self.owner_id, self.COL_ID_0)
        collection_services.delete_collection(self.owner_id, self.COL_ID_2)
        collection_services.delete_collection(self.owner_id, self.COL_ID_4)

        col_ids = (
            collection_services.get_collection_ids_matching_query('', [], [])
        )[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_3])

        collection_services.delete_collection(self.owner_id, self.COL_ID_1)
        collection_services.delete_collection(self.owner_id, self.COL_ID_3)

        # If no collections are loaded, a blank query should not get any
        # collections.
        self.assertEqual(
            collection_services.get_collection_ids_matching_query('', [], []),
            ([], None))

    def test_get_collection_summaries_with_deleted_collections_multi(
        self
    ) -> None:
        # Ensure a deleted collection does not show up in search results.
        collection_services.delete_collections(
            self.owner_id, [self.COL_ID_0, self.COL_ID_2, self.COL_ID_4])

        col_ids = (
            collection_services.get_collection_ids_matching_query('', [], [])
        )[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_3])

        collection_services.delete_collections(
            self.owner_id, [self.COL_ID_1, self.COL_ID_3])

        # If no collections are loaded, a blank query should not get any
        # collections.
        self.assertEqual(
            collection_services.get_collection_ids_matching_query('', [], []),
            ([], None))

    def test_search_collection_summaries(self) -> None:
        # Search within the 'Architecture' category.
        col_ids = collection_services.get_collection_ids_matching_query(
            '', ['Architecture'], [])[0]
        self.assertEqual(col_ids, [self.COL_ID_0])

        # Search for collections containing 'Oppia'.
        col_ids = collection_services.get_collection_ids_matching_query(
            'Oppia', [], [])[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_2])

        # Search for collections containing 'Oppia' and 'Introduce'.
        col_ids = collection_services.get_collection_ids_matching_query(
            'Oppia Introduce', [], [])[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_1, self.COL_ID_2])

        # Search for collections containing 'England'.
        col_ids = collection_services.get_collection_ids_matching_query(
            'England', [], [])[0]
        self.assertEqual(col_ids, [self.COL_ID_0])

        # Search for collections containing 'in'.
        col_ids = collection_services.get_collection_ids_matching_query(
            'in', [], [])[0]
        self.assertEqual(
            sorted(col_ids), [self.COL_ID_0, self.COL_ID_2, self.COL_ID_4])

        # Search for collections containing 'in' in the 'Architecture' and
        # 'Welcome' categories.
        col_ids = collection_services.get_collection_ids_matching_query(
            'in', ['Architecture', 'Welcome'], [])[0]
        self.assertEqual(sorted(col_ids), [self.COL_ID_0, self.COL_ID_2])

    def test_collection_summaries_pagination_in_filled_search_results(
        self
    ) -> None:
        # Ensure the maximum number of collections that can fit on the search
        # results page is maintained by the summaries function.
        with self.swap(feconf, 'SEARCH_RESULTS_PAGE_SIZE', 2):
            # Need to load 3 pages to find all of the collections. Since the
            # returned order is arbitrary, we need to concatenate the results
            # to ensure all collections are returned. We validate the correct
            # length is returned each time.
            found_col_ids = []

            # Page 1: 2 initial collections.
            (col_ids, search_offset) = (
                collection_services.get_collection_ids_matching_query(
                    '', [], []))
            self.assertEqual(len(col_ids), 2)
            self.assertIsNotNone(search_offset)
            found_col_ids += col_ids

            # Page 2: 2 more collections.
            (col_ids, search_offset) = (
                collection_services.get_collection_ids_matching_query(
                    '', [], [], offset=search_offset))
            self.assertEqual(len(col_ids), 2)
            self.assertIsNotNone(search_offset)
            found_col_ids += col_ids

            # Page 3: 1 final collection.
            (col_ids, search_offset) = (
                collection_services.get_collection_ids_matching_query(
                    '', [], [], offset=search_offset))
            self.assertEqual(len(col_ids), 1)
            self.assertIsNone(search_offset)
            found_col_ids += col_ids

            # Validate all collections were seen.
            self.assertEqual(sorted(found_col_ids), [
                self.COL_ID_0, self.COL_ID_1, self.COL_ID_2, self.COL_ID_3,
                self.COL_ID_4])


class CollectionCreateAndDeleteUnitTests(CollectionServicesUnitTests):
    """Test creation and deletion methods."""

    def test_retrieval_of_collection(self) -> None:
        """Test the get_collection_by_id() method."""
        with self.assertRaisesRegex(Exception, 'Entity .* not found'):
            collection_services.get_collection_by_id('fake_eid')

        collection = self.save_new_default_collection(
            self.COLLECTION_0_ID, self.owner_id)
        retrieved_collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.id, retrieved_collection.id)
        self.assertEqual(collection.title, retrieved_collection.title)

        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id fake_collection'
            ' not found'):
            collection_services.get_collection_by_id('fake_collection')

    def test_retrieval_of_multiple_collections(self) -> None:
        collections = {}
        chars = 'abcde'
        collection_ids = ['%s%s' % (self.COLLECTION_0_ID, c) for c in chars]
        for _id in collection_ids:
            collection = self.save_new_valid_collection(_id, self.owner_id)
            collections[_id] = collection

        result = collection_services.get_multiple_collections_by_id(
            collection_ids)
        for _id in collection_ids:
            self.assertEqual(result[_id].title, collections[_id].title)

        # Test retrieval of non-existent ids.
        result = collection_services.get_multiple_collections_by_id(
            collection_ids + ['doesnt_exist'], strict=False
        )
        for _id in collection_ids:
            self.assertEqual(result[_id].title, collections[_id].title)

        self.assertNotIn('doesnt_exist', result)

        with self.assertRaisesRegex(
            Exception,
            'Couldn\'t find collections with the following ids:\ndoesnt_exist'):
            collection_services.get_multiple_collections_by_id(
                collection_ids + ['doesnt_exist'])

    def test_soft_deletion_of_collection(self) -> None:
        """Test that soft deletion of collection works correctly."""
        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)

        # The collection shows up in queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 1)

        collection_services.delete_collection(
            self.owner_id, self.COLLECTION_0_ID)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_0_id '
            'not found'):
            collection_services.get_collection_by_id(self.COLLECTION_0_ID)

        # The deleted collection does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 0)

        # But the models still exist in the backend.
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_0_ID))

        # The collection summary is deleted, however.
        self.assertIsNone(
            collection_models.CollectionSummaryModel
            .get_by_id(self.COLLECTION_0_ID))

        # The delete commit exists.
        self.assertIsNotNone(
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-%s' % (self.COLLECTION_0_ID, 1)))

        # The snapshot models exist.
        collection_snapshot_id = (
            collection_models.CollectionModel.get_snapshot_id(
                self.COLLECTION_0_ID, 1))
        self.assertIsNotNone(
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                collection_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionSnapshotContentModel.get_by_id(
                collection_snapshot_id))
        collection_rights_snapshot_id = (
            collection_models.CollectionRightsModel.get_snapshot_id(
                self.COLLECTION_0_ID, 1))
        self.assertIsNotNone(
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                collection_rights_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                collection_rights_snapshot_id))

    def test_deletion_of_multiple_collections_empty(self) -> None:
        """Test that delete_collections with empty list works correctly."""
        collection_services.delete_collections(self.owner_id, [])

    def test_soft_deletion_of_multiple_collections(self) -> None:
        """Test that soft deletion of multiple collections works correctly."""
        # TODO(sll): Add tests for deletion of states and version snapshots.

        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)
        self.save_new_default_collection(self.COLLECTION_1_ID, self.owner_id)
        # The collections shows up in queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 2)

        collection_services.delete_collections(
            self.owner_id, [self.COLLECTION_0_ID, self.COLLECTION_1_ID])
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_0_id '
            'not found'):
            collection_services.get_collection_by_id(self.COLLECTION_0_ID)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_1_id '
            'not found'):
            collection_services.get_collection_by_id(self.COLLECTION_1_ID)

        # The deleted collections does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 0)

        # But the models still exist in the backend.
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_0_ID))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))

        # The collection summaries are deleted, however.
        self.assertIsNone(
            collection_models.CollectionSummaryModel
            .get_by_id(self.COLLECTION_0_ID))
        self.assertIsNone(
            collection_models.CollectionSummaryModel
            .get_by_id(self.COLLECTION_1_ID))

        # The delete commits exist.
        self.assertIsNotNone(
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-%s' % (self.COLLECTION_0_ID, 1)))
        self.assertIsNotNone(
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-%s' % (self.COLLECTION_1_ID, 1)))

        # The snapshot models exist.
        collection_0_snapshot_id = (
            collection_models.CollectionModel.get_snapshot_id(
                self.COLLECTION_0_ID, 1))
        collection_1_snapshot_id = (
            collection_models.CollectionModel.get_snapshot_id(
                self.COLLECTION_1_ID, 1))
        self.assertIsNotNone(
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                collection_0_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionSnapshotContentModel.get_by_id(
                collection_0_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                collection_1_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionSnapshotContentModel.get_by_id(
                collection_1_snapshot_id))
        collection_0_rights_snapshot_id = (
            collection_models.CollectionRightsModel.get_snapshot_id(
                self.COLLECTION_0_ID, 1))
        collection_1_rights_snapshot_id = (
            collection_models.CollectionRightsModel.get_snapshot_id(
                self.COLLECTION_1_ID, 1))
        self.assertIsNotNone(
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                collection_0_rights_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                collection_0_rights_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                collection_1_rights_snapshot_id))
        self.assertIsNotNone(
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                collection_1_rights_snapshot_id))

    def test_hard_deletion_of_collection(self) -> None:
        """Test that hard deletion of collection works correctly."""
        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)
        # The collection shows up in queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 1)

        collection_services.delete_collection(
            self.owner_id, self.COLLECTION_0_ID, force_deletion=True)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_0_id'
            ' not found'):
            collection_services.get_collection_by_id(self.COLLECTION_0_ID)

        # The deleted collection does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 0)

        # The collection model has been purged from the backend.
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))

    def test_hard_deletion_of_multiple_collections(self) -> None:
        """Test that hard deletion of multiple collections works correctly."""
        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)
        self.save_new_default_collection(self.COLLECTION_1_ID, self.owner_id)
        # The collections show up in queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 2)

        collection_services.delete_collections(
            self.owner_id,
            [self.COLLECTION_0_ID, self.COLLECTION_1_ID],
            force_deletion=True)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_0_id'
            ' not found'):
            collection_services.get_collection_by_id(self.COLLECTION_0_ID)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_1_id '
            'not found'):
            collection_services.get_collection_by_id(self.COLLECTION_1_ID)

        # The deleted collections does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 0)

        # The collection models have been purged from the backend.
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_0_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))

        # The collection summaries are deleted too.
        self.assertIsNone(
            collection_models.CollectionSummaryModel
            .get_by_id(self.COLLECTION_0_ID))
        self.assertIsNone(
            collection_models.CollectionSummaryModel
            .get_by_id(self.COLLECTION_1_ID))

    def test_summaries_of_hard_deleted_collections(self) -> None:
        """Test that summaries of hard deleted collections are
        correctly deleted.
        """
        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)

        collection_services.delete_collection(
            self.owner_id, self.COLLECTION_0_ID, force_deletion=True)
        with self.assertRaisesRegex(
            Exception,
            'Entity for class CollectionModel with id A_collection_0_id '
            'not found'):
            collection_services.get_collection_by_id(self.COLLECTION_0_ID)

        # The deleted collection summary does not show up in any queries.
        self.assertEqual(
            count_at_least_editable_collection_summaries(self.owner_id), 0)

        # The collection summary model has been purged from the backend.
        self.assertNotIn(
            self.COLLECTION_0_ID, [
                collection.id
                for collection in
                collection_models.CollectionSummaryModel.get_all(
                    include_deleted=True)])

    def test_collection_is_removed_from_index_when_deleted(self) -> None:
        """Tests that deleted collection is removed from the search index."""

        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)

        def mock_delete_docs(doc_ids: List[str], index: str) -> None:
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(doc_ids, [self.COLLECTION_0_ID])

        delete_docs_swap = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            mock_delete_docs)

        with delete_docs_swap:
            collection_services.delete_collection(
                self.owner_id, self.COLLECTION_0_ID)

    def test_collections_are_removed_from_index_when_deleted(self) -> None:
        """Tests that deleted collections are removed from the search index."""
        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)
        self.save_new_default_collection(self.COLLECTION_1_ID, self.owner_id)

        def mock_delete_docs(doc_ids: List[str], index: str) -> None:
            self.assertEqual(
                index, collection_services.SEARCH_INDEX_COLLECTIONS)
            self.assertEqual(
                doc_ids, [self.COLLECTION_0_ID, self.COLLECTION_1_ID])

        delete_docs_swap = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            mock_delete_docs)

        with delete_docs_swap:
            collection_services.delete_collections(
                self.owner_id, [self.COLLECTION_0_ID, self.COLLECTION_1_ID])

    def test_create_new_collection(self) -> None:
        # Test that creating a new collection (with an empty title, etc.)
        # succeeds.
        collection_domain.Collection.create_default_collection(
            self.COLLECTION_0_ID)

    def test_save_and_retrieve_collection(self) -> None:
        collection = self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id)
        collection_services._save_collection(  # pylint: disable=protected-access
            self.owner_id, collection, '',
            _get_collection_change_list('title', ''))

        retrieved_collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(retrieved_collection.title, 'A title')
        self.assertEqual(retrieved_collection.category, 'A category')
        self.assertEqual(len(retrieved_collection.nodes), 1)

    def test_save_and_retrieve_collection_summary(self) -> None:
        collection = self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id)
        collection_services._save_collection(  # pylint: disable=protected-access
            self.owner_id, collection, '',
            _get_collection_change_list('title', ''))

        # Change the collection's title and category properties.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID,
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
                self.COLLECTION_0_ID))

        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_collection_summary is not None
        self.assertEqual(
            retrieved_collection_summary.contributor_ids,
            [self.owner_id])
        self.assertEqual(retrieved_collection_summary.title, 'A new title')
        self.assertEqual(
            retrieved_collection_summary.category, 'A new category')

    def test_update_collection_by_migration_bot(self) -> None:
        exp_id = 'exp_id'
        self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id, exploration_id=exp_id)
        rights_manager.publish_exploration(self.owner, exp_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_0_ID)

        # This should not give an error.
        collection_services.update_collection(
            feconf.MIGRATION_BOT_USER_ID, self.COLLECTION_0_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Did migration.')

        # Check that the version of the collection is incremented.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.version, 2)

    def test_update_collection_schema(self) -> None:
        exp_id = 'exp_id'
        self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id, exploration_id=exp_id)
        rights_manager.publish_exploration(self.owner, exp_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_0_ID)

        # This should not give an error.
        collection_services.update_collection(
            feconf.MIGRATION_BOT_USER_ID, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
                'from_version': 2,
                'to_version': 3,
            }], 'Did migration.')

        # Check that the version of the collection is incremented.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.version, 2)


class LoadingAndDeletionOfCollectionDemosTests(CollectionServicesUnitTests):

    def test_loading_and_validation_and_deletion_of_demo_collections(
        self
    ) -> None:
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
            processing_time = duration.seconds + (duration.microseconds / 1E6)
            self.log_line(
                'Loaded and validated collection %s (%.2f seconds)' %
                (collection.title, processing_time))

        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(),
            len(feconf.DEMO_COLLECTIONS))

        for collection_id in feconf.DEMO_COLLECTIONS:
            collection_services.delete_demo(collection_id)
        self.assertEqual(
            collection_models.CollectionModel.get_collection_count(), 0)

    def test_load_demo_with_invalid_collection_id_raises_error(self) -> None:
        with self.assertRaisesRegex(Exception, 'Invalid demo collection id'):
            collection_services.load_demo('invalid_collection_id')

    def test_demo_file_path_ends_with_yaml(self) -> None:
        for collection_path in feconf.DEMO_COLLECTIONS.values():
            demo_filepath = os.path.join(
                feconf.SAMPLE_COLLECTIONS_DIR, collection_path)

            self.assertTrue(demo_filepath.endswith('yaml'))


class UpdateCollectionNodeTests(CollectionServicesUnitTests):
    """Test updating a single collection node."""

    EXPLORATION_ID: Final = 'exp_id_0'
    COLLECTION_TITLE: Final = 'title'
    COLLECTION_CATEGORY: Final = 'category'
    COLLECTION_OBJECTIVE: Final = 'objective'

    def setUp(self) -> None:
        super().setUp()
        self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXPLORATION_ID)

    def test_add_node(self) -> None:
        # Verify the initial collection only has 1 exploration in it.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.exploration_ids, [self.EXPLORATION_ID])

        new_exp_id = 'new_exploration_id'
        self.save_new_valid_exploration(new_exp_id, self.owner_id)
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': new_exp_id
            }], 'Added new exploration')

        # Verify the new exploration was added.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(
            collection.exploration_ids, [self.EXPLORATION_ID, new_exp_id])

    def test_add_node_with_non_existent_exploration(self) -> None:
        non_existent_exp_id = 'non_existent_exploration_id'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected collection to only reference valid explorations'):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_0_ID, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': non_existent_exp_id
                }], 'Added non-existent exploration')

    def test_add_node_with_private_exploration_in_public_collection(
        self
    ) -> None:
        """Ensures public collections cannot reference private explorations."""

        private_exp_id = 'private_exp_id0'
        self.save_new_valid_exploration(private_exp_id, self.owner_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_0_ID)

        self.assertTrue(
            rights_manager.is_collection_public(self.COLLECTION_0_ID))
        self.assertTrue(rights_manager.is_exploration_private(private_exp_id))
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Cannot reference a private exploration within a public '
            'collection'):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_0_ID, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': private_exp_id
                }], 'Added private exploration')

    def test_add_node_with_public_exploration_in_private_collection(
        self
    ) -> None:
        """Ensures private collections can reference public and private
        explorations.
        """
        public_exp_id = 'public_exp_id0'
        private_exp_id = 'private_exp_id0'
        self.save_new_valid_exploration(public_exp_id, self.owner_id)
        self.save_new_valid_exploration(private_exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, public_exp_id)

        self.assertTrue(
            rights_manager.is_collection_private(self.COLLECTION_0_ID))
        self.assertTrue(rights_manager.is_exploration_public(public_exp_id))
        self.assertTrue(rights_manager.is_exploration_private(private_exp_id))

        # No exception should be raised for either insertion.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': public_exp_id
            }, {
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': private_exp_id
            }], 'Added public and private explorations')

    def test_delete_node(self) -> None:
        # Verify the initial collection only has 1 exploration in it.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.exploration_ids, [self.EXPLORATION_ID])

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_DELETE_COLLECTION_NODE,
                'exploration_id': self.EXPLORATION_ID,
            }], 'Deleted exploration')

        # Verify the exploration was deleted (the collection is now empty).
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.nodes, [])

    def test_update_collection_title(self) -> None:
        # Verify initial title.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.title, self.COLLECTION_TITLE)

        # Update the title.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Some new title'
            }], 'Changed the title')

        # Verify the title is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.title, 'Some new title')

    def test_update_collection_category(self) -> None:
        # Verify initial category.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.category, self.COLLECTION_CATEGORY)

        # Update the category.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'category',
                'new_value': 'Some new category'
            }], 'Changed the category')

        # Verify the category is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.category, 'Some new category')

    def test_update_collection_objective(self) -> None:
        # Verify initial objective.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.objective, self.COLLECTION_OBJECTIVE)

        # Update the objective.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'objective',
                'new_value': 'Some new objective'
            }], 'Changed the objective')

        # Verify the objective is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.objective, 'Some new objective')

    def test_update_collection_language_code(self) -> None:
        # Verify initial language code.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.language_code, 'en')

        # Update the language code.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'language_code',
                'new_value': 'fi'
            }], 'Changed the language to Finnish')

        # Verify the language is different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.language_code, 'fi')

    def test_update_collection_tags(self) -> None:
        # Verify initial tags.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.tags, [])

        # Update the tags.
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'tags',
                'new_value': ['test']
            }], 'Add a new tag')

        # Verify that the tags are different.
        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        self.assertEqual(collection.tags, ['test'])

        # Verify that error will be thrown when duplicate tags are introduced.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected tags to be unique, but found duplicates'):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_0_ID, [{
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': 'tags',
                    'new_value': ['duplicate', 'duplicate']
                }], 'Add a new tag')


def _get_collection_change_list(
    property_name: str, new_value: str
) -> List[Dict[str, str]]:
    """Generates a change list for a single collection property change."""
    return [{
        'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
        'property_name': property_name,
        'new_value': new_value
    }]


def _get_added_exploration_change_list(
    exploration_id: str
) -> List[Dict[str, str]]:
    """Generates a change list for adding an exploration to a collection."""
    return [{
        'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
        'exploration_id': exploration_id
    }]


def _get_deleted_exploration_change_list(
    exploration_id: str
) -> List[Dict[str, str]]:
    """Generates a change list for deleting an exploration from a collection."""
    return [{
        'cmd': collection_domain.CMD_DELETE_COLLECTION_NODE,
        'exploration_id': exploration_id
    }]


class CommitMessageHandlingTests(CollectionServicesUnitTests):
    """Test the handling of commit messages."""

    EXP_ID: Final = 'an_exploration_id'

    def setUp(self) -> None:
        super().setUp()
        self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id, exploration_id=self.EXP_ID)

    def test_record_commit_message(self) -> None:
        """Check published collections record commit messages."""
        rights_manager.publish_collection(self.owner, self.COLLECTION_0_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_ID)

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), 'A message')

        self.assertEqual(
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID)[1]['commit_message'],
            'A message')

    def test_demand_commit_message(self) -> None:
        """Check published collections demand commit messages."""
        rights_manager.publish_collection(self.owner, self.COLLECTION_0_ID)

        with self.assertRaisesRegex(
            ValueError,
            'Collection is public so expected a commit message but '
            'received none.'
            ):
            collection_services.update_collection(
                self.owner_id, self.COLLECTION_0_ID,
                _get_collection_change_list(
                    collection_domain.COLLECTION_PROPERTY_TITLE, 'New Title'),
                '')

    def test_unpublished_collections_can_accept_commit_message(self) -> None:
        """Test unpublished collections can accept optional commit messages."""

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), 'A message')

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), '')

        collection_services.update_collection(
            self.owner_id, self.COLLECTION_0_ID, _get_collection_change_list(
                collection_domain.COLLECTION_PROPERTY_TITLE,
                'New Title'), None)


class CollectionSnapshotUnitTests(CollectionServicesUnitTests):
    """Test methods relating to collection snapshots."""

    SECOND_USERNAME: Final = 'abc123'
    SECOND_EMAIL: Final = 'abc123@gmail.com'

    def test_get_collection_snapshots_metadata(self) -> None:
        self.signup(self.SECOND_EMAIL, self.SECOND_USERNAME)
        second_committer_id = self.get_user_id_from_email(self.SECOND_EMAIL)

        exp_id = 'exp_id0'
        v1_collection = self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id, exploration_id=exp_id)

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
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
        rights_manager.publish_collection(self.owner, self.COLLECTION_0_ID)
        rights_manager.publish_exploration(self.owner, exp_id)

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
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
            self.owner_id, self.COLLECTION_0_ID, change_list, 'Changed title.')

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
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
        with self.assertRaisesRegex(Exception, 'version 1, which is too old'):
            collection_services._save_collection(  # pylint: disable=protected-access
                second_committer_id, v1_collection, '',
                _get_collection_change_list('title', ''))

        # Another person modifies the collection.
        new_change_list = [{
            'cmd': 'edit_collection_property',
            'property_name': 'title',
            'new_value': 'New title'
        }]
        collection_services.update_collection(
            second_committer_id, self.COLLECTION_0_ID, new_change_list,
            'Second commit.')

        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
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

    def test_versioning_with_add_and_delete_nodes(self) -> None:
        collection = self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.owner_id)

        collection.title = 'First title'
        collection_services._save_collection(  # pylint: disable=protected-access
            self.owner_id, collection, 'Changed title.',
            _get_collection_change_list('title', 'First title'))
        commit_dict_2 = {
            'committer_id': self.owner_id,
            'commit_message': 'Changed title.',
            'version_number': 2,
        }
        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
        self.assertEqual(len(snapshots_metadata), 2)

        collection = collection_services.get_collection_by_id(
            self.COLLECTION_0_ID)
        collection.add_node(
            self.save_new_valid_exploration(
                'new_exploration_id', self.owner_id).id)
        collection_services._save_collection(  # pylint: disable=protected-access
            'committer_id_2', collection, 'Added new exploration',
            _get_added_exploration_change_list('new_exploration_id'))

        commit_dict_3 = {
            'committer_id': 'committer_id_2',
            'commit_message': 'Added new exploration',
            'version_number': 3,
        }
        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
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
        with self.assertRaisesRegex(
            ValueError, 'is not part of this collection'
            ):
            collection.delete_node('invalid_exploration_id')

        # Now delete the newly added exploration.
        collection.delete_node('new_exploration_id')
        collection_services._save_collection(  # pylint: disable=protected-access
            'committer_id_3', collection, 'Deleted exploration',
            _get_deleted_exploration_change_list('new_exploration_id'))

        commit_dict_4 = {
            'committer_id': 'committer_id_3',
            'commit_message': 'Deleted exploration',
            'version_number': 4,
        }
        snapshots_metadata = (
            collection_services.get_collection_snapshots_metadata(
                self.COLLECTION_0_ID))
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
            self.COLLECTION_0_ID)
        self.assertEqual(len(collection.nodes), 1)


class CollectionSearchTests(CollectionServicesUnitTests):
    """Test collection search."""

    def test_index_collections_given_ids(self) -> None:
        all_collection_ids = ['id0', 'id1', 'id2', 'id3', 'id4']
        expected_collection_ids = all_collection_ids[:-1]
        all_collection_titles = [
            'title 0', 'title 1', 'title 2', 'title 3', 'title 4']
        expected_collection_titles = all_collection_titles[:-1]
        all_collection_categories = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4']
        expected_collection_categories = all_collection_categories[:-1]

        def mock_add_documents_to_index(
            docs: List[Dict[str, str]], index: str
        ) -> List[str]:
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

        for ind in range(5):
            self.save_new_valid_collection(
                all_collection_ids[ind],
                self.owner_id,
                title=all_collection_titles[ind],
                category=all_collection_categories[ind])

        # We're only publishing the first 4 collections, so we're not
        # expecting the last collection to be indexed.
        for ind in range(4):
            rights_manager.publish_collection(
                self.owner, expected_collection_ids[ind])

        with add_docs_swap:
            collection_services.index_collections_given_ids(all_collection_ids)

        self.assertEqual(add_docs_counter.times_called, 1)


class CollectionSummaryTests(CollectionServicesUnitTests):
    """Test collection summaries."""

    ALBERT_EMAIL: Final = 'albert@example.com'
    BOB_EMAIL: Final = 'bob@example.com'
    ALBERT_NAME: Final = 'albert'
    BOB_NAME: Final = 'bob'

    COLLECTION_ID_1: Final = 'cid1'
    COLLECTION_ID_2: Final = 'cid2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

    def test_is_editable_by(self) -> None:
        self.save_new_default_collection(self.COLLECTION_0_ID, self.owner_id)

        # Check that only the owner may edit.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_0_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert collection_summary is not None
        self.assertTrue(collection_summary.is_editable_by(
            user_id=self.owner_id))
        self.assertFalse(collection_summary.is_editable_by(
            user_id=self.editor_id))
        self.assertFalse(collection_summary.is_editable_by(
            user_id=self.viewer_id))

        # Owner makes viewer a viewer and editor an editor.
        rights_manager.assign_role_for_collection(
            self.owner, self.COLLECTION_0_ID, self.viewer_id,
            rights_domain.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            self.owner, self.COLLECTION_0_ID, self.editor_id,
            rights_domain.ROLE_EDITOR)

        # Check that owner and editor may edit, but not viewer.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_0_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert collection_summary is not None
        self.assertTrue(collection_summary.is_editable_by(
            user_id=self.owner_id))
        self.assertTrue(collection_summary.is_editable_by(
            user_id=self.editor_id))
        self.assertFalse(collection_summary.is_editable_by(
            user_id=self.viewer_id))

    def test_contributor_ids(self) -> None:
        albert = user_services.get_user_actions_info(self.albert_id)

        # Have Albert create a collection.
        self.save_new_valid_collection(self.COLLECTION_0_ID, self.albert_id)
        # Have Bob edit the collection.
        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection Bob title'
        }]
        collection_services.update_collection(
            self.bob_id, self.COLLECTION_0_ID, changelist_cmds,
            'Changed title to Bob title.')
        # Albert adds an owner and an editor.
        rights_manager.assign_role_for_collection(
            albert, self.COLLECTION_0_ID, self.viewer_id,
            rights_domain.ROLE_VIEWER)
        rights_manager.assign_role_for_collection(
            albert, self.COLLECTION_0_ID, self.editor_id,
            rights_domain.ROLE_EDITOR)
        # Verify that only Albert and Bob are listed as contributors for the
        # collection.
        collection_summary = collection_services.get_collection_summary_by_id(
            self.COLLECTION_0_ID)
        # Ruling out the possibility of None for mypy type checking.
        assert collection_summary is not None
        self.assertItemsEqual(
            collection_summary.contributor_ids,
            [self.albert_id, self.bob_id])

    def _check_contributors_summary(
        self, collection_id: str, expected: Dict[str, int]
    ) -> None:
        """Checks the contributors summary with the expected summary."""
        contributors_summary = collection_services.get_collection_summary_by_id(
            collection_id)
        # Ruling out the possibility of None for mypy type checking.
        assert contributors_summary is not None
        self.assertEqual(expected, contributors_summary.contributors_summary)

    def test_contributor_summary(self) -> None:
        # Have Albert create a new collection. Version 1.
        self.save_new_valid_collection(self.COLLECTION_0_ID, self.albert_id)
        self._check_contributors_summary(
            self.COLLECTION_0_ID, {self.albert_id: 1})
        changelist_cmds = [{
            'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
            'property_name': 'title',
            'new_value': 'Collection Bob title'
        }]
        # Have Bob update that collection. Version 2.
        collection_services.update_collection(
            self.bob_id,
            self.COLLECTION_0_ID,
            changelist_cmds,
            'Changed title.')
        self._check_contributors_summary(
            self.COLLECTION_0_ID,
            {self.albert_id: 1, self.bob_id: 1})
        # Have Bob update that collection. Version 3.
        collection_services.update_collection(
            self.bob_id,
            self.COLLECTION_0_ID,
            changelist_cmds,
            'Changed title.')
        self._check_contributors_summary(
            self.COLLECTION_0_ID,
            {self.albert_id: 1, self.bob_id: 2})

        # Have Albert update that collection. Version 4.
        collection_services.update_collection(
            self.albert_id,
            self.COLLECTION_0_ID,
            changelist_cmds,
            'Changed title.')
        self._check_contributors_summary(
            self.COLLECTION_0_ID,
            {self.albert_id: 2, self.bob_id: 2})

    def test_create_collection_summary_with_contributor_to_remove(self) -> None:
        self.save_new_valid_collection(
            self.COLLECTION_0_ID, self.albert_id)
        collection_services.update_collection(
            self.bob_id,
            self.COLLECTION_0_ID,
            [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Collection Bob title'
            }],
            'Changed title.')
        collection_services.regenerate_collection_and_contributors_summaries(
            self.COLLECTION_0_ID)

        self._check_contributors_summary(
            self.COLLECTION_0_ID, {self.albert_id: 1, self.bob_id: 1})

        user_services.mark_user_for_deletion(self.bob_id)
        collection_services.regenerate_collection_and_contributors_summaries(
            self.COLLECTION_0_ID)

        self._check_contributors_summary(
            self.COLLECTION_0_ID, {self.albert_id: 1})

    def test_raises_error_when_collection_provided_with_no_last_updated_data(
        self
    ) -> None:
        self.save_new_valid_collection('test_id', self.albert_id)
        collection = collection_services.get_collection_by_id('test_id')
        collection.last_updated = None

        with self.swap_to_always_return(
            collection_services, 'get_collection_by_id', collection
        ):
            with self.assertRaisesRegex(
                Exception,
                'No data available for when the collection was last_updated.'
            ):
                collection_services.regenerate_collection_and_contributors_summaries(  # pylint: disable=line-too-long
                    'test_id'
                )

    def test_raises_error_when_collection_provided_with_no_created_on_data(
        self
    ) -> None:
        self.save_new_valid_collection('test_id', self.albert_id)
        collection = collection_services.get_collection_by_id('test_id')
        collection.created_on = None

        with self.swap_to_always_return(
            collection_services, 'get_collection_by_id', collection
        ):
            with self.assertRaisesRegex(
                Exception,
                'No data available for when the collection was created.'
            ):
                collection_services.regenerate_collection_and_contributors_summaries(  # pylint: disable=line-too-long
                    'test_id'
                )


class GetCollectionAndCollectionRightsTests(CollectionServicesUnitTests):

    def test_get_collection_and_collection_rights_object(self) -> None:
        collection_id = self.COLLECTION_0_ID
        self.save_new_valid_collection(
            collection_id, self.owner_id, objective='The objective')

        (collection, collection_rights) = (
            collection_services.get_collection_and_collection_rights_by_id(
                collection_id))
        # Ruling out the possibility of None for mypy type checking.
        assert collection_rights is not None
        assert collection is not None
        self.assertEqual(collection.id, collection_id)
        self.assertEqual(collection_rights.id, collection_id)

        (collection, collection_rights) = (
            collection_services.get_collection_and_collection_rights_by_id(
                'fake_id'))
        self.assertIsNone(collection)
        self.assertIsNone(collection_rights)
