# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Provides app identity services."""

import cStringIO
import urllib
import feconf

from PIL import Image

from core.domain import filepath_domain
from core.platform import models

app_identity_services = models.Registry.import_app_identity_services()

def get_image_filepath_object(filename, exp_id):
    """Gets the filepath object of the image with the given filename

    Args:
        filename: str. Name of the file whose dimensions need to be
            calculated.
        exp_id: str. Exploration id.

    Returns:
        object. filepath object of the image.
    """
    url = ('https://storage.googleapis.com/%s/%s/assets/image/%s' % (
        app_identity_services.get_gcs_resource_bucket_name(), exp_id,
        filename)) if not feconf.DEV_MODE else (
            'http://localhost:8181/imagehandler/%s/%s' % (
                exp_id, filename))
    print url
    imageFile = cStringIO.StringIO(urllib.urlopen(url).read())
    img = Image.open(imageFile)
    width, height = img.size
    filepath = filepath_domain.Filepath(
        filename, height=height, width=width)
    return filepath.to_dict()
