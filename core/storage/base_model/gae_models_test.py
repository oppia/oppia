# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.base_model.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import types

from constants import constants
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class BaseModelUnitTests(test_utils.GenericTestBase):
    """Test the generic base model."""

    def tearDown(self):
        """Deletes all model entities."""
        for entity in base_models.BaseModel.get_all():
            entity.delete()

        super(BaseModelUnitTests, self).tearDown()

    def test_get_deletion_policy(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.get_deletion_policy()

    def test_has_reference_to_user_id(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.has_reference_to_user_id('user_id')

    def test_get_user_id_migration_policy(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.get_user_id_migration_policy()

    def test_get_user_id_migration_field(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.get_user_id_migration_field()

    def test_error_cases_for_get_method(self):
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            base_models.BaseModel.get('Invalid id')
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            base_models.BaseModel.get('Invalid id', strict=True)

        self.assertIsNone(
            base_models.BaseModel.get('Invalid id', strict=False))

    def test_base_model_export_data_raises_not_implemented_error(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.export_data('user_id')

    def test_export_data(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.export_data('user_id')

    def test_get_export_policy(self):
        with self.assertRaises(NotImplementedError):
            base_models.BaseModel.get_export_policy()

    def test_generic_query_put_get_and_delete_operations(self):
        model = base_models.BaseModel()

        all_models = [m for m in base_models.BaseModel.get_all()]
        self.assertEqual(len(all_models), 0)

        model.put()
        all_models = [m for m in base_models.BaseModel.get_all()]
        self.assertEqual(len(all_models), 1)
        self.assertEqual(all_models[0], model)

        model_id = all_models[0].id
        self.assertEqual(model, base_models.BaseModel.get(model_id))

        model.delete()
        all_models = [m for m in base_models.BaseModel.get_all()]
        self.assertEqual(len(all_models), 0)
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            model.get(model_id)

    def test_get_multi(self):
        model1 = base_models.BaseModel()
        model2 = base_models.BaseModel()
        model3 = base_models.BaseModel()
        model2.deleted = True

        model1.put()
        model2.put()
        model3.put()

        model1_id = model1.id
        model2_id = model2.id
        model3_id = model3.id

        # For all the None ids, get_multi should return None at the appropriate
        # position.
        result = base_models.BaseModel.get_multi(
            [model1_id, model2_id, None, model3_id, 'none', None])

        self.assertEqual(result, [model1, None, None, model3, None, None])

    def test_delete_multi(self):
        model1 = base_models.BaseModel()
        model2 = base_models.BaseModel()
        model3 = base_models.BaseModel()
        model2.deleted = True

        model1.put()
        model2.put()
        model3.put()

        model1_id = model1.id
        model2_id = model2.id
        model3_id = model3.id

        base_models.BaseModel.delete_multi([model1, model2, model3])

        result = base_models.BaseModel.get_multi([
            model1_id, model2_id, model3_id])

        self.assertEqual(result, [None, None, None])

    def test_get_new_id_method_returns_unique_ids(self):
        ids = set([])
        for _ in python_utils.RANGE(100):
            new_id = base_models.BaseModel.get_new_id('')
            self.assertNotIn(new_id, ids)

            base_models.BaseModel(id=new_id).put()
            ids.add(new_id)

    def test_get_new_id_method_does_not_fail_with_bad_names(self):
        base_models.BaseModel.get_new_id(None)
        base_models.BaseModel.get_new_id('¡Hola!')
        base_models.BaseModel.get_new_id(u'¡Hola!')
        base_models.BaseModel.get_new_id(12345)
        base_models.BaseModel.get_new_id({'a': 'b'})


class TestSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Model that inherits the BaseSnapshotMetadataModel for testing."""
    pass


class TestSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Model that inherits the BaseSnapshotContentModel for testing."""
    pass


class TestVersionedModel(base_models.VersionedModel):
    """Model that inherits the VersionedModel for testing."""
    SNAPSHOT_METADATA_CLASS = TestSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TestSnapshotContentModel


class BaseCommitLogEntryModelTests(test_utils.GenericTestBase):

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            base_models.BaseCommitLogEntryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_get_user_id_migration_field(self):
        # We need to compare the field types not the field values, thus using
        # python_utils.UNICODE.
        self.assertEqual(
            python_utils.UNICODE(
                base_models.BaseCommitLogEntryModel
                .get_user_id_migration_field()),
            python_utils.UNICODE(base_models.BaseCommitLogEntryModel.user_id))

    def test_base_class_get_instance_id_raises_not_implemented_error(self):
        # Raise NotImplementedError as _get_instance_id is to be overwritten
        # in child classes of BaseCommitLogEntryModel.
        with self.assertRaises(NotImplementedError):
            base_models.BaseCommitLogEntryModel.get_commit('id', 1)


class BaseSnapshotMetadataModelTests(test_utils.GenericTestBase):

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            base_models.BaseSnapshotMetadataModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_get_user_id_migration_field(self):
        # We need to compare the field types not the field values, thus using
        # python_utils.UNICODE.
        self.assertEqual(
            python_utils.UNICODE(
                base_models.BaseSnapshotMetadataModel
                .get_user_id_migration_field()),
            python_utils.UNICODE(
                base_models.BaseSnapshotMetadataModel.committer_id))

    def test_exists_for_user_id(self):
        model1 = base_models.BaseSnapshotMetadataModel(
            id='model_id-1', committer_id='committer_id', commit_type='create')
        model1.put()
        self.assertTrue(
            base_models.BaseSnapshotMetadataModel
            .exists_for_user_id('committer_id'))
        self.assertFalse(
            base_models.BaseSnapshotMetadataModel
            .exists_for_user_id('x_id'))

    def test_get_version_string(self):
        model1 = base_models.BaseSnapshotMetadataModel(
            id='model_id-1', committer_id='committer_id', commit_type='create')
        model1.put()
        self.assertEqual(model1.get_version_string(), '1')

    def test_get_unversioned_instance_id(self):
        model1 = base_models.BaseSnapshotMetadataModel(
            id='model_id-1', committer_id='committer_id', commit_type='create')
        model1.put()
        self.assertEqual(model1.get_unversioned_instance_id(), 'model_id')


class BaseSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_version_string(self):
        model1 = base_models.BaseSnapshotContentModel(id='model_id-1')
        model1.put()
        self.assertEqual(model1.get_version_string(), '1')

    def test_get_unversioned_instance_id(self):
        model1 = base_models.BaseSnapshotContentModel(id='model_id-1')
        model1.put()
        self.assertEqual(model1.get_unversioned_instance_id(), 'model_id')


class TestCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Model that inherits the BaseCommitLogEntryModel for testing."""
    @classmethod
    def _get_instance_id(cls, target_entity_id, version):
        """A function that returns the id of the log in BaseCommitLogEntryModel.

        Args:
            target_entity_id: str. The id of the mock entity used.
            version: int. The version of the model after the commit.

        Returns:
            str. The commit id with the target entity id and version number.
        """
        return 'entity-%s-%s' % (target_entity_id, version)


class CommitLogEntryModelTests(test_utils.GenericTestBase):
    """Test methods for CommitLogEntryModel."""

    def test_get_commit(self):
        model1 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            committer_username='username',
            commit_cmds={}, commit_type='create',
            commit_message='New commit created.', version=1,
            status=constants.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model1.put()

        test_model = TestCommitLogEntryModel.get_commit('id', 1)
        self.assertEqual(test_model.version, 1)
        self.assertEqual(test_model.user_id, 'user')
        self.assertEqual(test_model.commit_type, 'create')
        self.assertEqual(
            test_model.post_commit_status, constants.ACTIVITY_STATUS_PUBLIC)
        self.assertEqual(test_model.post_commit_community_owned, False)
        self.assertEqual(test_model.post_commit_is_private, False)

    def test_get_all_commits(self):
        model1 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            committer_username='username',
            commit_cmds={}, commit_type='create',
            commit_message='New commit created.', version=1,
            status=constants.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model2 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            committer_username='username',
            commit_cmds={}, commit_type='edit',
            commit_message='New commit created.', version=2,
            status=constants.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model1.put()
        model2.put()

        test_models = TestCommitLogEntryModel.get_all_commits(2, None)
        self.assertEqual(test_models[0][0].version, 2)
        self.assertEqual(test_models[0][1].version, 1)
        self.assertEqual(test_models[0][0].commit_type, 'edit')
        self.assertEqual(test_models[0][1].commit_type, 'create')


class VersionedModelTests(test_utils.GenericTestBase):
    """Test methods for VersionedModel."""

    def test_retrieval_of_multiple_version_models_for_fake_id(self):
        with self.assertRaisesRegexp(
            ValueError, 'The given entity_id fake_id is invalid'):
            TestVersionedModel.get_multi_versions(
                'fake_id', [1, 2, 3])

    def test_commit_with_model_instance_deleted_raises_error(self):
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')

        with self.assertRaisesRegexp(
            Exception, 'This model instance has been deleted.'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

    def test_trusted_commit_with_no_snapshot_metadata_raises_error(self):
        model1 = TestVersionedModel(id='model_id1')
        model1.SNAPSHOT_METADATA_CLASS = None
        with self.assertRaisesRegexp(
            Exception, 'No snapshot metadata class defined.'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        model1 = TestVersionedModel(id='model_id1')
        model1.SNAPSHOT_CONTENT_CLASS = None
        with self.assertRaisesRegexp(
            Exception, 'No snapshot content class defined.'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        model1 = TestVersionedModel(id='model_id1')
        with self.assertRaisesRegexp(
            Exception, 'Expected commit_cmds to be a list of dicts, received'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', {})

        model1 = TestVersionedModel(id='model_id1')
        with self.assertRaisesRegexp(
            Exception, 'Expected commit_cmds to be a list of dicts, received'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [[]])

    def test_put_raises_not_implemented_error_for_versioned_models(self):
        model1 = TestVersionedModel(id='model_id1')

        with self.assertRaises(NotImplementedError):
            model1.put()

    def test_commit_with_invalid_change_list_raises_error(self):
        model1 = TestVersionedModel(id='model_id1')

        # Test for invalid commit command.
        with self.assertRaisesRegexp(
            Exception, 'Invalid commit_cmd:'):
            model1.commit(
                feconf.SYSTEM_COMMITTER_ID, '', [{'invalid_cmd': 'value'}])

        # Test for invalid change list command.
        with self.assertRaisesRegexp(
            Exception, 'Invalid change list command:'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [{'cmd': 'AUTO'}])

    def test_revert_raises_error_when_not_allowed(self):
        model1 = TestVersionedModel(id='model_id1')
        with self.assertRaisesRegexp(
            Exception,
            'Reverting objects of type TestVersionedModel is not allowed.'):
            model1.revert(model1, feconf.SYSTEM_COMMITTER_ID, '', 1)

    def test_get_snapshots_metadata_with_invalid_model_raises_error(self):

        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        with self.assertRaisesRegexp(
            Exception,
            'Invalid version number 10 for model TestVersionedModel with id '
            'model_id1'):
            model1.get_snapshots_metadata('model_id1', [10])

    def test_get_multi_versions(self):
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        models_by_version = TestVersionedModel.get_multi_versions(
            'model_id1', [1, 2])
        self.assertEqual(len(models_by_version), 2)
        self.assertEqual(models_by_version[0].version, 1)
        self.assertEqual(models_by_version[1].version, 2)

    def test_get_multi_versions_errors(self):
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        with self.assertRaisesRegexp(
            ValueError,
            'Requested version number 3 cannot be higher than the current '
            'version number 2.'):
            TestVersionedModel.get_multi_versions('model_id1', [1, 2, 3])

        with self.assertRaisesRegexp(
            ValueError,
            'At least one version number is invalid'):
            TestVersionedModel.get_multi_versions('model_id1', [1, 1.5, 2])


class TestBaseModel(base_models.BaseModel):
    """Model that inherits BaseModel for testing. This is required as BaseModel
    gets subclassed a lot in other tests and that can create unexpected errors.
    """
    pass


class BaseModelTests(test_utils.GenericTestBase):

    def test_create_raises_error_when_many_id_collisions_occur(self):

        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            TestBaseModel, 'get_by_id', types.MethodType(
                lambda _, __: True, TestBaseModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            TestBaseModel.get_new_id('exploration')
