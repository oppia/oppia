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

"""Domain objects used within multiple extensions."""

from __future__ import annotations

from typing import Any, Dict, List, Union
from typing_extensions import TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from core.domain import state_domain
    from extensions.interactions.GraphInput import GraphInput
    from extensions.interactions.ImageClickInput import ImageClickInput

    AllowedDefaultValueTypes = Union[
        str,
        float,
        Dict[str, Union[str, List[ImageClickInput.LabeledRegionDict]]],
        state_domain.SubtitledUnicodeDict,
        GraphInput.GraphDict,
        List[state_domain.SubtitledHtmlDict],
        None
    ]


class CustomizationArgSpecsDict(TypedDict):
    """Dictionary representing the CustomizationArgSpec object."""

    name: str
    description: str
    # Here we used Any because values in schema dictionary can be of type str,
    # List, Dict and other types too.
    schema: Dict[str, Any]
    default_value: AllowedDefaultValueTypes


class CustomizationArgSpec:
    """Value object for a customization arg specification."""

    def __init__(
        self,
        name: str,
        description: str,
        schema: Dict[str, Any],
        default_value: AllowedDefaultValueTypes
    ) -> None:
        self.name = name
        self.description = description
        self.schema = schema
        self.default_value = default_value

    def to_dict(self) -> CustomizationArgSpecsDict:
        """Returns a dict representing this CustomizationArgSpec domain object.

        Returns:
            dict. A dict, mapping all fields of CustomizationArgSpec instance.
        """
        return {
            'name': self.name,
            'description': self.description,
            'schema': self.schema,
            'default_value': self.default_value
        }
