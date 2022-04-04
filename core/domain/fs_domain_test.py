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

from __future__ import annotations

import re

from core import feconf
from core import utils
from core.domain import fs_domain
from core.platform import models
from core.tests import test_utils

app_identity_services = models.Registry.import_app_identity_services()


class GcsFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the GCS file system."""

    def setUp(self) -> None:
        super(GcsFileSystemUnitTests, self).setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)  # type: ignore[no-untyped-call]
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, 'eid'))

    def test_get_and_save(self) -> None:
        self.fs.commit('abc.png', 'file_contents')
        self.assertEqual(self.fs.get('abc.png'), b'file_contents')

    def test_validate_entity_parameters(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Invalid entity_id received: 1'):
            # Here, Argument 2 is expected to be of type str. But for test
            # purpose we're assigning it an int type. Thus to avoid MyPy error,
            # we added an ignore here.
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, 1)  # type: ignore[arg-type]

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Entity id cannot be empty'):
            fs_domain.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, '')

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.ValidationError, 'Invalid entity_name received: '
            'invalid_name.'):
            fs_domain.GcsFileSystem('invalid_name', 'exp_id')

    def test_delete(self) -> None:
        self.assertFalse(self.fs.isfile('abc.png'))
        self.fs.commit('abc.png', 'file_contents')
        self.assertTrue(self.fs.isfile('abc.png'))

        self.fs.delete('abc.png')
        self.assertFalse(self.fs.isfile('abc.png'))
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            IOError, re.escape('File abc.png not found')
        ):
            self.fs.get('abc.png')

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            IOError, 'File does not exist: fake_file.png'
        ):
            self.fs.delete('fake_file.png')

    def test_listdir(self) -> None:
        self.assertItemsEqual(self.fs.listdir(''), [])  # type: ignore[no-untyped-call]

        self.fs.commit('abc.png', 'file_contents')
        self.fs.commit('abcd.png', 'file_contents_2')
        self.fs.commit('abc/abcd.png', 'file_contents_3')
        self.fs.commit('bcd/bcde.png', 'file_contents_4')

        file_names = ['abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png']

        self.assertItemsEqual(self.fs.listdir(''), file_names)  # type: ignore[no-untyped-call]

        self.assertEqual(
            self.fs.listdir('abc'), ['abc/abcd.png'])

        with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
            self.fs.listdir('/abc')

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
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

    def test_copy(self) -> None:
        self.fs.commit('abc2.png', 'file_contents')
        self.assertEqual(self.fs.listdir(''), ['abc2.png'])
        destination_fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_QUESTION, 'question_id1'))
        self.assertEqual(destination_fs.listdir(''), [])
        destination_fs.copy(self.fs.impl.assets_path, 'abc2.png')
        self.assertTrue(destination_fs.isfile('abc2.png'))


class DirectoryTraversalTests(test_utils.GenericTestBase):
    """Tests to check for the possibility of directory traversal."""

    def setUp(self) -> None:
        super(DirectoryTraversalTests, self).setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)  # type: ignore[no-untyped-call]

    def test_invalid_filepaths_are_caught(self) -> None:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'eid'))

        invalid_filepaths = [
            '..', '../another_exploration', '../', '/..', '/abc']

        for filepath in invalid_filepaths:
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
                fs.isfile(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
                fs.open(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
                fs.get(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
                fs.commit(filepath, 'raw_file')
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
                fs.delete(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):  # type: ignore[no-untyped-call]
                fs.listdir(filepath)
