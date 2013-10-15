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


class DatastoreBackedFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the datastore-backed file system."""

    def test_get_and_put(self):
        fs = fs_domain.AbstractFileSystem(fs_domain.DatastoreBackedFileSystem())
        fs.put('eid', 'assets/abc.png', 'file_contents')
        self.assertEqual(fs.get('eid', 'assets/abc.png'), 'file_contents')

    def test_delete(self):
        fs = fs_domain.AbstractFileSystem(fs_domain.DatastoreBackedFileSystem())
        self.assertFalse(fs.isfile('eid', 'assets/abc.png'))
        fs.put('eid', 'assets/abc.png', 'file_contents')
        self.assertTrue(fs.isfile('eid', 'assets/abc.png'))

        fs.delete('eid', 'assets/abc.png')
        self.assertFalse(fs.isfile('eid', 'assets/abc.png'))
        with self.assertRaisesRegexp(AttributeError, '\'NoneType\' object'):
            fs.get('eid', 'assets/abc.png')

        # Nothing happens when one tries to delete a file that does not exist.
        fs.delete('eid', 'fake_file.png')

    def test_listdir(self):
        fs = fs_domain.AbstractFileSystem(fs_domain.DatastoreBackedFileSystem())
        fs.put('eid', 'assets/abc.png', 'file_contents')
        fs.put('eid', 'assets/abcd.png', 'file_contents_2')
        fs.put('eid', 'assets/abc/abcd.png', 'file_contents_3')
        fs.put('eid', 'assets/bcd/bcde.png', 'file_contents_4')

        self.assertEqual(
            fs.listdir('eid', 'assets'),
            ['assets/abc.png', 'assets/abc/abcd.png', 'assets/abcd.png',
             'assets/bcd/bcde.png'])

        self.assertEqual(
            fs.listdir('eid', 'assets/abc'), ['assets/abc/abcd.png'])

        self.assertEqual(fs.listdir('eid', '/assets/abc'), [])
        self.assertEqual(fs.listdir('eid', 'fake_dir'), [])
        self.assertEqual(fs.listdir('fake_eid', 'assets'), [])
