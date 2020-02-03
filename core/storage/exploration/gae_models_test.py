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

"""Tests for Exploration models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, exp_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration, models.NAMES.user])


class ExplorationModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            exp_models.ExplorationModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('committer_id', exploration)
        self.assertTrue(
            exp_models.ExplorationModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            exp_models.ExplorationModel
            .has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            exp_models.ExplorationModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)

    def test_get_exploration_count(self):
        exploration = exp_domain.Exploration.create_default_exploration(
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('id', exploration)

        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 1)
        saved_exploration = (
            exp_models.ExplorationModel.get_all().fetch(limit=1)[0])
        self.assertEqual(saved_exploration.title, 'A Title')
        self.assertEqual(saved_exploration.category, 'A Category')
        self.assertEqual(saved_exploration.objective, 'An Objective')


class ExplorationRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationRightsModel class."""
    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    EXPLORATION_ID_4 = '4'
    USER_ID_1 = 'id_1'  # Related to all three explorations
    USER_ID_2 = 'id_2'  # Related to a subset of the three explorations
    USER_ID_3 = 'id_3'  # Related to no explorations
    USER_ID_4 = 'id_4'  # Related to one collection and then removed from it
    USER_ID_COMMITTER = 'id_5'  # User id used in commits
    USER_ID_4_OLD = 'id_4_old'
    USER_ID_4_NEW = 'id_4_new'
    USER_ID_5_OLD = 'id_5_old'
    USER_ID_5_NEW = 'id_5_new'
    USER_ID_6_OLD = 'id_6_old'
    USER_ID_6_NEW = 'id_6_new'

    def setUp(self):
        super(ExplorationRightsModelUnitTest, self).setUp()
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
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_2,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_3,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_2],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_4,
            owner_ids=[self.USER_ID_4],
            editor_ids=[self.USER_ID_4],
            voice_artist_ids=[self.USER_ID_4],
            viewer_ids=[self.USER_ID_4],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.4
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])

        self.exp_1_dict = (
            exp_models.ExplorationRightsModel.get_by_id(
                self.EXPLORATION_ID_1).to_dict())

    def test_get_deletion_policy(self):
        self.assertEqual(
            exp_models.ExplorationRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_transform_dict_to_valid_format_basic(self):
        transformed_dict = (
            exp_models.ExplorationRightsModel
            .transform_dict_to_valid(self.exp_1_dict))
        self.assertEqual(transformed_dict, self.exp_1_dict)

    def test_transform_dict_to_valid_format_all_viewer_ids(self):
        broken_dict = dict(**self.exp_1_dict)
        broken_dict['all_viewer_ids'] = [self.USER_ID_1, self.USER_ID_2]

        transformed_dict = (
            exp_models.ExplorationRightsModel
            .transform_dict_to_valid(broken_dict))
        self.assertEqual(transformed_dict, self.exp_1_dict)

    def test_transform_dict_to_valid_format_status(self):
        broken_dict = dict(**self.exp_1_dict)
        broken_dict['status'] = 'publicized'

        transformed_dict = (
            exp_models.ExplorationRightsModel
            .transform_dict_to_valid(broken_dict))
        self.assertEqual(transformed_dict, self.exp_1_dict)

    def test_transform_dict_to_valid_format_translator_ids(self):
        broken_dict = dict(**self.exp_1_dict)
        del broken_dict['voice_artist_ids']
        broken_dict['translator_ids'] = [self.USER_ID_1]

        transformed_dict = (
            exp_models.ExplorationRightsModel
            .transform_dict_to_valid(broken_dict))
        self.assertEqual(transformed_dict, self.exp_1_dict)

    def test_has_reference_to_user_id(self):
        with self.swap(base_models, 'FETCH_BATCH_SIZE', 1):
            self.assertTrue(
                exp_models.ExplorationRightsModel
                .has_reference_to_user_id(self.USER_ID_1))
            self.assertTrue(
                exp_models.ExplorationRightsModel
                .has_reference_to_user_id(self.USER_ID_2))
            self.assertTrue(
                exp_models.ExplorationRightsModel
                .has_reference_to_user_id(self.USER_ID_4))
            self.assertTrue(
                exp_models.ExplorationRightsModel
                .has_reference_to_user_id(self.USER_ID_COMMITTER))
            self.assertFalse(
                exp_models.ExplorationRightsModel
                .has_reference_to_user_id(self.USER_ID_3))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            exp_models.ExplorationRightsModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.CUSTOM)

    def test_migrate_model(self):
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_1,
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
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_2,
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
        exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_3,
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

        exp_models.ExplorationRightsModel.migrate_model(
            self.USER_ID_4_OLD, self.USER_ID_4_NEW)
        exp_models.ExplorationRightsModel.migrate_model(
            self.USER_ID_5_OLD, self.USER_ID_5_NEW)
        exp_models.ExplorationRightsModel.migrate_model(
            self.USER_ID_6_OLD, self.USER_ID_6_NEW)

        migrated_model_1 = exp_models.ExplorationRightsModel.get_by_id(
            self.EXPLORATION_ID_1)
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

        migrated_model_2 = exp_models.ExplorationRightsModel.get_by_id(
            self.EXPLORATION_ID_2)
        self.assertEqual([self.USER_ID_4_NEW], migrated_model_2.owner_ids)
        self.assertEqual([self.USER_ID_4_NEW], migrated_model_2.editor_ids)
        self.assertEqual(
            [self.USER_ID_5_NEW], migrated_model_2.voice_artist_ids)
        self.assertEqual([self.USER_ID_6_NEW], migrated_model_2.viewer_ids)

        migrated_model_3 = exp_models.ExplorationRightsModel.get_by_id(
            self.EXPLORATION_ID_3)
        self.assertEqual(
            [self.USER_ID_4_NEW, self.USER_ID_5_NEW],
            migrated_model_3.owner_ids)
        self.assertEqual([self.USER_ID_5_NEW], migrated_model_3.editor_ids)
        self.assertEqual(
            [self.USER_ID_6_NEW], migrated_model_3.voice_artist_ids)
        self.assertEqual([], migrated_model_3.viewer_ids)

    def test_verify_model_user_ids_exist(self):
        model = exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_1,
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
        exp_models.ExplorationRightsModel(
            id='id_0',
            owner_ids=['owner_id'],
            editor_ids=['editor_id'],
            voice_artist_ids=['voice_artist_id'],
            viewer_ids=['viewer_id'],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.0
        ).save(
            'cid', 'Created new exploration right',
            [{'cmd': rights_manager.CMD_CREATE_NEW}])
        saved_model = exp_models.ExplorationRightsModel.get('id_0')
        self.assertEqual(saved_model.id, 'id_0')
        self.assertEqual(saved_model.owner_ids, ['owner_id'])
        self.assertEqual(saved_model.voice_artist_ids, ['voice_artist_id'])
        self.assertEqual(saved_model.viewer_ids, ['viewer_id'])

    def test_export_data_on_highly_involved_user(self):
        """Test export data on user involved in all datastore explorations."""
        exploration_ids = (
            exp_models.ExplorationRightsModel.export_data(
                self.USER_ID_1))
        expected_exploration_ids = {
            'owned_exploration_ids': (
                [self.EXPLORATION_ID_1,
                 self.EXPLORATION_ID_2,
                 self.EXPLORATION_ID_3]),
            'editable_exploration_ids': (
                [self.EXPLORATION_ID_1,
                 self.EXPLORATION_ID_2,
                 self.EXPLORATION_ID_3]),
            'voiced_exploration_ids': (
                [self.EXPLORATION_ID_1, self.EXPLORATION_ID_2]),
            'viewable_exploration_ids': [self.EXPLORATION_ID_2]
        }
        self.assertEqual(expected_exploration_ids, exploration_ids)

    def test_export_data_on_partially_involved_user(self):
        """Test export data on user involved in some datastore explorations."""
        exploration_ids = (
            exp_models.ExplorationRightsModel.export_data(
                self.USER_ID_2))
        expected_exploration_ids = {
            'owned_exploration_ids': [],
            'editable_exploration_ids': [],
            'voiced_exploration_ids': [self.EXPLORATION_ID_3],
            'viewable_exploration_ids': (
                [self.EXPLORATION_ID_1, self.EXPLORATION_ID_3])
        }
        self.assertEqual(expected_exploration_ids, exploration_ids)

    def test_export_data_on_uninvolved_user(self):
        """Test for empty lists when user has no exploration involvement."""
        exploration_ids = (
            exp_models.ExplorationRightsModel.export_data(
                self.USER_ID_3))
        expected_exploration_ids = {
            'owned_exploration_ids': [],
            'editable_exploration_ids': [],
            'voiced_exploration_ids': [],
            'viewable_exploration_ids': []
        }
        self.assertEqual(expected_exploration_ids, exploration_ids)

    def test_export_data_on_nonexistent_user(self):
        """Test for empty lists when user has no exploration involvement."""
        exploration_ids = (
            exp_models.ExplorationRightsModel.export_data(
                'fake_user'))
        expected_exploration_ids = {
            'owned_exploration_ids': [],
            'editable_exploration_ids': [],
            'voiced_exploration_ids': [],
            'viewable_exploration_ids': []
        }
        self.assertEqual(expected_exploration_ids, exploration_ids)


class ExplorationCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            exp_models.ExplorationCommitLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = exp_models.ExplorationCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg',
            'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.exploration_id = 'b'
        commit.put()
        self.assertTrue(
            exp_models.ExplorationCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            exp_models.ExplorationCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test_get_all_non_private_commits(self):
        private_commit = (
            exp_models.ExplorationCommitLogEntryModel.create(
                'a', 1, 'committer_id', 'username', 'msg',
                'create', [{}],
                constants.ACTIVITY_STATUS_PRIVATE, False))
        public_commit = (
            exp_models.ExplorationCommitLogEntryModel.create(
                'b', 1, 'committer_id', 'username', 'msg',
                'create', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        private_commit.exploration_id = 'a'
        public_commit.exploration_id = 'b'
        private_commit.put()
        public_commit.put()
        results, _, more = (
            exp_models.ExplorationCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=None))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)

        with self.assertRaisesRegexp(
            Exception,
            'max_age must be a datetime.timedelta instance or None.'):
            results, _, more = (
                exp_models.ExplorationCommitLogEntryModel
                .get_all_non_private_commits(2, None, max_age=1))

        max_age = datetime.timedelta(hours=1)
        results, _, more = (
            exp_models.ExplorationCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=max_age))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)

    def test_get_multi(self):
        commit1 = (
            exp_models.ExplorationCommitLogEntryModel.create(
                'a', 1, 'committer_id', 'username', 'msg',
                'create', [{}],
                constants.ACTIVITY_STATUS_PRIVATE, False))
        commit2 = (
            exp_models.ExplorationCommitLogEntryModel.create(
                'a', 2, 'committer_id', 'username', 'msg',
                'create', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        commit1.exploration_id = 'a'
        commit2.exploration_id = 'a'
        commit1.put()
        commit2.put()

        actual_models = (
            exp_models.ExplorationCommitLogEntryModel.get_multi(
                'a', [1, 2, 3]))

        self.assertEqual(len(actual_models), 3)
        self.assertEqual(actual_models[0].id, 'exploration-a-1')
        self.assertEqual(actual_models[1].id, 'exploration-a-2')
        self.assertIsNone(actual_models[2])


class ExpSummaryModelUnitTest(test_utils.GenericTestBase):
    """Tests for the ExpSummaryModel."""

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    USER_ID_1_OLD = 'id_1_old'
    USER_ID_1_NEW = 'id_1_new'
    USER_ID_2_OLD = 'id_2_old'
    USER_ID_2_NEW = 'id_2_new'
    USER_ID_3_OLD = 'id_3_old'
    USER_ID_3_NEW = 'id_3_new'

    def setUp(self):
        super(ExpSummaryModelUnitTest, self).setUp()
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
            exp_models.ExpSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        exp_models.ExpSummaryModel(
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
            exp_models.ExpSummaryModel
            .has_reference_to_user_id('owner_id'))
        self.assertTrue(
            exp_models.ExpSummaryModel
            .has_reference_to_user_id('editor_id'))
        self.assertTrue(
            exp_models.ExpSummaryModel
            .has_reference_to_user_id('viewer_id'))
        self.assertTrue(
            exp_models.ExpSummaryModel
            .has_reference_to_user_id('contributor_id'))
        self.assertFalse(
            exp_models.ExpSummaryModel
            .has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            exp_models.ExpSummaryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.CUSTOM)

    def test_migrate_model(self):
        exp_models.ExpSummaryModel(
            id=self.EXPLORATION_ID_1,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            editor_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            voice_artist_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            viewer_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
            contributor_ids=[
                self.USER_ID_1_OLD, self.USER_ID_2_OLD, self.USER_ID_3_OLD],
        ).put()
        exp_models.ExpSummaryModel(
            id=self.EXPLORATION_ID_2,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[self.USER_ID_1_OLD],
            editor_ids=[self.USER_ID_1_OLD],
            voice_artist_ids=[self.USER_ID_2_OLD],
            viewer_ids=[self.USER_ID_2_OLD],
            contributor_ids=[self.USER_ID_3_OLD],
        ).put()
        exp_models.ExpSummaryModel(
            id=self.EXPLORATION_ID_3,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[self.USER_ID_1_OLD, self.USER_ID_2_OLD],
            editor_ids=[self.USER_ID_2_OLD],
            voice_artist_ids=[],
            viewer_ids=[],
            contributor_ids=[self.USER_ID_3_OLD],
        ).put()

        exp_models.ExpSummaryModel.migrate_model(
            self.USER_ID_1_OLD, self.USER_ID_1_NEW)
        exp_models.ExpSummaryModel.migrate_model(
            self.USER_ID_2_OLD, self.USER_ID_2_NEW)
        exp_models.ExpSummaryModel.migrate_model(
            self.USER_ID_3_OLD, self.USER_ID_3_NEW)

        migrated_model_1 = exp_models.ExpSummaryModel.get_by_id(
            self.EXPLORATION_ID_1)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.owner_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.editor_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.voice_artist_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.viewer_ids)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW, self.USER_ID_3_NEW],
            migrated_model_1.contributor_ids)

        migrated_model_2 = exp_models.ExpSummaryModel.get_by_id(
            self.EXPLORATION_ID_2)
        self.assertEqual([self.USER_ID_1_NEW], migrated_model_2.owner_ids)
        self.assertEqual([self.USER_ID_1_NEW], migrated_model_2.editor_ids)
        self.assertEqual(
            [self.USER_ID_2_NEW], migrated_model_2.voice_artist_ids)
        self.assertEqual([self.USER_ID_2_NEW], migrated_model_2.viewer_ids)
        self.assertEqual([self.USER_ID_3_NEW], migrated_model_2.contributor_ids)

        migrated_model_3 = exp_models.ExpSummaryModel.get_by_id(
            self.EXPLORATION_ID_3)
        self.assertEqual(
            [self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            migrated_model_3.owner_ids)
        self.assertEqual([self.USER_ID_2_NEW], migrated_model_3.editor_ids)
        self.assertEqual([], migrated_model_3.voice_artist_ids)
        self.assertEqual([], migrated_model_3.viewer_ids)
        self.assertEqual([self.USER_ID_3_NEW], migrated_model_3.contributor_ids)

    def test_get_non_private(self):
        public_exploration_summary_model = (
            exp_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        public_exploration_summary_model.put()

        private_exploration_summary_model = (
            exp_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        private_exploration_summary_model.put()
        exploration_summary_models = (
            exp_models.ExpSummaryModel.get_non_private())
        self.assertEqual(
            exploration_summary_models,
            [public_exploration_summary_model])

    def test_get_top_rated(self):
        good_rating_exploration_summary_model = (
            exp_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        good_rating_exploration_summary_model.scaled_average_rating = 100
        good_rating_exploration_summary_model.put()

        bad_rating_exploration_summary_model = (
            exp_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PUBLIC,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        bad_rating_exploration_summary_model.scaled_average_rating = 0
        bad_rating_exploration_summary_model.put()

        self.assertEqual(
            exp_models.ExpSummaryModel.get_top_rated(1),
            [good_rating_exploration_summary_model])
        self.assertEqual(
            exp_models.ExpSummaryModel.get_top_rated(2),
            [good_rating_exploration_summary_model,
             bad_rating_exploration_summary_model])
        self.assertEqual(
            exp_models.ExpSummaryModel.get_top_rated(3),
            [good_rating_exploration_summary_model,
             bad_rating_exploration_summary_model])

        # Test that private summaries should be ignored.
        good_rating_exploration_summary_model.status = (
            constants.ACTIVITY_STATUS_PRIVATE)
        good_rating_exploration_summary_model.put()
        self.assertEqual(
            exp_models.ExpSummaryModel.get_top_rated(2),
            [bad_rating_exploration_summary_model])

    def test_get_private_at_least_viewable(self):
        viewable_exploration_summary_model = (
            exp_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['a'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        viewable_exploration_summary_model.put()

        unviewable_exploration_summary_model = (
            exp_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        unviewable_exploration_summary_model.put()
        exploration_summary_models = (
            exp_models.ExpSummaryModel
            .get_private_at_least_viewable('a'))
        self.assertEqual(1, len(exploration_summary_models))
        self.assertEqual('id0', exploration_summary_models[0].id)

    def test_get_at_least_editable(self):
        editable_collection_summary_model = (
            exp_models.ExpSummaryModel(
                id='id0',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['a'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        editable_collection_summary_model.put()

        uneditable_collection_summary_model = (
            exp_models.ExpSummaryModel(
                id='id1',
                title='title',
                category='category',
                objective='objective',
                language_code='language_code',
                tags=['tag'],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=False,
                owner_ids=['owner_id'],
                editor_ids=['editor_id'],
                viewer_ids=['viewer_id'],
                contributor_ids=[''],
                contributors_summary={},
                version=0,
                exploration_model_last_updated=None,
                exploration_model_created_on=None,
            ))
        uneditable_collection_summary_model.put()

        exploration_summary_models = (
            exp_models.ExpSummaryModel
            .get_at_least_editable('a'))
        self.assertEqual(1, len(exploration_summary_models))
        self.assertEqual('id0', exploration_summary_models[0].id)

        exploration_summary_models = (
            exp_models.ExpSummaryModel
            .get_at_least_editable('viewer_id'))
        self.assertEqual(0, len(exploration_summary_models))

        exploration_summary_models = (
            exp_models.ExpSummaryModel
            .get_at_least_editable('nonexistent_id'))
        self.assertEqual(0, len(exploration_summary_models))

    def test_verify_model_user_ids_exist(self):
        model = exp_models.ExpSummaryModel(
            id=self.EXPLORATION_ID_1,
            title='title',
            category='category',
            objective='objective',
            language_code='language_code',
            community_owned=False,
            owner_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            editor_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
            voice_artist_ids=[self.USER_ID_1_NEW, self.USER_ID_2_NEW],
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
        model.voice_artist_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.voice_artist_ids = [self.USER_ID_1_NEW, self.USER_ID_2_NEW]
        model.viewer_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.viewer_ids = [self.USER_ID_1_NEW, self.USER_ID_2_NEW]
        model.contributor_ids = [self.USER_ID_1_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())
