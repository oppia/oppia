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
from core import python_utils
from core import utils
from core.constants import constants
from core.tests import test_utils

from typing import Any, Dict, List


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
        test_dicts = [{}, {'a': 'b'}, {'a': 2}, {'a': ['b', 2, {'c': 3.5}]}]

        for adict in test_dicts:
            yaml_str = python_utils.yaml_from_dict(adict) # type: ignore[no-untyped-call]

            yaml_dict = utils.dict_from_yaml(yaml_str)
            self.assertEqual(adict, yaml_dict)

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.InvalidInputException,
            'while parsing a flow node\n'
            'expected the node content, but found \'<stream end>\'\n'):
            yaml_str = utils.dict_from_yaml('{')

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

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp(  # type: ignore[no-untyped-call]
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

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Expected a positive timedelta, received: %s.' % (
                timedelta_object.total_seconds())):
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)

    def test_create_string_from_largest_unit_in_timedelta_raises_for_neg_diff(
            self
    ) -> None:
        timedelta_object = datetime.timedelta(days=-40)

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp(Exception, '0 must be a string.'): # type: ignore[no-untyped-call]
            # Type ignore is used below because we are providing integer
            # argument instead of string for invalid_name for testing purposes.
            utils.require_valid_name(invalid_name, 'name_type') # type: ignore[arg-type]

    def test_require_valid_meta_tag_content(self) -> None:
        meta_tag_content = 'name'
        utils.require_valid_meta_tag_content(meta_tag_content)

        non_string_meta_tag_content = 0
        invalid_type_error = (
            'Expected meta tag content to be a string, received 0')
        with self.assertRaisesRegexp(Exception, invalid_type_error): # type: ignore[no-untyped-call]
            utils.require_valid_meta_tag_content(non_string_meta_tag_content) # type: ignore[arg-type]
        lengthy_meta_tag_content = 'a' * 200
        max_length_error = (
            'Meta tag content should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_META_TAG_CONTENT)

        with self.assertRaisesRegexp(Exception, max_length_error): # type: ignore[no-untyped-call]
            utils.require_valid_meta_tag_content(lengthy_meta_tag_content)

    def test_require_valid_page_title_fragment_for_web(self) -> None:
        page_title_fragment_for_web = 'name'
        utils.require_valid_page_title_fragment_for_web(
            page_title_fragment_for_web)

        non_string_page_title_fragment_for_web = 0
        invalid_type_error = (
            'Expected page title fragment to be a string, received 0')
        with self.assertRaisesRegexp(Exception, invalid_type_error): # type: ignore[no-untyped-call]
            utils.require_valid_page_title_fragment_for_web(
                non_string_page_title_fragment_for_web) # type: ignore[arg-type]
        lengthy_page_title_fragment_for_web = 'a' * 60
        max_length_error = (
            'Page title fragment should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)

        with self.assertRaisesRegexp(Exception, max_length_error): # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, name_with_spaces_expected_error):
            utils.require_valid_url_fragment(
                name_with_spaces, 'name-type', 20)

        name_in_caps = 'NAME'
        name_in_caps_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. Received NAME.')
        with self.assertRaisesRegexp(Exception, name_in_caps_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(
                name_in_caps, 'name-type', 20)

        name_with_numbers = 'nam3'
        name_with_numbers_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. Received nam3.')
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, name_with_numbers_expected_error):
            utils.require_valid_url_fragment(
                name_with_numbers, 'name-type', 20)

        long_name = 'a-really-really-really-lengthy-name'
        long_name_expected_error = (
            'name-type field should not exceed 10 characters, '
            'received %s' % long_name)
        with self.assertRaisesRegexp(Exception, long_name_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(
                long_name, 'name-type', 10)

        empty_name = ''
        empty_name_expected_error = 'name-type field should not be empty.'
        with self.assertRaisesRegexp(Exception, empty_name_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(empty_name, 'name-type', 20)

        non_string_name = 0
        non_string_name_expected_error = (
            'name-type field must be a string. Received 0.')
        with self.assertRaisesRegexp(Exception, non_string_name_expected_error): # type: ignore[no-untyped-call]
            utils.require_valid_url_fragment(non_string_name, 'name-type', 20) # type: ignore[arg-type]

    def test_validate_convert_to_hash(self) -> None:
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Expected string, received 1 of type %s' % type(1)):
            utils.convert_to_hash(1, 10) # type: ignore[arg-type]

    def test_convert_png_to_data_url_with_non_png_image_raises_error(
            self
    ) -> None:
        favicon_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'favicon.ico') # type: ignore[no-untyped-call]

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'The given string does not represent a PNG image.'):
            utils.convert_png_to_data_url(favicon_filepath)

    def test_get_exploration_components_from_dir_with_invalid_path_raises_error(
            self
    ) -> None:
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception,
            'Found invalid non-asset file .+'
            'There should only be a single non-asset file, and it should have '
            'a .yaml suffix.'
        ):
            utils.get_exploration_components_from_dir('core/tests/load_tests')

        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'The only directory in . should be assets/'):
            utils.get_exploration_components_from_dir('.')

    def test_get_exploration_components_from_dir_with_multiple_yaml_files(
            self
    ) -> None:
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception,
            'More than one non-asset file specified for '
            'core/tests/data/dummy_assets/assets'):
            utils.get_exploration_components_from_dir(
                'core/tests/data/dummy_assets/assets/')

    def test_get_exploration_components_from_dir_with_no_yaml_file(
            self
    ) -> None:
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_substring):
            utils.require_valid_image_filename(
                image_filename)

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
            dt,
            datetime.datetime.fromtimestamp(
                python_utils.divide(msecs, 1000.0))) # type: ignore[no-untyped-call]

    def test_get_time_in_millisecs_with_complicated_time(self) -> None:
        dt = datetime.datetime(2020, 6, 15, 5, 18, 23, microsecond=123456)
        msecs = utils.get_time_in_millisecs(dt)
        self.assertEqual(
            dt,
            datetime.datetime.fromtimestamp(
                python_utils.divide(msecs, 1000.0))) # type: ignore[no-untyped-call]

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

        self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
