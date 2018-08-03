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

import feconf

from PIL import Image

from core.domain import fs_domain
from core.platform import models

app_identity_services = models.Registry.import_app_identity_services()

def get_image_dimensions(filename, exp_id):
    """Gets the dimensions of the image with the given filename

    Args:
        filename: str. Name of the file whose dimensions need to be
            calculated.
        exp_id: str. Exploration id.

    Returns:
        tuple. Returns height and width of the image.
    """
    file_system_class = (
        fs_domain.ExplorationFileSystem if (
            feconf.DEV_MODE)
        else fs_domain.GcsFileSystem)
    fs = fs_domain.AbstractFileSystem(file_system_class(exploration_id))

    imageFile = fs.getImageFile(filename)
    img = Image.open(imageFile)
    width, height = img.size
    return height, width
