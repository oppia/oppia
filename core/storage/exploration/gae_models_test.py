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

from __future__ import annotations

import copy
import datetime
import types

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_domain
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import exp_models
    from mypy_imports import user_models

(base_models, exp_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.EXPLORATION, models.Names.USER
])


class ExplorationSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            exp_models.ExplorationSnapshotContentModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class ExplorationModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExplorationModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_exploration_count(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('id', exploration)

        self.assertEqual(
            exp_models.ExplorationModel.get_exploration_count(), 1)
        saved_exploration: exp_models.ExplorationModel = (
            exp_models.ExplorationModel.get_all().fetch(limit=1)[0])
        self.assertEqual(saved_exploration.title, 'A Title')
        self.assertEqual(saved_exploration.category, 'A Category')
        self.assertEqual(saved_exploration.objective, 'An Objective')

    def test_reconstitute(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(
            'id', title='A Title',
            category='A Category', objective='An Objective')
        exp_services.save_new_exploration('id', exploration)
        exp_model = exp_models.ExplorationModel.get_by_id('id')
        snapshot_dict = exp_model.compute_snapshot()
        snapshot_dict['skill_tags'] = ['tag1', 'tag2']
        snapshot_dict['default_skin'] = 'conversation_v1'
        snapshot_dict['skin_customizations'] = {}
        snapshot_dict = exp_models.ExplorationModel.convert_to_valid_dict(
            snapshot_dict)
        exp_model = exp_models.ExplorationModel(**snapshot_dict)
        snapshot_dict = exp_model.compute_snapshot()
        for field in ['skill_tags', 'default_skin', 'skin_customization']:
            self.assertNotIn(field, snapshot_dict)


class ExplorationContextModelUnitTests(test_utils.GenericTestBase):
    """Tests the ExplorationContextModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExplorationContextModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class ExplorationRightsSnapshotContentModelTests(test_utils.GenericTestBase):

    EXP_ID_1: Final = '1'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_COMMITTER: Final = 'id_committer'

    def test_get_deletion_policy_is_locally_pseudonymize(self) -> None:
        self.assertEqual(
            exp_models.ExplorationRightsSnapshotContentModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
        exp_models.ExplorationRightsModel(
            id=self.EXP_ID_1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            viewer_ids=[self.USER_ID_2],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.1
        ).save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_domain.CMD_CREATE_NEW}])

        self.assertTrue(
            exp_models.ExplorationRightsSnapshotContentModel
            .has_reference_to_user_id(self.USER_ID_1))
        self.assertTrue(
            exp_models.ExplorationRightsSnapshotContentModel
            .has_reference_to_user_id(self.USER_ID_2))
        self.assertFalse(
            exp_models.ExplorationRightsSnapshotContentModel
            .has_reference_to_user_id(self.USER_ID_COMMITTER))
        self.assertFalse(
            exp_models.ExplorationRightsSnapshotContentModel
            .has_reference_to_user_id('x_id'))


class ExplorationRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationRightsModel class."""

    EXPLORATION_ID_1: Final = '1'
    EXPLORATION_ID_2: Final = '2'
    EXPLORATION_ID_3: Final = '3'
    EXPLORATION_ID_4: Final = '4'
    # Related to all three explorations.
    USER_ID_1: Final = 'id_1'
    # Related to a subset of the three explorations.
    USER_ID_2: Final = 'id_2'
    # Related to no explorations.
    USER_ID_3: Final = 'id_3'
    # Related to one collection and then removed from it.
    USER_ID_4: Final = 'id_4'
    # User id used in commits.
    USER_ID_COMMITTER: Final = 'id_5'
    USER_ID_4_OLD: Final = 'id_4_old'
    USER_ID_4_NEW: Final = 'id_4_new'
    USER_ID_5_OLD: Final = 'id_5_old'
    USER_ID_5_NEW: Final = 'id_5_new'
    USER_ID_6_OLD: Final = 'id_6_old'
    USER_ID_6_NEW: Final = 'id_6_new'

    def setUp(self) -> None:
        super().setUp()
        user_models.UserSettingsModel(
            id=self.USER_ID_1,
            email='some@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_ID_2,
            email='some_other@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])

        self.exp_1_dict = (
            exp_models.ExplorationRightsModel.get_by_id(
                self.EXPLORATION_ID_1).to_dict())

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExplorationRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    def test_has_reference_to_user_id(self) -> None:
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
            self.assertFalse(
                exp_models.ExplorationRightsModel
                .has_reference_to_user_id(self.USER_ID_3))

    def test_save(self) -> None:
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
        saved_model = exp_models.ExplorationRightsModel.get('id_0')
        self.assertEqual(saved_model.id, 'id_0')
        self.assertEqual(saved_model.owner_ids, ['owner_id'])
        self.assertEqual(saved_model.voice_artist_ids, ['voice_artist_id'])
        self.assertEqual(saved_model.viewer_ids, ['viewer_id'])
        self.assertEqual(
            ['editor_id', 'owner_id', 'viewer_id', 'voice_artist_id'],
            exp_models.ExplorationRightsSnapshotMetadataModel
            .get_by_id('id_0-1').content_user_ids
        )

    def test_export_data_on_highly_involved_user(self) -> None:
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

    def test_export_data_on_partially_involved_user(self) -> None:
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

    def test_export_data_on_uninvolved_user(self) -> None:
        """Test for empty lists when user has no exploration involvement."""
        exploration_ids = (
            exp_models.ExplorationRightsModel.export_data(
                self.USER_ID_3))
        expected_exploration_ids: Dict[str, List[str]] = {
            'owned_exploration_ids': [],
            'editable_exploration_ids': [],
            'voiced_exploration_ids': [],
            'viewable_exploration_ids': []
        }
        self.assertEqual(expected_exploration_ids, exploration_ids)

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test for empty lists when user has no exploration involvement."""
        exploration_ids = (
            exp_models.ExplorationRightsModel.export_data(
                'fake_user'))
        expected_exploration_ids: Dict[str, List[str]] = {
            'owned_exploration_ids': [],
            'editable_exploration_ids': [],
            'voiced_exploration_ids': [],
            'viewable_exploration_ids': []
        }
        self.assertEqual(expected_exploration_ids, exploration_ids)

    def test_reconstitute_excludes_deprecated_properties(self) -> None:
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
        saved_model = exp_models.ExplorationRightsModel.get('id_0')

        snapshot_dict = saved_model.compute_snapshot()
        snapshot_dict['translator_ids'] = ['owner_id']
        snapshot_dict['all_viewer_ids'] = []

        snapshot_dict = exp_models.ExplorationRightsModel.convert_to_valid_dict(
            snapshot_dict)

        exp_rights_model = exp_models.ExplorationRightsModel(**snapshot_dict)

        for field in ['translator_ids', 'all_viewer_ids']:
            self.assertNotIn(field, exp_rights_model._properties) # pylint: disable=protected-access
            self.assertNotIn(field, exp_rights_model._values) # pylint: disable=protected-access


class ExplorationRightsModelRevertUnitTest(test_utils.GenericTestBase):
    """Test the revert method on ExplorationRightsModel class."""

    EXPLORATION_ID_1: Final = '1'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'
    # User id used in commits.
    USER_ID_COMMITTER: Final = 'id_4'

    def setUp(self) -> None:
        super().setUp()
        self.exploration_model = exp_models.ExplorationRightsModel(
            id=self.EXPLORATION_ID_1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[],
            voice_artist_ids=[self.USER_ID_2],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.4
        )
        self.exploration_model.save(
            self.USER_ID_COMMITTER, 'Created new exploration right',
            [{'cmd': rights_domain.CMD_CREATE_NEW}]
        )
        self.excluded_fields = ['created_on', 'last_updated', 'version']
        # Here copy.deepcopy is needed to mitigate
        # https://github.com/googlecloudplatform/datastore-ndb-python/issues/208
        self.original_dict = copy.deepcopy(
            self.exploration_model.to_dict(exclude=self.excluded_fields))
        self.exploration_model.owner_ids = [self.USER_ID_1, self.USER_ID_3]
        self.exploration_model.save(
            self.USER_ID_COMMITTER, 'Add owner',
            [{
                'cmd': rights_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_ID_3,
                'old_role': rights_domain.ROLE_NONE,
                'new_role': rights_domain.ROLE_OWNER
            }]
        )
        self.allow_revert_swap = self.swap(
            exp_models.ExplorationRightsModel, 'ALLOW_REVERT', True)

        exploration_rights_allowed_commands = copy.deepcopy(
            feconf.COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS)
        exploration_rights_allowed_commands.append({
            'name': feconf.CMD_REVERT_COMMIT,
            'required_attribute_names': [],
            'optional_attribute_names': [],
            'user_id_attribute_names': [],
            'allowed_values': {},
            'deprecated_values': {}
        })
        self.allowed_commands_swap = self.swap(
            feconf,
            'EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS',
            exploration_rights_allowed_commands
        )

    def test_revert_to_valid_version_is_successful(self) -> None:
        with self.allow_revert_swap, self.allowed_commands_swap:
            exp_models.ExplorationRightsModel.revert(
                self.exploration_model, self.USER_ID_COMMITTER, 'Revert', 1)
        new_collection_model = (
            exp_models.ExplorationRightsModel.get_by_id(
                self.EXPLORATION_ID_1))
        self.assertDictEqual(
            self.original_dict,
            new_collection_model.to_dict(exclude=self.excluded_fields)
        )

    def test_revert_to_version_with_all_viewer_ids_field_successful(
        self
    ) -> None:
        broken_dict = dict(**self.original_dict)
        broken_dict['all_viewer_ids'] = [
            self.USER_ID_1, self.USER_ID_2, self.USER_ID_3]

        snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel
            .get_by_id(
                exp_models.ExplorationRightsModel.get_snapshot_id(
                    self.EXPLORATION_ID_1, 1))
        )
        snapshot_model.content = broken_dict
        snapshot_model.update_timestamps()
        snapshot_model.put()

        with self.allow_revert_swap, self.allowed_commands_swap:
            exp_models.ExplorationRightsModel.revert(
                self.exploration_model, self.USER_ID_COMMITTER, 'Revert', 1)
        new_collection_model = (
            exp_models.ExplorationRightsModel.get_by_id(
                self.EXPLORATION_ID_1))
        self.assertDictEqual(
            self.original_dict,
            new_collection_model.to_dict(exclude=self.excluded_fields)
        )

    def test_revert_to_version_with_invalid_status_is_successful(self) -> None:
        broken_dict = dict(**self.original_dict)
        broken_dict['status'] = 'publicized'

        snapshot_model = (
            exp_models.ExplorationRightsSnapshotContentModel
            .get_by_id(
                exp_models.ExplorationRightsModel.get_snapshot_id(
                    self.EXPLORATION_ID_1, 1))
        )
        snapshot_model.content = broken_dict
        snapshot_model.update_timestamps()
        snapshot_model.put()

        with self.allow_revert_swap, self.allowed_commands_swap:
            exp_models.ExplorationRightsModel.revert(
                self.exploration_model, self.USER_ID_COMMITTER, 'Revert', 1)
        new_collection_model = (
            exp_models.ExplorationRightsModel.get_by_id(
                self.EXPLORATION_ID_1))
        self.assertDictEqual(
            self.original_dict,
            new_collection_model.to_dict(exclude=self.excluded_fields)
        )

    def test_revert_to_check_deprecated_fields_are_absent(self) -> None:
        with self.allow_revert_swap, self.allowed_commands_swap:
            exp_models.ExplorationRightsModel.revert(
                self.exploration_model, self.USER_ID_COMMITTER, 'Revert', 1)

            exp_rights_model = (
                exp_models.ExplorationRightsModel.get_by_id(
                    self.EXPLORATION_ID_1))

            snapshot_dict = exp_rights_model.compute_snapshot()

            self.assertNotIn('translator_ids', snapshot_dict)
            self.assertNotIn('all_viewer_ids', snapshot_dict)


class ExplorationCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationCommitLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExplorationCommitLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    def test_has_reference_to_user_id(self) -> None:
        commit = exp_models.ExplorationCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.exploration_id = 'b'
        commit.update_timestamps()
        commit.put()
        self.assertTrue(
            exp_models.ExplorationCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            exp_models.ExplorationCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test_get_all_non_private_commits(self) -> None:
        private_commit = (
            exp_models.ExplorationCommitLogEntryModel.create(
                'a', 1, 'committer_id', 'msg', 'create', [{}],
                constants.ACTIVITY_STATUS_PRIVATE, False))
        public_commit = (
            exp_models.ExplorationCommitLogEntryModel.create(
                'b', 1, 'committer_id', 'msg', 'create', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        private_commit.exploration_id = 'a'
        public_commit.exploration_id = 'b'
        private_commit.update_timestamps()
        private_commit.put()
        public_commit.update_timestamps()
        public_commit.put()
        results, _, more = (
            exp_models.ExplorationCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=None))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)

        with self.assertRaisesRegex(
            Exception, 'max_age must be a datetime.timedelta instance or None.'
        ):
            # TODO(#13528): Here we use MyPy ignore because we remove this test
            # after the backend is fully type-annotated. Here ignore[arg-type]
            # is used to test method get_all_non_private_commits() for invalid
            # input type.
            results, _, _ = (
                exp_models.ExplorationCommitLogEntryModel
                .get_all_non_private_commits(2, None, max_age=1)) # type: ignore[arg-type]

        max_age = datetime.timedelta(hours=1)
        results, _, more = (
            exp_models.ExplorationCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=max_age))
        self.assertFalse(more)
        self.assertEqual(len(results), 1)

    def test_get_multi(self) -> None:
        commit1 = exp_models.ExplorationCommitLogEntryModel.create(
            'a', 1, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PRIVATE, False)
        commit2 = exp_models.ExplorationCommitLogEntryModel.create(
            'a', 2, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit1.exploration_id = 'a'
        commit2.exploration_id = 'a'
        commit1.update_timestamps()
        commit1.put()
        commit2.update_timestamps()
        commit2.put()

        actual_models = (
            exp_models.ExplorationCommitLogEntryModel.get_multi(
                'a', [1, 2, 3]))

        # Ruling out the possibility of None for mypy type checking.
        assert actual_models[0] is not None
        assert actual_models[1] is not None
        self.assertEqual(len(actual_models), 3)
        self.assertEqual(actual_models[0].id, 'exploration-a-1')
        self.assertEqual(actual_models[1].id, 'exploration-a-2')
        self.assertIsNone(actual_models[2])


class ExpSummaryModelUnitTest(test_utils.GenericTestBase):
    """Tests for the ExpSummaryModel."""

    EXPLORATION_ID_1: Final = '1'
    EXPLORATION_ID_2: Final = '2'
    EXPLORATION_ID_3: Final = '3'
    USER_ID_1_OLD: Final = 'id_1_old'
    USER_ID_1_NEW: Final = 'id_1_new'
    USER_ID_2_OLD: Final = 'id_2_old'
    USER_ID_2_NEW: Final = 'id_2_new'
    USER_ID_3_OLD: Final = 'id_3_old'
    USER_ID_3_NEW: Final = 'id_3_new'

    def setUp(self) -> None:
        super().setUp()
        user_models.UserSettingsModel(
            id=self.USER_ID_1_NEW,
            email='some@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_ID_2_NEW,
            email='some_other@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExpSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    def test_has_reference_to_user_id(self) -> None:
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

    def test_get_non_private(self) -> None:
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
        public_exploration_summary_model.update_timestamps()
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
        private_exploration_summary_model.update_timestamps()
        private_exploration_summary_model.put()
        exploration_summary_models = (
            exp_models.ExpSummaryModel.get_non_private())
        self.assertEqual(
            exploration_summary_models,
            [public_exploration_summary_model])

    def test_get_top_rated(self) -> None:
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
        good_rating_exploration_summary_model.update_timestamps()
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
        bad_rating_exploration_summary_model.update_timestamps()
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
        good_rating_exploration_summary_model.update_timestamps()
        good_rating_exploration_summary_model.put()
        self.assertEqual(
            exp_models.ExpSummaryModel.get_top_rated(2),
            [bad_rating_exploration_summary_model])

    def test_get_private_at_least_viewable(self) -> None:
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
        viewable_exploration_summary_model.update_timestamps()
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
        unviewable_exploration_summary_model.update_timestamps()
        unviewable_exploration_summary_model.put()
        exploration_summary_models = (
            exp_models.ExpSummaryModel
            .get_private_at_least_viewable('a'))
        self.assertEqual(1, len(exploration_summary_models))
        self.assertEqual('id0', exploration_summary_models[0].id)

    def test_get_at_least_editable(self) -> None:
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
        editable_collection_summary_model.update_timestamps()
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
        uneditable_collection_summary_model.update_timestamps()
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


class ExplorationVersionHistoryModelUnitTest(test_utils.GenericTestBase):
    """Unit tests for ExplorationVersionHistoryModel."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.ExplorationVersionHistoryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE
        )

    def test_get_export_policy(self) -> None:
        export_policy_dict = base_models.BaseModel.get_export_policy()
        export_policy_dict.update({
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_version_history': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'metadata_last_edited_version_number': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'metadata_last_edited_committer_id': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'committer_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

        self.assertEqual(
            exp_models.ExplorationVersionHistoryModel.get_export_policy(),
            export_policy_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            exp_models.ExplorationVersionHistoryModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_instance_id(self) -> None:
        expected_instance_id = 'exp1.2'
        actual_instance_id = (
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                'exp1', 2))

        self.assertEqual(actual_instance_id, expected_instance_id)

    def test_has_reference_to_user_id(self) -> None:
        exp_models.ExplorationVersionHistoryModel(
            exploration_id='exp1',
            exploration_version=2,
            state_version_history={
                feconf.DEFAULT_INIT_STATE_NAME: {
                    'previously_edited_in_version': 1,
                    'state_name_in_previous_version': (
                        feconf.DEFAULT_INIT_STATE_NAME),
                    'committer_id': 'user_1'
                }
            },
            metadata_last_edited_version_number=1,
            metadata_last_edited_committer_id='user_1',
            committer_ids=['user_1']
        ).put()

        self.assertTrue(
            exp_models.ExplorationVersionHistoryModel
            .has_reference_to_user_id('user_1'))
        self.assertFalse(
            exp_models.ExplorationVersionHistoryModel
            .has_reference_to_user_id('user_2'))


class TransientCheckpointUrlModelUnitTest(test_utils.GenericTestBase):
    """Tests for the TransientCheckpointUrl model."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            exp_models.TransientCheckpointUrlModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            exp_models.TransientCheckpointUrlModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        expected_dict = {
            'exploration_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'furthest_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'furthest_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'most_recently_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'most_recently_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        fetched_dict = (
            exp_models.TransientCheckpointUrlModel.get_export_policy())
        self.assertEqual(
            expected_dict['exploration_id'],
            fetched_dict['exploration_id'])
        self.assertEqual(
            expected_dict['furthest_reached_checkpoint_exp_version'],
            fetched_dict['furthest_reached_checkpoint_exp_version'])
        self.assertEqual(
            expected_dict['furthest_reached_checkpoint_state_name'],
            fetched_dict['furthest_reached_checkpoint_state_name'])
        self.assertEqual(
            expected_dict['most_recently_reached_checkpoint_exp_version'],
            fetched_dict['most_recently_reached_checkpoint_exp_version'])
        self.assertEqual(
            expected_dict['most_recently_reached_checkpoint_state_name'],
            fetched_dict['most_recently_reached_checkpoint_state_name'])

    def test_create_new_object(self) -> None:
        exp_models.TransientCheckpointUrlModel.create(
            'exp_id', 'progress_id')
        transient_checkpoint_url_model = (
            exp_models.TransientCheckpointUrlModel.get(
                'progress_id', strict=True))

        # Ruling out the possibility of None for mypy type checking.
        assert transient_checkpoint_url_model is not None
        self.assertEqual(
            transient_checkpoint_url_model.exploration_id,
            'exp_id')
        self.assertIsNone(
            transient_checkpoint_url_model.
            most_recently_reached_checkpoint_exp_version)
        self.assertIsNone(
            transient_checkpoint_url_model.
            most_recently_reached_checkpoint_state_name)
        self.assertIsNone(
            transient_checkpoint_url_model.
            furthest_reached_checkpoint_exp_version)
        self.assertIsNone(
            transient_checkpoint_url_model.
            furthest_reached_checkpoint_state_name)

    def test_get_object(self) -> None:
        exp_models.TransientCheckpointUrlModel.create(
            'exp_id', 'progress_id')
        expected_model = exp_models.TransientCheckpointUrlModel(
            exploration_id='exp_id',
            most_recently_reached_checkpoint_exp_version=None,
            most_recently_reached_checkpoint_state_name=None,
            furthest_reached_checkpoint_exp_version=None,
            furthest_reached_checkpoint_state_name=None
        )

        actual_model = (
            exp_models.TransientCheckpointUrlModel.get(
                'progress_id', strict=True))

        self.assertEqual(
            actual_model.exploration_id,
            expected_model.exploration_id)
        self.assertEqual(
            actual_model.most_recently_reached_checkpoint_exp_version,
            expected_model.most_recently_reached_checkpoint_exp_version)
        self.assertEqual(
            actual_model.most_recently_reached_checkpoint_state_name,
            expected_model.most_recently_reached_checkpoint_state_name)
        self.assertEqual(
            actual_model.furthest_reached_checkpoint_exp_version,
            expected_model.furthest_reached_checkpoint_exp_version)
        self.assertEqual(
            actual_model.furthest_reached_checkpoint_state_name,
            expected_model.furthest_reached_checkpoint_state_name)

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests get_new_progress_id method for raising exception."""
        transient_checkpoint_progress_model_cls = (
            exp_models.TransientCheckpointUrlModel)

        # Test get_new_progress_id method.
        with self.assertRaisesRegex(
            Exception,
            'New id generator is producing too many collisions.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                transient_checkpoint_progress_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    transient_checkpoint_progress_model_cls
                )
            ):
                transient_checkpoint_progress_model_cls.get_new_progress_id()
