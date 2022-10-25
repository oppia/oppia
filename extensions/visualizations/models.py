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

"""Base class for visualizations of summarized learner answers."""

from __future__ import annotations

from core import schema_utils
from core import utils
from core.domain import calculation_registry

from typing import Any, Dict, List, Mapping, TypedDict, Union

OptionsDictType = Mapping[str, Union[str, List[str], bool]]


class OptionsSpecsDict(TypedDict):
    """Type for the _OPTIONS_SPECS class variable."""

    name: str
    description: str
    # Here we use type Any because values in schema dictionary can be of type
    # str, List, Dict, nested Dict and other types too.
    schema: Dict[str, Any]


class BaseVisualization:
    """Base class for definitions of visualizations."""

    # Option specifications for the visualization, including their descriptions
    # and schemas. Overridden in subclasses. Used for testing that the
    # answer_visualization_specs in visualizations are valid.
    _OPTIONS_SPECS: List[OptionsSpecsDict] = []

    @property
    def id(self) -> str:
        """The name of the class."""
        return self.__class__.__name__

    def __init__(
        self,
        calculation_id: str,
        options_dict: OptionsDictType,
        addressed_info_is_supported: bool
    ) -> None:
        self.options = options_dict
        self.calculation_id = calculation_id
        self.addressed_info_is_supported = addressed_info_is_supported

    def validate(self) -> None:
        """Validates a visualization object.

        This is only used in tests for the validity of interactions.
        """
        # Check that the calculation id exists.
        calculation_registry.Registry.get_calculation_by_id(self.calculation_id)

        # Check that the options_dict is valid.
        expected_option_names = sorted([
            spec['name'] for spec in self._OPTIONS_SPECS
        ])
        actual_option_names = sorted(self.options.keys())
        if actual_option_names != expected_option_names:
            raise utils.ValidationError(
                'For visualization %s, expected option names %s; received '
                'names %s' %
                (self.id, expected_option_names, actual_option_names))

        # Check that the schemas are correct.
        for spec in self._OPTIONS_SPECS:
            schema_utils.normalize_against_schema(
                self.options[spec['name']], spec['schema'])

        # Check that addressed_info_is_supported is valid.
        if not isinstance(self.addressed_info_is_supported, bool):
            raise utils.ValidationError(
                'For visualization %s, expected a bool value for '
                'addressed_info_is_supported; received %s' %
                (self.id, self.addressed_info_is_supported))


class ClickHexbins(BaseVisualization):
    """A visualization which overlays an image with a hexagonal grouping of
    clicks.

    > Why hexagons? There are many reasons for using hexagons, at least over
      squares. Hexagons have symmetry of nearest neighbors which is lacking in
      square bins. Hexagons are the maximum number of sides a polygon can have
      for a regular tesselation of the plane, so in terms of packing a hexagon
      is 13% more efficient for covering the plane than squares. This property
      translates into better sampling efficiency at least for elliptical shapes.
      Lastly hexagons are visually less biased for displaying densities than
      other regular tesselations. For instance with squares our eyes are drawn
      to the horizontal and vertical lines of the grid.
    https://cran.r-project.org/web/packages/hexbin/vignettes/hexagon_binning.pdf
    """

    _OPTIONS_SPECS: List[OptionsSpecsDict] = []


class FrequencyTable(BaseVisualization):
    """A visualization representing a two-column table with answer counts."""

    _OPTIONS_SPECS: List[OptionsSpecsDict] = [{
        'name': 'column_headers',
        'description': 'The headers for the columns.',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode',
            },
            'len': 2,
        },
    }, {
        'name': 'title',
        'description': 'The title of the visualization.',
        'schema': {'type': 'unicode'}
    }]


class EnumeratedFrequencyTable(BaseVisualization):
    """A visualization representing a two-column table with answer counts. The
    answer column is made up of a clickable ranking, which toggles the
    visibility of the answer's content below it.

    The #1 entry is shown by default, all others start hidden.
    """

    _OPTIONS_SPECS: List[OptionsSpecsDict] = [{
        'name': 'column_headers',
        'description': 'The headers for the columns.',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode',
            },
            'len': 2,
        },
    }, {
        'name': 'title',
        'description': 'The title of the visualization.',
        'schema': {'type': 'unicode'}
    }]


class SortedTiles(BaseVisualization):
    """A visualization for showing a small group of answers as a sequence of
    tiles.
    """

    _OPTIONS_SPECS: List[OptionsSpecsDict] = [{
        'name': 'header',
        'description': 'Header for the tiles.',
        'schema': {'type': 'unicode'}
    }, {
        'name': 'use_percentages',
        'description': 'Summarize frequency through percentages',
        'schema': {'type': 'bool'},
    }]
