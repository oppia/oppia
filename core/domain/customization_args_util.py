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

from __future__ import annotations

from core import schema_utils
from core import utils
from core.domain import state_domain
from extensions import domain

from typing import Dict, List, Mapping, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    AcceptableCustomizationArgsTypes = Union[
        str,
        int,
        bool,
        List[str],
        domain.GraphDict,
        Dict[str, Optional[str]],
        List[state_domain.SubtitledHtml],
        List[state_domain.SubtitledHtmlDict],
        state_domain.SubtitledHtmlDict,
        state_domain.SubtitledUnicodeDict,
        state_domain.SubtitledUnicode,
        domain.ImageAndRegionDict,
        domain.CustomizationArgSubtitledUnicodeDefaultDict,
        List[domain.CustomizationArgSubtitledUnicodeDefaultDict],
        None
    ]

    CustomizationArgsDictType = Mapping[
        str, Mapping[str, AcceptableCustomizationArgsTypes]
    ]


def validate_customization_args_and_values(
    item_name: str,
    item_type: str,
    customization_args: CustomizationArgsDictType,
    ca_specs_to_validate_against: List[domain.CustomizationArgSpec],
    fail_on_validation_errors: bool = False
) -> None:
    """Validates the given `customization_args` dict against the specs set
    out in 'ca_specs_to_validate_against'. 'item_name' and 'item_type' are
    used to populate any error messages that arise during validation.
    Note that this may modify the given customization_args dict, if it has
    extra keys. It also normalizes any HTML in the customization_args dict.

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
        fail_on_validation_errors: bool. Whether to raise errors if
            validation fails for customization args.

    Raises:
        ValidationError. The given 'customization_args' is not valid.
        ValidationError. The given 'customization_args' is missing at least one
            key.
    """
    ca_spec_names = [
        ca_spec.name for ca_spec in ca_specs_to_validate_against]

    if not isinstance(customization_args, dict):
        raise utils.ValidationError(
            'Expected customization args to be a dict, received %s'
            % customization_args)

    # Check for extra invalid keys.
    for arg_name in customization_args.keys():
        if not isinstance(arg_name, str):
            raise utils.ValidationError(
                'Invalid customization arg name: %s' % arg_name)
        if arg_name not in ca_spec_names:
            raise utils.ValidationError(
                '%s %s does not support customization arg %s.'
                % (item_name.capitalize(), item_type, arg_name))

    # Check that each value has the correct type.
    for ca_spec in ca_specs_to_validate_against:
        if ca_spec.name not in customization_args:
            raise utils.ValidationError(
                'Customization argument is missing key: %s' % ca_spec.name)
        try:
            customization_args[ca_spec.name]['value'] = (
                schema_utils.normalize_against_schema(
                    customization_args[ca_spec.name]['value'],
                    ca_spec.schema))
        except Exception as e:
            # TODO(sll): Raise an actual exception here if parameters are
            # not involved (If they are, can we get sample values for the
            # state context parameters?).
            if fail_on_validation_errors:
                raise utils.ValidationError(e)
