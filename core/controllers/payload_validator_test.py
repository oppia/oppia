# Tests.
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

"""Tests for various errors raised by validate method of payload validator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import payload_validator
from core.tests import test_utils

class ErrorValidationUnitTests(test_utils.GenericTestBase):

    def test_invalid_args_raises_exceptions(self):
        list_of_invalid_args_with_schema_and_errors = [
            ({
                'exploration_id': 2
            }, {
                'exploration_id': {
                    'type': 'unicode'
                }
            }, ['Schema validation for \'exploration_id\' failed: '
                'Expected unicode string, received 2']),
            ({
                'version': 'random_string'
            }, {
                'version': {
                    'type': 'int'
                }
            }, ['Schema validation for \'version\' failed: '
                'Could not convert unicode to int: random_string']),
            ({
                'exploration_id': 'any_exp_id'
            }, {}, ['Found extra args: [u\'exploration_id\'].'])
        ]
        for item in list_of_invalid_args_with_schema_and_errors:
            handler_args, handler_args_schema, error_msg = item
            errors = payload_validator.validate(
                handler_args, handler_args_schema, False)
            self.log_line(errors)
            self.log_line(handler_args)
            self.log_line(handler_args_schema)
            self.log_line(error_msg)
            self.assertEqual(error_msg, errors)

    def test_valid_args_do_not_raises_exception(self):
        list_of_valid_args_with_schmea = [
            ({}, {
                'exploration_id': {
                    'type': 'unicode',
                    'default_value': None
                }
            }),
            ({
                'exploration_id': None
            }, {
                'exploration_id': {
                    'type': 'unicode',
                    'default_value': None
                }
            }),
            ({
                'exploration_id': 'any_exp_id'
            }, {
                'exploration_id': {
                    'type': 'unicode'
                }
            })
        ]
        for handler_args, handler_args_schema in list_of_valid_args_with_schmea:
            errors = payload_validator.validate(
                handler_args, handler_args_schema, False)
            self.assertFalse(errors)
