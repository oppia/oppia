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

from core.domain import fs_domain
from core.platform import models
from core.tests import test_utils
import feconf
import utils

app_identity_services = models.Registry.import_app_identity_services()


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
        self.assertFalse(self.fs.isfile('abc.png'))
        self.fs.commit('abc.png', 'file_contents')
        self.assertTrue(self.fs.isfile('abc.png'))

        self.fs.delete('abc.png')
        self.assertFalse(self.fs.isfile('abc.png'))
        with self.assertRaisesRegexp(
            IOError, r'File abc\.png not found'):
            self.fs.get('abc.png')

        with self.assertRaisesRegexp(
            IOError, 'Image does not exist: fake_file.png'):
            self.fs.delete('fake_file.png')

    def test_listdir(self):
        self.fs.commit('abc.png', 'file_contents')
        self.fs.commit('abcd.png', 'file_contents_2')
        self.fs.commit('abc/abcd.png', 'file_contents_3')
        self.fs.commit('bcd/bcde.png', 'file_contents_4')

        file_names = ['abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png']

        self.assertEqual(self.fs.listdir(''), file_names)

        self.assertEqual(
            self.fs.listdir('abc'), ['abc/abcd.png'])

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
            fs_domain.GcsFileSystem(
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
