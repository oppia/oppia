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

from models import GenericWidget
from models import Image
from models import Widget
import test_utils

from google.appengine.ext.db import BadValueError


class ModelsUnitTests(test_utils.AppEngineTestBase):
    """Test models."""

    def test_image_class(self):
        """Test the Image class."""
        # An Image must have the 'raw' property set.
        image = Image(id='The hash id')
        with self.assertRaises(BadValueError):
            image.put()

        # The 'raw' property must be a valid image.
        with self.assertRaises(AssertionError):
            image.raw = 'The image'

        # Set the 'raw' property to be a valid image, then do a put().
        with open('tests/data/img.png') as f:
            image_file = f.read()
        image.raw = image_file
        image.put()

        # Retrieve the image.
        retrieved_image = Image.get_by_id('The hash id')
        self.assertEqual(retrieved_image.raw, image_file)

    def test_widget_class(self):
        """Test the Widget class."""
        # A Widget must have the 'raw' property set.
        widget = Widget(id='The hash id')
        with self.assertRaises(BadValueError):
            widget.put()

        # Set the 'raw' property to be a valid string, then do a put().
        widget.raw = 'Some code here'
        widget.put()

        # Retrieve the widget.
        retrieved_widget = Widget.get_by_id('The hash id')
        self.assertEqual(retrieved_widget.raw, 'Some code here')

    def test_generic_widget_class(self):
        """Test the GenericWidget class."""
        o = GenericWidget(id='The hash id')
        o.name = 'The name'
        o.category = 'The category'
        o.description = 'The description'
        o.raw = 'Some code here'
        o.params = ['Some JsonProperties here']
        self.assertEqual(o.id, 'The hash id')
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.category, 'The category')
        self.assertEqual(o.description, 'The description')
        self.assertEqual(o.raw, 'Some code here')
        self.assertEqual(o.params, ['Some JsonProperties here'])
