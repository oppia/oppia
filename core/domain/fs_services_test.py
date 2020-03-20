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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from constants import constants
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

gae_image_services = models.Registry.import_gae_image_services()


class FileSystemServicesTests(test_utils.GenericTestBase):
    """Tests for File System services."""

    def test_get_exploration_file_system_with_dev_mode_enabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            file_system = fs_services.get_entity_file_system_class()
            self.assertIsInstance(
                file_system(feconf.ENTITY_TYPE_EXPLORATION, 'entity_id'),
                fs_domain.GcsFileSystem)

    def test_get_exploration_file_system_with_dev_mode_disabled(self):
        with self.swap(constants, 'DEV_MODE', False):
            file_system = fs_services.get_entity_file_system_class()
            self.assertIsInstance(
                file_system(feconf.ENTITY_TYPE_EXPLORATION, 'entity_id'),
                fs_domain.GcsFileSystem)


class SaveOriginalAndCompressedVersionsOfImageTests(test_utils.GenericTestBase):
    """Test for saving the three versions of the image file."""

    EXPLORATION_ID = 'exp_id'
    FILENAME = 'image.png'
    COMPRESSED_IMAGE_FILENAME = 'image_compressed.png'
    MICRO_IMAGE_FILENAME = 'image_micro.png'
    USER = 'ADMIN'

    def setUp(self):
        super(SaveOriginalAndCompressedVersionsOfImageTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.admin = user_services.UserActionsInfo(self.user_id_admin)

    def test_save_original_and_compressed_versions_of_image(self):
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), mode='rb',
            encoding=None) as f:
            original_image_content = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID))
        self.assertEqual(fs.isfile('image/%s' % self.FILENAME), False)
        self.assertEqual(
            fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME), False)
        self.assertEqual(
            fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME), False)
        fs_services.save_original_and_compressed_versions_of_image(
            self.FILENAME, 'exploration', self.EXPLORATION_ID,
            original_image_content, 'image')
        self.assertEqual(fs.isfile('image/%s' % self.FILENAME), True)
        self.assertEqual(
            fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME), True)
        self.assertEqual(
            fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME), True)

    def test_compress_image_on_prod_mode_with_big_image_size(self):
        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        # This swap is done to make the image's dimensions greater than
        # MAX_RESIZE_DIMENSION_PX so that it can be treated as a big image.
        max_resize_dimension_px_swap = self.swap(
            gae_image_services, 'MAX_RESIZE_DIMENSION_PX', 20)
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), mode='rb',
            encoding=None) as f:
            original_image_content = f.read()

        # The scaling factor changes if the dimensions of the image is
        # greater than MAX_RESIZE_DIMENSION_PX.
        with prod_mode_swap, max_resize_dimension_px_swap:
            fs = fs_domain.AbstractFileSystem(
                fs_domain.GcsFileSystem(
                    feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID))

            self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
            self.assertFalse(
                fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
            self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

            fs_services.save_original_and_compressed_versions_of_image(
                self.FILENAME, 'exploration', self.EXPLORATION_ID,
                original_image_content, 'image')

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
                gae_image_services.get_image_dimensions(
                    original_image_content),
                (32, 32))
            self.assertEqual(
                gae_image_services.get_image_dimensions(
                    compressed_image_content),
                (20, 20))
            self.assertEqual(
                gae_image_services.get_image_dimensions(
                    micro_image_content),
                (20, 20))

    def test_compress_image_on_prod_mode_with_small_image_size(self):
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), mode='rb',
            encoding=None) as f:
            original_image_content = f.read()

        with self.swap(constants, 'DEV_MODE', False):
            fs = fs_domain.AbstractFileSystem(
                fs_domain.GcsFileSystem(
                    feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID))

            self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
            self.assertFalse(
                fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
            self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

            fs_services.save_original_and_compressed_versions_of_image(
                self.FILENAME, 'exploration', self.EXPLORATION_ID,
                original_image_content, 'image')

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
                gae_image_services.get_image_dimensions(
                    original_image_content),
                (32, 32))
            self.assertEqual(
                gae_image_services.get_image_dimensions(
                    compressed_image_content),
                (25, 25))
            self.assertEqual(
                gae_image_services.get_image_dimensions(
                    micro_image_content),
                (22, 22))


class FileSystemClassifierDataTests(test_utils.GenericTestBase):
    """Unit tests for storing, reading and deleting classifier data."""

    def setUp(self):
        super(FileSystemClassifierDataTests, self).setUp()
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id'))
        self.classifier_data = {
            'param1': 40,
            'param2': [34.2, 54.13, 95.23],
            'submodel': {
                'param1': 12
            }
        }

    def test_save_and_get_classifier_data(self):
        """Test that classifier data is stored and retrieved correctly."""
        fs_services.save_classifier_data(
            'exp_id', 'job_id', self.classifier_data)
        classifier_data = fs_services.read_classifier_data('exp_id', 'job_id')
        self.assertEqual(classifier_data, self.classifier_data)

    def test_remove_classifier_data(self):
        """Test that classifier data is removed upon deletion."""
        fs_services.save_classifier_data(
            'exp_id', 'job_id', self.classifier_data)
        self.assertTrue(self.fs.isfile('job_id-classifier-data.json'))
        fs_services.delete_classifier_data('exp_id', 'job_id')
        self.assertFalse(self.fs.isfile('job_id-classifier-data.json'))
