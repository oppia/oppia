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

"""Service for managing operations on images."""

from core.domain import exp_services
from core.platform import models

gae_image_services = models.Registry.import_gae_image_services()


def create_compressed_versions_of_image(
        user_id, filename, exp_id, original_image_content):
    """Creates two compressed versions of the image by compressing the
    original image.

    Args:
        filename: str. The filename of the image.
        exp_id: str. ID of the exploration.
        original_image_content: str. Content of the image.
        user_id: str. The id of the user who wants to upload the image.
    """
    compressed_image_content = gae_image_services.compress_image(
        original_image_content, 0.8)
    micro_image_content = gae_image_services.compress_image(
        original_image_content, 0.7)

    exp_services.save_image_file(
        user_id, exp_id, filename, original_image_content,
        compressed_image_content, micro_image_content)
