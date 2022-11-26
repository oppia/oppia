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

from __future__ import annotations

from typing import Dict, List


class TakeoutData:
    """Domain object for all information exported as part of Takeout."""

    def __init__(
        self,
        user_data: Dict[str, Dict[str, str]],
        user_images: List[TakeoutImage]
    ) -> None:
        """Constructs a TakeoutData domain object.

        Args:
            user_data: dict. The user's Takeout data stored as a dictionary. The
                dictionary is constructed via takeout_service.py, and the format
                of the dictionary's contents can be found there.
            user_images: list(TakeoutImage). A list of TakeoutImage objects
                representing the user's images.
        """
        self.user_data = user_data
        self.user_images = user_images


class TakeoutImage:
    """Domain object for storing Base64 image data and the Takeout export path
    for a single image.
    """

    def __init__(
        self, b64_image_data: str, image_export_path: str
    ) -> None:
        """Constructs a TakeoutImage domain object.

        Args:
            b64_image_data: str. A Base64-encoded string representing the image.
            image_export_path: str. The path within the images/ folder to write
                image to in the final Takeout zip.
        """
        self.b64_image_data = b64_image_data
        self.image_export_path = image_export_path
