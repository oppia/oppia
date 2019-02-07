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

"""Tests for core.storage.file.gae_models."""

from core.platform import models
from core.tests import test_utils
import feconf

(file_models, base_models) = models.Registry.import_models(
    [models.NAMES.file, models.NAMES.base_model])


class FileMetadataModelTest(test_utils.GenericTestBase):
    """Tests the FileMetadataModel class."""

    def test_get_new_id_raises_not_implemented_error(self):
        with self.assertRaises(NotImplementedError):
            file_models.FileMetadataModel.get_new_id('entity1')

    def test_get_undeleted_with_two_undeleted_models_returns_both(self):
        file_metadata_model1 = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        file_metadata_model2 = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file2.png')
        file_metadata_model2.commit(feconf.SYSTEM_COMMITTER_ID, [])
        file_metadata_model_list = (
            file_models.FileMetadataModel.get_undeleted())
        self.assertEqual(len(file_metadata_model_list), 2)
        self.assertEqual(
            file_metadata_model1, file_metadata_model_list[0])
        self.assertEqual(
            file_metadata_model2, file_metadata_model_list[1])

    def test_get_undeleted_with_a_deleted_and_undeleted_model_returns_undeleted(
            self):
        file_metadata_model1 = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        file_metadata_model2 = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file2.png')
        file_metadata_model2.commit(feconf.SYSTEM_COMMITTER_ID, [])
        file_metadata_model2.delete(
            feconf.SYSTEM_COMMITTER_ID, 'Delete second file model')
        file_metadata_model_list = (
            file_models.FileMetadataModel.get_undeleted())
        self.assertEqual(len(file_metadata_model_list), 1)
        self.assertEqual(
            file_metadata_model1, file_metadata_model_list[0])

    def test_create_with_exp_id_not_in_filepath_and_false_deleted_status_creates_model( # pylint: disable=line-too-long
            self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        self.assertFalse(file_metadata_model.deleted)
        self.assertEqual(
            file_metadata_model.id, '/exp_id1/path/to/file1.png')

    def test_create_with_exp_id_in_filepath_and_false_deleted_status_creates_model( # pylint: disable=line-too-long
            self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', '/exp_id1/path/to/file1.png')
        self.assertFalse(file_metadata_model.deleted)
        self.assertEqual(
            file_metadata_model.id, '/exp_id1/path/to/file1.png')

    def test_get_model_with_model_present_returns_the_correct_model(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model = file_models.FileMetadataModel.get_model(
            'exp_id1', 'path/to/file1.png')

        self.assertEqual(retrieved_model, file_metadata_model)

    def test_get_model_non_strict_with_no_model_present_returns_none(self):
        retrieved_model = file_models.FileMetadataModel.get_model(
            'exp_id1', 'path/to/file2.png')
        self.assertIsNone(retrieved_model)

    def test_get_model_strict_with_no_model_present_raises_error(self):
        with self.assertRaisesRegexp(
            base_models.BaseModel.EntityNotFoundError, (
                'Entity for class FileMetadataModel with id.+?not found')):
            file_models.FileMetadataModel.get_model(
                'exp_id1', 'path/to/file2.png', True)

    def test_get_version_with_version_present_returns_correct_model(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        retrieved_model = file_models.FileMetadataModel.get_version(
            'exp_id1', 'path/to/file1.png', 1)
        self.assertEqual(file_metadata_model.key, retrieved_model.key)
        self.assertEqual(retrieved_model.version, 1)

        retrieved_model = file_models.FileMetadataModel.get_version(
            'exp_id1', 'path/to/file1.png', 2)
        self.assertEqual(file_metadata_model.key, retrieved_model.key)
        self.assertEqual(retrieved_model.version, 2)

    def test_get_version_with_version_absent_raises_error(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        with self.assertRaisesRegexp(
            base_models.BaseModel.EntityNotFoundError, (
                'Entity for class FileMetadataSnapshotContentModel with id'
                '.+?-2 not found')):
            file_models.FileMetadataModel.get_version(
                'exp_id1', 'path/to/file1.png', 2)

    def test_commit_updates_version_of_stored_model(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        self.assertEqual(file_metadata_model.version, 0)

        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        self.assertEqual(file_metadata_model.version, 1)


class FileModelTest(test_utils.GenericTestBase):
    """Tests the FileModel class."""

    def test_file_model_content_is_reconstituted_correctly(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        file_model.content = 'file_contents'
        commit_cmds = [{'cmd': 'edit'}]
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, commit_cmds)
        retrieved_model = file_models.FileModel.get_version(
            'exp_id1', 'path/to/file1.png', 2)
        self.assertEqual(file_model.key, retrieved_model.key)
        self.assertEqual(retrieved_model.content, 'file_contents')

    def test_initial_file_model_has_no_content(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')

        self.assertIsNone(file_model.content)

    def test_file_model_snapshot_includes_file_model_content(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        file_model.content = 'file_contents'
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        self.assertEqual(file_model.content, 'file_contents')

    def test_get_new_id_raises_not_implemented_error(self):
        with self.assertRaises(NotImplementedError):
            file_models.FileModel.get_new_id('entity1')

    def test_create_with_exp_id_not_in_filepath_and_false_deleted_status_creates_model( # pylint: disable=line-too-long
            self):
        file_model1 = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        self.assertFalse(file_model1.deleted)
        self.assertEqual(file_model1.id, '/exp_id1/path/to/file1.png')

    def test_create_with_exp_id_in_filepath_and_false_deleted_status_creates_model( # pylint: disable=line-too-long
            self):
        file_model = file_models.FileModel.create(
            'exp_id1', '/exp_id1/path/to/file1.png')
        self.assertFalse(file_model.deleted)
        self.assertEqual(file_model.id, '/exp_id1/path/to/file1.png')

    def test_get_model_with_model_present_returns_the_correct_model(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model = file_models.FileModel.get_model(
            'exp_id1', 'path/to/file1.png')

        self.assertEqual(retrieved_model, file_model)

    def test_get_model_non_strict_with_no_model_present_returns_none(self):
        retrieved_model = file_models.FileModel.get_model(
            'exp_id1', 'path/to/file2.png')
        self.assertIsNone(retrieved_model)

    def test_get_model_strict_with_no_model_present_raises_erro(self):
        with self.assertRaisesRegexp(
            base_models.BaseModel.EntityNotFoundError, (
                'Entity for class FileModel with id.+?not found')):
            file_models.FileModel.get_model(
                'exp_id1', 'path/to/file2.png', True)

    def test_commit_updates_version_of_stored_model(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        self.assertEqual(file_model.version, 0)

        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        self.assertEqual(file_model.version, 1)

    def test_get_version_with_version_present_returns_correct_model(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')

        file_model.content = 'file_contents_after_first_commit'
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        file_model.content = 'file_contents_after_second_commit'
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        retrieved_model = file_models.FileModel.get_version(
            'exp_id1', 'path/to/file1.png', 1)
        self.assertEqual(file_model.key, retrieved_model.key)
        self.assertEqual(
            retrieved_model.content, 'file_contents_after_first_commit')
        self.assertEqual(retrieved_model.version, 1)

        retrieved_model = file_models.FileModel.get_version(
            'exp_id1', 'path/to/file1.png', 2)
        self.assertEqual(file_model.key, retrieved_model.key)
        self.assertEqual(
            retrieved_model.content, 'file_contents_after_second_commit')
        self.assertEqual(retrieved_model.version, 2)

    def test_get_version_with_version_absent_raises_error(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        with self.assertRaisesRegexp(
            base_models.BaseModel.EntityNotFoundError, (
                'Entity for class FileSnapshotContentModel with id'
                '.+?-2 not found')):
            file_models.FileModel.get_version(
                'exp_id1', 'path/to/file1.png', 2)
