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

from core.domain import calculation_registry
import schema_utils
import utils


class BaseVisualization(object):
    """Base class for definitions of visualizations."""

    # Option specifications for the visualization, including their descriptions
    # and schemas. Overridden in subclasses. Used for testing that the
    # answer_visualization_specs in visualizations are valid.
    _OPTIONS_SPECS = []

    @property
    def id(self):
        return self.__class__.__name__

    def __init__(
            self, calculation_id, options_dict, addressed_info_is_supported):
        self.options = options_dict
        self.calculation_id = calculation_id
        self.addressed_info_is_supported = addressed_info_is_supported

    def validate(self):
        """Validates a visualization object.

        This is only used in tests for the validity of interactions.
        """
        # Check that the calculation id exists.
        calculation_registry.Registry.get_calculation_by_id(self.calculation_id)

        # Check that the options_dict is valid.
        expected_option_names = sorted([
            spec['name'] for spec in self._OPTIONS_SPECS])
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
                self.addressed_info_is_supported)


class BarChart(BaseVisualization):
    """A visualization representing a bar chart."""

    _OPTIONS_SPECS = [{
        'name': 'x_axis_label',
        'description': 'The label for the x-axis.',
        'schema': {
            'type': 'unicode',
        },
    }, {
        'name': 'y_axis_label',
        'description': 'The label for the y-axis',
        'schema': {
            'type': 'unicode',
        },
    }]


class FrequencyTable(BaseVisualization):
    """A visualization representing a two-column table with answer counts."""

    _OPTIONS_SPECS = [{
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

    _OPTIONS_SPECS = [{
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
