# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for File System services."""

from __future__ import annotations

import os
from unittest import mock

from core import feconf
from core import utils
from core.constants import constants
from core.domain import fs_services
from core.domain import image_services
from core.domain import user_services
from core.tests import test_utils


class GcsFileSystemUnitTests(test_utils.GenericTestBase):
    """Tests for the GCS file system."""

    def setUp(self) -> None:
        super().setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, 'eid')

    def test_get_and_save(self) -> None:
        self.fs.commit('abc.png', b'file_contents')
        self.assertEqual(self.fs.get('abc.png'), b'file_contents')

    def test_validate_entity_parameters(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid entity_id received: 1'
        ):
            # Here we use MyPy ignore because the argument `entity_id` of
            # GcsFileSystem() can only accept string values, but here for
            # testing purpose we are providing integer value. Thus to avoid
            # incompatible argument type MyPy error, we added an ignore
            # statement here.
            fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, 1)  # type: ignore[arg-type]

        with self.assertRaisesRegex(
            utils.ValidationError, 'Entity id cannot be empty'
        ):
            fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, '')

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid entity_name received: '
            'invalid_name.'
        ):
            fs_services.GcsFileSystem('invalid_name', 'exp_id')

    def test_delete(self) -> None:
        self.assertFalse(self.fs.isfile('abc.png'))
        self.fs.commit('abc.png', b'file_contents')
        self.assertTrue(self.fs.isfile('abc.png'))

        self.fs.delete('abc.png')
        self.assertFalse(self.fs.isfile('abc.png'))

        with self.assertRaisesRegex(
            IOError, 'File abc.png not found'
        ):
            self.fs.get('abc.png')

        with self.assertRaisesRegex(
            IOError, 'File does not exist: fake_file.png'
        ):
            self.fs.delete('fake_file.png')

    def test_listdir(self) -> None:
        self.assertItemsEqual(self.fs.listdir(''), [])

        self.fs.commit('abc.png', b'file_contents')
        self.fs.commit('abcd.png', b'file_contents_2')
        self.fs.commit('abc/abcd.png', b'file_contents_3')
        self.fs.commit('bcd/bcde.png', b'file_contents_4')

        file_names = ['abc.png', 'abc/abcd.png', 'abcd.png', 'bcd/bcde.png']

        self.assertItemsEqual(self.fs.listdir(''), file_names)

        self.assertEqual(self.fs.listdir('abc'), ['abc/abcd.png'])

        with self.assertRaisesRegex(IOError, 'Invalid filepath'):
            self.fs.listdir('/abc')

        with self.assertRaisesRegex(
            IOError,
            (
                'The dir_name should not start with /'
                ' or end with / : abc/'
            )
        ):
            self.fs.listdir('abc/')

        self.assertEqual(self.fs.listdir('fake_dir'), [])

        new_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, 'eid2')
        self.assertEqual(new_fs.listdir('assets'), [])

    def test_copy(self) -> None:
        self.fs.commit('abc2.png', b'file_contents')
        self.assertEqual(self.fs.listdir(''), ['abc2.png'])
        destination_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_QUESTION, 'question_id1')
        self.assertEqual(destination_fs.listdir(''), [])
        destination_fs.copy(self.fs.assets_path, 'abc2.png')
        self.assertTrue(destination_fs.isfile('abc2.png'))


class DirectoryTraversalTests(test_utils.GenericTestBase):
    """Tests to check for the possibility of directory traversal."""

    def setUp(self) -> None:
        super().setUp()
        self.USER_EMAIL = 'abc@example.com'
        self.signup(self.USER_EMAIL, 'username')
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

    def test_invalid_filepaths_are_caught(self) -> None:
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, 'eid')

        invalid_filepaths = [
            '..', '../another_exploration', '../', '/..', '/abc']

        for filepath in invalid_filepaths:
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):
                fs.isfile(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):
                fs.get(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):
                fs.commit(filepath, b'raw_file')
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):
                fs.delete(filepath)
            with self.assertRaisesRegex(IOError, 'Invalid filepath'):
                fs.listdir(filepath)


