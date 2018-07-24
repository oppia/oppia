# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for collection models."""
from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils

(collection_models,) = models.Registry.import_models(
    [models.NAMES.collection])


class CollectionModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionModel class."""

    def test_get_collection_count(self):
        collection = collection_domain.Collection.create_default_collection(
            'id', title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection('id', collection)

        num_collections = (
            collection_models.CollectionModel.get_collection_count())
        self.assertEquals(num_collections, 1)


class CollectionRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionRightsModel class."""

    def test_save(self):
        collection_models.CollectionRightsModel(
            id='id',
            owner_ids=['owner_ids'],
            editor_ids=['editor_ids'],
            translator_ids=['translator_ids'],
            viewer_ids=['viewer_ids'],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
            ).save('cid', 'Created new collection',
                   [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_model = collection_models.CollectionRightsModel.get('id')
        self.assertEqual('id', collection_model.id)


class CollectionCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionCommitLogEntryModel class."""

    def test_get_all_non_private_commits(self):
        private_commit = collection_models.CollectionCommitLogEntryModel.create(
            '-a-', 0, 'commiter_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PRIVATE, False)
        public_commit = collection_models.CollectionCommitLogEntryModel.create(
            '-b-', 0, 'commiter_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        private_commit.collection_id = 'a'
        public_commit.collection_id = 'b'
        private_commit.put()
        public_commit.put()
        commits = (
            collection_models.CollectionCommitLogEntryModel
            .get_all_non_private_commits(2, None, None))
        self.assertEquals(False, commits[2])
        self.assertEquals('collection--b--0', commits[0][0].id)


class CollectionSummaryModelUnitTest(test_utils.GenericTestBase):
    """Tests for the CollectionSummaryModel."""

    def test_get_non_private(self):
        public_collection_summary_model = (
            collection_models.CollectionSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tags'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_ids'],
                editor_ids=['editor_ids'],
                viewer_ids=['viewer_ids'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                node_count=0,
                collection_model_last_updated=None,
                collection_model_created_on=None,
            ))
        public_collection_summary_model.put()

        private_collection_summary_model = (
            collection_models.CollectionSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tags'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_ids'],
                editor_ids=['editor_ids'],
                viewer_ids=['viewer_ids'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                node_count=0,
                collection_model_last_updated=None,
                collection_model_created_on=None,
            ))
        private_collection_summary_model.put()
        collection_summary_models = (
            collection_models.CollectionSummaryModel.get_non_private())
        self.assertEqual(1, len(collection_summary_models))

    def test_get_private_at_least_viewable(self):
        viewable_collection_summary_model = (
            collection_models.CollectionSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tags'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_ids'],
                editor_ids=['editor_ids'],
                viewer_ids=['a'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                node_count=0,
                collection_model_last_updated=None,
                collection_model_created_on=None,
            ))
        viewable_collection_summary_model.put()

        unviewable_collection_summary_model = (
            collection_models.CollectionSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tags'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_ids'],
                editor_ids=['editor_ids'],
                viewer_ids=['viewer_ids'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                node_count=0,
                collection_model_last_updated=None,
                collection_model_created_on=None,
            ))
        unviewable_collection_summary_model.put()
        collection_summary_models = (
            collection_models.CollectionSummaryModel
            .get_private_at_least_viewable('a'))
        self.assertEqual(1, len(collection_summary_models))
        self.assertEqual('id0', collection_summary_models[0].id)

    def test_get_at_least_editable(self):
        editable_collection_summary_model = (
            collection_models.CollectionSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tags'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['a'],
                editor_ids=['editor_ids'],
                viewer_ids=['viewer_ids'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                node_count=0,
                collection_model_last_updated=None,
                collection_model_created_on=None,
            ))
        editable_collection_summary_model.put()

        uneditable_collection_summary_model = (
            collection_models.CollectionSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tags'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_ids'],
                editor_ids=['editor_ids'],
                viewer_ids=['viewer_ids'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                node_count=0,
                collection_model_last_updated=None,
                collection_model_created_on=None,
            ))
        uneditable_collection_summary_model.put()
        collection_summary_models = (
            collection_models.CollectionSummaryModel
            .get_at_least_editable('a'))
        self.assertEqual(1, len(collection_summary_models))
        self.assertEqual('id0', collection_summary_models[0].id)
        collection_summary_models = (
            collection_models.CollectionSummaryModel
            .get_at_least_editable('viewer_ids'))
        self.assertEqual(0, len(collection_summary_models))
