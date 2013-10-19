# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

from core.domain import fs_domain
import test_utils


class ExplorationFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the datastore-backed exploration file system."""

    def test_get_and_put(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid'))
        fs.put('abc.png', 'file_contents')
        self.assertEqual(fs.get('abc.png'), 'file_contents')

    def test_delete(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid'))
        self.assertFalse(fs.isfile('abc.png'))
        fs.put('abc.png', 'file_contents')
        self.assertTrue(fs.isfile('abc.png'))

        fs.delete('abc.png')
        self.assertFalse(fs.isfile('abc.png'))
        with self.assertRaisesRegexp(AttributeError, '\'NoneType\' object'):
            fs.get('abc.png')

        # Nothing happens when one tries to delete a file that does not exist.
        fs.delete('fake_file.png')

    def test_listdir(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid'))
        fs.put('abc.png', 'file_contents')
        fs.put('abcd.png', 'file_contents_2')
        fs.put('abc/abcd.png', 'file_contents_3')
        fs.put('bcd/bcde.png', 'file_contents_4')

        self.assertEqual(
            fs.listdir(''),
            ['abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png'])

        self.assertEqual(
            fs.listdir('abc'), ['abc/abcd.png'])

        self.assertEqual(fs.listdir('/abc'), [])
        self.assertEqual(fs.listdir('fake_dir'), [])

        new_fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid2'))
        self.assertEqual(new_fs.listdir('assets'), [])

    def test_versioning(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid'))
        fs.put('abc.png', 'file_contents')
        self.assertEqual(fs.get('abc.png'), 'file_contents')
        file_stream = fs.open('abc.png')
        self.assertEqual(file_stream.version, 1)
        self.assertEqual(file_stream.metadata.size, len('file_contents'))

        fs.put('abc.png', 'file_contents_2')
        self.assertEqual(fs.get('abc.png'), 'file_contents_2')
        file_stream = fs.open('abc.png')
        self.assertEqual(file_stream.version, 2)
        self.assertEqual(file_stream.metadata.size, len('file_contents_2'))

        self.assertEqual(fs.get('abc.png', 1), 'file_contents')
        old_file_stream = fs.open('abc.png', 1)
        self.assertEqual(old_file_stream.version, 1)
        self.assertEqual(old_file_stream.metadata.size, len('file_contents'))

    def test_independence_of_file_systems(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid'))
        fs.put('abc.png', 'file_contents')
        self.assertEqual(fs.get('abc.png'), 'file_contents')

        fs2 = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem('eid2'))
        with self.assertRaisesRegexp(AttributeError, '\'NoneType\' object'):
            fs2.get('abc.png')


class DiskBackedFileSystemTests(test_utils.GenericTestBase):
    """Tests for the disk-backed file system."""

    def test_get(self):
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DiskBackedFileSystem('core/tests/data'))
        self.assertTrue(fs.get('img.png'))
        with self.assertRaisesRegexp(IOError, 'No such file or directory'):
            fs.get('non_existent_file.png')
