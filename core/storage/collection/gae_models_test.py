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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, collection_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.collection, models.NAMES.user])


class CollectionModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            collection_models.CollectionModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        collection = collection_domain.Collection.create_default_collection(
            'id', title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection('committer_id', collection)
        self.assertTrue(
            collection_models.CollectionModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            collection_models.CollectionModel
            .has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            collection_models.CollectionModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)

    def test_get_collection_count(self):
        collection = collection_domain.Collection.create_default_collection(
            'id', title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection('id', collection)

        num_collections = (
            collection_models.CollectionModel.get_collection_count())
        self.assertEqual(num_collections, 1)


class CollectionRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionRightsModel class."""
    COLLECTION_ID_1 = '1'
    COLLECTION_ID_2 = '2'
    COLLECTION_ID_3 = '3'
    COLLECTION_ID_4 = '4'
    USER_ID_1 = 'id_1'  # Related to all three collections
    USER_ID_2 = 'id_2'  # Related to a subset of the three collections
    USER_ID_3 = 'id_3'  # Related to no collections
    USER_ID_4 = 'id_4'  # Related to one collection and then removed from it
    USER_ID_COMMITTER = 'id_5'  # User id used in commits
    USER_ID_4_OLD = 'id_4_old'
    USER_ID_4_NEW = 'id_4_new'
    USER_ID_5_OLD = 'id_5_old'
    USER_ID_5_NEW = 'id_5_new'
    USER_ID_6_OLD = 'id_6_old'
    USER_ID_6_NEW = 'id_6_new'

    def setUp(self):
        super(CollectionRightsModelUnitTest, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_ID_1,
            gae_id='gae_1_id',
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_ID_2,
            gae_id='gae_2_id',
            email='some_other@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.1
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_2,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.2
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_3,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_2],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.3
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_4,
            owner_ids=[self.USER_ID_4],
            editor_ids=[self.USER_ID_4],
            voice_artist_ids=[self.USER_ID_4],
            viewer_ids=[self.USER_ID_4],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.4
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

        self.col_1_dict = (
            collection_models.CollectionRightsModel.get_by_id(
                self.COLLECTION_ID_1).to_dict())

    def test_get_deletion_policy(self):
        self.assertEqual(
            collection_models.CollectionRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_transform_dict_to_valid_format_basic(self):
        transformed_dict = (
            collection_models.CollectionRightsModel
            .transform_dict_to_valid(self.col_1_dict))
        self.assertEqual(transformed_dict, self.col_1_dict)

    def test_transform_dict_to_valid_format_status(self):
        broken_dict = dict(**self.col_1_dict)
        broken_dict['status'] = 'publicized'

        transformed_dict = (
            collection_models.CollectionRightsModel
            .transform_dict_to_valid(broken_dict))
        self.assertEqual(transformed_dict, self.col_1_dict)

    def test_transform_dict_to_valid_format_translator_ids(self):
        broken_dict = dict(**self.col_1_dict)
        del broken_dict['voice_artist_ids']
        broken_dict['translator_ids'] = [self.USER_ID_1]

        transformed_dict = (
            collection_models.CollectionRightsModel
            .transform_dict_to_valid(broken_dict))
        self.assertEqual(transformed_dict, self.col_1_dict)

    def test_has_reference_to_user_id(self):
        with self.swap(base_models, 'FETCH_BATCH_SIZE', 1):
            self.assertTrue(
                collection_models.CollectionRightsModel
                .has_reference_to_user_id(self.USER_ID_1))
            self.assertTrue(
                collection_models.CollectionRightsModel
                .has_reference_to_user_id(self.USER_ID_2))
            self.assertTrue(
                collection_models.CollectionRightsModel
                .has_reference_to_user_id(self.USER_ID_4))
            self.assertTrue(
                collection_models.CollectionRightsModel
                .has_reference_to_user_id(self.USER_ID_COMMITTER))
            self.assertFalse(
                collection_models.CollectionRightsModel
                .has_reference_to_user_id(self.USER_ID_3))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            collection_models.CollectionRightsModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.CUSTOM)

    def test_migrate_model(self):
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_1,
            owner_ids=[
                self.USER_ID_4_OLD, self.USER_ID_5_OLD, self.USER_ID_6_OLD],
            editor_ids=[
                self.USER_ID_4_OLD, self.USER_ID_5_OLD, self.USER_ID_6_OLD],
            voice_artist_ids=[
                self.USER_ID_4_OLD, self.USER_ID_5_OLD, self.USER_ID_6_OLD],
            viewer_ids=[
                self.USER_ID_4_OLD, self.USER_ID_5_OLD, self.USER_ID_6_OLD],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_2,
            owner_ids=[self.USER_ID_4_OLD],
            editor_ids=[self.USER_ID_4_OLD],
            voice_artist_ids=[self.USER_ID_5_OLD],
            viewer_ids=[self.USER_ID_6_OLD],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_3,
            owner_ids=[self.USER_ID_4_OLD, self.USER_ID_5_OLD],
            editor_ids=[self.USER_ID_5_OLD],
            voice_artist_ids=[self.USER_ID_6_OLD],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

        collection_models.CollectionRightsModel.migrate_model(
            self.USER_ID_4_OLD, self.USER_ID_4_NEW)
        collection_models.CollectionRightsModel.migrate_model(
            self.USER_ID_5_OLD, self.USER_ID_5_NEW)
        collection_models.CollectionRightsModel.migrate_model(
            self.USER_ID_6_OLD, self.USER_ID_6_NEW)

        migrated_model_1 = collection_models.CollectionRightsModel.get_by_id(
            self.COLLECTION_ID_1)
        self.assertEqual(
            [self.USER_ID_4_NEW, self.USER_ID_5_NEW, self.USER_ID_6_NEW],
            migrated_model_1.owner_ids)
        self.assertEqual(
            [self.USER_ID_4_NEW, self.USER_ID_5_NEW, self.USER_ID_6_NEW],
            migrated_model_1.editor_ids)
        self.assertEqual(
            [self.USER_ID_4_NEW, self.USER_ID_5_NEW, self.USER_ID_6_NEW],
            migrated_model_1.voice_artist_ids)
        self.assertEqual(
            [self.USER_ID_4_NEW, self.USER_ID_5_NEW, self.USER_ID_6_NEW],
            migrated_model_1.viewer_ids)

        migrated_model_2 = collection_models.CollectionRightsModel.get_by_id(
            self.COLLECTION_ID_2)
        self.assertEqual([self.USER_ID_4_NEW], migrated_model_2.owner_ids)
        self.assertEqual([self.USER_ID_4_NEW], migrated_model_2.editor_ids)
        self.assertEqual(
            [self.USER_ID_5_NEW], migrated_model_2.voice_artist_ids)
        self.assertEqual([self.USER_ID_6_NEW], migrated_model_2.viewer_ids)

        migrated_model_3 = collection_models.CollectionRightsModel.get_by_id(
            self.COLLECTION_ID_3)
        self.assertEqual(
            [self.USER_ID_4_NEW, self.USER_ID_5_NEW],
            migrated_model_3.owner_ids)
        self.assertEqual([self.USER_ID_5_NEW], migrated_model_3.editor_ids)
        self.assertEqual(
            [self.USER_ID_6_NEW], migrated_model_3.voice_artist_ids)
        self.assertEqual([], migrated_model_3.viewer_ids)

    def test_verify_model_user_ids_exist(self):
        model = collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_1,
            owner_ids=[self.USER_ID_1, self.USER_ID_2],
            editor_ids=[self.USER_ID_1, self.USER_ID_2],
            voice_artist_ids=[self.USER_ID_1, self.USER_ID_2],
            viewer_ids=[self.USER_ID_1, self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        )
        self.assertTrue(model.verify_model_user_ids_exist())

        model.owner_ids = [feconf.SYSTEM_COMMITTER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())
        model.owner_ids = [feconf.MIGRATION_BOT_USER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())
        model.owner_ids = [feconf.SUGGESTION_BOT_USER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())

        model.owner_ids = [self.USER_ID_1, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.owner_ids = [self.USER_ID_1, self.USER_ID_2]
        model.editor_ids = [self.USER_ID_1, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.editor_ids = [self.USER_ID_1, self.USER_ID_2]
        model.voice_artist_ids = [self.USER_ID_1, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.voice_artist_ids = [self.USER_ID_1, self.USER_ID_2]
        model.viewer_ids = [self.USER_ID_1, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

    def test_save(self):
        collection_models.CollectionRightsModel(
            id='id',
            owner_ids=['owner_ids'],
            editor_ids=['editor_ids'],
            voice_artist_ids=['voice_artist_ids'],
            viewer_ids=['viewer_ids'],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
            ).save(self.USER_ID_COMMITTER, 'Created new collection',
                   [{'cmd': rights_manager.CMD_CREATE_NEW}])
        collection_model = collection_models.CollectionRightsModel.get('id')
        self.assertEqual('id', collection_model.id)

    def test_export_data_on_highly_involved_user(self):
        """Test export data on user involved in all datastore collections."""
        collection_ids = (
            collection_models.CollectionRightsModel.export_data(
                self.USER_ID_1))
        expected_collection_ids = {
            'owned_collection_ids': (
                [self.COLLECTION_ID_1,
                 self.COLLECTION_ID_2,
                 self.COLLECTION_ID_3]),
            'editable_collection_ids': (
                [self.COLLECTION_ID_1,
                 self.COLLECTION_ID_2,
                 self.COLLECTION_ID_3]),
            'voiced_collection_ids': (
                [self.COLLECTION_ID_1, self.COLLECTION_ID_2]),
            'viewable_collection_ids': [self.COLLECTION_ID_2]
        }

        self.assertEqual(expected_collection_ids, collection_ids)

    def test_export_data_on_partially_involved_user(self):
        """Test export data on user involved in some datastore collections."""
        collection_ids = (
            collection_models.CollectionRightsModel.export_data(
                self.USER_ID_2))
        expected_collection_ids = {
            'owned_collection_ids': [],
            'editable_collection_ids': [],
            'voiced_collection_ids': [self.COLLECTION_ID_3],
            'viewable_collection_ids': (
                [self.COLLECTION_ID_1, self.COLLECTION_ID_3])
        }
        self.assertEqual(expected_collection_ids, collection_ids)

    def test_export_data_on_uninvolved_user(self):
        """Test for empty lists when user has no collection involvement."""
        collection_ids = (
            collection_models.CollectionRightsModel.export_data(
                self.USER_ID_3))
        expected_collection_ids = {
            'owned_collection_ids': [],
            'editable_collection_ids': [],
            'voiced_collection_ids': [],
            'viewable_collection_ids': []
        }
        self.assertEqual(expected_collection_ids, collection_ids)

    def test_export_data_on_invalid_user(self):
        """Test for empty lists when the user_id is invalid."""
        collection_ids = (
            collection_models.CollectionRightsModel.export_data(
                'fake_user'))
        expected_collection_ids = {
            'owned_collection_ids': [],
            'editable_collection_ids': [],
            'voiced_collection_ids': [],
            'viewable_collection_ids': []
        }
        self.assertEqual(expected_collection_ids, collection_ids)


class CollectionCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            collection_models.CollectionCommitLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.collection_id = 'b'
        commit.put()
        self.assertTrue(
            collection_models.CollectionCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            collection_models.CollectionCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test_get_all_non_private_commits(self):
        private_commit = collection_models.CollectionCommitLogEntryModel.create(
            'a', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PRIVATE, False)
        public_commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        private_commit.collection_id = 'a'
        public_commit.collection_id = 'b'
        private_commit.put()
        public_commit.put()
        commits = (
            collection_models.CollectionCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=None))
        self.assertEqual(False, commits[2])
        self.assertEqual('collection-b-0', commits[0][0].id)

    def test_get_all_non_private_commits_with_invalid_max_age(self):
        with self.assertRaisesRegexp(
            Exception,
            'max_age must be a datetime.timedelta instance or None.'):
            (
                collection_models.CollectionCommitLogEntryModel
                .get_all_non_private_commits(
                    2, None, max_age='invalid_max_age'))

    def test_get_all_non_private_commits_with_max_age(self):
        private_commit = collection_models.CollectionCommitLogEntryModel.create(
            'a', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PRIVATE, False)
        public_commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        # We need to manually set collection_id as it is a property of
        # CollectionCommitLogEntryModel only and create() does not accept
        # collection_id as a parameter. This property is set in
        # CollectionModel._trusted_commit().
        private_commit.collection_id = 'a'
        public_commit.collection_id = 'b'
        private_commit.put()
        public_commit.put()

        max_age = datetime.timedelta(hours=1)
        results, _, more = (
            collection_models.CollectionCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=max_age))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)
        self.assertEqual('collection-b-0', results[0].id)


class CollectionSummaryModelUnitTest(test_utils.GenericTestBase):
    """Tests for the CollectionSummaryModel."""

    COLLECTION_ID_1 = '1'
    COLLECTION_ID_2 = '2'
    COLLECTION_ID_3 = '3'
    USER_ID_1_OLD = 'id_1_old'
    USER_ID_1_NEW = 'id_1_new'
    USER_ID_2_OLD = 'id_2_old'
    USER_ID_2_NEW = 'id_2_new'
    USER_ID_3_OLD = 'id_3_old'
    USER_ID_3_NEW = 'id_3_new'

    def setUp(self):
        super(CollectionSummaryModelUnitTest, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_ID_1_NEW,
            gae_id='gae_1_id',
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_ID_2_NEW,
            gae_id='gae_2_id',
            email='some_other@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            collection_models.CollectionSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        collection_models.CollectionSummaryModel(
            id='id0',
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            viewer_ids=['viewer_id'],
            contributor_ids=['contributor_id'],
        ).put()
        self.assertTrue(
            collection_models.CollectionSummaryModel
            .has_reference_to_user_id('owner_id'))
        self.assertTrue(
            collection_models.CollectionSummaryModel
            .has_reference_to_user_id('editor_id'))
        self.assertTrue(
            collection_models.CollectionSummaryModel
            .has_reference_to_user_id('viewer_id'))
        self.assertTrue(
            collection_models.CollectionSummaryModel
            .has_reference_to_user_id('contributor_id'))
        self.assertFalse(
            collection_models.CollectionSummaryModel
            .has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            collection_models.CollectionSummaryModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.CUSTOM)

    def test_migrate_model(self):
        collection_models.CollectionSummaryModel(
            id=self.COLLECTION_ID_1,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            editor_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            viewer_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            contributor_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
        ).put()
        collection_models.CollectionSummaryModel(
            id=self.COLLECTION_ID_2,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[self.USER_ID_1_OLD],
            editor_ids=[self.USER_ID_1_OLD],
            viewer_ids=[self.USER_ID_2_OLD],
            contributor_ids=[self.USER_ID_3_OLD],
        ).put()
        collection_models.CollectionSummaryModel(
            id=self.COLLECTION_ID_3,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[self.USER_ID_1_OLD, self.USER_ID_2_OLD],
            editor_ids=[self.USER_ID_2_OLD],
            viewer_ids=[],
            contributor_ids=[self.USER_ID_3_OLD],
        ).put()

        collection_models.CollectionSummaryModel.migrate_model(
            self.USER_ID_1_OLD, self.USER_ID_1_NEW)
        collection_models.CollectionSummaryModel.migrate_model(
            self.USER_ID_2_OLD, self.USER_ID_2_NEW)
        collection_models.CollectionSummaryModel.migrate_model(
            self.USER_ID_3_OLD, self.USER_ID_3_NEW)

        migrated_model_1 = collection_models.CollectionSummaryModel.get_by_id(
            self.COLLECTION_ID_1)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.owner_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.editor_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.viewer_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.contributor_ids)

        migrated_model_2 = collection_models.CollectionSummaryModel.get_by_id(
            self.COLLECTION_ID_2)
        self.assertEqual([self.USER_ID_1_NEW], migrated_model_2.owner_ids)
        self.assertEqual([self.USER_ID_1_NEW], migrated_model_2.editor_ids)
        self.assertEqual([self.USER_ID_2_NEW], migrated_model_2.viewer_ids)
        self.assertEqual([self.USER_ID_3_NEW], migrated_model_2.contributor_ids)

        migrated_model_3 = collection_models.CollectionSummaryModel.get_by_id(
            self.COLLECTION_ID_3)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            migrated_model_3.owner_ids)
        self.assertEqual([self.USER_ID_2_NEW], migrated_model_3.editor_ids)
        self.assertEqual([], migrated_model_3.viewer_ids)
        self.assertEqual([self.USER_ID_3_NEW], migrated_model_3.contributor_ids)

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

    def test_verify_model_user_ids_exist(self):
        model = collection_models.CollectionSummaryModel(
            id=self.COLLECTION_ID_1,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            editor_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            viewer_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            contributor_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
        )
        self.assertTrue(model.verify_model_user_ids_exist())

        model.owner_ids = [feconf.SYSTEM_COMMITTER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())
        model.owner_ids = [feconf.MIGRATION_BOT_USER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())
        model.owner_ids = [feconf.SUGGESTION_BOT_USER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())

        model.owner_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.owner_ids = [self.USER_ID_1_NEW, self.USER_ID_2_NEW]
        model.editor_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.editor_ids = [self.USER_ID_1_NEW, self.USER_ID_2_NEW]
        model.viewer_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.viewer_ids = [self.USER_ID_1_NEW, self.USER_ID_2_NEW]
        model.contributor_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())
