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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

from core.domain import customization_args_util
from core.domain import interaction_registry
from core.tests import test_utils
import feconf
import python_utils
import utils


class CustomizationArgsUtilUnitTests(test_utils.GenericTestBase):
    """Test customization args generation and validation."""

    def test_get_full_customization_args(self):
        """Test get full customization args method."""
        ca_continue_specs = interaction_registry.Registry.get_interaction_by_id(
            'Continue').customization_arg_specs
        complete_customization_args = {
            'buttonText': {
                'value': {
                    'content_id': None,
                    'unicode_str': 'Please Continue'
                }
            }
        }

        complete_customization_args_with_extra_arg = {
            'buttonText': {
                'value': {
                    'content_id': None,
                    'unicode_str': 'Please Continue'
                }
            },
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
            'customPlaceholder': {
                'value': {
                    'content_id': None,
                    'unicode_str': ''
                }
            }
        }

        expected_complete_customization_args_with_extra_arg = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {
                'value': {
                    'content_id': None,
                    'unicode_str': ''
                }
            },
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
        with self.assertRaisesRegexp(
            utils.ValidationError,
            (
                'Interaction ItemSelectionInput does not support '
                'customization arg extraArg.'
            )
        ):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'ItemSelectionInput',
                complete_customization_args_with_extra_arg,
                ca_item_selection_specs
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

        incomplete_customization_args_with_invalid_arg_type = {
            'requireSimplestForm': {'value': False},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': 12}
        }

        complete_customization_args_with_invalid_arg_type = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': 12}
        }

        complete_customization_args_with_extra_arg = {
            'requireSimplestForm': {'value': False},
            'allowImproperFraction': {'value': True},
            'allowNonzeroIntegerPart': {'value': False},
            'customPlaceholder': {'value': ''},
            'extraArg': {'value': ''}
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

        # Check if error is produced for missing customization args.
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Customization argument is missing key: allowImproperFraction'
        ):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                incomplete_customization_args,
                ca_fraction_input_specs
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
        with self.assertRaisesRegexp(
            utils.ValidationError,
            (
                'Interaction FractionInput does not support customization '
                'arg extraArg.'
            )
        ):
            customization_args_util.validate_customization_args_and_values(
                'interaction',
                'FractionInput',
                complete_customization_args_with_extra_arg,
                ca_fraction_input_specs
            )

        # Check if no error is produced when arg type is not valid.
        customization_args_util.validate_customization_args_and_values(
            'interaction',
            'FractionInput',
            complete_customization_args_with_invalid_arg_type,
            ca_fraction_input_specs
        )
        self.assertEqual(
            complete_customization_args_with_invalid_arg_type,
            {
                'requireSimplestForm': {'value': False},
                'allowImproperFraction': {'value': True},
                'allowNonzeroIntegerPart': {'value': False},
                'customPlaceholder': {'value': 12}
            }
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

    def test_frontend_customization_args_defs_coverage(self):
        """Test to ensure that customization-args-defs.ts has both frontend and
        backend interfaces for each interaction's customization arguments.

        Specifically: given an interaction with id 'X', there must exist an
        interface in customization-args-defs.ts named XCustomizationArgs and
        XCustomizationArgsBackendDict.
        """
        filepath = os.path.join(
            feconf.INTERACTIONS_DIR, 'customization-args-defs.ts')
        with python_utils.open_file(filepath, 'r', newline='') as f:
            lines = f.readlines()

        all_interaction_ids = (
            set(interaction_registry.Registry.get_all_interaction_ids()))
        interaction_ids_with_ca_backend_interfaces = set()
        interaction_ids_with_ca_frontend_interfaces = set()

        for line in lines:
            # Search for XCustomizationArgsBackendDict interfaces and extract X,
            # where X is a interaction id.
            # Group 1: The characters 'interface'.
            # Group 2: The interaction id.
            # Group 3: The characters 'CustomizationArgsBackendDict'.
            ca_backend_interface_match = (
                re.search(
                    r'(interface )([a-zA-Z]+)(CustomizationArgsBackendDict)',
                    line
                ))
            if ca_backend_interface_match:
                interaction_ids_with_ca_backend_interfaces.add(
                    ca_backend_interface_match.group(2))

            # Search for XCustomizationArgs interfaces and extract X,
            # where X is a interaction id.
            # Group 1: The characters 'interface'.
            # Group 2: The interaction id.
            # Group 3: The characters 'CustomizationArgs'.
            # Group 4: A space or an open bracket.
            ca_frontend_interface_match = (
                re.search(
                    r'(interface )([a-zA-Z]+)(CustomizationArgs)( |{)',
                    line
                ))
            if ca_frontend_interface_match:
                interaction_ids_with_ca_frontend_interfaces.add(
                    ca_frontend_interface_match.group(2))

        self.assertGreater(len(interaction_ids_with_ca_backend_interfaces), 0)
        self.assertEqual(
            all_interaction_ids,
            interaction_ids_with_ca_backend_interfaces)

        self.assertGreater(len(interaction_ids_with_ca_frontend_interfaces), 0)
        self.assertEqual(
            all_interaction_ids,
            interaction_ids_with_ca_frontend_interfaces)

    def test_frontend_customization_args_constructor_coverage(self):
        """Test to ensure that InteractionObjectFactory.ts covers constructing
        customization arguments for each interaction. Uses regex to confirm
        that the CustomizationArgs or CustomizationArgsBackendDict
        interface is used in the file to typecast customization arguments.
        """
        filepath = os.path.join(
            'core', 'templates', 'domain', 'exploration',
            'InteractionObjectFactory.ts')
        with python_utils.open_file(filepath, 'r', newline='') as f:
            lines = f.readlines()

        all_interaction_ids = (
            set(interaction_registry.Registry.get_all_interaction_ids()))
        interaction_ids_with_used_ca_frontend_interfaces = set()

        for line in lines:
            # Checks that the customization args interfaces are being used
            # to typecast the customization args. Matches patterns
            # <XCustomizationArgs> or <XCustomizationArgsBackendDict> where
            # X is a interaction id.
            # Group 1: The character '<'.
            # Group 2: The interaction id.
            # Group 3: The characters 'CustomizationArgs'.
            # Group 4: The characters 'BackendDict' (optional).
            # Group 5: The character '>'.
            used_match = (
                re.search(
                    r'(<)([a-zA-Z]+)(CustomizationArgs)(BackendDict)?(>)',
                    line
                ))
            if used_match:
                interaction_ids_with_used_ca_frontend_interfaces.add(
                    used_match.group(2))

        self.assertEqual(
            all_interaction_ids,
            interaction_ids_with_used_ca_frontend_interfaces)
