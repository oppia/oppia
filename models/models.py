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

"""Models for Oppia."""

__author__ = 'Sean Lip'

import imghdr

import feconf
from base_model import BaseModel

from google.appengine.ext import ndb


class ImageProperty(ndb.BlobProperty):
    """An image property that validates that the image is valid."""
    def _validate(self, value):
        is_valid = imghdr.what(None, h=value) in feconf.ACCEPTED_IMAGE_FORMATS
        allowed_formats = ', '.join(feconf.ACCEPTED_IMAGE_FORMATS)
        error_message = ('Image file not recognized: it should be in one of '
                         'the following formats: %s.' % allowed_formats)
        assert is_valid, error_message


class Image(BaseModel):
    """An image."""
    # The raw image blob.
    raw = ImageProperty(required=True)


class Widget(BaseModel):
    """A specific HTML/JS/CSS widget."""
    # The raw widget code.
    raw = ndb.TextProperty(required=True)


class GenericWidget(BaseModel):
    """A generic, reusable widget that is part of the widget repo."""
    # The name of the generic widget.
    name = ndb.StringProperty(required=True)
    # The category to which this widget belongs.
    category = ndb.StringProperty(required=True)
    # The description of the generic widget.
    description = ndb.TextProperty()
    # The raw code for the generic widget.
    raw = ndb.TextProperty(required=True)
    # Parameter names, definitions, types and default arguments for this widget.
    params = ndb.JsonProperty(repeated=True)
