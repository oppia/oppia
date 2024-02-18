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

from core import utils
from core.constants import constants
from core.controllers import base
from core.domain import blog_domain
from core.domain import blog_services
from core.domain import change_domain
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import image_validation_services
from core.domain import improvements_domain
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry
from core.domain import question_domain
from core.domain import skill_domain
from core.domain import state_domain
from core.domain import stats_domain

from typing import Dict, Mapping, Optional, Union


def validate_suggestion_change(
    obj: Mapping[str, change_domain.AcceptableChangeDictTypes]
) -> Mapping[str, change_domain.AcceptableChangeDictTypes]:
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


def validate_new_config_property_values(
    new_config_property: Mapping[str, config_domain.AllowedDefaultValueTypes]
) -> Mapping[str, config_domain.AllowedDefaultValueTypes]:
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


def validate_platform_params_values_for_blog_admin(
    new_platform_parameter_values: Mapping[
        str, platform_parameter_domain.PlatformDataTypes]
) -> Mapping[str, platform_parameter_domain.PlatformDataTypes]:
    """Validates new platform parameter values.

    Args:
        new_platform_parameter_values: dict. Data that needs to be validated.

    Returns:
        dict(str, PlatformDataTypes). Returns the dict after validation.

    Raises:
        Exception. The name of the platform parameter is not of type string.
        Exception. The value of the platform parameter is not of valid type.
        Exception. The max_number_of_tags_assigned_to_blog_post platform
            parameter has incoming value less than or equal to 0.
    """
    for name, value in new_platform_parameter_values.items():
        if not isinstance(name, str):
            raise Exception(
                'Platform parameter name should be a string, received'
                ': %s' % name)

        if not isinstance(value, (bool, float, int, str)):
            raise Exception(
                'The value of %s platform parameter is not of valid type, '
                'it should be one of %s.' % (
                    name, str(platform_parameter_domain.PlatformDataTypes))
            )

        parameter = platform_parameter_registry.Registry.get_platform_parameter(
            name)

        if not (
            (isinstance(value, bool) and parameter.data_type == 'bool') or
            (isinstance(value, str) and parameter.data_type == 'string') or
            (isinstance(value, float) and parameter.data_type == 'number') or
            (isinstance(value, int) and parameter.data_type == 'number')
        ):
            raise Exception(
                'The value of platform parameter %s is of type \'%s\', '
                'expected it to be of type \'%s\'' % (
                    name, value, parameter.data_type)
            )

        if (
            name ==
            platform_parameter_list.ParamName.
            MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
        ):
            assert isinstance(value, int)
            if value <= 0:
                raise Exception(
                    'The value of %s should be greater than 0, it is %s.' % (
                        name, value)
                )
    # The new_platform_parameter_values do not represent a domain class directly
    # and in the handler these dict values are used to set platform parameters
    # individually. Hence conversion of dicts to domain objects is not required
    # for new_platform_parameter_values.
    return new_platform_parameter_values


def validate_new_default_value_of_platform_parameter(
    default_value: Mapping[str, platform_parameter_domain.PlatformDataTypes]
) -> Mapping[str, platform_parameter_domain.PlatformDataTypes]:
    """Validates new default value of platform parameter.

    Args:
        default_value: dict. Data that needs to be validated.

    Returns:
        dict(str, PlatformDataTypes). Returns the default value dict after
        validating.

    Raises:
        Exception. The default_value is not of valid type.
    """

    if not isinstance(default_value['value'], (bool, float, int, str)):
        raise Exception('Expected type to be %s but received %s' % (
            platform_parameter_domain.PlatformDataTypes,
            default_value['value'])
        )

    # The default_value values do not represent a domain class directly
    # and in the handler it is used to set the default value of the platform
    # parameter. Hence conversion of dicts to domain objects is not required
    # for default_value.
    return default_value


def validate_change_dict_for_blog_post(
    change_dict: blog_services.BlogPostChangeDict
) -> blog_services.BlogPostChangeDict:
    """Validates change_dict required for updating values of blog post.

    Args:
        change_dict: dict. Data that needs to be validated.

    Returns:
        dict. Returns the change_dict after validation.

    Raises:
        Exception. Invalid tags provided.
    """
    if 'title' in change_dict:
        blog_domain.BlogPost.require_valid_title(
            change_dict['title'], True)
    if 'thumbnail_filename' in change_dict:
        blog_domain.BlogPost.require_valid_thumbnail_filename(
            change_dict['thumbnail_filename'])
    if 'tags' in change_dict:
        blog_domain.BlogPost.require_valid_tags(
            change_dict['tags'], False)
        # Validates that the tags in the change dict are from the list of
        # default tags set by admin.
        list_of_default_tags = constants.LIST_OF_DEFAULT_TAGS_FOR_BLOG_POST
        assert list_of_default_tags is not None
        list_of_default_tags_value = list_of_default_tags
        if not all(
            tag in list_of_default_tags_value for tag in change_dict['tags']
        ):
            raise Exception(
                'Invalid tags provided. Tags not in default tags list.')
    # The method returns a dict containing blog post properties, they are used
    # to update blog posts in the domain layer. This dict does not correspond
    # to any domain class so we are validating the fields of change_dict
    # as a part of schema validation.
    return change_dict


def validate_state_dict(
    state_dict: state_domain.StateDict
) -> state_domain.StateDict:
    """Validates state dict.

    Args:
        state_dict: dict. The dict representation of State object.

    Returns:
        State. The state_dict after validation.
    """
    state_object = state_domain.State.from_dict(state_dict)
    state_object.validate(
        exp_param_specs_dict=None, allow_null_interaction=True)
    # State dict is used as dictionary form in the handler and the data is not
    # transferred into the domain layer. Hence dict form of the data is returned
    # after schema validation.
    return state_dict


def validate_question_state_dict(
    question_state_dict: state_domain.StateDict
) -> state_domain.StateDict:
    """Validates state dict for a question.

    Args:
        question_state_dict: dict. The dict representation of State object for
            a question.

    Returns:
        State. The question_state_dict after validation.
    """
    question_state_object = state_domain.State.from_dict(question_state_dict)
    # 'tagged_skill_misconception_id_required' is not None when a state is part
    # of a Question object that tests a particular skill.
    question_state_object.validate(
        exp_param_specs_dict=None,
        allow_null_interaction=True,
        tagged_skill_misconception_id_required=True)

    return question_state_dict


def validate_email_dashboard_data(
    data: Dict[str, Optional[Union[bool, int]]]
) -> Dict[str, Optional[Union[bool, int]]]:
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


def validate_task_entries(
    task_entries: improvements_domain.TaskEntryDict
) -> improvements_domain.TaskEntryDict:
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


def validate_aggregated_stats(
    aggregated_stats: stats_domain.AggregatedStatsDict
) -> stats_domain.AggregatedStatsDict:
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


def validate_suggestion_images(files: Dict[str, bytes]) -> Dict[str, bytes]:
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


def validate_skill_ids(comma_separated_skill_ids: str) -> str:
    """Checks whether the given skill ids are valid.

    Args:
        comma_separated_skill_ids: str. Comma separated skill IDs.

    Returns:
        str. The comma separated skill ids after validation.
    """
    skill_ids = comma_separated_skill_ids.split(',')
    skill_ids = list(set(skill_ids))
    try:
        for skill_id in skill_ids:
            skill_domain.Skill.require_valid_skill_id(skill_id)
    except utils.ValidationError as e:
        raise base.BaseHandler.InvalidInputException(
            'Invalid skill id') from e

    return comma_separated_skill_ids
