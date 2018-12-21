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

"""Unit tests for core.domain.customization_args_utils."""

import logging

from core.domain import customization_args_util
from core.domain import interaction_registry
from core.tests import test_utils
import utils


class CustomizationArgsUtilUnitTests(test_utils.GenericTestBase):
    """Test customization args generation and validation."""

    def test_get_full_customization_args(self):
        """Test get full customization args method."""
        ca_continue_specs = interaction_registry.Registry.get_interaction_by_id(
            'Continue').customization_arg_specs
        complete_customization_args = {
            'buttonText': {'value': 'Please Continue'}
        }

        complete_customization_args_with_extra_arg = {
            'buttonText': {'value': 'Please Continue'},
            'extraArg': {'value': ''}
        }

        # Check if no new key is added to customization arg dict if all specs
        # are present.
        self.assertEqual(
            complete_customization_args,
            customization_args_util.get_full_customization_args(
                complete_customization_args, ca_continue_specs
            )
        )

        # Check if no new key is added to customization arg dict and extra keys
        # are not removed if all specs are present.
        self.assertEqual(
            complete_customization_args_with_extra_arg,
            customization_args_util.get_full_customization_args(
                complete_customization_args_with_extra_arg,
                ca_continue_specs
            )
        )

        ca_fraction_input_specs = (
            interaction_registry.Registry.get_interaction_by_id(
                'FractionInput').customization_arg_specs
        )

        incomplete_customization_args = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False}
        }

        incomplete_customization_args_with_extra_arg = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'extraArg': {'value': ''}
        }

        expected_complete_customization_args = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': ''}
        }

        expected_complete_customization_args_with_extra_arg = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': ''},
            'extraArg': {'value': ''}
        }

        # Check if missing specs are added to customization arg dict without
        # making any other change.
        self.assertEqual(
            expected_complete_customization_args,
            customization_args_util.get_full_customization_args(
                incomplete_customization_args, ca_fraction_input_specs
            )
        )

        # Check if missing specs are added to customization arg dict without
        # making any other change and without removing extra args.
        self.assertEqual(
            expected_complete_customization_args_with_extra_arg,
            customization_args_util.get_full_customization_args(
                incomplete_customization_args_with_extra_arg,
                ca_fraction_input_specs
            )
        )

    def test_validate_customization_args_and_values(self):
        """Test validate customization args and values method."""

        observed_log_messages = []

        def mock_logging_function(msg, *_):
            observed_log_messages.append(msg)

        ca_item_selection_specs = (
            interaction_registry.Registry.get_interaction_by_id(
                'ItemSelectionInput').customization_arg_specs
        )

        complete_customization_args = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': ['']
        }

        complete_customization_args_with_invalid_arg_name = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': [''],
            23: {'value': ''}
        }

        complete_customization_args_with_extra_arg = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': [''],
            'extraArg': {'value': ''}
        }

        complete_customization_args_with_invalid_arg_type = {
            'minAllowableSelectionCount': {'value': 'invalid'},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': ['']
        }

        expected_customization_args_after_validation = {
            'minAllowableSelectionCount': {'value': 1},
            'maxAllowableSelectionCount': {'value': 1},
            'choices': ['']
        }

        expected_customization_args_after_validation_with_invalid_arg_type = (
            complete_customization_args_with_invalid_arg_type
        )

        # The next four checks are for cases where customization args dict
        # contains all required specs.

        # Check if no error is produced for valid customization args.
        customization_args_util.validate_customization_args_and_values(
            'interaction',
            'ItemSelectionInput',
            complete_customization_args,
            ca_item_selection_specs
        )
        self.assertEqual(
            expected_customization_args_after_validation,
            complete_customization_args
        )

        # Check if error is produced when arg name is invalid.
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid customization arg name: 23'
        ):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'ItemSelectionInput',
                complete_customization_args_with_invalid_arg_name,
                ca_item_selection_specs
            )

        # Check if error is produced when extra args are present.
        with self.swap(logging, 'warning', mock_logging_function):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'ItemSelectionInput',
                complete_customization_args_with_extra_arg,
                ca_item_selection_specs
            )
            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                (
                    'Interaction ItemSelectionInput does not support '
                    'customization arg extraArg.'
                )
            )
            self.assertEqual(
                expected_customization_args_after_validation,
                complete_customization_args_with_extra_arg
            )

        # Check if no error is produced when arg type is not valid.
        customization_args_util.validate_customization_args_and_values(
            'interaction',
            'ItemSelectionInput',
            complete_customization_args_with_invalid_arg_type,
            ca_item_selection_specs
        )

        self.assertEqual(
            expected_customization_args_after_validation_with_invalid_arg_type,
            complete_customization_args_with_invalid_arg_type
        )

        ca_fraction_input_specs = (
            interaction_registry.Registry.get_interaction_by_id(
                'FractionInput').customization_arg_specs
        )

        incomplete_customization_args = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False}
        }

        incomplete_customization_args_with_invalid_arg_name = {
            'requireSimplestForm': {'value': False},
            False: {'value': False},
        }

        incomplete_customization_args_with_extra_arg = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'extraArg': {'value': ''}
        }

        incomplete_customization_args_with_invalid_arg_type = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': 12}
        }

        expected_customization_args_after_validation = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': ''}
        }

        expected_customization_args_after_validation_with_invalid_arg_type = (
            incomplete_customization_args_with_invalid_arg_type
        )

        # The next four checks are for cases where customization args dict
        # does not contain some of the required specs.

        # Check if no error is produced for valid customization args.
        customization_args_util.validate_customization_args_and_values(
            'interaction',
            'FractionInput',
            incomplete_customization_args,
            ca_fraction_input_specs
        )
        self.assertEqual(
            expected_customization_args_after_validation,
            incomplete_customization_args
        )

        # Check if error is produced when arg name is invalid.
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid customization arg name: False'
        ):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                incomplete_customization_args_with_invalid_arg_name,
                ca_fraction_input_specs
            )

        # Check if error is produced when extra args are present.
        with self.swap(logging, 'warning', mock_logging_function):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                incomplete_customization_args_with_extra_arg,
                ca_fraction_input_specs
            )
            self.assertEqual(len(observed_log_messages), 2)
            self.assertEqual(
                observed_log_messages[1],
                (
                    'Interaction FractionInput does not support customization '
                    'arg extraArg.'
                )
            )
            self.assertEqual(
                expected_customization_args_after_validation,
                incomplete_customization_args_with_extra_arg
            )

        # Check if no error is produced when arg type is not valid.
        customization_args_util.validate_customization_args_and_values(
            'interaction',
            'FractionInput',
            incomplete_customization_args_with_invalid_arg_type,
            ca_fraction_input_specs
        )
        self.assertEqual(
            expected_customization_args_after_validation_with_invalid_arg_type,
            incomplete_customization_args_with_invalid_arg_type
        )

        # A general check to see if error are produced when customization args
        # is not of type dict.
        customization_args_with_invalid_type = 23
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected customization args to be a dict, received %s'
            % customization_args_with_invalid_type
        ):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                customization_args_with_invalid_type,
                ca_fraction_input_specs
            )
