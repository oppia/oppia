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

"""Domain object for Fileinfo object of an image."""


class Fileinfo(object):
    """Domain object for image Fileinfo.

    Attributes:
        filename: str. Name of the image file.
        height: int. Height of the image.
        width: int. Width of the image.
    """

    def __init__(self, filename, height=0, width=0):
        """Constructs Fileinfo domain object.

        Args:
        filename: str. Name of the image file.
        height: int. Height of the image.
        width: int. Width of the image.
        """
        self.filename = filename
        self.height = height
        self.width = width

    def to_dict(self):
        """Returns a dict representing Fileinfo domain object.

        Returns:
            A dict, containing filename, height and width of an image.
        """
        return {
            'filename': self.filename,
            'height': self.height,
            'width': self.width
        }
