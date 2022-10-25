# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Registry for rules and their related specification files."""

from __future__ import annotations

import json
import os

from core import constants
from core import feconf

from typing import Dict, List, Optional, TypedDict


class RuleSpecsExtensionDict(TypedDict):
    """Dictionary representation of rule specs of an extension."""

    interactionId: str
    format: str
    ruleTypes: Dict[str, Dict[str, List[str]]]


class Registry:
    """Registry of rules."""

    _state_schema_version_to_html_field_types_to_rule_specs: Dict[
        Optional[int],
        Dict[str, RuleSpecsExtensionDict]
    ] = {}

    @classmethod
    def get_html_field_types_to_rule_specs(
        cls, state_schema_version: Optional[int] = None
    ) -> Dict[str, RuleSpecsExtensionDict]:
        """Returns a dict containing a html_field_types_to_rule_specs dict of
        the specified state schema version, if available.

        Args:
            state_schema_version: int|None. The state schema version to retrieve
                the html_field_types_to_rule_specs for. If None, the current
                state schema version's html_field_types_to_rule_specs will be
                returned.

        Returns:
            dict. The html_field_types_to_rule_specs specs for the given state
            schema version.

        Raises:
            Exception. No html_field_types_to_rule_specs json file found for the
                given state schema version.
        """
        specs_from_json: Dict[str, RuleSpecsExtensionDict] = {}
        cached = (
            state_schema_version in
            cls._state_schema_version_to_html_field_types_to_rule_specs)

        if not cached:
            if state_schema_version is None:
                specs_from_json = json.loads(
                    constants.get_package_file_contents(
                        'extensions',
                        feconf.
                        HTML_FIELD_TYPES_TO_RULE_SPECS_EXTENSIONS_MODULE_PATH
                    )
                )
                cls._state_schema_version_to_html_field_types_to_rule_specs[
                    state_schema_version
                ] = specs_from_json
            else:
                file_name = 'html_field_types_to_rule_specs_state_v%i.json' % (
                    state_schema_version
                )
                spec_file = os.path.join(
                    feconf
                    .LEGACY_HTML_FIELD_TYPES_TO_RULE_SPECS_EXTENSIONS_MODULE_DIR,  # pylint: disable=line-too-long
                    file_name
                )

                try:
                    specs_from_json = json.loads(
                        constants.get_package_file_contents(
                            'extensions', spec_file
                        )
                    )
                except Exception as e:
                    raise Exception(
                        'No specs json file found for state schema v%i' %
                        state_schema_version) from e

                cls._state_schema_version_to_html_field_types_to_rule_specs[
                    state_schema_version] = specs_from_json

        return cls._state_schema_version_to_html_field_types_to_rule_specs[
            state_schema_version]
