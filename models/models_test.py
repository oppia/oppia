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

import test_utils

from exploration import Exploration
from models import GenericWidget
from models import Image
from models import Widget

from google.appengine.ext import ndb
from google.appengine.ext.db import BadValueError


class ModelsUnitTests(test_utils.AppEngineTestBase):
    """Test models."""

    def test_image_class(self):
        """Test the Image class."""
        image_entity = Image(id='The hash id')
        with self.assertRaises(BadValueError):
            image_entity.put()
        image_entity.image = 'The image'
        image_entity.put()

        retrieved_entity = Image.get_by_id('The hash id')
        self.assertEquals(retrieved_entity.image, 'The image')

    def test_widget_class(self):
        """Test the Widget class."""

        o = Widget(id='The hash id')
        o.raw = 'Some code here'
        self.assertEqual(o.id, 'The hash id')
        self.assertEqual(o.raw, 'Some code here')

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
