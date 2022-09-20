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
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import image_validation_services
from core.domain import question_domain
from core.domain import state_domain
from core.domain import stats_domain

from typing import Dict, Optional, Union


def validate_suggestion_change(obj):
    """Validates Exploration or Question change.

    Args:
        obj: dict. Data that needs to be validated.

    Returns:
        dict. Returns suggestion change dict after validation.
    """
    # No explicit call to validate_dict is required, because
    # ExplorationChange or QuestionSuggestionChange calls
    # validate method while initialization.
    if obj.get('cmd') is None:
        raise base.BaseHandler.InvalidInputException(
            'Missing cmd key in change dict')

    exp_change_commands = [
        command['name'] for command in
        exp_domain.ExplorationChange.ALLOWED_COMMANDS
    ]
    question_change_commands = [
        command['name'] for command in
        question_domain.QuestionChange.ALLOWED_COMMANDS
    ]

    if obj['cmd'] in exp_change_commands:
        exp_domain.ExplorationChange(obj)
    elif obj['cmd'] in question_change_commands:
        question_domain.QuestionSuggestionChange(obj)
    else:
        raise base.BaseHandler.InvalidInputException(
            '%s cmd is not allowed.' % obj['cmd'])
    return obj


def validate_new_config_property_values(new_config_property):
    """Validates new config property values.

    Args:
        new_config_property: dict. Data that needs to be validated.

    Returns:
        dict(str, *). Returns a dict for new config properties.

    Raises:
        Exception. The config property name is not a string.
        Exception. The value corresponding to config property name
            don't have any schema.
    """
    for (name, value) in new_config_property.items():
        if not isinstance(name, str):
            raise Exception(
                'config property name should be a string, received'
                ': %s' % name)
        config_property = config_domain.Registry.get_config_property(name)
        if config_property is None:
            raise Exception('%s do not have any schema.' % name)

        config_property.normalize(value)
    # The new_config_property values do not represent a domain class directly
    # and in the handler these dict values are used to set config properties
    # individually. Hence conversion of dicts to domain objects is not required
    # for new_config_properties.
    return new_config_property


def validate_change_dict_for_blog_post(change_dict):
    """Validates change_dict required for updating values of blog post.

    Args:
        change_dict: dict. Data that needs to be validated.

    Returns:
        dict. Returns the change_dict after validation.

    Raises:
        Exception. Invalid tags provided.
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
        list_of_default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post').value
        if not all(tag in list_of_default_tags for tag in change_dict['tags']):
            raise Exception(
                'Invalid tags provided. Tags not in default tags list.')
    # The method returns a dict containing blog post properties, they are used
    # to update blog posts in the domain layer. This dict does not correspond
    # to any domain class so we are validating the fields of change_dict
    # as a part of schema validation.
    return change_dict


def validate_state_dict(state_dict):
    """Validates state dict.

    Args:
        state_dict: dict. The dict representation of State object.

    Returns:
        State. The corresponding State domain object.
    """
    state_object = state_domain.State.from_dict(state_dict) # type: ignore[no-untyped-call]
    state_object.validate(
        exp_param_specs_dict=None, allow_null_interaction=True)
    # State dict is used as dictionary form in the handler and the data is not
    # transferred into the domain layer. Hence dict form of the data is returned
    # after schema validation.
    return state_dict


def validate_email_dashboard_data(
        data: Dict[str, Optional[Union[bool, int]]]
) -> None:
    """Validates email dashboard data.

    Args:
        data: dict. Data that needs to be validated.

    Returns:
        dict. Returns the dict after validation.

    Raises:
        Exception. The key in 'data' is not one of the allowed keys.
    """
    predicates = constants.EMAIL_DASHBOARD_PREDICATE_DEFINITION
    possible_keys = [predicate['backend_attr'] for predicate in predicates]

    for key, value in data.items():
        if value is None:
            continue
        if key not in possible_keys:
            # Raise exception if key is not one of the allowed keys.
            raise Exception('400 Invalid input for query.')
    # The method returns a dict containing fields of email dashboard
    # query params. This dict represents the UserQueryParams class, which is a
    # namedtuple. Hence the fields of the dict are being validated as a part of
    # schema validation before saving new user queries in the handler.
    return data


def validate_task_entries(task_entries):
    """Validates the task entry dict.

    Args:
        task_entries: dict. Data that needs to be validated.

    Returns:
        dict. Returns the task entries dict after validation.
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
    # For creating the TaskEntry domain object, we have to include the
    # exploration_id and the user_id which are not included in the
    # task_entry_dict. Thus, it is not possible to create the full
    # domain object at the payload validation stage. Hence, the key-value pairs
    # of task_entry_dict are being validated as a part of schema validation.
    return task_entries


