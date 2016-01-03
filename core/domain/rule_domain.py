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

"""Classes relating to rules."""

from extensions.objects.models import objects

CERTAIN_TRUE_VALUE = 1.0
CERTAIN_FALSE_VALUE = 0.0
FUZZY_RULE_TYPE = 'FuzzyMatches'


def get_param_list(description):
    """Get a parameter list from the rule description."""
    param_list = []
    while description.find('{{') != -1:
        opening_index = description.find('{{')
        description = description[opening_index + 2:]

        bar_index = description.find('|')
        param_name = description[: bar_index]
        description = description[bar_index + 1:]

        closing_index = description.find('}}')
        normalizer_string = description[: closing_index]
        description = description[closing_index + 2:]

        param_list.append(
            (param_name, getattr(objects, normalizer_string))
        )

    return param_list
