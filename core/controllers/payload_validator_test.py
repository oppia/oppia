# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for various errors raised by validate method of payload validator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import payload_validator
from core.tests import test_utils


class PayloadValidationUnitTests(test_utils.GenericTestBase):

    def test_invalid_args_raises_exceptions(self):
        # type: () -> None

        # List of 3-tuples, where the first element is an invalid argument dict,
        # the second element is a schema dict and the third element
        # is a list of errors.

        list_of_invalid_args_with_schema_and_errors = [
            ({
                'exploration_id': 2
            }, {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    }
                }
            }, [
                'Schema validation for \'exploration_id\' failed: '
                'Expected string, received 2']),
            ({
                'version': 'random_string'
            }, {
                'version': {
                    'schema': {
                        'type': 'int'
                    }
                }
            }, [
                'Schema validation for \'version\' failed: '
                'Could not convert unicode to int: random_string']),
            ({
                'exploration_id': 'any_exp_id'
            }, {}, [
                'Found extra args: [u\'exploration_id\'].']),
            ({}, {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    }
                }
            }, [
                'Missing key in handler args: exploration_id.'])
        ]
        for handler_args, handler_args_schema, error_msg in (
                list_of_invalid_args_with_schema_and_errors):
            normalized_value, errors = payload_validator.validate(
                handler_args, handler_args_schema, False)

            self.assertEqual(normalized_value, {})
            self.assertEqual(error_msg, errors)

    def test_valid_args_do_not_raises_exception(self):
        # type: () -> None

        # List of 3-tuples, where the first element is a valid argument dict,
        # the second element is a schema dict and the third element is the
        # normalized value of the corresponding argument.
        list_of_valid_args_with_schmea = [
            ({}, {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    },
                    'default_value': None
                }
            }, {}),
            ({}, {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    },
                    'default_value': 'default_exp_id'
                }
            }, {
                'exploration_id': 'default_exp_id'
            }),
            ({
                'exploration_id': 'any_exp_id'
            }, {
                'exploration_id': {
                    'schema': {
                        'type': 'basestring'
                    }
                }
            }, {
                'exploration_id': 'any_exp_id'
            })
        ]
        for handler_args, handler_args_schema, normalized_value_for_args in (
                list_of_valid_args_with_schmea):
            normalized_value_for_args, errors = payload_validator.validate(
                handler_args, handler_args_schema, False)

            self.assertEqual(
                normalized_value_for_args, normalized_value_for_args)
            self.assertEqual(errors, [])
