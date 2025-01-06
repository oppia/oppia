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

from __future__ import annotations

import datetime
import re
import types

from core import feconf
from core.constants import constants
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Set, Union, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class BaseModelUnitTests(test_utils.GenericTestBase):
    """Test the generic base model."""

    def tearDown(self) -> None:
        """Deletes all model entities."""
        for entity in base_models.BaseModel.get_all():
            entity.delete()

        super().tearDown()

    def test_get_deletion_policy(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The get_deletion_policy() method is missing from the '
                'derived class. It should be implemented in the '
                'derived class.')):
            base_models.BaseModel.get_deletion_policy()

    def test_apply_deletion_policy(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The apply_deletion_policy() method is missing from the '
                'derived class. It should be implemented in the '
                'derived class.')):
            base_models.BaseModel.apply_deletion_policy('test_user_id')

    def test_has_reference_to_user_id(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The has_reference_to_user_id() method is missing from the '
                'derived class. It should be implemented in the '
                'derived class.')):
            base_models.BaseModel.has_reference_to_user_id('user_id')

    def test_error_cases_for_get_method(self) -> None:
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            'Entity for class BaseModel with id Invalid id not found'):
            base_models.BaseModel.get('Invalid id')
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            'Entity for class BaseModel with id Invalid id not found'):
            base_models.BaseModel.get('Invalid id', strict=True)

        self.assertIsNone(
            base_models.BaseModel.get('Invalid id', strict=False))

    def test_base_model_export_data_raises_not_implemented_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The export_data() method is missing from the '
                'derived class. It should be implemented in the '
                'derived class.')):
            base_models.BaseModel.export_data('')

    def test_get_model_association_to_user_raises_not_implemented_error(
            self
    ) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The get_model_association_to_user() method is missing from '
                'the derived class. It should be implemented in the '
                'derived class.')):
            base_models.BaseModel.get_model_association_to_user()

    def test_export_data(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The export_data() method is missing from the derived '
                'class. It should be implemented in the derived class.')):
            base_models.BaseModel.export_data('user_id')

    def test_generic_query_put_get_and_delete_operations(self) -> None:
        model = base_models.BaseModel()

        all_models = base_models.BaseModel.get_all()
        self.assertEqual(all_models.count(), 0)

        model.update_timestamps()
        model.put()
        all_models = base_models.BaseModel.get_all()
        self.assertEqual(all_models.count(), 1)
        base_model = all_models.get()

        # Ruling out the possibility of None for mypy type checking.
        assert base_model is not None
        self.assertEqual(base_model, model)

        model_id = base_model.id
        self.assertEqual(model, base_models.BaseModel.get(model_id))

        model.delete()
        all_models = base_models.BaseModel.get_all()
        self.assertEqual(all_models.count(), 0)
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            f'Entity for class BaseModel with id {model_id} not found'
        ):
            model.get(model_id)

    def test_put(self) -> None:
        model = base_models.BaseModel()
        self.assertIsNone(model.created_on)
        self.assertIsNone(model.last_updated)

        # Field last_updated will get updated anyway because it is None.
        model.update_timestamps(update_last_updated_time=False)
        model.put()
        model_id = model.id
        self.assertIsNotNone(
            base_models.BaseModel.get_by_id(model_id).created_on)
        self.assertIsNotNone(
            base_models.BaseModel.get_by_id(model_id).last_updated)
        last_updated = model.last_updated

        # Field last_updated won't get updated because update_last_updated_time
        # is set to False and last_updated already has some value.
        model.update_timestamps(update_last_updated_time=False)
        model.put()
        self.assertEqual(
            base_models.BaseModel.get_by_id(model_id).last_updated,
            last_updated)

        # Field last_updated will get updated because update_last_updated_time
        # is set to True (by default).
        model.update_timestamps()
        model.put()
        self.assertNotEqual(
            base_models.BaseModel.get_by_id(model_id).last_updated,
            last_updated)

    def test_put_without_update_timestamps(self) -> None:
        model = base_models.BaseModel()
        self.assertIsNone(model.created_on)
        self.assertIsNone(model.last_updated)

        # First `put` does not raise an Exception because it sets last_updated
        # automatically since it is None.
        model.put()

        # Immediately calling `put` again fails, because update_timestamps needs
        # to be called first.
        with self.assertRaisesRegex(
            Exception, re.escape('did not call update_timestamps()')
        ):
            model.put()

        model = base_models.BaseModel.get_by_id(model.id)

        # Getting a fresh model requires update_timestamps too.
        with self.assertRaisesRegex(
            Exception, re.escape('did not call update_timestamps()')
        ):
            model.put()

        model.update_timestamps()
        # OK, update_timestamps called before put.
        model.put()

    def test_put_multi(self) -> None:
        models_1 = [base_models.BaseModel() for _ in range(3)]
        for model in models_1:
            self.assertIsNone(model.created_on)
            self.assertIsNone(model.last_updated)

        # Field last_updated will get updated anyway because it is None.
        base_models.BaseModel.update_timestamps_multi(
            models_1, update_last_updated_time=False)
        base_models.BaseModel.put_multi(models_1)
        model_ids = [model.id for model in models_1]
        last_updated_values = []
        for model_id in model_ids:
            model = base_models.BaseModel.get_by_id(model_id)
            self.assertIsNotNone(model.created_on)
            self.assertIsNotNone(model.last_updated)
            last_updated_values.append(model.last_updated)

        # Field last_updated won't get updated because update_last_updated_time
        # is set to False and last_updated already has some value.
        # Here we use cast because we are narrowing down the type from
        # List[Optional[BaseModel]] to List[BaseModel].
        models_2_without_none = cast(
            List[base_models.BaseModel],
            base_models.BaseModel.get_multi(model_ids)
        )
        base_models.BaseModel.update_timestamps_multi(
            models_2_without_none, update_last_updated_time=False)
        base_models.BaseModel.put_multi(models_2_without_none)
        for model_id, last_updated in zip(model_ids, last_updated_values):
            model = base_models.BaseModel.get_by_id(model_id)
            self.assertEqual(model.last_updated, last_updated)

        # Field last_updated will get updated because update_last_updated_time
        # is set to True (by default).
        # Here we use cast because we are narrowing down the type from
        # List[Optional[BaseModel]] to List[BaseModel].
        models_3_without_none = cast(
            List[base_models.BaseModel],
            base_models.BaseModel.get_multi(model_ids)
        )
        base_models.BaseModel.update_timestamps_multi(models_3_without_none)
        base_models.BaseModel.put_multi(models_3_without_none)
        for model_id, last_updated in zip(model_ids, last_updated_values):
            model = base_models.BaseModel.get_by_id(model_id)
            self.assertNotEqual(model.last_updated, last_updated)

    def test_get_multi(self) -> None:
        model1 = base_models.BaseModel()
        model2 = base_models.BaseModel()
        model3 = base_models.BaseModel()
        model2.deleted = True

        model1.update_timestamps()
        model1.put()
        model2.update_timestamps()
        model2.put()
        model3.update_timestamps()
        model3.put()

        model1_id = model1.id
        model2_id = model2.id
        model3_id = model3.id

        # For all the None ids, get_multi should return None at the appropriate
        # position.
        result = base_models.BaseModel.get_multi(
            [model1_id, model2_id, None, model3_id, 'none', None])

        self.assertEqual(result, [model1, None, None, model3, None, None])

    def test_delete_multi(self) -> None:
        model1 = base_models.BaseModel()
        model2 = base_models.BaseModel()
        model3 = base_models.BaseModel()
        model2.deleted = True

        model1.update_timestamps()
        model1.put()
        model2.update_timestamps()
        model2.put()
        model3.update_timestamps()
        model3.put()

        model1_id = model1.id
        model2_id = model2.id
        model3_id = model3.id

        base_models.BaseModel.delete_multi([model1, model2, model3])

        result = base_models.BaseModel.get_multi([
            model1_id, model2_id, model3_id])

        self.assertEqual(result, [None, None, None])

    def test_get_new_id_method_returns_unique_ids(self) -> None:
        ids: Set[str] = set([])
        for _ in range(100):
            new_id = base_models.BaseModel.get_new_id('')
            self.assertNotIn(new_id, ids)

            base_models.BaseModel(id=new_id).put()
            ids.add(new_id)


