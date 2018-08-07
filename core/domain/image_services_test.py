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
import os

from core.domain import fs_domain
from core.domain import image_services
from core.tests import test_utils
import feconf


class ImageServicesTests(test_utils.GenericTestBase):
    """Test for functions in image_services."""

    EXP_ID = 'exp_id'
    FILENAME = 'image.png'
    COMPRESSED_IMAGE_FILENAME = 'image_compressed.png'
    MICRO_IMAGE_FILENAME = 'image_micro.png'
    USER = 'ADMIN'

    def test_create_compressed_versions_of_image(self):
        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            original_image_content = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(self.EXP_ID))
        self.assertEqual(fs.isfile(self.FILENAME), False)
        self.assertEqual(fs.isfile(self.COMPRESSED_IMAGE_FILENAME), False)
        self.assertEqual(fs.isfile(self.MICRO_IMAGE_FILENAME), False)
        image_services.create_compressed_versions_of_image(
            self.USER, self.FILENAME, self.EXP_ID, original_image_content)
        self.assertEqual(fs.isfile(self.FILENAME), True)
        self.assertEqual(fs.isfile(self.COMPRESSED_IMAGE_FILENAME), True)
        self.assertEqual(fs.isfile(self.MICRO_IMAGE_FILENAME), True)
