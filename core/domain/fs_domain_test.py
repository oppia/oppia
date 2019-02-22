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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for filesystem-related domain objects."""
import logging
import os

from constants import constants
from core.domain import fs_domain
from core.platform import models
from core.tests import test_utils
import feconf

app_identity_services = models.Registry.import_app_identity_services()
(file_models,) = models.Registry.import_models(
    [models.NAMES.file])


class ExplorationFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the datastore-backed exploration file system."""

    def setUp(self):
        super(ExplorationFileSystemUnitTests, self).setUp()
        self.user_email = 'abc@example.com'
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('exploration/eid'))

    def test_get_and_save(self):
        self.fs.commit(self.user_id, 'abc.png', 'file_contents')
        self.assertEqual(self.fs.get('abc.png'), 'file_contents')

    def test_get_raises_error_when_file_size_is_more_than_1_mb(self):
        self.fs.commit(self.user_id, 'abc.png', 'file_contents')

        with open(
            os.path.join(
                feconf.TESTS_DATA_DIR, 'cafe-over-five-minutes.mp3')) as f:
            raw_bytes = f.read()

        with self.assertRaisesRegexp(
            Exception, 'The maximum allowed file size is 1 MB.'):
            self.fs.commit(self.user_id, 'large_file.png', raw_bytes)

    def test_get_save_raises_error_when_metadata_and_data_are_not_in_sync(self):
        observed_log_messages = []

        def mock_logging_function(msg, *_):
            observed_log_messages.append(msg)

        with self.swap(logging, 'error', mock_logging_function):
            self.fs.commit(self.user_id, 'abc.png', 'file_contents')

            data = file_models.FileModel.get_model(
                'exploration/eid', 'assets/abc.png')
            data.delete(self.user_id, '', True)

            with self.assertRaisesRegexp(
                IOError, r'File abc\.png .* not found'):
                self.fs.get('abc.png')

            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                (
                    'Metadata and data for file abc.png (version None) are '
                    'out of sync.'
                )
            )

    def test_delete(self):
        self.assertFalse(self.fs.isfile('abc.png'))
        self.fs.commit(self.user_id, 'abc.png', 'file_contents')
        self.assertTrue(self.fs.isfile('abc.png'))

        self.fs.delete(self.user_id, 'abc.png')
        self.assertFalse(self.fs.isfile('abc.png'))
        with self.assertRaisesRegexp(IOError, r'File abc\.png .* not found'):
            self.fs.get('abc.png')

        # Nothing happens when one tries to delete a file that does not exist.
        self.fs.delete(self.user_id, 'fake_file.png')

    def test_listdir(self):
        self.fs.commit(self.user_id, 'abc.png', 'file_contents')
        self.fs.commit(self.user_id, 'abcd.png', 'file_contents_2')
        self.fs.commit(self.user_id, 'abc/abcd.png', 'file_contents_3')
        self.fs.commit(self.user_id, 'bcd/bcde.png', 'file_contents_4')

        self.assertEqual(self.fs.listdir(''), [
            'abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png'])

        self.assertEqual(self.fs.listdir('abc'), ['abc/abcd.png'])

        with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
            self.fs.listdir('/abc')

        self.assertEqual(self.fs.listdir('fake_dir'), [])

        new_fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('exploration/eid2'))
        self.assertEqual(new_fs.listdir('assets'), [])

    def test_versioning(self):
        self.fs.commit(self.user_id, 'abc.png', 'file_contents')
        self.assertEqual(self.fs.get('abc.png'), 'file_contents')
        file_stream = self.fs.open('abc.png')
        self.assertEqual(file_stream.version, 1)
        self.assertEqual(file_stream.metadata.size, len('file_contents'))

        self.fs.commit(self.user_id, 'abc.png', 'file_contents_2_abcdefg')
        self.assertEqual(self.fs.get('abc.png'), 'file_contents_2_abcdefg')
        file_stream = self.fs.open('abc.png')
        self.assertEqual(file_stream.version, 2)
        self.assertEqual(
            file_stream.metadata.size, len('file_contents_2_abcdefg'))

        self.assertEqual(
            self.fs.get('abc.png', version=1), 'file_contents')
        old_file_stream = self.fs.open('abc.png', version=1)
        self.assertEqual(old_file_stream.version, 1)
        self.assertEqual(old_file_stream.metadata.size, len('file_contents'))

    def test_independence_of_file_systems(self):
        self.fs.commit(self.user_id, 'abc.png', 'file_contents')
        self.assertEqual(self.fs.get('abc.png'), 'file_contents')

        fs2 = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid2'))
        with self.assertRaisesRegexp(IOError, r'File abc\.png .* not found'):
            fs2.get('abc.png')


class DiskBackedFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the disk-backed file system."""

    def setUp(self):
        super(DiskBackedFileSystemUnitTests, self).setUp()
        self.user_email = 'abc@example.com'
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.fs = fs_domain.AbstractFileSystem(fs_domain.DiskBackedFileSystem(
            feconf.TESTS_DATA_DIR))

    def test_get(self):
        self.assertTrue(self.fs.get('img.png'))
        with self.assertRaisesRegexp(IOError, 'No such file or directory'):
            self.fs.get('non_existent_file.png')

    def test_commit(self):
        with self.assertRaises(NotImplementedError):
            self.fs.commit(self.user_id, 'abc.png', 'file_contents')

    def test_isfile(self):
        self.assertTrue(self.fs.isfile('img.png'))
        self.assertFalse(self.fs.isfile('fake.png'))

    def test_delete(self):
        with self.assertRaises(NotImplementedError):
            self.fs.delete(self.user_id, 'img.png')

    def test_listdir(self):
        with self.assertRaises(NotImplementedError):
            self.fs.listdir('')


class GcsFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the GCS file system."""

    def setUp(self):
        super(GcsFileSystemUnitTests, self).setUp()
        self.user_email = 'abc@example.com'
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem('exploration/eid'))

    def test_get_and_save(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.fs.commit(self.user_id, 'abc.png', 'file_contents')
            self.assertEqual(self.fs.get('abc.png'), 'file_contents')

    def test_delete(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertFalse(self.fs.isfile('abc.png'))
            self.fs.commit(self.user_id, 'abc.png', 'file_contents')
            self.assertTrue(self.fs.isfile('abc.png'))

            self.fs.delete(self.user_id, 'abc.png')
            self.assertFalse(self.fs.isfile('abc.png'))
            with self.assertRaisesRegexp(
                IOError, r'File abc\.png .* not found'):
                self.fs.get('abc.png')

            with self.assertRaisesRegexp(
                IOError, 'Image does not exist: fake_file.png'):
                self.fs.delete(self.user_id, 'fake_file.png')

    def test_listdir(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.fs.commit(self.user_id, 'abc.png', 'file_contents')
            self.fs.commit(self.user_id, 'abcd.png', 'file_contents_2')
            self.fs.commit(self.user_id, 'abc/abcd.png', 'file_contents_3')
            self.fs.commit(self.user_id, 'bcd/bcde.png', 'file_contents_4')

            bucket_name = app_identity_services.get_gcs_resource_bucket_name()
            gcs_file_dir = (
                '/%s/%s/assets/' % (
                    bucket_name, 'exploration/eid'))

            file_names = ['abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png']
            file_list = []

            for file_name in file_names:
                file_list.append(os.path.join(gcs_file_dir, file_name))

            self.assertEqual(self.fs.listdir(''), file_list)

            self.assertEqual(
                self.fs.listdir('abc'), [os.path.join(
                    gcs_file_dir, 'abc/abcd.png')])

            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                self.fs.listdir('/abc')

            with self.assertRaisesRegexp(
                IOError,
                (
                    'The dir_name should not start with /'
                    ' or end with / : abc/'
                )
            ):
                self.fs.listdir('abc/')

            self.assertEqual(self.fs.listdir('fake_dir'), [])

            new_fs = fs_domain.AbstractFileSystem(
                fs_domain.GcsFileSystem('exploration/eid2'))
            self.assertEqual(new_fs.listdir('assets'), [])


class DirectoryTraversalTests(test_utils.GenericTestBase):
    """Tests to check for the possibility of directory traversal."""

    def setUp(self):
        super(DirectoryTraversalTests, self).setUp()
        self.user_email = 'abc@example.com'
        self.user_id = self.get_user_id_from_email(self.user_email)

    def test_invalid_filepaths_are_caught(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('exploration/eid'))

        invalid_filepaths = [
            '..', '../another_exploration', '../', '/..', '/abc']

        for filepath in invalid_filepaths:
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.isfile(filepath)
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.open(filepath)
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.get(filepath)
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.commit(self.user_id, filepath, 'raw_file')
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.delete(self.user_id, filepath)
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.listdir(filepath)
