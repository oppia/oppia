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

"""Utility methods for customization args of interactions."""

import logging

import schema_utils
import utils


def get_full_customization_args(customization_args, ca_specs):
    """Populates the given customization_args dict with default values
    if any of the expected customization_args are missing.

    Args:
        customization_args: dict. The customization dict. The keys are names
            of customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs: list(dict). List of spec dictionaries. Is used to check if
            some keys are missing in customization_args. Dicts have the
            following structure:
                - name: str. The customization variable name.
                - description: str. The customization variable description.
                - default_value: *. The default value of the customization
                    variable.

    Returns:
        dict. The customization_args dict where missing keys are populated
        with the default values.
    """
    for ca_spec in ca_specs:
        if ca_spec.name not in customization_args:
            customization_args[ca_spec.name] = {
                'value': ca_spec.default_value
            }
    return customization_args


def validate_customization_args_and_values(
        item_name, item_type, customization_args,
        ca_specs_to_validate_against):
    """Validates the given `customization_args` dict against the specs set
    out in 'ca_specs_to_validate_against'. 'item_name' and 'item_type' are
    used to populate any error messages that arise during validation.
    Note that this may modify the given customization_args dict, if it has
    extra or missing keys. It also normalizes any HTML in the
    customization_args dict.

    Args:
        item_name: str. This is always 'interaction'.
        item_type: str. The item_type is the ID of the interaction.
        customization_args: dict. The customization dict. The keys are names
            of customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs_to_validate_against: list(dict). List of spec dictionaries.
            Is used to check if some keys are missing in customization_args.
            Dicts have the following structure:
                - name: str. The customization variable name.
                - description: str. The customization variable description.
                - default_value: *. The default value of the customization
                    variable.

    Raises:
        ValidationError: The given 'customization_args' is not valid.
    """
    ca_spec_names = [
        ca_spec.name for ca_spec in ca_specs_to_validate_against]

    if not isinstance(customization_args, dict):
        raise utils.ValidationError(
            'Expected customization args to be a dict, received %s'
            % customization_args)

    # Validate and clean up the customization args.

    # Populate missing keys with the default values.
    customization_args = get_full_customization_args(
        customization_args, ca_specs_to_validate_against)

    # Remove extra keys.
    extra_args = []
    for arg_name in customization_args.keys():
        if not isinstance(arg_name, basestring):
            raise utils.ValidationError(
                'Invalid customization arg name: %s' % arg_name)
        if arg_name not in ca_spec_names:
            extra_args.append(arg_name)
            logging.warning(
                '%s %s does not support customization arg %s.'
                % (item_name.capitalize(), item_type, arg_name))
    for extra_arg in extra_args:
        del customization_args[extra_arg]

    # Check that each value has the correct type.
    for ca_spec in ca_specs_to_validate_against:
        try:
            customization_args[ca_spec.name]['value'] = (
                schema_utils.normalize_against_schema(
                    customization_args[ca_spec.name]['value'],
                    ca_spec.schema))
        except Exception:
            # TODO(sll): Raise an actual exception here if parameters are
            # not involved (If they are, can we get sample values for the
            # state context parameters?).
            pass
