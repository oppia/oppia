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
from google.appengine.ext import blobstore
from google.appengine.api import images

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
    fs = fs_domain.AbstractFileSystem(file_system_class(exp_id))

    imageFile = fs.getImageFile(filename)
    img = Image.open(imageFile)
    width, height = img.size
    return height, width

def create_different_versions(filename, exp_id):
    """Creates two versions of the image by compressing the original image

    Args:
        filename: str. Name of the file whose dimensions need to be
            calculated.
        exp_id: str. Exploration id.

    Returns:
        
    """
    if not feconf.DEV_MODE:
        gcs_url = ('/gs/%s/%s/assets/image/%s' % (
                app_identity_services.get_gcs_resource_bucket_name(), exp_id,
                filename))
        blob_key = blobstore.create_gs_key(gcs_url)
        original_img = images.Image(blob_key=blob_key)
        org_height = original_img.height
        org_width = original_img.width
        
        filename_wo_filetype = filename[:filename.rfind('.')]
        filetype = filename[filename.rfind('.') + 1:]

        fs = fs_domain.AbstractFileSystem(fs_domain.GcsFileSystem(exp_id))
        content = fs.get_file_content(filename, exp_id)

        compressed_content = images.resize(
            image_data=content, width=org_width*8/10, height=org_height*8/10)
        fs.commit(
            'ADMIN', 'image/%s_compressed.%s' % (
                filename_wo_filetype, filetype),
            compressed_content, mimetype='image/%s' % filetype)

        micro_content = images.resize(
            image_data=content, width=org_width*7/10, height=org_height*7/10)
        fs.commit(
            'ADMIN', 'image/%s_micro.%s' % (
                filename_wo_filetype, filetype),
            micro_content, mimetype='image/%s' % filetype)
        
        
