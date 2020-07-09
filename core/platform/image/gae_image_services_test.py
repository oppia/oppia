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

"""Tests for methods in the gae_memcache_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from constants import constants
from core.platform.image import gae_image_services
from core.tests import test_utils
import feconf
import python_utils


class GaeImageServicesUnitTests(test_utils.GenericTestBase):
    """Tests for gae_memcache_services."""

    TEST_IMAGE_WIDTH = 3000
    TEST_IMAGE_HEIGHT = 2092

    def setUp(self):
        super(GaeImageServicesUnitTests, self).setUp()
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'dummyLargeImage.jpg'),
            mode='rb', encoding=None) as f:
            self.raw_image = f.read()

    def test_get_image_dimensions(self):
        compressed_image = (
            gae_image_services.compress_image(self.raw_image, 0.5))
        height, width = (
            gae_image_services.get_image_dimensions(compressed_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH, width)

    def test_dev_mode(self):
        height, width = gae_image_services.get_image_dimensions(self.raw_image)
        self.assertEqual(self.TEST_IMAGE_HEIGHT, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH, width)

    def test_compress_image(self):
        with self.swap(constants, 'DEV_MODE', False):
            compressed_image = (
                gae_image_services.compress_image(self.raw_image, 0.5))
        height, width = (
            gae_image_services.get_image_dimensions(compressed_image))
        self.assertEqual(self.TEST_IMAGE_HEIGHT * 0.5, height)
        self.assertEqual(self.TEST_IMAGE_WIDTH * 0.5, width)

    def test_large_decompress_image(self):
        # This test tests the use case where the method causes the dimensions to
        # go above 4000 pixels on either dimension.

        with self.swap(constants, 'DEV_MODE', False):
            compressed_image = (
                gae_image_services.compress_image(self.raw_image, 2))
        height, width = (
            gae_image_services.get_image_dimensions(compressed_image))
        # When any of the dimensions goes above 4000, the largest dimension is
        # scaled down to 4000 and the other one is scaled so the ratio is the
        # same.
        correct_scaled_height = int(
            python_utils.divide(4000.0, self.TEST_IMAGE_WIDTH) *
            self.TEST_IMAGE_HEIGHT)
        correct_scaled_width = 4000
        self.assertEqual(correct_scaled_height, height)
        self.assertEqual(correct_scaled_width, width)
