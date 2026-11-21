# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Python configuration for the NumberLineInput interaction."""

from __future__ import annotations

import math

from extensions.interactions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


def get_number_line_points(
    start_value: int, end_value: int, interval: float
) -> List[float]:
    """Returns selectable points, or an empty list for invalid settings."""
    if (
        not isinstance(start_value, int)
        or isinstance(start_value, bool)
        or not isinstance(end_value, int)
        or isinstance(end_value, bool)
        or abs(start_value) > 2**53 - 1
        or abs(end_value) > 2**53 - 1
        or not isinstance(interval, (int, float))
        or isinstance(interval, bool)
        or not math.isfinite(interval)
        or interval <= 0
        or end_value <= start_value
    ):
        return []

    number_of_intervals = (end_value - start_value) / interval
    if not math.isfinite(number_of_intervals):
        return []
    rounded_number_of_intervals = round(number_of_intervals)
    if (
        rounded_number_of_intervals < 2
        or rounded_number_of_intervals > 9
        or not math.isclose(
            number_of_intervals,
            rounded_number_of_intervals,
            rel_tol=0,
            abs_tol=1e-9,
        )
    ):
        return []

    # Calculate each point from its index to avoid accumulated rounding error.
    points = [
        round(start_value + index * interval, 12)
        for index in range(rounded_number_of_intervals + 1)
    ]
    points[-1] = float(end_value)
    return points if all(a < b for a, b in zip(points, points[1:])) else []


class NumberLineInput(base.BaseInteraction):
    """Interaction for selecting a point on a number line."""

    name: str = 'Number Line'
    description: str = 'Allows learners to select a point on a number line.'
    display_mode: str = base.DISPLAY_MODE_INLINE
    is_trainable: bool = False
    _dependency_ids: List[str] = []
    answer_type: str = 'Real'
    needs_summary: bool = False
    can_have_solution: bool = True
    show_generic_submit_button: bool = True

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [
        {
            'name': 'startValue',
            'description': 'Starting integer value',
            'schema': {'type': 'int'},
            'default_value': 0,
        },
        {
            'name': 'endValue',
            'description': 'Ending integer value',
            'schema': {'type': 'int'},
            'default_value': 4,
        },
        {
            'name': 'interval',
            'description': 'Distance between adjacent points',
            'schema': {'type': 'float'},
            'default_value': 1.0,
        },
    ]