class SaveOriginalAndCompressedVersionsOfImageTests(test_utils.GenericTestBase):
    """Test for saving the three versions of the image file."""

    EXPLORATION_ID = 'exp_id'
    FILENAME = 'image.png'
    COMPRESSED_IMAGE_FILENAME = 'image_compressed.png'
    MICRO_IMAGE_FILENAME = 'image_micro.png'
    USER = 'ADMIN'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        self.admin = user_services.get_user_actions_info(self.user_id_admin)

    def test_save_original_and_compressed_versions_of_image(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            original_image_content = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID)
        self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
        self.assertFalse(fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))
        fs_services.save_original_and_compressed_versions_of_image(
            self.FILENAME, 'exploration', self.EXPLORATION_ID,
            original_image_content, 'image', True)
        self.assertTrue(fs.isfile('image/%s' % self.FILENAME))
        self.assertTrue(fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertTrue(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

    def test_skip_upload_if_image_already_exists(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            original_image_content = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID)

        # Save the image for the first time.
        fs_services.save_original_and_compressed_versions_of_image(
            self.FILENAME, 'exploration', self.EXPLORATION_ID,
            original_image_content, 'image', True)

        # Ensure the image is saved.
        self.assertTrue(fs.isfile('image/%s' % self.FILENAME))

        # Get the content of the saved image.
        saved_image_content = fs.get('image/%s' % self.FILENAME)

        # Here we use object because we need a generic base class
        # that can accommodate any type of object,
        # regardless of its specific implementation.
        with mock.patch.object(fs, 'commit') as mock_commit:
            # Save the image again (should be skipped due to existence).
            fs_services.save_original_and_compressed_versions_of_image(
                self.FILENAME, 'exploration', self.EXPLORATION_ID,
                original_image_content, 'image', True)

            # Assert that fs.commit was not called.
            mock_commit.assert_not_called()

        # Get the content of the image after attempting the second save.
        new_saved_image_content = fs.get('image/%s' % self.FILENAME)

        # Check that the content of the image remains the same after the second
        # save attempt.
        self.assertEqual(saved_image_content, new_saved_image_content)

    def test_validate_and_save_image(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            original_image_content = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID)
        self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
        self.assertFalse(fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))
        fs_services.validate_and_save_image(
            original_image_content, self.FILENAME, 'image', 'exploration',
            self.EXPLORATION_ID)
        self.assertTrue(fs.isfile('image/%s' % self.FILENAME))
        self.assertTrue(fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertTrue(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

    def test_compress_image_on_prod_mode_with_small_image_size(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            original_image_content = f.read()

        with self.swap(constants, 'DEV_MODE', False):
            fs = fs_services.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID)

            self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
            self.assertFalse(
                fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
            self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

            fs_services.save_original_and_compressed_versions_of_image(
                self.FILENAME, 'exploration', self.EXPLORATION_ID,
                original_image_content, 'image', True)

            self.assertTrue(fs.isfile('image/%s' % self.FILENAME))
            self.assertTrue(
                fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
            self.assertTrue(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

            original_image_content = fs.get(
                'image/%s' % self.FILENAME)
            compressed_image_content = fs.get(
                'image/%s' % self.COMPRESSED_IMAGE_FILENAME)
            micro_image_content = fs.get(
                'image/%s' % self.MICRO_IMAGE_FILENAME)

            self.assertEqual(
                image_services.get_image_dimensions(
                    original_image_content),
                (32, 32))
            self.assertEqual(
                image_services.get_image_dimensions(
                    compressed_image_content),
                (25, 25))
            self.assertEqual(
                image_services.get_image_dimensions(
                    micro_image_content),
                (22, 22))

    def test_save_original_and_compressed_versions_of_svg_image(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            image_content = f.read()

        with self.swap(constants, 'DEV_MODE', False):
            fs = fs_services.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID)

            self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
            self.assertFalse(
                fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
            self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

            fs_services.save_original_and_compressed_versions_of_image(
                self.FILENAME, 'exploration', self.EXPLORATION_ID,
                image_content, 'image', False)

            self.assertTrue(fs.isfile('image/%s' % self.FILENAME))
            self.assertTrue(
                fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
            self.assertTrue(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

            original_image_content = fs.get(
                'image/%s' % self.FILENAME)
            compressed_image_content = fs.get(
                'image/%s' % self.COMPRESSED_IMAGE_FILENAME)
            micro_image_content = fs.get(
                'image/%s' % self.MICRO_IMAGE_FILENAME)

            self.assertEqual(original_image_content, image_content)
            self.assertEqual(compressed_image_content, image_content)
            self.assertEqual(micro_image_content, image_content)

    def test_copy_images(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            original_image_content = f.read()
        fs_services.save_original_and_compressed_versions_of_image(
            self.FILENAME, 'exploration', self.EXPLORATION_ID,
            original_image_content, 'image', True)
        destination_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_QUESTION, 'question_id1')
        self.assertFalse(destination_fs.isfile('image/%s' % self.FILENAME))
        self.assertFalse(
            destination_fs.isfile(
                'image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertFalse(
            destination_fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))
        fs_services.copy_images(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID,
            feconf.ENTITY_TYPE_QUESTION, 'question_id1', ['image.png'])
        self.assertTrue(destination_fs.isfile('image/%s' % self.FILENAME))
        self.assertTrue(
            destination_fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertTrue(
            destination_fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))


class GetStaticAssetUrlTests(test_utils.GenericTestBase):
    """Unit tests for get_static_asset_url."""

    def test_function_returns_correct_url_for_emulator_mode(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', True):
            self.assertEqual(
                fs_services.get_static_asset_url('robots.txt'),
                'http://localhost:8181/assetsstatic/robots.txt'
            )

    def test_function_returns_correct_url_for_non_emulator_mode(self) -> None:
        with self.swap(constants, 'EMULATOR_MODE', False):
            with self.swap(feconf, 'OPPIA_PROJECT_ID', 'project-id'):
                self.assertEqual(
                    fs_services.get_static_asset_url('test/image.png'),
                    'https://storage.googleapis.com/project-id-static/'
                    'test/image.png'
                )
