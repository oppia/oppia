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

import json
import os

from core import feconf
from core import python_utils
from core import utils
from core.constants import constants
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import image_services
from core.domain import user_services
from core.tests import test_utils
from proto_files import text_classifier_pb2


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
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        self.admin = user_services.get_user_actions_info(self.user_id_admin)

    def test_save_original_and_compressed_versions_of_image(self):
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            original_image_content = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXPLORATION_ID))
        self.assertFalse(fs.isfile('image/%s' % self.FILENAME))
        self.assertFalse(fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertFalse(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))
        fs_services.save_original_and_compressed_versions_of_image(
            self.FILENAME, 'exploration', self.EXPLORATION_ID,
            original_image_content, 'image', True)
        self.assertTrue(fs.isfile('image/%s' % self.FILENAME))
        self.assertTrue(fs.isfile('image/%s' % self.COMPRESSED_IMAGE_FILENAME))
        self.assertTrue(fs.isfile('image/%s' % self.MICRO_IMAGE_FILENAME))

    def test_compress_image_on_prod_mode_with_small_image_size(self):
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
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

    def test_save_original_and_compressed_versions_of_svg_image(self):
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            image_content = f.read()

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

    def test_copy_images(self):
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            original_image_content = f.read()
        fs_services.save_original_and_compressed_versions_of_image(
            self.FILENAME, 'exploration', self.EXPLORATION_ID,
            original_image_content, 'image', True)
        destination_fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_QUESTION, 'question_id1'))
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


class FileSystemClassifierDataTests(test_utils.GenericTestBase):
    """Unit tests for storing, reading and deleting classifier data."""

    def setUp(self):
        super().setUp()
        self.fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id'))
        self.classifier_data_proto = (
            text_classifier_pb2.TextClassifierFrozenModel())
        self.classifier_data_proto.model_json = json.dumps({
            'param1': 40,
            'param2': [34.2, 54.13, 95.23],
            'submodel': {
                'param1': 12
            }
        })

    def test_save_and_get_classifier_data(self):
        """Test that classifier data is stored and retrieved correctly."""
        fs_services.save_classifier_data(
            'exp_id', 'job_id', self.classifier_data_proto)
        filepath = 'job_id-classifier-data.pb.xz'
        file_system_class = fs_services.get_entity_file_system_class()
        fs = fs_domain.AbstractFileSystem(file_system_class(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id'))
        classifier_data = utils.decompress_from_zlib(fs.get(filepath))
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.ParseFromString(classifier_data)
        self.assertEqual(
            classifier_data_proto.model_json,
            self.classifier_data_proto.model_json)

    def test_remove_classifier_data(self):
        """Test that classifier data is removed upon deletion."""
        fs_services.save_classifier_data(
            'exp_id', 'job_id', self.classifier_data_proto)
        self.assertTrue(self.fs.isfile('job_id-classifier-data.pb.xz'))
        fs_services.delete_classifier_data('exp_id', 'job_id')
        self.assertFalse(self.fs.isfile('job_id-classifier-data.pb.xz'))
