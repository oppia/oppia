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

"""Unit tests for utils.py."""

from __future__ import annotations

import base64
import copy
import datetime
import os
import urllib

from core import feconf
from core import utils
from core.constants import constants
from core.tests import test_utils

from typing import Any, Dict, List

from third_party.python_libs.pymongo.compression_support import decompress
from third_party.python_libs.urllib3.packages.six import assertRaisesRegex


class UtilsTests(test_utils.GenericTestBase):
    """Test the core utility methods."""

    def test_get_comma_sep_string_from_list(self) -> None:
        """Test get_comma_sep_string_from_list method."""
        alist = ['a', 'b', 'c', 'd']
        results = ['', 'a', 'a and b', 'a, b and c', 'a, b, c and d']

        for i in range(len(alist) + 1):
            comma_sep_string = utils.get_comma_sep_string_from_list(alist[:i])
            self.assertEqual(comma_sep_string, results[i])

    def test_to_ascii(self) -> None:
        """Test to_ascii method."""
        parsed_str = utils.to_ascii('abc')
        self.assertEqual(parsed_str, 'abc')

        parsed_str = utils.to_ascii('¡Hola!')
        self.assertEqual(parsed_str, 'Hola!')

        parsed_str = utils.to_ascii(
            u'Klüft skräms inför på fédéral électoral große')
        self.assertEqual(
            parsed_str, 'Kluft skrams infor pa federal electoral groe')

        parsed_str = utils.to_ascii('')
        self.assertEqual(parsed_str, '')

    def test_yaml_dict_conversion(self) -> None:
        """Test yaml_from_dict and dict_from_yaml methods."""
        test_dicts: List[Dict[str, Any]] = [
            {},
            {'a': 'b'},
            {'a': 2},
            {'a': ['b', 2, {'c': 3.5}]}
        ]

        for adict in test_dicts:
            yaml_str = utils.yaml_from_dict(adict)

            yaml_dict = utils.dict_from_yaml(yaml_str)
            self.assertEqual(adict, yaml_dict)

        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            utils.InvalidInputException,
            'while parsing a flow node\n'
            'expected the node content, but found \'<stream end>\'\n'):
            utils.dict_from_yaml('{')

    def test_recursively_remove_key_for_empty_dict(self) -> None:
        """Test recursively_remove_key method for an empty dict."""
        d: Dict[str, Any] = {}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {})

    def test_recursively_remove_key_for_single_key_dict(self) -> None:
        """Test recursively_remove_key method for single key dict."""
        d = {'a': 'b'}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {})

    def test_recursively_remove_key_for_multi_key_dict(self) -> None:
        """Test recursively_remove_key method for multi key dict."""
        d = {'a': 'b', 'c': 'd'}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {'c': 'd'})

    def test_recursively_remove_key_for_dict_with_value_dict(self) -> None:
        """Test recursively_remove_key method for dict with a value dict."""
        d = {'a': 'b', 'c': {'a': 'b'}}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {'c': {}})

    def test_recursively_remove_key_for_list(self) -> None:
        """Test recursively_remove_key method for list."""
        l = ['a', 'b', {'c': 'd'}]
        utils.recursively_remove_key(l, 'c')
        self.assertEqual(l, ['a', 'b', {}])

    def test_camelcase_to_hyphenated(self) -> None:
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

    def test_camelcase_to_snakecase(self) -> None:
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

    def test_set_url_query_parameter(self) -> None:
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

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'URL query parameter name must be a string'
            ):
            utils.set_url_query_parameter('http://test.com?a=b', None, 'value') # type: ignore[arg-type]

    def test_convert_to_hash(self) -> None:
        """Test convert_to_hash() method."""
        orig_string = 'name_to_convert'
        full_hash = utils.convert_to_hash(orig_string, 28)
        abbreviated_hash = utils.convert_to_hash(orig_string, 5)

        self.assertEqual(len(full_hash), 28)
        self.assertEqual(len(abbreviated_hash), 5)
        self.assertEqual(full_hash[:5], abbreviated_hash)
        self.assertTrue(full_hash.isalnum())

    def test_vfs_construct_path(self) -> None:
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

    def test_vfs_normpath(self) -> None:
        p = utils.vfs_normpath('/foo/../bar')
        self.assertEqual(p, '/bar')
        p = utils.vfs_normpath('foo//bar')
        self.assertEqual(p, 'foo/bar')
        p = utils.vfs_normpath('foo/bar/..')
        self.assertEqual(p, 'foo')
        p = utils.vfs_normpath('/foo//bar//baz//')
        self.assertEqual(p, '/foo/bar/baz')
        p = utils.vfs_normpath('')
        self.assertEqual(p, '.')
        p = utils.vfs_normpath('//foo//bar//baz//')
        self.assertEqual(p, '//foo/bar/baz')

    def test_capitalize_string(self) -> None:
        test_data: List[List[str]] = [
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

    def test_generate_random_string(self) -> None:
        # Generate a random string of length 12.
        random_string = utils.generate_random_string(12)
        self.assertIsInstance(random_string, str)
        self.assertEqual(len(random_string), 12)

    def test_convert_png_data_url_to_binary_with_incorrect_prefix(self) -> None:
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
            Exception, 'The given string does not represent a PNG data URL'
        ):
            utils.convert_png_data_url_to_binary('data:image/jpg;base64,')

    def test_get_thumbnail_icon_url_for_category(self) -> None:
        self.assertEqual(
            utils.get_thumbnail_icon_url_for_category('Architecture'),
            '/subjects/Architecture.svg')
        self.assertEqual(
            utils.get_thumbnail_icon_url_for_category('Graph Theory'),
            '/subjects/GraphTheory.svg')
        self.assertEqual(
            utils.get_thumbnail_icon_url_for_category('Nonexistent'),
            '/subjects/Lightbulb.svg')

    def test_are_datetimes_close(self) -> None:
        initial_time = datetime.datetime(2016, 12, 1, 0, 0, 0)
        with self.swap(feconf, 'PROXIMAL_TIMEDELTA_SECS', 2):
            self.assertTrue(utils.are_datetimes_close(
                datetime.datetime(2016, 12, 1, 0, 0, 1),
                initial_time))
            self.assertFalse(utils.are_datetimes_close(
                datetime.datetime(2016, 12, 1, 0, 0, 3),
                initial_time))

    def test_conversion_between_string_and_naive_datetime_object(self) -> None:
        """Tests to make sure converting a naive datetime object to a string and
        back doesn't alter the naive datetime object data.
        """
        now = datetime.datetime.utcnow()
        self.assertEqual(
            utils.convert_string_to_naive_datetime_object(
                utils.convert_naive_datetime_to_string(now)),
            now)

    def test_datetime_conversion_to_string_returns_correct_format(self) -> None:
        initial_time = datetime.datetime(2016, 12, 1, 1, 2, 3)
        self.assertEqual(
            utils.convert_naive_datetime_to_string(initial_time),
            '12/01/2016, 01:02:03:000000')

    def test_string_to_datetime_conversion_returns_correct_datetime(
            self
    ) -> None:
        time_string = '12/01/2016, 01:02:03:000000'
        initial_time = datetime.datetime(2016, 12, 1, 1, 2, 3)
        self.assertEqual(
            utils.convert_string_to_naive_datetime_object(time_string),
            initial_time)

    def test_create_string_from_largest_unit_in_timedelta_raises_for_zero_diff(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(days=0)

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'Expected a positive timedelta, received: %s.' % (
                timedelta_object.total_seconds())):
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)

    def test_create_string_from_largest_unit_in_timedelta_raises_for_neg_diff(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(days=-40)

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'Expected a positive timedelta, received: %s.' % (
                timedelta_object.total_seconds())):
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)

    def test_create_string_from_largest_unit_in_timedelta_returns_days(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=4, hours=1, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '4 days')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_day(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=1, hours=1, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 day')

    def test_create_string_from_largest_unit_in_timedelta_returns_hours(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=2, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '2 hours')

    def test_create_string_from_largest_unit_in_timedelta_returns_an_hour(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=1, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 hour')

    def test_create_string_from_largest_unit_in_timedelta_returns_minutes(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=4, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '4 minutes')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_minute(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=1, seconds=12)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_min_for_min(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=1, seconds=0)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_create_string_from_largest_unit_in_timedelta_returns_minute_if_sec(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=0, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_min_if_msec(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=0, seconds=0, milliseconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_get_hashable_value(self) -> None:
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

    def test_is_supported_audio_language_code(self) -> None:
        self.assertTrue(utils.is_supported_audio_language_code('hi-en'))
        self.assertFalse(utils.is_supported_audio_language_code('unknown'))

    def test_is_valid_language_code(self) -> None:
        self.assertTrue(utils.is_valid_language_code('en'))
        self.assertFalse(utils.is_valid_language_code('unknown'))

    def test_require_valid_name(self) -> None:
        name = 'name'
        utils.require_valid_name(name, 'name_type')

        invalid_name = 0
        with self.assertRaisesRegex(Exception, '0 must be a string.'): # type: ignore[no-untyped-call]
            # Type ignore is used below because we are providing integer
            # argument instead of string for invalid_name for testing purposes.
            utils.require_valid_name(invalid_name, 'name_type') # type: ignore[arg-type]

    def test_require_valid_meta_tag_content(self) -> None:
        meta_tag_content = 'name'
        utils.require_valid_meta_tag_content(meta_tag_content)

        non_string_meta_tag_content = 0
        invalid_type_error = (
            'Expected meta tag content to be a string, received 0')
        with self.assertRaisesRegex(Exception, invalid_type_error): # type: ignore[no-untyped-call]
            utils.require_valid_meta_tag_content(non_string_meta_tag_content) # type: ignore[arg-type]
        lengthy_meta_tag_content = 'a' * 200
        max_length_error = (
            'Meta tag content should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_META_TAG_CONTENT)

        with self.assertRaisesRegex(Exception, max_length_error): # type: ignore[no-untyped-call]
            utils.require_valid_meta_tag_content(lengthy_meta_tag_content)

    def test_require_valid_page_title_fragment_for_web(self) -> None:
        page_title_fragment_for_web = 'name'
        utils.require_valid_page_title_fragment_for_web(
            page_title_fragment_for_web)

        non_string_page_title_fragment_for_web = 0
        invalid_type_error = (
            'Expected page title fragment to be a string, received 0')
        with self.assertRaisesRegex(Exception, invalid_type_error): # type: ignore[no-untyped-call]
            utils.require_valid_page_title_fragment_for_web(
                non_string_page_title_fragment_for_web) # type: ignore[arg-type]
        lengthy_page_title_fragment_for_web = 'a' * 60
        max_length_error = (
            'Page title fragment should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)

        with self.assertRaisesRegex(Exception, max_length_error): # type: ignore[no-untyped-call]
            utils.require_valid_page_title_fragment_for_web(
                lengthy_page_title_fragment_for_web)

    def test_require_valid_url_fragment(self) -> None:
        name = 'name'
        utils.require_valid_url_fragment(name, 'name-type', 20)

        name_with_spaces = 'name with spaces'
        name_with_spaces_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. '
            'Received name with spaces.')
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, name_with_spaces_expected_error):
            utils.require_valid_url_fragment(
                name_with_spaces, 'name-type', 20)

        name_in_caps = 'NAME'
        name_in_caps_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. Received NAME.')
        with self.assertRaisesRegex(Exception, name_in_caps_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(
                name_in_caps, 'name-type', 20)

        name_with_numbers = 'nam3'
        name_with_numbers_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. Received nam3.')
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, name_with_numbers_expected_error):
            utils.require_valid_url_fragment(
                name_with_numbers, 'name-type', 20)

        long_name = 'a-really-really-really-lengthy-name'
        long_name_expected_error = (
            'name-type field should not exceed 10 characters, '
            'received %s' % long_name)
        with self.assertRaisesRegex(Exception, long_name_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(
                long_name, 'name-type', 10)

        empty_name = ''
        empty_name_expected_error = 'name-type field should not be empty.'
        with self.assertRaisesRegex(Exception, empty_name_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(empty_name, 'name-type', 20)

        non_string_name = 0
        non_string_name_expected_error = (
            'name-type field must be a string. Received 0.')
        with self.assertRaisesRegex(Exception, non_string_name_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(non_string_name, 'name-type', 20) # type: ignore[arg-type]

    def test_validate_convert_to_hash(self) -> None:
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'Expected string, received 1 of type %s' % type(1)):
            utils.convert_to_hash(1, 10) # type: ignore[arg-type]

    def test_convert_png_to_data_url_with_non_png_image_raises_error(
            self
    ) -> None:
        favicon_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'favicon.ico') # type: ignore[no-untyped-call]

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'The given string does not represent a PNG image.'):
            utils.convert_png_to_data_url(favicon_filepath)

    def test_get_exploration_components_from_dir_with_invalid_path_raises_error(
            self
    ) -> None:
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception,
            'Found invalid non-asset file .+'
            'There should only be a single non-asset file, and it should have '
            'a .yaml suffix.'
        ):
            utils.get_exploration_components_from_dir('core/tests/load_tests')

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'The only directory in . should be assets/'):
            utils.get_exploration_components_from_dir('.')

    def test_get_exploration_components_from_dir_with_multiple_yaml_files(
            self
    ) -> None:
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception,
            'More than one non-asset file specified for '
            'core/tests/data/dummy_assets/assets'):
            utils.get_exploration_components_from_dir(
                'core/tests/data/dummy_assets/assets/')

    def test_get_exploration_components_from_dir_with_no_yaml_file(
            self
    ) -> None:
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception,
            'No yaml file specifed for core/tests/data/dummy_assets'):
            utils.get_exploration_components_from_dir(
                'core/tests/data/dummy_assets/')

    def test_get_asset_dir_prefix_with_prod_mode(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            self.assertEqual(utils.get_asset_dir_prefix(), '/build')

    def test_base64_from_int(self) -> None:
        base64_number = utils.base64_from_int(108)
        self.assertEqual(base64.b64decode(base64_number), b'[108]')

    def test_get_supported_audio_language_description_with_invalid_code(
            self
    ) -> None:
        valid_language_code = 'en'
        expected_language_description = 'English'
        self.assertEqual(
            utils.get_supported_audio_language_description(valid_language_code),
            expected_language_description)

        invalid_language_code = 'invalid_code'
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'Unsupported audio language code: invalid_code'):
            utils.get_supported_audio_language_description(
                invalid_language_code)

    def test_is_user_id_valid(self) -> None:
        self.assertTrue(
            utils.is_user_id_valid(
                feconf.SYSTEM_COMMITTER_ID, allow_system_user_id=True))
        self.assertTrue(
            utils.is_user_id_valid(
                feconf.MIGRATION_BOT_USER_ID, allow_system_user_id=True))
        self.assertTrue(
            utils.is_user_id_valid(
                feconf.SUGGESTION_BOT_USER_ID, allow_system_user_id=True))
        self.assertTrue(
            utils.is_user_id_valid(
                'pid_%s' % ('a' * 32), allow_pseudonymous_id=True))
        self.assertTrue(
            utils.is_user_id_valid('uid_%s' % ('a' * 32)))
        self.assertFalse(
            utils.is_user_id_valid('pid_%s' % ('a' * 32)))
        self.assertFalse(
            utils.is_user_id_valid('uid_%s%s' % ('a' * 31, 'A')))
        self.assertFalse(
            utils.is_user_id_valid('uid_%s' % ('a' * 31)))
        self.assertFalse(utils.is_user_id_valid('a' * 36))

    def test_is_pseudonymous_id(self) -> None:
        self.assertTrue(utils.is_pseudonymous_id('pid_' + 'a' * 32))
        self.assertFalse(utils.is_pseudonymous_id('uid_' + 'a' * 32))
        self.assertFalse(utils.is_pseudonymous_id('uid_' + 'a' * 31 + 'A'))
        self.assertFalse(utils.is_pseudonymous_id('uid_' + 'a' * 31))
        self.assertFalse(utils.is_pseudonymous_id('a' * 36))

    def test_snake_case_to_camel_case(self) -> None:
        camel_case_str1 = utils.snake_case_to_camel_case('user_id_number')
        camel_case_str2 = utils.snake_case_to_camel_case('hello_world')
        camel_case_str3 = utils.snake_case_to_camel_case('test1')
        self.assertEqual(camel_case_str1, 'userIdNumber')
        self.assertEqual(camel_case_str2, 'helloWorld')
        self.assertEqual(camel_case_str3, 'test1')

    def _assert_valid_thumbnail_filename(
            self,
            expected_error_substring: str,
            thumbnail_filename: str
    ) -> None:
        """Helper method for test_require_valid_thumbnail_filename."""
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            utils.require_valid_thumbnail_filename(
                thumbnail_filename)

    def test_require_valid_thumbnail_filename(self) -> None:
        """Test thumbnail filename validation."""
        self._assert_valid_thumbnail_filename(
            'Expected thumbnail filename to be a string, received 10', 10) # type: ignore[arg-type]
        self._assert_valid_thumbnail_filename(
            'Thumbnail filename should not start with a dot.', '.name')
        self._assert_valid_thumbnail_filename(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_thumbnail_filename(
            'Thumbnail filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_thumbnail_filename(
            'Thumbnail filename should include an extension.', 'name')
        self._assert_valid_thumbnail_filename(
            'Expected a filename ending in svg, received name.jpg', 'name.jpg')
        filename = 'filename.svg'
        utils.require_valid_thumbnail_filename(filename)

    def _assert_valid_image_filename(
            self, expected_error_substring: str, image_filename: str
    ) -> None:
        """Helper method for test_require_valid_image_filename."""
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            utils.require_valid_image_filename(image_filename)

    def test_require_valid_image_filename(self) -> None:
        """Test image filename validation."""
        self._assert_valid_image_filename(
            'Expected image filename to be a string, received 10', 10) # type: ignore[arg-type]
        self._assert_valid_image_filename(
            'Image filename should not start with a dot.', '.name')
        self._assert_valid_image_filename(
            'Image filename should not include slashes or '
            'consecutive dot characters.', 'file/name')
        self._assert_valid_image_filename(
            'Image filename should not include slashes or '
            'consecutive dot characters.', 'file..name')
        self._assert_valid_image_filename(
            'Image filename should include an extension.', 'name')
        filename = 'filename.svg'
        utils.require_valid_image_filename(filename)

    def test_get_time_in_millisecs(self) -> None:
        dt = datetime.datetime(2020, 6, 15)
        msecs = utils.get_time_in_millisecs(dt)
        self.assertEqual(
            dt, datetime.datetime.fromtimestamp(msecs / 1000.0))

    def test_get_time_in_millisecs_with_complicated_time(self) -> None:
        dt = datetime.datetime(2020, 6, 15, 5, 18, 23, microsecond=123456)
        msecs = utils.get_time_in_millisecs(dt)
        self.assertEqual(
            dt, datetime.datetime.fromtimestamp(msecs / 1000.0))

    def test_grouper(self) -> None:
        self.assertEqual(
            [list(g) for g in utils.grouper(range(7), 3)],
            [[0, 1, 2], [3, 4, 5], [6, None, None]])
        # Returns an iterable of iterables, so we need to combine them into
        # strings for easier comparison.
        self.assertEqual(
            [''.join(g) for g in utils.grouper('ABCDEFG', 3, fillvalue='x')],
            ['ABC', 'DEF', 'Gxx'])

    def test_partition(self) -> None:
        is_even = lambda n: (n % 2) == 0

        evens, odds = (
            utils.partition([10, 8, 1, 5, 6, 4, 3, 7], predicate=is_even))

        self.assertEqual(list(evens), [10, 8, 6, 4])
        self.assertEqual(list(odds), [1, 5, 3, 7])

    def test_enumerated_partition(self) -> None:
        logs = ['ERROR: foo', 'INFO: bar', 'INFO: fee', 'ERROR: fie']
        is_error = lambda msg: msg.startswith('ERROR: ')

        errors, others = (
            utils.partition(logs, predicate=is_error, enumerated=True))

        self.assertEqual(list(errors), [(0, 'ERROR: foo'), (3, 'ERROR: fie')])
        self.assertEqual(list(others), [(1, 'INFO: bar'), (2, 'INFO: fee')])

    def test_convert_png_data_url_to_binary(self) -> None:
        image_data_url = '%s%s' % (
            utils.PNG_DATA_URL_PREFIX,
            urllib.parse.quote(base64.b64encode(b'test123'))
        )

        self.assertEqual(
            utils.convert_png_data_url_to_binary(image_data_url), b'test123')

    def test_convert_png_data_url_to_binary_raises_if_prefix_is_missing(
            self
    ) -> None:
        image_data_url = urllib.parse.quote(base64.b64encode(b'test123'))

        self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'The given string does not represent a PNG data URL.',
            lambda: utils.convert_png_data_url_to_binary(image_data_url))

    def test_quoted_string(self) -> None:
        self.assertEqual(utils.quoted('a"b\'c'), '"a\\"b\'c"')

    def test_is_base64_encoded(self) -> None:
        image = '<svg><path d="%s" /></svg>' % (
            'M150 0 L75 200 L225 200 Z ' * 1000)

        self.assertFalse(utils.is_base64_encoded(image))
        self.assertFalse(utils.is_base64_encoded('hello'))
        self.assertTrue(utils.is_base64_encoded(
            base64.b64encode(b'hello').decode('utf-8'))
        )

    def test_url_open(self) -> None:
        response = utils.url_open('http://www.google.com')
        self.assertEqual(response.getcode(), 200) # type: ignore[attr-defined]
        self.assertEqual(
            response.url, 'http://www.google.com') # type: ignore[attr-defined]

    def test_get_random_int(self) -> None:
        self.assertLess(utils.get_random_int(5),5)
        self.assertGreaterEqual(utils.get_random_int(5),0)
        with self.assertRaisesRegex(AssertionError,'Only positive integers allowed'):
            utils.get_random_int(-1)
        with self.assertRaisesRegex(AssertionError,'Only positive integers allowed'):
            utils.get_random_int(1.5)

    def test_get_random_choice(self) -> None:
        list_instance = [1,5,9,11,15]
        list_instance2 = []
        tuple_instance = (1,)
        self.assertIn(utils.get_random_choice(list_instance),list_instance)
        with self.assertRaisesRegex(AssertionError,'Only non-empty lists allowed'):
            utils.get_random_choice(list_instance2)
        with self.assertRaisesRegex(AssertionError,'Only non-empty lists allowed'):
            utils.get_random_choice(tuple_instance)
    
    def test_get_human_readable_time_string(self) -> None:
        '''Should we test for negative time?'''
        self.assertEqual("December 12 06:42:12",utils.get_human_readable_time_string(944980932342.38))

    def test_generate_new_session_id(self) -> None:
        self.assertEqual(24,len(utils.generate_new_session_id()))
        self.assertEqual(type(utils.generate_new_session_id()).__name__,"str")

    def test_require_valid_name(self) -> None:
        self.assertEqual(None,utils.require_valid_name('','the exploration title',True))

        with self.assertRaisesRegex(
            utils.ValidationError,'123 must be a string.'):
            utils.require_valid_name(123,'the exploration title')
        with self.assertRaisesRegex(
            utils.ValidationError,'The length of the exploration title should be between 1 and 50 '
        'characters; received '''):
            utils.require_valid_name('','the exploration title')
        with self.assertRaisesRegex(
            utils.ValidationError,'Names should not start or end with whitespace.'):
            utils.require_valid_name(' 123\n','the exploration title')
        with self.assertRaisesRegex(
            utils.ValidationError,'Adjacent whitespace in the exploration title should be collapsed.'):
            utils.require_valid_name('1  23','the exploration title')
        with self.assertRaisesRegex(
            utils.ValidationError,'Invalid character : in the exploration title: 1\n:23'):
            utils.require_valid_name('1\n:23','the exploration title')
        """ADD ANOTHER ONE TO TEST ESCAPE SEQUENCE CHARACTERS"""

    def test_get_hex_color_for_category(self) -> None:
        self.assertEqual(utils.get_hex_color_for_category("Law"),"#538270")
        self.assertEqual(utils.get_hex_color_for_category("Quantum Physics"),"#a33f40")

    def test_unescape_encoded_uri_component(self) -> None:
        self.assertEqual(utils.unescape_encoded_uri_component("/El%20Ni%C3%B1o/"),"/El Niño/")

    def test_compress_and_decompress_zlib(self) -> None:
        string_instance = b"This is for testing"
        string_compressed = utils.compress_to_zlib(string_instance)
        self.assertNotEqual(len(string_compressed),len(string_instance))
        self.assertEqual(len(utils.decompress_from_zlib(string_compressed)),len(string_instance))

    def test_compute_list_difference(self) -> None:
        self.assertEqual(utils.compute_list_difference([-5,-1,0,7,-4],[2,0,-5,-2,7]),[-4,-1])

    def test_get_exploration_from_dir(self) -> None:
            filepath_not_png = os.path.join(os.getcwd(), 'assets', 'i18n', 'en.json')
            filepath_png = os.path.join(os.getcwd(),'assets','images','about','books_dsk.png')
            file_contents_png = utils.get_file_contents(filepath_png, raw_bytes=True, mode='rb')
            with self.assertRaisesRegex(Exception,'The given string does not represent a PNG image.'):
                file_contents_not_png = utils.get_file_contents(filepath_not_png, raw_bytes=True, mode='rb')
                utils.convert_png_binary_to_data_url(file_contents_not_png)
            self.assertEqual(utils.convert_png_binary_to_data_url(file_contents_png),"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABN8AAAPMCAYAAAByih8GAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAANsASURBVHgB7N0PdFX1ne/9794H5J9oUpXOWLzEFiSoDMlzrz4V752Gfz6DcJHewlPu3FsqPtU6q65l0jvIjGjFqzD6zFpDvNS1rLaidA21Cx3Bqs9zBUykFWtdq4mFKaHFNrTY5zaGEggkxOTs/ZzvCYnJOfsk58/eJ/t39vu1FhNy8mcsku05n/39/L6W%2BGxiTU2FiF1j2TIv8W6FuFKVeFt24deADkusVtdyW11H3rfFar5I4o0djY0dAgAAAAAAAJQIS3yggZtt2191XbldNHDLm9voutbzIk7j%2BcbGVgEAAAAAAAAMVlD4lgjdaizLeijxbWrEZ5YlzzmO8zAhHAAAAAAAAEyVV/gWZOiWihAOAAAAAAAApsopfCurqSnrse2HxJXabD7fFWm1xO1wXas55fEyS6wyy3IHzoMb/R/Ukk1db775sAAAAOSgobambEE958oCAABgbGQdvo2vqakaZ9kvy8hnuiWCNtmdePvWRHF2Z7NAQb9vTOyqRCB3m23JShnxH9Zqdtz4F5mCAwAA2WhYf2uVbVsvOz3nqgngAAAAMBayCt%2Bm1NR81bHseskwpeYmFyW4eyaJPFfIxtLBTamWq5XWigyf1trnOl/sbWxsFgAAgAwa/u6vKmw31pD4bUXiCU/jXz7%2B2gIBAAAAimzU8G1yzcKHXEs2eX/UbbVcu66rcf9u8dmkmoW1Yrn3ZgjhOizXWhfE/18AAGA%2BrZraE6Y0yZCJ/cSTnvpEAFcnAAAAQBHZI31wxODNkicmuG51UAFYd%2BOb9a7rLkj8et7jw2Wu5b6six8EAAAgRWzClIck5agMV6S24b6lWZ1bCwAAAPgl4%2BTbpJqae6W/apqq6FNnE2sWbrIsecjjQx19rrOACioAABjw4/tufcixrE2ZPu44bvWCf3yd5w4AAAAoCs/wTc9esyxbqxopZ7y5rTqNNhYLDybX1Kx0LXt7%2Bj%2BTJP6ZnAUsYQAAAA33LV1p9y%2BIGkmrY8UXLHjs/20VAAAAIGBptdOympqyRPCmhxOHJnhTXY2Nu3XKLfHb1IUOiaDQ2i4AACDSkgsW%2Bm/UjUYXMbys58IJAAAAELC08K3HttPOSEnoGMvgbYDWS13X8Tgo2apJLmgAAACRNGSzabaBWlVswpStAgAAAARsWPimdVNxJS3E0jPewlLrTPxzPOe68nDaByx5SKf2BAAARI5Oskn6zcMRuSK36/lwAgAAAARoWPhmSSy9qmHJE8VcrpCN841vbhLXakx5uOzC1B4AAIiQAxuW6QRbleRBFzM0/N3yGgEAAAACMhi%2BTaypqRHLrRn%2BYbd1guNskhByJb5OUs9/c6WW6TcAAKJDJ9dckYKOnrBd92WtrQoAAAAQgMHwzZJY2tSY67oPdzQ2dkgIaQ3WdeWJtMdtm7PfAACIgIa//asanVyTwpXpeXEsYAAAAEAQkuFb8qw3j6k3PV9NQmyiOPWSMv1muXIv028AAJS25IKFWMzPbecVsQlTXhYAAADAZ8nwzZL0aTGdepOQ06k8j%2Bm3si6J1QgAAChJOqF2YbNphfjIFalhAQMAAAD81l87tawvpDzeEfaptwExcdKWQYwT9zYBAAAlKTbhYp14q5AAaI31rb9f9lUBAAAAfGInK6fiDtsQZrkSqu2mIznX2NicuvnUtWSlAACAktO/YMEN9r/zjtQ3rL81r%2B2pAAAAQCrblljak8s%2BcfaIUdz3Ux4oG19Tw5NmAABKyI83LL/XpwULoymzbYsNqAAAAPCFnbh7XJP2oEizGMT1qJ7GxCZ8AwCgROgkmiNuvRRPhe3GWMAAAACAgiVyNmteymN63lurGGSiR1ho2UL4BgBACUhuNrWtsQjCqg5sWLZVAAAAgALYYknZ0AdccY2aelO69VTfDH3McuRSAQAARgtqs2m2XJHahvuW1goAAACQJzvxtLJi6AOWK6fFQG5K%2BOZYw/93AQAA88QmTHlIxih4G2Bb9taGv1teIwAAAEAeEuHb8Mk3S6xTYiDLtVqHvZ/yvwsAAJilf7OphGLqzHZdFjAAAAAgL7aULIvwDQAAQzXct3RlkTabZitZf9UarAAAAAA5KNnwzRW3VQAAgHGSCxYse7uET0VswhQWMAAAACAntivSKqXAomYKAIDpksFb/4KFUP53PfG86XatwwoAAACQpbTJN9dyq8RIpbE4AgCAKEsEby/LGC9YGI3WYd/6%2B2VfFQAAACALtmVJ8/CHrAoxzMSamgpJuUPuitUsAADAGAc2LNNKpxk3AR2pZwEDAAAAsmEnnjweT3msbOLChTPEILbE0p6oO%2BIQvgEAYIgwbTbNEgsYAAAAkBXbEqsx9UHLkS%2BKQVxxa9IfK5Gz7AAAKHENf/tXNSHbbJotXcDwsgAAAAAjsC%2BSeGPao5Z7m5jEkpR/Xre1t7GRyTcAAEIuuWAhFgvjZtOsJG721VyoywIAAACe7I7Gxg5xU6ffrKqyGjNqFBNramok5WBmy02f5gMAAOEyZLNphRhM67IN9y01qTILAACAIkpuO3Ukvifl8bLztm3Gk0jbTts25ojzvAAAgFCLueN0YqxCSoBt2Vsb1t9q6Mb48GratLLsyKNf2v7LR/8T04UAAMBYlv4fnXLrsexTKR/rmOA6Vycn40JKt5xalv3b4Y%2B6rd0NDVcLAAAILV2wYOg5byNpdaz4ggWP/b%2BtgoIlgreKCePtBnGtCn0/7loL5j74YqMAAAAYJjn51l89ld0pHwv/9JttP5T2mOs%2BIQAAILR%2BvGH5vSUYvCmt0b7MBtTCHXn0S1%2BdMC7WNBC8qZjtbtdJOAEAADCMPfAbV5y00Mpy5d6wnv2WnHpz5fbhj7qtrqSFiAAAICS0mumIWy%2Blqyo2YQoVyQJoxTTxfO65xG%2BHPwd1pWLCOI8brwAAACE3GL6db2xsTF%2B8IGU9th3KDWSWZTekPuZa1vOJ/x2tAgAAQie5YMG2XpYSlwiObtdarSAnWjM98uiXEs/vrBGaF1btoUdW1QgAAIBB7KHvuBJfl3gz/Iw3V1ZOqlkYqvrppIULPQ5odlvPv/nmJgEAAKGjVcxS2GyaLa3VNvzd8hqvj/37f094lOrQIytr9Hy3RHBZM9rnUj8FAACmsVIfSAZtlqTVJVzXWZCcjhtjk2sWPuRasin18cQ/37rEP99zAgAAQufAhmXbdSJMSsRFl15%2B4e0Vw94mf1/W/3t7/PiOaZ9fMexYj6/%2B17%2Bdd6rj9Mobb5z33APfuue4ZVmtFz7Ukfh98gbouHHjWs%2BfP99RXl4e2qVXfmrZ/KV7HVdyrCK79dc%2B8C91AgAAYADL68FJNYsaxHJrUh7u6EsEcL2Njc0yRqbU1HzVsezn0j5gyRPdb74Z7uUQAABElEmbTTVUi02YIpM%2BPUNik6bIhESoFps4OfF%2BReLxycnH9G2uzp3rkvp/2i4//WnT4GP/Y9tDcvVnrxrx61zXbb0Q0HUkfv%2B%2B/l5/9fX1Nd9229dvsx3neONPzNwAqtNrE8fFtuYbyrL9FAAAmMIzfEsuM7AsPXOjIuVDHZZrretq3F/0pQaZJt60btrd0HC1AACA0GlYf%2Bvttm2F8vzYAdNuXCpX3LA072BtNBq83f93/yi/%2Bc3vBx%2BrrVsnixbfLPl6Zfc%2BeeaZF/S3HX//93/z3Px//2/ft227%2BeKLLx6zm6S50PPdtGY6dJtpzixp7emNV1dv2h2JCUEAAGAu2%2BtBXVrQ57pflNTz30TKXMt9efLChUU7RFi3reoZb5mCt8Rd4AUCAABC58KChVBv/rzsL/5SPrNkbbIqGkTw1vbHk3LvPf99MHibMmWybHlsfUHB2w/%2B%2BZWB4E2VHT/%2BoU7/b3ccp%2BnMmTOnEr8aTp8%2Bvamzs7NGQuiXj3xp5YRxsaaCgjfF9lMAAGAIa6QPTqypud2yMm07dRsTwde6ILeLJv7/11z4/1%2BR/tH%2B4I3tpgAAhE8yeAv5ggUN3v7Nf/wbCYoGbzrx9se29uT7A8HbZ0epmo6kfuuzsn/fwcH3V6xcLHfeuWakL9EbqY2JX3vi8fjusT5H7peP/qetI28zzR31UwAAEHbWaJ8wuaZmpdsfgHlulbIs2ZS40/q8nyGYTrv12Ik7ma5keHJG8AYAQJi9tWGZHm5WJSEVdPCmk25bHnlyMHib9unL5B8eu0%2BmTbtM8qHV1c2J73fo0NHBx/7zf1khf/3XKyRHenTInmXL/i/58Y93PSdFojXTieNi27PZZpoz6qcAACDkRg3f1AhnwA1oTYRwjYkQ7uFCAjGddBPb/qrlykrJFPaJ2%2By47hcJ3gAACKcDG5bpIfqhXYRUjOBNJ940MFOFBm%2BpE3Qq3zPjhoZ4V3/2qt1b6x%2BoKy8vb5UAHd68usqW%2BMsF10xHxPZTAAAQXlmFbyoZwElsu8cW1JRvaDW7ltvoOs6eiSLNHY2NHSN9T1tiVa7tfkH6A7cKGfmbPzHBcTaN9D0BAMDYCftm06CDt/373pb6rZ%2Bc2KEV040P3uNb8KbV1Y0PfkPmzp0tufIK8Z7Y9pD%2BMz4Xj8cfDiKEa9n8pXsdV%2BqlCBzLrr5%2B4y4jFk4AAIBoyTp8GzCpZmFtIoC7d4QpuFQdiUCu1RVnSGCW/NoyyTDdli5ZM9Xz5RoFAACEUsN9S1falv2yhFTQwduQDaRJGpBpUKaBWT4O/eKobH70SV8m6FK/V4YQz7cQrmnTyrL%2BZQhWMScgm6994KVqAQAACJmcwzelE2uJL91kWdZXJVgdritPTBSnnmk3AADC68KCBT3nLcsba8UVdPCmG0h37nxl8P1Fi%2BdLbd0dkq/UCbpCgrfUUDCL71VQCKfnu00YF9MQtuhn/iVu1j583YP/skkAAABCJK/wbcAnIZx8IYdJuGwQugEAYIiwbzYtdvCWxQbSnL5fIRN03336BdmzZ18%2B36s18evhSy655DnJwS8f%2BdLKxLPLjIu6ioH6KQAACJtxUoALSw9u199PrFl4uytym20lt1jl84SrQ1x53hVn90C99LwAAICwi7nJLZYVEkKXXvPvAg3e6rc%2BK/v3HRx8P88NpINSw7J8J%2Bi8tqPmGApWJH5tP3PmzBeynYI7svk/PZS4ebpJxpjtOhr%2BUT8FAAChUdDkWybja2qqYmJXJb55lSMywxKrzLKcMlffitvhunaHnuOW%2BPjpxJP1xJ1Jp5HtpQAAmCfMCxYmfXqGzPrKtyQ2Ib8z10ai4dYziaDMr%2BDNz%2B/ntVjha3etkdtuWyx5ak0EcAsyBXB6vtvEcbGXE8/paiQkqJ8CAIAwCSR8AwAApe/HG5bf64hblE2WuQo6eNNw6ze/%2Bf3gY7V162TR4pslHxqWbX7028O%2BX75hWZaLFfJi2/btF1988fNDHzu8eXWVLfGXxbUqJGSonwIAgLAoqHYKAACiqWH9rVVRDN5Sp8o03Kr95jr5/Ofzazl6fb877/pyXkFeHosVcuI4znOdnZ0VU6dOfVjfb9n8pXsd19mUuJcbyiUbtutsTbxZIAAAAGOMyTcAAJCTMC9YKHbwtuWx9fLZz14l%2BdBJty2PPDn4/TQs2/jAPXl9vwIWK%2BQs3nly0/%2B3/b8lAjerVkLPrbv2gX8JZUgMAACig/ANAABkraG2psyeMKVJIha8eQVlhUyV7d/3tjzz9A8H66H5fj8fFivkJH6mXdpf3Sa97b8TQ3T09MWrqzftbhUAAIAxQu0UAABkLTbh4u2uuBUSMkEHbzrxVmhQNiC1HqqTbhsfvCfn7xfAYoUR9ZxokZOvbROnp0sMUjZhXEy3n1I/BQAAY4bJNwAAkJWwbjYNMnhLnVDLNygb8IN/fkV27nxl8P1Fi%2BfLnYnALNd6aJCLFbyceXdP4tduMRf1UwAAMHYI3wAAwKjCutk0yODNa0JNz3jL9xy1%2Bq3PJsK8g4Pv51sPDXqxwlBuT1eyZtrzYYsYjvopAAAYM9ROAQDAiHTBguO6myRkggze/JpQU17nsv3n/7JC/vqvV0iuirlYQc91a//RNol3tksJoH4KAADGDJNvAAAgo7BuNr3o0isSwduDybd%2BSw3eCllg4HUuW23dukSYd7PkotiLFc42703WTA073y0L1E8BAEDxEb4BAICM3tqwTDebVkmIBBm8pU6W5TuhplKDt3zPZSv2YoWOAz9IhG9vSImifgoAAIqO2ikAAPB0YMOyrW5EgjedLHsmEbwNPZOtkODNrw2pxVysED/TnjzfTeumJYz6KQAAKDom3wAAQJowbjYNMnjToEwDswH5VEMH6IbU%2Bq3bB9/PN3gr5mKFnhMtcvK1bSVYM82E%2BikAACgewjcAADBMw31LV9qW/bKESFDBm1c19M67vpx38JZ6Xly%2BCxGKuVjhzLt7kue7RQz1UwAAUDTUTgEAwKD%2BBQv2dgmRYgZvWx5bL5/97FWSj9TATDek1tbdIbko5mIFt6dL/rT3e9L9m59LBFE/BQAARcPkGwAASArjZtNiBW%2BFVDr9Oi%2BumIsV9Hy3tpcel3hnu0Qb9VMAABA8wjcAAJB0YMOyBlekRkIiqODNr2UISgOzzY9%2Be9h5cfkEZsVcrHDuyNty%2BsDOCJ3vNiLqpwAAIHDUTgEAQP%2BChQgEb7oM4Zmnf%2Bhb8ObHeXHFXKzQceAHcrb5DcEg6qcAACBwTL4BABBxP96w/F5H3NBU74IM3oZuIdWz3fSMt3yWGOik25ZHnhxWW934wD05nxdXrMUKWjNtf3Wb9Lb/TuCF%2BikAAAgO4RsAABHWsP7WKtu2miQkggreUreQ6jKEO%2B9ak1fI9dOfNkn9P20vaHqumIsVek60JBcrcL7biKifAgCAwFA7BQAgovoXLFgvS0gUK3grJORKrYjqpNvGB%2B/JKXgr5mKFs817pePATsGoqJ8CAIDAMPkGAEAENdTWlNkTpujEW4WEQFDBW2qtM58tpANSQ7zPf75aar%2B5LqfpuWItVnB7upLnu5078hNBLqifAgAA/xG%2BAQAQQQc2LH/ZFXelhEBQwVv91mdl/76Dg%2B8XErylfq98pueKtVhBz3dre%2Blxaqb5oX4KAAB8R%2B0UAICI6d9sWrrBm06Vaa1TlyIMyLfW6XU2Wz4hXrEWK5w78racPrBTnJ4uQV7KJoyPbU28/aIAAAD4hMk3AAAiJEybTYMI3vQ8tc2PfnsweNNw6867viyLFt8sufI6m622bl1O36uYixW0Znq2%2BQ2BD1z54rUPvrRbAAAAfED4BgBARPQvWIjpOW9lMsaCCt6GhmUavG15bH1yKYIf3yvXs9mKtVhBa6a6zbTnwxaBb7R%2BenX1pt0dAgAAUCBqpwAARMCF4K1BIhK86XlqGx%2B4J6/gTafm9HsNLEXI52y2Yi1W6DnRkgzeON/Nd1o/1e2n1E8BAEDBmHwDACAC3tqw7LcSgs2msYlTpPJr/%2BBr8OZHWDZg/763pX7r9sH38/lexVqscLZ5r3Qc2CkIEPVTAADgA8I3AABK3IENy7a6IrUyxjR4m/VfH5RJn54hfvnpT5uk/p%2B2%2BxK8/eCfX5GdO18ZfF%2Bn5rS2mstShGIsVnB7upLnu5078hNB4KifAgCAglE7BQCghPVvNi3N4C11Si2fsGxAavC2aPF8qa27I%2BuvL9ZiBT3fre2lx6mZFg/1UwAAUDAm3wAAKFEN9y1daVv2yzLGggjevMKyO%2B9ak3PwpqHZM0%2B/kAjyDg4%2B9p//ywr5679ekfX3KNZihe4Pfi6n9n1PnJ4uQXHFXWvB3AdfbBQAAIA8EL4BAFCCwrLZtFjBWy5TagM0eNPQTM%2BMG5BraFasxQpaMz3b/IZgjFjS2tMbr6Z%2BCgAA8kHtFACAEhOWzaZBBG%2BpZ6rlOqU2IHVaTUOzO%2B/6ciLIuznr71GMxQpaM9Vtpj0ftgjGkCsVE8bZDyV%2BVycAAAA5YvINAIAS89aGZTrxViVjKIjgrX7rswXVQwfopNuWR54cFrzpWXF6Zly2irFYobf9d9L%2Bo22c7xYi1E8BAEA%2BCN8AACghyQULlrVJxpDfwZvXMoN8z1QrdDtqsRYrnG3eKx0HdgpChvopAADIA7VTAABKRCkGb1oP3fzot4edy1Zbty6neuiA1JqoTrptfPCerIO3YixWcHu65PS7ezjfLayonwIAgDww%2BQYAQAloWH9rlW1bTTLGKr/2mK/BW%2Bq5bLnWQwekLmn4/Oerpfab67KuiRZjsYKe79b%2B6rZk3RThRv0UAADkgvANAADDDVmwUCFjaMbyu%2BVT874gfkgN3rQeuvGBe/IK3lLPZ8u1JlqMxQrdH/xcTu37njg9XQIDWNJ66oY7vnjmqv%2BtY%2BmcP28VAACAERC%2BAQBgsIbamjJ7whSdeKuQMeRn8KYVUw3e8j2XbYDX%2BWy5LmkoxmKFM%2B/uSfzaLTDL2VmL5UzVJyFu4kl1qyvSkfiNngfXmni/w4k7p21xW53Er%2BTXnB/X/MXqcs6LAwAgYjjzDQAAg8UmXLzdFbdCxpCfwVtqvTPf4M3rrLhczmcrxmIFPd9Na6Y9H7YIzHPxr/fJ%2Bc9Uy8dX9FeP3YEA3JXBN5Zt97%2B98DVTE5ntvqOn%2BoM6S1oTH%2BywEm8dxzkurtPsxt2Oc73jWwnoAAAoLUy%2BAQBgqDAsWPAzeNu/722p37p98H2tmOoZb7lOmXmdFZfL%2BWzFWKyg57q1/2ibxDvbBeaKT7lc2pZ8S9zx/k1CXqATdM0azrmO875lu82u43YwOQcAgJkI3wAAMNCPNyy/1xG3XsaQn8Fb6kKEfOudXpXVXM6KK8ZihbPNe5M1U853Kw2p9dMiSAZziSfxzQMTc4RyAACEG%2BEbAACGCcNm0yCDt0WL50tt3R2SK52ce%2BbpH%2BZdWQ16sYLWTE%2B/uycRvr0hKC3tNesH66djqFUXQbhx5y2dlHN6ndZbrp/WLAAAYMwRvgEAYJAwbDYNMnjLdSFCpu%2BTa2U1dbGCfv3GB%2B/xLXiLn2lPnu%2BmdVOUngDrp4UanJJz3fhbBHIAAIwNwjcAAAwRhs2mfgZv9Vuflf37Dg6%2B71fwlsvkXDEWK/ScaJGTr22jZlrixqB%2Bmq9hgVxnV6yRyioAAMEifAMAwBAHNizb6orUyhjxK3jzCrzyWWig3%2BeZp1/IO8DzWqyQbwCYyZl39yTPd0M0hKR%2Bmo9mKxHIxePxtyTuNDMdBwCAvwjfAAAwwFhvNv3z//Al%2BbO/XCWF0sBr86PfTi5GGFBbt04WLb5ZcqHBmwZnQ79PLsGZ12KF2m%2Buk89/vlr8oOe7ac2058MWQXSEuH6aK52Ea3Rd5y23L95IGAcAQGEI3wAACLmG%2B5autC37ZRkjfgZvQyfN8t0k6vV97rzry1kHeEEvVtBz3dp/tE3ine2C6DGofpqLZBjnOPE9TMYBAJA7wjcAAELswoIFPeetTMZAUMGbBl4bH7gnudggFzrptuWRJ4cFb7pYIdvvE/RihbPNe5M1U853izaD66fZarUsnYyL7%2BHMOAAARkf4BgBASI31ZlO/grfUwCzfSbPUqmgu36cYixU6DvwgEb69IUAJ1U%2Bzo0Gc4%2ByhogoAgDfCNwAAQuqtDct04q1KxoBfwVshgdlQqVXRXCbWgl6sED/TnjzfTeumpeJXf7LkskmS%2BOUK8lOi9dNsMBUHAEAKwjcAAEJoLDeb%2BhW87d/3ttRv3T74fr4Vzx/88yuyc%2Bcrg%2B/rGXF6VpxWTkcT9GKFnhMtcvK1bSVVM33zuCW7Wmy55lOu1N3gCPL30ZKHpLcst2p1CdqtZ8XFJda4dE55qwAAEEGEbwAAhMxYbjb1K3hLnVTLJTAbKvWMtlyqokEvVjjz7p7k%2BW6l4mS3JTsOW8mptwGrKx1ZOIPpt3xp8KYBHC6wpNGJx58niAMARA3hGwAAIdLwt39VY8eS57wVnV/BW%2Bqk2qLF86W27g7JhdcZbblURYNcrOD2dMmf9n5Pun/zcykVzW2WfP%2BQLV196R/beJMj0y8hgMtX57UrpPM6fyrOJYUgDgAQIYRvAACExFguWAgqeMvnbDU9o23zo99OLmoY8LW71shtty0e9WuDXqyg57u1vfS4xDvbpRR09Vny2jGtmtqeH9dz3%2B6ujsv0qYICUD8dBUEcAKDEEb4BABACDbU1ZfaEKbpgoUKKzK/grX7rs7J/38HB9/MN3oYuR9CaqtZVtbaa69fm%2B8%2BQybkjb8vpAztL5ny3E52WPNVky8lu74/P%2BpSbCN4cmTxOUCDqpzm4EMSdOx/bzbIGAECpIHwDACAEDmxY/rIr7kopMj%2BCt0IrogN00k3Ds6GbUTc%2BcE%2ByMjqaoBcrdBz4gZxtfkNKxcBSBS8ati2b6crCGWO/bEEn87p7S2PrKvXT3FmWPKdbUxfPvrx0DlcEAEQS4RsAAGNsrBYs%2BBW8aWA2tCJaW7dOFi2%2BWXKhm1GfefqHw4K3bJcjBLlYQWum7a9uk97230kp8FqqMFSYaqYDk3mTxrmycX5pbF2lfpq31kQQ1/hxXB6mlgoAMBHhGwAAY%2BjHG5bf64hbL0XmR/BWSEV0qNRz4nTSbctj67PajOr1tX4tVug50ZJcrFAq57tp4PadJu%2BlCkq3mi6bGY6aaepk3vLPOclpPNP1XDFbTtasFxSk2XHiT3A%2BHADAJIRvAACMkYb1t1bZttUkRRZU8KaBWTYV0aG8NqPeedeaUYM3nZCr/6ft8tOffvLH5%2BdihbPNe6XjwE4pBaMtVdCw7StzHamaFo5w6/22/om3VHU3OHLNp8wP4E7PWyPnrhl9eQhGp7VUJ973/JI5VzQKAAAhRvgGAMAYGKvNpn4Eb1ox3fLIk4PBWz41Tw3Pnnn6hbwWNAS5WMHt6Uqe73buyE%2BkFGjNVIOsE53eH9elCl%2B93knWTcNEJ/Sa24Y/TdV/xvvnx41fAOGMnywf3fKQxCcXPp2JQa2OE3%2BYaTgAQFgRvgEAUGRjtdnUr%2BAtdSlCPsFb6jlx2YZnqcGfn4sV9Hy3tpceL5maqVY3XzuWuWa6ujIcSxW8dCf%2BmTcfjKVtYl00w5VVleaf/0b9NDAdliW7ORsOABA2hG8AABTZgQ3LtroitVJEfgRvuhShfuv2wffzOV/Nq656511fzmpBQ5CLFc4deVtOH9gpTk%2BXmE5rpt9pMmOpwkj0n3/re9RPkSdLGp14/Plb5lz%2BnAAAMMYI3wAAKKKx2GzqR/CWGnzpUgVdrpDNUoQBXlNr2Z4TF%2BRiBa2Znm1%2BQ0qBBlY7DttpE2MDwrRUIRu6dEEn%2BIaifoocUUkFAIw5wjcAAIqk4b6lK23LflmKaNqNS%2BUzS9ZKIbyWItTW3SG5OPSLo7L50SdzrqsGuVhBa6a6zbTnwxYpBbtaLGOWKmQrU/10XuJ/x93V1E%2BRG13QQCUVADAWCN8AACiCCwsWNEEqkyK57C/%2BUv7Nf/wbKURq8JZP8JU6NZft1FqQixV6TrQkg7dSON/N1KUK2TrRaSUCuPRQcXWlk5zkMx310%2BJjSyoAoNgI3wAACNhYbDb1I3ir3/psXttIh0oN77Ktqwa5WOFs817pOLBTSoHJSxVysT/xv/PFluEB3KRxIhvna6hodgBH/XQMcS4cAKBICN8AAAjYWxuW6cRblRRJocGbVj2fefqFgoO37ya%2Bx549%2Bwbfz3ZqLqjFCm5PV/J8t3NHfiKm06UK3z9kSXNb5qUKa68vjcUEA3T5QuoSCf3fpwsYTEf9dMwlz4UjhAMABIXwDQCAABV7s6kfwZtWPXXybEBt3bqstpEO/R6p57RlG94FtVhBz3dre%2BnxkqiZjrZU4aYrXVk1x5ylCtnS/71bDsbSpvyon8JHhHAAgEAQvgEAEJBibzYtNHhLPWMtn6qnfo/Nj357WHj3tbvWyG23jRwqBLlYofuDn8upfd8Tp6dLTDfaUoVlM0ujZpqJV/1UbbzJkemXUD%2BFbwjhAAC%2BInwDACAADX/7VzV2LHnOW1EEEbxteWx9cvKskO%2Bh57vpOW%2B5fJ3ya7GC1kzPNr8hptOlCjsOW2m1ywGmL1XIhVf9VP933z8/bvy0H/XT0CGEAwD4gvANAACfFXvBQqHBW%2Bpyg3zOWNPvoQGaTrANfI%2BND9wzangX1GIFrZnqNtOeD1vEdKMtVdDKpVYvoyJT/XRR4s9hVQn8OVA/DSVCOABAQQjfAADwkYnBW2polmvwtn/f2/LM0z/M%2BXsEtViht/130v6jbcaf76ZLFV47JhlrpqW4VCFb77dZ8lRT%2Bp%2BLLl8w/c%2BD%2BmmoEcIBAPJC%2BAYAgI8ObFj%2BsivuSimCSZ%2BeIZVfe0zylRqa5bPcwGtBgtZVdYIt16/zY7HC2ea90nFgp5hutKUK86a5snZu6S1VyMWuFjs5FTgU9VMUCSEcACAnhG8AAPikmAsWNHib9ZVvSWzC5Ly%2BPnXqLNvQbKjUAG3R4vly511rRvweQS1WcHu65PS7e0rifDcNlHa1RHepQra6%2B0Q2H4ylBZTUT1FEhHAAgKwQvgEA4IMfb1h%2BryNuvRRBocGbV2hWW3eH5KJ%2B67Oyf9/BwfezWZAQ1GIFPd%2Bt/dVtybqpyUZbqjB9qsjd1fFILFXIlv5Z6QKGVF%2BvdqRqGvVTFE2r6/StWzLnikYBAMAD4RsAAAVqWH9rlW1bTVIEfgdvuU6d6eSaBmh6VtyAbAK0oBYrdH/wczm173vi9HSJyZrbLPn%2BIZYq5MOrfjppnMjG%2Bbr91ewAjvqpWSxLnvs4Lg8vnVPeKgAADEH4BgBAAYq5YKHQ4O27T78ge/bsG3w/16kzr8m12rp1smjxzSN%2BXVCLFc68uyfxa7eYjKUK/thy0Jbfdw5/Wqt/ZrqAwXTUT81DCAcASEX4BgBAnhpqa8rsCVN04q1CAlZI8KbTas8kgrdca6JDeU2u6RlxelbcSIJYrKDnu2nNtOfDFjHZic7%2BjZ2ZlirMSoRHd1dHe6lCtvTPcMvBWNrkoE4L6tSgyaifGqvVsuW5RbPKHxYAQOQRvgEAkKcDG5ZtT7ysv10CVmjwlloTzWZabahDvzgqmx99cnArajaTa0EtVtBz3dp/tE3ine1iMpYq%2BG9/4s/0xZQ/U%2BqnCAGWMgAACN8AAMhHsTabFhK8pdZEdVrtzru%2BnFPw5rUVdbTJtaAWK5xt3pusmZp8vttoSxW0Zlp3A0sV8qXLF1L/bKdPdZMBnOn%2BdPM35PyVhZ2RiDG1u9eROqqoABBNhG8AAOSoYf2tt9u2tV0C5nfwlk1NdKjUyujcubMTwds3kt8rkyAWK2jN9PS7exLh2xtiMg2FvtM08lKFZTOpmRYiU/10UeLPdpXhCyu0fvrHZY%2BJOz6/Mx8RDpYl9R/H5QlCOACIFsI3AABycGHBgnYpyyRAF116hVTe%2BZgvwVs%2BCw5SlzNkUxkNYrFC/Ex78nw3rZuaarSlChq2fb2apQp%2BeedDnS5M/7PW5Qum/xl3X1ktp27%2BhsB4VFEBIGII3wAAyFKxNptq8DbrKw8m3%2BZKJ880eMvlfLahvM5qy6YyGsRihZ4TLXLytW1G10yzWarw1esdaqY%2B0wnD5rbhT3P1z/j%2B%2BXHjJwupn5aU5l5HvsgUHACUPsI3AACy9NaGZZpIVUmACgne9u97W555%2Bod5B286Mbf50W8PW87wtbvWyG23Lc74NUEtVjjz7p7k%2BW4m06UKrx3LXDNdXclShaB0J/7MNx%2BMpYWe1E8RRpYtm9iKCgCljfANAIAsHNiwbKsrUisBKjR4q9/6yTF0OnmmZ7yNdD7bUF5nxI12VlsQixX0fDetmfZ82CKm0prpd5pGXqpwd3Vcpk8VBEj//HUBQyrqpwgpqqgAUMII3wAAGEUxNpsWErylVj4XLZ4vd961JuvgLXVJgk7MbXzgnhGXMwSxWEHPdWv/0TaJd7aLqTTw0fPGMtVMWapQXLta7OQE4lCTEn/2j37B/Pppe816%2BfiK2YLSYlny3MdxeZgqKgCUFsI3AABG0HDf0pW2Zb8sAfIzeMu18plPVTWIxQpnm/cma6Ymn%2B%2B2q8UacanCV%2BY6UjWNpQrFlKl%2BOi/x7%2BHuarPrp/Epl0vbkm9RPy1NTMEBQIkhfAMAIINibDYtJHhL3Uiaa%2BUzNUTLZklCEIsVOg78IBG%2BvSGmOtndv1ThRKf3x1mqMLZ06cXmg%2Bmh6OpKJzmJaLKzsxbLmarCzldEeDEFBwClg/ANAAAPxdhsmm/wplNqzySCt/37Dg4%2BlmvwlmtVNYjFCvEz7cnz3bRuaiqWKphhf%2BLf04stwwM4rZ9unK%2BhqNkBHPXTktfhus7DSyovqxcAgLEI3wAA8HBgw7KGxEvyGglIIcGbLjnIZSNpqvqtzw4L7kYL0YJYrNBzokVOvrbN2JqpLlX4/iFLmtsyL1VYe735B/uXEl2%2BkLoEQ//96AIGk1E/jQhLGnvjso4pOAAwE%2BEbAAApgl6wkG/wpiHY5ke/PRi86ZTanXd9WRYtvjmrr/cK7kYL0YJYrHDm3T3J891MxVIFM%2Bm/ry0HY2lTitRPYRCm4ADAUIRvAAAM8eMNy%2B91xA3shU0hwdvQ6TMNwbY8tn7EjaQjfb2qrVs3YnDn92IFt6dL/rT3e9L9m5%2BLqUZbqrBsJjXTMPOqn6qNNzky/RLqpzAEU3AAYBzCNwAALmhYf2uVbVtNEhC/grdcQ7B8gju/Fyvo%2BW5tLz0u8c52MZEuVdhx2EqrLQ5gqYI5vOqn%2Bu/t/vlxo6cVqZ9GDhtRAcAghG8AAEjwCxbyDd609qnBmVZGVa7B26FfHJXNjz6Z9dcHsVjh3JG35fSBncae7zbaUgWtLGp1EWboTvx7fOCt9PrposS/x1WG/3ukfho9bEQFADMQvgEAIq%2BhtqbMnjBF06YKCUC%2BwZsGYBqE5Ru87d/3ttRv3T74/mhfH8RihY4DP5CzzW%2BIiXSpwostIu986F0zZamCuXTyTSfgUunyBdP/fVI/jaRW15F1S%2BaUNwoAIJQI3wAAkXdgw/KXXXFXSgDyDd5SgzOtfWpVVCuj2Uitjc6dO1s2PviNjF/v92IFrZm2v7pNett/JyYabanCvGmurJ3LUgWT7Wqxk1ONQ1E/hcksWzYtmlX%2BsAAAQofwDQAQaUFuNs03eEsNzhYtni933rUm6%2BDtu0%2B/IHv27Bv29bV1d2T8fL8XK/ScaEkuVjD1fDcNZHa1sFSh1Gn9dPPBWFrAetNn3OREo8mon0Zaa68jC6ihAkC4EL4BACIryM2mfgZvIwVnQ2k99ZlE8LZ/38HBx0arjfq9WOFs817pOLBTTDTaUoXpU0Xuro6zVKGEZKqfavimIZzJqJ9GWofjxOtYxgAA4UH4BgCIpAsLFvSctzLxWb7BW%2BrEWi7nrel5bZsf/XayPjrga3etkdtuW%2Bz5%2BX4vVnB7upLnu5078hMxUXObJd8/xFKFKPKqn04aJ7Jxvm6vNTeAo34Ky5J6%2B5w8vKC6vEMAAGOK8A0AEDlBbjbNN3ir3/psThNrQ6UuShjtvDa/Fyvo%2BW5tLz1uZM1Ulyq8dkyrpixViLItB235fefwp8X671wXMJiM%2BimEGioAhALhGwAgct7asEzHvarEZ7GJU2TWf31QJn16RtZfoxNomx95Ug4dOjr42EgTa6lSFyXoeW0bH7gnWR/N5vMLXaxw7sjbcvrATnF6usQ0JxJhy1NNmZcqzEqEL3dXs1QhCvTvwJaDsbTJR5121KlHk1E/RUKH6zoPL6m8LJBjFgAAoyN8AwBEyoENy7YmXkrXis/yCd68qqK1detk0eKbs/p63Yj6zNM/TAZ4arRFCX4vVtCa6dnmN8RELFVAqv2JvxMvpvydoH6KUqI11EXXlNcJAKDoCN8AAJER1GbTfIO31KrolsfWZ5xYS5UapI22KMHPxQpaM9Vtpj0ftohpWKqAkejyhdS/G9OnuskAzmTUTzEENVQAGAOEbwCASGi4b%2BlK27JfFp/5EbyNVhVN5bUR9c671iQDvFR%2BL1boOdGSDN5MPN8tm6UKy2ZSM42yTPXTRYm/G6sMX7hB/RRDtCZ%2B1S2eXb5bAABFQfgGACh5QW02zSd404qpBm/ZVkVTpS5mGClI83uxwtnmvdJxYKeYZrSlChq2fb2apQro986HOh2Z/ndFly%2BY/HeE%2BilSWbZsWjSr/GEBAASO8A0AUNKC2myaT/B26BdHZfOjT%2BYVvHktZhgpSPNzsYLb05U83%2B3ckZ%2BIabJZqvDV6x1qphhGwzcN4YbSvyP3z48bPRlJ/RQedvc6UkcNFQCCRfgGAChpBzYsa3BFasRH%2BQRvuhyhfuv2wfe1YqpnvHlVRVN5TbCNtJjBz8UKer5b20uPG1kz1aUKrx3LXDNdXclSBXjrTvyd2XwwlhbaUj9FieIcOAAIGOEbAKBkBbFgIZ/gLfWMNp0%2B0ym0fII3/ZqND35D5s6dndX/r0IWK3R/8HM5te974vR0iUm0ZvqdpsxLFXSCSZcq6HIFIBP9%2B6MLGFKZXj/tLbtKPlrykAApOhK/1nEOHAAEg/ANAFCSfrxh%2Bb2OuPXiIz%2BCN12OUFt3R1Zfm0tN1e/FClozPdv8hphGAxOtDGaqmbJUAbnY1WInJyiHmpT4u/PoF8yun3Zeu0I6r8vv7EeUNs6BA4BgEL4BAEpOw/pbq2zbahKffXb1f5NLr/l3WX9%2BavCWy7KD1JrqSMGbn4sVtGaq20x7PmwR0%2BxqsUZcqvCVuY5UTWOpArKXqX6qk286AWcynX7TKTgglWVJ/aJryusEAOAbwjcAQEkJasHCjOV3y6fmfSHrz0/dSppLGJYa2mnFVKumXjVVPxcr9Lb/Ttp/tM24891OdvcvVTjR6f1xliqgELq0Y/PB9FB3daWTnKQ0FfVTjKK515Evcg4cAPiD8A0AUDIaamvK7AlTdOKtQnyUS/DmtZX0a3etkdtuW5zV13/36Rdkz559g%2B%2BPVFP1c7HC2ea90nFgp5iGpQoohv2Jv2cvtgwP4LR%2BunG%2BhrrmBnDUTzEKFjEAgE9sAQCgRMQmXKw9zQrxUS7B20D9c2jwpltJswnekme2bX12WPCm03KZgjedjhsavOlihXyCN7enK3m%2Bm2nBW/9SBTt5JpdX8KZTbhvnxwne4Avdcpq6ZEErqTsOm30fe%2BovX5HxHb8XIIOK8bY07Tt6aqUAAArC5BsAoCQEsdk0n%2BAt262kqV%2B7%2BdFvJyukAzJNy/m5WEHPd2t/dVuybmoSlipgLOjfty0HY2lhr%2Bn1054rZsvJmvUCjIRFDABQGMI3AIDxgthsWkjwpvXPjQ/ck5xGy/VrNbS7864vy6LFN4/6uSrfxQrdH/xcTu37njg9XWKS0ZYqrKp05abPMO2GYHjVT9XGmxyZfom5AdzpeWvk3DXZVeMRXQRwAJA/wjcAgNEuLFjQMbAy8UkuwVvqwoNczl3z%2BtpMoZ2fixXOvLsn8Wu3mISlCggLrTs3tw1/Cq1/7%2B6fHzd22tIZP1k%2BuuUhiU/O/bxIRItlyXOLrilfJwCAnBC%2BAQCMFcRm01yCt0O/OCqbH30yWQVVuQRv%2B/e9Lc88/cOsvtavxQp6vpvWTHs%2BbBGTjLZUQSt/Wv0DikHPenvgrfT6qZ4Lt8rgv4fUT5GD5liXLFhQXd4hAICsEL4BAIz11oZlv5UxCt40PKvfun3wfZ1W2/LY%2BuRE2mhSwzT92o0P3uMZpulihZ07X8nqc0ei57q1/2ibxDvbxRS6VOHFRE74zofeNVOdNlp7vZN2ED4QND13cOt76X8v624w%2B%2B8j9VPkgE2oAJADwjcAgJEObFi2NfESt1Z8Mn3JWrnixqVZfW5qeKZLFXS5QjbBW2qYtmjxfLnzrjVpX%2BvnYoWzzXuTNVOTzncbbanCvGmurJ3LUgWMHd20q1OZQ1E/RcQQwAFAlgjfAADG8Xuz6Z//hy/Jn/3lqqw%2B1ys8q627I6uvrd/6rOzfd3Dw/Uxhml%2BLFbRmevrdPYnw7Q0xiQYau1oyL1VYNtOVhTOomWJsaf1088FYWkCswfDd1dRPERmtTq988Zbry5sFAJAR4RsAwCgN9y1daVv2y%2BKTQoK3bAMxnWLb/MiTcujQ0VG/1q/FCvEz7cnz3bRuagpdqrDjsJWcevMyfaokQo04SxUQGpnqp1qHvukz1E8RGR2uI19cMqe8UQAAngjfAADG8HuzaS7BW%2BrUWrbBm9cUW23dOlm0%2BOa0z/VrsULPiRY5%2Bdo2o2qm7/zBkhePsFQB5vGqn04aJ7Jxvm7fNTOAo36K/MRuXzz7kucFAJCG8A0AYAS/N5tmG7zlMrWWKjV40yk2PRtOz4hL5ddihTPv7kme72YKXarw2jGtmrJUAebactCW33cOf1qtf2d1AYOpqJ8iH67r1C2pvKxeAADDEL4BAIzw1oZlOvFWJT7IJXjT8EyroAMyTa2l0q/Rr9XvoTJNsXktVsi0hGEker6b1kx7PmwRU5xIhBVPNbFUAebTv8NbDsbSJjd1WlOnNk1F/RT5sGzZtGhW%2BcMCABhE%2BAYACD0/FyxkG7zlMrWWav%2B%2Bt6V%2B6/bB9zMFb34tVtBz3dp/tE3ine1iCpYqoNTsT/ydfjHl7zT1U0QVARwADEf4BgAItTAEbxqebXzgnmQVdDSp9VEN6zS0S51i81qscOddX85qqm6os817kzVTU853Y6kCSpkuX0j9uz19qpsM4ExF/RT5IoADgE8QvgEAQqth/a1Vtm01iQ%2ByDd5SQ7Fclh589%2BkXZM%2BefYPva320tu6OtM/zWqyQbbg3VMeBHyTCtzfEFM1tlnz/0MhLFZbNpGYKc2Wqny5K/N1eZfDCEOqnyBcBHAD0I3wDAISSnwsWcgnesjmnLZV%2B/jOJ4C2bbah%2BLFaIn2lPnu%2BmdVMTjLZUQcO2r1ezVAGl4f22/rMMU%2BnyBVP/jlM/RSEI4ACA8A0AEEINtTVl9oQpOvFWIQXKNnhLPact21BMK6qbH/32sKUMX7trjdx22/ApEb8WK/ScaJGTr20zpmY62lKFWYkw4qvXO9RMUVL0PEM913Ao/Tt%2B//y4sZOd1E9RCAI4AFFHsQMAEDqxCRdvd8WtkAJlG7yl1kAzndOWymspg9e5bX4tVjjz7p7k%2BW6m0PDhtWPeNVOWKqCULZ/pyPttsWGhs/7%2B9cTPg6n10wkfHZUpv9pH/RR5cR3ZtP/Xp4QADkBUMfkGAAgVvxYsZBu8pdZAM53TlsrrbDivc9v8WKzg9nTJn/Z%2BT7p/83MxwWhLFXQCSJcq6HIFoFTp339dwJBKK9ZV06ifIpqYgAMQVYRvAIDQ%2BPGG5fc64tZLgfIN3lasXCx33rlm1K/T6qhWSEc7G86PxQp6vlvbS49LvLNdTKCBw47DmWumLFVAlHjVTycl/u7r9tPLJpkZwFE/RaEI4ABEEeEbACAU/Npsmm3wVr/12awWJKRKDdQynQ3nx2KFc0feltMHdhpxvls2SxW%2BMtfciR8gH919IpsPxtLCaF28oAsYTMX2UxSKAA5A1BC%2BAQDGnF%2BbTbMJ3nLZTJoqNVD7/Oerpfab64adDefXYoWOAz%2BQs81viAm0ZqpLFU50en%2BcpQqIMl06svlgeii9utJJToKaiPop/EAAByBKCN8AAGPKr82m2QZvuvhg6GbS2rp1WZ2/ljop51VR9WOxgtZM21/dJr3tvxMTjLRUQa2uZKkCsD/xc/Jiy/AAjvopQAAHIDo4cQUAMKZiE6Y85BYhePPaTKobTXWz6Ug0sNv8yJNy6NDRwce8AjU/Fiv0nGhJLlYw4Xw3rZl%2B/5AlzW0sVQBGs2iGK79oc4ctIdFKqi4mqbvBzPBNt59O/EOTnL%2ByWoB8sQUVQFQw%2BQYAGDN%2BbDbNN3jb8tj6URcfeE2yeU3K%2BbFY4WzzXuk4sFNMwFIFIHf687LlYCxtStT0%2Bukflz0m7vjsK/WAt9jti2df8rwAQIkifAMAjImG%2B5autC37ZSnAZX/xl/Jv/uPfjPg5qRNpmTaTpsp2Uq7QxQpuT1fyfLdzR34iJtjVYo24VGFVpSs3fYaaKeDFq36qNt7kyPRLzAzguq%2BsllM3f0OAwhHAAShdhG8AgKK7sGBBz3krkzxlG7xpgKbVUZVt8JbN1/mxWEHPd2t76XEjaqYsVQD88Z3Ez1FqXVt/bu6fHzd2WvRPifCN%2Bil80OH0yoJbri9vFgAoMYRvAICi8mOzaTbB2/59b8szT/9wMEDLdiJNv65%2B6/bB972CNz8WK5w78racPrBTnJ4uCbvRlipoZU6rcwBGp2e9bT4YS6tt67lwqwz9OaJ%2BCh8RwAEoSYRvAICiemvDMh0Vq5I8ZRO8pZ7BpsGbnvE22kSaV4U09ev8WKygNdOzzW9I2OlShRdbRN750LtmqtM6a6935JpPmVmXA8aKnpu49b30n6u6G8z9eaJ%2BCh%2B19jqyYOmc8lYBgBJB%2BAYAKJoDG5ZtTbysrJU8ZRO8pQZoWgWtrbtDRpPN1xW6WEFrprrNtOfDFgm70ZYq3HSlK6vmsFQByNeuFjs5VTqU6fXT9pr18vEVswXwAQEcgJJC%2BAYAKIpCN5vmE7ytWLlY7rxzzYhfo7XUZ55%2BQfbvOzj4mFeFtNDFCj0nWpLBmwnnu736QX/N1IuGAstmurJwBjVToBCZ6qfzprlyd7WZP1/xKZdL25JvUT%2BFX5pjXbJgQXV5hwCA4QjfAACBa/jbv6qxY8lz3vKSTfD23USAtmfPvsH3szmDTYM3PbtNq6SZvs4rnMt1scLZ5r3ScWCnhJ0uVdhx2EpOvXmZPlUSoUCcpQqATzLVT/UMRT1L0URnZy2WM1VrBPCFJY2LrylfIABgOMI3AECgCl2wMFrwlu3kWqrUpQleZ7fp52x%2B9NsjhnMjcXu6kue7nTvyEwm7d/5gyYtHWKoAFNurxyx57YPhAdykcSIb5%2Bv2YDMDOOqn8JNlSf2ia8rrBAAMRvgGAAhMQ21NmT1hii5YqJA8XHrNv5PPrv5vGT/uNblWW7du1OUHXksTdLHC0LPbCl2soOe7tb30eOhrprpU4bVjutGUpQrAWNly0Jbfdw5/Wq4/c7qAwUTUT%2BE3y5ZNi2aVPywAYCjCNwBAYA5sWP6yK%2B5KycOkT8%2BQWV/5lsQmeL94y2ZyzctPf9ok9f%2B0PRncKV2a8A%2BP3Tfs7Lb9%2B96WZ57%2B4bDPyWWxQvcHP5dT%2B74nTk%2BXhNmJxIv9p5oyL1XQs6fWzmWpAhA0/RnccjCWNnlK/RQYKnb74tmXPC8AYCDCNwBAIApZsJBP8JY6ueYldVup19KEQhcraM30bPMbEna6ZVG3LXphqQJQfPsTP5MvtqTXT795gyPTL6F%2BCiinV6pvub68WQDAMIRvAADf/XjD8nsdceslD7kGb16Ta15SQ7XPf75aar%2B5bnBpQqGLFbRmqttMez5skTBjqQIQXrp8IfVnc/pUN3n%2Bm4monyIAHb2OVC%2BdU94qAGAQwjcAgK8a1t9aZdtWk%2BRhtOBNz2HT4G2kyqiX1E2oK1Yuljvv/KQOVehihd7230n7j7aF/ny35jZLvn9o5KUKy2ZSMwXGSqb66aLEz%2BYqQxeeUD9FAFpjXVK9oLq8QwDAEIRvAADfFLLZdLTgLfUctmzqoPq5mx95Ug4dOjr4WGqoVuhihbPNe6XjwE4JM5YqAOZ4v63/LMZUunzB1J9R6qfwnSWNi68pXyAAYAjCNwCALwrZbJpN8Fa/dfvg%2Bxq86RlvI9VBvabZvnbXGrnttsXDvm%2B%2BixXcni45/e6e0J/vNtpShVmJF/NfTQRv1EyB8NDzGPVcxqH0Z/T%2B%2BXEjJ1OpnyIIliX1i64prxMAMADFEgCAL2ITpjzkBhC8pZ7Vls05bF4LGTY%2B%2BA2ZO3d2xu%2Bby2IFPd%2Bt/dVtybppmOmL99eOeddMWaoAhNfymY683xYbFprr719P/DybWD%2BNnWuXqf/6CvVT%2BMp1pXZvy8njSyovy%2BuMWQAoJibfAAAFy3ezaa7BW%2BpZbV68zoUbOs1W6GKF7g9%2BLqf2fU%2Bcni4Jq9GWKugEjS5V0OUKAMJJf351AUOqr1c7UjWN%2BikwwHVkwZI55Y0CACFG%2BAYAKEjDfUtX2pb9suRotOAtdUlCNgsQvGqkQxcyFLpY4cy7exK/dkuY6Qv27zSxVAEoBV7100mJn13dfnrZJPMCOOqnCEhrbyKAYwMqgDAjfAMA5O3CggU9560sl6%2B76NIrEsHbg8m3qbwm07IJyLxqpEPPhStksYKe76Y1054PWySsRluqoGHbV%2BaaOzEDRFF3IkTf%2BjNbft85/Cm7Ll7QBQwmYvspAtIc65IFbEAFEFaEbwCAvOS72XS04E0royMtSfDidS5cbd0dg%2B8XslhBz3Vr/9E2iXe2S1hpzVSXKpzo9P44SxUAc%2BnSFA3gUqdZV1c6yUlWE1E/RRBYwAAgzAjfAAB5eWvDMp14q8rla0YK3lIrodlMpmUzJVfIYoWzzXuTNdMwn%2B820lIFtbqSpQqA6fYnfs5fbBk%2B1Ur9FEjnuk4dCxgAhBHhGwAgZwc2LNuaeLlXm8vXjBa8pW4n1croSJNpXlNyQ4O3QhYraM309Lt7EuHbGxJWWjP9/iFLmttYqgBEgS5fSF2iQv0USOf0SvUt15c3CwCECOEbACAn%2BWw2zSV4S12S4MUrrBs6JVfIYoX4mfbk%2BW5aNw0rfQG%2B47AtJ7u9P85SBaD06M/7loOxtCnX5Z9zEj/v1E%2BBIVjAACB0CN8AAFlr%2BNu/qrFjyXPesjZS8KbhmIZombaTevFanDB0Sq6QxQo9J1rk5GvbQl0z3dVijbhUYVWlKzd9hpopUIq86qdKp990Cs401E8RGEsaF19TvkAAICQI3wAAWclnwcJIwdtPf9ok9f%2B0Pafg7dAvjsrmR5/M%2BDWFLFY48%2B6e5PluYcVSBQDqO4nrQGrdXH/u758fN3LalfopgmLZsmnRrPKHBQBCgPANADAqv4M3Dcnqt24ffF/DMZ1eG%2Bkstld275Nnnnlh2NcMXZyQ72IFPd9Na6Y9H7ZIWLFUAcCA7sR1YPPBWFrtfNEMV1ZVmnkdoH6KoLiOLFgyp7xRAGCMEb4BAEZ1YMPyl11xV2b7%2BSMFb6khWTZLEFK/Zu7c2Ylg7RvJrylksYKe69b%2Bo20S72yXMMpmqcLa682smwHIn577qAsYUplaP%2B0tu0o%2BWvKQAAHo6HWkmvPfAIw1wjcAwIhyXbCQa/BWW3fHiN/vu4lgbc%2BefYPvr1i5WO68s7%2BiVMhihbPNe5M107Ce7zbaUoWbrnRl1RyWKgBRtavFTk7FDmVy/bTz2hXSed3o124gZ5z/BiAECN8AABn9eMPyex1x67P9/JGCt9QQbbSQTCfaNj/ypBw6dNTzawpZrNBx4AeJ8O0NCavRliroZkNqpkC0Zaqfzpvmyt3VZl4fdPpNp%2BAAv1mW1C%2B6prxOAGCMEL4BADw1rL%2B1yratpmw/f6TgrX7rs8NqoaMFb14TbV%2B7a43cdtvi5O/zXawQP9OePN9N66ZhpEsVdhy2klNvXqZPlcSL6jhLFQAkZaqfrq50EgE99VNgKM5/AzCWCN8AAGlyXbCQKXjTcOz%2Bv/vHjCGaFw3e9GuGTrTp%2BW56zpvKd7FCz4kWOfnattDWTN/5gyUvHsm8VEFfSK829DB1AMF59Zglr30wPICbNE5k43zdfmxeAEf9FAFqjXVJ9YLq8g4BgCIjfAMADNNQW1NmT5iiE28V2Xx%2BpuAtdXotm1qofq4Gb14TbYUsVjjz7p7k%2BW5hpEsVXjsmGWumLFUAMBqdfkudmNVrhi5gMBH1UwSG898AjBHCNwDAMAc2LNueiHluz%2BZzRwreUqfXtjy2fsRaqFeV9B8euy850ZbvYgW3p0v%2BtPd70v2bn0sYnei05KmmzEsV9OymtXNZqgBgZHoN2XIwljY5a2r9tOeK2XKyZr0AQXBdp25J5WVZn2cLAH4gfAMADMpls2m2wVs257F5VUk1rNPQLt/FCnq%2BW9tLj0u8s13CSLcU6rZCLyxVAJCr/Ylryose15SNNzky/RLzArjT89bIuWsWCxCAjl5HqpfOKW8VACgSwjcAQFLD%2Bltvt21rezafmyl486qNDkyvZZIavA2tkua7WOHckbfl9IGdoTzfjaUKAILiVT%2BdPtWVuhvNm6B1xk%2BWj255SOKTLxMgAM2LZ5dXCwAUCeEbAGBgwYKe81Y22udmCt4O/eKobH70yayDN68z3IZWSfNdrNBx4AdytvkNCaPmNku%2Bf2jkpQrLZlIzBZCfTPXTRYlryyoDF7ZQP0WQLEvqF11TXicAUASEbwAQcblsNo1NnCKVX/uHtOBNJ9Tqt34yNDe0NurFawvqQPCW72IFrZm2v7pNett/J2HDUgUAxfJ%2BW/9Zkql0%2BYKJ1xjqpwiS68iCJXPKGwUAAkb4BgAR99aGZTrxVjXa52nwNuu/PiiTPj1j2OOpE2qf/3y11H5zXcagzGsZw8AZbvkuVug50ZJcrBDG891GW6owK/Fi%2BO5qpt0A%2BEfPk9RzJYfSkP/%2B%2BXHqp8BwrbEuqV5QXd4hABAgwjcAiLADG5ZtdUVqR/u8bIM3nVCrrbsj4/fxWp4wsAU138UKZ5v3SseBnRJGLFUAMBa6%2B0Q2H4ylhf7UT4F01E8BFAPhGwBEVLabTbMN3kabUBvpTLh8Fiu4PV3J893OHfmJhM1oSxV0AkWXKuhyBQAIgl5/dAFDqq9XO1I1jfopMBT1UwBBI3wDgAhquG/pStuyXx7t8zIFb/Vbn824KMHLK7v3yTPPvDD4/tDlCfksVtDz3dpeejyUNVN9wfudJpYqABh7XvXTSYlrz8b5TuImgFkBHPVTBIz6KYBAEb4BQMRku9nUK3jTybTNjzwphw4dHXzsa3etkdtuyzyNkBquzZ07OxGufSP5%2B3wWK5w78racPrBTnJ4uCZPRlipo2PaVuWZOnAAw15aDtvy%2Bc/hTfl28oAsYTEP9FEGifgogSIRvABAh2W429QrevJYh1NatG/FMtu8mwrU9e/YNvr9i5WK58841eS9W0Jrp2eY3JIx0scLWn3lPvOlSha9e7yTrpgBQTJmuTasrneQkrmmonyJI1E8BBMUWAEBkxNzYdskzeNMNpQNh2cCihEzB28CE3NDgTcM1Dd70e6R%2BLw3xRgretGb60UuPhzZ4U9OnunLrzPRJktWVrnzzBoI3AGMj07Xp1WN28nxK00z95SsS6zopQBAsW7Y3NJ0qEwDwWUwAAJGgCxZcy7p9pM8ZKXgb2EKqyxAe/u91Uln5Wc/voZ%2B/6Vv1adXU1auXJhcr/OPjT8upjtPDvte//bfXSyY9J1qk/dVt0tv%2BOwm7zyaerv/6lJV8Qath2zdvjMs8aqYAxtjQa9OAPkfPqBT5y6vMukZZTq%2BM7/i9dFfcLEAAyuQimbhj2%2BP/UwDAR9ROASACfrxh%2Bb2OuPWjfV7l1x4bFrzpdNqWR54cFrwNbCj1khrU6VSbnu%2Bm57zls1jhbPNe6TiwU0zS3Seyv9WWhRUsVQAQHie79fy3WFr9dPnnHFk2k/opMBT1UwB%2BI3wDgBLXsP7WKtu2mkb7vBnL75ZPzfvC4PuHfnFUNj/6ZLJCqkYL3gbqpEM/f%2BMD98inE29zXazg9nQlz3c7d%2BQnAgDwx/7jlrzYkn7qjC5f0CUMJmH7KQLWunh2%2BdUCAD4hfAOAEpbtgoXU4E3rofVbtw%2B%2Br1NqesZbprBMP/%2BZp3%2BYFtRJ4rVcrosV9Hy3tpcel3hnuwAA/PWdJlua24a/BNCa/P3z48ZN67L9FEFyHefhJXMu2yQA4APCNwAoUQ21NWX2hCk68VYx0uelBm%2Bv7N4nzzzzwuD7WhnV6mim4M2rTqpB3R//eHJYZVW//s67vjzidtTuD34up/Z9T5yeLgEA%2BE%2Br8ZsPxpI11KEWzXBlVaUjpqF%2BigB19DpSvXROeasAQIE4jQYASlRswsXbXXErRvqc1OAtNUjTemht3R0Zv97r87VO%2BtN3mtIm4bSCqsFcJlozDfM2UwAoBZMSz/7XXu/I1veG10%2B1kvoX0yzj6qe6/fT89GrqpwhC2fiYaA1ggQBAgZh8A4ASpJtNHcvaNNLnjBa8jVYPrd/67LBz3AY%2BP9fFCloz/dPe70nPhy0CACiOXS22vHmc%2BikwGseJr7tlzuXPCQAUgPANAEpMNptN//w/fEn%2B7C9XDb6fKUjzotNsulgh9Ry3225bnPNihd7230n7j7ZxvhsAFFmm%2Bum8aa7cXU39FBiiI9YlVy%2BoLu8QAMgT4RsAlJALCxb0nLeyTJ8zNHjTIG3zI0/KoUNHBz8%2BUvDW9seTyeBt4Bw3VVu3TubOrcx5scLZ5r3ScWCnAADGxolOKxHApW8/XV3pyMIZbD8FBliW1C%2B6prxOACBPhG8AUCKy2WyaGrylTrBpkJZpIYJ%2BXuoCBV2soHJZrOD2dCXPdzt35CcCABhbetbbiy3DAzg9F27jfEcum2RWAEf9FEFyHVmwZE55owBAHmwBAJSERPD2sowQvF16zb8bVjXVpQgDwdtAkJYpMDv0i6PDJt50gcL/%2BPZD8tvf/C7t8ZG%2Bj57v1vbS4wRvABASuuU0dcmCVlJ3HDbvHv2Ej47KxD80CRAEKyYPCQDkKSYAAOMd2LBsa%2BLNykwfv%2BjSK2TmX/%2B92OPGDz722c/%2Bm%2BT8c1siOHv4v9dJZeVnPb/2ld375B//76elt7f3wtddJQ8/Uif7974tzzzzw7THp0//M8/v0/3Bz6X9lX/ifDcACBkN3376oS29Q456O9ltyeTEfzKuLhOjTPhf/yrnPveFxKuc8QL4rOIr99x3%2Bvvf/r9/KgCQI2qnAGC40TabavA26ysPJt960fpppoUIqZtL586dLbXfvEN2/vOenBYrnHl3T%2BLXbgEAhJNX/VRtvMmR6ZeYVT/tvrJaTt38DQECwPIFAHmhdgoABmu4b%2BnKkYI39dnV/y1j8KYyBWZq6GKFFSsX95/xlngNdvgXvxp8XBcr1Nbd4fl99Hy3j156nOANAELOq36qnmq2patPjDLpD03UTxGUsr6JTq0AQI6YfAMAQ%2BW62TQfA0sZ/vebqodtLtWz4vTxkRYr9Lb/Ttp/tI2aKQAY4mS3yJaDsbSwTYO5VZWOmES3n/5x2WPijp8sgN96Hbl66ZzyVgGALBG%2BAYCBstls%2Bqm/%2BEuZ8R//RgqVqZY6Ul31bPPe5LSb09MlAABzvN9myVNN6eWYuhscz8m4MKN%2BisBY0rj4mvIFAgBZonYKAAaKubHtMkLwpjXTPy9g4m2oTAFbppppx4EfJH7tJHgDAAPNm%2BbKwhnpIduOw2bWTy/66KgAvnOlZu%2BRUzUCAFkifAMAw%2BiChcTLopqRPmekBQtBiZ9pl7aXHpezzW8IAMBcy2c6ctmk4Y9pJfX1Y%2Ba9dCh/b7tYvdwMgv8sW7YKAGSJ8A0ADPLjDcvvHW3Bgp7zVuzgredEi/zxBw8lz3kDAJht0jiRtdenn/GmG1Gb28w6tSZ2rl2m/usrAgSgam/LSZYvAMgKZ74BgCEa1t9aZdvWiOvbNHS77p7/IUHTemk88UvfnjvyNtNuAFCCdrXY8ubx4S8XNJjbOF8n48w6/629Zr18fMVsAXzWEeuSqxdUl3cIAIyA8A0ADJDNggWlwVshU28DoZpWSHVLqTPw%2B57u/reJX87HXZznBgARseWgLb/vHP6SQRcv6AIGk8SnXC5tS77F9lP4znWch5fMuWyTAMAICN8AIOQaamvK7AlTdOKtYqTP07rpn2VYstCXCM3cC0Gahmf6ft%2BZk8mP9X70u%2BTH%2BhJhGwAAQ%2BlZb1sOxtKWLayudDwXM4TZ2VmL5UzVGgF8xvQbgFGNEwBAqMUmXLzdFbci9XHLshK/%2Bg/vHBez5eJLLpEz7%2B5OhmrJMO1C4EaoBgDIly5euHWmIy%2B2DD8q%2BtVjtsybZlb99OJf75Pzn6mmfgq/lTlT5KHE2zoBgAyYfAOAkGnatLIs8aZsXEwqnLjc1hN3amOWnQzaYrYlsQuhm4ZvAAAUw9b3bPnVn4b/d2f6VDd5/ptJqJ8iKL2OXL10TnmrAIAHtp0CQMhMTARvE8bFmmJWrGH8uFjtxRPGy6SLYjJxfEzGx2yxbYvgDQBQVLr9dHJKZ%2BZEp5U2ERd2bD9FUMbbslUAIAPCNwAImTmbdrc6Yj0sAACEhNZPV1WmT7ntP26lTcSFndZPL/roqAA%2BW7n3yKkaAQAPhG8AEELXP/BifeJNowAAEBI3fcaVqmnpZ7ztOGynLWQIu/L3tovVy%2BZu%2BMuKJc9%2BA4A0hG8AEFJWX3xd4g2bswAAobF2rpOcghtKN6K%2Bfoz6KSCu1DD9BsAL4RsAhBT1UwBA2Ewa13/%2BWyrqp0A/pt8AeCF8A4AQo34KAAibaz7lysIZ6fXTp5qonwJMvwHwQvgGACHnWHadAAAQIstnptdPuxPB245D1E8Bpt8ApCJ8A4CQu37jrmbXdamfAgBCQ%2Bund1en10/fb7PkzePUTxFxTL8BSEH4BgAGuO7Bf9mUeNMsAACExPSprqyqTA/gXj1my8luswI46qfwG9NvAIYifAMAQ8Rdi/opACBUFs1wk2fADZWsnx42K3yjfgrfMf0GYAjCNwAwxNwHX2x0XHlCAAAIEd1%2BOnnc8Md08yn1U0Qd028ABhC%2BAYBBeuPxTWK5rQIAQEjo4oVbZ6bXT3e12HLiDPVTRBjTbwAuIHwDAINUb9rdEXfsdQIAQIh41U/VU822dPWJMaifwm9MvwFQhG8AYBjqpwCAMNLtp6n105PdIq8fM%2BslB/VT%2BMqVmjcOn6oSAJFG%2BAYABqJ%2BCgAIm0mJ4O3r1en10/3HreQZcCa5tPkFAfwSu0juFQCRRvgGAAaifgoACCOtni6ckV4/3XHYrPrp%2BI7fUz%2BFb1xXbm9oOlUmACKL8A0ADEX9FAAQRstnOsklDENp/fTFFrNeekz95SvJEA7wQ99Ep1YARBbhGwAYjPopACBstH669vr0%2Buk7H1rJXyYpe%2B9ZAfxg2fa9TL8B0UX4BgAGo34KAAijTPXTXS22nOw2J4CjfgoflTH9BkQX4RsAGE7rp2LJbgEAIERWVzpy1dThAVx3n57/Ztb0G/VT%2BEWn3wRAJBG%2BAUAJ6OmN6/RbhwAAECK6/XTyuOGP6ebTN4%2BbFcBdwvZT%2BKPsf/6yfaUAiBzCNwAoAVo/7XOF%2BikAIFR08cKtM9PPf3v1mFn10wkfHZUpv9onQKFi42JMvwERRPgGACXiLx58SaunjYKi6eqzjHrxCABjYdEMN3kG3FBaP32qybz6aazrpAAFcaVm75FTNQIgUgjfAKCEWH3UT4tFa1NbDtrGnV0EAGNBt5%2Bm1k9PdFryYos5L0fs3i4p%2BxnbT1E4yxam34CIIXwDgBIyZ9PuVkeshwWB0Wm3XS2WbH1PK1Nmnl0EAMWm9dO1c9Prp/sT10%2B9jpqC%2Bil8srKh6VSZAIgMwjcAKDHXP/BivVA/Dcw7H0oibBv%2Bn0/Tzi4CgLEwb5orN33GTXt8x2E7cWNDjEH9FH7om%2BjUCoDIIHwDgBJE/TQ4mc4uon4KAKNbXekkp%2BCG0ini149RP0W0WLZN9RSIEMI3AChB1E%2BD5XV2EfVTABjdpHH919BUWj9tbqN%2Bikgp%2B5%2B/bF8pACKB8A0AShT10%2BDo1MatM9NfPFI/BYDR6fTwwhke9dND1E8RLbFxMabfgIggfAOAEkb9NDjUTwEgf8tnptdP9Rr6nSbqp4gQV2r2HjlVIwBKHuEbAJQw6qfBon4KAPnR%2Bund1ekTxKZdQ6mfolCW5VA9BSKA8A0AShz10%2BBQPwWA/E2f6sqqSvOvodRPURDL/mpD06kyAVDSCN8AIAIcy64TBIL6KQDkrxSuodRPUaCyvknO7QKgpBG%2BAUAEXL9xV7PrutRPA0L9FADyVwrXUOqnKIRl27cJgJJG%2BAYAEXHdg/%2ByKfGmWeC7keqnJm3uA4CxkOkauqvFlhNnqJ8iAlypeePwqSoBULII3wAgQuKuRf00IBmrU4f4Ty0AjEavoVXT3LTHn2o25yYG9VMUwoqxeAEoZbwiAIAImfvgi42OK08IAuFVnXq/zZLmNuqnADCatXPTr6Enu0VeP2bOSxbqp8iXZdv3CoCSRfgGABHTG49vEsttFfguU3VKp9%2BonwLAyCYlgrevV6dfQ/cft5JnwJmC%2BinyVLb3yKkaAVCSCN8AIGKqN%2B3uiDv2OkEgqJ8CQP70%2BrlwRnr9dMdh6qcofZYtTL8BJYpXAgAQQdRPg7W6Mv2FI/VTAMjO8plOcpJ4KK2fmnQTg/op8lTT0HSqTACUHMI3AIgo6qfBmT7VlWWfo34KAPnQ%2BqmeoZlKb2K88yH1U5S0sr5Jzu0CoOQQvgFARFE/Ddbyma5cNZX6KQDkI1P9dFeLLSe7zQjgqJ8iH5Zt3yYASg6vAAAgwqifBmvtXO/6qUkHhwPAWFld6XjfxDhszjVU66cT/9AkQNZcqqdAKSJ8A4CIo34anIz1U4MODgeAsaTbTyePG/6Y3sB487g5AVzZz7aL1dslQLb6Jjq1AqCkEL4BQMRRPw2WV/1UDw5//Rj/CQaA0ejihVtnpt/EePWYafXT7QJky4rZXxAAJYVn/gCAZP1ULNktCIRX/XT/ceqnAJCNRTPc5BlwQ2n99Kkmc66hk/7QRP0U2XOlZv9vumcIgJJB%2BAYASOrpjev0W4fAd9RPAaAwuv00tX56otOSF1vMeTlD/RS5cHq6aCUAJYTwDQCQpPXTPld4oheQRRVusj41FPVTAMiOXj/Xzk2/iWHSFDH1U%2BTCtu2vCoCSwTN%2BAMCgv3jwJa2eNgp8N2lc/%2BRGKuqnAJCdedNcWTgjvcZv0hSx1k8v%2BuioAKNJ/E2v2HvkVI0AKAmEbwCAYaw%2B6qdB0TOLTH/hCABjaflMx/gp4vL3qJ8iW06NACgJhG8AgGHmbNrd6oj1sCAQpfDCEQDGykhTxM1tZkwRx861y9R/fUWA0bD1FCgdPNMHAKS5/oEX64X6aSConwJAYTJOER%2ByEzczzLiOXvzrfdRPMTq2ngIlg/ANAOCJ%2BmlwqJ8CQGG8poi7%2B/Q6as5NDOqnyAZbT4HSQPgGAPBE/TRY1E8BIH86RXx3dfoUsU4Qv3mc%2BilKB9VToDTwDB8AkBH10%2BBQPwWAwkyf6sqqyvTr6KvHqJ%2BihLhS09B0qkwAGI3wDQAwIuqnwaF%2BCgCFWZS4huq1dCjqpyg1fZOc2wWA0QjfAAAjon4aLOqnAFAYnSKePG74Y9RPUUos275NABiNZ/YAgFFRPw0O9VMAKIzewLh1Zvp1dFeLLSfOUD9FCXCliuopYDbCNwBAVhzLrhMEgvopABRG66dV09Kvo081m3MdpX6KEZT1TZQqAWAswjcAQFY%2B%2BuunWzuvXSEIBvVTACjM2rlmX0epn2IkluWsFADG4hk9ACAr8Y/jNZ3XrZDesqsE/qN%2BCgCFKYXrKPVTZGTZXxUAxiJ8AwBkxbJiycN%2BT1etEQSD%2BikAFKYUrqPUT5FB2RuHT1E9BQxF%2BAYAyIrrSo2%2B/fiK2XLumsWCYFA/BYDCZLqO7jhE/RRms8Y5NQLASDyTBwCM6o1fJe%2B0Vgy8r2e/xSdfLvAf9VMAKEym6%2Bj7bZa8eZz6Kcxl2fZtAsBIhG8AgFFZzvA7rc74yXLqxnWCYFA/BYDC6HV02efSA7hXj9lystuMAI76KdK4UtPQdKpMABiH8A0AMCqvO63UT4NF/RQACrN8pitXTR1%2BI6O7T29kmBG%2BUT%2BFl76JwrlvgIF4Bg8AGJ3r/USP%2BmlwqJ8CQOG%2BXu3I5HHDH9NrKPVTmMqynJUCwDiEbwCAEe098lFN4o1nxYH6abAy1U93tRC%2BAUA2dIL41pne9dMTZ6ifwjyWxblvgIkI3wAAo7BrRvoo9dNgedVPT3Ra8toxAjgAyMaixE0MvZkxlNZPn6d%2BCgMl/iZXcO4bYB7CNwDAiKyY/YXRPof6aXAy1U9f/cCcqQ0AGGt6HU2tn%2BqNjBdbzHg5RP0UQ/VOjFM9BQxD%2BAYAyKjht4k7q67UjPZ51E%2BDpRMbn78yvX5qytQGAIw1nSBeO9fsczQvbX5BAGVbFksXAMMQvgEAMuo735f1kzutn56/sloQjP9zjvfUBvVTAMjOvGne52juOGxLV5%2BE3viO31M/RRLnvgHmIXwDAGSUeHKXU62h48Z14o6fLPBfsn46l/opABTC6xzNk90irx8z42XR1F%2B%2BkgzhEG2c%2BwaYh/ANAJCZbc/L5dOpnwZLpzaqplE/BYB8ZTpHU%2BunzW1mXEvL3ntWAM59A8xC%2BAYAyCyL895SafW054rZgmDo9Bv1UwDIn56j6Vk/PWTLye7wX0upn0Jx7htgFsI3AICnvUc%2BqpE8ddxA/TQomeqn%2B4%2Bb8aIRAMJA66dXTR0ewHX36flvZlxHqZ%2BCc98AsxC%2BAQAysGskT/Epl8uZ61YIguFVPzXpRSMAjLX%2BGxlu2iSxbj5987gZ19JL2H4aaZz7BpiF8A0A4MmK2V%2BQApybtZj6aYC86qcmvWgEgLE2faort870WGRzzIxJ4gkfHZUpv9oniK6PJ%2BR%2BPAiAsUH4BgDw5krBZ4lQPw2OTm2sqjT3RSMAhMGiGW7yDLihTKufxrpOCqIpZjs1AsAIhG8AgDRv/OqUBm8FVxmonwbrps%2BY/aIRAMJAt596TRKbsMjG7u2Ssp%2Bx/TSyctxKD2DsEL4BANLF475t0KJ%2BGqxMLxqpnwJAdi6bJN710w/s5PU07KifRpgPLQUAxUH4BgBIE4vFCjrvLRX10%2BBkfNFI/RQAsqb109RFNmrHYVu6%2BiT0qJ9GVtkbh08RwAEGIHwDAKRxfb6TSv00WKafWQQAYaCLbPSGxlAnu0VePxb%2Bl0zUT6PLGse5b4AJCN8AAMM0/Da5tt73u6jUT4NF/RQACqOLbPRammp/4jpK/RRhZVmc%2BwaYgPANADBM3/m%2BwOoLZ6rWCIJB/RQACqdTxAtnUD%2BFUaidAgYgfAMADGfZgT2J6y27SjqvpX4aFOqnAFC45TO966c7DlE/RShVNTSdKnhDPYBgEb4BAIaxLNvXZQupOq9bkQzhEAzqpwBQGK2f3l2dPkn8fpsZ11Lqp9HTO14qBECoEb4BAFJVSMBOUz8NDPVTACjc9KmuLPucuddS6qfRwtIFIPwI3wAAg4JatpDq4ytmy7lrFguCQf0UAAq3fKa511Lqp9HC0gUg/AjfAACDgly2kErPfotPvlwQDOqnAFA4k6%2Bl1E8jhaULQMgRvgEAPhHgsoVUzvjJcurGdYJgUD8FgMJlupbuarHlxBnqpwiNCgEQaoRvAIBBVpGfvFE/DRb1UwAonNe1VD2fuJZ29UmoUT%2BNjLI3Dp9i%2Bg0IMcI3AMAn7OKfGUL9NFjUTwGgcF7X0hOdlrx%2BLPwvp6ifRkQsTvgGhBjhGwDgE27xzwyhfhos6qcAUDi9lq6dm34t3Z%2B4kaE3NMKO%2Bmnpsy2L8A0IMcI3AEDSG79K1hXKZAxQPw0W9VMAKNy8aa4snJFeP91x2KZ%2BijHnilUhAEKL8A0AkGTF%2B8YkeBtA/TRY1E8BoHDLZzrJKbihTnYL9VOMOduyin50CIDsEb4BAPoVcdOpF%2BqnwaJ%2BCgCFmzSu/2ZGKq2fNrdRP8XYcUUqGppOjemNVACZEb4BAJIsy/6CjDGtn56/sloQDOqnAFA4vY561k8Phf9mBvXT0tY7vrhb6wFkj/ANANDPklDcLe24cZ244ycLgpGpfmrCxAYAhMXqSkeummrmzQytn078Q5OgBLHxFAgtwjcAQL8x2HTqhfppsDLVT3ViI%2BwHhgNAmKyd6xp7lmbZz7aL1dslKC1sPAXCi/ANACANv02eERKac0K0etpzxWxBMDLWTw/xtAAAsjV9qmvsWZr99dPtgtLCxlMgvHiWDQCQvvN9obtT2nED9dMgedVP32%2BjfgoAuch0M%2BOppvBfSyf9oYn6aYlh4ykQXoRvAIAx33TqJT7lcjlz3QpBMLR%2BumAG9VMAKJTXzYwTnZa8doz6KYrLDVGLAcBwhG8AAEm8PKiQEDo3azH10wAtn%2Bl6HxhO/RQAspbpLM1XP7CTZ8CFGfXTklO2/zfdMwRA6PDsGgCgk2%2BhfaJG/TRYemB4KuqnAJAbrZ9WTUu/nu44HP5pYq2fXvTRUUFp6Dt/vloAhA7hGwBAVUhIUT8Nlh4Yvuxz1E8BoFBr5zrJKbihTnaLvH4s/C%2B5yt%2BjfloqLCtO9RQIIcI3AICqkBCjfhqsTPVTE14wAkBYTBrXf/5bqv3HrdDXT2Pn2mXqv74iMJ9tWaE7xxcA4RsARF7Db0/pHdLQ3yWlfhosr/qpCS8YASBMdPPpwhlm1k8v/vU%2B6qelwLIvFQChQ/gGABHXd77PiDuk1E%2BDlbF%2BasALRgAIk%2BUzveunJiyzoX5aEph8A0KI8A0AIs6yLWPOBqF%2BGiyv%2Bqkp5xUBQFho/fTu6vSbGbrM5s3j1E8RuAoBEDo8mwaAiHMds84GOVO1RhCcVZXUTwGgUDpNvKoyPYB7NXEz42R3uK%2Bn1E%2BNV9bQdIqlC0DIEL4BQMRZVvjPexuqt%2Bwq6byW%2BmlQTD6vCADCZFHiWqrX1KF0mc2Ow%2BG/mUH91GzOpRM59w0IGcI3AIg6254nhum8bkUyhEMwMp1XRP0UAHKj208njxv%2BmE4SUz9FkPrOn68WAKHCs2gAiDrXrMm3AaepnwZGzyvSF4ypqJ8CQG70RsatM9Ovp7tabDlxhvopgmFZcWqnQMgQvgEAKsRAH18xW85ds1gQDOqnAOAPr/qpeqo5/NdT6qdmssSqEAChQvgGADD27qie/RaffLkgGNRPAcAfXvVTE66n1E/NZNn2DAEQKjx7BoAI%2B3%2BOnKoQgznjJ8upG9cJgkH9FAD8oTcy1s4183pK/dQ8ruuWC4BQIXwDgAgbJ30VYjjqp8GifgoA/pg3zdzrKfVTs1iWxeQbEDKEbwAQYZZtlcSBvNRPg0X9FAD8Yer1lPqpWSyDjxQBShXPmgEgwlzXqpASQP00WNRPAcAfI11Pm9uon8IfrqHLtIBSRvgGAFHmls6dUeqnwaJ%2BCgD%2ByHg9PWTLye5wB3DUT82x/zfdVE%2BBECF8A4AIK7U7o9RPg0X9FAD8sbrSkaumDg/guvv0hka4wzfqpwCQH54tA0CE2bZ9qZQQ6qfBon4KAP75erUjk8cNf0yvpW8ep36Kwjk9568WAKFB%2BAYAUWaV3oG8Wj89f2W1IBjUTwHAHzpJfOvM9Bsarx6jforCuRKvEAChQfgGAFFWQme%2BDdVx4zpxx08WBIP6KQD4Y1HiZobe1BhK66dPNVE/BYBSwrNkAIiwUl1FT/00WNRPAcA/ej1NrZ%2Be6LTkxZZwv1SjfhpullgVAiA0CN8AIMJKeRW9Vk97rpgtCAb1UwDwh04Sr6o084bGpc0vCMLJKsGjRQCTEb4BAEpWxw3UT4NE/RQA/HHTZ1ypmmbeDY3xHb%2BnfhpWVmkt1QJMx7NjAIio/%2BfIqQopcfEpl8uZ61YIgkH9FAD8s3aumTc0pv7ylWQIh3BxXbdcAIQG4RsARFQsFo06wrlZi6mfBoj6KQD4w%2BQbGmXvPSsIF8u2mHwDQoTwDQAiyor3ReYsEOqnwcpUP21oZfoNAHKR6YbGU03UT5GjEt1oD5iK8A0AUPKonwYr07TGqx/YcuIMARwA5MLrhkZ3InjbcYj6KbJXqhvtAVMRvgFARNliVUiEUD8NVqZpjecPE74BQC70hsbd1ek3NN5vs%2BTN4%2BG%2Bpl7C9lMA8ET4BgCIDOqnwfKa1jjRaclrxwjgACAX06e6sqrSY6L4mC0nu8N7TZ3w0VGZ8qt9grGXuB1WIQBCg/ANACLKsazI1RGonwZLpzVWV1I/BQA/LJrhJqeKh0rWT0M%2BUaz101jXSQEAfILwDQCiKqIH8VI/Dda8aa5UTaN%2BCgB%2B0PM0J48b/phuPg1z/dTu7ZKyn7H9NAwamk5x7hsQEoRvAIDIOVO1RhCctXPTXyxSPwWA3GmV/9aZ6RPFu1rCPVFM/TQcnEsnXioAQoHwDQAQOb1lV0nntdRPg5LcfjqX%2BikA%2BMGrfqqearalq09Ci/opAHyC8A0AIirqB/F2XrciGcIhGJnqp7uOEr4BQK50%2B2nqRPHJbpHXj4X35Rz1UwD4BOEbACCyTlM/DZRX/TTsZxUBQBjpRPHXq9Mnivcnrqd6XQ0r6qdjK951vlwAhALhGwAgsj6%2BYracu2axIBgZ66fHbDnZTQAHALnQ6unCGekTxTsOUz%2BFNysWzeVaQBgRvgEAIk3PfotPvlwQDK/6aXefvlgkfAOAXC2f6SSXMAyl9dMXW6ifAkCYEb4BQETZts0GrARn/GQ5deM6QXBWVVI/BQA/JCeKr0%2BfKH7nQyv5K6yonwKIOsI3AIgqiyrCAOqnwdIpjVtnUj8FAD9kqp/uagn3NZX6KYAoI3wDAEConwZtUeKFor5gHIr6KQDkZ3WlI1dNNeuaSv0UQJQRvgEAINRPi0GrUtRPAcAfuv3UtGsq9dPiciVeIQBCgfANAIALqJ8Gi/opAPjH1Gsq9VMAUUT4BgDAENRPg0X9FAD8k%2Bma%2BlQT9VMACBPCNwAAhqB%2BGjzqpwDgH69r6olOS15sCe9LPeqnAKKG8A0AgBRaPz1/ZbUgGNRPAcA/ek1dOzf9mro/cUNDb2yEFfVTAFFC%2BAYAgIeOG9eJO36yIBjUTwHAP/OmuXLTZ9y0x3cctqWrT0KJ%2BimAKCF8AwDAA/XT4FE/BQD/rK50klNwQ53sFnn9GPVTABhrhG8AAGSg1dOeK2YLgkH9FAD8M2lc/02NVFo/bW6jfhpFlsRaBUAoEL4BADCCjhuonwaJ%2BikA%2BEevpwtneNRPD1E/BYCxRPgGAMAI4lMulzPXrRAEh/opAPhn%2Bcz0%2Bqne1PhOU7jrpxP/0CQAUKoI3wAgopy4c1yQlXOzFlM/DRD1UwDwj9ZP765Ov6aG/aZG2c%2B2i9XbJQBQigjfAADIAvXTYFE/BQD/TJ/qyqpKs25q9NdPtwsAlCLCNwAAskD9NHjUTwHAPybe1Jj0hybqpwBKEuEbAABZon4aLOqnAOAvE29qUD/1jxuXDgEQCoRvAADkgPppsKifAoB/Mt3U2NViy4kz1E9LXWzyxFMCIBQI3wAgohJPuVsFOaN%2BGjzqpwDgH72pUTXNTXv8qWZbuvoklLR%2BetFHRwUASgXhGwAAOaJ%2BGqyR6qdhfaEIAGG2dm76TY2T3SKvHwvvy8Hy96ifAigdhG8AAOThTNUaQXAy1k8P8dQFAHI1KRG8fb06/abG/uNWcrI4jGLn2mXqv74iyN%2Biz046LgBCgWewABBRtritgrz1ll0lnddSPw2SV/30/TZLmtuonwJArvSGxsIZ6fXTHYfDO1V88a/3UT8FUBII3wAAyFPndSuSIRyCkal%2BqtNv1E8BIHfLE9dUvbYOpfXTME8VUz8FUAoI3wAgolyb9fN%2BOE39NFDUTwHAP1o/1aniVDpV/M6H1E9LCYu1gHDhmSsARJTruIRvPvj4itly7prFguCsrkyvSVE/BYD8ZKqf7mqx5WR3OK%2Br1E8BmI7wDQAiyo2NI3zziZ79Fp98uSAY06e6suxz1E8BwC%2BrKx25aqrHVPHh8N7UoH6aG9di8g0IE8I3AIioeJzaqV%2Bc8ZPl1I3rBMFZPtP1fqFI/RQA8qLbT1OX2ujm0zePUz8FAL/xjBUAAB9QPw3e2rne9VN9sQgAyE2mpTavHqN%2BWgpcxz0tAEKD8A0AImrpnPJWga%2BonwYrY/30MPVTAMhHpqU2TzVRPzWdZVmnBEBoEL4BQLRRPfUR9dPgedVPT3aLvH6MpzQAkA/dfppaPz3RacmLLeG8rlI/zY7rOMcFQGjwTBUAIswifPMd9dPgedVP9x%2BnfgoA%2BdD66dq56VPFYb6uUj8FYBrCNwCIMJfwLRDUT4NF/RQA/DVvmisLZ6Tf2AjzdZX66chccVsFQGgQvgFAtLUKfEf9NHiLKtzktMZQ1E8BIH/LZzpGXVepn47MklirAAgNnqECQIQ5jsMmrIBo/fT8ldWCYEwa139OUSrqpwCQn5Guq81t1E8BoBCEbwAQYbZF7TRIHTeuE3f8ZEEwdEOfaTUpAAizjNfVQ7ac7A5nAEf91Js9YeJvBUBoEL4BQIS5LuFbkKifBs%2B0mhQAhJ3XdbW7T29shDN8o37qzT59nnYDECI8MwWACLM5jDdwWj3tuWK2IBjUTwHAX3pdvbs6/bqq19Q3j1M/NcWC6nJusAIhQvgGABHm2ky%2BFUPHDdRPg0T9FAD8pVulV1WmB3CvHqN%2BagKLhVpA6BC%2BAUCEORabsIohPuVyOXPdCkFwqJ8CgL8WJW5q6M2NoaifmsG1CN%2BAsOEZKQBEWDzO5FuxnJu1mPppgKifAoD/9Lo6edzwx6ifhp/ruJz3BoQM4RsARNjSOeWtgqKhfhos6qcA4C%2BdKL51ZvqNjV0ttpw4E84A7tLmFyTqLM70BUKH8A0AIo5zQYqH%2BmnwqJ8CgL%2B0flo1Lf3GxlPN4byxMb7j95Gvn7o8twNCh2eiABBxnAtSXNRPg0X9FAD8t3auWTc2pv7ylWQIF1WOY7cKgFAhfAOAiHPiznFBUVE/DRb1UwDwl4k3Nsree1aiyrY40xcIG8I3AIg4nqAVH/XT4FE/BQB/mXZjI8r1U3vCxN8KgFDhGSgARJzlus2CoqN%2BGizqpwDgv0w3NnYcon4aJos%2BO4lWAxAyhG8AEHGuzeTbWDlTtUYQHOqnAOCvTDc23m%2Bz5M3j4byxcUnEtp%2BySAsIJ8I3AIi4XifG5NsY6S27SjqvpX4aJOqnAOAvvbGx7HPpAdyrievqye7wBXATPjoqU361T6KCRVpAOPHMEwAibuJEJt/GUud1K5IhHIJB/RQA/Ld8pitXTR0%2BWdzdp5PF4byuav001nVSIsElfAPCiPANACJuwdXlHVQUxtZp6qeBon4KAP77erUjk8cNf0xvaoSxfmr3dknZz6Kx/dR12GIPhBHhGwAgcZOU6bex9PEVs%2BXcNYsFwaF%2BCgD%2B0mvqrTO966cnzlA/HSuOa3OcCBBCPOMEAIjjOO8LxpSe/RaffLkgGNRPAcB/i2a4yeniobR%2B%2Bjz10zFjW9xQBcKI8A0AIJYl3CUdY874yXLqxnWC4GSqn%2B5qIXwDgHzpjY3U%2BumJTktebAnfS80o1E/Hnec5HRBGhG8AALFdl7ukIUD9NHhe9VN9kfjaMQI4AMiHXlPXzjVnsrjE66cdC6rLeU4HhBDhGwBA4rEYd0lDgvppsDLVT1/9IJxnFAGACeZNM2uxTcnWT2kyAKFF%2BAYAkPHj2XYaFtRPg6f1089fmf4iMaxnFAGACUxabFOy9VOX53NAWBG%2BAQBkwdXlHYnYoVUQCtRPg/d/zvE%2Bo4j6KQDkZ6TFNs1t1E%2BLwXVZoAWEFeEbACDJFaoKYUL9NFjJF4lzqZ8CgJ8yLbbZcciWk93hu7aWXP3UtXkuB4QU4RsAoJ/rHBeEBvXT4OkZRVXTqJ8CgJ%2B0fnrV1OHX1u4%2BPf8tfNfWUqufunFh2QIQUoRvAIAky3W5WxoyWj89f2W1IDg6/Ub9FAD80z9Z7KZdW3Xz6ZvHqZ8G6Zbry3kuB4QU4RsAIImNp%2BHUceM6ccdPFgQjU/10//FwVqQAwATTp7py60yPav8x6qcB4nkcEGKEbwCAJDaehhP10%2BB51U/DWpECAFMsmuEmz4AbSt%2BfNN6VsCmF%2BqnruhwfAoQY4RsAIImNp%2BGl1dOeK2YLguNVPw1rRQoATKHbT/Xaqr9WV7pyd3X6tTYszK%2Bfuo0CILQI3wAAg9h4Gl4dN1A/DZLWT1dVmlORAgATXDap/9p6//y4LJzhSNgZXT9l0ykQaoRvAIBPsPE0tOJTLpcz160QBOemz6RXpKifAkBh9NqqIZwJTK6fjjvPDVQgzAjfAACD2HgabudmLaZ%2BGrCBitRQ1E8BIDoMrZ92LKgu7xAAoUX4BgAY9LHEGgWhRv00WDqdYdKGPgCA/4yrn1pMvQFhR/gGABi0dE55a%2BINd05DjPpp8Lw29FE/BYDoMK5%2B6jjvC4BQI3wDAAzH3dPQo34aPOqnABBtWj%2Bd%2BIcmMUHcsRsFQKgRvgEAhuPuqRGonwaL%2BikAoOxn28Xq7ZKwsxxpFQChRvgGABiGpQtmoH4aPOqnABBt/fXT7RJyHbdcX85zNyDkCN8AAMOwdMEc1E%2BDR/0UAKJt0h%2Bawl0/5bgQwAiEbwCAYVi6YJYzVWsEwaF%2BCgAIc/3UjTtvCYDQI3wDAKTjLqoxesuuks5rqZ8GifopAERbmOunjmvznA0wAOEbACAdSxeM0nndimQIh%2BBQPwWAaNP66UUfHZWwcbhhChiB8A0AkM5yGwVGOU39NFDUTwEA5e%2BFrn7aeuG4EAAhR/gGAEgTu4ilC6b5%2BIrZcu6axYLgUD8FgGiLnWuXqf/6ioSF67o0FQBDEL4BANIsuLq8IxEntAqMome/xSdfLggO9VMAiLaLf70vRPVTmgqAKQjfAACe4g7bs0zjjJ8sp25cJwgO9VMAQFjqp26f3SgAjED4BgDwFONuqpGonwaP%2BikARFtI6qcdt1xfzrIFwBCEbwAATx8L576Zivpp8KifAkC0jXn9lC2ngFEI3wAAni5sz%2BoQGIf6afConwIAxrJ%2B6sY5HgQwCeEbACAjx3H2CIxE/TR41E8BINrGtn7KeW%2BASQjfAAAZWVQajEb9NHiZ6qfNbQRwABAFY1U/XTKnvFEAGIPwDQCQUZ9r7xYYi/pp8DLVT3ccsqWrTwAAEVD0%2BqkljQLAKIRvAICMOPfNfFo/PX9ltSA4Geunh3iaBQBRUOz6Kee9AebhWSEAYESc%2B2a%2BjhvXiTt%2BsiA4XvXT99uonwJAVBS3fsp5b4BpCN8AACPi3DfzUT8NntZPF8ygfgoAUVak%2BmkH570B5iF8AwCMiHPfSoNWT3uumC0IzvKZrlw1lfopAERVUeqn3BQFjMSzQQDAiPTcN0ukVWC8jhuonwZt7Vw37THqpwAQHUHXT12OAwGMRPgGABiV6/JErxTEp1wuZ65bIQjO9KmuLPsc9VMAiLIg66duH%2Be9ASYifAMAjM5yGwUl4dysxdRPA5apfvr6MZ52AUAUBFg/bb3l%2BnJqp4CBeBYIABhV7KJYo6BkUD8Nnlf9dP9xS371J%2BqnABAFAdVPGwWAkQjfAACjWnB1eYdYPOErFdRPg5exfnqY%2BikARIXf9dN4XDgGBDAU4RsAICtu3HlLUDKonwbPq356spv6KQBEhd/104t6uBEKmIpnfwCALHHAb6mhfhq8VZXUTwEgynyrn1rSuKC6vEMAGInwDQCQlSVzyhsTb3jSV0Konwbvmk%2B5snBGegBH/RQAouPS5hekUK7D5nnAZIRvAIDsuc7zgpJC/TR4y2c6ctmk4Y9RPwWA6Bjf8fuC66duHw0EwGQ86wMAZM117d2CknOmao0gOJPGiay9Pn35AvVTAIiOqb98JRnC5an1luvLmwWAsQjfAABZGzdR9Ikf1dMS01t2lXReS/00SNRPAQBl7z0reWoUAEYjfAMAZG3B1eUdYgl3XktQ53UrkiEcgkP9FACiLd/6qesIx34AhuPZHgAgJxz4W7pOUz8NFPVTAEAe9dOOC0uvABiM8A0AkJNxE%2BznBCXp4ytmy7lrFguCQ/0UAHBJbttPOW8XKAGEbwCAnFyonjYKSpKe/RaffLkgONRPASDaJnx0VKb8al9WnxuPC40DoATwLA8AkDOqp6XLGT9ZTt24ThAc6qcAAK2fxrpOjvp5F/VwwxMoBYRvAICcUT0tbdRPg0f9FACize7tkrKfjbz91HXdPQuqy9kyD5QAwjcAQM6onpY%2B6qfBo34KANE2Wv3UdS3OewNKBM/uAAB5oXpa2qifBo/6KQDgokQAl8n48yxbAEoF4RsAIC9UT0sf9dPgUT8FUCq6%2Bix550NuHGTLTdzkOl21Rk7d/A3vj1M5BUoK4RsAIC9UT6OB%2BmnwqJ8CMN3Jbku2/sxO3jh48zgB3Gh6Eje32m55SM7NynyDi8opUFp4VgcAyBvV09JH/TR41E8BmEzDti0HbTnR2f/%2Bq4kbBxrGwVvndSvkZM36xI2ty0b8PCqnQGkhfAMA5I3qaTRo/fT8ldWC4FA/BWAarZnuOGzJrpbh16nuxO%2B3vse1K1Vv2VXy0ZKHkhPlWXiOyilQWgjfAAB5o3oaHR03rkueT4PgUD8FYIoTnf3Tbu986H19mjfNFXxCp900eNMALhvxuNAsAEoMz%2BYAAAWx4vHnBSWP%2BmnwqJ8CMIHWTDcftJM3B1JNTl7HXFld6SR/H3XxKZfnMu02oPX/uLacyilQYgjfAAAFsSfG9Aki1YgI0OqpHhKN4IxUPwWAsaQ1U62Tas3Uy/SpIvfPj8tNn3EEktwW3rbkW1lPuw3RKABKDs/kAAAF0eqpw%2BKFyOi4gfpp0DLVT187xvQbgLGh07daM800has3DTYmgrfUa1cU6bSbLlQ4PW9NXv%2B9dB2hUQCUIMI3AEDBLGHxQlToi4oz1%2BVUn0GOMtVPX/3AlhNnCOAAFNerH/RPvGWqmdbd4CRrpvhk2q2AKfHWJXPKGwVAySF8AwAU7MITRaqnEXFu1mLqpwHLVD99/jDhG4DiONndH7q9lmHpy6zEdUprpnq9irpCp90GuI7D1BtQogjfAAC%2BSDxhfEIQGdRPg%2BdVP9UNg9RPAQRttJrp8s%2B58s0bHGqm4su026A%2BmgRAySJ8AwD4wo3ZbOaKEOqnwdP6qVeVi/opgCDtaumfeOvqS/%2BYhm1aM102k5qpX9NugyxpXDqnvFUAlCTCNwCAL265prxZnzgKIoP6afDmTXOlahr1UwDB05rp5oMxefM4NdPR%2BDntNsCJs2gBKGWEbwAA37hsPY0c6qfBWzvXSR5qPhT1UwB%2BeucP/TXTE53eH19d2V8zTb0WRY3v026faL1lTvlzAqBkEb4BAHwzbkLyrBIWL0QI9dPgJbefzqV%2BCsB/XX1Wsma641DmmunG%2BXFZOIOaaRDTbkM0CoCSRvgGAPDNgqvLO8RlU1fUUD8NXqb66a6jhG8A8qM1U512y1QzvenK/prp9KkSaQFOuw1yeoWlVUCJI3wDAPjKdVm8EEVnqtYIguVVP9VNhG8eJ4ADkBu9bmjwdrI7/WOTx/XXTL2uOVFz/srqIKfdBjTfcn15swAoaYRvAABfLZlT3sjihejpLbtKOq%2BlfhqkjPXTY3ZyggUARqM10%2B802bKrxbtmqlNu91MzTU64/enmbyR/BX2uqeMw9QZEAeEbAMB3LF6Ips7rViRDOATHq37anXgBvYPtpwBGoYtadNqtuc37erFwhit1N8aT57xFmU67/a9ljyXfFkHr%2BPNCYwCIAMI3AIDvWLwQXaepnwZuVSX1UwC50evD5hFqpl%2BvdmR1ZbRrpsWcdhuicUF1Oc%2BXgAggfAMA%2BI7FC9H18RWzkxvhEBydSrl1JvVTAKPTmunW9/prpl4GaqZeC12iRM90a7vloWJNuw3qdeRhARAJhG8AgECweCG69Oy3%2BOTLBcFZNMOVaz5F/RRAZjoRqzVTfetFa6Yb50e7ZqoTbjqxrdtM45Mvk6KypHHpnPJWARAJhG8AgECweCG6nMSLmVM3rhMEa%2B311E8BeNvV0j/x5lUz1bCt7ob%2BmmmUDUy7nZs1NtPaTlxoCAARQvgGAAiMG6dOEVXUT4NH/RRAKv3Z19DtzePeL/NmfcpNBG/xtMnZKBnTabdPtN4yp/w5ARAZhG8AgMAkp99YvBBZ1E%2BDR/0UwADdYjpSzXR1pSvfvMGJdM10rKfdBjic9QZEDuEbACBQruM8IYgk6qfFQf0UiDZdqqA10%2B802Ynfp398oGa6cEZ0a6YhmXYbFBeO5QCihvANABCocRPtemH6LbKonwaP%2BikQXcma6c8y10znTXOT20yjXDMNy7TbEM%2BxaAGIHsI3AECgFlxd3sH0W7RRPw0e9VMgenS6VWumJzrTP6bTsFozvbs6fTI2KsI27Tagl8opEEmEbwCAwPWJ/ZwgsqifFgf1UyAaBmqmu1pGqJneGI90zTSE025JruvuYeoNiCbCNwBA4JJPNC3ON4kyrZ%2Bev7JaEBzqp0DpO9HZP%2B2WqWa6cEZ/zXT6VImksE67DXKtegEQSYRvAICicOPULKKu48Z1yRdGCA71U6B06RSrnu92sjv9YwM109WV0a2Z9pZdFcpptyFaL2yBBxBBhG8AgKJIPuFk%2Bi3SqJ8WB/VToLRozVQ3mWaqmeqUm067Rblm2nndCvloyUPhnHa7wOGsNyDSCN8AAEXD9Bu0eqpn8SA41E%2BB0qHBudZMm9u8f3a1Zqrnu%2BnPfRTptJuGbrrYJ%2BRab5lT/pwAiCzCNwBA0TD9BtVxA/XToFE/BcyXrJm%2Bl7lm%2BvVqJ9I103PXLE4GbxrAhR1TbwAI3wAAReXE5XlBpMWnXC5nrgv9lILxqJ8CZtIJVQ3dtGbqZdan%2BpcqVE1zJYr0vyG6UOH0vDViCKbeABC%2BAQCK68IT0FZBpOmB2NRPg0X9FDDPQM1U33rRmuk3b3AiWzPVabe2Jd8y6r8fTL0BUIRvAICic13nCUHkUT8NHvVTwBy7Wvon3ryWKmjYVndDf800ioZOuxn2343WuHDcBgDCNwDAGBg3wX4u8aZDEGnUT4uD%2BikQbjqJuvlgLPEzOXLNNDVIjwoTp90GuI48v3ROeasAiDzCNwBA0S24urzDdZh%2BA/XTYhipfuo1YQOgeHSLqdZMT3R6f3x1ZX/NNIpLFQyedhvQmrjEPicAIIRvAIAxMm6iXS9Mv0GonxZDxvrpIZ4KAmOhq89K1ky/05S5ZrpxflwWzohmzdTkabcBTL0BGIpnXACAMcH0GwZQPy0Or/rp%2B21WcvIGQPFozVSn3TLVTG%2B6sr9mOn2qRE4JTLsNYOoNwDCEbwCAMcP0GwZQPw1epvqpTr9RPwWKQ89a1ODtZHf6xzQc15rp2rnRrJmWwrTbAKbeAKQifAMAjBmm3zDUmao1gmBRPwXGhtZMdcvwrpbMNdP7I1ozLaFptwFMvQFIwzMtAMCYYvoNA3rLrpLOa6mfBk0na1JRPwWCc6Kzf9rtnQ%2B9X3otnNFfM9UALmpKadptAFNvALwQvgEAxlRy%2Bs2VhwVI6LxuRTKEQ3CmT3Vl2eeonwLFoDXTzSPUTNde7yYC8ejVTHXC7U83f6OUpt0GMPUGwBPhGwBgzC2pLNfpt1YBEk5TPw3c8pmuXDWV%2BikQFK2Zbn3PTtZMvegyBZ12u%2Bkz0auZnr%2ByWv7XsseSb0sNU28AMuEZFgAgFByH6Tf0%2B/iK2ckqEoK1dq53/fRXf6J%2BChRCf4a0ZprpZ0lrphsjWDMdmHbTXyU27Tagdcmc8k0CAB4I3wAAoXDLnPLnEm%2BaBUjQs9/iky8XBCdj/fQw9VMgX69%2B0D/xlqlmWneDk6yZRk0pT7sN4CYigJEQvgEAQsN1pE6ABGf8ZDl14zpBsLzqpxoavH6Mp4hALk5294dur2X42Zn1qf6lCqnbhkudTrjpUQIlPO02oPXCTUQA8MQzKwBAaCyZU94oljQKINRPi8Wrfrr/OPVTIFuj1UyXf86Vb97gRK5mqhtM2255SM7NKv3rOFNvAEZD%2BAYACBU3zhNYfIL6afConwL529XSP/Hm9bOiYZvWTJfNjFbNdGDa7WTN%2BsT1%2BzKJAKbeAIyK8A0AECpMv2Eo6qfFsajCTZvKoX4KZKY1080HY/LmcWqmQ0Vp2m2A6wj/kQIwKp5RAQBCpzfOE1l8gvpp8CaNE1l7ffp0DvVTIN07f%2BivmZ7o9P746sr%2BmqkuWIiKCE67DXguedMQAEZB%2BAYACJ2lc8pbE7eSnxDgAuqnwdMJnYUz0qd0qJ8C/br6rGTNdMehzDXTjfPjiZ%2BjaNVMozjtNqCXs94AZInwDQAQSrEJ9qbEmw4BhPppsSyf6VA/BTyc6OyfdstUM73pyv6a6fSpEhkRnnYb8FzyZiEAZIFnUgCAUFpwdXmH6zD9hk9o/fT8ldWC4FA/BdK9mfj7v/VndjKITqXVUq2Zrp0brZpplKfdLmhl6g1ALngWBQAItX1HT/028aZCgAS7t0s%2B/drfiZV4i%2BDsarGTgcNQOhGnkz1RChgQbVoz/f4hS5rbvF8y6ZTb3dXxtGnRUqbTbmeuWxHl0C3JdaVuSWV5vQBAlph8AwCEGlvEMBT10%2BKgfoqo00lPrZlmCt70fMS6G6MVvDHtNqiV4A1ArngGBQAIteQWMUsaBbhAq6f6IhDBoX6KKEvWTN/LXDP9erUjqyujVTON%2BNluwzjUTQHkgfANABB6vXGm3zBcxw3rkvUnBIftp4iak939oZvWrr3M%2BlT/UoWqaa5ERW/ZVfLREqbdhnjuljnlzwkA5IjwDQAQerpNzHUc7jRjUHzK5clzhxAs6qeICp3o1OAt02SnBtHfvMGJVM20M3GN1eBNAzj0Y8kCgHzxzAkAYIRxE209X6VVgAt0EoP6abConyIKdrVkrplq2FZ3Q3/NNCoGpt06r%2BUGx1BuInjTm4ECAHkgfAMAGGHB1eUdiTd1AgxB/TR41E9RqgZqpm8ez1wzrbshnvwZiIpz1yyW9pr1TLulaz17XliyACBv3LIEABhl369ONYgrNQJcMOXX%2B%2BTS5hcEwelOhGybD8bSJoMWJUK5VRGaCELp0C2m3z%2BUOUBeXamhc3T%2BbmuVX29mME3szXFkHWe9ASgEk28AAKNcWL7QIcAF1E%2BDR/0UpaKrz0rWTL/T5B28DdRMoxS86bRb25JvcR3NjCULAApG%2BAYAMMqF5QtPCDAE9dPgUT%2BF6ZI1059lrpnOm9a/zTQqNVOddjtZs15Oz1vD9XMELFkA4AfCNwCAcVi%2BgFRsPy0Otp/CVG8et2TLQVtOdKZ/bPK4/prp3dVO8vdRwLRbdliyAMAv9AQAAEbae%2BRUjWVLgwBDXNb4jzLho6OC4GjNVA%2BpT6VVvSgdTA8zaM30tWOScdpNw%2BS7q%2BMyfapEAme75aR18ezyqwUAfMBtSgCAkZbMKW9M3JKmfophzlStEQSL%2BilMcaKzf9otU/Cmf4%2B1ZhqV4I1pt9z0OrJAAMAnhG8AAGPFJtibhOULGKK37CrpvJb6adConyLstGaq57ulbuhVAzXT1ZXRqJlytlseXHmCuikAP/EMCQBgrAVXl3c4jtQJMETndSuSIRyCM9L20xNnONUEY0drprrJdFeL9ySmTrnptFtUtpky7ZaX1s5u2SQA4COeHQEAjLfvV6caEnepawS44KKPjsrljf8oCJYGHDphNNT0qa5snB%2BNYAPhoucRav3Za9pNac1Up92i4P9v795i4zrvu9//noc%2BkNL2Dhk7KZAm22Ps2LKTvDB5YQNNLrxIy37RnW5LApqNXEVSbhqgF5aLXaBIgIoqdooC2YCkiwLNlan0JkBeQHLfZheIHXLloulGcyEaSetDU3iE5g0KJw7HVixSh1nPu541M9KQHFLkzFpr1uH7AaQhh0MdeJq1fut/YLbb8OKLeieff2JmSQCQIirfAACld7Otk6L9FH1uxCecvuID2RrUfurnbH3/51zfRb6SNtOf7Nxm%2BkdzUW2Ct2uNL1DtNrwlgjcAWSB8AwCUnp/L4pzOCOjjZ7%2B1DzwkZGen9tO//3dL%2Byly8d56J3TzVZiDPPrRzlKF2Y9XfxOvn%2Bf2my/8cVLxxmy3oTRvRhxLAMgGR0UAgMqg/RRb0X6ajws/tfr/f0n7KfLl20z9fLedtuzWqc104xNzWnua0G0UtJsCyBKVbwCAyqD9FFvRfpqP/%2BuJ7VsjaT9Flr73ZqfibVDw5luhX3qqHm2mvWo3/4vgbSS0mwLIFOEbAKAyaD/FILSfZi9pP/0vtJ8ie77N9Js/ntDyld3bTB/7aPXbTP1Mt3efP51UvWEktJsCyBxHQwCAyqH9FFvRfpoP3wK4%2Bi7tp8jGP/3S6L%2B9sXOb6Zced1p4uB7Vbh989gV9%2BChVvWmg3RRAHqh8AwBUDu2n2Ir203z46jfaT5G2a7dM0mb6nZ/u3Gb6jc%2B3axG89ardCN5SQ7spgFwQvgEAKse3n8Y3JwX0of00ezu1n/7wik3aBYH98l83f/lju2Ob6e99otNm%2BskHVGm%2B2u392S/rveBP459jDwqpaF69ppcEADngKAgAUFmvvfXeUnyd6biALtpP8zGo/dTP4PJD8IG9Wr7iqyYHV7v5Cssvfroebaa%2B2q319FcJ3VIWGc09/9jMqgAgB1S%2BAQAqa%2BI%2Beyq%2BaQro8u2nDCfP3qD207d/Y5IwBbgb32b6nZ/5VtOd20y/XoM2U6rdsuMinSF4A5AnjoAAAJX26htrgbFaEdBlb17T73z/z2TiW2Tnn/6HD1A2X%2Bf1bal%2B%2BcKDU9XfRInh%2BBmBf3PZtykPfvvCw05f/PT2cLdqqHbLVPPwoZlHBAA5ovINAFBpzz0xE8aXuM8L6IruPaC1pxkJmLXf%2B12XtJr2W7%2BlpKIJGMRXRn7zx4ODNx%2B2feVzTl96vNrBG9VumWvdjDQvAMgZRz8AgFp47e21FTkFAroeDL%2Bl%2B3/1lpAdH6L85Y8ntrUO%2BgDFVzABnm8z/fZlk7QmD%2BKXKXxtrp20m1YZ1W7Zc04vPff4zDkBQM6ofAMA1MLNdrL9tCWgq/XUyaTKBNnxYcn/8entc7n%2B/udsP0WHD9z8NtOdgjcf0n7j89UO3qh2y80SwRuAcSF8AwDUwu8/MdOMIr0koKt98CF98NkXhGw9%2BzDtpxjs7//d6OxPdm4z9dtxfZVkld2c/pTeff60Pnz0sJCp5s1IZwQAY8JRDwCgVl57871zMvZFAV20n2aP9lP081WPPnzdqdrt0TisPf65qPJtplfj8P/qZ7gAkIc4eHvEX4QTAIwJlW8AgFqZuN8uxjdNAV20n2aP9lP03K3N9EuPO/3JU9UO3ny126%2BeO03wlhMX6QzBG4Bx42gHAFA7//DGWuNeq8vxi9MCYgf/7TV9ZPW7QrZ8i%2BHW0MW3pPr2QlTf9940Wr4y%2BNq/D9u%2B8rloW4ty1VDtlrulw4dmWG8NYOyofAMA1I6/Au4cs19wh5%2B35DcNIls%2BXPGzvPr5MG75CteDq8xXN37zxxM7Bm9Pftzp659vVzp48zMmqXbLHXPeABQG4RtK6f5g4dR0EFCxAmBoycYzF50X0EX7afZoP62ff/plp830F1cHv923mX5tbnsoWyUfPnZY7z7350m7KfITB2/ztJsCKArCN5TOgYWFl63R2RtmYkUAMILu/LdVAWL7aV7YfloP126ZpM30Oz%2B12xZteD6I/cbn21p4uLotx/5nynvBn%2Br9J79MsJ8z5/QSwRuAIuEoB6XhK92uW/uynI727jNGS9eWl5njAGBozH/DVmw/zR7bT6vtF1eN/uayTT7Pg/jP8Rc/Xf1qtw8%2B8wKh2zg4nT/8%2BMwpAUCBUPmGUvDBW1Lp1he8efFVrRO%2BEk4AMKRk/lukYwK6Ppj9spAt2k%2Bry8/vO/vPg4M3H7b5NlMfslY1eKPabeyaV9e1KAAoGMI3FN5kEDR88ObkZge9vRvAnRYADOm5J2ZCx1BmdPm5TAxFzx7tp9Xi20y/fdnqe28ObjP95ANKlipUuc20N9uN5S1j4xcszB%2Bbm2kJAAqGoxsUmg/ejLF%2Btlvjzr2uKWfOx1%2B9Z/sfa4wWry0vc/IMYGivvbV2Mb45KiD2sVfP6N7WfwjZof20GvzG2u/8rL5tpr7azS9sIXQbr7Z07L8emrkkACggKt9QWDsFb865%2BfVw%2BZxz0aZZb85pkQo4AKOYuE/%2B50pTQOx92k8zR/tp%2BSVtpj/Zuc30j%2BaiSreZUu1WDL56neANQJFxVINCujcIZu8x1legNO7c2wneNsKw2btnKlg4tbUCzrroxIdheEEAMAQWMKDfR17/rg6%2B/ZqQLR/e%2BOqpfr4l9aWnqtuiWHY%2BHPUtwls/bz2Pxp%2B/45%2BLkoC1iqh2K5Slw4dmWMAGoNCofEPhdIO3gRVv/cGb16mA2zynKTJ26WAQHBcADIEFDOjnZ7%2B1DzwkZOsrn9teGeVDHV9VheLxn5tBgWmPbzP9k6eqG7xR7VYozavX9JIAoOA4okGh%2BNAsDs/Oqa/ixMit3hcHb60w3HF46mSwsGiMNrWc3nLR3M0wXBUADOHVN9YWjRWt7NB9v3pLD4XfErL1wzho%2B29vbr4uPBUHct/4vA9xmP9WFN9704eig6/f%2B7DNB6lbF2lUBdVuhZMsWPAXzQQABUf4hsLoBm9L/fc5uXDSuWO7BW89AwK4VhzAzRPAARjWa2%2B%2Bd07GvijUHu2n%2BaD9tLjq3ma68Yk5rT19Uu7eA0IxREZzzz82w3E%2BgFIgfEMhHAgWTjujxf774uDtwsbKygntw%2BT8/JKR6W85bTkXzW1tVwWAvXrtrTU//21WqDV785o%2B9oO/0MS1XwvZ2Wn7qR/aP/txqt/GZfVdo7/9qd32een50uNOCw9XMyD1YZsP3Xz4huJwcSb/3OMz5wQAJcHMN4zdoOAtjoXP7zd48/z7%2BNCu765pvzHVb04VAAzhZmf%2BW1Ootah7Ao5s7bT99Du7BD/IzrVbJmkz/fblwR9///nyVYlVDd584PafX/wrgreC8ZtNCd4AlA3hG8ZqYMWb0Zn15eVTGtKkc/H7uv4S9AYBHIBh%2BVkyfqZM/OJd299RbTc%2BdigZtI5sPfuw2zYzbP1WJ4BDfnyb6dl/tjvOd3vy405f/3y7kvPdfLXb%2B7Nf1m%2B%2B8Me0mRbPpeeemFkUAJQMRzEYm6mFhbODgreN5eVFjcDPh7vfuflBAdx0EEwLAPaJDajoYftpPgZtP339XZO0PyJ7fsvsX/7Y6hdXt7/Nf158m%2BnX5rZ/jqrAL1N49/nT%2BvBRgvYC8ptNKUEGUEqEbxiLAwsLL8tpc3Wb00ujBm89PoBzzsUnyq7Zd3fjhpkggAMwlPhKe%2BhnzAi1RvtpPnw74/zDtJ/mrddm%2Br03d2kzfbpdyTbTXrXbe8GfxgH7g0LhJFXox%2BZmqEIHUEpcPkSufPB13ZiL8Zde0H%2B/c9HJjTBcUsp8q6kxZiX%2B%2Bxp9f1u4vrIyLwAYwqtvrC0au2mzMmroo//415r85WUhW7766j%2Bubj5c9e2OvuoK6fpF/HH%2Bm8s2WXoxyMLDTl/8dHWr3VpPf5XQrbhacfA256vQBQAlRfiG3PjgzVeeObn%2BrYEt48zJa%2BEPLykjgwI4Y7R0bXmZ0gUAQ3ntrfeWJHtcqC2//fR3vv9nMvEtsuMDoW/%2BeHujBttP0%2BXbTH212yA%2BbPvDx51%2B73erWe32wWdfoMW04CKjuecfm1kVAJQY4Rty0QnAbByAqdF3d%2BuWi%2BZvhmHmT6bdv9%2BXKNxpOTU6t768TAsZgKG89vbaipwCobZ85ZuvgEO2/v7nRt//983B0FQcCP0/z7QrWYWVJ99m%2Brc/3XmW3icfkL42107aTauGardy8OMe2GwKoAqY%2BYbMDQ7eXDOv4M3bCMPk71P/tkKnUwcWFmgdAzCUiXuTBQxNobY2PjGXnMAjW3/waadPPbB9%2B%2Bn/93MOY0fx9m86SxV2Ct58m%2Bk3Pl%2B94I3ZbuXhIp0heANQFVS%2BIVM7BW/OuXkfiCln8b8n6P57bjNGi9eWl88IAPbpH95Ya9xrtbWqFzUy8eGv9fFX/4L204zt1H760lORHvso7af79ff/bvT9n%2B/cZurbeqv4caXarTyS4O2JmUUBQEUQviEz9wbB7D3GXlRBgreeOIA7EQdwL/ffRwAHYFgEcDj4b6/pI6vfFbI1qP3UV2V9/fO0n%2B7Ve%2BtG3/mZSareBnk0DtyOfy6qZLUbs91KxOn84cdnTgkAKoTwDZnoBm/%2BZPT2jDUjtxo5d2ycwVvPVLBwKv4Hne2/z7roxIdheEEAsE8/eHtt1jpt%2BpmHenkw/Jbu/9VbQrYGbT999mGnP3yc7ad34wO3b1%2B2unZr8Nv/4H/vbDOtGqrdSufS4UMzxwQAFcOwDKTuYBAcHxS83Tfmird%2B6%2BHyOee0qdItMnbJ/9sFIHc%2BsFeJ%2BS1skdHmuZKoldZTJ5PqGmTLb93c6odXdq7kQsf33oyvOP5kcPDmq9x8%2B24Vgzdmu5VL/N29evWaTgoAKogjFaTKh1c%2BxNp0p9Ol%2BxWdbIVh4U5KJ4OFRWPUv3ShleciCACd2ZBFCeZH9YM31k5Yq5eFWqL9NB/fe9Nq%2BcrmQ1jaTwfzbaZ/c9nqF1cHv923mX5tLqrcx%2B3m9KfiQPyryS1KoxkHb3PH5ma4iAWgkqh8Q2oOBAuntwZvTu7Cerh8rIjBm7cRLi9uqYCb9lV7Za/CAUqmoYp4/omZpSjiqn1d%2BXlSbD/N3h98evtMsvfW2X661T/9srPNdKfg7UuPO/3JU9UL3q5%2B9gX96rnTBG/l0rwZaZ7gDUCVcZSCVPjgzRktbrrT6PzGysoJFVwSwMUhYd9dPoC76KtxBCBTVfw%2B8wGc39Im1BLtp9mbisOir3xue4sk7acd126ZpM30Oz/duc30G59va%2BHharWZ%2BrDNh25XP/OCUCpJ8Pb7T8w0BQAVRviGkQ0K3uLXz6wvL5dmS5EPCbcEcA1j7AoBHJA1e2IjDENVzHNPzCwSwNVT%2B%2BBDyVZFZOuxj7o4PNo%2B/%2B07P9t5oUAd%2BDZTX%2B22fGXwIf7vfcIl7bmffECV8uFjh6l2KyeCNwC1QfiGkUwtLJwdFLxtLC8vqmQmnYvDQtc/640ADsDQCODqi/bTfNB%2Bupmfg%2BeDN/8x2Mq3lvo206/8l2q1mfqw2y9UeP/JLwulQ/AGoFYI3zC0AwsLL8tpc3Wb00tlDN48P5fufufmBwVw00EwLQCpmgwWTkhRqAojgKuvD2YJA7JG%2B2mHbzP9zs9MsohipzbTr1ewzdRXu7373J8TdJcTwRuA2mEwBvbNB1HXjbkYf/kE/fc7F53cCMMllZyvdDPGrMT/v0bvPiOzep9rzxd1cQRQRlPBwkW/kEU18Ooba4vGbtqsjBp44F/%2BTg/8698J2arz9tNfXO1sMx1U7eb51twvfrp61W5%2BtiKhW2m14uBtjuANQN1Q%2BYZ924jzN23bTuiak9IlVUAcIDZdpwKu2bvPyc12AkcAaTgYBLPxqXJtwmwq4OrJb11kBlX26tp%2B6gPHb%2B7SZvqVzzl96fFqBW9Uu5VeKzJUvAGoJ8I37NugcMpXiVUpnNrh/xgkrbYARta29sVbil5RjRDA1dP7tJ9mrm7tp77N9OxPbFLxN4hfpuCr/n7vd6vTZto/241twqWVBG/PPzazKgCoIcI3DKU%2B4dTmg/b4/xywgAEYTdLa7XT0RhhWolp2Pwjg6ufGxw4l1TrIVl22n/ow0S9V2ClU9B%2BDb8TB29ZKwDKj2q0SCN4A1B7hG4Z2J4C70zrmnE74Dagquc7cN7uiTe21Lvn/%2Bv%2B3AIzABnH4VrvgrYcArn6ufuYFtQ88JGSr6u2n33uzU/G2U5vpS09FSZtpVVDtVhlNgjcAIHzDiHwQdctFmwI4vwH1wMJCaQeLE7wB2TJGp%2BvWcroVAVy9RHFwsPb0SSFbVW0/fW%2B9E7otXxl82P7oR13SZuqr/6qCarfKSLaaErwBANtOkZI4sAq6gdVt8Qn24rXl5VKdXN4bBLP3dP4f03fuJXgD0tL9WXFxfWV5RmALas185PXv6uDbrwnZqtL209V3jf72pzu3zn7pcd9uW61qNzaZVkYSvLFcAQA6qHxDKuJgKnQu2nRZ3zktlqkCzocCW4M3I7d6v3NzBG9ASqw9Hv9w%2BJGQoAKuXmg/zUcV2k/9UgXfZvrty4ODN///822mVQreqHarFII3ANiC8A2piQOqJTm91H%2BfD%2BAOBsFxFZz/N5otwZuTC%2B9zbr4Vhi0BGFl30cKJ%2BHurtvPeBiGAqw/aT/NR9vbTpM30n3duM33y49VqM/Xz3H7zhT9mtlt1ELwBwACEb0jVerh8Lg7cNp1ERsYuFTmAmwqCF/2/sf%2B%2BOBy4sLGyQvAGpMqe8L9Pqr7LFnbiA7goEqlMDbD9NB87bT/9/r8XO3zz7bJ%2Bm%2Bkvrm5/m2%2BZ9W2mX5uLStc%2Bu5ONT8zpP7/4V8ktKoHgDQB2wMw3ZGIyWFj0Q9X77mr5xQw3w7BQA1cPBAunndHipjuNzq8vL58SgFRNzS%2B8EwfbTR9sCwO99tba0fjmZW2aO4mqsTev6WM/%2BAtNXPu1kJ31W9I3fzxxezuoD%2BO%2B%2BOliBle%2BzfT7P9eO1W6%2BzfRrc2198gFVgutWgRK6VUccda/%2B9prmj83NcOEaAAag8g2Z2AiXF7dUwE37eWp%2BoYEKYlDwFr9%2BhuANSF8cyJ%2BQ3yDs3AVhR4cPzVyKjDZvkEbl0H6aj177aW8%2B2pceL2bw9ournWq3nYI3Hxr6NtOqBG9%2BphvVbpVzieANAHZH5RsyNTk/v2Rk%2BltOm85FY98cOrWwcDa%2BRLcpZPPB28by8qIApG4qeHZFxgXx9/8jLDC5u394Y61xr5WfQ9kQKuuj//jXmvzlZSFbfmFBUds0fZvp938%2BeKmC/zd/8dPV2Wbqq90%2B%2BOwL%2BvBR2q4rJdKFw0/MnBAAYFeEb8hc0QK4AwsLLzunE/33EbwB2UkWLRjrW05DWk73jgCu%2Bnz76e98/89k4lvUi28z/dufGq2%2BO/hQ3Fe5%2BTbTrVtby8pXu7We/qraBx4UqsMvC/IzSwUAuCvaTpG5SedOxU/P/bPe/In4ij8hV46mg2B6amHh4rbgzUUnCd6ADFmbzH80zrwi7JkfWO0HV8cvFmpWJtJD%2B2k9%2BY2rvs10p%2BDNt5m%2B9HQ1gjdf7fb%2B7Jf1XvCnBG8VQ/AGAPtD%2BIbM%2BY2h9zs3PyiA84GYcuD/nhtmYkVOR/v/aUnwFoZLApAZ4xT4W6eILaf75AO4ifuSAI6PXUX5uVe%2BKgj14NtMz/7E3l4C0c%2B3mf7RXHFn0%2B2X/7p%2B9/nTtJlWkN/OTfAGAPtD2yly02k9Myvxl12jd5%2BRWb3Pted9QKeM%2BL/XmomLTq5/2UMht68CVeMXLRjjt3e65vrKyiPC0F59Y23R2E1bpFEREx/%2BWh9/9S9oP62w99aNvvMzk1S9DfLoR52Od5dDlB2z3Sqt5ZcCPf/YDMfPALBPVL4hN37Gm%2BtUwDV79/lA7LoxF5WR7qyplc3Bm2sSvAH5uD3v0dByOipfZeDbfITKaR98KAkrUE0%2BcPPVbjsFb77N9E%2BeqkbwRrVbpflRCHMEbwAwHCrfkLuBFXBGS9eWl1MdfNML3rRpWLlLAkC2LQLZ6y1a8C93l6yEwsh%2B8MbaCWt9NSGq5sHwW7r/V28J1fG9N42Wrwy%2B1u3Dtq98LtJjH3UqO6rdqi3%2BCl29FemYH4UgAMBQqHxD7u5UwOl2q6lfgjC1sHBWKbk3CGYJ3oBxsyc6t65J8Jae55%2BYWYqM5uIXm0KltJ46mYQYKD/fZuqr3XYK3nyb6UtPtSsRvFHtVnGRLvz2muYJ3gBgNIRvGAsfgPnWT/UFcPFltVMHFhZGnmfkg7d7CN6AsTNGScupcSYUUuXbfrqbUJtCZdB%2BWh3fvrzzfLcvPV6NNlM2mVafH3Vw%2BImZE8fmZjKbzQwAdUH4hrHxM9eMiza1mjqnxVECuAPBs0e7wdvtLapGbvV%2B5%2BYI3oD8%2BO9FdQPwW4qY95aB7iZUXwHHJtQK8dVDbD8tvz98fHtFmw/bvvH5thYejlR2VLtVX3xM/hIbTQEgPYRvGKtrYXjJpRTAHQyC4844v7zhdvDm5ML7nMt0myqA7SLrjvRePiCFQibmH5lpHT40c4xFDNVC%2B2n5%2BXZSv0ih58mPO309Dt4%2B%2BYBK7%2BpnX6DardqafrTBc4/PnBMAIDUsXEAhTAULp%2BKvxk0z36yLTnwYhhf28v4HgoXTzmix/744eLuwsbJyQgBytWnRQhyAx9%2BH80LmXn1z7ZTZ8nMU5XXw317TR1a/K5Tb31y2cRCnSlS73Zz%2BVBwMfzW5RTWxWAEAskPlGwphPVw%2B59zmyo3I2CVfzXa39x0UvMVB3nmCN2BcbHD7Ref2FKBjdL5KgUUM1UH7aTV8bS6qRPDmq91%2B9dxpgrcqY7ECAGSK8A2FsREuLw4I4M75BQo7vc/AijejM%2BvLy6cEYCyMUX/beCjkpm8Rw6pQeh/MflnAOPklID50u/oZFoFUGYsVACB7tJ2icKaChXPxV%2BaLfXe1/GZUv6Bh0%2BMWFs76Dan99/ngbWN5eVEAxmIyCALTWXoiv2V4fWXlEWEsXnvzvfhnqX1RKLUH/uXv9MC//p2AvH342GF9EIduzB%2BstFYcvB177omZUACATFH5hsJZD5dP%2BXltfXdN32PsRT9HqnfHgYWFlwnegAKy9k6ruDFsOR2jw48/eMpvqxNKzbf70eqHPPlqN79Q4f0nv0zwVmF%2BvtvNSHMEbwCQDyrfUFhTwcLF%2BCv0aN9dzVsuOnaPMWfjL92g/7F%2BY%2BpGGC4JwNhMB8H09c6ihWTjcPx9OR9/X4bCWP3DG2uNe618NWJDKKX7fvWWHgq/JSBrVLvVhNP5q%2BtapM0UAPJD%2BIbC6pzIm/iE0czu8rBWfIL/EsEbMH6TwcIJY/Ry99XW%2BsryjFAI3QDOb0I9KpTSR17/rg6%2B/ZqALPhqt9ZTJ1nyUQO%2BItov6BEAlFh/V1xZEL6h0O4SwA2cBQdgPKaCZ1dkXJC84twr6%2BEKQU/BvPrG2qKxmxZioCTszWv62A/%2BQhPXfi0gTVS71UYzMjrmF/MIAErMB2%2Bm021TJk1mvqHQWmHYcs4d84PbN7/FNQnegOJIrj71gjf5jhZ3SSic556YWXSdbahNoVSiOBhZe/qkgLQw261WLl29pjmCNwAYH8I3FN5GGDbjAG7%2BTgDnktcJ3oACsXZrNVUoFJIfrn3TB3CGz1HZ3PjYoaRKCRiV/zp697k/p820Bnyb6eFDM8eY7wYA40XbKUqjU1ljXo6PIvxyhaYAFMbU/IIv/W50XnOr6ysrc0Lh0YZaPrSfYhTMdqsV2kwBVNLWttP4IsMZFbCrIw7bjvQtkGzeI6AkuoHbvAAUyoHg2aNOrnH7DmN%2BJJSCb0P9wdtrl6zTRbENtRR67adsP8V%2BMdutRiJduLqhU1S7AaiHKIyzglAFMxksNEzfsjPaTgEAI4msO9L/uosi5r2ViK%2BK8G2oURRdEEqB9lPsB7PdaqWVtJk%2BMXOC4A0AioXKNwDA0JKyb6cTfXe1injlCbv7/SdmmvHNiVffXFs1JmlDnRYK7epnXtDkL1ZpP8WuNj4xl1RKErpVn5NWb0U61v15DgAoGCrfAAAjsMGmV52j5bTEnnt85tzNSH5eX1MoNLafYjc%2BbPvNF/44%2BUXwVgNO5587NDNH8AYAxUX4BgAYmjHmxf7XnRwtpyXnT94OH5p5xEXJ8FoUmG8/9ZVNQD//NfGfX/wrvjbqoRn/rJ4//PjMKQEACo3wDQAwlGQDsdzslrtDoRL8MoabkR4RVXCF1qKlEF1Uu9WM0/mr1zQX/6wOBQAoPMI3AMBwrD29%2BQ7X7G4lRkX4KriJ%2BzQnF50XCon2U3jXP3ZI7z5/mmq3erhd7cZSBQAoD8I3AMBQjFOw%2BXUTCpUz/8hM6/DjD57yJ3uiCq6QfODiwxfUj69we3/2y8k20/aBB4XKu0S1GwCUE%2BEbAGDfJoMgiG8a/ffdUvSKUFn%2BZI8quOJqPUX7ad30qt0%2BfPSwUHmttnTs8KGZY1S7AUA5Eb4BAPbP2uNb7zrAvLfKowquuNoHH9IHn31BqD6q3WqmM9vtkf96aIaFRgBQYoRvAIB9mQ6CaeN0ov8%2BJxe2wpCr8TVBFVwx%2BQoo2k%2BrjWq3WmG2GwBUCOEbAGBfNmSPbr3PGPO6UCu9Kjg2ohYL7afVRLVbzbDJFAAq5x4BALAPRua4PzPo56KIdpia8htR45tHXn1jbdFYnRbGqtd%2B%2BpHV7wrV4KvdWk9/ldCtBuJn1lVFeonQDQCqh8o3AMCeTQZBQ8YFW%2B5ubYRhKNRafLK42K2CI4gdM9pPq4Fqt1ppuUhnnjs0Q7UbAFQU4RsAYB9ssPUeJ7cqQJ0qOL%2BNL4p0UrSijhXtp%2BXGbLcaMQrjCxc%2BdFsUAKCyCN8AAHtmzPa2QuPMKwL6PP/EzNJNvxGVhQxjw/bTcqLarVY6CxUem5nvtu8DACqM8A0AsCcHg2A2vmlsvf%2BWolDAFkkV3J2FDFRHjgHtp%2BVyc/pTVLvVQ9JiykIFAKgXwjcAwJ60rX1xwN2tm2FIsIIddVtR52hFHY8PZr8sFN/Vz76gXz13mmq3qutrMT02N9MSAKA2CN8AAHtinIJtdzr3IwF70GtF9RUfQm58NdXVz9B%2BWlT%2B8%2BNDNz5HlUeLKQDUHOEbAOCuJoMg0ICWUyfHZkvsmT/p7G1FjaLogpALX1XlQx4Uy4ePHU6CNz43lZa0mB4%2BNPMILaYAUG%2BEbwCAu7P2%2BKC728zywhB8CPf8Ew%2Be8JUgohU1F%2B/TfloYfhmGX6jw/pN8TirN6fzVa3qELaYAAO8eAQBwF8bp6PZ7XZN5bxhFtxLkkR%2B8sXbC2mSTbkPIxI2PHUoqrQ6%2B/ZowPv5z8MFnXki2mqKi/Fy3tk7SXgoA6EflGwBgV5PBwon4ZnrbG5xeF5ACPw/Ot2V158E1hUz4uWLtAw8J%2BeuvdiN4q6g4dGOuGwBgJ4RvAIBdGasjg%2B5n3hvS1p0HN888uGxEceiz9vRJIV%2B%2B2u3d5/5c1z92SKikpt/m7EM35roBAHZC%2BAYA2NFkEDQ0sOWUeW/IRm8eHEsZstFrP0X2qHarvJZzeslX7frqXQEAsAvCNwDALmww%2BH7mvSFbhHDZof00e1S7VVqywTRZpvD4zDkBALAHhG8AgB0ZmYFbTpn3hrwQwqWP9tPsUO1WaXdCtydmFo/NzbQEAMAese0UADBQ0nJqXDDobcx7Q966A8xPvPrG2pKZ0On4izAQhsb20/SxybSyfOh2/rcbOkfgBgAYFuEbAGAHNtjpLcx7w7h0B5qHcQgXEMKNxrefTv5iVRPXfi0Mz1e7tZ46SYtp9RC6AQBSQ/gGABio03LqBr2pxbw3jFt/COcUnbDWHhf2pdd%2B%2BlD4LWE4VLtVEqEbACB1hG8AgG12azmVcz8SUBC9EO4f3lhbnFC0SAi3P779dOMTc5r85WVh71w3uPQfO1QGoRsAIDMsXAAAbOOkozu/1YQCCobFDMNrxSESlVt75wO3//ziXxG8VUfTOb3EIgUAQJaofAMAbGPNxE4tp7qlKBRQUL3FDH2VcM/ErzeEHfXaTz/6j38t7Ixqt4oxCuOnufOHD82wQAgAkDnCNwDAJknLqdzsDm9m3htKoS%2BEa0xIgbU6LUK4HflAyS8MuP9Xbwnb%2BY/PGhWC1RCHbq6tM92WdQAAckH4BgDYxMie2ultTo7gDaXSDeGW/K8fvLF2wk7oOBtSB/MbOx8K/1%2B2n/bxYdsHn31BHz56WCi1VuSiC7pll57/3AzPYwCA3BG%2BAQA2Mzqy49ucYdkCSuv5J2aW5EO4t9dm1Y5OsZxhs/bBh/Tr4P/WA//633Wg%2BY%2BqO18J2Hr6q2ofeFAorb4lCg8yyw0AMDaEbwCA2w4GwWy0a2se895Qfs8/llS%2BJHPh7jE6aoxeFC2pCR/A%2BQq4q5/5P2tbBUe1WwXQWgoAKBgjAAC6poKFc%2BoEEQOtryzzvIFKoiV1sKnmP%2Bp//Zf/XpsQjmq3UqO1FABqwM%2BnNsa%2B03vdOC1F0hUVjDHumfj3oPtqk5MoAMBtU/ML/omsMehtTi7cWFmZF1BhnQUNbEndquohHNVuJear3CK98tt1LR2bm6G1FAAqbmv4VhJN2k4BAIm7tZwaY14XUHG9Lan%2BZarh7lhvfCH5VcUQjmq3Ukqq3Iyzl2gtBQCUAeEbACARyZ7Y7e3tiHlvqJfegoakGs5Ep6yxfhlJQzXWH8IdaP5Y9//qLZUV1W4lZBTGYfj5q9cUskABAFAmtJ0CABK7tZx6zkWPbIRhU0CNvfrGWuAUnWBTase9rf/QwX97TVP/47LMzWsqC6rdyiM%2BWWlGkS50NpbSVgoAKCfCNwBAp%2BXU2Ms7P8I111dWHhGAxMXLa9MHJ3WUttQOH7xNxgFc0avhqHYrDdpKAQCVQvgGALjrllM598p6uHJUALbpLGlQYG3yPTSrmpv48Ne6Lw7gihTE%2BdDtt48d1m/j0M2/jEJqxc9Dl1xbFwjcAABVQ/gGALhry6mcXloPl88JwK58EHeP0VFj5NtSax/E%2BYo4H8Dd/%2B5bSSDn21TzcnP6U7rxsUPa%2BN25pM0UheQDt1UTB24fbOgSbaUAgKoifAOAmrt7y6l0y0VzN8NwVQD2jCBuOx/G3RcHcPe92wni/NbUNAI5X812Iw7bbsW/fOi2HgduVLgVFoEbAKB2CN8AoObu2nIaW19Z5vkCGMHtIM7qCDPitvMBnI2DOd%2Byam6sJy/7X4OWOLQPPKQoDtbcfVNx0Pa/xbcHdIvFCUV3u6X0txtaJXADANQNJ1MAUHN33XIqF26srMwLQCr6ZsQdiV9lliIqyW8pbbvoFZYmAABA%2BAYAtbaXltP4meL8%2BvLyKQHIxGtvrR2NouiotfYZ7TZ7ESg6o9C19SM3oUvPPzbDqAIAALruEQCgtiLZE3d7TDuKQgHIzOFDM5fiG/9LP3h7bdZECmhPRUkk7aQmDtyY3wYAwM6ofAOAGpuaf/ay5HYdBO9c9MhGGDYFIFcXL69N/y%2BTmnUmOmpNUhXH0gaMW7IswUV6xVmFVLcBALA3hG8AUFOTQdAwxr6z%2B6Ncc31l5REBGDs/K%2B5eq9lui%2BqTIoxD9jphW1s/il8Omd0GAMBwaDsFgJpy0lFz9we9LgCF8PtPzDTjG/8raVG9Hca5KKAyDim5XdkW//xfZTMpAADpIHwDgJqyZuJ4EsHtyoQCUEhbw7hem6oUBWYiDuNcEsZNC9iB30jq/JKESK/TRgoAQHZoOwWAGtpby2ky721%2BIwxDASglv8BB7U4gR6tq7fkKtjBy0RVrbHj1mkKq2gAAyAeVbwBQSzbYy6MmpdUNASirbiWT/7XUu%2B/VN9aC%2BPLrbByuz9oJ%2BzBbVSvpdtA24ezqjfjlbqUkAAAYAyrfAKCGpoJnV2RcsPuj3Or6ysqcAFSer5CzTg0XRbOmUyHXEFVyZeBDtmZ3TtvrxqhJRRsAAMVD%2BAYANbPXllM598p6uHJUAGqpN0POWE0Tyo1XMpvtzjKEJGS7GWmVajYAAMqBtlMAqB0b7O1xLFsA6qxbPRV2X73U/za/aTU%2BiGzY%2BFekqJEEc0bTLHkYXjdgW41faPmAzTq12hNa/fBDNalkAwCg3AjfAKBmjNWRuy45ld%2BDGrH1DsBAfZtWB/JtrKat6dvhnJ8t16mak/Htrd2Xa6IVB2stZ5KPVzOKoveNbLMXrrXbalHBBgBAtdF2CgA1Mh0E09eNXdvLY9dXlnmOAJAZ39Z68KAaPqTzra0m0rQP6uKQatpa%2B5H4CsB0Uk2nTmDnb8cc2iUhWvLvMLeDx%2BTWtaMr8ZWNlg/UnFUrit/uQ7WNDbWoWgMAAFS%2BAUCN3NBEoL2UvclR9QYgU91QauifNb71tffyxEQc3rUHt7v2gr3%2B%2B6JdqvZubXkbVWkAAGBUhG8AUCORdUfMHrI34wzhG4BCIxQDAABlYQUAqI04eNvT9tI4n3tdAAAAAICREb4BQE1MBkGgPW4hZNkCAAAAAKSD8A0A6sLa43t96EYYhgIAAAAAjIzwDQBqwjgFe3skyxYAAAAAIC2EbwBQAweDYDa%2BaezpwU5XBAAAAABIBeEbANTALe216s0zoQAAAAAAqSB8A4AasGZiz/PeWLYAAAAAAOkhfAOAipsMgkYcqc3u%2BfES4RsAAAAApITwDQAqzwZ7f6xbbYVhSwAAAACAVBC%2BAUDFGasje34wyxYAAAAAIFWEbwBQdU5H9/5QQ8spAAAAAKSI8A0AKuxA8OyegzcvYtkCAAAAAKSK8A0AKiyybu8tp/KVb2oKAAAAAJAawjcAqDDjFOzj4a2bYUjlGwAAAACkiPANACrqYBDMxjeNvT7eyRG8AQAAAEDKCN8AoKJuaV9VbzLGvC4AAAAAQKoI3wCgoqwm9jXvTRHz3gAAAAAgbYRvAFBBk0HQkHHBft7HsekUAAAAAFJH%2BAYAlWQD7dOkRPgGAAAAACkjfAOAKrJ6Zl%2BPl1tthWFLAAAAAIBUEb4BQAUZt79lC04ieAMAAACADBC%2BAUDFTAZBEN809vEubDoFAAAAgIwQvgFA5dhA%2B9SOolAAAAAAgNQRvgFAxRiZfc57S9pOmwIAAAAApM4IAFAZk0HQMMa%2Bo31aX1nm%2BQAAAAAAMkDlGwBUig20b25VAAAAAIBMEL4BQJVY7bvlVE5XBAAAAADIBOEbAFSIcQq0T06GyjcAAAAAyAjhGwBUxMEgmI1vGtqnSBHhGwAAAABkhPANACrilvZf9ebFTwQtAQAAAAAyQfgGABVhNXFEQ5iUqHwDAAAAgIwYAQBKbzoIpq8bu6b9a66vLD8iAAAAAEAmqHwDgArYkGY1BCfXFAAAAAAgM4RvAFABRvaohmCMeV0AAAAAgMwQvgFAFRjzjIYRqSkAAAAAQGYI3wCg5CaDoCG5IdtOI5YtAAAAAECGCN8AoPRsoCGx6RQAAAAAskX4BgBlZzVcy6nUaoVhSwAAAACAzBC%2BAUDJGadAQ2HTKQAAAABkjfANAErsYBD4WW8NDcPpigAAAAAAmSJ8A4ASu6Vhq9589maY9wYAAAAAGSN8A4ASs9YOO%2B9NEZtOAQAAACBzhG8AUGZu%2BMq3%2BAmAZQsAAAAAkDHCNwAoqckgCOKbaQ1pUqLyDQAAAAAyRvgGACXlpFkNr9UKQyrfAAAAACBjhG8AUFJWE0c0JCdH1RsAAAAA5IDwDQDKyrhAQzJO7wsAAAAAkDnCNwAooe68t6E5GSrfAAAAACAHhG8AUEo20GiaAgAAAABkjvANAErIyDyjkURNAQAAAAAyR/gGAGU0wrw3b1Ki7RQAAAAAckD4BgAlM%2Bq8N68Vhi0BAAAAADJH%2BAYApWMDjcRR9QYAAAAAOSF8A4CSGXXem5OoegMAAACAnBC%2BAUDZGDerERhjXhcAAAAAIBeEbwBQIt15b9MaRaSmAAAAAAC5IHwDgBJx0khVb15bUVMAAAAAgFwQvgFAiVhNHNGI4gCvKQAAAABALgjfAKBMRpz35h0kfAMAAACA3BC%2BAUBJHAwCH7yNNu9NarXCkG2nAAAAAJATwjcAKIlbUqCRuaYAAAAAALkhfAOAkrDWPqMROYmqNwAAAADIEeEbAJSFG33TqTHmdQEAAAAAckP4BgAlMBkEjfimoRG5iMo3AAAAAMgT4RsAlIDVxMhVb16kaFUAAAAAgNwQvgFACTi5QCmwzHwDAAAAgFwRvgFAGRgz8rKFhLXvCAAAAACQGyMAQKFNB8H0dWPXlIL1lWV%2B7gMAAABAjqh8A4CC25BSmfcWawoAAAAAkCvCNwAoPBsoBU6uKQAAAABArgjfAKDgjNKZ92ac3hcAAAAAIFeEbwBQdMal03ZqTVMAAAAAgFwRvgFAgR0MAh%2B8TSsNETPfAAAAACBvhG8AUGBt2bSWLcR/VtQUAAAAACBXhG8AUGAmvU2n/gd%2BSwAAAACAXBG%2BAUCRmXSWLSSsfUcAAAAAgFwRvgFAobnUKt82lpevCAAAAACQK8I3ACioySAIlB5aTgEAAABgDAjfAKCgXIrz3uI/rSkAAAAAQO4I3wCgoKy1qc17c1S%2BAQAAAMBYEL4BQFE501BKrDNNAQAAAAByR/gGAAU0HQTTaS5biCSWLQAAAADAGBC%2BAUABbaQ6700ytJ0CAAAAwFgQvgFAAbmUw7e2oqYAAAAAALkjfAOAAkpz2ULy51H5BgAAAABjQfgGAEWU4rIFr034BgAAAABjcY8AAIXily1cT3HZgndQapK%2BAdiLySAInOzslKKlVhjyowMAAGBEhG8AUDB%2B2YJRujiBBrCbOHBrWGuPO6dT8avTfklLayU8JwAAAIyM8A0ACsalH741BQADJJW21p6Of/CcioO325zcqgAAAJAKwjcAKJhk2YJTihxVbwC2ORA8e/S6cS/HP2%2Bmt73RmR8JAAAAqWDhAgAUTcrLFhzLFgBscSBYOO2Muxi/OD34EVEoAAAApILKNwAokCyWLVhnmgKArgMLCy87pxO7PWZSWt0QAAAA0kD4BgAFksWyBWf1vgAgNjU/vxIHb8Huj3KrLGkBAABID22nAFAgftmCUuYi2k4BdCreJBPc9YFOVwQAAIDUEL4BQIFY2YbS1xSAWptaWDh7t1bTO0woAAAApIbwDQAKxTyplEWKqHwDaswvV5DTqb0%2B/hbLFgAAAFJF%2BAYARWJc6m2nlm2nQG3dGwSzzmhxH%2B/SuhmGqwIAAEBqWLgAAAVxMD5JjqRppaxN%2BAbU0mQQNIyxF/fzPk6O4A0AACBlVL4BQEE4TTSUgQlr1wSgfqw9Hf/e2M%2B7GGNeFwAAAFJF%2BAYABREp/ZZTb2N5mc2FQM1MBgsnzJ4XLNzRjpj3BgAAkDbCNwAoCGOV%2BrIF0XIK1E6n3VSnNYT4wJC2UwAAgJQRvgFAUTjTUPoI34C6GaLdtMM1N8KwKQAAAKSK8A0ACiP9tlMXn0wLQG347abDtJsmnJj3BgAAkAHCNwAoAL/pVAAwonv2ud10MxMKAAAAqSN8A4ACyGrTqXF6XwBqwS9Z0FDtph1OEfPeAAAAMkD4BgAFkNWmUyOzJgC1MOyShZ6NMAwFAEABTAfBtF8gJKAi7hEAYOySTadOqYukKwJQeQeChdNupKo3FwoAgDHygdsNa190zgXXZYL4yelMfPeigAogfAOAIkg2nWaQvgGoPF8Z4MyQSxa6jDEsWwAAjIUP3a5be/q6XxjkNO17NzqiUEBFEL4BQCG4rBYuNAWg0qzs8VGq3rx2xAkOACB/U0Hw4nVjFzuh22aT0uqGgGogfAOAMfObTiNlI1LUEoBKG7XqzbPxCY4AAMhJt8X0rHM7PYe51VYYchyLyiB8A4Axa8fHH0bZiE%2BoOWgBKmzUDacdrrkRhk0BAJADPy7hhpm46NzOnR/GGS4KoVII3wBgzJw0m1X4BqDaRt1wmnBi3hsAIBc%2BeDPGrji5xm6PixT9SECFWAEAxsrKNpQVa98RgEpKp%2BrNM6EAAMhYL3jTHp672oxDQMUQvgHA2JknBQD7lErVm3zhW8QJDgAgU37G216Dt1jrZhjy3IRKIXwDgHEzmW061cby8hUBqJzJIAiUStVb/HMiDEMBAJCh68Zc1B6ft5wcwRsqh/ANAMbIXwX0NwKA/bD2uFIQn%2BCEAgAgQweChdPx1eZgz%2B/gDPPeUDmEbwAwRhtSZlVvYtMpUEnJzBynE0qBMYZlCwCAzPj5pM5oUfsShQIqhvANAMbIaiLLqjfCN6CS7AmlpB1xggMAyEZnwcL%2B55NOsmwBFUT4BgBjFMllWfkGoILiE5lUWk49JzUFAEAWrPXBW0P74lZbYcgFZFQO4RsAjJVrKCNOrikAlZLmogWxTQ4AkBHfbjrMiATjDM9LqCTCNwAYIyP7sABgr1JatJBwjoHWAIDUDdtu6kWKeG5CJRG%2BAcAYOZNd5RuAaklz0UKHCQUAQNqGajftaDPvDRVF%2BAYAY2TSax/bxjrTFIAKsYFS5BRxggMASNWIF4oYh4DKInwDgDE5GAQsWwCwZ0YmvZZTsU0OAJA%2Bo4mXNSQnx/MSKovwDQDGpC1NK0PO6n0BqARfSSDjAqWGbXIAgHT5JQujPFcZY14XUFGEbwAwJk7KtPLNReLEGqgMe0IpYpscACBtwy5Z6GlHUSigou4RAGAsjGymlW/YzlcPOdmjRtHqRhiGAkoiPqFJteWUbXIAgDQlVW8jzjI%2BIIU3BFQT4RsAjImxetKXv2X254vKN286CKZvWPuic74NwgTxB%2BbMxjLBG8rDz4eMUl7OwjY5AECaRq16YxwCqo7wDQDGJTLTMtmlb67G4ZsP3NZlT1jjjlz3gVvyYTZyLjq5sRIuCSiRKOWWU7FNDgCQojSq3uJjtSsCKozwDQDGxBnXMEKaJoMgMMac9oFbZ6jp7Y9wKw7ejtFqilIyOqIUsU0OAJCm0avekj8lFFBhhG8AMCYm5TayrSJFtah8uzcIZu%2B19ohzOqXBG2Rbt1w0T6UPyiiLltM4%2BWfeGwAgFalUvclfGIo4TkOlEb4BwBj4wf/KmK142%2BmBIDjqjHnRz3FzO3bvuqZzzgdvTQEllEHLqf9TQwEAkAIjc1wpDDGmOwFVR/gGAOPREPbtzvIEnXKDq9z6dIK3DYI3lJkxzyjlzSyT0uqGAAAYjR/3IeMXWo3GyYUCKo7wDQDGwGpi2mW56rRikoM7a49fdzoaf9im7/4eBG8ov06FrJtVqtgmBwBISXxslsbhrDHmdQEVR/gGAGPQVrthZYXd9RYo6PbG0r0geEM1xF/yR9NeymKcYaYOAGBk/gKRcTqhFLQjxiGg%2BgjfAGAM4uCtoaxZ%2B45KalPoti8Eb6gOq4kjabecRopYtgAASEF6M0njy9FcGELlEb4BwDhYPUzX6XbDh24ewRuqw883vJ7CHJ2t2pzgAABSYIyOKxWuybEb6oDwDQDGITLTMqRvPaOFbn7Tllu9Lw7emGWFqtiQTb3lNNa6GYaEbwCAkRwInj3q5BpKgxPz3lALhG8AMAbOuEYGJ9alM2ro5hG8oZKsnkm7OjY%2BUSJ4AwCMzFl3PL3nKBMKqAHCNwAYgzh428PGztFMRtH7GyqmZIujtadHHdRL8Iaqir83AqXNGea9AQBGkhzD%2Be3zKXGKuDCEWiB8A4CcJbOccgjfihhI%2Bf/7DWtfdE6n4qOtET8Grhk5d4zgDVXjK0Ljm4ZSxzY5AMCobKAUbYRhKKAGCN8AIGcbcQZVx5ZTHyhcN/blOHRraGQsV0CV2UAZmJRWi1oNCwAoB2N0WilxcqGAmiB8A4D8NVQjvj3BGPPyKHPdNiN4Q7UZmWeU%2Bjpkt0qVKABgFGlXZsfHhyxbQG1YAQByZTWRectpUUwFwYvG2MsEb8De%2BNZsGRcobU5XBADAKKw9rhS1I8YhoD6ofAOAnEVylW87Tb/azSN4Q/Xd0ESQftWbxzY5AMBo0l4GZCWWLaA2qHwDgPw1lL2xtZelX%2B3mEbyhHiLrjigDt1i2AAAYQfrLgFyT4zrUCZVvAJAzk8OmU40hfMum2i3RInhDXaRdVdDVuhmGVBcAAIbnW07TLMx2Yt4baoXwDQBy5pK202o1nvqrocbYi0o/WGzdctH8TYI31IAPsJVBZWz8M4fgDQAwkvji0FGlinEIqBfaTgEgZ0b2YVXI1MLC2Th4W1EGFX3GmZNU7KA%2BbKAMsE0OADCKA8GzPnhL9TjPKeL4DrVC5RsAYCi320yzaZPzR2UvXQt/eElAXVg9k8WuBbbJAQBG4eeRmpSfnyal1Q0B9UHlGwDkzBnXUMl120xXMpjvlnBGZ9bD5XMCaiSjeW9skwMAjCT9llO32grDsS0HA8aB8A0AsC/dbaa%2BzbShDPjgbWN5eVFAjWQ1741tcgCAUXS3nKY7WsSYHwmoGdpOASBnJqPQKg9%2BvpucTikrRucJ3lBPNlAW2CYHABhF2ltOxTgE1BPhGwDgrqaDYPq6tX6%2BW8ptB3cYudVryyvZBXtAkWU0741tcgCAUWQxEiF%2BumsKqBnCNwDIUbe1rFT8v/mGmbgo52aVGde8z7n5awLqKat5b2yTAwAM62AQzEbpd2y02GSPOiJ8AwDsqLPR1K44ZbkkwjVdHLwxeBd1ld28N2kjDEMBADCEtuxRo3TFx5QEb6glFi4AQL4aKole8KZs/80tH7wxEB51ZjWRSVVpfIITCgCAIRljjihtjmULqCfCNwDANjkFbzLOnCR4Q93FIVmgDMQnTSxbAAAMpVOVncXIEZYtoJ4I3wAAm%2BQVvDmjM9fCH14SUHfGPKMMsE0OADA8GygDkxJtp6glwjcAyJVtqMDyCt5kdH5jeXlRQMb8pl4VWOffl80yE8sJDgBgSMYq/ZZTuVVm/KKuCN8AAIncWk3jA6/15eVTAnKwIXuqyFuGN6SMtgi7Ji3dAIChZbCF2zjDRSHUFuEbAOTIKSpkFU5uFW9xIBA5d0xAbqLQf20XN4CzgbLgxLw3AMBQ4ufMIL5J/Zg1UsSyBdQW4RsA5MjIFi58821v%2BQRvbDZF/uKvt1DONIsawBllM%2B8t/pNDAQAwhPh49agy0GYcAmqM8A0Aau66tS8r%2B%2BCNzaYYG6f2mfimUcgAzmQz780p4gQHADAk86TS17oZhjw3obYI3wCgxg4EC6fjs/RMrm72Y7MpximpfosP%2BlWwAO5gEPjgLZNq2O7/GQCAfUkWARkXKGVOjuANtUb4BgA15YO3OBRbVNacLrHZFOPmnM53XyxMAOc00VAG4hOcUAAADOGGJgJlwRnmvaHWCN8AIFeuoQK4Nwhmcwne5Jr3KzopYMwmFZ1Tp/rNK0QAF4dkgTJgjGHZAgBgKJF1R5SJKBRQY4RvAFAzPnC4x9iLyl6yYKEVhi0BY5Z8HTpd6LurAAFcJjN11I44wQEADMc4k8ks0kmWLaDmCN8AoGasmfDBW0NZczrDggUUiVW0tOWu8QZwJpvKNyc1BQDAPnWeD7NYBORWuRiLuiN8A4AaSea8KZvtipsYnV8Pl88JKJAP/ZY1Z8Itd48lgOsuW8hCLtvk/MdrMlg44X8lw7kBAKVnNZHJc5Nxhqo31N49AgDUQnyyHOQ15219eeWUgAJyap8xssGWu3sB3Hxe1Zpt2VmjDDiX2UBrH7LdsPZF53RCt6tnXbO1Ei4JAFB6ft6bcUpdpIhlC6g9Kt8AoAZ8lUocLryszLmmn/MmoKDicC307S8D3pRrBVwcvGVU%2Bbatsm9kPrifmp9fuW7sWhy8LaqvbT3%2Bfj8jAEAlZDXvrc28N4DwDQBqwdrTymHOmz8RZ84bii5y7sIOb8oxgMtm2YJTlNoJjt%2BK7EM3/zGJ/73BgL%2BtGX%2B/LwkAUHrZzXvLZxwCUHSEbwBQTY3eC34mk%2Bm0iWXL6Dwn4iiDKWkpvtlp8HM%2BAVxGyxbS2Cbn20unFhbO3mPs5cGhWwdVbwBQHVnNe3ODq82B2iF8A4AK8yfRxui0MufnvC0z5w2l4DeuOafzuzwk0wAuu2ULo2%2BTO7CwcPq6se/EZ0t3%2BX6m6g0AqiQOyQJlwBjzugAQvgFAld2QfVH5tJsy5w2lMqnobtt4MwvgnCYaysAo2%2BQ6c90W3unOdLvr9lKq3gCgYox5RhloR1EoAIRvAFBVPjTIY7tp/Hcw5w2lk1SIubsuJ8gkgMuqumCYbXK9FtPOXLe9BvVUvQFAlfjngozmvemAFAoA4RsAVJWRPausOV3aWF5eFFBCTu29VG9lEMBls2xhv9vkDgTPHt1bi%2BlmVL0BQLVsZLaBe/RxCEBVEL4BQFUZHVWmXNMpeklASW2EYbiH6jcv3QDOjHebnP9/%2BC2mzriL2kOL6WZUvQFA9dhAWXC6IgAJwjcAwFB89Qvtpig7J3dhjw9NJYDrtPbsN/C6u71uk5sKghfNXbaY7vr3UPUGAPvinzcy36A9IqNs5r3Ff3IoAAnCNwDAvhmnJapfUAWTii7FN3ttiRk5gMustceZXee9dWe7XZSxftHEkOEfVW8AsF/%2BQqUx5uVCB3DZVGTHF4aioRcBAVVD%2BAYA2CfXjBRR/YJK8LNonNP5fbzLSAGcy2yuzs7b5Pwm0%2B5st5Fa0al6A4DhRM69ktUG7VEdDAL/vJR6RbaXjHcAkCB8A4BcmaZKjnZTVM2kIl8Ntp%2BB0EMHcNbaTFp7JgcsW9iyyXTEEyuq3gBgWFPSUnwzXcQAri2bUdWbCwXgNsI3AMCe0W6KKupUv7lXtD/DBXDONJS67dvk7g2C2et%2Btts%2BN5nu%2BDdQ9QYAQ%2Bursm4ULoCzyuSikDHmdQG4jfANALBHtJuiytyS9m%2BIk6j05%2BoYZzZVvfmlCvckSxXUUCqoegOAUXWrrL1CBXDxc0gmlW/taOdxCEAdEb4BQI6cov20thUK7aaosmQujRtqK9ueT6K6c3VSF4fiybIF/2%2BYmp9f6S5VSA1VbwAwuqRC%2Bc7zTCECuM4G7myWLdgB4xCAOiN8A4AcGdlShm9%2BbgeVL6g6p/awIdOeTqKcJnZ9%2B7Da8QmOX6rQme1mAqWKqjcASMuW55mxB3CZbeDuPHc0BeA2wjcAwN05d1JAxXW3sg0bkN/1JCrKprqgda/ske5ShYZSRtUbAKRnQJX1WAO4zDZwOzHvDdiC8A0AcmRlSlf55oxoN0VtdAdiD2vXkyhj9aTSNx1/jy4qE1S9AUDaIrW3LvgZWwCX1Qbu%2BBkvVE78x63TPgsUG%2BEbAOQoPuAqWfgWn3wvLy8KqInuQOxRvk93PonKZNNpdqh6A4D0TUlL2v48M54ALqPnJacos3lvPmi7P1g45WecTs0vrMUft3duyJ4VUHCEbwCQo4nRTupzx8k36qYzEFsXNJodTqJcQ6VB1RsAZME/z%2BxQZZ1rAJflsoXuGIdUJUuFFhbOXo/DNmt0tjvjNKl4ixRxvIrCI3wDgBy1SxS%2BGaclTr5RR1bRkka36SSqe1uathiCdwDITrfKepDcArisli34JV1KUW%2BTt69wi//wU9ryXNo9Xm0KKDjCNwDI0WSJwjeuIqKuPgzD1S0DsYfVfxLVUGlQ9QYAWepUv7mdqqxzCeCyWrZgjEll2YKvzPOVbknotssmb45XURaEbwCQo6SlrQS4ioi6c2qndTCfnEQZa4%2BoJKh6A4A8uKVd3ph5AJfVsoV2FIUagQ/dDiwsnL5%2Bp9JtRxyvokwI3wAgZ/GVxqYKzTW5ioi668yrcWkNjG7c7QSiOKh6A4A8JM8zu1dZZxvAZbRsIQ4Yhn7ujP%2BvQRy6XXYu2eJ911ENHK%2BiTAjfAACbOXOeq4hAfFC/c0tQZVH1BgD52UOVdSYBXHbLFpILOE3tU3eZwkX/f9UexzRQ9YayIXwDgJwZZ5oqLNdcD5fPCYCmpCWVbEPxaKh6A4A8dbeC3u15JvUALqtlC3GauO95b1NB8GL8/7scv%2B/R/bwfVW8oG8I3AMiZU3RFBUXVC3BHZyC2zqsm%2BP4HgPzt8Xkm1QAuq2UL8SXmcK%2BP7G0xlbH%2Bou%2B%2BtoFT9YYyInwDAHRR9QJsNamoJpWgfP8DwDh0n2f2UmWdWgBnZRvKQHyBeU/z3m5Xu%2B2yxXQ3VL2hjO4RACBnxWw7peoF2M5Xv00Fz4bxZfZAVWbMJT/o%2Bm4Ps5qYjuT2VaGQraip4TTv9oDJ%2BNNflg3VAMqr8zyzcEFGL%2B7h4b0Abn60yi/zZFL/lrL45%2Bbqxm5vj4NDY8zLw4Zunq96W6fqDSVE%2BAYA%2BWuqcKh6AXbiB2Ib2UBV5nQqPqE7dfeHufj8sEiya%2BK4Hv%2Baml/Y7SHNQXcamZZTNDC0GzTz01m1XKT3N90Xn4%2BbbZUwA4PGTffRhgWUU/wz41L8PLOX8M0bPYAzmSxbWN3tgoWvdpOxi9pni%2BlWVL2hrAjfAABUvaGUtrTe9L18p50mDjGmTfdA31h9xER3Dvrj0GM6/uLvOwkwjS1/xdbXgX6NQXe6pJpkcETpzMB3kNly/%2BD3vnvQOCAsbN75M7eHgv1hYCRd2el9%2B4O/dhwKTnSDQaoDgXT4xQv7rLIeOoA7GASz0YgB2EDG/GjQ3X6z6nVrX97vQoWBfwVVbygxwjcAyJ0/iSnSyE2q3pC9XlAWn7hPxyfu0/3ti/0BWfyd8XBy36ZgzDT6/qiG9mFTiOG2hB9u2yOAqmn0XhgUCvZ/P%2Bz%2BnXDnOav/5GFAdWCz82dtDvp6IV9/ld/m6r5NVX3JywR7qJshqqyHCuCcJhpZtJy2oyjcep8fZ3DdJMFbQymg6g1lRvgGADnzFQORioOqN%2BzGX7HeiG8GhWbqntjfDsyMa3TuNo3eu2vL1fXegUd/%2B%2BK2POz2CwRjQMk0/G9bg77bIV9fld/m7%2B7tF6S2BHs%2BhGttCvWMaZmoE971qvZ6gZ6NHxepnbytV6lHmIeiS6rf5uebA6qwd7PvAC5%2BDp/N4tnVbWmDn1pYOOtHGiglVL2h7AjfACBn7c7JQUFQ9VYHfe2ZjV541qs267Vi9irN4qvu8dtcLzSb9ifA/ut1UGim2/f1EJYByETy82hTqNdXybo1yO/8nOoEer2fXVvCvGb3kZ3bbpC3Zf5e9zGdqjxCPOQhcu68Neas9mdfAVz8vP9kBoVvrZthmGw69ccc1kxcjC/upjpXjqo3lB3hGwDkzB%2B4X1cxUPVWLr0qNA0I0fqrz7YGaP1/Ri88M3fu6JzAdivNXAZH5ABQMI3Ojenc9v0cNNuuIewY4m2rxvPttVsDvP4qPP864R12MyUtxV9jp7X/mWx7D%2BCcaaTddhofOyTB28EgOB4Ze86lvBWbqjdUAZeoAWAM4gP3AiQcrhmHb/NsxxuP/nbOezXR2Bqk3Zl5Zhrdd2kIAFAlzdvh3Zbquzsz8W7Pw0tuec6uvslgYTEOgU9rOPGxXbTrsV0mx6BG55LbFNtM%2B8X/p0f42kfZEb4BwBhMzi%2B8Y8YcpviriNfC5ZNCanyrxdYwzVo93GvrNPHV5u7V4IYAABjO5qq7bnDXt7H2dsVdr12W4KI8ku2gxq5peDsGcMmmU2MvK33%2BazL9DarieBXVQdspANQUszP2ZmugJt/a0ZuTliwYMPGvO%2B2d/ol1U2tnXzsTLZ0AgBRsnoHXfZ7ZvLymM/eud7K3ed7dnVl3/vWdKu1okR0P/zGfCp4N49Qp0HB2bEFtdyrss5BJ8OZxvIqqIHwDgDHwc2F0ezNk/uKD8rDOV8H7Z6dJtrGpQu0ugVri9qBvCsgBAKXS6J9155lNwd2dzbN98%2B2ag6rs%2BgM7KuzS5dQ%2BE4engYY3MICLP2ezZTpyYdYbqoTwDQDGwbrWWIugnLugCtprqHZ9y5XfTRVqBGoAAPRrDKqy6w/stlTYtTq/OhV2/oJjf0tsf3UdYd1g8cclHLH6zdsWwMUhaqobSLNG1RuqhPANAMbARe59Y8YV8jh/sLukkhnU/nlnMYH8wSShGgAA49etHDcN/8rWltj%2B6rpB7bC9sK7ulXWR2q9Y2UCj2RTAGdmHNdarv3tH1RuqhvANAMbAt29oTOKD2lAF0x%2BsteUaA6rV/K9t7Z/u9m8AAKDEGlvDut0q6%2BLjqGavDVbduXWqWFXdlLQUX1T0W09Hnad2O4CLDwJLU/lG1RuqhvANAMagezV3LPI%2BmOm1glpNzG6qWNshWEuuh1OtBgAABvPLJmZ7bbDenWaCbVV1pQ3q/OKFyWDhfPx/O63RJQGcMlyMkCaq3lBFhG8AMB5NjYVbTfsAs1e1NiE725uxJh%2BobWkF3VaxRrAGAACyNVRQ19/6OiH/crvlW18PxsdveW6AnVR07rpsGuGb11BJUPWGKiJ8A4Aacc6d1z71h2vaPmet4R/TezLpzVgDAAAomdtBXX/ra%2BfiYaf1tX8DbDKjbkA1XZohXaf6bf6CMea4aoKqN1QV4RsAjIVvdbAag3DrHfsJ1zzmrAEAgJprJKMzBlTTpR/SuaX4b6hN%2BEbVG6qKnh8AGIODQTAbGXtZuXLNyJnzW9tCVZL5HwAAABXV7A/pokhXeu2u/nWjiZdlXKCK81Vv18LlkwIqiMo3ABiD9lgWLpiGNTpL1RoAAEChNPor6ay50%2B7aUY%2BDN6reUGVj6XkCgLqbjMM3AQAAAEiq3oq4dRZIC%2BEbAIxBnpuyAAAAgCKj6g1VR/gGAGMwHQTTLpnvAQAAANQXVW%2BoA2a%2BAUCG/CZRq4nZtlwjWXTgkhX2jetSg403AAAAqDuq3lAHhG8AkIL%2BkG1CelLGzLr45fhN035gblJmnMzKJXIDAAAAPF/1tk7VG2qAs0AA2IfdQjYBAAAA2I9mfIW6aZxpRtIVK7Maqe1nIzdpRUWVEL4BwAB%2BJtuGFAdrdpaQDQAAABiLpg/n4mPxlov0euf1qNmWWjfDcFVASRC%2BAag1H7J9KDUm4pDN2Dhk68xkmxUhGwAAAFB0zf5wzsWhnFG0SjiHoiF8A1AbW1tGnVEQ390QAAAAgCpqxeHcKpVzGDfCNwCVdG8QzFLNBgAAAGAXTWbOIQ%2BEbwBKrdc2amUDZrMBAAAASIuJwzinqBWfY6xGka5MyDRvqt08GIdzrTBsCdgjwjcApbF1CQJtowAAAADGZGBLq6iawwCEbwAKiaANAAAAQFlRNYd%2BhG8ACsHPaNvSOjorAAAAAKieTVVzvVlzk9IqwVw1Eb4ByJ3fOirZgGUIAAAAALBJy8g0nXFN2lmrg/ANQKb620et1TNySfsoQRsAAAAA7FPSzhoHc/GLTd/OahSttuPA7mYYrgqFRfgGIFX9VW3GmYD2UQAAAADI3tY5cwRzxUH4BmBoVLUBAAAAQPENCuZEK2tuCN8A7JkP225oInDWPcOsNgAAAAAov14ra/%2BMOZY/pIvwDcCOOpVt9igtpAAAAABQO2xlTQnhG4Db%2BsM2OR2N72oIAAAAAIDNkmDOONNsS69PyDRvqt1kvtxghG9AjW1uIyVsAwAAAACMZtB8ubpXyxG%2BATXSW5BgrD3SndkWCAAAAACA7G1rY/XVcgelZtWDOcI3oOImg6DhZI9a446wIAEAAAAAUEDNOJhrVrVajvANqKBO4KajVhNHnHENAQAAAABQMsa5943MZWf1vou02jbu8kHnrpQtlPufHHCfe12Z%2BvEAAAAASUVORK5CYII%3D")

    def test_get_exploration_components_from_dir(self) -> None:
        data_path = os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR, feconf.DEMO_EXPLORATIONS['6'])
        print("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        print(utils.get_exploration_components_from_dir(data_path))
                
            