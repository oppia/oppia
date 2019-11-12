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
# limitations under the License.

"""Tests for the HTML validation."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import os

from core.domain import fs_domain
from core.domain import html_validation_service
from core.tests import test_utils
import feconf
import python_utils


class ContentMigrationTests(test_utils.GenericTestBase):
    """Tests the function associated with the migration of html
    strings to valid RTE format.
    """

    def test_add_dimensions_to_image_tags(self):
        test_cases = [{
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'abc1.png&amp;quot;"></oppia-noninteractive-image>Hello this'
                ' is test case to check that dimensions are added to the oppia'
                ' noninteractive image tags.</p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value='
                '"&amp;quot;abc1_height_32_width_32.png&amp;'
                'quot;"></oppia-noninteractive-image>Hello this is test case'
                ' to check that dimensions are added to the oppia '
                'noninteractive image tags.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'abc2.png&amp;quot;"></oppia-noninteractive-image>Hello this'
                ' is test case to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3.png&amp;quot;">'
                '</oppia-noninteractive-image></p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value="'
                '&amp;quot;abc2_height_32_width_32.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case '
                'to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3_height_32_width_32.png'
                '&amp;quot;"></oppia-noninteractive-image></p>'
            )
        }, {
            'html_content': (
                '<p>Hey this is a test case with no images.</p>'
            ),
            'expected_output': (
                u'<p>Hey this is a test case with no images.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'does_not_exist.png&amp;quot;"></oppia-noninteractive-image>'
                'Hello this is test case to check that default dimensions '
                '(120, 120) are added in case the image does not exist.</p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value="&amp;'
                'quot;does_not_exist_height_120_width_120.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case'
                ' to check that default dimensions (120, 120) '
                'are added in case the image does not exist.</p>'
            )
        }, {
            'html_content': (
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'does_not_exist.png&amp;quot;"></oppia-noninteractive-image>'
                'Hello this is test case to check that default dimensions '
                '(120, 120) are added in case the image does not exist.</p>'
            ),
            'expected_output': (
                u'<p><oppia-noninteractive-image filepath-with-value="&amp;'
                'quot;does_not_exist_height_120_width_120.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case'
                ' to check that default dimensions (120, 120) '
                'are added in case the image does not exist.</p>'
            )
        }]

        exp_id = 'eid'
        owner_id = 'Admin'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DatastoreBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit(owner_id, 'image/abc1.png', raw_image, mimetype='image/png')
        fs.commit(owner_id, 'image/abc2.png', raw_image, mimetype='image/png')
        fs.commit(owner_id, 'image/abc3.png', raw_image, mimetype='image/png')

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_dimensions_to_image_tags(
                    False, exp_id, test_case['html_content']),
                test_case['expected_output'])

    # pylint: disable=anomalous-backslash-in-string
    def test_add_dimensions_to_image_tags_inside_tabs_and_collapsible_blocks(self): # pylint: disable=line-too-long
        test_cases = [{
            'html_content': (
                '<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;oppia-noninteractive-image alt-with-value=\&amp;'
                'quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                'quot;abc2.png&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;&amp;lt;p&amp;gt;You '
                'have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;'
                'quot;" heading-with-value="&amp;quot;Sample Header&amp;quot;'
                '"></oppia-noninteractive-collapsible>'
            ),
            'expected_output': (
                u'<oppia-noninteractive-collapsible content-with-value="&amp;'
                'quot;&amp;lt;oppia-noninteractive-image alt-with-value=\&amp;'
                'quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                'quot;abc2_height_32_width_32.png&amp;amp;amp;quot;\&amp;quot;'
                '&amp;gt;&amp;lt;/oppia-noninteractive-image&amp;gt;&amp;lt;'
                'p&amp;gt;You have opened the collapsible block.&amp;lt;/p'
                '&amp;gt;&amp;quot;" heading-with-value="&amp;quot;Sample '
                'Header&amp;quot;"></oppia-noninteractive-collapsible>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;'
                'quot;title&amp;quot;:&amp;quot;tab1&amp;quot;,&amp;quot;'
                'content&amp;quot;:&amp;quot;&amp;lt;'
                'oppia-noninteractive-image alt-with-value=\&amp;quot;&amp;'
                'amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;'
                'amp;quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;'
                'amp;quot;abc1.png'
                '&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;&amp;lt;'
                'oppia-noninteractive-image alt-with-value=\&amp;quot;&amp;'
                'amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                'quot;abc2.png'
                '&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;\n&amp;lt;p&amp;gt;this is'
                ' tab1&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;'
                ':&amp;quot;tab2&amp;quot;,&amp;quot;content&amp;quot;:&amp;'
                'quot;&amp;lt;oppia-noninteractive-image alt-with-value=\&amp;'
                'quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                'quot;abc3.png'
                '&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;\n&amp;lt;p&amp;gt;this is'
                ' tab2&amp;lt;/p&amp;gt;&amp;quot;}]">'
                '</oppia-noninteractive-tabs>'
            ),
            'expected_output': (
                u'<oppia-noninteractive-tabs tab_contents-with-value="[{&amp;'
                'quot;title&amp;quot;:&amp;quot;tab1&amp;quot;,&amp;quot;'
                'content&amp;quot;:&amp;quot;&amp;lt;'
                'oppia-noninteractive-image alt-with-value=\&amp;quot;&amp;'
                'amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;'
                'amp;quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;'
                'amp;quot;abc1_height_32_width_32.png'
                '&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;&amp;lt;'
                'oppia-noninteractive-image alt-with-value=\&amp;quot;&amp;'
                'amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                'quot;abc2_height_32_width_32.png'
                '&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;\n&amp;lt;p&amp;gt;this is'
                ' tab1&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;'
                ':&amp;quot;tab2&amp;quot;,&amp;quot;content&amp;quot;:&amp;'
                'quot;&amp;lt;oppia-noninteractive-image alt-with-value=\&amp;'
                'quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; '
                'caption-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;'
                'quot;\&amp;quot; filepath-with-value=\&amp;quot;&amp;amp;amp;'
                'quot;abc3_height_32_width_32.png'
                '&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;'
                '/oppia-noninteractive-image&amp;gt;\n&amp;lt;p&amp;gt;this is'
                ' tab2&amp;lt;/p&amp;gt;&amp;quot;}]">'
                '</oppia-noninteractive-tabs>'
            )
        }]

        exp_id = 'eid'
        owner_id = 'Admin'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DatastoreBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit(owner_id, 'image/abc1.png', raw_image, mimetype='image/png')
        fs.commit(owner_id, 'image/abc2.png', raw_image, mimetype='image/png')
        fs.commit(owner_id, 'image/abc3.png', raw_image, mimetype='image/png')

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_dimensions_to_image_tags_inside_tabs_and_collapsible_blocks( # pylint: disable=line-too-long
                    False, exp_id, test_case['html_content']),
                test_case['expected_output'])

    def test_add_dimensions_to_image_tags_with_invalid_filepath_with_value(
            self):

        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_context_manager = self.assertRaises(Exception)

        html_content = (
            '<p><oppia-noninteractive-image filepath-with-value="abc1.png">'
            '</oppia-noninteractive-image>Hello this is test case to check that'
            ' dimensions are added to the oppia noninteractive image tags.</p>'
        )

        exp_id = 'exp_id'
        owner_id = 'Admin'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DatastoreBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit(owner_id, 'image/abc1.png', raw_image, mimetype='image/png')

        with assert_raises_context_manager, logging_swap:
            html_validation_service.add_dimensions_to_image_tags(
                False, exp_id, html_content)

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages[0],
            'Exploration exp_id failed to load image: abc1.png')

    def test_add_dimensions_to_image_tags_when_no_filepath_specified(self):
        test_cases = [{
            'html_content': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;" filepath-with-value="">'
                '</oppia-noninteractive-image>'
                '<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
            ),
            'expected_output': (
                '<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;">'
                '</oppia-noninteractive-image>'
                '<p>There is no filepath attr in the above tag.</p>'
            ),
            'expected_output': (
                '<p>There is no filepath attr in the above tag.</p>'
            )
        }, {
            'html_content': (
                '<oppia-noninteractive-image caption-with-value="&amp;quot;'
                '&amp;quot;" filepath-with-value="">'
                '</oppia-noninteractive-image>'
                '<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
                '<p><oppia-noninteractive-image filepath-with-value="&amp;quot;'
                'img.png&amp;quot;"></oppia-noninteractive-image>Hello this'
                ' is test case to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3.png&amp;quot;">'
                '</oppia-noninteractive-image></p>'
            ),
            'expected_output': (
                u'<p>Some text.</p><p>Some more text.</p><p>Yet more text.</p>'
                '<p><oppia-noninteractive-image filepath-with-value="'
                '&amp;quot;img_height_32_width_32.png&amp;quot;">'
                '</oppia-noninteractive-image>Hello this is test case '
                'to check that dimensions are added to the oppia'
                ' noninteractive image tags.<oppia-noninteractive-image '
                'filepath-with-value="&amp;quot;abc3_height_32_width_32.png'
                '&amp;quot;"></oppia-noninteractive-image></p>'
            )
        }]

        exp_id = 'eid'
        owner_id = 'Admin'

        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DatastoreBackedFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exp_id))
        fs.commit(owner_id, 'image/img.png', raw_image, mimetype='image/png')
        fs.commit(owner_id, 'image/abc3.png', raw_image, mimetype='image/png')

        for test_case in test_cases:
            self.assertEqual(
                html_validation_service.add_dimensions_to_image_tags(
                    False, exp_id, test_case['html_content']),
                test_case['expected_output'])

    def test_regenerate_image_filename_using_dimensions(self):
        regenerated_name = (
            html_validation_service.regenerate_image_filename_using_dimensions(
                'abc.png', 45, 45))
        self.assertEqual(regenerated_name, 'abc_height_45_width_45.png')
