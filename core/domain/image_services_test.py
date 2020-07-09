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

"""Tests for methods in the image_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import io
import os

from PIL import Image
from constants import constants
from core.domain import image_services
from core.tests import test_utils
import feconf
import python_utils


class ImageServicesUnitTests(test_utils.GenericTestBase):
    """Tests for image_services."""

    TEST_IMAGE_WIDTH = 3000
    TEST_IMAGE_HEIGHT = 2092

    def setUp(self):
        super(ImageServicesUnitTests, self).setUp()
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'dummyLargeImage.jpg'),
            mode='rb', encoding=None) as f:
            self.jpeg_raw_image = f.read()
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            mode='rb', encoding=None) as f:
            self.png_raw_image = f.read()

    def test_image_dimensions_outputs_correctly(self):
        height, width = (
            image_services.get_image_dimensions(self.jpeg_raw_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH, width)

    def test_dev_mode_returns_regular_image(self):
        compressed_image = (image_services.compress_image(
            self.jpeg_raw_image, 0.8))
        height, width = (
            image_services.get_image_dimensions(compressed_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH, width)

    def test_compress_image_returns_correct_dimensions(self):
        with self.swap(constants, 'DEV_MODE', False):
            compressed_image = (
                image_services.compress_image(self.jpeg_raw_image, 0.5))
        height, width = (
            image_services.get_image_dimensions(compressed_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT * 0.5, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH * 0.5, width)

    def test_invalid_scaling_factor_triggers_value_error(self):
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Scaling factor should be less than 1.')
        with self.swap(constants, 'DEV_MODE', False), email_exception:
            image_services.compress_image(self.jpeg_raw_image, 1.1)

    def test_compression_results_in_correct_format(self):
        with self.swap(constants, 'DEV_MODE', False):
            compressed_image = (
                image_services.compress_image(self.jpeg_raw_image, 0.7))
        pil_image = Image.open(io.BytesIO(compressed_image))
        self.assertEqual(pil_image.format, 'JPEG')
        with self.swap(constants, 'DEV_MODE', False):
            compressed_image = (
                image_services.compress_image(self.png_raw_image, 0.7))
        pil_image = Image.open(io.BytesIO(compressed_image))
        self.assertEqual(pil_image.format, 'PNG')

    def test_compression_results_in_identical_files(self):
        def is_different(file1, file2):
            """Checks the differences between the two images and returns if they
            are different.

            Args:
                file1: str. Content of first image.
                file2: str. Content of second image.

            Returns:
                bool. Returns whether the images are different.
            """
            from PIL import ImageChops
            image1 = Image.open(io.BytesIO(file1)).convert('RGB')
            image2 = Image.open(io.BytesIO(file2)).convert('RGB')
            diff = ImageChops.difference(image1, image2)

            if diff.getbbox():
                return False
            else:
                return True

        with python_utils.open_file(
            os.path.join(
                feconf.TESTS_DATA_DIR, 'compressed_image.jpg'),
            mode='rb', encoding=None) as f:
            correct_compressed_image = f.read()
        correct_height, correct_width = (
            image_services.get_image_dimensions(correct_compressed_image))
        with self.swap(constants, 'DEV_MODE', False):
            compressed_image = (
                image_services.compress_image(self.jpeg_raw_image, 0.5))
        height, width = image_services.get_image_dimensions(
            compressed_image)
        self.assertEqual(correct_height, height)
        self.assertEqual(correct_width, width)
        self.assertFalse(is_different(compressed_image,
                                      correct_compressed_image))