def validate_aggregated_stats(aggregated_stats):
    """Validates the attribute stats dict.

    Args:
        aggregated_stats: dict. Data that needs to be validated.

    Returns:
        dict. Data after validation.

    Raises:
        InvalidInputException. Property not in aggregated stats dict.
    """
    return stats_domain.SessionStateStats.validate_aggregated_stats_dict(
        aggregated_stats)


def validate_suggestion_images(files):
    """Validates the files dict.

    Args:
        files: dict. Data that needs to be validated.

    Returns:
        dict. Returns the dict after validation.
    """
    for filename, raw_image in files.items():
        image_validation_services.validate_image_and_filename(
            raw_image, filename)
    # The files argument do not represent any domain class, hence dict form
    # of the data is returned from here.
    return files


def validate_exploration_change(exp_change_dict):
    """Validate the exploration change list

    Args:
        exp_change_dict: dict. The exploration change dictionary
            that needs to be validated.

    Returns:
        exp_domain.ExplorationChange. The exploration change domain
        object.
    """
    if exp_change_dict.get('cmd') is None:
        raise base.BaseHandler.InvalidInputException(
            'Missing cmd key in change dict')
    exp_change_commands = [
        command['name'] for command in
        exp_domain.ExplorationChange.ALLOWED_COMMANDS
    ]
    if exp_change_dict['cmd'] not in exp_change_commands:
        raise base.BaseHandler.InvalidInputException(
            'The cmd key does not belong to exploration.'
        )

    # Validate state properties.
    if exp_change_dict['cmd'] == exp_domain.CMD_EDIT_STATE_PROPERTY:
        if (
            exp_change_dict['property_name'] ==
            exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS
        ):
            answer_groups = exp_change_dict['new_value']
            for answer_group in answer_groups:
                if answer_group['tagged_skill_misconception_id'] is not None:
                    raise base.BaseHandler.InvalidInputException(
                        'tagged_skill_misconception_id of the answer '
                        'group should be None.'
                    )
                if len(answer_group['rule_specs']) == 0:
                    raise base.BaseHandler.InvalidInputException(
                        'The answer group should contain atleast one rule spec.'
                    )
                if answer_group['outcome']['dest'] == '':
                    raise base.BaseHandler.InvalidInputException(
                        'The destination for the answer group is not valid.'
                    )
                if (
                    answer_group['outcome']['labelled_as_correct'] is True and
                    answer_group['outcome']['dest'] == exp_change_dict[
                        'state_name']
                ):
                    raise base.BaseHandler.InvalidInputException(
                        'The outcome labelled_as_correct should not be True if '
                        'the destination is state itself.'
                    )
                if answer_group['outcome'][
                    'refresher_exploration_id'] is not None:
                    raise base.BaseHandler.InvalidInputException(
                        'The refresher exploration id of the answer group '
                        'outcome should be None.'
                    )
        elif (
            exp_change_dict['property_name'] ==
            exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME and
            exp_change_dict['new_value'] is not None
        ):
            default_outcome = exp_change_dict['new_value']
            if default_outcome['dest'] == '':
                raise base.BaseHandler.InvalidInputException(
                    'The destination for the default outcome is not valid.'
                )
    return exp_domain.ExplorationChange.from_dict(exp_change_dict)
