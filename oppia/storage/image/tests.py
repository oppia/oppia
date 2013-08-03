# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Jeremy Emerson'

import os

import feconf
from oppia.platform import models
(image_models,) = models.Registry.import_models([models.NAMES.image])
import test_utils

from google.appengine.ext import db


class ImageUnitTests(test_utils.AppEngineTestBase):
    """Test image models."""

    def test_image_class(self):
        """Test the Image class."""
        # An Image must have the 'raw' property set.
        image = image_models.Image(id='The hash id')
        with self.assertRaises(db.BadValueError):
            image.put()

        # The 'raw' property must be a valid image.
        with self.assertRaises(AssertionError):
            image.raw = 'The image'

        # Set the 'raw' property to be a valid image, then do a put().
        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            image_file = f.read()
        image.raw = image_file
        image.put()

        # Retrieve the image.
        retrieved_image = image_models.Image.get_by_id('The hash id')
        self.assertEqual(retrieved_image.raw, image_file)
