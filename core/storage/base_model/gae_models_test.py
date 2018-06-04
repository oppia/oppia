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

from core.platform import models
from core.tests import test_utils
import feconf

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class BaseModelUnitTests(test_utils.GenericTestBase):
    """Test the generic base model."""

    def tearDown(self):
        """Deletes all model entities."""
        for entity in base_models.BaseModel.get_all():
            entity.delete()

        super(BaseModelUnitTests, self).tearDown()

    def test_error_cases_for_get_method(self):
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            base_models.BaseModel.get('Invalid id')
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            base_models.BaseModel.get('Invalid id', strict=True)

        self.assertIsNone(
            base_models.BaseModel.get('Invalid id', strict=False))

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
        for _ in range(100):
            new_id = base_models.BaseModel.get_new_id('')
            self.assertNotIn(new_id, ids)

            base_models.BaseModel(id=new_id).put()
            ids.add(new_id)

    def test_get_new_id_method_does_not_fail_with_bad_names(self):
        base_models.BaseModel.get_new_id(None)
        base_models.BaseModel.get_new_id('¡Hola!')
        base_models.BaseModel.get_new_id(12345)
        base_models.BaseModel.get_new_id({'a': 'b'})


class TestSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    pass


class TestSnapshotContentModel(base_models.BaseSnapshotContentModel):
    pass


class TestVersionedModel(base_models.VersionedModel):
    """Model that inherits the VersionedModel for testing."""
    SNAPSHOT_METADATA_CLASS = TestSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TestSnapshotContentModel


class TestCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
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
            status=feconf.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model1.put()

        test_model = TestCommitLogEntryModel.get_commit('id', 1)
        self.assertEqual(test_model.version, 1)
        self.assertEqual(test_model.user_id, 'user')
        self.assertEqual(test_model.commit_type, 'create')
        self.assertEqual(
            test_model.post_commit_status, feconf.ACTIVITY_STATUS_PUBLIC)
        self.assertEqual(test_model.post_commit_community_owned, False)
        self.assertEqual(test_model.post_commit_is_private, False)

    def test_get_all_commits(self):
        model1 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            committer_username='username',
            commit_cmds={}, commit_type='create',
            commit_message='New commit created.', version=1,
            status=feconf.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model2 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            committer_username='username',
            commit_cmds={}, commit_type='edit',
            commit_message='New commit created.', version=2,
            status=feconf.ACTIVITY_STATUS_PUBLIC, community_owned=False
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
