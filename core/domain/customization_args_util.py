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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

import python_utils
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

def get_full_customization_args_with_content(customization_args, ca_specs):
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
        tuple. A 2-tuple, the first being the customization_args dict where
        missing keys are populated with the default values, and the second an
        array of new content_id's from the default values.
    """
    all_new_content_ids = []

    for ca_spec in ca_specs:
        if ca_spec.name not in customization_args:
            ca_value = {'value': ca_spec.default_value}
            customization_args[ca_spec.name] = ca_value
            new_content_ids = get_all_content_ids_in_cust_args(
                {ca_spec.name: ca_value},
                [ca_spec]
            )
            all_new_content_ids.extend(new_content_ids)

    return customization_args, all_new_content_ids


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
        if not isinstance(arg_name, python_utils.BASESTRING):
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


def apply_conversion_fn_on_content(
        conversion_fn, customization_arg, schema, ca_name=None):
    """Helper function that recursively traverses a customization argument
    spec to locate any SubtitledHtml or SubtitledUnicode objects, and applies a
    conversion function to the customization argument value.

    Args:
        customization_arg: dict. The customization dict to be modified: dict
            with a single key, 'value', whose corresponding value is the
            value of the customization arg.
        current_spec: dict. The spec dictionary.
        conversion_fn: function. The function to be used for converting the
            HTML. It is passed the obj_type, customization argument value,
            content_id prefix generated from schema, and the customization
            argument name, if availible.

    """
    schema_type = schema['type']
    schema_obj_type = schema.get('obj_type', None)
    
    if (schema_obj_type == 'SubtitledUnicode' or
            schema_obj_type == 'SubtitledHtml'):
        ca_value = customization_arg['value']
        if isinstance(ca_value, list):
            for i in range(len(ca_value)):
                customization_arg['value'][i] = conversion_fn(
                    ca_value[i],
                    schema_obj_type)
        elif isinstance(ca_value, dict) and 'content_id' in ca_value:
            customization_arg['value'] = conversion_fn(
                ca_value,
                schema_obj_type)
        elif isinstance(ca_value, dict):
            customization_arg['value'][ca_name] = conversion_fn(
                ca_value[ca_name],
                schema_obj_type)
    elif schema_type == 'list':
        apply_conversion_fn_on_content(
            customization_arg,
            schema['items'],
            conversion_fn)
    elif schema_type == 'dict':
        for i in python_utils.RANGE(
                len(current_spec['properties'])):
            apply_conversion_fn_on_content(
                customization_arg,
                schema['properties'][i],
                conversion_fn,
                ca_name=schema['name'])


def convert_content_in_cust_args(
        ca_values, ca_specs, conversion_fn):
    """Converts all html of SubtitledHtml or unicode of SubtitledUnicode in
    customization arguments.

    Args:
        ca_values: dict. The customization dict. The keys are names
            of customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs: list(CustomizationArgSpec). List of spec dictionaries.
        conversion_fn: function. The function to be used for converting the
            HTML. It is passed the obj_type, customization argument value,
            content_id prefix generated from schema, and the customization
            argument name, if availible.
    """
    for ca_spec in ca_specs:
        ca_spec_name = ca_spec.name
        if ca_spec_name in ca_values:
            apply_conversion_fn_on_content(
                ca_values[ca_spec_name],
                ca_spec.to_dict(),
                conversion_fn)


def get_all_content_ids_in_cust_args(ca_values, ca_specs):
    """Extracts all content_id's from ca_values, using ca_specs to find
    SubtitledHtml or SubtitledUnicode locations.

    Args:
        ca_values: dict. The customization dict. The keys are names
            of customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs: list(CustomizationArgSpec). List of spec dictionaries.

    Returns:
        list(str). List of all content_id's in customization arguments.
    """
    content_ids = []
    def extract_content_ids(ca_value, unused_obj_type):
        """Conversion function used to extract all content_ids. Customization
        argument is returned unmodified.

        Args:
            ca_value: dict. Dictionary of key 'value' to
                original value of customization argument.
            unused_obj_type: str. Indicates the obj_type found in
                the customization arguments schema.

        Returns:
            str. The unmodified customization argument value.
        """
        if 'content_id' in ca_value:
            content_ids.append(ca_value['content_id'])

        return ca_value

    for ca_spec in ca_specs:
        ca_spec_name = ca_spec.name
        if ca_spec_name in ca_values:
            apply_conversion_fn_on_content(
                ca_values[ca_spec_name],
                ca_spec.to_dict(),
                extract_content_ids)

    return content_ids


def get_all_html_in_cust_args(ca_values, ca_specs):
    """Extracts all html from ca_values, using ca_specs to find
    SubtitledHtml locations.

    Args:
        ca_values: dict. The customization dict. The keys are names
            of customization_args and the values are dicts with a
            single key, 'value', whose corresponding value is the value of
            the customization arg.
        ca_specs: list(CustomizationArgSpec). List of spec dictionaries.

    Returns:
        list(str). List of all html in customization arguments.
    """
    html = []
    def extract_html(ca_value, obj_type):
        """Conversion function used to extract all html. Customization
        argument is returned unmodified.

        Args:
            obj_type: str. Indicates the obj_type found in
                the customization arguments schema.
            ca_value: dict. Dictionary of key 'value' to
                original value of customization argument.

        Returns:
            str. The unmodified customization argument value.
        """
        if obj_type == 'SubtitledUnicode':
            return ca_value

        if 'html' in ca_value:
            html.append(ca_value['html'])

        return ca_value

    for ca_spec in ca_specs:
        ca_spec_name = ca_spec.name
        if ca_spec_name in ca_values:
            apply_conversion_fn_on_content(
                ca_values[ca_spec_name],
                ca_spec.to_dict(),
                extract_html)

    return html
