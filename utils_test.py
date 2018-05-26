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

import copy
import datetime

# pylint: disable=relative-import
from core.tests import test_utils
import feconf
import utils

# pylint: enable=relative-import


class UtilsTests(test_utils.GenericTestBase):
    """Test the core utility methods."""

    def test_create_enum_method(self):
        """Test create_enum method."""
        enum = utils.create_enum('first', 'second', 'third')
        self.assertEqual(enum.first, 'first')
        self.assertEqual(enum.second, 'second')
        self.assertEqual(enum.third, 'third')
        with self.assertRaises(AttributeError):
            enum.fourth  # pylint: disable=pointless-statement

    def test_get_comma_sep_string_from_list(self):
        """Test get_comma_sep_string_from_list method."""
        alist = ['a', 'b', 'c', 'd']
        results = ['', 'a', 'a and b', 'a, b and c', 'a, b, c and d']

        for i in range(len(alist) + 1):
            comma_sep_string = utils.get_comma_sep_string_from_list(alist[:i])
            self.assertEqual(comma_sep_string, results[i])

    def test_to_ascii(self):
        """Test to_ascii method."""
        parsed_str = utils.to_ascii('abc')
        self.assertEqual(parsed_str, 'abc')

        parsed_str = utils.to_ascii(u'¡Hola!')
        self.assertEqual(parsed_str, 'Hola!')

        parsed_str = utils.to_ascii(
            u'Klüft skräms inför på fédéral électoral große')
        self.assertEqual(
            parsed_str, 'Kluft skrams infor pa federal electoral groe')

        parsed_str = utils.to_ascii('')
        self.assertEqual(parsed_str, '')

    def test_yaml_dict_conversion(self):
        """Test yaml_from_dict and dict_from_yaml methods."""
        test_dicts = [{}, {'a': 'b'}, {'a': 2}, {'a': ['b', 2, {'c': 3.5}]}]

        for adict in test_dicts:
            yaml_str = utils.yaml_from_dict(adict)
            yaml_dict = utils.dict_from_yaml(yaml_str)
            self.assertEqual(adict, yaml_dict)

        with self.assertRaises(utils.InvalidInputException):
            yaml_str = utils.dict_from_yaml('{')

    def test_recursively_remove_key(self):
        """Test recursively_remove_key method."""
        d = {'a': 'b'}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {})

        d = {}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {})

        d = {'a': 'b', 'c': 'd'}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {'c': 'd'})

        d = {'a': 'b', 'c': {'a': 'b'}}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {'c': {}})

        d = ['a', 'b', {'c': 'd'}]
        utils.recursively_remove_key(d, 'c')
        self.assertEqual(d, ['a', 'b', {}])

    def test_camelcase_to_hyphenated(self):
        """Test camelcase_to_hyphenated method."""
        test_cases = [
            ('AbcDef', 'abc-def'),
            ('Abc', 'abc'),
            ('abc_def', 'abc_def'),
            ('Abc012Def345', 'abc012-def345'),
            ('abcDef', 'abc-def'),
        ]

        for test_case in test_cases:
            self.assertEqual(
                utils.camelcase_to_hyphenated(test_case[0]), test_case[1])

    def test_camelcase_to_snakecase(self):
        """Test camelcase_to_hyphenated method."""
        test_cases = [
            ('AbcDef', 'abc_def'),
            ('Abc', 'abc'),
            ('abc_def', 'abc_def'),
            ('Abc012Def345', 'abc012_def345'),
            ('abcDef', 'abc_def'),
            ('abc-def', 'abc-def'),
        ]

        for test_case in test_cases:
            self.assertEqual(
                utils.camelcase_to_snakecase(test_case[0]), test_case[1])

    def test_set_url_query_parameter(self):
        """Test set_url_query_parameter method."""
        self.assertEqual(
            utils.set_url_query_parameter('http://www.test.com', 'a', 'b'),
            'http://www.test.com?a=b'
        )

        self.assertEqual(
            utils.set_url_query_parameter('http://www.test.com?a=b', 'c', 'd'),
            'http://www.test.com?a=b&c=d'
        )

        self.assertEqual(
            utils.set_url_query_parameter(
                'http://test.com?a=b', 'redirectUrl', 'http://redirect.com'),
            'http://test.com?a=b&redirectUrl=http%3A%2F%2Fredirect.com'
        )

        with self.assertRaisesRegexp(
            Exception, 'URL query parameter name must be a string'
            ):
            utils.set_url_query_parameter('http://test.com?a=b', None, 'value')

    def test_convert_to_hash(self):
        """Test convert_to_hash() method."""
        orig_string = 'name_to_convert'
        full_hash = utils.convert_to_hash(orig_string, 28)
        abbreviated_hash = utils.convert_to_hash(orig_string, 5)

        self.assertEqual(len(full_hash), 28)
        self.assertEqual(len(abbreviated_hash), 5)
        self.assertEqual(full_hash[:5], abbreviated_hash)

    def test_vfs_construct_path(self):
        """Test vfs_construct_path method."""
        p = utils.vfs_construct_path('a', 'b', 'c')
        self.assertEqual(p, 'a/b/c')
        p = utils.vfs_construct_path('a/', '/b', 'c')
        self.assertEqual(p, '/b/c')
        p = utils.vfs_construct_path('a/', 'b', 'c')
        self.assertEqual(p, 'a/b/c')
        p = utils.vfs_construct_path('a', '/b', 'c')
        self.assertEqual(p, '/b/c')
        p = utils.vfs_construct_path('/a', 'b/')
        self.assertEqual(p, '/a/b/')

    def test_vfs_normpath(self):
        p = utils.vfs_normpath('/foo/../bar')
        self.assertEqual(p, '/bar')
        p = utils.vfs_normpath('foo//bar')
        self.assertEqual(p, 'foo/bar')
        p = utils.vfs_normpath('foo/bar/..')
        self.assertEqual(p, 'foo')
        p = utils.vfs_normpath('/foo//bar//baz//')
        self.assertEqual(p, '/foo/bar/baz')

    def test_capitalize_string(self):
        test_data = [
            [None, None],
            ['', ''],
            ['a', 'A'],
            ['A', 'A'],
            ['1', '1'],
            ['lowercase', 'Lowercase'],
            ['UPPERCASE', 'UPPERCASE'],
            ['Partially', 'Partially'],
            ['miDdle', 'MiDdle'],
            ['2be', '2be'],
        ]

        for datum in test_data:
            self.assertEqual(utils.capitalize_string(datum[0]), datum[1])

    def test_get_thumbnail_icon_url_for_category(self):
        self.assertEqual(
            utils.get_thumbnail_icon_url_for_category('Architecture'),
            '/subjects/Architecture.svg')
        self.assertEqual(
            utils.get_thumbnail_icon_url_for_category('Graph Theory'),
            '/subjects/GraphTheory.svg')
        self.assertEqual(
            utils.get_thumbnail_icon_url_for_category('Nonexistent'),
            '/subjects/Lightbulb.svg')

    def test_get_asset_dir_prefix_returns_correct_slug(self):

        with self.swap(feconf, 'DEV_MODE', True):
            utils.ASSET_DIR_PREFIX = None
            asset_dir_prefix = utils.get_asset_dir_prefix()
            self.assertEqual('', asset_dir_prefix)

        with self.swap(feconf, 'DEV_MODE', False):
            utils.ASSET_DIR_PREFIX = None
            asset_dir_prefix = utils.get_asset_dir_prefix()
            self.assertTrue(asset_dir_prefix.startswith('/build'))

    def test_are_datetimes_close(self):
        initial_time = datetime.datetime(2016, 12, 1, 0, 0, 0)
        with self.swap(feconf, 'PROXIMAL_TIMEDELTA_SECS', 2):
            self.assertTrue(utils.are_datetimes_close(
                datetime.datetime(2016, 12, 1, 0, 0, 1),
                initial_time))
            self.assertFalse(utils.are_datetimes_close(
                datetime.datetime(2016, 12, 1, 0, 0, 3),
                initial_time))

    def test_convert_to_str(self):
        string1 = 'Home'
        string2 = u'Лорем'
        self.assertEqual(utils.convert_to_str(string1), string1)
        self.assertEqual(utils.convert_to_str(string2), string2.encode('utf-8'))

    def test_get_hashable_value(self):
        json1 = ['foo', 'bar', {'baz': 3}]
        json2 = ['fee', {'fie': ['foe', 'fum']}]
        json1_deepcopy = copy.deepcopy(json1)
        json2_deepcopy = copy.deepcopy(json2)

        test_set = {utils.get_hashable_value(json1)}
        self.assertIn(utils.get_hashable_value(json1_deepcopy), test_set)
        test_set.add(utils.get_hashable_value(json2))
        self.assertEqual(
            test_set, {
                utils.get_hashable_value(json1_deepcopy),
                utils.get_hashable_value(json2_deepcopy),
            })

    def test_convert_to_text_angular(self):
        html_content_1 = (
            'Hello, <span><b>How can I help You?</b></span><br/>'
            '<p>I am quite fluent in python can you guide me how can '
            'I start</p>,<span>contribtuing <div>in Oppia.'
            '</div>Ya Sure!visit,the oppia documentation, '
            'sign the CLA</span>,<pre>and <br/>have your first PR to go.</pre>'
        )

        html_content_2 = (
            'There are number of ways by which we can give our share to '
            '<blockquote><div><p>the open source community. It is not just '
            'always opening the PRs </p></div></blockquote>. <div> You can '
            'help <br/> fellow members, <br/>open issues, <br/> <span> '
            'review PRs </span> etc. </div>'
        )

        html_content_3 = (
            'That is a very quick <div>sample of Oppia. For more sample '
            'explorations check out the Library</div>. You can also '
            'create new explorations, like this one, by clicking on the '
            '"Create" button in the top right of the page.<br/><div>We'
            'hope you enjoy using Oppia. If you have feedback, '
            'please let us know at our <oppia-noninteractive-link '
            'text-with-value="&amp;quot;discussion forum&amp;quot;" '
            'url-with-value="&amp;quot;https://groups.google.com/forum/?'
            'fromgroups#!forum/oppia&amp;quot;">'
            '</oppia-noninteractive-link>!</div><p></p>'
        )

        html_content_4 = (
            'So: <br/><br/>There is 1 way to arrange 1 ball. '
            '<br/>There are 2 ways to arrange 2 balls.<br/>There are 6 ways '
            'to arrange 3 balls.<br/><br/>Lets give these names. We will say '
            'F1 = 1, F2 = 2, F3 = 6. So, if you have n balls (where n '
            'is 1, 2, 3, ...), then Fn is the number of ways to arrange them. '
            '<br/><oppia-noninteractive-image filepath-with-value="&amp;quot;'
            'patterns.png&amp;quot;"></oppia-noninteractive-image><br/><br/>'
            'Can you see a pattern here, or a systematic way to count them? '
            'Let us have a look at the 3-ball case.<br/><br/><br/><br/>First '
            'you pick the ball on the left. This could be red, blue or '
            'yellow. There are three cases to consider:<br/><br/>If the '
            'first ball is red, then there are two balls left to arrange '
            'in the other two slots. And there are F2 ways '
            'to do this.<div><oppia-noninteractive-image '
            'filepath-with-value="&amp;quot;startRed.png&amp;quot;"'
            '></oppia-noninteractive-image><br/><span><br/></span></div> '
            '<div><span>If the first ball is blue, then there are two balls '
            'left to ... hey, this is the same thing, it is just F2. '
            '</span></div><div><oppia-noninteractive-image '
            'filepath-with-value="amp;quot;startBlue.png&amp;quot;">'
            '</oppia-noninteractive-image><br/></div><div><br/><span>And, '
            'if the first ball is yellow, then ... yada, yada, F2. '
            '</span><br/><oppia-noninteractive-image filepath-with-value'
            '="&amp;quot;startYellow.png&amp;quot;">'
            '</oppia-noninteractive-image> <br/><br/>So the total number '
            'of ways to arrange 3 balls, F3, is equal to 3 * F2. And all '
            'this works out correctly, because '
            'F2 = 2, and F3 = 3 * 2 = 6.<br/><br/><br/><br/>Now, '
            'can you write out a similar expression for F2, in '
            'terms of F1? Then we\'ll move on to figuring out F4, which '
            'starts to become hard to compute manually.</div>'
        )

        expected_output_1 = (
            '<p>Hello, <b>How can I help You?</b><br/>'
            'I am quite fluent in python can you guide me how can '
            'I start,contribtuing in Oppia.'
            'Ya Sure!visit,the oppia documentation, '
            'sign the CLA,</p><pre>and <p><br/></p>'
            'have your first PR to go.</pre>'
        )

        expected_output_2 = (
            '<p>There are number of ways by which we can give our share to </p>'
            '<blockquote><p>the open source community. It is not just '
            'always opening the PRs </p></blockquote><p>.  You can '
            'help <br/> fellow members, <br/>open issues, <br/>  '
            'review PRs  etc. </p>'
        )

        expected_output_3 = (
            '<p>That is a very quick sample of Oppia. For more sample '
            'explorations check out the Library. You can also '
            'create new explorations, like this one, by clicking on the '
            '"Create" button in the top right of the page.<br/>We'
            'hope you enjoy using Oppia. If you have feedback, '
            'please let us know at our <oppia-noninteractive-link '
            'text-with-value="&amp;quot;discussion forum&amp;quot;" '
            'url-with-value="&amp;quot;https://groups.google.com/forum/?'
            'fromgroups#!forum/oppia&amp;quot;">'
            '</oppia-noninteractive-link>!</p>'
        )

        expected_output_4 = (
            '<p>So: <br/><br/>There is 1 way to arrange 1 ball. '
            '<br/>There are 2 ways to arrange 2 balls.<br/>There are 6 ways '
            'to arrange 3 balls.<br/><br/>Lets give these names. We will say '
            'F1 = 1, F2 = 2, F3 = 6. So, if you have n balls (where n '
            'is 1, 2, 3, ...), then Fn is the number of ways to arrange them. '
            '<br/><oppia-noninteractive-image filepath-with-value="&amp;quot;'
            'patterns.png&amp;quot;"></oppia-noninteractive-image><br/><br/>'
            'Can you see a pattern here, or a systematic way to count them? '
            'Let us have a look at the 3-ball case.<br/><br/><br/><br/>First '
            'you pick the ball on the left. This could be red, blue or '
            'yellow. There are three cases to consider:<br/><br/>If the '
            'first ball is red, then there are two balls left to arrange '
            'in the other two slots. And there are F2 ways '
            'to do this.<oppia-noninteractive-image '
            'filepath-with-value="&amp;quot;startRed.png&amp;quot;"'
            '></oppia-noninteractive-image><br/><br/> '
            'If the first ball is blue, then there are two balls '
            'left to ... hey, this is the same thing, it is just F2. '
            '<oppia-noninteractive-image '
            'filepath-with-value="amp;quot;startBlue.png&amp;quot;">'
            '</oppia-noninteractive-image><br/><br/>And, '
            'if the first ball is yellow, then ... yada, yada, F2. '
            '<br/><oppia-noninteractive-image filepath-with-value'
            '="&amp;quot;startYellow.png&amp;quot;">'
            '</oppia-noninteractive-image> <br/><br/>So the total number '
            'of ways to arrange 3 balls, F3, is equal to 3 * F2. And all '
            'this works out correctly, because '
            'F2 = 2, and F3 = 3 * 2 = 6.<br/><br/><br/><br/>Now, '
            'can you write out a similar expression for F2, in '
            'terms of F1? Then we\'ll move on to figuring out F4, which '
            'starts to become hard to compute manually.</p>'
        )

        actual_output_1 = utils.convert_to_text_angular(html_content_1)
        actual_output_2 = utils.convert_to_text_angular(html_content_2)
        actual_output_3 = utils.convert_to_text_angular(html_content_3)
        actual_output_4 = utils.convert_to_text_angular(html_content_4)

        self.assertEqual(actual_output_1, expected_output_1)
        self.assertEqual(actual_output_2, expected_output_2)
        self.assertEqual(actual_output_3, expected_output_3)
        self.assertEqual(actual_output_4, expected_output_4)
