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

(file_models,) = models.Registry.import_models([models.NAMES.file])


class FileMetadataModelTest(test_utils.GenericTestBase):
    """Tests the FileMetadataModel class."""

    def test_get_new_id_raises_not_implemented_error(self):
        with self.assertRaises(NotImplementedError):
            file_models.FileMetadataModel.get_new_id('entity1')

    def test_get_undeleted_returns_undeleted_instances(self):
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

        file_metadata_model2.delete(
            feconf.SYSTEM_COMMITTER_ID, 'Delete second file model')
        file_metadata_model_list = (
            file_models.FileMetadataModel.get_undeleted())
        self.assertEqual(len(file_metadata_model_list), 1)
        self.assertEqual(
            file_metadata_model1, file_metadata_model_list[0])

    def test_construct_id_constructs_correct_model_id(self):
        file_metadata_model_id1 = (
            file_models.FileMetadataModel._construct_id( # pylint: disable=protected-access
                'exp_id1', 'path/to/file.png'))
        file_metadata_model_id2 = (
            file_models.FileMetadataModel._construct_id( # pylint: disable=protected-access
                'exp_id1', '/exp_id1/path/to/file.png'))

        self.assertEqual(
            file_metadata_model_id1, '/exp_id1/path/to/file.png')
        self.assertEqual(
            file_metadata_model_id2, '/exp_id1/path/to/file.png')

    def test_create_creates_model_with_correct_id(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file.png')
        self.assertEqual(file_metadata_model.deleted, False)
        self.assertEqual(
            file_metadata_model.id, '/exp_id1/path/to/file.png')

    def test_get_model_returns_the_instance_with_desired_id(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        actual_model = file_models.FileMetadataModel.get_model(
            'exp_id1', 'path/to/file1.png')

        self.assertEqual(actual_model, file_metadata_model)

        actual_model = file_models.FileMetadataModel.get_model(
            'exp_id1', 'path/to/file2.png')
        self.assertEqual(actual_model, None)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class FileMetadataModel '
            'with id /exp_id1/path/to/file2.png not found')):
            actual_model = file_models.FileMetadataModel.get_model(
                'exp_id1', 'path/to/file2.png', True)

    def test_get_version_returns_instance_with_desired_version(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        actual_model = file_models.FileMetadataModel.get_version(
            'exp_id1', 'path/to/file1.png', 1)
        self.assertEqual(file_metadata_model.key, actual_model.key)

        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        actual_model = file_models.FileMetadataModel.get_version(
            'exp_id1', 'path/to/file1.png', 2)
        self.assertEqual(file_metadata_model.key, actual_model.key)

    def test_commit_updates_version_of_instance(self):
        file_metadata_model = file_models.FileMetadataModel.create(
            'exp_id1', 'path/to/file1.png')
        self.assertEqual(file_metadata_model.version, 0)

        file_metadata_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        self.assertEqual(file_metadata_model.version, 1)


class FileModelTest(test_utils.GenericTestBase):
    """Tests the FileModel class."""

    def test_reconstitute_changes_the_content_snapshot(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file.png')
        self.assertEqual(file_model.content, None)
        file_model._reconstitute('file_content') # pylint: disable=protected-access
        self.assertEqual(file_model.content, 'file_content')

    def test_compute_snapshot_returns_file_content_snapshot(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file.png')
        self.assertEqual(file_model._compute_snapshot(), None) # pylint: disable=protected-access
        file_model._reconstitute('file_content') # pylint: disable=protected-access
        self.assertEqual(file_model._compute_snapshot(), 'file_content') # pylint: disable=protected-access

    def test_get_new_id_raises_not_implemented_error(self):
        with self.assertRaises(NotImplementedError):
            file_models.FileModel.get_new_id('entity1')

    def test_construct_id_constructs_correct_model_id(self):
        file_model_id1 = file_models.FileModel._construct_id( # pylint: disable=protected-access
            'exp_id1', 'path/to/file.png')
        file_model_id2 = file_models.FileModel._construct_id( # pylint: disable=protected-access
            'exp_id1', '/exp_id1/path/to/file.png')

        self.assertEqual(file_model_id1, '/exp_id1/path/to/file.png')
        self.assertEqual(file_model_id2, '/exp_id1/path/to/file.png')

    def test_create_creates_model_with_correct_id(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file.png')
        self.assertEqual(file_model.deleted, False)
        self.assertEqual(file_model.id, '/exp_id1/path/to/file.png')

    def test_get_model_returns_the_instance_with_desired_id(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        actual_model = file_models.FileModel.get_model(
            'exp_id1', 'path/to/file1.png')

        self.assertEqual(actual_model, file_model)

        actual_model = file_models.FileModel.get_model(
            'exp_id1', 'path/to/file2.png')
        self.assertEqual(actual_model, None)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class FileModel '
            'with id /exp_id1/path/to/file2.png not found')):
            actual_model = file_models.FileModel.get_model(
                'exp_id1', 'path/to/file2.png', True)

    def test_commit_updates_version_of_instance(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        self.assertEqual(file_model.version, 0)

        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        self.assertEqual(file_model.version, 1)

    def test_get_version_returns_instance_with_desired_version(self):
        file_model = file_models.FileModel.create(
            'exp_id1', 'path/to/file1.png')
        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])

        actual_model = file_models.FileModel.get_version(
            'exp_id1', 'path/to/file1.png', 1)
        self.assertEqual(file_model.key, actual_model.key)

        file_model.commit(feconf.SYSTEM_COMMITTER_ID, [])
        actual_model = file_models.FileModel.get_version(
            'exp_id1', 'path/to/file1.png', 2)
        self.assertEqual(file_model.key, actual_model.key)
