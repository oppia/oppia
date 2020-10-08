# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for the image validation service."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.domain import image_validation_services
from core.tests import test_utils

import feconf
import python_utils
import utils


class ImageValidationServiceTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ImageValidationServiceTests, self).setUp()
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None) as f:
            self.raw_image = f.read()

    def _assert_validation_error(
            self, image, filename, expected_error_substring):
        """Checks that the image passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            image_validation_services.validate_image_and_filename(
                image, filename)

    def test_image_validation_checks(self):
        self._assert_validation_error(None, 'image.png', 'No image supplied')
        self._assert_validation_error(
            self.raw_image, None, 'No filename supplied')

        large_image = '<svg><path d="%s" /></svg>' % (
            'M150 0 L75 200 L225 200 Z ' * 4000)
        self._assert_validation_error(
            large_image, 'image.svg', 'Image exceeds file size limit of 100 KB')

        invalid_svg = '<badsvg></badsvg>'
        self._assert_validation_error(
            invalid_svg, 'image.svg',
            'Unsupported tags/attributes found in the SVG')

        no_xmlns_attribute_svg = invalid_svg = '<svg></svg>'
        self._assert_validation_error(
            no_xmlns_attribute_svg, 'image.svg',
            'The svg tag does not contains the \'xmlns\' attribute.')

        self._assert_validation_error(
            'not an image', 'image.png', 'Image not recognized')

        self._assert_validation_error(
            self.raw_image, '.png', 'Invalid filename')
        self._assert_validation_error(
            self.raw_image, 'image/image.png',
            'Filenames should not include slashes')
        self._assert_validation_error(
            self.raw_image, 'image', 'Image filename with no extension')
        self._assert_validation_error(
            self.raw_image, 'image.pdf', 'Expected a filename ending in .png')
