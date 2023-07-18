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

from __future__ import annotations

import copy
import datetime

from core import feconf
from core.constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_domain
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import collection_models
    from mypy_imports import user_models

(base_models, collection_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.COLLECTION, models.Names.USER
])


class CollectionSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            collection_models.CollectionSnapshotContentModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class CollectionModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            collection_models.CollectionModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_collection_count(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            'id', title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection('id', collection)

        num_collections = (
            collection_models.CollectionModel.get_collection_count())
        self.assertEqual(num_collections, 1)

    def test_reconstitute(self) -> None:
        collection = collection_domain.Collection.create_default_collection(
            'id', title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection('id', collection)
        collection_model = collection_models.CollectionModel.get_by_id('id')
        snapshot_dict = collection_model.compute_snapshot()
        snapshot_dict['nodes'] = ['node0', 'node1']
        snapshot_dict = collection_model.convert_to_valid_dict(snapshot_dict)
        collection_model = collection_models.CollectionModel(**snapshot_dict)
        self.assertNotIn('nodes', collection_model._properties) # pylint: disable=protected-access
        self.assertNotIn('nodes', collection_model._values) # pylint: disable=protected-access


class CollectionRightsSnapshotContentModelTests(test_utils.GenericTestBase):

    COLLECTION_ID_1: Final = '1'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_COMMITTER: Final = 'id_committer'

    def test_get_deletion_policy_is_locally_pseudonymize(self) -> None:
        self.assertEqual(
            collection_models.CollectionRightsSnapshotContentModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])

        self.assertTrue(
            collection_models.CollectionRightsSnapshotContentModel
            .has_reference_to_user_id(self.USER_ID_1))
        self.assertTrue(
            collection_models.CollectionRightsSnapshotContentModel
            .has_reference_to_user_id(self.USER_ID_2))
        self.assertFalse(
            collection_models.CollectionRightsSnapshotContentModel
            .has_reference_to_user_id(self.USER_ID_COMMITTER))
        self.assertFalse(
            collection_models.CollectionRightsSnapshotContentModel
            .has_reference_to_user_id('x_id'))


class CollectionRightsModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionRightsModel class."""

    COLLECTION_ID_1: Final = '1'
    COLLECTION_ID_2: Final = '2'
    COLLECTION_ID_3: Final = '3'
    COLLECTION_ID_4: Final = '4'
    # Related to all three collections.
    USER_ID_1: Final = 'id_1'
    # Related to a subset of the three collections.
    USER_ID_2: Final = 'id_2'
    # Related to no collections.
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])
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
            [{'cmd': rights_domain.CMD_CREATE_NEW}])

        self.col_1_dict = (
            collection_models.CollectionRightsModel.get_by_id(
                self.COLLECTION_ID_1).to_dict())

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            collection_models.CollectionRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    def test_has_reference_to_user_id(self) -> None:
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
            self.assertFalse(
                collection_models.CollectionRightsModel
                .has_reference_to_user_id(self.USER_ID_3))

    def test_save(self) -> None:
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
            ).save(
                self.USER_ID_COMMITTER, 'Created new collection',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
        collection_model = collection_models.CollectionRightsModel.get('id')

        self.assertEqual('id', collection_model.id)
        self.assertEqual(
            ['editor_ids', 'owner_ids', 'viewer_ids', 'voice_artist_ids'],
            collection_models.CollectionRightsSnapshotMetadataModel
            .get_by_id('id-1').content_user_ids
        )

    def test_export_data_on_highly_involved_user(self) -> None:
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

    def test_export_data_on_partially_involved_user(self) -> None:
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

    def test_export_data_on_uninvolved_user(self) -> None:
        """Test for empty lists when user has no collection involvement."""
        collection_ids = (
            collection_models.CollectionRightsModel.export_data(
                self.USER_ID_3))
        expected_collection_ids: Dict[str, List[str]] = {
            'owned_collection_ids': [],
            'editable_collection_ids': [],
            'voiced_collection_ids': [],
            'viewable_collection_ids': []
        }
        self.assertEqual(expected_collection_ids, collection_ids)

    def test_export_data_on_invalid_user(self) -> None:
        """Test for empty lists when the user_id is invalid."""
        collection_ids = (
            collection_models.CollectionRightsModel.export_data(
                'fake_user'))
        expected_collection_ids: Dict[str, List[str]] = {
            'owned_collection_ids': [],
            'editable_collection_ids': [],
            'voiced_collection_ids': [],
            'viewable_collection_ids': []
        }
        self.assertEqual(expected_collection_ids, collection_ids)

    def test_reconstitute(self) -> None:
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
            ).save(
                self.USER_ID_COMMITTER, 'Created new collection',
                [{'cmd': rights_domain.CMD_CREATE_NEW}])
        collection_rights_model = (
            collection_models.CollectionRightsModel.get('id')
            )
        snapshot_dict = collection_rights_model.compute_snapshot()
        snapshot_dict['translator_ids'] = ['tid1', 'tid2']
        snapshot_dict = collection_rights_model.convert_to_valid_dict(
            snapshot_dict)
        collection_rights_model = collection_models.CollectionRightsModel(
            **snapshot_dict)
        self.assertNotIn(
            'translator_ids',
            collection_rights_model._properties) # pylint: disable=protected-access
        self.assertNotIn(
            'translator_ids',
            collection_rights_model._values) # pylint: disable=protected-access


class CollectionRightsModelRevertUnitTest(test_utils.GenericTestBase):
    """Test the revert method on CollectionRightsModel class."""

    COLLECTION_ID_1: Final = '1'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'
    # User id used in commits.
    USER_ID_COMMITTER: Final = 'id_4'

    def setUp(self) -> None:
        super().setUp()
        self.collection_model = collection_models.CollectionRightsModel(
            id=self.COLLECTION_ID_1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[],
            voice_artist_ids=[self.USER_ID_2],
            viewer_ids=[],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.4
        )
        self.collection_model.save(
            self.USER_ID_COMMITTER, 'Created new collection right',
            [{'cmd': rights_domain.CMD_CREATE_NEW}]
        )
        self.excluded_fields = ['created_on', 'last_updated', 'version']
        # Here copy.deepcopy is needed to mitigate
        # https://github.com/googlecloudplatform/datastore-ndb-python/issues/208
        self.original_dict = copy.deepcopy(
            self.collection_model.to_dict(exclude=self.excluded_fields))
        self.collection_model.owner_ids = [self.USER_ID_1, self.USER_ID_3]
        self.collection_model.save(
            self.USER_ID_COMMITTER, 'Add owner',
            [{
                'cmd': rights_domain.CMD_CHANGE_ROLE,
                'assignee_id': self.USER_ID_3,
                'old_role': rights_domain.ROLE_NONE,
                'new_role': rights_domain.ROLE_OWNER
            }]
        )
        self.allow_revert_swap = self.swap(
            collection_models.CollectionRightsModel, 'ALLOW_REVERT', True)

        collection_rights_allowed_commands = copy.deepcopy(
            feconf.COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS)
        collection_rights_allowed_commands.append({
            'name': feconf.CMD_REVERT_COMMIT,
            'required_attribute_names': [],
            'optional_attribute_names': [],
            'user_id_attribute_names': [],
            'allowed_values': {},
            'deprecated_values': {}
        })
        self.allowed_commands_swap = self.swap(
            feconf,
            'COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS',
            collection_rights_allowed_commands
        )

    def test_revert_to_valid_version_is_successful(self) -> None:
        with self.allow_revert_swap, self.allowed_commands_swap:
            collection_models.CollectionRightsModel.revert(
                self.collection_model, self.USER_ID_COMMITTER, 'Revert', 1)

        new_collection_model = (
            collection_models.CollectionRightsModel.get_by_id(
                self.COLLECTION_ID_1))
        self.assertDictEqual(
            self.original_dict,
            new_collection_model.to_dict(exclude=self.excluded_fields)
        )

    def test_revert_to_version_with_invalid_status_is_successful(self) -> None:
        broken_dict = {**self.original_dict}
        broken_dict['status'] = 'publicized'

        snapshot_model = (
            collection_models.CollectionRightsSnapshotContentModel
            .get_by_id(
                collection_models.CollectionRightsModel.get_snapshot_id(
                    self.COLLECTION_ID_1, 1))
        )
        snapshot_model.content = broken_dict
        snapshot_model.update_timestamps()
        snapshot_model.put()
        with self.allow_revert_swap, self.allowed_commands_swap:
            collection_models.CollectionRightsModel.revert(
                self.collection_model, self.USER_ID_COMMITTER, 'Revert', 1)

        new_collection_model = (
            collection_models.CollectionRightsModel.get_by_id(
                self.COLLECTION_ID_1))
        self.assertDictEqual(
            self.original_dict,
            new_collection_model.to_dict(exclude=self.excluded_fields)
        )

    def test_revert_to_version_with_translator_ids_field_is_successful(
        self
    ) -> None:
        broken_dict = {**self.original_dict}
        del broken_dict['voice_artist_ids']
        broken_dict['translator_ids'] = [self.USER_ID_2]

        snapshot_model = (
            collection_models.CollectionRightsSnapshotContentModel
            .get_by_id(
                collection_models.CollectionRightsModel.get_snapshot_id(
                    self.COLLECTION_ID_1, 1))
        )
        snapshot_model.content = broken_dict
        snapshot_model.update_timestamps()
        snapshot_model.put()
        with self.allow_revert_swap, self.allowed_commands_swap:
            collection_models.CollectionRightsModel.revert(
                self.collection_model, self.USER_ID_COMMITTER, 'Revert', 1)

        new_collection_model = (
            collection_models.CollectionRightsModel.get_by_id(
                self.COLLECTION_ID_1))
        self.assertDictEqual(
            self.original_dict,
            new_collection_model.to_dict(exclude=self.excluded_fields)
        )


class CollectionCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the CollectionCommitLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            collection_models.CollectionCommitLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    def test_has_reference_to_user_id(self) -> None:
        commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.collection_id = 'b'
        commit.update_timestamps()
        commit.put()
        self.assertTrue(
            collection_models.CollectionCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            collection_models.CollectionCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test_get_all_non_private_commits(self) -> None:
        private_commit = collection_models.CollectionCommitLogEntryModel.create(
            'a', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PRIVATE, False)
        public_commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        private_commit.collection_id = 'a'
        public_commit.collection_id = 'b'
        private_commit.update_timestamps()
        private_commit.put()
        public_commit.update_timestamps()
        public_commit.put()
        results, _, more = (
            collection_models.CollectionCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=None))
        self.assertEqual('collection-b-0', results[0].id)
        self.assertFalse(more)

    def test_get_all_non_private_commits_with_invalid_max_age(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'max_age must be a datetime.timedelta instance or None.'):
            # TODO(#13528): Here we use MyPy ignore because we remove this test
            # after the backend is fully type-annotated. Here ignore[arg-type]
            # is used to test method get_all_non_private_commits() for invalid
            # input type.
            (
                collection_models.CollectionCommitLogEntryModel
                .get_all_non_private_commits(
                    2, None, max_age='invalid_max_age')) # type: ignore[arg-type]

    def test_get_all_non_private_commits_with_max_age(self) -> None:
        private_commit = collection_models.CollectionCommitLogEntryModel.create(
            'a', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PRIVATE, False)
        public_commit = collection_models.CollectionCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        # We need to manually set collection_id as it is a property of
        # CollectionCommitLogEntryModel only and create() does not accept
        # collection_id as a parameter. This property is set in
        # CollectionModel._trusted_commit().
        private_commit.collection_id = 'a'
        public_commit.collection_id = 'b'
        private_commit.update_timestamps()
        private_commit.put()
        public_commit.update_timestamps()
        public_commit.put()

        max_age = datetime.timedelta(hours=1)
        results, _, more = (
            collection_models.CollectionCommitLogEntryModel
            .get_all_non_private_commits(2, None, max_age=max_age))
        self.assertEqual(len(results), 1)
        self.assertEqual('collection-b-0', results[0].id)
        self.assertFalse(more)


class CollectionSummaryModelUnitTest(test_utils.GenericTestBase):
    """Tests for the CollectionSummaryModel."""

    COLLECTION_ID_1: Final = '1'
    COLLECTION_ID_2: Final = '2'
    COLLECTION_ID_3: Final = '3'
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
            collection_models.CollectionSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    def test_has_reference_to_user_id(self) -> None:
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

    def test_get_non_private(self) -> None:
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
        public_collection_summary_model.update_timestamps()
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
        private_collection_summary_model.update_timestamps()
        private_collection_summary_model.put()
        collection_summary_models = (
            collection_models.CollectionSummaryModel.get_non_private())
        self.assertEqual(1, len(collection_summary_models))

    def test_get_private_at_least_viewable(self) -> None:
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
        viewable_collection_summary_model.update_timestamps()
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
        unviewable_collection_summary_model.update_timestamps()
        unviewable_collection_summary_model.put()
        collection_summary_models = (
            collection_models.CollectionSummaryModel
            .get_private_at_least_viewable('a'))
        self.assertEqual(1, len(collection_summary_models))
        self.assertEqual('id0', collection_summary_models[0].id)

    def test_get_at_least_editable(self) -> None:
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
        editable_collection_summary_model.update_timestamps()
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
        uneditable_collection_summary_model.update_timestamps()
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
