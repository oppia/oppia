
# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for html objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils
import utils


class LatexStringSvgImageDimensions(python_utils.OBJECT):
    """Value object representing the information related to the SVG file's
    dimensions.

    TODO(#10045): Remove this function once all the math-rich text components in
    explorations have a valid math SVG stored in the datastore.
    """

    def __init__(
            self, encoded_height_string, encoded_width_string,
            encoded_vertical_padding_string):
        """Initializes an LatexStringSvgImageDimensions domain object.

        Args:
            encoded_height_string: str. The string from which the actual height
                can be derived. The actual height for math SVGs are in units ex.
                For example: If the actual height of the SVG is '1.234ex', then
                the encoded_height_string will  be '1d234'.We have replaced the
                decimal point with an alphabet because this string will be used
                in generating the filename for the SVGs.
            encoded_width_string: str. The string from which the actual width
                can be derived. The actual width for math SVGs are in units ex.
            encoded_vertical_padding_string: str. The string from which the
                actual vertical padding can be derived. The vertical padding is
                required for vertical allignment of the SVGs when displayed
                inline. The actual vertical padding for math SVGs are in units
                ex.
        """
        self.encoded_height_string = encoded_height_string
        self.encoded_width_string = encoded_width_string
        self.encoded_vertical_padding_string = encoded_vertical_padding_string
        self.validate()

    def to_dict(self):
        """Returns a dict representing this LatexStringSvgImageDimensions domain
        object.

        Returns:
            dict. A dict, mapping all fields of LatexStringSvgImageDimensions
            instance.
        """
        return {
            'encoded_height_string': self.encoded_height_string,
            'encoded_width_string': self.encoded_width_string,
            'encoded_vertical_padding_string': (
                self.encoded_vertical_padding_string)
        }

    def validate(self):
        """Validates properties of the LatexStringSvgImageDimensions.

        Raises:
            ValidationError. Attributes of the LatexStringSvgImageDimensions
                are invalid.
        """

        if not isinstance(self.encoded_height_string, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected encoded_height_string to be a str, received %s' % (
                    self.encoded_height_string))

        if not isinstance(self.encoded_width_string, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected encoded_width_string to be a str, received %s' % (
                    self.encoded_width_string))

        if not isinstance(
                self.encoded_vertical_padding_string, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected encoded_vertical_padding_string to be a str, recei'
                'ved %s' % self.encoded_vertical_padding_string)


class LatexStringSvgImageData(python_utils.OBJECT):
    """Value object representing all the information related to the SVG file
    for a LaTeX string.

    TODO(#10045): Remove this function once all the math-rich text components in
    explorations have a valid math SVG stored in the datastore.
    """

    def __init__(
            self, raw_image, latex_string_svg_image_dimensions):
        """Initializes an LatexStringSvgImageData domain object.

        Args:
            raw_image: str. SVG image content for the LaTeX string.
            latex_string_svg_image_dimensions: LatexStringSvgImageDimensions.
                The dimensions for the SVG image.
        """

        self.raw_image = raw_image
        self.latex_string_svg_image_dimensions = (
            latex_string_svg_image_dimensions)
        self.validate()

    def to_dict(self):
        """Returns a dict representing this LatexStringSvgImageData domain
        object.

        Returns:
            dict. A dict, mapping all fields of LatexStringSvgImageData
            instance.
        """
        return {
            'raw_image': self.raw_image,
            'latex_string_svg_image_dimensions': (
                self.latex_string_svg_image_dimensions.to_dict())
        }

    def validate(self):
        """Validates properties of the LatexStringSvgImageData.

        Raises:
            ValidationError. Attributes of the LatexStringSvgImageData
                are invalid.
        """
        if not isinstance(self.raw_image, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected raw_image to be a str, received %s' % self.raw_image)
