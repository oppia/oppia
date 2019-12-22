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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import os
import shutil

from constants import constants
from core.domain import fs_domain
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

app_identity_services = models.Registry.import_app_identity_services()
(file_models,) = models.Registry.import_models(
    [models.NAMES.file])


class DiskBackedFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the disk-backed exploration file system."""

    def setUp(self):
        super(DiskBackedFileSystemUnitTests, self).setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.DiskBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'eid'))
        self.image_content = python_utils.convert_to_bytes('image_content')

    def test_get_and_save(self):
        self.fs.commit('abc.png', self.image_content)
        self.assertEqual(self.fs.get('abc.png'), self.image_content)

    def test_validate_entity_parameters(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid entity_id received: 1'):
            fs_domain.DiskBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 1)

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Entity id cannot be empty'):
            fs_domain.DiskBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, '')

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid entity_name received: '
            'invalid_name.'):
            fs_domain.DiskBackedFileSystem('invalid_name', 'exp_id')

    def test_save_file_size_is_more_than_1_mb(self):
        with python_utils.open_file(
            os.path.join(
                feconf.TESTS_DATA_DIR, 'cafe-over-five-minutes.mp3'),
            'rb', encoding=None) as f:
            raw_bytes = f.read()

        self.fs.commit('audio_file.mp3', raw_bytes)
        self.assertEqual(self.fs.get('audio_file.mp3'), raw_bytes)

    def test_delete(self):
        self.assertFalse(self.fs.isfile('abc.png'))
        self.fs.commit('abc.png', self.image_content)
        self.assertTrue(self.fs.isfile('abc.png'))

        self.fs.delete('abc.png')
        self.assertFalse(self.fs.isfile('abc.png'))
        with self.assertRaisesRegexp(IOError, r'File abc\.png .* not found'):
            self.fs.get('abc.png')

        # Nothing happens when one tries to delete a file that does not exist.
        self.fs.delete('fake_file.png')

    def test_listdir(self):
        self.fs.commit('abc.png', self.image_content)
        self.fs.commit('abcd.png', self.image_content)
        self.fs.commit('abc/abcd.png', self.image_content)
        self.fs.commit('bcd/bcde.png', self.image_content)

        self.assertEqual(self.fs.listdir(''), [
            'abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png'])

        self.assertEqual(self.fs.listdir('abc'), ['abc/abcd.png'])

        with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
            self.fs.listdir('/abc')

        self.assertEqual(self.fs.listdir('fake_dir'), [])

        new_fs = fs_domain.AbstractFileSystem(
            fs_domain.DiskBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'eid2'))
        self.assertEqual(new_fs.listdir('assets'), [])

    def test_independence_of_file_systems(self):
        self.fs.commit('abc.png', self.image_content)
        self.assertEqual(self.fs.get('abc.png'), self.image_content)

        fs2 = fs_domain.AbstractFileSystem(
            fs_domain.DiskBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'eid2'))
        with self.assertRaisesRegexp(IOError, r'File abc\.png .* not found'):
            fs2.get('abc.png')


class GcsFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the GCS file system."""

    def setUp(self):
        super(GcsFileSystemUnitTests, self).setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, 'eid'))

    def test_get_and_save(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.fs.commit('abc.png', 'file_contents')
            self.assertEqual(self.fs.get('abc.png'), 'file_contents')

    def test_validate_entity_parameters(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid entity_id received: 1'):
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, 1)

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Entity id cannot be empty'):
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, '')

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid entity_name received: '
            'invalid_name.'):
            fs_domain.GcsFileSystem('invalid_name', 'exp_id')

    def test_delete(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertFalse(self.fs.isfile('abc.png'))
            self.fs.commit('abc.png', 'file_contents')
            self.assertTrue(self.fs.isfile('abc.png'))

            self.fs.delete('abc.png')
            self.assertFalse(self.fs.isfile('abc.png'))
            with self.assertRaisesRegexp(
                IOError, r'File abc\.png .* not found'):
                self.fs.get('abc.png')

            with self.assertRaisesRegexp(
                IOError, 'Image does not exist: fake_file.png'):
                self.fs.delete('fake_file.png')

    def test_listdir(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.fs.commit('abc.png', 'file_contents')
            self.fs.commit('abcd.png', 'file_contents_2')
            self.fs.commit('abc/abcd.png', 'file_contents_3')
            self.fs.commit('bcd/bcde.png', 'file_contents_4')

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
                fs_domain.GcsFileSystem(
                    feconf.ENTITY_TYPE_EXPLORATION, 'eid2'))
            self.assertEqual(new_fs.listdir('assets'), [])


class DirectoryTraversalTests(test_utils.GenericTestBase):
    """Tests to check for the possibility of directory traversal."""

    def setUp(self):
        super(DirectoryTraversalTests, self).setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

    def test_invalid_filepaths_are_caught(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DiskBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'eid'))

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
                fs.commit(filepath, 'raw_file')
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.delete(filepath)
            with self.assertRaisesRegexp(IOError, 'Invalid filepath'):
                fs.listdir(filepath)