class TestBaseHumanMaintainedModel(base_models.BaseHumanMaintainedModel):
    """Model that inherits the BaseHumanMaintainedModel for testing."""

    pass


class BaseHumanMaintainedModelTests(test_utils.GenericTestBase):
    """Test the generic base human maintained model."""

    MODEL_ID = 'model1'

    def setUp(self) -> None:
        super().setUp()
        self.model_instance = TestBaseHumanMaintainedModel(id=self.MODEL_ID)
        def mock_put(self: base_models.BaseHumanMaintainedModel) -> None:
            """Function to modify and save the entities used for testing
            to the datastore.
            """
            self._last_updated_timestamp_is_fresh = True
            self.last_updated_by_human = datetime.datetime.utcnow()

            # These if conditions can be removed once the auto_now property
            # is set True to these attributes.
            if self.created_on is None:
                self.created_on = datetime.datetime.utcnow()

            if self.last_updated is None:
                self.last_updated = datetime.datetime.utcnow()

            # We are using BaseModel.put() to save the changes to the datastore
            # since the put() method which TestBaseHumanMaintainedModel class
            # inherits from BaseHumanMaintainedModel raises NotImplementedError,
            # and we do actually want to save the changes in this case.
            base_models.BaseModel.put(self)

        with self.swap(TestBaseHumanMaintainedModel, 'put', mock_put):
            self.model_instance.put()

    def test_put(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError, 'Use put_for_human or put_for_bot instead'):
            self.model_instance.put()

    def test_put_for_human(self) -> None:
        previous_last_updated_by_human = (
            self.model_instance.last_updated_by_human)
        self.model_instance.update_timestamps()
        self.model_instance.put_for_human()

        self.assertNotEqual(
            previous_last_updated_by_human,
            self.model_instance.last_updated_by_human)

    def test_put_for_bot(self) -> None:
        previous_last_updated_by_human = (
            self.model_instance.last_updated_by_human)
        self.model_instance.update_timestamps()
        self.model_instance.put_for_bot()

        self.assertEqual(
            previous_last_updated_by_human,
            self.model_instance.last_updated_by_human)

    def test_put_multi(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Use put_multi_for_human or put_multi_for_bot instead'):
            TestBaseHumanMaintainedModel.put_multi([])

    def test_put_multi_for_human(self) -> None:
        previous_last_updated_by_human = (
            self.model_instance.last_updated_by_human)

        self.model_instance.update_timestamps()
        TestBaseHumanMaintainedModel.put_multi_for_human(
            [self.model_instance])

        self.assertNotEqual(
            previous_last_updated_by_human,
            self.model_instance.last_updated_by_human)

    def test_put_multi_for_bot(self) -> None:
        previous_last_updated_by_human = (
            self.model_instance.last_updated_by_human)

        self.model_instance.update_timestamps()
        TestBaseHumanMaintainedModel.put_multi_for_bot(
            [self.model_instance])

        self.assertEqual(
            previous_last_updated_by_human,
            self.model_instance.last_updated_by_human)


class TestSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Model that inherits the BaseSnapshotMetadataModel for testing."""

    pass


class TestSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Model that inherits the BaseSnapshotContentModel for testing."""

    pass


class TestCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Model that inherits the BaseCommitLogEntryModel for testing."""

    @classmethod
    def get_instance_id(
            cls,
            target_entity_id: str,
            version: Union[int, str]
    ) -> str:
        """A function that returns the id of the log in BaseCommitLogEntryModel.

        Args:
            target_entity_id: str. The id of the mock entity used.
            version: int. The version of the model after the commit.

        Returns:
            str. The commit id with the target entity id and version number.
        """
        return 'entity-%s-%s' % (target_entity_id, version)


class TestVersionedModel(base_models.VersionedModel):
    """Model that inherits the VersionedModel for testing."""

    SNAPSHOT_METADATA_CLASS = TestSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TestSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = TestCommitLogEntryModel


class BaseCommitLogEntryModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_locally_pseudonymize(self) -> None:
        self.assertEqual(
            base_models.BaseCommitLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_get_model_association_to_user_is_not_corresponding_to_user(
            self
    ) -> None:
        self.assertEqual(
            base_models.BaseCommitLogEntryModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_base_class_get_instance_id_raises_not_implemented_error(
            self
    ) -> None:
        # Raise NotImplementedError as _get_instance_id is to be overwritten
        # in child classes of BaseCommitLogEntryModel.
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The get_instance_id() method is missing from the derived '
                'class. It should be implemented in the derived class.')):
            base_models.BaseCommitLogEntryModel.get_commit('id', 1)


class BaseSnapshotMetadataModelTests(test_utils.GenericTestBase):

    def test_has_reference_to_user_id(self) -> None:
        model1 = base_models.BaseSnapshotMetadataModel(
            id='model_id-1',
            committer_id='committer_id',
            commit_type='create',
            commit_cmds_user_ids=[
                'commit_cmds_user_1_id', 'commit_cmds_user_2_id'],
            content_user_ids=['content_user_1_id', 'content_user_2_id'])
        model1.update_timestamps()
        model1.put()
        self.assertTrue(
            base_models.BaseSnapshotMetadataModel
            .has_reference_to_user_id('committer_id'))
        self.assertTrue(
            base_models.BaseSnapshotMetadataModel
            .has_reference_to_user_id('commit_cmds_user_1_id'))
        self.assertTrue(
            base_models.BaseSnapshotMetadataModel
            .has_reference_to_user_id('commit_cmds_user_2_id'))
        self.assertTrue(
            base_models.BaseSnapshotMetadataModel
            .has_reference_to_user_id('content_user_1_id'))
        self.assertTrue(
            base_models.BaseSnapshotMetadataModel
            .has_reference_to_user_id('content_user_2_id'))
        self.assertFalse(
            base_models.BaseSnapshotMetadataModel
            .has_reference_to_user_id('x_id'))

    def test_get_version_string(self) -> None:
        model1 = base_models.BaseSnapshotMetadataModel(
            id='model_id-1', committer_id='committer_id', commit_type='create')
        model1.update_timestamps()
        model1.put()
        self.assertEqual(model1.get_version_string(), '1')

    def test_get_unversioned_instance_id(self) -> None:
        model1 = base_models.BaseSnapshotMetadataModel(
            id='model_id-1', committer_id='committer_id', commit_type='create')
        model1.update_timestamps()
        model1.put()
        self.assertEqual(model1.get_unversioned_instance_id(), 'model_id')

    def test_export_data_trivial(self) -> None:
        user_data = (
            base_models.BaseSnapshotMetadataModel.export_data('trivial_user'))
        expected_data: Dict[str, str] = {}
        self.assertEqual(user_data, expected_data)

    def test_export_data_nontrivial(self) -> None:
        version_model = TestVersionedModel(id='version_model')
        model1 = version_model.SNAPSHOT_METADATA_CLASS.create(
            'model_id-1', 'committer_id', 'create', None, [])
        model1.update_timestamps()
        model1.put()
        model2 = version_model.SNAPSHOT_METADATA_CLASS.create(
            'model_id-2', 'committer_id', 'create', 'Hi this is a commit.',
            [{'cmd': 'some_command'}, {'cmd2': 'another_command'}])
        model2.update_timestamps()
        model2.put()
        user_data = (
            version_model.SNAPSHOT_METADATA_CLASS.export_data('committer_id'))
        expected_data = {
            'model_id-1': {
                'commit_type': 'create',
                'commit_message': None,
            },
            'model_id-2': {
                'commit_type': 'create',
                'commit_message': 'Hi this is a commit.',
            }
        }
        self.assertEqual(user_data, expected_data)

    def test_export_when_commit_message_contains_user_id(self) -> None:
        version_model = TestVersionedModel(id='version_model')
        model1 = version_model.SNAPSHOT_METADATA_CLASS.create(
            'model_id-1', 'committer_id', 'create',
            'Test uid_abcdefghijabcdefghijabcdefghijab', [])
        model1.update_timestamps()
        model1.put()
        model2 = version_model.SNAPSHOT_METADATA_CLASS.create(
            'model_id-2', 'committer_id', 'create', 'Hi this is a commit.',
            [{'cmd': 'some_command'}, {'cmd2': 'another_command'}])
        model2.update_timestamps()
        model2.put()
        user_data = (
            version_model.SNAPSHOT_METADATA_CLASS.export_data('committer_id'))
        expected_data = {
            'model_id-1': {
                'commit_type': 'create',
                'commit_message': 'Test <user ID>',
            },
            'model_id-2': {
                'commit_type': 'create',
                'commit_message': 'Hi this is a commit.',
            }
        }
        self.assertEqual(user_data, expected_data)


class BaseSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_version_string(self) -> None:
        model1 = base_models.BaseSnapshotContentModel(id='model_id-1')
        model1.update_timestamps()
        model1.put()
        self.assertEqual(model1.get_version_string(), '1')

    def test_get_unversioned_instance_id(self) -> None:
        model1 = base_models.BaseSnapshotContentModel(id='model_id-1')
        model1.update_timestamps()
        model1.put()
        self.assertEqual(model1.get_unversioned_instance_id(), 'model_id')


class CommitLogEntryModelTests(test_utils.GenericTestBase):
    """Test methods for CommitLogEntryModel."""

    def test_get_commit(self) -> None:
        model1 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            commit_cmds=[], commit_type='create',
            commit_message='New commit created.', version=1,
            status=constants.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model1.update_timestamps()
        model1.put()

        test_model = TestCommitLogEntryModel.get_commit('id', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert test_model is not None
        self.assertEqual(test_model.version, 1)
        self.assertEqual(test_model.user_id, 'user')
        self.assertEqual(test_model.commit_type, 'create')
        self.assertEqual(
            test_model.post_commit_status, constants.ACTIVITY_STATUS_PUBLIC)
        self.assertEqual(test_model.post_commit_community_owned, False)
        self.assertEqual(test_model.post_commit_is_private, False)

    def test_get_all_commits(self) -> None:
        model1 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            commit_cmds=[], commit_type='create',
            commit_message='New commit created.', version=1,
            status=constants.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model2 = TestCommitLogEntryModel.create(
            entity_id='id', committer_id='user',
            commit_cmds=[], commit_type='edit',
            commit_message='New commit created.', version=2,
            status=constants.ACTIVITY_STATUS_PUBLIC, community_owned=False
        )
        model1.update_timestamps()
        model1.put()
        model2.update_timestamps()
        model2.put()

        test_models = TestCommitLogEntryModel.get_all_commits(2, None)
        self.assertEqual(test_models[0][0].version, 2)
        self.assertEqual(test_models[0][1].version, 1)
        self.assertEqual(test_models[0][0].commit_type, 'edit')
        self.assertEqual(test_models[0][1].commit_type, 'create')


class VersionedModelTests(test_utils.GenericTestBase):
    """Test methods for VersionedModel."""

    def test_retrieval_of_multiple_version_models_for_fake_id(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'The given entity_id fake_id is invalid'):
            TestVersionedModel.get_multi_versions(
                'fake_id', [1, 2, 3])

    def test_commit_with_model_instance_deleted_raises_error(self) -> None:
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')

        with self.assertRaisesRegex(
            Exception, 'This model instance has been deleted.'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

    def test_trusted_commit_with_no_snapshot_metadata_raises_error(
            self
    ) -> None:
        model1 = TestVersionedModel(id='model_id1')
        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[assignment]
        # is used to test method commit() for invalid SNAPSHOT_METADATA_CLASS.
        model1.SNAPSHOT_METADATA_CLASS = None # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'No snapshot metadata class defined.'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        model1 = TestVersionedModel(id='model_id1')
        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[assignment]
        # is used to test method commit() for invalid SNAPSHOT_CONTENT_CLASS.
        model1.SNAPSHOT_CONTENT_CLASS = None # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'No snapshot content class defined.'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        model1 = TestVersionedModel(id='model_id1')
        with self.assertRaisesRegex(
            Exception, 'Expected commit_cmds to be a list of dicts, received'):
            # TODO(#13528): Here we use MyPy ignore because we remove this test
            # after the backend is fully type-annotated. Here ignore[arg-type]
            # is used to test method commit() for invalid input type.
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', {}) # type: ignore[arg-type]

        model1 = TestVersionedModel(id='model_id1')
        with self.assertRaisesRegex(
            Exception, 'Expected commit_cmds to be a list of dicts, received'):
            # TODO(#13528): Here we use MyPy ignore because we remove this test
            # after the backend is fully type-annotated. Here ignore[list-item]
            # is used to test method commit() for invalid input type.
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [[]]) # type: ignore[list-item]

    def test_put_raises_not_implemented_error_for_versioned_models(
            self
    ) -> None:
        model1 = TestVersionedModel(id='model_id1')

        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The put() method is missing from the derived '
                'class. It should be implemented in the derived class.')):
            model1.update_timestamps()
            model1.put()

    def test_force_deletion(self) -> None:
        model_id = 'model_id'
        model = TestVersionedModel(id=model_id)
        model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model_version_numbers = range(1, model.version + 1)
        model_snapshot_ids = [
            model.get_snapshot_id(model.id, version_number)
            for version_number in model_version_numbers]

        model.delete(
            feconf.SYSTEM_COMMITTER_ID, 'commit_msg', force_deletion=True)

        self.assertIsNone(TestVersionedModel.get_by_id(model_id))
        for model_snapshot_id in model_snapshot_ids:
            self.assertIsNone(
                TestSnapshotContentModel.get_by_id(model_snapshot_id))
            self.assertIsNone(
                TestSnapshotMetadataModel.get_by_id(model_snapshot_id))

    def test_delete_multi(self) -> None:
        model_1_id = 'model_1_id'
        model_1 = TestVersionedModel(id=model_1_id)
        model_1.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model_1.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model_1.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model_1_version_numbers = range(1, model_1.version + 1)
        model_1_snapshot_ids = [
            model_1.get_snapshot_id(model_1.id, version_number)
            for version_number in model_1_version_numbers]

        model_2_id = 'model_2_id'
        model_2 = TestVersionedModel(id=model_2_id)
        model_2.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model_2.commit(feconf.SYSTEM_COMMITTER_ID, 'commit_msg', [])
        model_2_version_numbers = range(1, model_2.version + 1)
        model_2_snapshot_ids = [
            model_2.get_snapshot_id(model_2.id, version_number)
            for version_number in model_2_version_numbers]

        with self.swap(feconf, 'MAX_NUMBER_OF_OPS_IN_TRANSACTION', 2):
            TestVersionedModel.delete_multi(
                [model_1_id, model_2_id],
                feconf.SYSTEM_COMMITTER_ID,
                'commit_msg',
                force_deletion=True)

        self.assertIsNone(TestVersionedModel.get_by_id(model_1_id))
        for model_snapshot_id in model_1_snapshot_ids:
            self.assertIsNone(
                TestSnapshotContentModel.get_by_id(model_snapshot_id))
            self.assertIsNone(
                TestSnapshotMetadataModel.get_by_id(model_snapshot_id))

        self.assertIsNone(TestVersionedModel.get_by_id(model_2_id))
        for model_snapshot_id in model_2_snapshot_ids:
            self.assertIsNone(
                TestSnapshotContentModel.get_by_id(model_snapshot_id))
            self.assertIsNone(
                TestSnapshotMetadataModel.get_by_id(model_snapshot_id))

    def test_commit_with_invalid_change_list_raises_error(self) -> None:
        model1 = TestVersionedModel(id='model_id1')

        # Test for invalid commit command.
        with self.assertRaisesRegex(
            Exception, 'Invalid commit_cmd:'):
            model1.commit(
                feconf.SYSTEM_COMMITTER_ID, '', [{'invalid_cmd': 'value'}])

        # Test for invalid change list command.
        with self.assertRaisesRegex(
            Exception, 'Invalid change list command:'):
            model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [{'cmd': 'AUTO'}])

    def test_revert_raises_error_when_not_allowed(self) -> None:
        model1 = TestVersionedModel(id='model_id1')
        with self.assertRaisesRegex(
            Exception,
            'Reverting objects of type TestVersionedModel is not allowed.'):
            model1.revert(model1, feconf.SYSTEM_COMMITTER_ID, '', 1)

    def test_get_snapshots_metadata_with_invalid_model_raises_error(
            self
    ) -> None:
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        with self.assertRaisesRegex(
            Exception,
            'Invalid version number 10 for model TestVersionedModel with id '
            'model_id1'):
            model1.get_snapshots_metadata('model_id1', [10])

    def test_get_version(self) -> None:
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        version_model = TestVersionedModel.get_version('model_id1', 2)
        self.assertEqual(version_model.version, 2)

        test_version_model = (
            TestVersionedModel.get_version('nonexistent_id1', 4, strict=False))
        self.assertIsNone(test_version_model)

        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            'Entity for class TestVersionedModel with id nonexistent_id1 '
            'not found'):
            TestVersionedModel.get_version('nonexistent_id1', 4, strict=True)

        test_version_model = (
            TestVersionedModel.get_version('model_id1', 4, strict=False))
        self.assertIsNone(test_version_model)

        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            'Entity for class TestSnapshotContentModel with id model_id1-4 '
            'not found'):
            TestVersionedModel.get_version('model_id1', 4, strict=True)

    def test_get_multi_versions(self) -> None:
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        models_by_version = TestVersionedModel.get_multi_versions(
            'model_id1', [1, 2])
        self.assertEqual(len(models_by_version), 2)
        self.assertEqual(models_by_version[0].version, 1)
        self.assertEqual(models_by_version[1].version, 2)

    def test_get_multi_versions_errors(self) -> None:
        model1 = TestVersionedModel(id='model_id1')
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        model1.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        with self.assertRaisesRegex(
            ValueError,
            'Requested version number 3 cannot be higher than the current '
            'version number 2.'):
            TestVersionedModel.get_multi_versions('model_id1', [1, 2, 3])

        with self.assertRaisesRegex(
            ValueError,
            'At least one version number is invalid'):
            # TODO(#13528): Here we use MyPy ignore because we remove this test
            # after the backend is fully type-annotated. Here ignore[list-item]
            # is used to test method get_multi_versions() for invalid input
            # type.
            TestVersionedModel.get_multi_versions('model_id1', [1, 1.5, 2]) # type: ignore[list-item]


class TestBaseModel(base_models.BaseModel):
    """Model that inherits BaseModel for testing. This is required as BaseModel
    gets subclassed a lot in other tests and that can create unexpected errors.
    """

    pass


class BaseModelTests(test_utils.GenericTestBase):

    def test_create_raises_error_when_many_id_collisions_occur(self) -> None:

        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            TestBaseModel, 'get_by_id', types.MethodType(
                lambda _, __: True, TestBaseModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            TestBaseModel.get_new_id('exploration')
