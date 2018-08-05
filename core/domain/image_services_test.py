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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the image service."""

from core.domain import fs_domain
from core.domain import image_services
from core.platform import models
from core.tests import test_utils


class ImageServicesTests(test_utils.GenericTestBase):
    """Test functions in image_services."""

    EXP_ID = 'exp_id'
    FILENAME = 'image.png'
    COMPRESSED_IMAGE_FILENAME = 'image_compressed.png'
    MICRO_IMAGE_FILENAME = 'image_micro.png'
    USER = 'ADMIN'
    def test_get_image_dimensions(self):
        content = ''
        fs = fs_domain.AbstractFileSystem(ExplorationFileSystem(self.EXP_ID))
        fs.commit(
            self.USER, self.FILENAME,
            content, mimetype='image/png')
        height, width = image_services.get_image_dimensions(filename, self.EXP_ID)
        self.assertIsInstance(height, int)
        self.assertIsInstance(width, int)

    def test_create_compressed_versions_of_image(self):
        content = ''
        fs = fs_domain.AbstractFileSystem(ExplorationFileSystem(self.EXP_ID))
        fs.commit(
            self.USER, self.FILENAME,
            content, mimetype='image/png')
        image_services.create_compressed_versions_of_image(
            self.FILENAME ,self.EXP_ID)
        self.assertEqual(fs.isfile(self.COMPRESSED_IMAGE_FILENAME), True)
        self.assertEqual(fs.isfile(self.MICRO_IMAGE_FILENAME), True)
