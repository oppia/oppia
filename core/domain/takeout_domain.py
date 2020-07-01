# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

"""Domain objects for Takeout."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

class TakeoutExport:
    """Domain object for all information exported as part of Takeout."""

    def __init__(self, user_data, user_images):
        self.user_data = user_data
        self.user_images = user_images
        
class TakeoutImage:
    """Domain object for storing image data exported as part of Takeout."""

    def __init__(self, b64_image_data, image_export_path):
        self.b64_image_data = b64_image_data
        self.image_export_path = image_export_path
