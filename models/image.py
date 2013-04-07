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

"""Models relating to images."""

__author__ = 'Sean Lip'

import imghdr

from base_model import BaseModel
import feconf

from google.appengine.ext import ndb


class ImageProperty(ndb.BlobProperty):
    """An image property."""

    def _validate(self, value):
        """Check that the image is in one of the accepted formats."""
        is_valid = imghdr.what(None, h=value) in feconf.ACCEPTED_IMAGE_FORMATS
        allowed_formats = ', '.join(feconf.ACCEPTED_IMAGE_FORMATS)
        error_message = ('Image file not recognized: it should be in one of '
                         'the following formats: %s.' % allowed_formats)
        assert is_valid, error_message


class Image(BaseModel):
    """An image."""
    # The raw image blob.
    raw = ImageProperty(required=True)
    # Alt text.
    alt_text = ndb.TextProperty()
    # The image file format. TODO(sll): auto-assign on put().
    format = ndb.StringProperty(
        choices=feconf.ACCEPTED_IMAGE_FORMATS, default='png')

    @classmethod
    def create(cls, raw, alt_text=''):
        """Creates a new Image object and returns its id."""
        image_id = cls.get_new_id(alt_text)
        format = imghdr.what(None, h=raw)
        image_entity = cls(id=image_id, raw=raw, format=format)
        image_entity.put()
        return image_entity.id
