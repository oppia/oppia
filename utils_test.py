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

import copy
import datetime
import logging

# pylint: disable=relative-import
from core.domain import interaction_registry
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
        self.assertEqual(
            utils.convert_to_str(string2), string2.encode(encoding='utf-8'))

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

    def test_is_valid_language_code(self):
        self.assertTrue(utils.is_valid_language_code('en'))
        self.assertFalse(utils.is_valid_language_code('unknown'))

    def test_get_full_customization_args(self):
        """Test get full customization args method."""
        ca_specs1 = interaction_registry.Registry.get_interaction_by_id(
            'Continue').customization_arg_specs

        customization_args1a = {
            'buttonText': {'value': 'Please Continue'}
        }

        customization_args1b = {
            'buttonText': {'value': 'Please Continue'},
            'extraArg': {'value': ''}
        }

        # Check if no new key is added to customization arg dict if all specs
        # are present.
        self.assertEqual(
            customization_args1a,
            utils.get_full_customization_args(customization_args1a, ca_specs1)
        )

        # Check if no new key is added to customization arg dict and extra keys
        # are not removed if all specs are present.
        self.assertEqual(
            customization_args1b,
            utils.get_full_customization_args(customization_args1b, ca_specs1)
        )

        ca_specs2 = interaction_registry.Registry.get_interaction_by_id(
            'FractionInput').customization_arg_specs

        customization_args2a = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False}
        }

        customization_args2b = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'extraArg': {'value': ''}
        }

        expected_customization_args2a = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': ''}
        }

        expected_customization_args2b = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': ''},
            'extraArg': {'value': ''}
        }

        # Check if missing specs are added to customization arg dict without
        # making any other change.
        self.assertEqual(
            expected_customization_args2a,
            utils.get_full_customization_args(customization_args2a, ca_specs2)
        )

        # Check if missing specs are added to customization arg dict without
        # making any other change and without removing extra args.
        self.assertEqual(
            expected_customization_args2b,
            utils.get_full_customization_args(customization_args2b, ca_specs2)
        )

    def test_validate_customization_args_and_values(self):
        """Test validate customization args and values method."""

        observed_log_messages = []

        def mock_logging_function(msg, *_):
            observed_log_messages.append(msg)

        ca_specs1 = interaction_registry.Registry.get_interaction_by_id(
            'ItemSelectionInput').customization_arg_specs

        customization_args1a = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': ['']
        }

        customization_args1b = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': [''],
            23: {'value': ''}
        }
        customization_args1c = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': [''],
            'extraArg': {'value': ''}
        }

        customization_args1d = {
            'minAllowableSelectionCount': {'value': 'invalid'},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': ['']
        }

        # The next four checks are for cases where customization args dict
        # contains all required specs.

        # Check if no error is produced for valid customization args.
        utils.validate_customization_args_and_values(
            'interaction',
            'ItemSelectionInput',
            customization_args1a,
            ca_specs1
        )

        # Check if error is produced when arg name is invalid.
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid customization arg name: 23'
        ):
            utils.validate_customization_args_and_values(
                'interaction',
                'ItemSelectionInput',
                customization_args1b,
                ca_specs1
            )

        # Check if error is produced when extra args are present.
        with self.swap(logging, 'warning', mock_logging_function):
            utils.validate_customization_args_and_values(
                'interaction',
                'ItemSelectionInput',
                customization_args1c,
                ca_specs1
            )
            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                (
                    'Interaction ItemSelectionInput does not support '
                    'customization arg extraArg.'
                )
            )

        # Check if no error is produced when arg type is not valid.
        utils.validate_customization_args_and_values(
            'interaction',
            'ItemSelectionInput',
            customization_args1d,
            ca_specs1
        )

        ca_specs2 = interaction_registry.Registry.get_interaction_by_id(
            'FractionInput').customization_arg_specs

        customization_args2a = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False}
        }

        customization_args2b = {
            'requireSimplestForm': {'value': False},
            False: {'value': False},
        }

        customization_args2c = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'extraArg': {'value': ''}
        }

        customization_args2d = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': 12}
        }

        # The next four checks are for cases where customization args dict
        # does not contain some of the required specs.

        # Check if no error is produced for valid customization args.
        utils.validate_customization_args_and_values(
            'interaction',
            'FractionInput',
            customization_args2a,
            ca_specs2
        )

        # Check if error is produced when arg name is invalid.
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid customization arg name: False'
        ):
            utils.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                customization_args2b,
                ca_specs2
            )

        # Check if error is produced when extra args are present.
        with self.swap(logging, 'warning', mock_logging_function):
            utils.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                customization_args2c,
                ca_specs2
            )
            self.assertEqual(len(observed_log_messages), 2)
            self.assertEqual(
                observed_log_messages[1],
                (
                    'Interaction FractionInput does not support customization '
                    'arg extraArg.'
                )
            )

        # Check if no error is produced when arg type is not valid.
        utils.validate_customization_args_and_values(
            'interaction',
            'FractionInput',
            customization_args2d,
            ca_specs2
        )

        # A general check to see if error are produced when customization args
        # is not of type dict.
        customization_args3 = 23
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected customization args to be a dict, received %s'
            % customization_args3
        ):
            utils.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                customization_args3,
                ca_specs1
            )
