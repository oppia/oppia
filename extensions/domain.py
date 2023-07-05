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

from typing import Any, Dict, List, Optional, TypedDict, Union


class VertexDict(TypedDict):
    """Type for the dictionary representation of graph's vertices."""

    x: float
    y: float
    label: str


class EdgeDict(TypedDict):
    """Type for the dictionary representation of graph's edges."""

    src: int
    dst: int
    weight: int


class GraphDict(TypedDict):
    """Type for the dictionary representation of graph."""

    vertices: List[VertexDict]
    edges: List[EdgeDict]
    isLabeled: bool
    isDirected: bool
    isWeighted: bool


class RegionDict(TypedDict):
    """Type representing the dictionary for region's area."""

    regionType: str
    area: List[List[float]]


class LabeledRegionDict(TypedDict):
    """Type representing the dictionary for image's labeled region."""

    label: str
    region: RegionDict


class ImageAndRegionDict(TypedDict):
    """Dictionary representation of imageAndRegions customization arg value."""

    imagePath: str
    labeledRegions: List[LabeledRegionDict]


class CustomizationArgSubtitledUnicodeDefaultDict(TypedDict):
    """Type for the dictionary representation of CustomizationArgSpec's
    SubtitledUnicode default_value.
    """

    content_id: Optional[str]
    unicode_str: str


class CustomizationArgSubtitledHtmlDefaultDict(TypedDict):
    """Type for the dictionary representation of CustomizationArgSpec's
    SubtitledHtml default_value.
    """

    content_id: Optional[str]
    html: str


AllowedDefaultValueTypes = Union[
    str,
    float,
    GraphDict,
    ImageAndRegionDict,
    CustomizationArgSubtitledUnicodeDefaultDict,
    List[CustomizationArgSubtitledHtmlDefaultDict],
    None
]


class CustomizationArgSpecsDict(TypedDict):
    """Dictionary representing the CustomizationArgSpec object."""

    name: str
    description: str
    # Here we use type Any because values in schema dictionary can be of type
    # str, List, Dict, nested Dict and other types too.
    schema: Dict[str, Any]
    default_value: AllowedDefaultValueTypes


class CustomizationArgSpec:
    """Value object for a customization arg specification."""

    # Here we use type Any because the argument 'schema' can accept schema
    # dictionaries and values in schema dictionaries can be of type str, List,
    # Dict, nested Dict and other types too.
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
