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

from __future__ import annotations

import io
import os
import re

from core import feconf
from core import utils
from core.domain import image_services
from core.tests import test_utils

from PIL import Image
from PIL import ImageChops


class ImageServicesUnitTests(test_utils.GenericTestBase):
    """Tests for image_services."""

    TEST_IMAGE_WIDTH = 3000
    TEST_IMAGE_HEIGHT = 2092

    def setUp(self) -> None:
        super().setUp()
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'dummy_large_image.jpg'),
            'rb', encoding=None) as f:
            self.jpeg_raw_image = f.read()
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None) as f:
            self.png_raw_image = f.read()

    def test_image_dimensions_are_output_correctly(self) -> None:
        height, width = (
            image_services.get_image_dimensions(self.jpeg_raw_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH, width)

    def test_compress_image_returns_correct_dimensions(self) -> None:
        compressed_image = (
            image_services.compress_image(self.jpeg_raw_image, 0.5))
        height, width = (
            image_services.get_image_dimensions(compressed_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT * 0.5, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH * 0.5, width)

    def test_invalid_scaling_factor_triggers_value_error(self) -> None:
        value_exception = self.assertRaisesRegex(
            ValueError,
            re.escape(
                'Scaling factor should be in the interval (0, 1], '
                'received 1.100000.'))
        with value_exception:
            image_services.compress_image(self.jpeg_raw_image, 1.1)

        value_exception = self.assertRaisesRegex(
            ValueError,
            re.escape(
                'Scaling factor should be in the interval (0, 1], '
                'received 0.000000.'))
        with value_exception:
            image_services.compress_image(self.jpeg_raw_image, 0)

        value_exception = self.assertRaisesRegex(
            ValueError,
            re.escape(
                'Scaling factor should be in the interval (0, 1], '
                'received -1.000000.'))
        with value_exception:
            image_services.compress_image(self.jpeg_raw_image, -1)

    def test_compression_results_in_correct_format(self) -> None:
        compressed_image = (
            image_services.compress_image(self.jpeg_raw_image, 0.7))
        pil_image = Image.open(io.BytesIO(compressed_image))
        self.assertEqual(pil_image.format, 'JPEG')

        compressed_image = (
            image_services.compress_image(self.png_raw_image, 0.7))
        pil_image = Image.open(io.BytesIO(compressed_image))
        self.assertEqual(pil_image.format, 'PNG')

    def test_compression_results_in_identical_files(self) -> None:
        with utils.open_file(
            os.path.join(
                feconf.TESTS_DATA_DIR, 'compressed_image.jpg'),
            'rb', encoding=None) as f:
            correct_compressed_image = f.read()
        correct_height, correct_width = (
            image_services.get_image_dimensions(correct_compressed_image))
        compressed_image = (
            image_services.compress_image(self.jpeg_raw_image, 0.5))

        # In order to make sure the images are the same, the function needs to
        # open and save the image specifically using PIL since the "golden
        # image" (image that we compare the compressed image to) is saved using
        # PIL. This applies a slight quality change that won't appear unless we
        # save it using PIL.
        temp_image = Image.open(io.BytesIO(compressed_image))
        image_format = temp_image.format
        with io.BytesIO() as output:
            temp_image.save(output, format=image_format)
            compressed_image_content = output.getvalue()
        height, width = image_services.get_image_dimensions(
            compressed_image_content)
        self.assertEqual(correct_height, height)
        self.assertEqual(correct_width, width)

        image1 = Image.open(io.BytesIO(correct_compressed_image)).convert('RGB')
        image2 = Image.open(io.BytesIO(compressed_image_content)).convert('RGB')
        diff = ImageChops.difference(image1, image2)

        # Function diff.getbbox() returns a bounding box on all islands or
        # regions of non-zero pixels. In other words, if we have a bounding
        # box, there will be areas that are not 0 in the difference meaning
        # that the 2 images are not equal.
        self.assertFalse(diff.getbbox())
