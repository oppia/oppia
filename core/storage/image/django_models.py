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

import core.storage.base_model.models as base_models
import feconf

from django.db import models
import caching.base
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


class Image(caching.base.CachingMixin, base_models.BaseModel):
    """An image."""
    # The raw image blob.
    raw = models.ImageField(upload_to='uploads/images')
    alt_text = models.TextField(max_length=200, blank=True)
    # The image file format. TODO(sll): auto-assign on put().
    format = models.CharField(
        max_length=10, choices=zip(
            feconf.ACCEPTED_IMAGE_FORMATS, feconf.ACCEPTED_IMAGE_FORMATS
        ), default='png')

    def _pre_put_hook(self):
        """Check that the image is in one of the accepted formats."""
        try:
            with open(self.raw.path) as f:
                value = f.read()
        except (ValueError, IOError):
            raise self.ModelValidationError("raw property is not valid file.")
        is_valid = imghdr.what(None, h=value) in feconf.ACCEPTED_IMAGE_FORMATS
        allowed_formats = ', '.join(feconf.ACCEPTED_IMAGE_FORMATS)
        error_message = ('Image file not recognized: it should be in one of '
                         'the following formats: %s.' % allowed_formats)
        if not is_valid:
            raise self.ModelValidationError(error_message)

    @classmethod
    def create(cls, raw, alt_text=''):
        """Creates a new Image object and returns its id."""
        image_id = cls.get_new_id(alt_text)
        file_path = default_storage.save('uploads/images/temp', ContentFile(raw))
        format = imghdr.what(file_path)
        image_entity = cls(id=image_id, raw=file_path, format=format)
        image_entity.put()
        return image_entity.id

    objects = caching.base.CachingManager()
