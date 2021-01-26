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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import base64
import copy
import datetime
import os

from constants import constants
from core.tests import test_utils
import feconf
import python_utils
import utils


class UtilsTests(test_utils.GenericTestBase):
    """Test the core utility methods."""

    def test_create_enum_method(self):
        """Test create_enum method."""
        enum = utils.create_enum('first', 'second', 'third')
        self.assertEqual(enum.first, 'first')
        self.assertEqual(enum.second, 'second')
        self.assertEqual(enum.third, 'third')
        with self.assertRaisesRegexp(
            AttributeError,
            'type object \'Enum\' has no attribute \'fourth\''):
            enum.fourth  # pylint: disable=pointless-statement

    def test_get_comma_sep_string_from_list(self):
        """Test get_comma_sep_string_from_list method."""
        alist = ['a', 'b', 'c', 'd']
        results = ['', 'a', 'a and b', 'a, b and c', 'a, b, c and d']

        for i in python_utils.RANGE(len(alist) + 1):
            comma_sep_string = utils.get_comma_sep_string_from_list(alist[:i])
            self.assertEqual(comma_sep_string, results[i])

    def test_to_ascii(self):
        """Test to_ascii method."""
        parsed_str = utils.to_ascii('abc')
        self.assertEqual(parsed_str, b'abc')

        parsed_str = utils.to_ascii(u'¡Hola!')
        self.assertEqual(parsed_str, b'Hola!')

        parsed_str = utils.to_ascii(
            u'Klüft skräms inför på fédéral électoral große')
        self.assertEqual(
            parsed_str, b'Kluft skrams infor pa federal electoral groe')

        parsed_str = utils.to_ascii('')
        self.assertEqual(parsed_str, b'')

    def test_yaml_dict_conversion(self):
        """Test yaml_from_dict and dict_from_yaml methods."""
        test_dicts = [{}, {'a': 'b'}, {'a': 2}, {'a': ['b', 2, {'c': 3.5}]}]

        for adict in test_dicts:
            yaml_str = python_utils.yaml_from_dict(adict)
            yaml_dict = utils.dict_from_yaml(yaml_str)
            self.assertEqual(adict, yaml_dict)

        with self.assertRaisesRegexp(
            utils.InvalidInputException,
            'while parsing a flow node\n'
            'expected the node content, but found \'<stream end>\'\n'):
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
        self.assertTrue(full_hash.isalnum())

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
        p = utils.vfs_normpath('')
        self.assertEqual(p, '.')
        p = utils.vfs_normpath('//foo//bar//baz//')
        self.assertEqual(p, '//foo/bar/baz')

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

    def test_generate_random_string(self):
        # Generate a random string of length 12.
        random_string = utils.generate_random_string(12)
        self.assertTrue(isinstance(random_string, python_utils.BASESTRING))
        self.assertEqual(len(random_string), 12)

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

    def test_are_datetimes_close(self):
        initial_time = datetime.datetime(2016, 12, 1, 0, 0, 0)
        with self.swap(feconf, 'PROXIMAL_TIMEDELTA_SECS', 2):
            self.assertTrue(utils.are_datetimes_close(
                datetime.datetime(2016, 12, 1, 0, 0, 1),
                initial_time))
            self.assertFalse(utils.are_datetimes_close(
                datetime.datetime(2016, 12, 1, 0, 0, 3),
                initial_time))

    def test_conversion_between_string_and_naive_datetime_object(self):
        """Tests to make sure converting a naive datetime object to a string and
        back doesn't alter the naive datetime object data.
        """
        now = datetime.datetime.utcnow()
        self.assertEqual(
            utils.convert_string_to_naive_datetime_object(
                utils.convert_naive_datetime_to_string(now)),
            now)

    def test_datetime_conversion_to_string_returns_correct_format(self):
        initial_time = datetime.datetime(2016, 12, 1, 1, 2, 3)
        self.assertEqual(
            utils.convert_naive_datetime_to_string(initial_time),
            '12/01/2016, 01:02:03:000000')

    def test_string_to_datetime_conversion_returns_correct_datetime(self):
        time_string = '12/01/2016, 01:02:03:000000'
        initial_time = datetime.datetime(2016, 12, 1, 1, 2, 3)
        self.assertEqual(
            utils.convert_string_to_naive_datetime_object(time_string),
            initial_time)

    def test_create_string_from_largest_unit_in_timedelta_raises_for_zero_diff(
            self):
        timedelta_object = datetime.timedelta(days=0)

        with self.assertRaisesRegexp(
            Exception, 'Expected a positive timedelta, received: %s.' % (
                timedelta_object.total_seconds())):
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)

    def test_create_string_from_largest_unit_in_timedelta_raises_for_neg_diff(
            self):
        timedelta_object = datetime.timedelta(days=-40)

        with self.assertRaisesRegexp(
            Exception, 'Expected a positive timedelta, received: %s.' % (
                timedelta_object.total_seconds())):
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)

    def test_create_string_from_largest_unit_in_timedelta_returns_days(self):
        timedelta_object = datetime.timedelta(
            days=4, hours=1, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '4 days')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_day(self):
        timedelta_object = datetime.timedelta(
            days=1, hours=1, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 day')

    def test_create_string_from_largest_unit_in_timedelta_returns_hours(self):
        timedelta_object = datetime.timedelta(
            days=0, hours=2, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '2 hours')

    def test_create_string_from_largest_unit_in_timedelta_returns_an_hour(self):
        timedelta_object = datetime.timedelta(
            days=0, hours=1, minutes=1, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 hour')

    def test_create_string_from_largest_unit_in_timedelta_returns_minutes(self):
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=4, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '4 minutes')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_minute(
            self):
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=1, seconds=12)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_min_for_min(
            self):
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=1, seconds=0)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_create_string_from_largest_unit_in_timedelta_returns_minute_if_sec(
            self):
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=0, seconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

    def test_create_string_from_largest_unit_in_timedelta_returns_a_min_if_msec(
            self):
        timedelta_object = datetime.timedelta(
            days=0, hours=0, minutes=0, seconds=0, milliseconds=1)

        time_string = (
            utils.create_string_from_largest_unit_in_timedelta(timedelta_object)
        )

        self.assertEqual(time_string, '1 minute')

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

    def test_is_supported_audio_language_code(self):
        self.assertTrue(utils.is_supported_audio_language_code('hi-en'))
        self.assertFalse(utils.is_supported_audio_language_code('unknown'))

    def test_is_valid_language_code(self):
        self.assertTrue(utils.is_valid_language_code('en'))
        self.assertFalse(utils.is_valid_language_code('unknown'))

    def test_require_valid_name(self):
        name = 'name'
        utils.require_valid_name(name, 'name_type')

        name = 0
        with self.assertRaisesRegexp(Exception, '0 must be a string.'):
            utils.require_valid_name(name, 'name_type')

    def test_require_valid_meta_tag_content(self):
        meta_tag_content = 'name'
        utils.require_valid_meta_tag_content(meta_tag_content)

        non_string_meta_tag_content = 0
        invalid_type_error = (
            'Expected meta tag content to be a string, received 0')
        with self.assertRaisesRegexp(Exception, invalid_type_error):
            utils.require_valid_meta_tag_content(non_string_meta_tag_content)
        lengthy_meta_tag_content = 'a' * 200
        max_length_error = (
            'Meta tag content should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_META_TAG_CONTENT)
        with self.assertRaisesRegexp(Exception, max_length_error):
            utils.require_valid_meta_tag_content(lengthy_meta_tag_content)

    def test_require_valid_page_title_fragment_for_web(self):
        page_title_fragment_for_web = 'name'
        utils.require_valid_page_title_fragment_for_web(
            page_title_fragment_for_web)

        non_string_page_title_fragment_for_web = 0
        invalid_type_error = (
            'Expected page title fragment to be a string, received 0')
        with self.assertRaisesRegexp(Exception, invalid_type_error):
            utils.require_valid_page_title_fragment_for_web(
                non_string_page_title_fragment_for_web)
        lengthy_page_title_fragment_for_web = 'a' * 60
        max_length_error = (
            'Page title fragment should not be longer than %s characters.'
            % constants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB)
        with self.assertRaisesRegexp(Exception, max_length_error):
            utils.require_valid_page_title_fragment_for_web(
                lengthy_page_title_fragment_for_web)

    def test_require_valid_url_fragment(self):
        name = 'name'
        utils.require_valid_url_fragment(name, 'name-type', 20)

        name_with_spaces = 'name with spaces'
        name_with_spaces_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. '
            'Received name with spaces.')
        with self.assertRaisesRegexp(
            Exception, name_with_spaces_expected_error):
            utils.require_valid_url_fragment(
                name_with_spaces, 'name-type', 20)

        name_in_caps = 'NAME'
        name_in_caps_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. Received NAME.')
        with self.assertRaisesRegexp(Exception, name_in_caps_expected_error):
            utils.require_valid_url_fragment(
                name_in_caps, 'name-type', 20)

        name_with_numbers = 'nam3'
        name_with_numbers_expected_error = (
            'name-type field contains invalid characters. Only '
            'lowercase words separated by hyphens are allowed. Received nam3.')
        with self.assertRaisesRegexp(
            Exception, name_with_numbers_expected_error):
            utils.require_valid_url_fragment(
                name_with_numbers, 'name-type', 20)

        long_name = 'a-really-really-really-lengthy-name'
        long_name_expected_error = (
            'name-type field should not exceed 10 characters, '
            'received %s' % long_name)
        with self.assertRaisesRegexp(Exception, long_name_expected_error):
            utils.require_valid_url_fragment(
                long_name, 'name-type', 10)

        empty_name = ''
        empty_name_expected_error = 'name-type field should not be empty.'
        with self.assertRaisesRegexp(Exception, empty_name_expected_error):
            utils.require_valid_url_fragment(empty_name, 'name-type', 20)

        non_string_name = 0
        non_string_name_expected_error = (
            'name-type field must be a string. Received 0.')
        with self.assertRaisesRegexp(
            Exception, non_string_name_expected_error):
            utils.require_valid_url_fragment(non_string_name, 'name-type', 20)

    def test_validate_convert_to_hash(self):
        with self.assertRaisesRegexp(
            Exception, 'Expected string, received 1 of type %s' % type(1)):
            utils.convert_to_hash(1, 10)

    def test_convert_png_to_data_url_with_non_png_image_raises_error(self):
        favicon_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'favicon.ico')

        with self.assertRaisesRegexp(
            Exception, 'The given string does not represent a PNG image.'):
            utils.convert_png_to_data_url(favicon_filepath)

    def test_get_exploration_components_from_dir_with_invalid_path_raises_error(
            self):
        with self.assertRaisesRegexp(
            Exception,
            'Found invalid non-asset file .+'
            'There should only be a single non-asset file, and it should have '
            'a .yaml suffix.'):
            utils.get_exploration_components_from_dir('core/tests/load_tests')

        with self.assertRaisesRegexp(
            Exception, 'The only directory in . should be assets/'):
            utils.get_exploration_components_from_dir('.')

    def test_get_exploration_components_from_dir_with_multiple_yaml_files(self):
        with self.assertRaisesRegexp(
            Exception,
            'More than one non-asset file specified for '
            'core/tests/data/dummy_assets/assets'):
            utils.get_exploration_components_from_dir(
                'core/tests/data/dummy_assets/assets/')

    def test_get_exploration_components_from_dir_with_no_yaml_file(self):
        with self.assertRaisesRegexp(
            Exception,
            'No yaml file specifed for core/tests/data/dummy_assets'):
            utils.get_exploration_components_from_dir(
                'core/tests/data/dummy_assets/')

    def test_get_asset_dir_prefix_with_prod_mode(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertEqual(utils.get_asset_dir_prefix(), '/build')

    def test_base64_from_int(self):
        base64_number = utils.base64_from_int(108)
        self.assertEqual(base64.b64decode(base64_number), '[108]')

    def test_get_supported_audio_language_description_with_invalid_code(self):
        valid_language_code = 'en'
        expected_language_description = 'English'
        self.assertEqual(
            utils.get_supported_audio_language_description(valid_language_code),
            expected_language_description)

        invalid_language_code = 'invalid_code'
        with self.assertRaisesRegexp(
            Exception, 'Unsupported audio language code: invalid_code'):
            utils.get_supported_audio_language_description(
                invalid_language_code)

    def test_is_pseudonymous_id(self):
        self.assertTrue(utils.is_pseudonymous_id('pid_' + 'a' * 32))
        self.assertFalse(utils.is_pseudonymous_id('uid_' + 'a' * 32))
        self.assertFalse(utils.is_pseudonymous_id('uid_' + 'a' * 31 + 'A'))
        self.assertFalse(utils.is_pseudonymous_id('uid_' + 'a' * 31))
        self.assertFalse(utils.is_pseudonymous_id('a' * 36))

    def test_snake_case_to_camel_case(self):
        camel_case_str1 = utils.snake_case_to_camel_case('user_id_number')
        camel_case_str2 = utils.snake_case_to_camel_case('hello_world')
        camel_case_str3 = utils.snake_case_to_camel_case('test1')
        self.assertEqual(camel_case_str1, 'userIdNumber')
        self.assertEqual(camel_case_str2, 'helloWorld')
        self.assertEqual(camel_case_str3, 'test1')

    def _assert_valid_thumbnail_filename(
            self, expected_error_substring, thumbnail_filename):
        """Helper method for test_require_valid_thumbnail_filename."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            utils.require_valid_thumbnail_filename(
                thumbnail_filename)

    def test_require_valid_thumbnail_filename(self):
        """Test thumbnail filename validation."""
        self._assert_valid_thumbnail_filename(
            'Expected thumbnail filename to be a string, received 10', 10)
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

    def test_get_time_in_millisecs(self):
        dt = datetime.datetime(2020, 6, 15)
        msecs = utils.get_time_in_millisecs(dt)
        self.assertEqual(
            dt,
            datetime.datetime.fromtimestamp(python_utils.divide(msecs, 1000.0)))

    def test_get_time_in_millisecs_with_complicated_time(self):
        dt = datetime.datetime(2020, 6, 15, 5, 18, 23, microsecond=123456)
        msecs = utils.get_time_in_millisecs(dt)
        self.assertEqual(
            dt,
            datetime.datetime.fromtimestamp(python_utils.divide(msecs, 1000.0)))

    def test_get_current_appengine_environment(self):
        saved_appengine_runtime = (
            os.environ['APPENGINE_RUNTIME'] if 'APPENGINE_RUNTIME' in os.environ
            else None)
        saved_server_software = (
            os.environ['SERVER_SOFTWARE'] if 'SERVER_SOFTWARE' in os.environ
            else None)

        os.environ['APPENGINE_RUNTIME'] = 'True'
        self.assertTrue(utils.is_local_server_environment())
        os.environ['SERVER_SOFTWARE'] = 'Google App Engine/'
        self.assertTrue(utils.is_appengine_cloud_environment())

        if saved_appengine_runtime is not None:
            os.environ['SERVER_SOFTWARE'] = saved_appengine_runtime
        else:
            del os.environ['SERVER_SOFTWARE']

        if saved_server_software is not None:
            os.environ['SERVER_SOFTWARE'] = saved_server_software
        else:
            del os.environ['SERVER_SOFTWARE']

    def test_is_user_id_valid(self):
        self.assertTrue(utils.is_user_id_valid(feconf.SYSTEM_COMMITTER_ID))
        self.assertTrue(utils.is_user_id_valid(feconf.MIGRATION_BOT_USER_ID))
        self.assertTrue(utils.is_user_id_valid(feconf.SUGGESTION_BOT_USER_ID))
        self.assertTrue(utils.is_user_id_valid('uid_%s' % ('a' * 32)))
        self.assertFalse(utils.is_user_id_valid('uid_%s%s' % ('a' * 31, 'A')))
        self.assertFalse(utils.is_user_id_valid('uid_%s' % ('a' * 31)))
        self.assertFalse(utils.is_user_id_valid('a' * 36))
