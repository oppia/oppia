
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

"""Tests for html domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import html_domain
import test_utils


class LatexStringSvgImageDimensionsTests(test_utils.GenericTestBase):

    def test_create_latex_string_svg_image_dimensions(self):
        latex_string_svg_image_dimensions = (
            html_domain.LatexStringSvgImageDimensions(
                '1d345', '2d345', '0d241'))

        self.assertEqual(
            latex_string_svg_image_dimensions.to_dict(), {
                'encoded_height_string': '1d345',
                'encoded_width_string': '2d345',
                'encoded_vertical_padding_string': '0d241'
            })

    def test_validate_when_encoded_height_string_not_string(self):
        with self.assertRaisesRegexp(
            Exception,
            'Expected encoded_height_string to be a str, received '
            '1'):
            html_domain.LatexStringSvgImageDimensions(
                1, '4d345', '0d124')

    def test_validate_when_encoded_width_string_not_string(self):
        with self.assertRaisesRegexp(
            Exception,
            'Expected encoded_width_string to be a str, received '
            '34'):
            html_domain.LatexStringSvgImageDimensions(
                '1d245', 34, '0d124')

    def test_validate_when_encoded_vertical_padding_string_not_string(self):
        with self.assertRaisesRegexp(
            Exception,
            'Expected encoded_vertical_padding_string to be a str, received '
            '0'):
            html_domain.LatexStringSvgImageDimensions(
                '1d245', '4d345', 0)



class LatexStringSvgImageDataTests(test_utils.GenericTestBase):

    def test_create_latex_string_svg_image_dimensions(self):
        latex_string_svg_image_dimensions = (
            html_domain.LatexStringSvgImageDimensions(
                '1d345', '2d345', '0d241'))

        raw_image = '<svg><path d="0" /></svg>'
        latex_string_svg_image_data = (
            html_domain.LatexStringSvgImageData(
                raw_image, latex_string_svg_image_dimensions))

        expected_dict = {
            'raw_image': raw_image,
            'latex_string_svg_image_dimensions': {
                'encoded_height_string': '1d345',
                'encoded_width_string': '2d345',
                'encoded_vertical_padding_string': '0d241'
            }
        }
        self.assertEqual(
            latex_string_svg_image_data.to_dict(), expected_dict)

    def test_validate_when_raw_image_not_string(self):
        latex_string_svg_image_dimensions = (
            html_domain.LatexStringSvgImageDimensions(
                '1d345', '2d345', '0d241'))

        with self.assertRaisesRegexp(
            Exception,
            'Expected raw_image to be a str, received 0'):
            html_domain.LatexStringSvgImageData(
                0, latex_string_svg_image_dimensions)
