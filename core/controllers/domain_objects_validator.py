# coding: utf-8

# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Methods for validating domain objects for schema validation of
handler arguments.
"""

from __future__ import annotations

from core.constants import constants
from core.controllers import base
from core.domain import blog_domain
from core.domain import collection_domain
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import state_domain

from typing import Dict, Optional, Union


def validate_exploration_change(obj):
    """Validates exploration change.

    Args:
        obj: dict. Data that needs to be validated.
    """
    # No explicit call to validate_dict method is necessary, because
    # ExplorationChange calls validate method while initialization.
    exp_domain.ExplorationChange(obj) # type: ignore[no-untyped-call]


def validate_new_config_property_values(obj):
    """Validates new config property values.

    Args:
        obj: dict. Data that needs to be validated.
    """
    for (name, value) in obj.items():
        if not isinstance(name, str):
            raise Exception(
                'config property name should be a string, received'
                ': %s' % name)
        config_property = config_domain.Registry.get_config_property(name) # type: ignore[no-untyped-call]
        if config_property is None:
            raise Exception('%s do not have any schema.' % name)

        config_property.normalize(value)


def validate_change_dict_for_blog_post(change_dict):
    """Validates change_dict required for updating values of blog post.

    Args:
        change_dict: dict. Data that needs to be validated.
    """
    if 'title' in change_dict:
        blog_domain.BlogPost.require_valid_title( # type: ignore[no-untyped-call]
            change_dict['title'], True)
    if 'thumbnail_filename' in change_dict:
        blog_domain.BlogPost.require_valid_thumbnail_filename( # type: ignore[no-untyped-call]
            change_dict['thumbnail_filename'])
    if 'tags' in change_dict:
        blog_domain.BlogPost.require_valid_tags( # type: ignore[no-untyped-call]
            change_dict['tags'], False)
        # Validates that the tags in the change dict are from the list of
        # default tags set by admin.
        list_of_default_tags = config_domain.Registry.get_config_property( # type: ignore[no-untyped-call]
            'list_of_default_tags_for_blog_post').value
        if not all(tag in list_of_default_tags for tag in change_dict['tags']):
            raise Exception(
                'Invalid tags provided. Tags not in default tags list.')


def validate_collection_change(obj):
    """Validates collection change.

    Args:
        obj: dict. Data that needs to be validated.
    """
    # No explicit call to validate_dict method is necessary, because
    # CollectionChange calls validate method while initialization.
    collection_domain.CollectionChange(obj) # type: ignore[no-untyped-call]


def validate_state_dict(state_dict):
    """Validates state dict.

    Args:
        state_dict: dict. Data that needs to be validated.
    """
    validation_class = state_domain.State.from_dict(state_dict) # type: ignore[no-untyped-call]
    validation_class.validate(None, True)


def validate_email_dashboard_data(
        data: Dict[str, Optional[Union[bool, int]]]
) -> None:
    """Validates email dashboard data.

    Args:
        data: dict. Data that needs to be validated.
    """
    predicates = constants.EMAIL_DASHBOARD_PREDICATE_DEFINITION
    possible_keys = [predicate['backend_attr'] for predicate in predicates]

    for key, value in data.items():
        if value is None:
            continue
        if key not in possible_keys:
            # Raise exception if key is not one of the allowed keys.
            raise Exception('400 Invalid input for query.')


def validate_task_entries(task_entries):
    """Validates the task entry dict.

    Args:
        task_entries: dict. Data that needs to be validated.
    """
    entity_version = task_entries.get('entity_version', None)
    if entity_version is None:
        raise base.BaseHandler.InvalidInputException(
            'No entity_version provided')
    task_type = task_entries.get('task_type', None)
    if task_type is None:
        raise base.BaseHandler.InvalidInputException('No task_type provided')
    target_id = task_entries.get('target_id', None)
    if target_id is None:
        raise base.BaseHandler.InvalidInputException('No target_id provided')
    status = task_entries.get('status', None)
    if status is None:
        raise base.BaseHandler.InvalidInputException('No status provided')


def validate_aggregated_stats(aggregated_stats):
    """Validates the attribute stats dict.

    Args:
        aggregated_stats: dict. Data that needs to be validated.

    Raises:
        InvalidInputException. Property not in aggregated stats dict.
    """
    exploration_stats_properties = [
        'num_starts',
        'num_actual_starts',
        'num_completions'
    ]
    state_stats_properties = [
        'total_answers_count',
        'useful_feedback_count',
        'total_hit_count',
        'first_hit_count',
        'num_times_solution_viewed',
        'num_completions'
    ]
    for exp_stats_property in exploration_stats_properties:
        if exp_stats_property not in aggregated_stats:
            raise base.BaseHandler.InvalidInputException(
                '%s not in aggregated stats dict.' % (exp_stats_property))
    state_stats_mapping = aggregated_stats['state_stats_mapping']
    for state_name in state_stats_mapping:
        for state_stats_property in state_stats_properties:
            if state_stats_property not in state_stats_mapping[state_name]:
                raise base.BaseHandler.InvalidInputException(
                    '%s not in state stats mapping of %s in aggregated '
                    'stats dict.' % (state_stats_property, state_name))


def validate_params_dict(params):
    """validates params data type

    Args:
        params: dict. Data that needs to be validated.
    """
    if not isinstance(params, dict):
        raise Exception('Excepted dict, received %s' % params)
